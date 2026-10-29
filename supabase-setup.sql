-- Run this once in Supabase → SQL Editor → New query → Run.
-- It creates the journal table and locks it so each person
-- can only ever see, add or delete their OWN entries.

create table if not exists public.entries (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at  timestamptz not null default now(),
  entry_date  date not null default current_date,
  prompt      text,
  theme       text,
  body        text not null
);

create index if not exists entries_user_date_idx on public.entries (user_id, entry_date desc);

alter table public.entries enable row level security;

create policy "read own entries"   on public.entries for select using (auth.uid() = user_id);
create policy "add own entries"    on public.entries for insert with check (auth.uid() = user_id);
create policy "edit own entries"   on public.entries for update using (auth.uid() = user_id);
create policy "delete own entries" on public.entries for delete using (auth.uid() = user_id);
