create or replace function public.reconcile_admin_org_roster(
  p_org_id text,
  p_internal_contacts jsonb,
  p_internal_accounts jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_org_id text := coalesce(nullif(trim(p_org_id), ''), 'admin-org-001');
  v_name_cn text;
  v_name_en text;
  v_contact jsonb;
  v_account jsonb;
  v_contacts jsonb := coalesce(p_internal_contacts, '[]'::jsonb);
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
  v_identity_owner_id uuid;
  v_auth_user_id_text text;
  v_can_login boolean;
begin
  select name_cn, name_en
  into v_name_cn, v_name_en
  from public.admin_organizations
  where id = v_org_id
  for update;

  if not found then
    raise exception '未找到组织 %', v_org_id;
  end if;

  for v_account in
    select value
    from jsonb_array_elements(coalesce(p_internal_accounts, '[]'::jsonb))
  loop
    v_email := lower(trim(coalesce(v_account->>'loginEmail', '')));
    v_password := coalesce(v_account->>'loginPassword', '');
    v_username := coalesce(v_account->>'username', '');
    v_role := coalesce(nullif(v_account->>'role', ''), 'Admin');
    v_region := coalesce(nullif(v_account->>'region', ''), 'all');
    v_status := coalesce(nullif(v_account->>'accountStatus', ''), 'active');
    v_can_login := coalesce((v_account->>'canLogin')::boolean, false);
    v_auth_user_id_text := coalesce(v_account->>'authUserId', '');

    select value
    into v_contact
    from jsonb_array_elements(coalesce(v_contacts, '[]'::jsonb))
    where value->>'id' = coalesce(v_account->>'employeeId', '')
       or lower(coalesce(value->>'email', '')) = v_email
    limit 1;

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
    v_identity_owner_id := null;

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

      select user_id
      into v_identity_owner_id
      from auth.identities
      where provider = 'email'
        and lower(provider_id) = v_email
      limit 1;
    end if;

    if v_identity_owner_id is not null then
      v_user_id := v_identity_owner_id;
    elsif v_email_owner_id is not null then
      v_user_id := v_email_owner_id;
    end if;

    if v_user_id is null and v_email <> '' and v_password <> '' then
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
    elsif v_user_id is not null then
      update auth.users
      set email = v_email,
          encrypted_password = case
            when v_password <> '' then extensions.crypt(v_password, extensions.gen_salt('bf'))
            else encrypted_password
          end,
          email_confirmed_at = coalesce(email_confirmed_at, timezone('utc', now())),
          raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email')),
          raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('name', v_name, 'portal_role', v_portal_role, 'rbac_role', v_role, 'region', v_region),
          banned_until = case when v_can_login and v_status = 'active' then null else banned_until end,
          updated_at = timezone('utc', now())
      where id = v_user_id;
    end if;

    if v_user_id is not null and v_email <> '' then
      delete from auth.identities
      where provider = 'email'
        and lower(provider_id) = v_email
        and user_id <> v_user_id;

      delete from auth.identities
      where provider = 'email'
        and user_id = v_user_id
        and lower(provider_id) <> v_email;

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
      )
      on conflict (provider_id, provider) do update
      set user_id = excluded.user_id,
          identity_data = excluded.identity_data,
          updated_at = excluded.updated_at;

      perform public.upsert_internal_user_profile(
        v_user_id,
        v_email,
        v_name,
        v_portal_role,
        v_role,
        v_region,
        coalesce(nullif(v_name_en, ''), nullif(v_name_cn, ''), null),
        v_phone
      );

      v_account := jsonb_set(v_account, '{authUserId}', to_jsonb(v_user_id::text), true);
    end if;

    v_accounts := v_accounts || jsonb_build_array(v_account);
  end loop;

  execute 'alter table public.admin_organizations disable trigger trg_sync_admin_internal_accounts_to_auth';

  update public.admin_organizations
  set internal_contacts = v_contacts,
      internal_accounts = v_accounts,
      updated_at = timezone('utc', now())
  where id = v_org_id;

  execute 'alter table public.admin_organizations enable trigger trg_sync_admin_internal_accounts_to_auth';

  return jsonb_build_object(
    'id', v_org_id,
    'contacts', jsonb_array_length(v_contacts),
    'accounts', jsonb_array_length(v_accounts)
  );
exception
  when others then
    begin
      execute 'alter table public.admin_organizations enable trigger trg_sync_admin_internal_accounts_to_auth';
    exception
      when others then
        null;
    end;
    raise;
end;
$$;

grant execute on function public.reconcile_admin_org_roster(text, jsonb, jsonb) to anon, authenticated, service_role;
