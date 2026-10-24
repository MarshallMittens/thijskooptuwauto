create table public.dealer_listing_views (
  listing_id uuid not null references public.listings(id),
  company_id uuid not null references public.companies(id),
  first_viewed_at timestamptz not null default now(),
  last_viewed_at timestamptz not null default now(),
  primary key (listing_id, company_id)
);
alter table public.dealer_listing_views enable row level security;
revoke all on public.dealer_listing_views from public, anon, authenticated;

create function public.record_dealer_listing_view(p_listing_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare v_company uuid := private.current_approved_company_id();
begin
  if v_company is null or auth.jwt()->>'aal' is distinct from 'aal2' then raise exception 'approved_company_required'; end if;
  perform public.get_dealer_listing(p_listing_id);
  if not exists (select 1 from public.listings where id = p_listing_id and status = 'published') then raise exception 'listing_unavailable'; end if;
  insert into public.dealer_listing_views(listing_id, company_id) values (p_listing_id, v_company)
  on conflict (listing_id, company_id) do update set last_viewed_at = now();
end;
$$;

create function public.get_admin_listing_views(p_application_id uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
  if not private.is_staff() or auth.jwt()->>'aal' is distinct from 'aal2' then raise exception 'staff_aal2_required'; end if;
  return coalesce((select jsonb_agg(jsonb_build_object('companyName', c.legal_name, 'firstViewedAt', v.first_viewed_at, 'lastViewedAt', v.last_viewed_at) order by v.last_viewed_at desc)
    from public.dealer_listing_views v join public.companies c on c.id = v.company_id join public.listings l on l.id = v.listing_id where l.application_id = p_application_id), '[]'::jsonb);
end;
$$;
revoke all on function public.record_dealer_listing_view(uuid), public.get_admin_listing_views(uuid) from public, anon, authenticated;
grant execute on function public.record_dealer_listing_view(uuid), public.get_admin_listing_views(uuid) to authenticated;
