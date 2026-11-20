begin;

create extension if not exists pgtap with schema extensions;
select plan(56);

select is((
  select count(*) from pg_catalog.pg_proc p
  join pg_catalog.pg_namespace n on n.oid = p.pronamespace
  where n.nspname in ('public', 'private') and p.prokind = 'f'
    and (p.prosrc ilike '%aal2%' or p.prosrc ilike '%mfa_required%')
), 0::bigint, 'actuele portalfuncties hebben geen verborgen MFA-eis');
select is((
  select count(*) from pg_catalog.pg_policy p
  join pg_catalog.pg_class c on c.oid = p.polrelid
  join pg_catalog.pg_namespace n on n.oid = c.relnamespace
  where n.nspname in ('public', 'storage')
    and (coalesce(pg_catalog.pg_get_expr(p.polqual, p.polrelid), '') ilike '%aal2%'
      or coalesce(pg_catalog.pg_get_expr(p.polwithcheck, p.polrelid), '') ilike '%aal2%')
), 0::bigint, 'actuele RLS- en storagepolicies hebben geen verborgen MFA-eis');
select ok((select not prosecdef and provolatile = 's' from pg_catalog.pg_proc
  where oid = 'private.has_authenticated_session()'::regprocedure), 'sessiehelper is stable en security invoker');
select is(has_function_privilege('anon', 'private.has_authenticated_session()', 'execute'), false, 'anon krijgt geen execute op sessiehelper');
select is(has_function_privilege('authenticated', 'private.has_authenticated_session()', 'execute'), true, 'RLS mag sessiehelper als authenticated gebruiken');
select is(has_function_privilege('anon', 'public.list_admin_applications()', 'execute'), false, 'anonieme beheer-RPC-grant blijft ingetrokken');
select is(has_function_privilege('authenticated', 'public.place_manual_bid_internal(uuid,bigint,uuid)', 'execute'), false, 'interne biedfunctie blijft afgeschermd');

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
)
select '00000000-0000-0000-0000-000000000000'::uuid, fixture.id, 'authenticated', 'authenticated',
  fixture.email, '', now(), '{}'::jsonb, '{}'::jsonb, now(), now(), '', '', '', ''
from (values
  ('a1110000-0000-0000-0000-000000000001'::uuid, 'password-admin@example.test'),
  ('a1110000-0000-0000-0000-000000000002'::uuid, 'password-operator@example.test'),
  ('a1110000-0000-0000-0000-000000000003'::uuid, 'password-dealer@example.test'),
  ('a1110000-0000-0000-0000-000000000004'::uuid, 'password-other-dealer@example.test'),
  ('a1110000-0000-0000-0000-000000000005'::uuid, 'password-pending@example.test'),
  ('a1110000-0000-0000-0000-000000000006'::uuid, 'password-blocked-company@example.test'),
  ('a1110000-0000-0000-0000-000000000007'::uuid, 'password-blocked-profile@example.test'),
  ('a1110000-0000-0000-0000-000000000008'::uuid, 'password-removed-member@example.test'),
  ('a1110000-0000-0000-0000-000000000009'::uuid, 'password-blocked-admin@example.test'),
  ('a1110000-0000-0000-0000-000000000010'::uuid, 'password-seller@example.test')
) fixture(id, email);

insert into public.staff_memberships(user_id, role) values
  ('a1110000-0000-0000-0000-000000000001', 'admin'),
  ('a1110000-0000-0000-0000-000000000002', 'operator'),
  ('a1110000-0000-0000-0000-000000000009', 'admin');
update public.profiles set account_blocked = true
where id in ('a1110000-0000-0000-0000-000000000007', 'a1110000-0000-0000-0000-000000000009');

insert into public.companies(id, legal_name, kvk_number, street, house_number, postal_code, city, contact_name, email, phone, status) values
  ('b1110000-0000-0000-0000-000000000001', 'Password Dealer BV', '81110001', 'Testweg', '1', '1234AB', 'Testdam', 'Fictieve Dealer', 'password-dealer@example.test', '0611111111', 'approved'),
  ('b1110000-0000-0000-0000-000000000002', 'Password Andere BV', '81110002', 'Testweg', '2', '1234AB', 'Testdam', 'Andere Dealer', 'password-other-dealer@example.test', '0622222222', 'approved'),
  ('b1110000-0000-0000-0000-000000000003', 'Password Pending BV', '81110003', 'Testweg', '3', '1234AB', 'Testdam', 'Wachtende Dealer', 'password-pending@example.test', '0633333333', 'pending'),
  ('b1110000-0000-0000-0000-000000000004', 'Password Geblokkeerd BV', '81110004', 'Testweg', '4', '1234AB', 'Testdam', 'Geblokkeerde Dealer', 'password-blocked-company@example.test', '0644444444', 'blocked');
