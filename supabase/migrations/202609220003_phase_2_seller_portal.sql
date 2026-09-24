alter table private.public_submission_limits
  drop constraint if exists public_submission_limits_scope_check;
alter table private.public_submission_limits
  add constraint public_submission_limits_scope_check
  check (scope in ('application_draft', 'form_start', 'rdw_lookup', 'seller_access'));

create table public.seller_application_access (
  application_id uuid not null references public.applications(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  verified_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  primary key (application_id)
);

create index seller_application_access_user_idx
  on public.seller_application_access (user_id, verified_at desc);

comment on table public.seller_application_access is
  'Koppelt een via Supabase Magic Link geverifieerde verkoper aan uitsluitend diens eigen aanvraag.';

revoke all on public.seller_application_access from public, anon, authenticated;
alter table public.seller_application_access enable row level security;

create or replace function private.prevent_seller_privileged_identity_overlap()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(new.user_id::text, 0)
  );

  if exists (select 1 from public.staff_memberships s where s.user_id = new.user_id)
    or exists (
      select 1 from public.company_memberships m
      where m.user_id = new.user_id and m.status = 'active'
    )
  then
    raise exception 'seller_privileged_identity_conflict';
  end if;
  return new;
end;
$$;

create trigger seller_identity_separation
before insert or update of user_id on public.seller_application_access
for each row execute function private.prevent_seller_privileged_identity_overlap();

create or replace function private.prevent_staff_dealer_identity_overlap()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(new.user_id::text, 0)
  );

  if exists (
    select 1 from public.company_memberships m
    where m.user_id = new.user_id and m.status = 'active'
  ) then
    raise exception 'staff_dealer_identity_conflict';
  end if;
  if exists (select 1 from public.seller_application_access s where s.user_id = new.user_id) then
    raise exception 'seller_staff_identity_conflict';
  end if;
  return new;
end;
$$;

create or replace function private.prevent_dealer_staff_identity_overlap()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status <> 'active' then return new; end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(new.user_id::text, 0)
  );

  if exists (
    select 1 from public.staff_memberships s where s.user_id = new.user_id
  ) then
    raise exception 'staff_dealer_identity_conflict';
  end if;
  if exists (select 1 from public.seller_application_access s where s.user_id = new.user_id) then
    raise exception 'seller_dealer_identity_conflict';
  end if;
  return new;
end;
$$;

create or replace function public.prepare_seller_access(
  p_reference text,
  p_email text,
  p_actor_key text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_attempts integer;
begin
  if coalesce(auth.role(), '') <> 'service_role' then raise exception 'service_role_required'; end if;
  if p_actor_key !~ '^[0-9a-f]{64}$' then raise exception 'invalid_actor_key'; end if;
  if lower(trim(coalesce(p_email, ''))) !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    or char_length(trim(coalesce(p_email, ''))) > 254
    or coalesce(p_reference, '') !~ '^[0-9a-f]{24}$'
  then
    return false;
  end if;

  insert into private.public_submission_limits (actor_key, scope, window_start, attempt_count)
  values (p_actor_key, 'seller_access', date_trunc('hour', now()), 1)
  on conflict (actor_key, scope, window_start)
  do update set attempt_count = private.public_submission_limits.attempt_count + 1
  returning attempt_count into v_attempts;

  if v_attempts > 5 then raise exception 'rate_limit_exceeded'; end if;

  return exists (
    select 1
    from public.applications a
    join public.seller_contacts s on s.id = a.seller_contact_id
    where a.public_reference = p_reference
      and lower(s.email) = lower(trim(p_email))
  );
end;
$$;

create or replace function public.claim_seller_application(p_reference text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text;
  v_application_id uuid;
  v_access_created integer := 0;
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(auth.uid()::text, 0)
  );

  if exists (select 1 from public.staff_memberships s where s.user_id = auth.uid())
    or exists (
      select 1 from public.company_memberships m
      where m.user_id = auth.uid() and m.status = 'active'
    )
  then
    raise exception 'seller_privileged_identity_conflict';
  end if;

  select lower(u.email) into v_email
  from auth.users u
  where u.id = auth.uid() and u.email_confirmed_at is not null;
  if v_email is null then raise exception 'verified_email_required'; end if;

  select a.id into v_application_id
  from public.applications a
  join public.seller_contacts s on s.id = a.seller_contact_id
  where a.public_reference = p_reference
    and lower(s.email) = v_email
  for update of a;
  if v_application_id is null then raise exception 'application_access_denied'; end if;

  insert into public.seller_application_access (application_id, user_id)
  values (v_application_id, auth.uid())
  on conflict (application_id) do nothing;
  get diagnostics v_access_created = row_count;

  if not exists (
    select 1 from public.seller_application_access access
    where access.application_id = v_application_id and access.user_id = auth.uid()
  ) then raise exception 'application_access_denied'; end if;

  if v_access_created = 1 then
    insert into public.audit_log (actor_id, action, entity_type, entity_id, after_data)
    values (
      auth.uid(), 'seller.contact_verified', 'application', v_application_id,
      jsonb_build_object('verified', true)
    );
  end if;

  return v_application_id;
end;
$$;

create or replace function public.list_my_seller_applications()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_result jsonb;
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', a.id,
    'reference', a.public_reference,
    'status', a.status,
    'submittedAt', a.submitted_at,
    'verifiedAt', access.verified_at,
    'desiredSaleDate', s.desired_sale_date,
    'vehicle', jsonb_build_object(
      'registration', v.registration_normalized,
      'make', v.make,
      'model', v.model,
      'variant', v.variant,
      'year', v.year,
      'fuelType', v.fuel_type,
      'color', v.color
    ),
    'condition', jsonb_build_object(
      'mileageKm', c.mileage_km,
      'damageDescription', c.damage_description,
      'technicalIssues', c.technical_issues,
      'maintenanceDescription', c.maintenance_description,
      'keyCount', c.key_count,
      'remarks', c.remarks
    ),
    'photos', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', p.id,
        'storagePath', p.storage_path,
        'reviewStatus', p.review_status,
        'sortOrder', p.sort_order
      ) order by p.sort_order)
      from public.vehicle_photos p where p.application_id = a.id
    ), '[]'::jsonb)
  ) order by a.created_at desc), '[]'::jsonb) into v_result
  from public.seller_application_access access
  join public.applications a on a.id = access.application_id
  join public.seller_contacts s on s.id = a.seller_contact_id
  join public.vehicles v on v.id = a.vehicle_id
  left join public.condition_reports c on c.application_id = a.id
  where access.user_id = auth.uid();

  return v_result;
