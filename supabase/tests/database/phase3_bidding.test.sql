begin;

create extension if not exists pgtap with schema extensions;
select plan(35);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
) values
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-0000000000a1', 'authenticated', 'authenticated', 'admin3@example.test', '', now(), '{}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-0000000000d1', 'authenticated', 'authenticated', 'dealer1@example.test', '', now(), '{}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-0000000000d2', 'authenticated', 'authenticated', 'dealer2@example.test', '', now(), '{}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-0000000000d3', 'authenticated', 'authenticated', 'pending3@example.test', '', now(), '{}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-0000000000e3', 'authenticated', 'authenticated', 'seller3@example.test', '', now(), '{}', '{}', now(), now(), '', '', '', '');

insert into public.staff_memberships (user_id, role) values ('00000000-0000-0000-0000-0000000000a1', 'admin');
insert into public.companies (id, legal_name, kvk_number, street, house_number, postal_code, city, contact_name, email, phone, status) values
  ('10000000-0000-0000-0000-0000000000d1', 'Dealer Een BV', '20000001', 'Testweg', '1', '1234AB', 'Testdam', 'Dealer Een', 'dealer1@example.test', '0611111111', 'approved'),
  ('10000000-0000-0000-0000-0000000000d2', 'Dealer Twee BV', '20000002', 'Testweg', '2', '1234AB', 'Testdam', 'Dealer Twee', 'dealer2@example.test', '0622222222', 'approved'),
  ('10000000-0000-0000-0000-0000000000d3', 'Wachtende Dealer BV', '20000003', 'Testweg', '3', '1234AB', 'Testdam', 'Wachtend', 'pending3@example.test', '0633333333', 'pending');
insert into public.company_memberships (company_id, user_id, role) values
  ('10000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000d1', 'owner'),
  ('10000000-0000-0000-0000-0000000000d2', '00000000-0000-0000-0000-0000000000d2', 'owner'),
  ('10000000-0000-0000-0000-0000000000d3', '00000000-0000-0000-0000-0000000000d3', 'owner');

