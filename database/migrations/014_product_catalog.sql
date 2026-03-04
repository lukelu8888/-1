-- ============================================================
-- Migration 014: Product Catalog Tables
-- Migrates hardcoded productData.ts into Supabase
-- ============================================================

-- 一级类目
CREATE TABLE IF NOT EXISTS product_main_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT,
  description TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 二级类目
CREATE TABLE IF NOT EXISTS product_sub_categories (
  id TEXT PRIMARY KEY,
  main_category_id TEXT NOT NULL REFERENCES product_main_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 三级类目
CREATE TABLE IF NOT EXISTS product_categories (
  id TEXT PRIMARY KEY,
  sub_category_id TEXT NOT NULL REFERENCES product_sub_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 产品规格表
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  category_id TEXT NOT NULL REFERENCES product_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  model TEXT NOT NULL,
  image TEXT,
  price NUMERIC(12, 2),
  net_weight NUMERIC(10, 3),
  gross_weight NUMERIC(10, 3),
  units_per_carton INT,
  carton_length NUMERIC(10, 2),
  carton_width NUMERIC(10, 2),
  carton_height NUMERIC(10, 2),
  carton_net_weight NUMERIC(10, 3),
  carton_gross_weight NUMERIC(10, 3),
  specifications JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_product_categories_sub_id ON product_categories(sub_category_id);
CREATE INDEX IF NOT EXISTS idx_product_sub_categories_main_id ON product_sub_categories(main_category_id);

-- Enable RLS
ALTER TABLE product_main_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_sub_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Public read product_main_categories" ON product_main_categories FOR SELECT USING (true);
CREATE POLICY "Public read product_sub_categories" ON product_sub_categories FOR SELECT USING (true);
CREATE POLICY "Public read product_categories" ON product_categories FOR SELECT USING (true);
CREATE POLICY "Public read products" ON products FOR SELECT USING (true);

-- ============================================================
-- Seed Data - Main Categories
-- ============================================================
INSERT INTO product_main_categories (id, name, icon, sort_order) VALUES
  ('appliances',         'Appliances',       '🏠', 1),
  ('building-materials', 'Building Materials','🏗️', 2),
  ('electrical',         'Electrical',       '⚡', 3),
  ('bathroom',           'Bathroom',         '🚿', 4),
  ('door-window',        'Door & Window',    '🚪', 5),
  ('safety',             'Safety & PPE',     '🦺', 6),
  ('flooring',           'Flooring',         '🪵', 7),
  ('heating',            'Heating & Cooling','❄️', 8),
  ('kitchen',            'Kitchen',          '🍳', 9),
  ('lighting',           'Lighting',         '💡', 10)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  icon = EXCLUDED.icon,
  sort_order = EXCLUDED.sort_order;

-- ============================================================
-- Seed Data - Sub Categories (appliances)
-- ============================================================
INSERT INTO product_sub_categories (id, main_category_id, name, sort_order) VALUES
  ('refrigerators',      'appliances', 'Refrigerators',      1),
  ('washers-dryers',     'appliances', 'Washers & Dryers',   2),
  ('dishwashers',        'appliances', 'Dishwashers',        3),
  ('ranges-cooktops',    'appliances', 'Ranges & Cooktops',  4),
  ('microwaves',         'appliances', 'Microwaves',         5),
  ('freezers',           'appliances', 'Freezers',           6),
  ('water-heaters',      'appliances', 'Water Heaters',      7),
  ('small-appliances',   'appliances', 'Small Appliances',   8),
  ('air-conditioners',   'appliances', 'Air Conditioners',   9),
  ('dehumidifiers',      'appliances', 'Dehumidifiers',      10),
  -- building-materials
  ('lumber',             'building-materials', 'Lumber',          1),
  ('concrete-masonry',   'building-materials', 'Concrete & Masonry', 2),
  ('insulation',         'building-materials', 'Insulation',      3),
  ('roofing',            'building-materials', 'Roofing',         4),
  -- electrical
  ('wiring-cables',      'electrical', 'Wiring & Cables',    1),
  ('circuit-breakers',   'electrical', 'Circuit Breakers',   2),
  ('outlets-switches',   'electrical', 'Outlets & Switches', 3),
  ('generators',         'electrical', 'Generators',         4),
  -- bathroom
  ('toilets',            'bathroom', 'Toilets',              1),
  ('sinks-faucets',      'bathroom', 'Sinks & Faucets',      2),
  ('shower-tubs',        'bathroom', 'Showers & Tubs',       3),
  ('bathroom-accessories','bathroom', 'Accessories',         4),
  -- door-window
  ('exterior-doors',     'door-window', 'Exterior Doors',    1),
  ('interior-doors',     'door-window', 'Interior Doors',    2),
  ('windows',            'door-window', 'Windows',           3),
  ('garage-doors',       'door-window', 'Garage Doors',      4),
  -- safety
  ('hard-hats',          'safety', 'Hard Hats & Helmets',   1),
  ('gloves',             'safety', 'Gloves',                 2),
  ('safety-glasses',     'safety', 'Safety Glasses',         3),
  ('respirators',        'safety', 'Respirators & Masks',    4),
  -- flooring
  ('hardwood',           'flooring', 'Hardwood',             1),
  ('laminate',           'flooring', 'Laminate',             2),
  ('tile',               'flooring', 'Tile',                 3),
  ('carpet',             'flooring', 'Carpet',               4),
  -- heating
  ('heat-pumps',         'heating', 'Heat Pumps',            1),
  ('furnaces',           'heating', 'Furnaces',              2),
  ('thermostats',        'heating', 'Thermostats',           3),
  ('fans',               'heating', 'Fans & Ventilation',    4),
  -- kitchen
  ('cabinets',           'kitchen', 'Cabinets',              1),
  ('countertops',        'kitchen', 'Countertops',           2),
  ('kitchen-sinks',      'kitchen', 'Kitchen Sinks',         3),
  ('kitchen-faucets',    'kitchen', 'Kitchen Faucets',       4),
  -- lighting
  ('indoor-lighting',    'lighting', 'Indoor Lighting',      1),
  ('outdoor-lighting',   'lighting', 'Outdoor Lighting',     2),
  ('smart-lighting',     'lighting', 'Smart Lighting',       3),
  ('led-strips',         'lighting', 'LED Strips',           4)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  main_category_id = EXCLUDED.main_category_id,
  sort_order = EXCLUDED.sort_order;

-- ============================================================
-- Seed Data - Product Categories (third level)
-- ============================================================
INSERT INTO product_categories (id, sub_category_id, name, sort_order) VALUES
  ('top-freezer',          'refrigerators',   'Top Freezer Refrigerators', 1),
  ('bottom-freezer',       'refrigerators',   'Bottom Freezer Refrigerators', 2),
  ('side-by-side',         'refrigerators',   'Side-by-Side Refrigerators', 3),
  ('french-door',          'refrigerators',   'French Door Refrigerators', 4),
  ('front-load-washers',   'washers-dryers',  'Front Load Washers', 1),
  ('top-load-washers',     'washers-dryers',  'Top Load Washers', 2),
  ('dryers',               'washers-dryers',  'Dryers', 3),
  ('built-in-dishwashers', 'dishwashers',     'Built-in Dishwashers', 1),
  ('portable-dishwashers', 'dishwashers',     'Portable Dishwashers', 2),
  ('gas-ranges',           'ranges-cooktops', 'Gas Ranges', 1),
  ('electric-ranges',      'ranges-cooktops', 'Electric Ranges', 2),
  ('induction-cooktops',   'ranges-cooktops', 'Induction Cooktops', 3),
  ('countertop-microwaves','microwaves',      'Countertop Microwaves', 1),
  ('over-range-microwaves','microwaves',      'Over-the-Range Microwaves', 2),
  ('chest-freezers',       'freezers',        'Chest Freezers', 1),
  ('upright-freezers',     'freezers',        'Upright Freezers', 2),
  ('electric-water-heaters','water-heaters',  'Electric Water Heaters', 1),
  ('gas-water-heaters',    'water-heaters',   'Gas Water Heaters', 2),
  ('tankless-water-heaters','water-heaters',  'Tankless Water Heaters', 3),
  ('coffee-makers',        'small-appliances','Coffee Makers', 1),
  ('blenders',             'small-appliances','Blenders', 2),
  ('toasters',             'small-appliances','Toasters & Toaster Ovens', 3),
  ('window-ac',            'air-conditioners','Window Air Conditioners', 1),
  ('portable-ac',          'air-conditioners','Portable Air Conditioners', 2),
  ('portable-dehumidifiers','dehumidifiers',  'Portable Dehumidifiers', 1),
  ('dimensional-lumber',   'lumber',          'Dimensional Lumber', 1),
  ('plywood',              'lumber',          'Plywood & OSB', 2),
  ('safety-glasses-cat',   'safety-glasses',  'Safety Glasses & Goggles', 1),
  ('disposable-gloves',    'gloves',          'Disposable Gloves', 1),
  ('work-gloves',          'gloves',          'Work Gloves', 2),
  ('led-bulbs',            'indoor-lighting', 'LED Bulbs', 1),
  ('ceiling-lights',       'indoor-lighting', 'Ceiling Lights', 2),
  ('flood-lights',         'outdoor-lighting','Flood Lights', 1),
  ('wall-sconces',         'outdoor-lighting','Wall Sconces', 2),
  ('smart-bulbs',          'smart-lighting',  'Smart Bulbs', 1),
  ('strip-lights',         'led-strips',      'LED Strip Lights', 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  sub_category_id = EXCLUDED.sub_category_id,
  sort_order = EXCLUDED.sort_order;
