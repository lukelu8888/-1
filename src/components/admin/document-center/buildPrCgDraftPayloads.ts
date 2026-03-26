import type { PurchaseOrderData } from '../../documents/templates/PurchaseOrderDocument';
import type { QuoteRequirementDocumentData } from '../../documents/templates/QuoteRequirementDocument';
import { BASELINE_CG_TEMPLATE_SEED } from './templateCenterSeeds';

export type AllocationFields = {
  supplierName: string;
  allocatedQty: string;
  targetCgNo: string;
  allocationNotes: string;
};

export type SupplierAllocationSummary = {
  supplierName: string;
  items: Array<{
    productLabel: string;
    allocatedQty: string;
    targetCgNo: string;
    allocationNotes: string;
    product: QuoteRequirementDocumentData['products'][number];
  }>;
};

export type AllocationValidationResult = {
  totalRequiredQty: number;
  allocatedQty: number;
  remainingQty: number;
  status: 'complete' | 'partial' | 'over';
};

export type PrCgDraftPlan = {
  supplierName: string;
  targetCgNo: string;
  totalItems: number;
  totalAllocatedQty: number;
  productLabels: string[];
  notes: string[];
  requiredDeliveryDate: string;
  buyerName: string;
  sourceSalesContractNo: string;
  currencyHint: string;
  cgDraftData: PurchaseOrderData;
  cgBusinessDraft: PrCgDraftBusinessPayload;
};

export type PrCgDraftBusinessPayload = {
  poNumber: string;
  requirementNo: string;
  sourceRef: string;
  salesContractNumber: string;
  parentRequestPoNumber: string;
  supplierName: string;
  supplierCode: string;
  region: string;
  items: Array<{
    id: string;
    productName: string;
    modelNo: string;
    specification?: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    currency: string;
    subtotal: number;
    remarks?: string;
  }>;
  totalAmount: number;
  currency: string;
  paymentTerms: string;
  deliveryTerms: string;
  orderDate: string;
  expectedDate: string;
  status: 'pending';
  paymentStatus: 'unpaid';
  procurementRequestStatus: 'draft_allocated';
  createdBy: string;
  createdDate: string;
};

export const parseAllocationFields = (raw: string | undefined): AllocationFields => {
  const text = String(raw || '');
  const supplierName = (text.match(/拟分配供应商：([^/\n]+)/)?.[1] || '').trim();
  const targetCgNo = (text.match(/目标CG：([^\n/]+)/)?.[1] || '').trim();
  const allocatedQty = (text.match(/分配数量：([^\n/]+)/)?.[1] || '').trim();
  const allocationNotes = (text.match(/分配说明：([^\n]+)/)?.[1] || '').trim();

  return {
    supplierName,
    targetCgNo,
    allocatedQty,
    allocationNotes,
  };
};

export const buildAllocationRemarks = (fields: AllocationFields): string => (
  [
    fields.supplierName ? `拟分配供应商：${fields.supplierName}` : '',
    fields.allocatedQty ? `分配数量：${fields.allocatedQty}` : '',
    fields.targetCgNo ? `目标CG：${fields.targetCgNo}` : '',
    fields.allocationNotes ? `分配说明：${fields.allocationNotes}` : '',
  ]
    .filter(Boolean)
    .join(' / ')
);

export const buildTargetCgPlaceholder = (
  requirementNo: string,
  supplierIndex: number,
) => {
  const normalized = String(requirementNo || 'PR')
    .trim()
    .replace(/^PR-/i, '')
    .replace(/\s+/g, '')
    .replace(/[^A-Za-z0-9-]/g, '');

  const suffix = String(supplierIndex + 1).padStart(2, '0');
  return `CG-${normalized || 'AUTO'}-${suffix}`;
};

export const parseNumericAllocationQty = (value: string, fallback: number): number => {
  const normalized = String(value || '').replace(/,/g, '').trim();
  if (!normalized) return fallback;
  const numeric = Number(normalized);
  return Number.isFinite(numeric) ? numeric : fallback;
};

