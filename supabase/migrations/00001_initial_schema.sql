-- =============================================================
-- CLEANUP (drop old objects if they exist)
-- =============================================================
drop trigger if exists handle_new_user on auth.users;
drop trigger if exists on_auth_user_created on auth.users;
drop trigger if exists set_profiles_updated_at on public.profiles;
drop function if exists public.handle_new_user() cascade;
drop function if exists public.handle_updated_at() cascade;
drop table if exists public.til_tags cascade;
drop table if exists public.tils cascade;
drop table if exists public.tags cascade;
drop table if exists public.profiles cascade;

-- =============================================================
-- PROFILES
-- =============================================================
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  email       text not null,
  avatar_url  text,
  settings    jsonb not null default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on column public.profiles.settings is
  'User preferences. Shape: { "export_format"?: "json" | "markdown" }';

create index idx_profiles_email on public.profiles(email);

-- =============================================================
-- TAGS
-- =============================================================
create table public.tags (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  name        text not null,
  created_at  timestamptz not null default now(),

  constraint uq_tags_user_name unique (user_id, name)
);

create index idx_tags_user_id on public.tags(user_id);
create index idx_tags_user_name on public.tags(user_id, name);

-- =============================================================
-- TILS
-- =============================================================
create table public.tils (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  url         text not null,
  title       text,
  description text,
  created_at  timestamptz not null default now()
);

create index idx_tils_user_id on public.tils(user_id);
create index idx_tils_user_created on public.tils(user_id, created_at desc);
create index idx_tils_user_url on public.tils(user_id, url);

-- =============================================================
-- TIL_TAGS (junction)
-- =============================================================
create table public.til_tags (
  til_id      uuid not null references public.tils(id) on delete cascade,
  tag_id      uuid not null references public.tags(id) on delete cascade,
  primary key (til_id, tag_id)
);

create index idx_til_tags_tag_id on public.til_tags(tag_id);

-- =============================================================
-- UPDATED_AT TRIGGER
-- =============================================================
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

-- =============================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- =============================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    coalesce(new.email, new.raw_user_meta_data ->> 'email'),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =============================================================
-- ROW LEVEL SECURITY
-- =============================================================

-- Profiles
alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles for select
  to authenticated
  using (id = (select auth.uid()));

create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Tags
alter table public.tags enable row level security;

create policy "Users can read own tags"
  on public.tags for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "Users can insert own tags"
  on public.tags for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy "Users can delete own tags"
  on public.tags for delete
  to authenticated
  using (user_id = (select auth.uid()));

-- TILs
alter table public.tils enable row level security;

create policy "Users can read own tils"
  on public.tils for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "Users can insert own tils"
  on public.tils for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy "Users can delete own tils"
  on public.tils for delete
  to authenticated
  using (user_id = (select auth.uid()));

-- TIL_TAGS
alter table public.til_tags enable row level security;

create policy "Users can read own til_tags"
  on public.til_tags for select
  to authenticated
  using (
    til_id in (
      select id from public.tils
      where user_id = (select auth.uid())
    )
  );

create policy "Users can insert own til_tags"
  on public.til_tags for insert
  to authenticated
  with check (
    til_id in (
      select id from public.tils
      where user_id = (select auth.uid())
    )
  );

create policy "Users can delete own til_tags"
  on public.til_tags for delete
  to authenticated
  using (
    til_id in (
      select id from public.tils
      where user_id = (select auth.uid())
    )
  );
