begin;

create extension if not exists pgtap with schema extensions;
select plan(67);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
) values
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-0000000006a1', 'authenticated', 'authenticated', 'admin61@example.test', '', now(), '{}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-0000000006a2', 'authenticated', 'authenticated', 'admin62@example.test', '', now(), '{}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-0000000006d1', 'authenticated', 'authenticated', 'dealer61@example.test', '', now(), '{}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-0000000006d2', 'authenticated', 'authenticated', 'dealer62@example.test', '', now(), '{}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-0000000006e1', 'authenticated', 'authenticated', 'seller61@example.test', '', now(), '{}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-0000000006e2', 'authenticated', 'authenticated', 'seller62@example.test', '', now(), '{}', '{}', now(), now(), '', '', '', '');

insert into public.staff_memberships(user_id, role) values
  ('00000000-0000-0000-0000-0000000006a1', 'admin'),
  ('00000000-0000-0000-0000-0000000006a2', 'operator');
insert into public.companies(id, legal_name, kvk_number, street, house_number, postal_code, city, contact_name, email, phone, status) values
  ('10000000-0000-0000-0000-0000000006d1', 'Platformkoper Zes B.V.', '60000001', 'Testlaan', '61', '1234AB', 'Testdam', 'Koper', 'dealer61@example.test', '0611111111', 'approved'),
  ('10000000-0000-0000-0000-0000000006d2', 'Andere Zes B.V.', '60000002', 'Testlaan', '62', '1234AB', 'Testdam', 'Andere', 'dealer62@example.test', '0622222222', 'approved');
insert into public.company_memberships(company_id, user_id, role) values
  ('10000000-0000-0000-0000-0000000006d1', '00000000-0000-0000-0000-0000000006d1', 'owner'),
  ('10000000-0000-0000-0000-0000000006d2', '00000000-0000-0000-0000-0000000006d2', 'owner');
insert into public.seller_contacts(id, full_name, email, phone, postal_code) values
  ('20000000-0000-0000-0000-000000000601', 'Fictieve Verkoper Zes', 'seller61@example.test', '0633333333', '9999ZZ');
insert into public.vehicles(id, registration_normalized, make, model, year) values
  ('30000000-0000-0000-0000-000000000601', '66TEST', 'TESTMERK', 'OPERATIE', 2023);
insert into public.applications(id, seller_contact_id, vehicle_id, status, submitted_at) values
  ('40000000-0000-0000-0000-000000000601', '20000000-0000-0000-0000-000000000601', '30000000-0000-0000-0000-000000000601', 'ready', now());
insert into public.seller_application_access(application_id, user_id) values
  ('40000000-0000-0000-0000-000000000601', '00000000-0000-0000-0000-0000000006e1');
insert into public.vehicle_revisions(id, vehicle_id, revision_number, snapshot) values
  ('50000000-0000-0000-0000-000000000601', '30000000-0000-0000-0000-000000000601', 1, '{"vehicle":{"registration":"66TEST"}}');
insert into public.listings(id, application_id, vehicle_revision_id, status, published_at) values
  ('60000000-0000-0000-0000-000000000601', '40000000-0000-0000-0000-000000000601', '50000000-0000-0000-0000-000000000601', 'withdrawn', now());
insert into public.bid_rounds(id, listing_id, status, starts_at, ends_at, closed_at, outcome_status) values
  ('70000000-0000-0000-0000-000000000601', '60000000-0000-0000-0000-000000000601', 'closed', now() - interval '2 days', now() - interval '1 day', now(), 'closed_with_winner');
insert into public.bids(id, bid_round_id, company_id, placed_by, amount_cents, idempotency_key) values
  ('80000000-0000-0000-0000-000000000601', '70000000-0000-0000-0000-000000000601', '10000000-0000-0000-0000-0000000006d1', '00000000-0000-0000-0000-0000000006d1', 1000000, '81000000-0000-0000-0000-000000000601');
