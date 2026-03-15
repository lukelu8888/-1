import type { DocumentConditionGroup, DocumentConditionItem } from '../types/documentConditions';
import { getFormalBusinessModelNo } from './productModelDisplay';

export interface DownstreamVisibilityRules {
  maskCustomerContactToProcurement: boolean;
  maskCustomerContactToSupplier: boolean;
  maskCustomerPublicPrice: boolean;
  maskInternalTargetCostToSupplier: boolean;
}

export interface CustomerRequirementsSnapshot {
  packagingRequirements?: string;
  otherRequirements?: string;
  customerRemarks?: string;
  productRequirements?: string[];
}

export interface CommercialTermsSnapshot {
  expectedQuoteDate?: string;
  deliveryDate?: string;
  tradeTerms?: string;
  paymentTerms?: string;
  targetCostRange?: string;
  qualityRequirements?: string;
  packagingRequirements?: string;
  remarks?: string;
}

export interface ProcurementRequestContextPayload {
  customerRequirements?: CustomerRequirementsSnapshot | null;
  commercialTerms?: CommercialTermsSnapshot | null;
  downstreamVisibility?: DownstreamVisibilityRules | null;
}

export interface TradingRequirementSnapshot {
  tradeTerms?: string;
  deliveryTime?: string;
  portOfDestination?: string;
  paymentTerms?: string;
  packingRequirements?: string;
  certifications?: string[] | string;
  otherRequirements?: string;
}

export const DEFAULT_DOWNSTREAM_VISIBILITY: DownstreamVisibilityRules = {
  maskCustomerContactToProcurement: true,
  maskCustomerContactToSupplier: true,
  maskCustomerPublicPrice: true,
  maskInternalTargetCostToSupplier: true,
};

const asTrimmedText = (value: unknown): string | undefined => {
  if (value == null) return undefined;
  const text = String(value).trim();
  return text || undefined;
};

const normalizeDocMarker = (value: unknown): string | undefined => {
  const text = asTrimmedText(value);
  if (!text) return undefined;
  return text.toUpperCase().replace(/\s+/g, '');
};

export const joinNonEmptyText = (...values: unknown[]): string =>
  values
    .map((value) => asTrimmedText(value))
    .filter(Boolean)
    .join('；');

const TRADING_REQUIREMENT_FIELD_META: Array<{
  key: keyof TradingRequirementSnapshot;
  originalLabel: string;
  chineseLabel: string;
}> = [
  { key: 'tradeTerms', originalLabel: 'Price Terms', chineseLabel: '价格条款' },
  { key: 'deliveryTime', originalLabel: 'Delivery Time', chineseLabel: '交期要求' },
  { key: 'portOfDestination', originalLabel: 'Destination Port', chineseLabel: '目的港/交付地点' },
  { key: 'paymentTerms', originalLabel: 'Payment Terms', chineseLabel: '付款条款' },
  { key: 'packingRequirements', originalLabel: 'Packing Requirements', chineseLabel: '包装要求' },
  { key: 'certifications', originalLabel: 'Required Certifications', chineseLabel: '认证要求' },
  { key: 'otherRequirements', originalLabel: 'Other Requirements', chineseLabel: '其他要求' },
];

