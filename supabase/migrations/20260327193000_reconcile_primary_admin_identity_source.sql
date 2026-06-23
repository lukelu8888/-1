do $$
declare
  v_target_email constant text := 'admin@cosunchina.com';
  v_target_username constant text := 'admin';
  v_target_account jsonb;
  v_target_password text;
  v_target_user_id uuid;
begin
  select account
  into v_target_account
  from public.admin_organizations org,
       jsonb_array_elements(coalesce(org.internal_accounts, '[]'::jsonb)) as account
  where org.id = 'admin-org-001'
    and (
      account->>'id' = 'account-admin'
      or lower(coalesce(account->>'loginEmail', '')) = v_target_email
      or lower(coalesce(account->>'username', '')) = v_target_username
    )
  limit 1;

  if v_target_account is null then
    raise notice 'Primary admin account not found in admin_organizations.internal_accounts; skipping reconciliation.';
    return;
  end if;

  v_target_password := nullif(trim(coalesce(v_target_account->>'loginPassword', '')), '');

  update public.admin_organizations
  set internal_accounts = (
    select jsonb_agg(
      case
        when account->>'id' = coalesce(v_target_account->>'id', '')
          or lower(coalesce(account->>'loginEmail', '')) = v_target_email
          or lower(coalesce(account->>'username', '')) = v_target_username
        then jsonb_set(
               jsonb_set(account, '{loginEmail}', to_jsonb(v_target_email), true),
               '{username}', to_jsonb(v_target_username), true
             )
        else account
      end
    )
    from jsonb_array_elements(coalesce(internal_accounts, '[]'::jsonb)) as account
  )
  where id = 'admin-org-001';

  select id
  into v_target_user_id
  from auth.users
  where lower(email) = v_target_email
     or id::text = coalesce(v_target_account->>'authUserId', '')
  limit 1;

  if v_target_user_id is not null then
    update auth.users
    set email = v_target_email,
        encrypted_password = case
          when v_target_password is not null then
            extensions.crypt(v_target_password, extensions.gen_salt('bf'))
          else encrypted_password
        end,
        email_confirmed_at = coalesce(email_confirmed_at, timezone('utc', now())),
        raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email')),
        raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object(
          'name', coalesce(nullif(v_target_account->>'name', ''), '系统管理员'),
          'portal_role', 'admin',
          'rbac_role', coalesce(nullif(v_target_account->>'role', ''), 'Admin'),
          'region', coalesce(nullif(v_target_account->>'region', ''), 'all')
        ),
        updated_at = timezone('utc', now())
    where id = v_target_user_id;

    update auth.identities
    set provider_id = v_target_email,
        identity_data = jsonb_build_object(
          'sub', v_target_user_id::text,
          'email', v_target_email,
          'email_verified', true,
          'phone_verified', false
        ),
        updated_at = timezone('utc', now())
    where user_id = v_target_user_id
      and provider = 'email';

    insert into public.user_profiles (
      id,
      email,
      name,
      portal_role,
      rbac_role,
      region,
      updated_at
    ) values (
      v_target_user_id,
      v_target_email,
      coalesce(nullif(v_target_account->>'name', ''), '系统管理员'),
      'admin',
      coalesce(nullif(v_target_account->>'role', ''), 'Admin'),
      coalesce(nullif(v_target_account->>'region', ''), 'all'),
      timezone('utc', now())
    )
    on conflict (id) do update
    set email = excluded.email,
        name = excluded.name,
        portal_role = excluded.portal_role,
        rbac_role = excluded.rbac_role,
        region = excluded.region,
        updated_at = excluded.updated_at;
  end if;

  update public.admin_organizations
  set internal_accounts = internal_accounts
  where id = 'admin-org-001';
end
$$;
