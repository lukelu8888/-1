import { ProductDetail } from './productDetailsData';

export interface AccessoryProduct {
  id: number;
  name: string;
  image: string;
  price: number;
  rating: number;
  reviews: number;
  bulkPrice: { quantity: number; price: number } | null;
  fullDetails: ProductDetail;
}

export interface AccessoryCategory {
  id: number;
  title: string;
  products: AccessoryProduct[];
}

export interface AccessoryRecommendation {
  categories: AccessoryCategory[];
  description: {
    title: string;
    text: string;
    disclaimer: string;
  };
}

// Plumbing & Bath Accessories (for bathroom fixtures, faucets, toilets, etc.)
const plumbingAccessories: AccessoryRecommendation = {
  categories: [
    {
      id: 1,
      title: 'Toilet Shut-off Valve',
      products: [
        {
          id: 1,
          name: 'BrassCraft 1/2 in. FIP Inlet x 3/8 in. OD Comp...',
          image: 'https://images.unsplash.com/photo-1634756901182-c133d2871b66?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwbHVtYmluZyUyMHZhbHZlJTIwYnJhc3N8ZW58MXx8fHwxNzYxMjgyMDEzfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
          price: 9.98,
          rating: 4,
          reviews: 132,
          bulkPrice: null,
          fullDetails: {
            name: 'BrassCraft 1/2 in. FIP Inlet x 3/8 in. OD Compression Outlet Multi-Turn Straight Valve',
            image: 'https://images.unsplash.com/photo-1634756901182-c133d2871b66?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwbHVtYmluZyUyMHZhbHZlJTIwYnJhc3N8ZW58MXx8fHwxNzYxMjgyMDEzfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
            material: 'Brass',
            color: 'Brass Finish',
            specification: '1/2 in. FIP x 3/8 in. OD',
            size: '1/2 inch',
            unitPrice: 9.98,
            pcsPerCarton: 12,
            cartonGrossWeight: 5.5,
            cartonNetWeight: 5.0,
            cartonSize: '30x20x15 cm',
            cbmPerCarton: 0.009,
          }
        },
        {
          id: 2,
          name: 'BrassCraft 1/2 in. FIP Inlet x 1/4 in. Comp...',
          image: 'https://images.unsplash.com/photo-1634756901182-c133d2871b66?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwbHVtYmluZyUyMHZhbHZlJTIwYnJhc3N8ZW58MXx8fHwxNzYxMjgyMDEzfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
          price: 10.79,
          rating: 4,
          reviews: 47,
          bulkPrice: null,
          fullDetails: {
            name: 'BrassCraft 1/2 in. FIP Inlet x 1/4 in. Compression Outlet Multi-Turn Straight Valve',
            image: 'https://images.unsplash.com/photo-1634756901182-c133d2871b66?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwbHVtYmluZyUyMHZhbHZlJTIwYnJhc3N8ZW58MXx8fHwxNzYxMjgyMDEzfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
            material: 'Brass',
            color: 'Brass Finish',
            specification: '1/2 in. FIP x 1/4 in.',
            size: '1/2 inch',
            unitPrice: 10.79,
            pcsPerCarton: 12,
            cartonGrossWeight: 5.5,
            cartonNetWeight: 5.0,
            cartonSize: '30x20x15 cm',
            cbmPerCarton: 0.009,
          }
        },
      ]
    },
    {
      id: 2,
      title: 'Adjustable Wrench',
      products: [
        {
          id: 5,
          name: 'Husky 10 in. Adjustable Wrench',
          image: 'https://images.unsplash.com/photo-1760377821906-6c507add48e3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3cmVuY2glMjB0b29sJTIwaGFyZHdhcmV8ZW58MXx8fHwxNzYxMjgyMDE0fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
          price: 17.97,
          rating: 4,
          reviews: 478,
          bulkPrice: null,
          fullDetails: {
            name: 'Husky 10 in. Adjustable Wrench',
            image: 'https://images.unsplash.com/photo-1760377821906-6c507add48e3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3cmVuY2glMjB0b29sJTIwaGFyZHdhcmV8ZW58MXx8fHwxNzYxMjgyMDE0fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
            material: 'Chrome Vanadium Steel',
            color: 'Silver/Black',
            specification: '10 inch',
            size: '10 inch',
            unitPrice: 17.97,
            pcsPerCarton: 10,
            cartonGrossWeight: 8.0,
            cartonNetWeight: 7.5,
            cartonSize: '35x25x18 cm',
            cbmPerCarton: 0.0158,
          }
        },
        {
          id: 6,
          name: 'Husky 8 in. Adjustable Wrench',
          image: 'https://images.unsplash.com/photo-1760377821906-6c507add48e3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3cmVuY2glMjB0b29sJTIwaGFyZHdhcmV8ZW58MXx8fHwxNzYxMjgyMDE0fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
          price: 14.97,
          rating: 4,
          reviews: 456,
          bulkPrice: null,
          fullDetails: {
            name: 'Husky 8 in. Adjustable Wrench',
            image: 'https://images.unsplash.com/photo-1760377821906-6c507add48e3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3cmVuY2glMjB0b29sJTIwaGFyZHdhcmV8ZW58MXx8fHwxNzYxMjgyMDE0fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
            material: 'Chrome Vanadium Steel',
            color: 'Silver/Black',
            specification: '8 inch',
            size: '8 inch',
            unitPrice: 14.97,
            pcsPerCarton: 12,
            cartonGrossWeight: 7.2,
            cartonNetWeight: 6.8,
            cartonSize: '32x22x16 cm',
            cbmPerCarton: 0.0113,
          }
        },
      ]
    },
    {
      id: 3,
      title: 'Bathroom Caulk & Sealant',
      products: [
        {
          id: 9,
          name: 'DAP Kwik Seal Ultra 10.1 oz. White Premium...',
          image: 'https://images.unsplash.com/photo-1674955988657-19dfb886d5a6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXVsayUyMHNlYWxhbnQlMjB0dWJlfGVufDF8fHx8MTc2MTI0NTg4MHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
          price: 8.78,
          rating: 4,
          reviews: 9437,
          bulkPrice: { quantity: 12, price: 7.90 },
          fullDetails: {
            name: 'DAP Kwik Seal Ultra 10.1 oz. White Premium Kitchen & Bath Adhesive Caulk',
            image: 'https://images.unsplash.com/photo-1674955988657-19dfb886d5a6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXVsayUyMHNlYWxhbnQlMjB0dWJlfGVufDF8fHx8MTc2MTI0NTg4MHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
            material: 'Acrylic Latex',
            color: 'White',
            specification: '10.1 oz',
            size: '10.1 oz',
            unitPrice: 8.78,
            pcsPerCarton: 12,
            cartonGrossWeight: 4.5,
            cartonNetWeight: 4.0,
            cartonSize: '28x18x12 cm',
            cbmPerCarton: 0.006,
          }
        },
        {
          id: 10,
          name: 'DAP Kwik Seal Ultra 10.1 oz. Clear Premium...',
          image: 'https://images.unsplash.com/photo-1674955988657-19dfb886d5a6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXVsayUyMHNlYWxhbnQlMjB0dWJlfGVufDF8fHx8MTc2MTI0NTg4MHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
          price: 14.25,
          rating: 4,
          reviews: 404,
          bulkPrice: null,
          fullDetails: {
            name: 'DAP Kwik Seal Ultra 10.1 oz. Clear Premium Kitchen & Bath Adhesive Caulk',
            image: 'https://images.unsplash.com/photo-1674955988657-19dfb886d5a6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXVsayUyMHNlYWxhbnQlMjB0dWJlfGVufDF8fHx8MTc2MTI0NTg4MHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
            material: 'Acrylic Latex',
            color: 'Clear',
            specification: '10.1 oz',
            size: '10.1 oz',
            unitPrice: 14.25,
            pcsPerCarton: 12,
            cartonGrossWeight: 4.5,
            cartonNetWeight: 4.0,
            cartonSize: '28x18x12 cm',
            cbmPerCarton: 0.006,
          }
        },
      ]
    },
    {
      id: 4,
      title: 'Plumbing Tools',
      products: [
        {
          id: 13,
          name: 'Husky 10 oz. Heavy Duty High Lever Caulking Gun',
          image: 'https://images.unsplash.com/photo-1705499633903-7651d7cb1a5c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXVsa2luZyUyMGd1biUyMHRvb2x8ZW58MXx8fHwxNzYxMjgyMDE0fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
          price: 19.98,
          rating: 4,
          reviews: 1876,
          bulkPrice: null,
          fullDetails: {
            name: 'Husky 10 oz. Heavy Duty High Lever Caulking Gun',
            image: 'https://images.unsplash.com/photo-1705499633903-7651d7cb1a5c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXVsa2luZyUyMGd1biUyMHRvb2x8ZW58MXx8fHwxNzYxMjgyMDE0fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
            material: 'Steel',
            color: 'Red/Black',
            specification: '10 oz',
            size: '10 oz capacity',
            unitPrice: 19.98,
            pcsPerCarton: 10,
            cartonGrossWeight: 6.5,
            cartonNetWeight: 6.0,
            cartonSize: '35x25x15 cm',
            cbmPerCarton: 0.0131,
          }
        },
        {
          id: 14,
          name: 'Pipe Wrench Set - Professional Grade',
          image: 'https://images.unsplash.com/photo-1760377821906-6c507add48e3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3cmVuY2glMjB0b29sJTIwaGFyZHdhcmV8ZW58MXx8fHwxNzYxMjgyMDE0fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
          price: 24.98,
          rating: 5,
          reviews: 2456,
          bulkPrice: null,
          fullDetails: {
            name: 'Professional Pipe Wrench Set',
            image: 'https://images.unsplash.com/photo-1760377821906-6c507add48e3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3cmVuY2glMjB0b29sJTIwaGFyZHdhcmV8ZW58MXx8fHwxNzYxMjgyMDE0fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
            material: 'Steel',
            color: 'Silver/Black',
            specification: '3-piece set',
            size: 'Standard',
            unitPrice: 24.98,
            pcsPerCarton: 8,
            cartonGrossWeight: 12.0,
            cartonNetWeight: 11.0,
            cartonSize: '42x28x18 cm',
            cbmPerCarton: 0.0213,
          }
        },
      ]
    }
  ],
  description: {
    title: 'You Will Also Need These',
    text: 'For proper plumbing installation, you\'ll need shut-off valves for leak-free connections, wrenches for secure fitting, and sealant for waterproofing.',
    disclaimer: 'AI-generated using product information on our website.'
  }
};

