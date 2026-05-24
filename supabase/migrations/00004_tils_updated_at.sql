-- =============================================================
-- Add updated_at to tils so we can enforce a per-TIL refresh cooldown
-- and detect stale rows. handle_updated_at() already exists from
-- 00001_initial_schema.sql.
-- =============================================================

alter table public.tils
  add column if not exists updated_at timestamptz not null default now();

drop trigger if exists set_tils_updated_at on public.tils;

create trigger set_tils_updated_at
  before update on public.tils
  for each row execute function public.handle_updated_at();
