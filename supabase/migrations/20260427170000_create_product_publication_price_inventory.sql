-- Product catalog PIM layer.
-- Keeps products as the core SKU master while moving website publishing,
-- price, and fulfillment data into structured tables.

create table if not exists public.product_publications (
  id text primary key,
  product_id text not null references public.products(id) on delete cascade,
  region_code text,
  publish_type text not null default 'standard'
    check (publish_type in ('standard', 'deal', 'new-arrival', 'bulk-container')),
  publish_status text not null default 'published'
    check (publish_status in ('published', 'draft', 'offline')),
  display_priority int not null default 100,
  promotion_label text,
  front_tag text,
  website_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, region_code)
);

create table if not exists public.product_prices (
  id text primary key,
  product_id text not null references public.products(id) on delete cascade,
  region_code text,
  currency text not null default 'USD',
  unit text not null default 'pc',
  sale_price numeric(14, 4) not null check (sale_price >= 0),
  compare_at_price numeric(14, 4),
  price_type text not null default 'website'
    check (price_type in ('website', 'contract', 'volume', 'clearance')),
  valid_from date,
  valid_until date,
  status text not null default 'active'
    check (status in ('active', 'scheduled', 'expired', 'disabled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, region_code, currency, price_type)
);

create table if not exists public.product_fulfillment (
  id text primary key,
  product_id text not null references public.products(id) on delete cascade,
  region_code text,
  moq numeric(14, 3) not null default 1,
  quantity_step numeric(14, 3) not null default 1,
  stock_quantity numeric(14, 3),
  stock_unit text,
  eta_text text,
  warehouse_code text,
  fulfillment_status text not null default 'available'
    check (fulfillment_status in ('available', 'limited', 'preorder', 'out-of-stock')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, region_code)
);

create index if not exists idx_product_publications_product_region
  on public.product_publications(product_id, region_code);

create index if not exists idx_product_publications_status_type
  on public.product_publications(publish_status, publish_type, display_priority);

create index if not exists idx_product_prices_product_region
  on public.product_prices(product_id, region_code, status);

create index if not exists idx_product_fulfillment_product_region
  on public.product_fulfillment(product_id, region_code);

alter table public.product_publications enable row level security;
alter table public.product_prices enable row level security;
alter table public.product_fulfillment enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'product_publications'
      and policyname = 'Public read product_publications'
  ) then
    create policy "Public read product_publications"
      on public.product_publications
      for select
      using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'product_prices'
      and policyname = 'Public read product_prices'
  ) then
    create policy "Public read product_prices"
      on public.product_prices
      for select
      using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'product_fulfillment'
      and policyname = 'Public read product_fulfillment'
  ) then
    create policy "Public read product_fulfillment"
      on public.product_fulfillment
      for select
      using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'product_publications'
      and policyname = 'product_publications_write_authenticated'
  ) then
    create policy product_publications_write_authenticated
      on public.product_publications
      for all
      to authenticated
      using (true)
      with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'product_prices'
      and policyname = 'product_prices_write_authenticated'
  ) then
    create policy product_prices_write_authenticated
      on public.product_prices
      for all
      to authenticated
      using (true)
      with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'product_fulfillment'
      and policyname = 'product_fulfillment_write_authenticated'
  ) then
    create policy product_fulfillment_write_authenticated
      on public.product_fulfillment
      for all
      to authenticated
      using (true)
      with check (true);
  end if;
end $$;

insert into public.product_publications (
  id,
  product_id,
  region_code,
  publish_type,
  publish_status,
  display_priority,
  promotion_label,
  front_tag,
  updated_at
)
select
  p.id || '-' || coalesce(p.region_code, 'shared') || '-website-publication',
  p.id,
  p.region_code,
  coalesce(nullif(p.specifications->>'Publish Type', ''), 'standard'),
  coalesce(nullif(p.specifications->>'Publish Status', ''), 'published'),
  coalesce(nullif(regexp_replace(coalesce(p.specifications->>'Display Priority', ''), '[^0-9-]', '', 'g'), '')::int, 100),
  nullif(coalesce(p.specifications->>'Discount', p.specifications->>'Deal Label'), ''),
  nullif(p.specifications->>'Deal Tag', ''),
  now()
from public.products p
on conflict (product_id, region_code) do update set
  publish_type = excluded.publish_type,
  publish_status = excluded.publish_status,
  display_priority = excluded.display_priority,
  promotion_label = excluded.promotion_label,
  front_tag = excluded.front_tag,
  updated_at = now();

insert into public.product_prices (
  id,
  product_id,
  region_code,
  currency,
  unit,
  sale_price,
  compare_at_price,
  price_type,
  valid_until,
  status,
  updated_at
)
select
  p.id || '-' || coalesce(p.region_code, 'shared') || '-usd-website',
  p.id,
  p.region_code,
  'USD',
  coalesce(nullif(p.specifications->>'Unit', ''), 'pc'),
  coalesce(p.price, 0),
  nullif(regexp_replace(coalesce(p.specifications->>'Original Price', p.specifications->>'Compare Price', ''), '[^0-9.-]', '', 'g'), '')::numeric,
  'website',
  null,
  case when coalesce(p.price, 0) > 0 then 'active' else 'disabled' end,
  now()
from public.products p
on conflict (product_id, region_code, currency, price_type) do update set
  unit = excluded.unit,
  sale_price = excluded.sale_price,
  compare_at_price = excluded.compare_at_price,
  status = excluded.status,
  updated_at = now();

insert into public.product_fulfillment (
  id,
  product_id,
  region_code,
  moq,
  quantity_step,
  stock_quantity,
  stock_unit,
  eta_text,
  updated_at
)
select
  p.id || '-' || coalesce(p.region_code, 'shared') || '-fulfillment',
  p.id,
  p.region_code,
  greatest(coalesce(nullif(regexp_replace(coalesce(p.specifications->>'MOQ', ''), '[^0-9.-]', '', 'g'), '')::numeric, p.units_per_carton, 1), 1),
  greatest(coalesce(nullif(regexp_replace(coalesce(p.specifications->>'Quantity Step', ''), '[^0-9.-]', '', 'g'), '')::numeric, p.units_per_carton, 1), 1),
  nullif(regexp_replace(coalesce(p.specifications->>'Stock', ''), '[^0-9.-]', '', 'g'), '')::numeric,
  coalesce(nullif(p.specifications->>'Unit', ''), 'pc'),
  nullif(p.specifications->>'ETA', ''),
  now()
from public.products p
on conflict (product_id, region_code) do update set
  moq = excluded.moq,
  quantity_step = excluded.quantity_step,
  stock_quantity = excluded.stock_quantity,
  stock_unit = excluded.stock_unit,
  eta_text = excluded.eta_text,
  updated_at = now();

comment on table public.product_publications is
  'Structured website publishing state for product SKUs: status, type, priority, and promotional presentation.';

comment on table public.product_prices is
  'Structured product pricing by region, currency, and price type. Website prices should be read from active website rows.';

comment on table public.product_fulfillment is
  'Structured MOQ, quantity step, stock, ETA, and fulfillment readiness data for website and ERP inquiry flows.';