// Appliance Accessories (for refrigerators, washers, dryers, etc.)
const applianceAccessories: AccessoryRecommendation = {
  categories: [
    {
      id: 1,
      title: 'Power Cords & Adapters',
      products: [
        {
          id: 101,
          name: 'Heavy Duty 3-Prong Power Cord 6ft',
          image: 'https://images.unsplash.com/photo-1625948515291-69613efd103f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwb3dlciUyMGNvcmQlMjBjYWJsZXxlbnwxfHx8fDE3NjEyODIwMTR8MA&ixlib=rb-4.1.0&q=80&w=1080',
          price: 12.99,
          rating: 4,
          reviews: 823,
          bulkPrice: null,
          fullDetails: {
            name: 'Heavy Duty 3-Prong Appliance Power Cord 6ft',
            image: 'https://images.unsplash.com/photo-1625948515291-69613efd103f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwb3dlciUyMGNvcmQlMjBjYWJsZXxlbnwxfHx8fDE3NjEyODIwMTR8MA&ixlib=rb-4.1.0&q=80&w=1080',
            material: 'Heavy Gauge Copper Wire',
            color: 'Black',
            specification: '6ft, 15A, 125V',
            size: '6 feet',
            unitPrice: 12.99,
            pcsPerCarton: 20,
            cartonGrossWeight: 8.0,
            cartonNetWeight: 7.5,
            cartonSize: '40x30x20 cm',
            cbmPerCarton: 0.024,
          }
        },
        {
          id: 102,
          name: 'Heavy Duty 3-Prong Power Cord 10ft',
          image: 'https://images.unsplash.com/photo-1625948515291-69613efd103f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwb3dlciUyMGNvcmQlMjBjYWJsZXxlbnwxfHx8fDE3NjEyODIwMTR8MA&ixlib=rb-4.1.0&q=80&w=1080',
          price: 16.99,
          rating: 4,
          reviews: 654,
          bulkPrice: null,
          fullDetails: {
            name: 'Heavy Duty 3-Prong Appliance Power Cord 10ft',
            image: 'https://images.unsplash.com/photo-1625948515291-69613efd103f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwb3dlciUyMGNvcmQlMjBjYWJsZXxlbnwxfHx8fDE3NjEyODIwMTR8MA&ixlib=rb-4.1.0&q=80&w=1080',
            material: 'Heavy Gauge Copper Wire',
            color: 'Black',
            specification: '10ft, 15A, 125V',
            size: '10 feet',
            unitPrice: 16.99,
            pcsPerCarton: 15,
            cartonGrossWeight: 9.0,
            cartonNetWeight: 8.5,
            cartonSize: '45x32x22 cm',
            cbmPerCarton: 0.0317,
          }
        },
      ]
    },
    {
      id: 2,
      title: 'Water Hoses & Connectors',
      products: [
        {
          id: 103,
          name: 'Stainless Steel Washing Machine Hose 6ft',
          image: 'https://images.unsplash.com/photo-1634756901182-c133d2871b66?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwbHVtYmluZyUyMHZhbHZlJTIwYnJhc3N8ZW58MXx8fHwxNzYxMjgyMDEzfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
          price: 18.99,
          rating: 5,
          reviews: 1245,
          bulkPrice: { quantity: 12, price: 16.99 },
          fullDetails: {
            name: 'Stainless Steel Braided Washing Machine Hose 6ft',
            image: 'https://images.unsplash.com/photo-1634756901182-c133d2871b66?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwbHVtYmluZyUyMHZhbHZlJTIwYnJhc3N8ZW58MXx8fHwxNzYxMjgyMDEzfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
            material: 'Stainless Steel Braided',
            color: 'Silver',
            specification: '6ft, 3/4 inch',
            size: '6 feet',
            unitPrice: 18.99,
            pcsPerCarton: 12,
            cartonGrossWeight: 6.5,
            cartonNetWeight: 6.0,
            cartonSize: '35x25x18 cm',
            cbmPerCarton: 0.0158,
          }
        },
        {
          id: 104,
          name: 'Refrigerator Water Line Kit',
          image: 'https://images.unsplash.com/photo-1634756901182-c133d2871b66?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwbHVtYmluZyUyMHZhbHZlJTIwYnJhc3N8ZW58MXx8fHwxNzYxMjgyMDEzfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
          price: 22.99,
          rating: 4,
          reviews: 876,
          bulkPrice: null,
          fullDetails: {
            name: 'Universal Refrigerator Water Line Installation Kit',
            image: 'https://images.unsplash.com/photo-1634756901182-c133d2871b66?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwbHVtYmluZyUyMHZhbHZlJTIwYnJhc3N8ZW58MXx8fHwxNzYxMjgyMDEzfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
            material: 'Plastic/Brass',
            color: 'White/Brass',
            specification: '25ft kit',
            size: '25 feet',
            unitPrice: 22.99,
            pcsPerCarton: 10,
            cartonGrossWeight: 5.5,
            cartonNetWeight: 5.0,
            cartonSize: '32x22x15 cm',
            cbmPerCarton: 0.0106,
          }
        },
      ]
    },
    {
      id: 3,
      title: 'Mounting Hardware',
      products: [
        {
          id: 105,
          name: 'Anti-Vibration Pads for Washer & Dryer',
          image: 'https://images.unsplash.com/photo-1587589061867-92e5c6605ba5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxydWJiZXIlMjBwYWR8ZW58MXx8fHwxNzYxMjgyMDE0fDA&ixlib=rb-4.1.0&q=80&w=1080',
          price: 14.99,
          rating: 5,
          reviews: 2134,
          bulkPrice: { quantity: 12, price: 12.99 },
          fullDetails: {
            name: 'Anti-Vibration Rubber Pads for Washing Machine & Dryer (4-Pack)',
            image: 'https://images.unsplash.com/photo-1587589061867-92e5c6605ba5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxydWJiZXIlMjBwYWR8ZW58MXx8fHwxNzYxMjgyMDE0fDA&ixlib=rb-4.1.0&q=80&w=1080',
            material: 'Heavy Duty Rubber',
            color: 'Black',
            specification: '4-pack, 3 inch diameter',
            size: '3 inch',
            unitPrice: 14.99,
            pcsPerCarton: 12,
            cartonGrossWeight: 4.5,
            cartonNetWeight: 4.0,
            cartonSize: '30x20x15 cm',
            cbmPerCarton: 0.009,
          }
        },
        {
          id: 106,
          name: 'Appliance Dolly & Moving Straps',
          image: 'https://images.unsplash.com/photo-1760377821906-6c507add48e3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3cmVuY2glMjB0b29sJTIwaGFyZHdhcmV8ZW58MXx8fHwxNzYxMjgyMDE0fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
          price: 39.99,
          rating: 4,
          reviews: 543,
          bulkPrice: null,
          fullDetails: {
            name: 'Heavy Duty Appliance Moving Dolly with Straps',
            image: 'https://images.unsplash.com/photo-1760377821906-6c507add48e3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3cmVuY2glMjB0b29sJTIwaGFyZHdhcmV8ZW58MXx8fHwxNzYxMjgyMDE0fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
            material: 'Steel/Nylon',
            color: 'Blue/Black',
            specification: '800 lb capacity',
            size: 'Standard',
            unitPrice: 39.99,
            pcsPerCarton: 4,
            cartonGrossWeight: 18.0,
            cartonNetWeight: 17.0,
            cartonSize: '80x40x30 cm',
            cbmPerCarton: 0.096,
          }
        },
      ]
    },
    {
      id: 4,
      title: 'Filters & Maintenance',
      products: [
        {
          id: 107,
          name: 'Refrigerator Water Filter Replacement',
          image: 'https://images.unsplash.com/photo-1653548147256-f1ba6da5f446?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhcHBsaWFuY2UlMjBwYXJ0cyUyMGFjY2Vzc29yaWVzfGVufDF8fHx8MTc2MTIwMjE2N3ww&ixlib=rb-4.1.0&q=80&w=1080',
          price: 24.99,
          rating: 4,
          reviews: 3421,
          bulkPrice: { quantity: 12, price: 21.99 },
          fullDetails: {
            name: 'Universal Refrigerator Water Filter Replacement Cartridge',
            image: 'https://images.unsplash.com/photo-1653548147256-f1ba6da5f446?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhcHBsaWFuY2UlMjBwYXJ0cyUyMGFjY2Vzc29yaWVzfGVufDF8fHx8MTc2MTIwMjE2N3ww&ixlib=rb-4.1.0&q=80&w=1080',
            material: 'Activated Carbon',
            color: 'White',
            specification: '6-month lifespan',
            size: 'Standard',
            unitPrice: 24.99,
            pcsPerCarton: 12,
            cartonGrossWeight: 5.0,
            cartonNetWeight: 4.5,
            cartonSize: '35x25x20 cm',
            cbmPerCarton: 0.0175,
          }
        },
        {
          id: 108,
          name: 'Appliance Cleaner & Descaler Kit',
          image: 'https://images.unsplash.com/photo-1674955988657-19dfb886d5a6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXVsayUyMHNlYWxhbnQlMjB0dWJlfGVufDF8fHx8MTc2MTI0NTg4MHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
          price: 19.99,
          rating: 5,
          reviews: 1987,
          bulkPrice: null,
          fullDetails: {
            name: 'Professional Appliance Cleaner & Descaler Kit',
            image: 'https://images.unsplash.com/photo-1674955988657-19dfb886d5a6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXVsayUyMHNlYWxhbnQlMjB0dWJlfGVufDF8fHx8MTc2MTI0NTg4MHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
            material: 'Eco-Friendly Chemical',
            color: 'Clear',
            specification: '3-pack bundle',
            size: '16 oz each',
            unitPrice: 19.99,
            pcsPerCarton: 12,
            cartonGrossWeight: 7.5,
            cartonNetWeight: 7.0,
            cartonSize: '35x25x18 cm',
            cbmPerCarton: 0.0158,
          }
        },
      ]
    }
  ],
  description: {
    title: 'You Will Also Need These',
    text: 'For complete appliance installation, you\'ll need power cords for electrical connection, water hoses for plumbing, and mounting hardware for secure placement.',
    disclaimer: 'AI-generated using product information on our website.'
  }
};

