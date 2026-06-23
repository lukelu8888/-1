/**
 * 📋 文档数据适配器
 * 
 * 用途：将业务模块的数据格式转换为文档中心标准模板所需的数据格式
 * 优势：业务逻辑与文档模板解耦，模板升级不影响业务代码
 * 
 * @author COSUN B2B System
 * @date 2025-12-14
 */

import type { SalesContractData } from '@/components/documents/templates/SalesContractDocument';
import type { QuotationData } from '@/components/documents/templates/QuotationDocument';
import type { SupplierQuotationData } from '@/components/documents/templates/SupplierQuotationDocument';
import {
  type CustomerInquiryData,
  syncCustomerInquiryRequirementFields,
} from '@/components/documents/templates/CustomerInquiryDocument';
import type { CommercialInvoiceData } from '@/components/documents/templates/CommercialInvoiceDocument';
import type { PackingListData } from '@/components/documents/templates/PackingListDocument';
import { getStoredAdminOrgProfile } from '@/contexts/AdminOrganizationContext';
import { resolveUsdSellerBankInfo } from '@/utils/documentBankInfo';
import { aggregateInquiryOemFromProducts, type InquiryOemData } from '@/types/oem';
import {
  getCustomerFacingModelNo,
  getFactoryFacingModelNo,
  getFormalBusinessModelNo,
  getSupplierFacingModelNo,
} from '@/utils/productModelDisplay';
import { resolveDisplayNumber } from '@/lib/erp-core/number-display';

const toSafeNumber = (value: unknown): number => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/,/g, '').trim());
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
};

const normalizePlaceholderText = (value?: string | null) => {
  const text = String(value || '').trim();
  if (!text || text === '-' || text === '--' || /^n\/a$/i.test(text)) {
    return '';
  }
  return text;
};

const containsChineseText = (value?: string | null) => /[\u3400-\u9fff]/.test(String(value || ''));

const pickMeaningfulText = (...values: unknown[]) => {
  for (const value of values) {
    const text = normalizePlaceholderText(String(value || ''));
    if (text) return text;
  }
  return '';
};

const SPEC_PRIORITY_GROUPS: Array<{ label: string; keys: string[] }> = [
  { label: 'Color', keys: ['color', 'colour', 'finish'] },
  { label: 'Size', keys: ['size', 'sizes', 'dimension', 'dimensions', 'dimension(mm)', 'size(mm)'] },
  { label: 'Spec', keys: ['spec', 'specification', 'type', 'rating', 'voltage', 'power', 'wattage', 'current', 'capacity'] },
  { label: 'Material', keys: ['material'] },
  { label: 'Certification', keys: ['certification', 'certifications', 'certificate', 'certificates', 'compliance', 'standard', 'standards'] },
];

const normalizeSpecKey = (key: string) =>
  String(key || '')
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ');

const collectStructuredSpecEntries = (product: any): Array<[string, string]> => {
  const sources = [product?.specifications, product?.specs, product?.attributes, product?.variantAttributes];
  for (const source of sources) {
    if (source && typeof source === 'object' && !Array.isArray(source)) {
      const entries = Object.entries(source)
        .map(([key, value]) => [String(key), normalizePlaceholderText(String(value || ''))] as [string, string])
        .filter(([, value]) => Boolean(value));
      if (entries.length > 0) return entries;
    }
  }
  return [];
};

const buildInquirySpecSummary = (product: any, normalizedProduct: ReturnType<typeof resolveFlowProductDisplay>) => {
  const parts: string[] = [];
  const seen = new Set<string>();
  const structuredEntries = collectStructuredSpecEntries(product);

  const pushPart = (value: string, label?: string) => {
    const clean = normalizePlaceholderText(value);
    if (!clean) return;
    const composed = label ? `${label}: ${clean}` : clean;
    const key = composed.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    parts.push(composed);
  };

  for (const group of SPEC_PRIORITY_GROUPS) {
    const matchedEntry = structuredEntries.find(([rawKey]) => {
      const key = normalizeSpecKey(rawKey);
      return group.keys.some((candidate) => key === candidate || key.includes(candidate));
    });
    if (matchedEntry) {
      pushPart(matchedEntry[1], group.label);
      continue;
    }

    if (group.label === 'Color') {
      pushPart(product?.color, group.label);
    } else if (group.label === 'Size') {
      pushPart(product?.size || product?.dimensions || product?.dimension, group.label);
    } else if (group.label === 'Material') {
      pushPart(product?.material, group.label);
    } else if (group.label === 'Certification') {
      if (Array.isArray(product?.certifications)) {
        pushPart(product.certifications.filter(Boolean).join(', '), group.label);
      } else {
        pushPart(product?.certifications || product?.certification, group.label);
      }
    }
  }

  const genericSpecSource = pickMeaningfulText(
    product?.specification,
    product?.specifications,
    product?.specs,
    product?.description,
    product?.productPackageSnapshot?.specSummary,
    product?.productPackageSnapshot?.description,
    product?.inquirySnapshot?.specSummary,
    product?.inquirySnapshot?.description,
    product?.inquirySnapshotDraft?.specSummary,
    product?.inquirySnapshotDraft?.description,
    normalizedProduct.specification,
  );

  if (parts.length === 0) {
    return genericSpecSource || '-';
  }

  if (genericSpecSource) {
    const genericSegments = genericSpecSource
      .split(/\s*[|,;/]\s*/)
      .map((segment) => normalizePlaceholderText(segment))
      .filter(Boolean);

    for (const segment of genericSegments) {
      if (parts.length >= 5) break;
      const lower = segment.toLowerCase();
      const alreadyCovered = parts.some((part) => lower.includes(part.toLowerCase()) || part.toLowerCase().includes(lower));
      if (!alreadyCovered) pushPart(segment);
    }
  }

  return parts.slice(0, 5).join(' | ');
};

const CHINA_REGION_HINTS = [
  '中国', 'china', 'cn', 'guangdong', 'zhejiang', 'fujian', 'jiangsu', 'shanghai', 'shandong',
  '广东', '浙江', '福建', '江苏', '上海', '山东', '东莞', '佛山', '温州', '济南', '宁波', '杭州', '深圳', '苏州',
] as const;

export const inferSupplierDocumentLanguage = (source: any): 'zh' | 'en' => {
  const explicitCountryCode = String(
    source?.supplierCountryCode ||
    source?.supplier?.countryCode ||
    source?.supplierProfile?.countryCode ||
    source?.supplier_country_code ||
    '',
  ).trim().toUpperCase();
  if (explicitCountryCode) {
    return explicitCountryCode === 'CN' ? 'zh' : 'en';
  }

  const explicitLocale = String(
    source?.supplierLocale ||
    source?.supplier?.locale ||
    source?.supplierProfile?.locale ||
    '',
  ).trim().toLowerCase();
  if (explicitLocale) {
    return explicitLocale.startsWith('zh') ? 'zh' : 'en';
  }

  if (
    source?.isDomesticSupplier === true ||
    source?.supplier?.isDomesticSupplier === true ||
    source?.supplierProfile?.isDomesticSupplier === true
  ) {
    return 'zh';
  }

  const regionHint = String(
    source?.supplierRegion ||
    source?.supplier?.region ||
    source?.supplierProfile?.region ||
    source?.supplierAddress ||
    source?.supplier?.address ||
    source?.supplierName ||
    source?.supplier?.companyName ||
    source?.supplier?.name ||
    '',
  ).trim().toLowerCase();

  if (regionHint && CHINA_REGION_HINTS.some((hint) => regionHint.includes(hint))) {
    return 'zh';
  }

  return 'en';
};

type SalesContractBuyerInput = {
  customerCompany?: string | null;
  customerName?: string | null;
  customerAddress?: string | null;
  customerCountry?: string | null;
  contactPerson?: string | null;
  contactPhone?: string | null;
  customerPhone?: string | null;
  customerEmail?: string | null;
};

export function resolveSalesContractBuyerData(
  source: SalesContractBuyerInput,
  fallbackRegion?: 'NA' | 'SA' | 'EU',
): SalesContractData['buyer'] {
  const companyName =
    normalizePlaceholderText(source.customerCompany)
    || normalizePlaceholderText(source.customerName)
    || 'To be confirmed';
  const address =
    normalizePlaceholderText(source.customerAddress)
    || 'To be confirmed';
  const country =
    normalizePlaceholderText(source.customerCountry)
    || detectCountryFromRegion(fallbackRegion || 'NA');
  const contactPerson =
    normalizePlaceholderText(source.contactPerson)
    || normalizePlaceholderText(source.customerName)
    || 'N/A';
  const tel =
    normalizePlaceholderText(source.contactPhone)
    || normalizePlaceholderText(source.customerPhone)
    || 'N/A';
  const email =
    normalizePlaceholderText(source.customerEmail)
    || 'N/A';

  return {
    companyName,
    address,
    country,
    contactPerson,
    tel,
    email,
  };
}

