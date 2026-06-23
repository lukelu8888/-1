/**
 * Phase 4 starter — abstract service interface for Product Center I/O.
 *
 * Today the Product Center reads/writes from React state in
 * `ProductCenterContext` using the `mockData` seed. Phase 4 will replace
 * those state operations with calls to Supabase RPCs and direct table queries.
 *
 * To keep the surface stable we define a thin DAO-style interface with the
 * EXACT shapes that the store dispatches today. The store's
 * `useState` updates can then be migrated one-by-one to:
 *
 *     await productCenterService.upsertProduct(product);
 *
 * without rewriting any UI component. The real implementation in
 * `supabaseProductCenterService.ts` (Phase 4) will:
 *   1. Map enum values to/from the `pc_*_enum` Postgres types.
 *   2. Use RLS-scoped `tenant_id` from the auth session.
 *   3. Push rows to `pc_product_audit_logs` server-side via triggers.
 *
 * For Phase 3 we ship only the in-memory implementation.
 */

import type {
  Campaign,
  CampaignProduct,
  Customer,
  CustomerSpecificPrice,
  CustomerTier,
  EffectiveCustomerPriceResult,
  EffectiveTierPriceResult,
  MediaKind,
  ModelMapping,
  Product,
  ProductAttribute,
  ProductAttributeValue,
  ProductAuditLog,
  ProductCategory,
  ProductMedia,
  ProductPriceHistory,
  ProductPublishChannel,
  ProductRegionPrice,
  ProductStatus,
  ProductSupplierLink,
  ProductTierPrice,
  PublishStatus,
  RegionCode,
  ReviewHistoryEntry,
  SupplierQuote,
  TierIssue,
} from '../context/types';
import { supabaseProductCenterService } from './supabaseProductCenterService';

/** Feature flag for swapping in the Supabase impl. Defaults to mock. */
export type ProductCenterBackend = 'mock' | 'supabase';

export const PRODUCT_CENTER_BACKEND: ProductCenterBackend =
  (import.meta as { env?: { VITE_PC_BACKEND?: ProductCenterBackend } }).env?.VITE_PC_BACKEND ??
  'mock';

/**
 * Bulk snapshot returned by `loadAll()`. Used by `ProductCenterContext`
 * to seed React state on startup when the Supabase backend is active.
 */
export interface ProductCenterSnapshot {
  products: Product[];
  categories: ProductCategory[];
  attributes: ProductAttribute[];
  attributeValues: ProductAttributeValue[];
  media: ProductMedia[];
  suppliers: ProductSupplierLink[];
  regionPrices: ProductRegionPrice[];
  /** Phase 5b — B2B 阶梯报价 */
  tierPrices: ProductTierPrice[];
  /** Phase 5c — 客户分层 / 专属价 */
  customerTiers: CustomerTier[];
  customers: Customer[];
  customerSpecificPrices: CustomerSpecificPrice[];
  publishChannels: ProductPublishChannel[];
  campaigns: Campaign[];
  campaignProducts: CampaignProduct[];
  mappings: ModelMapping[];
  auditLogs: ProductAuditLog[];
  priceHistory: ProductPriceHistory[];
  supplierQuotes: SupplierQuote[];
  reviewHistory: ReviewHistoryEntry[];
}

export interface ProductCenterService {
  // ── Bootstrap ────────────────────────────────────────────────────────────
  /**
   * Returns a full snapshot of every entity scoped to the current tenant.
   * Mock impl returns empty arrays — consumers fall back to seeded data.
   */
  loadAll?(): Promise<ProductCenterSnapshot>;

  // ── Product CRUD ─────────────────────────────────────────────────────────
  upsertProduct(input: Product): Promise<Product>;
  removeProduct(id: string): Promise<void>;
  archiveProduct(id: string): Promise<void>;

  // ── Pricing ──────────────────────────────────────────────────────────────
  upsertRegionPrice(input: ProductRegionPrice, opts?: { reason?: string }): Promise<ProductRegionPrice>;
  bulkUpdatePrices(params: {
    productIds: string[];
    region: RegionCode;
    field: 'basePrice' | 'salePrice' | 'campaignPrice';
    mode: 'absolute' | 'percent';
    value: number;
    reason?: string;
  }): Promise<{ touched: number }>;
  appendPriceHistory(entry: Omit<ProductPriceHistory, 'id' | 'changedAt'>): Promise<ProductPriceHistory>;

  // ── Publishing ───────────────────────────────────────────────────────────
  upsertPublishChannel(channel: ProductPublishChannel): Promise<ProductPublishChannel>;
  patchPublishChannel(
    productId: string,
    region: RegionCode,
    patch: Partial<Omit<ProductPublishChannel, 'id' | 'productId' | 'regionCode' | 'channel'>>,
  ): Promise<ProductPublishChannel>;

  // ── Attributes ───────────────────────────────────────────────────────────
  upsertAttributeValue(input: ProductAttributeValue): Promise<ProductAttributeValue>;
  removeAttributeValue(id: string): Promise<void>;

