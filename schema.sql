-- =============================================================
-- Lock-In Database Schema (v2 - Complete & Idempotent)
-- Run this in your Supabase SQL Editor
-- =============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- =============================================================
-- 1. PROFILES TABLE
-- =============================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  username text unique not null,
  email text not null,
  is_admin boolean default false,
  is_frozen boolean default false,
  height numeric,
  weight numeric,
  age integer,
  gender text,
  fitness_goal text,
  experience_level text,
  available_equipment text[],
  workout_days text[],
  injuries text,
  preferred_style text,
  available_time integer,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- =============================================================
-- 2. WEEKLY PLANS TABLE
-- =============================================================
create table if not exists public.weekly_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  day_of_week text not null,
  workout_name text not null,
  is_rest_day boolean default false,
  exercises jsonb default '[]'::jsonb,
  updated_at timestamp with time zone default now(),
  constraint unique_user_day unique (user_id, day_of_week)
);

-- =============================================================
-- 3. DAILY WORKOUTS TABLE
-- =============================================================
create table if not exists public.daily_workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  date date not null default current_date,
  status text not null,
  completion_percentage numeric not null check (completion_percentage >= 0 and completion_percentage <= 100),
  points_earned integer default 0,
  exercises_logged jsonb default '[]'::jsonb,
  created_at timestamp with time zone default now(),
  constraint unique_user_date unique (user_id, date)
);

-- =============================================================
-- 4. POINTS HISTORY TABLE
-- =============================================================
create table if not exists public.points_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  date date not null default current_date,
  points integer not null,
  description text not null,
  category text not null,
  created_at timestamp with time zone default now()
);

-- =============================================================
-- 5. LEADERBOARD STATS TABLE
-- =============================================================
create table if not exists public.leaderboard_stats (
  user_id uuid primary key references auth.users(id) on delete cascade,
  points integer default 0,
  streak integer default 0,
  completed_count integer default 0,
  missed_count integer default 0,
  last_active timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- =============================================================
-- 6. BANS TABLE
-- =============================================================
create table if not exists public.bans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  reason text not null,
  banned_until timestamp with time zone,
  created_at timestamp with time zone default now()
);

-- =============================================================
-- 7. ACCOUNT FREEZES TABLE
-- =============================================================
create table if not exists public.account_freezes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  reason text not null,
  created_at timestamp with time zone default now()
);

-- =============================================================
-- 8. ADMIN ACTIONS TABLE
-- =============================================================
create table if not exists public.admin_actions (
  id uuid primary key default gen_random_uuid(),
  admin_username text not null,
  action_type text not null,
  target_user_id uuid not null,
  details text not null,
  created_at timestamp with time zone default now()
);

-- =============================================================
-- ROW LEVEL SECURITY
-- =============================================================
alter table public.profiles enable row level security;
alter table public.weekly_plans enable row level security;
alter table public.daily_workouts enable row level security;
alter table public.points_history enable row level security;
alter table public.leaderboard_stats enable row level security;
alter table public.bans enable row level security;
alter table public.account_freezes enable row level security;
alter table public.admin_actions enable row level security;

-- Drop existing policies to avoid conflicts before re-creating
drop policy if exists "Public profiles are viewable by everyone" on public.profiles;
drop policy if exists "Users can insert their own profile" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;

drop policy if exists "Users can view their own weekly plans" on public.weekly_plans;
drop policy if exists "Users can insert their own weekly plans" on public.weekly_plans;
drop policy if exists "Users can update their own weekly plans" on public.weekly_plans;
drop policy if exists "Users can delete their own weekly plans" on public.weekly_plans;

drop policy if exists "Users can view their own daily workouts" on public.daily_workouts;
drop policy if exists "Users can insert their own daily workouts" on public.daily_workouts;
drop policy if exists "Users can update their own daily workouts" on public.daily_workouts;

drop policy if exists "Users can view their own points history" on public.points_history;
drop policy if exists "Users can insert their own points history" on public.points_history;

drop policy if exists "Leaderboard stats are viewable by everyone" on public.leaderboard_stats;
drop policy if exists "Users can upsert their own leaderboard stats" on public.leaderboard_stats;

drop policy if exists "Users can view their own bans" on public.bans;
drop policy if exists "Users can view their own freezes" on public.account_freezes;

