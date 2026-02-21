// Recommended products mapping by subcategory name
// Extracted from Header.tsx for better maintainability

export interface RecommendedProduct {
  name: string;
  price: string;
  image: string;
  badge: string;
}

export const productRecommendationsMap: { [key: string]: RecommendedProduct[] } = {
  // This file will be populated in the next step
  // Placeholder to create the file structure first
};

export const defaultProducts: RecommendedProduct[] = [
  {
    name: 'Premium Stainless Steel Refrigerator',
    price: '$899',
    image: 'https://images.unsplash.com/photo-1759691337957-ebc9ed54dc44?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjByZWZyaWdlcmF0b3IlMjBzdGFpbmxlc3N8ZW58MXx8fHwxNzYxMjAwNTM4fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    badge: 'Hot Deal'
  },
  {
    name: 'High-Efficiency Washing Machine',
    price: '$649',
    image: 'https://images.unsplash.com/photo-1754732693535-7ffb5e1a51d6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3YXNoaW5nJTIwbWFjaGluZSUyMGFwcGxpYW5jZXN8ZW58MXx8fHwxNzYxMTgyNTY3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    badge: 'New'
  }
];
