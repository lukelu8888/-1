import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Card, CardContent } from '../ui/card';
import { 
  FileText, Download, Send, Eye, Filter, Calendar,
  Search, Globe, Building2, Package, Ship, FileCheck,
  Clock, CheckCircle2, MailCheck, FolderOpen,
  Archive, Users, X, ChevronDown, ChevronRight,
  Layers, AlertCircle, ExternalLink, MoreVertical
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from '../ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';
import { toast } from 'sonner@2.0.3';
import { DOCUMENT_CATEGORIES, DOCUMENT_TEMPLATES } from '../../lib/services/document-template-service';
import { DOCUMENT_TEMPLATE_MAPPING } from '../../config/documentTemplateMapping';
import { templateCenterService } from '../../lib/supabaseService';
import {
  QuoteRequirementDocument,
  type QuoteRequirementDocumentData,
  type QuoteRequirementPreviewLayout,
  type QuoteRequirementTextOverrides,
  DEFAULT_QUOTE_REQUIREMENT_PREVIEW_LAYOUT,
  buildDefaultQuoteRequirementTextOverrides,
} from '../documents/templates/QuoteRequirementDocument';
import { XJDocument, type XJData } from '../documents/templates/XJDocument';
import { SalesContractDocument, type SalesContractData } from '../documents/templates/SalesContractDocument';
import { PurchaseOrderDocument, type PurchaseOrderData } from '../documents/templates/PurchaseOrderDocument';
import { ProformaInvoiceDocument, type ProformaInvoiceData } from '../documents/templates/ProformaInvoiceDocument';
import { CommercialInvoiceDocument, type CommercialInvoiceData } from '../documents/templates/CommercialInvoiceDocument';
import { PackingListDocument, type PackingListData } from '../documents/templates/PackingListDocument';
import { StatementOfAccountDocument, type StatementOfAccountData } from '../documents/templates/StatementOfAccountDocument';
import {
  CustomerInquiryDocument,
  CUSTOMER_INQUIRY_REQUIREMENT_FIELDS,
  type CustomerInquiryData,
} from '../documents/templates/CustomerInquiryDocument';
import { QuotationDocument, type QuotationData } from '../documents/templates/QuotationDocument';
import { QuotationDocumentA4Pages } from '../documents/templates/paginated/QuotationDocumentA4';
import { PurchaseOrderDocumentA4Pages } from '../documents/templates/paginated/PurchaseOrderDocumentA4';
import { TemplatePreviewShell } from '../documents/TemplatePreviewShell';
import { TemplateCenterPreviewViewport } from '../documents/TemplateCenterPreviewViewport';
import type { DocumentConditionGroup } from '../../types/documentConditions';

// 单证类型
type DocumentType = 'SC' | 'CI' | 'PL' | 'BL';

// 单证状态
type DocumentStatus = 'draft' | 'generated' | 'sent' | 'confirmed' | 'missing';

// 单证信息接口
interface Document {
  id: string;
  documentNumber: string;
  documentType: DocumentType;
  contractNumber: string;
  customerName: string;
  customerEmail: string;
  region: 'NA' | 'EU' | 'SA';
  shipmentDate: string;
  generatedDate: string;
  status: DocumentStatus;
  fileUrl?: string;
  fileSize?: number;
  sentHistory: {
    sentAt: string;
    sentTo: string;
    sentBy: string;
    status: 'success' | 'failed';
  }[];
  metadata?: {
    portOfLoading?: string;
    portOfDischarge?: string;
    vessel?: string;
    containerNo?: string;
    blNumber?: string;
  };
}

// 订单分组接口
interface OrderGroup {
  contractNumber: string;
  salesContract: Document;
  documents: {
    SC?: Document;
    CI?: Document;
    PL?: Document;
    BL?: Document;
  };
  customerName: string;
  customerEmail: string;
  region: 'NA' | 'EU' | 'SA';
  shipmentDate: string;
  totalDocuments: number;
  completedDocuments: number;
  portOfLoading?: string;
  portOfDischarge?: string;
}

interface DocumentCenterProps {
  userRole?: 'admin' | 'finance' | 'customer';
  userEmail?: string;
}

type AdminWorkspaceMode = 'template-hub' | 'document-center';
type TemplatePublishStatus = 'published' | 'draft' | 'legacy';
type QrVersionRecordStatus = 'draft' | 'published';

interface WorkspacePreviewLayout {
  canvasWidthMm: number;
  canvasMinHeightMm: number;
  contentPaddingTopMm: number;
  contentPaddingBottomMm: number;
  fontSizePt: number;
  lineHeight: number;
}

interface QrTemplateVersionRecord {
  id: string;
  version: string;
  status: QrVersionRecordStatus;
  savedAt: string;
  savedBy: string;
  note: string;
  data: QuoteRequirementDocumentData;
  layout: QuoteRequirementPreviewLayout;
  textOverrides: QuoteRequirementTextOverrides;
}

interface XjTemplateVersionRecord {
  id: string;
  version: string;
  status: QrVersionRecordStatus;
  savedAt: string;
  savedBy: string;
  note: string;
  data: XJData;
  layout: WorkspacePreviewLayout;
}

interface ScTemplateVersionRecord {
  id: string;
  version: string;
  status: QrVersionRecordStatus;
  savedAt: string;
  savedBy: string;
  note: string;
  data: SalesContractData;
  layout: WorkspacePreviewLayout;
}

interface CgTemplateVersionRecord {
  id: string;
  version: string;
  status: QrVersionRecordStatus;
  savedAt: string;
  savedBy: string;
  note: string;
  data: PurchaseOrderData;
  layout: WorkspacePreviewLayout;
}

interface PiTemplateVersionRecord {
  id: string;
  version: string;
  status: QrVersionRecordStatus;
  savedAt: string;
  savedBy: string;
  note: string;
  data: ProformaInvoiceData;
  layout: WorkspacePreviewLayout;
}

interface CiTemplateVersionRecord {
  id: string;
  version: string;
  status: QrVersionRecordStatus;
  savedAt: string;
  savedBy: string;
  note: string;
  data: CommercialInvoiceData;
  layout: WorkspacePreviewLayout;
}

interface PlTemplateVersionRecord {
  id: string;
  version: string;
  status: QrVersionRecordStatus;
  savedAt: string;
  savedBy: string;
  note: string;
  data: PackingListData;
  layout: WorkspacePreviewLayout;
}

interface SoaTemplateVersionRecord {
  id: string;
  version: string;
  status: QrVersionRecordStatus;
  savedAt: string;
  savedBy: string;
  note: string;
  data: StatementOfAccountData;
  layout: WorkspacePreviewLayout;
}

interface InquiryTemplateVersionRecord {
  id: string;
  version: string;
  status: QrVersionRecordStatus;
  savedAt: string;
  savedBy: string;
  note: string;
  data: CustomerInquiryData;
  layout: WorkspacePreviewLayout;
}

interface QuotationTemplateVersionRecord {
  id: string;
  version: string;
  status: QrVersionRecordStatus;
  savedAt: string;
  savedBy: string;
  note: string;
  data: QuotationData;
  layout: WorkspacePreviewLayout;
}

const TEMPLATE_WORKSPACE_META: Record<string, {
  currentVersion: string;
  status: TemplatePublishStatus;
  lastPublishedAt: string;
  lastEditedBy: string;
  schemaMode: string;
}> = {
  ing: { currentVersion: 'v1.2.0', status: 'published', lastPublishedAt: '2026-03-01 10:20', lastEditedBy: 'Admin', schemaMode: 'legacy-v1' },
  qt: { currentVersion: 'v1.4.0', status: 'published', lastPublishedAt: '2026-03-02 09:40', lastEditedBy: 'Sales Admin', schemaMode: 'legacy-v1' },
  qr: { currentVersion: 'v2.0.0', status: 'published', lastPublishedAt: '2026-03-04 14:30', lastEditedBy: 'Template Admin', schemaMode: 'template-center-ready' },
  xj: { currentVersion: 'v1.1.0', status: 'published', lastPublishedAt: '2026-03-03 16:40', lastEditedBy: 'Procurement Admin', schemaMode: 'template-center-ready' },
  pi: { currentVersion: 'v1.0.0', status: 'draft', lastPublishedAt: '2026-02-27 16:00', lastEditedBy: 'Finance Admin', schemaMode: 'legacy-v1' },
  sc: { currentVersion: 'v2.1.0', status: 'published', lastPublishedAt: '2026-03-03 18:15', lastEditedBy: 'Contract Admin', schemaMode: 'template-center-ready' },
  cg: { currentVersion: 'v1.3.0', status: 'published', lastPublishedAt: '2026-03-03 11:50', lastEditedBy: 'Procurement Admin', schemaMode: 'template-center-ready' },
  ci: { currentVersion: 'v1.1.0', status: 'published', lastPublishedAt: '2026-02-25 15:10', lastEditedBy: 'Docs Admin', schemaMode: 'legacy-v1' },
  pl: { currentVersion: 'v1.1.0', status: 'published', lastPublishedAt: '2026-02-25 15:30', lastEditedBy: 'Docs Admin', schemaMode: 'legacy-v1' },
  soa: { currentVersion: 'v0.9.0', status: 'draft', lastPublishedAt: '2026-02-20 09:00', lastEditedBy: 'Finance Admin', schemaMode: 'legacy-v1' },
};

function normalizeWorkspaceTemplateId(templateId: string) {
  return templateId;
}

const SAMPLE_QR_CONDITION_GROUPS: DocumentConditionGroup[] = [
  {
    key: 'business-instructions',
    title: '业务部说明',
    titleEn: 'SALES DEPT INSTRUCTIONS',
    items: [
      { key: 'packaging', label: '1. 客户包装要求', value: '外箱需要英文唛头，零售包装需挂卡设计，适合北美商超陈列。' },
      { key: 'payment', label: '2. 付款方式', value: '请优先争取 T/T 30% 预付款 + 70% 出货前付清。' },
      { key: 'quality', label: '3. 质量要求', value: '必须满足 UL / FCC / RoHS，重点确认批量稳定性。' },
      { key: 'delivery', label: '4. 交期要求', value: '首批交付目标 30 天内，超过 35 天需单独说明原因。' },
    ],
  },
];

const SAMPLE_QR_TEMPLATE_DATA: QuoteRequirementDocumentData = {
  requirementNo: 'QR-NA-260304-0001',
  requirementDate: '2026-03-04',
  sourceInquiryNo: 'ING-NA-260303-0012',
  requiredResponseDate: '2026-03-08',
  requiredDeliveryDate: '2026-04-10',
  customer: {
    companyName: 'ABC Trading Corporation',
    contactPerson: 'John Smith',
    email: 'john.smith@abctrading.com',
    phone: '+1-323-555-0123',
    address: '123 Main Street, Suite 500, Los Angeles, CA 90001, USA',
    region: 'North America',
    businessType: '建材分销',
  },
  products: [
    {
      no: 1,
      modelNo: 'GFCI-001',
      productName: 'GFCI Outlet',
      specification: '20A, 125V, Tamper-Resistant, Weather-Resistant, UL Listed',
      quantity: 5000,
      unit: 'PCS',
      unitPrice: 2.5,
      totalPrice: 12500,
      remarks: '白色，带LED指示灯',
    },
    {
      no: 2,
      modelNo: 'WRC-001',
      productName: 'Weather-Resistant Cover',
      specification: 'IP66 rated, single gang, clear polycarbonate',
      quantity: 2000,
      unit: 'PCS',
      unitPrice: 1.45,
      totalPrice: 2900,
      remarks: '适配北美户外插座',
    },
  ],
  customerRequirements: {
    deliveryTerms: 'FOB Xiamen / CIF Los Angeles',
    paymentTerms: 'T/T or L/C at sight',
    qualityStandard: 'UL, FCC, CE, RoHS',
    packaging: '出口纸箱 + 木托盘，适合海运',
    specialRequirements: '需要英文说明书与安装指南，并确认零售包装结构。',
  },
  conditionGroups: SAMPLE_QR_CONDITION_GROUPS,
  salesDeptNotes: [
    '1. Price Terms / 价格条款',
    'Original: FOB Xiamen / CIF Los Angeles',
    '中文: FOB 厦门 / CIF 洛杉矶',
    '',
    '2. Delivery Time / 交期要求',
    'Original: Within 30 days after order confirmation',
    '中文: 订单确认后30天内',
    '',
    '3. Payment Terms / 付款条款',
    'Original: T/T or L/C at sight',
    '中文: T/T 或即期信用证',
  ].join('\n'),
  purchaseDeptFeedback: '此区域为流程节点实际反馈区域，模板中心仅用于定义结构与初始占位文案。',
  urgency: 'high',
  createdBy: 'template.admin@cosun.com',
};

const SAMPLE_XJ_TEMPLATE_DATA: XJData = {
  xjNo: 'XJ-251218-1001',
  xjDate: '2025-12-18',
  requiredResponseDate: '2025-12-25',
  requiredDeliveryDate: '2026-01-15',
  inquiryDescription: '围绕五金配件系列产品进行首轮正式询价，请提供完整报价和交期说明。',
  buyer: {
    name: '福建高盛达富建材有限公司',
    nameEn: 'FUJIAN GOSUNDA FU BUILDING MATERIALS CO., LTD.',
    address: '福建省福州市仓山区金山工业区',
    addressEn: 'Jinshan Industrial Zone, Cangshan District, Fuzhou, Fujian, China',
    tel: '+86-591-8888-8888',
    email: 'purchasing@gosundafu.com',
    contactPerson: '张采购',
  },
  supplier: {
    companyName: '深圳市优质五金制品有限公司',
    address: '广东省深圳市宝安区西乡工业园',
    contactPerson: '李经理',
    tel: '+86-755-2888-8888',
    email: 'sales@supplier.com',
    supplierCode: 'SUP-ELEC-001',
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
      remarks: '需配备安装说明书',
    },
    {
      no: 2,
      modelNo: 'WJ-2024-002',
      description: '铝合金门把手',
      specification: '6063铝合金，长度150mm，银色阳极氧化',
      quantity: 2000,
      unit: '个',
      targetPrice: 'USD 3.80',
    },
    {
      no: 3,
      modelNo: 'WJ-2024-003',
      description: '铜合金铰链',
      specification: '4寸静音铰链，承重80kg，镀铬处理',
      quantity: 3000,
      unit: '个',
      targetPrice: 'USD 2.20',
    },
  ],
  terms: {
    currency: 'USD',
    paymentTerms: 'T/T 30% 预付，70% 发货前付清',
    deliveryTerms: 'EXW 工厂交货',
    deliveryAddress: '福建省福州市仓山区金山工业区',
    qualityStandard: '产品需符合国家GB/T 27922-2011标准，并优先提供 ISO 9001 / CE 等认证材料。',
    inspectionMethod: '到货后进行外观和功能检测，抽检率5%，不合格品按比例扣款或退换货处理。',
    deliveryRequirement: '要求交货日期：2026-01-15，如无法按期交货需提前7天告知并说明原因。',
    packaging: '标准出口包装，内层气泡膜，外层纸箱+木托盘，需防潮防震。',
    shippingMarks: '中性唛头，不显示最终客户信息。',
    inspectionRequirement: '出货前需提供产品照片和装箱照片，必要时安排第三方检验。',
    technicalDocuments: '需提供产品说明书（中英文）、材质检测报告、RoHS检测报告。',
    ipRights: '供应商确认所供产品不侵犯任何第三方知识产权。',
    confidentiality: '双方对价格信息、技术资料、客户信息承担保密义务。',
    sampleRequirement: '首次合作需提供2-3个样品供质量确认。',
    moq: '请在报价中注明最小起订量（MOQ）要求。',
    remarks: '报价有效期请不少于30天，交货周期请明确标注。',
  },
};

const SAMPLE_SC_TEMPLATE_DATA: SalesContractData = {
  contractNo: 'SC-NA-20251220-001',
  contractDate: '2025-12-20',
  quotationNo: 'QT-NA-20251210-001',
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
    businessLicense: '91350200MA2XXX123X',
  },
  buyer: {
    companyName: 'ABC Trading Corporation',
    contactPerson: 'John Smith',
    address: '123 Main Street, Suite 500, Los Angeles, CA 90001, USA',
    country: 'United States',
    email: 'john.smith@abctrading.com',
    tel: '+1-323-555-0123',
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
      amount: 14250,
      deliveryTime: '25-30 days',
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
      amount: 3300,
      deliveryTime: '20-25 days',
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
      amount: 2850,
      deliveryTime: '20-25 days',
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
      amount: 13825,
      deliveryTime: '30-35 days',
    },
  ],
  terms: {
    totalAmount: 34225,
    currency: 'USD',
    tradeTerms: 'FOB Xiamen, China',
    paymentTerms: '30% T/T deposit upon order confirmation, 70% T/T before shipment',
    depositAmount: 10267.5,
    balanceAmount: 23957.5,
    deliveryTime: '35-45 days after receiving deposit',
    portOfLoading: 'Xiamen Port, China',
    portOfDestination: 'Los Angeles Port, USA',
    packing: 'Export standard carton with wooden pallets, shrink-wrapped, suitable for ocean freight',
    inspection: 'Buyer inspection or third-party inspection before shipment.',
    warranty: '12 months warranty for manufacturing defects from delivery date.',
  },
  liabilityTerms: {
    sellerDefault: 'If seller fails to deliver on time without valid reason or force majeure, buyer may request deposit refund and compensation.',
    buyerDefault: 'If buyer fails to pay within agreed time, seller may suspend shipment and claim related losses.',
    forceMajeure: 'Both parties are exempted from liabilities arising from force majeure events beyond reasonable control.',
  },
  disputeResolution: {
    governingLaw: 'Laws of the People’s Republic of China.',
    arbitration: 'Disputes shall be settled by friendly negotiation, failing which CIETAC Xiamen shall arbitrate.',
  },
  signature: {
    sellerSignatory: 'Wang Ming (Legal Representative)',
    buyerSignatory: 'John Smith (Purchasing Manager)',
    signDate: '2025-12-20',
  },
};

const SAMPLE_CG_TEMPLATE_DATA: PurchaseOrderData = {
  poNo: 'CG-20251220-001',
  poDate: '2025-12-20',
  requiredDeliveryDate: '2026-01-25',
  buyer: {
    name: '福建高盛达富建材有限公司',
    nameEn: 'FUJIAN GAOSHENGDAFU BUILDING MATERIALS CO., LTD.',
    address: '福建省厦门市XX区XX路XX号',
    addressEn: 'XX Road, XX District, Xiamen, Fujian, China 361000',
    tel: '+86-592-1234-5678',
    email: 'procurement@gaoshengdafu.com',
    contactPerson: 'Li Ming (Procurement Manager)',
  },
  supplier: {
    companyName: 'Shenzhen Electronics Manufacturing Co., Ltd.',
    address: 'No.88 Industrial Road, Baoan District, Shenzhen, Guangdong, China',
    contactPerson: 'Chen Wei',
    tel: '+86-755-8888-9999',
    email: 'sales@szelec.com',
    supplierCode: 'SUP-GD-001',
    bankInfo: {
      bankName: '中国工商银行深圳宝安支行',
      accountName: 'Shenzhen Electronics Manufacturing Co., Ltd.',
      accountNumber: '4000 0212 0920 1234 567',
      swiftCode: 'ICBKCNBJSZN',
      bankAddress: 'No.123 Baoan Avenue, Baoan District, Shenzhen, Guangdong, China',
      currency: 'CNY/USD',
    },
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
      amount: 9250,
      deliveryDate: '2026-01-20',
      remarks: 'White color, with mounting holes',
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
      amount: 4750,
      deliveryDate: '2026-01-20',
    },
    {
      no: 3,
      itemCode: 'ITEM-WRC-001',
      description: 'Weather-Resistant Cover Raw Material',
      specification: 'Clear Polycarbonate sheets, IP66 grade, UV stabilized',
      quantity: 100,
      unit: 'kg',
      unitPrice: 8.5,
      currency: 'USD',
      amount: 850,
      deliveryDate: '2026-01-15',
    },
  ],
  terms: {
    totalAmount: 14850,
    currency: 'USD',
    paymentTerms: '30 days after delivery and inspection',
    deliveryTerms: 'EXW Shenzhen Factory',
    deliveryAddress: 'Fujian Gaoshengdafu Building Materials Co., Ltd., XX Road, XX District, Xiamen, Fujian, China 361000',
    qualityStandard: 'Meet UL, CE, RoHS standards. Samples must be approved before bulk production.',
    inspectionMethod: 'Third-party inspection (SGS or equivalent) or buyer inspection at supplier factory',
    packaging: '采用出口标准纸箱包装，每箱需标注采购单号、物料编码、数量、毛重净重。外包装需防潮、防震处理。',
    shippingMarks: '唛头需注明"COSUN"字样、合同编号CG-20251220-001、目的地厦门，并标注"小心轻放"、"防潮"标识。',
    deliveryPenalty: '供应商未能按约定时间交货的，每延误一天，应按延误交货部分货款的0.5%支付违约金，但违约金总额不超过延误交货部分货款的5%。',
    qualityPenalty: '产品质量不符合约定标准的，采购方有权拒收。如已收货发现质量问题，供应商应在7个工作日内无条件退换货，并承担由此产生的一切费用及损失。',
    warrantyPeriod: '12个月（自交货验收合格之日起计算）',
    warrantyTerms: '质保期内因产品质量问题造成的损失，供应商应负责免费维修或更换，并承担相关运费。',
    returnPolicy: '到货后7个工作日内完成验收，验收不合格的产品采购方有权退货。',
    confidentiality: '双方对本合同内容及合作过程中知悉的商业秘密承担保密义务。',
    ipRights: '供应商保证所供产品不侵犯任何第三方知识产权。',
    forceMajeure: '因不可抗力导致合同无法履行的，双方可协商延期履行或解除合同。',
    disputeResolution: '协商不成的，任何一方均可向采购方所在地人民法院提起诉讼。',
    applicableLaw: '中华人民共和国法律（不含冲突法规则）',
    contractValidity: '本采购合同自双方签章之日起生效，至所有产品交付验收合格且付款完成后自动终止。',
    modification: '任何修改或补充必须经双方书面同意并签署补充协议。',
    termination: '如一方严重违约且在收到书面通知后15日内仍未纠正，守约方有权解除合同。',
  },
};

const SAMPLE_PI_TEMPLATE_DATA: ProformaInvoiceData = {
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
    email: 'luis@cosunchina.com',
  },
  buyer: {
    companyName: 'Aluminium & Light Industries Co. (ALICO) Ltd',
    poBox: 'Box 6011 Sharjah UAE',
    contactPerson: 'Mohan MV +971655824441(90)',
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
      extendedValue: 2450,
    },
  ],
  freight: {
    type: 'Air Freight',
    terms: 'collected by the buyer',
  },
  totalValue: 2450,
  totalCurrency: 'US$',
  priceTerms: 'EX.W (XIAMEN)',
  bankInfo: {
    beneficiary: 'Fujian Cosun Tuff Building Materials Company Limited',
    beneficiaryAddress: 'Unit 1807, C1# building, Zone C, Wanda Plaza, Cangshan Dist., Fuzhou City, Fujian Province, China',
    accountNo: '4208583481447',
    bank: 'Bank of China Fujian Branch',
    bankAddress: 'No.136, West Rd. Gulou Dist., Fuzhou City, Fujian Province, PRC',
    swiftCode: 'BKCHCNBJ720',
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
      '3. Extra fee $100 / charge ≈ 10000pcs/order',
    ],
  },
  footer: {
    tagline: 'One-stop Project Sourcing Solution Provider',
    currentPage: 1,
    totalPages: 2,
  },
};

const SAMPLE_CI_TEMPLATE_DATA: CommercialInvoiceData = {
  invoiceNo: 'CI-20260215-001',
  invoiceDate: '2026-02-15',
  contractNo: 'SC-NA-20251220-001',
  exporter: {
    name: '福建高盛达富建材有限公司',
    nameEn: 'FUJIAN GAOSHENGDAFU BUILDING MATERIALS CO., LTD.',
    address: '福建省厦门市XX区XX路XX号',
    addressEn: 'XX Road, XX District, Xiamen, Fujian, China 361000',
    tel: '+86-592-1234-5678',
  },
  importer: {
    name: 'ABC TRADING CORPORATION',
    address: '123 Main Street, Suite 500, Los Angeles, CA 90001',
    country: 'United States of America',
    tel: '+1-323-555-0123',
  },
  shippingMarks: {
    mainMark: 'ABC-LA-001',
    sideMark: 'C/NO. 1-50',
    cautionMark: 'MADE IN CHINA\nFRAGILE - HANDLE WITH CARE',
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
      amount: 14250,
      grossWeight: 0.25,
      netWeight: 0.22,
    },
    {
      no: 2,
      description: 'Weather-Resistant Cover, IP66, Single Gang, Clear Polycarbonate',
      hsCode: '3926.9090',
      quantity: 2000,
      unit: 'PCS',
      unitPrice: 1.65,
      currency: 'USD',
      amount: 3300,
      grossWeight: 0.15,
      netWeight: 0.12,
    },
  ],
  shipping: {
    tradeTerms: 'FOB XIAMEN',
    paymentTerms: 'T/T',
    portOfLoading: 'Xiamen Port, China',
    portOfDischarge: 'Los Angeles Port, USA',
    finalDestination: 'Los Angeles, California, USA',
    vesselName: 'COSCO PACIFIC',
    blNo: 'COSU1234567890',
  },
  packing: {
    totalCartons: 50,
    totalGrossWeight: 1550,
    totalNetWeight: 1350,
    totalMeasurement: 3.75,
  },
};

const SAMPLE_PL_TEMPLATE_DATA: PackingListData = {
  plNo: 'PL-20260215-001',
  invoiceNo: 'CI-20260215-001',
  date: '2026-02-15',
  exporter: {
    name: 'FUJIAN GAOSHENGDAFU BUILDING MATERIALS CO., LTD.',
    address: 'XX Road, XX District, Xiamen, Fujian, China 361000',
  },
  importer: {
    name: 'ABC TRADING CORPORATION',
    address: '123 Main Street, Suite 500, Los Angeles, CA 90001, USA',
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
      totalCBM: 1.5,
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
      totalCBM: 1.25,
    },
  ],
  shipping: {
    portOfLoading: 'Xiamen Port, China',
    portOfDischarge: 'Los Angeles Port, USA',
    vesselName: 'COSCO PACIFIC',
    blNo: 'COSU1234567890',
  },
};