insert into public.winner_reservations(id, bid_round_id, bid_id, company_id, amount_cents) values
  ('90000000-0000-0000-0000-000000000601', '70000000-0000-0000-0000-000000000601', '80000000-0000-0000-0000-000000000601', '10000000-0000-0000-0000-0000000006d1', 1000000);
insert into public.appointments(id, winner_reservation_id, application_id, status, selected_slot, confirmed_at) values
  ('a0000000-0000-0000-0000-000000000601', '90000000-0000-0000-0000-000000000601', '40000000-0000-0000-0000-000000000601', 'attended', now(), now());
insert into public.inspections(id, appointment_id, application_id, company_id, status, mileage_km, findings, inspected_at, created_by, idempotency_key) values
  ('b0000000-0000-0000-0000-000000000601', 'a0000000-0000-0000-0000-000000000601', '40000000-0000-0000-0000-000000000601', '10000000-0000-0000-0000-0000000006d1', 'completed', 50000, 'Fictieve inspectie', now(), '00000000-0000-0000-0000-0000000006d1', 'b1000000-0000-0000-0000-000000000601');
insert into public.sale_agreements(id, winner_reservation_id, inspection_id, application_id, vehicle_revision_id, original_bid_cents, agreed_price_cents, terms_version, terms_status, status, dealer_confirmed_at, seller_confirmed_at) values
  ('c0000000-0000-0000-0000-000000000601', '90000000-0000-0000-0000-000000000601', 'b0000000-0000-0000-0000-000000000601', '40000000-0000-0000-0000-000000000601', '50000000-0000-0000-0000-000000000601', 1000000, 1000000, 'phase4-concept-v1', 'test', 'agreed', now(), now());
insert into public.seller_payment_onboarding(id, application_id, seller_user_id, recipient_reference, status, idempotency_key, verified_at) values
  ('d0000000-0000-0000-0000-000000000601', '40000000-0000-0000-0000-000000000601', '00000000-0000-0000-0000-0000000006e1', 'test_recipient_phase6', 'verified', 'd1000000-0000-0000-0000-000000000601', now());
insert into public.payment_orders(id, sale_agreement_id, application_id, company_id, onboarding_id, status,
  vehicle_amount_cents, platform_fee_cents, fee_configuration_status, buyer_charge_cents, seller_payout_cents,
  recipient_reference, provider_payment_reference, created_by, idempotency_key)
values('e0000000-0000-0000-0000-000000000601', 'c0000000-0000-0000-0000-000000000601', '40000000-0000-0000-0000-000000000601',
  '10000000-0000-0000-0000-0000000006d1', 'd0000000-0000-0000-0000-000000000601', 'disputed',
  1000000, 0, 'test_unconfigured', 1000000, 1000000, 'test_recipient_phase6', 'sim_phase6_payment',
  '00000000-0000-0000-0000-0000000006d1', 'e1000000-0000-0000-0000-000000000601');

create temporary table phase6_state(complaint_id uuid, invoice_id uuid, notification_id uuid, incident_id uuid, operation_id uuid);
grant all on table phase6_state to authenticated, service_role;

