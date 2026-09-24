-- RLS policies execute their helper as the authenticated caller.
-- The helper only returns whether the current auth.uid() may access one complaint.
grant execute on function private.can_access_complaint(uuid) to authenticated;
