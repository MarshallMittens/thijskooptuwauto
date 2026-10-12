alter table public.auction_policy_versions
  add column if not exists increment_threshold_cents bigint
    check (increment_threshold_cents is null or increment_threshold_cents > 0),
  add column if not exists minimum_increment_above_threshold_cents bigint
    check (minimum_increment_above_threshold_cents is null or minimum_increment_above_threshold_cents > 0);

insert into public.auction_policy_versions (
  version,
  status,
  bidding_duration_seconds,
  minimum_increment_cents,
  increment_threshold_cents,
  minimum_increment_above_threshold_cents,
  fee_amount_cents,
  fee_payer,
  fee_configuration_confirmed,
  terms_version
) values (
  2,
  'test',
  86400,
  10000,
  1000000,
  15000,
  null,
  null,
  false,
  null
) on conflict (version) do nothing;

comment on column public.auction_policy_versions.increment_threshold_cents is
  'Vanaf dit actuele hoogste bod geldt minimum_increment_above_threshold_cents.';
comment on column public.auction_policy_versions.minimum_increment_above_threshold_cents is
  'Minimumverhoging vanaf de drempel; voor testbeleid versie 2 is dit 150 euro.';

create or replace function private.enrich_bid_round_rules_snapshot()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_policy public.auction_policy_versions;
begin
  if new.policy_version is null then return new; end if;

  select * into v_policy
  from public.auction_policy_versions
  where version = new.policy_version;

  if found then
    new.rules_snapshot := coalesce(new.rules_snapshot, '{}'::jsonb) || jsonb_build_object(
      'minimumIncrementCents', v_policy.minimum_increment_cents,
      'minimumIncrementThresholdCents', v_policy.increment_threshold_cents,
      'minimumIncrementAboveThresholdCents', v_policy.minimum_increment_above_threshold_cents
    );
  end if;
  return new;
end;
$$;

drop trigger if exists bid_rounds_enrich_rules_snapshot on public.bid_rounds;
create trigger bid_rounds_enrich_rules_snapshot
before insert on public.bid_rounds
for each row execute function private.enrich_bid_round_rules_snapshot();

