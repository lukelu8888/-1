import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Card, CardContent } from '../ui/card';
import { 
  FileText, Download, Send, Eye, Filter, Calendar,
  Search, Globe, Building2, Package, Ship, FileCheck,
  Clock, CheckCircle2, MailCheck, FolderOpen,
  Archive, Users, X, ChevronRight, ChevronLeft,
  Layers, AlertCircle, ExternalLink, MoreVertical, Settings2,
  ArrowUp, ArrowDown,
  GripVertical, Pencil, Check
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
import { templateCenterService, xjService, isTemplateCenterSupabaseUnreachable, retryTemplateCenterSupabase } from '../../lib/supabaseService';
import {
  type QuoteRequirementDocumentData,
  type QuoteRequirementPreviewLayout,
  type QuoteRequirementTextOverrides,
  DEFAULT_QUOTE_REQUIREMENT_PREVIEW_LAYOUT,
  buildDefaultQuoteRequirementTextOverrides,
} from '../documents/templates/QuoteRequirementDocument';
import { type XJData } from '../documents/templates/XJDocument';
import {
  DEFAULT_SALES_CONTRACT_PRODUCT_TABLE_COLUMNS,
  type SalesContractData,
} from '../documents/templates/SalesContractDocument';
import {
  DEFAULT_PURCHASE_ORDER_PRODUCT_TABLE_COLUMNS,
  type PurchaseOrderData,
} from '../documents/templates/PurchaseOrderDocument';
import {
  DEFAULT_PROFORMA_INVOICE_GOODS_TABLE_COLUMNS,
  type ProformaInvoiceData,
} from '../documents/templates/ProformaInvoiceDocument';
import { type CommercialInvoiceData } from '../documents/templates/CommercialInvoiceDocument';
import { type PackingListData } from '../documents/templates/PackingListDocument';
import { type StatementOfAccountData } from '../documents/templates/StatementOfAccountDocument';
import {
  CUSTOMER_INQUIRY_REQUIREMENT_FIELDS,
  DEFAULT_CUSTOMER_INQUIRY_PRODUCT_TABLE_COLUMNS,
  type CustomerInquiryData,
} from '../documents/templates/CustomerInquiryDocument';
import { DEFAULT_COMMERCIAL_INVOICE_GOODS_TABLE_COLUMNS } from '../documents/templates/CommercialInvoiceDocument';
import {
  DEFAULT_QUOTATION_PRODUCT_TABLE_COLUMNS,
  type QuotationData,
} from '../documents/templates/QuotationDocument';
import { type SupplierQuotationData } from '../documents/templates/SupplierQuotationDocument';
import {
  BASELINE_BJ_TEMPLATE_SEED,
  BASELINE_CG_TEMPLATE_SEED,
  BASELINE_CI_TEMPLATE_SEED,
  BASELINE_ING_TEMPLATE_SEED,
  BASELINE_PI_TEMPLATE_SEED,
  BASELINE_PL_TEMPLATE_SEED,
  BASELINE_PR_TEMPLATE_SEED,
  BASELINE_QR_TEMPLATE_SEED,
  BASELINE_QT_TEMPLATE_SEED,
  BASELINE_SC_TEMPLATE_SEED,
  BASELINE_SOA_TEMPLATE_SEED,
  BASELINE_XJ_TEMPLATE_SEED,
  INITIAL_PR_TEXT_OVERRIDES,
  buildQrSalesDeptNotesFromInquiry,
  EMPTY_XJ_TERMS,
  INITIAL_QR_TEXT_OVERRIDES,
  XJ_TERMS_PRESETS,
} from './document-center/templateCenterSeeds';
import { VersionHistoryPanel } from './document-center/VersionHistoryPanel';
import { buildTemplateEditorContentProps } from './document-center/buildTemplateEditorContentProps';
import { buildTemplatePreviewContentProps } from './document-center/buildTemplatePreviewContentProps';
import { TemplateEditorContent } from './document-center/TemplateEditorContent';
import { TemplatePreviewContent } from './document-center/TemplatePreviewContent';
import { TemplateCenterPreviewViewport } from '../documents/TemplateCenterPreviewViewport';
import { useAdminOrganization, type AdminOrgProfile } from '../../contexts/AdminOrganizationContext';
import { getCustomerProfile } from '../dashboard/CustomerProfile';
import { findSupplier, toSupplierProfile } from '../../data/suppliersData';

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
  qtLogoWidthPx?: number;
  qtLogoHeightPx?: number;
  qtInfoTableWidthPx?: number;
  qtTableCellPaddingY?: number;
  qtCompanyTableWidthPercent?: number;
  qtProductsTableWidthPercent?: number;
  qtTermsTableWidthPercent?: number;
  qtRemarksTableWidthPercent?: number;
  qtPreparedByTableWidthPercent?: number;
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

interface PrTemplateVersionRecord extends QrTemplateVersionRecord {}

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

interface BjTemplateVersionRecord {
  id: string;
  version: string;
  status: QrVersionRecordStatus;
  savedAt: string;
  savedBy: string;
  note: string;
  data: SupplierQuotationData;
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

interface LoadedTemplateVersionMeta {
  version: string;
  status: TemplatePublishStatus;
  savedAt: string;
  savedBy: string;
  note: string;
}

interface XjTermsPreset {
  id: string;
  name: string;
  description: string;
  terms: Partial<XJData['terms']>;
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
  pr: { currentVersion: 'v1.0.0', status: 'draft', lastPublishedAt: '2026-03-25 15:00', lastEditedBy: 'Procurement Admin', schemaMode: 'template-center-ready' },
  xj: { currentVersion: 'v1.1.0', status: 'published', lastPublishedAt: '2026-03-03 16:40', lastEditedBy: 'Procurement Admin', schemaMode: 'template-center-ready' },
  bj: { currentVersion: 'v1.0.0', status: 'published', lastPublishedAt: '2026-03-03 10:20', lastEditedBy: 'Procurement Admin', schemaMode: 'template-center-ready' },
  pi: { currentVersion: 'v1.0.0', status: 'draft', lastPublishedAt: '2026-02-27 16:00', lastEditedBy: 'Finance Admin', schemaMode: 'legacy-v1' },
  sc: { currentVersion: 'v2.1.0', status: 'published', lastPublishedAt: '2026-03-03 18:15', lastEditedBy: 'Contract Admin', schemaMode: 'template-center-ready' },
  cg: { currentVersion: 'v1.3.0', status: 'published', lastPublishedAt: '2026-03-03 11:50', lastEditedBy: 'Procurement Admin', schemaMode: 'template-center-ready' },
  ci: { currentVersion: 'v1.1.0', status: 'published', lastPublishedAt: '2026-02-25 15:10', lastEditedBy: 'Docs Admin', schemaMode: 'legacy-v1' },
  pl: { currentVersion: 'v1.1.0', status: 'published', lastPublishedAt: '2026-02-25 15:30', lastEditedBy: 'Docs Admin', schemaMode: 'legacy-v1' },
  soa: { currentVersion: 'v0.9.0', status: 'draft', lastPublishedAt: '2026-02-20 09:00', lastEditedBy: 'Finance Admin', schemaMode: 'legacy-v1' },
};

const TEMPLATE_HUB_TAB_ORDER_STORAGE_KEY = 'templateHubTabOrder_v1';
const TEMPLATE_HUB_TAB_NAME_OVERRIDES_STORAGE_KEY = 'templateHubTabNameOverrides_v1';

function normalizeWorkspaceTemplateId(templateId: string) {
  return templateId;
}

function deriveTemplateNameEnFromCn(nameCn: string, fallbackNameEn: string) {
  const normalized = String(nameCn || '').trim().toUpperCase();
  if (!normalized) return fallbackNameEn;
  if (/^[A-Z]{2,4}$/.test(normalized)) return normalized;
  return fallbackNameEn;
}

const DEFAULT_WORKSPACE_PREVIEW_LAYOUT: WorkspacePreviewLayout = {
  canvasWidthMm: 210,
  canvasMinHeightMm: 297,
  contentPaddingTopMm: 10,
  contentPaddingBottomMm: 12,
  fontSizePt: 10,
  lineHeight: 1.5,
  qtLogoWidthPx: 80,
  qtLogoHeightPx: 70,
  qtInfoTableWidthPx: 240,
  qtTableCellPaddingY: 6,
  qtCompanyTableWidthPercent: 100,
  qtProductsTableWidthPercent: 100,
  qtTermsTableWidthPercent: 100,
  qtRemarksTableWidthPercent: 100,
  qtPreparedByTableWidthPercent: 100,
};

const cloneQrState = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const normalizeWorkspacePreviewLayout = (layout?: Partial<WorkspacePreviewLayout> | null): WorkspacePreviewLayout => ({
  ...DEFAULT_WORKSPACE_PREVIEW_LAYOUT,
  ...(layout || {}),
});

const normalizeQuotationCompanyFromAdminOrg = (
  quotation: QuotationData,
  adminOrg: AdminOrgProfile,
  adminUserEmail?: string,
): QuotationData => ({
  ...quotation,
  company: {
    ...quotation.company,
    name: adminOrg.nameCN || quotation.company.name,
    nameEn: adminOrg.nameEN || adminOrg.nameCN || quotation.company.nameEn,
    address: adminOrg.addressCN || adminOrg.addressEN || quotation.company.address,
    addressEn: adminOrg.addressEN || adminOrg.addressCN || quotation.company.addressEn,
    tel: adminOrg.phone || quotation.company.tel,
    fax: '',
    email: adminOrg.email || adminUserEmail || quotation.company.email,
    website: adminOrg.website || quotation.company.website,
    logo: adminOrg.logoUrl || quotation.company.logo,
  },
});

const normalizeXjBuyerFromAdminOrg = (
  data: XJData,
  adminOrg: AdminOrgProfile,
  adminUserEmail?: string,
  adminUserName?: string,
): XJData => ({
  ...data,
  buyer: {
    ...data.buyer,
    name: adminOrg.nameCN || data.buyer.name,
    nameEn: adminOrg.nameEN || adminOrg.nameCN || data.buyer.nameEn,
    address: adminOrg.addressCN || adminOrg.addressEN || data.buyer.address,
    addressEn: adminOrg.addressEN || adminOrg.addressCN || data.buyer.addressEn,
    tel: adminOrg.phone || data.buyer.tel,
    email: adminOrg.email || adminUserEmail || data.buyer.email,
    contactPerson:
      adminOrg.contactPerson ||
      adminOrg.documentDefaults.defaultSignatory ||
      adminUserName ||
      data.buyer.contactPerson,
  },
});

const normalizeBjBuyerFromAdminOrg = (
  data: SupplierQuotationData,
  adminOrg: AdminOrgProfile,
  adminUserEmail?: string,
  adminUserName?: string,
): SupplierQuotationData => ({
  ...data,
  buyer: {
    ...data.buyer,
    name: adminOrg.nameCN || data.buyer.name,
    nameEn: adminOrg.nameEN || adminOrg.nameCN || data.buyer.nameEn,
    address: adminOrg.addressCN || adminOrg.addressEN || data.buyer.address,
    addressEn: adminOrg.addressEN || adminOrg.addressCN || data.buyer.addressEn,
    tel: adminOrg.phone || data.buyer.tel,
    email: adminOrg.email || adminUserEmail || data.buyer.email,
    contactPerson:
      adminOrg.contactPerson ||
      adminOrg.documentDefaults.defaultSignatory ||
      adminUserName ||
      data.buyer.contactPerson,
  },
});

const normalizeScSellerFromAdminOrg = (
  data: SalesContractData,
  adminOrg: AdminOrgProfile,
  adminUserEmail?: string,
): SalesContractData => ({
  ...data,
  seller: {
    ...data.seller,
    name: adminOrg.nameCN || data.seller.name,
    nameEn: adminOrg.nameEN || adminOrg.nameCN || data.seller.nameEn,
    address: adminOrg.addressCN || adminOrg.addressEN || data.seller.address,
    addressEn: adminOrg.addressEN || adminOrg.addressCN || data.seller.addressEn,
    tel: adminOrg.phone || data.seller.tel,
    fax: '',
    email: adminOrg.email || adminUserEmail || data.seller.email,
    businessLicense: adminOrg.taxId || data.seller.businessLicense,
    legalRepresentative:
      adminOrg.contactPerson ||
      adminOrg.documentDefaults.defaultSignatory ||
      data.seller.legalRepresentative,
    bankInfo: {
      ...(data.seller.bankInfo || {}),
      bankName: adminOrg.bankUSD.bankName || data.seller.bankInfo?.bankName || '',
      accountName: adminOrg.bankUSD.accountName || data.seller.bankInfo?.accountName || '',
      accountNumber: adminOrg.bankUSD.accountNumber || data.seller.bankInfo?.accountNumber || '',
      swiftCode: adminOrg.bankUSD.swift || data.seller.bankInfo?.swiftCode || '',
      bankAddress: adminOrg.bankUSD.bankAddress || data.seller.bankInfo?.bankAddress || '',
      currency: data.seller.bankInfo?.currency || 'USD',
      routingNumber: data.seller.bankInfo?.routingNumber || '',
      iban: data.seller.bankInfo?.iban || '',
      paymentNote: data.seller.bankInfo?.paymentNote || adminOrg.bankUSD.paymentNote || '',
    },
  },
  signature: {
    ...data.signature,
    sellerSignatory:
      adminOrg.documentDefaults.defaultSignatory ||
      adminOrg.contactPerson ||
      data.signature?.sellerSignatory ||
      '',
  },
});

const normalizeCgBuyerFromAdminOrg = (
  data: PurchaseOrderData,
  adminOrg: AdminOrgProfile,
  adminUserEmail?: string,
): PurchaseOrderData => ({
  ...data,
  buyer: {
    ...data.buyer,
    name: adminOrg.nameCN || data.buyer.name,
    nameEn: adminOrg.nameEN || adminOrg.nameCN || data.buyer.nameEn,
    address: adminOrg.addressCN || adminOrg.addressEN || data.buyer.address,
    addressEn: adminOrg.addressEN || adminOrg.addressCN || data.buyer.addressEn,
    tel: adminOrg.phone || data.buyer.tel,
    email: adminOrg.email || adminUserEmail || data.buyer.email,
    contactPerson:
      adminOrg.contactPerson ||
      adminOrg.documentDefaults.defaultSignatory ||
      data.buyer.contactPerson,
  },
});

const normalizePiFromAdminOrg = (
  data: ProformaInvoiceData,
  adminOrg: AdminOrgProfile,
  adminUserEmail?: string,
): ProformaInvoiceData => ({
  ...data,
  seller: {
    ...data.seller,
    name: adminOrg.nameCN || data.seller.name,
    nameEn: adminOrg.nameEN || adminOrg.nameCN || data.seller.nameEn,
    address: adminOrg.addressCN || adminOrg.addressEN || data.seller.address,
    addressEn: adminOrg.addressEN || adminOrg.addressCN || data.seller.addressEn,
    unit: data.seller.unit,
    building: data.seller.building,
    zone: data.seller.zone,
    plaza: data.seller.plaza,
    district: data.seller.district,
    city: data.seller.city,
    province: data.seller.province,
    country: data.seller.country,
    cell: adminOrg.phone || data.seller.cell,
    email: adminOrg.email || adminUserEmail || data.seller.email,
    logoUrl: adminOrg.logoUrl || data.seller.logoUrl,
  },
  bankInfo: {
    ...data.bankInfo,
    beneficiary: adminOrg.bankUSD.accountName || data.bankInfo.beneficiary,
    beneficiaryAddress:
      adminOrg.addressEN || adminOrg.addressCN || data.bankInfo.beneficiaryAddress,
    accountNo: adminOrg.bankUSD.accountNumber || data.bankInfo.accountNo,
    bank: adminOrg.bankUSD.bankName || data.bankInfo.bank,
    bankAddress: adminOrg.bankUSD.bankAddress || data.bankInfo.bankAddress,
    swiftCode: adminOrg.bankUSD.swift || data.bankInfo.swiftCode,
  },
});

const normalizeCiExporterFromAdminOrg = (
  data: CommercialInvoiceData,
  adminOrg: AdminOrgProfile,
): CommercialInvoiceData => ({
  ...data,
  exporter: {
    ...data.exporter,
    name: adminOrg.nameCN || data.exporter.name,
    nameEn: adminOrg.nameEN || adminOrg.nameCN || data.exporter.nameEn,
    address: adminOrg.addressCN || adminOrg.addressEN || data.exporter.address,
    addressEn: adminOrg.addressEN || adminOrg.addressCN || data.exporter.addressEn,
    tel: adminOrg.phone || data.exporter.tel,
    taxId: adminOrg.taxId || data.exporter.taxId,
  },
});

const normalizePlExporterFromAdminOrg = (
  data: PackingListData,
  adminOrg: AdminOrgProfile,
): PackingListData => ({
  ...data,
  exporter: {
    ...data.exporter,
    name: adminOrg.nameEN || adminOrg.nameCN || data.exporter.name,
    address: adminOrg.addressEN || adminOrg.addressCN || data.exporter.address,
  },
});

const normalizeSoaCompanyFromAdminOrg = (
  data: StatementOfAccountData,
  adminOrg: AdminOrgProfile,
  adminUserEmail?: string,
): StatementOfAccountData => ({
  ...data,
  company: {
    ...data.company,
    name: adminOrg.nameCN || data.company.name,
    nameEn: adminOrg.nameEN || adminOrg.nameCN || data.company.nameEn,
    address: adminOrg.addressCN || adminOrg.addressEN || data.company.address,
    addressEn: adminOrg.addressEN || adminOrg.addressCN || data.company.addressEn,
    tel: adminOrg.phone || data.company.tel,
    email: adminOrg.email || adminUserEmail || data.company.email,
    accountName: adminOrg.bankUSD.accountName || data.company.accountName,
    bankName: adminOrg.bankUSD.bankName || data.company.bankName,
    accountNumber: adminOrg.bankUSD.accountNumber || data.company.accountNumber,
    swiftCode: adminOrg.bankUSD.swift || data.company.swiftCode,
    bankAddress: adminOrg.bankUSD.bankAddress || data.company.bankAddress,
    paymentNote: adminOrg.bankUSD.paymentNote || data.company.paymentNote,
  },
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
  const { adminOrg, adminUserProfile } = useAdminOrganization();
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
  const [templateHubManagerOpen, setTemplateHubManagerOpen] = useState(false);
  const [templateHubTabOrder, setTemplateHubTabOrder] = useState<string[]>([]);
  const [templateHubTabNameOverrides, setTemplateHubTabNameOverrides] = useState<Record<string, string>>({});
  const hasLocalTemplateHubOrderRef = useRef(false);
  const templateHubOrderPersistTimerRef = useRef<number | null>(null);
  const pendingTemplateHubOrderRef = useRef<string[] | null>(null);
  const isPersistingTemplateHubOrderRef = useRef(false);
  const [qrTemplateData, setQrTemplateData] = useState<QuoteRequirementDocumentData>(() => ({
    ...BASELINE_QR_TEMPLATE_SEED,
    salesDeptNotes: buildQrSalesDeptNotesFromInquiry(BASELINE_ING_TEMPLATE_SEED),
  }));
  const [qrTemplateLayout, setQrTemplateLayout] = useState<QuoteRequirementPreviewLayout>(DEFAULT_QUOTE_REQUIREMENT_PREVIEW_LAYOUT);
  const [qrTemplateTextOverrides, setQrTemplateTextOverrides] = useState<QuoteRequirementTextOverrides>(
    INITIAL_QR_TEXT_OVERRIDES
  );
  const [prTemplateData, setPrTemplateData] = useState<QuoteRequirementDocumentData>(BASELINE_PR_TEMPLATE_SEED);
  const [prTemplateLayout, setPrTemplateLayout] = useState<QuoteRequirementPreviewLayout>(DEFAULT_QUOTE_REQUIREMENT_PREVIEW_LAYOUT);
  const [prTemplateTextOverrides, setPrTemplateTextOverrides] = useState<QuoteRequirementTextOverrides>(
    INITIAL_PR_TEXT_OVERRIDES
  );
  const [xjTemplateData, setXjTemplateData] = useState<XJData>(BASELINE_XJ_TEMPLATE_SEED);
  const [bjTemplateData, setBjTemplateData] = useState<SupplierQuotationData>(BASELINE_BJ_TEMPLATE_SEED);
  const [scTemplateData, setScTemplateData] = useState<SalesContractData>(BASELINE_SC_TEMPLATE_SEED);
  const [cgTemplateData, setCgTemplateData] = useState<PurchaseOrderData>(BASELINE_CG_TEMPLATE_SEED);
  const [piTemplateData, setPiTemplateData] = useState<ProformaInvoiceData>(BASELINE_PI_TEMPLATE_SEED);
  const [ciTemplateData, setCiTemplateData] = useState<CommercialInvoiceData>(BASELINE_CI_TEMPLATE_SEED);
  const [plTemplateData, setPlTemplateData] = useState<PackingListData>(BASELINE_PL_TEMPLATE_SEED);
  const [soaTemplateData, setSoaTemplateData] = useState<StatementOfAccountData>(BASELINE_SOA_TEMPLATE_SEED);
  const [inquiryTemplateData, setInquiryTemplateData] = useState<CustomerInquiryData>(BASELINE_ING_TEMPLATE_SEED);
  const [activeInquiryRequirementField, setActiveInquiryRequirementField] = useState<string | null>(null);
  const [quotationTemplateData, setQuotationTemplateData] = useState<QuotationData>(BASELINE_QT_TEMPLATE_SEED);
  const [xjTemplateLayout, setXjTemplateLayout] = useState<WorkspacePreviewLayout>(cloneQrState(DEFAULT_WORKSPACE_PREVIEW_LAYOUT));
  const [bjTemplateLayout, setBjTemplateLayout] = useState<WorkspacePreviewLayout>(cloneQrState(DEFAULT_WORKSPACE_PREVIEW_LAYOUT));
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
  const [prVersionHistory, setPrVersionHistory] = useState<PrTemplateVersionRecord[]>([]);
  const [prTemplateVersionNote, setPrTemplateVersionNote] = useState('采购请求单模板作为 SC 和 CG 之间的采购拆单桥梁。');
  const [xjVersionHistory, setXjVersionHistory] = useState<XjTemplateVersionRecord[]>([]);
  const [xjTemplateVersionNote, setXjTemplateVersionNote] = useState('采购询价单模板接入真实字段编辑和真实预览。');
  const [bjVersionHistory, setBjVersionHistory] = useState<BjTemplateVersionRecord[]>([]);
  const [bjTemplateVersionNote, setBjTemplateVersionNote] = useState('供应商报价单模板接入真实字段编辑和真实预览。');
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
  const [collapsedTemplateVersionHistoryMap, setCollapsedTemplateVersionHistoryMap] = useState<Record<string, boolean>>({
    qr: true,
    pr: true,
    xj: true,
    bj: true,
    sc: true,
    cg: true,
    pi: true,
    ci: true,
    pl: true,
    soa: true,
    ing: true,
    qt: true,
  });
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
  const [loadedTemplateVersionMap, setLoadedTemplateVersionMap] = useState<Record<string, LoadedTemplateVersionMeta>>({});
  const [templateHubView, setTemplateHubView] = useState<'detail' | 'editor'>('detail');
  const [previewScale, setPreviewScale] = useState(80);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [editingTemplateTabId, setEditingTemplateTabId] = useState<string | null>(null);
  const [editingTemplateTabName, setEditingTemplateTabName] = useState('');
  const [draggedTemplateTabId, setDraggedTemplateTabId] = useState<string | null>(null);
  const [dragOverTemplateTabId, setDragOverTemplateTabId] = useState<string | null>(null);
  const [xjBindingStatusRows, setXjBindingStatusRows] = useState<Array<{
    nodeCode: string;
    templateVersionId: string | null;
    version: string | null;
    status: string | null;
    publishedAt: string | null;
    updatedAt: string | null;
    isDefault: boolean;
  }>>([]);
  const [xjRecentVersionStats, setXjRecentVersionStats] = useState<Array<{ version: string; count: number }>>([]);
  const [xjRecentUnboundCount, setXjRecentUnboundCount] = useState(0);

  useEffect(() => {
    const nextSalesDeptNotes = buildQrSalesDeptNotesFromInquiry(inquiryTemplateData);
    setQrTemplateData((prev) =>
      prev.salesDeptNotes === nextSalesDeptNotes
        ? prev
        : { ...prev, salesDeptNotes: nextSalesDeptNotes }
    );
  }, [inquiryTemplateData]);

  useEffect(() => {
    const customerProfile = getCustomerProfile();
    if (!customerProfile) return;

    setInquiryTemplateData((prev) => ({
      ...prev,
      customer: {
        ...prev.customer,
        companyName: customerProfile.companyName || prev.customer.companyName,
        contactPerson: customerProfile.contactPerson || prev.customer.contactPerson,
        email: customerProfile.email || prev.customer.email,
        phone: customerProfile.phone || prev.customer.phone,
        address: customerProfile.address || prev.customer.address,
      },
    }));
  }, []);

  useEffect(() => {
    const rawSupplier = findSupplier({
      code: xjTemplateData.supplier?.supplierCode,
      email: xjTemplateData.supplier?.email,
      name: xjTemplateData.supplier?.companyName,
    });
    const supplierProfile = rawSupplier ? toSupplierProfile(rawSupplier) : null;

    setXjTemplateData((prev) => {
      const normalizedPrev = normalizeXjBuyerFromAdminOrg(prev, adminOrg, adminUserProfile.email, adminUserProfile.name);
      const nextBuyer = normalizedPrev.buyer;

      const nextSupplier = supplierProfile
        ? {
            ...normalizedPrev.supplier,
            companyName: supplierProfile.name || normalizedPrev.supplier.companyName,
            address: supplierProfile.address || normalizedPrev.supplier.address,
            contactPerson: supplierProfile.contactPerson || normalizedPrev.supplier.contactPerson,
            tel: supplierProfile.phone || normalizedPrev.supplier.tel,
            email: supplierProfile.email || normalizedPrev.supplier.email,
            supplierCode: supplierProfile.code || normalizedPrev.supplier.supplierCode,
          }
        : normalizedPrev.supplier;

      const buyerChanged = JSON.stringify(nextBuyer) !== JSON.stringify(prev.buyer);
      const supplierChanged = JSON.stringify(nextSupplier) !== JSON.stringify(prev.supplier);
      if (!buyerChanged && !supplierChanged) {
        return prev;
      }

      return {
        ...prev,
        buyer: nextBuyer,
        supplier: nextSupplier,
      };
    });
  }, [
    adminOrg.addressCN,
    adminOrg.addressEN,
    adminOrg.contactPerson,
    adminOrg.email,
    adminOrg.nameCN,
    adminOrg.nameEN,
    adminOrg.phone,
    adminUserProfile.email,
    adminUserProfile.name,
    xjTemplateData.supplier?.companyName,
    xjTemplateData.supplier?.email,
    xjTemplateData.supplier?.supplierCode,
  ]);

  useEffect(() => {
    const rawSupplier = findSupplier({
      code: bjTemplateData.supplier?.supplierCode,
      email: bjTemplateData.supplier?.email,
      name: bjTemplateData.supplier?.companyName,
    });
    const supplierProfile = rawSupplier ? toSupplierProfile(rawSupplier) : null;

    setBjTemplateData((prev) => {
      const normalizedPrev = normalizeBjBuyerFromAdminOrg(prev, adminOrg, adminUserProfile.email, adminUserProfile.name);
      const nextBuyer = normalizedPrev.buyer;

      const nextSupplier = supplierProfile
        ? {
            ...normalizedPrev.supplier,
            companyName: supplierProfile.name || normalizedPrev.supplier.companyName,
            address: supplierProfile.address || normalizedPrev.supplier.address,
            contactPerson: supplierProfile.contactPerson || normalizedPrev.supplier.contactPerson,
            tel: supplierProfile.phone || normalizedPrev.supplier.tel,
            email: supplierProfile.email || normalizedPrev.supplier.email,
            supplierCode: supplierProfile.code || normalizedPrev.supplier.supplierCode,
          }
        : normalizedPrev.supplier;

      const buyerChanged = JSON.stringify(nextBuyer) !== JSON.stringify(prev.buyer);
      const supplierChanged = JSON.stringify(nextSupplier) !== JSON.stringify(prev.supplier);
      if (!buyerChanged && !supplierChanged) {
        return prev;
      }

      return {
        ...prev,
        buyer: nextBuyer,
        supplier: nextSupplier,
      };
    });
  }, [
    adminOrg.addressCN,
    adminOrg.addressEN,
    adminOrg.contactPerson,
    adminOrg.documentDefaults.defaultSignatory,
    adminOrg.email,
    adminOrg.nameCN,
    adminOrg.nameEN,
    adminOrg.phone,
    adminUserProfile.email,
    adminUserProfile.name,
    bjTemplateData.supplier?.companyName,
    bjTemplateData.supplier?.email,
    bjTemplateData.supplier?.supplierCode,
  ]);

  useEffect(() => {
    setPiTemplateData((prev) => normalizePiFromAdminOrg(prev, adminOrg, adminUserProfile.email));
  }, [adminOrg, adminUserProfile.email]);

  useEffect(() => {
    setQuotationTemplateData((prev) =>
      normalizeQuotationCompanyFromAdminOrg(prev, adminOrg, adminUserProfile.email),
    );
  }, [adminOrg, adminUserProfile.email]);

  useEffect(() => {
    setScTemplateData((prev) => normalizeScSellerFromAdminOrg(prev, adminOrg, adminUserProfile.email));
  }, [adminOrg, adminUserProfile.email]);

  useEffect(() => {
    setCgTemplateData((prev) => normalizeCgBuyerFromAdminOrg(prev, adminOrg, adminUserProfile.email));
  }, [adminOrg, adminUserProfile.email]);

  useEffect(() => {
    setCiTemplateData((prev) => normalizeCiExporterFromAdminOrg(prev, adminOrg));
  }, [adminOrg]);

  useEffect(() => {
    setPlTemplateData((prev) => normalizePlExporterFromAdminOrg(prev, adminOrg));
  }, [adminOrg]);

  useEffect(() => {
    setSoaTemplateData((prev) => normalizeSoaCompanyFromAdminOrg(prev, adminOrg, adminUserProfile.email));
  }, [adminOrg, adminUserProfile.email]);

  useEffect(() => {
    setQuotationTemplateData((prev) => ({
      ...prev,
      inquiryNo: inquiryTemplateData.inquiryNo || prev.inquiryNo,
      region: inquiryTemplateData.region || prev.region,
      customer: {
        ...prev.customer,
        companyName: inquiryTemplateData.customer.companyName || prev.customer.companyName,
        contactPerson: inquiryTemplateData.customer.contactPerson || prev.customer.contactPerson,
        address: inquiryTemplateData.customer.address || prev.customer.address,
        email: inquiryTemplateData.customer.email || prev.customer.email,
        phone: inquiryTemplateData.customer.phone || prev.customer.phone,
      },
    }));
  }, [inquiryTemplateData]);

  useEffect(() => {
    if (!draggedTemplateTabId) return;

    const stopDraggingTemplateTab = () => {
      setDraggedTemplateTabId(null);
      setDragOverTemplateTabId(null);
    };

    window.addEventListener('mouseup', stopDraggingTemplateTab);
    window.addEventListener('touchend', stopDraggingTemplateTab);

    return () => {
      window.removeEventListener('mouseup', stopDraggingTemplateTab);
      window.removeEventListener('touchend', stopDraggingTemplateTab);
    };
  }, [draggedTemplateTabId]);

  const mergeTemplateWorkspaceData = <T,>(fallbackData: T, incomingData: unknown): T => {
    if (Array.isArray(fallbackData)) {
      return (Array.isArray(incomingData) ? incomingData : fallbackData) as T;
    }

    if (
      fallbackData &&
      typeof fallbackData === 'object' &&
      incomingData &&
      typeof incomingData === 'object' &&
      !Array.isArray(incomingData)
    ) {
      const fallbackRecord = fallbackData as Record<string, unknown>;
      const incomingRecord = incomingData as Record<string, unknown>;
      const merged: Record<string, unknown> = { ...incomingRecord };

      Object.keys(fallbackRecord).forEach((key) => {
        merged[key] = mergeTemplateWorkspaceData(fallbackRecord[key], incomingRecord[key]);
      });

      return merged as T;
    }

    return (incomingData ?? fallbackData) as T;
  };

  const hasTemplateWorkspaceValue = (value: unknown): boolean => {
    if (value == null) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    if (typeof value === 'number' || typeof value === 'boolean') return true;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object') {
      return Object.values(value as Record<string, unknown>).some((entry) => hasTemplateWorkspaceValue(entry));
    }
    return false;
  };

  const resolveTemplateWorkspaceRecordData = <T,>(fallbackData: T, incomingData: unknown): T => {
    if (!hasTemplateWorkspaceValue(incomingData)) {
      return cloneQrState(fallbackData);
    }
    return cloneQrState(incomingData as T);
  };

  const applyWorkspaceRecords = <TRecord extends { data: any; layout: WorkspacePreviewLayout }>(
    records: any[] | null,
    fallbackData: any,
    setHistory: React.Dispatch<React.SetStateAction<TRecord[]>>,
    setData: React.Dispatch<React.SetStateAction<any>>,
    setLayout: React.Dispatch<React.SetStateAction<WorkspacePreviewLayout>>,
    normalizeData?: (data: any) => any,
  ) => {
    if (!records || records.length === 0) return;
    const mapped = records.map((record) => ({
      ...record,
      data: normalizeData
        ? normalizeData(resolveTemplateWorkspaceRecordData(cloneQrState(fallbackData), cloneQrState(record.data)))
        : resolveTemplateWorkspaceRecordData(cloneQrState(fallbackData), cloneQrState(record.data)),
      layout: normalizeWorkspacePreviewLayout(record.layout),
    })) as TRecord[];
    setHistory(mapped);
    setData(
      cloneQrState(
        normalizeData
          ? normalizeData(resolveTemplateWorkspaceRecordData(cloneQrState(fallbackData), mapped[0].data))
          : resolveTemplateWorkspaceRecordData(cloneQrState(fallbackData), mapped[0].data)
      )
    );
    setLayout(cloneQrState(mapped[0].layout));
  };

  const updateLoadedTemplateVersion = (
    templateKey: string,
    record: { version: string; status: QrVersionRecordStatus; savedAt: string; savedBy: string; note: string },
  ) => {
    setLoadedTemplateVersionMap((prev) => ({
      ...prev,
      [templateKey]: {
        version: record.version,
        status: record.status === 'published' ? 'published' : 'draft',
        savedAt: record.savedAt,
        savedBy: record.savedBy,
        note: record.note,
      },
    }));
  };

  const syncTemplateVersionNote = (templateKey: string, note: string) => {
    if (!note) return;
    if (templateKey === 'qr') {
      setQrTemplateVersionNote(note);
      return;
    }
    if (templateKey === 'xj') {
      setXjTemplateVersionNote(note);
      return;
    }
    if (templateKey === 'bj') {
      setBjTemplateVersionNote(note);
      return;
    }
    if (templateKey === 'sc') {
      setScTemplateVersionNote(note);
      return;
    }
    if (templateKey === 'cg') {
      setCgTemplateVersionNote(note);
      return;
    }
    if (templateKey === 'pi') {
      setPiTemplateVersionNote(note);
      return;
    }
    if (templateKey === 'ci') {
      setCiTemplateVersionNote(note);
      return;
    }
    if (templateKey === 'pl') {
      setPlTemplateVersionNote(note);
      return;
    }
    if (templateKey === 'soa') {
      setSoaTemplateVersionNote(note);
      return;
    }
    if (templateKey === 'ing') {
      setInquiryTemplateVersionNote(note);
      return;
    }
    if (templateKey === 'qt') {
      setQuotationTemplateVersionNote(note);
    }
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

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const savedOrder = JSON.parse(window.localStorage.getItem(TEMPLATE_HUB_TAB_ORDER_STORAGE_KEY) || '[]');
      const savedNames = JSON.parse(window.localStorage.getItem(TEMPLATE_HUB_TAB_NAME_OVERRIDES_STORAGE_KEY) || '{}');
      if (Array.isArray(savedOrder)) {
        const normalizedSavedOrder = savedOrder.filter((value): value is string => typeof value === 'string');
        hasLocalTemplateHubOrderRef.current = normalizedSavedOrder.length > 0;
        setTemplateHubTabOrder(normalizedSavedOrder);
      }
      if (savedNames && typeof savedNames === 'object' && !Array.isArray(savedNames)) {
        setTemplateHubTabNameOverrides(
          Object.fromEntries(
            Object.entries(savedNames).filter(
              (entry): entry is [string, string] => typeof entry[0] === 'string' && typeof entry[1] === 'string'
            )
          )
        );
      }
    } catch {
      // Ignore malformed persisted template tab preferences.
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const persistedPrefs = await templateCenterService.getTemplateWorkspacePrefs();
        if (cancelled) return;
        const persistedOrder = Object.entries(persistedPrefs)
          .filter(([, value]) => Number.isFinite(Number(value.displayOrder)))
          .sort((a, b) => Number(a[1].displayOrder || 0) - Number(b[1].displayOrder || 0))
          .map(([key]) => key);

        if (persistedOrder.length > 0 && !hasLocalTemplateHubOrderRef.current) {
          setTemplateHubTabOrder(persistedOrder);
        }

        setTemplateHubTabNameOverrides((prev) => ({
          ...prev,
          ...Object.fromEntries(
            Object.entries(persistedPrefs).map(([key, value]) => [key, value.nameCn || prev[key] || ''])
          ),
        }));
      } catch (error) {
        console.warn('[DocumentCenter] load persisted template workspace prefs failed:', error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(TEMPLATE_HUB_TAB_ORDER_STORAGE_KEY, JSON.stringify(templateHubTabOrder));
  }, [templateHubTabOrder]);

  useEffect(() => () => {
    if (templateHubOrderPersistTimerRef.current !== null) {
      window.clearTimeout(templateHubOrderPersistTimerRef.current);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(
      TEMPLATE_HUB_TAB_NAME_OVERRIDES_STORAGE_KEY,
      JSON.stringify(templateHubTabNameOverrides)
    );
  }, [templateHubTabNameOverrides]);

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
    const baseItems = DOCUMENT_TEMPLATES.map((template) => {
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
    });

    const baseOrder = [...baseItems].sort((a, b) => a.order - b.order).map((item) => item.id);
    const preferredOrder = [
      ...templateHubTabOrder.filter((id) => baseOrder.includes(id)),
      ...baseOrder.filter((id) => !templateHubTabOrder.includes(id)),
    ];

    return preferredOrder
      .map((id, index) => {
        const item = baseItems.find((candidate) => candidate.id === id);
        if (!item) return null;
        const customName = templateHubTabNameOverrides[id]?.trim();
        return {
          ...item,
          order: index + 1,
          displayName: customName || item.name,
          customName: customName || '',
        };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item));
  }, [templateHubTabNameOverrides, templateHubTabOrder]);

  const filteredTemplateWorkspaceItems = useMemo(() => {
    return templateWorkspaceItems.filter((item) => {
      const keyword = templateSearchTerm.trim().toLowerCase();
      const matchesKeyword =
        !keyword ||
        item.displayName.toLowerCase().includes(keyword) ||
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
    if (activeTemplate?.id !== 'xj') return;
    let active = true;

    Promise.all([
      templateCenterService.getTemplateBindingsStatus('xj', ['xj-create']),
      xjService.getAll(),
    ])
      .then(([bindingRows, xjRows]) => {
        if (!active) return;
        setXjBindingStatusRows(Array.isArray(bindingRows) ? bindingRows : []);

        const recentRows = Array.isArray(xjRows) ? xjRows.slice(0, 50) : [];
        const statsMap = new Map<string, number>();
        let unboundCount = 0;

        recentRows.forEach((row: any) => {
          const version =
            String(
              row?.templateSnapshot?.version?.version ||
              row?.template_snapshot?.version?.version ||
              row?.templateVersion ||
              row?.template_version ||
              '',
            ).trim() || null;
          if (!version) {
            unboundCount += 1;
            return;
          }
          statsMap.set(version, (statsMap.get(version) || 0) + 1);
        });

        setXjRecentVersionStats(
          Array.from(statsMap.entries())
            .map(([version, count]) => ({ version, count }))
            .sort((a, b) => b.count - a.count),
        );
        setXjRecentUnboundCount(unboundCount);
      })
      .catch(() => {
        if (!active) return;
        setXjBindingStatusRows([]);
        setXjRecentVersionStats([]);
        setXjRecentUnboundCount(0);
      });

    return () => {
      active = false;
    };
  }, [activeTemplate?.id]);

  const getResolvedTemplateHubOrder = (savedOrder: string[]) => {
    const baseOrder = templateWorkspaceItems.map((item) => item.id);
    return [
      ...savedOrder.filter((id) => baseOrder.includes(id)),
      ...baseOrder.filter((id) => !savedOrder.includes(id)),
    ];
  };

  const moveTemplateHubItem = (templateId: string, direction: 'left' | 'right') => {
    const currentOrder = templateHubTabOrder.length > 0
      ? getResolvedTemplateHubOrder(templateHubTabOrder)
      : templateWorkspaceItems.map((item) => item.id);
    const currentIndex = currentOrder.indexOf(templateId);
    if (currentIndex === -1) return;
    const targetIndex = direction === 'left' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= currentOrder.length) return;
    const nextOrder = [...currentOrder];
    const [moved] = nextOrder.splice(currentIndex, 1);
    nextOrder.splice(targetIndex, 0, moved);
    setTemplateHubTabOrder(nextOrder);
    void persistTemplateHubTabOrder(nextOrder);
  };

  const templateHubManagerItems = useMemo(() => {
    const currentOrder = templateHubTabOrder.length > 0
      ? getResolvedTemplateHubOrder(templateHubTabOrder)
      : templateWorkspaceItems.map((item) => item.id);

    return currentOrder
      .map((id) => templateWorkspaceItems.find((item) => item.id === id))
      .filter((item): item is NonNullable<typeof item> => Boolean(item));
  }, [getResolvedTemplateHubOrder, templateHubTabOrder, templateWorkspaceItems]);

  const reorderTemplateHubItems = (draggedId: string, targetId: string) => {
    if (!draggedId || !targetId || draggedId === targetId) return;
    const currentOrder = templateHubTabOrder.length > 0
      ? getResolvedTemplateHubOrder(templateHubTabOrder)
      : templateWorkspaceItems.map((item) => item.id);
    const draggedIndex = currentOrder.indexOf(draggedId);
    const targetIndex = currentOrder.indexOf(targetId);
    if (draggedIndex === -1 || targetIndex === -1) return;
    const nextOrder = [...currentOrder];
    const [draggedItem] = nextOrder.splice(draggedIndex, 1);
    nextOrder.splice(targetIndex, 0, draggedItem);
    setTemplateHubTabOrder(nextOrder);
    void persistTemplateHubTabOrder(nextOrder);
  };

  const updateTemplateHubTabName = (templateId: string, value: string) => {
    setTemplateHubTabNameOverrides((prev) => {
      const trimmed = value.trim();
      if (!trimmed) {
        const { [templateId]: _removed, ...rest } = prev;
        return rest;
      }
      return {
        ...prev,
        [templateId]: value,
      };
    });
  };

  const persistTemplateHubTabName = async (templateId: string, value: string) => {
    const template = templateWorkspaceItems.find((item) => item.id === templateId);
    if (!template) return;

    const trimmed = value.trim();
    const nextNameCn = trimmed || template.name;
    const nextNameEn = deriveTemplateNameEnFromCn(nextNameCn, template.nameEn);

    try {
      await templateCenterService.updateTemplateDisplayName({
        templateKey: templateId,
        nameCn: nextNameCn,
        nameEn: nextNameEn,
      });
      updateTemplateHubTabName(templateId, nextNameCn);
      toast.success(`模板名称已永久保存为“${nextNameCn}”`);
    } catch (error) {
      console.error('[DocumentCenter] persist template tab name failed:', error);
      toast.error(`模板名称保存失败：${(error as Error)?.message || '请重试'}`);
    }
  };

  const flushTemplateHubTabOrderPersist = async () => {
    if (isPersistingTemplateHubOrderRef.current) return;

    const nextOrder = pendingTemplateHubOrderRef.current;
    if (!nextOrder || nextOrder.length === 0) return;

    pendingTemplateHubOrderRef.current = null;
    isPersistingTemplateHubOrderRef.current = true;

    try {
      await templateCenterService.updateTemplateDisplayOrder(nextOrder);
    } catch (error) {
      console.error('[DocumentCenter] persist template tab order failed:', error);
      toast.error(`模板顺序保存失败：${(error as Error)?.message || '请重试'}`);
    } finally {
      isPersistingTemplateHubOrderRef.current = false;
      if (pendingTemplateHubOrderRef.current?.length) {
        void flushTemplateHubTabOrderPersist();
      }
    }
  };

  const persistTemplateHubTabOrder = (nextOrder: string[]) => {
    pendingTemplateHubOrderRef.current = nextOrder;

    if (templateHubOrderPersistTimerRef.current !== null) {
      window.clearTimeout(templateHubOrderPersistTimerRef.current);
    }

    templateHubOrderPersistTimerRef.current = window.setTimeout(() => {
      templateHubOrderPersistTimerRef.current = null;
      void flushTemplateHubTabOrderPersist();
    }, 400);
  };

  const resetTemplateHubTabs = () => {
    const defaultOrder = [...DOCUMENT_TEMPLATES]
      .sort((a, b) => a.order - b.order)
      .map((item) => normalizeWorkspaceTemplateId(item.id));

    setTemplateHubTabOrder(defaultOrder);
    setTemplateHubTabNameOverrides({});
    void (async () => {
      try {
        await templateCenterService.resetTemplateWorkspacePrefs();
        toast.success('模板条名称和顺序已恢复默认并保存到 Supabase');
      } catch (error) {
        console.error('[DocumentCenter] reset template workspace prefs failed:', error);
        toast.error(`恢复默认失败：${(error as Error)?.message || '请重试'}`);
      }
    })();
  };

  const beginTemplateTabRename = (templateId: string, currentName: string) => {
    setEditingTemplateTabId(templateId);
    setEditingTemplateTabName(currentName);
  };

  const commitTemplateTabRename = () => {
    if (!editingTemplateTabId) return;
    void persistTemplateHubTabName(editingTemplateTabId, editingTemplateTabName);
    setEditingTemplateTabId(null);
    setEditingTemplateTabName('');
  };

  const cancelTemplateTabRename = () => {
    setEditingTemplateTabId(null);
    setEditingTemplateTabName('');
  };

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
      let syncErrorMessage = '';
      try {
        records = await Promise.race([
          templateCenterService.getVersionHistory(templateKey),
          new Promise<null>((resolve) => {
            window.setTimeout(() => resolve(null), 45000);
          }),
        ]);
      } catch (error) {
        records = null;
        syncErrorMessage = error instanceof Error ? error.message : String(error || '');
      } finally {
        if (!cancelled) {
          setHydratingTemplateVersionKeys((prev) => prev.filter((key) => key !== templateKey));
        }
      }

      if (cancelled) return;

      if (records === null) {
        if (templateKey === 'ing') {
          const localFallbackRecord: InquiryTemplateVersionRecord = {
            id: `local-ing-${Date.now()}`,
            version: latestInquiryVersionRecord?.version || resolvedActiveTemplateMeta?.currentVersion || 'v1.2.0',
            status: 'draft',
            savedAt: formatVersionTime(),
            savedBy: userEmail || 'Template Center Local Cache',
            note: 'Supabase 版本历史暂不可用，当前使用本地编辑快照继续工作。',
            data: cloneQrState(inquiryTemplateData),
            layout: cloneQrState(normalizeWorkspacePreviewLayout(inquiryTemplateLayout)),
          };
          setInquiryVersionHistory([localFallbackRecord]);
          setFailedTemplateVersionKeys((prev) => prev.filter((key) => key !== templateKey));
          setTemplateVersionSyncError('ING 版本历史暂不可用，已切换到本地编辑快照。可继续调整模板，等数据库恢复后再保存/发布。');
          const isUnreachable = syncErrorMessage.includes('unreachable') || syncErrorMessage.includes('timed out');
          toast.warning(isUnreachable
            ? '⚠️ 数据库暂时无法连接，已切换本地模式继续编辑。数据库恢复后可正常保存。'
            : 'ING 版本历史同步失败，已切换到本地编辑快照继续编辑。'
          );
          return;
        }

        setFailedTemplateVersionKeys((prev) => (
          prev.includes(templateKey) ? prev : [...prev, templateKey]
        ));
        const isUnreachable = syncErrorMessage.includes('unreachable') || syncErrorMessage.includes('timed out');
        const specificMessage = isUnreachable
          ? `⚠️ 数据库暂时无法连接，${templateKey.toUpperCase()} 版本历史不可用。等服务恢复后刷新重试。`
          : (syncErrorMessage || `模板 ${templateKey.toUpperCase()} 版本同步失败，请稍后重试。`);
        setTemplateVersionSyncError(specificMessage);
        toast.error(specificMessage);
        return;
      }

      if (templateKey === 'qr') {
        if (records.length === 0) return;
        const mapped = records.map((record) => {
          const data = cloneQrState(record.data || BASELINE_QR_TEMPLATE_SEED);
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
        updateLoadedTemplateVersion('qr', mapped[0]);
        syncTemplateVersionNote('qr', mapped[0].note);
        return;
      }

      if (templateKey === 'pr') {
        if (records.length === 0) return;
        const mapped = records.map((record) => {
          const data = cloneQrState(resolveTemplateWorkspaceRecordData(BASELINE_PR_TEMPLATE_SEED, record.data));
          return {
            ...record,
            data,
            layout: normalizeQrPreviewLayout(record.layout),
            textOverrides: cloneQrState(record.textOverrides || {
              ...buildDefaultQuoteRequirementTextOverrides(data),
              ...INITIAL_PR_TEXT_OVERRIDES,
            }),
          };
        }) as PrTemplateVersionRecord[];
        setPrVersionHistory(mapped);
        setPrTemplateData(cloneQrState(mapped[0].data));
        setPrTemplateLayout(cloneQrState(mapped[0].layout));
        setPrTemplateTextOverrides(cloneQrState(mapped[0].textOverrides));
        updateLoadedTemplateVersion('pr', mapped[0]);
        syncTemplateVersionNote('pr', mapped[0].note);
        return;
      }

      if (templateKey === 'xj') {
        applyWorkspaceRecords<XjTemplateVersionRecord>(
          records,
          BASELINE_XJ_TEMPLATE_SEED,
          setXjVersionHistory,
          setXjTemplateData,
          setXjTemplateLayout,
          (data) => normalizeXjBuyerFromAdminOrg(data, adminOrg, adminUserProfile.email, adminUserProfile.name),
        );
        if (records[0]) {
          updateLoadedTemplateVersion('xj', records[0] as XjTemplateVersionRecord);
          syncTemplateVersionNote('xj', (records[0] as XjTemplateVersionRecord).note);
        }
        return;
      }
      if (templateKey === 'bj') {
        applyWorkspaceRecords<BjTemplateVersionRecord>(
          records,
          BASELINE_BJ_TEMPLATE_SEED,
          setBjVersionHistory,
          setBjTemplateData,
          setBjTemplateLayout,
          (data) => normalizeBjBuyerFromAdminOrg(data, adminOrg, adminUserProfile.email, adminUserProfile.name),
        );
        if (records[0]) {
          updateLoadedTemplateVersion('bj', records[0] as BjTemplateVersionRecord);
          syncTemplateVersionNote('bj', (records[0] as BjTemplateVersionRecord).note);
        }
        return;
      }
      if (templateKey === 'sc') {
        applyWorkspaceRecords<ScTemplateVersionRecord>(
          records,
          BASELINE_SC_TEMPLATE_SEED,
          setScVersionHistory,
          setScTemplateData,
          setScTemplateLayout,
          (data) => normalizeScSellerFromAdminOrg(data, adminOrg, adminUserProfile.email),
        );
        if (records[0]) {
          updateLoadedTemplateVersion('sc', records[0] as ScTemplateVersionRecord);
          syncTemplateVersionNote('sc', (records[0] as ScTemplateVersionRecord).note);
        }
        return;
      }
      if (templateKey === 'cg') {
        applyWorkspaceRecords<CgTemplateVersionRecord>(
          records,
          BASELINE_CG_TEMPLATE_SEED,
          setCgVersionHistory,
          setCgTemplateData,
          setCgTemplateLayout,
          (data) => normalizeCgBuyerFromAdminOrg(data, adminOrg, adminUserProfile.email),
        );
        if (records[0]) {
          updateLoadedTemplateVersion('cg', records[0] as CgTemplateVersionRecord);
          syncTemplateVersionNote('cg', (records[0] as CgTemplateVersionRecord).note);
        }
        return;
      }
      if (templateKey === 'pi') {
        applyWorkspaceRecords<PiTemplateVersionRecord>(
          records,
          BASELINE_PI_TEMPLATE_SEED,
          setPiVersionHistory,
          setPiTemplateData,
          setPiTemplateLayout,
          (data) => normalizePiFromAdminOrg(data, adminOrg, adminUserProfile.email),
        );
        if (records[0]) {
          updateLoadedTemplateVersion('pi', records[0] as PiTemplateVersionRecord);
          syncTemplateVersionNote('pi', (records[0] as PiTemplateVersionRecord).note);
        }
        return;
      }
      if (templateKey === 'ci') {
        applyWorkspaceRecords<CiTemplateVersionRecord>(
          records,
          BASELINE_CI_TEMPLATE_SEED,
          setCiVersionHistory,
          setCiTemplateData,
          setCiTemplateLayout,
          (data) => normalizeCiExporterFromAdminOrg(data, adminOrg),
        );
        if (records[0]) {
          updateLoadedTemplateVersion('ci', records[0] as CiTemplateVersionRecord);
          syncTemplateVersionNote('ci', (records[0] as CiTemplateVersionRecord).note);
        }
        return;
      }
      if (templateKey === 'pl') {
        applyWorkspaceRecords<PlTemplateVersionRecord>(
          records,
          BASELINE_PL_TEMPLATE_SEED,
          setPlVersionHistory,
          setPlTemplateData,
          setPlTemplateLayout,
          (data) => normalizePlExporterFromAdminOrg(data, adminOrg),
        );
        if (records[0]) {
          updateLoadedTemplateVersion('pl', records[0] as PlTemplateVersionRecord);
          syncTemplateVersionNote('pl', (records[0] as PlTemplateVersionRecord).note);
        }
        return;
      }
      if (templateKey === 'soa') {
        applyWorkspaceRecords<SoaTemplateVersionRecord>(
          records,
          BASELINE_SOA_TEMPLATE_SEED,
          setSoaVersionHistory,
          setSoaTemplateData,
          setSoaTemplateLayout,
          (data) => normalizeSoaCompanyFromAdminOrg(data, adminOrg, adminUserProfile.email),
        );
        if (records[0]) {
          updateLoadedTemplateVersion('soa', records[0] as SoaTemplateVersionRecord);
          syncTemplateVersionNote('soa', (records[0] as SoaTemplateVersionRecord).note);
        }
        return;
      }
      if (templateKey === 'ing') {
        applyWorkspaceRecords<InquiryTemplateVersionRecord>(records, BASELINE_ING_TEMPLATE_SEED, setInquiryVersionHistory, setInquiryTemplateData, setInquiryTemplateLayout);
        if (records[0]) {
          updateLoadedTemplateVersion('ing', records[0] as InquiryTemplateVersionRecord);
          syncTemplateVersionNote('ing', (records[0] as InquiryTemplateVersionRecord).note);
        }
        return;
      }
      if (templateKey === 'qt') {
        applyWorkspaceRecords<QuotationTemplateVersionRecord>(
          records,
          BASELINE_QT_TEMPLATE_SEED,
          setQuotationVersionHistory,
          setQuotationTemplateData,
          setQuotationTemplateLayout,
          (data) => normalizeQuotationCompanyFromAdminOrg(data, adminOrg, adminUserProfile.email),
        );
        if (records[0]) {
          updateLoadedTemplateVersion('qt', records[0] as QuotationTemplateVersionRecord);
          syncTemplateVersionNote('qt', (records[0] as QuotationTemplateVersionRecord).note);
        }
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
  const latestPrVersionRecord = prVersionHistory[0];
  const latestPrPublishedRecord =
    prVersionHistory.find((record) => record.status === 'published') || latestPrVersionRecord;
  const latestPrDraftRecord = prVersionHistory.find((record) => record.status === 'draft');
  const latestXjVersionRecord = xjVersionHistory[0];
  const latestXjPublishedRecord =
    xjVersionHistory.find((record) => record.status === 'published') || latestXjVersionRecord;
  const latestXjDraftRecord = xjVersionHistory.find((record) => record.status === 'draft');
  const latestBjVersionRecord = bjVersionHistory[0];
  const latestBjPublishedRecord =
    bjVersionHistory.find((record) => record.status === 'published') || latestBjVersionRecord;
  const latestBjDraftRecord = bjVersionHistory.find((record) => record.status === 'draft');
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
    currentVersion: loadedTemplateVersionMap.qr?.version || latestQrPublishedRecord?.version || TEMPLATE_WORKSPACE_META.qr.currentVersion,
    status: loadedTemplateVersionMap.qr?.status || (latestQrDraftRecord ? 'draft' as TemplatePublishStatus : 'published' as TemplatePublishStatus),
    lastPublishedAt: loadedTemplateVersionMap.qr?.savedAt || latestQrPublishedRecord?.savedAt || TEMPLATE_WORKSPACE_META.qr.lastPublishedAt,
    lastEditedBy: loadedTemplateVersionMap.qr?.savedBy || latestQrVersionRecord?.savedBy || TEMPLATE_WORKSPACE_META.qr.lastEditedBy,
  };
  const prTemplateRuntimeMeta = {
    ...TEMPLATE_WORKSPACE_META.pr,
    currentVersion: loadedTemplateVersionMap.pr?.version || latestPrPublishedRecord?.version || TEMPLATE_WORKSPACE_META.pr.currentVersion,
    status: loadedTemplateVersionMap.pr?.status || (latestPrDraftRecord ? 'draft' as TemplatePublishStatus : 'published' as TemplatePublishStatus),
    lastPublishedAt: loadedTemplateVersionMap.pr?.savedAt || latestPrPublishedRecord?.savedAt || TEMPLATE_WORKSPACE_META.pr.lastPublishedAt,
    lastEditedBy: loadedTemplateVersionMap.pr?.savedBy || latestPrVersionRecord?.savedBy || TEMPLATE_WORKSPACE_META.pr.lastEditedBy,
  };
  const xjTemplateRuntimeMeta = {
    ...TEMPLATE_WORKSPACE_META.xj,
    currentVersion: loadedTemplateVersionMap.xj?.version || latestXjPublishedRecord?.version || TEMPLATE_WORKSPACE_META.xj.currentVersion,
    status: loadedTemplateVersionMap.xj?.status || (latestXjDraftRecord ? 'draft' as TemplatePublishStatus : 'published' as TemplatePublishStatus),
    lastPublishedAt: loadedTemplateVersionMap.xj?.savedAt || latestXjPublishedRecord?.savedAt || TEMPLATE_WORKSPACE_META.xj.lastPublishedAt,
    lastEditedBy: loadedTemplateVersionMap.xj?.savedBy || latestXjVersionRecord?.savedBy || TEMPLATE_WORKSPACE_META.xj.lastEditedBy,
  };
  const bjTemplateRuntimeMeta = {
    ...TEMPLATE_WORKSPACE_META.bj,
    currentVersion: loadedTemplateVersionMap.bj?.version || latestBjPublishedRecord?.version || TEMPLATE_WORKSPACE_META.bj.currentVersion,
    status: loadedTemplateVersionMap.bj?.status || (latestBjDraftRecord ? 'draft' as TemplatePublishStatus : 'published' as TemplatePublishStatus),
    lastPublishedAt: loadedTemplateVersionMap.bj?.savedAt || latestBjPublishedRecord?.savedAt || TEMPLATE_WORKSPACE_META.bj.lastPublishedAt,
    lastEditedBy: loadedTemplateVersionMap.bj?.savedBy || latestBjVersionRecord?.savedBy || TEMPLATE_WORKSPACE_META.bj.lastEditedBy,
  };
  const scTemplateRuntimeMeta = {
    ...TEMPLATE_WORKSPACE_META.sc,
    currentVersion: loadedTemplateVersionMap.sc?.version || latestScPublishedRecord?.version || TEMPLATE_WORKSPACE_META.sc.currentVersion,
    status: loadedTemplateVersionMap.sc?.status || (latestScDraftRecord ? 'draft' as TemplatePublishStatus : 'published' as TemplatePublishStatus),
    lastPublishedAt: loadedTemplateVersionMap.sc?.savedAt || latestScPublishedRecord?.savedAt || TEMPLATE_WORKSPACE_META.sc.lastPublishedAt,
    lastEditedBy: loadedTemplateVersionMap.sc?.savedBy || latestScVersionRecord?.savedBy || TEMPLATE_WORKSPACE_META.sc.lastEditedBy,
  };
  const cgTemplateRuntimeMeta = {
    ...TEMPLATE_WORKSPACE_META.cg,
    currentVersion: loadedTemplateVersionMap.cg?.version || latestCgPublishedRecord?.version || TEMPLATE_WORKSPACE_META.cg.currentVersion,
    status: loadedTemplateVersionMap.cg?.status || (latestCgDraftRecord ? 'draft' as TemplatePublishStatus : 'published' as TemplatePublishStatus),
    lastPublishedAt: loadedTemplateVersionMap.cg?.savedAt || latestCgPublishedRecord?.savedAt || TEMPLATE_WORKSPACE_META.cg.lastPublishedAt,
    lastEditedBy: loadedTemplateVersionMap.cg?.savedBy || latestCgVersionRecord?.savedBy || TEMPLATE_WORKSPACE_META.cg.lastEditedBy,
  };
  const piTemplateRuntimeMeta = {
    ...TEMPLATE_WORKSPACE_META.pi,
    currentVersion: loadedTemplateVersionMap.pi?.version || latestPiPublishedRecord?.version || TEMPLATE_WORKSPACE_META.pi.currentVersion,
    status: loadedTemplateVersionMap.pi?.status || (latestPiDraftRecord ? 'draft' as TemplatePublishStatus : 'published' as TemplatePublishStatus),
    lastPublishedAt: loadedTemplateVersionMap.pi?.savedAt || latestPiPublishedRecord?.savedAt || TEMPLATE_WORKSPACE_META.pi.lastPublishedAt,
    lastEditedBy: loadedTemplateVersionMap.pi?.savedBy || latestPiVersionRecord?.savedBy || TEMPLATE_WORKSPACE_META.pi.lastEditedBy,
  };
  const ciTemplateRuntimeMeta = {
    ...TEMPLATE_WORKSPACE_META.ci,
    currentVersion: loadedTemplateVersionMap.ci?.version || latestCiPublishedRecord?.version || TEMPLATE_WORKSPACE_META.ci.currentVersion,
    status: loadedTemplateVersionMap.ci?.status || (latestCiDraftRecord ? 'draft' as TemplatePublishStatus : 'published' as TemplatePublishStatus),
    lastPublishedAt: loadedTemplateVersionMap.ci?.savedAt || latestCiPublishedRecord?.savedAt || TEMPLATE_WORKSPACE_META.ci.lastPublishedAt,
    lastEditedBy: loadedTemplateVersionMap.ci?.savedBy || latestCiVersionRecord?.savedBy || TEMPLATE_WORKSPACE_META.ci.lastEditedBy,
  };
  const plTemplateRuntimeMeta = {
    ...TEMPLATE_WORKSPACE_META.pl,
    currentVersion: loadedTemplateVersionMap.pl?.version || latestPlPublishedRecord?.version || TEMPLATE_WORKSPACE_META.pl.currentVersion,
    status: loadedTemplateVersionMap.pl?.status || (latestPlDraftRecord ? 'draft' as TemplatePublishStatus : 'published' as TemplatePublishStatus),
    lastPublishedAt: loadedTemplateVersionMap.pl?.savedAt || latestPlPublishedRecord?.savedAt || TEMPLATE_WORKSPACE_META.pl.lastPublishedAt,
    lastEditedBy: loadedTemplateVersionMap.pl?.savedBy || latestPlVersionRecord?.savedBy || TEMPLATE_WORKSPACE_META.pl.lastEditedBy,
  };
  const soaTemplateRuntimeMeta = {
    ...TEMPLATE_WORKSPACE_META.soa,
    currentVersion: loadedTemplateVersionMap.soa?.version || latestSoaPublishedRecord?.version || TEMPLATE_WORKSPACE_META.soa.currentVersion,
    status: loadedTemplateVersionMap.soa?.status || (latestSoaDraftRecord ? 'draft' as TemplatePublishStatus : 'published' as TemplatePublishStatus),
    lastPublishedAt: loadedTemplateVersionMap.soa?.savedAt || latestSoaPublishedRecord?.savedAt || TEMPLATE_WORKSPACE_META.soa.lastPublishedAt,
    lastEditedBy: loadedTemplateVersionMap.soa?.savedBy || latestSoaVersionRecord?.savedBy || TEMPLATE_WORKSPACE_META.soa.lastEditedBy,
  };
  const inquiryTemplateRuntimeMeta = {
    ...TEMPLATE_WORKSPACE_META.ing,
    currentVersion: loadedTemplateVersionMap.ing?.version || latestInquiryPublishedRecord?.version || TEMPLATE_WORKSPACE_META.ing.currentVersion,
    status: loadedTemplateVersionMap.ing?.status || (latestInquiryDraftRecord ? 'draft' as TemplatePublishStatus : 'published' as TemplatePublishStatus),
    lastPublishedAt: loadedTemplateVersionMap.ing?.savedAt || latestInquiryPublishedRecord?.savedAt || TEMPLATE_WORKSPACE_META.ing.lastPublishedAt,
    lastEditedBy: loadedTemplateVersionMap.ing?.savedBy || latestInquiryVersionRecord?.savedBy || TEMPLATE_WORKSPACE_META.ing.lastEditedBy,
  };
  const quotationTemplateRuntimeMeta = {
    ...TEMPLATE_WORKSPACE_META.qt,
    currentVersion: loadedTemplateVersionMap.qt?.version || latestQuotationPublishedRecord?.version || TEMPLATE_WORKSPACE_META.qt.currentVersion,
    status: loadedTemplateVersionMap.qt?.status || (latestQuotationDraftRecord ? 'draft' as TemplatePublishStatus : 'published' as TemplatePublishStatus),
    lastPublishedAt: loadedTemplateVersionMap.qt?.savedAt || latestQuotationPublishedRecord?.savedAt || TEMPLATE_WORKSPACE_META.qt.lastPublishedAt,
    lastEditedBy: loadedTemplateVersionMap.qt?.savedBy || latestQuotationVersionRecord?.savedBy || TEMPLATE_WORKSPACE_META.qt.lastEditedBy,
  };
  const resolvedActiveTemplateMeta = activeTemplate
    ? activeTemplate.id === 'qr'
      ? qrTemplateRuntimeMeta
      : activeTemplate.id === 'pr'
        ? prTemplateRuntimeMeta
      : activeTemplate.id === 'xj'
        ? xjTemplateRuntimeMeta
        : activeTemplate.id === 'bj'
          ? bjTemplateRuntimeMeta
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
  const activeLoadedVersion = activeTemplate
    ? loadedTemplateVersionMap[activeTemplate.id]
    : null;
  const templateRuntimeMetaMap: Record<string, typeof qrTemplateRuntimeMeta> = {
    qr: qrTemplateRuntimeMeta,
    pr: prTemplateRuntimeMeta,
    xj: xjTemplateRuntimeMeta,
    bj: bjTemplateRuntimeMeta,
    sc: scTemplateRuntimeMeta,
    cg: cgTemplateRuntimeMeta,
    pi: piTemplateRuntimeMeta,
    ci: ciTemplateRuntimeMeta,
    pl: plTemplateRuntimeMeta,
    soa: soaTemplateRuntimeMeta,
    ing: inquiryTemplateRuntimeMeta,
    qt: quotationTemplateRuntimeMeta,
  };

  const isVersionHistoryCollapsed = (templateKey: string) => collapsedTemplateVersionHistoryMap[templateKey] ?? true;

  const toggleVersionHistoryCollapsed = (templateKey: string) => {
    setCollapsedTemplateVersionHistoryMap((prev) => ({
      ...prev,
      [templateKey]: !(prev[templateKey] ?? true),
    }));
  };

  const renderVersionHistoryPanel = (
    templateKey: string,
    count: number,
    content: React.ReactNode,
  ) => (
    <VersionHistoryPanel
      collapsed={isVersionHistoryCollapsed(templateKey)}
      count={count}
      onToggle={() => toggleVersionHistoryCollapsed(templateKey)}
    >
      {content}
    </VersionHistoryPanel>
  );

  const updateQrTemplateData = <K extends keyof QuoteRequirementDocumentData>(key: K, value: QuoteRequirementDocumentData[K]) => {
    setQrTemplateData((prev) => ({ ...prev, [key]: value }));
  };

  const updateQrTemplateLayout = <K extends keyof QuoteRequirementPreviewLayout>(key: K, value: QuoteRequirementPreviewLayout[K]) => {
    setQrTemplateLayout((prev) => ({ ...prev, [key]: value }));
  };

  const updateQrTemplateText = <K extends keyof QuoteRequirementTextOverrides>(key: K, value: QuoteRequirementTextOverrides[K]) => {
    setQrTemplateTextOverrides((prev) => ({ ...prev, [key]: value }));
  };

  const updatePrTemplateData = <K extends keyof QuoteRequirementDocumentData>(key: K, value: QuoteRequirementDocumentData[K]) => {
    setPrTemplateData((prev) => ({ ...prev, [key]: value }));
  };

  const updatePrTemplateLayout = <K extends keyof QuoteRequirementPreviewLayout>(key: K, value: QuoteRequirementPreviewLayout[K]) => {
    setPrTemplateLayout((prev) => ({ ...prev, [key]: value }));
  };

  const updatePrTemplateText = <K extends keyof QuoteRequirementTextOverrides>(key: K, value: QuoteRequirementTextOverrides[K]) => {
    setPrTemplateTextOverrides((prev) => ({ ...prev, [key]: value }));
  };

  const updateXjTemplateData = <K extends keyof XJData>(key: K, value: XJData[K]) => {
    setXjTemplateData((prev) => ({ ...prev, [key]: value }));
  };

  const updateBjTemplateData = <K extends keyof SupplierQuotationData>(key: K, value: SupplierQuotationData[K]) => {
    setBjTemplateData((prev) => ({ ...prev, [key]: value }));
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

  const updateBjTemplateLayout = <K extends keyof WorkspacePreviewLayout>(key: K, value: WorkspacePreviewLayout[K]) => {
    setBjTemplateLayout((prev) => ({ ...prev, [key]: value }));
  };

  const applyXjTermsPreset = (preset: XjTermsPreset) => {
    updateXjTemplateData('terms', {
      ...xjTemplateData.terms,
      ...preset.terms,
    });
    toast.success(`已套用“${preset.name}”`);
  };

  const clearXjTerms = () => {
    updateXjTemplateData('terms', { ...EMPTY_XJ_TERMS });
    toast.success('已清空 XJ 条款');
  };

  const restoreDefaultXjTerms = () => {
    updateXjTemplateData('terms', cloneQrState(BASELINE_XJ_TEMPLATE_SEED.terms));
    toast.success('已恢复默认 XJ 条款');
  };

  const updateXjProductDescription = (index: number, value: string) => {
    updateXjTemplateData('products', xjTemplateData.products.map((item, itemIndex) => (
      itemIndex === index ? { ...item, description: value } : item
    )));
  };

  const updateXjProductSpecification = (index: number, value: string) => {
    updateXjTemplateData('products', xjTemplateData.products.map((item, itemIndex) => (
      itemIndex === index ? { ...item, specification: value } : item
    )));
  };

  const updateXjProductQuantity = (index: number, value: number) => {
    updateXjTemplateData('products', xjTemplateData.products.map((item, itemIndex) => (
      itemIndex === index ? { ...item, quantity: value } : item
    )));
  };

  const updateXjProductTargetPrice = (index: number, value: string) => {
    updateXjTemplateData('products', xjTemplateData.products.map((item, itemIndex) => (
      itemIndex === index ? { ...item, targetPrice: value } : item
    )));
  };

  const applyXjTermsPresetById = (presetId: string) => {
    const preset = XJ_TERMS_PRESETS.find((item) => item.id === presetId);
    if (!preset) return;
    applyXjTermsPreset(preset);
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

  const updateInquiryProductTableColumn = (
    index: number,
    patch: Partial<NonNullable<NonNullable<CustomerInquiryData['templateSettings']>['productTableColumns']>[number]>,
  ) => {
    const currentColumns = inquiryTemplateData.templateSettings?.productTableColumns || DEFAULT_CUSTOMER_INQUIRY_PRODUCT_TABLE_COLUMNS;
    updateInquiryTemplateData('templateSettings', {
      ...inquiryTemplateData.templateSettings,
      productTableColumns: currentColumns.map((column, columnIndex) => (
        columnIndex === index ? { ...column, ...patch } : column
      )),
    });
  };

  const moveInquiryProductTableColumn = (index: number, direction: 'up' | 'down') => {
    const currentColumns = [
      ...(inquiryTemplateData.templateSettings?.productTableColumns || DEFAULT_CUSTOMER_INQUIRY_PRODUCT_TABLE_COLUMNS),
    ];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= currentColumns.length) return;

    [currentColumns[index], currentColumns[targetIndex]] = [currentColumns[targetIndex], currentColumns[index]];

    updateInquiryTemplateData('templateSettings', {
      ...inquiryTemplateData.templateSettings,
      productTableColumns: currentColumns,
    });
  };

  const updateCgProductTableColumn = (
    index: number,
    patch: Partial<NonNullable<NonNullable<PurchaseOrderData['templateSettings']>['productTableColumns']>[number]>,
  ) => {
    const currentColumns = cgTemplateData.templateSettings?.productTableColumns || DEFAULT_PURCHASE_ORDER_PRODUCT_TABLE_COLUMNS;
    updateCgTemplateData('templateSettings', {
      ...cgTemplateData.templateSettings,
      productTableColumns: currentColumns.map((column, columnIndex) => (
        columnIndex === index ? { ...column, ...patch } : column
      )),
    });
  };

  const moveCgProductTableColumn = (index: number, direction: 'up' | 'down') => {
    const currentColumns = [
      ...(cgTemplateData.templateSettings?.productTableColumns || DEFAULT_PURCHASE_ORDER_PRODUCT_TABLE_COLUMNS),
    ];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= currentColumns.length) return;

    [currentColumns[index], currentColumns[targetIndex]] = [currentColumns[targetIndex], currentColumns[index]];

    updateCgTemplateData('templateSettings', {
      ...cgTemplateData.templateSettings,
      productTableColumns: currentColumns,
    });
  };

  const updateScProductTableColumn = (
    index: number,
    patch: Partial<NonNullable<NonNullable<SalesContractData['templateSettings']>['productTableColumns']>[number]>,
  ) => {
    const currentColumns = scTemplateData.templateSettings?.productTableColumns || DEFAULT_SALES_CONTRACT_PRODUCT_TABLE_COLUMNS;
    updateScTemplateData('templateSettings', {
      ...scTemplateData.templateSettings,
      productTableColumns: currentColumns.map((column, columnIndex) => (
        columnIndex === index ? { ...column, ...patch } : column
      )),
    });
  };

  const moveScProductTableColumn = (index: number, direction: 'up' | 'down') => {
    const currentColumns = [
      ...(scTemplateData.templateSettings?.productTableColumns || DEFAULT_SALES_CONTRACT_PRODUCT_TABLE_COLUMNS),
    ];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= currentColumns.length) return;

    [currentColumns[index], currentColumns[targetIndex]] = [currentColumns[targetIndex], currentColumns[index]];

    updateScTemplateData('templateSettings', {
      ...scTemplateData.templateSettings,
      productTableColumns: currentColumns,
    });
  };

  const updatePiGoodsTableColumn = (
    index: number,
    patch: Partial<NonNullable<NonNullable<ProformaInvoiceData['templateSettings']>['goodsTableColumns']>[number]>,
  ) => {
    const currentColumns = piTemplateData.templateSettings?.goodsTableColumns || DEFAULT_PROFORMA_INVOICE_GOODS_TABLE_COLUMNS;
    updatePiTemplateData('templateSettings', {
      ...piTemplateData.templateSettings,
      goodsTableColumns: currentColumns.map((column, columnIndex) => (
        columnIndex === index ? { ...column, ...patch } : column
      )),
    });
  };

  const movePiGoodsTableColumn = (index: number, direction: 'up' | 'down') => {
    const currentColumns = [
      ...(piTemplateData.templateSettings?.goodsTableColumns || DEFAULT_PROFORMA_INVOICE_GOODS_TABLE_COLUMNS),
    ];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= currentColumns.length) return;

    [currentColumns[index], currentColumns[targetIndex]] = [currentColumns[targetIndex], currentColumns[index]];

    updatePiTemplateData('templateSettings', {
      ...piTemplateData.templateSettings,
      goodsTableColumns: currentColumns,
    });
  };

  const updateCiGoodsTableColumn = (
    index: number,
    patch: Partial<NonNullable<NonNullable<CommercialInvoiceData['templateSettings']>['goodsTableColumns']>[number]>,
  ) => {
    const currentColumns = ciTemplateData.templateSettings?.goodsTableColumns || DEFAULT_COMMERCIAL_INVOICE_GOODS_TABLE_COLUMNS;
    updateCiTemplateData('templateSettings', {
      ...ciTemplateData.templateSettings,
      goodsTableColumns: currentColumns.map((column, columnIndex) => (
        columnIndex === index ? { ...column, ...patch } : column
      )),
    });
  };

  const moveCiGoodsTableColumn = (index: number, direction: 'up' | 'down') => {
    const currentColumns = [
      ...(ciTemplateData.templateSettings?.goodsTableColumns || DEFAULT_COMMERCIAL_INVOICE_GOODS_TABLE_COLUMNS),
    ];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= currentColumns.length) return;

    [currentColumns[index], currentColumns[targetIndex]] = [currentColumns[targetIndex], currentColumns[index]];

    updateCiTemplateData('templateSettings', {
      ...ciTemplateData.templateSettings,
      goodsTableColumns: currentColumns,
    });
  };

  const updateQuotationTemplateData = <K extends keyof QuotationData>(key: K, value: QuotationData[K]) => {
    setQuotationTemplateData((prev) => ({ ...prev, [key]: value }));
  };

  const updateQuotationTemplateLayout = <K extends keyof WorkspacePreviewLayout>(key: K, value: WorkspacePreviewLayout[K]) => {
    setQuotationTemplateLayout((prev) => ({ ...prev, [key]: value }));
  };

  const updateQuotationProductTableColumn = (
    index: number,
    patch: Partial<NonNullable<NonNullable<QuotationData['templateSettings']>['productTableColumns']>[number]>,
  ) => {
    const currentColumns = quotationTemplateData.templateSettings?.productTableColumns || DEFAULT_QUOTATION_PRODUCT_TABLE_COLUMNS;
    updateQuotationTemplateData('templateSettings', {
      ...quotationTemplateData.templateSettings,
      productTableColumns: currentColumns.map((column, columnIndex) => (
        columnIndex === index ? { ...column, ...patch } : column
      )),
    });
  };

  const moveQuotationProductTableColumn = (index: number, direction: 'up' | 'down') => {
    const currentColumns = [
      ...(quotationTemplateData.templateSettings?.productTableColumns || DEFAULT_QUOTATION_PRODUCT_TABLE_COLUMNS),
    ];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= currentColumns.length) return;

    [currentColumns[index], currentColumns[targetIndex]] = [currentColumns[targetIndex], currentColumns[index]];

    updateQuotationTemplateData('templateSettings', {
      ...quotationTemplateData.templateSettings,
      productTableColumns: currentColumns,
    });
  };

  const updateQuotationProductName = (index: number, value: string) => {
    updateQuotationTemplateData('products', quotationTemplateData.products.map((row, rowIndex) => (
      rowIndex === index ? { ...row, productName: value } : row
    )));
  };

  const updateQuotationProductQuantity = (index: number, value: number) => {
    updateQuotationTemplateData('products', quotationTemplateData.products.map((row, rowIndex) => (
      rowIndex === index ? { ...row, quantity: value, amount: value * row.unitPrice } : row
    )));
  };

  const updateQuotationProductUnitPrice = (index: number, value: number) => {
    updateQuotationTemplateData('products', quotationTemplateData.products.map((row, rowIndex) => (
      rowIndex === index ? { ...row, unitPrice: value, amount: value * row.quantity } : row
    )));
  };

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
    updateLoadedTemplateVersion('qr', record);
    syncTemplateVersionNote('qr', record.note);
  };

  const applyPrVersionRecord = (record: PrTemplateVersionRecord) => {
    const data = cloneQrState(resolveTemplateWorkspaceRecordData(BASELINE_PR_TEMPLATE_SEED, record.data));
    setPrTemplateData(data);
    setPrTemplateLayout(cloneQrState(normalizeQrPreviewLayout(record.layout)));
    setPrTemplateTextOverrides(
      cloneQrState(record.textOverrides || {
        ...buildDefaultQuoteRequirementTextOverrides(data),
        ...INITIAL_PR_TEXT_OVERRIDES,
      })
    );
    updateLoadedTemplateVersion('pr', record);
    syncTemplateVersionNote('pr', record.note);
  };

  const persistTemplateVersion = async (options: {
    templateKey: 'qr' | 'pr' | 'xj' | 'bj' | 'sc' | 'cg' | 'pi' | 'ci' | 'pl' | 'soa' | 'ing' | 'qt';
    status: QrVersionRecordStatus;
    baseVersion: string;
    note: string;
    savedBy: string;
    data: Record<string, any>;
    layout: WorkspacePreviewLayout | QuoteRequirementPreviewLayout;
    textOverrides?: Record<string, any> | null;
  }) => {
    const withTimeout = async <T,>(promise: Promise<T>, timeoutMs: number) => {
      let timeoutId: ReturnType<typeof setTimeout> | null = null;
      try {
        return await Promise.race<T>([
          promise,
          new Promise<T>((_, reject) => {
            timeoutId = setTimeout(() => {
              reject(new Error(`模板保存超时（>${Math.round(timeoutMs / 1000)}秒），请重试`));
            }, timeoutMs);
          }),
        ]);
      } finally {
        if (timeoutId) clearTimeout(timeoutId);
      }
    };

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
      const persistedRecord = await withTimeout(templateCenterService.saveVersion({
        templateKey: options.templateKey,
        version,
        status: options.status,
        note,
        savedBy: options.savedBy,
        data: cloneQrState(options.data),
        layout: cloneQrState(options.layout),
        textOverrides: options.textOverrides || null,
      }), options.status === 'published' ? 60000 : 60000);

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
    } catch (error) {
      const msg = error instanceof Error ? error.message : '';
      if (msg.includes('Supabase unreachable') || msg.includes('unreachable')) {
        toast.error('⚠️ 数据库暂时无法连接，模板未保存。请稍后重试，或联系管理员检查 Supabase 服务状态。');
      } else if (msg.includes('timed out') || msg.includes('超时')) {
        toast.error('⚠️ 数据库响应超时，模板未保存。请检查网络后重试。');
      } else {
        toast.error(msg || `模板 ${options.templateKey.toUpperCase()} 保存失败，请重试。`);
      }
      return null;
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
    updateLoadedTemplateVersion('qr', record as QrTemplateVersionRecord);
    toast.success(status === 'published' ? `已发布 ${record.version}` : `已保存草稿 ${record.version}`);
  };

  const savePrVersion = async (status: QrVersionRecordStatus) => {
    const baseVersion = latestPrPublishedRecord?.version || 'v1.0.0';
    const record = await persistTemplateVersion({
      templateKey: 'pr',
      status,
      baseVersion,
      note: prTemplateVersionNote,
      savedBy: userEmail || 'Procurement Admin',
      data: prTemplateData,
      layout: prTemplateLayout,
      textOverrides: prTemplateTextOverrides,
    });
    if (!record) return;
    setPrVersionHistory((prev) => [record as PrTemplateVersionRecord, ...prev]);
    updateLoadedTemplateVersion('pr', record as PrTemplateVersionRecord);
    toast.success(status === 'published' ? `已发布 ${record.version}` : `已保存草稿 ${record.version}`);
  };

  const applyXjVersionRecord = (record: XjTemplateVersionRecord) => {
    setXjTemplateData(
      normalizeXjBuyerFromAdminOrg(
        cloneQrState(record.data),
        adminOrg,
        adminUserProfile.email,
        adminUserProfile.name,
      ),
    );
    setXjTemplateLayout(cloneQrState(normalizeWorkspacePreviewLayout(record.layout)));
    updateLoadedTemplateVersion('xj', record);
    syncTemplateVersionNote('xj', record.note);
  };

  const saveXjVersion = async (status: QrVersionRecordStatus) => {
    const baseVersion = latestXjPublishedRecord?.version || 'v1.0.0';
    const normalizedXjTemplateData = normalizeXjBuyerFromAdminOrg(
      xjTemplateData,
      adminOrg,
      adminUserProfile.email,
      adminUserProfile.name,
    );
    const record = await persistTemplateVersion({
      templateKey: 'xj',
      status,
      baseVersion,
      note: xjTemplateVersionNote,
      savedBy: userEmail || 'Procurement Admin',
      data: normalizedXjTemplateData,
      layout: xjTemplateLayout,
    });
    if (!record) return;
    setXjTemplateData(normalizedXjTemplateData);
    setXjVersionHistory((prev) => [record as XjTemplateVersionRecord, ...prev]);
    updateLoadedTemplateVersion('xj', record as XjTemplateVersionRecord);
    toast.success(status === 'published' ? `已发布 ${record.version}` : `已保存草稿 ${record.version}`);
  };

  const applyBjVersionRecord = (record: BjTemplateVersionRecord) => {
    setBjTemplateData(
      normalizeBjBuyerFromAdminOrg(
        cloneQrState(record.data),
        adminOrg,
        adminUserProfile.email,
        adminUserProfile.name,
      ),
    );
    setBjTemplateLayout(cloneQrState(normalizeWorkspacePreviewLayout(record.layout)));
    updateLoadedTemplateVersion('bj', record);
    syncTemplateVersionNote('bj', record.note);
  };

  const saveBjVersion = async (status: QrVersionRecordStatus) => {
    const baseVersion = latestBjPublishedRecord?.version || 'v1.0.0';
    const normalizedBjTemplateData = normalizeBjBuyerFromAdminOrg(
      bjTemplateData,
      adminOrg,
      adminUserProfile.email,
      adminUserProfile.name,
    );
    const record = await persistTemplateVersion({
      templateKey: 'bj',
      status,
      baseVersion,
      note: bjTemplateVersionNote,
      savedBy: userEmail || 'Sales Admin',
      data: normalizedBjTemplateData,
      layout: bjTemplateLayout,
    });
    if (!record) return;
    setBjTemplateData(normalizedBjTemplateData);
    setBjVersionHistory((prev) => [record as BjTemplateVersionRecord, ...prev]);
    updateLoadedTemplateVersion('bj', record as BjTemplateVersionRecord);
    toast.success(status === 'published' ? `已发布 ${record.version}` : `已保存草稿 ${record.version}`);
  };

  const applyScVersionRecord = (record: ScTemplateVersionRecord) => {
    setScTemplateData(
      normalizeScSellerFromAdminOrg(cloneQrState(record.data), adminOrg, adminUserProfile.email),
    );
    setScTemplateLayout(cloneQrState(normalizeWorkspacePreviewLayout(record.layout)));
    updateLoadedTemplateVersion('sc', record);
    syncTemplateVersionNote('sc', record.note);
  };

  const saveScVersion = async (status: QrVersionRecordStatus) => {
    const baseVersion = latestScPublishedRecord?.version || 'v1.0.0';
    const normalizedScTemplateData = normalizeScSellerFromAdminOrg(
      scTemplateData,
      adminOrg,
      adminUserProfile.email,
    );
    const record = await persistTemplateVersion({
      templateKey: 'sc',
      status,
      baseVersion,
      note: scTemplateVersionNote,
      savedBy: userEmail || 'Contract Admin',
      data: normalizedScTemplateData,
      layout: scTemplateLayout,
    });
    if (!record) return;
    setScTemplateData(normalizedScTemplateData);
    setScVersionHistory((prev) => [record as ScTemplateVersionRecord, ...prev]);
    updateLoadedTemplateVersion('sc', record as ScTemplateVersionRecord);
    toast.success(status === 'published' ? `已发布 ${record.version}` : `已保存草稿 ${record.version}`);
  };

  const applyCgVersionRecord = (record: CgTemplateVersionRecord) => {
    setCgTemplateData(
      normalizeCgBuyerFromAdminOrg(
        resolveTemplateWorkspaceRecordData(cloneQrState(BASELINE_CG_TEMPLATE_SEED), cloneQrState(record.data)),
        adminOrg,
        adminUserProfile.email,
      ),
    );
    setCgTemplateLayout(cloneQrState(normalizeWorkspacePreviewLayout(record.layout)));
    updateLoadedTemplateVersion('cg', record);
    syncTemplateVersionNote('cg', record.note);
  };

  const saveCgVersion = async (status: QrVersionRecordStatus) => {
    const baseVersion = latestCgPublishedRecord?.version || 'v1.0.0';
    const normalizedCgTemplateData = normalizeCgBuyerFromAdminOrg(
      cgTemplateData,
      adminOrg,
      adminUserProfile.email,
    );
    const record = await persistTemplateVersion({
      templateKey: 'cg',
      status,
      baseVersion,
      note: cgTemplateVersionNote,
      savedBy: userEmail || 'Procurement Admin',
      data: normalizedCgTemplateData,
      layout: cgTemplateLayout,
    });
    if (!record) return;
    setCgTemplateData(normalizedCgTemplateData);
    setCgVersionHistory((prev) => [record as CgTemplateVersionRecord, ...prev]);
    updateLoadedTemplateVersion('cg', record as CgTemplateVersionRecord);
    toast.success(status === 'published' ? `已发布 ${record.version}` : `已保存草稿 ${record.version}`);
  };

  const applyPiVersionRecord = (record: PiTemplateVersionRecord) => {
    setPiTemplateData(
      normalizePiFromAdminOrg(cloneQrState(record.data), adminOrg, adminUserProfile.email),
    );
    setPiTemplateLayout(cloneQrState(normalizeWorkspacePreviewLayout(record.layout)));
    updateLoadedTemplateVersion('pi', record);
    syncTemplateVersionNote('pi', record.note);
  };

  const savePiVersion = async (status: QrVersionRecordStatus) => {
    const baseVersion = latestPiPublishedRecord?.version || 'v1.0.0';
    const normalizedPiTemplateData = normalizePiFromAdminOrg(
      piTemplateData,
      adminOrg,
      adminUserProfile.email,
    );
    const record = await persistTemplateVersion({
      templateKey: 'pi',
      status,
      baseVersion,
      note: piTemplateVersionNote,
      savedBy: userEmail || 'Finance Admin',
      data: normalizedPiTemplateData,
      layout: piTemplateLayout,
    });
    if (!record) return;
    setPiTemplateData(normalizedPiTemplateData);
    setPiVersionHistory((prev) => [record as PiTemplateVersionRecord, ...prev]);
    updateLoadedTemplateVersion('pi', record as PiTemplateVersionRecord);
    toast.success(status === 'published' ? `已发布 ${record.version}` : `已保存草稿 ${record.version}`);
  };

  const applyCiVersionRecord = (record: CiTemplateVersionRecord) => {
    setCiTemplateData(normalizeCiExporterFromAdminOrg(cloneQrState(record.data), adminOrg));
    setCiTemplateLayout(cloneQrState(normalizeWorkspacePreviewLayout(record.layout)));
    updateLoadedTemplateVersion('ci', record);
    syncTemplateVersionNote('ci', record.note);
  };

  const saveCiVersion = async (status: QrVersionRecordStatus) => {
    const baseVersion = latestCiPublishedRecord?.version || 'v1.0.0';
    const normalizedCiTemplateData = normalizeCiExporterFromAdminOrg(ciTemplateData, adminOrg);
    const record = await persistTemplateVersion({
      templateKey: 'ci',
      status,
      baseVersion,
      note: ciTemplateVersionNote,
      savedBy: userEmail || 'Docs Admin',
      data: normalizedCiTemplateData,
      layout: ciTemplateLayout,
    });
    if (!record) return;
    setCiTemplateData(normalizedCiTemplateData);
    setCiVersionHistory((prev) => [record as CiTemplateVersionRecord, ...prev]);
    updateLoadedTemplateVersion('ci', record as CiTemplateVersionRecord);
    toast.success(status === 'published' ? `已发布 ${record.version}` : `已保存草稿 ${record.version}`);
  };

  const applyPlVersionRecord = (record: PlTemplateVersionRecord) => {
    setPlTemplateData(normalizePlExporterFromAdminOrg(cloneQrState(record.data), adminOrg));
    setPlTemplateLayout(cloneQrState(normalizeWorkspacePreviewLayout(record.layout)));
    updateLoadedTemplateVersion('pl', record);
    syncTemplateVersionNote('pl', record.note);
  };

  const savePlVersion = async (status: QrVersionRecordStatus) => {
    const baseVersion = latestPlPublishedRecord?.version || 'v1.0.0';
    const normalizedPlTemplateData = normalizePlExporterFromAdminOrg(plTemplateData, adminOrg);
    const record = await persistTemplateVersion({
      templateKey: 'pl',
      status,
      baseVersion,
      note: plTemplateVersionNote,
      savedBy: userEmail || 'Docs Admin',
      data: normalizedPlTemplateData,
      layout: plTemplateLayout,
    });
    if (!record) return;
    setPlTemplateData(normalizedPlTemplateData);
    setPlVersionHistory((prev) => [record as PlTemplateVersionRecord, ...prev]);
    updateLoadedTemplateVersion('pl', record as PlTemplateVersionRecord);
    toast.success(status === 'published' ? `已发布 ${record.version}` : `已保存草稿 ${record.version}`);
  };

  const applySoaVersionRecord = (record: SoaTemplateVersionRecord) => {
    setSoaTemplateData(
      normalizeSoaCompanyFromAdminOrg(cloneQrState(record.data), adminOrg, adminUserProfile.email),
    );
    setSoaTemplateLayout(cloneQrState(normalizeWorkspacePreviewLayout(record.layout)));
    updateLoadedTemplateVersion('soa', record);
    syncTemplateVersionNote('soa', record.note);
  };

  const saveSoaVersion = async (status: QrVersionRecordStatus) => {
    const baseVersion = latestSoaPublishedRecord?.version || 'v1.0.0';
    const normalizedSoaTemplateData = normalizeSoaCompanyFromAdminOrg(
      soaTemplateData,
      adminOrg,
      adminUserProfile.email,
    );
    const record = await persistTemplateVersion({
      templateKey: 'soa',
      status,
      baseVersion,
      note: soaTemplateVersionNote,
      savedBy: userEmail || 'Finance Admin',
      data: normalizedSoaTemplateData,
      layout: soaTemplateLayout,
    });
    if (!record) return;
    setSoaTemplateData(normalizedSoaTemplateData);
    setSoaVersionHistory((prev) => [record as SoaTemplateVersionRecord, ...prev]);
    updateLoadedTemplateVersion('soa', record as SoaTemplateVersionRecord);
    toast.success(status === 'published' ? `已发布 ${record.version}` : `已保存草稿 ${record.version}`);
  };

  const applyInquiryVersionRecord = (record: InquiryTemplateVersionRecord) => {
    setInquiryTemplateData(resolveTemplateWorkspaceRecordData(cloneQrState(BASELINE_ING_TEMPLATE_SEED), cloneQrState(record.data)));
    setInquiryTemplateLayout(cloneQrState(normalizeWorkspacePreviewLayout(record.layout)));
    updateLoadedTemplateVersion('ing', record);
    syncTemplateVersionNote('ing', record.note);
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
    updateLoadedTemplateVersion('ing', record as InquiryTemplateVersionRecord);
    toast.success(status === 'published' ? `已发布 ${record.version}` : `已保存草稿 ${record.version}`);
  };

  const applyQuotationVersionRecord = (record: QuotationTemplateVersionRecord) => {
    setQuotationTemplateData(
      normalizeQuotationCompanyFromAdminOrg(
        cloneQrState(record.data),
        adminOrg,
        adminUserProfile.email,
      ),
    );
    setQuotationTemplateLayout(cloneQrState(normalizeWorkspacePreviewLayout(record.layout)));
    updateLoadedTemplateVersion('qt', record);
    syncTemplateVersionNote('qt', record.note);
  };

  const saveQuotationVersion = async (status: QrVersionRecordStatus) => {
    const baseVersion = latestQuotationPublishedRecord?.version || 'v1.0.0';
    const normalizedQuotationTemplateData = normalizeQuotationCompanyFromAdminOrg(
      quotationTemplateData,
      adminOrg,
      adminUserProfile.email,
    );
    const record = await persistTemplateVersion({
      templateKey: 'qt',
      status,
      baseVersion,
      note: quotationTemplateVersionNote,
      savedBy: userEmail || 'Sales Admin',
      data: normalizedQuotationTemplateData,
      layout: quotationTemplateLayout,
    });
    if (!record) return;
    setQuotationTemplateData(normalizedQuotationTemplateData);
    setQuotationVersionHistory((prev) => [record as QuotationTemplateVersionRecord, ...prev]);
    updateLoadedTemplateVersion('qt', record as QuotationTemplateVersionRecord);
    toast.success(status === 'published' ? `已发布 ${record.version}` : `已保存草稿 ${record.version}`);
  };

  const buildRestoreVersionNote = (record: { version: string; note?: string }) =>
    `恢复自 ${record.version}${record.note ? ` · ${record.note}` : ''}`;

  const restoreTemplateVersionAsDraft = async (templateKey: 'qr' | 'pr' | 'xj' | 'bj' | 'sc' | 'cg' | 'pi' | 'ci' | 'pl' | 'soa' | 'ing' | 'qt', record: any) => {
    if (templateKey === 'qr') {
      applyQrVersionRecord(record as QrTemplateVersionRecord);
      const restored = await persistTemplateVersion({
        templateKey: 'qr',
        status: 'draft',
        baseVersion: latestQrPublishedRecord?.version || record.version || 'v1.0.0',
        note: buildRestoreVersionNote(record),
        savedBy: userEmail || 'Template Admin',
        data: cloneQrState(record.data || BASELINE_QR_TEMPLATE_SEED),
        layout: cloneQrState(normalizeQrPreviewLayout(record.layout)),
        textOverrides: cloneQrState(record.textOverrides || buildDefaultQuoteRequirementTextOverrides(record.data || BASELINE_QR_TEMPLATE_SEED)),
      });
      if (!restored) return;
      setQrVersionHistory((prev) => [restored as QrTemplateVersionRecord, ...prev]);
      applyQrVersionRecord(restored as QrTemplateVersionRecord);
      toast.success(`已从 ${record.version} 恢复，并生成草稿 ${restored.version}`);
      return;
    }
    if (templateKey === 'pr') {
      applyPrVersionRecord(record as PrTemplateVersionRecord);
      const restored = await persistTemplateVersion({
        templateKey: 'pr',
        status: 'draft',
        baseVersion: latestPrPublishedRecord?.version || record.version || 'v1.0.0',
        note: buildRestoreVersionNote(record),
        savedBy: userEmail || 'Procurement Admin',
        data: cloneQrState(record.data || BASELINE_PR_TEMPLATE_SEED),
        layout: cloneQrState(normalizeQrPreviewLayout(record.layout)),
        textOverrides: cloneQrState(record.textOverrides || {
          ...buildDefaultQuoteRequirementTextOverrides(record.data || BASELINE_PR_TEMPLATE_SEED),
          ...INITIAL_PR_TEXT_OVERRIDES,
        }),
      });
      if (!restored) return;
      setPrVersionHistory((prev) => [restored as PrTemplateVersionRecord, ...prev]);
      applyPrVersionRecord(restored as PrTemplateVersionRecord);
      toast.success(`已从 ${record.version} 恢复，并生成草稿 ${restored.version}`);
      return;
    }
    if (templateKey === 'xj') {
      applyXjVersionRecord(record as XjTemplateVersionRecord);
      const restored = await persistTemplateVersion({
        templateKey: 'xj',
        status: 'draft',
        baseVersion: latestXjPublishedRecord?.version || record.version || 'v1.0.0',
        note: buildRestoreVersionNote(record),
        savedBy: userEmail || 'Procurement Admin',
        data: cloneQrState(record.data || BASELINE_XJ_TEMPLATE_SEED),
        layout: cloneQrState(normalizeWorkspacePreviewLayout(record.layout)),
      });
      if (!restored) return;
      setXjVersionHistory((prev) => [restored as XjTemplateVersionRecord, ...prev]);
      applyXjVersionRecord(restored as XjTemplateVersionRecord);
      toast.success(`已从 ${record.version} 恢复，并生成草稿 ${restored.version}`);
      return;
    }
    if (templateKey === 'bj') {
      applyBjVersionRecord(record as BjTemplateVersionRecord);
      const restored = await persistTemplateVersion({
        templateKey: 'bj',
        status: 'draft',
        baseVersion: latestBjPublishedRecord?.version || record.version || 'v1.0.0',
        note: buildRestoreVersionNote(record),
        savedBy: userEmail || 'Sales Admin',
        data: cloneQrState(record.data || BASELINE_BJ_TEMPLATE_SEED),
        layout: cloneQrState(normalizeWorkspacePreviewLayout(record.layout)),
      });
      if (!restored) return;
      setBjVersionHistory((prev) => [restored as BjTemplateVersionRecord, ...prev]);
      applyBjVersionRecord(restored as BjTemplateVersionRecord);
      toast.success(`已从 ${record.version} 恢复，并生成草稿 ${restored.version}`);
      return;
    }
    if (templateKey === 'sc') {
      applyScVersionRecord(record as ScTemplateVersionRecord);
      const restored = await persistTemplateVersion({
        templateKey: 'sc',
        status: 'draft',
        baseVersion: latestScPublishedRecord?.version || record.version || 'v1.0.0',
        note: buildRestoreVersionNote(record),
        savedBy: userEmail || 'Contract Admin',
        data: cloneQrState(record.data || BASELINE_SC_TEMPLATE_SEED),
        layout: cloneQrState(normalizeWorkspacePreviewLayout(record.layout)),
      });
      if (!restored) return;
      setScVersionHistory((prev) => [restored as ScTemplateVersionRecord, ...prev]);
      applyScVersionRecord(restored as ScTemplateVersionRecord);
      toast.success(`已从 ${record.version} 恢复，并生成草稿 ${restored.version}`);
      return;
    }
    if (templateKey === 'cg') {
      applyCgVersionRecord(record as CgTemplateVersionRecord);
      const restored = await persistTemplateVersion({
        templateKey: 'cg',
        status: 'draft',
        baseVersion: latestCgPublishedRecord?.version || record.version || 'v1.0.0',
        note: buildRestoreVersionNote(record),
        savedBy: userEmail || 'Procurement Admin',
        data: cloneQrState(record.data || BASELINE_CG_TEMPLATE_SEED),
        layout: cloneQrState(normalizeWorkspacePreviewLayout(record.layout)),
      });
      if (!restored) return;
      setCgVersionHistory((prev) => [restored as CgTemplateVersionRecord, ...prev]);
      applyCgVersionRecord(restored as CgTemplateVersionRecord);
      toast.success(`已从 ${record.version} 恢复，并生成草稿 ${restored.version}`);
      return;
    }
    if (templateKey === 'pi') {
      applyPiVersionRecord(record as PiTemplateVersionRecord);
      const restored = await persistTemplateVersion({
        templateKey: 'pi',
        status: 'draft',
        baseVersion: latestPiPublishedRecord?.version || record.version || 'v1.0.0',
        note: buildRestoreVersionNote(record),
        savedBy: userEmail || 'Finance Admin',
        data: cloneQrState(record.data || BASELINE_PI_TEMPLATE_SEED),
        layout: cloneQrState(normalizeWorkspacePreviewLayout(record.layout)),
      });
      if (!restored) return;
      setPiVersionHistory((prev) => [restored as PiTemplateVersionRecord, ...prev]);
      applyPiVersionRecord(restored as PiTemplateVersionRecord);
      toast.success(`已从 ${record.version} 恢复，并生成草稿 ${restored.version}`);
      return;
    }
    if (templateKey === 'ci') {
      applyCiVersionRecord(record as CiTemplateVersionRecord);
      const restored = await persistTemplateVersion({
        templateKey: 'ci',
        status: 'draft',
        baseVersion: latestCiPublishedRecord?.version || record.version || 'v1.0.0',
        note: buildRestoreVersionNote(record),
        savedBy: userEmail || 'Docs Admin',
        data: cloneQrState(record.data || BASELINE_CI_TEMPLATE_SEED),
        layout: cloneQrState(normalizeWorkspacePreviewLayout(record.layout)),
      });
      if (!restored) return;
      setCiVersionHistory((prev) => [restored as CiTemplateVersionRecord, ...prev]);
      applyCiVersionRecord(restored as CiTemplateVersionRecord);
      toast.success(`已从 ${record.version} 恢复，并生成草稿 ${restored.version}`);
      return;
    }
    if (templateKey === 'pl') {
      applyPlVersionRecord(record as PlTemplateVersionRecord);
      const restored = await persistTemplateVersion({
        templateKey: 'pl',
        status: 'draft',
        baseVersion: latestPlPublishedRecord?.version || record.version || 'v1.0.0',
        note: buildRestoreVersionNote(record),
        savedBy: userEmail || 'Docs Admin',
        data: cloneQrState(record.data || BASELINE_PL_TEMPLATE_SEED),
        layout: cloneQrState(normalizeWorkspacePreviewLayout(record.layout)),
      });
      if (!restored) return;
      setPlVersionHistory((prev) => [restored as PlTemplateVersionRecord, ...prev]);
      applyPlVersionRecord(restored as PlTemplateVersionRecord);
      toast.success(`已从 ${record.version} 恢复，并生成草稿 ${restored.version}`);
      return;
    }
    if (templateKey === 'soa') {
      applySoaVersionRecord(record as SoaTemplateVersionRecord);
      const restored = await persistTemplateVersion({
        templateKey: 'soa',
        status: 'draft',
        baseVersion: latestSoaPublishedRecord?.version || record.version || 'v1.0.0',
        note: buildRestoreVersionNote(record),
        savedBy: userEmail || 'Finance Admin',
        data: cloneQrState(record.data || BASELINE_SOA_TEMPLATE_SEED),
        layout: cloneQrState(normalizeWorkspacePreviewLayout(record.layout)),
      });
      if (!restored) return;
      setSoaVersionHistory((prev) => [restored as SoaTemplateVersionRecord, ...prev]);
      applySoaVersionRecord(restored as SoaTemplateVersionRecord);
      toast.success(`已从 ${record.version} 恢复，并生成草稿 ${restored.version}`);
      return;
    }
    if (templateKey === 'ing') {
      applyInquiryVersionRecord(record as InquiryTemplateVersionRecord);
      const restored = await persistTemplateVersion({
        templateKey: 'ing',
        status: 'draft',
        baseVersion: latestInquiryPublishedRecord?.version || record.version || 'v1.0.0',
        note: buildRestoreVersionNote(record),
        savedBy: userEmail || 'Admin',
        data: cloneQrState(record.data || BASELINE_ING_TEMPLATE_SEED),
        layout: cloneQrState(normalizeWorkspacePreviewLayout(record.layout)),
      });
      if (!restored) return;
      setInquiryVersionHistory((prev) => [restored as InquiryTemplateVersionRecord, ...prev]);
      applyInquiryVersionRecord(restored as InquiryTemplateVersionRecord);
      toast.success(`已从 ${record.version} 恢复，并生成草稿 ${restored.version}`);
      return;
    }
    if (templateKey === 'qt') {
      applyQuotationVersionRecord(record as QuotationTemplateVersionRecord);
      const restored = await persistTemplateVersion({
        templateKey: 'qt',
        status: 'draft',
        baseVersion: latestQuotationPublishedRecord?.version || record.version || 'v1.0.0',
        note: buildRestoreVersionNote(record),
        savedBy: userEmail || 'Sales Admin',
        data: cloneQrState(record.data || BASELINE_QT_TEMPLATE_SEED),
        layout: cloneQrState(normalizeWorkspacePreviewLayout(record.layout)),
      });
      if (!restored) return;
      setQuotationVersionHistory((prev) => [restored as QuotationTemplateVersionRecord, ...prev]);
      applyQuotationVersionRecord(restored as QuotationTemplateVersionRecord);
      toast.success(`已从 ${record.version} 恢复，并生成草稿 ${restored.version}`);
    }
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

  const handleRestoreLatestPrSaved = () => {
    if (!latestPrVersionRecord) return;
    applyPrVersionRecord(latestPrVersionRecord);
    toast.success(`已恢复最近版本 ${latestPrVersionRecord.version}`);
  };

  const handleRestoreLatestBjSaved = () => {
    if (!latestBjVersionRecord) return;
    applyBjVersionRecord(latestBjVersionRecord);
    toast.success(`已恢复最近版本 ${latestBjVersionRecord.version}`);
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
    if (activeTemplate?.id === 'pr') {
      void savePrVersion('draft');
      return;
    }
    if (activeTemplate?.id === 'xj') {
      void saveXjVersion('draft');
      return;
    }
    if (activeTemplate?.id === 'bj') {
      void saveBjVersion('draft');
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
    if (activeTemplate?.id === 'pr') {
      void savePrVersion('published');
      return;
    }
    if (activeTemplate?.id === 'xj') {
      void saveXjVersion('published');
      return;
    }
    if (activeTemplate?.id === 'bj') {
      void saveBjVersion('published');
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

  const handleTemplateRestore = async () => {
    if (activeTemplate?.id === 'qr' && latestQrVersionRecord) {
      await restoreTemplateVersionAsDraft('qr', latestQrVersionRecord);
      return;
    }
    if (activeTemplate?.id === 'pr' && latestPrVersionRecord) {
      await restoreTemplateVersionAsDraft('pr', latestPrVersionRecord);
      return;
    }
    if (activeTemplate?.id === 'xj' && latestXjVersionRecord) {
      await restoreTemplateVersionAsDraft('xj', latestXjVersionRecord);
      return;
    }
    if (activeTemplate?.id === 'bj' && latestBjVersionRecord) {
      await restoreTemplateVersionAsDraft('bj', latestBjVersionRecord);
      return;
    }
    if (activeTemplate?.id === 'sc' && latestScVersionRecord) {
      await restoreTemplateVersionAsDraft('sc', latestScVersionRecord);
      return;
    }
    if (activeTemplate?.id === 'cg' && latestCgVersionRecord) {
      await restoreTemplateVersionAsDraft('cg', latestCgVersionRecord);
      return;
    }
    if (activeTemplate?.id === 'pi' && latestPiVersionRecord) {
      await restoreTemplateVersionAsDraft('pi', latestPiVersionRecord);
      return;
    }
    if (activeTemplate?.id === 'ci' && latestCiVersionRecord) {
      await restoreTemplateVersionAsDraft('ci', latestCiVersionRecord);
      return;
    }
    if (activeTemplate?.id === 'pl' && latestPlVersionRecord) {
      await restoreTemplateVersionAsDraft('pl', latestPlVersionRecord);
      return;
    }
    if (activeTemplate?.id === 'soa' && latestSoaVersionRecord) {
      await restoreTemplateVersionAsDraft('soa', latestSoaVersionRecord);
      return;
    }
    if (activeTemplate?.id === 'ing' && latestInquiryVersionRecord) {
      await restoreTemplateVersionAsDraft('ing', latestInquiryVersionRecord);
      return;
    }
    if (activeTemplate?.id === 'qt' && latestQuotationVersionRecord) {
      await restoreTemplateVersionAsDraft('qt', latestQuotationVersionRecord);
      return;
    }
    toast.info(`${activeTemplate?.name || '该模板'} 已进入统一编辑工作台，恢复逻辑下一步接入。`);
  };

  if (userRole === 'admin' && adminWorkspaceMode === 'template-hub') {
    const hubPreviewContentProps = activeTemplate
      ? buildTemplatePreviewContentProps({
          mode: 'hub',
          activeTemplate,
          qrTemplateData,
          qrTemplateTextOverrides,
          prTemplateData,
          prTemplateTextOverrides,
          xjTemplateData,
          scTemplateData,
          cgTemplateData,
          bjTemplateData,
          piTemplateData,
          ciTemplateData,
          plTemplateData,
          soaTemplateData,
          inquiryTemplateData,
          quotationTemplateData,
          quotationTemplateLayout,
        })
      : null;

    if (templateHubView === 'editor' && activeTemplate) {
      const templateEditorContentProps = buildTemplateEditorContentProps({
        activeTemplate,
        activeLoadedVersion,
        resolvedActiveTemplateMeta,
        publishStatusMeta,
        handleTemplateRestore,
        renderVersionHistoryPanel,
        latestQrPublishedRecord,
        latestQrDraftRecord,
        latestQrVersionRecord,
        qrTemplateVersionNote,
        setQrTemplateVersionNote,
        qrTemplateTextOverrides,
        updateQrTemplateText,
        qrTemplateData,
        updateQrTemplateData,
        qrTemplateLayout,
        updateQrTemplateLayout,
        qrVersionHistory,
        latestPrPublishedRecord,
        latestPrDraftRecord,
        latestPrVersionRecord,
        prTemplateVersionNote,
        setPrTemplateVersionNote,
        prTemplateTextOverrides,
        updatePrTemplateText,
        prTemplateData,
        updatePrTemplateData,
        prTemplateLayout,
        updatePrTemplateLayout,
        prVersionHistory,
        latestXjPublishedRecord,
        latestXjDraftRecord,
        latestXjVersionRecord,
        xjTemplateVersionNote,
        setXjTemplateVersionNote,
        xjTemplateLayout,
        updateXjTemplateLayout,
        xjTemplateData,
        updateXjTemplateData,
        xjVersionHistory,
        updateXjProductDescription,
        updateXjProductSpecification,
        updateXjProductQuantity,
        updateXjProductTargetPrice,
        XJ_TERMS_PRESETS,
        applyXjTermsPresetById,
        clearXjTerms,
        restoreDefaultXjTerms,
        latestBjPublishedRecord,
        latestBjDraftRecord,
        latestBjVersionRecord,
        bjTemplateVersionNote,
        setBjTemplateVersionNote,
        bjTemplateLayout,
        updateBjTemplateLayout,
        bjTemplateData,
        updateBjTemplateData,
        bjVersionHistory,
        latestScPublishedRecord,
        latestScDraftRecord,
        latestScVersionRecord,
        scTemplateVersionNote,
        setScTemplateVersionNote,
        scTemplateLayout,
        updateScTemplateLayout,
        scTemplateData,
        updateScTemplateData,
        scVersionHistory,
        scProductTableColumns: scTemplateData.templateSettings?.productTableColumns || DEFAULT_SALES_CONTRACT_PRODUCT_TABLE_COLUMNS,
        moveScProductTableColumn,
        updateScProductTableColumn,
        latestCgPublishedRecord,
        latestCgDraftRecord,
        latestCgVersionRecord,
        cgTemplateVersionNote,
        setCgTemplateVersionNote,
        cgTemplateLayout,
        updateCgTemplateLayout,
        cgTemplateData,
        updateCgTemplateData,
        cgVersionHistory,
        cgProductTableColumns: cgTemplateData.templateSettings?.productTableColumns || DEFAULT_PURCHASE_ORDER_PRODUCT_TABLE_COLUMNS,
        moveCgProductTableColumn,
        updateCgProductTableColumn,
        latestPiPublishedRecord,
        latestPiDraftRecord,
        latestPiVersionRecord,
        piTemplateVersionNote,
        setPiTemplateVersionNote,
        piTemplateLayout,
        updatePiTemplateLayout,
        piTemplateData,
        updatePiTemplateData,
        piVersionHistory,
        piGoodsTableColumns: piTemplateData.templateSettings?.goodsTableColumns || DEFAULT_PROFORMA_INVOICE_GOODS_TABLE_COLUMNS,
        movePiGoodsTableColumn,
        updatePiGoodsTableColumn,
        latestCiPublishedRecord,
        latestCiDraftRecord,
        latestCiVersionRecord,
        ciTemplateVersionNote,
        setCiTemplateVersionNote,
        ciTemplateLayout,
        updateCiTemplateLayout,
        ciTemplateData,
        updateCiTemplateData,
        ciVersionHistory,
        ciGoodsTableColumns: ciTemplateData.templateSettings?.goodsTableColumns || DEFAULT_COMMERCIAL_INVOICE_GOODS_TABLE_COLUMNS,
        moveCiGoodsTableColumn,
        updateCiGoodsTableColumn,
        latestPlPublishedRecord,
        latestPlDraftRecord,
        latestPlVersionRecord,
        plTemplateVersionNote,
        setPlTemplateVersionNote,
        plTemplateLayout,
        updatePlTemplateLayout,
        plTemplateData,
        updatePlTemplateData,
        plVersionHistory,
        latestSoaPublishedRecord,
        latestSoaDraftRecord,
        latestSoaVersionRecord,
        soaTemplateVersionNote,
        setSoaTemplateVersionNote,
        soaTemplateLayout,
        updateSoaTemplateLayout,
        soaTemplateData,
        updateSoaTemplateData,
        soaVersionHistory,
        latestInquiryPublishedRecord,
        latestInquiryDraftRecord,
        latestInquiryVersionRecord,
        inquiryTemplateVersionNote,
        setInquiryTemplateVersionNote,
        inquiryTemplateLayout,
        updateInquiryTemplateLayout,
        inquiryTemplateData,
        updateInquiryTemplateData,
        inquiryVersionHistory,
        inquiryProductTableColumns: inquiryTemplateData.templateSettings?.productTableColumns || DEFAULT_CUSTOMER_INQUIRY_PRODUCT_TABLE_COLUMNS,
        moveInquiryProductTableColumn,
        updateInquiryProductTableColumn,
        CUSTOMER_INQUIRY_REQUIREMENT_FIELDS,
        activeInquiryRequirementField,
        setActiveInquiryRequirementField,
        latestQuotationPublishedRecord,
        latestQuotationDraftRecord,
        latestQuotationVersionRecord,
        quotationTemplateVersionNote,
        setQuotationTemplateVersionNote,
        quotationTemplateLayout,
        updateQuotationTemplateLayout,
        quotationTemplateData,
        updateQuotationTemplateData,
        quotationVersionHistory,
        updateQuotationProductName,
        updateQuotationProductQuantity,
        updateQuotationProductUnitPrice,
        quotationProductTableColumns: quotationTemplateData.templateSettings?.productTableColumns || DEFAULT_QUOTATION_PRODUCT_TABLE_COLUMNS,
        moveQuotationProductTableColumn,
        updateQuotationProductTableColumn,
        restoreTemplateVersionAsDraft,
      });
      const editorPreviewContentProps = buildTemplatePreviewContentProps({
        mode: 'editor',
        activeTemplate,
        qrTemplateData,
        qrTemplateTextOverrides,
        prTemplateData,
        prTemplateTextOverrides,
        xjTemplateData,
        scTemplateData,
        cgTemplateData,
        bjTemplateData,
        piTemplateData,
        ciTemplateData,
        plTemplateData,
        soaTemplateData,
        inquiryTemplateData,
        quotationTemplateData,
        quotationTemplateLayout,
        resolvedActiveTemplateMeta,
        publishStatusLabel: resolvedActiveTemplateMeta ? publishStatusMeta[resolvedActiveTemplateMeta.status].label : '未发布',
      });

      return (
        <div className="flex h-full min-h-0 flex-col overflow-hidden">
          {/* Supabase 离线横幅 */}
          {isTemplateCenterSupabaseUnreachable() && (
            <div className="flex items-center gap-2 bg-amber-50 border-b border-amber-200 px-4 py-1.5 flex-shrink-0 text-xs text-amber-800">
              <span className="text-base">⚠️</span>
              <span className="flex-1">数据库暂时无法连接（Supabase 可能正在休眠）。当前处于<strong>离线编辑模式</strong>，保存/发布操作将失败，请等待服务恢复后重试。</span>
              <button
                type="button"
                onClick={() => { retryTemplateCenterSupabase(); window.location.reload(); }}
                className="shrink-0 rounded border border-amber-400 bg-amber-100 px-2 py-0.5 text-xs text-amber-800 hover:bg-amber-200"
              >
                重试连接
              </button>
            </div>
          )}
          <div className="flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-2 flex-shrink-0">
            <button type="button" onClick={() => setTemplateHubView('detail')} className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1">
              <ChevronRight className="w-3.5 h-3.5 rotate-180" />返回预览
            </button>
            <span className="text-gray-300">|</span>
            <span className="text-sm font-semibold text-gray-900">{activeTemplate.name} 编辑工作台</span>
            <Badge className="h-5 px-2 text-[10px] bg-orange-50 text-orange-700 border-orange-200">{resolvedActiveTemplateMeta?.currentVersion}</Badge>
            {hasActiveTemplateVersionSyncError && !isTemplateCenterSupabaseUnreachable() && (
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
                <TemplateEditorContent {...templateEditorContentProps} />
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-hidden bg-slate-100 p-6">
              <div
                className="h-full min-h-0 overflow-hidden rounded-[24px] p-8 shadow-inner"
                style={{ backgroundColor: '#525659' }}
              >
                <TemplateCenterPreviewViewport
                  className="rounded-none border-0 bg-[#525659]"
                  resetKey={`${activeTemplate.id}-${templateHubView}-editor`}
                  zoom={previewScale}
                  onZoomIn={() => setPreviewScale(Math.min(previewScale + 10, 150))}
                  onZoomOut={() => setPreviewScale(Math.max(previewScale - 10, 30))}
                  hideToolbar={false}
                >
                  <TemplatePreviewContent {...editorPreviewContentProps} />
                </TemplateCenterPreviewViewport>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-[28px] bg-white ring-1 ring-black/5">
        {/* 顶部模板标签页：仅工作台支持排序与改名，预览区不受影响 */}
        <div className="flex flex-shrink-0 items-center gap-4 border-b border-[#E5E7EB] bg-white px-10 py-5">
          <div className="flex flex-1 items-center gap-2.5 overflow-x-auto pr-2" style={{ scrollbarWidth: 'none' }}>
            {filteredTemplateWorkspaceItems.map((template) => {
              const isActive = activeTemplate?.id === template.id;
              const isEditing = editingTemplateTabId === template.id;
              const isDraggedOver = dragOverTemplateTabId === template.id && draggedTemplateTabId !== template.id;
              const isDragging = draggedTemplateTabId === template.id;
              const runtimeMeta = templateRuntimeMetaMap[template.id] || template.meta;
              return (
                <div
                  key={template.id}
                  draggable={!isEditing}
                  onDragStart={(event) => {
                    setDraggedTemplateTabId(template.id);
                    event.dataTransfer.effectAllowed = 'move';
                    event.dataTransfer.dropEffect = 'move';
                    event.dataTransfer.setData('text/plain', template.id);
                  }}
                  onDragOver={(event) => {
                    event.preventDefault();
                    event.dataTransfer.dropEffect = 'move';
                    setDragOverTemplateTabId(template.id);
                  }}
                  onDragLeave={() => {
                    if (dragOverTemplateTabId === template.id) {
                      setDragOverTemplateTabId(null);
                    }
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    if (draggedTemplateTabId) {
                      reorderTemplateHubItems(draggedTemplateTabId, template.id);
                    }
                    setDraggedTemplateTabId(null);
                    setDragOverTemplateTabId(null);
                  }}
                  onDragEnd={() => {
                    setDraggedTemplateTabId(null);
                    setDragOverTemplateTabId(null);
                  }}
                  onClick={() => {
                    if (!isEditing) {
                      setSelectedTemplateId(template.id);
                    }
                  }}
                  className={`group flex h-11 flex-shrink-0 select-none items-center gap-2 whitespace-nowrap rounded-[14px] border px-4 text-[14px] font-semibold tracking-tight transition-all ${
                    isActive
                      ? 'border-[#F96302] bg-[#F96302] text-white shadow-[0_10px_24px_rgba(249,99,2,0.2)]'
                      : 'border-[#D8DEE7] bg-white text-[#2F3947] hover:border-[#F96302]/35 hover:bg-[#FFF7F2]'
                  } ${isDraggedOver ? 'ring-2 ring-[#F96302] ring-offset-1' : ''} ${isDragging ? 'opacity-80' : ''}`}
                  title={template.displayName}
                >
                  <button
                    type="button"
                    onMouseDown={(event) => {
                      if (isEditing) return;
                      event.preventDefault();
                      event.stopPropagation();
                      setDraggedTemplateTabId(template.id);
                      setDragOverTemplateTabId(template.id);
                    }}
                    onClick={(event) => {
                      event.stopPropagation();
                    }}
                    className={`cursor-grab rounded-md p-0.5 active:cursor-grabbing ${isActive ? 'hover:bg-white/10' : 'hover:bg-[#F4F6F8]'}`}
                    title="拖动调整顺序"
                  >
                    <GripVertical className={`h-4 w-4 ${isActive ? 'text-white/80' : 'text-[#B7C0CD]'}`} />
                  </button>

                  {isEditing ? (
                    <Input
                      autoFocus
                      value={editingTemplateTabName}
                      onChange={(event) => setEditingTemplateTabName(event.target.value)}
                      onBlur={commitTemplateTabRename}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault();
                          commitTemplateTabRename();
                        }
                        if (event.key === 'Escape') {
                          event.preventDefault();
                          cancelTemplateTabRename();
                        }
                      }}
                      className="h-8 w-32 border-white/70 bg-white text-gray-900"
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        setSelectedTemplateId(template.id);
                      }}
                      className={`flex flex-1 items-center gap-2 overflow-hidden text-left ${isActive ? 'text-white' : 'text-[#2F3947]'}`}
                    >
                      <span className="truncate">{template.displayName}</span>
                      <span
                        className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                          isActive ? 'bg-white/20 text-white' : 'bg-[#FFF3EB] text-[#F96302]'
                        }`}
                        title={`当前模板版本：${runtimeMeta.currentVersion}`}
                      >
                        {runtimeMeta.currentVersion}
                      </span>
                    </button>
                  )}

                  {isEditing ? (
                    <button
                      type="button"
                      onClick={commitTemplateTabRename}
                      className={`rounded-md p-1 ${isActive ? 'hover:bg-white/15' : 'hover:bg-[#F4F6F8]'}`}
                      title="保存名称"
                    >
                      <Check className={`h-4 w-4 ${isActive ? 'text-white' : 'text-[#F96302]'}`} />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        beginTemplateTabRename(template.id, template.customName || template.displayName);
                      }}
                      className={`rounded-md p-1 opacity-0 transition-opacity group-hover:opacity-100 ${
                        isActive ? 'hover:bg-white/15' : 'hover:bg-[#F4F6F8]'
                      }`}
                      title="编辑名称"
                    >
                      <Pencil className={`h-4 w-4 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-11 shrink-0 gap-2 rounded-[14px] border-[#D8DEE7] px-4 text-[14px] font-semibold text-[#2F3947] hover:bg-[#F8FAFC]"
            onClick={() => setTemplateHubManagerOpen(true)}
          >
            <Settings2 className="h-4 w-4" />
            管理模板条
          </Button>
        </div>

        <Dialog open={templateHubManagerOpen} onOpenChange={setTemplateHubManagerOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>模板中心工作台导航管理</DialogTitle>
              <DialogDescription>
                这里只调整模板中心工作台顶部模板条的显示顺序与名称，不会改动其他模块。
              </DialogDescription>
            </DialogHeader>

            <div className="max-h-[70vh] overflow-y-auto pr-1">
              <div className="space-y-3">
                {templateHubManagerItems.map((template, index) => (
                  <div
                    key={`manager-${template.id}`}
                    className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3"
                  >
                    <div className="flex w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-sm font-semibold text-gray-600">
                      {index + 1}
                    </div>

                    <div className="min-w-0 flex-1">
                      <Label htmlFor={`template-tab-name-${template.id}`} className="text-xs text-gray-500">
                        工作台名称
                      </Label>
                      <Input
                        id={`template-tab-name-${template.id}`}
                        value={template.customName || template.displayName}
                        onChange={(e) => updateTemplateHubTabName(template.id, e.target.value)}
                        onBlur={(e) => {
                          void persistTemplateHubTabName(template.id, e.target.value);
                        }}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            event.preventDefault();
                            void persistTemplateHubTabName(template.id, event.currentTarget.value);
                            event.currentTarget.blur();
                          }
                        }}
                        placeholder={template.name}
                        className="mt-1 h-10"
                      />
                      <div className="mt-1 text-xs text-gray-400">
                        原名称：{template.name} · 英文：{template.nameEn}
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-10 w-10"
                        disabled={index === 0}
                        onClick={() => moveTemplateHubItem(template.id, 'left')}
                        title="左移"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-10 w-10"
                        disabled={index === templateHubManagerItems.length - 1}
                        onClick={() => moveTemplateHubItem(template.id, 'right')}
                        title="右移"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between border-t pt-4">
              <p className="text-sm text-gray-500">
                调整后会立即作用于模板中心工作台顶部模板条，并永久保存到 Supabase。
              </p>
              <div className="flex items-center gap-2">
                <Button type="button" variant="ghost" onClick={resetTemplateHubTabs}>
                  恢复默认
                </Button>
                <Button type="button" onClick={() => setTemplateHubManagerOpen(false)}>
                  完成
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* 主体：深灰背景 + 居中A4文档 + 右侧工具条 */}
        {activeTemplate && (
          <div className="min-h-0 flex-1 overflow-hidden bg-slate-100 p-6">
            <div
              className="h-full min-h-0 overflow-hidden rounded-[24px] p-8 shadow-inner"
              style={{ backgroundColor: '#525659' }}
            >
              <TemplateCenterPreviewViewport
                className="rounded-none border-0 bg-[#525659]"
                resetKey={`${activeTemplate.id}-${templateHubView}`}
                zoom={previewScale}
                onZoomIn={() => setPreviewScale(Math.min(previewScale + 10, 150))}
                onZoomOut={() => setPreviewScale(Math.max(previewScale - 10, 30))}
                onOpenEditor={() => setTemplateHubView('editor')}
              >
                {hubPreviewContentProps && <TemplatePreviewContent {...hubPreviewContentProps} />}
              </TemplateCenterPreviewViewport>
            </div>
          </div>
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
  const adminOrg = getStoredAdminOrgProfile();
  const companyName = adminOrg.nameCN || adminOrg.nameEN || '贵司';

  React.useEffect(() => {
    if (open && document) {
      setEmailTo(document.customerEmail);
      setEmailSubject(`【${companyName}】${document.documentNumber}`);
      setEmailBody(`尊敬的 ${document.customerName}：\n\n您好！\n\n附件为您的订单 ${document.contractNumber} 的相关单证，请查收。\n\n此致\n敬礼\n\n${companyName}`);
    }
  }, [open, document, companyName]);

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