const translateTradingRequirementValue = (
  field: keyof TradingRequirementSnapshot,
  raw: string,
): string => {
  const text = raw.trim();
  if (!text) return '';

  if (field === 'certifications') {
    const certifications = text
      .split(/[,\n/]+/)
      .map((item) => item.trim())
      .filter(Boolean);
    if (certifications.length > 0) {
      return `${certifications.join('、')} 认证`;
    }
  }

  let translated = text;
  const replacements: Array<[RegExp, string]> = [
    [/\bwithin\s+(\d+)\s+days\s+after\s+order\s+confirmation\b/gi, '订单确认后$1天内'],
    [/\bneed\s+logo\s+printing\b/gi, '需要印刷Logo'],
    [/\benglish\s+manual\b/gi, '英文说明书'],
    [/\bsample\s+approval\b/gi, '样品确认'],
    [/\bbefore\s+mass\s+production\b/gi, '大货生产前'],
    [/\bbefore\s+shipment\b/gi, '出货前'],
    [/\bexport\s+cartons\b/gi, '出口纸箱'],
    [/\bwith\s+pallet\b/gi, '加托盘包装'],
    [/\beach\s+carton\s+with\s+sku\s+label\b/gi, '每箱贴SKU标签'],
    [/\bdoor\s+delivery\s+to\b/gi, '送货至'],
    [/\border\s+confirmation\b/gi, '订单确认'],
    [/\bdeposit\b/gi, '预付款'],
    [/\blos\s+angeles\b/gi, '洛杉矶'],
    [/\bjebel\s+ali\b/gi, '杰贝阿里'],
    [/\bhouston\b/gi, '休斯敦'],
    [/\bxiamen\b/gi, '厦门'],
  ];

  replacements.forEach(([pattern, replacement]) => {
    translated = translated.replace(pattern, replacement);
  });

  return translated;
};

export const buildBilingualTradingRequirementsText = (
  requirements?: TradingRequirementSnapshot | null,
): string => {
  if (!requirements) return '';

  const lines = TRADING_REQUIREMENT_FIELD_META.flatMap((field, index) => {
    const rawValue = requirements[field.key];
    const normalizedValue = Array.isArray(rawValue)
      ? rawValue.map((item) => String(item || '').trim()).filter(Boolean).join(', ')
      : String(rawValue || '').trim();

    if (!normalizedValue) return [];

    const translatedValue = translateTradingRequirementValue(field.key, normalizedValue);

    return [
      `${index + 1}. ${field.originalLabel} / ${field.chineseLabel}`,
      `Original: ${normalizedValue}`,
      `中文: ${translatedValue || normalizedValue}`,
    ];
  });

  return lines.join('\n\n');
};

export const buildProcurementRequestNotes = (terms: CommercialTermsSnapshot): string =>
  [
    terms.expectedQuoteDate ? `期望报价日: ${terms.expectedQuoteDate}` : '',
    terms.deliveryDate ? `期望交期: ${terms.deliveryDate}` : '',
    terms.paymentTerms ? `付款条款: ${terms.paymentTerms}` : '',
    terms.tradeTerms ? `贸易条款: ${terms.tradeTerms}` : '',
    terms.qualityRequirements ? `验货要求: ${terms.qualityRequirements}` : '',
    terms.targetCostRange ? `目标成本参考: ${terms.targetCostRange}` : '',
    terms.packagingRequirements ? `特殊包装: ${terms.packagingRequirements}` : '',
    terms.remarks ? `业务补充: ${terms.remarks}` : '',
  ]
    .filter(Boolean)
    .join(' | ');

export const parseProcurementRequestNotes = (raw: unknown): Partial<CommercialTermsSnapshot> => {
  const text = asTrimmedText(raw);
  if (!text) return {};

  const result: Partial<CommercialTermsSnapshot> = {};
  const segments = text
    .split('|')
    .map((segment) => segment.trim())
    .filter(Boolean);

  for (const segment of segments) {
    const normalized = segment.replace(/^[【\[]?/, '').replace(/[】\]]?$/, '');

    if (normalized.startsWith('期望报价日:')) {
      result.expectedQuoteDate = normalized.replace('期望报价日:', '').trim();
    } else if (normalized.startsWith('期望交期:')) {
      result.deliveryDate = normalized.replace('期望交期:', '').trim();
    } else if (normalized.startsWith('付款条款:')) {
      result.paymentTerms = normalized.replace('付款条款:', '').trim();
    } else if (normalized.startsWith('贸易条款:')) {
      result.tradeTerms = normalized.replace('贸易条款:', '').trim();
    } else if (normalized.startsWith('验货要求:')) {
      result.qualityRequirements = normalized.replace('验货要求:', '').trim();
    } else if (normalized.startsWith('目标成本参考:')) {
      result.targetCostRange = normalized.replace('目标成本参考:', '').trim();
    } else if (normalized.startsWith('特殊包装:')) {
      result.packagingRequirements = normalized.replace('特殊包装:', '').trim();
    } else if (normalized.startsWith('包装要求:')) {
      result.packagingRequirements = normalized.replace('包装要求:', '').trim();
    } else if (normalized.startsWith('业务补充:')) {
      result.remarks = normalized.replace('业务补充:', '').trim();
    }
  }

  return result;
};

