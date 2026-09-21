create or replace function private.has_active_company_membership(p_company_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.company_memberships m
    join public.profiles p on p.id = m.user_id
    where m.company_id = p_company_id
      and m.user_id = auth.uid()
      and m.status = 'active'
      and not p.account_blocked
  );
$$;

drop policy companies_read_member_or_staff on public.companies;

create policy companies_read_member_or_staff
on public.companies
for select
to authenticated
using (
  private.has_active_company_membership(id)
  or (private.is_staff() and auth.jwt()->>'aal' = 'aal2')
);