  // ── Suppliers ────────────────────────────────────────────────────────────
  addSupplierQuote(
    input: Omit<SupplierQuote, 'id' | 'createdAt' | 'isCurrent'>,
  ): Promise<SupplierQuote>;
  setCurrentSupplierQuote(id: string): Promise<void>;
  removeSupplierQuote(id: string): Promise<void>;

  // ── Campaigns ────────────────────────────────────────────────────────────
  upsertCampaign(input: Campaign): Promise<Campaign>;
  setCampaignStatus(id: string, status: Campaign['status']): Promise<void>;
  addProductsToCampaign(
    campaignId: string,
    productIds: string[],
    opts?: { discountPercent?: number },
  ): Promise<{ created: number }>;
  removeProductFromCampaign(campaignId: string, productId: string): Promise<void>;
  updateCampaignProduct(input: CampaignProduct): Promise<CampaignProduct>;

  // ── Mappings ─────────────────────────────────────────────────────────────
  upsertMapping(input: ModelMapping): Promise<ModelMapping>;
  removeMapping(id: string): Promise<void>;

  // ── Review workflow ──────────────────────────────────────────────────────
  submitForReview(productId: string, note?: string): Promise<ReviewHistoryEntry>;
  approveProduct(productId: string, note?: string): Promise<ReviewHistoryEntry>;
  rejectProduct(productId: string, reason: string): Promise<ReviewHistoryEntry>;
  returnToDraft(productId: string, reason: string): Promise<ReviewHistoryEntry>;

  // ── Audit ────────────────────────────────────────────────────────────────
  logAudit(entry: Omit<ProductAuditLog, 'id' | 'occurredAt'>): Promise<ProductAuditLog>;

  // ── Phase 4d: search / export / analytics ────────────────────────────────

  /**
   * Server-side full-text search. Returns up to `limit` products ordered
   * by ts_rank when a keyword is given, or by `updated_at desc` otherwise.
   * Mock impl falls back to a substring filter over in-memory data.
   */
  searchProducts(opts: { keyword?: string; limit?: number }): Promise<Product[]>;

  /**
   * Wide row set for CSV/Excel export. Joins region price + publish status
   * + primary supplier in one shot. The client converts to CSV — keeping
   * MIME concerns and i18n column headers in one place.
   */
  exportProducts(opts: {
    region?: RegionCode;
    status?: ProductStatus;
  }): Promise<ProductExportRow[]>;

  /**
   * Single round-trip analytics payload powering the "概览" dashboard.
   */
  getAnalyticsRollup(opts?: { region?: RegionCode }): Promise<AnalyticsRollup>;

  /**
   * Phase 4e — bulk import. Accepts a list of rows in the same shape as
   * `pc_export_products` so the round-trip "导出 → Excel 编辑 → 导入"
   * works without column mapping. Each row that fails is reported in
   * `errors` (with its 1-based index and SKU); successful rows are
   * counted in `created` / `updated`.
   */
  bulkUpsertProducts(rows: BulkImportRow[]): Promise<BulkImportResult>;

  // ── Phase 5b: B2B tier prices ────────────────────────────────────────────

  /**
   * Insert or update a single tier-price row. The unique key is
   * (productId, regionCode, minQty) — saving with an existing key
   * updates that row, otherwise creates a new one.
   */
  upsertTierPrice(input: ProductTierPrice): Promise<ProductTierPrice>;

  /** Soft-disable or hard-delete a tier price (delete by default). */
  removeTierPrice(id: string): Promise<void>;

  /**
   * Resolve the unit price for a given quantity in a region. Backed by
   * the `pc_get_effective_tier_price` RPC server-side; mock impl runs
   * the same selection logic over local seed data.
   *
   * Returns `source: 'tier'` when a tier matched, `'base'` when we
   * fell back to `region.basePrice` (qty ≥ MOQ but no tier covered it),
   * or `'none'` with a `reason` when no price is available (e.g. below
   * MOQ).
   */
  getEffectiveTierPrice(opts: {
    productId: string;
    region: RegionCode;
    qty: number;
    asOfDate?: string;
  }): Promise<EffectiveTierPriceResult>;

  /** Per-product / per-region tier-table consistency check. */
  validateTierPrices(opts: {
    productId: string;
    region: RegionCode;
  }): Promise<TierIssue[]>;

  // ── Phase 5d: quotation ↔ pricing-center bridge ──────────────────────────

  /**
   * Batch-resolve prices for a set of quotation lines.
   *
   * Each input line carries the minimum information a quotation row has:
   * `sku` (to look up the PIM product), `qty`, `region`, and an optional
   * `customerId` (to apply customer-specific / tier-discount logic).
   *
   * The returned array mirrors the input order. Each result includes:
   *   - `resolved: true`  — price found; `unitPrice`, `currency`,
   *     `incoterm`, `source`, `listPrice`, `discountPercent`
   *   - `resolved: false` — not found; `reason` explains why
   *     ('sku-not-found' | 'below-moq' | 'no-region-price' | 'qty-required')
   *
   * The caller (hook / UI) decides which results to accept — this function
   * is pure lookup and NEVER modifies the quotation or the product center.
   */
  resolveQuotationLinePrices(
    lines: QuotationLineInput[],
  ): Promise<QuotationLineResolved[]>;

