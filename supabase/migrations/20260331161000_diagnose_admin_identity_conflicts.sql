create or replace function public.diagnose_admin_identity_conflicts(
  p_accounts jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_account jsonb;
  v_result jsonb := '[]'::jsonb;
  v_email text;
  v_declared_auth_user_id text;
  v_declared_user_exists boolean;
  v_email_owner_id uuid;
  v_identity_owner_id uuid;
begin
  for v_account in
    select value
    from jsonb_array_elements(coalesce(p_accounts, '[]'::jsonb))
  loop
    v_email := lower(trim(coalesce(v_account->>'loginEmail', '')));
    v_declared_auth_user_id := trim(coalesce(v_account->>'authUserId', ''));
    v_declared_user_exists := false;
    v_email_owner_id := null;
    v_identity_owner_id := null;

    if v_declared_auth_user_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
      select exists(
        select 1
        from auth.users
        where id = v_declared_auth_user_id::uuid
      )
      into v_declared_user_exists;
    end if;

    if v_email <> '' then
      select id
      into v_email_owner_id
      from auth.users
      where lower(email) = v_email
      limit 1;

      select user_id
      into v_identity_owner_id
      from auth.identities
      where provider = 'email'
        and lower(provider_id) = v_email
      limit 1;
    end if;

    if (
      (v_declared_auth_user_id <> '' and not v_declared_user_exists)
      or (v_email_owner_id is not null and v_declared_auth_user_id <> '' and v_declared_auth_user_id <> v_email_owner_id::text)
      or (v_identity_owner_id is not null and v_email_owner_id is not null and v_identity_owner_id <> v_email_owner_id)
      or (v_identity_owner_id is not null and v_email_owner_id is null)
    ) then
      v_result := v_result || jsonb_build_array(
        jsonb_build_object(
          'loginEmail', v_email,
          'accountId', coalesce(v_account->>'id', ''),
          'declaredAuthUserId', v_declared_auth_user_id,
          'declaredUserExists', v_declared_user_exists,
          'emailOwnerId', coalesce(v_email_owner_id::text, ''),
          'identityOwnerId', coalesce(v_identity_owner_id::text, '')
        )
      );
    end if;
  end loop;

  return v_result;
end;
$$;

grant execute on function public.diagnose_admin_identity_conflicts(jsonb) to anon, authenticated, service_role;
