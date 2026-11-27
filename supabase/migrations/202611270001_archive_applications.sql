alter table public.applications
  add column archived_at timestamptz,
  add column archived_by uuid references auth.users(id),
  add column archive_reason text;

alter type public.notification_status add value if not exists 'cancelled';

create function public.admin_archive_application(p_application_id uuid, p_reason text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_application public.applications;
  v_now timestamptz;
begin
  if not private.has_authenticated_session() or not private.is_staff()
    or not exists(select 1 from public.staff_memberships where user_id = auth.uid() and role = 'admin')
  then raise exception 'admin_required'; end if;
  if char_length(btrim(coalesce(p_reason, ''))) not between 10 and 500 then raise exception 'archive_reason_required'; end if;
  select * into v_application from public.applications where id = p_application_id for update;
  if not found then raise exception 'application_not_found'; end if;
  if v_application.archived_at is not null then return; end if;

  perform br.id from public.bid_rounds br join public.listings l on l.id = br.listing_id
    where l.application_id = p_application_id order by br.id for update of br;
  perform wr.id from public.winner_reservations wr join public.bid_rounds br on br.id = wr.bid_round_id
    join public.listings l on l.id = br.listing_id where l.application_id = p_application_id
    order by wr.id for update of wr;

  if exists(select 1 from public.deal_cases where application_id = p_application_id
      and status not in ('completed','not_sold','withdrawn'))
    or (not exists(select 1 from public.deal_cases where application_id = p_application_id
        and status in ('completed','not_sold','withdrawn'))
      and (exists(select 1 from public.appointments where application_id = p_application_id)
        or exists(select 1 from public.sale_agreements where application_id = p_application_id)))
    or exists(select 1 from public.bid_rounds br join public.listings l on l.id = br.listing_id
      where l.application_id = p_application_id and br.outcome_status = 'disputed')
    or exists(select 1 from public.winner_reservations wr join public.bid_rounds br on br.id = wr.bid_round_id
      join public.listings l on l.id = br.listing_id where l.application_id = p_application_id and wr.status = 'disputed')
  then raise exception 'archive_followup_active'; end if;

  v_now := clock_timestamp();
  update public.bid_rounds set status = 'cancelled'
    where listing_id in (select id from public.listings where application_id = p_application_id)
      and status in ('active','scheduled');
  if not exists(select 1 from public.deal_cases where application_id = p_application_id)
    and not exists(select 1 from public.appointments where application_id = p_application_id)
    and not exists(select 1 from public.sale_agreements where application_id = p_application_id) then
    update public.winner_reservations set status = 'released', released_at = v_now
      where bid_round_id in (select br.id from public.bid_rounds br join public.listings l on l.id = br.listing_id
        where l.application_id = p_application_id) and status = 'reserved';
  end if;
  update public.applications set archived_at = v_now, archived_by = auth.uid(),
    archive_reason = btrim(p_reason), updated_at = v_now where id = p_application_id;
  update public.notification_outbox set status = 'cancelled', last_error = 'application_archived'
    where event_type = 'listing.published' and status in ('pending','failed')
      and entity_id in (select id from public.listings where application_id = p_application_id);
  insert into public.audit_log(actor_id, action, entity_type, entity_id, after_data)
    values(auth.uid(), 'application.archived', 'application', p_application_id,
      jsonb_build_object('reason', btrim(p_reason), 'archivedAt', v_now));
end;
$$;
revoke all on function public.admin_archive_application(uuid,text) from public, anon, authenticated;
grant execute on function public.admin_archive_application(uuid,text) to authenticated;

-- Prevent publication or restart from bypassing archival, including direct calls.
create function private.prevent_archived_publication()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_id uuid; v_archived timestamptz;
begin
  if tg_table_name = 'listings' then
    if tg_op = 'UPDATE' and new.status <> 'published' then return new; end if;
    v_id := new.application_id;
  elsif tg_table_name = 'deal_cases' then
    v_id := new.application_id;
  else
    if new.status not in ('active','scheduled') then return new; end if;
    select application_id into v_id from public.listings where id = new.listing_id;
  end if;
  select archived_at into v_archived from public.applications where id = v_id for share;
  if v_archived is not null then raise exception 'application_archived'; end if;
  return new;
end;
$$;
revoke all on function private.prevent_archived_publication() from public, anon, authenticated;
create trigger prevent_archived_listing before insert or update of status on public.listings
  for each row execute function private.prevent_archived_publication();
create trigger prevent_archived_round before insert or update of status on public.bid_rounds
  for each row execute function private.prevent_archived_publication();
create trigger prevent_archived_followup before insert on public.deal_cases
  for each row execute function private.prevent_archived_publication();

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
    'photoPath', (select p.storage_path from public.vehicle_photos p where p.application_id = a.id order by p.sort_order, p.id limit 1),
    'photoCount', (select count(*) from public.vehicle_photos p where p.application_id = a.id)
  ) order by a.created_at desc), '[]'::jsonb) into v_result
  from public.applications a left join public.seller_contacts s on s.id = a.seller_contact_id
    join public.vehicles v on v.id = a.vehicle_id;
  return v_result;
end;
$$;

-- Preserve the existing dealer RPC, authorization and grants; add only the archive filter.
do $$
declare v_before text; v_after text;
begin
  v_before := pg_get_functiondef('public.list_dealer_listings(text,text,text)'::regprocedure);
  v_after := replace(v_before, 'where l.status = ''published''',
    'where l.status = ''published'' and not exists (select 1 from public.applications archive_app where archive_app.id = l.application_id and archive_app.archived_at is not null)');
  if v_after = v_before then raise exception 'archive_listing_filter_not_applied'; end if;
  execute v_after;
end;
$$;
