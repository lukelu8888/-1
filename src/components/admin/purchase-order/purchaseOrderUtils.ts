/**
 * 🔥 采购订单工具函数
 * Purchase Order Utility Functions
 */

import { PurchaseOrderData } from '../../documents/templates/PurchaseOrderDocument';
import { QuoteRequirementDocumentData } from '../../documents/templates/QuoteRequirementDocument';
import { XJData } from '../../documents/templates/XJDocument';
import { PurchaseOrder as PurchaseOrderType } from '../../../contexts/PurchaseOrderContext';
import { QuoteRequirement } from '../../../contexts/QuoteRequirementContext';
import { Supplier } from '../../../data/suppliersData';
import { XJ } from '../../../contexts/XJContext';
import {
  buildBilingualTradingRequirementsText,
  buildProcurementConditionGroups,
  extractProcurementRequestContext,
  joinNonEmptyText,
} from '../../../utils/procurementRequestContext';
import { generateXJNumber } from '../../../utils/xjNumberGenerator';
import { getFormalBusinessModelNo } from '../../../utils/productModelDisplay';

// 🔥 状态配置类型
type POStatus = 'pending' | 'confirmed' | 'producing' | 'completed' | 'delayed';
type PaymentStatus = 'unpaid' | 'partial' | 'paid';

export type ProjectExecutionBaseline = {
  projectId?: string | null;
  projectCode?: string | null;
  projectName?: string | null;
  projectRevisionId?: string | null;
  projectRevisionCode?: string | null;
  projectRevisionStatus?: string | null;
  finalRevisionId?: string | null;
  finalQuotationId?: string | null;
  finalQuotationNumber?: string | null;
};

export const extractProjectExecutionBaseline = (doc: any): ProjectExecutionBaseline | null => {
  const baseline = doc?.documentRenderMeta?.projectExecutionBaseline
    || doc?.document_render_meta?.projectExecutionBaseline
    || null;
  if (baseline && (baseline.projectRevisionId || baseline.projectCode || baseline.projectName)) {
    return baseline;
  }
  if (doc?.projectRevisionId || doc?.projectCode || doc?.projectName) {
    return {
      projectId: doc?.projectId || null,
      projectCode: doc?.projectCode || null,
      projectName: doc?.projectName || null,
      projectRevisionId: doc?.projectRevisionId || null,
      projectRevisionCode: doc?.projectRevisionCode || null,
      projectRevisionStatus: doc?.projectRevisionStatus || null,
      finalRevisionId: doc?.finalRevisionId || null,
      finalQuotationId: doc?.finalQuotationId || null,
      finalQuotationNumber: doc?.finalQuotationNumber || null,
    };
  }
  return null;
};

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
  const poAny = po as any;
  const pick = (...values: unknown[]) => {
    for (const v of values) {
      const s = String(v ?? '').trim();
      if (s) return s;
    }
    return '';
  };
  // 🔥 转换产品列表格式
  const products = po.items.map((item, index) => ({
    no: index + 1,
    modelNo: getFormalBusinessModelNo(item),
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
      paymentTerms: pick(poAny.paymentTerms, '待采购确认'),
      deliveryTerms: pick(poAny.deliveryTerms, '待采购确认'),
      deliveryAddress: pick(poAny.deliveryAddress, '福建省福州市仓山区金山街道浦上大道216号'),
      qualityStandard: pick(poAny.qualityStandard, poAny.qualityTerms, '符合国家标准及合同约定'),
      inspectionMethod: pick(poAny.inspectionMethod, poAny.inspectionTerms, '到货验收'),
      packaging: pick(poAny.packaging, poAny.packagingTerms, '标准出口包装'),
      shippingMarks: pick(poAny.shippingMarks),
      deliveryPenalty: pick(poAny.deliveryPenalty),
      qualityPenalty: pick(poAny.qualityPenalty, poAny.penaltyTerms),
      warrantyPeriod: pick(poAny.warrantyPeriod, '12个月'),
      warrantyTerms: pick(poAny.warrantyTerms, '质量问题免费更换'),
      returnPolicy: pick(poAny.returnPolicy),
      confidentiality: pick(poAny.confidentiality),
      ipRights: pick(poAny.ipRights),
      forceMajeure: pick(poAny.forceMajeure),
      disputeResolution: pick(poAny.disputeResolution, poAny.disputeResolutionTerms),
      applicableLaw: pick(poAny.applicableLaw, '中华人民共和国合同法'),
      contractValidity: pick(poAny.contractValidity, '订单确认后生效'),
      modification: pick(poAny.modification),
      termination: pick(poAny.termination)
    }
  };
};

