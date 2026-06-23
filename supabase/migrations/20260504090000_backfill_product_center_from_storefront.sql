-- ============================================================================
-- Backfill Product Center from the live storefront catalog
-- ============================================================================
-- Source of truth before Product Center:
--   * Categories: product_category_nodes
--   * Products:   products + product_publications + product_prices +
--                 product_fulfillment + product_assets
--   * Promotions: promotion_campaigns
--
-- This migration is intentionally additive. It upserts storefront data into
-- pc_* tables and does not delete existing Product Center categories/products.

create or replace function public.pc_uuid_from_text(p_input text)
returns uuid
language sql
immutable
as $$
  select (
    substr(md5(coalesce(p_input, '')), 1, 8) || '-' ||
    substr(md5(coalesce(p_input, '')), 9, 4) || '-' ||
    substr(md5(coalesce(p_input, '')), 13, 4) || '-' ||
    substr(md5(coalesce(p_input, '')), 17, 4) || '-' ||
    substr(md5(coalesce(p_input, '')), 21, 12)
  )::uuid;
$$;

alter table public.pc_product_categories
  drop constraint if exists pc_product_categories_level_check;

alter table public.pc_product_categories
  add constraint pc_product_categories_level_check
  check (level between 1 and 12);

-- ─── 1. Categories ───────────────────────────────────────────────────────
with recursive storefront_tree as (
  select
    node.id,
    node.name,
    node.parent_id,
    node.description,
    node.sort_order,
    node.region_code,
    1::smallint as level,
    array[node.name] as path_names
  from public.product_category_nodes node
  where node.parent_id is null

  union all

  select
    child.id,
    child.name,
    child.parent_id,
    child.description,
    child.sort_order,
    child.region_code,
    (parent.level + 1)::smallint as level,
    parent.path_names || child.name
  from public.product_category_nodes child
  join storefront_tree parent on parent.id = child.parent_id
  where parent.level < 12
)
insert into public.pc_product_categories (
  id,
  tenant_id,
  parent_id,
  level,
  code,
  name,
  name_en,
  sort_order,
  seo_title,
  seo_description,
  is_active
)
select
  public.pc_uuid_from_text('storefront-category:' || tree.id),
  'tenant_default',
  case
    when tree.parent_id is null then null
    else public.pc_uuid_from_text('storefront-category:' || tree.parent_id)
  end,
  tree.level,
  'storefront:' || tree.id,
  tree.name,
  tree.name,
  coalesce(tree.sort_order, 100),
  'Wholesale ' || tree.name,
  'Bulk ' || tree.name || ' products for B2B and contractor markets.',
  true
from storefront_tree tree
on conflict (tenant_id, code) do update set
  parent_id = excluded.parent_id,
  level = excluded.level,
  name = excluded.name,
  name_en = excluded.name_en,
  sort_order = excluded.sort_order,
  seo_title = excluded.seo_title,
  seo_description = excluded.seo_description,
  is_active = true,
  updated_at = now();

