-- Fan out the existing transactional outbid event to other participating garages.
create function private.notify_other_outbid_participants() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.event_type <> 'bid.outbid' or new.payload->>'participant_fanout' = 'true' then return new; end if;
  insert into public.notification_outbox(event_type, entity_type, entity_id, recipient, payload, idempotency_key)
  select 'bid.outbid', 'bid', new.entity_id, c.email,
    new.payload || jsonb_build_object('participant_fanout', true),
    'bid.outbid:' || new.entity_id::text || ':' || c.id::text
  from public.companies c
  where c.status = 'approved'
    and exists (select 1 from public.bids b where b.company_id = c.id and b.bid_round_id = (new.payload->>'bid_round_id')::uuid)
    and not exists (select 1 from public.bids b where b.id = new.entity_id and b.company_id = c.id)
  on conflict (idempotency_key) do nothing;
  return new;
end;
$$;
create trigger notification_outbid_participants after insert on public.notification_outbox
for each row when (new.event_type = 'bid.outbid') execute function private.notify_other_outbid_participants();
revoke all on function private.notify_other_outbid_participants() from public, anon, authenticated;
