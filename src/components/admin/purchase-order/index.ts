/**
 * 🔥 采购订单管理 - 模块入口
 * Purchase Order Management Module Entry Point
 */

// ⚡ 临时方案：从原位置导入（文件太大暂不移动）
// 未来可以逐步重构拆分
export { default } from '../PurchaseOrderManagementEnhanced';

// 导出常量供外部使用
export { 
  TERMS_OPTIONS,
  STATUS_CONFIG,
  DEFAULT_FORM_VALUES
} from './purchaseOrderConstants';

export { PurchaseOrderEditDialog } from './PurchaseOrderEditDialog';
export { PurchaseOrderCreateDialogs } from './PurchaseOrderCreateDialogs';
export { EditXJDialog } from './EditXJDialog';
export { XJPreviewDialog } from './XJPreviewDialog';
export { SupplierQuotationDialog } from './SupplierQuotationDialog';
export { CreateXJAndHistoryDialogs } from './CreateXJAndHistoryDialogs';
export { PurchaseOrdersTab } from './PurchaseOrdersTab';
export { ProcurementRequestsTab } from './ProcurementRequestsTab';
export { SupplierAllocationDialog } from './SupplierAllocationDialog';
export { PurchaseOrderDetailDialog } from './PurchaseOrderDetailDialog';
export { PurchaseOrderPreviewDialog } from './PurchaseOrderPreviewDialog';
export { QuoteRequirementPreviewDialog } from './QuoteRequirementPreviewDialog';
export {
  CURRENCY_OPTIONS,
  EXTRA_TERM_OPTIONS,
  createInitialCreateOrderForm,
  createInitialEditPOForm,
  normalizeCurrencyCode,
  normalizeRegionalDocNo,
} from './purchaseOrderEditConfig';
