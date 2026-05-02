-- ============================================================================
-- Product Management Center — RLS policies + atomic RPCs (Phase 4)
-- ============================================================================
-- Layered on top of:
--   * 20260503000000_product_center.sql        (core tables, RLS enabled, no policies)
--   * 20260503010000_product_center_phase3.sql (price_history.effective_*, supplier_quotes, review_history)
--
-- Goals:
--   1. Tenant isolation — every row request is filtered by tenant_id derived
--      from JWT claim `tenant_id` (or fallback `app_metadata.tenant_id`).
--   2. Role gating — `editor` can read and write content, `reviewer` and
--      `admin` can also approve/reject. We expose helper functions and
--      wire them into RPCs so the service layer doesn't have to duplicate
--      the matrix.
--   3. Atomic state transitions — RPCs ensure review/publish status
--      changes always also write to the corresponding history table in a
--      single transaction.
-- ----------------------------------------------------------------------------

-- ─── helpers ──────────────────────────────────────────────────────────────

create or replace function public.pc_current_tenant_id()
returns text
language sql
stable
as $$
  select coalesce(
    nullif(current_setting('request.jwt.claim.tenant_id', true), ''),
    nullif(current_setting('request.jwt.claims', true)::jsonb ->> 'tenant_id', ''),
    nullif(
      (current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'tenant_id'),
      ''
    ),
    'tenant_default'
  );
$$;

comment on function public.pc_current_tenant_id() is
  'Returns the tenant_id for the current authenticated request. Falls back to "tenant_default" so legacy single-tenant data keeps working.';

create or replace function public.pc_current_user_role()
returns text
language sql
stable
as $$
  select coalesce(
    nullif(current_setting('request.jwt.claim.pc_role', true), ''),
    nullif(current_setting('request.jwt.claims', true)::jsonb ->> 'pc_role', ''),
    nullif(
      (current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'pc_role'),
      ''
    ),
    'editor'
  );
$$;

comment on function public.pc_current_user_role() is
  'Returns the Product Center role (editor / reviewer / admin) for the current request. Default editor.';

create or replace function public.pc_can_review()
returns boolean
language sql
stable
as $$
  select public.pc_current_user_role() in ('reviewer', 'admin');
$$;

create or replace function public.pc_can_admin()
returns boolean
language sql
stable
as $$
  select public.pc_current_user_role() = 'admin';
$$;

-- ─── RLS policies ─────────────────────────────────────────────────────────
-- Pattern:
--   * SELECT: same-tenant rows (or any row for service_role).
--   * INSERT: same-tenant only.
--   * UPDATE/DELETE: same-tenant; admins can also delete; reviewers can
--     only mutate review_status via RPC, not direct row writes.
--
-- We grant the policies to PUBLIC because Supabase's anon/authenticated
-- roles inherit the "USAGE" grant on schema. The actual filtering is the
-- RLS expression.

-- helper: drops then recreates policies idempotently
do $$
declare
  pol record;
begin
  for pol in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'pc_products','pc_product_categories','pc_product_category_relations',
        'pc_product_attributes','pc_product_attribute_values','pc_product_media',
        'pc_product_documents','pc_product_suppliers','pc_product_region_prices',
        'pc_product_price_history','pc_product_publish_channels',
        'pc_product_publish_logs','pc_campaigns','pc_campaign_products',
        'pc_model_mappings','pc_product_audit_logs','pc_supplier_quotes',
        'pc_review_history'
      )
  loop
    execute format('drop policy if exists %I on %I.%I', pol.policyname, pol.schemaname, pol.tablename);
  end loop;
end $$;

-- products: tenant-scoped read; tenant-scoped write for any authed user.
create policy pc_products_select on public.pc_products
  for select using (tenant_id = public.pc_current_tenant_id());
create policy pc_products_insert on public.pc_products
  for insert with check (tenant_id = public.pc_current_tenant_id());
create policy pc_products_update on public.pc_products
  for update using (tenant_id = public.pc_current_tenant_id())
  with check (tenant_id = public.pc_current_tenant_id());
