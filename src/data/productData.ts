export interface ProductSpec {
  id: string;
  name: string;
  model: string;
  image: string;
  specifications: {
    [key: string]: string;
  };
  netWeight: number; // kg per unit
  grossWeight: number; // kg per unit
  unitsPerCarton: number; // 装箱数
  cartonDimensions: {
    length: number; // cm
    width: number; // cm
    height: number; // cm
  };
  cartonNetWeight: number; // kg 箱净重
  cartonGrossWeight: number; // kg 箱毛重
  price?: number;
}

// 三级类目 - Product Category (具体产品分类)
export interface ProductCategory {
  id: string;
  name: string;
  description?: string;
  products: ProductSpec[]; // 具体的产品型号列表
}

// 二级类目 - SubCategory
export interface SubCategory {
  id: string;
  name: string;
  description?: string;
  productCategories: ProductCategory[]; // 三级类目
}

// 一级类目 - MainCategory
export interface MainCategory {
  id: string;
  name: string;
  icon: string;
  description?: string;
  subCategories: SubCategory[]; // 二级类目
}

// Helper function to create sample products
const createSampleProduct = (id: string, name: string, model: string, price: number, imageUrl: string): ProductSpec => ({
  id,
  name,
  model,
  image: imageUrl,
  specifications: {
    'Material': 'Premium Quality',
    'Certification': 'CE, ISO',
    'Warranty': '1 Year',
  },
  netWeight: 1.5,
  grossWeight: 2.0,
  unitsPerCarton: 10,
  cartonDimensions: {
    length: 50,
    width: 40,
    height: 30,
  },
  cartonNetWeight: 15,
  cartonGrossWeight: 20,
  price,
});

