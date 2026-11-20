begin;

create extension if not exists pgtap with schema extensions;
select plan(23);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
) values (
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-0000000000f1',
  'authenticated', 'authenticated', 'phase2-admin@example.test', '', now(), '{}', '{}', now(), now(), '', '', '', ''
);

insert into public.staff_memberships (user_id, role)
values ('00000000-0000-0000-0000-0000000000f1', 'admin');

create temporary table phase2_state (draft_result jsonb, final_result jsonb);
grant all on table phase2_state to service_role, authenticated;

set local role service_role;
select set_config('request.jwt.claims', '{"role":"service_role"}', true);
select public.record_public_form_start('80000000-0000-0000-0000-000000000001');
insert into phase2_state (draft_result)
select public.create_public_application_draft(
  repeat('a', 64),
  '80000000-0000-0000-0000-000000000001',
  repeat('b', 64),
  1
);
reset role;

select ok(
  (select (draft_result->>'draft_id')::uuid is not null from phase2_state),
  'servicefunctie maakt een tijdelijk aanvraagconcept'
);

set local role service_role;
select set_config('request.jwt.claims', '{"role":"service_role"}', true);
select results_eq(
  $$ select (public.create_public_application_draft(repeat('a', 64), '80000000-0000-0000-0000-000000000001', repeat('b', 64), 1)->>'draft_id')::uuid $$,
  $$ select (draft_result->>'draft_id')::uuid from phase2_state $$,
  'dezelfde idempotentiesleutel geeft hetzelfde concept'
);
reset role;

select results_eq(
  $$ select count(*)::bigint from private.product_events where event_name = 'application_form_started' and event_key = '80000000-0000-0000-0000-000000000001' $$,
  $$ values (1::bigint) $$,
  'formulierstart wordt eenmaal en zonder formulierinhoud gemeten'
);

set local role service_role;
select set_config('request.jwt.claims', '{"role":"service_role"}', true);
update phase2_state set final_result = public.finalize_public_application(
  (draft_result->>'draft_id')::uuid,
  repeat('a', 64),
  repeat('b', 64),
  $$
  {
    "vehicle": {"registration":"12AB34","make":"VOLVO","model":"V60","variant":"","year":2020,"fuelType":"Benzine","color":"Blauw","rdwSourceData":null,"rdwFetchedAt":null},
    "condition": {"mileageKm":85000,"damageDescription":"Geen","technicalIssues":"Geen","maintenanceDescription":"Onderhouden","keyCount":2,"remarks":""},
    "seller": {"fullName":"Test Verkoper","email":"verkoper@example.test","phone":"0612345678","postalCode":"1234AB","desiredSaleDate":""}
  }
  $$::jsonb,
  jsonb_build_array(jsonb_build_object(
    'storage_path', 'applications/' || (draft_result->>'draft_id') || '/0-' || repeat('c', 64) || '.jpg',
    'media_type', 'image/jpeg',
    'size_bytes', 1024,
    'sha256', repeat('c', 64),
    'sort_order', 0
  ))
);
reset role;

select matches(
  (select final_result->>'reference' from phase2_state),
  '^[0-9a-f]{24}$',
  'definitieve aanvraag krijgt een onvoorspelbare referentie'
);
select results_eq(
  $$ select count(*)::bigint from public.applications where id = (select (final_result->>'application_id')::uuid from phase2_state) $$,
  $$ values (1::bigint) $$,
  'aanvraag wordt precies eenmaal opgeslagen'
);
select results_eq(
  $$ select count(*)::bigint from public.vehicle_photos where application_id = (select (final_result->>'application_id')::uuid from phase2_state) and metadata_removed_at is not null and review_status = 'pending' $$,
  $$ values (1::bigint) $$,
  'gecontroleerde foto start in afwachting van beheerreview'
);
select results_eq(
  $$ select count(*)::bigint from public.notification_outbox where entity_id = (select (final_result->>'application_id')::uuid from phase2_state) and event_type = 'application.received' and status = 'pending' $$,
  $$ values (1::bigint) $$,
  'bevestigingsmail staat duurzaam in de outbox'
);
select results_eq(
  $$ select count(*)::bigint from private.product_events where event_name = 'application_completed' and event_key = '80000000-0000-0000-0000-000000000001' $$,
  $$ values (1::bigint) $$,
  'afgeronde aanvraag wordt zonder formulierinhoud gemeten'
);