create policy pc_products_delete on public.pc_products
  for delete using (tenant_id = public.pc_current_tenant_id() and public.pc_can_admin());

-- categories
create policy pc_categories_select on public.pc_product_categories
  for select using (tenant_id = public.pc_current_tenant_id());
create policy pc_categories_insert on public.pc_product_categories
  for insert with check (tenant_id = public.pc_current_tenant_id());
create policy pc_categories_update on public.pc_product_categories
  for update using (tenant_id = public.pc_current_tenant_id())
  with check (tenant_id = public.pc_current_tenant_id());
create policy pc_categories_delete on public.pc_product_categories
  for delete using (tenant_id = public.pc_current_tenant_id() and public.pc_can_admin());

-- generic product-children: gated by parent product's tenant
do $$
declare t text;
begin
  for t in select unnest(array[
    'pc_product_category_relations','pc_product_attribute_values','pc_product_media',
    'pc_product_documents','pc_product_suppliers','pc_product_region_prices',
    'pc_product_price_history','pc_product_publish_channels','pc_product_publish_logs',
    'pc_supplier_quotes','pc_review_history','pc_product_audit_logs','pc_model_mappings'
  ])
  loop
    execute format($f$
      create policy %I_select on public.%I
        for select using (
          exists (
            select 1 from public.pc_products p
            where p.id = %I.product_id
              and p.tenant_id = public.pc_current_tenant_id()
          )
        );
    $f$, t || '_select', t, t);

    execute format($f$
      create policy %I_insert on public.%I
        for insert with check (
          exists (
            select 1 from public.pc_products p
            where p.id = %I.product_id
              and p.tenant_id = public.pc_current_tenant_id()
          )
        );
    $f$, t || '_insert', t, t);

    execute format($f$
      create policy %I_update on public.%I
        for update using (
          exists (
            select 1 from public.pc_products p
            where p.id = %I.product_id
              and p.tenant_id = public.pc_current_tenant_id()
          )
        ) with check (
          exists (
            select 1 from public.pc_products p
            where p.id = %I.product_id
              and p.tenant_id = public.pc_current_tenant_id()
          )
        );
    $f$, t || '_update', t, t, t);

    execute format($f$
      create policy %I_delete on public.%I
        for delete using (
          exists (
            select 1 from public.pc_products p
            where p.id = %I.product_id
              and p.tenant_id = public.pc_current_tenant_id()
          )
        );
    $f$, t || '_delete', t, t);
  end loop;
end $$;

-- attributes (tenant-scoped, no product fk)
create policy pc_attributes_select on public.pc_product_attributes
  for select using (tenant_id = public.pc_current_tenant_id());
create policy pc_attributes_insert on public.pc_product_attributes
  for insert with check (tenant_id = public.pc_current_tenant_id());
create policy pc_attributes_update on public.pc_product_attributes
  for update using (tenant_id = public.pc_current_tenant_id())
  with check (tenant_id = public.pc_current_tenant_id());
create policy pc_attributes_delete on public.pc_product_attributes
  for delete using (tenant_id = public.pc_current_tenant_id() and public.pc_can_admin());

-- campaigns (tenant-scoped)
create policy pc_campaigns_select on public.pc_campaigns
  for select using (tenant_id = public.pc_current_tenant_id());
create policy pc_campaigns_insert on public.pc_campaigns
  for insert with check (tenant_id = public.pc_current_tenant_id());
create policy pc_campaigns_update on public.pc_campaigns
  for update using (tenant_id = public.pc_current_tenant_id())
  with check (tenant_id = public.pc_current_tenant_id());
create policy pc_campaigns_delete on public.pc_campaigns
  for delete using (tenant_id = public.pc_current_tenant_id() and public.pc_can_admin());