create or replace function private.bid_increment_from_snapshot(
  p_rules_snapshot jsonb,
  p_current_highest_cents bigint
)
returns bigint
language sql
immutable
set search_path = ''
as $$
  select case
    when p_current_highest_cents is not null
      and (p_rules_snapshot->>'minimumIncrementThresholdCents')::bigint is not null
      and p_current_highest_cents >= (p_rules_snapshot->>'minimumIncrementThresholdCents')::bigint
    then coalesce(
      (p_rules_snapshot->>'minimumIncrementAboveThresholdCents')::bigint,
      (p_rules_snapshot->>'minimumIncrementCents')::bigint,
      5000
    )
    else coalesce((p_rules_snapshot->>'minimumIncrementCents')::bigint, 5000)
  end
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
  v_previous_recipient text;
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

  if v_round.highest_bid_id is not null then
    select * into v_current_highest from public.bids where id = v_round.highest_bid_id;
  else
    select * into v_current_highest
    from public.bids
    where bid_round_id = p_bid_round_id
    order by amount_cents desc, created_at, id
    limit 1;
  end if;

  v_minimum_increment := private.bid_increment_from_snapshot(v_round.rules_snapshot, v_current_highest.amount_cents);
  if v_minimum_increment <= 0 then raise exception 'invalid_minimum_increment'; end if;

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

  if v_current_highest.id is not null and v_current_highest.company_id <> v_company_id then
    select email into v_previous_recipient
    from public.companies
    where id = v_current_highest.company_id;

    if v_previous_recipient is not null then
      insert into public.notification_outbox (
        event_type, entity_type, entity_id, recipient, payload, idempotency_key
      ) values (
        'bid.outbid', 'bid', v_bid_id, v_previous_recipient,
        jsonb_build_object(
          'listing_id', v_listing.id,
          'bid_round_id', p_bid_round_id,
          'previous_bid_id', v_current_highest.id,
          'new_highest_amount_cents', p_amount_cents,
          'round_ends_at', v_round.ends_at
        ),
        'bid.outbid:' || v_bid_id::text || ':' || v_current_highest.company_id::text
      ) on conflict (idempotency_key) do nothing;
    end if;
  end if;

  insert into public.audit_log (actor_id, action, entity_type, entity_id, after_data, request_id)
  values (
    v_user_id, 'bid.placed', 'bid', v_bid_id,
    jsonb_build_object(
      'company_id', v_company_id,
      'bid_round_id', p_bid_round_id,
      'amount_cents', p_amount_cents,
      'previous_highest_bid_id', v_current_highest.id,
      'minimum_allowed_cents', v_minimum_allowed,
      'minimum_increment_cents', v_minimum_increment
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
      'minimumIncrementCents', private.bid_increment_from_snapshot(br.rules_snapshot, highest.amount_cents)
    ),
    'highestBidCents', highest.amount_cents,
    'nextMinimumBidCents', case
      when highest.id is null then 1
      else highest.amount_cents + private.bid_increment_from_snapshot(br.rules_snapshot, highest.amount_cents)
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
    'minimumIncrementCents', case when br.id is null then null else private.bid_increment_from_snapshot(br.rules_snapshot, highest.amount_cents) end,
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
  left join public.bids highest on highest.id = br.highest_bid_id
  left join public.winner_reservations reservation on reservation.bid_round_id = br.id
  where a.id = p_application_id;

  if v_result is null then raise exception 'application_not_found'; end if;
  return v_result;
end;
$$;

create or replace function public.list_admin_active_auctions()
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

  select coalesce(jsonb_agg(jsonb_build_object(
    'applicationId', a.id,
    'listingId', l.id,
    'roundId', br.id,
    'registration', revision.snapshot#>>'{vehicle,registration}',
    'make', revision.snapshot#>>'{vehicle,make}',
    'model', revision.snapshot#>>'{vehicle,model}',
    'startsAt', br.starts_at,
    'endsAt', br.ends_at,
    'bidCount', (select count(*) from public.bids bid where bid.bid_round_id = br.id),
    'highestBidCents', highest.amount_cents,
    'bidderCompanies', coalesce((
      select jsonb_agg(company_name order by company_name)
      from (
        select distinct coalesce(c.trade_name, c.legal_name) as company_name
        from public.bids bid
        join public.companies c on c.id = bid.company_id
        where bid.bid_round_id = br.id
      ) bidders
    ), '[]'::jsonb)
  ) order by br.ends_at, l.published_at), '[]'::jsonb)
  into v_result
  from public.listings l
  join public.applications a on a.id = l.application_id
  join public.vehicle_revisions revision on revision.id = l.vehicle_revision_id
  join lateral (
    select candidate.*
    from public.bid_rounds candidate
    where candidate.listing_id = l.id and candidate.status <> 'cancelled'
    order by candidate.created_at desc, candidate.id desc
    limit 1
  ) br on true
  left join public.bids highest on highest.id = br.highest_bid_id
  where l.status = 'published'
    and br.status = 'active'
    and br.outcome_status = 'pending'
    and clock_timestamp() < br.ends_at;

  return v_result;
end;
$$;

create or replace function private.notify_dealers_new_listing()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status <> 'published' then return new; end if;

  insert into public.notification_outbox (
    event_type, entity_type, entity_id, recipient, payload, idempotency_key
  )
  select
    'listing.published',
    'listing',
    new.id,
    c.email,
    jsonb_build_object('listing_id', new.id, 'published_at', new.published_at),
    'listing.published:' || new.id::text || ':' || c.id::text
  from public.companies c
  where c.status = 'approved'
    and nullif(btrim(c.email), '') is not null
  on conflict (idempotency_key) do nothing;

  return new;
end;
$$;

drop trigger if exists listings_notify_approved_dealers on public.listings;
create trigger listings_notify_approved_dealers
after insert on public.listings
for each row execute function private.notify_dealers_new_listing();

revoke all on function private.bid_increment_from_snapshot(jsonb, bigint) from public, anon, authenticated;
revoke all on function private.enrich_bid_round_rules_snapshot() from public, anon, authenticated;
revoke all on function private.notify_dealers_new_listing() from public, anon, authenticated;
revoke all on function public.place_bid(uuid, bigint, uuid) from public, anon;
grant execute on function public.place_bid(uuid, bigint, uuid) to authenticated;
revoke all on function public.get_dealer_listing(uuid) from public, anon;
grant execute on function public.get_dealer_listing(uuid) to authenticated;
revoke all on function public.get_admin_market_state(uuid) from public, anon;
grant execute on function public.get_admin_market_state(uuid) to authenticated;
revoke all on function public.list_admin_active_auctions() from public, anon;
grant execute on function public.list_admin_active_auctions() to authenticated;
