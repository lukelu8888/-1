/**
 * 📋 文档数据适配器
 * 
 * 用途：将业务模块的数据格式转换为文档中心标准模板所需的数据格式
 * 优势：业务逻辑与文档模板解耦，模板升级不影响业务代码
 * 
 * @author COSUN B2B System
 * @date 2025-12-14
 */

import type { SalesContractData } from '@/components/documents/templates/SalesContractDocument';
import type { QuotationData } from '@/components/documents/templates/QuotationDocument';
import type { SupplierQuotationData } from '@/components/documents/templates/SupplierQuotationDocument';
import type { CustomerInquiryData } from '@/components/documents/templates/CustomerInquiryDocument';
import { aggregateInquiryOemFromProducts, type InquiryOemData } from '@/types/oem';
import {
  getCustomerFacingModelNo,
  getFormalBusinessModelNo,
  getSupplierFacingModelNo,
} from '@/utils/productModelDisplay';

const toSafeNumber = (value: unknown): number => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/,/g, '').trim());
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
};

const parseInquiryRequirementsFromMessage = (message?: string | null) => {
  const parsed = {
    deliveryTime: '',
    portOfDestination: '',
    paymentTerms: '',
    tradeTerms: '',
    packingRequirements: '',
    certifications: [] as string[],
    otherRequirements: '',
  };

  if (!message?.trim()) {
    return parsed;
  }

  const patterns: Array<[keyof typeof parsed, RegExp[]]> = [
    ['tradeTerms', [/^\s*1\.\s*Price:\s*(.*)$/i, /^\s*Trade Terms:\s*(.*)$/i]],
    ['deliveryTime', [/^\s*2\.\s*Delivery time:\s*(.*)$/i, /^\s*Delivery Time:\s*(.*)$/i]],
    ['portOfDestination', [/^\s*3\.\s*Destination Port:\s*(.*)$/i, /^\s*Port of Destination:\s*(.*)$/i]],
    ['paymentTerms', [/^\s*4\.\s*Payment Term:\s*(.*)$/i, /^\s*Payment Terms:\s*(.*)$/i]],
    ['packingRequirements', [/^\s*Packing Requirements:\s*(.*)$/i]],
    ['otherRequirements', [/^\s*5\.\s*Others:\s*(.*)$/i, /^\s*Other Requirements:\s*(.*)$/i]],
  ];

  message.split('\n').forEach((line) => {
    patterns.forEach(([key, keyPatterns]) => {
      keyPatterns.forEach((pattern) => {
        const match = line.match(pattern);
        if (match) {
          parsed[key] = match[1]?.trim() || '';
        }
      });
    });

    const certificationMatch = line.match(/^\s*Certifications Required:\s*(.*)$/i);
    if (certificationMatch) {
      parsed.certifications = certificationMatch[1]
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
    }
  });

  return parsed;
};

export interface OemFactoryFacingDocumentData {
  inquiryNumber: string;
  issueDate: string;
  ownerDepartment: 'Procurement Department';
  internalCompany: {
    companyName: string;
    brandName: string;
    contactPerson: string;
    email: string;
    phone: string;
    address: string;
    projectName: string;
  };
  redactionSummary: Array<{
    field: string;
    originalValue: string;
    replacementValue: string;
  }>;
  businessRequirementNote: string;
  tooling: {
    toolingCostInvolved: boolean;
    firstOrderQuantity: string;
    annualQuantity: string;
    quantityWithinThreeYears: string;
    moldLifetime: string;
  };
  files: Array<{
    id: string;
    fileName: string;
    description: string;
    fileType: string;
    fileSize: number;
    factoryFacingCode: string;
    customerPartNumber: string;
    internalModelNumber: string;
    internalSku: string;
    factoryFacingPartNumber: string;
    storageUrl?: string;
  }>;
  partNumberMappings: Array<{
    customerPartNumber: string;
    internalModelNumber: string;
    internalSku: string;
    factoryFacingPartNumber: string;
    status: string;
  }>;
}

const resolveProductLevelInquiryOem = (inquiry: {
  products?: Array<any>;
  oem?: InquiryOemData | null;
}): InquiryOemData | null => {
  const products = Array.isArray(inquiry.products) ? inquiry.products : [];
  const aggregated = aggregateInquiryOemFromProducts(products);

  if (aggregated.enabled) {
    return aggregated;
  }

  return inquiry.oem || null;
};

const INTERNAL_OEM_COMPANY_INFO = {
  companyName: 'FUJIAN COSUN TUFF BUILDING MATERIALS CO., LTD.',
  brandName: 'COSUN',
  contactPerson: 'Procurement Department',
  email: 'export@cosun.com',
  phone: '+86-591-8888-8888',
  address: 'Jinshan Industrial Zone, Jianxin Town, Cangshan District, Fuzhou, Fujian, China',
};

