-- ============================================================================
-- Product Management Center — Phase 4d
-- Server-side full-text search + export + analytics rollup RPCs
-- ============================================================================
-- Layered on top of:
--   * 20260503000000_product_center.sql       (core tables)
--   * 20260503010000_product_center_phase3.sql(supplier quotes, review history)
--   * 20260503020000_product_center_rls_and_rpcs.sql (RLS + state-transition RPCs)
--
-- Goals:
--   1. Full-text search    — Postgres tsvector + GIN index for keyword search
--      across SKU, names, brand, description, keywords, tags. Used when the
--      list dataset grows beyond what the client can comfortably filter
--      in-memory.
--   2. Export              — RPC that joins the wide dataset for one region
--      and returns CSV-friendly rows. The client serializes to CSV; the
--      server only builds the row set so we can leverage RLS + indices.
--   3. Analytics rollup    — single RPC returning a JSON dashboard payload
--      (totals by status / review status, top categories, publish status
--      distribution per region, price summary per region). One round-trip
--      replaces N queries from the client.
-- ----------------------------------------------------------------------------

-- ─── 1. Search ────────────────────────────────────────────────────────────

-- Generated tsvector covers the textual fields that operators search by.
-- We use the 'simple' configuration to avoid stemming surprises across
-- mixed-language data (en + zh cohabit in the same column).
alter table public.pc_products
  add column if not exists search_vector tsvector
    generated always as (
      to_tsvector(
        'simple',
        coalesce(sku, '')             || ' ' ||
        coalesce(spu, '')             || ' ' ||
        coalesce(name, '')            || ' ' ||
        coalesce(name_en, '')         || ' ' ||
        coalesce(name_zh, '')         || ' ' ||
        coalesce(brand, '')           || ' ' ||
        coalesce(short_description,'')|| ' ' ||
        coalesce(long_description, '')|| ' ' ||
        coalesce(array_to_string(keywords, ' '), '') || ' ' ||
        coalesce(array_to_string(tags, ' '), '')
      )
    ) stored;

create index if not exists idx_pc_products_search
  on public.pc_products using gin (search_vector);

-- Trigram index on sku/name/spu so prefix / ILIKE searches stay fast even
-- when the user types something not covered by tsvector tokenization.
create extension if not exists pg_trgm;
create index if not exists idx_pc_products_sku_trgm
  on public.pc_products using gin (sku gin_trgm_ops);
create index if not exists idx_pc_products_name_trgm
  on public.pc_products using gin (name gin_trgm_ops);

-- Search RPC. Returns rows ordered by ts_rank when a keyword is provided,
-- else by updated_at desc. Always tenant- and archive-scoped via the
-- existing RLS policy on `pc_products`.
create or replace function public.pc_search_products(
  p_keyword text default null,
  p_limit   integer default 200
) returns setof public.pc_products
language plpgsql
stable
as $$
declare
  v_kw text := nullif(trim(coalesce(p_keyword, '')), '');
  v_lim integer := greatest(1, least(coalesce(p_limit, 200), 1000));
begin
  if v_kw is null then
    return query
      select *
        from public.pc_products
       where archived_at is null
         and tenant_id = public.pc_current_tenant_id()
       order by updated_at desc
       limit v_lim;
  else
    return query
      select *
        from public.pc_products
       where archived_at is null
         and tenant_id = public.pc_current_tenant_id()
         and (
           search_vector @@ plainto_tsquery('simple', v_kw)
           or sku ilike '%' || v_kw || '%'
           or name ilike '%' || v_kw || '%'
           or coalesce(name_en, '') ilike '%' || v_kw || '%'
         )
       order by ts_rank(search_vector, plainto_tsquery('simple', v_kw)) desc,
                updated_at desc
       limit v_lim;
  end if;
end $$;

-- ─── 2. Export ────────────────────────────────────────────────────────────
-- Wide row set tailored for CSV/Excel. Joins region price + publish status
-- for the requested region in one shot. Tenant-scoped via inner select on
-- `pc_products` (RLS handles it).

create or replace function public.pc_export_products(
  p_region public.pc_region_code default null,
  p_status text default null
) returns table (
  sku                    text,
  name                   text,
  name_en                text,
  name_zh                text,
  brand                  text,
  status                 text,
  review_status          text,
  primary_category_code  text,
  primary_category_name  text,
  region                 text,
  currency               text,
  base_price             numeric,
  sale_price             numeric,
  campaign_price         numeric,
  publish_status         text,
  homepage_featured      boolean,
  category_featured      boolean,
  seo_title              text,
  seo_slug               text,
  primary_supplier       text,
  cost_price             numeric,
  cost_currency          text,
  hs_code                text,
  moq                    integer,
  units_per_carton       integer,
  lead_time_days         integer,
  updated_at             timestamptz
)
language sql
stable
as $$
  select
    p.sku,
    p.name,
    p.name_en,
    p.name_zh,
    p.brand,
    p.status::text,
    p.review_status::text,
    cat.code              as primary_category_code,
    coalesce(cat.name_en, cat.name) as primary_category_name,
    coalesce(rp.region_code::text, p_region::text) as region,
    rp.currency,
    rp.base_price,
    rp.sale_price,
    rp.campaign_price,
    coalesce(ch.publish_status::text, 'not_published') as publish_status,
    coalesce(ch.homepage_featured, false),
    coalesce(ch.category_featured, false),
    ch.seo_title,
    ch.seo_slug,
    sup.supplier_name as primary_supplier,
    sup.cost_price,
    sup.cost_currency,
    p.hs_code,
    p.moq,
    p.units_per_carton,
    p.lead_time_days,
    p.updated_at
  from public.pc_products p
  left join public.pc_product_categories       cat on cat.id = p.primary_category_id
  left join public.pc_product_region_prices    rp
         on rp.product_id = p.id
        and (p_region is null or rp.region_code = p_region)
  left join public.pc_product_publish_channels ch
         on ch.product_id = p.id
        and ch.channel = 'website'
        and (p_region is null or ch.region_code = p_region)
  left join public.pc_product_suppliers        sup
         on sup.product_id = p.id
        and sup.is_primary = true
  where p.archived_at is null
    and p.tenant_id = public.pc_current_tenant_id()
    and (p_status is null or p.status::text = p_status)
  order by p.updated_at desc;