export const validateProductAllocation = (
  product: QuoteRequirementDocumentData['products'][number],
): AllocationValidationResult => {
  const allocation = parseAllocationFields(product.remarks);
  const totalRequiredQty = Number(product.quantity || 0);
  const allocatedQty = parseNumericAllocationQty(allocation.allocatedQty, totalRequiredQty);
  const remainingQty = totalRequiredQty - allocatedQty;

  return {
    totalRequiredQty,
    allocatedQty,
    remainingQty,
    status:
      remainingQty === 0
        ? 'complete'
        : remainingQty > 0
          ? 'partial'
          : 'over',
  };
};

export const buildSupplierAllocationSummaries = (
  products: QuoteRequirementDocumentData['products'],
): SupplierAllocationSummary[] => {
  const grouped = new Map<string, SupplierAllocationSummary>();

  products.forEach((product, index) => {
    const allocation = parseAllocationFields(product.remarks);
    const supplierName = allocation.supplierName.trim();
    if (!supplierName) return;

    const current = grouped.get(supplierName) || {
      supplierName,
      items: [],
    };

    current.items.push({
      productLabel: product.productName || product.modelNo || `产品${index + 1}`,
      allocatedQty: allocation.allocatedQty || String(product.quantity || ''),
      targetCgNo: allocation.targetCgNo,
      allocationNotes: allocation.allocationNotes,
      product,
    });

    grouped.set(supplierName, current);
  });

  return Array.from(grouped.values());
};

const cloneBaselineCgSeed = (): PurchaseOrderData => ({
  ...BASELINE_CG_TEMPLATE_SEED,
  buyer: {
    ...BASELINE_CG_TEMPLATE_SEED.buyer,
  },
  supplier: {
    ...BASELINE_CG_TEMPLATE_SEED.supplier,
    bankInfo: BASELINE_CG_TEMPLATE_SEED.supplier.bankInfo
      ? { ...BASELINE_CG_TEMPLATE_SEED.supplier.bankInfo }
      : undefined,
  },
  products: BASELINE_CG_TEMPLATE_SEED.products.map((product) => ({ ...product })),
  terms: {
    ...BASELINE_CG_TEMPLATE_SEED.terms,
  },
  templateSettings: BASELINE_CG_TEMPLATE_SEED.templateSettings
    ? {
        ...BASELINE_CG_TEMPLATE_SEED.templateSettings,
        productTableColumns: BASELINE_CG_TEMPLATE_SEED.templateSettings.productTableColumns?.map((column) => ({
          ...column,
        })),
      }
    : undefined,
});

const resolveCurrencyHint = (
  customerRegion: string,
  products: QuoteRequirementDocumentData['products'],
) => {
  const productCurrencies = Array.from(
    new Set(
      products
        .map((product) => String(product.currency || '').trim().toUpperCase())
        .filter(Boolean),
    ),
  );

  if (productCurrencies.length === 1) return productCurrencies[0];
  if (customerRegion.includes('North America')) return 'USD';
  if (productCurrencies.length > 1) return productCurrencies.join('/');
  return '待确认';
};