const toFactoryFacingPartNumber = (internalModelNumber?: string, internalSku?: string) => {
  const model = String(internalModelNumber || '').trim();
  const sku = String(internalSku || '').trim();

  if (model && sku) return `${model} / ${sku}`;
  if (model) return model;
  if (sku) return sku;

  return 'MODEL# / SKU PENDING';
};

export function adaptInquiryToFactoryFacingOemDocument(inquiry: {
  inquiryNumber?: string;
  date?: string;
  buyerInfo?: {
    companyName?: string;
    contactPerson?: string;
    email?: string;
    phone?: string;
    address?: string;
  };
  message?: string;
  oem?: InquiryOemData | null;
  products?: Array<any>;
}): OemFactoryFacingDocumentData | null {
  const oem = resolveProductLevelInquiryOem(inquiry);
  if (!oem?.enabled) return null;

  const inquiryNumber = inquiry.inquiryNumber || 'ING-DRAFT';
  const issueDate = inquiry.date || new Date().toISOString().split('T')[0];
  const projectName = `COSUN OEM PROJECT ${inquiryNumber}`;
  const fileMappings = new Map(
    (Array.isArray(oem.partNumberMappings) ? oem.partNumberMappings : []).map((mapping) => [
      mapping.customerPartNumber,
      mapping,
    ]),
  );

  const redactionSummary = [
    {
      field: 'Customer Company Name',
      originalValue: String(inquiry.buyerInfo?.companyName || ''),
      replacementValue: INTERNAL_OEM_COMPANY_INFO.companyName,
    },
    {
      field: 'Customer Contact',
      originalValue: String(inquiry.buyerInfo?.contactPerson || ''),
      replacementValue: INTERNAL_OEM_COMPANY_INFO.contactPerson,
    },
    {
      field: 'Customer Email',
      originalValue: String(inquiry.buyerInfo?.email || ''),
      replacementValue: INTERNAL_OEM_COMPANY_INFO.email,
    },
    {
      field: 'Customer Phone',
      originalValue: String(inquiry.buyerInfo?.phone || ''),
      replacementValue: INTERNAL_OEM_COMPANY_INFO.phone,
    },
    {
      field: 'Customer Address',
      originalValue: String(inquiry.buyerInfo?.address || ''),
      replacementValue: INTERNAL_OEM_COMPANY_INFO.address,
    },
    {
      field: 'Project Name',
      originalValue: String(inquiry.message || ''),
      replacementValue: projectName,
    },
  ].filter((entry) => entry.originalValue || entry.replacementValue);

  return {
    inquiryNumber,
    issueDate,
    ownerDepartment: 'Procurement Department',
    internalCompany: {
      ...INTERNAL_OEM_COMPANY_INFO,
      projectName,
    },
    redactionSummary,
    businessRequirementNote: oem.overallRequirementNote,
    tooling: {
      toolingCostInvolved: oem.tooling.toolingCostInvolved,
      firstOrderQuantity: oem.tooling.firstOrderQuantity,
      annualQuantity: oem.tooling.annualQuantity,
      quantityWithinThreeYears: oem.tooling.quantityWithinThreeYears,
      moldLifetime: oem.tooling.moldLifetime,
    },
    files: oem.files.map((file, index) => {
      const mapped = fileMappings.get(file.customerPartNumber);
      const internalModelNumber = mapped?.internalModelNumber || file.internalModelNumber || '';
      const internalSku = mapped?.internalSku || file.internalSku || '';

      return {
        id: file.id,
        fileName: file.fileName,
        description: file.description,
        fileType: file.fileType,
        fileSize: file.fileSize,
        factoryFacingCode: `OEM-TECH-${String(index + 1).padStart(3, '0')}`,
        customerPartNumber: file.customerPartNumber,
        internalModelNumber,
        internalSku,
        factoryFacingPartNumber: toFactoryFacingPartNumber(internalModelNumber, internalSku),
        storageUrl: file.storageUrl,
      };
    }),
    partNumberMappings: oem.partNumberMappings.map((mapping) => ({
      customerPartNumber: mapping.customerPartNumber,
      internalModelNumber: mapping.internalModelNumber,
      internalSku: mapping.internalSku,
      factoryFacingPartNumber: toFactoryFacingPartNumber(mapping.internalModelNumber, mapping.internalSku),
      status: mapping.status,
    })),
  };
}