$$;

-- ─── 3. Analytics rollup ──────────────────────────────────────────────────
-- One JSON payload covering all top-line dashboard widgets so the client
-- doesn't fan out N requests on load.

create or replace function public.pc_analytics_rollup(
  p_region public.pc_region_code default null
) returns jsonb
language plpgsql
stable
as $$
declare
  v_tenant text := public.pc_current_tenant_id();
  v_result jsonb;
begin
  with
    -- 1. headline counts (always tenant-scoped)
    totals as (
      select
        count(*)                                                as all_count,
        count(*) filter (where status = 'active')               as active,
        count(*) filter (where status = 'draft')                as draft,
        count(*) filter (where status = 'disabled')             as disabled,
        count(*) filter (where status = 'archived')             as archived,
        count(*) filter (where review_status = 'pending_review') as pending_review,
        count(*) filter (where review_status = 'approved')       as approved,
        count(*) filter (where review_status = 'rejected')       as rejected,
        count(*) filter (where review_status = 'not_submitted')  as not_submitted
      from public.pc_products
      where tenant_id = v_tenant
        and archived_at is null
    ),
    -- 2. top categories
    cat_top as (
      select
        p.primary_category_id            as category_id,
        coalesce(c.name_en, c.name)      as category_name,
        count(*)                         as cnt
      from public.pc_products p
      left join public.pc_product_categories c on c.id = p.primary_category_id
      where p.tenant_id = v_tenant
        and p.archived_at is null
      group by p.primary_category_id, c.name_en, c.name
      order by cnt desc
      limit 20
    ),
    -- 3. publish status distribution per region (filterable)
    pub_dist as (
      select ch.region_code::text as region, ch.publish_status::text as status, count(*) as cnt
        from public.pc_product_publish_channels ch
        join public.pc_products p on p.id = ch.product_id
       where p.tenant_id = v_tenant
         and p.archived_at is null
         and ch.channel = 'website'
         and (p_region is null or ch.region_code = p_region)
       group by ch.region_code, ch.publish_status
    ),
    -- 4. price summary per region
    price_sum as (
      select rp.region_code::text as region,
             max(rp.currency)     as currency,
             count(*)             as price_count,
             round(avg(rp.sale_price), 2)  as avg_sale,
             min(rp.sale_price)   as min_sale,
             max(rp.sale_price)   as max_sale,
             round(avg(rp.base_price), 2)  as avg_base
        from public.pc_product_region_prices rp
        join public.pc_products p on p.id = rp.product_id
       where p.tenant_id = v_tenant
         and p.archived_at is null
         and rp.is_active = true
         and (p_region is null or rp.region_code = p_region)
       group by rp.region_code
    ),
    -- 5. data quality flags (count of products missing image / price / category)
    quality as (
      select
        count(*) filter (where p.thumbnail_url is null
                          and not exists (
                            select 1 from public.pc_product_media m
                             where m.product_id = p.id and m.kind = 'main'
                          )) as missing_image,
        count(*) filter (where p.primary_category_id is null) as missing_category,
        count(*) filter (where not exists (
          select 1 from public.pc_product_region_prices rp
           where rp.product_id = p.id
             and (rp.sale_price is not null or rp.base_price is not null)
        )) as missing_price
      from public.pc_products p
      where p.tenant_id = v_tenant
        and p.archived_at is null
    )
  select jsonb_build_object(
    'generated_at', now(),
    'region_filter', p_region,
    'totals', (
      select jsonb_build_object(
        'all',            t.all_count,
        'active',         t.active,
        'draft',          t.draft,
        'disabled',       t.disabled,
        'archived',       t.archived,
        'pending_review', t.pending_review,
        'approved',       t.approved,
        'rejected',       t.rejected,
        'not_submitted',  t.not_submitted
      ) from totals t
    ),
    'top_categories', coalesce((
      select jsonb_agg(jsonb_build_object(
        'category_id',   category_id,
        'category_name', category_name,
        'count',         cnt
      ) order by cnt desc) from cat_top
    ), '[]'::jsonb),
    'publish_status_by_region', coalesce((
      select jsonb_object_agg(region, status_map)
        from (
          select region, jsonb_object_agg(status, cnt) as status_map
            from pub_dist
           group by region
        ) wrap
    ), '{}'::jsonb),
    'price_summary_by_region', coalesce((
      select jsonb_object_agg(region, jsonb_build_object(
        'count',    price_count,
        'currency', currency,
        'avg_sale', avg_sale,
        'min_sale', min_sale,
        'max_sale', max_sale,
        'avg_base', avg_base
      )) from price_sum
    ), '{}'::jsonb),
    'data_quality', (
      select jsonb_build_object(
        'missing_image',    q.missing_image,
        'missing_category', q.missing_category,
        'missing_price',    q.missing_price
      ) from quality q
    )
  ) into v_result;

  return v_result;
end $$;

-- ─── grants ──────────────────────────────────────────────────────────────
grant execute on function public.pc_search_products(text, integer)            to authenticated;
grant execute on function public.pc_export_products(public.pc_region_code, text) to authenticated;
grant execute on function public.pc_analytics_rollup(public.pc_region_code)   to authenticated;
