-- One phone = one account: normalized unique phone constraint

create or replace function public.normalize_profile_phone(p_phone text)
returns text
language plpgsql
immutable
as $$
declare
  digits text;
begin
  if p_phone is null or trim(p_phone) = '' then
    return null;
  end if;

  digits := regexp_replace(p_phone, '\D', '', 'g');

  if digits = '' then
    return null;
  end if;

  if digits like '880%' then
    return digits;
  end if;

  if digits like '0%' then
    return '88' || digits;
  end if;

  if length(digits) = 10 then
    return '880' || digits;
  end if;

  return digits;
end;
$$;

-- Availability check (registration + profile edit)
create or replace function public.is_phone_available(
  p_phone text,
  p_exclude_user_id uuid default null
)
returns boolean
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_norm text;
begin
  v_norm := public.normalize_profile_phone(p_phone);

  if v_norm is null then
    return true;
  end if;

  return not exists (
    select 1
    from public.profiles p
    where public.normalize_profile_phone(p.phone) = v_norm
      and (p_exclude_user_id is null or p.user_id <> p_exclude_user_id)
  );
end;
$$;

revoke all on function public.is_phone_available (text, uuid) from public;
grant execute on function public.is_phone_available (text, uuid) to authenticated;

-- Enforce uniqueness on normalized phone (ignores null/empty)
create unique index if not exists profiles_phone_normalized_unique
  on public.profiles (public.normalize_profile_phone(phone))
  where public.normalize_profile_phone(phone) is not null;

create index if not exists profiles_phone_normalized_idx
  on public.profiles (public.normalize_profile_phone(phone));

-- Block duplicate phones on auth signup trigger
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
  v_phone text;
begin
  v_phone := coalesce(
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'phone_number',
    ''
  );

  if trim(v_phone) <> ''
    and not public.is_phone_available(v_phone, new.id) then
    raise exception 'This phone number is already registered.'
      using errcode = '23505';
  end if;

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
    v_phone,
    nullif(new.raw_user_meta_data->>'last_donation_date', '')::date,
    availability,
    v_dob,
    'not_submitted'
  )
  on conflict (user_id) do nothing;

  return new;
end;
$$;
