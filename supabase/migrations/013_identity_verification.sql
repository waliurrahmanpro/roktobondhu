-- Phase 7A: identity verification, date of birth, NID uploads

alter table public.profiles
  add column if not exists date_of_birth date;

alter table public.profiles
  add column if not exists nid_front_url text;

alter table public.profiles
  add column if not exists nid_back_url text;

alter table public.profiles
  add column if not exists verification_status text not null default 'not_submitted';

alter table public.profiles
  drop constraint if exists profiles_verification_status_check;

alter table public.profiles
  add constraint profiles_verification_status_check
  check (
    verification_status in (
      'not_submitted',
      'pending',
      'approved',
      'rejected'
    )
  );

create index if not exists profiles_verification_status_idx
  on public.profiles (verification_status);

create index if not exists profiles_date_of_birth_idx
  on public.profiles (date_of_birth);

-- Age helper (years)
create or replace function public.profile_age_years(p_dob date)
returns integer
language sql
stable
as $$
  select case
    when p_dob is null then null
    else extract(year from age(current_date, p_dob))::integer
  end;
$$;

-- Eligible for donor search / matching
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
    and p.full_name is distinct from 'New Donor';
$$;

-- Enforce donation availability + protect verification status on user updates
create or replace function public.enforce_profile_eligibility()
returns trigger
language plpgsql
as $$
declare
  v_age integer;
  v_is_admin boolean;
begin
  v_is_admin := coalesce(public.is_admin(), false);

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
      or public.profile_age_years(new.date_of_birth) < 17 then
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

drop trigger if exists profiles_enforce_eligibility on public.profiles;
create trigger profiles_enforce_eligibility
  before insert or update on public.profiles
  for each row
  execute function public.enforce_profile_eligibility();

-- NID documents bucket (private)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'nid-documents',
  'nid-documents',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Users can upload own NID" on storage.objects;
create policy "Users can upload own NID"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'nid-documents'
    and auth.uid()::text = (storage.foldername (name))[1]
  );

drop policy if exists "Users can update own NID" on storage.objects;
create policy "Users can update own NID"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'nid-documents'
    and auth.uid()::text = (storage.foldername (name))[1]
  );

drop policy if exists "Users can read own NID" on storage.objects;
create policy "Users can read own NID"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'nid-documents'
    and auth.uid()::text = (storage.foldername (name))[1]
  );

drop policy if exists "Admins can read all NID" on storage.objects;
create policy "Admins can read all NID"
  on storage.objects
  for select
  to authenticated
  using (bucket_id = 'nid-documents' and public.is_admin());

-- Admin review RPC + notifications
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
  end if;
end;
$$;

revoke all on function public.review_identity_verification (uuid, text) from public;
grant execute on function public.review_identity_verification (uuid, text) to authenticated;

-- Signup trigger: date of birth + eligibility
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  availability boolean;
  v_dob date;
  v_age integer;
begin
  availability := coalesce(
    (new.raw_user_meta_data->>'donation_availability')::boolean,
    false
  );

  v_dob := nullif(new.raw_user_meta_data->>'date_of_birth', '')::date;

  if v_dob is not null then
    v_age := public.profile_age_years(v_dob);
    if v_age < 17 then
      availability := false;
    end if;
  else
    availability := false;
  end if;

  insert into public.profiles (
    user_id,
    full_name,
    blood_group,
    division,
    district,
    upazila,
    phone,
    last_donation_date,
    donation_availability,
    date_of_birth,
    verification_status
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'New Donor'),
    coalesce(new.raw_user_meta_data->>'blood_group', 'O+'),
    coalesce(new.raw_user_meta_data->>'division', ''),
    coalesce(new.raw_user_meta_data->>'district', ''),
    coalesce(new.raw_user_meta_data->>'upazila', ''),
    coalesce(
      new.raw_user_meta_data->>'phone',
      new.raw_user_meta_data->>'phone_number',
      ''
    ),
    nullif(new.raw_user_meta_data->>'last_donation_date', '')::date,
    availability,
    v_dob,
    'not_submitted'
  )
  on conflict (user_id) do nothing;

  return new;
end;
$$;

-- Donation points only for eligible donors (17+, approved)
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

    if public.is_eligible_donor_profile(v_donor) then
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
      update public.profiles
      set total_donations = total_donations + 1
      where user_id = v_donor_id;

      insert into public.notifications (user_id, donor_request_id, title, message)
      values (
        v_donor_id,
        p_request_id,
        'Donation confirmed',
        'Donation confirmed.'
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

-- Smart matching: only eligible verified donors
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
      is_banned,
      verification_status,
      date_of_birth
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
