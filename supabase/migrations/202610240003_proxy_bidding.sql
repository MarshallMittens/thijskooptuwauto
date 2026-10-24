create table public.proxy_bid_limits (
  bid_round_id uuid not null references public.bid_rounds(id),
  company_id uuid not null references public.companies(id),
  placed_by uuid not null references public.profiles(id),
  maximum_cents bigint not null check (maximum_cents between 10000 and 10000000000),
  priority_at timestamptz not null default clock_timestamp(),
  primary key (bid_round_id, company_id)
);
alter table public.proxy_bid_limits enable row level security;
revoke all on public.proxy_bid_limits from public, anon, authenticated;

-- All callers hold the round lock. Limits never enter listing responses or notifications.
create function private.resolve_proxy_bids(p_round uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  r public.bid_rounds; h public.bids; candidate public.proxy_bid_limits;
  next_amount bigint; bid_id uuid; previous_id uuid; iteration integer := 0;
begin
  select * into r from public.bid_rounds where id = p_round for update;
  if r.status <> 'active' or r.outcome_status <> 'pending' or clock_timestamp() >= r.ends_at then return; end if;
  loop
    select * into h from public.bids where id = (select highest_bid_id from public.bid_rounds where id = p_round);
    next_amount := case when h.id is null then 10000 else h.amount_cents + case when h.amount_cents < 1000000 then 10000 else 15000 end end;
    select limits.* into candidate from public.proxy_bid_limits limits
      join public.companies c on c.id = limits.company_id
      where limits.bid_round_id = p_round and c.status = 'approved'
        and (h.id is null or limits.company_id <> h.company_id)
        and limits.maximum_cents >= next_amount
      order by limits.maximum_cents desc, limits.priority_at, limits.company_id limit 1;
    if not found then exit; end if;
    iteration := iteration + 1;
    if iteration > 2000 then raise exception 'proxy_competition_too_large'; end if;
    select id into previous_id from public.bids where bid_round_id = p_round and company_id = candidate.company_id order by amount_cents desc limit 1;
    insert into public.bids(bid_round_id, company_id, placed_by, amount_cents, idempotency_key, previous_bid_id)
      values(p_round, candidate.company_id, candidate.placed_by, next_amount, extensions.gen_random_uuid(), previous_id) returning id into bid_id;
    update public.bid_rounds set highest_bid_id = bid_id where id = p_round;
    insert into public.notification_outbox(event_type, entity_type, entity_id, recipient, payload, idempotency_key)
      select 'bid.placed', 'bid', bid_id, c.email, jsonb_build_object('listing_id', r.listing_id, 'amount_cents', next_amount), 'bid.placed:' || bid_id::text from public.companies c where c.id = candidate.company_id;
    if h.id is not null then
      insert into public.notification_outbox(event_type, entity_type, entity_id, recipient, payload, idempotency_key)
        select 'bid.outbid', 'bid', bid_id, c.email, jsonb_build_object('listing_id', r.listing_id, 'bid_round_id', p_round), 'bid.outbid:' || bid_id::text || ':' || c.id::text from public.companies c where c.id = h.company_id;
    end if;
  end loop;
end;
$$;

alter function public.place_bid(uuid, bigint, uuid) rename to place_manual_bid_internal;
revoke all on function public.place_manual_bid_internal(uuid, bigint, uuid) from public, anon, authenticated;
create function public.place_bid(p_bid_round_id uuid, p_amount_cents bigint, p_idempotency_key uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare result jsonb;
begin
  result := public.place_manual_bid_internal(p_bid_round_id, p_amount_cents, p_idempotency_key);
  perform private.resolve_proxy_bids(p_bid_round_id);
  return result || jsonb_build_object('highest_bid_cents', (select b.amount_cents from public.bid_rounds r join public.bids b on b.id = r.highest_bid_id where r.id = p_bid_round_id));
end;
$$;

create function public.set_proxy_bid(p_bid_round_id uuid, p_maximum_cents bigint) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare company uuid := private.current_approved_company_id(); r public.bid_rounds; h public.bids; old_max bigint;
begin
  if company is null or auth.jwt()->>'aal' is distinct from 'aal2' then raise exception 'approved_company_required'; end if;
  select * into r from public.bid_rounds where id = p_bid_round_id for update;
  if not found or r.status <> 'active' or r.outcome_status <> 'pending' or clock_timestamp() < r.starts_at or clock_timestamp() >= r.ends_at then raise exception 'bid_round_closed'; end if;
  perform public.get_dealer_listing(r.listing_id);
  select * into h from public.bids where id = r.highest_bid_id;
  select maximum_cents into old_max from public.proxy_bid_limits where bid_round_id = p_bid_round_id and company_id = company;
  if p_maximum_cents is null or p_maximum_cents < coalesce(old_max, 10000) or p_maximum_cents > 10000000000 then raise exception 'invalid_proxy_maximum'; end if;
  if h.id is not null and h.company_id <> company and p_maximum_cents < h.amount_cents + (case when h.amount_cents < 1000000 then 10000 else 15000 end) then raise exception 'bid_below_minimum_increment'; end if;
  insert into public.proxy_bid_limits(bid_round_id, company_id, placed_by, maximum_cents) values(p_bid_round_id, company, auth.uid(), p_maximum_cents)
    on conflict (bid_round_id, company_id) do update set maximum_cents = excluded.maximum_cents, placed_by = excluded.placed_by,
      priority_at = case when excluded.maximum_cents > public.proxy_bid_limits.maximum_cents then clock_timestamp() else public.proxy_bid_limits.priority_at end;
  perform private.resolve_proxy_bids(p_bid_round_id);
  return jsonb_build_object('maximum_cents', p_maximum_cents);
end;
$$;
revoke all on function private.resolve_proxy_bids(uuid), public.set_proxy_bid(uuid, bigint), public.place_bid(uuid, bigint, uuid) from public, anon, authenticated;
grant execute on function public.set_proxy_bid(uuid, bigint), public.place_bid(uuid, bigint, uuid) to authenticated;