export function adaptInquiryToDocumentData(inquiry: {
  inquiryNumber?: string;
  date?: string;
  region?: 'NA' | 'SA' | 'EU';
  buyerInfo?: {
    companyName?: string;
    contactPerson?: string;
    email?: string;
    phone?: string;
    address?: string;
  };
  products?: Array<{
    modelNo?: string;
    image?: string;
    imageUrl?: string;
    productName?: string;
    specification?: string;
    quantity?: number;
    unit?: string;
    targetPrice?: number;
    unitPrice?: number;
    currency?: string;
    color?: string;
    material?: string;
  }>;
  shippingInfo?: {
    cartons?: string;
    cbm?: string;
    totalGrossWeight?: string;
    totalNetWeight?: string;
  };
  requirements?: {
    deliveryTime?: string;
    portOfDestination?: string;
    paymentTerms?: string;
    tradeTerms?: string;
    packingRequirements?: string;
    certifications?: string[] | string;
    otherRequirements?: string;
  };
  oem?: InquiryOemData;
  message?: string;
}): CustomerInquiryData {
  const region = inquiry.region || 'NA';
  const date = inquiry.date || new Date().toISOString().split('T')[0];
  const products = Array.isArray(inquiry.products) ? inquiry.products : [];
  const customerEmail = inquiry.buyerInfo?.email || '';
  const emailName = customerEmail.includes('@') ? customerEmail.split('@')[0] : customerEmail;
  const hasStructuredRequirements = Boolean(
    inquiry.requirements && Object.values(inquiry.requirements).some((value) => {
      if (Array.isArray(value)) return value.length > 0;
      return Boolean(String(value || '').trim());
    }),
  );
  const legacyRequirements = parseInquiryRequirementsFromMessage(inquiry.message);
  const certificationList = Array.isArray(inquiry.requirements?.certifications)
    ? inquiry.requirements.certifications
    : (inquiry.requirements?.certifications || '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
  const companyName = inquiry.buyerInfo?.companyName && inquiry.buyerInfo.companyName !== 'N/A'
    ? inquiry.buyerInfo.companyName
    : (emailName ? `${emailName} inquiry` : 'Customer Inquiry');
  const contactPerson = inquiry.buyerInfo?.contactPerson && inquiry.buyerInfo.contactPerson !== 'N/A'
    ? inquiry.buyerInfo.contactPerson
    : (emailName || 'Customer');

  const resolvedOem = resolveProductLevelInquiryOem(inquiry);

  return {
    inquiryNo: inquiry.inquiryNumber || 'ING-DRAFT',
    inquiryDate: date,
    region,
    customer: {
      companyName,
      contactPerson,
      email: customerEmail,
      phone: inquiry.buyerInfo?.phone && inquiry.buyerInfo.phone !== 'N/A' ? inquiry.buyerInfo.phone : '',
      address: inquiry.buyerInfo?.address && inquiry.buyerInfo.address !== 'N/A' ? inquiry.buyerInfo.address : '',
      country: region === 'NA' ? 'United States' : region === 'SA' ? 'South America' : 'Europe & Africa',
    },
    products: products.map((product, index) => {
      const quantity = toSafeNumber(product.quantity);
      const targetPrice = toSafeNumber(product.targetPrice ?? product.unitPrice);
      return {
        no: index + 1,
        modelNo: getCustomerFacingModelNo(product),
        imageUrl: product.imageUrl || product.image || '',
        productName: product.productName || 'Unnamed Product',
        specification: [product.specification, product.color, product.material].filter(Boolean).join(' / '),
        quantity,
        unit: product.unit || 'pcs',
        targetPrice: targetPrice || undefined,
        currency: product.currency || 'USD',
        description: '',
      };
    }),
    requirements: {
      deliveryTime: inquiry.requirements?.deliveryTime || (!hasStructuredRequirements ? legacyRequirements.deliveryTime : ''),
      portOfDestination: inquiry.requirements?.portOfDestination || (!hasStructuredRequirements ? legacyRequirements.portOfDestination : ''),
      paymentTerms: inquiry.requirements?.paymentTerms || (!hasStructuredRequirements ? legacyRequirements.paymentTerms : ''),
      tradeTerms: inquiry.requirements?.tradeTerms || (!hasStructuredRequirements ? legacyRequirements.tradeTerms : ''),
      packingRequirements: inquiry.requirements?.packingRequirements || (!hasStructuredRequirements ? legacyRequirements.packingRequirements : ''),
      certifications: certificationList.length > 0 ? certificationList : (!hasStructuredRequirements ? legacyRequirements.certifications : []),
      otherRequirements: inquiry.requirements?.otherRequirements || (!hasStructuredRequirements ? legacyRequirements.otherRequirements || inquiry.message || '' : ''),
    },
    oem: resolvedOem || undefined,
    remarks: inquiry.message || '',
    status: 'pending',
  };
}

/**
 * 🔥 订单数据 → 销售合同数据适配器
 * 
 * 将AdminActiveOrders中的订单数据转换为SalesContractDocument所需的标准格式
 */
export function adaptOrderToSalesContract(orderData: {
  orderNumber: string;
  customer: string;
  customerEmail?: string;
  customerCountry?: string;
  customerAddress?: string;
  customerContact?: string;
  customerPhone?: string;
  date: string;
  expectedDelivery: string;
  totalAmount: number;
  currency: string;
  products: Array<{
    name: string;
    specs?: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    unit?: string;
    hsCode?: string;
    modelNo?: string;
    imageUrl?: string;
  }>;
  shippingMethod?: string;
  quotationNumber?: string;
  region?: 'NA' | 'SA' | 'EU';
  paymentTerms?: string;
  tradeTerms?: string;
  portOfLoading?: string;
  portOfDestination?: string;
}): SalesContractData {
  const normalizedOrderDate = new Date(orderData.date);
  const safeOrderDate = Number.isFinite(normalizedOrderDate.getTime())
    ? normalizedOrderDate
    : new Date();
  const totalAmount = toSafeNumber(orderData.totalAmount);
  
  // 生成销售合同编号（如果没有的话）
  const contractNo = orderData.quotationNumber 
    ? orderData.quotationNumber.replace('QT-', 'SC-')
    : `SC-${orderData.region || 'NA'}-${safeOrderDate.toISOString().slice(0, 10).replace(/-/g, '')}-${orderData.orderNumber.slice(-3)}`;
  
  // 推断区域
  const region = orderData.region || detectRegionFromCustomer(orderData.customer, orderData.customerCountry);
  
  return {
    contractNo,
    contractDate: orderData.date,
    quotationNo: orderData.quotationNumber,
    region,
    
    // 卖方信息（高盛达富）
    seller: {
      name: '福建高盛达富建材有限公司',
      nameEn: 'Fujian Cosun Dafu Building Materials Co., Ltd.',
      address: '福建省福州市仓山区建新镇金山工业区',
      addressEn: 'Jinshan Industrial Zone, Jianxin Town, Cangshan District, Fuzhou City, Fujian Province, China',
      tel: '+86-591-8888-8888',
      fax: '+86-591-8888-8889',
      email: 'export@cosun.com',
      legalRepresentative: '张三',
      businessLicense: '91350000MA2XYZ1234',
      bankInfo: {
        bankName: 'Bank of China Fuzhou Branch',
        accountName: 'Fujian Cosun Dafu Building Materials Co., Ltd.',
        accountNumber: '1234567890123456',
        swiftCode: 'BKCHCNBJ950',
        bankAddress: 'No. 136 Wusi Road, Fuzhou, Fujian, China',
        currency: orderData.currency
      }
    },
    
    // 买方信息
    buyer: {
      companyName: orderData.customer,
      address: orderData.customerAddress || 'To be confirmed',
      country: orderData.customerCountry || detectCountryFromRegion(region),
      contactPerson: orderData.customerContact || 'N/A',
      tel: orderData.customerPhone || 'N/A',
      email: orderData.customerEmail || 'N/A'
    },
    
    // 产品列表
    products: orderData.products.map((product, index) => {
      const quantity = toSafeNumber(product.quantity);
      const unitPrice = toSafeNumber(product.unitPrice);
      const amount = toSafeNumber(product.totalPrice) || quantity * unitPrice;
      return {
      no: index + 1,
      modelNo: getFormalBusinessModelNo(product),
      imageUrl: product.imageUrl,
      description: product.name,
      specification: product.specs || 'Standard',
      hsCode: product.hsCode,
      quantity,
      unit: product.unit || 'pcs',
      unitPrice,
      currency: orderData.currency,
      amount,
      deliveryTime: orderData.expectedDelivery
    }}),
    
    // 合同条款
    terms: {
      totalAmount,
      currency: orderData.currency,
      tradeTerms: orderData.tradeTerms || determinePriceTerm(region),
      paymentTerms: orderData.paymentTerms || '30% T/T deposit, 70% balance before shipment',
      depositAmount: totalAmount * 0.3,
      balanceAmount: totalAmount * 0.7,
      deliveryTime: `${calculateDeliveryDays(orderData.date, orderData.expectedDelivery)} days after deposit received`,
      portOfLoading: orderData.portOfLoading || 'Xiamen, China',
      portOfDestination: orderData.portOfDestination || determineDestinationPort(region),
      packing: 'Export standard carton with pallet',
      inspection: 'Seller\'s quality inspection before shipment; Buyer has the right to reinspect upon arrival',
      insurance: orderData.tradeTerms?.includes('CIF') ? 'Covered by seller for 110% of invoice value' : 'To be covered by buyer',
      warranty: '12 months from the date of shipment for manufacturing defects'
    },
    
    // 违约责任
    liabilityTerms: {
      sellerDefault: 'If the Seller fails to deliver the goods within the agreed time without valid reason, the Seller shall pay liquidated damages equal to 0.5% of the total contract value for each week of delay, up to a maximum of 5% of the total contract value.',
      buyerDefault: 'If the Buyer fails to make payment within the agreed time, the Buyer shall pay liquidated damages equal to 0.5% of the outstanding amount for each week of delay. If payment is delayed for more than 30 days, the Seller has the right to terminate the contract and claim compensation.',
      forceMajeure: 'Neither party shall be liable for failure or delay in performing its obligations due to force majeure events such as natural disasters, war, government actions, or other unforeseeable circumstances beyond reasonable control. The affected party must notify the other party within 7 days and provide relevant證明 documents.'
    },
    
    // 争议解决
    disputeResolution: {
      governingLaw: 'This contract shall be governed by and construed in accordance with the laws of the People\'s Republic of China.',
      arbitration: 'Any disputes arising from or in connection with this contract shall be settled through friendly negotiation. If negotiation fails, the dispute shall be submitted to China International Economic and Trade Arbitration Commission (CIETAC) for arbitration in accordance with its rules. The arbitration award shall be final and binding on both parties.'
    },
    
    // 签名信息
    signature: {
      sellerSignatory: '张三 (Legal Representative)',
      buyerSignatory: orderData.customerContact || 'To be signed',
      signDate: orderData.date
    }
  };
}

export function adaptSalesQuotationToDocumentData(quotation: {
  qtNumber?: string;
  createdAt?: string;
  quotationDate?: string;
  validUntil?: string;
  inqNumber?: string;
  region?: 'NA' | 'SA' | 'EU';
  customerCompany?: string;
  customerName?: string;
  customerAddress?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerCountry?: string;
  items?: Array<{
    modelNo?: string;
    imageUrl?: string;
    productName?: string;
    specification?: string;
    hsCode?: string;
    quantity?: number;
    unit?: string;
    salesPrice?: number;
    unitPrice?: number;
    currency?: string;
    amount?: number;
    moq?: number;
    leadTime?: string;
  }>;
  tradeTerms?: {
    incoterms?: string;
    paymentTerms?: string;
    deliveryTime?: string;
    packing?: string;
    portOfLoading?: string;
    portOfDestination?: string;
    warranty?: string;
    inspection?: string;
  };
  remarks?: string;
  salesPersonName?: string;
  salesPerson?: string;
  salesPersonPhone?: string;
  salesPersonWhatsapp?: string;
}): QuotationData {
  const quotationDate = quotation.quotationDate
    || (quotation.createdAt ? new Date(quotation.createdAt).toISOString().split('T')[0] : null)
    || new Date().toISOString().split('T')[0];
  const validUntil = quotation.validUntil
    || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const currency = quotation.items?.[0]?.currency || 'USD';

  return {
    quotationNo: quotation.qtNumber || 'QT-DRAFT',
    quotationDate,
    validUntil,
    inquiryNo: quotation.inqNumber,
    region: quotation.region || 'NA',
    company: {
      name: '福建高盛达富建材有限公司',
      nameEn: 'Fujian Gaoshengdafu Building Materials Co., Ltd.',
      address: '中国福建省厦门市思明区',
      addressEn: 'Siming District, Xiamen, Fujian Province, China',
      tel: '+86-592-1234567',
      fax: '+86-592-1234568',
      email: 'info@cosun.com',
      website: 'www.cosun.com',
    },
    customer: {
      companyName: quotation.customerCompany || '',
      contactPerson: quotation.customerName || '',
      address: quotation.customerAddress || '',
      email: quotation.customerEmail || '',
      phone: quotation.customerPhone || '',
    },
    products: (quotation.items || []).map((item, index) => {
      const quantity = toSafeNumber(item.quantity);
      const unitPrice = toSafeNumber(item.salesPrice ?? item.unitPrice);
      return {
        no: index + 1,
        modelNo: getFormalBusinessModelNo(item),
        imageUrl: item.imageUrl || '',
        productName: item.productName || '',
        specification: item.specification || '',
        hsCode: item.hsCode || '',
        quantity,
        unit: item.unit || 'PCS',
        unitPrice,
        currency: item.currency || currency,
        amount: toSafeNumber(item.amount) || quantity * unitPrice,
        moq: item.moq || 0,
        leadTime: item.leadTime || '',
      };
    }),
    tradeTerms: {
      incoterms: quotation.tradeTerms?.incoterms || 'FOB Xiamen',
      paymentTerms: quotation.tradeTerms?.paymentTerms || '30% T/T deposit, 70% before shipment',
      deliveryTime: quotation.tradeTerms?.deliveryTime || '25-30 days after deposit',
      packing: quotation.tradeTerms?.packing || 'Export carton with pallets',
      portOfLoading: quotation.tradeTerms?.portOfLoading || 'Xiamen, China',
      portOfDestination: quotation.tradeTerms?.portOfDestination || quotation.customerCountry || '',
      warranty: quotation.tradeTerms?.warranty || '12 months from delivery date against manufacturing defects',
      inspection: quotation.tradeTerms?.inspection || "Seller's factory inspection, buyer has the right to re-inspect upon arrival",
    },
    remarks: quotation.remarks || '',
    salesPerson: {
      name: quotation.salesPersonName || 'Sales Representative',
      position: 'Sales Manager',
      email: quotation.salesPerson || '',
      phone: quotation.salesPersonPhone || '+86-592-1234567',
      whatsapp: quotation.salesPersonWhatsapp || '',
    },
  };
}

export function adaptLegacyQuotationToDocumentData(quotation: {
  quotationNumber?: string;
  quotationDate?: string;
  validUntil?: string;
  inquiryNumber?: string;
  region?: string;
  customer?: string;
  customerName?: string;
  customerAddress?: string;
  customerEmail?: string;
  customerPhone?: string;
  products?: Array<{
    productName?: string;
    name?: string;
    specs?: string;
    specification?: string;
    quantity?: number;
    unit?: string;
    unitPrice?: number;
    totalPrice?: number;
    sku?: string;
    image?: string;
  }>;
  currency?: string;
  paymentTerms?: string;
  deliveryTerms?: string;
  notes?: string;
}): QuotationData {
  const quotationDate = quotation.quotationDate || new Date().toISOString().split('T')[0];
  const validUntil =
    quotation.validUntil
    || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const rawRegion = quotation.region === 'EA' ? 'EU' : quotation.region;
  const region = rawRegion === 'SA' || rawRegion === 'EU' ? rawRegion : 'NA';
  const currency = quotation.currency || 'USD';

  return {
    quotationNo: quotation.quotationNumber || 'QT-DRAFT',
    quotationDate,
    validUntil,
    inquiryNo: quotation.inquiryNumber,
    region,
    company: {
      name: '福建高盛达富建材有限公司',
      nameEn: 'Fujian Gaoshengdafu Building Materials Co., Ltd.',
      address: '中国福建省厦门市思明区',
      addressEn: 'Siming District, Xiamen, Fujian Province, China',
      tel: '+86-592-1234567',
      fax: '+86-592-1234568',
      email: 'info@cosun.com',
      website: 'www.cosun.com',
    },
    customer: {
      companyName: quotation.customerName || quotation.customer || '',
      contactPerson: quotation.customerName || quotation.customer || '',
      address: quotation.customerAddress || '',
      email: quotation.customerEmail || '',
      phone: quotation.customerPhone || '',
    },
    products: (quotation.products || []).map((item, index) => {
      const quantity = toSafeNumber(item.quantity);
      const unitPrice = toSafeNumber(item.unitPrice);
      return {
        no: index + 1,
        modelNo: getFormalBusinessModelNo({
          ...item,
          modelNo: item.sku || item.modelNo || '',
        }),
        imageUrl: item.image || '',
        productName: item.productName || item.name || '',
        specification: item.specification || item.specs || '',
        hsCode: '',
        quantity,
        unit: item.unit || 'PCS',
        unitPrice,
        currency,
        amount: toSafeNumber(item.totalPrice) || quantity * unitPrice,
        moq: 0,
        leadTime: '',
      };
    }),
    tradeTerms: {
      incoterms: quotation.deliveryTerms || 'FOB Xiamen',
      paymentTerms: quotation.paymentTerms || '30% T/T deposit, 70% before shipment',
      deliveryTime: '25-30 days after deposit',
      packing: 'Export carton with pallets',
      portOfLoading: 'Xiamen, China',
      portOfDestination: '',
      warranty: '12 months from delivery date against manufacturing defects',
      inspection: "Seller's factory inspection, buyer has the right to re-inspect upon arrival",
    },
    remarks: quotation.notes || '',
    salesPerson: {
      name: 'Sales Representative',
      position: 'Sales Manager',
      email: '',
      phone: '+86-592-1234567',
      whatsapp: '',
    },
  };
}

export function adaptSupplierQuotationToDocumentData(quotation: {
  quotationNo?: string;
  quotationDate?: string;
  validUntil?: string;
  sourceXJ?: string;
  sourceXJNumber?: string;
  inquiryReference?: string;
  supplierCode?: string;
  supplierName?: string;
  supplierCompany?: string;
  supplierEmail?: string;
  supplierPhone?: string;
  supplierAddress?: string;
  items?: Array<{
    modelNo?: string;
    imageUrl?: string;
    productName?: string;
    description?: string;
    specification?: string;
    quantity?: number;
    unit?: string;
    unitPrice?: number | null;
    currency?: string;
    remarks?: string;
  }>;
  paymentTerms?: string;
  deliveryTerms?: string;
  packingTerms?: string;
  generalRemarks?: string;
  supplierRemarks?: string;
}): SupplierQuotationData {
  const quotationDate = quotation.quotationDate || new Date().toISOString().split('T')[0];
  const validUntil =
    quotation.validUntil ||
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  return {
    quotationNo: quotation.quotationNo || 'BJ-DRAFT',
    quotationDate,
    validUntil,
    xjReference: quotation.sourceXJNumber || quotation.sourceXJ || '',
    inquiryReference: quotation.inquiryReference || '',
    supplier: {
      companyName: quotation.supplierCompany || quotation.supplierName || '',
      companyNameEn: quotation.supplierCompany || quotation.supplierName || '',
      address: quotation.supplierAddress || '',
      addressEn: quotation.supplierAddress || '',
      tel: quotation.supplierPhone || '',
      email: quotation.supplierEmail || '',
      contactPerson: quotation.supplierName || '',
      supplierCode: quotation.supplierCode || '',
    },
    buyer: {
      name: '福建高盛达富建材有限公司',
      nameEn: 'Fujian Gaoshengdafu Building Materials Co., Ltd.',
      address: '福建省厦门市思明区',
      addressEn: 'Siming District, Xiamen, Fujian, China',
      tel: '+86-592-1234567',
      email: 'purchase@cosun.com',
      contactPerson: 'COSUN采购',
    },
    products: (quotation.items || []).map((item, index) => ({
      no: index + 1,
      modelNo: getSupplierFacingModelNo(item),
      imageUrl: item.imageUrl || '',
      itemCode: '',
      description: item.productName || item.description || '',
      specification: item.specification || '',
      quantity: toSafeNumber(item.quantity),
      unit: item.unit || 'PCS',
      unitPrice: toSafeNumber(item.unitPrice),
      currency: item.currency || 'CNY',
      remarks: item.remarks || '',
    })),
    terms: {
      paymentTerms: quotation.paymentTerms || 'T/T 30天',
      deliveryTerms: quotation.deliveryTerms || 'FOB 厦门',
      deliveryTime: '收到订单后30天内',
      deliveryAddress: '福建省福州市仓山区金山工业区',
      moq: '',
      qualityStandard: '符合国家标准',
      warranty: '12个月',
      packaging: quotation.packingTerms || '标准出口包装',
      shippingMarks: '中性唛头',
      remarks: quotation.generalRemarks || '',
    },
    supplierRemarks: quotation.supplierRemarks
      ? {
          content: quotation.supplierRemarks,
          remarkDate: quotationDate,
          remarkBy: quotation.supplierName || '',
        }
      : undefined,
  };
}

export function adaptSalesContractToDocumentData(contract: {
  contractNumber?: string;
  createdAt?: string;
  quotationNumber?: string;
  inquiryNumber?: string;
  region?: 'NA' | 'SA' | 'EA' | 'EU';
  customerCompany?: string;
  customerAddress?: string;
  customerCountry?: string;
  customerName?: string;
  contactPhone?: string;
  customerEmail?: string;
  salesPersonName?: string;
  products?: Array<{
    productName?: string;
    modelNo?: string;
    imageUrl?: string;
    specification?: string;
    hsCode?: string;
    quantity?: number;
    unit?: string;
    unitPrice?: number;
    currency?: string;
    amount?: number;
    deliveryTime?: string;
  }>;
  totalAmount?: number;
  currency?: string;
  tradeTerms?: string;
  paymentTerms?: string;
  depositAmount?: number;
  balanceAmount?: number;
  deliveryTime?: string;
  portOfLoading?: string;
  portOfDestination?: string;
  packing?: string;
  remarks?: string;
}): SalesContractData {
  const region = contract.region === 'EA' ? 'EU' : (contract.region || 'NA');
  const totalAmount = toSafeNumber(contract.totalAmount);
  return {
    contractNo: contract.contractNumber || 'SC-DRAFT',
    contractDate: contract.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0],
    quotationNo: contract.quotationNumber,
    region,
    seller: {
      name: '福建高盛达富建材有限公司',
      nameEn: 'FUJIAN COSUN BUILDING MATERIALS CO., LTD.',
      address: '中国福建省厦门市工业园区123号',
      addressEn: 'No. 123, Industrial Park, Xiamen, Fujian, China',
      tel: '+86-592-1234-5678',
      fax: '+86-592-1234-5679',
      email: 'sales@cosun.com',
      legalRepresentative: '张总',
      bankInfo: {
        bankName: 'Bank of China, Xiamen Branch',
        accountName: 'FUJIAN COSUN BUILDING MATERIALS CO., LTD.',
        accountNumber: '1234567890123456',
        swiftCode: 'BKCHCNBJ950',
        bankAddress: 'Xiamen, Fujian, China',
        currency: contract.currency || 'USD',
      },
    },
    buyer: {
      companyName: contract.customerCompany || '',
      address: contract.customerAddress || 'Customer Address',
      country: contract.customerCountry || 'Unknown',
      contactPerson: contract.customerName || '',
      tel: contract.contactPhone || 'N/A',
      email: contract.customerEmail || '',
    },
    products: (contract.products || []).map((item, index) => ({
      no: index + 1,
      modelNo: getFormalBusinessModelNo(item),
      imageUrl: item.imageUrl || '',
      description: item.productName || '',
      specification: item.specification || '',
      hsCode: item.hsCode || '',
      quantity: toSafeNumber(item.quantity),
      unit: item.unit || 'PCS',
      unitPrice: toSafeNumber(item.unitPrice),
      currency: item.currency || contract.currency || 'USD',
      amount: toSafeNumber(item.amount) || (toSafeNumber(item.quantity) * toSafeNumber(item.unitPrice)),
      deliveryTime: item.deliveryTime || '',
    })),
    terms: {
      totalAmount,
      currency: contract.currency || 'USD',
      tradeTerms: contract.tradeTerms || 'FOB Xiamen',
      paymentTerms: contract.paymentTerms || '30% T/T deposit, 70% before shipment',
      depositAmount: toSafeNumber(contract.depositAmount),
      balanceAmount: toSafeNumber(contract.balanceAmount),
      deliveryTime: contract.deliveryTime || '25-30 days after deposit received',
      portOfLoading: contract.portOfLoading || 'Xiamen, China',
      portOfDestination: contract.portOfDestination || '',
      packing: contract.packing || 'Export standard carton',
      inspection: 'Seller inspection before shipment; buyer may reinspect upon arrival',
      warranty: '12 months from shipment for manufacturing defects',
    },
    signature: {
      sellerSignatory: contract.salesPersonName || 'Sales Manager',
      buyerSignatory: contract.customerName || contract.customerCompany || '',
      signDate: contract.createdAt?.split('T')[0],
    },
    remarks: contract.remarks || '',
  };
}