const parseQuotedProductSummary = (rawName?: string | null, rawSpecification?: string | null) => {
  const nameText = normalizePlaceholderText(rawName);
  const specText = normalizePlaceholderText(rawSpecification);

  if (!nameText) {
    return {
      productName: '',
      modelNo: '',
      specification: specText,
    };
  }

  const normalizedText = nameText
    .replace(/\s*[\r\n]+\s*/g, '; ')
    .replace(/([,，])\s*(?=(型号|规格|Material|Warranty|Certification)\b|(?=型号|规格))/gi, '; ')
    .replace(/\s{2,}/g, ' ')
    .trim();

  const segments = normalizedText
    .split(/[;；]\s*/)
    .map((segment) => segment.trim())
    .filter(Boolean);

  let productName = '';
  let modelNo = '';
  const specificationParts: string[] = [];

  segments.forEach((segment, index) => {
    const cleanedSegment = segment.replace(/^[-:：,\s]+/, '').trim();
    if (!cleanedSegment) return;

    if (/^型号[:：]?/i.test(cleanedSegment)) {
      modelNo = cleanedSegment.replace(/^型号[:：]?\s*/i, '').trim();
      return;
    }

    if (/^规格[:：]?/i.test(cleanedSegment)) {
      specificationParts.push(cleanedSegment.replace(/^规格[:：]?\s*/i, '').trim());
      return;
    }

    if (/^certification[:：]?/i.test(cleanedSegment) || /^warranty[:：]?/i.test(cleanedSegment) || /^material[:：]?/i.test(cleanedSegment)) {
      specificationParts.push(cleanedSegment);
      return;
    }

    if (index === 0 && !productName) {
      productName = cleanedSegment;
      return;
    }

    specificationParts.push(cleanedSegment);
  });

  return {
    productName: productName || normalizedText,
    modelNo,
    specification: [specText, ...specificationParts]
      .map((part) => normalizePlaceholderText(part))
      .filter(Boolean)
      .join('; '),
  };
};

export const normalizeFlowProductCore = (product: any, index = 0) => {
  const parsedSummary = parseQuotedProductSummary(
    product?.productName ||
      product?.name ||
      product?.description ||
      product?.itemName ||
      product?.title ||
      '',
    product?.specification || product?.specs || product?.spec || '',
  );

  const quantity = toSafeNumber(product?.quantity ?? product?.qty ?? product?.pcs ?? product?.count);
  const rawProductName = pickMeaningfulText(
    product?.rawProductName,
    product?.productName,
    product?.name,
    product?.description,
    product?.itemName,
    product?.title,
    parsedSummary.productName,
  );
  const rawSpecification = pickMeaningfulText(
    product?.rawSpecification,
    product?.specification,
    product?.specs,
    product?.spec,
    parsedSummary.specification,
  );

  const productNameZh = pickMeaningfulText(
    product?.productNameZh,
    product?.productNameCN,
    product?.productNameCn,
    product?.nameZh,
    product?.nameCN,
    product?.nameCn,
    product?.descriptionZh,
    product?.descriptionCN,
    containsChineseText(rawProductName) ? rawProductName : '',
  );
  const productNameEn = pickMeaningfulText(
    product?.productNameEn,
    product?.productNameEN,
    product?.nameEn,
    product?.descriptionEn,
    !containsChineseText(rawProductName) ? rawProductName : '',
  );
  const specificationZh = pickMeaningfulText(
    product?.specificationZh,
    product?.specificationCN,
    product?.specificationCn,
    containsChineseText(rawSpecification) ? rawSpecification : '',
  );
  const specificationEn = pickMeaningfulText(
    product?.specificationEn,
    product?.specificationEN,
    !containsChineseText(rawSpecification) ? rawSpecification : '',
  );

  return {
    id: product?.id || product?.productId || `product-${index + 1}`,
    rawProductName,
    rawSpecification,
    productName:
      normalizePlaceholderText(
        product?.productName ||
          product?.name ||
          product?.description ||
          product?.itemName ||
          product?.title,
      ) ||
      parsedSummary.productName ||
      `Product ${index + 1}`,
    productNameZh,
    productNameEn,
    modelNo:
      normalizePlaceholderText(
        getFormalBusinessModelNo(product) ||
          product?.modelNo ||
          product?.model ||
          product?.model_no ||
          product?.sku ||
          product?.customerModelNo ||
          product?.supplierModelNo,
      ) ||
      parsedSummary.modelNo ||
      '',
    factoryModelNo:
      normalizePlaceholderText(
        getFactoryFacingModelNo(product) ||
          product?.factoryModelNo ||
          product?.factorySku ||
          product?.factory_model_no ||
          product?.factory_sku,
      ) || '',
    imageUrl:
      normalizePlaceholderText(
        product?.imageUrl ||
          product?.image ||
          product?.image_url ||
          product?.photoUrl ||
          product?.productImage ||
          product?.product_image,
      ) || '',
    specification:
      normalizePlaceholderText(product?.specification || product?.specs || product?.spec) ||
      parsedSummary.specification ||
      '',
    specificationZh,
    specificationEn,
    quantity,
    unit: normalizePlaceholderText(product?.unit || product?.uom) || 'PCS',
    hsCode: normalizePlaceholderText(product?.hsCode || product?.hs_code) || '',
    remarks: normalizePlaceholderText(product?.remarks || product?.notes) || '',
  };
};

export const resolveFlowProductDisplay = (
  product: any,
  preferredLanguage: 'zh' | 'en' = 'en',
) => {
  const normalized = normalizeFlowProductCore(product);
  const productName = preferredLanguage === 'zh'
    ? normalized.productNameZh || normalized.productNameEn || normalized.productName
    : normalized.productNameEn
      || (!containsChineseText(normalized.productName) ? normalized.productName : '')
      || `Product ${String(normalized.id || '').trim() || ''}`.trim()
      || 'Product';
  const specification = preferredLanguage === 'zh'
    ? normalized.specificationZh || normalized.specificationEn || normalized.specification
    : normalized.specificationEn
      || (!containsChineseText(normalized.specification) ? normalized.specification : '');

  return {
    ...normalized,
    productName,
    specification,
  };
};

const UUID_LIKE_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const buildAdminCompanyProfile = () => {
  const adminOrg = getStoredAdminOrgProfile();
  const normalizedUsdBank = resolveUsdSellerBankInfo(
    adminOrg,
    undefined,
    String(adminOrg.nameEN || adminOrg.nameCN || '').trim(),
  );

  return {
    name: String(adminOrg.nameCN || '').trim(),
    nameEn: String(adminOrg.nameEN || adminOrg.nameCN || '').trim(),
    address: String(adminOrg.addressCN || '').trim(),
    addressEn: String(adminOrg.addressEN || adminOrg.addressCN || '').trim(),
    tel: String(adminOrg.phone || '').trim(),
    email: String(adminOrg.email || '').trim(),
    website: String(adminOrg.website || '').trim(),
    contactPerson: String(adminOrg.contactPerson || '').trim(),
    bankUSD: normalizedUsdBank,
  };
};

const resolveDisplayInquiryNumber = (inquiry: Record<string, any>): string => {
  const isPendingSync = String(inquiry.syncStatus || '').trim().toLowerCase() === 'pending';
  const candidates = [
    inquiry.inquiryNumber,
    inquiry.inquiry_number,
    inquiry.inquiryNo,
    inquiry.id,
  ];

  for (const candidate of candidates) {
    const value = String(candidate || '').trim();
    if (!value || value === 'ING-DRAFT' || UUID_LIKE_PATTERN.test(value)) continue;
    return value;
  }

  if (!isPendingSync) {
    const snapshotCandidates = [
      inquiry.documentDataSnapshot?.inquiryNumber,
      inquiry.documentDataSnapshot?.inquiryNo,
      inquiry.document_data_snapshot?.inquiryNumber,
      inquiry.document_data_snapshot?.inquiryNo,
    ];

    for (const candidate of snapshotCandidates) {
      const value = String(candidate || '').trim();
      if (!value || value === 'ING-DRAFT' || UUID_LIKE_PATTERN.test(value)) continue;
      return value;
    }
  }

  const mappedInternalNo = String(inquiry.inquiryNumber || inquiry.inquiry_number || inquiry.id || '').trim();
  if (mappedInternalNo) {
    const normalizedCompanyId = String(inquiry.companyId || inquiry.company_id || '').trim() || undefined;
    const primaryDisplay = resolveDisplayNumber({
      domain: 'ing',
      internalNo: mappedInternalNo,
      companyId: normalizedCompanyId,
    });
    const display = String(primaryDisplay.externalNo || '').trim()
      ? primaryDisplay
      : resolveDisplayNumber({
          domain: 'ing',
          internalNo: mappedInternalNo,
        });
    if (String(display.externalNo || '').trim()) {
      return String(display.externalNo).trim();
    }
  }

  return 'ING';
};

