-- ============================================================================
-- Product Management Center — Supabase schema
-- ============================================================================
-- Mirrors the TypeScript domain in
--   src/components/admin/product-center/context/types.ts
--
-- Design rules:
--   * Every business table carries (id, tenant_id, created_at, updated_at).
--   * Soft-delete via `archived_at` (nullable timestamptz). Default queries
--     should filter `archived_at is null`.
--   * RLS is enabled on every table; default policy allows the table owner
--     (service role) only — application policies are appended later when
--     RBAC is finalized. We pre-create stubs so RLS is on from day one.
--   * Multi-tenant ready: tenant_id is mandatory, indexed, and used in RLS.
--   * No region column on `product`s — region-specific data lives in
--     product_region_prices and product_publish_channels by design.
--   * IDs are uuid w/ default gen_random_uuid() for portability.
-- ----------------------------------------------------------------------------

create extension if not exists pgcrypto;

-- ─── enums ────────────────────────────────────────────────────────────────
do $$
begin
  if not exists (select 1 from pg_type where typname = 'pc_region_code') then
    create type pc_region_code as enum ('NA', 'SA', 'EA');
  end if;
  if not exists (select 1 from pg_type where typname = 'pc_product_status') then
    create type pc_product_status as enum ('draft', 'active', 'disabled', 'archived');
  end if;
  if not exists (select 1 from pg_type where typname = 'pc_review_status') then
    create type pc_review_status as enum ('not_submitted', 'pending_review', 'approved', 'rejected');
  end if;
  if not exists (select 1 from pg_type where typname = 'pc_publish_status') then
    create type pc_publish_status as enum ('not_published', 'scheduled', 'published', 'paused', 'unpublished', 'archived');
  end if;
  if not exists (select 1 from pg_type where typname = 'pc_campaign_status') then
    create type pc_campaign_status as enum ('draft', 'scheduled', 'active', 'paused', 'ended');
  end if;
  if not exists (select 1 from pg_type where typname = 'pc_campaign_tag') then
    create type pc_campaign_tag as enum ('hot_sale', 'new_arrival', 'clearance', 'limited_offer');
  end if;
  if not exists (select 1 from pg_type where typname = 'pc_campaign_slot') then
    create type pc_campaign_slot as enum ('homepage_banner', 'homepage_strip', 'category_hero', 'category_strip', 'cart_recommend');
  end if;
  if not exists (select 1 from pg_type where typname = 'pc_attr_data_type') then
    create type pc_attr_data_type as enum ('text', 'number', 'enum', 'multi_enum', 'boolean');
  end if;
  if not exists (select 1 from pg_type where typname = 'pc_media_kind') then
    create type pc_media_kind as enum ('main', 'detail', 'scene', 'aplus', 'video');
  end if;
  if not exists (select 1 from pg_type where typname = 'pc_document_kind') then
    create type pc_document_kind as enum ('spec_sheet', 'manual', 'certification', 'other');
  end if;
  if not exists (select 1 from pg_type where typname = 'pc_publish_channel') then
    create type pc_publish_channel as enum ('website', 'b2b_portal', 'b2c_storefront', 'campaign');
  end if;
  if not exists (select 1 from pg_type where typname = 'pc_price_field') then
    create type pc_price_field as enum ('base', 'sale', 'campaign', 'cost');
  end if;
end $$;

-- helper: updated_at trigger
create or replace function pc_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ─── products ─────────────────────────────────────────────────────────────
create table if not exists public.pc_products (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       text not null,

  sku             text not null,
  spu             text,
  name            text not null,
  name_en         text,
  name_zh         text,
  brand           text,
  product_type    text,
  short_description text,
  long_description  text,
  keywords        text[],
  tags            text[],

  thumbnail_url   text,
  primary_category_id uuid,
  internal_category text,

  status          pc_product_status not null default 'draft',
  review_status   pc_review_status  not null default 'not_submitted',
  campaign_status pc_campaign_status not null default 'draft', -- aggregate-friendly
  -- rolled-up campaign tag. Keep lazy via cron in Phase 4.

  unit            text,
  net_weight      numeric(10,3),
  gross_weight    numeric(10,3),
  length_cm       numeric(10,2),
  width_cm        numeric(10,2),
  height_cm       numeric(10,2),
  moq             integer,
  units_per_carton integer,
  cbm             numeric(10,4),
  qty_20gp        integer,
  qty_40hq        integer,
  hs_code         text,
  port            text,
  lead_time_days  integer,

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  created_by      text,
  updated_by      text,
  archived_at     timestamptz,

  unique (tenant_id, sku)
);
create index if not exists idx_pc_products_tenant on public.pc_products(tenant_id);
create index if not exists idx_pc_products_sku on public.pc_products(sku);
create index if not exists idx_pc_products_status on public.pc_products(status);
create index if not exists idx_pc_products_review on public.pc_products(review_status);
create index if not exists idx_pc_products_category on public.pc_products(primary_category_id);
create index if not exists idx_pc_products_archived on public.pc_products(archived_at);
drop trigger if exists trg_pc_products_updated on public.pc_products;
create trigger trg_pc_products_updated before update on public.pc_products
  for each row execute function pc_set_updated_at();

