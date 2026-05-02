/**
 * In-memory mock dataset used for Phase 1 frontend rebuild.
 * Replace with Supabase-backed services in Phase 4 — the entity shapes
 * already match the SQL schema, so swapping is a pure infrastructure change.
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
  ProductCategoryRelation,
  ProductDocument,
  ProductMedia,
  ProductPriceHistory,
  ProductPublishChannel,
  ProductPublishLog,
  ProductRegionPrice,
  ProductSupplierLink,
  ReviewHistoryEntry,
  SupplierQuote,
} from './types';

const TENANT = 'tenant_default';
const NOW = new Date().toISOString();
const yesterday = new Date(Date.now() - 86400e3).toISOString();
const lastWeek = new Date(Date.now() - 7 * 86400e3).toISOString();

// ─── Categories ──────────────────────────────────────────────────────────────

export const mockCategories: ProductCategory[] = [
  {
    id: 'cat_lighting',
    tenantId: TENANT,
    parentId: null,
    level: 1,
    code: 'lighting',
    name: '照明',
    nameEn: 'Lighting',
    sortOrder: 1,
    isActive: true,
    seoTitle: 'Wholesale Lighting & LED Fixtures',
    seoDescription: 'Bulk lighting & LED fixtures for B2B and contractor markets.',
    createdAt: lastWeek,
    updatedAt: NOW,
  },
  {
    id: 'cat_lighting_indoor',
    tenantId: TENANT,
    parentId: 'cat_lighting',
    level: 2,
    code: 'lighting.indoor',
    name: '室内灯具',
    nameEn: 'Indoor Lighting',
    sortOrder: 1,
    isActive: true,
    createdAt: lastWeek,
    updatedAt: NOW,
  },
  {
    id: 'cat_lighting_indoor_panel',
    tenantId: TENANT,
    parentId: 'cat_lighting_indoor',
    level: 3,
    code: 'lighting.indoor.panel',
    name: 'LED 面板灯',
    nameEn: 'LED Panel Lights',
    sortOrder: 1,
    isActive: true,
    createdAt: lastWeek,
    updatedAt: NOW,
  },
  {
    id: 'cat_appliance',
    tenantId: TENANT,
    parentId: null,
    level: 1,
    code: 'appliance',
    name: '小家电',
    nameEn: 'Small Appliances',
    sortOrder: 2,
    isActive: true,
    createdAt: lastWeek,
    updatedAt: NOW,
  },
  {
    id: 'cat_appliance_kitchen',
    tenantId: TENANT,
    parentId: 'cat_appliance',
    level: 2,
    code: 'appliance.kitchen',
    name: '厨房电器',
    nameEn: 'Kitchen Appliances',
    sortOrder: 1,
    isActive: true,
    createdAt: lastWeek,
    updatedAt: NOW,
  },
  {
    id: 'cat_furniture',
    tenantId: TENANT,
    parentId: null,
    level: 1,
    code: 'furniture',
    name: '家具',
    nameEn: 'Furniture',
    sortOrder: 3,
    isActive: true,
    createdAt: lastWeek,
    updatedAt: NOW,
  },
];

// ─── Attributes ──────────────────────────────────────────────────────────────

export const mockAttributes: ProductAttribute[] = [
  {
    id: 'attr_color',
    tenantId: TENANT,
    code: 'color',
    label: '颜色',
    dataType: 'enum',
    options: ['白色', '黑色', '银灰', '香槟金'],
    isFilterable: true,
    sortOrder: 1,
    createdAt: lastWeek,
    updatedAt: NOW,
  },
  {
    id: 'attr_voltage',
    tenantId: TENANT,
    code: 'voltage',
    label: '电压',
    dataType: 'enum',
    unit: 'V',
    options: ['110V', '220V', '110-240V'],
    isFilterable: true,
    sortOrder: 2,
    createdAt: lastWeek,
    updatedAt: NOW,
  },
  {
    id: 'attr_material',
    tenantId: TENANT,
    code: 'material',
    label: '材质',
    dataType: 'text',
    isFilterable: false,
    sortOrder: 3,
    createdAt: lastWeek,
    updatedAt: NOW,
  },
];

// ─── Products ────────────────────────────────────────────────────────────────

const baseProduct = (overrides: Partial<Product>): Product => ({
  id: '',
  tenantId: TENANT,
  sku: '',
  name: '',
  status: 'active',
  reviewStatus: 'approved',
  campaignStatus: 'no_campaign',
  unit: 'pcs',
  createdAt: lastWeek,
  updatedAt: NOW,
  ...overrides,
});

export const mockProducts: Product[] = [
  baseProduct({
    id: 'p_001',
    sku: 'COS-LED-PNL-600',
    spu: 'COS-LED-PNL',
    name: 'LED 面板灯 600x600mm 40W',
    nameEn: 'LED Panel Light 600x600mm 40W',
    nameZh: 'LED 面板灯 600x600mm 40W',
    brand: 'Cosun',
    productType: 'Standard',
    shortDescription: '商用办公场景 LED 面板灯，可选三色温',
    longDescription:
      'High-efficiency LED panel light with selectable color temperature. CE / RoHS / FCC certified. Suitable for office, retail and hospitality.',
    keywords: ['led panel', 'office light', '40w'],
    tags: ['hot', 'b2b'],
    thumbnailUrl: 'https://picsum.photos/seed/cos-led-pnl/200',
    primaryCategoryId: 'cat_lighting_indoor_panel',
    internalCategory: 'L1.LIGHTING',
    status: 'active',
    reviewStatus: 'approved',
    campaignStatus: 'active',
    netWeight: 1.6,
    grossWeight: 2.1,
    lengthCm: 60,
    widthCm: 60,
    heightCm: 1.2,
    moq: 100,
    unitsPerCarton: 4,
    cbm: 0.018,
    qty20gp: 1480,
    qty40hq: 3060,
    hsCode: '9405.10',
    port: 'Ningbo',
    leadTimeDays: 25,
  }),
  baseProduct({
    id: 'p_002',
    sku: 'COS-AIRFRY-50',
    spu: 'COS-AIRFRY',
    name: '5L 空气炸锅',
    nameEn: '5L Air Fryer',
    brand: 'Cosun Home',
    productType: 'Standard',
    shortDescription: '5L 大容量、数显、12 项预设菜单',
    thumbnailUrl: 'https://picsum.photos/seed/cos-airfry/200',
    primaryCategoryId: 'cat_appliance_kitchen',
    internalCategory: 'L1.APPLIANCE',
    tags: ['promo', 'b2c'],
    status: 'active',
    reviewStatus: 'approved',
    campaignStatus: 'no_campaign',
    moq: 50,
    unitsPerCarton: 2,
    netWeight: 4.1,
    grossWeight: 5.0,
    leadTimeDays: 30,
    hsCode: '8516.79',
  }),
  baseProduct({
    id: 'p_003',
    sku: 'COS-DESK-1400',
    spu: 'COS-DESK',
    name: '1.4 米升降工作桌',
    nameEn: '1.4m Height-Adjustable Desk',
    brand: 'Cosun Office',
    primaryCategoryId: 'cat_furniture',
    internalCategory: 'L1.FURNITURE',
    thumbnailUrl: 'https://picsum.photos/seed/cos-desk/200',
    status: 'draft',
    reviewStatus: 'pending_review',
    campaignStatus: 'no_campaign',
    moq: 20,
    leadTimeDays: 35,
  }),
  baseProduct({
    id: 'p_004',
    sku: 'COS-BULB-A60-9W',
    name: 'A60 LED 灯泡 9W',
    nameEn: 'A60 LED Bulb 9W',
    brand: 'Cosun',
    primaryCategoryId: 'cat_lighting',
    internalCategory: 'L1.LIGHTING',
    thumbnailUrl: '', // 缺图，演示告警
    status: 'active',
    reviewStatus: 'approved',
    campaignStatus: 'no_campaign',
    moq: 500,
    unitsPerCarton: 100,
    leadTimeDays: 20,
  }),
  baseProduct({
    id: 'p_005',
    sku: 'COS-DRILL-18V',
    name: '18V 锂电冲击钻',
    nameEn: '18V Cordless Impact Drill',
    brand: 'Cosun Pro',
    primaryCategoryId: '', // 缺分类，演示告警
    thumbnailUrl: 'https://picsum.photos/seed/cos-drill/200',
    status: 'active',
    reviewStatus: 'rejected',
    campaignStatus: 'no_campaign',
    moq: 100,
    leadTimeDays: 28,
  }),
];

// ─── Category relations ──────────────────────────────────────────────────────

export const mockCategoryRelations: ProductCategoryRelation[] = mockProducts
  .filter((p) => p.primaryCategoryId)
  .map((p) => ({
    id: `pcr_${p.id}`,
    productId: p.id,
    categoryId: p.primaryCategoryId!,
    isPrimary: true,
    createdAt: lastWeek,
  }));

// ─── Suppliers ───────────────────────────────────────────────────────────────

export const mockSupplierLinks: ProductSupplierLink[] = [
  {
    id: 'ps_001',
    productId: 'p_001',
    supplierId: 'sup_zhongshan_lighting',
    supplierName: '中山华灯照明',
    supplierModelNo: 'HD-PNL-6060-40',
    isPrimary: true,
    factoryQuotePrice: 8.5,
    factoryQuoteCurrency: 'USD',
    factoryQuoteMoq: 500,
    factoryQuoteAt: yesterday,
    costPrice: 9.2,
    costCurrency: 'USD',
    createdAt: lastWeek,
    updatedAt: yesterday,
  },
  {
    id: 'ps_002',
    productId: 'p_002',
    supplierId: 'sup_ningbo_kitchen',
    supplierName: '宁波厨电',
    supplierModelNo: 'NB-AF-50',
    isPrimary: true,
    factoryQuotePrice: 22,
    factoryQuoteCurrency: 'USD',
    factoryQuoteMoq: 100,
    factoryQuoteAt: yesterday,
    costPrice: 24,
    costCurrency: 'USD',
    createdAt: lastWeek,
    updatedAt: yesterday,
  },
  {
    id: 'ps_003',
    productId: 'p_003',
    supplierId: 'sup_dongguan_furniture',
    supplierName: '东莞 ErgoDesk',
    supplierModelNo: 'EG-1400',
    isPrimary: true,
    factoryQuotePrice: 95,
    factoryQuoteCurrency: 'USD',
    factoryQuoteMoq: 20,
    factoryQuoteAt: lastWeek,
    costPrice: 102,
    costCurrency: 'USD',
    createdAt: lastWeek,
    updatedAt: lastWeek,
  },
  {
    id: 'ps_004',
    productId: 'p_004',
    supplierId: 'sup_zhongshan_lighting',
    supplierName: '中山华灯照明',
    supplierModelNo: 'HD-A60-9',
    isPrimary: true,
    factoryQuotePrice: 0.55,
    factoryQuoteCurrency: 'USD',
    factoryQuoteMoq: 1000,
    costPrice: 0.62,
    costCurrency: 'USD',
    createdAt: lastWeek,
    updatedAt: lastWeek,
  },
];

// ─── Region prices ───────────────────────────────────────────────────────────

export const mockRegionPrices: ProductRegionPrice[] = [
  // p_001 LED Panel
  pricing('p_001', 'NA', 24.99, 19.99, 14.99),
  pricing('p_001', 'SA', 26.99, 21.99, null),
  pricing('p_001', 'EA', 22.5, 18.0, null),
  // p_002 Air Fryer
  pricing('p_002', 'NA', 79.99, 59.99, null),
  pricing('p_002', 'SA', 89.99, 69.99, null),
  pricing('p_002', 'EA', 74.99, 54.99, null),
  // p_003 Desk
  pricing('p_003', 'NA', 299, 249, null),
  // p_004 Bulb (no NA)
  pricing('p_004', 'SA', 1.99, 1.49, null),
  pricing('p_004', 'EA', 1.79, 1.29, null),
];

function pricing(
  productId: string,
  region: ProductRegionPrice['regionCode'],
  base: number,
  sale: number,
  campaign: number | null,
): ProductRegionPrice {
  return {
    id: `prp_${productId}_${region}`,
    productId,
    regionCode: region,
    currency: region === 'EA' ? 'EUR' : 'USD',
    basePrice: base,
    salePrice: sale,
    campaignPrice: campaign,
    fxRate: 1,
    isActive: true,
    marginTarget: 0.35,
    marginActual: 0.3,
    createdAt: lastWeek,
    updatedAt: NOW,
  };
}

// ─── Media ───────────────────────────────────────────────────────────────────

export const mockMedia: ProductMedia[] = [
  ...['p_001', 'p_002', 'p_003', 'p_005'].flatMap((pid, idx) => [
    {
      id: `m_${pid}_main`,
      productId: pid,
      kind: 'main' as const,
      url: `https://picsum.photos/seed/${pid}-main/600`,
      altText: `${pid} main`,
      sortOrder: 0,
      createdAt: lastWeek,
      updatedAt: NOW,
      width: 600,
      height: 600,
    },
    {
      id: `m_${pid}_d1`,
      productId: pid,
      kind: 'detail' as const,
      url: `https://picsum.photos/seed/${pid}-d${idx}/600`,
      altText: `${pid} detail 1`,
      sortOrder: 1,
      createdAt: lastWeek,
      updatedAt: NOW,
    },
  ]),
];

// ─── Documents ───────────────────────────────────────────────────────────────

export const mockDocuments: ProductDocument[] = [
  {
    id: 'doc_001',
    productId: 'p_001',
    kind: 'certification',
    name: 'CE 证书 - LED Panel',
    url: '#',
    issuedBy: 'TÜV Rheinland',
    validUntil: '2027-12-31',
    createdAt: lastWeek,
  },
  {
    id: 'doc_002',
    productId: 'p_002',
    kind: 'manual',
    name: 'Air Fryer 使用说明书',
    url: '#',
    createdAt: lastWeek,
  },
];

// ─── Publish channels ────────────────────────────────────────────────────────

export const mockPublishChannels: ProductPublishChannel[] = [
  channel('p_001', 'NA', 'published'),
  channel('p_001', 'SA', 'paused'),
  channel('p_001', 'EA', 'published'),
  channel('p_002', 'NA', 'published'),
  channel('p_002', 'SA', 'not_published'),
  channel('p_002', 'EA', 'scheduled'),
  channel('p_003', 'NA', 'not_published'),
  channel('p_004', 'SA', 'published'),
  channel('p_004', 'EA', 'published'),
  channel('p_005', 'NA', 'not_published'),
];

function channel(
  productId: string,
  region: ProductPublishChannel['regionCode'],
  status: ProductPublishChannel['publishStatus'],
): ProductPublishChannel {
  return {
    id: `pc_${productId}_${region}`,
    productId,
    regionCode: region,
    channel: 'website',
    publishStatus: status,
    homepageFeatured: status === 'published' && Math.random() > 0.6,
    categoryFeatured: status === 'published',
    sortWeight: 100,
    showPriceOnFrontend: true,
    allowInquiry: true,
    showMoq: true,
    showLeadTime: true,
    seoTitle: '',
    seoDescription: '',
    seoSlug: '',
    seoKeywords: [],
    publishedAt: status === 'published' ? yesterday : undefined,
    pausedAt: status === 'paused' ? yesterday : undefined,
    createdAt: lastWeek,
    updatedAt: NOW,
  };
}

// ─── Publish logs ────────────────────────────────────────────────────────────

export const mockPublishLogs: ProductPublishLog[] = [
  {
    id: 'pl_1',
    productId: 'p_001',
    regionCode: 'NA',
    channel: 'website',
    fromStatus: 'not_published',
    toStatus: 'published',
    actorName: 'Lina Zhao',
    note: '首次发布',
    occurredAt: lastWeek,
  },
  {
    id: 'pl_2',
    productId: 'p_001',
    regionCode: 'SA',
    channel: 'website',
    fromStatus: 'published',
    toStatus: 'paused',
    actorName: 'Lina Zhao',
    note: 'SA 库存紧张暂停',
    occurredAt: yesterday,
  },
];

// ─── Campaigns ───────────────────────────────────────────────────────────────

export const mockCampaigns: Campaign[] = [
  {
    id: 'cmp_summer_na',
    tenantId: TENANT,
    name: 'Summer Lighting Sale',
    code: 'SUMMER25',
    regionCodes: ['NA'],
    status: 'active',
    startsAt: lastWeek,
    endsAt: new Date(Date.now() + 14 * 86400e3).toISOString(),
    tag: 'hot_sale',
    displaySlots: ['homepage_banner', 'category_hero'],
    description: '北美夏季照明大促',
    analyticsViewCount: 12450,
    analyticsClickCount: 1830,
    analyticsConversionCount: 142,
    createdAt: lastWeek,
    updatedAt: NOW,
  },
  {
    id: 'cmp_clearance_ea',
    tenantId: TENANT,
    name: 'EU Clearance',
    code: 'EU-CLR',
    regionCodes: ['EA'],
    status: 'scheduled',
    startsAt: new Date(Date.now() + 5 * 86400e3).toISOString(),
    endsAt: new Date(Date.now() + 25 * 86400e3).toISOString(),
    tag: 'clearance',
    displaySlots: ['homepage_strip'],
    createdAt: yesterday,
    updatedAt: NOW,
  },
];

export const mockCampaignProducts: CampaignProduct[] = [
  {
    id: 'cp_1',
    campaignId: 'cmp_summer_na',
    productId: 'p_001',
    campaignPrice: 14.99,
    currency: 'USD',
    discountPercent: 25,
    createdAt: lastWeek,
  },
];

// ─── Model mappings ──────────────────────────────────────────────────────────

export const mockModelMappings: ModelMapping[] = [
  {
    id: 'mm_1',
    tenantId: TENANT,
    productId: 'p_001',
    internalSku: 'COS-LED-PNL-600',
    supplierSku: 'HD-PNL-6060-40',
    customerModelNo: 'HD-LP-6040',
    factoryModelNo: 'HD-PNL-6060-40',
    legacyModelNo: 'COS-LED-600-OLD',
    notes: 'Customer = HomeDepot 模型号映射',
    createdAt: lastWeek,
    updatedAt: NOW,
  },
];

// ─── Audit logs ──────────────────────────────────────────────────────────────

export const mockAuditLogs: ProductAuditLog[] = [
  {
    id: 'al_1',
    productId: 'p_001',
    action: 'publish',
    actorName: 'Lina Zhao',
    occurredAt: lastWeek,
    note: 'NA 首次发布',
  },
  {
    id: 'al_2',
    productId: 'p_001',
    action: 'edit_price',
    field: 'salePrice (NA)',
    fromValue: '21.99',
    toValue: '19.99',
    actorName: 'Mike Chen',
    occurredAt: yesterday,
  },
];

// ─── Attribute values ────────────────────────────────────────────────────────

export const mockAttributeValues: ProductAttributeValue[] = [
  {
    id: 'av_1',
    productId: 'p_001',
    attributeId: 'attr_color',
    valueText: '白色',
    createdAt: lastWeek,
    updatedAt: NOW,
  },
  {
    id: 'av_2',
    productId: 'p_001',
    attributeId: 'attr_voltage',
    valueText: '110-240V',
    createdAt: lastWeek,
    updatedAt: NOW,
  },
];

// ─── Price history (Phase 3) ─────────────────────────────────────────────────

export const mockPriceHistory: ProductPriceHistory[] = [
  {
    id: 'ph_1',
    productId: 'p_001',
    regionCode: 'NA',
    field: 'sale',
    fromValue: 24.99,
    toValue: 21.99,
    changedAt: lastWeek,
    changedBy: 'Lina Zhao',
    reason: '首次定价',
  },
  {
    id: 'ph_2',
    productId: 'p_001',
    regionCode: 'NA',
    field: 'sale',
    fromValue: 21.99,
    toValue: 19.99,
    changedAt: yesterday,
    changedBy: 'Mike Chen',
    reason: 'NA Q2 价格调整 -10%',
  },
  {
    id: 'ph_3',
    productId: 'p_001',
    regionCode: 'NA',
    field: 'campaign',
    fromValue: null,
    toValue: 14.99,
    changedAt: yesterday,
    changedBy: 'Mike Chen',
    reason: 'Summer Sale 活动价',
  },
];

// ─── Supplier quotes (Phase 3) ───────────────────────────────────────────────

export const mockSupplierQuotes: SupplierQuote[] = [
  {
    id: 'sq_1',
    productId: 'p_001',
    supplierId: 'sup_zhongshan_lighting',
    supplierName: '中山华灯照明',
    supplierModelNo: 'HD-PNL-6060-40',
    quotedPrice: 9.2,
    currency: 'USD',
    moq: 500,
    validFrom: lastWeek,
    validUntil: new Date(Date.now() + 60 * 86400e3).toISOString(),
    incoterm: 'FOB',
    port: 'Ningbo',
    isCurrent: true,
    createdAt: lastWeek,
    createdBy: 'Procurement Team',
  },
  {
    id: 'sq_2',
    productId: 'p_001',
    supplierId: 'sup_zhongshan_lighting',
    supplierName: '中山华灯照明',
    supplierModelNo: 'HD-PNL-6060-40',
    quotedPrice: 9.85,
    currency: 'USD',
    moq: 500,
    validFrom: '2025-11-01T00:00:00.000Z',
    validUntil: lastWeek,
    incoterm: 'FOB',
    port: 'Ningbo',
    isCurrent: false,
    createdAt: '2025-11-01T00:00:00.000Z',
    createdBy: 'Procurement Team',
    notes: '原材料铜价上行',
  },
  {
    id: 'sq_3',
    productId: 'p_002',
    supplierId: 'sup_ningbo_kitchen',
    supplierName: '宁波厨电',
    supplierModelNo: 'NB-AF-50',
    quotedPrice: 24,
    currency: 'USD',
    moq: 100,
    validFrom: yesterday,
    validUntil: new Date(Date.now() + 90 * 86400e3).toISOString(),
    incoterm: 'EXW',
    port: 'Ningbo',
    isCurrent: true,
    createdAt: yesterday,
    createdBy: 'Procurement Team',
  },
];

// ─── Review history (Phase 3) ────────────────────────────────────────────────

export const mockReviewHistory: ReviewHistoryEntry[] = [
  {
    id: 'rh_1',
    productId: 'p_005',
    fromStatus: 'pending_review',
    toStatus: 'rejected',
    reason: '主图缺失，请上传至少一张主图后再提交',
    actorName: 'Reviewer Alice',
    actorRole: 'reviewer',
    missingFlags: ['missingImage', 'missingCategory'],
    occurredAt: yesterday,
  },
  {
    id: 'rh_2',
    productId: 'p_003',
    fromStatus: 'not_submitted',
    toStatus: 'pending_review',
    reason: '基础信息已完善，提交一审',
    actorName: 'Editor Bob',
    actorRole: 'editor',
    occurredAt: yesterday,
  },
];
