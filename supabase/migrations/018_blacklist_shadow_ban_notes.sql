-- Blacklist, shadow ban, and admin user notes

alter table public.profiles
  add column if not exists is_blacklisted boolean not null default false;

alter table public.profiles
  add column if not exists is_shadow_banned boolean not null default false;

create index if not exists profiles_is_blacklisted_idx
  on public.profiles (is_blacklisted)
  where is_blacklisted;

create index if not exists profiles_is_shadow_banned_idx
  on public.profiles (is_shadow_banned)
  where is_shadow_banned;

-- Eligible for donor search / matching notifications
create or replace function public.is_eligible_donor_profile(p profiles)
returns boolean
language sql
stable
as $$
  select
    coalesce(p.donation_availability, false)
    and not coalesce(p.is_banned, false)
    and not coalesce(p.is_blacklisted, false)
    and not coalesce(p.is_shadow_banned, false)
    and p.verification_status = 'approved'
    and p.date_of_birth is not null
    and public.profile_age_years(p.date_of_birth) >= 17
    and p.full_name is distinct from 'New Donor'
    and (
      p.next_eligible_date is null
      or p.next_eligible_date <= current_date
    );
$$;

-- Shared moderation audit (admins + super admins)
create or replace function public.moderation_log_user_action(
  p_action text,
  p_target_user_id uuid,
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
  values (
    auth.uid(),
    p_action,
    'profile',
    p_target_user_id::text,
    coalesce(p_details, '{}'::jsonb)
      || jsonb_build_object('target_user_id', p_target_user_id)
  );
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
  else
    update public.profiles
    set is_blacklisted = false
    where user_id = p_user_id;
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
  end if;
end;
$$;

-- User notes (admin + super admin only)
create table if not exists public.user_notes (
  id uuid primary key default gen_random_uuid(),
  subject_user_id uuid not null references public.profiles (user_id) on delete cascade,
  author_id uuid references auth.users (id) on delete set null,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_notes_body_not_empty check (char_length(trim(body)) > 0)
);

create index if not exists user_notes_subject_user_id_idx
  on public.user_notes (subject_user_id, created_at desc);

alter table public.user_notes enable row level security;

drop policy if exists "Admins can view user notes" on public.user_notes;
create policy "Admins can view user notes"
  on public.user_notes
  for select
  to authenticated
  using (public.is_admin());

drop policy if exists "Admins can insert user notes" on public.user_notes;
create policy "Admins can insert user notes"
  on public.user_notes
  for insert
  to authenticated
  with check (public.is_admin() and author_id = auth.uid());

drop policy if exists "Admins can update user notes" on public.user_notes;
create policy "Admins can update user notes"
  on public.user_notes
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins can delete user notes" on public.user_notes;
create policy "Admins can delete user notes"
  on public.user_notes
  for delete
  to authenticated
  using (public.is_admin());

create or replace function public.set_user_notes_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists user_notes_updated_at on public.user_notes;
create trigger user_notes_updated_at
  before update on public.user_notes
  for each row
  execute function public.set_user_notes_updated_at();

create or replace function public.admin_create_user_note(
  p_subject_user_id uuid,
  p_body text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_body text;
begin
  if not public.is_admin() then
    raise exception 'Forbidden';
  end if;

  v_body := trim(coalesce(p_body, ''));
  if v_body = '' then
    raise exception 'Note body is required';
  end if;

  if not exists (
    select 1 from public.profiles where user_id = p_subject_user_id
  ) then
    raise exception 'User not found';
  end if;

  insert into public.user_notes (subject_user_id, author_id, body)
  values (p_subject_user_id, auth.uid(), v_body)
  returning id into v_id;

  perform public.moderation_log_user_action(
    'Note Added',
    p_subject_user_id,
    jsonb_build_object(
      'note_id', v_id,
      'old_value', null,
      'new_value', v_body
    )
  );

  return v_id;
end;
$$;

create or replace function public.admin_update_user_note(
  p_note_id uuid,
  p_body text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_old text;
  v_new text;
  v_subject uuid;
begin
  if not public.is_admin() then
    raise exception 'Forbidden';
  end if;

  v_new := trim(coalesce(p_body, ''));
  if v_new = '' then
    raise exception 'Note body is required';
  end if;

  select body, subject_user_id
  into v_old, v_subject
  from public.user_notes
  where id = p_note_id;

  if not found then
    raise exception 'Note not found';
  end if;

  if v_old = v_new then
    return;
  end if;

  update public.user_notes
  set body = v_new
  where id = p_note_id;

  perform public.moderation_log_user_action(
    'Note Updated',
    v_subject,
    jsonb_build_object(
      'note_id', p_note_id,
      'old_value', v_old,
      'new_value', v_new
    )
  );
end;
$$;

create or replace function public.admin_delete_user_note(p_note_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_old text;
  v_subject uuid;
begin
  if not public.is_admin() then
    raise exception 'Forbidden';
  end if;

  select body, subject_user_id
  into v_old, v_subject
  from public.user_notes
  where id = p_note_id;

  if not found then
    raise exception 'Note not found';
  end if;

  delete from public.user_notes where id = p_note_id;

  perform public.moderation_log_user_action(
    'Note Deleted',
    v_subject,
    jsonb_build_object(
      'note_id', p_note_id,
      'old_value', v_old,
      'new_value', null
    )
  );
end;
$$;

-- No points earned while blacklisted
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

  perform public.insert_audit_log(
    'points_adjustment',
    'profile',
    p_user_id::text,
    jsonb_build_object('delta', p_delta, 'reason', p_reason, 'balance_after', v_new_balance),
    'points'
  );
end;
$$;

revoke all on function public.moderation_log_user_action (text, uuid, jsonb) from public;
grant execute on function public.moderation_log_user_action (text, uuid, jsonb) to authenticated;

revoke all on function public.super_admin_set_user_blacklisted (uuid, boolean) from public;
grant execute on function public.super_admin_set_user_blacklisted (uuid, boolean) to authenticated;

revoke all on function public.super_admin_set_user_shadow_banned (uuid, boolean) from public;
grant execute on function public.super_admin_set_user_shadow_banned (uuid, boolean) to authenticated;

revoke all on function public.admin_create_user_note (uuid, text) from public;
grant execute on function public.admin_create_user_note (uuid, text) to authenticated;

revoke all on function public.admin_update_user_note (uuid, text) from public;
grant execute on function public.admin_update_user_note (uuid, text) to authenticated;

revoke all on function public.admin_delete_user_note (uuid) from public;
grant execute on function public.admin_delete_user_note (uuid) to authenticated;
