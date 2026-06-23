insert into public.promotion_campaigns (
  id,
  region_code,
  name,
  type,
  start_date,
  end_date,
  headline,
  description,
  cta_text,
  banner_color,
  product_ids,
  created_at
)
values (
  'campaign-special-offer-in-may-202604',
  'NA',
  'SPECIAL OFFER IN MAY',
  'weekly',
  date '2026-04-27',
  date '2026-04-30',
  'ALL FOR YOUR BENEFITS',
  'PINK SEASON IS COMING !',
  'Shop Now',
  'from-red-600 to-orange-500',
  array['toast-001'],
  now()
)
on conflict (id) do update set
  region_code = excluded.region_code,
  name = excluded.name,
  type = excluded.type,
  start_date = excluded.start_date,
  end_date = excluded.end_date,
  headline = excluded.headline,
  description = excluded.description,
  cta_text = excluded.cta_text,
  banner_color = excluded.banner_color,
  product_ids = excluded.product_ids,
  updated_at = now();
