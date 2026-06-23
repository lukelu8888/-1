/**
 * ProductCenterContext — single Zustand-like store implemented with React state.
 * ------------------------------------------------------------------------------
 * Why one big context:
 *   - Phase 1 must work end-to-end (list → detail → publish/pause/archive)
 *     without committing to a backend. Scoping every entity to its own
 *     context would just create cross-cutting plumbing for no benefit.
 *   - We only re-render consumers that read with the `useProductCenter`
 *     selector hook, which extracts a slice of state via `useMemo`.
 *
 * Phase 4 migration plan:
 *   1. Replace `mockData` with thunks that call Supabase RPCs.
 *   2. Keep all mutations going through this dispatch surface so pages
 *      don't need rewrites.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { toast } from 'sonner';

import type {
  Campaign,
  CampaignProduct,
  Customer,
  CustomerSpecificPrice,
  CustomerTier,
  EffectiveCustomerPriceResult,
  EffectiveTierPriceResult,
  ModelMapping,
  Product,
  ProductAttribute,
  ProductAttributeValue,
  ProductAuditLog,
  ProductCategory,
  ProductCategoryRelation,
  ProductDocument,
  ProductListFilters,
  ProductListRow,
  ProductMedia,
  ProductPriceHistory,
  ProductPublishChannel,
  ProductPublishLog,
  ProductRegionPrice,
  ProductSupplierLink,
  ProductTierPrice,
  PublishStatus,
  RegionCode,
  ReviewHistoryEntry,
  ReviewStatus,
  SupplierQuote,
  TierIssue,
} from './types';

import {
  mockAttributeValues,
  mockAttributes,
  mockAuditLogs,
  mockCampaignProducts,
  mockCampaigns,
  mockCategories,
  mockCategoryRelations,
  mockDocuments,
  mockMedia,
  mockModelMappings,
  mockPriceHistory,
  mockProducts,
  mockPublishChannels,
  mockPublishLogs,
  mockRegionPrices,
  mockReviewHistory,
  mockSupplierLinks,
  mockSupplierQuotes,
  mockTierPrices,
  mockCustomerTiers,
  mockCustomers,
  mockCustomerSpecificPrices,
} from './mockData';

import {
  PRODUCT_CENTER_BACKEND,
  computeTierIssues,
  getProductCenterService,
  type BulkImportError,
  type BulkImportResult,
  type BulkImportRow,
  type QuotationLineInput,
  type QuotationLineResolved,
} from '../services/productCenterService';

// ─── Role / identity model (Phase 3) ────────────────────────────────────────
//
// The review workflow is role-gated. We keep a tiny identity in store rather
// than wiring real auth so everything stays decoupled from Phase 4.

export type UserRole = 'editor' | 'reviewer' | 'admin';

export interface CurrentUser {
  id: string;
  name: string;
  role: UserRole;
}

const DEFAULT_USER: CurrentUser = {
  id: 'u_self',
  name: '运营 Lina',
  role: 'admin', // admin to keep dev unblocked; switchable via UI
};

export const ROLE_LABELS: Record<UserRole, string> = {
  editor: '编辑',
  reviewer: '审核员',
  admin: '管理员',
};

/** Roles that can approve/reject products. */
const REVIEW_PRIVILEGED: UserRole[] = ['reviewer', 'admin'];

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const isUuid = (value: string) => UUID_PATTERN.test(value);

const createPersistentId = () => crypto.randomUUID();

interface State {
  products: Product[];
  categories: ProductCategory[];
  categoryRelations: ProductCategoryRelation[];
  attributes: ProductAttribute[];
  attributeValues: ProductAttributeValue[];
  media: ProductMedia[];
  documents: ProductDocument[];
  supplierLinks: ProductSupplierLink[];
  regionPrices: ProductRegionPrice[];
  /** Phase 5b — B2B 阶梯报价 */
  tierPrices: ProductTierPrice[];
  /** Phase 5c — 客户分层 / 专属价 */
  customerTiers: CustomerTier[];
  customers: Customer[];
  customerSpecificPrices: CustomerSpecificPrice[];
  publishChannels: ProductPublishChannel[];
  publishLogs: ProductPublishLog[];
  campaigns: Campaign[];
  campaignProducts: CampaignProduct[];
  modelMappings: ModelMapping[];
  auditLogs: ProductAuditLog[];

  // Phase 3 entities
  priceHistory: ProductPriceHistory[];
  supplierQuotes: SupplierQuote[];
  reviewHistory: ReviewHistoryEntry[];
  currentUser: CurrentUser;

  // UI state
  activeRegion: RegionCode;
  filters: ProductListFilters;
  selectedProductIds: string[];
}

interface Actions {
  // region
  setActiveRegion: (region: RegionCode) => void;

  // filters & selection
  setFilters: (next: ProductListFilters) => void;
  resetFilters: () => void;
  toggleSelected: (id: string) => void;
  setSelected: (ids: string[]) => void;
  clearSelected: () => void;

  // product CRUD
  upsertProduct: (input: Product) => void;
  removeProduct: (id: string) => void;

  // status mutations (single + bulk)
  publishProduct: (productId: string, region: RegionCode) => void;
  pauseProduct: (productId: string, region: RegionCode) => void;
  unpublishProduct: (productId: string, region: RegionCode, reason?: string) => void;
  archiveProduct: (productId: string) => void;
  reactivateProduct: (productId: string) => void;
  bulkPublish: (region: RegionCode) => void;
  bulkPause: (region: RegionCode) => void;
  bulkArchive: () => void;
  bulkSetCategory: (categoryId: string) => void;
  bulkSetTag: (tag: string) => void;

  // review (role-gated)
  submitForReview: (productId: string, note?: string) => void;
  approveProduct: (productId: string, note?: string) => void;
  rejectProduct: (productId: string, reason: string) => void;
  /** Send a previously-submitted product back to draft (only privileged roles). */
  returnToDraft: (productId: string, reason: string) => void;
  /** Bulk approve from the review queue. */
  bulkApprove: (ids: string[], note?: string) => number;
  /** Whether the current user can act on review transitions. */
  canReview: () => boolean;
  /** Switch identity (mock; in real app comes from auth). */
  setCurrentUser: (user: CurrentUser) => void;

  // pricing
  updateRegionPrice: (price: ProductRegionPrice, opts?: { reason?: string }) => void;
  /**
   * Bulk-update region prices. `mode` 'absolute' replaces, 'percent' adjusts
   * by the given percentage (e.g. -10 = drop 10%).
   */
  bulkUpdatePrices: (params: {
    productIds: string[];
    region: RegionCode;
    field: 'basePrice' | 'salePrice' | 'campaignPrice';
    mode: 'absolute' | 'percent';
    value: number;
    reason?: string;
  }) => number;

  // bulk import (Phase 4e)
  /**
   * Validates and applies a CSV-style row set. In supabase mode the
   * service RPC owns validation and persistence, then we refetch; in mock
   * mode we apply the rows to local state in-place and return the same
   * `{ created, updated, errors }` shape.
   */
  bulkUpsertProducts: (rows: BulkImportRow[]) => Promise<BulkImportResult>;
  /** Re-pulls a fresh snapshot from the backend (no-op in mock mode). */
  refreshAll: () => Promise<void>;

  // pricing history (Phase 3)
  recordPriceChange: (entry: Omit<ProductPriceHistory, 'id' | 'changedAt'>) => void;

  // supplier quotes (Phase 3)
  addSupplierQuote: (quote: Omit<SupplierQuote, 'id' | 'createdAt' | 'isCurrent'>) => SupplierQuote;
  updateSupplierQuote: (id: string, patch: Partial<SupplierQuote>) => void;
  /** Marks a quote as the current valid one and supersedes the others for that supplier+product. */
  setCurrentSupplierQuote: (id: string) => void;
  removeSupplierQuote: (id: string) => void;

  // publishing channels (Phase 2 — persisted toggles + SEO)
  upsertPublishChannel: (channel: ProductPublishChannel) => void;
  patchPublishChannel: (
    productId: string,
    region: RegionCode,
    patch: Partial<Omit<ProductPublishChannel, 'id' | 'productId' | 'regionCode' | 'channel'>>,
  ) => ProductPublishChannel;

  // attributes (Phase 2)
  upsertAttributeValue: (input: ProductAttributeValue) => void;
  removeAttributeValue: (id: string) => void;

  // campaign membership (Phase 2)
  addProductsToCampaign: (campaignId: string, productIds: string[], opts?: { discountPercent?: number }) => void;
  removeProductFromCampaign: (campaignId: string, productId: string) => void;
  updateCampaignProduct: (input: CampaignProduct) => void;

  // audit (Phase 2)
  logAudit: (entry: Omit<ProductAuditLog, 'id' | 'occurredAt'>) => void;

  // tier prices (Phase 5b — B2B 阶梯报价)
  upsertTierPrice: (input: ProductTierPrice) => void;
  removeTierPrice: (id: string) => void;
  /** Async — calls the service (mock or RPC) to resolve effective unit price by qty. */
  getEffectiveTierPrice: (opts: {
    productId: string;
    region: RegionCode;
    qty: number;
    asOfDate?: string;
  }) => Promise<EffectiveTierPriceResult>;

  // Phase 5d — quotation bridge
  /** Batch-resolve prices for quotation lines via the three-layer stack. */
  resolveQuotationLinePrices: (
    lines: QuotationLineInput[],
  ) => Promise<QuotationLineResolved[]>;

