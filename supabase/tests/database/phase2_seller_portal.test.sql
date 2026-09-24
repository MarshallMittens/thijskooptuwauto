begin;

create extension if not exists pgtap with schema extensions;
select plan(21);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
) values
  ('00000000-0000-0000-0000-000000000000', '02000000-0000-0000-0000-0000000000a1', 'authenticated', 'authenticated', 'seller-one@example.test', '', now(), '{}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '02000000-0000-0000-0000-0000000000a2', 'authenticated', 'authenticated', 'seller-two@example.test', '', now(), '{}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '02000000-0000-0000-0000-0000000000b1', 'authenticated', 'authenticated', 'seller-dealer@example.test', '', now(), '{}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '02000000-0000-0000-0000-0000000000c1', 'authenticated', 'authenticated', 'seller-admin@example.test', '', now(), '{}', '{}', now(), now(), '', '', '', '');

insert into public.staff_memberships (user_id, role)
values ('02000000-0000-0000-0000-0000000000c1', 'admin');
insert into public.companies (
  id, legal_name, kvk_number, street, house_number, postal_code, city,
  contact_name, email, phone, status
) values (
  '12000000-0000-0000-0000-0000000000b1', 'Seller Dealer BV', '62000001',
  'Testweg', '2', '1234AB', 'Testdam', 'Dealer', 'seller-dealer@example.test', '0612345678', 'approved'
);
insert into public.company_memberships (company_id, user_id, role)
values ('12000000-0000-0000-0000-0000000000b1', '02000000-0000-0000-0000-0000000000b1', 'owner');

insert into public.seller_contacts (id, full_name, email, phone, postal_code) values
  ('22000000-0000-0000-0000-000000000001', 'Verkoper Een', 'seller-one@example.test', '0611111111', '1234AB'),
  ('22000000-0000-0000-0000-000000000002', 'Verkoper Twee', 'seller-two@example.test', '0622222222', '1234AB'),
  ('22000000-0000-0000-0000-000000000003', 'Dealer Persoon', 'seller-dealer@example.test', '0633333333', '1234AB'),
  ('22000000-0000-0000-0000-000000000004', 'Admin Persoon', 'seller-admin@example.test', '0644444444', '1234AB');
insert into public.vehicles (id, registration_normalized, make, model) values
  ('32000000-0000-0000-0000-000000000001', 'SE11ER', 'TEST', 'EEN'),
  ('32000000-0000-0000-0000-000000000002', 'SE22ER', 'TEST', 'TWEE'),
  ('32000000-0000-0000-0000-000000000003', 'SE33ER', 'TEST', 'DRIE'),
  ('32000000-0000-0000-0000-000000000004', 'SE44ER', 'TEST', 'VIER');
insert into public.applications (id, public_reference, seller_contact_id, vehicle_id, status, submitted_at) values
  ('42000000-0000-0000-0000-000000000001', 'aaaaaaaaaaaaaaaaaaaaaaaa', '22000000-0000-0000-0000-000000000001', '32000000-0000-0000-0000-000000000001', 'submitted', now()),
  ('42000000-0000-0000-0000-000000000002', 'bbbbbbbbbbbbbbbbbbbbbbbb', '22000000-0000-0000-0000-000000000002', '32000000-0000-0000-0000-000000000002', 'ready', now()),
  ('42000000-0000-0000-0000-000000000003', 'cccccccccccccccccccccccc', '22000000-0000-0000-0000-000000000003', '32000000-0000-0000-0000-000000000003', 'submitted', now()),
  ('42000000-0000-0000-0000-000000000004', 'dddddddddddddddddddddddd', '22000000-0000-0000-0000-000000000004', '32000000-0000-0000-0000-000000000004', 'submitted', now());
insert into public.condition_reports (application_id, mileage_km, key_count) values
  ('42000000-0000-0000-0000-000000000001', 100000, 2),
  ('42000000-0000-0000-0000-000000000002', 200000, 1),
  ('42000000-0000-0000-0000-000000000003', 300000, 1),
  ('42000000-0000-0000-0000-000000000004', 400000, 1);
insert into public.vehicle_revisions (id, vehicle_id, revision_number, snapshot)
values ('52000000-0000-0000-0000-000000000002', '32000000-0000-0000-0000-000000000002', 1, '{}');

set local role anon;
select throws_ok(
  $$ select public.prepare_seller_access('aaaaaaaaaaaaaaaaaaaaaaaa', 'seller-one@example.test', repeat('a', 64)) $$,
  '42501', null,
  'browserrol kan toegangsvraag niet rechtstreeks omzeilen'
);
reset role;

set local role service_role;
select set_config('request.jwt.claims', '{"role":"service_role"}', true);
select is(
  public.prepare_seller_access('aaaaaaaaaaaaaaaaaaaaaaaa', 'seller-one@example.test', repeat('a', 64)),
  true,
  'juiste referentie en e-mail mogen een magic link voorbereiden'
);
select is(
  public.prepare_seller_access('aaaaaaaaaaaaaaaaaaaaaaaa', 'fout@example.test', repeat('a', 64)),
  false,
  'verkeerd e-mailadres krijgt geen toegangsmachtiging'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"02000000-0000-0000-0000-0000000000a1","role":"authenticated","aal":"aal1"}', true);
select throws_ok(
  $$ select public.claim_seller_application('bbbbbbbbbbbbbbbbbbbbbbbb') $$,
  'P0001', 'application_access_denied',
  'geverifieerde gebruiker kan dossier van een ander niet claimen'
);
select lives_ok(
  $$ select public.claim_seller_application('aaaaaaaaaaaaaaaaaaaaaaaa') $$,
  'geverifieerde verkoper kan het eigen dossier claimen'
);
reset role;
select results_eq(
  $$ select count(*)::bigint from public.seller_application_access where application_id = '42000000-0000-0000-0000-000000000001' $$,
  $$ values (1::bigint) $$,
  'dossier krijgt precies één geverifieerde eigenaar'
);
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"02000000-0000-0000-0000-0000000000a1","role":"authenticated","aal":"aal1"}', true);
select lives_ok(
  $$ select public.claim_seller_application('aaaaaaaaaaaaaaaaaaaaaaaa') $$,
  'dezelfde magic-linkkoppeling is idempotent'
);
reset role;
select results_eq(
  $$ select count(*)::bigint from public.audit_log where entity_id = '42000000-0000-0000-0000-000000000001' and action = 'seller.contact_verified' $$,
  $$ values (1::bigint) $$,
  'contactverificatie krijgt één auditregel'
);
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"02000000-0000-0000-0000-0000000000a1","role":"authenticated","aal":"aal1"}', true);
select results_eq(
  $$ select count(*)::bigint from jsonb_array_elements(public.list_my_seller_applications()) item where item->>'reference' = 'aaaaaaaaaaaaaaaaaaaaaaaa' $$,
  $$ values (1::bigint) $$,
  'verkoper ziet het eigen dossier'
);
select throws_ok(
  $$ select public.seller_update_application('42000000-0000-0000-0000-000000000001', 101000, 'Kras', '', 'Onderhouden', 2, '', null) $$,
  'P0001', 'seller_update_not_allowed',
  'verkoper kan niet buiten een aanvullingsverzoek wijzigen'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"02000000-0000-0000-0000-0000000000a2","role":"authenticated","aal":"aal1"}', true);