export const resolveCustomerInquiryDisplayNo = (
  inquiry: Record<string, any> | null | undefined,
  companyId?: string,
): string => {
  if (!inquiry) return '';

  const isPendingLocalInquiry =
    String(inquiry?.syncStatus || '').trim() === 'pending' &&
    UUID_LIKE_PATTERN.test(String(inquiry?.id || '').trim());
  if (isPendingLocalInquiry) {
    return '';
  }

  const displayNo = resolveDisplayInquiryNumber({
    ...inquiry,
    companyId: companyId || inquiry.companyId,
    company_id: companyId || inquiry.company_id,
  });
  if (displayNo && displayNo !== 'ING') {
    return displayNo;
  }

  const fallbackCandidates = [
    inquiry.inquiryNumber,
    inquiry.inquiry_number,
    inquiry.documentDataSnapshot?.inquiryNo,
    inquiry.document_data_snapshot?.inquiryNo,
  ];

  for (const candidate of fallbackCandidates) {
    const value = String(candidate || '').trim();
    if (!value || value === 'ING-DRAFT' || UUID_LIKE_PATTERN.test(value)) continue;
    return value;
  }

  return '';
};

const parseInquiryRequirementsFromMessage = (message?: string | null) => {
  const parsed = {
    deliveryTime: '',
    portOfDestination: '',
    paymentTerms: '',
    tradeTerms: '',
    packingRequirements: '',
    certifications: [] as string[],
    otherRequirements: '',
  };

  if (!message?.trim()) {
    return parsed;
  }

  const patterns: Array<[keyof typeof parsed, RegExp[]]> = [
    ['tradeTerms', [/^\s*1\.\s*Price:\s*(.*)$/i, /^\s*Trade Terms:\s*(.*)$/i]],
    ['deliveryTime', [/^\s*2\.\s*Delivery time:\s*(.*)$/i, /^\s*Delivery Time:\s*(.*)$/i]],
    ['portOfDestination', [/^\s*3\.\s*Destination Port:\s*(.*)$/i, /^\s*Port of Destination:\s*(.*)$/i]],
    ['paymentTerms', [/^\s*4\.\s*Payment Term:\s*(.*)$/i, /^\s*Payment Terms:\s*(.*)$/i]],
    ['packingRequirements', [/^\s*Packing Requirements:\s*(.*)$/i]],
    ['otherRequirements', [/^\s*5\.\s*Others:\s*(.*)$/i, /^\s*Other Requirements:\s*(.*)$/i]],
  ];

  message.split('\n').forEach((line) => {
    patterns.forEach(([key, keyPatterns]) => {
      keyPatterns.forEach((pattern) => {
        const match = line.match(pattern);
        if (match) {
          parsed[key] = match[1]?.trim() || '';
        }
      });
    });

    const certificationMatch = line.match(/^\s*Certifications Required:\s*(.*)$/i);
    if (certificationMatch) {
      parsed.certifications = certificationMatch[1]
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
    }
  });

  return parsed;
};

export interface OemFactoryFacingDocumentData {
  inquiryNumber: string;
  issueDate: string;
  ownerDepartment: 'Procurement Department';
  internalCompany: {
    companyName: string;
    brandName: string;
    contactPerson: string;
    email: string;
    phone: string;
    address: string;
    projectName: string;
  };
  redactionSummary: Array<{
    field: string;
    originalValue: string;
    replacementValue: string;
  }>;
  businessRequirementNote: string;
  tooling: {
    toolingCostInvolved: boolean;
    firstOrderQuantity: string;
    annualQuantity: string;
    quantityWithinThreeYears: string;
    moldLifetime: string;
  };
  files: Array<{
    id: string;
    fileName: string;
    description: string;
    fileType: string;
    fileSize: number;
    factoryFacingCode: string;
    customerPartNumber: string;
    internalModelNumber: string;
    internalSku: string;
    factoryFacingPartNumber: string;
    storageUrl?: string;
  }>;
  partNumberMappings: Array<{
    customerPartNumber: string;
    internalModelNumber: string;
    internalSku: string;
    factoryFacingPartNumber: string;
    status: string;
  }>;
}

const resolveProductLevelInquiryOem = (inquiry: {
  products?: Array<any>;
  oem?: InquiryOemData | null;
}): InquiryOemData | null => {
  const products = Array.isArray(inquiry.products) ? inquiry.products : [];
  const aggregated = aggregateInquiryOemFromProducts(products);

  if (aggregated.enabled) {
    return aggregated;
  }

  return inquiry.oem || null;
};

const INTERNAL_OEM_COMPANY_INFO = {
  companyName: 'FUJIAN COSUN TUFF BUILDING MATERIALS CO., LTD.',
  brandName: 'COSUN',
  contactPerson: 'Procurement Department',
  email: 'export@cosun.com',
  phone: '+86-591-8888-8888',
  address: 'Jinshan Industrial Zone, Jianxin Town, Cangshan District, Fuzhou, Fujian, China',
};

const toFactoryFacingPartNumber = (internalModelNumber?: string, internalSku?: string) => {
  const model = String(internalModelNumber || '').trim();
  const sku = String(internalSku || '').trim();

  if (model && sku) return `${model} / ${sku}`;
  if (model) return model;
  if (sku) return sku;

  return 'MODEL# / SKU PENDING';
};

export function adaptInquiryToFactoryFacingOemDocument(inquiry: {
  inquiryNumber?: string;
  date?: string;
  buyerInfo?: {
    companyName?: string;
    contactPerson?: string;
    email?: string;
    phone?: string;
    address?: string;
  };
  message?: string;
  oem?: InquiryOemData | null;
  products?: Array<any>;
}): OemFactoryFacingDocumentData | null {
  const oem = resolveProductLevelInquiryOem(inquiry);
  if (!oem?.enabled) return null;

  const inquiryNumber = resolveDisplayInquiryNumber(inquiry as Record<string, any>);
  const issueDate = inquiry.date || new Date().toISOString().split('T')[0];
  const projectName = `COSUN OEM PROJECT ${inquiryNumber}`;
  const fileMappings = new Map(
    (Array.isArray(oem.partNumberMappings) ? oem.partNumberMappings : []).map((mapping) => [
      mapping.customerPartNumber,
      mapping,
    ]),
  );

  const redactionSummary = [
    {
      field: 'Customer Company Name',
      originalValue: String(inquiry.buyerInfo?.companyName || ''),
      replacementValue: INTERNAL_OEM_COMPANY_INFO.companyName,
    },
    {
      field: 'Customer Contact',
      originalValue: String(inquiry.buyerInfo?.contactPerson || ''),
      replacementValue: INTERNAL_OEM_COMPANY_INFO.contactPerson,
    },
    {
      field: 'Customer Email',
      originalValue: String(inquiry.buyerInfo?.email || ''),
      replacementValue: INTERNAL_OEM_COMPANY_INFO.email,
    },
    {
      field: 'Customer Phone',
      originalValue: String(inquiry.buyerInfo?.phone || ''),
      replacementValue: INTERNAL_OEM_COMPANY_INFO.phone,
    },
    {
      field: 'Customer Address',
      originalValue: String(inquiry.buyerInfo?.address || ''),
      replacementValue: INTERNAL_OEM_COMPANY_INFO.address,
    },
    {
      field: 'Project Name',
      originalValue: String(inquiry.message || ''),
      replacementValue: projectName,
    },
  ].filter((entry) => entry.originalValue || entry.replacementValue);

  return {
    inquiryNumber,
    issueDate,
    ownerDepartment: 'Procurement Department',
    internalCompany: {
      ...INTERNAL_OEM_COMPANY_INFO,
      projectName,
    },
    redactionSummary,
    businessRequirementNote: oem.overallRequirementNote,
    tooling: {
      toolingCostInvolved: oem.tooling.toolingCostInvolved,
      firstOrderQuantity: oem.tooling.firstOrderQuantity,
      annualQuantity: oem.tooling.annualQuantity,
      quantityWithinThreeYears: oem.tooling.quantityWithinThreeYears,
      moldLifetime: oem.tooling.moldLifetime,
    },
    files: oem.files.map((file, index) => {
      const mapped = fileMappings.get(file.customerPartNumber);
      const internalModelNumber = mapped?.internalModelNumber || file.internalModelNumber || '';
      const internalSku = mapped?.internalSku || file.internalSku || '';

      return {
        id: file.id,
        fileName: file.fileName,
        description: file.description,
        fileType: file.fileType,
        fileSize: file.fileSize,
        factoryFacingCode: `OEM-TECH-${String(index + 1).padStart(3, '0')}`,
        customerPartNumber: file.customerPartNumber,
        internalModelNumber,
        internalSku,
        factoryFacingPartNumber: toFactoryFacingPartNumber(internalModelNumber, internalSku),
        storageUrl: file.storageUrl,
      };
    }),
    partNumberMappings: oem.partNumberMappings.map((mapping) => ({
      customerPartNumber: mapping.customerPartNumber,
      internalModelNumber: mapping.internalModelNumber,
      internalSku: mapping.internalSku,
      factoryFacingPartNumber: toFactoryFacingPartNumber(mapping.internalModelNumber, mapping.internalSku),
      status: mapping.status,
    })),
  };
}

