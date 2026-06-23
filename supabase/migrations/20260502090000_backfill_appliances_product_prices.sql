-- Backfill website prices for the full Appliances catalog.
-- Keeps the legacy products.price field and the structured website price table in sync.

create temporary table tmp_appliances_product_prices (
  product_id text primary key,
  sale_price numeric(14, 4) not null,
  compare_at_price numeric(14, 4) not null
) on commit drop;

insert into tmp_appliances_product_prices (product_id, sale_price, compare_at_price)
values
  ('ref-tf-001', 699.00, 799.00),
  ('ref-tf-002', 799.00, 899.00),
  ('ref-bf-001', 899.00, 999.00),
  ('ref-sbs-001', 1299.00, 1499.00),
  ('ref-sbs-002', 1499.00, 1699.00),
  ('ref-fd-001', 1599.00, 1799.00),
  ('wash-fl-001', 799.00, 899.00),
  ('wash-fl-002', 899.00, 999.00),
  ('wash-tl-001', 599.00, 699.00),
  ('dry-001', 699.00, 799.00),
  ('dry-002', 799.00, 899.00),
  ('dish-bi-001', 599.00, 699.00),
  ('dish-bi-002', 699.00, 799.00),
  ('dish-port-001', 499.00, 599.00),
  ('range-gas-001', 899.00, 999.00),
  ('range-gas-002', 1299.00, 1499.00),
  ('range-elec-001', 699.00, 799.00),
  ('range-elec-002', 899.00, 999.00),
  ('cook-ind-001', 1099.00, 1299.00),
  ('micro-ct-001', 149.00, 179.00),
  ('micro-ct-002', 199.00, 249.00),
  ('micro-or-001', 299.00, 349.00),
  ('freeze-ch-001', 349.00, 399.00),
  ('freeze-ch-002', 449.00, 499.00),
  ('freeze-up-001', 599.00, 699.00),
  ('wh-elec-001', 399.00, 449.00),
  ('wh-elec-002', 499.00, 599.00),
  ('wh-gas-001', 449.00, 549.00),
  ('wh-tank-001', 599.00, 699.00),
  ('coffee-001', 49.00, 59.00),
  ('coffee-002', 89.00, 109.00),
  ('blend-001', 79.00, 99.00),
  ('toast-001', 29.00, 39.00),
  ('toast-002', 79.00, 99.00),
  ('ac-win-001', 299.00, 349.00),
  ('ac-win-002', 399.00, 449.00),
  ('ac-port-001', 449.00, 549.00),
  ('dehum-001', 249.00, 299.00),
  ('dehum-002', 299.00, 349.00);

update public.products p
set
  price = backfill.sale_price,
  updated_at = now()
from tmp_appliances_product_prices backfill
where p.id = backfill.product_id;

insert into public.product_prices (
  id,
  product_id,
  region_code,
  currency,
  unit,
  sale_price,
  compare_at_price,
  price_type,
  valid_from,
  status,
  updated_at
)
select
  backfill.product_id || '-na-usd-website',
  backfill.product_id,
  'NA',
  'USD',
  'pc',
  backfill.sale_price,
  backfill.compare_at_price,
  'website',
  date '2026-05-02',
  'active',
  now()
from tmp_appliances_product_prices backfill
join public.products p on p.id = backfill.product_id
on conflict (product_id, region_code, currency, price_type) do update set
  unit = excluded.unit,
  sale_price = excluded.sale_price,
  compare_at_price = excluded.compare_at_price,
  valid_from = excluded.valid_from,
  status = excluded.status,
  updated_at = now();
