-- Keep synced payloads bounded, let users remove their own data, and track writes accurately.

alter table public.account_sync drop constraint if exists account_sync_payload_size;
alter table public.account_sync add constraint account_sync_payload_size check (length(payload::text) <= 100000);

drop policy if exists "Users can delete their own sync data" on public.account_sync;
create policy "Users can delete their own sync data" on public.account_sync for delete to authenticated using ((select auth.uid()) = user_id);

create or replace function public.touch_account_sync()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists touch_account_sync on public.account_sync;
create trigger touch_account_sync before update on public.account_sync
for each row execute function public.touch_account_sync();
