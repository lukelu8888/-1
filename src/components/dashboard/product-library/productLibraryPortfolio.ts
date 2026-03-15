import type { Order } from '../../../contexts/OrderContext';
import type { SalesQuotation } from '../../../contexts/SalesQuotationContext';
import type { CustomerProductRecord } from '../../../lib/customerProductLibrary';

export type ProductPriceStats = {
  count: number;
  lastPrice: number | null;
  averagePrice: number | null;
  lastDate: string | null;
};

export type ProductLibraryAsset = {
  id: string;
  matchKey: string;
  productName: string;
  description: string;
  itemType: 'standard_sourcing' | 'oem_custom';
  customerModelNo: string;
  supplierModelNo: string;
  supplierProductId?: string | null;
  imageUrl: string;
  attachmentCount: number;
  sourceType: 'customer_owned' | 'third_party' | 'cosun' | 'mixed';
  productStatus: 'draft' | 'active' | 'archived';
  packageVersion: number;
  packageStatus: 'no_package' | 'basic_package' | 'technical_package_ready';
  unit: string;
  syncStatus: 'pending' | 'synced';
  syncMessage?: string | null;
  sourceTags: string[];
  manualRecord?: CustomerProductRecord;
  quoteStats: ProductPriceStats;
  orderStats: ProductPriceStats & {
    totalOrderedQty: number;
  };
  lastInquiryNumber?: string | null;
  lastOrderNumber?: string | null;
  lastQuotationNumber?: string | null;
  updatedAt: string;
};

type ProductAccumulator = {
  id: string;
  matchKey: string;
  productName: string;
  description: string;
  itemType: 'standard_sourcing' | 'oem_custom';
  customerModelNo: string;
  supplierModelNo: string;
  supplierProductId?: string | null;
  imageUrl: string;
  attachmentCount: number;
  sourceType: 'customer_owned' | 'third_party' | 'cosun' | 'mixed';
  productStatus: 'draft' | 'active' | 'archived';
  packageVersion: number;
  unit: string;
  syncStatus: 'pending' | 'synced';
  syncMessage?: string | null;
  sourceTags: Set<string>;
  manualRecord?: CustomerProductRecord;
  quotePrices: number[];
  quoteDates: string[];
  orderPrices: number[];
  orderDates: string[];
  totalOrderedQty: number;
  lastInquiryNumber?: string | null;
  lastOrderNumber?: string | null;
  lastQuotationNumber?: string | null;
  updatedAt: string;
};

export const normalizeText = (value: unknown) => String(value || '').trim();
export const normalizeLower = (value: unknown) => normalizeText(value).toLowerCase();

export const buildProductMatchKey = (input: {
  supplierModelNo?: unknown;
  customerModelNo?: unknown;
  productName?: unknown;
  description?: unknown;
}) => {
  const supplierModelNo = normalizeLower(input.supplierModelNo);
  if (supplierModelNo) return `supplier:${supplierModelNo}`;

  const customerModelNo = normalizeLower(input.customerModelNo);
  if (customerModelNo) return `customer:${customerModelNo}`;

  const productName = normalizeLower(input.productName);
  if (productName) return `name:${productName}`;

  const description = normalizeLower(input.description);
  if (description) return `desc:${description}`;

  return `unknown:${Math.random().toString(16).slice(2, 10)}`;
};

const pickNewerDate = (current: string, candidate?: string | null) => {
  if (!candidate) return current;
  if (!current) return candidate;
  return new Date(candidate).getTime() > new Date(current).getTime() ? candidate : current;
};

const buildPriceStats = (prices: number[], dates: string[]): ProductPriceStats => {
  const validPrices = prices.filter((value) => Number.isFinite(value) && value > 0);
  const lastDate = dates.filter(Boolean).sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0] || null;
  return {
    count: validPrices.length,
    lastPrice: validPrices.length ? validPrices[validPrices.length - 1] : null,
    averagePrice: validPrices.length
      ? validPrices.reduce((sum, value) => sum + value, 0) / validPrices.length
      : null,
    lastDate,
  };
};

const seedAccumulator = (
  key: string,
  base?: Partial<ProductAccumulator>,
): ProductAccumulator => ({
  id: base?.id || `asset-${key}`,
  matchKey: key,
  productName: normalizeText(base?.productName),
  description: normalizeText(base?.description),
  itemType: base?.itemType === 'oem_custom' ? 'oem_custom' : 'standard_sourcing',
  customerModelNo: normalizeText(base?.customerModelNo),
  supplierModelNo: normalizeText(base?.supplierModelNo),
  supplierProductId: normalizeText(base?.supplierProductId) || null,
  imageUrl: normalizeText(base?.imageUrl),
  attachmentCount: Number(base?.attachmentCount || 0),
  sourceType: base?.sourceType || 'customer_owned',
  productStatus: base?.productStatus || 'active',
  packageVersion: Number(base?.packageVersion || 1) || 1,
  unit: normalizeText(base?.unit) || 'pcs',
  syncStatus: base?.syncStatus === 'pending' ? 'pending' : 'synced',
  syncMessage: normalizeText(base?.syncMessage) || null,
  sourceTags: new Set(base?.sourceTags || []),
  manualRecord: base?.manualRecord,
  quotePrices: [],
  quoteDates: [],
  orderPrices: [],
  orderDates: [],
  totalOrderedQty: 0,
  lastInquiryNumber: base?.lastInquiryNumber || null,
  lastOrderNumber: base?.lastOrderNumber || null,
  lastQuotationNumber: base?.lastQuotationNumber || null,
  updatedAt: base?.updatedAt || '',
});

