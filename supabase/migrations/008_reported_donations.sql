-- Phase 4: reported donation count on profiles (for trust / leaderboard)

alter table public.profiles
  add column if not exists reported_donations integer not null default 0;

alter table public.profiles
  drop constraint if exists profiles_reported_donations_non_negative;

alter table public.profiles
  add constraint profiles_reported_donations_non_negative
  check (reported_donations >= 0);

-- Backfill from existing donations
update public.profiles p
set reported_donations = coalesce(
  (
    select count(*)::integer
    from public.donations d
    where d.donor_id = p.user_id
      and d.feedback_status = 'reported'
  ),
  0
);

create or replace function public.increment_reported_donations()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.feedback_status = 'reported' then
    update public.profiles
    set reported_donations = reported_donations + 1
    where user_id = new.donor_id;
  end if;
  return new;
end;
$$;

drop trigger if exists donations_increment_reported on public.donations;
create trigger donations_increment_reported
  after insert on public.donations
  for each row
  execute function public.increment_reported_donations();
