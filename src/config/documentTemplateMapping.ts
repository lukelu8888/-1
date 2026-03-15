/**
 * 📋 文档模板中心化管理配置
 * 
 * 用途：定义文档中心模板到各业务模块的映射关系
 * 更新策略：当文档中心模板升级时，所有引用的业务模块自动获得最新版本
 * 
 * @author COSUN B2B System
 * @date 2025-12-14
 */

/**
 * 文档模板映射表
 * 
 * 结构说明：
 * - templateId: 文档模板唯一标识
 * - templateName: 模板中文名称
 * - templateNameEn: 模板英文名称
 * - templateComponent: 文档中心模板组件路径
 * - dataInterface: 模板数据接口
 * - usedInModules: 使用该模板的业务模块列表
 */
export const DOCUMENT_TEMPLATE_MAPPING = {
  // 🔥 客户询价单模板
  ing: {
    templateId: 'ing',
    templateName: '客户询价单',
    templateNameEn: 'Customer Inquiry Form',
    templateComponent: '@/components/documents/templates/CustomerInquiryDocument',
    dataInterface: 'CustomerInquiryData',
    canonicalDocumentCode: 'ING',
    usedInModules: [
      { 
        module: 'customer-portal', 
        subModule: 'ing',
        description: '客户端 - 询价模块'
      }
    ]
  },
  
  // 🔥 业务员报价单模板
  qt: {
    templateId: 'qt',
    templateName: '业务员报价单',
    templateNameEn: 'Quotation / Proforma Invoice',
    templateComponent: '@/components/documents/templates/QuotationDocument',
    dataInterface: 'QuotationData',
    canonicalDocumentCode: 'QT',
    usedInModules: [
      { 
        module: 'admin-portal', 
        subModule: 'quotation-management',
        description: '销售端 - 报价管理'
      },
      {
        module: 'admin-portal',
        subModule: 'inquiry-management',
        description: '销售端 - 询价管理（生成报价）'
      }
    ]
  },
  
  // 🔥 销售合同模板
  sc: {
    templateId: 'sc',
    templateName: '销售合同',
    templateNameEn: 'Sales Contract',
    templateComponent: '@/components/documents/templates/SalesContractDocument',
    dataInterface: 'SalesContractData',
    usedInModules: [
      { 
        module: 'admin-portal', 
        subModule: 'active-orders',
        description: '销售端 - 订单管理（销售合同）'
      },
      {
        module: 'admin-portal',
        subModule: 'order-management-center',
        description: '销售端 - 订单管理中心'
      },
      {
        module: 'documentation-center',
        subModule: 'document-library',
        description: '单证制作中心 - 文档库'
      }
    ]
  },
  
  // 🔥 采购合同模板（兼容旧 purchase-order 键）
  cg: {
    templateId: 'cg',
    templateName: '采购合同',
    templateNameEn: 'Purchase Contract',
    templateComponent: '@/components/documents/templates/PurchaseOrderDocument',
    dataInterface: 'PurchaseOrderData',
    canonicalDocumentCode: 'CG',
    usedInModules: [
      { 
        module: 'procurement-portal', 
        subModule: 'purchase-management',
        description: '采购员 - 采购合同管理'
      },
      {
        module: 'supplier-portal',
        subModule: 'order-reception',
        description: '供应商端 - 合同接收'
      }
    ]
  },
  
  // 🔥 报价请求单模板（QR）
  qr: {
    templateId: 'qr',
    templateName: '报价请求单',
    templateNameEn: 'Quote Requirement',
    templateComponent: '@/components/documents/templates/QuoteRequirementDocument',
    dataInterface: 'QuoteRequirementDocumentData',
    canonicalDocumentCode: 'QR',
    usedInModules: [
      {
        module: 'admin-portal',
        subModule: 'cost-inquiry-quotation-management',
        description: '销售端 - 业务员请求采购员报价'
      },
      {
        module: 'procurement-portal',
        subModule: 'quotation-request-pool',
        description: '采购端 - 报价请求池'
      }
    ]
  },

  // 🔥 采购询价单模板（XJ）
  xj: {
    templateId: 'xj',
    templateName: '采购询价单',
    templateNameEn: 'Procurement Inquiry',
    templateComponent: '@/components/documents/templates/XJDocument',
    dataInterface: 'XJData',
    canonicalDocumentCode: 'XJ',
    usedInModules: [
      {
        module: 'procurement-portal',
        subModule: 'quotation-management',
        description: '采购端 - 询价管理'
      },
      {
        module: 'supplier-portal',
        subModule: 'supplier-documents-workflow',
        description: '供应商端 - 收取询价单'
      }
    ]
  },
  
  // 🔥 商业发票模板
  ci: {
    templateId: 'ci',
    templateName: '商业发票',
    templateNameEn: 'Commercial Invoice',
    templateComponent: '@/components/documents/templates/CommercialInvoiceDocument',
    dataInterface: 'CommercialInvoiceData',
    canonicalDocumentCode: 'CI',
    usedInModules: [
      { 
        module: 'admin-portal', 
        subModule: 'shipment-management',
        description: '销售端 - 发货管理'
      },
      {
        module: 'documentation-center',
        subModule: 'document-library',
        description: '单证制作中心 - 文档库'
      }
    ]
  },
  
  // 🔥 装箱单模板
  pl: {
    templateId: 'pl',
    templateName: '装箱单',
    templateNameEn: 'Packing List',
    templateComponent: '@/components/documents/templates/PackingListDocument',
    dataInterface: 'PackingListData',
    canonicalDocumentCode: 'PL',
    usedInModules: [
      { 
        module: 'admin-portal', 
        subModule: 'shipment-management',
        description: '销售端 - 发货管理'
      },
      {
        module: 'documentation-center',
        subModule: 'document-library',
        description: '单证制作中心 - 文档库'
      }
    ]
  },
  
  // 🔥 发货通知模板
  'shipping-notice': {
    templateId: 'shipping-notice',
    templateName: '发货通知',
    templateNameEn: 'Shipping Notice',
    templateComponent: '@/components/documents/templates/ShippingNoticeDocument',
    dataInterface: 'ShippingNoticeData',
    usedInModules: [
      { 
        module: 'admin-portal', 
        subModule: 'shipment-management',
        description: '销售端 - 发货管理'
      },
      {
        module: 'customer-portal',
        subModule: 'order-tracking',
        description: '客户端 - 订单跟踪'
      }
    ]
  },
  
  // 🔥 形式发票模板（同报价单）
  pi: {
    templateId: 'pi',
    templateName: '形式发票',
    templateNameEn: 'Proforma Invoice',
    templateComponent: '@/components/documents/templates/ProformaInvoiceDocument',
    dataInterface: 'ProformaInvoiceData',
    canonicalDocumentCode: 'PI',
    usedInModules: [
      { 
        module: 'admin-portal', 
        subModule: 'quotation-management',
        description: '销售端 - 报价管理'
      },
      {
        module: 'customer-portal',
        subModule: 'quotation-review',
        description: '客户端 - 报价审核'
      }
    ]
  },
  
  // 🔥 对账单模板
  soa: {
    templateId: 'soa',
    templateName: '对账单',
    templateNameEn: 'Statement of Account',
    templateComponent: '@/components/documents/templates/StatementOfAccountDocument',
    dataInterface: 'StatementOfAccountData',
    canonicalDocumentCode: 'SOA',
    usedInModules: [
      { 
        module: 'finance-portal', 
        subModule: 'accounts-receivable',
        description: '财务端 - 应收账款'
      },
      {
        module: 'customer-portal',
        subModule: 'payment-center',
        description: '客户端 - 付款中心'
      }
    ]
  },
} as const;

