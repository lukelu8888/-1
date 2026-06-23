create or replace function public.save_admin_organization_snapshot(p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_id text := coalesce(nullif(trim(p_payload->>'id'), ''), 'admin-org-001');
  v_updated_at timestamptz;
begin
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
    coalesce(p_payload->'internal_accounts', '[]'::jsonb),
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
