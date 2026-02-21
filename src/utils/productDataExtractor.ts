/**
 * 🔧 产品数据智能提取工具
 * 
 * 用途：统一提取产品的 modelNo 和 specification 字段
 * 确保在不同模块（INQ→QR→XJ等）之间数据同步一致
 */

export interface ProductData {
  modelNo?: string;
  sku?: string;
  productCode?: string;
  id?: string;
  color?: string;
  specification?: string;
  specifications?: string;
  specs?: string;
  description?: string;
  material?: string;
  cartonSize?: string;
  [key: string]: any;
}

/**
 * 智能提取 Model No
 * 
 * 提取逻辑（优先级从高到低）：
 * 1. 直接使用 modelNo 字段
 * 2. 使用 sku / productCode / id 字段
 * 3. 如果是长格式SKU（如"appliances-refrigerators-french-door-ref-fd-001"），提取最后2-3段
 * 4. 降级使用 color 字段
 * 5. 最后使用序号
 */
export function extractModelNo(product: ProductData, index: number = 0): string {
  let modelNo = product.modelNo || product.sku || product.productCode || product.id || '';
  
  // 智能提取 SKU（例如："appliances-refrigerators-french-door-ref-fd-001" => "FD-001"）
  if (modelNo && modelNo !== 'N/A' && !product.modelNo) {
    const segments = modelNo.split('-');
    if (segments.length >= 2) {
      const lastSegment = segments[segments.length - 1];
      const secondLastSegment = segments[segments.length - 2];
      
      if (/^[a-zA-Z0-9]+$/.test(lastSegment)) {
        if (secondLastSegment && secondLastSegment.length <= 4 && /^[a-zA-Z]+$/.test(secondLastSegment)) {
          modelNo = `${secondLastSegment.toUpperCase()}-${lastSegment}`;
        } else {
          modelNo = lastSegment;
        }
      }
    }
  }
  
  // 如果还没有 modelNo，使用 color 或生成序号
  if (!modelNo || modelNo === 'N/A') {
    modelNo = product.color || String(index + 1).padStart(4, '0');
  }
  
  return modelNo;
}

/**
 * 智能提取 Specification
 * 
 * 提取逻辑（优先级从高到低）：
 * 1. 直接使用 specification / specifications / specs 字段
 * 2. 使用 description 字段
 * 3. 组合 material, color, cartonSize 等有用信息
 * 4. 返回 '-'
 */
export function extractSpecification(product: ProductData): string {
  // 优先使用专用字段
  const spec = product.specification || product.specifications || product.specs || product.description;
  
  if (spec) {
    return spec;
  }
  
  // 组合其他有用信息
  const parts = [product.material, product.color, product.cartonSize].filter(Boolean);
  if (parts.length > 0) {
    return parts.join(', ');
  }
  
  return '-';
}

/**
 * 提取完整的产品信息
 * 
 * 用于统一转换产品数据格式
 */
export function extractProductInfo(product: ProductData, index: number = 0) {
  return {
    modelNo: extractModelNo(product, index),
    specification: extractSpecification(product)
  };
}