// Lighting Accessories (for lights, bulbs, fixtures)
const lightingAccessories: AccessoryRecommendation = {
  categories: [
    {
      id: 1,
      title: 'LED Bulbs',
      products: [
        {
          id: 201,
          name: 'LED A19 Bulb 60W Equivalent Daylight',
          image: 'https://images.unsplash.com/photo-1567539301797-d4f8f5a60ed4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsZWQlMjBidWxifGVufDF8fHx8MTc2MTI4MjAxNHww&ixlib=rb-4.1.0&q=80&w=1080',
          price: 4.99,
          rating: 5,
          reviews: 5432,
          bulkPrice: { quantity: 24, price: 3.99 },
          fullDetails: {
            name: 'LED A19 Light Bulb 60W Equivalent 5000K Daylight',
            image: 'https://images.unsplash.com/photo-1567539301797-d4f8f5a60ed4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsZWQlMjBidWxifGVufDF8fHx8MTc2MTI4MjAxNHww&ixlib=rb-4.1.0&q=80&w=1080',
            material: 'LED / Plastic',
            color: 'Daylight White',
            specification: '9W, 800 lumens',
            size: 'A19',
            unitPrice: 4.99,
            pcsPerCarton: 24,
            cartonGrossWeight: 3.5,
            cartonNetWeight: 3.0,
            cartonSize: '30x20x15 cm',
            cbmPerCarton: 0.009,
          }
        },
        {
          id: 202,
          name: 'LED A19 Bulb 60W Equivalent Warm White',
          image: 'https://images.unsplash.com/photo-1567539301797-d4f8f5a60ed4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsZWQlMjBidWxifGVufDF8fHx8MTc2MTI4MjAxNHww&ixlib=rb-4.1.0&q=80&w=1080',
          price: 4.99,
          rating: 5,
          reviews: 4876,
          bulkPrice: { quantity: 24, price: 3.99 },
          fullDetails: {
            name: 'LED A19 Light Bulb 60W Equivalent 2700K Warm White',
            image: 'https://images.unsplash.com/photo-1567539301797-d4f8f5a60ed4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsZWQlMjBidWxifGVufDF8fHx8MTc2MTI4MjAxNHww&ixlib=rb-4.1.0&q=80&w=1080',
            material: 'LED / Plastic',
            color: 'Warm White',
            specification: '9W, 800 lumens',
            size: 'A19',
            unitPrice: 4.99,
            pcsPerCarton: 24,
            cartonGrossWeight: 3.5,
            cartonNetWeight: 3.0,
            cartonSize: '30x20x15 cm',
            cbmPerCarton: 0.009,
          }
        },
      ]
    },
    {
      id: 2,
      title: 'Dimmer Switches',
      products: [
        {
          id: 203,
          name: 'Smart Dimmer Switch with Remote',
          image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsaWdodCUyMHN3aXRjaHxlbnwxfHx8fDE3NjEyODIwMTR8MA&ixlib=rb-4.1.0&q=80&w=1080',
          price: 24.99,
          rating: 4,
          reviews: 1234,
          bulkPrice: null,
          fullDetails: {
            name: 'Smart LED Dimmer Switch with Wireless Remote Control',
            image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsaWdodCUyMHN3aXRjaHxlbnwxfHx8fDE3NjEyODIwMTR8MA&ixlib=rb-4.1.0&q=80&w=1080',
            material: 'Plastic / Electronics',
            color: 'White',
            specification: '150W LED, WiFi enabled',
            size: 'Standard',
            unitPrice: 24.99,
            pcsPerCarton: 12,
            cartonGrossWeight: 4.0,
            cartonNetWeight: 3.5,
            cartonSize: '28x18x12 cm',
            cbmPerCarton: 0.006,
          }
        },
        {
          id: 204,
          name: 'Rotary Dimmer Switch - Single Pole',
          image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsaWdodCUyMHN3aXRjaHxlbnwxfHx8fDE3NjEyODIwMTR8MA&ixlib=rb-4.1.0&q=80&w=1080',
          price: 12.99,
          rating: 4,
          reviews: 876,
          bulkPrice: null,
          fullDetails: {
            name: 'Traditional Rotary Dimmer Switch - Single Pole',
            image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsaWdodCUyMHN3aXRjaHxlbnwxfHx8fDE3NjEyODIwMTR8MA&ixlib=rb-4.1.0&q=80&w=1080',
            material: 'Plastic / Copper',
            color: 'Ivory',
            specification: '600W incandescent',
            size: 'Standard',
            unitPrice: 12.99,
            pcsPerCarton: 20,
            cartonGrossWeight: 5.5,
            cartonNetWeight: 5.0,
            cartonSize: '32x22x15 cm',
            cbmPerCarton: 0.0106,
          }
        },
      ]
    },
    {
      id: 3,
      title: 'Mounting Hardware',
      products: [
        {
          id: 205,
          name: 'Ceiling Fixture Mounting Bracket Kit',
          image: 'https://images.unsplash.com/photo-1760377821906-6c507add48e3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3cmVuY2glMjB0b29sJTIwaGFyZHdhcmV8ZW58MXx8fHwxNzYxMjgyMDE0fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
          price: 8.99,
          rating: 4,
          reviews: 2341,
          bulkPrice: { quantity: 12, price: 7.49 },
          fullDetails: {
            name: 'Universal Ceiling Light Fixture Mounting Bracket Kit',
            image: 'https://images.unsplash.com/photo-1760377821906-6c507add48e3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3cmVuY2glMjB0b29sJTIwaGFyZHdhcmV8ZW58MXx8fHwxNzYxMjgyMDE0fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
            material: 'Steel',
            color: 'Silver',
            specification: 'Universal fit',
            size: 'Standard',
            unitPrice: 8.99,
            pcsPerCarton: 24,
            cartonGrossWeight: 6.0,
            cartonNetWeight: 5.5,
            cartonSize: '35x25x15 cm',
            cbmPerCarton: 0.0131,
          }
        },
        {
          id: 206,
          name: 'Chandelier Chain & Canopy Kit',
          image: 'https://images.unsplash.com/photo-1760377821906-6c507add48e3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3cmVuY2glMjB0b29sJTIwaGFyZHdhcmV8ZW58MXx8fHwxNzYxMjgyMDE0fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
          price: 16.99,
          rating: 5,
          reviews: 654,
          bulkPrice: null,
          fullDetails: {
            name: 'Decorative Chandelier Hanging Chain & Canopy Kit',
            image: 'https://images.unsplash.com/photo-1760377821906-6c507add48e3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3cmVuY2glMjB0b29sJTIwaGFyZHdhcmV8ZW58MXx8fHwxNzYxMjgyMDE0fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
            material: 'Steel Chain',
            color: 'Antique Brass',
            specification: '6 feet chain',
            size: '6 feet',
            unitPrice: 16.99,
            pcsPerCarton: 12,
            cartonGrossWeight: 8.5,
            cartonNetWeight: 8.0,
            cartonSize: '40x28x18 cm',
            cbmPerCarton: 0.0201,
          }
        },
      ]
    },
    {
      id: 4,
      title: 'Wire Connectors',
      products: [
        {
          id: 207,
          name: 'Wire Nut Connector Assortment Kit',
          image: 'https://images.unsplash.com/photo-1625948515291-69613efd103f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwb3dlciUyMGNvcmQlMjBjYWJsZXxlbnwxfHx8fDE3NjEyODIwMTR8MA&ixlib=rb-4.1.0&q=80&w=1080',
          price: 9.99,
          rating: 4,
          reviews: 3456,
          bulkPrice: { quantity: 12, price: 7.99 },
          fullDetails: {
            name: 'Professional Wire Nut Connector Assortment (120-Pack)',
            image: 'https://images.unsplash.com/photo-1625948515291-69613efd103f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwb3dlciUyMGNvcmQlMjBjYWJsZXxlbnwxfHx8fDE3NjEyODIwMTR8MA&ixlib=rb-4.1.0&q=80&w=1080',
            material: 'Plastic / Copper Spring',
            color: 'Assorted Colors',
            specification: '120-piece assortment',
            size: 'Various sizes',
            unitPrice: 9.99,
            pcsPerCarton: 12,
            cartonGrossWeight: 3.5,
            cartonNetWeight: 3.0,
            cartonSize: '28x18x12 cm',
            cbmPerCarton: 0.006,
          }
        },
        {
          id: 208,
          name: 'Electrical Tape Multi-Pack',
          image: 'https://images.unsplash.com/photo-1625948515291-69613efd103f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwb3dlciUyMGNvcmQlMjBjYWJsZXxlbnwxfHx8fDE3NjEyODIwMTR8MA&ixlib=rb-4.1.0&q=80&w=1080',
          price: 12.99,
          rating: 5,
          reviews: 2134,
          bulkPrice: null,
          fullDetails: {
            name: 'Heavy Duty Electrical Tape Multi-Pack (10 Rolls)',
            image: 'https://images.unsplash.com/photo-1625948515291-69613efd103f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwb3dlciUyMGNvcmQlMjBjYWJsZXxlbnwxfHx8fDE3NjEyODIwMTR8MA&ixlib=rb-4.1.0&q=80&w=1080',
            material: 'PVC / Rubber Adhesive',
            color: 'Black',
            specification: '10 rolls, 3/4 in x 60 ft',
            size: '3/4 inch',
            unitPrice: 12.99,
            pcsPerCarton: 12,
            cartonGrossWeight: 4.5,
            cartonNetWeight: 4.0,
            cartonSize: '32x22x15 cm',
            cbmPerCarton: 0.0106,
          }
        },
      ]
    }
  ],
  description: {
    title: 'You Will Also Need These',
    text: 'For proper lighting installation, you\'ll need compatible bulbs, dimmer switches for brightness control, and mounting hardware for secure installation.',
    disclaimer: 'AI-generated using product information on our website.'
  }
};