end;
$$;

create or replace function public.seller_update_application(
  p_application_id uuid,
  p_mileage_km integer,
  p_damage_description text,
  p_technical_issues text,
  p_maintenance_description text,
  p_key_count integer,
  p_remarks text,
  p_desired_sale_date date
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status public.application_status;
  v_seller_contact_id uuid;
begin
  if auth.uid() is null or not exists (
    select 1 from public.seller_application_access access
    where access.application_id = p_application_id and access.user_id = auth.uid()
  ) then raise exception 'application_access_denied'; end if;

  if p_mileage_km not between 0 and 3000000
    or p_key_count not between 0 and 10
    or char_length(coalesce(p_damage_description, '')) > 2000
    or char_length(coalesce(p_technical_issues, '')) > 2000
    or char_length(coalesce(p_maintenance_description, '')) > 2000
    or char_length(coalesce(p_remarks, '')) > 2000
  then raise exception 'invalid_seller_update'; end if;

  select status, seller_contact_id into v_status, v_seller_contact_id
  from public.applications where id = p_application_id for update;
  if v_status <> 'needs_information' then raise exception 'seller_update_not_allowed'; end if;

  update public.condition_reports set
    mileage_km = p_mileage_km,
    damage_description = nullif(trim(p_damage_description), ''),
    technical_issues = nullif(trim(p_technical_issues), ''),
    maintenance_description = nullif(trim(p_maintenance_description), ''),
    key_count = p_key_count,
    remarks = nullif(trim(p_remarks), ''),
    updated_at = now()
  where application_id = p_application_id;

  update public.seller_contacts set desired_sale_date = p_desired_sale_date
  where id = v_seller_contact_id;
  update public.applications set status = 'in_review', updated_at = now()
  where id = p_application_id;

  insert into public.audit_log (actor_id, action, entity_type, entity_id, before_data, after_data)
  values (
    auth.uid(), 'seller.information_updated', 'application', p_application_id,
    jsonb_build_object('status', v_status),
    jsonb_build_object('status', 'in_review', 'fields', jsonb_build_array(
      'mileage_km', 'damage_description', 'technical_issues',
      'maintenance_description', 'key_count', 'remarks', 'desired_sale_date'
    ))
  );
end;
$$;

create or replace function private.require_verified_seller_before_publication()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'published' and not exists (
    select 1 from public.seller_application_access access
    where access.application_id = new.application_id
  ) then
    raise exception 'seller_verification_required';
  end if;
  return new;
end;
$$;

create trigger listing_requires_verified_seller
before insert or update of application_id, status on public.listings
for each row execute function private.require_verified_seller_before_publication();

create or replace function public.get_admin_seller_verification(p_application_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_result jsonb;
begin
  if not private.is_staff() or coalesce(auth.jwt()->>'aal', 'aal1') <> 'aal2'
  then raise exception 'staff_aal2_required'; end if;

  if not exists (select 1 from public.applications a where a.id = p_application_id)
  then raise exception 'application_not_found'; end if;

  select jsonb_build_object(
    'verified', exists (
      select 1 from public.seller_application_access access
      where access.application_id = p_application_id
    ),
    'verifiedAt', (
      select min(access.verified_at) from public.seller_application_access access
      where access.application_id = p_application_id
    )
  ) into v_result;
  return v_result;
end;
$$;

revoke all on function public.prepare_seller_access(text, text, text) from public, anon, authenticated;
grant execute on function public.prepare_seller_access(text, text, text) to service_role;
revoke all on function public.claim_seller_application(text) from public, anon;
grant execute on function public.claim_seller_application(text) to authenticated;
revoke all on function public.list_my_seller_applications() from public, anon;
grant execute on function public.list_my_seller_applications() to authenticated;
revoke all on function public.seller_update_application(uuid, integer, text, text, text, integer, text, date) from public, anon;
grant execute on function public.seller_update_application(uuid, integer, text, text, text, integer, text, date) to authenticated;
revoke all on function public.get_admin_seller_verification(uuid) from public, anon;
grant execute on function public.get_admin_seller_verification(uuid) to authenticated;

revoke all on function private.prevent_seller_privileged_identity_overlap() from public, anon, authenticated;
revoke all on function private.require_verified_seller_before_publication() from public, anon, authenticated;
