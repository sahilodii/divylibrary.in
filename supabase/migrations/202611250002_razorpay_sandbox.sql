-- Razorpay Test Mode only. These records are separate from legacy purchases
-- and must never be used as production entitlements.

create table if not exists public.divy_sandbox_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  environment text not null default 'test' check (environment = 'test'),
  package_id text not null check (package_id in ('history','mind','money','marketing','spirituality','wellness','hindi','english','food','kids','relationships','career','complete_library')),
  amount_paise integer not null check (amount_paise > 0),
  currency text not null default 'INR' check (currency = 'INR'),
  razorpay_order_id text not null unique,
  receipt text not null unique,
  idempotency_key text not null,
  status text not null default 'created' check (status in ('created','attempted','paid','failed','cancelled','refunded')),
  customer_email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, idempotency_key)
);

create index if not exists divy_sandbox_orders_user_created_idx
  on public.divy_sandbox_orders(user_id, created_at desc);
create index if not exists divy_sandbox_orders_status_idx
  on public.divy_sandbox_orders(status, created_at desc);

create table if not exists public.divy_sandbox_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  order_id uuid not null references public.divy_sandbox_orders(id) on delete cascade,
  razorpay_payment_id text not null unique,
  status text not null check (status in ('authorized','captured','failed','refunded')),
  amount_paise integer not null check (amount_paise > 0),
  currency text not null default 'INR' check (currency = 'INR'),
  method text,
  error_code text,
  error_description text,
  amount_refunded_paise integer not null default 0 check (amount_refunded_paise >= 0),
  created_at timestamptz not null default now(),
  captured_at timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists divy_sandbox_transactions_user_created_idx
  on public.divy_sandbox_transactions(user_id, created_at desc);
create index if not exists divy_sandbox_transactions_order_idx
  on public.divy_sandbox_transactions(order_id, created_at desc);

create table if not exists public.divy_sandbox_access (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  environment text not null default 'test' check (environment = 'test'),
  collection_id text not null check (collection_id in (
    'history','mind','money','marketing','spirituality','wellness',
    'hindi','english','food','kids','relationships','career'
  )),
  package_id text not null check (package_id in ('history','mind','money','marketing','spirituality','wellness','hindi','english','food','kids','relationships','career','complete_library')),
  source_payment_id text not null references public.divy_sandbox_transactions(razorpay_payment_id) on delete cascade,
  granted_at timestamptz not null default now(),
  revoked_at timestamptz,
  unique(source_payment_id, collection_id)
);

create index if not exists divy_sandbox_access_user_idx
  on public.divy_sandbox_access(user_id, collection_id) where revoked_at is null;

create table if not exists public.divy_sandbox_refunds (
  id uuid primary key default gen_random_uuid(),
  razorpay_refund_id text not null unique,
  razorpay_payment_id text not null references public.divy_sandbox_transactions(razorpay_payment_id) on delete cascade,
  amount_paise integer not null check (amount_paise > 0),
  status text not null check (status in ('pending','processed','failed')),
  receipt text,
  initiated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  processed_at timestamptz
);

create index if not exists divy_sandbox_refunds_payment_idx
  on public.divy_sandbox_refunds(razorpay_payment_id, created_at desc);

create table if not exists public.divy_sandbox_webhook_events (
  event_id text primary key,
  event_type text not null,
  environment text not null default 'test' check (environment = 'test'),
  payload_summary jsonb not null default '{}'::jsonb,
  processing_status text not null default 'received' check (processing_status in ('received','processed','ignored','failed')),
  error_code text,
  received_at timestamptz not null default now(),
  processed_at timestamptz
);

create table if not exists public.divy_sandbox_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text,
  entity_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Client access is read-only and always scoped to the authenticated owner.
