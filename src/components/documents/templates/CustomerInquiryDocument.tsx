import React, { forwardRef } from 'react';
import type { DocumentLayoutConfig } from '../A4PageContainer';
import type { InquiryOemData } from '../../../types/oem';
import type { PaymentMode } from '../../../contexts/SalesQuotationContext';
import { buildPaymentTermsTextEn, deriveBalanceTrigger, type BalanceTrigger } from '../../../lib/paymentFlow';

/**
 * 📋 客户询价单文档模板 - Taiwan Enterprise Style
 * 
 * 业务场景：
 * 1. 客户通过社媒/网站/邮件发送询价
 * 2. 运营专员录入系统
 * 3. 生成标准化的询价单文档
 * 4. 分配给业务员进行报价
 * 
 * 数据来源：
 * - KV Store: inquiry_{inquiryNo}
 * - 包含客户信息、产品需求、交期要求等
 * 
 * 输出格式：
 * - 台湾大厂专业风格，黑白灰配色
 * - 紧凑表格化布局
 * - 符合国际商业惯例
 */

export interface CustomerInquiryData {
  // 询价单基本信息
  inquiryNo: string;           // ING-NA-20251210-001
  inquiryDate: string;         // 2025-12-10
  region: 'NA' | 'SA' | 'EU';  // 区域
  
  // 客户信息
  customer: {
    companyName: string;       // ABC Trading Corp.
    contactPerson: string;     // John Smith
    position?: string;         // Purchasing Manager
    email: string;             // john@abc.com
    phone?: string;            // +1-xxx-xxx-xxxx
    address?: string;          // 123 Main St, Los Angeles, CA 90001
    country: string;           // United States
  };
  
  // 产品需求列表
  products: Array<{
    no: number;                // 序号
    modelNo?: string;          // 型号
    imageUrl?: string;         // 产品图片
    productName: string;       // GFCI Outlet
    specification?: string;    // 20A, 125V, Tamper-Resistant
    quantity: number;          // 5000
    unit: string;              // pcs
    targetPrice?: number;      // 2.50
    currency?: string;         // USD
    description?: string;      // 额外说明
  }>;
  
  // 交易要求
  requirements?: {
    incoterm?: string;
    locationLabel?: string;
    locationValue?: string;
    finalDestinationPlan?: string;
    deliveryTime?: string;     // "Before March 2025"
    portOfDestination?: string; // "Los Angeles"
    paymentTerms?: string;     // "T/T or L/C"
    tradeTerms?: string;       // "FOB / CIF"
    paymentMode?: PaymentMode | '';
    balanceTrigger?: BalanceTrigger | '';
    documentReleasePreference?: string;
    lcType?: string;
    creditDays?: string;
    businessScenario?: string;
    businessScenarioNotes?: string;
    insuranceRequirement?: string;
    packingRequirements?: string; // 包装要求
    certifications?: string[];  // ["UL", "FCC", "CE"]
    otherRequirements?: string; // 其他要求
  };

  // OEM 分支（内部流程字段，不直接由客户决定下游是否转发）
  oem?: InquiryOemData;

  templateSettings?: {
    productTableColumns?: CustomerInquiryProductTableColumn[];
    typography?: CustomerInquiryTypographySettings;
  };
  
  // 备注
  remarks?: string;
  
  // 来源信息（后台字段，不显示在文档上）
  source?: string;             // 'Facebook' | 'Website' | 'Email'
  assignedTo?: string;         // 分配的业务员
  status?: string;             // 询价状态（后台用）
}

export interface CustomerInquiryRequirementRow {
  key: keyof NonNullable<CustomerInquiryData['requirements']>;
  label: string;
  value: string;
}

const splitRequirementLabel = (label: string) => {
  const match = String(label || '').match(/^(\d+\.)\s*(.*)$/);
  if (!match) {
    return { indexLabel: '', titleLabel: label };
  }
  return {
    indexLabel: match[1],
    titleLabel: match[2],
  };
};

export type CustomerInquiryProductTableColumnKey =
  | 'no'
  | 'modelNo'
  | 'image'
  | 'itemNameSpecification'
  | 'quantity'
  | 'unit'
  | 'targetPrice'
  | 'estimatedValue';

export interface CustomerInquiryProductTableColumn {
  key: CustomerInquiryProductTableColumnKey;
  label: string;
  widthPercent: number;
}

export interface CustomerInquiryTypographySettings {
  headerTitlePt?: number;
  headerTitleFontFamily?: string;
  headerMetaPt?: number;
  headerMetaFontFamily?: string;
  sectionTitlePt?: number;
  sectionTitleFontFamily?: string;
  customerSectionHeaderPt?: number;
  customerSectionHeaderFontFamily?: string;
  customerBodyPt?: number;
  customerBodyFontFamily?: string;
  productHeaderPt?: number;
  productHeaderFontFamily?: string;
  productBodyPt?: number;
  productBodyFontFamily?: string;
  productSpecPt?: number;
  productSpecFontFamily?: string;
  productSummaryPt?: number;
  productSummaryFontFamily?: string;
  requirementIndexPt?: number;
  requirementIndexFontFamily?: string;
  requirementLabelPt?: number;
  requirementLabelFontFamily?: string;
  requirementValuePt?: number;
  requirementValueFontFamily?: string;
  footerPt?: number;
  footerFontFamily?: string;
}

export interface CustomerInquiryRequirementField {
  key: keyof NonNullable<CustomerInquiryData['requirements']>;
  sourceLabel: string;
  previewLabel: string;
  description: string;
  placeholder: string;
  type: 'input' | 'textarea';
  rows?: number;
}

export type CustomerInquiryRequirementFormFields = {
  [K in keyof NonNullable<CustomerInquiryData['requirements']>]: string;
};

export type TradeTermCode = 'EXW' | 'FCA' | 'FOB' | 'CFR' | 'CIF' | 'CPT' | 'CIP' | 'DAP' | 'DDP';

export type DocumentReleasePreference =
  | 'original_bl_required'
  | 'telex_release_accepted'
  | 'either_acceptable';

export const CUSTOMER_TRADE_TERM_OPTIONS: Array<{
  value: TradeTermCode;
  label: string;
  code: string;
  description: string;
}> = [
  { value: 'EXW', code: 'EXW', description: 'Ex Works', label: 'EXW - Ex Works' },
  { value: 'FCA', code: 'FCA', description: 'Free Carrier', label: 'FCA - Free Carrier' },
  { value: 'FOB', code: 'FOB', description: 'Free On Board', label: 'FOB - Free On Board' },
  { value: 'CFR', code: 'CFR', description: 'Cost and Freight', label: 'CFR - Cost and Freight' },
  { value: 'CIF', code: 'CIF', description: 'Cost, Insurance and Freight', label: 'CIF - Cost, Insurance and Freight' },
  { value: 'CPT', code: 'CPT', description: 'Carriage Paid To', label: 'CPT - Carriage Paid To' },
  { value: 'CIP', code: 'CIP', description: 'Carriage and Insurance Paid To', label: 'CIP - Carriage and Insurance Paid To' },
  { value: 'DAP', code: 'DAP', description: 'Delivered at Place', label: 'DAP - Delivered at Place' },
  { value: 'DDP', code: 'DDP', description: 'Delivered Duty Paid', label: 'DDP - Delivered Duty Paid' },
];

