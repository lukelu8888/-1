/**
 * Product Center — domain types
 * ------------------------------------------------------------------
 * These types are the single source of truth for the Product Management
 * Center. They are designed to map 1:1 with the Supabase schema in
 * `supabase/migrations/20260503000000_product_center.sql` so we can move
 * from in-memory mocks to Postgres without changing the UI layer.
 *
 * Naming rules:
 *   - Type names use PascalCase singular (Product, ProductPrice).
 *   - Field names use camelCase in TS, snake_case in SQL — service layer
 *     should map between them.
 *   - All entities carry `id`, `createdAt`, `updatedAt`. Every business
 *     entity is also tenant-scoped (`tenantId`) and supports soft delete
 *     (`archivedAt`) in preparation for RLS + multi-tenant rollout.
 */

// ─── Region / Tenant ─────────────────────────────────────────────────────────

export type RegionCode = 'NA' | 'SA' | 'EA';

export interface RegionDescriptor {
  code: RegionCode;
  name: string;            // 中文
  nameEn: string;          // English
  flag: string;
  currency: string;        // ISO 4217
  defaultLocale: string;   // BCP 47 e.g. en-US
}

// ─── Status enums ────────────────────────────────────────────────────────────

export type ProductStatus = 'draft' | 'active' | 'disabled' | 'archived';

export type ReviewStatus =
  | 'not_submitted'
  | 'pending_review'
  | 'approved'
  | 'rejected';

export type PublishStatus =
  | 'not_published'
  | 'scheduled'
  | 'published'
  | 'paused'
  | 'unpublished'
  | 'archived';

export type CampaignStatus = 'no_campaign' | 'scheduled' | 'active' | 'paused' | 'ended';

// ─── Core: products ──────────────────────────────────────────────────────────

export interface Product {
  id: string;
  tenantId: string;

  sku: string;
  spu?: string;
  name: string;
  nameEn?: string;
  nameZh?: string;

  brand?: string;
  productType?: string;            // e.g. "Standard", "OEM/ODM"
  shortDescription?: string;
  longDescription?: string;
  keywords?: string[];
  tags?: string[];

  thumbnailUrl?: string;
  primaryCategoryId?: string;       // 官网主分类
  internalCategory?: string;        // 内部分类（自由文本/编码）

  status: ProductStatus;            // 主状态
  reviewStatus: ReviewStatus;       // 审核状态
  campaignStatus: CampaignStatus;   // 活动聚合状态

  // 物理 / 包装 默认值（区域无关）
  unit?: string;
  netWeight?: number;
  grossWeight?: number;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
  moq?: number;
  unitsPerCarton?: number;
  cbm?: number;
  qty20gp?: number;
  qty40hq?: number;
  hsCode?: string;
  port?: string;
  leadTimeDays?: number;

  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
  archivedAt?: string | null;
}

// ─── Categories & Attributes ─────────────────────────────────────────────────

