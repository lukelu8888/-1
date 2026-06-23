import React, { createContext, useContext, useRef, useState, useEffect, ReactNode } from 'react';
import { CartItem } from './CartContext';
import type { RegionType } from '../utils/xjNumberGenerator';
import { getCurrentUser, getScopedStorageKey, getStoredPortalRole, isStoredStaffPortalRole, readScopedStoragePayload, resolveCurrentStorageIdentity } from '../utils/dataIsolation';
import { approvalRecordService, inquiryOemFactoryDispatchService, inquiryOemService, inquiryService, notificationSupabaseService, productMasterService, productModelMappingService, staffDirectoryService } from '../lib/supabaseService';
import { supabase } from '../lib/supabase';
import { ERP_EVENT_KEYS } from '../lib/erp-core/events';
import { emitErpEvent } from '../lib/erp-core/event-bus';
import { adaptInquiryToDocumentData } from '../utils/documentDataAdapters';
import { matchesBusinessOwnerEmail } from '../utils/quotationOwnership';
import type { CustomerInquiryData } from '../components/documents/templates/CustomerInquiryDocument';
import type { Region as SalesRepRegion } from '../lib/notification-rules';
import { normalizePersonnelEmail } from '../lib/notification-rules';
import { getRegionalManagerByRegion, getSalesRepByCustomer } from '../lib/customer-salesrep-mapping';
import { aggregateInquiryOemFromProducts, type InquiryOemData } from '../types/oem';
import { customerProductLibraryService } from '../lib/customerProductLibrary';
import { sendNotificationToUser } from '../utils/notificationUtils';
import { internalInquiryRoutingService } from '../lib/services/internalInquiryRoutingService';
import { mapInquiryRowToInquiry } from '../lib/services/inquiryService';
import type {
  AttachmentSummarySnapshot,
  FileManifestSnapshotEntry,
  InquirySnapshot,
  InquirySnapshotDraft,
  MasterProductRef,
  ProductMappingRef,
  SourceRef,
} from '../lib/product-domain/types';
import { tradeProductSnapshotService } from '../lib/services/tradeProductSnapshotService';
import { isCurrentLocalDevHost } from '../lib/localDevHost';
import {
  buildInquiryNumberPrefix,
  isUuidLike,
} from '../lib/services/inquiryRuntimeHelpers';

export type InquiryProductLine = CartItem & {
  id?: string;
  source?: string;
  addedFrom?: string;
  sourceType?: string;
  customerProductId?: string | null;
  sourceProductId?: string | null;
  supplierProductId?: string | null;
  customerModelNo?: string;
  supplierModelNo?: string;
  internalModelNo?: string;
  modelNo?: string;
  model_no?: string;
  name?: string;
  imageUrl?: string;
  specification?: string;
  specifications?: string;
  description?: string;
  targetPrice?: number;
  currency?: string;
  oem?: InquiryOemData;
  attachmentSummarySnapshot?: AttachmentSummarySnapshot;
  fileManifestSnapshot?: FileManifestSnapshotEntry[];
  masterRef?: MasterProductRef | null;
  mappingRef?: ProductMappingRef | null;
  sourceRef?: SourceRef | null;
  inquirySnapshotDraft?: InquirySnapshotDraft | null;
  inquirySnapshot?: InquirySnapshot | null;
};

export interface Inquiry {
  id: string;
  inquiryNumber?: string;
  date: string;
  userEmail: string;
  companyId?: string;
  products: InquiryProductLine[];
  status: 'draft' | 'pending' | 'quoted' | 'approved' | 'rejected';
  isSubmitted: boolean;
  totalPrice: number;
  region?: RegionType;
  buyerInfo?: {
    companyName: string;
    contactPerson: string;
    email: string;
    phone: string;
    mobile?: string;
    address: string;
    website?: string;
    businessType?: string;
  };
  shippingInfo: {
    cartons: string;
    cbm: string;
    totalGrossWeight: string;
    totalNetWeight: string;
  };
  requirements?: {
    incoterm?: string;
    locationLabel?: string;
    locationValue?: string;
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
  oemFactoryDispatch?: Record<string, any>;
  containerInfo?: {
    planningMode: 'automatic' | 'custom';
    recommendedContainer?: string;
    customContainers?: any[];
  };
  message?: string;
  documentDataSnapshot?: CustomerInquiryData;
  documentRenderMeta?: Record<string, any>;
  createdAt: number;
  submittedAt?: number;
  assignedTo?: string | null;
  salesRepEmail?: string | null;
  ownerUserId?: string | null;
  ownerEmail?: string | null;
  ownerName?: string | null;
  ownerRole?: string | null;
  syncStatus?: 'synced' | 'pending';
  syncMessage?: string | null;
}

interface InquiryContextType {
  inquiries: Inquiry[];
  addInquiry: (inquiry: Inquiry) => Promise<Inquiry>;
  getUserInquiries: (email: string) => Inquiry[];
  getCompanyInquiries: (companyId: string) => Inquiry[];
  updateInquiryStatus: (id: string, status: Inquiry['status']) => Promise<void>;
  updateInquiry: (id: string, updatedInquiry: Partial<Inquiry>) => Promise<void>;
  deleteInquiry: (id: string) => Promise<void>;
  submitInquiry: (id: string) => Promise<boolean>;
  getSubmittedInquiries: () => Inquiry[];
  getInquiriesByRegion: (region: RegionType) => Inquiry[];
  refreshInquiries: () => Promise<void>;
}

const InquiryContext = createContext<InquiryContextType | undefined>(undefined);
const HIDDEN_INQUIRY_IDS_KEY = 'hidden_inquiry_ids_v1';
const PENDING_INQUIRY_SYNC_KEY = 'pending_inquiry_sync_v2';
const LEGACY_PENDING_INQUIRY_SYNC_KEY = 'pending_inquiry_sync_v1';
const SYNCED_INQUIRY_CACHE_KEY = 'synced_inquiry_cache_v1';
const STAFF_SHARED_SUBMITTED_INQUIRY_CACHE_KEY = 'staff_shared_submitted_inquiries_v1';
const QUOTE_REQUIREMENT_CONTEXT_CACHE_PREFIX = 'quote_requirement_context_cache_v1';
const SALES_QUOTATION_CONTEXT_CACHE_KEY = 'sales_quotation_context_cache_v1';
const SALES_CONTRACT_CONTEXT_CACHE_BASE_KEY = 'sales_contract_context_cache_v1';

const resolveInquiryStorageIdentity = () => {
  if (typeof window === 'undefined') {
    return { email: 'anonymous', role: 'customer' };
  }

  try {
    const currentUser = getCurrentUser() as any;
    const authUser = JSON.parse(localStorage.getItem('cosun_auth_user') || 'null');
    const backendUser = JSON.parse(localStorage.getItem('cosun_backend_user') || 'null');
    const email = String(
      currentUser?.email ||
      authUser?.email ||
      backendUser?.email ||
      'anonymous',
    ).trim().toLowerCase();
    const role = String(
      currentUser?.type ||
      authUser?.type ||
      backendUser?.portal_role ||
      currentUser?.role ||
      'customer',
    ).trim().toLowerCase();
    return {
      email: email || 'anonymous',
      role: role || 'customer',
    };
  } catch {
    return { email: 'anonymous', role: 'customer' };
  }
};

const getStableInquiryStorageKey = (baseKey: string) => {
  const { email } = resolveInquiryStorageIdentity();
  return `${baseKey}:${email}`;
};

const getLegacyInquiryStorageKeys = (baseKey: string) => {
  if (typeof window === 'undefined') return [] as string[];
  const { email, role } = resolveInquiryStorageIdentity();
  const keys = new Set<string>([
    `${baseKey}:${email}:${role}`,
    `${baseKey}:${email}:customer`,
    `${baseKey}:${email}:unknown`,
    `${baseKey}:${email}:admin`,
    `${baseKey}:${email}:staff`,
    `${baseKey}:${email}:supplier`,
  ]);

  try {
    const prefix = `${baseKey}:${email}:`;
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (key?.startsWith(prefix)) {
        keys.add(key);
      }
    }
  } catch {
    // ignore storage scan failures
  }

  return Array.from(keys);
};

const readInquiryStoragePayload = (baseKey: string) => {
  if (typeof window === 'undefined') return null;
  const candidateKeys = [getStableInquiryStorageKey(baseKey), ...getLegacyInquiryStorageKeys(baseKey)];
  for (const key of candidateKeys) {
    try {
      const raw = localStorage.getItem(key);
      if (raw) return raw;
    } catch {
      // ignore malformed entries and keep scanning
    }
  }
  return null;
};

const clearLegacyInquiryStorageKeys = (baseKey: string) => {
  if (typeof window === 'undefined') return;
  const stableKey = getStableInquiryStorageKey(baseKey);
  for (const key of getLegacyInquiryStorageKeys(baseKey)) {
    if (key === stableKey) continue;
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore cleanup failures
    }
  }
};

const getHiddenInquiryStorageKey = () => {
  return getStableInquiryStorageKey(HIDDEN_INQUIRY_IDS_KEY);
};

const getPendingInquiryStorageKey = () => {
  return getStableInquiryStorageKey(PENDING_INQUIRY_SYNC_KEY);
};

const getLegacyPendingInquiryStorageKey = () => {
  return `${getStableInquiryStorageKey(LEGACY_PENDING_INQUIRY_SYNC_KEY)}:legacy`;
};

const getSyncedInquiryCacheStorageKey = () => {
  return getStableInquiryStorageKey(SYNCED_INQUIRY_CACHE_KEY);
};

const getStaffSharedSubmittedInquiryCacheStorageKey = () => {
  return STAFF_SHARED_SUBMITTED_INQUIRY_CACHE_KEY;
};

const readArrayLikePayload = (raw: string | null): Record<string, any>[] => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((item) => item && typeof item === 'object') : [];
  } catch {
    return [];
  }
};

const readScopedLocalArray = (baseKey: string) => {
  if (typeof window === 'undefined') return [] as Record<string, any>[];
  return readArrayLikePayload(readScopedStoragePayload(baseKey, [baseKey]));
};

const getLegacySalesContractCacheKeys = () => {
  if (typeof window === 'undefined') return [] as string[];
  const { email, role } = resolveCurrentStorageIdentity();
  const currentUser = getCurrentUser() as any;
  const stableKey = getScopedStorageKey(SALES_CONTRACT_CONTEXT_CACHE_BASE_KEY);
  const keys = new Set<string>([
    stableKey,
    `sales_contract_context_cache_${currentUser?.email || currentUser?.type || 'guest'}`,
    `${SALES_CONTRACT_CONTEXT_CACHE_BASE_KEY}:${email}:${role}`,
    `${SALES_CONTRACT_CONTEXT_CACHE_BASE_KEY}:${email}:customer`,
    `${SALES_CONTRACT_CONTEXT_CACHE_BASE_KEY}:${email}:admin`,
    `${SALES_CONTRACT_CONTEXT_CACHE_BASE_KEY}:${email}:staff`,
    `${SALES_CONTRACT_CONTEXT_CACHE_BASE_KEY}:${email}:supplier`,
  ]);

  try {
    const prefix = `${SALES_CONTRACT_CONTEXT_CACHE_BASE_KEY}:${email}:`;
    for (let index = 0; index < window.sessionStorage.length; index += 1) {
      const key = window.sessionStorage.key(index);
      if (key?.startsWith(prefix)) keys.add(key);
    }
  } catch {
    // ignore storage scan failures
  }

  return Array.from(keys);
};

const readSalesContractCacheForInquiryRecovery = () => {
  if (typeof window === 'undefined') return [] as Record<string, any>[];
  for (const key of getLegacySalesContractCacheKeys()) {
    const rows = readArrayLikePayload(window.sessionStorage.getItem(key));
    if (rows.length > 0) return rows;
  }
  return [];
};

const pickFirstMeaningfulText = (...values: unknown[]) => {
  for (const value of values) {
    const text = String(value || '').trim();
    if (!text || text === '-' || text.toLowerCase() === 'n/a') continue;
    return text;
  }
  return '';
};

const pickFirstPositiveNumber = (...values: unknown[]) => {
  for (const value of values) {
    const number = Number(value);
    if (Number.isFinite(number) && number > 0) return number;
  }
  return 0;
};

const extractDownstreamProducts = (source: Record<string, any>) => {
  const candidates = [
    source?.items,
    source?.products,
    source?.documentDataSnapshot?.products,
    source?.document_data_snapshot?.products,
    source?.templateSnapshot?.products,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate) && candidate.length > 0) {
      return candidate.filter((item) => item && typeof item === 'object');
    }
  }

  return [] as Record<string, any>[];
};

const toRecoveredInquiryProductLine = (product: Record<string, any>, fallbackId: string): InquiryProductLine => ({
  id: String(product?.id || fallbackId),
  productName: pickFirstMeaningfulText(product?.productName, product?.name, product?.product_name, '未命名产品'),
  modelNo: pickFirstMeaningfulText(product?.modelNo, product?.model_no, product?.supplierModelNo, product?.customerModelNo),
  specification: pickFirstMeaningfulText(product?.specification, product?.specifications, product?.description),
  quantity: pickFirstPositiveNumber(product?.quantity, product?.qty, 1),
  unit: pickFirstMeaningfulText(product?.unit, 'PCS'),
  imageUrl: stripLargeImageValue(product?.imageUrl || product?.image),
  remarks: pickFirstMeaningfulText(product?.remarks),
});