const parseProductRequirementLine = (
  raw: unknown,
): Partial<Record<'productName' | 'modelNo' | 'specification', string>> => {
  const text = asTrimmedText(raw);
  if (!text) return {};

  const productNameMatch = text.match(/^(.*?)(?:[;；]\s*型号[:：]|$)/);
  const modelNoMatch = text.match(/型号[:：]\s*([^;；]+?)(?:[;；]|$)/);
  const specificationMatch = text.match(/规格[:：]\s*([^;；]+?)(?:[;；]|$)/);

  return {
    productName: productNameMatch?.[1]?.trim() || undefined,
    modelNo: modelNoMatch?.[1]?.trim() || undefined,
    specification: specificationMatch?.[1]?.trim() || undefined,
  };
};

export const findRelatedInquiryForProcurementDoc = (source: any, inquiries: any[] = []) => {
  if (!source || !Array.isArray(inquiries) || inquiries.length === 0) return undefined;

  const markers = new Set(
    [
      source?.sourceInquiryId,
      source?.sourceInquiryNumber,
      source?.sourceRef,
      source?.inquiryNumber,
      source?.id,
    ]
      .map((value) => normalizeDocMarker(value))
      .filter(Boolean) as string[],
  );

  if (markers.size === 0) return undefined;

  return inquiries.find((inquiry) =>
    [
      inquiry?.id,
      inquiry?.inquiryNumber,
      inquiry?.sourceInquiryId,
      inquiry?.sourceInquiryNumber,
    ]
      .map((value) => normalizeDocMarker(value))
      .filter(Boolean)
      .some((marker) => markers.has(marker)),
  );
};

const isAggregatedFlowText = (raw: unknown): boolean => {
  const text = asTrimmedText(raw);
  if (!text) return false;
  const markers = ['期望报价日', '期望交期', '付款条款', '贸易条款', '验货要求', '特殊包装'];
  const hitCount = markers.reduce((count, marker) => count + (text.includes(marker) ? 1 : 0), 0);
  return hitCount >= 2 || (text.includes('|') && hitCount >= 1);
};

export const buildCustomerRequirementsSnapshot = (
  inquiry: any,
  editableProducts: any[] = [],
): CustomerRequirementsSnapshot | null => {
  const productRequirements = editableProducts
    .map((product) =>
      joinNonEmptyText(
        product?.productName || product?.name,
        getFormalBusinessModelNo(product) ? `型号 ${getFormalBusinessModelNo(product)}` : '',
        product?.specification ? `规格 ${product.specification}` : '',
        product?.remarks ? `客户备注 ${product.remarks}` : '',
      ),
    )
    .filter(Boolean);

  const snapshot: CustomerRequirementsSnapshot = {
    packagingRequirements:
      asTrimmedText(inquiry?.requirements?.packagingRequirements) ||
      asTrimmedText(inquiry?.requirements?.packaging) ||
      asTrimmedText(inquiry?.shippingInfo?.packagingRequirements) ||
      asTrimmedText(inquiry?.packagingRequirements),
    otherRequirements:
      asTrimmedText(inquiry?.requirements?.otherRequirements) ||
      asTrimmedText(inquiry?.requirements?.specialRequirements) ||
      asTrimmedText(inquiry?.otherRequirements),
    customerRemarks:
      asTrimmedText(inquiry?.requirements?.remarks) ||
      asTrimmedText(inquiry?.buyerMessage) ||
      asTrimmedText(inquiry?.remarks),
    productRequirements: productRequirements.length > 0 ? productRequirements : undefined,
  };

  if (
    !snapshot.packagingRequirements &&
    !snapshot.otherRequirements &&
    !snapshot.customerRemarks &&
    !snapshot.productRequirements?.length
  ) {
    return null;
  }

  return snapshot;
};

