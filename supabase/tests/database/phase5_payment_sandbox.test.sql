begin;

create extension if not exists pgtap with schema extensions;
select plan(57);

select is((select enabled from public.payment_runtime_config where provider = 'simulated'), false, 'betaalsimulator staat na migratie standaard uit');
update public.payment_runtime_config set enabled = true where provider = 'simulated';

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

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000005a1","role":"authenticated","aal":"aal2"}', true);
select throws_ok($$ select public.set_test_payment_simulator_enabled(true, '00000000-0000-0000-0000-0000000005a1') $$, '42501', 'permission denied for function set_test_payment_simulator_enabled', 'beheerbrowser kan simulatorfunctie niet rechtstreeks aanroepen');
reset role;
set local role service_role;
select set_config('request.jwt.claims', '{"role":"service_role"}', true);
select throws_ok($$ select public.set_test_payment_simulator_enabled(true, '00000000-0000-0000-0000-0000000005d1') $$, 'P0001', 'staff_actor_required', 'servicefunctie weigert een verzonnen niet-staffactor');
select lives_ok($$ select public.set_test_payment_simulator_enabled(true, '00000000-0000-0000-0000-0000000005a1') $$, 'servicefunctie accepteert echte staffactor');
reset role;
select results_eq($$ select count(*)::bigint from public.audit_log where actor_id='00000000-0000-0000-0000-0000000005a1' and action='payment.test_simulator_enabled' $$, $$ values (1::bigint) $$, 'simulatoractivatie heeft herleidbare auditactor');

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

