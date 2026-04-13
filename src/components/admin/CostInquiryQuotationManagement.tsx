import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Checkbox } from '../ui/checkbox';
import { Search, Filter, Eye, Send, CheckCircle, AlertCircle, Package, FileText, Trash2, Plus, HelpCircle, Clock, TrendingUp, X, RefreshCw } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { emitErpEvent } from '../../lib/erp-core/event-bus';
import { ERP_EVENT_KEYS } from '../../lib/erp-core/events';
import { SubmitToProcurementDialog } from './SubmitToProcurementDialog';
import QuoteCreationIntelligent from './QuoteCreationIntelligent'; // 🔥 智能报价创建
import { useQuoteRequirements } from '../../contexts/QuoteRequirementContext';
import { useInquiry } from '../../contexts/InquiryContext';
import { useSalesQuotations } from '../../contexts/SalesQuotationContext'; // 🔥 新增：销售报价Context
import { nextQRNumber, nextQTNumber } from '../../utils/xjNumberGenerator'; // 🔥 新增：生成QT/QR编号
import { buildIdentityPersistenceFields, getCurrentUser } from '../../utils/dataIsolation';
import { salesQuotationService, quoteRequirementService, sharedRoleUiPreferenceService } from '../../lib/supabaseService';
import { supabase, supabaseAnonKey, supabaseUrl } from '../../lib/supabase';
import { getLocalAdminAuth } from '../../lib/internalAdminLocalAuth';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { formatDocumentNumber, getDocumentLevel, getDocumentColorClass } from '../../utils/documentNumbering'; // 🔥 新增：7级编号体系辅助函数
import { sortDocumentFlowRefs } from '../../utils/documentFlowRefOrder';
import {
  buildBilingualTradingRequirementsText,
  buildCommercialTermsSnapshotFromInquiry,
  buildCustomerRequirementsSnapshot,
  buildProcurementRequestNotes,
  DEFAULT_DOWNSTREAM_VISIBILITY,
  findRelatedInquiryForProcurementDoc,
  hydrateProcurementRequirementWithInquiry,
} from '../../utils/procurementRequestContext';
import {
  type QuoteRequirementDocumentData,
} from '../documents/templates/QuoteRequirementDocument';
import { QuoteRequirementDocumentA4Pages } from '../documents/templates/paginated/QuoteRequirementDocumentA4';
import { buildQuoteRequirementDocumentSnapshot } from './purchase-order/purchaseOrderUtils';
import { adaptSalesQuotationToDocumentData, normalizeFlowProductCore } from '../../utils/documentDataAdapters';
import { getFormalBusinessModelNo } from '../../utils/productModelDisplay';
import { normalizePersonnelEmail } from '../../lib/notification-rules';
import { sanitizeQuoteRequirementDocumentForSales } from '../../utils/purchaserFeedbackSanitizer';
import { isSystemOwnerEmail, pickBusinessOwnerEmail, resolveInquirySalesOwner, resolveOwnerName } from '../../utils/quotationOwnership';
import { exportToPDF, exportToPDFPrint, generatePDFFilename } from '../../utils/pdfExport';
import { ProcurementDocumentViewerShell } from './purchase-order/ProcurementDocumentViewerShell';
import { getColumnStyle, renderColumnResizeHandle } from './admin-organization-profile/peopleCenterVisuals';
import {
  ERP_LIST_DELETE_BUTTON_CLASS,
  ERP_LIST_DELETE_BUTTON_STYLE,
  ERP_LIST_UI_SPEC_V1,
} from '../shared/erpListUiSpec';
import {
  isQrLikeNumber,
  matchesNormalizedQrNumber,
  normalizeLegacyQrNumber,
} from '../../utils/quoteRequirementNumber';

type TabType = 'all' | 'pending' | 'partial' | 'processing' | 'completed';
type CostInquiryColumnKey =
  | 'select'
  | 'index'
  | 'qrNo'
  | 'product'
  | 'createdAt'
  | 'feedback'
  | 'status'
  | 'actions';

const COST_INQUIRY_TABLE_UI_PREFERENCE_PREFIX = 'sales_cost_inquiry_table_column_widths';
const COST_INQUIRY_COLUMN_ORDER: CostInquiryColumnKey[] = [
  'select',
  'index',
  'createdAt',
  'qrNo',
  'product',
  'feedback',
  'status',
  'actions',
];
const COST_INQUIRY_COLUMN_MIN_WIDTHS: Record<CostInquiryColumnKey, number> = {
  select: 44,
  index: 56,
  qrNo: 208,
  product: 178,
  createdAt: 98,
  feedback: 126,
  status: 96,
  actions: 164,
};
const COST_INQUIRY_TABLE_DEFAULT_WIDTHS: Record<CostInquiryColumnKey, number> = {
  select: 52,
  index: 72,
  qrNo: 272,
  product: 208,
  createdAt: 112,
  feedback: 140,
  status: 110,
  actions: 180,
};

const normalizeCostInquiryPreferenceRole = (role?: string | null) => {
  const normalized = String(role || '').trim();
  return normalized || 'Sales_Rep';
};

const getCostInquiryPreferenceKey = (tab: TabType) =>
  `${COST_INQUIRY_TABLE_UI_PREFERENCE_PREFIX}:${tab}:v1`;

const getCostInquiryLocalPreferenceCacheKey = (scope: string, key: string) =>
  `cost_inquiry_table_pref_cache:${scope}:${key}`;

const readCachedCostInquiryColumnWidths = (
  scope: string,
  key: string,
): Partial<Record<CostInquiryColumnKey, number>> | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(getCostInquiryLocalPreferenceCacheKey(scope, key));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const writeCachedCostInquiryColumnWidths = (
  scope: string,
  key: string,
  value: Partial<Record<CostInquiryColumnKey, number>> | null,
) => {
  if (typeof window === 'undefined') return;
  try {
    const cacheKey = getCostInquiryLocalPreferenceCacheKey(scope, key);
    if (value) {
      window.localStorage.setItem(cacheKey, JSON.stringify(value));
    } else {
      window.localStorage.removeItem(cacheKey);
    }
  } catch {
    // noop
  }
};

const mergeStoredCostInquiryColumnWidths = (
  stored: Partial<Record<CostInquiryColumnKey, number>> | null | undefined,
) => {
  const next = { ...COST_INQUIRY_TABLE_DEFAULT_WIDTHS };
  COST_INQUIRY_COLUMN_ORDER.forEach((key) => {
    const candidate = Number(stored?.[key]);
    if (Number.isFinite(candidate) && candidate > 0) {
      next[key] = Math.max(COST_INQUIRY_COLUMN_MIN_WIDTHS[key], Math.round(candidate));
    }
  });
  return next;
};

const formatCostInquiryDateOnly = (value?: string | null) => {
  const text = String(value || '').trim();
  if (!text) return '-';
  return text.includes('T') ? text.slice(0, 10) : text;
};
interface CostInquiryQuotationManagementProps {
  onSwitchToQuotationManagement?: (qtNumber: string) => void; // 🔥 切换到报价管理并高亮指定单号
  onNavigateToInquiryManagementWithHighlight?: (inquiryNumber: string) => void;
  highlightQrNumber?: string;
  viewerRole?: string;
  forceDesensitizePreview?: boolean;
}

