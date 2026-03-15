import type { Order } from '../contexts/OrderContext';
import type { SalesQuotation } from '../contexts/SalesQuotationContext';
import type { CustomerProductRecord } from './customerProductLibrary';
import { getCurrentUser } from '../utils/dataIsolation';
import type {
  AttachmentSummarySnapshot,
  CustomerProductSourceType,
  FileManifestSnapshotEntry,
  MasterProductRef,
  ProductDisplaySourceType,
  ProductMappingRef,
} from './product-domain/types';

export type ProductPriceStats = {
  count: number;
  lastPrice: number | null;
  averagePrice: number | null;
  lastDate: string | null;
};

export type ProductLibraryAsset = {
  id: string;
  matchKey: string;
  recordType: 'product' | 'project';
  isProjectBased: boolean;
  projectCode?: string | null;
  projectName?: string | null;
  currentRevisionId?: string | null;
  currentRevisionCode?: string | null;
  currentRevisionStatus?: 'working' | 'quoted' | 'superseded' | 'final' | 'cancelled' | null;
  finalRevisionId?: string | null;
  finalRevisionCode?: string | null;
  productName: string;
  description: string;
  itemType: 'standard_sourcing' | 'oem_custom';
  customerModelNo: string;
  supplierModelNo: string;
  supplierProductId?: string | null;
  imageUrl: string;
  attachmentCount: number;
  sourceType: ProductDisplaySourceType;
  assetSourceType: CustomerProductSourceType;
  productStatus: 'draft' | 'active' | 'archived';
  packageVersion: number;
  packageStatus: 'no_package' | 'basic_package' | 'technical_package_ready';
  masterRef?: MasterProductRef | null;
  mappingRef?: ProductMappingRef | null;
  attachmentSummarySnapshot?: AttachmentSummarySnapshot;
  fileManifestSnapshot?: FileManifestSnapshotEntry[];
  unit: string;
  syncStatus: 'pending' | 'synced';
  syncMessage?: string | null;
  sourceTags: string[];
  manualRecord?: CustomerProductRecord;
  quoteStats: ProductPriceStats;
  orderStats: ProductPriceStats & {
    totalOrderedQty: number;
  };
  lastInquiryId?: string | null;
  lastInquiryNumber?: string | null;
  lastQuoteId?: string | null;
  lastOrderNumber?: string | null;
  lastOrderId?: string | null;
  lastQuotationNumber?: string | null;
  usageCount: number;
  updatedAt: string;
};

type ProductAccumulator = {
  id: string;
  matchKey: string;
  recordType: 'product' | 'project';
  isProjectBased: boolean;
  projectCode?: string | null;
  projectName?: string | null;
  currentRevisionId?: string | null;
  currentRevisionCode?: string | null;
  currentRevisionStatus?: 'working' | 'quoted' | 'superseded' | 'final' | 'cancelled' | null;
  finalRevisionId?: string | null;
  finalRevisionCode?: string | null;
  productName: string;
  description: string;
  itemType: 'standard_sourcing' | 'oem_custom';
  customerModelNo: string;
  supplierModelNo: string;
  supplierProductId?: string | null;
  imageUrl: string;
  attachmentCount: number;
  sourceType: ProductDisplaySourceType;
  assetSourceType: CustomerProductSourceType;
  productStatus: 'draft' | 'active' | 'archived';
  packageVersion: number;
  masterRef?: MasterProductRef | null;
  mappingRef?: ProductMappingRef | null;
  attachmentSummarySnapshot?: AttachmentSummarySnapshot;
  fileManifestSnapshot?: FileManifestSnapshotEntry[];
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
  lastInquiryId?: string | null;
  lastInquiryNumber?: string | null;
  lastQuoteId?: string | null;
  lastOrderNumber?: string | null;
  lastOrderId?: string | null;
  lastQuotationNumber?: string | null;
  usageCount: number;
  updatedAt: string;
};

const normalizeText = (value: unknown) => String(value || '').trim();
const normalizeLower = (value: unknown) => normalizeText(value).toLowerCase();

export const resolveProductLibraryCustomerEmail = () => {
  if (typeof window === 'undefined') {
    return normalizeLower(getCurrentUser()?.email);
  }

  try {
    const currentUser = getCurrentUser() as any;
    const authUser = JSON.parse(localStorage.getItem('cosun_auth_user') || 'null');
    const backendUser = JSON.parse(localStorage.getItem('cosun_backend_user') || 'null');
    const customerProfile = JSON.parse(localStorage.getItem('cosun_customer_profile') || 'null');
    return normalizeLower(
      currentUser?.email ||
        backendUser?.email ||
        authUser?.email ||
        customerProfile?.email ||
        '',
    );
  } catch {
    return normalizeLower(getCurrentUser()?.email);
  }
};

