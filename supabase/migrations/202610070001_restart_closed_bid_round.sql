create unique index if not exists bid_rounds_one_pending_per_listing_idx
on public.bid_rounds (listing_id)
where status in ('scheduled', 'active') and outcome_status = 'pending';

create or replace function public.admin_restart_bid_round(
  p_application_id uuid,
  p_reason text,
  p_idempotency_key uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_application public.applications;
  v_listing public.listings;
  v_previous_round public.bid_rounds;
  v_reservation public.winner_reservations;
  v_previous_winner public.companies;
  v_seller public.seller_contacts;
  v_existing_round_id uuid;
  v_new_round_id uuid;
  v_now timestamptz;
  v_reason text;
begin
  if not private.is_staff() or coalesce(auth.jwt()->>'aal', 'aal1') <> 'aal2' then
    raise exception 'staff_aal2_required';
  end if;

  if p_idempotency_key is null then
    raise exception 'idempotency_key_required';
  end if;

  v_reason := btrim(coalesce(p_reason, ''));
  if char_length(v_reason) < 10 or char_length(v_reason) > 500 then
    raise exception 'restart_reason_required';
  end if;

  select * into v_application
  from public.applications
  where id = p_application_id
  for update;

  if not found then raise exception 'application_not_found'; end if;

  select resource_id into v_existing_round_id
  from public.request_idempotency
  where scope = 'admin_restart_bid_round'
    and actor_key = auth.uid()::text
    and idempotency_key = p_idempotency_key;

  if v_existing_round_id is not null then
    return jsonb_build_object(
      'bid_round_id', v_existing_round_id,
      'created', false
    );
  end if;

  select * into v_listing
  from public.listings
  where application_id = p_application_id
  order by created_at desc
  limit 1;

  if not found or v_listing.status <> 'published' then
    raise exception 'published_listing_required';
  end if;

  select * into v_previous_round
  from public.bid_rounds
  where listing_id = v_listing.id
  order by created_at desc, id desc
  limit 1
  for update;

  if not found then raise exception 'bid_round_not_found'; end if;
  if v_previous_round.status <> 'closed' or v_previous_round.outcome_status = 'pending' then
    raise exception 'bid_round_not_finalized';
  end if;
  if v_previous_round.outcome_status = 'disputed' then
    raise exception 'bid_round_disputed';
  end if;

  select * into v_reservation
  from public.winner_reservations
  where bid_round_id = v_previous_round.id
  for update;

  if v_reservation.id is not null then
    if v_reservation.status = 'disputed' then
      raise exception 'winner_reservation_disputed';
    end if;
    if exists (
      select 1 from public.appointments ap
      where ap.winner_reservation_id = v_reservation.id
    ) or exists (
      select 1 from public.sale_agreements sa
      where sa.winner_reservation_id = v_reservation.id
    ) then
      raise exception 'auction_followup_started';
    end if;
  end if;

  if exists (
    select 1 from public.deal_cases dc
    where dc.application_id = p_application_id
  ) then
    raise exception 'auction_followup_started';
  end if;

  v_now := clock_timestamp();

  if v_reservation.id is not null and v_reservation.status = 'reserved' then
    update public.winner_reservations
    set status = 'released', released_at = v_now
    where id = v_reservation.id;
  end if;

  insert into public.bid_rounds (
    listing_id,
    status,
    starts_at,
    ends_at,
    policy_version,
    rules_snapshot,
    fee_snapshot,
    outcome_status,
    created_at
  ) values (
    v_listing.id,
    'active',
    v_now,
    v_now + interval '86400 seconds',
    v_previous_round.policy_version,
    v_previous_round.rules_snapshot,
    v_previous_round.fee_snapshot,
    'pending',
    v_now
  ) returning id into v_new_round_id;

  insert into public.request_idempotency (
    scope,
    actor_key,
    idempotency_key,
    resource_type,
    resource_id
  ) values (
    'admin_restart_bid_round',
    auth.uid()::text,
    p_idempotency_key,
    'bid_round',
    v_new_round_id
  );

  select * into v_seller
  from public.seller_contacts
  where id = v_application.seller_contact_id;

  if v_seller.email is not null then
    insert into public.notification_outbox (
      event_type, entity_type, entity_id, recipient, payload, idempotency_key
    ) values (
      'bid_round.restarted', 'bid_round', v_new_round_id, v_seller.email,
      jsonb_build_object(
        'application_id', p_application_id,
        'previous_bid_round_id', v_previous_round.id,
        'bid_round_id', v_new_round_id,
        'ends_at', v_now + interval '86400 seconds'
      ),
      'bid_round.restarted:seller:' || v_new_round_id::text
    ) on conflict (idempotency_key) do nothing;
  end if;

  if v_reservation.id is not null and v_reservation.status = 'reserved' then
    select * into v_previous_winner
    from public.companies
    where id = v_reservation.company_id;

    if v_previous_winner.email is not null then
      insert into public.notification_outbox (
        event_type, entity_type, entity_id, recipient, payload, idempotency_key
      ) values (
        'bid_round.reservation_released', 'winner_reservation', v_reservation.id, v_previous_winner.email,
        jsonb_build_object(
          'application_id', p_application_id,
          'previous_bid_round_id', v_previous_round.id,
          'new_bid_round_id', v_new_round_id,
          'not_a_sale', true
        ),
        'bid_round.reservation_released:' || v_reservation.id::text
      ) on conflict (idempotency_key) do nothing;
    end if;
  end if;

  insert into public.audit_log (
    actor_id, action, entity_type, entity_id, before_data, after_data, request_id
  ) values (
    auth.uid(),
    'bid_round.restarted',
    'bid_round',
    v_new_round_id,
    jsonb_build_object(
      'previous_bid_round_id', v_previous_round.id,
      'previous_outcome_status', v_previous_round.outcome_status,
      'winner_reservation_id', v_reservation.id,
      'winner_reservation_status', v_reservation.status
    ),
    jsonb_build_object(
      'application_id', p_application_id,
      'reason', v_reason,
      'status', 'active',
      'starts_at', v_now,
      'ends_at', v_now + interval '86400 seconds',
      'old_bids_preserved', true,
      'not_a_sale', true
    ),
    p_idempotency_key
  );

  return jsonb_build_object(
    'bid_round_id', v_new_round_id,
    'previous_bid_round_id', v_previous_round.id,
    'starts_at', v_now,
    'ends_at', v_now + interval '86400 seconds',
    'created', true
  );
end;
$$;

revoke all on function public.admin_restart_bid_round(uuid, text, uuid) from public, anon;
grant execute on function public.admin_restart_bid_round(uuid, text, uuid) to authenticated;

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
  left join public.winner_reservations wr on wr.bid_round_id = br.id and wr.status = 'reserved'
  left join public.companies company on company.id = wr.company_id
  left join public.appointments ap on ap.winner_reservation_id = wr.id
  left join lateral (select p.* from public.appointment_proposals p where p.appointment_id = ap.id and p.status in ('active', 'accepted') order by p.created_at desc limit 1) proposal on true
  left join public.inspections inspection on inspection.appointment_id = ap.id
  left join public.price_adjustment_proposals adjustment on adjustment.inspection_id = inspection.id
  left join public.sale_agreements agreement on agreement.winner_reservation_id = wr.id
  where a.id = p_application_id
  order by l.created_at desc, br.created_at desc limit 1;
  return coalesce(v_result, jsonb_build_object('reservation', null, 'appointment', null, 'inspection', null, 'priceAdjustment', null, 'agreement', null));
end;
$$;

revoke all on function public.get_seller_phase4_state(uuid) from public, anon;
grant execute on function public.get_seller_phase4_state(uuid) to authenticated;
