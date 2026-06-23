/**
 * 🔥 采购订单工具函数
 * Purchase Order Utility Functions
 */

import { PurchaseOrderData } from '../../documents/templates/PurchaseOrderDocument';
import { QuoteRequirementDocumentData } from '../../documents/templates/QuoteRequirementDocument';
import { XJData } from '../../documents/templates/XJDocument';
import { PurchaseOrder as PurchaseOrderType } from '../../../contexts/PurchaseOrderContext';
import { QuoteRequirement } from '../../../contexts/QuoteRequirementContext';
import { Supplier, findSupplier, toSupplierProfile } from '../../../data/suppliersData';
import { XJ } from '../../../contexts/XJContext';
import { getStoredAdminOrgProfile, getStoredAdminUserProfile } from '../../../contexts/AdminOrganizationContext';
import { canonicalizePersonnelEmail } from '../../../lib/personnelEmail';
import {
  buildBilingualTradingRequirementsText,
  buildProcurementConditionGroups,
  extractProcurementRequestContext,
  joinNonEmptyText,
} from '../../../utils/procurementRequestContext';
import {
  inferSupplierDocumentLanguage,
  normalizeFlowProductCore,
  resolveFlowProductDisplay,
} from '../../../utils/documentDataAdapters';
import { desensitizePurchaserFeedbackText } from '../../../utils/purchaserFeedbackSanitizer';
import { generateXJNumber } from '../../../utils/xjNumberGenerator';
import { getFactoryFacingModelNo, getFormalBusinessModelNo } from '../../../utils/productModelDisplay';
import { buildPaymentTermsText, deriveBalanceTrigger } from '../../../lib/paymentFlow';
import { matchesNormalizedQrNumber, normalizeLegacyQrNumber } from '../../../utils/quoteRequirementNumber';

// 🔥 状态配置类型
type POStatus = 'pending' | 'confirmed' | 'producing' | 'completed' | 'delayed';
type PaymentStatus = 'unpaid' | 'partial' | 'paid';

export type ProjectExecutionBaseline = {
  projectId?: string | null;
  projectCode?: string | null;
  projectName?: string | null;
  projectRevisionId?: string | null;
  projectRevisionCode?: string | null;
  projectRevisionStatus?: string | null;
  finalRevisionId?: string | null;
  finalQuotationId?: string | null;
  finalQuotationNumber?: string | null;
};

export const extractProjectExecutionBaseline = (doc: any): ProjectExecutionBaseline | null => {
  const baseline = doc?.documentRenderMeta?.projectExecutionBaseline
    || doc?.document_render_meta?.projectExecutionBaseline
    || null;
  if (baseline && (baseline.projectRevisionId || baseline.projectCode || baseline.projectName)) {
    return baseline;
  }
  if (doc?.projectRevisionId || doc?.projectCode || doc?.projectName) {
    return {
      projectId: doc?.projectId || null,
      projectCode: doc?.projectCode || null,
      projectName: doc?.projectName || null,
      projectRevisionId: doc?.projectRevisionId || null,
      projectRevisionCode: doc?.projectRevisionCode || null,
      projectRevisionStatus: doc?.projectRevisionStatus || null,
      finalRevisionId: doc?.finalRevisionId || null,
      finalQuotationId: doc?.finalQuotationId || null,
      finalQuotationNumber: doc?.finalQuotationNumber || null,
    };
  }
  return null;
};

/**
 * 获取采购订单状态配置
 */
