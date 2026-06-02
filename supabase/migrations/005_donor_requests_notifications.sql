-- Phase 2: donor-to-donor blood requests + notifications

create table if not exists public.donor_requests (
  id uuid primary key default gen_random_uuid(),
  donor_id uuid not null references auth.users (id) on delete cascade,
  receiver_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'pending' check (
    status in ('pending', 'accepted', 'rejected')
  ),
  created_at timestamptz not null default now(),
  constraint donor_requests_not_self check (donor_id <> receiver_id)
);

create unique index if not exists donor_requests_one_pending_per_pair
  on public.donor_requests (donor_id, receiver_id)
  where (status = 'pending');

create index if not exists donor_requests_donor_id_idx
  on public.donor_requests (donor_id);

create index if not exists donor_requests_receiver_id_idx
  on public.donor_requests (receiver_id);

create index if not exists donor_requests_status_idx
  on public.donor_requests (status);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  donor_request_id uuid references public.donor_requests (id) on delete cascade,
  title text not null,
  message text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_id_idx
  on public.notifications (user_id);

create index if not exists notifications_created_at_idx
  on public.notifications (created_at desc);

create index if not exists notifications_unread_idx
  on public.notifications (user_id)
  where (read_at is null);

-- ---------------------------------------------------------------------------
-- RLS: donor_requests
-- ---------------------------------------------------------------------------

alter table public.donor_requests enable row level security;

drop policy if exists "Users can view own donor requests" on public.donor_requests;
create policy "Users can view own donor requests"
  on public.donor_requests
  for select
  to authenticated
  using (auth.uid() = donor_id or auth.uid() = receiver_id);

drop policy if exists "Receivers can create donor requests" on public.donor_requests;
create policy "Receivers can create donor requests"
  on public.donor_requests
  for insert
  to authenticated
  with check (
    auth.uid() = receiver_id
    and auth.uid() <> donor_id
    and status = 'pending'
  );

drop policy if exists "Donors can update request status" on public.donor_requests;
create policy "Donors can update request status"
  on public.donor_requests
  for update
  to authenticated
  using (auth.uid() = donor_id)
  with check (
    auth.uid() = donor_id
    and status in ('accepted', 'rejected')
  );

-- ---------------------------------------------------------------------------
-- RLS: notifications
-- ---------------------------------------------------------------------------

alter table public.notifications enable row level security;

drop policy if exists "Users can view own notifications" on public.notifications;
create policy "Users can view own notifications"
  on public.notifications
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can update own notifications" on public.notifications;
create policy "Users can update own notifications"
  on public.notifications
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Inserts only via security definer triggers below

-- ---------------------------------------------------------------------------
-- Triggers: notifications on request lifecycle
-- ---------------------------------------------------------------------------

create or replace function public.notify_on_donor_request_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  receiver_name text;
begin
  select full_name
  into receiver_name
  from public.profiles
  where user_id = new.receiver_id;

  insert into public.notifications (user_id, donor_request_id, title, message)
  values (
    new.donor_id,
    new.id,
    'New request received',
    coalesce(receiver_name, 'Someone')
      || ' requested your blood. Open Incoming requests to accept or reject.'
  );

  return new;
end;
$$;

drop trigger if exists donor_request_insert_notify on public.donor_requests;
create trigger donor_request_insert_notify
  after insert on public.donor_requests
  for each row
  execute function public.notify_on_donor_request_insert();

create or replace function public.notify_on_donor_request_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  donor_name text;
begin
  if old.status is distinct from new.status and old.status = 'pending' then
    select full_name
    into donor_name
    from public.profiles
    where user_id = new.donor_id;

    if new.status = 'accepted' then
      insert into public.notifications (user_id, donor_request_id, title, message)
      values (
        new.receiver_id,
        new.id,
        'Request accepted',
        coalesce(donor_name, 'The donor')
          || ' accepted your blood request. You can contact them now.'
      );
    elsif new.status = 'rejected' then
      insert into public.notifications (user_id, donor_request_id, title, message)
      values (
        new.receiver_id,
        new.id,
        'Request rejected',
        coalesce(donor_name, 'The donor')
          || ' rejected your blood request.'
      );
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists donor_request_status_notify on public.donor_requests;
create trigger donor_request_status_notify
  after update of status on public.donor_requests
  for each row
  execute function public.notify_on_donor_request_status_change();