const mergePreferredText = (current: string, incoming?: string | null) => {
  const normalizedIncoming = normalizeText(incoming);
  if (!current && normalizedIncoming) return normalizedIncoming;
  return current;
};

const mergeAccumulator = (
  registry: Map<string, ProductAccumulator>,
  key: string,
  patch: Partial<ProductAccumulator> & {
    sourceTag: string;
    quotePrice?: number | null;
    quoteDate?: string | null;
    orderPrice?: number | null;
    orderDate?: string | null;
    orderQty?: number | null;
  },
) => {
  const current = registry.get(key) || seedAccumulator(key, patch);

  current.productName = mergePreferredText(current.productName, patch.productName);
  current.description = mergePreferredText(current.description, patch.description);
  current.customerModelNo = mergePreferredText(current.customerModelNo, patch.customerModelNo);
  current.supplierModelNo = mergePreferredText(current.supplierModelNo, patch.supplierModelNo);
  current.supplierProductId = current.supplierProductId || normalizeText(patch.supplierProductId) || null;
  current.imageUrl = mergePreferredText(current.imageUrl, patch.imageUrl);
  current.attachmentCount = Math.max(current.attachmentCount, Number(patch.attachmentCount || 0));
  current.sourceType = patch.sourceType || current.sourceType;
  current.productStatus = patch.productStatus || current.productStatus;
  current.packageVersion = Math.max(current.packageVersion, Number(patch.packageVersion || 1));
  current.unit = mergePreferredText(current.unit, patch.unit) || 'pcs';
  current.itemType =
    current.itemType === 'oem_custom' || patch.itemType === 'oem_custom'
      ? 'oem_custom'
      : 'standard_sourcing';
  current.syncStatus =
    current.syncStatus === 'pending' || patch.syncStatus === 'pending' ? 'pending' : 'synced';
  current.syncMessage = current.syncMessage || patch.syncMessage || null;
  current.lastInquiryNumber = current.lastInquiryNumber || patch.lastInquiryNumber || null;
  current.lastOrderNumber = current.lastOrderNumber || patch.lastOrderNumber || null;
  current.lastQuotationNumber = current.lastQuotationNumber || patch.lastQuotationNumber || null;
  current.updatedAt = pickNewerDate(current.updatedAt, patch.updatedAt || null);
  current.sourceTags.add(patch.sourceTag);

  if (patch.manualRecord) {
    current.manualRecord = patch.manualRecord;
    current.id = patch.manualRecord.id;
  }

  if (Number.isFinite(patch.quotePrice) && Number(patch.quotePrice) > 0) {
    current.quotePrices.push(Number(patch.quotePrice));
  }
  if (patch.quoteDate) current.quoteDates.push(patch.quoteDate);
  if (Number.isFinite(patch.orderPrice) && Number(patch.orderPrice) > 0) {
    current.orderPrices.push(Number(patch.orderPrice));
  }
  if (patch.orderDate) current.orderDates.push(patch.orderDate);
  if (Number.isFinite(patch.orderQty)) {
    current.totalOrderedQty += Number(patch.orderQty || 0);
  }

  registry.set(key, current);
};

const isCustomerQuotation = (quotation: SalesQuotation, customerEmail: string) =>
  normalizeLower(quotation.customerEmail) === customerEmail;

const isCustomerOrder = (order: Order, customerEmail: string) =>
  normalizeLower(order.customerEmail || '') === customerEmail;

