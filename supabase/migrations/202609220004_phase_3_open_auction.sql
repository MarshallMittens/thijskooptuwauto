create type public.auction_outcome_status as enum (
  'pending',
  'closed_no_bids',
  'closed_with_winner',
  'disputed'
);

alter table public.bid_rounds
  add column policy_version integer references public.auction_policy_versions(version),
  add column rules_snapshot jsonb,
  add column fee_snapshot jsonb,
  add column highest_bid_id uuid references public.bids(id),
  add column outcome_status public.auction_outcome_status not null default 'pending';

alter table public.bid_rounds
  add constraint bid_rounds_exact_24_hours
  check (ends_at = starts_at + interval '86400 seconds') not valid;

update public.bid_rounds br
set highest_bid_id = (
  select b.id
  from public.bids b
  where b.bid_round_id = br.id
  order by b.amount_cents desc, b.created_at, b.id
  limit 1
)
where br.highest_bid_id is null;

update public.bid_rounds br
set policy_version = policy.version,
    rules_snapshot = jsonb_build_object(
      'policyVersion', policy.version,
      'policyStatus', policy.status,
      'biddingDurationSeconds', policy.bidding_duration_seconds,
      'minimumIncrementCents', policy.minimum_increment_cents,
      'legacyRound', true
    ),
    fee_snapshot = jsonb_build_object(
      'configurationConfirmed', policy.fee_configuration_confirmed,
      'amountCents', policy.fee_amount_cents,
      'payer', policy.fee_payer,
      'termsVersion', policy.terms_version
    )
from lateral (
  select p.*
  from public.auction_policy_versions p
  order by (p.status = 'approved') desc, p.version desc
  limit 1
) policy
where br.policy_version is null;

create table public.winner_reservations (
  id uuid primary key default gen_random_uuid(),
  bid_round_id uuid not null unique references public.bid_rounds(id),
  bid_id uuid not null unique references public.bids(id),
  company_id uuid not null references public.companies(id),
  amount_cents bigint not null check (amount_cents > 0),
  status text not null default 'reserved' check (status in ('reserved', 'released', 'disputed')),
  reserved_at timestamptz not null default now(),
  released_at timestamptz
);

revoke all on public.winner_reservations from public, anon, authenticated;
alter table public.winner_reservations enable row level security;

create policy winner_reservations_staff_read
on public.winner_reservations
for select
to authenticated
using (private.is_staff() and auth.jwt()->>'aal' = 'aal2');