export const buildCommercialTermsSnapshotFromInquiry = (
  inquiry: any,
): CommercialTermsSnapshot | null => {
  if (!inquiry || typeof inquiry !== 'object') return null;

  const shippingInfo = inquiry.shippingInfo && typeof inquiry.shippingInfo === 'object' ? inquiry.shippingInfo : {};
  const requirements = inquiry.requirements && typeof inquiry.requirements === 'object' ? inquiry.requirements : {};

  const qualityRequirements = joinNonEmptyText(
    requirements.certifications,
    requirements.qualityStandard,
    requirements.inspectionRequirement,
    requirements.otherRequirements,
  );

  const snapshot: CommercialTermsSnapshot = {
    expectedQuoteDate:
      asTrimmedText(inquiry.expectedQuoteDate) ||
      asTrimmedText(shippingInfo.expectedQuoteDate) ||
      asTrimmedText(requirements.expectedQuoteDate),
    deliveryDate:
      asTrimmedText(inquiry.deliveryDate) ||
      asTrimmedText(shippingInfo.deliveryDate) ||
      asTrimmedText(requirements.deliveryDate) ||
      asTrimmedText(shippingInfo.deliveryTime) ||
      asTrimmedText(requirements.deliveryTime),
    tradeTerms:
      asTrimmedText(shippingInfo.tradeTerms) ||
      asTrimmedText(requirements.tradeTerms) ||
      asTrimmedText(inquiry.tradeTerms),
    paymentTerms:
      asTrimmedText(shippingInfo.paymentTerms) ||
      asTrimmedText(requirements.paymentTerms) ||
      asTrimmedText(inquiry.paymentTerms),
    targetCostRange:
      asTrimmedText(inquiry.targetCostRange) ||
      asTrimmedText(requirements.targetCostRange),
    qualityRequirements: qualityRequirements || undefined,
    packagingRequirements:
      asTrimmedText(shippingInfo.packagingRequirements) ||
      asTrimmedText(shippingInfo.packingRequirements) ||
      asTrimmedText(requirements.packagingRequirements) ||
      asTrimmedText(requirements.packingRequirements) ||
      asTrimmedText(inquiry.packagingRequirements),
    remarks:
      asTrimmedText(inquiry.message) ||
      asTrimmedText(inquiry.remarks) ||
      asTrimmedText(inquiry.notes),
  };

  if (
    !snapshot.expectedQuoteDate &&
    !snapshot.deliveryDate &&
    !snapshot.tradeTerms &&
    !snapshot.paymentTerms &&
    !snapshot.targetCostRange &&
    !snapshot.qualityRequirements &&
    !snapshot.packagingRequirements &&
    !snapshot.remarks
  ) {
    return null;
  }

  return snapshot;
};