export const CUSTOMER_PAYMENT_METHOD_OPTIONS: Array<{ value: PaymentMode; label: string }> = [
  { value: 'tt_deposit_balance_before_shipment', label: 'T/T Deposit + Balance Before Shipment' },
  { value: 'tt_deposit_balance_against_bl', label: 'T/T Deposit + Balance Against B/L Copy' },
  { value: 'tt_100_before_production', label: '100% T/T Before Production' },
  { value: 'deposit_plus_lc', label: 'Deposit + L/C At Sight' },
  { value: 'lc_100', label: '100% L/C At Sight' },
  { value: 'dp', label: 'D/P' },
  { value: 'da', label: 'D/A' },
];

const PAYMENT_METHOD_WITH_CREDIT_DAYS = new Set<PaymentMode>(['da', 'oa']);

export const CUSTOMER_DOCUMENT_RELEASE_OPTIONS: Array<{ value: DocumentReleasePreference; label: string }> = [
  { value: 'original_bl_required', label: 'Original B/L required' },
  { value: 'telex_release_accepted', label: 'Telex Release accepted' },
  { value: 'either_acceptable', label: 'Either is acceptable' },
];

const PAYMENT_METHOD_WITH_LC_FOR_DOCUMENT = new Set<PaymentMode>(['deposit_plus_lc', 'lc_100']);

export const getCustomerDocumentReleasePreferenceLabel = (value?: string | null) =>
  CUSTOMER_DOCUMENT_RELEASE_OPTIONS.find((option) => option.value === value)?.label ||
  String(value || '').trim();

export const CUSTOMER_LC_TYPE_OPTIONS = [
  { value: 'at_sight', label: 'At Sight' },
  { value: 'usance', label: 'Usance' },
] as const;

export const CUSTOMER_BUSINESS_SCENARIO_OPTIONS = [
  { value: 'mold_development', label: 'Mold development' },
  { value: 'custom_product', label: 'Custom product' },
  { value: 'sample_to_production', label: 'Sample-to-production conversion' },
  { value: 'common_goods', label: 'Common goods' },
] as const;

export const CUSTOMER_PACKING_PRESET_OPTIONS = [
  'Export carton',
  'Pallet',
  'SKU label',
  'Barcode label',
  'Neutral packing',
] as const;

export const CUSTOMER_CERTIFICATION_OPTIONS = [
  'UL',
  'ETL',
  'CE',
  'FCC',
  'RoHS',
  'REACH',
  'BSCI',
] as const;

export const getTradeTermLocationConfig = (incoterm?: string | null) => {
  switch (String(incoterm || '').trim().toUpperCase()) {
    case 'EXW':
      return {
        label: 'Pickup Address',
        placeholder: 'Example: Factory address in Xiamen, China',
      };
    case 'FCA':
      return {
        label: 'Handover Location',
        placeholder: 'Example: Forwarder warehouse, airport terminal, or carrier pickup point',
      };
    case 'FOB':
      return {
        label: 'Port of Loading',
        placeholder: 'Example: Xiamen Port, China',
      };
    case 'CFR':
    case 'CIF':
      return {
        label: 'Destination Port',
        placeholder: 'Example: Los Angeles Port, USA',
      };
    case 'CPT':
    case 'CIP':
      return {
        label: 'Destination Airport',
        placeholder: 'Example: Dubai International Airport, UAE',
      };
    case 'DAP':
    case 'DDP':
      return {
        label: 'Delivery Address',
        placeholder: 'Example: 123 Harbor Road, Houston, TX 77001, USA',
      };
    default:
      return {
        label: 'Location Requirement',
        placeholder: 'Enter the required pickup, port, or delivery location',
      };
  }
};

export const buildTradeTermsDisplay = (incoterm?: string | null, locationValue?: string | null) => {
  const code = String(incoterm || '').trim().toUpperCase();
  const location = String(locationValue || '').trim();
  if (!code) return '';
  return location ? `${code} ${location}` : code;
};

const normalizeLocationComparisonValue = (value?: string | null) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[()]/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\b(port|airport|seaport|harbor|harbour|terminal|intl|international)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export const shouldDisplayFinalDestination = (
  fields: Partial<CustomerInquiryRequirementFormFields> | null | undefined,
) => {
  const locationValue = String(fields?.locationValue || '').trim();
  const finalDestination = String(fields?.finalDestinationPlan || '').trim();
  if (!finalDestination) return false;
  if (!locationValue) return true;
  return normalizeLocationComparisonValue(locationValue) !== normalizeLocationComparisonValue(finalDestination);
};

export const buildCustomerInquiryPaymentPreview = (
  fields: Partial<CustomerInquiryRequirementFormFields> | null | undefined,
) => {
  const paymentMode = String(fields?.paymentMode || '').trim() as PaymentMode;
  const explicitTrigger = String(fields?.balanceTrigger || '').trim() as BalanceTrigger;
  return buildPaymentTermsTextEn(
    paymentMode || null,
    explicitTrigger || deriveBalanceTrigger(paymentMode || null, null),
    {
      lcType: fields?.lcType,
      creditDays: fields?.creditDays,
    },
  );
};

export const buildCustomerTradingSummary = (
  fields: Partial<CustomerInquiryRequirementFormFields> | null | undefined,
) => {
  const documentReleaseLabel = getCustomerDocumentReleasePreferenceLabel(fields?.documentReleasePreference);

  return [
    buildTradeTermsDisplay(fields?.incoterm, fields?.locationValue),
    shouldDisplayFinalDestination(fields) ? String(fields?.finalDestinationPlan || '').trim() : '',
    String(fields?.deliveryTime || '').trim(),
    buildCustomerInquiryPaymentPreview(fields),
    documentReleaseLabel,
  ].filter(Boolean).join(' | ');
};

export const buildCustomerInquiryTotalValueLabel = (
  requirements: Partial<CustomerInquiryRequirementFormFields> | null | undefined,
  currency?: string | null,
) => {
  const incoterm = String(requirements?.incoterm || '').trim().toUpperCase();
  const location = String(requirements?.locationValue || '').trim();
  const normalizedCurrency = String(currency || '').trim().toUpperCase() || 'USD';
  const tradeTermLabel = incoterm
    ? `Total ${incoterm}${location ? ` (${location})` : ''} Value`
    : 'Total Value';
  return `${tradeTermLabel} (${normalizedCurrency})`;
};