const buildRecoveredInquiryListFromDownstreamCaches = (existingList: Inquiry[]) => {
  const existingNumbers = new Set(
    existingList
      .map((item) => String(item?.inquiryNumber || item?.documentDataSnapshot?.inquiryNumber || '').trim())
      .filter(Boolean),
  );

  const qrRows = readScopedLocalArray(QUOTE_REQUIREMENT_CONTEXT_CACHE_PREFIX);
  const qtRows = readScopedLocalArray(SALES_QUOTATION_CONTEXT_CACHE_KEY);
  const scRows = readSalesContractCacheForInquiryRecovery();

  const recovered = new Map<string, Inquiry>();

  const upsertRecovered = (inquiryNumber: string, patch: Partial<Inquiry> & Record<string, any>) => {
    const normalizedInquiryNumber = String(inquiryNumber || '').trim();
    if (!normalizedInquiryNumber.startsWith('ING-') || existingNumbers.has(normalizedInquiryNumber)) return;

    const current = recovered.get(normalizedInquiryNumber);
    const nextId = String(
      patch.id ||
        current?.id ||
        patch.sourceInquiryId ||
        `recovered:${normalizedInquiryNumber}`,
    ).trim();
    const extractedProducts = extractDownstreamProducts(patch);
    const nextProducts = extractedProducts.length > 0
      ? extractedProducts.map((product, index) => toRecoveredInquiryProductLine(product || {}, `${normalizedInquiryNumber}-${index}`))
      : current?.products || [];

    const nextBuyerInfo = {
      companyName: pickFirstMeaningfulText(
        patch.buyerInfo?.companyName,
        patch.documentDataSnapshot?.customer?.companyName,
        patch.document_data_snapshot?.customer?.companyName,
        patch.customerCompany,
        patch.customer?.companyName,
        current?.buyerInfo?.companyName,
      ),
      contactPerson: pickFirstMeaningfulText(
        patch.buyerInfo?.contactPerson,
        patch.documentDataSnapshot?.customer?.contactPerson,
        patch.document_data_snapshot?.customer?.contactPerson,
        patch.customerName,
        patch.customer?.contactPerson,
        current?.buyerInfo?.contactPerson,
      ),
      email: pickFirstMeaningfulText(
        patch.buyerInfo?.email,
        patch.documentDataSnapshot?.customer?.email,
        patch.document_data_snapshot?.customer?.email,
        patch.customerEmail,
        patch.customer?.email,
        current?.buyerInfo?.email,
        patch.userEmail,
      ),
      phone: pickFirstMeaningfulText(
        patch.buyerInfo?.phone,
        patch.documentDataSnapshot?.customer?.phone,
        patch.document_data_snapshot?.customer?.phone,
        patch.customerPhone,
        patch.customer?.phone,
        current?.buyerInfo?.phone,
      ),
      address: pickFirstMeaningfulText(
        patch.buyerInfo?.address,
        patch.documentDataSnapshot?.customer?.address,
        patch.document_data_snapshot?.customer?.address,
        patch.customerAddress,
        patch.customer?.address,
        current?.buyerInfo?.address,
      ),
    };

    const nextRequirements = current?.requirements || {
      incoterm: pickFirstMeaningfulText(
        patch.documentDataSnapshot?.requirements?.incoterm,
        patch.document_data_snapshot?.requirements?.incoterm,
      ),
      locationLabel: pickFirstMeaningfulText(
        patch.documentDataSnapshot?.requirements?.locationLabel,
        patch.document_data_snapshot?.requirements?.locationLabel,
      ),
      locationValue: pickFirstMeaningfulText(
        patch.documentDataSnapshot?.requirements?.locationValue,
        patch.document_data_snapshot?.requirements?.locationValue,
      ),
      finalDestinationPlan: pickFirstMeaningfulText(
        patch.documentDataSnapshot?.requirements?.finalDestinationPlan,
        patch.document_data_snapshot?.requirements?.finalDestinationPlan,
      ),
      deliveryTime: pickFirstMeaningfulText(
        patch.deliveryDate,
        patch.deliveryTime,
        patch.documentDataSnapshot?.requirements?.deliveryTime,
        patch.document_data_snapshot?.requirements?.deliveryTime,
      ),
      portOfDestination: pickFirstMeaningfulText(
        patch.documentDataSnapshot?.requirements?.portOfDestination,
        patch.document_data_snapshot?.requirements?.portOfDestination,
      ),
      paymentTerms: pickFirstMeaningfulText(
        patch.documentDataSnapshot?.requirements?.paymentTerms,
        patch.document_data_snapshot?.requirements?.paymentTerms,
      ),
      tradeTerms: pickFirstMeaningfulText(
        patch.documentDataSnapshot?.requirements?.tradeTerms,
        patch.document_data_snapshot?.requirements?.tradeTerms,
      ),
      paymentMode: pickFirstMeaningfulText(
        patch.documentDataSnapshot?.requirements?.paymentMode,
        patch.document_data_snapshot?.requirements?.paymentMode,
      ),
      balanceTrigger: pickFirstMeaningfulText(
        patch.documentDataSnapshot?.requirements?.balanceTrigger,
        patch.document_data_snapshot?.requirements?.balanceTrigger,
      ),
      documentReleasePreference: pickFirstMeaningfulText(
        patch.documentDataSnapshot?.requirements?.documentReleasePreference,
        patch.document_data_snapshot?.requirements?.documentReleasePreference,
      ),
      lcType: pickFirstMeaningfulText(
        patch.documentDataSnapshot?.requirements?.lcType,
        patch.document_data_snapshot?.requirements?.lcType,
      ),
      creditDays: pickFirstMeaningfulText(
        patch.documentDataSnapshot?.requirements?.creditDays,
        patch.document_data_snapshot?.requirements?.creditDays,
      ),
      businessScenario: pickFirstMeaningfulText(
        patch.documentDataSnapshot?.requirements?.businessScenario,
        patch.document_data_snapshot?.requirements?.businessScenario,
      ),
      businessScenarioNotes: pickFirstMeaningfulText(
        patch.documentDataSnapshot?.requirements?.businessScenarioNotes,
        patch.document_data_snapshot?.requirements?.businessScenarioNotes,
      ),
      insuranceRequirement: pickFirstMeaningfulText(
        patch.documentDataSnapshot?.requirements?.insuranceRequirement,
        patch.document_data_snapshot?.requirements?.insuranceRequirement,
      ),
      packingRequirements: pickFirstMeaningfulText(
        patch.documentDataSnapshot?.requirements?.packingRequirements,
        patch.document_data_snapshot?.requirements?.packingRequirements,
      ),
      certifications: [],
      otherRequirements: pickFirstMeaningfulText(
        patch.specialRequirements,
        patch.remarks,
        patch.message,
        patch.documentDataSnapshot?.requirements?.otherRequirements,
        patch.document_data_snapshot?.requirements?.otherRequirements,
      ),
    };

    const baseInquiry = {
      id: nextId,
      inquiryNumber: normalizedInquiryNumber,
      date: pickFirstMeaningfulText(patch.date, patch.createdAt, patch.createdDate, current?.date, new Date().toISOString()),
      userEmail: pickFirstMeaningfulText(
        patch.userEmail,
        nextBuyerInfo.email,
        current?.userEmail,
      ),
      companyId: pickFirstMeaningfulText(patch.companyId, current?.companyId),
      products: nextProducts,
      status: (pickFirstMeaningfulText(patch.status, current?.status, 'pending') as Inquiry['status']),
      isSubmitted: patch.isSubmitted ?? current?.isSubmitted ?? true,
      totalPrice: pickFirstPositiveNumber(patch.totalPrice, patch.totalAmount, current?.totalPrice),
      region: (pickFirstMeaningfulText(patch.region, current?.region) as RegionType) || undefined,
      buyerInfo: nextBuyerInfo,
      shippingInfo: current?.shippingInfo || { cartons: '0', cbm: '0', totalGrossWeight: '0', totalNetWeight: '0' },
      requirements: nextRequirements,
      message: pickFirstMeaningfulText(patch.message, patch.specialRequirements, patch.remarks, current?.message),
      createdAt: Number(current?.createdAt || Date.parse(String(patch.createdAt || patch.createdDate || patch.date || new Date().toISOString())) || Date.now()),
      submittedAt: current?.submittedAt,
      assignedTo: pickFirstMeaningfulText(patch.assignedTo, current?.assignedTo) || null,
      salesRepEmail: pickFirstMeaningfulText(patch.salesRepEmail, patch.ownerEmail, patch.requestedBy, current?.salesRepEmail) || null,
      ownerUserId: pickFirstMeaningfulText(patch.ownerUserId, current?.ownerUserId) || null,
      ownerEmail: pickFirstMeaningfulText(patch.ownerEmail, patch.salesPerson, patch.requestedBy, current?.ownerEmail) || null,
      ownerName: pickFirstMeaningfulText(patch.ownerName, patch.salesPersonName, patch.requestedByName, current?.ownerName) || null,
      ownerRole: pickFirstMeaningfulText(patch.ownerRole, current?.ownerRole) || null,
      syncStatus: 'synced',
      syncMessage: 'Recovered from downstream document chain',
      documentRenderMeta: {
        ...(current?.documentRenderMeta || {}),
        syntheticRecovered: true,
        recoveredFromFlow: true,
      },
    } as Inquiry;

    const recoveredSnapshot = adaptInquiryToDocumentData(baseInquiry);

    recovered.set(normalizedInquiryNumber, hydrateInquiryRecord({
      ...baseInquiry,
      documentDataSnapshot: recoveredSnapshot,
    } as Inquiry));
  };

  for (const qr of qrRows) {
    const inquiryNumber = pickFirstMeaningfulText(qr?.sourceInquiryNumber, qr?.sourceInquiryId);
    upsertRecovered(inquiryNumber, {
      id: qr?.sourceInquiryId,
      sourceInquiryId: qr?.sourceInquiryId,
      region: qr?.region,
      createdAt: qr?.createdDate,
      customer: qr?.customer,
      userEmail: qr?.customer?.email,
      ownerEmail: qr?.ownerEmail,
      ownerName: qr?.ownerName,
      ownerRole: qr?.ownerRole,
      requestedBy: qr?.requestedBy,
      requestedByName: qr?.requestedByName,
      assignedTo: qr?.assignedTo,
      specialRequirements: qr?.specialRequirements,
      remarks: qr?.remarks,
      deliveryDate: qr?.deliveryDate,
      products: qr?.items,
      status: 'pending',
      isSubmitted: true,
    });
  }

  for (const qt of qtRows) {
    const inquiryNumber = pickFirstMeaningfulText(qt?.inqNumber, qt?.inquiryNumber);
    upsertRecovered(inquiryNumber, {
      region: qt?.region,
      createdAt: qt?.createdAt,
      customerEmail: qt?.customerEmail,
      customerCompany: qt?.customerCompany,
      customerName: qt?.customerName,
      ownerEmail: qt?.ownerEmail || qt?.salesPerson,
      ownerName: qt?.ownerName || qt?.salesPersonName,
      ownerRole: qt?.ownerRole || 'Sales_Rep',
      salesRepEmail: qt?.salesPerson,
      deliveryDate: qt?.deliveryDate,
      remarks: qt?.remarks || qt?.customerNotes,
      products: qt?.items,
      totalPrice: qt?.totalPrice,
      status: 'quoted',
      isSubmitted: true,
    });
  }

  for (const sc of scRows) {
    const inquiryNumber = pickFirstMeaningfulText(sc?.inquiryNumber);
    upsertRecovered(inquiryNumber, {
      region: sc?.region,
      createdAt: sc?.createdAt,
      customerEmail: sc?.customerEmail,
      customerCompany: sc?.customerCompany,
      customerName: sc?.customerName,
      customerAddress: sc?.customerAddress,
      customerPhone: sc?.contactPhone,
      ownerEmail: sc?.ownerEmail || sc?.salesPerson,
      ownerName: sc?.ownerName || sc?.salesPersonName,
      ownerRole: sc?.ownerRole || 'Sales_Rep',
      salesRepEmail: sc?.salesPerson,
      deliveryDate: sc?.deliveryTime,
      remarks: sc?.remarks,
      products: sc?.products,
      totalAmount: sc?.totalAmount,
      status: sc?.status === 'approved' || sc?.status === 'completed' ? 'approved' : 'quoted',
      isSubmitted: true,
    });
  }

  return Array.from(recovered.values()).sort((a, b) => {
    const aTime = Number(a?.createdAt || 0);
    const bTime = Number(b?.createdAt || 0);
    return bTime - aTime;
  });
};

const isUuidLikeMarker = (value: unknown) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(value || '').trim(),
  );

const isPersistableInquiryMarker = (value: unknown) => {
  const text = String(value || '').trim();
  if (!text) return false;
  return (
    isUuidLikeMarker(text) ||
    text.startsWith('recovered:') ||
    /^ING-[A-Z]{2}-\d{6}-\d{4}$/i.test(text)
  );
};

const loadHiddenInquiryMarkers = (): Set<string> => {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = readInquiryStoragePayload(HIDDEN_INQUIRY_IDS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    const normalized = Array.isArray(parsed)
      ? parsed.map((v) => String(v)).filter((v) => isPersistableInquiryMarker(v))
      : [];
    return new Set(normalized);
  } catch {
    return new Set();
  }
};

const persistHiddenInquiryMarkers = (markers: Set<string>) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(getHiddenInquiryStorageKey(), JSON.stringify(Array.from(markers)));
  clearLegacyInquiryStorageKeys(HIDDEN_INQUIRY_IDS_KEY);
};

const sanitizePendingInquiryDrafts = (items: Inquiry[]) => {
  const hydrated = items.map((item) => hydrateInquiryRecord(item));
  const prefixCounters = new Map<string, number>();
  const counterStorageUpdates = new Map<string, number>();
  let mutated = false;

  const buildPrefix = (item: Inquiry) => {
    const regionCode = String(item?.region || 'NA').trim().toUpperCase() || 'NA';
    const rawDate = String(item?.date || '').trim();
    const parsedDate = rawDate ? new Date(rawDate) : new Date();
    const safeDate = Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
    const yy = String(safeDate.getFullYear()).slice(-2);
    const mm = String(safeDate.getMonth() + 1).padStart(2, '0');
    const dd = String(safeDate.getDate()).padStart(2, '0');
    return `ING-${regionCode}-${yy}${mm}${dd}-`;
  };

  const pendingSequenceMap = new Map<string, string>();
  const pendingItems = hydrated
    .filter((item) => String(item?.syncStatus || '').trim() === 'pending')
    .sort((left, right) => {
      const leftPrefix = buildPrefix(left);
      const rightPrefix = buildPrefix(right);
      if (leftPrefix !== rightPrefix) return leftPrefix.localeCompare(rightPrefix);

      const leftCreatedAt = Number(left?.createdAt || 0);
      const rightCreatedAt = Number(right?.createdAt || 0);
      if (leftCreatedAt !== rightCreatedAt) return leftCreatedAt - rightCreatedAt;

      const leftDate = String(left?.date || '');
      const rightDate = String(right?.date || '');
      if (leftDate !== rightDate) return leftDate.localeCompare(rightDate);

      return String(left?.id || '').localeCompare(String(right?.id || ''));
    });

  pendingItems.forEach((item) => {
    const prefix = buildPrefix(item);
    const nextCounter = (prefixCounters.get(prefix) || 0) + 1;
    prefixCounters.set(prefix, nextCounter);
    counterStorageUpdates.set(prefix, nextCounter);
    pendingSequenceMap.set(String(item.id), `${prefix}${String(nextCounter).padStart(4, '0')}`);
  });

  const normalized = hydrated.map((item) => {
    if (String(item?.syncStatus || '').trim() !== 'pending') return item;

    const nextInquiryNumber = pendingSequenceMap.get(String(item.id)) || String(item?.inquiryNumber || '').trim();
    const currentInquiryNumber = String(item?.inquiryNumber || '').trim();
    const currentSnapshotInquiryNo = String(item?.documentDataSnapshot?.inquiryNo || '').trim();
    const currentSnapshotInquiryNumber = String(item?.documentDataSnapshot?.inquiryNumber || '').trim();
    if (
      currentInquiryNumber === nextInquiryNumber &&
      currentSnapshotInquiryNo === nextInquiryNumber &&
      (!currentSnapshotInquiryNumber || currentSnapshotInquiryNumber === nextInquiryNumber)
    ) {
      return item;
    }

    mutated = true;
    return hydrateInquiryRecord({
      ...item,
      inquiryNumber: nextInquiryNumber,
      documentDataSnapshot: item?.documentDataSnapshot && typeof item.documentDataSnapshot === 'object'
        ? {
            ...item.documentDataSnapshot,
            inquiryNo: nextInquiryNumber,
            inquiryNumber: nextInquiryNumber,
          }
        : item.documentDataSnapshot,
    });
  });

  return {
    normalized,
    mutated,
    counterStorageUpdates,
  };
};

const clearCorruptedInquiryFallbackCounters = () => {
  if (typeof window === 'undefined') return;
  try {
    const keyPrefix = 'ing_local_fallback_counter_v4:';
    const keysToRemove: string[] = [];
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (!key?.startsWith(keyPrefix)) continue;
      keysToRemove.push(key);
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
  } catch {
    // ignore storage scan failures
  }
};

const loadPendingInquirySyncItems = (): Inquiry[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw =
      readInquiryStoragePayload(PENDING_INQUIRY_SYNC_KEY) ||
      readInquiryStoragePayload(LEGACY_PENDING_INQUIRY_SYNC_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];

    const { normalized, mutated, counterStorageUpdates } = sanitizePendingInquiryDrafts(parsed as Inquiry[]);

    if (mutated) {
      try {
        localStorage.setItem(getPendingInquiryStorageKey(), JSON.stringify(normalized));
        clearLegacyInquiryStorageKeys(PENDING_INQUIRY_SYNC_KEY);
        for (const [prefix, counter] of counterStorageUpdates.entries()) {
          localStorage.setItem(`ing_local_fallback_counter_v4:${prefix}`, String(counter));
        }
      } catch {
        // ignore persistence failures
      }
    }

    return normalized;
  } catch {
    return [];
  }
};

