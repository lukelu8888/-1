-- Home Depot-style PIM core.
-- Adds category-driven attributes, variants, assets, and search metadata
-- while keeping the existing product catalog tables as the SKU master.

create table if not exists public.category_attribute_templates (
  id text primary key,
  category_id text not null references public.product_categories(id) on delete cascade,
  template_name text not null,
  status text not null default 'active'
    check (status in ('draft', 'active', 'archived')),
  version_no int not null default 1,
  required_score_threshold int not null default 85,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (category_id, version_no)
);

create table if not exists public.category_attributes (
  id text primary key,
  template_id text not null references public.category_attribute_templates(id) on delete cascade,
  attribute_key text not null,
  label text not null,
  data_type text not null default 'text'
    check (data_type in ('text', 'number', 'boolean', 'enum', 'multi_enum', 'dimension', 'file', 'image')),
  unit text,
  options jsonb not null default '[]'::jsonb,
  is_required boolean not null default false,
  is_filterable boolean not null default false,
  is_searchable boolean not null default false,
  is_compliance boolean not null default false,
  display_group text not null default 'Specifications',
  display_order int not null default 100,
  created_at timestamptz not null default now(),
  unique (template_id, attribute_key)
);

create table if not exists public.product_attribute_values (
  id text primary key,
  product_id text not null references public.products(id) on delete cascade,
  attribute_id text not null references public.category_attributes(id) on delete cascade,
  value_text text,
  value_number numeric(14, 4),
  value_boolean boolean,
  value_json jsonb,
  updated_at timestamptz not null default now(),
  unique (product_id, attribute_id)
);

create table if not exists public.product_variants (
  id text primary key,
  parent_product_id text not null references public.products(id) on delete cascade,
  child_product_id text not null references public.products(id) on delete cascade,
  variant_axis text not null,
  variant_value text not null,
  display_order int not null default 100,
  created_at timestamptz not null default now(),
  unique (parent_product_id, child_product_id, variant_axis)
);

create table if not exists public.product_assets (
  id text primary key,
  product_id text not null references public.products(id) on delete cascade,
  asset_type text not null default 'gallery'
    check (asset_type in ('main', 'gallery', 'lifestyle', 'detail', 'dimension', 'packaging', 'certificate', 'manual', 'video')),
  asset_url text not null,
  title text,
  alt_text text,
  sort_order int not null default 100,
  quality_status text not null default 'unchecked'
    check (quality_status in ('unchecked', 'approved', 'needs_review', 'rejected')),
  created_at timestamptz not null default now()
);

create table if not exists public.product_search_index (
  product_id text primary key references public.products(id) on delete cascade,
  search_title text not null default '',
  search_keywords text[] not null default '{}'::text[],
  brand text,
  model_number text,
  internet_sku text,
  category_path text,
  updated_at timestamptz not null default now()
);

create index if not exists idx_category_attribute_templates_category
  on public.category_attribute_templates(category_id, status);

create index if not exists idx_category_attributes_template_filter
  on public.category_attributes(template_id, is_filterable, display_order);

create index if not exists idx_product_attribute_values_product
  on public.product_attribute_values(product_id);

create index if not exists idx_product_assets_product_type
  on public.product_assets(product_id, asset_type, sort_order);

create index if not exists idx_product_search_index_keywords
  on public.product_search_index using gin(search_keywords);

alter table public.category_attribute_templates enable row level security;
alter table public.category_attributes enable row level security;
alter table public.product_attribute_values enable row level security;
alter table public.product_variants enable row level security;
alter table public.product_assets enable row level security;
alter table public.product_search_index enable row level security;

grant select on public.category_attribute_templates to anon, authenticated;
grant select on public.category_attributes to anon, authenticated;
grant select on public.product_attribute_values to anon, authenticated;
grant select on public.product_variants to anon, authenticated;
grant select on public.product_assets to anon, authenticated;
grant select on public.product_search_index to anon, authenticated;

grant insert, update, delete on public.category_attribute_templates to authenticated;
grant insert, update, delete on public.category_attributes to authenticated;
grant insert, update, delete on public.product_attribute_values to authenticated;
grant insert, update, delete on public.product_variants to authenticated;
grant insert, update, delete on public.product_assets to authenticated;
grant insert, update, delete on public.product_search_index to authenticated;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'category_attribute_templates' and policyname = 'Public read category_attribute_templates') then
    create policy "Public read category_attribute_templates" on public.category_attribute_templates for select using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'category_attributes' and policyname = 'Public read category_attributes') then
    create policy "Public read category_attributes" on public.category_attributes for select using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'product_attribute_values' and policyname = 'Public read product_attribute_values') then
    create policy "Public read product_attribute_values" on public.product_attribute_values for select using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'product_variants' and policyname = 'Public read product_variants') then
    create policy "Public read product_variants" on public.product_variants for select using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'product_assets' and policyname = 'Public read product_assets') then
    create policy "Public read product_assets" on public.product_assets for select using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'product_search_index' and policyname = 'Public read product_search_index') then
    create policy "Public read product_search_index" on public.product_search_index for select using (true);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'category_attribute_templates' and policyname = 'category_attribute_templates_write_authenticated') then
    create policy category_attribute_templates_write_authenticated on public.category_attribute_templates for all to authenticated using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'category_attributes' and policyname = 'category_attributes_write_authenticated') then
    create policy category_attributes_write_authenticated on public.category_attributes for all to authenticated using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'product_attribute_values' and policyname = 'product_attribute_values_write_authenticated') then
    create policy product_attribute_values_write_authenticated on public.product_attribute_values for all to authenticated using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'product_variants' and policyname = 'product_variants_write_authenticated') then
    create policy product_variants_write_authenticated on public.product_variants for all to authenticated using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'product_assets' and policyname = 'product_assets_write_authenticated') then
    create policy product_assets_write_authenticated on public.product_assets for all to authenticated using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'product_search_index' and policyname = 'product_search_index_write_authenticated') then
    create policy product_search_index_write_authenticated on public.product_search_index for all to authenticated using (true) with check (true);
  end if;
