begin;

create extension if not exists pgtap with schema extensions;
select plan(40);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
) values
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-0000000004a1', 'authenticated', 'authenticated', 'admin4@example.test', '', now(), '{}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-0000000004d1', 'authenticated', 'authenticated', 'winner4@example.test', '', now(), '{}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-0000000004d2', 'authenticated', 'authenticated', 'other4@example.test', '', now(), '{}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-0000000004e1', 'authenticated', 'authenticated', 'verkoper4@example.test', '', now(), '{}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-0000000004e2', 'authenticated', 'authenticated', 'ander4@example.test', '', now(), '{}', '{}', now(), now(), '', '', '', '');

insert into public.staff_memberships (user_id, role) values ('00000000-0000-0000-0000-0000000004a1', 'admin');
insert into public.companies (id, legal_name, kvk_number, street, house_number, postal_code, city, contact_name, email, phone, status) values
  ('10000000-0000-0000-0000-0000000004d1', 'Winnaar Motors', '40000001', 'Testlaan', '4', '1234AB', 'Testdam', 'Winnaar', 'winner4@example.test', '0612345678', 'approved'),
  ('10000000-0000-0000-0000-0000000004d2', 'Andere Motors', '40000002', 'Testlaan', '5', '1234AB', 'Testdam', 'Andere', 'other4@example.test', '0687654321', 'approved');
insert into public.company_memberships (company_id, user_id, role) values
  ('10000000-0000-0000-0000-0000000004d1', '00000000-0000-0000-0000-0000000004d1', 'owner'),
  ('10000000-0000-0000-0000-0000000004d2', '00000000-0000-0000-0000-0000000004d2', 'owner');
insert into public.seller_contacts (id, full_name, email, phone, postal_code)
values ('20000000-0000-0000-0000-000000000401', 'Fictieve Verkoper', 'verkoper4@example.test', '0699999999', '9999ZZ');
insert into public.vehicles (id, registration_normalized, make, model, year, vehicle_type)
values ('30000000-0000-0000-0000-000000000401', '44TEST', 'TESTMERK', 'MODEL 4', 2021, 'Personenauto');
insert into public.applications (id, seller_contact_id, vehicle_id, status, submitted_at)
values ('40000000-0000-0000-0000-000000000401', '20000000-0000-0000-0000-000000000401', '30000000-0000-0000-0000-000000000401', 'ready', now());
insert into public.seller_application_access (application_id, user_id)
values ('40000000-0000-0000-0000-000000000401', '00000000-0000-0000-0000-0000000004e1');
insert into public.condition_reports (application_id, mileage_km, key_count, damage_description, technical_issues, maintenance_description, remarks)
values ('40000000-0000-0000-0000-000000000401', 80000, 2, 'Geen', 'Geen', 'Onderhouden', 'Test');
insert into public.vehicle_photos (id, application_id, storage_path, media_type, size_bytes, sha256, sort_order, review_status, metadata_removed_at)
values ('50000000-0000-0000-0000-000000000401', '40000000-0000-0000-0000-000000000401', 'applications/phase4/0.jpg', 'image/jpeg', 1000, repeat('d', 64), 0, 'approved', now());

create temporary table phase4_state (listing_id uuid, round_id uuid, bid_id uuid, reservation_id uuid, appointment_id uuid, proposal_id uuid, inspection_id uuid, adjustment_id uuid, agreement_id uuid);
grant all on table phase4_state to authenticated, service_role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000004a1","role":"authenticated","aal":"aal2"}', true);
insert into phase4_state (listing_id, round_id)
select (result->>'listing_id')::uuid, (result->>'bid_round_id')::uuid
from (select public.admin_publish_application('40000000-0000-0000-0000-000000000401') result) published;
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000004d1","role":"authenticated","aal":"aal2"}', true);
update phase4_state set bid_id = (public.place_bid(round_id, 1250000, '70000000-0000-0000-0000-000000000401')->>'bid_id')::uuid;
reset role;

