-- Phase 1: total_points column (display only; no points logic yet)
-- Run in Supabase Dashboard → SQL Editor

alter table public.profiles
  add column if not exists total_points integer not null default 0;

alter table public.profiles
  drop constraint if exists profiles_total_points_non_negative;

alter table public.profiles
  add constraint profiles_total_points_non_negative
  check (total_points >= 0);

create index if not exists profiles_total_points_idx
  on public.profiles (total_points desc);
