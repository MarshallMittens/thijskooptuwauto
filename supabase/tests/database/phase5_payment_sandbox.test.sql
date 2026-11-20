begin;

create extension if not exists pgtap with schema extensions;
select plan(84);

-- De simulator is definitief buiten gebruik; geen enkele test activeert hem.
select is((select enabled from public.payment_runtime_config where provider = 'simulated'), false, 'betaalsimulator staat na migratie uit');
select is(private.test_payment_simulator_enabled(), false, 'simulatorhelper blijft definitief uitgeschakeld');

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
) values
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-0000000005a1', 'authenticated', 'authenticated', 'admin5@example.test', '', now(), '{}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-0000000005d1', 'authenticated', 'authenticated', 'winner5@example.test', '', now(), '{}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-0000000005d2', 'authenticated', 'authenticated', 'other5@example.test', '', now(), '{}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-0000000005e1', 'authenticated', 'authenticated', 'seller5@example.test', '', now(), '{}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-0000000005e2', 'authenticated', 'authenticated', 'otherseller5@example.test', '', now(), '{}', '{}', now(), now(), '', '', '', '');

insert into public.staff_memberships(user_id, role) values ('00000000-0000-0000-0000-0000000005a1', 'admin');
insert into public.companies(id, legal_name, kvk_number, street, house_number, postal_code, city, contact_name, email, phone, status) values
  ('10000000-0000-0000-0000-0000000005d1', 'Winnaar Vijf B.V.', '50000001', 'Testlaan', '5', '1234AB', 'Testdam', 'Winnaar', 'winner5@example.test', '0611111111', 'approved'),
  ('10000000-0000-0000-0000-0000000005d2', 'Andere Vijf B.V.', '50000002', 'Testlaan', '6', '1234AB', 'Testdam', 'Andere', 'other5@example.test', '0622222222', 'approved');
insert into public.company_memberships(company_id, user_id, role) values
  ('10000000-0000-0000-0000-0000000005d1', '00000000-0000-0000-0000-0000000005d1', 'owner'),
  ('10000000-0000-0000-0000-0000000005d2', '00000000-0000-0000-0000-0000000005d2', 'owner');

insert into public.seller_contacts(id, full_name, email, phone, postal_code) values
  ('20000000-0000-0000-0000-000000000501', 'Fictieve Verkoper Vijf', 'seller5@example.test', '0633333333', '9999ZZ');
insert into public.vehicles(id, registration_normalized, make, model, year) values
  ('30000000-0000-0000-0000-000000000501', '55TEST', 'TESTMERK', 'BETALING', 2022);
insert into public.applications(id, seller_contact_id, vehicle_id, status, submitted_at) values
  ('40000000-0000-0000-0000-000000000501', '20000000-0000-0000-0000-000000000501', '30000000-0000-0000-0000-000000000501', 'ready', now());
insert into public.seller_application_access(application_id, user_id) values
  ('40000000-0000-0000-0000-000000000501', '00000000-0000-0000-0000-0000000005e1');
insert into public.vehicle_revisions(id, vehicle_id, revision_number, snapshot) values
  ('50000000-0000-0000-0000-000000000501', '30000000-0000-0000-0000-000000000501', 1, '{"vehicle":{"registration":"55TEST","make":"TESTMERK","model":"BETALING","variant":null,"year":2022}}');
insert into public.listings(id, application_id, vehicle_revision_id, status, published_at) values
  ('60000000-0000-0000-0000-000000000501', '40000000-0000-0000-0000-000000000501', '50000000-0000-0000-0000-000000000501', 'withdrawn', now() - interval '2 days');
insert into public.bid_rounds(id, listing_id, status, starts_at, ends_at, closed_at, outcome_status) values
  ('70000000-0000-0000-0000-000000000501', '60000000-0000-0000-0000-000000000501', 'closed', now() - interval '2 days', now() - interval '1 day', now() - interval '1 day', 'closed_with_winner');
insert into public.bids(id, bid_round_id, company_id, placed_by, amount_cents, idempotency_key) values
  ('80000000-0000-0000-0000-000000000501', '70000000-0000-0000-0000-000000000501', '10000000-0000-0000-0000-0000000005d1', '00000000-0000-0000-0000-0000000005d1', 1250000, '81000000-0000-0000-0000-000000000501');
