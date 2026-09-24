-- Phase 4: serialize inspection-photo registration and require the private object to exist.

create or replace function public.register_inspection_photo(
  p_inspection_id uuid,
  p_actor_id uuid,
  p_storage_path text,
  p_size_bytes bigint,
  p_sha256 text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_photo_id uuid;
begin
  if coalesce(auth.role(), '') <> 'service_role' then raise exception 'service_role_required'; end if;
  if p_storage_path !~ ('^inspections/' || p_inspection_id::text || '/[0-9a-f-]{36}-[0-9a-f]{64}\.jpg$')
    or p_size_bytes not between 1 and 10485760 or p_sha256 !~ '^[0-9a-f]{64}$'
  then raise exception 'invalid_inspection_photo'; end if;

  -- This lock also makes the eight-photo limit safe for simultaneous requests.
  perform 1
  from public.inspections i
  join public.company_memberships m on m.company_id = i.company_id
  join public.companies c on c.id = m.company_id
  join public.profiles p on p.id = m.user_id
  where i.id = p_inspection_id and m.user_id = p_actor_id and m.status = 'active'
    and c.status = 'approved' and not p.account_blocked
  for update of i;
  if not found then raise exception 'inspection_photo_access_denied'; end if;

  if not exists (
    select 1 from storage.objects
    where bucket_id = 'vehicle-photos' and name = p_storage_path
  ) then raise exception 'inspection_photo_object_missing'; end if;
  if (select count(*) from public.inspection_photos where inspection_id = p_inspection_id) >= 8 then
    raise exception 'inspection_photo_limit';
  end if;

  insert into public.inspection_photos (inspection_id, storage_path, size_bytes, sha256, uploaded_by)
  values (p_inspection_id, p_storage_path, p_size_bytes, p_sha256, p_actor_id)
  returning id into v_photo_id;
  insert into public.audit_log (actor_id, action, entity_type, entity_id, after_data)
  values (p_actor_id, 'inspection.photo_added', 'inspection_photo', v_photo_id, jsonb_build_object('inspection_id', p_inspection_id));
  return v_photo_id;
end;
$$;

revoke all on function public.register_inspection_photo(uuid, uuid, text, bigint, text) from public, anon, authenticated;
grant execute on function public.register_inspection_photo(uuid, uuid, text, bigint, text) to service_role;