export const syncCustomerInquiryRequirementFields = (
  raw: Partial<CustomerInquiryRequirementFormFields> | null | undefined,
): CustomerInquiryRequirementFormFields => {
  const normalized = normalizeCustomerInquiryRequirementFields(raw);
  const locationConfig = getTradeTermLocationConfig(normalized.incoterm);
  const normalizedLcType = PAYMENT_METHOD_WITH_LC_FOR_DOCUMENT.has(normalized.paymentMode)
    ? 'at_sight'
    : '';
  const nextBalanceTrigger = deriveBalanceTrigger(
    (normalized.paymentMode || 'tt_deposit_balance_before_shipment') as PaymentMode,
    normalized.balanceTrigger || null,
  );

  return {
    ...normalized,
    lcType: normalizedLcType,
    locationLabel: locationConfig.label,
    tradeTerms: buildTradeTermsDisplay(normalized.incoterm, normalized.locationValue),
    portOfDestination: locationConfig.label === 'Destination Port'
      ? normalized.locationValue
      : normalized.finalDestinationPlan,
    balanceTrigger: nextBalanceTrigger,
    paymentTerms: buildCustomerInquiryPaymentPreview({
      ...normalized,
      lcType: normalizedLcType,
      balanceTrigger: nextBalanceTrigger,
    }),
  };
};

export const DEFAULT_CUSTOMER_INQUIRY_REQUIREMENT_FIELDS: CustomerInquiryRequirementFormFields = {
  incoterm: 'FOB',
  locationLabel: '',
  locationValue: '',
  finalDestinationPlan: '',
  tradeTerms: 'FOB',
  deliveryTime: '',
  portOfDestination: '',
  paymentTerms: buildPaymentTermsTextEn('tt_deposit_balance_before_shipment', 'before_shipment'),
  paymentMode: 'tt_deposit_balance_before_shipment',
  balanceTrigger: 'before_shipment',
  documentReleasePreference: 'telex_release_accepted',
  lcType: '',
  creditDays: '',
  businessScenario: '',
  businessScenarioNotes: '',
  insuranceRequirement: '',
  packingRequirements: '',
  certifications: '',
  otherRequirements: '',
};

export const DEFAULT_CUSTOMER_INQUIRY_PRODUCT_TABLE_COLUMNS: CustomerInquiryProductTableColumn[] = [
  { key: 'no', label: 'No.', widthPercent: 5 },
  { key: 'modelNo', label: 'Model No.', widthPercent: 16 },
  { key: 'image', label: 'Image', widthPercent: 10 },
  { key: 'itemNameSpecification', label: 'Item Name / Specification', widthPercent: 27.5 },
  { key: 'quantity', label: 'Quantity', widthPercent: 10 },
  { key: 'unit', label: 'Unit', widthPercent: 8 },
  { key: 'targetPrice', label: 'Target Price', widthPercent: 11 },
  { key: 'estimatedValue', label: 'Subtotal Value', widthPercent: 12.5 },
];

export const CUSTOMER_INQUIRY_FONT_FAMILY_OPTIONS = [
  { value: 'Arial, "Helvetica Neue", sans-serif', label: 'Arial' },
  { value: '"Helvetica Neue", Helvetica, Arial, sans-serif', label: 'Helvetica' },
  { value: 'Verdana, Geneva, sans-serif', label: 'Verdana' },
  { value: 'Tahoma, Geneva, sans-serif', label: 'Tahoma' },
  { value: 'Georgia, "Times New Roman", serif', label: 'Georgia' },
  { value: '"Times New Roman", Times, serif', label: 'Times New Roman' },
] as const;

const DEFAULT_CUSTOMER_INQUIRY_FONT_FAMILY = CUSTOMER_INQUIRY_FONT_FAMILY_OPTIONS[0].value;

export const CUSTOMER_INQUIRY_REQUIREMENT_FIELDS: CustomerInquiryRequirementField[] = [
  {
    key: 'tradeTerms',
    sourceLabel: 'Price Terms',
    previewLabel: 'Trade Terms',
    description: 'How the price should be quoted, such as EXW, FOB, CIF, or DDP.',
    placeholder: 'Example: FOB Xiamen / CIF Los Angeles',
    type: 'input',
  },
  {
    key: 'deliveryTime',
    sourceLabel: 'Delivery Time',
    previewLabel: 'Delivery Time',
    description: 'Expected lead time or target shipment window.',
    placeholder: 'Example: Within 30 days after order confirmation',
    type: 'input',
  },
  {
    key: 'portOfDestination',
    sourceLabel: 'Destination Port',
    previewLabel: 'Port of Destination',
    description: 'Where the goods should be delivered or shipped to.',
    placeholder: 'Example: Los Angeles / Jebel Ali / Door delivery to Houston',
    type: 'input',
  },
  {
    key: 'paymentTerms',
    sourceLabel: 'Payment Terms',
    previewLabel: 'Payment Terms',
    description: 'Preferred settlement method and deposit arrangement.',
    placeholder: `Example: ${buildPaymentTermsTextEn('tt_deposit_balance_before_shipment', 'before_shipment')}`,
    type: 'input',
  },
  {
    key: 'packingRequirements',
    sourceLabel: 'Packing request',
    previewLabel: 'Packing request',
    description: 'Carton, pallet, labeling, barcode, or packaging details.',
    placeholder: 'Example: Export cartons with pallet, each carton with SKU label',
    type: 'textarea',
    rows: 3,
  },
  {
    key: 'certifications',
    sourceLabel: 'Certificate request',
    previewLabel: 'Certificate request',
    description: 'Compliance or test standards needed for this inquiry.',
    placeholder: 'Example: UL, ETL, CE, FCC, RoHS',
    type: 'textarea',
    rows: 3,
  },
  {
    key: 'otherRequirements',
    sourceLabel: 'Extra request',
    previewLabel: 'Extra request',
    description: 'Any other commercial or technical condition to show in the document.',
    placeholder: 'Example: Need logo printing, English manual, and sample approval before mass production',
    type: 'textarea',
    rows: 4,
  },
];

export const normalizeCustomerInquiryProductTableColumns = (
  value?: CustomerInquiryProductTableColumn[] | null,
): CustomerInquiryProductTableColumn[] => {
  const fallbackMap = new Map(
    DEFAULT_CUSTOMER_INQUIRY_PRODUCT_TABLE_COLUMNS.map((column) => [column.key, column]),
  );
  const legacyLabelAliases: Partial<Record<CustomerInquiryProductTableColumnKey, string[]>> = {
    modelNo: ['Model#', 'Model No', 'Model Number'],
  };
  const canonicalWidths: Partial<Record<CustomerInquiryProductTableColumnKey, number>> = {
    no: 5,
    modelNo: 16,
    image: 10,
    itemNameSpecification: 27.5,
    quantity: 10,
    unit: 8,
    targetPrice: 11,
    estimatedValue: 12.5,
  };
  const incoming = Array.isArray(value) ? value : [];
  const normalized = DEFAULT_CUSTOMER_INQUIRY_PRODUCT_TABLE_COLUMNS.map((fallbackColumn) => {
    const matched = incoming.find((column) => column?.key === fallbackColumn.key);
    const widthPercent = Number(matched?.widthPercent);
    const preferredLabel = fallbackColumn.label;
    const preferredWidth = canonicalWidths[fallbackColumn.key] || fallbackColumn.widthPercent;
    const incomingLabel = String(matched?.label || '').trim();
    const normalizedLabel = incomingLabel && legacyLabelAliases[fallbackColumn.key]?.includes(incomingLabel)
      ? preferredLabel
      : incomingLabel;

    return {
      key: fallbackColumn.key,
      label: normalizedLabel || preferredLabel,
      widthPercent: Number.isFinite(widthPercent) ? Math.max(4, widthPercent) : preferredWidth,
    };
  });

  const total = normalized.reduce((sum, column) => sum + column.widthPercent, 0) || 100;

  return normalized.map((column, index) => {
    if (index === normalized.length - 1) {
      const allocated = normalized
        .slice(0, -1)
        .reduce((sum, item) => sum + Number(((item.widthPercent / total) * 100).toFixed(2)), 0);
      return {
        ...column,
        widthPercent: Number((100 - allocated).toFixed(2)),
      };
    }

    return {
      ...column,
      widthPercent: Number(((column.widthPercent / total) * 100).toFixed(2)),
    };
  }).map((column) => ({
    ...column,
    label: fallbackMap.get(column.key)?.label && !column.label ? fallbackMap.get(column.key)!.label : column.label,
  }));
};

