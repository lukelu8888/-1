// 🔥 THE COSUN BM - 订单管理中心 Pro版
// B2B全流程订单管理：询价 → 报价 → 合同 → 订单 → 收款

import React, { Suspense, useState, useEffect, useMemo, useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '../ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import {
  FileText, Package, DollarSign, Bell, Wallet, Search, Filter,
  Eye, Plus, Download, FileCheck, Loader2, CheckCircle2,
  Container, TrendingUp, Clock, ArrowRight, X, Send,
  ClipboardList, Receipt, Truck, CreditCard, Ship
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { Inquiry as CustomerInquiry } from '../../contexts/InquiryContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { useSalesQuotations } from '../../contexts/SalesQuotationContext'; // 🔥 新增：获取待审批数量
import { useInquiry } from '../../contexts/InquiryContext';
import { useQuoteRequirements } from '../../contexts/QuoteRequirementContext';
import { useSalesContracts } from '../../contexts/SalesContractContext';
import { usePayments } from '../../contexts/PaymentContext';
import { useQuotationRequests } from '../../contexts/QuotationRequestContext';
import { usePurchaseOrders } from '../../contexts/PurchaseOrderContext';
import { getCurrentUser } from '../../utils/dataIsolation'; // 🔥 新增：获取当前用户
import { useAuth } from '../../hooks/useAuth';
import { permissionCenterService } from '../../lib/services/permissionCenterService';
import { exportServiceOrdersDb } from '../../lib/supabase-db';
import { subscribeErpEvent } from '../../lib/erp-core/event-bus';
import { approvalRecordService } from '../../lib/supabaseService';
import {
  EMPTY_SALES_WORKFLOW_SOURCE_SNAPSHOT,
  hasSalesWorkflowSnapshotData,
  loadSalesWorkflowSourceSnapshot,
  readCachedSalesWorkflowSourceSnapshot,
} from '../../lib/services/salesWorkflowSourceService';
import { computeOrderManagementCounts } from '../../lib/services/orderManagementCountService';
import { deriveOrderCoordinatorTaskSummary } from '../../lib/services/orderCoordinatorTaskCenterService';
import { QuotationPDFTemplate } from './QuotationPDFTemplate';
import { SalesContractTemplate } from './SalesContractTemplate';
import { SalesContractDocumentPaginated } from '../documents/SalesContractDocumentPaginated'; // 🔥 分页版销售合同
import { SalesContractData } from '../documents/templates/SalesContractDocument'; // 🔥 销售合同数据类型
import { exportToPDF, generatePDFFilename } from '../../utils/pdfExport';
import type { User } from '../../lib/rbac-config';
import type { PaymentMode } from '../../contexts/SalesQuotationContext';
import {
  buildPaymentTermsText,
  deriveBalanceTrigger,
  getPaymentModeLabel,
  type BalanceTrigger,
} from '../../lib/paymentFlow';
const APPROVAL_CENTER_CACHE_PREFIX = 'approval_center_cache_v1';
const getApprovalCenterCacheKey = (email: string) => `${APPROVAL_CENTER_CACHE_PREFIX}:${email || 'anonymous'}`;
const getSwitchedRbacUser = () => {
  try {
    const stored = localStorage.getItem('cosun_switched_user') || localStorage.getItem('cosun_current_user');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};
const APPROVAL_CENTER_ROLE_BY_EMAIL: Record<string, 'Regional_Manager' | 'Sales_Director' | 'CEO'> = {
  'salesmanager-na@cosunchina.com': 'Regional_Manager',
  'salesmanager-sa@cosunchina.com': 'Regional_Manager',
  'salesmanager-ea@cosunchina.com': 'Regional_Manager',
  'sales.director@cosunchina.com': 'Sales_Director',
  'ceo@cosunchina.com': 'CEO',
  'ceo@cosun.com': 'CEO',
};

// 🔥 增强的报价产品接口
interface QuotationProduct {
  name: string;
  quantity: number;
  unitPrice: number;
  pcsPerCarton: number;
  cartonLength: number;
  cartonWidth: number;
  cartonHeight: number;
  grossWeight: number;
  netWeight: number;
  specification?: string;
  hsCode?: string; // HS编码
  moq?: number; // 最小起订量
  leadTime?: number; // 交付周期（天）
}

// 🔥 增强的报价接口
interface Quotation {
  id: string;
  inquiryId: string;
  customer: string;
  contactPerson?: string;
  email?: string;
  date: string;
  validUntil: string;
  totalAmount: number;
  status: 'Draft' | 'Sent' | 'Negotiating' | 'Accepted' | 'Rejected' | 'Expired' | 'Contract Generated';
  products: QuotationProduct[];
  paymentMode?: PaymentMode | null;
  balanceTrigger?: BalanceTrigger | null;
  paymentTerms?: string;
  deliveryTerms?: string;
  portOfLoading?: string;
  portOfDestination?: string;
  containerType?: '20GP' | '40GP' | '40HQ';
  contractGenerated?: boolean;
  contractNo?: string;
  region?: 'NA' | 'SA' | 'EA';
  currency?: 'USD' | 'EUR' | 'GBP';
  shippingMethod?: 'Sea' | 'Air' | 'Express';
  remarks?: string;
}

interface OrderManagementCenterProProps {
  currentUser?: User | null;
}

const LazyApprovalCenter = React.lazy(() =>
  import('./ApprovalCenter').then((module) => ({ default: module.ApprovalCenter }))
);
const LazyOrderOverviewDashboard = React.lazy(() => import('./OrderOverviewDashboard'));
const loadAdminInquiryManagement = () => import('./AdminInquiryManagementNew');
const LazyAdminInquiryManagement = React.lazy(loadAdminInquiryManagement);
const loadCostInquiryQuotationManagement = () =>
  import('./CostInquiryQuotationManagement').then((module) => ({ default: module.CostInquiryQuotationManagement }));
const LazyCostInquiryQuotationManagement = React.lazy(loadCostInquiryQuotationManagement);
const loadSalesQuotationManagement = () =>
  import('../salesperson/SalesQuotationManagement').then((module) => ({ default: module.SalesQuotationManagement }));
const LazySalesQuotationManagement = React.lazy(loadSalesQuotationManagement);
const loadSalesContractManagement = () =>
  import('../salesperson/SalesContractManagement').then((module) => ({ default: module.SalesContractManagement }));
const LazySalesContractManagement = React.lazy(loadSalesContractManagement);
const loadCollectionManagement = () => import('./CollectionManagement');
const LazyCollectionManagement = React.lazy(loadCollectionManagement);
const loadExportServiceWorkbench = () =>
  import('../salesperson/export-service/ExportServiceWorkbench').then((module) => ({ default: module.ExportServiceWorkbench }));
const LazyExportServiceWorkbench = React.lazy(loadExportServiceWorkbench);
const ORDER_CENTER_TAB_PRELOADERS = {
  overview: () => import('./OrderOverviewDashboard'),
  inquiries: loadAdminInquiryManagement,
  'cost-inquiry': loadCostInquiryQuotationManagement,
  quotations: loadSalesQuotationManagement,
  orders: loadSalesContractManagement,
  collections: loadCollectionManagement,
  approvals: () => import('./ApprovalCenter').then((module) => ({ default: module.ApprovalCenter })),
  'export-service': loadExportServiceWorkbench,
} as const;

const OrderCenterTabFallback = ({
  title,
  rows = 4,
}: {
  title: string;
  rows?: number;
}) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
    <div className="h-5 w-40 animate-pulse rounded bg-slate-200" />
    <p className="mt-3 text-sm text-slate-500">{title}</p>
    <div className="mt-5 space-y-3">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={`${title}-fallback-${index}`} className="h-16 animate-pulse rounded-xl bg-slate-50" />
      ))}
    </div>
  </div>
);

const logPerf = (label: string, startAt: number, extra?: Record<string, unknown>) => {
  const duration = Math.round(performance.now() - startAt);
  console.info(`[perf] ${label}: ${duration}ms`, extra || {});
};

const scheduleBrowserIdleTask = (callback: () => void, timeout = 1500) => {
  if (typeof window === 'undefined') return () => {};
  const idleWindow = window as Window & {
    requestIdleCallback?: (cb: () => void, options?: { timeout?: number }) => number;
    cancelIdleCallback?: (handle: number) => void;
  };

  if (typeof idleWindow.requestIdleCallback === 'function') {
    const idleId = idleWindow.requestIdleCallback(() => {
      callback();
    }, { timeout });

    return () => {
      idleWindow.cancelIdleCallback?.(idleId);
    };
  }

  const timer = window.setTimeout(callback, timeout);
  return () => {
    window.clearTimeout(timer);
  };
};