-- PROFILES POLICIES
create policy "Public profiles are viewable by everyone" on public.profiles
  for select using (true);

-- Allows the client to create a profile row if the trigger didn't run
create policy "Users can insert their own profile" on public.profiles
  for insert with check (auth.uid() = id);

create policy "Users can update their own profile" on public.profiles
  for update using (auth.uid() = id);

-- WEEKLY PLANS POLICIES
create policy "Users can view their own weekly plans" on public.weekly_plans
  for select using (auth.uid() = user_id);

create policy "Users can insert their own weekly plans" on public.weekly_plans
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own weekly plans" on public.weekly_plans
  for update using (auth.uid() = user_id);

create policy "Users can delete their own weekly plans" on public.weekly_plans
  for delete using (auth.uid() = user_id);

-- DAILY WORKOUTS POLICIES
create policy "Users can view their own daily workouts" on public.daily_workouts
  for select using (auth.uid() = user_id);

create policy "Users can insert their own daily workouts" on public.daily_workouts
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own daily workouts" on public.daily_workouts
  for update using (auth.uid() = user_id);

-- POINTS HISTORY POLICIES
create policy "Users can view their own points history" on public.points_history
  for select using (auth.uid() = user_id);

create policy "Users can insert their own points history" on public.points_history
  for insert with check (auth.uid() = user_id);

-- LEADERBOARD STATS POLICIES
create policy "Leaderboard stats are viewable by everyone" on public.leaderboard_stats
  for select using (true);

create policy "Users can upsert their own leaderboard stats" on public.leaderboard_stats
  for insert with check (auth.uid() = user_id);

-- BANS & FREEZES POLICIES
create policy "Users can view their own bans" on public.bans
  for select using (auth.uid() = user_id);

create policy "Users can view their own freezes" on public.account_freezes
  for select using (auth.uid() = user_id);

-- =============================================================
-- TRIGGER: Auto-create profile on new auth user
-- =============================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, email, is_admin)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    new.email,
    false
  )
  on conflict (id) do nothing; -- Idempotent: skip if profile already exists

  insert into public.leaderboard_stats (user_id, points, streak, completed_count, missed_count)
  values (new.id, 0, 0, 0, 0)
  on conflict (user_id) do nothing;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =============================================================
-- TRIGGER: Sync leaderboard_stats from points_history + daily_workouts
-- =============================================================
create or replace function public.update_leaderboard_points()
returns trigger as $$
declare
  total_pts integer;
  comp_count integer;
  miss_count integer;
begin
  select coalesce(sum(points), 0) into total_pts
  from public.points_history
  where user_id = coalesce(new.user_id, old.user_id);

  if total_pts < 0 then total_pts := 0; end if;

  select count(*) into comp_count
  from public.daily_workouts
  where user_id = coalesce(new.user_id, old.user_id) and status in ('completed', 'partial');

  select count(*) into miss_count
  from public.daily_workouts
  where user_id = coalesce(new.user_id, old.user_id) and status = 'missed';

  update public.leaderboard_stats
  set points = total_pts,
      completed_count = comp_count,
      missed_count = miss_count,
      updated_at = now()
  where user_id = coalesce(new.user_id, old.user_id);

  return coalesce(new, old);
end;
$$ language plpgsql security definer;

drop trigger if exists on_points_history_change on public.points_history;
create trigger on_points_history_change
  after insert or update or delete on public.points_history
  for each row execute procedure public.update_leaderboard_points();

drop trigger if exists on_daily_workouts_change on public.daily_workouts;
create trigger on_daily_workouts_change
  after insert or update or delete on public.daily_workouts
  for each row execute procedure public.update_leaderboard_points();

-- =============================================================
-- 9. REPORTS & APPEALS TABLE
-- =============================================================
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  type text not null, -- 'point_recovery', 'ban_appeal', 'freeze_request', 'bug_report'
  title text not null,
  description text not null,
  status text default 'pending', -- 'pending', 'resolved', 'rejected'
  admin_notes text default '',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.reports enable row level security;

create policy "Users can view their own reports" on public.reports
  for select using (auth.uid() = user_id);

create policy "Users can insert their own reports" on public.reports
  for insert with check (auth.uid() = user_id);
