// 🔥 供应商订单管理中心 - 台湾大厂专业版
// 整合：询价 → 报价 → 在制订单 → 历史订单

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Checkbox } from '../ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { 
  LayoutGrid, FileText, Calculator, Package, Clock, CheckCircle2, 
  XCircle, AlertCircle, Search, Filter, Eye, Download, Printer,
  ArrowRight, TrendingUp, DollarSign, Calendar, Truck, Factory,
  Trash2, CheckSquare, FileCheck, Send, Archive, BarChart3, RefreshCw,
  Settings, TrendingDown, Receipt, Users, Activity, Percent, AlertTriangle,
  ChevronDown, ChevronRight, Circle, X as XIcon, ShoppingCart
} from 'lucide-react';
import { toast } from 'sonner';
import { useUser } from '../../contexts/UserContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { getStoredAdminOrgProfile } from '../../contexts/AdminOrganizationContext';
import { useXJs } from '../../contexts/XJContext';
import { usePurchaseOrders } from '../../contexts/PurchaseOrderContext';
import { useQuoteRequirements } from '../../contexts/QuoteRequirementContext';
import XJDocumentViewer from './XJDocumentViewer';
import SupplierQuotationDocumentViewer from './SupplierQuotationDocumentViewer';
import SupplierQuotationEditor from './SupplierQuotationEditor';
import {
  createQuotationFromXJ,
  saveSupplierQuotation,
  type SupplierQuotation,
  type SupplierQuotationItem,
} from '../../utils/createQuotationFromXJ';
import { getFormalBusinessModelNo } from '../../utils/productModelDisplay';
import { inferSupplierDocumentLanguage, resolveFlowProductDisplay } from '../../utils/documentDataAdapters';
import { supplierQuotationService, templateCenterService } from '../../lib/supabaseService';
import { suppliersDatabase } from '../../data/suppliersData'; // 🔥 导入供应商数据库
import type { PurchaseOrderData } from '../documents/templates/PurchaseOrderDocument';
import { PurchaseOrderDocumentA4Pages } from '../documents/templates/paginated/PurchaseOrderDocumentA4';
import { ProcurementDocumentViewerShell } from '../admin/purchase-order/ProcurementDocumentViewerShell';
import { exportToPDF, exportToPDFPrint, generatePDFFilename } from '../../utils/pdfExport';
import { purchaseOrderExecutionStatusService } from '../../lib/services/purchaseOrderExecutionStatusService';
import {
  SUPPLIER_DOCUMENT_PREVIEW_BODY_CLASS,
  SUPPLIER_DOCUMENT_PREVIEW_INNER_CLASS,
} from './documentPreviewStandards';

// 🔥 统计数据接口
interface OrderStats {
  pendingRFQs: number;
  draftQuotations: number;
  submittedQuotations: number;
  activeOrders: number;
  completedOrders: number;
  totalValue: number;
}

interface ProductSummary {
  representativeName: string;
  representativeModel: string;
  representativeSpec: string;
  productCount: number;
  totalQuantity: number;
  quantityUnit: string;
}

const EMPTY_DISPLAY_TOKENS = new Set(['', '-', '—', 'N/A', 'NA', 'NULL', 'UNDEFINED']);
const SUPPLIER_PORTAL_CUSTOMER_PLACEHOLDERS = new Set(['COSUN采购', 'COSUN贸易', '福建高盛达富建材有限公司']);