do $$
declare t text;
begin
  foreach t in array array['divy_sandbox_orders','divy_sandbox_transactions','divy_sandbox_access','divy_sandbox_refunds'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on table public.%I from public, anon, authenticated', t);
    execute format('grant select on table public.%I to authenticated', t);
  end loop;
end $$;

create policy "Users read their test orders"
  on public.divy_sandbox_orders for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users read their test payments"
  on public.divy_sandbox_transactions for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users read their test access"
  on public.divy_sandbox_access for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users read their test refunds"
  on public.divy_sandbox_refunds for select to authenticated using (
    exists (select 1 from public.divy_sandbox_transactions p where p.razorpay_payment_id = divy_sandbox_refunds.razorpay_payment_id and p.user_id = (select auth.uid()))
  );

alter table public.divy_sandbox_webhook_events enable row level security;
revoke all on table public.divy_sandbox_webhook_events from public, anon, authenticated;
alter table public.divy_sandbox_audit_logs enable row level security;
revoke all on table public.divy_sandbox_audit_logs from public, anon, authenticated;

-- All purchase/access mutation is performed by Edge Functions using service_role.
create or replace function public.divy_record_sandbox_payment(
  p_user_id uuid,
  p_razorpay_order_id text,
  p_razorpay_payment_id text,
  p_status text,
  p_amount_paise integer,
  p_currency text,
  p_method text default null,
  p_error_code text default null,
  p_error_description text default null,
  p_created_at timestamptz default now()
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_order public.divy_sandbox_orders%rowtype;
  v_tx public.divy_sandbox_transactions%rowtype;
  v_collections text[];
begin
  if p_status not in ('authorized','captured','failed') then raise exception 'unsupported_payment_status'; end if;
  select * into v_order from public.divy_sandbox_orders
    where razorpay_order_id = p_razorpay_order_id and user_id = p_user_id and environment = 'test'
    for update;
  if not found then raise exception 'sandbox_order_not_found'; end if;
  if v_order.amount_paise <> p_amount_paise or v_order.currency <> p_currency then raise exception 'payment_amount_mismatch'; end if;

  insert into public.divy_sandbox_transactions(
    user_id, order_id, razorpay_payment_id, status, amount_paise, currency, method,
    error_code, error_description, created_at, captured_at
  ) values (
    p_user_id, v_order.id, p_razorpay_payment_id, p_status, p_amount_paise, p_currency, p_method,
    left(p_error_code,120), left(p_error_description,500), coalesce(p_created_at,now()),
    case when p_status = 'captured' then now() else null end
  ) on conflict (razorpay_payment_id) do update set
    status = case when public.divy_sandbox_transactions.status = 'captured' then 'captured' else excluded.status end,
    method = coalesce(excluded.method, public.divy_sandbox_transactions.method),
    error_code = coalesce(excluded.error_code, public.divy_sandbox_transactions.error_code),
    error_description = coalesce(excluded.error_description, public.divy_sandbox_transactions.error_description),
    captured_at = coalesce(public.divy_sandbox_transactions.captured_at, excluded.captured_at),
    updated_at = now()
  returning * into v_tx;

  if v_tx.status = 'captured' then
    update public.divy_sandbox_orders set status = 'paid', updated_at = now() where id = v_order.id;
    v_collections := case v_order.package_id
      when 'complete_library' then array['history','mind','money','marketing','spirituality','wellness','hindi','english','food','kids','relationships','career']
      else array[v_order.package_id]
    end;
    insert into public.divy_sandbox_access(user_id, collection_id, package_id, source_payment_id)
      select p_user_id, unnest(v_collections), v_order.package_id, p_razorpay_payment_id
      on conflict (source_payment_id, collection_id) do nothing;
  else
    update public.divy_sandbox_orders set status = case when status = 'paid' then 'paid' else 'attempted' end, updated_at = now() where id = v_order.id;
  end if;

  insert into public.divy_sandbox_audit_logs(actor_user_id, action, entity_type, entity_id, details)
  values (p_user_id, 'payment_' || v_tx.status, 'payment', p_razorpay_payment_id,
    jsonb_build_object('order_id',p_razorpay_order_id,'package_id',v_order.package_id,'amount_paise',p_amount_paise,'currency',p_currency));
  return jsonb_build_object('payment_id',v_tx.razorpay_payment_id,'order_id',p_razorpay_order_id,'status',v_tx.status,
    'amount_paise',v_tx.amount_paise,'currency',v_tx.currency,'method',v_tx.method,'package_id',v_order.package_id,
    'collections',coalesce(v_collections,array[]::text[]),'captured_at',v_tx.captured_at);
end;
$$;

create or replace function public.divy_record_sandbox_refund(
  p_razorpay_payment_id text,
  p_razorpay_refund_id text,
  p_amount_paise integer,
  p_status text,
  p_receipt text default null,
  p_initiated_by uuid default null,
  p_processed_at timestamptz default null
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_tx public.divy_sandbox_transactions%rowtype;
  v_total integer;
  v_collections integer;
begin
  if p_status not in ('pending','processed','failed') or p_amount_paise <= 0 then raise exception 'invalid_refund'; end if;
  select * into v_tx from public.divy_sandbox_transactions where razorpay_payment_id=p_razorpay_payment_id for update;
  if not found or v_tx.status not in ('captured','refunded') then raise exception 'captured_test_payment_required'; end if;
  insert into public.divy_sandbox_refunds(razorpay_refund_id,razorpay_payment_id,amount_paise,status,receipt,initiated_by,processed_at)
    values(p_razorpay_refund_id,p_razorpay_payment_id,p_amount_paise,p_status,left(p_receipt,40),p_initiated_by,p_processed_at)
    on conflict(razorpay_refund_id) do update set status=excluded.status, processed_at=coalesce(excluded.processed_at,public.divy_sandbox_refunds.processed_at);
  select coalesce(sum(amount_paise),0)::integer into v_total from public.divy_sandbox_refunds
    where razorpay_payment_id=p_razorpay_payment_id and status='processed';
  update public.divy_sandbox_transactions set amount_refunded_paise=v_total,
    status=case when v_total >= amount_paise then 'refunded' else status end, updated_at=now()
    where razorpay_payment_id=p_razorpay_payment_id;
  if v_total >= v_tx.amount_paise then
    update public.divy_sandbox_access set revoked_at=coalesce(revoked_at,now()) where source_payment_id=p_razorpay_payment_id;
    update public.divy_sandbox_orders set status='refunded',updated_at=now() where id=v_tx.order_id;
  end if;
  insert into public.divy_sandbox_audit_logs(actor_user_id,action,entity_type,entity_id,details)
    values(p_initiated_by,'refund_'||p_status,'refund',p_razorpay_refund_id,jsonb_build_object('payment_id',p_razorpay_payment_id,'amount_paise',p_amount_paise,'processed_total_paise',v_total));
  return jsonb_build_object('payment_id',p_razorpay_payment_id,'refund_id',p_razorpay_refund_id,'amount_refunded_paise',v_total,
    'fully_refunded',v_total >= v_tx.amount_paise,'status',p_status);
end;
$$;

revoke all on function public.divy_record_sandbox_payment(uuid,text,text,text,integer,text,text,text,text,timestamptz) from public, anon, authenticated;
revoke all on function public.divy_record_sandbox_refund(text,text,integer,text,text,uuid,timestamptz) from public, anon, authenticated;
grant execute on function public.divy_record_sandbox_payment(uuid,text,text,text,integer,text,text,text,text,timestamptz) to service_role;
grant execute on function public.divy_record_sandbox_refund(text,text,integer,text,text,uuid,timestamptz) to service_role;

create or replace function public.divy_reset_sandbox_data(p_actor uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  delete from public.divy_sandbox_webhook_events;
  delete from public.divy_sandbox_refunds;
  delete from public.divy_sandbox_transactions;
  delete from public.divy_sandbox_access;
  delete from public.divy_sandbox_orders;
  insert into public.divy_sandbox_audit_logs(actor_user_id,action,entity_type,details)
    values(p_actor,'sandbox_data_reset','sandbox',jsonb_build_object('scope','local test records only','provider_history_deleted',false));
end;
$$;
revoke all on function public.divy_reset_sandbox_data(uuid) from public, anon, authenticated;
grant execute on function public.divy_reset_sandbox_data(uuid) to service_role;
