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
  'customer-inquiry': {
    templateId: 'customer-inquiry',
    templateName: '客户询价单',
    templateNameEn: 'Customer Inquiry Form',
    templateComponent: '@/components/documents/templates/CustomerInquiryDocument',
    dataInterface: 'CustomerInquiryData',
    usedInModules: [
      { 
        module: 'customer-portal', 
        subModule: 'inquiry',
        description: '客户端 - 询价模块'
      }
    ]
  },
  
  // 🔥 业务员报价单模板
  'quotation': {
    templateId: 'quotation',
    templateName: '业务员报价单',
    templateNameEn: 'Quotation / Proforma Invoice',
    templateComponent: '@/components/documents/templates/QuotationDocument',
    dataInterface: 'QuotationData',
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
  'sales-contract': {
    templateId: 'sales-contract',
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
  
  // 🔥 采购订单模板
  'purchase-order': {
    templateId: 'purchase-order',
    templateName: '采购订单',
    templateNameEn: 'Purchase Order',
    templateComponent: '@/components/documents/templates/PurchaseOrderDocument',
    dataInterface: 'PurchaseOrderData',
    usedInModules: [
      { 
        module: 'procurement-portal', 
        subModule: 'purchase-management',
        description: '采购员 - 采购管理'
      },
      {
        module: 'supplier-portal',
        subModule: 'order-reception',
        description: '供应商端 - 订单接收'
      }
    ]
  },
  
  // 🔥 商业发票模板
  'commercial-invoice': {
    templateId: 'commercial-invoice',
    templateName: '商业发票',
    templateNameEn: 'Commercial Invoice',
    templateComponent: '@/components/documents/templates/CommercialInvoiceDocument',
    dataInterface: 'CommercialInvoiceData',
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
  'packing-list': {
    templateId: 'packing-list',
    templateName: '装箱单',
    templateNameEn: 'Packing List',
    templateComponent: '@/components/documents/templates/PackingListDocument',
    dataInterface: 'PackingListData',
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
  'proforma-invoice': {
    templateId: 'proforma-invoice',
    templateName: '形式发票',
    templateNameEn: 'Proforma Invoice',
    templateComponent: '@/components/documents/templates/ProformaInvoiceDocument',
    dataInterface: 'ProformaInvoiceData',
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
  'statement-of-account': {
    templateId: 'statement-of-account',
    templateName: '对账单',
    templateNameEn: 'Statement of Account',
    templateComponent: '@/components/documents/templates/StatementOfAccountDocument',
    dataInterface: 'StatementOfAccountData',
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
  }
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
  'customer-inquiry': '1.0.0',
  'quotation': '1.0.0',
  'sales-contract': '1.0.0',
  'purchase-order': '1.0.0',
  'commercial-invoice': '1.0.0',
  'packing-list': '1.0.0',
  'shipping-notice': '1.0.0',
  'proforma-invoice': '1.0.0',
  'statement-of-account': '1.0.0'
} as const;
