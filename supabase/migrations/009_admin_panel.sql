-- Phase 5: admin panel, moderation, bans

-- ---------------------------------------------------------------------------
-- Admin users
-- ---------------------------------------------------------------------------
create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists admin_users_user_id_idx on public.admin_users (user_id);

alter table public.admin_users enable row level security;

drop policy if exists "Users can check own admin status" on public.admin_users;
create policy "Users can check own admin status"
  on public.admin_users
  for select
  to authenticated
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Profiles: ban flag
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists is_banned boolean not null default false;

create index if not exists profiles_is_banned_idx on public.profiles (is_banned);

-- ---------------------------------------------------------------------------
-- Donations: report moderation status
-- ---------------------------------------------------------------------------
alter table public.donations
  add column if not exists report_status text;

alter table public.donations
  drop constraint if exists donations_report_status_check;

alter table public.donations
  add constraint donations_report_status_check
  check (
    report_status is null
    or report_status in ('pending', 'resolved', 'dismissed')
  );

update public.donations
set report_status = 'pending'
where feedback_status = 'reported'
  and report_status is null;

-- ---------------------------------------------------------------------------
-- Blood requests: moderation status
-- ---------------------------------------------------------------------------
alter table public.blood_requests
  add column if not exists status text not null default 'active';

alter table public.blood_requests
  drop constraint if exists blood_requests_status_check;

alter table public.blood_requests
  add constraint blood_requests_status_check
  check (status in ('active', 'completed', 'removed'));

-- ---------------------------------------------------------------------------
-- is_admin() helper
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users
    where user_id = auth.uid()
  );
$$;

revoke all on function public.is_admin () from public;
grant execute on function public.is_admin () to authenticated;

-- ---------------------------------------------------------------------------
-- complete_donation: set report_status on reported donations
-- ---------------------------------------------------------------------------
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
    feedback_message,
    report_status
  )
  values (
    p_request_id,
    v_donor_id,
    v_receiver_id,
    p_feedback_status,
    v_message,
    case when p_feedback_status = 'reported' then 'pending' else null end
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

-- ---------------------------------------------------------------------------
-- RLS: admin access to profiles, donations, blood_requests
-- ---------------------------------------------------------------------------
drop policy if exists "Admins can view all profiles" on public.profiles;
create policy "Admins can view all profiles"
  on public.profiles
  for select
  to authenticated
  using (public.is_admin());

drop policy if exists "Admins can update all profiles" on public.profiles;
create policy "Admins can update all profiles"
  on public.profiles
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins can view all donations" on public.donations;
create policy "Admins can view all donations"
  on public.donations
  for select
  to authenticated
  using (public.is_admin());

drop policy if exists "Admins can update all donations" on public.donations;
create policy "Admins can update all donations"
  on public.donations
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins can view all blood requests" on public.blood_requests;
create policy "Admins can view all blood requests"
  on public.blood_requests
  for select
  to authenticated
  using (public.is_admin());

drop policy if exists "Admins can update all blood requests" on public.blood_requests;
create policy "Admins can update all blood requests"
  on public.blood_requests
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins can delete blood requests" on public.blood_requests;
create policy "Admins can delete blood requests"
  on public.blood_requests
  for delete
  to authenticated
  using (public.is_admin());

-- Bootstrap first admin (replace with your auth user id after registering):
-- insert into public.admin_users (user_id) values ('00000000-0000-0000-0000-000000000000');