-- ─── 2. Products ─────────────────────────────────────────────────────────
with legacy_products as (
  select
    p.*,
    pub.publish_type,
    pub.publish_status,
    price.currency,
    price.unit as price_unit,
    price.sale_price,
    price.compare_at_price,
    price.valid_from,
    price.valid_until,
    price.status as price_status,
    fulfill.moq as fulfill_moq,
    fulfill.quantity_step,
    fulfill.stock_quantity,
    fulfill.stock_unit,
    fulfill.eta_text,
    pc_cat.id as pc_category_id,
    cat_path.path as category_path
  from public.products p
  left join lateral (
    select *
    from public.product_publications pp
    where pp.product_id = p.id
    order by
      case
        when pp.region_code = p.region_code then 0
        when pp.region_code is null then 1
        else 2
      end,
      pp.updated_at desc
    limit 1
  ) pub on true
  left join lateral (
    select *
    from public.product_prices pr
    where pr.product_id = p.id
      and pr.price_type = 'website'
    order by
      case
        when pr.region_code = p.region_code then 0
        when pr.region_code is null then 1
        else 2
      end,
      pr.updated_at desc
    limit 1
  ) price on true
  left join lateral (
    select *
    from public.product_fulfillment pf
    where pf.product_id = p.id
    order by
      case
        when pf.region_code = p.region_code then 0
        when pf.region_code is null then 1
        else 2
      end,
      pf.updated_at desc
    limit 1
  ) fulfill on true
  left join public.pc_product_categories pc_cat
    on pc_cat.id = public.pc_uuid_from_text('storefront-category:' || p.category_id)
  left join lateral (
    with recursive path_node as (
      select node.id, node.name, node.parent_id, array[node.name] as names
      from public.product_category_nodes node
      where node.id = p.category_id

      union all

      select parent.id, parent.name, parent.parent_id, array[parent.name] || path_node.names
      from public.product_category_nodes parent
      join path_node on path_node.parent_id = parent.id
    )
    select array_to_string(names, ' / ') as path
    from path_node
    where parent_id is null
    limit 1
  ) cat_path on true
)
insert into public.pc_products (
  id,
  tenant_id,
  sku,
  name,
  name_en,
  name_zh,
  brand,
  product_type,
  short_description,
  keywords,
  tags,
  thumbnail_url,
  primary_category_id,
  internal_category,
  status,
  review_status,
  campaign_status,
  unit,
  net_weight,
  gross_weight,
  length_cm,
  width_cm,
  height_cm,
  moq,
  units_per_carton,
  created_by,
  updated_by
)
select
  public.pc_uuid_from_text('storefront-product:' || legacy.id),
  'tenant_default',
  coalesce(nullif(legacy.model, ''), legacy.id),
  legacy.name,
  legacy.name,
  legacy.name,
  nullif(legacy.specifications ->> 'Brand', ''),
  'storefront',
  nullif(legacy.specifications ->> 'Description', ''),
  array_remove(array[
    nullif(legacy.specifications ->> 'Brand', ''),
    nullif(legacy.specifications ->> 'Material', ''),
    nullif(legacy.specifications ->> 'Finish', ''),
    nullif(legacy.specifications ->> 'Color', '')
  ], null),
  array_remove(array[
    nullif(legacy.publish_type, ''),
    nullif(legacy.specifications ->> 'Deal Tag', '')
  ], null),
  nullif(legacy.image, ''),
  legacy.pc_category_id,
  legacy.category_path,
  case
    when legacy.publish_status = 'offline' then 'disabled'::public.pc_product_status
    else 'active'::public.pc_product_status
  end,
  case
    when coalesce(legacy.publish_status, 'published') = 'published' then 'approved'::public.pc_review_status
    else 'not_submitted'::public.pc_review_status
  end,
  case
    when coalesce(legacy.publish_type, '') in ('deal', 'bulk-container', 'clearance') then 'active'::public.pc_campaign_status
    else 'draft'::public.pc_campaign_status
  end,
  coalesce(nullif(legacy.price_unit, ''), nullif(legacy.specifications ->> 'Unit', ''), 'pc'),
  legacy.net_weight,
  legacy.gross_weight,
  legacy.carton_length,
  legacy.carton_width,
  legacy.carton_height,
  greatest(coalesce(legacy.fulfill_moq::integer, legacy.units_per_carton::integer, 1), 1),
  greatest(coalesce(legacy.units_per_carton::integer, 1), 1),
  'storefront-backfill',
  'storefront-backfill'
from legacy_products legacy
on conflict (tenant_id, sku) do update set
  name = excluded.name,
  name_en = excluded.name_en,
  name_zh = excluded.name_zh,
  brand = excluded.brand,
  product_type = excluded.product_type,
  short_description = excluded.short_description,
  keywords = excluded.keywords,
  tags = excluded.tags,
  thumbnail_url = excluded.thumbnail_url,
  primary_category_id = coalesce(excluded.primary_category_id, public.pc_products.primary_category_id),
  internal_category = coalesce(excluded.internal_category, public.pc_products.internal_category),
  status = excluded.status,
  review_status = excluded.review_status,
  campaign_status = excluded.campaign_status,
  unit = excluded.unit,
  net_weight = excluded.net_weight,
  gross_weight = excluded.gross_weight,
  length_cm = excluded.length_cm,
  width_cm = excluded.width_cm,
  height_cm = excluded.height_cm,
  moq = excluded.moq,
  units_per_carton = excluded.units_per_carton,
  updated_by = 'storefront-backfill',
  updated_at = now();

-- Primary category relation.
insert into public.pc_product_category_relations (product_id, category_id, is_primary)
select product.id, category.id, true
from public.products legacy
join public.pc_products product
  on product.tenant_id = 'tenant_default'
 and product.sku = coalesce(nullif(legacy.model, ''), legacy.id)
