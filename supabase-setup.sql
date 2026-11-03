-- Run this in Supabase → SQL Editor → New query → Run.
-- Safe to run more than once. Every table is locked so each person
-- can only ever see, add, change or delete their OWN rows.

-- 1. Journal entries
create table if not exists public.entries (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at  timestamptz not null default now(),
  entry_date  date not null default current_date,
  theme       text,
  prompt      text,
  body        text not null
);
create index if not exists entries_user_date_idx on public.entries (user_id, entry_date desc);
alter table public.entries enable row level security;

-- 2. Drafts (unsaved writing, one per day, synced across devices)
create table if not exists public.drafts (
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  entry_date  date not null,
  body        text not null default '',
  updated_at  timestamptz not null default now(),
  primary key (user_id, entry_date)
);
alter table public.drafts enable row level security;

-- 3. Birth details for "My chart"
create table if not exists public.profiles (
  user_id       uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  display_name  text,
  birth_date    date,
  birth_time    time,
  birth_place   text,
  lat           double precision,
  lon           double precision,
  tz            text,
  updated_at    timestamptz not null default now()
);
alter table public.profiles enable row level security;

-- 4. People you add for compatibility
create table if not exists public.people (
  id          uuid primary key default gen_random_uuid(),
  owner       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name        text not null,
  birth_date  date not null,
  birth_time  time,
  birth_place text,
  lat         double precision,
  lon         double precision,
  tz          text,
  created_at  timestamptz not null default now()
);
alter table public.people enable row level security;

-- Privacy rules
do $$ begin
  drop policy if exists "own entries" on public.entries;
  drop policy if exists "read own entries" on public.entries;
  drop policy if exists "add own entries" on public.entries;
  drop policy if exists "edit own entries" on public.entries;
  drop policy if exists "delete own entries" on public.entries;
  drop policy if exists "own drafts" on public.drafts;
  drop policy if exists "own profile" on public.profiles;
  drop policy if exists "own people" on public.people;
end $$;
create policy "own entries"  on public.entries  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own drafts"   on public.drafts   for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own profile"  on public.profiles for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own people"   on public.people   for all using (auth.uid() = owner)   with check (auth.uid() = owner);
