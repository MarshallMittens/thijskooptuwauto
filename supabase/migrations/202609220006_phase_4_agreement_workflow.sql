create table public.agreement_terms_versions (
  id uuid primary key default gen_random_uuid(),
  version text not null unique,
  status text not null check (status in ('test', 'approved', 'retired')),
  document_reference text not null,
  approved_by uuid references public.profiles(id),
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  check (status <> 'approved' or (approved_by is not null and approved_at is not null))
);

insert into public.agreement_terms_versions (version, status, document_reference)
values ('phase4-concept-v1', 'test', 'Conceptvoorwaarden; niet juridisch goedgekeurd en niet voor productiegebruik');

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  winner_reservation_id uuid not null unique references public.winner_reservations(id),
  application_id uuid not null references public.applications(id),
  status text not null default 'proposed' check (status in ('proposed', 'alternative_requested', 'confirmed', 'declined', 'cancelled', 'attended', 'no_show')),
  selected_slot timestamptz,
  seller_note text check (seller_note is null or char_length(seller_note) <= 1000),
  response_due_at timestamptz,
  seller_responded_at timestamptz,
  confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.appointment_proposals (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  proposed_by uuid not null references public.profiles(id),
  proposed_slots timestamptz[] not null,
  status text not null default 'active' check (status in ('active', 'superseded', 'accepted')),
  idempotency_key uuid not null,
  created_at timestamptz not null default now(),
  unique (proposed_by, idempotency_key),
  check (cardinality(proposed_slots) between 1 and 3)
);

create unique index appointment_one_active_proposal_idx
on public.appointment_proposals (appointment_id)
where status = 'active';

create table public.inspections (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null unique references public.appointments(id),
  application_id uuid not null references public.applications(id),
  company_id uuid not null references public.companies(id),
  status text not null check (status in ('completed', 'no_show')),
  mileage_km integer check (mileage_km is null or mileage_km between 0 and 5000000),
  findings text check (findings is null or char_length(findings) <= 4000),
  deviation_description text check (deviation_description is null or char_length(deviation_description) <= 4000),
  inspected_at timestamptz not null,
  created_by uuid not null references public.profiles(id),
  idempotency_key uuid not null,
  created_at timestamptz not null default now(),
  unique (created_by, idempotency_key)
);

