-- ============================================================
-- Migration 047: Inquiries + Product Catalog Alignment
-- Aligns Supabase schema with current frontend/runtime expectations.
-- ============================================================

-- ── Inquiries: add fields required by current inquiry flow ──
alter table public.inquiries
  add column if not exists inquiry_number text,
  add column if not exists date text,
  add column if not exists company_id text,
  add column if not exists region_code text,
  add column if not exists is_submitted boolean default false,
  add column if not exists total_price numeric(15, 2) default 0,
  add column if not exists message text,
  add column if not exists buyer_name text,
  add column if not exists buyer_company text,
  add column if not exists buyer_country text,
  add column if not exists notes text,
  add column if not exists assigned_to text,
  add column if not exists buyer_info jsonb default '{}'::jsonb,
  add column if not exists shipping_info jsonb default '{}'::jsonb,
  add column if not exists container_info jsonb,
  add column if not exists submitted_at timestamptz,
  add column if not exists template_id uuid,
  add column if not exists template_version_id uuid,
  add column if not exists template_snapshot jsonb default '{}'::jsonb,
  add column if not exists document_data_snapshot jsonb default '{}'::jsonb,
  add column if not exists document_render_meta jsonb default '{}'::jsonb;

create unique index if not exists idx_inquiries_inquiry_number
  on public.inquiries (inquiry_number)
  where inquiry_number is not null;

create index if not exists idx_inquiries_assigned_to
  on public.inquiries (assigned_to);

create index if not exists idx_inquiries_company_id
  on public.inquiries (company_id);

create index if not exists idx_inquiries_region_code
  on public.inquiries (region_code);

-- Backfill basic denormalized fields from legacy/available data.
update public.inquiries
set inquiry_number = coalesce(inquiry_number, id::text)
where inquiry_number is null;

update public.inquiries
set message = coalesce(message, notes)
where message is null
  and notes is not null;

update public.inquiries
set buyer_name = coalesce(buyer_name, buyer_info ->> 'contactPerson')
where buyer_name is null
  and buyer_info is not null;

update public.inquiries
set buyer_company = coalesce(buyer_company, buyer_info ->> 'companyName')
where buyer_company is null
  and buyer_info is not null;

update public.inquiries
set buyer_country = coalesce(buyer_country, buyer_info ->> 'country')
where buyer_country is null
  and buyer_info is not null;

comment on column public.inquiries.assigned_to is
  'Customer inquiry routing owner, typically the salesperson email.';

comment on column public.inquiries.region_code is
  'Region isolation key, expected values include NA, SA, EA.';

-- ── Product catalog: region-aware filtering + model/image flow ──
alter table public.product_main_categories
  add column if not exists region_code text;

alter table public.product_sub_categories
  add column if not exists region_code text;

alter table public.product_categories
  add column if not exists region_code text;

alter table public.products
  add column if not exists region_code text,
  add column if not exists image text,
  add column if not exists model text;

create index if not exists idx_product_main_categories_region_code
  on public.product_main_categories (region_code);

create index if not exists idx_product_sub_categories_region_code
  on public.product_sub_categories (region_code);

create index if not exists idx_product_categories_region_code
  on public.product_categories (region_code);

create index if not exists idx_products_region_code
  on public.products (region_code);

create index if not exists idx_products_model
  on public.products (model);

comment on column public.products.model is
  'MODEL# / internal product number carried through inquiry and quotation flows.';

comment on column public.products.image is
  'Primary catalog image URL or data URI used by website product selection.';

comment on column public.products.region_code is
  'Region isolation key, expected values include NA, SA, EA. Null means shared catalog item.';

-- Verification helpers (optional)
-- select column_name, data_type
-- from information_schema.columns
-- where table_schema = 'public'
--   and table_name in (
--     'inquiries',
--     'product_main_categories',
--     'product_sub_categories',
--     'product_categories',
--     'products'
--   )
-- order by table_name, ordinal_position;
