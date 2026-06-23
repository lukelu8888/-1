-- Seed publishable products for Appliances storefront leaf categories.
-- These categories are shown as the deepest storefront level and need product rows
-- attached directly to the leaf category ids.

create temporary table tmp_appliances_leaf_products (
  id text primary key,
  category_id text not null,
  name text not null,
  model text not null,
  image text not null,
  price numeric(14, 4) not null,
  net_weight numeric(10, 3) not null,
  gross_weight numeric(10, 3) not null,
  units_per_carton int not null,
  carton_length numeric(10, 2) not null,
  carton_width numeric(10, 2) not null,
  carton_height numeric(10, 2) not null,
  carton_net_weight numeric(10, 3) not null,
  carton_gross_weight numeric(10, 3) not null,
  specifications jsonb not null
) on commit drop;

insert into tmp_appliances_leaf_products (
  id,
  category_id,
  name,
  model,
  image,
  price,
  net_weight,
  gross_weight,
  units_per_carton,
  carton_length,
  carton_width,
  carton_height,
  carton_net_weight,
  carton_gross_weight,
  specifications
)
values
  ('appliance-leaf-refrigerator-parts', 'appliances-appliance-parts-and-accessories-refrigerator-parts', 'Refrigerator Parts', 'RP-001', 'https://images.unsplash.com/photo-1653548147256-f1ba6da5f446?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhcHBsaWFuY2UlMjBwYXJ0cyUyMGFjY2Vzc29yaWVzfGVufDF8fHx8MTc2MTIwMjE2N3ww&ixlib=rb-4.1.0&q=80&w=1080', 5.00, 6.50, 7.20, 8, 50, 30, 28, 6.50, 7.20, '{"Material":"Stainless Steel / Plastic","Color":"Silver/White","Specification":"Universal Fit","Size":"Standard","Unit":"pc","Publish Status":"published"}'),
  ('appliance-leaf-washer-parts', 'appliances-appliance-parts-and-accessories-washer-parts', 'Washer Parts', 'WP-001', 'https://images.unsplash.com/photo-1754732693535-7ffb5e1a51d6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3YXNoaW5nJTIwbWFjaGluZSUyMGFwcGxpYW5jZXxlbnwxfHx8fDE3NjExODI1Njd8MA&ixlib=rb-4.1.0&q=80&w=1080', 3.50, 5.20, 5.80, 10, 45, 35, 25, 5.20, 5.80, '{"Material":"Rubber / Metal","Color":"Black/Gray","Specification":"Standard Size","Size":"Medium","Unit":"pc","Publish Status":"published"}'),
  ('appliance-leaf-dryer-parts', 'appliances-appliance-parts-and-accessories-dryer-parts', 'Dryer Parts', 'DP-001', 'https://images.unsplash.com/photo-1754732693535-7ffb5e1a51d6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3YXNoaW5nJTIwbWFjaGluZSUyMGFwcGxpYW5jZXxlbnwxfHx8fDE3NjExODI1Njd8MA&ixlib=rb-4.1.0&q=80&w=1080', 4.00, 5.40, 6.00, 12, 48, 32, 24, 5.40, 6.00, '{"Material":"Heat Resistant Plastic","Color":"White/Gray","Specification":"OEM Compatible","Size":"Universal","Unit":"pc","Publish Status":"published"}'),
  ('appliance-leaf-dishwasher-parts', 'appliances-appliance-parts-and-accessories-dishwasher-parts', 'Dishwasher Parts', 'DWP-001', 'https://images.unsplash.com/photo-1758631130778-42d518bf13aa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBkaXNod2FzaGVyfGVufDF8fHx8MTc2MTIwMjE2OHww&ixlib=rb-4.1.0&q=80&w=1080', 2.50, 4.20, 4.80, 24, 42, 32, 22, 4.20, 4.80, '{"Material":"Plastic/Metal","Color":"Gray","Specification":"4 in. x 2 in. x 1 in.","Size":"Small","Unit":"pc","Publish Status":"published"}'),
  ('appliance-leaf-range-parts', 'appliances-appliance-parts-and-accessories-range-parts', 'Range Parts', 'RP-002', 'https://images.unsplash.com/photo-1692089913251-445cb32eb8dc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxraXRjaGVuJTIwcmFuZ2UlMjBzdG92ZXxlbnwxfHx8fDE3NjEyMDIxNzB8MA&ixlib=rb-4.1.0&q=80&w=1080', 6.00, 8.80, 9.50, 6, 55, 40, 30, 8.80, 9.50, '{"Material":"Steel / Ceramic","Color":"Black/Silver","Specification":"Standard Range Compatible","Size":"Standard","Unit":"pc","Publish Status":"published"}'),
  ('appliance-leaf-microwave-parts', 'appliances-appliance-parts-and-accessories-microwave-parts', 'Microwave Parts', 'MP-001', 'https://images.unsplash.com/photo-1759398430338-8057876edf61?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtaWNyb3dhdmUlMjBvdmVuJTIwY291bnRlcnRvcHxlbnwxfHx8fDE3NjEyMDIxNzB8MA&ixlib=rb-4.1.0&q=80&w=1080', 4.50, 5.00, 5.50, 15, 40, 35, 25, 5.00, 5.50, '{"Material":"Glass / Plastic","Color":"Clear/White","Specification":"Universal Microwave Parts","Size":"Universal","Unit":"pc","Publish Status":"published"}'),
  ('appliance-leaf-water-filter', 'appliances-appliance-parts-and-accessories-water-filter', 'Water Filter', 'WF-001', 'https://images.unsplash.com/photo-1653548147256-f1ba6da5f446?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhcHBsaWFuY2UlMjBwYXJ0cyUyMGFjY2Vzc29yaWVzfGVufDF8fHx8MTc2MTIwMjE2N3ww&ixlib=rb-4.1.0&q=80&w=1080', 7.00, 6.00, 6.50, 12, 52, 28, 26, 6.00, 6.50, '{"Material":"Activated Carbon","Color":"White","Specification":"10 in. x 2.5 in.","Size":"10 inch","Unit":"pc","Publish Status":"published"}'),
  ('appliance-leaf-appliance-cleaner', 'appliances-appliance-parts-and-accessories-appliance-cleaner', 'Appliance Cleaner', 'AC-001', 'https://images.unsplash.com/photo-1653548147256-f1ba6da5f446?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhcHBsaWFuY2UlMjBwYXJ0cyUyMGFjY2Vzc29yaWVzfGVufDF8fHx8MTc2MTIwMjE2N3ww&ixlib=rb-4.1.0&q=80&w=1080', 10.00, 11.00, 12.50, 20, 45, 30, 25, 11.00, 12.50, '{"Material":"Liquid Solution","Color":"Clear","Specification":"500 ml bottle","Size":"500 ml","Unit":"pc","Publish Status":"published"}'),
  ('appliance-leaf-gas-cooktops', 'appliances-cooktops-gas-cooktops', 'Gas Cooktops', 'GC-001', 'https://images.unsplash.com/photo-1739598752069-6806ce5d762a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHxnYXMlMjBjb29rdG9wJTIwc3RvdmV8ZW58MXx8fHwxNzYxMjAyMTY4fDA&ixlib=rb-4.1.0&q=80&w=1080', 150.00, 16.00, 18.50, 1, 85, 60, 20, 16.00, 18.50, '{"Material":"Stainless Steel","Color":"Silver","Specification":"30 in. 5-Burner","Size":"30 inch","Unit":"pc","Publish Status":"published"}'),
  ('appliance-leaf-electric-cooktops', 'appliances-cooktops-electric-cooktops', 'Electric Cooktops', 'EC-001', 'https://images.unsplash.com/photo-1739598752069-6806ce5d762a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHxnYXMlMjBjb29rdG9wJTIwc3RvdmV8ZW58MXx8fHwxNzYxMjAyMTY4fDA&ixlib=rb-4.1.0&q=80&w=1080', 130.00, 14.50, 16.00, 1, 82, 58, 18, 14.50, 16.00, '{"Material":"Ceramic Glass","Color":"Black","Specification":"30 in. 4-Element","Size":"30 inch","Unit":"pc","Publish Status":"published"}'),
  ('appliance-leaf-induction-cooktops', 'appliances-cooktops-induction-cooktops', 'Induction Cooktops', 'IC-001', 'https://images.unsplash.com/photo-1739598752069-6806ce5d762a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHxnYXMlMjBjb29rdG9wJTIwc3RvdmV8ZW58MXx8fHwxNzYxMjAyMTY4fDA&ixlib=rb-4.1.0&q=80&w=1080', 180.00, 15.00, 17.00, 1, 82, 58, 18, 15.00, 17.00, '{"Material":"Tempered Glass","Color":"Black","Specification":"30 in. 4-Zone","Size":"30 inch","Unit":"pc","Publish Status":"published"}'),
  ('appliance-leaf-portable-cooktops', 'appliances-cooktops-portable-cooktops', 'Portable Cooktops', 'PC-001', 'https://images.unsplash.com/photo-1739598752069-6806ce5d762a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHxnYXMlMjBjb29rdG9wJTIwc3RvdmV8ZW58MXx8fHwxNzYxMjAyMTY4fDA&ixlib=rb-4.1.0&q=80&w=1080', 60.00, 5.20, 6.00, 2, 55, 36, 18, 10.40, 12.00, '{"Material":"Stainless Steel / Glass","Color":"Black","Specification":"Double Burner","Size":"Portable","Unit":"pc","Publish Status":"published"}'),
  ('appliance-leaf-built-in-dishwashers', 'appliances-dishwashers-built-in-dishwashers', 'Built-In Dishwashers', 'BID-001', 'https://images.unsplash.com/photo-1758631130778-42d518bf13aa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBkaXNod2FzaGVyfGVufDF8fHx8MTc2MTIwMjE2OHww&ixlib=rb-4.1.0&q=80&w=1080', 120.00, 28.00, 31.00, 1, 70, 65, 90, 28.00, 31.00, '{"Material":"Stainless Steel","Color":"Silver","Specification":"24 in. Built-In","Size":"24 inch","Unit":"pc","Publish Status":"published"}'),
  ('appliance-leaf-portable-dishwashers', 'appliances-dishwashers-portable-dishwashers', 'Portable Dishwashers', 'PD-001', 'https://images.unsplash.com/photo-1758631130778-42d518bf13aa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBkaXNod2FzaGVyfGVufDF8fHx8MTc2MTIwMjE2OHww&ixlib=rb-4.1.0&q=80&w=1080', 95.00, 22.00, 24.50, 1, 60, 55, 75, 22.00, 24.50, '{"Material":"Steel / Plastic","Color":"White","Specification":"18 in. Portable","Size":"18 inch","Unit":"pc","Publish Status":"published"}'),
  ('appliance-leaf-drawer-dishwashers', 'appliances-dishwashers-drawer-dishwashers', 'Drawer Dishwashers', 'DD-001', 'https://images.unsplash.com/photo-1758631130778-42d518bf13aa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBkaXNod2FzaGVyfGVufDF8fHx8MTc2MTIwMjE2OHww&ixlib=rb-4.1.0&q=80&w=1080', 145.00, 25.00, 28.00, 1, 68, 62, 52, 25.00, 28.00, '{"Material":"Stainless Steel","Color":"Silver","Specification":"Single Drawer","Size":"24 inch","Unit":"pc","Publish Status":"published"}'),
  ('appliance-leaf-compact-dishwashers', 'appliances-dishwashers-compact-dishwashers', 'Compact Dishwashers', 'CD-001', 'https://images.unsplash.com/photo-1758631130778-42d518bf13aa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBkaXNod2FzaGVyfGVufDF8fHx8MTc2MTIwMjE2OHww&ixlib=rb-4.1.0&q=80&w=1080', 85.00, 18.00, 20.00, 1, 55, 50, 48, 18.00, 20.00, '{"Material":"Steel / Plastic","Color":"White","Specification":"Countertop Compact","Size":"Compact","Unit":"pc","Publish Status":"published"}'),
  ('appliance-leaf-chest-freezers', 'appliances-freezers-and-ice-makers-chest-freezers', 'Chest Freezers', 'CF-001', 'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=800', 110.00, 32.00, 36.00, 1, 95, 60, 85, 32.00, 36.00, '{"Material":"Painted Steel","Color":"White","Specification":"7.0 cu.ft","Size":"7 cu.ft","Unit":"pc","Publish Status":"published"}'),
  ('appliance-leaf-ice-makers', 'appliances-freezers-and-ice-makers-ice-makers', 'Ice Makers', 'IM-001', 'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=800', 95.00, 16.00, 18.00, 1, 48, 42, 45, 16.00, 18.00, '{"Material":"Stainless Steel / Plastic","Color":"Silver","Specification":"Portable Ice Maker","Size":"Countertop","Unit":"pc","Publish Status":"published"}'),
  ('appliance-leaf-upright-freezers', 'appliances-freezers-and-ice-makers-upright-freezers', 'Upright Freezers', 'UF-001', 'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=800', 140.00, 42.00, 47.00, 1, 75, 70, 170, 42.00, 47.00, '{"Material":"Painted Steel","Color":"White","Specification":"13.8 cu.ft Upright","Size":"13.8 cu.ft","Unit":"pc","Publish Status":"published"}');

