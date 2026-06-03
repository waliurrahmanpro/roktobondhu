-- Phase 7B: donation cooldown + updated smart matching scores

alter table public.profiles
  add column if not exists next_eligible_date date;

create index if not exists profiles_next_eligible_date_idx
  on public.profiles (next_eligible_date);

-- In cooldown when next_eligible_date is in the future
create or replace function public.is_in_donation_cooldown(p profiles)
returns boolean
language sql
stable
as $$
  select
    p.next_eligible_date is not null
    and p.next_eligible_date > current_date;
$$;

-- Search, matching, and emergency alerts
create or replace function public.is_eligible_donor_profile(p profiles)
returns boolean
language sql
stable
as $$
  select
    coalesce(p.donation_availability, false)
    and not coalesce(p.is_banned, false)
    and p.verification_status = 'approved'
    and p.date_of_birth is not null
    and public.profile_age_years(p.date_of_birth) >= 17
    and p.full_name is distinct from 'New Donor'
    and not public.is_in_donation_cooldown(p);
$$;

-- Points tier bonus for matching (max +20)
create or replace function public.match_points_bonus(p_points integer)
returns integer
language sql
immutable
as $$
  select case
    when coalesce(p_points, 0) >= 500 then 20
    when coalesce(p_points, 0) >= 250 then 15
    when coalesce(p_points, 0) >= 100 then 10
    when coalesce(p_points, 0) >= 50 then 5
    else 0
  end;
$$;

-- Cooldown blocks availability toggle
create or replace function public.enforce_profile_eligibility()
returns trigger
language plpgsql
as $$
declare
  v_age integer;
  v_is_admin boolean;
begin
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

-- 90-day cooldown after confirmed donation
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

    if v_donor.verification_status = 'approved'
      and v_donor.date_of_birth is not null
      and public.profile_age_years(v_donor.date_of_birth) >= 17
      and not coalesce(v_donor.is_banned, false) then
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

-- Smart matching: blood +100, district +50, upazila +30, verified +30,
-- trusted +20, points bonus (tiered), available +20
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
  v_inserted integer := 0;
  v_bg text;
begin
  select * into v_request
  from public.blood_requests
  where id = p_request_id
    and status = 'active';

  if not found then
    return 0;
  end if;

  v_bg := v_request.blood_group;

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
      verification_status
    from public.profiles p
    where public.is_eligible_donor_profile(p)
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

    if v_donor.verification_status = 'approved' then
      v_score := v_score + 30;
    end if;

    if coalesce(v_donor.total_donations, 0) >= 3
      and coalesce(v_donor.reported_donations, 0) = 0 then
      v_score := v_score + 20;
    end if;

    v_score := v_score + public.match_points_bonus(v_donor.total_points);

    if v_donor.donation_availability then
      v_score := v_score + 20;
    end if;

    if v_score > 0 then
      insert into public.match_logs (request_id, donor_id, match_score)
      values (p_request_id, v_donor.user_id, v_score)
      on conflict (request_id, donor_id) do update
        set match_score = excluded.match_score;
    end if;
  end loop;

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
      'Urgent ' || v_bg || ' blood request near your area.'
    );
    v_inserted := v_inserted + 1;
  end loop;

  return v_inserted;
end;
$$;
