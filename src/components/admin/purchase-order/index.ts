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