set local role service_role;
select set_config('request.jwt.claims', '{"role":"service_role"}', true);
select results_eq(
  $$ select (public.finalize_public_application((draft_result->>'draft_id')::uuid, repeat('a', 64), repeat('b', 64), '{}'::jsonb, '[]'::jsonb)->>'application_id')::uuid from phase2_state $$,
  $$ select (final_result->>'application_id')::uuid from phase2_state $$,
  'opnieuw afronden retourneert dezelfde aanvraag'
);
reset role;

set local role service_role;
select set_config('request.jwt.claims', '{"role":"service_role"}', true);
select results_eq(
  $$ select public.consume_public_rate_limit(repeat('d', 64), 'rdw_lookup', 1) $$,
  $$ values (true) $$,
  'eerste verzoek binnen de limiet wordt toegestaan'
);
select results_eq(
  $$ select public.consume_public_rate_limit(repeat('d', 64), 'rdw_lookup', 1) $$,
  $$ values (false) $$,
  'verzoek boven de databaselimiet wordt geweigerd'
);
reset role;

set local role anon;
select throws_ok(
  $$ select count(*)::bigint from public.applications $$,
  '42501', null,
  'anonieme Data API-aanroep krijgt geen tabeltoegang tot aanvragen'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000f1","role":"authenticated","aal":"aal1"}', true);
select throws_ok(
  $$ select public.consume_public_rate_limit(repeat('e', 64), 'rdw_lookup', 100) $$,
  '42501', null,
  'browserrol kan de rate-limitfunctie niet rechtstreeks aanroepen'
);
select results_eq(
  $$ select count(*)::bigint from jsonb_array_elements(public.list_admin_applications()) item where (item->>'id')::uuid = (select (final_result->>'application_id')::uuid from phase2_state) $$,
  $$ values (1::bigint) $$,
  'beheer met alleen wachtwoord kan de aanvraag ophalen'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000f1","role":"authenticated","aal":"aal2"}', true);
select results_eq(
  $$ select count(*)::bigint from jsonb_array_elements(public.list_admin_applications()) item where (item->>'id')::uuid = (select (final_result->>'application_id')::uuid from phase2_state) $$,
  $$ values (1::bigint) $$,
  'beheer ziet de aanvraag'
);
select lives_ok(
  $$ select public.admin_update_application_status((select (final_result->>'application_id')::uuid from phase2_state), 'in_review') $$,
  'beheer kan een toegestane statusovergang uitvoeren'
);
select results_eq(
  $$ select status::text from public.applications where id = (select (final_result->>'application_id')::uuid from phase2_state) $$,
  $$ values ('in_review'::text) $$,
  'nieuwe aanvraagstatus is opgeslagen'
);
select results_eq(
  $$ select count(*)::bigint from public.audit_log where entity_id = (select (final_result->>'application_id')::uuid from phase2_state) and action = 'application.status_changed' $$,
  $$ values (1::bigint) $$,
  'statuswijziging is herleidbaar in de auditlog'
);
select throws_ok(
  $$ select public.admin_update_application_status((select (final_result->>'application_id')::uuid from phase2_state), 'submitted') $$,
  'P0001', 'invalid_status_transition',
  'ongeldige terugwaartse statusovergang wordt geweigerd'
);
select lives_ok(
  $$ select public.admin_add_internal_note((select (final_result->>'application_id')::uuid from phase2_state), 'Interne testnotitie') $$,
  'beheer kan een interne notitie toevoegen'
);
select results_eq(
  $$ select count(*)::bigint from public.internal_notes where body = 'Interne testnotitie' $$,
  $$ values (1::bigint) $$,
  'interne notitie is opgeslagen'
);
select lives_ok(
  $$ select public.admin_set_photo_review((select id from public.vehicle_photos where application_id = (select (final_result->>'application_id')::uuid from phase2_state)), 'approved') $$,
  'beheer kan een foto goedkeuren'
);
select results_eq(
  $$ select review_status::text from public.vehicle_photos where application_id = (select (final_result->>'application_id')::uuid from phase2_state) $$,
  $$ values ('approved'::text) $$,
  'fotoreviewstatus is opgeslagen'
);
reset role;

select * from finish();
rollback;