export interface ProductCategory {
  id: string;
  tenantId: string;
  parentId: string | null;
  level: 1 | 2 | 3;
  code: string;
  name: string;
  nameEn?: string;
  sortOrder: number;
  seoTitle?: string;
  seoDescription?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductCategoryRelation {
  id: string;
  productId: string;
  categoryId: string;
  isPrimary: boolean;
  createdAt: string;
}

export type AttributeDataType = 'text' | 'number' | 'enum' | 'multi_enum' | 'boolean';

export interface ProductAttribute {
  id: string;
  tenantId: string;
  code: string;                  // e.g. "color", "voltage"
  label: string;
  dataType: AttributeDataType;
  unit?: string;
  isFilterable: boolean;
  options?: string[];            // for enum types
  appliesToCategoryIds?: string[];
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductAttributeValue {
  id: string;
  productId: string;
  attributeId: string;
  valueText?: string;
  valueNumber?: number;
  valueBool?: boolean;
  valueOptions?: string[];
  createdAt: string;
  updatedAt: string;
}

// ─── Media & Documents ───────────────────────────────────────────────────────

export type MediaKind =
  | 'main'        // 主图
  | 'detail'      // 详情图
  | 'scene'       // 应用场景
  | 'aplus'       // A+ 页面图
  | 'video';

export interface ProductMedia {
  id: string;
  productId: string;
  kind: MediaKind;
  url: string;
  altText?: string;
  sortOrder: number;
  width?: number;
  height?: number;
  fileSize?: number;
  createdAt: string;
  updatedAt: string;
}

export type DocumentKind = 'spec_sheet' | 'manual' | 'certification' | 'other';

export interface ProductDocument {
  id: string;
  productId: string;
  kind: DocumentKind;
  name: string;
  url: string;
  validUntil?: string;
  issuedBy?: string;
  createdAt: string;
}

// ─── Suppliers, Costs ────────────────────────────────────────────────────────

export interface ProductSupplierLink {
  id: string;
  productId: string;
  supplierId: string;
  supplierName: string;
  supplierModelNo?: string;
  isPrimary: boolean;
  factoryQuotePrice?: number;
  factoryQuoteCurrency?: string;
  factoryQuoteMoq?: number;
  factoryQuoteAt?: string;
  costPrice?: number;
  costCurrency?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Region prices ───────────────────────────────────────────────────────────

export interface ProductRegionPrice {
  id: string;
  productId: string;
  regionCode: RegionCode;
  currency: string;
  basePrice: number;            // 建议销售价
  salePrice?: number;           // 区域售价
  campaignPrice?: number | null;// 活动价
  fxRate?: number;              // 汇率（成本→当地）
  shippingCost?: number;
  dutyAndLocalFee?: number;
  marginTarget?: number;        // 0-1 期望毛利率
  marginActual?: number;        // 0-1 实际毛利率
  effectiveFrom?: string;
  effectiveTo?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductPriceHistory {
  id: string;
  productId: string;
  regionCode: RegionCode;
  field: 'base' | 'sale' | 'campaign' | 'cost';
  fromValue: number | null;
  toValue: number | null;
  changedAt: string;
  changedBy?: string;
  reason?: string;
  /** When the new value should start being effective. Optional — null = immediate. */
  effectiveFrom?: string | null;
  /** Optional expiry of this version (next change supersedes if not set). */
  effectiveTo?: string | null;
}

/**
 * Composite cost model used by Pricing Center & detail page section 7.
 * Lets us derive the "landed cost" for a region without overwriting the
 * pure factory `cost_price`.
 */
export interface ProductCostBreakdown {
  factoryCost: number;
  fxRate: number;
  shippingPerUnit: number;
  dutyPercent: number;       // 0-1, e.g. 0.05 for 5%
  localFee: number;
  /** Computed total landed cost in the region currency. */
  landedCost: number;
}

export interface SupplierQuote {
  id: string;
  productId: string;
  supplierId: string;
  supplierName: string;
  supplierModelNo?: string;
  quotedPrice: number;
  currency: string;
  moq: number;
  validFrom?: string;
  validUntil?: string;
  incoterm?: 'EXW' | 'FOB' | 'CIF' | 'DDP';
  port?: string;
  notes?: string;
  isCurrent: boolean;
  createdAt: string;
  createdBy?: string;
}

// ─── Publishing ──────────────────────────────────────────────────────────────

export interface ProductPublishChannel {
  id: string;
  productId: string;
  regionCode: RegionCode;
  channel: 'website' | 'b2b_portal' | 'b2c_storefront' | 'campaign';
  publishStatus: PublishStatus;

  publishedCategoryId?: string;
  homepageFeatured: boolean;
  categoryFeatured: boolean;
  sortWeight: number;

  showPriceOnFrontend: boolean;
  allowInquiry: boolean;
  showMoq: boolean;
  showLeadTime: boolean;

