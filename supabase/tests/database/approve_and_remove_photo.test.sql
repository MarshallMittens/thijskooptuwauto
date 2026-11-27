begin;
create extension if not exists pgtap with schema extensions;
select plan(47);
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
update public.applications set status='submitted' where id='e1110000-0000-0000-0000-000000000001';
insert into public.applications(id,seller_contact_id,vehicle_id,status) values('e1110000-0000-0000-0000-000000000002','c1110000-0000-0000-0000-000000000001','d1110000-0000-0000-0000-000000000001','submitted');
insert into public.condition_reports(application_id,mileage_km) values('e1110000-0000-0000-0000-000000000001',null),('e1110000-0000-0000-0000-000000000002',12345);
insert into public.vehicle_photos(id,application_id,storage_path,media_type,size_bytes,sha256,review_status,sort_order) values
('51110000-0000-0000-0000-000000000001','e1110000-0000-0000-0000-000000000001','applications/e1110000-0000-0000-0000-000000000001/one.jpg','image/jpeg',100,'fake1','pending',0),
('51110000-0000-0000-0000-000000000002','e1110000-0000-0000-0000-000000000001','applications/e1110000-0000-0000-0000-000000000001/two.jpg','image/jpeg',100,'fake2','pending',1),
('51110000-0000-0000-0000-000000000003','e1110000-0000-0000-0000-000000000001','applications/e1110000-0000-0000-0000-000000000001/three.jpg','image/jpeg',100,'fake3','rejected',2),
('51110000-0000-0000-0000-000000000004','e1110000-0000-0000-0000-000000000002','applications/e1110000-0000-0000-0000-000000000002/one.jpg','image/jpeg',100,'fake4','rejected',0);
insert into storage.objects(bucket_id,name) values('vehicle-photos','applications/e1110000-0000-0000-0000-000000000001/one.jpg');