export function adaptInquiryToDocumentData(inquiry: {
  id?: string;
  inquiryNumber?: string;
  inquiry_number?: string;
  companyId?: string;
  company_id?: string;
  date?: string;
  region?: 'NA' | 'SA' | 'EU';
  buyerInfo?: {
    companyName?: string;
    contactPerson?: string;
    email?: string;
    phone?: string;
    address?: string;
  };
  products?: Array<{
    modelNo?: string;
    image?: string;
    imageUrl?: string;
    productName?: string;
    specification?: string;
    quantity?: number;
    unit?: string;
    targetPrice?: number;
    unitPrice?: number;
    currency?: string;
    color?: string;
    material?: string;
  }>;
  shippingInfo?: {
    cartons?: string;
    cbm?: string;
    totalGrossWeight?: string;
    totalNetWeight?: string;
  };
  requirements?: {
    incoterm?: string;
    locationLabel?: string;
    locationValue?: string;
    finalDestinationPlan?: string;
    deliveryTime?: string;
    portOfDestination?: string;
    paymentTerms?: string;
    tradeTerms?: string;
    paymentMode?: string;
    balanceTrigger?: string;
    documentReleasePreference?: string;
    lcType?: string;
    creditDays?: string;
    businessScenario?: string;
    businessScenarioNotes?: string;
    insuranceRequirement?: string;
    packingRequirements?: string;
    certifications?: string[] | string;
    otherRequirements?: string;
  };
  oem?: InquiryOemData;
  message?: string;
}): CustomerInquiryData {
  const region = inquiry.region || 'NA';
  const date = inquiry.date || new Date().toISOString().split('T')[0];
  const products = Array.isArray(inquiry.products) ? inquiry.products : [];
  const customerEmail = inquiry.buyerInfo?.email || '';
  const emailName = customerEmail.includes('@') ? customerEmail.split('@')[0] : customerEmail;
  const hasStructuredRequirements = Boolean(
    inquiry.requirements && Object.values(inquiry.requirements).some((value) => {
      if (Array.isArray(value)) return value.length > 0;
      return Boolean(String(value || '').trim());
    }),
  );
  const legacyRequirements = parseInquiryRequirementsFromMessage(inquiry.message);
  const certificationList = Array.isArray(inquiry.requirements?.certifications)
    ? inquiry.requirements.certifications
    : (inquiry.requirements?.certifications || '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
  const resolvedRequirements = syncCustomerInquiryRequirementFields({
    incoterm: inquiry.requirements?.incoterm,
    locationLabel: inquiry.requirements?.locationLabel,
    locationValue: inquiry.requirements?.locationValue,
    finalDestinationPlan: inquiry.requirements?.finalDestinationPlan,
    tradeTerms: inquiry.requirements?.tradeTerms || (!hasStructuredRequirements ? legacyRequirements.tradeTerms : ''),
    deliveryTime: inquiry.requirements?.deliveryTime || (!hasStructuredRequirements ? legacyRequirements.deliveryTime : ''),
    portOfDestination: inquiry.requirements?.portOfDestination || (!hasStructuredRequirements ? legacyRequirements.portOfDestination : ''),
    paymentTerms: inquiry.requirements?.paymentTerms || (!hasStructuredRequirements ? legacyRequirements.paymentTerms : ''),
    paymentMode: inquiry.requirements?.paymentMode,
    balanceTrigger: inquiry.requirements?.balanceTrigger,
    documentReleasePreference: inquiry.requirements?.documentReleasePreference,
    lcType: inquiry.requirements?.lcType,
    creditDays: inquiry.requirements?.creditDays,
    businessScenario: inquiry.requirements?.businessScenario,
    businessScenarioNotes: inquiry.requirements?.businessScenarioNotes,
    insuranceRequirement: inquiry.requirements?.insuranceRequirement,
    packingRequirements: inquiry.requirements?.packingRequirements || (!hasStructuredRequirements ? legacyRequirements.packingRequirements : ''),
    certifications: certificationList.join(', '),
    otherRequirements: inquiry.requirements?.otherRequirements || (!hasStructuredRequirements ? legacyRequirements.otherRequirements || inquiry.message || '' : ''),
  });
  const companyName = inquiry.buyerInfo?.companyName && inquiry.buyerInfo.companyName !== 'N/A'
    ? inquiry.buyerInfo.companyName
    : (emailName ? `${emailName} inquiry` : 'Customer Inquiry');
  const contactPerson = inquiry.buyerInfo?.contactPerson && inquiry.buyerInfo.contactPerson !== 'N/A'
    ? inquiry.buyerInfo.contactPerson
    : (emailName || 'Customer');

  const resolvedOem = resolveProductLevelInquiryOem(inquiry);

  const resolvedInquiryNo = resolveDisplayInquiryNumber(inquiry as Record<string, any>);

  return {
    inquiryNo: resolvedInquiryNo === 'ING' ? '' : resolvedInquiryNo,
    inquiryDate: date,
    region,
    customer: {
      companyName,
      contactPerson,
      email: customerEmail,
      phone: inquiry.buyerInfo?.phone && inquiry.buyerInfo.phone !== 'N/A' ? inquiry.buyerInfo.phone : '',
      address: inquiry.buyerInfo?.address && inquiry.buyerInfo.address !== 'N/A' ? inquiry.buyerInfo.address : '',
      country: region === 'NA' ? 'United States' : region === 'SA' ? 'South America' : 'Europe & Africa',
    },
    products: products.map((product, index) => {
      const normalizedProduct = resolveFlowProductDisplay(product, 'en');
      const targetPrice = toSafeNumber(product.targetPrice ?? product.unitPrice);
      const resolvedModelNo = pickMeaningfulText(
        product?.inquirySnapshot?.displayModelNo,
        product?.inquirySnapshotDraft?.displayModelNo,
        product?.productPackageSnapshot?.supplierModelNo,
        product?.productPackageSnapshot?.customerModelNo,
        getCustomerFacingModelNo(product),
        normalizedProduct.modelNo,
      );
      return {
        no: index + 1,
        modelNo: resolvedModelNo || '-',
        imageUrl: normalizedProduct.imageUrl,
        productName: pickMeaningfulText(
          product?.inquirySnapshot?.productName,
          product?.inquirySnapshotDraft?.productName,
          product?.productPackageSnapshot?.productName,
          normalizedProduct.productName,
        ) || 'Unnamed Product',
        specification: buildInquirySpecSummary(product, normalizedProduct),
        quantity: normalizedProduct.quantity,
        unit: normalizedProduct.unit || 'pcs',
        targetPrice: targetPrice || undefined,
        currency: product.currency || 'USD',
        description: '',
      };
    }),
    requirements: {
      incoterm: resolvedRequirements.incoterm,
      locationLabel: resolvedRequirements.locationLabel,
      locationValue: resolvedRequirements.locationValue,
      finalDestinationPlan: resolvedRequirements.finalDestinationPlan,
      deliveryTime: resolvedRequirements.deliveryTime,
      portOfDestination: resolvedRequirements.portOfDestination,
      paymentTerms: resolvedRequirements.paymentTerms,
      tradeTerms: resolvedRequirements.tradeTerms,
      paymentMode: resolvedRequirements.paymentMode,
      balanceTrigger: resolvedRequirements.balanceTrigger,
      documentReleasePreference: resolvedRequirements.documentReleasePreference,
      lcType: resolvedRequirements.lcType,
      creditDays: resolvedRequirements.creditDays,
      businessScenario: resolvedRequirements.businessScenario,
      businessScenarioNotes: resolvedRequirements.businessScenarioNotes,
      insuranceRequirement: resolvedRequirements.insuranceRequirement,
      packingRequirements: resolvedRequirements.packingRequirements,
      certifications: certificationList.length > 0 ? certificationList : (!hasStructuredRequirements ? legacyRequirements.certifications : []),
      otherRequirements: resolvedRequirements.otherRequirements,
    },
    oem: resolvedOem || undefined,
    remarks: inquiry.message || '',
    status: 'pending',
  };
}

/**
 * 🔥 订单数据 → 销售合同数据适配器
 * 
 * 将AdminActiveOrders中的订单数据转换为SalesContractDocument所需的标准格式
 */
export function adaptOrderToSalesContract(orderData: {
  orderNumber: string;
  customer: string;
  customerEmail?: string;
  customerCountry?: string;
  customerAddress?: string;
  customerContact?: string;
  customerPhone?: string;
  date: string;
  expectedDelivery: string;
  totalAmount: number;
  currency: string;
  products: Array<{
    name: string;
    specs?: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    unit?: string;
    hsCode?: string;
    modelNo?: string;
    imageUrl?: string;
  }>;
  shippingMethod?: string;
  quotationNumber?: string;
  region?: 'NA' | 'SA' | 'EU';
  paymentTerms?: string;
  tradeTerms?: string;
  portOfLoading?: string;
  portOfDestination?: string;
}): SalesContractData {
  const adminCompany = buildAdminCompanyProfile();
  const normalizedOrderDate = new Date(orderData.date);
  const safeOrderDate = Number.isFinite(normalizedOrderDate.getTime())
    ? normalizedOrderDate
    : new Date();
  const totalAmount = toSafeNumber(orderData.totalAmount);
  
  // 生成销售合同编号（如果没有的话）
  const contractNo = orderData.quotationNumber 
    ? orderData.quotationNumber.replace('QT-', 'SC-')
    : `SC-${orderData.region || 'NA'}-${safeOrderDate.toISOString().slice(0, 10).replace(/-/g, '')}-${orderData.orderNumber.slice(-3)}`;
  
  // 推断区域
  const region = orderData.region || detectRegionFromCustomer(orderData.customer, orderData.customerCountry);
  
  return {
    contractNo,
    contractDate: orderData.date,
    quotationNo: orderData.quotationNumber,
    region,
    
    // 卖方信息（企业主数据中心）
    seller: {
      name: adminCompany.name,
      nameEn: adminCompany.nameEn,
      address: adminCompany.address,
      addressEn: adminCompany.addressEn,
      tel: adminCompany.tel,
      fax: '',
      email: adminCompany.email,
      legalRepresentative: adminCompany.contactPerson,
      businessLicense: '',
      bankInfo: {
        bankName: adminCompany.bankUSD.bankName,
        accountName: adminCompany.bankUSD.accountName,
        accountNumber: adminCompany.bankUSD.accountNumber,
        swiftCode: adminCompany.bankUSD.swiftCode,
        bankAddress: adminCompany.bankUSD.bankAddress,
        currency: orderData.currency || adminCompany.bankUSD.currency
        ,
        paymentNote: adminCompany.bankUSD.paymentNote,
      }
    },
    
    // 买方信息
    buyer: resolveSalesContractBuyerData({
      customerCompany: orderData.customer,
      customerName: orderData.customerContact,
      customerAddress: orderData.customerAddress,
      customerCountry: orderData.customerCountry,
      contactPerson: orderData.customerContact,
      contactPhone: orderData.customerPhone,
      customerEmail: orderData.customerEmail,
    }, region),
    
    // 产品列表
    products: orderData.products.map((product, index) => {
      const normalizedProduct = resolveFlowProductDisplay(product, 'en');
      const quantity = toSafeNumber(normalizedProduct.quantity);
      const unitPrice = toSafeNumber(product.unitPrice);
      const amount = toSafeNumber(product.totalPrice) || quantity * unitPrice;
      return {
        no: index + 1,
        modelNo: normalizedProduct.modelNo || getFormalBusinessModelNo(product) || '-',
        imageUrl: normalizedProduct.imageUrl || '',
        description: normalizedProduct.productName || product.name || '-',
        specification: normalizedProduct.specification || product.specs || 'Standard',
        hsCode: product.hsCode,
        quantity,
        unit: normalizedProduct.unit || product.unit || 'pcs',
        unitPrice,
        currency: orderData.currency,
        amount,
        deliveryTime: orderData.expectedDelivery,
      };
    }),
    
    // 合同条款
    terms: {
      totalAmount,
      currency: orderData.currency,
      tradeTerms: orderData.tradeTerms || determinePriceTerm(region),
      paymentTerms: orderData.paymentTerms || '30% T/T deposit, 70% balance before shipment',
      depositAmount: totalAmount * 0.3,
      balanceAmount: totalAmount * 0.7,
      deliveryTime: `${calculateDeliveryDays(orderData.date, orderData.expectedDelivery)} days after deposit received`,
      portOfLoading: orderData.portOfLoading || 'Xiamen, China',
      portOfDestination: orderData.portOfDestination || determineDestinationPort(region),
      packing: 'Export standard carton with pallet',
      inspection: 'Seller\'s quality inspection before shipment; Buyer has the right to reinspect upon arrival',
      insurance: orderData.tradeTerms?.includes('CIF') ? 'Covered by seller for 110% of invoice value' : 'To be covered by buyer',
      warranty: '12 months from the date of shipment for manufacturing defects'
    },
    
    // 违约责任
    liabilityTerms: {
      sellerDefault: 'If the Seller fails to deliver the goods within the agreed time without valid reason, the Seller shall pay liquidated damages equal to 0.5% of the total contract value for each week of delay, up to a maximum of 5% of the total contract value.',
      buyerDefault: 'If the Buyer fails to make payment within the agreed time, the Buyer shall pay liquidated damages equal to 0.5% of the outstanding amount for each week of delay. If payment is delayed for more than 30 days, the Seller has the right to terminate the contract and claim compensation.',
      forceMajeure: 'Neither party shall be liable for failure or delay in performing its obligations due to force majeure events such as natural disasters, war, government actions, or other unforeseeable circumstances beyond reasonable control. The affected party must notify the other party within 7 days and provide supporting documents.'
    },
    
    // 争议解决
    disputeResolution: {
      governingLaw: 'This contract shall be governed by and construed in accordance with the laws of the People\'s Republic of China.',
      arbitration: 'Any disputes arising from or in connection with this contract shall be settled through friendly negotiation. If negotiation fails, the dispute shall be submitted to China International Economic and Trade Arbitration Commission (CIETAC) for arbitration in accordance with its rules. The arbitration award shall be final and binding on both parties.'
    },
    
    // 签名信息
    signature: {
      sellerSignatory: 'Authorized Signatory (Legal Representative)',
      buyerSignatory: orderData.customerContact || 'To be signed',
      signDate: orderData.date
    }
  };
}

export function adaptSalesQuotationToDocumentData(quotation: {
  qtNumber?: string;
  createdAt?: string;
  quotationDate?: string;
  validUntil?: string;
  inqNumber?: string;
  region?: 'NA' | 'SA' | 'EU';
  customerCompany?: string;
  customerName?: string;
  customerAddress?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerCountry?: string;
  items?: Array<{
    modelNo?: string;
    imageUrl?: string;
    productName?: string;
    specification?: string;
    hsCode?: string;
    quantity?: number;
    unit?: string;
    salesPrice?: number;
    unitPrice?: number;
    currency?: string;
    amount?: number;
    moq?: number;
    leadTime?: string;
  }>;
  currency?: string;
  tradeTerms?: {
    incoterms?: string;
    paymentTerms?: string;
    deliveryTime?: string;
    packing?: string;
    portOfLoading?: string;
    portOfDestination?: string;
    warranty?: string;
    inspection?: string;
  };
  remarks?: string;
  salesPersonName?: string;
  salesPerson?: string;
  salesPersonPhone?: string;
  salesPersonWhatsapp?: string;
  paymentMode?: string | null;
}): QuotationData {
  const adminCompany = buildAdminCompanyProfile();
  const quotationDate = quotation.quotationDate
    || (quotation.createdAt ? new Date(quotation.createdAt).toISOString().split('T')[0] : null)
    || new Date().toISOString().split('T')[0];
  const validUntil = quotation.validUntil
    || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const extractProductSpecCurrency = (item: any) => {
    const text = [
      item?.specification,
      item?.specs,
      item?.description,
      item?.rawSpecification,
    ].map((value) => String(value || '')).join(' ');
    const matched = text.match(/Currency[:：]\s*([A-Z]{3})/i);
    return matched?.[1]?.toUpperCase() || '';
  };
  const explicitCurrency = String(quotation.currency || '').trim().toUpperCase();
  const firstItemCurrency = String(quotation.items?.[0]?.currency || '').trim().toUpperCase();
  const productSpecCurrency = (quotation.items || []).map(extractProductSpecCurrency).find(Boolean) || '';
  const currency = explicitCurrency === 'CNY' && productSpecCurrency === 'USD'
    ? 'USD'
    : explicitCurrency || firstItemCurrency || productSpecCurrency || 'USD';

  return {
    quotationNo: quotation.qtNumber || 'QT-DRAFT',
    quotationDate,
    validUntil,
    inquiryNo: quotation.inqNumber,
    region: quotation.region || 'NA',
    company: {
      name: adminCompany.name,
      nameEn: adminCompany.nameEn,
      address: adminCompany.address,
      addressEn: adminCompany.addressEn,
      tel: adminCompany.tel,
      fax: '',
      email: adminCompany.email,
      website: adminCompany.website,
    },
    customer: {
      companyName: quotation.customerCompany || '',
      contactPerson: quotation.customerName || '',
      address: quotation.customerAddress || '',
      email: quotation.customerEmail || '',
      phone: quotation.customerPhone || '',
    },
    products: (quotation.items || []).map((item, index) => {
      const normalizedCore = resolveFlowProductDisplay(item, 'en');
      const unitPrice = toSafeNumber(item.salesPrice ?? item.unitPrice);
      return {
        no: index + 1,
        modelNo: normalizedCore.modelNo || '-',
        imageUrl: normalizedCore.imageUrl,
        productName: normalizedCore.productName,
        specification: normalizedCore.specification,
        hsCode: normalizedCore.hsCode || '',
        quantity: normalizedCore.quantity,
        unit: normalizedCore.unit || 'PCS',
        unitPrice,
        currency,
        amount: toSafeNumber(item.amount) || normalizedCore.quantity * unitPrice,
        moq: item.moq || 0,
        leadTime: item.leadTime || '',
      };
    }),
    tradeTerms: {
      incoterms: quotation.tradeTerms?.incoterms || 'FOB Xiamen',
      paymentTerms: quotation.tradeTerms?.paymentTerms || '30% T/T deposit, 70% before shipment',
      deliveryTime: quotation.tradeTerms?.deliveryTime || '25-30 days after deposit',
      packing: quotation.tradeTerms?.packing || 'Export carton with pallets',
      portOfLoading: quotation.tradeTerms?.portOfLoading || 'Xiamen, China',
      portOfDestination: quotation.tradeTerms?.portOfDestination || quotation.customerCountry || '',
      warranty: quotation.tradeTerms?.warranty || '12 months from delivery date against manufacturing defects',
      inspection: quotation.tradeTerms?.inspection || "Seller's factory inspection, buyer has the right to re-inspect upon arrival",
    },
    remarks: quotation.remarks || '',
    salesPerson: {
      name: quotation.salesPersonName || 'Sales Representative',
      position: 'Sales Manager',
      email: quotation.salesPerson || '',
      phone: quotation.salesPersonPhone || '+86-592-1234567',
      whatsapp: quotation.salesPersonWhatsapp || '',
    },
  };
}

export function adaptLegacyQuotationToDocumentData(quotation: {
  quotationNumber?: string;
  quotationDate?: string;
  validUntil?: string;
  inquiryNumber?: string;
  region?: string;
  customer?: string;
  customerName?: string;
  customerAddress?: string;
  customerEmail?: string;
  customerPhone?: string;
  products?: Array<{
    productName?: string;
    name?: string;
    specs?: string;
    specification?: string;
    quantity?: number;
    unit?: string;
    unitPrice?: number;
    totalPrice?: number;
    sku?: string;
    image?: string;
  }>;
  currency?: string;
  paymentTerms?: string;
  deliveryTerms?: string;
  notes?: string;
}): QuotationData {
  const adminCompany = buildAdminCompanyProfile();
  const quotationDate = quotation.quotationDate || new Date().toISOString().split('T')[0];
  const validUntil =
    quotation.validUntil
    || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const rawRegion = quotation.region === 'EA' ? 'EU' : quotation.region;
  const region = rawRegion === 'SA' || rawRegion === 'EU' ? rawRegion : 'NA';
  const currency = quotation.currency || 'USD';

  return {
    quotationNo: quotation.quotationNumber || 'QT-DRAFT',
    quotationDate,
    validUntil,
    inquiryNo: quotation.inquiryNumber,
    region,
    company: {
      name: adminCompany.name,
      nameEn: adminCompany.nameEn,
      address: adminCompany.address,
      addressEn: adminCompany.addressEn,
      tel: adminCompany.tel,
      fax: '',
      email: adminCompany.email,
      website: adminCompany.website,
    },
    customer: {
      companyName: quotation.customerName || quotation.customer || '',
      contactPerson: quotation.customerName || quotation.customer || '',
      address: quotation.customerAddress || '',
      email: quotation.customerEmail || '',
      phone: quotation.customerPhone || '',
    },
    products: (quotation.products || []).map((item, index) => {
      const normalizedCore = resolveFlowProductDisplay(item, 'en');
      const unitPrice = toSafeNumber(item.unitPrice);
      return {
        no: index + 1,
        modelNo: normalizedCore.modelNo || '-',
        imageUrl: normalizedCore.imageUrl,
        productName: normalizedCore.productName,
        specification: normalizedCore.specification,
        hsCode: '',
        quantity: normalizedCore.quantity,
        unit: normalizedCore.unit || 'PCS',
        unitPrice,
        currency,
        amount: toSafeNumber(item.totalPrice) || normalizedCore.quantity * unitPrice,
        moq: 0,
        leadTime: '',
      };
    }),
    tradeTerms: {
      incoterms: quotation.deliveryTerms || 'FOB Xiamen',
      paymentTerms: quotation.paymentTerms || '30% T/T deposit, 70% before shipment',
      deliveryTime: '25-30 days after deposit',
      packing: 'Export carton with pallets',
      portOfLoading: 'Xiamen, China',
      portOfDestination: '',
      warranty: '12 months from delivery date against manufacturing defects',
      inspection: "Seller's factory inspection, buyer has the right to re-inspect upon arrival",
    },
    remarks: quotation.notes || '',
    salesPerson: {
      name: 'Sales Representative',
      position: 'Sales Manager',
      email: '',
      phone: '+86-592-1234567',
      whatsapp: '',
    },
  };
}

export function adaptSupplierQuotationToDocumentData(quotation: {
  quotationNo?: string;
  quotationDate?: string;
  validUntil?: string;
  sourceXJ?: string;
  sourceXJNumber?: string;
  inquiryReference?: string;
  supplierCode?: string;
  supplierName?: string;
  supplierCompany?: string;
  supplierEmail?: string;
  supplierPhone?: string;
  supplierAddress?: string;
  items?: Array<{
    modelNo?: string;
    imageUrl?: string;
    productName?: string;
    description?: string;
    specification?: string;
    quantity?: number;
    unit?: string;
    unitPrice?: number | null;
    currency?: string;
    remarks?: string;
  }>;
  paymentTerms?: string;
  paymentMode?: string | null;
  deliveryTerms?: string;
  packingTerms?: string;
  generalRemarks?: string;
  supplierRemarks?: string;
}): SupplierQuotationData {
  const adminCompany = buildAdminCompanyProfile();
  const quotationDate = quotation.quotationDate || new Date().toISOString().split('T')[0];
  const validUntil =
    quotation.validUntil ||
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  return {
    quotationNo: quotation.quotationNo || 'BJ-DRAFT',
    quotationDate,
    validUntil,
    xjReference: quotation.sourceXJNumber || quotation.sourceXJ || '',
    inquiryReference: quotation.inquiryReference || '',
    supplier: {
      companyName: quotation.supplierCompany || quotation.supplierName || '',
      companyNameEn: quotation.supplierCompany || quotation.supplierName || '',
      address: quotation.supplierAddress || '',
      addressEn: quotation.supplierAddress || '',
      tel: quotation.supplierPhone || '',
      email: quotation.supplierEmail || '',
      contactPerson: quotation.supplierName || '',
      supplierCode: quotation.supplierCode || '',
    },
    buyer: {
      name: adminCompany.name,
      nameEn: adminCompany.nameEn,
      address: adminCompany.address,
      addressEn: adminCompany.addressEn,
      tel: adminCompany.tel,
      email: adminCompany.email,
      contactPerson: adminCompany.contactPerson,
    },
    products: (quotation.items || []).map((item, index) => {
      const normalized = resolveFlowProductDisplay(item, inferSupplierDocumentLanguage(quotation));
      return {
        no: index + 1,
        modelNo: getSupplierFacingModelNo(item) || normalized.modelNo || '-',
        imageUrl: normalized.imageUrl || '',
        itemCode: '',
        description: normalized.productName || item.productName || item.description || '',
        specification: normalized.specification || item.specification || '',
        quantity: toSafeNumber(normalized.quantity),
        unit: normalized.unit || item.unit || 'PCS',
        unitPrice: toSafeNumber(item.unitPrice),
        currency: item.currency || 'CNY',
        remarks: normalized.remarks || item.remarks || '',
      };
    }),
    terms: {
      paymentTerms: quotation.paymentTerms || 'T/T 30天',
      deliveryTerms: quotation.deliveryTerms || 'FOB 厦门',
      deliveryTime: '收到订单后30天内',
      deliveryAddress: '福建省福州市仓山区金山工业区',
      moq: '',
      qualityStandard: '符合国家标准',
      warranty: '12个月',
      packaging: quotation.packingTerms || '标准出口包装',
      shippingMarks: '中性唛头',
      remarks: quotation.generalRemarks || '',
    },
    supplierRemarks: quotation.supplierRemarks
      ? {
          content: quotation.supplierRemarks,
          remarkDate: quotationDate,
          remarkBy: quotation.supplierName || '',
        }
      : undefined,
  };
}

export function adaptSalesContractToDocumentData(contract: {
  contractNumber?: string;
  createdAt?: string;
  quotationNumber?: string;
  inquiryNumber?: string;
  region?: 'NA' | 'SA' | 'EA' | 'EU';
  customerCompany?: string;
  customerAddress?: string;
  customerCountry?: string;
  customerName?: string;
  contactPhone?: string;
  customerEmail?: string;
  salesPersonName?: string;
  products?: Array<{
    productName?: string;
    modelNo?: string;
    imageUrl?: string;
    specification?: string;
    hsCode?: string;
    quantity?: number;
    unit?: string;
    unitPrice?: number;
    currency?: string;
    amount?: number;
    deliveryTime?: string;
  }>;
  totalAmount?: number;
  currency?: string;
  tradeTerms?: string;
  paymentTerms?: string;
  paymentMode?: string | null;
  depositAmount?: number;
  balanceAmount?: number;
  deliveryTime?: string;
  portOfLoading?: string;
  portOfDestination?: string;
  packing?: string;
  remarks?: string;
}): SalesContractData {
  const adminCompany = buildAdminCompanyProfile();
  const region = contract.region === 'EA' ? 'EU' : (contract.region || 'NA');
  const totalAmount = toSafeNumber(contract.totalAmount);
  const contractCurrency = String(contract.currency || 'USD').trim().toUpperCase() || 'USD';
  return {
    contractNo: contract.contractNumber || 'SC-DRAFT',
    contractDate: contract.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0],
    quotationNo: contract.quotationNumber,
    region,
    seller: {
      name: adminCompany.name,
      nameEn: adminCompany.nameEn,
      address: adminCompany.address,
      addressEn: adminCompany.addressEn,
      tel: adminCompany.tel,
      fax: '',
      email: adminCompany.email,
      legalRepresentative: adminCompany.contactPerson,
      bankInfo: {
        bankName: adminCompany.bankUSD.bankName,
        accountName: adminCompany.bankUSD.accountName,
        accountNumber: adminCompany.bankUSD.accountNumber,
        swiftCode: adminCompany.bankUSD.swiftCode,
        bankAddress: adminCompany.bankUSD.bankAddress,
        currency: contractCurrency || adminCompany.bankUSD.currency,
        paymentNote: adminCompany.bankUSD.paymentNote,
      },
    },
    buyer: resolveSalesContractBuyerData({
      customerCompany: contract.customerCompany,
      customerName: contract.customerName,
      customerAddress: contract.customerAddress,
      customerCountry: contract.customerCountry,
      contactPerson: contract.contactPerson ?? contract.customerName,
      contactPhone: contract.contactPhone,
      customerEmail: contract.customerEmail,
    }, region),
    products: (contract.products || []).map((item, index) => {
      const normalizedCore = resolveFlowProductDisplay(item, 'en');
      return {
        no: index + 1,
        modelNo: normalizedCore.modelNo || '-',
        imageUrl: normalizedCore.imageUrl,
        description: normalizedCore.productName || '',
        specification: normalizedCore.specification || '',
        hsCode: normalizedCore.hsCode || '',
        quantity: normalizedCore.quantity,
        unit: normalizedCore.unit || 'PCS',
        unitPrice: toSafeNumber(item.unitPrice),
        currency: contractCurrency,
        amount: toSafeNumber(item.amount) || (normalizedCore.quantity * toSafeNumber(item.unitPrice)),
        deliveryTime: item.deliveryTime || '',
      };
    }),
    terms: {
      totalAmount,
      currency: contractCurrency,
      tradeTerms: contract.tradeTerms || 'FOB Xiamen',
      paymentTerms: contract.paymentTerms || '30% T/T deposit, 70% before shipment',
      depositAmount: toSafeNumber(contract.depositAmount),
      balanceAmount: toSafeNumber(contract.balanceAmount),
      deliveryTime: contract.deliveryTime || '25-30 days after deposit received',
      portOfLoading: contract.portOfLoading || 'Xiamen, China',
      portOfDestination: contract.portOfDestination || '',
      packing: contract.packing || 'Export standard carton',
      inspection: 'Seller inspection before shipment; buyer may reinspect upon arrival',
      warranty: '12 months from shipment for manufacturing defects',
    },
    signature: {
      sellerSignatory: contract.salesPersonName || 'Sales Manager',
      buyerSignatory: contract.customerName || contract.customerCompany || '',
      signDate: contract.createdAt?.split('T')[0],
    },
    remarks: contract.remarks || '',
  };
}

