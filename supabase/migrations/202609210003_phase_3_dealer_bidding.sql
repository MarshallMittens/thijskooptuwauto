alter table public.vehicles add column if not exists vehicle_type text;

alter table public.application_drafts
  drop constraint if exists application_drafts_actor_key_idempotency_key_key;
alter table public.application_drafts
  add constraint application_drafts_idempotency_key_key unique (idempotency_key);

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
  if p_actor_key !~ '^[0-9a-f]{64}$' or p_token_hash !~ '^[0-9a-f]{64}$' then raise exception 'invalid_security_context'; end if;
  if p_photo_count not between 1 and 12 then raise exception 'invalid_photo_count'; end if;

  select * into v_draft
  from public.application_drafts
  where idempotency_key = p_idempotency_key
  for update;

  if found then
    if v_draft.finalized_application_id is null then
      update public.application_drafts
      set actor_key = p_actor_key,
          token_hash = p_token_hash,
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

  insert into private.public_submission_limits (actor_key, scope, window_start, attempt_count)
  values (p_actor_key, 'application_draft', v_window, 1)
  on conflict (actor_key, scope, window_start)
  do update set attempt_count = private.public_submission_limits.attempt_count + 1
  returning attempt_count into v_attempts;
  if v_attempts > 10 then raise exception 'rate_limit_exceeded'; end if;

  insert into public.application_drafts (actor_key, idempotency_key, token_hash, photo_count)
  values (p_actor_key, p_idempotency_key, p_token_hash, p_photo_count)
  on conflict (idempotency_key) do nothing
  returning * into v_draft;

  if found then
    v_created := true;
  else
    select * into v_draft
    from public.application_drafts
    where idempotency_key = p_idempotency_key
    for update;
    if v_draft.finalized_application_id is null then
      update public.application_drafts
      set actor_key = p_actor_key,
          token_hash = p_token_hash,
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
  if p_actor_key !~ '^[0-9a-f]{64}$' then raise exception 'invalid_security_context'; end if;

  select * into v_draft
  from public.application_drafts
  where id = p_draft_id and token_hash = p_token_hash
  for update;

  if not found or v_draft.expires_at <= now() then raise exception 'invalid_or_expired_draft'; end if;

  if v_draft.finalized_application_id is not null then
    select public_reference into v_reference from public.applications where id = v_draft.finalized_application_id;
    return jsonb_build_object('application_id', v_draft.finalized_application_id, 'reference', v_reference, 'created', false);
  end if;

  if v_registration !~ '^[A-Z0-9]{6,8}$' then raise exception 'invalid_registration'; end if;
  if coalesce(char_length(trim(p_payload#>>'{vehicle,make}')) between 1 and 80, false) is not true then raise exception 'invalid_make'; end if;
  if coalesce(char_length(trim(p_payload#>>'{vehicle,model}')) between 1 and 120, false) is not true then raise exception 'invalid_model'; end if;
  if char_length(coalesce(trim(p_payload#>>'{vehicle,variant}'), '')) > 120 then raise exception 'invalid_variant'; end if;
  if char_length(coalesce(trim(p_payload#>>'{vehicle,fuelType}'), '')) > 60 then raise exception 'invalid_fuel_type'; end if;
  if char_length(coalesce(trim(p_payload#>>'{vehicle,color}'), '')) > 60 then raise exception 'invalid_color'; end if;
  if char_length(coalesce(trim(p_payload#>>'{vehicle,vehicleType}'), '')) > 80 then raise exception 'invalid_vehicle_type'; end if;
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
    trim(p_payload#>>'{seller,fullName}'), v_email, trim(p_payload#>>'{seller,phone}'),
    upper(regexp_replace(p_payload#>>'{seller,postalCode}', '[[:space:]]', '', 'g')),
    nullif(p_payload#>>'{seller,desiredSaleDate}', '')::date
  ) returning id into v_seller_id;

  insert into public.vehicles (
    registration_normalized, make, model, variant, year, fuel_type, color, vehicle_type,
    rdw_source_data, rdw_fetched_at
  ) values (
    v_registration, trim(p_payload#>>'{vehicle,make}'), trim(p_payload#>>'{vehicle,model}'),
    nullif(trim(p_payload#>>'{vehicle,variant}'), ''), nullif(p_payload#>>'{vehicle,year}', '')::integer,
    nullif(trim(p_payload#>>'{vehicle,fuelType}'), ''), nullif(trim(p_payload#>>'{vehicle,color}'), ''),
    nullif(trim(p_payload#>>'{vehicle,vehicleType}'), ''),
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
    v_application_id, (p_payload#>>'{condition,mileageKm}')::integer,
    nullif(trim(p_payload#>>'{condition,damageDescription}'), ''),
    nullif(trim(p_payload#>>'{condition,technicalIssues}'), ''),
    nullif(trim(p_payload#>>'{condition,maintenanceDescription}'), ''),
    (p_payload#>>'{condition,keyCount}')::integer,
    nullif(trim(p_payload#>>'{condition,remarks}'), '')
  );

  for v_photo in
    select * from jsonb_to_recordset(p_photos) as x(
      storage_path text, media_type text, size_bytes bigint, sha256 text, sort_order smallint
    )
  loop
    if v_photo.storage_path <> ('applications/' || p_draft_id::text || '/' || v_photo.sort_order::text || '-' || v_photo.sha256 || '.jpg')
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

  update public.application_drafts set finalized_application_id = v_application_id where id = v_draft.id;

  insert into private.product_events (event_name, event_key)
  values ('application_completed', v_draft.idempotency_key)
  on conflict (event_name, event_key) do nothing;

  insert into public.request_idempotency (scope, actor_key, idempotency_key, resource_type, resource_id)
  values ('public_application', v_draft.actor_key, v_draft.idempotency_key, 'application', v_application_id)
  on conflict (scope, actor_key, idempotency_key) do nothing;

  return jsonb_build_object('application_id', v_application_id, 'reference', v_reference, 'created', true);
end;
$$;

create or replace function private.current_approved_company_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select m.company_id
  from public.company_memberships m
  join public.companies c on c.id = m.company_id
  join public.profiles p on p.id = m.user_id
  where m.user_id = auth.uid()
    and m.status = 'active'
    and c.status = 'approved'
    and not p.account_blocked
  order by m.created_at
  limit 1;
$$;

create or replace function public.admin_publish_application(
  p_application_id uuid,
  p_starts_at timestamptz,
  p_ends_at timestamptz
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_application public.applications;
  v_vehicle public.vehicles;
  v_condition public.condition_reports;
  v_revision_id uuid;
  v_listing_id uuid;
  v_round_id uuid;
  v_revision_number integer;
  v_round_status public.bid_round_status;
begin
  if not private.is_staff() or coalesce(auth.jwt()->>'aal', 'aal1') <> 'aal2' then raise exception 'staff_aal2_required'; end if;
  if p_ends_at <= p_starts_at or p_ends_at <= now() then raise exception 'invalid_bid_window'; end if;

  select * into v_application from public.applications where id = p_application_id for update;
  if not found then raise exception 'application_not_found'; end if;
  if v_application.status <> 'ready' then raise exception 'application_not_ready'; end if;
  if exists(select 1 from public.listings where application_id = p_application_id and status = 'published') then raise exception 'listing_already_published'; end if;
  if not exists(select 1 from public.vehicle_photos where application_id = p_application_id and review_status = 'approved') then raise exception 'approved_photo_required'; end if;

  select * into v_vehicle from public.vehicles where id = v_application.vehicle_id;
  select * into v_condition from public.condition_reports where application_id = p_application_id;
  select coalesce(max(revision_number), 0) + 1 into v_revision_number from public.vehicle_revisions where vehicle_id = v_vehicle.id;

  insert into public.vehicle_revisions (vehicle_id, revision_number, snapshot, created_by)
  values (
    v_vehicle.id,
    v_revision_number,
    jsonb_build_object(
      'vehicle', jsonb_build_object(
        'registration', v_vehicle.registration_normalized,
        'make', v_vehicle.make,
        'model', v_vehicle.model,
        'variant', v_vehicle.variant,
        'year', v_vehicle.year,
        'fuelType', v_vehicle.fuel_type,
        'color', v_vehicle.color,
        'vehicleType', v_vehicle.vehicle_type
      ),
      'condition', jsonb_build_object(
        'mileageKm', v_condition.mileage_km,
        'damageDescription', v_condition.damage_description,
        'technicalIssues', v_condition.technical_issues,
        'maintenanceDescription', v_condition.maintenance_description,
        'keyCount', v_condition.key_count,
        'remarks', v_condition.remarks
      )
    ),
    auth.uid()
  ) returning id into v_revision_id;

  update public.vehicle_photos
  set vehicle_revision_id = v_revision_id
  where application_id = p_application_id and review_status = 'approved';

  insert into public.listings (application_id, vehicle_revision_id, status, published_at)
  values (p_application_id, v_revision_id, 'published', now())
  returning id into v_listing_id;

  v_round_status := case when p_starts_at <= now() then 'active'::public.bid_round_status else 'scheduled'::public.bid_round_status end;
  insert into public.bid_rounds (listing_id, status, starts_at, ends_at)
  values (v_listing_id, v_round_status, p_starts_at, p_ends_at)
  returning id into v_round_id;

  insert into public.audit_log (actor_id, action, entity_type, entity_id, after_data)
  values (
    auth.uid(), 'listing.published', 'listing', v_listing_id,
    jsonb_build_object('application_id', p_application_id, 'vehicle_revision_id', v_revision_id, 'bid_round_id', v_round_id, 'starts_at', p_starts_at, 'ends_at', p_ends_at)
  );

  return jsonb_build_object('listing_id', v_listing_id, 'bid_round_id', v_round_id, 'vehicle_revision_id', v_revision_id);
end;
$$;

create or replace function public.admin_close_bid_round(p_bid_round_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_round public.bid_rounds;
begin
  if not private.is_staff() or coalesce(auth.jwt()->>'aal', 'aal1') <> 'aal2' then raise exception 'staff_aal2_required'; end if;
  select * into v_round from public.bid_rounds where id = p_bid_round_id for update;
  if not found then raise exception 'bid_round_not_found'; end if;
  if v_round.status = 'cancelled' then raise exception 'bid_round_cancelled'; end if;

  update public.bid_rounds set status = 'closed', closed_at = coalesce(closed_at, now()) where id = p_bid_round_id;
  insert into public.audit_log (actor_id, action, entity_type, entity_id, before_data, after_data)
  values (auth.uid(), 'bid_round.closed', 'bid_round', p_bid_round_id, jsonb_build_object('status', v_round.status), jsonb_build_object('status', 'closed'));
end;
$$;

create or replace function public.list_dealer_listings(
  p_query text default null,
  p_make text default null,
  p_round_status text default null
)
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
    'id', l.id,
    'vehicle', r.snapshot->'vehicle',
    'condition', jsonb_build_object('mileageKm', r.snapshot#>'{condition,mileageKm}'),
    'publishedAt', l.published_at,
    'round', jsonb_build_object(
      'id', br.id,
      'startsAt', br.starts_at,
      'endsAt', br.ends_at,
      'status', case
        when br.status in ('closed', 'cancelled') then br.status::text
        when now() >= br.ends_at then 'closed'
        when now() < br.starts_at then 'scheduled'
        else 'active'
      end
    ),
    'ownHighestBidCents', (
      select max(b.amount_cents) from public.bids b where b.bid_round_id = br.id and b.company_id = v_company_id
    ),
    'photoPath', (
      select p.storage_path from public.vehicle_photos p
      where p.vehicle_revision_id = r.id and p.review_status = 'approved'
      order by p.sort_order limit 1
    )
  ) order by br.ends_at, l.published_at desc), '[]'::jsonb) into v_result
  from public.listings l
  join public.vehicle_revisions r on r.id = l.vehicle_revision_id
  join lateral (
    select x.* from public.bid_rounds x
    where x.listing_id = l.id and x.status <> 'cancelled'
    order by x.created_at desc limit 1
  ) br on true
  where l.status = 'published'
    and (nullif(trim(p_query), '') is null or concat_ws(' ', r.snapshot#>>'{vehicle,registration}', r.snapshot#>>'{vehicle,make}', r.snapshot#>>'{vehicle,model}') ilike '%' || trim(p_query) || '%')
    and (nullif(trim(p_make), '') is null or lower(r.snapshot#>>'{vehicle,make}') = lower(trim(p_make)))
    and (nullif(trim(p_round_status), '') is null or p_round_status = case
      when br.status in ('closed', 'cancelled') then br.status::text
      when now() >= br.ends_at then 'closed'
      when now() < br.starts_at then 'scheduled'
      else 'active'
    end);

  return v_result;
end;
$$;

create or replace function public.get_dealer_listing(p_listing_id uuid)
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

  select jsonb_build_object(
    'id', l.id,
    'vehicle', r.snapshot->'vehicle',
    'condition', r.snapshot->'condition',
    'publishedAt', l.published_at,
    'photos', coalesce((
      select jsonb_agg(jsonb_build_object('id', p.id, 'storagePath', p.storage_path, 'sortOrder', p.sort_order) order by p.sort_order)
      from public.vehicle_photos p
      where p.vehicle_revision_id = r.id and p.review_status = 'approved'
    ), '[]'::jsonb),
    'round', jsonb_build_object(
      'id', br.id,
      'startsAt', br.starts_at,
      'endsAt', br.ends_at,
      'status', case
        when br.status in ('closed', 'cancelled') then br.status::text
        when now() >= br.ends_at then 'closed'
        when now() < br.starts_at then 'scheduled'
        else 'active'
      end
    ),
    'ownBids', coalesce((
      select jsonb_agg(jsonb_build_object('id', b.id, 'amountCents', b.amount_cents, 'createdAt', b.created_at) order by b.created_at desc)
      from public.bids b where b.bid_round_id = br.id and b.company_id = v_company_id
    ), '[]'::jsonb)
  ) into v_result
  from public.listings l
  join public.vehicle_revisions r on r.id = l.vehicle_revision_id
  join lateral (
    select x.* from public.bid_rounds x
    where x.listing_id = l.id and x.status <> 'cancelled'
    order by x.created_at desc limit 1
  ) br on true
  where l.id = p_listing_id and l.status = 'published';

  if v_result is null then raise exception 'listing_not_found'; end if;
  return v_result;
end;
$$;

create or replace function public.list_my_bids()
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
    'id', b.id,
    'listingId', l.id,
    'registration', r.snapshot#>>'{vehicle,registration}',
    'make', r.snapshot#>>'{vehicle,make}',
    'model', r.snapshot#>>'{vehicle,model}',
    'amountCents', b.amount_cents,
    'createdAt', b.created_at,
    'roundEndsAt', br.ends_at,
    'roundStatus', case
      when br.status in ('closed', 'cancelled') then br.status::text
      when now() >= br.ends_at then 'closed'
      when now() < br.starts_at then 'scheduled'
      else 'active'
    end
  ) order by b.created_at desc), '[]'::jsonb) into v_result
  from public.bids b
  join public.bid_rounds br on br.id = b.bid_round_id
  join public.listings l on l.id = br.listing_id
  join public.vehicle_revisions r on r.id = l.vehicle_revision_id
  where b.company_id = v_company_id;

  return v_result;
end;
$$;

create or replace function public.place_bid(
  p_bid_round_id uuid,
  p_amount_cents bigint,
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
  v_round public.bid_rounds;
  v_listing public.listings;
  v_existing public.bids;
  v_previous public.bids;
  v_bid_id uuid;
  v_now timestamptz := now();
  v_recipient text;
begin
  if v_user_id is null then raise exception 'authentication_required'; end if;
  if v_company_id is null then raise exception 'approved_company_required'; end if;
  if p_amount_cents is null or p_amount_cents <= 0 or p_amount_cents > 10000000000 then raise exception 'invalid_bid_amount'; end if;

  select * into v_round from public.bid_rounds where id = p_bid_round_id for update;
  if not found then raise exception 'bid_round_not_found'; end if;

  select * into v_existing
  from public.bids
  where placed_by = v_user_id and idempotency_key = p_idempotency_key;
  if found then
    if v_existing.bid_round_id <> p_bid_round_id or v_existing.company_id <> v_company_id or v_existing.amount_cents <> p_amount_cents then
      raise exception 'idempotency_conflict';
    end if;
    return jsonb_build_object('bid_id', v_existing.id, 'amount_cents', v_existing.amount_cents, 'created', false);
  end if;

  select * into v_listing from public.listings where id = v_round.listing_id;
  if not found or v_listing.status <> 'published' then raise exception 'listing_not_published'; end if;
  if v_round.status not in ('scheduled', 'active') then raise exception 'bid_round_not_active'; end if;
  if v_now < v_round.starts_at then raise exception 'bid_round_not_started'; end if;
  if v_now >= v_round.ends_at then raise exception 'bid_round_closed'; end if;

  select * into v_previous
  from public.bids
  where bid_round_id = p_bid_round_id and company_id = v_company_id
  order by amount_cents desc, created_at desc
  limit 1;
  if found and p_amount_cents <= v_previous.amount_cents then raise exception 'bid_must_increase'; end if;

  insert into public.bids (
    bid_round_id, company_id, placed_by, amount_cents, idempotency_key, previous_bid_id
  ) values (
    p_bid_round_id, v_company_id, v_user_id, p_amount_cents, p_idempotency_key,
    case when v_previous.id is null then null else v_previous.id end
  ) returning id into v_bid_id;

  select email into v_recipient from public.companies where id = v_company_id;
  insert into public.notification_outbox (
    event_type, entity_type, entity_id, recipient, payload, idempotency_key
  ) values (
    'bid.placed', 'bid', v_bid_id, v_recipient,
    jsonb_build_object('bid_id', v_bid_id, 'listing_id', v_listing.id, 'amount_cents', p_amount_cents, 'round_ends_at', v_round.ends_at),
    'bid.placed:' || v_bid_id::text
  );

  insert into public.audit_log (actor_id, action, entity_type, entity_id, after_data, request_id)
  values (
    v_user_id, 'bid.placed', 'bid', v_bid_id,
    jsonb_build_object('company_id', v_company_id, 'bid_round_id', p_bid_round_id, 'amount_cents', p_amount_cents),
    p_idempotency_key
  );

  return jsonb_build_object('bid_id', v_bid_id, 'amount_cents', p_amount_cents, 'created', true);
end;
$$;

create or replace function public.get_admin_market_state(p_application_id uuid)
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
    'listingId', l.id,
    'listingStatus', l.status,
    'roundId', br.id,
    'roundStatus', case
      when br.id is null then null
      when br.status in ('closed', 'cancelled') then br.status::text
      when now() >= br.ends_at then 'closed'
      when now() < br.starts_at then 'scheduled'
      else 'active'
    end,
    'startsAt', br.starts_at,
    'endsAt', br.ends_at,
    'bids', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', b.id,
        'companyId', b.company_id,
        'companyName', coalesce(c.trade_name, c.legal_name),
        'amountCents', b.amount_cents,
        'createdAt', b.created_at
      ) order by b.amount_cents desc, b.created_at)
      from public.bids b join public.companies c on c.id = b.company_id
      where b.bid_round_id = br.id
    ), '[]'::jsonb)
  ) into v_result
  from public.applications a
  left join lateral (
    select x.* from public.listings x where x.application_id = a.id order by x.created_at desc limit 1
  ) l on true
  left join lateral (
    select x.* from public.bid_rounds x where x.listing_id = l.id order by x.created_at desc limit 1
  ) br on true
  where a.id = p_application_id;

  if v_result is null then raise exception 'application_not_found'; end if;
  return v_result;
end;
$$;

create or replace function public.prevent_bid_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'bids_are_append_only';
end;
$$;

drop trigger if exists bids_append_only on public.bids;
create trigger bids_append_only
before update or delete on public.bids
for each row execute function public.prevent_bid_mutation();

create policy vehicle_photos_dealer_read on storage.objects
for select to authenticated
using (
  bucket_id = 'vehicle-photos'
  and private.has_approved_company()
  and exists (
    select 1
    from public.vehicle_photos p
    join public.listings l on l.vehicle_revision_id = p.vehicle_revision_id
    where p.storage_path = storage.objects.name
      and p.review_status = 'approved'
      and l.status = 'published'
  )
);

revoke all on function public.admin_publish_application(uuid, timestamptz, timestamptz) from public, anon;
revoke all on function public.admin_close_bid_round(uuid) from public, anon;
revoke all on function public.list_dealer_listings(text, text, text) from public, anon;
revoke all on function public.get_dealer_listing(uuid) from public, anon;
revoke all on function public.list_my_bids() from public, anon;
revoke all on function public.place_bid(uuid, bigint, uuid) from public, anon;
revoke all on function public.get_admin_market_state(uuid) from public, anon;
revoke all on function public.prevent_bid_mutation() from public, anon, authenticated;

grant execute on function public.admin_publish_application(uuid, timestamptz, timestamptz) to authenticated;
grant execute on function public.admin_close_bid_round(uuid) to authenticated;
grant execute on function public.list_dealer_listings(text, text, text) to authenticated;
grant execute on function public.get_dealer_listing(uuid) to authenticated;
grant execute on function public.list_my_bids() to authenticated;
grant execute on function public.place_bid(uuid, bigint, uuid) to authenticated;
grant execute on function public.get_admin_market_state(uuid) to authenticated;
