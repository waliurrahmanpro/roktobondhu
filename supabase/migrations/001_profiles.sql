-- Blood Bridge BD: profiles table
-- Run once in Supabase Dashboard → SQL Editor (see supabase/README.md)

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  full_name text not null,
  blood_group text not null check (
    blood_group in ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')
  ),
  division text not null,
  district text not null,
  upazila text not null,
  phone text not null,
  last_donation_date date,
  donation_availability boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_user_id_unique unique (user_id)
);

create index if not exists profiles_user_id_idx on public.profiles (user_id);
create index if not exists profiles_blood_group_idx on public.profiles (blood_group);
create index if not exists profiles_district_idx on public.profiles (district);

alter table public.profiles enable row level security;

drop policy if exists "Profiles are viewable by everyone" on public.profiles;
create policy "Profiles are viewable by everyone"
  on public.profiles
  for select
  using (true);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles
  for update
  using (auth.uid() = user_id);

create or replace function public.set_profiles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row
  execute function public.set_profiles_updated_at();

-- Auto-create profile when a user signs up (uses metadata from signUp)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  availability boolean;
begin
  availability := coalesce(
    (new.raw_user_meta_data->>'donation_availability')::boolean,
    true
  );

  insert into public.profiles (
    user_id,
    full_name,
    blood_group,
    division,
    district,
    upazila,
    phone,
    last_donation_date,
    donation_availability
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'New Donor'),
    coalesce(new.raw_user_meta_data->>'blood_group', 'O+'),
    coalesce(new.raw_user_meta_data->>'division', ''),
    coalesce(new.raw_user_meta_data->>'district', ''),
    coalesce(new.raw_user_meta_data->>'upazila', ''),
    coalesce(
      new.raw_user_meta_data->>'phone',
      new.raw_user_meta_data->>'phone_number',
      ''
    ),
    nullif(new.raw_user_meta_data->>'last_donation_date', '')::date,
    availability
  )
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