set local role anon;
select throws_ok($$ select count(*) from public.complaints $$, '42501', 'permission denied for table complaints', 'anoniem kan klachtentabel niet lezen');
select throws_ok($$ select public.can_upload_complaint_evidence('00000000-0000-0000-0000-000000000000') $$, '42501', 'permission denied for function can_upload_complaint_evidence', 'anoniem kan uploadrecht niet opvragen');
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000006a1","role":"authenticated","aal":"aal2"}', true);
select lives_ok($$ select public.admin_set_platform_affiliation('10000000-0000-0000-0000-0000000006d1', true) $$, 'admin met MFA markeert platformverbonden koper');
select results_eq($$ select count(*)::bigint from public.audit_log where action='company.platform_affiliation_changed' and entity_id='10000000-0000-0000-0000-0000000006d1' $$, $$ values(1::bigint) $$, 'platformverbinding heeft auditspoor');
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000006e1","role":"authenticated","aal":"aal1"}', true);
insert into phase6_state(complaint_id) select (public.seller_open_complaint('40000000-0000-0000-0000-000000000601', 'payment', 'De testbetaling en overdracht moeten handmatig worden onderzocht.', 'f0000000-0000-0000-0000-000000000601')->>'id')::uuid;
select ok((select complaint_id is not null from phase6_state), 'verkoper opent klacht bij eigen dossier');
select results_eq($$ select (public.seller_open_complaint('40000000-0000-0000-0000-000000000601', 'payment', 'De testbetaling en overdracht moeten handmatig worden onderzocht.', 'f0000000-0000-0000-0000-000000000601')->>'created')::boolean $$, $$ values(false) $$, 'dubbele klachtopening is idempotent');
select is((select requires_independent_review from public.complaints where id=(select complaint_id from phase6_state)), true, 'klacht over platformkoper vereist tweede beoordeling');
select lives_ok($$ select public.add_complaint_message((select complaint_id from phase6_state), 'Aanvullende fictieve toelichting van de verkoper.') $$, 'verkoper voegt tijdlijnbericht toe');
select results_eq($$ select count(*)::bigint from public.complaints $$, $$ values(1::bigint) $$, 'verkoper ziet via RLS alleen eigen klacht');
select is(public.can_upload_complaint_evidence((select complaint_id from phase6_state)), true, 'verkoper mag bewijs bij actieve eigen klacht voorbereiden');
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000006e2","role":"authenticated","aal":"aal1"}', true);
select throws_ok($$ select public.seller_open_complaint('40000000-0000-0000-0000-000000000601', 'other', 'Deze andere verkoper hoort geen toegang tot dit dossier te krijgen.', 'f0000000-0000-0000-0000-000000000602') $$, 'P0001', 'seller_application_access_required', 'andere verkoper kan geen klacht openen');
select results_eq($$ select count(*)::bigint from public.complaints $$, $$ values(0::bigint) $$, 'andere verkoper ziet klacht niet via RLS');
select is(public.can_upload_complaint_evidence((select complaint_id from phase6_state)), false, 'andere verkoper mag geen bewijsupload voorbereiden');
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000006d2","role":"authenticated","aal":"aal2"}', true);
select throws_ok($$ select public.dealer_open_complaint('e0000000-0000-0000-0000-000000000601', 'payment', 'Een andere dealer mag deze testbetaling niet kunnen claimen.', 'f0000000-0000-0000-0000-000000000603') $$, 'P0001', 'payment_not_owned', 'andere dealer kan geen klacht op betaling openen');
select throws_ok($$ select public.add_complaint_message((select complaint_id from phase6_state), 'Onbevoegd bericht van andere dealer.') $$, 'P0001', 'complaint_access_required', 'andere dealer kan geen bericht toevoegen');
select results_eq($$ select jsonb_array_length(public.get_dealer_complaint_state()) $$, $$ values(0) $$, 'andere dealer ziet klacht niet');
select is(public.can_upload_complaint_evidence((select complaint_id from phase6_state)), false, 'andere dealer mag geen bewijsupload voorbereiden');
select throws_ok($$ select public.dealer_open_complaint_for_reservation('90000000-0000-0000-0000-000000000601', 'appointment', 'Ik kan de gewonnen afspraak niet bereiken.', 'f0000000-0000-0000-0000-000000000606') $$, 'P0001', 'winner_reservation_not_owned', 'andere dealer kan geen klacht op reservering openen');
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000006d1","role":"authenticated","aal":"aal2"}', true);
select results_eq($$ select jsonb_array_length(public.get_dealer_complaint_state()) $$, $$ values(1) $$, 'betrokken koper ziet klacht via gecontroleerde functie');
select is(public.can_upload_complaint_evidence((select complaint_id from phase6_state)), true, 'betrokken koper mag bewijs voorbereiden');
select throws_ok(format('select public.register_complaint_evidence(%L,%L,%L,10,%L)', (select complaint_id from phase6_state), '00000000-0000-0000-0000-0000000006d1', 'invalid.jpg', repeat('a',64)), '42501', 'permission denied for function register_complaint_evidence', 'browser kan bewijsregistratie niet rechtstreeks aanroepen');
reset role;