select results_eq(
  $$ select count(*)::bigint from jsonb_array_elements(public.list_my_seller_applications()) $$,
  $$ values (0::bigint) $$,
  'andere verkoper ziet geen dossiers'
);
select throws_ok(
  $$ select count(*)::bigint from public.seller_application_access $$,
  '42501', null,
  'rechtstreekse tabeltoegang tot dossierkoppelingen is geweigerd'
);
select throws_ok(
  $$ select public.seller_update_application('42000000-0000-0000-0000-000000000001', 101000, '', '', '', 2, '', null) $$,
  'P0001', 'application_access_denied',
  'andere verkoper kan geen aanvulling opslaan'
);
reset role;

update public.applications set status = 'needs_information' where id = '42000000-0000-0000-0000-000000000001';
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"02000000-0000-0000-0000-0000000000a1","role":"authenticated","aal":"aal1"}', true);
select lives_ok(
  $$ select public.seller_update_application('42000000-0000-0000-0000-000000000001', 101000, 'Kras', '', 'Onderhouden', 2, 'Aangevuld', '2026-10-01') $$,
  'eigen verkoper kan gevraagde informatie aanvullen'
);
reset role;
select results_eq(
  $$ select status::text from public.applications where id = '42000000-0000-0000-0000-000000000001' $$,
  $$ values ('in_review'::text) $$,
  'aanvulling zet dossier terug in controle'
);
select results_eq(
  $$ select count(*)::bigint from public.audit_log where entity_id = '42000000-0000-0000-0000-000000000001' and action = 'seller.information_updated' and not (after_data::text like '%Kras%') $$,
  $$ values (1::bigint) $$,
  'auditlog bevat de wijziging maar geen vrije invoertekst'
);

select throws_ok(
  $$ insert into public.listings (application_id, vehicle_revision_id, status) values ('42000000-0000-0000-0000-000000000002', '52000000-0000-0000-0000-000000000002', 'published') $$,
  'P0001', 'seller_verification_required',
  'ongeverifieerde aanvraag kan niet worden gepubliceerd'
);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"02000000-0000-0000-0000-0000000000c1","role":"authenticated","aal":"aal2"}', true);
select is(
  (public.get_admin_seller_verification('42000000-0000-0000-0000-000000000001')->>'verified')::boolean,
  true,
  'beheer ziet aantoonbaar dat de verkoper is geverifieerd'
);
select throws_ok(
  $$ select public.claim_seller_application('dddddddddddddddddddddddd') $$,
  'P0001', 'seller_privileged_identity_conflict',
  'beheeridentiteit kan geen verkopersdossier claimen'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"02000000-0000-0000-0000-0000000000b1","role":"authenticated","aal":"aal2"}', true);
select throws_ok(
  $$ select public.claim_seller_application('cccccccccccccccccccccccc') $$,
  'P0001', 'seller_privileged_identity_conflict',
  'dealeridentiteit kan geen verkopersdossier claimen'
);
reset role;

select throws_ok(
  $$ insert into public.company_memberships (company_id, user_id, role) values ('12000000-0000-0000-0000-0000000000b1', '02000000-0000-0000-0000-0000000000a1', 'member') $$,
  'P0001', 'seller_dealer_identity_conflict',
  'geverifieerde verkoper kan niet stilzwijgend dealer worden'
);

select * from finish();
rollback;
