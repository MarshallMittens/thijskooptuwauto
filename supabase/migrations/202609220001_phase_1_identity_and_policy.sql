create type public.auction_policy_status as enum ('test', 'approved', 'retired');
create type public.platform_fee_payer as enum ('buyer', 'seller');

create table public.auction_policy_versions (
  id uuid primary key default gen_random_uuid(),
  version integer not null unique check (version > 0),
  status public.auction_policy_status not null default 'test',
  bidding_duration_seconds integer not null default 86400 check (bidding_duration_seconds = 86400),
  minimum_increment_cents bigint not null check (minimum_increment_cents > 0),
  fee_amount_cents bigint check (fee_amount_cents is null or fee_amount_cents >= 0),
  fee_payer public.platform_fee_payer,
  fee_configuration_confirmed boolean not null default false,
  terms_version text,
  created_by uuid references public.profiles(id),
  approved_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  approved_at timestamptz,
  check (
    status <> 'approved'
    or (
      fee_configuration_confirmed
      and fee_amount_cents is not null
      and fee_payer is not null
      and nullif(trim(terms_version), '') is not null
      and approved_by is not null
      and approved_at is not null
    )
  )
);

comment on table public.auction_policy_versions is
  'Versies van veiling- en kostenregels. Status test is nooit toestemming voor productiegebruik.';
comment on column public.auction_policy_versions.fee_configuration_confirmed is
  'Moet expliciet waar zijn voordat een policy als approved kan gelden; testwaarden zijn geen commercieel besluit.';

insert into public.auction_policy_versions (
  version,
  status,
  bidding_duration_seconds,
  minimum_increment_cents,
  fee_amount_cents,
  fee_payer,
  fee_configuration_confirmed,
  terms_version
) values (
  1,
  'test',
  86400,
  5000,
  null,
  null,
  false,
  null
);

create or replace function private.prevent_staff_dealer_identity_overlap()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (
    select 1
    from public.company_memberships m
    where m.user_id = new.user_id
      and m.status = 'active'
  ) then
    raise exception 'staff_dealer_identity_conflict';
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
  if new.status = 'active' and exists (
    select 1
    from public.staff_memberships s
    where s.user_id = new.user_id
  ) then
    raise exception 'staff_dealer_identity_conflict';
  end if;
  return new;
end;
$$;

create trigger staff_identity_separation
before insert or update of user_id on public.staff_memberships
for each row execute function private.prevent_staff_dealer_identity_overlap();

create trigger dealer_identity_separation
before insert or update of user_id, status on public.company_memberships
for each row execute function private.prevent_dealer_staff_identity_overlap();

create or replace function private.has_approved_company(p_company_id uuid default null)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(auth.jwt()->>'aal', 'aal1') = 'aal2'
    and not exists (
      select 1 from public.staff_memberships s where s.user_id = auth.uid()
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
    and not exists (
      select 1 from public.staff_memberships s where s.user_id = auth.uid()
    )
  order by m.created_at
  limit 1;
$$;

revoke all on public.auction_policy_versions from public, anon, authenticated;
grant select on public.auction_policy_versions to authenticated;
alter table public.auction_policy_versions enable row level security;

create policy auction_policy_versions_staff_read
on public.auction_policy_versions
for select
to authenticated
using (private.is_staff() and auth.jwt()->>'aal' = 'aal2');

revoke all on function private.prevent_staff_dealer_identity_overlap() from public, anon, authenticated;
revoke all on function private.prevent_dealer_staff_identity_overlap() from public, anon, authenticated;
