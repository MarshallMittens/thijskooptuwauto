-- Phase 6: complaints, test invoice administration, operational monitoring and recovery evidence.
-- No production provider, fiscal invoice or external scheduler is enabled by this migration.

alter table public.companies
  add column is_platform_affiliated boolean not null default false;

alter table public.notification_outbox
  add column locked_at timestamptz,
  add column locked_by uuid,
  add column last_attempt_at timestamptz;

create table public.complaints (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique default lower(encode(gen_random_bytes(12), 'hex'))
    check (reference ~ '^[0-9a-f]{24}$'),
  application_id uuid not null references public.applications(id),
  payment_order_id uuid references public.payment_orders(id),
  complainant_kind text not null check (complainant_kind in ('seller', 'dealer', 'staff')),
  complainant_user_id uuid not null references public.profiles(id),
  complainant_company_id uuid references public.companies(id),
  buyer_company_id uuid references public.companies(id),
  category text not null check (category in ('appointment', 'inspection', 'price', 'payment', 'handover', 'conduct', 'other')),
  status text not null default 'open' check (status in ('open', 'in_review', 'waiting_external', 'resolved', 'rejected', 'withdrawn')),
  summary text not null check (char_length(summary) between 20 and 4000),
  requires_independent_review boolean not null default false,
  independent_reviewed_by uuid references public.profiles(id),
  independent_reviewed_at timestamptz,
  independent_review_notes text check (independent_review_notes is null or char_length(independent_review_notes) between 10 and 4000),
  resolution text check (resolution is null or char_length(resolution) between 10 and 4000),
  resolved_by uuid references public.profiles(id),
  resolved_at timestamptz,
  idempotency_key uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (complainant_user_id, idempotency_key),
  check ((complainant_kind = 'dealer') = (complainant_company_id is not null)),
  check ((independent_reviewed_at is null) = (independent_reviewed_by is null)),
  check ((resolved_at is null) = (resolved_by is null))
);

create table public.complaint_messages (
  id uuid primary key default gen_random_uuid(),
  complaint_id uuid not null references public.complaints(id) on delete cascade,
  author_id uuid not null references public.profiles(id),
  author_kind text not null check (author_kind in ('seller', 'dealer', 'staff')),
  body text not null check (char_length(body) between 2 and 4000),
  created_at timestamptz not null default now()
);