insert into public.winner_reservations(id, bid_round_id, bid_id, company_id, amount_cents) values
  ('90000000-0000-0000-0000-000000000501', '70000000-0000-0000-0000-000000000501', '80000000-0000-0000-0000-000000000501', '10000000-0000-0000-0000-0000000005d1', 1250000);
insert into public.appointments(id, winner_reservation_id, application_id, status, selected_slot, confirmed_at) values
  ('a0000000-0000-0000-0000-000000000501', '90000000-0000-0000-0000-000000000501', '40000000-0000-0000-0000-000000000501', 'attended', now() - interval '2 hours', now() - interval '1 day');
insert into public.inspections(id, appointment_id, application_id, company_id, status, mileage_km, findings, inspected_at, created_by, idempotency_key) values
  ('b0000000-0000-0000-0000-000000000501', 'a0000000-0000-0000-0000-000000000501', '40000000-0000-0000-0000-000000000501', '10000000-0000-0000-0000-0000000005d1', 'completed', 80000, 'Fictieve inspectie', now() - interval '2 hours', '00000000-0000-0000-0000-0000000005d1', 'b1000000-0000-0000-0000-000000000501');
insert into public.sale_agreements(id, winner_reservation_id, inspection_id, application_id, vehicle_revision_id, original_bid_cents, agreed_price_cents, terms_version, terms_status, status, dealer_confirmed_at, seller_confirmed_at) values
  ('c0000000-0000-0000-0000-000000000501', '90000000-0000-0000-0000-000000000501', 'b0000000-0000-0000-0000-000000000501', '40000000-0000-0000-0000-000000000501', '50000000-0000-0000-0000-000000000501', 1250000, 1250000, 'phase4-concept-v1', 'test', 'agreed', now(), now());

-- Fictieve historische records: voldoende compleet voor vrijgave en refund,
-- zodat uitsluitend de definitieve buitengebruikstelling deze acties blokkeert.
insert into public.seller_payment_onboarding (
  id, application_id, seller_user_id, recipient_reference, status, idempotency_key, verified_at
) values (
  'd0000000-0000-0000-0000-000000000501', '40000000-0000-0000-0000-000000000501',
  '00000000-0000-0000-0000-0000000005e1', 'test_recipient_phase5_retired', 'verified',
  'd0000000-0000-0000-0000-000000000501', now() - interval '1 day'
);
insert into public.payment_orders (
  id, sale_agreement_id, application_id, company_id, onboarding_id, status,
  vehicle_amount_cents, platform_fee_cents, fee_configuration_status,
  buyer_charge_cents, seller_payout_cents, received_cents, recipient_reference,
  provider_payment_reference, created_by, idempotency_key, received_at
) values (
  'e0000000-0000-0000-0000-000000000501', 'c0000000-0000-0000-0000-000000000501',
  '40000000-0000-0000-0000-000000000501', '10000000-0000-0000-0000-0000000005d1',
  'd0000000-0000-0000-0000-000000000501', 'received_held', 1250000, 0,
  'test_unconfigured', 1250000, 1250000, 1250000, 'test_recipient_phase5_retired',
  'sim_phase5_retired_payment', '00000000-0000-0000-0000-0000000005d1',
  'd1000000-0000-0000-0000-000000000501', now() - interval '1 hour'
);
insert into public.handovers (
  payment_order_id, seller_confirmed_at, dealer_confirmed_at,
  vrijwaring_verified_at, vrijwaring_verified_by
) values (
  'e0000000-0000-0000-0000-000000000501', now() - interval '1 hour',
  now() - interval '1 hour', now() - interval '1 hour',
  '00000000-0000-0000-0000-0000000005a1'
);
insert into private.simulated_provider_payments (
  provider_payment_reference, status, amount_cents, currency, recipient_reference
) values (
  'sim_phase5_retired_payment', 'received_held', 1250000, 'EUR', 'test_recipient_phase5_retired'
);

