/**
 * 🔥 采购订单管理 - 类型定义
 * 重新导出Context中的类型供内部使用
 */

// 从Context导入并重新导出
export type { 
  PurchaseOrder as PurchaseOrderType, 
  PurchaseOrderItem 
} from '../../../contexts/PurchaseOrderContext';

export type { 
  PurchaseRequirement, 
  PurchaserFeedback 
} from '../../../contexts/PurchaseRequirementContext';

export type { 
  XJ, 
  XJProduct 
} from '../../../contexts/XJContext';

export type { 
  Supplier 
} from '../../../data/suppliersData';

// 组件内部使用的类型
export interface PurchaseOrderFormData {
  requirementNumber: string;
  supplierCode: string;
  supplierName: string;
  totalAmount: number;
  currency: string;
  paymentTerms: string;
  deliveryTerms: string;
  deliveryAddress: string;
  deliveryDate?: Date;
  remarks?: string;
  items: PurchaseOrderItem[];
  
  // 16条询价条款
  deliveryRequirement: string;
  qualityStandard: string;
  inspectionMethod: string;
  packaging: string;
  shippingMarks: string;
  inspectionRequirement: string;
  technicalDocuments: string;
  ipRights: string;
  confidentiality: string;
  sampleRequirement: string;
  moq: string;
}

// 弹窗状态类型
export interface DialogState {
  createPO: boolean;
  editPO: boolean;
  viewDetail: boolean;
  sendXJ: boolean;
  feedback: boolean;
  viewQuotation: boolean;
  intelligentQuote: boolean;
}

// Tab类型
export type TabType = 'requirements' | 'xjs' | 'orders';
