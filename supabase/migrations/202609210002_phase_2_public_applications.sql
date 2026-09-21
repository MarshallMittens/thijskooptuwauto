create table public.application_drafts (
  id uuid primary key default gen_random_uuid(),
  actor_key text not null check (actor_key ~ '^[0-9a-f]{64}$'),
  idempotency_key uuid not null,
  token_hash text not null check (token_hash ~ '^[0-9a-f]{64}$'),
  photo_count smallint not null check (photo_count between 1 and 12),
  expires_at timestamptz not null default (now() + interval '30 minutes'),
  finalized_application_id uuid references public.applications(id),
  created_at timestamptz not null default now(),
  unique (actor_key, idempotency_key)
);

create table private.public_submission_limits (
  actor_key text not null,
  scope text not null check (scope in ('application_draft', 'form_start', 'rdw_lookup')),
  window_start timestamptz not null,
  attempt_count integer not null check (attempt_count > 0),
  primary key (actor_key, scope, window_start)
);

create table private.product_events (
  id bigint generated always as identity primary key,
  event_name text not null check (event_name in ('application_form_started', 'application_completed')),
  event_key uuid not null,
  occurred_at timestamptz not null default now(),
  unique (event_name, event_key)
);

create index applications_status_created_idx on public.applications (status, created_at desc);
create index vehicle_photos_application_idx on public.vehicle_photos (application_id, sort_order);
create index internal_notes_application_idx on public.internal_notes (application_id, created_at desc);

revoke all on public.application_drafts from public, anon, authenticated;
alter table public.application_drafts enable row level security;

