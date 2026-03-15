/**
 * 从采购询价(XJ)创建供应商报价单 — Supabase-first
 */
import { nextBJNumber } from './xjNumberGenerator';
import { productMasterService, productModelMappingService, supplierQuotationService } from '../lib/supabaseService';
import { adaptSupplierQuotationToDocumentData } from './documentDataAdapters';
import { getFormalBusinessModelNo } from './productModelDisplay';

export interface SupplierQuotationItem {
  id: string;
  productName: string;
  modelNo: string;
  supplierModelNo?: string;
  specification?: string;
  quantity: number;
  unit: string;
  unitPrice?: number;
  currency?: string;
  amount?: number;
  leadTime?: number;
  moq?: number;
  remarks?: string;
  customerProductId?: string;
  projectId?: string | null;
  projectRevisionId?: string | null;
  projectRevisionCode?: string | null;
}

export interface SupplierQuotation {
  id: string;
  quotationNo: string;
  quotationNumber?: string;
  bjNumber?: string;
  sourceXJ?: string;
  sourceXJNumber?: string;
  sourceQR?: string;
  sourceXJId?: string;
  projectId?: string | null;
  projectCode?: string | null;
  projectName?: string | null;
  projectRevisionId?: string | null;
  projectRevisionCode?: string | null;
  projectRevisionStatus?: string | null;
  finalRevisionId?: string | null;
  finalQuotationId?: string | null;
  finalQuotationNumber?: string | null;
  quotationRole?: string | null;
  customerName: string;
  customerCompany: string;
  customerContact?: string;
  customerEmail?: string;
  supplierCode: string;
  supplierName: string;
  supplierCompany: string;
  supplierEmail: string;
  supplierPhone?: string;
  quotationDate: string;
  validUntil: string;
  currency: string;
  totalAmount: number;
  paymentTerms?: string;
  deliveryTerms?: string;
  packingTerms?: string;
  generalRemarks?: string;
  items: SupplierQuotationItem[];
  status: 'draft' | 'submitted' | 'accepted' | 'rejected' | 'completed';
  createdBy: string;
  createdDate: string;
  version: number;
  templateId?: string | null;
  templateVersionId?: string | null;
  templateSnapshot?: any;
  documentDataSnapshot?: any;
  documentRenderMeta?: any;
  documentData?: any;
  document_data_snapshot?: any;
}

function assertSupplierQuotationTemplatePayload(quotation: SupplierQuotation) {
  if (!quotation.templateSnapshot || !quotation.documentDataSnapshot) {
    throw new Error('BJ 缺少模板中心快照负载，无法写入');
  }
}

function assertPersistedSupplierQuotationTemplateBinding(quotation: SupplierQuotation) {
  if (!quotation.templateId || !quotation.templateVersionId || !quotation.templateSnapshot || !quotation.documentDataSnapshot) {
    throw new Error('BJ 模板中心绑定不完整，写入结果无效');
  }
}

