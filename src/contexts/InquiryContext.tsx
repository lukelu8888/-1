import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CartItem } from './CartContext';
import type { RegionType } from '../utils/xjNumberGenerator';
import { getCurrentUser, getStoredPortalRole, isStoredStaffPortalRole } from '../utils/dataIsolation';
import { inquiryOemFactoryDispatchService, inquiryOemService, inquiryService, productMasterService, productModelMappingService } from '../lib/supabaseService';
import { supabase } from '../lib/supabase';
import { ERP_EVENT_KEYS } from '../lib/erp-core/events';
import { emitErpEvent } from '../lib/erp-core/event-bus';
import { adaptInquiryToDocumentData } from '../utils/documentDataAdapters';
import type { CustomerInquiryData } from '../components/documents/templates/CustomerInquiryDocument';
import { routeToSalesRep } from '../lib/customer-salesrep-mapping';
import type { Region as SalesRepRegion } from '../lib/notification-rules';
import { aggregateInquiryOemFromProducts, type InquiryOemData } from '../types/oem';
import { customerProductLibraryService } from '../lib/customerProductLibrary';
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
    deliveryTime?: string;
    portOfDestination?: string;
    paymentTerms?: string;
    tradeTerms?: string;
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

const resolveInquiryStorageIdentity = () => {
  if (typeof window === 'undefined') {
    return { email: 'anonymous', role: 'unknown' };
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
    return { email: 'anonymous', role: 'unknown' };
  }
};

const getHiddenInquiryStorageKey = () => {
  const { email, role } = resolveInquiryStorageIdentity();
  return `${HIDDEN_INQUIRY_IDS_KEY}:${email}:${role}`;
};

const getPendingInquiryStorageKey = () => {
  const { email, role } = resolveInquiryStorageIdentity();
  return `${PENDING_INQUIRY_SYNC_KEY}:${email}:${role}`;
};

const getLegacyPendingInquiryStorageKey = () => {
  const { email, role } = resolveInquiryStorageIdentity();
  return `${LEGACY_PENDING_INQUIRY_SYNC_KEY}:${email}:${role}`;
};

const getSyncedInquiryCacheStorageKey = () => {
  const { email, role } = resolveInquiryStorageIdentity();
  return `${SYNCED_INQUIRY_CACHE_KEY}:${email}:${role}`;
};

const isUuidLikeMarker = (value: unknown) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(value || '').trim(),
  );

const loadHiddenInquiryMarkers = (): Set<string> => {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(getHiddenInquiryStorageKey());
    const parsed = raw ? JSON.parse(raw) : [];
    const normalized = Array.isArray(parsed)
      ? parsed.map((v) => String(v)).filter((v) => isUuidLikeMarker(v))
      : [];
    return new Set(normalized);
  } catch {
    return new Set();
  }
};

const persistHiddenInquiryMarkers = (markers: Set<string>) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(getHiddenInquiryStorageKey(), JSON.stringify(Array.from(markers)));
};

const loadPendingInquirySyncItems = (): Inquiry[] => {
  if (typeof window === 'undefined') return [];
  try {
    const storageKey = getPendingInquiryStorageKey();
    const legacyKey = getLegacyPendingInquiryStorageKey();
    const raw = localStorage.getItem(storageKey) || localStorage.getItem(legacyKey);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.map((item) => hydrateInquiryRecord(item as Inquiry)) : [];
  } catch {
    return [];
  }
};