create or replace function public.create_public_application_draft(
  p_actor_key text,
  p_idempotency_key uuid,
  p_token_hash text,
  p_photo_count integer
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_window timestamptz := date_trunc('hour', now());
  v_attempts integer;
  v_draft public.application_drafts;
  v_created boolean := false;
begin
  if coalesce(auth.role(), '') <> 'service_role' then raise exception 'service_role_required'; end if;
  if p_actor_key !~ '^[0-9a-f]{64}$' or p_token_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'invalid_security_context';
  end if;
  if p_photo_count not between 1 and 12 then raise exception 'invalid_photo_count'; end if;

  select * into v_draft
  from public.application_drafts
  where actor_key = p_actor_key and idempotency_key = p_idempotency_key;

  if found then
    if v_draft.finalized_application_id is null then
      update public.application_drafts
      set token_hash = p_token_hash,
          photo_count = p_photo_count,
          expires_at = now() + interval '30 minutes'
      where id = v_draft.id
      returning * into v_draft;
    end if;

    return jsonb_build_object(
      'draft_id', v_draft.id,
      'expires_at', v_draft.expires_at,
      'finalized_application_id', v_draft.finalized_application_id,
      'created', false
    );
  end if;

  insert into public.application_drafts (actor_key, idempotency_key, token_hash, photo_count)
  values (p_actor_key, p_idempotency_key, p_token_hash, p_photo_count)
  on conflict (actor_key, idempotency_key) do nothing
  returning * into v_draft;

  if found then
    insert into private.public_submission_limits (actor_key, scope, window_start, attempt_count)
    values (p_actor_key, 'application_draft', v_window, 1)
    on conflict (actor_key, scope, window_start)
    do update set attempt_count = private.public_submission_limits.attempt_count + 1
    returning attempt_count into v_attempts;
    if v_attempts > 10 then raise exception 'rate_limit_exceeded'; end if;

    v_created := true;
  else
    select * into v_draft
    from public.application_drafts
    where actor_key = p_actor_key and idempotency_key = p_idempotency_key
    for update;
    if v_draft.finalized_application_id is null then
      update public.application_drafts
      set token_hash = p_token_hash,
          photo_count = p_photo_count,
          expires_at = now() + interval '30 minutes'
      where id = v_draft.id
      returning * into v_draft;
    end if;
  end if;

  return jsonb_build_object(
    'draft_id', v_draft.id,
    'expires_at', v_draft.expires_at,
    'finalized_application_id', v_draft.finalized_application_id,
    'created', v_created
  );
end;
$$;

create or replace function public.consume_public_rate_limit(
  p_actor_key text,
  p_scope text,
  p_max_attempts integer
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_attempts integer;
begin
  if coalesce(auth.role(), '') <> 'service_role' then raise exception 'service_role_required'; end if;
  if p_actor_key !~ '^[0-9a-f]{64}$' then raise exception 'invalid_actor_key'; end if;
  if p_scope not in ('form_start', 'rdw_lookup') or p_max_attempts not between 1 and 1000 then raise exception 'invalid_rate_limit'; end if;

  insert into private.public_submission_limits (actor_key, scope, window_start, attempt_count)
  values (p_actor_key, p_scope, date_trunc('hour', now()), 1)
  on conflict (actor_key, scope, window_start)
  do update set attempt_count = private.public_submission_limits.attempt_count + 1
  returning attempt_count into v_attempts;
  return v_attempts <= p_max_attempts;
end;
$$;

create or replace function public.record_public_form_start(p_event_key uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if coalesce(auth.role(), '') <> 'service_role' then raise exception 'service_role_required'; end if;
  insert into private.product_events (event_name, event_key)
  values ('application_form_started', p_event_key)
  on conflict (event_name, event_key) do nothing;
end;
$$;

create or replace function public.finalize_public_application(
  p_draft_id uuid,
  p_actor_key text,
  p_token_hash text,
  p_payload jsonb,
  p_photos jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_draft public.application_drafts;
  v_seller_id uuid;
  v_vehicle_id uuid;
  v_application_id uuid;
  v_reference text;
  v_email text := lower(trim(p_payload#>>'{seller,email}'));
  v_registration text := upper(regexp_replace(coalesce(p_payload#>>'{vehicle,registration}', ''), '[^A-Z0-9]', '', 'g'));
  v_photo record;
begin
  if coalesce(auth.role(), '') <> 'service_role' then raise exception 'service_role_required'; end if;

  select * into v_draft
  from public.application_drafts
  where id = p_draft_id
    and actor_key = p_actor_key
    and token_hash = p_token_hash
  for update;

  if not found or v_draft.expires_at <= now() then raise exception 'invalid_or_expired_draft'; end if;

  if v_draft.finalized_application_id is not null then
    select public_reference into v_reference
    from public.applications where id = v_draft.finalized_application_id;
    return jsonb_build_object(
      'application_id', v_draft.finalized_application_id,
      'reference', v_reference,
      'created', false
    );
  end if;

  if v_registration !~ '^[A-Z0-9]{6,8}$' then raise exception 'invalid_registration'; end if;
  if coalesce(char_length(trim(p_payload#>>'{vehicle,make}')) between 1 and 80, false) is not true then raise exception 'invalid_make'; end if;
  if coalesce(char_length(trim(p_payload#>>'{vehicle,model}')) between 1 and 120, false) is not true then raise exception 'invalid_model'; end if;
  if char_length(coalesce(trim(p_payload#>>'{vehicle,variant}'), '')) > 120 then raise exception 'invalid_variant'; end if;
  if char_length(coalesce(trim(p_payload#>>'{vehicle,fuelType}'), '')) > 60 then raise exception 'invalid_fuel_type'; end if;
  if char_length(coalesce(trim(p_payload#>>'{vehicle,color}'), '')) > 60 then raise exception 'invalid_color'; end if;
  if nullif(p_payload#>>'{vehicle,year}', '') is not null and (p_payload#>>'{vehicle,year}')::integer not between 1900 and extract(year from now())::integer + 1 then raise exception 'invalid_year'; end if;
  if coalesce((p_payload#>>'{condition,mileageKm}')::integer between 0 and 3000000, false) is not true then raise exception 'invalid_mileage'; end if;
  if coalesce((p_payload#>>'{condition,keyCount}')::integer between 0 and 10, false) is not true then raise exception 'invalid_key_count'; end if;
  if char_length(coalesce(p_payload#>>'{condition,damageDescription}', '')) > 2000
    or char_length(coalesce(p_payload#>>'{condition,technicalIssues}', '')) > 2000
    or char_length(coalesce(p_payload#>>'{condition,maintenanceDescription}', '')) > 2000
    or char_length(coalesce(p_payload#>>'{condition,remarks}', '')) > 2000
  then raise exception 'invalid_condition_text'; end if;
  if coalesce(char_length(trim(p_payload#>>'{seller,fullName}')) between 2 and 120, false) is not true then raise exception 'invalid_seller_name'; end if;
  if v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' or char_length(v_email) > 254 then raise exception 'invalid_seller_email'; end if;
  if coalesce(char_length(trim(p_payload#>>'{seller,phone}')) between 8 and 30, false) is not true then raise exception 'invalid_seller_phone'; end if;
  if upper(regexp_replace(coalesce(p_payload#>>'{seller,postalCode}', ''), '[[:space:]]', '', 'g')) !~ '^\d{4}[A-Z]{2}$' then raise exception 'invalid_seller_postal_code'; end if;
  if coalesce(jsonb_typeof(p_photos), 'null') <> 'array' or coalesce(jsonb_array_length(p_photos), -1) <> v_draft.photo_count then raise exception 'invalid_photos'; end if;

  insert into public.seller_contacts (full_name, email, phone, postal_code, desired_sale_date)
  values (
    trim(p_payload#>>'{seller,fullName}'),
    v_email,
    trim(p_payload#>>'{seller,phone}'),
    upper(regexp_replace(p_payload#>>'{seller,postalCode}', '[[:space:]]', '', 'g')),
    nullif(p_payload#>>'{seller,desiredSaleDate}', '')::date
  ) returning id into v_seller_id;

  insert into public.vehicles (
    registration_normalized, make, model, variant, year, fuel_type, color,
    rdw_source_data, rdw_fetched_at
  ) values (
    v_registration,
    trim(p_payload#>>'{vehicle,make}'),
    trim(p_payload#>>'{vehicle,model}'),
    nullif(trim(p_payload#>>'{vehicle,variant}'), ''),
    nullif(p_payload#>>'{vehicle,year}', '')::integer,
    nullif(trim(p_payload#>>'{vehicle,fuelType}'), ''),
    nullif(trim(p_payload#>>'{vehicle,color}'), ''),
    case when jsonb_typeof(p_payload#>'{vehicle,rdwSourceData}') = 'object' then p_payload#>'{vehicle,rdwSourceData}' else null end,
    nullif(p_payload#>>'{vehicle,rdwFetchedAt}', '')::timestamptz
  ) returning id into v_vehicle_id;

  insert into public.applications (seller_contact_id, vehicle_id, status, submitted_at)
  values (v_seller_id, v_vehicle_id, 'submitted', now())
  returning id, public_reference into v_application_id, v_reference;

  insert into public.condition_reports (
    application_id, mileage_km, damage_description, technical_issues,
    maintenance_description, key_count, remarks
  ) values (
    v_application_id,
    (p_payload#>>'{condition,mileageKm}')::integer,
    nullif(trim(p_payload#>>'{condition,damageDescription}'), ''),
    nullif(trim(p_payload#>>'{condition,technicalIssues}'), ''),
    nullif(trim(p_payload#>>'{condition,maintenanceDescription}'), ''),
    (p_payload#>>'{condition,keyCount}')::integer,
    nullif(trim(p_payload#>>'{condition,remarks}'), '')
  );

  for v_photo in
    select * from jsonb_to_recordset(p_photos) as x(
      storage_path text,
      media_type text,
      size_bytes bigint,
      sha256 text,
      sort_order smallint
    )
  loop
    if v_photo.storage_path !~ ('^' || p_draft_id::text || '/[0-9]{1,2}\.jpg$')
      or v_photo.media_type <> 'image/jpeg'
      or v_photo.size_bytes not between 1 and 10485760
      or v_photo.sha256 !~ '^[0-9a-f]{64}$'
      or v_photo.sort_order not between 0 and 11
    then raise exception 'invalid_photo_metadata'; end if;

    insert into public.vehicle_photos (
      application_id, storage_path, media_type, size_bytes, sha256,
      sort_order, review_status, metadata_removed_at
    ) values (
      v_application_id, v_photo.storage_path, v_photo.media_type,
      v_photo.size_bytes, v_photo.sha256, v_photo.sort_order, 'pending', now()
    );
  end loop;

  insert into public.notification_outbox (
    event_type, entity_type, entity_id, recipient, payload, idempotency_key
  ) values (
    'application.received', 'application', v_application_id, v_email,
    jsonb_build_object('reference', v_reference, 'full_name', trim(p_payload#>>'{seller,fullName}')),
    'application.received:' || v_application_id::text
  );

  insert into public.audit_log (action, entity_type, entity_id, after_data, request_id)
  values ('application.submitted', 'application', v_application_id, jsonb_build_object('status', 'submitted'), v_draft.id);

  update public.application_drafts
  set finalized_application_id = v_application_id
  where id = v_draft.id;

  insert into private.product_events (event_name, event_key)
  values ('application_completed', v_draft.idempotency_key)
  on conflict (event_name, event_key) do nothing;

  insert into public.request_idempotency (scope, actor_key, idempotency_key, resource_type, resource_id)
  values ('public_application', p_actor_key, v_draft.idempotency_key, 'application', v_application_id)
  on conflict (scope, actor_key, idempotency_key) do nothing;

  return jsonb_build_object('application_id', v_application_id, 'reference', v_reference, 'created', true);
end;
$$;

create or replace function public.list_admin_applications()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_result jsonb;
begin
  if not private.is_staff() or coalesce(auth.jwt()->>'aal', 'aal1') <> 'aal2' then raise exception 'staff_aal2_required'; end if;
  select coalesce(jsonb_agg(jsonb_build_object(
        'id', a.id,
        'reference', a.public_reference,
        'status', a.status,
        'submittedAt', a.submitted_at,
        'createdAt', a.created_at,
        'sellerName', s.full_name,
        'registration', v.registration_normalized,
        'make', v.make,
        'model', v.model,
        'photoCount', (select count(*) from public.vehicle_photos p where p.application_id = a.id)
      ) order by a.created_at desc)
    , '[]'::jsonb) into v_result
  from public.applications a
  left join public.seller_contacts s on s.id = a.seller_contact_id
  join public.vehicles v on v.id = a.vehicle_id;
  return v_result;
end;
$$;

create or replace function public.get_admin_application(p_application_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_result jsonb;
begin
  if not private.is_staff() or coalesce(auth.jwt()->>'aal', 'aal1') <> 'aal2' then raise exception 'staff_aal2_required'; end if;

  select jsonb_build_object(
    'id', a.id,
    'reference', a.public_reference,
    'status', a.status,
    'submittedAt', a.submitted_at,
    'seller', jsonb_build_object(
      'fullName', s.full_name, 'email', s.email, 'phone', s.phone,
      'postalCode', s.postal_code, 'desiredSaleDate', s.desired_sale_date
    ),
    'vehicle', jsonb_build_object(
      'registration', v.registration_normalized, 'make', v.make, 'model', v.model,
      'variant', v.variant, 'year', v.year, 'fuelType', v.fuel_type,
      'color', v.color, 'rdwFetchedAt', v.rdw_fetched_at
    ),
    'condition', jsonb_build_object(
      'mileageKm', c.mileage_km, 'damageDescription', c.damage_description,
      'technicalIssues', c.technical_issues, 'maintenanceDescription', c.maintenance_description,
      'keyCount', c.key_count, 'remarks', c.remarks
    ),
    'photos', coalesce((select jsonb_agg(jsonb_build_object(
      'id', p.id, 'storagePath', p.storage_path, 'reviewStatus', p.review_status,
      'sortOrder', p.sort_order, 'sizeBytes', p.size_bytes
    ) order by p.sort_order) from public.vehicle_photos p where p.application_id = a.id), '[]'::jsonb),
    'notes', coalesce((select jsonb_agg(jsonb_build_object(
      'id', n.id, 'body', n.body, 'createdAt', n.created_at,
      'author', coalesce(pr.display_name, 'Beheer')
    ) order by n.created_at desc) from public.internal_notes n left join public.profiles pr on pr.id = n.author_id where n.application_id = a.id), '[]'::jsonb)
  ) into v_result
  from public.applications a
  left join public.seller_contacts s on s.id = a.seller_contact_id
  join public.vehicles v on v.id = a.vehicle_id
  left join public.condition_reports c on c.application_id = a.id
  where a.id = p_application_id;

  if v_result is null then raise exception 'application_not_found'; end if;
  return v_result;
end;
$$;

create or replace function public.admin_update_application_status(
  p_application_id uuid,
  p_status public.application_status
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_before public.application_status;
begin
  if not private.is_staff() or coalesce(auth.jwt()->>'aal', 'aal1') <> 'aal2' then raise exception 'staff_aal2_required'; end if;
  select status into v_before from public.applications where id = p_application_id for update;
  if v_before is null then raise exception 'application_not_found'; end if;

  if not (
    (v_before = 'submitted' and p_status in ('in_review', 'needs_information', 'withdrawn'))
    or (v_before = 'in_review' and p_status in ('needs_information', 'ready', 'withdrawn', 'closed'))
    or (v_before = 'needs_information' and p_status in ('in_review', 'withdrawn'))
    or (v_before = 'ready' and p_status in ('in_review', 'closed', 'withdrawn'))
    or v_before = p_status
  ) then raise exception 'invalid_status_transition'; end if;

  update public.applications set status = p_status, updated_at = now() where id = p_application_id;
  insert into public.audit_log (actor_id, action, entity_type, entity_id, before_data, after_data)
  values (auth.uid(), 'application.status_changed', 'application', p_application_id, jsonb_build_object('status', v_before), jsonb_build_object('status', p_status));
end;
$$;

create or replace function public.admin_add_internal_note(p_application_id uuid, p_body text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_note_id uuid;
begin
  if not private.is_staff() or coalesce(auth.jwt()->>'aal', 'aal1') <> 'aal2' then raise exception 'staff_aal2_required'; end if;
  if char_length(trim(coalesce(p_body, ''))) not between 1 and 2000 then raise exception 'invalid_note'; end if;
  if not exists(select 1 from public.applications where id = p_application_id) then raise exception 'application_not_found'; end if;

  insert into public.internal_notes (application_id, author_id, body)
  values (p_application_id, auth.uid(), trim(p_body)) returning id into v_note_id;
  insert into public.audit_log (actor_id, action, entity_type, entity_id, after_data)
  values (auth.uid(), 'application.note_added', 'application', p_application_id, jsonb_build_object('note_id', v_note_id));
  return v_note_id;
end;
$$;

create or replace function public.admin_set_photo_review(p_photo_id uuid, p_status public.photo_review_status)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_application_id uuid;
  v_before public.photo_review_status;
begin
  if not private.is_staff() or coalesce(auth.jwt()->>'aal', 'aal1') <> 'aal2' then raise exception 'staff_aal2_required'; end if;
  if p_status not in ('approved', 'rejected') then raise exception 'invalid_photo_status'; end if;
  select application_id, review_status into v_application_id, v_before from public.vehicle_photos where id = p_photo_id for update;
  if v_application_id is null then raise exception 'photo_not_found'; end if;
  update public.vehicle_photos set review_status = p_status, reviewed_at = now(), reviewed_by = auth.uid() where id = p_photo_id;
  insert into public.audit_log (actor_id, action, entity_type, entity_id, before_data, after_data)
  values (auth.uid(), 'photo.reviewed', 'vehicle_photo', p_photo_id, jsonb_build_object('status', v_before), jsonb_build_object('status', p_status, 'application_id', v_application_id));
end;
$$;

revoke all on function public.create_public_application_draft(text, uuid, text, integer) from public, anon, authenticated;
revoke all on function public.finalize_public_application(uuid, text, text, jsonb, jsonb) from public, anon, authenticated;
revoke all on function public.record_public_form_start(uuid) from public, anon, authenticated;
revoke all on function public.consume_public_rate_limit(text, text, integer) from public, anon, authenticated;
grant execute on function public.create_public_application_draft(text, uuid, text, integer) to service_role;
grant execute on function public.finalize_public_application(uuid, text, text, jsonb, jsonb) to service_role;
grant execute on function public.record_public_form_start(uuid) to service_role;
grant execute on function public.consume_public_rate_limit(text, text, integer) to service_role;

revoke all on function public.list_admin_applications() from public, anon;
revoke all on function public.get_admin_application(uuid) from public, anon;
revoke all on function public.admin_update_application_status(uuid, public.application_status) from public, anon;
revoke all on function public.admin_add_internal_note(uuid, text) from public, anon;
revoke all on function public.admin_set_photo_review(uuid, public.photo_review_status) from public, anon;
grant execute on function public.list_admin_applications() to authenticated;
grant execute on function public.get_admin_application(uuid) to authenticated;
grant execute on function public.admin_update_application_status(uuid, public.application_status) to authenticated;
grant execute on function public.admin_add_internal_note(uuid, text) to authenticated;
grant execute on function public.admin_set_photo_review(uuid, public.photo_review_status) to authenticated;
