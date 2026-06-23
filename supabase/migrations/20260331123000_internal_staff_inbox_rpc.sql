create or replace function public.resolve_internal_account_context(
  p_login_email text,
  p_login_password text
)
returns table (
  login_email text,
  role text,
  region text
)
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_org record;
begin
  select id, internal_accounts
  into v_org
  from public.admin_organizations
  where id = 'admin-org-001'
  limit 1;

  if v_org.id is null then
    return;
  end if;

  return query
  select
    lower(trim(coalesce(value->>'loginEmail', ''))) as login_email,
    coalesce(nullif(trim(value->>'role'), ''), 'Admin') as role,
    upper(coalesce(nullif(trim(value->>'region'), ''), 'ALL')) as region
  from jsonb_array_elements(coalesce(v_org.internal_accounts, '[]'::jsonb))
  where lower(trim(coalesce(value->>'loginEmail', ''))) = lower(trim(coalesce(p_login_email, '')))
    and coalesce(value->>'loginPassword', '') = coalesce(p_login_password, '')
    and coalesce((value->>'canLogin')::boolean, false) = true
    and lower(trim(coalesce(value->>'accountStatus', 'active'))) = 'active'
  limit 1;
end;
$$;

create or replace function public.get_internal_visible_notifications(
  p_login_email text,
  p_login_password text
)
returns setof public.notifications
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_account record;
begin
  select *
  into v_account
  from public.resolve_internal_account_context(p_login_email, p_login_password)
  limit 1;

  if v_account.login_email is null then
    return;
  end if;

  return query
  select *
  from public.notifications
  where lower(coalesce(recipient_email, '')) = v_account.login_email
  order by coalesce(created_at_ms, 0) desc, created_at desc nulls last;
end;
$$;

create or replace function public.get_internal_visible_approval_records(
  p_login_email text,
  p_login_password text
)
returns setof public.approval_records
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_account record;
begin
  select *
  into v_account
  from public.resolve_internal_account_context(p_login_email, p_login_password)
  limit 1;

  if v_account.login_email is null then
    return;
  end if;

  if v_account.role in ('Admin', 'CEO', 'CFO', 'Procurement', 'Finance', 'Documentation_Officer', 'Marketing_Ops', 'Sales_Director') then
    return query
    select *
    from public.approval_records
    order by created_at desc nulls last;
  end if;

  return query
  select *
  from public.approval_records
  where lower(coalesce(current_approver, '')) = v_account.login_email
     or lower(coalesce(submitted_by, '')) = v_account.login_email
     or lower(coalesce(actor_email, '')) = v_account.login_email
     or lower(coalesce(approver, '')) = v_account.login_email
     or lower(coalesce(requested_by, '')) = v_account.login_email
  order by created_at desc nulls last;
end;
$$;

