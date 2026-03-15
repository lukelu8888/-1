-- ============================================================
-- Migration 051: Upgrade OEM module persistence to product-level
-- Keep inquiry-level aggregate rows for compatibility while allowing
-- one OEM module per inquiry product.
-- ============================================================

alter table if exists public.inquiry_oem_modules
  add column if not exists product_id text,
  add column if not exists product_name text;

alter table if exists public.inquiry_oem_files
  add column if not exists source_product_id text,
  add column if not exists source_product_name text;

alter table if exists public.inquiry_oem_part_mappings
  add column if not exists source_product_id text,
  add column if not exists source_product_name text;

alter table if exists public.inquiry_oem_modules
  drop constraint if exists inquiry_oem_modules_inquiry_id_key;

drop index if exists idx_inquiry_oem_modules_inquiry_id;

create index if not exists idx_inquiry_oem_modules_inquiry_id
  on public.inquiry_oem_modules (inquiry_id);

create index if not exists idx_inquiry_oem_modules_product_id
  on public.inquiry_oem_modules (product_id)
  where product_id is not null;

create unique index if not exists uq_inquiry_oem_modules_inquiry_aggregate
  on public.inquiry_oem_modules (inquiry_id)
  where product_id is null;

create unique index if not exists uq_inquiry_oem_modules_inquiry_product
  on public.inquiry_oem_modules (inquiry_id, product_id)
  where product_id is not null;

create index if not exists idx_inquiry_oem_files_source_product_id
  on public.inquiry_oem_files (source_product_id)
  where source_product_id is not null;

create index if not exists idx_inquiry_oem_part_mappings_source_product_id
  on public.inquiry_oem_part_mappings (source_product_id)
  where source_product_id is not null;

comment on column public.inquiry_oem_modules.product_id is
  'Customer-side inquiry product id for item-level OEM persistence. Null means inquiry-level aggregate compatibility row.';

comment on column public.inquiry_oem_modules.product_name is
  'Snapshot of the product name associated with the OEM item.';
