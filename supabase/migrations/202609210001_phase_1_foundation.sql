create extension if not exists pgcrypto with schema extensions;

create type public.company_status as enum ('pending', 'approved', 'blocked');
create type public.membership_role as enum ('owner', 'member');
create type public.membership_status as enum ('active', 'removed');
create type public.staff_role as enum ('admin', 'operator');
create type public.application_status as enum ('draft', 'submitted', 'in_review', 'needs_information', 'ready', 'withdrawn', 'closed');
create type public.listing_status as enum ('draft', 'published', 'withdrawn');
create type public.bid_round_status as enum ('scheduled', 'active', 'closed', 'cancelled');
create type public.deal_status as enum ('not_started', 'discussing', 'agreement_pending', 'agreed', 'completed', 'not_sold', 'withdrawn');
create type public.photo_review_status as enum ('pending', 'approved', 'rejected');
create type public.notification_status as enum ('pending', 'processing', 'sent', 'failed');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  phone text,
  account_blocked boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.staff_memberships (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  role public.staff_role not null,
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles(id)
);

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  legal_name text not null check (char_length(legal_name) between 2 and 160),
  trade_name text check (trade_name is null or char_length(trade_name) between 1 and 160),
  kvk_number text not null unique check (kvk_number ~ '^\d{8}$'),
  street text not null check (char_length(street) between 2 and 120),
  house_number text not null check (char_length(house_number) between 1 and 16),
  postal_code text not null check (postal_code ~ '^\d{4}[A-Z]{2}$'),
  city text not null check (char_length(city) between 2 and 100),
  contact_name text not null check (char_length(contact_name) between 2 and 120),
  email text not null check (
    char_length(email) between 3 and 254
    and email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
  ),
  phone text not null check (char_length(phone) between 8 and 30),
  status public.company_status not null default 'pending',
  approved_at timestamptz,
  approved_by uuid references public.profiles(id),
  blocked_at timestamptz,
  blocked_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.company_memberships (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.membership_role not null default 'member',
  status public.membership_status not null default 'active',
  created_at timestamptz not null default now(),
  unique (company_id, user_id)
);

create table public.seller_contacts (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text not null,
  postal_code text not null,
  desired_sale_date date,
  created_at timestamptz not null default now()
);