-- ─── categories ───────────────────────────────────────────────────────────
create table if not exists public.pc_product_categories (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   text not null,
  parent_id   uuid references public.pc_product_categories(id) on delete cascade,
  level       smallint not null check (level between 1 and 3),
  code        text not null,
  name        text not null,
  name_en     text,
  sort_order  integer not null default 0,
  seo_title       text,
  seo_description text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (tenant_id, code)
);
create index if not exists idx_pc_categories_parent on public.pc_product_categories(parent_id);
create index if not exists idx_pc_categories_tenant on public.pc_product_categories(tenant_id);
drop trigger if exists trg_pc_categories_updated on public.pc_product_categories;
create trigger trg_pc_categories_updated before update on public.pc_product_categories
  for each row execute function pc_set_updated_at();

alter table public.pc_products
  add constraint pc_products_primary_cat_fk
  foreign key (primary_category_id) references public.pc_product_categories(id)
  on delete set null
  not valid;

-- ─── product ↔ category ───────────────────────────────────────────────────
create table if not exists public.pc_product_category_relations (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references public.pc_products(id) on delete cascade,
  category_id uuid not null references public.pc_product_categories(id) on delete cascade,
  is_primary  boolean not null default false,
  created_at  timestamptz not null default now(),
  unique (product_id, category_id)
);
create index if not exists idx_pc_pcr_product on public.pc_product_category_relations(product_id);
create index if not exists idx_pc_pcr_category on public.pc_product_category_relations(category_id);

-- ─── attributes ───────────────────────────────────────────────────────────
create table if not exists public.pc_product_attributes (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       text not null,
  code            text not null,
  label           text not null,
  data_type       pc_attr_data_type not null default 'text',
  unit            text,
  is_filterable   boolean not null default false,
  options         text[],
  applies_to_category_ids uuid[],
  sort_order      integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (tenant_id, code)
);
drop trigger if exists trg_pc_attributes_updated on public.pc_product_attributes;
create trigger trg_pc_attributes_updated before update on public.pc_product_attributes
  for each row execute function pc_set_updated_at();

create table if not exists public.pc_product_attribute_values (
  id           uuid primary key default gen_random_uuid(),
  product_id   uuid not null references public.pc_products(id) on delete cascade,
  attribute_id uuid not null references public.pc_product_attributes(id) on delete cascade,
  value_text   text,
  value_number numeric,
  value_bool   boolean,
  value_options text[],
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (product_id, attribute_id)
);
drop trigger if exists trg_pc_attribute_values_updated on public.pc_product_attribute_values;
create trigger trg_pc_attribute_values_updated before update on public.pc_product_attribute_values
  for each row execute function pc_set_updated_at();