insert into public.company_memberships(company_id, user_id, role, status) values
  ('b1110000-0000-0000-0000-000000000001', 'a1110000-0000-0000-0000-000000000003', 'owner', 'active'),
  ('b1110000-0000-0000-0000-000000000002', 'a1110000-0000-0000-0000-000000000004', 'owner', 'active'),
  ('b1110000-0000-0000-0000-000000000003', 'a1110000-0000-0000-0000-000000000005', 'owner', 'active'),
  ('b1110000-0000-0000-0000-000000000004', 'a1110000-0000-0000-0000-000000000006', 'owner', 'active'),
  ('b1110000-0000-0000-0000-000000000001', 'a1110000-0000-0000-0000-000000000007', 'member', 'active'),
  ('b1110000-0000-0000-0000-000000000001', 'a1110000-0000-0000-0000-000000000008', 'member', 'removed');

insert into public.seller_contacts(id, full_name, email, phone, postal_code)
values ('c1110000-0000-0000-0000-000000000001', 'Fictieve Password Verkoper', 'password-seller@example.test', '0699999999', '9999ZZ');
insert into public.vehicles(id, registration_normalized, make, model)
values ('d1110000-0000-0000-0000-000000000001', 'PW11AA', 'TEST', 'PASSWORD');
insert into public.applications(id, seller_contact_id, vehicle_id, status)
values ('e1110000-0000-0000-0000-000000000001', 'c1110000-0000-0000-0000-000000000001', 'd1110000-0000-0000-0000-000000000001', 'ready');
insert into public.seller_application_access(application_id, user_id)
values ('e1110000-0000-0000-0000-000000000001', 'a1110000-0000-0000-0000-000000000010');
insert into public.vehicle_revisions(id, vehicle_id, revision_number, snapshot)
values ('f1110000-0000-0000-0000-000000000001', 'd1110000-0000-0000-0000-000000000001', 1, '{"vehicle":{"registration":"PW11AA"}}');
insert into public.listings(id, application_id, vehicle_revision_id, status, published_at) values
  ('11110000-0000-0000-0000-000000000001', 'e1110000-0000-0000-0000-000000000001', 'f1110000-0000-0000-0000-000000000001', 'published', now()),
  ('11110000-0000-0000-0000-000000000002', 'e1110000-0000-0000-0000-000000000001', 'f1110000-0000-0000-0000-000000000001', 'draft', null);
insert into public.bid_rounds(id, listing_id, status, starts_at, ends_at)
values ('21110000-0000-0000-0000-000000000001', '11110000-0000-0000-0000-000000000001', 'active', now() - interval '1 minute', now() + interval '23 hours 59 minutes');
insert into public.internal_notes(application_id, author_id, body)
values ('e1110000-0000-0000-0000-000000000001', 'a1110000-0000-0000-0000-000000000001', 'Fictieve interne notitie blijft uitsluitend zichtbaar voor staff.');

