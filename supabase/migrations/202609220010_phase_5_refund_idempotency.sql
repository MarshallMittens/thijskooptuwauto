-- Check refund idempotency before evaluating the state changed by the first request.

create or replace function public.admin_request_test_refund(
  p_payment_order_id uuid,
  p_amount_cents bigint,
  p_reason text,
  p_idempotency_key uuid
)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_order public.payment_orders; v_existing public.payment_refunds; v_id uuid; v_ref text;
begin
  if not private.is_staff() or coalesce(auth.jwt()->>'aal', 'aal1') <> 'aal2' then raise exception 'staff_aal2_required'; end if;
  if not private.test_payment_simulator_enabled() then raise exception 'test_payment_simulator_disabled'; end if;

  select * into v_existing
  from public.payment_refunds
  where requested_by = auth.uid() and idempotency_key = p_idempotency_key;
  if found then
    if v_existing.payment_order_id <> p_payment_order_id
      or v_existing.amount_cents <> p_amount_cents
      or v_existing.reason <> trim(p_reason)
    then raise exception 'idempotency_conflict'; end if;
    return jsonb_build_object('refund_id', v_existing.id, 'status', v_existing.status, 'created', false);
  end if;

  select * into v_order from public.payment_orders where id = p_payment_order_id for update;
  if not found or v_order.status not in ('received_held', 'disputed', 'paid_out') then raise exception 'refund_not_allowed'; end if;
  if p_amount_cents <= 0 or p_amount_cents > v_order.received_cents - v_order.refunded_cents then raise exception 'invalid_refund_amount'; end if;
  if coalesce(char_length(trim(p_reason)) between 10 and 1000, false) is not true then raise exception 'refund_reason_required'; end if;
  v_ref := 'test_refund_' || replace(gen_random_uuid()::text, '-', '');
  insert into public.payment_refunds(payment_order_id, amount_cents, reason, requested_by, idempotency_key, provider_refund_reference)
  values(v_order.id, p_amount_cents, trim(p_reason), auth.uid(), p_idempotency_key, v_ref) returning id into v_id;
  update public.payment_orders set status = 'refund_pending', updated_at = clock_timestamp() where id = v_order.id;
  insert into public.audit_log(actor_id, action, entity_type, entity_id, after_data, request_id)
  values(auth.uid(), 'payment.test_refund_requested', 'payment_order', v_order.id, jsonb_build_object('refund_id', v_id, 'amount_cents', p_amount_cents), p_idempotency_key);
  return jsonb_build_object('refund_id', v_id, 'status', 'pending', 'created', true);
end;
$$;

revoke all on function public.admin_request_test_refund(uuid, bigint, text, uuid) from public, anon;
grant execute on function public.admin_request_test_refund(uuid, bigint, text, uuid) to authenticated;