export default function SupplierOrderManagementCenter() {
  const { user } = useUser();
  const { org } = useOrganization();
  const { xjs, getXJsBySupplier, updateXJ, addQuoteToXJ, refreshMineFromBackend } = useXJs();
  const { purchaseOrders, updatePurchaseOrder } = usePurchaseOrders();
  const { requirements } = useQuoteRequirements();
  const HIDDEN_XJ_IDS_KEY = 'supplierHiddenXJIds';
  const HIDDEN_QUOTATION_IDS_KEY = 'supplierHiddenQuotationIds';
  
  // 🔥 获取完整的供应商信息（从suppliersDatabase）
  const supplierInfo = useMemo(() => {
    if (!user?.email) return null;

    const supplier = suppliersDatabase.find(s => s.email === user.email);
    const mergedName = org?.name && org.name !== '供应商公司'
      ? org.name
      : supplier?.name || user.company || user.name || '供应商';
    const mergedNameEn = org?.nameEn && org.nameEn !== 'Supplier Co.'
      ? org.nameEn
      : supplier?.nameEn || mergedName;
    const mergedAddress = org?.address || supplier?.address || user.address || '供应商地址';
    const mergedPhone = org?.phone || supplier?.phone || user.phone || '';
    const mergedContact = org?.contactPerson || supplier?.contact || user.name || '联系人';
    const mergedCompany = mergedName;
    const domesticHint = [
      mergedName,
      mergedNameEn,
      mergedAddress,
      supplier?.region,
      user.company,
      user.address,
    ]
      .filter(Boolean)
      .join(' ');
    const isDomesticSupplier = /中国|广东|浙江|福建|江苏|上海|山东|东莞|佛山|温州|济南|宁波|杭州|深圳|苏州|china|guangdong|zhejiang|fujian|jiangsu|shanghai|shandong/i.test(domesticHint);

    return {
      ...(supplier || {}),
      email: user.email,
      name: mergedName,
      nameEn: mergedNameEn,
      company: mergedCompany,
      contact: mergedContact,
      phone: mergedPhone,
      address: mergedAddress,
      locale: isDomesticSupplier ? 'zh-CN' : (supplier as any)?.locale,
      countryCode: isDomesticSupplier ? 'CN' : (supplier as any)?.countryCode,
      isDomesticSupplier,
    };
  }, [org?.address, org?.contactPerson, org?.name, org?.nameEn, org?.phone, user]);

  const currentSupplierIdentity = useMemo(() => {
    const normalizeEmail = (value: unknown) => String(value || '').trim().toLowerCase();
    const normalizeCode = (value: unknown) => String(value || '').trim().toUpperCase();
    const normalizeName = (value: unknown) => String(value || '').trim();

    return {
      emails: new Set(
        [
          user?.email,
          supplierInfo?.email,
        ]
          .map(normalizeEmail)
          .filter(Boolean),
      ),
      codes: new Set(
        [
          (supplierInfo as any)?.code,
          user?.company,
        ]
          .map(normalizeCode)
          .filter(Boolean),
      ),
      names: new Set(
        [
          supplierInfo?.name,
          (supplierInfo as any)?.company,
          user?.company,
          user?.name,
        ]
          .map(normalizeName)
          .filter(Boolean),
      ),
    };
  }, [supplierInfo, user?.company, user?.email, user?.name]);

  const issuerFallbackName = useMemo(() => {
    const adminOrg = getStoredAdminOrgProfile();
    return (
      String(adminOrg?.nameCN || '').trim() ||
      String(adminOrg?.nameEN || '').trim() ||
      'COSUN采购'
    );
  }, []);

  const normalizeDisplayText = (
    value: unknown,
    options: { ignoreSupplierPortalDefaults?: boolean } = {},
  ) => {
    const text = String(value ?? '').trim();
    if (!text) return '';
    if (EMPTY_DISPLAY_TOKENS.has(text.toUpperCase())) return '';
    if (options.ignoreSupplierPortalDefaults && SUPPLIER_PORTAL_CUSTOMER_PLACEHOLDERS.has(text)) {
      return '';
    }
    return text;
  };

  const pickDisplayText = (
    values: unknown[],
    options: { ignoreSupplierPortalDefaults?: boolean } = {},
  ) => {
    for (const value of values) {
      const normalized = normalizeDisplayText(value, options);
      if (normalized) return normalized;
    }
    return '';
  };

  const supplierProductLanguage = useMemo<'zh' | 'en'>(() => {
    return inferSupplierDocumentLanguage({
      supplierCountryCode: (supplierInfo as any)?.countryCode,
      supplierLocale: (supplierInfo as any)?.locale,
      supplierRegion: (supplierInfo as any)?.region,
      supplierAddress: (supplierInfo as any)?.address || user?.address,
      supplierName: supplierInfo?.name || (supplierInfo as any)?.company || user?.company,
      isDomesticSupplier: (supplierInfo as any)?.isDomesticSupplier,
      supplierProfile: supplierInfo,
      supplier: supplierInfo,
    });
  }, [supplierInfo, user?.address, user?.company]);

  const supplierUiLanguage = supplierProductLanguage;
  const supplierUiCopy = useMemo(() => ({
    overviewSecondary: supplierUiLanguage === 'zh' ? '订单总览' : 'Overview',
    xjSecondaryLabel: supplierUiLanguage === 'zh' ? '采购询价' : 'Quotation Request',
    qtSecondaryLabel: supplierUiLanguage === 'zh' ? '报价单' : 'Quotation',
    activeSecondaryLabel: supplierUiLanguage === 'zh' ? '进行中' : 'Active',
    historySecondaryLabel: supplierUiLanguage === 'zh' ? '已完成' : 'History',
    view: supplierUiLanguage === 'zh' ? '查看' : 'View',
    delete: supplierUiLanguage === 'zh' ? '删除' : 'Delete',
    pendingQuote: supplierUiLanguage === 'zh' ? '待报价' : 'Pending Quote',
    pushed: supplierUiLanguage === 'zh' ? '已下推' : 'Pushed',
    pushQuote: supplierUiLanguage === 'zh' ? '下推报价' : 'Push Quote',
    orderOverviewDashboard: supplierUiLanguage === 'zh' ? '订单总览看板' : 'Order Overview Dashboard',
    weeklyTrend: supplierUiLanguage === 'zh' ? '每周趋势' : 'Weekly Trend',
    categoryDistribution: supplierUiLanguage === 'zh' ? '类别分布' : 'Category Distribution',
    finalExecution: supplierUiLanguage === 'zh' ? '可执行版本' : 'Final Execution',
    historicalRevision: supplierUiLanguage === 'zh' ? '历史修订版本' : 'Historical Revision',
    supplierHistoryOrders: supplierUiLanguage === 'zh' ? '供应商历史订单' : 'Supplier Historical Orders',
  }), [supplierUiLanguage]);

  const matchesCurrentSupplier = React.useCallback((record: any) => {
    const emailCandidates = [
      record?.supplierEmail,
      record?.supplier_email,
      record?.createdBy,
      record?.created_by,
      record?.operatorEmail,
      record?.operator_email,
    ]
      .map((value) => String(value || '').trim().toLowerCase())
      .filter(Boolean);
    if (emailCandidates.some((value) => currentSupplierIdentity.emails.has(value))) {
      return true;
    }

    const codeCandidates = [
      record?.supplierCode,
      record?.supplier_code,
      record?.supplierCompanyId,
      record?.supplier_company_id,
    ]
      .map((value) => String(value || '').trim().toUpperCase())
      .filter(Boolean);
    if (codeCandidates.some((value) => currentSupplierIdentity.codes.has(value))) {
      return true;
    }

    const nameCandidates = [
      record?.supplierName,
      record?.supplier_name,
      record?.supplierCompany,
      record?.supplier_company,
    ]
      .map((value) => String(value || '').trim())
      .filter(Boolean);
    return nameCandidates.some((value) => currentSupplierIdentity.names.has(value));
  }, [currentSupplierIdentity]);
  
  // 🔥 供应商报价单 — Supabase-first
  const [supplierQuotations, setSupplierQuotations] = useState<SupplierQuotation[]>([]);

  // 从 Supabase 加载当前供应商的报价单，并定期刷新同步状态
  React.useEffect(() => {
    if (!user?.email) return;
    const load = async () => {
      try {
        const directRows = await supplierQuotationService.getBySupplierEmail(user.email);
        const directList = Array.isArray(directRows) ? (directRows as SupplierQuotation[]) : [];
        if (directList.length > 0) {
          setSupplierQuotations(directList.filter(matchesCurrentSupplier));
          return;
        }

        const allRows = await supplierQuotationService.getAll();
        const allList = Array.isArray(allRows) ? (allRows as SupplierQuotation[]) : [];
        setSupplierQuotations(allList.filter(matchesCurrentSupplier));
      } catch (e: any) {
        console.warn('⚠️ [SupplierOrderMgmt] 加载报价单失败:', e?.message);
      }
    };
    void load();
    const interval = setInterval(load, 10000); // 每10秒刷新
    return () => clearInterval(interval);
  }, [matchesCurrentSupplier, user?.email]);
  
  // Tab状态
  const [activeTab, setActiveTab] = useState<'overview' | 'xj' | 'qt' | 'active-orders' | 'history'>('overview');

  // ✅ When supplier opens "客户需求", actively fetch from backend so Network shows the request.
  React.useEffect(() => {
    if (activeTab === 'xj') {
      void refreshMineFromBackend({ force: true });
    }
  }, [activeTab, refreshMineFromBackend]);
  
  // 搜索和筛选
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  
  // 对话框状态
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [documentViewerOpen, setDocumentViewerOpen] = useState(false);
  const [quotationDocumentViewerOpen, setQuotationDocumentViewerOpen] = useState(false);
  const [quotationEditorOpen, setQuotationEditorOpen] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState<any>(null);
  const [purchaseOrderViewerOpen, setPurchaseOrderViewerOpen] = useState(false);
  const [selectedSupplierOrder, setSelectedSupplierOrder] = useState<any>(null);
  const [exportingPurchaseOrder, setExportingPurchaseOrder] = useState(false);
  const [activeOrderActionKey, setActiveOrderActionKey] = useState<string | null>(null);
  const purchaseOrderDocumentRef = useRef<HTMLDivElement>(null);
  
  // 核算报价弹窗状态（editingQuotationId 驱动，quotationEditorOpen 已在上方声明）
  const [editingQuotationId, setEditingQuotationId] = useState<string | null>(null);
  const [latestXjPublishedVersion, setLatestXjPublishedVersion] = useState<string | null>(null);

  const openQuotationEditor = (id: string) => {
    // Set the quotation to edit, then reuse the existing quotationEditorOpen dialog
    const q = supplierQuotations.find(sq => sq.id === id) ?? null;
    setSelectedQuotation(q);
    setEditingQuotationId(id);
    setQuotationEditorOpen(true);
  };
  const closeQuotationEditor = () => {
    setQuotationEditorOpen(false);
    setEditingQuotationId(null);
  };

  const selectedSupplierOrderDocumentData = useMemo<PurchaseOrderData | null>(() => {
    if (!selectedSupplierOrder) return null;
    return (
      selectedSupplierOrder.documentDataSnapshot ||
      selectedSupplierOrder.document_data_snapshot ||
      selectedSupplierOrder.rawPO?.documentDataSnapshot ||
      selectedSupplierOrder.rawPO?.document_data_snapshot ||
      null
    ) as PurchaseOrderData | null;
  }, [selectedSupplierOrder]);

  const selectedSupplierOrderTemplateLabel = useMemo(() => {
    if (!selectedSupplierOrderDocumentData) return '默认采购合同模板';
    return selectedSupplierOrderDocumentData.templateSettings?.productTableColumns?.length
      ? '统一采购合同模板'
      : '默认采购合同模板';
  }, [selectedSupplierOrderDocumentData]);

  const openPurchaseOrderViewer = React.useCallback((order: any) => {
    setSelectedSupplierOrder(order);
    setPurchaseOrderViewerOpen(true);
  }, []);

  const applySupplierOrderExecutionUpdate = React.useCallback(async (
    order: any,
    payload: Record<string, any>,
    successMessage: string,
  ) => {
    if (!order?.id) return;

    const actionKey = `${order.id}:${payload.executionStatus || payload.action || 'update'}`;
    try {
      setActiveOrderActionKey(actionKey);
      await purchaseOrderExecutionStatusService.upsertByPurchaseOrderId(order.id, payload);
      await updatePurchaseOrder(order.id, {
        ...payload,
        updatedDate: new Date().toISOString(),
      });
      toast.success(successMessage);
    } catch (error) {
      console.error('更新供应商执行状态失败:', error);
      toast.error(error instanceof Error ? error.message : '更新执行状态失败');
    } finally {
      setActiveOrderActionKey(null);
    }
  }, [updatePurchaseOrder]);

  const handleSupplierConfirmOrder = React.useCallback(async (order: any) => {
    const now = new Date().toISOString();
    await applySupplierOrderExecutionUpdate(order, {
      executionStatus: 'supplier_confirmed',
      supplierConfirmedAt: now,
      supplierReplyNotes: `${String(user?.name || supplierInfo?.contact || supplierInfo?.name || '供应商').trim()} 已确认接单`,
    }, '已确认接单');
  }, [applySupplierOrderExecutionUpdate, supplierInfo?.contact, supplierInfo?.name, user?.name]);

  const handleSupplierRejectOrder = React.useCallback(async (order: any) => {
    if (!window.confirm(`确认拒绝接收订单 ${order?.poNumber || order?.cgNumber || ''} 吗？`)) return;
    const now = new Date().toISOString();
    await applySupplierOrderExecutionUpdate(order, {
      supplierRejectedAt: now,
      supplierReplyNotes: `${String(user?.name || supplierInfo?.contact || supplierInfo?.name || '供应商').trim()} 已拒绝接单`,
    }, '已记录拒绝接单');
  }, [applySupplierOrderExecutionUpdate, supplierInfo?.contact, supplierInfo?.name, user?.name]);

  const handleSupplierSubmitSelfInspection = React.useCallback(async (order: any) => {
    await applySupplierOrderExecutionUpdate(order, {
      executionStatus: 'supplier_self_inspection_submitted',
      supplierSelfInspectionStatus: 'submitted',
    }, '已提交自检');
  }, [applySupplierOrderExecutionUpdate]);

  const handleSupplierMarkFinishedGoods = React.useCallback(async (order: any) => {
    const now = new Date().toISOString();
    await applySupplierOrderExecutionUpdate(order, {
      executionStatus: 'finished_goods_ready',
      finishedGoodsConfirmedAt: now,
    }, '已确认完货');
  }, [applySupplierOrderExecutionUpdate]);

  const resolveSupplierExecutionStage = React.useCallback((order: any) => {
    const explicitExecutionStatus = String(order.executionStatus || '').trim();
    const procurementRequestStatus = String(order.procurementRequestStatus || '').trim();
    const poStatus = String(order.status || '').trim();
    const supplierSelfInspectionStatus = String(order.supplierSelfInspectionStatus || '').trim().toLowerCase();

    if (order.finishedGoodsConfirmedAt) return 'finished_goods_ready';
    if (supplierSelfInspectionStatus === 'submitted') return 'supplier_self_inspection_submitted';
    if (order.supplierConfirmedAt) return 'supplier_confirmed';
    if (order.supplierRejectedAt) return 'supplier_rejected';

    if ([
      'supplier_pending_confirmation',
      'supplier_confirmed',
      'sampling',
      'in_production',
      'supplier_self_inspection_pending',
      'supplier_self_inspection_submitted',
      'qc_pending',
      'qc_passed',
      'qc_failed',
      'finished_goods_ready',
      'awaiting_loading',
      'loaded',
      'shipped',
      'completed',
    ].includes(explicitExecutionStatus)) {
      return explicitExecutionStatus;
    }

    if (procurementRequestStatus === 'pushed_supplier') {
      return 'supplier_pending_confirmation';
    }

    if (poStatus === 'producing') {
      return 'in_production';
    }

    return '';
  }, []);

  const getSupplierOrderActionConfig = React.useCallback((order: any) => {
    const executionStatus = resolveSupplierExecutionStage(order);
    switch (executionStatus) {
      case 'supplier_pending_confirmation':
        return [
          { key: 'confirm', label: '确认接单', onClick: () => handleSupplierConfirmOrder(order) },
          { key: 'reject', label: '拒绝接单', onClick: () => handleSupplierRejectOrder(order), variant: 'outline' as const },
        ];
      case 'supplier_confirmed':
      case 'sampling':
      case 'in_production':
      case 'supplier_self_inspection_pending':
        return [
          { key: 'self-inspection', label: '提交自检', onClick: () => handleSupplierSubmitSelfInspection(order) },
        ];
      case 'supplier_self_inspection_submitted':
      case 'qc_passed':
        return [
          { key: 'finished-goods', label: '确认完货', onClick: () => handleSupplierMarkFinishedGoods(order) },
        ];
      default:
        return [];
    }
  }, [
    handleSupplierConfirmOrder,
    handleSupplierMarkFinishedGoods,
    handleSupplierRejectOrder,
    handleSupplierSubmitSelfInspection,
    resolveSupplierExecutionStage,
  ]);

  useEffect(() => {
    let active = true;
    templateCenterService
      .getVersionHistory('xj')
      .then((history: any[]) => {
        if (!active) return;
        const latest = history.find((record) => record.status === 'published') || history[0] || null;
        setLatestXjPublishedVersion(latest?.version || null);
      })
      .catch(() => {
        if (active) setLatestXjPublishedVersion(null);
      });
    return () => {
      active = false;
    };
  }, []);

  const getXJBoundVersion = (xj: any) =>
    String(
      xj?.templateSnapshot?.version?.version ||
      xj?.templateSnapshot?.version?.version_label ||
      xj?.templateSnapshot?.version?.versionLabel ||
      xj?.template_snapshot?.version?.version ||
      xj?.template_snapshot?.version?.version_label ||
      xj?.template_snapshot?.version?.versionLabel ||
      xj?.templateVersion ||
      xj?.template_version ||
      '',
    ).trim() || null;

  // Esc 关闭核算报价弹窗
  useEffect(() => {
    if (!quotationEditorOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeQuotationEditor(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [quotationEditorOpen]);

  // 批量选择
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [expandedOrderIds, setExpandedOrderIds] = useState<string[]>([]);
  const [expandedRFQIds, setExpandedRFQIds] = useState<string[]>([]);
  const [hiddenXJIds, setHiddenXJIds] = useState<Set<string>>(new Set());
  const [hiddenQuotationIds, setHiddenQuotationIds] = useState<Set<string>>(new Set());
  const hasManualHideInSessionRef = React.useRef(false);
  const supplierLinkageBackfillAttemptedRef = React.useRef<Set<string>>(new Set());

  const formatCompactUtcMinute = React.useCallback((raw: string | undefined) => {
    if (!raw) return '—';
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return raw;
    const yy = String(d.getUTCFullYear()).slice(-2);
    const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(d.getUTCDate()).padStart(2, '0');
    const hh = String(d.getUTCHours()).padStart(2, '0');
    const mi = String(d.getUTCMinutes()).padStart(2, '0');
    return `${yy}${mm}${dd} UTC ${hh}:${mi}`;
  }, []);

  const loadHiddenXJIds = React.useCallback((email?: string) => {
    if (!email) return new Set<string>();
    try {
      const raw = localStorage.getItem(HIDDEN_XJ_IDS_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      const ids = Array.isArray(parsed?.[email]) ? parsed[email] : [];
      return new Set(ids.map((v: any) => String(v)));
    } catch {
      return new Set<string>();
    }
  }, []);

  const persistHiddenXJIds = React.useCallback((next: Set<string>) => {
    const email = user?.email;
    if (!email) return;
    try {
      const raw = localStorage.getItem(HIDDEN_XJ_IDS_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      parsed[email] = Array.from(next);
      localStorage.setItem(HIDDEN_XJ_IDS_KEY, JSON.stringify(parsed));
    } catch {
      // ignore local persistence failures
    }
  }, [user?.email]);

  React.useEffect(() => {
    setHiddenXJIds(loadHiddenXJIds(user?.email));
    hasManualHideInSessionRef.current = false;
  }, [user?.email, loadHiddenXJIds]);

  const loadHiddenQuotationIds = React.useCallback((email?: string) => {
    if (!email) return new Set<string>();
    try {
      const raw = localStorage.getItem(HIDDEN_QUOTATION_IDS_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      const ids = Array.isArray(parsed?.[email]) ? parsed[email] : [];
      return new Set(ids.map((v: any) => String(v)));
    } catch {
      return new Set<string>();
    }
  }, []);

  const persistHiddenQuotationIds = React.useCallback((next: Set<string>) => {
    const email = user?.email;
    if (!email) return;
    try {
      const raw = localStorage.getItem(HIDDEN_QUOTATION_IDS_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      parsed[email] = Array.from(next);
      localStorage.setItem(HIDDEN_QUOTATION_IDS_KEY, JSON.stringify(parsed));
    } catch {
      // ignore local persistence failures
    }
  }, [user?.email]);

  React.useEffect(() => {
    setHiddenQuotationIds(loadHiddenQuotationIds(user?.email));
  }, [user?.email, loadHiddenQuotationIds]);

  const hideXJsForCurrentSupplier = React.useCallback((ids: string[]) => {
    if (!ids.length) return;
    hasManualHideInSessionRef.current = true;
    const next = new Set(hiddenXJIds);
    ids.forEach((id) => next.add(String(id)));
    setHiddenXJIds(next);
    persistHiddenXJIds(next);
    setSelectedIds([]);
  }, [hiddenXJIds, persistHiddenXJIds]);

  const clearHiddenXJIdsForCurrentSupplier = React.useCallback(() => {
    const next = new Set<string>();
    setHiddenXJIds(next);
    persistHiddenXJIds(next);
  }, [persistHiddenXJIds]);

  const hideQuotationsForCurrentSupplier = React.useCallback((ids: string[]) => {
    if (!ids.length) return;
    const next = new Set(hiddenQuotationIds);
    ids.forEach((id) => next.add(String(id)));
    setHiddenQuotationIds(next);
    persistHiddenQuotationIds(next);
    setSelectedIds([]);
  }, [hiddenQuotationIds, persistHiddenQuotationIds]);

  const clearHiddenQuotationIdsForCurrentSupplier = React.useCallback(() => {
    const next = new Set<string>();
    setHiddenQuotationIds(next);
    persistHiddenQuotationIds(next);
  }, [persistHiddenQuotationIds]);

  // 统一行内产品展示：只显示代表产品 + 总产品数 + 总数量
  const summarizeProducts = React.useCallback((products?: any[], fallback?: any): ProductSummary => {
    const list = Array.isArray(products) ? products.filter(Boolean) : [];
    if (list.length > 0) {
      const first = list[0] || {};
      const normalizedFirst = resolveFlowProductDisplay(first, supplierProductLanguage);
      const totalQuantity = list.reduce((sum, p) => sum + (Number(p?.quantity) || 0), 0);
      const uniqueUnits = Array.from(new Set(list.map(p => String(p?.unit || '').trim()).filter(Boolean)));
      const quantityUnit = uniqueUnits.length === 1 ? uniqueUnits[0] : 'PCS';
      return {
        representativeName: normalizedFirst.productName || first.productName || first.description || 'N/A',
        representativeModel: getFormalBusinessModelNo(first) || '',
        representativeSpec: normalizedFirst.specification || first.specification || '',
        productCount: list.length,
        totalQuantity,
        quantityUnit,
      };
    }
    const normalizedFallback = fallback ? resolveFlowProductDisplay(fallback, supplierProductLanguage) : null;
    return {
      representativeName: normalizedFallback?.productName || fallback?.productName || 'N/A',
      representativeModel: getFormalBusinessModelNo(fallback) || '',
      representativeSpec: normalizedFallback?.specification || fallback?.specification || '',
      productCount: 1,
      totalQuantity: Number(fallback?.quantity) || 0,
      quantityUnit: fallback?.unit || 'PCS',
    };
  }, [supplierProductLanguage]);

  const normalizeSupplierProduct = React.useCallback((product: any) => {
    return resolveFlowProductDisplay(product, supplierProductLanguage);
  }, [supplierProductLanguage]);

  const getOrderItemsForDisplay = React.useCallback((order: any) => {
    const directItems = Array.isArray(order?.items) ? order.items.filter(Boolean) : [];
    if (directItems.length > 0) return directItems;

    const snapshot = order?.documentDataSnapshot || order?.document_data_snapshot || {};
    const snapshotItems = [
      ...(Array.isArray(snapshot?.items) ? snapshot.items : []),
      ...(Array.isArray(snapshot?.products) ? snapshot.products : []),
      ...(Array.isArray(snapshot?.productList) ? snapshot.productList : []),
    ].filter(Boolean);

    return snapshotItems;
  }, []);

  const toggleOrderExpanded = React.useCallback((orderId: string) => {
    setExpandedOrderIds((prev) =>
      prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]
    );
  }, []);

  const toggleRFQExpanded = React.useCallback((xjId: string) => {
    setExpandedRFQIds((prev) =>
      prev.includes(xjId) ? prev.filter((id) => id !== xjId) : [...prev, xjId]
    );
  }, []);

  const setRFQExpanded = React.useCallback((xjId: string, expanded: boolean) => {
    setExpandedRFQIds((prev) => {
      const exists = prev.includes(xjId);
      if (expanded && !exists) return [...prev, xjId];
      if (!expanded && exists) return prev.filter((id) => id !== xjId);
      return prev;
    });
  }, []);

  const formatBusinessDate = React.useCallback((raw: string | undefined) => {
    if (!raw) return '—';
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return raw;
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(d);
  }, []);

  const formatBusinessDateTime = React.useCallback((raw: string | undefined) => {
    if (!raw) return '—';
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return raw;
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(d);
  }, []);

  const formatExecutionBaseline = React.useCallback((doc: any) => {
    const baseline = doc?.documentRenderMeta?.projectExecutionBaseline
      || doc?.document_render_meta?.projectExecutionBaseline
      || (doc?.projectRevisionId
        ? {
            projectCode: doc?.projectCode || null,
            projectName: doc?.projectName || null,
            projectRevisionCode: doc?.projectRevisionCode || null,
            finalQuotationNumber: doc?.finalQuotationNumber || null,
          }
        : null);
    if (!baseline || !(baseline.projectCode || baseline.projectName || baseline.projectRevisionCode)) {
      return null;
    }
    return `${baseline.projectCode || baseline.projectName || '项目'} / ${baseline.projectRevisionCode || 'Rev'}${baseline.finalQuotationNumber ? ` / ${baseline.finalQuotationNumber}` : ''}`;
  }, []);

  const resolveProjectExecutionBaseline = React.useCallback((doc: any) => {
    return doc?.documentRenderMeta?.projectExecutionBaseline
      || doc?.document_render_meta?.projectExecutionBaseline
      || (doc?.projectRevisionId
        ? {
            projectId: doc?.projectId || null,
            projectCode: doc?.projectCode || null,
            projectName: doc?.projectName || null,
            projectRevisionId: doc?.projectRevisionId || null,
            projectRevisionCode: doc?.projectRevisionCode || null,
            projectRevisionStatus: doc?.projectRevisionStatus || null,
            finalRevisionId: doc?.finalRevisionId || null,
            finalQuotationId: doc?.finalQuotationId || null,
            finalQuotationNumber: doc?.finalQuotationNumber || null,
            quotationRole: doc?.quotationRole || null,
          }
        : null);
  }, []);

  const isFinalExecutionReady = React.useCallback((doc: any) => {
    const baseline = resolveProjectExecutionBaseline(doc);
    if (!baseline?.projectRevisionId) return true;
    return Boolean(
      baseline.projectRevisionStatus === 'final' &&
      baseline.finalRevisionId &&
      baseline.finalRevisionId === baseline.projectRevisionId &&
      (baseline.finalQuotationNumber || baseline.finalQuotationId)
    );
  }, [resolveProjectExecutionBaseline]);

  const supplierPortalOrders = useMemo(() => {
    if (!user?.email) return [];

    const normalizedEmail = String(user.email || '').trim().toLowerCase();
    const supplierNames = new Set(
      [
        supplierInfo?.name,
        supplierInfo?.company,
        user?.company,
        user?.name,
      ]
        .map((value) => String(value || '').trim())
        .filter(Boolean)
    );

    return purchaseOrders.filter((po) => {
      const documentType = String(po.documentType || '').trim().toUpperCase();
      const poNumber = String(po.poNumber || '').trim().toUpperCase();
      const supplierEmail = String((po as any).supplierEmail || '').trim().toLowerCase();
      const supplierCode = String(po.supplierCode || '').trim().toLowerCase();
      const supplierName = String(po.supplierName || '').trim();
      const belongsToSupplier =
        supplierEmail === normalizedEmail ||
        supplierCode === normalizedEmail ||
        supplierNames.has(supplierName);

      const isSupplierOrder =
        documentType === 'CG' ||
        poNumber.startsWith('CG-') ||
        Boolean(po.parentRequestPoNumber);

      return belongsToSupplier && isSupplierOrder;
    });
  }, [purchaseOrders, supplierInfo?.company, supplierInfo?.name, user?.company, user?.email, user?.name]);

  const activeSupplierOrders = useMemo(() => {
    return supplierPortalOrders.filter((po) => {
      const executionStatus = resolveSupplierExecutionStage(po);
      const poStatus = String(po.status || '').trim();

      if (['completed', 'cancelled'].includes(poStatus)) return false;
      if (['completed', 'shipped'].includes(executionStatus)) return false;

      return [
        'supplier_pending_confirmation',
        'supplier_confirmed',
        'supplier_rejected',
        'sampling',
        'in_production',
        'supplier_self_inspection_pending',
        'supplier_self_inspection_submitted',
        'qc_pending',
        'qc_passed',
        'qc_failed',
        'finished_goods_ready',
        'awaiting_loading',
        'loaded',
      ].includes(executionStatus);
    });
  }, [resolveSupplierExecutionStage, supplierPortalOrders]);

  const historySupplierOrders = useMemo(() => {
    return supplierPortalOrders.filter((po) => {
      const executionStatus = resolveSupplierExecutionStage(po);
      const poStatus = String(po.status || '').trim();
      return ['completed', 'cancelled'].includes(poStatus) || ['shipped', 'completed'].includes(executionStatus);
    });
  }, [resolveSupplierExecutionStage, supplierPortalOrders]);

  const getSupplierOrderStatusBadge = React.useCallback((order: any) => {
    const executionStatus = resolveSupplierExecutionStage(order);
    const poStatus = String(order.status || '').trim();

    switch (executionStatus) {
      case 'supplier_pending_confirmation':
        return { label: '待确认接单', className: 'bg-yellow-100 text-yellow-800 border-yellow-300' };
      case 'supplier_confirmed':
        return { label: '已确认接单', className: 'bg-green-100 text-green-800 border-green-300' };
      case 'supplier_rejected':
        return { label: '已拒绝接单', className: 'bg-rose-100 text-rose-800 border-rose-300' };
      case 'sampling':
        return { label: '产前样处理中', className: 'bg-sky-100 text-sky-800 border-sky-300' };
      case 'in_production':
        return { label: '生产中', className: 'bg-blue-100 text-blue-800 border-blue-300' };
      case 'supplier_self_inspection_pending':
        return { label: '待提交自检', className: 'bg-cyan-100 text-cyan-800 border-cyan-300' };
      case 'supplier_self_inspection_submitted':
        return { label: '已提交自检', className: 'bg-teal-100 text-teal-800 border-teal-300' };
      case 'qc_pending':
        return { label: '待验货', className: 'bg-violet-100 text-violet-800 border-violet-300' };
      case 'qc_passed':
        return { label: '验货通过', className: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
      case 'qc_failed':
        return { label: '验货异常', className: 'bg-rose-100 text-rose-800 border-rose-300' };
      case 'finished_goods_ready':
        return { label: '成品待出货', className: 'bg-indigo-100 text-indigo-800 border-indigo-300' };
      case 'awaiting_loading':
        return { label: '待装柜', className: 'bg-orange-100 text-orange-800 border-orange-300' };
      case 'loaded':
        return { label: '已装柜', className: 'bg-lime-100 text-lime-800 border-lime-300' };
      case 'shipped':
        return { label: '已发货', className: 'bg-slate-100 text-slate-800 border-slate-300' };
      case 'completed':
        return { label: '已完成', className: 'bg-purple-100 text-purple-800 border-purple-300' };
      default:
        if (poStatus === 'cancelled') {
          return { label: '已取消', className: 'bg-red-100 text-red-800 border-red-300' };
        }
        if (poStatus === 'completed') {
          return { label: '已完成', className: 'bg-purple-100 text-purple-800 border-purple-300' };
        }
        if (poStatus === 'producing') {
          return { label: '生产中', className: 'bg-blue-100 text-blue-800 border-blue-300' };
        }
        if (poStatus === 'confirmed') {
          return { label: '已确认', className: 'bg-green-100 text-green-800 border-green-300' };
        }
        return { label: '待处理', className: 'bg-gray-100 text-gray-800 border-gray-300' };
    }
  }, [resolveSupplierExecutionStage]);

  const getSupplierOrderProgress = React.useCallback((order: any) => {
    const executionStatus = resolveSupplierExecutionStage(order);
    switch (executionStatus) {
      case 'supplier_pending_confirmation':
        return 5;
      case 'supplier_confirmed':
        return 15;
      case 'supplier_rejected':
        return 0;
      case 'sampling':
        return 30;
      case 'in_production':
        return 60;
      case 'supplier_self_inspection_pending':
        return 75;
      case 'supplier_self_inspection_submitted':
        return 85;
      case 'qc_pending':
        return 90;
      case 'qc_passed':
        return 95;
      case 'finished_goods_ready':
        return 97;
      case 'awaiting_loading':
        return 98;
      case 'loaded':
        return 99;
      case 'shipped':
      case 'completed':
        return 100;
      default:
        return String(order.status || '').trim() === 'producing' ? 60 : 0;
    }
  }, [resolveSupplierExecutionStage]);

  // 🔥 获取当前供应商的询价单
  const myXJs = useMemo(() => {
    if (!user?.email) {
      console.log('⚠️ [供应商订单管理中心] 用户未登录，无法获取采购询价');
      return [];
    }
    console.log('🔍 [供应商订单管理中心] 正在获取采购询价，供应商邮箱:', user.email);
    const directResult = getXJsBySupplier(user.email);
    const result = directResult.length > 0 ? directResult : xjs.filter(matchesCurrentSupplier);
    console.log('📦 [供应商订单管理中心] 获取到的采购询价数量:', result.length);
    if (result.length > 0) {
      console.log('  - 采购询价详情:', result.map(r => ({
        id: r.id,
        xjNo: r.supplierXjNo,
        status: r.status,
        supplier: r.supplierName
      })));
    }
    return result;
  }, [getXJsBySupplier, matchesCurrentSupplier, xjs, user?.email]);

  const syncXJQuoteFromBJ = React.useCallback(async (quotation: any, bjStatus: 'draft' | 'submitted' | 'accepted' | 'rejected' | 'completed') => {
    const relatedXJ = myXJs.find(r =>
      (r.supplierXjNo || r.xjNumber) === quotation.sourceXJ
    );
    if (!relatedXJ) return;
    const firstItem = quotation.items?.[0];
    await addQuoteToXJ(relatedXJ.id, {
      supplierCode: quotation.supplierEmail || supplierInfo?.email || user?.email || '',
      supplierName: quotation.supplierName || supplierInfo?.name || user?.name || '供应商',
      quotationNo: quotation.quotationNo,
      quotedDate: new Date().toISOString().split('T')[0],
      quotedPrice: quotation.totalAmount ?? 0,
      totalAmount: quotation.totalAmount ?? 0,
      unitPrice: firstItem?.unitPrice ?? 0,
      currency: quotation.currency || 'CNY',
      leadTime: firstItem?.leadTime ?? 0,
      moq: firstItem?.moq ?? 0,
      validityDays: 30,
      paymentTerms: quotation.paymentTerms || '',
      deliveryTerms: quotation.deliveryTerms || '',
      status: bjStatus,
      remarks: `报价单号: ${quotation.quotationNo}`,
    } as any);
  }, [myXJs, addQuoteToXJ, supplierInfo?.email, supplierInfo?.name, user?.email, user?.name]);

  const getXJRefKey = React.useCallback((xj: any) => {
    return String(xj?.supplierXjNo || xj?.xjNumber || '').trim();
  }, []);

  const findActiveQuotationForXJ = React.useCallback((xj: any, quotationList?: any[]) => {
    const xjKey = getXJRefKey(xj);
    if (!xjKey) return undefined;
    const list = Array.isArray(quotationList) ? quotationList : supplierQuotations;
    return list.find((q: any) => {
      const qKey = String(q?.sourceXJ || q?.xjNo || q?.xjNumber || '').trim();
      const byRef = qKey !== '' && qKey === xjKey;
      return byRef && matchesCurrentSupplier(q);
    });
  }, [getXJRefKey, matchesCurrentSupplier, supplierQuotations]);

  const getSingleSupplierMainlineFallback = React.useCallback((order: any) => {
    const renderMeta = order?.documentRenderMeta || order?.document_render_meta || {};
    const supplierPortalLinkage = renderMeta?.supplierPortalLinkage || {};
    const snapshot = order?.documentDataSnapshot || order?.document_data_snapshot || {};
    const editForm = snapshot?.editForm || {};
    const parentPoNumber = String(order?.parentRequestPoNumber || '').trim();
    const parentRequest = parentPoNumber
      ? purchaseOrders.find((po) => String(po?.poNumber || '').trim() === parentPoNumber)
      : null;
    const parentSnapshot = parentRequest?.documentDataSnapshot || parentRequest?.document_data_snapshot || {};
    const parentEditForm = parentSnapshot?.editForm || {};

    const internalInquiryRefs = [
      order?.xjNumber,
      order?.sourceRef,
      editForm?.xjNumber,
      editForm?.sourceRef,
      parentRequest?.xjNumber,
      parentRequest?.sourceRef,
      parentEditForm?.xjNumber,
      parentEditForm?.sourceRef,
      parentSnapshot?.xjNumber,
      parentSnapshot?.sourceRef,
      supplierPortalLinkage?.sourceInquiryNumber,
    ]
      .map((value) => String(value || '').trim().toUpperCase())
      .filter((value) => /^ING-/i.test(value));

    if (internalInquiryRefs.length === 0) {
      return { xj: null, quotation: null, internalInquiryRefs: [] as string[] };
    }

    const visibleXjs = myXJs.filter((xj: any) => {
      return [xj?.supplierXjNo, xj?.xjNumber]
        .map((value) => String(value || '').trim())
        .some((value) => /^XJ-/i.test(value));
    });

    if (visibleXjs.length !== 1) {
      return { xj: null, quotation: null, internalInquiryRefs };
    }

    const xj = visibleXjs[0];
    const quotation = findActiveQuotationForXJ(xj)
      || supplierQuotations.filter((item: any) => {
        return [item?.quotationNo, item?.bjNumber, item?.quotationNumber]
          .map((value) => String(value || '').trim())
          .some((value) => /^BJ-/i.test(value));
      })[0]
      || null;

    return { xj, quotation, internalInquiryRefs };
  }, [findActiveQuotationForXJ, myXJs, purchaseOrders, supplierQuotations]);

  const findRequirementForSupplierOrder = React.useCallback((order: any) => {
    const parentPoNumber = String(order?.parentRequestPoNumber || '').trim();
    const parentRequest = parentPoNumber
      ? purchaseOrders.find((po) => String(po?.poNumber || '').trim() === parentPoNumber)
      : null;
    const parentSnapshot = parentRequest?.documentDataSnapshot || parentRequest?.document_data_snapshot || {};
    const parentEditForm = parentSnapshot?.editForm || {};
    const requirementNo = String(
      order?.requirementNo ||
      order?.requirementNumber ||
      order?.sourceQRNumber ||
      order?.qrNumber ||
      parentRequest?.requirementNo ||
      parentRequest?.requirementNumber ||
      parentRequest?.sourceQRNumber ||
      parentRequest?.qrNumber ||
      parentEditForm?.requirementNo ||
      parentEditForm?.requirementNumber ||
      parentEditForm?.qrNumber ||
      parentSnapshot?.requirementNo ||
      parentSnapshot?.requirementNumber ||
      parentSnapshot?.qrNumber ||
      ''
    ).trim();
    const matchedByRequirementNo = requirementNo
      ? requirements.find((requirement) => String(
          requirement?.requirementNo ||
          requirement?.requirementNumber ||
          requirement?.qrNumber ||
          ''
        ).trim() === requirementNo) || null
      : null;
    if (matchedByRequirementNo) return matchedByRequirementNo;

    const candidateRefs = [
      order?.xjNumber,
      order?.sourceRef,
      order?.sourceInquiryNumber,
      order?.sourceQRNumber,
      order?.qrNumber,
      parentRequest?.xjNumber,
      parentRequest?.sourceRef,
      parentRequest?.sourceInquiryNumber,
      parentRequest?.sourceQRNumber,
      parentRequest?.qrNumber,
      parentEditForm?.xjNumber,
      parentEditForm?.sourceRef,
      parentEditForm?.sourceInquiryNumber,
      parentEditForm?.sourceQRNumber,
      parentSnapshot?.xjNumber,
      parentSnapshot?.sourceRef,
      parentSnapshot?.sourceInquiryNumber,
      parentSnapshot?.sourceQRNumber,
    ]
      .map((value) => String(value || '').trim().toUpperCase())
      .filter(Boolean);

    if (candidateRefs.length === 0) return null;

    const matchedBySourceRef = requirements.find((requirement) => {
      const refs = [
        requirement?.sourceInquiryNumber,
        requirement?.sourceRef,
        requirement?.sourceSoNumber,
        requirement?.requirementNo,
        requirement?.requirementNumber,
        requirement?.qrNumber,
      ]
        .map((value) => String(value || '').trim().toUpperCase())
        .filter(Boolean);
      return refs.some((ref) => candidateRefs.includes(ref));
    }) || null;
    if (matchedBySourceRef) return matchedBySourceRef;

    const matchedXj = myXJs.find((xj) => {
      const refs = [
        xj?.supplierXjNo,
        xj?.xjNumber,
        xj?.sourceRef,
        xj?.sourceInquiryNumber,
        xj?.sourceQRNumber,
      ]
        .map((value) => String(value || '').trim().toUpperCase())
        .filter(Boolean);
      return refs.some((ref) => candidateRefs.includes(ref));
    });
    if (!matchedXj) return null;

    const fallbackRequirementNo = String(
      matchedXj?.requirementNo ||
      matchedXj?.sourceQRNumber ||
      ''
    ).trim();
    if (String(order?.poNumber || '').trim() === 'CG-260409-0001') {
      console.log('🔎 [SupplierOrderMgmt][CG需求回溯]', JSON.stringify({
        poNumber: order?.poNumber,
        candidateRefs,
        matchedBySourceRef: matchedBySourceRef ? {
          requirementNo: matchedBySourceRef?.requirementNo,
          sourceInquiryNumber: matchedBySourceRef?.sourceInquiryNumber,
          sourceSoNumber: matchedBySourceRef?.sourceSoNumber,
        } : null,
        matchedXj: matchedXj ? {
          supplierXjNo: matchedXj?.supplierXjNo,
          xjNumber: matchedXj?.xjNumber,
          sourceInquiryNumber: matchedXj?.sourceInquiryNumber,
          sourceRef: matchedXj?.sourceRef,
          sourceQRNumber: matchedXj?.sourceQRNumber,
          requirementNo: matchedXj?.requirementNo,
        } : null,
        fallbackRequirementNo,
      }, null, 2));
    }
    if (!fallbackRequirementNo) return null;

    return requirements.find((requirement) => String(
      requirement?.requirementNo ||
      requirement?.requirementNumber ||
      requirement?.qrNumber ||
      ''
    ).trim() === fallbackRequirementNo) || null;
  }, [myXJs, purchaseOrders, requirements]);

  const findRequirementForXJ = React.useCallback((xj: any) => {
    const requirementNo = String(
      xj?.requirementNo ||
      xj?.sourceQRNumber ||
      xj?.documentData?.requirementNo ||
      xj?.documentDataSnapshot?.requirementNo ||
      ''
    ).trim();

    if (requirementNo) {
      const directMatched = requirements.find((requirement) => String(
        requirement?.requirementNo ||
        requirement?.requirementNumber ||
        requirement?.qrNumber ||
        ''
      ).trim() === requirementNo) || null;
      if (directMatched) return directMatched;
    }

    const candidateRefs = [
      xj?.supplierXjNo,
      xj?.xjNumber,
      xj?.sourceInquiryNumber,
      xj?.sourceRef,
      xj?.sourceQRNumber,
      xj?.documentData?.sourceInquiryNumber,
      xj?.documentData?.sourceRef,
      xj?.documentDataSnapshot?.sourceInquiryNumber,
      xj?.documentDataSnapshot?.sourceRef,
    ]
      .map((value) => String(value || '').trim().toUpperCase())
      .filter(Boolean);

    if (candidateRefs.length === 0) return null;

    return requirements.find((requirement) => {
      const refs = [
        requirement?.sourceInquiryNumber,
        requirement?.sourceRef,
        requirement?.sourceSoNumber,
        requirement?.requirementNo,
        requirement?.requirementNumber,
        requirement?.qrNumber,
      ]
        .map((value) => String(value || '').trim().toUpperCase())
        .filter(Boolean);
      return refs.some((ref) => candidateRefs.includes(ref));
    }) || null;
  }, [requirements]);

  const getRequirementCustomerIdentity = React.useCallback((requirement: any) => {
    if (!requirement) return { name: '', company: '' };

    const snapshotCustomer =
      requirement?.documentDataSnapshot?.customer ||
      requirement?.document_data_snapshot?.customer ||
      {};
    const requirementCustomer = requirement?.customer || {};
    const sourceInquiry = requirement?.sourceInquiry || requirement?.source_inquiry || {};
    const sourceBuyer = sourceInquiry?.buyerInfo || sourceInquiry?.buyer_info || {};

    const company = pickDisplayText([
      requirementCustomer?.companyName,
      snapshotCustomer?.companyName,
      requirement?.customerCompany,
      requirement?.customerName,
      requirement?.buyerInfo?.companyName,
      requirement?.buyerCompany,
      sourceBuyer?.companyName,
      sourceInquiry?.buyerCompany,
    ]);

    const name = pickDisplayText([
      company,
      requirementCustomer?.contactPerson,
      snapshotCustomer?.contactPerson,
      requirement?.customerName,
      requirement?.buyerInfo?.contactPerson,
      sourceBuyer?.contactPerson,
    ]);

    return {
      name,
      company: company || name,
    };
  }, []);

  const getCustomerIdentityForXJ = React.useCallback((xj: any) => {
    const xjDocument = xj?.documentData || {};
    const xjSnapshot = xj?.documentDataSnapshot || xj?.document_data_snapshot || {};
    const xjBuyer =
      xjDocument?.buyer ||
      xjSnapshot?.buyer ||
      {};
    const xjCustomer = xjDocument?.customer || xjSnapshot?.customer || {};
    const xjBuyerInfo = xjDocument?.buyerInfo || xj?.buyerInfo || {};

    const company = pickDisplayText([
      xjBuyer?.name,
      xjBuyer?.companyName,
      xj?.buyerCompany,
      xjBuyerInfo?.companyName,
      issuerFallbackName,
    ]);

    const name = pickDisplayText([
      xjBuyer?.contactPerson,
      xj?.buyerContact,
      xjBuyerInfo?.contactPerson,
      xjBuyer?.name,
      xjBuyer?.companyName,
      xj?.buyerCompany,
      issuerFallbackName,
      company,
    ]);

    return {
      name,
      company: company || name,
    };
  }, [issuerFallbackName]);

  const findXJForQuotation = React.useCallback((quotation: any) => {
    const quotationRefs = [
      quotation?.sourceXJ,
      quotation?.sourceXJNumber,
      quotation?.xjNo,
      quotation?.xjNumber,
      quotation?.sourceXJId,
      quotation?.quoteData?.xjNo,
      quotation?.quoteData?.xjNumber,
      quotation?.sourceQR,
      quotation?.requirementNo,
    ]
      .map((value) => String(value || '').trim().toUpperCase())
      .filter(Boolean);

    if (quotationRefs.length === 0) return null;

    return myXJs.find((xj) => {
      const refs = [
        xj?.id,
        xj?.supplierXjNo,
        xj?.xjNumber,
        xj?.sourceInquiryNumber,
        xj?.sourceRef,
        xj?.sourceQRNumber,
        xj?.requirementNo,
      ]
        .map((value) => String(value || '').trim().toUpperCase())
        .filter(Boolean);
      return refs.some((ref) => quotationRefs.includes(ref));
    }) || null;
  }, [myXJs]);

  const getCustomerIdentityForQuotation = React.useCallback((quotation: any) => {
    const matchedXj = findXJForQuotation(quotation);
    const matchedRequirement = matchedXj
      ? findRequirementForXJ(matchedXj)
      : requirements.find((requirement) => String(
          requirement?.requirementNo ||
          requirement?.requirementNumber ||
          requirement?.qrNumber ||
          ''
        ).trim() === String(
          quotation?.sourceQR ||
          quotation?.requirementNo ||
          quotation?.quoteData?.sourceQR ||
          ''
        ).trim()) || null;

    const flowIdentity = matchedXj
      ? getCustomerIdentityForXJ(matchedXj)
      : getRequirementCustomerIdentity(matchedRequirement);

    const quoteData = quotation?.quoteData || {};
    const company = pickDisplayText([
      flowIdentity.company,
      quotation?.buyerCompany,
      quoteData?.buyerCompany,
      issuerFallbackName,
      quotation?.customerCompany,
      quoteData?.customerCompany,
      quotation?.customerName,
      quoteData?.customerName,
    ]);

    const name = pickDisplayText([
      flowIdentity.name,
      quotation?.buyerContact,
      quoteData?.buyerContact,
      company,
      issuerFallbackName,
      quotation?.customerName,
      quoteData?.customerName,
      quotation?.customerContact,
      quoteData?.customerContact,
    ]);

    return {
      name,
      company: company || name,
    };
  }, [findRequirementForXJ, findXJForQuotation, getCustomerIdentityForXJ, getRequirementCustomerIdentity, issuerFallbackName, requirements]);

  const getSupplierOrderTraceRefs = React.useCallback((order: any) => {
    const refs = new Set<string>();
    const pushRef = (value: unknown) => {
      const normalized = String(value || '').trim().toUpperCase();
      if (normalized) refs.add(normalized);
    };

    const renderMeta = order?.documentRenderMeta || order?.document_render_meta || {};
    const linkage = renderMeta?.procurementLinkage || {};
    const supplierPortalLinkage = renderMeta?.supplierPortalLinkage || {};
    const snapshot = order?.documentDataSnapshot || order?.document_data_snapshot || {};
    const editForm = snapshot?.editForm || {};
    const matchedRequirement = findRequirementForSupplierOrder(order);
    const linkedBjList = String(matchedRequirement?.purchaserFeedback?.linkedBJ || '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);
    const linkedXjList = String(matchedRequirement?.purchaserFeedback?.linkedXJ || '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);

    pushRef(order?.poNumber);
    pushRef(order?.cgNumber);
    pushRef(order?.requirementNo);
    pushRef(order?.parentRequestPoNumber);
    pushRef(order?.xjNumber);
    pushRef(order?.xjId);
    pushRef(order?.sourceRef);
    pushRef(order?.sourceSONumber);
    pushRef(order?.salesContractNumber);
    pushRef(order?.quotationNumber);
    pushRef(order?.selectedBjId);
    pushRef(order?.selectedQuote?.quotationNo);
    pushRef(order?.selectedQuote?.quotationNumber);
    pushRef(order?.selectedQuote?.bjNumber);
    pushRef(order?.selectedQuote?.sourceXJ);
    pushRef(order?.selectedQuote?.sourceXJNumber);
    pushRef(order?.selectedQuote?.xjNumber);
    pushRef(linkage?.sourceRef);
    pushRef(linkage?.sourceSONumber);
    pushRef(linkage?.salesContractNumber);
    pushRef(linkage?.quotationNumber);
    pushRef(supplierPortalLinkage?.supplierXjNo);
    pushRef(supplierPortalLinkage?.supplierBjNo);
    pushRef(supplierPortalLinkage?.supplierQuotationId);
    pushRef(editForm?.poNumber);
    pushRef(editForm?.requirementNo);
    pushRef(editForm?.xjNumber);
    pushRef(editForm?.sourceRef);
    pushRef(editForm?.supplierQuotationNo);
    pushRef(matchedRequirement?.requirementNo);
    pushRef(matchedRequirement?.sourceRef);
    pushRef(matchedRequirement?.sourceInquiryNumber);
    linkedBjList.forEach(pushRef);
    linkedXjList.forEach(pushRef);
    (matchedRequirement?.purchaserFeedback?.products || []).forEach((product: any) => {
      pushRef(product?.sourcePricing?.sourceDocumentNo);
      pushRef(product?.sourcePricing?.supplierQuotationNo);
    });

    return refs;
  }, [findRequirementForSupplierOrder]);

  const getSupplierQuoteCandidates = React.useCallback((order: any) => {
    const refs = getSupplierOrderTraceRefs(order);
    const preferredSupplierCode = String(order?.supplierCode || '').trim().toUpperCase();
    const preferredSupplierEmail = String(order?.supplierEmail || '').trim().toLowerCase();
    const statusWeight = (status: unknown) => {
      const normalized = String(status || '').trim().toLowerCase();
      if (normalized === 'accepted' || normalized === 'approved' || normalized === 'completed') return 0;
      if (normalized === 'submitted' || normalized === 'quoted') return 1;
      if (normalized === 'draft') return 2;
      return 3;
    };

    const candidates = supplierQuotations.filter((quotation: any) => {
      if (hiddenQuotationIds.has(String(quotation?.id || ''))) return false;
      const quotationSupplierCode = String(quotation?.supplierCode || '').trim().toUpperCase();
      const quotationSupplierEmail = String(quotation?.supplierEmail || quotation?.createdBy || '').trim().toLowerCase();

      if (
        preferredSupplierCode &&
        preferredSupplierCode !== 'TBD' &&
        quotationSupplierCode &&
        quotationSupplierCode !== preferredSupplierCode
      ) {
        return false;
      }

      if (
        preferredSupplierEmail &&
        quotationSupplierEmail &&
        quotationSupplierEmail !== preferredSupplierEmail
      ) {
        return false;
      }

      const quotationRefs = [
        quotation?.id,
        quotation?.quotationNo,
        quotation?.bjNumber,
        quotation?.quotationNumber,
        quotation?.sourceXJ,
        quotation?.sourceXJNumber,
        quotation?.xjNo,
        quotation?.xjNumber,
        quotation?.sourceQR,
        quotation?.requirementNo,
        quotation?.sourceXJId,
        quotation?.quoteData?.sourceQR,
        quotation?.quoteData?.xjNo,
        quotation?.quoteData?.xjNumber,
      ]
        .map((value) => String(value || '').trim().toUpperCase())
        .filter(Boolean);

      return quotationRefs.some((ref) => refs.has(ref));
    });

    return candidates.sort((a: any, b: any) => {
      const weightDiff = statusWeight(a?.status) - statusWeight(b?.status);
      if (weightDiff !== 0) return weightDiff;
      const aTime = Date.parse(String(a?.submittedDate || a?.quotationDate || a?.quotedDate || a?.updatedAt || 0));
      const bTime = Date.parse(String(b?.submittedDate || b?.quotationDate || b?.quotedDate || b?.updatedAt || 0));
      return bTime - aTime;
    });
  }, [getSupplierOrderTraceRefs, hiddenQuotationIds, supplierQuotations]);

  const pickSupplierVisibleNumber = React.useCallback((values: unknown[], kind: 'cg' | 'xj' | 'bj') => {
    const patterns = {
      cg: /^CG-/i,
      xj: /^XJ-/i,
      bj: /^BJ-/i,
    } as const;
    return values
      .map((value) => String(value || '').trim())
      .find((value) => patterns[kind].test(value)) || '';
  }, []);

  const getRFQPushState = React.useCallback((xj: any) => {
    const activeQuotation = findActiveQuotationForXJ(xj);
    const normalizedStatus = String(xj?.status || '').trim().toLowerCase();
    const quotationHints = [
      xj?.supplierQuotationNo,
      xj?.quotationNo,
      xj?.quotedPrice,
      xj?.quotedDate,
      Array.isArray(xj?.quotes) ? xj.quotes.length : 0,
    ];
    const hasQuotationEvidence = quotationHints.some((value) => {
      if (typeof value === 'number') return value > 0;
      return String(value || '').trim() !== '';
    });
    const isPushed = Boolean(
      activeQuotation ||
      normalizedStatus === 'quoted' ||
      normalizedStatus === 'submitted' ||
      hasQuotationEvidence
    );

    return {
      activeQuotation,
      isPushed,
      badgeLabel: isPushed ? supplierUiCopy.pushed : supplierUiCopy.pendingQuote,
      badgeClassName: isPushed
        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
        : 'bg-amber-100 text-amber-800 border-amber-300',
      actionLabel: isPushed ? supplierUiCopy.pushed : supplierUiCopy.pushQuote,
      actionClassName: isPushed
        ? 'h-8 px-3 text-xs font-medium border-emerald-300 text-emerald-700 bg-emerald-50 cursor-not-allowed opacity-75'
        : 'h-8 px-3 text-xs font-medium border-amber-300 text-amber-700 hover:bg-amber-50',
    };
  }, [findActiveQuotationForXJ, supplierUiCopy.pendingQuote, supplierUiCopy.pushQuote, supplierUiCopy.pushed]);

  const getSupplierVisibleRFQNumbers = React.useCallback((xj: any) => {
    const pushState = getRFQPushState(xj);
    const related: Array<{ label: string; value: string }> = [];
    const supplierXjNo = pickSupplierVisibleNumber([
      xj?.supplierXjNo,
      xj?.xjNumber,
    ], 'xj');
    const supplierBjNo = pickSupplierVisibleNumber([
      pushState.activeQuotation?.quotationNo,
      pushState.activeQuotation?.bjNumber,
      xj?.supplierQuotationNo,
      xj?.quotationNo,
    ], 'bj');

    if (supplierXjNo) related.push({ label: '询价单号', value: supplierXjNo });
    if (supplierBjNo) related.push({ label: '报价单号', value: supplierBjNo });

    return related;
  }, [getRFQPushState, pickSupplierVisibleNumber]);

  const getFormalSupplierPortalLinkage = React.useCallback((order: any) => {
    const renderMeta = order?.documentRenderMeta || order?.document_render_meta || {};
    const supplierPortalLinkage = renderMeta?.supplierPortalLinkage || {};
    const snapshot = order?.documentDataSnapshot || order?.document_data_snapshot || {};
    const editForm = snapshot?.editForm || {};
    const parentPoNumber = String(order?.parentRequestPoNumber || '').trim();
    const parentRequest = parentPoNumber
      ? purchaseOrders.find((po) => String(po?.poNumber || '').trim() === parentPoNumber)
      : null;
    const parentSnapshot = parentRequest?.documentDataSnapshot || parentRequest?.document_data_snapshot || {};
    const parentEditForm = parentSnapshot?.editForm || {};
    const candidateRefs = [
      order?.xjNumber,
      order?.sourceRef,
      order?.sourceInquiryNumber,
      order?.sourceQRNumber,
      order?.qrNumber,
      editForm?.xjNumber,
      editForm?.sourceRef,
      editForm?.sourceInquiryNumber,
      editForm?.sourceQRNumber,
      parentRequest?.xjNumber,
      parentRequest?.sourceRef,
      parentRequest?.sourceInquiryNumber,
      parentRequest?.sourceQRNumber,
      parentRequest?.qrNumber,
      parentEditForm?.xjNumber,
      parentEditForm?.sourceRef,
      parentEditForm?.sourceInquiryNumber,
      parentEditForm?.sourceQRNumber,
      parentSnapshot?.xjNumber,
      parentSnapshot?.sourceRef,
      parentSnapshot?.sourceInquiryNumber,
      parentSnapshot?.sourceQRNumber,
    ]
      .map((value) => String(value || '').trim().toUpperCase())
      .filter(Boolean);
    const directMatchedXj = myXJs.find((xj) => {
      const refs = [
        xj?.supplierXjNo,
        xj?.xjNumber,
        xj?.sourceInquiryNumber,
        xj?.sourceRef,
        xj?.sourceQRNumber,
        xj?.requirementNo,
      ]
        .map((value) => String(value || '').trim().toUpperCase())
        .filter(Boolean);
      return refs.some((ref) => candidateRefs.includes(ref));
    }) || null;
    const directMatchedQuotation = directMatchedXj
      ? (findActiveQuotationForXJ(directMatchedXj) || supplierQuotations.find((quotation: any) => {
          const refs = [
            quotation?.sourceXJ,
            quotation?.sourceXJNumber,
            quotation?.xjNumber,
            quotation?.sourceXJId,
            quotation?.id,
          ]
            .map((value) => String(value || '').trim().toUpperCase())
            .filter(Boolean);
          const xjRefs = [
            directMatchedXj?.supplierXjNo,
            directMatchedXj?.xjNumber,
            directMatchedXj?.id,
          ]
            .map((value) => String(value || '').trim().toUpperCase())
            .filter(Boolean);
          return refs.some((ref) => xjRefs.includes(ref));
        }) || null)
      : null;
    const matchedRequirement = findRequirementForSupplierOrder(order);
    const shouldDebugLinkage = String(order?.poNumber || '').trim() === 'CG-260409-0001';
    if (shouldDebugLinkage) {
      console.log('🔎 [SupplierOrderMgmt][CG主线调试]', {
        poNumber: order?.poNumber,
        requirementNo: order?.requirementNo,
        parentRequestPoNumber: order?.parentRequestPoNumber,
        parentRequestRequirementNo: parentRequest?.requirementNo,
        xjNumber: order?.xjNumber,
        selectedBjId: order?.selectedBjId,
        supplierPortalLinkage,
        editForm: {
          requirementNo: editForm?.requirementNo,
          xjNumber: editForm?.xjNumber,
          supplierQuotationNo: editForm?.supplierQuotationNo,
        },
        matchedRequirement: matchedRequirement ? {
          requirementNo: matchedRequirement?.requirementNo,
          sourceInquiryNumber: matchedRequirement?.sourceInquiryNumber,
          sourceSoNumber: matchedRequirement?.sourceSoNumber,
          linkedBJ: matchedRequirement?.purchaserFeedback?.linkedBJ,
          linkedXJ: matchedRequirement?.purchaserFeedback?.linkedXJ,
          feedbackProducts: (matchedRequirement?.purchaserFeedback?.products || []).map((product: any) => ({
            supplierQuotationNo: product?.sourcePricing?.supplierQuotationNo,
            sourceDocumentNo: product?.sourcePricing?.sourceDocumentNo,
          })),
        } : null,
        directMatchedXj: directMatchedXj ? {
          supplierXjNo: directMatchedXj?.supplierXjNo,
          xjNumber: directMatchedXj?.xjNumber,
          requirementNo: directMatchedXj?.requirementNo,
          sourceInquiryNumber: directMatchedXj?.sourceInquiryNumber,
          sourceQRNumber: directMatchedXj?.sourceQRNumber,
          supplierQuotationNo: directMatchedXj?.supplierQuotationNo,
        } : null,
        directMatchedQuotation: directMatchedQuotation ? {
          quotationNo: directMatchedQuotation?.quotationNo,
          bjNumber: directMatchedQuotation?.bjNumber,
          sourceXJ: directMatchedQuotation?.sourceXJ,
        } : null,
      });
      console.log('🔎 [SupplierOrderMgmt][CG-XJ纯文本]', JSON.stringify({
        poNumber: order?.poNumber,
        candidateRefs,
        myXJs: myXJs.map((xj: any) => ({
          supplierXjNo: xj?.supplierXjNo,
          xjNumber: xj?.xjNumber,
          sourceInquiryNumber: xj?.sourceInquiryNumber,
          sourceRef: xj?.sourceRef,
          sourceQRNumber: xj?.sourceQRNumber,
          requirementNo: xj?.requirementNo,
          supplierQuotationNo: xj?.supplierQuotationNo,
          status: xj?.status,
        })),
        directMatchedXj: directMatchedXj ? {
          supplierXjNo: directMatchedXj?.supplierXjNo,
          xjNumber: directMatchedXj?.xjNumber,
          sourceInquiryNumber: directMatchedXj?.sourceInquiryNumber,
          sourceRef: directMatchedXj?.sourceRef,
          sourceQRNumber: directMatchedXj?.sourceQRNumber,
          requirementNo: directMatchedXj?.requirementNo,
          supplierQuotationNo: directMatchedXj?.supplierQuotationNo,
        } : null,
        directMatchedQuotation: directMatchedQuotation ? {
          quotationNo: directMatchedQuotation?.quotationNo,
          bjNumber: directMatchedQuotation?.bjNumber,
          sourceXJ: directMatchedQuotation?.sourceXJ,
          sourceXJNumber: directMatchedQuotation?.sourceXJNumber,
        } : null,
      }, null, 2));
    }
    if (!matchedRequirement && !directMatchedXj && !directMatchedQuotation) return null;

    const linkedBjList = String(matchedRequirement?.purchaserFeedback?.linkedBJ || '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);
    const linkedXjList = String(matchedRequirement?.purchaserFeedback?.linkedXJ || '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);
    const feedbackSupplierQuotationNos = (matchedRequirement?.purchaserFeedback?.products || [])
      .flatMap((product: any) => [
        product?.sourcePricing?.supplierQuotationNo,
        product?.sourcePricing?.sourceDocumentNo,
      ])
      .map((value: unknown) => String(value || '').trim())
      .filter(Boolean);
    const mainlineBjRefs = new Set(
      [...linkedBjList, ...feedbackSupplierQuotationNos]
        .map((value) => String(value || '').trim().toUpperCase())
        .filter(Boolean),
    );
    const mainlineXjRefs = new Set(
      [
        ...linkedXjList,
        matchedRequirement?.sourceInquiryNumber,
        matchedRequirement?.sourceRef,
      ]
        .map((value) => String(value || '').trim().toUpperCase())
        .filter(Boolean),
    );
    const requirementNo = String(
      matchedRequirement?.requirementNo ||
      directMatchedXj?.requirementNo ||
      directMatchedXj?.sourceQRNumber ||
      ''
    ).trim().toUpperCase();

    const strictQuotationCandidates = supplierQuotations
      .filter((quotation: any) => {
        if (hiddenQuotationIds.has(String(quotation?.id || ''))) return false;
        const refs = [
          quotation?.id,
          quotation?.quotationNo,
          quotation?.bjNumber,
          quotation?.quotationNumber,
          quotation?.sourceXJ,
          quotation?.sourceXJNumber,
          quotation?.xjNo,
          quotation?.xjNumber,
          quotation?.requirementNo,
          quotation?.sourceQR,
          quotation?.quoteData?.sourceQR,
          quotation?.quoteData?.xjNo,
          quotation?.quoteData?.xjNumber,
        ]
          .map((value) => String(value || '').trim().toUpperCase())
          .filter(Boolean);

        return refs.some((ref) => mainlineBjRefs.has(ref) || mainlineXjRefs.has(ref) || (requirementNo && ref === requirementNo));
      })
      .sort((a: any, b: any) => {
        const getPriority = (quotation: any) => {
          const quotationNo = String(
            quotation?.quotationNo ||
            quotation?.bjNumber ||
            quotation?.quotationNumber ||
            '',
          ).trim().toUpperCase();
          const sourceXj = String(
            quotation?.sourceXJ ||
            quotation?.sourceXJNumber ||
            quotation?.xjNumber ||
            '',
          ).trim().toUpperCase();
          if (quotationNo && mainlineBjRefs.has(quotationNo)) return 0;
          if (sourceXj && mainlineXjRefs.has(sourceXj)) return 1;
          if (String(quotation?.requirementNo || '').trim().toUpperCase() === requirementNo) return 2;
          return 3;
        };
        const priorityDiff = getPriority(a) - getPriority(b);
        if (priorityDiff !== 0) return priorityDiff;
        const aTime = Date.parse(String(a?.submittedDate || a?.quotationDate || a?.quotedDate || a?.updatedAt || 0));
        const bTime = Date.parse(String(b?.submittedDate || b?.quotationDate || b?.quotedDate || b?.updatedAt || 0));
        return bTime - aTime;
      });

    const { xj: singleMainlineFallbackXj, quotation: singleMainlineFallbackQuotation, internalInquiryRefs } =
      getSingleSupplierMainlineFallback(order);

    const matchedQuotation = strictQuotationCandidates[0]
      || directMatchedQuotation
      || singleMainlineFallbackQuotation
      || getSupplierQuoteCandidates(order)[0]
      || null;
    const strictXjCandidates = myXJs
      .filter((xj: any) => {
        const refs = [
          xj?.id,
          xj?.supplierXjNo,
          xj?.xjNumber,
          xj?.requirementNo,
          xj?.sourceQRNumber,
          xj?.sourceInquiryNumber,
          xj?.sourceRef,
        ]
          .map((value) => String(value || '').trim().toUpperCase())
          .filter(Boolean);
        return refs.some((ref) => (
          mainlineXjRefs.has(ref) ||
          (requirementNo && ref === requirementNo) ||
          ref === String(
            matchedQuotation?.sourceXJ ||
            matchedQuotation?.sourceXJNumber ||
            matchedQuotation?.xjNumber ||
            '',
          ).trim().toUpperCase()
        ));
      })
      .sort((a: any, b: any) => {
        const getPriority = (xj: any) => {
          const supplierXjNo = String(xj?.supplierXjNo || '').trim().toUpperCase();
          const sourceInquiry = String(xj?.sourceInquiryNumber || xj?.sourceRef || '').trim().toUpperCase();
          if (supplierXjNo && mainlineXjRefs.has(supplierXjNo)) return 0;
          if (sourceInquiry && mainlineXjRefs.has(sourceInquiry)) return 1;
          if (String(xj?.requirementNo || '').trim().toUpperCase() === requirementNo) return 2;
          return 3;
        };
        return getPriority(a) - getPriority(b);
      });

    const matchedXj = strictXjCandidates[0]
      || directMatchedXj
      || singleMainlineFallbackXj
      || null;
    if (shouldDebugLinkage) {
      console.log('🔎 [SupplierOrderMgmt][CG候选命中]', {
        poNumber: order?.poNumber,
        mainlineBjRefs: Array.from(mainlineBjRefs),
        mainlineXjRefs: Array.from(mainlineXjRefs),
        internalInquiryRefs,
        strictQuotationCandidates: strictQuotationCandidates.map((quotation: any) => ({
          id: quotation?.id,
          quotationNo: quotation?.quotationNo,
          bjNumber: quotation?.bjNumber,
          sourceXJ: quotation?.sourceXJ,
          requirementNo: quotation?.requirementNo,
          supplierCode: quotation?.supplierCode,
          supplierEmail: quotation?.supplierEmail,
          status: quotation?.status,
        })),
        strictXjCandidates: strictXjCandidates.map((xj: any) => ({
          id: xj?.id,
          supplierXjNo: xj?.supplierXjNo,
          xjNumber: xj?.xjNumber,
          requirementNo: xj?.requirementNo,
          sourceQRNumber: xj?.sourceQRNumber,
          supplierCode: xj?.supplierCode,
          supplierEmail: xj?.supplierEmail,
          status: xj?.status,
          supplierQuotationNo: xj?.supplierQuotationNo,
        })),
        matchedQuotation: matchedQuotation ? {
          id: matchedQuotation?.id,
          quotationNo: matchedQuotation?.quotationNo,
          bjNumber: matchedQuotation?.bjNumber,
          sourceXJ: matchedQuotation?.sourceXJ,
          requirementNo: matchedQuotation?.requirementNo,
        } : null,
        matchedXj: matchedXj ? {
          id: matchedXj?.id,
          supplierXjNo: matchedXj?.supplierXjNo,
          xjNumber: matchedXj?.xjNumber,
          requirementNo: matchedXj?.requirementNo,
          supplierQuotationNo: matchedXj?.supplierQuotationNo,
        } : null,
        singleMainlineFallbackXj: singleMainlineFallbackXj ? {
          id: singleMainlineFallbackXj?.id,
          supplierXjNo: singleMainlineFallbackXj?.supplierXjNo,
          xjNumber: singleMainlineFallbackXj?.xjNumber,
          supplierQuotationNo: singleMainlineFallbackXj?.supplierQuotationNo,
        } : null,
        singleMainlineFallbackQuotation: singleMainlineFallbackQuotation ? {
          id: singleMainlineFallbackQuotation?.id,
          quotationNo: singleMainlineFallbackQuotation?.quotationNo,
          bjNumber: singleMainlineFallbackQuotation?.bjNumber,
          sourceXJ: singleMainlineFallbackQuotation?.sourceXJ,
        } : null,
      });
    }
    const supplierBjNo = pickSupplierVisibleNumber([
      supplierPortalLinkage?.supplierBjNo,
      editForm?.supplierQuotationNo,
      directMatchedQuotation?.quotationNo,
      directMatchedQuotation?.bjNumber,
      matchedQuotation?.quotationNo,
      matchedQuotation?.bjNumber,
      matchedQuotation?.quotationNumber,
      matchedXj?.supplierQuotationNo,
      findActiveQuotationForXJ(matchedXj || {}, strictQuotationCandidates)?.quotationNo,
    ], 'bj');
    const supplierXjNo = pickSupplierVisibleNumber([
      supplierPortalLinkage?.supplierXjNo,
      editForm?.xjNumber,
      directMatchedXj?.supplierXjNo,
      matchedXj?.supplierXjNo,
      matchedQuotation?.sourceXJ,
      matchedQuotation?.sourceXJNumber,
      matchedQuotation?.xjNumber,
    ], 'xj');

    if (!supplierBjNo && !supplierXjNo) return null;

    return {
      supplierXjNo: supplierXjNo || null,
      supplierBjNo: supplierBjNo || null,
      supplierQuotationId: String(matchedQuotation?.id || supplierPortalLinkage?.supplierQuotationId || '').trim() || null,
      supplierCode: String(order?.supplierCode || matchedQuotation?.supplierCode || supplierPortalLinkage?.supplierCode || '').trim() || null,
    };
  }, [findActiveQuotationForXJ, findRequirementForSupplierOrder, getSingleSupplierMainlineFallback, getSupplierQuoteCandidates, hiddenQuotationIds, myXJs, pickSupplierVisibleNumber, supplierQuotations]);

  const getSupplierVisibleRelatedNumbers = React.useCallback((order: any) => {
    const traceRefs = getSupplierOrderTraceRefs(order);
    const matchedQuotation = getSupplierQuoteCandidates(order)[0];
    const formalLinkage = getFormalSupplierPortalLinkage(order);
    const fallbackMainline = getSingleSupplierMainlineFallback(order);
    const matchedXj = myXJs.find((xj) => {
      const xjRefs = [
        xj?.id,
        xj?.supplierXjNo,
        xj?.xjNumber,
        xj?.requirementNo,
        xj?.sourceQRNumber,
        xj?.sourceInquiryNumber,
        xj?.sourceRef,
      ]
        .map((value) => String(value || '').trim().toUpperCase())
        .filter(Boolean);

      return xjRefs.some((ref) => traceRefs.has(ref));
    });

    const related: Array<{ label: string; value: string }> = [];
    const cgNo = String(order?.poNumber || order?.cgNumber || '').trim();
    const renderMeta = order?.documentRenderMeta || order?.document_render_meta || {};
    const supplierPortalLinkage = renderMeta?.supplierPortalLinkage || {};
    const snapshot = order?.documentDataSnapshot || order?.document_data_snapshot || {};
    const editForm = snapshot?.editForm || {};
    const supplierXjNo = pickSupplierVisibleNumber([
      formalLinkage?.supplierXjNo,
      fallbackMainline?.xj?.supplierXjNo,
      fallbackMainline?.xj?.xjNumber,
      supplierPortalLinkage?.supplierXjNo,
      editForm?.xjNumber,
      matchedXj?.supplierXjNo,
      matchedQuotation?.sourceXJ,
      matchedQuotation?.sourceXJNumber,
    ], 'xj');
    const supplierBjNo = pickSupplierVisibleNumber([
      formalLinkage?.supplierBjNo,
      fallbackMainline?.quotation?.quotationNo,
      fallbackMainline?.quotation?.bjNumber,
      fallbackMainline?.xj?.supplierQuotationNo,
      supplierPortalLinkage?.supplierBjNo,
      editForm?.supplierQuotationNo,
      matchedQuotation?.quotationNo,
      matchedQuotation?.bjNumber,
      matchedQuotation?.quotationNumber,
      matchedXj?.supplierQuotationNo,
      findActiveQuotationForXJ(matchedXj || {})?.quotationNo,
    ], 'bj');

    if (cgNo) related.push({ label: '订单号', value: cgNo });
    if (supplierXjNo) related.push({ label: '询价号', value: supplierXjNo });
    if (supplierBjNo) related.push({ label: '报价号', value: supplierBjNo });

    return related;
  }, [findActiveQuotationForXJ, getFormalSupplierPortalLinkage, getSingleSupplierMainlineFallback, getSupplierOrderTraceRefs, getSupplierQuoteCandidates, myXJs, pickSupplierVisibleNumber]);

  const findXJForSupplierOrder = React.useCallback((order: any) => {
    const traceRefs = getSupplierOrderTraceRefs(order);
    const matchedXj = myXJs.find((xj) => {
      const refs = [
        xj?.id,
        xj?.supplierXjNo,
        xj?.xjNumber,
        xj?.requirementNo,
        xj?.sourceQRNumber,
        xj?.sourceInquiryNumber,
        xj?.sourceRef,
      ]
        .map((value) => String(value || '').trim().toUpperCase())
        .filter(Boolean);
      return refs.some((ref) => traceRefs.has(ref));
    });

    if (matchedXj) return matchedXj;
    return getSingleSupplierMainlineFallback(order)?.xj || null;
  }, [getSingleSupplierMainlineFallback, getSupplierOrderTraceRefs, myXJs]);

  const getCustomerIdentityForOrder = React.useCallback((order: any) => {
    const matchedRequirement = findRequirementForSupplierOrder(order);
    const matchedXj = findXJForSupplierOrder(order);
    const matchedQuotation = getSupplierQuoteCandidates(order)[0] || null;

    const requirementIdentity = getRequirementCustomerIdentity(matchedRequirement);
    const xjIdentity = matchedXj ? getCustomerIdentityForXJ(matchedXj) : { name: '', company: '' };
    const quotationIdentity = matchedQuotation ? getCustomerIdentityForQuotation(matchedQuotation) : { name: '', company: '' };

    const snapshot = order?.documentDataSnapshot || order?.document_data_snapshot || {};
    const snapshotCustomer = snapshot?.customer || {};
    const directCustomer = order?.customer || {};

    const company = pickDisplayText([
      xjIdentity.company,
      quotationIdentity.company,
      order?.buyerCompany,
      issuerFallbackName,
      directCustomer?.companyName,
      snapshotCustomer?.companyName,
      order?.customerCompany,
      order?.customerName,
      requirementIdentity.company,
    ]);

    const name = pickDisplayText([
      xjIdentity.name,
      quotationIdentity.name,
      order?.buyerContact,
      company,
      issuerFallbackName,
      directCustomer?.contactPerson,
      snapshotCustomer?.contactPerson,
      order?.customerName,
      order?.buyerContact,
      requirementIdentity.name,
    ]);

    return {
      name,
      company: company || name,
    };
  }, [
    findRequirementForSupplierOrder,
    findXJForSupplierOrder,
    getCustomerIdentityForQuotation,
    getCustomerIdentityForXJ,
    getRequirementCustomerIdentity,
    getSupplierQuoteCandidates,
    issuerFallbackName,
  ]);

  React.useEffect(() => {
    if (!supplierPortalOrders.length) return;
    supplierPortalOrders.forEach((order) => {
      const orderKey = String(order?.id || order?.poNumber || '').trim();
      if (!orderKey || supplierLinkageBackfillAttemptedRef.current.has(orderKey)) return;
      supplierLinkageBackfillAttemptedRef.current.add(orderKey);
    });
  }, [supplierPortalOrders]);

  const getSupplierNumberAccentClass = React.useCallback((label: string) => {
    switch (label) {
      case '订单号':
        return 'text-blue-600';
      case '询价号':
        return 'text-violet-600';
      case '报价号':
        return 'text-emerald-600';
      default:
        return 'text-slate-700';
    }
  }, []);

  const rollbackXJAfterQuotationDelete = React.useCallback(async (deletedRows: any[], remainingRows: any[]) => {
    if (!Array.isArray(deletedRows) || deletedRows.length === 0) return;
    for (const quotation of deletedRows) {
      const sourceXJ = String(quotation?.sourceXJ || quotation?.xjNo || quotation?.xjNumber || '').trim();
      if (!sourceXJ) continue;
      const xj = myXJs.find((r) => getXJRefKey(r) === sourceXJ);
      if (!xj) continue;
      const stillHasDownstream = remainingRows.some((rq: any) => String(rq?.sourceXJ || rq?.xjNo || rq?.xjNumber || '').trim() === sourceXJ);
      if (stillHasDownstream) continue;
      const filteredQuotes = (xj.quotes || []).filter((qt: any) => String(qt?.quotationNo || '').trim() !== String(quotation?.quotationNo || '').trim());
      await updateXJ(xj.id, {
        status: 'sent' as any,
        supplierQuotationNo: '',
        quotes: filteredQuotes,
      });
    }
    await refreshMineFromBackend({ force: true });
  }, [getXJRefKey, myXJs, refreshMineFromBackend, updateXJ]);

  // 🔥 分类采购询价（客户需求池）
  const categorizedRFQs = useMemo(() => {
    console.log('🔍 [分类采购询价] 开始分类，总采购询价数:', myXJs.length);
    
    // 🔥 修改：客户需求Tab显示所有待处理的采购询价（包括待报价和已下推）
    const pending = myXJs.filter(xj => {
      // 接受 'pending'、'sent' 和 'quoted' 状态
      const isPendingOrSent = xj.status === 'pending' || xj.status === 'sent' || xj.status === 'quoted';
      // 排除已接受和已拒绝的
      const result = isPendingOrSent && xj.status !== 'accepted' && xj.status !== 'rejected';
      const hasActiveQuotation = !!findActiveQuotationForXJ(xj);
      console.log(`  - 采购询价 ${xj.supplierXjNo}: status=${xj.status}, hasQuote=${hasActiveQuotation}, 是否在客户需求=${result}`);
      return result;
    });
    
    const quoted = myXJs.filter(xj => {
      return !!findActiveQuotationForXJ(xj) && xj.status !== 'accepted' && xj.status !== 'rejected';
    });
    
    const accepted = myXJs.filter(xj => xj.status === 'accepted');
    
    console.log('📊 [分类结果] 客户需求:', pending.length, '已报价:', quoted.length, '已接受:', accepted.length);
    
    return { pending, quoted, accepted };
  }, [myXJs, user?.email, findActiveQuotationForXJ]);

  // 自愈：如果“客户需求”统计有数据但列表被隐藏规则全部挡住，则自动恢复显示
  React.useEffect(() => {
    if (activeTab !== 'xj') return;
    if (!hiddenXJIds.size) return;
    if (hasManualHideInSessionRef.current) return;
    const pendingCount = categorizedRFQs.pending.length;
    if (pendingCount === 0) return;
    const visibleCount = categorizedRFQs.pending.filter((xj) => !hiddenXJIds.has(String(xj.id))).length;
    if (visibleCount === 0) {
      clearHiddenXJIdsForCurrentSupplier();
      toast.info('检测到客户需求被全部隐藏，已自动恢复显示');
    }
  }, [activeTab, hiddenXJIds, categorizedRFQs.pending, clearHiddenXJIdsForCurrentSupplier]);

  // 🔥 获取当前供应商的所有报价单
  const myQuotations = useMemo(() => {
    if (!user?.email) return [];
    const current = String(user.email || '').trim().toLowerCase();
    return supplierQuotations.filter((q: any) => {
      if (hiddenQuotationIds.has(String(q?.id || ''))) return false;
      const bySupplierEmail = String(q?.supplierEmail || '').trim().toLowerCase() === current;
      const byCreatedBy = String(q?.createdBy || '').trim().toLowerCase() === current;
      const bySupplierCode = String(q?.supplierCode || '').trim().toLowerCase() === current;
      return bySupplierEmail || byCreatedBy || bySupplierCode;
    });
  }, [hiddenQuotationIds, supplierQuotations, user?.email]);

  const recoverableQuotations = useMemo(() => {
    if (!user?.email) return [];
    const current = String(user.email || '').trim().toLowerCase();
    return supplierQuotations.filter((q: any) => {
      const bySupplierEmail = String(q?.supplierEmail || '').trim().toLowerCase() === current;
      const byCreatedBy = String(q?.createdBy || '').trim().toLowerCase() === current;
      const bySupplierCode = String(q?.supplierCode || '').trim().toLowerCase() === current;
      return bySupplierEmail || byCreatedBy || bySupplierCode;
    });
  }, [supplierQuotations, user?.email]);

  React.useEffect(() => {
    if (activeTab !== 'qt') return;
    if (!hiddenQuotationIds.size) return;
    if (myQuotations.length > 0) return;
    if (recoverableQuotations.length === 0) return;
    clearHiddenQuotationIdsForCurrentSupplier();
    toast.info('检测到我的报价被全部隐藏，已自动恢复显示');
  }, [
    activeTab,
    hiddenQuotationIds,
    myQuotations.length,
    recoverableQuotations.length,
    clearHiddenQuotationIdsForCurrentSupplier,
  ]);

  // 🔥 统计数据
  const stats: OrderStats = useMemo(() => {
    // 待报价的采购询价（未提交报价的）
    const pendingRFQs = categorizedRFQs.pending.length;

    // 草稿报价单
    const draftQuotations = myQuotations.filter(q => q.status === 'draft');

    // 已提交报价单
    const submittedQuotations = myQuotations.filter(q => q.status === 'submitted' || q.status === 'accepted');

    // 在制订单：供应商真实采购订单（CG）
    const activeOrders = activeSupplierOrders.length;

    // 已完成订单：供应商真实采购订单历史
    const completedOrders = historySupplierOrders;

    // 总订单金额
    const totalValue = supplierPortalOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);

    return {
      pendingRFQs,
      draftQuotations: draftQuotations.length,
      submittedQuotations: submittedQuotations.length,
      activeOrders,
      completedOrders: completedOrders.length,
      totalValue
    };
  }, [activeSupplierOrders.length, categorizedRFQs, historySupplierOrders, myQuotations, supplierPortalOrders]);

  // 🔥 概览Tab状态
  const [overviewTab, setOverviewTab] = useState<'summary' | 'conversion' | 'analysis'>('summary');

  // 🔥 渲染概览Dashboard（订单全盘 - 台湾大厂风格）
  const renderOverview = () => (
    <div className="space-y-6">
      {/* 🔥 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">订单全盘</h2>
          <p className="text-sm text-slate-500 mt-1">{supplierUiCopy.orderOverviewDashboard}</p>
        </div>
        <div className="flex items-center gap-3">
          <Select defaultValue="month">
            <SelectTrigger className="w-32 h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">本周</SelectItem>
              <SelectItem value="month">本月</SelectItem>
              <SelectItem value="quarter">本季度</SelectItem>
              <SelectItem value="year">本年度</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" variant="outline" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            刷新
          </Button>
        </div>
      </div>

      {/* 🔥 二级Tab导航 */}
      <Tabs value={overviewTab} onValueChange={(v: any) => setOverviewTab(v)}>
        <TabsList className="bg-slate-100">
          <TabsTrigger value="summary" className="gap-2">
            <LayoutGrid className="w-4 h-4" />
            综合概览
          </TabsTrigger>
          <TabsTrigger value="conversion" className="gap-2">
            <TrendingUp className="w-4 h-4" />
            转化漏斗
          </TabsTrigger>
          <TabsTrigger value="analysis" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            业绩分析
          </TabsTrigger>
        </TabsList>

        {/* 综合概览Tab */}
        <TabsContent value="summary" className="space-y-6 mt-6">
          {/* 关键指标卡片 - 6个核心指标 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            {/* 总询价 */}
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-slate-600 mb-2">总询价</p>
                  <div className="text-3xl font-bold text-slate-900">{myXJs.length}</div>
                  <div className="flex items-center justify-center gap-1 mt-2">
                    <TrendingUp className="w-3 h-3 text-green-600" />
                    <span className="text-xs text-green-600">+12%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 总报价 */}
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-slate-600 mb-2">总报价</p>
                  <div className="text-3xl font-bold text-slate-900">{myQuotations.length}</div>
                  <div className="flex items-center justify-center gap-1 mt-2">
                    <TrendingUp className="w-3 h-3 text-green-600" />
                    <span className="text-xs text-green-600">+8%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 总合同 */}
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-slate-600 mb-2">总合同</p>
                  <div className="text-3xl font-bold text-slate-900">{myQuotations.filter(q => q.status === 'accepted').length}</div>
                  <div className="flex items-center justify-center gap-1 mt-2">
                    <TrendingUp className="w-3 h-3 text-green-600" />
                    <span className="text-xs text-green-600">+5%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 总订单 */}
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-slate-600 mb-2">总订单</p>
                  <div className="text-3xl font-bold text-slate-900">{stats.activeOrders}</div>
                  <div className="flex items-center justify-center gap-1 mt-2">
                    <TrendingUp className="w-3 h-3 text-green-600" />
                    <span className="text-xs text-green-600">+15%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 总收款 */}
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-slate-600 mb-2">总收款</p>
                  <div className="text-3xl font-bold text-slate-900">{stats.completedOrders}</div>
                  <div className="flex items-center justify-center gap-1 mt-2">
                    <TrendingUp className="w-3 h-3 text-green-600" />
                    <span className="text-xs text-green-600">+10%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 赢单转化率 */}
            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-orange-800 mb-2">赢单转化率</p>
                  <div className="text-3xl font-bold text-orange-900">
                    {myXJs.length > 0 ? Math.round((myQuotations.filter(q => q.status === 'accepted').length / myXJs.length) * 100) : 0}%
                  </div>
                  <div className="flex items-center justify-center gap-1 mt-2">
                    <TrendingUp className="w-3 h-3 text-orange-700" />
                    <span className="text-xs text-orange-700">+3%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 每周业务趋势 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 趋势图 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center justify-between">
                  <span>每周业务趋势</span>
                  <span className="text-xs text-slate-500 font-normal">{supplierUiCopy.weeklyTrend}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-end justify-between gap-2 pb-8 relative">
                  {/* Y轴刻度 */}
                  <div className="absolute left-0 top-0 bottom-8 flex flex-col justify-between text-xs text-slate-400">
                    <span>80</span>
                    <span>60</span>
                    <span>40</span>
                    <span>20</span>
                    <span>0</span>
                  </div>
                  
                  {/* 柱状图 */}
                  <div className="flex-1 flex items-end justify-around gap-4 pl-8">
                    {[
                      { week: 'W1', inquiries: 58, quotations: 42 },
                      { week: 'W2', inquiries: 62, quotations: 45 },
                      { week: 'W3', inquiries: 64, quotations: 48 },
                      { week: 'W4', inquiries: 64, quotations: 51 }
                    ].map((data, idx) => (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                        <div className="w-full flex items-end justify-center gap-1" style={{ height: '200px' }}>
                          {/* 询价柱 */}
                          <div 
                            className="flex-1 bg-slate-300 rounded-t relative group cursor-pointer transition-all hover:bg-slate-400"
                            style={{ height: `${(data.inquiries / 80) * 100}%` }}
                          >
                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <span className="text-xs font-medium text-slate-700">{data.inquiries}</span>
                            </div>
                          </div>
                          {/* 报价柱 */}
                          <div 
                            className="flex-1 bg-orange-500 rounded-t relative group cursor-pointer transition-all hover:bg-orange-600"
                            style={{ height: `${(data.quotations / 80) * 100}%` }}
                          >
                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <span className="text-xs font-medium text-orange-700">{data.quotations}</span>
                            </div>
                          </div>
                        </div>
                        <span className="text-xs text-slate-600 font-medium">{data.week}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* 图例 */}
                <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-slate-300 rounded"></div>
                    <span className="text-xs text-slate-600">询价</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-orange-500 rounded"></div>
                    <span className="text-xs text-slate-600">报价</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 产品类别分布 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center justify-between">
                  <span>产品类别分布</span>
                  <span className="text-xs text-slate-500 font-normal">{supplierUiCopy.categoryDistribution}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { name: '电气产品', orders: 45, amount: 680000, percentage: 38, color: 'bg-blue-500' },
                    { name: '卫浴产品', orders: 32, amount: 520000, percentage: 28, color: 'bg-green-500' },
                    { name: '门窗配件', orders: 28, amount: 420000, percentage: 24, color: 'bg-orange-500' },
                    { name: '劳保用品', orders: 12, amount: 180000, percentage: 10, color: 'bg-purple-500' }
                  ].map((category, idx) => (
                    <div key={idx}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded ${category.color}`}></div>
                          <span className="text-sm font-medium text-slate-700">{category.name}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-semibold text-slate-900">{category.orders} 订单</span>
                          <span className="text-xs text-slate-500 ml-2">¥{(category.amount / 1000).toFixed(0)}K</span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div 
                          className={`h-full ${category.color} transition-all duration-500`}
                          style={{ width: `${category.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 转化漏斗Tab */}
        <TabsContent value="conversion" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">订单转化漏斗</CardTitle>
              <CardDescription>从询价到成交的完整转化路径</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-w-2xl mx-auto py-8">
                {[
                  { label: '询价', count: myXJs.length, percentage: 100, color: 'bg-blue-500' },
                  { label: '报价', count: myQuotations.length, percentage: myXJs.length > 0 ? Math.round((myQuotations.length / myXJs.length) * 100) : 0, color: 'bg-indigo-500' },
                  { label: '合同', count: myQuotations.filter(q => q.status === 'accepted').length, percentage: myXJs.length > 0 ? Math.round((myQuotations.filter(q => q.status === 'accepted').length / myXJs.length) * 100) : 0, color: 'bg-purple-500' },
                  { label: '订单', count: stats.activeOrders, percentage: myXJs.length > 0 ? Math.round((stats.activeOrders / myXJs.length) * 100) : 0, color: 'bg-pink-500' },
                  { label: '完成', count: stats.completedOrders, percentage: myXJs.length > 0 ? Math.round((stats.completedOrders / myXJs.length) * 100) : 0, color: 'bg-green-500' }
                ].map((stage, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-700">{stage.label}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-bold text-slate-900">{stage.count}</span>
                        <span className="text-sm text-slate-500 w-12 text-right">{stage.percentage}%</span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                      <div 
                        className={`h-full ${stage.color} transition-all duration-700 ease-out`}
                        style={{ width: `${stage.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 业绩分析Tab */}
        <TabsContent value="analysis" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 月度业绩 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">月度业绩趋势</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-slate-500">
                  <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>月度业绩数据图表</p>
                </div>
              </CardContent>
            </Card>

            {/* 产品分析 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">热销产品排行</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-slate-500">
                  <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>产品销售排行榜</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );

  // 🔥 渲染询价单列表
  const renderRFQList = () => {
    const pendingRFQs = categorizedRFQs.pending.filter((xj) => !hiddenXJIds.has(String(xj.id)));

    return (
      <div className="space-y-4">
        {/* 工具栏 */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 flex items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="搜索询价单号、产品名称..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36 h-9 text-sm">
                <SelectValue placeholder="状态筛选" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="pending">待报价</SelectItem>
                <SelectItem value="quoted">已报价</SelectItem>
                <SelectItem value="accepted">已接受</SelectItem>
              </SelectContent>
            </Select>
            {/* 批量删除（仅从当前供应商视图隐藏，不影响采购端数据） */}
            {selectedIds.length > 0 && (
              <Button 
                size="sm" 
                variant="destructive" 
                className="h-9 gap-2"
                onClick={() => {
                  const targets = selectedIds.filter((id) => pendingRFQs.some((xj) => xj.id === id));
                  if (!targets.length) return;
                  if (!window.confirm(`确定删除选中的 ${targets.length} 条客户需求吗？\n\n仅从当前供应商视图移除，不影响采购端与数据库数据。`)) return;
                  hideXJsForCurrentSupplier(targets);
                  toast.success(`已从当前视图删除 ${targets.length} 条客户需求`);
                }}
              >
                <Trash2 className="w-3.5 h-3.5" />
                批量删除 ({selectedIds.length})
              </Button>
            )}
          </div>
        </div>

        {/* 表格 */}
        <Card className="rounded-none border-x-0 border-t-0 shadow-none">
          <Table className="border-collapse text-sm">
            <TableHeader>
              <TableRow className="border-b-2 border-slate-200 bg-slate-50 hover:bg-slate-50">
                <TableHead className="w-12 h-auto px-3 py-2.5 text-left">
                  <Checkbox 
                    checked={selectedIds.length === pendingRFQs.length && pendingRFQs.length > 0}
                    onCheckedChange={() => {
                      if (selectedIds.length === pendingRFQs.length) {
                        setSelectedIds([]);
                      } else {
                        setSelectedIds(pendingRFQs.map(xj => xj.id));
                      }
                    }}
                  />
                </TableHead>
                <TableHead className="w-16 h-auto px-3 py-2.5 text-sm font-semibold text-slate-900">序号</TableHead>
                <TableHead className="w-44 h-auto px-3 py-2.5 text-sm font-semibold text-slate-900">日期</TableHead>
                <TableHead className="w-40 h-auto px-3 py-2.5 text-sm font-semibold text-slate-900">询价单号</TableHead>
                <TableHead className="w-36 h-auto px-3 py-2.5 text-sm font-semibold text-slate-900">客户名称</TableHead>
                <TableHead className="h-auto px-3 py-2.5 text-sm font-semibold text-slate-900">产品信息</TableHead>
                <TableHead className="w-28 h-auto px-3 py-2.5 text-sm font-semibold text-slate-900">数量</TableHead>
                <TableHead className="w-24 h-auto px-3 py-2.5 text-sm font-semibold text-slate-900">状态</TableHead>
                <TableHead className="w-40 h-auto px-3 py-2.5 text-sm font-semibold text-slate-900">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingRFQs.length > 0 ? (
                pendingRFQs.map((xj, index) => {
                  const customerIdentity = getCustomerIdentityForXJ(xj);

                  return (
                  <TableRow key={xj.id} className="hover:bg-slate-50/80">
                    <TableCell className="px-3 py-2.5">
                      <Checkbox 
                        checked={selectedIds.includes(xj.id)}
                        onCheckedChange={() => {
                          setSelectedIds(prev => 
                            prev.includes(xj.id) 
                              ? prev.filter(id => id !== xj.id)
                              : [...prev, xj.id]
                          );
                        }}
                      />
                    </TableCell>
                    <TableCell className="px-3 py-2.5">
                      <span className="text-sm text-slate-600">{index + 1}</span>
                    </TableCell>
                    <TableCell className="px-3 py-2.5">
                      {(() => {
                        const dateEntries = [
                          {
                            label: '创',
                            value: xj.submittedDate || xj.createdDate || xj.createdAt || xj.updatedAt,
                          },
                          {
                            label: '截',
                            value: xj.quotationDeadline,
                          },
                        ].filter((entry) => String(entry.value || '').trim());
                        const primaryDate = dateEntries[0];
                        const secondaryDates = dateEntries.slice(1);

                        if (!primaryDate) {
                          return <span className="text-sm text-slate-300">—</span>;
                        }

                        return (
                          <div className="flex items-center gap-1.5 whitespace-nowrap">
                            <span className="text-sm font-semibold text-slate-500">{primaryDate.label}</span>
                            <span className="text-sm font-semibold text-slate-900 tabular-nums">
                              {formatBusinessDate(primaryDate.value).replace(/\//g, '-')}
                            </span>
                            {secondaryDates.length > 0 && (
                              <Popover>
                                <PopoverTrigger asChild>
                                  <button
                                    type="button"
                                    className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700"
                                    aria-label="展开日期"
                                    onClick={(event) => event.stopPropagation()}
                                  >
                                    <ChevronDown className="h-3 w-3" />
                                  </button>
                                </PopoverTrigger>
                                <PopoverContent
                                  align="start"
                                  side="bottom"
                                  sideOffset={6}
                                  className="z-[80] w-auto rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-lg"
                                >
                                  <div className="inline-flex flex-col gap-1 whitespace-nowrap">
                                    {secondaryDates.map((entry) => (
                                      <div key={`${xj.id}-${entry.label}-${entry.value}`} className="flex items-baseline gap-2 text-sm leading-5">
                                        <span className="w-[18px] shrink-0 font-semibold text-slate-500">{entry.label}</span>
                                        <span className="font-semibold text-slate-900 tabular-nums">
                                          {formatBusinessDate(entry.value).replace(/\//g, '-')}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </PopoverContent>
                              </Popover>
                            )}
                          </div>
                        );
                      })()}
                    </TableCell>
                    <TableCell className="px-3 py-2.5">
                      {(() => {
                        const relatedNumbers = getSupplierVisibleRFQNumbers(xj);
                        const primaryNumber = relatedNumbers[0] || null;
                        const secondaryNumbers = relatedNumbers.slice(1);
                        const rfqKey = String(xj.id);
                        const isExpanded = expandedRFQIds.includes(rfqKey);

                        return (
                          <div className="flex min-w-[180px] items-center gap-1.5 whitespace-nowrap">
                            <span className="font-mono text-[13px] font-semibold leading-5 text-blue-600">
                              {primaryNumber?.value || xj.supplierXjNo || xj.xjNumber}
                            </span>
                            {secondaryNumbers.length > 0 && (
                              <Popover open={isExpanded} onOpenChange={(open) => setRFQExpanded(rfqKey, open)}>
                                <PopoverTrigger asChild>
                                  <button
                                    type="button"
                                    className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700"
                                    aria-label="展开关联编号"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                    }}
                                  >
                                    <ChevronDown className="h-3 w-3" />
                                  </button>
                                </PopoverTrigger>
                                <PopoverContent
                                  align="start"
                                  side="bottom"
                                  sideOffset={6}
                                  className="z-[80] w-auto min-w-0 max-w-none rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-lg"
                                >
                                  <div className="inline-flex flex-col gap-0.5 whitespace-nowrap">
                                    {secondaryNumbers.map((item) => (
                                      <p key={`${rfqKey}-${item.label}-${item.value}`} className={`text-xs font-semibold font-mono ${getSupplierNumberAccentClass(item.label)}`}>
                                        {item.value}
                                      </p>
                                    ))}
                                  </div>
                                </PopoverContent>
                              </Popover>
                            )}
                          </div>
                        );
                      })()}
                    </TableCell>
                    <TableCell className="px-3 py-2.5">
                      <span
                        className="block truncate text-[13px] font-medium text-slate-800"
                        title={customerIdentity.company || customerIdentity.name || '—'}
                      >
                        {customerIdentity.company || customerIdentity.name || '—'}
                      </span>
                    </TableCell>
                    <TableCell className="px-3 py-2.5">
                      {(() => {
                        const s = summarizeProducts(xj.products, xj);
                        return (
                          <p className="truncate text-[13px] font-medium leading-5 text-slate-800">
                            {s.representativeName}（共 {s.productCount} 个产品）
                          </p>
                        );
                      })()}
                    </TableCell>
                    <TableCell className="px-3 py-2.5 tabular-nums">
                      {(() => {
                        const s = summarizeProducts(xj.products, xj);
                        return (
                          <>
                            <span className="text-[13px] font-medium text-slate-700">{s.totalQuantity.toLocaleString()}</span>
                            <span className="ml-1 text-[11px] uppercase text-slate-400">{s.quantityUnit}</span>
                          </>
                        );
                      })()}
                    </TableCell>
                    <TableCell className="px-3 py-2.5">
                      {(() => {
                        const pushState = getRFQPushState(xj);
                        return (
                          <Badge className={`${pushState.badgeClassName} text-[12px] font-medium`}>
                            {pushState.badgeLabel}
                          </Badge>
                        );
                      })()}
                    </TableCell>
                    <TableCell className="px-3 py-2.5">
                      <div className="flex items-center gap-1.5">
                        {xj.documentData && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 px-3 text-xs font-medium"
                            onClick={() => {
                              setSelectedItem(xj);
                              setDocumentViewerOpen(true);
                            }}
                          >
                            {supplierUiCopy.view}
                          </Button>
                        )}
                        {/* 🔥 根据是否已下推报价显示不同按钮 */}
                        {(() => {
                          const pushState = getRFQPushState(xj);
                          const existingQuotation = pushState.activeQuotation;
                          
                          if (pushState.isPushed) {
                            return (
                              <Button
                                size="sm"
                                variant="outline"
                                className={pushState.actionClassName}
                                disabled
                              >
                                {pushState.actionLabel}
                              </Button>
                            );
                          } else {
                            return (
                              <Button
                                size="sm"
                                variant="outline"
                                className={pushState.actionClassName}
                                onClick={async () => {
                            // 🔥 下推报价 - 自动创建报价单并跳转到我的报价
                            try {
                              // 🔥 防止重复创建：检查是否已存在对应的报价单
                              const existingQuotation = findActiveQuotationForXJ(xj);

                              if (existingQuotation) {
                                toast.warning(
                                  <div className="space-y-1">
                                    <p className="font-semibold">⚠️ 报价单已存在</p>
                                    <p className="text-sm">询价单: {xj.supplierXjNo || xj.xjNumber}</p>
                                    <p className="text-sm">报价单: {existingQuotation.quotationNo}</p>
                                    <p className="text-xs text-slate-500 mt-1">正在跳转到我的报价...</p>
                                  </div>,
                                  { duration: 3000 }
                                );
                                
                                // 跳转到我的报价Tab
                                setTimeout(() => {
                                  setActiveTab('qt');
                                }, 800);
                                return;
                              }

                              // 创建报价单（使用默认值）
                              console.log('🔍 创建报价单 - 采购询价数据:', {
                                id: xj.id,
                                xjNumber: xj.xjNumber,
                                supplierXjNo: xj.supplierXjNo,
                                productName: xj.productName,
                                quantity: xj.quantity,
                                unit: xj.unit,
                                products: xj.products, // 🔥 多产品数组
                                productsCount: xj.products?.length || 0
                              });
                              
                              console.log('🔍 供应商信息:', {
                                email: supplierInfo?.email,
                                name: supplierInfo?.name,
                                company: supplierInfo?.company,
                                address: supplierInfo?.address,
                                phone: supplierInfo?.phone
                              });

                              const quotation = await createQuotationFromXJ(
                                xj,
                                supplierInfo,
                                {
                                  unitPrice: 0,
                                  leadTime: 30,
                                  moq: 1000,
                                  paymentTerms: xj?.documentData?.terms?.paymentTerms || 'T/T 30天',
                                  deliveryTerms: xj?.documentData?.terms?.deliveryTerms || 'FOB 厦门',
                                  status: 'draft'
                                }
                              );

                              console.log('✅ 报价单创建成功:', {
                                quotationNo: quotation.quotationNo,
                                itemsCount: quotation.items?.length || 0,
                              });

                              // Supabase-first: 保存到 supplier_quotations 表
                              const savedQuotation = await saveSupplierQuotation(quotation);
                              
                              // 更新本地状态
                              const updatedQuotations = [...supplierQuotations, savedQuotation];
                              setSupplierQuotations(updatedQuotations);

                              // Supabase-first: BJ 草稿仅建立关联，不把 XJ 提前标记为 quoted
                              try {
                                await syncXJQuoteFromBJ(savedQuotation, 'draft');
                              } catch (syncError: any) {
                                console.warn('⚠️ BJ 已创建，但 XJ 同步失败:', syncError);
                                toast.warning('报价单已创建，但询价单状态同步失败', {
                                  description: syncError?.message || '请刷新后确认状态',
                                  duration: 4000,
                                });
                              }

                              // 显示成功提示
                              toast.success(
                                <div className="space-y-1">
                                  <p className="font-semibold">✅ 报价单创建成功</p>
                                  <p className="text-sm">询价单: {xj.supplierXjNo || xj.xjNumber}</p>
                                  <p className="text-sm">报价单: {savedQuotation.quotationNo}</p>
                                  <p className="text-xs text-slate-500 mt-1">状态已更新为"已下推"，正在跳转到我的报价...</p>
                                </div>,
                                { duration: 3000 }
                              );

                              // 跳转到我的报价Tab
                              setTimeout(() => {
                                setActiveTab('qt');
                              }, 800);
                            } catch (error: any) {
                              console.error('创建报价单失败:', error);
                              toast.error('创建报价单失败，请重试', {
                                description: error?.message || '请查看控制台日志',
                              });
                            }
                          }}
                        >
                          {supplierUiCopy.pushQuote}
                        </Button>
                            );
                          }
                        })()}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 px-3 text-xs font-medium text-red-600 hover:text-red-700"
                          onClick={() => {
                            if (!window.confirm(`确定删除客户需求 ${xj.supplierXjNo || xj.xjNumber} 吗？\n\n仅从当前供应商视图移除，不影响采购端与数据库数据。`)) return;
                            hideXJsForCurrentSupplier([xj.id]);
                            toast.success('已从当前视图删除');
                          }}
                        >
                          {supplierUiCopy.delete}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={9} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <FileText className="w-12 h-12 mb-2" />
                      <p className="text-sm">暂无待报价询价单</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    );
  };

  // 🔥 渲染报价单列表
  const renderQuotationList = () => {
    return (
      <div className="space-y-4">
        {/* 工具栏 */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 flex items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="搜索报价单号、客户名称..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36 h-9 text-sm">
                <SelectValue placeholder="状态筛选" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="draft">草稿</SelectItem>
                <SelectItem value="submitted">已提交</SelectItem>
                <SelectItem value="accepted">已接受</SelectItem>
              </SelectContent>
            </Select>
            {/* 🔥 批量删除按钮 */}
            {selectedIds.length > 0 && (
              <Button 
                size="sm" 
                variant="destructive" 
                className="h-9 gap-2"
                onClick={async () => {
                  if (window.confirm(`确定要删除选中的 ${selectedIds.length} 个报价单吗？\n\n仅从当前供应商视图隐藏，不影响采购端与 Supabase 业务数据。`)) {
                    hideQuotationsForCurrentSupplier(selectedIds);
                    toast.success(
                      <div className="space-y-1">
                        <p className="font-semibold">🗑️ 批量删除成功</p>
                        <p className="text-sm">已从当前视图隐藏 {selectedIds.length} 个报价单</p>
                      </div>,
                      { duration: 3000 }
                    );
                  }
                }}
              >
                <Trash2 className="w-3.5 h-3.5" />
                批量删除 ({selectedIds.length})
              </Button>
            )}
          </div>
        </div>

        {/* 表格 */}
        <Card className="rounded-none border-x-0 border-t-0 shadow-none">
          {/* ── Flat density table: one attribute = one column, single-line rows ── */}
          <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-200 bg-slate-50">
                {/* Checkbox */}
                <th className="w-10 px-3 py-2.5 text-left">
                  <Checkbox
                    checked={selectedIds.length === myQuotations.length && myQuotations.length > 0}
                    onCheckedChange={() => {
                      if (selectedIds.length === myQuotations.length) {
                        setSelectedIds([]);
                      } else {
                        setSelectedIds(myQuotations.map(q => q.id));
                      }
                    }}
                  />
                </th>
                <th className="w-16 px-3 py-2.5 text-left text-sm font-semibold text-slate-900 whitespace-nowrap">序号</th>
                <th className="w-44 px-3 py-2.5 text-left text-sm font-semibold text-slate-900 whitespace-nowrap">日期</th>
                <th className="w-36 px-3 py-2.5 text-left text-sm font-semibold text-slate-900 whitespace-nowrap">报价单号</th>
                <th className="w-28 px-3 py-2.5 text-left text-sm font-semibold text-slate-900 whitespace-nowrap">客户名称</th>
                <th className="w-44 px-3 py-2.5 text-left text-sm font-semibold text-slate-900 whitespace-nowrap hidden xl:table-cell">客户公司</th>
                <th className="w-24 px-3 py-2.5 text-left text-sm font-semibold text-slate-900">数量</th>
                <th className="w-28 px-3 py-2.5 text-left text-sm font-semibold text-slate-900">单价</th>
                <th className="w-10 px-1 py-2.5 text-left text-sm font-semibold text-slate-900 hidden lg:table-cell">币种</th>
                {/* 报价金额 – focal column */}
                <th className="w-32 px-3 py-2.5 text-left text-sm font-semibold text-slate-900 whitespace-nowrap">报价金额 ↕</th>
                <th className="w-20 px-3 py-2.5 text-left text-sm font-semibold text-slate-900">状态</th>
                <th className="w-56 px-3 py-2.5 text-left text-sm font-semibold text-slate-900">操作</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {myQuotations.length > 0 ? (
                myQuotations.map((quotation, index) => {
                  const customerIdentity = getCustomerIdentityForQuotation(quotation);
                  // ── pre-compute helpers ──────────────────────────────────
                  const items: any[] = quotation.items ?? [];
                  const currency = quotation.currency || items[0]?.currency || 'CNY';
                  const symbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '¥';

                  const totalQty = items.reduce((s: number, it: any) => s + (Number(it.quantity) || 0), 0);
                  const unit = items.length === 1 ? (items[0].unit || '') : '';

                  const prices = items
                    .map((it: any) => it.unitPrice)
                    .filter((p: any) => p != null && Number.isFinite(Number(p)))
                    .map(Number);
                  const minP = prices.length ? Math.min(...prices) : null;
                  const maxP = prices.length ? Math.max(...prices) : null;
                  const unitPriceDisplay =
                    prices.length === 0 ? '—'
                    : minP === maxP
                      ? minP!.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                      : `${minP!.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}~${maxP!.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

                  const total = quotation.totalAmount;
                  const totalDisplay =
                    total != null && Number.isFinite(total)
                      ? total.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                      : null;

                  const STATUS: Record<string, { label: string; dot: string; text: string }> = {
                    draft:     { label: '草稿',   dot: 'bg-slate-400',   text: 'text-slate-500' },
                    submitted: { label: '已提交', dot: 'bg-blue-500',    text: 'text-blue-600'  },
                    accepted:  { label: '已接受', dot: 'bg-emerald-500', text: 'text-emerald-600' },
                    rejected:  { label: '已拒绝', dot: 'bg-red-500',     text: 'text-red-500'   },
                    completed: { label: '已完成', dot: 'bg-purple-500',  text: 'text-purple-600' },
                  };
                  const st = STATUS[quotation.status] ?? STATUS.draft;

                  const isSelected = selectedIds.includes(quotation.id);

                  return (
                  <React.Fragment key={quotation.id}>
                    <tr
                      className={`group transition-colors ${
                        isSelected
                          ? 'bg-blue-50/60'
                          : 'hover:bg-slate-50/80'
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="px-3">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => {
                            setSelectedIds(prev =>
                              prev.includes(quotation.id)
                                ? prev.filter(id => id !== quotation.id)
                                : [...prev, quotation.id]
                            );
                          }}
                        />
                      </td>

                      {/* 序号 */}
                      <td className="px-3 text-left whitespace-nowrap">
                        <span className="text-sm text-slate-600">{index + 1}</span>
                      </td>

                      {/* 日期 */}
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        {(() => {
                          const dateEntries = [
                            {
                              label: '创',
                              value: quotation.quotationDate || quotation.createdDate || quotation.createdAt,
                            },
                            {
                              label: '截',
                              value: quotation.validUntil,
                            },
                            {
                              label: '提',
                              value: quotation.submittedDate,
                            },
                          ].filter((entry) => String(entry.value || '').trim());

                          if (dateEntries.length === 0) {
                            return <span className="text-sm text-slate-300">—</span>;
                          }

                          const primaryDate = dateEntries[0];
                          const secondaryDates = dateEntries.slice(1);

                          return (
                            <div className="flex items-center gap-1.5 whitespace-nowrap">
                              <span className="text-sm font-semibold text-slate-500">{primaryDate.label}</span>
                              <span className="text-sm font-semibold text-slate-900 tabular-nums">
                                {formatBusinessDate(String(primaryDate.value)).replace(/\//g, '-')}
                              </span>
                              {secondaryDates.length > 0 && (
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <button
                                      type="button"
                                      className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700"
                                      aria-label="展开日期"
                                      onClick={(event) => event.stopPropagation()}
                                    >
                                      <ChevronDown className="h-3 w-3" />
                                    </button>
                                  </PopoverTrigger>
                                  <PopoverContent
                                    align="start"
                                    side="bottom"
                                    sideOffset={6}
                                    className="z-[80] w-auto rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-lg"
                                  >
                                    <div className="inline-flex flex-col gap-1 whitespace-nowrap">
                                      {secondaryDates.map((entry) => (
                                        <div key={`${quotation.id}-${entry.label}`} className="flex items-baseline gap-2 text-sm leading-5">
                                          <span className="w-[18px] shrink-0 font-semibold text-slate-500">{entry.label}</span>
                                          <span className="font-semibold text-slate-900 tabular-nums">
                                            {formatBusinessDate(String(entry.value)).replace(/\//g, '-')}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </PopoverContent>
                                </Popover>
                              )}
                            </div>
                          );
                        })()}
                      </td>

                      {/* 报价单号 – clickable, primary identifier */}
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        {(() => {
                          const relatedNumbers = [
                            quotation.sourceXJ ? { label: '关联询价单', value: quotation.sourceXJ } : null,
                          ].filter(Boolean) as Array<{ label: string; value: string }>;

                          return (
                            <div className="flex items-center gap-1.5 whitespace-nowrap">
                              <button
                                className="font-mono text-[13px] font-semibold text-blue-600 hover:text-blue-700 hover:underline underline-offset-2 transition-colors"
                                onClick={() => {
                                  setSelectedQuotation(quotation);
                                  setQuotationDocumentViewerOpen(true);
                                }}
                              >
                                {quotation.quotationNo}
                              </button>
                              {relatedNumbers.length > 0 && (
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <button
                                      type="button"
                                      className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700"
                                      aria-label="展开关联编号"
                                      onClick={(event) => event.stopPropagation()}
                                    >
                                      <ChevronDown className="h-3 w-3" />
                                    </button>
                                  </PopoverTrigger>
                                  <PopoverContent
                                    align="start"
                                    side="bottom"
                                    sideOffset={6}
                                    className="z-[80] w-auto min-w-0 max-w-none rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-lg"
                                  >
                                    <div className="inline-flex flex-col gap-1 whitespace-nowrap">
                                      {relatedNumbers.map((item) => (
                                        <div key={`${quotation.id}-${item.label}-${item.value}`} className="flex items-baseline gap-2 text-sm leading-5">
                                          <span className="font-semibold text-slate-500">{item.label}</span>
                                          <span className="font-mono text-xs font-semibold text-blue-600">
                                            {item.value}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </PopoverContent>
                                </Popover>
                              )}
                            </div>
                          );
                        })()}
                      </td>

                      {/* 客户名称 */}
                      <td className="px-3 py-2.5 max-w-[112px]">
                        <span className="text-[13px] font-medium text-slate-800 truncate block" title={customerIdentity.company || customerIdentity.name || '—'}>
                          {customerIdentity.company || customerIdentity.name || '—'}
                        </span>
                      </td>

                      {/* 客户公司（响应式隐藏 < xl） */}
                      <td className="px-3 py-2.5 max-w-[176px] hidden xl:table-cell">
                        <span className="text-[12px] text-slate-500 truncate block" title={customerIdentity.name || customerIdentity.company || '—'}>
                          {customerIdentity.name || customerIdentity.company || '—'}
                        </span>
                      </td>

                      {/* 数量 – L3 */}
                      <td className="px-3 py-2.5 text-left whitespace-nowrap tabular-nums">
                        {items.length === 0 ? (
                          <span className="text-[13px] text-slate-300">—</span>
                        ) : (
                          <>
                            <span className="text-[13px] font-medium text-slate-700">
                              {totalQty.toLocaleString('zh-CN')}
                            </span>
                            {unit && (
                              <span className="text-[11px] text-slate-400 ml-0.5 uppercase">{unit}</span>
                            )}
                          </>
                        )}
                      </td>

                      {/* 单价 – L2: same size as qty, stronger color */}
                      <td className="px-3 py-2.5 text-left whitespace-nowrap tabular-nums">
                        <span className="text-[13px] font-semibold text-slate-700">
                          {unitPriceDisplay === '—' ? (
                            <span className="font-normal text-slate-300">—</span>
                          ) : (
                            unitPriceDisplay
                          )}
                        </span>
                      </td>

                      {/* 币种（响应式隐藏 < lg） */}
                      <td className="px-1 py-2.5 text-left hidden lg:table-cell">
                        <span className="text-[10px] font-medium text-slate-400 tracking-wide">{currency}</span>
                      </td>

                      {/* 报价金额 – L1 FOCAL COLUMN */}
                      <td className="px-3 py-2.5 text-left whitespace-nowrap tabular-nums">
                        {totalDisplay ? (
                          <span className="text-[15px] font-bold text-slate-900">
                            {symbol}{totalDisplay}
                          </span>
                        ) : (
                          <span className="text-[13px] text-slate-300">—</span>
                        )}
                      </td>

                      {/* 状态 badge – dot + label */}
                      <td className="px-3 py-2.5">
                        <span className={`inline-flex items-center gap-1.5 text-[12px] font-medium ${st.text} whitespace-nowrap`}>
                          <span className={`inline-block w-1.5 h-1.5 rounded-full ${st.dot} flex-shrink-0`} />
                          {st.label}
                        </span>
                      </td>

                      {/* 操作 */}
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-1.5">
                        {/* 查看文档 */}
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 px-3 text-xs font-medium border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50 gap-1.5"
                          onClick={() => {
                            setSelectedQuotation(quotation);
                            setQuotationDocumentViewerOpen(true);
                          }}
                        >
                          查看
                        </Button>

                        {/* 核算 / 重新核算 — 弹窗模式 */}
                        {quotation.status === 'draft' ? (
                          <Button
                            size="sm"
                            className="h-8 px-3 text-xs font-medium bg-orange-500 hover:bg-orange-600 text-white gap-1.5 shadow-sm"
                            onClick={() => openQuotationEditor(quotation.id)}
                          >
                            核算报价
                          </Button>
                        ) : quotation.status === 'submitted' ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 px-3 text-xs font-medium border-orange-200 text-orange-600 hover:bg-orange-50 gap-1.5"
                            onClick={async () => {
                              const reverted = { ...quotation, status: 'draft' as const };
                              await saveSupplierQuotation(reverted);
                              await syncXJQuoteFromBJ(reverted, 'draft');
                              const updated = supplierQuotations.map(q =>
                                q.id === quotation.id ? reverted : q
                              );
                              setSupplierQuotations(updated);
                              openQuotationEditor(quotation.id);
                              toast.info('已撤回为草稿，可重新核算报价');
                            }}
                          >
                            重新核算
                          </Button>
                        ) : null}

                        {/* 提交报价 */}
                        {quotation.status === 'draft' && (() => {
                          const isQuotationValid = () => {
                            const allPricesValid = quotation.items?.every((item: any) => item.unitPrice && item.unitPrice > 0);
                            const firstItem = quotation.items?.[0];
                            const leadTimeValid = firstItem?.leadTime && firstItem.leadTime > 0;
                            const moqValid = firstItem?.moq && firstItem.moq > 0;
                            const paymentTermsValid = quotation.paymentTerms && quotation.paymentTerms.trim().length > 0;
                            const deliveryTermsValid = quotation.deliveryTerms && quotation.deliveryTerms.trim().length > 0;
                            return allPricesValid && leadTimeValid && moqValid && paymentTermsValid && deliveryTermsValid;
                          };
                          const isValid = isQuotationValid();
                          return (
                            <Button
                              size="sm"
                              className="h-8 px-3 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                              disabled={!isValid}
                              onClick={async () => {
                                if (!isValid) {
                                  toast.error(
                                    <div className="space-y-1">
                                      <p className="font-semibold">⚠️ 无法提交报价</p>
                                      <p className="text-sm">请先点击"核算报价"填写以下必填项：</p>
                                      <ul className="text-xs list-disc list-inside space-y-0.5">
                                        <li>所有产品的单价</li>
                                        <li>交货周期</li>
                                        <li>最小起订量(MOQ)</li>
                                        <li>付款方式</li>
                                        <li>交货条款</li>
                                      </ul>
                                    </div>,
                                    { duration: 5000 }
                                  );
                                  return;
                                }
                                const updatedQuotation = {
                                  ...quotation,
                                  status: 'submitted' as const,
                                  submittedDate: new Date().toISOString().split('T')[0],
                                };
                                // Supabase-first: 更新 supplier_quotations 表
                                await saveSupplierQuotation(updatedQuotation);
                                await syncXJQuoteFromBJ(updatedQuotation, 'submitted');
                                setSupplierQuotations(prev => prev.map(q => q.id === quotation.id ? updatedQuotation : q));
                                toast.success(
                                  <div className="space-y-1">
                                    <p className="font-semibold">✅ 报价单已提交给COSUN采购</p>
                                    <p className="text-sm">报价单号: {quotation.quotationNo}</p>
                                    <p className="text-xs text-slate-500 mt-1">采购方将收到报价通知</p>
                                  </div>,
                                  { duration: 3000 }
                                );
                              }}
                            >
                              提交报价
                            </Button>
                          );
                        })()}

                        </div>
                      </td>
                    </tr>

                    {/* 核算报价已改为弹窗模式，见下方 Dialog */}
                  </React.Fragment>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={13} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <Calculator className="w-12 h-12 mb-2" />
                      <p className="text-sm">暂无报价单</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        </Card>
      </div>
    );
  };

  // 🔥 渲染在制订单列表
  const renderActiveOrders = () => {
    const activeOrders = activeSupplierOrders;

    return (
      <div className="space-y-4">
        <Card>
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="w-12">
                  <Checkbox 
                    checked={selectedIds.length === activeOrders.length && activeOrders.length > 0}
                    onCheckedChange={() => {
                      if (selectedIds.length === activeOrders.length) {
                        setSelectedIds([]);
                      } else {
                        setSelectedIds(activeOrders.map(o => o.id));
                      }
                    }}
                  />
                </TableHead>
                <TableHead className="w-16">序号</TableHead>
                <TableHead className="w-40">订单号</TableHead>
                <TableHead className="w-36">客户名称</TableHead>
                <TableHead>产品信息</TableHead>
                <TableHead className="w-32">生产进度</TableHead>
                <TableHead className="w-32">预计交期</TableHead>
                <TableHead className="w-24">状态</TableHead>
                <TableHead className="w-64">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeOrders.length > 0 ? (
                activeOrders.map((order, index) => {
                  const displayItems = getOrderItemsForDisplay(order);
                  const summary = summarizeProducts(displayItems, order);
                  const statusBadge = getSupplierOrderStatusBadge(order);
                  const progress = getSupplierOrderProgress(order);
                  const actionButtons = getSupplierOrderActionConfig(order);
                  const customerIdentity = getCustomerIdentityForOrder(order);
                  const relatedNumbers = getSupplierVisibleRelatedNumbers(order);
                  const primaryNumber = relatedNumbers[0] || null;
                  const secondaryNumbers = relatedNumbers.slice(1);
                  const orderNumberDetails = [
                    ...secondaryNumbers,
                    formatExecutionBaseline(order)
                      ? { label: '执行基线', value: formatExecutionBaseline(order) || '' }
                      : null,
                    resolveProjectExecutionBaseline(order)?.projectRevisionId
                      ? {
                          label: '版本状态',
                          value: isFinalExecutionReady(order) ? '可执行版本' : '非最终版本',
                        }
                      : null,
                  ].filter(Boolean) as Array<{ label: string; value: string }>;

                  return (
                  <React.Fragment key={order.id}>
                  <TableRow className="hover:bg-slate-50">
                    <TableCell>
                      <Checkbox 
                        checked={selectedIds.includes(order.id)}
                        onCheckedChange={() => {
                          setSelectedIds(prev => 
                            prev.includes(order.id) 
                              ? prev.filter(id => id !== order.id)
                              : [...prev, order.id]
                          );
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-slate-600">{index + 1}</span>
                    </TableCell>
                    <TableCell className="py-2.5">
                      <div className="flex items-center gap-1.5 whitespace-nowrap">
                        <span className="font-mono text-[13px] font-semibold text-blue-600">
                          {primaryNumber?.value || order.poNumber || order.cgNumber || order.xjNumber}
                        </span>
                        {orderNumberDetails.length > 0 && (
                          <Popover>
                            <PopoverTrigger asChild>
                              <button
                                type="button"
                                className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700"
                                aria-label="展开关联编号"
                                onClick={(event) => event.stopPropagation()}
                              >
                                <ChevronDown className="h-3 w-3" />
                              </button>
                            </PopoverTrigger>
                            <PopoverContent
                              align="start"
                              side="bottom"
                              sideOffset={6}
                              className="z-[80] w-auto min-w-0 max-w-none rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-lg"
                            >
                              <div className="inline-flex flex-col gap-1 whitespace-nowrap">
                                {orderNumberDetails.map((item) => (
                                  <div key={`${order.id}-${item.label}-${item.value}`} className="flex items-baseline gap-2 text-sm leading-5">
                                    <span className="font-semibold text-slate-500">{item.label}</span>
                                    <span className={`font-mono text-xs font-semibold ${getSupplierNumberAccentClass(item.label)}`}>
                                      {item.value}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </PopoverContent>
                          </Popover>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className="text-sm font-medium text-slate-900 truncate block"
                        title={customerIdentity.company || customerIdentity.name || '—'}
                      >
                        {customerIdentity.company || customerIdentity.name || '—'}
                      </span>
                    </TableCell>
                    <TableCell>
                          <p className="text-sm font-medium text-slate-900 leading-tight truncate">
                            {summary.representativeName}（共 {summary.productCount} 个产品）
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            总数量：{summary.totalQuantity.toLocaleString()} {summary.quantityUnit}
                          </p>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-600">{statusBadge.label}</span>
                          <span className="font-medium text-blue-600">{progress}%</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-1.5">
                          <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${progress}%` }}></div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-slate-600">{formatBusinessDate(order.expectedDate || order.expectedDeliveryDate || order.estimatedCompletionDate)}</span>
                    </TableCell>
                    <TableCell>
                          <Badge className={statusBadge.className}>
                            {statusBadge.label}
                          </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 flex-wrap">
                        {actionButtons.map((action) => {
                          const actionKey = `${order.id}:${action.key}`;
                          return (
                            <Button
                              key={action.key}
                              size="sm"
                              variant={action.variant || 'default'}
                              className="h-7 px-2 text-xs"
                              disabled={activeOrderActionKey === actionKey}
                              onClick={action.onClick}
                            >
                              {activeOrderActionKey === actionKey ? '处理中...' : action.label}
                            </Button>
                          );
                        })}
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-xs"
                          onClick={() => openPurchaseOrderViewer(order)}
                        >
                          详情
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  </React.Fragment>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={9} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <Package className="w-12 h-12 mb-2" />
                      <p className="text-sm">暂无在制订单</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    );
  };

  // 🔥 渲染历史订单列表
  const renderHistoryOrders = () => {
    const completedOrders = historySupplierOrders;

    return (
      <div className="space-y-4">
        <Card>
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="w-12">
                  <Checkbox 
                    checked={selectedIds.length === completedOrders.length && completedOrders.length > 0}
                    onCheckedChange={() => {
                      if (selectedIds.length === completedOrders.length) {
                        setSelectedIds([]);
                      } else {
                        setSelectedIds(completedOrders.map(o => o.id));
                      }
                    }}
                  />
                </TableHead>
                <TableHead className="w-16">序号</TableHead>
                <TableHead className="w-40">订单号</TableHead>
                <TableHead className="w-36">客户名称</TableHead>
                <TableHead>产品信息</TableHead>
                <TableHead className="w-32">订单金额</TableHead>
                <TableHead className="w-32">完成日期</TableHead>
                <TableHead className="w-32">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {completedOrders.length > 0 ? (
                completedOrders.map((order, index) => {
                  const displayItems = getOrderItemsForDisplay(order);
                  const summary = summarizeProducts(displayItems, order);
                  const customerIdentity = getCustomerIdentityForOrder(order);
                  const relatedNumbers = getSupplierVisibleRelatedNumbers(order);
                  const primaryNumber = relatedNumbers[0] || null;
                  const secondaryNumbers = relatedNumbers.slice(1);
                  const orderNumberDetails = [
                    ...secondaryNumbers,
                    formatExecutionBaseline(order)
                      ? { label: '执行基线', value: formatExecutionBaseline(order) || '' }
                      : null,
                    resolveProjectExecutionBaseline(order)?.projectRevisionId
                      ? {
                          label: '版本状态',
                          value: isFinalExecutionReady(order) ? supplierUiCopy.finalExecution : supplierUiCopy.historicalRevision,
                        }
                      : null,
                  ].filter(Boolean) as Array<{ label: string; value: string }>;

                  return (
                  <React.Fragment key={order.id}>
                  <TableRow className="hover:bg-slate-50">
                    <TableCell>
                      <Checkbox 
                        checked={selectedIds.includes(order.id)}
                        onCheckedChange={() => {
                          setSelectedIds(prev => 
                            prev.includes(order.id) 
                              ? prev.filter(id => id !== order.id)
                              : [...prev, order.id]
                          );
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-slate-600">{index + 1}</span>
                    </TableCell>
                    <TableCell className="py-2.5">
                      <div className="flex items-center gap-1.5 whitespace-nowrap">
                        <span className="font-mono text-[13px] font-semibold text-blue-600">
                          {primaryNumber?.value || order.poNumber || order.cgNumber || '历史订单'}
                        </span>
                        {orderNumberDetails.length > 0 && (
                          <Popover>
                            <PopoverTrigger asChild>
                              <button
                                type="button"
                                className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700"
                                aria-label="展开关联编号"
                                onClick={(event) => event.stopPropagation()}
                              >
                                <ChevronDown className="h-3 w-3" />
                              </button>
                            </PopoverTrigger>
                            <PopoverContent
                              align="start"
                              side="bottom"
                              sideOffset={6}
                              className="z-[80] w-auto min-w-0 max-w-none rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-lg"
                            >
                              <div className="inline-flex flex-col gap-1 whitespace-nowrap">
                                {orderNumberDetails.map((item) => (
                                  <div key={`${order.id}-history-${item.label}-${item.value}`} className="flex items-baseline gap-2 text-sm leading-5">
                                    <span className="font-semibold text-slate-500">{item.label}</span>
                                    <span className={`font-mono text-xs font-semibold ${getSupplierNumberAccentClass(item.label)}`}>
                                      {item.value}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </PopoverContent>
                          </Popover>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <p
                        className="text-sm font-medium text-slate-900 truncate"
                        title={customerIdentity.company || customerIdentity.name || '—'}
                      >
                        {customerIdentity.company || customerIdentity.name || '—'}
                      </p>
                    </TableCell>
                    <TableCell>
                          <p className="text-sm font-medium text-slate-900 leading-tight truncate">
                            {summary.representativeName}（共 {summary.productCount} 个产品）
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            总数量：{summary.totalQuantity.toLocaleString()} {summary.quantityUnit}
                          </p>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-semibold text-slate-900">
                        {(order.currency || 'CNY') === 'USD' ? '$' : (order.currency || 'CNY') === 'EUR' ? '€' : '¥'}{order.totalAmount?.toLocaleString() || 0}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-slate-600">{formatBusinessDate(order.updatedAt || order.updatedDate || order.actualDate || order.createdDate || order.createdAt)}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-xs"
                          onClick={() => openPurchaseOrderViewer(order)}
                        >
                          查看
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs">
                          下载
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  </React.Fragment>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <Archive className="w-12 h-12 mb-2" />
                      <p className="text-sm">暂无历史订单</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <LayoutGrid className="w-6 h-6 text-orange-600" />
            订单管理中心
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            询价 → 报价 → 订单全流程管理
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            导出报表
          </Button>
          <Button size="sm" variant="outline" className="gap-2">
            <Printer className="w-4 h-4" />
            打印
          </Button>
        </div>
      </div>

      {/* Tab导航 */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5 bg-slate-100 p-1 h-auto">
          <TabsTrigger value="overview" className="gap-2 py-2.5 data-[state=active]:bg-white">
            <LayoutGrid className="w-4 h-4" />
            <div className="text-left">
              <p className="text-sm font-medium">概览</p>
              <p className="text-xs opacity-75">{supplierUiCopy.overviewSecondary}</p>
            </div>
          </TabsTrigger>
          <TabsTrigger value="xj" className="gap-2 py-2.5 data-[state=active]:bg-white">
            <FileText className="w-4 h-4" />
            <div className="text-left">
              <p className="text-sm font-medium">客户需求</p>
              <p className="text-xs opacity-75">{supplierUiCopy.xjSecondaryLabel} · {stats.pendingRFQs}</p>
            </div>
          </TabsTrigger>
          <TabsTrigger value="qt" className="gap-2 py-2.5 data-[state=active]:bg-white">
            <Calculator className="w-4 h-4" />
            <div className="text-left">
              <p className="text-sm font-medium">我的报价</p>
              <p className="text-xs opacity-75">{supplierUiCopy.qtSecondaryLabel} · {myQuotations.length}</p>
            </div>
          </TabsTrigger>
          <TabsTrigger value="active-orders" className="gap-2 py-2.5 data-[state=active]:bg-white">
            <Factory className="w-4 h-4" />
            <div className="text-left">
              <p className="text-sm font-medium">在制订单</p>
              <p className="text-xs opacity-75">{supplierUiCopy.activeSecondaryLabel} · {stats.activeOrders}</p>
            </div>
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2 py-2.5 data-[state=active]:bg-white">
            <Archive className="w-4 h-4" />
            <div className="text-left">
              <p className="text-sm font-medium">历史订单</p>
              <p className="text-xs opacity-75">{supplierUiCopy.historySecondaryLabel} · {stats.completedOrders}</p>
            </div>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          {renderOverview()}
        </TabsContent>

        <TabsContent value="xj" className="mt-6">
          {renderRFQList()}
        </TabsContent>

        <TabsContent value="qt" className="mt-6">
          {renderQuotationList()}
        </TabsContent>

        <TabsContent value="active-orders" className="mt-6">
          {renderActiveOrders()}
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          {renderHistoryOrders()}
        </TabsContent>
      </Tabs>

      {selectedItem && (
        <XJDocumentViewer
          open={documentViewerOpen}
          onClose={() => setDocumentViewerOpen(false)}
          xj={selectedItem}
        />
      )}

      {/* 详情对话框 */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>报价单详情</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              {/* 报价单详细信息 */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-slate-600">报价单号</p>
                  <p className="font-medium">{selectedItem.quotationNo}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-600">客户</p>
                  <p className="font-medium">
                    {getCustomerIdentityForQuotation(selectedItem).company || getCustomerIdentityForQuotation(selectedItem).name || '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-600">报价日期</p>
                  <p className="font-medium">{selectedItem.quotationDate}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-600">有效期至</p>
                  <p className="font-medium">{selectedItem.validUntil}</p>
                </div>
                {formatExecutionBaseline(selectedItem) && (
                  <div className="col-span-2 rounded border border-purple-200 bg-purple-50 px-3 py-2">
                    <p className="text-xs text-purple-700">执行基线</p>
                    <p className="font-medium text-sm text-purple-800">{formatExecutionBaseline(selectedItem)}</p>
                    <p className={`mt-2 inline-flex items-center rounded border px-2 py-1 text-xs ${
                      isFinalExecutionReady(selectedItem)
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                        : 'border-amber-300 bg-amber-50 text-amber-700'
                    }`}>
                      {isFinalExecutionReady(selectedItem)
                        ? '该项目单据已对齐最终执行版本'
                        : '该项目单据仍为历史/评审版本，仅用于报价与追溯'}
                    </p>
                  </div>
                )}
              </div>
              
              {/* 产品列表 */}
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">产品清单</h4>
                <div className="space-y-2">
                  {selectedItem.items?.map((item: any, idx: number) => {
                    const normalized = normalizeSupplierProduct(item);
                    return (
                    <div key={idx} className="bg-slate-50 p-3 rounded border">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{normalized.productName || item.productName}</p>
                          <p className="text-xs text-slate-500">{getFormalBusinessModelNo(item)}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{item.quantity} {item.unit}</p>
                          {item.unitPrice && (
                            <p className="text-xs text-slate-500">¥{item.unitPrice}</p>
                          )}
                        </div>
                      </div>
                    </div>
                    );
                  })}
                </div>
              </div>

              {/* 总金额 */}
              <div className="border-t pt-4 flex justify-end">
                <div className="text-right">
                  <p className="text-sm text-slate-600">报价总金额</p>
                  <p className="text-2xl font-bold text-green-600">
                    ¥{selectedItem.totalAmount?.toLocaleString() || 0}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 报价单文档查看器 – 独立 DocumentModal（可拖动、A4分页） */}
      {selectedSupplierOrderDocumentData ? (
        <ProcurementDocumentViewerShell
          open={purchaseOrderViewerOpen}
          onClose={() => setPurchaseOrderViewerOpen(false)}
          title="采购订单"
          subtitle={selectedSupplierOrderDocumentData.poNo}
          templateLabel={selectedSupplierOrderTemplateLabel}
          icon={<ShoppingCart className="h-6 w-6" />}
          bodyClassName={SUPPLIER_DOCUMENT_PREVIEW_BODY_CLASS}
          innerClassName={SUPPLIER_DOCUMENT_PREVIEW_INNER_CLASS}
          actions={(
            <>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                disabled={exportingPurchaseOrder}
                onClick={async () => {
                  if (!purchaseOrderDocumentRef.current) return;
                  setExportingPurchaseOrder(true);
                  try {
                    const filename = generatePDFFilename('Purchase_Order', selectedSupplierOrderDocumentData.poNo);
                    await exportToPDF(purchaseOrderDocumentRef.current, filename);
                    toast.success('采购订单PDF导出成功！');
                  } catch (error) {
                    toast.error('PDF导出失败，请重试');
                    console.error('Purchase order PDF export error:', error);
                  } finally {
                    setExportingPurchaseOrder(false);
                  }
                }}
              >
                <Download className="h-4 w-4" />
                下载PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                disabled={exportingPurchaseOrder}
                onClick={async () => {
                  if (!purchaseOrderDocumentRef.current) return;
                  const filename = generatePDFFilename('Purchase_Order', selectedSupplierOrderDocumentData.poNo);
                  await exportToPDFPrint(purchaseOrderDocumentRef.current, filename);
                }}
              >
                <Printer className="h-4 w-4" />
                打印
              </Button>
            </>
          )}
        >
          <div ref={purchaseOrderDocumentRef}>
            <PurchaseOrderDocumentA4Pages data={selectedSupplierOrderDocumentData} />
          </div>
        </ProcurementDocumentViewerShell>
      ) : null}

      {/* 报价单文档查看器 – 独立 DocumentModal（可拖动、A4分页） */}
      {selectedQuotation && (
        <SupplierQuotationDocumentViewer
          open={quotationDocumentViewerOpen}
          onClose={() => setQuotationDocumentViewerOpen(false)}
          quotation={selectedQuotation}
          onEdit={() => {
            setQuotationDocumentViewerOpen(false);
            setQuotationEditorOpen(true);
          }}
          onSubmit={async () => {
            const updatedQuotation = {
              ...selectedQuotation,
              status: 'submitted' as const,
              submittedDate: new Date().toISOString().split('T')[0],
            };
            // Supabase-first
            await saveSupplierQuotation(updatedQuotation);
            await syncXJQuoteFromBJ(updatedQuotation, 'submitted');
            setSupplierQuotations(prev => prev.map(q => q.id === selectedQuotation.id ? updatedQuotation : q));
            setQuotationDocumentViewerOpen(false);
            toast.success(
              <div className="space-y-1">
                <p className="font-semibold">✅ 报价单已提交给COSUN采购</p>
                <p className="text-sm">报价单号: {selectedQuotation.quotationNo}</p>
                <p className="text-xs text-slate-500 mt-1">采购方将收到报价通知</p>
              </div>,
              { duration: 3000 },
            );
          }}
        />
      )}

      {/* 核算报价 弹窗 ── 自定义模态，完全参照 DocumentModal 的 inline-style 架构：
            遮罩(fixed inset-0) + Shell(fixed, display:flex, flexDirection:column, overflow:hidden)
            + Header(flexShrink:0 固定) + Body(flex:1, minHeight:0, overflowY:auto 独立滚动)
            使用 inline style 而非 Tailwind class，避免 Radix DialogContent 基类的 grid/overflow 冲突。
      */}
      {quotationEditorOpen && selectedQuotation && (
        <>
          {/* 遮罩 */}
          <div
            className="fixed inset-0 bg-black/50"
            style={{ zIndex: 1000 }}
          />

          {/* 弹窗 shell */}
          <div
            style={{
              position: 'fixed',
              top: '1rem',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 'min(calc(100vw - 2rem), 64rem)',   /* max-w-5xl = 64rem */
              height: 'calc(100dvh - 2rem)',
              zIndex: 1001,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              borderRadius: '0.5rem',
              border: '1px solid #e2e8f0',
              boxShadow: '0 8px 40px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.10)',
              background: '#fff',
            }}
          >
            {/* ── 固定标题栏（flexShrink:0，不参与滚动） ── */}
            <div
              style={{ flexShrink: 0 }}
              className="border-b border-slate-200 bg-white px-6 py-4"
            >
              <div className="flex items-center gap-3">
                <Calculator className="w-4 h-4 text-orange-500 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-[15px] font-semibold leading-tight text-slate-800">核算报价</div>
                  <div className="mt-0.5 text-[12px] text-slate-400">
                    {selectedQuotation.quotationNo} · {getCustomerIdentityForQuotation(selectedQuotation).company || getCustomerIdentityForQuotation(selectedQuotation).name || issuerFallbackName}
                  </div>
                </div>
                <button
                  onClick={closeQuotationEditor}
                  className="h-8 w-8 rounded flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors flex-shrink-0"
                  title="关闭 (Esc)"
                >
                  <XIcon className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* ── 可滚动内容区（flex:1, minHeight:0, overflowY:auto） ── */}
            <div
              style={{ flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}
              className="px-4 py-4"
            >
              <SupplierQuotationEditor
                quotation={selectedQuotation}
                onSave={async (updatedQuotation) => {
                  await saveSupplierQuotation(updatedQuotation);
                  const updatedQuotations = supplierQuotations.map(q =>
                    q.quotationNo === updatedQuotation.quotationNo ? updatedQuotation : q
                  );
                  setSupplierQuotations(updatedQuotations);
                  setSelectedQuotation(updatedQuotation);
                  await syncXJQuoteFromBJ(updatedQuotation, updatedQuotation.status || 'draft');
                  closeQuotationEditor();
                }}
                onCancel={closeQuotationEditor}
              />
            </div>
          </div>
        </>
      )}


    </div>
  );
}