export const DEFAULT_CUSTOMER_INQUIRY_TYPOGRAPHY: Required<CustomerInquiryTypographySettings> = {
  headerTitlePt: 24,
  headerTitleFontFamily: DEFAULT_CUSTOMER_INQUIRY_FONT_FAMILY,
  headerMetaPt: 10,
  headerMetaFontFamily: DEFAULT_CUSTOMER_INQUIRY_FONT_FAMILY,
  sectionTitlePt: 14,
  sectionTitleFontFamily: DEFAULT_CUSTOMER_INQUIRY_FONT_FAMILY,
  customerSectionHeaderPt: 11,
  customerSectionHeaderFontFamily: DEFAULT_CUSTOMER_INQUIRY_FONT_FAMILY,
  customerBodyPt: 10,
  customerBodyFontFamily: DEFAULT_CUSTOMER_INQUIRY_FONT_FAMILY,
  productHeaderPt: 10,
  productHeaderFontFamily: DEFAULT_CUSTOMER_INQUIRY_FONT_FAMILY,
  productBodyPt: 10,
  productBodyFontFamily: DEFAULT_CUSTOMER_INQUIRY_FONT_FAMILY,
  productSpecPt: 9,
  productSpecFontFamily: DEFAULT_CUSTOMER_INQUIRY_FONT_FAMILY,
  productSummaryPt: 10,
  productSummaryFontFamily: DEFAULT_CUSTOMER_INQUIRY_FONT_FAMILY,
  requirementIndexPt: 10,
  requirementIndexFontFamily: DEFAULT_CUSTOMER_INQUIRY_FONT_FAMILY,
  requirementLabelPt: 10,
  requirementLabelFontFamily: DEFAULT_CUSTOMER_INQUIRY_FONT_FAMILY,
  requirementValuePt: 10,
  requirementValueFontFamily: DEFAULT_CUSTOMER_INQUIRY_FONT_FAMILY,
  footerPt: 9,
  footerFontFamily: DEFAULT_CUSTOMER_INQUIRY_FONT_FAMILY,
};

export const normalizeCustomerInquiryTypography = (
  value?: CustomerInquiryTypographySettings | null,
): Required<CustomerInquiryTypographySettings> => {
  const next = value || {};
  const read = <K extends keyof CustomerInquiryTypographySettings>(key: K) => {
    const numeric = Number(next[key]);
    return Number.isFinite(numeric) && numeric > 0
      ? numeric
      : DEFAULT_CUSTOMER_INQUIRY_TYPOGRAPHY[key];
  };
  const readFont = <K extends keyof CustomerInquiryTypographySettings>(key: K) => {
    const fontValue = String(next[key] || '').trim();
    return fontValue || DEFAULT_CUSTOMER_INQUIRY_TYPOGRAPHY[key];
  };

  return {
    headerTitlePt: read('headerTitlePt'),
    headerTitleFontFamily: readFont('headerTitleFontFamily'),
    headerMetaPt: read('headerMetaPt'),
    headerMetaFontFamily: readFont('headerMetaFontFamily'),
    sectionTitlePt: read('sectionTitlePt'),
    sectionTitleFontFamily: readFont('sectionTitleFontFamily'),
    customerSectionHeaderPt: read('customerSectionHeaderPt'),
    customerSectionHeaderFontFamily: readFont('customerSectionHeaderFontFamily'),
    customerBodyPt: read('customerBodyPt'),
    customerBodyFontFamily: readFont('customerBodyFontFamily'),
    productHeaderPt: read('productHeaderPt'),
    productHeaderFontFamily: readFont('productHeaderFontFamily'),
    productBodyPt: read('productBodyPt'),
    productBodyFontFamily: readFont('productBodyFontFamily'),
    productSpecPt: read('productSpecPt'),
    productSpecFontFamily: readFont('productSpecFontFamily'),
    productSummaryPt: read('productSummaryPt'),
    productSummaryFontFamily: readFont('productSummaryFontFamily'),
    requirementIndexPt: read('requirementIndexPt'),
    requirementIndexFontFamily: readFont('requirementIndexFontFamily'),
    requirementLabelPt: read('requirementLabelPt'),
    requirementLabelFontFamily: readFont('requirementLabelFontFamily'),
    requirementValuePt: read('requirementValuePt'),
    requirementValueFontFamily: readFont('requirementValueFontFamily'),
    footerPt: read('footerPt'),
    footerFontFamily: readFont('footerFontFamily'),
  };
};

export const prepareCustomerInquiryDocumentData = (
  data?: CustomerInquiryData | null,
  options?: {
    templateSettings?: CustomerInquiryData['templateSettings'] | null;
  },
): CustomerInquiryData | null => {
  if (!data) {
    return null;
  }

  const resolvedTemplateSettings =
    options && Object.prototype.hasOwnProperty.call(options, 'templateSettings')
      ? (options.templateSettings ?? data.templateSettings)
      : data.templateSettings;

  return {
    ...data,
    requirements: normalizeCustomerInquiryRequirementFields(data.requirements),
    templateSettings: resolvedTemplateSettings
      ? {
          ...resolvedTemplateSettings,
          productTableColumns: normalizeCustomerInquiryProductTableColumns(
            resolvedTemplateSettings.productTableColumns,
          ),
          typography: normalizeCustomerInquiryTypography(resolvedTemplateSettings.typography),
        }
      : {
          productTableColumns: normalizeCustomerInquiryProductTableColumns(),
          typography: normalizeCustomerInquiryTypography(),
        },
  };
};

