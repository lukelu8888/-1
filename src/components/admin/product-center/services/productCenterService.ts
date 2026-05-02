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
  ProductAttributeValue,
  ProductAuditLog,
  ProductPriceHistory,
  ProductPublishChannel,
  ProductRegionPrice,
  RegionCode,
  ReviewHistoryEntry,
  SupplierQuote,
} from '../context/types';

/** Feature flag for swapping in the Supabase impl. Defaults to mock. */
export type ProductCenterBackend = 'mock' | 'supabase';

export const PRODUCT_CENTER_BACKEND: ProductCenterBackend =
  (import.meta as { env?: { VITE_PC_BACKEND?: ProductCenterBackend } }).env?.VITE_PC_BACKEND ??
  'mock';

export interface ProductCenterService {
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
}

/**
 * Mock service that just resolves immediately. The Phase 3 store still owns
 * the React state — this exists so app code can already start importing from
 * `productCenterService` and add `await` boundaries that won't change shape
 * once we wire up Supabase.
 */
export const mockProductCenterService: ProductCenterService = {
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
 * The active service. Today returns the mock impl; Phase 4 will return a
 * Supabase-backed implementation when `VITE_PC_BACKEND=supabase`.
 */
export function getProductCenterService(): ProductCenterService {
  if (PRODUCT_CENTER_BACKEND === 'supabase') {
    // intentional: not yet implemented; fall through to mock until Phase 4.
    // eslint-disable-next-line no-console
    console.warn('[product-center] Supabase backend not yet implemented; using mock');
    return mockProductCenterService;
  }
  return mockProductCenterService;
}