  // customer pricing (Phase 5c — 三层叠加)
  upsertCustomerSpecificPrice: (input: CustomerSpecificPrice) => void;
  removeCustomerSpecificPrice: (id: string) => void;
  /** Async — three-layer price selection (specific > tier+discount > base+discount). */
  getEffectiveCustomerPrice: (opts: {
    productId: string;
    region: RegionCode;
    qty: number;
    customerId: string | null;
    asOfDate?: string;
  }) => Promise<EffectiveCustomerPriceResult>;

  // media
  addMedia: (media: ProductMedia) => void;
  removeMedia: (id: string) => void;
  /**
   * Phase 5a — upload + register a media file in one shot.
   * Mock backend: synthesises a `blob:` URL kept for the session.
   * Supabase backend: uploads to the `product-media` bucket then inserts
   * the row server-side. Returns the new media row so the caller can
   * surface a thumbnail immediately.
   */
  attachMedia: (input: {
    productId: string;
    kind: ProductMedia['kind'];
    file: File;
    altText?: string;
    sortOrder?: number;
  }) => Promise<ProductMedia>;

  // categories
  upsertCategory: (cat: ProductCategory) => void;
  saveCategory: (cat: ProductCategory) => Promise<ProductCategory>;
  removeCategory: (id: string) => void;
  upsertAttribute: (attr: ProductAttribute) => void;
  removeAttribute: (id: string) => void;

  // campaigns
  upsertCampaign: (cmp: Campaign) => void;
  setCampaignStatus: (id: string, status: Campaign['status']) => void;

  // mapping
  upsertMapping: (m: ModelMapping) => void;
  removeMapping: (id: string) => void;
}

interface Selectors {
  getProductById: (id: string) => Product | undefined;
  getCategoryById: (id?: string | null) => ProductCategory | undefined;
  getMediaForProduct: (id: string) => ProductMedia[];
  getDocumentsForProduct: (id: string) => ProductDocument[];
  getSupplierLinksForProduct: (id: string) => ProductSupplierLink[];
  getRegionPricesForProduct: (id: string) => ProductRegionPrice[];
  /** Phase 5b — all tier-price rows for a product (optionally scoped to region). */
  getTierPricesForProduct: (id: string, region?: RegionCode) => ProductTierPrice[];
  /** Phase 5b — synchronous in-memory consistency check (UI uses this on save). */
  validateTierPrices: (productId: string, region: RegionCode) => TierIssue[];

  /** Phase 5c — list customer-specific prices for a product (optional region filter). */
  getCustomerSpecificPricesForProduct: (
    productId: string,
    region?: RegionCode,
  ) => CustomerSpecificPrice[];
  /** Phase 5c — list specific prices for a customer (across products). */
  getCustomerSpecificPricesForCustomer: (customerId: string) => CustomerSpecificPrice[];
  /** Phase 5c — list active customers (optional region filter). */
  listCustomers: (opts?: { region?: RegionCode; activeOnly?: boolean }) => Customer[];
  /** Phase 5c — list active customer tiers. */
  listCustomerTiers: () => CustomerTier[];
  /** Phase 5c — convenience lookup. */
  getCustomerById: (id: string | null | undefined) => Customer | undefined;
  getCustomerTierById: (id: string | null | undefined) => CustomerTier | undefined;
  getPublishChannelsForProduct: (id: string) => ProductPublishChannel[];
  getAttributeValuesForProduct: (id: string) => ProductAttributeValue[];
  getAuditLogsForProduct: (id: string) => ProductAuditLog[];
  getMappingsForProduct: (id: string) => ModelMapping[];
  getCampaignsForProduct: (id: string) => Campaign[];
  getPriceHistoryForProduct: (id: string) => ProductPriceHistory[];
  getSupplierQuotesForProduct: (id: string) => SupplierQuote[];
  getReviewHistoryForProduct: (id: string) => ReviewHistoryEntry[];
  /** Returns the missing-field flags used by review center & badges. */
  getMissingFlags: (id: string) => string[];

  /**
   * Build ERP-grade list rows: applies filters, joins prices and publish
   * status, and hydrates flags (missing image / category / price).
   */
  buildListRows: () => ProductListRow[];
  getFilteredCount: () => number;
  getStats: () => {
    total: number;
    active: number;
    drafts: number;
    pendingReview: number;
    publishedAny: number;
    missingImage: number;
    missingPrice: number;
    missingCategory: number;
  };
}

type Ctx = State & Actions & Selectors;

const ProductCenterCtx = createContext<Ctx | null>(null);

