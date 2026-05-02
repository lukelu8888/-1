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
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import type {
  Campaign,
  CampaignProduct,
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
  PublishStatus,
  RegionCode,
  ReviewHistoryEntry,
  ReviewStatus,
  SupplierQuote,
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
} from './mockData';

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

  // media
  addMedia: (media: ProductMedia) => void;
  removeMedia: (id: string) => void;

  // categories
  upsertCategory: (cat: ProductCategory) => void;
  removeCategory: (id: string) => void;

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
  const [attributes] = useState<ProductAttribute[]>(mockAttributes);
  const [attributeValues, setAttributeValues] = useState<ProductAttributeValue[]>(mockAttributeValues);
  const [media, setMedia] = useState<ProductMedia[]>(mockMedia);
  const [documents] = useState<ProductDocument[]>(mockDocuments);
  const [supplierLinks] = useState<ProductSupplierLink[]>(mockSupplierLinks);
  const [regionPrices, setRegionPrices] = useState<ProductRegionPrice[]>(mockRegionPrices);
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
    },
    [appendAudit],
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

  const upsertProduct = useCallback((input: Product) => {
    setProducts((prev) => {
      const idx = prev.findIndex((p) => p.id === input.id);
      const stamped = { ...input, updatedAt: nowIso() };
      if (idx === -1) return [...prev, { ...stamped, createdAt: nowIso() }];
      const next = [...prev];
      next[idx] = stamped;
      return next;
    });
  }, []);

  const removeProduct = useCallback((id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  }, []);

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
    },
    [appendAudit],
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
    },
    [appendAudit, currentUser, computeMissingFlags],
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
    (entry: Omit<ProductPriceHistory, 'id' | 'changedAt'>) => pushPriceHistory(entry),
    [pushPriceHistory],
  );

  const updateRegionPrice = useCallback(
    (price: ProductRegionPrice, opts?: { reason?: string }) => {
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
    [currentUser.name, pushPriceHistory],
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
    [appendAudit, currentUser.name, pushPriceHistory],
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
      return created;
    },
    [appendAudit, currentUser.name],
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
    },
    [],
  );

  const removeSupplierQuote = useCallback((id: string) => {
    setSupplierQuotes((prev) => prev.filter((q) => q.id !== id));
  }, []);

  const upsertPublishChannel = useCallback((channel: ProductPublishChannel) => {
    setPublishChannels((prev) => {
      const idx = prev.findIndex((c) => c.id === channel.id);
      const stamped = { ...channel, updatedAt: nowIso() };
      if (idx === -1) return [...prev, { ...stamped, createdAt: stamped.createdAt ?? nowIso() }];
      const next = [...prev];
      next[idx] = stamped;
      return next;
    });
  }, []);

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
      return result as unknown as ProductPublishChannel;
    },
    [],
  );

  const upsertAttributeValue = useCallback((input: ProductAttributeValue) => {
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
  }, []);

  const removeAttributeValue = useCallback((id: string) => {
    setAttributeValues((prev) => prev.filter((v) => v.id !== id));
  }, []);

  const addProductsToCampaign = useCallback(
    (
      campaignId: string,
      productIds: string[],
      opts?: { discountPercent?: number },
    ) => {
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
    [regionPrices],
  );

  const removeProductFromCampaign = useCallback(
    (campaignId: string, productId: string) => {
      setCampaignProducts((prev) =>
        prev.filter((cp) => !(cp.campaignId === campaignId && cp.productId === productId)),
      );
    },
    [],
  );

  const updateCampaignProduct = useCallback((input: CampaignProduct) => {
    setCampaignProducts((prev) => prev.map((cp) => (cp.id === input.id ? input : cp)));
  }, []);

  const logAudit = useCallback(
    (entry: Omit<ProductAuditLog, 'id' | 'occurredAt'>) => appendAudit(entry),
    [appendAudit],
  );

  const addMedia = useCallback((m: ProductMedia) => {
    setMedia((prev) => [...prev, { ...m, createdAt: nowIso(), updatedAt: nowIso() }]);
  }, []);

  const removeMedia = useCallback((id: string) => {
    setMedia((prev) => prev.filter((m) => m.id !== id));
  }, []);

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

  const removeCategory = useCallback((id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const upsertCampaign = useCallback((cmp: Campaign) => {
    setCampaigns((prev) => {
      const idx = prev.findIndex((c) => c.id === cmp.id);
      const stamped = { ...cmp, updatedAt: nowIso() };
      if (idx === -1) return [...prev, { ...stamped, createdAt: nowIso() }];
      const next = [...prev];
      next[idx] = stamped;
      return next;
    });
  }, []);

  const setCampaignStatus = useCallback((id: string, status: Campaign['status']) => {
    setCampaigns((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status, updatedAt: nowIso() } : c)),
    );
  }, []);

  const upsertMapping = useCallback((m: ModelMapping) => {
    setModelMappings((prev) => {
      const idx = prev.findIndex((x) => x.id === m.id);
      const stamped = { ...m, updatedAt: nowIso() };
      if (idx === -1) return [...prev, { ...stamped, createdAt: nowIso() }];
      const next = [...prev];
      next[idx] = stamped;
      return next;
    });
  }, []);

  const removeMapping = useCallback((id: string) => {
    setModelMappings((prev) => prev.filter((m) => m.id !== id));
  }, []);

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

      upsertCategory,
      removeCategory,

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

      upsertCategory,
      removeCategory,

      upsertCampaign,
      setCampaignStatus,

      upsertMapping,
      removeMapping,

      productById,
      categoryById,
      computeMissingFlags,
      buildListRows,
      getStats,
    ],
  );

  return <ProductCenterCtx.Provider value={value}>{children}</ProductCenterCtx.Provider>;
}

export function useProductCenter(): Ctx {
  const ctx = useContext(ProductCenterCtx);
  if (!ctx) {
    throw new Error('useProductCenter must be used within ProductCenterProvider');
  }
  return ctx;
}
