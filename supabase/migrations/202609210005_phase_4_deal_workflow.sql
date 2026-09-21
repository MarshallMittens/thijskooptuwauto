create or replace function public.admin_add_contact_event(
  p_application_id uuid,
  p_channel text,
  p_summary text,
  p_occurred_at timestamptz
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_contact_id uuid;
begin
  if not private.is_staff() or coalesce(auth.jwt()->>'aal', 'aal1') <> 'aal2' then
    raise exception 'staff_aal2_required';
  end if;
  if p_channel is null or p_channel not in ('phone', 'email', 'in_person', 'other') then raise exception 'invalid_contact_channel'; end if;
  if coalesce(char_length(trim(p_summary)) between 1 and 2000, false) is not true then raise exception 'invalid_contact_summary'; end if;
  if p_occurred_at is null or p_occurred_at > now() + interval '5 minutes' then raise exception 'invalid_contact_time'; end if;
  if not exists(select 1 from public.applications where id = p_application_id) then raise exception 'application_not_found'; end if;

  insert into public.contact_events (application_id, actor_id, channel, summary, occurred_at)
  values (p_application_id, auth.uid(), p_channel, trim(p_summary), p_occurred_at)
  returning id into v_contact_id;

  insert into public.audit_log (actor_id, action, entity_type, entity_id, after_data)
  values (
    auth.uid(), 'contact.recorded', 'contact_event', v_contact_id,
    jsonb_build_object('application_id', p_application_id, 'channel', p_channel, 'occurred_at', p_occurred_at)
  );

  return v_contact_id;
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
  v_selected_bid_id uuid;
begin
  if not private.is_staff() or coalesce(auth.jwt()->>'aal', 'aal1') <> 'aal2' then
    raise exception 'staff_aal2_required';
  end if;
  if p_status is null then raise exception 'invalid_deal_status'; end if;
  if not exists(select 1 from public.applications where id = p_application_id for update) then raise exception 'application_not_found'; end if;

  insert into public.deal_cases (application_id)
  values (p_application_id)
  on conflict (application_id) do nothing;

  select * into v_deal from public.deal_cases where application_id = p_application_id for update;
  v_selected_bid_id := coalesce(p_selected_bid_id, v_deal.selected_bid_id);

  if v_deal.status in ('completed', 'not_sold', 'withdrawn')
    and (p_status <> v_deal.status or v_selected_bid_id is distinct from v_deal.selected_bid_id)
  then
    raise exception 'deal_case_terminal';
  end if;

  if p_status <> v_deal.status and not (
    (v_deal.status = 'not_started' and p_status in ('discussing', 'not_sold', 'withdrawn'))
    or (v_deal.status = 'discussing' and p_status in ('agreement_pending', 'not_sold', 'withdrawn'))
    or (v_deal.status = 'agreement_pending' and p_status in ('discussing', 'agreed', 'not_sold', 'withdrawn'))
    or (v_deal.status = 'agreed' and p_status = 'completed')
  ) then
    raise exception 'invalid_deal_transition';
  end if;

  if v_selected_bid_id is not null and not exists (
    select 1
    from public.bids b
    join public.bid_rounds br on br.id = b.bid_round_id
    join public.listings l on l.id = br.listing_id
    where b.id = v_selected_bid_id and l.application_id = p_application_id
  ) then
    raise exception 'selected_bid_not_for_application';
  end if;

  if p_status in ('agreement_pending', 'agreed', 'completed') and v_selected_bid_id is null then
    raise exception 'selected_bid_required';
  end if;
  if v_deal.status in ('agreed', 'completed') and p_selected_bid_id is not null and p_selected_bid_id <> v_deal.selected_bid_id then
    raise exception 'selected_bid_locked';
  end if;

  if p_status = v_deal.status and v_selected_bid_id is not distinct from v_deal.selected_bid_id then
    return jsonb_build_object('deal_case_id', v_deal.id, 'status', v_deal.status, 'selected_bid_id', v_deal.selected_bid_id);
  end if;

  update public.deal_cases
  set status = p_status,
      selected_bid_id = v_selected_bid_id,
      agreed_at = case when p_status = 'agreed' and agreed_at is null then now() else agreed_at end,
      completed_at = case when p_status = 'completed' and completed_at is null then now() else completed_at end,
      updated_at = now()
  where id = v_deal.id;

  insert into public.audit_log (actor_id, action, entity_type, entity_id, before_data, after_data)
  values (
    auth.uid(), 'deal.status_changed', 'deal_case', v_deal.id,
    jsonb_build_object('status', v_deal.status, 'selected_bid_id', v_deal.selected_bid_id),
    jsonb_build_object('application_id', p_application_id, 'status', p_status, 'selected_bid_id', v_selected_bid_id)
  );

  return jsonb_build_object('deal_case_id', v_deal.id, 'status', p_status, 'selected_bid_id', v_selected_bid_id);
end;
$$;

create or replace function public.admin_record_material_change(
  p_application_id uuid,
  p_expected_revision_id uuid,
  p_mileage_km integer,
  p_damage_description text,
  p_technical_issues text,
  p_maintenance_description text,
  p_key_count integer,
  p_remarks text,
  p_reason text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_condition public.condition_reports;
  v_listing public.listings;
  v_round_id uuid;
  v_before jsonb;
  v_after jsonb;
begin
  if not private.is_staff() or coalesce(auth.jwt()->>'aal', 'aal1') <> 'aal2' then
    raise exception 'staff_aal2_required';
  end if;
  if coalesce(char_length(trim(p_reason)) between 10 and 1000, false) is not true then raise exception 'invalid_change_reason'; end if;
  if p_mileage_km is not null and (p_mileage_km < 0 or p_mileage_km > 5000000) then raise exception 'invalid_mileage'; end if;
  if p_key_count is not null and (p_key_count < 0 or p_key_count > 20) then raise exception 'invalid_key_count'; end if;
  if char_length(coalesce(p_damage_description, '')) > 4000
    or char_length(coalesce(p_technical_issues, '')) > 4000
    or char_length(coalesce(p_maintenance_description, '')) > 4000
    or char_length(coalesce(p_remarks, '')) > 4000
  then
    raise exception 'invalid_material_text';
  end if;
  if not exists(select 1 from public.applications where id = p_application_id for update) then raise exception 'application_not_found'; end if;

  select * into v_condition from public.condition_reports where application_id = p_application_id for update;
  if not found then raise exception 'condition_report_not_found'; end if;

  select * into v_listing
  from public.listings
  where application_id = p_application_id and status = 'published'
  order by created_at desc
  limit 1
  for update;

  if found and p_expected_revision_id is distinct from v_listing.vehicle_revision_id then raise exception 'stale_vehicle_revision'; end if;
  if not found and p_expected_revision_id is not null then raise exception 'stale_vehicle_revision'; end if;

  v_before := jsonb_build_object(
    'mileageKm', v_condition.mileage_km,
    'damageDescription', v_condition.damage_description,
    'technicalIssues', v_condition.technical_issues,
    'maintenanceDescription', v_condition.maintenance_description,
    'keyCount', v_condition.key_count,
    'remarks', v_condition.remarks
  );
  v_after := jsonb_build_object(
    'mileageKm', p_mileage_km,
    'damageDescription', nullif(trim(p_damage_description), ''),
    'technicalIssues', nullif(trim(p_technical_issues), ''),
    'maintenanceDescription', nullif(trim(p_maintenance_description), ''),
    'keyCount', p_key_count,
    'remarks', nullif(trim(p_remarks), '')
  );
  if v_before = v_after then raise exception 'material_change_no_changes'; end if;

  update public.condition_reports
  set mileage_km = p_mileage_km,
      damage_description = nullif(trim(p_damage_description), ''),
      technical_issues = nullif(trim(p_technical_issues), ''),
      maintenance_description = nullif(trim(p_maintenance_description), ''),
      key_count = p_key_count,
      remarks = nullif(trim(p_remarks), '')
  where application_id = p_application_id;

  if v_listing.id is not null then
    select id into v_round_id
    from public.bid_rounds
    where listing_id = v_listing.id
    order by created_at desc
    limit 1
    for update;

    update public.bid_rounds
    set status = 'cancelled', closed_at = coalesce(closed_at, now())
    where id = v_round_id and status in ('scheduled', 'active');

    update public.listings set status = 'withdrawn' where id = v_listing.id;
  end if;

  insert into public.audit_log (actor_id, action, entity_type, entity_id, before_data, after_data)
  values (
    auth.uid(), 'vehicle.material_change_recorded', 'application', p_application_id,
    v_before,
    v_after || jsonb_build_object(
      'application_id', p_application_id,
      'reason', trim(p_reason),
      'withdrawn_listing_id', v_listing.id,
      'cancelled_bid_round_id', v_round_id
    )
  );

  return jsonb_build_object(
    'listing_withdrawn', v_listing.id is not null,
    'cancelled_bid_round_id', v_round_id,
    'requires_republication', v_listing.id is not null
  );
end;
$$;

create or replace function public.get_admin_case_state(p_application_id uuid)
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
  if not exists(select 1 from public.applications where id = p_application_id) then raise exception 'application_not_found'; end if;

  select jsonb_build_object(
    'deal', coalesce((
      select jsonb_build_object(
        'id', d.id,
        'status', d.status,
        'selectedBidId', d.selected_bid_id,
        'agreedAt', d.agreed_at,
        'completedAt', d.completed_at
      ) from public.deal_cases d where d.application_id = p_application_id
    ), jsonb_build_object('id', null, 'status', 'not_started', 'selectedBidId', null, 'agreedAt', null, 'completedAt', null)),
    'contacts', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', c.id,
        'channel', c.channel,
        'summary', c.summary,
        'occurredAt', c.occurred_at,
        'createdAt', c.created_at,
        'actor', coalesce(p.display_name, 'Beheer')
      ) order by c.occurred_at desc, c.created_at desc)
      from public.contact_events c
      join public.profiles p on p.id = c.actor_id
      where c.application_id = p_application_id
    ), '[]'::jsonb),
    'revisions', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', r.id,
        'revisionNumber', r.revision_number,
        'createdAt', r.created_at
      ) order by r.revision_number desc)
      from public.vehicle_revisions r
      join public.applications a on a.vehicle_id = r.vehicle_id
      where a.id = p_application_id
    ), '[]'::jsonb),
    'currentPublishedRevisionId', (
      select l.vehicle_revision_id
      from public.listings l
      where l.application_id = p_application_id and l.status = 'published'
      order by l.created_at desc limit 1
    ),
    'history', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', al.id,
        'action', al.action,
        'createdAt', al.created_at
      ) order by al.created_at desc)
      from public.audit_log al
      where al.entity_id = p_application_id
         or al.after_data->>'application_id' = p_application_id::text
    ), '[]'::jsonb)
  ) into v_result;

  return v_result;
end;
$$;

revoke all on function public.admin_add_contact_event(uuid, text, text, timestamptz) from public, anon;
revoke all on function public.admin_update_deal_case(uuid, public.deal_status, uuid) from public, anon;
revoke all on function public.admin_record_material_change(uuid, uuid, integer, text, text, text, integer, text, text) from public, anon;
revoke all on function public.get_admin_case_state(uuid) from public, anon;

grant execute on function public.admin_add_contact_event(uuid, text, text, timestamptz) to authenticated;
grant execute on function public.admin_update_deal_case(uuid, public.deal_status, uuid) to authenticated;
grant execute on function public.admin_record_material_change(uuid, uuid, integer, text, text, text, integer, text, text) to authenticated;
grant execute on function public.get_admin_case_state(uuid) to authenticated;
