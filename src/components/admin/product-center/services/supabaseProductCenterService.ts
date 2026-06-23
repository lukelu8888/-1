/**
 * Supabase implementation of ProductCenterService (Phase 4b).
 *
 * Mirrors the action surface of the in-memory store. All entity payloads
 * are expected in TypeScript camelCase; we map to/from the snake_case
 * column names in `pc_*` tables here so callers never see schema details.
 *
 * Atomic state transitions (review submit/approve/reject, bulk price
 * updates, publish status) call the Supabase RPCs defined in
 *   supabase/migrations/20260503020000_product_center_rls_and_rpcs.sql
 *
 * Tenant isolation is enforced by RLS on the database side; the service
 * does not need to filter by tenant_id manually.
 */

import { supabase } from '../../../../lib/supabase';
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
  ProductMedia,
  ProductPriceHistory,
  ProductPublishChannel,
  ProductRegionPrice,
  ProductSupplierLink,
  ProductTierPrice,
  RegionCode,
  ReviewHistoryEntry,
  SupplierQuote,
  TierIssue,
} from '../context/types';
import type { QuotationLineInput, QuotationLineResolved } from './productCenterService';
import type {
  AnalyticsRollup,
  BulkImportError,
  BulkImportResult,
  BulkImportRow,
  MediaUploadInput,
  ProductCenterService,
  ProductCenterSnapshot,
  ProductExportRow,
} from './productCenterService';

// ── helpers ────────────────────────────────────────────────────────────────

class PcSupabaseError extends Error {
  constructor(
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'PcSupabaseError';
  }
}

function unwrap<T>(payload: { data: T | null; error: unknown }, ctx: string): T {
  if (payload.error) {
    const msg =
      (payload.error as { message?: string })?.message ?? `unknown error in ${ctx}`;
    throw new PcSupabaseError(`[product-center] ${ctx}: ${msg}`, payload.error);
  }
  if (payload.data == null) {
    throw new PcSupabaseError(`[product-center] ${ctx}: empty response`);
  }
  return payload.data;
}

// camelCase → snake_case conversion only on a defined set of keys to keep
// the bundle small and predictable. Centralised here for unit-testability.

function pickProductColumns(p: Partial<Product>) {
  return stripUndefined({
    id: p.id,
    tenant_id: p.tenantId,
    sku: p.sku,
    spu: p.spu,
    name: p.name,
    name_en: p.nameEn,
    name_zh: p.nameZh,
    brand: p.brand,
    product_type: p.productType,
    short_description: p.shortDescription,
    long_description: p.longDescription,
    keywords: p.keywords,
    tags: p.tags,
    thumbnail_url: p.thumbnailUrl,
    primary_category_id: p.primaryCategoryId,
    internal_category: p.internalCategory,
    status: p.status,
    review_status: p.reviewStatus,
    campaign_status: p.campaignStatus === 'no_campaign' ? 'draft' : p.campaignStatus,
    unit: p.unit,
    net_weight: p.netWeight,
    gross_weight: p.grossWeight,
    length_cm: p.lengthCm,
    width_cm: p.widthCm,
    height_cm: p.heightCm,
    moq: p.moq,
    units_per_carton: p.unitsPerCarton,
    cbm: p.cbm,
    qty_20gp: p.qty20gp,
    qty_40hq: p.qty40hq,
    hs_code: p.hsCode,
    port: p.port,
    lead_time_days: p.leadTimeDays,
    created_by: p.createdBy,
    updated_by: p.updatedBy,
    archived_at: p.archivedAt,
  });
}

function stripUndefined<T extends Record<string, unknown>>(input: T): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(input)) {
    if (v !== undefined) out[k] = v;
  }
  return out as T;
}

function rowToProduct(row: Record<string, unknown>): Product {
  return {
    id: row.id as string,
    tenantId: row.tenant_id as string,
    sku: row.sku as string,
    spu: (row.spu as string) ?? undefined,
    name: row.name as string,
    nameEn: (row.name_en as string) ?? undefined,
    nameZh: (row.name_zh as string) ?? undefined,
    brand: (row.brand as string) ?? undefined,
    productType: (row.product_type as string) ?? undefined,
    shortDescription: (row.short_description as string) ?? undefined,
    longDescription: (row.long_description as string) ?? undefined,
    keywords: (row.keywords as string[]) ?? undefined,
    tags: (row.tags as string[]) ?? undefined,
    thumbnailUrl: (row.thumbnail_url as string) ?? undefined,
    primaryCategoryId: (row.primary_category_id as string) ?? undefined,
    internalCategory: (row.internal_category as string) ?? undefined,
    status: row.status as Product['status'],
    reviewStatus: row.review_status as Product['reviewStatus'],
    campaignStatus: (row.campaign_status as string) === 'draft'
      ? 'no_campaign'
      : (row.campaign_status as Product['campaignStatus']),
    unit: (row.unit as string) ?? undefined,
    netWeight: (row.net_weight as number) ?? undefined,
    grossWeight: (row.gross_weight as number) ?? undefined,
    lengthCm: (row.length_cm as number) ?? undefined,
    widthCm: (row.width_cm as number) ?? undefined,
    heightCm: (row.height_cm as number) ?? undefined,
    moq: (row.moq as number) ?? undefined,
    unitsPerCarton: (row.units_per_carton as number) ?? undefined,
    cbm: (row.cbm as number) ?? undefined,
    qty20gp: (row.qty_20gp as number) ?? undefined,
    qty40hq: (row.qty_40hq as number) ?? undefined,
    hsCode: (row.hs_code as string) ?? undefined,
    port: (row.port as string) ?? undefined,
    leadTimeDays: (row.lead_time_days as number) ?? undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    createdBy: (row.created_by as string) ?? undefined,
    updatedBy: (row.updated_by as string) ?? undefined,
    archivedAt: (row.archived_at as string) ?? null,
  };
}