export const buildPrCgDraftPlans = (
  prTemplateData: QuoteRequirementDocumentData,
  summaries: SupplierAllocationSummary[],
): PrCgDraftPlan[] => {
  const currencyHint = resolveCurrencyHint(prTemplateData.customer.region, prTemplateData.products);

  return summaries.map((summary, index) => {
    const targetCgNo =
      summary.items.find((item) => item.targetCgNo.trim())?.targetCgNo.trim() ||
      buildTargetCgPlaceholder(prTemplateData.requirementNo, index);

    const cgDraftProducts = summary.items.map((item, itemIndex) => {
      const allocatedQty = parseNumericAllocationQty(item.allocatedQty, Number(item.product.quantity || 0));
      const unitPrice = Number(item.product.unitPrice || 0);
      const amount = Number((allocatedQty * unitPrice).toFixed(2));

      return {
        no: itemIndex + 1,
        modelNo: item.product.modelNo || item.product.productName || `ITEM-${itemIndex + 1}`,
        imageUrl: item.product.imageUrl,
        itemCode: item.product.modelNo || '',
        description: item.product.productName || item.product.modelNo || `产品${itemIndex + 1}`,
        specification: item.product.specification || '',
        quantity: allocatedQty,
        unit: item.product.unit || 'pcs',
        unitPrice,
        currency: String(item.product.currency || currencyHint || 'USD').trim().toUpperCase() || 'USD',
        amount,
        deliveryDate: prTemplateData.requiredDeliveryDate || '',
        remarks: item.allocationNotes || '',
      };
    });

    const totalAmount = Number(
      cgDraftProducts.reduce((sum, product) => sum + Number(product.amount || 0), 0).toFixed(2),
    );
    const orderDate = prTemplateData.requirementDate || BASELINE_CG_TEMPLATE_SEED.poDate;
    const expectedDate =
      prTemplateData.requiredDeliveryDate || BASELINE_CG_TEMPLATE_SEED.requiredDeliveryDate;

    const cgDraftData: PurchaseOrderData = {
      ...cloneBaselineCgSeed(),
      poNo: targetCgNo,
      poDate: orderDate,
      requiredDeliveryDate: expectedDate,
      buyer: {
        ...cloneBaselineCgSeed().buyer,
        contactPerson: prTemplateData.createdBy || BASELINE_CG_TEMPLATE_SEED.buyer.contactPerson,
      },
      supplier: {
        ...cloneBaselineCgSeed().supplier,
        companyName: summary.supplierName || '待确认供应商',
        contactPerson: '待确认',
        email: '',
        tel: '',
        address: '',
      },
      products: cgDraftProducts,
      terms: {
        ...cloneBaselineCgSeed().terms,
        totalAmount,
        currency: currencyHint === '待确认' ? 'USD' : currencyHint,
      },
    };
    const cgBusinessDraft: PrCgDraftBusinessPayload = {
      poNumber: targetCgNo,
      requirementNo: prTemplateData.requirementNo,
      sourceRef: prTemplateData.sourceInquiryNo,
      salesContractNumber: prTemplateData.sourceInquiryNo,
      parentRequestPoNumber: prTemplateData.requirementNo,
      supplierName: summary.supplierName || '待确认供应商',
      supplierCode: 'TBD',
      region: prTemplateData.customer.region || '',
      items: cgDraftProducts.map((product, itemIndex) => ({
        id: `${targetCgNo}-${itemIndex + 1}`,
        productName: product.description,
        modelNo: product.modelNo || product.itemCode || '',
        specification: product.specification,
        quantity: Number(product.quantity || 0),
        unit: product.unit || 'pcs',
        unitPrice: Number(product.unitPrice || 0),
        currency: product.currency || 'USD',
        subtotal: Number(product.amount || 0),
        remarks: product.remarks,
      })),
      totalAmount,
      currency: cgDraftData.terms.currency,
      paymentTerms: cgDraftData.terms.paymentTerms,
      deliveryTerms: cgDraftData.terms.deliveryTerms,
      orderDate,
      expectedDate,
      status: 'pending',
      paymentStatus: 'unpaid',
      procurementRequestStatus: 'draft_allocated',
      createdBy: prTemplateData.createdBy || '采购部',
      createdDate: new Date().toISOString(),
    };

    return {
      supplierName: summary.supplierName,
      targetCgNo,
      totalItems: summary.items.length,
      totalAllocatedQty: cgDraftProducts.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
      productLabels: summary.items.map((item) => item.productLabel),
      notes: summary.items
        .map((item) => item.allocationNotes.trim())
        .filter(Boolean),
      requiredDeliveryDate: prTemplateData.requiredDeliveryDate,
      buyerName: prTemplateData.createdBy || '采购部',
      sourceSalesContractNo: prTemplateData.sourceInquiryNo,
      currencyHint,
      cgDraftData,
      cgBusinessDraft,
    };
  });
};
