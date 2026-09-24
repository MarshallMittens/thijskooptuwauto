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
  if new.status <> 'active' then
    return new;
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(new.user_id::text, 0)
  );

  if exists (
    select 1
    from public.staff_memberships s
    where s.user_id = new.user_id
  ) then
    raise exception 'staff_dealer_identity_conflict';
  end if;
  return new;
end;
$$;

comment on function private.prevent_staff_dealer_identity_overlap() is
  'Serialiseert roltoekenning per gebruiker en voorkomt een actieve dealerrol naast staff.';
comment on function private.prevent_dealer_staff_identity_overlap() is
  'Serialiseert roltoekenning per gebruiker en voorkomt staff naast een actieve dealerrol.';
