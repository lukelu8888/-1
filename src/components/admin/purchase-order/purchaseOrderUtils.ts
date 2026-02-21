/**
 * 🔥 采购订单工具函数
 * Purchase Order Utility Functions
 */

import { PurchaseOrderData } from '../../documents/templates/PurchaseOrderDocument';
import { PurchaseRequirementDocumentData } from '../../documents/templates/PurchaseRequirementDocument';
import { SupplierRFQData } from '../../documents/templates/SupplierRFQDocument';
import { PurchaseOrder as PurchaseOrderType } from '../../../contexts/PurchaseOrderContext';
import { PurchaseRequirement } from '../../../contexts/PurchaseRequirementContext';
import { Supplier } from '../../../data/suppliersData';
import { generateXJNumber } from '../../../utils/rfqNumberGenerator';

// 🔥 状态配置类型
type POStatus = 'pending' | 'confirmed' | 'producing' | 'completed' | 'delayed';
type PaymentStatus = 'unpaid' | 'partial' | 'paid';

/**
 * 获取采购订单状态配置
 */
export const getPOStatusConfig = (status: POStatus) => {
  const configs = {
    pending: { label: '待确认', color: 'bg-slate-50 text-slate-700 border-slate-200' },
    confirmed: { label: '已确认', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    producing: { label: '生产中', color: 'bg-purple-50 text-purple-700 border-purple-200' },
    completed: { label: '已完成', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    delayed: { label: '已延期', color: 'bg-rose-50 text-rose-700 border-rose-200' }
  };
  return configs[status];
};

/**
 * 获取付款状态配置
 */
export const getPaymentStatusConfig = (status: PaymentStatus) => {
  const configs = {
    unpaid: { label: '未付', color: 'bg-amber-50 text-amber-700 border-amber-200' },
    partial: { label: '部分', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    paid: { label: '已付', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
  };
  return configs[status];
};

/**
 * 获取业务类型标签
 */
export const getBusinessTypeLabel = (type: string) => {
  const labels = {
    trading: '🛒 直接采购',
    inspection: '🔍 验货服务',
    agency: '🤝 代理服务',
    project: '🌟 一站式项目'
  };
  return labels[type as keyof typeof labels] || type;
};

/**
 * 获取紧急程度配置
 */
export const getUrgencyConfig = (urgency: 'high' | 'medium' | 'low') => {
  const configs = {
    high: { label: '紧急', color: 'bg-rose-50 text-rose-700 border-rose-200' },
    medium: { label: '中等', color: 'bg-amber-50 text-amber-700 border-amber-200' },
    low: { label: '低', color: 'bg-slate-50 text-slate-700 border-slate-200' }
  };
  return configs[urgency];
};

/**
 * 🔥 将采购订单数据转换为文档模板数据
 */
export const convertToPOData = (po: PurchaseOrderType): PurchaseOrderData => {
  // 🔥 转换产品列表格式
  const products = po.items.map((item, index) => ({
    no: index + 1,
    modelNo: item.modelNo,
    description: item.productName,
    specification: item.specification || '标准规格',
    quantity: item.quantity,
    unit: item.unit,
    unitPrice: item.unitPrice,
    currency: item.currency,
    amount: item.subtotal,
    deliveryDate: po.expectedDate,
    remarks: item.remarks || (po.sourceRef ? `关联销售订单: ${po.sourceRef}` : '')
  }));

  return {
    // 采购单基本信息
    poNo: po.poNumber,
    poDate: po.orderDate,
    requiredDeliveryDate: po.expectedDate,
    
    // 买方（公司）信息
    buyer: {
      name: '福建高盛达富建材有限公司',
      nameEn: 'FUJIAN GAOSHENGDAFU BUILDING MATERIALS CO., LTD.',
      address: '福建省福州市仓山区金山街道浦上大道216号',
      addressEn: 'No.216 Pushang Avenue, Jinshan Street, Cangshan District, Fuzhou, Fujian, China',
      tel: '+86-591-8888-8888',
      email: 'purchase@gaoshengdafu.com',
      contactPerson: '采购部-刘明'
    },
    
    // 卖方（供应商）信息
    supplier: {
      companyName: po.supplierName,
      address: po.supplierAddress || '供应商地址（待完善）',
      contactPerson: po.supplierContact || '联系人',
      tel: po.supplierPhone || '+86-xxx-xxxx-xxxx',
      email: 'supplier@example.com',
      supplierCode: po.supplierCode,
      bankInfo: {
        bankName: '中国工商银行',
        accountName: po.supplierName,
        accountNumber: '6222 xxxx xxxx xxxx',
        currency: po.currency
      }
    },
    
    // 🔥 采购产品清单 - 使用转换后的products
    products: products,
    
    // 采购条款
    terms: {
      totalAmount: po.totalAmount,
      currency: po.currency,
      paymentTerms: po.paymentTerms,
      deliveryTerms: po.deliveryTerms,
      deliveryAddress: '福建省福州市仓山区金山街道浦上大道216号',
      qualityStandard: '符合国家标准及合同约定',
      inspectionMethod: '到货验收',
      packaging: '标准出口包装',
      warrantyPeriod: '12个月',
      warrantyTerms: '质量问题免费更换',
      applicableLaw: '中华人民共和国合同法',
      contractValidity: '订单确认后生效'
    }
  };
};

/**
 * 🔥 脱敏函数 - 隐藏供应商公司名称（仅业务员查看时）
 */
export const desensitizeFeedback = (feedback: string, userRole?: string): string => {
  // 🔥 修正：业务员角色是Sales_Rep，不是salesperson
  if (!feedback || userRole !== 'Sales_Rep') {
    console.log('⏭️ [跳过脱敏-采购订单管理] 原因:', !feedback ? '无反馈内容' : `角色不是业务员，当前角色：${userRole}`);
    return feedback; // 采购员和管理员可以看到完整信息
  }

  console.log('🔒 [脱敏处理-采购订单管理] 业务员查看，开始脱敏供应商信息');

  // 🔥 脱敏策略：将供应商公司名称替换为"供应商X"
  let desensitized = feedback;
  
  // 提取所有供应商公司名称
  const companyPattern = /([^，：。\n]+?(?:有限公司|股份有限公司|集团|公司|厂|工厂))/g;
  const companies = new Set<string>();
  let match;
  
  while ((match = companyPattern.exec(feedback)) !== null) {
    companies.add(match[1]);
  }

  // 为每个供应商分配编号并替换
  const companyArray = Array.from(companies);
  companyArray.forEach((company, index) => {
    const supplierLabel = `供应商${String.fromCharCode(65 + index)}`; // A, B, C...
    desensitized = desensitized.replace(new RegExp(company, 'g'), supplierLabel);
  });

  return desensitized;
};

/**
 * 🔥 将采购需求数据转换为文档模板数据
 */
export const convertToPRData = (req: PurchaseRequirement, userRole?: string): PurchaseRequirementDocumentData => {
  // 🔥 检查是否有采购员反馈
  const hasPurchaserFeedback = req.purchaserFeedback && req.purchaserFeedback.products;
  
  // 🔥 转换产品列表格式 - 优先使用采购员反馈的价格
  const products = req.items?.map((item, index) => {
    // 🔥 查找对应的采购反馈产品（通过productId匹配）
    const feedbackProduct = hasPurchaserFeedback 
      ? req.purchaserFeedback.products.find((fp: any) => fp.productId === item.id)
      : null;
    
    return {
      no: index + 1,
      modelNo: item.modelNo || '-',
      imageUrl: item.imageUrl,
      productName: item.productName || feedbackProduct?.productName,
      specification: feedbackProduct?.specification || item.specification || '-',
      quantity: feedbackProduct?.quantity || item.quantity,
      unit: feedbackProduct?.unit || item.unit,
      // 🔥 优先使用采购反馈的成本价，否则使用目标价
      unitPrice: feedbackProduct?.costPrice || item.targetPrice,
      currency: feedbackProduct?.currency || item.targetCurrency || 'USD',
      moq: feedbackProduct?.moq,
      leadTime: feedbackProduct?.leadTime,
      totalPrice: feedbackProduct?.costPrice 
        ? feedbackProduct.costPrice * (feedbackProduct.quantity || item.quantity)
        : (item.targetPrice ? item.targetPrice * item.quantity : undefined),
      remarks: feedbackProduct?.remarks || item.remarks
    };
  }) || [];

  return {
    // 采购需求单基本信息
    requirementNo: req.requirementNo,
    requirementDate: req.createdDate.split('T')[0],
    sourceInquiryNo: req.sourceInquiryNumber || req.sourceRef || '-',
    requiredResponseDate: (req as any).expectedQuoteDate || req.requiredDate,
    requiredDeliveryDate: (req as any).deliveryDate || req.requiredDate,
    
    // 客户信息
    customer: {
      companyName: req.customer?.companyName || 'N/A',
      contactPerson: req.customer?.contactPerson || 'N/A',
      email: req.customer?.email || 'N/A',
      phone: req.customer?.phone || 'N/A',
      address: req.customer?.address || 'N/A',
      region: req.region || 'North America'
    },
    
    // 产品清单
    products,
    
    // 客户需求要素
    customerRequirements: {
      deliveryTerms: (req as any).tradeTerms || 'FOB',
      paymentTerms: (req as any).paymentTerms || '30% T/T预付，70%见提单副本付款',
      qualityStandard: (req as any).qualityRequirements || '符合国际标准',
      packaging: (req as any).packagingRequirements || '标准出口包装',
      specialRequirements: req.specialRequirements
    },
    
    // 业务部说明
    salesDeptNotes: (req as any).remarks || '',
    
    // 🔥 采购部反馈 - 从采购反馈中读取采购员建议，并进行脱敏处理
    purchaseDeptFeedback: desensitizeFeedback(req.purchaserFeedback?.purchaserRemarks || '', userRole),
    
    urgency: req.urgency,
    createdBy: req.createdBy
  };
};

/**
 * 🔥 生成询价单文档数据
 */
export const generateRFQDocumentData = (
  supplier: Supplier,
  requirement: PurchaseRequirement,
  deadline: Date,
  remarks: string,
  selectedProductIds: string[]
): SupplierRFQData => {
  const rfqNo = generateXJNumber();
  
  // 只包含选中的产品
  const selectedProducts = requirement.items?.filter(item => selectedProductIds.includes(item.id)) || [];
  
  // 🔥 组合询价说明
  const salesDeptNotes = (requirement as any).salesDeptNotes || 
                         (requirement as any).remarks || 
                         (requirement as any).notes || 
                         (requirement as any).businessDeptNotes || '';
  const specialRequirements = requirement.specialRequirements || '';
  const purchaseRemarks = remarks || '';
  
  // 构建完整的询价说明
  let inquiryDescription = '';
  if (salesDeptNotes) {
    inquiryDescription += `【业务部说明】\n${salesDeptNotes}`;
  }
  if (specialRequirements) {
    inquiryDescription += inquiryDescription ? `\n\n【特殊要求】\n${specialRequirements}` : `【特殊要求】\n${specialRequirements}`;
  }
  if (purchaseRemarks) {
    inquiryDescription += inquiryDescription ? `\n\n【采购部补充】\n${purchaseRemarks}` : `【采购部补充】\n${purchaseRemarks}`;
  }
  
  return {
    rfqNo: rfqNo,
    rfqDate: new Date().toISOString().split('T')[0],
    quoteDeadline: deadline.toISOString().split('T')[0],
    requirementNo: requirement.requirementNo,
    
    buyer: {
      companyName: '福建高盛达富建材有限公司',
      companyNameEn: 'FUJIAN GAOSHENGDAFU BUILDING MATERIALS CO., LTD.',
      address: '福建省福州市仓山区金山街道浦上大道216号',
      addressEn: 'No.216 Pushang Avenue, Jinshan Street, Cangshan District, Fuzhou, Fujian, China',
      contactPerson: '采购部',
      tel: '+86-591-8888-8888',
      email: 'purchase@gaoshengdafu.com'
    },
    
    supplier: {
      companyName: supplier.name,
      supplierCode: supplier.code,
      contactPerson: supplier.contactPerson || '联系人',
      tel: supplier.phone || '+86-xxx-xxxx-xxxx',
      email: supplier.email || 'supplier@example.com',
      address: supplier.address || '供应商地址'
    },
    
    products: selectedProducts.map((item, index) => ({
      no: index + 1,
      imageUrl: item.imageUrl,
      productName: item.productName,
      modelNo: item.modelNo || '-',
      specification: item.specification || '-',
      quantity: item.quantity,
      unit: item.unit,
      targetPrice: item.targetPrice,
      targetCurrency: item.targetCurrency || 'USD',
      remarks: item.remarks
    })),
    
    inquiryDescription: inquiryDescription,
    
    terms: {
      currency: (requirement as any).currency || 'USD',
      paymentTerms: (requirement as any).paymentTerms || 'T/T 30% 预付，70% 发货前付清',
      deliveryTerms: (requirement as any).tradeTerms || 'EXW 工厂交货',
      deliveryAddress: (requirement as any).deliveryAddress || '福建省福州市仓山区仓山工业区',
      deliveryRequirement: `收到订单后${(requirement as any).leadTime || 30}天内交货`,
      qualityStandard: (requirement as any).qualityRequirements || '产品需符合GB/T国标，如有国际标准（ISO、CE等）请提供相关认证',
      inspectionMethod: '到货后5%抽检，如有不合格品按比例折算退款或补货',
      packaging: (requirement as any).packagingRequirements || '标准出口包装，纸箱+托盘，适合长途运输',
      shippingMarks: '中性唛头，或根据客户要求定制唛头（具体要求来单确认）',
      inspectionRequirement: '请在报价单中注明报价有效期和交货周期',
      technicalDocuments: '产品说明书、检测报告、认证证书（CE/RoHS等）',
      ipRights: '产品设计、商标、专利归属我方，供应商不得侵权',
      confidentiality: '客户信息、价格信息严格保密，不得泄露给第三方',
      sampleRequirement: '如需样品，请提供免费样品（邮费到付）',
      moq: '无最小起订量限制',
      remarks: '其他特殊要求请在报价单中说明'
    }
  };
};