export default function OrderManagementCenterPro({ currentUser: dashboardCurrentUser = null }: OrderManagementCenterProProps) {
  const { currentUser: authCurrentUser } = useAuth();
  const { inquiries } = useInquiry();
  const { requirements } = useQuoteRequirements();
  const { quotationRequests } = useQuotationRequests();
  const { quotations: salesQuotations } = useSalesQuotations();
  const { contracts } = useSalesContracts();
  const { payments } = usePayments();
  const { purchaseOrders } = usePurchaseOrders();
  const [runtimeUser, setRuntimeUser] = useState(() => dashboardCurrentUser || getCurrentUser() || getSwitchedRbacUser());
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(() => {
    return dashboardCurrentUser?.role || getCurrentUser()?.role || getCurrentUser()?.userRole || getSwitchedRbacUser()?.role || null;
  });
  const [currentUserEmail, setCurrentUserEmail] = useState<string>(() => {
    return dashboardCurrentUser?.email || getCurrentUser()?.email || getSwitchedRbacUser()?.email || '';
  });
  const [activeTab, setActiveTab] = useState<'overview' | 'inquiries' | 'cost-inquiry' | 'quotations' | 'orders' | 'collections' | 'approvals' | 'export-service'>('overview');
  const [selectedInquiry, setSelectedInquiry] = useState<CustomerInquiry | null>(null);
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isFromInquiry, setIsFromInquiry] = useState(false);
  
  // 🔥 高亮QT报价单号（用于下推报价管理后高亮显示）
  const [highlightQtNumber, setHighlightQtNumber] = useState<string | undefined>(undefined);
  const [highlightInquiryNumber, setHighlightInquiryNumber] = useState<string | undefined>(undefined);
  const [highlightQrNumber, setHighlightQrNumber] = useState<string | undefined>(undefined);
  
  // 🔥 高亮SC销售合同号（用于下推订单管理后高亮显示）
  const [highlightScNumber, setHighlightScNumber] = useState<string | undefined>(undefined);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      void ORDER_CENTER_TAB_PRELOADERS.overview();
      void ORDER_CENTER_TAB_PRELOADERS.inquiries();
      void ORDER_CENTER_TAB_PRELOADERS['cost-inquiry']();
      void ORDER_CENTER_TAB_PRELOADERS.quotations();
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, []);
  
  useEffect(() => {
    const pendingTargetTab = localStorage.getItem('orderManagementCenterActiveTab');
    if (!pendingTargetTab) return;
    if (['overview', 'inquiries', 'cost-inquiry', 'quotations', 'orders', 'collections', 'approvals', 'export-service'].includes(pendingTargetTab)) {
      setActiveTab(pendingTargetTab as any);
    }
    localStorage.removeItem('orderManagementCenterActiveTab');
  }, []);

  useEffect(() => {
    if (tabSwitchPerfRef.current?.tab !== activeTab) return;
    requestAnimationFrame(() => {
      if (tabSwitchPerfRef.current?.tab !== activeTab) return;
      logPerf(`order-management tab ready: ${activeTab}`, tabSwitchPerfRef.current.startAt, { tab: activeTab });
      tabSwitchPerfRef.current = null;
    });
  }, [activeTab]);
  
  useEffect(() => {
    const syncRuntimeUser = () => {
      const actingUser = getCurrentUser();
      const switchedUser = getSwitchedRbacUser();
      const nextUser = dashboardCurrentUser || actingUser || switchedUser;
      setRuntimeUser(nextUser);
      setCurrentUserRole(
        dashboardCurrentUser?.role || actingUser?.role || actingUser?.userRole || switchedUser?.role || nextUser?.role || nextUser?.userRole || null,
      );
      setCurrentUserEmail(dashboardCurrentUser?.email || actingUser?.email || switchedUser?.email || nextUser?.email || '');
    };
    syncRuntimeUser();
    window.addEventListener('userChanged', syncRuntimeUser as EventListener);
    window.addEventListener('storage', syncRuntimeUser);
    return () => {
      window.removeEventListener('userChanged', syncRuntimeUser as EventListener);
      window.removeEventListener('storage', syncRuntimeUser);
    };
  }, [dashboardCurrentUser?.email, dashboardCurrentUser?.role]);
  
  // 报价管理状态
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterRegion, setFilterRegion] = useState('all');
  const [showQuoteDialog, setShowQuoteDialog] = useState(false);
  const [showContractDialog, setShowContractDialog] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [generatingContract, setGeneratingContract] = useState(false);
  const [showQuoteDetail, setShowQuoteDetail] = useState(false);
  
  const quotationPDFRef = useRef<HTMLDivElement>(null);
  const contractPDFRef = useRef<HTMLDivElement>(null);
  const tabSwitchPerfRef = useRef<{ tab: string; startAt: number } | null>(null);
  const preloadedTabsRef = useRef<Set<keyof typeof ORDER_CENTER_TAB_PRELOADERS>>(new Set());
  
  const { notifications, unreadCount, addNotification } = useNotifications();
  
  // 🔥 计算当前用户的待审批数量
  const currentUser = dashboardCurrentUser || runtimeUser || authCurrentUser;
  const rawRuntimeRole = String(
    dashboardCurrentUser?.role || currentUserRole || runtimeUser?.role || runtimeUser?.userRole || authCurrentUser?.role || '',
  ).trim();
  const normalizedRuntimeRole = ({
    Regional_Manager: 'Regional_Manager',
    Sales_Manager: 'Regional_Manager',
    Sales_Director: 'Sales_Director',
    CEO: 'CEO',
    区域主管: 'Regional_Manager',
    区域业务主管: 'Regional_Manager',
    销售总监: 'Sales_Director',
    老板: 'CEO',
  } as Record<string, string>)[rawRuntimeRole] || '';
  const emailDerivedRole = APPROVAL_CENTER_ROLE_BY_EMAIL[String(currentUserEmail || '').trim().toLowerCase()] || '';
  const effectiveRuntimeRole = normalizedRuntimeRole || emailDerivedRole || rawRuntimeRole;
  const shouldShowApprovalCenter = ['Regional_Manager', 'Sales_Manager', 'Sales_Director', 'CEO'].includes(rawRuntimeRole || '')
    || ['Regional_Manager', 'Sales_Director', 'CEO'].includes(effectiveRuntimeRole || '');
  const permissionRuntimeUser = currentUser
    ? {
        id: currentUser.id || currentUser.email,
        email: currentUser.email,
        name: currentUser.name || currentUser.email,
        role: effectiveRuntimeRole,
        region: dashboardCurrentUser?.region || runtimeUser?.region || authCurrentUser?.region || currentUser.region || 'all',
      }
    : authCurrentUser;
  const canCreateOrderContent = permissionCenterService.hasModuleActionAccess(permissionRuntimeUser, 'order-management-center', 'create');
  const canExportOrderContent = permissionCenterService.hasModuleActionAccess(permissionRuntimeUser, 'order-management-center', 'export');
  const canApproveOrderContent = permissionCenterService.hasModuleActionAccess(permissionRuntimeUser, 'order-management-center', 'approve');
  const [myPendingCount, setMyPendingCount] = useState(() => {
    if (!currentUserEmail) return 0;
    try {
      const raw = localStorage.getItem(getApprovalCenterCacheKey(currentUserEmail));
      const parsed = raw ? JSON.parse(raw) : null;
      return Array.isArray(parsed?.pending) ? parsed.pending.length : 0;
    } catch {
      return 0;
    }
  });
  const [exportServiceOrders, setExportServiceOrders] = useState<any[]>([]);
  const [salesWorkflowSnapshot, setSalesWorkflowSnapshot] = useState(() => readCachedSalesWorkflowSourceSnapshot({
    email: dashboardCurrentUser?.email || getCurrentUser()?.email || getSwitchedRbacUser()?.email || '',
    name: dashboardCurrentUser?.name || getCurrentUser()?.name || getSwitchedRbacUser()?.name || '',
    role: dashboardCurrentUser?.role || getCurrentUser()?.role || getCurrentUser()?.userRole || getSwitchedRbacUser()?.role || '',
    region: dashboardCurrentUser?.region || getCurrentUser()?.region || getSwitchedRbacUser()?.region || '',
  }));
  const [isRefreshingWorkflowSnapshot, setIsRefreshingWorkflowSnapshot] = useState(false);

  useEffect(() => {
    if (!currentUserEmail) {
      setMyPendingCount(0);
      return;
    }

    // 先显示缓存值，避免切角色后红点先显示 0
    try {
      const raw = localStorage.getItem(getApprovalCenterCacheKey(currentUserEmail));
      const parsed = raw ? JSON.parse(raw) : null;
      if (Array.isArray(parsed?.pending)) {
        setMyPendingCount(parsed.pending.length);
      }
    } catch {}

    // 待审批数量从 localStorage 缓存读取，避免调用已禁用的后端 API

    const handlePendingChanged = (event: Event) => {
      const customEvent = event as CustomEvent<{ count?: number }>;
      const next = Number(customEvent?.detail?.count ?? 0);
      if (Number.isFinite(next)) {
        setMyPendingCount(next);
      }
    };

    window.addEventListener('approvalPendingCountChanged', handlePendingChanged as EventListener);
    return () => {
      window.removeEventListener('approvalPendingCountChanged', handlePendingChanged as EventListener);
    };
  }, [currentUserEmail]);

  useEffect(() => {
    if (!shouldShowApprovalCenter || !currentUserEmail) return;

    void import('./ApprovalCenter');

    const canReadBroadApprovalPool = ['Regional_Manager', 'Sales_Director', 'CEO'].includes(String(effectiveRuntimeRole || ''));
    const prefetchApprovalSummaries = async () => {
      try {
        if (canReadBroadApprovalPool) {
          await approvalRecordService.prefetchAllSummaries();
        } else {
          await approvalRecordService.prefetchForApproverSummaries(currentUserEmail);
        }
      } catch (error) {
        console.warn('[OrderManagementCenterPro] approval summary prefetch failed:', (error as any)?.message || error);
      }
    };

    void prefetchApprovalSummaries();
  }, [currentUserEmail, effectiveRuntimeRole, shouldShowApprovalCenter]);

  useEffect(() => {
    let alive = true;

    const syncExportServiceOrders = async () => {
      try {
        const rows = await exportServiceOrdersDb.getAll();
        if (!alive) return;
        setExportServiceOrders(Array.isArray(rows) ? rows : []);
      } catch {
        if (alive) setExportServiceOrders([]);
      }
    };

    void syncExportServiceOrders();
    const subscription = exportServiceOrdersDb.subscribeChanges(() => {
      void syncExportServiceOrders();
    });

    return () => {
      alive = false;
      subscription.unsubscribe();
    };
  }, []);

  const syncSalesWorkflowSnapshot = React.useCallback(async () => {
    setIsRefreshingWorkflowSnapshot(true);
    try {
      const nextSnapshot = await loadSalesWorkflowSourceSnapshot({
        email: currentUserEmail || permissionRuntimeUser?.email || '',
        name: permissionRuntimeUser?.name || runtimeUser?.name || dashboardCurrentUser?.name || authCurrentUser?.name || '',
        role: effectiveRuntimeRole || rawRuntimeRole || '',
        region: permissionRuntimeUser?.region || runtimeUser?.region || dashboardCurrentUser?.region || authCurrentUser?.region || '',
      });
      setSalesWorkflowSnapshot(nextSnapshot);
    } finally {
      setIsRefreshingWorkflowSnapshot(false);
    }
  }, [
    authCurrentUser?.region,
    currentUserEmail,
    dashboardCurrentUser?.region,
    effectiveRuntimeRole,
    permissionRuntimeUser?.email,
    permissionRuntimeUser?.region,
    rawRuntimeRole,
    runtimeUser?.region,
  ]);

  useEffect(() => {
    let alive = true;

    const guardedSync = async () => {
      setIsRefreshingWorkflowSnapshot(true);
      try {
        const nextSnapshot = await loadSalesWorkflowSourceSnapshot({
          email: currentUserEmail || permissionRuntimeUser?.email || '',
          name: permissionRuntimeUser?.name || runtimeUser?.name || dashboardCurrentUser?.name || authCurrentUser?.name || '',
          role: effectiveRuntimeRole || rawRuntimeRole || '',
          region: permissionRuntimeUser?.region || runtimeUser?.region || dashboardCurrentUser?.region || authCurrentUser?.region || '',
        });
        if (alive) setSalesWorkflowSnapshot(nextSnapshot);
      } finally {
        if (alive) setIsRefreshingWorkflowSnapshot(false);
      }
    };

    void guardedSync();
    window.addEventListener('userChanged', guardedSync as EventListener);
    const unsubscribe = subscribeErpEvent(() => {
      void guardedSync();
    });
    return () => {
      alive = false;
      window.removeEventListener('userChanged', guardedSync as EventListener);
      unsubscribe();
    };
  }, [
    authCurrentUser?.region,
    currentUserEmail,
    dashboardCurrentUser?.region,
    effectiveRuntimeRole,
    permissionRuntimeUser?.email,
    permissionRuntimeUser?.region,
    rawRuntimeRole,
    runtimeUser?.region,
  ]);

  const effectiveSnapshot = useMemo(() => {
    const isSalesScopedRole = ['Sales_Rep', 'Sales_Assistant', 'Regional_Manager', 'Sales_Manager', 'Sales_Director', 'CEO'].includes(
      String(effectiveRuntimeRole || rawRuntimeRole || '').trim(),
    );
    const hasSnapshot = hasSalesWorkflowSnapshotData(salesWorkflowSnapshot);
    if (isSalesScopedRole && !hasSnapshot) {
      return salesWorkflowSnapshot;
    }

    return {
      inquiries: salesWorkflowSnapshot.inquiries.length > 0 ? salesWorkflowSnapshot.inquiries : inquiries,
      quoteRequirements: salesWorkflowSnapshot.quoteRequirements.length > 0 ? salesWorkflowSnapshot.quoteRequirements : requirements,
      quotationRequests: salesWorkflowSnapshot.quotationRequests.length > 0 ? salesWorkflowSnapshot.quotationRequests : quotationRequests,
      quotations: salesWorkflowSnapshot.quotations.length > 0 ? salesWorkflowSnapshot.quotations : salesQuotations,
      contracts: salesWorkflowSnapshot.contracts.length > 0 ? salesWorkflowSnapshot.contracts : contracts,
      purchaseOrders: salesWorkflowSnapshot.purchaseOrders.length > 0 ? salesWorkflowSnapshot.purchaseOrders : purchaseOrders,
      payments: salesWorkflowSnapshot.payments.length > 0 ? salesWorkflowSnapshot.payments : payments,
      exportServiceOrders: salesWorkflowSnapshot.exportServiceOrders.length > 0 ? salesWorkflowSnapshot.exportServiceOrders : exportServiceOrders,
    };
  }, [
    salesWorkflowSnapshot,
    inquiries,
    requirements,
    quotationRequests,
    salesQuotations,
    contracts,
    purchaseOrders,
    payments,
    exportServiceOrders,
  ]);

  const orderManagementCounts = useMemo(() => computeOrderManagementCounts({
    actor: {
      email: currentUserEmail || permissionRuntimeUser?.email || '',
      name: permissionRuntimeUser?.name || runtimeUser?.name || dashboardCurrentUser?.name || authCurrentUser?.name || '',
      role: effectiveRuntimeRole,
      rawRole: rawRuntimeRole,
      region: permissionRuntimeUser?.region || runtimeUser?.region || dashboardCurrentUser?.region || authCurrentUser?.region || '',
    },
    snapshot: effectiveSnapshot,
    approvalPendingCount: myPendingCount,
  }), [
    currentUserEmail,
    permissionRuntimeUser?.email,
    permissionRuntimeUser?.name,
    permissionRuntimeUser?.region,
    runtimeUser?.name,
    runtimeUser?.region,
    dashboardCurrentUser?.name,
    dashboardCurrentUser?.region,
    authCurrentUser?.name,
    authCurrentUser?.region,
    effectiveRuntimeRole,
    rawRuntimeRole,
    effectiveSnapshot,
    myPendingCount,
  ]);

  const inquiryCount = orderManagementCounts.inquiries;
  const costInquiryCount = orderManagementCounts.costInquiry;
  const quotationCount = orderManagementCounts.quotations;
  const orderCount = orderManagementCounts.orders;
  const collectionCount = orderManagementCounts.collections;
  const exportServiceCount = orderManagementCounts.exportService;

  useEffect(() => {
    console.info('[OrderManagementCenterPro][runtime]', {
      dashboardCurrentUser: dashboardCurrentUser
        ? {
            email: dashboardCurrentUser.email || null,
            role: dashboardCurrentUser.role || null,
            region: dashboardCurrentUser.region || null,
          }
        : null,
      authCurrentUser: authCurrentUser
        ? {
            email: authCurrentUser.email || null,
            role: authCurrentUser.role || null,
            region: authCurrentUser.region || null,
          }
        : null,
      runtimeUser: runtimeUser
        ? {
            email: runtimeUser.email || null,
            role: runtimeUser.role || runtimeUser.userRole || null,
            region: runtimeUser.region || null,
          }
        : null,
      currentUserRole,
      currentUserEmail,
      effectiveRuntimeRole,
      inquiryCount,
      costInquiryCount,
      quotationCount,
      orderCount,
      collectionCount,
      unreadCount,
      myPendingCount,
      exportServiceCount,
    });
  }, [
    dashboardCurrentUser,
    authCurrentUser,
    runtimeUser,
    currentUserRole,
    currentUserEmail,
    effectiveRuntimeRole,
    inquiryCount,
    costInquiryCount,
    quotationCount,
    orderCount,
    collectionCount,
    unreadCount,
    myPendingCount,
    exportServiceCount,
  ]);
  const overviewCount = orderManagementCounts.overview;
  const orderCoordinatorTaskSummary = useMemo(
    () =>
      deriveOrderCoordinatorTaskSummary({
        snapshot: effectiveSnapshot,
        pendingCounts: orderManagementCounts,
      }),
    [effectiveSnapshot, orderManagementCounts],
  );
  const { taskCenter } = orderCoordinatorTaskSummary;
  const collaborationSections = taskCenter.collaborationSections;
  const showOrderCoordinatorSummary = ['Order_Coordinator', 'Sales_Assistant'].includes(String(effectiveRuntimeRole || rawRuntimeRole || '').trim());

  const renderTabCountBadge = (count: number) => {
    if (count <= 0) return null;

    return (
      <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-red-500 text-white rounded">
        {count}
      </span>
    );
  };

  const preloadOrderCenterTab = React.useCallback((tab: keyof typeof ORDER_CENTER_TAB_PRELOADERS) => {
    if (preloadedTabsRef.current.has(tab)) return;
    preloadedTabsRef.current.add(tab);
    void ORDER_CENTER_TAB_PRELOADERS[tab]().catch(() => {
      preloadedTabsRef.current.delete(tab);
    });
  }, []);

  useEffect(() => {
    const cancelSecondaryPreload = scheduleBrowserIdleTask(() => {
      preloadOrderCenterTab('orders');
      preloadOrderCenterTab('collections');
      preloadOrderCenterTab('export-service');
      if (shouldShowApprovalCenter) {
        preloadOrderCenterTab('approvals');
      }
    }, 900);

    return () => {
      cancelSecondaryPreload();
    };
  }, [preloadOrderCenterTab, shouldShowApprovalCenter]);

  const switchOrderManagementTab = (tab: typeof activeTab) => {
    preloadOrderCenterTab(tab);
    tabSwitchPerfRef.current = { tab, startAt: performance.now() };
    console.info('[perf] order-management tab click', { tab });
    setActiveTab(tab);
  };

  // 初始化模拟数据
  useEffect(() => {
    setQuotations([
      {
        id: 'QT-2025-0234',
        inquiryId: 'ING-2025-0156',
        customer: 'ABC Trading Ltd.',
        contactPerson: 'John Smith',
        email: 'john@abctrading.com',
        date: '2025-10-27',
        validUntil: '2025-11-27',
        totalAmount: 87500,
        status: 'Sent',
        region: 'NA',
        currency: 'USD',
        paymentTerms: buildPaymentTermsText('tt_deposit_balance_before_shipment', 'before_shipment'),
        deliveryTerms: 'FOB Xiamen',
        portOfLoading: 'Xiamen',
        portOfDestination: 'Los Angeles',
        containerType: '40HQ',
        shippingMethod: 'Sea',
        contractGenerated: false,
        products: [
          {
            name: 'Cylindrical Door Lock',
            specification: 'Material: Zinc Alloy, Finish: Satin Nickel',
            quantity: 5000,
            unitPrice: 12.50,
            pcsPerCarton: 20,
            cartonLength: 45,
            cartonWidth: 35,
            cartonHeight: 30,
            grossWeight: 18.5,
            netWeight: 17.0,
            hsCode: '8301.40',
            moq: 1000,
            leadTime: 30,
          },
          {
            name: 'Lever Handle Set',
            specification: 'Material: Stainless Steel, Finish: Brushed',
            quantity: 3000,
            unitPrice: 8.75,
            pcsPerCarton: 25,
            cartonLength: 40,
            cartonWidth: 38,
            cartonHeight: 25,
            grossWeight: 15.2,
            netWeight: 14.0,
            hsCode: '8301.40',
            moq: 500,
            leadTime: 25,
          },
        ],
      },
      {
        id: 'QT-2025-0233',
        inquiryId: 'ING-2025-0155',
        customer: 'XYZ Construction Inc.',
        contactPerson: 'Maria Garcia',
        email: 'maria@xyzconstruction.com',
        date: '2025-10-25',
        validUntil: '2025-11-25',
        totalAmount: 156200,
        status: 'Accepted',
        region: 'SA',
        currency: 'USD',
        paymentTerms: buildPaymentTermsText('lc_100', 'lc_ready'),
        deliveryTerms: 'CIF Santos',
        portOfLoading: 'Shanghai',
        portOfDestination: 'Santos',
        containerType: '40GP',
        shippingMethod: 'Sea',
        contractGenerated: true,
        contractNo: 'SC-2025-0101',
        products: [
          {
            name: 'Window Hinge',
            specification: 'Heavy Duty, Stainless Steel 304',
            quantity: 8000,
            unitPrice: 6.20,
            pcsPerCarton: 50,
            cartonLength: 42,
            cartonWidth: 32,
            cartonHeight: 28,
            grossWeight: 22.0,
            netWeight: 20.5,
            hsCode: '8302.10',
            moq: 2000,
            leadTime: 35,
          },
        ],
      },
      {
        id: 'QT-2025-0232',
        inquiryId: 'ING-2025-0154',
        customer: 'Euro Hardware GmbH',
        contactPerson: 'Hans Mueller',
        email: 'hans@eurohardware.de',
        date: '2025-10-23',
        validUntil: '2025-11-23',
        totalAmount: 94800,
        status: 'Negotiating',
        region: 'EA',
        currency: 'EUR',
        paymentTerms: buildPaymentTermsText('tt_deposit_balance_before_shipment', 'before_shipment'),
        deliveryTerms: 'FOB Ningbo',
        portOfLoading: 'Ningbo',
        portOfDestination: 'Hamburg',
        containerType: '20GP',
        shippingMethod: 'Sea',
        contractGenerated: false,
        products: [
          {
            name: 'Cabinet Handle',
            specification: 'Aluminum Alloy, Anodized',
            quantity: 12000,
            unitPrice: 7.90,
            pcsPerCarton: 100,
            cartonLength: 50,
            cartonWidth: 40,
            cartonHeight: 35,
            grossWeight: 25.0,
            netWeight: 23.5,
            hsCode: '8302.41',
            moq: 3000,
            leadTime: 28,
          },
        ],
      },
    ]);
  }, []);

  // 处理从询价创建报价
  const handleCreateQuotation = (inquiry: CustomerInquiry) => {
    if (!canCreateOrderContent) {
      toast.error('当前角色无权在订单管理中心新建报价');
      return;
    }
    console.log('🔄 创建报价流转被触发！');
    setSelectedInquiry(inquiry);
    setActiveTab('quotations');
    setIsFromInquiry(true);
    
    const customerName = inquiry.buyerInfo?.companyName || inquiry.buyerInfo?.contactPerson || 'N/A';
    
    addNotification({
      type: 'inquiry_processing',
      title: '准备创建报价',
      message: `正在为 ${customerName} 创建报价单`,
      relatedId: inquiry.id,
      relatedType: 'ing',
      recipient: 'admin@cosun.com',
      sender: 'system'
    });

    toast.success('进入报价创建', {
      description: `询价编号: ${inquiry.id}`,
      duration: 2000
    });
    
    // 自动打开报价创建对话框
    setShowQuoteDialog(true);
  };

  // 处理报价创建完成
  const handleQuotationCreated = () => {
    setTimeout(() => {
      setSelectedInquiry(null);
      setIsFromInquiry(false);
      setShowQuoteDialog(false);
    }, 100);
  };

  // 导出报价PDF
  const handleExportQuotationPDF = async () => {
    if (!canExportOrderContent) {
      toast.error('当前角色无权导出报价文件');
      return;
    }
    if (!quotationPDFRef.current || !selectedQuotation) return;
    
    setExportingPDF(true);
    const filename = generatePDFFilename('Quotation', selectedQuotation.id);
    await exportToPDF(quotationPDFRef.current, filename);
    setExportingPDF(false);
    toast.success('报价单PDF导出成功！');
  };

  // 生成销售合同
  const handleGenerateContract = async (quotation: Quotation) => {
    if (!canCreateOrderContent) {
      toast.error('当前角色无权在订单管理中心生成合同');
      return;
    }
    setGeneratingContract(true);
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const contractNo = `SC-${new Date().getFullYear()}-${String(quotations.filter(q => q.contractGenerated).length + 101).padStart(4, '0')}`;
    
    setQuotations(quotations.map(q => 
      q.id === quotation.id 
        ? { 
            ...q, 
            status: 'Contract Generated', 
            contractGenerated: true,
            contractNo 
          }
        : q
    ));
    
    setSelectedQuotation({
      ...quotation,
      status: 'Contract Generated',
      contractGenerated: true,
      contractNo
    });
    
    setGeneratingContract(false);
    setShowContractDialog(true);
    
    addNotification({
      type: 'contract_generated',
      title: '销售合同已生成',
      message: `合同编号: ${contractNo}`,
      relatedId: contractNo,
      relatedType: 'contract',
      recipient: 'admin@cosun.com',
      sender: 'system'
    });
    
    toast.success('销售合同生成成功！', {
      description: `合同编号: ${contractNo}`
    });
  };

  // 导出合同PDF
  const handleExportContractPDF = async () => {
    if (!canExportOrderContent) {
      toast.error('当前角色无权导出合同文件');
      return;
    }
    if (!contractPDFRef.current || !selectedQuotation) return;
    
    setExportingPDF(true);
    const filename = generatePDFFilename('Sales_Contract', selectedQuotation.contractNo || selectedQuotation.id);
    await exportToPDF(contractPDFRef.current, filename);
    setExportingPDF(false);
    toast.success('合同PDF导出成功！');
  };

  // 发送报价
  const handleSendQuotation = (quotation: Quotation) => {
    setQuotations(quotations.map(q => 
      q.id === quotation.id ? { ...q, status: 'Sent' as const } : q
    ));
    
    addNotification({
      type: 'quotation_sent',
      title: '报价单已发送',
      message: `报价单 ${quotation.id} 已发送给 ${quotation.customer}`,
      relatedId: quotation.id,
      relatedType: 'qt',
      recipient: 'admin@cosun.com',
      sender: 'system'
    });
    
    toast.success('报价单已发送！', {
      description: `已发送至 ${quotation.email}`
    });
  };

  // 更新报价状态
  const handleUpdateQuotationStatus = (quotationId: string, newStatus: Quotation['status']) => {
    setQuotations(quotations.map(q => 
      q.id === quotationId ? { ...q, status: newStatus } : q
    ));
  };

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Draft': return 'bg-gray-500';
      case 'Sent': return 'bg-blue-500';
      case 'Negotiating': return 'bg-yellow-500';
      case 'Accepted': return 'bg-green-500';
      case 'Rejected': return 'bg-red-500';
      case 'Expired': return 'bg-orange-500';
      case 'Contract Generated': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  // 获取区域标签
  const getRegionLabel = (region?: string) => {
    switch (region) {
      case 'NA': return '北美';
      case 'SA': return '南美';
      case 'EA': return '欧非';
      default: return '未知';
    }
  };

  // 过滤报价
  const filteredQuotations = quotations.filter(q => {
    const matchesSearch = searchTerm === '' || 
      q.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.inquiryId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || q.status === filterStatus;
    const matchesRegion = filterRegion === 'all' || q.region === filterRegion;
    
    return matchesSearch && matchesStatus && matchesRegion;
  });

  // 统计数据
  const stats = {
    total: quotations.length,
    draft: quotations.filter(q => q.status === 'Draft').length,
    sent: quotations.filter(q => q.status === 'Sent').length,
    negotiating: quotations.filter(q => q.status === 'Negotiating').length,
    accepted: quotations.filter(q => q.status === 'Accepted').length,
    contracted: quotations.filter(q => q.contractGenerated).length,
    totalValue: quotations.reduce((sum, q) => sum + q.totalAmount, 0),
    acceptedValue: quotations.filter(q => q.status === 'Accepted' || q.status === 'Contract Generated').reduce((sum, q) => sum + q.totalAmount, 0),
  };

  return (
    <div className="h-full flex flex-col bg-[#F5F5F5]">
      {/* 🔥 专门的打印样式 - 打印时只显示合同内容 */}
      <style>{`
        @media print {
          /* 隐藏所有页面内容 */
          body > div:not(.print-contract-content),
          .print-hide,
          [role="dialog"]:not(.print-contract-dialog) {
            display: none !important;
          }
          
          /* 确保打印的合同内容可见 */
          .print-contract-content {
            display: block !important;
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: 100% !important;
            z-index: 99999 !important;
            background: white !important;
          }
          
          /* 隐藏对话框的边框和背景 */
          .print-contract-dialog {
            max-width: 100% !important;
            height: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            background: transparent !important;
            box-shadow: none !important;
          }
          
          /* 隐藏对话框的头部和底部 */
          .print-contract-dialog > div:not(.print-contract-content) {
            display: none !important;
          }
        }
      `}</style>
      
      {/* 🎨 方案A：台湾大厂原汁原味风格 - SAP/Oracle单行紧凑摘要栏 */}
      {/* 🔒 只对非业务员角色显示统计栏 - 移除CEO、销售总监、区域经理和业务员的统计 */}
      {!['CEO', 'Sales_Director', 'Regional_Manager', 'Sales_Rep'].includes(effectiveRuntimeRole || '') && (
        <div className="bg-white border border-gray-300 rounded print-hide">
          <div className="px-5 py-3 border-b border-gray-200 bg-gray-50">
            <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">报价统计</h3>
          </div>
          <div className="px-5 py-3 flex items-center gap-8 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-gray-600">报价总数:</span>
              <span className="font-semibold text-gray-900">{stats.total}</span>
            </div>
            <div className="w-px h-4 bg-gray-300" />
            <div className="flex items-center gap-2">
              <span className="text-gray-600">待发送:</span>
              <span className="font-semibold text-gray-900">{stats.draft}</span>
            </div>
            <div className="w-px h-4 bg-gray-300" />
            <div className="flex items-center gap-2">
              <span className="text-gray-600">协商中:</span>
              <span className="font-semibold text-gray-900">{stats.negotiating}</span>
            </div>
            <div className="w-px h-4 bg-gray-300" />
            <div className="flex items-center gap-2">
              <span className="text-gray-600">已成交:</span>
              <span className="font-semibold text-orange-600">{stats.accepted}</span>
            </div>
            <div className="w-px h-4 bg-gray-300" />
            <div className="flex items-center gap-2">
              <span className="text-gray-600">转化率:</span>
              <span className="font-semibold text-gray-900">{stats.total > 0 ? Math.round((stats.accepted / stats.total) * 100) : 0}%</span>
            </div>
            <div className="w-px h-4 bg-gray-300" />
            <div className="flex items-center gap-2">
              <span className="text-gray-600">生成合同:</span>
              <span className="font-semibold text-gray-900">{stats.contracted}</span>
            </div>
            <div className="w-px h-4 bg-gray-300" />
            <div className="flex items-center gap-2">
              <span className="text-gray-600">报价金额:</span>
              <span className="font-semibold text-gray-900">${(stats.totalValue / 1000).toFixed(0)}K</span>
            </div>
          </div>
        </div>
      )}
      
      {/* 主标签页 */}
      <Tabs value={activeTab} onValueChange={(v) => switchOrderManagementTab(v as typeof activeTab)} className="flex-1 flex flex-col">
        <div className="bg-[#F3F4F6] border-b border-gray-300">
          <div className="flex">
            <button
              onClick={() => switchOrderManagementTab('overview')}
              className={`relative px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2 border-b-2 ${
                activeTab === 'overview'
                  ? 'border-[#F96302] text-[#F96302] bg-white'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              订单全盘
              {renderTabCountBadge(overviewCount)}
            </button>
            
            <button
              onClick={() => switchOrderManagementTab('inquiries')}
              className={`relative px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2 border-b-2 ${
                activeTab === 'inquiries'
                  ? 'border-[#F96302] text-[#F96302] bg-white'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <ClipboardList className="w-4 h-4" />
              询价管理
              {renderTabCountBadge(inquiryCount)}
            </button>
            
            <button
              onClick={() => switchOrderManagementTab('cost-inquiry')}
              onMouseEnter={() => { void loadCostInquiryQuotationManagement(); }}
              onFocus={() => { void loadCostInquiryQuotationManagement(); }}
              className={`relative px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2 border-b-2 ${
                activeTab === 'cost-inquiry'
                  ? 'border-[#F96302] text-[#F96302] bg-white'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <FileText className="w-4 h-4" />
              成本询报
              {renderTabCountBadge(costInquiryCount)}
            </button>
            
            <button
              onClick={() => switchOrderManagementTab('quotations')}
              onMouseEnter={() => { void loadSalesQuotationManagement(); }}
              onFocus={() => { void loadSalesQuotationManagement(); }}
              className={`relative px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2 border-b-2 ${
                activeTab === 'quotations'
                  ? 'border-[#F96302] text-[#F96302] bg-white'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <FileText className="w-4 h-4" />
              报价管理
              {renderTabCountBadge(quotationCount)}
            </button>
            
            <button
              onClick={() => switchOrderManagementTab('orders')}
              onMouseEnter={() => { void loadSalesContractManagement(); }}
              onFocus={() => { void loadSalesContractManagement(); }}
              className={`relative px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2 border-b-2 ${
                activeTab === 'orders'
                  ? 'border-[#F96302] text-[#F96302] bg-white'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Package className="w-4 h-4" />
              订单管理
              {renderTabCountBadge(orderCount)}
            </button>
            
            <button
              onClick={() => switchOrderManagementTab('collections')}
              onMouseEnter={() => { void loadCollectionManagement(); }}
              onFocus={() => { void loadCollectionManagement(); }}
              className={`relative px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2 border-b-2 ${
                activeTab === 'collections'
                  ? 'border-[#F96302] text-[#F96302] bg-white'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Wallet className="w-4 h-4" />
              收款管理
              {renderTabCountBadge(collectionCount)}
            </button>
            
            {/* 🔥 审批中心 - 仅主管、总监、CEO可见 */}
            {shouldShowApprovalCenter && (
              <button
                onClick={() => switchOrderManagementTab('approvals')}
                className={`relative px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2 border-b-2 ${
                  activeTab === 'approvals'
                    ? 'border-[#F96302] text-[#F96302] bg-white'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Bell className="w-4 h-4" />
                审批中心
                {renderTabCountBadge(myPendingCount)}
              </button>
            )}

            {/* 借抬头出口服务 */}
            <button
              onClick={() => switchOrderManagementTab('export-service')}
              onMouseEnter={() => { void loadExportServiceWorkbench(); }}
              onFocus={() => { void loadExportServiceWorkbench(); }}
              className={`relative px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2 border-b-2 ${
                activeTab === 'export-service'
                  ? 'border-[#F96302] text-[#F96302] bg-white'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Ship className="w-4 h-4" />
              借抬头出口服务
              {renderTabCountBadge(exportServiceCount)}
            </button>
          </div>
        </div>

        {/* 订单全盘标签页 - NEW */}
        <TabsContent value="overview" className="mt-6">
          <Suspense fallback={<OrderCenterTabFallback title="正在加载订单全盘..." rows={5} />}>
            {activeTab === 'overview' ? (
              <div className="space-y-4">
                {showOrderCoordinatorSummary && (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
                      <div className="rounded-lg border bg-white p-3">
                        <div className="text-[11px] text-gray-500">合同待跟进</div>
                        <div className="mt-1 text-lg font-semibold text-gray-900">{orderCoordinatorTaskSummary.counts.contractsPending}</div>
                      </div>
                      <div className="rounded-lg border bg-white p-3">
                        <div className="text-[11px] text-gray-500">采购待衔接</div>
                        <div className="mt-1 text-lg font-semibold text-amber-700">{orderCoordinatorTaskSummary.counts.procurementPending}</div>
                      </div>
                      <div className="rounded-lg border bg-white p-3">
                        <div className="text-[11px] text-gray-500">履约待推进</div>
                        <div className="mt-1 text-lg font-semibold text-gray-900">{orderCoordinatorTaskSummary.counts.fulfillmentPending}</div>
                      </div>
                      <div className="rounded-lg border bg-white p-3">
                        <div className="text-[11px] text-gray-500">收款待协同</div>
                        <div className="mt-1 text-lg font-semibold text-red-600">{orderCoordinatorTaskSummary.counts.collectionsPending}</div>
                      </div>
                      <div className="rounded-lg border bg-white p-3">
                        <div className="text-[11px] text-gray-500">放单风险</div>
                        <div className="mt-1 text-lg font-semibold text-red-600">{orderCoordinatorTaskSummary.counts.releaseRisk}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                      <div className="rounded-lg border bg-white p-3">
                        <div className="flex items-center justify-between mb-3">
                          <div className="text-sm font-semibold text-gray-900">跟单风险摘要</div>
                          <Clock className="w-4 h-4 text-amber-600" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                            <div className="text-xs text-slate-700">合同跟进</div>
                            <div className="mt-1 text-xl font-semibold text-slate-900">{orderCoordinatorTaskSummary.riskSummary.contractFollowUp}</div>
                          </div>
                          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                            <div className="text-xs text-amber-700">采购衔接</div>
                            <div className="mt-1 text-xl font-semibold text-amber-900">{orderCoordinatorTaskSummary.riskSummary.procurementHandover}</div>
                          </div>
                          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                            <div className="text-xs text-blue-700">履约推进</div>
                            <div className="mt-1 text-xl font-semibold text-blue-900">{orderCoordinatorTaskSummary.riskSummary.fulfillmentPush}</div>
                          </div>
                          <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                            <div className="text-xs text-red-700">放单风险</div>
                            <div className="mt-1 text-xl font-semibold text-red-900">{orderCoordinatorTaskSummary.riskSummary.releaseRisk}</div>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-lg border bg-white p-3">
                        <div className="flex items-center justify-between mb-3">
                          <div className="text-sm font-semibold text-gray-900">协同角色入口</div>
                          <Truck className="w-4 h-4 text-slate-600" />
                        </div>
                        <div className="space-y-2">
                          {collaborationSections.map((section) => (
                            <div key={section.key} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                              <div className="flex items-center justify-between gap-3">
                                <div>
                                  <div className="text-sm font-semibold text-slate-900">{section.label}</div>
                                  <div className="mt-0.5 text-xs text-slate-600">{section.roles.join(' / ')}</div>
                                </div>
                                <div className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-slate-700 border border-slate-200">
                                  {section.count}
                                </div>
                              </div>
                            </div>
                          ))}
                          {collaborationSections.length === 0 && (
                            <div className="text-xs text-gray-500">暂无待协同事项</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                )}
                <LazyOrderOverviewDashboard
                  pendingCounts={orderManagementCounts}
                  snapshot={effectiveSnapshot}
                  onRefresh={syncSalesWorkflowSnapshot}
                  refreshing={isRefreshingWorkflowSnapshot}
                />
              </div>
            ) : null}
          </Suspense>
        </TabsContent>

        {/* 询价管理标签页 */}
        <TabsContent value="inquiries" className="mt-6 flex flex-1 min-h-0 flex-col">
          <Suspense fallback={<OrderCenterTabFallback title="正在加载询价管理..." rows={5} />}>
            {activeTab === 'inquiries' ? (
              <div className="px-3 pb-2 flex flex-1 min-h-0 flex-col">
                <LazyAdminInquiryManagement 
                  onCreateQuotation={handleCreateQuotation}
                  onSwitchToCostInquiry={() => setActiveTab('cost-inquiry')} // 🔥 下推成本询报后自动切换标签页
                  highlightInquiryNumber={highlightInquiryNumber}
                />
              </div>
            ) : null}
          </Suspense>
        </TabsContent>

        {/* 成本询报标签页 */}
        <TabsContent value="cost-inquiry" className="mt-6 flex flex-1 min-h-0 flex-col">
          <Suspense fallback={<OrderCenterTabFallback title="正在加载成本询报..." rows={5} />}>
            {activeTab === 'cost-inquiry' ? (
              <div className="px-3 pb-2 flex flex-1 min-h-0 flex-col">
                <LazyCostInquiryQuotationManagement
                  highlightQrNumber={highlightQrNumber}
                  onNavigateToInquiryManagementWithHighlight={(inquiryNumber) => {
                    setHighlightInquiryNumber(inquiryNumber);
                    setActiveTab('inquiries');
                    setTimeout(() => setHighlightInquiryNumber(undefined), 3500);
                  }}
                  onSwitchToQuotationManagement={(qtNumber) => {
                    // 🔥 下推报价管理：切换到报价管理页面并高亮指定QT
                    setHighlightQtNumber(qtNumber);
                    setActiveTab('quotations');
                    // 3秒后清除高亮参数
                    setTimeout(() => setHighlightQtNumber(undefined), 3500);
                  }}
                />
              </div>
            ) : null}
          </Suspense>
        </TabsContent>

        {/* 报价管理标签页 */}
        <TabsContent value="quotations" className="mt-6 flex flex-1 min-h-0 flex-col">
          <Suspense fallback={<OrderCenterTabFallback title="正在加载报价管理..." rows={5} />}>
            {activeTab === 'quotations' ? (
              <div className="px-3 pb-2 flex flex-1 min-h-0 flex-col">
                <LazySalesQuotationManagement 
                  currentUser={currentUser}
                  initialQuotations={effectiveSnapshot.quotations}
                  highlightQtNumber={highlightQtNumber} 
                  onNavigateToInquiryWithHighlight={(inquiryNumber) => {
                    setHighlightInquiryNumber(inquiryNumber);
                    setActiveTab('inquiries');
                    setTimeout(() => setHighlightInquiryNumber(undefined), 3500);
                  }}
                  onNavigateToCostInquiryWithHighlight={(qrNumber) => {
                    setHighlightQrNumber(qrNumber);
                    setActiveTab('cost-inquiry');
                    setTimeout(() => setHighlightQrNumber(undefined), 3500);
                  }}
                  onNavigateToOrders={() => setActiveTab('orders')} 
                  onNavigateToOrdersWithHighlight={(scNumber) => {
                    // 🔥 下推订单管理：切换到订单管理页面并高亮指定SC
                    console.log('🔍 [OrderManagementCenterPro] 下推到订单管理并高亮SC:', scNumber);
                    setHighlightScNumber(scNumber);
                    setActiveTab('orders');
                    // 3秒后清除高亮参数
                    setTimeout(() => setHighlightScNumber(undefined), 3500);
                  }}
                />
              </div>
            ) : null}
          </Suspense>
        </TabsContent>

        {/* 订单管理标签页 - 🔥 使用SalesContractManagement组件 */}
        <TabsContent value="orders" className="mt-6 flex flex-1 min-h-0 flex-col">
          <Suspense fallback={<OrderCenterTabFallback title="正在加载订单管理..." rows={5} />}>
            {activeTab === 'orders' ? (
              <div className="px-3 pb-2 flex flex-1 min-h-0 flex-col">
                <LazySalesContractManagement
                  highlightScNumber={highlightScNumber}
                  onNavigateToInquiryWithHighlight={(inquiryNumber) => {
                    setHighlightInquiryNumber(inquiryNumber);
                    setActiveTab('inquiries');
                    setTimeout(() => setHighlightInquiryNumber(undefined), 3500);
                  }}
                  onNavigateToCostInquiryWithHighlight={(qrNumber) => {
                    setHighlightQrNumber(qrNumber);
                    setActiveTab('cost-inquiry');
                    setTimeout(() => setHighlightQrNumber(undefined), 3500);
                  }}
                  onNavigateToQuotationWithHighlight={(qtNumber) => {
                    setHighlightQtNumber(qtNumber);
                    setActiveTab('quotations');
                    setTimeout(() => setHighlightQtNumber(undefined), 3500);
                  }}
                />
              </div>
            ) : null}
          </Suspense>
        </TabsContent>

        {/* 收款管理标签页 */}
        <TabsContent value="collections" className="mt-6 flex flex-1 min-h-0 flex-col">
          <Suspense fallback={<OrderCenterTabFallback title="正在加载收款管理..." rows={4} />}>
            {activeTab === 'collections' ? (
              <div className="px-3 pb-2 flex flex-1 min-h-0 flex-col">
                <LazyCollectionManagement />
              </div>
            ) : null}
          </Suspense>
        </TabsContent>

        {/* 审批中心标签页 */}
        <TabsContent value="approvals" className="mt-6">
          <Suspense
            fallback={(
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="h-5 w-36 animate-pulse rounded bg-slate-200" />
                <div className="mt-4 grid grid-cols-4 gap-4">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div key={`approval-skeleton-${index}`} className="rounded-xl border border-slate-100 p-4">
                      <div className="h-4 w-20 animate-pulse rounded bg-slate-100" />
                      <div className="mt-3 h-8 w-12 animate-pulse rounded bg-slate-200" />
                    </div>
                  ))}
                </div>
                <div className="mt-6 rounded-xl border border-slate-100 p-4">
                  <div className="h-10 w-full animate-pulse rounded bg-slate-100" />
                  <div className="mt-4 space-y-3">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <div key={`approval-row-${index}`} className="h-16 animate-pulse rounded-lg bg-slate-50" />
                    ))}
                  </div>
                </div>
              </div>
            )}
          >
            {activeTab === 'approvals' ? <LazyApprovalCenter currentUser={currentUser} /> : null}
          </Suspense>
        </TabsContent>

        {/* 借抬头出口服务标签页 */}
        <TabsContent value="export-service" className="mt-0 flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-hidden" style={{ height: 'calc(100vh - 180px)' }}>
            <Suspense fallback={<OrderCenterTabFallback title="正在加载借抬头出口服务..." rows={5} />}>
              {activeTab === 'export-service' ? <LazyExportServiceWorkbench /> : null}
            </Suspense>
          </div>
        </TabsContent>
      </Tabs>

      {/* 报价详情对话框 */}
      <Dialog open={showQuoteDetail} onOpenChange={setShowQuoteDetail}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>报价单详情 - {selectedQuotation?.id}</DialogTitle>
            <DialogDescription>
              查看报价单详细信息
            </DialogDescription>
          </DialogHeader>
          
          {selectedQuotation && (
            <div className="space-y-6">
              {/* 基本信息 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-600">客户名称</Label>
                  <div className="font-semibold mt-1">{selectedQuotation.customer}</div>
                </div>
                <div>
                  <Label className="text-gray-600">联系人</Label>
                  <div className="font-semibold mt-1">{selectedQuotation.contactPerson}</div>
                </div>
                <div>
                  <Label className="text-gray-600">报价日期</Label>
                  <div className="font-semibold mt-1">{selectedQuotation.date}</div>
                </div>
                <div>
                  <Label className="text-gray-600">有效期至</Label>
                  <div className="font-semibold mt-1">{selectedQuotation.validUntil}</div>
                </div>
                <div>
                  <Label className="text-gray-600">区域</Label>
                  <Badge variant="outline" className="mt-1">{getRegionLabel(selectedQuotation.region)}</Badge>
                </div>
                <div>
                  <Label className="text-gray-600">状态</Label>
                  <Badge className={`${getStatusColor(selectedQuotation.status)} mt-1`}>
                    {selectedQuotation.status}
                  </Badge>
                </div>
              </div>

              {/* 贸易条款 */}
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">贸易条款</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-600">付款条款</Label>
                    <div className="mt-1">
                      {selectedQuotation.paymentTerms || buildPaymentTermsText(
                        selectedQuotation.paymentMode,
                        deriveBalanceTrigger(selectedQuotation.paymentMode, selectedQuotation.balanceTrigger || null),
                      )}
                    </div>
                  </div>
                  <div>
                    <Label className="text-gray-600">付款模式</Label>
                    <div className="mt-1">{getPaymentModeLabel(selectedQuotation.paymentMode)}</div>
                  </div>
                  <div>
                    <Label className="text-gray-600">交货条款</Label>
                    <div className="mt-1">{selectedQuotation.deliveryTerms}</div>
                  </div>
                  <div>
                    <Label className="text-gray-600">起运港</Label>
                    <div className="mt-1">{selectedQuotation.portOfLoading}</div>
                  </div>
                  <div>
                    <Label className="text-gray-600">目的港</Label>
                    <div className="mt-1">{selectedQuotation.portOfDestination}</div>
                  </div>
                  <div>
                    <Label className="text-gray-600">运输方式</Label>
                    <div className="mt-1">{selectedQuotation.shippingMethod}</div>
                  </div>
                  <div>
                    <Label className="text-gray-600">柜型</Label>
                    <div className="mt-1">{selectedQuotation.containerType}</div>
                  </div>
                </div>
              </div>

              {/* 产品列表 */}
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">产品明细</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>产品名称</TableHead>
                      <TableHead>规格</TableHead>
                      <TableHead className="text-right">数量</TableHead>
                      <TableHead className="text-right">单价</TableHead>
                      <TableHead className="text-right">总价</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedQuotation.products.map((product, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell className="text-sm">{product.specification}</TableCell>
                        <TableCell className="text-right">{product.quantity.toLocaleString()}</TableCell>
                        <TableCell className="text-right">${product.unitPrice.toFixed(2)}</TableCell>
                        <TableCell className="text-right font-semibold">
                          ${(product.quantity * product.unitPrice).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={4} className="text-right font-semibold">总计:</TableCell>
                      <TableCell className="text-right font-bold text-lg">
                        {selectedQuotation.currency} ${selectedQuotation.totalAmount.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowQuoteDetail(false)}>
              关闭
            </Button>
            <Button onClick={handleExportQuotationPDF} disabled={exportingPDF || !canExportOrderContent}>
              {exportingPDF ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  导出中...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  导出PDF
                </>
              )}
            </Button>
            {selectedQuotation?.status === 'Accepted' && !selectedQuotation?.contractGenerated && (
              <Button 
                onClick={() => selectedQuotation && handleGenerateContract(selectedQuotation)}
                disabled={generatingContract || !canCreateOrderContent}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {generatingContract ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    生成中...
                  </>
                ) : (
                  <>
                    <FileCheck className="w-4 h-4 mr-2" />
                    生成合同
                  </>
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 合同查看对话框 */}
      <Dialog open={showContractDialog} onOpenChange={setShowContractDialog} className="print-contract-dialog">
        <DialogContent className="max-w-[67.2rem] max-h-[90vh] overflow-y-auto print:hidden"> {/* 🔥 打印时隐藏对话框 */}
          <DialogHeader className="print-hide"> {/* 🔥 打印时隐藏头部 */}
            <DialogTitle>销售合同 - {selectedQuotation?.contractNo}</DialogTitle>
            <DialogDescription>
              Sales Contract
            </DialogDescription>
          </DialogHeader>
          
          <div ref={contractPDFRef} className="print-contract-content">
            {selectedQuotation && (
              <SalesContractDocumentPaginated
                data={{
                  // 合同基本信息
                  contractNo: selectedQuotation.contractNo || `SC-${selectedQuotation.id}`,
                  contractDate: selectedQuotation.date,
                  quotationNo: selectedQuotation.id,
                  region: selectedQuotation.region === 'EA' ? 'EA' : selectedQuotation.region || 'NA',
                  
                  // 卖方（公司）信息
                  seller: {
                    name: '福建高盛达富建材有限公司',
                    nameEn: 'Fujian Cosun Dafu Building Materials Co., Ltd.',
                    address: '福建省厦门市湖里区湖里大道',
                    addressEn: 'Huli Avenue, Huli District, Xiamen, Fujian Province, China',
                    tel: '+86-591-8888-8888',
                    fax: '+86-591-8888-8889',
                    email: 'export@cosun.com',
                    legalRepresentative: 'Zhang San',
                    bankInfo: {
                      bankName: 'Bank of China, Xiamen Branch',
                      accountName: 'Fujian Cosun Dafu Building Materials Co., Ltd.',
                      accountNumber: '1234 5678 9012 3456',
                      swiftCode: 'BKCHCNBJ950',
                      bankAddress: 'Xiamen, Fujian Province, China',
                      currency: selectedQuotation.currency || 'USD'
                    }
                  },
                  
                  // 买方（客户）信息
                  buyer: {
                    companyName: selectedQuotation.customer,
                    address: 'N/A',
                    country: selectedQuotation.region === 'NA' ? 'United States' : selectedQuotation.region === 'SA' ? 'Brazil' : 'Germany',
                    contactPerson: selectedQuotation.contactPerson || 'N/A',
                    tel: 'N/A',
                    email: selectedQuotation.email || 'N/A'
                  },
                  
                  // 产品清单
                  products: selectedQuotation.products.map((p, index) => ({
                    no: index + 1,
                    modelNo: p.hsCode || '-',
                    description: p.name,
                    specification: p.specification || '-',
                    hsCode: p.hsCode,
                    unit: 'pcs',
                    quantity: p.quantity,
                    unitPrice: p.unitPrice,
                    currency: selectedQuotation.currency || 'USD',
                    amount: p.quantity * p.unitPrice
                  })),
                  
                  // 合同条款
                  terms: {
                    totalAmount: selectedQuotation.totalAmount,
                    currency: selectedQuotation.currency || 'USD',
                    tradeTerms: selectedQuotation.deliveryTerms || 'FOB Xiamen',
                    paymentTerms: selectedQuotation.paymentTerms
                      || buildPaymentTermsText(
                        selectedQuotation.paymentMode,
                        deriveBalanceTrigger(selectedQuotation.paymentMode, selectedQuotation.balanceTrigger || null),
                      ),
                    depositAmount: selectedQuotation.totalAmount * 0.3,
                    balanceAmount: selectedQuotation.totalAmount * 0.7,
                    deliveryTime: '42 days after deposit received',
                    portOfLoading: selectedQuotation.portOfLoading || 'Xiamen, China',
                    portOfDestination: selectedQuotation.portOfDestination || 'Los Angeles, USA',
                    packing: 'Export standard carton',
                    inspection: 'Buyer has the right to inspect goods before shipment',
                    warranty: '12 months warranty'
                  },
                  
                  // 违约责任条款
                  liabilityTerms: {
                    sellerDefault: 'If Seller fails to deliver on time without valid reason, Buyer may cancel the order and claim full refund plus 5% compensation.',
                    buyerDefault: 'If Buyer fails to pay balance within agreed time, deposit will be forfeited as liquidated damages.',
                    forceMajeure: 'Neither party liable for delays due to force majeure events (natural disasters, wars, epidemics, government actions). Affected party must notify within 15 days with official documentation.'
                  },
                  
                  // 争议解决
                  disputeResolution: {
                    governingLaw: 'This contract shall be governed by the laws of the People\'s Republic of China.',
                    arbitration: 'Disputes shall be resolved through friendly negotiation. If failed, submit to China International Economic and Trade Arbitration Commission (CIETAC) in Xiamen. Arbitration award is final and binding.'
                  },
                  
                  // 签章
                  signature: {
                    sellerSignatory: 'Zhang San (Legal Representative)',
                    buyerSignatory: selectedQuotation.contactPerson || 'Buyer Representative',
                    signDate: selectedQuotation.date
                  }
                }}
              />
            )}
          </div>

          <DialogFooter className="print-hide"> {/* 🔥 打印时隐藏底部按钮 */}
            <Button variant="outline" onClick={() => setShowContractDialog(false)}>
              关闭
            </Button>
            <Button onClick={handleExportContractPDF} disabled={exportingPDF || !canExportOrderContent}>
              {exportingPDF ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  导出中...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  导出PDF
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 隐藏的PDF模板（用于导出） */}
      <div style={{ position: 'absolute', left: '-9999px' }} className="print-hide">
        <div ref={quotationPDFRef}>
          {selectedQuotation && (
            <QuotationPDFTemplate quotation={selectedQuotation} />
          )}
        </div>
      </div>
    </div>
  );
}