export async function createQuotationFromXJ(
  xj: any,
  supplierUser: any,
  options: {
    unitPrice?: number;
    leadTime?: number;
    moq?: number;
    supplierModelNo?: string;
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
  const projectExecutionBaseline = xj?.documentRenderMeta?.projectExecutionBaseline || (xj?.projectRevisionId
    ? {
        projectId: xj.projectId || null,
        projectCode: xj.projectCode || null,
        projectName: xj.projectName || null,
        projectRevisionId: xj.projectRevisionId || null,
        projectRevisionCode: xj.projectRevisionCode || null,
        projectRevisionStatus: xj.projectRevisionStatus || null,
        finalRevisionId: xj.finalRevisionId || null,
        finalQuotationId: xj.finalQuotationId || null,
        finalQuotationNumber: xj.finalQuotationNumber || null,
      }
    : null);

  let items: SupplierQuotationItem[] = [];

  if (xj.products && Array.isArray(xj.products) && xj.products.length > 0) {
    items = xj.products.map((product: any, _index: number) => ({
      id: product.id && /^[0-9a-f-]{36}$/.test(product.id) ? product.id : crypto.randomUUID(),
      productName: product.productName || '产品名称',
      modelNo: getFormalBusinessModelNo(product),
      supplierModelNo: product.supplierModelNo || options.supplierModelNo || '',
      specification: product.specification || '',
      quantity: product.quantity || 0,
      unit: product.unit || 'pcs',
      unitPrice: options.unitPrice || 0,
      currency: 'CNY',
      amount: (options.unitPrice || 0) * (product.quantity || 0),
      leadTime: options.leadTime || 30,
      moq: options.moq || 1000,
      remarks: '',
      customerProductId: product.customerProductId || null,
      projectId: product.projectId || projectExecutionBaseline?.projectId || null,
      projectRevisionId: product.projectRevisionId || projectExecutionBaseline?.projectRevisionId || null,
      projectRevisionCode: product.projectRevisionCode || projectExecutionBaseline?.projectRevisionCode || null,
    }));
  } else {
    items = [{
      id: crypto.randomUUID(),
      productName: xj.productName || '产品名称',
      modelNo: getFormalBusinessModelNo(xj),
      supplierModelNo: xj.supplierModelNo || options.supplierModelNo || '',
      specification: xj.specification || '',
      quantity: xj.quantity || 0,
      unit: xj.unit || 'pcs',
      unitPrice: options.unitPrice || 0,
      currency: 'CNY',
      amount: (options.unitPrice || 0) * (xj.quantity || 0),
      leadTime: options.leadTime || 30,
      moq: options.moq || 1000,
      remarks: '',
      customerProductId: xj.customerProductId || null,
      projectId: projectExecutionBaseline?.projectId || null,
      projectRevisionId: projectExecutionBaseline?.projectRevisionId || null,
      projectRevisionCode: projectExecutionBaseline?.projectRevisionCode || null,
    }];
  }

  const totalAmount = items.reduce((sum, item) => sum + (item.amount || 0), 0);

  const sourceTemplateSnapshot = xj?.templateSnapshot || xj?.template_snapshot || null;
  const sourceTemplateVersion = sourceTemplateSnapshot?.version || null;
  const sourceDocumentData = xj?.documentDataSnapshot || xj?.document_data_snapshot || xj?.documentData || null;
  if (!sourceTemplateVersion || !sourceDocumentData) {
    throw new Error('当前 XJ 未绑定模板中心版本快照，无法创建 BJ');
  }

  const quotation: SupplierQuotation = {
    id: crypto.randomUUID(),             // 合法 UUID → toSQRow 幂等 upsert
    quotationNo,
    quotationNumber: quotationNo,        // toSQRow 读 quotationNumber，补充别名
    bjNumber: quotationNo,               // bj_number 列别名
    sourceXJ: xj.supplierXjNo || xj.xjNumber,
    sourceXJNumber: xj.supplierXjNo || xj.xjNumber,  // toSQRow 读 sourceXJNumber
    sourceQR: xj.requirementNo,
    sourceXJId: xj.id,
    projectId: projectExecutionBaseline?.projectId || null,
    projectCode: projectExecutionBaseline?.projectCode || null,
    projectName: projectExecutionBaseline?.projectName || null,
    projectRevisionId: projectExecutionBaseline?.projectRevisionId || null,
    projectRevisionCode: projectExecutionBaseline?.projectRevisionCode || null,
    projectRevisionStatus: projectExecutionBaseline?.projectRevisionStatus || null,
    finalRevisionId: projectExecutionBaseline?.finalRevisionId || null,
    finalQuotationId: projectExecutionBaseline?.finalQuotationId || null,
    finalQuotationNumber: projectExecutionBaseline?.finalQuotationNumber || null,
    quotationRole: projectExecutionBaseline?.projectRevisionId ? 'supplier_response' : null,
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
    version: 1,
    templateSnapshot: { pendingResolution: true },
    documentRenderMeta: projectExecutionBaseline ? { projectExecutionBaseline } : null,
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

  quotation.documentDataSnapshot = adaptSupplierQuotationToDocumentData({
    quotationNo,
    quotationDate,
    validUntil,
    sourceXJ: xj.supplierXjNo || xj.xjNumber,
    sourceXJNumber: xj.supplierXjNo || xj.xjNumber,
    inquiryReference: customerRequirements,
    supplierCode,
    supplierName,
    supplierCompany,
    supplierEmail,
    supplierPhone,
    supplierAddress,
    items,
    paymentTerms: quotation.paymentTerms,
    deliveryTerms: quotation.deliveryTerms,
    packingTerms: quotation.packingTerms,
    generalRemarks: quotation.generalRemarks,
    supplierRemarks: options.supplierRemarks,
  });

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
      modelNo: getFormalBusinessModelNo(item),
      supplierModelNo: item.supplierModelNo || null,
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
  quotation.document_data_snapshot = quotation.documentDataSnapshot;

  return quotation;
}

/**
 * 保存报价单到 Supabase — Supabase-first
 */
export async function saveSupplierQuotation(quotation: SupplierQuotation): Promise<SupplierQuotation> {
  try {
    assertSupplierQuotationTemplatePayload(quotation);
    const saved = await supplierQuotationService.upsert(quotation as any);
    const items = Array.isArray(saved.items) ? saved.items : [];
    for (const item of items) {
      if (!item?.supplierModelNo || !getFormalBusinessModelNo(item)) continue;
      try {
        const productMaster = await productMasterService.upsert({
          internalModelNo: getFormalBusinessModelNo(item),
          regionCode: (saved as any).regionCode || 'NA',
          productName: item.productName || '',
          description: item.specification || '',
          status: 'active',
        });

        await productModelMappingService.ensurePending({
          productId: productMaster.id,
          partyType: 'supplier',
          partyId: saved.supplierEmail || saved.supplierCode || 'supplier',
          externalModelNo: item.supplierModelNo,
          externalProductName: item.productName || '',
          externalSpecification: item.specification || '',
          createdFromDocType: 'supplier_quotation',
          createdFromDocId: saved.id || saved.quotationNo,
          remarks: `Created from supplier quotation ${saved.quotationNo}`,
        });
      } catch (mappingError: any) {
        console.warn('⚠️ [saveSupplierQuotation] supplier mapping sync failed:', mappingError?.message || mappingError);
      }
    }
    assertPersistedSupplierQuotationTemplateBinding(saved as SupplierQuotation);
    console.log('✅ 报价单已保存到 Supabase:', quotation.quotationNo);
    return saved as SupplierQuotation;
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