const buildProductMatchKey = (input: {
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

  return 'unknown:unclassified-product';
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
  recordType: base?.recordType === 'project' ? 'project' : 'product',
  isProjectBased: base?.recordType === 'project' || Boolean(base?.isProjectBased),
  projectCode: normalizeText(base?.projectCode) || null,
  projectName: normalizeText(base?.projectName) || null,
  currentRevisionId: normalizeText(base?.currentRevisionId) || null,
  currentRevisionCode: normalizeText(base?.currentRevisionCode) || null,
  currentRevisionStatus: base?.currentRevisionStatus || null,
  finalRevisionId: normalizeText(base?.finalRevisionId) || null,
  finalRevisionCode: normalizeText(base?.finalRevisionCode) || null,
  productName: normalizeText(base?.productName),
  description: normalizeText(base?.description),
  itemType: base?.itemType === 'oem_custom' ? 'oem_custom' : 'standard_sourcing',
  customerModelNo: normalizeText(base?.customerModelNo),
  supplierModelNo: normalizeText(base?.supplierModelNo),
  supplierProductId: normalizeText(base?.supplierProductId) || null,
  imageUrl: normalizeText(base?.imageUrl),
  attachmentCount: Number(base?.attachmentCount || 0),
  sourceType: base?.sourceType || 'customer_owned',
  assetSourceType: base?.assetSourceType || 'customer_created',
  productStatus: base?.productStatus || 'active',
  packageVersion: Number(base?.packageVersion || 1) || 1,
  masterRef: base?.masterRef || null,
  mappingRef: base?.mappingRef || null,
  attachmentSummarySnapshot: base?.attachmentSummarySnapshot,
  fileManifestSnapshot: base?.fileManifestSnapshot,
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
  lastInquiryId: base?.lastInquiryId || null,
  lastInquiryNumber: base?.lastInquiryNumber || null,
  lastQuoteId: base?.lastQuoteId || null,
  lastOrderNumber: base?.lastOrderNumber || null,
  lastOrderId: base?.lastOrderId || null,
  lastQuotationNumber: base?.lastQuotationNumber || null,
  usageCount: Math.max(0, Number(base?.usageCount || 0) || 0),
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
  current.recordType = patch.recordType === 'project' ? 'project' : current.recordType;
  current.isProjectBased = current.recordType === 'project' || Boolean(patch.isProjectBased) || current.isProjectBased;
  current.projectCode = current.projectCode || normalizeText(patch.projectCode) || null;
  current.projectName = current.projectName || normalizeText(patch.projectName) || null;
  current.currentRevisionId = current.currentRevisionId || normalizeText(patch.currentRevisionId) || null;
  current.currentRevisionCode = current.currentRevisionCode || normalizeText(patch.currentRevisionCode) || null;
  current.currentRevisionStatus = patch.currentRevisionStatus || current.currentRevisionStatus || null;
  current.finalRevisionId = current.finalRevisionId || normalizeText(patch.finalRevisionId) || null;
  current.finalRevisionCode = current.finalRevisionCode || normalizeText(patch.finalRevisionCode) || null;
  current.description = mergePreferredText(current.description, patch.description);
  current.customerModelNo = mergePreferredText(current.customerModelNo, patch.customerModelNo);
  current.supplierModelNo = mergePreferredText(current.supplierModelNo, patch.supplierModelNo);
  current.supplierProductId = current.supplierProductId || normalizeText(patch.supplierProductId) || null;
  current.imageUrl = mergePreferredText(current.imageUrl, patch.imageUrl);
  current.attachmentCount = Math.max(current.attachmentCount, Number(patch.attachmentCount || 0));
  current.sourceType = patch.sourceType || current.sourceType;
  current.assetSourceType = patch.assetSourceType || current.assetSourceType;
  current.productStatus = patch.productStatus || current.productStatus;
  current.packageVersion = Math.max(current.packageVersion, Number(patch.packageVersion || 1));
  current.masterRef = patch.masterRef || current.masterRef || null;
  current.mappingRef = patch.mappingRef || current.mappingRef || null;
  current.attachmentSummarySnapshot = patch.attachmentSummarySnapshot || current.attachmentSummarySnapshot;
  current.fileManifestSnapshot = patch.fileManifestSnapshot || current.fileManifestSnapshot;
  current.unit = mergePreferredText(current.unit, patch.unit) || 'pcs';
  current.itemType =
    current.itemType === 'oem_custom' || patch.itemType === 'oem_custom'
      ? 'oem_custom'
      : 'standard_sourcing';
  current.syncStatus =
    current.syncStatus === 'pending' || patch.syncStatus === 'pending' ? 'pending' : 'synced';
  current.syncMessage = current.syncMessage || patch.syncMessage || null;
  current.lastInquiryId = current.lastInquiryId || patch.lastInquiryId || null;
  current.lastInquiryNumber = current.lastInquiryNumber || patch.lastInquiryNumber || null;
  current.lastQuoteId = current.lastQuoteId || patch.lastQuoteId || null;
  current.lastOrderNumber = current.lastOrderNumber || patch.lastOrderNumber || null;
  current.lastOrderId = current.lastOrderId || patch.lastOrderId || null;
  current.lastQuotationNumber = current.lastQuotationNumber || patch.lastQuotationNumber || null;
  current.usageCount = Math.max(current.usageCount, Number(patch.usageCount || 0) || 0);
  current.updatedAt = pickNewerDate(current.updatedAt, patch.updatedAt || null);
  current.sourceTags.add(patch.sourceTag);

  if (patch.manualRecord) {
    current.manualRecord = patch.manualRecord;
    current.id = patch.manualRecord.id;
  }

  if (Number.isFinite(patch.quotePrice) && Number(patch.quotePrice) > 0) {
    current.quotePrices.push(Number(patch.quotePrice));
  }
  if (patch.quoteDate) {
    current.quoteDates.push(patch.quoteDate);
  }
  if (Number.isFinite(patch.orderPrice) && Number(patch.orderPrice) > 0) {
    current.orderPrices.push(Number(patch.orderPrice));
  }
  if (patch.orderDate) {
    current.orderDates.push(patch.orderDate);
  }
  if (Number.isFinite(patch.orderQty)) {
    current.totalOrderedQty += Number(patch.orderQty || 0);
  }

  registry.set(key, current);
};

const resolveDisplaySourceType = (item: ProductAccumulator): ProductDisplaySourceType => {
  const hasBusinessHistory = item.sourceTags.has('ordered') || item.sourceTags.has('quoted');
  if (item.manualRecord?.legacySourceType === 'third_party') {
    return hasBusinessHistory ? 'mixed' : 'third_party';
  }
  if (hasBusinessHistory) {
    return item.sourceTags.has('manual') ? 'mixed' : 'cosun';
  }
  return item.assetSourceType === 'assigned_by_cosun' ? 'cosun' : 'customer_owned';
};

const isCustomerQuotation = (quotation: SalesQuotation, customerEmail: string) =>
  normalizeLower(quotation.customerEmail) === customerEmail;

const isCustomerOrder = (order: Order, customerEmail: string) =>
  normalizeLower(order.customerEmail || '') === customerEmail;

export const buildProductLibraryAssets = ({
  libraryRecords,
  quotations,
  orders,
  customerEmail,
}: {
  libraryRecords: CustomerProductRecord[];
  quotations: SalesQuotation[];
  orders: Order[];
  customerEmail: string;
}): ProductLibraryAsset[] => {
  if (!customerEmail) return [];

  const registry = new Map<string, ProductAccumulator>();
  const customerQuotations = quotations
    .filter((quotation) => isCustomerQuotation(quotation, customerEmail))
    .sort((a, b) =>
      String(b.updatedAt || b.createdAt || '').localeCompare(String(a.updatedAt || a.createdAt || '')),
    );
  const customerOrders = orders
    .filter((order) => isCustomerOrder(order, customerEmail))
    .sort((a, b) =>
      String(b.updatedAt || b.createdAt || b.date || '').localeCompare(
        String(a.updatedAt || a.createdAt || a.date || ''),
      ),
    );

  libraryRecords.forEach((record) => {
    if (normalizeLower(record.customerEmail) !== customerEmail) return;

    const key = buildProductMatchKey({
      supplierModelNo: record.supplierModelNo,
      customerModelNo: record.customerModelNo,
      productName: record.productName,
      description: record.description,
    });

    mergeAccumulator(registry, key, {
      id: record.id,
      recordType: record.recordType || 'product',
      isProjectBased: record.recordType === 'project' || Boolean(record.isProjectBased),
      projectCode: record.projectCode,
      projectName: record.projectName,
      currentRevisionId: record.currentRevisionId,
      currentRevisionCode: record.projectRevisions?.find((item) => item.revisionId === record.currentRevisionId)?.revisionCode || null,
      currentRevisionStatus: record.projectRevisions?.find((item) => item.revisionId === record.currentRevisionId)?.revisionStatus || null,
      finalRevisionId: record.finalRevisionId,
      finalRevisionCode: record.projectRevisions?.find((item) => item.revisionId === record.finalRevisionId)?.revisionCode || null,
      productName: record.productName,
      description: record.description,
      itemType: record.itemType,
      customerModelNo: record.customerModelNo,
      supplierModelNo: record.supplierModelNo,
      supplierProductId: record.supplierProductId,
      imageUrl: record.imageUrl,
      attachmentCount: record.attachmentCount,
      unit: record.unit,
      syncStatus: record.syncStatus,
      syncMessage: record.syncMessage,
      lastInquiryId: record.lastInquiryId,
      lastInquiryNumber: record.lastInquiryNumber,
      lastQuoteId: record.lastQuoteId,
      lastOrderId: record.lastOrderId,
      lastOrderNumber: record.lastOrderNumber,
      lastQuotationNumber: record.lastQuoteNumber,
      usageCount: record.usageCount,
      updatedAt: record.updatedAt,
      manualRecord: record,
      sourceTag: 'manual',
      sourceType: record.legacySourceType || 'customer_owned',
      assetSourceType: record.sourceType || 'customer_created',
      productStatus: record.productStatus || 'active',
      packageVersion: record.packageVersion || 1,
      masterRef: record.masterRef,
      mappingRef: record.mappingRef,
      attachmentSummarySnapshot: record.attachmentSummarySnapshot,
      fileManifestSnapshot: record.fileManifestSnapshot,
    });
  });

  customerQuotations.forEach((quotation) => {
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
        unit: normalizeText(item?.unit) || 'pcs',
        quotePrice: Number(item?.salesPrice || 0),
        quoteDate: quotation.updatedAt || quotation.createdAt,
        lastQuoteId: quotation.id,
        lastQuotationNumber: quotation.qtNumber,
        updatedAt: quotation.updatedAt || quotation.createdAt,
        sourceTag: 'quoted',
      });
    });
  });

  customerOrders.forEach((order) => {
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
        unit: 'pcs',
        orderPrice: Number(product?.unitPrice || 0),
        orderDate: order.updatedAt || order.createdAt || order.date,
        orderQty: Number(product?.quantity || 0),
        lastOrderId: order.id,
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
      return {
        id: item.id,
        matchKey: item.matchKey,
        recordType: item.recordType,
        isProjectBased: item.recordType === 'project' || item.isProjectBased,
        projectCode: item.projectCode,
        projectName: item.projectName,
        currentRevisionId: item.currentRevisionId,
        currentRevisionCode: item.currentRevisionCode,
        currentRevisionStatus: item.currentRevisionStatus,
        finalRevisionId: item.finalRevisionId,
        finalRevisionCode: item.finalRevisionCode,
        productName: item.productName || item.customerModelNo || item.supplierModelNo || 'Unnamed Product',
        description: item.description,
        itemType: item.itemType,
        customerModelNo: item.customerModelNo,
        supplierModelNo: item.supplierModelNo,
        supplierProductId: item.supplierProductId,
        imageUrl: item.imageUrl,
        attachmentCount: item.attachmentCount,
        sourceType: resolveDisplaySourceType(item),
        assetSourceType: item.manualRecord?.sourceType || item.assetSourceType,
        productStatus: item.manualRecord?.productStatus || 'active',
        packageVersion: item.manualRecord?.packageVersion || 1,
        packageStatus:
          item.attachmentCount > 0
            ? 'technical_package_ready'
            : item.description
              ? 'basic_package'
              : 'no_package',
        masterRef: item.manualRecord?.masterRef || item.masterRef || null,
        mappingRef: item.manualRecord?.mappingRef || item.mappingRef || null,
        attachmentSummarySnapshot:
          item.manualRecord?.attachmentSummarySnapshot || item.attachmentSummarySnapshot,
        fileManifestSnapshot: item.manualRecord?.fileManifestSnapshot || item.fileManifestSnapshot || [],
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
        lastInquiryId: item.lastInquiryId,
        lastInquiryNumber: item.lastInquiryNumber,
        lastQuoteId: item.lastQuoteId,
        lastOrderId: item.lastOrderId,
        lastOrderNumber: item.lastOrderNumber,
        lastQuotationNumber: item.lastQuotationNumber,
        usageCount: Math.max(
          Number(item.manualRecord?.usageCount || item.usageCount || 0) || 0,
          quoteStats.count + orderPriceStats.count + (item.lastInquiryNumber ? 1 : 0),
        ),
        updatedAt: item.updatedAt,
      };
    })
    .sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')));
};
