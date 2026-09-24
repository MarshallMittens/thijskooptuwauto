-- Phase 7 internal review: close complaint mutation gaps and allow the winner to report problems before checkout.

create or replace function public.can_upload_complaint_evidence(p_complaint_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select private.can_access_complaint(p_complaint_id)
    and exists (
      select 1 from public.complaints c
      where c.id = p_complaint_id
        and c.status in ('open', 'in_review', 'waiting_external')
    );
$$;

create or replace function public.dealer_open_complaint_for_reservation(
  p_winner_reservation_id uuid,
  p_category text,
  p_summary text,
  p_idempotency_key uuid
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := auth.uid();
  v_company uuid := private.current_approved_company_id();
  v_application uuid;
  v_payment uuid;
  v_email text;
  v_complaint public.complaints;
begin
  if v_user is null or v_company is null then raise exception 'approved_company_required'; end if;
  select l.application_id into v_application
  from public.winner_reservations wr
  join public.bid_rounds br on br.id = wr.bid_round_id
  join public.listings l on l.id = br.listing_id
  where wr.id = p_winner_reservation_id and wr.company_id = v_company;
  if v_application is null then raise exception 'winner_reservation_not_owned'; end if;
  if p_category not in ('appointment', 'inspection', 'price', 'payment', 'handover', 'conduct', 'other') then raise exception 'invalid_complaint_category'; end if;
  if char_length(trim(p_summary)) not between 20 and 4000 then raise exception 'invalid_complaint_summary'; end if;
  select * into v_complaint from public.complaints
  where complainant_user_id = v_user and idempotency_key = p_idempotency_key;
  if found then
    if v_complaint.application_id <> v_application or v_complaint.category <> p_category or v_complaint.summary <> trim(p_summary) then
      raise exception 'idempotency_conflict';
    end if;
    return jsonb_build_object('id', v_complaint.id, 'reference', v_complaint.reference, 'created', false);
  end if;
  select id into v_payment from public.payment_orders
  where application_id = v_application and company_id = v_company
  order by created_at desc limit 1;
  select email into v_email from public.companies where id = v_company;
  insert into public.complaints(application_id, payment_order_id, complainant_kind, complainant_user_id,
    complainant_company_id, buyer_company_id, category, summary, requires_independent_review, idempotency_key)
  values (v_application, v_payment, 'dealer', v_user, v_company, v_company, p_category, trim(p_summary),
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
  v_status text;
begin
  if v_user is null or not private.can_access_complaint(p_complaint_id) then raise exception 'complaint_access_required'; end if;
  if char_length(trim(p_body)) not between 2 and 4000 then raise exception 'invalid_complaint_message'; end if;
  select status into v_status from public.complaints where id = p_complaint_id for update;
  if v_status not in ('open', 'in_review', 'waiting_external') then raise exception 'complaint_closed'; end if;
  select case when exists(select 1 from public.staff_memberships s where s.user_id = v_user) then 'staff'
    when exists(select 1 from public.seller_application_access s join public.complaints c on c.application_id = s.application_id where c.id = p_complaint_id and s.user_id = v_user) then 'seller'
    else 'dealer' end into v_kind;
  insert into public.complaint_messages(complaint_id, author_id, author_kind, body)
  values(p_complaint_id, v_user, v_kind, trim(p_body)) returning id into v_id;
  update public.complaints set updated_at = clock_timestamp(),
    status = case when status = 'open' then 'in_review' else status end where id = p_complaint_id;
  insert into public.audit_log(actor_id, action, entity_type, entity_id, after_data)
  values(v_user, 'complaint.message_added', 'complaint', p_complaint_id, jsonb_build_object('message_id', v_id));
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
  where id = p_complaint_id and requires_independent_review and complainant_user_id <> v_user
    and independent_reviewed_at is null and status in ('open', 'in_review', 'waiting_external');
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
  if v_complaint.status not in ('open', 'in_review', 'waiting_external') then raise exception 'complaint_closed'; end if;
  if p_status in ('resolved', 'rejected') then
    if char_length(trim(p_resolution)) not between 10 and 4000 then raise exception 'resolution_required'; end if;
    if v_complaint.requires_independent_review and (v_complaint.independent_reviewed_by is null or v_complaint.independent_reviewed_by = v_user) then
      raise exception 'independent_second_reviewer_required';
    end if;
  end if;
  update public.complaints set status = p_status,
    resolution = case when p_status in ('resolved', 'rejected') then trim(p_resolution) else null end,
    resolved_by = case when p_status in ('resolved', 'rejected') then v_user else null end,
    resolved_at = case when p_status in ('resolved', 'rejected') then clock_timestamp() else null end,
    updated_at = clock_timestamp()
  where id = p_complaint_id;
  insert into public.audit_log(actor_id, action, entity_type, entity_id, before_data, after_data)
  values(v_user, 'complaint.status_changed', 'complaint', p_complaint_id,
    jsonb_build_object('status', v_complaint.status), jsonb_build_object('status', p_status));
end;
$$;

create or replace function public.register_complaint_evidence(
  p_complaint_id uuid,
  p_actor_id uuid,
  p_storage_path text,
  p_size_bytes bigint,
  p_sha256 text
) returns uuid language plpgsql security definer set search_path = '' as $$
declare v_id uuid; v_complaint public.complaints;
begin
  if coalesce(auth.role(), '') <> 'service_role' then raise exception 'service_role_required'; end if;
  if p_storage_path !~ ('^complaints/' || p_complaint_id::text || '/[0-9a-f-]{36}-[0-9a-f]{64}\.jpg$') then raise exception 'invalid_evidence_path'; end if;
  select * into v_complaint from public.complaints where id = p_complaint_id for update;
  if not found or not (
    exists(select 1 from public.staff_memberships s where s.user_id = p_actor_id)
    or exists(select 1 from public.seller_application_access s where s.application_id = v_complaint.application_id and s.user_id = p_actor_id)
    or exists(select 1 from public.company_memberships m join public.companies co on co.id = m.company_id
      where m.user_id = p_actor_id and m.status = 'active' and co.status = 'approved'
      and m.company_id in (v_complaint.complainant_company_id, v_complaint.buyer_company_id))
  ) then raise exception 'complaint_actor_access_required'; end if;
  if v_complaint.status not in ('open', 'in_review', 'waiting_external') then raise exception 'complaint_closed'; end if;
  if not exists(select 1 from storage.objects where bucket_id = 'complaint-evidence' and name = p_storage_path) then raise exception 'evidence_object_missing'; end if;
  if (select count(*) from public.complaint_evidence where complaint_id = p_complaint_id) >= 8 then raise exception 'evidence_limit_reached'; end if;
  insert into public.complaint_evidence(complaint_id, uploaded_by, storage_path, media_type, size_bytes, sha256)
  values(p_complaint_id, p_actor_id, p_storage_path, 'image/jpeg', p_size_bytes, p_sha256) returning id into v_id;
  insert into public.audit_log(actor_id, action, entity_type, entity_id, after_data)
  values(p_actor_id, 'complaint.evidence_added', 'complaint', p_complaint_id, jsonb_build_object('evidence_id', v_id, 'sha256', p_sha256));
  return v_id;
end;
$$;

revoke all on function public.can_upload_complaint_evidence(uuid) from public, anon, authenticated;
revoke all on function public.dealer_open_complaint_for_reservation(uuid, text, text, uuid) from public, anon, authenticated;
grant execute on function public.can_upload_complaint_evidence(uuid) to authenticated;
grant execute on function public.dealer_open_complaint_for_reservation(uuid, text, text, uuid) to authenticated;
