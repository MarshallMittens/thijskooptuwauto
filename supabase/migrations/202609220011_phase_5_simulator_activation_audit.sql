-- Make local simulator activation attributable to a real staff actor.

drop function public.set_test_payment_simulator_enabled(boolean);

create function public.set_test_payment_simulator_enabled(p_enabled boolean, p_actor_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if coalesce(auth.role(), '') <> 'service_role' then raise exception 'service_role_required'; end if;
  if not exists(select 1 from public.staff_memberships where user_id = p_actor_id) then raise exception 'staff_actor_required'; end if;
  update public.payment_runtime_config set enabled = p_enabled, updated_at = clock_timestamp()
  where provider = 'simulated' and environment = 'test';
  insert into public.audit_log(actor_id, action, entity_type, after_data)
  values(p_actor_id, case when p_enabled then 'payment.test_simulator_enabled' else 'payment.test_simulator_disabled' end,
    'payment_runtime_config', jsonb_build_object('provider', 'simulated', 'environment', 'test', 'enabled', p_enabled));
end;
$$;

revoke all on function public.set_test_payment_simulator_enabled(boolean, uuid) from public, anon, authenticated;
grant execute on function public.set_test_payment_simulator_enabled(boolean, uuid) to service_role;