insert into public.products (
  id,
  category_id,
  name,
  model,
  image,
  price,
  net_weight,
  gross_weight,
  units_per_carton,
  carton_length,
  carton_width,
  carton_height,
  carton_net_weight,
  carton_gross_weight,
  specifications,
  updated_at
)
select
  p.id,
  p.category_id,
  p.name,
  p.model,
  p.image,
  p.price,
  p.net_weight,
  p.gross_weight,
  p.units_per_carton,
  p.carton_length,
  p.carton_width,
  p.carton_height,
  p.carton_net_weight,
  p.carton_gross_weight,
  p.specifications,
  now()
from tmp_appliances_leaf_products p
join public.product_categories c on c.id = p.category_id
on conflict (id) do update set
  category_id = excluded.category_id,
  name = excluded.name,
  model = excluded.model,
  image = excluded.image,
  price = excluded.price,
  net_weight = excluded.net_weight,
  gross_weight = excluded.gross_weight,
  units_per_carton = excluded.units_per_carton,
  carton_length = excluded.carton_length,
  carton_width = excluded.carton_width,
  carton_height = excluded.carton_height,
  carton_net_weight = excluded.carton_net_weight,
  carton_gross_weight = excluded.carton_gross_weight,
  specifications = excluded.specifications,
  updated_at = now();

insert into public.product_publications (
  id,
  product_id,
  region_code,
  publish_type,
  publish_status,
  display_priority,
  website_note,
  updated_at
)
select
  p.id || '-na-website-publication',
  p.id,
  'NA',
  'standard',
  'published',
  20,
  'Seeded Appliances leaf product.',
  now()
from tmp_appliances_leaf_products p
join public.products products on products.id = p.id
on conflict (product_id, region_code) do update set
  publish_type = excluded.publish_type,
  publish_status = excluded.publish_status,
  display_priority = excluded.display_priority,
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
  p.price,
  round(p.price * 1.2, 2),
  'website',
  date '2026-05-02',
  'active',
  now()
from tmp_appliances_leaf_products p
join public.products products on products.id = p.id
on conflict (product_id, region_code, currency, price_type) do update set
  unit = excluded.unit,
  sale_price = excluded.sale_price,
  compare_at_price = excluded.compare_at_price,
  valid_from = excluded.valid_from,
  status = excluded.status,
  updated_at = now();