export function CostInquiryQuotationManagement({
  onSwitchToQuotationManagement,
  onNavigateToInquiryManagementWithHighlight,
  highlightQrNumber,
  viewerRole,
  forceDesensitizePreview,
}: CostInquiryQuotationManagementProps = {}) {
  const costInquiryColumnResizeRef = React.useRef<{
    key: CostInquiryColumnKey;
    startX: number;
    startWidth: number;
  } | null>(null);
  const { inquiries } = useInquiry();
  const quoteRequirementContext = useQuoteRequirements();
  const quoteRequirements = quoteRequirementContext.requirements;
  const addQuoteRequirement = quoteRequirementContext.addRequirement;
  const updateQuoteRequirement = quoteRequirementContext.updateRequirement;
  const deleteQuoteRequirement = quoteRequirementContext.deleteRequirement;
  const refreshQuoteRequirementsFromApi = quoteRequirementContext.refreshQuoteRequirementsFromApi;
  const [currentUser, setCurrentUser] = useState<any>(() => getCurrentUser());
  const [refreshing, setRefreshing] = useState(false);
  
  // 🔥 新增：销售报价Context
  const { addQuotation: addSalesQuotation, updateQuotation: updateSalesQuotation, quotations: allSalesQuotations } = useSalesQuotations();

  useEffect(() => {
    const syncCurrentUser = () => setCurrentUser(getCurrentUser());
    syncCurrentUser();
    window.addEventListener('userChanged', syncCurrentUser as EventListener);
    window.addEventListener('storage', syncCurrentUser);
    return () => {
      window.removeEventListener('userChanged', syncCurrentUser as EventListener);
      window.removeEventListener('storage', syncCurrentUser);
    };
  }, []);

  const [filterStatus, setFilterStatus] = useState<TabType>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false); // 🔥 查看采购需求单详情（客户询价单内容）
  const [showSubmitDialog, setShowSubmitDialog] = useState(false); // 🔥 提交采购弹窗
  const [selectedQR, setSelectedQR] = useState<any>(null);
  const [expandedRelatedIds, setExpandedRelatedIds] = useState<string[]>([]);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [selectedINQ, setSelectedINQ] = useState<any>(null);
  const qrPreviewRef = useRef<HTMLDivElement | null>(null);
  const [previewDocumentData, setPreviewDocumentData] = useState<QuoteRequirementDocumentData | null>(null);
  
  // 🔥 批量选择和删除状态
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // 🔥 智能报价创建弹窗状态
  const [showQuoteCreation, setShowQuoteCreation] = useState(false);
  const [selectedQRForQuote, setSelectedQRForQuote] = useState<any>(null);
  const [pushingQrId, setPushingQrId] = useState<string | null>(null);
  const [pushStartedAt, setPushStartedAt] = useState<number | null>(null);
  const [pushUiNow, setPushUiNow] = useState<number>(() => Date.now());
  const [costInquiryColumnWidths, setCostInquiryColumnWidths] = useState<Record<CostInquiryColumnKey, number>>(() => {
    const initialScope = normalizeCostInquiryPreferenceRole(viewerRole);
    const initialKey = getCostInquiryPreferenceKey('all');
    return mergeStoredCostInquiryColumnWidths(
      readCachedCostInquiryColumnWidths(initialScope, initialKey),
    );
  });
  const [costInquiryHasCustomWidths, setCostInquiryHasCustomWidths] = useState(() => {
    const initialScope = normalizeCostInquiryPreferenceRole(viewerRole);
    const initialKey = getCostInquiryPreferenceKey('all');
    return Boolean(readCachedCostInquiryColumnWidths(initialScope, initialKey));
  });
  const [costInquiryPreferenceHydrated, setCostInquiryPreferenceHydrated] = useState(false);
  const pushWatchdogRef = useRef<number | null>(null);
  const pushUiTickRef = useRef<number | null>(null);
  const resolvedCurrentUserRole = viewerRole || currentUser?.role || currentUser?.userRole;
  const costInquiryPreferenceRoleScope = useMemo(
    () => normalizeCostInquiryPreferenceRole(resolvedCurrentUserRole),
    [resolvedCurrentUserRole],
  );
  const previewSanitizeRole = forceDesensitizePreview ? 'Sales_Rep' : viewerRole === 'Sales_Rep' ? 'Sales_Rep' : resolvedCurrentUserRole;

  const resolveQuotationOwner = React.useCallback((qr: any) => {
    const relatedInquiry = qr?.sourceInquiry || findRelatedInquiryForProcurementDoc(qr, inquiries);
    const ownerRegion = qr?.region || relatedInquiry?.region;
    const normalizedCurrentEmail = normalizePersonnelEmail(currentUser?.email, ownerRegion);
    const ownerCandidates = [
      qr?.requestedBy,
      relatedInquiry?.salesRepEmail,
      relatedInquiry?.assignedTo,
      qr?.sourceInquiry?.salesRepEmail,
      qr?.sourceInquiry?.assignedTo,
      qr?.salesPerson,
      qr?.salesPersonEmail,
      qr?.createdBy,
    ];
    const ownerEmail = pickBusinessOwnerEmail(ownerCandidates, ownerRegion, normalizedCurrentEmail);
    const ownerName = resolveOwnerName(
      ownerEmail,
      [
        qr?.requestedByName,
        relatedInquiry?.salesRepName,
        qr?.sourceInquiry?.salesRepName,
        qr?.salesPersonName,
        ownerEmail === normalizedCurrentEmail ? currentUser?.name : '',
      ],
      ownerRegion,
      currentUser?.name || '',
    );

    return {
      email: ownerEmail || currentUser?.email || '',
      name: ownerName || currentUser?.name || '',
    };
  }, [currentUser, inquiries]);

  const resolveInquiryOwnerForQrCreation = React.useCallback((inq: any) => {
    const inquiryOwner = resolveInquirySalesOwner(inq, currentUser);
    if (inquiryOwner.email && !isSystemOwnerEmail(inquiryOwner.email, inq?.region)) {
      return inquiryOwner;
    }

    return {
      email: normalizePersonnelEmail(currentUser?.email, inq?.region) || currentUser?.email || '',
      name: currentUser?.name || '',
    };
  }, [currentUser]);

  useEffect(() => {
    if (!showViewModal || !selectedQR) return;
    const relatedInquiry = findRelatedInquiryForProcurementDoc(selectedQR, inquiries);
    const requirementForView = hydrateProcurementRequirementWithInquiry(selectedQR, relatedInquiry);
    const nextData = buildQuoteRequirementDocumentSnapshot(requirementForView, previewSanitizeRole);
    setPreviewDocumentData(nextData);
  }, [showViewModal, selectedQR, inquiries, previewSanitizeRole]);

  const getFloatingPanelHeight = (topPx: number, bottomMarginPx: number, minHeightPx: number) => {
    if (typeof window === 'undefined') {
      return minHeightPx;
    }
    return Math.max(minHeightPx, window.innerHeight - topPx - bottomMarginPx);
  };

  const getFloatingPanelWidth = (desiredWidthPx: number, viewportMarginPx: number, minWidthPx: number) => {
    if (typeof window === 'undefined') {
      return desiredWidthPx;
    }
    return Math.max(
      minWidthPx,
      Math.min(desiredWidthPx, window.innerWidth - viewportMarginPx * 2),
    );
  };
  
  const persistQuotationPushState = async (qr: any, qtNumber: string) => {
    const pushTimestamp = new Date().toISOString();
    await updateQuoteRequirement(qr.id, {
      pushedToQuotation: true,
      pushedToQuotationDate: pushTimestamp,
      pushedBy: currentUser?.email || '',
      quotationNumber: qtNumber,
    });
    await refreshQuoteRequirementsFromApi();
  };

  const withTimeout = async <T,>(task: Promise<T>, timeoutMs: number, message: string): Promise<T> => {
    return await Promise.race([
      task,
      new Promise<T>((_, reject) => {
        window.setTimeout(() => reject(new Error(message)), timeoutMs);
      }),
    ]);
  };

  const pushSalesQuotationViaServer = async (quotation: any) => {
    const localAdminAuth = getLocalAdminAuth();
    const execute = async (token?: string | null) => {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        apikey: supabaseAnonKey,
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), 15000);
      try {
        return await fetch(`${supabaseUrl}/functions/v1/make-server-880fd43b/auth/push-sales-quotation`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            quotation,
            localAdminAuth: localAdminAuth.enabled
              ? {
                  email: localAdminAuth.email,
                  password: localAdminAuth.password,
                }
              : null,
          }),
          signal: controller.signal,
        });
      } finally {
        window.clearTimeout(timeoutId);
      }
    };

    const {
      data: { session },
    } = await supabase.auth.getSession();

    let response: Response;
    try {
      response = await execute(session?.access_token || null);
    } catch (error: any) {
      const rawMessage = String(error?.message || error || '').trim();
      const normalizedMessage = rawMessage.toLowerCase();
      if (error?.name === 'AbortError') {
        throw new Error('服务端下推报价管理超时，请重试');
      }
      if (normalizedMessage === 'load failed' || normalizedMessage.includes('failed to fetch')) {
        throw new Error('服务端下推接口未连通，请刷新页面后重试；若仍失败，通常是函数 CORS 或部署未生效');
      }
      throw error;
    }

    let payload = await response.json().catch(() => ({}));
    let message = String(payload?.message || payload?.error || '').trim();
    const shouldRefresh =
      response.status === 401 ||
      message.toLowerCase().includes('invalid jwt') ||
      message.toLowerCase().includes('jwt');

    if (shouldRefresh) {
      const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError || !refreshed.session?.access_token) {
        throw new Error('当前登录态已失效，请重新登录后再试');
      }
      response = await execute(refreshed.session.access_token);
      payload = await response.json().catch(() => ({}));
      message = String(payload?.message || payload?.error || '').trim();
    }

    if (!response.ok || payload?.success === false) {
      throw new Error(message || '服务端下推报价管理失败');
    }

    return payload?.quotation || null;
  };

  const pushSalesQuotationViaBackendApi = async (
    quotation: any,
    credentials: { email: string; password: string },
  ) => {
    const loginResponse = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: credentials.email,
        password: credentials.password,
        device_name: 'cost-inquiry-quotation-management',
      }),
    });

    const loginPayload = await loginResponse.json().catch(() => ({}));
    if (!loginResponse.ok || !String(loginPayload?.token || '').trim()) {
      throw new Error(String(loginPayload?.message || '后端登录失败，无法创建报价单'));
    }

    const response = await fetch('/api/sales-quotations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${String(loginPayload.token).trim()}`,
      },
      body: JSON.stringify({
        qrNumber: quotation.qtNumber ? quotation.qrNumber : quotation?.qrNumber,
        qtNumber: quotation.qtNumber,
        inqNumber: quotation.inqNumber || '',
        region: quotation.region,
        customerCompany: quotation.customerCompany || 'N/A',
        customerName: quotation.customerName || 'N/A',
        customerEmail: quotation.customerEmail,
        customerPhone: quotation.customerPhone || '',
        customerAddress: quotation.customerAddress || '',
        items: Array.isArray(quotation.items) ? quotation.items : [],
        totalCost: quotation.totalCost || 0,
        totalPrice: quotation.totalPrice || 0,
        totalProfit: quotation.totalProfit || 0,
        profitRate: quotation.profitRate || 0,
        currency: quotation.currency || 'USD',
        paymentTerms: quotation.paymentTerms || '',
        deliveryTerms: quotation.deliveryTerms || '',
        deliveryDate: quotation.deliveryDate || null,
        validUntil: quotation.validUntil || null,
        notes: quotation.notes || '',
      }),
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(String(payload?.message || '后端创建销售报价单失败'));
    }

    return payload?.quotation || null;
  };

  useEffect(() => {
    if (!pushingQrId) {
      if (pushWatchdogRef.current) {
        window.clearTimeout(pushWatchdogRef.current);
        pushWatchdogRef.current = null;
      }
      if (pushUiTickRef.current) {
        window.clearInterval(pushUiTickRef.current);
        pushUiTickRef.current = null;
      }
      return;
    }

    if (pushWatchdogRef.current) {
      window.clearTimeout(pushWatchdogRef.current);
    }
    if (pushUiTickRef.current) {
      window.clearInterval(pushUiTickRef.current);
    }

    pushUiTickRef.current = window.setInterval(() => {
      setPushUiNow(Date.now());
    }, 1000);

    pushWatchdogRef.current = window.setTimeout(() => {
      setPushingQrId(null);
      setPushStartedAt(null);
      setPushUiNow(Date.now());
      toast.error('❌ 下推状态已自动复位，请重试');
    }, 25000);

    return () => {
      if (pushWatchdogRef.current) {
        window.clearTimeout(pushWatchdogRef.current);
        pushWatchdogRef.current = null;
      }
      if (pushUiTickRef.current) {
        window.clearInterval(pushUiTickRef.current);
        pushUiTickRef.current = null;
      }
    };
  }, [pushingQrId]);

  const clearStaleQuotationPushState = async (qr: any) => {
    await updateQuoteRequirement(qr.id, {
      pushedToQuotation: false,
      pushedToQuotationDate: null,
      pushedBy: null,
      quotationNumber: null,
    });
    await refreshQuoteRequirementsFromApi();
  };

  // 🔥 筛选业务员自己创建的QR（Admin可以看所有）
  const myQRs = useMemo(() => {
    const qrOnlyRows = quoteRequirements.filter((row) => isQrLikeNumber(row?.requirementNo));

    // Admin可以看所有QR，业务员只能看自己创建的且在自己负责区域的
    const isAdmin = currentUser?.type === 'admin';
    if (isAdmin) return qrOnlyRows;

    const userRegion = currentUser?.region;
    const normalizedCurrentEmail = normalizePersonnelEmail(currentUser?.email, userRegion);
    return qrOnlyRows.filter((qr) =>
      normalizePersonnelEmail(resolveQuotationOwner(qr).email, qr?.region || userRegion) === normalizedCurrentEmail &&
      qr.region === userRegion
    );
  }, [quoteRequirements, currentUser, resolveQuotationOwner]);

  // 🔥 根据状态和搜索词筛选
  const filteredQRs = useMemo(() => {
    let filtered = myQRs;

    // 状态筛选
    if (filterStatus !== 'all') {
      filtered = filtered.filter(qr => qr.status === filterStatus);
    }

    // 搜索筛选
    if (searchTerm) {
      filtered = filtered.filter(qr =>
        normalizeLegacyQrNumber(qr.requirementNo).toLowerCase().includes(searchTerm.toLowerCase()) ||
        qr.sourceInquiryNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        qr.items.some((item: any) => item.productName?.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // 按创建时间倒序
    return filtered.sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime());
  }, [myQRs, filterStatus, searchTerm]);

  useEffect(() => {
    const target = String(highlightQrNumber || '').trim();
    if (!target) return;
    const matched = myQRs.find((qr) => matchesNormalizedQrNumber(qr.requirementNo, target));
    if (!matched) return;
    setHighlightedId(String(matched.id));
    const timer = window.setTimeout(() => setHighlightedId(null), 3000);
    return () => window.clearTimeout(timer);
  }, [highlightQrNumber, myQRs]);

  // 🔥 获取可用的客户询价单（已提交且尚未创建QR的）
  const availableINQs = useMemo(() => {
    return inquiries.filter(inq => {
      // 只显示已提交的询价
      if (!inq.isSubmitted) return false;
      
      // 检查是否已经创建过QR
      const hasQR = quoteRequirements.some(qr => qr.sourceInquiryNumber === inq.inquiryNumber);
      return !hasQR;
    });
  }, [inquiries, quoteRequirements]);

  // 🔥 状态配置
  const statusConfig: Record<string, { label: string; color: string }> = {
    pending:    { label: '待处理', color: 'bg-gray-100 text-gray-600 border-gray-200' },
    draft:      { label: '草稿',   color: 'bg-gray-100 text-gray-600 border-gray-200' },
    submitted:  { label: '已提交', color: 'bg-blue-100 text-blue-600 border-blue-200' },
    partial:    { label: '已提交', color: 'bg-blue-100 text-blue-600 border-blue-200' },
    processing: { label: '处理中', color: 'bg-yellow-100 text-yellow-600 border-yellow-200' },
    quoted:     { label: '已报价', color: 'bg-purple-100 text-purple-600 border-purple-200' },
    completed:  { label: '已完成', color: 'bg-green-100 text-green-600 border-green-200' },
    cancelled:  { label: '已取消', color: 'bg-red-100 text-red-600 border-red-200' },
  };
  const getStatusConfig = (status: string) =>
    statusConfig[status] ?? { label: status || '未知', color: 'bg-gray-100 text-gray-500 border-gray-200' };

  // 🔥 创建采购需求（从INQ）
  const handleCreateQRFromINQ = async (inq: any) => {
    try {
      // QR 的 documentDataSnapshot 由 buildQuoteRequirementDocumentSnapshot 重新生成，
      // 不依赖 ING 的快照，因此无需检查 ING 是否有快照。
      const regionCode = inq.region === 'South America' ? 'SA' : inq.region === 'Europe & Africa' ? 'EA' : 'NA';
      const qrNumber = await nextQRNumber(regionCode);
      const quotationOwner = resolveInquiryOwnerForQrCreation(inq);
      const customerRequirements = buildCustomerRequirementsSnapshot(inq, inq.products || []);
      const commercialTerms = buildCommercialTermsSnapshotFromInquiry(inq);
      const salesDeptNotes = buildBilingualTradingRequirementsText({
        tradeTerms: inq.requirements?.tradeTerms,
        deliveryTime: inq.requirements?.deliveryTime,
        portOfDestination: inq.requirements?.portOfDestination,
        paymentTerms: inq.requirements?.paymentTerms,
        packingRequirements: inq.requirements?.packingRequirements,
        certifications: inq.requirements?.certifications,
        otherRequirements: inq.requirements?.otherRequirements,
      });
    const newQR = {
        id: crypto.randomUUID(),
        requirementNo: qrNumber,
      sourceInquiryId: inq.id,
      sourceInquiryNumber: inq.inquiryNumber || `ING-${inq.id}`,
      createdDate: String(
        inq.createdDate ||
        inq.createdAt ||
        inq.created_at ||
        new Date().toISOString()
      ),
      requiredDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      urgency: 'medium' as const,
      status: 'pending' as const,
      createdBy: currentUser?.email || '',
      requestedBy: quotationOwner.email || null,
      requestedByName: quotationOwner.name || null,
      region: inq.region,
        notes: buildProcurementRequestNotes(commercialTerms || {}) || inq.message || '',
        expectedQuoteDate: commercialTerms?.expectedQuoteDate,
        deliveryDate: commercialTerms?.deliveryDate,
        tradeTerms: commercialTerms?.tradeTerms,
        paymentTerms: commercialTerms?.paymentTerms,
        targetCostRange: commercialTerms?.targetCostRange,
        qualityRequirements: commercialTerms?.qualityRequirements,
        packagingRequirements: commercialTerms?.packagingRequirements,
        remarks: commercialTerms?.remarks,
        commercialTerms,
        customerRequirements,
        downstreamVisibility: DEFAULT_DOWNSTREAM_VISIBILITY,
      salesDeptNotes,
      customer: {
        companyName: inq.buyerInfo?.companyName || 'N/A',
        contactPerson: inq.buyerInfo?.contactPerson || 'N/A',
          email: [inq.buyerInfo?.email, inq.userEmail].find((e: string) => e && e !== 'N/A' && e.includes('@')) || inq.userEmail || '',
        phone: inq.buyerInfo?.phone || 'N/A',
        mobile: inq.buyerInfo?.mobile || '',
        address: inq.buyerInfo?.address || 'N/A',
        website: inq.buyerInfo?.website || '',
        businessType: inq.buyerInfo?.businessType || ''
      },
      items: inq.products.map((p: any, index: number) => {
        const normalized = normalizeFlowProductCore(p, index);
        return {
          id: normalized.id,
          productName: normalized.productName,
          productNameEn: normalized.productNameEn,
          productNameZh: normalized.productNameZh,
          modelNo: normalized.modelNo || '-',
          specification: normalized.specification || '-',
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
      const saved = await quoteRequirementService.upsert({
        ...newQR,
        documentDataSnapshot: buildQuoteRequirementDocumentSnapshot(newQR as any, resolvedCurrentUserRole),
      });
      if (!saved) {
        throw new Error('QR 写入 Supabase 失败');
      }
      await addQuoteRequirement(saved);
      toast.success(`✅ 成功创建 QR！单号：${qrNumber}`);
    setShowCreateModal(false);
    setSelectedINQ(null);
    } catch (error: any) {
      console.error('❌ [创建QR] 失败:', error);
      toast.error(`❌ 创建失败: ${error.message || '未知错误'}`);
    }
  };

  // 🔥 提交给采购部门 - 打开提交弹窗
  const handleOpenSubmitDialog = (qr: any) => {
    setSelectedQR(qr);
    setShowSubmitDialog(true);
  };

  // 🔥 确认提交给采购部门
  const handleConfirmSubmit = async (data: any) => {
    if (!selectedQR) return;
    try {
      const updatedItems = data.products?.length > 0
        ? data.products.map((p: any) => ({
          id: p.id,
          quantity: p.editableQuantity || p.quantity,
          remarks: p.editableRemarks || p.remarks
          }))
        : undefined;

      const commercialTerms = {
        ...(selectedQR.commercialTerms || {}),
        expectedQuoteDate: data.expectedQuoteDate || selectedQR.expectedQuoteDate || selectedQR.commercialTerms?.expectedQuoteDate,
        deliveryDate: data.deliveryDate || selectedQR.deliveryDate || selectedQR.commercialTerms?.deliveryDate,
        paymentTerms: data.paymentTerms || selectedQR.paymentTerms || selectedQR.commercialTerms?.paymentTerms,
        tradeTerms: data.tradeTerms || selectedQR.tradeTerms || selectedQR.commercialTerms?.tradeTerms,
        targetCostRange: data.targetCostRange || selectedQR.targetCostRange || selectedQR.commercialTerms?.targetCostRange,
        qualityRequirements: data.qualityRequirements || selectedQR.qualityRequirements || selectedQR.commercialTerms?.qualityRequirements,
        packagingRequirements: data.packagingRequirements || selectedQR.packagingRequirements || selectedQR.commercialTerms?.packagingRequirements,
        remarks: data.remarks || selectedQR.remarks || selectedQR.commercialTerms?.remarks,
      };
      const flowNotes = buildProcurementRequestNotes(commercialTerms);

      const payload: any = {
        id: selectedQR.id,
        requirementNo: selectedQR.requirementNo,
        sourceInquiryId: selectedQR.sourceInquiryId,
        sourceInquiryNumber: selectedQR.sourceInquiryNumber,
        region: selectedQR.region,
        urgency: selectedQR.urgency,
        requiredDate: selectedQR.requiredDate,
        requestedBy: selectedQR.requestedBy || null,
        requestedByName: selectedQR.requestedByName || null,
        assignedTo: selectedQR.assignedTo || null,
        customer: selectedQR.customer,
        items: updatedItems || selectedQR.items,
        status: 'submitted',
        notes: flowNotes || data.remarks || selectedQR.notes,
        expectedQuoteDate: commercialTerms.expectedQuoteDate,
        deliveryDate: commercialTerms.deliveryDate,
        paymentTerms: commercialTerms.paymentTerms,
        tradeTerms: commercialTerms.tradeTerms,
        targetCostRange: commercialTerms.targetCostRange,
        qualityRequirements: commercialTerms.qualityRequirements,
        packagingRequirements: commercialTerms.packagingRequirements,
        remarks: commercialTerms.remarks,
        commercialTerms,
        customerRequirements: selectedQR.customerRequirements || null,
        downstreamVisibility: selectedQR.downstreamVisibility || DEFAULT_DOWNSTREAM_VISIBILITY,
      };

      const saved = await quoteRequirementService.upsert({
        ...payload,
        documentDataSnapshot: buildQuoteRequirementDocumentSnapshot(payload as any, resolvedCurrentUserRole),
      });
      if (!saved) {
        throw new Error('QR 写入 Supabase 失败');
      }
      updateQuoteRequirement(selectedQR.id, {
        status: 'submitted',
        notes: payload.notes,
        expectedQuoteDate: commercialTerms.expectedQuoteDate,
        deliveryDate: commercialTerms.deliveryDate,
        paymentTerms: commercialTerms.paymentTerms,
        tradeTerms: commercialTerms.tradeTerms,
        targetCostRange: commercialTerms.targetCostRange,
        qualityRequirements: commercialTerms.qualityRequirements,
        packagingRequirements: commercialTerms.packagingRequirements,
        remarks: commercialTerms.remarks,
        commercialTerms,
        customerRequirements: selectedQR.customerRequirements || null,
        downstreamVisibility: selectedQR.downstreamVisibility || DEFAULT_DOWNSTREAM_VISIBILITY,
        items: updatedItems || selectedQR.items,
        ...saved,
      });
      toast.success(`✅ 已提交给采购部门！单号：${selectedQR.requirementNo}`);
      setShowSubmitDialog(false);
      setSelectedQR(null);
    } catch (error: any) {
      console.error('❌ [提交到采购部门] 失败:', error);
      toast.error(`❌ 提交失败: ${error.message || '未知错误'}`);
    }
  };

  // 🔥 查看采购需求单详情（客户询价单内容）
  const handleViewRequirement = (qr: any) => {
    setSelectedQR(qr);
    setShowViewModal(true);
  };

  // 🔥 创建销售报价（从QR）
  const handleCreateSalesQuotation = (qr: any) => {
    // 🔥 修正：检查purchaserFeedback而不是selectedSupplier
    if (!qr.purchaserFeedback || !qr.purchaserFeedback.products || qr.purchaserFeedback.products.length === 0) {
      toast.error('❌ 采购成本尚未反馈，无法创建销售报价');
      return;
    }

    // 🔥 打开智能报价创建弹窗
    setSelectedQRForQuote(qr);
    setShowQuoteCreation(true);
  };
  
  // 🔥 新增：下推报价管理（从QR创建业务员销售报价单QT）
  const handlePushToQuotationManagement = async (qr: any) => {
    if (pushingQrId === qr.id) return;
    setPushingQrId(qr.id);
    setPushStartedAt(Date.now());
    setPushUiNow(Date.now());
    
    try {
      const qrItems = Array.isArray(qr?.items) && qr.items.length > 0
        ? qr.items
        : Array.isArray(qr?.documentDataSnapshot?.products)
          ? qr.documentDataSnapshot.products.map((product: any, index: number) => ({
              id: product?.id || product?.productId || `qr-item-${index + 1}`,
              productName: product?.productName || product?.name || '',
              modelNo: product?.modelNo || product?.model || '',
              specification: product?.specification || '',
              quantity: Number(product?.quantity || 0),
              unit: product?.unit || 'PCS',
              remarks: product?.remarks || '',
              hsCode: product?.hsCode || '',
            }))
          : [];

      // 🔥 检查是否有采购成本反馈
      if (!qr.purchaserFeedback || !qr.purchaserFeedback.products || qr.purchaserFeedback.products.length === 0) {
        console.error('❌ 采购成本尚未反馈');
        toast.error('❌ 采购成本尚未反馈，无法下推到报价管理！');
        return;
      }

      if (!qr.purchaserFeedback.linkedBJ?.trim()) {
        toast.error('❌ 当前 QR 未绑定 BJ 结果，无法下推到报价管理');
        return;
      }

      const missingSourcePricing = qr.purchaserFeedback.products.find((product: any) => !product?.sourcePricing);
      if (missingSourcePricing) {
        toast.error('❌ 当前 QR 缺少 BJ 价格语义，无法下推到报价管理', {
          description: `${missingSourcePricing.productName || '未知产品'} 未携带 sourcePricing`,
        });
        return;
      }

      if (qrItems.length === 0) {
        throw new Error('当前 QR 缺少产品清单，无法下推到报价管理');
      }
      
      // 🔥 智能检查是否已经下推过（检查标记 AND 是否真的有QT）
      if (qr.pushedToQuotation) {
        // 检查是否真的有对应的QT（以 Supabase 为准）
        const existingRows = await salesQuotationService.getByQrNumber(qr.requirementNo);
        const existingQT = (Array.isArray(existingRows) && existingRows.length > 0)
          ? existingRows[0]
          : allSalesQuotations.find(qt => qt.qrNumber === qr.requirementNo);
        
        if (existingQT) {
          const ownerEmail = String(existingQT.salesPerson || '').toLowerCase();
          const expectedOwner = resolveQuotationOwner(qr);
          const shouldRepairOwner =
            Boolean(expectedOwner.email) &&
            ownerEmail !== String(expectedOwner.email).toLowerCase();

          // 兼容历史错归属：如果当前 QT 被写成管理员或错误业务员，自动回正到 QR 所属业务员
          if (shouldRepairOwner) {
            await updateSalesQuotation(String(existingQT.id), {
              ...existingQT,
              salesPerson: expectedOwner.email || existingQT.salesPerson,
              salesPersonName: expectedOwner.name || existingQT.salesPersonName || '',
            } as any);
            toast.success(`✅ 已修复历史归属：${existingQT.qtNumber} 归属到 ${expectedOwner.email}`);
            if (onSwitchToQuotationManagement) {
              onSwitchToQuotationManagement(existingQT.qtNumber);
            }
            return;
          }

          // 真的有QT，不允许重复下推
          console.warn('⚠️ 此 QR 已下推过，且找到对应的QT:', existingQT.qtNumber);
          toast.info(`ℹ️ 此 QR 已下推到报价管理，QT单号：${existingQT.qtNumber}，请前往报价管理模块查看`);
          if (onSwitchToQuotationManagement) {
            onSwitchToQuotationManagement(existingQT.qtNumber);
          }
          return;
        } else {
          // 有标记但没有QT，说明之前创建失败，允许重新下推
          console.warn('⚠️ 检测到pushedToQuotation标记，但未找到对应的QT，允许重新下推');
          await clearStaleQuotationPushState(qr);
        }
      }
      
      // 🔥 区域代码映射为完整区域名称
      const regionMap: Record<string, 'North America' | 'South America' | 'Europe & Africa'> = {
        'NA': 'North America',
        'SA': 'South America',
        'EA': 'Europe & Africa',
        'EU': 'Europe & Africa',
        'North America': 'North America',
        'South America': 'South America',
        'Europe & Africa': 'Europe & Africa'
      };
      
      const fullRegion = regionMap[qr.region] || 'North America';
      const sourceTemplateId = qr.templateId || qr.template_id || null;
      const sourceTemplateVersionId = qr.templateVersionId || qr.template_version_id || null;
      const quotationOwner = resolveQuotationOwner(qr);

      if (!String(quotationOwner.email || '').trim()) {
        throw new Error('当前 QR 缺少业务员归属邮箱，无法创建报价单');
      }
      
      // 🔥 自动创建draft状态的业务员销售报价单（QT）
      const regionCode = qr.region === 'South America' ? 'SA' : qr.region === 'Europe & Africa' ? 'EA' : 'NA';
      const qtNumber = await nextQTNumber(regionCode);
      
      console.log('📋 准备创建销售报价单:', {
        qtNumber,
        qrNumber: qr.requirementNo,
        inqNumber: qr.sourceInquiryNumber,
        region: qr.region,
        fullRegion: fullRegion,
        customerInfo: qr.customer,
        itemsCount: qrItems.length,
        feedbackProductsCount: qr.purchaserFeedback.products.length
      });

      const resolvedCustomerEmail = [
        qr.customer?.email,
        qr.customerEmail,
        qr.sourceInquiry?.userEmail,
        qr.sourceInquiry?.buyerInfo?.email,
        qr.sourceInquiry?.customerEmail,
      ]
        .map((value) => String(value || '').trim())
        .find((value) => value && value.includes('@')) || '';

      if (!resolvedCustomerEmail) {
        throw new Error('当前 QR 缺少客户邮箱，无法创建报价单');
      }
      
      // 🔥 映射产品项：合并QR产品信息和采购反馈成本
      const quotationItems = qrItems.map((item: any) => {
        const normalizedItem = normalizeFlowProductCore(item);
        // 🔥 从采购反馈中查找对应产品的成本信息
        const feedbackProduct = qr.purchaserFeedback.products.find(
          (fp: any) => fp.productId === item.id || fp.productName === normalizedItem.productName
        );
        
        if (!feedbackProduct) {
          console.warn('⚠️ 未找到产品的成本反馈:', item.productName);
        }
        
        // 成本单价（从采购反馈）
        const rawCostPrice = feedbackProduct?.costPrice || 0;
        const feedbackCurrency = (feedbackProduct?.currency || 'CNY').toUpperCase();

        // 供应商报价通常为 CNY；需换算为销售报价的 USD
        // 使用报价单 currency 字段，默认销售报价为 USD
        const targetCurrency = 'USD';
        // 固定汇率兜底（实际环境应从汇率服务获取）
        const CNY_TO_USD = 1 / 7.2;
        const costPriceUSD = feedbackCurrency === 'CNY' || feedbackCurrency === 'RMB'
          ? rawCostPrice * CNY_TO_USD
          : feedbackCurrency === 'USD'
            ? rawCostPrice
            : rawCostPrice; // 其他货币原样保留，如有需要可扩展

        // 🔥 默认利润率18%计算销售价（基于 USD 成本）
        const defaultMarginPercent = 18;
        const salesPrice = costPriceUSD * (1 + defaultMarginPercent / 100);
        const profit = salesPrice - costPriceUSD;
        
        // 总成本和总价（均为 USD）
        const totalCost = costPriceUSD * item.quantity;
        const totalPrice = salesPrice * item.quantity;
        
        console.log(`  - ${item.productName}:`, {
          quantity: item.quantity,
          rawCostPrice,
          feedbackCurrency,
          costPriceUSD: costPriceUSD.toFixed(4),
          salesPrice: salesPrice.toFixed(4),
          margin: `${defaultMarginPercent}%`
        });
        
        return {
          id: item.id,
          productName: normalizedItem.productName,
          productNameEn: normalizedItem.productNameEn,
          productNameZh: normalizedItem.productNameZh,
          modelNo: normalizedItem.modelNo || '-',
          specification: normalizedItem.specification || '-',
          specificationEn: normalizedItem.specificationEn,
          specificationZh: normalizedItem.specificationZh,
          imageUrl: normalizedItem.imageUrl || '',
          quantity: normalizedItem.quantity,
          unit: normalizedItem.unit || 'PCS',
          costPrice: costPriceUSD,
          salesPrice: salesPrice,
          profitMargin: defaultMarginPercent,
          profit: profit,
          totalCost: totalCost,
          totalPrice: totalPrice,
          currency: targetCurrency,
          selectedSupplier: qr.purchaserFeedback.linkedSupplier || 'N/A',
          selectedSupplierName: qr.purchaserFeedback.linkedSupplier || 'N/A',
          selectedBJ: qr.purchaserFeedback.linkedBJ || 'N/A',
          moq: feedbackProduct?.moq,
          leadTime: feedbackProduct?.leadTime || '',
          remarks: item.remarks || '',
          hsCode: item.hsCode || ''
        };
      });
      
      // 🔥 计算汇总金额
      const totalCost = quotationItems.reduce((sum: number, item: any) => sum + item.totalCost, 0);
      const totalPrice = quotationItems.reduce((sum: number, item: any) => sum + item.totalPrice, 0);
      const totalProfit = totalPrice - totalCost;
      const profitRate = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0;
      
      // 🔥 创建销售报价单（QT）- draft状态
      const newQuotation = {
        id: crypto.randomUUID(),
        qtNumber: qtNumber,
        
        // 关联单据
        qrNumber: qr.requirementNo,
        inqNumber: qr.sourceInquiryNumber || '',
        
        // 客户信息（从QR）
        customerCompany: qr.customer?.companyName || 'N/A',
        customerName: qr.customer?.contactPerson || 'N/A',
        customerEmail: resolvedCustomerEmail,
        customerPhone: qr.customer?.phone || '',
        customerAddress: qr.customer?.address || '',
        
        // 业务信息
        region: qr.region || 'NA',
        salesPerson: quotationOwner.email,
        salesPersonName: quotationOwner.name,
        
        // 产品清单
        items: quotationItems,
        
        // 金额汇总
        totalCost: totalCost,
        totalPrice: totalPrice,
        totalProfit: totalProfit,
        profitRate: profitRate,
        currency: 'USD',
        
        // 商务条款（从采购反馈）
        paymentTerms: qr.purchaserFeedback.paymentTerms || 'T/T 30天',
        deliveryTerms: qr.purchaserFeedback.deliveryTerms || 'FOB',
        deliveryDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 45天后
        
        // 状态（默认draft草稿）
        approvalStatus: 'draft' as const,
        customerStatus: 'not_sent' as const,
        
        // 审批链（空数组，待提交审批时填充）
        approvalChain: [],
        
        // 报价有效期（30天）
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        
        // 版本管理
        version: 1,
        
        // 时间戳
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: currentUser?.id || '',
        ...buildIdentityPersistenceFields({
          ownerEmail: quotationOwner.email,
          ownerName: quotationOwner.name,
          ownerRole: 'Sales_Rep',
        }),

        // 备注
        notes: qr.purchaserFeedback.purchaserRemarks || '',
        templateId: sourceTemplateId,
        templateVersionId: sourceTemplateVersionId,
      };
      
      
      try {
        // 采购员下推 QT 走服务端代写，避免客户端直写 sales_quotations 命中 RLS
        const localAdminAuth = getLocalAdminAuth();
        let persistedQuotation: any;
        try {
          persistedQuotation = await withTimeout(
            pushSalesQuotationViaServer(newQuotation),
            20000,
            '服务端下推报价管理超时，请重试',
          );
        } catch (serverError: any) {
          const serverMessage = String(serverError?.message || serverError || '').trim().toLowerCase();
          const canFallbackToBackend =
            localAdminAuth.enabled &&
            Boolean(localAdminAuth.email) &&
            Boolean(localAdminAuth.password);

          if (!canFallbackToBackend || !serverMessage.includes('permission denied for table sales_quotations')) {
            throw serverError;
          }

          persistedQuotation = await withTimeout(
            pushSalesQuotationViaBackendApi(newQuotation, {
              email: localAdminAuth.email,
              password: localAdminAuth.password,
            }),
            20000,
            '后端下推报价管理超时，请重试',
          );
        }

        // Supabase-first：业务流转关系必须真实落库后才算成功
        await withTimeout(
          persistQuotationPushState(
            qr,
            String(
              persistedQuotation?.qtNumber ||
              persistedQuotation?.qt_number ||
              newQuotation.qtNumber,
            ),
          ),
          12000,
          '报价单已创建，但回写 QR 下推状态超时，请刷新后确认',
        );

        const emittedQuotation = {
          ...newQuotation,
          ...persistedQuotation,
          qtNumber: String(
            persistedQuotation?.qtNumber ||
            persistedQuotation?.qt_number ||
            newQuotation.qtNumber,
          ).trim(),
          qrNumber: String(
            persistedQuotation?.qrNumber ||
            persistedQuotation?.qr_number ||
            newQuotation.qrNumber,
          ).trim(),
        };

        emitErpEvent({
          id: `evt-qt-created-${Date.now()}`,
          key: ERP_EVENT_KEYS.QUOTATION_CREATED,
          domain: 'qt',
          recordId: String(emittedQuotation.id || emittedQuotation.qtNumber),
          internalNo: String(emittedQuotation.qtNumber || ''),
          source: 'admin',
          occurredAt: new Date().toISOString(),
          metadata: {
            quotation: emittedQuotation,
          },
        });
        
        
        toast.success(`✅ 成功下推到报价管理！销售报价单号：${newQuotation.qtNumber}`, {
          description: `已自动创建草稿状态的报价单，默认利润率18%，请前往报价管理模块查看和编辑`,
          duration: 5000
        });
        
        // 🔥 切换到报价管理并高亮指定单号
        if (onSwitchToQuotationManagement) {
          onSwitchToQuotationManagement(newQuotation.qtNumber);
        }
      } catch (err: any) {
        console.error('❌❌❌ POST /api/sales-quotations 调用失败:', err);
        toast.error(`❌ 下推失败: ${err.message || '未知错误'}`);
        return;
      }
    } catch (error) {
      console.error('🔥 [错误] 下推报价管理时发生错误:', error);
      toast.error(`❌ 下推报价管理时发生错误: ${(error as any)?.message || '未知错误'}`);
    } finally {
      if (pushWatchdogRef.current) {
        window.clearTimeout(pushWatchdogRef.current);
        pushWatchdogRef.current = null;
      }
      if (pushUiTickRef.current) {
        window.clearInterval(pushUiTickRef.current);
        pushUiTickRef.current = null;
      }
      setPushingQrId(null);
      setPushStartedAt(null);
      setPushUiNow(Date.now());
    }
  };
  
  // 🔥 批量删除处理函数
  const handleBulkDelete = () => {
    const visibleSelectedIds = Array.from(selectedIds).filter((id) =>
      filteredQRs.some((qr) => qr.id === id),
    );

    if (visibleSelectedIds.length === 0) {
      toast.error('请先选择要删除的报价请求单');
      return;
    }

    if (window.confirm(`确认要删除选中的 ${visibleSelectedIds.length} 条报价请求单吗？此操作无法撤销！`)) {
      visibleSelectedIds.forEach(id => {
        deleteQuoteRequirement(id);
      });
      setSelectedIds(new Set());
      toast.success(`✅ 已成功删除 ${visibleSelectedIds.length} 条报价请求单`);
    }
  };

  // 🔥 全选/取消全选
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(filteredQRs.map(qr => qr.id));
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
  
  // 计算全选状态
  const isAllSelected = filteredQRs.length > 0 && selectedIds.size === filteredQRs.length;
  const isSomeSelected = selectedIds.size > 0 && selectedIds.size < filteredQRs.length;

  useEffect(() => {
    const visibleIds = new Set(filteredQRs.map((qr) => qr.id));
    const nextSelected = new Set(Array.from(selectedIds).filter((id) => visibleIds.has(id)));
    if (nextSelected.size !== selectedIds.size) {
      setSelectedIds(nextSelected);
    }
  }, [filteredQRs, selectedIds]);

  useEffect(() => {
    let cancelled = false;
    const loadRemotePreference = async () => {
      setCostInquiryPreferenceHydrated(false);
      const preferenceKey = getCostInquiryPreferenceKey(filterStatus);
      const cachedValue = readCachedCostInquiryColumnWidths(
        costInquiryPreferenceRoleScope,
        preferenceKey,
      );
      if (cachedValue) {
        setCostInquiryColumnWidths(mergeStoredCostInquiryColumnWidths(cachedValue));
        setCostInquiryHasCustomWidths(true);
      } else {
        setCostInquiryColumnWidths(COST_INQUIRY_TABLE_DEFAULT_WIDTHS);
        setCostInquiryHasCustomWidths(false);
      }
      try {
        const value = await sharedRoleUiPreferenceService.get(
          costInquiryPreferenceRoleScope,
          preferenceKey,
        );
        if (cancelled) return;
        if (value) {
          writeCachedCostInquiryColumnWidths(costInquiryPreferenceRoleScope, preferenceKey, value);
          setCostInquiryColumnWidths(
            mergeStoredCostInquiryColumnWidths(
              value as Partial<Record<CostInquiryColumnKey, number>>,
            ),
          );
          setCostInquiryHasCustomWidths(true);
        } else {
          writeCachedCostInquiryColumnWidths(costInquiryPreferenceRoleScope, preferenceKey, null);
          setCostInquiryColumnWidths(COST_INQUIRY_TABLE_DEFAULT_WIDTHS);
          setCostInquiryHasCustomWidths(false);
        }
      } catch {
        setCostInquiryColumnWidths(COST_INQUIRY_TABLE_DEFAULT_WIDTHS);
        setCostInquiryHasCustomWidths(false);
      } finally {
        if (!cancelled) setCostInquiryPreferenceHydrated(true);
      }
    };
    void loadRemotePreference();
    return () => {
      cancelled = true;
    };
  }, [costInquiryPreferenceRoleScope, filterStatus]);

  useEffect(() => {
    if (!costInquiryHasCustomWidths || !costInquiryPreferenceHydrated) return;
    writeCachedCostInquiryColumnWidths(
      costInquiryPreferenceRoleScope,
      getCostInquiryPreferenceKey(filterStatus),
      costInquiryColumnWidths,
    );
    const timer = window.setTimeout(() => {
      void sharedRoleUiPreferenceService.save(
        costInquiryPreferenceRoleScope,
        getCostInquiryPreferenceKey(filterStatus),
        costInquiryColumnWidths,
      ).catch(() => {});
    }, 300);
    return () => window.clearTimeout(timer);
  }, [costInquiryColumnWidths, costInquiryHasCustomWidths, costInquiryPreferenceHydrated, costInquiryPreferenceRoleScope, filterStatus]);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!costInquiryColumnResizeRef.current) return;
      const { key, startX, startWidth } = costInquiryColumnResizeRef.current;
      const nextWidth = Math.max(
        COST_INQUIRY_COLUMN_MIN_WIDTHS[key],
        Math.round(startWidth + (event.clientX - startX)),
      );
      setCostInquiryHasCustomWidths(true);
      setCostInquiryColumnWidths((current) => (
        current[key] === nextWidth ? current : { ...current, [key]: nextWidth }
      ));
    };

    const stopResize = () => {
      costInquiryColumnResizeRef.current = null;
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

  const getCostInquiryColumnStyle = (key: CostInquiryColumnKey) =>
    getColumnStyle(costInquiryColumnWidths, key);

  const startCostInquiryColumnResize = (
    key: CostInquiryColumnKey,
    event: React.MouseEvent<HTMLDivElement>,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    setCostInquiryHasCustomWidths(true);
    costInquiryColumnResizeRef.current = {
      key,
      startX: event.clientX,
      startWidth: costInquiryColumnWidths[key],
    };
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  const shrinkCostInquiryColumnToMinimum = (
    key: CostInquiryColumnKey,
    event: React.MouseEvent<HTMLDivElement>,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    setCostInquiryHasCustomWidths(true);
    setCostInquiryColumnWidths((current) => (
      current[key] === COST_INQUIRY_COLUMN_MIN_WIDTHS[key]
        ? current
        : { ...current, [key]: COST_INQUIRY_COLUMN_MIN_WIDTHS[key] }
    ));
  };

  const renderCostInquiryColumnResizeHandle = (key: CostInquiryColumnKey) =>
    renderColumnResizeHandle(
      key,
      startCostInquiryColumnResize,
      shrinkCostInquiryColumnToMinimum,
      { lineHoverClassName: 'group-hover:bg-slate-400', hitAreaClassName: 'w-8 -right-4' },
    );

  const renderCostInquiryHeaderCell = (
    key: CostInquiryColumnKey,
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
        className={`group relative overflow-hidden px-3 py-2.5 align-middle ${className}`.trim()}
        style={getCostInquiryColumnStyle(key)}
      >
        <div className={`flex min-h-5 w-full items-center pr-4 ${alignClass}`}>
          <span className="block break-words whitespace-normal text-[13px] font-semibold leading-4 tracking-[0.01em]">
            {label}
          </span>
        </div>
        {renderCostInquiryColumnResizeHandle(key)}
      </TableHead>
    );
  };

  return (
    <div className="flex flex-1 min-h-0 flex-col">
      {/* 📋 成本询报表格 - 参考询价管理样式 */}
      <div className="border border-gray-200 rounded bg-white flex flex-1 min-h-0 flex-col overflow-visible min-h-[calc(100dvh-360px)]">
        <div className="border-b border-slate-200 bg-slate-50/70">
          {/* 🎯 紧凑型单行筛选栏 */}
          <div className="px-5 py-4">
            <div className="flex flex-wrap gap-2.5 items-center">
              {/* 搜索框 */}
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="搜索 QR 编号、来源询价单号、产品名称..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-9 rounded-xl border-slate-200 bg-white pl-10 text-sm shadow-sm"
                />
              </div>

              {/* 🔥 刷新：拉取最新采购需求，采购员接受报价后业务员点此可看到「采购反馈」 */}
              <Button
                variant="outline"
                size="sm"
                className="h-9 rounded-xl px-3 text-sm text-blue-600 shadow-sm hover:bg-blue-50"
                disabled={refreshing}
                onClick={async () => {
                  setRefreshing(true);
                  try {
                    await refreshQuoteRequirementsFromApi();
                    toast.success('已刷新，若有采购员接受的报价会显示在「采购反馈」列');
                  } catch {
                    toast.error('刷新失败，请稍后再试');
                  } finally {
                    setRefreshing(false);
                  }
                }}
              >
                {refreshing ? '刷新中...' : '刷新'}
              </Button>

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
              <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
                <SelectTrigger className={`h-9 w-[130px] rounded-xl border-slate-200 bg-white shadow-sm ${ERP_LIST_UI_SPEC_V1.buttonTextClass}`}>
                  <SelectValue placeholder="全部状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" style={{ fontSize: '14px' }}>全部状态</SelectItem>
                  <SelectItem value="pending" style={{ fontSize: '14px' }}>草稿</SelectItem>
                  <SelectItem value="partial" style={{ fontSize: '14px' }}>已提交</SelectItem>
                  <SelectItem value="processing" style={{ fontSize: '14px' }}>处理中</SelectItem>
                  <SelectItem value="completed" style={{ fontSize: '14px' }}>已完成</SelectItem>
                </SelectContent>
              </Select>

              {/* 新建采购需求按钮 */}
              <Button
                onClick={() => setShowCreateModal(true)}
                className="h-9 rounded-xl px-4 text-sm text-white shadow-sm hover:opacity-90"
                style={{ backgroundColor: '#F96302' }}
              >
                新建 QR
              </Button>
            </div>
          </div>
        </div>

        {/* 📊 表格 */}
        <div className="overflow-x-auto overflow-y-visible bg-white flex-1 rounded-[inherit] min-h-0">
          <Table className="w-full table-fixed border-collapse text-[14px]" style={{ minWidth: 'max-content' }}>
            <colgroup>
              {COST_INQUIRY_COLUMN_ORDER.map((key) => (
                <col key={key} style={getCostInquiryColumnStyle(key)} />
              ))}
            </colgroup>
            <TableHeader>
              <TableRow className="border-b border-slate-200 bg-white">
                <TableHead className="group relative overflow-hidden px-0 py-2.5 align-middle" style={getCostInquiryColumnStyle('select')}>
                  <div className="flex items-center justify-center pr-4">
                    <Checkbox
                      checked={isAllSelected}
                      onCheckedChange={handleSelectAll}
                      aria-label="全选"
                    />
                  </div>
                  {renderCostInquiryColumnResizeHandle('select')}
                </TableHead>
                <TableHead className="group relative overflow-hidden px-0 py-2.5 align-middle" style={getCostInquiryColumnStyle('index')}>
                  <div className="flex items-center justify-start pl-4 pr-4">
                    <span className="text-[13px] font-semibold leading-4 tracking-[0.01em] text-slate-700">序号</span>
                  </div>
                  {renderCostInquiryColumnResizeHandle('index')}
                </TableHead>
                {renderCostInquiryHeaderCell('createdAt', '日期', 'text-left')}
                <TableHead className="group relative overflow-hidden px-3 py-2.5 align-middle" style={getCostInquiryColumnStyle('qrNo')}>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[13px] font-semibold leading-4 tracking-[0.01em] text-slate-700">编号</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button className="text-slate-300 hover:text-slate-500 transition-colors">
                            <HelpCircle className="h-3 w-3" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-sm">
                          <div className="space-y-2 p-1">
                            <p className="font-semibold text-sm">📋 报价请求单（QR）定义：</p>
                            <p className="text-xs leading-relaxed">
                              报价请求单是从客户询价单（ING）下推生成的内部询价请求单据，用于向采购部门发起报价请求。
                            </p>
                            <div className="text-xs space-y-1 pt-2 border-t border-gray-200">
                              <p><span className="font-medium">• 作用：</span>获取供应商成本价格，为销售报价提供依据</p>
                              <p><span className="font-medium">• 编号规则：</span>QR-{'{区域代码}'}-{'{日期}'}-{'{流水号}'}</p>
                              <p><span className="font-medium">• 流转关系：</span>ING → QR → XJ → BJ → QT → SC → PR → CG</p>
                            </div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  {renderCostInquiryColumnResizeHandle('qrNo')}
                </TableHead>
                {renderCostInquiryHeaderCell('product', '产品信息', 'text-left')}
                {renderCostInquiryHeaderCell('feedback', '成本反馈', 'text-left')}
                {renderCostInquiryHeaderCell('status', '状态', 'text-left')}
                {renderCostInquiryHeaderCell('actions', '操作', 'text-left')}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredQRs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
                    <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-400 mb-2">暂无 QR</p>
                    <p className="text-xs text-gray-400">点击右上角"新建 QR"开始向采购部门询价</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredQRs.map((qr, index) => {
                  const config = getStatusConfig(qr.status);
                  const relatedRefs = sortDocumentFlowRefs([
                    qr.sourceInquiryNumber
                      ? {
                          value: formatDocumentNumber(qr.sourceInquiryNumber, false),
                          className: 'font-mono text-blue-500',
                        }
                      : null,
                    (qr.finalQuotationNumber || (qr as any).quotationNumber)
                      ? {
                          value: formatDocumentNumber(String(qr.finalQuotationNumber || (qr as any).quotationNumber), false),
                          className: 'font-mono text-emerald-600',
                        }
                      : null,
                  ].filter(Boolean) as Array<{ value: string; className: string }>);
                  const relatedRefsExpanded = expandedRelatedIds.includes(String(qr.id));
                  // 🔥 修复：检查采购反馈数据（purchaserFeedback）而不是selectedSupplier
                  const hasPurchaserFeedback = qr.purchaserFeedback && qr.purchaserFeedback.status === 'quoted';
                  const canPushByStatus = ['submitted', 'partial', 'processing', 'completed'].includes(String(qr.status || ''));
                  const showPushButton = canPushByStatus || hasPurchaserFeedback;
                  const isPushedToQuotation = Boolean(qr.pushedToQuotation);
                  const isPushLoading =
                    pushingQrId === qr.id &&
                    pushStartedAt != null &&
                    pushUiNow - pushStartedAt < 25000;
                  const isSelected = selectedIds.has(qr.id);

                  return (
                    <TableRow key={qr.id} className={`border-b border-slate-200/90 hover:bg-slate-50/70 ${highlightedId === String(qr.id) ? 'bg-yellow-100 border-2 border-yellow-400 shadow-lg' : ''}`}>
                      <TableCell className="py-1.5" style={getCostInquiryColumnStyle('select')}>
                        <div className="flex items-center justify-center pr-4">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => handleSelectOne(qr.id, checked as boolean)}
                            aria-label={`选择 ${normalizeLegacyQrNumber(qr.requirementNo)}`}
                          />
                        </div>
                      </TableCell>
                      <TableCell className="py-1.5 text-left" style={getCostInquiryColumnStyle('index')}>
                        <div className="flex items-center justify-start pl-4 pr-4">
                          <span className="text-[12px] text-gray-500">{index + 1}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-1.5 text-left" style={getCostInquiryColumnStyle('createdAt')}>
                        <div className="space-y-0 text-slate-900">
                          <div className="leading-4.5">
                            <span className="mr-1 text-[12px] text-slate-500">创</span>
                            <span className="text-[12px] font-medium text-slate-900">
                              {formatCostInquiryDateOnly(qr.createdDate)}
                            </span>
                          </div>
                          <div className="leading-4.5">
                            <span className="mr-1 text-[12px] text-slate-500">截</span>
                            <span className="text-[12px] font-medium text-slate-900">
                              {formatCostInquiryDateOnly(qr.expectedQuoteDate || qr.commercialTerms?.expectedQuoteDate)}
                            </span>
                          </div>
                          <div className="leading-4.5">
                            <span className="mr-1 text-[12px] text-slate-500">交</span>
                            <span className="text-[12px] font-medium text-slate-900">
                              {formatCostInquiryDateOnly(qr.deliveryDate || qr.commercialTerms?.deliveryDate)}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-1.5 overflow-hidden text-left" style={getCostInquiryColumnStyle('qrNo')}>
                        <button
                          className="text-[12px] font-semibold text-blue-600 hover:text-blue-800 cursor-pointer transition-colors"
                          onClick={() => handleViewRequirement(qr)}
                        >
                          {formatDocumentNumber(normalizeLegacyQrNumber(qr.requirementNo), false)}
                        </button>
                        {relatedRefs.length > 0 ? (
                          <button
                            type="button"
                            onClick={() => {
                              setExpandedRelatedIds((current) => (
                                current.includes(String(qr.id))
                                  ? current.filter((id) => id !== String(qr.id))
                                  : [...current, String(qr.id)]
                              ));
                            }}
                            className="mt-0 block text-[12px] font-semibold leading-3.5 text-slate-500 hover:text-slate-700"
                          >
                            {relatedRefsExpanded ? '收起关联编号' : `展开关联编号 (${relatedRefs.length})`}
                          </button>
                        ) : null}
                        {relatedRefsExpanded ? (
                          <div className="mt-0 space-y-0">
                            {relatedRefs.map((ref) => (
                              <button
                                key={`${qr.id}-${ref.value}`}
                                type="button"
                                onClick={() => {
                                  const target = String(ref.value || '').trim();
                                  if (target.startsWith('ING-')) {
                                    onNavigateToInquiryManagementWithHighlight?.(target);
                                    return;
                                  }
                                  if (target.startsWith('QT-')) {
                                    onSwitchToQuotationManagement?.(target);
                                  }
                                }}
                                className={`block text-left text-[12px] ${ref.className} ${String(ref.value || '').trim().match(/^(ING|QT)-/) ? 'cursor-pointer hover:underline' : 'cursor-default'}`}
                              >
                                {ref.value}
                              </button>
                            ))}
                          </div>
                        ) : null}
                      </TableCell>
                      <TableCell className="py-1.5 overflow-hidden text-left" style={getCostInquiryColumnStyle('product')}>
                        {(() => {
                          const items = Array.isArray(qr.items) ? qr.items : [];
                          const first = items[0];
                          return (
                        <div className="space-y-0">
                              <div className="break-words text-[12px] font-medium leading-3.5 text-slate-700">
                                {first?.productName || getFormalBusinessModelNo(first) || 'N/A'}
                            </div>
                              <div className="text-[12px] leading-3.5 text-slate-400">
                                共 {Math.max(items.length, 1)} 个产品
                        </div>
                            </div>
                          );
                        })()}
                      </TableCell>
                      <TableCell className="py-1.5 text-left" style={getCostInquiryColumnStyle('feedback')}>
                        {/* 🔥 修复：显示采购反馈信息（purchaserFeedback）*/}
                        {hasPurchaserFeedback ? (
                          <div className="flex flex-col items-start gap-0 text-left">
                            <span className="flex items-center justify-start gap-1 text-[12px] font-medium leading-3.5 text-green-600">
                              <CheckCircle className="w-3 h-3" />
                              已反馈
                            </span>
                            <span className="text-[12px] leading-3.5 text-slate-500">
                              {qr.purchaserFeedback.products?.length || 0} 个产品
                            </span>
                            {qr.purchaserFeedback.feedbackBy && (
                              <span className="text-[12px] leading-3.5 text-blue-600">
                                采购员: {qr.purchaserFeedback.feedbackBy}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="flex items-center justify-start gap-1 text-[12px] leading-3.5 text-slate-400">
                            <Clock className="w-3 h-3" />
                            待反馈
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="py-1.5 text-left" style={getCostInquiryColumnStyle('status')}>
                        <Badge className={`h-4 px-1.5 text-[11px] border ${config.color}`}>
                          {config.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-1.5 text-left" style={getCostInquiryColumnStyle('actions')}>
                        <div className="flex items-center justify-start gap-2">
                          {/* 查看按钮 */}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 px-2 text-[11px]"
                            onClick={() => handleViewRequirement(qr)}
                          >
                            查看
                          </Button>

                          {/* 草稿状态：提交按钮 */}
                          {qr.status === 'pending' && (
                            <Button
                              size="sm"
                              className="h-5 px-2 text-[11px] bg-orange-600 hover:bg-orange-700"
                              onClick={() => handleOpenSubmitDialog(qr)}
                            >
                              提交采购部
                            </Button>
                          )}

                          {/* 可下推状态：显示“下推报价管理”（完成态也允许下推） */}
                          {showPushButton && (
                            <Button
                              size="sm"
                              className={`h-5 px-2 text-[11px] ${
                                isPushedToQuotation
                                  ? 'bg-gray-100 text-gray-400 border border-gray-200 hover:bg-gray-100'
                                  : 'bg-blue-600 hover:bg-blue-700 text-white'
                              }`}
                              onClick={() => {
                                if (!isPushedToQuotation) {
                                  handlePushToQuotationManagement(qr);
                                }
                              }}
                              disabled={isPushLoading || isPushedToQuotation}
                              title={
                                isPushedToQuotation
                                  ? '该 QR 已成功下推到报价管理'
                                  : hasPurchaserFeedback
                                    ? '按采购反馈下推到报价管理'
                                    : '直接下推到报价管理'
                              }
                            >
                              {isPushLoading ? '下推中...' : isPushedToQuotation ? '已下推报价管理' : '下推报价管理'}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* 🔥 创建采购需求弹窗 */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* 标题 */}
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h2 className="text-lg" style={{ color: '#F96302' }}>➕ 新建 QR</h2>
              <button onClick={() => { setShowCreateModal(false); setSelectedINQ(null); }} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 内容 */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="mb-4">
                <label className="block text-sm mb-2 text-gray-700">选择客户询价单</label>
                {availableINQs.length === 0 ? (
                  <div className="bg-gray-50 rounded-lg p-6 text-center">
                    <AlertCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">暂无可用的客户询价单</p>
                    <p className="text-xs text-gray-400 mt-1">所有询价单已创建 QR，或无已提交的询价单</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {availableINQs.map(inq => (
                      <div
                        key={inq.id}
                        onClick={() => setSelectedINQ(inq)}
                        className={`border rounded-lg p-4 cursor-pointer transition-all ${
                          selectedINQ?.id === inq.id
                            ? 'border-2'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        style={selectedINQ?.id === inq.id ? { borderColor: '#F96302' } : {}}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="font-medium text-sm mb-1">
                              {inq.inquiryNumber || `ING-${inq.id}`}
                            </div>
                            <div className="text-xs text-gray-500">
                              客户：{inq.buyerInfo?.companyName || inq.userEmail}
                            </div>
                          </div>
                          <span className="text-xs text-gray-400">
                            {new Date(inq.submittedAt || inq.createdAt).toLocaleDateString('zh-CN')}
                          </span>
                        </div>
                        <div className="text-xs text-gray-600">
                          {inq.products.length} 个产品 • 总价：${inq.totalPrice.toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {selectedINQ && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                  <div className="text-sm mb-2">📦 产品清单（弹窗内全量展开）</div>
                  <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                    {(selectedINQ.products || []).map((p: any, idx: number) => (
                      <div key={idx} className="text-xs text-gray-700">
                        • {p.productName} - {p.quantity} {p.unit || 'PCS'}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 底部按钮 */}
            <div className="px-6 py-4 border-t flex justify-end gap-3">
              <button
                onClick={() => { setShowCreateModal(false); setSelectedINQ(null); }}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-all text-sm"
              >
                取消
              </button>
              <button
                onClick={() => selectedINQ && handleCreateQRFromINQ(selectedINQ)}
                disabled={!selectedINQ}
                className="px-4 py-2 text-white rounded hover:opacity-90 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#F96302' }}
              >
                创建 QR
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🔥 提交采购弹窗 */}
      <SubmitToProcurementDialog
        open={showSubmitDialog}
        onClose={() => { setShowSubmitDialog(false); setSelectedQR(null); }}
        requirement={selectedQR}
        onSubmit={handleConfirmSubmit}
      />

      {/* 🔥 查看采购需求单详情弹窗 */}
      {showViewModal && selectedQR && (
        <ProcurementDocumentViewerShell
          open={showViewModal}
          onClose={() => { setShowViewModal(false); setSelectedQR(null); }}
          title="报价请求单"
          subtitle={normalizeLegacyQrNumber(selectedQR?.requirementNo || '') || selectedQR?.sourceInquiryNumber || ''}
          templateLabel={
            selectedQR?.templateSnapshot?.version ||
            selectedQR?.template_snapshot?.version ||
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
                  if (!qrPreviewRef.current) return;
                  const filename = generatePDFFilename('QR', normalizeLegacyQrNumber(selectedQR?.requirementNo) || 'QR');
                  await exportToPDF(qrPreviewRef.current, filename);
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
                  if (!qrPreviewRef.current) return;
                  const filename = generatePDFFilename('QR', normalizeLegacyQrNumber(selectedQR?.requirementNo) || 'QR');
                  await exportToPDFPrint(qrPreviewRef.current, filename);
                }}
              >
                <FileText className="h-4 w-4" />
                打印
              </Button>
            </>
          }
        >
          {previewDocumentData ? (
            <div ref={qrPreviewRef}>
              <QuoteRequirementDocumentA4Pages
                data={
                  sanitizeQuoteRequirementDocumentForSales(
                    previewDocumentData,
                    selectedQR?.purchaserFeedback,
                    previewSanitizeRole === 'Sales_Rep' ? 'Sales_Rep' : previewSanitizeRole,
                  ) || previewDocumentData
                }
                showRelationBanner={false}
              />
            </div>
          ) : null}
        </ProcurementDocumentViewerShell>
      )}

      {/* 🔥 智能报价创建弹窗 */}
      {showQuoteCreation && selectedQRForQuote && (
        <QuoteCreationIntelligent
          requirementNo={selectedQRForQuote.requirementNo}
          requirement={selectedQRForQuote}
          onClose={() => {
            setShowQuoteCreation(false);
            setSelectedQRForQuote(null);
          }}
          onSubmit={async (quoteData) => {
            try {
            const quotationOwner = resolveQuotationOwner(selectedQRForQuote);
            // 🔥 转换为 SalesQuotation 格式并保存到 Context
            const salesQuotation = {
              id: `sq-${Date.now()}`,
              qtNumber: quoteData.qtNumber || quoteData.quoteNo,
              qrNumber: quoteData.qrNumber || quoteData.requirementNo,
              inqNumber: quoteData.inquiryNo || '',
              
              region: quoteData.region || 'NA',
              customerName: quoteData.customerName || '',
              customerEmail: quoteData.customerEmail || '',
              customerCompany: quoteData.customerName || '',
              
              salesPerson: quotationOwner.email || currentUser?.email || '',
              salesPersonName: quotationOwner.name || currentUser?.name || '',
              
              items: quoteData.items || [],
              
              // 🔥 财务汇总数据（使用智能核算的准确数据）
              totalCost: quoteData.totalCost,
              totalPrice: quoteData.totalAmount,
              totalProfit: quoteData.totalProfit,
                profitRate: quoteData.profitRate ?? quoteData.profitMargin,
              totalAmount: quoteData.totalAmount, // 🔥 兼容字段
                pricingDefaults: quoteData.pricingDefaults ?? quoteData.globalDefaults ?? null,
                globalDefaults: quoteData.pricingDefaults ?? quoteData.globalDefaults ?? null,
              
              currency: 'USD',
              paymentTerms: '30% T/T in advance, 70% before shipment',
              deliveryTerms: 'FOB Xiamen',
              deliveryDate: '',
              
              approvalStatus: 'draft' as const,
              approvalChain: [],
              customerStatus: 'not_sent' as const,
              
              validUntil: new Date(Date.now() + quoteData.validityDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              version: 1,
              
              createdAt: quoteData.createdAt || new Date().toISOString(),
              updatedAt: quoteData.updatedAt || new Date().toISOString(),
              notes: quoteData.approvalNotes || ''
            };

              await addSalesQuotation(salesQuotation);

              // Supabase 强校验：确认该 QR 的 QT 已可查询
              const verifyRows = await salesQuotationService.getByQrNumber(salesQuotation.qrNumber);
              const persisted = Array.isArray(verifyRows) && verifyRows.some((row: any) =>
                String(row?.qtNumber || '') === String(salesQuotation.qtNumber)
              );
              if (!persisted) {
                throw new Error(`QT ${salesQuotation.qtNumber} 未在 Supabase 查询到，已阻断假成功`);
              }

              await persistQuotationPushState(selectedQRForQuote, salesQuotation.qtNumber);
            
            toast.success('报价已创建！', {
              description: `报价单号：${quoteData.quoteNo}\n总额：$${quoteData.totalAmount.toFixed(2)}\n利润率：${quoteData.profitMargin.toFixed(1)}%`,
              duration: 3000
            });
            setShowQuoteCreation(false);
            setSelectedQRForQuote(null);
            } catch (err: any) {
              toast.error('创建报价失败', {
                description: err?.message || 'Supabase 写入失败',
              });
            }
          }}
        />
      )}
    </div>
  );
}
