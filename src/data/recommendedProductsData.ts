// Recommended products data for each subcategory
export type RecommendedProduct = {
  name: string;
  price: string;
  image: string;
  badge: string;
};

export const recommendedProductsMap: { [key: string]: Array<RecommendedProduct> } = {
  // Appliances
  'Appliance Parts & Accessories': [
    { name: 'Water Filter Replacement', price: '$39', image: 'https://images.unsplash.com/photo-1653548147256-f1ba6da5f446?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhcHBsaWFuY2UlMjBwYXJ0cyUyMGFjY2Vzc29yaWVzfGVufDF8fHx8MTc2MTIwMjE2N3ww&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Best Seller' },
    { name: 'Appliance Cleaner Kit', price: '$24', image: 'https://images.unsplash.com/photo-1653548147256-f1ba6da5f446?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhcHBsaWFuY2UlMjBwYXJ0cyUyMGFjY2Vzc29yaWVzfGVufDF8fHx8MTc2MTIwMjE2N3ww&ixlib=rb-4.1.0&q=80&w=1080', badge: 'New' }
  ],
  'Appliance Promotions': [
    { name: 'Kitchen Suite Bundle', price: '$2,499', image: 'https://images.unsplash.com/photo-1708915965975-2a950db0e215?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxraXRjaGVuJTIwYXBwbGlhbmNlJTIwcHJvbW90aW9ufGVufDF8fHx8MTc2MTIwMjE2N3ww&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Hot Deal' },
    { name: 'Laundry Pair Special', price: '$1,799', image: 'https://images.unsplash.com/photo-1708915965975-2a950db0e215?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxraXRjaGVuJTIwYXBwbGlhbmNlJTIwcHJvbW90aW9ufGVufDF8fHx8MTc2MTIwMjE2N3ww&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Limited' }
  ],
  'Cooktops': [
    { name: 'Gas Cooktop 5 Burner', price: '$599', image: 'https://images.unsplash.com/photo-1739598752069-6806ce5d762a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnYXMlMjBjb29rdG9wJTIwc3RvdmV8ZW58MXx8fHwxNzYxMjAyMTY4fDA&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Popular' },
    { name: 'Induction Cooktop', price: '$799', image: 'https://images.unsplash.com/photo-1739598752069-6806ce5d762a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnYXMlMjBjb29rdG9wJTIwc3RvdmV8ZW58MXx8fHwxNzYxMjAyMTY4fDA&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Premium' }
  ],
  'Dishwashers': [
    { name: 'Built-In Dishwasher', price: '$649', image: 'https://images.unsplash.com/photo-1758631130778-42d518bf13aa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBkaXNod2FzaGVyfGVufDF8fHx8MTc2MTIwMjE2OHww&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Best Seller' },
    { name: 'Quiet Dishwasher', price: '$899', image: 'https://images.unsplash.com/photo-1758631130778-42d518bf13aa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBkaXNod2FzaGVyfGVufDF8fHx8MTc2MTIwMjE2OHww&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Premium' }
  ],
};

export const defaultRecommendedProducts: RecommendedProduct[] = [
  {
    name: 'Featured Product',
    price: '$99',
    image: 'https://images.unsplash.com/photo-1484101403633-562f891dc89a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsaXZpbmclMjByb29tJTIwc29mYXxlbnwxfHx8fDE3NjEyMDAwMDF8MA&ixlib=rb-4.1.0&q=80&w=1080',
    badge: 'Featured'
  },
  {
    name: 'High-Efficiency Washing Machine',
    price: '$649',
    image: 'https://images.unsplash.com/photo-1754732693535-7ffb5e1a51d6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3YXNoaW5nJTIwbWFjaGluZSUyMGFwcGxpYW5jZXxlbnwxfHx8fDE3NjExODI1Njd8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    badge: 'New'
  }
];
