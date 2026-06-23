import { applianceUnsplashImages } from './applianceUnsplashImages';

export const leafCategoryImages: Record<string, string> = {
  'Shop All Appliances': applianceUnsplashImages.kitchenSuite,
  Refrigerators: applianceUnsplashImages.refrigerator,
  'Washers & Dryers': applianceUnsplashImages.laundry,
  'Ranges, Cooktops & Ovens': applianceUnsplashImages.range,
  Dishwashers: applianceUnsplashImages.dishwasher,
  Freezers: applianceUnsplashImages.freezerIce,
  'Range Hoods': applianceUnsplashImages.range,

  'Shop All Small Appliances': applianceUnsplashImages.kitchenSuite,
  'Coffee Makers': applianceUnsplashImages.kitchenSuite,
  Blenders: applianceUnsplashImages.kitchenSuite,
  Toasters: applianceUnsplashImages.kitchenSuite,
  Microwaves: applianceUnsplashImages.microwave,
  'Slow Cookers': applianceUnsplashImages.kitchenSuite,
  'Air Fryers': applianceUnsplashImages.kitchenSuite,

  'Shop All Parts': applianceUnsplashImages.applianceParts,
  'Refrigerator Parts': applianceUnsplashImages.refrigerator,
  'Washer Parts': applianceUnsplashImages.laundry,
  'Dryer Parts': applianceUnsplashImages.laundry,
  'Dishwasher Parts': applianceUnsplashImages.dishwasher,
  'Range Parts': applianceUnsplashImages.range,
  'Microwave Parts': applianceUnsplashImages.microwave,
  'Water Filter': applianceUnsplashImages.applianceParts,
  'Appliance Cleaner': applianceUnsplashImages.applianceParts,

  'Kitchen Packages': applianceUnsplashImages.kitchenSuite,
  'Laundry Pairs': applianceUnsplashImages.laundry,
  'Suite Deals': applianceUnsplashImages.kitchenSuite,
  'Clearance Items': applianceUnsplashImages.kitchenSuite,
  'Rebates & Offers': applianceUnsplashImages.kitchenSuite,

  'Gas Cooktops': applianceUnsplashImages.range,
  'Electric Cooktops': applianceUnsplashImages.cooktop,
  'Induction Cooktops': applianceUnsplashImages.cooktop,
  'Portable Cooktops': applianceUnsplashImages.cooktop,

  'Built-In Dishwashers': applianceUnsplashImages.dishwasher,
  'Portable Dishwashers': applianceUnsplashImages.dishwasher,
  'Drawer Dishwashers': applianceUnsplashImages.dishwasher,
  'Compact Dishwashers': applianceUnsplashImages.dishwasher,

  'Chest Freezers': applianceUnsplashImages.freezerIce,
  'Commercial Freezers & Ice Makers': applianceUnsplashImages.freezerIce,
  'Ice Makers': applianceUnsplashImages.freezerIce,
  'Propane & Solar Freezers': applianceUnsplashImages.freezerIce,
  'Small Space Freezers': applianceUnsplashImages.freezerIce,
  'Upright Freezers': applianceUnsplashImages.freezerIce,

  'Continuous Feed Disposals': applianceUnsplashImages.garbageDisposal,
  'Batch Feed Disposals': applianceUnsplashImages.garbageDisposal,
  'Disposal Accessories': applianceUnsplashImages.garbageDisposal,

  'Air Purifiers': applianceUnsplashImages.airQuality,
  'Dehumidifiers': applianceUnsplashImages.airQuality,
  'Humidifiers': applianceUnsplashImages.airQuality,
  'Portable Heaters': applianceUnsplashImages.airQuality,
  'Window AC Units': applianceUnsplashImages.airQuality,

  '3-Piece Packages': applianceUnsplashImages.kitchenSuite,
  '4-Piece Packages': applianceUnsplashImages.kitchenSuite,
  'Complete Kitchen Suites': applianceUnsplashImages.kitchenSuite,

  'Built-In Microwaves': applianceUnsplashImages.microwave,
  'Countertop Microwaves': applianceUnsplashImages.microwave,
  'Over-the-Range Microwaves': applianceUnsplashImages.microwave,

  'Electric Ranges': applianceUnsplashImages.range,
  'Gas Ranges': applianceUnsplashImages.range,
  'Dual Fuel Ranges': applianceUnsplashImages.range,
  'Slide-In Ranges': applianceUnsplashImages.range,
};

export function getLeafCategoryImage(categoryName: string | null | undefined) {
  if (!categoryName) return undefined;
  return leafCategoryImages[categoryName];
}