join public.pc_product_categories category
  on category.id = public.pc_uuid_from_text('storefront-category:' || legacy.category_id)
on conflict (product_id, category_id) do update set
  is_primary = true;

-- Main image/media.
insert into public.pc_product_media (id, product_id, kind, url, alt_text, sort_order)
select
  public.pc_uuid_from_text('storefront-media:' || legacy.id || ':main'),
  product.id,
  'main'::public.pc_media_kind,
  legacy.image,
  legacy.name,
  10
from public.products legacy
join public.pc_products product
  on product.tenant_id = 'tenant_default'
 and product.sku = coalesce(nullif(legacy.model, ''), legacy.id)
where nullif(legacy.image, '') is not null
on conflict (id) do update set
  url = excluded.url,
  alt_text = excluded.alt_text,
  sort_order = excluded.sort_order,
  updated_at = now();

-- Region prices.
insert into public.pc_product_region_prices (
  product_id,
  region_code,
  currency,
  base_price,
  sale_price,
  campaign_price,
  effective_from,
  effective_to,
  is_active
)
select
  product.id,
  case upper(coalesce(price.region_code, legacy.region_code, 'NA'))
    when 'SA' then 'SA'::public.pc_region_code
    when 'EA' then 'EA'::public.pc_region_code
    else 'NA'::public.pc_region_code
  end,
  coalesce(nullif(price.currency, ''), 'USD'),
  greatest(coalesce(price.compare_at_price, 0), coalesce(price.sale_price, legacy.price, 0), 0),
  case
    when coalesce(price.compare_at_price, 0) > coalesce(price.sale_price, legacy.price, 0)
      then coalesce(price.sale_price, legacy.price)
    else null
  end,
  case
    when coalesce(pub.publish_type, '') in ('deal', 'bulk-container', 'clearance')
      then coalesce(price.sale_price, legacy.price, 0)
    else null
  end,
  price.valid_from,
  price.valid_until,
  coalesce(price.status, 'active') in ('active', 'scheduled')
from public.products legacy
join public.pc_products product
  on product.tenant_id = 'tenant_default'
 and product.sku = coalesce(nullif(legacy.model, ''), legacy.id)
left join public.product_prices price
  on price.product_id = legacy.id
 and price.price_type = 'website'
left join public.product_publications pub
  on pub.product_id = legacy.id
 and coalesce(pub.region_code, coalesce(legacy.region_code, 'NA')) = coalesce(price.region_code, legacy.region_code, 'NA')
where coalesce(price.sale_price, legacy.price) is not null
on conflict (product_id, region_code) do update set
  currency = excluded.currency,
  base_price = excluded.base_price,
  sale_price = excluded.sale_price,
  campaign_price = excluded.campaign_price,
  effective_from = excluded.effective_from,
  effective_to = excluded.effective_to,
  is_active = excluded.is_active,
  updated_at = now();

-- Website publication channel.
insert into public.pc_product_publish_channels (
  product_id,
  region_code,
  channel,
  publish_status,
  published_category_id,
  homepage_featured,
  category_featured,
  sort_weight,
  show_price_on_frontend,
  allow_inquiry,
  show_moq,
  show_lead_time,
  published_at,
  seo_title,
  seo_description,
  seo_slug
)
select
  product.id,
  case upper(coalesce(pub.region_code, legacy.region_code, 'NA'))
    when 'SA' then 'SA'::public.pc_region_code
    when 'EA' then 'EA'::public.pc_region_code
    else 'NA'::public.pc_region_code
  end,
  'website'::public.pc_publish_channel,
  case coalesce(pub.publish_status, 'published')
    when 'published' then 'published'::public.pc_publish_status
    when 'offline' then 'unpublished'::public.pc_publish_status
    else 'not_published'::public.pc_publish_status
  end,
  category.id,
  coalesce(pub.publish_type, '') in ('deal', 'new-arrival', 'bulk-container'),
  true,
  coalesce(pub.display_priority, 100),
  true,
  true,
  true,
  true,
  case when coalesce(pub.publish_status, 'published') = 'published' then now() else null end,
  legacy.name,
  nullif(legacy.specifications ->> 'Description', ''),
  regexp_replace(lower(coalesce(nullif(legacy.model, ''), legacy.id)), '[^a-z0-9]+', '-', 'g')
from public.products legacy
join public.pc_products product
  on product.tenant_id = 'tenant_default'
 and product.sku = coalesce(nullif(legacy.model, ''), legacy.id)
