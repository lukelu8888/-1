export interface ColorOption {
  name: string;
  unitPrice: number;
}

export interface ProductDetail {
  name: string;
  sku: string; // Product SKU code
  image: string;
  material: string;
  color: string; // Default color (for backward compatibility)
  colorOptions?: ColorOption[]; // Multiple color options with individual prices
  size?: string; // Product size
  specification: string;
  unitPrice: number; // Default unit price (for backward compatibility)
  pcsPerCarton: number;
  cartonGrossWeight: number;
  cartonNetWeight: number;
  cartonSize: string;
  cbmPerCarton: number;
  videoUrl?: string; // Optional YouTube video URL
}

// Remove standardColorOptions - each product should define its own color options

export const productDetailsData: { [key: string]: ProductDetail } = {
  // Appliance Parts & Accessories
  'Refrigerator Parts': {
    name: 'Refrigerator Parts',
    sku: 'RP-001',
    image: 'https://images.unsplash.com/photo-1653548147256-f1ba6da5f446?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhcHBsaWFuY2UlMjBwYXJ0cyUyMGFjY2Vzc29yaWVzfGVufDF8fHx8MTc2MTIwMjE2N3ww&ixlib=rb-4.1.0&q=80&w=1080',
    material: 'Stainless Steel / Plastic',
    color: 'Silver/White',
    specification: 'Universal Fit',
    size: 'Standard',
    unitPrice: 5.0,
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // Rick Astley - Never Gonna Give You Up (Music Video)
    // No color options - this product doesn't support color selection
    pcsPerCarton: 8,
    cartonGrossWeight: 7.2,
    cartonNetWeight: 6.5,
    cartonSize: '50 x 30 x 28 cm',
    cbmPerCarton: 0.042
  },
  'Washer Parts': {
    name: 'Washer Parts',
    sku: 'WP-001',
    image: 'https://images.unsplash.com/photo-1754732693535-7ffb5e1a51d6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3YXNoaW5nJTIwbWFjaGluZSUyMGFwcGxpYW5jZXxlbnwxfHx8fDE3NjExODI1Njd8MA&ixlib=rb-4.1.0&q=80&w=1080',
    material: 'Rubber / Metal',
    color: 'Black/Gray',
    specification: 'Standard Size',
    size: 'Medium',
    unitPrice: 3.5,
    // No color options
    pcsPerCarton: 10,
    cartonGrossWeight: 5.8,
    cartonNetWeight: 5.2,
    cartonSize: '45 x 35 x 25 cm',
    cbmPerCarton: 0.039
  },
  'Dryer Parts': {
    name: 'Dryer Parts',
    sku: 'DP-001',
    image: 'https://images.unsplash.com/photo-1754732693535-7ffb5e1a51d6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3YXNoaW5nJTIwbWFjaGluZSUyMGFwcGxpYW5jZXxlbnwxfHx8fDE3NjExODI1Njd8MA&ixlib=rb-4.1.0&q=80&w=1080',
    material: 'Heat Resistant Plastic',
    color: 'White/Gray',
    specification: 'OEM Compatible',
    size: 'Universal',
    unitPrice: 4.0,
    // No color options
    pcsPerCarton: 12,
    cartonGrossWeight: 6.0,
    cartonNetWeight: 5.4,
    cartonSize: '48 x 32 x 24 cm',
    cbmPerCarton: 0.037
  },
  'Dishwasher Parts': {
    name: 'Dishwasher Parts',
    sku: 'DWP-001',
    image: 'https://images.unsplash.com/photo-1758631130778-42d518bf13aa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBkaXNod2FzaGVyfGVufDF8fHx8MTc2MTIwMjE2OHww&ixlib=rb-4.1.0&q=80&w=1080',
    material: 'Plastic/Metal',
    color: 'Gray',
    specification: '4" x 2" x 1"',
    size: 'Small',
    unitPrice: 2.5,
    // No color options
    pcsPerCarton: 24,
    cartonGrossWeight: 4.8,
    cartonNetWeight: 4.2,
    cartonSize: '42 x 32 x 22 cm',
    cbmPerCarton: 0.030
  },
  'Range Parts': {
    name: 'Range Parts',
    sku: 'RP-002',
    image: 'https://images.unsplash.com/photo-1692089913251-445cb32eb8dc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxraXRjaGVuJTIwcmFuZ2UlMjBzdG92ZXxlbnwxfHx8fDE3NjEyMDIxNzB8MA&ixlib=rb-4.1.0&q=80&w=1080',
    material: 'Steel / Ceramic',
    color: 'Black/Silver',
    specification: 'Standard Range Compatible',
    size: 'Standard',
    unitPrice: 6.0,
    // No color options
    pcsPerCarton: 6,
    cartonGrossWeight: 9.5,
    cartonNetWeight: 8.8,
    cartonSize: '55 x 40 x 30 cm',
    cbmPerCarton: 0.066
  },
  'Microwave Parts': {
    name: 'Microwave Parts',
    sku: 'MP-001',
    image: 'https://images.unsplash.com/photo-1759398430338-8057876edf61?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtaWNyb3dhdmUlMjBvdmVuJTIwY291bnRlcnRvcHxlbnwxfHx8fDE3NjEyMDIxNzB8MA&ixlib=rb-4.1.0&q=80&w=1080',
    material: 'Glass / Plastic',
    color: 'Clear/White',
    specification: 'Universal Microwave Parts',
    size: 'Universal',
    unitPrice: 4.5,
    // No color options
    pcsPerCarton: 15,
    cartonGrossWeight: 5.5,
    cartonNetWeight: 5.0,
    cartonSize: '40 x 35 x 25 cm',
    cbmPerCarton: 0.035
  },
  'Water Filter': {
    name: 'Water Filter',
    sku: 'WF-001',
    image: 'https://images.unsplash.com/photo-1653548147256-f1ba6da5f446?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhcHBsaWFuY2UlMjBwYXJ0cyUyMGFjY2Vzc29yaWVzfGVufDF8fHx8MTc2MTIwMjE2N3ww&ixlib=rb-4.1.0&q=80&w=1080',
    material: 'Activated Carbon',
    color: 'White',
    specification: '10" x 2.5"',
    size: '10 inch',
    unitPrice: 7.0,
    // No color options
    pcsPerCarton: 12,
    cartonGrossWeight: 6.5,
    cartonNetWeight: 6.0,
    cartonSize: '52 x 28 x 26 cm',
    cbmPerCarton: 0.038
  },
  'Appliance Cleaner': {
    name: 'Appliance Cleaner',
    sku: 'AC-001',
    image: 'https://images.unsplash.com/photo-1653548147256-f1ba6da5f446?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhcHBsaWFuY2UlMjBwYXJ0cyUyMGFjY2Vzc29yaWVzfGVufDF8fHx8MTc2MTIwMjE2N3ww&ixlib=rb-4.1.0&q=80&w=1080',
    material: 'Liquid Solution',
    color: 'Clear',
    specification: '500ml bottle',
    size: '500ml',
    unitPrice: 10.0,
    // No color options
    pcsPerCarton: 20,
    cartonGrossWeight: 12.5,
    cartonNetWeight: 11.0,
    cartonSize: '45 x 30 x 25 cm',
    cbmPerCarton: 0.034
  },
  // Cooktops with specific color options
  'Gas Cooktops': {
    name: 'Gas Cooktops',
    sku: 'GC-001',
    image: 'https://images.unsplash.com/photo-1739598752069-6806ce5d762a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnYXMlMjBjb29rdG9wJTIwc3RvdmV8ZW58MXx8fHwxNzYxMjAyMTY4fDA&ixlib=rb-4.1.0&q=80&w=1080',
    material: 'Stainless Steel',
    color: 'Silver',
    specification: '30" 5-Burner',
    size: '30 inch',
    unitPrice: 150.0,
    colorOptions: [
      { name: 'Chrome', unitPrice: 150.0 },
      { name: 'Brushed Nickel', unitPrice: 155.0 },
      { name: 'Black', unitPrice: 155.0 },
      { name: 'Golden', unitPrice: 165.0 }
    ],
    pcsPerCarton: 1,
    cartonGrossWeight: 18.5,
    cartonNetWeight: 16.0,
    cartonSize: '85 x 60 x 20 cm',
    cbmPerCarton: 0.102
  },
  'Electric Cooktops': {
    name: 'Electric Cooktops',
    sku: 'EC-001',
    image: 'https://images.unsplash.com/photo-1739598752069-6806ce5d762a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnYXMlMjBjb29rdG9wJTIwc3RvdmV8ZW58MXx8fHwxNzYxMjAyMTY4fDA&ixlib=rb-4.1.0&q=80&w=1080',
    material: 'Ceramic Glass',
    color: 'Black',
    specification: '30" 4-Element',
    size: '30 inch',
    unitPrice: 140.0,
    colorOptions: [
      { name: 'Black', unitPrice: 140.0 },
      { name: 'White', unitPrice: 145.0 }
    ],
    pcsPerCarton: 1,
    cartonGrossWeight: 16.0,
    cartonNetWeight: 14.5,
    cartonSize: '82 x 58 x 18 cm',
    cbmPerCarton: 0.086
  },
  'Induction Cooktops': {
    name: 'Induction Cooktops',
    sku: 'IC-001',
    image: 'https://images.unsplash.com/photo-1739598752069-6806ce5d762a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnYXMlMjBjb29rdG9wJTIwc3RvdmV8ZW58MXx8fHwxNzYxMjAyMTY4fDA&ixlib=rb-4.1.0&q=80&w=1080',
    material: 'Ceramic Glass',
    color: 'Black',
    specification: '30" Touch Control',
    size: '30 inch',
    unitPrice: 130.0,
    colorOptions: [
      { name: 'Black', unitPrice: 130.0 },
      { name: 'White', unitPrice: 135.0 }
    ],
    pcsPerCarton: 1,
    cartonGrossWeight: 15.5,
    cartonNetWeight: 14.0,
    cartonSize: '80 x 56 x 16 cm',
    cbmPerCarton: 0.072
  },
  'Portable Cooktops': {
    name: 'Portable Cooktops',
    sku: 'PC-001',
    image: 'https://images.unsplash.com/photo-1739598752069-6806ce5d762a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnYXMlMjBjb29rdG9wJTIwc3RvdmV8ZW58MXx8fHwxNzYxMjAyMTY4fDA&ixlib=rb-4.1.0&q=80&w=1080',
    material: 'Stainless Steel',
    color: 'Silver/Black',
    specification: 'Single/Double Burner',
    size: 'Portable',
    unitPrice: 80.0,
    colorOptions: [
      { name: 'Chrome', unitPrice: 80.0 },
      { name: 'Black', unitPrice: 82.0 }
    ],
    pcsPerCarton: 4,
    cartonGrossWeight: 12.0,
    cartonNetWeight: 10.5,
    cartonSize: '65 x 45 x 30 cm',
    cbmPerCarton: 0.088
  },
  // Dishwashers with specific color options
  'Built-In Dishwashers': {
    name: 'Built-In Dishwashers',
    sku: 'BD-001',
    image: 'https://images.unsplash.com/photo-1758631130778-42d518bf13aa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBkaXNod2FzaGVyfGVufDF8fHx8MTc2MTIwMjE2OHww&ixlib=rb-4.1.0&q=80&w=1080',
    material: 'Stainless Steel',
    color: 'Silver',
    specification: '24" Built-In',
    size: '24 inch',
    unitPrice: 500.0,
    colorOptions: [
      { name: 'Chrome', unitPrice: 500.0 },
      { name: 'Brushed Nickel', unitPrice: 510.0 },
      { name: 'White', unitPrice: 495.0 },
      { name: 'Black', unitPrice: 505.0 }
    ],
    pcsPerCarton: 1,
    cartonGrossWeight: 48.0,
    cartonNetWeight: 45.0,
    cartonSize: '90 x 70 x 65 cm',
    cbmPerCarton: 0.41
  },
  'Portable Dishwashers': {
    name: 'Portable Dishwashers',
    sku: 'PD-001',
    image: 'https://images.unsplash.com/photo-1758631130778-42d518bf13aa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBkaXNod2FzaGVyfGVufDF8fHx8MTc2MTIwMjE2OHww&ixlib=rb-4.1.0&q=80&w=1080',
    material: 'Plastic/Steel',
    color: 'White',
    specification: '18" Countertop',
    size: '18 inch',
    unitPrice: 300.0,
    colorOptions: [
      { name: 'White', unitPrice: 300.0 },
      { name: 'Black', unitPrice: 310.0 }
    ],
    pcsPerCarton: 1,
    cartonGrossWeight: 25.0,
    cartonNetWeight: 23.0,
    cartonSize: '60 x 55 x 50 cm',
    cbmPerCarton: 0.165
  },
  'Drawer Dishwashers': {
    name: 'Drawer Dishwashers',
    sku: 'DD-001',
    image: 'https://images.unsplash.com/photo-1758631130778-42d518bf13aa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBkaXNod2FzaGVyfGVufDF8fHx8MTc2MTIwMjE2OHww&ixlib=rb-4.1.0&q=80&w=1080',
    material: 'Stainless Steel',
    color: 'Silver/Black',
    specification: 'Double Drawer',
    size: 'Double',
    unitPrice: 450.0,
    colorOptions: [
      { name: 'Chrome', unitPrice: 450.0 },
      { name: 'Black', unitPrice: 460.0 }
    ],
    pcsPerCarton: 1,
    cartonGrossWeight: 52.0,
    cartonNetWeight: 48.5,
    cartonSize: '95 x 75 x 60 cm',
    cbmPerCarton: 0.43
  },
  'Compact Dishwashers': {
    name: 'Compact Dishwashers',
    sku: 'CD-001',
    image: 'https://images.unsplash.com/photo-1758631130778-42d518bf13aa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBkaXNod2FzaGVyfGVufDF8fHx8MTc2MTIwMjE2OHww&ixlib=rb-4.1.0&q=80&w=1080',
    material: 'Stainless Steel',
    color: 'Silver',
    specification: '18" Slim Fit',
    size: '18 inch',
    unitPrice: 350.0,
    colorOptions: [
      { name: 'Chrome', unitPrice: 350.0 },
      { name: 'White', unitPrice: 345.0 },
      { name: 'Black', unitPrice: 355.0 }
    ],
    pcsPerCarton: 1,
    cartonGrossWeight: 35.0,
    cartonNetWeight: 32.5,
    cartonSize: '75 x 60 x 58 cm',
    cbmPerCarton: 0.261
  },
  // Freezers & Ice Makers - no color options needed
  'Chest Freezers': {
    name: 'Chest Freezers',
    sku: 'CF-001',
    image: 'https://images.unsplash.com/photo-1730000855881-2e0f5705539a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmcmVlemVyJTIwaWNlJTIwbWFrZXJ8ZW58MXx8fHwxNzYxMjAyMTY5fDA&ixlib=rb-4.1.0&q=80&w=1080',
    material: 'Steel',
    color: 'White',
    specification: '15 Cu Ft',
    size: '15 cubic feet',
    unitPrice: 400.0,
    // No color options
    pcsPerCarton: 1,
    cartonGrossWeight: 55.0,
    cartonNetWeight: 52.0,
    cartonSize: '145 x 75 x 90 cm',
    cbmPerCarton: 0.98
  },
  'Ice Makers': {
    name: 'Ice Makers',
    sku: 'IM-001',
    image: 'https://images.unsplash.com/photo-1730000855881-2e0f5705539a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmcmVlemVyJTIwaWNlJTIwbWFrZXJ8ZW58MXx8fHwxNzYxMjAyMTY5fDA&ixlib=rb-4.1.0&q=80&w=1080',
    material: 'Stainless Steel',
    color: 'Silver',
    specification: 'Countertop',
    size: 'Countertop',
    unitPrice: 100.0,
    colorOptions: [
      { name: 'Chrome', unitPrice: 100.0 },
      { name: 'Black', unitPrice: 105.0 }
    ],
    pcsPerCarton: 2,
    cartonGrossWeight: 22.0,
    cartonNetWeight: 20.0,
    cartonSize: '70 x 50 x 45 cm',
    cbmPerCarton: 0.158
  },
  'Upright Freezers': {
    name: 'Upright Freezers',
    sku: 'UF-001',
    image: 'https://images.unsplash.com/photo-1730000855881-2e0f5705539a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmcmVlemVyJTIwaWNlJTIwbWFrZXJ8ZW58MXx8fHwxNzYxMjAyMTY5fDA&ixlib=rb-4.1.0&q=80&w=1080',
    material: 'Steel',
    color: 'White/Silver',
    specification: '20 Cu Ft',
    size: '20 cubic feet',
    unitPrice: 550.0,
    // No color options
    pcsPerCarton: 1,
    cartonGrossWeight: 75.0,
    cartonNetWeight: 70.0,
    cartonSize: '180 x 80 x 75 cm',
    cbmPerCarton: 1.08
  }
};