set local role service_role;
select set_config('request.jwt.claims', '{"role":"service_role"}', true);
select throws_ok(format('select public.register_complaint_evidence(%L,%L,%L,10,%L)', (select complaint_id from phase6_state), '00000000-0000-0000-0000-0000000006d2', 'complaints/' || (select complaint_id from phase6_state)::text || '/11111111-1111-1111-1111-111111111111-' || repeat('a',64) || '.jpg', repeat('a',64)), 'P0001', 'complaint_actor_access_required', 'servicefunctie weigert onbevoegde bewijsactor');
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000006a1","role":"authenticated","aal":"aal1"}', true);
select throws_ok($$ select public.get_admin_complaint_state('40000000-0000-0000-0000-000000000601') $$, 'P0001', 'staff_aal2_required', 'beheer zonder MFA kan klachten niet lezen');
select throws_ok($$ select public.admin_update_complaint((select complaint_id from phase6_state), 'resolved', 'Fictieve klacht volledig afgehandeld.') $$, 'P0001', 'staff_aal2_required', 'beheer zonder MFA kan klacht niet sluiten');
select is(public.can_upload_complaint_evidence((select complaint_id from phase6_state)), false, 'beheer zonder MFA mag geen bewijsupload voorbereiden');
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000006a1","role":"authenticated","aal":"aal2"}', true);
select results_eq($$ select jsonb_array_length(public.get_admin_complaint_state('40000000-0000-0000-0000-000000000601')) $$, $$ values(1) $$, 'beheer met MFA ziet klacht');
select throws_ok($$ select public.admin_update_complaint((select complaint_id from phase6_state), 'resolved', 'Fictieve klacht volledig afgehandeld.') $$, 'P0001', 'independent_second_reviewer_required', 'platformklacht kan niet zonder tweede beoordeling sluiten');
select lives_ok($$ select public.admin_review_complaint((select complaint_id from phase6_state), 'Onafhankelijke fictieve controle van alle gebeurtenissen uitgevoerd.') $$, 'eerste medewerker legt onafhankelijke beoordeling vast');
select throws_ok($$ select public.admin_update_complaint((select complaint_id from phase6_state), 'resolved', 'Fictieve klacht volledig afgehandeld.') $$, 'P0001', 'independent_second_reviewer_required', 'dezelfde medewerker kan beoordeling niet zelf aftekenen');
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000006a2","role":"authenticated","aal":"aal2"}', true);
select lives_ok($$ select public.admin_update_complaint((select complaint_id from phase6_state), 'resolved', 'Fictieve klacht na tweede beoordeling afgehandeld.') $$, 'tweede medewerker rondt platformklacht af');
select results_eq($$ select count(*)::bigint from public.audit_log where entity_id=(select complaint_id from phase6_state) and action='complaint.status_changed' $$, $$ values(1::bigint) $$, 'klachtafhandeling heeft auditspoor');
select throws_ok($$ select public.add_complaint_message((select complaint_id from phase6_state), 'Een te laat vervolgbericht.') $$, 'P0001', 'complaint_closed', 'gesloten klacht accepteert geen bericht');
select throws_ok($$ select public.admin_update_complaint((select complaint_id from phase6_state), 'in_review', null) $$, 'P0001', 'complaint_closed', 'gesloten klacht kan niet stilzwijgend heropend worden');
select throws_ok($$ select public.admin_review_complaint((select complaint_id from phase6_state), 'Nog een beoordeling achteraf is niet toegestaan.') $$, 'P0001', 'independent_review_not_allowed', 'tweede beoordeling kan niet achteraf worden overschreven');
select is(public.can_upload_complaint_evidence((select complaint_id from phase6_state)), false, 'gesloten klacht accepteert geen bewijsupload');
select throws_ok($$ select public.admin_create_test_invoice_record('e0000000-0000-0000-0000-000000000601', 'credit_note', null, 'Fictieve correctie zonder bronfactuur.') $$, 'P0001', 'source_invoice_required', 'correctie zonder bronrecord wordt geweigerd');
update phase6_state set invoice_id = public.admin_create_test_invoice_record('e0000000-0000-0000-0000-000000000601', 'invoice', null, 'Testrecord omdat kosten en btw nog niet zijn vastgesteld.');
select is((select status from public.platform_invoice_records where id=(select invoice_id from phase6_state)), 'draft_blocked', 'factuurrecord blijft geblokkeerd concept');
select results_eq($$ select fee_gross_cents from public.platform_invoice_records where id=(select invoice_id from phase6_state) $$, $$ values(0::bigint) $$, 'geen behandelingskosten of btw worden verzonnen');
select lives_ok($$ select public.admin_create_test_invoice_record('e0000000-0000-0000-0000-000000000601', 'credit_note', (select invoice_id from phase6_state), 'Fictief correctierecord op geblokkeerd testdocument.') $$, 'correctie blijft apart van autokoop opgeslagen');
select throws_ok($$ select public.admin_create_test_invoice_record('e0000000-0000-0000-0000-000000000601', 'invoice', null, 'Tweede testfactuur voor dezelfde betaling.') $$, '23505', null, 'dubbele testfactuur wordt geweigerd');
update phase6_state set incident_id = public.admin_create_incident('high', 'Fictieve storing in betaalreconciliatie', 'Testbetalingen kunnen tijdelijk niet automatisch worden vergeleken.');
select ok((select incident_id is not null from phase6_state), 'beheer registreert operationeel incident');
select throws_ok($$ select public.admin_update_incident((select incident_id from phase6_state), 'resolved', 'te kort') $$, 'P0001', 'incident_resolution_required', 'incident vereist bruikbare oplossingstekst');
select lives_ok($$ select public.admin_update_incident((select incident_id from phase6_state), 'resolved', 'Fictieve oorzaak opgelost en reconciliatie opnieuw gecontroleerd.') $$, 'incident wordt herleidbaar opgelost');
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000006e1","role":"authenticated","aal":"aal1"}', true);
select throws_ok($$ select public.claim_notification_batch('11111111-1111-1111-1111-111111111111', 10) $$, '42501', 'permission denied for function claim_notification_batch', 'browser kan outbox-worker niet starten');
select results_eq($$ select count(*)::bigint from public.platform_invoice_records $$, $$ values(0::bigint) $$, 'verkoper kan conceptfactuurrecords niet rechtstreeks lezen');
reset role;

