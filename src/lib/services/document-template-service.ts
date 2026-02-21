/**
 * 📄 文档模板服务
 * 
 * 用途：
 * 1. 集中管理所有B2B外贸文档模板
 * 2. 提供给各个角色工作台调用
 * 3. 支持文档生成、预览、下载
 */

// 🔥 8种核心B2B外贸文档模板
export const DOCUMENT_TEMPLATES = [
  {
    id: 'inquiry',
    name: '客户询价单',
    nameEn: 'Customer Inquiry',
    category: 'sales',
    icon: '📝',
    description: '客户询价信息记录单',
    roles: ['Sales_Rep', 'Sales_Manager', 'CEO', 'Marketing_Ops'], // 可访问的角色
    component: 'CustomerInquiryDocument',
    dataInterface: 'CustomerInquiryData',
    color: '#3B82F6',
    businessStage: '询价阶段',
    order: 1
  },
  {
    id: 'quotation',
    name: '业务员报价单',
    nameEn: 'Quotation',
    category: 'sales',
    icon: '💰',
    description: '业务员向客户提供的正式报价',
    roles: ['Sales_Rep', 'Sales_Manager', 'CEO'],
    component: 'QuotationDocument',
    dataInterface: 'QuotationData',
    color: '#10B981',
    businessStage: '报价阶段',
    order: 2
  },
  {
    id: 'pi',
    name: '形式发票',
    nameEn: 'Proforma Invoice',
    category: 'sales',
    icon: '📋',
    description: '正式订单前的形式发票',
    roles: ['Sales_Rep', 'Sales_Manager', 'Finance', 'CFO', 'CEO'],
    component: 'ProformaInvoiceDocument',
    dataInterface: 'ProformaInvoiceData',
    color: '#8B5CF6',
    businessStage: '订单确认阶段',
    order: 3
  },
  {
    id: 'sc',
    name: '销售合同',
    nameEn: 'Sales Contract',
    category: 'contract',
    icon: '📜',
    description: '与客户签订的正式销售合同',
    roles: ['Sales_Rep', 'Sales_Manager', 'CEO', 'Finance', 'CFO'],
    component: 'SalesContractDocument',
    dataInterface: 'SalesContractData',
    color: '#EF4444',
    businessStage: '合同签订阶段',
    order: 4
  },
  {
    id: 'po',
    name: '采购订单',
    nameEn: 'Purchase Order',
    category: 'procurement',
    icon: '🛒',
    description: '向供应商下达的采购订单',
    roles: ['Procurement', 'Sales_Rep', 'CEO'],
    component: 'PurchaseOrderDocument',
    dataInterface: 'PurchaseOrderData',
    color: '#F59E0B',
    businessStage: '采购阶段',
    order: 5
  },
  {
    id: 'ci',
    name: '商业发票',
    nameEn: 'Commercial Invoice',
    category: 'shipping',
    icon: '📄',
    description: '出口报关和结汇用的商业发票',
    roles: ['Documentation_Officer', 'Finance', 'CFO', 'CEO', 'Sales_Rep'],
    component: 'CommercialInvoiceDocument',
    dataInterface: 'CommercialInvoiceData',
    color: '#06B6D4',
    businessStage: '出货单证阶段',
    order: 6
  },
  {
    id: 'pl',
    name: '包装清单',
    nameEn: 'Packing List',
    category: 'shipping',
    icon: '📦',
    description: '出口货物的详细包装清单',
    roles: ['Documentation_Officer', 'Sales_Rep', 'CEO'],
    component: 'PackingListDocument',
    dataInterface: 'PackingListData',
    color: '#14B8A6',
    businessStage: '出货单证阶段',
    order: 7
  },
  {
    id: 'soa',
    name: '账户对账单',
    nameEn: 'Statement of Account',
    category: 'finance',
    icon: '💳',
    description: '客户账户往来对账单',
    roles: ['Finance', 'CFO', 'CEO', 'Sales_Manager'],
    component: 'StatementOfAccountDocument',
    dataInterface: 'StatementOfAccountData',
    color: '#EC4899',
    businessStage: '财务对账阶段',
    order: 8
  }
] as const;

// 🔥 文档分类
export const DOCUMENT_CATEGORIES = {
  sales: { name: '销售类', icon: '💼', color: '#3B82F6' },
  contract: { name: '合同类', icon: '📜', color: '#EF4444' },
  procurement: { name: '采购类', icon: '🛒', color: '#F59E0B' },
  shipping: { name: '单证类', icon: '🚢', color: '#06B6D4' },
  finance: { name: '财务类', icon: '💰', color: '#EC4899' }
} as const;

/**
 * 根据角色获取可用的文档模板
 */
export function getTemplatesByRole(role: string) {
  return DOCUMENT_TEMPLATES.filter(template => 
    template.roles.includes(role as any)
  );
}

/**
 * 根据分类获取文档模板
 */
export function getTemplatesByCategory(category: string) {
  return DOCUMENT_TEMPLATES.filter(template => 
    template.category === category
  );
}

/**
 * 根据业务阶段获取文档模板
 */
export function getTemplatesByStage(stage: string) {
  return DOCUMENT_TEMPLATES.filter(template => 
    template.businessStage === stage
  );
}

/**
 * 获取单个模板信息
 */
export function getTemplateById(id: string) {
  return DOCUMENT_TEMPLATES.find(template => template.id === id);
}

/**
 * 文档模板统计
 */
export function getTemplateStats(role?: string) {
  const templates = role ? getTemplatesByRole(role) : DOCUMENT_TEMPLATES;
  
  return {
    total: templates.length,
    byCategory: Object.keys(DOCUMENT_CATEGORIES).map(cat => ({
      category: cat,
      name: DOCUMENT_CATEGORIES[cat as keyof typeof DOCUMENT_CATEGORIES].name,
      count: templates.filter(t => t.category === cat).length
    })),
    byStage: Array.from(new Set(templates.map(t => t.businessStage))).map(stage => ({
      stage,
      count: templates.filter(t => t.businessStage === stage).length
    }))
  };
}
