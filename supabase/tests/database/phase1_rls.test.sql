begin;

create extension if not exists pgtap with schema extensions;
select plan(16);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
) values
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-0000000000a1', 'authenticated', 'authenticated', 'admin@example.test', '', now(), '{}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-0000000000b1', 'authenticated', 'authenticated', 'pending@example.test', '', now(), '{}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-0000000000c1', 'authenticated', 'authenticated', 'approved@example.test', '', now(), '{}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-0000000000d1', 'authenticated', 'authenticated', 'other@example.test', '', now(), '{}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-0000000000e1', 'authenticated', 'authenticated', 'removed@example.test', '', now(), '{}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-0000000000f1', 'authenticated', 'authenticated', 'verkoper1@example.test', '', now(), '{}', '{}', now(), now(), '', '', '', '');

insert into public.staff_memberships (user_id, role)
values ('00000000-0000-0000-0000-0000000000a1', 'admin');

insert into public.companies (
  id, legal_name, kvk_number, street, house_number, postal_code, city,
  contact_name, email, phone, status
) values
  ('10000000-0000-0000-0000-0000000000b1', 'Pending Motors', '10000001', 'Teststraat', '1', '1234AB', 'Testdam', 'P. Ending', 'pending@example.test', '0611111111', 'pending'),
  ('10000000-0000-0000-0000-0000000000c1', 'Goedgekeurd Auto', '10000002', 'Teststraat', '2', '1234AB', 'Testdam', 'G. Keurd', 'approved@example.test', '0622222222', 'approved'),
  ('10000000-0000-0000-0000-0000000000d1', 'Ander Bedrijf', '10000003', 'Teststraat', '3', '1234AB', 'Testdam', 'A. Nder', 'other@example.test', '0633333333', 'approved'),
  ('10000000-0000-0000-0000-0000000000e1', 'Voormalig Bedrijf', '10000004', 'Teststraat', '4', '1234AB', 'Testdam', 'V. Oormalig', 'removed@example.test', '0644444444', 'approved');

insert into public.company_memberships (company_id, user_id, role, status) values
  ('10000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000b1', 'owner', 'active'),
  ('10000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000c1', 'owner', 'active'),
  ('10000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000d1', 'owner', 'active'),
  ('10000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-0000000000e1', 'owner', 'removed');

insert into public.seller_contacts (id, full_name, email, phone, postal_code) values
  ('20000000-0000-0000-0000-0000000000a1', 'Testverkoper Een', 'verkoper1@example.test', '0612345678', '1234AB'),
  ('20000000-0000-0000-0000-0000000000a2', 'Testverkoper Twee', 'verkoper2@example.test', '0687654321', '1234AB');

insert into public.vehicles (id, registration_normalized, make, model) values
  ('30000000-0000-0000-0000-0000000000a1', 'AA11BB', 'Testmerk', 'Gepubliceerd'),
  ('30000000-0000-0000-0000-0000000000a2', 'CC22DD', 'Testmerk', 'Concept');

insert into public.applications (id, seller_contact_id, vehicle_id, status) values
  ('40000000-0000-0000-0000-0000000000a1', '20000000-0000-0000-0000-0000000000a1', '30000000-0000-0000-0000-0000000000a1', 'ready'),
  ('40000000-0000-0000-0000-0000000000a2', '20000000-0000-0000-0000-0000000000a2', '30000000-0000-0000-0000-0000000000a2', 'ready');

insert into public.seller_application_access (application_id, user_id)
values ('40000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000f1');

insert into public.vehicle_revisions (id, vehicle_id, revision_number, snapshot) values
  ('50000000-0000-0000-0000-0000000000a1', '30000000-0000-0000-0000-0000000000a1', 1, '{"make":"Testmerk"}'),
  ('50000000-0000-0000-0000-0000000000a2', '30000000-0000-0000-0000-0000000000a2', 1, '{"make":"Testmerk"}');

insert into public.listings (id, application_id, vehicle_revision_id, status) values
  ('60000000-0000-0000-0000-0000000000a1', '40000000-0000-0000-0000-0000000000a1', '50000000-0000-0000-0000-0000000000a1', 'published'),
  ('60000000-0000-0000-0000-0000000000a2', '40000000-0000-0000-0000-0000000000a2', '50000000-0000-0000-0000-0000000000a2', 'draft');

