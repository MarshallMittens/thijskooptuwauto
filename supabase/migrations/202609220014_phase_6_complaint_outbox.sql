create or replace function private.queue_complaint_message_notifications()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_complaint public.complaints;
  v_seller_email text;
  v_buyer_email text;
begin
  select * into v_complaint from public.complaints where id = new.complaint_id;
  select sc.email into v_seller_email
  from public.applications a join public.seller_contacts sc on sc.id = a.seller_contact_id
  where a.id = v_complaint.application_id;
  select email into v_buyer_email from public.companies where id = v_complaint.buyer_company_id;

  if new.author_kind in ('dealer', 'staff') and v_seller_email is not null then
    insert into public.notification_outbox(event_type, entity_type, entity_id, recipient, payload, idempotency_key)
    values('complaint.updated', 'complaint', v_complaint.id, v_seller_email,
      jsonb_build_object('reference', v_complaint.reference, 'status', v_complaint.status),
      'complaint.message:' || new.id::text || ':seller')
    on conflict (idempotency_key) do nothing;
  end if;
  if new.author_kind in ('seller', 'staff') and v_buyer_email is not null and v_buyer_email is distinct from v_seller_email then
    insert into public.notification_outbox(event_type, entity_type, entity_id, recipient, payload, idempotency_key)
    values('complaint.updated', 'complaint', v_complaint.id, v_buyer_email,
      jsonb_build_object('reference', v_complaint.reference, 'status', v_complaint.status),
      'complaint.message:' || new.id::text || ':buyer')
    on conflict (idempotency_key) do nothing;
  end if;
  return new;
end;
$$;

create trigger complaint_message_outbox
after insert on public.complaint_messages
for each row execute function private.queue_complaint_message_notifications();

create or replace function private.queue_complaint_status_notifications()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_seller_email text;
  v_buyer_email text;
  v_key text := 'complaint.status:' || new.id::text || ':' || replace(new.updated_at::text, ' ', 'T');
begin
  if new.status is not distinct from old.status then return new; end if;
  select sc.email into v_seller_email
  from public.applications a join public.seller_contacts sc on sc.id = a.seller_contact_id
  where a.id = new.application_id;
  select email into v_buyer_email from public.companies where id = new.buyer_company_id;
  if v_seller_email is not null then
    insert into public.notification_outbox(event_type, entity_type, entity_id, recipient, payload, idempotency_key)
    values('complaint.updated', 'complaint', new.id, v_seller_email,
      jsonb_build_object('reference', new.reference, 'status', new.status), v_key || ':seller')
    on conflict (idempotency_key) do nothing;
  end if;
  if v_buyer_email is not null and v_buyer_email is distinct from v_seller_email then
    insert into public.notification_outbox(event_type, entity_type, entity_id, recipient, payload, idempotency_key)
    values('complaint.updated', 'complaint', new.id, v_buyer_email,
      jsonb_build_object('reference', new.reference, 'status', new.status), v_key || ':buyer')
    on conflict (idempotency_key) do nothing;
  end if;
  return new;
end;
$$;

create trigger complaint_status_outbox
after update of status on public.complaints
for each row execute function private.queue_complaint_status_notifications();

revoke all on function private.queue_complaint_message_notifications() from public, anon, authenticated;
revoke all on function private.queue_complaint_status_notifications() from public, anon, authenticated;
