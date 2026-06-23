create or replace function public.get_internal_visible_inquiries(
  p_login_email text,
  p_login_password text
)
returns setof public.inquiries
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_org record;
  v_account jsonb;
  v_role text;
  v_region text;
  v_email text;
begin
  v_email := lower(trim(coalesce(p_login_email, '')));

  if v_email = '' or coalesce(p_login_password, '') = '' then
    return;
  end if;

  select id, internal_accounts
  into v_org
  from public.admin_organizations
  where id = 'admin-org-001'
  limit 1;

  if v_org.id is null then
    return;
  end if;

  select value
  into v_account
  from jsonb_array_elements(coalesce(v_org.internal_accounts, '[]'::jsonb))
  where lower(trim(coalesce(value->>'loginEmail', ''))) = v_email
    and coalesce(value->>'loginPassword', '') = coalesce(p_login_password, '')
    and coalesce((value->>'canLogin')::boolean, false) = true
    and lower(trim(coalesce(value->>'accountStatus', 'active'))) = 'active'
  limit 1;

  if v_account is null then
    return;
  end if;

  v_role := coalesce(nullif(trim(v_account->>'role'), ''), 'Admin');
  v_region := upper(coalesce(nullif(trim(v_account->>'region'), ''), 'ALL'));

  if v_role in ('Admin', 'CEO', 'CFO', 'Procurement', 'Finance', 'Documentation_Officer', 'Marketing_Ops', 'Sales_Director') then
    return query
    select *
    from public.inquiries
    order by created_at desc nulls last;
  end if;

  if v_role = 'Regional_Manager' then
    return query
    select *
    from public.inquiries
    where upper(coalesce(region_code, '')) = v_region
    order by created_at desc nulls last;
  end if;

  if v_role = 'Sales_Rep' then
    return query
    select *
    from public.inquiries
    where lower(coalesce(owner_email, '')) = v_email
       or lower(coalesce(assigned_to, '')) = v_email
    order by created_at desc nulls last;
  end if;

  return query
  select *
  from public.inquiries
  order by created_at desc nulls last;
end;
$$;

grant execute on function public.get_internal_visible_inquiries(text, text) to anon, authenticated, service_role;