/**
 * 根据模块获取对应的文档模板
 */
export function getTemplateByModule(module: string, subModule: string) {
  const template = Object.values(DOCUMENT_TEMPLATE_MAPPING).find(t => 
    t.usedInModules.some(m => m.module === module && m.subModule === subModule)
  );
  return template;
}

/**
 * 获取所有使用某个模板的模块
 */
export function getModulesByTemplate(templateId: string) {
  const template = DOCUMENT_TEMPLATE_MAPPING[templateId as keyof typeof DOCUMENT_TEMPLATE_MAPPING];
  return template?.usedInModules || [];
}

/**
 * 模板同步日志
 */
export interface TemplateSyncLog {
  timestamp: string;
  templateId: string;
  templateName: string;
  version: string;
  syncedModules: string[];
  status: 'success' | 'failed';
  message: string;
}

/**
 * 记录模板同步日志（实际项目中应该存储到数据库）
 */
export function logTemplateSync(log: TemplateSyncLog) {
  console.log('📋 文档模板同步日志:', log);
  // TODO: 实际项目中应该调用API保存到数据库
}

/**
 * 模板版本管理（用于追踪模板更新历史）
 */
export const TEMPLATE_VERSIONS = {
  ing: '1.0.0',
  qt: '1.0.0',
  sc: '1.0.0',
  cg: '1.0.0',
  qr: '1.0.0',
  xj: '1.0.0',
  ci: '1.0.0',
  pl: '1.0.0',
  'shipping-notice': '1.0.0',
  pi: '1.0.0',
  soa: '1.0.0'
} as const;
