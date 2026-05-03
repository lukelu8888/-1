-- ============================================================================
-- Product Management Center — Phase 4e
-- Bulk import RPC (`pc_bulk_upsert_products`)
-- ============================================================================
-- Symmetric with `pc_export_products` from Phase 4d so the round-trip
--   "导出 → Excel 编辑 → 导入"
-- works without any column mapping. The RPC accepts a JSONB array where
-- each element is one product row in camelCase. For each row we:
--
--   1. Validate required fields (sku, name).
--   2. Resolve `primaryCategoryCode` to category id (if provided).
--   3. UPSERT the product by (tenant_id, sku) — created or updated.
--   4. If region + basePrice are set, upsert the corresponding region price.
--   5. Catch row-level errors and continue with the rest. The caller
--      receives the index, sku and message for each failed row.
--
-- Returns:
--   { created: int, updated: int, errors: [{ index, sku, message }] }
--
-- Tenant scoping is implicit: all writes use `pc_current_tenant_id()`.
-- The function is SECURITY DEFINER so it can write the audit/history rows
-- regardless of the caller's direct table grants. RLS still applies to
-- subsequent reads.
-- ----------------------------------------------------------------------------

create or replace function public.pc_bulk_upsert_products(
  p_rows       jsonb,
  p_actor_name text default null
) returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_tenant      text   := public.pc_current_tenant_id();
  v_row         jsonb;
  v_idx         integer := 0;
  v_created     integer := 0;
  v_updated     integer := 0;
  v_errors      jsonb   := '[]'::jsonb;
  v_existing_id uuid;
  v_product_id  uuid;
  v_cat_id      uuid;
  v_sku         text;
  v_name        text;
begin
  if p_rows is null or jsonb_typeof(p_rows) <> 'array' then
    raise exception 'pc:bulk-import:expected-array' using errcode = '22023';
  end if;

  for v_row in select * from jsonb_array_elements(p_rows)
  loop
    v_idx := v_idx + 1;
    begin
      v_sku  := nullif(trim(coalesce(v_row->>'sku',  '')), '');
      v_name := nullif(trim(coalesce(v_row->>'name', '')), '');

      if v_sku is null then
        raise exception 'pc:missing-sku';
      end if;

      -- resolve category code → id (only when explicitly provided).
      v_cat_id := null;
      if nullif(trim(coalesce(v_row->>'primaryCategoryCode', '')), '') is not null then
        select id into v_cat_id
          from public.pc_product_categories
         where tenant_id = v_tenant
           and code = v_row->>'primaryCategoryCode';
        if v_cat_id is null then
          raise exception 'pc:unknown-category-code:%', v_row->>'primaryCategoryCode';
        end if;
      end if;

      select id into v_existing_id
        from public.pc_products
       where tenant_id = v_tenant and sku = v_sku;

      if v_existing_id is null then
        if v_name is null then
          raise exception 'pc:missing-name';
        end if;
        insert into public.pc_products
          (tenant_id, sku, name, name_en, name_zh, brand,
           status, review_status,
           primary_category_id,
           hs_code, moq, units_per_carton, lead_time_days,
           created_by, updated_by)
        values
          (v_tenant, v_sku, v_name,
           nullif(trim(coalesce(v_row->>'nameEn', '')), ''),
           nullif(trim(coalesce(v_row->>'nameZh', '')), ''),
           nullif(trim(coalesce(v_row->>'brand',  '')), ''),
           coalesce(nullif(v_row->>'status',        '')::public.pc_product_status, 'draft'),
           coalesce(nullif(v_row->>'reviewStatus',  '')::public.pc_review_status,  'not_submitted'),
           v_cat_id,
           nullif(trim(coalesce(v_row->>'hsCode', '')), ''),
           nullif(v_row->>'moq',            '')::integer,
           nullif(v_row->>'unitsPerCarton', '')::integer,
           nullif(v_row->>'leadTimeDays',   '')::integer,
           p_actor_name, p_actor_name)
        returning id into v_product_id;
        v_created := v_created + 1;
      else
        update public.pc_products
           set name             = coalesce(v_name,                                                                                     name),
               name_en          = coalesce(nullif(trim(coalesce(v_row->>'nameEn', '')), ''),                                           name_en),
               name_zh          = coalesce(nullif(trim(coalesce(v_row->>'nameZh', '')), ''),                                           name_zh),
               brand            = coalesce(nullif(trim(coalesce(v_row->>'brand',  '')), ''),                                           brand),
               status           = coalesce(nullif(v_row->>'status',       '')::public.pc_product_status,                               status),
               review_status    = coalesce(nullif(v_row->>'reviewStatus', '')::public.pc_review_status,                                review_status),
               primary_category_id = coalesce(v_cat_id,                                                                                primary_category_id),
               hs_code          = coalesce(nullif(trim(coalesce(v_row->>'hsCode', '')), ''),                                           hs_code),
               moq              = coalesce(nullif(v_row->>'moq',            '')::integer,                                             moq),
               units_per_carton = coalesce(nullif(v_row->>'unitsPerCarton', '')::integer,                                             units_per_carton),
               lead_time_days   = coalesce(nullif(v_row->>'leadTimeDays',   '')::integer,                                             lead_time_days),
               updated_at       = now(),
               updated_by       = coalesce(p_actor_name, updated_by)
         where id = v_existing_id;
        v_product_id := v_existing_id;
        v_updated := v_updated + 1;
      end if;

      -- region + base price (optional)
      if nullif(trim(coalesce(v_row->>'region', '')), '') is not null
         and nullif(v_row->>'basePrice', '') is not null then
        insert into public.pc_product_region_prices
          (product_id, region_code, currency,
           base_price, sale_price, campaign_price)
        values
          (v_product_id,
           (v_row->>'region')::public.pc_region_code,
           coalesce(nullif(trim(coalesce(v_row->>'currency', '')), ''), 'USD'),
           nullif(v_row->>'basePrice',     '')::numeric,
           nullif(v_row->>'salePrice',     '')::numeric,
           nullif(v_row->>'campaignPrice', '')::numeric)
        on conflict (product_id, region_code) do update
          set currency       = excluded.currency,
              base_price     = excluded.base_price,
              sale_price     = coalesce(excluded.sale_price,     public.pc_product_region_prices.sale_price),
              campaign_price = coalesce(excluded.campaign_price, public.pc_product_region_prices.campaign_price),
              updated_at     = now();
      end if;

    exception
      when others then
        v_errors := v_errors || jsonb_build_object(
          'index',   v_idx,
          'sku',     v_row->>'sku',
          'message', SQLERRM
        );
    end;
  end loop;

  return jsonb_build_object(
    'created', v_created,
    'updated', v_updated,
    'errors',  v_errors
  );
end $$;

comment on function public.pc_bulk_upsert_products(jsonb, text) is
  'Bulk upsert products from a JSONB array. Returns counts + per-row errors.';

grant execute on function public.pc_bulk_upsert_products(jsonb, text) to authenticated;
