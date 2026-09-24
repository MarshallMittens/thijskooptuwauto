-- Phase 5: provider-neutral payment model with an explicitly disabled test simulator.
-- This migration does not connect a real provider and cannot move real money.

create table public.payment_runtime_config (
  provider text primary key,
  environment text not null check (environment in ('test', 'production')),
  enabled boolean not null default false,
  fee_configuration_status text not null check (fee_configuration_status in ('test_unconfigured', 'approved')),
  fee_amount_cents bigint check (fee_amount_cents is null or fee_amount_cents >= 0),
  fee_payer public.platform_fee_payer,
  updated_at timestamptz not null default now(),
  check (fee_configuration_status <> 'approved' or (fee_amount_cents is not null and fee_payer is not null))
);

insert into public.payment_runtime_config (provider, environment, enabled, fee_configuration_status)
values ('simulated', 'test', false, 'test_unconfigured');

create table public.seller_payment_onboarding (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null unique references public.applications(id),
  seller_user_id uuid not null references public.profiles(id),
  provider text not null default 'simulated' check (provider = 'simulated'),
  environment text not null default 'test' check (environment = 'test'),
  recipient_reference text not null unique,
  status text not null default 'pending' check (status in ('pending', 'verified', 'failed', 'blocked')),
  idempotency_key uuid not null,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (seller_user_id, idempotency_key)
);

create table public.payment_orders (
  id uuid primary key default gen_random_uuid(),
  sale_agreement_id uuid not null unique references public.sale_agreements(id),
  application_id uuid not null references public.applications(id),
  company_id uuid not null references public.companies(id),
  onboarding_id uuid not null references public.seller_payment_onboarding(id),
  provider text not null default 'simulated' check (provider = 'simulated'),
  environment text not null default 'test' check (environment = 'test'),
  status text not null default 'checkout_pending' check (status in (
    'checkout_pending', 'partially_paid', 'failed', 'expired', 'received_held',
    'release_pending', 'payout_pending', 'paid_out', 'disputed', 'refund_pending', 'refunded', 'cancelled'
  )),
  vehicle_amount_cents bigint not null check (vehicle_amount_cents > 0),
  platform_fee_cents bigint not null default 0 check (platform_fee_cents >= 0),
  fee_payer public.platform_fee_payer,
  fee_configuration_status text not null check (fee_configuration_status in ('test_unconfigured', 'approved')),
  buyer_charge_cents bigint not null check (buyer_charge_cents > 0),
  seller_payout_cents bigint not null check (seller_payout_cents > 0),
  received_cents bigint not null default 0 check (received_cents >= 0),
  refunded_cents bigint not null default 0 check (refunded_cents >= 0),
  currency text not null default 'EUR' check (currency = 'EUR'),
  recipient_reference text not null,
  provider_payment_reference text not null unique,
  created_by uuid not null references public.profiles(id),
  idempotency_key uuid not null,
  received_at timestamptz,
  released_at timestamptz,
  paid_out_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (created_by, idempotency_key),
  check (buyer_charge_cents = vehicle_amount_cents + case when fee_payer = 'buyer' then platform_fee_cents else 0 end),
  check (seller_payout_cents = vehicle_amount_cents - case when fee_payer = 'seller' then platform_fee_cents else 0 end),
  check (fee_configuration_status <> 'test_unconfigured' or (platform_fee_cents = 0 and fee_payer is null))
);