create or replace function public.sync_ing_routing_artifacts(
  p_inquiry_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_inquiry public.inquiries%rowtype;
  v_org record;
  v_assigned_email text;
  v_owner_email text;
  v_inquiry_number text;
  v_customer_name text;
  v_customer_email text;
  v_product_summary text;
  v_assigned_account jsonb;
  v_target_sales_email text;
  v_has_dispatch_record boolean;
  v_sales_notification_title text;
  v_sales_notification_message text;
begin
  select *
  into v_inquiry
  from public.inquiries
  where id = p_inquiry_id;

  if v_inquiry.id is null then
    return jsonb_build_object('success', false, 'reason', 'inquiry_not_found');
  end if;

  if coalesce(v_inquiry.is_submitted, false) = false then
    return jsonb_build_object('success', false, 'reason', 'inquiry_not_submitted');
  end if;

  select id, internal_accounts
  into v_org
  from public.admin_organizations
  where id = 'admin-org-001'
  limit 1;

  if v_org.id is null then
    return jsonb_build_object('success', false, 'reason', 'admin_org_not_found');
  end if;

  v_assigned_email := lower(trim(coalesce(v_inquiry.assigned_to, '')));
  v_owner_email := lower(trim(coalesce(v_inquiry.owner_email, '')));
  v_inquiry_number := trim(coalesce(v_inquiry.inquiry_number, v_inquiry.id::text));
  v_customer_name := trim(coalesce(v_inquiry.buyer_company, v_inquiry.buyer_name, v_inquiry.user_email, '客户'));
  v_customer_email := lower(trim(coalesce(v_inquiry.user_email, v_inquiry.buyer_info->>'email', '')));
  v_product_summary := trim(coalesce(v_inquiry.notes, '客户提交了新的 ING'));

  select value
  into v_assigned_account
  from jsonb_array_elements(coalesce(v_org.internal_accounts, '[]'::jsonb))
  where lower(trim(coalesce(value->>'loginEmail', ''))) = v_assigned_email
  limit 1;

  v_has_dispatch_record := exists(
    select 1
    from public.approval_records
    where type = 'ing'
      and related_document_id = v_inquiry_number
      and status in ('pending', 'forwarded', 'pending_approval', 'cancelled', 'approved', 'rejected')
  );

  if v_assigned_email <> ''
    and coalesce(v_assigned_account->>'role', '') = 'Regional_Manager'
    and v_owner_email = '' then

    if not exists(
      select 1
      from public.approval_records
      where type = 'ing'
        and related_document_id = v_inquiry_number
        and lower(coalesce(current_approver, '')) = v_assigned_email
        and status in ('pending', 'forwarded', 'pending_approval')
    ) then
      insert into public.approval_records (
        id,
        type,
        related_document_id,
        related_document_type,
        related_document,
        submitted_by,
        submitted_by_name,
        submitted_by_role,
        submitted_at,
        region,
        current_approver,
        current_approver_role,
        next_approver,
        next_approver_role,
        requires_director_approval,
        status,
        urgency,
        amount,
        currency,
        customer_name,
        customer_email,
        product_summary,
        approval_history,
        deadline,
        entity_type,
        entity_id,
        entity_number,
        actor_email,
        actor_role,
        approver,
        requested_by,
        requested_by_name,
        record_type,
        title,
        description,
        notes,
        created_at,
        updated_at
      ) values (
        gen_random_uuid(),
        'ing',
        v_inquiry_number,
        '客户ING待分发',
        to_jsonb(v_inquiry),
        v_customer_email,
        v_customer_name,
        'Customer',
        coalesce(v_inquiry.submitted_at, now()),
        upper(coalesce(v_inquiry.region_code, 'NA')),
        v_assigned_email,
        'Regional_Manager',
        null,
        null,
        false,
        'pending',
        'normal',
        coalesce(v_inquiry.total_price, 0),
        'USD',
        v_customer_name,
        v_customer_email,
        v_product_summary,
        jsonb_build_array(jsonb_build_object(
          'id', gen_random_uuid(),
          'approver', v_customer_email,
          'approverName', v_customer_name,
          'approverRole', 'Customer',
          'action', 'submitted',
          'comment', '客户提交 ING，等待区域主管分发业务员',
          'timestamp', coalesce(v_inquiry.submitted_at, now())
        )),
        null,
        'ing',
        v_inquiry.id,
        v_inquiry_number,
        v_customer_email,
        'Customer',
        v_assigned_email,
        v_customer_email,
        v_customer_name,
        'ing',
        format('ING Dispatch: %s', v_inquiry_number),
        v_product_summary,
        v_product_summary,
        now(),
        now()
      );
    end if;

    if not exists(
      select 1
      from public.notifications
      where lower(coalesce(recipient_email, '')) = v_assigned_email
        and coalesce(related_id, '') = v_inquiry_number
        and coalesce(title, '') = format('新客户 ING 待分发：%s', v_inquiry_number)
    ) then
      insert into public.notifications (
        id,
        recipient_email,
        type,
        title,
        message,
        related_id,
        related_type,
        sender,
        metadata,
        is_read,
        created_at_ms,
        created_at
      ) values (
        gen_random_uuid(),
        v_assigned_email,
        'inquiry_processing',
        format('新客户 ING 待分发：%s', v_inquiry_number),
        format('%s 提交了新的 ING，请先分配给本区域业务员。', v_customer_name),
        v_inquiry_number,
        'ing',
        v_customer_email,
        jsonb_build_object(
          'routeStage', 'manager_dispatch',
          'customerName', v_customer_name,
          'inquiryId', v_inquiry.id,
          'inquiryNumber', v_inquiry_number,
          'region', upper(coalesce(v_inquiry.region_code, 'NA'))
        ),
        false,
        floor(extract(epoch from now()) * 1000)::bigint,
        now()
      );
    end if;

    return jsonb_build_object('success', true, 'routeStage', 'manager_dispatch', 'inquiryNumber', v_inquiry_number);
  end if;

  v_target_sales_email := case
    when v_owner_email <> '' then v_owner_email
    when v_assigned_email <> '' and coalesce(v_assigned_account->>'role', '') = 'Sales_Rep' then v_assigned_email
    else ''
  end;

  if v_target_sales_email <> '' then
    update public.approval_records
    set
      status = 'cancelled',
      updated_at = now()
    where type = 'ing'
      and related_document_id = v_inquiry_number
      and status in ('pending', 'forwarded', 'pending_approval');

    if v_has_dispatch_record then
      v_sales_notification_title := format('主管已分发 ING：%s', v_inquiry_number);
      v_sales_notification_message := format('%s 的 ING 已由区域主管分发给你，请及时跟进。', v_customer_name);
    else
      v_sales_notification_title := format('客户 ING 已直达：%s', v_inquiry_number);
      v_sales_notification_message := format('%s 提交了新的 ING，系统已按历史对接关系直达给你。', v_customer_name);
    end if;

    if not exists(
      select 1
      from public.notifications
      where lower(coalesce(recipient_email, '')) = v_target_sales_email
        and coalesce(related_id, '') = v_inquiry_number
        and coalesce(title, '') = v_sales_notification_title
    ) then
      insert into public.notifications (
        id,
        recipient_email,
        type,
        title,
        message,
        related_id,
        related_type,
        sender,
        metadata,
        is_read,
        created_at_ms,
        created_at
      ) values (
        gen_random_uuid(),
        v_target_sales_email,
        'inquiry_processing',
        v_sales_notification_title,
        v_sales_notification_message,
        v_inquiry_number,
        'ing',
        coalesce(v_assigned_email, v_customer_email),
        jsonb_build_object(
          'routeStage', case when v_has_dispatch_record then 'manager_assigned_sales_rep' else 'history_sales_rep' end,
          'customerName', v_customer_name,
          'inquiryId', v_inquiry.id,
          'inquiryNumber', v_inquiry_number,
          'region', upper(coalesce(v_inquiry.region_code, 'NA'))
        ),
        false,
        floor(extract(epoch from now()) * 1000)::bigint,
        now()
      );
    end if;

    return jsonb_build_object('success', true, 'routeStage', case when v_has_dispatch_record then 'manager_assigned_sales_rep' else 'history_sales_rep' end, 'inquiryNumber', v_inquiry_number);
  end if;

  return jsonb_build_object('success', true, 'routeStage', 'no_action', 'inquiryNumber', v_inquiry_number);
end;
$$;

grant execute on function public.resolve_internal_account_context(text, text) to anon, authenticated, service_role;
grant execute on function public.get_internal_visible_notifications(text, text) to anon, authenticated, service_role;
grant execute on function public.get_internal_visible_approval_records(text, text) to anon, authenticated, service_role;
grant execute on function public.sync_ing_routing_artifacts(uuid) to anon, authenticated, service_role;
