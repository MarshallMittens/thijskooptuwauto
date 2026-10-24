update public.payment_runtime_config set enabled = false, updated_at = clock_timestamp();
create or replace function private.test_payment_simulator_enabled() returns boolean
language sql stable security definer set search_path = '' as $$ select false $$;
revoke all on function public.set_test_payment_simulator_enabled(boolean, uuid) from service_role;