function rowToRegionPrice(row: Record<string, unknown>): ProductRegionPrice {
  return {
    id: row.id as string,
    productId: row.product_id as string,
    regionCode: row.region_code as RegionCode,
    currency: row.currency as string,
    basePrice: row.base_price as number,
    salePrice: (row.sale_price as number) ?? undefined,
    campaignPrice: (row.campaign_price as number) ?? null,
    fxRate: (row.fx_rate as number) ?? undefined,
    shippingCost: (row.shipping_cost as number) ?? undefined,
    dutyAndLocalFee: (row.duty_and_local_fee as number) ?? undefined,
    marginTarget: (row.margin_target as number) ?? undefined,
    marginActual: (row.margin_actual as number) ?? undefined,
    effectiveFrom: (row.effective_from as string) ?? undefined,
    effectiveTo: (row.effective_to as string) ?? undefined,
    isActive: row.is_active as boolean,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function rowToPriceHistory(row: Record<string, unknown>): ProductPriceHistory {
  return {
    id: row.id as string,
    productId: row.product_id as string,
    regionCode: row.region_code as RegionCode,
    field: row.field as ProductPriceHistory['field'],
    fromValue: (row.from_value as number) ?? null,
    toValue: (row.to_value as number) ?? null,
    changedAt: row.changed_at as string,
    changedBy: (row.changed_by as string) ?? undefined,
    reason: (row.reason as string) ?? undefined,
    effectiveFrom: (row.effective_from as string) ?? null,
    effectiveTo: (row.effective_to as string) ?? null,
  };
}

function rowToPublishChannel(row: Record<string, unknown>): ProductPublishChannel {
  return {
    id: row.id as string,
    productId: row.product_id as string,
    regionCode: row.region_code as RegionCode,
    channel: row.channel as ProductPublishChannel['channel'],
    publishStatus: row.publish_status as ProductPublishChannel['publishStatus'],
    publishedCategoryId: (row.published_category_id as string) ?? undefined,
    homepageFeatured: row.homepage_featured as boolean,
    categoryFeatured: row.category_featured as boolean,
    sortWeight: row.sort_weight as number,
    showPriceOnFrontend: row.show_price_on_frontend as boolean,
    allowInquiry: row.allow_inquiry as boolean,
    showMoq: row.show_moq as boolean,
    showLeadTime: row.show_lead_time as boolean,
    scheduledAt: (row.scheduled_at as string) ?? undefined,
    publishedAt: (row.published_at as string) ?? undefined,
    pausedAt: (row.paused_at as string) ?? undefined,
    unpublishedAt: (row.unpublished_at as string) ?? undefined,
    unpublishReason: (row.unpublish_reason as string) ?? undefined,
    seoTitle: (row.seo_title as string) ?? undefined,
    seoDescription: (row.seo_description as string) ?? undefined,
    seoSlug: (row.seo_slug as string) ?? undefined,
    seoKeywords: (row.seo_keywords as string[]) ?? undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function rowToCampaign(row: Record<string, unknown>): Campaign {
  return {
    id: row.id as string,
    tenantId: row.tenant_id as string,
    name: row.name as string,
    code: row.code as string,
    regionCodes: (row.region_codes as RegionCode[]) ?? [],
    status: row.status as Campaign['status'],
    startsAt: row.starts_at as string,
    endsAt: row.ends_at as string,
    tag: row.tag as Campaign['tag'],
    displaySlots: (row.display_slots as Campaign['displaySlots']) ?? [],
    description: (row.description as string) ?? undefined,
    analyticsViewCount: (row.analytics_view_count as number) ?? undefined,
    analyticsClickCount: (row.analytics_click_count as number) ?? undefined,
    analyticsConversionCount: (row.analytics_conversion_count as number) ?? undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function rowToCampaignProduct(row: Record<string, unknown>): CampaignProduct {
  return {
    id: row.id as string,
    campaignId: row.campaign_id as string,
    productId: row.product_id as string,
    campaignPrice: row.campaign_price as number,
    currency: row.currency as string,
    discountPercent: (row.discount_percent as number) ?? undefined,
    createdAt: row.created_at as string,
  };
}

function rowToMapping(row: Record<string, unknown>): ModelMapping {
  return {
    id: row.id as string,
    tenantId: row.tenant_id as string,
    productId: row.product_id as string,
    internalSku: row.internal_sku as string,
    supplierSku: (row.supplier_sku as string) ?? undefined,
    customerModelNo: (row.customer_model_no as string) ?? undefined,
    factoryModelNo: (row.factory_model_no as string) ?? undefined,
    alternateModelNo: (row.alternate_model_no as string) ?? undefined,
    packagingVariant: (row.packaging_variant as string) ?? undefined,
    brandVariant: (row.brand_variant as string) ?? undefined,
    legacyModelNo: (row.legacy_model_no as string) ?? undefined,
    notes: (row.notes as string) ?? undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function rowToReviewHistory(row: Record<string, unknown>): ReviewHistoryEntry {
  return {
    id: row.id as string,
    productId: row.product_id as string,
    fromStatus: row.from_status as ReviewHistoryEntry['fromStatus'],
    toStatus: row.to_status as ReviewHistoryEntry['toStatus'],
    reason: (row.reason as string) ?? undefined,
    actorName: (row.actor_name as string) ?? undefined,
    actorRole: (row.actor_role as ReviewHistoryEntry['actorRole']) ?? undefined,
    missingFlags: (row.missing_flags as string[]) ?? undefined,
    occurredAt: row.occurred_at as string,
  };
}

function rowToSupplierQuote(row: Record<string, unknown>): SupplierQuote {
  return {
    id: row.id as string,
    productId: row.product_id as string,
    supplierId: row.supplier_id as string,
    supplierName: row.supplier_name as string,
    supplierModelNo: (row.supplier_model_no as string) ?? undefined,
    quotedPrice: row.quoted_price as number,
    currency: row.currency as string,
    moq: row.moq as number,
    validFrom: (row.valid_from as string) ?? undefined,
    validUntil: (row.valid_until as string) ?? undefined,
    incoterm: (row.incoterm as SupplierQuote['incoterm']) ?? undefined,
    port: (row.port as string) ?? undefined,
    notes: (row.notes as string) ?? undefined,
    isCurrent: row.is_current as boolean,
    createdAt: row.created_at as string,
    createdBy: (row.created_by as string) ?? undefined,
  };
}

function rowToAuditLog(row: Record<string, unknown>): ProductAuditLog {
  return {
    id: row.id as string,
    productId: row.product_id as string,
    action: row.action as string,
    field: (row.field as string) ?? undefined,
    fromValue: (row.from_value as string) ?? undefined,
    toValue: (row.to_value as string) ?? undefined,
    actorName: (row.actor_name as string) ?? undefined,
    actorRole: (row.actor_role as string) ?? undefined,
    note: (row.note as string) ?? undefined,
    occurredAt: row.occurred_at as string,
  };
}

// ── additional row converters needed for loadAll ───────────────────────

function rowToCategory(row: Record<string, unknown>): ProductCategory {
  return {
    id: row.id as string,
    tenantId: row.tenant_id as string,
    parentId: (row.parent_id as string) ?? null,
    level: Number(row.level ?? 1),
    code: row.code as string,
    name: row.name as string,
    nameEn: (row.name_en as string) ?? undefined,
    sortOrder: row.sort_order as number,
    seoTitle: (row.seo_title as string) ?? undefined,
    seoDescription: (row.seo_description as string) ?? undefined,
    isActive: row.is_active as boolean,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function rowToAttribute(row: Record<string, unknown>): ProductAttribute {
  return {
    id: row.id as string,
    tenantId: row.tenant_id as string,
    code: row.code as string,
    label: row.label as string,
    dataType: row.data_type as ProductAttribute['dataType'],
    unit: (row.unit as string) ?? undefined,
    isFilterable: row.is_filterable as boolean,
    options: (row.options as string[]) ?? undefined,
    appliesToCategoryIds: (row.applies_to_category_ids as string[]) ?? undefined,
    sortOrder: row.sort_order as number,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function rowToAttributeValue(row: Record<string, unknown>): ProductAttributeValue {
  return {
    id: row.id as string,
    productId: row.product_id as string,
    attributeId: row.attribute_id as string,
    valueText: (row.value_text as string) ?? undefined,
    valueNumber: (row.value_number as number) ?? undefined,
    valueBool: (row.value_bool as boolean) ?? undefined,
    valueOptions: (row.value_options as string[]) ?? undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function rowToMedia(row: Record<string, unknown>): ProductMedia {
  return {
    id: row.id as string,
    productId: row.product_id as string,
    kind: row.kind as ProductMedia['kind'],
    url: row.url as string,
    altText: (row.alt_text as string) ?? undefined,
    sortOrder: row.sort_order as number,
    width: (row.width as number) ?? undefined,
    height: (row.height as number) ?? undefined,
    fileSize: (row.file_size as number) ?? undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function rowToCustomerTier(row: Record<string, unknown>): CustomerTier {
  return {
    id: row.id as string,
    tenantId: row.tenant_id as string,
    code: row.code as string,
    name: row.name as string,
    defaultDiscountPercent: Number(row.default_discount_percent ?? 0),
    badgeColor: (row.badge_color as string) ?? undefined,
    sortOrder: Number(row.sort_order ?? 0),
    isActive: Boolean(row.is_active),
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function rowToCustomer(row: Record<string, unknown>): Customer {
  return {
    id: row.id as string,
    tenantId: row.tenant_id as string,
    code: row.code as string,
    name: row.name as string,
    shortName: (row.short_name as string) ?? undefined,
    regionCode: (row.region_code as RegionCode | null) ?? null,
    tierId: (row.tier_id as string | null) ?? null,
    defaultIncoterm: (row.default_incoterm as Customer['defaultIncoterm']) ?? undefined,
    defaultPaymentTerms: (row.default_payment_terms as string) ?? undefined,
    notes: (row.notes as string) ?? undefined,
    isActive: Boolean(row.is_active),
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function rowToCustomerSpecificPrice(row: Record<string, unknown>): CustomerSpecificPrice {
  return {
    id: row.id as string,
    customerId: row.customer_id as string,
    productId: row.product_id as string,
    regionCode: row.region_code as RegionCode,
    minQty: Number(row.min_qty),
    maxQty: row.max_qty == null ? null : Number(row.max_qty),
    unitPrice: Number(row.unit_price),
    currency: row.currency as string,
    incoterm: (row.incoterm as CustomerSpecificPrice['incoterm']) ?? undefined,
    effectiveFrom: (row.effective_from as string | null) ?? null,
    effectiveTo: (row.effective_to as string | null) ?? null,
    isActive: Boolean(row.is_active),
    notes: (row.notes as string) ?? undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function rowToTierPrice(row: Record<string, unknown>): ProductTierPrice {
  return {
    id: row.id as string,
    productId: row.product_id as string,
    regionCode: row.region_code as RegionCode,
    minQty: Number(row.min_qty),
    maxQty: row.max_qty == null ? null : Number(row.max_qty),
    unitPrice: Number(row.unit_price),
    currency: row.currency as string,
    discountPercent:
      row.discount_percent == null ? undefined : Number(row.discount_percent),
    incoterm: (row.incoterm as ProductTierPrice['incoterm']) ?? undefined,
    effectiveFrom: (row.effective_from as string | null) ?? null,
    effectiveTo: (row.effective_to as string | null) ?? null,
    isActive: Boolean(row.is_active),
    notes: (row.notes as string) ?? undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function rowToSupplierLink(row: Record<string, unknown>): ProductSupplierLink {
  return {
    id: row.id as string,
    productId: row.product_id as string,
    supplierId: row.supplier_id as string,
    supplierName: row.supplier_name as string,
    supplierModelNo: (row.supplier_model_no as string) ?? undefined,
    isPrimary: row.is_primary as boolean,
    factoryQuotePrice: (row.factory_quote_price as number) ?? undefined,
    factoryQuoteCurrency: (row.factory_quote_currency as string) ?? undefined,
    factoryQuoteMoq: (row.factory_quote_moq as number) ?? undefined,
    factoryQuoteAt: (row.factory_quote_at as string) ?? undefined,
    costPrice: (row.cost_price as number) ?? undefined,
    costCurrency: (row.cost_currency as string) ?? undefined,
    notes: (row.notes as string) ?? undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

// ── service ────────────────────────────────────────────────────────────────

export const supabaseProductCenterService: ProductCenterService = {
  // ── Bootstrap ──────────────────────────────────────────────────────────
  async loadAll(): Promise<ProductCenterSnapshot> {
    const [
      products,
      categories,
      attributes,
      attributeValues,
      media,
      suppliers,
      regionPrices,
      tierPrices,
      customerTiers,
      customers,
      customerSpecificPrices,
      publishChannels,
      campaigns,
      campaignProducts,
      mappings,
      auditLogs,
      priceHistory,
      supplierQuotes,
      reviewHistory,
    ] = await Promise.all([
      supabase.from('pc_products').select('*').is('archived_at', null),
      supabase.from('pc_product_categories').select('*'),
      supabase.from('pc_product_attributes').select('*'),
      supabase.from('pc_product_attribute_values').select('*'),
      supabase.from('pc_product_media').select('*'),
      supabase.from('pc_product_suppliers').select('*'),
      supabase.from('pc_product_region_prices').select('*'),
      supabase
        .from('pc_product_tier_prices')
        .select('*')
        .order('product_id', { ascending: true })
        .order('region_code', { ascending: true })
        .order('min_qty', { ascending: true }),
      supabase
        .from('pc_customer_tiers')
        .select('*')
        .order('sort_order', { ascending: true }),
      supabase
        .from('pc_customers')
        .select('*')
        .order('name', { ascending: true }),
      supabase
        .from('pc_customer_specific_prices')
        .select('*')
        .order('product_id', { ascending: true })
        .order('region_code', { ascending: true })
        .order('min_qty', { ascending: true }),
      supabase.from('pc_product_publish_channels').select('*'),
      supabase.from('pc_campaigns').select('*'),
      supabase.from('pc_campaign_products').select('*'),
      supabase.from('pc_model_mappings').select('*'),
      supabase
        .from('pc_product_audit_logs')
        .select('*')
        .order('occurred_at', { ascending: false })
        .limit(500),
      supabase
        .from('pc_product_price_history')
        .select('*')
        .order('changed_at', { ascending: false })
        .limit(500),
      supabase.from('pc_supplier_quotes').select('*'),
      supabase
        .from('pc_review_history')
        .select('*')
        .order('occurred_at', { ascending: false })
        .limit(500),
    ]);

    const errors = [
      products.error,
      categories.error,
      attributes.error,
      attributeValues.error,
      media.error,
      suppliers.error,
      regionPrices.error,
      tierPrices.error,
      customerTiers.error,
      customers.error,
      customerSpecificPrices.error,
      publishChannels.error,
      campaigns.error,
      campaignProducts.error,
      mappings.error,
      auditLogs.error,
      priceHistory.error,
      supplierQuotes.error,
      reviewHistory.error,
    ].filter(Boolean);
    if (errors.length > 0) {
      throw new PcSupabaseError(`loadAll partial failure: ${errors[0]?.message}`, errors);
    }

    return {
      products: ((products.data as Array<Record<string, unknown>>) ?? []).map(rowToProduct),
      categories: ((categories.data as Array<Record<string, unknown>>) ?? []).map(rowToCategory),
      attributes: ((attributes.data as Array<Record<string, unknown>>) ?? []).map(rowToAttribute),
      attributeValues: ((attributeValues.data as Array<Record<string, unknown>>) ?? []).map(
        rowToAttributeValue,
      ),
      media: ((media.data as Array<Record<string, unknown>>) ?? []).map(rowToMedia),
      suppliers: ((suppliers.data as Array<Record<string, unknown>>) ?? []).map(rowToSupplierLink),
      regionPrices: ((regionPrices.data as Array<Record<string, unknown>>) ?? []).map(
        rowToRegionPrice,
      ),
      tierPrices: ((tierPrices.data as Array<Record<string, unknown>>) ?? []).map(
        rowToTierPrice,
      ),
      customerTiers: ((customerTiers.data as Array<Record<string, unknown>>) ?? []).map(
        rowToCustomerTier,
      ),
      customers: ((customers.data as Array<Record<string, unknown>>) ?? []).map(rowToCustomer),
      customerSpecificPrices: (
        (customerSpecificPrices.data as Array<Record<string, unknown>>) ?? []
      ).map(rowToCustomerSpecificPrice),
      publishChannels: ((publishChannels.data as Array<Record<string, unknown>>) ?? []).map(
        rowToPublishChannel,
      ),
      campaigns: ((campaigns.data as Array<Record<string, unknown>>) ?? []).map(rowToCampaign),
      campaignProducts: ((campaignProducts.data as Array<Record<string, unknown>>) ?? []).map(
        rowToCampaignProduct,
      ),
      mappings: ((mappings.data as Array<Record<string, unknown>>) ?? []).map(rowToMapping),
      auditLogs: ((auditLogs.data as Array<Record<string, unknown>>) ?? []).map(rowToAuditLog),
      priceHistory: ((priceHistory.data as Array<Record<string, unknown>>) ?? []).map(
        rowToPriceHistory,
      ),
      supplierQuotes: ((supplierQuotes.data as Array<Record<string, unknown>>) ?? []).map(
        rowToSupplierQuote,
      ),
      reviewHistory: ((reviewHistory.data as Array<Record<string, unknown>>) ?? []).map(
        rowToReviewHistory,
      ),
    };
  },

  // ── Products ───────────────────────────────────────────────────────────
  async upsertProduct(input) {
    const row = pickProductColumns(input);
    const res = await supabase
      .from('pc_products')
      .upsert(row, { onConflict: 'id' })
      .select('*')
      .single();
    return rowToProduct(unwrap(res, 'upsertProduct') as Record<string, unknown>);
  },
  async removeProduct(id) {
    const res = await supabase.from('pc_products').delete().eq('id', id);
    if (res.error) throw new PcSupabaseError('removeProduct', res.error);
  },
  async archiveProduct(id) {
    const res = await supabase
      .from('pc_products')
      .update({ archived_at: new Date().toISOString(), status: 'archived' })
      .eq('id', id);
    if (res.error) throw new PcSupabaseError('archiveProduct', res.error);
  },

  // ── Pricing ────────────────────────────────────────────────────────────
  async upsertRegionPrice(input, opts) {
    const payload = stripUndefined({
      id: input.id,
      product_id: input.productId,
      region_code: input.regionCode,
      currency: input.currency,
      base_price: input.basePrice,
      sale_price: input.salePrice,
      campaign_price: input.campaignPrice,
      fx_rate: input.fxRate,
      shipping_cost: input.shippingCost,
      duty_and_local_fee: input.dutyAndLocalFee,
      margin_target: input.marginTarget,
      margin_actual: input.marginActual,
      effective_from: input.effectiveFrom,
      effective_to: input.effectiveTo,
      is_active: input.isActive,
    });
    const res = await supabase
      .from('pc_product_region_prices')
      .upsert(payload, { onConflict: 'product_id,region_code' })
      .select('*')
      .single();
    const data = rowToRegionPrice(
      unwrap(res, 'upsertRegionPrice') as Record<string, unknown>,
    );
    if (opts?.reason) {
      await supabase.from('pc_product_audit_logs').insert({
        product_id: data.productId,
        action: 'edit_price',
        field: input.regionCode,
        note: opts.reason,
      });
    }
    return data;
  },
  async bulkUpdatePrices({ productIds, region, field, mode, value, reason }) {
    const fieldEnum =
      field === 'basePrice' ? 'base' : field === 'salePrice' ? 'sale' : 'campaign';
    const res = await supabase.rpc('pc_bulk_update_prices', {
      p_product_ids: productIds,
      p_region: region,
      p_field: fieldEnum,
      p_mode: mode,
      p_value: value,
      p_reason: reason ?? null,
      p_actor_name: null,
    });
    if (res.error) throw new PcSupabaseError('bulkUpdatePrices', res.error);
    return { touched: (res.data as number) ?? 0 };
  },
  async appendPriceHistory(entry) {
    const payload = stripUndefined({
      product_id: entry.productId,
      region_code: entry.regionCode,
      field: entry.field,
      from_value: entry.fromValue,
      to_value: entry.toValue,
      changed_by: entry.changedBy,
      reason: entry.reason,
      effective_from: entry.effectiveFrom,
      effective_to: entry.effectiveTo,
    });
    const res = await supabase
      .from('pc_product_price_history')
      .insert(payload)
      .select('*')
      .single();
    return rowToPriceHistory(
      unwrap(res, 'appendPriceHistory') as Record<string, unknown>,
    );
  },

  // ── Publishing ─────────────────────────────────────────────────────────
  async upsertPublishChannel(channel) {
    const payload = stripUndefined({
      id: channel.id,
      product_id: channel.productId,
      region_code: channel.regionCode,
      channel: channel.channel,
      publish_status: channel.publishStatus,
      published_category_id: channel.publishedCategoryId,
      homepage_featured: channel.homepageFeatured,
      category_featured: channel.categoryFeatured,
      sort_weight: channel.sortWeight,
      show_price_on_frontend: channel.showPriceOnFrontend,
      allow_inquiry: channel.allowInquiry,
      show_moq: channel.showMoq,
      show_lead_time: channel.showLeadTime,
      scheduled_at: channel.scheduledAt,
      published_at: channel.publishedAt,
      paused_at: channel.pausedAt,
      unpublished_at: channel.unpublishedAt,
      unpublish_reason: channel.unpublishReason,
      seo_title: channel.seoTitle,
      seo_description: channel.seoDescription,
      seo_slug: channel.seoSlug,
      seo_keywords: channel.seoKeywords,
    });
    const res = await supabase
      .from('pc_product_publish_channels')
      .upsert(payload, { onConflict: 'product_id,region_code,channel' })
      .select('*')
      .single();
    return rowToPublishChannel(
      unwrap(res, 'upsertPublishChannel') as Record<string, unknown>,
    );
  },
  async patchPublishChannel(productId, region, patch) {
    if (patch.publishStatus) {
      const res = await supabase.rpc('pc_set_publish_status', {
        p_product_id: productId,
        p_region_code: region,
        p_channel: 'website',
        p_to: patch.publishStatus,
        p_actor_name: null,
        p_note: patch.unpublishReason ?? null,
      });
      if (res.error) throw new PcSupabaseError('patchPublishChannel', res.error);
      return rowToPublishChannel(res.data as Record<string, unknown>);
    }
    const res = await supabase
      .from('pc_product_publish_channels')
      .update(stripUndefined(camelToSnake(patch)))
      .eq('product_id', productId)
      .eq('region_code', region)
      .eq('channel', 'website')
      .select('*')
      .single();
    return rowToPublishChannel(
      unwrap(res, 'patchPublishChannel') as Record<string, unknown>,
    );
  },

  // ── Attributes ─────────────────────────────────────────────────────────
  async upsertAttributeValue(input) {
    const payload = stripUndefined({
      id: input.id || undefined,
      product_id: input.productId,
      attribute_id: input.attributeId,
      value_text: input.valueText,
      value_number: input.valueNumber,
      value_bool: input.valueBool,
      value_options: input.valueOptions,
    });
    const res = await supabase
      .from('pc_product_attribute_values')
      .upsert(payload, { onConflict: 'product_id,attribute_id' })
      .select('*')
      .single();
    const row = unwrap(res, 'upsertAttributeValue') as Record<string, unknown>;
    return {
      id: row.id as string,
      productId: row.product_id as string,
      attributeId: row.attribute_id as string,
      valueText: (row.value_text as string) ?? undefined,
      valueNumber: (row.value_number as number) ?? undefined,
      valueBool: (row.value_bool as boolean) ?? undefined,
      valueOptions: (row.value_options as string[]) ?? undefined,
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
    };
  },
  async removeAttributeValue(id) {
    const res = await supabase.from('pc_product_attribute_values').delete().eq('id', id);
    if (res.error) throw new PcSupabaseError('removeAttributeValue', res.error);
  },

  // ── Categories ────────────────────────────────────────────────────────
  async upsertCategory(input) {
    const payload = stripUndefined({
      id: input.id,
      tenant_id: input.tenantId,
      parent_id: input.parentId,
      level: input.level,
      code: input.code,
      name: input.name,
      name_en: input.nameEn,
      sort_order: input.sortOrder,
      seo_title: input.seoTitle,
      seo_description: input.seoDescription,
      is_active: input.isActive,
    });
    const res = await supabase
      .from('pc_product_categories')
      .upsert(payload, { onConflict: 'id' })
      .select('*')
      .single();
    return rowToCategory(unwrap(res, 'upsertCategory') as Record<string, unknown>);
  },
  async removeCategory(id) {
    const res = await supabase.from('pc_product_categories').delete().eq('id', id);
    if (res.error) throw new PcSupabaseError('removeCategory', res.error);
  },

  // ── Suppliers ──────────────────────────────────────────────────────────
  async addSupplierQuote(input) {
    // Demote previous quotes from same supplier+product to historic rows.
    await supabase
      .from('pc_supplier_quotes')
      .update({ is_current: false })
      .eq('product_id', input.productId)
      .eq('supplier_id', input.supplierId)
      .eq('is_current', true);

    const payload = stripUndefined({
      product_id: input.productId,
      supplier_id: input.supplierId,
      supplier_name: input.supplierName,
      supplier_model_no: input.supplierModelNo,
      quoted_price: input.quotedPrice,
      currency: input.currency,
      moq: input.moq,
      valid_from: input.validFrom,
      valid_until: input.validUntil,
      incoterm: input.incoterm,
      port: input.port,
      notes: input.notes,
      is_current: true,
      created_by: input.createdBy,
    });
    const res = await supabase
      .from('pc_supplier_quotes')
      .insert(payload)
      .select('*')
      .single();
    return rowToSupplierQuote(
      unwrap(res, 'addSupplierQuote') as Record<string, unknown>,
    );
  },
  async setCurrentSupplierQuote(id) {
    const { data: row, error } = await supabase
      .from('pc_supplier_quotes')
      .select('product_id, supplier_id')
      .eq('id', id)
      .single();
    if (error || !row) throw new PcSupabaseError('setCurrentSupplierQuote:lookup', error);
    await supabase
      .from('pc_supplier_quotes')
      .update({ is_current: false })
      .eq('product_id', (row as { product_id: string }).product_id)
      .eq('supplier_id', (row as { supplier_id: string }).supplier_id);
    const res = await supabase
      .from('pc_supplier_quotes')
      .update({ is_current: true })
      .eq('id', id);
    if (res.error) throw new PcSupabaseError('setCurrentSupplierQuote', res.error);
  },
  async removeSupplierQuote(id) {
    const res = await supabase.from('pc_supplier_quotes').delete().eq('id', id);
    if (res.error) throw new PcSupabaseError('removeSupplierQuote', res.error);
  },

  // ── Campaigns ──────────────────────────────────────────────────────────
  async upsertCampaign(input) {
    const payload = stripUndefined({
      id: input.id,
      tenant_id: input.tenantId,
      name: input.name,
      code: input.code,
      region_codes: input.regionCodes,
      status: input.status,
      starts_at: input.startsAt,
      ends_at: input.endsAt,
      tag: input.tag,
      display_slots: input.displaySlots,
      description: input.description,
    });
    const res = await supabase
      .from('pc_campaigns')
      .upsert(payload, { onConflict: 'id' })
      .select('*')
      .single();
    return rowToCampaign(unwrap(res, 'upsertCampaign') as Record<string, unknown>);
  },
  async setCampaignStatus(id, status) {
    const res = await supabase.from('pc_campaigns').update({ status }).eq('id', id);
    if (res.error) throw new PcSupabaseError('setCampaignStatus', res.error);
  },
  async addProductsToCampaign(campaignId, productIds, opts) {
    if (productIds.length === 0) return { created: 0 };
    const { data: priceRows } = await supabase
      .from('pc_product_region_prices')
      .select('product_id, base_price, currency, region_code')
      .in('product_id', productIds);
    const baseByProduct = new Map<string, { price: number; currency: string }>();
    for (const r of (priceRows as Array<Record<string, unknown>>) ?? []) {
      if (!baseByProduct.has(r.product_id as string)) {
        baseByProduct.set(r.product_id as string, {
          price: r.base_price as number,
          currency: r.currency as string,
        });
      }
    }
    const rows = productIds.map((pid) => {
      const base = baseByProduct.get(pid);
      const basePrice = base?.price ?? 0;
      const discount = opts?.discountPercent ?? 0;
      return {
        campaign_id: campaignId,
        product_id: pid,
        campaign_price: discount > 0 ? basePrice * (1 - discount / 100) : basePrice,
        currency: base?.currency ?? 'USD',
        discount_percent: discount > 0 ? discount : null,
      };
    });
    const res = await supabase
      .from('pc_campaign_products')
      .insert(rows)
      .select('id');
    if (res.error) throw new PcSupabaseError('addProductsToCampaign', res.error);
    return { created: ((res.data as unknown[]) ?? []).length };
  },
  async removeProductFromCampaign(campaignId, productId) {
    const res = await supabase
      .from('pc_campaign_products')
      .delete()
      .eq('campaign_id', campaignId)
      .eq('product_id', productId);
    if (res.error) throw new PcSupabaseError('removeProductFromCampaign', res.error);
  },
  async updateCampaignProduct(input) {
    const res = await supabase
      .from('pc_campaign_products')
      .update(
        stripUndefined({
          campaign_price: input.campaignPrice,
          currency: input.currency,
          discount_percent: input.discountPercent,
        }),
      )
      .eq('id', input.id)
      .select('*')
      .single();
    return rowToCampaignProduct(
      unwrap(res, 'updateCampaignProduct') as Record<string, unknown>,
    );
  },

  // ── Mappings ───────────────────────────────────────────────────────────
  async upsertMapping(input) {
    const payload = stripUndefined({
      id: input.id,
      tenant_id: input.tenantId,
      product_id: input.productId,
      internal_sku: input.internalSku,
      supplier_sku: input.supplierSku,
      customer_model_no: input.customerModelNo,
      factory_model_no: input.factoryModelNo,
      alternate_model_no: input.alternateModelNo,
      packaging_variant: input.packagingVariant,
      brand_variant: input.brandVariant,
      legacy_model_no: input.legacyModelNo,
      notes: input.notes,
    });
    const res = await supabase
      .from('pc_model_mappings')
      .upsert(payload, { onConflict: 'id' })
      .select('*')
      .single();
    return rowToMapping(unwrap(res, 'upsertMapping') as Record<string, unknown>);
  },
  async removeMapping(id) {
    const res = await supabase.from('pc_model_mappings').delete().eq('id', id);
    if (res.error) throw new PcSupabaseError('removeMapping', res.error);
  },

  // ── Review workflow (RPC-backed) ───────────────────────────────────────
  async submitForReview(productId, note) {
    const res = await supabase.rpc('pc_submit_for_review', {
      p_product_id: productId,
      p_note: note ?? null,
      p_missing_flags: null,
      p_actor_name: null,
    });
    if (res.error) throw new PcSupabaseError('submitForReview', res.error);
    return rowToReviewHistory(res.data as Record<string, unknown>);
  },
  async approveProduct(productId, note) {
    const res = await supabase.rpc('pc_approve_product', {
      p_product_id: productId,
      p_note: note ?? null,
      p_actor_name: null,
    });
    if (res.error) throw new PcSupabaseError('approveProduct', res.error);
    return rowToReviewHistory(res.data as Record<string, unknown>);
  },
  async rejectProduct(productId, reason) {
    const res = await supabase.rpc('pc_reject_product', {
      p_product_id: productId,
      p_reason: reason,
      p_actor_name: null,
    });
    if (res.error) throw new PcSupabaseError('rejectProduct', res.error);
    return rowToReviewHistory(res.data as Record<string, unknown>);
  },
  async returnToDraft(productId, reason) {
    const res = await supabase.rpc('pc_return_to_draft', {
      p_product_id: productId,
      p_reason: reason,
      p_actor_name: null,
    });
    if (res.error) throw new PcSupabaseError('returnToDraft', res.error);
    return rowToReviewHistory(res.data as Record<string, unknown>);
  },

  // ── Audit ──────────────────────────────────────────────────────────────
  async logAudit(entry) {
    const payload = stripUndefined({
      product_id: entry.productId,
      action: entry.action,
      field: entry.field,
      from_value: entry.fromValue,
      to_value: entry.toValue,
      actor_name: entry.actorName,
      actor_role: entry.actorRole,
      note: entry.note,
    });
    const res = await supabase
      .from('pc_product_audit_logs')
      .insert(payload)
      .select('*')
      .single();
    return rowToAuditLog(unwrap(res, 'logAudit') as Record<string, unknown>);
  },

  // ── Phase 4d: search / export / analytics ────────────────────────────────
  async searchProducts({ keyword, limit }) {
    const res = await supabase.rpc('pc_search_products', {
      p_keyword: keyword?.trim() ? keyword.trim() : null,
      p_limit: limit ?? 200,
    });
    if (res.error) throw new PcSupabaseError('searchProducts', res.error);
    const rows = (res.data as Array<Record<string, unknown>>) ?? [];
    return rows.map(rowToProduct);
  },

  async exportProducts({ region, status }): Promise<ProductExportRow[]> {
    const res = await supabase.rpc('pc_export_products', {
      p_region: region ?? null,
      p_status: status ?? null,
    });
    if (res.error) throw new PcSupabaseError('exportProducts', res.error);
    const rows = (res.data as Array<Record<string, unknown>>) ?? [];
    return rows.map((r) => ({
      sku: (r.sku as string) ?? '',
      name: (r.name as string) ?? '',
      nameEn: (r.name_en as string | null) ?? null,
      nameZh: (r.name_zh as string | null) ?? null,
      brand: (r.brand as string | null) ?? null,
      status: (r.status as string) ?? '',
      reviewStatus: (r.review_status as string) ?? '',
      primaryCategoryCode: (r.primary_category_code as string | null) ?? null,
      primaryCategoryName: (r.primary_category_name as string | null) ?? null,
      region: (r.region as string | null) ?? null,
      currency: (r.currency as string | null) ?? null,
      basePrice: (r.base_price as number | null) ?? null,
      salePrice: (r.sale_price as number | null) ?? null,
      campaignPrice: (r.campaign_price as number | null) ?? null,
      publishStatus: (r.publish_status as string) ?? 'not_published',
      homepageFeatured: Boolean(r.homepage_featured),
      categoryFeatured: Boolean(r.category_featured),
      seoTitle: (r.seo_title as string | null) ?? null,
      seoSlug: (r.seo_slug as string | null) ?? null,
      primarySupplier: (r.primary_supplier as string | null) ?? null,
      costPrice: (r.cost_price as number | null) ?? null,
      costCurrency: (r.cost_currency as string | null) ?? null,
      hsCode: (r.hs_code as string | null) ?? null,
      moq: (r.moq as number | null) ?? null,
      unitsPerCarton: (r.units_per_carton as number | null) ?? null,
      leadTimeDays: (r.lead_time_days as number | null) ?? null,
      updatedAt: (r.updated_at as string) ?? new Date().toISOString(),
    }));
  },

  async getAnalyticsRollup(opts): Promise<AnalyticsRollup> {
    const res = await supabase.rpc('pc_analytics_rollup', {
      p_region: opts?.region ?? null,
    });
    if (res.error) throw new PcSupabaseError('getAnalyticsRollup', res.error);
    const data = (res.data ?? {}) as Record<string, unknown>;
    const totalsRow = (data.totals ?? {}) as Record<string, number>;
    const psbr = (data.publish_status_by_region ?? {}) as Record<
      string,
      Record<string, number>
    >;
    const priceRaw = (data.price_summary_by_region ?? {}) as Record<
      string,
      Record<string, number | string | null>
    >;
    const dq = (data.data_quality ?? {}) as Record<string, number>;
    const topRaw = (data.top_categories ?? []) as Array<Record<string, unknown>>;

    const priceSummary: AnalyticsRollup['priceSummaryByRegion'] = {};
    for (const [region, summary] of Object.entries(priceRaw)) {
      priceSummary[region as 'NA' | 'SA' | 'EA'] = {
        count: Number(summary.count ?? 0),
        currency: (summary.currency as string | null) ?? null,
        avgSale: summary.avg_sale != null ? Number(summary.avg_sale) : null,
        minSale: summary.min_sale != null ? Number(summary.min_sale) : null,
        maxSale: summary.max_sale != null ? Number(summary.max_sale) : null,
        avgBase: summary.avg_base != null ? Number(summary.avg_base) : null,
      };
    }

    const publishStatusByRegion: AnalyticsRollup['publishStatusByRegion'] = {};
    for (const [region, statusMap] of Object.entries(psbr)) {
      publishStatusByRegion[region as 'NA' | 'SA' | 'EA'] = statusMap as Partial<
        AnalyticsRollup['publishStatusByRegion']['NA']
      >;
    }

    return {
      generatedAt: (data.generated_at as string) ?? new Date().toISOString(),
      regionFilter: (data.region_filter as 'NA' | 'SA' | 'EA' | null) ?? null,
      totals: {
        all: Number(totalsRow.all ?? 0),
        active: Number(totalsRow.active ?? 0),
        draft: Number(totalsRow.draft ?? 0),
        disabled: Number(totalsRow.disabled ?? 0),
        archived: Number(totalsRow.archived ?? 0),
        pendingReview: Number(totalsRow.pending_review ?? 0),
        approved: Number(totalsRow.approved ?? 0),
        rejected: Number(totalsRow.rejected ?? 0),
        notSubmitted: Number(totalsRow.not_submitted ?? 0),
      },
      topCategories: topRaw.map((row) => ({
        categoryId: (row.category_id as string | null) ?? null,
        categoryName: (row.category_name as string | null) ?? null,
        count: Number(row.count ?? 0),
      })),
      publishStatusByRegion,
      priceSummaryByRegion: priceSummary,
      dataQuality: {
        missingImage: Number(dq.missing_image ?? 0),
        missingCategory: Number(dq.missing_category ?? 0),
        missingPrice: Number(dq.missing_price ?? 0),
      },
    };
  },

  // ── Phase 5b: B2B tier prices ────────────────────────────────────────────
  async upsertTierPrice(input: ProductTierPrice): Promise<ProductTierPrice> {
    const payload = stripUndefined({
      id: input.id || undefined,
      product_id: input.productId,
      region_code: input.regionCode,
      min_qty: input.minQty,
      max_qty: input.maxQty,
      unit_price: input.unitPrice,
      currency: input.currency,
      discount_percent: input.discountPercent,
      incoterm: input.incoterm,
      effective_from: input.effectiveFrom,
      effective_to: input.effectiveTo,
      is_active: input.isActive,
      notes: input.notes,
    });
    const res = await supabase
      .from('pc_product_tier_prices')
      .upsert(payload, { onConflict: 'product_id,region_code,min_qty' })
      .select('*')
      .single();
    return rowToTierPrice(unwrap(res, 'upsertTierPrice') as Record<string, unknown>);
  },

  async removeTierPrice(id: string): Promise<void> {
    const res = await supabase.from('pc_product_tier_prices').delete().eq('id', id);
    if (res.error) throw new PcSupabaseError('removeTierPrice', res.error);
  },

  async getEffectiveTierPrice({
    productId,
    region,
    qty,
    asOfDate,
  }): Promise<EffectiveTierPriceResult> {
    const res = await supabase.rpc('pc_get_effective_tier_price', {
      p_product_id: productId,
      p_region: region,
      p_qty: qty,
      p_as_of: asOfDate ?? null,
    });
    if (res.error) throw new PcSupabaseError('getEffectiveTierPrice', res.error);
    const row = (res.data ?? {}) as Record<string, unknown>;
    return {
      source: (row.source as EffectiveTierPriceResult['source']) ?? 'none',
      unitPrice: row.unit_price == null ? undefined : Number(row.unit_price),
      currency: (row.currency as string) ?? undefined,
      minQty: row.min_qty == null ? undefined : Number(row.min_qty),
      maxQty: row.max_qty == null ? null : Number(row.max_qty),
      tierId: (row.tier_id as string) ?? undefined,
      incoterm: (row.incoterm as ProductTierPrice['incoterm']) ?? undefined,
      discountPercent:
        row.discount_percent == null ? undefined : Number(row.discount_percent),
      reason: (row.reason as string) ?? undefined,
      moq: row.moq == null ? undefined : Number(row.moq),
    };
  },

  async validateTierPrices({ productId, region }): Promise<TierIssue[]> {
    const res = await supabase.rpc('pc_validate_tier_prices', {
      p_product_id: productId,
      p_region: region,
    });
    if (res.error) throw new PcSupabaseError('validateTierPrices', res.error);
    const rows = (res.data as Array<Record<string, unknown>>) ?? [];
    return rows.map((r) => ({
      code: (r.code as TierIssue['code']) ?? 'tier-gap-or-overlap',
      message: (r.message as string) ?? 'unknown issue',
      severity: (r.severity as TierIssue['severity']) ?? 'warning',
    }));
  },

  // ── Phase 5d: quotation bridge ────────────────────────────────────────────
  async resolveQuotationLinePrices(
    lines: QuotationLineInput[],
  ): Promise<QuotationLineResolved[]> {
    const results: QuotationLineResolved[] = await Promise.all(
      lines.map(async (line): Promise<QuotationLineResolved> => {
        // 1. Look up the PIM product by SKU (case-insensitive ILIKE)
        const { data: products, error: pErr } = await supabase
          .from('pc_products')
          .select('id, sku, name, name_en')
          .ilike('sku', line.sku)
          .is('archived_at', null)
          .limit(1);

        if (pErr || !products?.length) {
          return { lineRef: line.lineRef, resolved: false, sku: line.sku, reason: 'sku-not-found' };
        }
        const p = products[0] as Record<string, unknown>;
        const productId = p.id as string;

        // 2. Call the three-layer RPC
        const res = await supabase.rpc('pc_get_effective_price_for_customer', {
          p_product_id: productId,
          p_region: line.region,
          p_qty: line.qty,
          p_customer_id: line.customerId,
          p_as_of: line.asOfDate ?? null,
        });

        if (res.error) {
          return { lineRef: line.lineRef, resolved: false, sku: line.sku, reason: 'unknown' };
        }

        const row = (res.data ?? {}) as Record<string, unknown>;
        const source = (row.source as EffectiveCustomerPriceResult['source']) ?? 'none';

        if (source === 'none') {
          const reasonMap: Record<string, QuotationLineResolved['reason']> = {
            'below-moq': 'below-moq',
            'no-region-price': 'no-region-price',
            'qty-required': 'qty-required',
          };
          return {
            lineRef: line.lineRef,
            resolved: false,
            sku: line.sku,
            reason: reasonMap[(row.reason as string) ?? ''] ?? 'unknown',
            moq: row.moq == null ? undefined : Number(row.moq),
          };
        }

        return {
          lineRef: line.lineRef,
          resolved: true,
          sku: line.sku,
          pimProductId: productId,
          pimProductName: (p.name as string) ?? (p.name_en as string) ?? '',
          unitPrice: Number(row.unit_price ?? 0),
          listPrice: Number(row.list_price ?? row.unit_price ?? 0),
          discountPercent: Number(row.discount_percent ?? 0),
          currency: (row.currency as string) ?? 'USD',
          incoterm: (row.incoterm as string) ?? undefined,
          source,
          customerTierCode: (row.customer_tier_code as string) ?? undefined,
        };
      }),
    );
    return results;
  },

  // ── Phase 5c: customer tier pricing + specific prices ────────────────────
  async upsertCustomerSpecificPrice(
    input: CustomerSpecificPrice,
  ): Promise<CustomerSpecificPrice> {
    const payload = stripUndefined({
      id: input.id || undefined,
      customer_id: input.customerId,
      product_id: input.productId,
      region_code: input.regionCode,
      min_qty: input.minQty,
      max_qty: input.maxQty,
      unit_price: input.unitPrice,
      currency: input.currency,
      incoterm: input.incoterm,
      effective_from: input.effectiveFrom,
      effective_to: input.effectiveTo,
      is_active: input.isActive,
      notes: input.notes,
    });
    const res = await supabase
      .from('pc_customer_specific_prices')
      .upsert(payload, { onConflict: 'customer_id,product_id,region_code,min_qty' })
      .select('*')
      .single();
    return rowToCustomerSpecificPrice(
      unwrap(res, 'upsertCustomerSpecificPrice') as Record<string, unknown>,
    );
  },

  async removeCustomerSpecificPrice(id: string): Promise<void> {
    const res = await supabase.from('pc_customer_specific_prices').delete().eq('id', id);
    if (res.error) throw new PcSupabaseError('removeCustomerSpecificPrice', res.error);
  },

  async getEffectiveCustomerPrice({
    productId,
    region,
    qty,
    customerId,
    asOfDate,
  }): Promise<EffectiveCustomerPriceResult> {
    const res = await supabase.rpc('pc_get_effective_price_for_customer', {
      p_product_id: productId,
      p_region: region,
      p_qty: qty,
      p_customer_id: customerId,
      p_as_of: asOfDate ?? null,
    });
    if (res.error) throw new PcSupabaseError('getEffectiveCustomerPrice', res.error);
    const row = (res.data ?? {}) as Record<string, unknown>;
    return {
      source: (row.source as EffectiveCustomerPriceResult['source']) ?? 'none',
      unitPrice: row.unit_price == null ? undefined : Number(row.unit_price),
      listPrice: row.list_price == null ? undefined : Number(row.list_price),
      discountPercent:
        row.discount_percent == null ? undefined : Number(row.discount_percent),
      currency: (row.currency as string) ?? undefined,
      minQty: row.min_qty == null ? undefined : Number(row.min_qty),
      maxQty: row.max_qty == null ? null : Number(row.max_qty),
      incoterm: (row.incoterm as CustomerSpecificPrice['incoterm']) ?? undefined,
      tierId: (row.tier_id as string) ?? undefined,
      specificId: (row.specific_id as string) ?? undefined,
      customerTierCode: (row.customer_tier_code as string) ?? undefined,
      customerTierName: (row.customer_tier_name as string) ?? undefined,
      reason: (row.reason as string) ?? undefined,
      moq: row.moq == null ? undefined : Number(row.moq),
    };
  },

  // ── Phase 5a: media upload (Supabase Storage) ────────────────────────────
  async uploadMedia({
    productId,
    kind,
    file,
    altText,
    sortOrder,
  }: MediaUploadInput): Promise<ProductMedia> {
    // Path scheme matches the storage RLS policy in
    // 20260503050000_product_center_media_storage.sql so writes are
    // tenant-scoped on the bucket side as well as the table side.
    const safeBase = file.name.replace(/[^a-zA-Z0-9._-]+/g, '_');
    const stamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 16);
    // We can't read pc_current_tenant_id() from the JS client; the storage
    // RLS policy will reject mismatched paths, but for the canonical case
    // (single-tenant `tenant_default`) we route through it explicitly so
    // the bucket layout matches what the SQL helper would produce.
    const tenant = await resolveTenantId();
    const path = `${tenant}/${productId}/${kind}/${stamp}_${safeBase}`;

    const upload = await supabase.storage
      .from('product-media')
      .upload(path, file, {
        contentType: file.type || undefined,
        upsert: false,
        cacheControl: '3600',
      });
    if (upload.error) {
      throw new PcSupabaseError(`uploadMedia:storage: ${upload.error.message}`, upload.error);
    }

    const { data: pub } = supabase.storage.from('product-media').getPublicUrl(path);
    const publicUrl = pub.publicUrl;

    const insertRes = await supabase
      .from('pc_product_media')
      .insert(
        stripUndefined({
          product_id: productId,
          kind,
          url: publicUrl,
          alt_text: altText,
          sort_order: sortOrder ?? 0,
          file_size: file.size,
        }),
      )
      .select('*')
      .single();
    if (insertRes.error) {
      // Best-effort cleanup so we don't leak orphan files.
      await supabase.storage.from('product-media').remove([path]).catch(() => undefined);
      throw new PcSupabaseError(`uploadMedia:row: ${insertRes.error.message}`, insertRes.error);
    }
    return rowToMedia(insertRes.data as Record<string, unknown>);
  },

  async removeMediaFile(media: ProductMedia): Promise<void> {
    // Extract the bucket-relative key from the public URL. The storage
    // module exposes both /object/public/<bucket>/<key> and the signed
    // form; we handle both.
    const key = extractStorageKey(media.url);
    if (!key) return;
    const res = await supabase.storage.from('product-media').remove([key]);
    if (res.error) {
      throw new PcSupabaseError(`removeMediaFile: ${res.error.message}`, res.error);
    }
  },

  // ── Phase 4e: bulk import (RPC-backed) ───────────────────────────────────
  async bulkUpsertProducts(rows: BulkImportRow[]): Promise<BulkImportResult> {
    const res = await supabase.rpc('pc_bulk_upsert_products', {
      p_rows: rows,
      p_actor_name: null,
    });
    if (res.error) throw new PcSupabaseError('bulkUpsertProducts', res.error);
    const data = (res.data ?? {}) as Record<string, unknown>;
    const errs = (data.errors as Array<Record<string, unknown>>) ?? [];
    const errorRows: BulkImportError[] = errs.map((e) => ({
      index: Number(e.index ?? 0),
      sku: (e.sku as string | null) ?? undefined,
      message: (e.message as string) ?? 'unknown error',
    }));
    return {
      created: Number(data.created ?? 0),
      updated: Number(data.updated ?? 0),
      errors: errorRows,
    };
  },
};

// minimal generic snake-case mapper for the publish-channel patch path
function camelToSnake(input: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(input)) {
    const key = k.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`);
    out[key] = v;
  }
  return out;
}

// ─── Phase 5a helpers ───────────────────────────────────────────────────────

/**
 * Resolve the `tenant_id` claim from the current JWT, falling back to
 * `tenant_default` so single-tenant deployments keep working without any
 * extra config. Mirrors `pc_current_tenant_id()` in the SQL helpers.
 */
async function resolveTenantId(): Promise<string> {
  try {
    const { data } = await supabase.auth.getSession();
    const session = data.session as
      | (typeof data.session & {
          user?: {
            user_metadata?: Record<string, unknown>;
            app_metadata?: Record<string, unknown>;
          };
        })
      | null;
    const claims = session?.user;
    const fromAppMeta = (claims?.app_metadata as { tenant_id?: string } | undefined)?.tenant_id;
    const fromUserMeta = (claims?.user_metadata as { tenant_id?: string } | undefined)?.tenant_id;
    return fromAppMeta || fromUserMeta || 'tenant_default';
  } catch {
    return 'tenant_default';
  }
}

/**
 * Extract the bucket-relative key from a `getPublicUrl` URL such as
 *   https://<host>/storage/v1/object/public/product-media/<key>
 * Returns null if the URL does not look like a Supabase Storage URL.
 */
function extractStorageKey(url: string): string | null {
  if (!url) return null;
  const marker = '/storage/v1/object/public/product-media/';
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return decodeURIComponent(url.slice(idx + marker.length));
}