const SAMPLE_SOA_TEMPLATE_DATA: StatementOfAccountData = {
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
    swiftCode: 'BKCHCNBJ950',
  },
  customer: {
    customerCode: 'CUST-NA-001',
    companyName: 'ABC Trading Corporation',
    address: '123 Main Street, Suite 500, Los Angeles, CA 90001, USA',
    contactPerson: 'John Smith',
    email: 'john.smith@abctrading.com',
    tel: '+1-323-555-0123',
  },
  openingBalance: {
    amount: 0,
    currency: 'USD',
    type: 'debit',
  },
  transactions: [
    { date: '2025-12-01', type: 'invoice', referenceNo: 'INV-20251201-001', description: 'Sales Invoice - Order #12345', debit: 15800, balance: 15800, currency: 'USD' },
    { date: '2025-12-05', type: 'payment', referenceNo: 'PMT-20251205-001', description: 'T/T Payment Received', credit: 8000, balance: 7800, currency: 'USD' },
    { date: '2025-12-15', type: 'invoice', referenceNo: 'INV-20251215-002', description: 'Sales Invoice - Order #12346', debit: 20400, balance: 28200, currency: 'USD' },
    { date: '2025-12-18', type: 'payment', referenceNo: 'PMT-20251218-002', description: 'T/T Payment Received', credit: 7800, balance: 20400, currency: 'USD' },
    { date: '2025-12-20', type: 'invoice', referenceNo: 'INV-20251220-003', description: 'Sales Invoice - Order #12347', debit: 12600, balance: 33000, currency: 'USD' },
    { date: '2025-12-28', type: 'payment', referenceNo: 'PMT-20251228-003', description: 'T/T Payment Received (Partial)', credit: 10000, balance: 23000, currency: 'USD' },
  ],
  closingBalance: {
    amount: 23000,
    currency: 'USD',
    type: 'debit',
  },
  agingAnalysis: {
    current: 12600,
    days30: 10400,
    days60: 0,
    days90Plus: 0,
  },
  remarks: 'Payment terms: 30% deposit, 70% before shipment. Please settle outstanding balance within 30 days. For any queries, please contact our finance department.',
};

const SAMPLE_INQUIRY_TEMPLATE_DATA: CustomerInquiryData = {
  inquiryNo: 'ING-NA-20251210-001',
  inquiryDate: '2025-12-10',
  region: 'NA',
  customer: {
    companyName: 'ABC Trading Corporation',
    contactPerson: 'John Smith',
    position: 'Purchasing Manager',
    email: 'john.smith@abctrading.com',
    phone: '+1-323-555-0123',
    address: '123 Main Street, Suite 500, Los Angeles, CA 90001',
    country: 'United States',
  },
  products: [
    {
      no: 1,
      productName: 'GFCI Outlet',
      specification: '20A, 125V, Tamper-Resistant, Weather-Resistant, UL Listed',
      quantity: 5000,
      unit: 'pcs',
      targetPrice: 2.5,
      currency: 'USD',
      description: 'White color with LED indicator, standard duplex size',
    },
    {
      no: 2,
      productName: 'Weather-Resistant Cover',
      specification: 'IP66 rated, for single gang outlet, clear polycarbonate',
      quantity: 2000,
      unit: 'pcs',
      targetPrice: 1.45,
      currency: 'USD',
    },
    {
      no: 3,
      productName: 'Decora Wall Plate',
      specification: 'Standard size, screwless design, UV resistant',
      quantity: 3000,
      unit: 'pcs',
      targetPrice: 0.85,
      currency: 'USD',
      description: 'Colors: white, ivory, light almond (1000pcs each)',
    },
  ],
  requirements: {
    deliveryTime: 'Within 30 days after order confirmation',
    portOfDestination: 'Los Angeles / Jebel Ali / Door delivery to Houston',
    paymentTerms: '30% T/T deposit, 70% before shipment',
    tradeTerms: 'FOB Xiamen / CIF Los Angeles',
    packingRequirements: 'Export cartons with pallet, each carton with SKU label',
    certifications: ['UL', 'ETL', 'CE', 'FCC', 'RoHS'],
    otherRequirements: 'Need logo printing, English manual, and sample approval before mass production',
  },
  remarks: 'This is our first order with your company. We are a well-established distributor in the Los Angeles area with 15 years of experience. Quality and on-time delivery are critical to our business. We are looking for a long-term supplier and expect to place regular orders if this trial order is successful. Please provide your best pricing and confirm your production capacity.',
};

const SAMPLE_QUOTATION_TEMPLATE_DATA: QuotationData = {
  quotationNo: 'QT-NA-20251210-001',
  quotationDate: '2025-12-10',
  validUntil: '2026-01-10',
  inquiryNo: 'ING-NA-20251210-001',
  region: 'NA',
  company: {
    name: '福建高盛达富建材有限公司',
    nameEn: 'FUJIAN GAOSHENGDAFU BUILDING MATERIALS CO., LTD.',
    address: '福建省厦门市XX区XX路XX号',
    addressEn: 'XX Road, XX District, Xiamen, Fujian, China 361000',
    tel: '+86-592-1234-5678',
    fax: '+86-592-1234-5679',
    email: 'sales@gaoshengdafu.com',
    website: 'www.gaoshengdafu.com',
  },
  customer: {
    companyName: 'ABC Trading Corporation',
    contactPerson: 'John Smith',
    address: '123 Main Street, Suite 500, Los Angeles, CA 90001, USA',
    email: 'john.smith@abctrading.com',
    phone: '+1-323-555-0123',
  },
  products: [
    { no: 1, productName: 'GFCI Outlet', specification: '20A, 125V, Tamper-Resistant, Weather-Resistant, UL Listed, White with LED', hsCode: '8536.6990', quantity: 5000, unit: 'pcs', unitPrice: 2.85, currency: 'USD', amount: 14250, moq: 3000, leadTime: '25-30 days' },
    { no: 2, productName: 'Weather-Resistant Cover', specification: 'IP66, Single Gang, Clear Polycarbonate', hsCode: '3926.9090', quantity: 2000, unit: 'pcs', unitPrice: 1.65, currency: 'USD', amount: 3300, moq: 1000, leadTime: '20-25 days' },
    { no: 3, productName: 'Decora Wall Plate', specification: 'Screwless Design, UV Resistant, Multi-color', hsCode: '3926.9090', quantity: 3000, unit: 'pcs', unitPrice: 0.95, currency: 'USD', amount: 2850, moq: 2000, leadTime: '20-25 days' },
  ],
  tradeTerms: {
    incoterms: 'FOB Xiamen, China',
    paymentTerms: '30% T/T deposit upon order confirmation, 70% T/T before shipment',
    deliveryTime: '25-30 days after receiving deposit',
    packing: 'Export standard carton with wooden pallets, shrink-wrapped',
    portOfLoading: 'Xiamen Port, China',
    portOfDestination: 'Los Angeles Port, USA',
    warranty: '12 months from delivery date against manufacturing defects',
    inspection: "Seller's factory inspection before shipment, buyer has the right to re-inspect upon arrival",
  },
  remarks: 'Above prices are based on current raw material costs and are valid for 30 days. CIF Los Angeles price available upon request. All products come with English manual and installation guide. Free samples available for quality testing.',
  salesPerson: {
    name: 'Zhang Wei',
    position: 'Senior Sales Manager',
    email: 'zhangwei@gaoshengdafu.com',
    phone: '+86-139-5923-4567',
    whatsapp: '+86-139-5923-4567',
  },
};

const INITIAL_QR_TEXT_OVERRIDES = buildDefaultQuoteRequirementTextOverrides(SAMPLE_QR_TEMPLATE_DATA);

const DEFAULT_WORKSPACE_PREVIEW_LAYOUT: WorkspacePreviewLayout = {
  canvasWidthMm: 210,
  canvasMinHeightMm: 297,
  contentPaddingTopMm: 10,
  contentPaddingBottomMm: 12,
  fontSizePt: 10,
  lineHeight: 1.5,
};

const cloneQrState = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const normalizeWorkspacePreviewLayout = (layout?: Partial<WorkspacePreviewLayout> | null): WorkspacePreviewLayout => ({
  ...DEFAULT_WORKSPACE_PREVIEW_LAYOUT,
  ...(layout || {}),
});
const normalizeQrPreviewLayout = (
  layout?: Partial<QuoteRequirementPreviewLayout> | null
): QuoteRequirementPreviewLayout => ({
  ...DEFAULT_QUOTE_REQUIREMENT_PREVIEW_LAYOUT,
  ...(layout || {}),
});