alter table public.bids disable trigger bids_append_only;
update public.bids set created_at = now() - interval '2 hours' where id = (select bid_id from phase4_state);
alter table public.bids enable trigger bids_append_only;
update public.bid_rounds set starts_at = now() - interval '25 hours', ends_at = now() - interval '1 hour' where id = (select round_id from phase4_state);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000004a1","role":"authenticated","aal":"aal2"}', true);
select public.admin_close_bid_round((select round_id from phase4_state));
update phase4_state set reservation_id = (select id from public.winner_reservations where bid_round_id = phase4_state.round_id);
reset role;

select ok((select reservation_id is not null from phase4_state), 'gesloten ronde heeft één winnaarreservering');
select results_eq($$ select count(*)::bigint from public.deal_cases where application_id = '40000000-0000-0000-0000-000000000401' $$, $$ values (0::bigint) $$, 'winnen maakt nog geen koop of afhandeling');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000004d2","role":"authenticated","aal":"aal2"}', true);
select throws_ok($$ select public.dealer_propose_appointment((select reservation_id from phase4_state), array[now() + interval '1 day'], '81000000-0000-0000-0000-000000000001') $$, 'P0001', 'winner_reservation_required', 'niet-winnende dealer kan geen afspraak voorstellen');
select results_eq($$ select jsonb_array_length(public.get_dealer_won_cases()) $$, $$ values (0) $$, 'niet-winnende dealer ziet geen gewonnen dossier');
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000004d1","role":"authenticated","aal":"aal2"}', true);
select is(public.get_dealer_won_cases()#>>'{0,sellerContact}', null, 'winnaar ziet vóór afspraakbevestiging geen verkoperscontact');
update phase4_state set
  appointment_id = (result->>'appointment_id')::uuid,
  proposal_id = (result->>'proposal_id')::uuid
from (select public.dealer_propose_appointment(
  (select reservation_id from phase4_state),
  array[now() + interval '1 day', now() + interval '2 days'],
  '81000000-0000-0000-0000-000000000002'
) result) proposed;
select ok((select appointment_id is not null and proposal_id is not null from phase4_state), 'winnaar stelt één of meer afspraakmomenten voor');
select results_eq($$ select (public.dealer_propose_appointment((select reservation_id from phase4_state), array[now() + interval '1 day', now() + interval '2 days'], '81000000-0000-0000-0000-000000000002')->>'created')::boolean $$, $$ values (false) $$, 'dubbel afspraakverzoek is idempotent');
select throws_ok($$ select public.seller_respond_appointment('40000000-0000-0000-0000-000000000401', (select appointment_id from phase4_state), 'confirm', now() + interval '1 day', null) $$, 'P0001', 'application_access_denied', 'dealer kan verkopersbevestiging niet nabootsen');
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000004a1","role":"authenticated","aal":"aal2"}', true);
select throws_ok($$ select public.admin_restart_bid_round('40000000-0000-0000-0000-000000000401', 'De bieding is na opvolging alsnog te laag.', '81000000-0000-0000-0000-000000000099') $$, 'P0001', 'auction_followup_started', 'beheer kan na het starten van de afspraakroute niet herstarten');
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000004e2","role":"authenticated","aal":"aal1"}', true);
select throws_ok($$ select public.get_seller_phase4_state('40000000-0000-0000-0000-000000000401') $$, 'P0001', 'application_access_denied', 'andere verkoper kan dossier niet lezen');
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000004e1","role":"authenticated","aal":"aal1"}', true);
select is(public.get_seller_phase4_state('40000000-0000-0000-0000-000000000401')#>>'{reservation,companyName}', 'Winnaar Motors', 'verkoper ziet de winnende garage');
select results_eq($$ select (public.get_seller_phase4_state('40000000-0000-0000-0000-000000000401')#>>'{reservation,amountCents}')::bigint $$, $$ values (1250000::bigint) $$, 'verkoper ziet het bevroren hoogste bod');
select throws_ok($$ select public.seller_respond_appointment('40000000-0000-0000-0000-000000000401', (select appointment_id from phase4_state), 'confirm', now() + interval '3 days', null) $$, 'P0001', 'invalid_selected_slot', 'verkoper kan alleen een voorgesteld moment bevestigen');
select lives_ok($$ select public.seller_respond_appointment('40000000-0000-0000-0000-000000000401', (select appointment_id from phase4_state), 'confirm', now() + interval '1 day', null) $$, 'verkoper bevestigt exact één voorgesteld moment');
select is(public.get_seller_phase4_state('40000000-0000-0000-0000-000000000401')#>>'{appointment,status}', 'confirmed', 'afspraak is pas na verkopersbevestiging bevestigd');
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000004d1","role":"authenticated","aal":"aal2"}', true);
select is(public.get_dealer_won_cases()#>>'{0,sellerContact,email}', 'verkoper4@example.test', 'winnaar krijgt contact pas na bevestigde afspraak');
update phase4_state set
  inspection_id = (result->>'inspection_id')::uuid,
  adjustment_id = (result->>'price_adjustment_proposal_id')::uuid
from (select public.dealer_record_inspection(
  (select appointment_id from phase4_state), 'completed', 80500,
  'Auto geïnspecteerd; motor en carrosserie gecontroleerd.', 'Nieuwe kras op rechterportier.',
  1200000, 'Aantoonbare nieuwe schade die niet in de publicatie stond.', now(),
  '82000000-0000-0000-0000-000000000001'
) result) inspected;
select ok((select inspection_id is not null and adjustment_id is not null from phase4_state), 'inspectie met afzonderlijk prijsvoorstel wordt opgeslagen');
select results_eq($$ select amount_cents from public.bids where id = (select bid_id from phase4_state) $$, $$ values (1250000::bigint) $$, 'prijsvoorstel wijzigt het oorspronkelijke bod nooit');
select is(public.get_dealer_won_cases()#>>'{0,priceAdjustment,status}', 'pending', 'prijsafwijking wacht op actief verkopersantwoord');
select results_eq($$ select count(*)::bigint from public.sale_agreements where application_id = '40000000-0000-0000-0000-000000000401' $$, $$ values (0::bigint) $$, 'prijsvoorstel maakt nog geen koopbevestiging');
reset role;

set local role service_role;
select set_config('request.jwt.claims', '{"role":"service_role"}', true);
select throws_ok(
  format(
    'select public.register_inspection_photo(%L::uuid, %L::uuid, %L, 1024, %L)',
    (select inspection_id from phase4_state),
    '00000000-0000-0000-0000-0000000004d1',
    'inspections/' || (select inspection_id from phase4_state)::text || '/83000000-0000-0000-0000-000000000001-' || repeat('a', 64) || '.jpg',
    repeat('a', 64)
  ),
  'P0001',
  'inspection_photo_object_missing',
  'inspectiefoto kan niet als metadata worden geregistreerd zonder bestaand privé-object'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000004e1","role":"authenticated","aal":"aal1"}', true);
update phase4_state set agreement_id = (public.seller_respond_price_adjustment('40000000-0000-0000-0000-000000000401', adjustment_id, true)->>'sale_agreement_id')::uuid;
select ok((select agreement_id is not null from phase4_state), 'verkoper accepteert prijsvoorstel zonder daarmee al de koop te bevestigen');
select results_eq($$ select (public.get_seller_phase4_state('40000000-0000-0000-0000-000000000401')#>>'{agreement,agreedPriceCents}')::bigint $$, $$ values (1200000::bigint) $$, 'koopconcept gebruikt alleen het expliciet geaccepteerde aangepaste bedrag');
select is(public.get_seller_phase4_state('40000000-0000-0000-0000-000000000401')#>>'{agreement,status}', 'awaiting_confirmations', 'koopconcept wacht op twee afzonderlijke bevestigingen');
reset role;
select results_eq($$ select recipient from public.notification_outbox where idempotency_key = 'price_adjustment.seller_response:' || (select adjustment_id from phase4_state)::text || ':accepted' $$, $$ values ('winner4@example.test'::text) $$, 'prijsreactie staat duurzaam klaar voor de winnende garage');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000004d1","role":"authenticated","aal":"aal2"}', true);
select lives_ok($$ select public.dealer_respond_sale_agreement((select agreement_id from phase4_state), true) $$, 'dealer bevestigt het exacte koopconcept');
select is(public.get_dealer_won_cases()#>>'{0,agreement,status}', 'awaiting_confirmations', 'één bevestiging maakt nog geen akkoord');
select results_eq($$ select count(*)::bigint from public.deal_cases where application_id = '40000000-0000-0000-0000-000000000401' $$, $$ values (0::bigint) $$, 'na alleen dealerbevestiging bestaat nog geen koop');
reset role;
select results_eq($$ select recipient from public.notification_outbox where idempotency_key = 'sale_agreement.dealer_response:' || (select agreement_id from phase4_state)::text || ':confirmed' $$, $$ values ('verkoper4@example.test'::text) $$, 'dealerbevestiging staat duurzaam klaar voor de verkoper');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000004e1","role":"authenticated","aal":"aal1"}', true);
select results_eq($$ select public.seller_respond_sale_agreement('40000000-0000-0000-0000-000000000401', (select agreement_id from phase4_state), true)->>'status' $$, $$ values ('agreed'::text) $$, 'tweede expliciete bevestiging maakt het koopconcept akkoord');
select is(public.get_seller_phase4_state('40000000-0000-0000-0000-000000000401')#>>'{agreement,status}', 'agreed', 'koopstatus volgt pas na beide bevestigingen');
select results_eq($$ select (public.seller_respond_sale_agreement('40000000-0000-0000-0000-000000000401', (select agreement_id from phase4_state), true)->>'created')::boolean $$, $$ values (false) $$, 'herhaalde verkopersbevestiging is idempotent');
reset role;
select results_eq($$ select recipient from public.notification_outbox where idempotency_key = 'sale_agreement.seller_response:' || (select agreement_id from phase4_state)::text || ':confirmed' $$, $$ values ('winner4@example.test'::text) $$, 'verkopersbevestiging staat duurzaam klaar voor de garage');

select results_eq($$ select terms_status from public.sale_agreements where id = (select agreement_id from phase4_state) $$, $$ values ('test'::text) $$, 'conceptvoorwaarden blijven herkenbaar test-only');
select results_eq($$ select count(*)::bigint from public.notification_outbox where entity_id in ((select appointment_id from phase4_state), (select inspection_id from phase4_state)) $$, $$ values (3::bigint) $$, 'afspraak en inspectie schrijven duurzame notificaties');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000004d2","role":"authenticated","aal":"aal2"}', true);
select results_eq($$ select count(*)::bigint from public.appointments $$, $$ values (0::bigint) $$, 'andere dealer kan afspraken niet rechtstreeks lezen');
select results_eq($$ select count(*)::bigint from public.inspections $$, $$ values (0::bigint) $$, 'andere dealer kan inspecties niet rechtstreeks lezen');
select results_eq($$ select count(*)::bigint from public.sale_agreements $$, $$ values (0::bigint) $$, 'andere dealer kan koopconcepten niet rechtstreeks lezen');
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000004a1","role":"authenticated","aal":"aal2"}', true);
select throws_ok($$ select public.admin_update_deal_case('40000000-0000-0000-0000-000000000401', 'agreed', (select bid_id from phase4_state)) $$, 'P0001', 'phase4_workflow_required', 'beheer kan dubbele bevestiging niet omzeilen met oude statusfunctie');
select is(public.get_admin_case_state('40000000-0000-0000-0000-000000000401')#>>'{deal,status}', 'agreed', 'beheer ziet akkoord pas na beide bevestigingen');
reset role;

select * from finish();
rollback;