insert into public.vehicle_photos (id, application_id, vehicle_revision_id, storage_path, media_type, size_bytes, sha256, review_status) values
  ('70000000-0000-0000-0000-0000000000a1', '40000000-0000-0000-0000-0000000000a1', '50000000-0000-0000-0000-0000000000a1', 'test/published.jpg', 'image/jpeg', 100, repeat('a', 64), 'approved'),
  ('70000000-0000-0000-0000-0000000000a2', '40000000-0000-0000-0000-0000000000a2', '50000000-0000-0000-0000-0000000000a2', 'test/draft.jpg', 'image/jpeg', 100, repeat('b', 64), 'approved');

set local role anon;
select throws_ok(
  $$ select count(*)::bigint from public.companies $$,
  '42501', null,
  'anonieme bezoekers krijgen geen tabeltoegang tot bedrijven'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000b1","role":"authenticated","aal":"aal1"}', true);
select results_eq(
  $$ select status::text from public.companies order by id $$,
  $$ values ('pending'::text) $$,
  'pending dealer ziet uitsluitend het eigen bedrijf'
);
select throws_ok(
  $$ select public.set_company_status('10000000-0000-0000-0000-0000000000b1', 'approved') $$,
  'P0001', 'admin_required',
  'dealer kan zichzelf niet goedkeuren'
);
select throws_ok(
  $$ update public.companies set status = 'approved' where id = '10000000-0000-0000-0000-0000000000b1' $$,
  '42501', null,
  'dealer kan bedrijfsstatus niet rechtstreeks wijzigen'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated","aal":"aal1"}', true);
select throws_ok(
  $$ select public.set_company_status('10000000-0000-0000-0000-0000000000b1', 'approved') $$,
  'P0001', 'mfa_required',
  'beheer zonder MFA kan niet goedkeuren'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated","aal":"aal2"}', true);
select lives_ok(
  $$ select public.set_company_status('10000000-0000-0000-0000-0000000000b1', 'approved') $$,
  'beheer met MFA kan goedkeuren'
);
select results_eq(
  $$ select status::text from public.companies where id = '10000000-0000-0000-0000-0000000000b1' $$,
  $$ values ('approved'::text) $$,
  'goedgekeurde status is opgeslagen'
);
select results_eq(
  $$ select count(*)::bigint from public.audit_log where entity_id = '10000000-0000-0000-0000-0000000000b1' and action = 'company.status_changed' $$,
  $$ values (1::bigint) $$,
  'statuswijziging staat in de auditlog'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000c1","role":"authenticated","aal":"aal2"}', true);
select results_eq(
  $$ select count(*)::bigint from public.companies where id = '10000000-0000-0000-0000-0000000000d1' $$,
  $$ values (0::bigint) $$,
  'dealer ziet geen ander bedrijf'
);
select results_eq(
  $$ select count(*)::bigint from public.vehicle_revisions where id = '50000000-0000-0000-0000-0000000000a1' $$,
  $$ values (1::bigint) $$,
  'goedgekeurde dealer ziet een gepubliceerde voertuigversie'
);
select results_eq(
  $$ select count(*)::bigint from public.vehicle_revisions where id = '50000000-0000-0000-0000-0000000000a2' $$,
  $$ values (0::bigint) $$,
  'goedgekeurde dealer ziet geen ongepubliceerde voertuigversie'
);
select results_eq(
  $$ select count(*)::bigint from public.vehicle_photos where id = '70000000-0000-0000-0000-0000000000a1' $$,
  $$ values (1::bigint) $$,
  'goedgekeurde dealer ziet metadata van een goedgekeurde gepubliceerde foto'
);
select results_eq(
  $$ select count(*)::bigint from public.vehicle_photos where id = '70000000-0000-0000-0000-0000000000a2' $$,
  $$ values (0::bigint) $$,
  'goedgekeurde dealer ziet geen fotometadata van een ongepubliceerd voertuig'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000e1","role":"authenticated","aal":"aal1"}', true);
select results_eq(
  $$ select count(*)::bigint from public.companies where id = '10000000-0000-0000-0000-0000000000e1' $$,
  $$ values (0::bigint) $$,
  'verwijderd bedrijfslid kan het voormalige bedrijf niet meer lezen'
);
select throws_ok(
  $$ select public.register_company('', null, '20000001', 'Teststraat', '5', '1234AB', 'Testdam', 'Test Persoon', 'test@example.test', '0612345678') $$,
  'P0001', 'invalid_legal_name',
  'rechtstreekse registratie weigert een lege bedrijfsnaam'
);
select throws_ok(
  $$ select public.register_company('Nieuw Bedrijf', null, '20000001', 'Teststraat', '5', '1234AB', 'Testdam', 'Test Persoon', 'geen-email', '0612345678') $$,
  'P0001', 'invalid_email',
  'rechtstreekse registratie weigert een ongeldig e-mailadres'
);
reset role;

select * from finish();
rollback;