const loadSyncedInquiryCache = (): Inquiry[] => {
  if (typeof window === 'undefined') return [];
  try {
    const storageKey = getSyncedInquiryCacheStorageKey();
    const raw = localStorage.getItem(storageKey);
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

const hydrateInquiryRecord = (inquiry: Inquiry): Inquiry => {
  const normalizedProducts = Array.isArray(inquiry?.products)
    ? inquiry.products.map((product) => hydrateInquiryProductLine(product))
    : [];

  return {
    ...inquiry,
    products: normalizedProducts,
    oem: inquiry?.oem || aggregateInquiryOemFromProducts(normalizedProducts),
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
};

const clearLegacyPendingInquirySyncItems = () => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(getPendingInquiryStorageKey());
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

const getInquiryMarkers = (inquiry: Partial<Inquiry>): string[] =>
  [inquiry.id].filter(Boolean).map((v) => String(v));

const filterVisibleInquiriesForCurrentUser = (list: Inquiry[]): Inquiry[] => {
  const hidden = loadHiddenInquiryMarkers();
  if (hidden.size === 0) return list;
  return list.filter((inquiry) => !getInquiryMarkers(inquiry).some((marker) => hidden.has(marker)));
};

const mergeInquiryLists = (remoteList: Inquiry[], localPendingList: Inquiry[]) => {
  const merged = new Map<string, Inquiry>();
  for (const inquiry of remoteList) {
    if (!inquiry?.id) continue;
    merged.set(inquiry.id, { ...inquiry, syncStatus: inquiry.syncStatus || 'synced', syncMessage: inquiry.syncMessage || null });
  }
  for (const inquiry of localPendingList) {
    if (!inquiry?.id) continue;
    merged.set(inquiry.id, inquiry);
  }
  return Array.from(merged.values());
};

const mergeSyncedAndPendingInquiryLists = (syncedList: Inquiry[], localPendingList: Inquiry[]) => {
  const merged = new Map<string, Inquiry>();
  for (const inquiry of syncedList) {
    if (!inquiry?.id) continue;
    merged.set(inquiry.id, { ...inquiry, syncStatus: 'synced', syncMessage: null });
  }
  for (const inquiry of localPendingList) {
    if (!inquiry?.id) continue;
    merged.set(inquiry.id, inquiry);
  }
  return Array.from(merged.values());
};

const mergeRemoteWithRecoveredInquiryLists = (remoteList: Inquiry[], recoveredLocalList: Inquiry[]) => {
  const merged = new Map<string, Inquiry>();
  for (const inquiry of remoteList) {
    if (!inquiry?.id) continue;
    merged.set(inquiry.id, inquiry);
  }
  for (const inquiry of recoveredLocalList) {
    if (!inquiry?.id) continue;
    if (!merged.has(inquiry.id)) {
      merged.set(inquiry.id, inquiry);
    }
  }
  return Array.from(merged.values());
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

const isDeterministicInquirySaveError = (error: unknown) => {
  const message = String((error as any)?.message || error || '').toLowerCase();
  return (
    message.includes('inquiries_inquiry_number_tenant_key') ||
    message.includes('duplicate key value violates unique constraint') ||
    message.includes('invalid input syntax for type uuid') ||
    message.includes('inquiry retry save request timed out')
  );
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
      mergeSyncedAndPendingInquiryLists(
        loadSyncedInquiryCache(),
        loadPendingInquirySyncItems(),
      ),
    ),
  );

  const setVisibleInquiries = (next: Inquiry[]) => {
    const visible = filterVisibleInquiriesForCurrentUser(next.map((item) => hydrateInquiryRecord(item)));
    setInquiries(visible);
    persistSyncedInquiryCache(visible.filter((item) => item.syncStatus !== 'pending'));
  };

  const upsertPendingInquiry = (inquiry: Inquiry) => {
    const nextPending = [
      inquiry,
      ...loadPendingInquirySyncItems().filter((item) => item.id !== inquiry.id),
    ];
    persistPendingInquirySyncItems(nextPending);
    return nextPending;
  };

  const removePendingInquiry = (inquiryId: string) => {
    const nextPending = loadPendingInquirySyncItems().filter((item) => item.id !== inquiryId);
    persistPendingInquirySyncItems(nextPending);
    return nextPending;
  };

  const syncInquiryInBackground = async (inquiry: Inquiry) => {
    try {
      const saved = await inquiryService.createAtomic(inquiry);
      if (!saved) return;
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
      setVisibleInquiries(
        inquiries.map((item) =>
          item.id === inquiry.id
            ? ({ ...hydratedSaved, syncStatus: 'synced', syncMessage: null } as Inquiry)
            : item
        )
      );
      enqueueInquiryProductMappings(hydratedSaved as Inquiry);
    } catch (error) {
      console.warn('⚠️ [syncInquiryInBackground] failed:', error);
      if (isDeterministicInquirySaveError(error)) {
        removePendingInquiry(inquiry.id);
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
    setVisibleInquiries(mergeInquiryLists(inquiries, [pendingInquiry]));
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

  const ensureInquiryAssignment = (inquiry: Inquiry): Inquiry => {
    if (inquiry.assignedTo || inquiry.salesRepEmail) {
      return {
        ...inquiry,
        assignedTo: inquiry.assignedTo || inquiry.salesRepEmail || null,
        salesRepEmail: inquiry.salesRepEmail || inquiry.assignedTo || null,
      };
    }

    const normalizedCompanyName = String(inquiry.buyerInfo?.companyName || '').trim();
    const customerName =
      (normalizedCompanyName && normalizedCompanyName !== 'N/A' ? normalizedCompanyName : '') ||
      String(inquiry.companyId || '').trim() ||
      String(inquiry.buyerInfo?.email || '').trim() ||
      String(inquiry.userEmail || '').trim() ||
      'unknown-customer';
    const assignedSalesRep = routeToSalesRep(
      String(customerName || inquiry.userEmail || 'unknown-customer'),
      normalizeInquiryRegionForRouting(inquiry.region),
    );

    if (!assignedSalesRep?.email) {
      return inquiry;
    }

    return {
      ...inquiry,
      assignedTo: assignedSalesRep.email,
      salesRepEmail: assignedSalesRep.email,
    };
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
            masterRef:
              snapshot?.masterRef || {
                masterProductId: productMaster.id,
                internalModelNo: productMaster.internalModelNo || internalModelNo,
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
    try {
      const localPending = loadPendingInquirySyncItems();
      const cachedSynced = loadSyncedInquiryCache();
      const locallyRecovered = mergeSyncedAndPendingInquiryLists(cachedSynced, localPending);
      if (locallyRecovered.length > 0) {
        setVisibleInquiries(locallyRecovered);
      }
      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = getCurrentUser() as any;
      const userId = session?.user?.id || currentUser?.id || null;
      const email = String(
        session?.user?.email ||
        currentUser?.email ||
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
      if (!hasLookupIdentity) {
        setVisibleInquiries(locallyRecovered);
        return;
      }

      const data = isStaff
        ? await inquiryService.getAll()
        : (() =>
            Promise.allSettled([
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
            }))();
      if (Array.isArray(data)) {
        const enrichedData = await enrichInquiryListWithOem(data as Inquiry[])
        const enrichedWithDispatch = await enrichInquiryListWithOemFactoryDispatch(enrichedData)
        // `cachedSynced` is already partitioned per user/role in localStorage.
        // Re-filtering it by volatile identity fields causes false negatives on refresh.
        const recoveredLocal = locallyRecovered;
        const mergedResults = mergeRemoteWithRecoveredInquiryLists(
          enrichedWithDispatch.map((item) => ({ ...item, syncStatus: 'synced', syncMessage: null })),
          recoveredLocal,
        );
        if (mergedResults.length > 0) {
          setVisibleInquiries(mergedResults);
        } else {
          setVisibleInquiries(locallyRecovered);
        }
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
    }
  };

  const refreshInquiries = async () => {
    await loadFromSupabase();
  };

  useEffect(() => {
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
          setVisibleInquiries([]);
        }
      }
    });

    return () => { authSub.unsubscribe(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const syncVisibleInquiries = () => {
      setVisibleInquiries(
        mergeSyncedAndPendingInquiryLists(
          loadSyncedInquiryCache(),
          loadPendingInquirySyncItems(),
        ),
      );
    };
    window.addEventListener('userChanged', syncVisibleInquiries as EventListener);
    window.addEventListener('storage', syncVisibleInquiries);
    return () => {
      window.removeEventListener('userChanged', syncVisibleInquiries as EventListener);
      window.removeEventListener('storage', syncVisibleInquiries);
    };
  }, []);

  const addInquiry = async (inquiry: Inquiry) => {
    const inquiryWithAssignment = ensureInquiryAssignment(prepareInquiryRecordForSave(inquiry));
    const optimisticInquiry = {
      ...inquiryWithAssignment,
      syncStatus: 'pending' as const,
      syncMessage: 'Waiting for Supabase sync',
    } as Inquiry;

    upsertPendingInquiry(optimisticInquiry);
    setVisibleInquiries(mergeInquiryLists(inquiries, [optimisticInquiry]));

    emitInquiryEvent(ERP_EVENT_KEYS.INQUIRY_CREATED, inquiryWithAssignment, {
      status: inquiryWithAssignment.status,
      isSubmitted: inquiryWithAssignment.isSubmitted,
    });

    try {
      const result = await inquiryService.createAtomic(inquiryWithAssignment);
      if (!result) {
        throw new Error('Failed to save inquiry to database');
      }
      let enrichedResult = result as Inquiry
      try {
        const syncedProductOemMap = await inquiryOemService.replaceProductModulesByInquiryId(
          result.id,
          inquiryWithAssignment.products || [],
        )
        const enrichedProducts = (result.products || inquiryWithAssignment.products || []).map((product) => ({
          ...product,
          oem: syncedProductOemMap.get(String(product?.id || '')) || product.oem,
        }))
        const syncedOem = await inquiryOemService.upsertByInquiryId(
          result.id,
          aggregateInquiryOemFromProducts(enrichedProducts),
        )
        enrichedResult = {
          ...(result as Inquiry),
          products: enrichedProducts,
          oem: syncedOem || aggregateInquiryOemFromProducts(enrichedProducts),
        }
      } catch (oemError) {
        console.warn('⚠️ [addInquiry] OEM sync failed:', oemError)
      }
      const dispatchVersion = getPersistableOemFactoryDispatch(inquiryWithAssignment as Inquiry & Record<string, any>)
      if (dispatchVersion?.payload) {
        try {
          const syncedDispatch = await inquiryOemFactoryDispatchService.upsertByInquiryId(result.id, dispatchVersion)
          if (syncedDispatch) {
            enrichedResult = {
              ...enrichedResult,
              oemFactoryDispatch: syncedDispatch,
            }
          }
        } catch (dispatchError) {
          console.warn('⚠️ [addInquiry] OEM factory dispatch sync failed:', dispatchError)
        }
      }
      removePendingInquiry(inquiryWithAssignment.id);
      const hydratedResult = hydrateInquiryRecord(enrichedResult as Inquiry);
      setVisibleInquiries([{
        ...hydratedResult,
        syncStatus: 'synced',
        syncMessage: null,
      }, ...inquiries.filter(i => i.id !== result.id)]);
      enqueueInquiryProductMappings(hydratedResult as Inquiry);
      return {
        ...hydratedResult,
        syncStatus: 'synced',
        syncMessage: null,
      } as Inquiry;
    } catch (error) {
      console.warn('⚠️ [addInquiry] Supabase createAtomic failed:', inquiry.id, error);
      queueInquiryForSync(
        optimisticInquiry,
        error instanceof Error ? error.message : 'Supabase sync failed',
      );
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
    setVisibleInquiries(inquiries.map(inq => inq.id === id ? (saved as Inquiry) : inq));
  };

  const updateInquiry = async (id: string, updatedInquiry: Partial<Inquiry>) => {
    const current = inquiries.find((inq) => inq.id === id);
    if (!current) {
      throw new Error('未找到要更新的 ING');
    }
    const mergedInquiry = ensureInquiryAssignment(prepareInquiryRecordForSave({
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
      let enrichedSaved = saved as Inquiry
      try {
        const syncedProductOemMap = await inquiryOemService.replaceProductModulesByInquiryId(
          id,
          mergedInquiry.products || [],
        )
        const enrichedProducts = (saved.products || mergedInquiry.products || []).map((product) => ({
          ...product,
          oem: syncedProductOemMap.get(String(product?.id || '')) || product.oem,
        }))
        const syncedOem = await inquiryOemService.upsertByInquiryId(
          id,
          aggregateInquiryOemFromProducts(enrichedProducts),
        )
        enrichedSaved = {
          ...(saved as Inquiry),
          products: enrichedProducts,
          oem: syncedOem || aggregateInquiryOemFromProducts(enrichedProducts),
        }
      } catch (oemError) {
        console.warn('⚠️ [updateInquiry] OEM sync failed:', oemError)
      }
      const dispatchVersion = getPersistableOemFactoryDispatch(mergedInquiry as Inquiry & Record<string, any>)
      if (dispatchVersion?.payload) {
        try {
          const syncedDispatch = await inquiryOemFactoryDispatchService.upsertByInquiryId(id, dispatchVersion)
          if (syncedDispatch) {
            enrichedSaved = {
              ...enrichedSaved,
              oemFactoryDispatch: syncedDispatch,
            }
          }
        } catch (dispatchError) {
          console.warn('⚠️ [updateInquiry] OEM factory dispatch sync failed:', dispatchError)
        }
      }
      removePendingInquiry(id);
      const hydratedSaved = hydrateInquiryRecord(enrichedSaved as Inquiry);
      setVisibleInquiries(
        inquiries.map(inq => inq.id === id ? ({ ...hydratedSaved, syncStatus: 'synced', syncMessage: null }) : inq)
      );
      enqueueInquiryProductMappings(hydratedSaved as Inquiry);
    } catch (error) {
      throw error instanceof Error ? error : new Error('Failed to update inquiry');
    }
  };

  const deleteInquiry = async (id: string) => {
    const target = inquiries.find((inq) => inq.id === id || inq.inquiryNumber === id);
    await inquiryService.delete(target?.id || id);
    const markers = getInquiryMarkers(target || { id });
    const hidden = loadHiddenInquiryMarkers();
    markers.forEach((marker) => hidden.add(marker));
    persistHiddenInquiryMarkers(hidden);
    setVisibleInquiries(inquiries.filter((inq) => inq.id !== (target?.id || id)));
    emitInquiryEvent(ERP_EVENT_KEYS.INQUIRY_DELETED, {
      id,
      inquiryNumber: target?.inquiryNumber,
    }, { deletedInSupabase: true });
  };

  const submitInquiry = async (id: string): Promise<boolean> => {
    const inquiry = inquiries.find(inq => inq.id === id);
    if (!inquiry) {
      throw new Error('Inquiry not found');
    }
    if (inquiry.isSubmitted) return true;

    const submittedInquiry = ensureInquiryAssignment(hydrateInquiryRecord({
      ...inquiry,
      isSubmitted: true,
      status: 'pending' as const,
      submittedAt: Date.now(),
    }));

    try {
      const result = await inquiryService.updateStatus(id, 'pending', {
        is_submitted: true,
        submitted_at: new Date(submittedInquiry.submittedAt || Date.now()).toISOString(),
        assigned_to: submittedInquiry.assignedTo || submittedInquiry.salesRepEmail || null,
      });
      if (!result) {
        console.error('❌ [submitInquiry] Supabase updateStatus failed for:', id);
        throw new Error('Failed to submit inquiry to database');
      }

      const hydratedResult = hydrateInquiryRecord(result as Inquiry);
      setVisibleInquiries(inquiries.map(inq => inq.id === id ? hydratedResult : inq));
      enqueueInquiryProductMappings(hydratedResult);

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