export const hydrateProcurementRequirementWithInquiry = (requirement: any, inquiry: any) => {
  if (!requirement) return requirement;

  const requestContext = extractProcurementRequestContext(requirement);
  const inquiryProducts = Array.isArray(inquiry?.products) ? inquiry.products : [];
  const fallbackCustomerRequirements = buildCustomerRequirementsSnapshot(
    inquiry,
    Array.isArray(requirement.items) ? requirement.items : Array.isArray(inquiry.products) ? inquiry.products : [],
  );
  const mergedProductRequirementLines =
    requestContext.customerRequirements?.productRequirements ||
    requirement.customerRequirements?.productRequirements ||
    fallbackCustomerRequirements?.productRequirements ||
    [];
  const enrichedItems = Array.isArray(requirement.items)
    ? requirement.items.map((item: any, index: number) => {
        const parsedRequirementLine = parseProductRequirementLine(mergedProductRequirementLines[index]);
        const matchedInquiryProduct = inquiryProducts.find((product: any) => {
          const sameId = item?.id && product?.id && String(item.id) === String(product.id);
          const itemFormalModelNo = getFormalBusinessModelNo(item) || parsedRequirementLine.modelNo || '';
          const productFormalModelNo = getFormalBusinessModelNo(product);
          const sameModel =
            itemFormalModelNo &&
            productFormalModelNo &&
            String(itemFormalModelNo).trim().toLowerCase() ===
              String(productFormalModelNo).trim().toLowerCase();
          const sameName =
            (item?.productName || parsedRequirementLine.productName) &&
            (product?.productName || product?.name) &&
            String(item.productName || parsedRequirementLine.productName).trim().toLowerCase() ===
              String(product.productName || product.name).trim().toLowerCase();
          const sameSpecification =
            (item?.specification || parsedRequirementLine.specification) &&
            product?.specification &&
            String(item.specification || parsedRequirementLine.specification).trim().toLowerCase() ===
              String(product.specification).trim().toLowerCase();
          return sameId || sameModel || sameName || sameSpecification;
        }) || inquiryProducts[index] || null;

        return {
          ...(matchedInquiryProduct || {}),
          ...item,
          productName:
            item?.productName ||
            matchedInquiryProduct?.productName ||
            matchedInquiryProduct?.name ||
            parsedRequirementLine.productName ||
            '',
          modelNo:
            getFormalBusinessModelNo(item) ||
            getFormalBusinessModelNo(matchedInquiryProduct) ||
            matchedInquiryProduct?.model ||
            (item as any)?.sku ||
            parsedRequirementLine.modelNo ||
            '',
          specification:
            item?.specification ||
            matchedInquiryProduct?.specification ||
            (item as any)?.description ||
            (item as any)?.spec ||
            parsedRequirementLine.specification ||
            '',
          unit: item?.unit || matchedInquiryProduct?.unit || (item as any)?.uom || 'pcs',
          imageUrl:
            item?.imageUrl ||
            (item as any)?.imageUrl ||
            (item as any)?.image ||
            (item as any)?.productImage ||
            matchedInquiryProduct?.imageUrl ||
            matchedInquiryProduct?.image ||
            matchedInquiryProduct?.productImage ||
            undefined,
          targetPrice:
            item?.targetPrice ??
            matchedInquiryProduct?.targetPrice ??
            matchedInquiryProduct?.unitPrice ??
            matchedInquiryProduct?.price ??
            undefined,
          targetCurrency:
            item?.targetCurrency ||
            matchedInquiryProduct?.targetCurrency ||
            matchedInquiryProduct?.currency ||
            'USD',
          remarks: item?.remarks || matchedInquiryProduct?.remarks || matchedInquiryProduct?.notes || '',
        };
      })
    : requirement.items;
  const fallbackCommercialTerms = buildCommercialTermsSnapshotFromInquiry(inquiry);

  const customerRequirements = {
    ...(fallbackCustomerRequirements || {}),
    ...(requestContext.customerRequirements || {}),
    ...(requirement.customerRequirements || {}),
  };
  const commercialTerms = {
    ...(fallbackCommercialTerms || {}),
    ...(requestContext.commercialTerms || {}),
    ...(requirement.commercialTerms || {}),
    expectedQuoteDate:
      requirement.expectedQuoteDate ||
      requirement.commercialTerms?.expectedQuoteDate ||
      requestContext.commercialTerms?.expectedQuoteDate ||
      fallbackCommercialTerms?.expectedQuoteDate,
    deliveryDate:
      requirement.deliveryDate ||
      requirement.commercialTerms?.deliveryDate ||
      requestContext.commercialTerms?.deliveryDate ||
      fallbackCommercialTerms?.deliveryDate,
    tradeTerms:
      requirement.tradeTerms ||
      requirement.commercialTerms?.tradeTerms ||
      requestContext.commercialTerms?.tradeTerms ||
      fallbackCommercialTerms?.tradeTerms,
    paymentTerms:
      requirement.paymentTerms ||
      requirement.commercialTerms?.paymentTerms ||
      requestContext.commercialTerms?.paymentTerms ||
      fallbackCommercialTerms?.paymentTerms,
    targetCostRange:
      requirement.targetCostRange ||
      requirement.commercialTerms?.targetCostRange ||
      requestContext.commercialTerms?.targetCostRange ||
      fallbackCommercialTerms?.targetCostRange,
    qualityRequirements:
      requirement.qualityRequirements ||
      requirement.commercialTerms?.qualityRequirements ||
      requestContext.commercialTerms?.qualityRequirements ||
      fallbackCommercialTerms?.qualityRequirements,
    packagingRequirements:
      requirement.packagingRequirements ||
      requirement.commercialTerms?.packagingRequirements ||
      requestContext.commercialTerms?.packagingRequirements ||
      fallbackCommercialTerms?.packagingRequirements,
    remarks:
      requirement.remarks ||
      requirement.commercialTerms?.remarks ||
      requestContext.commercialTerms?.remarks ||
      fallbackCommercialTerms?.remarks,
  };

  return {
    ...requirement,
    items: enrichedItems,
    expectedQuoteDate: commercialTerms.expectedQuoteDate || requirement.expectedQuoteDate || null,
    deliveryDate: commercialTerms.deliveryDate || requirement.deliveryDate || null,
    tradeTerms: commercialTerms.tradeTerms || requirement.tradeTerms || null,
    paymentTerms: commercialTerms.paymentTerms || requirement.paymentTerms || null,
    targetCostRange: commercialTerms.targetCostRange || requirement.targetCostRange || null,
    qualityRequirements: commercialTerms.qualityRequirements || requirement.qualityRequirements || null,
    packagingRequirements: commercialTerms.packagingRequirements || requirement.packagingRequirements || null,
    remarks: commercialTerms.remarks || requirement.remarks || null,
    customerRequirements,
    commercialTerms,
    downstreamVisibility: requirement.downstreamVisibility || DEFAULT_DOWNSTREAM_VISIBILITY,
  };
};