export const getPOStatusConfig = (status: POStatus) => {
  const configs = {
    pending: { label: '待确认', color: 'bg-slate-50 text-slate-700 border-slate-200' },
    confirmed: { label: '已确认', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    producing: { label: '生产中', color: 'bg-purple-50 text-purple-700 border-purple-200' },
    completed: { label: '已完成', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    delayed: { label: '已延期', color: 'bg-rose-50 text-rose-700 border-rose-200' }
  };
  return configs[status];
};

/**
 * 获取付款状态配置
 */
export const getPaymentStatusConfig = (status: PaymentStatus) => {
  const configs = {
    unpaid: { label: '未付', color: 'bg-amber-50 text-amber-700 border-amber-200' },
    partial: { label: '部分', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    paid: { label: '已付', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
  };
  return configs[status];
};

/**
 * 获取业务类型标签
 */
export const getBusinessTypeLabel = (type: string) => {
  const labels = {
    trading: '🛒 直接采购',
    inspection: '🔍 验货服务',
    agency: '🤝 代理服务',
    project: '🌟 一站式项目'
  };
  return labels[type as keyof typeof labels] || type;
};

/**
 * 获取紧急程度配置
 */
export const getUrgencyConfig = (urgency: 'high' | 'medium' | 'low') => {
  const configs = {
    high: { label: '紧急', color: 'bg-rose-50 text-rose-700 border-rose-200' },
    medium: { label: '中等', color: 'bg-amber-50 text-amber-700 border-amber-200' },
    low: { label: '低', color: 'bg-slate-50 text-slate-700 border-slate-200' }
  };
  return configs[urgency];
};

const buildAdminCompanyContact = () => {
  const adminOrg = getStoredAdminOrgProfile();
  const adminUser = getStoredAdminUserProfile();

  return {
    nameCN: String(adminOrg.nameCN || '').trim(),
    nameEN: String(adminOrg.nameEN || adminOrg.nameCN || '').trim(),
    addressCN: String(adminOrg.addressCN || '').trim(),
    addressEN: String(adminOrg.addressEN || adminOrg.addressCN || '').trim(),
    phone: String(adminOrg.phone || '').trim(),
    email: String(adminOrg.email || adminUser.email || '').trim(),
    contactPerson: String(adminOrg.contactPerson || adminUser.name || '').trim(),
  };
};

const resolveBuyerCompanyDisplayByLanguage = (
  adminCompany: ReturnType<typeof buildAdminCompanyContact>,
  language: 'zh' | 'en',
) => {
  const useChinese = language === 'zh';

  return {
    name: useChinese
      ? (adminCompany.nameCN || adminCompany.nameEN)
      : (adminCompany.nameEN || adminCompany.nameCN),
    nameEn: adminCompany.nameEN || adminCompany.nameCN,
    address: useChinese
      ? (adminCompany.addressCN || adminCompany.addressEN)
      : (adminCompany.addressEN || adminCompany.addressCN),
    addressEn: adminCompany.addressEN || adminCompany.addressCN,
  };
};

const normalizeTextToken = (value: unknown) => String(value || '').trim();
const PROCUREMENT_CREATOR_ROLES = new Set(['Procurement', 'Procurement_Manager']);
const GENERIC_ADMIN_CONTACT_NAMES = new Set(['管理员', '系统管理员', 'admin', 'administrator']);

const isGenericAdminContactName = (value: unknown) =>
  GENERIC_ADMIN_CONTACT_NAMES.has(String(value || '').trim().toLowerCase());

const resolvePurchaseOrderCreatorContact = (po: PurchaseOrderType) => {
  const poAny = po as any;
  const adminOrg = getStoredAdminOrgProfile();
  const adminUser = getStoredAdminUserProfile();
  const companyContact = buildAdminCompanyContact();
  const contacts = Array.isArray(adminOrg.internalContacts) ? adminOrg.internalContacts : [];
  const accounts = Array.isArray(adminOrg.internalAccounts) ? adminOrg.internalAccounts : [];
  const region = normalizeTextToken(po.region || poAny.region_code || '');

  const emailCandidates = [
    poAny.authenticatedUserEmail,
    poAny.authenticated_user_email,
    poAny.actingUserEmail,
    poAny.acting_user_email,
    poAny.operatorEmail,
    poAny.operator_email,
    poAny.createdBy,
    poAny.created_by,
  ]
    .map((value) => canonicalizePersonnelEmail(normalizeTextToken(value), region))
    .filter(Boolean);

  const idCandidates = [
    poAny.authenticatedUserId,
    poAny.authenticated_user_id,
    poAny.actingUserId,
    poAny.acting_user_id,
    poAny.operatorUserId,
    poAny.operator_user_id,
    poAny.createdBy,
    poAny.created_by,
  ]
    .map((value) => normalizeTextToken(value))
    .filter(Boolean);

  const nameCandidates = [
    poAny.createdByName,
    poAny.created_by_name,
    poAny.operatorName,
    poAny.operator_name,
    poAny.authenticatedUserName,
    poAny.authenticated_user_name,
    poAny.createdBy,
    poAny.created_by,
  ]
    .map((value) => normalizeTextToken(value))
    .filter((value) => value && !value.includes('@'));

  const matchedAccountCandidate =
    accounts.find((account) => idCandidates.includes(normalizeTextToken(account.authUserId))) ||
    accounts.find((account) => emailCandidates.includes(canonicalizePersonnelEmail(account.loginEmail, region))) ||
    accounts.find((account) => nameCandidates.includes(normalizeTextToken(account.username)));

  const matchedAccount = matchedAccountCandidate && PROCUREMENT_CREATOR_ROLES.has(normalizeTextToken(matchedAccountCandidate.role))
    ? matchedAccountCandidate
    : null;

  const matchedContactByAccount = matchedAccount
    ? contacts.find((contact) => normalizeTextToken(contact.id) === normalizeTextToken(matchedAccount.employeeId))
    : null;

  const matchedContact =
    matchedContactByAccount ||
    contacts.find((contact) =>
      emailCandidates.includes(canonicalizePersonnelEmail(contact.email, region)) &&
      PROCUREMENT_CREATOR_ROLES.has(
        normalizeTextToken(
          accounts.find((account) => normalizeTextToken(account.employeeId) === normalizeTextToken(contact.id))?.role,
        ),
      ),
    ) ||
    contacts.find((contact) =>
      nameCandidates.includes(normalizeTextToken(contact.name)) &&
      PROCUREMENT_CREATOR_ROLES.has(
        normalizeTextToken(
          accounts.find((account) => normalizeTextToken(account.employeeId) === normalizeTextToken(contact.id))?.role,
        ),
      ),
    ) ||
    null;

  const resolvedName =
    normalizeTextToken(matchedContact?.name) ||
    normalizeTextToken(matchedAccount?.username) ||
    companyContact.contactPerson ||
    (isGenericAdminContactName(adminUser.name) ? '' : normalizeTextToken(adminUser.name));

  const resolvedEmail =
    canonicalizePersonnelEmail(matchedContact?.email, region) ||
    canonicalizePersonnelEmail(matchedAccount?.loginEmail, region) ||
    companyContact.email ||
    canonicalizePersonnelEmail(adminUser.email, region);

  const resolvedPhone =
    normalizeTextToken(matchedContact?.phone) ||
    companyContact.phone;

  return {
    contactPerson: resolvedName,
    email: resolvedEmail,
    tel: resolvedPhone,
  };
};

const toFiniteNumber = (value: unknown) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

const normalizeBankInfoValue = (value: unknown) => String(value ?? '').trim();

const pickBankInfoValue = (...values: unknown[]) => {
  for (const value of values) {
    const normalized = normalizeBankInfoValue(value);
    if (normalized) return normalized;
  }
  return '';
};

const hasMeaningfulSupplierBankInfo = (bankInfo: any) => {
  if (!bankInfo || typeof bankInfo !== 'object') return false;
  return Boolean(
    pickBankInfoValue(
      bankInfo.bankName,
      bankInfo.accountName,
      bankInfo.accountNumber,
      bankInfo.swiftCode,
      bankInfo.swift,
      bankInfo.bankAddress,
      bankInfo.iban,
      bankInfo.routingNumber,
      bankInfo.paymentNote,
    ),
  );
};

const pickSnapshotTextValue = (primary: unknown, fallback: unknown) => {
  const primaryText = String(primary || '').trim();
  if (primaryText) return primaryText;
  return String(fallback || '').trim();
};

const PURCHASE_ORDER_TERM_DEFAULTS: Partial<Record<keyof PurchaseOrderData['terms'], string>> = {
  paymentTerms: '待采购确认',
  deliveryTerms: '待采购确认',
  deliveryAddress: '福建省福州市仓山区金山街道浦上大道216号',
  qualityStandard: '符合国家标准及合同约定',
  inspectionMethod: '到货验收',
  packaging: '标准出口包装',
  warrantyPeriod: '12个月',
  warrantyTerms: '质量问题免费更换',
  applicableLaw: '中华人民共和国合同法',
  contractValidity: '订单确认后生效',
};

const pickSnapshotTermValue = (
  field: keyof PurchaseOrderData['terms'],
  primary: unknown,
  fallback: unknown,
) => {
  const primaryText = String(primary || '').trim();
  const fallbackText = String(fallback || '').trim();
  const defaultText = String(PURCHASE_ORDER_TERM_DEFAULTS[field] || '').trim();

  if (!primaryText) return fallbackText;
  if (fallbackText && defaultText && primaryText === defaultText && fallbackText !== defaultText) {
    return fallbackText;
  }
  return primaryText;
};

const mergePurchaseOrderTerms = (
  liveTerms: PurchaseOrderData['terms'] | undefined,
  existingTerms: PurchaseOrderData['terms'] | undefined,
): PurchaseOrderData['terms'] => {
  const next = (liveTerms || {}) as PurchaseOrderData['terms'];
  const existing = (existingTerms || {}) as PurchaseOrderData['terms'];

  return {
    ...next,
    paymentTerms: pickSnapshotTermValue('paymentTerms', next.paymentTerms, existing.paymentTerms),
    deliveryTerms: pickSnapshotTermValue('deliveryTerms', next.deliveryTerms, existing.deliveryTerms),
    deliveryAddress: pickSnapshotTermValue('deliveryAddress', next.deliveryAddress, existing.deliveryAddress),
    qualityStandard: pickSnapshotTermValue('qualityStandard', next.qualityStandard, existing.qualityStandard),
    inspectionMethod: pickSnapshotTermValue('inspectionMethod', next.inspectionMethod, existing.inspectionMethod),
    packaging: pickSnapshotTermValue('packaging', next.packaging, existing.packaging),
    shippingMarks: pickSnapshotTermValue('shippingMarks', next.shippingMarks, existing.shippingMarks),
    deliveryPenalty: pickSnapshotTermValue('deliveryPenalty', next.deliveryPenalty, existing.deliveryPenalty),
    qualityPenalty: pickSnapshotTermValue('qualityPenalty', next.qualityPenalty, existing.qualityPenalty),
    warrantyPeriod: pickSnapshotTermValue('warrantyPeriod', next.warrantyPeriod, existing.warrantyPeriod),
    warrantyTerms: pickSnapshotTermValue('warrantyTerms', next.warrantyTerms, existing.warrantyTerms),
    returnPolicy: pickSnapshotTermValue('returnPolicy', next.returnPolicy, existing.returnPolicy),
    confidentiality: pickSnapshotTermValue('confidentiality', next.confidentiality, existing.confidentiality),
    ipRights: pickSnapshotTermValue('ipRights', next.ipRights, existing.ipRights),
    forceMajeure: pickSnapshotTermValue('forceMajeure', next.forceMajeure, existing.forceMajeure),
    disputeResolution: pickSnapshotTermValue('disputeResolution', next.disputeResolution, existing.disputeResolution),
    applicableLaw: pickSnapshotTermValue('applicableLaw', next.applicableLaw, existing.applicableLaw),
    contractValidity: pickSnapshotTermValue('contractValidity', next.contractValidity, existing.contractValidity),
    modification: pickSnapshotTermValue('modification', next.modification, existing.modification),
    termination: pickSnapshotTermValue('termination', next.termination, existing.termination),
    incoterm: pickSnapshotTermValue('incoterm', next.incoterm, existing.incoterm),
    portOfLoading: pickSnapshotTermValue('portOfLoading', next.portOfLoading, existing.portOfLoading),
    portOfDestination: pickSnapshotTermValue('portOfDestination', next.portOfDestination, existing.portOfDestination),
    taxTerms: pickSnapshotTermValue('taxTerms', next.taxTerms, existing.taxTerms),
    bankTerms: pickSnapshotTermValue('bankTerms', next.bankTerms, existing.bankTerms),
  };
};

const mergePurchaseOrderEditForm = (
  nextForm: PurchaseOrderData['editForm'] | undefined,
  existingForm: PurchaseOrderData['editForm'] | undefined,
): PurchaseOrderData['editForm'] => {
  const next = (nextForm || {}) as NonNullable<PurchaseOrderData['editForm']>;
  const existing = (existingForm || {}) as NonNullable<PurchaseOrderData['editForm']>;

  const mergeText = (field: keyof NonNullable<PurchaseOrderData['editForm']>) =>
    pickSnapshotTextValue(next[field], existing[field]);

  return {
    poNumber: mergeText('poNumber'),
    requirementNo: mergeText('requirementNo'),
    xjNumber: mergeText('xjNumber'),
    sourceRef: mergeText('sourceRef'),
    supplierName: mergeText('supplierName'),
    supplierCode: mergeText('supplierCode'),
    supplierContact: mergeText('supplierContact'),
    supplierPhone: mergeText('supplierPhone'),
    supplierAddress: mergeText('supplierAddress'),
    supplierBankName: mergeText('supplierBankName'),
    supplierBankAccountName: mergeText('supplierBankAccountName'),
    supplierBankAccountNumber: mergeText('supplierBankAccountNumber'),
    supplierBankSwiftCode: mergeText('supplierBankSwiftCode'),
    supplierBankAddress: mergeText('supplierBankAddress'),
    supplierBankCurrency: mergeText('supplierBankCurrency'),
    currency: mergeText('currency'),
    paymentTerms: mergeText('paymentTerms'),
    deliveryTerms: mergeText('deliveryTerms'),
    deliveryAddress: mergeText('deliveryAddress'),
    qualityStandard: mergeText('qualityStandard'),
    inspectionMethod: mergeText('inspectionMethod'),
    packaging: mergeText('packaging'),
    shippingMarks: mergeText('shippingMarks'),
    deliveryPenalty: mergeText('deliveryPenalty'),
    qualityPenalty: mergeText('qualityPenalty'),
    warrantyPeriod: mergeText('warrantyPeriod'),
    warrantyTerms: mergeText('warrantyTerms'),
    returnPolicy: mergeText('returnPolicy'),
    confidentiality: mergeText('confidentiality'),
    ipRights: mergeText('ipRights'),
    forceMajeure: mergeText('forceMajeure'),
    disputeResolution: mergeText('disputeResolution'),
    applicableLaw: mergeText('applicableLaw'),
    contractValidity: mergeText('contractValidity'),
    modification: mergeText('modification'),
    termination: mergeText('termination'),
    incoterm: mergeText('incoterm'),
    portOfLoading: mergeText('portOfLoading'),
    portOfDestination: mergeText('portOfDestination'),
    taxTerms: mergeText('taxTerms'),
    bankTerms: mergeText('bankTerms'),
    orderDate: mergeText('orderDate'),
    expectedDate: mergeText('expectedDate'),
    actualDate: mergeText('actualDate'),
    status: mergeText('status'),
    paymentStatus: mergeText('paymentStatus'),
    remarks: mergeText('remarks'),
  };
};

const hasMeaningfulProductPricing = (products: Array<{ unitPrice?: unknown; amount?: unknown }> | undefined | null) => {
  return Array.isArray(products) && products.some((product) => {
    return toFiniteNumber(product?.unitPrice) > 0 || toFiniteNumber(product?.amount) > 0;
  });
};

const resolveSupplierProfile = (po: PurchaseOrderType) => {
  const poAny = po as any;
  const supplier = findSupplier({
    code: po.supplierCode || null,
    id: poAny.supplierId || poAny.supplier_id || null,
    email: poAny.supplierEmail || poAny.supplier_email || null,
    name: po.supplierName || null,
  });
  return supplier ? toSupplierProfile(supplier) : null;
};

const resolveSupplierBankInfo = (po: PurchaseOrderType, supplierProfile: ReturnType<typeof resolveSupplierProfile>) => {
  const poAny = po as any;
  const documentSnapshot = poAny.documentDataSnapshot || poAny.document_data_snapshot || null;
  const explicitBankInfo =
    poAny.supplierBankInfo ||
    poAny.supplier_bank_info ||
    poAny.bankInfo ||
    poAny.bank_info ||
    null;
  const snapshotBankInfo = documentSnapshot?.supplier?.bankInfo || null;
  const bankSource = hasMeaningfulSupplierBankInfo(explicitBankInfo)
    ? explicitBankInfo
    : (hasMeaningfulSupplierBankInfo(snapshotBankInfo) ? snapshotBankInfo : null);

  return {
    bankName: pickBankInfoValue(
      bankSource?.bankName,
      bankSource?.bank_name,
      bankSource?.bankNameCN,
      bankSource?.bankNameEN,
    ),
    accountName: pickBankInfoValue(
      bankSource?.accountName,
      bankSource?.account_name,
      bankSource?.accountNameCN,
      bankSource?.accountNameEN,
      po.supplierName,
      supplierProfile?.name,
    ),
    accountNumber: pickBankInfoValue(
      bankSource?.accountNumber,
      bankSource?.account_number,
    ),
    swiftCode: pickBankInfoValue(
      bankSource?.swiftCode,
      bankSource?.swift_code,
      bankSource?.swift,
    ),
    bankAddress: pickBankInfoValue(
      bankSource?.bankAddress,
      bankSource?.bank_address,
    ),
    currency: pickBankInfoValue(
      bankSource?.currency,
      po.currency,
    ),
    iban: pickBankInfoValue(
      bankSource?.iban,
      bankSource?.IBAN,
    ),
    routingNumber: pickBankInfoValue(
      bankSource?.routingNumber,
      bankSource?.routing_number,
    ),
    paymentNote: pickBankInfoValue(
      bankSource?.paymentNote,
      bankSource?.payment_note,
    ),
  };
};

/**
 * 🔥 将采购订单数据转换为文档模板数据
 */
export const convertToPOData = (po: PurchaseOrderType): PurchaseOrderData => {
  const poAny = po as any;
  const adminCompany = buildAdminCompanyContact();
  const creatorContact = resolvePurchaseOrderCreatorContact(po);
  const supplierProfile = resolveSupplierProfile(po);
  const supplierBankInfo = resolveSupplierBankInfo(po, supplierProfile);
  const resolvedOrderDate = String(
    po.orderDate ||
    poAny.order_date ||
    poAny.createdDate ||
    poAny.createdAt ||
    poAny.created_at ||
    '',
  ).split('T')[0];
  const resolvedExpectedDate = String(
    po.expectedDate ||
    poAny.expectedDeliveryDate ||
    poAny.expected_delivery_date ||
    '',
  ).split('T')[0];
  const procurementLanguage = inferSupplierDocumentLanguage({
    ...po,
    supplierProfile,
    supplierRegion: supplierProfile?.address || po.supplierAddress || '',
  });
  const buyerCompanyDisplay = resolveBuyerCompanyDisplayByLanguage(adminCompany, procurementLanguage);
  const pick = (...values: unknown[]) => {
    for (const v of values) {
      const s = String(v ?? '').trim();
      if (s) return s;
    }
    return '';
  };
  // 🔥 转换产品列表格式
  const products = po.items.map((item, index) => {
    const normalized = resolveFlowProductDisplay(item, procurementLanguage);
    return {
      no: index + 1,
      modelNo: normalized.modelNo || '-',
      imageUrl: normalized.imageUrl || '',
      description: normalized.productName || '-',
      specification: normalized.specification || '标准规格',
      quantity: normalized.quantity,
      unit: normalized.unit || 'PCS',
      unitPrice: item.unitPrice,
      currency: item.currency,
      amount: item.subtotal,
      deliveryDate: resolvedExpectedDate,
      remarks: normalized.remarks || item.remarks || (po.sourceRef ? `关联销售订单: ${po.sourceRef}` : ''),
    };
  });

  return {
    // 采购单基本信息
    poNo: po.poNumber,
    poDate: resolvedOrderDate,
    requiredDeliveryDate: resolvedExpectedDate,
    
    // 买方（公司）信息
    buyer: {
      name: buyerCompanyDisplay.name,
      nameEn: buyerCompanyDisplay.nameEn,
      address: buyerCompanyDisplay.address,
      addressEn: buyerCompanyDisplay.addressEn,
      tel: pick(creatorContact.tel, adminCompany.phone),
      email: pick(creatorContact.email, adminCompany.email),
      contactPerson: pick(creatorContact.contactPerson, adminCompany.contactPerson),
    },
    
    // 卖方（供应商）信息
    supplier: {
      companyName: pick(po.supplierName, supplierProfile?.name, '待采购分配'),
      address: pick(po.supplierAddress, supplierProfile?.address, '供应商地址（待完善）'),
      contactPerson: pick(po.supplierContact, supplierProfile?.contactPerson, '联系人'),
      tel: pick(po.supplierPhone, supplierProfile?.phone, '+86-xxx-xxxx-xxxx'),
      email: pick(poAny.supplierEmail, poAny.supplier_email, supplierProfile?.email, 'supplier@example.com'),
      supplierCode: pick(po.supplierCode, supplierProfile?.code, 'TBD'),
      bankInfo: supplierBankInfo
    },
    
    // 🔥 采购产品清单 - 使用转换后的products
    products: products,
    
    // 采购条款
    terms: {
      totalAmount: po.totalAmount,
      currency: po.currency,
      paymentTerms: pick(poAny.paymentTerms, '待采购确认'),
      deliveryTerms: pick(poAny.deliveryTerms, '待采购确认'),
      deliveryAddress: pick(poAny.deliveryAddress, '福建省福州市仓山区金山街道浦上大道216号'),
      qualityStandard: pick(poAny.qualityStandard, poAny.qualityTerms, '符合国家标准及合同约定'),
      inspectionMethod: pick(poAny.inspectionMethod, poAny.inspectionTerms, '到货验收'),
      packaging: pick(poAny.packaging, poAny.packagingTerms, '标准出口包装'),
      shippingMarks: pick(poAny.shippingMarks),
      deliveryPenalty: pick(poAny.deliveryPenalty),
      qualityPenalty: pick(poAny.qualityPenalty, poAny.penaltyTerms),
      warrantyPeriod: pick(poAny.warrantyPeriod, '12个月'),
      warrantyTerms: pick(poAny.warrantyTerms, '质量问题免费更换'),
      returnPolicy: pick(poAny.returnPolicy),
      confidentiality: pick(poAny.confidentiality),
      ipRights: pick(poAny.ipRights),
      forceMajeure: pick(poAny.forceMajeure),
      disputeResolution: pick(poAny.disputeResolution, poAny.disputeResolutionTerms),
      applicableLaw: pick(poAny.applicableLaw, '中华人民共和国合同法'),
      contractValidity: pick(poAny.contractValidity, '订单确认后生效'),
      modification: pick(poAny.modification),
      termination: pick(poAny.termination),
      incoterm: pick(poAny.incoterm),
      portOfLoading: pick(poAny.portOfLoading),
      portOfDestination: pick(poAny.portOfDestination),
      taxTerms: pick(poAny.taxTerms),
      bankTerms: pick(poAny.bankTerms),
    },
    editForm: {
      poNumber: String(po.poNumber || '').trim(),
      requirementNo: String(po.requirementNo || '').trim(),
      xjNumber: String(po.xjNumber || '').trim(),
      sourceRef: String(po.sourceRef || poAny.source_ref || po.salesContractNumber || po.sourceSONumber || '').trim(),
      supplierName: String(po.supplierName || '').trim(),
      supplierCode: String(po.supplierCode || '').trim(),
      supplierContact: String(poAny.supplierContact || '').trim(),
      supplierPhone: String(poAny.supplierPhone || '').trim(),
      supplierAddress: String(poAny.supplierAddress || '').trim(),
      supplierBankName: String(supplierBankInfo?.bankName || '').trim(),
      supplierBankAccountName: String(supplierBankInfo?.accountName || '').trim(),
      supplierBankAccountNumber: String(supplierBankInfo?.accountNumber || '').trim(),
      supplierBankSwiftCode: String(supplierBankInfo?.swiftCode || supplierBankInfo?.swift || '').trim(),
      supplierBankAddress: String(supplierBankInfo?.bankAddress || '').trim(),
      supplierBankCurrency: String(supplierBankInfo?.currency || '').trim(),
      currency: String(po.currency || '').trim(),
      paymentTerms: pick(poAny.paymentTerms),
      deliveryTerms: pick(poAny.deliveryTerms),
      deliveryAddress: pick(poAny.deliveryAddress),
      qualityStandard: pick(poAny.qualityStandard, poAny.qualityTerms),
      inspectionMethod: pick(poAny.inspectionMethod, poAny.inspectionTerms),
      packaging: pick(poAny.packaging, poAny.packagingTerms),
      shippingMarks: pick(poAny.shippingMarks),
      deliveryPenalty: pick(poAny.deliveryPenalty),
      qualityPenalty: pick(poAny.qualityPenalty, poAny.penaltyTerms),
      warrantyPeriod: pick(poAny.warrantyPeriod),
      warrantyTerms: pick(poAny.warrantyTerms),
      returnPolicy: pick(poAny.returnPolicy),
      confidentiality: pick(poAny.confidentiality),
      ipRights: pick(poAny.ipRights),
      forceMajeure: pick(poAny.forceMajeure),
      disputeResolution: pick(poAny.disputeResolution, poAny.disputeResolutionTerms),
      applicableLaw: pick(poAny.applicableLaw),
      contractValidity: pick(poAny.contractValidity),
      modification: pick(poAny.modification),
      termination: pick(poAny.termination),
      incoterm: pick(poAny.incoterm),
      portOfLoading: pick(poAny.portOfLoading),
      portOfDestination: pick(poAny.portOfDestination),
      taxTerms: pick(poAny.taxTerms),
      bankTerms: pick(poAny.bankTerms),
      orderDate: resolvedOrderDate,
      expectedDate: resolvedExpectedDate,
      actualDate: String(poAny.actualDate || '').trim(),
      status: String(poAny.status || '').trim(),
      paymentStatus: String(poAny.paymentStatus || '').trim(),
      remarks: String(poAny.remarks || '').trim(),
    },
  };
};

export const buildPurchaseOrderDocumentSnapshot = (
  po: PurchaseOrderType,
  options?: { preferLiveData?: boolean }
): PurchaseOrderData => {
  const existing = (po as any).documentDataSnapshot || (po as any).document_data_snapshot || null;
  const liveSnapshot = convertToPOData(po);
  const preferLiveData = options?.preferLiveData === true;
  const existingProducts = Array.isArray((existing as any)?.products) ? (existing as any).products : null;
  const shouldUseLiveData =
    preferLiveData ||
    !existingProducts ||
    (
      hasMeaningfulProductPricing(liveSnapshot.products as any) &&
      !hasMeaningfulProductPricing(existingProducts as any)
    );

  if (!shouldUseLiveData && existing && typeof existing === 'object' && Array.isArray((existing as any).products)) {
    return existing as PurchaseOrderData;
  }

  const existingSupplierBankInfo = (existing as any)?.supplier?.bankInfo;
  const mergedSnapshot: PurchaseOrderData = {
    ...liveSnapshot,
    poDate: pickSnapshotTextValue(liveSnapshot.poDate, (existing as any)?.poDate),
    requiredDeliveryDate: pickSnapshotTextValue(
      liveSnapshot.requiredDeliveryDate,
      (existing as any)?.requiredDeliveryDate,
    ),
    terms: mergePurchaseOrderTerms(liveSnapshot.terms, (existing as any)?.terms),
    editForm: mergePurchaseOrderEditForm(liveSnapshot.editForm, (existing as any)?.editForm),
  };

  if (
    hasMeaningfulSupplierBankInfo(existingSupplierBankInfo) &&
    !hasMeaningfulSupplierBankInfo(liveSnapshot.supplier?.bankInfo)
  ) {
    return {
      ...mergedSnapshot,
      supplier: {
        ...mergedSnapshot.supplier,
        bankInfo: {
          ...existingSupplierBankInfo,
          currency: pickBankInfoValue(
            existingSupplierBankInfo?.currency,
            liveSnapshot.supplier?.bankInfo?.currency,
            mergedSnapshot.terms?.currency,
          ),
        },
      },
    };
  }

  return mergedSnapshot;
};

/**
 * 🔥 脱敏函数 - 隐藏供应商公司名称（仅业务员查看时）
 */
export const desensitizeFeedback = (feedback: string, userRole?: string): string => {
  return desensitizePurchaserFeedbackText(feedback, null, userRole);
};

/**
 * 🔥 将采购需求数据转换为文档模板数据
 */
export const convertToPRData = (req: QuoteRequirement, userRole?: string): QuoteRequirementDocumentData => {
  const hasSupplierContext = Boolean(
    (req as any)?.supplierName ||
    (req as any)?.supplierCompany ||
    (req as any)?.supplierCountryCode ||
    (req as any)?.supplierLocale,
  );
  const procurementLanguage = hasSupplierContext ? inferSupplierDocumentLanguage(req) : 'zh';
  const toNumberOrNull = (value: unknown) => {
    const num = Number(value);
    return Number.isFinite(num) ? num : null;
  };
  const pickNumberOrNull = (...values: unknown[]) => {
    for (const value of values) {
      const parsed = toNumberOrNull(value);
      if (parsed != null) return parsed;
    }
    return null;
  };
  const pickPositiveNumberOrNull = (...values: unknown[]) => {
    for (const value of values) {
      const parsed = toNumberOrNull(value);
      if (parsed != null && parsed > 0) return parsed;
    }
    return null;
  };
  const resolveFeedbackUnitPrice = (feedbackProduct: any, item: any) => pickPositiveNumberOrNull(
    feedbackProduct?.sourcePricing?.unitPrice,
    feedbackProduct?.sourcePricing?.unit_price,
    feedbackProduct?.sourcePricing?.price,
    feedbackProduct?.sourcePricing?.quotedPrice,
    feedbackProduct?.sourcePricing?.supplierPrice,
    feedbackProduct?.costPrice,
    feedbackProduct?.cost_price,
    feedbackProduct?.supplierPrice,
    feedbackProduct?.supplier_price,
    feedbackProduct?.unitPrice,
    feedbackProduct?.unit_price,
    feedbackProduct?.quotedPrice,
    feedbackProduct?.quoted_price,
    feedbackProduct?.price,
    feedbackProduct?.pricing?.unitPrice,
    feedbackProduct?.pricing?.unit_price,
    userRole === 'Sales_Rep' ? null : item?.targetPrice,
  );
  const resolveFeedbackAmount = (feedbackProduct: any) => pickPositiveNumberOrNull(
    feedbackProduct?.amount,
    feedbackProduct?.totalAmount,
    feedbackProduct?.total_amount,
    feedbackProduct?.totalPrice,
    feedbackProduct?.total_price,
    feedbackProduct?.lineAmount,
    feedbackProduct?.line_amount,
    feedbackProduct?.sourcePricing?.amount,
    feedbackProduct?.sourcePricing?.totalAmount,
    feedbackProduct?.sourcePricing?.total_amount,
  );
  const reqCreatedDate = String(
    (req as any).createdDate ||
    (req as any).createdAt ||
    (req as any).created_at ||
    new Date().toISOString()
  );

  // 🔥 检查是否有采购员反馈
  const hasPurchaserFeedback = req.purchaserFeedback && req.purchaserFeedback.products;
  const productRequirementLines = req.customerRequirements?.productRequirements || [];
  const parseProductSummary = (raw: unknown) => {
    const text = String(raw || '').trim();
    if (!text) {
      return { productName: '', modelNo: '', specification: '' };
    }

    const segments = text
      .split(/[;；]\s*/)
      .map((segment) => segment.trim())
      .filter(Boolean);

    if (segments.length === 0) {
      return { productName: text, modelNo: '', specification: '' };
    }

    let productName = '';
    let modelNo = '';
    const specificationParts: string[] = [];

    segments.forEach((segment, index) => {
      if (/^型号[:：]?/i.test(segment)) {
        modelNo = segment.replace(/^型号[:：]?\s*/i, '').trim();
        return;
      }

      if (/^规格[:：]?/i.test(segment)) {
        specificationParts.push(segment.replace(/^规格[:：]?\s*/i, '').trim());
        return;
      }

      if (index === 0 && !productName) {
        productName = segment;
        return;
      }

      specificationParts.push(segment);
    });

    return {
      productName: productName || text,
      modelNo,
      specification: specificationParts.filter(Boolean).join('；'),
    };
  };
  const parseRequirementLine = (raw: unknown) => {
    const text = String(raw || '').trim();
    if (!text) return {};
    return {
      productName: text.match(/^(.*?)(?:[;；]\s*型号[:：]|$)/)?.[1]?.trim() || '',
      modelNo: text.match(/型号[:：]?\s*([^;；]+?)(?:[;；]|$)/)?.[1]?.trim() || '',
      specification: text.match(/规格[:：]?\s*([^;；]+?)(?:[;；]|$)/)?.[1]?.trim() || '',
    };
  };
  const pickText = (...values: unknown[]) => {
    for (const value of values) {
      const text = String(value || '').trim();
      if (text && text !== '-') return text;
    }
    return '';
  };
  const localizeQrDeliveryRequirement = (value: unknown) => {
    const raw = String(value || '').trim();
    if (!raw) return '';

    const parsedDate = new Date(raw);
    if (!Number.isNaN(parsedDate.getTime())) {
      return raw;
    }

    const compact = raw.replace(/\s+/g, ' ').trim();
    let matched = compact.match(/^(\d+)\s*-\s*(\d+)\s*days?\s+after\s+deposit(?:\s+received)?$/i);
    if (matched) {
      return `定金后${matched[1]}-${matched[2]}天`;
    }

    matched = compact.match(/^(\d+)\s*days?\s+after\s+deposit(?:\s+received)?$/i);
    if (matched) {
      return `定金后${matched[1]}天`;
    }

    matched = compact.match(/^(\d+)\s*-\s*(\d+)\s*days?\s+after\s+order(?:\s+confirmation)?$/i);
    if (matched) {
      return `订单确认后${matched[1]}-${matched[2]}天`;
    }

    matched = compact.match(/^(\d+)\s*days?\s+after\s+order(?:\s+confirmation)?$/i);
    if (matched) {
      return `订单确认后${matched[1]}天`;
    }

    return raw;
  };
  const resolveCreatedByDisplay = () => {
    const candidates = [
      (req as any).requestedByName,
      (req as any).ownerName,
      (req as any).salesPersonName,
      (req as any).createdByName,
      (req as any).submittedByName,
      (req as any).requestedBy,
      (req as any).ownerEmail,
      (req as any).createdBy,
    ];

    for (const candidate of candidates) {
      const text = String(candidate || '').trim();
      if (!text) continue;
      if (text.includes('@')) continue;
      return text;
    }

    return String((req as any).requestedBy || (req as any).ownerEmail || req.createdBy || '').trim();
  };
  const dedupeJoinedText = (...values: unknown[]) => {
    const result: string[] = [];
    const seen = new Set<string>();

    values.forEach((value) => {
      const text = String(value || '').trim();
      if (!text || text === '-') return;
      const normalized = text.replace(/\s+/g, ' ').trim().toLowerCase();
      if (seen.has(normalized)) return;
      seen.add(normalized);
      result.push(text);
    });

    return result.join('\n');
  };
  const normalizeComparable = (value: unknown) =>
    String(value || '')
      .trim()
      .replace(/\s+/g, ' ')
      .toLowerCase();
  const findFeedbackProduct = (item: any, index: number) => {
    if (!hasPurchaserFeedback) return null;
    const feedbackProducts = Array.isArray(req.purchaserFeedback?.products)
      ? req.purchaserFeedback.products
      : [];
    const itemId = normalizeComparable(item?.id);
    const itemModel = normalizeComparable(
      item?.modelNo || item?.model || item?.sku || getFormalBusinessModelNo(item)
    );
    const itemName = normalizeComparable(item?.productName || item?.name || item?.description);
    const itemSpec = normalizeComparable(item?.specification || item?.spec);

    const matched = feedbackProducts.find((fp: any) => {
      const fpId = normalizeComparable(fp?.productId);
      const fpModel = normalizeComparable(fp?.modelNo || fp?.productModelNo);
      const fpName = normalizeComparable(fp?.productName);
      const fpSpec = normalizeComparable(fp?.specification);

      const sameId = itemId && fpId && itemId === fpId;
      const sameModel = itemModel && fpModel && itemModel === fpModel;
      const sameName = itemName && fpName && itemName === fpName;
      const sameNameAndSpec = sameName && itemSpec && fpSpec && itemSpec === fpSpec;

      return sameId || sameModel || sameNameAndSpec || sameName;
    });

    if (matched) return matched;
    return feedbackProducts[index] || null;
  };
  
  // 🔥 转换产品列表格式 - 优先使用采购员反馈的价格
  const products = req.items?.map((item, index) => {
    const normalizedItem = normalizeFlowProductCore(item, index);
    const feedbackProduct = findFeedbackProduct(item, index);
    const feedbackQuantity = pickNumberOrNull(feedbackProduct?.quantity, item.quantity) || 0;
    const feedbackAmount = resolveFeedbackAmount(feedbackProduct);
    const derivedFeedbackUnitPrice =
      feedbackAmount != null && feedbackQuantity > 0
        ? feedbackAmount / feedbackQuantity
        : null;
    const resolvedUnitPrice =
      resolveFeedbackUnitPrice(feedbackProduct, item) ??
      derivedFeedbackUnitPrice ??
      undefined;
    const resolvedCurrency = String(
      feedbackProduct?.sourcePricing?.currency ||
      feedbackProduct?.sourcePricing?.currencyCode ||
      feedbackProduct?.sourcePricing?.currency_code ||
      feedbackProduct?.currency ||
      feedbackProduct?.currencyCode ||
      feedbackProduct?.currency_code ||
      item.targetCurrency ||
      'USD',
    ).toUpperCase();
    const parsedLine = parseRequirementLine(productRequirementLines[index]);
    const parsedItemProductName = parseProductSummary(item.productName);
    const parsedItemNameAlias = parseProductSummary((item as any).name);
    const parsedItemDescription = parseProductSummary((item as any).description);
    const parsedFeedbackName = parseProductSummary(feedbackProduct?.productName);
    const modelNo = pickText(
      item.modelNo,
      (item as any).model,
      (item as any).sku,
      parsedLine.modelNo,
      parsedItemProductName.modelNo,
      parsedItemNameAlias.modelNo,
      parsedItemDescription.modelNo,
      parsedFeedbackName.modelNo,
    ) || '-';
    const productName = pickText(
      parsedItemProductName.productName,
      parsedItemNameAlias.productName,
      parsedItemDescription.productName,
      parsedFeedbackName.productName,
      parsedLine.productName,
      item.productName,
      (item as any).name,
      (item as any).description,
      feedbackProduct?.productName,
    ) || '-';
    const specification = dedupeJoinedText(
      feedbackProduct?.specification,
      item.specification,
      (item as any).specification,
      (item as any).spec,
      parsedItemProductName.specification,
      parsedItemNameAlias.specification,
      parsedItemDescription.specification,
      parsedFeedbackName.specification,
      parsedLine.specification,
    ) || '-';
    
    const localizedDisplay = resolveFlowProductDisplay(
      {
        ...item,
        productNameEn: (item as any)?.productNameEn,
        productNameZh: (item as any)?.productNameZh,
        specificationEn: (item as any)?.specificationEn,
        specificationZh: (item as any)?.specificationZh,
        productName:
          procurementLanguage === 'zh'
            ? pickText(
                (item as any)?.productNameZh,
                feedbackProduct?.productNameZh,
                productName,
                normalizedItem.productNameZh,
                normalizedItem.productName,
              )
            : pickText(
                (item as any)?.productNameEn,
                feedbackProduct?.productNameEn,
                productName,
                normalizedItem.productNameEn,
                normalizedItem.productName,
              ),
        specification:
          procurementLanguage === 'zh'
            ? pickText(
                (item as any)?.specificationZh,
                feedbackProduct?.specificationZh,
                specification,
                normalizedItem.specificationZh,
                normalizedItem.specification,
              )
            : pickText(
                (item as any)?.specificationEn,
                feedbackProduct?.specificationEn,
                specification,
                normalizedItem.specificationEn,
                normalizedItem.specification,
              ),
      },
      procurementLanguage,
    );

    return {
      no: index + 1,
      modelNo: modelNo || normalizedItem.modelNo || '-',
      imageUrl: normalizedItem.imageUrl || '',
      productName: localizedDisplay.productName || productName || normalizedItem.productName,
      specification: localizedDisplay.specification || specification || normalizedItem.specification,
      quantity: feedbackProduct?.quantity || normalizedItem.quantity,
      unit: feedbackProduct?.unit || normalizedItem.unit || 'pcs',
      // 🔥 优先使用 BJ/sourcePricing 单价，其次采购反馈成本价，最后才回退询报池目标价
      unitPrice: resolvedUnitPrice,
      currency: resolvedCurrency,
      moq: feedbackProduct?.moq,
      leadTime: feedbackProduct?.leadTime,
      totalPrice:
        feedbackAmount ??
        (resolvedUnitPrice != null
          ? resolvedUnitPrice * (feedbackProduct?.quantity || item.quantity)
          : undefined),
      remarks: feedbackProduct?.remarks || item.remarks
    };
  }) || [];

  const tradingRequirementText = buildBilingualTradingRequirementsText({
    tradeTerms: (req as any).tradeTerms,
    deliveryTime: (req as any).deliveryDate || (req as any).requiredDeliveryDate || (req as any).requiredDate,
    portOfDestination:
      (req as any).portOfDestination ||
      (req as any).customer?.portOfDestination ||
      (req as any).sourceDocumentData?.requirements?.portOfDestination,
    paymentTerms: (req as any).paymentTerms,
    packingRequirements: (req as any).packagingRequirements,
    certifications: (req as any).qualityRequirements,
    otherRequirements: req.specialRequirements,
  });
  const fallbackSalesDeptNotes = joinNonEmptyText(
    tradingRequirementText,
    (req as any).remarks,
  ).replace(/；/g, '\n');

  return {
    // 采购需求单基本信息
    requirementNo: normalizeLegacyQrNumber(req.requirementNo),
    requirementDate: reqCreatedDate.split('T')[0],
    sourceInquiryNo: req.sourceInquiryNumber || req.sourceRef || '-',
    requiredResponseDate: (req as any).expectedQuoteDate || req.requiredDate,
    requiredDeliveryDate: localizeQrDeliveryRequirement((req as any).deliveryDate || req.requiredDate),
    
    // 客户信息
    customer: {
      companyName: req.customer?.companyName || 'N/A',
      contactPerson: req.customer?.contactPerson || 'N/A',
      email: req.customer?.email || 'N/A',
      phone: req.customer?.phone || 'N/A',
      address: req.customer?.address || 'N/A',
      region: req.region || 'North America'
    },
    
    // 产品清单
    products,
    
    // 客户需求要素
    customerRequirements: {
      deliveryTerms: (req as any).tradeTerms || 'FOB',
      paymentTerms:
        (req as any).paymentTerms
        || buildPaymentTermsText(
          (req as any).paymentMode,
          deriveBalanceTrigger((req as any).paymentMode, (req as any).balanceTrigger || null),
        ),
      qualityStandard: (req as any).qualityRequirements || '符合国际标准',
      packaging: (req as any).packagingRequirements || '标准出口包装',
      specialRequirements: req.specialRequirements
    },
    conditionGroups: buildProcurementConditionGroups(req, 'qr'),
    
    // 业务部说明
    salesDeptNotes:
      (req as any).salesDeptNotes ||
      (req as any).documentDataSnapshot?.salesDeptNotes ||
      fallbackSalesDeptNotes,
    
    // 🔥 采购部反馈 - 从采购反馈中读取采购员建议，并进行脱敏处理
    purchaseDeptFeedback: desensitizePurchaserFeedbackText(
      req.purchaserFeedback?.purchaserRemarks || '',
      req.purchaserFeedback,
      userRole,
    ),
    
    urgency: req.urgency,
    createdBy: resolveCreatedByDisplay()
  };
};

export const buildQuoteRequirementDocumentSnapshot = (
  req: QuoteRequirement,
  userRole?: string,
  options?: { forceRebuild?: boolean },
): QuoteRequirementDocumentData => {
  const existing = (req as any).documentDataSnapshot || (req as any).document_data_snapshot || null;
  if (!options?.forceRebuild && existing && typeof existing === 'object' && Array.isArray((existing as any).products)) {
    return {
      ...(existing as QuoteRequirementDocumentData),
      purchaseDeptFeedback: desensitizePurchaserFeedbackText(
        req.purchaserFeedback?.purchaserRemarks || (existing as any).purchaseDeptFeedback || '',
        req.purchaserFeedback,
        userRole,
      ),
    };
  }
  return convertToPRData(req, userRole);
};

/**
 * 🔥 生成询价单文档数据
 */
export const generateXJDocumentData = (
  supplier: Supplier,
  requirement: QuoteRequirement,
  deadline: Date,
  remarks: string,
  selectedProductIds: string[],
  xjNoOverride?: string
): XJData => {
  const adminCompany = buildAdminCompanyContact();
  const resolvedSupplierRaw = findSupplier({
    code: supplier?.code,
    email: supplier?.email,
    name: supplier?.name,
  });
  const supplierProfile = resolvedSupplierRaw ? toSupplierProfile(resolvedSupplierRaw) : null;
  const xjNo = xjNoOverride || `XJ-${new Date().toISOString().slice(2,10).replace(/-/g,'')}-0000`; // caller must provide xjNoOverride
  const requestContext = extractProcurementRequestContext(requirement);
  const commercialTerms = requestContext.commercialTerms || {};
  const customerRequirements = requestContext.customerRequirements || {};
  const visibility = requestContext.downstreamVisibility;
  const exposeInternalTargetToSupplier = !visibility?.maskInternalTargetCostToSupplier;
  
  // 只包含选中的产品
  const selectedProducts = requirement.items?.filter(item => selectedProductIds.includes(String(item.id))) || [];
  
  // 🔥 组合询价说明
  const salesDeptNotes = (requirement as any).salesDeptNotes || 
                         (requirement as any).remarks || 
                         (requirement as any).notes || 
                         (requirement as any).businessDeptNotes || '';
  const specialRequirements = requirement.specialRequirements || '';
  const purchaseRemarks = remarks || '';
  
  // 构建完整的询价说明
  let inquiryDescription = '';
  if (salesDeptNotes) {
    inquiryDescription += `【业务部说明】\n${salesDeptNotes}`;
  }
  if (specialRequirements) {
    inquiryDescription += inquiryDescription ? `\n\n【特殊要求】\n${specialRequirements}` : `【特殊要求】\n${specialRequirements}`;
  }
  if (purchaseRemarks) {
    inquiryDescription += inquiryDescription ? `\n\n【采购部补充】\n${purchaseRemarks}` : `【采购部补充】\n${purchaseRemarks}`;
  }
  const customerRequirementSummary = joinNonEmptyText(
    customerRequirements.packagingRequirements ? `客户包装要求: ${customerRequirements.packagingRequirements}` : '',
    customerRequirements.otherRequirements ? `客户其他要求: ${customerRequirements.otherRequirements}` : '',
    customerRequirements.customerRemarks ? `客户补充说明: ${customerRequirements.customerRemarks}` : '',
    Array.isArray(customerRequirements.productRequirements) && customerRequirements.productRequirements.length > 0
      ? `客户产品要求: ${customerRequirements.productRequirements.join(' / ')}`
      : '',
  );
  if (customerRequirementSummary) {
    inquiryDescription += inquiryDescription ? `\n\n【客户需求摘要（已脱敏）】\n${customerRequirementSummary}` : `【客户需求摘要（已脱敏）】\n${customerRequirementSummary}`;
  }
  if (commercialTerms.targetCostRange && exposeInternalTargetToSupplier) {
    inquiryDescription += inquiryDescription ? `\n\n【业务目标成本参考】\n${commercialTerms.targetCostRange}` : `【业务目标成本参考】\n${commercialTerms.targetCostRange}`;
  }
  const xjConditionSource = {
    ...requirement,
    commercialTerms: {
      ...commercialTerms,
      remarks: joinNonEmptyText(purchaseRemarks, commercialTerms.remarks),
    },
    remarks: joinNonEmptyText(purchaseRemarks, (requirement as any).remarks),
  };
  const procurementLanguage = inferSupplierDocumentLanguage({
    supplierProfile,
    supplierName: supplier.name,
    supplierAddress: supplier.address,
    supplierRegion: supplier.region,
  });
  
  return {
    xjNo: xjNo,
    xjDate: new Date().toISOString().split('T')[0],
    requiredResponseDate: deadline.toISOString().split('T')[0],
    requiredDeliveryDate: String(
      commercialTerms.deliveryDate ||
      (requirement as any).requiredDate ||
      (requirement as any).expectedDate ||
      deadline.toISOString().split('T')[0],
    ).split('T')[0],
    
    buyer: {
      name: adminCompany.nameCN,
      nameEn: adminCompany.nameEN,
      address: adminCompany.addressCN,
      addressEn: adminCompany.addressEN,
      contactPerson: adminCompany.contactPerson,
      tel: adminCompany.phone,
      email: adminCompany.email
    },
    
    supplier: {
      companyName: supplierProfile?.name || supplier.name,
      supplierCode: supplierProfile?.code || supplier.code,
      contactPerson: supplierProfile?.contactPerson || (supplier as any).contactPerson || '联系人',
      tel: supplierProfile?.phone || supplier.phone || '+86-xxx-xxxx-xxxx',
      email: supplierProfile?.email || supplier.email || 'supplier@example.com',
      address: supplierProfile?.address || supplier.address || '供应商地址'
    },
    
    products: selectedProducts.map((item, index) => {
      const normalized = resolveFlowProductDisplay(item, procurementLanguage);
      return {
        no: index + 1,
        imageUrl: normalized.imageUrl || undefined,
        description: normalized.productName || '-',
        modelNo: normalized.modelNo || getFormalBusinessModelNo(item) || '-',
        specification: normalized.specification || '-',
        quantity: normalized.quantity,
        unit: normalized.unit,
        targetPrice:
          visibility?.maskCustomerPublicPrice || item.targetPrice == null
            ? undefined
            : String(item.targetPrice),
        remarks: normalized.remarks || item.remarks,
      };
    }),
    
    inquiryDescription: inquiryDescription,
    conditionGroups: buildProcurementConditionGroups(xjConditionSource, 'xj'),
    
    terms: {
      currency:
        commercialTerms.targetCostRange && exposeInternalTargetToSupplier
          ? '请按邀约条件报价'
          : ((requirement as any).currency || 'USD'),
      paymentTerms:
        commercialTerms.paymentTerms
        || (requirement as any).paymentTerms
        || buildPaymentTermsText(
          commercialTerms.paymentMode || (requirement as any).paymentMode,
          deriveBalanceTrigger(
            commercialTerms.paymentMode || (requirement as any).paymentMode,
            commercialTerms.balanceTrigger || (requirement as any).balanceTrigger || null,
          ),
        ),
      deliveryTerms: commercialTerms.tradeTerms || (requirement as any).tradeTerms || 'EXW 工厂交货',
      deliveryAddress: (requirement as any).deliveryAddress || '福建省福州市仓山区仓山工业区',
      deliveryRequirement: commercialTerms.deliveryDate || `收到订单后${(requirement as any).leadTime || 30}天内交货`,
      qualityStandard: joinNonEmptyText(
        commercialTerms.qualityRequirements,
        (requirement as any).qualityRequirements,
      ) || '产品需符合GB/T国标，如有国际标准（ISO、CE等）请提供相关认证',
      inspectionMethod: '到货后5%抽检，如有不合格品按比例折算退款或补货',
      packaging: joinNonEmptyText(
        commercialTerms.packagingRequirements,
        customerRequirements.packagingRequirements,
        (requirement as any).packagingRequirements,
      ) || '标准出口包装，纸箱+托盘，适合长途运输',
      shippingMarks: '中性唛头，或根据客户要求定制唛头（具体要求来单确认）',
      inspectionRequirement: joinNonEmptyText(
        commercialTerms.expectedQuoteDate ? `请于 ${commercialTerms.expectedQuoteDate} 前回复报价` : '',
        '请在报价单中注明报价有效期和交货周期',
      ),
      technicalDocuments: '产品说明书、检测报告、认证证书（CE/RoHS等）',
      ipRights: '产品设计、商标、专利归属我方，供应商不得侵权',
      confidentiality: '客户信息、客户公开价格、联系人信息严格保密，不得泄露给第三方',
      sampleRequirement: '如需样品，请提供免费样品（邮费到付）',
      moq: '无最小起订量限制',
      remarks: joinNonEmptyText(
        commercialTerms.targetCostRange && exposeInternalTargetToSupplier
          ? `业务目标成本参考: ${commercialTerms.targetCostRange}`
          : '',
        customerRequirements.otherRequirements ? `客户其他要求: ${customerRequirements.otherRequirements}` : '',
        '客户公开销售价已脱敏，不作为对供应商的报价依据',
        '其他特殊要求请在报价单中说明',
      )
    }
  };
};

export const buildXJDocumentSnapshot = (xj: XJ): XJData => {
  const adminCompany = buildAdminCompanyContact();
  const raw = ((xj as any).documentDataSnapshot || (xj as any).document_data_snapshot || xj.documentData || {}) as any;
  const rawBuyer = raw.buyer && typeof raw.buyer === 'object' ? raw.buyer : {};
  const rawSupplier = raw.supplier && typeof raw.supplier === 'object' ? raw.supplier : {};
  const resolvedSupplierRaw = findSupplier({
    code: rawSupplier.supplierCode || xj.supplierCode,
    email: rawSupplier.email || xj.supplierEmail,
    name: rawSupplier.companyName || xj.supplierName,
  });
  const supplierProfile = resolvedSupplierRaw ? toSupplierProfile(resolvedSupplierRaw) : null;
  const rawTerms = raw.terms && typeof raw.terms === 'object' ? raw.terms : {};
  const sourceProducts = Array.isArray(raw.products)
    ? raw.products
    : Array.isArray(xj.products)
      ? xj.products
      : [];
  const procurementLanguage = inferSupplierDocumentLanguage({
    supplier: rawSupplier,
    supplierName: xj.supplierName,
    supplierEmail: xj.supplierEmail,
    supplierAddress: rawSupplier.address || supplierProfile?.address || xj.supplierName || '',
  });
  const fallbackDate = String(xj.quotationDeadline || xj.expectedDate || xj.createdDate || '').split('T')[0];

  return {
    xjNo: String(raw.xjNo || xj.supplierXjNo || xj.xjNumber || ''),
    xjDate: String(raw.xjDate || xj.createdDate || '').split('T')[0],
    requiredResponseDate: String(raw.requiredResponseDate || xj.quotationDeadline || fallbackDate),
    requiredDeliveryDate: String(raw.requiredDeliveryDate || xj.expectedDate || xj.quotationDeadline || fallbackDate),
    inquiryDescription: String(raw.inquiryDescription || xj.remarks || ''),
    buyer: {
      name: String(rawBuyer.name || rawBuyer.companyName || adminCompany.nameCN),
      nameEn: String(rawBuyer.nameEn || rawBuyer.companyNameEn || adminCompany.nameEN),
      address: String(rawBuyer.address || adminCompany.addressCN),
      addressEn: String(rawBuyer.addressEn || adminCompany.addressEN),
      tel: String(rawBuyer.tel || adminCompany.phone),
      email: String(rawBuyer.email || adminCompany.email),
      contactPerson: String(rawBuyer.contactPerson || adminCompany.contactPerson),
    },
    supplier: {
      companyName: String(rawSupplier.companyName || supplierProfile?.name || xj.supplierName || ''),
      address: String(rawSupplier.address || supplierProfile?.address || ''),
      contactPerson: String(rawSupplier.contactPerson || supplierProfile?.contactPerson || xj.supplierContact || ''),
      tel: String(rawSupplier.tel || supplierProfile?.phone || ''),
      email: String(rawSupplier.email || supplierProfile?.email || xj.supplierEmail || ''),
      supplierCode: String(rawSupplier.supplierCode || supplierProfile?.code || xj.supplierCode || ''),
    },
    products: sourceProducts.map((item: any, index: number) => {
      const normalized = resolveFlowProductDisplay(item, procurementLanguage);
      const factoryModelNo = getFactoryFacingModelNo(item) || normalized.factoryModelNo || normalized.modelNo || '';
      return {
        no: index + 1,
        modelNo: factoryModelNo || undefined,
        imageUrl: normalized.imageUrl || undefined,
        itemCode: item?.itemCode ? String(item.itemCode) : (factoryModelNo || undefined),
        internalModelNo: item?.internalModelNo || item?.masterRef?.internalModelNo || normalized.modelNo || undefined,
        customerModelNo: item?.customerModelNo || item?.displayModelNo || undefined,
        factoryModelNo: factoryModelNo || undefined,
        description: normalized.productName || '',
        specification: normalized.specification || '-',
        quantity: Number(normalized.quantity || 0),
        unit: String(normalized.unit || 'PCS'),
        targetPrice: item?.targetPrice != null ? String(item.targetPrice) : undefined,
        remarks: normalized.remarks || undefined,
      };
    }),
    conditionGroups: Array.isArray(raw.conditionGroups) ? raw.conditionGroups : [],
    terms: {
      paymentTerms: rawTerms.paymentTerms ? String(rawTerms.paymentTerms) : undefined,
      deliveryTerms: rawTerms.deliveryTerms ? String(rawTerms.deliveryTerms) : undefined,
      deliveryAddress: rawTerms.deliveryAddress ? String(rawTerms.deliveryAddress) : undefined,
      currency: rawTerms.currency ? String(rawTerms.currency) : undefined,
      qualityStandard: rawTerms.qualityStandard ? String(rawTerms.qualityStandard) : undefined,
      inspectionMethod: rawTerms.inspectionMethod ? String(rawTerms.inspectionMethod) : undefined,
      deliveryRequirement: rawTerms.deliveryRequirement ? String(rawTerms.deliveryRequirement) : undefined,
      packaging: rawTerms.packaging ? String(rawTerms.packaging) : undefined,
      shippingMarks: rawTerms.shippingMarks ? String(rawTerms.shippingMarks) : undefined,
      inspectionRequirement: rawTerms.inspectionRequirement ? String(rawTerms.inspectionRequirement) : undefined,
      technicalDocuments: rawTerms.technicalDocuments ? String(rawTerms.technicalDocuments) : undefined,
      ipRights: rawTerms.ipRights ? String(rawTerms.ipRights) : undefined,
      confidentiality: rawTerms.confidentiality ? String(rawTerms.confidentiality) : undefined,
      sampleRequirement: rawTerms.sampleRequirement ? String(rawTerms.sampleRequirement) : undefined,
      moq: rawTerms.moq ? String(rawTerms.moq) : undefined,
      remarks: rawTerms.remarks ? String(rawTerms.remarks) : undefined,
    },
  };
};

// ─── Pass A: Pure helpers extracted from PurchaseOrderManagementEnhanced ─────

/** Normalise DB status field to typed union — Supabase-first, no front-end re-computation. */
export const calculateRequirementStatus = (req: QuoteRequirement): 'pending' | 'partial' | 'processing' | 'completed' => {
  const s = req.status as string;
  if (s === 'completed') return 'completed';
  if (s === 'processing' || s === 'in_progress') return 'processing';
  if (s === 'partial') return 'partial';
  return 'pending';
};

/** Canonical key for an XJ record (supplierXjNo preferred, falls back to xjNumber). */
export const getXJKey = (xj: any): string => String(xj?.supplierXjNo || xj?.xjNumber || '').trim();

/** Canonical key for a supplier quotation's source-XJ reference. */
export const getQuotationXJKey = (q: any): string => String(q?.sourceXJ || q?.sourceXJNumber || '').trim();

/**
 * Human-readable label for procurement runtime / workflow statuses.
 * New split-field statuses are preferred, while legacy procurementRequestStatus values remain supported.
 */
export const getProcurementRequestStatusText = (status: string): string => {
  if (status === 'pending_assignment')            return '待分配供应商';
  if (status === 'partially_allocated')           return '部分已分配';
  if (status === 'fully_allocated')               return '已分配完成';
  // PR-tier
  if (status === 'pending_procurement_assignment') return '待分配供应商';
  if (status === 'partial_allocated')              return '部分已分配';
  if (status === 'allocated_completed')            return '已分配完成';
  // CG-tier
  if (status === 'draft_allocated')               return 'CG草稿·待提交审核';
  if (status === 'pending_manager_approval')      return '待采购主管审核';
  if (status === 'pending_ceo_approval')          return '待 CEO 二审';
  if (status === 'approved_boss')                 return '审核通过·可下推';
  if (status === 'rejected_boss')                 return '审核驳回';
  if (status === 'pushed_supplier')               return '已推供应商';
  // Unknown / empty — treated as unassigned PR
  return '待分配供应商';
};

/** Parse any date-like value (string/number/Date) to a Date, or undefined if invalid. */
export const parseDateLike = (value: unknown): Date | undefined => {
  const raw = String(value || '').trim();
  if (!raw) return undefined;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? undefined : d;
};

/** Format a Date to YYYY-MM-DD for storage; returns '' when date is absent. */
export const formatDateForStorage = (date?: Date): string => {
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/** Coerce any value to a finite number, defaulting to 0 for NaN / Infinity. */
export const toNumericAmount = (value: unknown): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

/**
 * Extract the line-items array from various quotation shapes:
 * quotation.items → quotation.quoteData.items → quotation.documentData.products (mapped).
 */
export const getQuotationItems = (quotation: any): any[] => {
  if (Array.isArray(quotation?.items)) return quotation.items;
  if (Array.isArray(quotation?.quoteData?.items)) return quotation.quoteData.items;
  if (Array.isArray(quotation?.documentData?.products)) {
    return quotation.documentData.products.map((p: any) => ({
      id: p?.id || p?.productId || '',
      productName: p?.description || p?.productName || '',
      modelNo: getFormalBusinessModelNo(p),
      unitPrice: p?.unitPrice || 0,
      currency: p?.currency || quotation?.currency || '',
    }));
  }
  return [];
};

/** Render a date string as YYYY-MM-DD, falling back to today when absent or invalid. */
export const toDateText = (value?: string): string => {
  if (!value) return new Date().toISOString().split('T')[0];
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? new Date().toISOString().split('T')[0] : d.toISOString().split('T')[0];
};

/** Format a UTC timestamp as "YYMMdd UTC HH:mm" compact display string. */
export const formatCompactUtcMinute = (raw?: string): string => {
  if (!raw) return '—';
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  const yy = String(d.getUTCFullYear()).slice(-2);
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mi = String(d.getUTCMinutes()).padStart(2, '0');
  return `${yy}${mm}${dd} UTC ${hh}:${mi}`;
};

/**
 * Assemble an XJData document preview from a persisted XJ record.
 * Re-parameterised (Pass A): accepts purchaseRequirements explicitly instead of closing over component state.
 */
export const buildXJPreviewData = (xj: XJ, purchaseRequirements: QuoteRequirement[]): XJData => {
  const adminCompany = buildAdminCompanyContact();
  const raw = xj.documentData && typeof xj.documentData === 'object' && !Array.isArray(xj.documentData)
    ? (xj.documentData as any)
    : {};
  const rawBuyer = raw.buyer && typeof raw.buyer === 'object' ? raw.buyer : {};
  const rawSupplier = raw.supplier && typeof raw.supplier === 'object' ? raw.supplier : {};
  const rawTerms = raw.terms && typeof raw.terms === 'object' ? raw.terms : {};
  const sourceProducts = Array.isArray(raw.products)
    ? raw.products
    : Array.isArray(xj.products)
      ? xj.products
      : [];
  const dateFallback = toDateText(xj.quotationDeadline || xj.createdDate);
  const relatedRequirement = purchaseRequirements.find((req) =>
    [
      (xj as any).requirementNo,
      (xj as any).sourceQRNumber,
      (xj as any).sourceQrNumber,
      (xj as any).sourceRef,
    ]
      .filter(Boolean)
      .some((value) => matchesNormalizedQrNumber(value, req.requirementNo, (xj as any).region, req.region)),
  );
  const fallbackConditionSource = relatedRequirement || {
    tradeTerms: rawTerms.deliveryTerms,
    paymentTerms: rawTerms.paymentTerms,
    deliveryDate: raw.requiredDeliveryDate || rawTerms.deliveryRequirement,
    qualityRequirements: rawTerms.inspectionMethod || rawTerms.qualityStandard,
    packagingRequirements: rawTerms.packaging,
    remarks: rawTerms.remarks,
    items: sourceProducts,
    notes: raw.inquiryDescription,
  };

  return {
    xjNo: String(raw.xjNo || xj.supplierXjNo || xj.xjNumber || ''),
    xjDate: toDateText(raw.xjDate || xj.createdDate),
    requiredResponseDate: toDateText(raw.requiredResponseDate || raw.quoteDeadline || raw.deadline || xj.quotationDeadline || dateFallback),
    requiredDeliveryDate: toDateText(raw.requiredDeliveryDate || xj.quotationDeadline || dateFallback),
    inquiryDescription: String(raw.inquiryDescription || ''),
    buyer: {
      name: String(rawBuyer.name || rawBuyer.companyName || adminCompany.nameCN),
      nameEn: String(rawBuyer.nameEn || rawBuyer.companyNameEn || adminCompany.nameEN),
      address: String(rawBuyer.address || adminCompany.addressCN),
      addressEn: String(rawBuyer.addressEn || adminCompany.addressEN),
      contactPerson: String(rawBuyer.contactPerson || adminCompany.contactPerson),
      tel: String(rawBuyer.tel || adminCompany.phone),
      email: String(rawBuyer.email || adminCompany.email),
    },
    supplier: {
      companyName: String(rawSupplier.companyName || xj.supplierName || ''),
      supplierCode: String(rawSupplier.supplierCode || xj.supplierCode || ''),
      contactPerson: String(rawSupplier.contactPerson || ''),
      tel: String(rawSupplier.tel || ''),
      email: String(rawSupplier.email || xj.supplierEmail || ''),
      address: String(rawSupplier.address || ''),
    },
    products: sourceProducts.map((p: any, i: number) => ({
      no: i + 1,
      description: String(p?.description || p?.productName || p?.name || ''),
      specification: String(p?.specification || '-'),
      quantity: Number(p?.quantity || 0),
      unit: String(p?.unit || '件'),
      modelNo: getFormalBusinessModelNo(p) || undefined,
      imageUrl: p?.imageUrl ? String(p.imageUrl) : undefined,
      targetPrice: p?.targetPrice ? String(p.targetPrice) : undefined,
    })),
    conditionGroups:
      Array.isArray(raw.conditionGroups) && raw.conditionGroups.length > 0
        ? raw.conditionGroups
        : buildProcurementConditionGroups(fallbackConditionSource, 'xj'),
    terms: {
      paymentTerms: String(
        rawTerms.paymentTerms
          || buildPaymentTermsText(
            rawTerms.paymentMode,
            deriveBalanceTrigger(rawTerms.paymentMode, rawTerms.balanceTrigger || null),
          ),
      ),
      deliveryTerms: String(rawTerms.deliveryTerms || 'EXW 工厂交货'),
      currency: String(rawTerms.currency || 'USD'),
      deliveryAddress: rawTerms.deliveryAddress ? String(rawTerms.deliveryAddress) : undefined,
      deliveryRequirement: rawTerms.deliveryRequirement ? String(rawTerms.deliveryRequirement) : undefined,
      qualityStandard: rawTerms.qualityStandard ? String(rawTerms.qualityStandard) : undefined,
      inspectionMethod: rawTerms.inspectionMethod ? String(rawTerms.inspectionMethod) : undefined,
      packaging: rawTerms.packaging ? String(rawTerms.packaging) : undefined,
      shippingMarks: rawTerms.shippingMarks ? String(rawTerms.shippingMarks) : undefined,
      inspectionRequirement: rawTerms.inspectionRequirement ? String(rawTerms.inspectionRequirement) : undefined,
      technicalDocuments: rawTerms.technicalDocuments ? String(rawTerms.technicalDocuments) : undefined,
      confidentiality: rawTerms.confidentiality ? String(rawTerms.confidentiality) : undefined,
      remarks: rawTerms.remarks ? String(rawTerms.remarks) : undefined,
    },
  };
};
