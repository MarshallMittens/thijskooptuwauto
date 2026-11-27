-- Finalize an expired round and restart in one transaction; retain all existing guards.
create function public.admin_reopen_auction_24h(p_application_id uuid, p_reason text, p_idempotency_key uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_application public.applications;
  v_round public.bid_rounds;
  v_listing public.listings;
begin
  if not private.has_authenticated_session() or not private.is_staff() then raise exception 'staff_required'; end if;
  select * into v_application from public.applications where id = p_application_id for update;
  if not found then raise exception 'application_not_found'; end if;
  if v_application.archived_at is not null then raise exception 'application_archived'; end if;

  -- Reuse the original idempotency scope, including a retry after a lost response.
  if exists(select 1 from public.request_idempotency where scope = 'admin_restart_bid_round'
      and actor_key = auth.uid()::text and idempotency_key = p_idempotency_key) then
    return public.admin_restart_bid_round(p_application_id, p_reason, p_idempotency_key);
  end if;

  select * into v_listing from public.listings where application_id = p_application_id order by created_at desc limit 1;
  if not found or v_listing.status <> 'published' then raise exception 'published_listing_required'; end if;
  select * into v_round from public.bid_rounds where listing_id = v_listing.id order by created_at desc, id desc limit 1 for update;
  if not found then raise exception 'bid_round_not_found'; end if;
  if v_round.status not in ('active','closed') then raise exception 'bid_round_not_finalized'; end if;
  if v_round.ends_at > clock_timestamp() then raise exception 'bid_round_still_active'; end if;
  if v_round.outcome_status = 'pending' then
    perform public.admin_close_bid_round(v_round.id);
  end if;
  return public.admin_restart_bid_round(p_application_id, p_reason, p_idempotency_key);
end;
$$;
revoke all on function public.admin_reopen_auction_24h(uuid,text,uuid) from public, anon, authenticated;
grant execute on function public.admin_reopen_auction_24h(uuid,text,uuid) to authenticated;

create or replace function public.list_admin_applications()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_result jsonb;
begin
  if not private.is_staff() or not private.has_authenticated_session() then raise exception 'staff_required'; end if;
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', a.id, 'reference', a.public_reference, 'status', a.status,
    'submittedAt', a.submitted_at, 'createdAt', a.created_at, 'sellerName', s.full_name,
    'registration', v.registration_normalized, 'make', v.make, 'model', v.model,
    'archivedAt', a.archived_at,
    'canRestartAuction', a.archived_at is null
      and coalesce((select l.status = 'published' and br.status in ('active','closed')
          and br.ends_at <= clock_timestamp() and br.outcome_status <> 'disputed'
        from public.listings l join public.bid_rounds br on br.listing_id = l.id
        where l.application_id = a.id order by l.created_at desc, br.created_at desc, br.id desc limit 1), false)
      and not exists(select 1 from public.deal_cases where application_id = a.id)
      and not exists(select 1 from public.appointments where application_id = a.id)
      and not exists(select 1 from public.sale_agreements where application_id = a.id)
      and not exists(select 1 from public.winner_reservations wr join public.bid_rounds br on br.id = wr.bid_round_id
        join public.listings l on l.id = br.listing_id where l.application_id = a.id and wr.status = 'disputed'),
    'photoPath', (select p.storage_path from public.vehicle_photos p where p.application_id = a.id order by p.sort_order, p.id limit 1),
    'photoCount', (select count(*) from public.vehicle_photos p where p.application_id = a.id)
  ) order by a.created_at desc), '[]'::jsonb) into v_result
  from public.applications a left join public.seller_contacts s on s.id = a.seller_contact_id
    join public.vehicles v on v.id = a.vehicle_id;
  return v_result;
end;
$$;