export const mergeCustomerInfoWithProcurementContext = (
  customerInfo: any,
  context: ProcurementRequestContextPayload,
) => {
  const base = customerInfo && typeof customerInfo === 'object' ? customerInfo : {};
  return {
    ...base,
    customerRequirements: context.customerRequirements || null,
    commercialTerms: context.commercialTerms || null,
    downstreamVisibility: context.downstreamVisibility || DEFAULT_DOWNSTREAM_VISIBILITY,
  };
};

const buildFallbackProductRequirements = (source: any): string[] | undefined => {
  const items = Array.isArray(source?.items)
    ? source.items
    : Array.isArray(source?.products)
      ? source.products
      : [];

  const productRequirements = items
    .map((item: any) =>
      joinNonEmptyText(
        item?.productName || item?.description || item?.name,
        getFormalBusinessModelNo(item) ? `型号 ${getFormalBusinessModelNo(item)}` : '',
        item?.specification ? `规格 ${item.specification}` : '',
        item?.remarks ? `备注 ${item.remarks}` : '',
      ),
    )
    .filter(Boolean);

  return productRequirements.length > 0 ? productRequirements : undefined;
};

const normalizeCustomerRequirements = (source: any, customerInfo: any): CustomerRequirementsSnapshot | null => {
  const explicit =
    customerInfo?.customerRequirements && typeof customerInfo.customerRequirements === 'object'
      ? customerInfo.customerRequirements
      : {};

  const merged: CustomerRequirementsSnapshot = {
    packagingRequirements:
      asTrimmedText(explicit.packagingRequirements) ||
      asTrimmedText(source?.customerRequirements?.packagingRequirements) ||
      asTrimmedText(source?.packagingRequirements),
    otherRequirements:
      asTrimmedText(explicit.otherRequirements) ||
      asTrimmedText(source?.customerRequirements?.otherRequirements) ||
      asTrimmedText(source?.otherRequirements) ||
      asTrimmedText(source?.specialRequirements),
    customerRemarks:
      asTrimmedText(explicit.customerRemarks) ||
      asTrimmedText(source?.customerRequirements?.customerRemarks) ||
      asTrimmedText(source?.customerRemarks) ||
      asTrimmedText(source?.buyerMessage),
    productRequirements:
      Array.isArray(explicit.productRequirements) && explicit.productRequirements.length > 0
        ? explicit.productRequirements
        : Array.isArray(source?.customerRequirements?.productRequirements) &&
            source.customerRequirements.productRequirements.length > 0
          ? source.customerRequirements.productRequirements
          : buildFallbackProductRequirements(source),
  };

  if (
    !merged.packagingRequirements &&
    !merged.otherRequirements &&
    !merged.customerRemarks &&
    !merged.productRequirements?.length
  ) {
    return null;
  }

  return merged;
};