const buildFlowGoodsDescription = (product: any) => {
  const normalized = resolveFlowProductDisplay(product, 'en');
  return [
    normalized.modelNo ? `Model ${normalized.modelNo}` : '',
    normalized.productName,
    normalized.specification,
  ]
    .filter(Boolean)
    .join(' / ');
};

const resolvePackageMetrics = (product: any, quantity: number) => {
  const qtyPerCarton = Math.max(
    1,
    toSafeNumber(
      product?.qtyPerCarton ??
      product?.pcsPerCarton ??
      product?.unitsPerCarton ??
      product?.packingQty,
    ) || 1,
  );
  const totalCartons = Math.max(1, Math.ceil(quantity / qtyPerCarton));
  const netWeightPerCarton = toSafeNumber(
    product?.cartonNetWeight ??
    product?.netWeightPerCarton ??
    product?.netWeight ??
    product?.net_weight,
  ) || 12;
  const grossWeightPerCarton = toSafeNumber(
    product?.cartonGrossWeight ??
    product?.grossWeightPerCarton ??
    product?.grossWeight ??
    product?.gross_weight,
  ) || Math.max(netWeightPerCarton + 2, 14);
  const cbmPerCarton = toSafeNumber(
    product?.cbmPerCarton ??
    product?.measurementPerCarton ??
    product?.cbm ??
    product?.measurement,
  ) || 0.08;

  return {
    qtyPerCarton,
    totalCartons,
    netWeightPerCarton,
    grossWeightPerCarton,
    cbmPerCarton,
    totalNW: totalCartons * netWeightPerCarton,
    totalGW: totalCartons * grossWeightPerCarton,
    totalCBM: totalCartons * cbmPerCarton,
  };
};

