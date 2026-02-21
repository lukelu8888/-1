/**
 * A4 打印助手工具类
 * 
 * A4 标准尺寸：
 * - 物理尺寸：210mm × 297mm
 * - 像素尺寸 (96 DPI)：794px × 1123px
 * - 像素尺寸 (72 DPI)：595px × 842px
 * 
 * 打印边距建议：
 * - 标准边距：15-20mm (约 57-76px)
 * - 可打印区域：170mm × 257mm (约 643px × 971px)
 */

export const A4_CONFIG = {
  // A4 尺寸（毫米）
  width_mm: 210,
  height_mm: 297,
  
  // A4 尺寸（像素，96 DPI）
  width_px: 794,
  height_px: 1123,
  
  // 推荐边距（毫米）
  margin_mm: 15,
  
  // 推荐边距（像素）
  margin_px: 57,
  
  // 可打印区域（毫米）
  printable_width_mm: 180,  // 210 - 15*2
  printable_height_mm: 267, // 297 - 15*2
  
  // 可打印区域（像素）
  printable_width_px: 680,  // 794 - 57*2
  printable_height_px: 1009, // 1123 - 57*2
};

/**
 * 获取A4容器的样式对象
 * @param padding 内边距（毫米）
 */
export function getA4ContainerStyle(padding: number = 15) {
  return {
    width: `${A4_CONFIG.width_mm}mm`,
    minHeight: `${A4_CONFIG.height_mm}mm`,
    padding: `${padding}mm`,
    margin: '0 auto',
    backgroundColor: '#ffffff',
    boxShadow: '0 0 10px rgba(0,0,0,0.1)',
  };
}

/**
 * 获取A4容器的Tailwind类名
 */
export function getA4ContainerClasses() {
  return 'bg-white shadow-lg mx-auto a4-page';
}

/**
 * A4打印CSS样式字符串
 * 可以注入到<style>标签或全局CSS中
 */
export const A4_PRINT_STYLES = `
/* ========================================
   A4 标准打印样式
   ======================================== */

/* A4 页面容器 */
.a4-page {
  width: 210mm;
  min-height: 297mm;
  background: white;
  margin: 0 auto;
  position: relative;
  box-sizing: border-box;
}

/* 屏幕预览样式 */
@media screen {
  .a4-page {
    box-shadow: 0 0 10px rgba(0,0,0,0.1);
    margin: 20px auto;
  }
  
  /* 为了屏幕预览，可以添加缩放 */
  .a4-container {
    max-width: 100%;
    overflow-x: auto;
  }
}

/* 打印样式 */
@media print {
  /* 页面设置 */
  @page {
    size: A4 portrait;
    margin: 15mm;
  }
  
  /* 重置body */
  body {
    margin: 0;
    padding: 0;
    background: white !important;
  }
  
  /* A4页面在打印时 */
  .a4-page {
    width: 100%;
    min-height: auto;
    margin: 0;
    padding: 0;
    box-shadow: none !important;
    page-break-after: always;
  }
  
  /* 最后一页不分页 */
  .a4-page:last-child {
    page-break-after: auto;
  }
  
  /* 隐藏打印按钮等UI元素 */
  .no-print,
  .print\\\\:hidden,
  button:not(.force-print),
  [class*="fixed"],
  [class*="sticky"] {
    display: none !important;
  }
  
  /* 确保颜色正确打印 */
  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    color-adjust: exact !important;
  }
  
  /* 避免表格被分页切断 */
  table {
    page-break-inside: auto;
  }
  
  tr {
    page-break-inside: avoid;
    page-break-after: auto;
  }
  
  thead {
    display: table-header-group;
  }
  
  tfoot {
    display: table-footer-group;
  }
  
  /* 避免重要内容被分页切断 */
  .avoid-break,
  .page-break-inside-avoid {
    page-break-inside: avoid !important;
    break-inside: avoid !important;
  }
  
  /* 强制在此之前分页 */
  .page-break-before {
    page-break-before: always !important;
    break-before: page !important;
  }
  
  /* 强制在此之后分页 */
  .page-break-after {
    page-break-after: always !important;
    break-after: page !important;
  }
  
  /* 移除所有阴影 */
  * {
    box-shadow: none !important;
    text-shadow: none !important;
  }
  
  /* 重置Dialog等浮层组件 */
  [role="dialog"],
  [data-radix-portal] {
    position: static !important;
    max-width: none !important;
    width: 100% !important;
    height: auto !important;
    overflow: visible !important;
    border: none !important;
    margin: 0 !important;
    padding: 0 !important;
    transform: none !important;
    inset: auto !important;
  }
  
  /* 隐藏Dialog遮罩 */
  [data-radix-dialog-overlay] {
    display: none !important;
  }
}

/* ========================================
   THE COSUN BM 表单专用样式
   ======================================== */

/* 表单容器 */
.cosun-form-container {
  width: 210mm;
  min-height: 297mm;
  padding: 15mm;
  background: white;
  margin: 0 auto;
  box-sizing: border-box;
  font-family: Arial, "Microsoft JhengHei", "SimHei", sans-serif;
}

@media screen {
  .cosun-form-container {
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    margin: 20px auto;
  }
}

@media print {
  .cosun-form-container {
    width: 100%;
    margin: 0;
    padding: 0;
    box-shadow: none;
    page-break-after: always;
  }
  
  .cosun-form-container:last-child {
    page-break-after: auto;
  }
}

/* 表单页眉 */
.cosun-form-header {
  margin-bottom: 5mm;
  padding-bottom: 3mm;
  border-bottom: 2px solid;
}

/* 表单表格 */
.cosun-form-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 3mm;
}

.cosun-form-table th,
.cosun-form-table td {
  border: 1px solid #ddd;
  padding: 2mm;
  font-size: 9pt;
  line-height: 1.3;
}

.cosun-form-table th {
  background-color: #f5f5f5;
  font-weight: 600;
}

@media print {
  .cosun-form-table {
    font-size: 8pt;
  }
  
  .cosun-form-table th,
  .cosun-form-table td {
    padding: 1.5mm;
  }
}

/* 表单页脚 */
.cosun-form-footer {
  margin-top: 5mm;
  padding-top: 3mm;
  border-top: 1px solid #ddd;
  font-size: 8pt;
  color: #666;
  text-align: center;
}

/* 签名区域 */
.cosun-signature-area {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10mm;
  margin-top: 8mm;
  margin-bottom: 5mm;
}

.cosun-signature-box {
  border: 1px solid #ddd;
  padding: 5mm;
  min-height: 30mm;
}

/* 确保图片不超出容器 */
.cosun-form-container img {
  max-width: 100%;
  height: auto;
}

/* 产品图片固定尺寸 */
.cosun-product-image {
  width: 15mm;
  height: 15mm;
  object-fit: cover;
  border: 1px solid #ddd;
}

@media print {
  .cosun-product-image {
    width: 12mm;
    height: 12mm;
  }
}
`;

