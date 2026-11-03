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

-- ─────────────────────────────────────────────────────────────
-- 5. Friend invites: you send a link, they accept, then you're friends
create table if not exists public.invites (
  code          text primary key,
  inviter       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  inviter_name  text,
  created_at    timestamptz not null default now(),
  accepted_by   uuid references auth.users (id) on delete set null,
  accepted_at   timestamptz
);
alter table public.invites enable row level security;

create table if not exists public.friendships (
  user_a      uuid not null references auth.users (id) on delete cascade,
  user_b      uuid not null references auth.users (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (user_a, user_b),
  check (user_a < user_b)
);
alter table public.friendships enable row level security;

do $$ begin
  drop policy if exists "own invites" on public.invites;
  drop policy if exists "see own friendships" on public.friendships;
  drop policy if exists "end own friendships" on public.friendships;
  drop policy if exists "friends see profile" on public.profiles;
end $$;
create policy "own invites"         on public.invites     for all    using (auth.uid() = inviter) with check (auth.uid() = inviter);
create policy "see own friendships" on public.friendships for select using (auth.uid() in (user_a, user_b));
create policy "end own friendships" on public.friendships for delete using (auth.uid() in (user_a, user_b));
-- Friends (and only friends) can read each other's birth details, to compare charts
create policy "friends see profile" on public.profiles for select using (
  exists (select 1 from public.friendships f
          where (f.user_a = auth.uid() and f.user_b = profiles.user_id)
             or (f.user_b = auth.uid() and f.user_a = profiles.user_id)));

-- Look up an invite before signing up (shows only the inviter's first name)
create or replace function public.get_invite(p_code text)
returns table (inviter_name text, accepted boolean, is_mine boolean)
language sql security definer set search_path = public as $$
  select i.inviter_name, i.accepted_by is not null, i.inviter = auth.uid()
  from public.invites i where i.code = p_code;
$$;
revoke all on function public.get_invite(text) from public;
grant execute on function public.get_invite(text) to anon, authenticated;

-- Accept an invite: creates the friendship. Single use, can't befriend yourself.
create or replace function public.accept_invite(p_code text)
returns text
language plpgsql security definer set search_path = public as $$
declare inv public.invites; me uuid := auth.uid();
begin
  if me is null then raise exception 'Please sign in first'; end if;
  select * into inv from public.invites where code = p_code for update;
  if not found then raise exception 'This invite link is not valid'; end if;
  if inv.inviter = me then raise exception 'This is your own invite link'; end if;
  if inv.accepted_by is not null and inv.accepted_by <> me then raise exception 'This invite has already been used'; end if;
  insert into public.friendships (user_a, user_b) values (least(me, inv.inviter), greatest(me, inv.inviter)) on conflict do nothing;
  update public.invites set accepted_by = me, accepted_at = now() where code = p_code;
  return inv.inviter_name;
end $$;
revoke all on function public.accept_invite(text) from public;
grant execute on function public.accept_invite(text) to authenticated;

-- ─────────────────────────────────────────────────────────────
-- 6. Messages to the Pause team (read them in Table Editor → feedback)
create table if not exists public.feedback (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  user_id     uuid default auth.uid() references auth.users (id) on delete set null,
  email       text,
  kind        text,
  message     text not null check (char_length(message) between 3 and 5000),
  page        text,
  user_agent  text
);
alter table public.feedback enable row level security;
drop policy if exists "anyone can send feedback" on public.feedback;
-- Anyone can send a message; nobody can read them through the app (only you, in the dashboard)
create policy "anyone can send feedback" on public.feedback for insert to anon, authenticated with check (true);
