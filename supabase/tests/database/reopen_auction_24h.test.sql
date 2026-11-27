begin;
create extension if not exists pgtap with schema extensions;
select plan(32);
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
values ('21110000-0000-0000-0000-000000000001', '11110000-0000-0000-0000-000000000001', 'active', now() - interval '23 hours', now() + interval '1 hour');
insert into public.internal_notes(application_id, author_id, body)
values ('e1110000-0000-0000-0000-000000000001', 'a1110000-0000-0000-0000-000000000001', 'Fictieve interne notitie blijft uitsluitend zichtbaar voor staff.');

delete from public.listings where id='11110000-0000-0000-0000-000000000002';
create temp table restart_state(new_id uuid);
insert into restart_state values(null);
grant select,update on restart_state to authenticated;

set local role anon;
select set_config('request.jwt.claims','{"role":"anon"}',true);
select throws_ok($$select public.admin_reopen_auction_24h('e1110000-0000-0000-0000-000000000001','Biedingen onvoldoende voor de verkoper.','41110000-0000-0000-0000-000000000001')$$,'42501',null,'anon kan niet heropenen');
reset role;
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"a1110000-0000-0000-0000-000000000003","role":"authenticated"}',true);
select throws_ok($$select public.admin_reopen_auction_24h('e1110000-0000-0000-0000-000000000001','Biedingen onvoldoende voor de verkoper.','41110000-0000-0000-0000-000000000001')$$,'P0001','staff_required','dealer kan niet heropenen');
reset role;
select lives_ok($$insert into public.bids(bid_round_id,company_id,placed_by,amount_cents,idempotency_key,created_at) values('21110000-0000-0000-0000-000000000001','b1110000-0000-0000-0000-000000000001','a1110000-0000-0000-0000-000000000003',100000,'31110000-0000-0000-0000-000000000099',now()-interval '2 hours')$$,'fictief historisch bod voor afloop');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"a1110000-0000-0000-0000-000000000009","role":"authenticated"}',true);
select throws_ok($$select public.admin_reopen_auction_24h('e1110000-0000-0000-0000-000000000001','Biedingen onvoldoende voor de verkoper.','41110000-0000-0000-0000-000000000001')$$,'P0001','staff_required','geblokkeerde admin geweigerd');
select set_config('request.jwt.claims','{"sub":"a1110000-0000-0000-0000-000000000001","role":"anon"}',true);
select throws_ok($$select public.admin_reopen_auction_24h('e1110000-0000-0000-0000-000000000001','Biedingen onvoldoende voor de verkoper.','41110000-0000-0000-0000-000000000001')$$,'P0001','staff_required','verkeerde JWT-rol geweigerd');
select set_config('request.jwt.claims','{"sub":"a1110000-0000-0000-0000-000000000001","role":"authenticated","aal":"aal1"}',true);
select throws_ok($$select public.admin_reopen_auction_24h('e1110000-0000-0000-0000-000000000001','Biedingen onvoldoende voor de verkoper.','41110000-0000-0000-0000-000000000001')$$,'P0001','bid_round_still_active','lopende ronde niet voortijdig herstarten');
select is((select count(*) from public.bid_rounds),1::bigint,'weigering maakt geen extra ronde');
reset role;
update public.bid_rounds set starts_at=now()-interval '25 hours',ends_at=now()-interval '1 hour' where id='21110000-0000-0000-0000-000000000001';
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"a1110000-0000-0000-0000-000000000001","role":"authenticated","aal":"aal1"}',true);
select ok((public.get_admin_market_state('e1110000-0000-0000-0000-000000000001')->>'needsFinalization')::boolean,'afgelopen ronde nog niet apart afgerond');
select ok((select (item->>'canRestartAuction')::boolean from jsonb_array_elements(public.list_admin_applications()) item where item->>'id'='e1110000-0000-0000-0000-000000000001'),'overzicht biedt herstart direct na afloop');
select throws_ok($$select public.admin_reopen_auction_24h('e1110000-0000-0000-0000-000000000001','kort','41110000-0000-0000-0000-000000000002')$$,'P0001','restart_reason_required','reden blijft verplicht');
select is((select status::text from public.bid_rounds where id='21110000-0000-0000-0000-000000000001'),'active','fout draait eerdere afronding volledig terug');
select is((select count(*) from public.winner_reservations),0::bigint,'fout laat geen winnaarreservering achter');
reset role;
insert into public.deal_cases(application_id,status) values('e1110000-0000-0000-0000-000000000001','discussing');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"a1110000-0000-0000-0000-000000000001","role":"authenticated","aal":"aal1"}',true);
select throws_ok($$select public.admin_reopen_auction_24h('e1110000-0000-0000-0000-000000000001','Biedingen onvoldoende voor de verkoper.','41110000-0000-0000-0000-000000000001')$$,'P0001','auction_followup_started','lopende afhandeling blokkeert gecombineerde actie');
select is((select status::text from public.bid_rounds where id='21110000-0000-0000-0000-000000000001'),'active','afhandelingsweigering sluit niet alsnog de ronde');
reset role;
delete from public.deal_cases where application_id='e1110000-0000-0000-0000-000000000001';
update public.bid_rounds set outcome_status='disputed' where id='21110000-0000-0000-0000-000000000001';
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"a1110000-0000-0000-0000-000000000001","role":"authenticated","aal":"aal1"}',true);
select throws_ok($$select public.admin_reopen_auction_24h('e1110000-0000-0000-0000-000000000001','Biedingen onvoldoende voor de verkoper.','41110000-0000-0000-0000-000000000001')$$,'P0001','bid_round_not_finalized','geschil kan niet worden herstart');
reset role;
update public.bid_rounds set outcome_status='pending' where id='21110000-0000-0000-0000-000000000001';
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"a1110000-0000-0000-0000-000000000001","role":"authenticated","aal":"aal1"}',true);
select lives_ok($$update restart_state set new_id=(public.admin_reopen_auction_24h('e1110000-0000-0000-0000-000000000001','Biedingen onvoldoende voor de verkoper.','41110000-0000-0000-0000-000000000001')->>'bid_round_id')::uuid$$,'admin rondt af en herstart in een handeling met alleen wachtwoord');
select is((select status::text from public.bid_rounds where id='21110000-0000-0000-0000-000000000001'),'closed','oude ronde definitief gesloten');
select is((select count(*) from public.bids where bid_round_id='21110000-0000-0000-0000-000000000001'),1::bigint,'oude bieding bewaard');
select is((select status::text from public.winner_reservations where bid_round_id='21110000-0000-0000-0000-000000000001'),'released','oude winnaarreservering vrijgegeven');
select is((select status::text from public.bid_rounds where id=(select new_id from restart_state)),'active','nieuwe ronde actief');
select is((select extract(epoch from ends_at-starts_at)::bigint from public.bid_rounds where id=(select new_id from restart_state)),86400::bigint,'nieuwe ronde duurt exact 24 uur');
select is((select count(*) from public.bids where bid_round_id=(select new_id from restart_state)),0::bigint,'nieuwe ronde begint zonder biedingen');
select is((public.admin_reopen_auction_24h('e1110000-0000-0000-0000-000000000001','Biedingen onvoldoende voor de verkoper.','41110000-0000-0000-0000-000000000001')->>'created')::boolean,false,'retry met dezelfde sleutel idempotent');
select is((select count(*) from public.bid_rounds),2::bigint,'retry maakt geen derde ronde');
select is((select count(*) from public.audit_log where action='bid_round.closed' and entity_id='21110000-0000-0000-0000-000000000001'),1::bigint,'afsluiten eenmaal geaudit');
select is((select count(*) from public.audit_log where action='bid_round.restarted' and entity_id=(select new_id from restart_state)),1::bigint,'herstart eenmaal geaudit');
select is((select (item->>'canRestartAuction')::boolean from jsonb_array_elements(public.list_admin_applications()) item where item->>'id'='e1110000-0000-0000-0000-000000000001'),false,'actieve nieuwe ronde heeft geen herstartknop');
reset role;
update public.bid_rounds set starts_at=now()-interval '25 hours',ends_at=now()-interval '1 hour' where id=(select new_id from restart_state);
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"a1110000-0000-0000-0000-000000000001","role":"authenticated","aal":"aal1"}',true);
select lives_ok($$select public.admin_close_bid_round((select new_id from restart_state))$$,'tweede ronde eerst apart afronden');
select lives_ok($$select public.admin_reopen_auction_24h('e1110000-0000-0000-0000-000000000001','Ook een afgeronde ronde opnieuw aanbieden.','41110000-0000-0000-0000-000000000003')$$,'reeds afgeronde ronde eveneens herstartbaar');
select lives_ok($$select public.admin_archive_application('e1110000-0000-0000-0000-000000000001','Fictieve aanvraag na herstart archiveren.')$$,'archiveren blijft werken');
select throws_ok($$select public.admin_reopen_auction_24h('e1110000-0000-0000-0000-000000000001','Archief mag niet opnieuw worden aangeboden.','41110000-0000-0000-0000-000000000004')$$,'P0001','application_archived','gearchiveerde aanvraag niet herstartbaar');
select is((select (item->>'canRestartAuction')::boolean from jsonb_array_elements(public.list_admin_applications()) item where item->>'id'='e1110000-0000-0000-0000-000000000001'),false,'archief heeft geen herstartknop');

select * from finish();
rollback;