  scheduledAt?: string;
  publishedAt?: string;
  pausedAt?: string;
  unpublishedAt?: string;
  unpublishReason?: string;

  seoTitle?: string;
  seoDescription?: string;
  seoSlug?: string;
  seoKeywords?: string[];

  createdAt: string;
  updatedAt: string;
}

export interface ProductPublishLog {
  id: string;
  productId: string;
  regionCode: RegionCode;
  channel: ProductPublishChannel['channel'];
  fromStatus: PublishStatus;
  toStatus: PublishStatus;
  actorName?: string;
  note?: string;
  occurredAt: string;
}

// ─── Campaigns / Deals ───────────────────────────────────────────────────────

export type CampaignTag = 'hot_sale' | 'new_arrival' | 'clearance' | 'limited_offer';

export type CampaignDisplaySlot =
  | 'homepage_banner'
  | 'homepage_strip'
  | 'category_hero'
  | 'category_strip'
  | 'cart_recommend';

export interface Campaign {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  regionCodes: RegionCode[];
  status: 'draft' | 'scheduled' | 'active' | 'paused' | 'ended';
  startsAt: string;
  endsAt: string;
  tag: CampaignTag;
  displaySlots: CampaignDisplaySlot[];
  description?: string;
  // analytics-ready (filled later by Phase 4)
  analyticsViewCount?: number;
  analyticsClickCount?: number;
  analyticsConversionCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignProduct {
  id: string;
  campaignId: string;
  productId: string;
  campaignPrice: number;
  currency: string;
  discountPercent?: number;
  createdAt: string;
}

// ─── Model mapping ───────────────────────────────────────────────────────────

export interface ModelMapping {
  id: string;
  tenantId: string;
  productId: string;          // 我方 SKU/Master
  internalSku: string;
  supplierSku?: string;
  customerModelNo?: string;
  factoryModelNo?: string;
  alternateModelNo?: string;
  packagingVariant?: string;
  brandVariant?: string;
  legacyModelNo?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Review history ─────────────────────────────────────────────────────────

export interface ReviewHistoryEntry {
  id: string;
  productId: string;
  fromStatus: ReviewStatus;
  toStatus: ReviewStatus;
  /** Free-form rejection reason or approval note. */
  reason?: string;
  actorName?: string;
  actorRole?: 'editor' | 'reviewer' | 'admin';
  /** Snapshot of missing-field flags at the moment of submission. */
  missingFlags?: string[];
  occurredAt: string;
}

// ─── Audit ───────────────────────────────────────────────────────────────────

export interface ProductAuditLog {
  id: string;
  productId: string;
  action: string;             // e.g. "publish", "pause", "edit_price"
  field?: string;
  fromValue?: string;
  toValue?: string;
  actorName?: string;
  actorRole?: string;
  occurredAt: string;
  note?: string;
}

// ─── UI helper types ─────────────────────────────────────────────────────────

export interface ProductListFilters {
  keyword?: string;
  region?: RegionCode | 'ALL';
  categoryId?: string;
  publishStatus?: PublishStatus | 'ALL';
  reviewStatus?: ReviewStatus | 'ALL';
  supplierId?: string;
  tag?: string;
  isCampaign?: boolean;
  missingImage?: boolean;
  missingPrice?: boolean;
  missingCategory?: boolean;
  createdFrom?: string;
  createdTo?: string;
  updatedFrom?: string;
  updatedTo?: string;
}

/**
 * Denormalized row for the PIM list grid. We compute this on the client
 * from the normalized entities so the table component doesn't have to
 * know the joins.
 */
export interface ProductListRow {
  product: Product;
  categoryName?: string;
  primarySupplierName?: string;
  costPrice?: number;
  costCurrency?: string;
  priceNA?: number;
  priceSA?: number;
  priceEA?: number;
  publishStatusByRegion: Record<RegionCode, PublishStatus>;
  hasMainImage: boolean;
  hasAnyPrice: boolean;
  hasCategory: boolean;
}
