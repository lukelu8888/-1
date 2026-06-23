import { supabase } from '@/lib/supabase';
import type { MainCategory, SubCategory, ProductCategory, ProductSpec } from '@/data/productData';
import { toRegionCode } from '@/lib/supabaseService';
import {
  getProductMoq,
  getProductOriginalPrice,
  getProductPublishStatus,
  getProductPublishType,
  getProductQuantityStep,
  getProductSpecValue,
  getProductUnit,
  isWebsiteProductVisible,
  parseProductNumber,
} from '@/lib/productPublication';
import { syncCategoryTreeFromLegacyCatalog } from '@/lib/services/categoryTreeService';

// ── Supabase row types ──────────────────────────────────────
interface MainCategoryRow {
  id: string;
  name: string;
  icon: string;
  description: string | null;
  sort_order: number;
  region_code?: string | null;
}

interface SubCategoryRow {
  id: string;
  main_category_id: string;
  name: string;
  description: string | null;
  sort_order: number;
  region_code?: string | null;
}

interface ProductCategoryRow {
  id: string;
  sub_category_id: string;
  name: string;
  description: string | null;
  sort_order: number;
  region_code?: string | null;
}

interface ProductRow {
  id: string;
  category_id: string;
  name: string;
  model: string;
  image: string | null;
  price: number | null;
  net_weight: number;
  gross_weight: number;
  units_per_carton: number;
  carton_length: number;
  carton_width: number;
  carton_height: number;
  carton_net_weight: number;
  carton_gross_weight: number;
  specifications: Record<string, string>;
  region_code?: string | null;
}

interface ProductPublicationRow {
  product_id: string;
  region_code?: string | null;
  publish_type?: string | null;
  publish_status?: string | null;
  display_priority?: number | null;
  promotion_label?: string | null;
  front_tag?: string | null;
  website_note?: string | null;
}

interface ProductPriceRow {
  product_id: string;
  region_code?: string | null;
  currency?: string | null;
  unit?: string | null;
  sale_price?: number | null;
  compare_at_price?: number | null;
  valid_until?: string | null;
  status?: string | null;
  price_type?: string | null;
}

interface ProductFulfillmentRow {
  product_id: string;
  region_code?: string | null;
  moq?: number | null;
  quantity_step?: number | null;
  stock_quantity?: number | null;
  stock_unit?: string | null;
  eta_text?: string | null;
  fulfillment_status?: string | null;
}

interface PimAttributeRow {
  id: string;
  label: string;
  display_order?: number | null;
}

interface PimAttributeValueRow {
  product_id: string;
  attribute_id: string;
  value_text?: string | null;
  value_number?: number | null;
  value_boolean?: boolean | null;
  value_json?: any;
}

interface PimAssetRow {
  product_id: string;
  asset_type: string;
  asset_url: string;
  quality_status?: string | null;
  sort_order?: number | null;
}

// ── Mappers ─────────────────────────────────────────────────
function mapProduct(row: ProductRow): ProductSpec {
  return {
    id: row.id,
    categoryId: row.category_id,
    name: row.name,
    model: row.model,
    image: row.image ?? '',
    regionCode: row.region_code ?? undefined,
    price: row.price ?? undefined,
    netWeight: row.net_weight,
    grossWeight: row.gross_weight,
    unitsPerCarton: row.units_per_carton,
    cartonDimensions: {
      length: row.carton_length,
      width: row.carton_width,
      height: row.carton_height,
    },
    cartonNetWeight: row.carton_net_weight,
    cartonGrossWeight: row.carton_gross_weight,
    specifications: row.specifications ?? {},
  };
}

const scopedRowScore = (rowRegionCode: string | null | undefined, regionCode: string) => {
  if (rowRegionCode === regionCode) return 2;
  if (!rowRegionCode) return 1;
  return 0;
};

function pickScopedRow<T extends { product_id: string; region_code?: string | null }>(
  rows: T[],
  productId: string,
  regionCode: string
): T | undefined {
  return rows
    .filter((row) => row.product_id === productId && scopedRowScore(row.region_code, regionCode) > 0)
    .sort((a, b) => scopedRowScore(b.region_code, regionCode) - scopedRowScore(a.region_code, regionCode))[0];
}

