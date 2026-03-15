import { getCurrentUser } from '../utils/dataIsolation';
import { normalizeOemData, serializeOemDataForPersistence, type InquiryOemData } from '../types/oem';
import type {
  AttachmentSummarySnapshot,
  CustomerProductSourceType,
  FileManifestSnapshotEntry,
  MasterProductRef,
  ProductMappingRef,
} from './product-domain/types';
import {
  buildAttachmentSummarySnapshot,
  buildFileManifestSnapshot,
} from './services/tradeProductSnapshotService';

const STORAGE_KEY = 'customerProductLibrary';
const CHANGE_EVENT = 'customer-product-library-changed';
const MAX_INLINE_MEDIA_LENGTH = 160_000;

export type CustomerProductRecord = {
  id: string;
  sourceProductId: string;
  customerProductId?: string | null;
  customerEmail: string;
  companyId?: string | null;
  regionCode?: string | null;
  recordType?: 'product' | 'project';
  isProjectBased?: boolean;
  projectCode?: string | null;
  projectName?: string | null;
  currentRevisionId?: string | null;
  finalRevisionId?: string | null;
  finalQuotationId?: string | null;
  finalQuotationNumber?: string | null;
  projectRevisions?: CustomerProjectRevision[];
  serviceType?: 'qc_service' | 'general_service' | null;
  serviceCategory?: string | null;
  serviceScopeSummary?: string | null;
  serviceDeliverables?: string | null;
  inspectionType?: string | null;
  inspectionStandard?: string | null;
  deliveryMethod?: string | null;
  packageSummary?: string | null;
  sourceType?: CustomerProductSourceType;
  legacySourceType?: 'customer_owned' | 'third_party' | 'cosun' | null;
  productStatus?: 'draft' | 'active' | 'archived';
  packageVersion?: number;
  packageVersions?: CustomerProductPackageVersion[];
  productName: string;
  description: string;
  imageUrl: string;
  itemType: 'standard_sourcing' | 'oem_custom';
  customerModelNo: string;
  supplierModelNo: string;
  supplierProductId?: string | null;
  mappingStatus: 'pending' | 'confirmed';
  masterRef?: MasterProductRef | null;
  mappingRef?: ProductMappingRef | null;
  unit: string;
  targetPrice: number;
  lastQuantity: number;
  lastInquiryId?: string | null;
  lastInquiryNumber?: string | null;
  lastQuoteId?: string | null;
  lastQuoteNumber?: string | null;
  lastOrderId?: string | null;
  lastOrderNumber?: string | null;
  usageCount?: number;
  syncStatus: 'pending' | 'synced';
  syncMessage?: string | null;
  oem?: InquiryOemData;
  attachmentCount: number;
  attachmentSummarySnapshot?: AttachmentSummarySnapshot;
  fileManifestSnapshot?: FileManifestSnapshotEntry[];
  createdAt: string;
  updatedAt: string;
};

export type CustomerProductPackageVersion = {
  version: number;
  label: string;
  status: 'no_package' | 'basic_package' | 'technical_package_ready';
  summary: string;
  notes?: string | null;
  attachmentCount: number;
  oem?: InquiryOemData;
  updatedAt: string;
};

export type CustomerProjectRevision = {
  revisionId: string;
  revisionCode: string;
  revisionStatus: 'working' | 'quoted' | 'superseded' | 'final' | 'cancelled';
  revisionNote?: string | null;
  summary: string;
  attachmentCount: number;
  oem?: InquiryOemData;
  updatedAt: string;
};

type UpsertOptions = {
  customerEmail?: string | null;
  companyId?: string | null;
  regionCode?: string | null;
  lastInquiryId?: string | null;
  lastInquiryNumber?: string | null;
  lastQuoteId?: string | null;
  lastQuoteNumber?: string | null;
  lastOrderId?: string | null;
  lastOrderNumber?: string | null;
};

const canUseWindow = () => typeof window !== 'undefined';
const CUSTOMER_PRODUCT_SOURCE_TYPES: CustomerProductSourceType[] = [
  'customer_created',
  'saved_from_website',
  'derived_from_inquiry',
  'derived_from_order',
  'assigned_by_cosun',
];

const LEGACY_SOURCE_TYPE_MAP: Record<string, CustomerProductSourceType> = {
  customer_owned: 'customer_created',
  third_party: 'customer_created',
  cosun: 'assigned_by_cosun',
};

const sanitizeInlineMedia = (value?: string | null) => {
  const text = String(value || '');
  if (!text) return '';
  if (!text.startsWith('data:')) return text;
  return text.length <= MAX_INLINE_MEDIA_LENGTH ? text : '';
};

const sanitizeOemData = (value?: InquiryOemData | null) => {
  const normalized = normalizeOemData(value || null);
  if (!normalized.enabled) return undefined;
  return serializeOemDataForPersistence({
    ...normalized,
    files: normalized.files.map((file) => ({
      ...file,
      fileObject: null,
      previewUrl: sanitizeInlineMedia(file.previewUrl),
      storageUrl: sanitizeInlineMedia(file.storageUrl),
    })),
  });
};

const countOemAttachments = (value?: InquiryOemData | null) => {
  const normalized = normalizeOemData(value || null);
  return normalized.enabled ? normalized.files.length : 0;
};

