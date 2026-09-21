begin;

create extension if not exists pgtap with schema extensions;
select plan(33);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
) values
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-0000000004a1', 'authenticated', 'authenticated', 'admin4@example.test', '', now(), '{}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-0000000004d1', 'authenticated', 'authenticated', 'dealer4@example.test', '', now(), '{}', '{}', now(), now(), '', '', '', '');

insert into public.staff_memberships (user_id, role)
values ('00000000-0000-0000-0000-0000000004a1', 'admin');

insert into public.companies (
  id, legal_name, kvk_number, street, house_number, postal_code, city,
  contact_name, email, phone, status
) values (
  '10000000-0000-0000-0000-0000000004d1', 'Fase Vier Motors', '40000001',
  'Testlaan', '4', '1234AB', 'Testdam', 'Dealer Vier', 'dealer4@example.test', '0612345678', 'approved'
);

insert into public.company_memberships (company_id, user_id, role)
values ('10000000-0000-0000-0000-0000000004d1', '00000000-0000-0000-0000-0000000004d1', 'owner');

insert into public.seller_contacts (id, full_name, email, phone, postal_code)
values ('20000000-0000-0000-0000-000000000401', 'Fictieve Verkoper', 'verkoper4@example.test', '0699999999', '9999ZZ');
insert into public.vehicles (id, registration_normalized, make, model, year, vehicle_type)
values ('30000000-0000-0000-0000-000000000401', '44TEST', 'TESTMERK', 'MODEL 4', 2021, 'Personenauto');
insert into public.applications (id, seller_contact_id, vehicle_id, status, submitted_at)
values ('40000000-0000-0000-0000-000000000401', '20000000-0000-0000-0000-000000000401', '30000000-0000-0000-0000-000000000401', 'ready', now());
insert into public.condition_reports (application_id, mileage_km, key_count, damage_description, technical_issues, maintenance_description, remarks)
values ('40000000-0000-0000-0000-000000000401', 80000, 2, 'Geen', 'Geen', 'Onderhouden', 'Test');
insert into public.vehicle_photos (id, application_id, storage_path, media_type, size_bytes, sha256, sort_order, review_status, metadata_removed_at)
values ('50000000-0000-0000-0000-000000000401', '40000000-0000-0000-0000-000000000401', 'applications/phase4/0.jpg', 'image/jpeg', 1000, repeat('d', 64), 0, 'approved', now());

