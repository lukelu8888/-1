create or replace function public.assign_internal_inquiry_to_sales_rep(
  p_inquiry_id uuid default null,
  p_inquiry_number text default null,
  p_sales_rep_email text default null,
  p_owner_name text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_target_inquiry public.inquiries%rowtype;
  v_sales_rep_email text := lower(trim(coalesce(p_sales_rep_email, '')));
  v_owner_name text := nullif(trim(coalesce(p_owner_name, '')), '');
begin
  if p_inquiry_id is null and nullif(trim(coalesce(p_inquiry_number, '')), '') is null then
    raise exception '缺少询价标识';
  end if;

  if v_sales_rep_email = '' then
    raise exception '缺少业务员邮箱';
  end if;

  if p_inquiry_id is not null then
    select *
    into v_target_inquiry
    from public.inquiries
    where id = p_inquiry_id
    limit 1;
  else
    select *
    into v_target_inquiry
    from public.inquiries
    where inquiry_number = trim(coalesce(p_inquiry_number, ''))
    order by created_at desc nulls last
    limit 1;
  end if;

  if v_target_inquiry.id is null then
    raise exception '未找到要分配的询价单';
  end if;

  update public.inquiries
  set
    assigned_to = v_sales_rep_email,
    owner_email = v_sales_rep_email,
    owner_name = coalesce(v_owner_name, owner_name),
    owner_role = 'Sales_Rep',
    updated_at = timezone('utc', now())
  where id = v_target_inquiry.id;

  select *
  into v_target_inquiry
  from public.inquiries
  where id = v_target_inquiry.id
  limit 1;

  return to_jsonb(v_target_inquiry);
end;
$$;

grant execute on function public.assign_internal_inquiry_to_sales_rep(uuid, text, text, text) to anon, authenticated, service_role;
