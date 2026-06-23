// Recommended products mapping by subcategory name
// Extracted from Header.tsx for better maintainability
import { applianceUnsplashImages } from './applianceUnsplashImages';

export interface RecommendedProduct {
  name: string;
  price: string;
  image: string;
  badge: string;
}

export const productRecommendationsMap: { [key: string]: RecommendedProduct[] } = {
  'Major Appliances': [
    { name: 'Premium Stainless Steel Refrigerator', price: '$899', image: applianceUnsplashImages.refrigerator, badge: 'Hot Deal' },
    { name: 'High-Efficiency Washer & Dryer Pair', price: '$1,299', image: applianceUnsplashImages.laundry, badge: 'Bundle' },
    { name: 'Slide-In Range With Cooktop', price: '$1,099', image: applianceUnsplashImages.range, badge: 'Popular' },
  ],
  'Small Appliances': [
    { name: 'Countertop Microwave Oven', price: '$149', image: applianceUnsplashImages.microwave, badge: 'Value' },
    { name: 'Kitchen Countertop Appliance Set', price: '$189', image: applianceUnsplashImages.kitchenSuite, badge: 'New' },
    { name: 'Compact Cooking Appliance Kit', price: '$129', image: applianceUnsplashImages.kitchenSuite, badge: 'Compact' },
  ],
  'Appliance Parts & Accessories': [
    { name: 'Refrigerator Water Filter Replacement', price: '$39', image: applianceUnsplashImages.applianceParts, badge: 'Best Seller' },
    { name: 'Washer & Dryer Maintenance Kit', price: '$49', image: applianceUnsplashImages.laundry, badge: 'Parts' },
    { name: 'Range & Microwave Replacement Set', price: '$59', image: applianceUnsplashImages.range, badge: 'Repair' },
  ],
  'Appliance Promotions': [
    { name: 'Complete Kitchen Appliance Bundle', price: '$2,499', image: applianceUnsplashImages.kitchenSuite, badge: 'Hot Deal' },
    { name: 'Laundry Pair Special', price: '$1,799', image: applianceUnsplashImages.laundry, badge: 'Limited' },
    { name: 'Cooking Appliance Upgrade Set', price: '$899', image: applianceUnsplashImages.cooktop, badge: 'New' },
  ],
  Cooktops: [
    { name: 'Built-In Induction Cooktop', price: '$499', image: applianceUnsplashImages.cooktop, badge: 'Popular' },
    { name: 'Portable Electric Cooktop', price: '$129', image: applianceUnsplashImages.cooktop, badge: 'Compact' },
    { name: 'Gas Cooktop 5 Burner', price: '$599', image: applianceUnsplashImages.range, badge: 'Premium' },
  ],
  Dishwashers: [
    { name: 'Built-In Stainless Dishwasher', price: '$649', image: applianceUnsplashImages.dishwasher, badge: 'Best Seller' },
    { name: 'Compact Countertop Dishwasher', price: '$329', image: applianceUnsplashImages.dishwasher, badge: 'Compact' },
    { name: 'Quiet Drawer Dishwasher', price: '$899', image: applianceUnsplashImages.dishwasher, badge: 'Premium' },
  ],
  'Freezers & Ice Makers': [
    { name: 'Chest Freezer 15 Cu Ft', price: '$549', image: applianceUnsplashImages.freezerIce, badge: 'Popular' },
    { name: 'Portable Ice Maker Machine', price: '$299', image: applianceUnsplashImages.freezerIce, badge: 'New' },
    { name: 'Upright Freezer', price: '$699', image: applianceUnsplashImages.freezerIce, badge: 'Value' },
  ],
  'Garbage Disposals & Accessories': [
    { name: 'Continuous Feed Disposal', price: '$149', image: applianceUnsplashImages.garbageDisposal, badge: 'Best Seller' },
    { name: 'Heavy Duty Food Waste Disposer', price: '$229', image: applianceUnsplashImages.garbageDisposal, badge: 'Premium' },
    { name: 'Disposal Installation Accessory Kit', price: '$39', image: applianceUnsplashImages.garbageDisposal, badge: 'Kit' },
  ],
  'Heating, Cooling & Air Quality': [
    { name: 'HEPA Air Purifier', price: '$249', image: applianceUnsplashImages.airQuality, badge: 'Popular' },
    { name: 'Smart Dehumidifier', price: '$329', image: applianceUnsplashImages.airQuality, badge: 'New' },
    { name: 'Window AC Unit', price: '$289', image: applianceUnsplashImages.airQuality, badge: 'Seasonal' },
  ],
  'Kitchen Packages': [
    { name: '4-Piece Kitchen Suite', price: '$3,299', image: applianceUnsplashImages.kitchenSuite, badge: 'Hot Deal' },
    { name: '3-Piece Starter Package', price: '$2,199', image: applianceUnsplashImages.kitchenSuite, badge: 'Value' },
    { name: 'Premium Kitchen Upgrade Bundle', price: '$4,999', image: applianceUnsplashImages.kitchenSuite, badge: 'Premium' },
  ],
  Microwaves: [
    { name: 'Over-the-Range Microwave', price: '$399', image: applianceUnsplashImages.microwave, badge: 'Best Seller' },
    { name: 'Countertop Microwave', price: '$149', image: applianceUnsplashImages.microwave, badge: 'Value' },
    { name: 'Built-In Microwave Oven', price: '$599', image: applianceUnsplashImages.microwave, badge: 'Built-In' },
  ],
  Ranges: [
    { name: 'Gas Range 30 inch', price: '$899', image: applianceUnsplashImages.range, badge: 'Popular' },
    { name: 'Dual Fuel Range', price: '$1,599', image: applianceUnsplashImages.range, badge: 'Premium' },
    { name: 'Slide-In Electric Range', price: '$1,099', image: applianceUnsplashImages.range, badge: 'New' },
  ],
};

export const defaultProducts: RecommendedProduct[] = [
  {
    name: 'Premium Stainless Steel Refrigerator',
    price: '$899',
    image: applianceUnsplashImages.refrigerator,
    badge: 'Hot Deal'
  },
  {
    name: 'High-Efficiency Washing Machine',
    price: '$649',
    image: applianceUnsplashImages.laundry,
    badge: 'New'
  }
];
