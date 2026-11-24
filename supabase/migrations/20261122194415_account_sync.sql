create table public.account_sync (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint account_sync_payload_object check (jsonb_typeof(payload) = 'object')
);
alter table public.account_sync enable row level security;
create policy "Users can read their own sync data" on public.account_sync for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users can create their own sync data" on public.account_sync for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users can update their own sync data" on public.account_sync for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
;