const regionScopedWebsiteSpecKeys = new Set([
  'unit',
  'currency',
  'price status',
  'publish type',
  'publish status',
  'website type',
  'moq',
  'stock',
  'stock unit',
  'eta',
  'valid until',
  'quantity step',
  'deal tag',
  'display priority',
  'original price',
  'originalprice',
  'compare at price',
  'compareatprice',
  'compare price',
  'list price',
  'regular price',
  'msrp',
  'was price',
  'discount',
  'discount percent',
  'discount%',
  'promotion',
  'promo label',
  'deal label',
  'deal',
  'deals',
  'is deal',
  'isdiscounted',
  'on sale',
  'sale',
  'fulfillment status',
  'website note',
]);

function stripRegionScopedWebsiteSpecifications(specifications: Record<string, string> = {}): Record<string, string> {
  return Object.fromEntries(
    Object.entries(specifications).filter(([key]) => !regionScopedWebsiteSpecKeys.has(key.trim().toLowerCase()))
  );
}

async function fetchStructuredProductData(productIds: string[]) {
  if (productIds.length === 0) {
    return {
      publications: [] as ProductPublicationRow[],
      prices: [] as ProductPriceRow[],
      fulfillment: [] as ProductFulfillmentRow[],
    };
  }

  try {
    const [publicationRes, priceRes, fulfillmentRes] = await Promise.all([
      supabase.from('product_publications').select('*').in('product_id', productIds),
      supabase.from('product_prices').select('*').eq('price_type', 'website').in('product_id', productIds),
      supabase.from('product_fulfillment').select('*').in('product_id', productIds),
    ]);

    if (publicationRes.error || priceRes.error || fulfillmentRes.error) {
      throw publicationRes.error || priceRes.error || fulfillmentRes.error;
    }

    return {
      publications: (publicationRes.data ?? []) as ProductPublicationRow[],
      prices: (priceRes.data ?? []) as ProductPriceRow[],
      fulfillment: (fulfillmentRes.data ?? []) as ProductFulfillmentRow[],
    };
  } catch (error) {
    console.warn('Structured product publication tables are unavailable; using legacy product specifications.', error);
    return {
      publications: [] as ProductPublicationRow[],
      prices: [] as ProductPriceRow[],
      fulfillment: [] as ProductFulfillmentRow[],
    };
  }
}

function mergeStructuredProductData(
  product: ProductSpec,
  regionCode: string,
  publications: ProductPublicationRow[],
  prices: ProductPriceRow[],
  fulfillmentRows: ProductFulfillmentRow[]
): ProductSpec {
  const publication = pickScopedRow(publications, product.id, regionCode);
  const price = pickScopedRow(prices, product.id, regionCode);
  const fulfillment = pickScopedRow(fulfillmentRows, product.id, regionCode);
  const hasStructuredWebsiteData =
    publications.some((row) => row.product_id === product.id) ||
    prices.some((row) => row.product_id === product.id) ||
    fulfillmentRows.some((row) => row.product_id === product.id);

  const nextSpecifications: Record<string, string> = hasStructuredWebsiteData
    ? stripRegionScopedWebsiteSpecifications(product.specifications || {})
    : { ...(product.specifications || {}) };

  if (publication) {
    nextSpecifications['Publish Type'] = publication.publish_type || 'standard';
    nextSpecifications['Publish Status'] = publication.publish_status || 'published';
    nextSpecifications['Display Priority'] = String(publication.display_priority ?? 100);
    if (publication.promotion_label) {
      nextSpecifications.Discount = publication.promotion_label;
      nextSpecifications['Deal Label'] = publication.promotion_label;
    }
    if (publication.front_tag) nextSpecifications['Deal Tag'] = publication.front_tag;
    if (publication.website_note) nextSpecifications['Website Note'] = publication.website_note;
  }

  if (price) {
    nextSpecifications.Unit = price.unit || getProductUnit(product);
    nextSpecifications.Currency = price.currency || 'USD';
    if (price.compare_at_price != null) nextSpecifications['Original Price'] = String(price.compare_at_price);
    if (price.valid_until) nextSpecifications['Valid Until'] = price.valid_until;
    if (price.status) nextSpecifications['Price Status'] = price.status;
  }

  if (fulfillment) {
    nextSpecifications.MOQ = String(fulfillment.moq ?? getProductMoq(product));
    nextSpecifications['Quantity Step'] = String(fulfillment.quantity_step ?? getProductQuantityStep(product));
    if (fulfillment.stock_quantity != null) nextSpecifications.Stock = String(fulfillment.stock_quantity);
    if (fulfillment.stock_unit) nextSpecifications['Stock Unit'] = fulfillment.stock_unit;
    if (fulfillment.eta_text) nextSpecifications.ETA = fulfillment.eta_text;
    if (fulfillment.fulfillment_status) nextSpecifications['Fulfillment Status'] = fulfillment.fulfillment_status;
  }

  return {
    ...product,
    price: price?.status === 'active' || price?.status === 'scheduled'
      ? Number(price.sale_price ?? product.price ?? 0)
      : product.price,
    specifications: nextSpecifications,
  };
}

