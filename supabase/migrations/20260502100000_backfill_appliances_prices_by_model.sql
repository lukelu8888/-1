-- Some Appliances rows were created with generated UUID ids rather than the
-- original seed ids. Backfill website prices by SKU/model so those rows are
-- priced in promotion management as well.

create temporary table tmp_appliances_model_prices (
  model text primary key,
  sale_price numeric(14, 4) not null,
  compare_at_price numeric(14, 4) not null
) on commit drop;

insert into tmp_appliances_model_prices (model, sale_price, compare_at_price)
values
  ('TF-18', 699.00, 799.00),
  ('TF-20', 799.00, 899.00),
  ('BF-22', 899.00, 999.00),
  ('SBS-26', 1299.00, 1499.00),
  ('SBS-28', 1499.00, 1699.00),
  ('FD-25', 1599.00, 1799.00),
  ('FL-45', 799.00, 899.00),
  ('FL-50', 899.00, 999.00),
  ('TL-42', 599.00, 699.00),
  ('ED-70', 699.00, 799.00),
  ('GD-74', 799.00, 899.00),
  ('BID-24', 599.00, 699.00),
  ('BID-24S', 699.00, 799.00),
  ('PD-18', 499.00, 599.00),
  ('GR-30-5', 899.00, 999.00),
  ('GR-36-6', 1299.00, 1499.00),
  ('ER-30C', 699.00, 799.00),
  ('ER-30S', 899.00, 999.00),
  ('IC-30-4', 1099.00, 1299.00),
  ('CM-11', 149.00, 179.00),
  ('CM-16', 199.00, 249.00),
  ('ORM-17', 299.00, 349.00),
  ('CF-70', 349.00, 399.00),
  ('CF-102', 449.00, 499.00),
  ('UF-138', 599.00, 699.00),
  ('EWH-40', 399.00, 449.00),
  ('EWH-50', 499.00, 599.00),
  ('GWH-40', 449.00, 549.00),
  ('TWH-E', 599.00, 699.00),
  ('DCM-12', 49.00, 59.00),
  ('SSC-01', 89.00, 109.00),
  ('BL-1000', 79.00, 99.00),
  ('T-2S', 29.00, 39.00),
  ('TO-6S', 79.00, 99.00),
  ('WAC-8K', 299.00, 349.00),
  ('WAC-12K', 399.00, 449.00),
  ('PAC-10K', 449.00, 549.00),
  ('DH-50', 249.00, 299.00),
  ('DH-70', 299.00, 349.00);

update public.products p
set
  price = model_prices.sale_price,
  updated_at = now()
from tmp_appliances_model_prices model_prices
where p.model = model_prices.model
  and coalesce(p.price, 0) = 0;

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
  p.id || '-na-usd-website',
  p.id,
  'NA',
  'USD',
  'pc',
  model_prices.sale_price,
  model_prices.compare_at_price,
  'website',
  date '2026-05-02',
  'active',
  now()
from public.products p
join tmp_appliances_model_prices model_prices on model_prices.model = p.model
where coalesce(p.region_code, 'NA') = 'NA'
on conflict (product_id, region_code, currency, price_type) do update set
  unit = excluded.unit,
  sale_price = excluded.sale_price,
  compare_at_price = excluded.compare_at_price,
  valid_from = excluded.valid_from,
  status = excluded.status,
  updated_at = now();
