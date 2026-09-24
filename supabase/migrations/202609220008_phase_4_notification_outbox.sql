-- Phase 4: durable notifications for price and agreement responses.

create or replace function private.enqueue_phase4_price_response()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_company_email text;
  v_application_id uuid;
begin
  if old.status = 'pending' and new.status in ('accepted', 'declined') then
    select c.email, i.application_id into v_company_email, v_application_id
    from public.inspections i
    join public.companies c on c.id = i.company_id
    where i.id = new.inspection_id;
    insert into public.notification_outbox (event_type, entity_type, entity_id, recipient, payload, idempotency_key)
    values (
      'price_adjustment.seller_response', 'price_adjustment_proposal', new.id, v_company_email,
      jsonb_build_object('application_id', v_application_id, 'status', new.status),
      'price_adjustment.seller_response:' || new.id::text || ':' || new.status
    ) on conflict (idempotency_key) do nothing;
  end if;
  return new;
end;
$$;

create trigger phase4_price_response_outbox
after update of status on public.price_adjustment_proposals
for each row execute function private.enqueue_phase4_price_response();

create or replace function private.enqueue_phase4_agreement_response()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_company_email text;
  v_seller_email text;
begin
  select c.email, seller.email into v_company_email, v_seller_email
  from public.winner_reservations wr
  join public.companies c on c.id = wr.company_id
  join public.applications a on a.id = new.application_id
  join public.seller_contacts seller on seller.id = a.seller_contact_id
  where wr.id = new.winner_reservation_id;

  if old.seller_confirmed_at is distinct from new.seller_confirmed_at
    or old.seller_declined_at is distinct from new.seller_declined_at
  then
    insert into public.notification_outbox (event_type, entity_type, entity_id, recipient, payload, idempotency_key)
    values (
      'sale_agreement.seller_response', 'sale_agreement', new.id, v_company_email,
      jsonb_build_object('application_id', new.application_id, 'status', new.status),
      'sale_agreement.seller_response:' || new.id::text || ':' || case when new.seller_declined_at is null then 'confirmed' else 'declined' end
    ) on conflict (idempotency_key) do nothing;
  end if;

  if old.dealer_confirmed_at is distinct from new.dealer_confirmed_at
    or old.dealer_declined_at is distinct from new.dealer_declined_at
  then
    insert into public.notification_outbox (event_type, entity_type, entity_id, recipient, payload, idempotency_key)
    values (
      'sale_agreement.dealer_response', 'sale_agreement', new.id, v_seller_email,
      jsonb_build_object('application_id', new.application_id, 'status', new.status),
      'sale_agreement.dealer_response:' || new.id::text || ':' || case when new.dealer_declined_at is null then 'confirmed' else 'declined' end
    ) on conflict (idempotency_key) do nothing;
  end if;
  return new;
end;
$$;

create trigger phase4_agreement_response_outbox
after update of seller_confirmed_at, seller_declined_at, dealer_confirmed_at, dealer_declined_at on public.sale_agreements
for each row execute function private.enqueue_phase4_agreement_response();

revoke all on function private.enqueue_phase4_price_response() from public, anon, authenticated;
revoke all on function private.enqueue_phase4_agreement_response() from public, anon, authenticated;