async function hydrateStructuredProducts(products: ProductSpec[], regionCode: string): Promise<ProductSpec[]> {
  const structured = await fetchStructuredProductData(products.map((product) => product.id));
  const mergedProducts = products.map((product) =>
    mergeStructuredProductData(product, regionCode, structured.publications, structured.prices, structured.fulfillment)
  );
  return mergePimPresentationData(mergedProducts);
}

const pimValueToString = (value: PimAttributeValueRow) => {
  if (Array.isArray(value.value_json)) return value.value_json.join(', ');
  if (value.value_number !== null && value.value_number !== undefined) return String(value.value_number);
  if (value.value_boolean !== null && value.value_boolean !== undefined) return value.value_boolean ? 'Yes' : 'No';
  return String(value.value_text || '').trim();
};

async function fetchPimPresentationData(productIds: string[]) {
  if (productIds.length === 0) {
    return {
      values: [] as PimAttributeValueRow[],
      attributes: [] as PimAttributeRow[],
      assets: [] as PimAssetRow[],
    };
  }

  try {
    const [valuesRes, assetsRes] = await Promise.all([
      supabase.from('product_attribute_values').select('*').in('product_id', productIds),
      supabase.from('product_assets').select('*').in('product_id', productIds).order('sort_order'),
    ]);
    if (valuesRes.error || assetsRes.error) throw valuesRes.error || assetsRes.error;

    const values = (valuesRes.data ?? []) as PimAttributeValueRow[];
    const attributeIds = Array.from(new Set(values.map((value) => value.attribute_id).filter(Boolean)));
    if (attributeIds.length === 0) {
      return {
        values,
        attributes: [] as PimAttributeRow[],
        assets: (assetsRes.data ?? []) as PimAssetRow[],
      };
    }

    const attributesRes = await supabase.from('category_attributes').select('id,label,display_order').in('id', attributeIds).order('display_order');
    if (attributesRes.error) throw attributesRes.error;
    return {
      values,
      attributes: (attributesRes.data ?? []) as PimAttributeRow[],
      assets: (assetsRes.data ?? []) as PimAssetRow[],
    };
  } catch (error) {
    console.warn('PIM presentation data is unavailable; using base product data.', error);
    return {
      values: [] as PimAttributeValueRow[],
      attributes: [] as PimAttributeRow[],
      assets: [] as PimAssetRow[],
    };
  }
}