const newId = (prefix: string) =>
  `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

const nowIso = () => new Date().toISOString();

export function ProductCenterProvider({ children }: { children: ReactNode }) {
  // — entities —
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [categories, setCategories] = useState<ProductCategory[]>(mockCategories);
  const [categoryRelations, setCategoryRelations] = useState<ProductCategoryRelation[]>(mockCategoryRelations);
  const [attributes, setAttributes] = useState<ProductAttribute[]>(mockAttributes);
  const [attributeValues, setAttributeValues] = useState<ProductAttributeValue[]>(mockAttributeValues);
  const [media, setMedia] = useState<ProductMedia[]>(mockMedia);
  const [documents] = useState<ProductDocument[]>(mockDocuments);
  const [supplierLinks] = useState<ProductSupplierLink[]>(mockSupplierLinks);
  const [regionPrices, setRegionPrices] = useState<ProductRegionPrice[]>(mockRegionPrices);
  const [tierPrices, setTierPrices] = useState<ProductTierPrice[]>(mockTierPrices);
  const [customerTiers, setCustomerTiers] = useState<CustomerTier[]>(mockCustomerTiers);
  const [customers, setCustomers] = useState<Customer[]>(mockCustomers);
  const [customerSpecificPrices, setCustomerSpecificPrices] = useState<CustomerSpecificPrice[]>(
    mockCustomerSpecificPrices,
  );
  const [publishChannels, setPublishChannels] = useState<ProductPublishChannel[]>(mockPublishChannels);
  const [publishLogs, setPublishLogs] = useState<ProductPublishLog[]>(mockPublishLogs);
  const [campaigns, setCampaigns] = useState<Campaign[]>(mockCampaigns);
  const [campaignProducts, setCampaignProducts] = useState<CampaignProduct[]>(mockCampaignProducts);
  const [modelMappings, setModelMappings] = useState<ModelMapping[]>(mockModelMappings);
  const [auditLogs, setAuditLogs] = useState<ProductAuditLog[]>(mockAuditLogs);

  // Phase 3
  const [priceHistory, setPriceHistory] = useState<ProductPriceHistory[]>(mockPriceHistory);
  const [supplierQuotes, setSupplierQuotes] = useState<SupplierQuote[]>(mockSupplierQuotes);
  const [reviewHistory, setReviewHistory] = useState<ReviewHistoryEntry[]>(mockReviewHistory);
  const [currentUser, setCurrentUser] = useState<CurrentUser>(DEFAULT_USER);

  // — UI state —
  const [activeRegion, setActiveRegion] = useState<RegionCode>('NA');
  const [filters, setFiltersRaw] = useState<ProductListFilters>({ region: 'ALL' });
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  // ── Phase 4c: backend wiring ──────────────────────────────────────────────
  //
  // The store keeps the same React-state shape, but in `supabase` mode each
  // mutation also fires an async write through the service layer (with a
  // toast on failure). On mount we replace the seeded mock state with a
  // fresh `loadAll()` snapshot so the UI is consistent with the database.
  // `usingSupabase` is computed once at module load — switching backend
  // requires a page refresh.

  const usingSupabase = PRODUCT_CENTER_BACKEND === 'supabase';
  const serviceRef = useRef(getProductCenterService());
  const [bootstrapLoading, setBootstrapLoading] = useState<boolean>(usingSupabase);
  const [supabaseOfflineReason, setSupabaseOfflineReason] = useState<string | null>(null);
  const effectiveSupabase = usingSupabase && !supabaseOfflineReason;

  /**
   * Re-pulls a tenant-scoped snapshot from the service and replaces every
   * entity slice. Used both at mount and after bulk operations (e.g. CSV
   * import) where a partial diff is harder than a full refetch. No-op in
   * mock mode where the in-memory state is already authoritative.
   */
  const refreshAll = useCallback(async (): Promise<void> => {
    if (!effectiveSupabase) return;
    const svc = serviceRef.current;
    if (!svc.loadAll) return;
    const snap = await svc.loadAll();
    setProducts(snap.products);
    setCategories(snap.categories);
    setAttributes(snap.attributes);
    setAttributeValues(snap.attributeValues);
    setMedia(snap.media);
    setRegionPrices(snap.regionPrices);
    setTierPrices(snap.tierPrices);
    setCustomerTiers(snap.customerTiers);
    setCustomers(snap.customers);
    setCustomerSpecificPrices(snap.customerSpecificPrices);
    setPublishChannels(snap.publishChannels);
    setCampaigns(snap.campaigns);
    setCampaignProducts(snap.campaignProducts);
    setModelMappings(snap.mappings);
    setAuditLogs(snap.auditLogs);
    setPriceHistory(snap.priceHistory);
    setSupplierQuotes(snap.supplierQuotes);
    setReviewHistory(snap.reviewHistory);
  }, [effectiveSupabase]);

  useEffect(() => {
    if (!usingSupabase) return;
    let cancelled = false;
    if (!serviceRef.current.loadAll) {
      setBootstrapLoading(false);
      return;
    }
    refreshAll()
      .then(() => {
        if (!cancelled) setBootstrapLoading(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const msg = (err as Error)?.message ?? 'unknown error';
        // eslint-disable-next-line no-console
        console.error('[product-center] loadAll failed', err);
        setSupabaseOfflineReason(msg);
        setBootstrapLoading(false);
        toast.error('Supabase 暂不可用，已切换为本地预览模式。详情见页面顶部提示。');
      });
    return () => {
      cancelled = true;
    };
  }, [refreshAll, usingSupabase]);

  /**
   * Fire a write through the service layer in supabase mode, no-op in mock
   * mode. We deliberately do NOT await this from the mutation callbacks —
   * the React state update is the source of truth for the UI; the service
   * call is the durable persistence step. If it fails we surface a toast
   * but DO NOT roll back local state, because doing so for every mutation
   * would require keeping snapshots and is rarely the desired UX (users
   * usually want to keep typing and retry).
   */
  const persist = useCallback(
    <T,>(label: string, fn: () => Promise<T>): void => {
      if (!usingSupabase) return;
      if (!effectiveSupabase) return;
      void fn().catch((err: unknown) => {
        const msg = (err as Error)?.message ?? 'unknown error';
        // eslint-disable-next-line no-console
        console.error(`[product-center] persist ${label}`, err);
        toast.error(`${label} 同步失败：${msg}`);
      });
    },
    [effectiveSupabase, usingSupabase],
  );

  // ── helpers ────────────────────────────────────────────────────────────────

  const appendAudit = useCallback(
    (entry: Omit<ProductAuditLog, 'id' | 'occurredAt'>) => {
      setAuditLogs((prev) => [
        ...prev,
        { ...entry, id: newId('al'), occurredAt: nowIso() },
      ]);
    },
    [],
  );

  const ensureChannel = useCallback(
    (productId: string, region: RegionCode): ProductPublishChannel => {
      const existing = publishChannels.find(
        (c) => c.productId === productId && c.regionCode === region,
      );
      if (existing) return existing;
      const created: ProductPublishChannel = {
        id: newId('pc'),
        productId,
        regionCode: region,
        channel: 'website',
        publishStatus: 'not_published',
        homepageFeatured: false,
        categoryFeatured: false,
        sortWeight: 100,
        showPriceOnFrontend: true,
        allowInquiry: true,
        showMoq: true,
        showLeadTime: true,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      setPublishChannels((prev) => [...prev, created]);
      return created;
    },
    [publishChannels],
  );

  const setChannelStatus = useCallback(
    (
      productId: string,
      region: RegionCode,
      next: PublishStatus,
      extra?: Partial<ProductPublishChannel>,
    ) => {
      let from: PublishStatus = 'not_published';
      setPublishChannels((prev) => {
        let touched = false;
        const updated = prev.map((c) => {
          if (c.productId === productId && c.regionCode === region) {
            from = c.publishStatus;
            touched = true;
            return {
              ...c,
              publishStatus: next,
              updatedAt: nowIso(),
              publishedAt: next === 'published' ? nowIso() : c.publishedAt,
              pausedAt: next === 'paused' ? nowIso() : c.pausedAt,
              unpublishedAt: next === 'unpublished' ? nowIso() : c.unpublishedAt,
              ...extra,
            };
          }
          return c;
        });
        if (!touched) {
          updated.push({
            id: newId('pc'),
            productId,
            regionCode: region,
            channel: 'website',
            publishStatus: next,
            homepageFeatured: false,
            categoryFeatured: false,
            sortWeight: 100,
            showPriceOnFrontend: true,
            allowInquiry: true,
            showMoq: true,
            showLeadTime: true,
            createdAt: nowIso(),
            updatedAt: nowIso(),
            publishedAt: next === 'published' ? nowIso() : undefined,
            pausedAt: next === 'paused' ? nowIso() : undefined,
            unpublishedAt: next === 'unpublished' ? nowIso() : undefined,
            ...extra,
          });
        }
        return updated;
      });
      setPublishLogs((prev) => [
        ...prev,
        {
          id: newId('pl'),
          productId,
          regionCode: region,
          channel: 'website',
          fromStatus: from,
          toStatus: next,
          actorName: 'You',
          occurredAt: nowIso(),
        },
      ]);
      appendAudit({
        productId,
        action: `publish.${next}`,
        field: `region:${region}`,
        fromValue: from,
        toValue: next,
        actorName: 'You',
      });
      persist(`发布状态 → ${next}`, () =>
        serviceRef.current.patchPublishChannel(productId, region, {
          publishStatus: next,
          ...extra,
        }),
      );
    },
    [appendAudit, persist],
  );

  // ── actions ────────────────────────────────────────────────────────────────

  const setFilters = useCallback((next: ProductListFilters) => setFiltersRaw(next), []);
  const resetFilters = useCallback(() => setFiltersRaw({ region: 'ALL' }), []);
  const toggleSelected = useCallback((id: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }, []);
  const setSelected = useCallback((ids: string[]) => setSelectedProductIds(ids), []);
  const clearSelected = useCallback(() => setSelectedProductIds([]), []);

  const upsertProduct = useCallback(
    (input: Product) => {
      const stamped: Product = { ...input, updatedAt: nowIso() };
      setProducts((prev) => {
        const idx = prev.findIndex((p) => p.id === input.id);
        if (idx === -1) {
          return [...prev, { ...stamped, createdAt: stamped.createdAt ?? nowIso() }];
        }
        const next = [...prev];
        next[idx] = stamped;
        return next;
      });
      persist('保存产品', () => serviceRef.current.upsertProduct(stamped));
    },
    [persist],
  );

  const removeProduct = useCallback(
    (id: string) => {
      setProducts((prev) => prev.filter((p) => p.id !== id));
      persist('删除产品', () => serviceRef.current.removeProduct(id));
    },
    [persist],
  );

  const publishProduct = useCallback(
    (id: string, region: RegionCode) => {
      ensureChannel(id, region);
      setChannelStatus(id, region, 'published');
    },
    [ensureChannel, setChannelStatus],
  );

  const pauseProduct = useCallback(
    (id: string, region: RegionCode) => setChannelStatus(id, region, 'paused'),
    [setChannelStatus],
  );

  const unpublishProduct = useCallback(
    (id: string, region: RegionCode, reason?: string) =>
      setChannelStatus(id, region, 'unpublished', { unpublishReason: reason }),
    [setChannelStatus],
  );

  const archiveProduct = useCallback(
    (id: string) => {
      setProducts((prev) =>
        prev.map((p) =>
          p.id === id
            ? { ...p, status: 'archived', archivedAt: nowIso(), updatedAt: nowIso() }
            : p,
        ),
      );
      setPublishChannels((prev) =>
        prev.map((c) =>
          c.productId === id
            ? { ...c, publishStatus: 'archived', updatedAt: nowIso() }
            : c,
        ),
      );
      appendAudit({ productId: id, action: 'archive', actorName: 'You' });
      persist('归档产品', () => serviceRef.current.archiveProduct(id));
    },
    [appendAudit, persist],
  );

  const reactivateProduct = useCallback(
    (id: string) => {
      setProducts((prev) =>
        prev.map((p) =>
          p.id === id
            ? { ...p, status: 'active', archivedAt: null, updatedAt: nowIso() }
            : p,
        ),
      );
      appendAudit({ productId: id, action: 'reactivate', actorName: 'You' });
    },
    [appendAudit],
  );

  const bulkPublish = useCallback(
    (region: RegionCode) => {
      selectedProductIds.forEach((id) => {
        ensureChannel(id, region);
        setChannelStatus(id, region, 'published');
      });
    },
    [ensureChannel, selectedProductIds, setChannelStatus],
  );

  const bulkPause = useCallback(
    (region: RegionCode) => {
      selectedProductIds.forEach((id) => setChannelStatus(id, region, 'paused'));
    },
    [selectedProductIds, setChannelStatus],
  );

  const bulkArchive = useCallback(() => {
    selectedProductIds.forEach((id) => archiveProduct(id));
    setSelectedProductIds([]);
  }, [archiveProduct, selectedProductIds]);

  const bulkSetCategory = useCallback(
    (categoryId: string) => {
      setProducts((prev) =>
        prev.map((p) =>
          selectedProductIds.includes(p.id)
            ? { ...p, primaryCategoryId: categoryId, updatedAt: nowIso() }
            : p,
        ),
      );
      setCategoryRelations((prev) => {
        const existingIds = new Set(prev.filter((r) => r.isPrimary).map((r) => r.productId));
        const ts = nowIso();
        const newRelations: ProductCategoryRelation[] = selectedProductIds
          .filter((pid) => !existingIds.has(pid))
          .map((pid) => ({
            id: newId('pcr'),
            productId: pid,
            categoryId,
            isPrimary: true,
            createdAt: ts,
          }));
        return [
          ...prev.map((r) =>
            selectedProductIds.includes(r.productId) && r.isPrimary
              ? { ...r, categoryId }
              : r,
          ),
          ...newRelations,
        ];
      });
    },
    [selectedProductIds],
  );

  const bulkSetTag = useCallback(
    (tag: string) => {
      setProducts((prev) =>
        prev.map((p) =>
          selectedProductIds.includes(p.id)
            ? {
                ...p,
                tags: Array.from(new Set([...(p.tags ?? []), tag])),
                updatedAt: nowIso(),
              }
            : p,
        ),
      );
    },
    [selectedProductIds],
  );

  const computeMissingFlags = useCallback(
    (id: string): string[] => {
      const product = products.find((p) => p.id === id);
      if (!product) return [];
      const flags: string[] = [];
      const productMedia = media.filter((m) => m.productId === id);
      const hasMain = productMedia.some((m) => m.kind === 'main' && m.url);
      if (!hasMain && !product.thumbnailUrl) flags.push('missingImage');
      if (!product.primaryCategoryId) flags.push('missingCategory');
      const prices = regionPrices.filter((rp) => rp.productId === id);
      if (
        prices.length === 0 ||
        !prices.some((p) => (p.salePrice ?? p.basePrice) > 0)
      ) {
        flags.push('missingPrice');
      }
      const channels = publishChannels.filter((c) => c.productId === id);
      const seoOk = channels.some((c) => c.seoTitle && c.seoDescription && c.seoSlug);
      if (!seoOk) flags.push('missingSeo');
      const supplier = supplierLinks.find((sl) => sl.productId === id && sl.isPrimary);
      if (!supplier) flags.push('missingSupplier');
      return flags;
    },
    [products, media, regionPrices, publishChannels, supplierLinks],
  );

  const setReviewStatus = useCallback(
    (id: string, status: ReviewStatus, opts?: { reason?: string; note?: string }) => {
      let from: ReviewStatus = 'not_submitted';
      setProducts((prev) =>
        prev.map((p) => {
          if (p.id !== id) return p;
          from = p.reviewStatus;
          return { ...p, reviewStatus: status, updatedAt: nowIso() };
        }),
      );
      const missing = status === 'pending_review' ? computeMissingFlags(id) : undefined;
      setReviewHistory((prev) => [
        ...prev,
        {
          id: newId('rh'),
          productId: id,
          fromStatus: from,
          toStatus: status,
          reason: opts?.reason ?? opts?.note,
          actorName: currentUser.name,
          actorRole: currentUser.role,
          missingFlags: missing,
          occurredAt: nowIso(),
        },
      ]);
      appendAudit({
        productId: id,
        action: `review.${status}`,
        field: 'review_status',
        fromValue: from,
        toValue: status,
        actorName: currentUser.name,
        note: opts?.reason ?? opts?.note,
      });
      // route through RPC: each transition is its own service method so the
      // server can enforce permissions and atomically write history.
      const note = opts?.note ?? opts?.reason;
      const reason = opts?.reason ?? '';
      switch (status) {
        case 'pending_review':
          persist('提交审核', () => serviceRef.current.submitForReview(id, note));
          break;
        case 'approved':
          persist('批准产品', () => serviceRef.current.approveProduct(id, note));
          break;
        case 'rejected':
          persist('驳回产品', () => serviceRef.current.rejectProduct(id, reason));
          break;
        case 'not_submitted':
          persist('退回草稿', () => serviceRef.current.returnToDraft(id, reason));
          break;
        default:
          break;
      }
    },
    [appendAudit, currentUser, computeMissingFlags, persist],
  );

  const canReview = useCallback(
    () => REVIEW_PRIVILEGED.includes(currentUser.role),
    [currentUser.role],
  );

  const submitForReview = useCallback(
    (id: string, note?: string) => setReviewStatus(id, 'pending_review', { note }),
    [setReviewStatus],
  );

  const approveProduct = useCallback(
    (id: string, note?: string) => {
      if (!REVIEW_PRIVILEGED.includes(currentUser.role)) {
        throw new Error('当前角色无审核权限');
      }
      setReviewStatus(id, 'approved', { note });
    },
    [currentUser.role, setReviewStatus],
  );

  const rejectProduct = useCallback(
    (id: string, reason: string) => {
      if (!REVIEW_PRIVILEGED.includes(currentUser.role)) {
        throw new Error('当前角色无审核权限');
      }
      setReviewStatus(id, 'rejected', { reason });
    },
    [currentUser.role, setReviewStatus],
  );

  const returnToDraft = useCallback(
    (id: string, reason: string) => {
      if (!REVIEW_PRIVILEGED.includes(currentUser.role)) {
        throw new Error('当前角色无权退回');
      }
      setReviewStatus(id, 'not_submitted', { reason });
    },
    [currentUser.role, setReviewStatus],
  );

  const bulkApprove = useCallback(
    (ids: string[], note?: string) => {
      if (!REVIEW_PRIVILEGED.includes(currentUser.role)) {
        throw new Error('当前角色无审核权限');
      }
      ids.forEach((id) => setReviewStatus(id, 'approved', { note }));
      return ids.length;
    },
    [currentUser.role, setReviewStatus],
  );

  /** Append a row to `price_history`. Internal helper. */
  const pushPriceHistory = useCallback(
    (entry: Omit<ProductPriceHistory, 'id' | 'changedAt'>) => {
      setPriceHistory((prev) => [
        ...prev,
        { ...entry, id: newId('ph'), changedAt: nowIso() },
      ]);
    },
    [],
  );

  const recordPriceChange = useCallback(
    (entry: Omit<ProductPriceHistory, 'id' | 'changedAt'>) => {
      pushPriceHistory(entry);
      persist('价格历史', () => serviceRef.current.appendPriceHistory(entry));
    },
    [persist, pushPriceHistory],
  );

  const updateRegionPrice = useCallback(
    (price: ProductRegionPrice, opts?: { reason?: string }) => {
      persist('保存区域价格', () =>
        serviceRef.current.upsertRegionPrice(price, opts),
      );
      setRegionPrices((prev) => {
        const idx = prev.findIndex(
          (r) => r.productId === price.productId && r.regionCode === price.regionCode,
        );
        const stamped = { ...price, updatedAt: nowIso() };
        // diff against previous to push history rows for any changed field
        const before = idx === -1 ? null : prev[idx];
        if (before) {
          const fields: Array<{ k: 'basePrice' | 'salePrice' | 'campaignPrice'; tag: 'base' | 'sale' | 'campaign' }> = [
            { k: 'basePrice', tag: 'base' },
            { k: 'salePrice', tag: 'sale' },
            { k: 'campaignPrice', tag: 'campaign' },
          ];
          fields.forEach(({ k, tag }) => {
            const a = (before[k] ?? null) as number | null;
            const b = (price[k] ?? null) as number | null;
            if (a !== b) {
              pushPriceHistory({
                productId: price.productId,
                regionCode: price.regionCode,
                field: tag,
                fromValue: a,
                toValue: b,
                changedBy: currentUser.name,
                reason: opts?.reason,
                effectiveFrom: price.effectiveFrom ?? null,
                effectiveTo: price.effectiveTo ?? null,
              });
            }
          });
        } else {
          // initial create — record at minimum the base/sale numbers
          if (price.basePrice != null) {
            pushPriceHistory({
              productId: price.productId,
              regionCode: price.regionCode,
              field: 'base',
              fromValue: null,
              toValue: price.basePrice,
              changedBy: currentUser.name,
              reason: opts?.reason ?? '首次定价',
              effectiveFrom: price.effectiveFrom ?? null,
              effectiveTo: price.effectiveTo ?? null,
            });
          }
          if (price.salePrice != null) {
            pushPriceHistory({
              productId: price.productId,
              regionCode: price.regionCode,
              field: 'sale',
              fromValue: null,
              toValue: price.salePrice,
              changedBy: currentUser.name,
              reason: opts?.reason ?? '首次定价',
              effectiveFrom: price.effectiveFrom ?? null,
              effectiveTo: price.effectiveTo ?? null,
            });
          }
        }
        if (idx === -1) return [...prev, { ...stamped, createdAt: nowIso() }];
        const next = [...prev];
        next[idx] = stamped;
        return next;
      });
    },
    [currentUser.name, persist, pushPriceHistory],
  );

  const bulkUpdatePrices = useCallback(
    (params: {
      productIds: string[];
      region: RegionCode;
      field: 'basePrice' | 'salePrice' | 'campaignPrice';
      mode: 'absolute' | 'percent';
      value: number;
      reason?: string;
    }) => {
      const { productIds, region, field, mode, value, reason } = params;
      const fieldTag: 'base' | 'sale' | 'campaign' =
        field === 'basePrice' ? 'base' : field === 'salePrice' ? 'sale' : 'campaign';
      let touched = 0;
      // route to the RPC; the server returns the touched count which the
      // client doesn't currently surface (we trust optimistic local count).
      persist('批量改价', () => serviceRef.current.bulkUpdatePrices(params));
      setRegionPrices((prev) => {
        const next = prev.map((rp) => {
          if (!productIds.includes(rp.productId) || rp.regionCode !== region) return rp;
          const current = (rp[field] ?? rp.basePrice) as number | null | undefined;
          const before = current ?? 0;
          const after =
            mode === 'absolute'
              ? value
              : Math.max(0, Math.round(before * (1 + value / 100) * 100) / 100);
          touched += 1;
          appendAudit({
            productId: rp.productId,
            action: 'edit_price.bulk',
            field: `${field} (${region})`,
            fromValue: before == null ? '' : String(before),
            toValue: String(after),
            actorName: currentUser.name,
            note: reason,
          });
          pushPriceHistory({
            productId: rp.productId,
            regionCode: region,
            field: fieldTag,
            fromValue: before,
            toValue: after,
            changedBy: currentUser.name,
            reason: reason ?? `批量${mode === 'percent' ? `${value > 0 ? '+' : ''}${value}%` : `→${value}`}`,
          });
          return { ...rp, [field]: after, updatedAt: nowIso() };
        });
        const haveByKey = new Set(prev.map((rp) => `${rp.productId}_${rp.regionCode}`));
        const created: ProductRegionPrice[] = [];
        productIds.forEach((pid) => {
          if (haveByKey.has(`${pid}_${region}`)) return;
          if (mode !== 'absolute') return;
          touched += 1;
          appendAudit({
            productId: pid,
            action: 'edit_price.bulk',
            field: `${field} (${region}) [new]`,
            fromValue: '',
            toValue: String(value),
            actorName: currentUser.name,
            note: reason,
          });
          pushPriceHistory({
            productId: pid,
            regionCode: region,
            field: fieldTag,
            fromValue: null,
            toValue: value,
            changedBy: currentUser.name,
            reason: reason ?? '批量新增',
          });
          created.push({
            id: newId('prp'),
            productId: pid,
            regionCode: region,
            currency: region === 'EA' ? 'EUR' : 'USD',
            basePrice: field === 'basePrice' ? value : 0,
            salePrice: field === 'salePrice' ? value : undefined,
            campaignPrice: field === 'campaignPrice' ? value : null,
            isActive: true,
            createdAt: nowIso(),
            updatedAt: nowIso(),
          });
        });
        return [...next, ...created];
      });
      return touched;
    },
    [appendAudit, currentUser.name, persist, pushPriceHistory],
  );

  // ── bulk import (Phase 4e) ────────────────────────────────────────────────
  //
  // In supabase mode we delegate to the RPC and refetch; in mock mode we
  // own the validation/state-mutation locally so that the dialog behaves
  // identically across backends. Validation rules:
  //   - sku must be non-empty
  //   - if creating (sku not seen), name must be non-empty
  //   - if `primaryCategoryCode` is set, it must match an existing category
  //
  // Successful rows insert a new product (or update name/brand/etc on an
  // existing one) and, if `region` + `basePrice` are provided, upsert the
  // matching pc_product_region_prices row.

  const bulkUpsertProducts = useCallback(
    async (rows: BulkImportRow[]): Promise<BulkImportResult> => {
      if (effectiveSupabase) {
        const res = await serviceRef.current.bulkUpsertProducts(rows);
        try {
          await refreshAll();
        } catch (err: unknown) {
          // eslint-disable-next-line no-console
          console.error('[product-center] refresh after import failed', err);
        }
        return res;
      }

      // ── mock-mode application ────────────────────────────────────────────
      const errors: BulkImportError[] = [];
      let created = 0;
      let updated = 0;
      const ts = nowIso();
      const knownCodes = new Set(categories.map((c) => c.code));
      const skuToExisting = new Map(
        products.map((p) => [p.sku.toLowerCase(), p] as const),
      );

      // Build the diffs we'll apply in two batched setState calls.
      const productCreates: Product[] = [];
      const productPatches = new Map<string, Partial<Product>>();
      const priceUpserts: ProductRegionPrice[] = [];

      const num = (v: unknown): number | undefined => {
        if (v === '' || v == null) return undefined;
        const n = Number(v);
        return Number.isFinite(n) ? n : undefined;
      };
      const str = (v: unknown): string | undefined => {
        const s = String(v ?? '').trim();
        return s.length ? s : undefined;
      };

      rows.forEach((row, i) => {
        const idx = i + 1;
        const sku = str(row.sku);
        try {
          if (!sku) throw new Error('pc:missing-sku');
          if (row.primaryCategoryCode && !knownCodes.has(String(row.primaryCategoryCode))) {
            throw new Error(`pc:unknown-category-code:${row.primaryCategoryCode}`);
          }
          const existing = skuToExisting.get(sku.toLowerCase());
          const cat = row.primaryCategoryCode
            ? categories.find((c) => c.code === row.primaryCategoryCode) ?? null
            : null;

          if (existing) {
            const patch: Partial<Product> = { updatedAt: ts };
            if (str(row.name)) patch.name = str(row.name)!;
            if (str(row.nameEn)) patch.nameEn = str(row.nameEn);
            if (str(row.nameZh)) patch.nameZh = str(row.nameZh);
            if (str(row.brand)) patch.brand = str(row.brand);
            if (str(row.status)) patch.status = str(row.status) as Product['status'];
            if (str(row.reviewStatus))
              patch.reviewStatus = str(row.reviewStatus) as ReviewStatus;
            if (cat) patch.primaryCategoryId = cat.id;
            if (str(row.hsCode)) patch.hsCode = str(row.hsCode);
            const nMoq = num(row.moq);
            if (nMoq != null) patch.moq = nMoq;
            const nUpc = num(row.unitsPerCarton);
            if (nUpc != null) patch.unitsPerCarton = nUpc;
            const nLead = num(row.leadTimeDays);
            if (nLead != null) patch.leadTimeDays = nLead;
            productPatches.set(existing.id, patch);
            updated += 1;
          } else {
            const name = str(row.name);
            if (!name) throw new Error('pc:missing-name');
            productCreates.push({
              id: newId('p'),
              tenantId: 'tenant_default',
              sku,
              name,
              nameEn: str(row.nameEn),
              nameZh: str(row.nameZh),
              brand: str(row.brand),
              status: (str(row.status) as Product['status']) ?? 'draft',
              reviewStatus: (str(row.reviewStatus) as ReviewStatus) ?? 'not_submitted',
              campaignStatus: 'no_campaign',
              primaryCategoryId: cat?.id ?? null,
              hsCode: str(row.hsCode),
              moq: num(row.moq),
              unitsPerCarton: num(row.unitsPerCarton),
              leadTimeDays: num(row.leadTimeDays),
              createdAt: ts,
              updatedAt: ts,
            });
            created += 1;
          }

          // optional region price
          const region = str(row.region) as RegionCode | undefined;
          const basePrice = num(row.basePrice);
          if (region && basePrice != null) {
            const pid = existing?.id ?? productCreates[productCreates.length - 1].id;
            priceUpserts.push({
              id: newId('prp'),
              productId: pid,
              regionCode: region,
              currency: str(row.currency) ?? (region === 'EA' ? 'EUR' : 'USD'),
              basePrice,
              salePrice: num(row.salePrice),
              campaignPrice: num(row.campaignPrice),
              isActive: true,
              createdAt: ts,
              updatedAt: ts,
            });
          }
        } catch (err: unknown) {
          errors.push({
            index: idx,
            sku: sku || undefined,
            message: (err as Error).message,
          });
        }
      });

      // Apply all patches in two batched setStates.
      if (productPatches.size || productCreates.length) {
        setProducts((prev) => {
          const next = prev.map((p) => {
            const patch = productPatches.get(p.id);
            return patch ? { ...p, ...patch } : p;
          });
          return [...next, ...productCreates];
        });
      }
      if (priceUpserts.length) {
        setRegionPrices((prev) => {
          const byKey = new Map(
            prev.map((rp) => [`${rp.productId}_${rp.regionCode}`, rp] as const),
          );
          priceUpserts.forEach((np) => {
            byKey.set(`${np.productId}_${np.regionCode}`, np);
          });
          return Array.from(byKey.values());
        });
      }

      // Single audit row summarizing the batch.
      if (created || updated) {
        appendAudit({
          productId: '*',
          action: 'bulk_import',
          field: `+${created} ~${updated}`,
          actorName: currentUser.name,
          note:
            errors.length > 0
              ? `errors=${errors.length}`
              : undefined,
        });
      }

      return { created, updated, errors };
    },
    [appendAudit, categories, currentUser.name, effectiveSupabase, products, refreshAll],
  );

  // ── supplier quotes (Phase 3) ─────────────────────────────────────────────

  const addSupplierQuote = useCallback(
    (input: Omit<SupplierQuote, 'id' | 'createdAt' | 'isCurrent'>) => {
      const created: SupplierQuote = {
        ...input,
        id: newId('sq'),
        createdAt: nowIso(),
        isCurrent: true,
      };
      setSupplierQuotes((prev) => [
        // demote existing current quotes from this supplier+product
        ...prev.map((q) =>
          q.productId === input.productId && q.supplierId === input.supplierId
            ? { ...q, isCurrent: false, validUntil: q.validUntil ?? nowIso() }
            : q,
        ),
        created,
      ]);
      appendAudit({
        productId: input.productId,
        action: 'supplier_quote.add',
        field: `${input.supplierName} ${input.currency} ${input.quotedPrice}`,
        actorName: currentUser.name,
        note: input.notes,
      });
      persist('供应商报价', () => serviceRef.current.addSupplierQuote(input));
      return created;
    },
    [appendAudit, currentUser.name, persist],
  );

  const updateSupplierQuote = useCallback(
    (id: string, patch: Partial<SupplierQuote>) => {
      setSupplierQuotes((prev) => prev.map((q) => (q.id === id ? { ...q, ...patch } : q)));
    },
    [],
  );

  const setCurrentSupplierQuote = useCallback(
    (id: string) => {
      setSupplierQuotes((prev) => {
        const target = prev.find((q) => q.id === id);
        if (!target) return prev;
        return prev.map((q) => {
          if (q.productId !== target.productId || q.supplierId !== target.supplierId) return q;
          return { ...q, isCurrent: q.id === id };
        });
      });
      persist('当前报价', () => serviceRef.current.setCurrentSupplierQuote(id));
    },
    [persist],
  );

  const removeSupplierQuote = useCallback(
    (id: string) => {
      setSupplierQuotes((prev) => prev.filter((q) => q.id !== id));
      persist('删除报价', () => serviceRef.current.removeSupplierQuote(id));
    },
    [persist],
  );

  const upsertPublishChannel = useCallback(
    (channel: ProductPublishChannel) => {
      setPublishChannels((prev) => {
        const idx = prev.findIndex((c) => c.id === channel.id);
        const stamped = { ...channel, updatedAt: nowIso() };
        if (idx === -1) return [...prev, { ...stamped, createdAt: stamped.createdAt ?? nowIso() }];
        const next = [...prev];
        next[idx] = stamped;
        return next;
      });
      persist('保存发布渠道', () => serviceRef.current.upsertPublishChannel(channel));
    },
    [persist],
  );

  /**
   * Phase-2 helper: patch a publish channel by (productId, region).
   * Creates the row if it doesn't yet exist. Returns the resulting channel
   * synchronously so callers can chain.
   */
  const patchPublishChannel = useCallback(
    (
      productId: string,
      region: RegionCode,
      patch: Partial<Omit<ProductPublishChannel, 'id' | 'productId' | 'regionCode' | 'channel'>>,
    ): ProductPublishChannel => {
      let result: ProductPublishChannel | null = null;
      setPublishChannels((prev) => {
        const idx = prev.findIndex(
          (c) => c.productId === productId && c.regionCode === region,
        );
        if (idx === -1) {
          const created: ProductPublishChannel = {
            id: newId('pc'),
            productId,
            regionCode: region,
            channel: 'website',
            publishStatus: 'not_published',
            homepageFeatured: false,
            categoryFeatured: false,
            sortWeight: 100,
            showPriceOnFrontend: true,
            allowInquiry: true,
            showMoq: true,
            showLeadTime: true,
            createdAt: nowIso(),
            updatedAt: nowIso(),
            ...patch,
          };
          result = created;
          return [...prev, created];
        }
        const merged = { ...prev[idx], ...patch, updatedAt: nowIso() };
        result = merged;
        const next = [...prev];
        next[idx] = merged;
        return next;
      });
      // result is guaranteed non-null after the set call (sync in React)
      persist('更新发布渠道', () =>
        serviceRef.current.patchPublishChannel(productId, region, patch),
      );
      return result as unknown as ProductPublishChannel;
    },
    [persist],
  );

  const upsertAttributeValue = useCallback(
    (input: ProductAttributeValue) => {
      setAttributeValues((prev) => {
        const idx = prev.findIndex(
          (v) => v.productId === input.productId && v.attributeId === input.attributeId,
        );
        const stamped = { ...input, updatedAt: nowIso() };
        if (idx === -1) {
          return [...prev, { ...stamped, id: stamped.id || newId('av'), createdAt: nowIso() }];
        }
        const next = [...prev];
        next[idx] = { ...next[idx], ...stamped };
        return next;
      });
      persist('保存属性值', () => serviceRef.current.upsertAttributeValue(input));
    },
    [persist],
  );

  const removeAttributeValue = useCallback(
    (id: string) => {
      setAttributeValues((prev) => prev.filter((v) => v.id !== id));
      persist('删除属性值', () => serviceRef.current.removeAttributeValue(id));
    },
    [persist],
  );

  const addProductsToCampaign = useCallback(
    (
      campaignId: string,
      productIds: string[],
      opts?: { discountPercent?: number },
    ) => {
      persist('加入活动', () =>
        serviceRef.current.addProductsToCampaign(campaignId, productIds, opts),
      );
      setCampaignProducts((prev) => {
        const have = new Set(
          prev.filter((cp) => cp.campaignId === campaignId).map((cp) => cp.productId),
        );
        const additions: CampaignProduct[] = [];
        productIds.forEach((pid) => {
          if (have.has(pid)) return;
          // pick a sensible default campaign price: use NA salePrice or basePrice * (1 - discount/100)
          const ref =
            regionPrices.find((rp) => rp.productId === pid && rp.regionCode === 'NA') ??
            regionPrices.find((rp) => rp.productId === pid);
          const baseline = ref?.salePrice ?? ref?.basePrice ?? 0;
          const discount = opts?.discountPercent ?? 0;
          const price = Math.max(0, Math.round(baseline * (1 - discount / 100) * 100) / 100);
          additions.push({
            id: newId('cp'),
            campaignId,
            productId: pid,
            campaignPrice: price,
            currency: ref?.currency ?? 'USD',
            discountPercent: discount || undefined,
            createdAt: nowIso(),
          });
        });
        return [...prev, ...additions];
      });
      // also flip the rolled-up campaignStatus on those products
      setProducts((prev) =>
        prev.map((p) =>
          productIds.includes(p.id) ? { ...p, campaignStatus: 'active', updatedAt: nowIso() } : p,
        ),
      );
    },
    [persist, regionPrices],
  );

  const removeProductFromCampaign = useCallback(
    (campaignId: string, productId: string) => {
      setCampaignProducts((prev) =>
        prev.filter((cp) => !(cp.campaignId === campaignId && cp.productId === productId)),
      );
      persist('移出活动', () =>
        serviceRef.current.removeProductFromCampaign(campaignId, productId),
      );
    },
    [persist],
  );

  const updateCampaignProduct = useCallback(
    (input: CampaignProduct) => {
      setCampaignProducts((prev) => prev.map((cp) => (cp.id === input.id ? input : cp)));
      persist('更新活动商品', () => serviceRef.current.updateCampaignProduct(input));
    },
    [persist],
  );

  const logAudit = useCallback(
    (entry: Omit<ProductAuditLog, 'id' | 'occurredAt'>) => {
      appendAudit(entry);
      persist('审计日志', () => serviceRef.current.logAudit(entry));
    },
    [appendAudit, persist],
  );

  const addMedia = useCallback((m: ProductMedia) => {
    setMedia((prev) => [...prev, { ...m, createdAt: nowIso(), updatedAt: nowIso() }]);
  }, []);

  const removeMedia = useCallback(
    (id: string) => {
      // Capture the row before we drop it so we can ask the service to
      // clean up the underlying file (best-effort: bucket failures should
      // not block the UI removal).
      let target: ProductMedia | undefined;
      setMedia((prev) => {
        target = prev.find((m) => m.id === id);
        return prev.filter((m) => m.id !== id);
      });
      if (target) {
        const captured = target;
        persist('删除媒体文件', () => serviceRef.current.removeMediaFile(captured));
      }
    },
    [persist],
  );

  // ── Phase 5b: tier prices (B2B quantity tiers) ─────────────────────────────

  const upsertTierPrice = useCallback(
    (input: ProductTierPrice) => {
      setTierPrices((prev) => {
        const idx = prev.findIndex((t) => t.id === input.id);
        const stamped = { ...input, updatedAt: nowIso() };
        if (idx === -1) {
          return [...prev, { ...stamped, createdAt: nowIso() }];
        }
        const next = [...prev];
        next[idx] = stamped;
        return next;
      });
      persist('保存阶梯价', () => serviceRef.current.upsertTierPrice(input));
    },
    [persist],
  );

  const removeTierPrice = useCallback(
    (id: string) => {
      setTierPrices((prev) => prev.filter((t) => t.id !== id));
      persist('删除阶梯价', () => serviceRef.current.removeTierPrice(id));
    },
    [persist],
  );

  const getEffectiveTierPrice = useCallback(
    async (opts: {
      productId: string;
      region: RegionCode;
      qty: number;
      asOfDate?: string;
    }): Promise<EffectiveTierPriceResult> => {
      return serviceRef.current.getEffectiveTierPrice(opts);
    },
    [],
  );

  // ── Phase 5c: customer pricing (3-layer stack) ─────────────────────────────

  const upsertCustomerSpecificPrice = useCallback(
    (input: CustomerSpecificPrice) => {
      setCustomerSpecificPrices((prev) => {
        const idx = prev.findIndex((p) => p.id === input.id);
        const stamped = { ...input, updatedAt: nowIso() };
        if (idx === -1) {
          return [...prev, { ...stamped, createdAt: nowIso() }];
        }
        const next = [...prev];
        next[idx] = stamped;
        return next;
      });
      persist('保存客户专属价', () => serviceRef.current.upsertCustomerSpecificPrice(input));
    },
    [persist],
  );

  const removeCustomerSpecificPrice = useCallback(
    (id: string) => {
      setCustomerSpecificPrices((prev) => prev.filter((p) => p.id !== id));
      persist('删除客户专属价', () => serviceRef.current.removeCustomerSpecificPrice(id));
    },
    [persist],
  );

  const getEffectiveCustomerPrice = useCallback(
    async (opts: {
      productId: string;
      region: RegionCode;
      qty: number;
      customerId: string | null;
      asOfDate?: string;
    }): Promise<EffectiveCustomerPriceResult> => {
      return serviceRef.current.getEffectiveCustomerPrice(opts);
    },
    [],
  );

  const resolveQuotationLinePrices = useCallback(
    (lines: QuotationLineInput[]): Promise<QuotationLineResolved[]> => {
      return serviceRef.current.resolveQuotationLinePrices(lines);
    },
    [],
  );

  const attachMedia = useCallback(
    async (input: {
      productId: string;
      kind: ProductMedia['kind'];
      file: File;
      altText?: string;
      sortOrder?: number;
    }) => {
      const created = await serviceRef.current.uploadMedia(input);
      // In supabase mode the row already exists in the DB; we just need
      // to mirror it locally so consumers re-render. In mock mode the
      // service synthesises the row but does not persist anywhere — the
      // store IS the source of truth.
      setMedia((prev) => [...prev, created]);
      return created;
    },
    [],
  );

  const upsertCategory = useCallback((cat: ProductCategory) => {
    setCategories((prev) => {
      const idx = prev.findIndex((c) => c.id === cat.id);
      const stamped = { ...cat, updatedAt: nowIso() };
      if (idx === -1) return [...prev, { ...stamped, createdAt: nowIso() }];
      const next = [...prev];
      next[idx] = stamped;
      return next;
    });
  }, []);

  const saveCategory = useCallback(
    async (cat: ProductCategory) => {
      const normalizedCode = cat.code.trim();
      if (!normalizedCode) {
        throw new Error('分类编码不能为空');
      }
      const duplicate = categories.find(
        (item) =>
          item.id !== cat.id &&
          item.tenantId === cat.tenantId &&
          item.code.trim() === normalizedCode,
      );
      if (duplicate) {
        const duplicateName = duplicate.nameEn ? `${duplicate.name} / ${duplicate.nameEn}` : duplicate.name;
        throw new Error(`分类编码已存在：${normalizedCode}（${duplicateName}）`);
      }
      if (!effectiveSupabase) {
        toast.warning('当前商品中心是本地模式，未连接 Supabase，刷新后不会永久保留。');
        return { ...cat, code: normalizedCode };
      }
      const previousId = cat.id;
      const normalizedCategory = { ...cat, code: normalizedCode };
      const categoryToSave = isUuid(cat.id)
        ? normalizedCategory
        : { ...normalizedCategory, id: createPersistentId() };
      const saved = await serviceRef.current.upsertCategory(categoryToSave);
      setCategories((prev) => {
        const normalized = prev.map((item) => {
          if (item.id === previousId) return saved;
          if (item.parentId === previousId) return { ...item, parentId: saved.id };
          return item;
        });
        const idx = normalized.findIndex((c) => c.id === saved.id);
        if (idx === -1) return [...normalized, saved];
        const next = [...normalized];
        next[idx] = saved;
        return next;
      });
      toast.success('分类已永久保存到 Supabase');
      return saved;
    },
    [categories, effectiveSupabase],
  );

  const removeCategory = useCallback(
    (id: string) => {
      setCategories((prev) => prev.filter((c) => c.id !== id));
      persist('删除分类', () => serviceRef.current.removeCategory(id));
    },
    [persist],
  );

  const upsertAttribute = useCallback((attr: ProductAttribute) => {
    setAttributes((prev) => {
      const idx = prev.findIndex((a) => a.id === attr.id);
      const stamped = { ...attr, updatedAt: nowIso() };
      if (idx === -1) return [...prev, { ...stamped, createdAt: nowIso() }];
      const next = [...prev];
      next[idx] = stamped;
      return next;
    });
  }, []);

  const removeAttribute = useCallback((id: string) => {
    setAttributes((prev) => prev.filter((a) => a.id !== id));
    setAttributeValues((prev) => prev.filter((v) => v.attributeId !== id));
  }, []);

  const upsertCampaign = useCallback(
    (cmp: Campaign) => {
      setCampaigns((prev) => {
        const idx = prev.findIndex((c) => c.id === cmp.id);
        const stamped = { ...cmp, updatedAt: nowIso() };
        if (idx === -1) return [...prev, { ...stamped, createdAt: nowIso() }];
        const next = [...prev];
        next[idx] = stamped;
        return next;
      });
      persist('保存活动', () => serviceRef.current.upsertCampaign(cmp));
    },
    [persist],
  );

  const setCampaignStatus = useCallback(
    (id: string, status: Campaign['status']) => {
      setCampaigns((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status, updatedAt: nowIso() } : c)),
      );
      persist('活动状态', () => serviceRef.current.setCampaignStatus(id, status));
    },
    [persist],
  );

  const upsertMapping = useCallback(
    (m: ModelMapping) => {
      setModelMappings((prev) => {
        const idx = prev.findIndex((x) => x.id === m.id);
        const stamped = { ...m, updatedAt: nowIso() };
        if (idx === -1) return [...prev, { ...stamped, createdAt: nowIso() }];
        const next = [...prev];
        next[idx] = stamped;
        return next;
      });
      persist('保存映射', () => serviceRef.current.upsertMapping(m));
    },
    [persist],
  );

  const removeMapping = useCallback(
    (id: string) => {
      setModelMappings((prev) => prev.filter((m) => m.id !== id));
      persist('删除映射', () => serviceRef.current.removeMapping(id));
    },
    [persist],
  );

  // ── selectors ──────────────────────────────────────────────────────────────

  const productById = useMemo(() => {
    const m = new Map<string, Product>();
    products.forEach((p) => m.set(p.id, p));
    return m;
  }, [products]);

  const categoryById = useMemo(() => {
    const m = new Map<string, ProductCategory>();
    categories.forEach((c) => m.set(c.id, c));
    return m;
  }, [categories]);

  const customerById = useMemo(() => {
    const m = new Map<string, Customer>();
    customers.forEach((c) => m.set(c.id, c));
    return m;
  }, [customers]);

  const customerTierById = useMemo(() => {
    const m = new Map<string, CustomerTier>();
    customerTiers.forEach((t) => m.set(t.id, t));
    return m;
  }, [customerTiers]);

  const supplierByProduct = useMemo(() => {
    const m = new Map<string, ProductSupplierLink>();
    supplierLinks.forEach((sl) => {
      if (sl.isPrimary) m.set(sl.productId, sl);
    });
    return m;
  }, [supplierLinks]);

  const regionPriceByKey = useMemo(() => {
    const m = new Map<string, ProductRegionPrice>();
    regionPrices.forEach((p) => m.set(`${p.productId}_${p.regionCode}`, p));
    return m;
  }, [regionPrices]);

  const publishStatusByKey = useMemo(() => {
    const m = new Map<string, PublishStatus>();
    publishChannels.forEach((c) =>
      m.set(`${c.productId}_${c.regionCode}`, c.publishStatus),
    );
    return m;
  }, [publishChannels]);

  const mediaByProduct = useMemo(() => {
    const m = new Map<string, ProductMedia[]>();
    media.forEach((x) => {
      const arr = m.get(x.productId) ?? [];
      arr.push(x);
      m.set(x.productId, arr);
    });
    return m;
  }, [media]);

  const buildListRows = useCallback((): ProductListRow[] => {
    const rows: ProductListRow[] = products.map((product) => {
      const supplier = supplierByProduct.get(product.id);
      const cat = product.primaryCategoryId
        ? categoryById.get(product.primaryCategoryId)
        : undefined;
      const productMedia = mediaByProduct.get(product.id) ?? [];
      const hasMain = productMedia.some((x) => x.kind === 'main' && x.url);
      const priceNA = regionPriceByKey.get(`${product.id}_NA`)?.salePrice;
      const priceSA = regionPriceByKey.get(`${product.id}_SA`)?.salePrice;
      const priceEA = regionPriceByKey.get(`${product.id}_EA`)?.salePrice;
      const hasAnyPrice = priceNA != null || priceSA != null || priceEA != null;
      return {
        product,
        categoryName: cat ? cat.nameEn || cat.name : undefined,
        primarySupplierName: supplier?.supplierName,
        costPrice: supplier?.costPrice,
        costCurrency: supplier?.costCurrency,
        priceNA,
        priceSA,
        priceEA,
        publishStatusByRegion: {
          NA: publishStatusByKey.get(`${product.id}_NA`) ?? 'not_published',
          SA: publishStatusByKey.get(`${product.id}_SA`) ?? 'not_published',
          EA: publishStatusByKey.get(`${product.id}_EA`) ?? 'not_published',
        },
        hasMainImage: Boolean(hasMain || product.thumbnailUrl),
        hasAnyPrice,
        hasCategory: Boolean(product.primaryCategoryId),
      };
    });

    // apply filters
    const f = filters;
    const kw = (f.keyword ?? '').trim().toLowerCase();
    return rows.filter((row) => {
      const p = row.product;
      if (kw) {
        const haystack = [
          p.sku,
          p.name,
          p.nameEn,
          p.spu,
          p.brand,
          row.primarySupplierName,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(kw)) return false;
      }
      if (f.region && f.region !== 'ALL') {
        // when region filter is on we keep rows with at least one channel in that region
        const status = row.publishStatusByRegion[f.region];
        if (!status) return false;
      }
      if (f.categoryId && p.primaryCategoryId !== f.categoryId) return false;
      if (f.publishStatus && f.publishStatus !== 'ALL') {
        const region = f.region && f.region !== 'ALL' ? f.region : 'NA';
        if (row.publishStatusByRegion[region] !== f.publishStatus) return false;
      }
      if (f.reviewStatus && f.reviewStatus !== 'ALL' && p.reviewStatus !== f.reviewStatus) return false;
      if (f.supplierId) {
        const supplier = supplierLinks.find(
          (sl) => sl.productId === p.id && sl.isPrimary,
        );
        if (supplier?.supplierId !== f.supplierId) return false;
      }
      if (f.tag && !(p.tags ?? []).includes(f.tag)) return false;
      if (f.isCampaign != null) {
        const inCampaign = campaignProducts.some((cp) => cp.productId === p.id);
        if (Boolean(inCampaign) !== Boolean(f.isCampaign)) return false;
      }
      if (f.missingImage && row.hasMainImage) return false;
      if (f.missingPrice && row.hasAnyPrice) return false;
      if (f.missingCategory && row.hasCategory) return false;
      if (f.createdFrom && p.createdAt < f.createdFrom) return false;
      if (f.createdTo && p.createdAt > f.createdTo) return false;
      if (f.updatedFrom && p.updatedAt < f.updatedFrom) return false;
      if (f.updatedTo && p.updatedAt > f.updatedTo) return false;
      return true;
    });
  }, [
    products,
    supplierByProduct,
    categoryById,
    mediaByProduct,
    regionPriceByKey,
    publishStatusByKey,
    filters,
    supplierLinks,
    campaignProducts,
  ]);

  const getStats = useCallback(() => {
    const rows = buildListRows();
    return {
      total: products.length,
      active: products.filter((p) => p.status === 'active').length,
      drafts: products.filter((p) => p.status === 'draft').length,
      pendingReview: products.filter((p) => p.reviewStatus === 'pending_review').length,
      publishedAny: rows.filter((r) =>
        Object.values(r.publishStatusByRegion).some((s) => s === 'published'),
      ).length,
      missingImage: rows.filter((r) => !r.hasMainImage).length,
      missingPrice: rows.filter((r) => !r.hasAnyPrice).length,
      missingCategory: rows.filter((r) => !r.hasCategory).length,
    };
  }, [buildListRows, products]);

  const value = useMemo<Ctx>(
    () => ({
      products,
      categories,
      categoryRelations,
      attributes,
      attributeValues,
      media,
      documents,
      supplierLinks,
      regionPrices,
      tierPrices,
      customerTiers,
      customers,
      customerSpecificPrices,
      publishChannels,
      publishLogs,
      campaigns,
      campaignProducts,
      modelMappings,
      auditLogs,

      priceHistory,
      supplierQuotes,
      reviewHistory,
      currentUser,

      activeRegion,
      filters,
      selectedProductIds,

      setActiveRegion,
      setFilters,
      resetFilters,
      toggleSelected,
      setSelected,
      clearSelected,

      upsertProduct,
      removeProduct,

      publishProduct,
      pauseProduct,
      unpublishProduct,
      archiveProduct,
      reactivateProduct,
      bulkPublish,
      bulkPause,
      bulkArchive,
      bulkSetCategory,
      bulkSetTag,

      submitForReview,
      approveProduct,
      rejectProduct,
      returnToDraft,
      bulkApprove,
      canReview,
      setCurrentUser,

      updateRegionPrice,
      bulkUpdatePrices,
      recordPriceChange,

      upsertTierPrice,
      removeTierPrice,
      getEffectiveTierPrice,

      resolveQuotationLinePrices,

      upsertCustomerSpecificPrice,
      removeCustomerSpecificPrice,
      getEffectiveCustomerPrice,

      bulkUpsertProducts,
      refreshAll,

      addSupplierQuote,
      updateSupplierQuote,
      setCurrentSupplierQuote,
      removeSupplierQuote,

      upsertPublishChannel,
      patchPublishChannel,

      upsertAttributeValue,
      removeAttributeValue,

      addProductsToCampaign,
      removeProductFromCampaign,
      updateCampaignProduct,

      logAudit,

      addMedia,
      removeMedia,
      attachMedia,

      upsertCategory,
      saveCategory,
      removeCategory,
      upsertAttribute,
      removeAttribute,

      upsertCampaign,
      setCampaignStatus,

      upsertMapping,
      removeMapping,

      getProductById: (id) => productById.get(id),
      getCategoryById: (id) => (id ? categoryById.get(id) : undefined),
      getMediaForProduct: (id) => media.filter((m) => m.productId === id),
      getDocumentsForProduct: (id) => documents.filter((d) => d.productId === id),
      getSupplierLinksForProduct: (id) =>
        supplierLinks.filter((sl) => sl.productId === id),
      getRegionPricesForProduct: (id) =>
        regionPrices.filter((rp) => rp.productId === id),
      getTierPricesForProduct: (id, region) =>
        tierPrices
          .filter((t) => t.productId === id && (region == null || t.regionCode === region))
          .sort((a, b) =>
            a.regionCode === b.regionCode
              ? a.minQty - b.minQty
              : a.regionCode.localeCompare(b.regionCode),
          ),
      validateTierPrices: (productId, region) => {
        const product = productById.get(productId);
        const sorted = tierPrices
          .filter((t) => t.productId === productId && t.regionCode === region && t.isActive)
          .sort((a, b) => a.minQty - b.minQty);
        return computeTierIssues(sorted, product?.moq ?? null);
      },

      getCustomerSpecificPricesForProduct: (productId, region) =>
        customerSpecificPrices
          .filter(
            (p) =>
              p.productId === productId && (region == null || p.regionCode === region),
          )
          .sort((a, b) =>
            a.customerId === b.customerId
              ? a.minQty - b.minQty
              : a.customerId.localeCompare(b.customerId),
          ),
      getCustomerSpecificPricesForCustomer: (customerId) =>
        customerSpecificPrices.filter((p) => p.customerId === customerId),
      listCustomers: (opts) => {
        let list = customers;
        if (opts?.activeOnly !== false) list = list.filter((c) => c.isActive);
        if (opts?.region) list = list.filter((c) => c.regionCode === opts.region);
        return list.slice().sort((a, b) => a.name.localeCompare(b.name, 'zh-Hans'));
      },
      listCustomerTiers: () =>
        customerTiers
          .filter((t) => t.isActive)
          .slice()
          .sort((a, b) => a.sortOrder - b.sortOrder),
      getCustomerById: (id) => (id ? customerById.get(id) : undefined),
      getCustomerTierById: (id) => (id ? customerTierById.get(id) : undefined),
      getPublishChannelsForProduct: (id) =>
        publishChannels.filter((pc) => pc.productId === id),
      getAttributeValuesForProduct: (id) =>
        attributeValues.filter((av) => av.productId === id),
      getAuditLogsForProduct: (id) =>
        auditLogs.filter((al) => al.productId === id),
      getMappingsForProduct: (id) =>
        modelMappings.filter((mm) => mm.productId === id),
      getCampaignsForProduct: (id) => {
        const ids = new Set(
          campaignProducts.filter((cp) => cp.productId === id).map((cp) => cp.campaignId),
        );
        return campaigns.filter((c) => ids.has(c.id));
      },
      getPriceHistoryForProduct: (id) =>
        priceHistory.filter((ph) => ph.productId === id),
      getSupplierQuotesForProduct: (id) =>
        supplierQuotes.filter((q) => q.productId === id),
      getReviewHistoryForProduct: (id) =>
        reviewHistory.filter((rh) => rh.productId === id),
      getMissingFlags: computeMissingFlags,

      buildListRows,
      getFilteredCount: () => buildListRows().length,
      getStats,
    }),
    [
      products,
      categories,
      categoryRelations,
      attributes,
      attributeValues,
      media,
      documents,
      supplierLinks,
      regionPrices,
      tierPrices,
      customerTiers,
      customers,
      customerSpecificPrices,
      publishChannels,
      publishLogs,
      campaigns,
      campaignProducts,
      modelMappings,
      auditLogs,

      priceHistory,
      supplierQuotes,
      reviewHistory,
      currentUser,

      activeRegion,
      filters,
      selectedProductIds,

      setFilters,
      resetFilters,
      toggleSelected,
      setSelected,
      clearSelected,

      upsertProduct,
      removeProduct,

      publishProduct,
      pauseProduct,
      unpublishProduct,
      archiveProduct,
      reactivateProduct,
      bulkPublish,
      bulkPause,
      bulkArchive,
      bulkSetCategory,
      bulkSetTag,

      submitForReview,
      approveProduct,
      rejectProduct,
      returnToDraft,
      bulkApprove,
      canReview,

      updateRegionPrice,
      bulkUpdatePrices,
      recordPriceChange,

      upsertTierPrice,
      removeTierPrice,
      getEffectiveTierPrice,

      resolveQuotationLinePrices,

      upsertCustomerSpecificPrice,
      removeCustomerSpecificPrice,
      getEffectiveCustomerPrice,

      bulkUpsertProducts,
      refreshAll,

      addSupplierQuote,
      updateSupplierQuote,
      setCurrentSupplierQuote,
      removeSupplierQuote,

      upsertPublishChannel,
      patchPublishChannel,

      upsertAttributeValue,
      removeAttributeValue,

      addProductsToCampaign,
      removeProductFromCampaign,
      updateCampaignProduct,

      logAudit,

      addMedia,
      removeMedia,
      attachMedia,

      upsertCategory,
      saveCategory,
      removeCategory,
      upsertAttribute,
      removeAttribute,

      upsertCampaign,
      setCampaignStatus,

      upsertMapping,
      removeMapping,

      productById,
      categoryById,
      customerById,
      customerTierById,
      computeMissingFlags,
      buildListRows,
      getStats,
    ],
  );

  return (
    <ProductCenterCtx.Provider value={value}>
      {bootstrapLoading ? (
        <div className="flex h-[60vh] flex-col items-center justify-center gap-3 text-slate-500">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
          <div className="text-sm">正在从 Supabase 加载产品中心数据…</div>
        </div>
      ) : supabaseOfflineReason ? (
        <div className="flex h-full min-h-0 flex-col">
          <div className="mx-3 mt-3 shrink-0 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            <div className="mb-1 font-semibold">Supabase 暂不可用，当前为本地预览模式</div>
            <div className="break-words font-mono text-[12px]">{supabaseOfflineReason}</div>
            <div className="mt-2 text-amber-700">
              页面可继续查看和编辑，但刷新后不会永久保留。需要恢复永久保存，请先处理 Supabase
              配额/项目限制后再刷新。
            </div>
          </div>
          <div className="min-h-0 flex-1">{children}</div>
        </div>
      ) : (
        children
      )}
    </ProductCenterCtx.Provider>
  );
}

export function useProductCenter(): Ctx {
  const ctx = useContext(ProductCenterCtx);
  if (!ctx) {
    throw new Error('useProductCenter must be used within ProductCenterProvider');
  }
  return ctx;
}
