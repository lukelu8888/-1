create or replace function public.sync_admin_internal_accounts_to_auth()
returns trigger
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_account jsonb;
  v_old_account jsonb;
  v_contact jsonb;
  v_old_contact jsonb;
  v_accounts jsonb := '[]'::jsonb;
  v_email text;
  v_password text;
  v_username text;
  v_role text;
  v_region text;
  v_status text;
  v_phone text;
  v_name text;
  v_portal_role text;
  v_user_id uuid;
  v_email_owner_id uuid;
  v_auth_user_id_text text;
  v_can_login boolean;
  v_sync_required boolean;
begin
  for v_account in
    select value
    from jsonb_array_elements(coalesce(new.internal_accounts, '[]'::jsonb))
  loop
    select value
    into v_contact
    from jsonb_array_elements(coalesce(new.internal_contacts, '[]'::jsonb))
    where value->>'id' = coalesce(v_account->>'employeeId', '')
    limit 1;

    v_sync_required := true;
    v_old_account := null;
    v_old_contact := null;

    if tg_op = 'UPDATE' then
      select value
      into v_old_account
      from jsonb_array_elements(coalesce(old.internal_accounts, '[]'::jsonb))
      where value->>'id' = coalesce(v_account->>'id', '')
      limit 1;

      if v_old_account is not null then
        select value
        into v_old_contact
        from jsonb_array_elements(coalesce(old.internal_contacts, '[]'::jsonb))
        where value->>'id' = coalesce(v_old_account->>'employeeId', '')
        limit 1;

        v_sync_required := false
          or coalesce(v_old_account->>'loginEmail', '') is distinct from coalesce(v_account->>'loginEmail', '')
          or coalesce(v_old_account->>'loginPassword', '') is distinct from coalesce(v_account->>'loginPassword', '')
          or coalesce(v_old_account->>'username', '') is distinct from coalesce(v_account->>'username', '')
          or coalesce(v_old_account->>'role', '') is distinct from coalesce(v_account->>'role', '')
          or coalesce(v_old_account->>'region', '') is distinct from coalesce(v_account->>'region', '')
          or coalesce(v_old_account->>'accountStatus', '') is distinct from coalesce(v_account->>'accountStatus', '')
          or coalesce(v_old_account->>'authUserId', '') is distinct from coalesce(v_account->>'authUserId', '')
          or coalesce(v_old_account->>'employeeId', '') is distinct from coalesce(v_account->>'employeeId', '')
          or coalesce(v_old_account->>'primaryIdentitySource', '') is distinct from coalesce(v_account->>'primaryIdentitySource', '')
          or coalesce(v_old_account->>'enterpriseWechatUserId', '') is distinct from coalesce(v_account->>'enterpriseWechatUserId', '')
          or coalesce(v_old_account->>'wechatOpenId', '') is distinct from coalesce(v_account->>'wechatOpenId', '')
          or coalesce(v_old_account->>'phoneLogin', '') is distinct from coalesce(v_account->>'phoneLogin', '')
          or coalesce(v_old_account->>'phoneVerified', '') is distinct from coalesce(v_account->>'phoneVerified', '')
          or coalesce(v_old_account->>'emailVerified', '') is distinct from coalesce(v_account->>'emailVerified', '')
          or coalesce(v_old_account->>'canLogin', '') is distinct from coalesce(v_account->>'canLogin', '')
          or coalesce(v_old_contact->>'name', '') is distinct from coalesce(v_contact->>'name', '')
          or coalesce(v_old_contact->>'phone', '') is distinct from coalesce(v_contact->>'phone', '');
      end if;
    end if;

    if not v_sync_required then
      v_accounts := v_accounts || jsonb_build_array(v_account);
      continue;
    end if;

    v_email := lower(trim(coalesce(v_account->>'loginEmail', '')));
    v_password := coalesce(v_account->>'loginPassword', '');
    v_username := coalesce(v_account->>'username', '');
    v_role := coalesce(nullif(v_account->>'role', ''), 'Admin');
    v_region := coalesce(nullif(v_account->>'region', ''), 'all');
    v_status := coalesce(nullif(v_account->>'accountStatus', ''), 'active');
    v_can_login := coalesce((v_account->>'canLogin')::boolean, false);
    v_auth_user_id_text := coalesce(v_account->>'authUserId', '');

    v_name := coalesce(
      nullif(v_contact->>'name', ''),
      nullif(v_username, ''),
      nullif(split_part(v_email, '@', 1), ''),
      '内部账号'
    );
    v_phone := nullif(v_contact->>'phone', '');
    v_portal_role := case when v_role = 'Admin' then 'admin' else 'staff' end;

    v_user_id := null;
    v_email_owner_id := null;

    if v_auth_user_id_text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
      select id
      into v_user_id
      from auth.users
      where id = v_auth_user_id_text::uuid
      limit 1;
    end if;

    if v_email <> '' then
      select id
      into v_email_owner_id
      from auth.users
      where lower(email) = v_email
      limit 1;
    end if;

    if v_email_owner_id is not null then
      v_user_id := v_email_owner_id;
    end if;

    if v_user_id is null and v_email <> '' then
      select id
      into v_user_id
      from auth.users
      where lower(email) = v_email
      limit 1;
    end if;

    if v_email <> '' and v_password <> '' and v_can_login and v_status = 'active' then
      if v_user_id is null then
        v_user_id := gen_random_uuid();

        insert into auth.users (
          instance_id,
          id,
          aud,
          role,
          email,
          encrypted_password,
          email_confirmed_at,
          raw_app_meta_data,
          raw_user_meta_data,
          confirmation_token,
          recovery_token,
          email_change,
          email_change_token_new,
          created_at,
          updated_at,
          is_sso_user,
          is_anonymous
        ) values (
          '00000000-0000-0000-0000-000000000000'::uuid,
          v_user_id,
          'authenticated',
          'authenticated',
          v_email,
          extensions.crypt(v_password, extensions.gen_salt('bf')),
          timezone('utc', now()),
          jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email')),
          jsonb_build_object('name', v_name, 'portal_role', v_portal_role, 'rbac_role', v_role, 'region', v_region),
          '',
          '',
          '',
          '',
          timezone('utc', now()),
          timezone('utc', now()),
          false,
          false
        );
      else
        update auth.users
        set email = v_email,
            encrypted_password = extensions.crypt(v_password, extensions.gen_salt('bf')),
            email_confirmed_at = coalesce(email_confirmed_at, timezone('utc', now())),
            raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email')),
            raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('name', v_name, 'portal_role', v_portal_role, 'rbac_role', v_role, 'region', v_region),
            banned_until = null,
            updated_at = timezone('utc', now())
        where id = v_user_id;
      end if;

      update auth.identities
      set provider_id = v_email,
          identity_data = jsonb_build_object(
            'sub', v_user_id::text,
            'email', v_email,
            'email_verified', true,
            'phone_verified', false
          ),
          updated_at = timezone('utc', now())
      where user_id = v_user_id
        and provider = 'email';

      if not found then
        insert into auth.identities (
          id,
          user_id,
          identity_data,
          provider,
          provider_id,
          created_at,
          updated_at
        ) values (
          gen_random_uuid(),
          v_user_id,
          jsonb_build_object(
            'sub', v_user_id::text,
            'email', v_email,
            'email_verified', true,
            'phone_verified', false
          ),
          'email',
          v_email,
          timezone('utc', now()),
          timezone('utc', now())
        );
      end if;

      insert into public.user_profiles (
        id,
        email,
        name,
        portal_role,
        rbac_role,
        region,
        company,
        phone,
        updated_at
      ) values (
        v_user_id,
        v_email,
        v_name,
        v_portal_role,
        v_role,
        v_region,
        coalesce(nullif(new.name_en, ''), nullif(new.name_cn, ''), null),
        v_phone,
        timezone('utc', now())
      )
      on conflict (id) do update
      set email = excluded.email,
          name = excluded.name,
          portal_role = excluded.portal_role,
          rbac_role = excluded.rbac_role,
          region = excluded.region,
          company = excluded.company,
          phone = excluded.phone,
          updated_at = excluded.updated_at;

      v_account := jsonb_set(v_account, '{authUserId}', to_jsonb(v_user_id::text), true);
    elsif v_user_id is not null then
      update auth.users
      set banned_until = '2999-12-31T00:00:00Z'::timestamptz,
          updated_at = timezone('utc', now())
      where id = v_user_id;

      v_account := jsonb_set(v_account, '{authUserId}', to_jsonb(v_user_id::text), true);
    end if;

    v_accounts := v_accounts || jsonb_build_array(v_account);
  end loop;

  new.internal_accounts := v_accounts;
  return new;
end;
$$;

update public.admin_organizations
set internal_accounts = internal_accounts
where id = 'admin-org-001';
