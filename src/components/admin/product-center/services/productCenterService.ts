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
  PublishStatus,
  RegionCode,
  ReviewHistoryEntry,
  SupplierQuote,
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
