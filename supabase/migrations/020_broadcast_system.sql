-- Emergency Broadcast System
-- Allows super admins to send targeted broadcasts to users

-- broadcasts table
create table if not exists public.broadcasts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  message text not null,
  priority text not null default 'normal' check (priority in ('normal', 'urgent')),
  target_type text not null check (target_type in ('all_users', 'all_donors', 'blood_group', 'division', 'district')),
  target_value text,
  total_recipients integer not null default 0,
  delivered_count integer not null default 0,
  read_count integer not null default 0,
  created_by uuid references auth.users (id) on delete set null,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists broadcasts_created_at_idx
  on public.broadcasts (created_at desc);

create index if not exists broadcasts_target_type_idx
  on public.broadcasts (target_type);

alter table public.broadcasts enable row level security;

-- Only super admins can view broadcasts
drop policy if exists "Super admins can view broadcasts" on public.broadcasts;
create policy "Super admins can view broadcasts"
  on public.broadcasts
  for select
  to authenticated
  using (public.is_super_admin());

-- Only super admins can create broadcasts
drop policy if exists "Super admins can create broadcasts" on public.broadcasts;
create policy "Super admins can create broadcasts"
  on public.broadcasts
  for insert
  to authenticated
  with check (public.is_super_admin());

-- Only super admins can update broadcasts
drop policy if exists "Super admins can update broadcasts" on public.broadcasts;
create policy "Super admins can update broadcasts"
  on public.broadcasts
  for update
  to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

