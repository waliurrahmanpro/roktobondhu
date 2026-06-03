-- Super admin user management (verify, ban, availability, cooldown)

-- Allow super admins to override eligibility when managing other users
create or replace function public.enforce_profile_eligibility()
returns trigger
language plpgsql
as $$
declare
  v_age integer;
  v_is_admin boolean;
begin
  if tg_op = 'UPDATE'
    and coalesce(public.is_super_admin(), false)
    and auth.uid() is distinct from new.user_id then
    return new;
  end if;

  v_is_admin := coalesce(public.is_admin(), false);

  if new.next_eligible_date is not null
    and new.next_eligible_date > current_date then
    new.donation_availability := false;
  end if;

  if new.date_of_birth is not null then
    v_age := public.profile_age_years(new.date_of_birth);
    if v_age < 17 then
      new.donation_availability := false;
    end if;
  elsif new.donation_availability then
    new.donation_availability := false;
  end if;

  if new.donation_availability then
    if new.verification_status <> 'approved'
      or new.date_of_birth is null
      or public.profile_age_years(new.date_of_birth) < 17
      or (new.next_eligible_date is not null and new.next_eligible_date > current_date) then
      new.donation_availability := false;
    end if;
  end if;

  if tg_op = 'UPDATE' and auth.uid() = new.user_id and not v_is_admin then
    if new.verification_status is distinct from old.verification_status then
      if old.verification_status in ('approved', 'pending')
        and new.verification_status not in ('pending') then
        new.verification_status := old.verification_status;
      end if;
      if old.verification_status = 'rejected'
        and new.verification_status not in ('pending', 'rejected') then
        new.verification_status := old.verification_status;
      end if;
      if old.verification_status = 'not_submitted'
        and new.verification_status not in ('pending', 'not_submitted') then
        new.verification_status := old.verification_status;
      end if;
    end if;
  end if;

  return new;
end;
$$;

create or replace function public.super_admin_log_user_action(
  p_action text,
  p_user_id uuid,
  p_details jsonb default '{}'::jsonb
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

  insert into public.audit_logs (actor_id, action, target_type, target_id, details)
  values (
    auth.uid(),
    p_action,
    'profile',
    p_user_id::text,
    coalesce(p_details, '{}'::jsonb)
  );
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
  end if;
end;
$$;

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
  else
    update public.profiles
    set is_banned = false
    where user_id = p_user_id;

    perform public.super_admin_log_user_action(
      'User Unbanned',
      p_user_id,
      jsonb_build_object('is_banned', false)
    );
  end if;
end;
$$;

create or replace function public.super_admin_set_donation_availability(
  p_user_id uuid,
  p_enabled boolean
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

  update public.profiles
  set donation_availability = p_enabled
  where user_id = p_user_id;

  perform public.super_admin_log_user_action(
    case when p_enabled then 'Donations Enabled' else 'Donations Disabled' end,
    p_user_id,
    jsonb_build_object('donation_availability', p_enabled)
  );
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
  else
    perform public.super_admin_log_user_action(
      'Cooldown Added',
      p_user_id,
      jsonb_build_object('next_eligible_date', p_next_eligible_date)
    );
  end if;
end;
$$;

create or replace function public.super_admin_add_cooldown(
  p_user_id uuid,
  p_days integer default 90
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_days integer;
  v_until date;
begin
  if not public.is_super_admin() then
    raise exception 'Forbidden';
  end if;

  v_days := greatest(coalesce(p_days, 90), 1);
  v_until := current_date + v_days;

  update public.profiles
  set
    next_eligible_date = v_until,
    donation_availability = false
  where user_id = p_user_id;

  perform public.super_admin_log_user_action(
    'Cooldown Added',
    p_user_id,
    jsonb_build_object('next_eligible_date', v_until, 'days', v_days)
  );
end;
$$;

revoke all on function public.super_admin_log_user_action (text, uuid, jsonb) from public;
grant execute on function public.super_admin_log_user_action (text, uuid, jsonb) to authenticated;

revoke all on function public.super_admin_set_user_verification (uuid, boolean) from public;
grant execute on function public.super_admin_set_user_verification (uuid, boolean) to authenticated;

revoke all on function public.super_admin_set_user_banned (uuid, boolean) from public;
grant execute on function public.super_admin_set_user_banned (uuid, boolean) to authenticated;

revoke all on function public.super_admin_set_donation_availability (uuid, boolean) from public;
grant execute on function public.super_admin_set_donation_availability (uuid, boolean) to authenticated;

revoke all on function public.super_admin_set_cooldown (uuid, date) from public;
grant execute on function public.super_admin_set_cooldown (uuid, date) to authenticated;

revoke all on function public.super_admin_add_cooldown (uuid, integer) from public;
grant execute on function public.super_admin_add_cooldown (uuid, integer) to authenticated;
