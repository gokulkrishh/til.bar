-- =============================================================
-- API KEYS (for MCP/machine client authentication)
-- =============================================================
create table public.api_keys (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  key_hash   text not null unique,
  created_at timestamptz not null default now()
);

create index idx_api_keys_user_id on public.api_keys(user_id);
create index idx_api_keys_key_hash on public.api_keys(key_hash);

alter table public.api_keys enable row level security;

create policy "Users can read own api_keys"
  on public.api_keys for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "Users can insert own api_keys"
  on public.api_keys for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy "Users can delete own api_keys"
  on public.api_keys for delete
  to authenticated
  using (user_id = (select auth.uid()));
