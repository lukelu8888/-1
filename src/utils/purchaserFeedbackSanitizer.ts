import type {
  QuoteRequirementDocumentData,
} from '../components/documents/templates/QuoteRequirementDocument';
import type {
  QuoteRequirement,
  QuoteRequirementFeedback,
  QuoteRequirementFeedbackProduct,
} from '../contexts/QuoteRequirementContext';

const SALES_ROLE = 'Sales_Rep';
const SUPPLIER_LABELS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

const splitCandidates = (value: unknown): string[] =>
  String(value || '')
    .split(/[\n,，、;；]+/)
    .map((item) => item.trim())
    .filter(Boolean);

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const dedupeStrings = (values: string[]) => {
  const seen = new Set<string>();
  const result: string[] = [];

  values.forEach((value) => {
    const normalized = value.trim().toLowerCase();
    if (!normalized || seen.has(normalized)) return;
    seen.add(normalized);
    result.push(value.trim());
  });

  return result;
};

const collectNamedSuppliers = (feedback?: Partial<QuoteRequirementFeedback> | null, rawText?: string) => {
  const linkedSuppliers = splitCandidates(feedback?.linkedSupplier);
  const companyMatches = String(rawText || '').match(
    /[A-Za-z0-9\u4e00-\u9fa5&().,'"\- ]{2,}?(?:有限责任公司|股份有限公司|有限公司|集团有限公司|集团|工厂|厂|公司|Co\.,?\s*Ltd\.?|Ltd\.?|Limited|Inc\.?|LLC|Corp\.?|Corporation)/gi,
  ) || [];

  return dedupeStrings([...linkedSuppliers, ...companyMatches]).sort((a, b) => b.length - a.length);
};

const buildSupplierAliasMap = (supplierNames: string[]) => {
  const aliasMap = new Map<string, string>();
  supplierNames.forEach((name, index) => {
    const suffix = SUPPLIER_LABELS[index] || String(index + 1);
    aliasMap.set(name, `供应商${suffix}`);
  });
  return aliasMap;
};

export const desensitizePurchaserFeedbackText = (
  rawText: string,
  feedback?: Partial<QuoteRequirementFeedback> | null,
  userRole?: string,
) => {
  if (!rawText || userRole !== SALES_ROLE) {
    return rawText;
  }

  return forceDesensitizePurchaserFeedbackText(rawText, feedback);
};

export const forceDesensitizePurchaserFeedbackText = (
  rawText: string,
  feedback?: Partial<QuoteRequirementFeedback> | null,
) => {
  if (!rawText) {
    return rawText;
  }

  let text = String(rawText);
  const supplierNames = collectNamedSuppliers(feedback, text);
  const aliasMap = buildSupplierAliasMap(supplierNames);

  supplierNames.forEach((supplierName) => {
    text = text.replace(new RegExp(escapeRegExp(supplierName), 'gi'), aliasMap.get(supplierName) || '供应商');
  });

  const bjNumbers = dedupeStrings([
    ...splitCandidates(feedback?.linkedBJ),
    ...(text.match(/\bBJ-[A-Z0-9-]+\b/gi) || []),
  ]);
  bjNumbers.forEach((bjNo, index) => {
    text = text.replace(
      new RegExp(escapeRegExp(bjNo), 'gi'),
      `BJ-已隐藏-${index + 1}`,
    );
  });

  text = text
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[已隐藏邮箱]')
    .replace(
      /(?<!\d)(?:\+?\d[\d\s\-()]{6,}\d)(?!\d)/g,
      '[已隐藏电话]',
    );

  return text;
};

export const sanitizePurchaserFeedbackForSales = (
  feedback?: QuoteRequirementFeedback | null,
  userRole?: string,
): QuoteRequirementFeedback | null => {
  if (!feedback) return null;
  if (userRole !== SALES_ROLE) return feedback;

  const { decisionSnapshot: _decisionSnapshot, ...restFeedback } = feedback as QuoteRequirementFeedback & {
    decisionSnapshot?: unknown;
  };

  const sanitizedProducts: QuoteRequirementFeedbackProduct[] = (feedback.products || []).map((product) => ({
    ...product,
    remarks: desensitizePurchaserFeedbackText(product.remarks || '', feedback, userRole),
  }));

  return {
    ...restFeedback,
    linkedBJ: feedback.linkedBJ ? '已隐藏' : feedback.linkedBJ,
    linkedSupplier: feedback.linkedSupplier ? '已隐藏' : feedback.linkedSupplier,
    purchaserRemarks: desensitizePurchaserFeedbackText(feedback.purchaserRemarks || '', feedback, userRole),
    products: sanitizedProducts,
  };
};

export const sanitizeQuoteRequirementDocumentForSales = (
  documentData: QuoteRequirementDocumentData | null | undefined,
  feedback?: QuoteRequirementFeedback | null,
  userRole?: string,
): QuoteRequirementDocumentData | null => {
  if (!documentData) return null;
  if (userRole !== SALES_ROLE) return documentData;

  return {
    ...documentData,
    purchaseDeptFeedback: desensitizePurchaserFeedbackText(
      documentData.purchaseDeptFeedback || '',
      feedback,
      userRole,
    ),
  };
};

export const buildSalesSafeQuoteRequirementDocument = (
  qr: QuoteRequirement,
  userRole?: string,
): QuoteRequirementDocumentData | null => {
  const documentData = (qr.documentDataSnapshot || (qr as any).document_data_snapshot || null) as QuoteRequirementDocumentData | null;
  return sanitizeQuoteRequirementDocumentForSales(documentData, qr.purchaserFeedback, userRole);
};
