/**
 * 🔢 7级单据编号体系配置
 * 
 * 完整业务流程：
 * 1. INQ (客户询价) → 2. QR (采购需求) → 3. XJ (询价比价) → 4. BJ (供应商报价) 
 * → 5. QT (销售报价) → 6. SO (销售订单) → 7. PO (采购订单)
 */

export interface DocumentLevel {
  level: number; // 级别序号 1-7
  code: string; // 单据代码 INQ/QR/XJ/BJ/QT/SO/PO
  name: string; // 中文名称
  enName: string; // 英文名称
  color: string; // 显示颜色
  icon?: string; // 图标（可选）
}

export const DOCUMENT_LEVELS: Record<string, DocumentLevel> = {
  'INQ': {
    level: 1,
    code: 'INQ',
    name: '客户询价',
    enName: 'Customer Inquiry',
    color: 'blue'
  },
  'XJ': {
    level: 1,
    code: 'INQ',
    name: '客户询价',
    enName: 'Customer Inquiry',
    color: 'blue'
  },
  'QR': {
    level: 2,
    code: 'QR',
    name: '采购需求',
    enName: 'Purchase Requirement',
    color: 'purple'
  },
  'XJ': {
    level: 3,
    code: 'XJ',
    name: '询价比价',
    enName: 'Procurement Inquiry Comparison',
    color: 'orange'
  },
  'BJ': {
    level: 4,
    code: 'BJ',
    name: '供应商报价',
    enName: 'Supplier Quotation',
    color: 'green'
  },
  'QT': {
    level: 5,
    code: 'QT',
    name: '销售报价',
    enName: 'Sales Quotation',
    color: 'cyan'
  },
  'SO': {
    level: 6,
    code: 'SO',
    name: '销售订单',
    enName: 'Sales Order',
    color: 'pink'
  },
  'PO': {
    level: 7,
    code: 'PO',
    name: '采购订单',
    enName: 'Purchase Order',
    color: 'red'
  }
};

/**
 * 从单据编号中提取单据类型代码
 * @param documentNumber 单据编号，如 "QR-NA-251225-0001" 或 "INQ-NA-251225-0001"
 * @returns 单据类型代码，如 "QR" 或 "INQ"
 */
export function extractDocumentCode(documentNumber: string): string {
  if (!documentNumber) return '';
  
  // 处理 RFQ 开头的情况（映射到 INQ）
  if (documentNumber.startsWith('RFQ-')) {
    return 'XJ';
  }
  
  // 提取第一个 "-" 之前的部分
  const parts = documentNumber.split('-');
  return parts[0] || '';
}

/**
 * 获取单据的级别信息
 * @param documentNumber 单据编号
 * @returns 单据级别信息
 */
export function getDocumentLevel(documentNumber: string): DocumentLevel | null {
  const code = extractDocumentCode(documentNumber);
  return DOCUMENT_LEVELS[code] || null;
}

/**
 * 格式化单据编号，添加级别前缀
 * @param documentNumber 原始单据编号
 * @param showLevel 是否显示级别数字，默认 true
 * @returns 格式化后的单据编号，如 "2. QR-NA-251225-0001"
 */
export function formatDocumentNumber(documentNumber: string, showLevel: boolean = true): string {
  if (!documentNumber) return '';
  
  if (!showLevel) return documentNumber;
  
  const level = getDocumentLevel(documentNumber);
  if (!level) return documentNumber;
  
  return `${level.level}. ${documentNumber}`;
}

/**
 * 获取单据的显示颜色类
 * @param documentNumber 单据编号
 * @returns Tailwind CSS 颜色类
 */
export function getDocumentColorClass(documentNumber: string): string {
  const level = getDocumentLevel(documentNumber);
  if (!level) return 'text-gray-600';
  
  const colorMap: Record<string, string> = {
    'blue': 'text-blue-600',
    'purple': 'text-purple-600',
    'orange': 'text-orange-600',
    'green': 'text-green-600',
    'cyan': 'text-cyan-600',
    'pink': 'text-pink-600',
    'red': 'text-red-600'
  };
  
  return colorMap[level.color] || 'text-gray-600';
}

/**
 * 获取单据的背景颜色类
 * @param documentNumber 单据编号
 * @returns Tailwind CSS 背景颜色类
 */
export function getDocumentBgColorClass(documentNumber: string): string {
  const level = getDocumentLevel(documentNumber);
  if (!level) return 'bg-gray-100';
  
  const colorMap: Record<string, string> = {
    'blue': 'bg-blue-100',
    'purple': 'bg-purple-100',
    'orange': 'bg-orange-100',
    'green': 'bg-green-100',
    'cyan': 'bg-cyan-100',
    'pink': 'bg-pink-100',
    'red': 'bg-red-100'
  };
  
  return colorMap[level.color] || 'bg-gray-100';
}

/**
 * 渲染单据编号的 React 组件辅助函数
 * @param documentNumber 单据编号
 * @param options 显示选项
 * @returns 格式化的显示内容
 */
export function renderDocumentNumber(
  documentNumber: string,
  options: {
    showLevel?: boolean; // 是否显示级别数字
    showName?: boolean; // 是否显示单据名称
    showColor?: boolean; // 是否使用颜色
  } = {}
): {
  formattedNumber: string;
  level: DocumentLevel | null;
  colorClass: string;
  bgColorClass: string;
} {
  const { showLevel = true, showName = false, showColor = true } = options;
  
  const level = getDocumentLevel(documentNumber);
  const formattedNumber = formatDocumentNumber(documentNumber, showLevel);
  
  return {
    formattedNumber: showName && level ? `${formattedNumber} (${level.name})` : formattedNumber,
    level,
    colorClass: showColor ? getDocumentColorClass(documentNumber) : 'text-gray-600',
    bgColorClass: showColor ? getDocumentBgColorClass(documentNumber) : 'bg-gray-100'
  };
}
