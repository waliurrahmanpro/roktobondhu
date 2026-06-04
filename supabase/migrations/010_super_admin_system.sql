-- Phase 6: roles, super admin, settings, announcements, points, audit

-- ---------------------------------------------------------------------------
-- profiles.role (replaces admin_users)
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists role text not null default 'user';

alter table public.profiles
  drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('user', 'admin', 'super_admin'));

create index if not exists profiles_role_idx on public.profiles (role);

-- Migrate legacy admin_users → admin role
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'admin_users'
  ) then
    update public.profiles p
    set role = 'admin'
    where exists (
      select 1 from public.admin_users a where a.user_id = p.user_id
    )
    and p.role = 'user';

    drop table if exists public.admin_users cascade;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Role helpers
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
    from public.profiles
    where user_id = auth.uid()
      and role in ('admin', 'super_admin')
  );
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where user_id = auth.uid()
      and role = 'super_admin'
  );
$$;

revoke all on function public.is_admin () from public;
grant execute on function public.is_admin () to authenticated;
revoke all on function public.is_super_admin () from public;
grant execute on function public.is_super_admin () to authenticated;

-- ---------------------------------------------------------------------------
-- site_settings (singleton)
-- ---------------------------------------------------------------------------
create table if not exists public.site_settings (
  id integer primary key default 1 check (id = 1),
  registration_enabled boolean not null default true,
  blood_request_enabled boolean not null default true,
  maintenance_mode boolean not null default false,
  updated_at timestamptz not null default now()
);

insert into public.site_settings (id)
values (1)
on conflict (id) do nothing;

alter table public.site_settings enable row level security;

drop policy if exists "Anyone can read site settings" on public.site_settings;
create policy "Anyone can read site settings"
  on public.site_settings
  for select
  using (true);

drop policy if exists "Super admins can update site settings" on public.site_settings;
create policy "Super admins can update site settings"
  on public.site_settings
  for update
  to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

-- ---------------------------------------------------------------------------
-- announcements
-- ---------------------------------------------------------------------------
create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  is_active boolean not null default true,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists announcements_active_idx
  on public.announcements (is_active, created_at desc);

alter table public.announcements enable row level security;

drop policy if exists "Anyone can read active announcements" on public.announcements;
create policy "Anyone can read active announcements"
  on public.announcements
  for select
  using (is_active = true or public.is_super_admin());

drop policy if exists "Super admins manage announcements" on public.announcements;
create policy "Super admins manage announcements"
  on public.announcements
  for all
  to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

-- ---------------------------------------------------------------------------
-- point_transactions
-- ---------------------------------------------------------------------------
create table if not exists public.point_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  delta integer not null,
  reason text not null,
  balance_after integer not null,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists point_transactions_user_id_idx
  on public.point_transactions (user_id, created_at desc);

alter table public.point_transactions enable row level security;

drop policy if exists "Users can view own point history" on public.point_transactions;
create policy "Users can view own point history"
  on public.point_transactions
  for select
  to authenticated
  using (auth.uid() = user_id or public.is_super_admin());

drop policy if exists "Super admins insert point transactions" on public.point_transactions;
create policy "Super admins insert point transactions"
  on public.point_transactions
  for insert
  to authenticated
  with check (public.is_super_admin());

-- ---------------------------------------------------------------------------
-- audit_logs
-- ---------------------------------------------------------------------------
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users (id) on delete set null,
  action text not null,
  target_type text,
  target_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_logs_created_at_idx
  on public.audit_logs (created_at desc);

alter table public.audit_logs enable row level security;

drop policy if exists "Super admins can view audit logs" on public.audit_logs;
create policy "Super admins can view audit logs"
  on public.audit_logs
  for select
  to authenticated
  using (public.is_super_admin());

-- ---------------------------------------------------------------------------
-- Super admins can update roles on profiles
-- ---------------------------------------------------------------------------
drop policy if exists "Super admins can update roles" on public.profiles;
create policy "Super admins can update roles"
  on public.profiles
  for update
  to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