export const normalizeCustomerInquiryRequirementFields = (
  value?: Partial<CustomerInquiryRequirementFormFields> | null,
): CustomerInquiryRequirementFormFields => {
  const normalizeSelectionValue = (fieldValue: unknown) => {
    if (Array.isArray(fieldValue)) {
      return fieldValue
        .map((item) => String(item ?? '').trim())
        .filter(Boolean)
        .join(', ');
    }
    return String(fieldValue ?? '').trim();
  };

  const normalizeFreeTextValue = (fieldValue: unknown) => {
    if (Array.isArray(fieldValue)) {
      return fieldValue
        .map((item) => String(item ?? ''))
        .filter((item) => item.trim().length > 0)
        .join(', ');
    }
    return String(fieldValue ?? '');
  };

  const normalizedBusinessScenario = normalizeSelectionValue(value?.businessScenario);

  return {
    incoterm: normalizeSelectionValue(value?.incoterm).toUpperCase() || 'FOB',
    locationLabel: normalizeFreeTextValue(value?.locationLabel),
    locationValue: normalizeFreeTextValue(value?.locationValue),
    finalDestinationPlan: normalizeFreeTextValue(value?.finalDestinationPlan),
    tradeTerms: normalizeFreeTextValue(value?.tradeTerms),
    deliveryTime: normalizeFreeTextValue(value?.deliveryTime),
    portOfDestination: normalizeFreeTextValue(value?.portOfDestination),
    paymentTerms:
      normalizeFreeTextValue(value?.paymentTerms) ||
      buildPaymentTermsTextEn('tt_deposit_balance_before_shipment', 'before_shipment'),
    paymentMode: normalizeSelectionValue(value?.paymentMode) || 'tt_deposit_balance_before_shipment',
    balanceTrigger: normalizeSelectionValue(value?.balanceTrigger) || 'before_shipment',
    documentReleasePreference: normalizeSelectionValue(value?.documentReleasePreference) || 'telex_release_accepted',
    lcType: normalizeSelectionValue(value?.lcType),
    creditDays: normalizeSelectionValue(value?.creditDays),
    businessScenario: normalizedBusinessScenario === 'other' ? 'common_goods' : normalizedBusinessScenario,
    businessScenarioNotes: normalizeFreeTextValue(value?.businessScenarioNotes),
    insuranceRequirement: normalizeFreeTextValue(value?.insuranceRequirement),
    packingRequirements: normalizeFreeTextValue(value?.packingRequirements),
    certifications: normalizeFreeTextValue(value?.certifications),
    otherRequirements: normalizeFreeTextValue(value?.otherRequirements),
  };
};

export const parseCustomerInquiryRequirementText = (
  value?: string | null,
): CustomerInquiryRequirementFormFields => {
  if (!value?.trim()) {
    return { ...DEFAULT_CUSTOMER_INQUIRY_REQUIREMENT_FIELDS };
  }

  const fields = { ...DEFAULT_CUSTOMER_INQUIRY_REQUIREMENT_FIELDS };
  const matchers: Array<[keyof CustomerInquiryRequirementFormFields, RegExp[]]> = [
    ['tradeTerms', [/^\s*1\.\s*Price:\s*(.*)$/i, /^\s*Trade Terms:\s*(.*)$/i]],
    ['deliveryTime', [/^\s*2\.\s*Delivery time:\s*(.*)$/i, /^\s*Delivery Time:\s*(.*)$/i]],
    ['portOfDestination', [/^\s*3\.\s*Destination Port:\s*(.*)$/i, /^\s*Port of Destination:\s*(.*)$/i]],
    ['finalDestinationPlan', [/^\s*Final Destination(?:\s*\/\s*Delivery Plan)?:\s*(.*)$/i]],
    ['paymentTerms', [/^\s*4\.\s*Payment Term:\s*(.*)$/i, /^\s*Payment Terms:\s*(.*)$/i]],
    ['packingRequirements', [/^\s*Packing Requirements:\s*(.*)$/i, /^\s*Packing request:\s*(.*)$/i]],
    ['certifications', [/^\s*Certifications Required:\s*(.*)$/i, /^\s*Certificate request:\s*(.*)$/i]],
    ['otherRequirements', [/^\s*5\.\s*Others:\s*(.*)$/i, /^\s*Other Requirements:\s*(.*)$/i, /^\s*Extra request:\s*(.*)$/i]],
  ];

  value.split('\n').forEach((line) => {
    matchers.forEach(([key, patterns]) => {
      patterns.forEach((pattern) => {
        const match = line.match(pattern);
        if (match) {
          fields[key] = match[1]?.trim() || '';
        }
      });
    });
  });

  return fields;
};

export const buildCustomerInquiryRequirementText = (
  fields: CustomerInquiryRequirementFormFields,
) =>
  [
    `Incoterm: ${fields.incoterm}`.trimEnd(),
    `${getTradeTermLocationConfig(fields.incoterm).label}: ${fields.locationValue}`.trimEnd(),
    `Final Destination: ${fields.finalDestinationPlan}`.trimEnd(),
    `Delivery Time: ${fields.deliveryTime}`.trimEnd(),
    `Payment Method: ${CUSTOMER_PAYMENT_METHOD_OPTIONS.find((option) => option.value === fields.paymentMode)?.label || fields.paymentMode}`.trimEnd(),
    `Credit Period (Days): ${fields.creditDays}`.trimEnd(),
    `Business Scenario: ${fields.businessScenario}`.trimEnd(),
    `Business Scenario Notes: ${fields.businessScenarioNotes}`.trimEnd(),
    `Insurance Requirement: ${fields.insuranceRequirement}`.trimEnd(),
    `Document Release Preference: ${CUSTOMER_DOCUMENT_RELEASE_OPTIONS.find((option) => option.value === fields.documentReleasePreference)?.label || fields.documentReleasePreference}`.trimEnd(),
    `Packing request: ${fields.packingRequirements}`.trimEnd(),
    `Certificate request: ${fields.certifications}`.trimEnd(),
    `Extra request: ${fields.otherRequirements}`.trimEnd(),
  ].join('\n');

const LEGACY_PACKING_SUMMARY_PATTERN = /^\s*Cartons:\s*.*(?:,\s*CBM:\s*.*)?(?:,\s*GW:\s*.*)?(?:,\s*NW:\s*.*)?\s*$/i;
const LEGACY_REQUIREMENT_BLOCK_PATTERN = /(Trade Terms|Delivery Time|Port of Destination|Payment Terms|Packing Requirements|Packing request|Certifications Required|Certificate request|Other Requirements|Extra request)\s*:/i;