create or replace function public.admin_publish_application(p_application_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_application public.applications;
  v_vehicle public.vehicles;
  v_condition public.condition_reports;
  v_policy public.auction_policy_versions;
  v_revision_id uuid;
  v_listing_id uuid;
  v_round_id uuid;
  v_revision_number integer;
  v_starts_at timestamptz;
  v_ends_at timestamptz;
  v_rules_snapshot jsonb;
  v_fee_snapshot jsonb;
begin
  if not private.is_staff() or coalesce(auth.jwt()->>'aal', 'aal1') <> 'aal2' then
    raise exception 'staff_aal2_required';
  end if;

  select * into v_application
  from public.applications
  where id = p_application_id
  for update;

  if not found then raise exception 'application_not_found'; end if;
  if v_application.status <> 'ready' then raise exception 'application_not_ready'; end if;
  if exists (
    select 1 from public.listings
    where application_id = p_application_id and status = 'published'
  ) then raise exception 'listing_already_published'; end if;
  if not exists (
    select 1 from public.vehicle_photos
    where application_id = p_application_id and review_status = 'approved'
  ) then raise exception 'approved_photo_required'; end if;

  select * into v_policy
  from public.auction_policy_versions
  where status in ('test', 'approved')
  order by (status = 'approved') desc, version desc
  limit 1;

  if not found then raise exception 'auction_policy_missing'; end if;
  if v_policy.bidding_duration_seconds <> 86400 then raise exception 'invalid_auction_duration'; end if;

  select * into v_vehicle from public.vehicles where id = v_application.vehicle_id;
  select * into v_condition from public.condition_reports where application_id = p_application_id;
  select coalesce(max(revision_number), 0) + 1 into v_revision_number
  from public.vehicle_revisions
  where vehicle_id = v_vehicle.id;

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

  v_starts_at := clock_timestamp();
  v_ends_at := v_starts_at + interval '86400 seconds';
  v_rules_snapshot := jsonb_build_object(
    'policyVersion', v_policy.version,
    'policyStatus', v_policy.status,
    'biddingDurationSeconds', v_policy.bidding_duration_seconds,
    'minimumIncrementCents', v_policy.minimum_increment_cents,
    'openBidAmounts', true
  );
  v_fee_snapshot := jsonb_build_object(
    'configurationConfirmed', v_policy.fee_configuration_confirmed,
    'amountCents', v_policy.fee_amount_cents,
    'payer', v_policy.fee_payer,
    'termsVersion', v_policy.terms_version
  );

  insert into public.listings (application_id, vehicle_revision_id, status, published_at)
  values (p_application_id, v_revision_id, 'published', v_starts_at)
  returning id into v_listing_id;

  insert into public.bid_rounds (
    listing_id, status, starts_at, ends_at, policy_version, rules_snapshot, fee_snapshot
  ) values (
    v_listing_id, 'active', v_starts_at, v_ends_at, v_policy.version, v_rules_snapshot, v_fee_snapshot
  ) returning id into v_round_id;

  insert into public.audit_log (actor_id, action, entity_type, entity_id, after_data)
  values (
    auth.uid(), 'listing.published', 'listing', v_listing_id,
    jsonb_build_object(
      'application_id', p_application_id,
      'vehicle_revision_id', v_revision_id,
      'bid_round_id', v_round_id,
      'starts_at', v_starts_at,
      'ends_at', v_ends_at,
      'policy_version', v_policy.version,
      'policy_status', v_policy.status
    )
  );

  return jsonb_build_object(
    'listing_id', v_listing_id,
    'bid_round_id', v_round_id,
    'vehicle_revision_id', v_revision_id,
    'starts_at', v_starts_at,
    'ends_at', v_ends_at,
    'policy_status', v_policy.status
  );
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
  v_previous_own public.bids;
  v_current_highest public.bids;
  v_bid_id uuid;
  v_now timestamptz;
  v_minimum_increment bigint;
  v_minimum_allowed bigint;
  v_recipient text;
begin
  if v_user_id is null then raise exception 'authentication_required'; end if;
  if v_company_id is null then raise exception 'approved_company_required'; end if;
  if p_amount_cents is null or p_amount_cents <= 0 or p_amount_cents > 10000000000 then
    raise exception 'invalid_bid_amount';
  end if;

  select * into v_round
  from public.bid_rounds
  where id = p_bid_round_id
  for update;

  if not found then raise exception 'bid_round_not_found'; end if;
  v_now := clock_timestamp();

  select * into v_existing
  from public.bids
  where placed_by = v_user_id and idempotency_key = p_idempotency_key;

  if found then
    if v_existing.bid_round_id <> p_bid_round_id
      or v_existing.company_id <> v_company_id
      or v_existing.amount_cents <> p_amount_cents
    then raise exception 'idempotency_conflict'; end if;
    return jsonb_build_object(
      'bid_id', v_existing.id,
      'amount_cents', v_existing.amount_cents,
      'highest_bid_cents', (
        select b.amount_cents from public.bids b where b.id = v_round.highest_bid_id
      ),
      'created', false
    );
  end if;

  select * into v_listing from public.listings where id = v_round.listing_id;
  if not found or v_listing.status <> 'published' then raise exception 'listing_not_published'; end if;
  if v_round.status <> 'active' or v_round.outcome_status <> 'pending' then raise exception 'bid_round_not_active'; end if;
  if v_now < v_round.starts_at then raise exception 'bid_round_not_started'; end if;
  if v_now >= v_round.ends_at then raise exception 'bid_round_closed'; end if;

  v_minimum_increment := coalesce((v_round.rules_snapshot->>'minimumIncrementCents')::bigint, 5000);
  if v_minimum_increment <= 0 then raise exception 'invalid_minimum_increment'; end if;

  if v_round.highest_bid_id is not null then
    select * into v_current_highest from public.bids where id = v_round.highest_bid_id;
  else
    select * into v_current_highest
    from public.bids
    where bid_round_id = p_bid_round_id
    order by amount_cents desc, created_at, id
    limit 1;
  end if;

  if v_current_highest.id is not null then
    v_minimum_allowed := v_current_highest.amount_cents + v_minimum_increment;
    if p_amount_cents < v_minimum_allowed then raise exception 'bid_below_minimum_increment'; end if;
  else
    v_minimum_allowed := 1;
  end if;

  select * into v_previous_own
  from public.bids
  where bid_round_id = p_bid_round_id and company_id = v_company_id
  order by amount_cents desc, created_at desc
  limit 1;

  insert into public.bids (
    bid_round_id, company_id, placed_by, amount_cents, idempotency_key, previous_bid_id, created_at
  ) values (
    p_bid_round_id, v_company_id, v_user_id, p_amount_cents, p_idempotency_key,
    v_previous_own.id, v_now
  ) returning id into v_bid_id;

  update public.bid_rounds set highest_bid_id = v_bid_id where id = p_bid_round_id;

  select email into v_recipient from public.companies where id = v_company_id;
  insert into public.notification_outbox (
    event_type, entity_type, entity_id, recipient, payload, idempotency_key
  ) values (
    'bid.placed', 'bid', v_bid_id, v_recipient,
    jsonb_build_object(
      'bid_id', v_bid_id,
      'listing_id', v_listing.id,
      'amount_cents', p_amount_cents,
      'round_ends_at', v_round.ends_at
    ),
    'bid.placed:' || v_bid_id::text
  );

  insert into public.audit_log (actor_id, action, entity_type, entity_id, after_data, request_id)
  values (
    v_user_id, 'bid.placed', 'bid', v_bid_id,
    jsonb_build_object(
      'company_id', v_company_id,
      'bid_round_id', p_bid_round_id,
      'amount_cents', p_amount_cents,
      'previous_highest_bid_id', v_current_highest.id,
      'minimum_allowed_cents', v_minimum_allowed
    ),
    p_idempotency_key
  );

  return jsonb_build_object(
    'bid_id', v_bid_id,
    'amount_cents', p_amount_cents,
    'highest_bid_cents', p_amount_cents,
    'created', true
  );
end;
$$;

create or replace function private.close_bid_round_locked(
  p_bid_round_id uuid,
  p_actor_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_round public.bid_rounds;
  v_listing public.listings;
  v_application public.applications;
  v_seller public.seller_contacts;
  v_winner public.bids;
  v_company public.companies;
  v_reservation_id uuid;
  v_now timestamptz;
begin
  select * into v_round
  from public.bid_rounds
  where id = p_bid_round_id
  for update;

  if not found then raise exception 'bid_round_not_found'; end if;
  if v_round.status = 'cancelled' then raise exception 'bid_round_cancelled'; end if;

  if v_round.outcome_status <> 'pending' then
    select id into v_reservation_id
    from public.winner_reservations
    where bid_round_id = p_bid_round_id;
    return jsonb_build_object(
      'round_id', v_round.id,
      'outcome_status', v_round.outcome_status,
      'winner_reservation_id', v_reservation_id,
      'created', false
    );
  end if;

  v_now := clock_timestamp();
  if v_now < v_round.ends_at then raise exception 'bid_round_still_active'; end if;

  select * into v_winner
  from public.bids
  where bid_round_id = p_bid_round_id and created_at < v_round.ends_at
  order by amount_cents desc, created_at, id
  limit 1;

  if v_winner.id is null then
    update public.bid_rounds
    set status = 'closed', outcome_status = 'closed_no_bids', closed_at = v_now, highest_bid_id = null
    where id = p_bid_round_id;
  else
    update public.bid_rounds
    set status = 'closed', outcome_status = 'closed_with_winner', closed_at = v_now, highest_bid_id = v_winner.id
    where id = p_bid_round_id;

    insert into public.winner_reservations (
      bid_round_id, bid_id, company_id, amount_cents, reserved_at
    ) values (
      p_bid_round_id, v_winner.id, v_winner.company_id, v_winner.amount_cents, v_now
    )
    on conflict (bid_round_id) do nothing
    returning id into v_reservation_id;

    if v_reservation_id is null then
      select id into v_reservation_id
      from public.winner_reservations
      where bid_round_id = p_bid_round_id;
    end if;
  end if;

  select * into v_listing from public.listings where id = v_round.listing_id;
  select * into v_application from public.applications where id = v_listing.application_id;
  select * into v_seller from public.seller_contacts where id = v_application.seller_contact_id;

  if v_seller.email is not null then
    insert into public.notification_outbox (
      event_type, entity_type, entity_id, recipient, payload, idempotency_key
    ) values (
      'bid_round.closed', 'bid_round', p_bid_round_id, v_seller.email,
      jsonb_build_object(
        'application_id', v_application.id,
        'outcome_status', case when v_winner.id is null then 'closed_no_bids' else 'closed_with_winner' end,
        'highest_amount_cents', v_winner.amount_cents
      ),
      'bid_round.closed:seller:' || p_bid_round_id::text
    ) on conflict (idempotency_key) do nothing;
  end if;

  if v_winner.id is not null then
    select * into v_company from public.companies where id = v_winner.company_id;
    insert into public.notification_outbox (
      event_type, entity_type, entity_id, recipient, payload, idempotency_key
    ) values (
      'bid_round.winner_reserved', 'bid_round', p_bid_round_id, v_company.email,
      jsonb_build_object(
        'listing_id', v_listing.id,
        'reservation_id', v_reservation_id,
        'amount_cents', v_winner.amount_cents,
        'not_a_sale', true
      ),
      'bid_round.winner_reserved:' || p_bid_round_id::text
    ) on conflict (idempotency_key) do nothing;
  end if;

  insert into public.audit_log (actor_id, action, entity_type, entity_id, before_data, after_data)
  values (
    p_actor_id,
    'bid_round.closed',
    'bid_round',
    p_bid_round_id,
    jsonb_build_object('status', v_round.status, 'outcome_status', v_round.outcome_status),
    jsonb_build_object(
      'status', 'closed',
      'outcome_status', case when v_winner.id is null then 'closed_no_bids' else 'closed_with_winner' end,
      'highest_bid_id', v_winner.id,
      'winner_reservation_id', v_reservation_id,
      'not_a_sale', true
    )
  );

  return jsonb_build_object(
    'round_id', p_bid_round_id,
    'outcome_status', case when v_winner.id is null then 'closed_no_bids' else 'closed_with_winner' end,
    'winner_reservation_id', v_reservation_id,
    'created', true
  );
end;
$$;

drop function public.admin_close_bid_round(uuid);

create function public.admin_close_bid_round(p_bid_round_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_staff() or coalesce(auth.jwt()->>'aal', 'aal1') <> 'aal2' then
    raise exception 'staff_aal2_required';
  end if;
  return private.close_bid_round_locked(p_bid_round_id, auth.uid());
end;
$$;

create or replace function public.close_due_bid_rounds(p_limit integer default 50)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_round record;
  v_closed integer := 0;
  v_failed integer := 0;
begin
  if coalesce(auth.role(), '') <> 'service_role' then raise exception 'service_role_required'; end if;
  if p_limit not between 1 and 250 then raise exception 'invalid_limit'; end if;

  for v_round in
    select id
    from public.bid_rounds
    where status = 'active' and outcome_status = 'pending' and ends_at <= clock_timestamp()
    order by ends_at
    limit p_limit
  loop
    begin
      perform private.close_bid_round_locked(v_round.id, null);
      v_closed := v_closed + 1;
    exception when others then
      v_failed := v_failed + 1;
    end;
  end loop;

  return jsonb_build_object('closed', v_closed, 'failed', v_failed);
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
        when clock_timestamp() >= br.ends_at then 'closed'
        when clock_timestamp() < br.starts_at then 'scheduled'
        else 'active'
      end,
      'outcomeStatus', br.outcome_status,
      'minimumIncrementCents', coalesce((br.rules_snapshot->>'minimumIncrementCents')::bigint, 5000)
    ),
    'highestBidCents', highest.amount_cents,
    'ownHighestBidCents', (
      select max(b.amount_cents) from public.bids b
      where b.bid_round_id = br.id and b.company_id = v_company_id
    ),
    'bidCount', (select count(*) from public.bids b where b.bid_round_id = br.id),
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
  left join public.bids highest on highest.id = br.highest_bid_id
  where l.status = 'published'
    and (nullif(trim(p_query), '') is null or concat_ws(' ', r.snapshot#>>'{vehicle,registration}', r.snapshot#>>'{vehicle,make}', r.snapshot#>>'{vehicle,model}') ilike '%' || trim(p_query) || '%')
    and (nullif(trim(p_make), '') is null or lower(r.snapshot#>>'{vehicle,make}') = lower(trim(p_make)))
    and (nullif(trim(p_round_status), '') is null or p_round_status = case
      when br.status in ('closed', 'cancelled') then br.status::text
      when clock_timestamp() >= br.ends_at then 'closed'
      when clock_timestamp() < br.starts_at then 'scheduled'
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
        when clock_timestamp() >= br.ends_at then 'closed'
        when clock_timestamp() < br.starts_at then 'scheduled'
        else 'active'
      end,
      'outcomeStatus', br.outcome_status,
      'minimumIncrementCents', coalesce((br.rules_snapshot->>'minimumIncrementCents')::bigint, 5000)
    ),
    'highestBidCents', highest.amount_cents,
    'nextMinimumBidCents', case
      when highest.id is null then 1
      else highest.amount_cents + coalesce((br.rules_snapshot->>'minimumIncrementCents')::bigint, 5000)
    end,
    'bidHistory', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', b.id,
        'amountCents', b.amount_cents,
        'createdAt', b.created_at,
        'isOwnCompany', b.company_id = v_company_id,
        'isHighest', b.id = br.highest_bid_id
      ) order by b.created_at desc, b.id desc)
      from public.bids b where b.bid_round_id = br.id
    ), '[]'::jsonb)
  ) into v_result
  from public.listings l
  join public.vehicle_revisions r on r.id = l.vehicle_revision_id
  join lateral (
    select x.* from public.bid_rounds x
    where x.listing_id = l.id and x.status <> 'cancelled'
    order by x.created_at desc limit 1
  ) br on true
  left join public.bids highest on highest.id = br.highest_bid_id
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
    'highestBidCents', highest.amount_cents,
    'isHighest', b.id = br.highest_bid_id,
    'createdAt', b.created_at,
    'roundEndsAt', br.ends_at,
    'roundStatus', case
      when br.status in ('closed', 'cancelled') then br.status::text
      when clock_timestamp() >= br.ends_at then 'closed'
      when clock_timestamp() < br.starts_at then 'scheduled'
      else 'active'
    end,
    'outcomeStatus', br.outcome_status
  ) order by b.created_at desc), '[]'::jsonb) into v_result
  from public.bids b
  join public.bid_rounds br on br.id = b.bid_round_id
  join public.listings l on l.id = br.listing_id
  join public.vehicle_revisions r on r.id = l.vehicle_revision_id
  left join public.bids highest on highest.id = br.highest_bid_id
  where b.company_id = v_company_id;

  return v_result;
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
  if not private.is_staff() or coalesce(auth.jwt()->>'aal', 'aal1') <> 'aal2' then
    raise exception 'staff_aal2_required';
  end if;

  select jsonb_build_object(
    'listingId', l.id,
    'listingStatus', l.status,
    'roundId', br.id,
    'roundStatus', case
      when br.id is null then null
      when br.status in ('closed', 'cancelled') then br.status::text
      when clock_timestamp() >= br.ends_at then 'closed'
      when clock_timestamp() < br.starts_at then 'scheduled'
      else 'active'
    end,
    'outcomeStatus', br.outcome_status,
    'needsFinalization', br.id is not null
      and br.status = 'active'
      and br.outcome_status = 'pending'
      and clock_timestamp() >= br.ends_at,
    'startsAt', br.starts_at,
    'endsAt', br.ends_at,
    'highestBidId', br.highest_bid_id,
    'winnerReservationId', reservation.id,
    'policyStatus', br.rules_snapshot->>'policyStatus',
    'minimumIncrementCents', (br.rules_snapshot->>'minimumIncrementCents')::bigint,
    'feeConfigurationConfirmed', coalesce((br.fee_snapshot->>'configurationConfirmed')::boolean, false),
    'bids', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', b.id,
        'companyId', b.company_id,
        'companyName', coalesce(c.trade_name, c.legal_name),
        'amountCents', b.amount_cents,
        'createdAt', b.created_at,
        'isHighest', b.id = br.highest_bid_id
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
  left join public.winner_reservations reservation on reservation.bid_round_id = br.id
  where a.id = p_application_id;

  if v_result is null then raise exception 'application_not_found'; end if;
  return v_result;
end;
$$;

drop function if exists public.admin_publish_application(uuid, timestamptz, timestamptz);

revoke all on function public.admin_publish_application(uuid) from public, anon;
revoke all on function public.admin_close_bid_round(uuid) from public, anon;
revoke all on function public.close_due_bid_rounds(integer) from public, anon, authenticated;
revoke all on function public.list_dealer_listings(text, text, text) from public, anon;
revoke all on function public.get_dealer_listing(uuid) from public, anon;
revoke all on function public.list_my_bids() from public, anon;
revoke all on function public.place_bid(uuid, bigint, uuid) from public, anon;
revoke all on function public.get_admin_market_state(uuid) from public, anon;
revoke all on function private.close_bid_round_locked(uuid, uuid) from public, anon, authenticated;

grant execute on function public.admin_publish_application(uuid) to authenticated;
grant execute on function public.admin_close_bid_round(uuid) to authenticated;
grant execute on function public.close_due_bid_rounds(integer) to service_role;
grant execute on function public.list_dealer_listings(text, text, text) to authenticated;
grant execute on function public.get_dealer_listing(uuid) to authenticated;
grant execute on function public.list_my_bids() to authenticated;
grant execute on function public.place_bid(uuid, bigint, uuid) to authenticated;
grant execute on function public.get_admin_market_state(uuid) to authenticated;