create table public.payment_events (
  id uuid primary key default gen_random_uuid(),
  payment_order_id uuid not null references public.payment_orders(id),
  provider_event_id text not null unique,
  event_type text not null,
  amount_cents bigint,
  currency text,
  recipient_reference text,
  payload_sha256 text not null check (payload_sha256 ~ '^[0-9a-f]{64}$'),
  provider_occurred_at timestamptz not null,
  processed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table public.handovers (
  id uuid primary key default gen_random_uuid(),
  payment_order_id uuid not null unique references public.payment_orders(id),
  seller_confirmed_at timestamptz,
  dealer_confirmed_at timestamptz,
  vrijwaring_verified_at timestamptz,
  vrijwaring_verified_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.payment_refunds (
  id uuid primary key default gen_random_uuid(),
  payment_order_id uuid not null references public.payment_orders(id),
  amount_cents bigint not null check (amount_cents > 0),
  reason text not null check (char_length(reason) between 10 and 1000),
  status text not null default 'pending' check (status in ('pending', 'completed', 'failed')),
  requested_by uuid not null references public.profiles(id),
  idempotency_key uuid not null,
  provider_refund_reference text not null unique,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (requested_by, idempotency_key)
);

create table public.payment_reconciliation_runs (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  environment text not null,
  status text not null check (status in ('completed', 'failed')),
  checked_count integer not null default 0,
  mismatch_count integer not null default 0,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create table public.payment_reconciliation_items (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.payment_reconciliation_runs(id) on delete cascade,
  payment_order_id uuid not null references public.payment_orders(id),
  mismatch_type text not null,
  local_value jsonb not null,
  provider_value jsonb not null,
  created_at timestamptz not null default now()
);

create table private.simulated_provider_payments (
  provider_payment_reference text primary key,
  status text not null,
  amount_cents bigint not null,
  currency text not null,
  recipient_reference text not null,
  updated_at timestamptz not null default now()
);

revoke all on public.payment_runtime_config, public.seller_payment_onboarding, public.payment_orders,
  public.payment_events, public.handovers, public.payment_refunds,
  public.payment_reconciliation_runs, public.payment_reconciliation_items from public, anon, authenticated;
revoke all on private.simulated_provider_payments from public, anon, authenticated;

grant select on public.payment_runtime_config, public.seller_payment_onboarding, public.payment_orders,
  public.payment_events, public.handovers, public.payment_refunds,
  public.payment_reconciliation_runs, public.payment_reconciliation_items to authenticated;

alter table public.payment_runtime_config enable row level security;
alter table public.seller_payment_onboarding enable row level security;
alter table public.payment_orders enable row level security;
alter table public.payment_events enable row level security;
alter table public.handovers enable row level security;
alter table public.payment_refunds enable row level security;
alter table public.payment_reconciliation_runs enable row level security;
alter table public.payment_reconciliation_items enable row level security;

create policy payment_config_staff_read on public.payment_runtime_config for select to authenticated
using (private.is_staff() and auth.jwt()->>'aal' = 'aal2');
create policy payment_onboarding_staff_read on public.seller_payment_onboarding for select to authenticated
using (private.is_staff() and auth.jwt()->>'aal' = 'aal2');
create policy payment_orders_staff_read on public.payment_orders for select to authenticated
using (private.is_staff() and auth.jwt()->>'aal' = 'aal2');
create policy payment_events_staff_read on public.payment_events for select to authenticated
using (private.is_staff() and auth.jwt()->>'aal' = 'aal2');
create policy handovers_staff_read on public.handovers for select to authenticated
using (private.is_staff() and auth.jwt()->>'aal' = 'aal2');
create policy payment_refunds_staff_read on public.payment_refunds for select to authenticated
using (private.is_staff() and auth.jwt()->>'aal' = 'aal2');
create policy payment_reconciliation_runs_staff_read on public.payment_reconciliation_runs for select to authenticated
using (private.is_staff() and auth.jwt()->>'aal' = 'aal2');
create policy payment_reconciliation_items_staff_read on public.payment_reconciliation_items for select to authenticated
using (private.is_staff() and auth.jwt()->>'aal' = 'aal2');

create or replace function private.test_payment_simulator_enabled()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.payment_runtime_config where provider = 'simulated' and environment = 'test' and enabled);
$$;

create or replace function public.set_test_payment_simulator_enabled(p_enabled boolean)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if coalesce(auth.role(), '') <> 'service_role' then raise exception 'service_role_required'; end if;
  update public.payment_runtime_config set enabled = p_enabled, updated_at = clock_timestamp()
  where provider = 'simulated' and environment = 'test';
end;
$$;

create or replace function public.seller_start_test_payment_onboarding(p_application_id uuid, p_idempotency_key uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_existing public.seller_payment_onboarding; v_id uuid; v_ref text;
begin
  if not private.test_payment_simulator_enabled() then raise exception 'test_payment_simulator_disabled'; end if;
  if not private.seller_owns_application(p_application_id) then raise exception 'application_access_denied'; end if;
  if not exists(select 1 from public.sale_agreements where application_id = p_application_id and status = 'agreed') then raise exception 'agreed_sale_required'; end if;
  select * into v_existing from public.seller_payment_onboarding where seller_user_id = auth.uid() and idempotency_key = p_idempotency_key;
  if found then return jsonb_build_object('onboarding_id', v_existing.id, 'status', v_existing.status, 'created', false); end if;
  v_ref := 'test_recipient_' || replace(p_application_id::text, '-', '');
  insert into public.seller_payment_onboarding (application_id, seller_user_id, recipient_reference, idempotency_key)
  values (p_application_id, auth.uid(), v_ref, p_idempotency_key)
  on conflict (application_id) do update set updated_at = public.seller_payment_onboarding.updated_at
  returning id into v_id;
  insert into public.audit_log(actor_id, action, entity_type, entity_id, after_data, request_id)
  values(auth.uid(), 'payment.test_onboarding_started', 'seller_payment_onboarding', v_id, jsonb_build_object('application_id', p_application_id, 'environment', 'test'), p_idempotency_key);
  return jsonb_build_object('onboarding_id', v_id, 'status', 'pending', 'created', true);
end;
$$;

create or replace function public.seller_complete_test_payment_onboarding(p_application_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_onboarding public.seller_payment_onboarding;
begin
  if not private.test_payment_simulator_enabled() then raise exception 'test_payment_simulator_disabled'; end if;
  if not private.seller_owns_application(p_application_id) then raise exception 'application_access_denied'; end if;
  select * into v_onboarding from public.seller_payment_onboarding where application_id = p_application_id and seller_user_id = auth.uid() for update;
  if not found then raise exception 'test_onboarding_not_started'; end if;
  update public.seller_payment_onboarding set status = 'verified', verified_at = coalesce(verified_at, clock_timestamp()), updated_at = clock_timestamp()
  where id = v_onboarding.id;
  insert into public.audit_log(actor_id, action, entity_type, entity_id, after_data)
  values(auth.uid(), 'payment.test_onboarding_verified', 'seller_payment_onboarding', v_onboarding.id, jsonb_build_object('application_id', p_application_id, 'environment', 'test'));
  return jsonb_build_object('onboarding_id', v_onboarding.id, 'status', 'verified');
end;
$$;

create or replace function public.dealer_create_test_payment(p_agreement_id uuid, p_idempotency_key uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := auth.uid(); v_company uuid := private.current_approved_company_id();
  v_agreement public.sale_agreements; v_onboarding public.seller_payment_onboarding;
  v_existing public.payment_orders; v_order_id uuid; v_provider_ref text; v_fee bigint := 0;
begin
  if not private.test_payment_simulator_enabled() then raise exception 'test_payment_simulator_disabled'; end if;
  if v_company is null then raise exception 'approved_company_required'; end if;
  select sa.* into v_agreement from public.sale_agreements sa
  join public.winner_reservations wr on wr.id = sa.winner_reservation_id
  where sa.id = p_agreement_id and sa.status = 'agreed' and wr.company_id = v_company for update of sa;
  if not found then raise exception 'agreed_sale_required'; end if;
  select * into v_onboarding from public.seller_payment_onboarding where application_id = v_agreement.application_id and status = 'verified';
  if not found then raise exception 'verified_recipient_required'; end if;
  select * into v_existing from public.payment_orders where created_by = v_user and idempotency_key = p_idempotency_key;
  if found then
    if v_existing.sale_agreement_id <> p_agreement_id then raise exception 'idempotency_conflict'; end if;
    return jsonb_build_object('payment_order_id', v_existing.id, 'status', v_existing.status, 'created', false);
  end if;
  if exists(select 1 from public.payment_orders where sale_agreement_id = p_agreement_id) then raise exception 'payment_already_created'; end if;
  v_provider_ref := 'test_pay_' || replace(gen_random_uuid()::text, '-', '');
  insert into public.payment_orders (
    sale_agreement_id, application_id, company_id, onboarding_id, vehicle_amount_cents,
    platform_fee_cents, fee_payer, fee_configuration_status, buyer_charge_cents,
    seller_payout_cents, recipient_reference, provider_payment_reference, created_by, idempotency_key
  ) values (
    v_agreement.id, v_agreement.application_id, v_company, v_onboarding.id, v_agreement.agreed_price_cents,
    v_fee, null, 'test_unconfigured', v_agreement.agreed_price_cents,
    v_agreement.agreed_price_cents, v_onboarding.recipient_reference, v_provider_ref, v_user, p_idempotency_key
  ) returning id into v_order_id;
  insert into public.handovers(payment_order_id) values(v_order_id);
  insert into private.simulated_provider_payments(provider_payment_reference, status, amount_cents, currency, recipient_reference)
  values(v_provider_ref, 'checkout_pending', 0, 'EUR', v_onboarding.recipient_reference);
  insert into public.audit_log(actor_id, action, entity_type, entity_id, after_data, request_id)
  values(v_user, 'payment.test_checkout_created', 'payment_order', v_order_id,
    jsonb_build_object('application_id', v_agreement.application_id, 'amount_cents', v_agreement.agreed_price_cents, 'currency', 'EUR', 'fee_configuration_status', 'test_unconfigured'), p_idempotency_key);
  return jsonb_build_object('payment_order_id', v_order_id, 'status', 'checkout_pending', 'created', true);
end;
$$;

create or replace function public.process_simulated_payment_event(
  p_provider_event_id text, p_provider_payment_reference text, p_event_type text,
  p_amount_cents bigint, p_currency text, p_recipient_reference text,
  p_provider_occurred_at timestamptz, p_payload_sha256 text
)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_order public.payment_orders; v_refund public.payment_refunds; v_new_status text;
begin
  if coalesce(auth.role(), '') <> 'service_role' then raise exception 'service_role_required'; end if;
  if not private.test_payment_simulator_enabled() then raise exception 'test_payment_simulator_disabled'; end if;
  if p_provider_event_id is null or char_length(p_provider_event_id) not between 8 and 200
    or p_payload_sha256 !~ '^[0-9a-f]{64}$' then raise exception 'invalid_provider_event'; end if;
  if exists(select 1 from public.payment_events where provider_event_id = p_provider_event_id) then
    select po.* into v_order from public.payment_orders po join public.payment_events pe on pe.payment_order_id = po.id where pe.provider_event_id = p_provider_event_id;
    return jsonb_build_object('payment_order_id', v_order.id, 'status', v_order.status, 'created', false);
  end if;
  select * into v_order from public.payment_orders where provider_payment_reference = p_provider_payment_reference for update;
  if not found then raise exception 'payment_reference_not_found'; end if;
  if p_currency is distinct from v_order.currency then raise exception 'payment_currency_mismatch'; end if;
  if p_recipient_reference is distinct from v_order.recipient_reference then raise exception 'payment_recipient_mismatch'; end if;
  if p_provider_occurred_at is null or p_provider_occurred_at > clock_timestamp() + interval '5 minutes' then raise exception 'invalid_provider_event_time'; end if;

  if p_event_type = 'payment.received' then
    if v_order.status not in ('checkout_pending', 'partially_paid') then raise exception 'invalid_payment_event_order'; end if;
    if p_amount_cents is null or p_amount_cents <= 0 or p_amount_cents > v_order.buyer_charge_cents then raise exception 'payment_amount_mismatch'; end if;
    v_new_status := case when p_amount_cents = v_order.buyer_charge_cents then 'received_held' else 'partially_paid' end;
    update public.payment_orders set status = v_new_status, received_cents = p_amount_cents,
      received_at = case when v_new_status = 'received_held' then clock_timestamp() else null end, updated_at = clock_timestamp()
    where id = v_order.id;
  elsif p_event_type in ('payment.failed', 'payment.expired') then
    if v_order.status <> 'checkout_pending' then raise exception 'invalid_payment_event_order'; end if;
    if p_amount_cents is distinct from 0 then raise exception 'payment_amount_mismatch'; end if;
    v_new_status := case p_event_type when 'payment.failed' then 'failed' else 'expired' end;
    update public.payment_orders set status = v_new_status, updated_at = clock_timestamp() where id = v_order.id;
  elsif p_event_type = 'payment.disputed' then
    if v_order.status not in ('received_held', 'release_pending', 'payout_pending', 'paid_out') then raise exception 'invalid_payment_event_order'; end if;
    if p_amount_cents is distinct from v_order.received_cents then raise exception 'payment_amount_mismatch'; end if;
    v_new_status := 'disputed';
    update public.payment_orders set status = v_new_status, updated_at = clock_timestamp() where id = v_order.id;
    insert into public.workflow_tasks(application_id, task_type, details, idempotency_key)
    values(v_order.application_id, 'payment_disputed', jsonb_build_object('payment_order_id', v_order.id, 'paid_out_at', v_order.paid_out_at), 'payment.disputed:' || v_order.id::text)
    on conflict(idempotency_key) do nothing;
  elsif p_event_type = 'payment.release_accepted' then
    if v_order.status <> 'release_pending' then raise exception 'invalid_payment_event_order'; end if;
    if p_amount_cents is distinct from v_order.seller_payout_cents then raise exception 'payment_amount_mismatch'; end if;
    v_new_status := 'payout_pending';
    update public.payment_orders set status = v_new_status, released_at = clock_timestamp(), updated_at = clock_timestamp() where id = v_order.id;
  elsif p_event_type = 'payment.paid_out' then
    if v_order.status <> 'payout_pending' then raise exception 'invalid_payment_event_order'; end if;
    if p_amount_cents is distinct from v_order.seller_payout_cents then raise exception 'payment_amount_mismatch'; end if;
    v_new_status := 'paid_out';
    update public.payment_orders set status = v_new_status, paid_out_at = clock_timestamp(), updated_at = clock_timestamp() where id = v_order.id;
  elsif p_event_type = 'payment.refunded' then
    if v_order.status <> 'refund_pending' then raise exception 'invalid_payment_event_order'; end if;
    select * into v_refund from public.payment_refunds where payment_order_id = v_order.id and status = 'pending' order by created_at desc limit 1 for update;
    if not found or p_amount_cents is distinct from v_refund.amount_cents then raise exception 'payment_amount_mismatch'; end if;
    v_new_status := 'refunded';
    update public.payment_refunds set status = 'completed', completed_at = clock_timestamp() where id = v_refund.id;
    update public.payment_orders set status = v_new_status, refunded_cents = refunded_cents + v_refund.amount_cents, updated_at = clock_timestamp() where id = v_order.id;
  else
    raise exception 'unsupported_provider_event';
  end if;

  insert into public.payment_events(payment_order_id, provider_event_id, event_type, amount_cents, currency, recipient_reference, payload_sha256, provider_occurred_at)
  values(v_order.id, p_provider_event_id, p_event_type, p_amount_cents, p_currency, p_recipient_reference, p_payload_sha256, p_provider_occurred_at);
  update private.simulated_provider_payments set status = v_new_status,
    amount_cents = case when p_event_type = 'payment.received' then p_amount_cents else amount_cents end,
    updated_at = clock_timestamp() where provider_payment_reference = p_provider_payment_reference;
  insert into public.audit_log(action, entity_type, entity_id, after_data)
  values('payment.test_provider_event_processed', 'payment_order', v_order.id,
    jsonb_build_object('event_type', p_event_type, 'status', v_new_status, 'amount_cents', p_amount_cents, 'currency', p_currency));
  return jsonb_build_object('payment_order_id', v_order.id, 'status', v_new_status, 'created', true);
end;
$$;

create or replace function public.seller_confirm_test_handover(p_payment_order_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_order public.payment_orders;
begin
  if not private.test_payment_simulator_enabled() then raise exception 'test_payment_simulator_disabled'; end if;
  select * into v_order from public.payment_orders where id = p_payment_order_id for update;
  if not found or not private.seller_owns_application(v_order.application_id) then raise exception 'payment_access_denied'; end if;
  if v_order.status <> 'received_held' then raise exception 'held_payment_required'; end if;
  update public.handovers set seller_confirmed_at = coalesce(seller_confirmed_at, clock_timestamp()), updated_at = clock_timestamp() where payment_order_id = v_order.id;
  return jsonb_build_object('payment_order_id', v_order.id, 'seller_confirmed', true);
end;
$$;

create or replace function public.dealer_confirm_test_handover(p_payment_order_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_company uuid := private.current_approved_company_id(); v_order public.payment_orders;
begin
  if not private.test_payment_simulator_enabled() then raise exception 'test_payment_simulator_disabled'; end if;
  select * into v_order from public.payment_orders where id = p_payment_order_id and company_id = v_company for update;
  if not found then raise exception 'payment_access_denied'; end if;
  if v_order.status <> 'received_held' then raise exception 'held_payment_required'; end if;
  update public.handovers set dealer_confirmed_at = coalesce(dealer_confirmed_at, clock_timestamp()), updated_at = clock_timestamp() where payment_order_id = v_order.id;
  return jsonb_build_object('payment_order_id', v_order.id, 'dealer_confirmed', true);
end;
$$;

create or replace function public.admin_verify_test_handover(p_payment_order_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_handover public.handovers;
begin
  if not private.is_staff() or coalesce(auth.jwt()->>'aal', 'aal1') <> 'aal2' then raise exception 'staff_aal2_required'; end if;
  if not private.test_payment_simulator_enabled() then raise exception 'test_payment_simulator_disabled'; end if;
  select h.* into v_handover from public.handovers h join public.payment_orders p on p.id = h.payment_order_id
  where h.payment_order_id = p_payment_order_id and p.status = 'received_held' for update of h;
  if not found or v_handover.seller_confirmed_at is null or v_handover.dealer_confirmed_at is null then raise exception 'dual_handover_confirmation_required'; end if;
  update public.handovers set vrijwaring_verified_at = coalesce(vrijwaring_verified_at, clock_timestamp()),
    vrijwaring_verified_by = coalesce(vrijwaring_verified_by, auth.uid()), updated_at = clock_timestamp() where id = v_handover.id;
  insert into public.audit_log(actor_id, action, entity_type, entity_id, after_data)
  values(auth.uid(), 'payment.test_handover_verified', 'handover', v_handover.id, jsonb_build_object('payment_order_id', p_payment_order_id));
  return jsonb_build_object('payment_order_id', p_payment_order_id, 'verified', true);
end;
$$;

create or replace function public.admin_request_test_release(p_payment_order_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_order public.payment_orders; v_handover public.handovers;
begin
  if not private.is_staff() or coalesce(auth.jwt()->>'aal', 'aal1') <> 'aal2' then raise exception 'staff_aal2_required'; end if;
  if not private.test_payment_simulator_enabled() then raise exception 'test_payment_simulator_disabled'; end if;
  select * into v_order from public.payment_orders where id = p_payment_order_id for update;
  if not found or v_order.status <> 'received_held' then raise exception 'held_payment_required'; end if;
  select * into v_handover from public.handovers where payment_order_id = v_order.id;
  if v_handover.seller_confirmed_at is null or v_handover.dealer_confirmed_at is null or v_handover.vrijwaring_verified_at is null then raise exception 'verified_handover_required'; end if;
  update public.payment_orders set status = 'release_pending', updated_at = clock_timestamp() where id = v_order.id;
  insert into public.audit_log(actor_id, action, entity_type, entity_id, after_data)
  values(auth.uid(), 'payment.test_release_requested', 'payment_order', v_order.id, jsonb_build_object('amount_cents', v_order.seller_payout_cents, 'currency', v_order.currency));
  return jsonb_build_object('payment_order_id', v_order.id, 'status', 'release_pending');
end;
$$;

create or replace function public.admin_request_test_refund(p_payment_order_id uuid, p_amount_cents bigint, p_reason text, p_idempotency_key uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_order public.payment_orders; v_existing public.payment_refunds; v_id uuid; v_ref text;
begin
  if not private.is_staff() or coalesce(auth.jwt()->>'aal', 'aal1') <> 'aal2' then raise exception 'staff_aal2_required'; end if;
  if not private.test_payment_simulator_enabled() then raise exception 'test_payment_simulator_disabled'; end if;
  select * into v_order from public.payment_orders where id = p_payment_order_id for update;
  if not found or v_order.status not in ('received_held', 'disputed', 'paid_out') then raise exception 'refund_not_allowed'; end if;
  if p_amount_cents <= 0 or p_amount_cents > v_order.received_cents - v_order.refunded_cents then raise exception 'invalid_refund_amount'; end if;
  if coalesce(char_length(trim(p_reason)) between 10 and 1000, false) is not true then raise exception 'refund_reason_required'; end if;
  select * into v_existing from public.payment_refunds where requested_by = auth.uid() and idempotency_key = p_idempotency_key;
  if found then return jsonb_build_object('refund_id', v_existing.id, 'status', v_existing.status, 'created', false); end if;
  v_ref := 'test_refund_' || replace(gen_random_uuid()::text, '-', '');
  insert into public.payment_refunds(payment_order_id, amount_cents, reason, requested_by, idempotency_key, provider_refund_reference)
  values(v_order.id, p_amount_cents, trim(p_reason), auth.uid(), p_idempotency_key, v_ref) returning id into v_id;
  update public.payment_orders set status = 'refund_pending', updated_at = clock_timestamp() where id = v_order.id;
  insert into public.audit_log(actor_id, action, entity_type, entity_id, after_data, request_id)
  values(auth.uid(), 'payment.test_refund_requested', 'payment_order', v_order.id, jsonb_build_object('refund_id', v_id, 'amount_cents', p_amount_cents), p_idempotency_key);
  return jsonb_build_object('refund_id', v_id, 'status', 'pending', 'created', true);
end;
$$;

create or replace function public.run_test_payment_reconciliation()
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_run uuid; v_checked integer; v_mismatches integer;
begin
  if coalesce(auth.role(), '') <> 'service_role' then raise exception 'service_role_required'; end if;
  if not private.test_payment_simulator_enabled() then raise exception 'test_payment_simulator_disabled'; end if;
  insert into public.payment_reconciliation_runs(provider, environment, status) values('simulated', 'test', 'completed') returning id into v_run;
  insert into public.payment_reconciliation_items(run_id, payment_order_id, mismatch_type, local_value, provider_value)
  select v_run, po.id, 'provider_state_mismatch',
    jsonb_build_object('status', po.status, 'received_cents', po.received_cents, 'currency', po.currency, 'recipient_reference', po.recipient_reference),
    jsonb_build_object('status', sp.status, 'amount_cents', sp.amount_cents, 'currency', sp.currency, 'recipient_reference', sp.recipient_reference)
  from public.payment_orders po
  left join private.simulated_provider_payments sp on sp.provider_payment_reference = po.provider_payment_reference
  where po.provider = 'simulated' and (
    sp.provider_payment_reference is null or sp.status is distinct from po.status
    or sp.amount_cents is distinct from po.received_cents or sp.currency is distinct from po.currency
    or sp.recipient_reference is distinct from po.recipient_reference
  );
  select count(*) into v_checked from public.payment_orders where provider = 'simulated';
  select count(*) into v_mismatches from public.payment_reconciliation_items where run_id = v_run;
  update public.payment_reconciliation_runs set checked_count = v_checked, mismatch_count = v_mismatches, completed_at = clock_timestamp() where id = v_run;
  return jsonb_build_object('run_id', v_run, 'checked_count', v_checked, 'mismatch_count', v_mismatches);
end;
$$;

create or replace function public.get_dealer_test_payment_cases()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_company uuid := private.current_approved_company_id(); v_result jsonb;
begin
  if v_company is null then raise exception 'approved_company_required'; end if;
  select coalesce(jsonb_agg(jsonb_build_object(
    'agreementId', sa.id, 'applicationId', sa.application_id, 'agreedPriceCents', sa.agreed_price_cents,
    'vehicle', vr.snapshot->'vehicle',
    'onboardingStatus', coalesce(onboarding.status, 'not_started'),
    'payment', case when po.id is null then null else jsonb_build_object(
      'id', po.id, 'status', po.status, 'vehicleAmountCents', po.vehicle_amount_cents,
      'platformFeeCents', po.platform_fee_cents, 'feeConfigurationStatus', po.fee_configuration_status,
      'buyerChargeCents', po.buyer_charge_cents, 'sellerPayoutCents', po.seller_payout_cents,
      'receivedCents', po.received_cents, 'refundedCents', po.refunded_cents, 'currency', po.currency,
      'providerPaymentReference', po.provider_payment_reference,
      'handover', jsonb_build_object('sellerConfirmedAt', h.seller_confirmed_at, 'dealerConfirmedAt', h.dealer_confirmed_at, 'verifiedAt', h.vrijwaring_verified_at)
    ) end
  ) order by sa.created_at desc), '[]'::jsonb) into v_result
  from public.sale_agreements sa
  join public.winner_reservations wr on wr.id = sa.winner_reservation_id
  join public.vehicle_revisions vr on vr.id = sa.vehicle_revision_id
  left join public.seller_payment_onboarding onboarding on onboarding.application_id = sa.application_id
  left join public.payment_orders po on po.sale_agreement_id = sa.id
  left join public.handovers h on h.payment_order_id = po.id
  where wr.company_id = v_company and sa.status = 'agreed';
  return v_result;
end;
$$;

create or replace function public.get_seller_test_payment_state(p_application_id uuid)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  if not private.seller_owns_application(p_application_id) then raise exception 'application_access_denied'; end if;
  return jsonb_build_object(
    'simulatorEnabled', private.test_payment_simulator_enabled(),
    'agreementStatus', (select status from public.sale_agreements where application_id = p_application_id order by created_at desc limit 1),
    'onboarding', (select jsonb_build_object('id', o.id, 'status', o.status, 'verifiedAt', o.verified_at) from public.seller_payment_onboarding o where o.application_id = p_application_id),
    'payment', (select jsonb_build_object(
      'id', po.id, 'status', po.status, 'vehicleAmountCents', po.vehicle_amount_cents,
      'platformFeeCents', po.platform_fee_cents, 'feeConfigurationStatus', po.fee_configuration_status,
      'sellerPayoutCents', po.seller_payout_cents, 'receivedCents', po.received_cents,
      'refundedCents', po.refunded_cents, 'currency', po.currency,
      'handover', jsonb_build_object('sellerConfirmedAt', h.seller_confirmed_at, 'dealerConfirmedAt', h.dealer_confirmed_at, 'verifiedAt', h.vrijwaring_verified_at)
    ) from public.payment_orders po left join public.handovers h on h.payment_order_id = po.id where po.application_id = p_application_id)
  );
end;
$$;

create or replace function public.get_admin_test_payment_state(p_application_id uuid)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  if not private.is_staff() or coalesce(auth.jwt()->>'aal', 'aal1') <> 'aal2' then raise exception 'staff_aal2_required'; end if;
  return jsonb_build_object(
    'simulatorEnabled', private.test_payment_simulator_enabled(),
    'onboarding', (select to_jsonb(o) from public.seller_payment_onboarding o where o.application_id = p_application_id),
    'payment', (select to_jsonb(po) from public.payment_orders po where po.application_id = p_application_id),
    'handover', (select to_jsonb(h) from public.handovers h join public.payment_orders po on po.id = h.payment_order_id where po.application_id = p_application_id),
    'events', coalesce((select jsonb_agg(jsonb_build_object('id', e.id, 'eventType', e.event_type, 'amountCents', e.amount_cents, 'occurredAt', e.provider_occurred_at) order by e.provider_occurred_at desc) from public.payment_events e join public.payment_orders po on po.id = e.payment_order_id where po.application_id = p_application_id), '[]'::jsonb),
    'refunds', coalesce((select jsonb_agg(jsonb_build_object('id', r.id, 'amountCents', r.amount_cents, 'status', r.status, 'reason', r.reason, 'createdAt', r.created_at) order by r.created_at desc) from public.payment_refunds r join public.payment_orders po on po.id = r.payment_order_id where po.application_id = p_application_id), '[]'::jsonb),
    'lastReconciliation', (select jsonb_build_object('id', rr.id, 'status', rr.status, 'checkedCount', rr.checked_count, 'mismatchCount', rr.mismatch_count, 'completedAt', rr.completed_at) from public.payment_reconciliation_runs rr order by rr.started_at desc limit 1)
  );
end;
$$;

create or replace function private.enqueue_test_payment_status()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_seller_email text; v_company_email text;
begin
  if old.status is distinct from new.status then
    select s.email, c.email into v_seller_email, v_company_email
    from public.applications a join public.seller_contacts s on s.id = a.seller_contact_id
    join public.companies c on c.id = new.company_id where a.id = new.application_id;
    insert into public.notification_outbox(event_type, entity_type, entity_id, recipient, payload, idempotency_key)
    values
      ('payment.status_changed', 'payment_order', new.id, v_seller_email, jsonb_build_object('application_id', new.application_id, 'status', new.status, 'environment', 'test'), 'payment.status:' || new.id::text || ':seller:' || new.status),
      ('payment.status_changed', 'payment_order', new.id, v_company_email, jsonb_build_object('application_id', new.application_id, 'status', new.status, 'environment', 'test'), 'payment.status:' || new.id::text || ':dealer:' || new.status)
    on conflict(idempotency_key) do nothing;
  end if;
  return new;
end;
$$;

create trigger test_payment_status_outbox after update of status on public.payment_orders
for each row execute function private.enqueue_test_payment_status();

revoke all on function private.test_payment_simulator_enabled() from public, anon, authenticated;
revoke all on function private.enqueue_test_payment_status() from public, anon, authenticated;
revoke all on function public.set_test_payment_simulator_enabled(boolean) from public, anon, authenticated;
revoke all on function public.process_simulated_payment_event(text, text, text, bigint, text, text, timestamptz, text) from public, anon, authenticated;
revoke all on function public.run_test_payment_reconciliation() from public, anon, authenticated;
revoke all on function public.seller_start_test_payment_onboarding(uuid, uuid) from public, anon;
revoke all on function public.seller_complete_test_payment_onboarding(uuid) from public, anon;
revoke all on function public.dealer_create_test_payment(uuid, uuid) from public, anon;
revoke all on function public.seller_confirm_test_handover(uuid) from public, anon;
revoke all on function public.dealer_confirm_test_handover(uuid) from public, anon;
revoke all on function public.admin_verify_test_handover(uuid) from public, anon;
revoke all on function public.admin_request_test_release(uuid) from public, anon;
revoke all on function public.admin_request_test_refund(uuid, bigint, text, uuid) from public, anon;
revoke all on function public.get_dealer_test_payment_cases() from public, anon;
revoke all on function public.get_seller_test_payment_state(uuid) from public, anon;
revoke all on function public.get_admin_test_payment_state(uuid) from public, anon;

grant execute on function public.set_test_payment_simulator_enabled(boolean) to service_role;
grant execute on function public.process_simulated_payment_event(text, text, text, bigint, text, text, timestamptz, text) to service_role;
grant execute on function public.run_test_payment_reconciliation() to service_role;
grant execute on function public.seller_start_test_payment_onboarding(uuid, uuid) to authenticated;
grant execute on function public.seller_complete_test_payment_onboarding(uuid) to authenticated;
grant execute on function public.dealer_create_test_payment(uuid, uuid) to authenticated;
grant execute on function public.seller_confirm_test_handover(uuid) to authenticated;
grant execute on function public.dealer_confirm_test_handover(uuid) to authenticated;
grant execute on function public.admin_verify_test_handover(uuid) to authenticated;
grant execute on function public.admin_request_test_release(uuid) to authenticated;
grant execute on function public.admin_request_test_refund(uuid, bigint, text, uuid) to authenticated;
grant execute on function public.get_dealer_test_payment_cases() to authenticated;
grant execute on function public.get_seller_test_payment_state(uuid) to authenticated;
grant execute on function public.get_admin_test_payment_state(uuid) to authenticated;
