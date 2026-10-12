begin;

create extension if not exists pgtap with schema extensions;
select plan(24);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
) values
  ('00000000-0000-0000-0000-000000000000', '01000000-0000-0000-0000-0000000000a1', 'authenticated', 'authenticated', 'identity-admin@example.test', '', now(), '{}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '01000000-0000-0000-0000-0000000000d1', 'authenticated', 'authenticated', 'identity-dealer@example.test', '', now(), '{}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '01000000-0000-0000-0000-0000000000b1', 'authenticated', 'authenticated', 'identity-staff-candidate@example.test', '', now(), '{}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '01000000-0000-0000-0000-0000000000c1', 'authenticated', 'authenticated', 'identity-member-candidate@example.test', '', now(), '{}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '01000000-0000-0000-0000-0000000000f1', 'authenticated', 'authenticated', 'identity-platform-owner@example.test', '', now(), '{}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '01000000-0000-0000-0000-0000000000f2', 'authenticated', 'authenticated', 'identity-second-platform-admin@example.test', '', now(), '{}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '01000000-0000-0000-0000-0000000000e1', 'authenticated', 'authenticated', 'identity-seller@example.test', '', now(), '{}', '{}', now(), now(), '', '', '', '');

insert into public.staff_memberships (user_id, role) values
  ('01000000-0000-0000-0000-0000000000a1', 'admin'),
  ('01000000-0000-0000-0000-0000000000b1', 'operator');

insert into public.companies (
  id, legal_name, kvk_number, street, house_number, postal_code, city,
  contact_name, email, phone, status
) values (
  '11000000-0000-0000-0000-0000000000d1', 'Identiteit Dealer BV', '51000001',
  'Testweg', '1', '1234AB', 'Testdam', 'Dealer Test', 'identity-dealer@example.test', '0612345678', 'approved'
);

insert into public.company_memberships (company_id, user_id, role) values
  ('11000000-0000-0000-0000-0000000000d1', '01000000-0000-0000-0000-0000000000d1', 'owner'),
  ('11000000-0000-0000-0000-0000000000d1', '01000000-0000-0000-0000-0000000000f1', 'owner'),
  ('11000000-0000-0000-0000-0000000000d1', '01000000-0000-0000-0000-0000000000f2', 'owner');

insert into public.seller_contacts (id, full_name, email, phone, postal_code)
values ('21000000-0000-0000-0000-000000000001', 'Fictieve Verkoper', 'identity-seller@example.test', '0699999999', '9999ZZ');
insert into public.vehicles (id, registration_normalized, make, model)
values ('31000000-0000-0000-0000-000000000001', 'ID11TY', 'TEST', 'IDENTITEIT');
insert into public.applications (id, seller_contact_id, vehicle_id, status)
values ('41000000-0000-0000-0000-000000000001', '21000000-0000-0000-0000-000000000001', '31000000-0000-0000-0000-000000000001', 'ready');
insert into public.seller_application_access (application_id, user_id)
values ('41000000-0000-0000-0000-000000000001', '01000000-0000-0000-0000-0000000000e1');
insert into public.vehicle_revisions (id, vehicle_id, revision_number, snapshot)
values ('51000000-0000-0000-0000-000000000001', '31000000-0000-0000-0000-000000000001', 1, '{"vehicle":{"registration":"ID11TY"}}');
insert into public.listings (id, application_id, vehicle_revision_id, status, published_at)
values ('61000000-0000-0000-0000-000000000001', '41000000-0000-0000-0000-000000000001', '51000000-0000-0000-0000-000000000001', 'published', now());
insert into public.bid_rounds (id, listing_id, status, starts_at, ends_at)
values ('71000000-0000-0000-0000-000000000001', '61000000-0000-0000-0000-000000000001', 'active', now() - interval '1 minute', now() + interval '23 hours 59 minutes');

select throws_ok(
  $$ insert into public.company_memberships (company_id, user_id, role) values ('11000000-0000-0000-0000-0000000000d1', '01000000-0000-0000-0000-0000000000b1', 'member') $$,
  'P0001', 'staff_dealer_identity_conflict',
  'staffidentiteit kan geen actief dealerlidmaatschap krijgen'
);

select throws_ok(
  $$ insert into public.staff_memberships (user_id, role) values ('01000000-0000-0000-0000-0000000000d1', 'operator') $$,
  'P0001', 'staff_dealer_identity_conflict',
  'dealeridentiteit kan niet tot staff worden verhoogd'
);

select throws_ok(
  $$ update public.staff_memberships set can_use_dealer_portal = true where user_id = '01000000-0000-0000-0000-0000000000b1' $$,
  '23514', null,
  'een operator kan de platformeigenaar-uitzondering niet krijgen'
);

select lives_ok(
  $$ insert into public.staff_memberships (user_id, role, can_use_dealer_portal) values ('01000000-0000-0000-0000-0000000000f1', 'admin', true) $$,
  'alleen een expliciet gemarkeerde admin mag ook een actief dealerlidmaatschap hebben'
);

select lives_ok(
  $$ insert into public.staff_memberships (user_id, role, can_use_dealer_portal) values ('01000000-0000-0000-0000-0000000000f2', 'admin', true) $$,
  'meerdere expliciet gemarkeerde admins kunnen gecontroleerd dealerrechten krijgen'
);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"01000000-0000-0000-0000-0000000000f1","role":"authenticated","aal":"aal1"}', true);
select throws_ok(
  $$ select public.list_dealer_listings(null, null, null) $$,
  'P0001', 'approved_company_required',
  'ook de platformeigenaar heeft MFA nodig voor dealerrechten'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"01000000-0000-0000-0000-0000000000f2","role":"authenticated","aal":"aal2"}', true);
