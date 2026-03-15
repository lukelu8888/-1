import { supabase } from '@/lib/supabase';
import type { MainCategory, SubCategory, ProductCategory, ProductSpec } from '@/data/productData';
import { productCategories } from '@/data/productCategories';
import { toRegionCode } from '@/lib/supabaseService';

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

// ── Mappers ─────────────────────────────────────────────────
function mapProduct(row: ProductRow): ProductSpec {
  return {
    id: row.id,
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

// ── Cache (session-level) ───────────────────────────────────
const catalogCache = new Map<string, MainCategory[]>();
const PRODUCT_CATALOG_TIMEOUT_MS = 5000;
const REGION_STORAGE_KEY = 'cosun-region';

const FALLBACK_CATEGORY_ICONS: Record<string, string> = {
  appliances: '🏠',
  bath: '🚿',
  'building-materials': '🏗️',
  'doors-windows': '🚪',
  electrical: '⚡',
  flooring: '🪵',
  hardware: '🔩',
  'heating-cooling': '❄️',
  kitchen: '🍳',
  'lawn-garden': '🌿',
  paint: '🎨',
  plumbing: '🚰',
  'storage-organization': '📦',
  tools: '🛠️',
};

const FALLBACK_PRODUCT_VARIANTS = [
  { prefix: 'Classic', suffix: 'Series', priceDelta: 0 },
  { prefix: 'Premium', suffix: 'Edition', priceDelta: 5 },
];

function toTitleCase(input: string): string {
  return input
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

function buildFallbackImageDataUri(mainCategoryId: string, productCategoryName: string, variantIndex: number): string {
  const categoryLabel = toTitleCase(mainCategoryId);
  const subtitle = `${productCategoryName} ${variantIndex + 1}`;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="640" height="640" viewBox="0 0 640 640">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#fff4ed" />
          <stop offset="100%" stop-color="#fde6d8" />
        </linearGradient>
      </defs>
      <rect width="640" height="640" fill="url(#bg)" rx="36" />
      <rect x="48" y="48" width="544" height="544" rx="28" fill="#ffffff" stroke="#f97316" stroke-width="8" />
      <circle cx="320" cy="220" r="88" fill="#ffedd5" />
      <path d="M255 220h130M320 155v130" stroke="#f97316" stroke-width="18" stroke-linecap="round" />
      <text x="320" y="390" text-anchor="middle" font-family="Arial, sans-serif" font-size="34" font-weight="700" fill="#111827">${categoryLabel}</text>
      <text x="320" y="438" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" fill="#475569">${subtitle}</text>
    </svg>
  `.trim();

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function buildFallbackProduct(
  regionCode: string,
  sequenceNo: number,
  mainCategoryId: string,
  subCategoryId: string,
  productCategoryId: string,
  productCategoryName: string,
  variantIndex: number,
): ProductSpec {
  const variantNo = variantIndex + 1;
  const variant = FALLBACK_PRODUCT_VARIANTS[variantIndex] || FALLBACK_PRODUCT_VARIANTS[0];
  const displayName = `${variant.prefix} ${productCategoryName} ${variant.suffix}`;
  const yymm = new Date().toISOString().slice(2, 7).replace('-', '');
  const modelNo = `${regionCode}-${yymm}-${String(sequenceNo).padStart(4, '0')}`;
  const fallbackImage = buildFallbackImageDataUri(mainCategoryId, displayName, variantIndex);

  return {
    id: `${productCategoryId}-sample-${variantNo}`,
    name: displayName,
    model: modelNo,
    image: fallbackImage,
    regionCode,
    price: 19.9 + variant.priceDelta,
    netWeight: 1 + variantIndex * 0.15,
    grossWeight: 1.2 + variantIndex * 0.2,
    unitsPerCarton: 12 + variantIndex * 6,
    cartonDimensions: {
      length: 40 + variantIndex * 5,
      width: 30 + variantIndex * 3,
      height: 25 + variantIndex * 2,
    },
    cartonNetWeight: 12 + variantIndex * 1.5,
    cartonGrossWeight: 14 + variantIndex * 1.7,
    specifications: {
      Category: toTitleCase(mainCategoryId),
      Series: `${displayName} Collection`,
      Material: variantIndex % 2 === 0 ? 'ABS / Steel' : 'Aluminum / Plastic',
      Finish: variantIndex % 2 === 0 ? 'Matte White' : 'Brushed Silver',
    },
  };
}

function getCurrentRegionCode(): string {
  if (typeof window === 'undefined') return 'NA';
  const storedRegion = window.localStorage.getItem(REGION_STORAGE_KEY);
  return toRegionCode(storedRegion) || 'NA';
}

function filterRowsByRegion<T extends { region_code?: string | null }>(rows: T[], regionCode: string): T[] {
  const hasRegionScopedRows = rows.some((row) => Boolean(row.region_code));
  if (!hasRegionScopedRows) return rows;
  return rows.filter((row) => !row.region_code || row.region_code === regionCode);
}

function buildFallbackCatalog(regionCode: string): MainCategory[] {
  let sequenceNo = 1;

  return productCategories.map((mainCategory) => ({
    id: mainCategory.id,
    name: mainCategory.enLabel,
    icon: mainCategory.iconName || FALLBACK_CATEGORY_ICONS[mainCategory.id] || '📁',
    description: mainCategory.label,
    subCategories: mainCategory.categories.map<SubCategory>((subCategory) => ({
      id: subCategory.id,
      name: subCategory.enLabel,
      description: subCategory.label,
      productCategories: subCategory.subCategories.map<ProductCategory>((productCategory) => ({
        id: productCategory.id,
        name: productCategory.enLabel,
        description: productCategory.label,
        products: [
          buildFallbackProduct(
            regionCode,
            sequenceNo++,
            mainCategory.id,
            subCategory.id,
            productCategory.id,
            productCategory.enLabel,
            0,
          ),
          buildFallbackProduct(
            regionCode,
            sequenceNo++,
            mainCategory.id,
            subCategory.id,
            productCategory.id,
            productCategory.enLabel,
            1,
          ),
        ],
      })),
    })),
  }));
}

async function withCatalogTimeout<T>(task: Promise<T>, timeoutMs = PRODUCT_CATALOG_TIMEOUT_MS): Promise<T> {
  return Promise.race<T>([
    task,
    new Promise<T>((_, reject) => {
      window.setTimeout(() => reject(new Error('Product catalog request timed out')), timeoutMs);
    }),
  ]);
}

// ── Main fetch function ──────────────────────────────────────
export async function fetchProductCatalog(): Promise<MainCategory[]> {
  const regionCode = getCurrentRegionCode();
  const cachedCatalog = catalogCache.get(regionCode);
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

    if (filteredMainRows.length === 0) {
      const fallbackCatalog = buildFallbackCatalog(regionCode);
      catalogCache.set(regionCode, fallbackCatalog);
      return fallbackCatalog;
    }

    // Build lookup maps
    const prodsByCategory = new Map<string, ProductSpec[]>();
    for (const p of filteredProdRows) {
      if (!prodsByCategory.has(p.category_id)) prodsByCategory.set(p.category_id, []);
      prodsByCategory.get(p.category_id)!.push(mapProduct(p));
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

    catalogCache.set(regionCode, catalog);
    return catalog;
  } catch (error) {
    console.warn('Falling back to local product catalog because Supabase catalog fetch failed.', error);
    const fallbackCatalog = buildFallbackCatalog(regionCode);
    catalogCache.set(regionCode, fallbackCatalog);
    return fallbackCatalog;
  }
}

/** Clear session cache (e.g. after admin updates) */
export function clearProductCatalogCache(): void {
  catalogCache.clear();
}

/** Flat list of all products across all categories */
export async function fetchAllProducts(): Promise<ProductSpec[]> {
  const regionCode = getCurrentRegionCode();
  const { data, error } = await supabase.from('products').select('*').order('name');
  if (error) throw error;
  return filterRowsByRegion((data as ProductRow[]) ?? [], regionCode).map(mapProduct);
}

/** Search products by name or model */
export async function searchProducts(query: string): Promise<ProductSpec[]> {
  const regionCode = getCurrentRegionCode();
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .or(`name.ilike.%${query}%,model.ilike.%${query}%`)
    .order('name')
    .limit(50);
  if (error) throw error;
  return filterRowsByRegion((data as ProductRow[]) ?? [], regionCode).map(mapProduct);
}
