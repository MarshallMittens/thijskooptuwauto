-- The user explicitly approved password-only access to the entire dealer and
-- staff portals, including their authorized personal-data, bidding, auction,
-- invoice and complaint operations. Existing authorization rules still apply.
create function private.has_authenticated_session()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select auth.uid() is not null and coalesce(auth.role(), '') = 'authenticated';
$$;

revoke all on function private.has_authenticated_session() from public, anon, authenticated;
grant execute on function private.has_authenticated_session() to authenticated;

-- Rewrite only the reviewed live definitions. CREATE OR REPLACE preserves their
-- identities and ACLs; ALTER POLICY preserves policy roles, commands and checks.
-- Abort on schema drift rather than silently leaving a portal behind an MFA gate.
do $password_only$
declare
  v_functions constant text[] := array[
    'private.has_approved_company(uuid)',
    'private.current_approved_company_id()',
    'private.can_access_complaint(uuid)',
    'public.set_company_status(uuid,public.company_status)',
    'public.list_admin_applications()',
    'public.get_admin_application(uuid)',
    'public.admin_update_application_status(uuid,public.application_status)',
    'public.admin_add_internal_note(uuid,text)',
    'public.admin_set_photo_review(uuid,public.photo_review_status)',
    'public.admin_add_contact_event(uuid,text,text,timestamp with time zone)',
    'public.admin_record_material_change(uuid,uuid,integer,text,text,text,integer,text,text)',
    'public.get_admin_case_state(uuid)',
    'public.get_admin_seller_verification(uuid)',
    'public.admin_publish_application(uuid)',
    'public.admin_close_bid_round(uuid)',
    'public.get_admin_phase4_state(uuid)',
    'public.admin_update_deal_case(uuid,public.deal_status,uuid)',
    'public.admin_verify_test_handover(uuid)',
    'public.admin_request_test_release(uuid)',
    'public.get_admin_test_payment_state(uuid)',
    'public.admin_request_test_refund(uuid,bigint,text,uuid)',
    'public.admin_set_platform_affiliation(uuid,boolean)',
    'public.admin_create_test_invoice_record(uuid,text,uuid,text)',
    'public.admin_create_incident(text,text,text)',
    'public.admin_update_incident(uuid,text,text)',
    'public.get_admin_complaint_state(uuid)',
    'public.get_admin_operations_dashboard()',
    'public.admin_review_complaint(uuid,text)',
    'public.admin_update_complaint(uuid,text,text)',
    'public.admin_restart_bid_round(uuid,text,uuid)',
    'public.get_admin_market_state(uuid)',
    'public.list_admin_active_auctions()',
    'public.record_dealer_listing_view(uuid)',
    'public.get_admin_listing_views(uuid)',
    'public.set_proxy_bid(uuid,bigint)',
    'public.admin_handling_fees(bigint,bigint,numeric)'
  ];
  v_signature text;
  v_oid oid;
  v_before text;
  v_after text;
  v_metadata jsonb;
  v_expected_metadata jsonb;
  v_policy record;
  v_count integer;