left join public.product_publications pub on pub.product_id = legacy.id
left join public.pc_product_categories category
  on category.id = public.pc_uuid_from_text('storefront-category:' || legacy.category_id)
on conflict (product_id, region_code, channel) do update set
  publish_status = excluded.publish_status,
  published_category_id = excluded.published_category_id,
  homepage_featured = excluded.homepage_featured,
  category_featured = excluded.category_featured,
  sort_weight = excluded.sort_weight,
  show_price_on_frontend = excluded.show_price_on_frontend,
  allow_inquiry = excluded.allow_inquiry,
  show_moq = excluded.show_moq,
  show_lead_time = excluded.show_lead_time,
  seo_title = excluded.seo_title,
  seo_description = excluded.seo_description,
  seo_slug = excluded.seo_slug,
  updated_at = now();

-- ─── 3. Promotion campaigns ─────────────────────────────────────────────
insert into public.pc_campaigns (
  id,
  tenant_id,
  name,
  code,
  region_codes,
  status,
  starts_at,
  ends_at,
  tag,
  display_slots,
  description
)
select
  public.pc_uuid_from_text('storefront-campaign:' || campaign.id),
  'tenant_default',
  campaign.name,
  'storefront:' || campaign.id,
  array[
    case upper(coalesce(campaign.region_code, 'NA'))
      when 'SA' then 'SA'::public.pc_region_code
      when 'EA' then 'EA'::public.pc_region_code
      else 'NA'::public.pc_region_code
    end
  ],
  case
    when coalesce(campaign.status, 'published') = 'draft' then 'draft'::public.pc_campaign_status
    when campaign.start_date > current_date then 'scheduled'::public.pc_campaign_status
    when campaign.end_date < current_date then 'ended'::public.pc_campaign_status
    else 'active'::public.pc_campaign_status
  end,
  campaign.start_date::timestamptz,
  (campaign.end_date::timestamp + interval '23 hours 59 minutes 59 seconds')::timestamptz,
  case campaign.type
    when 'clearance' then 'clearance'::public.pc_campaign_tag
    when 'flash' then 'limited_offer'::public.pc_campaign_tag
    else 'hot_sale'::public.pc_campaign_tag
  end,
  array['homepage_banner'::public.pc_campaign_slot, 'homepage_strip'::public.pc_campaign_slot],
  trim(both from concat_ws(E'\n', nullif(campaign.headline, ''), nullif(campaign.description, '')))
from public.promotion_campaigns campaign
on conflict (tenant_id, code) do update set
  name = excluded.name,
  region_codes = excluded.region_codes,
  status = excluded.status,
  starts_at = excluded.starts_at,
  ends_at = excluded.ends_at,
  tag = excluded.tag,
  display_slots = excluded.display_slots,
  description = excluded.description,
  updated_at = now();

insert into public.pc_campaign_products (
  campaign_id,
  product_id,
  campaign_price,
  currency,
  discount_percent
)
select
  pc_campaign.id,
  pc_product.id,
  greatest(coalesce(price.sale_price, legacy.price, 0), 0),
  coalesce(nullif(price.currency, ''), 'USD'),
  case
    when coalesce(price.compare_at_price, 0) > coalesce(price.sale_price, legacy.price, 0)
      then round(((price.compare_at_price - coalesce(price.sale_price, legacy.price, 0)) / price.compare_at_price * 100)::numeric, 2)
    else null
  end
from public.promotion_campaigns campaign
join public.pc_campaigns pc_campaign
  on pc_campaign.tenant_id = 'tenant_default'
 and pc_campaign.code = 'storefront:' || campaign.id
cross join lateral unnest(campaign.product_ids) as campaign_product(product_id)
join public.products legacy on legacy.id = campaign_product.product_id
join public.pc_products pc_product
  on pc_product.tenant_id = 'tenant_default'
 and pc_product.sku = coalesce(nullif(legacy.model, ''), legacy.id)
left join public.product_prices price
  on price.product_id = legacy.id
 and price.price_type = 'website'
 and coalesce(price.region_code, coalesce(legacy.region_code, 'NA')) = coalesce(campaign.region_code, legacy.region_code, 'NA')
on conflict (campaign_id, product_id) do update set
  campaign_price = excluded.campaign_price,
  currency = excluded.currency,
  discount_percent = excluded.discount_percent;

comment on function public.pc_uuid_from_text(text) is
  'Deterministic UUID helper used to map legacy storefront text ids into Product Center uuid ids.';