const isCustomerProductSourceType = (value: unknown): value is CustomerProductSourceType =>
  CUSTOMER_PRODUCT_SOURCE_TYPES.includes(value as CustomerProductSourceType);

const normalizeCustomerProductSourceType = (
  value: unknown,
  fallback: CustomerProductSourceType = 'customer_created',
): CustomerProductSourceType => {
  const normalized = String(value || '').trim();
  if (isCustomerProductSourceType(normalized)) {
    return normalized;
  }
  return LEGACY_SOURCE_TYPE_MAP[normalized] || fallback;
};

const resolveLegacySourceType = (value: unknown): CustomerProductRecord['legacySourceType'] => {
  const normalized = String(value || '').trim();
  if (normalized === 'customer_owned' || normalized === 'third_party' || normalized === 'cosun') {
    return normalized;
  }
  return null;
};

const buildMasterRef = (product: any, existing?: CustomerProductRecord | null): MasterProductRef | null => {
  const incoming = product?.masterRef || existing?.masterRef;
  if (incoming && typeof incoming === 'object') {
    return {
      masterProductId: String(incoming.masterProductId || '').trim() || null,
      internalModelNo: String(incoming.internalModelNo || '').trim(),
      isResolved: Boolean(incoming.isResolved ?? incoming.masterProductId ?? incoming.internalModelNo),
    };
  }

  const masterProductId = String(
    product?.supplierProductId ||
      product?.productId ||
      existing?.supplierProductId ||
      '',
  ).trim() || null;
  const internalModelNo = String(
    product?.internalModelNo ||
      product?.modelNo ||
      product?.supplierModelNo ||
      existing?.supplierModelNo ||
      '',
  ).trim();
  if (!masterProductId && !internalModelNo) return null;
  return {
    masterProductId,
    internalModelNo,
    isResolved: Boolean(masterProductId || internalModelNo),
  };
};

const buildMappingRef = (product: any, existing?: CustomerProductRecord | null): ProductMappingRef | null => {
  const incoming = product?.mappingRef || existing?.mappingRef;
  if (incoming && typeof incoming === 'object') {
    return {
      mappingId: String(incoming.mappingId || '').trim() || null,
      mappingStatus: incoming.mappingStatus || 'unmapped',
      externalModelNo: String(incoming.externalModelNo || '').trim(),
      partyType: incoming.partyType || null,
    };
  }

  const externalModelNo = String(
    product?.customerModelNo ||
      product?.customer_model_no ||
      existing?.customerModelNo ||
      product?.supplierModelNo ||
      existing?.supplierModelNo ||
      '',
  ).trim();
  if (!externalModelNo) return null;
  return {
    mappingId: null,
    mappingStatus: product?.mappingStatus === 'confirmed' || existing?.mappingStatus === 'confirmed' ? 'confirmed' : 'pending',
    externalModelNo,
    partyType: product?.customerModelNo || product?.customer_model_no || existing?.customerModelNo ? 'customer' : 'supplier',
  };
};

const resolveCustomerProductSourceType = (
  product: any,
  existing?: CustomerProductRecord | null,
  options?: UpsertOptions,
): CustomerProductSourceType => {
  if (product?.sourceType) {
    return normalizeCustomerProductSourceType(product.sourceType);
  }
  if (existing?.sourceType) {
    return normalizeCustomerProductSourceType(existing.sourceType);
  }

  const source = String(product?.source || '').trim().toLowerCase();
  const addedFrom = String(product?.addedFrom || '').trim().toLowerCase();
  const createdFrom = String(product?.createdFrom || '').trim().toLowerCase();

  if (source === 'website' || addedFrom === 'website') return 'saved_from_website';
  if (createdFrom === 'order' || source === 'order') return 'derived_from_order';
  if (options?.lastInquiryId || options?.lastInquiryNumber || product?.lastInquiryId || product?.lastInquiryNumber) {
    return 'derived_from_inquiry';
  }
  if (source === 'cosun' || addedFrom === 'cosun') return 'assigned_by_cosun';
  return 'customer_created';
};

const normalizeRecord = (record: CustomerProductRecord): CustomerProductRecord => {
  const oem = sanitizeOemData(record.oem || null);
  return {
    ...record,
    serviceType:
      record.serviceType === 'qc_service' || record.serviceType === 'general_service'
        ? record.serviceType
        : null,
    serviceCategory: String(record.serviceCategory || '').trim() || null,
    serviceScopeSummary: String(record.serviceScopeSummary || '').trim() || null,
    serviceDeliverables: String(record.serviceDeliverables || '').trim() || null,
    inspectionType: String(record.inspectionType || '').trim() || null,
    inspectionStandard: String(record.inspectionStandard || '').trim() || null,
    deliveryMethod: String(record.deliveryMethod || '').trim() || null,
    packageSummary: String(record.packageSummary || '').trim() || null,
    lastQuoteId: String(record.lastQuoteId || '').trim() || null,
    lastQuoteNumber: String(record.lastQuoteNumber || '').trim() || null,
    lastOrderId: String(record.lastOrderId || '').trim() || null,
    lastOrderNumber: String(record.lastOrderNumber || '').trim() || null,
    usageCount: Math.max(0, Number(record.usageCount || 0) || 0),
    sourceType: normalizeCustomerProductSourceType(record.sourceType || record.legacySourceType),
    legacySourceType: resolveLegacySourceType(record.legacySourceType || record.sourceType),
    masterRef: buildMasterRef(record, null),
    mappingRef: buildMappingRef(record, null),
    oem,
    attachmentCount: countOemAttachments(oem),
    attachmentSummarySnapshot: record.attachmentSummarySnapshot || buildAttachmentSummarySnapshot(oem),
    fileManifestSnapshot: Array.isArray(record.fileManifestSnapshot)
      ? record.fileManifestSnapshot
      : buildFileManifestSnapshot(oem),
  };
};