end $$;

insert into public.category_attribute_templates (id, category_id, template_name, status, version_no, required_score_threshold)
select seed.id, seed.category_id, seed.template_name, seed.status, seed.version_no, seed.required_score_threshold
from (
  values
    ('tmpl-top-freezer-v1', 'top-freezer', 'Top Freezer Refrigerators PDP/PLP Template', 'active', 1, 90),
    ('tmpl-dimensional-lumber-v1', 'dimensional-lumber', 'Dimensional Lumber PDP/PLP Template', 'active', 1, 85),
    ('tmpl-led-bulbs-v1', 'led-bulbs', 'LED Bulbs PDP/PLP Template', 'active', 1, 88)
) as seed(id, category_id, template_name, status, version_no, required_score_threshold)
join public.product_categories pc on pc.id = seed.category_id
on conflict (category_id, version_no) do update set
  template_name = excluded.template_name,
  status = excluded.status,
  required_score_threshold = excluded.required_score_threshold,
  updated_at = now();

insert into public.category_attributes (
  id, template_id, attribute_key, label, data_type, unit, options,
  is_required, is_filterable, is_searchable, is_compliance, display_group, display_order
)
select seed.id, seed.template_id, seed.attribute_key, seed.label, seed.data_type, seed.unit, seed.options::jsonb,
  seed.is_required, seed.is_filterable, seed.is_searchable, seed.is_compliance, seed.display_group, seed.display_order
from (
values
  ('attr-top-freezer-brand', 'tmpl-top-freezer-v1', 'brand', 'Brand', 'text', null, '[]', true, true, true, false, 'Identity', 10),
  ('attr-top-freezer-capacity', 'tmpl-top-freezer-v1', 'capacity_cu_ft', 'Capacity', 'number', 'cu. ft.', '[]', true, true, true, false, 'Specifications', 20),
  ('attr-top-freezer-width', 'tmpl-top-freezer-v1', 'width_in', 'Width', 'number', 'in.', '[]', true, true, true, false, 'Dimensions', 30),
  ('attr-top-freezer-finish', 'tmpl-top-freezer-v1', 'finish', 'Color/Finish', 'enum', null, '["White","Black","Stainless Steel","Fingerprint Resistant Stainless Steel"]', true, true, true, false, 'Specifications', 40),
  ('attr-top-freezer-energy', 'tmpl-top-freezer-v1', 'energy_star', 'ENERGY STAR Certified', 'boolean', null, '[]', false, true, true, true, 'Compliance', 50),
  ('attr-lumber-species', 'tmpl-dimensional-lumber-v1', 'wood_species', 'Wood Species', 'enum', null, '["SPF","Pine","Cedar","Douglas Fir","Hem-Fir"]', true, true, true, false, 'Specifications', 10),
  ('attr-lumber-nominal', 'tmpl-dimensional-lumber-v1', 'nominal_size', 'Nominal Size', 'text', null, '[]', true, true, true, false, 'Dimensions', 20),
  ('attr-lumber-length', 'tmpl-dimensional-lumber-v1', 'length_ft', 'Length', 'number', 'ft.', '[]', true, true, true, false, 'Dimensions', 30),
  ('attr-lumber-treatment', 'tmpl-dimensional-lumber-v1', 'treatment_type', 'Treatment Type', 'enum', null, '["Untreated","Pressure Treated","Kiln Dried","Fire Retardant"]', false, true, true, true, 'Compliance', 40),
  ('attr-led-brand', 'tmpl-led-bulbs-v1', 'brand', 'Brand', 'text', null, '[]', true, true, true, false, 'Identity', 10),
  ('attr-led-wattage', 'tmpl-led-bulbs-v1', 'wattage', 'Wattage', 'number', 'W', '[]', true, true, true, false, 'Specifications', 20),
  ('attr-led-lumens', 'tmpl-led-bulbs-v1', 'lumens', 'Lumens', 'number', 'lm', '[]', true, true, true, false, 'Specifications', 30),
  ('attr-led-color-temp', 'tmpl-led-bulbs-v1', 'color_temperature', 'Color Temperature', 'enum', 'K', '["2700K","3000K","4000K","5000K","6500K"]', true, true, true, false, 'Specifications', 40),
  ('attr-led-certification', 'tmpl-led-bulbs-v1', 'certification', 'Certification', 'multi_enum', null, '["UL","ETL","DLC","Energy Star","CE"]', false, true, true, true, 'Compliance', 50)
) as seed(
  id, template_id, attribute_key, label, data_type, unit, options,
  is_required, is_filterable, is_searchable, is_compliance, display_group, display_order
)
join public.category_attribute_templates template on template.id = seed.template_id
on conflict (template_id, attribute_key) do update set
  label = excluded.label,
  data_type = excluded.data_type,
  unit = excluded.unit,
  options = excluded.options,
  is_required = excluded.is_required,
  is_filterable = excluded.is_filterable,
  is_searchable = excluded.is_searchable,
  is_compliance = excluded.is_compliance,
  display_group = excluded.display_group,
  display_order = excluded.display_order;

comment on table public.category_attribute_templates is
  'Home Depot-style leaf category templates. Each leaf category controls required PDP specs, PLP filters, search fields, and compliance checks.';

comment on table public.product_assets is
  'Structured product media library: main image, gallery, lifestyle, detail, dimension, packaging, certificates, manuals, and videos.';
