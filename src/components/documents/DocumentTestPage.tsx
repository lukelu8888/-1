import React, { useState } from 'react';
import { DraggableDocNav, DocType } from './DraggableDocNav'; // 🔥 导入可拖拽导航栏
import { StatementOfAccountDocument } from './templates/StatementOfAccountDocument';
import { CommercialInvoiceDocument } from './templates/CommercialInvoiceDocument';
import { PackingListDocument } from './templates/PackingListDocument';
import { ProformaInvoiceDocument } from './templates/ProformaInvoiceDocument';
import { XJDocument } from './templates/XJDocument'; // 🔥 采购询价单
import { SupplierQuotationDocument } from './templates/SupplierQuotationDocument'; // 🔥 供应商报价单
import { PurchaseRequirementDocument } from './templates/PurchaseRequirementDocument'; // 🔥 采购需求单
import { CustomerInquiryDocument } from './templates/CustomerInquiryDocument';
import { QuotationDocument } from './templates/QuotationDocument';
import { PurchaseOrderDocument } from './templates/PurchaseOrderDocument';
import { SalesContractViewerPage } from './SalesContractViewerPage'; // 🔥 新页面级 Viewer
import type { CustomerInquiryData } from './templates/CustomerInquiryDocument';
import type { QuotationData } from './templates/QuotationDocument';
import type { SalesContractData } from './templates/SalesContractDocument';
import type { PurchaseOrderData } from './templates/PurchaseOrderDocument';
import type { StatementOfAccountData } from './templates/StatementOfAccountDocument';
import type { CommercialInvoiceData } from './templates/CommercialInvoiceDocument';
import type { PackingListData } from './templates/PackingListDocument';
import type { ProformaInvoiceData } from './templates/ProformaInvoiceDocument';
import type { XJData } from './templates/XJDocument'; // 🔥 采购询价单类型
import type { SupplierQuotationData } from './templates/SupplierQuotationDocument'; // 🔥 供应商报价单类型
import type { PurchaseRequirementDocumentData } from './templates/PurchaseRequirementDocument'; // 🔥 采购需求单类型

/**
 * 📄 文档测试页面
 * 
 * 用途：
 * 1. 测试各种文档模板的显示效果
 * 2. 查看数据调用逻辑
 * 3. 验证A4打印效果
 */