const inferPackageStatus = (description: string, oem?: InquiryOemData) => {
  const attachmentCount = countOemAttachments(oem);
  if (attachmentCount > 0) return 'technical_package_ready' as const;
  if (String(description || '').trim()) return 'basic_package' as const;
  return 'no_package' as const;
};

const buildPackageSummary = (status: ReturnType<typeof inferPackageStatus>, attachmentCount: number) => {
  if (status === 'technical_package_ready') {
    return `${attachmentCount} technical attachment(s) saved with this package`;
  }
  if (status === 'basic_package') {
    return 'Business specification saved, technical files can be added next';
  }
  return 'Placeholder package without files';
};

const buildProjectSummary = (description: string, attachmentCount: number, revisionCode: string) => {
  if (attachmentCount > 0) {
    return `${revisionCode} carries ${attachmentCount} technical attachment(s) for project quotation traceability`;
  }
  if (String(description || '').trim()) {
    return `${revisionCode} keeps a business/technical baseline while project requirements are still maturing`;
  }
  return `${revisionCode} is a placeholder revision without files yet`;
};

const getNextRevisionCode = (existingRevisions?: CustomerProjectRevision[]) => {
  const revisions = Array.isArray(existingRevisions) ? existingRevisions : [];
  const letters = revisions
    .map((item) => String(item?.revisionCode || '').trim().toUpperCase())
    .filter((value) => /^[A-Z]$/.test(value));
  if (letters.length === 0) return 'A';
  const maxCode = letters.reduce((max, code) => Math.max(max, code.charCodeAt(0)), 64);
  return String.fromCharCode(Math.min(maxCode + 1, 90));
};