create table public.inspection_photos (
  id uuid primary key default gen_random_uuid(),
  inspection_id uuid not null references public.inspections(id) on delete cascade,
  storage_path text not null unique,
  media_type text not null default 'image/jpeg' check (media_type = 'image/jpeg'),
  size_bytes bigint not null check (size_bytes between 1 and 10485760),
  sha256 text not null check (sha256 ~ '^[0-9a-f]{64}$'),
  uploaded_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.price_adjustment_proposals (
  id uuid primary key default gen_random_uuid(),
  inspection_id uuid not null unique references public.inspections(id),
  original_bid_cents bigint not null check (original_bid_cents > 0),
  proposed_price_cents bigint not null check (proposed_price_cents > 0),
  reason text not null check (char_length(reason) between 10 and 2000),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  seller_responded_at timestamptz,
  created_at timestamptz not null default now(),
  check (proposed_price_cents <> original_bid_cents)
);

create table public.sale_agreements (
  id uuid primary key default gen_random_uuid(),
  winner_reservation_id uuid not null unique references public.winner_reservations(id),
  inspection_id uuid not null unique references public.inspections(id),
  application_id uuid not null references public.applications(id),
  vehicle_revision_id uuid not null references public.vehicle_revisions(id),
  original_bid_cents bigint not null check (original_bid_cents > 0),
  agreed_price_cents bigint not null check (agreed_price_cents > 0),
  price_adjustment_proposal_id uuid references public.price_adjustment_proposals(id),
  terms_version text not null references public.agreement_terms_versions(version),
  terms_status text not null check (terms_status in ('test', 'approved')),
  status text not null default 'awaiting_confirmations' check (status in ('awaiting_confirmations', 'agreed', 'declined', 'disputed')),
  dealer_confirmed_at timestamptz,
  seller_confirmed_at timestamptz,
  dealer_declined_at timestamptz,
  seller_declined_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workflow_tasks (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id),
  task_type text not null,
  status text not null default 'open' check (status in ('open', 'done', 'cancelled')),
  due_at timestamptz,
  details jsonb not null default '{}'::jsonb,
  idempotency_key text not null unique,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

revoke all on public.agreement_terms_versions, public.appointments, public.appointment_proposals,
  public.inspections, public.inspection_photos, public.price_adjustment_proposals,
  public.sale_agreements, public.workflow_tasks from public, anon, authenticated;

grant select on public.agreement_terms_versions, public.appointments, public.appointment_proposals,
  public.inspections, public.inspection_photos, public.price_adjustment_proposals,
  public.sale_agreements, public.workflow_tasks to authenticated;

alter table public.agreement_terms_versions enable row level security;
alter table public.appointments enable row level security;
alter table public.appointment_proposals enable row level security;
alter table public.inspections enable row level security;
alter table public.inspection_photos enable row level security;
alter table public.price_adjustment_proposals enable row level security;
alter table public.sale_agreements enable row level security;
alter table public.workflow_tasks enable row level security;

create policy phase4_terms_staff_read on public.agreement_terms_versions for select to authenticated
using (private.is_staff() and auth.jwt()->>'aal' = 'aal2');
create policy phase4_appointments_staff_read on public.appointments for select to authenticated
using (private.is_staff() and auth.jwt()->>'aal' = 'aal2');
create policy phase4_proposals_staff_read on public.appointment_proposals for select to authenticated
using (private.is_staff() and auth.jwt()->>'aal' = 'aal2');
create policy phase4_inspections_staff_read on public.inspections for select to authenticated
using (private.is_staff() and auth.jwt()->>'aal' = 'aal2');
create policy phase4_photos_staff_read on public.inspection_photos for select to authenticated
using (private.is_staff() and auth.jwt()->>'aal' = 'aal2');
create policy phase4_adjustments_staff_read on public.price_adjustment_proposals for select to authenticated
using (private.is_staff() and auth.jwt()->>'aal' = 'aal2');
create policy phase4_agreements_staff_read on public.sale_agreements for select to authenticated
using (private.is_staff() and auth.jwt()->>'aal' = 'aal2');
create policy phase4_tasks_staff_read on public.workflow_tasks for select to authenticated
using (private.is_staff() and auth.jwt()->>'aal' = 'aal2');

create or replace function private.seller_owns_application(p_application_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select auth.uid() is not null and exists (
    select 1 from public.seller_application_access access
    where access.application_id = p_application_id and access.user_id = auth.uid()
  );
$$;

create or replace function private.create_phase4_sale_agreement(
  p_inspection_id uuid,
  p_agreed_price_cents bigint,
  p_adjustment_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_inspection public.inspections;
  v_appointment public.appointments;
  v_reservation public.winner_reservations;
  v_round public.bid_rounds;
  v_listing public.listings;
  v_terms public.agreement_terms_versions;
  v_agreement_id uuid;
begin
  select * into v_inspection from public.inspections where id = p_inspection_id;
  if not found or v_inspection.status <> 'completed' then raise exception 'completed_inspection_required'; end if;
  select * into v_appointment from public.appointments where id = v_inspection.appointment_id;
  select * into v_reservation from public.winner_reservations where id = v_appointment.winner_reservation_id;
  select * into v_round from public.bid_rounds where id = v_reservation.bid_round_id;
  select * into v_listing from public.listings where id = v_round.listing_id;

  if p_agreed_price_cents is null or p_agreed_price_cents <= 0 then raise exception 'invalid_agreement_price'; end if;
  if p_adjustment_id is null and p_agreed_price_cents <> v_reservation.amount_cents then
    raise exception 'price_adjustment_required';
  end if;
  if p_adjustment_id is not null and not exists (
    select 1 from public.price_adjustment_proposals p
    where p.id = p_adjustment_id and p.inspection_id = p_inspection_id
      and p.status = 'accepted' and p.proposed_price_cents = p_agreed_price_cents
  ) then raise exception 'accepted_adjustment_required'; end if;

  select * into v_terms from public.agreement_terms_versions
  where status in ('test', 'approved')
  order by (status = 'approved') desc, created_at desc
  limit 1;
  if not found then raise exception 'agreement_terms_missing'; end if;

  insert into public.sale_agreements (
    winner_reservation_id, inspection_id, application_id, vehicle_revision_id,
    original_bid_cents, agreed_price_cents, price_adjustment_proposal_id,
    terms_version, terms_status
  ) values (
    v_reservation.id, v_inspection.id, v_inspection.application_id, v_listing.vehicle_revision_id,
    v_reservation.amount_cents, p_agreed_price_cents, p_adjustment_id,
    v_terms.version, v_terms.status
  )
  on conflict (winner_reservation_id) do update
    set updated_at = public.sale_agreements.updated_at
  returning id into v_agreement_id;
  return v_agreement_id;
end;
$$;

create or replace function public.dealer_propose_appointment(
  p_winner_reservation_id uuid,
  p_slots timestamptz[],
  p_idempotency_key uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_company_id uuid := private.current_approved_company_id();
  v_reservation public.winner_reservations;
  v_round public.bid_rounds;
  v_listing public.listings;
  v_application public.applications;
  v_appointment public.appointments;
  v_existing public.appointment_proposals;
  v_proposal_id uuid;
  v_email text;
  v_now timestamptz := clock_timestamp();
begin
  if v_company_id is null then raise exception 'approved_company_required'; end if;
  if cardinality(p_slots) not between 1 and 3
    or (select count(distinct slot) from unnest(p_slots) slot) <> cardinality(p_slots)
    or exists (select 1 from unnest(p_slots) slot where slot < v_now + interval '15 minutes' or slot > v_now + interval '30 days')
  then raise exception 'invalid_appointment_slots'; end if;

  select * into v_reservation from public.winner_reservations
  where id = p_winner_reservation_id and company_id = v_company_id and status = 'reserved'
  for update;
  if not found then raise exception 'winner_reservation_required'; end if;

  select * into v_existing from public.appointment_proposals
  where proposed_by = v_user_id and idempotency_key = p_idempotency_key;
  if found then
    if v_existing.appointment_id is distinct from (select id from public.appointments where winner_reservation_id = p_winner_reservation_id)
      or v_existing.proposed_slots is distinct from p_slots
    then raise exception 'idempotency_conflict'; end if;
    return jsonb_build_object('appointment_id', v_existing.appointment_id, 'proposal_id', v_existing.id, 'created', false);
  end if;

  select * into v_round from public.bid_rounds where id = v_reservation.bid_round_id;
  if v_round.outcome_status <> 'closed_with_winner' then raise exception 'closed_winner_required'; end if;
  select * into v_listing from public.listings where id = v_round.listing_id;
  select * into v_application from public.applications where id = v_listing.application_id;

  select * into v_appointment from public.appointments
  where winner_reservation_id = p_winner_reservation_id
  for update;
  if not found then
    insert into public.appointments (winner_reservation_id, application_id, status, response_due_at)
    values (p_winner_reservation_id, v_application.id, 'proposed', v_now + interval '24 hours')
    returning * into v_appointment;
  elsif v_appointment.status <> 'alternative_requested' then
    raise exception 'appointment_proposal_not_allowed';
  else
    update public.appointment_proposals set status = 'superseded'
    where appointment_id = v_appointment.id and status = 'active';
    update public.appointments set status = 'proposed', response_due_at = v_now + interval '24 hours', updated_at = v_now
    where id = v_appointment.id returning * into v_appointment;
  end if;

  insert into public.appointment_proposals (appointment_id, proposed_by, proposed_slots, idempotency_key)
  values (v_appointment.id, v_user_id, p_slots, p_idempotency_key)
  returning id into v_proposal_id;

  select s.email into v_email from public.seller_contacts s where s.id = v_application.seller_contact_id;
  insert into public.notification_outbox (event_type, entity_type, entity_id, recipient, payload, idempotency_key)
  values ('appointment.proposed', 'appointment', v_appointment.id, v_email,
    jsonb_build_object('application_id', v_application.id, 'proposal_id', v_proposal_id, 'response_due_at', v_appointment.response_due_at),
    'appointment.proposed:' || v_proposal_id::text);
  insert into public.audit_log (actor_id, action, entity_type, entity_id, after_data, request_id)
  values (v_user_id, 'appointment.proposed', 'appointment', v_appointment.id,
    jsonb_build_object('application_id', v_application.id, 'proposal_id', v_proposal_id, 'slot_count', cardinality(p_slots)), p_idempotency_key);

  return jsonb_build_object('appointment_id', v_appointment.id, 'proposal_id', v_proposal_id, 'created', true);
end;
$$;

create or replace function public.seller_respond_appointment(
  p_application_id uuid,
  p_appointment_id uuid,
  p_action text,
  p_selected_slot timestamptz default null,
  p_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_appointment public.appointments;
  v_proposal public.appointment_proposals;
  v_company public.companies;
  v_now timestamptz := clock_timestamp();
begin
  if not private.seller_owns_application(p_application_id) then raise exception 'application_access_denied'; end if;
  if p_action not in ('confirm', 'alternative', 'decline') then raise exception 'invalid_appointment_action'; end if;
  if char_length(coalesce(p_note, '')) > 1000 then raise exception 'invalid_appointment_note'; end if;

  select * into v_appointment from public.appointments
  where id = p_appointment_id and application_id = p_application_id
  for update;
  if not found then raise exception 'appointment_not_found'; end if;
  if v_appointment.status <> 'proposed' then raise exception 'appointment_response_not_allowed'; end if;
  select * into v_proposal from public.appointment_proposals
  where appointment_id = v_appointment.id and status = 'active'
  for update;
  if not found then raise exception 'active_proposal_missing'; end if;

  if p_action = 'confirm' then
    if p_selected_slot is null or not (p_selected_slot = any(v_proposal.proposed_slots)) then raise exception 'invalid_selected_slot'; end if;
    update public.appointments set status = 'confirmed', selected_slot = p_selected_slot,
      seller_note = nullif(trim(p_note), ''), seller_responded_at = v_now, confirmed_at = v_now, updated_at = v_now
    where id = v_appointment.id;
    update public.appointment_proposals set status = 'accepted' where id = v_proposal.id;
  elsif p_action = 'alternative' then
    if coalesce(char_length(trim(p_note)) between 3 and 1000, false) is not true then raise exception 'alternative_note_required'; end if;
    update public.appointments set status = 'alternative_requested', selected_slot = null,
      seller_note = trim(p_note), seller_responded_at = v_now, updated_at = v_now
    where id = v_appointment.id;
    insert into public.workflow_tasks (application_id, task_type, details, idempotency_key)
    values (p_application_id, 'appointment_alternative_requested', jsonb_build_object('appointment_id', v_appointment.id), 'appointment.alternative:' || v_proposal.id::text)
    on conflict (idempotency_key) do nothing;
  else
    update public.appointments set status = 'declined', selected_slot = null,
      seller_note = nullif(trim(p_note), ''), seller_responded_at = v_now, updated_at = v_now
    where id = v_appointment.id;
    insert into public.workflow_tasks (application_id, task_type, details, idempotency_key)
    values (p_application_id, 'appointment_declined', jsonb_build_object('appointment_id', v_appointment.id), 'appointment.declined:' || v_appointment.id::text)
    on conflict (idempotency_key) do nothing;
  end if;

  select c.* into v_company
  from public.winner_reservations wr join public.companies c on c.id = wr.company_id
  where wr.id = v_appointment.winner_reservation_id;
  insert into public.notification_outbox (event_type, entity_type, entity_id, recipient, payload, idempotency_key)
  values ('appointment.seller_response', 'appointment', v_appointment.id, v_company.email,
    jsonb_build_object('application_id', p_application_id, 'action', p_action, 'selected_slot', p_selected_slot),
    'appointment.seller_response:' || v_proposal.id::text);
  insert into public.audit_log (actor_id, action, entity_type, entity_id, after_data)
  values (auth.uid(), 'appointment.seller_' || p_action, 'appointment', v_appointment.id,
    jsonb_build_object('application_id', p_application_id, 'selected_slot', p_selected_slot));

  return jsonb_build_object('appointment_id', v_appointment.id, 'status', case p_action when 'confirm' then 'confirmed' when 'alternative' then 'alternative_requested' else 'declined' end);
end;
$$;

create or replace function public.dealer_record_inspection(
  p_appointment_id uuid,
  p_status text,
  p_mileage_km integer,
  p_findings text,
  p_deviation_description text,
  p_proposed_price_cents bigint,
  p_adjustment_reason text,
  p_inspected_at timestamptz,
  p_idempotency_key uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_company_id uuid := private.current_approved_company_id();
  v_appointment public.appointments;
  v_reservation public.winner_reservations;
  v_existing public.inspections;
  v_inspection_id uuid;
  v_adjustment_id uuid;
  v_agreement_id uuid;
  v_seller_email text;
begin
  if v_company_id is null then raise exception 'approved_company_required'; end if;
  if p_status not in ('completed', 'no_show') then raise exception 'invalid_inspection_status'; end if;
  if p_inspected_at is null or p_inspected_at > clock_timestamp() + interval '5 minutes' then raise exception 'invalid_inspection_time'; end if;
  if p_status = 'completed' and (
    p_mileage_km not between 0 and 5000000
    or coalesce(char_length(trim(p_findings)) between 1 and 4000, false) is not true
    or char_length(coalesce(p_deviation_description, '')) > 4000
  ) then raise exception 'invalid_inspection_report'; end if;

  select * into v_existing from public.inspections where created_by = v_user_id and idempotency_key = p_idempotency_key;
  if found then return jsonb_build_object('inspection_id', v_existing.id, 'created', false); end if;

  select * into v_appointment from public.appointments where id = p_appointment_id for update;
  if not found or v_appointment.status <> 'confirmed' then raise exception 'confirmed_appointment_required'; end if;
  select * into v_reservation from public.winner_reservations
  where id = v_appointment.winner_reservation_id and company_id = v_company_id and status = 'reserved';
  if not found then raise exception 'winner_reservation_required'; end if;

  if p_proposed_price_cents is not null and p_proposed_price_cents <> v_reservation.amount_cents
    and coalesce(char_length(trim(p_adjustment_reason)) between 10 and 2000, false) is not true
  then raise exception 'adjustment_reason_required'; end if;
  if p_proposed_price_cents is not null and p_proposed_price_cents <= 0 then raise exception 'invalid_adjustment_price'; end if;

  insert into public.inspections (appointment_id, application_id, company_id, status, mileage_km, findings, deviation_description, inspected_at, created_by, idempotency_key)
  values (v_appointment.id, v_appointment.application_id, v_company_id, p_status,
    case when p_status = 'completed' then p_mileage_km else null end,
    case when p_status = 'completed' then nullif(trim(p_findings), '') else null end,
    case when p_status = 'completed' then nullif(trim(p_deviation_description), '') else null end,
    p_inspected_at, v_user_id, p_idempotency_key)
  returning id into v_inspection_id;

  update public.appointments set status = case p_status when 'completed' then 'attended' else 'no_show' end, updated_at = clock_timestamp()
  where id = v_appointment.id;

  if p_status = 'completed' then
    if p_proposed_price_cents is not null and p_proposed_price_cents <> v_reservation.amount_cents then
      insert into public.price_adjustment_proposals (inspection_id, original_bid_cents, proposed_price_cents, reason)
      values (v_inspection_id, v_reservation.amount_cents, p_proposed_price_cents, trim(p_adjustment_reason))
      returning id into v_adjustment_id;
    else
      v_agreement_id := private.create_phase4_sale_agreement(v_inspection_id, v_reservation.amount_cents, null);
    end if;
  else
    insert into public.workflow_tasks (application_id, task_type, details, idempotency_key)
    values (v_appointment.application_id, 'appointment_no_show', jsonb_build_object('appointment_id', v_appointment.id), 'appointment.no_show:' || v_appointment.id::text)
    on conflict (idempotency_key) do nothing;
  end if;

  select s.email into v_seller_email
  from public.applications a join public.seller_contacts s on s.id = a.seller_contact_id
  where a.id = v_appointment.application_id;
  insert into public.notification_outbox (event_type, entity_type, entity_id, recipient, payload, idempotency_key)
  values ('inspection.recorded', 'inspection', v_inspection_id, v_seller_email,
    jsonb_build_object('application_id', v_appointment.application_id, 'status', p_status, 'price_adjustment_proposal_id', v_adjustment_id, 'sale_agreement_id', v_agreement_id),
    'inspection.recorded:' || v_inspection_id::text);
  insert into public.audit_log (actor_id, action, entity_type, entity_id, after_data, request_id)
  values (v_user_id, 'inspection.recorded', 'inspection', v_inspection_id,
    jsonb_build_object('application_id', v_appointment.application_id, 'status', p_status, 'has_price_adjustment', v_adjustment_id is not null), p_idempotency_key);

  return jsonb_build_object('inspection_id', v_inspection_id, 'price_adjustment_proposal_id', v_adjustment_id, 'sale_agreement_id', v_agreement_id, 'created', true);
end;
$$;

create or replace function public.register_inspection_photo(
  p_inspection_id uuid,
  p_actor_id uuid,
  p_storage_path text,
  p_size_bytes bigint,
  p_sha256 text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_photo_id uuid;
begin
  if coalesce(auth.role(), '') <> 'service_role' then raise exception 'service_role_required'; end if;
  if p_storage_path !~ ('^inspections/' || p_inspection_id::text || '/[0-9a-f-]{36}-[0-9a-f]{64}\.jpg$')
    or p_size_bytes not between 1 and 10485760 or p_sha256 !~ '^[0-9a-f]{64}$'
  then raise exception 'invalid_inspection_photo'; end if;
  if not exists (
    select 1 from public.inspections i
    join public.company_memberships m on m.company_id = i.company_id
    join public.companies c on c.id = m.company_id
    join public.profiles p on p.id = m.user_id
    where i.id = p_inspection_id and m.user_id = p_actor_id and m.status = 'active'
      and c.status = 'approved' and not p.account_blocked
  ) then raise exception 'inspection_photo_access_denied'; end if;
  if (select count(*) from public.inspection_photos where inspection_id = p_inspection_id) >= 8 then raise exception 'inspection_photo_limit'; end if;

  insert into public.inspection_photos (inspection_id, storage_path, size_bytes, sha256, uploaded_by)
  values (p_inspection_id, p_storage_path, p_size_bytes, p_sha256, p_actor_id)
  returning id into v_photo_id;
  insert into public.audit_log (actor_id, action, entity_type, entity_id, after_data)
  values (p_actor_id, 'inspection.photo_added', 'inspection_photo', v_photo_id, jsonb_build_object('inspection_id', p_inspection_id));
  return v_photo_id;
end;
$$;

create or replace function public.seller_respond_price_adjustment(
  p_application_id uuid,
  p_proposal_id uuid,
  p_accept boolean
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_proposal public.price_adjustment_proposals;
  v_inspection public.inspections;
  v_agreement_id uuid;
begin
  if not private.seller_owns_application(p_application_id) then raise exception 'application_access_denied'; end if;
  select p.* into v_proposal from public.price_adjustment_proposals p
  join public.inspections i on i.id = p.inspection_id
  where p.id = p_proposal_id and i.application_id = p_application_id
  for update of p;
  if not found then raise exception 'price_adjustment_not_found'; end if;
  if v_proposal.status <> 'pending' then raise exception 'price_adjustment_already_answered'; end if;
  select * into v_inspection from public.inspections where id = v_proposal.inspection_id;

  update public.price_adjustment_proposals
  set status = case when p_accept then 'accepted' else 'declined' end, seller_responded_at = clock_timestamp()
  where id = v_proposal.id;
  if p_accept then
    v_agreement_id := private.create_phase4_sale_agreement(v_inspection.id, v_proposal.proposed_price_cents, v_proposal.id);
  else
    insert into public.workflow_tasks (application_id, task_type, details, idempotency_key)
    values (p_application_id, 'price_adjustment_declined', jsonb_build_object('proposal_id', v_proposal.id), 'price_adjustment.declined:' || v_proposal.id::text)
    on conflict (idempotency_key) do nothing;
  end if;
  insert into public.audit_log (actor_id, action, entity_type, entity_id, after_data)
  values (auth.uid(), case when p_accept then 'price_adjustment.accepted' else 'price_adjustment.declined' end,
    'price_adjustment_proposal', v_proposal.id, jsonb_build_object('application_id', p_application_id, 'sale_agreement_id', v_agreement_id));
  return jsonb_build_object('proposal_id', v_proposal.id, 'status', case when p_accept then 'accepted' else 'declined' end, 'sale_agreement_id', v_agreement_id);
end;
$$;

create or replace function public.seller_respond_sale_agreement(
  p_application_id uuid,
  p_agreement_id uuid,
  p_accept boolean
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_agreement public.sale_agreements;
  v_now timestamptz := clock_timestamp();
begin
  if not private.seller_owns_application(p_application_id) then raise exception 'application_access_denied'; end if;
  select * into v_agreement from public.sale_agreements
  where id = p_agreement_id and application_id = p_application_id for update;
  if not found then raise exception 'sale_agreement_not_found'; end if;
  if v_agreement.status in ('declined', 'disputed') then raise exception 'sale_agreement_terminal'; end if;
  if p_accept and v_agreement.seller_confirmed_at is not null then
    return jsonb_build_object('agreement_id', v_agreement.id, 'status', v_agreement.status, 'created', false);
  end if;

  if p_accept then
    update public.sale_agreements set seller_confirmed_at = v_now,
      status = case when dealer_confirmed_at is not null then 'agreed' else 'awaiting_confirmations' end,
      updated_at = v_now where id = v_agreement.id returning * into v_agreement;
  else
    update public.sale_agreements set seller_declined_at = v_now, status = 'declined', updated_at = v_now
    where id = v_agreement.id returning * into v_agreement;
    insert into public.workflow_tasks (application_id, task_type, details, idempotency_key)
    values (p_application_id, 'sale_agreement_declined', jsonb_build_object('agreement_id', v_agreement.id, 'actor', 'seller'), 'sale_agreement.declined:seller:' || v_agreement.id::text)
    on conflict (idempotency_key) do nothing;
  end if;

  if v_agreement.status = 'agreed' then
    insert into public.deal_cases (application_id, selected_bid_id, status, agreed_at)
    select v_agreement.application_id, wr.bid_id, 'agreed', v_now
    from public.winner_reservations wr where wr.id = v_agreement.winner_reservation_id
    on conflict (application_id) do update set selected_bid_id = excluded.selected_bid_id,
      status = 'agreed', agreed_at = excluded.agreed_at, updated_at = v_now
    where public.deal_cases.status not in ('completed', 'not_sold', 'withdrawn');
    if not found then raise exception 'deal_case_terminal'; end if;
  end if;
  insert into public.audit_log (actor_id, action, entity_type, entity_id, after_data)
  values (auth.uid(), case when p_accept then 'sale_agreement.seller_confirmed' else 'sale_agreement.seller_declined' end,
    'sale_agreement', v_agreement.id, jsonb_build_object('application_id', p_application_id, 'status', v_agreement.status));
  return jsonb_build_object('agreement_id', v_agreement.id, 'status', v_agreement.status, 'created', true);
end;
$$;

create or replace function public.dealer_respond_sale_agreement(
  p_agreement_id uuid,
  p_accept boolean
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_company_id uuid := private.current_approved_company_id();
  v_agreement public.sale_agreements;
  v_now timestamptz := clock_timestamp();
begin
  if v_company_id is null then raise exception 'approved_company_required'; end if;
  select sa.* into v_agreement
  from public.sale_agreements sa
  join public.winner_reservations wr on wr.id = sa.winner_reservation_id
  where sa.id = p_agreement_id and wr.company_id = v_company_id
  for update of sa;
  if not found then raise exception 'sale_agreement_not_found'; end if;
  if v_agreement.status in ('declined', 'disputed') then raise exception 'sale_agreement_terminal'; end if;
  if p_accept and v_agreement.dealer_confirmed_at is not null then
    return jsonb_build_object('agreement_id', v_agreement.id, 'status', v_agreement.status, 'created', false);
  end if;

  if p_accept then
    update public.sale_agreements set dealer_confirmed_at = v_now,
      status = case when seller_confirmed_at is not null then 'agreed' else 'awaiting_confirmations' end,
      updated_at = v_now where id = v_agreement.id returning * into v_agreement;
  else
    update public.sale_agreements set dealer_declined_at = v_now, status = 'declined', updated_at = v_now
    where id = v_agreement.id returning * into v_agreement;
    insert into public.workflow_tasks (application_id, task_type, details, idempotency_key)
    values (v_agreement.application_id, 'sale_agreement_declined', jsonb_build_object('agreement_id', v_agreement.id, 'actor', 'dealer'), 'sale_agreement.declined:dealer:' || v_agreement.id::text)
    on conflict (idempotency_key) do nothing;
  end if;

  if v_agreement.status = 'agreed' then
    insert into public.deal_cases (application_id, selected_bid_id, status, agreed_at)
    select v_agreement.application_id, wr.bid_id, 'agreed', v_now
    from public.winner_reservations wr where wr.id = v_agreement.winner_reservation_id
    on conflict (application_id) do update set selected_bid_id = excluded.selected_bid_id,
      status = 'agreed', agreed_at = excluded.agreed_at, updated_at = v_now
    where public.deal_cases.status not in ('completed', 'not_sold', 'withdrawn');
    if not found then raise exception 'deal_case_terminal'; end if;
  end if;
  insert into public.audit_log (actor_id, action, entity_type, entity_id, after_data)
  values (auth.uid(), case when p_accept then 'sale_agreement.dealer_confirmed' else 'sale_agreement.dealer_declined' end,
    'sale_agreement', v_agreement.id, jsonb_build_object('application_id', v_agreement.application_id, 'status', v_agreement.status));
  return jsonb_build_object('agreement_id', v_agreement.id, 'status', v_agreement.status, 'created', true);
end;
$$;

create or replace function public.get_dealer_won_cases()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_company_id uuid := private.current_approved_company_id();
  v_result jsonb;
begin
  if v_company_id is null then raise exception 'approved_company_required'; end if;
  select coalesce(jsonb_agg(jsonb_build_object(
    'reservationId', wr.id,
    'applicationId', a.id,
    'listingId', l.id,
    'amountCents', wr.amount_cents,
    'reservedAt', wr.reserved_at,
    'vehicle', vr.snapshot->'vehicle',
    'appointment', case when ap.id is null then null else jsonb_build_object(
      'id', ap.id, 'status', ap.status, 'selectedSlot', ap.selected_slot,
      'sellerNote', ap.seller_note, 'responseDueAt', ap.response_due_at,
      'proposal', case when proposal.id is null then null else jsonb_build_object('id', proposal.id, 'slots', proposal.proposed_slots, 'createdAt', proposal.created_at) end
    ) end,
    'sellerContact', case when ap.status in ('confirmed', 'attended', 'no_show') then jsonb_build_object(
      'fullName', seller.full_name, 'email', seller.email, 'phone', seller.phone, 'postalCode', seller.postal_code
    ) else null end,
    'inspection', case when inspection.id is null then null else jsonb_build_object(
      'id', inspection.id, 'status', inspection.status, 'mileageKm', inspection.mileage_km,
      'findings', inspection.findings, 'deviationDescription', inspection.deviation_description, 'inspectedAt', inspection.inspected_at,
      'photos', coalesce((select jsonb_agg(jsonb_build_object('id', ip.id, 'storagePath', ip.storage_path) order by ip.created_at) from public.inspection_photos ip where ip.inspection_id = inspection.id), '[]'::jsonb)
    ) end,
    'priceAdjustment', case when adjustment.id is null then null else jsonb_build_object(
      'id', adjustment.id, 'originalBidCents', adjustment.original_bid_cents,
      'proposedPriceCents', adjustment.proposed_price_cents, 'reason', adjustment.reason, 'status', adjustment.status
    ) end,
    'agreement', case when agreement.id is null then null else jsonb_build_object(
      'id', agreement.id, 'originalBidCents', agreement.original_bid_cents, 'agreedPriceCents', agreement.agreed_price_cents,
      'termsVersion', agreement.terms_version, 'termsStatus', agreement.terms_status, 'status', agreement.status,
      'dealerConfirmedAt', agreement.dealer_confirmed_at, 'sellerConfirmedAt', agreement.seller_confirmed_at
    ) end
  ) order by wr.reserved_at desc), '[]'::jsonb) into v_result
  from public.winner_reservations wr
  join public.bid_rounds br on br.id = wr.bid_round_id
  join public.listings l on l.id = br.listing_id
  join public.applications a on a.id = l.application_id
  join public.seller_contacts seller on seller.id = a.seller_contact_id
  join public.vehicle_revisions vr on vr.id = l.vehicle_revision_id
  left join public.appointments ap on ap.winner_reservation_id = wr.id
  left join lateral (select p.* from public.appointment_proposals p where p.appointment_id = ap.id and p.status in ('active', 'accepted') order by p.created_at desc limit 1) proposal on true
  left join public.inspections inspection on inspection.appointment_id = ap.id
  left join public.price_adjustment_proposals adjustment on adjustment.inspection_id = inspection.id
  left join public.sale_agreements agreement on agreement.winner_reservation_id = wr.id
  where wr.company_id = v_company_id and wr.status = 'reserved';
  return v_result;
end;
$$;

create or replace function public.get_seller_phase4_state(p_application_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_result jsonb;
begin
  if not private.seller_owns_application(p_application_id) then raise exception 'application_access_denied'; end if;
  select jsonb_build_object(
    'reservation', case when wr.id is null then null else jsonb_build_object('id', wr.id, 'amountCents', wr.amount_cents, 'reservedAt', wr.reserved_at, 'companyName', coalesce(company.trade_name, company.legal_name)) end,
    'appointment', case when ap.id is null then null else jsonb_build_object(
      'id', ap.id, 'status', ap.status, 'selectedSlot', ap.selected_slot, 'sellerNote', ap.seller_note,
      'responseDueAt', ap.response_due_at,
      'proposal', case when proposal.id is null then null else jsonb_build_object('id', proposal.id, 'slots', proposal.proposed_slots, 'createdAt', proposal.created_at) end
    ) end,
    'inspection', case when inspection.id is null then null else jsonb_build_object(
      'id', inspection.id, 'status', inspection.status, 'mileageKm', inspection.mileage_km,
      'findings', inspection.findings, 'deviationDescription', inspection.deviation_description, 'inspectedAt', inspection.inspected_at,
      'photos', coalesce((select jsonb_agg(jsonb_build_object('id', ip.id, 'storagePath', ip.storage_path) order by ip.created_at) from public.inspection_photos ip where ip.inspection_id = inspection.id), '[]'::jsonb)
    ) end,
    'priceAdjustment', case when adjustment.id is null then null else jsonb_build_object(
      'id', adjustment.id, 'originalBidCents', adjustment.original_bid_cents, 'proposedPriceCents', adjustment.proposed_price_cents,
      'reason', adjustment.reason, 'status', adjustment.status
    ) end,
    'agreement', case when agreement.id is null then null else jsonb_build_object(
      'id', agreement.id, 'originalBidCents', agreement.original_bid_cents, 'agreedPriceCents', agreement.agreed_price_cents,
      'termsVersion', agreement.terms_version, 'termsStatus', agreement.terms_status, 'status', agreement.status,
      'dealerConfirmedAt', agreement.dealer_confirmed_at, 'sellerConfirmedAt', agreement.seller_confirmed_at
    ) end
  ) into v_result
  from public.applications a
  left join public.listings l on l.application_id = a.id
  left join public.bid_rounds br on br.listing_id = l.id and br.outcome_status = 'closed_with_winner'
  left join public.winner_reservations wr on wr.bid_round_id = br.id
  left join public.companies company on company.id = wr.company_id
  left join public.appointments ap on ap.winner_reservation_id = wr.id
  left join lateral (select p.* from public.appointment_proposals p where p.appointment_id = ap.id and p.status in ('active', 'accepted') order by p.created_at desc limit 1) proposal on true
  left join public.inspections inspection on inspection.appointment_id = ap.id
  left join public.price_adjustment_proposals adjustment on adjustment.inspection_id = inspection.id
  left join public.sale_agreements agreement on agreement.winner_reservation_id = wr.id
  where a.id = p_application_id
  order by l.created_at desc limit 1;
  return coalesce(v_result, jsonb_build_object('reservation', null, 'appointment', null, 'inspection', null, 'priceAdjustment', null, 'agreement', null));
end;
$$;

create or replace function public.get_admin_phase4_state(p_application_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not private.is_staff() or coalesce(auth.jwt()->>'aal', 'aal1') <> 'aal2' then raise exception 'staff_aal2_required'; end if;
  if not exists(select 1 from public.applications where id = p_application_id) then raise exception 'application_not_found'; end if;
  return jsonb_build_object(
    'appointment', (select to_jsonb(ap) - 'seller_note' from public.appointments ap where ap.application_id = p_application_id order by ap.created_at desc limit 1),
    'inspection', (select to_jsonb(i) from public.inspections i where i.application_id = p_application_id order by i.created_at desc limit 1),
    'priceAdjustment', (select to_jsonb(p) from public.price_adjustment_proposals p join public.inspections i on i.id = p.inspection_id where i.application_id = p_application_id order by p.created_at desc limit 1),
    'agreement', (select to_jsonb(sa) from public.sale_agreements sa where sa.application_id = p_application_id order by sa.created_at desc limit 1),
    'tasks', coalesce((select jsonb_agg(jsonb_build_object('id', t.id, 'taskType', t.task_type, 'status', t.status, 'dueAt', t.due_at, 'createdAt', t.created_at) order by t.created_at desc) from public.workflow_tasks t where t.application_id = p_application_id), '[]'::jsonb)
  );
end;
$$;

create or replace function public.admin_update_deal_case(
  p_application_id uuid,
  p_status public.deal_status,
  p_selected_bid_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_deal public.deal_cases;
begin
  if not private.is_staff() or coalesce(auth.jwt()->>'aal', 'aal1') <> 'aal2' then raise exception 'staff_aal2_required'; end if;
  if p_status not in ('not_started', 'discussing', 'not_sold', 'withdrawn') then raise exception 'phase4_workflow_required'; end if;
  if p_selected_bid_id is not null then raise exception 'phase4_workflow_required'; end if;
  if not exists(select 1 from public.applications where id = p_application_id for update) then raise exception 'application_not_found'; end if;
  insert into public.deal_cases (application_id) values (p_application_id) on conflict (application_id) do nothing;
  select * into v_deal from public.deal_cases where application_id = p_application_id for update;
  if v_deal.status in ('agreed', 'completed', 'not_sold', 'withdrawn') and p_status <> v_deal.status then raise exception 'deal_case_terminal'; end if;
  if p_status <> v_deal.status and not (
    (v_deal.status = 'not_started' and p_status in ('discussing', 'not_sold', 'withdrawn'))
    or (v_deal.status = 'discussing' and p_status in ('not_sold', 'withdrawn'))
  ) then raise exception 'invalid_deal_transition'; end if;
  update public.deal_cases set status = p_status, updated_at = clock_timestamp() where id = v_deal.id;
  insert into public.audit_log (actor_id, action, entity_type, entity_id, before_data, after_data)
  values (auth.uid(), 'deal.status_changed', 'deal_case', v_deal.id,
    jsonb_build_object('status', v_deal.status), jsonb_build_object('application_id', p_application_id, 'status', p_status));
  return jsonb_build_object('deal_case_id', v_deal.id, 'status', p_status, 'selected_bid_id', null);
end;
$$;

revoke all on function private.seller_owns_application(uuid) from public, anon, authenticated;
revoke all on function private.create_phase4_sale_agreement(uuid, bigint, uuid) from public, anon, authenticated;
revoke all on function public.dealer_propose_appointment(uuid, timestamptz[], uuid) from public, anon;
revoke all on function public.seller_respond_appointment(uuid, uuid, text, timestamptz, text) from public, anon;
revoke all on function public.dealer_record_inspection(uuid, text, integer, text, text, bigint, text, timestamptz, uuid) from public, anon;
revoke all on function public.register_inspection_photo(uuid, uuid, text, bigint, text) from public, anon, authenticated;
revoke all on function public.seller_respond_price_adjustment(uuid, uuid, boolean) from public, anon;
revoke all on function public.seller_respond_sale_agreement(uuid, uuid, boolean) from public, anon;
revoke all on function public.dealer_respond_sale_agreement(uuid, boolean) from public, anon;
revoke all on function public.get_dealer_won_cases() from public, anon;
revoke all on function public.get_seller_phase4_state(uuid) from public, anon;
revoke all on function public.get_admin_phase4_state(uuid) from public, anon;

grant execute on function public.dealer_propose_appointment(uuid, timestamptz[], uuid) to authenticated;
grant execute on function public.seller_respond_appointment(uuid, uuid, text, timestamptz, text) to authenticated;
grant execute on function public.dealer_record_inspection(uuid, text, integer, text, text, bigint, text, timestamptz, uuid) to authenticated;
grant execute on function public.register_inspection_photo(uuid, uuid, text, bigint, text) to service_role;
grant execute on function public.seller_respond_price_adjustment(uuid, uuid, boolean) to authenticated;
grant execute on function public.seller_respond_sale_agreement(uuid, uuid, boolean) to authenticated;
grant execute on function public.dealer_respond_sale_agreement(uuid, boolean) to authenticated;
grant execute on function public.get_dealer_won_cases() to authenticated;
grant execute on function public.get_seller_phase4_state(uuid) to authenticated;
grant execute on function public.get_admin_phase4_state(uuid) to authenticated;
