import React, { useEffect, useMemo, useState } from 'react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '../ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Checkbox } from '../ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Search, Filter, Eye, Reply, CheckCircle, XCircle, Clock, FileText, AlertCircle, TestTube, ChevronDown, ChevronUp, Send, Trash2 } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { CustomerInquiryView } from '../dashboard/CustomerInquiryView';
import { exportToPDF, exportToPDFPrint, generatePDFFilename } from '../../utils/pdfExport';
import { StandardDocumentViewerShell } from '../documents/StandardDocumentViewerShell';
import { useInquiry } from '../../contexts/InquiryContext';
import type { RegionType } from '../../utils/xjNumberGenerator';
import { nextQRNumber } from '../../utils/xjNumberGenerator';
import { CompactStatCard } from './CompactStatCard';
import { MultiDimensionFilters } from './MultiDimensionFilters';
import { CreateXJFromInquiryDialog } from './CreateXJFromInquiryDialog';
import { CreateQuotationRequestDialog } from './CreateQuotationRequestDialog';
import { useQuotationRequests } from '../../contexts/QuotationRequestContext';
import { useQuoteRequirements } from '../../contexts/QuoteRequirementContext';
import { useAdminOrganization } from '../../contexts/AdminOrganizationContext';
import { generateQRNumber } from '../../utils/xjNumberGenerator';
import { extractModelNo, extractSpecification } from '../../utils/productDataExtractor';
import { approvalRecordService, quoteRequirementService, sharedRoleUiPreferenceService, staffDirectoryService, type StaffDirectoryProfile } from '../../lib/supabaseService';
import { buildQuoteRequirementDocumentSnapshot } from './purchase-order/purchaseOrderUtils';
import { normalizeFlowProductCore } from '../../utils/documentDataAdapters';
import { matchesBusinessOwnerEmail, resolveInquirySalesOwner } from '../../utils/quotationOwnership';
import { normalizePersonnelEmail } from '../../lib/notification-rules';
import { getCurrentUser } from '../../utils/dataIsolation';
import { getRegionalManagerByRegion } from '../../lib/customer-salesrep-mapping';
import { internalInquiryAssignmentService } from '../../lib/services/internalInquiryAssignmentService';
import {
  inferRegionCode,
  resolvePermissionRoleCode,
} from './admin-organization-profile/roleMappingEngine';
import { getColumnStyle, renderColumnResizeHandle } from './admin-organization-profile/peopleCenterVisuals';
import {
  ERP_LIST_DELETE_BUTTON_CLASS,
  ERP_LIST_DELETE_BUTTON_STYLE,
  ERP_LIST_UI_SPEC_V1,
} from '../shared/erpListUiSpec';

interface AdminInquiryManagementProps {
  onCreateQuotation?: (inquiry: any) => void;
  onSwitchToCostInquiry?: () => void; // 🔥 新增：切换到成本询报模块的回调
  highlightInquiryNumber?: string;
}

type InquiryManagementColumnKey =
  | 'select'
  | 'index'
  | 'inquiryNo'
  | 'customer'
  | 'subject'
  | 'date'
  | 'priority'
  | 'status'
  | 'oem'
  | 'actions';

const INQUIRY_MANAGEMENT_TABLE_UI_PREFERENCE_PREFIX = 'sales_inquiry_table_column_widths';
const INQUIRY_MANAGEMENT_COLUMN_ORDER: InquiryManagementColumnKey[] = [
  'select',
  'index',
  'date',
  'inquiryNo',
  'customer',
  'subject',
  'priority',
  'status',
  'oem',
  'actions',
];
const INQUIRY_MANAGEMENT_COLUMN_MIN_WIDTHS: Record<InquiryManagementColumnKey, number> = {
  select: 44,
  index: 56,
  inquiryNo: 132,
  customer: 164,
  subject: 192,
  date: 96,
  priority: 90,
  status: 104,
  oem: 110,
  actions: 156,
};
const INQUIRY_MANAGEMENT_TABLE_DEFAULT_WIDTHS: Record<InquiryManagementColumnKey, number> = {
  select: 52,
  index: 72,
  inquiryNo: 146,
  customer: 188,
  subject: 236,
  date: 110,
  priority: 96,
  status: 116,
  oem: 122,
  actions: 172,
};

const normalizeInquiryManagementPreferenceRole = (role?: string | null) => {
  const normalized = String(role || '').trim();
  return normalized || 'Sales_Rep';
};

const getInquiryManagementPreferenceKey = (status: string) =>
  `${INQUIRY_MANAGEMENT_TABLE_UI_PREFERENCE_PREFIX}:${status}:v2`;

const getInquiryManagementLocalPreferenceCacheKey = (scope: string, key: string) =>
  `inquiry_management_table_pref_cache:${scope}:${key}`;

const readCachedInquiryManagementColumnWidths = (
  scope: string,
  key: string,
): Partial<Record<InquiryManagementColumnKey, number>> | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(getInquiryManagementLocalPreferenceCacheKey(scope, key));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const writeCachedInquiryManagementColumnWidths = (
  scope: string,
  key: string,
  value: Partial<Record<InquiryManagementColumnKey, number>> | null,
) => {
  if (typeof window === 'undefined') return;
  try {
    const cacheKey = getInquiryManagementLocalPreferenceCacheKey(scope, key);
    if (value) {
      window.localStorage.setItem(cacheKey, JSON.stringify(value));
    } else {
      window.localStorage.removeItem(cacheKey);
    }
  } catch {
    // noop
  }
};

const mergeStoredInquiryManagementColumnWidths = (
  stored: Partial<Record<InquiryManagementColumnKey, number>> | null | undefined,
) => {
  const next = { ...INQUIRY_MANAGEMENT_TABLE_DEFAULT_WIDTHS };
  INQUIRY_MANAGEMENT_COLUMN_ORDER.forEach((key) => {
    const candidate = Number(stored?.[key]);
    if (Number.isFinite(candidate) && candidate > 0) {
      next[key] = Math.max(INQUIRY_MANAGEMENT_COLUMN_MIN_WIDTHS[key], Math.round(candidate));
    }
  });
  return next;
};

const fitInquiryManagementColumnWidthsToContainer = (
  preferred: Record<InquiryManagementColumnKey, number>,
  containerWidth: number,
) => {
  if (!Number.isFinite(containerWidth) || containerWidth <= 0) return preferred;
  const minimumTotal = INQUIRY_MANAGEMENT_COLUMN_ORDER.reduce(
    (sum, key) => sum + INQUIRY_MANAGEMENT_COLUMN_MIN_WIDTHS[key],
    0,
  );
  if (containerWidth <= minimumTotal) {
    const scale = containerWidth / minimumTotal;
    const compressed = { ...preferred };
    INQUIRY_MANAGEMENT_COLUMN_ORDER.forEach((key) => {
      compressed[key] = Math.max(24, Math.round(INQUIRY_MANAGEMENT_COLUMN_MIN_WIDTHS[key] * scale));
    });
    const total = INQUIRY_MANAGEMENT_COLUMN_ORDER.reduce((sum, key) => sum + compressed[key], 0);
    const remainder = Math.round(containerWidth - total);
    if (remainder !== 0) compressed.actions = Math.max(24, compressed.actions + remainder);
    return compressed;
  }
  const next = { ...preferred };
  INQUIRY_MANAGEMENT_COLUMN_ORDER.forEach((key) => {
    next[key] = INQUIRY_MANAGEMENT_COLUMN_MIN_WIDTHS[key];
  });
  const preferredExtra = INQUIRY_MANAGEMENT_COLUMN_ORDER.reduce(
    (sum, key) => sum + Math.max((preferred[key] || 0) - INQUIRY_MANAGEMENT_COLUMN_MIN_WIDTHS[key], 0),
    0,
  );
  const distributableWidth = containerWidth - minimumTotal;
  if (preferredExtra > 0 && distributableWidth > 0) {
    INQUIRY_MANAGEMENT_COLUMN_ORDER.forEach((key) => {
      const extra = Math.max((preferred[key] || 0) - INQUIRY_MANAGEMENT_COLUMN_MIN_WIDTHS[key], 0);
      next[key] += Math.round((extra / preferredExtra) * distributableWidth);
    });
  }
  const total = INQUIRY_MANAGEMENT_COLUMN_ORDER.reduce((sum, key) => sum + next[key], 0);
  const remainder = Math.round(containerWidth - total);
  if (remainder !== 0) next.actions = Math.max(24, next.actions + remainder);
  return next;
};