// Default/Generic Accessories (fallback for products without specific category)
const genericAccessories: AccessoryRecommendation = {
  categories: [
    {
      id: 1,
      title: 'Installation Tools',
      products: [
        {
          id: 301,
          name: 'Professional Screwdriver Set 32-Piece',
          image: 'https://images.unsplash.com/photo-1760377821906-6c507add48e3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3cmVuY2glMjB0b29sJTIwaGFyZHdhcmV8ZW58MXx8fHwxNzYxMjgyMDE0fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
          price: 29.99,
          rating: 5,
          reviews: 3456,
          bulkPrice: null,
          fullDetails: {
            name: 'Professional Precision Screwdriver Set 32-Piece with Case',
            image: 'https://images.unsplash.com/photo-1760377821906-6c507add48e3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3cmVuY2glMjB0b29sJTIwaGFyZHdhcmV8ZW58MXx8fHwxNzYxMjgyMDE0fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
            material: 'Chrome Vanadium Steel',
            color: 'Red/Black',
            specification: '32-piece precision set',
            size: 'Various',
            unitPrice: 29.99,
            pcsPerCarton: 6,
            cartonGrossWeight: 9.0,
            cartonNetWeight: 8.5,
            cartonSize: '40x30x20 cm',
            cbmPerCarton: 0.024,
          }
        },
        {
          id: 302,
          name: 'Multi-Purpose Level & Measuring Tape',
          image: 'https://images.unsplash.com/photo-1760377821906-6c507add48e3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3cmVuY2glMjB0b29sJTIwaGFyZHdhcmV8ZW58MXx8fHwxNzYxMjgyMDE0fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
          price: 19.99,
          rating: 4,
          reviews: 2134,
          bulkPrice: null,
          fullDetails: {
            name: 'Professional Torpedo Level & 25ft Measuring Tape Combo',
            image: 'https://images.unsplash.com/photo-1760377821906-6c507add48e3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3cmVuY2glMjB0b29sJTIwaGFyZHdhcmV8ZW58MXx8fHwxNzYxMjgyMDE0fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
            material: 'Aluminum / Steel',
            color: 'Yellow/Black',
            specification: '9 inch level + 25ft tape',
            size: 'Standard',
            unitPrice: 19.99,
            pcsPerCarton: 12,
            cartonGrossWeight: 7.0,
            cartonNetWeight: 6.5,
            cartonSize: '35x25x18 cm',
            cbmPerCarton: 0.0158,
          }
        },
      ]
    },
    {
      id: 2,
      title: 'Safety Equipment',
      products: [
        {
          id: 303,
          name: 'Safety Goggles & Work Gloves Set',
          image: 'https://images.unsplash.com/photo-1587589061867-92e5c6605ba5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxydWJiZXIlMjBwYWR8ZW58MXx8fHwxNzYxMjgyMDE0fDA&ixlib=rb-4.1.0&q=80&w=1080',
          price: 14.99,
          rating: 4,
          reviews: 1876,
          bulkPrice: { quantity: 12, price: 12.99 },
          fullDetails: {
            name: 'Professional Safety Goggles & Heavy Duty Work Gloves Set',
            image: 'https://images.unsplash.com/photo-1587589061867-92e5c6605ba5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxydWJiZXIlMjBwYWR8ZW58MXx8fHwxNzYxMjgyMDE0fDA&ixlib=rb-4.1.0&q=80&w=1080',
            material: 'Polycarbonate / Leather',
            color: 'Clear/Black',
            specification: 'ANSI Z87.1 certified',
            size: 'One Size',
            unitPrice: 14.99,
            pcsPerCarton: 12,
            cartonGrossWeight: 4.5,
            cartonNetWeight: 4.0,
            cartonSize: '30x20x15 cm',
            cbmPerCarton: 0.009,
          }
        },
        {
          id: 304,
          name: 'Dust Mask & Ear Protection Set',
          image: 'https://images.unsplash.com/photo-1587589061867-92e5c6605ba5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxydWJiZXIlMjBwYWR8ZW58MXx8fHwxNzYxMjgyMDE0fDA&ixlib=rb-4.1.0&q=80&w=1080',
          price: 16.99,
          rating: 4,
          reviews: 1234,
          bulkPrice: null,
          fullDetails: {
            name: 'N95 Dust Mask & Noise Reduction Ear Muffs Protection Set',
            image: 'https://images.unsplash.com/photo-1587589061867-92e5c6605ba5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxydWJiZXIlMjBwYWR8ZW58MXx8fHwxNzYxMjgyMDE0fDA&ixlib=rb-4.1.0&q=80&w=1080',
            material: 'Polypropylene / Foam',
            color: 'White/Black',
            specification: 'N95 rated, 30dB NRR',
            size: 'Adjustable',
            unitPrice: 16.99,
            pcsPerCarton: 12,
            cartonGrossWeight: 5.0,
            cartonNetWeight: 4.5,
            cartonSize: '32x22x15 cm',
            cbmPerCarton: 0.0106,
          }
        },
      ]
    },
    {
      id: 3,
      title: 'Adhesives & Fasteners',
      products: [
        {
          id: 305,
          name: 'Heavy Duty Construction Adhesive',
          image: 'https://images.unsplash.com/photo-1674955988657-19dfb886d5a6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXVsayUyMHNlYWxhbnQlMjB0dWJlfGVufDF8fHx8MTc2MTI0NTg4MHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
          price: 11.99,
          rating: 5,
          reviews: 2876,
          bulkPrice: { quantity: 12, price: 9.99 },
          fullDetails: {
            name: 'Professional Heavy Duty Construction Adhesive 28 oz',
            image: 'https://images.unsplash.com/photo-1674955988657-19dfb886d5a6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXVsayUyMHNlYWxhbnQlMjB0dWJlfGVufDF8fHx8MTc2MTI0NTg4MHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
            material: 'Polyurethane',
            color: 'Tan',
            specification: '28 oz cartridge',
            size: '28 oz',
            unitPrice: 11.99,
            pcsPerCarton: 12,
            cartonGrossWeight: 12.0,
            cartonNetWeight: 11.5,
            cartonSize: '35x25x20 cm',
            cbmPerCarton: 0.0175,
          }
        },
        {
          id: 306,
          name: 'Anchor Bolt & Screw Assortment Kit',
          image: 'https://images.unsplash.com/photo-1760377821906-6c507add48e3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3cmVuY2glMjB0b29sJTIwaGFyZHdhcmV8ZW58MXx8fHwxNzYxMjgyMDE0fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
          price: 18.99,
          rating: 4,
          reviews: 1654,
          bulkPrice: null,
          fullDetails: {
            name: 'Professional Anchor Bolt & Screw Assortment Kit (200-Piece)',
            image: 'https://images.unsplash.com/photo-1760377821906-6c507add48e3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3cmVuY2glMjB0b29sJTIwaGFyZHdhcmV8ZW58MXx8fHwxNzYxMjgyMDE0fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
            material: 'Zinc Plated Steel',
            color: 'Silver',
            specification: '200-piece assorted',
            size: 'Various',
            unitPrice: 18.99,
            pcsPerCarton: 12,
            cartonGrossWeight: 8.5,
            cartonNetWeight: 8.0,
            cartonSize: '35x25x18 cm',
            cbmPerCarton: 0.0158,
          }
        },
      ]
    },
    {
      id: 4,
      title: 'Cleaning Supplies',
      products: [
        {
          id: 307,
          name: 'All-Purpose Cleaning Solution Set',
          image: 'https://images.unsplash.com/photo-1674955988657-19dfb886d5a6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXVsayUyMHNlYWxhbnQlMjB0dWJlfGVufDF8fHx8MTc2MTI0NTg4MHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
          price: 22.99,
          rating: 4,
          reviews: 2341,
          bulkPrice: null,
          fullDetails: {
            name: 'Professional All-Purpose Cleaning Solution 3-Pack Bundle',
            image: 'https://images.unsplash.com/photo-1674955988657-19dfb886d5a6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXVsayUyMHNlYWxhbnQlMjB0dWJlfGVufDF8fHx8MTc2MTI0NTg4MHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
            material: 'Eco-Friendly Chemical',
            color: 'Clear',
            specification: '3x32 oz spray bottles',
            size: '32 oz each',
            unitPrice: 22.99,
            pcsPerCarton: 8,
            cartonGrossWeight: 9.5,
            cartonNetWeight: 9.0,
            cartonSize: '40x28x20 cm',
            cbmPerCarton: 0.0224,
          }
        },
        {
          id: 308,
          name: 'Microfiber Cleaning Cloth Set',
          image: 'https://images.unsplash.com/photo-1587589061867-92e5c6605ba5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxydWJiZXIlMjBwYWR8ZW58MXx8fHwxNzYxMjgyMDE0fDA&ixlib=rb-4.1.0&q=80&w=1080',
          price: 15.99,
          rating: 5,
          reviews: 3876,
          bulkPrice: { quantity: 12, price: 13.99 },
          fullDetails: {
            name: 'Premium Microfiber Cleaning Cloth Set (12-Pack)',
            image: 'https://images.unsplash.com/photo-1587589061867-92e5c6605ba5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxydWJiZXIlMjBwYWR8ZW58MXx8fHwxNzYxMjgyMDE0fDA&ixlib=rb-4.1.0&q=80&w=1080',
            material: 'Microfiber',
            color: 'Assorted Colors',
            specification: '12x12 inch, 12-pack',
            size: '12x12 inch',
            unitPrice: 15.99,
            pcsPerCarton: 12,
            cartonGrossWeight: 3.5,
            cartonNetWeight: 3.0,
            cartonSize: '30x20x15 cm',
            cbmPerCarton: 0.009,
          }
        },
      ]
    }
  ],
  description: {
    title: 'You Will Also Need These',
    text: 'For successful installation and maintenance, you\'ll need essential tools, safety equipment, fasteners, and cleaning supplies.',
    disclaimer: 'AI-generated using product information on our website.'
  }
};