select results_eq(
  $$ select (public.get_my_access_context()->>'can_use_dealer_portal')::boolean $$,
  $$ values (true) $$,
  'de tweede expliciet aangewezen admin krijgt dezelfde gecontroleerde dealercontext'
);
select results_eq(
  $$ select count(*)::bigint from jsonb_array_elements(public.list_dealer_listings(null, null, null)) item where item->>'id' = '61000000-0000-0000-0000-000000000001' $$,
  $$ values (1::bigint) $$,
  'de tweede expliciet aangewezen admin ziet met MFA het goedgekeurde dealeraanbod'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"01000000-0000-0000-0000-0000000000d1","role":"authenticated","aal":"aal1"}', true);
select results_eq(
  $$ select count(*)::bigint from public.listings where id = '61000000-0000-0000-0000-000000000001' $$,
  $$ values (0::bigint) $$,
  'goedgekeurde dealer zonder MFA ziet geen aanbod via RLS'
);
select throws_ok(
  $$ select public.list_dealer_listings(null, null, null) $$,
  'P0001', 'approved_company_required',
  'goedgekeurde dealer zonder MFA kan dealer-RPC niet gebruiken'
);
select throws_ok(
  $$ select public.place_bid('71000000-0000-0000-0000-000000000001', 100000, '81000000-0000-0000-0000-000000000001') $$,
  'P0001', 'approved_company_required',
  'goedgekeurde dealer zonder MFA kan niet bieden'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"01000000-0000-0000-0000-0000000000f1","role":"authenticated","aal":"aal2"}', true);
select results_eq(
  $$ select (public.get_my_access_context()->>'can_use_dealer_portal')::boolean $$,
  $$ values (true) $$,
  'de toegangscontext meldt de expliciete dubbele bevoegdheid'
);
select results_eq(
  $$ select count(*)::bigint from jsonb_array_elements(public.list_dealer_listings(null, null, null)) item where item->>'id' = '61000000-0000-0000-0000-000000000001' $$,
  $$ values (1::bigint) $$,
  'de platformeigenaar ziet met MFA het goedgekeurde dealeraanbod'
);
reset role;

select throws_ok(
  $$ update public.staff_memberships set can_use_dealer_portal = false where user_id = '01000000-0000-0000-0000-0000000000f1' $$,
  'P0001', 'staff_dealer_identity_conflict',
  'de uitzondering kan niet worden uitgezet terwijl het actieve dealerlidmaatschap blijft bestaan'
);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"01000000-0000-0000-0000-0000000000d1","role":"authenticated","aal":"aal2"}', true);
select results_eq(
  $$ select count(*)::bigint from jsonb_array_elements(public.list_dealer_listings(null, null, null)) item where item->>'id' = '61000000-0000-0000-0000-000000000001' $$,
  $$ values (1::bigint) $$,
  'goedgekeurde dealer met MFA ziet gepubliceerd aanbod'
);
select lives_ok(
  $$ select public.place_bid('71000000-0000-0000-0000-000000000001', 100000, '81000000-0000-0000-0000-000000000001') $$,
  'goedgekeurde dealer met MFA kan gecontroleerd bieden'
);
select results_eq(
  $$ select count(*)::bigint from public.auction_policy_versions $$,
  $$ values (0::bigint) $$,
  'dealer kan interne policyversies niet rechtstreeks lezen'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"01000000-0000-0000-0000-0000000000f1","role":"authenticated","aal":"aal2"}', true);
select lives_ok(
  $$ select public.place_bid('71000000-0000-0000-0000-000000000001', 110000, '81000000-0000-0000-0000-000000000002') $$,
  'de platformeigenaar kan met MFA namens het gekoppelde bedrijf bieden'
);
reset role;

select results_eq(
  $$ select status::text from public.auction_policy_versions where version = 1 $$,
  $$ values ('test'::text) $$,
  'eerste veilingpolicy is uitsluitend een testconfiguratie'
);
select results_eq(
  $$ select count(*)::bigint from public.auction_policy_versions where version = 1 and fee_amount_cents is null and fee_payer is null and not fee_configuration_confirmed $$,
  $$ values (1::bigint) $$,
  'onbesliste behandelingskosten zijn niet als productiebeleid ingevuld'
);
select throws_ok(
  $$ insert into public.auction_policy_versions (version, status, minimum_increment_cents) values (99, 'approved', 5000) $$,
  '23514', null,
  'onvolledige kostenconfiguratie kan niet als goedgekeurd beleid worden opgeslagen'
);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"01000000-0000-0000-0000-0000000000a1","role":"authenticated","aal":"aal2"}', true);
select results_eq(
  $$ select count(*)::bigint from public.auction_policy_versions where version = 1 $$,
  $$ values (1::bigint) $$,
  'beheer met MFA kan testbeleid controleren'
);
reset role;

alter table public.company_memberships disable trigger dealer_identity_separation;
insert into public.company_memberships (company_id, user_id, role)
values ('11000000-0000-0000-0000-0000000000d1', '01000000-0000-0000-0000-0000000000a1', 'member');
alter table public.company_memberships enable trigger dealer_identity_separation;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"01000000-0000-0000-0000-0000000000a1","role":"authenticated","aal":"aal2"}', true);
select throws_ok(
  $$ select public.list_dealer_listings(null, null, null) $$,
  'P0001', 'approved_company_required',
  'bestaand gecombineerd staff/dealeraccount krijgt geen dealerrechten'
);
select throws_ok(
  $$ select public.place_bid('71000000-0000-0000-0000-000000000001', 120000, '81000000-0000-0000-0000-000000000003') $$,
  'P0001', 'approved_company_required',
  'bestaand gecombineerd staff/dealeraccount kan niet bieden'
);
reset role;

select * from finish();
rollback;