begin
  if cardinality(v_functions) <> 36
    or (select count(distinct signature) from unnest(v_functions) signature) <> 36
  then
    raise exception 'password_only_function_allowlist_invalid';
  end if;

  select count(*) into v_count
  from pg_catalog.pg_proc p
  join pg_catalog.pg_namespace n on n.oid = p.pronamespace
  where n.nspname in ('public', 'private') and p.prokind = 'f'
    and p.prosrc ilike '%aal2%';
  if v_count <> 36 then
    raise exception 'password_only_unexpected_function_count: %', v_count;
  end if;

  foreach v_signature in array v_functions loop
    v_oid := pg_catalog.to_regprocedure(v_signature);
    if v_oid is null then
      raise exception 'password_only_function_missing: %', v_signature;
    end if;
    v_before := pg_catalog.pg_get_functiondef(v_oid);
    select jsonb_build_object(
      'owner', p.proowner, 'acl', p.proacl, 'security_definer', p.prosecdef,
      'volatility', p.provolatile, 'settings', p.proconfig,
      'parallel', p.proparallel, 'leakproof', p.proleakproof
    ) into v_expected_metadata from pg_catalog.pg_proc p where p.oid = v_oid;

    -- Exact expressions cover the existing negative guards and positive helper
    -- predicates. Roles and company/ownership predicates are not rewritten.
    v_after := replace(v_before,
      'coalesce(auth.jwt()->>''aal'', ''aal1'') <> ''aal2''',
      'not private.has_authenticated_session()');
    v_after := replace(v_after,
      'auth.jwt()->>''aal'' is distinct from ''aal2''',
      'not private.has_authenticated_session()');
    v_after := replace(v_after,
      'auth.jwt()->>''aal'' <> ''aal2''',
      'not private.has_authenticated_session()');
    v_after := replace(v_after,
      'coalesce(auth.jwt()->>''aal'', ''aal1'') = ''aal2''',
      'private.has_authenticated_session()');
    v_after := replace(v_after,
      'auth.jwt()->>''aal'' = ''aal2''',
      'private.has_authenticated_session()');
    v_after := replace(v_after, '''staff_aal2_required''', '''staff_required''');
    v_after := replace(v_after, '''admin_aal2_required''', '''admin_required''');
    v_after := replace(v_after, '''mfa_required''', '''authentication_required''');
    if v_after = v_before or v_after ilike '%aal2%'
      or position('private.has_authenticated_session()' in v_after) = 0
    then
      raise exception 'password_only_unexpected_function_definition: %', v_signature;
    end if;

    execute v_after;
    select jsonb_build_object(
      'owner', p.proowner, 'acl', p.proacl, 'security_definer', p.prosecdef,
      'volatility', p.provolatile, 'settings', p.proconfig,
      'parallel', p.proparallel, 'leakproof', p.proleakproof
    ) into v_metadata from pg_catalog.pg_proc p where p.oid = v_oid;
    if v_metadata is distinct from v_expected_metadata then
      raise exception 'password_only_function_security_changed: %', v_signature;
    end if;
  end loop;

  select count(*) into v_count
  from pg_catalog.pg_policy p
  join pg_catalog.pg_class c on c.oid = p.polrelid
  join pg_catalog.pg_namespace n on n.oid = c.relnamespace
  where n.nspname in ('public', 'storage')
    and (coalesce(pg_catalog.pg_get_expr(p.polqual, p.polrelid), '') ilike '%aal2%'
      or coalesce(pg_catalog.pg_get_expr(p.polwithcheck, p.polrelid), '') ilike '%aal2%');
  if v_count <> 42 then
    raise exception 'password_only_unexpected_policy_count: %', v_count;
  end if;

  v_count := 0;
  for v_policy in
    select targets.schema_name, targets.table_name, targets.policy_name,
      p.oid, p.polrelid, p.polcmd, p.polpermissive, p.polroles, p.polwithcheck,
      pg_catalog.pg_get_expr(p.polqual, p.polrelid) as predicate
    from (values
      ('public', 'profiles', 'profiles_read_self'),
      ('public', 'staff_memberships', 'staff_read_self'),
      ('public', 'company_memberships', 'memberships_read_self_or_staff'),
      ('public', 'seller_contacts', 'seller_contacts_staff_only'),
      ('public', 'applications', 'applications_staff_only'),
      ('public', 'vehicles', 'vehicles_staff_only'),
      ('public', 'condition_reports', 'condition_reports_staff_only'),
      ('public', 'vehicle_revisions', 'revisions_dealer_or_staff'),
      ('public', 'listings', 'listings_dealer_or_staff'),
      ('public', 'vehicle_photos', 'photos_dealer_or_staff'),
      ('public', 'bid_rounds', 'rounds_dealer_or_staff'),
      ('public', 'bids', 'bids_own_company_or_staff'),
      ('public', 'deal_cases', 'deals_staff_only'),
      ('public', 'contact_events', 'contact_events_staff_only'),
      ('public', 'internal_notes', 'notes_staff_only'),
      ('public', 'audit_log', 'audit_staff_only'),
      ('public', 'notification_outbox', 'outbox_staff_only'),
      ('storage', 'objects', 'vehicle_photos_staff_read'),
      ('public', 'companies', 'companies_read_member_or_staff'),
      ('public', 'auction_policy_versions', 'auction_policy_versions_staff_read'),
      ('public', 'winner_reservations', 'winner_reservations_staff_read'),
      ('public', 'agreement_terms_versions', 'phase4_terms_staff_read'),
      ('public', 'appointments', 'phase4_appointments_staff_read'),
      ('public', 'appointment_proposals', 'phase4_proposals_staff_read'),
      ('public', 'inspections', 'phase4_inspections_staff_read'),
      ('public', 'inspection_photos', 'phase4_photos_staff_read'),
      ('public', 'price_adjustment_proposals', 'phase4_adjustments_staff_read'),
      ('public', 'sale_agreements', 'phase4_agreements_staff_read'),
      ('public', 'workflow_tasks', 'phase4_tasks_staff_read'),
      ('public', 'payment_runtime_config', 'payment_config_staff_read'),
      ('public', 'seller_payment_onboarding', 'payment_onboarding_staff_read'),
      ('public', 'payment_orders', 'payment_orders_staff_read'),
      ('public', 'payment_events', 'payment_events_staff_read'),
      ('public', 'handovers', 'handovers_staff_read'),
      ('public', 'payment_refunds', 'payment_refunds_staff_read'),
      ('public', 'payment_reconciliation_runs', 'payment_reconciliation_runs_staff_read'),
      ('public', 'payment_reconciliation_items', 'payment_reconciliation_items_staff_read'),
      ('public', 'platform_invoice_records', 'invoice_records_staff_read'),
      ('public', 'operational_incidents', 'operational_incidents_staff_read'),
      ('public', 'operation_runs', 'operation_runs_staff_read'),
      ('public', 'recovery_test_runs', 'recovery_runs_staff_read'),
      ('storage', 'objects', 'complaint_evidence_staff_read')
    ) as targets(schema_name, table_name, policy_name)
    left join pg_catalog.pg_namespace n on n.nspname = targets.schema_name
    left join pg_catalog.pg_class c on c.relnamespace = n.oid and c.relname = targets.table_name
    left join pg_catalog.pg_policy p on p.polrelid = c.oid and p.polname = targets.policy_name
  loop
    if v_policy.oid is null then
      raise exception 'password_only_policy_missing: %.%', v_policy.table_name, v_policy.policy_name;
    end if;
    v_after := replace(v_policy.predicate,
      '((auth.jwt() ->> ''aal''::text) = ''aal2''::text)',
      'private.has_authenticated_session()');
    if v_after is null or v_after = v_policy.predicate or v_after ilike '%aal2%' then
      raise exception 'password_only_unexpected_policy_definition: %.%', v_policy.table_name, v_policy.policy_name;
    end if;
    execute format('alter policy %I on %I.%I using (%s)',
      v_policy.policy_name, v_policy.schema_name, v_policy.table_name, v_after);
    if not exists (
      select 1 from pg_catalog.pg_policy p where p.oid = v_policy.oid
        and p.polcmd = v_policy.polcmd and p.polpermissive = v_policy.polpermissive
        and p.polroles = v_policy.polroles
        and p.polwithcheck::text is not distinct from v_policy.polwithcheck::text
    ) then
      raise exception 'password_only_policy_security_changed: %.%', v_policy.table_name, v_policy.policy_name;
    end if;
    v_count := v_count + 1;
  end loop;
  if v_count <> 42 then
    raise exception 'password_only_policy_allowlist_invalid: %', v_count;
  end if;

  if exists (
    select 1 from pg_catalog.pg_proc p
    join pg_catalog.pg_namespace n on n.oid = p.pronamespace
    where n.nspname in ('public', 'private') and p.prokind = 'f'
      and (p.prosrc ilike '%aal2%' or p.prosrc ilike '%mfa_required%')
  ) or exists (
    select 1 from pg_catalog.pg_policy p
    join pg_catalog.pg_class c on c.oid = p.polrelid
    join pg_catalog.pg_namespace n on n.oid = c.relnamespace
    where n.nspname in ('public', 'storage')
      and (coalesce(pg_catalog.pg_get_expr(p.polqual, p.polrelid), '') ilike '%aal2%'
        or coalesce(pg_catalog.pg_get_expr(p.polwithcheck, p.polrelid), '') ilike '%aal2%')
  ) then
    raise exception 'password_only_assurance_gate_remaining';
  end if;
end;
$password_only$;