// Function to get appropriate accessories based on product type
export function getAccessoriesForProduct(productName: string, productMaterial?: string, productSpec?: string): AccessoryRecommendation {
  const lowerName = productName.toLowerCase();
  const lowerMaterial = productMaterial?.toLowerCase() || '';
  const lowerSpec = productSpec?.toLowerCase() || '';
  
  // Plumbing & Bath products
  if (
    lowerName.includes('toilet') ||
    lowerName.includes('faucet') ||
    lowerName.includes('sink') ||
    lowerName.includes('bath') ||
    lowerName.includes('shower') ||
    lowerName.includes('plumb') ||
    lowerName.includes('drain') ||
    lowerName.includes('valve') ||
    lowerName.includes('vanity')
  ) {
    return plumbingAccessories;
  }
  
  // Appliance products
  if (
    lowerName.includes('refrigerator') ||
    lowerName.includes('washer') ||
    lowerName.includes('dryer') ||
    lowerName.includes('dishwasher') ||
    lowerName.includes('range') ||
    lowerName.includes('oven') ||
    lowerName.includes('microwave') ||
    lowerName.includes('freezer') ||
    lowerName.includes('appliance')
  ) {
    return applianceAccessories;
  }
  
  // Lighting products
  if (
    lowerName.includes('light') ||
    lowerName.includes('lamp') ||
    lowerName.includes('chandelier') ||
    lowerName.includes('fixture') ||
    lowerName.includes('bulb') ||
    lowerName.includes('led') ||
    lowerName.includes('sconce') ||
    lowerName.includes('pendant')
  ) {
    return lightingAccessories;
  }
  
  // Default to generic accessories for unknown product types
  return genericAccessories;
}

// Export individual accessory sets for direct access if needed
export { plumbingAccessories, applianceAccessories, lightingAccessories, genericAccessories };
