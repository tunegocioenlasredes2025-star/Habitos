-- ============================================================
--  Momentum — Supabase schema
--  Run this in the Supabase SQL editor (Database → SQL → New query).
--  Safe to re-run: uses IF NOT EXISTS / CREATE OR REPLACE.
-- ============================================================

create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- profiles  (1:1 with auth.users)
-- ------------------------------------------------------------
create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  email        text,
  display_name text not null default 'Usuario',
  points       integer not null default 0,
  created_at   timestamptz not null default now()
);

-- ------------------------------------------------------------
-- habits
-- ------------------------------------------------------------
create table if not exists public.habits (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  name          text not null,
  category      text not null default 'Otro',
  type          text not null default 'boolean'
                  check (type in ('boolean', 'quantity', 'time')),
  frequency     text not null default 'daily'
                  check (frequency in ('daily', 'weekly', 'weekdays', 'custom')),
  days          int[] not null default '{0,1,2,3,4,5,6}',
  color         text not null default '#4f8cff',
  target_daily  numeric not null default 1,
  target_weekly numeric,
  unit          text not null default '',
  archived      boolean not null default false,
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now()
);

-- ------------------------------------------------------------
-- habit_logs  (one per habit per day)
-- ------------------------------------------------------------
create table if not exists public.habit_logs (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  habit_id   uuid not null references public.habits (id) on delete cascade,
  date       date not null,
  value      numeric not null default 0,
  completed  boolean not null default false,
  created_at timestamptz not null default now(),
  unique (habit_id, date)
);

-- ------------------------------------------------------------
-- goals
-- ------------------------------------------------------------
create table if not exists public.goals (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  title         text not null,
  description   text not null default '',
  category      text not null default 'Personal',
  color         text not null default '#6e7ff2',
  start_date    date not null default current_date,
  due_date      date not null default current_date,
  target_value  numeric not null default 1,
  current_value numeric not null default 0,
  unit          text not null default '',
  status        text not null default 'active'
                  check (status in ('active', 'completed', 'archived')),
  created_at    timestamptz not null default now()
);

-- ------------------------------------------------------------
-- calendar_events
-- ------------------------------------------------------------
create table if not exists public.calendar_events (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  title      text not null,
  date       date not null,
  start_min  integer not null default 540,
  end_min    integer not null default 600,
  color      text not null default '#4f8cff',
  category   text not null default 'Otro',
  habit_id   uuid references public.habits (id) on delete set null,
  notes      text not null default '',
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- journal_entries
-- ------------------------------------------------------------
create table if not exists public.journal_entries (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  date       date not null,
  title      text not null default '',
  content    text not null default '',
  mood       integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Indexes
-- ------------------------------------------------------------
create index if not exists habits_user_idx          on public.habits (user_id);
create index if not exists habit_logs_user_idx       on public.habit_logs (user_id);
create index if not exists habit_logs_habit_date_idx on public.habit_logs (habit_id, date);
create index if not exists goals_user_idx            on public.goals (user_id);
create index if not exists events_user_date_idx      on public.calendar_events (user_id, date);
create index if not exists journal_user_date_idx     on public.journal_entries (user_id, date);

-- ============================================================
--  Row Level Security — every user only sees their own rows
-- ============================================================
alter table public.profiles        enable row level security;
alter table public.habits          enable row level security;
alter table public.habit_logs      enable row level security;
alter table public.goals           enable row level security;
alter table public.calendar_events enable row level security;
alter table public.journal_entries enable row level security;

-- profiles: keyed by id
drop policy if exists "profiles self" on public.profiles;
create policy "profiles self" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

-- helper: identical owner policy for every user_id table
do $$
declare t text;
begin
  foreach t in array array[
    'habits', 'habit_logs', 'goals', 'calendar_events', 'journal_entries'
  ]
  loop
    execute format('drop policy if exists "owner all" on public.%I;', t);
    execute format(
      'create policy "owner all" on public.%I for all
         using (auth.uid() = user_id) with check (auth.uid() = user_id);', t);
  end loop;
end $$;

-- ============================================================
--  Auto-create a profile row when a user signs up
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', new.email, 'Usuario')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