  // ── Phase 5c: customer tier pricing + specific prices ────────────────────

  /** Persist a customer-specific price (insert or update on conflict). */
  upsertCustomerSpecificPrice(input: CustomerSpecificPrice): Promise<CustomerSpecificPrice>;

  /** Hard-delete a customer-specific price by id. */
  removeCustomerSpecificPrice(id: string): Promise<void>;

  /**
   * Three-layer price selection:
   *   1. customer-specific price → `source: 'customer-specific'`
   *   2. fallback to public tier (Phase 5b) and apply customer's tier %
   *      → `source: 'tier-with-discount' | 'base-with-discount'`
   *   3. no customer / no tier → `source: 'tier' | 'base'` (same as 5b)
   *
   * Returns `source: 'none'` with a `reason` if quantity is below MOQ
   * or no region price exists.
   */
  getEffectiveCustomerPrice(opts: {
    productId: string;
    region: RegionCode;
    qty: number;
    customerId: string | null;
    asOfDate?: string;
  }): Promise<EffectiveCustomerPriceResult>;

  // ── Categories ───────────────────────────────────────────────────────────
  upsertCategory(input: ProductCategory): Promise<ProductCategory>;
  removeCategory(id: string): Promise<void>;

  // ── Phase 5a: media upload ───────────────────────────────────────────────

  /**
   * Upload a single image / video file and persist a `pc_product_media`
   * row pointing at it. Returns the persisted media record (with the
   * resolved CDN-friendly URL).
   *
   * Mock impl synthesises a `blob:` URL via `URL.createObjectURL` so the
   * UI lights up the same way as in production — the file lives in the
   * browser session only.
   *
   * Supabase impl uploads to the `product-media` bucket and inserts a
   * `pc_product_media` row.
   */
  uploadMedia(input: MediaUploadInput): Promise<ProductMedia>;

  /**
   * Delete the underlying storage object for a media row. The row itself
   * is removed by the caller (Context owns the in-memory state). Mock
   * impl revokes the blob URL; supabase impl removes the bucket object.
   */
  removeMediaFile(media: ProductMedia): Promise<void>;
}

// ── Phase 5a shared types ───────────────────────────────────────────────────

export interface MediaUploadInput {
  productId: string;
  kind: MediaKind;
  file: File;
  altText?: string;
  sortOrder?: number;
}

// ── Phase 4d shared types ───────────────────────────────────────────────────

export interface ProductExportRow {
  sku: string;
  name: string;
  nameEn?: string | null;
  nameZh?: string | null;
  brand?: string | null;
  status: string;
  reviewStatus: string;
  primaryCategoryCode?: string | null;
  primaryCategoryName?: string | null;
  region?: string | null;
  currency?: string | null;
  basePrice?: number | null;
  salePrice?: number | null;
  campaignPrice?: number | null;
  publishStatus: string;
  homepageFeatured: boolean;
  categoryFeatured: boolean;
  seoTitle?: string | null;
  seoSlug?: string | null;
  primarySupplier?: string | null;
  costPrice?: number | null;
  costCurrency?: string | null;
  hsCode?: string | null;
  moq?: number | null;
  unitsPerCarton?: number | null;
  leadTimeDays?: number | null;
  updatedAt: string;
}

export interface AnalyticsRollup {
  generatedAt: string;
  regionFilter: RegionCode | null;
  totals: {
    all: number;
    active: number;
    draft: number;
    disabled: number;
    archived: number;
    pendingReview: number;
    approved: number;
    rejected: number;
    notSubmitted: number;
  };
  topCategories: Array<{
    categoryId: string | null;
    categoryName: string | null;
    count: number;
  }>;
  publishStatusByRegion: Partial<Record<RegionCode, Partial<Record<PublishStatus, number>>>>;
  priceSummaryByRegion: Partial<
    Record<
      RegionCode,
      {
        count: number;
        currency: string | null;
        avgSale: number | null;
        minSale: number | null;
        maxSale: number | null;
        avgBase: number | null;
      }
    >
  >;
  dataQuality: {
    missingImage: number;
    missingCategory: number;
    missingPrice: number;
  };
}

// ── Phase 4e — bulk import ──────────────────────────────────────────────────

/**
 * Wide-row import payload. Same key set as `ProductExportRow` but every
 * field is optional (and string-typed for prices) so callers can feed
 * straight from a CSV without coercion.
 */