async function mergePimPresentationData(products: ProductSpec[]): Promise<ProductSpec[]> {
  const presentation = await fetchPimPresentationData(products.map((product) => product.id));
  if (presentation.values.length === 0 && presentation.assets.length === 0) return products;

  const attributeById = new Map(presentation.attributes.map((attribute) => [attribute.id, attribute]));
  const valuesByProduct = new Map<string, PimAttributeValueRow[]>();
  for (const value of presentation.values) {
    const list = valuesByProduct.get(value.product_id) || [];
    list.push(value);
    valuesByProduct.set(value.product_id, list);
  }
  const assetsByProduct = new Map<string, PimAssetRow[]>();
  for (const asset of presentation.assets) {
    const list = assetsByProduct.get(asset.product_id) || [];
    list.push(asset);
    assetsByProduct.set(asset.product_id, list);
  }

  return products.map((product) => {
    const nextSpecifications = { ...(product.specifications || {}) };
    for (const value of valuesByProduct.get(product.id) || []) {
      const attribute = attributeById.get(value.attribute_id);
      const displayValue = pimValueToString(value);
      if (attribute?.label && displayValue) nextSpecifications[attribute.label] = displayValue;
    }

    const assets = assetsByProduct.get(product.id) || [];
    const mainAsset =
      assets.find((asset) => asset.asset_type === 'main' && asset.quality_status !== 'rejected') ||
      assets.find((asset) => asset.quality_status === 'approved') ||
      assets.find((asset) => asset.quality_status !== 'rejected');

    return {
      ...product,
      image: mainAsset?.asset_url || product.image,
      specifications: nextSpecifications,
    };
  });
}

// ── Cache (session-level) ───────────────────────────────────
const catalogCache = new Map<string, MainCategory[]>();
const PRODUCT_CATALOG_TIMEOUT_MS = 45000;
const REGION_STORAGE_KEY = 'cosun-region';
export const PRODUCT_CATALOG_UPDATED_EVENT = 'cosun-product-catalog-updated';
export const PRODUCT_CATALOG_UPDATED_STORAGE_KEY = 'cosun-product-catalog-updated-at';

export interface ProductCatalogFetchOptions {
  includeUnpublished?: boolean;
  requireStructured?: boolean;
}

export interface CategoryArchitectureSyncResult {
  departments: number;
  aisles: number;
  leafCategories: number;
}

function resolveRegionCode(regionCode?: string | null): string {
  if (regionCode) return toRegionCode(regionCode) || 'NA';
  if (typeof window === 'undefined') return 'NA';
  const storedRegion = window.localStorage.getItem(REGION_STORAGE_KEY);
  return toRegionCode(storedRegion) || 'NA';
}

function filterRowsByRegion<T extends { region_code?: string | null }>(rows: T[], regionCode: string): T[] {
  const hasRegionScopedRows = rows.some((row) => Boolean(row.region_code));
  if (!hasRegionScopedRows) return rows;
  return rows.filter((row) => !row.region_code || row.region_code === regionCode);
}

async function withCatalogTimeout<T>(task: Promise<T>, timeoutMs = PRODUCT_CATALOG_TIMEOUT_MS): Promise<T> {
  return Promise.race<T>([
    task,
    new Promise<T>((_, reject) => {
      globalThis.setTimeout(() => reject(new Error('Product catalog request timed out')), timeoutMs);
    }),
  ]);
}