export function adaptSalesContractToCommercialInvoice(
  contract: any,
  shipmentLike?: any,
): CommercialInvoiceData {
  const adminCompany = buildAdminCompanyProfile();
  const goods = (contract?.products || []).map((item: any, index: number) => {
    const normalized = resolveFlowProductDisplay(item, 'en');
    const quantity = normalized.quantity;
    const unitPrice = toSafeNumber(item?.unitPrice);
    const amount = toSafeNumber(item?.amount) || quantity * unitPrice;
    const metrics = resolvePackageMetrics(item, quantity);
    return {
      no: index + 1,
      description: buildFlowGoodsDescription(item) || normalized.productName || `Product ${index + 1}`,
      hsCode: normalized.hsCode || '',
      quantity,
      unit: (normalized.unit || 'PCS').toUpperCase(),
      unitPrice,
      currency: item?.currency || contract?.currency || 'USD',
      amount,
      grossWeight: Number((metrics.totalGW / Math.max(quantity, 1)).toFixed(3)),
      netWeight: Number((metrics.totalNW / Math.max(quantity, 1)).toFixed(3)),
      measurement: Number((metrics.totalCBM / Math.max(quantity, 1)).toFixed(4)),
    };
  });

  const totalCartons = goods.reduce((sum, item, index) => {
    const metrics = resolvePackageMetrics(contract?.products?.[index], item.quantity);
    return sum + metrics.totalCartons;
  }, 0);
  const totalGrossWeight = goods.reduce((sum, item) => sum + (item.grossWeight || 0) * item.quantity, 0);
  const totalNetWeight = goods.reduce((sum, item) => sum + (item.netWeight || 0) * item.quantity, 0);
  const totalMeasurement = goods.reduce((sum, item) => sum + (item.measurement || 0) * item.quantity, 0);

  return {
    invoiceNo: String(shipmentLike?.invoiceNo || `CI-${contract?.contractNumber || contract?.id || 'DRAFT'}`),
    invoiceDate: String(shipmentLike?.invoiceDate || contract?.createdAt || new Date().toISOString()).slice(0, 10),
    contractNo: contract?.contractNumber || contract?.id || '',
    exporter: {
      name: adminCompany.name,
      nameEn: adminCompany.nameEn,
      address: adminCompany.address,
      addressEn: adminCompany.addressEn,
      tel: adminCompany.tel,
    },
    importer: {
      name: contract?.customerCompany || contract?.customerName || '',
      address: contract?.customerAddress || '',
      country: contract?.customerCountry || '',
      tel: contract?.contactPhone || '',
    },
    shippingMarks: {
      mainMark: `${contract?.customerCompany || 'COSUN'}-${String(contract?.contractNumber || '').slice(-4) || '0001'}`.slice(0, 40),
      sideMark: `C/NO. 1-${Math.max(totalCartons, 1)}`,
      cautionMark: 'MADE IN CHINA',
    },
    goods,
    shipping: {
      tradeTerms: contract?.tradeTerms || 'FOB Xiamen',
      paymentTerms: contract?.paymentTerms || '30% T/T deposit, 70% before shipment',
      portOfLoading: contract?.portOfLoading || 'Xiamen, China',
      portOfDischarge: shipmentLike?.portOfDischarge || contract?.portOfDestination || '',
      finalDestination: shipmentLike?.finalDestination || contract?.portOfDestination || '',
      vesselName: shipmentLike?.vesselName,
      voyageNo: shipmentLike?.voyageNo,
      blNo: shipmentLike?.blNo,
    },
    packing: {
      totalCartons: Math.max(totalCartons, 1),
      totalGrossWeight: Number(totalGrossWeight.toFixed(2)),
      totalNetWeight: Number(totalNetWeight.toFixed(2)),
      totalMeasurement: Number(totalMeasurement.toFixed(3)),
    },
  };
}

