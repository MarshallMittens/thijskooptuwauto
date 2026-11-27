begin;
create extension if not exists pgtap with schema extensions;
select plan(31);
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
select set_config('request.jwt.claims','{"role":"anon"}',true);
select throws_ok($$select public.admin_archive_application('e1110000-0000-0000-0000-000000000001','Een fictieve testreden')$$,'42501',null,'anon kan niet archiveren');
reset role;
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"a1110000-0000-0000-0000-000000000003","role":"authenticated"}',true);
select throws_ok($$select public.admin_archive_application('e1110000-0000-0000-0000-000000000001','Een fictieve testreden')$$,'P0001','admin_required','dealer kan niet archiveren');
select lives_ok($$select public.place_bid('21110000-0000-0000-0000-000000000001',100000,'31110000-0000-0000-0000-000000000099')$$,'fictief bod voor archivering');
select set_config('request.jwt.claims','{"sub":"a1110000-0000-0000-0000-000000000002","role":"authenticated"}',true);
select throws_ok($$select public.admin_archive_application('e1110000-0000-0000-0000-000000000001','Een fictieve testreden')$$,'P0001','admin_required','operator kan niet archiveren');
select set_config('request.jwt.claims','{"sub":"a1110000-0000-0000-0000-000000000009","role":"authenticated"}',true);
select throws_ok($$select public.admin_archive_application('e1110000-0000-0000-0000-000000000001','Een fictieve testreden')$$,'P0001','admin_required','geblokkeerde admin geweigerd');
select set_config('request.jwt.claims','{"sub":"a1110000-0000-0000-0000-000000000001","role":"anon"}',true);
select throws_ok($$select public.admin_archive_application('e1110000-0000-0000-0000-000000000001','Een fictieve testreden')$$,'P0001','admin_required','ongeldige tokenrol geweigerd');
select set_config('request.jwt.claims','{"sub":"a1110000-0000-0000-0000-000000000001","role":"authenticated","aal":"aal1"}',true);
select throws_ok($$select public.admin_archive_application('e1110000-0000-0000-0000-000000000001','kort')$$,'P0001','archive_reason_required','reden verplicht');
select throws_ok($$select public.admin_archive_application('ffffffff-ffff-ffff-ffff-ffffffffffff','Een fictieve testreden')$$,'P0001','application_not_found','onbekende aanvraag geweigerd');
reset role;
insert into public.deal_cases(application_id,status) values('e1110000-0000-0000-0000-000000000001','discussing');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"a1110000-0000-0000-0000-000000000001","role":"authenticated"}',true);
select throws_ok($$select public.admin_archive_application('e1110000-0000-0000-0000-000000000001','Een fictieve testreden')$$,'P0001','archive_followup_active','lopende afhandeling beschermd');
select is((select archived_at from public.applications where id='e1110000-0000-0000-0000-000000000001'),null::timestamptz,'weigering archiveert niet');
select is((select status::text from public.bid_rounds where id='21110000-0000-0000-0000-000000000001'),'active','weigering annuleert niet');
reset role;
delete from public.deal_cases where application_id='e1110000-0000-0000-0000-000000000001';
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"a1110000-0000-0000-0000-000000000001","role":"authenticated"}',true);
reset role;
update public.bid_rounds set outcome_status='disputed' where id='21110000-0000-0000-0000-000000000001';
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"a1110000-0000-0000-0000-000000000001","role":"authenticated"}',true);
select throws_ok($$select public.admin_archive_application('e1110000-0000-0000-0000-000000000001','Een fictieve testreden')$$,'P0001','archive_followup_active','geschil beschermd');
reset role;
update public.bid_rounds set outcome_status='pending' where id='21110000-0000-0000-0000-000000000001';
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"a1110000-0000-0000-0000-000000000001","role":"authenticated"}',true);
select lives_ok($$select public.admin_archive_application('e1110000-0000-0000-0000-000000000001','Een fictieve testreden')$$,'admin archiveert actieve veiling');
select ok((select archived_at is not null from public.applications where id='e1110000-0000-0000-0000-000000000001'),'archiefdatum opgeslagen');
select is((select archived_by::text from public.applications where id='e1110000-0000-0000-0000-000000000001'),'a1110000-0000-0000-0000-000000000001','actor opgeslagen');
select is((select status::text from public.bid_rounds where id='21110000-0000-0000-0000-000000000001'),'cancelled','biedronde gestopt');
select is((select count(*) from public.bids where bid_round_id='21110000-0000-0000-0000-000000000001'),1::bigint,'bestaand bod bewaard');
select is((select count(*) from public.notification_outbox where entity_id='11110000-0000-0000-0000-000000000001' and event_type='listing.published' and status::text='cancelled'),2::bigint,'onverstuurde aanbodmails geannuleerd');
select lives_ok($$select public.admin_archive_application('e1110000-0000-0000-0000-000000000001','Een fictieve testreden')$$,'herhaald verzoek idempotent');
select is((select count(*) from public.audit_log where entity_id='e1110000-0000-0000-0000-000000000001' and action='application.archived'),1::bigint,'exact een auditregel');
select ok((select item->>'archivedAt' is not null from jsonb_array_elements(public.list_admin_applications()) item where item->>'id'='e1110000-0000-0000-0000-000000000001'),'beheer houdt archief beschikbaar');
select set_config('request.jwt.claims','{"sub":"a1110000-0000-0000-0000-000000000003","role":"authenticated"}',true);
select is(jsonb_array_length(public.list_dealer_listings(null,null,null)),0,'gearchiveerde auto uit aanbod');
select throws_ok($$select public.place_bid('21110000-0000-0000-0000-000000000001',120000,'31110000-0000-0000-0000-000000000098')$$,'P0001','bid_round_not_active','nieuw bod geweigerd');
select throws_ok($$update public.applications set archived_at=null where id='e1110000-0000-0000-0000-000000000001'$$,'42501',null,'directe archiefmutatie verboden');
reset role;
select throws_ok($$update public.bid_rounds set status='active' where id='21110000-0000-0000-0000-000000000001'$$,'P0001','application_archived','actieve ronde niet heropenen');
select throws_ok($$insert into public.deal_cases(application_id,status) values('e1110000-0000-0000-0000-000000000001','discussing')$$,'P0001','application_archived','geen nieuwe koopafhandeling na archivering');
select throws_ok($$insert into public.listings(application_id,vehicle_revision_id,status) values('e1110000-0000-0000-0000-000000000001','f1110000-0000-0000-0000-000000000001','draft')$$,'P0001','application_archived','nieuwe publicatie geweigerd');
insert into public.applications(id,seller_contact_id,vehicle_id,status) values('e1110000-0000-0000-0000-000000000002','c1110000-0000-0000-0000-000000000001','d1110000-0000-0000-0000-000000000001','closed');
insert into public.seller_application_access(application_id,user_id) values('e1110000-0000-0000-0000-000000000002','a1110000-0000-0000-0000-000000000010');
insert into public.listings(id,application_id,vehicle_revision_id,status,published_at) values('11110000-0000-0000-0000-000000000003','e1110000-0000-0000-0000-000000000002','f1110000-0000-0000-0000-000000000001','published',now()-interval '25 hours');
insert into public.bid_rounds(id,listing_id,status,starts_at,ends_at,outcome_status) values('21110000-0000-0000-0000-000000000002','11110000-0000-0000-0000-000000000003','closed',now()-interval '25 hours',now()-interval '1 hour','closed_no_bids');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"a1110000-0000-0000-0000-000000000001","role":"authenticated"}',true);
select lives_ok($$select public.admin_archive_application('e1110000-0000-0000-0000-000000000002','Een afgesloten veiling archiveren')$$,'afgeronde veiling archiveren');
select is((select status::text from public.bid_rounds where id='21110000-0000-0000-0000-000000000002'),'closed','afgeronde status behouden');
select is((select outcome_status::text from public.bid_rounds where id='21110000-0000-0000-0000-000000000002'),'closed_no_bids','oude uitslag behouden');
select is((select count(*) from public.seller_contacts where id='c1110000-0000-0000-0000-000000000001'),1::bigint,'verkopersdossier behouden');
reset role;
select * from finish();
rollback;