create table public.vehicles (
  id uuid primary key default gen_random_uuid(),
  registration_normalized text not null,
  make text,
  model text,
  variant text,
  year integer,
  fuel_type text,
  color text,
  rdw_source_data jsonb,
  rdw_fetched_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  public_reference text not null unique default encode(extensions.gen_random_bytes(12), 'hex'),
  draft_token_hash text unique,
  seller_contact_id uuid references public.seller_contacts(id),
  vehicle_id uuid not null references public.vehicles(id),
  status public.application_status not null default 'draft',
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.condition_reports (
  application_id uuid primary key references public.applications(id) on delete cascade,
  mileage_km integer check (mileage_km >= 0),
  damage_description text,
  technical_issues text,
  maintenance_description text,
  key_count smallint check (key_count between 0 and 10),
  remarks text,
  updated_at timestamptz not null default now()
);

create table public.vehicle_revisions (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles(id),
  revision_number integer not null check (revision_number > 0),
  snapshot jsonb not null,
  material_change_reason text,
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles(id),
  unique (vehicle_id, revision_number)
);

create table public.listings (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id),
  vehicle_revision_id uuid not null references public.vehicle_revisions(id),
  status public.listing_status not null default 'draft',
  published_at timestamptz,
  withdrawn_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.vehicle_photos (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  vehicle_revision_id uuid references public.vehicle_revisions(id),
  storage_path text not null unique,
  media_type text not null check (media_type in ('image/jpeg', 'image/png', 'image/webp')),
  size_bytes bigint not null check (size_bytes between 1 and 10485760),
  sha256 text not null,
  sort_order smallint not null default 0 check (sort_order between 0 and 11),
  review_status public.photo_review_status not null default 'pending',
  metadata_removed_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.bid_rounds (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id),
  status public.bid_round_status not null default 'scheduled',
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create table public.bids (
  id uuid primary key default gen_random_uuid(),
  bid_round_id uuid not null references public.bid_rounds(id),
  company_id uuid not null references public.companies(id),
  placed_by uuid not null references public.profiles(id),
  amount_cents bigint not null check (amount_cents > 0),
  idempotency_key uuid not null,
  previous_bid_id uuid references public.bids(id),
  created_at timestamptz not null default now(),
  unique (placed_by, idempotency_key)
);

create table public.deal_cases (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null unique references public.applications(id),
  selected_bid_id uuid references public.bids(id),
  status public.deal_status not null default 'not_started',
  agreed_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.contact_events (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  actor_id uuid not null references public.profiles(id),
  channel text not null check (channel in ('phone', 'email', 'in_person', 'other')),
  summary text not null,
  occurred_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table public.internal_notes (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  author_id uuid not null references public.profiles(id),
  body text not null,
  created_at timestamptz not null default now()
);

create table public.audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles(id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  before_data jsonb,
  after_data jsonb,
  request_id uuid,
  created_at timestamptz not null default now()
);

create table public.notification_outbox (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  entity_type text not null,
  entity_id uuid not null,
  recipient text not null,
  payload jsonb not null,
  status public.notification_status not null default 'pending',
  attempt_count integer not null default 0,
  last_error text,
  next_attempt_at timestamptz not null default now(),
  sent_at timestamptz,
  idempotency_key text not null unique,
  created_at timestamptz not null default now()
);

create table public.request_idempotency (
  scope text not null,
  actor_key text not null,
  idempotency_key uuid not null,
  resource_type text,
  resource_id uuid,
  created_at timestamptz not null default now(),
  primary key (scope, actor_key, idempotency_key)
);

create index company_memberships_user_active_idx on public.company_memberships (user_id, status);
create index company_memberships_company_idx on public.company_memberships (company_id);
create index listings_revision_status_idx on public.listings (vehicle_revision_id, status);
create index bids_company_round_created_idx on public.bids (company_id, bid_round_id, created_at desc);
create index bid_rounds_listing_status_idx on public.bid_rounds (listing_id, status);

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create or replace function private.is_staff(p_roles public.staff_role[] default array['admin', 'operator']::public.staff_role[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.staff_memberships s
    join public.profiles p on p.id = s.user_id
    where s.user_id = auth.uid()
      and s.role = any(p_roles)
      and not p.account_blocked
  );
$$;

create or replace function private.has_approved_company(p_company_id uuid default null)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
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

create or replace function public.register_company(
  p_legal_name text,
  p_trade_name text,
  p_kvk_number text,
  p_street text,
  p_house_number text,
  p_postal_code text,
  p_city text,
  p_contact_name text,
  p_email text,
  p_phone text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_company_id uuid;
begin
  if v_user_id is null then raise exception 'authentication_required'; end if;
  if not exists(select 1 from public.profiles where id = v_user_id and not account_blocked) then
    raise exception 'account_blocked';
  end if;
  if p_kvk_number !~ '^\d{8}$' then raise exception 'invalid_kvk_number'; end if;
  if upper(replace(p_postal_code, ' ', '')) !~ '^\d{4}[A-Z]{2}$' then raise exception 'invalid_postal_code'; end if;
  if coalesce(char_length(trim(p_legal_name)) between 2 and 160, false) is not true then raise exception 'invalid_legal_name'; end if;
  if p_trade_name is not null and char_length(trim(p_trade_name)) > 160 then raise exception 'invalid_trade_name'; end if;
  if coalesce(char_length(trim(p_street)) between 2 and 120, false) is not true then raise exception 'invalid_street'; end if;
  if coalesce(char_length(trim(p_house_number)) between 1 and 16, false) is not true then raise exception 'invalid_house_number'; end if;
  if coalesce(char_length(trim(p_city)) between 2 and 100, false) is not true then raise exception 'invalid_city'; end if;
  if coalesce(char_length(trim(p_contact_name)) between 2 and 120, false) is not true then raise exception 'invalid_contact_name'; end if;
  if coalesce(char_length(trim(p_email)) between 3 and 254, false) is not true
    or lower(trim(p_email)) !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
  then raise exception 'invalid_email'; end if;
  if coalesce(char_length(trim(p_phone)) between 8 and 30, false) is not true then raise exception 'invalid_phone'; end if;
  if exists(select 1 from public.company_memberships where user_id = v_user_id and status = 'active') then
    raise exception 'membership_already_exists';
  end if;

  insert into public.companies (
    legal_name, trade_name, kvk_number, street, house_number, postal_code,
    city, contact_name, email, phone
  ) values (
    trim(p_legal_name), nullif(trim(p_trade_name), ''), p_kvk_number,
    trim(p_street), trim(p_house_number), upper(replace(p_postal_code, ' ', '')),
    trim(p_city), trim(p_contact_name), lower(trim(p_email)), trim(p_phone)
  ) returning id into v_company_id;

  insert into public.company_memberships (company_id, user_id, role)
  values (v_company_id, v_user_id, 'owner');

  insert into public.audit_log (actor_id, action, entity_type, entity_id, after_data)
  values (v_user_id, 'company.registered', 'company', v_company_id, jsonb_build_object('status', 'pending'));

  return v_company_id;
end;
$$;

create or replace function public.set_company_status(p_company_id uuid, p_status public.company_status)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_before public.company_status;
begin
  if not private.is_staff(array['admin']::public.staff_role[]) then raise exception 'admin_required'; end if;
  if coalesce(auth.jwt()->>'aal', 'aal1') <> 'aal2' then raise exception 'mfa_required'; end if;
  if p_status not in ('approved', 'blocked') then raise exception 'invalid_status_transition'; end if;

  select status into v_before from public.companies where id = p_company_id for update;
  if v_before is null then raise exception 'company_not_found'; end if;

  update public.companies set
    status = p_status,
    approved_at = case when p_status = 'approved' then now() else approved_at end,
    approved_by = case when p_status = 'approved' then auth.uid() else approved_by end,
    blocked_at = case when p_status = 'blocked' then now() else null end,
    blocked_by = case when p_status = 'blocked' then auth.uid() else null end,
    updated_at = now()
  where id = p_company_id;

  insert into public.audit_log (actor_id, action, entity_type, entity_id, before_data, after_data)
  values (
    auth.uid(), 'company.status_changed', 'company', p_company_id,
    jsonb_build_object('status', v_before), jsonb_build_object('status', p_status)
  );
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, nullif(trim(new.raw_user_meta_data->>'display_name'), ''));
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

grant usage on schema public to anon, authenticated;
revoke create on schema public from public;
revoke all on all tables in schema public from anon, authenticated;
revoke all on all functions in schema public from public, anon, authenticated;
alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke all on functions from public, anon, authenticated;
grant execute on function public.get_my_access_context() to authenticated;
grant execute on function public.register_company(text, text, text, text, text, text, text, text, text, text) to authenticated;
grant execute on function public.set_company_status(uuid, public.company_status) to authenticated;

grant select, update (display_name, phone) on public.profiles to authenticated;
grant select on public.staff_memberships, public.companies, public.company_memberships to authenticated;
grant select on public.applications, public.seller_contacts, public.vehicles, public.condition_reports to authenticated;
grant select on public.vehicle_revisions, public.vehicle_photos, public.listings, public.bid_rounds, public.bids to authenticated;
grant select on public.deal_cases, public.contact_events, public.internal_notes, public.audit_log, public.notification_outbox to authenticated;

alter table public.profiles enable row level security;
alter table public.staff_memberships enable row level security;
alter table public.companies enable row level security;
alter table public.company_memberships enable row level security;
alter table public.seller_contacts enable row level security;
alter table public.vehicles enable row level security;
alter table public.applications enable row level security;
alter table public.condition_reports enable row level security;
alter table public.vehicle_revisions enable row level security;
alter table public.listings enable row level security;
alter table public.vehicle_photos enable row level security;
alter table public.bid_rounds enable row level security;
alter table public.bids enable row level security;
alter table public.deal_cases enable row level security;
alter table public.contact_events enable row level security;
alter table public.internal_notes enable row level security;
alter table public.audit_log enable row level security;
alter table public.notification_outbox enable row level security;
alter table public.request_idempotency enable row level security;

create policy profiles_read_self on public.profiles for select to authenticated using (id = auth.uid() or (private.is_staff() and auth.jwt()->>'aal' = 'aal2'));
create policy profiles_update_self on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy staff_read_self on public.staff_memberships for select to authenticated using (user_id = auth.uid() or (private.is_staff(array['admin']::public.staff_role[]) and auth.jwt()->>'aal' = 'aal2'));
create policy companies_read_member_or_staff on public.companies for select to authenticated using (private.has_approved_company(id) or exists(select 1 from public.company_memberships m where m.company_id = id and m.user_id = auth.uid() and m.status = 'active') or (private.is_staff() and auth.jwt()->>'aal' = 'aal2'));
create policy memberships_read_self_or_staff on public.company_memberships for select to authenticated using (user_id = auth.uid() or (private.is_staff() and auth.jwt()->>'aal' = 'aal2'));

create policy seller_contacts_staff_only on public.seller_contacts for select to authenticated using (private.is_staff() and auth.jwt()->>'aal' = 'aal2');
create policy applications_staff_only on public.applications for select to authenticated using (private.is_staff() and auth.jwt()->>'aal' = 'aal2');
create policy vehicles_staff_only on public.vehicles for select to authenticated using (private.is_staff() and auth.jwt()->>'aal' = 'aal2');
create policy condition_reports_staff_only on public.condition_reports for select to authenticated using (private.is_staff() and auth.jwt()->>'aal' = 'aal2');

create policy revisions_dealer_or_staff on public.vehicle_revisions for select to authenticated using (
  (private.has_approved_company() and exists(select 1 from public.listings l where l.vehicle_revision_id = public.vehicle_revisions.id and l.status = 'published'))
  or (private.is_staff() and auth.jwt()->>'aal' = 'aal2')
);
create policy listings_dealer_or_staff on public.listings for select to authenticated using (
  (status = 'published' and private.has_approved_company())
  or (private.is_staff() and auth.jwt()->>'aal' = 'aal2')
);
create policy photos_dealer_or_staff on public.vehicle_photos for select to authenticated using (
  (review_status = 'approved' and private.has_approved_company() and exists(select 1 from public.listings l where l.vehicle_revision_id = public.vehicle_photos.vehicle_revision_id and l.status = 'published'))
  or (private.is_staff() and auth.jwt()->>'aal' = 'aal2')
);
create policy rounds_dealer_or_staff on public.bid_rounds for select to authenticated using (
  (private.has_approved_company() and exists(select 1 from public.listings l where l.id = listing_id and l.status = 'published'))
  or (private.is_staff() and auth.jwt()->>'aal' = 'aal2')
);
create policy bids_own_company_or_staff on public.bids for select to authenticated using (
  private.has_approved_company(company_id)
  or (private.is_staff() and auth.jwt()->>'aal' = 'aal2')
);

create policy deals_staff_only on public.deal_cases for select to authenticated using (private.is_staff() and auth.jwt()->>'aal' = 'aal2');
create policy contact_events_staff_only on public.contact_events for select to authenticated using (private.is_staff() and auth.jwt()->>'aal' = 'aal2');
create policy notes_staff_only on public.internal_notes for select to authenticated using (private.is_staff() and auth.jwt()->>'aal' = 'aal2');
create policy audit_staff_only on public.audit_log for select to authenticated using (private.is_staff() and auth.jwt()->>'aal' = 'aal2');
create policy outbox_staff_only on public.notification_outbox for select to authenticated using (private.is_staff() and auth.jwt()->>'aal' = 'aal2');

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('vehicle-photos', 'vehicle-photos', false, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy vehicle_photos_staff_read on storage.objects for select to authenticated using (
  bucket_id = 'vehicle-photos' and private.is_staff() and auth.jwt()->>'aal' = 'aal2'
);
