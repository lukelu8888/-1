create or replace function public.upsert_internal_user_profile(
  p_id uuid,
  p_email text,
  p_name text,
  p_portal_role text,
  p_rbac_role text,
  p_region text,
  p_company text default null,
  p_phone text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_email text := lower(trim(coalesce(p_email, '')));
  v_name text := trim(coalesce(p_name, ''));
  v_portal_role text := lower(trim(coalesce(p_portal_role, 'staff')));
  v_rbac_role text := trim(coalesce(p_rbac_role, 'Sales_Rep'));
  v_region text := trim(coalesce(p_region, 'all'));
begin
  if p_id is null then
    raise exception '缺少用户 id';
  end if;

  if v_email = '' then
    raise exception '缺少用户邮箱';
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
    p_id,
    v_email,
    nullif(v_name, ''),
    v_portal_role,
    v_rbac_role,
    v_region,
    nullif(trim(coalesce(p_company, '')), ''),
    nullif(trim(coalesce(p_phone, '')), ''),
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

  return jsonb_build_object(
    'id', p_id::text,
    'email', v_email
  );
end;
$$;

grant execute on function public.upsert_internal_user_profile(uuid, text, text, text, text, text, text, text) to anon, authenticated, service_role;

create or replace function public.get_internal_user_profile_email(
  p_id uuid
)
returns text
language sql
security definer
set search_path = public, auth, extensions
as $$
  select email
  from public.user_profiles
  where id = p_id
  limit 1;
$$;

grant execute on function public.get_internal_user_profile_email(uuid) to anon, authenticated, service_role;

create or replace function public.save_admin_organization_snapshot(p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_id text := coalesce(nullif(trim(p_payload->>'id'), ''), 'admin-org-001');
  v_updated_at timestamptz;
  v_account jsonb;
  v_internal_accounts jsonb := '[]'::jsonb;
  v_email text;
  v_auth_user_id text;
  v_email_owner_id uuid;
begin
  for v_account in
    select value
    from jsonb_array_elements(coalesce(p_payload->'internal_accounts', '[]'::jsonb))
  loop
    v_email := lower(trim(coalesce(v_account->>'loginEmail', '')));
    v_auth_user_id := trim(coalesce(v_account->>'authUserId', ''));
    v_email_owner_id := null;

    if v_email <> '' then
      select id
      into v_email_owner_id
      from auth.users
      where lower(email) = v_email
      limit 1;
    end if;

    if v_email_owner_id is not null then
      v_account := jsonb_set(v_account, '{authUserId}', to_jsonb(v_email_owner_id::text), true);
    elsif v_auth_user_id = '' then
      v_account := v_account - 'authUserId';
    end if;

    v_internal_accounts := v_internal_accounts || jsonb_build_array(v_account);
  end loop;

  insert into public.admin_organizations (
    id,
    name_cn,
    name_en,
    description_cn,
    description_en,
    phone,
    email,
    contact_person,
    website,
    address_cn,
    address_en,
    tax_id,
    default_currency,
    timezone,
    logo_url,
    rmb_bank,
    usd_bank,
    private_bank,
    internal_contacts,
    internal_accounts,
    document_defaults,
    updated_at
  ) values (
    v_id,
    coalesce(p_payload->>'name_cn', ''),
    coalesce(p_payload->>'name_en', ''),
    coalesce(p_payload->>'description_cn', ''),
    coalesce(p_payload->>'description_en', ''),
    coalesce(p_payload->>'phone', ''),
    coalesce(p_payload->>'email', ''),
    coalesce(p_payload->>'contact_person', ''),
    coalesce(p_payload->>'website', ''),
    coalesce(p_payload->>'address_cn', ''),
    coalesce(p_payload->>'address_en', ''),
    coalesce(p_payload->>'tax_id', ''),
    coalesce(nullif(p_payload->>'default_currency', ''), 'CNY'),
    coalesce(nullif(p_payload->>'timezone', ''), 'Asia/Shanghai'),
    nullif(p_payload->>'logo_url', ''),
    coalesce(p_payload->'rmb_bank', '{}'::jsonb),
    coalesce(p_payload->'usd_bank', '{}'::jsonb),
    coalesce(p_payload->'private_bank', '{}'::jsonb),
    coalesce(p_payload->'internal_contacts', '[]'::jsonb),
    v_internal_accounts,
    coalesce(p_payload->'document_defaults', '{}'::jsonb),
    timezone('utc', now())
  )
  on conflict (id) do update
  set name_cn = excluded.name_cn,
      name_en = excluded.name_en,
      description_cn = excluded.description_cn,
      description_en = excluded.description_en,
      phone = excluded.phone,
      email = excluded.email,
      contact_person = excluded.contact_person,
      website = excluded.website,
      address_cn = excluded.address_cn,
      address_en = excluded.address_en,
      tax_id = excluded.tax_id,
      default_currency = excluded.default_currency,
      timezone = excluded.timezone,
      logo_url = excluded.logo_url,
      rmb_bank = excluded.rmb_bank,
      usd_bank = excluded.usd_bank,
      private_bank = excluded.private_bank,
      internal_contacts = excluded.internal_contacts,
      internal_accounts = excluded.internal_accounts,
      document_defaults = excluded.document_defaults,
      updated_at = timezone('utc', now());

  select updated_at
  into v_updated_at
  from public.admin_organizations
  where id = v_id;

  return jsonb_build_object(
    'id', v_id,
    'updated_at', v_updated_at
  );
end;
$$;

grant execute on function public.save_admin_organization_snapshot(jsonb) to anon, authenticated, service_role;
