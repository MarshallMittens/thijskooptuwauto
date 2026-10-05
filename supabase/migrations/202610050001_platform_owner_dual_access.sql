alter table public.staff_memberships
  add column can_use_dealer_portal boolean not null default false;

alter table public.staff_memberships
  add constraint staff_dealer_portal_admin_only
  check (not can_use_dealer_portal or role = 'admin');

comment on column public.staff_memberships.can_use_dealer_portal is
  'Expliciete, server-beheerde uitzondering voor een platformadmin die ook namens een goedgekeurd bedrijf het dealerportaal mag gebruiken.';

create or replace function private.staff_can_use_dealer_portal(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.staff_memberships s
    join public.profiles p on p.id = s.user_id
    where s.user_id = p_user_id
      and s.role = 'admin'
      and s.can_use_dealer_portal
      and not p.account_blocked
  );
$$;

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
  ) and not (new.role = 'admin' and new.can_use_dealer_portal) then
    raise exception 'staff_dealer_identity_conflict';
  end if;
  if exists (select 1 from public.seller_application_access s where s.user_id = new.user_id) then
    raise exception 'seller_staff_identity_conflict';
  end if;
  return new;
end;
$$;

drop trigger if exists staff_identity_separation on public.staff_memberships;
create trigger staff_identity_separation
before insert or update of user_id, role, can_use_dealer_portal on public.staff_memberships
for each row execute function private.prevent_staff_dealer_identity_overlap();

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
    select 1
    from public.staff_memberships s
    where s.user_id = new.user_id
      and not (s.role = 'admin' and s.can_use_dealer_portal)
  ) then
    raise exception 'staff_dealer_identity_conflict';
  end if;
  if exists (select 1 from public.seller_application_access s where s.user_id = new.user_id) then
    raise exception 'seller_dealer_identity_conflict';
  end if;
  return new;
end;
$$;

create or replace function private.has_approved_company(p_company_id uuid default null)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(auth.jwt()->>'aal', 'aal1') = 'aal2'
    and (
      not exists (
        select 1 from public.staff_memberships s where s.user_id = auth.uid()
      )
      or private.staff_can_use_dealer_portal(auth.uid())
    )
    and exists (
      select 1
      from public.company_memberships m
      join public.companies c on c.id = m.company_id
      join public.profiles p on p.id = m.user_id
      where m.user_id = auth.uid()
        and m.status = 'active'
        and c.status = 'approved'
        and not p.account_blocked
        and (p_company_id is null or m.company_id = p_company_id)
    );
$$;

create or replace function private.current_approved_company_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select m.company_id
  from public.company_memberships m
  join public.companies c on c.id = m.company_id
  join public.profiles p on p.id = m.user_id
  where m.user_id = auth.uid()
    and m.status = 'active'
    and c.status = 'approved'
    and not p.account_blocked
    and coalesce(auth.jwt()->>'aal', 'aal1') = 'aal2'
    and (
      not exists (
        select 1 from public.staff_memberships s where s.user_id = auth.uid()
      )
      or private.staff_can_use_dealer_portal(auth.uid())
    )
  order by m.created_at
  limit 1;
$$;

create or replace function public.get_my_access_context()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'is_staff', exists(
      select 1 from public.staff_memberships s
      join public.profiles p on p.id = s.user_id
      where s.user_id = auth.uid() and not p.account_blocked
    ),
    'staff_role', (
      select s.role::text from public.staff_memberships s
      join public.profiles p on p.id = s.user_id
      where s.user_id = auth.uid() and not p.account_blocked
    ),
    'can_use_dealer_portal', private.staff_can_use_dealer_portal(auth.uid()),
    'company_id', (
      select m.company_id from public.company_memberships m
      join public.profiles p on p.id = m.user_id
      where m.user_id = auth.uid() and m.status = 'active' and not p.account_blocked
      order by m.created_at limit 1
    ),
    'company_status', (
      select c.status::text
      from public.company_memberships m
      join public.companies c on c.id = m.company_id
      join public.profiles p on p.id = m.user_id
      where m.user_id = auth.uid() and m.status = 'active' and not p.account_blocked
      order by m.created_at limit 1
    )
  );
$$;

revoke all on function private.staff_can_use_dealer_portal(uuid) from public, anon, authenticated;
revoke all on function private.prevent_staff_dealer_identity_overlap() from public, anon, authenticated;
revoke all on function private.prevent_dealer_staff_identity_overlap() from public, anon, authenticated;