// ── Main fetch function ──────────────────────────────────────
export async function fetchProductCatalog(
  regionCodeOverride?: string | null,
  options: ProductCatalogFetchOptions = {}
): Promise<MainCategory[]> {
  const regionCode = resolveRegionCode(regionCodeOverride);
  const cacheKey = `${regionCode}:${options.includeUnpublished ? 'all' : 'published'}`;
  const cachedCatalog = catalogCache.get(cacheKey);
  if (cachedCatalog) return cachedCatalog;

  try {
    const [mainRes, subRes, catRes, prodRes] = await withCatalogTimeout(
      Promise.all([
        supabase.from('product_main_categories').select('*').order('sort_order'),
        supabase.from('product_sub_categories').select('*').order('sort_order'),
        supabase.from('product_categories').select('*').order('sort_order'),
        supabase.from('products').select('*').order('name'),
      ])
    );

    if (mainRes.error) throw mainRes.error;
    if (subRes.error) throw subRes.error;
    if (catRes.error) throw catRes.error;
    if (prodRes.error) throw prodRes.error;

    const mainRows: MainCategoryRow[] = mainRes.data ?? [];
    const subRows: SubCategoryRow[] = subRes.data ?? [];
    const catRows: ProductCategoryRow[] = catRes.data ?? [];
    const prodRows: ProductRow[] = prodRes.data ?? [];
    const filteredMainRows = filterRowsByRegion(mainRows, regionCode);
    const filteredSubRows = filterRowsByRegion(subRows, regionCode);
    const filteredCatRows = filterRowsByRegion(catRows, regionCode);
    const filteredProdRows = filterRowsByRegion(prodRows, regionCode);
    const mappedProducts = await hydrateStructuredProducts(filteredProdRows.map(mapProduct), regionCode);

    if (filteredMainRows.length === 0) {
      catalogCache.set(cacheKey, []);
      return [];
    }

    // Build lookup maps
    const prodsByCategory = new Map<string, ProductSpec[]>();
    for (const product of mappedProducts) {
      if (!options.includeUnpublished && !isWebsiteProductVisible(product)) continue;
      const categoryId = product.categoryId || '';
      if (!prodsByCategory.has(categoryId)) prodsByCategory.set(categoryId, []);
      prodsByCategory.get(categoryId)!.push(product);
    }

    const catsBySub = new Map<string, ProductCategory[]>();
    for (const c of filteredCatRows) {
      if (!catsBySub.has(c.sub_category_id)) catsBySub.set(c.sub_category_id, []);
      catsBySub.get(c.sub_category_id)!.push({
        id: c.id,
        name: c.name,
        description: c.description ?? undefined,
        products: prodsByCategory.get(c.id) ?? [],
      });
    }

    const subsByMain = new Map<string, SubCategory[]>();
    for (const s of filteredSubRows) {
      if (!subsByMain.has(s.main_category_id)) subsByMain.set(s.main_category_id, []);
      subsByMain.get(s.main_category_id)!.push({
        id: s.id,
        name: s.name,
        description: s.description ?? undefined,
        productCategories: catsBySub.get(s.id) ?? [],
      });
    }

    const catalog = filteredMainRows.map((m) => ({
      id: m.id,
      name: m.name,
      icon: m.icon,
      description: m.description ?? undefined,
      subCategories: subsByMain.get(m.id) ?? [],
    }));

    catalogCache.set(cacheKey, catalog);
    return catalog;
  } catch (error) {
    console.warn('Product catalog fetch failed; no demo catalog will be generated.', error);
    catalogCache.set(cacheKey, []);
    return [];
  }
}

/** Clear session cache (e.g. after admin updates) */
export function clearProductCatalogCache(): void {
  catalogCache.clear();
}

function notifyProductCatalogUpdated() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(PRODUCT_CATALOG_UPDATED_EVENT));
  try {
    window.localStorage.setItem(PRODUCT_CATALOG_UPDATED_STORAGE_KEY, String(Date.now()));
  } catch {
    // The direct window event above still refreshes the current tab.
  }
}

export async function syncWebsiteCategoryArchitecture(
  catalog: MainCategory[],
  regionCodeOverride?: string | null
): Promise<CategoryArchitectureSyncResult> {
  const regionCode = regionCodeOverride ? resolveRegionCode(regionCodeOverride) : null;
  const mainRows: MainCategoryRow[] = catalog.map((department, index) => ({
    id: department.id,
    name: department.name,
    icon: department.icon || 'Package',
    description: department.description ?? null,
    sort_order: index + 1,
    region_code: regionCode,
  }));
  const subRows: SubCategoryRow[] = catalog.flatMap((department) =>
    department.subCategories.map((aisle, index) => ({
      id: aisle.id,
      main_category_id: department.id,
      name: aisle.name,
      description: aisle.description ?? null,
      sort_order: index + 1,
      region_code: regionCode,
    }))
  );
  const catRows: ProductCategoryRow[] = catalog.flatMap((department) =>
    department.subCategories.flatMap((aisle) =>
      aisle.productCategories.map((leaf, index) => ({
        id: leaf.id,
        sub_category_id: aisle.id,
        name: leaf.name,
        description: leaf.description ?? null,
        sort_order: index + 1,
        region_code: regionCode,
      }))
    )
  );

  const mainRes = await supabase.from('product_main_categories').upsert(mainRows, { onConflict: 'id' });
  if (mainRes.error) throw mainRes.error;
  const subRes = await supabase.from('product_sub_categories').upsert(subRows, { onConflict: 'id' });
  if (subRes.error) throw subRes.error;
  const catRes = await supabase.from('product_categories').upsert(catRows, { onConflict: 'id' });
  if (catRes.error) throw catRes.error;

  try {
    await syncCategoryTreeFromLegacyCatalog(catalog, regionCode);
  } catch (error) {
    console.warn('Multi-level category tree sync failed; legacy category tables were still updated.', error);
  }

  clearProductCatalogCache();
  notifyProductCatalogUpdated();
  return {
    departments: mainRows.length,
    aisles: subRows.length,
    leafCategories: catRows.length,
  };
}

