-- Blood requests table
-- Run in Supabase Dashboard → SQL Editor (after 001_profiles.sql)

create table if not exists public.blood_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  patient_name text not null,
  blood_group text not null check (
    blood_group in ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')
  ),
  hospital_name text not null,
  district text not null,
  contact_number text not null,
  urgency_level text not null check (
    urgency_level in ('critical', 'high', 'medium', 'low')
  ),
  request_date date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists blood_requests_request_date_idx
  on public.blood_requests (request_date desc);

create index if not exists blood_requests_urgency_idx
  on public.blood_requests (urgency_level);

create index if not exists blood_requests_district_idx
  on public.blood_requests (district);

create index if not exists blood_requests_user_id_idx
  on public.blood_requests (user_id);

alter table public.blood_requests enable row level security;

drop policy if exists "Blood requests are viewable by everyone" on public.blood_requests;
create policy "Blood requests are viewable by everyone"
  on public.blood_requests
  for select
  using (true);

drop policy if exists "Authenticated users can create blood requests" on public.blood_requests;
create policy "Authenticated users can create blood requests"
  on public.blood_requests
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own blood requests" on public.blood_requests;
create policy "Users can update own blood requests"
  on public.blood_requests
  for update
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can delete own blood requests" on public.blood_requests;
create policy "Users can delete own blood requests"
  on public.blood_requests
  for delete
  to authenticated
  using (auth.uid() = user_id);

create or replace function public.set_blood_requests_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists blood_requests_updated_at on public.blood_requests;
create trigger blood_requests_updated_at
  before update on public.blood_requests
  for each row
  execute function public.set_blood_requests_updated_at();
