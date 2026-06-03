-- Blood request owner/admin audit logging

create or replace function public.log_blood_request_audit(
  p_action text,
  p_request_id uuid,
  p_details jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select user_id into v_owner_id
  from public.blood_requests
  where id = p_request_id;

  if not found then
    raise exception 'Blood request not found';
  end if;

  if not (public.is_admin() or auth.uid() = v_owner_id) then
    raise exception 'Forbidden';
  end if;

  insert into public.audit_logs (actor_id, action, target_type, target_id, details)
  values (
    auth.uid(),
    p_action,
    'blood_request',
    p_request_id::text,
    coalesce(p_details, '{}'::jsonb)
  );
end;
$$;

revoke all on function public.log_blood_request_audit (text, uuid, jsonb) from public;
grant execute on function public.log_blood_request_audit (text, uuid, jsonb) to authenticated;