create temporary table phase4_state (listing_id uuid, round_id uuid, revision_id uuid, bid_id uuid);
grant all on table phase4_state to authenticated;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000004a1","role":"authenticated","aal":"aal2"}', true);
insert into phase4_state (listing_id, round_id, revision_id)
select (result->>'listing_id')::uuid, (result->>'bid_round_id')::uuid, (result->>'vehicle_revision_id')::uuid
from (select public.admin_publish_application(
  '40000000-0000-0000-0000-000000000401', now() - interval '1 minute', now() + interval '1 hour'
) result) published;
select ok((select revision_id is not null from phase4_state), 'uitgangssituatie heeft een gepubliceerde voertuigversie');
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000004d1","role":"authenticated","aal":"aal1"}', true);
update phase4_state
set bid_id = (public.place_bid(round_id, 1250000, '70000000-0000-0000-0000-000000000401')->>'bid_id')::uuid;
select ok((select bid_id is not null from phase4_state), 'dealer heeft een geldig bod geplaatst');
select throws_ok(
  $$ select public.admin_add_contact_event('40000000-0000-0000-0000-000000000401', 'phone', 'Onbevoegd', now()) $$,
  'P0001', 'staff_aal2_required',
  'dealer kan geen contactmoment toevoegen'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000004a1","role":"authenticated","aal":"aal1"}', true);
select throws_ok(
  $$ select public.admin_add_contact_event('40000000-0000-0000-0000-000000000401', 'phone', 'Zonder MFA', now()) $$,
  'P0001', 'staff_aal2_required',
  'beheer zonder MFA kan geen contactmoment toevoegen'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000004a1","role":"authenticated","aal":"aal2"}', true);
select lives_ok(
  $$ select public.admin_add_contact_event('40000000-0000-0000-0000-000000000401', 'phone', 'Particulier gesproken over het bod.', now()) $$,
  'beheer kan een contactmoment toevoegen'
);
select results_eq($$ select count(*)::bigint from public.contact_events where application_id = '40000000-0000-0000-0000-000000000401' $$, $$ values (1::bigint) $$, 'contactmoment is opgeslagen');
select results_eq($$ select count(*)::bigint from public.audit_log where action = 'contact.recorded' and after_data->>'application_id' = '40000000-0000-0000-0000-000000000401' $$, $$ values (1::bigint) $$, 'contactmoment is herleidbaar');
select throws_ok(
  $$ select public.admin_add_contact_event('40000000-0000-0000-0000-000000000401', 'phone', 'Toekomst', now() + interval '1 day') $$,
  'P0001', 'invalid_contact_time',
  'een ongeldige toekomstige contacttijd wordt geweigerd'
);
select is(public.get_admin_case_state('40000000-0000-0000-0000-000000000401')#>>'{deal,status}', 'not_started', 'afhandeling start los van de biedronde');
select throws_ok(
  $$ select public.admin_update_deal_case('40000000-0000-0000-0000-000000000401', 'agreed', (select bid_id from phase4_state)) $$,
  'P0001', 'invalid_deal_transition',
  'beheer kan stappen in de afhandeling niet overslaan'
);
select lives_ok($$ select public.admin_update_deal_case('40000000-0000-0000-0000-000000000401', 'discussing', null) $$, 'bespreking kan worden gestart');
select throws_ok(
  $$ select public.admin_update_deal_case('40000000-0000-0000-0000-000000000401', 'agreement_pending', null) $$,
  'P0001', 'selected_bid_required',
  'akkoord in behandeling vereist een bewust gekozen bod'
);
select lives_ok(
  $$ select public.admin_update_deal_case('40000000-0000-0000-0000-000000000401', 'agreement_pending', (select bid_id from phase4_state)) $$,
  'beheer kan handmatig een bod voor akkoord selecteren'
);
select lives_ok($$ select public.admin_update_deal_case('40000000-0000-0000-0000-000000000401', 'agreed', null) $$, 'akkoord kan worden geregistreerd');
select lives_ok($$ select public.admin_update_deal_case('40000000-0000-0000-0000-000000000401', 'completed', null) $$, 'afhandeling kan worden voltooid');
select results_eq($$ select status::text from public.deal_cases where application_id = '40000000-0000-0000-0000-000000000401' $$, $$ values ('completed'::text) $$, 'verkoopstatus staat op afgehandeld');
select results_eq($$ select count(*)::bigint from public.audit_log where action = 'deal.status_changed' and after_data->>'application_id' = '40000000-0000-0000-0000-000000000401' $$, $$ values (4::bigint) $$, 'alle afhandelingsstappen staan in de auditlog');
select throws_ok(
  $$ select public.admin_update_deal_case('40000000-0000-0000-0000-000000000401', 'completed', '70000000-0000-0000-0000-000000000499') $$,
  'P0001', 'deal_case_terminal',
  'een terminale afhandeling kan niet via een rechtstreeks verzoek worden aangepast'
);

select lives_ok(
  $$ select public.admin_record_material_change(
    '40000000-0000-0000-0000-000000000401',
    (select revision_id from phase4_state),
    80500, 'Nieuwe kleine kras', 'Geen', 'Onderhouden', 2, 'Na controle gewijzigd',
    'Kilometerstand en schade zijn opnieuw gecontroleerd.'
  ) $$,
  'materiële wijziging wordt gecontroleerd geregistreerd'
);
select results_eq($$ select status::text from public.listings where id = (select listing_id from phase4_state) $$, $$ values ('withdrawn'::text) $$, 'oude publicatie wordt ingetrokken');
select results_eq($$ select status::text from public.bid_rounds where id = (select round_id from phase4_state) $$, $$ values ('cancelled'::text) $$, 'oude biedronde wordt geannuleerd');
select results_eq($$ select count(*)::bigint from public.bids where bid_round_id = (select round_id from phase4_state limit 1) $$, $$ values (1::bigint) $$, 'bestaand bod blijft ongewijzigd bewaard');
select results_eq(
  $$ select (snapshot#>>'{condition,mileageKm}')::integer from public.vehicle_revisions where id = (select revision_id from phase4_state) $$,
  $$ values (80000) $$,
  'oude voertuigversie blijft onveranderlijk'
);
select results_eq($$ select count(*)::bigint from public.audit_log where entity_id = '40000000-0000-0000-0000-000000000401' and action = 'vehicle.material_change_recorded' $$, $$ values (1::bigint) $$, 'materiële wijziging staat in de auditlog');

insert into phase4_state (listing_id, round_id, revision_id)
select (result->>'listing_id')::uuid, (result->>'bid_round_id')::uuid, (result->>'vehicle_revision_id')::uuid
from (select public.admin_publish_application(
  '40000000-0000-0000-0000-000000000401', now() - interval '1 minute', now() + interval '2 hours'
) result) republished;
select results_eq($$ select count(*)::bigint from public.vehicle_revisions where vehicle_id = '30000000-0000-0000-0000-000000000401' $$, $$ values (2::bigint) $$, 'opnieuw publiceren maakt een nieuwe voertuigversie');
select results_eq($$ select count(*)::bigint from public.listings where application_id = '40000000-0000-0000-0000-000000000401' and status = 'published' $$, $$ values (1::bigint) $$, 'alleen de nieuwe publicatie staat actief');
select results_eq(
  $$ select (snapshot#>>'{condition,mileageKm}')::integer from public.vehicle_revisions where vehicle_id = '30000000-0000-0000-0000-000000000401' order by revision_number desc limit 1 $$,
  $$ values (80500) $$,
  'nieuwe versie bevat de gewijzigde gegevens'
);
select throws_ok(
  $$ select public.admin_record_material_change(
    '40000000-0000-0000-0000-000000000401',
    (select id from public.vehicle_revisions where revision_number = 2),
    80600, repeat('x', 4001), 'Geen', 'Onderhouden', 2, 'Nogmaals',
    'Deze tekst is bewust te lang voor rechtstreekse invoer.'
  ) $$,
  'P0001', 'invalid_material_text',
  'rechtstreekse RPC-invoer kan de tekstlimiet niet omzeilen'
);
select throws_ok(
  $$ select public.admin_record_material_change(
    '40000000-0000-0000-0000-000000000401',
    (select id from public.vehicle_revisions where revision_number = 1),
    80600, 'Nieuwe kleine kras', 'Geen', 'Onderhouden', 2, 'Nogmaals',
    'Deze wijziging gebruikt bewust een verouderde versie.'
  ) $$,
  'P0001', 'stale_vehicle_revision',
  'een wijziging vanaf een verouderde versie wordt geweigerd'
);
select results_eq($$ select jsonb_array_length(public.get_admin_case_state('40000000-0000-0000-0000-000000000401')->'revisions') $$, $$ values (2) $$, 'beheer ziet de volledige versiehistorie');
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000004d1","role":"authenticated","aal":"aal1"}', true);
select results_eq($$ select count(*)::bigint from public.deal_cases $$, $$ values (0::bigint) $$, 'dealer kan afhandeling niet rechtstreeks lezen');
select results_eq($$ select count(*)::bigint from public.contact_events $$, $$ values (0::bigint) $$, 'dealer kan contactmomenten niet rechtstreeks lezen');
select throws_ok(
  $$ select public.get_admin_case_state('40000000-0000-0000-0000-000000000401') $$,
  'P0001', 'staff_aal2_required',
  'dealer kan de beheerworkflowfunctie niet aanroepen'
);
reset role;

select * from finish();
rollback;
