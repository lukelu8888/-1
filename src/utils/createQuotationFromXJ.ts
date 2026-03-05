/**
 * 从采购询价(XJ)创建供应商报价单 — Supabase-first
 */
import { nextBJNumber } from './xjNumberGenerator';
import { supplierQuotationService } from '../lib/supabaseService';

export async function createQuotationFromXJ(
  xj: any,
  supplierUser: any,
  options: {
    unitPrice?: number;
    leadTime?: number;
    moq?: number;
    paymentTerms?: string;
    deliveryTerms?: string;
    supplierRemarks?: string;
    status?: 'draft' | 'submitted';
  } = {}
): Promise<SupplierQuotation> {
  // 生成BJ报价单号 — Supabase RPC
  const quotationNo = await nextBJNumber();

  const quotationDate = new Date().toISOString().split('T')[0];
  const validUntilDate = new Date();
  validUntilDate.setDate(validUntilDate.getDate() + 30);
  const validUntil = validUntilDate.toISOString().split('T')[0];

  const supplierEmail = supplierUser?.email || 'supplier@example.com';
  const supplierName = supplierUser?.name || supplierUser?.contact || supplierUser?.username || '供应商';
  const supplierCompany = supplierUser?.company || supplierUser?.name || '供应商公司';
  const supplierCompanyEn = supplierUser?.nameEn || supplierUser?.companyEn || 'Supplier Company Ltd.';
  const supplierAddress = supplierUser?.address || '供应商地址';
  const supplierPhone = supplierUser?.phone || supplierUser?.tel || '';
  const supplierCode = supplierUser?.code || supplierUser?.companyId || supplierEmail;
  const xjTerms = xj?.documentData?.terms || {};

  const paymentTerms =
    options.paymentTerms ||
    xjTerms.paymentTerms ||
    'T/T 30天';
  const deliveryTerms =
    options.deliveryTerms ||
    xjTerms.deliveryTerms ||
    'FOB 厦门';
  const packagingTerms =
    xjTerms.packaging ||
    '标准出口包装';

  let items: SupplierQuotationItem[] = [];

  if (xj.products && Array.isArray(xj.products) && xj.products.length > 0) {
    items = xj.products.map((product: any, _index: number) => ({
      id: product.id && /^[0-9a-f-]{36}$/.test(product.id) ? product.id : crypto.randomUUID(),
      productName: product.productName || '产品名称',
      modelNo: product.modelNo || '',
      specification: product.specification || '',
      quantity: product.quantity || 0,
      unit: product.unit || 'pcs',
      unitPrice: options.unitPrice || 0,
      currency: 'CNY',
      amount: (options.unitPrice || 0) * (product.quantity || 0),
      leadTime: options.leadTime || 30,
      moq: options.moq || 1000,
      remarks: ''
    }));
  } else {
    items = [{
      id: crypto.randomUUID(),
      productName: xj.productName || '产品名称',
      modelNo: xj.modelNo || '',
      specification: xj.specification || '',
      quantity: xj.quantity || 0,
      unit: xj.unit || 'pcs',
      unitPrice: options.unitPrice || 0,
      currency: 'CNY',
      amount: (options.unitPrice || 0) * (xj.quantity || 0),
      leadTime: options.leadTime || 30,
      moq: options.moq || 1000,
      remarks: ''
    }];
  }

  const totalAmount = items.reduce((sum, item) => sum + (item.amount || 0), 0);

  const quotation: SupplierQuotation = {
    id: crypto.randomUUID(),             // 合法 UUID → toSQRow 幂等 upsert
    quotationNo,
    quotationNumber: quotationNo,        // toSQRow 读 quotationNumber，补充别名
    bjNumber: quotationNo,               // bj_number 列别名
    sourceXJ: xj.supplierXjNo || xj.xjNumber,
    sourceXJNumber: xj.supplierXjNo || xj.xjNumber,  // toSQRow 读 sourceXJNumber
    sourceQR: xj.requirementNo,
    sourceXJId: xj.id,
    customerName: 'COSUN采购',
    customerCompany: '福建高盛达富建材有限公司',
    customerContact: xj.buyerContact,
    customerEmail: xj.buyerEmail,
    supplierCode,
    supplierName,
    supplierCompany,
    supplierEmail,
    supplierPhone,
    quotationDate,
    validUntil,
    currency: 'CNY',
    totalAmount,
    paymentTerms,
    deliveryTerms,
    packingTerms: packagingTerms,
    generalRemarks: '',
    items,
    status: options.status || 'draft',
    createdBy: supplierEmail,
    createdDate: quotationDate,
    version: 1
  };

  const originalInquiryDescription = xj.documentData?.inquiryDescription || '';
  let customerRequirements = '';
  if (originalInquiryDescription) {
    const specialReqMatch = originalInquiryDescription.match(/【特殊要求】\s*\n([\s\S]*?)(?=\n\n【|$)/);
    const customerReqMatch = originalInquiryDescription.match(/【客户要求】\s*\n([\s\S]*?)(?=\n\n【|$)/);
    if (specialReqMatch) customerRequirements = specialReqMatch[1].trim();
    else if (customerReqMatch) customerRequirements = customerReqMatch[1].trim();
    if (!customerRequirements) customerRequirements = originalInquiryDescription;
  }

  quotation.documentData = {
    quotationNo,
    quotationDate,
    validUntil,
    xjReference: xj.supplierXjNo || xj.xjNumber,
    inquiryReference: customerRequirements,
    supplier: {
      companyName: supplierCompany,
      address: supplierAddress,
      tel: supplierPhone,
      email: supplierEmail,
      contactPerson: supplierName,
      supplierCode
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
      unitPrice: item.unitPrice > 0 ? item.unitPrice : null,
      currency: item.currency || 'CNY',
      remarks: item.remarks
    })),
    terms: {
      paymentTerms: quotation.paymentTerms,
      deliveryTerms: quotation.deliveryTerms,
      deliveryTime: xjTerms.deliveryRequirement || '收到订单后30天内',
      deliveryAddress: xjTerms.deliveryAddress || '福建省福州市仓山区金山工业区',
      moq: xjTerms.moq || `${options.moq || 1000} ${xj.unit || 'pcs'}`,
      qualityStandard: xjTerms.qualityStandard || '符合国家标准',
      warranty: xjTerms.warranty || '12个月',
      packaging: quotation.packingTerms,
      shippingMarks: xjTerms.shippingMarks || '中性唛头',
      remarks: originalInquiryDescription
        ? `【原始询价说明】\n${originalInquiryDescription}\n\n${quotation.generalRemarks || ''}`.trim()
        : quotation.generalRemarks
    },
    supplierRemarks: options.supplierRemarks ? {
      content: options.supplierRemarks,
      remarkDate: quotationDate,
      remarkBy: supplierName
    } : undefined
  };

  return quotation;
}

/**
 * 保存报价单到 Supabase — Supabase-first
 */
export async function saveSupplierQuotation(quotation: SupplierQuotation): Promise<void> {
  try {
    await supplierQuotationService.upsert(quotation as any);
    console.log('✅ 报价单已保存到 Supabase:', quotation.quotationNo);
  } catch (e: any) {
    console.error('❌ [saveSupplierQuotation] Supabase 写入失败:', e?.message);
    throw e;
  }
}

/**
 * 获取所有报价单 — Supabase-first
 */
export async function getAllSupplierQuotations(): Promise<SupplierQuotation[]> {
  try {
    const rows = await supplierQuotationService.getAll();
    return (Array.isArray(rows) ? rows : []) as SupplierQuotation[];
  } catch (e: any) {
    console.error('❌ [getAllSupplierQuotations] Supabase 读取失败:', e?.message);
    return [];
  }
}