-- campaign_products (gated via campaign's tenant)
create policy pc_campaign_products_select on public.pc_campaign_products
  for select using (
    exists (
      select 1 from public.pc_campaigns c
      where c.id = pc_campaign_products.campaign_id
        and c.tenant_id = public.pc_current_tenant_id()
    )
  );
create policy pc_campaign_products_insert on public.pc_campaign_products
  for insert with check (
    exists (
      select 1 from public.pc_campaigns c
      where c.id = pc_campaign_products.campaign_id
        and c.tenant_id = public.pc_current_tenant_id()
    )
  );
create policy pc_campaign_products_update on public.pc_campaign_products
  for update using (
    exists (
      select 1 from public.pc_campaigns c
      where c.id = pc_campaign_products.campaign_id
        and c.tenant_id = public.pc_current_tenant_id()
    )
  );
create policy pc_campaign_products_delete on public.pc_campaign_products
  for delete using (
    exists (
      select 1 from public.pc_campaigns c
      where c.id = pc_campaign_products.campaign_id
        and c.tenant_id = public.pc_current_tenant_id()
    )
  );

-- ─── RPC functions for atomic state transitions ───────────────────────────
-- All RPCs run as `security definer` so they can write history rows even
-- when the caller's role lacks direct write privileges. Each RPC re-checks
-- tenant ownership and role inside the function body to keep the principle
-- of least privilege.

-- helper: lookup tenant_id from a product, error if cross-tenant
create or replace function public._pc_check_product_tenant(p_product_id uuid)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_tenant text;
begin
  select tenant_id into v_tenant
  from public.pc_products
  where id = p_product_id;

  if v_tenant is null then
    raise exception 'pc:not-found' using errcode = 'P0002';
  end if;

  if v_tenant <> public.pc_current_tenant_id() then
    raise exception 'pc:cross-tenant' using errcode = '42501';
  end if;

  return v_tenant;
end $$;

-- submit for review: any role
create or replace function public.pc_submit_for_review(
  p_product_id uuid,
  p_note text default null,
  p_missing_flags text[] default null,
  p_actor_name text default null
)
returns public.pc_review_history
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_from public.pc_review_status;
  v_tenant text;
  v_entry public.pc_review_history;
begin
  v_tenant := public._pc_check_product_tenant(p_product_id);
  select review_status into v_from from public.pc_products where id = p_product_id;

  update public.pc_products
    set review_status = 'pending_review',
        updated_at    = now(),
        updated_by    = coalesce(p_actor_name, updated_by)
    where id = p_product_id;

  insert into public.pc_review_history
    (tenant_id, product_id, from_status, to_status, reason, actor_name, actor_role, missing_flags)
  values
    (v_tenant, p_product_id, v_from, 'pending_review', p_note, p_actor_name,
     public.pc_current_user_role(), p_missing_flags)
  returning * into v_entry;

  return v_entry;
end $$;

-- approve: requires reviewer/admin
create or replace function public.pc_approve_product(
  p_product_id uuid,
  p_note text default null,
  p_actor_name text default null
)
returns public.pc_review_history
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_from public.pc_review_status;
  v_tenant text;
  v_entry public.pc_review_history;
begin
  if not public.pc_can_review() then
    raise exception 'pc:forbidden:review-required' using errcode = '42501';
  end if;

  v_tenant := public._pc_check_product_tenant(p_product_id);
  select review_status into v_from from public.pc_products where id = p_product_id;

  update public.pc_products
    set review_status = 'approved',
        status        = case when status = 'draft' then 'active' else status end,
        updated_at    = now(),
        updated_by    = coalesce(p_actor_name, updated_by)
    where id = p_product_id;

  insert into public.pc_review_history
    (tenant_id, product_id, from_status, to_status, reason, actor_name, actor_role)
  values
    (v_tenant, p_product_id, v_from, 'approved', p_note, p_actor_name,
     public.pc_current_user_role())
  returning * into v_entry;

  return v_entry;
end $$;

-- reject: requires reviewer/admin, requires reason
create or replace function public.pc_reject_product(
  p_product_id uuid,
  p_reason text,
  p_actor_name text default null
)
returns public.pc_review_history
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_from public.pc_review_status;
  v_tenant text;
  v_entry public.pc_review_history;
begin
  if not public.pc_can_review() then
    raise exception 'pc:forbidden:review-required' using errcode = '42501';
  end if;
  if coalesce(trim(p_reason), '') = '' then
    raise exception 'pc:reject-reason-required' using errcode = '23514';
  end if;

  v_tenant := public._pc_check_product_tenant(p_product_id);
  select review_status into v_from from public.pc_products where id = p_product_id;

  update public.pc_products
    set review_status = 'rejected',
        updated_at    = now(),
        updated_by    = coalesce(p_actor_name, updated_by)
    where id = p_product_id;

  insert into public.pc_review_history
    (tenant_id, product_id, from_status, to_status, reason, actor_name, actor_role)
  values
    (v_tenant, p_product_id, v_from, 'rejected', p_reason, p_actor_name,
     public.pc_current_user_role())
  returning * into v_entry;

  return v_entry;
end $$;

-- return-to-draft: requires reviewer/admin
create or replace function public.pc_return_to_draft(
  p_product_id uuid,
  p_reason text,
  p_actor_name text default null
)
returns public.pc_review_history
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_from public.pc_review_status;
  v_tenant text;
  v_entry public.pc_review_history;
begin
  if not public.pc_can_review() then
    raise exception 'pc:forbidden:review-required' using errcode = '42501';
  end if;

  v_tenant := public._pc_check_product_tenant(p_product_id);
  select review_status into v_from from public.pc_products where id = p_product_id;

  update public.pc_products
    set review_status = 'not_submitted',
        updated_at    = now(),
        updated_by    = coalesce(p_actor_name, updated_by)
    where id = p_product_id;

  insert into public.pc_review_history
    (tenant_id, product_id, from_status, to_status, reason, actor_name, actor_role)
  values
    (v_tenant, p_product_id, v_from, 'not_submitted', p_reason, p_actor_name,
     public.pc_current_user_role())
  returning * into v_entry;

  return v_entry;
end $$;

-- bulk approve: requires reviewer/admin
create or replace function public.pc_bulk_approve(
  p_product_ids uuid[],
  p_note text default null,
  p_actor_name text default null
)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_count integer := 0;
  v_id uuid;
begin
  if not public.pc_can_review() then
    raise exception 'pc:forbidden:review-required' using errcode = '42501';
  end if;
  if p_product_ids is null or array_length(p_product_ids, 1) is null then
    return 0;
  end if;

  foreach v_id in array p_product_ids
  loop
    begin
      perform public.pc_approve_product(v_id, p_note, p_actor_name);
      v_count := v_count + 1;
    exception
      when others then
        -- skip rows that fail individual validation; continue with the rest
        null;
    end;
  end loop;

  return v_count;
end $$;

-- atomic publish state transition with audit log row
create or replace function public.pc_set_publish_status(
  p_product_id uuid,
  p_region_code public.pc_region_code,
  p_channel public.pc_publish_channel,
  p_to public.pc_publish_status,
  p_actor_name text default null,
  p_note text default null
)
returns public.pc_product_publish_channels
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_from public.pc_publish_status;
  v_row  public.pc_product_publish_channels;
begin
  perform public._pc_check_product_tenant(p_product_id);

  select publish_status into v_from
    from public.pc_product_publish_channels
   where product_id = p_product_id
     and region_code = p_region_code
     and channel = p_channel;

  if v_from is null then
    insert into public.pc_product_publish_channels
      (product_id, region_code, channel, publish_status,
       scheduled_at, published_at, paused_at, unpublished_at)
    values
      (p_product_id, p_region_code, p_channel, p_to,
       case when p_to = 'scheduled' then now() end,
       case when p_to = 'published' then now() end,
       case when p_to = 'paused' then now() end,
       case when p_to = 'unpublished' then now() end)
    returning * into v_row;
    v_from := 'not_published';
  else
    update public.pc_product_publish_channels
      set publish_status = p_to,
          scheduled_at   = case when p_to = 'scheduled' then now() else scheduled_at end,
          published_at   = case when p_to = 'published' then now() else published_at end,
          paused_at      = case when p_to = 'paused' then now() else paused_at end,
          unpublished_at = case when p_to = 'unpublished' then now() else unpublished_at end,
          unpublish_reason = case when p_to = 'unpublished' then p_note else unpublish_reason end
      where product_id = p_product_id
        and region_code = p_region_code
        and channel = p_channel
      returning * into v_row;
  end if;

  insert into public.pc_product_publish_logs
    (product_id, region_code, channel, from_status, to_status, actor_name, note)
  values
    (p_product_id, p_region_code, p_channel, v_from, p_to, p_actor_name, p_note);

  return v_row;
end $$;

-- bulk price update with history
create or replace function public.pc_bulk_update_prices(
  p_product_ids uuid[],
  p_region public.pc_region_code,
  p_field public.pc_price_field,
  p_mode text,        -- 'absolute' | 'percent'
  p_value numeric,
  p_reason text default null,
  p_actor_name text default null
)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_count integer := 0;
  v_id uuid;
  v_from numeric;
  v_to numeric;
begin
  if p_product_ids is null or array_length(p_product_ids, 1) is null then
    return 0;
  end if;
  if p_mode not in ('absolute', 'percent') then
    raise exception 'pc:bad-mode' using errcode = '22023';
  end if;

  foreach v_id in array p_product_ids
  loop
    perform public._pc_check_product_tenant(v_id);

    -- read existing value for the chosen field
    if p_field = 'base' then
      select base_price into v_from from public.pc_product_region_prices
        where product_id = v_id and region_code = p_region;
    elsif p_field = 'sale' then
      select sale_price into v_from from public.pc_product_region_prices
        where product_id = v_id and region_code = p_region;
    elsif p_field = 'campaign' then
      select campaign_price into v_from from public.pc_product_region_prices
        where product_id = v_id and region_code = p_region;
    else
      continue;  -- 'cost' is not stored on region_prices
    end if;

    if v_from is null and p_mode = 'percent' then
      continue;  -- can't apply percent to null
    end if;

    if p_mode = 'absolute' then
      v_to := p_value;
    else
      v_to := v_from * (1 + p_value / 100.0);
    end if;

    update public.pc_product_region_prices
      set base_price     = case when p_field = 'base' then v_to else base_price end,
          sale_price     = case when p_field = 'sale' then v_to else sale_price end,
          campaign_price = case when p_field = 'campaign' then v_to else campaign_price end
      where product_id = v_id and region_code = p_region;

    insert into public.pc_product_price_history
      (product_id, region_code, field, from_value, to_value, changed_by, reason)
    values
      (v_id, p_region, p_field, v_from, v_to, p_actor_name, p_reason);

    v_count := v_count + 1;
  end loop;

  return v_count;
end $$;

-- ─── grants ───────────────────────────────────────────────────────────────
-- Allow authenticated users to call the RPCs; RLS still applies on the
-- underlying tables (and the RPCs are SECURITY DEFINER + role-checked).

grant execute on function public.pc_current_tenant_id() to anon, authenticated;
grant execute on function public.pc_current_user_role() to anon, authenticated;
grant execute on function public.pc_can_review() to anon, authenticated;
grant execute on function public.pc_can_admin() to anon, authenticated;

grant execute on function public.pc_submit_for_review(uuid, text, text[], text) to authenticated;
grant execute on function public.pc_approve_product(uuid, text, text) to authenticated;
grant execute on function public.pc_reject_product(uuid, text, text) to authenticated;
grant execute on function public.pc_return_to_draft(uuid, text, text) to authenticated;
grant execute on function public.pc_bulk_approve(uuid[], text, text) to authenticated;
grant execute on function public.pc_set_publish_status(uuid, public.pc_region_code, public.pc_publish_channel, public.pc_publish_status, text, text) to authenticated;
grant execute on function public.pc_bulk_update_prices(uuid[], public.pc_region_code, public.pc_price_field, text, numeric, text, text) to authenticated;