const buildProjectRevisions = ({
  existing,
  description,
  oem,
  now,
  revisionCode,
}: {
  existing?: CustomerProductRecord | null;
  description: string;
  oem?: InquiryOemData;
  now: string;
  revisionCode: string;
}): CustomerProjectRevision[] => {
  const attachmentCount = countOemAttachments(oem);
  const currentRevision: CustomerProjectRevision = {
    revisionId: existing?.currentRevisionId || `proj-rev-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    revisionCode,
    revisionStatus: 'working',
    revisionNote: normalizeOemData(oem).overallRequirementNote || description || '',
    summary: buildProjectSummary(description, attachmentCount, revisionCode),
    attachmentCount,
    oem,
    updatedAt: now,
  };

  const previousRevisions = Array.isArray(existing?.projectRevisions)
    ? existing.projectRevisions.filter((item) => String(item?.revisionId || '') !== currentRevision.revisionId)
    : [];

  return [currentRevision, ...previousRevisions];
};

const buildPackageVersions = ({
  existing,
  packageVersion,
  description,
  oem,
  now,
}: {
  existing?: CustomerProductRecord | null;
  packageVersion: number;
  description: string;
  oem?: InquiryOemData;
  now: string;
}): CustomerProductPackageVersion[] => {
  const status = inferPackageStatus(description, oem);
  const attachmentCount = countOemAttachments(oem);
  const currentVersion: CustomerProductPackageVersion = {
    version: packageVersion,
    label: `V${packageVersion}`,
    status,
    summary: buildPackageSummary(status, attachmentCount),
    notes: normalizeOemData(oem).overallRequirementNote || description || '',
    attachmentCount,
    oem,
    updatedAt: now,
  };

  const previousVersions = Array.isArray(existing?.packageVersions)
    ? existing.packageVersions.filter((item) => Number(item?.version || 0) !== packageVersion)
    : [];

  return [currentVersion, ...previousVersions].sort((a, b) => b.version - a.version);
};

const resolveCustomerIdentity = () => {
  const currentUser = getCurrentUser() as any;
  if (!canUseWindow()) {
    return {
      customerEmail: String(currentUser?.email || '').trim().toLowerCase(),
      companyId: currentUser?.companyId ? String(currentUser.companyId) : null,
      regionCode: currentUser?.region ? String(currentUser.region) : null,
    };
  }

  try {
    const authUser = JSON.parse(localStorage.getItem('cosun_auth_user') || 'null');
    const backendUser = JSON.parse(localStorage.getItem('cosun_backend_user') || 'null');
    const customerProfile = JSON.parse(localStorage.getItem('cosun_customer_profile') || 'null');
    return {
      customerEmail: String(
        currentUser?.email ||
          backendUser?.email ||
          authUser?.email ||
          customerProfile?.email ||
          '',
      )
        .trim()
        .toLowerCase(),
      companyId: String(
        currentUser?.companyId ||
          backendUser?.companyId ||
          authUser?.companyId ||
          customerProfile?.companyId ||
          '',
      ).trim() || null,
      regionCode: String(
        currentUser?.region ||
          backendUser?.region ||
          authUser?.region ||
          customerProfile?.region ||
          '',
      ).trim() || null,
    };
  } catch {
    return {
      customerEmail: String(currentUser?.email || '').trim().toLowerCase(),
      companyId: currentUser?.companyId ? String(currentUser.companyId) : null,
      regionCode: currentUser?.region ? String(currentUser.region) : null,
    };
  }
};

const readRecords = (): CustomerProductRecord[] => {
  if (!canUseWindow()) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter(Boolean).map((record) => normalizeRecord(record as CustomerProductRecord)) : [];
  } catch {
    return [];
  }
};

const persistRecords = (records: CustomerProductRecord[]) => {
  if (!canUseWindow()) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
};

const sortRecords = (records: CustomerProductRecord[]) =>
  [...records].sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')));

const replaceRecord = (records: CustomerProductRecord[], updatedRecord: CustomerProductRecord) => {
  const normalizedRecord = normalizeRecord(updatedRecord);
  const nextRecords = sortRecords([
    normalizedRecord,
    ...records.filter((item) => item.id !== normalizedRecord.id),
  ]);
  persistRecords(nextRecords);
  return normalizedRecord;
};

const findExistingRecord = (records: CustomerProductRecord[], product: any, customerEmail: string) => {
  const sourceProductId = String(product?.sourceProductId || product?.id || '').trim();
  const customerProductId = String(product?.customerProductId || '').trim();
  const customerModelNo = String(product?.customerModelNo || product?.customer_model_no || '').trim();

  return (
    records.find((record) => customerProductId && record.id === customerProductId) ||
    records.find((record) => sourceProductId && record.sourceProductId === sourceProductId) ||
    records.find(
      (record) =>
        record.customerEmail === customerEmail &&
        customerModelNo &&
        record.customerModelNo === customerModelNo,
    ) ||
    null
  );
};

export const customerProductLibraryService = {
  storageKey: STORAGE_KEY,
  changeEvent: CHANGE_EVENT,

  getAll() {
    return sortRecords(readRecords());
  },

  upsertFromManualItem(product: any, options: UpsertOptions = {}) {
    const identity = resolveCustomerIdentity();
    const customerEmail = String(options.customerEmail || identity.customerEmail || '')
      .trim()
      .toLowerCase();
    if (!customerEmail) {
      throw new Error('Customer email is required to persist customer products.');
    }

    const companyId = String(options.companyId || identity.companyId || '').trim() || null;
    const regionCode = String(options.regionCode || identity.regionCode || '').trim() || null;
    const now = new Date().toISOString();
    const records = readRecords();
    const existing = findExistingRecord(records, product, customerEmail);
    const oem = sanitizeOemData(product?.oem || existing?.oem || null);
    const packageVersion = Number(product?.packageVersion || existing?.packageVersion || 1) || 1;
    const description = String(product?.specifications || product?.description || existing?.description || '').trim();
    const isProjectBased = Boolean(product?.isProjectBased ?? existing?.isProjectBased ?? false);
    const recordType = ((product?.recordType as CustomerProductRecord['recordType'] | undefined)
      || existing?.recordType
      || (isProjectBased ? 'project' : 'product'));
    const nextRevisionCode = String(
      product?.revisionCode ||
      existing?.projectRevisions?.[0]?.revisionCode ||
      getNextRevisionCode(existing?.projectRevisions),
    ).trim().toUpperCase() || 'A';
    const projectRevisions = recordType === 'project'
      ? buildProjectRevisions({
          existing,
          description,
          oem,
          now,
          revisionCode: nextRevisionCode,
        })
      : existing?.projectRevisions;
    const currentRevisionId = recordType === 'project'
      ? projectRevisions?.[0]?.revisionId || existing?.currentRevisionId || null
      : null;

    const record: CustomerProductRecord = {
      id: existing?.id || String(product?.customerProductId || `cust-prod-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`),
      sourceProductId: String(product?.sourceProductId || product?.id || existing?.sourceProductId || ''),
      customerProductId: String(product?.customerProductId || existing?.id || '').trim() || null,
      customerEmail,
      companyId,
      regionCode,
      recordType,
      isProjectBased: recordType === 'project',
      projectCode: String(product?.projectCode || existing?.projectCode || '').trim() || null,
      projectName: String(product?.projectName || product?.productName || existing?.projectName || '').trim() || null,
      currentRevisionId,
      finalRevisionId: recordType === 'project'
        ? String(product?.finalRevisionId || existing?.finalRevisionId || '').trim() || null
        : null,
      finalQuotationId: recordType === 'project'
        ? String(product?.finalQuotationId || existing?.finalQuotationId || '').trim() || null
        : null,
      finalQuotationNumber: recordType === 'project'
        ? String(product?.finalQuotationNumber || existing?.finalQuotationNumber || '').trim() || null
        : null,
      projectRevisions,
      serviceType:
        product?.serviceType === 'qc_service' || product?.serviceType === 'general_service'
          ? product.serviceType
          : existing?.serviceType || null,
      serviceCategory: String(product?.serviceCategory || existing?.serviceCategory || '').trim() || null,
      serviceScopeSummary: String(product?.serviceScopeSummary || existing?.serviceScopeSummary || '').trim() || null,
      serviceDeliverables: String(product?.serviceDeliverables || existing?.serviceDeliverables || '').trim() || null,
      inspectionType: String(product?.inspectionType || existing?.inspectionType || '').trim() || null,
      inspectionStandard: String(product?.inspectionStandard || existing?.inspectionStandard || '').trim() || null,
      deliveryMethod: String(product?.deliveryMethod || existing?.deliveryMethod || '').trim() || null,
      packageSummary: String(product?.packageSummary || existing?.packageSummary || '').trim() || null,
      sourceType: resolveCustomerProductSourceType(product, existing, options),
      legacySourceType: resolveLegacySourceType(product?.sourceType || existing?.legacySourceType || existing?.sourceType),
      productStatus: (product?.productStatus as CustomerProductRecord['productStatus'] | undefined) || existing?.productStatus || 'active',
      packageVersion,
      packageVersions: buildPackageVersions({
        existing,
        packageVersion,
        description,
        oem,
        now,
      }),
      productName: String(product?.productName || existing?.productName || '').trim(),
      description,
      imageUrl: sanitizeInlineMedia(product?.image || product?.imageUrl || existing?.imageUrl || ''),
      itemType: product?.itemType === 'oem_custom' ? 'oem_custom' : 'standard_sourcing',
      customerModelNo: String(product?.customerModelNo || product?.customer_model_no || existing?.customerModelNo || '').trim(),
      supplierModelNo: String(product?.modelNo || product?.internalModelNo || existing?.supplierModelNo || '').trim(),
      supplierProductId: String(product?.supplierProductId || product?.productId || existing?.supplierProductId || '').trim() || null,
      mappingStatus: product?.supplierProductId || product?.productId || product?.modelNo || product?.internalModelNo ? 'confirmed' : existing?.mappingStatus || 'pending',
      masterRef: buildMasterRef(product, existing),
      mappingRef: buildMappingRef(product, existing),
      unit: String(product?.unit || existing?.unit || 'pcs').trim() || 'pcs',
      targetPrice: Number(product?.targetPrice || existing?.targetPrice || 0) || 0,
      lastQuantity: Number(product?.quantity || existing?.lastQuantity || 0) || 0,
      lastInquiryId: String(options.lastInquiryId || existing?.lastInquiryId || '').trim() || null,
      lastInquiryNumber: String(options.lastInquiryNumber || existing?.lastInquiryNumber || '').trim() || null,
      lastQuoteId: String(options.lastQuoteId || existing?.lastQuoteId || '').trim() || null,
      lastQuoteNumber: String(options.lastQuoteNumber || existing?.lastQuoteNumber || '').trim() || null,
      lastOrderId: String(options.lastOrderId || existing?.lastOrderId || '').trim() || null,
      lastOrderNumber: String(options.lastOrderNumber || existing?.lastOrderNumber || '').trim() || null,
      usageCount: Math.max(0, Number(product?.usageCount ?? existing?.usageCount ?? 0) || 0),
      syncStatus: product?.syncStatus === 'pending' ? 'pending' : 'synced',
      syncMessage: String(product?.syncMessage || existing?.syncMessage || '').trim() || null,
      oem,
      attachmentCount: countOemAttachments(oem),
      attachmentSummarySnapshot: buildAttachmentSummarySnapshot(oem),
      fileManifestSnapshot: buildFileManifestSnapshot(oem),
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };

    replaceRecord(records, record);
    return normalizeRecord(record);
  },

  backfillSupplierLink(product: any, options: UpsertOptions = {}) {
    return this.upsertFromManualItem(
      {
        ...product,
        syncStatus: 'synced',
      },
      options,
    );
  },

  createNextPackageVersion(customerProductId: string) {
    const records = readRecords();
    const existing = records.find((item) => item.id === customerProductId);
    if (!existing) {
      throw new Error('Customer product not found.');
    }

    const currentVersion = Number(existing.packageVersion || 1) || 1;
    const nextVersion = currentVersion + 1;

    const clonedProduct = {
      customerProductId: existing.id,
      id: existing.sourceProductId,
      sourceProductId: existing.sourceProductId,
      sourceType: existing.sourceType,
      productStatus: existing.productStatus,
      packageVersion: nextVersion,
      productName: existing.productName,
      description: existing.description,
      specifications: existing.description,
      imageUrl: existing.imageUrl,
      itemType: existing.itemType,
      customerModelNo: existing.customerModelNo,
      supplierModelNo: existing.supplierModelNo,
      supplierProductId: existing.supplierProductId,
      unit: existing.unit,
      targetPrice: existing.targetPrice,
      quantity: existing.lastQuantity,
      syncStatus: existing.syncStatus,
      syncMessage: existing.syncMessage,
      oem: existing.oem,
    };

    return this.upsertFromManualItem(clonedProduct, {
      customerEmail: existing.customerEmail,
      companyId: existing.companyId,
      regionCode: existing.regionCode,
      lastInquiryId: existing.lastInquiryId,
      lastInquiryNumber: existing.lastInquiryNumber,
      lastQuoteId: existing.lastQuoteId,
      lastQuoteNumber: existing.lastQuoteNumber,
      lastOrderId: existing.lastOrderId,
      lastOrderNumber: existing.lastOrderNumber,
    });
  },

  createNextProjectRevision(customerProductId: string) {
    const records = readRecords();
    const existing = records.find((item) => item.id === customerProductId);
    if (!existing) {
      throw new Error('Customer project not found.');
    }
    if (existing.recordType !== 'project' && !existing.isProjectBased) {
      throw new Error('Only project-based records can create a new revision.');
    }

    const nextRevisionCode = getNextRevisionCode(existing.projectRevisions);
    const currentRevision = Array.isArray(existing.projectRevisions) ? existing.projectRevisions[0] : null;

    return this.upsertFromManualItem(
      {
        customerProductId: existing.id,
        id: existing.sourceProductId,
        sourceProductId: existing.sourceProductId,
        recordType: 'project',
        isProjectBased: true,
        projectCode: existing.projectCode,
        projectName: existing.projectName || existing.productName,
        revisionCode: nextRevisionCode,
        finalRevisionId: existing.finalRevisionId,
        finalQuotationId: existing.finalQuotationId,
        finalQuotationNumber: existing.finalQuotationNumber,
        sourceType: existing.sourceType,
        productStatus: existing.productStatus,
        packageVersion: existing.packageVersion,
        productName: existing.productName,
        description: existing.description,
        specifications: existing.description,
        imageUrl: existing.imageUrl,
        itemType: existing.itemType,
        customerModelNo: existing.customerModelNo,
        supplierModelNo: existing.supplierModelNo,
        supplierProductId: existing.supplierProductId,
        unit: existing.unit,
        targetPrice: existing.targetPrice,
        quantity: existing.lastQuantity,
        syncStatus: existing.syncStatus,
        syncMessage: existing.syncMessage,
        oem: currentRevision?.oem || existing.oem,
      },
      {
        customerEmail: existing.customerEmail,
        companyId: existing.companyId,
        regionCode: existing.regionCode,
        lastInquiryId: existing.lastInquiryId,
        lastInquiryNumber: existing.lastInquiryNumber,
        lastQuoteId: existing.lastQuoteId,
        lastQuoteNumber: existing.lastQuoteNumber,
        lastOrderId: existing.lastOrderId,
        lastOrderNumber: existing.lastOrderNumber,
      },
    );
  },

  updateCurrentPackage(
    customerProductId: string,
    updates: {
      description?: string;
      packageNote?: string;
      files?: InquiryOemData['files'];
    },
  ) {
    const records = readRecords();
    const existing = records.find((item) => item.id === customerProductId);
    if (!existing) {
      throw new Error('Customer product not found.');
    }

    const normalizedOem = normalizeOemData(existing.oem);
    const nextOem = sanitizeOemData({
      ...normalizedOem,
      enabled: normalizedOem.enabled || Boolean(countOemAttachments(existing.oem)),
      overallRequirementNote: String(updates.packageNote ?? (normalizedOem.overallRequirementNote || '')).trim(),
      files: Array.isArray(updates.files) ? updates.files : normalizedOem.files,
    });

    return this.upsertFromManualItem(
      {
        customerProductId: existing.id,
        id: existing.sourceProductId,
        sourceProductId: existing.sourceProductId,
        recordType: 'product',
        isProjectBased: false,
        sourceType: existing.sourceType,
        productStatus: existing.productStatus,
        packageVersion: existing.packageVersion,
        productName: existing.productName,
        description: String(updates.description ?? (existing.description || '')).trim(),
        specifications: String(updates.description ?? (existing.description || '')).trim(),
        imageUrl: existing.imageUrl,
        itemType: existing.itemType,
        customerModelNo: existing.customerModelNo,
        supplierModelNo: existing.supplierModelNo,
        supplierProductId: existing.supplierProductId,
        unit: existing.unit,
        targetPrice: existing.targetPrice,
        quantity: existing.lastQuantity,
        syncStatus: existing.syncStatus,
        syncMessage: existing.syncMessage,
        oem: nextOem,
      },
      {
        customerEmail: existing.customerEmail,
        companyId: existing.companyId,
        regionCode: existing.regionCode,
        lastInquiryId: existing.lastInquiryId,
        lastInquiryNumber: existing.lastInquiryNumber,
        lastQuoteId: existing.lastQuoteId,
        lastQuoteNumber: existing.lastQuoteNumber,
        lastOrderId: existing.lastOrderId,
        lastOrderNumber: existing.lastOrderNumber,
      },
    );
  },

  updateCurrentProjectRevision(
    customerProductId: string,
    updates: {
      description?: string;
      revisionNote?: string;
      files?: InquiryOemData['files'];
    },
  ) {
    const records = readRecords();
    const existing = records.find((item) => item.id === customerProductId);
    if (!existing) {
      throw new Error('Customer project not found.');
    }
    if (existing.recordType !== 'project' && !existing.isProjectBased) {
      throw new Error('Only project-based records can update a revision.');
    }

    const currentRevision = Array.isArray(existing.projectRevisions) ? existing.projectRevisions[0] : null;
    const normalizedOem = normalizeOemData(currentRevision?.oem || existing.oem);
    const nextOem = sanitizeOemData({
      ...normalizedOem,
      enabled: normalizedOem.enabled || Boolean(countOemAttachments(currentRevision?.oem || existing.oem)),
      overallRequirementNote: String(updates.revisionNote ?? (normalizedOem.overallRequirementNote || '')).trim(),
      files: Array.isArray(updates.files) ? updates.files : normalizedOem.files,
    });

    return this.upsertFromManualItem(
      {
        customerProductId: existing.id,
        id: existing.sourceProductId,
        sourceProductId: existing.sourceProductId,
        recordType: 'project',
        isProjectBased: true,
        projectCode: existing.projectCode,
        projectName: existing.projectName || existing.productName,
        revisionCode: currentRevision?.revisionCode || 'A',
        finalRevisionId: existing.finalRevisionId,
        finalQuotationId: existing.finalQuotationId,
        finalQuotationNumber: existing.finalQuotationNumber,
        sourceType: existing.sourceType,
        productStatus: existing.productStatus,
        packageVersion: existing.packageVersion,
        productName: existing.productName,
        description: String(updates.description ?? (existing.description || '')).trim(),
        specifications: String(updates.description ?? (existing.description || '')).trim(),
        imageUrl: existing.imageUrl,
        itemType: existing.itemType,
        customerModelNo: existing.customerModelNo,
        supplierModelNo: existing.supplierModelNo,
        supplierProductId: existing.supplierProductId,
        unit: existing.unit,
        targetPrice: existing.targetPrice,
        quantity: existing.lastQuantity,
        syncStatus: existing.syncStatus,
        syncMessage: existing.syncMessage,
        oem: nextOem,
      },
      {
        customerEmail: existing.customerEmail,
        companyId: existing.companyId,
        regionCode: existing.regionCode,
        lastInquiryId: existing.lastInquiryId,
        lastInquiryNumber: existing.lastInquiryNumber,
        lastQuoteId: existing.lastQuoteId,
        lastQuoteNumber: existing.lastQuoteNumber,
        lastOrderId: existing.lastOrderId,
        lastOrderNumber: existing.lastOrderNumber,
      },
    );
  },

  updateProductMaster(
    customerProductId: string,
    updates: {
      productName?: string;
      customerModelNo?: string;
      supplierModelNo?: string;
      unit?: string;
      description?: string;
    },
  ) {
    const records = readRecords();
    const existing = records.find((item) => item.id === customerProductId);
    if (!existing) {
      throw new Error('Customer product not found.');
    }

    return this.upsertFromManualItem(
      {
        customerProductId: existing.id,
        id: existing.sourceProductId,
        sourceProductId: existing.sourceProductId,
        recordType: existing.recordType || (existing.isProjectBased ? 'project' : 'product'),
        isProjectBased: existing.isProjectBased,
        projectCode: existing.projectCode,
        projectName: existing.projectName || updates.productName || existing.productName,
        revisionCode: existing.projectRevisions?.[0]?.revisionCode,
        finalRevisionId: existing.finalRevisionId,
        finalQuotationId: existing.finalQuotationId,
        finalQuotationNumber: existing.finalQuotationNumber,
        sourceType: existing.sourceType,
        productStatus: existing.productStatus,
        packageVersion: existing.packageVersion,
        productName: String(updates.productName ?? existing.productName).trim(),
        description: String(updates.description ?? existing.description).trim(),
        specifications: String(updates.description ?? existing.description).trim(),
        imageUrl: existing.imageUrl,
        itemType: existing.itemType,
        customerModelNo: String(updates.customerModelNo ?? existing.customerModelNo).trim(),
        supplierModelNo: String(updates.supplierModelNo ?? existing.supplierModelNo).trim(),
        supplierProductId: existing.supplierProductId,
        unit: String(updates.unit ?? existing.unit).trim() || 'pcs',
        targetPrice: existing.targetPrice,
        quantity: existing.lastQuantity,
        syncStatus: existing.syncStatus,
        syncMessage: existing.syncMessage,
        oem: existing.oem,
      },
      {
        customerEmail: existing.customerEmail,
        companyId: existing.companyId,
        regionCode: existing.regionCode,
        lastInquiryId: existing.lastInquiryId,
        lastInquiryNumber: existing.lastInquiryNumber,
        lastQuoteId: existing.lastQuoteId,
        lastQuoteNumber: existing.lastQuoteNumber,
        lastOrderId: existing.lastOrderId,
        lastOrderNumber: existing.lastOrderNumber,
      },
    );
  },

  markProductUsedInInquiry(
    customerProductId: string,
    updates: {
      quantity?: number | null;
    } = {},
  ) {
    const records = readRecords();
    const existing = records.find((item) => item.id === customerProductId);
    if (!existing) {
      throw new Error('Customer product not found.');
    }

    return replaceRecord(records, {
      ...existing,
      lastQuantity: Number(updates.quantity ?? existing.lastQuantity ?? 0) || existing.lastQuantity || 0,
      usageCount: Math.max(0, Number(existing.usageCount || 0) + 1),
      updatedAt: new Date().toISOString(),
    });
  },

  updateProjectRevisionStatus(
    customerProductId: string,
    revisionId: string,
    revisionStatus: CustomerProjectRevision['revisionStatus'],
  ) {
    const records = readRecords();
    const existing = records.find((item) => item.id === customerProductId);
    if (!existing) {
      throw new Error('Customer project not found.');
    }
    if (existing.recordType !== 'project' && !existing.isProjectBased) {
      throw new Error('Only project-based records can update a revision.');
    }

    const normalizedRevisionId = String(revisionId || '').trim();
    if (!normalizedRevisionId) {
      throw new Error('Revision id is required.');
    }

    const nextProjectRevisions = Array.isArray(existing.projectRevisions)
      ? existing.projectRevisions.map((revision) =>
          String(revision?.revisionId || '').trim() === normalizedRevisionId
            ? {
                ...revision,
                revisionStatus,
                updatedAt: new Date().toISOString(),
              }
            : revision,
        )
      : [];

    return replaceRecord(records, {
      ...existing,
      currentRevisionId: nextProjectRevisions.some((revision) => revision.revisionId === normalizedRevisionId)
        ? normalizedRevisionId
        : existing.currentRevisionId,
      finalRevisionId: revisionStatus === 'final' ? normalizedRevisionId : existing.finalRevisionId,
      projectRevisions: nextProjectRevisions,
      updatedAt: new Date().toISOString(),
    });
  },

  setProjectFinalRevision(customerProductId: string, revisionId: string) {
    const records = readRecords();
    const existing = records.find((item) => item.id === customerProductId);
    if (!existing) {
      throw new Error('Customer project not found.');
    }
    if (existing.recordType !== 'project' && !existing.isProjectBased) {
      throw new Error('Only project-based records can lock a final revision.');
    }

    const normalizedRevisionId = String(revisionId || '').trim();
    if (!normalizedRevisionId) {
      throw new Error('Revision id is required.');
    }

    const nextProjectRevisions = Array.isArray(existing.projectRevisions)
      ? existing.projectRevisions.map((revision) => {
          const currentId = String(revision?.revisionId || '').trim();
          if (currentId === normalizedRevisionId) {
            return {
              ...revision,
              revisionStatus: 'final' as const,
              updatedAt: new Date().toISOString(),
            };
          }
          if (revision.revisionStatus === 'cancelled') {
            return revision;
          }
          return {
            ...revision,
            revisionStatus:
              revision.revisionStatus === 'final' ||
              revision.revisionStatus === 'working' ||
              revision.revisionStatus === 'quoted'
                ? 'superseded'
                : revision.revisionStatus,
          };
        })
      : [];

    return replaceRecord(records, {
      ...existing,
      currentRevisionId: normalizedRevisionId,
      finalRevisionId: normalizedRevisionId,
      projectRevisions: nextProjectRevisions,
      updatedAt: new Date().toISOString(),
    });
  },

  remove(customerProductId: string) {
    const nextRecords = readRecords().filter((item) => item.id !== customerProductId);
    persistRecords(nextRecords);
  },

  lockProjectFinalRevisionAndQuotation({
    customerProductId,
    revisionId,
    quotationId,
    quotationNumber,
  }: {
    customerProductId: string;
    revisionId: string;
    quotationId: string;
    quotationNumber: string;
  }) {
    const records = readRecords();
    const existing = records.find((item) => item.id === customerProductId);
    if (!existing) {
      throw new Error('Customer project not found.');
    }
    if (existing.recordType !== 'project' && !existing.isProjectBased) {
      throw new Error('Only project-based records can lock a final revision.');
    }

    const normalizedRevisionId = String(revisionId || '').trim();
    if (!normalizedRevisionId) {
      throw new Error('Revision id is required.');
    }

    const nextProjectRevisions = Array.isArray(existing.projectRevisions)
      ? existing.projectRevisions.map((revision) => {
          const currentId = String(revision?.revisionId || '').trim();
          if (currentId === normalizedRevisionId) {
            return {
              ...revision,
              revisionStatus: 'final' as const,
              updatedAt: new Date().toISOString(),
            };
          }
          if (revision.revisionStatus === 'cancelled') {
            return revision;
          }
          return {
            ...revision,
            revisionStatus: revision.revisionStatus === 'final' ? 'superseded' : (revision.revisionStatus === 'working' || revision.revisionStatus === 'quoted' ? 'superseded' : revision.revisionStatus),
          };
        })
      : [];

    const updatedRecord: CustomerProductRecord = {
      ...existing,
      currentRevisionId: normalizedRevisionId,
      finalRevisionId: normalizedRevisionId,
      finalQuotationId: String(quotationId || '').trim() || null,
      finalQuotationNumber: String(quotationNumber || '').trim() || null,
      projectRevisions: nextProjectRevisions,
      updatedAt: new Date().toISOString(),
    };

    const nextRecords = sortRecords([
      updatedRecord,
      ...records.filter((item) => item.id !== existing.id),
    ]);
    persistRecords(nextRecords);
    return updatedRecord;
  },
};
