-- Phase 3: donation completion, feedback, and points
-- (Filename requested as 006_donation_completion_points.sql — use this file if 006 is already taken)

-- profiles: total_donations (total_points added in 004)
alter table public.profiles
  add column if not exists total_donations integer not null default 0;

alter table public.profiles
  drop constraint if exists profiles_total_donations_non_negative;

alter table public.profiles
  add constraint profiles_total_donations_non_negative
  check (total_donations >= 0);

-- donor_requests: allow completed + reported statuses
alter table public.donor_requests
  drop constraint if exists donor_requests_status_check;

alter table public.donor_requests
  add constraint donor_requests_status_check
  check (
    status in ('pending', 'accepted', 'rejected', 'completed', 'reported')
  );

-- donations: one completion record per donor request
create table if not exists public.donations (
  id uuid primary key default gen_random_uuid(),
  donor_request_id uuid not null unique references public.donor_requests (id) on delete cascade,
  donor_id uuid not null references auth.users (id) on delete cascade,
  receiver_id uuid not null references auth.users (id) on delete cascade,
  feedback_status text not null check (feedback_status in ('fine', 'reported')),
  feedback_message text,
  completed_at timestamptz not null default now()
);

create index if not exists donations_donor_id_idx on public.donations (donor_id);
create index if not exists donations_receiver_id_idx on public.donations (receiver_id);
create index if not exists donations_feedback_status_idx on public.donations (feedback_status);

alter table public.donations enable row level security;

drop policy if exists "Users can view related donations" on public.donations;
create policy "Users can view related donations"
  on public.donations
  for select
  to authenticated
  using (auth.uid() = donor_id or auth.uid() = receiver_id);

-- Inserts/updates via complete_donation() only (security definer)

create or replace function public.complete_donation(
  p_request_id uuid,
  p_feedback_status text,
  p_feedback_message text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller uuid;
  v_donor_id uuid;
  v_receiver_id uuid;
  v_status text;
  v_message text;
begin
  v_caller := auth.uid();
  if v_caller is null then
    raise exception 'Not authenticated';
  end if;

  if p_feedback_status not in ('fine', 'reported') then
    raise exception 'Invalid feedback option';
  end if;

  select donor_id, receiver_id, status
  into v_donor_id, v_receiver_id, v_status
  from public.donor_requests
  where id = p_request_id
  for update;

  if not found then
    raise exception 'Request not found';
  end if;

  if v_receiver_id <> v_caller then
    raise exception 'Only the requester can confirm donation';
  end if;

  if v_status <> 'accepted' then
    raise exception 'Request must be accepted before confirming donation';
  end if;

  if exists (
    select 1 from public.donations where donor_request_id = p_request_id
  ) then
    raise exception 'Donation already confirmed for this request';
  end if;

  v_message := nullif(trim(coalesce(p_feedback_message, '')), '');

  insert into public.donations (
    donor_request_id,
    donor_id,
    receiver_id,
    feedback_status,
    feedback_message
  )
  values (
    p_request_id,
    v_donor_id,
    v_receiver_id,
    p_feedback_status,
    v_message
  );

  if p_feedback_status = 'fine' then
    update public.donor_requests
    set status = 'completed'
    where id = p_request_id;

    update public.profiles
    set
      total_points = total_points + 10,
      total_donations = total_donations + 1
    where user_id = v_donor_id;

    insert into public.notifications (user_id, donor_request_id, title, message)
    values (
      v_donor_id,
      p_request_id,
      'Donation confirmed',
      'Donation confirmed. You earned 10 points.'
    );
  else
    update public.donor_requests
    set status = 'reported'
    where id = p_request_id;

    insert into public.notifications (user_id, donor_request_id, title, message)
    values (
      v_donor_id,
      p_request_id,
      'Report submitted',
      'A report has been submitted regarding this donation.'
    );
  end if;
end;
$$;

revoke all on function public.complete_donation (uuid, text, text) from public;
grant execute on function public.complete_donation (uuid, text, text) to authenticated;
