// ============================================================
// productData.ts - 类型定义 & 兼容层
// 产品数据已迁移至 Supabase（Migration 014）
// 使用 fetchProductCatalog() 从数据库获取数据
// 详见: src/lib/services/productCatalogService.ts
// ============================================================

export interface ProductSpec {
  id: string;
  name: string;
  model: string;
  image: string;
  specifications: {
    [key: string]: string;
  };
  netWeight: number;
  grossWeight: number;
  unitsPerCarton: number;
  cartonDimensions: {
    length: number;
    width: number;
    height: number;
  };
  cartonNetWeight: number;
  cartonGrossWeight: number;
  price?: number;
}

// 三级类目
export interface ProductCategory {
  id: string;
  name: string;
  description?: string;
  products: ProductSpec[];
}

// 二级类目
export interface SubCategory {
  id: string;
  name: string;
  description?: string;
  productCategories: ProductCategory[];
}

// 一级类目
export interface MainCategory {
  id: string;
  name: string;
  icon: string;
  description?: string;
  subCategories: SubCategory[];
}

// 兼容层：保留空数组供同步代码使用（建议迁移到 fetchProductCatalog）
// @deprecated 请使用 fetchProductCatalog() 替代
export const productCatalog: MainCategory[] = [];