/** Flat list of all products across all categories */
export async function fetchAllProducts(
  regionCodeOverride?: string | null,
  options: ProductCatalogFetchOptions = {}
): Promise<ProductSpec[]> {
  const regionCode = resolveRegionCode(regionCodeOverride);
  const { data, error } = await withCatalogTimeout(supabase.from('products').select('*').order('name'));
  if (error) throw error;
  const baseProducts = filterRowsByRegion((data as ProductRow[]) ?? [], regionCode).map(mapProduct);
  let products = baseProducts;
  try {
    products = await withCatalogTimeout(
      hydrateStructuredProducts(baseProducts, regionCode)
    );
  } catch (error) {
    if (options.requireStructured) {
      throw error;
    }
    console.warn('Structured product enrichment timed out; using base product rows.', error);
  }
  return options.includeUnpublished ? products : products.filter(isWebsiteProductVisible);
}

/** Search products by name or model */
export async function searchProducts(
  query: string,
  regionCodeOverride?: string | null,
  options: ProductCatalogFetchOptions = {}
): Promise<ProductSpec[]> {
  const regionCode = resolveRegionCode(regionCodeOverride);
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .or(`name.ilike.%${query}%,model.ilike.%${query}%`)
    .order('name')
    .limit(50);
  if (error) throw error;
  const products = await withCatalogTimeout(
    hydrateStructuredProducts(filterRowsByRegion((data as ProductRow[]) ?? [], regionCode).map(mapProduct), regionCode)
  );
  return options.includeUnpublished ? products : products.filter(isWebsiteProductVisible);
}

export interface WebsiteCatalogProductInput {
  id?: string;
  categoryId: string;
  name: string;
  model: string;
  image?: string;
  price: number;
  regionCode?: string | null;
  netWeight?: number;
  grossWeight?: number;
  unitsPerCarton?: number;
  cartonLength?: number;
  cartonWidth?: number;
  cartonHeight?: number;
  cartonNetWeight?: number;
  cartonGrossWeight?: number;
  specifications?: Record<string, string>;
  requireStructuredSave?: boolean;
}

const slugifyProductId = (value: string) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

const scopedStructuredId = (productId: string, regionCode: string | null, suffix: string) =>
  `${productId}-${regionCode || 'shared'}-${suffix}`;

const toIsoDateOrNull = (value: string) => (/^\d{4}-\d{2}-\d{2}$/.test(value.trim()) ? value.trim() : null);