const normalizeCommercialTerms = (source: any, customerInfo: any): CommercialTermsSnapshot | null => {
  const explicit =
    customerInfo?.commercialTerms && typeof customerInfo.commercialTerms === 'object'
      ? customerInfo.commercialTerms
      : {};
  const notesFallback = {
    ...parseProcurementRequestNotes(source?.notes),
    ...parseProcurementRequestNotes(source?.specialRequirements),
  };

  const merged: CommercialTermsSnapshot = {
    expectedQuoteDate:
      asTrimmedText(explicit.expectedQuoteDate) ||
      asTrimmedText(source?.commercialTerms?.expectedQuoteDate) ||
      asTrimmedText(notesFallback.expectedQuoteDate) ||
      asTrimmedText(source?.expectedQuoteDate) ||
      asTrimmedText(source?.requiredResponseDate),
    deliveryDate:
      asTrimmedText(explicit.deliveryDate) ||
      asTrimmedText(source?.commercialTerms?.deliveryDate) ||
      asTrimmedText(notesFallback.deliveryDate) ||
      asTrimmedText(source?.deliveryDate) ||
      asTrimmedText(source?.requiredDeliveryDate),
    tradeTerms:
      asTrimmedText(explicit.tradeTerms) ||
      asTrimmedText(source?.commercialTerms?.tradeTerms) ||
      asTrimmedText(notesFallback.tradeTerms) ||
      asTrimmedText(source?.tradeTerms) ||
      asTrimmedText(source?.deliveryTerms),
    paymentTerms:
      asTrimmedText(explicit.paymentTerms) ||
      asTrimmedText(source?.commercialTerms?.paymentTerms) ||
      asTrimmedText(notesFallback.paymentTerms) ||
      asTrimmedText(source?.paymentTerms),
    targetCostRange:
      asTrimmedText(explicit.targetCostRange) ||
      asTrimmedText(source?.commercialTerms?.targetCostRange) ||
      asTrimmedText(notesFallback.targetCostRange) ||
      asTrimmedText(source?.targetCostRange),
    qualityRequirements:
      asTrimmedText(explicit.qualityRequirements) ||
      asTrimmedText(source?.commercialTerms?.qualityRequirements) ||
      asTrimmedText(notesFallback.qualityRequirements) ||
      asTrimmedText(source?.qualityRequirements),
    packagingRequirements:
      asTrimmedText(explicit.packagingRequirements) ||
      asTrimmedText(source?.commercialTerms?.packagingRequirements) ||
      asTrimmedText(notesFallback.packagingRequirements) ||
      asTrimmedText(source?.packagingRequirements),
    remarks:
      asTrimmedText(explicit.remarks) ||
      asTrimmedText(source?.commercialTerms?.remarks) ||
      asTrimmedText(notesFallback.remarks) ||
      asTrimmedText(source?.remarks) ||
      asTrimmedText(source?.notes) ||
      asTrimmedText(source?.salesDeptNotes),
  };

  if (
    !merged.expectedQuoteDate &&
    !merged.deliveryDate &&
    !merged.tradeTerms &&
    !merged.paymentTerms &&
    !merged.targetCostRange &&
    !merged.qualityRequirements &&
    !merged.packagingRequirements &&
    !merged.remarks
  ) {
    return null;
  }

  return merged;
};

export const extractProcurementRequestContext = (source: any): ProcurementRequestContextPayload => {
  const customerInfo =
    source?.customer_info && typeof source.customer_info === 'object'
      ? source.customer_info
      : source?.customer && typeof source.customer === 'object'
        ? source.customer
        : source && typeof source === 'object'
          ? source
          : {};

  return {
    customerRequirements: normalizeCustomerRequirements(source, customerInfo),
    commercialTerms: normalizeCommercialTerms(source, customerInfo),
    downstreamVisibility:
      customerInfo?.downstreamVisibility && typeof customerInfo.downstreamVisibility === 'object'
        ? {
            ...DEFAULT_DOWNSTREAM_VISIBILITY,
            ...customerInfo.downstreamVisibility,
          }
        : DEFAULT_DOWNSTREAM_VISIBILITY,
  };
};