const resolveCustomerInquiryRequirementFields = (
  requirements?: CustomerInquiryData['requirements'],
): CustomerInquiryRequirementFormFields => {
  const normalized = normalizeCustomerInquiryRequirementFields({
    incoterm: requirements?.incoterm,
    locationLabel: requirements?.locationLabel,
    locationValue: requirements?.locationValue,
    finalDestinationPlan: requirements?.finalDestinationPlan,
    tradeTerms: requirements?.tradeTerms,
    deliveryTime: requirements?.deliveryTime,
    portOfDestination: requirements?.portOfDestination,
    paymentTerms: requirements?.paymentTerms,
    paymentMode: requirements?.paymentMode,
    balanceTrigger: requirements?.balanceTrigger,
    documentReleasePreference: requirements?.documentReleasePreference,
    lcType: requirements?.lcType,
    creditDays: requirements?.creditDays,
    businessScenario: requirements?.businessScenario,
    businessScenarioNotes: requirements?.businessScenarioNotes,
    insuranceRequirement: requirements?.insuranceRequirement,
    packingRequirements: requirements?.packingRequirements,
    certifications: Array.isArray(requirements?.certifications)
      ? requirements.certifications.join(', ')
      : typeof requirements?.certifications === 'string'
        ? requirements.certifications
        : '',
    otherRequirements: requirements?.otherRequirements,
  });

  const legacySources = [normalized.packingRequirements, normalized.otherRequirements]
    .filter((value) => value && LEGACY_REQUIREMENT_BLOCK_PATTERN.test(value))
    .join('\n');

  if (legacySources) {
    const parsedLegacyFields = parseCustomerInquiryRequirementText(legacySources);
    normalized.tradeTerms = normalized.tradeTerms || parsedLegacyFields.tradeTerms;
    normalized.deliveryTime = normalized.deliveryTime || parsedLegacyFields.deliveryTime;
    normalized.portOfDestination = normalized.portOfDestination || parsedLegacyFields.portOfDestination;
    normalized.paymentTerms = normalized.paymentTerms || parsedLegacyFields.paymentTerms;
    normalized.packingRequirements = normalized.packingRequirements || parsedLegacyFields.packingRequirements;
    normalized.certifications = normalized.certifications || parsedLegacyFields.certifications;
    normalized.otherRequirements = normalized.otherRequirements || parsedLegacyFields.otherRequirements;
  }

  if (LEGACY_PACKING_SUMMARY_PATTERN.test(normalized.packingRequirements)) {
    normalized.packingRequirements = '';
  }

  if (LEGACY_REQUIREMENT_BLOCK_PATTERN.test(normalized.otherRequirements)) {
    normalized.otherRequirements = '';
  }

  normalized.locationLabel = normalized.locationLabel || getTradeTermLocationConfig(normalized.incoterm).label;
  normalized.tradeTerms = normalized.tradeTerms || buildTradeTermsDisplay(normalized.incoterm, normalized.locationValue);
  normalized.portOfDestination = normalized.portOfDestination || (
    normalized.locationLabel === 'Destination Port' ? normalized.locationValue : ''
  );
  normalized.paymentTerms = normalized.paymentTerms || buildCustomerInquiryPaymentPreview(normalized);

  return normalized;
};

interface CustomerInquiryDocumentProps {
  data: CustomerInquiryData;
  layoutConfig?: DocumentLayoutConfig;
  highlightedRequirementKey?: keyof NonNullable<CustomerInquiryData['requirements']> | string | null;
}

export function getCustomerInquiryRequirementRows(
  data: CustomerInquiryData,
  options?: { includeEmpty?: boolean },
): CustomerInquiryRequirementRow[] {
  const requirements = resolveCustomerInquiryRequirementFields(data.requirements);
  const rows: CustomerInquiryRequirementRow[] = [];
  let stepNumber = 0;
  const includeEmpty = Boolean(options?.includeEmpty);
  const locationLabel = requirements.locationLabel || getTradeTermLocationConfig(requirements.incoterm).label;
  const paymentMethodLabel =
    CUSTOMER_PAYMENT_METHOD_OPTIONS.find((option) => option.value === requirements.paymentMode)?.label ||
    requirements.paymentMode ||
    '';
  const businessScenarioLabel =
    CUSTOMER_BUSINESS_SCENARIO_OPTIONS.find((option) => option.value === requirements.businessScenario)?.label ||
    requirements.businessScenario ||
    '';
  const showCreditDays = Boolean(String(requirements.creditDays || '').trim())
    || PAYMENT_METHOD_WITH_CREDIT_DAYS.has((requirements.paymentMode || '') as PaymentMode);
  const showBusinessScenario = Boolean(String(requirements.businessScenario || '').trim())
    || Boolean(String(requirements.businessScenarioNotes || '').trim())
    || requirements.paymentMode === 'tt_100_before_production';
  const showInsuranceRequirement = Boolean(String(requirements.insuranceRequirement || '').trim())
    || requirements.incoterm === 'CIF';
  const showBalanceTrigger = Boolean(String(requirements.balanceTrigger || '').trim());
  const showFinalDestination = shouldDisplayFinalDestination(requirements);

  const pushRow = (
    key: keyof NonNullable<CustomerInquiryData['requirements']>,
    label: string,
    value: string,
  ) => {
    if (!includeEmpty && !String(value || '').trim()) return;
    stepNumber += 1;
    rows.push({
      key,
      label: `${stepNumber}. ${label}`,
      value: String(value || '').trim(),
    });
  };

  pushRow('incoterm', 'Trade Term', requirements.incoterm || requirements.tradeTerms || '');
  pushRow('locationValue', locationLabel, requirements.locationValue || '');
  if (showFinalDestination) {
    pushRow('finalDestinationPlan', 'Final Destination', requirements.finalDestinationPlan || '');
  }
  pushRow('deliveryTime', 'Delivery Time', requirements.deliveryTime || '');
  pushRow('paymentMode', 'Payment Method', paymentMethodLabel);

  if (showCreditDays) {
    pushRow('creditDays', 'Credit Period (Days)', requirements.creditDays || '');
  }

  if (showBusinessScenario) {
    if (String(businessScenarioLabel || '').trim()) {
      pushRow('businessScenario', 'Business Scenario', businessScenarioLabel);
    }
    if (String(requirements.businessScenarioNotes || '').trim()) {
      pushRow('businessScenarioNotes', 'Business Scenario Notes', requirements.businessScenarioNotes || '');
    }
  }

  if (showInsuranceRequirement) {
    pushRow('insuranceRequirement', 'Insurance Requirement', requirements.insuranceRequirement || '');
  }

  pushRow(
    'documentReleasePreference',
    'Documents',
    getCustomerDocumentReleasePreferenceLabel(requirements.documentReleasePreference),
  );
  pushRow('packingRequirements', 'Packing request', requirements.packingRequirements || '');
  pushRow('certifications', 'Certificate request', requirements.certifications || '');
  pushRow('otherRequirements', 'Extra request', requirements.otherRequirements || '');

  if (includeEmpty) {
    return rows;
  }

  return rows.filter((item) => Boolean(item.value));
}