async function upsertStructuredProductData(product: ProductSpec, regionCode: string | null): Promise<boolean> {
  const publishType = getProductPublishType(product);
  const publishStatus = getProductPublishStatus(product);
  const originalPrice = getProductOriginalPrice(product);
  const validUntil = toIsoDateOrNull(getProductSpecValue(product, ['Valid Until']));
  const stockQuantity = getProductSpecValue(product, ['Stock']);
  const parsedStockQuantity = stockQuantity ? parseProductNumber(stockQuantity, NaN) : NaN;

  try {
    const [publicationRes, priceRes, fulfillmentRes] = await Promise.all([
      supabase
        .from('product_publications')
        .upsert(
          {
            id: scopedStructuredId(product.id, regionCode, 'website-publication'),
            product_id: product.id,
            region_code: regionCode,
            publish_type: publishType,
            publish_status: publishStatus,
            display_priority: Number(getProductSpecValue(product, ['Display Priority']) || 100),
            promotion_label: getProductSpecValue(product, ['Discount', 'Deal Label']) || null,
            front_tag: getProductSpecValue(product, ['Deal Tag']) || null,
            website_note: getProductSpecValue(product, ['Website Note']) || null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'product_id,region_code' }
        ),
      supabase
        .from('product_prices')
        .upsert(
          {
            id: scopedStructuredId(product.id, regionCode, 'usd-website'),
            product_id: product.id,
            region_code: regionCode,
            currency: getProductSpecValue(product, ['Currency']) || 'USD',
            unit: getProductUnit(product),
            sale_price: Number(product.price || 0),
            compare_at_price: originalPrice > 0 ? originalPrice : null,
            price_type: 'website',
            valid_until: validUntil,
            status: Number(product.price || 0) > 0 ? 'active' : 'disabled',
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'product_id,region_code,currency,price_type' }
        ),
      supabase
        .from('product_fulfillment')
        .upsert(
          {
            id: scopedStructuredId(product.id, regionCode, 'fulfillment'),
            product_id: product.id,
            region_code: regionCode,
            moq: getProductMoq(product),
            quantity_step: getProductQuantityStep(product),
            stock_quantity: Number.isFinite(parsedStockQuantity) ? parsedStockQuantity : null,
            stock_unit: getProductUnit(product),
            eta_text: getProductSpecValue(product, ['ETA']) || null,
            fulfillment_status: Number.isFinite(parsedStockQuantity) && parsedStockQuantity <= 0 ? 'out-of-stock' : 'available',
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'product_id,region_code' }
        ),
    ]);

    if (publicationRes.error || priceRes.error || fulfillmentRes.error) {
      throw publicationRes.error || priceRes.error || fulfillmentRes.error;
    }
    return true;
  } catch (error) {
    console.warn('Structured product publication save failed; legacy product row was still saved.', error);
    return false;
  }
}

export async function upsertWebsiteCatalogProduct(input: WebsiteCatalogProductInput): Promise<ProductSpec> {
  const regionCode = input.regionCode ? resolveRegionCode(input.regionCode) : null;
  const model = String(input.model || '').trim();
  const name = String(input.name || '').trim();
  if (!input.categoryId) throw new Error('Product category is required');
  if (!name) throw new Error('Product name is required');
  if (!model) throw new Error('Product model is required');

  const id = input.id || slugifyProductId(`${regionCode || 'shared'}-${model || name}`);
  const row = {
    id,
    category_id: input.categoryId,
    name,
    model,
    image: input.image || null,
    price: Number(input.price || 0),
    net_weight: Number(input.netWeight || 0),
    gross_weight: Number(input.grossWeight || 0),
    units_per_carton: Number(input.unitsPerCarton || 1),
    carton_length: Number(input.cartonLength || 0),
    carton_width: Number(input.cartonWidth || 0),
    carton_height: Number(input.cartonHeight || 0),
    carton_net_weight: Number(input.cartonNetWeight || 0),
    carton_gross_weight: Number(input.cartonGrossWeight || 0),
    specifications: stripRegionScopedWebsiteSpecifications(input.specifications || {}),
    region_code: regionCode,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('products')
    .upsert(row, { onConflict: 'id' })
    .select('*')
    .single();
  if (error) throw error;
  const savedProduct = mapProduct(data as ProductRow);
  const structuredSaved = await upsertStructuredProductData(
    {
      ...savedProduct,
      price: Number(input.price || 0),
      specifications: input.specifications || {},
    },
    regionCode
  );
  if (!structuredSaved && input.requireStructuredSave) {
    throw new Error('Structured website promotion data was not confirmed in Supabase');
  }
  if (!structuredSaved && input.specifications) {
    const { error: fallbackError } = await supabase
      .from('products')
      .update({
        specifications: input.specifications,
        updated_at: new Date().toISOString(),
      })
      .eq('id', savedProduct.id);
    if (fallbackError) throw fallbackError;
  }
  clearProductCatalogCache();
  return {
    ...savedProduct,
    price: Number(input.price || 0),
    specifications: structuredSaved ? savedProduct.specifications : input.specifications || {},
  };
}

export async function deleteWebsiteCatalogProduct(id: string): Promise<void> {
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw error;
  clearProductCatalogCache();
  notifyProductCatalogUpdated();
}