export interface BulkImportRow {
  sku: string;
  name?: string;
  nameEn?: string;
  nameZh?: string;
  brand?: string;
  status?: string;
  reviewStatus?: string;
  primaryCategoryCode?: string;
  region?: string;
  currency?: string;
  basePrice?: number | string;
  salePrice?: number | string;
  campaignPrice?: number | string;
  hsCode?: string;
  moq?: number | string;
  unitsPerCarton?: number | string;
  leadTimeDays?: number | string;
}

export interface BulkImportError {
  /** 1-based row index (matches the user-visible CSV preview). */
  index: number;
  sku?: string;
  message: string;
}

export interface BulkImportResult {
  created: number;
  updated: number;
  errors: BulkImportError[];
}

/**
 * Mock service that just resolves immediately. The Phase 3 store still owns
 * the React state — this exists so app code can already start importing from
 * `productCenterService` and add `await` boundaries that won't change shape
 * once we wire up Supabase.
 */
export const mockProductCenterService: ProductCenterService = {
  async loadAll() {
    return {
      products: [],
      categories: [],
      attributes: [],
      attributeValues: [],
      media: [],
      suppliers: [],
      regionPrices: [],
      tierPrices: [],
      customerTiers: [],
      customers: [],
      customerSpecificPrices: [],
      publishChannels: [],
      campaigns: [],
      campaignProducts: [],
      mappings: [],
      auditLogs: [],
      priceHistory: [],
      supplierQuotes: [],
      reviewHistory: [],
    };
  },
  async upsertProduct(input) {
    return input;
  },
  async removeProduct() {
    /* noop */
  },
  async archiveProduct() {
    /* noop */
  },

  async upsertRegionPrice(input) {
    return input;
  },
  async bulkUpdatePrices({ productIds }) {
    return { touched: productIds.length };
  },
  async appendPriceHistory(entry) {
    return {
      ...entry,
      id: `ph_${Date.now().toString(36)}`,
      changedAt: new Date().toISOString(),
    };
  },

  async upsertPublishChannel(channel) {
    return channel;
  },
  async patchPublishChannel(productId, region, patch) {
    return {
      id: `pc_${productId}_${region}`,
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
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...patch,
    } as ProductPublishChannel;
  },

  async upsertAttributeValue(input) {
    return input;
  },
  async removeAttributeValue() {
    /* noop */
  },

  async upsertCategory(input) {
    return input;
  },
  async removeCategory() {
    /* noop */
  },

  async addSupplierQuote(input) {
    return {
      ...input,
      id: `sq_${Date.now().toString(36)}`,
      isCurrent: true,
      createdAt: new Date().toISOString(),
    };
  },
  async setCurrentSupplierQuote() {
    /* noop */
  },
  async removeSupplierQuote() {
    /* noop */
  },

  async upsertCampaign(input) {
    return input;
  },
  async setCampaignStatus() {
    /* noop */
  },
  async addProductsToCampaign(_campaignId, productIds) {
    return { created: productIds.length };
  },
  async removeProductFromCampaign() {
    /* noop */
  },
  async updateCampaignProduct(input) {
    return input;
  },

  async upsertMapping(input) {
    return input;
  },
  async removeMapping() {
    /* noop */
  },

  async submitForReview(productId) {
    return synthReview(productId, 'pending_review');
  },
  async approveProduct(productId) {
    return synthReview(productId, 'approved');
  },
  async rejectProduct(productId, reason) {
    return synthReview(productId, 'rejected', reason);
  },
  async returnToDraft(productId, reason) {
    return synthReview(productId, 'not_submitted', reason);
  },

  async logAudit(entry) {
    return {
      ...entry,
      id: `al_${Date.now().toString(36)}`,
      occurredAt: new Date().toISOString(),
    } as ProductAuditLog;
  },

  // ── Phase 4d (mock) ──────────────────────────────────────────────────────
  // The mock implementations are simplistic — Phase 4d UIs should fall back
  // to client-side computation on the in-memory state when the backend is
  // mock; but we still ship usable stubs so unit tests and feature flags
  // exercise the same code path.
  async searchProducts({ keyword, limit }) {
    const { mockProducts } = await import('../context/mockData');
    const kw = (keyword ?? '').trim().toLowerCase();
    const rows = kw
      ? mockProducts.filter((p) =>
          [p.sku, p.name, p.nameEn, p.brand, p.spu]
            .filter(Boolean)
            .some((s) => (s as string).toLowerCase().includes(kw)),
        )
      : mockProducts;
    return rows.slice(0, Math.max(1, Math.min(limit ?? 200, 1000)));
  },
  async exportProducts({ region, status }) {
    const [{ mockProducts, mockRegionPrices, mockPublishChannels, mockSupplierLinks, mockCategories }] =
      await Promise.all([import('../context/mockData')]);
    const region2 = region ?? 'NA';
    return mockProducts
      .filter((p) => p.archivedAt == null)
      .filter((p) => (status ? p.status === status : true))
      .map((p) => {
        const cat = mockCategories.find((c) => c.id === p.primaryCategoryId);
        const rp = mockRegionPrices.find(
          (x) => x.productId === p.id && x.regionCode === region2,
        );
        const ch = mockPublishChannels.find(
          (x) => x.productId === p.id && x.regionCode === region2,
        );
        const sup = mockSupplierLinks.find((x) => x.productId === p.id && x.isPrimary);
        return {
          sku: p.sku,
          name: p.name,
          nameEn: p.nameEn,
          nameZh: p.nameZh,
          brand: p.brand,
          status: p.status,
          reviewStatus: p.reviewStatus,
          primaryCategoryCode: cat?.code,
          primaryCategoryName: cat?.nameEn ?? cat?.name,
          region: region2,
          currency: rp?.currency,
          basePrice: rp?.basePrice ?? null,
          salePrice: rp?.salePrice ?? null,
          campaignPrice: rp?.campaignPrice ?? null,
          publishStatus: ch?.publishStatus ?? 'not_published',
          homepageFeatured: ch?.homepageFeatured ?? false,
          categoryFeatured: ch?.categoryFeatured ?? false,
          seoTitle: ch?.seoTitle,
          seoSlug: ch?.seoSlug,
          primarySupplier: sup?.supplierName,
          costPrice: sup?.costPrice ?? null,
          costCurrency: sup?.costCurrency,
          hsCode: p.hsCode,
          moq: p.moq ?? null,
          unitsPerCarton: p.unitsPerCarton ?? null,
          leadTimeDays: p.leadTimeDays ?? null,
          updatedAt: p.updatedAt,
        } satisfies ProductExportRow;
      });
  },
  async getAnalyticsRollup(opts) {
    const region = opts?.region;
    const {
      mockProducts,
      mockCategories,
      mockPublishChannels,
      mockRegionPrices,
      mockMedia,
    } = await import('../context/mockData');
    const live = mockProducts.filter((p) => p.archivedAt == null);
    const totals = {
      all: live.length,
      active: live.filter((p) => p.status === 'active').length,
      draft: live.filter((p) => p.status === 'draft').length,
      disabled: live.filter((p) => p.status === 'disabled').length,
      archived: 0,
      pendingReview: live.filter((p) => p.reviewStatus === 'pending_review').length,
      approved: live.filter((p) => p.reviewStatus === 'approved').length,
      rejected: live.filter((p) => p.reviewStatus === 'rejected').length,
      notSubmitted: live.filter((p) => p.reviewStatus === 'not_submitted').length,
    };
    const catCount = new Map<string | null, number>();
    live.forEach((p) => {
      const k = p.primaryCategoryId ?? null;
      catCount.set(k, (catCount.get(k) ?? 0) + 1);
    });
    const topCategories = Array.from(catCount.entries())
      .map(([id, count]) => ({
        categoryId: id,
        categoryName: id ? mockCategories.find((c) => c.id === id)?.nameEn ?? null : null,
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    const publishStatusByRegion: AnalyticsRollup['publishStatusByRegion'] = {};
    mockPublishChannels
      .filter((c) => !region || c.regionCode === region)
      .forEach((c) => {
        const map = (publishStatusByRegion[c.regionCode] ??= {});
        map[c.publishStatus] = (map[c.publishStatus] ?? 0) + 1;
      });

    const priceSummaryByRegion: AnalyticsRollup['priceSummaryByRegion'] = {};
    (['NA', 'SA', 'EA'] as const).forEach((reg) => {
      if (region && reg !== region) return;
      const rows = mockRegionPrices.filter((r) => r.regionCode === reg && r.isActive);
      if (!rows.length) return;
      const sales = rows.map((r) => r.salePrice ?? r.basePrice).filter((x): x is number => x != null);
      const avgBase = rows.reduce((a, r) => a + r.basePrice, 0) / rows.length;
      const avgSale = sales.length ? sales.reduce((a, b) => a + b, 0) / sales.length : null;
      priceSummaryByRegion[reg] = {
        count: rows.length,
        currency: rows[0]?.currency ?? null,
        avgSale: avgSale != null ? Math.round(avgSale * 100) / 100 : null,
        minSale: sales.length ? Math.min(...sales) : null,
        maxSale: sales.length ? Math.max(...sales) : null,
        avgBase: Math.round(avgBase * 100) / 100,
      };
    });

    const missingImage = live.filter(
      (p) => !p.thumbnailUrl && !mockMedia.some((m) => m.productId === p.id && m.kind === 'main'),
    ).length;
    const missingCategory = live.filter((p) => !p.primaryCategoryId).length;
    const missingPrice = live.filter(
      (p) => !mockRegionPrices.some((r) => r.productId === p.id && (r.salePrice != null || r.basePrice != null)),
    ).length;

    return {
      generatedAt: new Date().toISOString(),
      regionFilter: region ?? null,
      totals,
      topCategories,
      publishStatusByRegion,
      priceSummaryByRegion,
      dataQuality: { missingImage, missingCategory, missingPrice },
    };
  },

  async bulkUpsertProducts(rows) {
    // Mock impl validates row shape, coerces numeric fields, and reports
    // errors the same way the RPC does. We do NOT mutate the seed arrays:
    // the Context layer owns mock state, so it will apply successful rows
    // itself (see `bulkUpsertProducts` in ProductCenterContext).
    const errors: BulkImportError[] = [];
    let created = 0;
    let updated = 0;
    const { mockProducts, mockCategories } = await import('../context/mockData');
    const knownCodes = new Set(mockCategories.map((c) => c.code));
    const skuToProduct = new Map(mockProducts.map((p) => [p.sku.toLowerCase(), p]));

    rows.forEach((row, i) => {
      const idx = i + 1;
      const sku = String(row.sku ?? '').trim();
      const name = String(row.name ?? '').trim();
      try {
        if (!sku) throw new Error('pc:missing-sku');
        if (row.primaryCategoryCode && !knownCodes.has(row.primaryCategoryCode)) {
          throw new Error(`pc:unknown-category-code:${row.primaryCategoryCode}`);
        }
        if (skuToProduct.has(sku.toLowerCase())) {
          updated += 1;
        } else {
          if (!name) throw new Error('pc:missing-name');
          created += 1;
        }
      } catch (err) {
        errors.push({
          index: idx,
          sku: sku || undefined,
          message: (err as Error).message,
        });
      }
    });

    return { created, updated, errors };
  },

  // ── Phase 5b (mock): tier price selection ────────────────────────────────
  // The mock impl runs the same selection algorithm as the SQL RPC over
  // the in-memory seed data, so unit tests verify the exact behaviour the
  // server will exhibit once we point to Supabase.
  async upsertTierPrice(input) {
    return input;
  },
  async removeTierPrice() {
    /* noop */
  },
  async getEffectiveTierPrice({ productId, region, qty, asOfDate }) {
    if (!qty || qty < 1) {
      return { source: 'none', reason: 'qty-required' } satisfies EffectiveTierPriceResult;
    }
    const { mockProducts, mockTierPrices, mockRegionPrices } = await import(
      '../context/mockData'
    );
    const product = mockProducts.find((p) => p.id === productId);
    const moq = product?.moq;
    const today = (asOfDate ?? new Date().toISOString().slice(0, 10)).slice(0, 10);

    const within = (s?: string | null, e?: string | null) => {
      if (s && s > today) return false;
      if (e && e < today) return false;
      return true;
    };

    const eligible = mockTierPrices
      .filter(
        (t) =>
          t.productId === productId &&
          t.regionCode === region &&
          t.isActive &&
          within(t.effectiveFrom, t.effectiveTo) &&
          t.minQty <= qty &&
          (t.maxQty == null || t.maxQty > qty),
      )
      .sort((a, b) => b.minQty - a.minQty);

    const hit = eligible[0];
    if (hit) {
      return {
        source: 'tier',
        unitPrice: hit.unitPrice,
        currency: hit.currency,
        minQty: hit.minQty,
        maxQty: hit.maxQty ?? null,
        tierId: hit.id,
        incoterm: hit.incoterm,
        discountPercent: hit.discountPercent,
      };
    }

    if (moq != null && qty < moq) {
      return { source: 'none', reason: 'below-moq', moq };
    }

    const base = mockRegionPrices.find(
      (rp) => rp.productId === productId && rp.regionCode === region && rp.isActive,
    );
    if (!base) {
      return { source: 'none', reason: 'no-region-price' };
    }
    return {
      source: 'base',
      unitPrice: base.basePrice,
      currency: base.currency,
      minQty: moq ?? 1,
    };
  },
  async validateTierPrices({ productId, region }) {
    const { mockTierPrices, mockProducts } = await import('../context/mockData');
    const tiers = mockTierPrices
      .filter((t) => t.productId === productId && t.regionCode === region && t.isActive)
      .sort((a, b) => a.minQty - b.minQty);
    if (tiers.length === 0) return [];

    const product = mockProducts.find((p) => p.id === productId);
    return computeTierIssues(tiers, product?.moq ?? null);
  },

  // ── Phase 5d (mock): quotation ↔ pricing-center bridge ─────────────────
  async resolveQuotationLinePrices(lines) {
    const { mockProducts } = await import('../context/mockData');
    const skuMap = new Map(mockProducts.map((p) => [p.sku.toUpperCase(), p]));

    const results: QuotationLineResolved[] = await Promise.all(
      lines.map(async (line): Promise<QuotationLineResolved> => {
        const product = skuMap.get(line.sku.toUpperCase());
        if (!product) {
          return { lineRef: line.lineRef, resolved: false, sku: line.sku, reason: 'sku-not-found' };
        }
        const price = await mockProductCenterService.getEffectiveCustomerPrice({
          productId: product.id,
          region: line.region,
          qty: line.qty,
          customerId: line.customerId,
          asOfDate: line.asOfDate,
        });
        if (price.source === 'none') {
          const reasonMap: Record<string, QuotationLineResolved['reason']> = {
            'below-moq': 'below-moq',
            'no-region-price': 'no-region-price',
            'qty-required': 'qty-required',
          };
          return {
            lineRef: line.lineRef,
            resolved: false,
            sku: line.sku,
            reason: reasonMap[price.reason ?? ''] ?? 'unknown',
            moq: price.moq,
          };
        }
        return {
          lineRef: line.lineRef,
          resolved: true,
          sku: line.sku,
          pimProductId: product.id,
          pimProductName: product.nameZh ?? product.name ?? product.nameEn ?? '',
          unitPrice: price.unitPrice ?? 0,
          listPrice: price.listPrice ?? price.unitPrice ?? 0,
          discountPercent: price.discountPercent ?? 0,
          currency: price.currency ?? 'USD',
          incoterm: price.incoterm,
          source: price.source,
          customerTierCode: price.customerTierCode,
        };
      }),
    );
    return results;
  },

  // ── Phase 5c (mock): customer tier pricing + specific prices ────────────
  async upsertCustomerSpecificPrice(input) {
    return input;
  },
  async removeCustomerSpecificPrice() {
    /* noop */
  },
  async getEffectiveCustomerPrice({ productId, region, qty, customerId, asOfDate }) {
    if (!qty || qty < 1) {
      return { source: 'none', reason: 'qty-required' };
    }
    const { mockCustomers, mockCustomerTiers, mockCustomerSpecificPrices } = await import(
      '../context/mockData'
    );
    const today = (asOfDate ?? new Date().toISOString().slice(0, 10)).slice(0, 10);
    const within = (s?: string | null, e?: string | null) => {
      if (s && s > today) return false;
      if (e && e < today) return false;
      return true;
    };

    // A. customer-specific match → highest priority
    if (customerId) {
      const csp = mockCustomerSpecificPrices
        .filter(
          (p) =>
            p.customerId === customerId &&
            p.productId === productId &&
            p.regionCode === region &&
            p.isActive &&
            within(p.effectiveFrom, p.effectiveTo) &&
            p.minQty <= qty &&
            (p.maxQty == null || p.maxQty > qty),
        )
        .sort((a, b) => b.minQty - a.minQty)[0];

      if (csp) {
        return {
          source: 'customer-specific',
          unitPrice: csp.unitPrice,
          listPrice: csp.unitPrice,
          discountPercent: 0,
          currency: csp.currency,
          minQty: csp.minQty,
          maxQty: csp.maxQty ?? null,
          incoterm: csp.incoterm,
          specificId: csp.id,
        };
      }
    }

    // Customer's tier discount
    let tierPct = 0;
    let tierCode: string | undefined;
    let tierName: string | undefined;
    if (customerId) {
      const customer = mockCustomers.find((c) => c.id === customerId && c.isActive);
      const tier = customer?.tierId
        ? mockCustomerTiers.find((t) => t.id === customer.tierId && t.isActive)
        : undefined;
      tierPct = tier?.defaultDiscountPercent ?? 0;
      tierCode = tier?.code;
      tierName = tier?.name;
    }

    // B. delegate to 5b's selection
    const tierRes = await mockProductCenterService.getEffectiveTierPrice({
      productId,
      region,
      qty,
      asOfDate,
    });

    if (tierRes.source === 'none') {
      return {
        source: 'none',
        reason: tierRes.reason,
        moq: tierRes.moq,
      };
    }

    const list = tierRes.unitPrice ?? 0;
    const final = Math.round(list * (1 - tierPct / 100) * 10000) / 10000;
    const sourceOut: EffectiveCustomerPriceResult['source'] =
      tierPct > 0
        ? tierRes.source === 'tier'
          ? 'tier-with-discount'
          : 'base-with-discount'
        : tierRes.source;

    return {
      source: sourceOut,
      unitPrice: final,
      listPrice: list,
      discountPercent: tierPct,
      currency: tierRes.currency,
      minQty: tierRes.minQty,
      maxQty: tierRes.maxQty ?? null,
      incoterm: tierRes.incoterm,
      tierId: tierRes.tierId,
      customerTierCode: tierCode,
      customerTierName: tierName,
    };
  },

  // ── Phase 5a (mock) ──────────────────────────────────────────────────────
  // The mock impl returns a `blob:` URL that's valid only in this session
  // (revoked on `removeMediaFile`). It's enough to verify the full upload
  // → preview → list → delete UI loop without touching the network.
  async uploadMedia({ productId, kind, file, altText, sortOrder }) {
    const url =
      typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function'
        ? URL.createObjectURL(file)
        : `mock://product-media/${productId}/${kind}/${encodeURIComponent(file.name)}`;
    const now = new Date().toISOString();
    return {
      id: `pm_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
      productId,
      kind,
      url,
      altText: altText ?? file.name.replace(/\.[a-z0-9]+$/i, ''),
      sortOrder: sortOrder ?? 0,
      fileSize: file.size,
      createdAt: now,
      updatedAt: now,
    } satisfies ProductMedia;
  },

  async removeMediaFile(media) {
    if (
      typeof URL !== 'undefined' &&
      typeof URL.revokeObjectURL === 'function' &&
      media.url.startsWith('blob:')
    ) {
      URL.revokeObjectURL(media.url);
    }
  },
};

function synthReview(
  productId: string,
  to: ReviewHistoryEntry['toStatus'],
  reason?: string,
): ReviewHistoryEntry {
  return {
    id: `rh_${Date.now().toString(36)}`,
    productId,
    fromStatus: 'not_submitted',
    toStatus: to,
    reason,
    occurredAt: new Date().toISOString(),
  };
}

// ─── Phase 5d public types ───────────────────────────────────────────────────
//
// Deliberately minimal — we only define the fields both quotation modules
// (admin QuotationManagement and salesperson SalesQuotationContext) share.
// The hook / UI glues these into the native quotation-line shape.

/** Fields required to resolve a price; `sku` is the PIM product lookup key. */
export interface QuotationLineInput {
  /** Internal line reference (index or id) — echoed back in the result. */
  lineRef: string | number;
  sku: string;
  qty: number;
  region: RegionCode;
  /** null = public pricing (no customer-specific / tier discount) */
  customerId: string | null;
  asOfDate?: string;
}

export type QuotationLineResolved =
  | {
      lineRef: string | number;
      resolved: true;
      sku: string;
      pimProductId: string;
      pimProductName: string;
      unitPrice: number;
      listPrice: number;
      discountPercent: number;
      currency: string;
      incoterm?: string;
      source: EffectiveCustomerPriceResult['source'];
      customerTierCode?: string;
    }
  | {
      lineRef: string | number;
      resolved: false;
      sku: string;
      reason:
        | 'sku-not-found'
        | 'below-moq'
        | 'no-region-price'
        | 'qty-required'
        | 'unknown';
      moq?: number;
    };

/**
 * Phase 5b — pure consistency checker shared by the mock service AND the
 * Context (so save-time validation in mock mode matches what the SQL RPC
 * `pc_validate_tier_prices` returns in supabase mode).
 *
 * Tiers must be passed sorted ascending by `minQty`.
 */
export function computeTierIssues(
  tiers: ProductTierPrice[],
  moq: number | null,
): TierIssue[] {
  const issues: TierIssue[] = [];
  if (tiers.length === 0) return issues;

  // 1. Lowest tier ≥ MOQ — non-negotiable for B2B.
  if (moq != null && tiers[0].minQty < moq) {
    issues.push({
      code: 'tier-below-moq',
      message: `最低档 ${tiers[0].minQty} 小于产品 MOQ ${moq}`,
      severity: 'error',
    });
  }

  // 2. Top tier should be open-ended (max_qty = null) — otherwise huge
  //    orders fall into "no tier matched" path and we lose the negotiation
  //    leverage. Treat as warning, not error, since some B2B contracts
  //    legitimately cap a tier (e.g. annual quota lock).
  const hasOpenTop = tiers.some((t) => t.maxQty == null);
  if (!hasOpenTop) {
    issues.push({
      code: 'no-open-top-tier',
      message: '最高档应有 max_qty = null（"以上不限"）以覆盖大额订单',
      severity: 'warning',
    });
  }

  // 3. Adjacent tiers should be exactly continuous: tier[i].max_qty ===
  //    tier[i+1].min_qty (or tier[i] is the open-ended top).
  for (let i = 0; i < tiers.length - 1; i += 1) {
    const cur = tiers[i];
    const next = tiers[i + 1];
    if (cur.maxQty == null) continue;
    if (cur.maxQty !== next.minQty) {
      issues.push({
        code: 'tier-gap-or-overlap',
        message: `第 ${i + 1} 档 (${cur.minQty}-${cur.maxQty}) 与第 ${i + 2} 档 (${next.minQty}-) 不连续`,
        severity: 'warning',
      });
    }
  }

  // 4. Duplicate min_qty (shouldn't happen because of the unique key on
  //    the table but the editor staging area could try it before save).
  const minQtys = new Set<number>();
  for (const t of tiers) {
    if (minQtys.has(t.minQty)) {
      issues.push({
        code: 'duplicate-min-qty',
        message: `存在重复起订量 ${t.minQty} — 同一区域同一起订量只能有一档`,
        severity: 'error',
      });
      break;
    }
    minQtys.add(t.minQty);
  }

  return issues;
}

/**
 * The active service. Returns the Supabase-backed implementation when
 * `VITE_PC_BACKEND=supabase`, otherwise the in-memory mock impl.
 */
export function getProductCenterService(): ProductCenterService {
  if (PRODUCT_CENTER_BACKEND === 'supabase') {
    return supabaseProductCenterService;
  }
  return mockProductCenterService;
}
