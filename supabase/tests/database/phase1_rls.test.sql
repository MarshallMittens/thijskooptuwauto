begin;

create extension if not exists pgtap with schema extensions;
select plan(9);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
) values
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-0000000000a1', 'authenticated', 'authenticated', 'admin@example.test', '', now(), '{}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-0000000000b1', 'authenticated', 'authenticated', 'pending@example.test', '', now(), '{}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-0000000000c1', 'authenticated', 'authenticated', 'approved@example.test', '', now(), '{}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-0000000000d1', 'authenticated', 'authenticated', 'other@example.test', '', now(), '{}', '{}', now(), now(), '', '', '', '');

insert into public.staff_memberships (user_id, role)
values ('00000000-0000-0000-0000-0000000000a1', 'admin');

insert into public.companies (
  id, legal_name, kvk_number, street, house_number, postal_code, city,
  contact_name, email, phone, status
) values
  ('10000000-0000-0000-0000-0000000000b1', 'Pending Motors', '10000001', 'Teststraat', '1', '1234AB', 'Testdam', 'P. Ending', 'pending@example.test', '0611111111', 'pending'),
  ('10000000-0000-0000-0000-0000000000c1', 'Goedgekeurd Auto', '10000002', 'Teststraat', '2', '1234AB', 'Testdam', 'G. Keurd', 'approved@example.test', '0622222222', 'approved'),
  ('10000000-0000-0000-0000-0000000000d1', 'Ander Bedrijf', '10000003', 'Teststraat', '3', '1234AB', 'Testdam', 'A. Nder', 'other@example.test', '0633333333', 'approved');

insert into public.company_memberships (company_id, user_id, role) values
  ('10000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000b1', 'owner'),
  ('10000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000c1', 'owner'),
  ('10000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000d1', 'owner');

set local role anon;
select results_eq(
  $$ select count(*)::bigint from public.companies $$,
  $$ values (0::bigint) $$,
  'anonieme bezoekers kunnen geen bedrijven lezen'
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
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000c1","role":"authenticated","aal":"aal1"}', true);
select results_eq(
  $$ select count(*)::bigint from public.companies where id = '10000000-0000-0000-0000-0000000000d1' $$,
  $$ values (0::bigint) $$,
  'dealer ziet geen ander bedrijf'
);
reset role;

select * from finish();
rollback;