-- ---------------------------------------------------------------------------
-- Audit log helper
-- ---------------------------------------------------------------------------
create or replace function public.insert_audit_log(
  p_action text,
  p_target_type text default null,
  p_target_id text default null,
  p_details jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Forbidden';
  end if;

  insert into public.audit_logs (actor_id, action, target_type, target_id, details)
  values (auth.uid(), p_action, p_target_type, p_target_id, coalesce(p_details, '{}'::jsonb));
end;
$$;

grant execute on function public.insert_audit_log (text, text, text, jsonb) to authenticated;

-- ---------------------------------------------------------------------------
-- Set user role (super admin only)
-- ---------------------------------------------------------------------------
create or replace function public.set_user_role(
  p_user_id uuid,
  p_new_role text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_role text;
begin
  if not public.is_super_admin() then
    raise exception 'Only super admins can change roles';
  end if;

  if p_new_role not in ('user', 'admin', 'super_admin') then
    raise exception 'Invalid role';
  end if;

  select role into v_actor_role from public.profiles where user_id = auth.uid();

  if p_user_id = auth.uid() and p_new_role <> 'super_admin' and v_actor_role = 'super_admin' then
    raise exception 'You cannot demote yourself';
  end if;

  update public.profiles
  set role = p_new_role
  where user_id = p_user_id;

  if not found then
    raise exception 'User not found';
  end if;

  perform public.insert_audit_log(
    'role_change',
    'profile',
    p_user_id::text,
    jsonb_build_object('new_role', p_new_role),
    'moderation'
  );
end;
$$;

grant execute on function public.set_user_role (uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Adjust points (super admin only)
-- ---------------------------------------------------------------------------
create or replace function public.adjust_user_points(
  p_user_id uuid,
  p_delta integer,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_new_balance integer;
begin
  if not public.is_super_admin() then
    raise exception 'Only super admins can adjust points';
  end if;

  if p_reason is null or trim(p_reason) = '' then
    raise exception 'Reason is required';
  end if;

  update public.profiles
  set total_points = greatest(0, total_points + p_delta)
  where user_id = p_user_id
  returning total_points into v_new_balance;

  if not found then
    raise exception 'User not found';
  end if;

  insert into public.point_transactions (
    user_id, delta, reason, balance_after, created_by
  )
  values (
    p_user_id, p_delta, trim(p_reason), v_new_balance, auth.uid()
  );

  perform public.insert_audit_log(
    'points_adjustment',
    'profile',
    p_user_id::text,
    jsonb_build_object('delta', p_delta, 'reason', p_reason, 'balance_after', v_new_balance),
    'points'
  );
end;
$$;

grant execute on function public.adjust_user_points (uuid, integer, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Emergency broadcast
-- ---------------------------------------------------------------------------
create or replace function public.broadcast_notification(
  p_title text,
  p_message text
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  if not public.is_super_admin() then
    raise exception 'Only super admins can broadcast';
  end if;

  if trim(coalesce(p_title, '')) = '' or trim(coalesce(p_message, '')) = '' then
    raise exception 'Title and message are required';
  end if;

  insert into public.notifications (user_id, donor_request_id, title, message)
  select user_id, null, trim(p_title), trim(p_message)
  from public.profiles
  where not is_banned;

  get diagnostics v_count = row_count;

  perform public.insert_audit_log(
    'emergency_broadcast',
    'notification',
    null,
    jsonb_build_object('title', p_title, 'message', p_message, 'recipient_count', v_count),
    'moderation'
  );

  return v_count;
end;
$$;

grant execute on function public.broadcast_notification (text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Announcement + optional notify all
-- ---------------------------------------------------------------------------
create or replace function public.create_announcement(
  p_title text,
  p_body text,
  p_notify_all boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if not public.is_super_admin() then
    raise exception 'Only super admins can create announcements';
  end if;

  insert into public.announcements (title, body, is_active, created_by)
  values (trim(p_title), trim(p_body), true, auth.uid())
  returning id into v_id;

  perform public.insert_audit_log(
    'announcement_created',
    'announcement',
    v_id::text,
    jsonb_build_object('title', p_title, 'notify_all', p_notify_all),
    'moderation'
  );

  if p_notify_all then
    insert into public.notifications (user_id, donor_request_id, title, message)
    select user_id, null, trim(p_title), trim(p_body)
    from public.profiles
    where not is_banned;
  end if;

  return v_id;
end;
$$;

grant execute on function public.create_announcement (text, text, boolean) to authenticated;

-- ---------------------------------------------------------------------------
-- Update site settings (super admin)
-- ---------------------------------------------------------------------------
create or replace function public.update_site_settings(
  p_registration_enabled boolean,
  p_blood_request_enabled boolean,
  p_maintenance_mode boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_super_admin() then
    raise exception 'Only super admins can update settings';
  end if;

  update public.site_settings
  set
    registration_enabled = p_registration_enabled,
    blood_request_enabled = p_blood_request_enabled,
    maintenance_mode = p_maintenance_mode,
    updated_at = now()
  where id = 1;

  perform public.insert_audit_log(
    'settings_updated',
    'site_settings',
    '1',
    jsonb_build_object(
      'registration_enabled', p_registration_enabled,
      'blood_request_enabled', p_blood_request_enabled,
      'maintenance_mode', p_maintenance_mode
    ),
    'moderation'
  );
end;
$$;

grant execute on function public.update_site_settings (boolean, boolean, boolean) to authenticated;

-- Bootstrap first super admin:
-- update public.profiles set role = 'super_admin' where user_id = 'your-user-uuid';