const asConditionItems = (
  entries: Array<{ key: string; label: string; value?: unknown; hint?: string }>,
): DocumentConditionItem[] =>
  entries
    .map((entry) => {
      const value = asTrimmedText(entry.value);
      if (!value) return null;
      return {
        key: entry.key,
        label: entry.label,
        value,
        hint: entry.hint,
      };
    })
    .filter((entry): entry is DocumentConditionItem => Boolean(entry));

export const buildProcurementConditionGroups = (
  source: any,
  target: 'qr' | 'xj',
): DocumentConditionGroup[] => {
  const context = extractProcurementRequestContext(source);
  const customerRequirements = context.customerRequirements || {};
  const commercialTerms = context.commercialTerms || {};
  const visibility = context.downstreamVisibility || DEFAULT_DOWNSTREAM_VISIBILITY;
  const maskInternalTarget = target === 'xj' && visibility.maskInternalTargetCostToSupplier;
  const customerOtherRequirements = isAggregatedFlowText(customerRequirements.otherRequirements)
    ? undefined
    : customerRequirements.otherRequirements;
  const remarksValue =
    isAggregatedFlowText(commercialTerms.remarks) ||
    asTrimmedText(commercialTerms.remarks) === asTrimmedText(customerOtherRequirements)
      ? undefined
      : commercialTerms.remarks;

  const customerItems = asConditionItems([
    {
      key: 'packagingRequirements',
      label: '客户包装要求',
      value: customerRequirements.packagingRequirements,
    },
    {
      key: 'otherRequirements',
      label: '其他要求',
      value: customerOtherRequirements,
    },
    {
      key: 'customerRemarks',
      label: '客户补充说明',
      value: customerRequirements.customerRemarks,
      hint: '已自动过滤客户联系方式与公开价格。',
    },
  ]);

  const commercialItems = asConditionItems([
    {
      key: 'expectedQuoteDate',
      label: '期望报价日期',
      value: commercialTerms.expectedQuoteDate || source?.expectedQuoteDate,
    },
    {
      key: 'deliveryDate',
      label: '期望交期',
      value: commercialTerms.deliveryDate || source?.deliveryDate,
    },
    {
      key: 'paymentTerms',
      label: '付款条款',
      value: commercialTerms.paymentTerms || source?.paymentTerms,
    },
    {
      key: 'tradeTerms',
      label: '贸易条款',
      value: commercialTerms.tradeTerms || source?.tradeTerms,
    },
    {
      key: 'qualityRequirements',
      label: '验货要求',
      value: commercialTerms.qualityRequirements || source?.qualityRequirements,
    },
    {
      key: 'packagingRequirements',
      label: '特殊包装',
      value: commercialTerms.packagingRequirements || source?.packagingRequirements,
    },
    {
      key: 'remarks',
      label: target === 'xj' ? '采购邀约补充' : '业务补充说明',
      value: remarksValue,
    },
  ]);

  const internalItems = maskInternalTarget
    ? []
    : asConditionItems([
        {
          key: 'targetCostRange',
          label: '目标成本参考',
          value: commercialTerms.targetCostRange || source?.targetCostRange,
          hint: target === 'qr' ? '仅内部可见，不向供应商展示。' : undefined,
        },
      ]);

  return [
    {
      key: 'customer-requirements',
      title: target === 'xj' ? '客户需求摘要（已脱敏）' : '客户需求摘要',
      titleEn: 'CUSTOMER REQUIREMENTS',
      items: customerItems,
    },
    {
      key: 'commercial-terms',
      title: target === 'xj' ? '对供应商邀约条件' : '业务与采购执行条件',
      titleEn: target === 'xj' ? 'SUPPLIER RFQ TERMS' : 'INTERNAL EXECUTION TERMS',
      items: commercialItems,
    },
    {
      key: 'internal-guidance',
      title: '内部参考条件',
      titleEn: 'INTERNAL ONLY',
      items: internalItems,
    },
  ].filter((group) => group.items.length > 0);
};