export function adaptSalesContractToPackingList(
  contract: any,
  shipmentLike?: any,
): PackingListData {
  const adminCompany = buildAdminCompanyProfile();
  const packages = (contract?.products || []).map((item: any, index: number) => {
    const normalized = resolveFlowProductDisplay(item, 'en');
    const quantity = normalized.quantity;
    const metrics = resolvePackageMetrics(item, quantity);
    const cartonStart = packagesCartonStart(index, contract?.products || []);
    const cartonEnd = cartonStart + metrics.totalCartons - 1;

    return {
      cartonNo: metrics.totalCartons <= 1 ? `${cartonStart}` : `${cartonStart}-${cartonEnd}`,
      description: buildFlowGoodsDescription(item) || normalized.productName || `Product ${index + 1}`,
      qtyPerCarton: metrics.qtyPerCarton,
      totalCartons: metrics.totalCartons,
      totalQty: quantity,
      unit: (normalized.unit || 'PCS').toUpperCase(),
      netWeight: Number(metrics.netWeightPerCarton.toFixed(2)),
      grossWeight: Number(metrics.grossWeightPerCarton.toFixed(2)),
      measurement: Number(metrics.cbmPerCarton.toFixed(3)),
      totalNW: Number(metrics.totalNW.toFixed(2)),
      totalGW: Number(metrics.totalGW.toFixed(2)),
      totalCBM: Number(metrics.totalCBM.toFixed(3)),
    };
  });

  return {
    plNo: String(shipmentLike?.plNo || `PL-${contract?.contractNumber || contract?.id || 'DRAFT'}`),
    invoiceNo: String(shipmentLike?.invoiceNo || `CI-${contract?.contractNumber || contract?.id || 'DRAFT'}`),
    date: String(shipmentLike?.date || contract?.createdAt || new Date().toISOString()).slice(0, 10),
    exporter: {
      name: adminCompany.nameEn || adminCompany.name,
      address: adminCompany.addressEn || adminCompany.address,
    },
    importer: {
      name: contract?.customerCompany || contract?.customerName || '',
      address: contract?.customerAddress || '',
    },
    shippingMarks: `${contract?.customerCompany || 'COSUN'}\n${contract?.portOfDestination || ''}\nMADE IN CHINA`,
    packages,
    shipping: {
      portOfLoading: contract?.portOfLoading || 'Xiamen, China',
      portOfDischarge: shipmentLike?.portOfDischarge || contract?.portOfDestination || '',
      vesselName: shipmentLike?.vesselName,
      blNo: shipmentLike?.blNo,
    },
  };
}