-- Bewaar ook tijdstempels en overige velden om onbedoelde bijwerkingen te vinden.
create temporary view phase5_current_state as
select jsonb_build_object(
  'runtime_config', (select coalesce(jsonb_agg(to_jsonb(record) order by record.provider), '[]'::jsonb) from public.payment_runtime_config record),
  'onboarding', (select coalesce(jsonb_agg(to_jsonb(record) order by record.id), '[]'::jsonb) from public.seller_payment_onboarding record),
  'orders', (select coalesce(jsonb_agg(to_jsonb(record) order by record.id), '[]'::jsonb) from public.payment_orders record),
  'handovers', (select coalesce(jsonb_agg(to_jsonb(record) order by record.id), '[]'::jsonb) from public.handovers record),
  'events', (select coalesce(jsonb_agg(to_jsonb(record) order by record.id), '[]'::jsonb) from public.payment_events record),
  'refunds', (select coalesce(jsonb_agg(to_jsonb(record) order by record.id), '[]'::jsonb) from public.payment_refunds record),
  'provider_payments', (select coalesce(jsonb_agg(to_jsonb(record) order by record.provider_payment_reference), '[]'::jsonb) from private.simulated_provider_payments record),
  'reconciliation_runs', (select coalesce(jsonb_agg(to_jsonb(record) order by record.id), '[]'::jsonb) from public.payment_reconciliation_runs record),
  'reconciliation_items', (select coalesce(jsonb_agg(to_jsonb(record) order by record.id), '[]'::jsonb) from public.payment_reconciliation_items record),
  'audit', (select coalesce(jsonb_agg(to_jsonb(record) order by record.id), '[]'::jsonb) from public.audit_log record),
  'outbox', (select coalesce(jsonb_agg(to_jsonb(record) order by record.id), '[]'::jsonb) from public.notification_outbox record),
  'tasks', (select coalesce(jsonb_agg(to_jsonb(record) order by record.id), '[]'::jsonb) from public.workflow_tasks record),
  'idempotency', (select coalesce(jsonb_agg(to_jsonb(record) order by record.scope, record.actor_key, record.idempotency_key), '[]'::jsonb) from public.request_idempotency record)
) as state;
create temporary table phase5_baseline as select state from phase5_current_state;

