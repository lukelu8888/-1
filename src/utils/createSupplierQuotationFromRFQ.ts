/**
 * 从RFQ创建供应商报价单
 */
import { generateBJNumber } from './rfqNumberGenerator'; // 🔥 导入BJ编号生成器

export function createSupplierQuotationFromRFQ(
  rfq: any,
  supplierUser: any, // 🔥 改为接收完整的用户对象
  options: {
    unitPrice?: number;
    leadTime?: number;
    moq?: number;
    paymentTerms?: string;
    deliveryTerms?: string;
    supplierRemarks?: string; // 🔥 供应商备注
    status?: 'draft' | 'submitted';
  } = {}
): SupplierQuotation {
  // 🔥 生成BJ报价单号（从0001开始递增）
  const quotationNo = generateBJNumber();

  // 计算有效期（默认30天）
  const quotationDate = new Date().toISOString().split('T')[0];
  const validUntilDate = new Date();
  validUntilDate.setDate(validUntilDate.getDate() + 30);
  const validUntil = validUntilDate.toISOString().split('T')[0];

  // 🔥 提取供应商信息（优先使用完整字段，回退到简化字段）
  const supplierEmail = supplierUser?.email || 'supplier@example.com';
  const supplierName = supplierUser?.name || supplierUser?.contact || supplierUser?.username || '供应商';
  const supplierCompany = supplierUser?.company || supplierUser?.name || '供应商公司';
  const supplierCompanyEn = supplierUser?.nameEn || supplierUser?.companyEn || 'Supplier Company Ltd.';
  const supplierAddress = supplierUser?.address || '供应商地址';
  const supplierPhone = supplierUser?.phone || supplierUser?.tel || '';
  const supplierCode = supplierUser?.code || supplierUser?.companyId || supplierEmail;

  // 🔥 创建产品项 - 支持多产品
  let items: SupplierQuotationItem[] = [];
  
  // 优先使用 products 数组（多产品）
  if (rfq.products && Array.isArray(rfq.products) && rfq.products.length > 0) {
    console.log(`🔍 从 RFQ.products 提取 ${rfq.products.length} 个产品`);
    items = rfq.products.map((product: any, index: number) => ({
      id: `item-${Date.now()}-${index}`,
      productName: product.productName || '产品名称',
      modelNo: product.modelNo || '',
      specification: product.specification || '',
      quantity: product.quantity || 0,
      unit: product.unit || 'pcs',
      unitPrice: options.unitPrice || 0,
      currency: 'CNY', // 🔥 默认人民币
      amount: (options.unitPrice || 0) * (product.quantity || 0),
      leadTime: options.leadTime || 30,
      moq: options.moq || 1000,
      remarks: ''
    }));
  } else {
    // 兼容旧版单产品字段
    console.log('🔍 使用旧版单产品字段创建产品项');
    items = [{
      id: `item-${Date.now()}`,
      productName: rfq.productName || '产品名称',
      modelNo: rfq.modelNo || '',
      specification: rfq.specification || '',
      quantity: rfq.quantity || 0,
      unit: rfq.unit || 'pcs',
      unitPrice: options.unitPrice || 0,
      currency: 'CNY', // 🔥 默认人民币
      amount: (options.unitPrice || 0) * (rfq.quantity || 0),
      leadTime: options.leadTime || 30,
      moq: options.moq || 1000,
      remarks: ''
    }];
  }

  const totalAmount = items.reduce((sum, item) => sum + (item.amount || 0), 0);

  const quotation: SupplierQuotation = {
    id: `quotation-${Date.now()}`,
    quotationNo,
    sourceXJ: rfq.supplierRfqNo || rfq.rfqNumber, // 关联XJ号
    sourceQR: rfq.requirementNo, // 关联QR号
    sourceRFQId: rfq.id,
    customerName: 'COSUN采购', // 买方是COSUN
    customerCompany: '福建高盛达富建材有限公司',
    customerContact: rfq.buyerContact,
    customerEmail: rfq.buyerEmail,
    supplierCode: supplierCode,
    supplierName: supplierName,
    supplierCompany: supplierCompany,
    supplierEmail: supplierEmail,
    supplierPhone: supplierPhone,
    quotationDate,
    validUntil,
    currency: 'CNY', // 🔥 默认人民币
    totalAmount,
    paymentTerms: options.paymentTerms || 'T/T 30天',
    deliveryTerms: options.deliveryTerms || 'FOB 厦门',
    packingTerms: '标准出口包装',
    generalRemarks: '',
    items,
    status: options.status || 'draft',
    createdBy: supplierEmail,
    createdDate: quotationDate,
    version: 1
  };

  // 🔥 提取原始询价说明（从RFQ的documentData中获取）
  const originalInquiryDescription = rfq.documentData?.inquiryDescription || '';
  
  // 🔥 从完整的询价说明中提取【特殊要求】/【客户要求】部分
  let customerRequirements = '';
  if (originalInquiryDescription) {
    // 尝试匹配【特殊要求】或【客户要求】部分
    const specialReqMatch = originalInquiryDescription.match(/【特殊要求】\s*\n([\s\S]*?)(?=\n\n【|$)/);
    const customerReqMatch = originalInquiryDescription.match(/【客户要求】\s*\n([\s\S]*?)(?=\n\n【|$)/);
    
    if (specialReqMatch) {
      customerRequirements = specialReqMatch[1].trim();
    } else if (customerReqMatch) {
      customerRequirements = customerReqMatch[1].trim();
    }
    // 如果没有找到特定标记，则使用完整内容
    if (!customerRequirements) {
      customerRequirements = originalInquiryDescription;
    }
  }

  // 构建文档数据
  quotation.documentData = {
    quotationNo,
    quotationDate,
    validUntil,
    rfqReference: rfq.supplierRfqNo || rfq.rfqNumber,
    inquiryReference: customerRequirements, // 🔥 只保存客户要求部分
    
    supplier: {
      companyName: supplierCompany,
      address: supplierAddress,
      tel: supplierPhone,
      email: supplierEmail,
      contactPerson: supplierName,
      supplierCode: supplierCode
    },
    
    buyer: {
      name: '福建高盛达富建材有限公司',
      nameEn: 'Fujian Gaoshengdafu Building Materials Co., Ltd.',
      address: '福建省厦门市思明区',
      addressEn: 'Siming District, Xiamen, Fujian, China',
      tel: '+86-592-1234567',
      email: 'purchase@cosun.com',
      contactPerson: 'COSUN采购'
    },
    
    products: items.map((item, index) => ({
      no: index + 1,
      modelNo: item.modelNo,
      description: item.productName,
      specification: item.specification,
      quantity: item.quantity,
      unit: item.unit,
      unitPrice: item.unitPrice || 0,
      currency: item.currency || 'CNY',
      remarks: item.remarks
    })),
    
    terms: {
      paymentTerms: quotation.paymentTerms,
      deliveryTerms: quotation.deliveryTerms,
      deliveryTime: '收到订单后30天内',
      deliveryAddress: '福建省福州市仓山区金山工业区', // 🔥 添加交货地址
      moq: `${options.moq || 1000} ${rfq.unit || 'pcs'}`,
      qualityStandard: '符合国家标准', // 🔥 添加质量标准
      warranty: '12个月', // 🔥 添加质保期
      packaging: quotation.packingTerms,
      shippingMarks: '中性唛头', // 🔥 添加唛头
      remarks: originalInquiryDescription ? `【原始询价说明】\n${originalInquiryDescription}\n\n${quotation.generalRemarks || ''}`.trim() : quotation.generalRemarks // 🔥 包含原始询价说明
    },
    
    // 🔥 供应商备注
    supplierRemarks: options.supplierRemarks ? {
      content: options.supplierRemarks,
      remarkDate: quotationDate,
      remarkBy: supplierName
    } : undefined
  };

  return quotation;
}

/**
 * 保存报价单到localStorage
 */
export function saveSupplierQuotation(quotation: SupplierQuotation): void {
  if (typeof window === 'undefined') return;

  const saved = localStorage.getItem('supplierQuotations');
  let quotations: SupplierQuotation[] = [];
  
  if (saved) {
    try {
      quotations = JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse supplier quotations:', e);
    }
  }

  // 检查是否已存在
  const existingIndex = quotations.findIndex(q => q.quotationNo === quotation.quotationNo);
  if (existingIndex >= 0) {
    // 更新版本
    quotation.version = quotations[existingIndex].version + 1;
    quotations[existingIndex] = quotation;
  } else {
    quotations.push(quotation);
  }

  localStorage.setItem('supplierQuotations', JSON.stringify(quotations));
  console.log('✅ 报价单已保存:', quotation.quotationNo);
}

/**
 * 获取所有报价单
 */
export function getAllSupplierQuotations(): SupplierQuotation[] {
  if (typeof window === 'undefined') return [];

  const saved = localStorage.getItem('supplierQuotations');
  if (!saved) return [];

  try {
    return JSON.parse(saved);
  } catch (e) {
    console.error('Failed to parse supplier quotations:', e);
    return [];
  }
}