export function DocumentTestPage() {
  const [activeDoc, setActiveDoc] = useState<'inquiry' | 'quotation' | 'sc' | 'po' | 'xj' | 'supplier-quotation' | 'soa' | 'ci' | 'pl' | 'pi' | 'pr' | null>('sc');

  // 示例数据：客户询价单
  const sampleInquiryData: CustomerInquiryData = {
    inquiryNo: 'INQ-NA-20251210-001',
    inquiryDate: '2025-12-10',
    region: 'NA',
    customer: {
      companyName: 'ABC Trading Corporation',
      contactPerson: 'John Smith',
      position: 'Purchasing Manager',
      email: 'john.smith@abctrading.com',
      phone: '+1-323-555-0123',
      address: '123 Main Street, Suite 500, Los Angeles, CA 90001',
      country: 'United States'
    },
    products: [
      {
        no: 1,
        productName: 'GFCI Outlet',
        specification: '20A, 125V, Tamper-Resistant, Weather-Resistant, UL Listed',
        quantity: 5000,
        unit: 'pcs',
        targetPrice: 2.50,
        currency: 'USD',
        description: 'White color with LED indicator, standard duplex size'
      },
      {
        no: 2,
        productName: 'Weather-Resistant Cover',
        specification: 'IP66 rated, for single gang outlet, clear polycarbonate',
        quantity: 2000,
        unit: 'pcs',
        targetPrice: 1.45,
        currency: 'USD'
      },
      {
        no: 3,
        productName: 'Decora Wall Plate',
        specification: 'Standard size, screwless design, UV resistant',
        quantity: 3000,
        unit: 'pcs',
        targetPrice: 0.85,
        currency: 'USD',
        description: 'Colors: white, ivory, light almond (1000pcs each)'
      }
    ],
    requirements: {
      deliveryTime: 'Before March 15, 2026',
      portOfDestination: 'Los Angeles, USA',
      paymentTerms: 'T/T or L/C at sight',
      tradeTerms: 'FOB Xiamen or CIF Los Angeles (please quote both)',
      packingRequirements: 'Export carton with wooden pallets, shrink-wrapped for ocean freight',
      certifications: ['UL', 'FCC', 'CE', 'RoHS'],
      otherRequirements: 'Product manual and installation guide required in English. Individual retail packaging preferred.'
    },
    remarks: 'This is our first order with your company. We are a well-established distributor in the Los Angeles area with 15 years of experience. Quality and on-time delivery are critical to our business. We are looking for a long-term supplier and expect to place regular orders if this trial order is successful. Please provide your best pricing and confirm your production capacity.'
  };

  // 示例数据：业务员报价单
  const sampleQuotationData: QuotationData = {
    quotationNo: 'QT-NA-20251210-001',
    quotationDate: '2025-12-10',
    validUntil: '2026-01-10',
    inquiryNo: 'INQ-NA-20251210-001',
    region: 'NA',
    company: {
      name: '福建高盛达富建材有限公司',
      nameEn: 'FUJIAN GAOSHENGDAFU BUILDING MATERIALS CO., LTD.',
      address: '福建省厦门市XX区XX路XX号',
      addressEn: 'XX Road, XX District, Xiamen, Fujian, China 361000',
      tel: '+86-592-1234-5678',
      fax: '+86-592-1234-5679',
      email: 'sales@gaoshengdafu.com',
      website: 'www.gaoshengdafu.com'
    },
    customer: {
      companyName: 'ABC Trading Corporation',
      contactPerson: 'John Smith',
      address: '123 Main Street, Suite 500, Los Angeles, CA 90001, USA',
      email: 'john.smith@abctrading.com',
      phone: '+1-323-555-0123'
    },
    products: [
      {
        no: 1,
        productName: 'GFCI Outlet',
        specification: '20A, 125V, Tamper-Resistant, Weather-Resistant, UL Listed, White with LED',
        hsCode: '8536.6990',
        quantity: 5000,
        unit: 'pcs',
        unitPrice: 2.85,
        currency: 'USD',
        amount: 14250.00,
        moq: 3000,
        leadTime: '25-30 days'
      },
      {
        no: 2,
        productName: 'Weather-Resistant Cover',
        specification: 'IP66, Single Gang, Clear Polycarbonate',
        hsCode: '3926.9090',
        quantity: 2000,
        unit: 'pcs',
        unitPrice: 1.65,
        currency: 'USD',
        amount: 3300.00,
        moq: 1000,
        leadTime: '20-25 days'
      },
      {
        no: 3,
        productName: 'Decora Wall Plate',
        specification: 'Screwless Design, UV Resistant, Multi-color',
        hsCode: '3926.9090',
        quantity: 3000,
        unit: 'pcs',
        unitPrice: 0.95,
        currency: 'USD',
        amount: 2850.00,
        moq: 2000,
        leadTime: '20-25 days'
      }
    ],
    tradeTerms: {
      incoterms: 'FOB Xiamen, China',
      paymentTerms: '30% T/T deposit upon order confirmation, 70% T/T before shipment',
      deliveryTime: '25-30 days after receiving deposit',
      packing: 'Export standard carton with wooden pallets, shrink-wrapped',
      portOfLoading: 'Xiamen Port, China',
      portOfDestination: 'Los Angeles Port, USA',
      warranty: '12 months from delivery date against manufacturing defects',
      inspection: "Seller's factory inspection before shipment, buyer has the right to re-inspect upon arrival"
    },
    remarks: 'Above prices are based on current raw material costs and are valid for 30 days. CIF Los Angeles price available upon request. All products come with English manual and installation guide. Free samples available for quality testing.',
    salesPerson: {
      name: 'Zhang Wei',
      position: 'Senior Sales Manager',
      email: 'zhangwei@gaoshengdafu.com',
      phone: '+86-139-5923-4567',
      whatsapp: '+86-139-5923-4567'
    }
  };

  // 示例数据：销售合同
  const sampleSCData: SalesContractData = {
    contractNo: 'SC-NA-20251220-001',
    contractDate: '2025-12-20',
    region: 'NA',
    seller: {
      name: '福建高盛达富建材有限公司',
      nameEn: 'FUJIAN GAOSHENGDAFU BUILDING MATERIALS CO., LTD.',
      address: '福建省厦门市XX区XX路XX号',
      addressEn: 'XX Road, XX District, Xiamen, Fujian, China 361000',
      tel: '+86-592-1234-5678',
      fax: '+86-592-1234-5679',
      email: 'sales@gaoshengdafu.com',
      legalRepresentative: 'Wang Ming',
      businessLicense: '91350200MA2XXX123X'
    },
    buyer: {
      companyName: 'ABC Trading Corporation',
      contactPerson: 'John Smith',
      address: '123 Main Street, Suite 500, Los Angeles, CA 90001, USA',
      country: 'United States',
      email: 'john.smith@abctrading.com',
      tel: '+1-323-555-0123'
    },
    products: [
      {
        no: 1,
        description: 'GFCI Outlet - 20A, 125V, Tamper-Resistant, Weather-Resistant, UL Listed, White with LED',
        specification: '20A, 125V, Tamper-Resistant, Weather-Resistant, UL Listed, White with LED',
        hsCode: '8536.6990',
        quantity: 5000,
        unit: 'pcs',
        unitPrice: 2.85,
        currency: 'USD',
        amount: 14250.00,
        deliveryTime: '25-30 days'
      },
      {
        no: 2,
        description: 'Weather-Resistant Cover - IP66, Single Gang, Clear Polycarbonate',
        specification: 'IP66, Single Gang, Clear Polycarbonate',
        hsCode: '3926.9090',
        quantity: 2000,
        unit: 'pcs',
        unitPrice: 1.65,
        currency: 'USD',
        amount: 3300.00,
        deliveryTime: '20-25 days'
      },
      {
        no: 3,
        description: 'Decora Wall Plate - Screwless Design, UV Resistant, Multi-color',
        specification: 'Screwless Design, UV Resistant, Multi-color',
        hsCode: '3926.9090',
        quantity: 3000,
        unit: 'pcs',
        unitPrice: 0.95,
        currency: 'USD',
        amount: 2850.00,
        deliveryTime: '20-25 days'
      },
      {
        no: 4,
        description: 'USB Wall Outlet - Dual USB Ports, 4.2A Total Output, Smart Charging Technology',
        specification: 'Dual USB-A ports, 4.2A combined, tamper-resistant receptacles, UL certified',
        hsCode: '8536.6990',
        quantity: 3500,
        unit: 'pcs',
        unitPrice: 3.95,
        currency: 'USD',
        amount: 13825.00,
        deliveryTime: '30-35 days'
      },
      {
        no: 5,
        description: 'Smart WiFi Outlet - Voice Control Compatible, Energy Monitoring, Surge Protection',
        specification: 'WiFi enabled, compatible with Alexa/Google Home, 15A, grounded outlets',
        hsCode: '8536.6990',
        quantity: 2000,
        unit: 'pcs',
        unitPrice: 12.50,
        currency: 'USD',
        amount: 25000.00,
        deliveryTime: '35-40 days'
      },
      {
        no: 6,
        description: 'Heavy Duty Industrial Outlet - 20A, 250V, NEMA 6-20R Configuration',
        specification: '20A/250V rating, commercial grade, steel construction, weatherproof',
        hsCode: '8536.6990',
        quantity: 1500,
        unit: 'pcs',
        unitPrice: 8.75,
        currency: 'USD',
        amount: 13125.00,
        deliveryTime: '25-30 days'
      },
      {
        no: 7,
        description: 'LED Night Light Outlet - Automatic Dusk-to-Dawn Sensor, Energy Efficient',
        specification: 'Built-in LED night light, photocell sensor, 0.3W LED, white finish',
        hsCode: '8536.6990',
        quantity: 4000,
        unit: 'pcs',
        unitPrice: 2.35,
        currency: 'USD',
        amount: 9400.00,
        deliveryTime: '20-25 days'
      },
      {
        no: 8,
        description: 'Outdoor Weatherproof Outlet Box - IP65 Rated, Die-Cast Aluminum Housing',
        specification: 'Die-cast aluminum, IP65 waterproof rating, gray powder coat finish',
        hsCode: '7616.9990',
        quantity: 2500,
        unit: 'pcs',
        unitPrice: 5.85,
        currency: 'USD',
        amount: 14625.00,
        deliveryTime: '30-35 days'
      },
      {
        no: 9,
        description: 'Floor Power Outlet - Pop-Up Design, Brass Construction, Multiple Configuration Options',
        specification: 'Pop-up floor box, brass body, includes 2 power outlets, brushed nickel finish',
        hsCode: '8536.6990',
        quantity: 800,
        unit: 'pcs',
        unitPrice: 28.50,
        currency: 'USD',
        amount: 22800.00,
        deliveryTime: '40-45 days'
      },
      {
        no: 10,
        description: 'Recessed TV Power Outlet Kit - Low Voltage, HDMI Pass-Through, Cable Management',
        specification: 'Recessed box with power outlet, HDMI, coax, Cat6 ports, white paintable',
        hsCode: '8536.6990',
        quantity: 1200,
        unit: 'pcs',
        unitPrice: 15.75,
        currency: 'USD',
        amount: 18900.00,
        deliveryTime: '35-40 days'
      },
      {
        no: 11,
        description: 'Commercial Grade Power Strip - 6 Outlets, 15ft Heavy Duty Cord, Circuit Breaker',
        specification: '6 grounded outlets, 15ft 14AWG cord, 15A circuit breaker, metal housing',
        hsCode: '8536.6990',
        quantity: 2000,
        unit: 'pcs',
        unitPrice: 9.85,
        currency: 'USD',
        amount: 19700.00,
        deliveryTime: '25-30 days'
      },
      {
        no: 12,
        description: 'Surge Protector Power Strip - 8 Outlets, 2 USB Ports, 3600J Protection',
        specification: '8 outlets + 2 USB, 3600 joules protection, EMI/RFI filtering, 6ft cord',
        hsCode: '8536.6990',
        quantity: 3000,
        unit: 'pcs',
        unitPrice: 11.95,
        currency: 'USD',
        amount: 35850.00,
        deliveryTime: '30-35 days'
      }
    ],
    terms: {
      totalAmount: 193625.00,
      currency: 'USD',
      tradeTerms: 'FOB Xiamen, China',
      paymentTerms: '30% T/T deposit upon order confirmation, 70% T/T before shipment',
      depositAmount: 58087.50,
      balanceAmount: 135537.50,
      deliveryTime: '35-45 days after receiving deposit',
      portOfLoading: 'Xiamen Port, China',
      portOfDestination: 'Los Angeles Port, USA',
      packing: 'Export standard carton with wooden pallets, shrink-wrapped, suitable for ocean freight',
      inspection: 'Buyer\'s inspection or third-party inspection (SGS, Bureau Veritas, or equivalent) allowed before shipment. Inspection cost borne by buyer unless defects exceed 2% of quantity.',
      warranty: '12 months warranty for manufacturing defects from delivery date. Warranty covers material and workmanship defects but excludes damages from misuse, improper installation, or normal wear and tear.'
    },
    liabilityTerms: {
      sellerDefault: 'If seller fails to deliver on time without valid reason or force majeure, buyer has the right to cancel the order and claim full deposit refund plus 5% compensation. If seller delivers defective goods exceeding 2% defect rate, buyer may reject the shipment and demand replacement at seller\'s cost.',
      buyerDefault: 'If buyer fails to pay the balance payment within the agreed time without valid reason, deposit will be forfeited as liquidated damages. If buyer refuses delivery without valid reason after goods are ready and payment is received, buyer shall bear all storage, demurrage, and additional costs incurred.',
      forceMajeure: 'Neither party shall be liable for delays or failures in performance caused by force majeure events including but not limited to natural disasters, wars, riots, epidemics, government actions, strikes, or other circumstances beyond reasonable control. The affected party must promptly notify the other party in writing and provide official supporting documentation within 15 days. Contract performance shall be suspended during force majeure period, and both parties shall negotiate extension or termination in good faith.'
    },
    disputeResolution: {
      governingLaw: 'This contract shall be governed by and construed in accordance with the laws of the People\'s Republic of China, excluding its conflict of law provisions.',
      arbitration: 'Any disputes arising from or in connection with this contract shall be resolved through friendly negotiation between both parties. If negotiation fails within 30 days, either party may submit the dispute to China International Economic and Trade Arbitration Commission (CIETAC) for arbitration in Xiamen, China. The arbitration shall be conducted in English and Chinese, and the arbitral award shall be final and binding upon both parties. The prevailing party shall be entitled to recover reasonable attorney fees and costs.'
    },
    signature: {
      sellerSignatory: 'Wang Ming (Legal Representative)',
      buyerSignatory: 'John Smith (Purchasing Manager)',
      signDate: '2025-12-20'
    }
  };

  // 示例数据：采购订单
  const samplePOData: PurchaseOrderData = {
    poNo: 'PO-20251220-001',
    poDate: '2025-12-20',
    requiredDeliveryDate: '2026-01-25',
    buyer: {
      name: '福建高盛达富建材有限公司',
      nameEn: 'FUJIAN GAOSHENGDAFU BUILDING MATERIALS CO., LTD.',
      address: '福建省厦门市XX区XX路XX号',
      addressEn: 'XX Road, XX District, Xiamen, Fujian, China 361000',
      tel: '+86-592-1234-5678',
      email: 'procurement@gaoshengdafu.com',
      contactPerson: 'Li Ming (Procurement Manager)'
    },
    supplier: {
      companyName: 'Shenzhen Electronics Manufacturing Co., Ltd.',
      address: 'No.88 Industrial Road, Baoan District, Shenzhen, Guangdong, China',
      contactPerson: 'Chen Wei',
      tel: '+86-755-8888-9999',
      email: 'sales@szelec.com',
      supplierCode: 'SUP-GD-001',
      // 供应商银行收款信息
      bankInfo: {
        bankName: '中国工商银行深圳宝安支行',
        accountName: 'Shenzhen Electronics Manufacturing Co., Ltd.',
        accountNumber: '4000 0212 0920 1234 567',
        swiftCode: 'ICBKCNBJSZN',
        bankAddress: 'No.123 Baoan Avenue, Baoan District, Shenzhen, Guangdong, China',
        currency: 'CNY/USD'
      }
    },
    products: [
      {
        no: 1,
        itemCode: 'ITEM-GFCI-001',
        description: 'GFCI Outlet Components - Main Housing',
        specification: '20A, 125V rated, Fire-resistant PC plastic, UL94 V-0',
        quantity: 5000,
        unit: 'pcs',
        unitPrice: 1.85,
        currency: 'USD',
        amount: 9250.00,
        deliveryDate: '2026-01-20',
        remarks: 'White color, with mounting holes'
      },
      {
        no: 2,
        itemCode: 'ITEM-GFCI-002',
        description: 'GFCI Circuit Board Assembly',
        specification: 'PCB with IC chip, LED indicator, certified components',
        quantity: 5000,
        unit: 'pcs',
        unitPrice: 0.95,
        currency: 'USD',
        amount: 4750.00,
        deliveryDate: '2026-01-20'
      },
      {
        no: 3,
        itemCode: 'ITEM-WRC-001',
        description: 'Weather-Resistant Cover Raw Material',
        specification: 'Clear Polycarbonate sheets, IP66 grade, UV stabilized',
        quantity: 100,
        unit: 'kg',
        unitPrice: 8.50,
        currency: 'USD',
        amount: 850.00,
        deliveryDate: '2026-01-15'
      }
    ],
    terms: {
      totalAmount: 14850.00,
      currency: 'USD',
      paymentTerms: '30 days after delivery and inspection',
      deliveryTerms: 'EXW Shenzhen Factory',
      deliveryAddress: 'Fujian Gaoshengdafu Building Materials Co., Ltd., XX Road, XX District, Xiamen, Fujian, China 361000',
      qualityStandard: 'Meet UL, CE, RoHS standards. Samples must be approved before bulk production.',
      inspectionMethod: 'Third-party inspection (SGS or equivalent) or buyer inspection at supplier factory',
      // 扩展的专业采购条款
      packaging: '采用出口标准纸箱包装，每箱需标注采购单号、物料编码、数量、毛重净重。外包装需防潮、防震处理。',
      shippingMarks: '唛头需注明"COSUN"字样、订单编号PO-20251220-001、目的地厦门，并标注"小心轻放"、"防潮"标识。',
      deliveryPenalty: '供应商未能按约定时间交货的，每延误一天，应按延误交货部分货款的0.5%支付违约金，但违约金总额不超过延误交货部分货款的5%。',
      qualityPenalty: '产品质量不符合约定标准的，采购方有权拒收。如已收货发现质量问题，供应商应在7个工作日内无条件退换货，并承担由此产生的一切费用及损失。',
      warrantyPeriod: '12个月（自交货验收合格之日起计算）',
      warrantyTerms: '质保期内因产品质量问题造成的损失，供应商应负责免费维修或更换，并承担相关运费。质保期内因产品质量问题导致的批量退货，供应商需全额退款。',
      returnPolicy: '到货后7个工作日内完成验收，验收不合格的产品采购方有权退货。因产品质量问题产生的退货，供应商需承担往返运费及相关损失。',
      confidentiality: '双方对本合同内容及在合作过程中知悉的对方商业秘密、技术信息、客户信息等负有保密义务，未经对方书面同意不得向第三方披露。保密义务合同终止后继续有效，期限为3年。',
      ipRights: '供应商保证所供产品不侵犯任何第三方的知识产权。如因知识产权纠纷给采购方造成损失，供应商应承担全部赔偿责任。',
      forceMajeure: '因不可抗力（包括但不限于自然灾害、战争、政府行为、疫情等）导致合同无法履行的，受影响方应及时通知对方并提供相关证明，双方可协商延期履行或解除合同，但不承担违约责任。',
      disputeResolution: '因本合同引起的或与本合同有关的任何争议，双方应首先通过友好协商解决。协商不成的，任何一方均可向采购方所在地人民法院提起诉讼。',
      applicableLaw: '中华人民共和国法律（不含冲突法规则）',
      contractValidity: '本采购订单自双方签章之日起生效，至所有产品交付验收合格且付款完成后自动终止。',
      modification: '本合同的任何修改或补充必须经双方书面同意并签署补充协议，补充协议与本合同具有同等法律效力。口头承诺不产生法律约束力。',
      termination: '如一方严重违约且在收到守约方书面通知后15日内仍未纠正，守约方有权单方面解除合同并要求违约方承担违约责任及赔偿损失。'
    }
  };

  // 🔥 示例数据：采购询价单
  const sampleRFQData: XJData = {
    rfqNo: 'XJ-251218-1001',
    xjDate: '2025-12-18',
    requiredResponseDate: '2025-12-25',
    requiredDeliveryDate: '2026-01-15',
    
    buyer: {
      name: '福建高盛达富建材有限公司',
      nameEn: 'FUJIAN GOSUNDA FU BUILDING MATERIALS CO., LTD.',
      address: '福建省福州市仓山区金山工业区',
      addressEn: 'Jinshan Industrial Zone, Cangshan District, Fuzhou, Fujian, China',
      tel: '+86-591-8888-8888',
      email: 'purchasing@gosundafu.com',
      contactPerson: '张采购'
    },
    
    supplier: {
      companyName: '深圳市优质五金制品有限公司',
      address: '广东省深圳市宝安区西乡工业园',
      contactPerson: '李经理',
      tel: '+86-755-2888-8888',
      email: 'sales@supplier.com',
      supplierCode: 'SUP-ELEC-001'
    },
    
    products: [
      {
        no: 1,
        modelNo: 'WJ-2024-001',
        description: '不锈钢门锁',
        specification: '304不锈钢材质，带钥匙3把，表面拉丝处理',
        quantity: 1000,
        unit: '套',
        targetPrice: 'USD 12.50',
        remarks: '需配备安装说明书'
      },
      {
        no: 2,
        modelNo: 'WJ-2024-002',
        description: '铝合金门把手',
        specification: '6063铝合金，长度150mm，银色阳极氧化',
        quantity: 2000,
        unit: '个',
        targetPrice: 'USD 3.80'
      },
      {
        no: 3,
        modelNo: 'WJ-2024-003',
        description: '铜合金铰链',
        specification: '4寸静音铰链，承重80kg，镀铬处理',
        quantity: 3000,
        unit: '个',
        targetPrice: 'USD 2.20'
      }
    ],
    
    terms: {
      currency: 'USD',
      paymentTerms: 'T/T 30% 预付，70% 发货前付清',
      deliveryTerms: 'EXW 工厂交货',
      deliveryAddress: '福建省福州市仓山区金山工业区',
      
      qualityStandard: '产品需符合国家GB/T 27922-2011标准，如有国际标准（ISO 9001、CE认证）请提供相关认证证书',
      inspectionMethod: '到货后进行外观和功能检测，抽检率5%，不合格品按比例扣款或退换货处理',
      
      deliveryRequirement: '要求交货日期：2026-01-15，如无法按期交货需提前7天告知并说明原因',
      packaging: '标准出口包装，内层气泡膜，外层纸箱+木托盘，需防潮防震，适合长途运输和集装箱装运',
      shippingMarks: '中性唛头，不显示最终客户信息，或根据我司要求定制唛头（具体要求在订单确认后提供）',
      
      inspectionRequirement: '出货前需提供产品照片和装箱照片，如需第三方检验由我司指定检验机构（费用由供应商承担）',
      technicalDocuments: '需提供产品说明书（中英文）、材质检测报告、RoHS检测报告、CE认证证书（如有）',
      
      ipRights: '供应商确认所供产品不侵犯任何第三方知识产权，如因产品设计、商标、专利等引发纠纷，由供应商承担全部法律责任和经济损失',
      confidentiality: '双方对本次询价的价格信息、技术资料、客户信息、商业机密等保密，未经对方书面同意不得向第三方透露或用于其他用途',
      
      sampleRequirement: '首次合作需提供2-3个样品供我司质量确认，样品费用由我司承担（正式订单后可抵扣），往返快递费由我司承担',
      moq: '请在报价中注明最小起订量（MOQ）要求，如有阶梯价格请一并说明',
      remarks: '报价有效期请不少于30天，交货周期请明确标注（从收到订单和预付款开始计算）'
    }
  };

  // 🔥 示例数据：供应商报价单
  const sampleSupplierQuotationData: SupplierQuotationData = {
    quotationNo: 'BJ-20251218-001',
    quotationDate: '2025-12-18',
    validUntil: '2026-01-18',
    rfqReference: 'XJ-251218-1001',
    
    supplier: {
      companyName: '深圳市优质五金制品有限公司',
      companyNameEn: 'Shenzhen Quality Metal Products Co., Ltd.',
      address: '广东省深圳市宝安区西乡工业园88号',
      addressEn: 'No.88 Xixiang Industrial Park, Baoan District, Shenzhen, Guangdong, China',
      tel: '+86-755-2888-8888',
      email: 'sales@supplier.com',
      contactPerson: '李经理',
      supplierCode: 'SUP-ELEC-001',
      logo: '' // 可选：供应商Logo URL
    },
    
    buyer: {
      name: '福建高盛达富建材有限公司',
      nameEn: 'FUJIAN GOSUNDA FU BUILDING MATERIALS CO., LTD.',
      address: '福建省福州市仓山区金山工业区',
      addressEn: 'Jinshan Industrial Zone, Cangshan District, Fuzhou, Fujian, China',
      tel: '+86-591-8888-8888',
      email: 'purchasing@gosundafu.com',
      contactPerson: '张采购'
    },
    
    products: [
      {
        no: 1,
        modelNo: 'WJ-2024-001',
        description: '不锈钢门锁',
        specification: '304不锈钢材质，带钥匙3把，表面拉丝处理，含安装说明书',
        quantity: 1000,
        unit: '套',
        unitPrice: 12.50,
        currency: 'USD',
        remarks: '含安装配件'
      },
      {
        no: 2,
        modelNo: 'WJ-2024-002',
        description: '铝合金门把手',
        specification: '6063铝合金，长度150mm，银色阳极氧化处理',
        quantity: 2000,
        unit: '个',
        unitPrice: 3.80,
        currency: 'USD'
      },
      {
        no: 3,
        modelNo: 'WJ-2024-003',
        description: '铜合金铰链',
        specification: '4寸静音铰链，承重80kg，镀铬处理',
        quantity: 3000,
        unit: '个',
        unitPrice: 2.20,
        currency: 'USD'
      }
    ],
    
    terms: {
      paymentTerms: 'T/T 30% 预付，70% 发货前付清',
      deliveryTerms: 'EXW 深圳工厂',
      deliveryTime: '收到预付款后15-20天',
      deliveryAddress: '福建省福州市仓山区金山工业区',
      moq: '不锈钢门锁：500套，铝合金门把手：1000个，铜合金铰链：1500个',
      qualityStandard: '符合国家GB/T 27922-2011标准，提供ISO 9001认证',
      warranty: '12个月质保，自交货日期起计算',
      packaging: '标准出口包装，内层气泡膜，外层纸箱+木托盘',
      shippingMarks: '中性唛头或按客户要求定制',
      remarks: '报价有效期30天。大批量订单可协商价格。样品费100元/个，下单后可抵扣。'
    },
    
    // 🔥 供应商备注示例
    supplierRemarks: {
      content: `特别说明：

1. 本次报价基于当前原材料价格，如原材料价格波动超过10%，我司保留价格调整权利。

2. 首次合作客户，建议先下小批量试单验证产品质量，满意后再批量采购。

3. 我司已通过ISO 9001质量管理体系认证，所有产品出厂前均经过严格的质量检验，不良率控制在0.5%以内。

4. 付款方式可协商，老客户可申请月结账期（需提供公司资质审核）。

5. 如需样品测试，可提供2-3个免费样品，快递费到付。正式下单后样品费可抵扣货款。`,
      remarkDate: '2025-12-20',
      remarkBy: '李经理'
    }
  };

  // 🔥 示例数据：采购需求单
  const samplePRData: PurchaseRequirementDocumentData = {
    requirementNo: 'QR-NA-251220-0001',
    requirementDate: '2025-12-20',
    sourceInquiryNo: 'INQ-NA-251220-0001',
    requiredResponseDate: '2025-12-25',
    requiredDeliveryDate: '2026-01-15',
    
    customer: {
      companyName: 'ABC Trading Corporation',
      contactPerson: 'John Smith',
      email: 'john.smith@abctrading.com',
      phone: '+1-323-555-0123',
      address: '123 Main Street, Suite 500, Los Angeles, CA 90001, USA',
      region: 'North America'
    },
    
    products: [
      {
        no: 1,
        modelNo: 'GFCI-001',
        productName: 'GFCI Outlet',
        specification: '20A, 125V, Tamper-Resistant, Weather-Resistant, UL Listed',
        quantity: 5000,
        unit: 'PCS',
        unitPrice: 2.50,
        remarks: '白色，带LED指示灯'
      },
      {
        no: 2,
        modelNo: 'WRC-001',
        productName: 'Weather-Resistant Cover',
        specification: 'IP66 rated, for single gang outlet, clear polycarbonate',
        quantity: 2000,
        unit: 'PCS',
        unitPrice: 1.45
      },
      {
        no: 3,
        modelNo: 'DWP-001',
        productName: 'Decora Wall Plate',
        specification: 'Standard size, screwless design, UV resistant',
        quantity: 3000,
        unit: 'PCS',
        unitPrice: 0.85,
        remarks: '颜色：白色、象牙色、浅杏色（各1000个）'
      }
    ],
    
    customerRequirements: {
      deliveryTerms: 'FOB Xiamen 或 CIF Los Angeles（请两种都报价）',
      paymentTerms: 'T/T 或 L/C 即期',
      qualityStandard: 'UL, FCC, CE, RoHS认证',
      packaging: '出口纸箱+木托盘，合海运',
      specialRequirements: '需要英文产品说明书和安装指南。优先考虑独立零售包装。'
    },
    
    salesDeptNotes: '这是该客户的首次订单，客户为洛杉矶地区15年经验的分销商。产品质量和准时交货对业务至关重要。客户期待建立长期合作关系，若试订单成功将定期下单。请提供最优价格并确认生产能力。',
    
    purchaseDeptFeedback: '已向3家供应商发送采购询价完成，反馈如下：\n\n供应商A（深圳）：GFCI-001单价USD 1.85，交期25天，MOQ 3000pcs\n供应商B（东莞）：GFCI-001单价USD 1.92，交期20天，MOQ 2000pcs\n供应商C（中山）：GFCI-001单价USD 1.78，交期30天，MOQ 5000pcs\n\n建议选择供应商C，价格最优且MOQ符合订单数量，可接受30天交期。',
    
    urgency: 'high',
    createdBy: 'zhangwei@gaoshengdafu.com'
  };

  // 示例数据：账户对账单
  const sampleSOAData: StatementOfAccountData = {
    statementNo: 'SOA-202512-001',
    statementDate: '2025-12-31',
    periodStart: '2025-12-01',
    periodEnd: '2025-12-31',
    company: {
      name: '福建高盛达富建材有限公司',
      nameEn: 'FUJIAN GAOSHENGDAFU BUILDING MATERIALS CO., LTD.',
      address: '福建省厦门市XX区XX路XX号',
      addressEn: 'XX Road, XX District, Xiamen, Fujian, China 361000',
      tel: '+86-592-1234-5678',
      email: 'finance@gaoshengdafu.com',
      accountName: 'FUJIAN GAOSHENGDAFU BUILDING MATERIALS CO., LTD.',
      bankName: 'Bank of China, Xiamen Branch',
      accountNumber: '1234567890123456',
      swiftCode: 'BKCHCNBJ950'
    },
    customer: {
      customerCode: 'CUST-NA-001',
      companyName: 'ABC Trading Corporation',
      address: '123 Main Street, Suite 500, Los Angeles, CA 90001, USA',
      contactPerson: 'John Smith',
      email: 'john.smith@abctrading.com',
      tel: '+1-323-555-0123'
    },
    openingBalance: {
      amount: 0.00,
      currency: 'USD',
      type: 'debit'
    },
    transactions: [
      {
        date: '2025-12-01',
        type: 'invoice',
        referenceNo: 'INV-20251201-001',
        description: 'Sales Invoice - Order #12345',
        debit: 15800.00,
        balance: 15800.00,
        currency: 'USD'
      },
      {
        date: '2025-12-05',
        type: 'payment',
        referenceNo: 'PMT-20251205-001',
        description: 'T/T Payment Received',
        credit: 8000.00,
        balance: 7800.00,
        currency: 'USD'
      },
      {
        date: '2025-12-15',
        type: 'invoice',
        referenceNo: 'INV-20251215-002',
        description: 'Sales Invoice - Order #12346',
        debit: 20400.00,
        balance: 28200.00,
        currency: 'USD'
      },
      {
        date: '2025-12-18',
        type: 'payment',
        referenceNo: 'PMT-20251218-002',
        description: 'T/T Payment Received',
        credit: 7800.00,
        balance: 20400.00,
        currency: 'USD'
      },
      {
        date: '2025-12-20',
        type: 'invoice',
        referenceNo: 'INV-20251220-003',
        description: 'Sales Invoice - Order #12347',
        debit: 12600.00,
        balance: 33000.00,
        currency: 'USD'
      },
      {
        date: '2025-12-28',
        type: 'payment',
        referenceNo: 'PMT-20251228-003',
        description: 'T/T Payment Received (Partial)',
        credit: 10000.00,
        balance: 23000.00,
        currency: 'USD'
      }
    ],
    closingBalance: {
      amount: 23000.00,
      currency: 'USD',
      type: 'debit'
    },
    agingAnalysis: {
      current: 12600.00,      // 0-30天（最新一张发票）
      days30: 10400.00,       // 31-60天
      days60: 0.00,           // 61-90天
      days90Plus: 0.00        // 90天以上
    },
    remarks: 'Payment terms: 30% deposit, 70% before shipment. Please settle outstanding balance within 30 days. For any queries, please contact our finance department.'
  };

  // 示例数据：商业发票
  const sampleCIData: CommercialInvoiceData = {
    invoiceNo: 'CI-20260215-001',
    invoiceDate: '2026-02-15',
    contractNo: 'SC-NA-20251220-001',
    exporter: {
      name: '福建高盛达富建材有限公司',
      nameEn: 'FUJIAN GAOSHENGDAFU BUILDING MATERIALS CO., LTD.',
      address: '福建省厦门市XX区XX路XX号',
      addressEn: 'XX Road, XX District, Xiamen, Fujian, China 361000',
      tel: '+86-592-1234-5678'
    },
    importer: {
      name: 'ABC TRADING CORPORATION',
      address: '123 Main Street, Suite 500, Los Angeles, CA 90001',
      country: 'United States of America',
      tel: '+1-323-555-0123'
    },
    shippingMarks: {
      mainMark: 'ABC-LA-001',
      sideMark: 'C/NO. 1-50',
      cautionMark: 'MADE IN CHINA\nFRAGILE - HANDLE WITH CARE'
    },
    goods: [
      {
        no: 1,
        description: 'GFCI Outlet, 20A 125V, Tamper-Resistant, Weather-Resistant, UL Listed',
        hsCode: '8536.6990',
        quantity: 5000,
        unit: 'PCS',
        unitPrice: 2.85,
        currency: 'USD',
        amount: 14250.00,
        grossWeight: 0.25,
        netWeight: 0.22
      },
      {
        no: 2,
        description: 'Weather-Resistant Cover, IP66, Single Gang, Clear Polycarbonate',
        hsCode: '3926.9090',
        quantity: 2000,
        unit: 'PCS',
        unitPrice: 1.65,
        currency: 'USD',
        amount: 3300.00,
        grossWeight: 0.15,
        netWeight: 0.12
      }
    ],
    shipping: {
      tradeTerms: 'FOB XIAMEN',
      paymentTerms: 'T/T',
      portOfLoading: 'Xiamen Port, China',
      portOfDischarge: 'Los Angeles Port, USA',
      finalDestination: 'Los Angeles, California, USA',
      vesselName: 'COSCO PACIFIC',
      blNo: 'COSU1234567890'
    },
    packing: {
      totalCartons: 50,
      totalGrossWeight: 1550,
      totalNetWeight: 1350,
      totalMeasurement: 3.75
    }
  };

  // 示例数据：包装清单
  const samplePLData: PackingListData = {
    plNo: 'PL-20260215-001',
    invoiceNo: 'CI-20260215-001',
    date: '2026-02-15',
    exporter: {
      name: 'FUJIAN GAOSHENGDAFU BUILDING MATERIALS CO., LTD.',
      address: 'XX Road, XX District, Xiamen, Fujian, China 361000'
    },
    importer: {
      name: 'ABC TRADING CORPORATION',
      address: '123 Main Street, Suite 500, Los Angeles, CA 90001, USA'
    },
    shippingMarks: 'ABC-LA-001\nC/NO. 1-50\nMADE IN CHINA\nFRAGILE - HANDLE WITH CARE',
    packages: [
      {
        cartonNo: '1-25',
        description: 'GFCI Outlet, 20A 125V, TR/WR, UL Listed',
        qtyPerCarton: 200,
        totalCartons: 25,
        totalQty: 5000,
        unit: 'PCS',
        netWeight: 22,
        grossWeight: 25,
        measurement: 0.06,
        totalNW: 550,
        totalGW: 625,
        totalCBM: 1.5
      },
      {
        cartonNo: '26-50',
        description: 'Weather-Resistant Cover, IP66, Clear PC',
        qtyPerCarton: 80,
        totalCartons: 25,
        totalQty: 2000,
        unit: 'PCS',
        netWeight: 12,
        grossWeight: 14,
        measurement: 0.05,
        totalNW: 300,
        totalGW: 350,
        totalCBM: 1.25
      }
    ],
    shipping: {
      portOfLoading: 'Xiamen Port, China',
      portOfDischarge: 'Los Angeles Port, USA',
      vesselName: 'COSCO PACIFIC',
      blNo: 'COSU1234567890'
    }
  };

  // 示例数据：形式发票
  const samplePIData: ProformaInvoiceData = {
    invoiceNo: 'B125051209',
    costNo: 'KH13100001',
    scNo: '',
    invoiceDate: 'May 12, 2025',
    seller: {
      name: '福建COSUN TUFF建材有限公司',
      nameEn: 'FUJIAN COSUN TUFF BUILDING MATERIALS CO., LTD',
      unit: 'Unit1807',
      building: 'C1# Building',
      zone: 'Zone C',
      plaza: 'Wanda Plaza',
      district: 'Cangshan Dist',
      city: 'Fuzhou',
      province: 'Fujian',
      country: 'China',
      cell: '+86 13799993309',
      email: 'luis@cosunchina.com'
    },
    buyer: {
      companyName: 'Aluminium & Light Industries Co. (ALICO) Ltd',
      poBox: 'Box 6011 Sharjah UAE',
      contactPerson: 'Mohan MV +971655824441(90)'
    },
    products: [
      {
        seqNo: 1,
        itemNo: '1605909',
        description: '5101# Block Materials- ABS',
        specification: 'Color: in white',
        quantity: 10000,
        unit: 'pc',
        unitPrice: 0.245,
        currency: 'US$',
        extendedValue: 2450.00
      }
    ],
    freight: {
      type: 'Air Freight',
      terms: 'collected by the buyer'
    },
    totalValue: 2450.00,
    totalCurrency: 'US$',
    priceTerms: 'EX.W (XIAMEN)',
    bankInfo: {
      beneficiary: 'Fujian Cosun Tuff Building Materials Company Limited',
      beneficiaryAddress: 'Unit 1807, C1# building, Zone C, Wanda Plaza, Cangshan Dist., Fuzhou City, Fujian Province, China',
      accountNo: '4208583481447',
      bank: 'Bank of China Fujian Branch',
      bankAddress: 'No.136, West Rd. Gulou Dist., Fuzhou City, Fujian Province, PRC',
      swiftCode: 'BKCHCNBJ720'
    },
    remarks: {
      priceTerms: 'Price Term: EX WARE OF XIAMEN',
      containerType: 'Container Type: 1 x in bulk',
      paymentTerms: 'Term of payment: 100% prepayment before preparation of samples and mass production',
      portOfLoading: 'Port of Loading: XIAMEN',
      shipmentDate: 'Date of Shipment: MAY 5, 2025',
      others: [
        '',
        '1. Delivery date:',
        '   Samples: none',
        '   Mass production: 15 days on confirming the samples.',
        '2. Approved drawing of the Art #5101 confirmed by "mohan.mv@alicolite.net" on 3 April 2016',
        '3. Extra fee $100 / charge ≈ 10000pcs/order'
      ]
    },
    footer: {
      tagline: 'One-stop Project Sourcing Solution Provider',
      currentPage: 1,
      totalPages: 2
    }
  };

  return (
    // 占满视口，flex-col，让 SalesContractViewerPage 能 flex-1
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* ── 顶部标签导航 ── */}
      <div className="bg-white border-b shadow-sm shrink-0">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <DraggableDocNav
            activeDoc={activeDoc as DocType | null}
            onDocChange={(docType) => setActiveDoc(docType)}
          />
        </div>
      </div>

      {/* ── 主内容区（flex-1，min-h-0 防止 flex 子元素撑破）── */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', position: 'relative' }}>

        {/* 销售合同：新页面级 Viewer（A4 分页 + 缩放 + 打印） */}
        {activeDoc === 'sc' && (
          <SalesContractViewerPage
            data={sampleSCData}
            fileName={`${sampleSCData.contractNo}.pdf`}
          />
        )}

        {/* 其他文档：保持原有渲染方式（灰色背景滚动区） */}
        {activeDoc !== 'sc' && (
          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', background: '#525659', padding: '32px 24px' }}>
            {!activeDoc && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#e2e8f0' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>📄</div>
                <div style={{ fontSize: 16, fontWeight: 600 }}>请从上方选择文档类型</div>
              </div>
            )}
            {activeDoc === 'inquiry' && (
              <CustomerInquiryDocument data={sampleInquiryData} />
            )}
            {activeDoc === 'quotation' && (
              <QuotationDocument data={sampleQuotationData} />
            )}
            {activeDoc === 'po' && (
              <PurchaseOrderDocument data={samplePOData} />
            )}
            {activeDoc === 'xj' && (
              <XJDocument data={sampleRFQData} />
            )}
            {activeDoc === 'supplier-quotation' && (
              <SupplierQuotationDocument data={sampleSupplierQuotationData} />
            )}
            {activeDoc === 'pr' && (
              <PurchaseRequirementDocument data={samplePRData} />
            )}
            {activeDoc === 'soa' && (
              <StatementOfAccountDocument data={sampleSOAData} />
            )}
            {activeDoc === 'ci' && (
              <CommercialInvoiceDocument data={sampleCIData} />
            )}
            {activeDoc === 'pl' && (
              <PackingListDocument data={samplePLData} />
            )}
            {activeDoc === 'pi' && (
              <ProformaInvoiceDocument data={samplePIData} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
