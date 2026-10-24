create table public.handling_fee_settings (
  id bigint generated always as identity primary key,
  seller_cents bigint not null check (seller_cents between 0 and 100000000),
  buyer_cents bigint not null check (buyer_cents between 0 and 100000000),
  vat_percent numeric(5,2) not null check (vat_percent between 0 and 100),
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);
create table public.handling_fee_invoices (
  id uuid primary key default gen_random_uuid(),
  deal_case_id uuid not null references public.deal_cases(id),
  settings_id bigint not null references public.handling_fee_settings(id),
  payer text not null check (payer in ('seller', 'buyer')),
  total_cents bigint not null,
  vat_percent numeric(5,2) not null,
  status text not null default 'draft' check (status = 'draft'),
  created_at timestamptz not null default now(),
  unique(deal_case_id, payer)
);
alter table public.deal_cases add column handling_fee_settings_id bigint references public.handling_fee_settings(id);
alter table public.handling_fee_settings enable row level security;
alter table public.handling_fee_invoices enable row level security;
revoke all on public.handling_fee_settings, public.handling_fee_invoices from public, anon, authenticated;

create function public.admin_handling_fees(p_seller_cents bigint default null, p_buyer_cents bigint default null, p_vat_percent numeric default null) returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
  if not private.is_staff() or auth.jwt()->>'aal' is distinct from 'aal2' then raise exception 'staff_aal2_required'; end if;
  if p_seller_cents is not null or p_buyer_cents is not null or p_vat_percent is not null then
    insert into public.handling_fee_settings(seller_cents, buyer_cents, vat_percent, created_by) values(p_seller_cents, p_buyer_cents, p_vat_percent, auth.uid());
  end if;
  return jsonb_build_object('settings', (select to_jsonb(s) from public.handling_fee_settings s order by id desc limit 1),
    'invoices', coalesce((select jsonb_agg(to_jsonb(i) order by i.created_at desc) from public.handling_fee_invoices i), '[]'::jsonb));
end;
$$;

create function private.capture_handling_fees() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    new.handling_fee_settings_id := (select id from public.handling_fee_settings order by id desc limit 1);
  elsif new.handling_fee_settings_id is distinct from old.handling_fee_settings_id then
    raise exception 'handling_fee_snapshot_immutable';
  end if;
  return new;
end;
$$;
create trigger deal_capture_handling_fees before insert or update on public.deal_cases for each row execute function private.capture_handling_fees();

create function private.draft_completed_sale_invoices() returns trigger language plpgsql security definer set search_path = '' as $$
declare s public.handling_fee_settings;
begin
  if new.status <> 'completed' or new.handling_fee_settings_id is null then return new; end if;
  select * into s from public.handling_fee_settings where id = new.handling_fee_settings_id;
  insert into public.handling_fee_invoices(deal_case_id, settings_id, payer, total_cents, vat_percent)
    select new.id, s.id, x.payer, x.amount, s.vat_percent from (values ('seller', s.seller_cents), ('buyer', s.buyer_cents)) x(payer, amount) where x.amount > 0
    on conflict (deal_case_id, payer) do nothing;
  return new;
end;
$$;
create trigger completed_sale_handling_invoice after insert or update of status on public.deal_cases for each row execute function private.draft_completed_sale_invoices();
revoke all on function public.admin_handling_fees(bigint,bigint,numeric), private.capture_handling_fees(), private.draft_completed_sale_invoices() from public, anon, authenticated;
grant execute on function public.admin_handling_fees(bigint,bigint,numeric) to authenticated;