set local role service_role;
select set_config('request.jwt.claims', '{"role":"service_role"}', true);
update phase6_state set notification_id = (public.claim_notification_batch('11111111-1111-1111-1111-111111111111', 1)#>>'{0,id}')::uuid;
select ok((select notification_id is not null from phase6_state), 'service-worker claimt één bericht met lease');
select throws_ok($$ select public.complete_notification_delivery((select notification_id from phase6_state), '22222222-2222-2222-2222-222222222222', true, null) $$, 'P0001', 'notification_lease_not_owned', 'andere worker kan lease niet voltooien');
select lives_ok($$ select public.complete_notification_delivery((select notification_id from phase6_state), '11111111-1111-1111-1111-111111111111', false, 'fictieve_transportfout') $$, 'mislukte bezorging blijft bewaard voor retry');
select is((select status::text from public.notification_outbox where id=(select notification_id from phase6_state)), 'failed', 'mislukte outboxregel krijgt failed-status');
update public.notification_outbox set next_attempt_at = now() where id=(select notification_id from phase6_state);
update public.notification_outbox set next_attempt_at = now() + interval '1 hour' where id<>(select notification_id from phase6_state) and status in ('pending', 'failed');
select results_eq($$ select jsonb_array_length(public.claim_notification_batch('11111111-1111-1111-1111-111111111111', 1)) $$, $$ values(1) $$, 'retry claimt dezelfde regel opnieuw');
select lives_ok($$ select public.complete_notification_delivery((select notification_id from phase6_state), '11111111-1111-1111-1111-111111111111', true, null) $$, 'geslaagde retry markeert verzonden');
select results_eq($$ select attempt_count from public.notification_outbox where id=(select notification_id from phase6_state) $$, $$ values(2) $$, 'pogingsteller registreert beide claims');
update phase6_state set operation_id = public.start_operation_run('outbox_delivery', '11111111-1111-1111-1111-111111111111');
select lives_ok($$ select public.finish_operation_run((select operation_id from phase6_state), 'completed', 1, 0, '{"test":true}'::jsonb) $$, 'operationele run wordt afgerond');
select lives_ok($$ select public.record_local_recovery_test('completed', true, true, 12, 1, '{"synthetic":true}'::jsonb, now() - interval '1 minute') $$, 'lokale herstelproef kan als bewijsrecord worden vastgelegd');
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000006a2","role":"authenticated","aal":"aal2"}', true);
select is(public.get_admin_operations_dashboard()#>>'{lastRecoveryTest,status}', 'completed', 'operationeel dashboard toont laatste herstelproef');
select is(public.get_admin_operations_dashboard()#>>'{lastOutboxRun,status}', 'completed', 'operationeel dashboard toont outbox-run');
select results_eq($$ select count(*)::bigint from public.audit_log where action like 'incident.%' $$, $$ values(2::bigint) $$, 'incident openen en sluiten zijn geaudit');
reset role;

select ok((select count(*) >= 1 from public.notification_outbox where entity_id=(select complaint_id from phase6_state) and event_type='complaint.updated' and recipient='seller61@example.test'), 'klachtupdate voor verkoper staat duurzaam in outbox');
select ok((select count(*) >= 1 from public.notification_outbox where entity_id=(select complaint_id from phase6_state) and event_type='complaint.updated' and recipient='dealer61@example.test'), 'klachtupdate voor koper staat duurzaam in outbox');

-- Tweede winnaarreservering zonder betaalorder: no-showmelding mag niet op checkout wachten.
insert into public.vehicles(id, registration_normalized, make, model, year)
values('30000000-0000-0000-0000-000000000602', '67TEST', 'TESTMERK', 'GEENBETALING', 2023);
insert into public.applications(id, seller_contact_id, vehicle_id, status, submitted_at)
values('40000000-0000-0000-0000-000000000602', '20000000-0000-0000-0000-000000000601', '30000000-0000-0000-0000-000000000602', 'ready', now());
insert into public.vehicle_revisions(id, vehicle_id, revision_number, snapshot)
values('50000000-0000-0000-0000-000000000602', '30000000-0000-0000-0000-000000000602', 1, '{"vehicle":{"registration":"67TEST"}}');
insert into public.listings(id, application_id, vehicle_revision_id, status, published_at)
values('60000000-0000-0000-0000-000000000602', '40000000-0000-0000-0000-000000000602', '50000000-0000-0000-0000-000000000602', 'withdrawn', now());
insert into public.bid_rounds(id, listing_id, status, starts_at, ends_at, closed_at, outcome_status)
values('70000000-0000-0000-0000-000000000602', '60000000-0000-0000-0000-000000000602', 'closed', now() - interval '2 days', now() - interval '1 day', now(), 'closed_with_winner');
insert into public.bids(id, bid_round_id, company_id, placed_by, amount_cents, idempotency_key)
values('80000000-0000-0000-0000-000000000602', '70000000-0000-0000-0000-000000000602', '10000000-0000-0000-0000-0000000006d1', '00000000-0000-0000-0000-0000000006d1', 900000, '81000000-0000-0000-0000-000000000602');
insert into public.winner_reservations(id, bid_round_id, bid_id, company_id, amount_cents)
values('90000000-0000-0000-0000-000000000602', '70000000-0000-0000-0000-000000000602', '80000000-0000-0000-0000-000000000602', '10000000-0000-0000-0000-0000000006d1', 900000);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000006d1","role":"authenticated","aal":"aal2"}', true);
select results_eq($$ select (public.dealer_open_complaint_for_reservation('90000000-0000-0000-0000-000000000602', 'appointment', 'De verkoper verscheen niet bij de afspraak; er is nog geen betaling.', 'f0000000-0000-0000-0000-000000000608')->>'created')::boolean $$, $$ values(true) $$, 'winnaar kan vóór betaalorder een no-showmelding openen');
select is((select payment_order_id from public.complaints where complainant_user_id='00000000-0000-0000-0000-0000000006d1' and idempotency_key='f0000000-0000-0000-0000-000000000608'), null, 'no-showklacht heeft bewust geen betaalorder');
select results_eq($$ select (public.dealer_open_complaint_for_reservation('90000000-0000-0000-0000-000000000601', 'appointment', 'De gewonnen afspraak kon niet doorgaan; dit is een fictieve testklacht.', 'f0000000-0000-0000-0000-000000000606')->>'created')::boolean $$, $$ values(true) $$, 'winnaar kan een afspraakklacht op reservering openen');
select results_eq($$ select (public.dealer_open_complaint_for_reservation('90000000-0000-0000-0000-000000000601', 'appointment', 'De gewonnen afspraak kon niet doorgaan; dit is een fictieve testklacht.', 'f0000000-0000-0000-0000-000000000606')->>'created')::boolean $$, $$ values(false) $$, 'herhaalde reserveringsklacht is idempotent');
select throws_ok($$ select public.dealer_open_complaint_for_reservation('90000000-0000-0000-0000-000000000601', 'other', 'Dezelfde sleutel mag geen andere klacht openen in deze proef.', 'f0000000-0000-0000-0000-000000000606') $$, 'P0001', 'idempotency_conflict', 'zelfde sleutel met andere inhoud wordt geweigerd');
reset role;

set local role service_role;
select set_config('request.jwt.claims', '{"role":"service_role"}', true);
select throws_ok(format('select public.register_complaint_evidence(%L,%L,%L,10,%L)', (select complaint_id from phase6_state), '00000000-0000-0000-0000-0000000006d1', 'complaints/' || (select complaint_id from phase6_state)::text || '/11111111-1111-1111-1111-111111111111-' || repeat('a',64) || '.jpg', repeat('a',64)), 'P0001', 'complaint_closed', 'servicefunctie weigert bewijs na sluiting');
reset role;

update public.companies set status = 'blocked' where id = '10000000-0000-0000-0000-0000000006d1';
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000006d1","role":"authenticated","aal":"aal2"}', true);
select is(public.can_upload_complaint_evidence((select complaint_id from phase6_state)), false, 'geblokkeerde dealer mag geen bewijs voorbereiden');
select throws_ok($$ select public.dealer_open_complaint_for_reservation('90000000-0000-0000-0000-000000000601', 'appointment', 'Een geblokkeerd bedrijf mag geen klacht op een reservering openen.', 'f0000000-0000-0000-0000-000000000607') $$, 'P0001', 'approved_company_required', 'geblokkeerde dealer kan geen reserveringsklacht openen');
reset role;

select * from finish();
rollback;