const loadSyncedInquiryCache = (): Inquiry[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = readInquiryStoragePayload(SYNCED_INQUIRY_CACHE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    const normalized = Array.isArray(parsed)
      ? parsed
          .map((item) => {
            if (!item || typeof item !== 'object') return null;
            const inquiry = item as Inquiry & Record<string, any>;
            const normalizedId = String(
              inquiry.id ||
                inquiry.inquiryNumber ||
                inquiry.documentDataSnapshot?.inquiryNumber ||
                inquiry.documentDataSnapshot?.id ||
                '',
            ).trim();
            if (!normalizedId) return null;
            return hydrateInquiryRecord({
              ...inquiry,
              id: normalizedId,
            } as Inquiry);
          })
          .filter(Boolean)
      : [];
    return normalized as Inquiry[];
  } catch {
    return [];
  }
};

const loadStaffSharedSubmittedInquiryCache = (): Inquiry[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(getStaffSharedSubmittedInquiryCacheStorageKey());
    const parsed = raw ? JSON.parse(raw) : [];
    const normalized = Array.isArray(parsed)
      ? parsed
          .map((item) => {
            if (!item || typeof item !== 'object') return null;
            const inquiry = item as Inquiry & Record<string, any>;
            const normalizedId = String(
              inquiry.id ||
                inquiry.inquiryNumber ||
                inquiry.documentDataSnapshot?.inquiryNumber ||
                inquiry.documentDataSnapshot?.id ||
                '',
            ).trim();
            if (!normalizedId) return null;
            return hydrateInquiryRecord({
              ...inquiry,
              id: normalizedId,
            } as Inquiry);
          })
          .filter(Boolean)
      : [];
    return normalized as Inquiry[];
  } catch {
    return [];
  }
};

const stripLargeImageValue = (value?: string | null) => {
  const text = String(value || '');
  return text.startsWith('data:') ? '' : text;
};

const sanitizeSnapshotPayload = <T extends { imageUrl?: string; oemDataSnapshot?: InquiryOemData | null } | null | undefined>(
  snapshot: T,
): T => {
  if (!snapshot) return snapshot;
  return {
    ...snapshot,
    imageUrl: stripLargeImageValue(snapshot.imageUrl),
    oemDataSnapshot: snapshot.oemDataSnapshot
      ? {
          ...snapshot.oemDataSnapshot,
          files: Array.isArray(snapshot.oemDataSnapshot.files)
            ? snapshot.oemDataSnapshot.files.map((file: any) => ({
                ...file,
                fileObject: null,
                storageUrl: stripLargeImageValue(file?.storageUrl) || file?.storageUrl || '',
              }))
            : [],
        }
      : snapshot.oemDataSnapshot,
  } as T;
};

const hydrateInquiryProductLine = (product: any): InquiryProductLine => {
  const normalized = tradeProductSnapshotService.normalizeInquirySelectionProduct(product || {});
  const inquirySnapshot = normalized?.inquirySnapshot || product?.inquirySnapshot || null;
  return {
    ...normalized,
    modelNo:
      normalized?.modelNo ||
      inquirySnapshot?.supplierModelNo ||
      normalized?.inquirySnapshotDraft?.supplierModelNo ||
      normalized?.inquirySnapshotDraft?.displayModelNo ||
      '',
    internalModelNo:
      normalized?.internalModelNo ||
      inquirySnapshot?.masterRef?.internalModelNo ||
      normalized?.masterRef?.internalModelNo ||
      '',
    inquirySnapshot,
  } as InquiryProductLine;
};

const prepareInquiryProductLineForSave = (product: any): InquiryProductLine =>
  tradeProductSnapshotService.ensureInquiryProductLine(product || {}) as InquiryProductLine;

const normalizeResolvedInquiryNumber = (value: unknown): string => {
  const text = String(value || '').trim();
  if (!text || text === 'ING-DRAFT' || isUuidLike(text)) {
    return '';
  }
  return text;
};

const normalizeInquiryDateKey = (value: unknown): string => {
  const text = String(value || '').trim();
  if (!text) return '';
  return text.includes('T') ? text.split('T')[0] : text;
};

const buildInquiryProductFingerprint = (inquiry: Inquiry | null | undefined): string => {
  const products = Array.isArray(inquiry?.products) ? inquiry.products : [];
  return products
    .map((product) => {
      const modelNo = String(
        product?.modelNo ||
        product?.supplierModelNo ||
        product?.internalModelNo ||
        product?.customerModelNo ||
        '',
      ).trim().toLowerCase();
      const productName = String(
        (product as any)?.productName ||
        product?.name ||
        (product as any)?.itemName ||
        '',
      ).trim().toLowerCase();
      const quantity = Number(product?.quantity || 0);
      return `${modelNo}|${productName}|${quantity}`;
    })
    .filter(Boolean)
    .join('||');
};

const resolveInquiryBusinessFingerprint = (inquiry: Inquiry | null | undefined): string => {
  if (!inquiry) return '';
  const dateKey = normalizeInquiryDateKey(inquiry.date);
  const companyKey = String(
    inquiry.companyId ||
    inquiry.buyerInfo?.email ||
    inquiry.userEmail ||
    inquiry.buyerInfo?.companyName ||
    (inquiry as any).buyerCompany ||
    '',
  ).trim().toLowerCase();
  const productKey = buildInquiryProductFingerprint(inquiry);
  const totalPrice = Number(inquiry.totalPrice || 0).toFixed(2);

  if (!dateKey || !companyKey || !productKey) return '';
  return `${dateKey}::${companyKey}::${totalPrice}::${productKey}`;
};

const resolveInquiryStableNumber = (inquiry: Partial<Inquiry> & Record<string, any>): string =>
  normalizeResolvedInquiryNumber(
    inquiry.inquiryNumber ||
    inquiry.inquiry_number ||
    inquiry.documentDataSnapshot?.inquiryNo ||
    inquiry.documentDataSnapshot?.inquiryNumber ||
    inquiry.document_data_snapshot?.inquiryNo ||
    inquiry.document_data_snapshot?.inquiryNumber ||
    inquiry.documentRenderMeta?.inquiryNo ||
    inquiry.document_render_meta?.inquiryNo ||
    '',
  );

const isSameInquiryIdentity = (
  left: (Partial<Inquiry> & Record<string, any>) | null | undefined,
  right: (Partial<Inquiry> & Record<string, any>) | null | undefined,
): boolean => {
  if (!left || !right) return false;

  const leftId = String(left.id || '').trim();
  const rightId = String(right.id || '').trim();
  if (leftId && rightId && leftId === rightId) {
    return true;
  }

  const leftNumber = resolveInquiryStableNumber(left);
  const rightNumber = resolveInquiryStableNumber(right);
  if (leftNumber && rightNumber && leftNumber === rightNumber) {
    return true;
  }

  const leftIsRecovered = isSyntheticRecoveredInquiry(left);
  const rightIsRecovered = isSyntheticRecoveredInquiry(right);
  if (!leftIsRecovered && !rightIsRecovered) {
    return false;
  }

  const leftFingerprint = resolveInquiryBusinessFingerprint(left as Inquiry);
  const rightFingerprint = resolveInquiryBusinessFingerprint(right as Inquiry);
  return Boolean(leftFingerprint && rightFingerprint && leftFingerprint === rightFingerprint);
};

const hydrateInquiryRecord = (inquiry: Inquiry): Inquiry => {
  const normalizedProducts = Array.isArray(inquiry?.products)
    ? inquiry.products.map((product) => hydrateInquiryProductLine(product))
    : [];
  const resolvedInquiryNumber = resolveInquiryStableNumber(inquiry);
  const resolvedSnapshot = inquiry?.documentDataSnapshot && typeof inquiry.documentDataSnapshot === 'object'
    ? {
        ...inquiry.documentDataSnapshot,
        inquiryNo:
          normalizeResolvedInquiryNumber(inquiry.documentDataSnapshot?.inquiryNo) ||
          resolvedInquiryNumber ||
          inquiry.documentDataSnapshot?.inquiryNo,
      }
    : inquiry?.documentDataSnapshot;

  return {
    ...inquiry,
    inquiryNumber: normalizeResolvedInquiryNumber(inquiry?.inquiryNumber) || resolvedInquiryNumber || undefined,
    products: normalizedProducts,
    oem: inquiry?.oem || aggregateInquiryOemFromProducts(normalizedProducts),
    documentDataSnapshot: resolvedSnapshot,
  };
};

const prepareInquiryRecordForSave = (inquiry: Inquiry): Inquiry => {
  const preparedProducts = Array.isArray(inquiry?.products)
    ? inquiry.products.map((product) => prepareInquiryProductLineForSave(product))
    : [];

  return {
    ...inquiry,
    products: preparedProducts,
    oem: aggregateInquiryOemFromProducts(preparedProducts),
  };
};

const sanitizeInquiryForLocalPersistence = (inquiry: Inquiry): Inquiry => {
  const hydratedInquiry = hydrateInquiryRecord(inquiry);
  const sanitizedProducts = (hydratedInquiry.products || []).map((product: any) => ({
    ...product,
    image: stripLargeImageValue(product?.image),
    imageUrl: stripLargeImageValue(product?.imageUrl),
    oem: product?.oem
      ? {
          ...product.oem,
          files: Array.isArray(product.oem.files)
            ? product.oem.files.map((file: any) => ({
                ...file,
                fileObject: null,
                storageUrl: stripLargeImageValue(file?.storageUrl) || file?.storageUrl || '',
              }))
            : [],
        }
      : product?.oem,
    inquirySnapshot: sanitizeSnapshotPayload(product?.inquirySnapshot),
    inquirySnapshotDraft: sanitizeSnapshotPayload(product?.inquirySnapshotDraft),
  }));

  return {
    ...hydratedInquiry,
    products: sanitizedProducts,
    documentDataSnapshot: undefined,
    documentRenderMeta: undefined,
  };
};

const sanitizeInquiryForSyncedCache = (inquiry: Inquiry): Inquiry => {
  const sanitized = sanitizeInquiryForLocalPersistence(inquiry);
  return {
    ...sanitized,
    syncStatus: 'synced',
    syncMessage: null,
  };
};

const persistPendingInquirySyncItems = (items: Inquiry[]) => {
  if (typeof window === 'undefined') return;
  const storageKey = getPendingInquiryStorageKey();
  const sanitizedItems = items.map((item) => ({
    ...sanitizeInquiryForLocalPersistence(item),
    syncStatus: item.syncStatus || 'pending',
    syncMessage: item.syncMessage || 'Waiting for Supabase sync',
  }));
  if (sanitizedItems.length === 0) {
    localStorage.removeItem(storageKey);
    localStorage.removeItem(getLegacyPendingInquiryStorageKey());
    return;
  }
  localStorage.setItem(storageKey, JSON.stringify(sanitizedItems));
  clearLegacyInquiryStorageKeys(PENDING_INQUIRY_SYNC_KEY);
  clearLegacyInquiryStorageKeys(LEGACY_PENDING_INQUIRY_SYNC_KEY);
};

const clearLegacyPendingInquirySyncItems = () => {
  if (typeof window === 'undefined') return;
  try {
    clearLegacyInquiryStorageKeys(PENDING_INQUIRY_SYNC_KEY);
    clearLegacyInquiryStorageKeys(LEGACY_PENDING_INQUIRY_SYNC_KEY);
    localStorage.removeItem(getLegacyPendingInquiryStorageKey());
  } catch {
    // ignore cleanup failures
  }
};

const persistSyncedInquiryCache = (items: Inquiry[]) => {
  if (typeof window === 'undefined') return;
  const storageKey = getSyncedInquiryCacheStorageKey();
  const sanitizedItems = items.map(sanitizeInquiryForSyncedCache);
  try {
    localStorage.setItem(storageKey, JSON.stringify(sanitizedItems));
    clearLegacyInquiryStorageKeys(SYNCED_INQUIRY_CACHE_KEY);
  } catch (error) {
    console.warn('⚠️ [persistSyncedInquiryCache] localStorage quota exceeded, trimming payload.', error);
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify(
          sanitizedItems.map((item) => ({
            ...item,
            products: (item.products || []).map((product: any) => ({
              ...product,
              image: '',
              imageUrl: '',
              oem: product?.oem
                ? {
                    ...product.oem,
                    files: Array.isArray(product.oem.files)
                      ? product.oem.files.map((file: any) => ({
                          ...file,
                          storageUrl: '',
                        }))
                      : [],
                  }
                : product?.oem,
            })),
          })),
        ),
      );
    } catch (finalError) {
      console.error('❌ [persistSyncedInquiryCache] unable to persist synced inquiry cache.', finalError);
      localStorage.removeItem(storageKey);
    }
  }
};

const persistStaffSharedSubmittedInquiryCache = (items: Inquiry[]) => {
  if (typeof window === 'undefined') return;
  const storageKey = getStaffSharedSubmittedInquiryCacheStorageKey();
  const sanitizedItems = items
    .filter((item) => item?.isSubmitted)
    .map(sanitizeInquiryForSyncedCache);
  try {
    if (sanitizedItems.length === 0) {
      localStorage.removeItem(storageKey);
      return;
    }
    localStorage.setItem(storageKey, JSON.stringify(sanitizedItems));
  } catch (error) {
    console.warn('⚠️ [persistStaffSharedSubmittedInquiryCache] localStorage quota exceeded, trimming payload.', error);
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify(
          sanitizedItems.map((item) => ({
            ...item,
            products: (item.products || []).map((product: any) => ({
              ...product,
              image: '',
              imageUrl: '',
              oem: product?.oem
                ? {
                    ...product.oem,
                    files: Array.isArray(product.oem.files)
                      ? product.oem.files.map((file: any) => ({
                          ...file,
                          storageUrl: '',
                        }))
                      : [],
                  }
                : product?.oem,
            })),
          })),
        ),
      );
    } catch (finalError) {
      console.error('❌ [persistStaffSharedSubmittedInquiryCache] unable to persist shared submitted inquiry cache.', finalError);
      localStorage.removeItem(storageKey);
    }
  }
};

const getInquiryMarkers = (inquiry: Partial<Inquiry>): string[] =>
  [inquiry.id, inquiry.inquiryNumber]
    .filter(Boolean)
    .map((v) => String(v).trim())
    .filter((value, index, array) => value && array.indexOf(value) === index);

const isSyntheticRecoveredInquiry = (inquiry: Partial<Inquiry> | null | undefined) =>
  Boolean(
    inquiry?.documentRenderMeta?.syntheticRecovered ||
    String(inquiry?.id || '').startsWith('recovered:')
  );

const normalizeRegionForVisibility = (region?: string | null): 'NA' | 'SA' | 'EA' | 'all' | '' => {
  const value = String(region || '').trim().toLowerCase();
  if (!value) return '';
  if (value === 'na' || value === 'north america' || value === 'north_america' || value === 'north-america' || value === '北美') {
    return 'NA';
  }
  if (value === 'sa' || value === 'south america' || value === 'south_america' || value === 'south-america' || value === '南美') {
    return 'SA';
  }
  if (
    value === 'ea' ||
    value === 'emea' ||
    value === 'europe & africa' ||
    value === 'europe_africa' ||
    value === 'europe-africa' ||
    value === '欧非'
  ) {
    return 'EA';
  }
  if (value === 'all') return 'all';
  return '';
};