/**
 * 从客户名称或国家推断区域
 */
function detectRegionFromCustomer(customerName: string, customerCountry?: string): 'NA' | 'SA' | 'EU' {
  const name = customerName.toLowerCase();
  const country = (customerCountry || '').toLowerCase();
  
  // 北美
  if (name.includes('usa') || name.includes('canada') || name.includes('america') ||
      country.includes('usa') || country.includes('canada') || country.includes('united states')) {
    return 'NA';
  }
  
  // 南美
  if (name.includes('brazil') || name.includes('argentina') || name.includes('chile') ||
      country.includes('brazil') || country.includes('argentina') || country.includes('chile')) {
    return 'SA';
  }
  
  // 欧洲
  if (name.includes('gmbh') || name.includes('sarl') || name.includes('ltd') ||
      country.includes('germany') || country.includes('france') || country.includes('uk')) {
    return 'EU';
  }
  
  // 默认北美
  return 'NA';
}

/**
 * 根据区域推断国家
 */
function detectCountryFromRegion(region: 'NA' | 'SA' | 'EU'): string {
  switch (region) {
    case 'NA': return 'United States';
    case 'SA': return 'Brazil';
    case 'EU': return 'Germany';
    default: return 'To be confirmed';
  }
}

/**
 * 根据区域确定价格术语
 */
