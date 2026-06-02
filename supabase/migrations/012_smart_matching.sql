-- Phase 7: smart donor matching + auto alerts

alter table public.blood_requests
  add column if not exists division text;

alter table public.blood_requests
  add column if not exists upazila text;

alter table public.notifications
  add column if not exists blood_request_id uuid references public.blood_requests (id) on delete cascade;

create index if not exists notifications_blood_request_id_idx
  on public.notifications (blood_request_id);

-- ---------------------------------------------------------------------------
-- match_logs
-- ---------------------------------------------------------------------------
create table if not exists public.match_logs (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.blood_requests (id) on delete cascade,
  donor_id uuid not null references auth.users (id) on delete cascade,
  match_score integer not null check (match_score >= 0),
  accepted_at timestamptz,
  donation_completed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint match_logs_request_donor_unique unique (request_id, donor_id)
);

create index if not exists match_logs_request_id_idx
  on public.match_logs (request_id);

create index if not exists match_logs_donor_id_idx
  on public.match_logs (donor_id);

create index if not exists match_logs_created_at_idx
  on public.match_logs (created_at desc);

alter table public.match_logs enable row level security;

drop policy if exists "Users can view related match logs" on public.match_logs;
create policy "Users can view related match logs"
  on public.match_logs
  for select
  to authenticated
  using (
    auth.uid() = donor_id
    or exists (
      select 1
      from public.blood_requests br
      where br.id = request_id
        and br.user_id = auth.uid()
    )
    or public.is_admin()
  );

-- Inserts/updates via process_blood_request_matching() and triggers

-- ---------------------------------------------------------------------------
-- Process matching + notify top donors (security definer)
-- ---------------------------------------------------------------------------
create or replace function public.process_blood_request_matching(p_request_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request public.blood_requests%rowtype;
  v_donor record;
  v_score integer;
  v_count integer := 0;
  v_inserted integer := 0;
begin
  select * into v_request
  from public.blood_requests
  where id = p_request_id
    and status = 'active';

  if not found then
    return 0;
  end if;

  for v_donor in
    select
      user_id,
      blood_group,
      district,
      upazila,
      donation_availability,
      total_points,
      total_donations,
      reported_donations,
      is_banned
    from public.profiles
    where donation_availability = true
      and is_banned = false
      and user_id <> v_request.user_id
  loop
    v_score := 0;

    if v_donor.blood_group = v_request.blood_group then
      v_score := v_score + 100;
    end if;

    if v_donor.district is not null
      and v_request.district is not null
      and lower(trim(v_donor.district)) = lower(trim(v_request.district)) then
      v_score := v_score + 50;
    end if;

    if v_donor.upazila is not null
      and v_request.upazila is not null
      and trim(v_request.upazila) <> ''
      and lower(trim(v_donor.upazila)) = lower(trim(v_request.upazila)) then
      v_score := v_score + 30;
    end if;

    if v_donor.donation_availability then
      v_score := v_score + 20;
    end if;

    if coalesce(v_donor.total_donations, 0) >= 3
      and coalesce(v_donor.reported_donations, 0) = 0 then
      v_score := v_score + 20;
    end if;

    if coalesce(v_donor.total_points, 0) >= 500 then
      v_score := v_score + 10;
    end if;

    if v_score > 0 then
      insert into public.match_logs (request_id, donor_id, match_score)
      values (p_request_id, v_donor.user_id, v_score)
      on conflict (request_id, donor_id) do update
        set match_score = excluded.match_score;

      v_count := v_count + 1;
    end if;
  end loop;

  -- Notify top 10 matched donors
  for v_donor in
    select donor_id, match_score
    from public.match_logs
    where request_id = p_request_id
    order by match_score desc, created_at asc
    limit 10
  loop
    insert into public.notifications (
      user_id,
      blood_request_id,
      title,
      message
    )
    values (
      v_donor.donor_id,
      p_request_id,
      'Urgent blood request nearby',
      'Urgent blood request near you. Blood group: ' || v_request.blood_group || '.'
    );
    v_inserted := v_inserted + 1;
  end loop;

  return v_inserted;
end;
$$;

revoke all on function public.process_blood_request_matching (uuid) from public;
grant execute on function public.process_blood_request_matching (uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Track accepted / completed matches from donor_requests lifecycle
-- ---------------------------------------------------------------------------
create or replace function public.sync_match_log_on_donor_request_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'accepted' and (old.status is distinct from 'accepted') then
    update public.match_logs ml
    set accepted_at = coalesce(ml.accepted_at, now())
    from public.blood_requests br
    where ml.donor_id = new.donor_id
      and br.user_id = new.receiver_id
      and br.status = 'active'
      and ml.request_id = br.id;
  end if;

  if new.status = 'completed' and (old.status is distinct from 'completed') then
    update public.match_logs ml
    set
      accepted_at = coalesce(ml.accepted_at, now()),
      donation_completed_at = coalesce(ml.donation_completed_at, now())
    from public.blood_requests br
    where ml.donor_id = new.donor_id
      and br.user_id = new.receiver_id
      and ml.request_id = br.id;
  end if;

  return new;
end;
$$;

drop trigger if exists donor_requests_sync_match_logs on public.donor_requests;
create trigger donor_requests_sync_match_logs
  after update of status on public.donor_requests
  for each row
  execute function public.sync_match_log_on_donor_request_update();