create temporary table phase5_state(payment_order_id uuid, provider_reference text, recipient_reference text);
grant all on table phase5_state to authenticated, service_role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000005e2","role":"authenticated","aal":"aal1"}', true);
select throws_ok($$ select public.get_seller_test_payment_state('40000000-0000-0000-0000-000000000501') $$, 'P0001', 'application_access_denied', 'andere verkoper kan betaalstatus niet lezen');
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000005e1","role":"authenticated","aal":"aal1"}', true);
select results_eq($$ select public.seller_start_test_payment_onboarding('40000000-0000-0000-0000-000000000501', 'd0000000-0000-0000-0000-000000000501')->>'status' $$, $$ values ('pending'::text) $$, 'verkoper start herkenbare testonboarding');
select results_eq($$ select (public.seller_start_test_payment_onboarding('40000000-0000-0000-0000-000000000501', 'd0000000-0000-0000-0000-000000000501')->>'created')::boolean $$, $$ values (false) $$, 'dubbele onboarding is idempotent');
select results_eq($$ select public.seller_complete_test_payment_onboarding('40000000-0000-0000-0000-000000000501')->>'status' $$, $$ values ('verified'::text) $$, 'testontvanger wordt expliciet geverifieerd');
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000005d2","role":"authenticated","aal":"aal2"}', true);
select throws_ok($$ select public.dealer_create_test_payment('c0000000-0000-0000-0000-000000000501', 'd1000000-0000-0000-0000-000000000501') $$, 'P0001', 'agreed_sale_required', 'andere dealer kan geen betaalverzoek maken');
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000005d1","role":"authenticated","aal":"aal2"}', true);
insert into phase5_state(payment_order_id)
select (public.dealer_create_test_payment('c0000000-0000-0000-0000-000000000501', 'd1000000-0000-0000-0000-000000000501')->>'payment_order_id')::uuid;
select ok((select payment_order_id is not null from phase5_state), 'winnaar maakt lokaal testbetaalverzoek');
select results_eq($$ select (public.dealer_create_test_payment('c0000000-0000-0000-0000-000000000501', 'd1000000-0000-0000-0000-000000000501')->>'created')::boolean $$, $$ values (false) $$, 'dubbel checkoutverzoek is idempotent');
select is(public.get_dealer_test_payment_cases()#>>'{0,payment,feeConfigurationStatus}', 'test_unconfigured', 'onbesliste vergoeding blijft herkenbaar test-ongeconfigureerd');
select results_eq($$ select (public.get_dealer_test_payment_cases()#>>'{0,payment,buyerChargeCents}')::bigint $$, $$ values (1250000::bigint) $$, 'testcheckout rekent geen verzonnen behandelingskosten');
select results_eq($$ select count(*)::bigint from public.payment_orders $$, $$ values (0::bigint) $$, 'dealer kan betalingstabellen niet rechtstreeks lezen');
select throws_ok(
  $$ select public.process_simulated_payment_event('evt_forbidden_0001', 'test', 'payment.received', 1, 'EUR', 'test', now(), repeat('a', 64)) $$,
  '42501', 'permission denied for function process_simulated_payment_event', 'dealer kan providerwebhookfunctie niet aanroepen'
);
reset role;

update phase5_state s set provider_reference = p.provider_payment_reference, recipient_reference = p.recipient_reference
from public.payment_orders p where p.id = s.payment_order_id;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000005e1","role":"authenticated","aal":"aal1"}', true);
select results_eq($$ select count(*)::bigint from public.payment_orders $$, $$ values (0::bigint) $$, 'verkoper kan betalingstabellen niet rechtstreeks lezen');
select is(public.get_seller_test_payment_state('40000000-0000-0000-0000-000000000501')#>>'{payment,status}', 'checkout_pending', 'verkoper ziet eigen testbetaalstatus via gecontroleerde functie');
reset role;

set local role service_role;
select set_config('request.jwt.claims', '{"role":"service_role"}', true);
select throws_ok(format('select public.process_simulated_payment_event(%L,%L,%L,%s,%L,%L,now(),%L)', 'evt_currency_0001', (select provider_reference from phase5_state), 'payment.received', 1250000, 'USD', (select recipient_reference from phase5_state), repeat('a',64)), 'P0001', 'payment_currency_mismatch', 'verkeerde valuta wordt geweigerd');
select throws_ok(format('select public.process_simulated_payment_event(%L,%L,%L,%s,%L,%L,now(),%L)', 'evt_recipient_0001', (select provider_reference from phase5_state), 'payment.received', 1250000, 'EUR', 'test_recipient_wrong', repeat('b',64)), 'P0001', 'payment_recipient_mismatch', 'verkeerde ontvanger wordt geweigerd');
select throws_ok(format('select public.process_simulated_payment_event(%L,%L,%L,%s,%L,%L,now(),%L)', 'evt_amount_000001', (select provider_reference from phase5_state), 'payment.received', 1250001, 'EUR', (select recipient_reference from phase5_state), repeat('c',64)), 'P0001', 'payment_amount_mismatch', 'te hoog providerbedrag wordt geweigerd');
select throws_ok(format($sql$do $block$ begin perform public.process_simulated_payment_event(%L,%L,%L,0,%L,%L,now(),%L); if (select status from public.payment_orders where id=%L::uuid) <> 'failed' then raise exception 'wrong_test_state'; end if; raise exception 'rollback_marker'; end $block$$sql$, 'evt_failed_00001', (select provider_reference from phase5_state), 'payment.failed', 'EUR', (select recipient_reference from phase5_state), repeat('d',64), (select payment_order_id from phase5_state)), 'P0001', 'rollback_marker', 'mislukte betaling heeft eigen status');
select throws_ok(format($sql$do $block$ begin perform public.process_simulated_payment_event(%L,%L,%L,0,%L,%L,now(),%L); if (select status from public.payment_orders where id=%L::uuid) <> 'expired' then raise exception 'wrong_test_state'; end if; raise exception 'rollback_marker'; end $block$$sql$, 'evt_expired_0001', (select provider_reference from phase5_state), 'payment.expired', 'EUR', (select recipient_reference from phase5_state), repeat('e',64), (select payment_order_id from phase5_state)), 'P0001', 'rollback_marker', 'verlopen betaling heeft eigen status');
select results_eq(format('select public.process_simulated_payment_event(%L,%L,%L,%s,%L,%L,now(),%L)->>''status''', 'evt_partial_0001', (select provider_reference from phase5_state), 'payment.received', 500000, 'EUR', (select recipient_reference from phase5_state), repeat('f',64)), $$ values ('partially_paid'::text) $$, 'gedeeltelijke betaling krijgt eigen status');
select results_eq($$ select received_cents from public.payment_orders where id=(select payment_order_id from phase5_state) $$, $$ values (500000::bigint) $$, 'gedeeltelijk ontvangen bedrag is exact opgeslagen');
select throws_ok(format('select public.process_simulated_payment_event(%L,%L,%L,%s,%L,%L,now(),%L)', 'evt_early_payout1', (select provider_reference from phase5_state), 'payment.paid_out', 1250000, 'EUR', (select recipient_reference from phase5_state), repeat('1',64)), 'P0001', 'invalid_payment_event_order', 'onlogische eventvolgorde wordt geweigerd');
select results_eq(format('select public.process_simulated_payment_event(%L,%L,%L,%s,%L,%L,now(),%L)->>''status''', 'evt_received_0001', (select provider_reference from phase5_state), 'payment.received', 1250000, 'EUR', (select recipient_reference from phase5_state), repeat('2',64)), $$ values ('received_held'::text) $$, 'volledig bedrag wordt als ontvangen en vastgehouden verwerkt');
select results_eq(format('select (public.process_simulated_payment_event(%L,%L,%L,%s,%L,%L,now(),%L)->>''created'')::boolean', 'evt_received_0001', (select provider_reference from phase5_state), 'payment.received', 1250000, 'EUR', (select recipient_reference from phase5_state), repeat('2',64)), $$ values (false) $$, 'dubbel providerevent is idempotent');
select results_eq($$ select received_cents from public.payment_orders where id=(select payment_order_id from phase5_state) $$, $$ values (1250000::bigint) $$, 'alleen exact bevestigd providerbedrag staat als ontvangen');
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000005a1","role":"authenticated","aal":"aal2"}', true);
select throws_ok($$ select public.admin_request_test_release((select payment_order_id from phase5_state)) $$, 'P0001', 'verified_handover_required', 'vrijgave zonder overdracht en vrijwaring wordt geweigerd');
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000005e2","role":"authenticated","aal":"aal1"}', true);
select throws_ok($$ select public.seller_confirm_test_handover((select payment_order_id from phase5_state)) $$, 'P0001', 'payment_access_denied', 'andere verkoper kan overdracht niet bevestigen');
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000005e1","role":"authenticated","aal":"aal1"}', true);
select lives_ok($$ select public.seller_confirm_test_handover((select payment_order_id from phase5_state)) $$, 'verkoper bevestigt eigen overdracht');
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000005d2","role":"authenticated","aal":"aal2"}', true);
select throws_ok($$ select public.dealer_confirm_test_handover((select payment_order_id from phase5_state)) $$, 'P0001', 'payment_access_denied', 'andere dealer kan overdracht niet bevestigen');
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000005d1","role":"authenticated","aal":"aal2"}', true);
select lives_ok($$ select public.dealer_confirm_test_handover((select payment_order_id from phase5_state)) $$, 'winnende dealer bevestigt ontvangst');
select is(public.get_dealer_test_payment_cases()#>>'{0,payment,status}', 'received_held', 'winnende dealer ziet alleen eigen betaalstatus');
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000005a1","role":"authenticated","aal":"aal1"}', true);
select throws_ok($$ select public.admin_verify_test_handover((select payment_order_id from phase5_state)) $$, 'P0001', 'staff_aal2_required', 'beheer zonder MFA kan vrijwaring niet verifiëren');
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000005a1","role":"authenticated","aal":"aal2"}', true);
select lives_ok($$ select public.admin_verify_test_handover((select payment_order_id from phase5_state)) $$, 'beheer met MFA verifieert testvrijwaring');
select results_eq($$ select public.admin_request_test_release((select payment_order_id from phase5_state))->>'status' $$, $$ values ('release_pending'::text) $$, 'vrijgave start pas na alle overdrachtscontroles');
reset role;

set local role service_role;
select set_config('request.jwt.claims', '{"role":"service_role"}', true);
select results_eq(format('select public.process_simulated_payment_event(%L,%L,%L,%s,%L,%L,now(),%L)->>''status''', 'evt_release_00001', (select provider_reference from phase5_state), 'payment.release_accepted', 1250000, 'EUR', (select recipient_reference from phase5_state), repeat('3',64)), $$ values ('payout_pending'::text) $$, 'provideracceptatie start afzonderlijke uitbetalingsstatus');
select results_eq(format('select public.process_simulated_payment_event(%L,%L,%L,%s,%L,%L,now(),%L)->>''status''', 'evt_payout_000001', (select provider_reference from phase5_state), 'payment.paid_out', 1250000, 'EUR', (select recipient_reference from phase5_state), repeat('4',64)), $$ values ('paid_out'::text) $$, 'providerbevestiging markeert uitbetaling');
select ok((select paid_out_at is not null from public.payment_orders where id=(select payment_order_id from phase5_state)), 'uitbetaald tijdstip blijft afzonderlijk bewaard');
select results_eq(format('select public.process_simulated_payment_event(%L,%L,%L,%s,%L,%L,now(),%L)->>''status''', 'evt_dispute_00001', (select provider_reference from phase5_state), 'payment.disputed', 1250000, 'EUR', (select recipient_reference from phase5_state), repeat('5',64)), $$ values ('disputed'::text) $$, 'geschil krijgt eigen status, ook na uitbetaling');
select ok((select paid_out_at is not null from public.payment_orders where id=(select payment_order_id from phase5_state)), 'geschil doet eerdere uitbetaling niet alsof die nooit bestond');
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000005a1","role":"authenticated","aal":"aal2"}', true);
select results_eq($$ select public.admin_request_test_refund((select payment_order_id from phase5_state), 1250000, 'Volledige testterugbetaling na geschil.', 'e0000000-0000-0000-0000-000000000501')->>'status' $$, $$ values ('pending'::text) $$, 'beheer vraagt traceerbare testrefund aan');
select results_eq($$ select (public.admin_request_test_refund((select payment_order_id from phase5_state), 1250000, 'Volledige testterugbetaling na geschil.', 'e0000000-0000-0000-0000-000000000501')->>'created')::boolean $$, $$ values (false) $$, 'dubbele refundaanvraag is idempotent');
reset role;

set local role service_role;
select set_config('request.jwt.claims', '{"role":"service_role"}', true);
select throws_ok(format('select public.process_simulated_payment_event(%L,%L,%L,%s,%L,%L,now(),%L)', 'evt_refund_wrong1', (select provider_reference from phase5_state), 'payment.refunded', 1200000, 'EUR', (select recipient_reference from phase5_state), repeat('6',64)), 'P0001', 'payment_amount_mismatch', 'providerrefund met verkeerd bedrag wordt geweigerd');
select results_eq(format('select public.process_simulated_payment_event(%L,%L,%L,%s,%L,%L,now(),%L)->>''status''', 'evt_refunded_0001', (select provider_reference from phase5_state), 'payment.refunded', 1250000, 'EUR', (select recipient_reference from phase5_state), repeat('7',64)), $$ values ('refunded'::text) $$, 'correcte providerrefund wordt verwerkt');
select results_eq(format('select (public.process_simulated_payment_event(%L,%L,%L,%s,%L,%L,now(),%L)->>''created'')::boolean', 'evt_refunded_0001', (select provider_reference from phase5_state), 'payment.refunded', 1250000, 'EUR', (select recipient_reference from phase5_state), repeat('7',64)), $$ values (false) $$, 'dubbel refundevent is idempotent');
select results_eq($$ select refunded_cents from public.payment_orders where id=(select payment_order_id from phase5_state) $$, $$ values (1250000::bigint) $$, 'terugbetaald bedrag wordt afzonderlijk bijgehouden');
select results_eq($$ select (public.run_test_payment_reconciliation()->>'mismatch_count')::integer $$, $$ values (0) $$, 'reconciliatie vindt geen verschil bij gelijke providerstatus');
reset role;

update private.simulated_provider_payments set amount_cents = 42 where provider_payment_reference=(select provider_reference from phase5_state);
set local role service_role;
select set_config('request.jwt.claims', '{"role":"service_role"}', true);
select results_eq($$ select (public.run_test_payment_reconciliation()->>'mismatch_count')::integer $$, $$ values (1) $$, 'reconciliatie detecteert afwijking van provideradministratie');
reset role;

select ok((select count(*) >= 2 from public.notification_outbox where entity_id=(select payment_order_id from phase5_state) and event_type='payment.status_changed'), 'betaalstatussen schrijven duurzame outboxmeldingen');
select results_eq($$ select count(*)::bigint from public.payment_events where payment_order_id=(select payment_order_id from phase5_state) $$, $$ values (6::bigint) $$, 'alleen geldige unieke providerevents blijven bewaard');
select results_eq($$ select count(*)::bigint from public.workflow_tasks where application_id='40000000-0000-0000-0000-000000000501' and task_type='payment_disputed' $$, $$ values (1::bigint) $$, 'geschil maakt precies één beheertaak');
select is((select environment from public.payment_orders where id=(select payment_order_id from phase5_state)), 'test', 'iedere lokale betaling blijft herkenbaar test');
select is((select provider from public.payment_orders where id=(select payment_order_id from phase5_state)), 'simulated', 'geen testbetaling presenteert zich als echte providerbetaling');

set local role anon;
select throws_ok($$ select count(*) from public.payment_orders $$, '42501', 'permission denied for table payment_orders', 'anoniem kan geen betalingstabellen lezen');
reset role;

select * from finish();
rollback;
