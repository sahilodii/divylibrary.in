-- Keep one active sandbox grant per account and collection. A new payment
-- after a full refund can create a fresh grant because revoked rows are excluded.
create unique index if not exists divy_sandbox_access_one_active_collection_idx
  on public.divy_sandbox_access(user_id, collection_id)
  where revoked_at is null;

-- The previous function targeted only (source_payment_id, collection_id).
-- Untargeted conflict handling also covers the active-grant unique index above.
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
      on conflict do nothing;
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

revoke all on function public.divy_record_sandbox_payment(uuid,text,text,text,integer,text,text,text,text,timestamptz) from public, anon, authenticated;
grant execute on function public.divy_record_sandbox_payment(uuid,text,text,text,integer,text,text,text,text,timestamptz) to service_role;