const filterVisibleInquiriesForCurrentUser = (list: Inquiry[]): Inquiry[] => {
  const hidden = loadHiddenInquiryMarkers();
  const visibleByHidden = hidden.size === 0
    ? list
    : list.filter((inquiry) => !getInquiryMarkers(inquiry).some((marker) => hidden.has(marker)));

  const currentUser = getCurrentUser() as any;
  const portalRole = getStoredPortalRole();
  const isStaff = isStoredStaffPortalRole();

  if (!isStaff || portalRole !== 'admin' || !currentUser?.email) {
    return visibleByHidden;
  }

  const role = String(currentUser.role || currentUser.userRole || '').trim();
  const currentEmail = normalizePersonnelEmail(currentUser.email, currentUser.region);
  const currentRegion = normalizeRegionForVisibility(currentUser.region);

  if (!role) return visibleByHidden;

  return visibleByHidden.filter((inquiry) => {
    const inquiryRegion = normalizeRegionForVisibility(inquiry.region);
    const assignedManager = normalizePersonnelEmail(inquiry.assignedTo, inquiry.region);
    const assignedSales = normalizePersonnelEmail(inquiry.salesRepEmail, inquiry.region);

    if (['Admin', 'CEO', 'CFO', 'Procurement', 'Finance', 'Documentation_Officer', 'Marketing_Ops'].includes(role)) {
      return true;
    }

    if (role === 'Sales_Director') {
      return true;
    }

    if (role === 'Regional_Manager') {
      // 区域主管负责本区域客户首次提交后的分配与监督，
      // 因此应能查看本区域 ING，而不再要求 assignedTo 必须等于主管本人。
      if (!currentRegion || currentRegion === 'all') return true;
      return inquiryRegion === currentRegion;
    }

    if (role === 'Sales_Manager') {
      return false;
    }

    if (role === 'Sales_Rep') {
      return matchesBusinessOwnerEmail(
        inquiry.ownerEmail || assignedSales || inquiry.assignedTo,
        currentUser.email,
        inquiry.region,
        inquiry.ownerUserId,
        currentUser.id,
      );
    }

    return true;
  });
};

const mergeInquiryLists = (remoteList: Inquiry[], localPendingList: Inquiry[]) => {
  const merged: Inquiry[] = remoteList
    .filter((inquiry) => Boolean(inquiry?.id))
    .map((inquiry) => ({
      ...inquiry,
      syncStatus: inquiry.syncStatus || 'synced',
      syncMessage: inquiry.syncMessage || null,
    }));

  for (const inquiry of localPendingList) {
    if (!inquiry?.id) continue;
    const existingIndex = merged.findIndex((item) => isSameInquiryIdentity(item, inquiry));
    if (existingIndex === -1) {
      merged.push(inquiry);
      continue;
    }
    merged[existingIndex] = inquiry;
  }

  return merged.sort((a, b) => {
    const aTime = Number((a as any)?.createdAt || new Date(String(a?.date || 0)).getTime() || 0);
    const bTime = Number((b as any)?.createdAt || new Date(String(b?.date || 0)).getTime() || 0);
    return bTime - aTime;
  });
};

const sortInquiriesByCreatedTimeDesc = (list: Inquiry[]) =>
  list.sort((a, b) => {
    const aTime = Number((a as any)?.createdAt || new Date(String(a?.date || 0)).getTime() || 0);
    const bTime = Number((b as any)?.createdAt || new Date(String(b?.date || 0)).getTime() || 0);
    return bTime - aTime;
  });

const mergeSyncedAndPendingInquiryLists = (syncedList: Inquiry[], localPendingList: Inquiry[]) => {
  const merged: Inquiry[] = syncedList
    .filter((inquiry) => Boolean(inquiry?.id))
    .map((inquiry) => ({ ...inquiry, syncStatus: 'synced', syncMessage: null }));

  for (const inquiry of localPendingList) {
    if (!inquiry?.id) continue;
    const existingIndex = merged.findIndex((item) => isSameInquiryIdentity(item, inquiry));
    if (existingIndex === -1) {
      merged.push(inquiry);
    }
  }

  return sortInquiriesByCreatedTimeDesc(merged);
};

const getRecoveredInquiryListsForCurrentIdentity = () => {
  const synced = loadSyncedInquiryCache();
  const pending = loadPendingInquirySyncItems();
  const recovered = mergeSyncedAndPendingInquiryLists(synced, pending);
  const syntheticRecovered = buildRecoveredInquiryListFromDownstreamCaches(recovered);
  const mergedRecovered = mergeRemoteWithRecoveredInquiryLists(syntheticRecovered, recovered);
  const sharedSubmitted = loadStaffSharedSubmittedInquiryCache();
  if (!isStoredStaffPortalRole()) {
    const currentUser = getCurrentUser() as any;
    let companyId: string | null = null;
    let companyName: string | null = null;

    try {
      const authUser = JSON.parse(localStorage.getItem('cosun_auth_user') || 'null');
      const backendUser = JSON.parse(localStorage.getItem('cosun_backend_user') || 'null');
      const customerProfile = JSON.parse(localStorage.getItem('cosun_customer_profile') || 'null');
      companyId = String(
        currentUser?.companyId ||
        backendUser?.companyId ||
        authUser?.companyId ||
        customerProfile?.companyId ||
        '',
      ).trim() || null;
      companyName = String(
        currentUser?.companyName ||
        currentUser?.company ||
        customerProfile?.companyName ||
        backendUser?.company ||
        authUser?.companyName ||
        '',
      ).trim() || null;
    } catch {
      companyId = null;
      companyName = null;
    }

    const currentEmail = String(currentUser?.email || '').trim().toLowerCase();
    const visibleSharedSubmitted = sharedSubmitted.filter((inquiry) =>
      matchesCustomerInquiryVisibility(inquiry, {
        email: currentEmail,
        companyId,
        companyName,
      }),
    );

    return mergeRemoteWithRecoveredInquiryLists(
      visibleSharedSubmitted,
      mergedRecovered,
    );
  }
  return mergeRemoteWithRecoveredInquiryLists(
    sharedSubmitted,
    mergedRecovered,
  );
};

const mergeRemoteWithRecoveredInquiryLists = (remoteList: Inquiry[], recoveredLocalList: Inquiry[]) => {
  const merged: Inquiry[] = remoteList.filter((inquiry) => Boolean(inquiry?.id));
  for (const inquiry of recoveredLocalList) {
    if (!inquiry?.id) continue;
    const existsRemotely = merged.some((item) => isSameInquiryIdentity(item, inquiry));
    if (!existsRemotely) {
      merged.push(inquiry);
    }
  }
  return sortInquiriesByCreatedTimeDesc(merged);
};

const reconcilePendingInquirySyncItems = (remoteList: Inquiry[]) => {
  const pending = loadPendingInquirySyncItems();
  if (pending.length === 0 || remoteList.length === 0) {
    return pending;
  }

  const retainedPending = pending.filter((pendingInquiry) =>
    !remoteList.some((remoteInquiry) => isSameInquiryIdentity(remoteInquiry, pendingInquiry)),
  );

  if (retainedPending.length !== pending.length) {
    persistPendingInquirySyncItems(retainedPending);
  }

  return retainedPending;
};

const matchesCustomerInquiryVisibility = (
  inquiry: Inquiry | null | undefined,
  options: {
    email?: string | null;
    companyId?: string | null;
    companyName?: string | null;
  },
) => {
  if (!inquiry) return false;
  const normalizedEmail = String(options.email || '').trim().toLowerCase();
  const normalizedCompanyId = String(options.companyId || '').trim();
  const normalizedCompanyName = String(options.companyName || '').trim();

  const inquiryUserEmail = String(inquiry.userEmail || '').trim().toLowerCase();
  const buyerEmail = String(inquiry.buyerInfo?.email || '').trim().toLowerCase();
  const inquiryCompanyId = String(inquiry.companyId || '').trim();
  const buyerCompanyName = String(inquiry.buyerInfo?.companyName || inquiry.buyerCompany || '').trim();

  return (
    (!!normalizedEmail && (inquiryUserEmail === normalizedEmail || buyerEmail === normalizedEmail)) ||
    (!!normalizedCompanyId && inquiryCompanyId === normalizedCompanyId) ||
    (!!normalizedCompanyName && buyerCompanyName === normalizedCompanyName)
  );
};

const enrichInquiryListWithOem = async (list: Inquiry[]) => {
  if (!Array.isArray(list) || list.length === 0) return list;
  try {
    const inquiryIds = list.map((item) => item.id)
    const [oemMap, productOemMap] = await Promise.all([
      inquiryOemService.getByInquiryIds(inquiryIds),
      inquiryOemService.getProductMapByInquiryIds(inquiryIds),
    ])
    return list.map((item) =>
      hydrateInquiryRecord({
        ...item,
        products: (item.products || []).map((product) => ({
          ...product,
          oem: productOemMap.get(item.id)?.get(String(product?.id || '')) || product.oem,
        })),
        oem: oemMap.get(item.id) || aggregateInquiryOemFromProducts(
          (item.products || []).map((product) => ({
            ...product,
            oem: productOemMap.get(item.id)?.get(String(product?.id || '')) || product.oem,
          })),
        ) || item.oem,
      }),
    );
  } catch (error) {
    console.warn('⚠️ [enrichInquiryListWithOem] failed:', error);
    return list;
  }
};

const enrichInquiryListWithOemFactoryDispatch = async (list: Inquiry[]) => {
  if (!Array.isArray(list) || list.length === 0) return list;
  try {
    const dispatchMap = await inquiryOemFactoryDispatchService.getByInquiryIds(list.map((item) => item.id));
    return list.map((item) => {
      const dispatch = dispatchMap.get(item.id);
      if (!dispatch) return item;

      return hydrateInquiryRecord({
        ...item,
        oemFactoryDispatch: dispatch,
      });
    });
  } catch (error) {
    console.warn('⚠️ [enrichInquiryListWithOemFactoryDispatch] failed:', error);
    return list;
  }
};

const getPersistableOemFactoryDispatch = (inquiry: Partial<Inquiry> & Record<string, any>) => {
  if (inquiry.oemFactoryDispatch?.payload) {
    return inquiry.oemFactoryDispatch;
  }

  return null;
};

const isJwtExpiredError = (error: unknown) => {
  const message = String((error as any)?.message || error || '').toLowerCase();
  return message.includes('jwt expired');
};

const isDeterministicInquirySaveError = (error: unknown) => {
  const message = String((error as any)?.message || error || '').toLowerCase();
  return (
    message.includes('invalid input syntax for type uuid') ||
    message.includes('jwt expired')
  );
};

const isTransientInquirySaveError = (error: unknown) => {
  const message = String((error as any)?.message || error || '').toLowerCase();
  return (
    (error as any)?.name === 'AbortError' ||
    (error as any)?.name === 'TypeError' ||
    message.includes('aborterror') ||
    message.includes('signal is aborted') ||
    message.includes('request aborted') ||
    message.includes('timed out') ||
    message.includes('failed to fetch') ||
    message.includes('networkerror') ||
    message.includes('load failed') ||
    message.includes('connection refused') ||
    message.includes('err_connection_refused') ||
    message.includes('inquiries_inquiry_number_tenant_key') ||
    message.includes('duplicate key value violates unique constraint') ||
    message.includes('409 (conflict)') ||
    message.includes('deferred after repeated inquiry number conflicts') ||
    message.includes('exceeded retry budget')
  );
};

const withInquiryCreateTimeout = async <T,>(task: Promise<T>, timeoutMs: number, message: string): Promise<T> => {
  return Promise.race([
    task,
    new Promise<T>((_, reject) => {
      window.setTimeout(() => reject(new Error(message)), timeoutMs);
    }),
  ]);
};

const shouldUseLocalInquiryCreateGuardTimeout = () => {
  return true;
};

const shouldCreateInquiryLocallyFirst = () => {
  return isCurrentLocalDevHost();
};

const assignLocalPendingInquiryNumber = (inquiry: Inquiry): Inquiry => {
  if (resolveInquiryStableNumber(inquiry)) return inquiry;
  const regionCode = String(inquiry.region || 'NA').trim().toUpperCase() || 'NA';
  const prefix = buildInquiryNumberPrefix(regionCode, inquiry.date);
  const pendingSamePrefix = loadPendingInquirySyncItems()
    .map((item) => resolveInquiryStableNumber(item))
    .filter((value) => value.startsWith(prefix));
  const maxPendingSuffix = pendingSamePrefix.reduce((max, value) => {
    const suffix = Number.parseInt(value.slice(prefix.length), 10);
    return Number.isFinite(suffix) ? Math.max(max, suffix) : max;
  }, 0);
  const nextSuffix = maxPendingSuffix + 1;
  const inquiryNumber = `${prefix}${String(nextSuffix).padStart(4, '0')}`;
  try {
    window.localStorage.setItem(`ing_local_fallback_counter_v4:${prefix}`, String(nextSuffix));
  } catch {
    // Counter persistence is a convenience; pending drafts remain the source of truth.
  }
  return {
    ...inquiry,
    inquiryNumber,
    documentDataSnapshot: inquiry.documentDataSnapshot
      ? {
          ...inquiry.documentDataSnapshot,
          inquiryNo: inquiryNumber,
        }
      : inquiry.documentDataSnapshot,
  };
};