function determinePriceTerm(region: 'NA' | 'SA' | 'EU'): string {
  switch (region) {
    case 'NA': return 'FOB Xiamen';
    case 'SA': return 'CIF Santos';
    case 'EU': return 'CIF Hamburg';
    default: return 'FOB Xiamen';
  }
}

/**
 * 根据区域确定目的港
 */
function determineDestinationPort(region: 'NA' | 'SA' | 'EU'): string {
  switch (region) {
    case 'NA': return 'Los Angeles, USA';
    case 'SA': return 'Santos, Brazil';
    case 'EU': return 'Hamburg, Germany';
    default: return 'To be confirmed';
  }
}

/**
 * 计算交货天数
 */
function calculateDeliveryDays(orderDate: string, expectedDelivery: string): number {
  const start = new Date(orderDate);
  const end = new Date(expectedDelivery);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * 🔥 报价数据 → 形式发票数据适配器（如需要可添加）
 */
export function adaptQuotationToProformaInvoice(quotationData: any): any {
  // TODO: 实现报价单到形式发票的转换
  return quotationData;
}

/**
 * 🔥 发货数据 → 商业发票数据适配器（如需要可添加）
 */
export function adaptShipmentToCommercialInvoice(shipmentData: any): any {
  // TODO: 实现发货数据到商业发票的转换
  return shipmentData;
}