set local role anon;
select set_config('request.jwt.claims','{"role":"anon"}',true);
select throws_ok($$select public.admin_approve_and_publish_application('e1110000-0000-0000-0000-000000000001')$$,'42501',null,'anon kan geen auto goedkeuren');
select throws_ok($$select public.admin_remove_application_photo('e1110000-0000-0000-0000-000000000001','51110000-0000-0000-0000-000000000002')$$,'42501',null,'anon kan geen foto verwijderen');
reset role;
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"a1110000-0000-0000-0000-000000000003","role":"authenticated"}',true);
select throws_ok($$select public.admin_approve_and_publish_application('e1110000-0000-0000-0000-000000000001')$$,'P0001','staff_required','dealer kan geen auto goedkeuren');
select throws_ok($$select public.admin_remove_application_photo('e1110000-0000-0000-0000-000000000001','51110000-0000-0000-0000-000000000002')$$,'P0001','staff_required','dealer kan geen foto verwijderen');
select set_config('request.jwt.claims','{"sub":"a1110000-0000-0000-0000-000000000009","role":"authenticated"}',true);
select throws_ok($$select public.admin_approve_and_publish_application('e1110000-0000-0000-0000-000000000001')$$,'P0001','staff_required','geblokkeerde admin geen goedkeuring');
select throws_ok($$select public.admin_remove_application_photo('e1110000-0000-0000-0000-000000000001','51110000-0000-0000-0000-000000000002')$$,'P0001','staff_required','geblokkeerde admin geen fotowijziging');
select set_config('request.jwt.claims','{"sub":"a1110000-0000-0000-0000-000000000001","role":"anon"}',true);
select throws_ok($$select public.admin_approve_and_publish_application('e1110000-0000-0000-0000-000000000001')$$,'P0001','staff_required','ongeldige JWT-rol geweigerd');
select set_config('request.jwt.claims','{"sub":"a1110000-0000-0000-0000-000000000001","role":"authenticated","aal":"aal1"}',true);
select throws_ok($$select public.admin_remove_application_photo('e1110000-0000-0000-0000-000000000002','51110000-0000-0000-0000-000000000001')$$,'P0001','photo_not_found','foto moet bij de opgegeven aanvraag horen');
select throws_ok($$select public.admin_approve_and_publish_application('ffffffff-ffff-ffff-ffff-ffffffffffff')$$,'P0001','application_not_found','onbekende aanvraag geweigerd');
select throws_ok($$select public.admin_approve_and_publish_application('e1110000-0000-0000-0000-000000000001')$$,'P0001','application_incomplete','ontbrekende kilometerstand blokkeert publicatie');
select is((select status::text from public.applications where id='e1110000-0000-0000-0000-000000000001'),'submitted','onvolledige aanvraag blijft ongewijzigd');
select is((select review_status::text from public.vehicle_photos where id='51110000-0000-0000-0000-000000000001'),'pending','onvolledige aanvraag keurt foto niet goed');
select lives_ok($$select public.admin_remove_application_photo('e1110000-0000-0000-0000-000000000001','51110000-0000-0000-0000-000000000002')$$,'beheer verwijdert foto');
select lives_ok($$select public.admin_remove_application_photo('e1110000-0000-0000-0000-000000000001','51110000-0000-0000-0000-000000000002')$$,'verwijderen is idempotent');
select is((select count(*) from public.audit_log where action='photo.removed' and entity_id='51110000-0000-0000-0000-000000000002'),1::bigint,'verwijdering eenmaal geaudit');
select ok((select removed_at is not null and removed_by=auth.uid() from public.vehicle_photos where id='51110000-0000-0000-0000-000000000002'),'tijd en actor opgeslagen');
select is(jsonb_array_length(public.get_admin_application('e1110000-0000-0000-0000-000000000001')->'photos'),2,'verwijderde foto verdwijnt uit beheer');
select is((select (item->>'photoCount')::integer from jsonb_array_elements(public.list_admin_applications()) item where item->>'id'='e1110000-0000-0000-0000-000000000001'),2,'fototeller telt verwijderde foto niet');
select throws_ok($$select public.admin_set_photo_review('51110000-0000-0000-0000-000000000002','approved')$$,'23514',null,'verwijderde foto kan niet opnieuw worden goedgekeurd');
reset role;
update public.condition_reports set mileage_km=12345 where application_id='e1110000-0000-0000-0000-000000000001';
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"a1110000-0000-0000-0000-000000000001","role":"authenticated","aal":"aal1"}',true);
select lives_ok($$select public.admin_approve_and_publish_application('e1110000-0000-0000-0000-000000000001')$$,'een handeling keurt goed en publiceert zonder verkopersverificatie');
select is((select status::text from public.applications where id='e1110000-0000-0000-0000-000000000001'),'ready','aanvraag is gereed');
select ok((select approved_at is not null and approved_by=auth.uid() from public.applications where id='e1110000-0000-0000-0000-000000000001'),'beheerdersgoedkeuring vastgelegd');
select is((select review_status::text from public.vehicle_photos where id='51110000-0000-0000-0000-000000000001'),'approved','pending foto mee goedgekeurd');
select is((select review_status::text from public.vehicle_photos where id='51110000-0000-0000-0000-000000000002'),'rejected','verwijderde foto blijft afgewezen');
select is((select review_status::text from public.vehicle_photos where id='51110000-0000-0000-0000-000000000003'),'rejected','eerder afgewezen foto niet alsnog goedgekeurd');
reset role;
select is((select count(*) from public.seller_application_access where application_id='e1110000-0000-0000-0000-000000000001'),0::bigint,'geen verkoperstoegang of valse verificatie aangemaakt');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"a1110000-0000-0000-0000-000000000001","role":"authenticated","aal":"aal1"}',true);
select is((public.get_admin_seller_verification('e1110000-0000-0000-0000-000000000001')->>'verified')::boolean,false,'mailadres niet als geverifieerd gemarkeerd');
select is((select count(*) from public.listings where application_id='e1110000-0000-0000-0000-000000000001' and status='published'),1::bigint,'precies een publicatie');
select is((select extract(epoch from br.ends_at-br.starts_at)::bigint from public.bid_rounds br join public.listings l on l.id=br.listing_id where l.application_id='e1110000-0000-0000-0000-000000000001'),86400::bigint,'biedronde exact 24 uur');
select is((public.admin_approve_and_publish_application('e1110000-0000-0000-0000-000000000001')->>'created')::boolean,false,'herhaald goedkeuren geen tweede veiling');
select is((select count(*) from public.audit_log where action='application.approved_and_published' and entity_id='e1110000-0000-0000-0000-000000000001'),1::bigint,'goedkeuring eenmaal geaudit');
select is((select count(*) from public.notification_outbox where event_type='listing.published' and entity_id in(select id from public.listings where application_id='e1110000-0000-0000-0000-000000000001')),2::bigint,'alle goedgekeurde garages krijgen een aanbodmelding in de wachtrij');
select throws_ok($$select public.admin_remove_application_photo('e1110000-0000-0000-0000-000000000001','51110000-0000-0000-0000-000000000001')$$,'P0001','last_published_photo_required','laatste gepubliceerde foto beschermd');
select is((select removed_at from public.vehicle_photos where id='51110000-0000-0000-0000-000000000001'),null::timestamptz,'geweigerde verwijdering laat foto staan');
select throws_ok($$select public.admin_approve_and_publish_application('e1110000-0000-0000-0000-000000000002')$$,'P0001','approved_photo_required','alleen afgewezen fotos blokkeert publicatie');
reset role;
-- Inject a local-only publication failure to prove the entire transaction rolls back.
update public.vehicle_photos set review_status='pending' where id='51110000-0000-0000-0000-000000000004';
create function public.test_fail_approval_publish() returns trigger language plpgsql as $test$ begin if new.application_id='e1110000-0000-0000-0000-000000000002'::uuid then raise exception 'fictitious_publication_failure'; end if; return new; end; $test$;
create trigger test_fail_approval_publish before insert on public.listings for each row execute function public.test_fail_approval_publish();
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"a1110000-0000-0000-0000-000000000001","role":"authenticated","aal":"aal1"}',true);
select throws_ok($$select public.admin_approve_and_publish_application('e1110000-0000-0000-0000-000000000002')$$,'P0001','fictitious_publication_failure','publicatiefout wordt veilig geweigerd');
select is((select status::text from public.applications where id='e1110000-0000-0000-0000-000000000002'),'submitted','publicatiefout draait statusstappen terug');
select is((select approved_at from public.applications where id='e1110000-0000-0000-0000-000000000002'),null::timestamptz,'publicatiefout draait goedkeurmarkering terug');
select is((select review_status::text from public.vehicle_photos where id='51110000-0000-0000-0000-000000000004'),'pending','publicatiefout draait fotogoedkeuring terug');
reset role;
drop trigger test_fail_approval_publish on public.listings;
drop function public.test_fail_approval_publish();
insert into public.vehicle_photos(application_id,vehicle_revision_id,storage_path,media_type,size_bytes,sha256,review_status,sort_order)
select 'e1110000-0000-0000-0000-000000000001',vehicle_revision_id,'applications/e1110000-0000-0000-0000-000000000001/replacement.jpg','image/jpeg',100,'fake5','approved',3 from public.listings where application_id='e1110000-0000-0000-0000-000000000001';
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"a1110000-0000-0000-0000-000000000001","role":"authenticated","aal":"aal1"}',true);
select lives_ok($$select public.admin_remove_application_photo('e1110000-0000-0000-0000-000000000001','51110000-0000-0000-0000-000000000001')$$,'gepubliceerde foto weghalen wanneer andere foto overblijft');
select set_config('request.jwt.claims','{"sub":"a1110000-0000-0000-0000-000000000003","role":"authenticated"}',true);
select is(jsonb_array_length(public.list_dealer_listings(null,null,null)),1,'dealer ziet goedgekeurde auto');
select is(jsonb_array_length(public.get_dealer_listing((select id from public.listings where application_id='e1110000-0000-0000-0000-000000000001'))->'photos'),1,'dealer ziet alleen overgebleven goedgekeurde foto');
select is((select count(*) from public.vehicle_photos where id in('51110000-0000-0000-0000-000000000001','51110000-0000-0000-0000-000000000002')),0::bigint,'dealer RLS weigert verwijderde fotoregels');
select is((select count(*) from storage.objects where name='applications/e1110000-0000-0000-0000-000000000001/one.jpg'),0::bigint,'dealer kan verwijderde foto niet opnieuw signeren');
select set_config('request.jwt.claims','{"sub":"a1110000-0000-0000-0000-000000000001","role":"authenticated","aal":"aal1"}',true);
select lives_ok($$select public.admin_archive_application('e1110000-0000-0000-0000-000000000001','Fictieve auto voor deze test archiveren.')$$,'archiveren na goedkeuren blijft werken');
select throws_ok($$select public.admin_approve_and_publish_application('e1110000-0000-0000-0000-000000000001')$$,'P0001','application_archived','archief niet via goedkeuren herpubliceren');
select lives_ok($$select public.admin_remove_application_photo('e1110000-0000-0000-0000-000000000001',(select id from public.vehicle_photos where application_id='e1110000-0000-0000-0000-000000000001' and removed_at is null and review_status='approved'))$$,'laatste foto mag weg zodra auto uit aanbod is');

select * from finish();
rollback;
