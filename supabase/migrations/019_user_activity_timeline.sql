-- User Activity Timeline
-- Adds category field to audit_logs and triggers for comprehensive user activity tracking

-- Add category field to audit_logs for filtering
alter table public.audit_logs
  add column if not exists category text;

alter table public.audit_logs
  drop constraint if exists audit_logs_category_check;

alter table public.audit_logs
  add constraint audit_logs_category_check
  check (category in ('verification', 'requests', 'donations', 'moderation', 'points', 'profile', 'auth'));

create index if not exists audit_logs_category_idx
  on public.audit_logs (category);

create index if not exists audit_logs_target_id_idx
  on public.audit_logs (target_id);

-- Update RLS policy to allow admins to view audit logs
drop policy if exists "Super admins can view audit logs" on public.audit_logs;
create policy "Admins can view audit logs"
  on public.audit_logs
  for select
  to authenticated
  using (public.is_admin());

-- Enhanced audit log helper with category
create or replace function public.insert_audit_log(
  p_action text,
  p_target_type text default null,
  p_target_id text default null,
  p_details jsonb default '{}'::jsonb,
  p_category text default 'moderation'
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

  insert into public.audit_logs (actor_id, action, target_type, target_id, details, category)
  values (auth.uid(), p_action, p_target_type, p_target_id, coalesce(p_details, '{}'::jsonb), p_category);
end;
$$;

-- User self-activity logging function (can be called by users for their own actions)
create or replace function public.log_user_activity(
  p_action text,
  p_category text,
  p_details jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.audit_logs (actor_id, action, target_type, target_id, details, category)
  values (auth.uid(), p_action, 'profile', auth.uid()::text, coalesce(p_details, '{}'::jsonb), p_category);
end;
$$;

grant execute on function public.log_user_activity (text, text, jsonb) to authenticated;

-- Trigger: Log profile updates
create or replace function public.log_profile_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_changes jsonb := '{}'::jsonb;
begin
  if tg_op = 'INSERT' then
    insert into public.audit_logs (actor_id, action, target_type, target_id, details, category)
    values (new.user_id, 'user_registered', 'profile', new.user_id::text, 
            jsonb_build_object('full_name', new.full_name, 'blood_group', new.blood_group), 'auth');
  elsif tg_op = 'UPDATE' then
    if old.full_name is distinct from new.full_name then
      v_changes := v_changes || jsonb_build_object('full_name', jsonb_build_object('old', old.full_name, 'new', new.full_name));
    end if;
    if old.blood_group is distinct from new.blood_group then
      v_changes := v_changes || jsonb_build_object('blood_group', jsonb_build_object('old', old.blood_group, 'new', new.blood_group));
    end if;
    if old.phone is distinct from new.phone then
      v_changes := v_changes || jsonb_build_object('phone', jsonb_build_object('old', old.phone, 'new', new.phone));
    end if;
    if old.district is distinct from new.district then
      v_changes := v_changes || jsonb_build_object('district', jsonb_build_object('old', old.district, 'new', new.district));
    end if;
    if old.upazila is distinct from new.upazila then
      v_changes := v_changes || jsonb_build_object('upazila', jsonb_build_object('old', old.upazila, 'new', new.upazila));
    end if;
    
    if jsonb_object_keys(v_changes) ? 'full_name' or jsonb_object_keys(v_changes) ? 'blood_group' 
       or jsonb_object_keys(v_changes) ? 'phone' or jsonb_object_keys(v_changes) ? 'district' 
       or jsonb_object_keys(v_changes) ? 'upazila' then
      insert into public.audit_logs (actor_id, action, target_type, target_id, details, category)
      values (auth.uid(), 'profile_updated', 'profile', new.user_id::text, v_changes, 'profile');
    end if;
  end if;
  
  return new;
end;
$$;

drop trigger if exists profile_activity_log on public.profiles;
create trigger profile_activity_log
  after insert or update on public.profiles
  for each row
  execute function public.log_profile_update();

-- Trigger: Log NID upload
create or replace function public.log_nid_upload()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.nid_front_url is distinct from old.nid_front_url and new.nid_front_url is not null then
    insert into public.audit_logs (actor_id, action, target_type, target_id, details, category)
    values (new.user_id, 'nid_front_uploaded', 'profile', new.user_id::text, '{}', 'verification');
  end if;
  if new.nid_back_url is distinct from old.nid_back_url and new.nid_back_url is not null then
    insert into public.audit_logs (actor_id, action, target_type, target_id, details, category)
    values (new.user_id, 'nid_back_uploaded', 'profile', new.user_id::text, '{}', 'verification');
  end if;
  return new;
end;
$$;

drop trigger if exists nid_upload_log on public.profiles;
create trigger nid_upload_log
  after update of nid_front_url, nid_back_url on public.profiles
  for each row
  execute function public.log_nid_upload();

-- Update review_identity_verification to log with category
create or replace function public.review_identity_verification(
  p_user_id uuid,
  p_action text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Not authorized';
  end if;

  if p_action not in ('approve', 'reject') then
    raise exception 'Invalid action';
  end if;

  if p_action = 'approve' then
    update public.profiles
    set verification_status = 'approved'
    where user_id = p_user_id
      and verification_status = 'pending';

    if not found then
      raise exception 'No pending verification for this user';
    end if;

    insert into public.notifications (user_id, title, message)
    values (
      p_user_id,
      'NID approved',
      'Your NID verification has been approved. You are now a verified donor.'
    );
    
    insert into public.audit_logs (actor_id, action, target_type, target_id, details, category)
    values (auth.uid(), 'nid_approved', 'profile', p_user_id::text, '{}', 'verification');
  else
    update public.profiles
    set verification_status = 'rejected'
    where user_id = p_user_id
      and verification_status = 'pending';

    if not found then
      raise exception 'No pending verification for this user';
    end if;

    insert into public.notifications (user_id, title, message)
    values (
      p_user_id,
      'NID rejected',
      'Your NID verification was rejected. Please upload clear photos and try again.'
    );
    
    insert into public.audit_logs (actor_id, action, target_type, target_id, details, category)
    values (auth.uid(), 'nid_rejected', 'profile', p_user_id::text, '{}', 'verification');
  end if;
end;
$$;

-- Trigger: Log blood request creation/deletion/completion
create or replace function public.log_blood_request_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.audit_logs (actor_id, action, target_type, target_id, details, category)
    values (new.user_id, 'blood_request_created', 'blood_request', new.id::text, 
            jsonb_build_object('blood_group', new.blood_group, 'urgency', new.urgency_level), 'requests');
  elsif tg_op = 'UPDATE' then
    if old.status is distinct from new.status then
      insert into public.audit_logs (actor_id, action, target_type, target_id, details, category)
      values (auth.uid(), 'blood_request_' || new.status, 'blood_request', new.id::text, 
              jsonb_build_object('old_status', old.status, 'new_status', new.status), 'requests');
    end if;
  elsif tg_op = 'DELETE' then
    insert into public.audit_logs (actor_id, action, target_type, target_id, details, category)
    values (old.user_id, 'blood_request_deleted', 'blood_request', old.id::text, '{}', 'requests');
  end if;
  return new;
end;
$$;

drop trigger if exists blood_request_activity_log on public.blood_requests;
create trigger blood_request_activity_log
  after insert or update or delete on public.blood_requests
  for each row
  execute function public.log_blood_request_activity();

-- Trigger: Log donation completion
create or replace function public.log_donation_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.audit_logs (actor_id, action, target_type, target_id, details, category)
    values (new.receiver_id, 'donation_completed', 'donation', new.id::text,
            jsonb_build_object('donor_id', new.donor_id, 'feedback', new.feedback_status), 'donations');
  end if;
  return new;
end;
$$;

drop trigger if exists donation_activity_log on public.donations;
create trigger donation_activity_log
  after insert on public.donations
  for each row
  execute function public.log_donation_activity();

-- Update complete_donation to log points changes
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
  v_donor public.profiles%rowtype;
  v_donation_date date := current_date;
  v_can_earn_points boolean;
  v_points_earned integer := 0;
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

  select * into v_donor from public.profiles where user_id = v_donor_id;

  v_message := nullif(trim(coalesce(p_feedback_message, '')), '');

  v_can_earn_points :=
    v_donor.verification_status = 'approved'
    and v_donor.date_of_birth is not null
    and public.profile_age_years(v_donor.date_of_birth) >= 17
    and not coalesce(v_donor.is_banned, false)
    and not coalesce(v_donor.is_blacklisted, false);

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

    if v_can_earn_points then
      v_points_earned := 10;
      update public.profiles
      set
        total_donations = total_donations + 1,
        total_points = total_points + 10,
        last_donation_date = v_donation_date,
        next_eligible_date = (v_donation_date + interval '90 days')::date,
        donation_availability = false
      where user_id = v_donor_id;

      insert into public.notifications (user_id, donor_request_id, title, message)
      values (
        v_donor_id,
        p_request_id,
        'Donation confirmed',
        'Donation confirmed. You earned 10 points. You can donate again after '
          || to_char((v_donation_date + interval '90 days')::date, 'DD Mon YYYY') || '.'
      );
      
      insert into public.audit_logs (actor_id, action, target_type, target_id, details, category)
      values (v_donor_id, 'points_earned', 'profile', v_donor_id::text, 
              jsonb_build_object('amount', 10, 'reason', 'donation_completed', 'balance_after', v_donor.total_points + 10), 'points');
    else
      update public.profiles
      set
        total_donations = total_donations + 1,
        last_donation_date = v_donation_date,
        next_eligible_date = (v_donation_date + interval '90 days')::date,
        donation_availability = false
      where user_id = v_donor_id;

      insert into public.notifications (user_id, donor_request_id, title, message)
      values (
        v_donor_id,
        p_request_id,
        'Donation confirmed',
        'Donation confirmed. Cooldown applies until '
          || to_char((v_donation_date + interval '90 days')::date, 'DD Mon YYYY') || '.'
      );
    end if;
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

-- Update adjust_user_points to log with category
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
  v_blacklisted boolean;
begin
  if not public.is_super_admin() then
    raise exception 'Only super admins can adjust points';
  end if;

  if p_reason is null or trim(p_reason) = '' then
    raise exception 'Reason is required';
  end if;

  select coalesce(is_blacklisted, false) into v_blacklisted
  from public.profiles
  where user_id = p_user_id;

  if not found then
    raise exception 'User not found';
  end if;

  if v_blacklisted and coalesce(p_delta, 0) > 0 then
    raise exception 'Blacklisted users cannot earn points';
  end if;

  update public.profiles
  set total_points = greatest(0, total_points + p_delta)
  where user_id = p_user_id
  returning total_points into v_new_balance;

  insert into public.point_transactions (
    user_id, delta, reason, balance_after, created_by
  )
  values (
    p_user_id, p_delta, trim(p_reason), v_new_balance, auth.uid()
  );

  insert into public.audit_logs (actor_id, action, target_type, target_id, details, category)
  values (auth.uid(), 'points_adjusted', 'profile', p_user_id::text, 
          jsonb_build_object('delta', p_delta, 'reason', p_reason, 'balance_after', v_new_balance), 'points');

  perform public.insert_audit_log(
    'points_adjustment',
    'profile',
    p_user_id::text,
    jsonb_build_object('delta', p_delta, 'reason', p_reason, 'balance_after', v_new_balance),
    'points'
  );
end;
$$;

-- Update moderation functions to log with category
create or replace function public.super_admin_set_user_banned(
  p_user_id uuid,
  p_banned boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_super_admin() then
    raise exception 'Forbidden';
  end if;

  if p_user_id = auth.uid() then
    raise exception 'Cannot ban yourself';
  end if;

  if p_banned then
    update public.profiles
    set
      is_banned = true,
      donation_availability = false
    where user_id = p_user_id;

    perform public.super_admin_log_user_action(
      'User Banned',
      p_user_id,
      jsonb_build_object('is_banned', true)
    );
    
    insert into public.audit_logs (actor_id, action, target_type, target_id, details, category)
    values (auth.uid(), 'user_banned', 'profile', p_user_id::text, jsonb_build_object('is_banned', true), 'moderation');
  else
    update public.profiles
    set is_banned = false
    where user_id = p_user_id;

    perform public.super_admin_log_user_action(
      'User Unbanned',
      p_user_id,
      jsonb_build_object('is_banned', false)
    );
    
    insert into public.audit_logs (actor_id, action, target_type, target_id, details, category)
    values (auth.uid(), 'user_unbanned', 'profile', p_user_id::text, jsonb_build_object('is_banned', false), 'moderation');
  end if;
end;
$$;

create or replace function public.super_admin_set_user_blacklisted(
  p_user_id uuid,
  p_blacklisted boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_old boolean;
begin
  if not public.is_super_admin() then
    raise exception 'Forbidden';
  end if;

  if p_user_id = auth.uid() then
    raise exception 'Cannot blacklist yourself';
  end if;

  select coalesce(is_blacklisted, false) into v_old
  from public.profiles
  where user_id = p_user_id;

  if not found then
    raise exception 'User not found';
  end if;

  if p_blacklisted then
    update public.profiles
    set
      is_blacklisted = true,
      donation_availability = false
    where user_id = p_user_id;
    
    insert into public.audit_logs (actor_id, action, target_type, target_id, details, category)
    values (auth.uid(), 'user_blacklisted', 'profile', p_user_id::text, 
            jsonb_build_object('old_value', v_old, 'new_value', true), 'moderation');
  else
    update public.profiles
    set is_blacklisted = false
    where user_id = p_user_id;
    
    insert into public.audit_logs (actor_id, action, target_type, target_id, details, category)
    values (auth.uid(), 'user_unblacklisted', 'profile', p_user_id::text, 
            jsonb_build_object('old_value', v_old, 'new_value', false), 'moderation');
  end if;

  if v_old is distinct from p_blacklisted then
    perform public.super_admin_log_user_action(
      case
        when p_blacklisted then 'User Blacklisted'
        else 'User Removed From Blacklist'
      end,
      p_user_id,
      jsonb_build_object(
        'target_user_id', p_user_id,
        'old_value', v_old,
        'new_value', p_blacklisted
      )
    );
  end if;
end;
$$;

create or replace function public.super_admin_set_user_shadow_banned(
  p_user_id uuid,
  p_shadow_banned boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_old boolean;
begin
  if not public.is_super_admin() then
    raise exception 'Forbidden';
  end if;

  if p_user_id = auth.uid() then
    raise exception 'Cannot shadow ban yourself';
  end if;

  select coalesce(is_shadow_banned, false) into v_old
  from public.profiles
  where user_id = p_user_id;

  if not found then
    raise exception 'User not found';
  end if;

  update public.profiles
  set
    is_shadow_banned = p_shadow_banned,
    donation_availability = case
      when p_shadow_banned then false
      else donation_availability
    end
  where user_id = p_user_id;

  if v_old is distinct from p_shadow_banned then
    perform public.super_admin_log_user_action(
      case
        when p_shadow_banned then 'User Shadow Banned'
        else 'User Shadow Ban Removed'
      end,
      p_user_id,
      jsonb_build_object(
        'target_user_id', p_user_id,
        'old_value', v_old,
        'new_value', p_shadow_banned
      )
    );
    
    insert into public.audit_logs (actor_id, action, target_type, target_id, details, category)
    values (auth.uid(), case when p_shadow_banned then 'user_shadow_banned' else 'user_shadow_unbanned' end, 
            'profile', p_user_id::text, jsonb_build_object('old_value', v_old, 'new_value', p_shadow_banned), 'moderation');
  end if;
end;
$$;

create or replace function public.super_admin_set_cooldown(
  p_user_id uuid,
  p_next_eligible_date date
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_removing boolean;
begin
  if not public.is_super_admin() then
    raise exception 'Forbidden';
  end if;

  v_removing := p_next_eligible_date is null;

  update public.profiles
  set
    next_eligible_date = p_next_eligible_date,
    donation_availability = case
      when p_next_eligible_date is not null
        and p_next_eligible_date > current_date then false
      else donation_availability
    end
  where user_id = p_user_id;

  if v_removing then
    perform public.super_admin_log_user_action(
      'Cooldown Removed',
      p_user_id,
      jsonb_build_object('next_eligible_date', null)
    );
    
    insert into public.audit_logs (actor_id, action, target_type, target_id, details, category)
    values (auth.uid(), 'cooldown_removed', 'profile', p_user_id::text, jsonb_build_object('next_eligible_date', null), 'moderation');
  else
    perform public.super_admin_log_user_action(
      'Cooldown Added',
      p_user_id,
      jsonb_build_object('next_eligible_date', p_next_eligible_date)
    );
    
    insert into public.audit_logs (actor_id, action, target_type, target_id, details, category)
    values (auth.uid(), 'cooldown_added', 'profile', p_user_id::text, jsonb_build_object('next_eligible_date', p_next_eligible_date), 'moderation');
  end if;
end;
$$;

create or replace function public.super_admin_set_user_verification(
  p_user_id uuid,
  p_verified boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_super_admin() then
    raise exception 'Forbidden';
  end if;

  if p_user_id = auth.uid() then
    raise exception 'Cannot change your own verification status';
  end if;

  if p_verified then
    update public.profiles
    set verification_status = 'approved'
    where user_id = p_user_id;

    perform public.super_admin_log_user_action(
      'User Verified',
      p_user_id,
      jsonb_build_object('verification_status', 'approved')
    );
    
    insert into public.audit_logs (actor_id, action, target_type, target_id, details, category)
    values (auth.uid(), 'verification_approved', 'profile', p_user_id::text, jsonb_build_object('verification_status', 'approved'), 'verification');
  else
    update public.profiles
    set
      verification_status = 'not_submitted',
      donation_availability = false
    where user_id = p_user_id;

    perform public.super_admin_log_user_action(
      'User Unverified',
      p_user_id,
      jsonb_build_object('verification_status', 'not_submitted')
    );
    
    insert into public.audit_logs (actor_id, action, target_type, target_id, details, category)
    values (auth.uid(), 'verification_revoked', 'profile', p_user_id::text, jsonb_build_object('verification_status', 'not_submitted'), 'verification');
  end if;
end;
$$;
