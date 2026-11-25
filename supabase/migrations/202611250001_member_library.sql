-- Per-account saved packs and server-confirmed pack purchases.
-- Client sessions may manage their own saved packs. Purchase rows are read-only
-- to clients and must be written by a trusted payment webhook/server.

create table if not exists public.user_saved_packs (
  user_id uuid not null references auth.users (id) on delete cascade,
  pack_id text not null check (pack_id in (
    'history', 'mind', 'money', 'marketing', 'spirituality', 'wellness',
    'hindi', 'english', 'food', 'kids', 'relationships', 'career'
  )),
  saved_at timestamptz not null default now(),
  primary key (user_id, pack_id)
);

alter table public.user_saved_packs enable row level security;
revoke all on table public.user_saved_packs from public, anon, authenticated;
grant select, insert, delete on table public.user_saved_packs to authenticated;

create policy "Users can read their saved packs"
  on public.user_saved_packs for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can save packs to their account"
  on public.user_saved_packs for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can remove packs from their account"
  on public.user_saved_packs for delete to authenticated
  using ((select auth.uid()) = user_id);

create table if not exists public.user_pack_purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  pack_id text not null check (pack_id in (
    'history', 'mind', 'money', 'marketing', 'spirituality', 'wellness',
    'hindi', 'english', 'food', 'kids', 'relationships', 'career', 'all_access'
  )),
  status text not null default 'paid' check (status in ('paid', 'refunded')),
  payment_reference text unique,
  amount_inr integer check (amount_inr is null or amount_inr >= 0),
  purchased_at timestamptz not null default now()
);

create index if not exists user_pack_purchases_user_date_idx
  on public.user_pack_purchases (user_id, purchased_at desc);

alter table public.user_pack_purchases enable row level security;
revoke all on table public.user_pack_purchases from public, anon, authenticated;
grant select on table public.user_pack_purchases to authenticated;

create policy "Users can read their own purchases"
  on public.user_pack_purchases for select to authenticated
  using ((select auth.uid()) = user_id);