/**
 * 注入A4打印样式到页面
 */
export function injectA4PrintStyles() {
  if (typeof document === 'undefined') return;
  
  const styleId = 'a4-print-styles';
  
  // 检查是否已经注入
  if (document.getElementById(styleId)) return;
  
  // 创建并注入样式
  const styleElement = document.createElement('style');
  styleElement.id = styleId;
  styleElement.textContent = A4_PRINT_STYLES;
  document.head.appendChild(styleElement);
}

/**
 * 移除A4打印样式
 */
export function removeA4PrintStyles() {
  if (typeof document === 'undefined') return;
  
  const styleElement = document.getElementById('a4-print-styles');
  if (styleElement) {
    styleElement.remove();
  }
}

/**
 * 触发打印对话框
 * @param beforePrint 打印前的回调
 * @param afterPrint 打印后的回调
 */
export function triggerPrint(
  beforePrint?: () => void,
  afterPrint?: () => void
) {
  if (typeof window === 'undefined') return;
  
  // 确保样式已注入
  injectA4PrintStyles();
  
  // 执行打印前回调
  if (beforePrint) beforePrint();
  
  // 触发打印
  window.print();
  
  // 打印后回调（使用setTimeout确保打印对话框关闭后执行）
  if (afterPrint) {
    setTimeout(afterPrint, 100);
  }
}

/**
 * 检查内容是否超出A4页面高度
 * @param element HTML元素
 * @param paddingMm 页面内边距（毫米）
 * @returns 是否超出
 */
export function isContentOverflowing(
  element: HTMLElement,
  paddingMm: number = 15
): boolean {
  if (!element) return false;
  
  const contentHeight = element.offsetHeight;
  const maxHeight = A4_CONFIG.height_mm * 3.7795275591; // mm to px (96 DPI)
  const usableHeight = maxHeight - (paddingMm * 2 * 3.7795275591);
  
  return contentHeight > usableHeight;
}

/**
 * 计算内容需要多少页A4纸
 * @param element HTML元素
 * @param paddingMm 页面内边距（毫米）
 * @returns 页数
 */
export function calculatePageCount(
  element: HTMLElement,
  paddingMm: number = 15
): number {
  if (!element) return 1;
  
  const contentHeight = element.offsetHeight;
  const maxHeight = A4_CONFIG.height_mm * 3.7795275591; // mm to px (96 DPI)
  const usableHeight = maxHeight - (paddingMm * 2 * 3.7795275591);
  
  return Math.ceil(contentHeight / usableHeight);
}

/**
 * 为表单添加页码
 * @param pageNumber 当前页码
 * @param totalPages 总页数
 * @returns 页码文本
 */
export function formatPageNumber(pageNumber: number, totalPages: number): string {
  return `Page ${pageNumber} of ${totalPages}`;
}
