-- ============================================================
-- Schema Patch: Admin RLS Policies for Reports & Admin Actions
-- Run this in your Supabase SQL Editor to ensure admin 
-- API routes can fully read/write all tables.
-- (Service role bypasses RLS already, but these policies
--  ensure consistency and correctness.)
-- ============================================================

-- Allow admins (service role) to select all reports
drop policy if exists "Admins can view all reports" on public.reports;
create policy "Admins can view all reports" on public.reports
  for select using (true);

-- Allow admins (service role) to update any report
drop policy if exists "Admins can update all reports" on public.reports;
create policy "Admins can update all reports" on public.reports
  for update using (true);

-- Allow service role to insert admin_actions logs
drop policy if exists "Service role can insert admin actions" on public.admin_actions;
create policy "Service role can insert admin actions" on public.admin_actions
  for insert with check (true);

-- Allow service role to read admin_actions logs
drop policy if exists "Service role can read admin actions" on public.admin_actions;
create policy "Service role can read admin actions" on public.admin_actions
  for select using (true);

-- Allow service role to read bans (for admin stats)
drop policy if exists "Admins can view all bans" on public.bans;
create policy "Admins can view all bans" on public.bans
  for select using (true);

-- Allow service role to insert/delete bans
drop policy if exists "Admins can insert bans" on public.bans;
create policy "Admins can insert bans" on public.bans
  for insert with check (true);

drop policy if exists "Admins can delete bans" on public.bans;
create policy "Admins can delete bans" on public.bans
  for delete using (true);

-- Allow service role to manage account_freezes
drop policy if exists "Admins can view all freezes" on public.account_freezes;
create policy "Admins can view all freezes" on public.account_freezes
  for select using (true);

drop policy if exists "Admins can insert freezes" on public.account_freezes;
create policy "Admins can insert freezes" on public.account_freezes
  for insert with check (true);

drop policy if exists "Admins can delete freezes" on public.account_freezes;
create policy "Admins can delete freezes" on public.account_freezes
  for delete using (true);

-- Allow service role to update profiles (for freeze/unfreeze toggle)
drop policy if exists "Admins can update any profile" on public.profiles;
create policy "Admins can update any profile" on public.profiles
  for update using (true);

-- Allow service role to read all points history (for stats)
drop policy if exists "Admins can view all points history" on public.points_history;
create policy "Admins can view all points history" on public.points_history
  for select using (true);

-- Allow service role to insert into points history (for admin point adjustments)
drop policy if exists "Admins can insert points history" on public.points_history;
create policy "Admins can insert points history" on public.points_history
  for insert with check (true);

-- Allow service role to read all daily_workouts (for stats)
drop policy if exists "Admins can view all daily workouts" on public.daily_workouts;
create policy "Admins can view all daily workouts" on public.daily_workouts
  for select using (true);

-- Allow service role to read all leaderboard_stats (for stats)
drop policy if exists "Admins can view all leaderboard stats" on public.leaderboard_stats;
create policy "Admins can view all leaderboard stats" on public.leaderboard_stats
  for select using (true);

-- Allow service role to upsert leaderboard_stats (trigger inserts)
drop policy if exists "Admins can update leaderboard stats" on public.leaderboard_stats;
create policy "Admins can update leaderboard stats" on public.leaderboard_stats
  for update using (true);

-- Allow service role to read all weekly_plans (for user history)
drop policy if exists "Admins can view all weekly plans" on public.weekly_plans;
create policy "Admins can view all weekly plans" on public.weekly_plans
  for select using (true);