export const productCatalog: MainCategory[] = [
  {
    id: 'appliances',
    name: 'Appliances',
    icon: '🏠',
    description: 'Home and Kitchen Appliances',
    subCategories: [
      {
        id: 'refrigerators',
        name: 'Refrigerators',
        description: 'All types of refrigerators',
        productCategories: [
          {
            id: 'top-freezer',
            name: 'Top Freezer Refrigerators',
            products: [
              createSampleProduct('ref-tf-001', 'Top Freezer Refrigerator 18 cu.ft', 'TF-18', 699, 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=800'),
              createSampleProduct('ref-tf-002', 'Top Freezer Refrigerator 20 cu.ft', 'TF-20', 799, 'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=800'),
            ],
          },
          {
            id: 'bottom-freezer',
            name: 'Bottom Freezer Refrigerators',
            products: [
              createSampleProduct('ref-bf-001', 'Bottom Freezer Refrigerator 22 cu.ft', 'BF-22', 899, 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=800'),
            ],
          },
          {
            id: 'side-by-side',
            name: 'Side-by-Side Refrigerators',
            products: [
              createSampleProduct('ref-sbs-001', 'Side-by-Side Refrigerator 26 cu.ft', 'SBS-26', 1299, 'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=800'),
              createSampleProduct('ref-sbs-002', 'Side-by-Side Refrigerator 28 cu.ft', 'SBS-28', 1499, 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=800'),
            ],
          },
          {
            id: 'french-door',
            name: 'French Door Refrigerators',
            products: [
              createSampleProduct('ref-fd-001', 'French Door Refrigerator 25 cu.ft', 'FD-25', 1599, 'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=800'),
            ],
          },
        ],
      },
      {
        id: 'washers-dryers',
        name: 'Washers & Dryers',
        description: 'Laundry appliances',
        productCategories: [
          {
            id: 'front-load-washers',
            name: 'Front Load Washers',
            products: [
              createSampleProduct('wash-fl-001', 'Front Load Washer 4.5 cu.ft', 'FL-45', 799, 'https://images.unsplash.com/photo-1626806787461-102c1a5f69fa?w=800'),
              createSampleProduct('wash-fl-002', 'Front Load Washer 5.0 cu.ft', 'FL-50', 899, 'https://images.unsplash.com/photo-1626806787461-102c1a5f69fa?w=800'),
            ],
          },
          {
            id: 'top-load-washers',
            name: 'Top Load Washers',
            products: [
              createSampleProduct('wash-tl-001', 'Top Load Washer 4.2 cu.ft', 'TL-42', 599, 'https://images.unsplash.com/photo-1626806787461-102c1a5f69fa?w=800'),
            ],
          },
          {
            id: 'dryers',
            name: 'Dryers',
            products: [
              createSampleProduct('dry-001', 'Electric Dryer 7.0 cu.ft', 'ED-70', 699, 'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=800'),
              createSampleProduct('dry-002', 'Gas Dryer 7.4 cu.ft', 'GD-74', 799, 'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=800'),
            ],
          },
        ],
      },
      {
        id: 'dishwashers',
        name: 'Dishwashers',
        description: 'Kitchen dishwashers',
        productCategories: [
          {
            id: 'built-in-dishwashers',
            name: 'Built-In Dishwashers',
            products: [
              createSampleProduct('dish-bi-001', 'Built-In Dishwasher 24"', 'BID-24', 599, 'https://images.unsplash.com/photo-1585659722983-3a675dabf23d?w=800'),
              createSampleProduct('dish-bi-002', 'Built-In Dishwasher Stainless 24"', 'BID-24S', 699, 'https://images.unsplash.com/photo-1585659722983-3a675dabf23d?w=800'),
            ],
          },
          {
            id: 'portable-dishwashers',
            name: 'Portable Dishwashers',
            products: [
              createSampleProduct('dish-port-001', 'Portable Dishwasher 18"', 'PD-18', 499, 'https://images.unsplash.com/photo-1585659722983-3a675dabf23d?w=800'),
            ],
          },
        ],
      },
      {
        id: 'ranges-cooktops',
        name: 'Ranges & Cooktops',
        description: 'Cooking appliances',
        productCategories: [
          {
            id: 'gas-ranges',
            name: 'Gas Ranges',
            products: [
              createSampleProduct('range-gas-001', 'Gas Range 30" 5-Burner', 'GR-30-5', 899, 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800'),
              createSampleProduct('range-gas-002', 'Gas Range 36" 6-Burner', 'GR-36-6', 1299, 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800'),
            ],
          },
          {
            id: 'electric-ranges',
            name: 'Electric Ranges',
            products: [
              createSampleProduct('range-elec-001', 'Electric Range 30" Coil', 'ER-30C', 699, 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800'),
              createSampleProduct('range-elec-002', 'Electric Range 30" Smooth Top', 'ER-30S', 899, 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800'),
            ],
          },
          {
            id: 'induction-cooktops',
            name: 'Induction Cooktops',
            products: [
              createSampleProduct('cook-ind-001', 'Induction Cooktop 30" 4-Element', 'IC-30-4', 1099, 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800'),
            ],
          },
        ],
      },
      {
        id: 'microwaves',
        name: 'Microwaves',
        description: 'Microwave ovens',
        productCategories: [
          {
            id: 'countertop-microwaves',
            name: 'Countertop Microwaves',
            products: [
              createSampleProduct('micro-ct-001', 'Countertop Microwave 1.1 cu.ft', 'CM-11', 149, 'https://images.unsplash.com/photo-1585238341710-7a0c1e1248c9?w=800'),
              createSampleProduct('micro-ct-002', 'Countertop Microwave 1.6 cu.ft', 'CM-16', 199, 'https://images.unsplash.com/photo-1585238341710-7a0c1e1248c9?w=800'),
            ],
          },
          {
            id: 'over-range-microwaves',
            name: 'Over-the-Range Microwaves',
            products: [
              createSampleProduct('micro-or-001', 'Over-Range Microwave 1.7 cu.ft', 'ORM-17', 299, 'https://images.unsplash.com/photo-1585238341710-7a0c1e1248c9?w=800'),
            ],
          },
        ],
      },
      {
        id: 'freezers',
        name: 'Freezers',
        description: 'Standalone freezers',
        productCategories: [
          {
            id: 'chest-freezers',
            name: 'Chest Freezers',
            products: [
              createSampleProduct('freeze-ch-001', 'Chest Freezer 7.0 cu.ft', 'CF-70', 349, 'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=800'),
              createSampleProduct('freeze-ch-002', 'Chest Freezer 10.2 cu.ft', 'CF-102', 449, 'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=800'),
            ],
          },
          {
            id: 'upright-freezers',
            name: 'Upright Freezers',
            products: [
              createSampleProduct('freeze-up-001', 'Upright Freezer 13.8 cu.ft', 'UF-138', 599, 'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=800'),
            ],
          },
        ],
      },
      {
        id: 'water-heaters',
        name: 'Water Heaters',
        description: 'Electric and gas water heaters',
        productCategories: [
          {
            id: 'electric-water-heaters',
            name: 'Electric Water Heaters',
            products: [
              createSampleProduct('wh-elec-001', 'Electric Water Heater 40 Gal', 'EWH-40', 399, 'https://images.unsplash.com/photo-1607400201889-565b1ee75f8e?w=800'),
              createSampleProduct('wh-elec-002', 'Electric Water Heater 50 Gal', 'EWH-50', 499, 'https://images.unsplash.com/photo-1607400201889-565b1ee75f8e?w=800'),
            ],
          },
          {
            id: 'gas-water-heaters',
            name: 'Gas Water Heaters',
            products: [
              createSampleProduct('wh-gas-001', 'Gas Water Heater 40 Gal', 'GWH-40', 449, 'https://images.unsplash.com/photo-1607400201889-565b1ee75f8e?w=800'),
            ],
          },
          {
            id: 'tankless-water-heaters',
            name: 'Tankless Water Heaters',
            products: [
              createSampleProduct('wh-tank-001', 'Tankless Electric Water Heater', 'TWH-E', 599, 'https://images.unsplash.com/photo-1607400201889-565b1ee75f8e?w=800'),
            ],
          },
        ],
      },
      {
        id: 'small-appliances',
        name: 'Small Kitchen Appliances',
        description: 'Countertop appliances',
        productCategories: [
          {
            id: 'coffee-makers',
            name: 'Coffee Makers',
            products: [
              createSampleProduct('coffee-001', 'Drip Coffee Maker 12-Cup', 'DCM-12', 49, 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=800'),
              createSampleProduct('coffee-002', 'Single Serve Coffee Maker', 'SSC-01', 89, 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=800'),
            ],
          },
          {
            id: 'blenders',
            name: 'Blenders',
            products: [
              createSampleProduct('blend-001', 'Countertop Blender 1000W', 'BL-1000', 79, 'https://images.unsplash.com/photo-1585515320310-259814833e62?w=800'),
            ],
          },
          {
            id: 'toasters',
            name: 'Toasters & Toaster Ovens',
            products: [
              createSampleProduct('toast-001', '2-Slice Toaster', 'T-2S', 29, 'https://images.unsplash.com/photo-1604335399105-a0c585fd81a1?w=800'),
              createSampleProduct('toast-002', 'Toaster Oven 6-Slice', 'TO-6S', 79, 'https://images.unsplash.com/photo-1604335399105-a0c585fd81a1?w=800'),
            ],
          },
        ],
      },
      {
        id: 'air-conditioners',
        name: 'Air Conditioners',
        description: 'Cooling units',
        productCategories: [
          {
            id: 'window-ac',
            name: 'Window Air Conditioners',
            products: [
              createSampleProduct('ac-win-001', 'Window AC 8000 BTU', 'WAC-8K', 299, 'https://images.unsplash.com/photo-1689596312367-39a4461504c1?w=800'),
              createSampleProduct('ac-win-002', 'Window AC 12000 BTU', 'WAC-12K', 399, 'https://images.unsplash.com/photo-1689596312367-39a4461504c1?w=800'),
            ],
          },
          {
            id: 'portable-ac',
            name: 'Portable Air Conditioners',
            products: [
              createSampleProduct('ac-port-001', 'Portable AC 10000 BTU', 'PAC-10K', 449, 'https://images.unsplash.com/photo-1689596312367-39a4461504c1?w=800'),
            ],
          },
        ],
      },
      {
        id: 'dehumidifiers',
        name: 'Dehumidifiers',
        description: 'Moisture control',
        productCategories: [
          {
            id: 'portable-dehumidifiers',
            name: 'Portable Dehumidifiers',
            products: [
              createSampleProduct('dehum-001', 'Dehumidifier 50-Pint', 'DH-50', 249, 'https://images.unsplash.com/photo-1607400201889-565b1ee75f8e?w=800'),
              createSampleProduct('dehum-002', 'Dehumidifier 70-Pint', 'DH-70', 299, 'https://images.unsplash.com/photo-1607400201889-565b1ee75f8e?w=800'),
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'building-materials',
    name: 'Building Materials',
    icon: '🏗️',
    description: 'Construction and Building Products',
    subCategories: [
      {
        id: 'lumber',
        name: 'Lumber & Composites',
        productCategories: [
          {
            id: 'dimensional-lumber',
            name: 'Dimensional Lumber',
            products: [
              createSampleProduct('lumber-001', '2x4x8 Pressure Treated', 'PT-2x4x8', 8.99, 'https://images.unsplash.com/photo-1563946658-5fb173f45df3?w=800'),
              createSampleProduct('lumber-002', '2x6x8 Pressure Treated', 'PT-2x6x8', 14.99, 'https://images.unsplash.com/photo-1563946658-5fb173f45df3?w=800'),
            ],
          },
          {
            id: 'plywood',
            name: 'Plywood',
            products: [
              createSampleProduct('ply-001', 'Plywood 4x8 1/2"', 'PLY-4x8-12', 29.99, 'https://images.unsplash.com/photo-1563946658-5fb173f45df3?w=800'),
            ],
          },
        ],
      },
      {
        id: 'concrete-cement',
        name: 'Concrete & Cement',
        productCategories: [
          {
            id: 'cement-mix',
            name: 'Cement & Mortar Mix',
            products: [
              createSampleProduct('cement-001', 'Portland Cement 94lb', 'PC-94', 12.99, 'https://images.unsplash.com/photo-1565183928294-7d22f4a97c60?w=800'),
              createSampleProduct('cement-002', 'Concrete Mix 80lb', 'CM-80', 4.99, 'https://images.unsplash.com/photo-1565183928294-7d22f4a97c60?w=800'),
            ],
          },
        ],
      },
      {
        id: 'drywall',
        name: 'Drywall',
        productCategories: [
          {
            id: 'drywall-panels',
            name: 'Drywall Panels',
            products: [
              createSampleProduct('dry-001', 'Drywall 4x8 1/2"', 'DW-4x8-12', 10.99, 'https://images.unsplash.com/photo-1615875474908-f403116f5e5a?w=800'),
            ],
          },
          {
            id: 'joint-compound',
            name: 'Joint Compound & Tape',
            products: [
              createSampleProduct('joint-001', 'Joint Compound 4.5 Gal', 'JC-45G', 14.99, 'https://images.unsplash.com/photo-1615875474908-f403116f5e5a?w=800'),
            ],
          },
        ],
      },
      {
        id: 'insulation',
        name: 'Insulation',
        productCategories: [
          {
            id: 'fiberglass-insulation',
            name: 'Fiberglass Insulation',
            products: [
              createSampleProduct('insul-001', 'R-13 Insulation 15"x93"', 'INS-R13-15', 44.99, 'https://images.unsplash.com/photo-1615875474908-f403116f5e5a?w=800'),
            ],
          },
        ],
      },
      {
        id: 'roofing',
        name: 'Roofing',
        productCategories: [
          {
            id: 'shingles',
            name: 'Roof Shingles',
            products: [
              createSampleProduct('roof-001', 'Architectural Shingles Bundle', 'AS-BUNDLE', 34.99, 'https://images.unsplash.com/photo-1632735318969-e6fadcbb4eff?w=800'),
            ],
          },
          {
            id: 'underlayment',
            name: 'Roofing Underlayment',
            products: [
              createSampleProduct('under-001', 'Roofing Felt 15lb', 'RF-15', 19.99, 'https://images.unsplash.com/photo-1632735318969-e6fadcbb4eff?w=800'),
            ],
          },
        ],
      },
      {
        id: 'siding',
        name: 'Siding',
        productCategories: [
          {
            id: 'vinyl-siding',
            name: 'Vinyl Siding',
            products: [
              createSampleProduct('sid-001', 'Vinyl Siding Panel 12ft', 'VS-12', 24.99, 'https://images.unsplash.com/photo-1615875474908-f403116f5e5a?w=800'),
            ],
          },
        ],
      },
      {
        id: 'stone-masonry',
        name: 'Stone & Masonry',
        productCategories: [
          {
            id: 'brick',
            name: 'Bricks',
            products: [
              createSampleProduct('brick-001', 'Red Clay Brick', 'RCB-001', 0.89, 'https://images.unsplash.com/photo-1565183928294-7d22f4a97c60?w=800'),
            ],
          },
          {
            id: 'stone-veneer',
            name: 'Stone Veneer',
            products: [
              createSampleProduct('stone-001', 'Cultured Stone Panel', 'CSP-001', 12.99, 'https://images.unsplash.com/photo-1565183928294-7d22f4a97c60?w=800'),
            ],
          },
        ],
      },
      {
        id: 'gutters',
        name: 'Gutters & Drainage',
        productCategories: [
          {
            id: 'gutter-systems',
            name: 'Gutter Systems',
            products: [
              createSampleProduct('gutter-001', 'Vinyl Gutter 10ft', 'VG-10', 8.99, 'https://images.unsplash.com/photo-1632735318969-e6fadcbb4eff?w=800'),
            ],
          },
        ],
      },
      {
        id: 'weatherproofing',
        name: 'Weatherproofing',
        productCategories: [
          {
            id: 'house-wrap',
            name: 'House Wrap',
            products: [
              createSampleProduct('wrap-001', 'House Wrap 9ft x 150ft', 'HW-9x150', 89.99, 'https://images.unsplash.com/photo-1615875474908-f403116f5e5a?w=800'),
            ],
          },
        ],
      },
      {
        id: 'metal-materials',
        name: 'Metal Materials',
        productCategories: [
          {
            id: 'steel-sheets',
            name: 'Steel Sheets',
            products: [
              createSampleProduct('steel-001', 'Galvanized Steel Sheet 4x8', 'GSS-4x8', 89.99, 'https://images.unsplash.com/photo-1565183928294-7d22f4a97c60?w=800'),
            ],
          },
          {
            id: 'metal-studs',
            name: 'Metal Studs',
            products: [
              createSampleProduct('stud-001', 'Metal Stud 25 Gauge 10ft', 'MS-25-10', 6.99, 'https://images.unsplash.com/photo-1565183928294-7d22f4a97c60?w=800'),
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'electrical',
    name: 'Electrical',
    icon: '⚡',
    description: 'Electrical Components and Supplies',
    subCategories: [
      {
        id: 'wiring-cables',
        name: 'Wiring & Cables',
        productCategories: [
          {
            id: 'electrical-wire',
            name: 'Electrical Wire',
            products: [
              createSampleProduct('wire-001', 'Romex 12/2 Wire 250ft', 'ROM-12-2-250', 89.99, 'https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=800'),
              createSampleProduct('wire-002', 'Romex 14/2 Wire 250ft', 'ROM-14-2-250', 69.99, 'https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=800'),
            ],
          },
          {
            id: 'extension-cords',
            name: 'Extension Cords',
            products: [
              createSampleProduct('ext-001', 'Extension Cord 25ft Heavy Duty', 'EC-25HD', 24.99, 'https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=800'),
            ],
          },
        ],
      },
      {
        id: 'outlets-switches',
        name: 'Outlets & Switches',
        productCategories: [
          {
            id: 'wall-outlets',
            name: 'Wall Outlets',
            products: [
              createSampleProduct('outlet-001', 'Duplex Outlet 15A White', 'DO-15-WH', 1.49, 'https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=800'),
              createSampleProduct('outlet-002', 'GFCI Outlet 20A', 'GFCI-20', 14.99, 'https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=800'),
            ],
          },
          {
            id: 'light-switches',
            name: 'Light Switches',
            products: [
              createSampleProduct('switch-001', 'Toggle Switch Single Pole', 'TS-SP', 1.29, 'https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=800'),
              createSampleProduct('switch-002', 'Dimmer Switch 3-Way', 'DS-3W', 19.99, 'https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=800'),
            ],
          },
        ],
      },
      {
        id: 'circuit-breakers',
        name: 'Circuit Breakers & Panels',
        productCategories: [
          {
            id: 'breakers',
            name: 'Circuit Breakers',
            products: [
              createSampleProduct('breaker-001', 'Circuit Breaker 20A Single Pole', 'CB-20-SP', 8.99, 'https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=800'),
            ],
          },
          {
            id: 'panels',
            name: 'Electrical Panels',
            products: [
              createSampleProduct('panel-001', 'Load Center 100A 20-Circuit', 'LC-100-20', 89.99, 'https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=800'),
            ],
          },
        ],
      },
      {
        id: 'conduit-fittings',
        name: 'Conduit & Fittings',
        productCategories: [
          {
            id: 'pvc-conduit',
            name: 'PVC Conduit',
            products: [
              createSampleProduct('conduit-001', 'PVC Conduit 1/2" 10ft', 'PVC-12-10', 4.99, 'https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=800'),
            ],
          },
        ],
      },
      {
        id: 'junction-boxes',
        name: 'Junction Boxes',
        productCategories: [
          {
            id: 'plastic-boxes',
            name: 'Plastic Electrical Boxes',
            products: [
              createSampleProduct('box-001', 'Single Gang Box', 'SGB-001', 0.89, 'https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=800'),
            ],
          },
        ],
      },
      {
        id: 'generators',
        name: 'Generators',
        productCategories: [
          {
            id: 'portable-generators',
            name: 'Portable Generators',
            products: [
              createSampleProduct('gen-001', 'Portable Generator 7500W', 'PG-7500', 899, 'https://images.usplash.com/photo-1621905251918-48416bd8575a?w=800'),
            ],
          },
        ],
      },
      {
        id: 'battery-power',
        name: 'Batteries & Power',
        productCategories: [
          {
            id: 'batteries',
            name: 'Batteries',
            products: [
              createSampleProduct('batt-001', 'AA Batteries 24-Pack', 'BAT-AA-24', 12.99, 'https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=800'),
            ],
          },
        ],
      },
      {
        id: 'doorbells',
        name: 'Doorbells & Chimes',
        productCategories: [
          {
            id: 'wired-doorbells',
            name: 'Wired Doorbells',
            products: [
              createSampleProduct('bell-001', 'Wired Doorbell Kit', 'DB-WIRED', 19.99, 'https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=800'),
            ],
          },
        ],
      },
      {
        id: 'surge-protection',
        name: 'Surge Protection',
        productCategories: [
          {
            id: 'surge-protectors',
            name: 'Surge Protectors',
            products: [
              createSampleProduct('surge-001', 'Surge Protector 6-Outlet', 'SP-6OUT', 14.99, 'https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=800'),
            ],
          },
        ],
      },
      {
        id: 'timers-sensors',
        name: 'Timers & Sensors',
        productCategories: [
          {
            id: 'motion-sensors',
            name: 'Motion Sensors',
            products: [
              createSampleProduct('sensor-001', 'Motion Sensor Switch', 'MS-SWITCH', 24.99, 'https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=800'),
            ],
          },
          {
            id: 'timers',
            name: 'Electrical Timers',
            products: [
              createSampleProduct('timer-001', 'Digital Timer Switch', 'DT-SWITCH', 19.99, 'https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=800'),
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'bathroom',
    name: 'Bathroom',
    icon: '🚿',
    description: 'Bathroom Fixtures and Accessories',
    subCategories: [
      {
        id: 'toilets',
        name: 'Toilets',
        productCategories: [
          {
            id: 'two-piece-toilets',
            name: 'Two-Piece Toilets',
            products: [
              createSampleProduct('toilet-2p-001', 'Two-Piece Toilet White Round', 'TP-WH-RD', 189, 'https://images.unsplash.com/photo-1620626011761-996317b8d101?w=800'),
              createSampleProduct('toilet-2p-002', 'Two-Piece Toilet White Elongated', 'TP-WH-EL', 229, 'https://images.unsplash.com/photo-1620626011761-996317b8d101?w=800'),
            ],
          },
          {
            id: 'one-piece-toilets',
            name: 'One-Piece Toilets',
            products: [
              createSampleProduct('toilet-1p-001', 'One-Piece Toilet Elongated', 'OP-EL', 349, 'https://images.unsplash.com/photo-1620626011761-996317b8d101?w=800'),
            ],
          },
        ],
      },
      {
        id: 'vanities',
        name: 'Bathroom Vanities',
        productCategories: [
          {
            id: 'single-vanities',
            name: 'Single Sink Vanities',
            products: [
              createSampleProduct('van-s-001', 'Single Vanity 24" White', 'SV-24-WH', 299, 'https://images.unsplash.com/photo-1620626011761-996317b8d101?w=800'),
              createSampleProduct('van-s-002', 'Single Vanity 36" Gray', 'SV-36-GR', 449, 'https://images.unsplash.com/photo-1620626011761-996317b8d101?w=800'),
            ],
          },
          {
            id: 'double-vanities',
            name: 'Double Sink Vanities',
            products: [
              createSampleProduct('van-d-001', 'Double Vanity 60" White', 'DV-60-WH', 799, 'https://images.unsplash.com/photo-1620626011761-996317b8d101?w=800'),
            ],
          },
        ],
      },
      {
        id: 'sinks-faucets',
        name: 'Sinks & Faucets',
        productCategories: [
          {
            id: 'bathroom-sinks',
            name: 'Bathroom Sinks',
            products: [
              createSampleProduct('sink-001', 'Undermount Sink Oval White', 'US-OV-WH', 79, 'https://images.unsplash.com/photo-1585758389191-c5cc56d10ff2?w=800'),
              createSampleProduct('sink-002', 'Vessel Sink Round Glass', 'VS-RD-GL', 129, 'https://images.unsplash.com/photo-1585758389191-c5cc56d10ff2?w=800'),
            ],
          },
          {
            id: 'bathroom-faucets',
            name: 'Bathroom Faucets',
            products: [
              createSampleProduct('faucet-001', 'Single Handle Faucet Chrome', 'SHF-CH', 89, 'https://images.unsplash.com/photo-1585758389191-c5cc56d10ff2?w=800'),
              createSampleProduct('faucet-002', 'Waterfall Faucet Brushed Nickel', 'WF-BN', 149, 'https://images.unsplash.com/photo-1585758389191-c5cc56d10ff2?w=800'),
            ],
          },
        ],
      },
      {
        id: 'showers',
        name: 'Showers & Tubs',
        productCategories: [
          {
            id: 'shower-doors',
            name: 'Shower Doors',
            products: [
              createSampleProduct('shower-door-001', 'Frameless Shower Door 60"', 'FSD-60', 499, 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800'),
            ],
          },
          {
            id: 'bathtubs',
            name: 'Bathtubs',
            products: [
              createSampleProduct('tub-001', 'Alcove Bathtub 60" White', 'AB-60-WH', 349, 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800'),
              createSampleProduct('tub-002', 'Freestanding Tub 67"', 'FT-67', 899, 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800'),
            ],
          },
          {
            id: 'shower-heads',
            name: 'Shower Heads',
            products: [
              createSampleProduct('shower-001', 'Rain Shower Head 8" Chrome', 'RSH-8-CH', 49, 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800'),
            ],
          },
        ],
      },
      {
        id: 'mirrors',
        name: 'Bathroom Mirrors',
        productCategories: [
          {
            id: 'framed-mirrors',
            name: 'Framed Mirrors',
            products: [
              createSampleProduct('mirror-001', 'Framed Mirror 24x36" Black', 'FM-24x36-BK', 89, 'https://images.unsplash.com/photo-1620626011761-996317b8d101?w=800'),
            ],
          },
          {
            id: 'led-mirrors',
            name: 'LED Mirrors',
            products: [
              createSampleProduct('mirror-led-001', 'LED Mirror 32x24"', 'LM-32x24', 199, 'https://images.unsplash.com/photo-1620626011761-996317b8d101?w=800'),
            ],
          },
        ],
      },
      {
        id: 'storage',
        name: 'Bathroom Storage',
        productCategories: [
          {
            id: 'medicine-cabinets',
            name: 'Medicine Cabinets',
            products: [
              createSampleProduct('med-cab-001', 'Medicine Cabinet 20x26" White', 'MC-20x26-WH', 79, 'https://images.unsplash.com/photo-1620626011761-996317b8d101?w=800'),
            ],
          },
          {
            id: 'linen-cabinets',
            name: 'Linen Cabinets',
            products: [
              createSampleProduct('linen-001', 'Linen Cabinet White Tall', 'LC-TALL-WH', 249, 'https://images.unsplash.com/photo-1620626011761-996317b8d101?w=800'),
            ],
          },
        ],
      },
      {
        id: 'accessories',
        name: 'Bathroom Accessories',
        productCategories: [
          {
            id: 'towel-bars',
            name: 'Towel Bars & Rings',
            products: [
              createSampleProduct('towel-001', 'Towel Bar 24" Chrome', 'TB-24-CH', 19.99, 'https://images.unsplash.com/photo-1620626011761-996317b8d101?w=800'),
            ],
          },
          {
            id: 'toilet-paper-holders',
            name: 'Toilet Paper Holders',
            products: [
              createSampleProduct('tp-holder-001', 'TP Holder Chrome', 'TPH-CH', 14.99, 'https://images.unsplash.com/photo-1620626011761-996317b8d101?w=800'),
            ],
          },
        ],
      },
      {
        id: 'ventilation',
        name: 'Bathroom Ventilation',
        productCategories: [
          {
            id: 'exhaust-fans',
            name: 'Exhaust Fans',
            products: [
              createSampleProduct('fan-001', 'Bathroom Exhaust Fan 80 CFM', 'BEF-80', 39.99, 'https://images.unsplash.com/photo-1620626011761-996317b8d101?w=800'),
            ],
          },
        ],
      },
      {
        id: 'shower-systems',
        name: 'Shower Systems',
        productCategories: [
          {
            id: 'complete-shower-systems',
            name: 'Complete Shower Systems',
            products: [
              createSampleProduct('shower-sys-001', 'Shower System with Rain Head', 'SS-RAIN', 299, 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800'),
            ],
          },
        ],
      },
      {
        id: 'countertops',
        name: 'Bathroom Countertops',
        productCategories: [
          {
            id: 'vanity-tops',
            name: 'Vanity Tops',
            products: [
              createSampleProduct('vanity-top-001', 'Vanity Top 49" Marble', 'VT-49-MAR', 249, 'https://images.unsplash.com/photo-1620626011761-996317b8d101?w=800'),
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'door-window',
    name: 'Door & Window',
    icon: '🚪',
    description: 'Door and Window Hardware',
    subCategories: [
      {
        id: 'interior-doors',
        name: 'Interior Doors',
        productCategories: [
          {
            id: 'panel-doors',
            name: 'Panel Doors',
            products: [
              createSampleProduct('door-panel-001', '6-Panel Door 32x80"', 'PD-6-32x80', 89, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800'),
            ],
          },
          {
            id: 'barn-doors',
            name: 'Barn Doors',
            products: [
              createSampleProduct('door-barn-001', 'Barn Door 36x84"', 'BD-36x84', 249, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800'),
            ],
          },
        ],
      },
      {
        id: 'exterior-doors',
        name: 'Exterior Doors',
        productCategories: [
          {
            id: 'entry-doors',
            name: 'Entry Doors',
            products: [
              createSampleProduct('door-entry-001', 'Steel Entry Door 36x80"', 'ED-ST-36x80', 399, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800'),
              createSampleProduct('door-entry-002', 'Fiberglass Entry Door', 'ED-FG-36x80', 599, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800'),
            ],
          },
          {
            id: 'patio-doors',
            name: 'Patio Doors',
            products: [
              createSampleProduct('door-patio-001', 'Sliding Patio Door 72x80"', 'PD-SL-72x80', 899, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800'),
            ],
          },
        ],
      },
      {
        id: 'windows',
        name: 'Windows',
        productCategories: [
          {
            id: 'double-hung-windows',
            name: 'Double Hung Windows',
            products: [
              createSampleProduct('win-dh-001', 'Double Hung Window 32x54"', 'DHW-32x54', 249, 'https://images.unsplash.com/photo-1615876234886-fd9a39fda97f?w=800'),
            ],
          },
          {
            id: 'casement-windows',
            name: 'Casement Windows',
            products: [
              createSampleProduct('win-cas-001', 'Casement Window 24x48"', 'CW-24x48', 299, 'https://images.unsplash.com/photo-1615876234886-fd9a39fda97f?w=800'),
            ],
          },
        ],
      },
      {
        id: 'door-hardware',
        name: 'Door Hardware',
        productCategories: [
          {
            id: 'door-knobs',
            name: 'Door Knobs',
            products: [
              createSampleProduct('knob-001', 'Door Knob Set Satin Nickel', 'DK-SN', 24.99, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800'),
            ],
          },
          {
            id: 'door-levers',
            name: 'Door Levers',
            products: [
              createSampleProduct('lever-001', 'Door Lever Set Chrome', 'DL-CH', 34.99, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800'),
            ],
          },
          {
            id: 'deadbolts',
            name: 'Deadbolts',
            products: [
              createSampleProduct('dead-001', 'Single Cylinder Deadbolt', 'DB-SC', 29.99, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800'),
            ],
          },
        ],
      },
      {
        id: 'hinges',
        name: 'Door Hinges',
        productCategories: [
          {
            id: 'interior-hinges',
            name: 'Interior Hinges',
            products: [
              createSampleProduct('hinge-001', 'Door Hinge 3.5" Satin Nickel', 'DH-35-SN', 4.99, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800'),
            ],
          },
        ],
      },
      {
        id: 'window-hardware',
        name: 'Window Hardware',
        productCategories: [
          {
            id: 'window-locks',
            name: 'Window Locks',
            products: [
              createSampleProduct('win-lock-001', 'Sash Lock White', 'WL-WH', 5.99, 'https://images.unsplash.com/photo-1615876234886-fd9a39fda97f?w=800'),
            ],
          },
        ],
      },
      {
        id: 'garage-doors',
        name: 'Garage Doors',
        productCategories: [
          {
            id: 'sectional-garage-doors',
            name: 'Sectional Garage Doors',
            products: [
              createSampleProduct('garage-001', 'Garage Door 16x7ft Insulated', 'GD-16x7-INS', 899, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800'),
            ],
          },
          {
            id: 'garage-openers',
            name: 'Garage Door Openers',
            products: [
              createSampleProduct('opener-001', 'Garage Door Opener 1/2 HP', 'GDO-12HP', 249, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800'),
            ],
          },
        ],
      },
      {
        id: 'storm-doors',
        name: 'Storm Doors',
        productCategories: [
          {
            id: 'full-view-storm',
            name: 'Full-View Storm Doors',
            products: [
              createSampleProduct('storm-001', 'Storm Door Full View 36"', 'SD-FV-36', 199, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800'),
            ],
          },
        ],
      },
      {
        id: 'door-accessories',
        name: 'Door Accessories',
        productCategories: [
          {
            id: 'door-stops',
            name: 'Door Stops',
            products: [
              createSampleProduct('stop-001', 'Door Stop Rubber', 'DS-RUB', 3.99, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800'),
            ],
          },
          {
            id: 'door-closers',
            name: 'Door Closers',
            products: [
              createSampleProduct('closer-001', 'Hydraulic Door Closer', 'DC-HYD', 44.99, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800'),
            ],
          },
        ],
      },
      {
        id: 'weather-stripping',
        name: 'Weather Stripping',
        productCategories: [
          {
            id: 'door-weather-strip',
            name: 'Door Weather Stripping',
            products: [
              createSampleProduct('weather-001', 'Door Sweep 36"', 'DWS-36', 8.99, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800'),
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'safety',
    name: 'Safety & PPE',
    icon: '🦺',
    description: 'Personal Protective Equipment',
    subCategories: [
      {
        id: 'hand-protection',
        name: 'Hand Protection',
        productCategories: [
          {
            id: 'work-gloves',
            name: 'Work Gloves',
            products: [
              createSampleProduct('glove-001', 'Leather Work Gloves L', 'LWG-L', 12.99, 'https://images.unsplash.com/photo-1621346136755-ee8c4c4b1d3e?w=800'),
              createSampleProduct('glove-002', 'Nitrile Coated Gloves', 'NCG-L', 8.99, 'https://images.unsplash.com/photo-1621346136755-ee8c4c4b1d3e?w=800'),
            ],
          },
          {
            id: 'chemical-gloves',
            name: 'Chemical Resistant Gloves',
            products: [
              createSampleProduct('glove-chem-001', 'Chemical Resistant Gloves XL', 'CRG-XL', 24.99, 'https://images.unsplash.com/photo-1621346136755-ee8c4c4b1d3e?w=800'),
            ],
          },
        ],
      },
      {
        id: 'eye-protection',
        name: 'Eye & Face Protection',
        productCategories: [
          {
            id: 'safety-glasses',
            name: 'Safety Glasses',
            products: [
              createSampleProduct('glass-001', 'Safety Glasses Clear Lens', 'SG-CL', 6.99, 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800'),
            ],
          },
          {
            id: 'face-shields',
            name: 'Face Shields',
            products: [
              createSampleProduct('shield-001', 'Face Shield Clear', 'FS-CL', 14.99, 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800'),
            ],
          },
          {
            id: 'goggles',
            name: 'Safety Goggles',
            products: [
              createSampleProduct('goggle-001', 'Safety Goggles Anti-Fog', 'SG-AF', 9.99, 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800'),
            ],
          },
        ],
      },
      {
        id: 'head-protection',
        name: 'Head Protection',
        productCategories: [
          {
            id: 'hard-hats',
            name: 'Hard Hats',
            products: [
              createSampleProduct('hat-001', 'Hard Hat Type 1 Yellow', 'HH-T1-YL', 19.99, 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=800'),
              createSampleProduct('hat-002', 'Hard Hat Type 2 White', 'HH-T2-WH', 29.99, 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=800'),
            ],
          },
        ],
      },
      {
        id: 'hearing-protection',
        name: 'Hearing Protection',
        productCategories: [
          {
            id: 'ear-plugs',
            name: 'Ear Plugs',
            products: [
              createSampleProduct('plug-001', 'Foam Ear Plugs 50-Pack', 'EP-50', 9.99, 'https://images.unsplash.com/photo-1621346136755-ee8c4c4b1d3e?w=800'),
            ],
          },
          {
            id: 'ear-muffs',
            name: 'Ear Muffs',
            products: [
              createSampleProduct('muff-001', 'Ear Muffs NRR 30dB', 'EM-30', 24.99, 'https://images.unsplash.com/photo-1621346136755-ee8c4c4b1d3e?w=800'),
            ],
          },
        ],
      },
      {
        id: 'respiratory',
        name: 'Respiratory Protection',
        productCategories: [
          {
            id: 'dust-masks',
            name: 'Dust Masks',
            products: [
              createSampleProduct('mask-001', 'N95 Dust Mask 20-Pack', 'DM-N95-20', 29.99, 'https://images.unsplash.com/photo-1584573502261-e93502af3fd6?w=800'),
            ],
          },
          {
            id: 'respirators',
            name: 'Respirators',
            products: [
              createSampleProduct('resp-001', 'Half-Face Respirator', 'HFR-001', 39.99, 'https://images.unsplash.com/photo-1584573502261-e93502af3fd6?w=800'),
            ],
          },
        ],
      },
      {
        id: 'protective-clothing',
        name: 'Protective Clothing',
        productCategories: [
          {
            id: 'safety-vests',
            name: 'Safety Vests',
            products: [
              createSampleProduct('vest-001', 'Safety Vest Class 2 Orange', 'SV-C2-OR', 12.99, 'https://images.unsplash.com/photo-1621346136755-ee8c4c4b1d3e?w=800'),
            ],
          },
          {
            id: 'coveralls',
            name: 'Coveralls',
            products: [
              createSampleProduct('cover-001', 'Disposable Coveralls XL', 'DC-XL', 8.99, 'https://images.unsplash.com/photo-1621346136755-ee8c4c4b1d3e?w=800'),
            ],
          },
        ],
      },
      {
        id: 'fall-protection',
        name: 'Fall Protection',
        productCategories: [
          {
            id: 'safety-harness',
            name: 'Safety Harnesses',
            products: [
              createSampleProduct('harness-001', 'Full Body Harness', 'FBH-001', 89.99, 'https://images.unsplash.com/photo-1621346136755-ee8c4c4b1d3e?w=800'),
            ],
          },
          {
            id: 'lanyards',
            name: 'Safety Lanyards',
            products: [
              createSampleProduct('lanyard-001', 'Shock Absorbing Lanyard 6ft', 'SAL-6', 49.99, 'https://images.unsplash.com/photo-1621346136755-ee8c4c4b1d3e?w=800'),
            ],
          },
        ],
      },
      {
        id: 'foot-protection',
        name: 'Foot Protection',
        productCategories: [
          {
            id: 'safety-boots',
            name: 'Safety Boots',
            products: [
              createSampleProduct('boot-001', 'Steel Toe Work Boots Size 10', 'STB-10', 79.99, 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800'),
            ],
          },
        ],
      },
      {
        id: 'first-aid',
        name: 'First Aid',
        productCategories: [
          {
            id: 'first-aid-kits',
            name: 'First Aid Kits',
            products: [
              createSampleProduct('aid-001', 'First Aid Kit 100-Piece', 'FAK-100', 24.99, 'https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=800'),
            ],
          },
        ],
      },
      {
        id: 'safety-signs',
        name: 'Safety Signs',
        productCategories: [
          {
            id: 'warning-signs',
            name: 'Warning Signs',
            products: [
              createSampleProduct('sign-001', 'Caution Sign Wet Floor', 'CS-WF', 19.99, 'https://images.unsplash.com/photo-1621346136755-ee8c4c4b1d3e?w=800'),
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'flooring',
    name: 'Flooring',
    icon: '🪵',
    description: 'Floor Covering Solutions',
    subCategories: [
      {
        id: 'hardwood',
        name: 'Hardwood Flooring',
        productCategories: [
          {
            id: 'solid-hardwood',
            name: 'Solid Hardwood',
            products: [
              createSampleProduct('hard-solid-001', 'Oak Solid Hardwood 3/4" x 3-1/4"', 'OSH-34-314', 4.99, 'https://images.unsplash.com/photo-1615875474908-f403116f5e5a?w=800'),
              createSampleProduct('hard-solid-002', 'Maple Solid Hardwood 3/4" x 5"', 'MSH-34-5', 5.99, 'https://images.unsplash.com/photo-1615875474908-f403116f5e5a?w=800'),
            ],
          },
          {
            id: 'engineered-hardwood',
            name: 'Engineered Hardwood',
            products: [
              createSampleProduct('hard-eng-001', 'Engineered Oak 1/2" x 5"', 'EOH-12-5', 3.99, 'https://images.unsplash.com/photo-1615875474908-f403116f5e5a?w=800'),
            ],
          },
        ],
      },
      {
        id: 'laminate',
        name: 'Laminate Flooring',
        productCategories: [
          {
            id: 'wood-look-laminate',
            name: 'Wood-Look Laminate',
            products: [
              createSampleProduct('lam-wood-001', 'Laminate Oak Look 8mm', 'LO-8MM', 1.99, 'https://images.unsplash.com/photo-1615875474908-f403116f5e5a?w=800'),
              createSampleProduct('lam-wood-002', 'Laminate Walnut Look 12mm', 'LW-12MM', 2.49, 'https://images.unsplash.com/photo-1615875474908-f403116f5e5a?w=800'),
            ],
          },
          {
            id: 'stone-look-laminate',
            name: 'Stone-Look Laminate',
            products: [
              createSampleProduct('lam-stone-001', 'Laminate Slate Look 10mm', 'LS-10MM', 2.29, 'https://images.unsplash.com/photo-1615875474908-f403116f5e5a?w=800'),
            ],
          },
        ],
      },
      {
        id: 'vinyl',
        name: 'Vinyl Flooring',
        productCategories: [
          {
            id: 'lvp',
            name: 'Luxury Vinyl Plank (LVP)',
            products: [
              createSampleProduct('vinyl-lvp-001', 'LVP Oak 6" x 48"', 'LVP-OAK-6x48', 2.99, 'https://images.unsplash.com/photo-1615875474908-f403116f5e5a?w=800'),
              createSampleProduct('vinyl-lvp-002', 'LVP Waterproof 7" x 48"', 'LVP-WP-7x48', 3.49, 'https://images.unsplash.com/photo-1615875474908-f403116f5e5a?w=800'),
            ],
          },
          {
            id: 'lvt',
            name: 'Luxury Vinyl Tile (LVT)',
            products: [
              createSampleProduct('vinyl-lvt-001', 'LVT Stone Look 12" x 24"', 'LVT-ST-12x24', 2.79, 'https://images.unsplash.com/photo-1615875474908-f403116f5e5a?w=800'),
            ],
          },
          {
            id: 'sheet-vinyl',
            name: 'Sheet Vinyl',
            products: [
              createSampleProduct('vinyl-sheet-001', 'Sheet Vinyl 12ft Wide', 'SV-12FT', 1.49, 'https://images.unsplash.com/photo-1615875474908-f403116f5e5a?w=800'),
            ],
          },
        ],
      },
      {
        id: 'tile',
        name: 'Tile Flooring',
        productCategories: [
          {
            id: 'ceramic-tile',
            name: 'Ceramic Tile',
            products: [
              createSampleProduct('tile-cer-001', 'Ceramic Tile 12x12" White', 'CT-12x12-WH', 1.29, 'https://images.unsplash.com/photo-1615876234886-fd9a39fda97f?w=800'),
            ],
          },
          {
            id: 'porcelain-tile',
            name: 'Porcelain Tile',
            products: [
              createSampleProduct('tile-por-001', 'Porcelain Tile 24x24" Gray', 'PT-24x24-GR', 3.99, 'https://images.unsplash.com/photo-1615876234886-fd9a39fda97f?w=800'),
            ],
          },
        ],
      },
      {
        id: 'carpet',
        name: 'Carpet',
        productCategories: [
          {
            id: 'carpet-rolls',
            name: 'Carpet Rolls',
            products: [
              createSampleProduct('carpet-001', 'Plush Carpet 12ft Wide Beige', 'PC-12FT-BG', 2.99, 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800'),
            ],
          },
          {
            id: 'carpet-tiles',
            name: 'Carpet Tiles',
            products: [
              createSampleProduct('carpet-tile-001', 'Carpet Tile 18x18" Gray', 'CPT-18x18-GR', 1.99, 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800'),
            ],
          },
        ],
      },
      {
        id: 'underlayment',
        name: 'Flooring Underlayment',
        productCategories: [
          {
            id: 'foam-underlayment',
            name: 'Foam Underlayment',
            products: [
              createSampleProduct('under-foam-001', 'Foam Underlayment 3mm 100 sq.ft', 'FU-3MM-100', 29.99, 'https://images.unsplash.com/photo-1615875474908-f403116f5e5a?w=800'),
            ],
          },
        ],
      },
      {
        id: 'area-rugs',
        name: 'Area Rugs',
        productCategories: [
          {
            id: 'indoor-rugs',
            name: 'Indoor Rugs',
            products: [
              createSampleProduct('rug-001', 'Area Rug 5x7 Beige', 'AR-5x7-BG', 79.99, 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800'),
            ],
          },
        ],
      },
      {
        id: 'molding-trim',
        name: 'Flooring Molding & Trim',
        productCategories: [
          {
            id: 'baseboards',
            name: 'Baseboards',
            products: [
              createSampleProduct('base-001', 'Baseboard MDF 3-1/4" 8ft', 'BB-MDF-314-8', 8.99, 'https://images.unsplash.com/photo-1615875474908-f403116f5e5a?w=800'),
            ],
          },
          {
            id: 'quarter-round',
            name: 'Quarter Round',
            products: [
              createSampleProduct('qr-001', 'Quarter Round 3/4" 8ft Oak', 'QR-34-8-OAK', 4.99, 'https://images.unsplash.com/photo-1615875474908-f403116f5e5a?w=800'),
            ],
          },
        ],
      },
      {
        id: 'adhesives',
        name: 'Flooring Adhesives',
        productCategories: [
          {
            id: 'tile-adhesive',
            name: 'Tile Adhesive',
            products: [
              createSampleProduct('adh-tile-001', 'Thinset Mortar 50lb', 'TM-50', 19.99, 'https://images.unsplash.com/photo-1615875474908-f403116f5e5a?w=800'),
            ],
          },
        ],
      },
      {
        id: 'flooring-tools',
        name: 'Flooring Tools',
        productCategories: [
          {
            id: 'flooring-installation',
            name: 'Installation Tools',
            products: [
              createSampleProduct('tool-floor-001', 'Flooring Pull Bar', 'FPB-001', 14.99, 'https://images.unsplash.com/photo-1615875474908-f403116f5e5a?w=800'),
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'heating',
    name: 'Heating & Cooling',
    icon: '❄️',
    description: 'HVAC Systems and Climate Control',
    subCategories: [
      {
        id: 'central-ac',
        name: 'Central Air Conditioning',
        productCategories: [
          {
            id: 'central-ac-units',
            name: 'Central AC Units',
            products: [
              createSampleProduct('central-ac-001', 'Central AC 3-Ton 14 SEER', 'CAC-3T-14S', 2499, 'https://images.unsplash.com/photo-1689596312367-39a4461504c1?w=800'),
            ],
          },
        ],
      },
      {
        id: 'heat-pumps',
        name: 'Heat Pumps',
        productCategories: [
          {
            id: 'air-heat-pumps',
            name: 'Air Source Heat Pumps',
            products: [
              createSampleProduct('hp-air-001', 'Heat Pump 2.5-Ton 15 SEER', 'HP-25T-15S', 2799, 'https://images.unsplash.com/photo-1689596312367-39a4461504c1?w=800'),
            ],
          },
        ],
      },
      {
        id: 'furnaces',
        name: 'Furnaces',
        productCategories: [
          {
            id: 'gas-furnaces',
            name: 'Gas Furnaces',
            products: [
              createSampleProduct('furn-gas-001', 'Gas Furnace 80000 BTU 96% AFUE', 'GF-80K-96', 1899, 'https://images.unsplash.com/photo-1607400201889-565b1ee75f8e?w=800'),
            ],
          },
          {
            id: 'electric-furnaces',
            name: 'Electric Furnaces',
            products: [
              createSampleProduct('furn-elec-001', 'Electric Furnace 15kW', 'EF-15KW', 899, 'https://images.unsplash.com/photo-1607400201889-565b1ee75f8e?w=800'),
            ],
          },
        ],
      },
      {
        id: 'thermostats',
        name: 'Thermostats',
        productCategories: [
          {
            id: 'programmable-thermostats',
            name: 'Programmable Thermostats',
            products: [
              createSampleProduct('thermo-prog-001', 'Programmable Thermostat 7-Day', 'PT-7D', 49.99, 'https://images.unsplash.com/photo-1545259742-24f814ccef0f?w=800'),
            ],
          },
          {
            id: 'smart-thermostats',
            name: 'Smart Thermostats',
            products: [
              createSampleProduct('thermo-smart-001', 'Smart WiFi Thermostat', 'SWT-001', 199, 'https://images.unsplash.com/photo-1545259742-24f814ccef0f?w=800'),
            ],
          },
        ],
      },
      {
        id: 'space-heaters',
        name: 'Space Heaters',
        productCategories: [
          {
            id: 'electric-heaters',
            name: 'Electric Space Heaters',
            products: [
              createSampleProduct('heat-elec-001', 'Electric Space Heater 1500W', 'ESH-1500', 49.99, 'https://images.unsplash.com/photo-1607400201889-565b1ee75f8e?w=800'),
            ],
          },
          {
            id: 'propane-heaters',
            name: 'Propane Heaters',
            products: [
              createSampleProduct('heat-prop-001', 'Propane Heater 30000 BTU', 'PH-30K', 129, 'https://images.unsplash.com/photo-1607400201889-565b1ee75f8e?w=800'),
            ],
          },
        ],
      },
      {
        id: 'fans',
        name: 'Fans',
        productCategories: [
          {
            id: 'ceiling-fans',
            name: 'Ceiling Fans',
            products: [
              createSampleProduct('fan-ceil-001', 'Ceiling Fan 52" with Light', 'CF-52-L', 89.99, 'https://images.unsplash.com/photo-1576758559345-2562684b6c7b?w=800'),
            ],
          },
          {
            id: 'box-fans',
            name: 'Box Fans',
            products: [
              createSampleProduct('fan-box-001', 'Box Fan 20"', 'BF-20', 24.99, 'https://images.unsplash.com/photo-1576758559345-2562684b6c7b?w=800'),
            ],
          },
        ],
      },
      {
        id: 'air-filters',
        name: 'Air Filters',
        productCategories: [
          {
            id: 'furnace-filters',
            name: 'Furnace Filters',
            products: [
              createSampleProduct('filter-001', 'Furnace Filter 16x25x1 MERV 11', 'FF-16x25-M11', 14.99, 'https://images.unsplash.com/photo-1607400201889-565b1ee75f8e?w=800'),
            ],
          },
        ],
      },
      {
        id: 'duct-vents',
        name: 'Ducts & Vents',
        productCategories: [
          {
            id: 'flex-duct',
            name: 'Flexible Ductwork',
            products: [
              createSampleProduct('duct-flex-001', 'Flexible Duct 6" x 25ft', 'FD-6-25', 34.99, 'https://images.unsplash.com/photo-1607400201889-565b1ee75f8e?w=800'),
            ],
          },
          {
            id: 'registers',
            name: 'Registers & Grilles',
            products: [
              createSampleProduct('reg-001', 'Floor Register 4x10" White', 'FR-4x10-WH', 9.99, 'https://images.unsplash.com/photo-1607400201889-565b1ee75f8e?w=800'),
            ],
          },
        ],
      },
      {
        id: 'humidifiers',
        name: 'Humidifiers',
        productCategories: [
          {
            id: 'portable-humidifiers',
            name: 'Portable Humidifiers',
            products: [
              createSampleProduct('humid-001', 'Cool Mist Humidifier 1 Gal', 'CMH-1G', 39.99, 'https://images.unsplash.com/photo-1607400201889-565b1ee75f8e?w=800'),
            ],
          },
        ],
      },
      {
        id: 'air-purifiers',
        name: 'Air Purifiers',
        productCategories: [
          {
            id: 'hepa-purifiers',
            name: 'HEPA Air Purifiers',
            products: [
              createSampleProduct('purif-001', 'HEPA Air Purifier Large Room', 'HAP-LR', 199, 'https://images.unsplash.com/photo-1607400201889-565b1ee75f8e?w=800'),
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'kitchen',
    name: 'Kitchen',
    icon: '🍳',
    description: 'Kitchen Cabinets and Fixtures',
    subCategories: [
      {
        id: 'kitchen-cabinets',
        name: 'Kitchen Cabinets',
        productCategories: [
          {
            id: 'base-cabinets',
            name: 'Base Cabinets',
            products: [
              createSampleProduct('cab-base-001', 'Base Cabinet 24" Shaker White', 'BC-24-SW', 249, 'https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?w=800'),
              createSampleProduct('cab-base-002', 'Base Cabinet 36" Shaker Gray', 'BC-36-SG', 349, 'https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?w=800'),
            ],
          },
          {
            id: 'wall-cabinets',
            name: 'Wall Cabinets',
            products: [
              createSampleProduct('cab-wall-001', 'Wall Cabinet 30" White', 'WC-30-WH', 189, 'https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?w=800'),
            ],
          },
          {
            id: 'pantry-cabinets',
            name: 'Pantry Cabinets',
            products: [
              createSampleProduct('cab-pantry-001', 'Pantry Cabinet 18" Tall', 'PC-18-T', 599, 'https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?w=800'),
            ],
          },
        ],
      },
      {
        id: 'kitchen-sinks',
        name: 'Kitchen Sinks',
        productCategories: [
          {
            id: 'undermount-sinks',
            name: 'Undermount Sinks',
            products: [
              createSampleProduct('sink-under-001', 'Undermount Sink 32" Stainless', 'US-32-SS', 199, 'https://images.unsplash.com/photo-1585758389191-c5cc56d10ff2?w=800'),
            ],
          },
          {
            id: 'drop-in-sinks',
            name: 'Drop-In Sinks',
            products: [
              createSampleProduct('sink-drop-001', 'Drop-In Sink 33" Double Bowl', 'DS-33-DB', 149, 'https://images.unsplash.com/photo-1585758389191-c5cc56d10ff2?w=800'),
            ],
          },
          {
            id: 'farmhouse-sinks',
            name: 'Farmhouse Sinks',
            products: [
              createSampleProduct('sink-farm-001', 'Farmhouse Sink 36" Fireclay', 'FS-36-FC', 599, 'https://images.unsplash.com/photo-1585758389191-c5cc56d10ff2?w=800'),
            ],
          },
        ],
      },
      {
        id: 'kitchen-faucets',
        name: 'Kitchen Faucets',
        productCategories: [
          {
            id: 'pull-down-faucets',
            name: 'Pull-Down Faucets',
            products: [
              createSampleProduct('faucet-pd-001', 'Pull-Down Faucet Chrome', 'PDF-CH', 149, 'https://images.unsplash.com/photo-1585758389191-c5cc56d10ff2?w=800'),
            ],
          },
          {
            id: 'commercial-faucets',
            name: 'Commercial Style Faucets',
            products: [
              createSampleProduct('faucet-com-001', 'Commercial Faucet Stainless', 'CF-SS', 299, 'https://images.unsplash.com/photo-1585758389191-c5cc56d10ff2?w=800'),
            ],
          },
        ],
      },
      {
        id: 'countertops',
        name: 'Countertops',
        productCategories: [
          {
            id: 'laminate-countertops',
            name: 'Laminate Countertops',
            products: [
              createSampleProduct('counter-lam-001', 'Laminate Countertop 8ft White', 'LC-8-WH', 99, 'https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?w=800'),
            ],
          },
          {
            id: 'butcher-block',
            name: 'Butcher Block Countertops',
            products: [
              createSampleProduct('counter-bb-001', 'Butcher Block Countertop Oak 6ft', 'BBC-OAK-6', 249, 'https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?w=800'),
            ],
          },
        ],
      },
      {
        id: 'backsplash',
        name: 'Backsplash Tile',
        productCategories: [
          {
            id: 'subway-tile',
            name: 'Subway Tile',
            products: [
              createSampleProduct('back-sub-001', 'Subway Tile 3x6" White', 'ST-3x6-WH', 4.99, 'https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?w=800'),
            ],
          },
          {
            id: 'mosaic-tile',
            name: 'Mosaic Tile',
            products: [
              createSampleProduct('back-mos-001', 'Glass Mosaic Tile 12x12" Blue', 'GMT-12x12-BL', 12.99, 'https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?w=800'),
            ],
          },
        ],
      },
      {
        id: 'kitchen-islands',
        name: 'Kitchen Islands',
        productCategories: [
          {
            id: 'portable-islands',
            name: 'Portable Kitchen Islands',
            products: [
              createSampleProduct('island-001', 'Kitchen Island Cart with Storage', 'KIC-ST', 399, 'https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?w=800'),
            ],
          },
        ],
      },
      {
        id: 'range-hoods',
        name: 'Range Hoods',
        productCategories: [
          {
            id: 'under-cabinet-hoods',
            name: 'Under Cabinet Range Hoods',
            products: [
              createSampleProduct('hood-uc-001', 'Under Cabinet Hood 30" Stainless', 'UCH-30-SS', 249, 'https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?w=800'),
            ],
          },
          {
            id: 'wall-mount-hoods',
            name: 'Wall Mount Range Hoods',
            products: [
              createSampleProduct('hood-wm-001', 'Wall Mount Hood 36" Stainless', 'WMH-36-SS', 399, 'https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?w=800'),
            ],
          },
        ],
      },
      {
        id: 'cabinet-hardware',
        name: 'Cabinet Hardware',
        productCategories: [
          {
            id: 'cabinet-pulls',
            name: 'Cabinet Pulls',
            products: [
              createSampleProduct('pull-001', 'Cabinet Pull 5" Satin Nickel', 'CP-5-SN', 4.99, 'https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?w=800'),
            ],
          },
          {
            id: 'cabinet-knobs',
            name: 'Cabinet Knobs',
            products: [
              createSampleProduct('knob-cab-001', 'Cabinet Knob Round Chrome', 'CK-RD-CH', 2.99, 'https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?w=800'),
            ],
          },
        ],
      },
      {
        id: 'garbage-disposals',
        name: 'Garbage Disposals',
        productCategories: [
          {
            id: 'continuous-feed',
            name: 'Continuous Feed Disposals',
            products: [
              createSampleProduct('disposal-001', 'Garbage Disposal 1/2 HP', 'GD-12HP', 89.99, 'https://images.unsplash.com/photo-1585758389191-c5cc56d10ff2?w=800'),
            ],
          },
        ],
      },
      {
        id: 'kitchen-lighting',
        name: 'Kitchen Lighting',
        productCategories: [
          {
            id: 'pendant-lights',
            name: 'Pendant Lights',
            products: [
              createSampleProduct('pendant-001', 'Kitchen Pendant Light Bronze', 'KPL-BZ', 79.99, 'https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?w=800'),
            ],
          },
          {
            id: 'under-cabinet-lighting',
            name: 'Under Cabinet Lighting',
            products: [
              createSampleProduct('ucl-001', 'LED Under Cabinet Light 24"', 'UCL-LED-24', 34.99, 'https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?w=800'),
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'lighting',
    name: 'Lighting',
    icon: '💡',
    description: 'Indoor and Outdoor Lighting',
    subCategories: [
      {
        id: 'ceiling-lights',
        name: 'Ceiling Lights',
        productCategories: [
          {
            id: 'flush-mount',
            name: 'Flush Mount Ceiling Lights',
            products: [
              createSampleProduct('ceil-flush-001', 'Flush Mount LED 14" Brushed Nickel', 'FM-LED-14-BN', 49.99, 'https://images.unsplash.com/photo-1758304481967-9edc1307f9d6?w=800'),
            ],
          },
          {
            id: 'semi-flush',
            name: 'Semi-Flush Mount Lights',
            products: [
              createSampleProduct('ceil-semi-001', 'Semi-Flush Mount 3-Light Bronze', 'SFM-3L-BZ', 89.99, 'https://images.unsplash.com/photo-1758304481967-9edc1307f9d6?w=800'),
            ],
          },
        ],
      },
      {
        id: 'chandeliers',
        name: 'Chandeliers',
        productCategories: [
          {
            id: 'traditional-chandeliers',
            name: 'Traditional Chandeliers',
            products: [
              createSampleProduct('chand-trad-001', 'Chandelier 6-Light Crystal', 'CH-6L-CR', 299, 'https://images.unsplash.com/photo-1567225591450-b637e8d2a4c0?w=800'),
            ],
          },
          {
            id: 'modern-chandeliers',
            name: 'Modern Chandeliers',
            products: [
              createSampleProduct('chand-mod-001', 'Modern Chandelier 8-Light Black', 'CH-8L-BK', 399, 'https://images.unsplash.com/photo-1567225591450-b637e8d2a4c0?w=800'),
            ],
          },
        ],
      },
      {
        id: 'pendant-lighting',
        name: 'Pendant Lighting',
        productCategories: [
          {
            id: 'mini-pendants',
            name: 'Mini Pendants',
            products: [
              createSampleProduct('pend-mini-001', 'Mini Pendant Glass Shade', 'MP-GL', 39.99, 'https://images.unsplash.com/photo-1565183928294-14e41a5e2b6f?w=800'),
            ],
          },
          {
            id: 'multi-light-pendants',
            name: 'Multi-Light Pendants',
            products: [
              createSampleProduct('pend-multi-001', 'Multi-Light Pendant 3-Light', 'MLP-3L', 149, 'https://images.unsplash.com/photo-1565183928294-14e41a5e2b6f?w=800'),
            ],
          },
        ],
      },
      {
        id: 'wall-sconces',
        name: 'Wall Sconces',
        productCategories: [
          {
            id: 'indoor-sconces',
            name: 'Indoor Wall Sconces',
            products: [
              createSampleProduct('sconce-in-001', 'Wall Sconce 1-Light Chrome', 'WS-1L-CH', 49.99, 'https://images.unsplash.com/photo-1565183928294-14e41a5e2b6f?w=800'),
            ],
          },
        ],
      },
      {
        id: 'track-lighting',
        name: 'Track Lighting',
        productCategories: [
          {
            id: 'fixed-track',
            name: 'Fixed Track Lighting',
            products: [
              createSampleProduct('track-fix-001', 'Track Lighting Kit 4-Light', 'TL-4L', 79.99, 'https://images.unsplash.com/photo-1565183928294-14e41a5e2b6f?w=800'),
            ],
          },
        ],
      },
      {
        id: 'recessed-lighting',
        name: 'Recessed Lighting',
        productCategories: [
          {
            id: 'led-recessed',
            name: 'LED Recessed Lights',
            products: [
              createSampleProduct('recess-led-001', 'LED Recessed Light 4" Retrofit', 'RL-LED-4', 19.99, 'https://images.unsplash.com/photo-1565183928294-14e41a5e2b6f?w=800'),
              createSampleProduct('recess-led-002', 'LED Recessed Light 6" New Construction', 'RL-LED-6-NC', 24.99, 'https://images.unsplash.com/photo-1565183928294-14e41a5e2b6f?w=800'),
            ],
          },
        ],
      },
      {
        id: 'outdoor-lighting',
        name: 'Outdoor Lighting',
        productCategories: [
          {
            id: 'porch-lights',
            name: 'Porch & Patio Lights',
            products: [
              createSampleProduct('outdoor-porch-001', 'Outdoor Wall Lantern Black', 'OWL-BK', 59.99, 'https://images.unsplash.com/photo-1565183928294-14e41a5e2b6f?w=800'),
            ],
          },
          {
            id: 'landscape-lights',
            name: 'Landscape Lighting',
            products: [
              createSampleProduct('outdoor-land-001', 'LED Landscape Light Path', 'LL-LED-PATH', 29.99, 'https://images.unsplash.com/photo-1565183928294-14e41a5e2b6f?w=800'),
            ],
          },
          {
            id: 'security-lights',
            name: 'Security & Flood Lights',
            products: [
              createSampleProduct('outdoor-sec-001', 'Motion Security Light LED', 'MSL-LED', 49.99, 'https://images.unsplash.com/photo-1565183928294-14e41a5e2b6f?w=800'),
            ],
          },
        ],
      },
      {
        id: 'light-bulbs',
        name: 'Light Bulbs',
        productCategories: [
          {
            id: 'led-bulbs',
            name: 'LED Bulbs',
            products: [
              createSampleProduct('bulb-led-001', 'LED Bulb A19 60W Equivalent 4-Pack', 'LB-A19-60-4', 12.99, 'https://images.unsplash.com/photo-1565183928294-14e41a5e2b6f?w=800'),
            ],
          },
          {
            id: 'cfl-bulbs',
            name: 'CFL Bulbs',
            products: [
              createSampleProduct('bulb-cfl-001', 'CFL Spiral Bulb 23W', 'CB-SP-23', 4.99, 'https://images.unsplash.com/photo-1565183928294-14e41a5e2b6f?w=800'),
            ],
          },
        ],
      },
      {
        id: 'lamp-shades',
        name: 'Lamp Shades',
        productCategories: [
          {
            id: 'drum-shades',
            name: 'Drum Lamp Shades',
            products: [
              createSampleProduct('shade-drum-001', 'Drum Shade 14" Beige', 'DS-14-BG', 29.99, 'https://images.unsplash.com/photo-1565183928294-14e41a5e2b6f?w=800'),
            ],
          },
        ],
      },
      {
        id: 'smart-lighting',
        name: 'Smart Lighting',
        productCategories: [
          {
            id: 'smart-bulbs',
            name: 'Smart Bulbs',
            products: [
              createSampleProduct('smart-bulb-001', 'Smart LED Bulb WiFi Color', 'SLB-WIFI-C', 24.99, 'https://images.unsplash.com/photo-1565183928294-14e41a5e2b6f?w=800'),
            ],
          },
          {
            id: 'smart-switches',
            name: 'Smart Light Switches',
            products: [
              createSampleProduct('smart-switch-001', 'Smart Dimmer Switch WiFi', 'SDS-WIFI', 49.99, 'https://images.unsplash.com/photo-1565183928294-14e41a5e2b6f?w=800'),
            ],
          },
        ],
      },
    ],
  },
];