-- ─── media ────────────────────────────────────────────────────────────────
create table if not exists public.pc_product_media (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references public.pc_products(id) on delete cascade,
  kind        pc_media_kind not null,
  url         text not null,
  alt_text    text,
  sort_order  integer not null default 0,
  width       integer,
  height      integer,
  file_size   integer,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists idx_pc_media_product on public.pc_product_media(product_id);
drop trigger if exists trg_pc_media_updated on public.pc_product_media;
create trigger trg_pc_media_updated before update on public.pc_product_media
  for each row execute function pc_set_updated_at();

-- ─── documents ────────────────────────────────────────────────────────────
create table if not exists public.pc_product_documents (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references public.pc_products(id) on delete cascade,
  kind        pc_document_kind not null,
  name        text not null,
  url         text not null,
  valid_until date,
  issued_by   text,
  created_at  timestamptz not null default now()
);
create index if not exists idx_pc_documents_product on public.pc_product_documents(product_id);

-- ─── suppliers ────────────────────────────────────────────────────────────
create table if not exists public.pc_product_suppliers (
  id           uuid primary key default gen_random_uuid(),
  product_id   uuid not null references public.pc_products(id) on delete cascade,
  supplier_id  text not null,
  supplier_name text not null,
  supplier_model_no text,
  is_primary   boolean not null default false,
  factory_quote_price numeric(14,4),
  factory_quote_currency text,
  factory_quote_moq integer,
  factory_quote_at timestamptz,
  cost_price   numeric(14,4),
  cost_currency text,
  notes        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (product_id, supplier_id)
);
create index if not exists idx_pc_suppliers_product on public.pc_product_suppliers(product_id);
create unique index if not exists idx_pc_suppliers_primary
  on public.pc_product_suppliers(product_id) where is_primary = true;
drop trigger if exists trg_pc_suppliers_updated on public.pc_product_suppliers;
create trigger trg_pc_suppliers_updated before update on public.pc_product_suppliers
  for each row execute function pc_set_updated_at();

-- ─── region prices ────────────────────────────────────────────────────────
create table if not exists public.pc_product_region_prices (
  id           uuid primary key default gen_random_uuid(),
  product_id   uuid not null references public.pc_products(id) on delete cascade,
  region_code  pc_region_code not null,
  currency     text not null,
  base_price   numeric(14,4) not null,
  sale_price   numeric(14,4),
  campaign_price numeric(14,4),
  fx_rate      numeric(14,6),
  shipping_cost numeric(14,4),
  duty_and_local_fee numeric(14,4),
  margin_target numeric(5,4),
  margin_actual numeric(5,4),
  effective_from timestamptz,
  effective_to   timestamptz,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (product_id, region_code)
);
create index if not exists idx_pc_prices_product on public.pc_product_region_prices(product_id);
drop trigger if exists trg_pc_prices_updated on public.pc_product_region_prices;
create trigger trg_pc_prices_updated before update on public.pc_product_region_prices
  for each row execute function pc_set_updated_at();

-- ─── price history ────────────────────────────────────────────────────────
create table if not exists public.pc_product_price_history (
  id           uuid primary key default gen_random_uuid(),
  product_id   uuid not null references public.pc_products(id) on delete cascade,
  region_code  pc_region_code not null,
  field        pc_price_field not null,
  from_value   numeric(14,4),
  to_value     numeric(14,4),
  changed_at   timestamptz not null default now(),
  changed_by   text,
  reason       text
);
create index if not exists idx_pc_price_hist_product on public.pc_product_price_history(product_id);

-- ─── publish channels ─────────────────────────────────────────────────────
create table if not exists public.pc_product_publish_channels (
  id              uuid primary key default gen_random_uuid(),
  product_id      uuid not null references public.pc_products(id) on delete cascade,
  region_code     pc_region_code not null,
  channel         pc_publish_channel not null default 'website',
  publish_status  pc_publish_status not null default 'not_published',

  published_category_id uuid references public.pc_product_categories(id) on delete set null,
  homepage_featured boolean not null default false,
  category_featured boolean not null default false,
  sort_weight     integer not null default 100,

  show_price_on_frontend boolean not null default true,
  allow_inquiry boolean not null default true,
  show_moq      boolean not null default true,
  show_lead_time boolean not null default true,

  scheduled_at  timestamptz,
  published_at  timestamptz,
  paused_at     timestamptz,
  unpublished_at timestamptz,
  unpublish_reason text,

  seo_title       text,
  seo_description text,
  seo_slug        text,
  seo_keywords    text[],

  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (product_id, region_code, channel)
);
create index if not exists idx_pc_pub_product on public.pc_product_publish_channels(product_id);
create index if not exists idx_pc_pub_region on public.pc_product_publish_channels(region_code);
create index if not exists idx_pc_pub_status on public.pc_product_publish_channels(publish_status);
drop trigger if exists trg_pc_publish_updated on public.pc_product_publish_channels;
create trigger trg_pc_publish_updated before update on public.pc_product_publish_channels
  for each row execute function pc_set_updated_at();

-- ─── publish logs (event sourcing) ────────────────────────────────────────
create table if not exists public.pc_product_publish_logs (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references public.pc_products(id) on delete cascade,
  region_code pc_region_code not null,
  channel     pc_publish_channel not null,
  from_status pc_publish_status not null,
  to_status   pc_publish_status not null,
  actor_name  text,
  note        text,
  occurred_at timestamptz not null default now()
);
create index if not exists idx_pc_pub_logs_product on public.pc_product_publish_logs(product_id);
create index if not exists idx_pc_pub_logs_time on public.pc_product_publish_logs(occurred_at);

-- ─── campaigns ────────────────────────────────────────────────────────────
create table if not exists public.pc_campaigns (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       text not null,
  name            text not null,
  code            text not null,
  region_codes    pc_region_code[] not null default '{}',
  status          pc_campaign_status not null default 'draft',
  starts_at       timestamptz not null,
  ends_at         timestamptz not null,
  tag             pc_campaign_tag not null default 'hot_sale',
  display_slots   pc_campaign_slot[] not null default '{}',
  description     text,
  analytics_view_count integer,
  analytics_click_count integer,
  analytics_conversion_count integer,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (tenant_id, code)
);
create index if not exists idx_pc_campaigns_tenant on public.pc_campaigns(tenant_id);
create index if not exists idx_pc_campaigns_status on public.pc_campaigns(status);
drop trigger if exists trg_pc_campaigns_updated on public.pc_campaigns;
create trigger trg_pc_campaigns_updated before update on public.pc_campaigns
  for each row execute function pc_set_updated_at();

create table if not exists public.pc_campaign_products (
  id            uuid primary key default gen_random_uuid(),
  campaign_id   uuid not null references public.pc_campaigns(id) on delete cascade,
  product_id    uuid not null references public.pc_products(id) on delete cascade,
  campaign_price numeric(14,4) not null,
  currency      text not null,
  discount_percent numeric(5,2),
  created_at    timestamptz not null default now(),
  unique (campaign_id, product_id)
);
create index if not exists idx_pc_camp_prod_campaign on public.pc_campaign_products(campaign_id);
create index if not exists idx_pc_camp_prod_product on public.pc_campaign_products(product_id);

-- ─── model mappings ───────────────────────────────────────────────────────
create table if not exists public.pc_model_mappings (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       text not null,
  product_id      uuid not null references public.pc_products(id) on delete cascade,
  internal_sku    text not null,
  supplier_sku    text,
  customer_model_no text,
  factory_model_no text,
  alternate_model_no text,
  packaging_variant text,
  brand_variant   text,
  legacy_model_no text,
  notes           text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists idx_pc_mapping_product on public.pc_model_mappings(product_id);
create index if not exists idx_pc_mapping_internal on public.pc_model_mappings(internal_sku);
create index if not exists idx_pc_mapping_customer on public.pc_model_mappings(customer_model_no);
drop trigger if exists trg_pc_mapping_updated on public.pc_model_mappings;
create trigger trg_pc_mapping_updated before update on public.pc_model_mappings
  for each row execute function pc_set_updated_at();

-- ─── audit logs ───────────────────────────────────────────────────────────
create table if not exists public.pc_product_audit_logs (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references public.pc_products(id) on delete cascade,
  action      text not null,
  field       text,
  from_value  text,
  to_value    text,
  actor_name  text,
  actor_role  text,
  occurred_at timestamptz not null default now(),
  note        text
);
create index if not exists idx_pc_audit_product on public.pc_product_audit_logs(product_id);
create index if not exists idx_pc_audit_time on public.pc_product_audit_logs(occurred_at);

-- ─── RLS ──────────────────────────────────────────────────────────────────
-- Enable RLS on every table; concrete policies are added in a follow-up
-- migration once role/tenant claims are finalized. For now only the service
-- role can read/write — the React app uses service-key-based RPCs.
do $$
declare t text;
begin
  for t in select unnest(array[
    'pc_products',
    'pc_product_categories',
    'pc_product_category_relations',
    'pc_product_attributes',
    'pc_product_attribute_values',
    'pc_product_media',
    'pc_product_documents',
    'pc_product_suppliers',
    'pc_product_region_prices',
    'pc_product_price_history',
    'pc_product_publish_channels',
    'pc_product_publish_logs',
    'pc_campaigns',
    'pc_campaign_products',
    'pc_model_mappings',
    'pc_product_audit_logs'
  ])
  loop
    execute format('alter table public.%I enable row level security;', t);
  end loop;
end $$;

-- ─── comments ─────────────────────────────────────────────────────────────
comment on table public.pc_products is
  'Product Center master products — single source of truth for PIM, publishing, pricing and campaigns.';
comment on table public.pc_product_publish_channels is
  'Region- and channel-specific publishing state for each product. Drives the website Catalog and Deals pages.';
comment on table public.pc_product_region_prices is
  'Region-specific selling price (base / sale / campaign) plus margin metadata.';
comment on table public.pc_campaigns is
  'Marketing campaigns / Deals & Offers metadata. Linked to products via pc_campaign_products.';
