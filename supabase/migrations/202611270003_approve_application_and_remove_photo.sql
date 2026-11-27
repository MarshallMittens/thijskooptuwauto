alter table public.applications
  add column approved_at timestamptz,
  add column approved_by uuid references auth.users(id);
alter table public.vehicle_photos
  add column removed_at timestamptz,
  add column removed_by uuid references auth.users(id),
  add constraint photo_removal_state check (
    (removed_at is null and removed_by is null)
    or (removed_at is not null and removed_by is not null and review_status = 'rejected')
  );

-- Admin acceptance authorizes publication; it does not verify an email or grant seller access.
create or replace function private.require_verified_seller_before_publication()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.status = 'published'
    and not exists(select 1 from public.seller_application_access where application_id = new.application_id)
    and not exists(select 1 from public.applications where id = new.application_id and approved_at is not null and approved_by is not null)
  then raise exception 'seller_verification_required'; end if;
  return new;
end;
$$;

create function public.admin_approve_and_publish_application(p_application_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_app public.applications; v_photo record; v_existing uuid; v_result jsonb;
begin
  if not private.has_authenticated_session() or not private.is_staff() then raise exception 'staff_required'; end if;
  select * into v_app from public.applications where id = p_application_id for update;
  if not found then raise exception 'application_not_found'; end if;
  if v_app.archived_at is not null then raise exception 'application_archived'; end if;
  select id into v_existing from public.listings where application_id = p_application_id and status = 'published' limit 1;
  if found then return jsonb_build_object('listing_id',v_existing,'created',false); end if;
  if v_app.status not in ('submitted','in_review','needs_information','ready') then raise exception 'application_not_reviewable'; end if;
  if not exists(select 1 from public.condition_reports where application_id = p_application_id and mileage_km is not null)
    or not exists(select 1 from public.vehicles where id = v_app.vehicle_id and nullif(btrim(make),'') is not null and nullif(btrim(model),'') is not null)
    or not exists(select 1 from public.seller_contacts where id = v_app.seller_contact_id
      and nullif(btrim(full_name),'') is not null and nullif(btrim(email),'') is not null
      and nullif(btrim(phone),'') is not null and nullif(btrim(postal_code),'') is not null)
  then raise exception 'application_incomplete'; end if;
  perform id from public.vehicle_photos where application_id = p_application_id order by id for update;
  if not exists(select 1 from public.vehicle_photos where application_id = p_application_id and removed_at is null and review_status in ('pending','approved'))
  then raise exception 'approved_photo_required'; end if;
  for v_photo in select id from public.vehicle_photos where application_id = p_application_id and removed_at is null and review_status = 'pending' order by id loop
    perform public.admin_set_photo_review(v_photo.id,'approved');
  end loop;
  if v_app.status in ('submitted','needs_information') then perform public.admin_update_application_status(p_application_id,'in_review'); end if;
  if v_app.status <> 'ready' then perform public.admin_update_application_status(p_application_id,'ready'); end if;
  update public.applications set approved_at = clock_timestamp(), approved_by = auth.uid() where id = p_application_id;
  v_result := public.admin_publish_application(p_application_id);
  insert into public.audit_log(actor_id,action,entity_type,entity_id,after_data)
    values(auth.uid(),'application.approved_and_published','application',p_application_id,
      jsonb_build_object('listing_id',v_result->>'listing_id','approval_by_staff',true,'photos_reviewed_together',true));
  return v_result || jsonb_build_object('created',true);
end;
$$;
revoke all on function public.admin_approve_and_publish_application(uuid) from public, anon, authenticated;
grant execute on function public.admin_approve_and_publish_application(uuid) to authenticated;

create function public.admin_remove_application_photo(p_application_id uuid,p_photo_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare v_app public.applications; v_photo public.vehicle_photos;
begin
  if not private.has_authenticated_session() or not private.is_staff() then raise exception 'staff_required'; end if;
  select * into v_app from public.applications where id = p_application_id for update;
  if not found then raise exception 'application_not_found'; end if;
  select * into v_photo from public.vehicle_photos where id = p_photo_id and application_id = p_application_id for update;
  if not found then raise exception 'photo_not_found'; end if;
  if v_photo.removed_at is not null then return; end if;
  if v_app.archived_at is null and v_photo.review_status = 'approved'
    and exists(select 1 from public.listings where application_id = p_application_id and status = 'published')
    and not exists(select 1 from public.vehicle_photos where application_id = p_application_id and id <> p_photo_id and review_status = 'approved' and removed_at is null)
  then raise exception 'last_published_photo_required'; end if;
  update public.vehicle_photos set removed_at = clock_timestamp(), removed_by = auth.uid(), review_status = 'rejected', reviewed_at = clock_timestamp(), reviewed_by = auth.uid() where id = p_photo_id;
  insert into public.audit_log(actor_id,action,entity_type,entity_id,before_data,after_data)
    values(auth.uid(),'photo.removed','vehicle_photo',p_photo_id,
      jsonb_build_object('review_status',v_photo.review_status,'vehicle_revision_id',v_photo.vehicle_revision_id),
      jsonb_build_object('application_id',p_application_id,'removed',true));
end;
$$;
revoke all on function public.admin_remove_application_photo(uuid,uuid) from public, anon, authenticated;
grant execute on function public.admin_remove_application_photo(uuid,uuid) to authenticated;

-- Only presentation queries change; authorization and existing grants stay intact.
do $$
declare v_signature text; v_before text; v_after text;
begin
  foreach v_signature in array array['public.get_admin_application(uuid)','public.list_my_seller_applications()','public.list_admin_applications()'] loop
    v_before := pg_get_functiondef(v_signature::regprocedure);
    v_after := replace(v_before,'where p.application_id = a.id','where p.application_id = a.id and p.removed_at is null');
    if v_signature = 'public.get_admin_application(uuid)' then
      v_after := replace(v_after,'''status'', a.status,','''status'', a.status, ''archivedAt'', a.archived_at,');
    end if;
    if v_after = v_before then raise exception 'photo_removal_filter_not_applied: %',v_signature; end if;
    execute v_after;
  end loop;
end;
$$;