set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
select throws_ok($$ select public.set_test_payment_simulator_enabled(true, '00000000-0000-0000-0000-0000000005a1') $$, '42501', null, 'anoniem kan de gepensioneerde simulator niet activeren');
select throws_ok($$ select public.seller_start_test_payment_onboarding('40000000-0000-0000-0000-000000000501', 'd0000000-0000-0000-0000-000000000501') $$, '42501', null, 'anoniem kan geen testonboarding starten');
select throws_ok($$ select public.seller_complete_test_payment_onboarding('40000000-0000-0000-0000-000000000501') $$, '42501', null, 'anoniem kan geen testonboarding voltooien');
select throws_ok($$ select public.dealer_create_test_payment('c0000000-0000-0000-0000-000000000501', 'd1000000-0000-0000-0000-000000000501') $$, '42501', null, 'anoniem kan geen testbetaling starten');
select throws_ok($$ select public.seller_confirm_test_handover('e0000000-0000-0000-0000-000000000501') $$, '42501', null, 'anoniem kan geen verkopersoverdracht bevestigen');
select throws_ok($$ select public.dealer_confirm_test_handover('e0000000-0000-0000-0000-000000000501') $$, '42501', null, 'anoniem kan geen dealeroverdracht bevestigen');
select throws_ok($$ select public.admin_verify_test_handover('e0000000-0000-0000-0000-000000000501') $$, '42501', null, 'anoniem kan geen testvrijwaring verifiëren');
select throws_ok($$ select public.admin_request_test_release('e0000000-0000-0000-0000-000000000501') $$, '42501', null, 'anoniem kan geen testbetaling vrijgeven');
select throws_ok($$ select public.admin_request_test_refund('e0000000-0000-0000-0000-000000000501', 1250000, 'Fictieve volledige terugbetaling van een oude testbetaling.', 'e1000000-0000-0000-0000-000000000501') $$, '42501', null, 'anoniem kan geen testrefund aanvragen');
select throws_ok($$ select public.process_simulated_payment_event('evt_retired_received', 'sim_phase5_retired_payment', 'payment.received', 1250000, 'EUR', 'test_recipient_phase5_retired', now(), repeat('a', 64)) $$, '42501', null, 'anoniem kan geen gesimuleerd providerevent verwerken');
select throws_ok($$ select public.run_test_payment_reconciliation() $$, '42501', null, 'anoniem kan geen testreconciliatie starten');
select throws_ok($$ select count(*) from public.payment_orders $$, '42501', null, 'anoniem kan geen betalingstabellen lezen');
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000005e2","role":"authenticated","aal":"aal1"}', true);
select throws_ok($$ select public.set_test_payment_simulator_enabled(true, '00000000-0000-0000-0000-0000000005a1') $$, '42501', null, 'gewone gebruiker kan de simulator niet heractiveren');
select throws_ok($$ select public.seller_start_test_payment_onboarding('40000000-0000-0000-0000-000000000501', 'd0000000-0000-0000-0000-000000000501') $$, 'P0001', 'test_payment_simulator_disabled', 'gewone gebruiker kan geen testonboarding starten');
select throws_ok($$ select public.seller_complete_test_payment_onboarding('40000000-0000-0000-0000-000000000501') $$, 'P0001', 'test_payment_simulator_disabled', 'gewone gebruiker kan geen testonboarding voltooien');
select throws_ok($$ select public.dealer_create_test_payment('c0000000-0000-0000-0000-000000000501', 'd1000000-0000-0000-0000-000000000501') $$, 'P0001', 'test_payment_simulator_disabled', 'gewone gebruiker kan geen testbetaling starten');
select throws_ok($$ select public.seller_confirm_test_handover('e0000000-0000-0000-0000-000000000501') $$, 'P0001', 'test_payment_simulator_disabled', 'gewone gebruiker kan geen testoverdracht bevestigen');
select throws_ok($$ select public.dealer_confirm_test_handover('e0000000-0000-0000-0000-000000000501') $$, 'P0001', 'test_payment_simulator_disabled', 'gewone gebruiker kan geen testontvangst bevestigen');
select throws_ok($$ select public.admin_verify_test_handover('e0000000-0000-0000-0000-000000000501') $$, 'P0001', 'staff_required', 'gewone gebruiker krijgt geen staffrechten voor testvrijwaring');
select throws_ok($$ select public.admin_request_test_release('e0000000-0000-0000-0000-000000000501') $$, 'P0001', 'staff_required', 'gewone gebruiker krijgt geen staffrechten voor vrijgave');
select throws_ok($$ select public.admin_request_test_refund('e0000000-0000-0000-0000-000000000501', 1250000, 'Fictieve volledige terugbetaling van een oude testbetaling.', 'e1000000-0000-0000-0000-000000000501') $$, 'P0001', 'staff_required', 'gewone gebruiker krijgt geen staffrechten voor refunds');
select throws_ok($$ select public.process_simulated_payment_event('evt_retired_received', 'sim_phase5_retired_payment', 'payment.received', 1250000, 'EUR', 'test_recipient_phase5_retired', now(), repeat('a', 64)) $$, '42501', null, 'browserrol kan providerwebhookfunctie niet aanroepen');
select throws_ok($$ select public.run_test_payment_reconciliation() $$, '42501', null, 'browserrol kan testreconciliatie niet aanroepen');
select throws_ok($$ select public.get_seller_test_payment_state('40000000-0000-0000-0000-000000000501') $$, 'P0001', 'application_access_denied', 'andere verkoper kan historische betaalstatus niet lezen');
select results_eq($$ select count(*)::bigint from public.payment_orders $$, $$ values (0::bigint) $$, 'gewone gebruiker kan betalingstabellen niet rechtstreeks lezen');
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000005d1","role":"authenticated","aal":"aal1"}', true);
select throws_ok($$ select public.set_test_payment_simulator_enabled(true, '00000000-0000-0000-0000-0000000005a1') $$, '42501', null, 'goedgekeurde dealer met alleen wachtwoord kan de simulator niet activeren');
select throws_ok($$ select public.dealer_create_test_payment('c0000000-0000-0000-0000-000000000501', 'd1000000-0000-0000-0000-000000000501') $$, 'P0001', 'test_payment_simulator_disabled', 'goedgekeurde winnaar met alleen wachtwoord kan geen testbetaling starten');
select throws_ok($$ select public.dealer_confirm_test_handover('e0000000-0000-0000-0000-000000000501') $$, 'P0001', 'test_payment_simulator_disabled', 'goedgekeurde winnaar kan geen oude testoverdracht bevestigen');
select throws_ok($$ select public.admin_request_test_release('e0000000-0000-0000-0000-000000000501') $$, 'P0001', 'staff_required', 'goedgekeurde dealer kan geen testbetaling vrijgeven');
select throws_ok($$ select public.admin_request_test_refund('e0000000-0000-0000-0000-000000000501', 1250000, 'Fictieve volledige terugbetaling van een oude testbetaling.', 'e1000000-0000-0000-0000-000000000501') $$, 'P0001', 'staff_required', 'goedgekeurde dealer kan geen testrefund aanvragen');
select results_eq($$ select count(*)::bigint from public.payment_orders $$, $$ values (0::bigint) $$, 'dealer kan oude betalingstabellen niet rechtstreeks lezen');
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000005e1","role":"authenticated","aal":"aal1"}', true);
select throws_ok($$ select public.seller_start_test_payment_onboarding('40000000-0000-0000-0000-000000000501', 'd0000000-0000-0000-0000-000000000501') $$, 'P0001', 'test_payment_simulator_disabled', 'bevoegde verkoper kan geen nieuwe testonboarding starten');
select throws_ok($$ select public.seller_complete_test_payment_onboarding('40000000-0000-0000-0000-000000000501') $$, 'P0001', 'test_payment_simulator_disabled', 'bevoegde verkoper kan oude testonboarding niet opnieuw voltooien');
select throws_ok($$ select public.seller_confirm_test_handover('e0000000-0000-0000-0000-000000000501') $$, 'P0001', 'test_payment_simulator_disabled', 'bevoegde verkoper kan geen oude testoverdracht bevestigen');
select is((public.get_seller_test_payment_state('40000000-0000-0000-0000-000000000501')->>'simulatorEnabled')::boolean, false, 'verkoper ziet dat de simulator definitief uitstaat');
select is(public.get_seller_test_payment_state('40000000-0000-0000-0000-000000000501')#>>'{payment,status}', 'received_held', 'verkoper kan uitsluitend de onveranderde historische eigen betaalstatus lezen');
select results_eq($$ select count(*)::bigint from public.payment_orders $$, $$ values (0::bigint) $$, 'verkoper kan betalingstabellen niet rechtstreeks lezen');
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000005d2","role":"authenticated","aal":"aal1"}', true);
select results_eq($$ select jsonb_array_length(public.get_dealer_test_payment_cases()) $$, $$ values (0) $$, 'andere dealer ziet geen historische betaling van de winnaar');
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000005a1","role":"authenticated","aal":"aal1"}', true);
select throws_ok($$ select public.set_test_payment_simulator_enabled(true, '00000000-0000-0000-0000-0000000005a1') $$, '42501', null, 'staff met alleen wachtwoord kan de simulator niet heractiveren');
select throws_ok($$ select public.dealer_create_test_payment('c0000000-0000-0000-0000-000000000501', 'd1000000-0000-0000-0000-000000000501') $$, 'P0001', 'test_payment_simulator_disabled', 'staff met alleen wachtwoord kan geen testbetaling starten');
select throws_ok($$ select public.admin_verify_test_handover('e0000000-0000-0000-0000-000000000501') $$, 'P0001', 'test_payment_simulator_disabled', 'staff met alleen wachtwoord kan geen oude testvrijwaring verifiëren');
select throws_ok($$ select public.admin_request_test_release('e0000000-0000-0000-0000-000000000501') $$, 'P0001', 'test_payment_simulator_disabled', 'staff met alleen wachtwoord kan geen oude testbetaling vrijgeven');
select throws_ok($$ select public.admin_request_test_refund('e0000000-0000-0000-0000-000000000501', 1250000, 'Fictieve volledige terugbetaling van een oude testbetaling.', 'e1000000-0000-0000-0000-000000000501') $$, 'P0001', 'test_payment_simulator_disabled', 'staff met alleen wachtwoord kan geen oude testbetaling refunden');
select is((public.get_admin_test_payment_state('40000000-0000-0000-0000-000000000501')->>'simulatorEnabled')::boolean, false, 'beheer met alleen wachtwoord ziet de uitgeschakelde simulator');
select is(public.get_admin_test_payment_state('40000000-0000-0000-0000-000000000501')#>>'{payment,status}', 'received_held', 'beheer met alleen wachtwoord kan historische betaalstatus lezen');
select throws_ok($$ update public.payment_runtime_config set enabled = true where provider = 'simulated' $$, '42501', null, 'staff kan de simulatorvlag niet rechtstreeks wijzigen');
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000005a1","role":"authenticated","aal":"aal2"}', true);
select throws_ok($$ select public.set_test_payment_simulator_enabled(true, '00000000-0000-0000-0000-0000000005a1') $$, '42501', null, 'oude AAL2-staffsessie kan de simulator niet heractiveren');
select throws_ok($$ select public.dealer_create_test_payment('c0000000-0000-0000-0000-000000000501', 'd1000000-0000-0000-0000-000000000501') $$, 'P0001', 'test_payment_simulator_disabled', 'oude AAL2-staffsessie kan geen testbetaling starten');
select throws_ok($$ select public.admin_verify_test_handover('e0000000-0000-0000-0000-000000000501') $$, 'P0001', 'test_payment_simulator_disabled', 'oude AAL2-staffsessie kan geen testvrijwaring verifiëren');
select throws_ok($$ select public.admin_request_test_release('e0000000-0000-0000-0000-000000000501') $$, 'P0001', 'test_payment_simulator_disabled', 'oude AAL2-staffsessie kan geen testbetaling vrijgeven');
select throws_ok($$ select public.admin_request_test_refund('e0000000-0000-0000-0000-000000000501', 1250000, 'Fictieve volledige terugbetaling van een oude testbetaling.', 'e1000000-0000-0000-0000-000000000501') $$, 'P0001', 'test_payment_simulator_disabled', 'oude AAL2-staffsessie kan geen testbetaling refunden');
reset role;

set local role service_role;
select set_config('request.jwt.claims', '{"role":"service_role"}', true);
select throws_ok($$ select public.set_test_payment_simulator_enabled(true, '00000000-0000-0000-0000-0000000005a1') $$, '42501', null, 'ook service_role kan de simulator niet activeren met een geldige staffactor');
select throws_ok($$ select public.set_test_payment_simulator_enabled(true, '00000000-0000-0000-0000-0000000005d1') $$, '42501', null, 'service_role krijgt ook met een dealeractor geen activatierechten');
select throws_ok($$ select public.seller_start_test_payment_onboarding('40000000-0000-0000-0000-000000000501', 'd0000000-0000-0000-0000-000000000501') $$, 'P0001', 'test_payment_simulator_disabled', 'service_role kan geen testonboarding starten');
select throws_ok($$ select public.seller_complete_test_payment_onboarding('40000000-0000-0000-0000-000000000501') $$, 'P0001', 'test_payment_simulator_disabled', 'service_role kan geen testonboarding voltooien');
select throws_ok($$ select public.dealer_create_test_payment('c0000000-0000-0000-0000-000000000501', 'd1000000-0000-0000-0000-000000000501') $$, 'P0001', 'test_payment_simulator_disabled', 'service_role kan geen testbetaling starten');
select throws_ok($$ select public.seller_confirm_test_handover('e0000000-0000-0000-0000-000000000501') $$, 'P0001', 'test_payment_simulator_disabled', 'service_role kan geen testoverdracht bevestigen');
select throws_ok($$ select public.dealer_confirm_test_handover('e0000000-0000-0000-0000-000000000501') $$, 'P0001', 'test_payment_simulator_disabled', 'service_role kan geen testontvangst bevestigen');
select throws_ok($$ select public.admin_verify_test_handover('e0000000-0000-0000-0000-000000000501') $$, 'P0001', 'staff_required', 'service_role is geen ingelogde medewerker voor testvrijwaring');
select throws_ok($$ select public.admin_request_test_release('e0000000-0000-0000-0000-000000000501') $$, 'P0001', 'staff_required', 'service_role kan geen staffvrijgave uitvoeren');
select throws_ok($$ select public.admin_request_test_refund('e0000000-0000-0000-0000-000000000501', 1250000, 'Fictieve volledige terugbetaling van een oude testbetaling.', 'e1000000-0000-0000-0000-000000000501') $$, 'P0001', 'staff_required', 'service_role kan geen staffrefund uitvoeren');
select throws_ok($$ select public.process_simulated_payment_event('evt_retired_received', 'sim_phase5_retired_payment', 'payment.received', 1250000, 'EUR', 'test_recipient_phase5_retired', now(), repeat('a', 64)) $$, 'P0001', 'test_payment_simulator_disabled', 'service_role kan geen gesimuleerde ontvangst verwerken');
select throws_ok($$ select public.process_simulated_payment_event('evt_retired_release', 'sim_phase5_retired_payment', 'payment.release_accepted', 1250000, 'EUR', 'test_recipient_phase5_retired', now(), repeat('a', 64)) $$, 'P0001', 'test_payment_simulator_disabled', 'service_role kan geen gesimuleerde vrijgave verwerken');
select throws_ok($$ select public.process_simulated_payment_event('evt_retired_payout', 'sim_phase5_retired_payment', 'payment.paid_out', 1250000, 'EUR', 'test_recipient_phase5_retired', now(), repeat('a', 64)) $$, 'P0001', 'test_payment_simulator_disabled', 'service_role kan geen gesimuleerde uitbetaling verwerken');
select throws_ok($$ select public.process_simulated_payment_event('evt_retired_refund', 'sim_phase5_retired_payment', 'payment.refunded', 1250000, 'EUR', 'test_recipient_phase5_retired', now(), repeat('a', 64)) $$, 'P0001', 'test_payment_simulator_disabled', 'service_role kan geen gesimuleerde refund verwerken');
select throws_ok($$ select public.run_test_payment_reconciliation() $$, 'P0001', 'test_payment_simulator_disabled', 'service_role kan de gepensioneerde testreconciliatie niet starten');
reset role;

set local role service_role;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000005a1","role":"service_role","aal":"aal2"}', true);
select throws_ok($$ select public.admin_verify_test_handover('e0000000-0000-0000-0000-000000000501') $$, 'P0001', 'staff_required', 'service_role met staff-sub is geen geauthenticeerde staffsessie');
select throws_ok($$ select public.admin_request_test_release('e0000000-0000-0000-0000-000000000501') $$, 'P0001', 'staff_required', 'service_role met staff-sub kan geen testbetaling vrijgeven');
select throws_ok($$ select public.admin_request_test_refund('e0000000-0000-0000-0000-000000000501', 1250000, 'Fictieve volledige terugbetaling van een oude testbetaling.', 'e1000000-0000-0000-0000-000000000501') $$, 'P0001', 'staff_required', 'service_role met staff-sub kan geen testbetaling refunden');
reset role;

select results_eq($$ select state->'runtime_config' from phase5_current_state $$, $$ select state->'runtime_config' from phase5_baseline $$, 'simulatorconfiguratie blijft volledig ongewijzigd');
select results_eq($$ select state->'onboarding' from phase5_current_state $$, $$ select state->'onboarding' from phase5_baseline $$, 'oude ontvanger blijft geverifieerd zonder nieuwe onboarding');
select results_eq($$ select state->'orders' from phase5_current_state $$, $$ select state->'orders' from phase5_baseline $$, 'oude betaalorder en bedragen blijven ongewijzigd zonder nieuwe betaling');
select results_eq($$ select state->'handovers' from phase5_current_state $$, $$ select state->'handovers' from phase5_baseline $$, 'oude overdrachtsbevestigingen en verificatie blijven ongewijzigd');
select results_eq($$ select state->'events' from phase5_current_state $$, $$ select state->'events' from phase5_baseline $$, 'geblokkeerde providerevents worden niet opgeslagen');
select results_eq($$ select state->'refunds' from phase5_current_state $$, $$ select state->'refunds' from phase5_baseline $$, 'geblokkeerde refunds maken geen terugbetalingsrecords');
select results_eq($$ select state->'provider_payments' from phase5_current_state $$, $$ select state->'provider_payments' from phase5_baseline $$, 'gesimuleerde provideradministratie blijft ongewijzigd');
select results_eq($$ select state->'reconciliation_runs' from phase5_current_state $$, $$ select state->'reconciliation_runs' from phase5_baseline $$, 'geblokkeerde reconciliatie maakt geen run');
select results_eq($$ select state->'reconciliation_items' from phase5_current_state $$, $$ select state->'reconciliation_items' from phase5_baseline $$, 'geblokkeerde reconciliatie maakt geen afwijkingsrecords');
select results_eq($$ select state->'audit' from phase5_current_state $$, $$ select state->'audit' from phase5_baseline $$, 'geblokkeerde simulatoracties schrijven geen succesaudit');
select results_eq($$ select state->'outbox' from phase5_current_state $$, $$ select state->'outbox' from phase5_baseline $$, 'geblokkeerde betaalstatuswijzigingen maken geen berichten');
select results_eq($$ select state->'tasks' from phase5_current_state $$, $$ select state->'tasks' from phase5_baseline $$, 'geblokkeerde betaalacties maken geen beheertaken');
select results_eq($$ select state->'idempotency' from phase5_current_state $$, $$ select state->'idempotency' from phase5_baseline $$, 'geblokkeerde betaalacties registreren geen idempotentieverzoeken');

select * from finish();
rollback;
