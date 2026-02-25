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

const toSafeNumber = (value: unknown): number => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/,/g, '').trim());
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
};

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
      modelNo: product.modelNo,
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