const formatInquiryManagementDateOnly = (value?: string | null) => {
  const text = String(value || '').trim();
  if (!text) return '-';
  return text.includes('T') ? text.slice(0, 10) : text;
};

export default function AdminInquiryManagement({ onCreateQuotation, onSwitchToCostInquiry, highlightInquiryNumber }: AdminInquiryManagementProps = {}) {
  const inquiryTableContainerRef = React.useRef<HTMLDivElement | null>(null);
  const inquiryColumnResizeRef = React.useRef<{
    key: InquiryManagementColumnKey;
    startX: number;
    startWidth: number;
  } | null>(null);
  const withOperationTimeout = async <T,>(task: Promise<T>, timeoutMs: number, label: string): Promise<T> => {
    return await Promise.race([
      task,
      new Promise<T>((_, reject) => {
        window.setTimeout(() => {
          reject(new Error(`${label}超时，请稍后检查成本询报列表`));
        }, timeoutMs);
      }),
    ]);
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedInquiry, setSelectedInquiry] = useState<any>(null);
  const [isInquiryDetailOpen, setIsInquiryDetailOpen] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  
  // 🔥 批量选择和删除状态
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  
  // 🔥 创建供应商XJ对话框状态
  const [showXJDialog, setShowXJDialog] = useState(false);
  const [xjInquiry, setXJInquiry] = useState<any>(null);
  
  // 🎯 多维度筛选状态 (老板角色专用)
  const [filterRegion, setFilterRegion] = useState('all');
  const [filterSalesRep, setFilterSalesRep] = useState('all');
  const [filterCustomer, setFilterCustomer] = useState('all');
  const [filterProduct, setFilterProduct] = useState('all');
  const [filterCountry, setFilterCountry] = useState('all'); // 🔥 新增：国家筛选
  const [filterDateRange, setFilterDateRange] = useState('all'); // 🔥 新增：时间段筛选
  const [filterOem, setFilterOem] = useState('all');
  const [filterOemProcessing, setFilterOemProcessing] = useState('all');
  const [salesRepAssignments, setSalesRepAssignments] = useState<Record<string, string>>({});
  const [managerAssignedInquiryNumbers, setManagerAssignedInquiryNumbers] = useState<Set<string>>(new Set());
  const [regionalSalesRepOptions, setRegionalSalesRepOptions] = useState<StaffDirectoryProfile[]>([]);
  const [pushingInquiryId, setPushingInquiryId] = useState<string | null>(null);
  const [inquiryTableContainerWidth, setInquiryTableContainerWidth] = useState(0);
  const [inquiryColumnWidths, setInquiryColumnWidths] = useState<Record<InquiryManagementColumnKey, number>>(INQUIRY_MANAGEMENT_TABLE_DEFAULT_WIDTHS);
  const [inquiryHasCustomWidths, setInquiryHasCustomWidths] = useState(false);
  const [inquiryPreferenceHydrated, setInquiryPreferenceHydrated] = useState(false);
  const inquiryPreviewRef = React.useRef<HTMLDivElement | null>(null);
  const { adminOrg } = useAdminOrganization();
  
  // 🚀 Use unified InquiryContext - only show submitted inquiries
  const { addInquiry, getSubmittedInquiries, deleteInquiry, refreshInquiries, updateInquiry } = useInquiry();
  const inquiries = getSubmittedInquiries();
  
  useEffect(() => {
    if (inquiries.length > 0) return;
    const timer = window.setTimeout(() => {
      void refreshInquiries().catch(() => {});
    }, 120);
    return () => {
      window.clearTimeout(timer);
    };
  }, [inquiries.length, refreshInquiries]);
  
  // 🔥 获取QuotationRequest数据，用于检查是否已下推
  const { getQuotationRequestsByInquiry } = useQuotationRequests();
  
  // 🔥 获取 QR Context，用于下推报价请求单
  const {
    requirements: quoteRequirements,
    addRequirement: addQuoteRequirement,
    refreshQuoteRequirementsFromApi,
  } = useQuoteRequirements();
  const [actingStaffUser, setActingStaffUser] = useState<any>(() => getCurrentUser());
  const actingUserEmail = String(actingStaffUser?.email || '').trim().toLowerCase();
  const actingUserId = actingStaffUser?.id || null;
  
  // 🔥 批量删除处理函数
  const handleBulkDelete = async () => {
    const visibleSelectedIds = Array.from(selectedIds).filter((id) =>
      filteredInquiries.some((inquiry) => inquiry.id === id),
    );

    if (visibleSelectedIds.length === 0) {
      toast.error('请先选择要删除的询价单');
      return;
    }

    if (window.confirm(`确认将选中的 ${visibleSelectedIds.length} 条询价单从当前业务员视图隐藏吗？不会影响客户侧原始询价单。`)) {
      try {
        await Promise.all(visibleSelectedIds.map((id) => deleteInquiry(id)));
        setSelectedIds(new Set());
        toast.success(`✅ 已从当前视图隐藏 ${visibleSelectedIds.length} 条询价单`);
      } catch (error: any) {
        toast.error(error?.message || '隐藏询价单失败');
      }
    }
  };

  // 🔥 全选/取消全选
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(filteredInquiries.map(inq => inq.id));
      setSelectedIds(allIds);
    } else {
      setSelectedIds(new Set());
    }
  };

  // 🔥 单选处理
  const handleSelectOne = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedIds(newSelected);
  };
  
  // 🔥 下推成本询报：从INQ创建QR（调用后端API）
  const handlePushToCostInquiry = async (inquiry: any) => {
    if (pushingInquiryId === inquiry.id) return;
    try {
      setPushingInquiryId(inquiry.id);
      // QR 的 documentDataSnapshot 由 buildQuoteRequirementDocumentSnapshot 重新生成，
      // 不依赖 ING 的快照，因此无需检查 ING 是否有快照。
      const regionCode = inquiry.region === 'South America' ? 'SA' : inquiry.region === 'Europe & Africa' ? 'EA' : 'NA';
      const qrNumber = await nextQRNumber(regionCode);
      const quotationOwner = resolveInquirySalesOwner(inquiry, actingStaffUser);
      const newQR = {
        id: crypto.randomUUID(),
        requirementNo: qrNumber,
        sourceInquiryId: inquiry.id,
        sourceInquiryNumber: inquiry.inquiryNumber || inquiry.id,
        createdDate: String(
          inquiry.createdDate ||
          inquiry.createdAt ||
          inquiry.created_at ||
          new Date().toISOString()
        ),
        region: inquiry.region || 'North America',
        requiredDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        urgency: 'medium',
        status: 'pending',
        createdBy: actingUserEmail || '',
        requestedBy: quotationOwner.email || null,
        requestedByName: quotationOwner.name || null,
        notes: inquiry.message || '',
        customer: {
          companyName: inquiry.buyerInfo?.companyName || inquiry.customer?.name || 'N/A',
          contactPerson: inquiry.buyerInfo?.contactPerson || inquiry.customer?.name || 'N/A',
          email: inquiry.buyerInfo?.email || inquiry.customer?.email || inquiry.userEmail || 'N/A',
          phone: inquiry.buyerInfo?.phone || inquiry.customer?.phone || 'N/A',
          mobile: inquiry.buyerInfo?.mobile || '',
          address: inquiry.buyerInfo?.address || inquiry.customer?.address || 'N/A',
          website: inquiry.buyerInfo?.website || '',
          businessType: inquiry.buyerInfo?.businessType || ''
        },
        items: inquiry.products.map((p: any, idx: number) => {
          const normalized = normalizeFlowProductCore(p, idx);
          return {
            id: p.id || normalized.id,
            productName: normalized.productName,
            productNameEn: normalized.productNameEn,
            productNameZh: normalized.productNameZh,
            modelNo: extractModelNo({ ...p, modelNo: normalized.modelNo }, idx),
            specification: extractSpecification({ ...p, specification: normalized.specification }),
            specificationEn: normalized.specificationEn,
            specificationZh: normalized.specificationZh,
            quantity: normalized.quantity || 0,
            unit: normalized.unit || 'PCS',
            targetPrice: p.unitPrice || p.price || p.targetPrice || 0,
            targetCurrency: 'USD',
            hsCode: normalized.hsCode || '',
            imageUrl: normalized.imageUrl || '',
            remarks: normalized.remarks || '',
          };
        }),
      };
      await withOperationTimeout(addQuoteRequirement({
        ...newQR,
        documentDataSnapshot: buildQuoteRequirementDocumentSnapshot(newQR as any),
      }), 15000, '下推成本询报');
      void withOperationTimeout(refreshQuoteRequirementsFromApi(), 5000, '刷新成本询报列表').catch(() => null);
      toast.success(`✅ 成功下推到成本询报！QR单号：${qrNumber}`);
      if (onSwitchToCostInquiry) setTimeout(() => onSwitchToCostInquiry(), 500);
    } catch (error: any) {
      console.error('❌ [下推成本询报] 失败:', error);
      toast.error(`❌ 下推失败: ${error.message || '未知错误'}`);
    } finally {
      setPushingInquiryId((current) => (current === inquiry.id ? null : current));
    }
  };

  // 🌍 Get current user region from localStorage
  // 🗺️ Region mapping: convert short codes to full names
  const regionCodeToFullName = (code: string | null): string | null => {
    if (!code) return null;
    const mapping: Record<string, string> = {
      'NA': 'North America',
      'SA': 'South America',
      'EA': 'Europe & Africa',
      'north_america': 'North America',
      'south_america': 'South America',
      'europe_africa': 'Europe & Africa',
      '北美': 'North America',
      '南美': 'South America',
      '欧非': 'Europe & Africa',
      'all': 'all'
    };
    return mapping[code] || code;
  };

  const normalizeInquiryRegionForRouting = (region?: string | null): 'north_america' | 'south_america' | 'europe_africa' => {
    const normalizedRegion = String(region || '').trim();
    if (normalizedRegion === 'South America' || normalizedRegion === 'SA' || normalizedRegion === 'south_america' || normalizedRegion === '南美') {
      return 'south_america';
    }
    if (normalizedRegion === 'Europe & Africa' || normalizedRegion === 'EA' || normalizedRegion === 'europe_africa' || normalizedRegion === '欧非') {
      return 'europe_africa';
    }
    return 'north_america';
  };

  const isAwaitingRegionalManagerDispatch = (inquiry: any) => {
    const normalizedAssignedEmail = normalizePersonnelEmail(inquiry.assignedTo, inquiry.region) || '';
    const normalizedSalesRepEmail = normalizePersonnelEmail(
      inquiry.salesRepEmail || inquiry.ownerEmail,
      inquiry.region,
    ) || '';
    const regionalManager = getRegionalManagerByRegion(normalizeInquiryRegionForRouting(inquiry.region));
    const regionalManagerEmail = normalizePersonnelEmail(regionalManager?.email, inquiry.region) || '';

    return Boolean(
      inquiry.isSubmitted &&
      normalizedAssignedEmail &&
      regionalManagerEmail &&
      normalizedAssignedEmail === regionalManagerEmail &&
      !normalizedSalesRepEmail
    );
  };

  const [currentUserRegion, setCurrentUserRegion] = useState<string | null>(() =>
    regionCodeToFullName((actingStaffUser as any)?.region || '') || null,
  );
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(() =>
    (actingStaffUser as any)?.role || (actingStaffUser as any)?.userRole || null,
  );

  useEffect(() => {
    if (currentUserRole !== 'Regional_Manager') {
      setManagerAssignedInquiryNumbers(new Set());
      return;
    }

    let cancelled = false;
    const idleDisposer = (() => {
      const idleWindow = window as Window & {
        requestIdleCallback?: (cb: () => void, options?: { timeout?: number }) => number;
        cancelIdleCallback?: (handle: number) => void;
      };

      const loadManagerAssignedInquiryNumbers = async () => {
        try {
          const records = await approvalRecordService.getAll();
          if (cancelled) return;

          const nextInquiryNumbers = new Set<string>();
          for (const record of records || []) {
            if (String(record?.type || '').trim() !== 'ing') continue;

            const inquiryNumber = String(record?.relatedDocumentId || '').trim();
            if (!inquiryNumber) continue;

            const approvalHistory = Array.isArray(record?.approvalHistory) ? record.approvalHistory : [];
            const hasRegionalManagerDispatchHistory = approvalHistory.some((item: any) =>
              String(item?.action || '').trim() === 'cancelled' &&
              String(item?.approverRole || '').trim() === 'Regional_Manager',
            );

            if (hasRegionalManagerDispatchHistory) {
              nextInquiryNumbers.add(inquiryNumber);
            }
          }

          setManagerAssignedInquiryNumbers(nextInquiryNumbers);
        } catch (error) {
          if (!cancelled) {
            console.warn('[AdminInquiryManagement] failed to load manager dispatch history:', error);
          }
        }
      };

      if (typeof idleWindow.requestIdleCallback === 'function') {
        const idleId = idleWindow.requestIdleCallback(() => {
          void loadManagerAssignedInquiryNumbers();
        }, { timeout: 1200 });

        return () => idleWindow.cancelIdleCallback?.(idleId);
      }

      const timer = window.setTimeout(() => {
        void loadManagerAssignedInquiryNumbers();
      }, 180);

      return () => {
        window.clearTimeout(timer);
      };
    })();

    return () => {
      cancelled = true;
      idleDisposer();
    };
  }, [currentUserRole]);

  // 从 Supabase Auth 同步用户区域和角色
  useEffect(() => {
    const runtimeUser = getCurrentUser();
    setActingStaffUser(runtimeUser);
    if (runtimeUser) {
      const fullRegionName = regionCodeToFullName((runtimeUser as any).region || '');
      setCurrentUserRegion(fullRegionName);
      setCurrentUserRole((runtimeUser as any).role || (runtimeUser as any).userRole || null);
    }
    const handleUserChanged = () => {
      const nextUser = getCurrentUser();
      setActingStaffUser(nextUser);
      const fullRegionName = regionCodeToFullName((nextUser as any)?.region || '');
      setCurrentUserRegion(fullRegionName);
      setCurrentUserRole((nextUser as any)?.role || (nextUser as any)?.userRole || null);
    };
    window.addEventListener('userChanged', handleUserChanged);
    return () => window.removeEventListener('userChanged', handleUserChanged);
  }, []);

  // Helper: normalize region for matching (supports both codes and full names)
  const normalizeRegionForMatch = (r: string | null | undefined): string[] => {
    if (!r) return [];
    const s = String(r).trim();
    if (!s || s === 'all') return [];
    
    const variants = [s];
    const map: Record<string, string[]> = {
      'NA': ['North America', 'north-america', 'north_america', '北美'],
      'North America': ['NA', 'north-america', 'north_america', '北美'],
      'north-america': ['NA', 'North America', 'north_america', '北美'],
      'north_america': ['NA', 'North America', 'north-america', '北美'],
      '北美': ['NA', 'North America', 'north-america', 'north_america'],
      'SA': ['South America', 'south-america', 'south_america', '南美'],
      'South America': ['SA', 'south-america', 'south_america', '南美'],
      'south-america': ['SA', 'South America', 'south_america', '南美'],
      'south_america': ['SA', 'South America', 'south-america', '南美'],
      '南美': ['SA', 'South America', 'south-america', 'south_america'],
      'EA': ['Europe & Africa', 'EMEA', 'europe-africa', 'europe_africa', '欧非'],
      'EMEA': ['Europe & Africa', 'EA', 'europe-africa', 'europe_africa', '欧非'],
      'Europe & Africa': ['EA', 'EMEA', 'europe-africa', 'europe_africa', '欧非'],
      'europe-africa': ['EA', 'EMEA', 'Europe & Africa', 'europe_africa', '欧非'],
      'europe_africa': ['EA', 'EMEA', 'Europe & Africa', 'europe-africa', '欧非'],
      '欧非': ['EA', 'EMEA', 'Europe & Africa', 'europe-africa', 'europe_africa'],
    };
    
    const mapped = map[s] || [];
    return [...new Set([...variants, ...mapped])];
  };

  const assignmentFilteredInquiries = currentUserRole === 'Sales_Rep' && actingUserEmail
    ? inquiries.filter((inq) => {
        return matchesBusinessOwnerEmail(
          inq.ownerEmail || inq.salesRepEmail || inq.assignedTo,
          actingUserEmail,
          inq.region,
          inq.ownerUserId,
          actingUserId,
        );
      })
    : inquiries;

  // 🌍 Filter inquiries by user region (supports region code/full name matching)
  const regionFilteredInquiries = (currentUserRole === 'Sales_Rep' || currentUserRole === 'Regional_Manager') && currentUserRegion && currentUserRegion !== 'all'
    ? (() => {
        const userRegionVariants = normalizeRegionForMatch(currentUserRegion);
        return assignmentFilteredInquiries.filter(inq => {
          // 如果询价的 region 是 null/undefined，允许显示（可能是旧数据或未设置区域）
          if (!inq.region) return true;
          
          // 如果有区域，则进行匹配
          if (!userRegionVariants.length) return true; // no region filter
          const inqRegionVariants = normalizeRegionForMatch(inq.region);
          return userRegionVariants.some(v => inqRegionVariants.includes(v));
        });
      })()
    : assignmentFilteredInquiries;


  // Map inquiries to display format
  const displayInquiries = regionFilteredInquiries
    .filter(inq => !!inq.id)
    .map(inq => ({
      ...inq,
      oemEnabled: Boolean(inq.oem?.enabled),
      oemProcessingStatus: inq.oem?.internalProcessing?.anonymizationStatus || 'pending',
      inquiryNumber: inq.inquiryNumber || inq.id,
      customer: {
        name: inq.buyerInfo?.companyName || 'N/A',
        email: inq.userEmail || inq.buyerInfo?.email || 'N/A',
        company: inq.buyerInfo?.companyName || 'N/A'
      },
      customerName: inq.buyerInfo?.companyName || 'N/A',
      customerEmail: inq.userEmail || 'N/A',
      subject: `询价 - ${inq.products?.length || 0} 个产品`,
      inquiryDate: inq.date,
      priority: 'Medium'
    }));

  useEffect(() => {
    console.info('[AdminInquiryManagementNew][render]', {
      actingUser: actingStaffUser
        ? {
            id: actingStaffUser.id || null,
            email: actingStaffUser.email || null,
            role: actingStaffUser.role || actingStaffUser.userRole || null,
            region: actingStaffUser.region || null,
          }
        : null,
      currentUserRole,
      currentUserRegion,
      submittedInquiryCount: inquiries.length,
      assignmentFilteredCount: assignmentFilteredInquiries.length,
      regionFilteredCount: regionFilteredInquiries.length,
      displayCount: displayInquiries.length,
      firstRows: displayInquiries.slice(0, 5).map((inquiry) => ({
        id: inquiry.id,
        inquiryNumber: inquiry.inquiryNumber || null,
        status: inquiry.status,
        region: inquiry.region,
        assignedTo: inquiry.assignedTo || null,
        salesRepEmail: inquiry.salesRepEmail || null,
        ownerEmail: inquiry.ownerEmail || null,
      })),
    });
  }, [
    actingStaffUser,
    currentUserRole,
    currentUserRegion,
    inquiries,
    assignmentFilteredInquiries,
    regionFilteredInquiries,
    displayInquiries,
  ]);


  // 🎯 从数据中提取唯一值
  const uniqueRegions = [...new Set(displayInquiries.map(inq => inq.region).filter(Boolean))];
  const uniqueCustomers = [...new Set(displayInquiries.map(inq => inq.customer.name).filter(Boolean))];
  // 🔥 新增：提取业务员和国家列表
  const uniqueSalesReps = [...new Set(displayInquiries.map(inq => inq.ownerEmail || inq.salesRepEmail || inq.assignedTo).filter(Boolean))];
  const uniqueCountries = [...new Set(displayInquiries.map(inq => inq.country).filter(Boolean))];
  const uniqueOemProcessingStatuses = [...new Set(displayInquiries.filter(inq => inq.oemEnabled).map(inq => inq.oemProcessingStatus).filter(Boolean))];
  const normalizedManagerRegionCode = (() => {
    const region = regionCodeToFullName(actingStaffUser?.region || '') || actingStaffUser?.region || '';
    if (region === 'North America') return 'NA';
    if (region === 'South America') return 'SA';
    if (region === 'Europe & Africa') return 'EA';
    if (region === 'NA' || region === 'SA' || region === 'EA') return region;
    return '';
  })();
  const isRegionalManagerView = currentUserRole === 'Regional_Manager';
  const inquiryPreferenceRoleScope = useMemo(
    () => normalizeInquiryManagementPreferenceRole(currentUserRole),
    [currentUserRole],
  );
  const adminOrgRegionalSalesRepOptions = useMemo(() => {
    const contacts = Array.isArray(adminOrg?.internalContacts) ? adminOrg.internalContacts : [];
    const contactById = new Map<string, any>();
    const contactByEmail = new Map<string, any>();

    contacts.forEach((contact) => {
      const contactId = String(contact?.id || '').trim();
      const contactEmail = normalizePersonnelEmail(contact?.email, contact?.region);
      if (contactId) contactById.set(contactId, contact);
      if (contactEmail) contactByEmail.set(contactEmail, contact);
    });

    return (adminOrg?.internalAccounts || [])
      .filter((account) => {
        const status = String(account?.accountStatus || 'active').trim().toLowerCase();
        return !['deleted', 'disabled', 'locked'].includes(status);
      })
      .filter((account) => account?.canLogin !== false)
      .map((account) => {
        const accountEmail = normalizePersonnelEmail(account?.loginEmail, account?.region);
        const linkedContact = contactById.get(String(account?.employeeId || '').trim())
          || contactByEmail.get(accountEmail);
        const resolvedDepartment = String(linkedContact?.department || account?.department || '').trim();
        const resolvedRegion = inferRegionCode(account?.region || linkedContact?.region, resolvedDepartment);
        const resolvedRole = resolvePermissionRoleCode(
          account?.role,
          linkedContact?.title,
          resolvedDepartment,
          resolvedRegion,
        );

        if (resolvedRole !== 'Sales_Rep') return null;
        if (String(resolvedRegion || '').trim().toUpperCase() !== normalizedManagerRegionCode) return null;

        return {
          id: String(account?.authUserId || account?.id || accountEmail),
          email: accountEmail,
          name: String(linkedContact?.name || account?.username || accountEmail || '').trim(),
          portalRole: 'admin',
          rbacRole: 'Sales_Rep',
          region: normalizedManagerRegionCode,
        } satisfies StaffDirectoryProfile;
      })
      .filter((row): row is StaffDirectoryProfile => Boolean(row?.email));
  }, [adminOrg, normalizedManagerRegionCode]);
  const mergedRegionalSalesRepOptions = Array.from(
    new Map(
      [...adminOrgRegionalSalesRepOptions, ...regionalSalesRepOptions].map((row) => [
        String(row?.email || '').trim().toLowerCase(),
        {
          ...row,
          email: String(row?.email || '').trim().toLowerCase(),
          name: String(row?.name || row?.email || '').trim(),
        },
      ]),
    ).values(),
  )
    .filter((row) => row.email)
    .sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));

  useEffect(() => {
    const loadRegionalSalesReps = async () => {
      if (!(isRegionalManagerView &&
        normalizedManagerRegionCode &&
        normalizedManagerRegionCode !== 'all')) {
        setRegionalSalesRepOptions([]);
        return;
      }

      try {
        const reps = await staffDirectoryService.listSalesRepsByRegion(normalizedManagerRegionCode);
        setRegionalSalesRepOptions(reps);
      } catch (error) {
        console.warn('⚠️ [AdminInquiryManagementNew] load regional sales reps failed:', error);
        setRegionalSalesRepOptions([]);
      }
    };

    void loadRegionalSalesReps();
  }, [isRegionalManagerView, normalizedManagerRegionCode]);

  // Filter logic
  const filteredInquiries = displayInquiries.filter((inquiry) => {
    const matchesSearch = searchTerm === '' || 
      inquiry.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inquiry.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inquiry.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || inquiry.status === filterStatus;
    const matchesRegion = filterRegion === 'all' || inquiry.region === filterRegion;
    const matchesCustomer = filterCustomer === 'all' || inquiry.customer.name === filterCustomer;
    // 🔥 新增：业务员和国家筛选
    const matchesSalesRep =
      filterSalesRep === 'all' ||
      normalizePersonnelEmail(inquiry.ownerEmail || inquiry.salesRepEmail || inquiry.assignedTo, inquiry.region) ===
        normalizePersonnelEmail(filterSalesRep, inquiry.region);
    const matchesCountry = filterCountry === 'all' || inquiry.country === filterCountry;
    const matchesOem = filterOem === 'all' || (filterOem === 'oem_only' ? inquiry.oemEnabled : !inquiry.oemEnabled);
    const matchesOemProcessing = filterOemProcessing === 'all' || inquiry.oemProcessingStatus === filterOemProcessing;
    
    // 🔥 新增：时间段筛选
    let matchesDateRange = true;
    if (filterDateRange !== 'all' && inquiry.date) {
      const inquiryDate = new Date(inquiry.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      switch (filterDateRange) {
        case 'today':
          matchesDateRange = inquiryDate >= today;
          break;
        case 'week':
          const weekAgo = new Date(today);
          weekAgo.setDate(weekAgo.getDate() - 7);
          matchesDateRange = inquiryDate >= weekAgo;
          break;
        case 'month':
          const monthAgo = new Date(today);
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          matchesDateRange = inquiryDate >= monthAgo;
          break;
        case 'quarter':
          const quarterAgo = new Date(today);
          quarterAgo.setMonth(quarterAgo.getMonth() - 3);
          matchesDateRange = inquiryDate >= quarterAgo;
          break;
        case 'year':
          const yearAgo = new Date(today);
          yearAgo.setFullYear(yearAgo.getFullYear() - 1);
          matchesDateRange = inquiryDate >= yearAgo;
          break;
      }
    }
    
    return matchesSearch && matchesFilter && matchesRegion && matchesCustomer && matchesSalesRep && matchesCountry && matchesDateRange && matchesOem && matchesOemProcessing;
  });


  const handleStatusChange = (newStatus: string) => {
    if (!selectedInquiry) return;
    toast.success(`询价 ${selectedInquiry.id} 状态已更新为 ${newStatus}`);
  };

  const handleSendReply = () => {
    if (!replyMessage.trim()) {
      toast.error('请输入回复内容');
      return;
    }
    toast.success('回复已发送');
    setReplyMessage('');
  };

  const handleAssignSalesRep = async (inquiry: any, selectedEmail?: string) => {
    const selectedSalesRepEmail = selectedEmail || salesRepAssignments[inquiry.id] || mergedRegionalSalesRepOptions[0]?.email;
    if (!selectedSalesRepEmail) {
      toast.error('当前区域没有可分配的业务员');
      return;
    }

    const selectedSalesRep = mergedRegionalSalesRepOptions.find((user) => user.email === selectedSalesRepEmail);
    try {
      await internalInquiryAssignmentService.assignToSalesRep({
        inquiryId: inquiry.id,
        inquiryNumber: inquiry.inquiryNumber,
        salesRepEmail: selectedSalesRepEmail,
        salesRepName: selectedSalesRep?.name || '',
      })
      setSalesRepAssignments((prev) => ({ ...prev, [inquiry.id]: selectedSalesRepEmail }));
      const inquiryNumber = String(inquiry.inquiryNumber || inquiry.id || '').trim();
      if (inquiryNumber) {
        setManagerAssignedInquiryNumbers((prev) => new Set(prev).add(inquiryNumber));
      }
      await refreshInquiries().catch(() => {});
      toast.success(`✅ 已分配给业务员：${selectedSalesRep?.name || selectedSalesRepEmail}`);
    } catch (error: any) {
      setSalesRepAssignments((prev) => {
        if (!(inquiry.id in prev)) return prev;
        const next = { ...prev };
        delete next[inquiry.id];
        return next;
      });
      toast.error(error?.message || '分配业务员失败');
    }
  };

  const openInquiryDetail = (inquiry: any) => {
    setSelectedInquiry(inquiry);
    setIsInquiryDetailOpen(true);
  };

  const handleCreateQuotation = () => {
    if (onCreateQuotation && selectedInquiry) {
      onCreateQuotation(selectedInquiry);
    } else {
      toast.success('正在跳转到报价创建页面...');
    }
  };

  const getStatusConfig = (status: string) => {
    const configs: any = {
      draft: { label: '草稿', color: 'bg-slate-100 text-slate-800 border-slate-300' },
      pending: { label: '待处理', color: 'bg-blue-100 text-blue-800 border-blue-300' },
      processing: { label: '处理中', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
      quoted: { label: '已报价', color: 'bg-green-100 text-green-800 border-green-300' },
      approved: { label: '已批准', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
      rejected: { label: '已拒绝', color: 'bg-red-100 text-red-800 border-red-300' },
    };
    return configs[status] || { label: status, color: 'bg-gray-100 text-gray-800 border-gray-300' };
  };

  const getPriorityConfig = (priority: string) => {
    const configs: any = {
      High: { label: '高', color: 'bg-red-100 text-red-800 border-red-300' },
      Medium: { label: '中', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
      Low: { label: '低', color: 'bg-green-100 text-green-800 border-green-300' },
    };
    return configs[priority] || { label: priority, color: 'bg-gray-100 text-gray-800 border-gray-300' };
  };

  // 计算全选状态
  const isAllSelected = filteredInquiries.length > 0 && selectedIds.size === filteredInquiries.length;
  const isSomeSelected = selectedIds.size > 0 && selectedIds.size < filteredInquiries.length;

  useEffect(() => {
    const target = String(highlightInquiryNumber || '').trim();
    if (!target) return;
    const matched = displayInquiries.find((inquiry) => String(inquiry.inquiryNumber || inquiry.id || '').trim() === target);
    if (!matched) return;
    setHighlightedId(String(matched.id));
    const timer = window.setTimeout(() => setHighlightedId(null), 3000);
    return () => window.clearTimeout(timer);
  }, [displayInquiries, highlightInquiryNumber]);

  useEffect(() => {
    const visibleIds = new Set(filteredInquiries.map((inquiry) => inquiry.id));
    setSelectedIds(prev => {
      const next = new Set(Array.from(prev).filter(id => visibleIds.has(id)));
      return next.size !== prev.size ? next : prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredInquiries.length]);

  useEffect(() => {
    let cancelled = false;
    const loadRemotePreference = async () => {
      setInquiryPreferenceHydrated(false);
      const preferenceKey = getInquiryManagementPreferenceKey(filterStatus);
      const cachedValue = readCachedInquiryManagementColumnWidths(
        inquiryPreferenceRoleScope,
        preferenceKey,
      );
      if (cachedValue) {
        setInquiryColumnWidths(mergeStoredInquiryManagementColumnWidths(cachedValue));
        setInquiryHasCustomWidths(true);
      } else {
        setInquiryColumnWidths(INQUIRY_MANAGEMENT_TABLE_DEFAULT_WIDTHS);
        setInquiryHasCustomWidths(false);
      }
      try {
        const value = await sharedRoleUiPreferenceService.get(
          inquiryPreferenceRoleScope,
          preferenceKey,
        );
        if (cancelled) return;
        if (value) {
          writeCachedInquiryManagementColumnWidths(inquiryPreferenceRoleScope, preferenceKey, value);
          setInquiryColumnWidths(
            mergeStoredInquiryManagementColumnWidths(
              value as Partial<Record<InquiryManagementColumnKey, number>>,
            ),
          );
          setInquiryHasCustomWidths(true);
        } else {
          writeCachedInquiryManagementColumnWidths(inquiryPreferenceRoleScope, preferenceKey, null);
          setInquiryColumnWidths(INQUIRY_MANAGEMENT_TABLE_DEFAULT_WIDTHS);
          setInquiryHasCustomWidths(false);
        }
      } catch {
        // Keep the synchronously applied local cache/default widths to avoid tab-switch layout jumps.
      } finally {
        if (!cancelled) setInquiryPreferenceHydrated(true);
      }
    };
    void loadRemotePreference();
    return () => {
      cancelled = true;
    };
  }, [filterStatus, inquiryPreferenceRoleScope]);

  useEffect(() => {
    if (!inquiryHasCustomWidths || !inquiryPreferenceHydrated) return;
    writeCachedInquiryManagementColumnWidths(
      inquiryPreferenceRoleScope,
      getInquiryManagementPreferenceKey(filterStatus),
      inquiryColumnWidths,
    );
    const timer = window.setTimeout(() => {
      void sharedRoleUiPreferenceService.save(
        inquiryPreferenceRoleScope,
        getInquiryManagementPreferenceKey(filterStatus),
        inquiryColumnWidths,
      ).catch(() => {});
    }, 300);
    return () => window.clearTimeout(timer);
  }, [filterStatus, inquiryColumnWidths, inquiryHasCustomWidths, inquiryPreferenceHydrated, inquiryPreferenceRoleScope]);

  useEffect(() => {
    if (!inquiryTableContainerRef.current || typeof ResizeObserver === 'undefined') return;
    const element = inquiryTableContainerRef.current;
    const minContainerWidth = INQUIRY_MANAGEMENT_COLUMN_ORDER.reduce(
      (sum, key) => sum + INQUIRY_MANAGEMENT_COLUMN_MIN_WIDTHS[key],
      0,
    );
    const handleResize = (width: number) => {
      setInquiryTableContainerWidth(Math.max(width, minContainerWidth));
    };
    handleResize(element.clientWidth);
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      handleResize(entry.contentRect.width);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [filterStatus]);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!inquiryColumnResizeRef.current) return;
      const { key, startX, startWidth } = inquiryColumnResizeRef.current;
      const nextWidth = Math.max(
        INQUIRY_MANAGEMENT_COLUMN_MIN_WIDTHS[key],
        Math.round(startWidth + (event.clientX - startX)),
      );
      setInquiryHasCustomWidths(true);
      setInquiryColumnWidths((current) => (
        current[key] === nextWidth ? current : { ...current, [key]: nextWidth }
      ));
    };

    const stopResize = () => {
      inquiryColumnResizeRef.current = null;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', stopResize);
    window.addEventListener('blur', stopResize);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', stopResize);
      window.removeEventListener('blur', stopResize);
    };
  }, []);

  const renderedInquiryColumnWidths = useMemo(
    () => fitInquiryManagementColumnWidthsToContainer(
      inquiryColumnWidths,
      inquiryTableContainerWidth,
    ),
    [inquiryColumnWidths, inquiryTableContainerWidth],
  );

  const getInquiryColumnStyle = (key: InquiryManagementColumnKey) =>
    getColumnStyle(renderedInquiryColumnWidths, key);

  const startInquiryColumnResize = (
    key: InquiryManagementColumnKey,
    event: React.MouseEvent<HTMLDivElement>,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    setInquiryHasCustomWidths(true);
    inquiryColumnResizeRef.current = {
      key,
      startX: event.clientX,
      startWidth: renderedInquiryColumnWidths[key],
    };
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  const shrinkInquiryColumnToMinimum = (
    key: InquiryManagementColumnKey,
    event: React.MouseEvent<HTMLDivElement>,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    setInquiryHasCustomWidths(true);
    setInquiryColumnWidths((current) => (
      current[key] === INQUIRY_MANAGEMENT_COLUMN_MIN_WIDTHS[key]
        ? current
        : { ...current, [key]: INQUIRY_MANAGEMENT_COLUMN_MIN_WIDTHS[key] }
    ));
  };

  const renderInquiryColumnResizeHandle = (key: InquiryManagementColumnKey) =>
    renderColumnResizeHandle(
      key,
      startInquiryColumnResize,
      shrinkInquiryColumnToMinimum,
      { lineHoverClassName: 'group-hover:bg-slate-400' },
    );

  const renderInquiryHeaderCell = (
    key: InquiryManagementColumnKey,
    label: string,
    className = '',
  ) => {
    const alignClass = className.includes('text-right')
      ? 'justify-end text-right'
      : className.includes('text-center')
        ? 'justify-center text-center'
        : 'justify-start text-left';
    return (
      <TableHead
        className={`group relative overflow-hidden px-3 py-3 align-middle ${className}`.trim()}
        style={getInquiryColumnStyle(key)}
      >
        <div className={`flex min-h-5 w-full items-center pr-4 ${alignClass}`}>
          <span className="block break-words whitespace-normal text-[13px] font-semibold leading-4 tracking-[0.01em]">
            {label}
          </span>
        </div>
        {renderInquiryColumnResizeHandle(key)}
      </TableHead>
    );
  };

  return (
    <div className="flex flex-1 min-h-0 flex-col space-y-4">
      {/* 🎨 业务统计 */}
      {currentUserRole !== 'Sales_Rep' && (
        <div className="bg-white border border-gray-300 rounded">
          <div className="px-5 py-3 border-b border-gray-200 bg-gray-50">
            <h3 className="font-semibold text-gray-700 uppercase tracking-wide" style={{ fontSize: '14px' }}>业务统计</h3>
          </div>
          <div className="px-5 py-3 flex items-center gap-8" style={{ fontSize: '12px' }}>
            <div className="flex items-center gap-2">
              <span className="text-gray-600">总询价数:</span>
              <span className="font-semibold text-gray-900">{displayInquiries.length}</span>
            </div>
            <div className="w-px h-4 bg-gray-300" />
            <div className="flex items-center gap-2">
              <span className="text-gray-600">待处理:</span>
              <span className="font-semibold text-gray-900">{displayInquiries.filter(i => i.status === 'pending').length}</span>
            </div>
            <div className="w-px h-4 bg-gray-300" />
            <div className="flex items-center gap-2">
              <span className="text-gray-600">处理中:</span>
              <span className="font-semibold text-gray-900">{displayInquiries.filter(i => i.status === 'processing').length}</span>
            </div>
            <div className="w-px h-4 bg-gray-300" />
            <div className="flex items-center gap-2">
              <span className="text-gray-600">OEM:</span>
              <span className="font-semibold text-indigo-700">{displayInquiries.filter(i => i.oemEnabled).length}</span>
            </div>
            <div className="w-px h-4 bg-gray-300" />
            <div className="flex items-center gap-2">
              <span className="text-gray-600">已报价:</span>
              <span className="font-semibold text-orange-600">{displayInquiries.filter(i => i.status === 'quoted').length}</span>
            </div>
            <div className="w-px h-4 bg-gray-300" />
            <div className="flex items-center gap-2">
              <span className="text-gray-600">完成率:</span>
              <span className="font-semibold text-gray-900">
                {displayInquiries.length > 0 
                  ? Math.round((displayInquiries.filter(i => i.status === 'quoted').length / displayInquiries.length) * 100) 
                  : 0}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 询价表格 */}
      <div className="flex flex-1 min-h-0 w-full max-w-full flex-col overflow-visible rounded-xl border border-slate-200 bg-white shadow-sm min-h-[calc(100dvh-360px)]">
        <div className="border-b border-slate-200 bg-slate-50/70">
          {/* 🎯 紧凑型单行筛选栏 */}
          <div className="px-5 py-4">
            <div className="flex flex-wrap gap-2.5 items-center">
              {/* 搜索框 */}
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="搜索询价单号、客户名称或主题..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-9 rounded-xl border-slate-200 bg-white pl-10 text-sm shadow-sm"
                />
              </div>

              {/* 🔥 批量删除按钮 */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkDelete}
                disabled={selectedIds.size === 0}
                style={ERP_LIST_DELETE_BUTTON_STYLE}
                className={ERP_LIST_DELETE_BUTTON_CLASS}
              >
                批量删除 {selectedIds.size > 0 && `(${selectedIds.size})`}
              </Button>

              {/* 状态筛选 */}
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className={`h-9 w-[130px] rounded-xl border-slate-200 bg-white shadow-sm ${ERP_LIST_UI_SPEC_V1.buttonTextClass}`}>
                  <SelectValue placeholder="全部状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" style={{ fontSize: '14px' }}>全部状态</SelectItem>
                  <SelectItem value="pending" style={{ fontSize: '14px' }}>待处理</SelectItem>
                  <SelectItem value="processing" style={{ fontSize: '14px' }}>处理中</SelectItem>
                  <SelectItem value="quoted" style={{ fontSize: '14px' }}>已报价</SelectItem>
                  <SelectItem value="rejected" style={{ fontSize: '14px' }}>已拒绝</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterOem} onValueChange={setFilterOem}>
                <SelectTrigger className={`h-9 w-[120px] rounded-xl border-slate-200 bg-white shadow-sm ${ERP_LIST_UI_SPEC_V1.buttonTextClass}`}>
                  <SelectValue placeholder="OEM筛选" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" style={{ fontSize: '14px' }}>全部OEM</SelectItem>
                  <SelectItem value="oem_only" style={{ fontSize: '14px' }}>仅OEM</SelectItem>
                  <SelectItem value="non_oem" style={{ fontSize: '14px' }}>非OEM</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterOemProcessing} onValueChange={setFilterOemProcessing}>
                <SelectTrigger className={`h-9 w-[150px] rounded-xl border-slate-200 bg-white shadow-sm ${ERP_LIST_UI_SPEC_V1.buttonTextClass}`}>
                  <SelectValue placeholder="OEM处理状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" style={{ fontSize: '14px' }}>全部OEM状态</SelectItem>
                  {uniqueOemProcessingStatuses.map((status) => (
                    <SelectItem key={status} value={status as string} style={{ fontSize: '14px' }}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* 🎯 老板角色显示额外筛选维度 */}
              {(currentUserRole === 'Boss' || currentUserRole === 'CEO' || currentUserRole === 'Sales_Director') && (
                <>
                  {/* 区域筛选 */}
                  <Select value={filterRegion} onValueChange={setFilterRegion}>
                    <SelectTrigger className="h-9 w-[120px] rounded-xl border-slate-200 bg-white text-sm shadow-sm">
                      <SelectValue placeholder="全部区域" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" style={{ fontSize: '14px' }}>全部区域</SelectItem>
                      <SelectItem value="North America" style={{ fontSize: '14px' }}>北美区域</SelectItem>
                      <SelectItem value="South America" style={{ fontSize: '14px' }}>南美区域</SelectItem>
                      <SelectItem value="Europe & Africa" style={{ fontSize: '14px' }}>欧非区域</SelectItem>
                      <SelectItem value="Other" style={{ fontSize: '14px' }}>其它区域</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* 客户筛选 */}
                  <Select value={filterCustomer} onValueChange={setFilterCustomer}>
                    <SelectTrigger className="h-9 w-[140px] rounded-xl border-slate-200 bg-white text-sm shadow-sm">
                      <SelectValue placeholder="全部客户" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" style={{ fontSize: '14px' }}>全部客户</SelectItem>
                      {uniqueCustomers.slice(0, 30).map((customer) => (
                        <SelectItem key={customer} value={customer as string} style={{ fontSize: '14px' }}>
                          {customer}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </>
              )}
              
              {/* 🔥 新增：区域主管显示业务员和国家筛选 */}
              {currentUserRole === 'Regional_Manager' && (
                <>
                  {/* 业务员筛选 */}
                  <Select value={filterSalesRep} onValueChange={setFilterSalesRep}>
                    <SelectTrigger className="h-9 w-[140px] rounded-xl border-slate-200 bg-white text-sm shadow-sm">
                      <SelectValue placeholder="全部业务员" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" style={{ fontSize: '14px' }}>全部业务员</SelectItem>
                      {uniqueSalesReps.map((salesRep) => (
                        <SelectItem key={salesRep} value={salesRep as string} style={{ fontSize: '14px' }}>
                          {salesRep}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {/* 国家筛选 */}
                  {uniqueCountries.length > 0 && (
                    <Select value={filterCountry} onValueChange={setFilterCountry}>
                      <SelectTrigger className="h-9 w-[120px] rounded-xl border-slate-200 bg-white text-sm shadow-sm">
                        <SelectValue placeholder="全部国家" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all" style={{ fontSize: '14px' }}>全部国家</SelectItem>
                        {uniqueCountries.map((country) => (
                          <SelectItem key={country} value={country as string} style={{ fontSize: '14px' }}>
                            {country}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  
                  {/* 🔥 时间段筛选 */}
                  <Select value={filterDateRange} onValueChange={setFilterDateRange}>
                    <SelectTrigger className="h-9 w-[110px] rounded-xl border-slate-200 bg-white text-sm shadow-sm">
                      <SelectValue placeholder="全部时间" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" style={{ fontSize: '14px' }}>全部时间</SelectItem>
                      <SelectItem value="today" style={{ fontSize: '14px' }}>今天</SelectItem>
                      <SelectItem value="week" style={{ fontSize: '14px' }}>近7天</SelectItem>
                      <SelectItem value="month" style={{ fontSize: '14px' }}>近1月</SelectItem>
                      <SelectItem value="quarter" style={{ fontSize: '14px' }}>近3月</SelectItem>
                      <SelectItem value="year" style={{ fontSize: '14px' }}>近1年</SelectItem>
                    </SelectContent>
                  </Select>
                </>
              )}
            </div>
          </div>
        </div>

        <div ref={inquiryTableContainerRef} className="w-full max-w-full flex-1 min-h-0 overflow-x-auto overflow-y-visible bg-white rounded-[inherit]">
          <Table className="table-fixed border-collapse" style={{ width: '100%', maxWidth: '100%' }}>
            <colgroup>
              {INQUIRY_MANAGEMENT_COLUMN_ORDER.map((key) => (
                <col key={key} style={getInquiryColumnStyle(key)} />
              ))}
            </colgroup>
            <TableHeader>
              <TableRow className="border-b border-slate-200 bg-white">
                <TableHead className="group relative overflow-hidden px-0 py-3 align-middle" style={getInquiryColumnStyle('select')}>
                  <div className="flex items-center justify-center pr-4">
                    <Checkbox
                      checked={isAllSelected}
                      onCheckedChange={handleSelectAll}
                      aria-label="全选"
                    />
                  </div>
                  {renderInquiryColumnResizeHandle('select')}
                </TableHead>
                <TableHead className="group relative overflow-hidden px-0 py-3 align-middle" style={getInquiryColumnStyle('index')}>
                  <div className="flex items-center justify-center pr-4">
                    <span className="text-[13px] font-semibold leading-4 tracking-[0.01em] text-slate-700">序号</span>
                  </div>
                  {renderInquiryColumnResizeHandle('index')}
                </TableHead>
                {renderInquiryHeaderCell('date', '日期', 'text-center')}
                {renderInquiryHeaderCell('inquiryNo', '询价单号')}
                {renderInquiryHeaderCell('customer', '客户信息')}
                {renderInquiryHeaderCell('subject', '主题')}
                {renderInquiryHeaderCell('priority', '优先级', 'text-center')}
                {renderInquiryHeaderCell('status', '状态', 'text-center')}
                {renderInquiryHeaderCell('oem', 'OEM', 'text-center')}
                {renderInquiryHeaderCell('actions', '操作', 'text-center')}
              </TableRow>
            </TableHeader>
            <TableBody className="border-b border-slate-200/90">
              {filteredInquiries.map((inquiry, index) => {
                const statusConfig = getStatusConfig(inquiry.status);
                const priorityConfig = getPriorityConfig(inquiry.priority);
                const persistedAssignedSalesRepEmail = normalizePersonnelEmail(
                  inquiry.salesRepEmail || inquiry.ownerEmail || inquiry.assignedTo,
                  inquiry.region,
                ) || '';
                const assignedSalesRepEmail = String(
                  salesRepAssignments[inquiry.id] ||
                  persistedAssignedSalesRepEmail ||
                  '',
                ).trim().toLowerCase();
                const inquiryNumber = String(inquiry.inquiryNumber || inquiry.id || '').trim();
                const hasPersistedSalesRepAssignment = Boolean(persistedAssignedSalesRepEmail) &&
                  !isAwaitingRegionalManagerDispatch(inquiry);
                const hasManualAssignment = Boolean(assignedSalesRepEmail) && (
                  Boolean(salesRepAssignments[inquiry.id]) ||
                  managerAssignedInquiryNumbers.has(inquiryNumber)
                );
                const assignmentDisplayMode: 'manual' | 'history' | 'unassigned' = hasManualAssignment
                  ? 'manual'
                  : hasPersistedSalesRepAssignment
                    ? 'history'
                    : 'unassigned';
                const assignmentButtonClassName = assignmentDisplayMode === 'manual'
                  ? 'bg-slate-300 text-slate-600 hover:bg-slate-400'
                  : assignmentDisplayMode === 'history'
                    ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    : 'bg-orange-600 text-white hover:bg-orange-700';
                const assignmentButtonLabel = assignmentDisplayMode === 'manual'
                  ? '已分配'
                  : assignmentDisplayMode === 'history'
                    ? '历史归属'
                    : '分配';
                
                const qrs = getQuotationRequestsByInquiry(inquiry.id);
                const hasXJ = qrs.length > 0;
                const inquiryNumberOrId = String(inquiry.inquiryNumber || inquiry.id || '').trim();
                const hasQR = hasXJ || quoteRequirements.some((qr) =>
                  String(qr?.sourceInquiryNumber || '').trim() === inquiryNumberOrId ||
                  String(qr?.sourceInquiryId || '').trim() === String(inquiry.id || '').trim()
                );
                
                const isSelected = selectedIds.has(inquiry.id);
                
                const isHighlighted = highlightedId === String(inquiry.id);
                return (
                  <TableRow key={inquiry.id} className={`border-b border-slate-200/90 hover:bg-slate-50/70 ${isSelected ? 'bg-blue-50' : ''} ${isHighlighted ? 'bg-yellow-100 border-2 border-yellow-400 shadow-lg' : ''}`}>
                    <TableCell className="py-4" style={getInquiryColumnStyle('select')}>
                      <div className="flex items-center justify-center pr-4">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => handleSelectOne(inquiry.id, checked as boolean)}
                          aria-label={`选择 ${inquiry.id}`}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="py-4" style={getInquiryColumnStyle('index')}>
                      <div className="flex items-center justify-center pr-4">
                        <span className="text-[12px] text-slate-500">{index + 1}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4 text-center" style={getInquiryColumnStyle('date')}>
                      <div className="space-y-1 text-slate-900">
                        <div>
                          <span className="mr-1 text-[12px] text-slate-500">创</span>
                          <span className="text-[12px] font-medium text-slate-900">
                            {formatInquiryManagementDateOnly(
                              inquiry.createdDate ||
                              inquiry.createdAt ||
                              inquiry.created_at ||
                              inquiry.date
                            )}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-4 overflow-hidden" style={getInquiryColumnStyle('inquiryNo')}>
                      <button
                        className="text-[12px] font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer transition-colors"
                        onClick={() => openInquiryDetail(inquiry)}
                      >
                        {inquiry.inquiryNumber || inquiry.id}
                      </button>
                    </TableCell>
                    <TableCell className="py-4 overflow-hidden" style={getInquiryColumnStyle('customer')}>
                      <div>
                        <p className="text-[12px] font-semibold text-slate-900">{inquiry.customer.name}</p>
                        <p className="text-[12px] text-slate-500">{inquiry.customer.email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="py-4 overflow-hidden" style={getInquiryColumnStyle('subject')}>
                      <p className="break-words text-[12px] text-slate-700">{inquiry.subject}</p>
                    </TableCell>
                    <TableCell className="py-4 text-center" style={getInquiryColumnStyle('priority')}>
                      <Badge className={`h-5 px-2 text-[12px] border ${priorityConfig.color}`}>
                        {priorityConfig.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-4 text-center" style={getInquiryColumnStyle('status')}>
                      <Badge className={`h-5 px-2 text-[12px] border ${statusConfig.color}`}>
                        {statusConfig.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-4 text-center" style={getInquiryColumnStyle('oem')}>
                      {inquiry.oemEnabled ? (
                        <div className="flex flex-col gap-1">
                          <Badge className="h-5 w-fit px-2 text-[12px] border bg-indigo-100 text-indigo-800 border-indigo-300">
                            OEM
                          </Badge>
                          <Badge className="h-5 w-fit px-2 text-[12px] border bg-slate-100 text-slate-700 border-slate-300">
                            {inquiry.oemProcessingStatus}
                          </Badge>
                        </div>
                      ) : (
                        <span className="text-[12px] text-slate-400">-</span>
                      )}
                    </TableCell>
                    <TableCell className="py-4 text-center" style={getInquiryColumnStyle('actions')}>
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={() => openInquiryDetail(inquiry)}
                        >
                          查看
                        </Button>
                        
                        {!isRegionalManagerView && (
                          hasQR ? (
                            <Button
                              size="sm"
                              className="h-7 px-2 text-xs bg-gray-300 text-gray-500 cursor-not-allowed"
                              disabled
                            >
                              已下推成本询报
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              className="h-7 px-2 text-xs bg-green-600 hover:bg-green-700"
                              disabled={pushingInquiryId === inquiry.id}
                              onClick={() => handlePushToCostInquiry(inquiry)}
                            >
                              {pushingInquiryId === inquiry.id ? '下推中...' : '下推成本询报'}
                            </Button>
                          )
                        )}
                        {isRegionalManagerView && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                size="sm"
                                className={`h-8 px-3 text-xs ${assignmentButtonClassName}`}
                                disabled={mergedRegionalSalesRepOptions.length === 0}
                              >
                                {mergedRegionalSalesRepOptions.length === 0
                                  ? '加载中'
                                  : assignmentButtonLabel}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="center" side="bottom" className="w-[280px]">
                              <DropdownMenuLabel className="text-xs text-slate-500">
                                选择本区域业务员
                              </DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuRadioGroup
                                value={assignedSalesRepEmail}
                                onValueChange={() => {}}
                              >
                                {mergedRegionalSalesRepOptions.map((salesRep) => (
                                  <DropdownMenuRadioItem
                                    key={salesRep.email}
                                    value={salesRep.email}
                                    className="text-xs"
                                    onSelect={() => {
                                      void handleAssignSalesRep(inquiry, salesRep.email);
                                    }}
                                  >
                                    {salesRep.name} ({salesRep.email})
                                  </DropdownMenuRadioItem>
                                ))}
                              </DropdownMenuRadioGroup>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      {isInquiryDetailOpen && selectedInquiry && (
        <StandardDocumentViewerShell
          open={isInquiryDetailOpen}
          onClose={() => setIsInquiryDetailOpen(false)}
          title="客户询价单"
          subtitle={String(selectedInquiry?.inquiryNumber || selectedInquiry?.id || '')}
          templateLabel={
            selectedInquiry?.templateSnapshot?.version ||
            selectedInquiry?.template_snapshot?.version ||
            '未绑定'
          }
          icon={<FileText className="h-6 w-6" />}
          actions={
            <>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={async () => {
                  if (!inquiryPreviewRef.current) return;
                  const filename = generatePDFFilename(
                    'Inquiry',
                    String(selectedInquiry?.inquiryNumber || selectedInquiry?.id || 'ING'),
                  );
                  await exportToPDF(inquiryPreviewRef.current, filename);
                }}
              >
                <FileText className="h-4 w-4" />
                下载PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={async () => {
                  if (!inquiryPreviewRef.current) return;
                  document.body.classList.add('printing-inq');
                  const filename = generatePDFFilename(
                    'Inquiry',
                    String(selectedInquiry?.inquiryNumber || selectedInquiry?.id || 'ING'),
                  );
                  await exportToPDFPrint(inquiryPreviewRef.current, filename);
                  window.setTimeout(() => {
                    document.body.classList.remove('printing-inq');
                  }, 1000);
                }}
              >
                <FileText className="h-4 w-4" />
                打印
              </Button>
            </>
          }
          bodyClassName="flex-1 overflow-auto bg-gray-100 p-6"
          innerClassName="mx-auto w-full max-w-[210mm] space-y-6"
        >
          <div ref={inquiryPreviewRef}>
            <CustomerInquiryView
              inquiry={selectedInquiry}
              audience="internal"
              onUpdateInquiry={async (patch) => {
                await updateInquiry(selectedInquiry.id, patch);
                setSelectedInquiry((prev: any) => (prev ? { ...prev, ...patch } : prev));
              }}
            />
          </div>
        </StandardDocumentViewerShell>
      )}
      
      {/* 🔥 报价请求对话框 */}
      <CreateQuotationRequestDialog
        open={showXJDialog}
        onClose={() => {
          setShowXJDialog(false);
          setXJInquiry(null);
        }}
        inquiry={xjInquiry}
      />
    </div>
  );
}