create table public.complaint_evidence (
  id uuid primary key default gen_random_uuid(),
  complaint_id uuid not null references public.complaints(id) on delete cascade,
  uploaded_by uuid not null references public.profiles(id),
  storage_path text not null unique,
  media_type text not null check (media_type = 'image/jpeg'),
  size_bytes bigint not null check (size_bytes between 1 and 10485760),
  sha256 text not null check (sha256 ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default now()
);

create table public.platform_invoice_records (
  id uuid primary key default gen_random_uuid(),
  payment_order_id uuid not null references public.payment_orders(id),
  document_type text not null check (document_type in ('invoice', 'credit_note')),
  corrected_invoice_id uuid references public.platform_invoice_records(id),
  document_number text not null unique check (document_number ~ '^TEST-[A-Z]+-[0-9A-F]{12}$'),
  environment text not null default 'test' check (environment = 'test'),
  status text not null default 'draft_blocked' check (status in ('draft_blocked', 'cancelled')),
  billed_party_status text not null default 'unconfigured' check (billed_party_status = 'unconfigured'),
  fee_net_cents bigint not null default 0 check (fee_net_cents = 0),
  tax_cents bigint not null default 0 check (tax_cents = 0),
  fee_gross_cents bigint not null default 0 check (fee_gross_cents = fee_net_cents + tax_cents),
  tax_treatment text not null default 'unconfigured' check (tax_treatment = 'unconfigured'),
  reason text not null check (char_length(reason) between 10 and 1000),
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  check ((document_type = 'invoice' and corrected_invoice_id is null) or (document_type = 'credit_note' and corrected_invoice_id is not null))
);

create unique index platform_invoice_one_test_invoice_per_payment
  on public.platform_invoice_records(payment_order_id)
  where document_type = 'invoice';
create unique index platform_invoice_one_test_credit_per_invoice
  on public.platform_invoice_records(corrected_invoice_id)
  where document_type = 'credit_note';

create table public.operational_incidents (
  id uuid primary key default gen_random_uuid(),
  severity text not null check (severity in ('low', 'medium', 'high', 'critical')),
  status text not null default 'open' check (status in ('open', 'investigating', 'monitoring', 'resolved')),
  summary text not null check (char_length(summary) between 10 and 300),
  impact text not null check (char_length(impact) between 10 and 4000),
  resolution text check (resolution is null or char_length(resolution) between 10 and 4000),
  opened_by uuid not null references public.profiles(id),
  resolved_by uuid references public.profiles(id),
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((resolved_at is null) = (resolved_by is null))
);

create table public.operation_runs (
  id uuid primary key default gen_random_uuid(),
  operation_type text not null check (operation_type in ('outbox_delivery', 'payment_reconciliation', 'recovery_test')),
  status text not null check (status in ('running', 'completed', 'completed_with_errors', 'failed')),
  worker_id uuid not null,
  processed_count integer not null default 0 check (processed_count >= 0),
  failed_count integer not null default 0 check (failed_count >= 0),
  details jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create table public.recovery_test_runs (
  id uuid primary key default gen_random_uuid(),
  environment text not null check (environment = 'local_isolated_test'),
  status text not null check (status in ('completed', 'failed')),
  database_restored boolean not null,
  storage_restored boolean not null,
  restored_table_count integer not null default 0 check (restored_table_count >= 0),
  restored_object_count integer not null default 0 check (restored_object_count >= 0),
  evidence jsonb not null default '{}'::jsonb,
  started_at timestamptz not null,
  completed_at timestamptz not null,
  recorded_at timestamptz not null default now()
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('complaint-evidence', 'complaint-evidence', false, 10485760, array['image/jpeg'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

revoke all on public.complaints, public.complaint_messages, public.complaint_evidence,
  public.platform_invoice_records, public.operational_incidents, public.operation_runs,
  public.recovery_test_runs from public, anon, authenticated;

grant select on public.complaints, public.complaint_messages, public.complaint_evidence,
  public.platform_invoice_records, public.operational_incidents, public.operation_runs,
  public.recovery_test_runs to authenticated;

alter table public.complaints enable row level security;
alter table public.complaint_messages enable row level security;
alter table public.complaint_evidence enable row level security;
alter table public.platform_invoice_records enable row level security;
alter table public.operational_incidents enable row level security;
alter table public.operation_runs enable row level security;
alter table public.recovery_test_runs enable row level security;

create or replace function private.can_access_complaint(p_complaint_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.complaints c
    where c.id = p_complaint_id and (
      (private.is_staff() and auth.jwt()->>'aal' = 'aal2')
      or exists (
        select 1 from public.seller_application_access saa
        where saa.application_id = c.application_id and saa.user_id = auth.uid()
      )
      or (c.complainant_company_id is not null and c.complainant_company_id = private.current_approved_company_id())
      or (c.buyer_company_id is not null and c.buyer_company_id = private.current_approved_company_id())
    )
  );
$$;

create policy complaints_participant_or_staff_read on public.complaints for select to authenticated
using (private.can_access_complaint(id));
create policy complaint_messages_participant_or_staff_read on public.complaint_messages for select to authenticated
using (private.can_access_complaint(complaint_id));
create policy complaint_evidence_participant_or_staff_read on public.complaint_evidence for select to authenticated
using (private.can_access_complaint(complaint_id));
create policy invoice_records_staff_read on public.platform_invoice_records for select to authenticated
using (private.is_staff() and auth.jwt()->>'aal' = 'aal2');
create policy operational_incidents_staff_read on public.operational_incidents for select to authenticated
using (private.is_staff() and auth.jwt()->>'aal' = 'aal2');
create policy operation_runs_staff_read on public.operation_runs for select to authenticated
using (private.is_staff() and auth.jwt()->>'aal' = 'aal2');
create policy recovery_runs_staff_read on public.recovery_test_runs for select to authenticated
using (private.is_staff() and auth.jwt()->>'aal' = 'aal2');

create policy complaint_evidence_staff_read on storage.objects for select to authenticated using (
  bucket_id = 'complaint-evidence' and private.is_staff() and auth.jwt()->>'aal' = 'aal2'
);

create or replace function private.complaint_buyer_company(p_application_id uuid)
returns uuid language sql stable security definer set search_path = '' as $$
  select coalesce(
    (select po.company_id from public.payment_orders po where po.application_id = p_application_id order by po.created_at desc limit 1),
    (select wr.company_id
       from public.winner_reservations wr
       join public.bid_rounds br on br.id = wr.bid_round_id
       join public.listings l on l.id = br.listing_id
       join public.vehicle_revisions vr on vr.id = l.vehicle_revision_id
       join public.vehicles v on v.id = vr.vehicle_id
       join public.applications a on a.vehicle_id = v.id
      where a.id = p_application_id order by wr.reserved_at desc limit 1)
  );
$$;

create or replace function private.insert_complaint_receipt(
  p_complaint public.complaints,
  p_recipient text
) returns void language plpgsql security definer set search_path = '' as $$
begin
  insert into public.notification_outbox(event_type, entity_type, entity_id, recipient, payload, idempotency_key)
  values ('complaint.received', 'complaint', p_complaint.id, p_recipient,
    jsonb_build_object('reference', p_complaint.reference, 'status', p_complaint.status),
    'complaint.received:' || p_complaint.id::text)
  on conflict (idempotency_key) do nothing;
end;
$$;

create or replace function public.seller_open_complaint(
  p_application_id uuid,
  p_category text,
  p_summary text,
  p_idempotency_key uuid
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := auth.uid();
  v_company uuid;
  v_payment uuid;
  v_email text;
  v_complaint public.complaints;
begin
  if v_user is null or not private.seller_owns_application(p_application_id) then raise exception 'seller_application_access_required'; end if;
  if p_category not in ('appointment', 'inspection', 'price', 'payment', 'handover', 'conduct', 'other') then raise exception 'invalid_complaint_category'; end if;
  if char_length(trim(p_summary)) not between 20 and 4000 then raise exception 'invalid_complaint_summary'; end if;
  select c.* into v_complaint from public.complaints c where c.complainant_user_id = v_user and c.idempotency_key = p_idempotency_key;
  if found then return jsonb_build_object('id', v_complaint.id, 'reference', v_complaint.reference, 'created', false); end if;
  v_company := private.complaint_buyer_company(p_application_id);
  select po.id into v_payment from public.payment_orders po where po.application_id = p_application_id order by po.created_at desc limit 1;
  select sc.email into v_email from public.applications a join public.seller_contacts sc on sc.id = a.seller_contact_id where a.id = p_application_id;
  insert into public.complaints(application_id, payment_order_id, complainant_kind, complainant_user_id,
    buyer_company_id, category, summary, requires_independent_review, idempotency_key)
  values (p_application_id, v_payment, 'seller', v_user, v_company, p_category, trim(p_summary),
    coalesce((select c.is_platform_affiliated from public.companies c where c.id = v_company), false), p_idempotency_key)
  returning * into v_complaint;
  insert into public.complaint_messages(complaint_id, author_id, author_kind, body)
  values(v_complaint.id, v_user, 'seller', trim(p_summary));
  perform private.insert_complaint_receipt(v_complaint, v_email);
  insert into public.audit_log(actor_id, action, entity_type, entity_id, after_data, request_id)
  values(v_user, 'complaint.opened', 'complaint', v_complaint.id,
    jsonb_build_object('category', p_category, 'requires_independent_review', v_complaint.requires_independent_review), p_idempotency_key);
  return jsonb_build_object('id', v_complaint.id, 'reference', v_complaint.reference, 'created', true);
end;
$$;

create or replace function public.dealer_open_complaint(
  p_payment_order_id uuid,
  p_category text,
  p_summary text,
  p_idempotency_key uuid
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := auth.uid();
  v_company uuid := private.current_approved_company_id();
  v_payment public.payment_orders;
  v_complaint public.complaints;
  v_email text;
begin
  if v_user is null or v_company is null then raise exception 'approved_company_required'; end if;
  select * into v_payment from public.payment_orders where id = p_payment_order_id and company_id = v_company;
  if not found then raise exception 'payment_not_owned'; end if;
  if p_category not in ('appointment', 'inspection', 'price', 'payment', 'handover', 'conduct', 'other') then raise exception 'invalid_complaint_category'; end if;
  if char_length(trim(p_summary)) not between 20 and 4000 then raise exception 'invalid_complaint_summary'; end if;
  select c.* into v_complaint from public.complaints c where c.complainant_user_id = v_user and c.idempotency_key = p_idempotency_key;
  if found then return jsonb_build_object('id', v_complaint.id, 'reference', v_complaint.reference, 'created', false); end if;
  select email into v_email from public.companies where id = v_company;
  insert into public.complaints(application_id, payment_order_id, complainant_kind, complainant_user_id,
    complainant_company_id, buyer_company_id, category, summary, requires_independent_review, idempotency_key)
  values(v_payment.application_id, v_payment.id, 'dealer', v_user, v_company, v_company, p_category, trim(p_summary),
    coalesce((select is_platform_affiliated from public.companies where id = v_company), false), p_idempotency_key)
  returning * into v_complaint;
  insert into public.complaint_messages(complaint_id, author_id, author_kind, body)
  values(v_complaint.id, v_user, 'dealer', trim(p_summary));
  perform private.insert_complaint_receipt(v_complaint, v_email);
  insert into public.audit_log(actor_id, action, entity_type, entity_id, after_data, request_id)
  values(v_user, 'complaint.opened', 'complaint', v_complaint.id,
    jsonb_build_object('category', p_category, 'requires_independent_review', v_complaint.requires_independent_review), p_idempotency_key);
  return jsonb_build_object('id', v_complaint.id, 'reference', v_complaint.reference, 'created', true);
end;
$$;

create or replace function public.add_complaint_message(p_complaint_id uuid, p_body text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := auth.uid();
  v_kind text;
  v_id uuid;
begin
  if v_user is null or not private.can_access_complaint(p_complaint_id) then raise exception 'complaint_access_required'; end if;
  if char_length(trim(p_body)) not between 2 and 4000 then raise exception 'invalid_complaint_message'; end if;
  select case when exists(select 1 from public.staff_memberships s where s.user_id = v_user) then 'staff'
    when exists(select 1 from public.seller_application_access s join public.complaints c on c.application_id = s.application_id where c.id = p_complaint_id and s.user_id = v_user) then 'seller'
    else 'dealer' end into v_kind;
  insert into public.complaint_messages(complaint_id, author_id, author_kind, body)
  values(p_complaint_id, v_user, v_kind, trim(p_body)) returning id into v_id;
  update public.complaints set updated_at = clock_timestamp(), status = case when status = 'open' then 'in_review' else status end where id = p_complaint_id;
  insert into public.audit_log(actor_id, action, entity_type, entity_id, after_data)
  values(v_user, 'complaint.message_added', 'complaint', p_complaint_id, jsonb_build_object('message_id', v_id));
  return v_id;
end;
$$;

create or replace function public.register_complaint_evidence(
  p_complaint_id uuid,
  p_actor_id uuid,
  p_storage_path text,
  p_size_bytes bigint,
  p_sha256 text
) returns uuid language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
  if coalesce(auth.role(), '') <> 'service_role' then raise exception 'service_role_required'; end if;
  if p_storage_path !~ ('^complaints/' || p_complaint_id::text || '/[0-9a-f-]{36}-[0-9a-f]{64}\.jpg$') then raise exception 'invalid_evidence_path'; end if;
  if not exists (
    select 1 from public.complaints c where c.id = p_complaint_id and (
      exists(select 1 from public.staff_memberships s where s.user_id = p_actor_id)
      or exists(select 1 from public.seller_application_access s where s.application_id = c.application_id and s.user_id = p_actor_id)
      or exists(select 1 from public.company_memberships m where m.user_id = p_actor_id and m.status = 'active' and m.company_id in (c.complainant_company_id, c.buyer_company_id))
    )
  ) then raise exception 'complaint_actor_access_required'; end if;
  if not exists(select 1 from storage.objects where bucket_id = 'complaint-evidence' and name = p_storage_path) then raise exception 'evidence_object_missing'; end if;
  if (select count(*) from public.complaint_evidence where complaint_id = p_complaint_id) >= 8 then raise exception 'evidence_limit_reached'; end if;
  insert into public.complaint_evidence(complaint_id, uploaded_by, storage_path, media_type, size_bytes, sha256)
  values(p_complaint_id, p_actor_id, p_storage_path, 'image/jpeg', p_size_bytes, p_sha256) returning id into v_id;
  insert into public.audit_log(actor_id, action, entity_type, entity_id, after_data)
  values(p_actor_id, 'complaint.evidence_added', 'complaint', p_complaint_id, jsonb_build_object('evidence_id', v_id, 'sha256', p_sha256));
  return v_id;
end;
$$;

create or replace function public.admin_review_complaint(p_complaint_id uuid, p_notes text)
returns void language plpgsql security definer set search_path = '' as $$
declare v_user uuid := auth.uid();
begin
  if not private.is_staff() or auth.jwt()->>'aal' <> 'aal2' then raise exception 'staff_aal2_required'; end if;
  if char_length(trim(p_notes)) not between 10 and 4000 then raise exception 'invalid_review_notes'; end if;
  update public.complaints set independent_reviewed_by = v_user, independent_reviewed_at = clock_timestamp(),
    independent_review_notes = trim(p_notes), updated_at = clock_timestamp()
  where id = p_complaint_id and requires_independent_review and complainant_user_id <> v_user;
  if not found then raise exception 'independent_review_not_allowed'; end if;
  insert into public.audit_log(actor_id, action, entity_type, entity_id, after_data)
  values(v_user, 'complaint.independent_reviewed', 'complaint', p_complaint_id, jsonb_build_object('review_recorded', true));
end;
$$;

create or replace function public.admin_update_complaint(
  p_complaint_id uuid,
  p_status text,
  p_resolution text
) returns void language plpgsql security definer set search_path = '' as $$
declare v_user uuid := auth.uid(); v_complaint public.complaints;
begin
  if not private.is_staff() or auth.jwt()->>'aal' <> 'aal2' then raise exception 'staff_aal2_required'; end if;
  if p_status not in ('in_review', 'waiting_external', 'resolved', 'rejected') then raise exception 'invalid_complaint_status'; end if;
  select * into v_complaint from public.complaints where id = p_complaint_id for update;
  if not found then raise exception 'complaint_not_found'; end if;
  if p_status in ('resolved', 'rejected') then
    if char_length(trim(p_resolution)) not between 10 and 4000 then raise exception 'resolution_required'; end if;
    if v_complaint.requires_independent_review and (v_complaint.independent_reviewed_by is null or v_complaint.independent_reviewed_by = v_user) then
      raise exception 'independent_second_reviewer_required';
    end if;
  end if;
  update public.complaints set status = p_status,
    resolution = case when p_status in ('resolved', 'rejected') then trim(p_resolution) else resolution end,
    resolved_by = case when p_status in ('resolved', 'rejected') then v_user else null end,
    resolved_at = case when p_status in ('resolved', 'rejected') then clock_timestamp() else null end,
    updated_at = clock_timestamp()
  where id = p_complaint_id;
  insert into public.audit_log(actor_id, action, entity_type, entity_id, before_data, after_data)
  values(v_user, 'complaint.status_changed', 'complaint', p_complaint_id,
    jsonb_build_object('status', v_complaint.status), jsonb_build_object('status', p_status));
end;
$$;

create or replace function public.admin_set_platform_affiliation(p_company_id uuid, p_affiliated boolean)
returns void language plpgsql security definer set search_path = '' as $$
declare v_user uuid := auth.uid(); v_before boolean;
begin
  if not private.is_staff(array['admin']::public.staff_role[]) or auth.jwt()->>'aal' <> 'aal2' then raise exception 'admin_aal2_required'; end if;
  select is_platform_affiliated into v_before from public.companies where id = p_company_id for update;
  if not found then raise exception 'company_not_found'; end if;
  update public.companies set is_platform_affiliated = p_affiliated, updated_at = clock_timestamp() where id = p_company_id;
  insert into public.audit_log(actor_id, action, entity_type, entity_id, before_data, after_data)
  values(v_user, 'company.platform_affiliation_changed', 'company', p_company_id,
    jsonb_build_object('is_platform_affiliated', v_before), jsonb_build_object('is_platform_affiliated', p_affiliated));
end;
$$;

create or replace function public.admin_create_test_invoice_record(
  p_payment_order_id uuid,
  p_document_type text,
  p_corrected_invoice_id uuid,
  p_reason text
) returns uuid language plpgsql security definer set search_path = '' as $$
declare v_user uuid := auth.uid(); v_id uuid; v_number text;
begin
  if not private.is_staff() or auth.jwt()->>'aal' <> 'aal2' then raise exception 'staff_aal2_required'; end if;
  if not exists(select 1 from public.payment_orders where id = p_payment_order_id and environment = 'test') then raise exception 'test_payment_required'; end if;
  if p_document_type not in ('invoice', 'credit_note') or char_length(trim(p_reason)) not between 10 and 1000 then raise exception 'invalid_test_invoice'; end if;
  if p_document_type = 'credit_note' and not exists(select 1 from public.platform_invoice_records where id = p_corrected_invoice_id and payment_order_id = p_payment_order_id and document_type = 'invoice') then raise exception 'source_invoice_required'; end if;
  v_number := 'TEST-' || case when p_document_type = 'invoice' then 'INV' else 'CRD' end || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12));
  insert into public.platform_invoice_records(payment_order_id, document_type, corrected_invoice_id, document_number, reason, created_by)
  values(p_payment_order_id, p_document_type, case when p_document_type = 'credit_note' then p_corrected_invoice_id else null end,
    v_number, trim(p_reason), v_user) returning id into v_id;
  insert into public.audit_log(actor_id, action, entity_type, entity_id, after_data)
  values(v_user, 'invoice.test_record_created', 'platform_invoice_record', v_id,
    jsonb_build_object('document_type', p_document_type, 'status', 'draft_blocked', 'amount_cents', 0));
  return v_id;
end;
$$;

create or replace function public.admin_create_incident(p_severity text, p_summary text, p_impact text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_user uuid := auth.uid(); v_id uuid;
begin
  if not private.is_staff() or auth.jwt()->>'aal' <> 'aal2' then raise exception 'staff_aal2_required'; end if;
  if p_severity not in ('low', 'medium', 'high', 'critical') then raise exception 'invalid_incident_severity'; end if;
  insert into public.operational_incidents(severity, summary, impact, opened_by)
  values(p_severity, trim(p_summary), trim(p_impact), v_user) returning id into v_id;
  insert into public.audit_log(actor_id, action, entity_type, entity_id, after_data)
  values(v_user, 'incident.opened', 'operational_incident', v_id, jsonb_build_object('severity', p_severity));
  return v_id;
end;
$$;

create or replace function public.admin_update_incident(p_incident_id uuid, p_status text, p_resolution text)
returns void language plpgsql security definer set search_path = '' as $$
declare v_user uuid := auth.uid(); v_before text;
begin
  if not private.is_staff() or auth.jwt()->>'aal' <> 'aal2' then raise exception 'staff_aal2_required'; end if;
  if p_status not in ('investigating', 'monitoring', 'resolved') then raise exception 'invalid_incident_status'; end if;
  select status into v_before from public.operational_incidents where id = p_incident_id for update;
  if not found then raise exception 'incident_not_found'; end if;
  if p_status = 'resolved' and char_length(trim(p_resolution)) not between 10 and 4000 then raise exception 'incident_resolution_required'; end if;
  update public.operational_incidents set status = p_status,
    resolution = case when p_status = 'resolved' then trim(p_resolution) else resolution end,
    resolved_by = case when p_status = 'resolved' then v_user else null end,
    resolved_at = case when p_status = 'resolved' then clock_timestamp() else null end,
    updated_at = clock_timestamp() where id = p_incident_id;
  insert into public.audit_log(actor_id, action, entity_type, entity_id, before_data, after_data)
  values(v_user, 'incident.status_changed', 'operational_incident', p_incident_id,
    jsonb_build_object('status', v_before), jsonb_build_object('status', p_status));
end;
$$;

create or replace function public.claim_notification_batch(p_worker_id uuid, p_limit integer default 25)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_result jsonb;
begin
  if coalesce(auth.role(), '') <> 'service_role' then raise exception 'service_role_required'; end if;
  if p_limit < 1 or p_limit > 50 then raise exception 'invalid_batch_limit'; end if;
  update public.notification_outbox set status = 'failed', locked_at = null, locked_by = null,
    last_error = 'worker_lease_expired', next_attempt_at = clock_timestamp()
  where status = 'processing' and locked_at < clock_timestamp() - interval '15 minutes';
  with candidates as (
    select id from public.notification_outbox
    where status in ('pending', 'failed') and next_attempt_at <= clock_timestamp() and attempt_count < 8
    order by created_at for update skip locked limit p_limit
  ), claimed as (
    update public.notification_outbox o set status = 'processing', locked_at = clock_timestamp(), locked_by = p_worker_id,
      last_attempt_at = clock_timestamp(), attempt_count = o.attempt_count + 1
    from candidates c where o.id = c.id
    returning o.id, o.event_type, o.entity_type, o.entity_id, o.recipient, o.payload, o.attempt_count, o.idempotency_key
  )
  select coalesce(jsonb_agg(to_jsonb(claimed)), '[]'::jsonb) into v_result from claimed;
  return v_result;
end;
$$;

create or replace function public.complete_notification_delivery(
  p_notification_id uuid,
  p_worker_id uuid,
  p_sent boolean,
  p_error text
) returns void language plpgsql security definer set search_path = '' as $$
begin
  if coalesce(auth.role(), '') <> 'service_role' then raise exception 'service_role_required'; end if;
  update public.notification_outbox set
    status = case when p_sent then 'sent'::public.notification_status else 'failed'::public.notification_status end,
    sent_at = case when p_sent then clock_timestamp() else null end,
    last_error = case when p_sent then null else left(coalesce(nullif(trim(p_error), ''), 'delivery_failed'), 200) end,
    next_attempt_at = case when p_sent then next_attempt_at else clock_timestamp() + (least(1440, 5 * attempt_count * attempt_count)::text || ' minutes')::interval end,
    locked_at = null, locked_by = null
  where id = p_notification_id and status = 'processing' and locked_by = p_worker_id;
  if not found then raise exception 'notification_lease_not_owned'; end if;
end;
$$;

create or replace function public.start_operation_run(p_operation_type text, p_worker_id uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
  if coalesce(auth.role(), '') <> 'service_role' then raise exception 'service_role_required'; end if;
  insert into public.operation_runs(operation_type, status, worker_id)
  values(p_operation_type, 'running', p_worker_id) returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.finish_operation_run(p_run_id uuid, p_status text, p_processed integer, p_failed integer, p_details jsonb)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if coalesce(auth.role(), '') <> 'service_role' then raise exception 'service_role_required'; end if;
  if p_status not in ('completed', 'completed_with_errors', 'failed') then raise exception 'invalid_operation_status'; end if;
  update public.operation_runs set status = p_status, processed_count = p_processed, failed_count = p_failed,
    details = coalesce(p_details, '{}'::jsonb), completed_at = clock_timestamp()
  where id = p_run_id and status = 'running';
  if not found then raise exception 'operation_run_not_running'; end if;
end;
$$;

create or replace function public.record_local_recovery_test(
  p_status text,
  p_database_restored boolean,
  p_storage_restored boolean,
  p_table_count integer,
  p_object_count integer,
  p_evidence jsonb,
  p_started_at timestamptz
) returns uuid language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
  if coalesce(auth.role(), '') <> 'service_role' then raise exception 'service_role_required'; end if;
  if p_status not in ('completed', 'failed') then raise exception 'invalid_recovery_status'; end if;
  insert into public.recovery_test_runs(environment, status, database_restored, storage_restored,
    restored_table_count, restored_object_count, evidence, started_at, completed_at)
  values('local_isolated_test', p_status, p_database_restored, p_storage_restored,
    greatest(p_table_count, 0), greatest(p_object_count, 0), coalesce(p_evidence, '{}'::jsonb), p_started_at, clock_timestamp())
  returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.get_seller_complaint_state(p_application_id uuid)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  if not private.seller_owns_application(p_application_id) then raise exception 'seller_application_access_required'; end if;
  return coalesce((select jsonb_agg(jsonb_build_object(
    'id', c.id, 'reference', c.reference, 'category', c.category, 'status', c.status,
    'summary', c.summary, 'requiresIndependentReview', c.requires_independent_review,
    'resolution', c.resolution, 'createdAt', c.created_at,
    'messages', coalesce((select jsonb_agg(jsonb_build_object('id', m.id, 'authorKind', m.author_kind, 'body', m.body, 'createdAt', m.created_at) order by m.created_at) from public.complaint_messages m where m.complaint_id = c.id), '[]'::jsonb),
    'evidence', coalesce((select jsonb_agg(jsonb_build_object('id', e.id, 'storagePath', e.storage_path, 'createdAt', e.created_at) order by e.created_at) from public.complaint_evidence e where e.complaint_id = c.id), '[]'::jsonb)
  ) order by c.created_at desc) from public.complaints c where c.application_id = p_application_id), '[]'::jsonb);
end;
$$;

create or replace function public.get_dealer_complaint_state()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_company uuid := private.current_approved_company_id();
begin
  if v_company is null then raise exception 'approved_company_required'; end if;
  return coalesce((select jsonb_agg(jsonb_build_object(
    'id', c.id, 'reference', c.reference, 'applicationId', c.application_id, 'paymentOrderId', c.payment_order_id,
    'category', c.category, 'status', c.status, 'summary', c.summary, 'resolution', c.resolution, 'createdAt', c.created_at,
    'messages', coalesce((select jsonb_agg(jsonb_build_object('id', m.id, 'authorKind', m.author_kind, 'body', m.body, 'createdAt', m.created_at) order by m.created_at) from public.complaint_messages m where m.complaint_id = c.id), '[]'::jsonb),
    'evidence', coalesce((select jsonb_agg(jsonb_build_object('id', e.id, 'storagePath', e.storage_path, 'createdAt', e.created_at) order by e.created_at) from public.complaint_evidence e where e.complaint_id = c.id), '[]'::jsonb)
  ) order by c.created_at desc) from public.complaints c where c.complainant_company_id = v_company or c.buyer_company_id = v_company), '[]'::jsonb);
end;
$$;

create or replace function public.get_admin_complaint_state(p_application_id uuid)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  if not private.is_staff() or auth.jwt()->>'aal' <> 'aal2' then raise exception 'staff_aal2_required'; end if;
  return coalesce((select jsonb_agg(jsonb_build_object(
    'id', c.id, 'reference', c.reference, 'category', c.category, 'status', c.status, 'summary', c.summary,
    'complainantKind', c.complainant_kind, 'requiresIndependentReview', c.requires_independent_review,
    'independentReviewedBy', c.independent_reviewed_by, 'independentReviewedAt', c.independent_reviewed_at,
    'independentReviewNotes', c.independent_review_notes, 'resolution', c.resolution, 'resolvedBy', c.resolved_by,
    'createdAt', c.created_at,
    'messages', coalesce((select jsonb_agg(jsonb_build_object('id', m.id, 'authorKind', m.author_kind, 'body', m.body, 'createdAt', m.created_at) order by m.created_at) from public.complaint_messages m where m.complaint_id = c.id), '[]'::jsonb),
    'evidence', coalesce((select jsonb_agg(jsonb_build_object('id', e.id, 'storagePath', e.storage_path, 'createdAt', e.created_at) order by e.created_at) from public.complaint_evidence e where e.complaint_id = c.id), '[]'::jsonb)
  ) order by c.created_at desc) from public.complaints c where c.application_id = p_application_id), '[]'::jsonb);
end;
$$;

create or replace function public.get_admin_operations_dashboard()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  if not private.is_staff() or auth.jwt()->>'aal' <> 'aal2' then raise exception 'staff_aal2_required'; end if;
  return jsonb_build_object(
    'outbox', jsonb_build_object(
      'pending', (select count(*) from public.notification_outbox where status = 'pending'),
      'failed', (select count(*) from public.notification_outbox where status = 'failed'),
      'processing', (select count(*) from public.notification_outbox where status = 'processing'),
      'deadLetter', (select count(*) from public.notification_outbox where status = 'failed' and attempt_count >= 8),
      'oldestDueAt', (select min(next_attempt_at) from public.notification_outbox where status in ('pending', 'failed'))
    ),
    'complaints', jsonb_build_object(
      'open', (select count(*) from public.complaints where status in ('open', 'in_review', 'waiting_external')),
      'independentReviewRequired', (select count(*) from public.complaints where requires_independent_review and independent_reviewed_at is null and status not in ('resolved', 'rejected', 'withdrawn'))
    ),
    'incidents', coalesce((select jsonb_agg(jsonb_build_object('id', i.id, 'severity', i.severity, 'status', i.status, 'summary', i.summary, 'impact', i.impact, 'resolution', i.resolution, 'createdAt', i.created_at) order by i.created_at desc) from public.operational_incidents i where i.status <> 'resolved'), '[]'::jsonb),
    'lastReconciliation', (select jsonb_build_object('id', r.id, 'status', r.status, 'checkedCount', r.checked_count, 'mismatchCount', r.mismatch_count, 'completedAt', r.completed_at) from public.payment_reconciliation_runs r order by r.started_at desc limit 1),
    'lastOutboxRun', (select jsonb_build_object('id', r.id, 'status', r.status, 'processedCount', r.processed_count, 'failedCount', r.failed_count, 'completedAt', r.completed_at) from public.operation_runs r where r.operation_type = 'outbox_delivery' order by r.started_at desc limit 1),
    'lastRecoveryTest', (select jsonb_build_object('id', r.id, 'status', r.status, 'databaseRestored', r.database_restored, 'storageRestored', r.storage_restored, 'tableCount', r.restored_table_count, 'objectCount', r.restored_object_count, 'completedAt', r.completed_at) from public.recovery_test_runs r order by r.completed_at desc limit 1),
    'testInvoices', coalesce((select jsonb_agg(jsonb_build_object('id', i.id, 'paymentOrderId', i.payment_order_id, 'documentType', i.document_type, 'documentNumber', i.document_number, 'status', i.status, 'reason', i.reason, 'createdAt', i.created_at) order by i.created_at desc) from public.platform_invoice_records i), '[]'::jsonb)
  );
end;
$$;

revoke all on function private.can_access_complaint(uuid) from public, anon, authenticated;
revoke all on function private.complaint_buyer_company(uuid) from public, anon, authenticated;
revoke all on function private.insert_complaint_receipt(public.complaints, text) from public, anon, authenticated;
revoke all on function public.seller_open_complaint(uuid, text, text, uuid) from public, anon, authenticated;
revoke all on function public.dealer_open_complaint(uuid, text, text, uuid) from public, anon, authenticated;
revoke all on function public.add_complaint_message(uuid, text) from public, anon, authenticated;
revoke all on function public.register_complaint_evidence(uuid, uuid, text, bigint, text) from public, anon, authenticated;
revoke all on function public.admin_review_complaint(uuid, text) from public, anon, authenticated;
revoke all on function public.admin_update_complaint(uuid, text, text) from public, anon, authenticated;
revoke all on function public.admin_set_platform_affiliation(uuid, boolean) from public, anon, authenticated;
revoke all on function public.admin_create_test_invoice_record(uuid, text, uuid, text) from public, anon, authenticated;
revoke all on function public.admin_create_incident(text, text, text) from public, anon, authenticated;
revoke all on function public.admin_update_incident(uuid, text, text) from public, anon, authenticated;
revoke all on function public.claim_notification_batch(uuid, integer) from public, anon, authenticated;
revoke all on function public.complete_notification_delivery(uuid, uuid, boolean, text) from public, anon, authenticated;
revoke all on function public.start_operation_run(text, uuid) from public, anon, authenticated;
revoke all on function public.finish_operation_run(uuid, text, integer, integer, jsonb) from public, anon, authenticated;
revoke all on function public.record_local_recovery_test(text, boolean, boolean, integer, integer, jsonb, timestamptz) from public, anon, authenticated;
revoke all on function public.get_seller_complaint_state(uuid) from public, anon, authenticated;
revoke all on function public.get_dealer_complaint_state() from public, anon, authenticated;
revoke all on function public.get_admin_complaint_state(uuid) from public, anon, authenticated;
revoke all on function public.get_admin_operations_dashboard() from public, anon, authenticated;

grant execute on function public.seller_open_complaint(uuid, text, text, uuid) to authenticated;
grant execute on function public.dealer_open_complaint(uuid, text, text, uuid) to authenticated;
grant execute on function public.add_complaint_message(uuid, text) to authenticated;
grant execute on function public.admin_review_complaint(uuid, text) to authenticated;
grant execute on function public.admin_update_complaint(uuid, text, text) to authenticated;
grant execute on function public.admin_set_platform_affiliation(uuid, boolean) to authenticated;
grant execute on function public.admin_create_test_invoice_record(uuid, text, uuid, text) to authenticated;
grant execute on function public.admin_create_incident(text, text, text) to authenticated;
grant execute on function public.admin_update_incident(uuid, text, text) to authenticated;
grant execute on function public.get_seller_complaint_state(uuid) to authenticated;
grant execute on function public.get_dealer_complaint_state() to authenticated;
grant execute on function public.get_admin_complaint_state(uuid) to authenticated;
grant execute on function public.get_admin_operations_dashboard() to authenticated;

grant execute on function public.register_complaint_evidence(uuid, uuid, text, bigint, text) to service_role;
grant execute on function public.claim_notification_batch(uuid, integer) to service_role;
grant execute on function public.complete_notification_delivery(uuid, uuid, boolean, text) to service_role;
grant execute on function public.start_operation_run(text, uuid) to service_role;
grant execute on function public.finish_operation_run(uuid, text, integer, integer, jsonb) to service_role;
grant execute on function public.record_local_recovery_test(text, boolean, boolean, integer, integer, jsonb, timestamptz) to service_role;
