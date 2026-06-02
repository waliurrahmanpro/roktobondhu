-- Update notification copy for donor-request workflow (run after 005)

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
