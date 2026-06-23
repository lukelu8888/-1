do $$
declare
  v_target_email constant text := 'admin@cosunchina.com';
  v_target_user_id uuid;
  v_target_password text;
begin
  select account->>'loginPassword'
  into v_target_password
  from public.admin_organizations org,
       jsonb_array_elements(coalesce(org.internal_accounts, '[]'::jsonb)) as account
  where org.id = 'admin-org-001'
    and account->>'id' = 'account-admin'
  limit 1;

  update public.admin_organizations
  set internal_accounts = (
    select jsonb_agg(
      case
        when account->>'id' = 'account-admin' then
          jsonb_set(
            jsonb_set(
              account,
              '{loginEmail}', to_jsonb(v_target_email), true
            ),
            '{username}', to_jsonb('admin'::text), true
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
  where email = v_target_email
  limit 1;

  if v_target_user_id is not null then
    update auth.users
    set encrypted_password = case
          when coalesce(trim(v_target_password), '') <> '' then
            extensions.crypt(v_target_password, extensions.gen_salt('bf'))
          else encrypted_password
        end,
        email_confirmed_at = coalesce(email_confirmed_at, timezone('utc', now())),
        raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email')),
        raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('name', '系统管理员'),
        updated_at = timezone('utc', now())
    where id = v_target_user_id;

    update auth.identities
    set identity_data = jsonb_build_object(
          'sub', v_target_user_id::text,
          'email', v_target_email,
          'email_verified', true,
          'phone_verified', false
        ),
        provider_id = v_target_email,
        last_sign_in_at = coalesce(last_sign_in_at, timezone('utc', now())),
        updated_at = timezone('utc', now())
    where user_id = v_target_user_id
      and provider = 'email';
  end if;
end
$$;