const formatVersionTime = () =>
  new Date().toLocaleString('zh-CN', {
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

const bumpSemanticVersion = (version: string, mode: 'patch' | 'minor') => {
  const match = version.match(/^v(\d+)\.(\d+)\.(\d+)/i);
  if (!match) return mode === 'minor' ? 'v1.1.0' : 'v1.0.1';
  const major = Number(match[1]);
  const minor = Number(match[2]);
  const patch = Number(match[3]);
  if (mode === 'minor') {
    return `v${major}.${minor + 1}.0`;
  }
  return `v${major}.${minor}.${patch + 1}`;
};

export default function DocumentCenter({ userRole = 'admin', userEmail }: DocumentCenterProps) {
  const [adminWorkspaceMode, setAdminWorkspaceMode] = useState<AdminWorkspaceMode>('template-hub');
  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [regionFilter, setRegionFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [customerFilter, setCustomerFilter] = useState<string>('all');
  const [templateSearchTerm, setTemplateSearchTerm] = useState('');
  const [templateCategoryFilter, setTemplateCategoryFilter] = useState<string>('all');
  const [selectedTemplateId, setSelectedTemplateId] = useState('qr');
  const [qrTemplateData, setQrTemplateData] = useState<QuoteRequirementDocumentData>(SAMPLE_QR_TEMPLATE_DATA);
  const [qrTemplateLayout, setQrTemplateLayout] = useState<QuoteRequirementPreviewLayout>(DEFAULT_QUOTE_REQUIREMENT_PREVIEW_LAYOUT);
  const [qrTemplateTextOverrides, setQrTemplateTextOverrides] = useState<QuoteRequirementTextOverrides>(
    INITIAL_QR_TEXT_OVERRIDES
  );
  const [xjTemplateData, setXjTemplateData] = useState<XJData>(SAMPLE_XJ_TEMPLATE_DATA);
  const [scTemplateData, setScTemplateData] = useState<SalesContractData>(SAMPLE_SC_TEMPLATE_DATA);
  const [cgTemplateData, setCgTemplateData] = useState<PurchaseOrderData>(SAMPLE_CG_TEMPLATE_DATA);
  const [piTemplateData, setPiTemplateData] = useState<ProformaInvoiceData>(SAMPLE_PI_TEMPLATE_DATA);
  const [ciTemplateData, setCiTemplateData] = useState<CommercialInvoiceData>(SAMPLE_CI_TEMPLATE_DATA);
  const [plTemplateData, setPlTemplateData] = useState<PackingListData>(SAMPLE_PL_TEMPLATE_DATA);
  const [soaTemplateData, setSoaTemplateData] = useState<StatementOfAccountData>(SAMPLE_SOA_TEMPLATE_DATA);
  const [inquiryTemplateData, setInquiryTemplateData] = useState<CustomerInquiryData>(SAMPLE_INQUIRY_TEMPLATE_DATA);
  const [activeInquiryRequirementField, setActiveInquiryRequirementField] = useState<string | null>(null);
  const [quotationTemplateData, setQuotationTemplateData] = useState<QuotationData>(SAMPLE_QUOTATION_TEMPLATE_DATA);
  const [xjTemplateLayout, setXjTemplateLayout] = useState<WorkspacePreviewLayout>(cloneQrState(DEFAULT_WORKSPACE_PREVIEW_LAYOUT));
  const [scTemplateLayout, setScTemplateLayout] = useState<WorkspacePreviewLayout>(cloneQrState(DEFAULT_WORKSPACE_PREVIEW_LAYOUT));
  const [cgTemplateLayout, setCgTemplateLayout] = useState<WorkspacePreviewLayout>(cloneQrState(DEFAULT_WORKSPACE_PREVIEW_LAYOUT));
  const [piTemplateLayout, setPiTemplateLayout] = useState<WorkspacePreviewLayout>(cloneQrState(DEFAULT_WORKSPACE_PREVIEW_LAYOUT));
  const [ciTemplateLayout, setCiTemplateLayout] = useState<WorkspacePreviewLayout>(cloneQrState(DEFAULT_WORKSPACE_PREVIEW_LAYOUT));
  const [plTemplateLayout, setPlTemplateLayout] = useState<WorkspacePreviewLayout>(cloneQrState(DEFAULT_WORKSPACE_PREVIEW_LAYOUT));
  const [soaTemplateLayout, setSoaTemplateLayout] = useState<WorkspacePreviewLayout>(cloneQrState(DEFAULT_WORKSPACE_PREVIEW_LAYOUT));
  const [inquiryTemplateLayout, setInquiryTemplateLayout] = useState<WorkspacePreviewLayout>(cloneQrState(DEFAULT_WORKSPACE_PREVIEW_LAYOUT));
  const [quotationTemplateLayout, setQuotationTemplateLayout] = useState<WorkspacePreviewLayout>(cloneQrState(DEFAULT_WORKSPACE_PREVIEW_LAYOUT));
  const [qrVersionHistory, setQrVersionHistory] = useState<QrTemplateVersionRecord[]>([]);
  const [qrTemplateVersionNote, setQrTemplateVersionNote] = useState(
    '调整标题、业务部说明和A4版式参数'
  );
  const [xjVersionHistory, setXjVersionHistory] = useState<XjTemplateVersionRecord[]>([]);
  const [xjTemplateVersionNote, setXjTemplateVersionNote] = useState('采购询价单模板接入真实字段编辑和真实预览。');
  const [scVersionHistory, setScVersionHistory] = useState<ScTemplateVersionRecord[]>([]);
  const [scTemplateVersionNote, setScTemplateVersionNote] = useState('销售合同模板接入真实字段编辑和真实预览。');
  const [cgVersionHistory, setCgVersionHistory] = useState<CgTemplateVersionRecord[]>([]);
  const [cgTemplateVersionNote, setCgTemplateVersionNote] = useState('采购合同模板接入真实字段编辑和真实预览。');
  const [piVersionHistory, setPiVersionHistory] = useState<PiTemplateVersionRecord[]>([]);
  const [piTemplateVersionNote, setPiTemplateVersionNote] = useState('形式发票模板接入真实字段编辑和真实预览。');
  const [ciVersionHistory, setCiVersionHistory] = useState<CiTemplateVersionRecord[]>([]);
  const [ciTemplateVersionNote, setCiTemplateVersionNote] = useState('商业发票模板接入真实字段编辑和真实预览。');
  const [plVersionHistory, setPlVersionHistory] = useState<PlTemplateVersionRecord[]>([]);
  const [plTemplateVersionNote, setPlTemplateVersionNote] = useState('装箱单模板接入真实字段编辑和真实预览。');
  const [soaVersionHistory, setSoaVersionHistory] = useState<SoaTemplateVersionRecord[]>([]);
  const [soaTemplateVersionNote, setSoaTemplateVersionNote] = useState('对账单模板接入真实字段编辑和真实预览。');
  const [inquiryVersionHistory, setInquiryVersionHistory] = useState<InquiryTemplateVersionRecord[]>([]);
  const [inquiryTemplateVersionNote, setInquiryTemplateVersionNote] = useState('客户询价单模板接入真实字段编辑和真实预览。');
  const [quotationVersionHistory, setQuotationVersionHistory] = useState<QuotationTemplateVersionRecord[]>([]);
  const [quotationTemplateVersionNote, setQuotationTemplateVersionNote] = useState('客户报价单模板接入真实字段编辑和真实预览。');
  const [templateVersionSyncError, setTemplateVersionSyncError] = useState<string | null>(null);
  const [failedTemplateVersionKeys, setFailedTemplateVersionKeys] = useState<string[]>([]);
  const [hydratingTemplateVersionKeys, setHydratingTemplateVersionKeys] = useState<string[]>([]);
  const [persistingTemplateAction, setPersistingTemplateAction] = useState<{
    templateKey: string;
    status: QrVersionRecordStatus;
  } | null>(null);
  const [templateHubView, setTemplateHubView] = useState<'detail' | 'editor'>('detail');
  const [previewScale, setPreviewScale] = useState(80);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);

  const applyWorkspaceRecords = <TRecord extends { data: any; layout: WorkspacePreviewLayout }>(
    records: any[] | null,
    fallbackData: any,
    setHistory: React.Dispatch<React.SetStateAction<TRecord[]>>,
    setData: React.Dispatch<React.SetStateAction<any>>,
    setLayout: React.Dispatch<React.SetStateAction<WorkspacePreviewLayout>>,
  ) => {
    if (!records || records.length === 0) return;
    const mapped = records.map((record) => ({
      ...record,
      data: cloneQrState(record.data || fallbackData),
      layout: normalizeWorkspacePreviewLayout(record.layout),
    })) as TRecord[];
    setHistory(mapped);
    setData(cloneQrState(mapped[0].data));
    setLayout(cloneQrState(mapped[0].layout));
  };

  // 模拟单证数据
  const mockDocuments: Document[] = [
    // SC-NA-251121-0001 订单（完整）
    {
      id: 'doc-001', documentNumber: 'SC-NA-251121-0001', documentType: 'SC', contractNumber: 'SC-NA-251121-0001',
      customerName: 'ABC Trading Ltd.', customerEmail: 'purchasing@abctrading.com', region: 'NA',
      shipmentDate: '2025-12-25', generatedDate: '2025-11-21', status: 'sent', fileSize: 156,
      sentHistory: [{ sentAt: '2025-11-21 14:30', sentTo: 'purchasing@abctrading.com', sentBy: 'admin', status: 'success' }],
      metadata: { portOfLoading: 'XIAMEN', portOfDischarge: 'LOS ANGELES' }
    },
    {
      id: 'doc-002', documentNumber: 'CI-NA-251220-0001', documentType: 'CI', contractNumber: 'SC-NA-251121-0001',
      customerName: 'ABC Trading Ltd.', customerEmail: 'purchasing@abctrading.com', region: 'NA',
      shipmentDate: '2025-12-25', generatedDate: '2025-12-20', status: 'sent', fileSize: 89,
      sentHistory: [
        { sentAt: '2025-12-20 10:15', sentTo: 'purchasing@abctrading.com', sentBy: 'admin', status: 'success' },
        { sentAt: '2025-12-21 09:30', sentTo: 'purchasing@abctrading.com', sentBy: 'admin', status: 'success' }
      ]
    },
    {
      id: 'doc-003', documentNumber: 'PL-NA-251220-0001', documentType: 'PL', contractNumber: 'SC-NA-251121-0001',
      customerName: 'ABC Trading Ltd.', customerEmail: 'purchasing@abctrading.com', region: 'NA',
      shipmentDate: '2025-12-25', generatedDate: '2025-12-20', status: 'sent', fileSize: 67,
      sentHistory: [{ sentAt: '2025-12-20 10:20', sentTo: 'purchasing@abctrading.com', sentBy: 'admin', status: 'success' }]
    },
    {
      id: 'doc-004', documentNumber: 'MAEU123456789', documentType: 'BL', contractNumber: 'SC-NA-251121-0001',
      customerName: 'ABC Trading Ltd.', customerEmail: 'purchasing@abctrading.com', region: 'NA',
      shipmentDate: '2025-12-25', generatedDate: '2025-12-25', status: 'sent', fileSize: 234,
      sentHistory: [{ sentAt: '2025-12-25 16:45', sentTo: 'purchasing@abctrading.com', sentBy: 'admin', status: 'success' }]
    },

    // SC-EU-251101-0001 订单（完整）
    {
      id: 'doc-005', documentNumber: 'SC-EU-251101-0001', documentType: 'SC', contractNumber: 'SC-EU-251101-0001',
      customerName: 'EuroHome GmbH', customerEmail: 'logistics@eurohome.de', region: 'EU',
      shipmentDate: '2025-11-15', generatedDate: '2025-11-01', status: 'confirmed', fileSize: 142,
      sentHistory: [{ sentAt: '2025-11-01 11:20', sentTo: 'logistics@eurohome.de', sentBy: 'admin', status: 'success' }],
      metadata: { portOfLoading: 'NINGBO', portOfDischarge: 'HAMBURG' }
    },
    {
      id: 'doc-006', documentNumber: 'CI-EU-251110-0001', documentType: 'CI', contractNumber: 'SC-EU-251101-0001',
      customerName: 'EuroHome GmbH', customerEmail: 'logistics@eurohome.de', region: 'EU',
      shipmentDate: '2025-11-15', generatedDate: '2025-11-10', status: 'confirmed', fileSize: 78,
      sentHistory: [{ sentAt: '2025-11-10 14:30', sentTo: 'logistics@eurohome.de', sentBy: 'admin', status: 'success' }]
    },
    {
      id: 'doc-007', documentNumber: 'PL-EU-251110-0001', documentType: 'PL', contractNumber: 'SC-EU-251101-0001',
      customerName: 'EuroHome GmbH', customerEmail: 'logistics@eurohome.de', region: 'EU',
      shipmentDate: '2025-11-15', generatedDate: '2025-11-10', status: 'confirmed', fileSize: 54,
      sentHistory: [{ sentAt: '2025-11-10 14:35', sentTo: 'logistics@eurohome.de', sentBy: 'admin', status: 'success' }]
    },
    {
      id: 'doc-008', documentNumber: 'COSU7654321', documentType: 'BL', contractNumber: 'SC-EU-251101-0001',
      customerName: 'EuroHome GmbH', customerEmail: 'logistics@eurohome.de', region: 'EU',
      shipmentDate: '2025-11-15', generatedDate: '2025-11-15', status: 'sent', fileSize: 198,
      sentHistory: [{ sentAt: '2025-11-15 09:00', sentTo: 'logistics@eurohome.de', sentBy: 'admin', status: 'success' }]
    },

    // SC-SA-251110-0001 订单（完整）
    {
      id: 'doc-009', documentNumber: 'SC-SA-251110-0001', documentType: 'SC', contractNumber: 'SC-SA-251110-0001',
      customerName: 'BrasilPro Importadora', customerEmail: 'compras@brasilpro.com.br', region: 'SA',
      shipmentDate: '2025-12-01', generatedDate: '2025-11-10', status: 'sent', fileSize: 168,
      sentHistory: [{ sentAt: '2025-11-10 09:15', sentTo: 'compras@brasilpro.com.br', sentBy: 'admin', status: 'success' }],
      metadata: { portOfLoading: 'GUANGZHOU', portOfDischarge: 'SANTOS' }
    },
    {
      id: 'doc-010', documentNumber: 'CI-SA-251125-0001', documentType: 'CI', contractNumber: 'SC-SA-251110-0001',
      customerName: 'BrasilPro Importadora', customerEmail: 'compras@brasilpro.com.br', region: 'SA',
      shipmentDate: '2025-12-01', generatedDate: '2025-11-25', status: 'sent', fileSize: 95,
      sentHistory: [{ sentAt: '2025-11-25 15:15', sentTo: 'compras@brasilpro.com.br', sentBy: 'admin', status: 'success' }]
    },
    {
      id: 'doc-011', documentNumber: 'PL-SA-251125-0001', documentType: 'PL', contractNumber: 'SC-SA-251110-0001',
      customerName: 'BrasilPro Importadora', customerEmail: 'compras@brasilpro.com.br', region: 'SA',
      shipmentDate: '2025-12-01', generatedDate: '2025-11-25', status: 'sent', fileSize: 61,
      sentHistory: [{ sentAt: '2025-11-25 15:20', sentTo: 'compras@brasilpro.com.br', sentBy: 'admin', status: 'success' }]
    },

    // SC-NA-251115-0001 订单（部分缺失）
    {
      id: 'doc-012', documentNumber: 'SC-NA-251115-0001', documentType: 'SC', contractNumber: 'SC-NA-251115-0001',
      customerName: 'Industrial Supply Hub', customerEmail: 'orders@industrialhub.com', region: 'NA',
      shipmentDate: '2025-12-05', generatedDate: '2025-11-15', status: 'sent', fileSize: 178,
      sentHistory: [{ sentAt: '2025-11-15 16:00', sentTo: 'orders@industrialhub.com', sentBy: 'admin', status: 'success' }],
      metadata: { portOfLoading: 'SHANGHAI', portOfDischarge: 'NEW YORK' }
    },
    {
      id: 'doc-013', documentNumber: 'CI-NA-251130-0002', documentType: 'CI', contractNumber: 'SC-NA-251115-0001',
      customerName: 'Industrial Supply Hub', customerEmail: 'orders@industrialhub.com', region: 'NA',
      shipmentDate: '2025-12-05', generatedDate: '2025-11-30', status: 'generated', fileSize: 92,
      sentHistory: []
    },

    // SC-EU-251118-0001 订单（只有SC）
    {
      id: 'doc-014', documentNumber: 'SC-EU-251118-0001', documentType: 'SC', contractNumber: 'SC-EU-251118-0001',
      customerName: 'Nordic Imports AB', customerEmail: 'orders@nordicimports.se', region: 'EU',
      shipmentDate: '2025-12-10', generatedDate: '2025-11-18', status: 'sent', fileSize: 145,
      sentHistory: [{ sentAt: '2025-11-18 10:30', sentTo: 'orders@nordicimports.se', sentBy: 'admin', status: 'success' }],
      metadata: { portOfLoading: 'SHENZHEN', portOfDischarge: 'ROTTERDAM' }
    }
  ];

  // 数据隔离
  const filteredDocumentsByRole = userRole === 'customer' && userEmail
    ? mockDocuments.filter(doc => doc.customerEmail === userEmail)
    : mockDocuments;

  // 按销售合同分组
  const groupDocumentsByContract = (documents: Document[]): OrderGroup[] => {
    const grouped = new Map<string, OrderGroup>();

    documents.forEach(doc => {
      const contractNumber = doc.contractNumber;
      
      if (!grouped.has(contractNumber)) {
        const salesContract = documents.find(
          d => d.contractNumber === contractNumber && d.documentType === 'SC'
        );
        
        if (salesContract) {
          grouped.set(contractNumber, {
            contractNumber,
            salesContract,
            documents: {},
            customerName: salesContract.customerName,
            customerEmail: salesContract.customerEmail,
            region: salesContract.region,
            shipmentDate: salesContract.shipmentDate,
            totalDocuments: 0,
            completedDocuments: 0,
            portOfLoading: salesContract.metadata?.portOfLoading,
            portOfDischarge: salesContract.metadata?.portOfDischarge
          });
        }
      }

      const group = grouped.get(contractNumber);
      if (group) {
        group.documents[doc.documentType] = doc;
      }
    });

    // 计算统计
    grouped.forEach(group => {
      const docTypes: DocumentType[] = ['SC', 'CI', 'PL', 'BL'];
      group.totalDocuments = docTypes.filter(type => group.documents[type]).length;
      group.completedDocuments = docTypes.filter(
        type => group.documents[type] && group.documents[type]!.sentHistory.length > 0
      ).length;
    });

    return Array.from(grouped.values());
  };

  const uniqueCustomers = Array.from(new Set(filteredDocumentsByRole.map(doc => doc.customerName)));

  // 筛选逻辑
  const filteredDocuments = filteredDocumentsByRole.filter(doc => {
    const matchesSearch = 
      doc.documentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.contractNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRegion = regionFilter === 'all' || doc.region === regionFilter;
    const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;
    const matchesCustomer = customerFilter === 'all' || doc.customerName === customerFilter;
    
    const matchesDateRange = 
      (!dateRange.start || doc.shipmentDate >= dateRange.start) &&
      (!dateRange.end || doc.shipmentDate <= dateRange.end);
    
    return matchesSearch && matchesRegion && matchesStatus && matchesCustomer && matchesDateRange;
  });

  const orderGroups = groupDocumentsByContract(filteredDocuments);

  // 切换行展开
  const toggleRow = (contractNumber: string) => {
    setExpandedRows(prev =>
      prev.includes(contractNumber)
        ? prev.filter(c => c !== contractNumber)
        : [...prev, contractNumber]
    );
  };

  // 选择整个订单
  const toggleOrderSelection = (group: OrderGroup) => {
    const allDocIds = Object.values(group.documents).filter(Boolean).map(d => d!.id);
    const allSelected = allDocIds.every(id => selectedDocuments.includes(id));
    
    if (allSelected) {
      setSelectedDocuments(prev => prev.filter(id => !allDocIds.includes(id)));
    } else {
      setSelectedDocuments(prev => [...new Set([...prev, ...allDocIds])]);
    }
  };

  const toggleDocumentSelection = (docId: string) => {
    setSelectedDocuments(prev =>
      prev.includes(docId) ? prev.filter(id => id !== docId) : [...prev, docId]
    );
  };

  const openSendDialog = (doc: Document) => {
    setSelectedDoc(doc);
    setSendDialogOpen(true);
  };

  // 获取单证状态徽章
  const getDocumentBadge = (doc: Document | undefined, type: DocumentType) => {
    const typeConfigs = {
      SC: { bg: 'bg-blue-500', text: 'SC', icon: FileText },
      CI: { bg: 'bg-emerald-500', text: 'CI', icon: FileText },
      PL: { bg: 'bg-orange-500', text: 'PL', icon: Package },
      BL: { bg: 'bg-purple-500', text: 'BL', icon: Ship }
    };
    const config = typeConfigs[type];
    const Icon = config.icon;

    if (!doc) {
      return (
        <Tooltip>
          <TooltipTrigger>
            <div className="relative w-11 h-8 bg-gray-100 border border-dashed border-gray-300 rounded flex flex-col items-center justify-center cursor-help">
              <Icon className="w-3 h-3 text-gray-400 mb-0.5" />
              <span className="text-[9px] text-gray-400 font-medium">{config.text}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            <p className="font-semibold">{config.text} 未生成</p>
          </TooltipContent>
        </Tooltip>
      );
    }

    const statusIcons = {
      draft: { icon: Clock, color: 'text-gray-500' },
      generated: { icon: FileCheck, color: 'text-blue-500' },
      sent: { icon: MailCheck, color: 'text-red-500' },
      confirmed: { icon: CheckCircle2, color: 'text-emerald-600' }
    };
    const StatusIcon = statusIcons[doc.status]?.icon || Clock;
    const statusColor = statusIcons[doc.status]?.color || 'text-gray-500';

    return (
      <Tooltip>
        <TooltipTrigger>
          <div 
            className={`relative w-11 h-8 ${config.bg} rounded flex flex-col items-center justify-center cursor-pointer hover:opacity-90 transition-opacity`}
            onClick={() => toggleDocumentSelection(doc.id)}
          >
            {selectedDocuments.includes(doc.id) && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-600 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-2 h-2 text-white" />
              </div>
            )}
            <Icon className="w-3 h-3 text-white mb-0.5" />
            <span className="text-[9px] text-white font-bold">{config.text}</span>
            <StatusIcon className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 ${statusColor} bg-white rounded-full`} />
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          <p className="font-semibold">{doc.documentNumber}</p>
          <p className="text-[11px] text-gray-400">生成: {doc.generatedDate}</p>
          {doc.sentHistory.length > 0 && (
            <p className="text-[11px] text-green-600">已发送 {doc.sentHistory.length} 次</p>
          )}
          <p className="text-[11px] text-gray-400">{doc.fileSize}KB</p>
        </TooltipContent>
      </Tooltip>
    );
  };

  const getRegionName = (region: string) => {
    const regions = { NA: '北美', EU: '欧非', SA: '南美' };
    return regions[region as keyof typeof regions] || region;
  };

  // 获取订单整体发送状态
  const getOrderSendStatus = (group: OrderGroup) => {
    const allDocs = Object.values(group.documents).filter(Boolean) as Document[];
    if (allDocs.length === 0) return { sent: 0, total: 0, lastSentTime: null };
    
    const sentDocs = allDocs.filter(doc => doc.sentHistory.length > 0);
    const lastSentDoc = allDocs
      .filter(doc => doc.sentHistory.length > 0)
      .sort((a, b) => {
        const aTime = a.sentHistory[a.sentHistory.length - 1].sentAt;
        const bTime = b.sentHistory[b.sentHistory.length - 1].sentAt;
        return bTime.localeCompare(aTime);
      })[0];
    
    return {
      sent: sentDocs.length,
      total: allDocs.length,
      lastSentTime: lastSentDoc?.sentHistory[lastSentDoc.sentHistory.length - 1]?.sentAt || null
    };
  };

  // 统计数据
  const stats = {
    total: filteredDocumentsByRole.length,
    orders: orderGroups.length,
    SC: filteredDocumentsByRole.filter(d => d.documentType === 'SC').length,
    CI: filteredDocumentsByRole.filter(d => d.documentType === 'CI').length,
    PL: filteredDocumentsByRole.filter(d => d.documentType === 'PL').length,
    BL: filteredDocumentsByRole.filter(d => d.documentType === 'BL').length,
    sent: filteredDocumentsByRole.filter(d => d.status === 'sent' || d.status === 'confirmed').length
  };

  const templateWorkspaceItems = useMemo(() => {
    return DOCUMENT_TEMPLATES.map((template) => {
      const canonicalTemplateId = normalizeWorkspaceTemplateId(template.id);
      const mapping = Object.values(DOCUMENT_TEMPLATE_MAPPING).find((item) =>
        item.templateComponent.includes(template.component)
      );
      const meta = TEMPLATE_WORKSPACE_META[canonicalTemplateId] || {
        currentVersion: 'v1.0.0',
        status: 'legacy' as TemplatePublishStatus,
        lastPublishedAt: '未发布',
        lastEditedBy: 'System',
        schemaMode: 'legacy-v1',
      };
      const categoryMeta = DOCUMENT_CATEGORIES[template.category as keyof typeof DOCUMENT_CATEGORIES];
      const usedInModules = mapping?.usedInModules || [];

      return {
        ...template,
        id: canonicalTemplateId,
        legacyId: template.id,
        meta,
        mapping,
        categoryName: categoryMeta?.name || template.category,
        usedInModules,
        usageCount: usedInModules.length,
      };
    }).sort((a, b) => a.order - b.order);
  }, []);

  const filteredTemplateWorkspaceItems = useMemo(() => {
    return templateWorkspaceItems.filter((item) => {
      const keyword = templateSearchTerm.trim().toLowerCase();
      const matchesKeyword =
        !keyword ||
        item.name.toLowerCase().includes(keyword) ||
        item.nameEn.toLowerCase().includes(keyword) ||
        item.id.toLowerCase().includes(keyword) ||
        item.component.toLowerCase().includes(keyword);
      const matchesCategory = templateCategoryFilter === 'all' || item.category === templateCategoryFilter;
      return matchesKeyword && matchesCategory;
    });
  }, [templateCategoryFilter, templateSearchTerm, templateWorkspaceItems]);

  const activeTemplate =
    filteredTemplateWorkspaceItems.find((item) => item.id === selectedTemplateId) ||
    templateWorkspaceItems.find((item) => item.id === selectedTemplateId) ||
    filteredTemplateWorkspaceItems[0] ||
    templateWorkspaceItems[0];

  useEffect(() => {
    if (!activeTemplate) return;
    let cancelled = false;
    const templateKey = activeTemplate.id;

    const loadActiveTemplateVersionHistory = async () => {
      setHydratingTemplateVersionKeys((prev) => (
        prev.includes(templateKey) ? prev : [...prev, templateKey]
      ));
      setFailedTemplateVersionKeys((prev) => prev.filter((key) => key !== templateKey));
      if (templateVersionSyncError) {
        setTemplateVersionSyncError(null);
      }

      let records: any[] | null = null;
      try {
        records = await Promise.race([
          templateCenterService.getVersionHistory(templateKey),
          new Promise<null>((resolve) => {
            window.setTimeout(() => resolve(null), 8000);
          }),
        ]);
      } catch {
        records = null;
      } finally {
        if (!cancelled) {
          setHydratingTemplateVersionKeys((prev) => prev.filter((key) => key !== templateKey));
        }
      }

      if (cancelled) return;

      if (records === null) {
        setFailedTemplateVersionKeys((prev) => (
          prev.includes(templateKey) ? prev : [...prev, templateKey]
        ));
        setTemplateVersionSyncError(`模板 ${templateKey.toUpperCase()} 版本同步失败。当前只认 Supabase，请先修复后再继续编辑。`);
        toast.error(`模板 ${templateKey.toUpperCase()} 版本同步失败。`);
        return;
      }

      if (templateKey === 'qr') {
        if (records.length === 0) return;
        const mapped = records.map((record) => {
          const data = cloneQrState(record.data || SAMPLE_QR_TEMPLATE_DATA);
          return {
            ...record,
            data,
            layout: normalizeQrPreviewLayout(record.layout),
            textOverrides: cloneQrState(record.textOverrides || buildDefaultQuoteRequirementTextOverrides(data)),
          };
        }) as QrTemplateVersionRecord[];
        setQrVersionHistory(mapped);
        setQrTemplateData(cloneQrState(mapped[0].data));
        setQrTemplateLayout(cloneQrState(mapped[0].layout));
        setQrTemplateTextOverrides(cloneQrState(mapped[0].textOverrides));
        return;
      }

      if (templateKey === 'xj') {
        applyWorkspaceRecords<XjTemplateVersionRecord>(records, SAMPLE_XJ_TEMPLATE_DATA, setXjVersionHistory, setXjTemplateData, setXjTemplateLayout);
        return;
      }
      if (templateKey === 'sc') {
        applyWorkspaceRecords<ScTemplateVersionRecord>(records, SAMPLE_SC_TEMPLATE_DATA, setScVersionHistory, setScTemplateData, setScTemplateLayout);
        return;
      }
      if (templateKey === 'cg') {
        applyWorkspaceRecords<CgTemplateVersionRecord>(records, SAMPLE_CG_TEMPLATE_DATA, setCgVersionHistory, setCgTemplateData, setCgTemplateLayout);
        return;
      }
      if (templateKey === 'pi') {
        applyWorkspaceRecords<PiTemplateVersionRecord>(records, SAMPLE_PI_TEMPLATE_DATA, setPiVersionHistory, setPiTemplateData, setPiTemplateLayout);
        return;
      }
      if (templateKey === 'ci') {
        applyWorkspaceRecords<CiTemplateVersionRecord>(records, SAMPLE_CI_TEMPLATE_DATA, setCiVersionHistory, setCiTemplateData, setCiTemplateLayout);
        return;
      }
      if (templateKey === 'pl') {
        applyWorkspaceRecords<PlTemplateVersionRecord>(records, SAMPLE_PL_TEMPLATE_DATA, setPlVersionHistory, setPlTemplateData, setPlTemplateLayout);
        return;
      }
      if (templateKey === 'soa') {
        applyWorkspaceRecords<SoaTemplateVersionRecord>(records, SAMPLE_SOA_TEMPLATE_DATA, setSoaVersionHistory, setSoaTemplateData, setSoaTemplateLayout);
        return;
      }
      if (templateKey === 'ing') {
        applyWorkspaceRecords<InquiryTemplateVersionRecord>(records, SAMPLE_INQUIRY_TEMPLATE_DATA, setInquiryVersionHistory, setInquiryTemplateData, setInquiryTemplateLayout);
        return;
      }
      if (templateKey === 'qt') {
        applyWorkspaceRecords<QuotationTemplateVersionRecord>(records, SAMPLE_QUOTATION_TEMPLATE_DATA, setQuotationVersionHistory, setQuotationTemplateData, setQuotationTemplateLayout);
      }
    };

    void loadActiveTemplateVersionHistory();

    return () => {
      cancelled = true;
    };
  }, [activeTemplate?.id]);
  const isHydratingActiveTemplateVersions = activeTemplate
    ? hydratingTemplateVersionKeys.includes(activeTemplate.id)
    : false;
  const hasActiveTemplateVersionSyncError = activeTemplate
    ? failedTemplateVersionKeys.includes(activeTemplate.id)
    : false;
  const isPersistingActiveTemplate = activeTemplate
    ? persistingTemplateAction?.templateKey === activeTemplate.id
    : false;

  const templateWorkspaceStats = {
    total: templateWorkspaceItems.length,
    published: templateWorkspaceItems.filter((item) => item.meta.status === 'published').length,
    draft: templateWorkspaceItems.filter((item) => item.meta.status === 'draft').length,
    linkedModules: templateWorkspaceItems.reduce((sum, item) => sum + item.usageCount, 0),
  };

  const publishStatusMeta: Record<TemplatePublishStatus, { label: string; className: string }> = {
    published: { label: '已发布', className: 'bg-green-50 text-green-700 border-green-200' },
    draft: { label: '草稿中', className: 'bg-amber-50 text-amber-700 border-amber-200' },
    legacy: { label: '待迁移', className: 'bg-slate-100 text-slate-700 border-slate-200' },
  };

  const latestQrVersionRecord = qrVersionHistory[0];
  const latestQrPublishedRecord =
    qrVersionHistory.find((record) => record.status === 'published') || latestQrVersionRecord;
  const latestQrDraftRecord = qrVersionHistory.find((record) => record.status === 'draft');
  const latestXjVersionRecord = xjVersionHistory[0];
  const latestXjPublishedRecord =
    xjVersionHistory.find((record) => record.status === 'published') || latestXjVersionRecord;
  const latestXjDraftRecord = xjVersionHistory.find((record) => record.status === 'draft');
  const latestScVersionRecord = scVersionHistory[0];
  const latestScPublishedRecord =
    scVersionHistory.find((record) => record.status === 'published') || latestScVersionRecord;
  const latestScDraftRecord = scVersionHistory.find((record) => record.status === 'draft');
  const latestCgVersionRecord = cgVersionHistory[0];
  const latestCgPublishedRecord =
    cgVersionHistory.find((record) => record.status === 'published') || latestCgVersionRecord;
  const latestCgDraftRecord = cgVersionHistory.find((record) => record.status === 'draft');
  const latestPiVersionRecord = piVersionHistory[0];
  const latestPiPublishedRecord =
    piVersionHistory.find((record) => record.status === 'published') || latestPiVersionRecord;
  const latestPiDraftRecord = piVersionHistory.find((record) => record.status === 'draft');
  const latestCiVersionRecord = ciVersionHistory[0];
  const latestCiPublishedRecord =
    ciVersionHistory.find((record) => record.status === 'published') || latestCiVersionRecord;
  const latestCiDraftRecord = ciVersionHistory.find((record) => record.status === 'draft');
  const latestPlVersionRecord = plVersionHistory[0];
  const latestPlPublishedRecord =
    plVersionHistory.find((record) => record.status === 'published') || latestPlVersionRecord;
  const latestPlDraftRecord = plVersionHistory.find((record) => record.status === 'draft');
  const latestSoaVersionRecord = soaVersionHistory[0];
  const latestSoaPublishedRecord =
    soaVersionHistory.find((record) => record.status === 'published') || latestSoaVersionRecord;
  const latestSoaDraftRecord = soaVersionHistory.find((record) => record.status === 'draft');
  const latestInquiryVersionRecord = inquiryVersionHistory[0];
  const latestInquiryPublishedRecord =
    inquiryVersionHistory.find((record) => record.status === 'published') || latestInquiryVersionRecord;
  const latestInquiryDraftRecord = inquiryVersionHistory.find((record) => record.status === 'draft');
  const latestQuotationVersionRecord = quotationVersionHistory[0];
  const latestQuotationPublishedRecord =
    quotationVersionHistory.find((record) => record.status === 'published') || latestQuotationVersionRecord;
  const latestQuotationDraftRecord = quotationVersionHistory.find((record) => record.status === 'draft');
  const qrTemplateRuntimeMeta = {
    ...TEMPLATE_WORKSPACE_META.qr,
    currentVersion: latestQrPublishedRecord?.version || TEMPLATE_WORKSPACE_META.qr.currentVersion,
    status: latestQrDraftRecord ? 'draft' as TemplatePublishStatus : 'published' as TemplatePublishStatus,
    lastPublishedAt: latestQrPublishedRecord?.savedAt || TEMPLATE_WORKSPACE_META.qr.lastPublishedAt,
    lastEditedBy: latestQrVersionRecord?.savedBy || TEMPLATE_WORKSPACE_META.qr.lastEditedBy,
  };
  const xjTemplateRuntimeMeta = {
    ...TEMPLATE_WORKSPACE_META.xj,
    currentVersion: latestXjPublishedRecord?.version || TEMPLATE_WORKSPACE_META.xj.currentVersion,
    status: latestXjDraftRecord ? 'draft' as TemplatePublishStatus : 'published' as TemplatePublishStatus,
    lastPublishedAt: latestXjPublishedRecord?.savedAt || TEMPLATE_WORKSPACE_META.xj.lastPublishedAt,
    lastEditedBy: latestXjVersionRecord?.savedBy || TEMPLATE_WORKSPACE_META.xj.lastEditedBy,
  };
  const scTemplateRuntimeMeta = {
    ...TEMPLATE_WORKSPACE_META.sc,
    currentVersion: latestScPublishedRecord?.version || TEMPLATE_WORKSPACE_META.sc.currentVersion,
    status: latestScDraftRecord ? 'draft' as TemplatePublishStatus : 'published' as TemplatePublishStatus,
    lastPublishedAt: latestScPublishedRecord?.savedAt || TEMPLATE_WORKSPACE_META.sc.lastPublishedAt,
    lastEditedBy: latestScVersionRecord?.savedBy || TEMPLATE_WORKSPACE_META.sc.lastEditedBy,
  };
  const cgTemplateRuntimeMeta = {
    ...TEMPLATE_WORKSPACE_META.cg,
    currentVersion: latestCgPublishedRecord?.version || TEMPLATE_WORKSPACE_META.cg.currentVersion,
    status: latestCgDraftRecord ? 'draft' as TemplatePublishStatus : 'published' as TemplatePublishStatus,
    lastPublishedAt: latestCgPublishedRecord?.savedAt || TEMPLATE_WORKSPACE_META.cg.lastPublishedAt,
    lastEditedBy: latestCgVersionRecord?.savedBy || TEMPLATE_WORKSPACE_META.cg.lastEditedBy,
  };
  const piTemplateRuntimeMeta = {
    ...TEMPLATE_WORKSPACE_META.pi,
    currentVersion: latestPiPublishedRecord?.version || TEMPLATE_WORKSPACE_META.pi.currentVersion,
    status: latestPiDraftRecord ? 'draft' as TemplatePublishStatus : 'published' as TemplatePublishStatus,
    lastPublishedAt: latestPiPublishedRecord?.savedAt || TEMPLATE_WORKSPACE_META.pi.lastPublishedAt,
    lastEditedBy: latestPiVersionRecord?.savedBy || TEMPLATE_WORKSPACE_META.pi.lastEditedBy,
  };
  const ciTemplateRuntimeMeta = {
    ...TEMPLATE_WORKSPACE_META.ci,
    currentVersion: latestCiPublishedRecord?.version || TEMPLATE_WORKSPACE_META.ci.currentVersion,
    status: latestCiDraftRecord ? 'draft' as TemplatePublishStatus : 'published' as TemplatePublishStatus,
    lastPublishedAt: latestCiPublishedRecord?.savedAt || TEMPLATE_WORKSPACE_META.ci.lastPublishedAt,
    lastEditedBy: latestCiVersionRecord?.savedBy || TEMPLATE_WORKSPACE_META.ci.lastEditedBy,
  };
  const plTemplateRuntimeMeta = {
    ...TEMPLATE_WORKSPACE_META.pl,
    currentVersion: latestPlPublishedRecord?.version || TEMPLATE_WORKSPACE_META.pl.currentVersion,
    status: latestPlDraftRecord ? 'draft' as TemplatePublishStatus : 'published' as TemplatePublishStatus,
    lastPublishedAt: latestPlPublishedRecord?.savedAt || TEMPLATE_WORKSPACE_META.pl.lastPublishedAt,
    lastEditedBy: latestPlVersionRecord?.savedBy || TEMPLATE_WORKSPACE_META.pl.lastEditedBy,
  };
  const soaTemplateRuntimeMeta = {
    ...TEMPLATE_WORKSPACE_META.soa,
    currentVersion: latestSoaPublishedRecord?.version || TEMPLATE_WORKSPACE_META.soa.currentVersion,
    status: latestSoaDraftRecord ? 'draft' as TemplatePublishStatus : 'published' as TemplatePublishStatus,
    lastPublishedAt: latestSoaPublishedRecord?.savedAt || TEMPLATE_WORKSPACE_META.soa.lastPublishedAt,
    lastEditedBy: latestSoaVersionRecord?.savedBy || TEMPLATE_WORKSPACE_META.soa.lastEditedBy,
  };
  const inquiryTemplateRuntimeMeta = {
    ...TEMPLATE_WORKSPACE_META.ing,
    currentVersion: latestInquiryPublishedRecord?.version || TEMPLATE_WORKSPACE_META.ing.currentVersion,
    status: latestInquiryDraftRecord ? 'draft' as TemplatePublishStatus : 'published' as TemplatePublishStatus,
    lastPublishedAt: latestInquiryPublishedRecord?.savedAt || TEMPLATE_WORKSPACE_META.ing.lastPublishedAt,
    lastEditedBy: latestInquiryVersionRecord?.savedBy || TEMPLATE_WORKSPACE_META.ing.lastEditedBy,
  };
  const quotationTemplateRuntimeMeta = {
    ...TEMPLATE_WORKSPACE_META.qt,
    currentVersion: latestQuotationPublishedRecord?.version || TEMPLATE_WORKSPACE_META.qt.currentVersion,
    status: latestQuotationDraftRecord ? 'draft' as TemplatePublishStatus : 'published' as TemplatePublishStatus,
    lastPublishedAt: latestQuotationPublishedRecord?.savedAt || TEMPLATE_WORKSPACE_META.qt.lastPublishedAt,
    lastEditedBy: latestQuotationVersionRecord?.savedBy || TEMPLATE_WORKSPACE_META.qt.lastEditedBy,
  };
  const resolvedActiveTemplateMeta = activeTemplate
    ? activeTemplate.id === 'qr'
      ? qrTemplateRuntimeMeta
      : activeTemplate.id === 'xj'
        ? xjTemplateRuntimeMeta
      : activeTemplate.id === 'sc'
        ? scTemplateRuntimeMeta
        : activeTemplate.id === 'cg'
          ? cgTemplateRuntimeMeta
          : activeTemplate.id === 'pi'
            ? piTemplateRuntimeMeta
            : activeTemplate.id === 'ci'
              ? ciTemplateRuntimeMeta
              : activeTemplate.id === 'pl'
                ? plTemplateRuntimeMeta
                : activeTemplate.id === 'soa'
                  ? soaTemplateRuntimeMeta
                  : activeTemplate.id === 'ing'
                    ? inquiryTemplateRuntimeMeta
                    : activeTemplate.id === 'qt'
                      ? quotationTemplateRuntimeMeta
        : activeTemplate.meta
    : null;

  const updateQrTemplateData = <K extends keyof QuoteRequirementDocumentData>(key: K, value: QuoteRequirementDocumentData[K]) => {
    setQrTemplateData((prev) => ({ ...prev, [key]: value }));
  };

  const updateQrTemplateLayout = <K extends keyof QuoteRequirementPreviewLayout>(key: K, value: QuoteRequirementPreviewLayout[K]) => {
    setQrTemplateLayout((prev) => ({ ...prev, [key]: value }));
  };

  const updateQrTemplateText = <K extends keyof QuoteRequirementTextOverrides>(key: K, value: QuoteRequirementTextOverrides[K]) => {
    setQrTemplateTextOverrides((prev) => ({ ...prev, [key]: value }));
  };

  const updateXjTemplateData = <K extends keyof XJData>(key: K, value: XJData[K]) => {
    setXjTemplateData((prev) => ({ ...prev, [key]: value }));
  };

  const updateScTemplateData = <K extends keyof SalesContractData>(key: K, value: SalesContractData[K]) => {
    setScTemplateData((prev) => ({ ...prev, [key]: value }));
  };

  const updateCgTemplateData = <K extends keyof PurchaseOrderData>(key: K, value: PurchaseOrderData[K]) => {
    setCgTemplateData((prev) => ({ ...prev, [key]: value }));
  };

  const updateXjTemplateLayout = <K extends keyof WorkspacePreviewLayout>(key: K, value: WorkspacePreviewLayout[K]) => {
    setXjTemplateLayout((prev) => ({ ...prev, [key]: value }));
  };

  const updateScTemplateLayout = <K extends keyof WorkspacePreviewLayout>(key: K, value: WorkspacePreviewLayout[K]) => {
    setScTemplateLayout((prev) => ({ ...prev, [key]: value }));
  };

  const updateCgTemplateLayout = <K extends keyof WorkspacePreviewLayout>(key: K, value: WorkspacePreviewLayout[K]) => {
    setCgTemplateLayout((prev) => ({ ...prev, [key]: value }));
  };

  const updatePiTemplateData = <K extends keyof ProformaInvoiceData>(key: K, value: ProformaInvoiceData[K]) => {
    setPiTemplateData((prev) => ({ ...prev, [key]: value }));
  };

  const updatePiTemplateLayout = <K extends keyof WorkspacePreviewLayout>(key: K, value: WorkspacePreviewLayout[K]) => {
    setPiTemplateLayout((prev) => ({ ...prev, [key]: value }));
  };

  const updateCiTemplateData = <K extends keyof CommercialInvoiceData>(key: K, value: CommercialInvoiceData[K]) => {
    setCiTemplateData((prev) => ({ ...prev, [key]: value }));
  };

  const updateCiTemplateLayout = <K extends keyof WorkspacePreviewLayout>(key: K, value: WorkspacePreviewLayout[K]) => {
    setCiTemplateLayout((prev) => ({ ...prev, [key]: value }));
  };

  const updatePlTemplateData = <K extends keyof PackingListData>(key: K, value: PackingListData[K]) => {
    setPlTemplateData((prev) => ({ ...prev, [key]: value }));
  };

  const updatePlTemplateLayout = <K extends keyof WorkspacePreviewLayout>(key: K, value: WorkspacePreviewLayout[K]) => {
    setPlTemplateLayout((prev) => ({ ...prev, [key]: value }));
  };

  const updateSoaTemplateData = <K extends keyof StatementOfAccountData>(key: K, value: StatementOfAccountData[K]) => {
    setSoaTemplateData((prev) => ({ ...prev, [key]: value }));
  };

  const updateSoaTemplateLayout = <K extends keyof WorkspacePreviewLayout>(key: K, value: WorkspacePreviewLayout[K]) => {
    setSoaTemplateLayout((prev) => ({ ...prev, [key]: value }));
  };

  const updateInquiryTemplateData = <K extends keyof CustomerInquiryData>(key: K, value: CustomerInquiryData[K]) => {
    setInquiryTemplateData((prev) => ({ ...prev, [key]: value }));
  };

  const updateInquiryTemplateLayout = <K extends keyof WorkspacePreviewLayout>(key: K, value: WorkspacePreviewLayout[K]) => {
    setInquiryTemplateLayout((prev) => ({ ...prev, [key]: value }));
  };

  const updateQuotationTemplateData = <K extends keyof QuotationData>(key: K, value: QuotationData[K]) => {
    setQuotationTemplateData((prev) => ({ ...prev, [key]: value }));
  };

  const updateQuotationTemplateLayout = <K extends keyof WorkspacePreviewLayout>(key: K, value: WorkspacePreviewLayout[K]) => {
    setQuotationTemplateLayout((prev) => ({ ...prev, [key]: value }));
  };

  const renderWorkspaceLayoutPanel = (
    layout: WorkspacePreviewLayout,
    onChange: <K extends keyof WorkspacePreviewLayout>(key: K, value: WorkspacePreviewLayout[K]) => void
  ) => (
    <div className="rounded-lg border border-gray-200 p-3">
      <p className="text-xs font-semibold text-gray-900 mb-3">版式参数</p>
      <div className="grid grid-cols-2 gap-2">
        <div><Label className="text-[11px] text-gray-500">画布宽度(mm)</Label><Input type="number" value={layout.canvasWidthMm} onChange={(e) => onChange('canvasWidthMm', Number(e.target.value) || 210)} className="mt-1 h-7 text-xs" /></div>
        <div><Label className="text-[11px] text-gray-500">最小高度(mm)</Label><Input type="number" value={layout.canvasMinHeightMm} onChange={(e) => onChange('canvasMinHeightMm', Number(e.target.value) || 297)} className="mt-1 h-7 text-xs" /></div>
        <div><Label className="text-[11px] text-gray-500">上边距(mm)</Label><Input type="number" value={layout.contentPaddingTopMm} onChange={(e) => onChange('contentPaddingTopMm', Number(e.target.value) || 10)} className="mt-1 h-7 text-xs" /></div>
        <div><Label className="text-[11px] text-gray-500">下边距(mm)</Label><Input type="number" value={layout.contentPaddingBottomMm} onChange={(e) => onChange('contentPaddingBottomMm', Number(e.target.value) || 12)} className="mt-1 h-7 text-xs" /></div>
        <div><Label className="text-[11px] text-gray-500">字体(pt)</Label><Input type="number" value={layout.fontSizePt} onChange={(e) => onChange('fontSizePt', Number(e.target.value) || 10)} className="mt-1 h-7 text-xs" /></div>
        <div><Label className="text-[11px] text-gray-500">行高</Label><Input type="number" step="0.1" value={layout.lineHeight} onChange={(e) => onChange('lineHeight', Number(e.target.value) || 1.5)} className="mt-1 h-7 text-xs" /></div>
      </div>
    </div>
  );

  const renderWorkspacePreviewWrapper = (
    layout: WorkspacePreviewLayout,
    content: React.ReactNode
  ) => (
    <div
      style={{
        transform: `scale(${previewScale / 100})`,
        transformOrigin: 'top center',
      }}
    >
      {content}
    </div>
  );

  const applyQrVersionRecord = (record: QrTemplateVersionRecord) => {
    setQrTemplateData(cloneQrState(record.data));
    setQrTemplateLayout(cloneQrState(normalizeQrPreviewLayout(record.layout)));
    setQrTemplateTextOverrides(
      cloneQrState(record.textOverrides || buildDefaultQuoteRequirementTextOverrides(record.data))
    );
  };

  const persistTemplateVersion = async (options: {
    templateKey: 'qr' | 'xj' | 'sc' | 'cg' | 'pi' | 'ci' | 'pl' | 'soa' | 'ing' | 'qt';
    status: QrVersionRecordStatus;
    baseVersion: string;
    note: string;
    savedBy: string;
    data: Record<string, any>;
    layout: WorkspacePreviewLayout | QuoteRequirementPreviewLayout;
    textOverrides?: Record<string, any> | null;
  }) => {
    const version =
      options.status === 'published'
        ? bumpSemanticVersion(options.baseVersion, 'minor')
        : `${bumpSemanticVersion(options.baseVersion, 'patch')}-draft`;
    const note = options.note.trim() || (options.status === 'published' ? '发布版本' : '保存草稿');

    setPersistingTemplateAction({
      templateKey: options.templateKey,
      status: options.status,
    });
    try {
      const persistedRecord = await templateCenterService.saveVersion({
        templateKey: options.templateKey,
        version,
        status: options.status,
        note,
        savedBy: options.savedBy,
        data: cloneQrState(options.data),
        layout: cloneQrState(options.layout),
        textOverrides: options.textOverrides || null,
      });

      if (!persistedRecord) {
        toast.error(`Supabase 保存失败，${version} 未写入。`);
        return null;
      }

      return {
        ...persistedRecord,
        note,
        savedBy: persistedRecord.savedBy || options.savedBy,
        data: cloneQrState(persistedRecord.data || options.data),
        layout:
          options.templateKey === 'qr'
            ? normalizeQrPreviewLayout(persistedRecord.layout)
            : normalizeWorkspacePreviewLayout(persistedRecord.layout),
        ...(options.textOverrides
          ? {
              textOverrides: cloneQrState(
                persistedRecord.textOverrides || options.textOverrides
              ),
            }
          : {}),
      };
    } finally {
      setPersistingTemplateAction((current) => (
        current?.templateKey === options.templateKey ? null : current
      ));
    }
  };

  const saveQrVersion = async (status: QrVersionRecordStatus) => {
    const baseVersion = latestQrPublishedRecord?.version || 'v1.0.0';
    const record = await persistTemplateVersion({
      templateKey: 'qr',
      status,
      baseVersion,
      note: qrTemplateVersionNote,
      savedBy: userEmail || 'Template Admin',
      data: qrTemplateData,
      layout: qrTemplateLayout,
      textOverrides: qrTemplateTextOverrides,
    });
    if (!record) return;
    setQrVersionHistory((prev) => [record as QrTemplateVersionRecord, ...prev]);
    toast.success(status === 'published' ? `已发布 ${record.version}` : `已保存草稿 ${record.version}`);
  };

  const applyXjVersionRecord = (record: XjTemplateVersionRecord) => {
    setXjTemplateData(cloneQrState(record.data));
    setXjTemplateLayout(cloneQrState(normalizeWorkspacePreviewLayout(record.layout)));
  };

  const saveXjVersion = async (status: QrVersionRecordStatus) => {
    const baseVersion = latestXjPublishedRecord?.version || 'v1.0.0';
    const record = await persistTemplateVersion({
      templateKey: 'xj',
      status,
      baseVersion,
      note: xjTemplateVersionNote,
      savedBy: userEmail || 'Procurement Admin',
      data: xjTemplateData,
      layout: xjTemplateLayout,
    });
    if (!record) return;
    setXjVersionHistory((prev) => [record as XjTemplateVersionRecord, ...prev]);
    toast.success(status === 'published' ? `已发布 ${record.version}` : `已保存草稿 ${record.version}`);
  };

  const applyScVersionRecord = (record: ScTemplateVersionRecord) => {
    setScTemplateData(cloneQrState(record.data));
    setScTemplateLayout(cloneQrState(normalizeWorkspacePreviewLayout(record.layout)));
  };

  const saveScVersion = async (status: QrVersionRecordStatus) => {
    const baseVersion = latestScPublishedRecord?.version || 'v1.0.0';
    const record = await persistTemplateVersion({
      templateKey: 'sc',
      status,
      baseVersion,
      note: scTemplateVersionNote,
      savedBy: userEmail || 'Contract Admin',
      data: scTemplateData,
      layout: scTemplateLayout,
    });
    if (!record) return;
    setScVersionHistory((prev) => [record as ScTemplateVersionRecord, ...prev]);
    toast.success(status === 'published' ? `已发布 ${record.version}` : `已保存草稿 ${record.version}`);
  };

  const applyCgVersionRecord = (record: CgTemplateVersionRecord) => {
    setCgTemplateData(cloneQrState(record.data));
    setCgTemplateLayout(cloneQrState(normalizeWorkspacePreviewLayout(record.layout)));
  };

  const saveCgVersion = async (status: QrVersionRecordStatus) => {
    const baseVersion = latestCgPublishedRecord?.version || 'v1.0.0';
    const record = await persistTemplateVersion({
      templateKey: 'cg',
      status,
      baseVersion,
      note: cgTemplateVersionNote,
      savedBy: userEmail || 'Procurement Admin',
      data: cgTemplateData,
      layout: cgTemplateLayout,
    });
    if (!record) return;
    setCgVersionHistory((prev) => [record as CgTemplateVersionRecord, ...prev]);
    toast.success(status === 'published' ? `已发布 ${record.version}` : `已保存草稿 ${record.version}`);
  };

  const applyPiVersionRecord = (record: PiTemplateVersionRecord) => {
    setPiTemplateData(cloneQrState(record.data));
    setPiTemplateLayout(cloneQrState(normalizeWorkspacePreviewLayout(record.layout)));
  };

  const savePiVersion = async (status: QrVersionRecordStatus) => {
    const baseVersion = latestPiPublishedRecord?.version || 'v1.0.0';
    const record = await persistTemplateVersion({
      templateKey: 'pi',
      status,
      baseVersion,
      note: piTemplateVersionNote,
      savedBy: userEmail || 'Finance Admin',
      data: piTemplateData,
      layout: piTemplateLayout,
    });
    if (!record) return;
    setPiVersionHistory((prev) => [record as PiTemplateVersionRecord, ...prev]);
    toast.success(status === 'published' ? `已发布 ${record.version}` : `已保存草稿 ${record.version}`);
  };

  const applyCiVersionRecord = (record: CiTemplateVersionRecord) => {
    setCiTemplateData(cloneQrState(record.data));
    setCiTemplateLayout(cloneQrState(normalizeWorkspacePreviewLayout(record.layout)));
  };

  const saveCiVersion = async (status: QrVersionRecordStatus) => {
    const baseVersion = latestCiPublishedRecord?.version || 'v1.0.0';
    const record = await persistTemplateVersion({
      templateKey: 'ci',
      status,
      baseVersion,
      note: ciTemplateVersionNote,
      savedBy: userEmail || 'Docs Admin',
      data: ciTemplateData,
      layout: ciTemplateLayout,
    });
    if (!record) return;
    setCiVersionHistory((prev) => [record as CiTemplateVersionRecord, ...prev]);
    toast.success(status === 'published' ? `已发布 ${record.version}` : `已保存草稿 ${record.version}`);
  };

  const applyPlVersionRecord = (record: PlTemplateVersionRecord) => {
    setPlTemplateData(cloneQrState(record.data));
    setPlTemplateLayout(cloneQrState(normalizeWorkspacePreviewLayout(record.layout)));
  };

  const savePlVersion = async (status: QrVersionRecordStatus) => {
    const baseVersion = latestPlPublishedRecord?.version || 'v1.0.0';
    const record = await persistTemplateVersion({
      templateKey: 'pl',
      status,
      baseVersion,
      note: plTemplateVersionNote,
      savedBy: userEmail || 'Docs Admin',
      data: plTemplateData,
      layout: plTemplateLayout,
    });
    if (!record) return;
    setPlVersionHistory((prev) => [record as PlTemplateVersionRecord, ...prev]);
    toast.success(status === 'published' ? `已发布 ${record.version}` : `已保存草稿 ${record.version}`);
  };

  const applySoaVersionRecord = (record: SoaTemplateVersionRecord) => {
    setSoaTemplateData(cloneQrState(record.data));
    setSoaTemplateLayout(cloneQrState(normalizeWorkspacePreviewLayout(record.layout)));
  };

  const saveSoaVersion = async (status: QrVersionRecordStatus) => {
    const baseVersion = latestSoaPublishedRecord?.version || 'v1.0.0';
    const record = await persistTemplateVersion({
      templateKey: 'soa',
      status,
      baseVersion,
      note: soaTemplateVersionNote,
      savedBy: userEmail || 'Finance Admin',
      data: soaTemplateData,
      layout: soaTemplateLayout,
    });
    if (!record) return;
    setSoaVersionHistory((prev) => [record as SoaTemplateVersionRecord, ...prev]);
    toast.success(status === 'published' ? `已发布 ${record.version}` : `已保存草稿 ${record.version}`);
  };

  const applyInquiryVersionRecord = (record: InquiryTemplateVersionRecord) => {
    setInquiryTemplateData(cloneQrState(record.data));
    setInquiryTemplateLayout(cloneQrState(normalizeWorkspacePreviewLayout(record.layout)));
  };

  const saveInquiryVersion = async (status: QrVersionRecordStatus) => {
    const baseVersion = latestInquiryPublishedRecord?.version || 'v1.0.0';
    const record = await persistTemplateVersion({
      templateKey: 'ing',
      status,
      baseVersion,
      note: inquiryTemplateVersionNote,
      savedBy: userEmail || 'Admin',
      data: inquiryTemplateData,
      layout: inquiryTemplateLayout,
    });
    if (!record) return;
    setInquiryVersionHistory((prev) => [record as InquiryTemplateVersionRecord, ...prev]);
    toast.success(status === 'published' ? `已发布 ${record.version}` : `已保存草稿 ${record.version}`);
  };

  const applyQuotationVersionRecord = (record: QuotationTemplateVersionRecord) => {
    setQuotationTemplateData(cloneQrState(record.data));
    setQuotationTemplateLayout(cloneQrState(normalizeWorkspacePreviewLayout(record.layout)));
  };

  const saveQuotationVersion = async (status: QrVersionRecordStatus) => {
    const baseVersion = latestQuotationPublishedRecord?.version || 'v1.0.0';
    const record = await persistTemplateVersion({
      templateKey: 'qt',
      status,
      baseVersion,
      note: quotationTemplateVersionNote,
      savedBy: userEmail || 'Sales Admin',
      data: quotationTemplateData,
      layout: quotationTemplateLayout,
    });
    if (!record) return;
    setQuotationVersionHistory((prev) => [record as QuotationTemplateVersionRecord, ...prev]);
    toast.success(status === 'published' ? `已发布 ${record.version}` : `已保存草稿 ${record.version}`);
  };

  const handleRestoreLatestQrSaved = () => {
    if (!latestQrVersionRecord) return;
    applyQrVersionRecord(latestQrVersionRecord);
    toast.success(`已恢复最近版本 ${latestQrVersionRecord.version}`);
  };

  const handleRestoreLatestXjSaved = () => {
    if (!latestXjVersionRecord) return;
    applyXjVersionRecord(latestXjVersionRecord);
    toast.success(`已恢复最近版本 ${latestXjVersionRecord.version}`);
  };

  const handleRestoreLatestScSaved = () => {
    if (!latestScVersionRecord) return;
    applyScVersionRecord(latestScVersionRecord);
    toast.success(`已恢复最近版本 ${latestScVersionRecord.version}`);
  };

  const handleRestoreLatestCgSaved = () => {
    if (!latestCgVersionRecord) return;
    applyCgVersionRecord(latestCgVersionRecord);
    toast.success(`已恢复最近版本 ${latestCgVersionRecord.version}`);
  };

  const handleRestoreLatestPiSaved = () => {
    if (!latestPiVersionRecord) return;
    applyPiVersionRecord(latestPiVersionRecord);
    toast.success(`已恢复最近版本 ${latestPiVersionRecord.version}`);
  };

  const handleRestoreLatestCiSaved = () => {
    if (!latestCiVersionRecord) return;
    applyCiVersionRecord(latestCiVersionRecord);
    toast.success(`已恢复最近版本 ${latestCiVersionRecord.version}`);
  };

  const handleRestoreLatestPlSaved = () => {
    if (!latestPlVersionRecord) return;
    applyPlVersionRecord(latestPlVersionRecord);
    toast.success(`已恢复最近版本 ${latestPlVersionRecord.version}`);
  };

  const handleRestoreLatestSoaSaved = () => {
    if (!latestSoaVersionRecord) return;
    applySoaVersionRecord(latestSoaVersionRecord);
    toast.success(`已恢复最近版本 ${latestSoaVersionRecord.version}`);
  };

  const handleRestoreLatestInquirySaved = () => {
    if (!latestInquiryVersionRecord) return;
    applyInquiryVersionRecord(latestInquiryVersionRecord);
    toast.success(`已恢复最近版本 ${latestInquiryVersionRecord.version}`);
  };

  const handleRestoreLatestQuotationSaved = () => {
    if (!latestQuotationVersionRecord) return;
    applyQuotationVersionRecord(latestQuotationVersionRecord);
    toast.success(`已恢复最近版本 ${latestQuotationVersionRecord.version}`);
  };

  const handleTemplateDraftSave = () => {
    if (activeTemplate?.id === 'qr') {
      void saveQrVersion('draft');
      return;
    }
    if (activeTemplate?.id === 'xj') {
      void saveXjVersion('draft');
      return;
    }
    if (activeTemplate?.id === 'sc') {
      void saveScVersion('draft');
      return;
    }
    if (activeTemplate?.id === 'cg') {
      void saveCgVersion('draft');
      return;
    }
    if (activeTemplate?.id === 'pi') {
      void savePiVersion('draft');
      return;
    }
    if (activeTemplate?.id === 'ci') {
      void saveCiVersion('draft');
      return;
    }
    if (activeTemplate?.id === 'pl') {
      void savePlVersion('draft');
      return;
    }
    if (activeTemplate?.id === 'soa') {
      void saveSoaVersion('draft');
      return;
    }
    if (activeTemplate?.id === 'ing') {
      void saveInquiryVersion('draft');
      return;
    }
    if (activeTemplate?.id === 'qt') {
      void saveQuotationVersion('draft');
      return;
    }
    toast.info(`${activeTemplate?.name || '该模板'} 已进入统一编辑工作台，专属保存逻辑下一步接入。`);
  };

  const handleTemplatePublish = () => {
    if (activeTemplate?.id === 'qr') {
      void saveQrVersion('published');
      return;
    }
    if (activeTemplate?.id === 'xj') {
      void saveXjVersion('published');
      return;
    }
    if (activeTemplate?.id === 'sc') {
      void saveScVersion('published');
      return;
    }
    if (activeTemplate?.id === 'cg') {
      void saveCgVersion('published');
      return;
    }
    if (activeTemplate?.id === 'pi') {
      void savePiVersion('published');
      return;
    }
    if (activeTemplate?.id === 'ci') {
      void saveCiVersion('published');
      return;
    }
    if (activeTemplate?.id === 'pl') {
      void savePlVersion('published');
      return;
    }
    if (activeTemplate?.id === 'soa') {
      void saveSoaVersion('published');
      return;
    }
    if (activeTemplate?.id === 'ing') {
      void saveInquiryVersion('published');
      return;
    }
    if (activeTemplate?.id === 'qt') {
      void saveQuotationVersion('published');
      return;
    }
    toast.info(`${activeTemplate?.name || '该模板'} 已进入统一编辑工作台，专属发布逻辑下一步接入。`);
  };

  const handleTemplateRestore = () => {
    if (activeTemplate?.id === 'qr') {
      handleRestoreLatestQrSaved();
      return;
    }
    if (activeTemplate?.id === 'xj') {
      handleRestoreLatestXjSaved();
      return;
    }
    if (activeTemplate?.id === 'sc') {
      handleRestoreLatestScSaved();
      return;
    }
    if (activeTemplate?.id === 'cg') {
      handleRestoreLatestCgSaved();
      return;
    }
    if (activeTemplate?.id === 'pi') {
      handleRestoreLatestPiSaved();
      return;
    }
    if (activeTemplate?.id === 'ci') {
      handleRestoreLatestCiSaved();
      return;
    }
    if (activeTemplate?.id === 'pl') {
      handleRestoreLatestPlSaved();
      return;
    }
    if (activeTemplate?.id === 'soa') {
      handleRestoreLatestSoaSaved();
      return;
    }
    if (activeTemplate?.id === 'ing') {
      handleRestoreLatestInquirySaved();
      return;
    }
    if (activeTemplate?.id === 'qt') {
      handleRestoreLatestQuotationSaved();
      return;
    }
    toast.info(`${activeTemplate?.name || '该模板'} 已进入统一编辑工作台，恢复逻辑下一步接入。`);
  };

  if (userRole === 'admin' && adminWorkspaceMode === 'template-hub') {

    if (templateHubView === 'editor' && activeTemplate) {
      return (
        <div className="flex h-full min-h-0 flex-col overflow-hidden">
          <div className="flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-2 flex-shrink-0">
            <button type="button" onClick={() => setTemplateHubView('detail')} className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1">
              <ChevronRight className="w-3.5 h-3.5 rotate-180" />返回预览
            </button>
            <span className="text-gray-300">|</span>
            <span className="text-sm font-semibold text-gray-900">{activeTemplate.name} 编辑工作台</span>
            <Badge className="h-5 px-2 text-[10px] bg-orange-50 text-orange-700 border-orange-200">{resolvedActiveTemplateMeta?.currentVersion}</Badge>
            {hasActiveTemplateVersionSyncError && (
              <span className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-1">
                当前模板版本历史同步失败，可继续发布并重建版本链
              </span>
            )}
            <div className="ml-auto flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs border-violet-300 text-violet-700 hover:bg-violet-50"
                onClick={handleTemplateDraftSave}
                disabled={isPersistingActiveTemplate}
              >
                {isPersistingActiveTemplate && persistingTemplateAction?.status === 'draft'
                  ? '保存中...'
                  : '保存草稿'}
              </Button>
              <Button
                size="sm"
                className="h-7 text-xs bg-violet-600 hover:bg-violet-700"
                onClick={handleTemplatePublish}
                disabled={isPersistingActiveTemplate}
              >
                {isPersistingActiveTemplate && persistingTemplateAction?.status === 'published'
                  ? '发布中...'
                  : '发布版本'}
              </Button>
            </div>
          </div>
          <div className="flex flex-1 min-h-0 overflow-hidden">
            <div
              className="flex min-h-0 flex-shrink-0 flex-col overflow-hidden border-r border-gray-200 bg-white"
              style={{ width: '25%', minWidth: '340px', maxWidth: '420px' }}
            >
              <div className="sticky top-0 z-10 border-b border-gray-100 bg-gray-50 px-4 py-2.5 flex-shrink-0">
                <p className="text-xs font-semibold text-gray-700">编辑面板</p>
                <p className="text-[10px] text-gray-400 mt-0.5">修改左侧参数，右侧实时预览</p>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto p-4 space-y-4">
                {activeTemplate.id === 'qr' ? (
                  <>
                <div className="rounded-lg border border-violet-200 bg-violet-50 p-3">
                  <p className="text-xs font-semibold text-violet-900">版本操作</p>
                  <p className="mt-1 text-[11px] text-violet-700">发布版：{latestQrPublishedRecord?.version || '未发布'}{latestQrDraftRecord ? `  草稿：${latestQrDraftRecord.version}` : ''}</p>
                  <div className="mt-2">
                    <Label className="text-[11px] text-violet-700">版本备注</Label>
                    <Textarea value={qrTemplateVersionNote} onChange={(e) => setQrTemplateVersionNote(e.target.value)} className="mt-1 min-h-[56px] border-violet-200 bg-white text-xs" />
                  </div>
                  <Button size="sm" variant="outline" className="mt-2 h-7 text-xs w-full" onClick={handleTemplateRestore} disabled={!latestQrVersionRecord}>恢复最近保存</Button>
                </div>
                <div className="rounded-lg border border-gray-200 p-3">
                  <p className="text-xs font-semibold text-gray-900 mb-3">模板标题</p>
                  <div className="space-y-2">
                    <div><Label className="text-[11px] text-gray-500">中文标题</Label><Input value={qrTemplateTextOverrides.documentTitle} onChange={(e) => updateQrTemplateText('documentTitle', e.target.value)} className="mt-1 h-7 text-xs" /></div>
                    <div><Label className="text-[11px] text-gray-500">英文标题</Label><Input value={qrTemplateTextOverrides.documentTitleEn} onChange={(e) => updateQrTemplateText('documentTitleEn', e.target.value)} className="mt-1 h-7 text-xs" /></div>
                    <div><Label className="text-[11px] text-gray-500">业务部说明标题</Label><Input value={qrTemplateTextOverrides.salesInstructionsTitle} onChange={(e) => updateQrTemplateText('salesInstructionsTitle', e.target.value)} className="mt-1 h-7 text-xs" /></div>
                  </div>
                </div>
                <div className="rounded-lg border border-gray-200 p-3">
                  <p className="text-xs font-semibold text-gray-900 mb-3">单据信息</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div><Label className="text-[11px] text-gray-500">QR编号</Label><Input value={qrTemplateData.requirementNo} onChange={(e) => updateQrTemplateData('requirementNo', e.target.value)} className="mt-1 h-7 text-xs" /></div>
                    <div><Label className="text-[11px] text-gray-500">来源询价单</Label><Input value={qrTemplateData.sourceInquiryNo} onChange={(e) => updateQrTemplateData('sourceInquiryNo', e.target.value)} className="mt-1 h-7 text-xs" /></div>
                    <div><Label className="text-[11px] text-gray-500">要求回复日期</Label><Input value={qrTemplateData.requiredResponseDate} onChange={(e) => updateQrTemplateData('requiredResponseDate', e.target.value)} className="mt-1 h-7 text-xs" /></div>
                    <div><Label className="text-[11px] text-gray-500">要求交货日期</Label><Input value={qrTemplateData.requiredDeliveryDate} onChange={(e) => updateQrTemplateData('requiredDeliveryDate', e.target.value)} className="mt-1 h-7 text-xs" /></div>
                  </div>
                </div>
                <div className="rounded-lg border border-gray-200 p-3">
                  <p className="text-xs font-semibold text-gray-900 mb-3">客户信息</p>
                  <div className="space-y-2">
                    <div><Label className="text-[11px] text-gray-500">客户名称</Label><Input value={qrTemplateData.customer.companyName} onChange={(e) => updateQrTemplateData('customer', { ...qrTemplateData.customer, companyName: e.target.value })} className="mt-1 h-7 text-xs" /></div>
                    <div className="grid grid-cols-2 gap-2">
                      <div><Label className="text-[11px] text-gray-500">联系人</Label><Input value={qrTemplateData.customer.contactPerson} onChange={(e) => updateQrTemplateData('customer', { ...qrTemplateData.customer, contactPerson: e.target.value })} className="mt-1 h-7 text-xs" /></div>
                      <div><Label className="text-[11px] text-gray-500">区域</Label><Input value={qrTemplateData.customer.region} onChange={(e) => updateQrTemplateData('customer', { ...qrTemplateData.customer, region: e.target.value })} className="mt-1 h-7 text-xs" /></div>
                    </div>
                  </div>
                </div>
                <div className="rounded-lg border border-gray-200 p-3">
                  <p className="text-xs font-semibold text-gray-900 mb-3">业务部说明 / X</p>
                  <div>
                    <Label className="text-[11px] text-gray-500">双语内容</Label>
                    <Textarea
                      value={qrTemplateData.salesDeptNotes || ''}
                      onChange={(e) => updateQrTemplateData('salesDeptNotes', e.target.value)}
                      className="mt-1 min-h-[180px] text-xs leading-6"
                    />
                  </div>
                </div>
                <div className="rounded-lg border border-gray-200 p-3">
                  <p className="text-xs font-semibold text-gray-900 mb-3">版式参数</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div><Label className="text-[11px] text-gray-500">画布宽度(mm)</Label><Input type="number" value={qrTemplateLayout.canvasWidthMm} onChange={(e) => updateQrTemplateLayout('canvasWidthMm', Number(e.target.value) || 210)} className="mt-1 h-7 text-xs" /></div>
                    <div><Label className="text-[11px] text-gray-500">最小高度(mm)</Label><Input type="number" value={qrTemplateLayout.canvasMinHeightMm} onChange={(e) => updateQrTemplateLayout('canvasMinHeightMm', Number(e.target.value) || 297)} className="mt-1 h-7 text-xs" /></div>
                    <div><Label className="text-[11px] text-gray-500">上边距(mm)</Label><Input type="number" value={qrTemplateLayout.contentPaddingTopMm} onChange={(e) => updateQrTemplateLayout('contentPaddingTopMm', Number(e.target.value) || 10)} className="mt-1 h-7 text-xs" /></div>
                    <div><Label className="text-[11px] text-gray-500">下边距(mm)</Label><Input type="number" value={qrTemplateLayout.contentPaddingBottomMm} onChange={(e) => updateQrTemplateLayout('contentPaddingBottomMm', Number(e.target.value) || 12)} className="mt-1 h-7 text-xs" /></div>
                    <div><Label className="text-[11px] text-gray-500">字体(pt)</Label><Input type="number" value={qrTemplateLayout.fontSizePt} onChange={(e) => updateQrTemplateLayout('fontSizePt', Number(e.target.value) || 10)} className="mt-1 h-7 text-xs" /></div>
                    <div><Label className="text-[11px] text-gray-500">行高</Label><Input type="number" step="0.1" value={qrTemplateLayout.lineHeight} onChange={(e) => updateQrTemplateLayout('lineHeight', Number(e.target.value) || 1.5)} className="mt-1 h-7 text-xs" /></div>
                  </div>
                </div>
                <div className="rounded-lg border border-gray-200 p-3">
                  <p className="text-xs font-semibold text-gray-900 mb-3">底部说明</p>
                  <div className="space-y-2">
                    <div><Label className="text-[11px] text-gray-500">底部说明 1</Label><Textarea value={qrTemplateTextOverrides.footerNote1} onChange={(e) => updateQrTemplateText('footerNote1', e.target.value)} className="mt-1 min-h-[52px] text-xs" /></div>
                    <div><Label className="text-[11px] text-gray-500">底部说明 2</Label><Textarea value={qrTemplateTextOverrides.footerNote2} onChange={(e) => updateQrTemplateText('footerNote2', e.target.value)} className="mt-1 min-h-[52px] text-xs" /></div>
                  </div>
                </div>
                <div className="rounded-lg border border-gray-200 p-3">
                  <div className="flex items-center justify-between mb-3"><p className="text-xs font-semibold text-gray-900">版本记录</p><Badge variant="outline" className="text-[10px]">{qrVersionHistory.length} 条</Badge></div>
                  <div className="space-y-2">
                    {qrVersionHistory.map((record) => (
                      <div key={record.id} className="rounded border border-gray-200 bg-gray-50 p-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-semibold text-gray-900">{record.version}</span>
                              <Badge className={`h-4 px-1 text-[10px] border ${record.status === 'published' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>{record.status === 'published' ? '已发布' : '草稿'}</Badge>
                            </div>
                            <p className="mt-0.5 text-[10px] text-gray-400">{record.savedAt}</p>
                            <p className="mt-0.5 text-[11px] text-gray-600">{record.note}</p>
                          </div>
                          <Button size="sm" variant="outline" className="h-6 text-[10px] px-2 flex-shrink-0" onClick={() => { applyQrVersionRecord(record); toast.success(`已加载版本 ${record.version}`); }}>恢复</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                  </>
                ) : activeTemplate.id === 'xj' ? (
                  <>
                    <div className="rounded-lg border border-violet-200 bg-violet-50 p-3">
                      <p className="text-xs font-semibold text-violet-900">版本操作</p>
                      <p className="mt-1 text-[11px] text-violet-700">发布版：{latestXjPublishedRecord?.version || '未发布'}{latestXjDraftRecord ? `  草稿：${latestXjDraftRecord.version}` : ''}</p>
                      <div className="mt-2">
                        <Label className="text-[11px] text-violet-700">版本备注</Label>
                        <Textarea
                          value={xjTemplateVersionNote}
                          onChange={(e) => setXjTemplateVersionNote(e.target.value)}
                          className="mt-1 min-h-[56px] border-violet-200 bg-white text-xs"
                        />
                      </div>
                      <Button size="sm" variant="outline" className="mt-2 h-7 text-xs w-full" onClick={handleTemplateRestore} disabled={!latestXjVersionRecord}>恢复最近保存</Button>
                    </div>
                    <div className="rounded-lg border border-gray-200 p-3">
                      <div className="mb-3 flex items-center justify-between">
                        <p className="text-xs font-semibold text-gray-900">版本记录</p>
                        <Badge variant="outline" className="text-[10px]">{xjVersionHistory.length} 条</Badge>
                      </div>
                      <div className="space-y-2">
                        {xjVersionHistory.map((record) => (
                          <div key={record.id} className="rounded border border-gray-200 bg-gray-50 p-2.5">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-semibold text-gray-900">{record.version}</span>
                                  <Badge className={`h-4 px-1 text-[10px] border ${record.status === 'published' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>{record.status === 'published' ? '已发布' : '草稿'}</Badge>
                                </div>
                                <p className="mt-0.5 text-[10px] text-gray-400">{record.savedAt}</p>
                                <p className="mt-0.5 text-[11px] text-gray-600">{record.note}</p>
                              </div>
                              <Button size="sm" variant="outline" className="h-6 flex-shrink-0 px-2 text-[10px]" onClick={() => { applyXjVersionRecord(record); toast.success(`已加载版本 ${record.version}`); }}>恢复</Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    {renderWorkspaceLayoutPanel(xjTemplateLayout, updateXjTemplateLayout)}
                    <div className="rounded-lg border border-gray-200 p-3">
                      <p className="text-xs font-semibold text-gray-900 mb-3">单据信息</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div><Label className="text-[11px] text-gray-500">XJ 编号</Label><Input value={xjTemplateData.xjNo} onChange={(e) => updateXjTemplateData('xjNo', e.target.value)} className="mt-1 h-7 text-xs" /></div>
                        <div><Label className="text-[11px] text-gray-500">询价日期</Label><Input value={xjTemplateData.xjDate} onChange={(e) => updateXjTemplateData('xjDate', e.target.value)} className="mt-1 h-7 text-xs" /></div>
                        <div><Label className="text-[11px] text-gray-500">回复截止</Label><Input value={xjTemplateData.requiredResponseDate} onChange={(e) => updateXjTemplateData('requiredResponseDate', e.target.value)} className="mt-1 h-7 text-xs" /></div>
                        <div><Label className="text-[11px] text-gray-500">要求交期</Label><Input value={xjTemplateData.requiredDeliveryDate} onChange={(e) => updateXjTemplateData('requiredDeliveryDate', e.target.value)} className="mt-1 h-7 text-xs" /></div>
                      </div>
                    </div>
                    <div className="rounded-lg border border-gray-200 p-3">
                      <p className="text-xs font-semibold text-gray-900 mb-3">采购方信息</p>
                      <div className="space-y-2">
                        <div><Label className="text-[11px] text-gray-500">公司名称</Label><Input value={xjTemplateData.buyer.name} onChange={(e) => updateXjTemplateData('buyer', { ...xjTemplateData.buyer, name: e.target.value })} className="mt-1 h-7 text-xs" /></div>
                        <div><Label className="text-[11px] text-gray-500">英文名称</Label><Input value={xjTemplateData.buyer.nameEn} onChange={(e) => updateXjTemplateData('buyer', { ...xjTemplateData.buyer, nameEn: e.target.value })} className="mt-1 h-7 text-xs" /></div>
                        <div className="grid grid-cols-2 gap-2">
                          <div><Label className="text-[11px] text-gray-500">联系人</Label><Input value={xjTemplateData.buyer.contactPerson} onChange={(e) => updateXjTemplateData('buyer', { ...xjTemplateData.buyer, contactPerson: e.target.value })} className="mt-1 h-7 text-xs" /></div>
                          <div><Label className="text-[11px] text-gray-500">邮箱</Label><Input value={xjTemplateData.buyer.email} onChange={(e) => updateXjTemplateData('buyer', { ...xjTemplateData.buyer, email: e.target.value })} className="mt-1 h-7 text-xs" /></div>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-lg border border-gray-200 p-3">
                      <p className="text-xs font-semibold text-gray-900 mb-3">供应商信息</p>
                      <div className="space-y-2">
                        <div><Label className="text-[11px] text-gray-500">供应商名称</Label><Input value={xjTemplateData.supplier.companyName} onChange={(e) => updateXjTemplateData('supplier', { ...xjTemplateData.supplier, companyName: e.target.value })} className="mt-1 h-7 text-xs" /></div>
                        <div className="grid grid-cols-2 gap-2">
                          <div><Label className="text-[11px] text-gray-500">联系人</Label><Input value={xjTemplateData.supplier.contactPerson} onChange={(e) => updateXjTemplateData('supplier', { ...xjTemplateData.supplier, contactPerson: e.target.value })} className="mt-1 h-7 text-xs" /></div>
                          <div><Label className="text-[11px] text-gray-500">邮箱</Label><Input value={xjTemplateData.supplier.email} onChange={(e) => updateXjTemplateData('supplier', { ...xjTemplateData.supplier, email: e.target.value })} className="mt-1 h-7 text-xs" /></div>
                        </div>
                        <div><Label className="text-[11px] text-gray-500">供应商地址</Label><Textarea value={xjTemplateData.supplier.address} onChange={(e) => updateXjTemplateData('supplier', { ...xjTemplateData.supplier, address: e.target.value })} className="mt-1 min-h-[56px] text-xs" /></div>
                      </div>
                    </div>
                    <div className="rounded-lg border border-gray-200 p-3">
                      <p className="text-xs font-semibold text-gray-900 mb-3">产品清单</p>
                      <div className="space-y-3">
                        {xjTemplateData.products.map((product, index) => (
                          <div key={`${product.no}-${index}`} className="rounded border border-gray-100 bg-gray-50 p-2.5">
                            <div className="mb-2 text-[11px] font-semibold text-gray-700">产品 {product.no}</div>
                            <div className="space-y-2">
                              <div><Label className="text-[11px] text-gray-500">产品名称</Label><Input value={product.description} onChange={(e) => updateXjTemplateData('products', xjTemplateData.products.map((item, itemIndex) => itemIndex === index ? { ...item, description: e.target.value } : item))} className="mt-1 h-7 text-xs" /></div>
                              <div><Label className="text-[11px] text-gray-500">规格</Label><Textarea value={product.specification} onChange={(e) => updateXjTemplateData('products', xjTemplateData.products.map((item, itemIndex) => itemIndex === index ? { ...item, specification: e.target.value } : item))} className="mt-1 min-h-[52px] text-xs" /></div>
                              <div className="grid grid-cols-2 gap-2">
                                <div><Label className="text-[11px] text-gray-500">数量</Label><Input type="number" value={product.quantity} onChange={(e) => updateXjTemplateData('products', xjTemplateData.products.map((item, itemIndex) => itemIndex === index ? { ...item, quantity: Number(e.target.value) || 0 } : item))} className="mt-1 h-7 text-xs" /></div>
                                <div><Label className="text-[11px] text-gray-500">目标价格</Label><Input value={product.targetPrice || ''} onChange={(e) => updateXjTemplateData('products', xjTemplateData.products.map((item, itemIndex) => itemIndex === index ? { ...item, targetPrice: e.target.value } : item))} className="mt-1 h-7 text-xs" /></div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-lg border border-gray-200 p-3">
                      <p className="text-xs font-semibold text-gray-900 mb-3">询价条款</p>
                      <div className="space-y-2">
                        <div><Label className="text-[11px] text-gray-500">付款方式</Label><Textarea value={xjTemplateData.terms.paymentTerms || ''} onChange={(e) => updateXjTemplateData('terms', { ...xjTemplateData.terms, paymentTerms: e.target.value })} className="mt-1 min-h-[52px] text-xs" /></div>
                        <div><Label className="text-[11px] text-gray-500">交货条款</Label><Textarea value={xjTemplateData.terms.deliveryTerms || ''} onChange={(e) => updateXjTemplateData('terms', { ...xjTemplateData.terms, deliveryTerms: e.target.value })} className="mt-1 min-h-[52px] text-xs" /></div>
                        <div><Label className="text-[11px] text-gray-500">包装要求</Label><Textarea value={xjTemplateData.terms.packaging || ''} onChange={(e) => updateXjTemplateData('terms', { ...xjTemplateData.terms, packaging: e.target.value })} className="mt-1 min-h-[56px] text-xs" /></div>
                        <div><Label className="text-[11px] text-gray-500">其他说明</Label><Textarea value={xjTemplateData.terms.remarks || ''} onChange={(e) => updateXjTemplateData('terms', { ...xjTemplateData.terms, remarks: e.target.value })} className="mt-1 min-h-[64px] text-xs" /></div>
                      </div>
                    </div>
                  </>
                ) : activeTemplate.id === 'sc' ? (
                  <>
                    <div className="rounded-lg border border-violet-200 bg-violet-50 p-3">
                      <p className="text-xs font-semibold text-violet-900">版本操作</p>
                      <p className="mt-1 text-[11px] text-violet-700">发布版：{latestScPublishedRecord?.version || '未发布'}{latestScDraftRecord ? `  草稿：${latestScDraftRecord.version}` : ''}</p>
                      <div className="mt-2">
                        <Label className="text-[11px] text-violet-700">版本备注</Label>
                        <Textarea
                          value={scTemplateVersionNote}
                          onChange={(e) => setScTemplateVersionNote(e.target.value)}
                          className="mt-1 min-h-[56px] border-violet-200 bg-white text-xs"
                        />
                      </div>
                      <Button size="sm" variant="outline" className="mt-2 h-7 text-xs w-full" onClick={handleTemplateRestore} disabled={!latestScVersionRecord}>恢复最近保存</Button>
                    </div>
                    <div className="rounded-lg border border-gray-200 p-3">
                      <div className="mb-3 flex items-center justify-between">
                        <p className="text-xs font-semibold text-gray-900">版本记录</p>
                        <Badge variant="outline" className="text-[10px]">{scVersionHistory.length} 条</Badge>
                      </div>
                      <div className="space-y-2">
                        {scVersionHistory.map((record) => (
                          <div key={record.id} className="rounded border border-gray-200 bg-gray-50 p-2.5">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-semibold text-gray-900">{record.version}</span>
                                  <Badge className={`h-4 px-1 text-[10px] border ${record.status === 'published' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>{record.status === 'published' ? '已发布' : '草稿'}</Badge>
                                </div>
                                <p className="mt-0.5 text-[10px] text-gray-400">{record.savedAt}</p>
                                <p className="mt-0.5 text-[11px] text-gray-600">{record.note}</p>
                              </div>
                              <Button size="sm" variant="outline" className="h-6 flex-shrink-0 px-2 text-[10px]" onClick={() => { applyScVersionRecord(record); toast.success(`已加载版本 ${record.version}`); }}>恢复</Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    {renderWorkspaceLayoutPanel(scTemplateLayout, updateScTemplateLayout)}
                    <div className="rounded-lg border border-gray-200 p-3">
                      <p className="text-xs font-semibold text-gray-900 mb-3">合同信息</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div><Label className="text-[11px] text-gray-500">合同编号</Label><Input value={scTemplateData.contractNo} onChange={(e) => updateScTemplateData('contractNo', e.target.value)} className="mt-1 h-7 text-xs" /></div>
                        <div><Label className="text-[11px] text-gray-500">合同日期</Label><Input value={scTemplateData.contractDate} onChange={(e) => updateScTemplateData('contractDate', e.target.value)} className="mt-1 h-7 text-xs" /></div>
                        <div><Label className="text-[11px] text-gray-500">报价单号</Label><Input value={scTemplateData.quotationNo || ''} onChange={(e) => updateScTemplateData('quotationNo', e.target.value)} className="mt-1 h-7 text-xs" /></div>
                        <div><Label className="text-[11px] text-gray-500">区域</Label><Input value={scTemplateData.region} onChange={(e) => updateScTemplateData('region', (e.target.value || 'NA') as SalesContractData['region'])} className="mt-1 h-7 text-xs" /></div>
                      </div>
                    </div>
                    <div className="rounded-lg border border-gray-200 p-3">
                      <p className="text-xs font-semibold text-gray-900 mb-3">卖方信息</p>
                      <div className="space-y-2">
                        <div><Label className="text-[11px] text-gray-500">公司名称</Label><Input value={scTemplateData.seller.nameEn} onChange={(e) => updateScTemplateData('seller', { ...scTemplateData.seller, nameEn: e.target.value })} className="mt-1 h-7 text-xs" /></div>
                        <div><Label className="text-[11px] text-gray-500">地址</Label><Textarea value={scTemplateData.seller.addressEn} onChange={(e) => updateScTemplateData('seller', { ...scTemplateData.seller, addressEn: e.target.value })} className="mt-1 min-h-[52px] text-xs" /></div>
                        <div className="grid grid-cols-2 gap-2">
                          <div><Label className="text-[11px] text-gray-500">电话</Label><Input value={scTemplateData.seller.tel} onChange={(e) => updateScTemplateData('seller', { ...scTemplateData.seller, tel: e.target.value })} className="mt-1 h-7 text-xs" /></div>
                          <div><Label className="text-[11px] text-gray-500">邮箱</Label><Input value={scTemplateData.seller.email} onChange={(e) => updateScTemplateData('seller', { ...scTemplateData.seller, email: e.target.value })} className="mt-1 h-7 text-xs" /></div>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-lg border border-gray-200 p-3">
                      <p className="text-xs font-semibold text-gray-900 mb-3">买方信息</p>
                      <div className="space-y-2">
                        <div><Label className="text-[11px] text-gray-500">客户名称</Label><Input value={scTemplateData.buyer.companyName} onChange={(e) => updateScTemplateData('buyer', { ...scTemplateData.buyer, companyName: e.target.value })} className="mt-1 h-7 text-xs" /></div>
                        <div><Label className="text-[11px] text-gray-500">客户地址</Label><Textarea value={scTemplateData.buyer.address} onChange={(e) => updateScTemplateData('buyer', { ...scTemplateData.buyer, address: e.target.value })} className="mt-1 min-h-[52px] text-xs" /></div>
                        <div className="grid grid-cols-2 gap-2">
                          <div><Label className="text-[11px] text-gray-500">联系人</Label><Input value={scTemplateData.buyer.contactPerson} onChange={(e) => updateScTemplateData('buyer', { ...scTemplateData.buyer, contactPerson: e.target.value })} className="mt-1 h-7 text-xs" /></div>
                          <div><Label className="text-[11px] text-gray-500">邮箱</Label><Input value={scTemplateData.buyer.email} onChange={(e) => updateScTemplateData('buyer', { ...scTemplateData.buyer, email: e.target.value })} className="mt-1 h-7 text-xs" /></div>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-lg border border-gray-200 p-3">
                      <p className="text-xs font-semibold text-gray-900 mb-3">产品清单</p>
                      <div className="space-y-3">
                        {scTemplateData.products.map((product, index) => (
                          <div key={`${product.no}-${index}`} className="rounded border border-gray-100 bg-gray-50 p-2.5">
                            <div className="mb-2 text-[11px] font-semibold text-gray-700">产品 {product.no}</div>
                            <div className="space-y-2">
                              <div><Label className="text-[11px] text-gray-500">产品描述</Label><Textarea value={product.description} onChange={(e) => updateScTemplateData('products', scTemplateData.products.map((item, itemIndex) => itemIndex === index ? { ...item, description: e.target.value } : item))} className="mt-1 min-h-[52px] text-xs" /></div>
                              <div className="grid grid-cols-2 gap-2">
                                <div><Label className="text-[11px] text-gray-500">数量</Label><Input type="number" value={product.quantity} onChange={(e) => updateScTemplateData('products', scTemplateData.products.map((item, itemIndex) => itemIndex === index ? { ...item, quantity: Number(e.target.value) || 0 } : item))} className="mt-1 h-7 text-xs" /></div>
                                <div><Label className="text-[11px] text-gray-500">单价</Label><Input type="number" value={product.unitPrice} onChange={(e) => updateScTemplateData('products', scTemplateData.products.map((item, itemIndex) => itemIndex === index ? { ...item, unitPrice: Number(e.target.value) || 0, amount: (Number(e.target.value) || 0) * item.quantity } : item))} className="mt-1 h-7 text-xs" /></div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-lg border border-gray-200 p-3">
                      <p className="text-xs font-semibold text-gray-900 mb-3">关键条款</p>
                      <div className="space-y-2">
                        <div><Label className="text-[11px] text-gray-500">贸易条款</Label><Input value={scTemplateData.terms.tradeTerms} onChange={(e) => updateScTemplateData('terms', { ...scTemplateData.terms, tradeTerms: e.target.value })} className="mt-1 h-7 text-xs" /></div>
                        <div><Label className="text-[11px] text-gray-500">付款条款</Label><Textarea value={scTemplateData.terms.paymentTerms} onChange={(e) => updateScTemplateData('terms', { ...scTemplateData.terms, paymentTerms: e.target.value })} className="mt-1 min-h-[52px] text-xs" /></div>
                        <div><Label className="text-[11px] text-gray-500">交期</Label><Input value={scTemplateData.terms.deliveryTime} onChange={(e) => updateScTemplateData('terms', { ...scTemplateData.terms, deliveryTime: e.target.value })} className="mt-1 h-7 text-xs" /></div>
                        <div><Label className="text-[11px] text-gray-500">包装</Label><Textarea value={scTemplateData.terms.packing} onChange={(e) => updateScTemplateData('terms', { ...scTemplateData.terms, packing: e.target.value })} className="mt-1 min-h-[56px] text-xs" /></div>
                      </div>
                    </div>
                  </>
                ) : activeTemplate.id === 'cg' ? (
                  <>
                    <div className="rounded-lg border border-violet-200 bg-violet-50 p-3">
                      <p className="text-xs font-semibold text-violet-900">版本操作</p>
                      <p className="mt-1 text-[11px] text-violet-700">发布版：{latestCgPublishedRecord?.version || '未发布'}{latestCgDraftRecord ? `  草稿：${latestCgDraftRecord.version}` : ''}</p>
                      <div className="mt-2">
                        <Label className="text-[11px] text-violet-700">版本备注</Label>
                        <Textarea
                          value={cgTemplateVersionNote}
                          onChange={(e) => setCgTemplateVersionNote(e.target.value)}
                          className="mt-1 min-h-[56px] border-violet-200 bg-white text-xs"
                        />
                      </div>
                      <Button size="sm" variant="outline" className="mt-2 h-7 text-xs w-full" onClick={handleTemplateRestore} disabled={!latestCgVersionRecord}>恢复最近保存</Button>
                    </div>
                    <div className="rounded-lg border border-gray-200 p-3">
                      <div className="mb-3 flex items-center justify-between">
                        <p className="text-xs font-semibold text-gray-900">版本记录</p>
                        <Badge variant="outline" className="text-[10px]">{cgVersionHistory.length} 条</Badge>
                      </div>
                      <div className="space-y-2">
                        {cgVersionHistory.map((record) => (
                          <div key={record.id} className="rounded border border-gray-200 bg-gray-50 p-2.5">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-semibold text-gray-900">{record.version}</span>
                                  <Badge className={`h-4 px-1 text-[10px] border ${record.status === 'published' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>{record.status === 'published' ? '已发布' : '草稿'}</Badge>
                                </div>
                                <p className="mt-0.5 text-[10px] text-gray-400">{record.savedAt}</p>
                                <p className="mt-0.5 text-[11px] text-gray-600">{record.note}</p>
                              </div>
                              <Button size="sm" variant="outline" className="h-6 flex-shrink-0 px-2 text-[10px]" onClick={() => { applyCgVersionRecord(record); toast.success(`已加载版本 ${record.version}`); }}>恢复</Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    {renderWorkspaceLayoutPanel(cgTemplateLayout, updateCgTemplateLayout)}
                    <div className="rounded-lg border border-gray-200 p-3">
                      <p className="mb-3 text-xs font-semibold text-gray-900">合同信息</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div><Label className="text-[11px] text-gray-500">CG 编号</Label><Input value={cgTemplateData.poNo} onChange={(e) => updateCgTemplateData('poNo', e.target.value)} className="mt-1 h-7 text-xs" /></div>
                        <div><Label className="text-[11px] text-gray-500">合同日期</Label><Input value={cgTemplateData.poDate} onChange={(e) => updateCgTemplateData('poDate', e.target.value)} className="mt-1 h-7 text-xs" /></div>
                        <div className="col-span-2"><Label className="text-[11px] text-gray-500">要求交期</Label><Input value={cgTemplateData.requiredDeliveryDate} onChange={(e) => updateCgTemplateData('requiredDeliveryDate', e.target.value)} className="mt-1 h-7 text-xs" /></div>
                      </div>
                    </div>
                    <div className="rounded-lg border border-gray-200 p-3">
                      <p className="mb-3 text-xs font-semibold text-gray-900">采购方信息</p>
                      <div className="space-y-2">
                        <div><Label className="text-[11px] text-gray-500">公司名称</Label><Input value={cgTemplateData.buyer.name} onChange={(e) => updateCgTemplateData('buyer', { ...cgTemplateData.buyer, name: e.target.value })} className="mt-1 h-7 text-xs" /></div>
                        <div><Label className="text-[11px] text-gray-500">英文名称</Label><Input value={cgTemplateData.buyer.nameEn} onChange={(e) => updateCgTemplateData('buyer', { ...cgTemplateData.buyer, nameEn: e.target.value })} className="mt-1 h-7 text-xs" /></div>
                        <div className="grid grid-cols-2 gap-2">
                          <div><Label className="text-[11px] text-gray-500">联系人</Label><Input value={cgTemplateData.buyer.contactPerson} onChange={(e) => updateCgTemplateData('buyer', { ...cgTemplateData.buyer, contactPerson: e.target.value })} className="mt-1 h-7 text-xs" /></div>
                          <div><Label className="text-[11px] text-gray-500">邮箱</Label><Input value={cgTemplateData.buyer.email} onChange={(e) => updateCgTemplateData('buyer', { ...cgTemplateData.buyer, email: e.target.value })} className="mt-1 h-7 text-xs" /></div>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-lg border border-gray-200 p-3">
                      <p className="mb-3 text-xs font-semibold text-gray-900">供应商信息</p>
                      <div className="space-y-2">
                        <div><Label className="text-[11px] text-gray-500">供应商名称</Label><Input value={cgTemplateData.supplier.companyName} onChange={(e) => updateCgTemplateData('supplier', { ...cgTemplateData.supplier, companyName: e.target.value })} className="mt-1 h-7 text-xs" /></div>
                        <div><Label className="text-[11px] text-gray-500">供应商地址</Label><Textarea value={cgTemplateData.supplier.address} onChange={(e) => updateCgTemplateData('supplier', { ...cgTemplateData.supplier, address: e.target.value })} className="mt-1 min-h-[52px] text-xs" /></div>
                        <div className="grid grid-cols-2 gap-2">
                          <div><Label className="text-[11px] text-gray-500">联系人</Label><Input value={cgTemplateData.supplier.contactPerson} onChange={(e) => updateCgTemplateData('supplier', { ...cgTemplateData.supplier, contactPerson: e.target.value })} className="mt-1 h-7 text-xs" /></div>
                          <div><Label className="text-[11px] text-gray-500">邮箱</Label><Input value={cgTemplateData.supplier.email} onChange={(e) => updateCgTemplateData('supplier', { ...cgTemplateData.supplier, email: e.target.value })} className="mt-1 h-7 text-xs" /></div>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-lg border border-gray-200 p-3">
                      <p className="mb-3 text-xs font-semibold text-gray-900">产品清单</p>
                      <div className="space-y-3">
                        {cgTemplateData.products.map((product, index) => (
                          <div key={`${product.no}-${index}`} className="rounded border border-gray-100 bg-gray-50 p-2.5">
                            <div className="mb-2 text-[11px] font-semibold text-gray-700">产品 {product.no}</div>
                            <div className="space-y-2">
                              <div><Label className="text-[11px] text-gray-500">物料编码</Label><Input value={product.itemCode || ''} onChange={(e) => updateCgTemplateData('products', cgTemplateData.products.map((item, itemIndex) => itemIndex === index ? { ...item, itemCode: e.target.value } : item))} className="mt-1 h-7 text-xs" /></div>
                              <div><Label className="text-[11px] text-gray-500">产品描述</Label><Textarea value={product.description} onChange={(e) => updateCgTemplateData('products', cgTemplateData.products.map((item, itemIndex) => itemIndex === index ? { ...item, description: e.target.value } : item))} className="mt-1 min-h-[52px] text-xs" /></div>
                              <div className="grid grid-cols-2 gap-2">
                                <div><Label className="text-[11px] text-gray-500">数量</Label><Input type="number" value={product.quantity} onChange={(e) => updateCgTemplateData('products', cgTemplateData.products.map((item, itemIndex) => itemIndex === index ? { ...item, quantity: Number(e.target.value) || 0, amount: (Number(e.target.value) || 0) * item.unitPrice } : item))} className="mt-1 h-7 text-xs" /></div>
                                <div><Label className="text-[11px] text-gray-500">单价</Label><Input type="number" value={product.unitPrice} onChange={(e) => updateCgTemplateData('products', cgTemplateData.products.map((item, itemIndex) => itemIndex === index ? { ...item, unitPrice: Number(e.target.value) || 0, amount: (Number(e.target.value) || 0) * item.quantity } : item))} className="mt-1 h-7 text-xs" /></div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-lg border border-gray-200 p-3">
                      <p className="mb-3 text-xs font-semibold text-gray-900">关键条款</p>
                      <div className="space-y-2">
                        <div><Label className="text-[11px] text-gray-500">付款条款</Label><Textarea value={cgTemplateData.terms.paymentTerms} onChange={(e) => updateCgTemplateData('terms', { ...cgTemplateData.terms, paymentTerms: e.target.value })} className="mt-1 min-h-[52px] text-xs" /></div>
                        <div><Label className="text-[11px] text-gray-500">交货条款</Label><Input value={cgTemplateData.terms.deliveryTerms} onChange={(e) => updateCgTemplateData('terms', { ...cgTemplateData.terms, deliveryTerms: e.target.value })} className="mt-1 h-7 text-xs" /></div>
                        <div><Label className="text-[11px] text-gray-500">交货地址</Label><Textarea value={cgTemplateData.terms.deliveryAddress} onChange={(e) => updateCgTemplateData('terms', { ...cgTemplateData.terms, deliveryAddress: e.target.value })} className="mt-1 min-h-[56px] text-xs" /></div>
                        <div><Label className="text-[11px] text-gray-500">包装要求</Label><Textarea value={cgTemplateData.terms.packaging || ''} onChange={(e) => updateCgTemplateData('terms', { ...cgTemplateData.terms, packaging: e.target.value })} className="mt-1 min-h-[56px] text-xs" /></div>
                      </div>
                    </div>
                  </>
                ) : activeTemplate.id === 'pi' ? (
                  <>
                    <div className="rounded-lg border border-violet-200 bg-violet-50 p-3">
                      <p className="text-xs font-semibold text-violet-900">版本操作</p>
                      <p className="mt-1 text-[11px] text-violet-700">发布版：{latestPiPublishedRecord?.version || '未发布'}{latestPiDraftRecord ? `  草稿：${latestPiDraftRecord.version}` : ''}</p>
                      <div className="mt-2">
                        <Label className="text-[11px] text-violet-700">版本备注</Label>
                        <Textarea
                          value={piTemplateVersionNote}
                          onChange={(e) => setPiTemplateVersionNote(e.target.value)}
                          className="mt-1 min-h-[56px] border-violet-200 bg-white text-xs"
                        />
                      </div>
                      <Button size="sm" variant="outline" className="mt-2 h-7 text-xs w-full" onClick={handleTemplateRestore} disabled={!latestPiVersionRecord}>恢复最近保存</Button>
                    </div>
                    <div className="rounded-lg border border-gray-200 p-3">
                      <div className="mb-3 flex items-center justify-between">
                        <p className="text-xs font-semibold text-gray-900">版本记录</p>
                        <Badge variant="outline" className="text-[10px]">{piVersionHistory.length} 条</Badge>
                      </div>
                      <div className="space-y-2">
                        {piVersionHistory.map((record) => (
                          <div key={record.id} className="rounded border border-gray-200 bg-gray-50 p-2.5">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-semibold text-gray-900">{record.version}</span>
                                  <Badge className={`h-4 px-1 text-[10px] border ${record.status === 'published' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>{record.status === 'published' ? '已发布' : '草稿'}</Badge>
                                </div>
                                <p className="mt-0.5 text-[10px] text-gray-400">{record.savedAt}</p>
                                <p className="mt-0.5 text-[11px] text-gray-600">{record.note}</p>
                              </div>
                              <Button size="sm" variant="outline" className="h-6 flex-shrink-0 px-2 text-[10px]" onClick={() => { applyPiVersionRecord(record); toast.success(`已加载版本 ${record.version}`); }}>恢复</Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    {renderWorkspaceLayoutPanel(piTemplateLayout, updatePiTemplateLayout)}
                    <div className="rounded-lg border border-gray-200 p-3">
                      <p className="mb-3 text-xs font-semibold text-gray-900">发票信息</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div><Label className="text-[11px] text-gray-500">发票编号</Label><Input value={piTemplateData.invoiceNo} onChange={(e) => updatePiTemplateData('invoiceNo', e.target.value)} className="mt-1 h-7 text-xs" /></div>
                        <div><Label className="text-[11px] text-gray-500">日期</Label><Input value={piTemplateData.invoiceDate} onChange={(e) => updatePiTemplateData('invoiceDate', e.target.value)} className="mt-1 h-7 text-xs" /></div>
                        <div><Label className="text-[11px] text-gray-500">Cost No.</Label><Input value={piTemplateData.costNo || ''} onChange={(e) => updatePiTemplateData('costNo', e.target.value)} className="mt-1 h-7 text-xs" /></div>
                        <div><Label className="text-[11px] text-gray-500">S/C No.</Label><Input value={piTemplateData.scNo || ''} onChange={(e) => updatePiTemplateData('scNo', e.target.value)} className="mt-1 h-7 text-xs" /></div>
                      </div>
                    </div>
                    <div className="rounded-lg border border-gray-200 p-3">
                      <p className="mb-3 text-xs font-semibold text-gray-900">卖方信息</p>
                      <div className="space-y-2">
                        <div><Label className="text-[11px] text-gray-500">英文公司名</Label><Input value={piTemplateData.seller.nameEn} onChange={(e) => updatePiTemplateData('seller', { ...piTemplateData.seller, nameEn: e.target.value })} className="mt-1 h-7 text-xs" /></div>
                        <div className="grid grid-cols-2 gap-2">
                          <div><Label className="text-[11px] text-gray-500">手机</Label><Input value={piTemplateData.seller.cell || ''} onChange={(e) => updatePiTemplateData('seller', { ...piTemplateData.seller, cell: e.target.value })} className="mt-1 h-7 text-xs" /></div>
                          <div><Label className="text-[11px] text-gray-500">邮箱</Label><Input value={piTemplateData.seller.email || ''} onChange={(e) => updatePiTemplateData('seller', { ...piTemplateData.seller, email: e.target.value })} className="mt-1 h-7 text-xs" /></div>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-lg border border-gray-200 p-3">
                      <p className="mb-3 text-xs font-semibold text-gray-900">买方信息</p>
                      <div className="space-y-2">
                        <div><Label className="text-[11px] text-gray-500">客户名称</Label><Input value={piTemplateData.buyer.companyName} onChange={(e) => updatePiTemplateData('buyer', { ...piTemplateData.buyer, companyName: e.target.value })} className="mt-1 h-7 text-xs" /></div>
                        <div><Label className="text-[11px] text-gray-500">P.O. Box</Label><Input value={piTemplateData.buyer.poBox || ''} onChange={(e) => updatePiTemplateData('buyer', { ...piTemplateData.buyer, poBox: e.target.value })} className="mt-1 h-7 text-xs" /></div>
                        <div><Label className="text-[11px] text-gray-500">联系人</Label><Input value={piTemplateData.buyer.contactPerson || ''} onChange={(e) => updatePiTemplateData('buyer', { ...piTemplateData.buyer, contactPerson: e.target.value })} className="mt-1 h-7 text-xs" /></div>
                      </div>
                    </div>
                    <div className="rounded-lg border border-gray-200 p-3">
                      <p className="mb-3 text-xs font-semibold text-gray-900">产品清单</p>
                      <div className="space-y-3">
                        {piTemplateData.products.map((product, index) => (
                          <div key={`${product.seqNo}-${index}`} className="rounded border border-gray-100 bg-gray-50 p-2.5">
                            <div className="mb-2 text-[11px] font-semibold text-gray-700">产品 {product.seqNo}</div>
                            <div className="space-y-2">
                              <div><Label className="text-[11px] text-gray-500">描述</Label><Textarea value={product.description} onChange={(e) => updatePiTemplateData('products', piTemplateData.products.map((item, itemIndex) => itemIndex === index ? { ...item, description: e.target.value } : item))} className="mt-1 min-h-[52px] text-xs" /></div>
                              <div><Label className="text-[11px] text-gray-500">规格</Label><Input value={product.specification || ''} onChange={(e) => updatePiTemplateData('products', piTemplateData.products.map((item, itemIndex) => itemIndex === index ? { ...item, specification: e.target.value } : item))} className="mt-1 h-7 text-xs" /></div>
                              <div className="grid grid-cols-2 gap-2">
                                <div><Label className="text-[11px] text-gray-500">数量</Label><Input type="number" value={product.quantity} onChange={(e) => updatePiTemplateData('products', piTemplateData.products.map((item, itemIndex) => itemIndex === index ? { ...item, quantity: Number(e.target.value) || 0, extendedValue: (Number(e.target.value) || 0) * item.unitPrice } : item))} className="mt-1 h-7 text-xs" /></div>
                                <div><Label className="text-[11px] text-gray-500">单价</Label><Input type="number" step="0.001" value={product.unitPrice} onChange={(e) => updatePiTemplateData('products', piTemplateData.products.map((item, itemIndex) => itemIndex === index ? { ...item, unitPrice: Number(e.target.value) || 0, extendedValue: (Number(e.target.value) || 0) * item.quantity } : item))} className="mt-1 h-7 text-xs" /></div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-lg border border-gray-200 p-3">
                      <p className="mb-3 text-xs font-semibold text-gray-900">付款与备注</p>
                      <div className="space-y-2">
                        <div><Label className="text-[11px] text-gray-500">价格条款</Label><Input value={piTemplateData.priceTerms || ''} onChange={(e) => updatePiTemplateData('priceTerms', e.target.value)} className="mt-1 h-7 text-xs" /></div>
                        <div><Label className="text-[11px] text-gray-500">付款条款</Label><Textarea value={piTemplateData.remarks.paymentTerms || ''} onChange={(e) => updatePiTemplateData('remarks', { ...piTemplateData.remarks, paymentTerms: e.target.value })} className="mt-1 min-h-[56px] text-xs" /></div>
                        <div><Label className="text-[11px] text-gray-500">装运港</Label><Input value={piTemplateData.remarks.portOfLoading || ''} onChange={(e) => updatePiTemplateData('remarks', { ...piTemplateData.remarks, portOfLoading: e.target.value })} className="mt-1 h-7 text-xs" /></div>
                      </div>
                    </div>
                  </>
                ) : activeTemplate.id === 'ci' ? (
                  <>
                    <div className="rounded-lg border border-violet-200 bg-violet-50 p-3">
                      <p className="text-xs font-semibold text-violet-900">版本操作</p>
                      <p className="mt-1 text-[11px] text-violet-700">发布版：{latestCiPublishedRecord?.version || '未发布'}{latestCiDraftRecord ? `  草稿：${latestCiDraftRecord.version}` : ''}</p>
                      <div className="mt-2">
                        <Label className="text-[11px] text-violet-700">版本备注</Label>
                        <Textarea value={ciTemplateVersionNote} onChange={(e) => setCiTemplateVersionNote(e.target.value)} className="mt-1 min-h-[56px] border-violet-200 bg-white text-xs" />
                      </div>
                      <Button size="sm" variant="outline" className="mt-2 h-7 text-xs w-full" onClick={handleTemplateRestore} disabled={!latestCiVersionRecord}>恢复最近保存</Button>
                    </div>
                    <div className="rounded-lg border border-gray-200 p-3">
                      <div className="mb-3 flex items-center justify-between">
                        <p className="text-xs font-semibold text-gray-900">版本记录</p>
                        <Badge variant="outline" className="text-[10px]">{ciVersionHistory.length} 条</Badge>
                      </div>
                      <div className="space-y-2">
                        {ciVersionHistory.map((record) => (
                          <div key={record.id} className="rounded border border-gray-200 bg-gray-50 p-2.5">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-semibold text-gray-900">{record.version}</span>
                                  <Badge className={`h-4 px-1 text-[10px] border ${record.status === 'published' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>{record.status === 'published' ? '已发布' : '草稿'}</Badge>
                                </div>
                                <p className="mt-0.5 text-[10px] text-gray-400">{record.savedAt}</p>
                                <p className="mt-0.5 text-[11px] text-gray-600">{record.note}</p>
                              </div>
                              <Button size="sm" variant="outline" className="h-6 flex-shrink-0 px-2 text-[10px]" onClick={() => { applyCiVersionRecord(record); toast.success(`已加载版本 ${record.version}`); }}>恢复</Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    {renderWorkspaceLayoutPanel(ciTemplateLayout, updateCiTemplateLayout)}
                    <div className="rounded-lg border border-gray-200 p-3">
                      <p className="text-xs font-semibold text-gray-900 mb-3">发票信息</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div><Label className="text-[11px] text-gray-500">CI 编号</Label><Input value={ciTemplateData.invoiceNo} onChange={(e) => updateCiTemplateData('invoiceNo', e.target.value)} className="mt-1 h-7 text-xs" /></div>
                        <div><Label className="text-[11px] text-gray-500">日期</Label><Input value={ciTemplateData.invoiceDate} onChange={(e) => updateCiTemplateData('invoiceDate', e.target.value)} className="mt-1 h-7 text-xs" /></div>
                        <div className="col-span-2"><Label className="text-[11px] text-gray-500">合同号</Label><Input value={ciTemplateData.contractNo || ''} onChange={(e) => updateCiTemplateData('contractNo', e.target.value)} className="mt-1 h-7 text-xs" /></div>
                      </div>
                    </div>
                    <div className="rounded-lg border border-gray-200 p-3">
                      <p className="text-xs font-semibold text-gray-900 mb-3">出口方</p>
                      <div className="space-y-2">
                        <div><Label className="text-[11px] text-gray-500">英文名称</Label><Input value={ciTemplateData.exporter.nameEn} onChange={(e) => updateCiTemplateData('exporter', { ...ciTemplateData.exporter, nameEn: e.target.value })} className="mt-1 h-7 text-xs" /></div>
                        <div><Label className="text-[11px] text-gray-500">英文地址</Label><Textarea value={ciTemplateData.exporter.addressEn} onChange={(e) => updateCiTemplateData('exporter', { ...ciTemplateData.exporter, addressEn: e.target.value })} className="mt-1 min-h-[52px] text-xs" /></div>
                        <div><Label className="text-[11px] text-gray-500">电话</Label><Input value={ciTemplateData.exporter.tel} onChange={(e) => updateCiTemplateData('exporter', { ...ciTemplateData.exporter, tel: e.target.value })} className="mt-1 h-7 text-xs" /></div>
                      </div>
                    </div>
                    <div className="rounded-lg border border-gray-200 p-3">
                      <p className="text-xs font-semibold text-gray-900 mb-3">进口方</p>
                      <div className="space-y-2">
                        <div><Label className="text-[11px] text-gray-500">客户名称</Label><Input value={ciTemplateData.importer.name} onChange={(e) => updateCiTemplateData('importer', { ...ciTemplateData.importer, name: e.target.value })} className="mt-1 h-7 text-xs" /></div>
                        <div><Label className="text-[11px] text-gray-500">地址</Label><Textarea value={ciTemplateData.importer.address} onChange={(e) => updateCiTemplateData('importer', { ...ciTemplateData.importer, address: e.target.value })} className="mt-1 min-h-[52px] text-xs" /></div>
                      </div>
                    </div>
                    <div className="rounded-lg border border-gray-200 p-3">
                      <p className="text-xs font-semibold text-gray-900 mb-3">货物清单</p>
                      <div className="space-y-3">
                        {ciTemplateData.goods.map((item, index) => (
                          <div key={`${item.no}-${index}`} className="rounded border border-gray-100 bg-gray-50 p-2.5">
                            <div className="mb-2 text-[11px] font-semibold text-gray-700">货物 {item.no}</div>
                            <div className="space-y-2">
                              <div><Label className="text-[11px] text-gray-500">描述</Label><Textarea value={item.description} onChange={(e) => updateCiTemplateData('goods', ciTemplateData.goods.map((row, rowIndex) => rowIndex === index ? { ...row, description: e.target.value } : row))} className="mt-1 min-h-[52px] text-xs" /></div>
                              <div className="grid grid-cols-2 gap-2">
                                <div><Label className="text-[11px] text-gray-500">数量</Label><Input type="number" value={item.quantity} onChange={(e) => updateCiTemplateData('goods', ciTemplateData.goods.map((row, rowIndex) => rowIndex === index ? { ...row, quantity: Number(e.target.value) || 0, amount: (Number(e.target.value) || 0) * row.unitPrice } : row))} className="mt-1 h-7 text-xs" /></div>
                                <div><Label className="text-[11px] text-gray-500">单价</Label><Input type="number" value={item.unitPrice} onChange={(e) => updateCiTemplateData('goods', ciTemplateData.goods.map((row, rowIndex) => rowIndex === index ? { ...row, unitPrice: Number(e.target.value) || 0, amount: (Number(e.target.value) || 0) * row.quantity } : row))} className="mt-1 h-7 text-xs" /></div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-lg border border-gray-200 p-3">
                      <p className="text-xs font-semibold text-gray-900 mb-3">运输与包装</p>
                      <div className="space-y-2">
                        <div><Label className="text-[11px] text-gray-500">贸易条款</Label><Input value={ciTemplateData.shipping.tradeTerms} onChange={(e) => updateCiTemplateData('shipping', { ...ciTemplateData.shipping, tradeTerms: e.target.value })} className="mt-1 h-7 text-xs" /></div>
                        <div><Label className="text-[11px] text-gray-500">装运港</Label><Input value={ciTemplateData.shipping.portOfLoading} onChange={(e) => updateCiTemplateData('shipping', { ...ciTemplateData.shipping, portOfLoading: e.target.value })} className="mt-1 h-7 text-xs" /></div>
                        <div><Label className="text-[11px] text-gray-500">总箱数</Label><Input type="number" value={ciTemplateData.packing.totalCartons} onChange={(e) => updateCiTemplateData('packing', { ...ciTemplateData.packing, totalCartons: Number(e.target.value) || 0 })} className="mt-1 h-7 text-xs" /></div>
                      </div>
                    </div>
                  </>
                ) : activeTemplate.id === 'pl' ? (
                  <>
                    <div className="rounded-lg border border-violet-200 bg-violet-50 p-3">
                      <p className="text-xs font-semibold text-violet-900">版本操作</p>
                      <p className="mt-1 text-[11px] text-violet-700">发布版：{latestPlPublishedRecord?.version || '未发布'}{latestPlDraftRecord ? `  草稿：${latestPlDraftRecord.version}` : ''}</p>
                      <div className="mt-2">
                        <Label className="text-[11px] text-violet-700">版本备注</Label>
                        <Textarea value={plTemplateVersionNote} onChange={(e) => setPlTemplateVersionNote(e.target.value)} className="mt-1 min-h-[56px] border-violet-200 bg-white text-xs" />
                      </div>
                      <Button size="sm" variant="outline" className="mt-2 h-7 text-xs w-full" onClick={handleTemplateRestore} disabled={!latestPlVersionRecord}>恢复最近保存</Button>
                    </div>
                    <div className="rounded-lg border border-gray-200 p-3">
                      <div className="mb-3 flex items-center justify-between">
                        <p className="text-xs font-semibold text-gray-900">版本记录</p>
                        <Badge variant="outline" className="text-[10px]">{plVersionHistory.length} 条</Badge>
                      </div>
                      <div className="space-y-2">
                        {plVersionHistory.map((record) => (
                          <div key={record.id} className="rounded border border-gray-200 bg-gray-50 p-2.5">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-semibold text-gray-900">{record.version}</span>
                                  <Badge className={`h-4 px-1 text-[10px] border ${record.status === 'published' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>{record.status === 'published' ? '已发布' : '草稿'}</Badge>
                                </div>
                                <p className="mt-0.5 text-[10px] text-gray-400">{record.savedAt}</p>
                                <p className="mt-0.5 text-[11px] text-gray-600">{record.note}</p>
                              </div>
                              <Button size="sm" variant="outline" className="h-6 flex-shrink-0 px-2 text-[10px]" onClick={() => { applyPlVersionRecord(record); toast.success(`已加载版本 ${record.version}`); }}>恢复</Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    {renderWorkspaceLayoutPanel(plTemplateLayout, updatePlTemplateLayout)}
                    <div className="rounded-lg border border-gray-200 p-3">
                      <p className="text-xs font-semibold text-gray-900 mb-3">单据信息</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div><Label className="text-[11px] text-gray-500">PL 编号</Label><Input value={plTemplateData.plNo} onChange={(e) => updatePlTemplateData('plNo', e.target.value)} className="mt-1 h-7 text-xs" /></div>
                        <div><Label className="text-[11px] text-gray-500">CI 编号</Label><Input value={plTemplateData.invoiceNo} onChange={(e) => updatePlTemplateData('invoiceNo', e.target.value)} className="mt-1 h-7 text-xs" /></div>
                        <div className="col-span-2"><Label className="text-[11px] text-gray-500">日期</Label><Input value={plTemplateData.date} onChange={(e) => updatePlTemplateData('date', e.target.value)} className="mt-1 h-7 text-xs" /></div>
                      </div>
                    </div>
                    <div className="rounded-lg border border-gray-200 p-3">
                      <p className="text-xs font-semibold text-gray-900 mb-3">出口方 / 进口方</p>
                      <div className="space-y-2">
                        <div><Label className="text-[11px] text-gray-500">出口方名称</Label><Input value={plTemplateData.exporter.name} onChange={(e) => updatePlTemplateData('exporter', { ...plTemplateData.exporter, name: e.target.value })} className="mt-1 h-7 text-xs" /></div>
                        <div><Label className="text-[11px] text-gray-500">进口方名称</Label><Input value={plTemplateData.importer.name} onChange={(e) => updatePlTemplateData('importer', { ...plTemplateData.importer, name: e.target.value })} className="mt-1 h-7 text-xs" /></div>
                        <div><Label className="text-[11px] text-gray-500">唛头</Label><Textarea value={plTemplateData.shippingMarks} onChange={(e) => updatePlTemplateData('shippingMarks', e.target.value)} className="mt-1 min-h-[56px] text-xs" /></div>
                      </div>
                    </div>
                    <div className="rounded-lg border border-gray-200 p-3">
                      <p className="text-xs font-semibold text-gray-900 mb-3">装箱明细</p>
                      <div className="space-y-3">
                        {plTemplateData.packages.map((pkg, index) => (
                          <div key={`${pkg.cartonNo}-${index}`} className="rounded border border-gray-100 bg-gray-50 p-2.5">
                            <div className="mb-2 text-[11px] font-semibold text-gray-700">包装 {index + 1}</div>
                            <div className="space-y-2">
                              <div><Label className="text-[11px] text-gray-500">描述</Label><Textarea value={pkg.description} onChange={(e) => updatePlTemplateData('packages', plTemplateData.packages.map((row, rowIndex) => rowIndex === index ? { ...row, description: e.target.value } : row))} className="mt-1 min-h-[52px] text-xs" /></div>
                              <div className="grid grid-cols-2 gap-2">
                                <div><Label className="text-[11px] text-gray-500">箱数</Label><Input type="number" value={pkg.totalCartons} onChange={(e) => updatePlTemplateData('packages', plTemplateData.packages.map((row, rowIndex) => rowIndex === index ? { ...row, totalCartons: Number(e.target.value) || 0 } : row))} className="mt-1 h-7 text-xs" /></div>
                                <div><Label className="text-[11px] text-gray-500">总数量</Label><Input type="number" value={pkg.totalQty} onChange={(e) => updatePlTemplateData('packages', plTemplateData.packages.map((row, rowIndex) => rowIndex === index ? { ...row, totalQty: Number(e.target.value) || 0 } : row))} className="mt-1 h-7 text-xs" /></div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-lg border border-gray-200 p-3">
                      <p className="text-xs font-semibold text-gray-900 mb-3">运输信息</p>
                      <div className="space-y-2">
                        <div><Label className="text-[11px] text-gray-500">装运港</Label><Input value={plTemplateData.shipping.portOfLoading} onChange={(e) => updatePlTemplateData('shipping', { ...plTemplateData.shipping, portOfLoading: e.target.value })} className="mt-1 h-7 text-xs" /></div>
                        <div><Label className="text-[11px] text-gray-500">卸货港</Label><Input value={plTemplateData.shipping.portOfDischarge} onChange={(e) => updatePlTemplateData('shipping', { ...plTemplateData.shipping, portOfDischarge: e.target.value })} className="mt-1 h-7 text-xs" /></div>
                        <div><Label className="text-[11px] text-gray-500">提单号</Label><Input value={plTemplateData.shipping.blNo || ''} onChange={(e) => updatePlTemplateData('shipping', { ...plTemplateData.shipping, blNo: e.target.value })} className="mt-1 h-7 text-xs" /></div>
                      </div>
                    </div>
                  </>
                ) : activeTemplate.id === 'soa' ? (
                  <>
                    <div className="rounded-lg border border-violet-200 bg-violet-50 p-3">
                      <p className="text-xs font-semibold text-violet-900">版本操作</p>
                      <p className="mt-1 text-[11px] text-violet-700">发布版：{latestSoaPublishedRecord?.version || '未发布'}{latestSoaDraftRecord ? `  草稿：${latestSoaDraftRecord.version}` : ''}</p>
                      <div className="mt-2">
                        <Label className="text-[11px] text-violet-700">版本备注</Label>
                        <Textarea value={soaTemplateVersionNote} onChange={(e) => setSoaTemplateVersionNote(e.target.value)} className="mt-1 min-h-[56px] border-violet-200 bg-white text-xs" />
                      </div>
                      <Button size="sm" variant="outline" className="mt-2 h-7 text-xs w-full" onClick={handleTemplateRestore} disabled={!latestSoaVersionRecord}>恢复最近保存</Button>
                    </div>
                    <div className="rounded-lg border border-gray-200 p-3">
                      <div className="mb-3 flex items-center justify-between">
                        <p className="text-xs font-semibold text-gray-900">版本记录</p>
                        <Badge variant="outline" className="text-[10px]">{soaVersionHistory.length} 条</Badge>
                      </div>
                      <div className="space-y-2">
                        {soaVersionHistory.map((record) => (
                          <div key={record.id} className="rounded border border-gray-200 bg-gray-50 p-2.5">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-semibold text-gray-900">{record.version}</span>
                                  <Badge className={`h-4 px-1 text-[10px] border ${record.status === 'published' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>{record.status === 'published' ? '已发布' : '草稿'}</Badge>
                                </div>
                                <p className="mt-0.5 text-[10px] text-gray-400">{record.savedAt}</p>
                                <p className="mt-0.5 text-[11px] text-gray-600">{record.note}</p>
                              </div>
                              <Button size="sm" variant="outline" className="h-6 flex-shrink-0 px-2 text-[10px]" onClick={() => { applySoaVersionRecord(record); toast.success(`已加载版本 ${record.version}`); }}>恢复</Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    {renderWorkspaceLayoutPanel(soaTemplateLayout, updateSoaTemplateLayout)}
                    <div className="rounded-lg border border-gray-200 p-3">
                      <p className="text-xs font-semibold text-gray-900 mb-3">对账信息</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div><Label className="text-[11px] text-gray-500">SOA 编号</Label><Input value={soaTemplateData.statementNo} onChange={(e) => updateSoaTemplateData('statementNo', e.target.value)} className="mt-1 h-7 text-xs" /></div>
                        <div><Label className="text-[11px] text-gray-500">对账日期</Label><Input value={soaTemplateData.statementDate} onChange={(e) => updateSoaTemplateData('statementDate', e.target.value)} className="mt-1 h-7 text-xs" /></div>
                        <div><Label className="text-[11px] text-gray-500">期间开始</Label><Input value={soaTemplateData.periodStart} onChange={(e) => updateSoaTemplateData('periodStart', e.target.value)} className="mt-1 h-7 text-xs" /></div>
                        <div><Label className="text-[11px] text-gray-500">期间结束</Label><Input value={soaTemplateData.periodEnd} onChange={(e) => updateSoaTemplateData('periodEnd', e.target.value)} className="mt-1 h-7 text-xs" /></div>
                      </div>
                    </div>
                    <div className="rounded-lg border border-gray-200 p-3">
                      <p className="text-xs font-semibold text-gray-900 mb-3">客户与余额</p>
                      <div className="space-y-2">
                        <div><Label className="text-[11px] text-gray-500">客户名称</Label><Input value={soaTemplateData.customer.companyName} onChange={(e) => updateSoaTemplateData('customer', { ...soaTemplateData.customer, companyName: e.target.value })} className="mt-1 h-7 text-xs" /></div>
                        <div><Label className="text-[11px] text-gray-500">期末余额</Label><Input type="number" value={soaTemplateData.closingBalance.amount} onChange={(e) => updateSoaTemplateData('closingBalance', { ...soaTemplateData.closingBalance, amount: Number(e.target.value) || 0 })} className="mt-1 h-7 text-xs" /></div>
                      </div>
                    </div>
                    <div className="rounded-lg border border-gray-200 p-3">
                      <p className="text-xs font-semibold text-gray-900 mb-3">交易明细</p>
                      <div className="space-y-3">
                        {soaTemplateData.transactions.map((item, index) => (
                          <div key={`${item.referenceNo}-${index}`} className="rounded border border-gray-100 bg-gray-50 p-2.5">
                            <div className="mb-2 text-[11px] font-semibold text-gray-700">交易 {index + 1}</div>
                            <div className="space-y-2">
                              <div><Label className="text-[11px] text-gray-500">摘要</Label><Input value={item.description} onChange={(e) => updateSoaTemplateData('transactions', soaTemplateData.transactions.map((row, rowIndex) => rowIndex === index ? { ...row, description: e.target.value } : row))} className="mt-1 h-7 text-xs" /></div>
                              <div className="grid grid-cols-2 gap-2">
                                <div><Label className="text-[11px] text-gray-500">借方</Label><Input type="number" value={item.debit || 0} onChange={(e) => updateSoaTemplateData('transactions', soaTemplateData.transactions.map((row, rowIndex) => rowIndex === index ? { ...row, debit: Number(e.target.value) || 0 } : row))} className="mt-1 h-7 text-xs" /></div>
                                <div><Label className="text-[11px] text-gray-500">贷方</Label><Input type="number" value={item.credit || 0} onChange={(e) => updateSoaTemplateData('transactions', soaTemplateData.transactions.map((row, rowIndex) => rowIndex === index ? { ...row, credit: Number(e.target.value) || 0 } : row))} className="mt-1 h-7 text-xs" /></div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                ) : activeTemplate.id === 'ing' ? (
                  <>
                    <div className="rounded-lg border border-violet-200 bg-violet-50 p-3">
                      <p className="text-xs font-semibold text-violet-900">版本操作</p>
                      <p className="mt-1 text-[11px] text-violet-700">发布版：{latestInquiryPublishedRecord?.version || '未发布'}{latestInquiryDraftRecord ? `  草稿：${latestInquiryDraftRecord.version}` : ''}</p>
                      <div className="mt-2">
                        <Label className="text-[11px] text-violet-700">版本备注</Label>
                        <Textarea value={inquiryTemplateVersionNote} onChange={(e) => setInquiryTemplateVersionNote(e.target.value)} className="mt-1 min-h-[56px] border-violet-200 bg-white text-xs" />
                      </div>
                      <Button size="sm" variant="outline" className="mt-2 h-7 text-xs w-full" onClick={handleTemplateRestore} disabled={!latestInquiryVersionRecord}>恢复最近保存</Button>
                    </div>
                    <div className="rounded-lg border border-gray-200 p-3">
                      <div className="mb-3 flex items-center justify-between">
                        <p className="text-xs font-semibold text-gray-900">版本记录</p>
                        <Badge variant="outline" className="text-[10px]">{inquiryVersionHistory.length} 条</Badge>
                      </div>
                      <div className="space-y-2">
                        {inquiryVersionHistory.map((record) => (
                          <div key={record.id} className="rounded border border-gray-200 bg-gray-50 p-2.5">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-semibold text-gray-900">{record.version}</span>
                                  <Badge className={`h-4 px-1 text-[10px] border ${record.status === 'published' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>{record.status === 'published' ? '已发布' : '草稿'}</Badge>
                                </div>
                                <p className="mt-0.5 text-[10px] text-gray-400">{record.savedAt}</p>
                                <p className="mt-0.5 text-[11px] text-gray-600">{record.note}</p>
                              </div>
                              <Button size="sm" variant="outline" className="h-6 flex-shrink-0 px-2 text-[10px]" onClick={() => { applyInquiryVersionRecord(record); toast.success(`已加载版本 ${record.version}`); }}>恢复</Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    {renderWorkspaceLayoutPanel(inquiryTemplateLayout, updateInquiryTemplateLayout)}
                    <div className="rounded-lg border border-gray-200 p-3">
                      <p className="text-xs font-semibold text-gray-900 mb-3">询价信息</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div><Label className="text-[11px] text-gray-500">ING 编号</Label><Input value={inquiryTemplateData.inquiryNo} onChange={(e) => updateInquiryTemplateData('inquiryNo', e.target.value)} className="mt-1 h-7 text-xs" /></div>
                        <div><Label className="text-[11px] text-gray-500">日期</Label><Input value={inquiryTemplateData.inquiryDate} onChange={(e) => updateInquiryTemplateData('inquiryDate', e.target.value)} className="mt-1 h-7 text-xs" /></div>
                      </div>
                    </div>
                    <div className="rounded-lg border border-gray-200 p-3">
                      <p className="text-xs font-semibold text-gray-900 mb-3">客户信息</p>
                      <div className="space-y-2">
                        <div><Label className="text-[11px] text-gray-500">客户名称</Label><Input value={inquiryTemplateData.customer.companyName} onChange={(e) => updateInquiryTemplateData('customer', { ...inquiryTemplateData.customer, companyName: e.target.value })} className="mt-1 h-7 text-xs" /></div>
                        <div className="grid grid-cols-2 gap-2">
                          <div><Label className="text-[11px] text-gray-500">联系人</Label><Input value={inquiryTemplateData.customer.contactPerson} onChange={(e) => updateInquiryTemplateData('customer', { ...inquiryTemplateData.customer, contactPerson: e.target.value })} className="mt-1 h-7 text-xs" /></div>
                          <div><Label className="text-[11px] text-gray-500">邮箱</Label><Input value={inquiryTemplateData.customer.email} onChange={(e) => updateInquiryTemplateData('customer', { ...inquiryTemplateData.customer, email: e.target.value })} className="mt-1 h-7 text-xs" /></div>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-lg border border-gray-200 p-3">
                      <p className="text-xs font-semibold text-gray-900 mb-3">产品需求</p>
                      <div className="space-y-3">
                        {inquiryTemplateData.products.map((product, index) => (
                          <div key={`${product.no}-${index}`} className="rounded border border-gray-100 bg-gray-50 p-2.5">
                            <div className="mb-2 text-[11px] font-semibold text-gray-700">产品 {product.no}</div>
                            <div className="space-y-2">
                              <div><Label className="text-[11px] text-gray-500">产品名称</Label><Input value={product.productName} onChange={(e) => updateInquiryTemplateData('products', inquiryTemplateData.products.map((row, rowIndex) => rowIndex === index ? { ...row, productName: e.target.value } : row))} className="mt-1 h-7 text-xs" /></div>
                              <div><Label className="text-[11px] text-gray-500">规格</Label><Textarea value={product.specification || ''} onChange={(e) => updateInquiryTemplateData('products', inquiryTemplateData.products.map((row, rowIndex) => rowIndex === index ? { ...row, specification: e.target.value } : row))} className="mt-1 min-h-[52px] text-xs" /></div>
                              <div className="grid grid-cols-2 gap-2">
                                <div><Label className="text-[11px] text-gray-500">数量</Label><Input type="number" value={product.quantity} onChange={(e) => updateInquiryTemplateData('products', inquiryTemplateData.products.map((row, rowIndex) => rowIndex === index ? { ...row, quantity: Number(e.target.value) || 0 } : row))} className="mt-1 h-7 text-xs" /></div>
                                <div><Label className="text-[11px] text-gray-500">目标价</Label><Input type="number" value={product.targetPrice || 0} onChange={(e) => updateInquiryTemplateData('products', inquiryTemplateData.products.map((row, rowIndex) => rowIndex === index ? { ...row, targetPrice: Number(e.target.value) || 0 } : row))} className="mt-1 h-7 text-xs" /></div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-lg border border-gray-200 p-3">
                      <div className="mb-3">
                        <p className="text-xs font-semibold text-gray-900">询价条款 / TRADING REQUIREMENTS</p>
                        <p className="mt-1 text-[11px] leading-5 text-gray-500">
                          这里定义模板中心 ING 预览中的条款绑定。模板中心只承接结构和字段路径，客户实际条款内容来自 `Create New Inquiry` 弹窗。
                        </p>
                      </div>
                      <div className="overflow-hidden rounded-md border border-gray-200">
                        {CUSTOMER_INQUIRY_REQUIREMENT_FIELDS.map((field) => {
                          const value = field.key === 'certifications'
                            ? (inquiryTemplateData.requirements?.certifications || []).join(', ')
                            : inquiryTemplateData.requirements?.[field.key] || '';

                          return (
                            <button
                              key={field.key}
                              type="button"
                              onMouseEnter={() => setActiveInquiryRequirementField(field.key)}
                              onMouseLeave={() => setActiveInquiryRequirementField((current) => (current === field.key ? null : current))}
                              onFocus={() => setActiveInquiryRequirementField(field.key)}
                              onBlur={() => setActiveInquiryRequirementField((current) => (current === field.key ? null : current))}
                              className={`grid w-full grid-cols-[160px_180px_1fr] border-t border-gray-200 text-left first:border-t-0 ${
                                activeInquiryRequirementField === field.key ? 'bg-amber-50' : 'bg-white hover:bg-gray-50'
                              }`}
                            >
                              <div className="border-r border-gray-200 bg-gray-50 px-3 py-3">
                                <div className="text-[11px] font-semibold text-gray-900">{field.previewLabel}</div>
                                <div className="mt-1 text-[10px] leading-4 text-gray-500">
                                  客户侧字段名: {field.sourceLabel}
                                </div>
                              </div>
                              <div className="border-r border-gray-200 px-3 py-3">
                                <div className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
                                  Binding Path
                                </div>
                                <div className="mt-1 font-mono text-[11px] text-gray-700">
                                  requirements.{field.key}
                                </div>
                              </div>
                              <div className="px-3 py-3">
                                <div className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
                                  当前样例值
                                </div>
                                <div className="mt-1 text-[11px] leading-5 text-gray-700 whitespace-pre-wrap">
                                  {value || '未提供'}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </>
                ) : activeTemplate.id === 'qt' ? (
                  <>
                    <div className="rounded-lg border border-violet-200 bg-violet-50 p-3">
                      <p className="text-xs font-semibold text-violet-900">版本操作</p>
                      <p className="mt-1 text-[11px] text-violet-700">发布版：{latestQuotationPublishedRecord?.version || '未发布'}{latestQuotationDraftRecord ? `  草稿：${latestQuotationDraftRecord.version}` : ''}</p>
                      <div className="mt-2">
                        <Label className="text-[11px] text-violet-700">版本备注</Label>
                        <Textarea value={quotationTemplateVersionNote} onChange={(e) => setQuotationTemplateVersionNote(e.target.value)} className="mt-1 min-h-[56px] border-violet-200 bg-white text-xs" />
                      </div>
                      <Button size="sm" variant="outline" className="mt-2 h-7 text-xs w-full" onClick={handleTemplateRestore} disabled={!latestQuotationVersionRecord}>恢复最近保存</Button>
                    </div>
                    <div className="rounded-lg border border-gray-200 p-3">
                      <div className="mb-3 flex items-center justify-between">
                        <p className="text-xs font-semibold text-gray-900">版本记录</p>
                        <Badge variant="outline" className="text-[10px]">{quotationVersionHistory.length} 条</Badge>
                      </div>
                      <div className="space-y-2">
                        {quotationVersionHistory.map((record) => (
                          <div key={record.id} className="rounded border border-gray-200 bg-gray-50 p-2.5">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-semibold text-gray-900">{record.version}</span>
                                  <Badge className={`h-4 px-1 text-[10px] border ${record.status === 'published' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>{record.status === 'published' ? '已发布' : '草稿'}</Badge>
                                </div>
                                <p className="mt-0.5 text-[10px] text-gray-400">{record.savedAt}</p>
                                <p className="mt-0.5 text-[11px] text-gray-600">{record.note}</p>
                              </div>
                              <Button size="sm" variant="outline" className="h-6 flex-shrink-0 px-2 text-[10px]" onClick={() => { applyQuotationVersionRecord(record); toast.success(`已加载版本 ${record.version}`); }}>恢复</Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    {renderWorkspaceLayoutPanel(quotationTemplateLayout, updateQuotationTemplateLayout)}
                    <div className="rounded-lg border border-gray-200 p-3">
                      <p className="text-xs font-semibold text-gray-900 mb-3">报价信息</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div><Label className="text-[11px] text-gray-500">QT 编号</Label><Input value={quotationTemplateData.quotationNo} onChange={(e) => updateQuotationTemplateData('quotationNo', e.target.value)} className="mt-1 h-7 text-xs" /></div>
                        <div><Label className="text-[11px] text-gray-500">报价日期</Label><Input value={quotationTemplateData.quotationDate} onChange={(e) => updateQuotationTemplateData('quotationDate', e.target.value)} className="mt-1 h-7 text-xs" /></div>
                        <div><Label className="text-[11px] text-gray-500">有效期</Label><Input value={quotationTemplateData.validUntil} onChange={(e) => updateQuotationTemplateData('validUntil', e.target.value)} className="mt-1 h-7 text-xs" /></div>
                        <div><Label className="text-[11px] text-gray-500">来源询价单</Label><Input value={quotationTemplateData.inquiryNo || ''} onChange={(e) => updateQuotationTemplateData('inquiryNo', e.target.value)} className="mt-1 h-7 text-xs" /></div>
                      </div>
                    </div>
                    <div className="rounded-lg border border-gray-200 p-3">
                      <p className="text-xs font-semibold text-gray-900 mb-3">客户与销售员</p>
                      <div className="space-y-2">
                        <div><Label className="text-[11px] text-gray-500">客户名称</Label><Input value={quotationTemplateData.customer.companyName} onChange={(e) => updateQuotationTemplateData('customer', { ...quotationTemplateData.customer, companyName: e.target.value })} className="mt-1 h-7 text-xs" /></div>
                        <div><Label className="text-[11px] text-gray-500">销售员</Label><Input value={quotationTemplateData.salesPerson.name} onChange={(e) => updateQuotationTemplateData('salesPerson', { ...quotationTemplateData.salesPerson, name: e.target.value })} className="mt-1 h-7 text-xs" /></div>
                      </div>
                    </div>
                    <div className="rounded-lg border border-gray-200 p-3">
                      <p className="text-xs font-semibold text-gray-900 mb-3">报价产品</p>
                      <div className="space-y-3">
                        {quotationTemplateData.products.map((product, index) => (
                          <div key={`${product.no}-${index}`} className="rounded border border-gray-100 bg-gray-50 p-2.5">
                            <div className="mb-2 text-[11px] font-semibold text-gray-700">产品 {product.no}</div>
                            <div className="space-y-2">
                              <div><Label className="text-[11px] text-gray-500">产品名称</Label><Input value={product.productName} onChange={(e) => updateQuotationTemplateData('products', quotationTemplateData.products.map((row, rowIndex) => rowIndex === index ? { ...row, productName: e.target.value } : row))} className="mt-1 h-7 text-xs" /></div>
                              <div className="grid grid-cols-2 gap-2">
                                <div><Label className="text-[11px] text-gray-500">数量</Label><Input type="number" value={product.quantity} onChange={(e) => updateQuotationTemplateData('products', quotationTemplateData.products.map((row, rowIndex) => rowIndex === index ? { ...row, quantity: Number(e.target.value) || 0, amount: (Number(e.target.value) || 0) * row.unitPrice } : row))} className="mt-1 h-7 text-xs" /></div>
                                <div><Label className="text-[11px] text-gray-500">单价</Label><Input type="number" value={product.unitPrice} onChange={(e) => updateQuotationTemplateData('products', quotationTemplateData.products.map((row, rowIndex) => rowIndex === index ? { ...row, unitPrice: Number(e.target.value) || 0, amount: (Number(e.target.value) || 0) * row.quantity } : row))} className="mt-1 h-7 text-xs" /></div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-lg border border-gray-200 p-3">
                      <p className="text-xs font-semibold text-gray-900 mb-3">贸易条款</p>
                      <div className="space-y-2">
                        <div><Label className="text-[11px] text-gray-500">Incoterms</Label><Input value={quotationTemplateData.tradeTerms.incoterms} onChange={(e) => updateQuotationTemplateData('tradeTerms', { ...quotationTemplateData.tradeTerms, incoterms: e.target.value })} className="mt-1 h-7 text-xs" /></div>
                        <div><Label className="text-[11px] text-gray-500">付款条款</Label><Textarea value={quotationTemplateData.tradeTerms.paymentTerms} onChange={(e) => updateQuotationTemplateData('tradeTerms', { ...quotationTemplateData.tradeTerms, paymentTerms: e.target.value })} className="mt-1 min-h-[52px] text-xs" /></div>
                        <div><Label className="text-[11px] text-gray-500">交期</Label><Input value={quotationTemplateData.tradeTerms.deliveryTime} onChange={(e) => updateQuotationTemplateData('tradeTerms', { ...quotationTemplateData.tradeTerms, deliveryTime: e.target.value })} className="mt-1 h-7 text-xs" /></div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="rounded-lg border border-violet-200 bg-violet-50 p-3">
                      <p className="text-xs font-semibold text-violet-900">版本操作</p>
                      <p className="mt-1 text-[11px] text-violet-700">当前版本：{resolvedActiveTemplateMeta?.currentVersion || 'v1.0.0'}</p>
                      <p className="mt-1 text-[11px] text-violet-700">发布状态：{resolvedActiveTemplateMeta ? publishStatusMeta[resolvedActiveTemplateMeta.status].label : '未发布'}</p>
                      <div className="mt-2">
                        <Label className="text-[11px] text-violet-700">版本备注</Label>
                        <Textarea
                          value={`${activeTemplate.name} 模板统一工作台已接入，等待专属字段编辑器。`}
                          readOnly
                          className="mt-1 min-h-[72px] border-violet-200 bg-white text-xs"
                        />
                      </div>
                      <Button size="sm" variant="outline" className="mt-2 h-7 text-xs w-full" onClick={handleTemplateRestore}>恢复最近保存</Button>
                    </div>
                    <div className="rounded-lg border border-gray-200 p-3">
                      <p className="text-xs font-semibold text-gray-900 mb-3">模板基础信息</p>
                      <div className="space-y-2 text-[11px] text-gray-600">
                        <div className="rounded bg-gray-50 px-3 py-2">
                          <span className="text-gray-400">模板名称：</span>{activeTemplate.name}
                        </div>
                        <div className="rounded bg-gray-50 px-3 py-2">
                          <span className="text-gray-400">英文名称：</span>{activeTemplate.nameEn}
                        </div>
                        <div className="rounded bg-gray-50 px-3 py-2">
                          <span className="text-gray-400">模板分类：</span>{activeTemplate.categoryName}
                        </div>
                        <div className="rounded bg-gray-50 px-3 py-2">
                          <span className="text-gray-400">组件来源：</span>{activeTemplate.component}
                        </div>
                      </div>
                    </div>
                    <div className="rounded-lg border border-gray-200 p-3">
                      <p className="text-xs font-semibold text-gray-900 mb-3">业务说明</p>
                      <Textarea value={activeTemplate.description} readOnly className="min-h-[96px] text-xs bg-gray-50" />
                    </div>
                    <div className="rounded-lg border border-gray-200 p-3">
                      <p className="text-xs font-semibold text-gray-900 mb-3">调用节点</p>
                      <div className="space-y-2">
                        {activeTemplate.usedInModules.length > 0 ? activeTemplate.usedInModules.map((mod, idx) => {
                          const label = typeof mod === 'string' ? mod : (mod as { description?: string }).description || (mod as { module?: string }).module || `节点 ${idx + 1}`;
                          const key = typeof mod === 'string' ? mod : `${(mod as { module?: string }).module}-${(mod as { subModule?: string }).subModule}-${idx}`;
                          return (
                            <div key={key} className="rounded bg-gray-50 px-3 py-2 text-[11px] text-gray-600">
                              {label}
                            </div>
                          );
                        }) : (
                          <div className="rounded bg-gray-50 px-3 py-2 text-[11px] text-gray-400">暂无调用节点</div>
                        )}
                      </div>
                    </div>
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                      <p className="text-xs font-semibold text-amber-900">下一步接入</p>
                      <p className="mt-1 text-[11px] leading-5 text-amber-800">
                        当前已统一接入左右双栏、顶部固定、独立滚动的工作台结构。
                        下一步会逐个补齐 {activeTemplate.name} 的专属字段编辑器和真实模板预览组件。
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
            <TemplatePreviewShell
              title="A4 模板预览"
              subtitle="210mm × 297mm"
              zoom={previewScale}
              minZoom={30}
              maxZoom={150}
              onZoomIn={() => setPreviewScale(Math.min(previewScale + 10, 150))}
              onZoomOut={() => setPreviewScale(Math.max(previewScale - 10, 30))}
              shellClassName="rounded-none"
            >
              {activeTemplate.id === 'qr' ? (
                <QuoteRequirementDocument data={qrTemplateData} layoutConfig={qrTemplateLayout} textOverrides={qrTemplateTextOverrides} />
              ) : activeTemplate.id === 'xj' ? (
                <XJDocument data={xjTemplateData} layoutConfig={xjTemplateLayout} />
              ) : activeTemplate.id === 'sc' ? (
                <SalesContractDocument data={scTemplateData} layoutConfig={scTemplateLayout} />
              ) : activeTemplate.id === 'cg' ? (
                <PurchaseOrderDocumentA4Pages data={cgTemplateData} />
              ) : activeTemplate.id === 'pi' ? (
                <ProformaInvoiceDocument data={piTemplateData} layoutConfig={piTemplateLayout} />
              ) : activeTemplate.id === 'ci' ? (
                <CommercialInvoiceDocument data={ciTemplateData} layoutConfig={ciTemplateLayout} />
              ) : activeTemplate.id === 'pl' ? (
                <PackingListDocument data={plTemplateData} layoutConfig={plTemplateLayout} />
              ) : activeTemplate.id === 'soa' ? (
                <StatementOfAccountDocument data={soaTemplateData} layoutConfig={soaTemplateLayout} />
              ) : activeTemplate.id === 'ing' ? (
                <CustomerInquiryDocument
                  data={inquiryTemplateData}
                  layoutConfig={inquiryTemplateLayout}
                />
              ) : activeTemplate.id === 'qt' ? (
                <QuotationDocumentA4Pages data={quotationTemplateData} />
              ) : (
                <div className="rounded bg-white shadow-lg" style={{ width: '210mm', minHeight: '297mm' }}>
                  <div className="flex min-h-[297mm] flex-col p-10 text-gray-800">
                    <div className="flex items-start justify-between border-b-2 border-gray-900 pb-4">
                      <div>
                        <div className="text-3xl">{activeTemplate.icon}</div>
                        <p className="mt-3 text-2xl font-bold">{activeTemplate.name}</p>
                        <p className="mt-1 text-sm text-gray-500">{activeTemplate.nameEn}</p>
                      </div>
                      <div className="rounded border border-gray-300 px-3 py-2 text-right text-xs">
                        <p>模板编号：{activeTemplate.id.toUpperCase()}</p>
                        <p className="mt-1">当前版本：{resolvedActiveTemplateMeta?.currentVersion || 'v1.0.0'}</p>
                        <p className="mt-1">状态：{resolvedActiveTemplateMeta ? publishStatusMeta[resolvedActiveTemplateMeta.status].label : '未发布'}</p>
                      </div>
                    </div>
                    <div className="mt-8 space-y-5">
                      <div>
                        <p className="text-sm font-semibold">模板说明</p>
                        <p className="mt-2 text-sm leading-6 text-gray-600">{activeTemplate.description}</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold">调用节点</p>
                        <div className="mt-3 space-y-2">
                          {activeTemplate.usedInModules.length > 0 ? activeTemplate.usedInModules.map((mod, idx) => {
                            const label = typeof mod === 'string' ? mod : (mod as { description?: string }).description || (mod as { module?: string }).module || `节点 ${idx + 1}`;
                            const key = typeof mod === 'string' ? mod : `${(mod as { module?: string }).module}-${(mod as { subModule?: string }).subModule}-${idx}`;
                            return (
                              <div key={key} className="rounded border border-gray-200 px-3 py-2 text-sm text-gray-600">
                                {idx + 1}. {label}
                              </div>
                            );
                          }) : (
                            <div className="rounded border border-dashed border-gray-200 px-3 py-3 text-sm text-gray-400">暂无调用节点</div>
                          )}
                        </div>
                      </div>
                      <div className="rounded bg-gray-50 px-4 py-4 text-sm leading-6 text-gray-600">
                        该模板已接入统一工作台外壳，可在这里保持与 QR 一致的左右双栏编辑体验。
                        下一步将继续接入专属表单字段、组件渲染和版本持久化。
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </TemplatePreviewShell>
          </div>
        </div>
      );
    }

    return (
      <div className="flex h-full min-h-0 flex-col overflow-hidden">
        {/* 顶部模板标签页 — 一行横向排列，和图1完全一致 */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 flex-shrink-0" style={{ scrollbarWidth: 'none' }}>
          {filteredTemplateWorkspaceItems.map((template) => {
            const isActive = activeTemplate?.id === template.id;
            return (
              <button
                key={template.id}
                type="button"
                onClick={() => setSelectedTemplateId(template.id)}
                className={`whitespace-nowrap px-4 py-2 rounded-md text-sm font-medium transition-colors flex-shrink-0 ${
                  isActive
                    ? 'bg-[#F96302] text-white shadow-sm'
                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {template.name}
              </button>
            );
          })}
        </div>

        {/* 主体：深灰背景 + 居中A4文档 + 右侧工具条 */}
        {activeTemplate && (
          <TemplateCenterPreviewViewport
            resetKey={`${activeTemplate.id}-${templateHubView}`}
            zoom={previewScale}
            onZoomIn={() => setPreviewScale(Math.min(previewScale + 10, 150))}
            onZoomOut={() => setPreviewScale(Math.max(previewScale - 10, 30))}
            onOpenEditor={() => setTemplateHubView('editor')}
          >
            {activeTemplate.id === 'qr' ? (
              <div style={{ width: `${qrTemplateLayout.canvasWidthMm}mm` }}>
                <QuoteRequirementDocument
                  data={qrTemplateData}
                  layoutConfig={qrTemplateLayout}
                  textOverrides={qrTemplateTextOverrides}
                />
              </div>
            ) : activeTemplate.id === 'xj' ? (
              <XJDocument data={xjTemplateData} layoutConfig={xjTemplateLayout} />
            ) : activeTemplate.id === 'sc' ? (
              <SalesContractDocument data={scTemplateData} layoutConfig={scTemplateLayout} />
            ) : activeTemplate.id === 'cg' ? (
              <PurchaseOrderDocumentA4Pages data={cgTemplateData} />
            ) : activeTemplate.id === 'pi' ? (
              <ProformaInvoiceDocument data={piTemplateData} layoutConfig={piTemplateLayout} />
            ) : activeTemplate.id === 'ci' ? (
              <CommercialInvoiceDocument data={ciTemplateData} layoutConfig={ciTemplateLayout} />
            ) : activeTemplate.id === 'pl' ? (
              <PackingListDocument data={plTemplateData} layoutConfig={plTemplateLayout} />
            ) : activeTemplate.id === 'soa' ? (
              <StatementOfAccountDocument data={soaTemplateData} layoutConfig={soaTemplateLayout} />
            ) : activeTemplate.id === 'ing' ? (
              <CustomerInquiryDocument
                data={inquiryTemplateData}
                layoutConfig={inquiryTemplateLayout}
                highlightedRequirementKey={activeInquiryRequirementField}
              />
            ) : activeTemplate.id === 'qt' ? (
              <QuotationDocumentA4Pages data={quotationTemplateData} />
            ) : (
              <div className="bg-white shadow-lg rounded" style={{ width: '210mm', minHeight: '297mm' }}>
                <div className="flex flex-col items-center justify-center h-full min-h-[297mm] text-center p-12">
                  <div className="text-6xl mb-6">{activeTemplate.icon}</div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">{activeTemplate.name}</h2>
                  <p className="text-base text-gray-500 mb-1">{activeTemplate.nameEn}</p>
                  <p className="text-sm text-gray-400 mt-4">{activeTemplate.description}</p>
                  <p className="text-xs text-gray-300 mt-8">模板组件接入中，请先在编辑器中完成模板设计</p>
                </div>
              </div>
            )}
          </TemplateCenterPreviewViewport>
        )}
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-3">
        {/* 头部 */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900" style={{ fontSize: '15px' }}>单证中心</h3>
              {userRole === 'admin' && (
                <div className="ml-2 inline-flex rounded-lg border border-gray-200 bg-white p-1">
                  <button
                    type="button"
                    onClick={() => setAdminWorkspaceMode('template-hub')}
                    className="px-2.5 py-1 text-[11px] rounded-md text-gray-600 hover:bg-gray-100"
                  >
                    模板中心
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdminWorkspaceMode('document-center')}
                    className="px-2.5 py-1 text-[11px] rounded-md bg-blue-600 text-white"
                  >
                    出货单证
                  </button>
                </div>
              )}
              {userRole === 'customer' && (
                <Badge className="h-5 px-2 text-[10px] bg-amber-50 text-amber-700 border-amber-200">客户视图</Badge>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-0.5">超紧凑表格视图，一屏显示更多订单</p>
          </div>
          {selectedDocuments.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-600">已选择 {selectedDocuments.length} 项</span>
              <Button size="sm" variant="outline" className="h-7 text-xs">
                <Download className="w-3 h-3 mr-1" />批量下载
              </Button>
              <Button size="sm" className="h-7 text-xs bg-[#F96302] hover:bg-[#E55A02]">
                <Send className="w-3 h-3 mr-1" />批量发送
              </Button>
            </div>
          )}
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-7 gap-2">
          {[
            { label: '订单数', value: stats.orders, color: 'indigo', icon: Layers },
            { label: '全部单证', value: stats.total, color: 'gray', icon: Archive },
            { label: 'SC', value: stats.SC, color: 'blue', icon: FileText },
            { label: 'CI', value: stats.CI, color: 'emerald', icon: FileText },
            { label: 'PL', value: stats.PL, color: 'orange', icon: Package },
            { label: 'BL', value: stats.BL, color: 'purple', icon: Ship },
            { label: '已发送', value: stats.sent, color: 'green', icon: MailCheck }
          ].map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className={`border-l-4 border-l-${stat.color}-500`}>
                <CardContent className="p-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[13px] text-gray-500">{stat.label}</p>
                      <p className={`text-lg font-bold text-${stat.color}-600`}>{stat.value}</p>
                    </div>
                    <Icon className={`w-5 h-5 text-${stat.color}-500`} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* 筛选栏 */}
        <Card>
          <CardContent className="p-3">
            <div className="grid grid-cols-12 gap-2">
              <div className="col-span-4 relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <Input 
                  placeholder="搜索单证编号、合同编号、客户..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 h-8 text-xs"
                />
              </div>
              <div className="col-span-2">
                <Input type="date" value={dateRange.start} onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })} className="h-8 text-xs" />
              </div>
              <div className="col-span-2">
                <Input type="date" value={dateRange.end} onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })} className="h-8 text-xs" />
              </div>
              <div className="col-span-1">
                <Select value={regionFilter} onValueChange={setRegionFilter}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="区域" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" style={{ fontSize: '11px' }}>全部</SelectItem>
                    <SelectItem value="NA" style={{ fontSize: '11px' }}>北美</SelectItem>
                    <SelectItem value="EU" style={{ fontSize: '11px' }}>欧非</SelectItem>
                    <SelectItem value="SA" style={{ fontSize: '11px' }}>南美</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-1">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="状态" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" style={{ fontSize: '11px' }}>全部</SelectItem>
                    <SelectItem value="sent" style={{ fontSize: '11px' }}>已发送</SelectItem>
                    <SelectItem value="generated" style={{ fontSize: '11px' }}>已生成</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {userRole !== 'customer' && (
                <div className="col-span-2">
                  <Select value={customerFilter} onValueChange={setCustomerFilter}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="客户" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" style={{ fontSize: '11px' }}>全部客户</SelectItem>
                      {uniqueCustomers.map(customer => (
                        <SelectItem key={customer} value={customer} style={{ fontSize: '11px' }}>{customer}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 表格 */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 border-b-2 border-gray-200">
                  <tr>
                    <th className="text-left p-2 text-sm font-semibold text-gray-600 w-8"></th>
                    <th className="text-left p-2 text-sm font-semibold text-gray-600 w-8"></th>
                    <th className="text-left p-2 text-sm font-semibold text-gray-600">合同编号</th>
                    <th className="text-left p-2 text-sm font-semibold text-gray-600">客户名称</th>
                    <th className="text-left p-2 text-sm font-semibold text-gray-600 w-16">区域</th>
                    <th className="text-left p-2 text-sm font-semibold text-gray-600 w-24">出货日期</th>
                    <th className="text-center p-2 text-sm font-semibold text-gray-600">单证状态</th>
                    <th className="text-center p-2 text-sm font-semibold text-gray-600 w-24">发送状态</th>
                    <th className="text-center p-2 text-sm font-semibold text-gray-600 w-20">完成度</th>
                    <th className="text-right p-2 text-sm font-semibold text-gray-600 w-20">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orderGroups.map((group) => {
                    const isExpanded = expandedRows.includes(group.contractNumber);
                    const allDocIds = Object.values(group.documents).filter(Boolean).map(d => d!.id);
                    const allSelected = allDocIds.every(id => selectedDocuments.includes(id));
                    const completionRate = group.totalDocuments > 0 
                      ? Math.round((group.completedDocuments / group.totalDocuments) * 100) 
                      : 0;

                    return (
                      <React.Fragment key={group.contractNumber}>
                        {/* 主行 */}
                        <tr className="hover:bg-blue-50/30 transition-colors">
                          <td className="p-2">
                            <button onClick={() => toggleRow(group.contractNumber)} className="hover:bg-gray-200 rounded p-0.5">
                              {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                            </button>
                          </td>
                          <td className="p-2">
                            <Checkbox checked={allSelected} onCheckedChange={() => toggleOrderSelection(group)} className="h-3.5 w-3.5" />
                          </td>
                          <td className="p-2">
                            <p className="text-xs font-semibold text-blue-600 font-mono">{group.contractNumber}</p>
                          </td>
                          <td className="p-2">
                            <p className="text-xs text-gray-900 truncate max-w-[200px]">{group.customerName}</p>
                          </td>
                          <td className="p-2">
                            <Badge variant="outline" className="h-5 px-1.5 text-xs">{getRegionName(group.region)}</Badge>
                          </td>
                          <td className="p-2">
                            <p className="text-xs text-gray-600">{group.shipmentDate}</p>
                          </td>
                          <td className="p-2">
                            <div className="flex items-center justify-center gap-1">
                              {getDocumentBadge(group.documents.SC, 'SC')}
                              {getDocumentBadge(group.documents.CI, 'CI')}
                              {getDocumentBadge(group.documents.PL, 'PL')}
                              {getDocumentBadge(group.documents.BL, 'BL')}
                            </div>
                          </td>
                          <td className="p-2">
                            {(() => {
                              const sendStatus = getOrderSendStatus(group);
                              if (sendStatus.sent === 0) {
                                return (
                                  <div className="text-center">
                                    <p className="text-[11px] text-gray-400">未发送</p>
                                  </div>
                                );
                              }
                              return (
                                <Tooltip>
                                  <TooltipTrigger>
                                    <div className="flex flex-col items-center gap-0.5">
                                      <div className="flex items-center gap-1">
                                        <MailCheck className="w-3 h-3 text-green-600" />
                                        <span className={`text-[11px] font-medium ${
                                          sendStatus.sent === sendStatus.total ? 'text-green-600' : 'text-orange-600'
                                        }`}>
                                          {sendStatus.sent}/{sendStatus.total}
                                        </span>
                                      </div>
                                      {sendStatus.lastSentTime && (
                                        <span className="text-[11px] text-gray-500">
                                          {sendStatus.lastSentTime.slice(5, 16).replace(' ', ' ')}
                                        </span>
                                      )}
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="text-xs">
                                    <p className="font-semibold">发送状态</p>
                                    <p className="text-[11px] text-gray-400">
                                      已发送: {sendStatus.sent}/{sendStatus.total} 份单证
                                    </p>
                                    {sendStatus.lastSentTime && (
                                      <p className="text-[11px] text-green-600">
                                        最后发送: {sendStatus.lastSentTime}
                                      </p>
                                    )}
                                  </TooltipContent>
                                </Tooltip>
                              );
                            })()}
                          </td>
                          <td className="p-2">
                            <div className="flex items-center justify-center gap-1.5">
                              <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full transition-all ${
                                    completionRate === 100 ? 'bg-green-500' : 
                                    completionRate >= 50 ? 'bg-blue-500' : 'bg-orange-500'
                                  }`}
                                  style={{ width: `${completionRate}%` }}
                                />
                              </div>
                              <span className="text-[11px] font-semibold text-gray-700">{group.completedDocuments}/{group.totalDocuments}</span>
                            </div>
                          </td>
                          <td className="p-2">
                            <div className="flex items-center justify-end gap-0.5">
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0"><Eye className="w-3 h-3" /></Button>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0"><Download className="w-3 h-3" /></Button>
                              {userRole !== 'customer' && (
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0"><Send className="w-3 h-3" /></Button>
                              )}
                            </div>
                          </td>
                        </tr>

                        {/* 展开行 */}
                        {isExpanded && (
                          <tr className="bg-gray-50">
                            <td colSpan={9} className="p-3">
                              <div className="space-y-2">
                                {(['SC', 'CI', 'PL', 'BL'] as DocumentType[]).map((docType) => {
                                  const doc = group.documents[docType];
                                  if (!doc) return null;

                                  return (
                                    <div key={doc.id} className="flex items-center gap-3 bg-white p-2 rounded border border-gray-200">
                                      <Checkbox 
                                        checked={selectedDocuments.includes(doc.id)}
                                        onCheckedChange={() => toggleDocumentSelection(doc.id)}
                                        className="h-3.5 w-3.5"
                                      />
                                      <Badge className={`h-5 px-2 text-xs ${
                                        docType === 'SC' ? 'bg-blue-500' :
                                        docType === 'CI' ? 'bg-emerald-500' :
                                        docType === 'PL' ? 'bg-orange-500' : 'bg-purple-500'
                                      }`}>
                                        {docType}
                                      </Badge>
                                      <p className="text-xs font-mono flex-1">{doc.documentNumber}</p>
                                      <p className="text-[11px] text-gray-500">生成: {doc.generatedDate}</p>
                                      <p className="text-[11px] text-gray-500">{doc.fileSize}KB</p>
                                      {doc.sentHistory.length > 0 && (
                                        <p className="text-[11px] text-green-600 font-medium">已发 {doc.sentHistory.length}次</p>
                                      )}
                                      <div className="flex gap-0.5">
                                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0"><Eye className="w-3 h-3" /></Button>
                                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0"><Download className="w-3 h-3" /></Button>
                                        {userRole !== 'customer' && (
                                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => openSendDialog(doc)}>
                                            <Send className="w-3 h-3" />
                                          </Button>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* 底部统计 */}
        <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
          <span>共 {orderGroups.length} 个订单</span>
          <span>共 {filteredDocuments.length} 份单证</span>
        </div>

        {/* 发送对话框 */}
        <SendDocumentDialog open={sendDialogOpen} onOpenChange={setSendDialogOpen} document={selectedDoc} />
      </div>
    </TooltipProvider>
  );
}

// 发送单证对话框
function SendDocumentDialog({ open, onOpenChange, document }: any) {
  const [emailTo, setEmailTo] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');

  React.useEffect(() => {
    if (open && document) {
      setEmailTo(document.customerEmail);
      setEmailSubject(`【高盛达富】${document.documentNumber}`);
      setEmailBody(`尊敬的 ${document.customerName}：\n\n您好！\n\n附件为您的订单 ${document.contractNumber} 的相关单证，请查收。\n\n此致\n敬礼\n\n福建高盛达富建材有限公司`);
    }
  }, [open, document]);

  if (!document) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="w-5 h-5 text-blue-600" />发送单证给客户
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded p-3">
            <p className="text-xs font-medium text-blue-900 mb-2">单证信息</p>
            <div className="grid grid-cols-2 gap-2 text-xs text-blue-700">
              <div>单证编号: {document.documentNumber}</div>
              <div>客户名称: {document.customerName}</div>
            </div>
          </div>
          <div>
            <Label className="text-xs">收件人 *</Label>
            <Input value={emailTo} onChange={(e) => setEmailTo(e.target.value)} className="h-9 text-xs mt-1" />
          </div>
          <div>
            <Label className="text-xs">邮件主题 *</Label>
            <Input value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} className="h-9 text-xs mt-1" />
          </div>
          <div>
            <Label className="text-xs">邮件正文 *</Label>
            <Textarea value={emailBody} onChange={(e) => setEmailBody(e.target.value)} className="text-xs mt-1 min-h-[150px]" />
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>取消</Button>
            <Button size="sm" className="bg-[#F96302] hover:bg-[#E55A02]">
              <Send className="w-3.5 h-3.5 mr-1.5" />发送邮件
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
