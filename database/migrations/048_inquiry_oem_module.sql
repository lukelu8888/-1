-- ============================================================
-- Migration 048: Inquiry OEM Module (Mainline B, Supabase-first)
-- Dedicated tables for OEM / technical document anonymization flow.
-- ============================================================

create table if not exists public.inquiry_oem_modules (
  id uuid primary key default gen_random_uuid(),
  inquiry_id uuid not null references public.inquiries(id) on delete cascade,
  enabled boolean not null default false,
  overall_requirement_note text,
  tooling_cost_involved boolean not null default false,
  first_order_quantity text,
  annual_quantity text,
  quantity_within_three_years text,
  mold_lifetime text,
  forwarding_owner_department text not null default 'Procurement Department',
  customer_selectable_forwarding boolean not null default false,
  replace_customer_identity boolean not null default true,
  replace_part_numbers_with_internal_model_sku boolean not null default true,
  hide_customer_identity_in_factory_docs boolean not null default true,
  factory_facing_owner_department text not null default 'Procurement Department',
  anonymization_status text not null default 'pending',
  replacement_version_status text not null default 'pending',
  factory_forwarding_status text not null default 'internal_hold',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (inquiry_id)
);

create index if not exists idx_inquiry_oem_modules_inquiry_id
  on public.inquiry_oem_modules (inquiry_id);

create table if not exists public.inquiry_oem_files (
  id uuid primary key default gen_random_uuid(),
  inquiry_oem_module_id uuid not null references public.inquiry_oem_modules(id) on delete cascade,
  source_file_uid text,
  file_name text not null,
  file_type text,
  file_size bigint not null default 0,
  description text not null default '',
  customer_part_number text,
  internal_model_number text,
  internal_sku text,
  anonymization_status text not null default 'pending',
  upload_status text not null default 'local',
  storage_bucket text,
  storage_path text,
  storage_url text,
  uploaded_at timestamptz,
  file_last_modified bigint,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_inquiry_oem_files_module_id
  on public.inquiry_oem_files (inquiry_oem_module_id);

create table if not exists public.inquiry_oem_part_mappings (
  id uuid primary key default gen_random_uuid(),
  inquiry_oem_module_id uuid not null references public.inquiry_oem_modules(id) on delete cascade,
  source_mapping_uid text,
  source_file_uid text,
  customer_part_number text not null,
  internal_model_number text not null,
  internal_sku text not null,
  mapping_status text not null default 'pending_internal_assignment',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_inquiry_oem_part_mappings_module_id
  on public.inquiry_oem_part_mappings (inquiry_oem_module_id);

comment on table public.inquiry_oem_modules is
  'Mainline B OEM module master record attached to a customer inquiry.';

comment on table public.inquiry_oem_files is
  'OEM drawings / technical documents uploaded from the customer-side ING flow.';

comment on table public.inquiry_oem_part_mappings is
  'Customer PN to internal MODEL# / SKU mappings for OEM desensitization and replacement.';
