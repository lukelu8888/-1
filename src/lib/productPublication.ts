import type { ProductSpec } from '@/data/productData';

export type WebsitePublishType = 'standard' | 'deal' | 'new-arrival' | 'bulk-container';
export type WebsitePublishStatus = 'published' | 'draft' | 'offline';

const hiddenSpecKeys = new Set([
  'unit',
  'currency',
  'price status',
  'publish type',
  'publish status',
  'moq',
  'stock',
  'stock unit',
  'eta',
  'valid until',
  'quantity step',
  'deal tag',
  'display priority',
  'original price',
  'originalprice',
  'compare at price',
  'compareatprice',
  'compare price',
  'list price',
  'regular price',
  'msrp',
  'was price',
  'discount',
  'discount percent',
  'discount%',
  'promotion',
  'promo label',
  'deal label',
  'deal',
  'deals',
  'is deal',
  'isdiscounted',
  'on sale',
  'sale',
  'fulfillment status',
  'website note',
]);

export const getProductSpecValue = (product: ProductSpec, keys: string[]) => {
  const specs = product.specifications || {};
  const match = Object.entries(specs).find(([key]) =>
    keys.some((candidate) => key.trim().toLowerCase() === candidate.toLowerCase())
  );
  return match?.[1] || '';
};

export const parseProductNumber = (value: unknown, fallback = 0) => {
  if (value == null || value === '') return fallback;
  const parsed = Number(String(value).replace(/[^0-9.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const getProductOriginalPrice = (product: ProductSpec) =>
  parseProductNumber(
    getProductSpecValue(product, [
      'Original Price',
      'OriginalPrice',
      'Compare At Price',
      'CompareAtPrice',
      'Compare Price',
      'List Price',
      'Regular Price',
      'MSRP',
      'Was Price',
    ])
  );

export const getProductDiscountLabel = (product: ProductSpec) =>
  formatPublicDiscountLabel(getProductSpecValue(product, ['Discount', 'Discount Percent', 'Discount%', 'Promotion', 'Promo Label', 'Deal Label']));

export const formatPublicDiscountLabel = (value: unknown) => {
  const raw = String(value || '').trim();
  if (!raw) return '';
  const percent = raw.match(/(\d+(?:\.\d+)?)\s*%/);
  if (percent) return `Save ${percent[1]}%`;
  const amount = raw.match(/\$?\s*(\d+(?:\.\d+)?)/);
  if (amount && raw.toLowerCase().includes('save')) return `Save $${amount[1]}`;
  return raw.replace(/优惠/g, 'Save').replace(/折扣/g, 'Save').replace(/促销/g, 'Deal');
};

export const getProductUnit = (product: ProductSpec) => getProductSpecValue(product, ['Unit']) || 'pc';

export const getProductPublishType = (product: ProductSpec): WebsitePublishType => {
  const value = getProductSpecValue(product, ['Publish Type', 'Website Type']).trim().toLowerCase();
  if (value === 'deal' || value === 'new-arrival' || value === 'bulk-container') return value;
  return 'standard';
};

export const getProductPublishStatus = (product: ProductSpec): WebsitePublishStatus => {
  const value = getProductSpecValue(product, ['Publish Status', 'Status']).trim().toLowerCase();
  if (value === 'draft' || value === 'offline') return value;
  return 'published';
};

export const getProductQuantityStep = (product: ProductSpec) =>
  Math.max(
    parseProductNumber(
      getProductSpecValue(product, ['Quantity Step', 'Qty Step', 'Order Multiple']),
      product.unitsPerCarton || 1
    ),
    1
  );

export const getProductMoq = (product: ProductSpec) => {
  const step = getProductQuantityStep(product);
  return Math.max(parseProductNumber(getProductSpecValue(product, ['MOQ', 'Minimum Order Quantity']), step), step);
};

export const getProductDisplayPriority = (product: ProductSpec) =>
  parseProductNumber(getProductSpecValue(product, ['Display Priority']), 100);

export const isWebsiteProductPublished = (product: ProductSpec) => getProductPublishStatus(product) === 'published';

export const hasWebsiteProductPrice = (product: ProductSpec) => Number(product.price || 0) > 0;

export const isWebsiteProductVisible = (product: ProductSpec) =>
  isWebsiteProductPublished(product) && hasWebsiteProductPrice(product);

export const isWebsiteDealProduct = (product: ProductSpec) => {
  const price = Number(product.price || 0);
  const originalPrice = getProductOriginalPrice(product);
  const publishType = getProductPublishType(product);
  const dealFlag = String(getProductSpecValue(product, ['Deal', 'Deals', 'Is Deal', 'IsDiscounted', 'On Sale', 'Sale']))
    .trim()
    .toLowerCase();

  return (
    publishType === 'deal' ||
    publishType === 'bulk-container' ||
    (price > 0 && originalPrice > price) ||
    Boolean(getProductDiscountLabel(product).trim()) ||
    ['true', 'yes', 'y', '1', 'deal', 'sale', 'discount'].includes(dealFlag)
  );
};

export const getWebsiteProductSpecLine = (product: ProductSpec) => {
  const entries = getWebsiteProductSpecEntries(product);
  if (entries.length === 0) return product.model;
  return entries
    .slice(0, 2)
    .map(([key, value]) => `${key}: ${value}`)
    .join(' / ');
};

export const getWebsiteProductSpecEntries = (product: ProductSpec) =>
  Object.entries(product.specifications || {}).filter(([key]) => !hiddenSpecKeys.has(key.trim().toLowerCase()));