export const buildPurchaseOrderDocumentSnapshot = (po: PurchaseOrderType): PurchaseOrderData => {
  const existing = (po as any).documentDataSnapshot || (po as any).document_data_snapshot || null;
  if (existing && typeof existing === 'object' && Array.isArray((existing as any).products)) {
    return existing as PurchaseOrderData;
  }
  return convertToPOData(po);
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
export const convertToPRData = (req: QuoteRequirement, userRole?: string): QuoteRequirementDocumentData => {
  const reqCreatedDate = String(
    (req as any).createdDate ||
    (req as any).createdAt ||
    (req as any).created_at ||
    new Date().toISOString()
  );

  // 🔥 检查是否有采购员反馈
  const hasPurchaserFeedback = req.purchaserFeedback && req.purchaserFeedback.products;
  const productRequirementLines = req.customerRequirements?.productRequirements || [];
  const parseProductSummary = (raw: unknown) => {
    const text = String(raw || '').trim();
    if (!text) {
      return { productName: '', modelNo: '', specification: '' };
    }

    const segments = text
      .split(/[;；]\s*/)
      .map((segment) => segment.trim())
      .filter(Boolean);

    if (segments.length === 0) {
      return { productName: text, modelNo: '', specification: '' };
    }

    let productName = '';
    let modelNo = '';
    const specificationParts: string[] = [];

    segments.forEach((segment, index) => {
      if (/^型号[:：]?/i.test(segment)) {
        modelNo = segment.replace(/^型号[:：]?\s*/i, '').trim();
        return;
      }

      if (/^规格[:：]?/i.test(segment)) {
        specificationParts.push(segment.replace(/^规格[:：]?\s*/i, '').trim());
        return;
      }

      if (index === 0 && !productName) {
        productName = segment;
        return;
      }

      specificationParts.push(segment);
    });

    return {
      productName: productName || text,
      modelNo,
      specification: specificationParts.filter(Boolean).join('；'),
    };
  };
  const parseRequirementLine = (raw: unknown) => {
    const text = String(raw || '').trim();
    if (!text) return {};
    return {
      productName: text.match(/^(.*?)(?:[;；]\s*型号[:：]|$)/)?.[1]?.trim() || '',
      modelNo: text.match(/型号[:：]?\s*([^;；]+?)(?:[;；]|$)/)?.[1]?.trim() || '',
      specification: text.match(/规格[:：]?\s*([^;；]+?)(?:[;；]|$)/)?.[1]?.trim() || '',
    };
  };
  const pickText = (...values: unknown[]) => {
    for (const value of values) {
      const text = String(value || '').trim();
      if (text && text !== '-') return text;
    }
    return '';
  };
  const dedupeJoinedText = (...values: unknown[]) => {
    const result: string[] = [];
    const seen = new Set<string>();

    values.forEach((value) => {
      const text = String(value || '').trim();
      if (!text || text === '-') return;
      const normalized = text.replace(/\s+/g, ' ').trim().toLowerCase();
      if (seen.has(normalized)) return;
      seen.add(normalized);
      result.push(text);
    });

    return result.join('\n');
  };
  
  // 🔥 转换产品列表格式 - 优先使用采购员反馈的价格
  const products = req.items?.map((item, index) => {
    // 🔥 查找对应的采购反馈产品（通过productId匹配）
    const feedbackProduct = hasPurchaserFeedback 
      ? req.purchaserFeedback.products.find((fp: any) => fp.productId === item.id)
      : null;
    const parsedLine = parseRequirementLine(productRequirementLines[index]);
    const parsedItemProductName = parseProductSummary(item.productName);
    const parsedItemNameAlias = parseProductSummary((item as any).name);
    const parsedItemDescription = parseProductSummary((item as any).description);
    const parsedFeedbackName = parseProductSummary(feedbackProduct?.productName);
    const modelNo = pickText(
      item.modelNo,
      (item as any).model,
      (item as any).sku,
      parsedLine.modelNo,
      parsedItemProductName.modelNo,
      parsedItemNameAlias.modelNo,
      parsedItemDescription.modelNo,
      parsedFeedbackName.modelNo,
    ) || '-';
    const productName = pickText(
      parsedItemProductName.productName,
      parsedItemNameAlias.productName,
      parsedItemDescription.productName,
      parsedFeedbackName.productName,
      parsedLine.productName,
      item.productName,
      (item as any).name,
      (item as any).description,
      feedbackProduct?.productName,
    ) || '-';
    const specification = dedupeJoinedText(
      feedbackProduct?.specification,
      item.specification,
      (item as any).specification,
      (item as any).spec,
      parsedItemProductName.specification,
      parsedItemNameAlias.specification,
      parsedItemDescription.specification,
      parsedFeedbackName.specification,
      parsedLine.specification,
    ) || '-';
    
    return {
      no: index + 1,
      modelNo,
      imageUrl: item.imageUrl || (item as any).imageUrl || (item as any).image || (item as any).productImage,
      productName,
      specification,
      quantity: feedbackProduct?.quantity || item.quantity,
      unit: feedbackProduct?.unit || item.unit || (item as any).uom || 'pcs',
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

  const tradingRequirementText = buildBilingualTradingRequirementsText({
    tradeTerms: (req as any).tradeTerms,
    deliveryTime: (req as any).deliveryDate || (req as any).requiredDeliveryDate || (req as any).requiredDate,
    portOfDestination:
      (req as any).portOfDestination ||
      (req as any).customer?.portOfDestination ||
      (req as any).sourceDocumentData?.requirements?.portOfDestination,
    paymentTerms: (req as any).paymentTerms,
    packingRequirements: (req as any).packagingRequirements,
    certifications: (req as any).qualityRequirements,
    otherRequirements: req.specialRequirements,
  });
  const fallbackSalesDeptNotes = joinNonEmptyText(
    tradingRequirementText,
    (req as any).remarks,
  ).replace(/；/g, '\n');

  return {
    // 采购需求单基本信息
    requirementNo: req.requirementNo,
    requirementDate: reqCreatedDate.split('T')[0],
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
    conditionGroups: buildProcurementConditionGroups(req, 'qr'),
    
    // 业务部说明
    salesDeptNotes:
      (req as any).salesDeptNotes ||
      (req as any).documentDataSnapshot?.salesDeptNotes ||
      fallbackSalesDeptNotes,
    
    // 🔥 采购部反馈 - 从采购反馈中读取采购员建议，并进行脱敏处理
    purchaseDeptFeedback: desensitizeFeedback(req.purchaserFeedback?.purchaserRemarks || '', userRole),
    
    urgency: req.urgency,
    createdBy: req.createdBy
  };
};

export const buildQuoteRequirementDocumentSnapshot = (
  req: QuoteRequirement,
  userRole?: string,
): QuoteRequirementDocumentData => {
  const existing = (req as any).documentDataSnapshot || (req as any).document_data_snapshot || null;
  if (existing && typeof existing === 'object' && Array.isArray((existing as any).products)) {
    return existing as QuoteRequirementDocumentData;
  }
  return convertToPRData(req, userRole);
};

/**
 * 🔥 生成询价单文档数据
 */
export const generateXJDocumentData = (
  supplier: Supplier,
  requirement: QuoteRequirement,
  deadline: Date,
  remarks: string,
  selectedProductIds: string[],
  xjNoOverride?: string
): XJData => {
  const xjNo = xjNoOverride || `XJ-${new Date().toISOString().slice(2,10).replace(/-/g,'')}-0000`; // caller must provide xjNoOverride
  const requestContext = extractProcurementRequestContext(requirement);
  const commercialTerms = requestContext.commercialTerms || {};
  const customerRequirements = requestContext.customerRequirements || {};
  const visibility = requestContext.downstreamVisibility;
  const exposeInternalTargetToSupplier = !visibility?.maskInternalTargetCostToSupplier;
  
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
  const customerRequirementSummary = joinNonEmptyText(
    customerRequirements.packagingRequirements ? `客户包装要求: ${customerRequirements.packagingRequirements}` : '',
    customerRequirements.otherRequirements ? `客户其他要求: ${customerRequirements.otherRequirements}` : '',
    customerRequirements.customerRemarks ? `客户补充说明: ${customerRequirements.customerRemarks}` : '',
    Array.isArray(customerRequirements.productRequirements) && customerRequirements.productRequirements.length > 0
      ? `客户产品要求: ${customerRequirements.productRequirements.join(' / ')}`
      : '',
  );
  if (customerRequirementSummary) {
    inquiryDescription += inquiryDescription ? `\n\n【客户需求摘要（已脱敏）】\n${customerRequirementSummary}` : `【客户需求摘要（已脱敏）】\n${customerRequirementSummary}`;
  }
  if (commercialTerms.targetCostRange && exposeInternalTargetToSupplier) {
    inquiryDescription += inquiryDescription ? `\n\n【业务目标成本参考】\n${commercialTerms.targetCostRange}` : `【业务目标成本参考】\n${commercialTerms.targetCostRange}`;
  }
  const xjConditionSource = {
    ...requirement,
    commercialTerms: {
      ...commercialTerms,
      remarks: joinNonEmptyText(purchaseRemarks, commercialTerms.remarks),
    },
    remarks: joinNonEmptyText(purchaseRemarks, (requirement as any).remarks),
  };
  
  return {
    xjNo: xjNo,
    xjDate: new Date().toISOString().split('T')[0],
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
      modelNo: getFormalBusinessModelNo(item) || '-',
      specification: item.specification || '-',
      quantity: item.quantity,
      unit: item.unit,
      targetPrice: visibility?.maskCustomerPublicPrice ? undefined : item.targetPrice,
      targetCurrency: item.targetCurrency || 'USD',
      remarks: item.remarks
    })),
    
    inquiryDescription: inquiryDescription,
    conditionGroups: buildProcurementConditionGroups(xjConditionSource, 'xj'),
    
    terms: {
      currency:
        commercialTerms.targetCostRange && exposeInternalTargetToSupplier
          ? '请按邀约条件报价'
          : ((requirement as any).currency || 'USD'),
      paymentTerms: commercialTerms.paymentTerms || (requirement as any).paymentTerms || 'T/T 30% 预付，70% 发货前付清',
      deliveryTerms: commercialTerms.tradeTerms || (requirement as any).tradeTerms || 'EXW 工厂交货',
      deliveryAddress: (requirement as any).deliveryAddress || '福建省福州市仓山区仓山工业区',
      deliveryRequirement: commercialTerms.deliveryDate || `收到订单后${(requirement as any).leadTime || 30}天内交货`,
      qualityStandard: joinNonEmptyText(
        commercialTerms.qualityRequirements,
        (requirement as any).qualityRequirements,
      ) || '产品需符合GB/T国标，如有国际标准（ISO、CE等）请提供相关认证',
      inspectionMethod: '到货后5%抽检，如有不合格品按比例折算退款或补货',
      packaging: joinNonEmptyText(
        commercialTerms.packagingRequirements,
        customerRequirements.packagingRequirements,
        (requirement as any).packagingRequirements,
      ) || '标准出口包装，纸箱+托盘，适合长途运输',
      shippingMarks: '中性唛头，或根据客户要求定制唛头（具体要求来单确认）',
      inspectionRequirement: joinNonEmptyText(
        commercialTerms.expectedQuoteDate ? `请于 ${commercialTerms.expectedQuoteDate} 前回复报价` : '',
        '请在报价单中注明报价有效期和交货周期',
      ),
      technicalDocuments: '产品说明书、检测报告、认证证书（CE/RoHS等）',
      ipRights: '产品设计、商标、专利归属我方，供应商不得侵权',
      confidentiality: '客户信息、客户公开价格、联系人信息严格保密，不得泄露给第三方',
      sampleRequirement: '如需样品，请提供免费样品（邮费到付）',
      moq: '无最小起订量限制',
      remarks: joinNonEmptyText(
        commercialTerms.targetCostRange && exposeInternalTargetToSupplier
          ? `业务目标成本参考: ${commercialTerms.targetCostRange}`
          : '',
        customerRequirements.otherRequirements ? `客户其他要求: ${customerRequirements.otherRequirements}` : '',
        '客户公开销售价已脱敏，不作为对供应商的报价依据',
        '其他特殊要求请在报价单中说明',
      )
    }
  };
};

export const buildXJDocumentSnapshot = (xj: XJ): XJData => {
  const raw = ((xj as any).documentDataSnapshot || (xj as any).document_data_snapshot || xj.documentData || {}) as any;
  const rawBuyer = raw.buyer && typeof raw.buyer === 'object' ? raw.buyer : {};
  const rawSupplier = raw.supplier && typeof raw.supplier === 'object' ? raw.supplier : {};
  const rawTerms = raw.terms && typeof raw.terms === 'object' ? raw.terms : {};
  const sourceProducts = Array.isArray(raw.products)
    ? raw.products
    : Array.isArray(xj.products)
      ? xj.products
      : [];
  const fallbackDate = String(xj.quotationDeadline || xj.expectedDate || xj.createdDate || '').split('T')[0];

  return {
    xjNo: String(raw.xjNo || xj.supplierXjNo || xj.xjNumber || ''),
    xjDate: String(raw.xjDate || xj.createdDate || '').split('T')[0],
    requiredResponseDate: String(raw.requiredResponseDate || xj.quotationDeadline || fallbackDate),
    requiredDeliveryDate: String(raw.requiredDeliveryDate || xj.expectedDate || xj.quotationDeadline || fallbackDate),
    inquiryDescription: String(raw.inquiryDescription || xj.remarks || ''),
    buyer: {
      name: String(rawBuyer.name || rawBuyer.companyName || '福建高盛达富建材有限公司'),
      nameEn: String(rawBuyer.nameEn || rawBuyer.companyNameEn || 'FUJIAN GAOSHENGDAFU BUILDING MATERIALS CO., LTD.'),
      address: String(rawBuyer.address || '福建省福州市仓山区金山街道浦上大道216号'),
      addressEn: String(rawBuyer.addressEn || 'No.216 Pushang Avenue, Jinshan Street, Cangshan District, Fuzhou, Fujian, China'),
      tel: String(rawBuyer.tel || '+86-591-8888-8888'),
      email: String(rawBuyer.email || 'purchase@gaoshengdafu.com'),
      contactPerson: String(rawBuyer.contactPerson || '采购部'),
    },
    supplier: {
      companyName: String(rawSupplier.companyName || xj.supplierName || ''),
      address: String(rawSupplier.address || ''),
      contactPerson: String(rawSupplier.contactPerson || xj.supplierContact || ''),
      tel: String(rawSupplier.tel || ''),
      email: String(rawSupplier.email || xj.supplierEmail || ''),
      supplierCode: String(rawSupplier.supplierCode || xj.supplierCode || ''),
    },
    products: sourceProducts.map((item: any, index: number) => ({
      no: index + 1,
      modelNo: getFormalBusinessModelNo(item) || undefined,
      imageUrl: item?.imageUrl ? String(item.imageUrl) : undefined,
      itemCode: item?.itemCode ? String(item.itemCode) : undefined,
      description: String(item?.description || item?.productName || ''),
      specification: String(item?.specification || '-'),
      quantity: Number(item?.quantity || 0),
      unit: String(item?.unit || 'PCS'),
      targetPrice: item?.targetPrice != null ? String(item.targetPrice) : undefined,
      remarks: item?.remarks ? String(item.remarks) : undefined,
    })),
    conditionGroups: Array.isArray(raw.conditionGroups) ? raw.conditionGroups : [],
    terms: {
      paymentTerms: rawTerms.paymentTerms ? String(rawTerms.paymentTerms) : undefined,
      deliveryTerms: rawTerms.deliveryTerms ? String(rawTerms.deliveryTerms) : undefined,
      deliveryAddress: rawTerms.deliveryAddress ? String(rawTerms.deliveryAddress) : undefined,
      currency: rawTerms.currency ? String(rawTerms.currency) : undefined,
      qualityStandard: rawTerms.qualityStandard ? String(rawTerms.qualityStandard) : undefined,
      inspectionMethod: rawTerms.inspectionMethod ? String(rawTerms.inspectionMethod) : undefined,
      deliveryRequirement: rawTerms.deliveryRequirement ? String(rawTerms.deliveryRequirement) : undefined,
      packaging: rawTerms.packaging ? String(rawTerms.packaging) : undefined,
      shippingMarks: rawTerms.shippingMarks ? String(rawTerms.shippingMarks) : undefined,
      inspectionRequirement: rawTerms.inspectionRequirement ? String(rawTerms.inspectionRequirement) : undefined,
      technicalDocuments: rawTerms.technicalDocuments ? String(rawTerms.technicalDocuments) : undefined,
      ipRights: rawTerms.ipRights ? String(rawTerms.ipRights) : undefined,
      confidentiality: rawTerms.confidentiality ? String(rawTerms.confidentiality) : undefined,
      sampleRequirement: rawTerms.sampleRequirement ? String(rawTerms.sampleRequirement) : undefined,
      moq: rawTerms.moq ? String(rawTerms.moq) : undefined,
      remarks: rawTerms.remarks ? String(rawTerms.remarks) : undefined,
    },
  };
};