export const CustomerInquiryDocument = forwardRef<HTMLDivElement, CustomerInquiryDocumentProps>(
  ({ data, layoutConfig, highlightedRequirementKey = null }, ref) => {
    const resolvedLayout = {
      canvasWidthMm: layoutConfig?.canvasWidthMm ?? 210,
      canvasMinHeightMm: layoutConfig?.canvasMinHeightMm ?? 297,
      contentPaddingTopMm: layoutConfig?.contentPaddingTopMm ?? 20,
      contentPaddingBottomMm: layoutConfig?.contentPaddingBottomMm ?? 20,
      fontSizePt: layoutConfig?.fontSizePt ?? 10,
      lineHeight: layoutConfig?.lineHeight ?? 1.5,
    };

    const products = Array.isArray(data.products) ? data.products : [];
    const customer = {
      companyName: data.customer?.companyName || 'N/A',
      contactPerson: data.customer?.contactPerson || 'N/A',
      position: data.customer?.position,
      email: data.customer?.email || 'N/A',
      phone: data.customer?.phone,
      address: data.customer?.address,
      country: data.customer?.country || 'N/A',
    };
    const requirementRows = getCustomerInquiryRequirementRows(data);
    const productTableColumns = normalizeCustomerInquiryProductTableColumns(
      data.templateSettings?.productTableColumns,
    );
    const typography = normalizeCustomerInquiryTypography(data.templateSettings?.typography);
    
    // 计算总金额（如果有目标价格）
    const calculateTotal = () => {
      return products.reduce((sum, item) => {
        if (item.targetPrice) {
          return sum + (item.quantity * item.targetPrice);
        }
        return sum;
      }, 0);
    };

    const total = calculateTotal();
    const currency = products[0]?.currency || 'USD';
    const totalValueLabel = buildCustomerInquiryTotalValueLabel(
      resolveCustomerInquiryRequirementFields(data.requirements),
      currency,
    );
    const documentWidth = `${resolvedLayout.canvasWidthMm}mm`;
    const documentMinHeight = `${resolvedLayout.canvasMinHeightMm}mm`;
    const fontSize = `${resolvedLayout.fontSizePt}pt`;
    const lineHeight = resolvedLayout.lineHeight;
    const contentPaddingTop = `${resolvedLayout.contentPaddingTopMm}mm`;
    const contentPaddingBottom = `${resolvedLayout.contentPaddingBottomMm}mm`;
    const contentPaddingHorizontal = '20mm';
    const fullWidthTableClass = 'w-full table-fixed border-collapse border border-gray-400 text-xs';

    return (
      <div 
        ref={ref}
        className="mx-auto bg-white"
        style={{ 
          width: documentWidth,
          minHeight: documentMinHeight,
          boxSizing: 'border-box',
          fontFamily: typography.customerBodyFontFamily,
          fontSize,
          lineHeight
        }}
      >
        <div
          style={{
            paddingTop: contentPaddingTop,
            paddingBottom: contentPaddingBottom,
            paddingLeft: contentPaddingHorizontal,
            paddingRight: contentPaddingHorizontal,
          }}
        >
          {/* Header - Taiwan Enterprise Compact Style */}
          <div className="mb-3">
            {/* Title + Inquiry Info Table */}
            <div className="flex items-start justify-between mb-2">
              {/* Left: INQUIRY Title */}
              <div className="flex-1">
                <h1 className="font-bold tracking-wider text-black" style={{ fontSize: `${typography.headerTitlePt}pt`, fontFamily: typography.headerTitleFontFamily }}>
                  CUSTOMER INQUIRY
                </h1>
              </div>
              
              {/* Right: Inquiry Info Table */}
              <div className="w-[240px]">
                <table className="w-full border-collapse border border-gray-400" style={{ fontSize: `${typography.headerMetaPt}pt`, fontFamily: typography.headerMetaFontFamily }}>
                  <tbody>
                    <tr>
                      <td className="border border-gray-400 px-1.5 py-0.5 bg-gray-100 font-semibold whitespace-nowrap">Inq. No.</td>
                      <td className="border border-gray-400 px-1.5 py-0.5 font-bold text-black">{data.inquiryNo || '-'}</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-400 px-1.5 py-0.5 bg-gray-100 font-semibold whitespace-nowrap">Date</td>
                      <td className="border border-gray-400 px-1.5 py-0.5 font-semibold text-black">
                        {new Date(data.inquiryDate || '').toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-gray-400 px-1.5 py-0.5 bg-gray-100 font-semibold whitespace-nowrap">Region</td>
                      <td className="border border-gray-400 px-1.5 py-0.5 font-semibold text-black">
                        {data.region === 'NA' ? 'North America' : data.region === 'SA' ? 'South America' : 'Europe & Africa'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Divider - Double Line Design */}
            <div className="border-t-2 border-b border-gray-400" style={{ borderTopColor: '#000000', borderTopWidth: '3px' }}></div>
          </div>

          {/* Customer Information - Taiwan Enterprise Table Style */}
          <div className="mb-3">
            <table className={fullWidthTableClass}>
              <tbody>
                <tr>
                  <td className="border border-gray-400 p-0 align-top">
                    <div className="bg-gray-200 px-2 py-1 font-bold border-b border-gray-400" style={{ fontSize: `${typography.customerSectionHeaderPt}pt`, fontFamily: typography.customerSectionHeaderFontFamily }}>
                      CUSTOMER INFORMATION
                    </div>
                    <div className="px-2 py-1.5 space-y-0.5" style={{ fontSize: `${typography.customerBodyPt}pt`, fontFamily: typography.customerBodyFontFamily }}>
                      <div><span className="font-semibold">{customer.companyName}</span></div>
                      <div><span className="text-gray-600">Contact:</span> <span>{customer.contactPerson}{customer.position && ` (${customer.position})`}</span></div>
                      <div><span className="text-gray-600">Email:</span> <span>{customer.email}</span></div>
                      {customer.phone && (
                        <div><span className="text-gray-600">Tel:</span> <span>{customer.phone}</span></div>
                      )}
                      {customer.address && (
                        <div><span className="text-gray-600">Address:</span> <span>{customer.address}</span></div>
                      )}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Product Requirements Table - Taiwan Enterprise Style */}
          <div className="mb-4">
            <h3 className="font-bold mb-2 text-gray-900" style={{ fontSize: `${typography.sectionTitlePt}pt`, fontFamily: typography.sectionTitleFontFamily }}>PRODUCT REQUIREMENTS:</h3>
            <table className={fullWidthTableClass}>
              <colgroup>
                {productTableColumns.map((column) => (
                  <col key={column.key} style={{ width: `${column.widthPercent}%` }} />
                ))}
              </colgroup>
              <thead>
                <tr className="bg-gray-100">
                  {productTableColumns.map((column) => {
                    const alignmentClass =
                      column.key === 'image'
                        ? 'text-center'
                        : column.key === 'quantity' || column.key === 'targetPrice' || column.key === 'estimatedValue'
                          ? 'text-right'
                          : column.key === 'unit'
                            ? 'text-center'
                            : 'text-left';

                    return (
                      <th
                        key={column.key}
                        className={`border border-gray-300 px-2 py-2 whitespace-nowrap ${alignmentClass}`}
                        style={{ fontSize: `${typography.productHeaderPt}pt`, fontFamily: typography.productHeaderFontFamily }}
                      >
                        {column.label}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {products.map((product, index) => (
                  <tr key={`${product.no || index + 1}-${index}`}>
                    {productTableColumns.map((column) => {
                      if (column.key === 'no') {
                        return <td key={column.key} className="border border-gray-300 px-2 py-2 text-center" style={{ fontSize: `${typography.productBodyPt}pt`, fontFamily: typography.productBodyFontFamily }}>{product.no || index + 1}</td>;
                      }

                      if (column.key === 'modelNo') {
                        return <td key={column.key} className="border border-gray-300 px-2 py-2 text-gray-700" style={{ fontSize: `${typography.productBodyPt}pt`, fontFamily: typography.productBodyFontFamily }}>{product.modelNo || '-'}</td>;
                      }

                      if (column.key === 'image') {
                        return (
                          <td key={column.key} className="border border-gray-300 px-1 py-1 text-center" style={{ fontSize: `${typography.productBodyPt}pt`, fontFamily: typography.productBodyFontFamily }}>
                            {product.imageUrl ? (
                              <img
                                src={product.imageUrl}
                                alt={product.productName}
                                className="w-10 h-10 object-cover mx-auto rounded"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-gray-100 mx-auto rounded flex items-center justify-center text-gray-400" style={{ fontSize: `${typography.productSpecPt}pt`, fontFamily: typography.productSpecFontFamily }}>
                                N/A
                              </div>
                            )}
                          </td>
                        );
                      }

                      if (column.key === 'itemNameSpecification') {
                        return (
                          <td key={column.key} className="border border-gray-300 px-2 py-2">
                            <div className="font-semibold" style={{ fontSize: `${typography.productBodyPt}pt`, fontFamily: typography.productBodyFontFamily }}>{product.productName}</div>
                            {product.specification && (
                              <div className="text-gray-600 mt-0.5" style={{ fontSize: `${typography.productSpecPt}pt`, fontFamily: typography.productSpecFontFamily }}>{product.specification}</div>
                            )}
                          </td>
                        );
                      }

                      if (column.key === 'quantity') {
                        return <td key={column.key} className="border border-gray-300 px-2 py-2 text-right" style={{ fontSize: `${typography.productBodyPt}pt`, fontFamily: typography.productBodyFontFamily }}>{Number(product.quantity || 0).toLocaleString()}</td>;
                      }

                      if (column.key === 'unit') {
                        return <td key={column.key} className="border border-gray-300 px-2 py-2 text-center" style={{ fontSize: `${typography.productBodyPt}pt`, fontFamily: typography.productBodyFontFamily }}>{product.unit}</td>;
                      }

                      if (column.key === 'targetPrice') {
                        return (
                          <td key={column.key} className="border border-gray-300 px-2 py-2 text-right" style={{ fontSize: `${typography.productBodyPt}pt`, fontFamily: typography.productBodyFontFamily }}>
                            {product.targetPrice
                              ? product.targetPrice.toFixed(2)
                              : '-'}
                          </td>
                        );
                      }

                      return (
                        <td key={column.key} className="border border-gray-300 px-2 py-2 text-right font-semibold" style={{ fontSize: `${typography.productSummaryPt}pt`, fontFamily: typography.productSummaryFontFamily }}>
                          {product.targetPrice
                            ? (Number(product.quantity || 0) * Number(product.targetPrice || 0)).toFixed(2)
                            : '-'}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
              {total > 0 && (
                <tfoot>
                  <tr className="bg-gray-100 font-bold">
                    <td colSpan={Math.max(productTableColumns.length - 1, 1)} className="border border-gray-300 px-2 py-2 text-right" style={{ fontSize: `${typography.productSummaryPt}pt`, fontFamily: typography.productSummaryFontFamily }}>
                      {totalValueLabel}:
                    </td>
                    <td className="border border-gray-300 px-2 py-2 text-right font-semibold" style={{ fontSize: `${typography.productSummaryPt}pt`, fontFamily: typography.productSummaryFontFamily }}>
                      {total.toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {/* Trading Requirements - Taiwan Enterprise Style (单列表格布局) */}
          <div className="mb-6">
            <h3 className="font-bold mb-2 text-gray-900" style={{ fontSize: `${typography.sectionTitlePt}pt`, fontFamily: typography.sectionTitleFontFamily }}>TRADING REQUIREMENTS:</h3>
            <table className={fullWidthTableClass}>
              <colgroup>
                <col style={{ width: '4%' }} />
                <col style={{ width: '21%' }} />
                <col style={{ width: '75%' }} />
              </colgroup>
              <tbody>
                {getCustomerInquiryRequirementRows(data).map((row, index) => (
                  <tr
                    key={row.label}
                    className={row.key === highlightedRequirementKey ? 'bg-amber-50' : ''}
                  >
                    {(() => {
                      const { indexLabel, titleLabel } = splitRequirementLabel(row.label);
                      const cleanIndexLabel = indexLabel.replace(/\.$/, '');
                      return (
                        <>
                          <td
                            className={`border border-gray-400 px-1.5 py-1.5 text-right font-semibold align-top ${row.key === highlightedRequirementKey ? 'bg-amber-100 text-amber-900' : 'bg-gray-100'}`}
                            style={{ fontSize: `${typography.requirementIndexPt}pt`, fontFamily: typography.requirementIndexFontFamily }}
                          >
                            {cleanIndexLabel || '\u00A0'}
                          </td>
                          <td
                            className={`border border-gray-400 px-2 py-1.5 font-semibold align-top ${row.key === highlightedRequirementKey ? 'bg-amber-100 text-amber-900' : 'bg-gray-100'}`}
                            style={{ fontSize: `${typography.requirementLabelPt}pt`, fontFamily: typography.requirementLabelFontFamily }}
                          >
                            {titleLabel}
                          </td>
                        </>
                      );
                    })()}
                    <td className={`border border-gray-400 px-2 py-1.5 whitespace-pre-wrap ${row.key === highlightedRequirementKey ? 'bg-amber-50 ring-1 ring-inset ring-amber-300' : ''}`} style={{ fontSize: `${typography.requirementValuePt}pt`, fontFamily: typography.requirementValueFontFamily }}>
                      {row.value || '\u00A0'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer Statement */}
          <div className="text-gray-600 text-center border-t border-gray-300 pt-2" style={{ fontSize: `${typography.footerPt}pt`, fontFamily: typography.footerFontFamily }}>
            This inquiry will be processed and quoted within 24-48 hours. Thank you for your interest.
          </div>
        </div>
      </div>
    );
  }
);

CustomerInquiryDocument.displayName = 'CustomerInquiryDocument';

/**
 * 数据调用示例：
 * 
 * // 从KV Store读取询价数据
 * const inquiryData = await kv.get(`inquiry_${inquiryNo}`);
 * 
 * // 渲染文档
 * <CustomerInquiryDocument data={inquiryData} />
 * 
 * // 生成PDF
 * const pdfBlob = await generatePDF(<CustomerInquiryDocument data={inquiryData} />);
 * 
 * 字段映射说明：
 * ✅ 显示在文档上的字段：
 *    - inquiryNo, inquiryDate, region
 *    - customer.*（客户完整信息）
 *    - products[]（产品需求列表）
 *    - requirements.*（交易要求）
 *    - remarks
 * 
 * ❌ 不显示在文档上的字段（仅后台使用）：
 *    - source（询价来源）
 *    - assignedTo（分配业务员）
 *    - status（询价状态）
 *    - 任何审批、流程相关字段
 */