export const buildProductLibraryAssets = ({
  libraryRecords,
  orders,
  quotations,
  currentUserEmail,
}: {
  libraryRecords: CustomerProductRecord[];
  orders: Order[];
  quotations: SalesQuotation[];
  currentUserEmail: string;
}): ProductLibraryAsset[] => {
  const registry = new Map<string, ProductAccumulator>();

  libraryRecords.forEach((record) => {
    if (currentUserEmail && normalizeLower(record.customerEmail) !== currentUserEmail) return;
    const key = buildProductMatchKey({
      supplierModelNo: record.supplierModelNo,
      customerModelNo: record.customerModelNo,
      productName: record.productName,
      description: record.description,
    });
    mergeAccumulator(registry, key, {
      id: record.id,
      productName: record.productName,
      description: record.description,
      itemType: record.itemType,
      customerModelNo: record.customerModelNo,
      supplierModelNo: record.supplierModelNo,
      supplierProductId: record.supplierProductId,
      imageUrl: record.imageUrl,
      attachmentCount: record.attachmentCount,
      sourceType: record.sourceType || 'customer_owned',
      productStatus: record.productStatus || 'active',
      packageVersion: record.packageVersion || 1,
      unit: record.unit,
      syncStatus: record.syncStatus,
      syncMessage: record.syncMessage,
      lastInquiryNumber: record.lastInquiryNumber,
      updatedAt: record.updatedAt,
      manualRecord: record,
      sourceTag: 'manual',
    });
  });

  quotations
    .filter((quotation) => !currentUserEmail || isCustomerQuotation(quotation, currentUserEmail))
    .forEach((quotation) => {
      const items = Array.isArray(quotation.items) ? quotation.items : [];
      items.forEach((item) => {
        if (!item) return;
        const key = buildProductMatchKey({
          supplierModelNo: item?.modelNo,
          productName: item?.productName,
          description: item?.specification,
        });
        mergeAccumulator(registry, key, {
          productName: normalizeText(item?.productName),
          description: normalizeText(item?.specification),
          supplierModelNo: normalizeText(item?.modelNo),
          itemType: 'standard_sourcing',
          sourceType: 'cosun',
          unit: normalizeText(item?.unit) || 'pcs',
          quotePrice: Number(item?.salesPrice || 0),
          quoteDate: quotation.updatedAt || quotation.createdAt,
          lastQuotationNumber: quotation.qtNumber,
          updatedAt: quotation.updatedAt || quotation.createdAt,
          sourceTag: 'quoted',
        });
      });
    });

  orders
    .filter((order) => !currentUserEmail || isCustomerOrder(order, currentUserEmail))
    .forEach((order) => {
      const products = Array.isArray(order.products) ? order.products : [];
      products.forEach((product) => {
        if (!product) return;
        const key = buildProductMatchKey({
          customerModelNo: product?.specs,
          productName: product?.name,
          description: product?.specs,
        });
        mergeAccumulator(registry, key, {
          productName: normalizeText(product?.name),
          description: normalizeText(product?.specs),
          customerModelNo: normalizeText(product?.specs),
          sourceType: 'cosun',
          unit: 'pcs',
          orderPrice: Number(product?.unitPrice || 0),
          orderDate: order.updatedAt || order.createdAt || order.date,
          orderQty: Number(product?.quantity || 0),
          lastOrderNumber: order.orderNumber,
          updatedAt: order.updatedAt || order.createdAt || order.date,
          sourceTag: 'ordered',
        });
      });
    });

  return Array.from(registry.values())
    .map<ProductLibraryAsset>((item) => {
      const quoteStats = buildPriceStats(item.quotePrices, item.quoteDates);
      const orderPriceStats = buildPriceStats(item.orderPrices, item.orderDates);
      const computedSourceType =
        item.manualRecord?.sourceType
          ? item.sourceTags.size > 1 && item.manualRecord.sourceType !== 'cosun'
            ? 'mixed'
            : item.manualRecord.sourceType
          : item.sourceTags.has('ordered') || item.sourceTags.has('quoted')
            ? item.sourceTags.has('manual')
              ? 'mixed'
              : 'cosun'
            : 'customer_owned';

      return {
        id: item.id,
        matchKey: item.matchKey,
        productName: item.productName || item.customerModelNo || item.supplierModelNo || 'Unnamed Product',
        description: item.description,
        itemType: item.itemType,
        customerModelNo: item.customerModelNo,
        supplierModelNo: item.supplierModelNo,
        supplierProductId: item.supplierProductId,
        imageUrl: item.imageUrl,
        attachmentCount: item.attachmentCount,
        sourceType: computedSourceType,
        productStatus: item.manualRecord?.productStatus || item.productStatus || 'active',
        packageVersion: item.manualRecord?.packageVersion || item.packageVersion || 1,
        packageStatus:
          item.attachmentCount > 0
            ? 'technical_package_ready'
            : item.description
              ? 'basic_package'
              : 'no_package',
        unit: item.unit,
        syncStatus: item.syncStatus,
        syncMessage: item.syncMessage,
        sourceTags: Array.from(item.sourceTags),
        manualRecord: item.manualRecord,
        quoteStats,
        orderStats: {
          ...orderPriceStats,
          totalOrderedQty: item.totalOrderedQty,
        },
        lastInquiryNumber: item.lastInquiryNumber,
        lastOrderNumber: item.lastOrderNumber,
        lastQuotationNumber: item.lastQuotationNumber,
        updatedAt: item.updatedAt,
      };
    })
    .sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')));
};
