-- Phase: structured Bangladesh locations + full address
-- UI dataset: lib/data/bangladesh-locations.json (8 divisions, 64 districts, 494 upazilas)
-- Regenerate: node scripts/generate-bangladesh-locations.mjs

alter table public.profiles
  add column if not exists full_address text;

comment on column public.profiles.full_address is
  'Optional street/area details; division/district/upazila remain structured fields.';

-- Reference tables (optional sync with app dataset; used for reporting / future APIs)
create table if not exists public.bd_divisions (
  name text primary key
);

create table if not exists public.bd_districts (
  name text primary key,
  division_name text not null references public.bd_divisions (name) on delete cascade
);

create table if not exists public.bd_upazilas (
  name text not null,
  district_name text not null references public.bd_districts (name) on delete cascade,
  primary key (name, district_name)
);

alter table public.bd_divisions enable row level security;
alter table public.bd_districts enable row level security;
alter table public.bd_upazilas enable row level security;

drop policy if exists "BD divisions are public" on public.bd_divisions;
create policy "BD divisions are public"
  on public.bd_divisions for select using (true);

drop policy if exists "BD districts are public" on public.bd_districts;
create policy "BD districts are public"
  on public.bd_districts for select using (true);

drop policy if exists "BD upazilas are public" on public.bd_upazilas;
create policy "BD upazilas are public"
  on public.bd_upazilas for select using (true);

-- Seed is applied via app JSON; super admins can run scripts/seed-bd-locations.sql if needed.
-- Existing profile division/district/upazila text values remain valid (legacy free-text supported in UI).
