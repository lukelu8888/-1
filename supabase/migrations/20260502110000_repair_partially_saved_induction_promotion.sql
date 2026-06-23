-- Repair a promotion that was partially saved while structured upserts were
-- still using id conflicts instead of product/region business keys.

insert into public.product_publications (
  id,
  product_id,
  region_code,
  publish_type,
  publish_status,
  display_priority,
  promotion_label,
  front_tag,
  website_note,
  updated_at
)
values (
  'appliance-leaf-induction-cooktops-NA-website-publication',
  'appliance-leaf-induction-cooktops',
  'NA',
  'deal',
  'published',
  20,
  '优惠 44%',
  'Special Buy',
  'Seeded Appliances leaf product.',
  now()
)
on conflict (product_id, region_code) do update set
  publish_type = excluded.publish_type,
  publish_status = excluded.publish_status,
  display_priority = excluded.display_priority,
  promotion_label = excluded.promotion_label,
  front_tag = excluded.front_tag,
  website_note = excluded.website_note,
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
values (
  'appliance-leaf-induction-cooktops-NA-usd-website',
  'appliance-leaf-induction-cooktops',
  'NA',
  'USD',
  'pc',
  100.80,
  180.00,
  'website',
  date '2026-05-23',
  'active',
  now()
)
on conflict (product_id, region_code, currency, price_type) do update set
  unit = excluded.unit,
  sale_price = excluded.sale_price,
  compare_at_price = excluded.compare_at_price,
  valid_until = excluded.valid_until,
  status = excluded.status,
  updated_at = now();