const emitInquiryEvent = (
  key: string,
  inquiry: Partial<Inquiry> & { id: string },
  metadata?: Record<string, unknown>,
) => {
  const currentUser = getCurrentUser() as any;
  emitErpEvent({
    id: `evt-inquiry-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    key: key as any,
    domain: 'ing',
    recordId: String(inquiry.id),
    internalNo: String(inquiry.inquiryNumber || inquiry.id),
    companyId: currentUser?.companyId ? String(currentUser.companyId) : undefined,
    source: currentUser?.type === 'admin' ? 'admin' : 'client',
    occurredAt: new Date().toISOString(),
    metadata,
  });
};

export function InquiryProvider({ children }: { children: ReactNode }) {
  const [inquiries, setInquiries] = useState<Inquiry[]>(() =>
    filterVisibleInquiriesForCurrentUser(
      getRecoveredInquiryListsForCurrentIdentity(),
    ),
  );
  const loadInFlightRef = useRef<Promise<void> | null>(null);
  const lastLoadSignatureRef = useRef('');
  const lastLoadStartedAtRef = useRef(0);
  const pendingSyncInFlightRef = useRef<Set<string>>(new Set());
  const pendingSyncAttemptedAtRef = useRef<Map<string, number>>(new Map());
  const deletedInquiryIdsRef = useRef<Set<string>>(new Set());

  const preserveInquiryStateOnAuthGap = React.useCallback(() => {
    const recovered = filterVisibleInquiriesForCurrentUser(
      getRecoveredInquiryListsForCurrentIdentity(),
    );
    if (Array.isArray(recovered) && recovered.length > 0) {
      setInquiries(recovered);
      persistSyncedInquiryCache(recovered.filter((item) => item.syncStatus !== 'pending'));
      return;
    }
    setInquiries((prev) => prev);
  }, []);

  const setVisibleInquiries = (next: React.SetStateAction<Inquiry[]>) => {
    setInquiries((current) => {
      const resolvedNext = typeof next === 'function'
        ? (next as (previous: Inquiry[]) => Inquiry[])(current)
        : next;
      const safeNext = Array.isArray(resolvedNext) ? resolvedNext : [];
      const visible = filterVisibleInquiriesForCurrentUser(
        safeNext.map((item) => hydrateInquiryRecord(item)),
      );
      persistSyncedInquiryCache(visible.filter((item) => item.syncStatus !== 'pending'));
      return visible;
    });
  };

  const getLatestVisibleInquiryList = () =>
    filterVisibleInquiriesForCurrentUser(
      getRecoveredInquiryListsForCurrentIdentity(),
    );

  const syncStaffSharedSubmittedInquiryCache = (inquiry: Inquiry) => {
    if (typeof window === 'undefined') return;
    const currentItems = loadStaffSharedSubmittedInquiryCache();
    if (!inquiry?.id) {
      persistStaffSharedSubmittedInquiryCache(currentItems);
      window.dispatchEvent(new CustomEvent('staffSharedInquiryCacheChanged'));
      return;
    }
    if (!inquiry.isSubmitted) {
      persistStaffSharedSubmittedInquiryCache(currentItems.filter((item) => item.id !== inquiry.id));
      window.dispatchEvent(new CustomEvent('staffSharedInquiryCacheChanged'));
      return;
    }
    persistStaffSharedSubmittedInquiryCache([
      sanitizeInquiryForSyncedCache(inquiry),
      ...currentItems.filter((item) => item.id !== inquiry.id),
    ]);
    window.dispatchEvent(new CustomEvent('staffSharedInquiryCacheChanged', { detail: { inquiryId: inquiry.id } }));
  };

  const removeFromStaffSharedSubmittedInquiryCache = (inquiryId: string) => {
    if (typeof window === 'undefined') return;
    persistStaffSharedSubmittedInquiryCache(
      loadStaffSharedSubmittedInquiryCache().filter((item) => item.id !== inquiryId),
    );
    window.dispatchEvent(new CustomEvent('staffSharedInquiryCacheChanged', { detail: { inquiryId } }));
  };

  const upsertPendingInquiry = (inquiry: Inquiry) => {
    const candidatePending = [
      inquiry,
      ...loadPendingInquirySyncItems().filter((item) => item.id !== inquiry.id),
    ];
    const { normalized, counterStorageUpdates } = sanitizePendingInquiryDrafts(candidatePending);
    if (typeof window !== 'undefined') {
      for (const [storageKey, nextCounter] of counterStorageUpdates) {
        localStorage.setItem(storageKey, String(nextCounter));
      }
    }
    persistPendingInquirySyncItems(normalized);
    return normalized;
  };

  const removePendingInquiry = (inquiryId: string) => {
    const nextPending = loadPendingInquirySyncItems().filter((item) => item.id !== inquiryId);
    persistPendingInquirySyncItems(nextPending);
    pendingSyncAttemptedAtRef.current.delete(inquiryId);
    return nextPending;
  };

  const recoverPendingInquiryFromServer = async (pendingInquiry: Inquiry): Promise<boolean> => {
    try {
      await loadFromSupabase();
    } catch {
      return false;
    }

    const latestList = getLatestVisibleInquiryList();
    return latestList.some((item) =>
      isSameInquiryIdentity(item, pendingInquiry) &&
      item.syncStatus !== 'pending' &&
      Boolean(resolveInquiryStableNumber(item)),
    );
  };

  const syncInquiryInBackground = async (inquiry: Inquiry) => {
    const inquiryId = String(inquiry?.id || '').trim();
    if (!inquiryId || pendingSyncInFlightRef.current.has(inquiryId) || deletedInquiryIdsRef.current.has(inquiryId)) {
      return;
    }
    pendingSyncInFlightRef.current.add(inquiryId);
    try {
      const saved = await inquiryService.createAtomic(inquiry);
      if (!saved) return;
      if (deletedInquiryIdsRef.current.has(inquiryId)) {
        removePendingInquiry(inquiryId);
        try {
          await inquiryService.delete(saved.id);
        } catch (deleteError) {
          console.warn('⚠️ [syncInquiryInBackground] best-effort cleanup after local delete failed:', deleteError);
        }
        return;
      }
      let enrichedSaved = saved as Inquiry;
      try {
        const syncedProductOemMap = await inquiryOemService.replaceProductModulesByInquiryId(
          saved.id,
          inquiry.products || [],
        );
        const enrichedProducts = (saved.products || inquiry.products || []).map((product) => ({
          ...product,
          oem: syncedProductOemMap.get(String(product?.id || '')) || product.oem,
        }));
        const aggregateOem = await inquiryOemService.upsertByInquiryId(
          saved.id,
          aggregateInquiryOemFromProducts(enrichedProducts),
        );
        enrichedSaved = {
          ...(saved as Inquiry),
          products: enrichedProducts,
          oem: aggregateOem || aggregateInquiryOemFromProducts(enrichedProducts),
        };
      } catch (oemError) {
        console.warn('⚠️ [syncInquiryInBackground] OEM sync failed:', oemError);
      }
      const dispatchVersion = getPersistableOemFactoryDispatch(inquiry as Inquiry & Record<string, any>);
      if (dispatchVersion?.payload) {
        try {
          const syncedDispatch = await inquiryOemFactoryDispatchService.upsertByInquiryId(saved.id, dispatchVersion);
          if (syncedDispatch) {
            enrichedSaved = {
              ...enrichedSaved,
              oemFactoryDispatch: syncedDispatch,
            };
          }
        } catch (dispatchError) {
          console.warn('⚠️ [syncInquiryInBackground] OEM factory dispatch sync failed:', dispatchError);
        }
      }
      removePendingInquiry(inquiry.id);
      const hydratedSaved = hydrateInquiryRecord(enrichedSaved as Inquiry);
      syncStaffSharedSubmittedInquiryCache(hydratedSaved as Inquiry);
      const latestList = getLatestVisibleInquiryList();
      setVisibleInquiries(
        [
          { ...hydratedSaved, syncStatus: 'synced', syncMessage: null } as Inquiry,
          ...latestList.filter((item) => item.id !== inquiry.id),
        ]
      );
      enqueueInquiryProductMappings(hydratedSaved as Inquiry);
    } catch (error) {
      console.warn('⚠️ [syncInquiryInBackground] failed:', error);
      if (isJwtExpiredError(error)) {
        console.error('[syncInquiryInBackground] JWT expired — session needs re-login.');
        setVisibleInquiries(
          getLatestVisibleInquiryList().map((item) =>
            item.id === inquiry.id
              ? {
                  ...item,
                  syncStatus: 'pending',
                  syncMessage: '登录已过期，请重新登录后再试',
                }
              : item,
          ),
        );
        removePendingInquiry(inquiry.id);
        return;
      }
      if (isTransientInquirySaveError(error)) {
        const recovered = await recoverPendingInquiryFromServer(inquiry);
        if (recovered) {
          removePendingInquiry(inquiry.id);
          return;
        }
        setVisibleInquiries(
          getLatestVisibleInquiryList().map((item) =>
            item.id === inquiry.id
              ? {
                  ...item,
                  syncStatus: 'pending',
                  syncMessage: 'Saved locally, retrying server sync…',
                }
              : item,
          ),
        );
      }
      else if (isDeterministicInquirySaveError(error)) {
        removePendingInquiry(inquiry.id);
        void loadFromSupabase();
      }
    } finally {
      pendingSyncInFlightRef.current.delete(inquiryId);
    }
  };

  const retryPendingInquiriesInBackground = (pendingList: Inquiry[]) => {
    const now = Date.now();
    pendingList
      .filter((item) => item?.syncStatus === 'pending')
      .forEach((item) => {
        const inquiryId = String(item?.id || '').trim();
        if (!inquiryId || deletedInquiryIdsRef.current.has(inquiryId)) return;
        const lastAttemptedAt = pendingSyncAttemptedAtRef.current.get(inquiryId) || 0;
        if (now - lastAttemptedAt < 15000) {
          return;
        }
        pendingSyncAttemptedAtRef.current.set(inquiryId, now);
        window.setTimeout(() => {
          void syncInquiryInBackground(item);
        }, 0);
      });
  };

  const syncUpdatedInquiryInBackground = async (inquiry: Inquiry, previousId: string) => {
    try {
      const saved = await inquiryService.update(previousId, inquiry);
      if (!saved) return;

      let enrichedSaved = saved as Inquiry;
      try {
        const syncedProductOemMap = await inquiryOemService.replaceProductModulesByInquiryId(
          previousId,
          inquiry.products || [],
        );
        const enrichedProducts = (saved.products || inquiry.products || []).map((product) => ({
          ...product,
          oem: syncedProductOemMap.get(String(product?.id || '')) || product.oem,
        }));
        const aggregateOem = await inquiryOemService.upsertByInquiryId(
          previousId,
          aggregateInquiryOemFromProducts(enrichedProducts),
        );
        enrichedSaved = {
          ...(saved as Inquiry),
          products: enrichedProducts,
          oem: aggregateOem || aggregateInquiryOemFromProducts(enrichedProducts),
        };
      } catch (oemError) {
        console.warn('⚠️ [syncUpdatedInquiryInBackground] OEM sync failed:', oemError);
      }

      const dispatchVersion = getPersistableOemFactoryDispatch(inquiry as Inquiry & Record<string, any>);
      if (dispatchVersion?.payload) {
        try {
          const syncedDispatch = await inquiryOemFactoryDispatchService.upsertByInquiryId(previousId, dispatchVersion);
          if (syncedDispatch) {
            enrichedSaved = {
              ...enrichedSaved,
              oemFactoryDispatch: syncedDispatch,
            };
          }
        } catch (dispatchError) {
          console.warn('⚠️ [syncUpdatedInquiryInBackground] OEM factory dispatch sync failed:', dispatchError);
        }
      }

      removePendingInquiry(previousId);
      const hydratedSaved = hydrateInquiryRecord(enrichedSaved as Inquiry);
      syncStaffSharedSubmittedInquiryCache(hydratedSaved as Inquiry);
      setVisibleInquiries(
        getLatestVisibleInquiryList().map((item) =>
          item.id === previousId ? ({ ...hydratedSaved, syncStatus: 'synced', syncMessage: null }) : item
        )
      );
      enqueueInquiryProductMappings(hydratedSaved as Inquiry);
    } catch (error) {
      console.warn('⚠️ [syncUpdatedInquiryInBackground] failed:', error);
      if (isDeterministicInquirySaveError(error)) {
        removePendingInquiry(previousId);
        void loadFromSupabase();
      }
    }
  };

  const queueInquiryForSync = (inquiry: Inquiry, message: string) => {
    const pendingInquiry = {
      ...hydrateInquiryRecord(inquiry),
      syncStatus: 'pending' as const,
      syncMessage: message,
    };
    upsertPendingInquiry(pendingInquiry);
    setVisibleInquiries(mergeInquiryLists(getLatestVisibleInquiryList(), [pendingInquiry]));
    console.warn('⚠️ [queueInquiryForSync] retained local pending inquiry:', {
      inquiryId: inquiry.id,
      message,
    });
  };

  const normalizeInquiryRegionForRouting = (region?: string | null): SalesRepRegion => {
    const value = String(region || '').trim().toLowerCase();
    if (value === 'na' || value === 'north america' || value === 'north_america' || value === 'north-america' || value === '北美') {
      return 'north_america';
    }
    if (value === 'sa' || value === 'south america' || value === 'south_america' || value === 'south-america' || value === '南美') {
      return 'south_america';
    }
    if (
      value === 'ea' ||
      value === 'emea' ||
      value === 'europe & africa' ||
      value === 'europe_africa' ||
      value === 'europe-africa' ||
      value === '欧非'
    ) {
      return 'europe_africa';
    }
    return 'north_america';
  };

  const withRoutingLookupTimeout = async <T,>(
    task: Promise<T>,
    fallback: T,
    timeoutMs = 5000,
    warning = 'Routing lookup timed out, using fallback.',
  ): Promise<T> => {
    let timer: ReturnType<typeof window.setTimeout> | null = null;
    try {
      return await Promise.race([
        task,
        new Promise<T>((resolve) => {
          timer = window.setTimeout(() => {
            console.warn(`⚠️ [InquiryContext] ${warning}`);
            resolve(fallback);
          }, timeoutMs);
        }),
      ]);
    } finally {
      if (timer) {
        window.clearTimeout(timer);
      }
    }
  };

  const resolveRegionalManagerEmail = async (region?: string | null): Promise<string | null> => {
    const normalizedRegion = normalizeInquiryRegionForRouting(region);
    const regionCodeMap: Record<SalesRepRegion, 'NA' | 'SA' | 'EA'> = {
      north_america: 'NA',
      south_america: 'SA',
      europe_africa: 'EA',
    };
    const regionalManagerEmailFallbackMap: Record<'NA' | 'SA' | 'EA', string> = {
      NA: 'salesmanager-na@cosunchina.com',
      SA: 'salesmanager-sa@cosunchina.com',
      EA: 'salesmanager-ea@cosunchina.com',
    };

    const regionCode = regionCodeMap[normalizedRegion];
    try {
      const manager = await withRoutingLookupTimeout(
        staffDirectoryService.findRegionalManagerByRegion(regionCode),
        null,
        5000,
        `Regional manager lookup timed out for ${regionCode}, using fallback mapping.`,
      );
      return manager?.email || regionalManagerEmailFallbackMap[regionCode] || null;
    } catch (error) {
      console.warn('⚠️ [resolveRegionalManagerEmail] fallback to official manager mapping:', error);
      return regionalManagerEmailFallbackMap[regionCode] || null;
    }
  };

  const resolveCustomerHistorySalesRepAssignment = async (
    inquiry: Inquiry,
  ): Promise<{ email: string; name: string | null; role: 'Sales_Rep' } | null> => {
    const customerKeys = [
      inquiry.companyId,
      inquiry.buyerInfo?.companyName,
      inquiry.buyerCompany,
      inquiry.userEmail,
      inquiry.buyerInfo?.email,
    ]
      .map((value) => String(value || '').trim())
      .filter(Boolean);

    for (const customerKey of customerKeys) {
      const mappedSalesRep = getSalesRepByCustomer(customerKey);
      if (mappedSalesRep?.email) {
        return {
          email: mappedSalesRep.email,
          name: mappedSalesRep.name || mappedSalesRep.displayName || null,
          role: 'Sales_Rep',
        };
      }
    }

    return null;
  };

  const resolveDefaultSalesRepAssignment = async (
    region?: string | null,
  ): Promise<{ email: string; name: string | null; role: 'Sales_Rep' } | null> => {
    const normalizedRegion = normalizeInquiryRegionForRouting(region);
    const regionCodeMap: Record<SalesRepRegion, 'NA' | 'SA' | 'EA'> = {
      north_america: 'NA',
      south_america: 'SA',
      europe_africa: 'EA',
    };
    const regionalSalesRepEmailFallbackMap: Record<'NA' | 'SA' | 'EA', string> = {
      NA: 'sales01-na@cosunchina.com',
      SA: 'sales01-sa@cosunchina.com',
      EA: 'sales02-ea@cosunchina.com',
    };

    const regionCode = regionCodeMap[normalizedRegion];
    const cachedSalesReps = staffDirectoryService
      .getCachedSalesStaff()
      .filter((row) => row.rbacRole === 'Sales_Rep' && String(row.region || '').trim().toUpperCase() === regionCode);
    const cachedDefaultRep = cachedSalesReps[0];
    if (cachedDefaultRep?.email) {
      return {
        email: cachedDefaultRep.email,
        name: cachedDefaultRep.name || null,
        role: 'Sales_Rep',
      };
    }

    const fallbackEmail = regionalSalesRepEmailFallbackMap[regionCode];
    if (fallbackEmail) {
      window.setTimeout(() => {
        void staffDirectoryService.listSalesRepsByRegion(regionCode).catch((error) => {
          console.warn('⚠️ [resolveDefaultSalesRepAssignment] background sales-rep refresh failed:', error);
        });
      }, 0);
      return {
        email: fallbackEmail,
        name: null,
        role: 'Sales_Rep',
      };
    }

    try {
      const salesReps = await withRoutingLookupTimeout(
        staffDirectoryService.listSalesRepsByRegion(regionCode),
        [] as Awaited<ReturnType<typeof staffDirectoryService.listSalesRepsByRegion>>,
        5000,
        `Sales rep lookup timed out for ${regionCode}, using fallback mapping.`,
      );
      const defaultRep = salesReps[0];
      if (defaultRep?.email) {
        return {
          email: defaultRep.email,
          name: defaultRep.name || null,
          role: 'Sales_Rep',
        };
      }
    } catch (error) {
      console.warn('⚠️ [resolveDefaultSalesRepAssignment] fallback to official sales-rep mapping:', error);
    }
    return null;
  };

  const ensureInquiryAssignment = async (inquiry: Inquiry): Promise<Inquiry> => {
    const storedPortalRole = getStoredPortalRole();
    const isCustomerOriginatedInquiry =
      storedPortalRole === 'customer' &&
      !inquiry.documentRenderMeta?.syntheticRecovered;
    const prefilledSalesRepSource = isCustomerOriginatedInquiry
      ? null
      : (inquiry.salesRepEmail || inquiry.ownerEmail);
    const prefilledAssignedSource = isCustomerOriginatedInquiry
      ? null
      : inquiry.assignedTo;
    const prefilledOwnerSource = isCustomerOriginatedInquiry
      ? null
      : (inquiry.ownerEmail || inquiry.salesRepEmail || inquiry.assignedTo);

    const normalizedSalesRepEmail = normalizePersonnelEmail(
      prefilledSalesRepSource,
      inquiry.region,
    ) || null;
    const normalizedAssignedEmail = normalizePersonnelEmail(prefilledAssignedSource, inquiry.region) || null;
    const normalizedOwnerEmail = normalizePersonnelEmail(
      prefilledOwnerSource,
      inquiry.region,
    ) || null;

    if (normalizedSalesRepEmail || normalizedAssignedEmail) {
      return {
        ...inquiry,
        assignedTo: normalizedSalesRepEmail || normalizedAssignedEmail,
        salesRepEmail: normalizedSalesRepEmail,
        ownerEmail: normalizedOwnerEmail || normalizedSalesRepEmail || normalizedAssignedEmail,
        ownerName: inquiry.ownerName || null,
        ownerRole: inquiry.ownerRole || ((normalizedSalesRepEmail || normalizedAssignedEmail) ? 'Sales_Rep' : null),
      };
    }

    const historicalSalesRep = await resolveCustomerHistorySalesRepAssignment(inquiry);
    if (historicalSalesRep?.email) {
      return {
        ...inquiry,
        assignedTo: historicalSalesRep.email,
        salesRepEmail: historicalSalesRep.email,
        ownerEmail: historicalSalesRep.email,
        ownerName: inquiry.ownerName || historicalSalesRep.name,
        ownerRole: inquiry.ownerRole || historicalSalesRep.role,
      };
    }

    const regionalManagerByMapping = getRegionalManagerByRegion(normalizeInquiryRegionForRouting(inquiry.region));
    if (regionalManagerByMapping?.email) {
      return {
        ...inquiry,
        assignedTo: regionalManagerByMapping.email,
        salesRepEmail: null,
        ownerEmail: null,
        ownerName: null,
        ownerRole: null,
      };
    }

    const defaultSalesRep = await resolveDefaultSalesRepAssignment(inquiry.region);
    if (defaultSalesRep?.email) {
      return {
        ...inquiry,
        assignedTo: defaultSalesRep.email,
        salesRepEmail: defaultSalesRep.email,
        ownerEmail: defaultSalesRep.email,
        ownerName: inquiry.ownerName || defaultSalesRep.name,
        ownerRole: inquiry.ownerRole || defaultSalesRep.role,
      };
    }

    const regionalManagerEmail = await resolveRegionalManagerEmail(inquiry.region);
    if (!regionalManagerEmail) {
      return inquiry;
    }

    return {
      ...inquiry,
      assignedTo: regionalManagerEmail,
      salesRepEmail: null,
      ownerEmail: inquiry.ownerEmail || null,
      ownerName: inquiry.ownerName || null,
      ownerRole: inquiry.ownerRole || null,
    };
  };

  const isAwaitingRegionalManagerDispatch = (inquiry: Inquiry) => {
    const normalizedAssignedEmail = normalizePersonnelEmail(inquiry.assignedTo, inquiry.region) || '';
    const normalizedSalesRepEmail = normalizePersonnelEmail(
      inquiry.salesRepEmail || inquiry.ownerEmail,
      inquiry.region,
    ) || '';
    const regionalManager = getRegionalManagerByRegion(normalizeInquiryRegionForRouting(inquiry.region));
    const regionalManagerEmail = normalizePersonnelEmail(regionalManager?.email, inquiry.region) || '';

    return Boolean(
      inquiry.isSubmitted &&
      normalizedAssignedEmail &&
      regionalManagerEmail &&
      normalizedAssignedEmail === regionalManagerEmail &&
      !normalizedSalesRepEmail,
    );
  };

  const buildInquiryApprovalHistoryItem = (input: {
    approver: string;
    approverName: string;
    approverRole: string;
    action: 'submitted' | 'cancelled';
    comment: string;
  }) => ({
    id: crypto.randomUUID(),
    approver: input.approver,
    approverName: input.approverName,
    approverRole: input.approverRole,
    action: input.action,
    comment: input.comment,
    timestamp: new Date().toISOString(),
  });

  const buildInquiryProductSummary = (inquiry: Inquiry) => {
    const names = (inquiry.products || [])
      .map((product) => String(product?.productName || product?.name || '').trim())
      .filter(Boolean);
    if (names.length === 0) return inquiry.message || '客户提交了新的 ING，等待分发';
    if (names.length === 1) return names[0];
    return `${names[0]} 等 ${names.length} 个产品`;
  };

  const ensureInquiryDispatchApprovalRecord = async (inquiry: Inquiry) => {
    if (!isAwaitingRegionalManagerDispatch(inquiry)) return;

    const inquiryNumber = String(inquiry.inquiryNumber || inquiry.id || '').trim();
    if (!inquiryNumber) return;

    const regionalManagerEmail = normalizePersonnelEmail(inquiry.assignedTo, inquiry.region);
    if (!regionalManagerEmail) return;

    const existingPendingRecord = await approvalRecordService.findLatestByDocumentAndStatuses({
      type: 'ing',
      relatedDocumentId: inquiryNumber,
      statuses: ['pending', 'forwarded', 'pending_approval'],
    });

    if (existingPendingRecord) return;

    const customerName = String(
      inquiry.buyerInfo?.companyName ||
      inquiry.buyerCompany ||
      inquiry.userEmail ||
      '客户',
    ).trim();
    const submittedBy = String(inquiry.userEmail || inquiry.buyerInfo?.email || '').trim().toLowerCase();
    const submittedByName = String(inquiry.buyerInfo?.contactPerson || customerName || '客户').trim();

    await approvalRecordService.upsert({
      id: crypto.randomUUID(),
      type: 'ing',
      relatedDocumentId: inquiryNumber,
      relatedDocumentType: '客户ING待分发',
      relatedDocument: inquiry,
      submittedBy,
      submittedByName,
      submittedByRole: 'Customer',
      submittedAt: new Date(inquiry.submittedAt || Date.now()).toISOString(),
      region: inquiry.region || 'NA',
      currentApprover: regionalManagerEmail,
      currentApproverRole: 'Regional_Manager',
      nextApprover: null,
      nextApproverRole: null,
      requiresDirectorApproval: false,
      status: 'pending',
      urgency: 'normal',
      amount: Number(inquiry.totalPrice || 0),
      currency: 'USD',
      customerName,
      customerEmail: submittedBy,
      productSummary: buildInquiryProductSummary(inquiry),
      approvalHistory: [
        buildInquiryApprovalHistoryItem({
          approver: submittedBy,
          approverName: submittedByName,
          approverRole: 'Customer',
          action: 'submitted',
          comment: '客户提交 ING，等待区域主管分发业务员',
        }),
      ],
      deadline: null,
    });
  };

  const cancelInquiryDispatchApprovalRecord = async (inquiry: Inquiry, comment: string) => {
    const inquiryNumber = String(inquiry.inquiryNumber || inquiry.id || '').trim();
    if (!inquiryNumber) return;

    const existingPendingRecord = await approvalRecordService.findLatestByDocumentAndStatuses({
      type: 'ing',
      relatedDocumentId: inquiryNumber,
      statuses: ['pending', 'forwarded', 'pending_approval'],
    });

    if (!existingPendingRecord) return;

    const regionalManagerEmail = normalizePersonnelEmail(existingPendingRecord.currentApprover, inquiry.region) || 'system@cosun.com';
    const regionalManagerName = String(existingPendingRecord.currentApprover || '区域主管').trim();
    const nextHistory = [
      ...(Array.isArray(existingPendingRecord.approvalHistory) ? existingPendingRecord.approvalHistory : []),
      buildInquiryApprovalHistoryItem({
        approver: regionalManagerEmail,
        approverName: regionalManagerName,
        approverRole: 'Regional_Manager',
        action: 'cancelled',
        comment,
      }),
    ];

    await approvalRecordService.updateStatus(existingPendingRecord.id, 'cancelled', nextHistory);
  };

  const notifyInquiryRoutedToRegionalManager = async (inquiry: Inquiry) => {
    const regionalManagerEmail = normalizePersonnelEmail(inquiry.assignedTo, inquiry.region);
    if (!regionalManagerEmail) return;

    const inquiryNumber = String(inquiry.inquiryNumber || inquiry.id || '').trim();
    const customerName = String(
      inquiry.buyerInfo?.companyName ||
      inquiry.buyerCompany ||
      inquiry.userEmail ||
      '客户',
    ).trim();

    sendNotificationToUser(regionalManagerEmail, {
      type: 'inquiry_processing',
      title: `新客户 ING 待分发：${inquiryNumber}`,
      message: `${customerName} 提交了新的 ING，请先分配给本区域业务员。`,
      relatedId: inquiryNumber,
      relatedType: 'ing',
      sender: inquiry.userEmail || inquiry.buyerInfo?.email || '',
      metadata: {
        routeStage: 'manager_dispatch',
        customerName,
        inquiryId: inquiry.id,
        inquiryNumber,
        region: inquiry.region || 'NA',
      },
    });
  };

  const notifyInquiryRoutedToSalesRep = async (inquiry: Inquiry, reason: 'history' | 'manager_assignment') => {
    const salesRepEmail = normalizePersonnelEmail(
      inquiry.salesRepEmail || inquiry.ownerEmail || inquiry.assignedTo,
      inquiry.region,
    );
    if (!salesRepEmail) return;

    const inquiryNumber = String(inquiry.inquiryNumber || inquiry.id || '').trim();
    const customerName = String(
      inquiry.buyerInfo?.companyName ||
      inquiry.buyerCompany ||
      inquiry.userEmail ||
      '客户',
    ).trim();

    sendNotificationToUser(salesRepEmail, {
      type: 'inquiry_processing',
      title: reason === 'history' ? `客户 ING 已直达：${inquiryNumber}` : `主管已分发 ING：${inquiryNumber}`,
      message: reason === 'history'
        ? `${customerName} 提交了新的 ING，系统已按历史对接关系直达给你。`
        : `${customerName} 的 ING 已由区域主管分发给你，请及时跟进。`,
      relatedId: inquiryNumber,
      relatedType: 'ing',
      sender: inquiry.assignedTo || inquiry.userEmail || '',
      metadata: {
        routeStage: reason === 'history' ? 'history_sales_rep' : 'manager_assigned_sales_rep',
        customerName,
        inquiryId: inquiry.id,
        inquiryNumber,
        region: inquiry.region || 'NA',
      },
    });
  };

  const syncSubmittedInquiryRoutingArtifacts = async (
    inquiry: Inquiry,
    previousInquiry?: Inquiry | null,
    trigger: 'created' | 'submitted' | 'updated' = 'submitted',
  ) => {
    if (!inquiry.isSubmitted) return;

    const wasAwaitingManagerDispatch = previousInquiry ? isAwaitingRegionalManagerDispatch(previousInquiry) : false;
    const isNowAwaitingManagerDispatch = isAwaitingRegionalManagerDispatch(inquiry);

    if (isNowAwaitingManagerDispatch) {
      await ensureInquiryDispatchApprovalRecord(inquiry);
      if (!wasAwaitingManagerDispatch) {
        await notifyInquiryRoutedToRegionalManager(inquiry);
      }
      return;
    }

    if (wasAwaitingManagerDispatch) {
      await cancelInquiryDispatchApprovalRecord(inquiry, 'ING 已由区域主管完成分发');
      await notifyInquiryRoutedToSalesRep(inquiry, 'manager_assignment');
      return;
    }

    const hasAssignedSalesRep = Boolean(
      normalizePersonnelEmail(inquiry.salesRepEmail || inquiry.ownerEmail || inquiry.assignedTo, inquiry.region),
    );
    if (hasAssignedSalesRep && trigger !== 'updated') {
      await notifyInquiryRoutedToSalesRep(inquiry, 'history');
    }
  };

  const syncInquiryProductMappings = async (inquiry: Inquiry) => {
    const products = Array.isArray(inquiry.products) ? inquiry.products : [];
    for (const product of products) {
      const snapshot = product?.inquirySnapshot || product?.inquirySnapshotDraft || null;
      const internalModelNo =
        snapshot?.masterRef?.internalModelNo ||
        product?.modelNo ||
        product?.model_no ||
        product?.internalModelNo;
      if (!internalModelNo) continue;
      try {
        const productMaster = await productMasterService.upsert({
          internalModelNo,
          regionCode: inquiry.region || 'NA',
          productName: snapshot?.productName || product.productName || product.name || '',
          description:
            snapshot?.specSummary ||
            snapshot?.description ||
            product.specifications ||
            product.specification ||
            product.description ||
            '',
          imageUrl: snapshot?.imageUrl || product.image || product.imageUrl || '',
          factoryModelNo:
            snapshot?.factoryModelNo ||
            snapshot?.masterRef?.factoryModelNo ||
            product.factoryModelNo ||
            product.factorySku ||
            product.factory_model_no ||
            product.factory_sku ||
            internalModelNo,
          status: 'active',
        });

        const customerModelNo = snapshot?.customerModelNo || product.customerModelNo;
        if (customerModelNo) {
          await productModelMappingService.ensurePending({
            productId: productMaster.id,
            partyType: 'customer',
            partyId: inquiry.companyId || inquiry.userEmail || 'inquiry-customer',
            externalModelNo: customerModelNo,
            externalProductName: snapshot?.productName || product.productName || product.name || '',
            externalSpecification:
              snapshot?.specSummary ||
              snapshot?.description ||
              product.specifications ||
              product.specification ||
              product.description ||
              '',
            externalImageUrl: snapshot?.imageUrl || product.image || product.imageUrl || '',
            createdFromDocType: 'inquiry',
            createdFromDocId: inquiry.id,
            remarks: `Captured from inquiry ${inquiry.inquiryNumber || inquiry.id}`,
          });
        }
        customerProductLibraryService.backfillSupplierLink(
          {
            ...product,
            sourceType: product?.sourceType || 'derived_from_inquiry',
            supplierProductId: productMaster.id,
            modelNo: productMaster.internalModelNo || product.modelNo || product.internalModelNo || '',
            internalModelNo: productMaster.internalModelNo || product.modelNo || product.internalModelNo || '',
            factoryModelNo: productMaster.factoryModelNo || product.factoryModelNo || product.factorySku || '',
            masterRef:
              snapshot?.masterRef || {
                masterProductId: productMaster.id,
                internalModelNo: productMaster.internalModelNo || internalModelNo,
                factoryModelNo: productMaster.factoryModelNo || internalModelNo,
                isResolved: true,
              },
            mappingRef: snapshot?.mappingRef || product?.mappingRef || null,
            attachmentSummarySnapshot:
              snapshot?.attachmentSummarySnapshot || product?.attachmentSummarySnapshot,
            fileManifestSnapshot: snapshot?.fileManifestSnapshot || product?.fileManifestSnapshot,
            syncStatus: 'synced',
            syncMessage: null,
          },
          {
            customerEmail: inquiry.userEmail,
            companyId: inquiry.companyId || null,
            regionCode: inquiry.region || null,
            lastInquiryId: inquiry.id,
            lastInquiryNumber: inquiry.inquiryNumber || inquiry.id,
          },
        );
      } catch (error) {
        console.warn('⚠️ [syncInquiryProductMappings] failed:', error);
      }
    }
  };

  const enqueueInquiryProductMappings = (inquiry: Inquiry) => {
    void syncInquiryProductMappings(inquiry).catch((error) => {
      console.warn('⚠️ [enqueueInquiryProductMappings] failed:', error);
    });
  };

  const loadFromSupabase = async () => {
    if (loadInFlightRef.current) {
      return loadInFlightRef.current;
    }

    const task = (async () => {
      try {
      const readLatestRecovered = () => getRecoveredInquiryListsForCurrentIdentity();

      const locallyRecovered = readLatestRecovered();
      if (locallyRecovered.length > 0) {
        setVisibleInquiries(locallyRecovered);
      }
      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = getCurrentUser() as any;
      const userId = currentUser?.id || session?.user?.id || null;
      const email = String(
        currentUser?.email ||
        session?.user?.email ||
        '',
      ).trim().toLowerCase();
      let companyId: string | null = null;
      let companyName: string | null = null;

      try {
        const backendUser = JSON.parse(localStorage.getItem('cosun_backend_user') || 'null');
        const authUser = JSON.parse(localStorage.getItem('cosun_auth_user') || 'null');
        const customerProfile = JSON.parse(localStorage.getItem('cosun_customer_profile') || 'null');
        companyId = String(
          currentUser?.companyId ||
          backendUser?.companyId ||
          authUser?.companyId ||
          customerProfile?.companyId ||
          ''
        ).trim() || null;
        companyName = String(
          currentUser?.companyName ||
          currentUser?.company ||
          customerProfile?.companyName ||
          backendUser?.company ||
          authUser?.companyName ||
          ''
        ).trim() || null;
      } catch {
        companyId = null;
        companyName = null;
      }

      let isStaff = isStoredStaffPortalRole();
      if (!isStaff && !!userId && getStoredPortalRole() === null) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('portal_role')
          .eq('id', userId)
          .maybeSingle();
        isStaff = profile?.portal_role === 'admin' || profile?.portal_role === 'staff';
      }

      const hasLookupIdentity = Boolean(isStaff || email || companyId || companyName);
      const storedPortalRole = getStoredPortalRole();
      const portalChannelLabel =
        storedPortalRole === 'admin' || storedPortalRole === 'staff'
          ? 'internal-staff-portal'
          : storedPortalRole === 'supplier'
            ? 'supplier-portal'
            : storedPortalRole === 'customer'
              ? 'customer-portal'
              : 'unknown';
      const effectiveBusinessRole =
        currentUser?.role ||
        currentUser?.userRole ||
        session?.user?.user_metadata?.rbac_role ||
        null;
      const loadSignature = JSON.stringify({
        email,
        userId,
        companyId,
        companyName,
        isStaff,
        portalChannelLabel,
        effectiveBusinessRole,
      });
      const now = Date.now();
      if (
        lastLoadSignatureRef.current === loadSignature &&
        now - lastLoadStartedAtRef.current < 800
      ) {
        console.info('[InquiryContext][loadFromSupabase:skip-duplicate]', {
          actingEmail: email,
          isStaff,
          portalChannel: portalChannelLabel,
        });
        return;
      }
      lastLoadSignatureRef.current = loadSignature;
      lastLoadStartedAtRef.current = now;
      console.info('[InquiryContext][loadFromSupabase:start]', {
        actingUser: {
          id: currentUser?.id || null,
          email,
          role: currentUser?.role || currentUser?.userRole || null,
          region: currentUser?.region || null,
        },
        sessionUser: {
          id: session?.user?.id || null,
          email: session?.user?.email || null,
        },
        portalChannel: portalChannelLabel,
        storedPortalRole,
        effectiveBusinessRole,
        isStaff,
        companyId,
        companyName,
        recoveredCount: locallyRecovered.length,
        sharedSubmittedCount: loadStaffSharedSubmittedInquiryCache().length,
      });
      if (!hasLookupIdentity) {
        setVisibleInquiries(readLatestRecovered());
        return;
      }

      const data = isStaff
        ? await inquiryService.getInternalVisible()
            .then((rows) => (rows || [])
              .filter(Boolean)
              .map((inquiry: any) => hydrateInquiryRecord(inquiry as Inquiry)))
            .catch(async (error) => {
              console.warn('⚠️ [InquiryContext] internal visible inquiry query failed, falling back to direct query:', error);
              return inquiryService.getAll();
            })
        : (() =>
            inquiryService.getCustomerVisible({
              email,
              companyId,
              companyName,
            }).then((rows) => {
              if (Array.isArray(rows) && rows.length > 0) {
                return rows;
              }

              return Promise.allSettled([
                email ? inquiryService.getByUserEmail(email) : Promise.resolve([]),
                companyId ? inquiryService.getByCompanyId(companyId) : Promise.resolve([]),
                companyName ? inquiryService.getByBuyerCompany(companyName) : Promise.resolve([]),
              ]).then((results) => {
                const merged = new Map<string, Inquiry>();
                for (const result of results) {
                  if (result.status !== 'fulfilled') {
                    console.warn('⚠️ [loadFromSupabase] partial inquiry lookup failed:', result.reason);
                    continue;
                  }
                  for (const inquiry of result.value || []) {
                    if (!inquiry?.id) continue;
                    merged.set(inquiry.id, inquiry as Inquiry);
                  }
                }
                const resolved = Array.from(merged.values());
                if (resolved.length > 0) return resolved;

                return inquiryService.getAll().then((allRows) =>
                  (allRows || []).filter((inquiry) =>
                    matchesCustomerInquiryVisibility(inquiry, {
                      email,
                      companyId,
                      companyName,
                    }),
                  ),
                );
              });
            }).catch((error) => {
              console.warn('⚠️ [InquiryContext] customer inquiry server query failed:', error);
              const merged = new Map<string, Inquiry>();
              return Promise.allSettled([
                email ? inquiryService.getByUserEmail(email) : Promise.resolve([]),
                companyId ? inquiryService.getByCompanyId(companyId) : Promise.resolve([]),
                companyName ? inquiryService.getByBuyerCompany(companyName) : Promise.resolve([]),
              ]).then((results) => {
                for (const result of results) {
                  if (result.status !== 'fulfilled') {
                    console.warn('⚠️ [loadFromSupabase] partial inquiry lookup failed:', result.reason);
                    continue;
                  }
                  for (const inquiry of result.value || []) {
                  if (!inquiry?.id) continue;
                  merged.set(inquiry.id, inquiry as Inquiry);
                }
              }
                const resolved = Array.from(merged.values());
                if (resolved.length > 0) return resolved;

                return inquiryService.getAll().then((allRows) =>
                  (allRows || []).filter((inquiry) =>
                    matchesCustomerInquiryVisibility(inquiry, {
                      email,
                      companyId,
                      companyName,
                    }),
                  ),
                );
              });
            }))();
      if (Array.isArray(data)) {
        const enrichedData = await enrichInquiryListWithOem(data as Inquiry[])
        const enrichedWithDispatch = await enrichInquiryListWithOemFactoryDispatch(enrichedData)
        const normalizedRemote = enrichedWithDispatch.map((item) => ({
          ...item,
          syncStatus: 'synced' as const,
          syncMessage: null,
        }));
        const retainedPending = reconcilePendingInquirySyncItems(normalizedRemote);
        // 请求完成时重新读取一次本地恢复列表，避免把这段时间内新建的 pending ING 覆盖掉。
        const recoveredLocal = mergeRemoteWithRecoveredInquiryLists(
          loadSyncedInquiryCache(),
          retainedPending,
        );
        const mergedResults = mergeRemoteWithRecoveredInquiryLists(
          normalizedRemote,
          recoveredLocal,
        );
        if (mergedResults.length > 0) {
          setVisibleInquiries(mergedResults);
        } else {
          setVisibleInquiries(locallyRecovered);
        }
        retryPendingInquiriesInBackground(retainedPending);
        console.info('[InquiryContext][loadFromSupabase:done]', {
          actingEmail: email,
          isStaff,
          remoteCount: data.length,
          enrichedCount: enrichedWithDispatch.length,
          mergedCount: mergedResults.length,
          retainedPendingCount: retainedPending.length,
          firstRows: enrichedWithDispatch.slice(0, 5).map((item) => ({
            id: item.id,
            inquiryNumber: item.inquiryNumber || null,
            status: item.status,
            isSubmitted: item.isSubmitted,
            region: item.region,
            assignedTo: item.assignedTo || null,
            salesRepEmail: item.salesRepEmail || null,
            ownerEmail: item.ownerEmail || null,
          })),
        });
      }
    } catch (err) {
      if ((err as any)?.name === 'AbortError') {
        return;
      }
      console.error('❌ [loadFromSupabase] error:', err);
      const localPending = loadPendingInquirySyncItems();
      const cachedSynced = loadSyncedInquiryCache();
      const locallyRecovered = mergeSyncedAndPendingInquiryLists(cachedSynced, localPending);
      if (locallyRecovered.length > 0) {
        setVisibleInquiries(locallyRecovered);
      }
      } finally {
        loadInFlightRef.current = null;
      }
    })();

    loadInFlightRef.current = task;
    return task;
  };

  const refreshInquiries = async () => {
    await loadFromSupabase();
  };

  useEffect(() => {
    clearCorruptedInquiryFallbackCounters();
    clearLegacyPendingInquirySyncItems();
    void loadFromSupabase();

    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) {
        void loadFromSupabase();
      }
      if (event === 'SIGNED_OUT') {
        const currentUser = getCurrentUser();
        if (currentUser?.email) {
          void loadFromSupabase();
        } else {
          preserveInquiryStateOnAuthGap();
        }
      }
    });

    return () => { authSub.unsubscribe(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preserveInquiryStateOnAuthGap]);

  useEffect(() => {
    const syncVisibleInquiries = () => {
      setVisibleInquiries(
        getRecoveredInquiryListsForCurrentIdentity(),
      );
      void loadFromSupabase();
    };
    const handleWindowFocus = () => {
      void loadFromSupabase();
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void loadFromSupabase();
      }
    };
    window.addEventListener('userChanged', syncVisibleInquiries as EventListener);
    window.addEventListener('storage', syncVisibleInquiries);
    window.addEventListener('staffSharedInquiryCacheChanged', syncVisibleInquiries as EventListener);
    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.removeEventListener('userChanged', syncVisibleInquiries as EventListener);
      window.removeEventListener('storage', syncVisibleInquiries);
      window.removeEventListener('staffSharedInquiryCacheChanged', syncVisibleInquiries as EventListener);
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      retryPendingInquiriesInBackground(loadPendingInquirySyncItems());
    }, 15000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      if (!isStoredStaffPortalRole() || getStoredPortalRole() !== 'admin') return;
      void loadFromSupabase();
    }, 2000);

    return () => {
      window.clearInterval(timer);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const channel = inquiryService.subscribeToChanges((payload) => {
      const eventType = String(payload?.eventType || '').toUpperCase();
      const nextRow = payload?.new && typeof payload.new === 'object' ? payload.new : null;
      const previousRow = payload?.old && typeof payload.old === 'object' ? payload.old : null;

      if (eventType === 'DELETE') {
        const deletedId = String(previousRow?.id || '').trim();
        if (deletedId) {
          removeFromStaffSharedSubmittedInquiryCache(deletedId);
          setVisibleInquiries(
            getLatestVisibleInquiryList().filter((item) => item.id !== deletedId),
          );
        }
        window.setTimeout(() => {
          void loadFromSupabase();
        }, 200);
        return;
      }

      if (nextRow?.id) {
        const mapped = mapInquiryRowToInquiry(nextRow, { isUuidLike });
        if (mapped?.id) {
          const hydratedRealtimeInquiry = hydrateInquiryRecord({
            ...(mapped as Inquiry),
            syncStatus: 'synced',
            syncMessage: null,
          } as Inquiry);
          if (hydratedRealtimeInquiry.isSubmitted) {
            syncStaffSharedSubmittedInquiryCache(hydratedRealtimeInquiry);
          }
          setVisibleInquiries(
            mergeInquiryLists(
              [hydratedRealtimeInquiry],
              getLatestVisibleInquiryList().filter((item) => item.id !== hydratedRealtimeInquiry.id),
            ),
          );
        }
      }

      window.setTimeout(() => {
        void loadFromSupabase();
      }, 200);
    });

    return () => {
      channel.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addInquiry = async (inquiry: Inquiry) => {
    const inquiryWithAssignment = await ensureInquiryAssignment(prepareInquiryRecordForSave(inquiry));

    if (shouldCreateInquiryLocallyFirst()) {
      const pendingInquiry = {
        ...hydrateInquiryRecord(assignLocalPendingInquiryNumber(inquiryWithAssignment)),
        syncStatus: 'pending' as const,
        syncMessage: 'Saved locally, retrying server sync…',
      };
      upsertPendingInquiry(pendingInquiry);
      setVisibleInquiries(mergeInquiryLists([pendingInquiry], getLatestVisibleInquiryList()));
      emitInquiryEvent(ERP_EVENT_KEYS.INQUIRY_CREATED, pendingInquiry, {
        status: pendingInquiry.status,
        isSubmitted: pendingInquiry.isSubmitted,
        syncStatus: 'pending',
      });
      window.setTimeout(() => {
        try {
          retryPendingInquiriesInBackground(loadPendingInquirySyncItems());
        } catch (retryError) {
          console.warn('⚠️ [addInquiry] pending inquiry retry bootstrap failed:', retryError);
        }
      }, 2000);
      return pendingInquiry;
    }

    try {
      const createTask = inquiryService.createAtomic(inquiryWithAssignment);
      const result = shouldUseLocalInquiryCreateGuardTimeout()
        ? await withInquiryCreateTimeout(
            createTask,
            12000,
            'Inquiry retry save request timed out',
          )
        : await createTask;
      if (!result) {
        throw new Error('Failed to save inquiry to database');
      }
      removePendingInquiry(inquiryWithAssignment.id);
      const hydratedResult = hydrateInquiryRecord(result as Inquiry);
      syncStaffSharedSubmittedInquiryCache(hydratedResult as Inquiry);
      const latestList = getLatestVisibleInquiryList();
      setVisibleInquiries([{
        ...hydratedResult,
        syncStatus: 'synced',
        syncMessage: null,
      }, ...latestList.filter(i => i.id !== result.id && i.id !== inquiryWithAssignment.id)]);
      window.setTimeout(() => {
        void (async () => {
          let enrichedResult = result as Inquiry;
          try {
            const syncedProductOemMap = await inquiryOemService.replaceProductModulesByInquiryId(
              result.id,
              inquiryWithAssignment.products || [],
            );
            const enrichedProducts = (result.products || inquiryWithAssignment.products || []).map((product) => ({
              ...product,
              oem: syncedProductOemMap.get(String(product?.id || '')) || product.oem,
            }));
            const syncedOem = await inquiryOemService.upsertByInquiryId(
              result.id,
              aggregateInquiryOemFromProducts(enrichedProducts),
            );
            enrichedResult = {
              ...(result as Inquiry),
              products: enrichedProducts,
              oem: syncedOem || aggregateInquiryOemFromProducts(enrichedProducts),
            };
          } catch (oemError) {
            console.warn('⚠️ [addInquiry background] OEM sync failed:', oemError);
          }

          const dispatchVersion = getPersistableOemFactoryDispatch(inquiryWithAssignment as Inquiry & Record<string, any>);
          if (dispatchVersion?.payload) {
            try {
              const syncedDispatch = await inquiryOemFactoryDispatchService.upsertByInquiryId(result.id, dispatchVersion);
              if (syncedDispatch) {
                enrichedResult = {
                  ...enrichedResult,
                  oemFactoryDispatch: syncedDispatch,
                };
              }
            } catch (dispatchError) {
              console.warn('⚠️ [addInquiry background] OEM factory dispatch sync failed:', dispatchError);
            }
          }

          const hydratedEnrichedResult = hydrateInquiryRecord(enrichedResult as Inquiry);
          const currentList = getLatestVisibleInquiryList();
          setVisibleInquiries([
            {
              ...hydratedEnrichedResult,
              syncStatus: 'synced',
              syncMessage: null,
            } as Inquiry,
            ...currentList.filter((item) => item.id !== result.id),
          ]);
          await syncSubmittedInquiryRoutingArtifacts(hydratedEnrichedResult as Inquiry, null, 'created');
          enqueueInquiryProductMappings(hydratedEnrichedResult as Inquiry);
        })();
      }, 0);
      emitInquiryEvent(ERP_EVENT_KEYS.INQUIRY_CREATED, hydratedResult as Inquiry, {
        status: hydratedResult.status,
        isSubmitted: hydratedResult.isSubmitted,
      });
      return {
        ...hydratedResult,
        syncStatus: 'synced',
        syncMessage: null,
      } as Inquiry;
    } catch (error) {
      console.warn('⚠️ [addInquiry] Supabase createAtomic failed:', inquiry.id, error);
      if (isTransientInquirySaveError(error)) {
        const pendingInquiry = {
          ...hydrateInquiryRecord(inquiryWithAssignment),
          syncStatus: 'pending' as const,
          syncMessage: 'Saved locally, retrying server sync…',
        };
        window.setTimeout(() => {
          try {
            upsertPendingInquiry(pendingInquiry);
            setVisibleInquiries(mergeInquiryLists(getLatestVisibleInquiryList(), [pendingInquiry]));
          } catch (pendingError) {
            console.warn('⚠️ [addInquiry] failed to queue pending inquiry locally:', pendingError);
          }
        }, 0);
        window.setTimeout(() => {
          try {
            retryPendingInquiriesInBackground(loadPendingInquirySyncItems());
          } catch (retryError) {
            console.warn('⚠️ [addInquiry] pending inquiry retry bootstrap failed:', retryError);
          }
        }, 2000);
        return pendingInquiry;
      }

      const recovered = await recoverPendingInquiryFromServer(inquiryWithAssignment);
      if (recovered) {
        const recoveredInquiry = getLatestVisibleInquiryList().find((item) =>
          isSameInquiryIdentity(item, inquiryWithAssignment),
        );
        if (recoveredInquiry) {
          return {
            ...hydrateInquiryRecord(recoveredInquiry),
            syncStatus: 'synced',
            syncMessage: null,
          } as Inquiry;
        }
      }

      throw error;
    }
  };

  const getUserInquiries = (email: string) => {
    const target = (email || '').trim().toLowerCase();
    if (!target) return [];
    return inquiries.filter((inq) => {
      const a = (inq?.userEmail || '').trim().toLowerCase();
      const b = (inq?.buyerInfo?.email || '').trim().toLowerCase();
      return a === target || b === target;
    });
  };

  const getCompanyInquiries = (companyId: string) => {
    return inquiries.filter(inq => inq.companyId === companyId);
  };

  const updateInquiryStatus = async (id: string, status: Inquiry['status']) => {
    const saved = await inquiryService.updateStatus(id, status);
    syncStaffSharedSubmittedInquiryCache(hydrateInquiryRecord(saved as Inquiry));
    setVisibleInquiries(inquiries.map(inq => inq.id === id ? (saved as Inquiry) : inq));
  };

  const updateInquiry = async (id: string, updatedInquiry: Partial<Inquiry>) => {
    const current = inquiries.find((inq) => inq.id === id);
    if (!current) {
      throw new Error('未找到要更新的 ING');
    }
    const mergedInquiry = await ensureInquiryAssignment(prepareInquiryRecordForSave({
      ...current,
      ...updatedInquiry,
    } as Inquiry & Record<string, any>));

    mergedInquiry.documentDataSnapshot = adaptInquiryToDocumentData(mergedInquiry);

    setVisibleInquiries(
      inquiries.map(inq => inq.id === id ? { ...mergedInquiry, syncStatus: 'pending', syncMessage: 'Waiting for Supabase sync' } : inq)
    );

    try {
      const saved = await inquiryService.update(id, mergedInquiry);
      if (!saved) {
        throw new Error('更新询价失败');
      }
      removePendingInquiry(id);
      const hydratedSaved = hydrateInquiryRecord(saved as Inquiry);
      syncStaffSharedSubmittedInquiryCache(hydratedSaved as Inquiry);
      setVisibleInquiries(
        inquiries.map(inq => inq.id === id ? ({ ...hydratedSaved, syncStatus: 'synced', syncMessage: null }) : inq)
      );
      window.setTimeout(() => {
        void (async () => {
          let enrichedSaved = saved as Inquiry;
          try {
            const syncedProductOemMap = await inquiryOemService.replaceProductModulesByInquiryId(
              id,
              mergedInquiry.products || [],
            );
            const enrichedProducts = (saved.products || mergedInquiry.products || []).map((product) => ({
              ...product,
              oem: syncedProductOemMap.get(String(product?.id || '')) || product.oem,
            }));
            const syncedOem = await inquiryOemService.upsertByInquiryId(
              id,
              aggregateInquiryOemFromProducts(enrichedProducts),
            );
            enrichedSaved = {
              ...(saved as Inquiry),
              products: enrichedProducts,
              oem: syncedOem || aggregateInquiryOemFromProducts(enrichedProducts),
            };
          } catch (oemError) {
            console.warn('⚠️ [updateInquiry background] OEM sync failed:', oemError);
          }

          const dispatchVersion = getPersistableOemFactoryDispatch(mergedInquiry as Inquiry & Record<string, any>);
          if (dispatchVersion?.payload) {
            try {
              const syncedDispatch = await inquiryOemFactoryDispatchService.upsertByInquiryId(id, dispatchVersion);
              if (syncedDispatch) {
                enrichedSaved = {
                  ...enrichedSaved,
                  oemFactoryDispatch: syncedDispatch,
                };
              }
            } catch (dispatchError) {
              console.warn('⚠️ [updateInquiry background] OEM factory dispatch sync failed:', dispatchError);
            }
          }

          const hydratedEnrichedSaved = hydrateInquiryRecord(enrichedSaved as Inquiry);
          setVisibleInquiries(
            getLatestVisibleInquiryList().map((inq) =>
              inq.id === id ? ({ ...hydratedEnrichedSaved, syncStatus: 'synced', syncMessage: null }) : inq
            )
          );

          if (hydratedEnrichedSaved.isSubmitted) {
            void internalInquiryRoutingService.syncRoutingArtifacts(hydratedEnrichedSaved.id).catch((error) => {
              console.warn('⚠️ [updateInquiry background] sync inquiry routing artifacts failed:', error);
            });
          }
          await syncSubmittedInquiryRoutingArtifacts(hydratedEnrichedSaved as Inquiry, current, 'updated');
          enqueueInquiryProductMappings(hydratedEnrichedSaved as Inquiry);
        })();
      }, 0);
    } catch (error) {
      if (isTransientInquirySaveError(error)) {
        queueInquiryForSync(mergedInquiry as Inquiry, error instanceof Error ? error.message : 'Update sync pending');
        window.setTimeout(() => {
          void syncUpdatedInquiryInBackground(mergedInquiry as Inquiry, id);
        }, 1500);
        return;
      }
      throw error instanceof Error ? error : new Error('Failed to update inquiry');
    }
  };

  const deleteInquiry = async (id: string) => {
    const target = inquiries.find((inq) => inq.id === id || inq.inquiryNumber === id);
    const targetId = target?.id || id;
    const targetInquiryNumber = String(target?.inquiryNumber || '').trim();
    const isPendingLocalInquiry = target?.syncStatus === 'pending';
    const shouldDeleteInSupabase = Boolean(
      targetId &&
      isUuidLike(String(targetId)) &&
      !isSyntheticRecoveredInquiry(target) &&
      !isPendingLocalInquiry
    );

    deletedInquiryIdsRef.current.add(String(targetId));
    if (targetInquiryNumber) {
      deletedInquiryIdsRef.current.add(targetInquiryNumber);
    }
    removePendingInquiry(String(targetId));

    const markers = getInquiryMarkers(target || { id });
    const hidden = loadHiddenInquiryMarkers();
    markers.forEach((marker) => hidden.add(marker));
    persistHiddenInquiryMarkers(hidden);
    removeFromStaffSharedSubmittedInquiryCache(targetId);
    setVisibleInquiries((current) => current.filter((inq) => inq.id !== targetId && inq.inquiryNumber !== id));
    emitInquiryEvent(ERP_EVENT_KEYS.INQUIRY_DELETED, {
      id,
      inquiryNumber: target?.inquiryNumber,
    }, { deletedInSupabase: shouldDeleteInSupabase, optimistic: true });

    if (shouldDeleteInSupabase) {
      try {
        await inquiryService.delete(targetId);
      } catch (error) {
        if (!isTransientInquirySaveError(error)) {
          deletedInquiryIdsRef.current.delete(String(targetId));
          if (targetInquiryNumber) {
            deletedInquiryIdsRef.current.delete(targetInquiryNumber);
          }
          markers.forEach((marker) => hidden.delete(marker));
          persistHiddenInquiryMarkers(hidden);
          if (target) {
            setVisibleInquiries((current) =>
              mergeInquiryLists(
                [target],
                current.filter((inq) => inq.id !== target.id),
              ),
            );
          }
          throw error;
        }
        console.warn('⚠️ [deleteInquiry] Supabase delete interrupted, keeping local removal marker:', error);
      }
    }
  };

  const submitInquiry = async (id: string): Promise<boolean> => {
    const inquiry = inquiries.find((inq) => inq.id === id || inq.inquiryNumber === id);
    if (!inquiry) {
      throw new Error('Inquiry not found');
    }
    if (inquiry.isSubmitted) return true;

    const submittedInquiry = await ensureInquiryAssignment(hydrateInquiryRecord({
      ...inquiry,
      isSubmitted: true,
      status: 'pending' as const,
      submittedAt: Date.now(),
    }));
    syncStaffSharedSubmittedInquiryCache(submittedInquiry);
    console.info('[InquiryContext][submitInquiry:prepared]', {
      inquiryId: inquiry.id,
      inquiryNumber: inquiry.inquiryNumber || null,
      actingUser: getCurrentUser(),
      prepared: {
        status: submittedInquiry.status,
        isSubmitted: submittedInquiry.isSubmitted,
        region: submittedInquiry.region,
        assignedTo: submittedInquiry.assignedTo || null,
        salesRepEmail: submittedInquiry.salesRepEmail || null,
        ownerEmail: submittedInquiry.ownerEmail || null,
        ownerRole: submittedInquiry.ownerRole || null,
      },
      sharedSubmittedCount: loadStaffSharedSubmittedInquiryCache().length,
    });

    try {
      const submitPayload = {
        is_submitted: true,
        submitted_at: new Date(submittedInquiry.submittedAt || Date.now()).toISOString(),
        assigned_to: submittedInquiry.assignedTo || submittedInquiry.salesRepEmail || null,
        owner_email: submittedInquiry.ownerEmail || submittedInquiry.salesRepEmail || null,
        owner_name: submittedInquiry.ownerName || null,
        owner_role: submittedInquiry.ownerRole || null,
      };

      let result: Inquiry | null = null;

      // Local pending drafts have not completed their initial server insert yet.
      // Persist them atomically on submit so we get a real inquiry number instead
      // of routing through the slower updateStatus -> upsert fallback path.
      if (inquiry.syncStatus === 'pending') {
        result = await inquiryService.createAtomic({
          ...submittedInquiry,
          status: 'pending',
          isSubmitted: true,
          submittedAt: submittedInquiry.submittedAt || Date.now(),
        });
      } else {
        try {
          result = await inquiryService.updateStatus(inquiry.id, 'pending', submitPayload);
        } catch (updateError) {
          console.warn('⚠️ [submitInquiry] updateStatus failed, falling back to upsert:', updateError);
          result = await inquiryService.upsert({
            ...submittedInquiry,
            status: 'pending',
            isSubmitted: true,
            submittedAt: submittedInquiry.submittedAt || Date.now(),
          });
        }
      }

      if (!result) {
        console.error('❌ [submitInquiry] Supabase updateStatus failed for:', id);
        throw new Error('Failed to submit inquiry to database');
      }

      const hydratedResult = hydrateInquiryRecord(result as Inquiry);
      console.info('[InquiryContext][submitInquiry:saved]', {
        inquiryId: hydratedResult.id,
        inquiryNumber: hydratedResult.inquiryNumber || null,
        saved: {
          status: hydratedResult.status,
          isSubmitted: hydratedResult.isSubmitted,
          region: hydratedResult.region,
          assignedTo: hydratedResult.assignedTo || null,
          salesRepEmail: hydratedResult.salesRepEmail || null,
          ownerEmail: hydratedResult.ownerEmail || null,
          ownerRole: hydratedResult.ownerRole || null,
        },
      });
      removePendingInquiry(id);
      if (hydratedResult.id !== id) {
        removePendingInquiry(hydratedResult.id);
      }
      syncStaffSharedSubmittedInquiryCache(hydratedResult);
      const submittedView = hydrateInquiryRecord({
        ...inquiry,
        ...hydratedResult,
        status: 'pending',
        isSubmitted: true,
        submittedAt: hydratedResult.submittedAt || submittedInquiry.submittedAt || Date.now(),
        syncStatus: 'synced',
        syncMessage: null,
      } as Inquiry);
      setVisibleInquiries(
        inquiries.map((inq) => (
          inq.id === id || inq.inquiryNumber === id
            ? submittedView
            : inq
        ))
      );
      void internalInquiryRoutingService.syncRoutingArtifacts(hydratedResult.id).catch((error) => {
        console.warn('⚠️ [submitInquiry] sync inquiry routing artifacts failed:', error);
      });
      window.setTimeout(() => {
        void (async () => {
          try {
            await syncSubmittedInquiryRoutingArtifacts(hydratedResult, inquiry, 'submitted');
          } catch (error) {
            console.warn('⚠️ [submitInquiry background] sync submitted inquiry routing artifacts failed:', error);
          }
          enqueueInquiryProductMappings(hydratedResult);
        })();
      }, 0);

      emitInquiryEvent(ERP_EVENT_KEYS.INQUIRY_SUBMITTED, {
        id,
        inquiryNumber: inquiry.inquiryNumber || inquiry.id,
      }, { status: 'pending' });

      return true;
    } catch (error) {
      console.error('❌ [submitInquiry] error:', error);
      setVisibleInquiries(inquiries.map(inq => inq.id === id ? ({
        ...inq,
        syncStatus: 'pending',
        syncMessage: error instanceof Error ? error.message : 'Submit sync failed',
      }) : inq));
      throw error instanceof Error ? error : new Error('Failed to submit inquiry');
    }
  };

  const getSubmittedInquiries = () => {
    return filterVisibleInquiriesForCurrentUser(inquiries.filter(inq => inq.isSubmitted === true));
  };

  const getInquiriesByRegion = (region: RegionType) => {
    return inquiries.filter(inq => inq.region === region);
  };

  return (
    <InquiryContext.Provider
      value={{
        inquiries,
        addInquiry,
        getUserInquiries,
        getCompanyInquiries,
        updateInquiryStatus,
        updateInquiry,
        deleteInquiry,
        submitInquiry,
        getSubmittedInquiries,
        getInquiriesByRegion,
        refreshInquiries,
      }}
    >
      {children}
    </InquiryContext.Provider>
  );
}

export function useInquiry() {
  const context = useContext(InquiryContext);
  if (context === undefined) {
    throw new Error('useInquiry must be used within an InquiryProvider');
  }
  return context;
}

export function useOptionalInquiry() {
  return useContext(InquiryContext);
}