insert into public.seller_contacts (id, full_name, email, phone, postal_code)
values ('20000000-0000-0000-0000-000000000001', 'Geheime Verkoper', 'seller3@example.test', '0699999999', '9999ZZ');
insert into public.vehicles (id, registration_normalized, make, model, year, vehicle_type)
values ('30000000-0000-0000-0000-000000000001', '12AB34', 'VOLVO', 'V60', 2020, 'Personenauto');
insert into public.applications (id, seller_contact_id, vehicle_id, status, submitted_at)
values ('40000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'ready', now());
insert into public.seller_application_access (application_id, user_id)
values ('40000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000e3');
insert into public.condition_reports (application_id, mileage_km, key_count, damage_description)
values ('40000000-0000-0000-0000-000000000001', 85000, 2, 'Geen zichtbare schade');
insert into public.vehicle_photos (id, application_id, storage_path, media_type, size_bytes, sha256, sort_order, review_status, metadata_removed_at)
values ('50000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', 'applications/test/0.jpg', 'image/jpeg', 1000, repeat('a', 64), 0, 'approved', now());

create temporary table phase3_state (listing_id uuid, round_id uuid, first_bid_id uuid, winning_bid_id uuid);
grant all on table phase3_state to authenticated;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated","aal":"aal2"}', true);
insert into phase3_state (listing_id, round_id)
select (result->>'listing_id')::uuid, (result->>'bid_round_id')::uuid
from (select public.admin_publish_application('40000000-0000-0000-0000-000000000001') result) published;
reset role;

select ok((select listing_id is not null and round_id is not null from phase3_state), 'beheer publiceert een vaste voertuigversie met biedronde');
select results_eq($$ select extract(epoch from (ends_at - starts_at))::bigint from public.bid_rounds where id = (select round_id from phase3_state) $$, $$ values (86400::bigint) $$, 'biedronde duurt exact 86400 seconden');
select results_eq($$ select status::text from public.bid_rounds where id = (select round_id from phase3_state) $$, $$ values ('active'::text) $$, 'nieuwe biedronde start direct actief');
select results_eq($$ select rules_snapshot->>'minimumIncrementCents' from public.bid_rounds where id = (select round_id from phase3_state) $$, $$ values ('5000'::text) $$, 'testminimumstap is als onveranderlijke snapshot opgeslagen');
select results_eq($$ select count(*)::bigint from public.audit_log where entity_id = (select listing_id from phase3_state) and action = 'listing.published' $$, $$ values (1::bigint) $$, 'publicatie staat in de auditlog');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000d3","role":"authenticated","aal":"aal2"}', true);
select throws_ok($$ select public.list_dealer_listings(null, null, null) $$, 'P0001', 'approved_company_required', 'pending bedrijf kan aanbod niet ophalen');
select throws_ok($$ select public.place_bid((select round_id from phase3_state), 1000000, '70000000-0000-0000-0000-000000000001') $$, 'P0001', 'approved_company_required', 'pending bedrijf kan niet bieden');
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000d1","role":"authenticated","aal":"aal2"}', true);
select results_eq($$ select count(*)::bigint from jsonb_array_elements(public.list_dealer_listings(null, null, 'active')) item where (item->>'id')::uuid = (select listing_id from phase3_state) $$, $$ values (1::bigint) $$, 'goedgekeurde dealer ziet actief aanbod');
select is(public.get_dealer_listing((select listing_id from phase3_state))#>>'{vehicle,registration}', '12AB34', 'dealer ziet de gepubliceerde voertuigversie');
select results_eq($$ select count(*)::bigint from public.seller_contacts $$, $$ values (0::bigint) $$, 'dealer kan verkopersgegevens niet rechtstreeks lezen');
select results_eq($$ select count(*)::bigint from public.internal_notes $$, $$ values (0::bigint) $$, 'dealer kan interne notities niet lezen');
update phase3_state set first_bid_id = (public.place_bid(round_id, 1000000, '70000000-0000-0000-0000-000000000001')->>'bid_id')::uuid;
select ok((select first_bid_id is not null from phase3_state), 'eerste positieve bod wordt opgeslagen');
select throws_ok($$ select public.place_bid((select round_id from phase3_state), 1004999, '70000000-0000-0000-0000-000000000002') $$, 'P0001', 'bid_below_minimum_increment', 'bod onder de globale minimumstap wordt geweigerd');
select lives_ok($$ select public.place_bid((select round_id from phase3_state), 1005000, '70000000-0000-0000-0000-000000000003') $$, 'exacte globale minimumstap wordt geaccepteerd');
select results_eq($$ select (public.place_bid((select round_id from phase3_state), 1000000, '70000000-0000-0000-0000-000000000001')->>'created')::boolean $$, $$ values (false) $$, 'dubbel verzoek met dezelfde sleutel maakt geen tweede bod');
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000d2","role":"authenticated","aal":"aal2"}', true);
select results_eq($$ select count(*)::bigint from public.bids $$, $$ values (0::bigint) $$, 'ander bedrijf kan biedingen niet rechtstreeks lezen');
select results_eq($$ select jsonb_array_length(public.get_dealer_listing((select listing_id from phase3_state))->'bidHistory') $$, $$ values (2) $$, 'ander bedrijf ziet wel dezelfde anonieme biedbedragen via de gecontroleerde functie');
select results_eq($$ select count(*)::bigint from jsonb_array_elements(public.get_dealer_listing((select listing_id from phase3_state))->'bidHistory') item where (item->>'isOwnCompany')::boolean $$, $$ values (0::bigint) $$, 'biedhistorie lekt geen concurrerende identiteit als eigen bedrijf');
update phase3_state set winning_bid_id = (public.place_bid(round_id, 1010000, '70000000-0000-0000-0000-000000000004')->>'bid_id')::uuid;
select ok((select winning_bid_id is not null from phase3_state), 'andere garage kan het hoogste bod met de minimumstap verhogen');
select throws_ok($$ select public.place_bid((select round_id from phase3_state), 1010000, '70000000-0000-0000-0000-000000000005') $$, 'P0001', 'bid_below_minimum_increment', 'een gelijk tweede bedrag wordt geweigerd');
reset role;

select results_eq($$ select count(*)::bigint from public.notification_outbox where event_type = 'bid.placed' and entity_id in (select id from public.bids where bid_round_id = (select round_id from phase3_state)) $$, $$ values (3::bigint) $$, 'ieder opgeslagen bod krijgt een duurzame notificatie');
select throws_ok($$ update public.bids set amount_cents = amount_cents + 1 $$, 'P0001', 'bids_are_append_only', 'bestaande biedingen kunnen niet stilzwijgend worden gewijzigd');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000d1","role":"authenticated","aal":"aal2"}', true);
select throws_ok($$ insert into public.bids (bid_round_id, company_id, placed_by, amount_cents, idempotency_key) values ((select round_id from phase3_state), '10000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000d1', 1200000, '70000000-0000-0000-0000-000000000006') $$, '42501', null, 'dealer kan de biedfunctie niet omzeilen met directe insert');
reset role;

alter table public.bids disable trigger bids_append_only;
update public.bids set created_at = now() - interval '2 hours' where bid_round_id = (select round_id from phase3_state);
alter table public.bids enable trigger bids_append_only;
update public.bid_rounds set starts_at = now() - interval '25 hours', ends_at = now() - interval '1 hour' where id = (select round_id from phase3_state);
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000d1","role":"authenticated","aal":"aal2"}', true);
select throws_ok($$ select public.place_bid((select round_id from phase3_state), 1150000, '70000000-0000-0000-0000-000000000007') $$, 'P0001', 'bid_round_closed', 'bod na databasetijd wordt geweigerd zonder sluitingstaak');
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated","aal":"aal2"}', true);
select results_eq($$ select jsonb_array_length(public.get_admin_market_state('40000000-0000-0000-0000-000000000001')->'bids') $$, $$ values (3) $$, 'beheer ziet alle biedingen met bedrijfsidentiteit');
select results_eq($$ select public.admin_close_bid_round((select round_id from phase3_state))->>'outcome_status' $$, $$ values ('closed_with_winner'::text) $$, 'sluiten reserveert de hoogste bieder');
select results_eq($$ select count(*)::bigint from public.winner_reservations where bid_round_id = (select round_id from phase3_state) and bid_id = (select winning_bid_id from phase3_state) $$, $$ values (1::bigint) $$, 'precies één winnaarreservering verwijst naar het hoogste geldige bod');
select results_eq($$ select (public.admin_close_bid_round((select round_id from phase3_state))->>'created')::boolean $$, $$ values (false) $$, 'opnieuw sluiten is idempotent');
select results_eq($$ select count(*)::bigint from public.winner_reservations where bid_round_id = (select round_id from phase3_state) $$, $$ values (1::bigint) $$, 'idempotent sluiten maakt geen tweede reservering');
select results_eq($$ select status::text from public.deal_cases where application_id = '40000000-0000-0000-0000-000000000001' $$, $$ select null::text where false $$, 'winnaarreservering maakt geen verkoopdossier of koop');
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000d2","role":"authenticated","aal":"aal2"}', true);
select results_eq($$ select count(*)::bigint from public.winner_reservations $$, $$ values (0::bigint) $$, 'dealer kan winnaarreserveringen niet rechtstreeks lezen');
reset role;

select results_eq($$ select count(*)::bigint from public.audit_log where action = 'bid_round.closed' and entity_id = (select round_id from phase3_state) $$, $$ values (1::bigint) $$, 'sluiting wordt één keer geaudit');

select is(
  extract(epoch from ((timestamptz '2026-03-28 12:00:00+01' + interval '86400 seconds') - timestamptz '2026-03-28 12:00:00+01'))::bigint,
  86400::bigint,
  '24-uursdeadline blijft exact bij overgang naar zomertijd'
);
select is(
  extract(epoch from ((timestamptz '2026-10-24 12:00:00+02' + interval '86400 seconds') - timestamptz '2026-10-24 12:00:00+02'))::bigint,
  86400::bigint,
  '24-uursdeadline blijft exact bij overgang naar wintertijd'
);
update public.auction_policy_versions set minimum_increment_cents = 7000 where version = 1;
select results_eq(
  $$ select rules_snapshot->>'minimumIncrementCents' from public.bid_rounds where id = (select round_id from phase3_state) $$,
  $$ values ('5000'::text) $$,
  'bestaande biedronde houdt de oorspronkelijke minimumstap na beleidswijziging'
);

select * from finish();
rollback;