function packagesCartonStart(index: number, products: any[]) {
  let start = 1;
  for (let i = 0; i < index; i += 1) {
    const previous = products[i];
    const previousQuantity = normalizeFlowProductCore(previous).quantity;
    const previousMetrics = resolvePackageMetrics(previous, previousQuantity);
    start += previousMetrics.totalCartons;
  }
  return start;
}

/**
 * 从客户名称或国家推断区域
 */
function detectRegionFromCustomer(customerName: string, customerCountry?: string): 'NA' | 'SA' | 'EU' {
  const name = customerName.toLowerCase();
  const country = (customerCountry || '').toLowerCase();
  
  // 北美
  if (name.includes('usa') || name.includes('canada') || name.includes('america') ||
      country.includes('usa') || country.includes('canada') || country.includes('united states')) {
    return 'NA';
  }
  
  // 南美
  if (name.includes('brazil') || name.includes('argentina') || name.includes('chile') ||
      country.includes('brazil') || country.includes('argentina') || country.includes('chile')) {
    return 'SA';
  }
  
  // 欧洲
  if (name.includes('gmbh') || name.includes('sarl') || name.includes('ltd') ||
      country.includes('germany') || country.includes('france') || country.includes('uk')) {
    return 'EU';
  }
  
  // 默认北美
  return 'NA';
}

/**
 * 根据区域推断国家
 */
function detectCountryFromRegion(region: 'NA' | 'SA' | 'EU'): string {
  switch (region) {
    case 'NA': return 'United States';
    case 'SA': return 'Brazil';
    case 'EU': return 'Germany';
    default: return 'To be confirmed';
  }
}

/**
 * 根据区域确定价格术语
 */
function determinePriceTerm(region: 'NA' | 'SA' | 'EU'): string {
  switch (region) {
    case 'NA': return 'FOB Xiamen';
    case 'SA': return 'CIF Santos';
    case 'EU': return 'CIF Hamburg';
    default: return 'FOB Xiamen';
  }
}

/**
 * 根据区域确定目的港
 */
function determineDestinationPort(region: 'NA' | 'SA' | 'EU'): string {
  switch (region) {
    case 'NA': return 'Los Angeles, USA';
    case 'SA': return 'Santos, Brazil';
    case 'EU': return 'Hamburg, Germany';
    default: return 'To be confirmed';
  }
}

/**
 * 计算交货天数
 */
function calculateDeliveryDays(orderDate: string, expectedDelivery: string): number {
  const start = new Date(orderDate);
  const end = new Date(expectedDelivery);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * 🔥 报价数据 → 形式发票数据适配器（如需要可添加）
 */
export function adaptQuotationToProformaInvoice(quotationData: any): any {
  // TODO: 实现报价单到形式发票的转换
  return quotationData;
}

/**
 * 🔥 发货数据 → 商业发票数据适配器（如需要可添加）
 */
export function adaptShipmentToCommercialInvoice(shipmentData: any): any {
  return adaptSalesContractToCommercialInvoice(shipmentData?.contract || shipmentData, shipmentData);
}