set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
select throws_ok($$ select public.list_dealer_listings(null,null,null) $$, '42501', null, 'anoniem kan dealer-RPC niet uitvoeren');
select throws_ok($$ select * from public.companies $$, '42501', null, 'anoniem krijgt geen tabeltoegang');
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"role":"authenticated","aal":"aal1"}', true);
select throws_ok($$ select private.has_authenticated_session() $$, '42501', 'permission denied for schema private', 'authenticated kan de private sessiehelper niet rechtstreeks aanroepen');
select throws_ok($$ select public.list_admin_applications() $$, 'P0001', 'staff_required', 'sessie zonder uid krijgt geen beheerrechten');
select throws_ok($$ select public.list_dealer_listings(null,null,null) $$, 'P0001', 'approved_company_required', 'sessie zonder uid krijgt geen dealerrechten');
select throws_ok($$ select public.set_proxy_bid('21110000-0000-0000-0000-000000000001',100000) $$, 'P0001', 'approved_company_required', 'sessie zonder uid kan geen proxybod plaatsen');
select is((select count(*) from public.listings where id = '11110000-0000-0000-0000-000000000001'), 0::bigint, 'RLS weigert authenticated zonder uid');
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"a1110000-0000-0000-0000-000000000001","role":"anon","aal":"aal2"}', true);
select is(has_schema_privilege(current_user, 'private', 'usage'), false, 'uid met anonieme tokenrol opent het private schema niet');
select throws_ok($$ select public.list_admin_applications() $$, 'P0001', 'staff_required', 'een anonieme tokenrol krijgt ook met staff-uid geen beheerrechten');
select is((select count(*) from public.listings where id = '11110000-0000-0000-0000-000000000002'), 0::bigint, 'RLS weigert staff-uid met anonieme tokenrol');
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"a1110000-0000-0000-0000-000000000003","role":"authenticated","aal":"aal1"}', true);
select is(public.get_my_access_context()->>'company_id', 'b1110000-0000-0000-0000-000000000001', 'wachtwoordsessie krijgt de eigen dealercontext');
select is((select count(*) from public.listings where id = '11110000-0000-0000-0000-000000000001'), 1::bigint, 'goedgekeurde dealer ziet gepubliceerd aanbod op aal1');
select is((select count(*) from public.listings where id = '11110000-0000-0000-0000-000000000002'), 0::bigint, 'dealer ziet op aal1 geen conceptaanbod');
select is((select count(*) from jsonb_array_elements(public.list_dealer_listings(null,null,null)) item where item->>'id' = '11110000-0000-0000-0000-000000000001'), 1::bigint, 'dealer-RPC werkt op aal1');
select lives_ok($$ select public.record_dealer_listing_view('11110000-0000-0000-0000-000000000001') $$, 'dealer kan een bezichtiging op aal1 registreren');
select lives_ok($$ select public.place_bid('21110000-0000-0000-0000-000000000001',100000,'31110000-0000-0000-0000-000000000001') $$, 'dealer kan op aal1 een gecontroleerd bod plaatsen');
select lives_ok($$ select public.set_proxy_bid('21110000-0000-0000-0000-000000000001',200000) $$, 'dealer kan op aal1 een geheim maximumbod instellen');
select is((select count(*) from public.seller_contacts where id = 'c1110000-0000-0000-0000-000000000001'), 0::bigint, 'dealer ziet nog steeds geen verkopersgegevens');
select is((select count(*) from public.internal_notes where application_id = 'e1110000-0000-0000-0000-000000000001'), 0::bigint, 'dealer ziet nog steeds geen interne notities');
select is((select count(*) from public.companies where id = 'b1110000-0000-0000-0000-000000000002'), 0::bigint, 'dealer ziet nog steeds geen ander bedrijf');
select throws_ok($$ select public.list_admin_applications() $$, 'P0001', 'staff_required', 'wachtwoordtoegang geeft dealer geen staffrol');
select throws_ok($$ select public.set_company_status('b1110000-0000-0000-0000-000000000003','approved') $$, 'P0001', 'admin_required', 'dealer kan geen bedrijven goedkeuren');
select throws_ok($$ select * from public.proxy_bid_limits $$, '42501', null, 'geheime maxima blijven rechtstreeks ontoegankelijk');
select throws_ok($$ select public.place_manual_bid_internal('21110000-0000-0000-0000-000000000001',100000,'31110000-0000-0000-0000-000000000002') $$, '42501', null, 'dealer kan interne biedfunctie niet rechtstreeks uitvoeren');
select throws_ok($$ update public.companies set status = 'approved' where id = 'b1110000-0000-0000-0000-000000000003' $$, '42501', null, 'rechtstreekse statusmutatie blijft verboden');
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"a1110000-0000-0000-0000-000000000004","role":"authenticated","aal":"aal2"}', true);
select is((select count(*) from public.bids where bid_round_id = '21110000-0000-0000-0000-000000000001'), 0::bigint, 'ook aal2 geeft geen toegang tot biedingen van een ander bedrijf');
select throws_ok($$ select public.get_admin_listing_views('e1110000-0000-0000-0000-000000000001') $$, 'P0001', 'staff_required', 'ook aal2 geeft dealer geen beheerinzage');
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"a1110000-0000-0000-0000-000000000005","role":"authenticated","aal":"aal1"}', true);
select throws_ok($$ select public.list_dealer_listings(null,null,null) $$, 'P0001', 'approved_company_required', 'pending bedrijf krijgt geen aanbod');
select throws_ok($$ select public.set_proxy_bid('21110000-0000-0000-0000-000000000001',200000) $$, 'P0001', 'approved_company_required', 'pending bedrijf kan niet bieden');
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"a1110000-0000-0000-0000-000000000006","role":"authenticated","aal":"aal1"}', true);
select throws_ok($$ select public.record_dealer_listing_view('11110000-0000-0000-0000-000000000001') $$, 'P0001', 'approved_company_required', 'geblokkeerd bedrijf krijgt geen dealer-RPC-toegang');
select is((select count(*) from public.listings where id = '11110000-0000-0000-0000-000000000001'), 0::bigint, 'RLS weigert geblokkeerd bedrijf');
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"a1110000-0000-0000-0000-000000000007","role":"authenticated","aal":"aal1"}', true);
select throws_ok($$ select public.list_dealer_listings(null,null,null) $$, 'P0001', 'approved_company_required', 'geblokkeerd profiel krijgt geen dealerrechten');
select is((select count(*) from public.listings where id = '11110000-0000-0000-0000-000000000001'), 0::bigint, 'RLS weigert geblokkeerd dealerprofiel');
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"a1110000-0000-0000-0000-000000000008","role":"authenticated","aal":"aal1"}', true);
select throws_ok($$ select public.list_dealer_listings(null,null,null) $$, 'P0001', 'approved_company_required', 'verwijderd lid krijgt geen dealerrechten');
select is((select count(*) from public.companies where id = 'b1110000-0000-0000-0000-000000000001'), 0::bigint, 'verwijderd lid ziet voormalig bedrijf niet');
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"a1110000-0000-0000-0000-000000000001","role":"authenticated","aal":"aal1"}', true);
select lives_ok($$ select public.list_admin_applications() $$, 'admin kan op aal1 beheer-RPC uitvoeren');
select is((select count(*) from public.seller_contacts where id = 'c1110000-0000-0000-0000-000000000001'), 1::bigint, 'staff-RLS werkt op aal1');
select is((select count(*) from public.listings where id = '11110000-0000-0000-0000-000000000002'), 1::bigint, 'admin kan op aal1 conceptaanbod lezen');
select is(jsonb_array_length(public.get_admin_listing_views('e1110000-0000-0000-0000-000000000001')), 1, 'admin ziet op aal1 geregistreerde bedrijfsbezichtiging');
select lives_ok($$ select public.set_company_status('b1110000-0000-0000-0000-000000000003','approved') $$, 'admin kan op aal1 goedkeuren');
select is((select count(*) from public.audit_log where entity_id = 'b1110000-0000-0000-0000-000000000003' and action = 'company.status_changed'), 1::bigint, 'goedkeuring houdt precies een auditregel');
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"a1110000-0000-0000-0000-000000000002","role":"authenticated","aal":"aal1"}', true);
select lives_ok($$ select public.list_admin_applications() $$, 'operator behoudt gewone staffrechten op aal1');
select throws_ok($$ select public.set_company_status('b1110000-0000-0000-0000-000000000003','blocked') $$, 'P0001', 'admin_required', 'operator krijgt geen adminrechten voor bedrijfsstatus');
select throws_ok($$ select public.admin_set_platform_affiliation('b1110000-0000-0000-0000-000000000001',true) $$, 'P0001', 'admin_required', 'operator krijgt geen adminrechten voor platformverbinding');
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"a1110000-0000-0000-0000-000000000009","role":"authenticated","aal":"aal1"}', true);
select throws_ok($$ select public.list_admin_applications() $$, 'P0001', 'staff_required', 'geblokkeerde admin houdt geen stafftoegang');
select is((select count(*) from public.applications where id = 'e1110000-0000-0000-0000-000000000001'), 0::bigint, 'RLS weigert geblokkeerde admin');
reset role;

select throws_ok($$ insert into public.company_memberships(company_id,user_id,role) values('b1110000-0000-0000-0000-000000000001','a1110000-0000-0000-0000-000000000002','member') $$, 'P0001', 'staff_dealer_identity_conflict', 'staff/dealer-identiteitsscheiding blijft afgedwongen');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"a1110000-0000-0000-0000-000000000001","role":"authenticated"}', true);
select is((public.get_my_access_context()->>'is_staff')::boolean, true, 'geldige staffsessie zonder assuranceclaim krijgt staffcontext');
select lives_ok($$ select public.list_admin_applications() $$, 'geldige staffsessie zonder assuranceclaim behoudt toegang');
reset role;

select * from finish();
rollback;
