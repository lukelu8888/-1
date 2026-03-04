import { supabase } from '@/lib/supabase';
import type { MainCategory, SubCategory, ProductCategory, ProductSpec } from '@/data/productData';

// ── Supabase row types ──────────────────────────────────────
interface MainCategoryRow {
  id: string;
  name: string;
  icon: string;
  description: string | null;
  sort_order: number;
}

interface SubCategoryRow {
  id: string;
  main_category_id: string;
  name: string;
  description: string | null;
  sort_order: number;
}

interface ProductCategoryRow {
  id: string;
  sub_category_id: string;
  name: string;
  description: string | null;
  sort_order: number;
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
}

// ── Mappers ─────────────────────────────────────────────────
function mapProduct(row: ProductRow): ProductSpec {
  return {
    id: row.id,
    name: row.name,
    model: row.model,
    image: row.image ?? '',
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
let catalogCache: MainCategory[] | null = null;

// ── Main fetch function ──────────────────────────────────────
export async function fetchProductCatalog(): Promise<MainCategory[]> {
  if (catalogCache) return catalogCache;

  const [mainRes, subRes, catRes, prodRes] = await Promise.all([
    supabase.from('product_main_categories').select('*').order('sort_order'),
    supabase.from('product_sub_categories').select('*').order('sort_order'),
    supabase.from('product_categories').select('*').order('sort_order'),
    supabase.from('products').select('*').order('name'),
  ]);

  if (mainRes.error) throw mainRes.error;
  if (subRes.error) throw subRes.error;
  if (catRes.error) throw catRes.error;
  if (prodRes.error) throw prodRes.error;

  const mainRows: MainCategoryRow[] = mainRes.data ?? [];
  const subRows: SubCategoryRow[] = subRes.data ?? [];
  const catRows: ProductCategoryRow[] = catRes.data ?? [];
  const prodRows: ProductRow[] = prodRes.data ?? [];

  // Build lookup maps
  const prodsByCategory = new Map<string, ProductSpec[]>();
  for (const p of prodRows) {
    if (!prodsByCategory.has(p.category_id)) prodsByCategory.set(p.category_id, []);
    prodsByCategory.get(p.category_id)!.push(mapProduct(p));
  }

  const catsBySub = new Map<string, ProductCategory[]>();
  for (const c of catRows) {
    if (!catsBySub.has(c.sub_category_id)) catsBySub.set(c.sub_category_id, []);
    catsBySub.get(c.sub_category_id)!.push({
      id: c.id,
      name: c.name,
      description: c.description ?? undefined,
      products: prodsByCategory.get(c.id) ?? [],
    });
  }

  const subsByMain = new Map<string, SubCategory[]>();
  for (const s of subRows) {
    if (!subsByMain.has(s.main_category_id)) subsByMain.set(s.main_category_id, []);
    subsByMain.get(s.main_category_id)!.push({
      id: s.id,
      name: s.name,
      description: s.description ?? undefined,
      productCategories: catsBySub.get(s.id) ?? [],
    });
  }

  catalogCache = mainRows.map((m) => ({
    id: m.id,
    name: m.name,
    icon: m.icon,
    description: m.description ?? undefined,
    subCategories: subsByMain.get(m.id) ?? [],
  }));

  return catalogCache;
}

/** Clear session cache (e.g. after admin updates) */
export function clearProductCatalogCache(): void {
  catalogCache = null;
}

/** Flat list of all products across all categories */
export async function fetchAllProducts(): Promise<ProductSpec[]> {
  const { data, error } = await supabase.from('products').select('*').order('name');
  if (error) throw error;
  return (data as ProductRow[]).map(mapProduct);
}

/** Search products by name or model */
export async function searchProducts(query: string): Promise<ProductSpec[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .or(`name.ilike.%${query}%,model.ilike.%${query}%`)
    .order('name')
    .limit(50);
  if (error) throw error;
  return (data as ProductRow[]).map(mapProduct);
}