-- Function: Create broadcast
create or replace function public.create_broadcast(
  p_title text,
  p_message text,
  p_priority text,
  p_target_type text,
  p_target_value text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_broadcast_id uuid;
  v_recipient_count integer;
begin
  if not public.is_super_admin() then
    raise exception 'Only super admins can create broadcasts';
  end if;

  if p_title is null or trim(p_title) = '' then
    raise exception 'Title is required';
  end if;

  if p_message is null or trim(p_message) = '' then
    raise exception 'Message is required';
  end if;

  if p_priority not in ('normal', 'urgent') then
    raise exception 'Invalid priority';
  end if;

  if p_target_type not in ('all_users', 'all_donors', 'blood_group', 'division', 'district') then
    raise exception 'Invalid target type';
  end if;

  -- Calculate recipient count
  if p_target_type = 'all_users' then
    select count(*) into v_recipient_count from public.profiles;
  elsif p_target_type = 'all_donors' then
    select count(*) into v_recipient_count from public.profiles
    where donation_availability = true
      and verification_status = 'approved'
      and not coalesce(is_banned, false)
      and not coalesce(is_blacklisted, false);
  elsif p_target_type = 'blood_group' then
    select count(*) into v_recipient_count from public.profiles
    where blood_group = p_target_value
      and donation_availability = true
      and verification_status = 'approved'
      and not coalesce(is_banned, false)
      and not coalesce(is_blacklisted, false);
  elsif p_target_type = 'division' then
    select count(*) into v_recipient_count from public.profiles
    where division = p_target_value;
  elsif p_target_type = 'district' then
    select count(*) into v_recipient_count from public.profiles
    where district = p_target_value;
  end if;

  -- Create broadcast record
  insert into public.broadcasts (
    title,
    message,
    priority,
    target_type,
    target_value,
    total_recipients,
    created_by
  )
  values (
    p_title,
    p_message,
    p_priority,
    p_target_type,
    p_target_value,
    v_recipient_count,
    auth.uid()
  )
  returning id into v_broadcast_id;

  -- Log broadcast creation
  insert into public.audit_logs (actor_id, action, target_type, target_id, details, category)
  values (
    auth.uid(),
    'broadcast_created',
    'broadcast',
    v_broadcast_id::text,
    jsonb_build_object(
      'title', p_title,
      'target_type', p_target_type,
      'target_value', p_target_value,
      'total_recipients', v_recipient_count
    ),
    'moderation'
  );

  return v_broadcast_id;
end;
$$;

revoke all on function public.create_broadcast (text, text, text, text, text) from public;
grant execute on function public.create_broadcast (text, text, text, text, text) to authenticated;

-- Function: Send broadcast (creates notifications)
create or replace function public.send_broadcast(
  p_broadcast_id uuid
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_broadcast public.broadcasts%rowtype;
  v_delivered_count integer := 0;
begin
  if not public.is_super_admin() then
    raise exception 'Only super admins can send broadcasts';
  end if;

  -- Get broadcast details
  select * into v_broadcast
  from public.broadcasts
  where id = p_broadcast_id;

  if not found then
    raise exception 'Broadcast not found';
  end if;

  if v_broadcast.sent_at is not null then
    raise exception 'Broadcast already sent';
  end if;

  -- Create notifications based on target type
  if v_broadcast.target_type = 'all_users' then
    insert into public.notifications (user_id, title, message)
    select user_id, v_broadcast.title, v_broadcast.message
    from public.profiles;
    
    get diagnostics v_delivered_count = row_count;
  elsif v_broadcast.target_type = 'all_donors' then
    insert into public.notifications (user_id, title, message)
    select user_id, v_broadcast.title, v_broadcast.message
    from public.profiles
    where donation_availability = true
      and verification_status = 'approved'
      and not coalesce(is_banned, false)
      and not coalesce(is_blacklisted, false);
    
    get diagnostics v_delivered_count = row_count;
  elsif v_broadcast.target_type = 'blood_group' then
    insert into public.notifications (user_id, title, message)
    select user_id, v_broadcast.title, v_broadcast.message
    from public.profiles
    where blood_group = v_broadcast.target_value
      and donation_availability = true
      and verification_status = 'approved'
      and not coalesce(is_banned, false)
      and not coalesce(is_blacklisted, false);
    
    get diagnostics v_delivered_count = row_count;
  elsif v_broadcast.target_type = 'division' then
    insert into public.notifications (user_id, title, message)
    select user_id, v_broadcast.title, v_broadcast.message
    from public.profiles
    where division = v_broadcast.target_value;
    
    get diagnostics v_delivered_count = row_count;
  elsif v_broadcast.target_type = 'district' then
    insert into public.notifications (user_id, title, message)
    select user_id, v_broadcast.title, v_broadcast.message
    from public.profiles
    where district = v_broadcast.target_value;
    
    get diagnostics v_delivered_count = row_count;
  end if;

  -- Update broadcast with sent timestamp and delivered count
  update public.broadcasts
  set
    sent_at = now(),
    delivered_count = v_delivered_count
  where id = p_broadcast_id;

  -- Log broadcast sent
  insert into public.audit_logs (actor_id, action, target_type, target_id, details, category)
  values (
    auth.uid(),
    'broadcast_sent',
    'broadcast',
    p_broadcast_id::text,
    jsonb_build_object(
      'title', v_broadcast.title,
      'delivered_count', v_delivered_count
    ),
    'moderation'
  );

  return v_delivered_count;
end;
$$;

revoke all on function public.send_broadcast (uuid) from public;
grant execute on function public.send_broadcast (uuid) to authenticated;

-- Function: Update broadcast read count (triggered when notifications are read)
create or replace function public.update_broadcast_read_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_broadcast_id uuid;
begin
  -- This function would be called when a notification is marked as read
  -- For now, we'll have a separate function to manually update read counts
  return new;
end;
$$;

-- Function: Manually update broadcast read count (for analytics)
create or replace function public.refresh_broadcast_analytics()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_super_admin() then
    raise exception 'Only super admins can refresh analytics';
  end if;

  -- Update read count for all broadcasts based on notification read_at
  update public.broadcasts b
  set read_count = (
    select count(*)
    from public.notifications n
    where n.title = b.title
      and n.message = b.message
      and n.created_at >= b.created_at
      and n.read_at is not null
  );
end;
$$;

revoke all on function public.refresh_broadcast_analytics () from public;
grant execute on function public.refresh_broadcast_analytics () to authenticated;
