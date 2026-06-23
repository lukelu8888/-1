import React, { Suspense, useEffect, useState } from 'react';
// 🔥 Import all required icons including Sparkles for Pro features
import { LayoutDashboard, LayoutGrid, Users, Package, BarChart3, Bell, Mail, LogOut, ChevronLeft, ChevronRight, Building2, Box, Share2, GripVertical, Ship, Activity, Wallet, Factory, Truck, ChevronDown, ChevronUp, Database, Shield, Target, Radio, HeartPulse, Workflow, FileText, FolderOpen, Globe, Navigation, DollarSign, TrendingUp, Settings, Terminal, GitBranch, Sparkles, Wand2, UserCheck, Waves, UserPlus, Megaphone, ClipboardCheck, ClipboardList, Edit, Hash } from 'lucide-react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { AIContentStudioPro } from './ai-content/AIContentStudioPro'; // 🔥 AI内容生成工作台 Pro版
// 🔥 已删除：SmartWorkflowEngine - 智能流程引擎模块
import MultiLanguageCurrencyCenter from './admin/MultiLanguageCurrencyCenter'; // 🔥 多语言/多货币管理中心
import SalesDataManagementCenter from './admin/SalesDataManagementCenter'; // 🔥 销售数据管理与计算中心
// 🔥 移除：业务流程编辑器Pro V2版
// import { WorkflowEditorProV2 } from './workflow/WorkflowEditorProV2'; // 🔥 业务流程编辑Pro V2版
import FormManagementHub from './workflow/FormManagementHub'; // 🔥 表单管理中心（统一三大工具）
// ❌ 已禁用：文件不存在
// import { FormLibraryManagementPro } from './workflow/FormLibraryManagementPro'; // 🔥 表单库管理中心Pro
import { UltimateFormDesigner } from './workflow/UltimateFormDesigner'; // 🔥 终极表单DIY工作台
// import CustomerRelationshipManager from './crm/CustomerRelationshipManager'; // 🔥 客户关系管理（CRM）
// import { AdminFloatingToolbar } from './AdminFloatingToolbar'; // 🔧 Admin浮动工具栏 - 已禁用
import { useAuth } from '../hooks/useAuth'; // 🔥 导入认证钩子
import { hasPermission, type Permission } from '../lib/rbac-config'; // 🔥 导入权限检查函数
import { useAdminOrganization } from '../contexts/AdminOrganizationContext';
import AdminUserProfile, { AdminUserAvatar } from './admin/AdminUserProfile';
import UserRoleSwitcher from './admin/UserRoleSwitcher'; // 🔥 用户角色切换器
// ❌ 已删除：ShipmentManagementCenterV2 - 组件不存在
// 🔥 已删除：OrderFlowCenter - 业务流程中心模块
// ❌ 已禁用：文件不存在
// import LeadConversionWorkbench from './admin/LeadConversionWorkbench'; // 🔥 潜客转化工作台
// ❌ 已禁用：文件不存在
// import FullProcessDemo from './admin/FullProcessDemo'; // 🔥 全流程演示
// [SANDBOX] Mock workflow visualization — not a real ERP module
import { permissionCenterService } from '../lib/services/permissionCenterService';
import { canUseRoleSwitcherForUser } from '../config/adminPortalPolicy';
import { subscribeErpEvent } from '../lib/erp-core/event-bus';
import {
  EMPTY_SALES_WORKFLOW_SOURCE_SNAPSHOT,
  loadSalesWorkflowSourceSnapshot,
  readCachedSalesWorkflowSourceSnapshot,
} from '../lib/services/salesWorkflowSourceService';
import { computeOrderManagementRuleSummary } from '../lib/services/orderManagementCountService';

interface AdminDashboardProps {
  onLogout: () => void | Promise<void>;
}

const scheduleBrowserIdleTask = (callback: () => void, timeout = 1500) => {
  if (typeof window === 'undefined') {
    callback();
    return () => {};
  }

  const idleWindow = window as Window & {
    requestIdleCallback?: (cb: () => void, options?: { timeout?: number }) => number;
    cancelIdleCallback?: (id: number) => void;
  };

  if (typeof idleWindow.requestIdleCallback === 'function') {
    const idleId = idleWindow.requestIdleCallback(() => {
      callback();
    }, { timeout });

    return () => {
      idleWindow.cancelIdleCallback?.(idleId);
    };
  }

  const timerId = window.setTimeout(callback, 0);
  return () => {
    window.clearTimeout(timerId);
  };
};

const AdminDashboardContentFallback = () => (
  <div className="flex min-h-[240px] items-center justify-center rounded-3xl border border-slate-200 bg-white/90 text-sm text-slate-500 shadow-sm">
    正在加载模块...
  </div>
);

const LazyAdminOverview = React.lazy(() => import('./admin/AdminOverview'));
const LazyCustomerManagementEnhanced = React.lazy(() => import('./admin/CustomerManagementEnhanced'));
const LazyAdminDataAnalyticsNew = React.lazy(() => import('./admin/AdminDataAnalyticsNew'));
const LazyProductPush = React.lazy(() => import('./admin/ProductPush'));
const LazyAdminMessaging = React.lazy(() => import('./admin/AdminMessaging'));
const LazyMailWorkbench = React.lazy(() => import('./admin/mail-workbench/MailWorkbench'));
// 🔥 重构：产品管理中心 — 全新 ERP 风格 PIM / 发布 / 价格 / 活动 / 审核 / 映射
const LazyProductManagement = React.lazy(() => import('./admin/product-center'));
const LazyGlobalBIDashboardCompact = React.lazy(() => import('./admin/GlobalBIDashboardCompact'));
const LazySocialMediaMarketingUnified = React.lazy(() =>
  import('./dashboards/SocialMediaMarketingUnified').then((m) => ({ default: m.SocialMediaMarketingUnified }))
);
const LazyCustomerRelationshipManagerPro = React.lazy(() => import('./crm/CustomerRelationshipManagerPro'));
const LazyFinanceDashboard = React.lazy(() => import('./dashboards/FinanceDashboardPro'));
const LazyProcurementDashboard = React.lazy(() => import('./dashboards/ProcurementDashboard'));
const LazyMarketingOpsDashboard = React.lazy(() => import('./dashboards/MarketingOpsDashboard'));
const LazyMenuPermissionMatrix = React.lazy(() => import('./admin/MenuPermissionMatrix'));
const LazyInspectionManagement = React.lazy(() => import('./admin/InspectionManagementComplete'));
const LazyCEOWorkbench = React.lazy(() =>
  import('./admin/workbenches/CEOWorkbench').then((m) => ({ default: m.CEOWorkbench }))
);
const LazyCFODashboardCompactWithHelp = React.lazy(() =>
  import('./dashboards/CFODashboardCompactWithHelp').then((m) => ({ default: m.CFODashboardCompactWithHelp }))
);
const LazySalesDirectorDashboard = React.lazy(() =>
  import('./dashboards/SalesDirectorDashboard').then((m) => ({ default: m.SalesDirectorDashboard }))
);
const LazyRegionalManagerDashboard = React.lazy(() =>
  import('./dashboards/RegionalManagerDashboard').then((m) => ({ default: m.RegionalManagerDashboard }))
);
const LazySalesRepDashboardExpert = React.lazy(() =>
  import('./dashboards/SalesRepDashboardExpert').then((m) => ({ default: m.SalesRepDashboardExpert }))
);
const LazyAdminSystemDashboardPro = React.lazy(() =>
  import('./dashboards/AdminSystemDashboardPro').then((m) => ({ default: m.AdminSystemDashboardPro }))
);
const LazyShippingDocumentManagement = React.lazy(() => import('./admin/ShippingDocumentManagement'));
const LazyAdminDocumentCenter = React.lazy(() => import('./admin/DocumentCenter'));
const LazyFinanceManagement = React.lazy(() => import('./admin/FinanceManagement'));
const LazyInvoiceManagement = React.lazy(() => import('./admin/InvoiceManagement'));
const LazyZhaoMinFinanceWorkbench = React.lazy(() => import('./finance-v2/ZhaoMinFinanceWorkbench'));
const LazyZhaoMinFinanceTodoCenter = React.lazy(() => import('./finance-v2/ZhaoMinFinanceTodoCenter'));
const LazyZhaoMinFinanceManagementCenter = React.lazy(() => import('./finance-v2/ZhaoMinFinanceManagementCenter'));
const LazyManagementFinanceCenter = React.lazy(() => import('./management-finance'));
const LazyExpenseManagementStandalone = React.lazy(() => import('./management-finance/ExpenseManagementStandalone'));
const LazyRolePermissionCenterProMax = React.lazy(() => import('./admin/RolePermissionCenterProMax'));
const LazyPermissionCenterV1 = React.lazy(() => import('./admin/PermissionCenterV1'));
const LazyRealEnterpriseBackupCenter = React.lazy(() => import('./admin/RealEnterpriseBackupCenter'));
const LazySupabaseDiagnosticPanel = React.lazy(() => import('./admin/SupabaseDiagnosticPanel'));
const LazyDocumentNumberingCenter = React.lazy(() => import('./admin/DocumentNumberingCenter'));
const LazySupplierManagement = React.lazy(() => import('./admin/SupplierManagement'));
const LazyPurchaseOrderManagement = React.lazy(() => import('./admin/PurchaseOrderManagementEnhanced'));
const LazyAccountsPayableManagement = React.lazy(() => import('./admin/AccountsPayableManagement'));
const LazyServiceProviderManagement = React.lazy(() => import('./admin/ServiceProviderManagement'));
const LazyOrderManagementCenterPro = React.lazy(() => import('./admin/OrderManagementCenterPro'));
const LazyFullProcessSandboxV5 = React.lazy(() => import('../sandbox/demo/FullProcessSandboxV5'));
const LazyDocumentTestPage = React.lazy(() =>
  import('./documents/DocumentTestPage').then((m) => ({ default: m.DocumentTestPage }))
);
const LazyDocumentationWorkbenchUltimate = React.lazy(() =>
  import('./admin/workbenches/DocumentationWorkbenchUltimate').then((m) => ({ default: m.DocumentationWorkbenchUltimate }))
);
const LazySalesTodoCenter = React.lazy(() =>
  import('./salesperson/SalesTodoCenter').then((m) => ({ default: m.SalesTodoCenter }))
);
const LazySalesManagerTodoCenter = React.lazy(() => import('./admin/SalesManagerTodoCenter'));
const LazyAdminOrganizationProfile = React.lazy(() => import('./admin/AdminOrganizationProfile'));
const LazySalesForecastingTargetsProMaxEditable = React.lazy(() => import('./admin/SalesForecastingTargetsProMaxEditable'));
const LazyMarketCategoryResearch = React.lazy(() => import('../features/market-category-research/MarketCategoryResearchShell'));

function PeopleAdminCenter({ role, onNavigate }: { role?: string; onNavigate: (tab: string) => void }) {
  const title = '人事中心';
  const subtitle = '这是人事主管的独立模板入口，用于处理组织、人、账号、员工关系与内部人员治理事项。';

  const quickActions = [
    {
      title: '进入人员与账号',
      description: '查看人员主档、账号与访问、角色权限。',
      tab: 'admin-company-profile',
    },
    {
      title: '查看消息中心',
      description: '接收审批、通知与跨部门协同提醒。',
      tab: 'messaging',
    },
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-blue-50 p-8 shadow-sm">
        <div className="flex items-start justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs font-semibold tracking-wide text-slate-600">
              PEOPLE ADMIN
            </div>
            <div>
              <h1 className="text-3xl font-semibold text-slate-900">{title}</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{subtitle}</p>
            </div>
          </div>
          <Button onClick={() => onNavigate('admin-company-profile')} className="rounded-full px-5">
            进入人员与账号模块
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {quickActions.map((action) => (
          <button
            key={action.tab}
            type="button"
            onClick={() => onNavigate(action.tab)}
            className="rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
          >
            <div className="text-lg font-semibold text-slate-900">{action.title}</div>
            <div className="mt-2 text-sm leading-6 text-slate-600">{action.description}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function AdminOpsCenter({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const quickActions = [
    {
      title: '合同管理',
      description: '查看合同资料、履约配套文件与行政归档事项。',
      tab: 'shipping-document-management',
    },
    {
      title: '公司注册信息管理',
      description: '维护公司主体、注册信息、证照与基础资料。',
      tab: 'admin-company-profile',
    },
    {
      title: '证照与资质档案',
      description: '统一整理营业执照、认证证书、年审与主体资质资料。',
      tab: 'admin-company-profile',
    },
    {
      title: '行政档案与制度',
      description: '集中管理行政制度、来往函件、内部档案与留存资料。',
      tab: 'document-test',
    },
    {
      title: '用章与内部申请',
      description: '跟进用章、证明、行政支持与内部流转申请。',
      tab: 'form-manager',
    },
    {
      title: '消息中心',
      description: '接收合同、证照、用章与行政支持通知。',
      tab: 'messaging',
    },
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="rounded-3xl border border-amber-200 bg-gradient-to-br from-white via-amber-50 to-orange-50 p-8 shadow-sm">
        <div className="flex items-start justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center rounded-full border border-amber-200 bg-white/80 px-3 py-1 text-xs font-semibold tracking-wide text-amber-700">
              ADMIN OPS
            </div>
            <div>
              <h1 className="text-3xl font-semibold text-slate-900">行政事务中心</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                这是行政专员的独立模板入口，用于处理合同、公司主体资料、证照资质、行政档案与内部行政支持事务。
              </p>
            </div>
          </div>
          <Button onClick={() => onNavigate('admin-company-profile')} className="rounded-full px-5">
            进入公司主体资料
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {quickActions.map((action) => (
          <button
            key={action.tab}
            type="button"
            onClick={() => onNavigate(action.tab)}
            className="rounded-2xl border border-amber-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-md"
          >
            <div className="text-lg font-semibold text-slate-900">{action.title}</div>
            <div className="mt-2 text-sm leading-6 text-slate-600">{action.description}</div>
          </button>
        ))}
      </div>

      <div className="rounded-3xl border border-amber-200 bg-white p-6 shadow-sm">
        <div className="text-sm font-semibold tracking-wide text-amber-700">ADMIN OPS SCOPE</div>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-slate-700">合同与行政归档</div>
          <div className="rounded-2xl bg-orange-50 px-4 py-3 text-sm text-slate-700">公司主体与证照资料</div>
          <div className="rounded-2xl bg-yellow-50 px-4 py-3 text-sm text-slate-700">用章、申请与行政支持</div>
        </div>
      </div>
    </div>
  );
}

function getDefaultTabForRole(user: { role?: string; region?: string } | null | undefined) {
  if (!user?.role) return 'overview';

  if (user.role === 'External_Accountant') return 'finance-management';
  if (user.role === 'Procurement_Manager') return 'purchase-order-management';
  if (user.role === 'Procurement') return 'purchase-order-management';
  if (user.role === 'Sales_Assistant') return 'order-management-center';
  if (user.role === 'Marketing_Assistant') return 'crm';
  if (user.role === 'Documentation_Officer') return 'documentation-center';
  if (user.role === 'QC') return 'inspection-management';
  if (user.role === 'Warehouse_Ops') return 'shipping-document-management';
  if (user.role === 'HR_Admin') return 'people-admin-center';
  if (user.role === 'Admin_Ops') return 'admin-ops-center';

  return 'overview';
}

export default function AdminDashboard({ onLogout }: AdminDashboardProps) {
  // 🔥 获取当前登录用户
  const { currentUser } = useAuth();
  const { adminOrg, adminUserProfile } = useAdminOrganization();
  const [salesWorkflowSnapshot, setSalesWorkflowSnapshot] = useState(() => readCachedSalesWorkflowSourceSnapshot({
    email: currentUser?.email,
    name: currentUser?.name,
    role: currentUser?.role || currentUser?.userRole,
    region: currentUser?.region,
  }));

  // user menu dropdown state
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  // previous tab (for back navigation from profile pages)
  const [prevTab, setPrevTab] = useState('overview');

  const navigateTo = (tab: string) => {
    setPrevTab(activeTab);
    setActiveTab(tab);
    setUserMenuOpen(false);
  };
  const goBack = () => setActiveTab(prevTab);

  // 从 localStorage 读取上次访问的模块，如果没有则默认为 'overview'
  const [activeTab, setActiveTab] = useState(() => {
    // 🔥 修复：根据用户角色设置默认Tab，不从localStorage读取
    // 业务员、采购员、财务员等角色应该默认进入工作台（overview）
    // 避免因为localStorage缓存而显示无权限访问的模块
    
    // 🔥 所有角色默认都显示工作台
    return 'overview';
    
    // 原逻辑（已禁用）：
    // const savedTab = localStorage.getItem('adminDashboardActiveTab');
    // return savedTab || 'overview';
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [, setPermissionCenterRevision] = useState(0);
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const savedWidth = localStorage.getItem('sidebarWidth');
    return savedWidth ? parseInt(savedWidth) : 224; // 默认 w-56 = 224px
  });
  const [isResizing, setIsResizing] = useState(false);

  // 保存侧边栏宽度到localStorage
  useEffect(() => {
    localStorage.setItem('sidebarWidth', sidebarWidth.toString());
  }, [sidebarWidth]);

  // 🔥 鼠标拖动调整侧边栏宽度
  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = Math.max(180, Math.min(400, e.clientX)); // 最小180px，最大400px
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  // 保存当前访问的模块到 localStorage
  useEffect(() => {
    localStorage.setItem('adminDashboardActiveTab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    let mounted = true;

    const hydratePermissionCenter = async () => {
      try {
        await permissionCenterService.hydrateFromSupabase();
        if (!mounted) return;
        setPermissionCenterRevision((value) => value + 1);
      } catch (error) {
        console.warn('[AdminDashboard] permission center hydrate failed:', error);
      }
    };

    const handlePermissionRefresh = () => {
      setPermissionCenterRevision((value) => value + 1);
    };

    const cancelIdleHydration = scheduleBrowserIdleTask(() => {
      void hydratePermissionCenter();
    }, 2500);
    window.addEventListener('menuPermissionsUpdated', handlePermissionRefresh);
    window.addEventListener('app_publish_permissions', handlePermissionRefresh);

    return () => {
      mounted = false;
      cancelIdleHydration();
      window.removeEventListener('menuPermissionsUpdated', handlePermissionRefresh);
      window.removeEventListener('app_publish_permissions', handlePermissionRefresh);
    };
  }, []);

  useEffect(() => {
    let alive = true;

    const syncSalesWorkflowSnapshot = async () => {
      const nextSnapshot = await loadSalesWorkflowSourceSnapshot({
        email: currentUser?.email,
        name: currentUser?.name,
        role: currentUser?.role || currentUser?.userRole,
        region: currentUser?.region,
      });
      if (alive) setSalesWorkflowSnapshot(nextSnapshot);
    };

    void syncSalesWorkflowSnapshot();
    window.addEventListener('userChanged', syncSalesWorkflowSnapshot as EventListener);
    const unsubscribe = subscribeErpEvent(() => {
      void syncSalesWorkflowSnapshot();
    });
    return () => {
      alive = false;
      window.removeEventListener('userChanged', syncSalesWorkflowSnapshot as EventListener);
      unsubscribe();
    };
  }, [currentUser?.email, currentUser?.role, currentUser?.region]);

  const cachedApprovalPendingCount = React.useMemo(() => {
    const email = String(currentUser?.email || '').trim();
    if (!email) return 0;
    try {
      const raw = localStorage.getItem(`approval_center_cache_v1:${email}`);
      const parsed = raw ? JSON.parse(raw) : null;
      return Array.isArray(parsed?.pending) ? parsed.pending.length : 0;
    } catch {
      return 0;
    }
  }, [currentUser?.email]);

  const workflowRuleSummary = React.useMemo(() => {
    if (!currentUser) return null;
    return computeOrderManagementRuleSummary({
      actor: {
        email: currentUser.email,
        name: currentUser.name,
        role: currentUser.role || currentUser.userRole,
        rawRole: currentUser.userRole || currentUser.role,
        region: currentUser.region,
      },
      snapshot: salesWorkflowSnapshot,
      approvalPendingCount: cachedApprovalPendingCount,
    });
  }, [currentUser, salesWorkflowSnapshot, cachedApprovalPendingCount]);
  const orderManagementBadge = workflowRuleSummary?.counts.overview || 0;
  const salesTodoBadge = ['Sales_Rep', 'Regional_Manager', 'Sales_Manager', 'Sales_Director', 'CEO'].includes(String(currentUser?.role || currentUser?.userRole || ''))
    ? (workflowRuleSummary?.salesTodoOpenCount || 0)
    : 0;

  // 🔥 监听角色切换事件，自动跳转到该角色的默认工作台
  useEffect(() => {
    const handleRoleChange = (event: CustomEvent) => {
      console.log('🔄 [AdminDashboard] 检测到角色切换:', event.detail);
      const nextTab = getDefaultTabForRole(event.detail as { role?: string; region?: string });
      setActiveTab(nextTab);
      localStorage.setItem('adminDashboardActiveTab', nextTab);
    };

    window.addEventListener('userChanged', handleRoleChange as EventListener);
    return () => {
      window.removeEventListener('userChanged', handleRoleChange as EventListener);
    };
  }, []);

  // 🚀 监听导航事件（用于跨模块跳转）
  useEffect(() => {
    const handleNavigate = (event: CustomEvent) => {
      const { page, subTab } = (event.detail || {}) as { page?: string; subTab?: string };
      console.log('🎯 接收到导航事件:', { page, subTab });
      if (!page) return;

      if (page === 'order-management-center' && subTab) {
        localStorage.setItem('orderManagementCenterActiveTab', subTab);
      }

      // 仅当page属于当前Dashboard可识别模块时才切换
      setActiveTab(page as any);
    };

    window.addEventListener('navigate', handleNavigate as EventListener);
    return () => {
      window.removeEventListener('navigate', handleNavigate as EventListener);
    };
  }, []);

  // 🔥 新增：权限验证 - 当用户切换或activeTab变化时，检查是否有权限访问
  useEffect(() => {
    if (!currentUser) return;
    if (activeTab === 'overview') return; // overview总是可访问

    // Admin排除的业务模块列表
    const adminExcludedModules = [
      'product-management',
      'product-push',
      'messaging',
      'social-media-marketing',
      'live-stream-management',
      'customers',
      'order-management-center',
      'shipping-document-management',
      'analytics',
      // 🔥 移除：order-flow-center 应该允许Admin访问（用于流程监控）
      // 'order-flow-center',
      // finance-management / finance-v2 / management-finance：Admin 需可进入便于实施与演示
      'lead-conversion',
      'global-bi-dashboard',
      'customer-health-monitor',
      // 🔥 移除：smart-workflow-engine 应该允许Admin访问（技术管理模块）
      // 'smart-workflow-engine',
      'quote-management-enhanced',
      // 🔥 移除contract-management-pro，Sales_Rep需要访问
      'sales-forecasting-targets',
      'sales-forecasting-targets-pro-max'
    ];

    // 如果是Admin角色，且当前activeTab在排除列表中，重置为overview
    if (currentUser.role === 'Admin' && adminExcludedModules.includes(activeTab)) {
      console.info(`ℹ️ [权限检查] Admin角色限制访问业务模块: ${activeTab}，已自动重定向至 overview。这是系统安全设计，非错误。`);
      setActiveTab('overview');
      return;
    }
  }, [currentUser, activeTab]);

  // Menu items state with drag and drop support
  // 🔥 每个菜单项都配置了所需权限
  const defaultMenuItems = [
    { 
      id: 'overview', 
      label: '工作台', 
      enLabel: 'Dashboard', 
      icon: LayoutDashboard,
      requiredPermission: 'access:dashboard' as Permission
    },
    {
      id: 'people-admin-center',
      label: '人事中心',
      enLabel: 'People Admin Center',
      icon: Users,
      badge: 'NEW' as any,
      requiredPermission: 'access:data_management' as Permission
    },
    {
      id: 'admin-ops-center',
      label: '行政事务中心',
      enLabel: 'Admin Operations Center',
      icon: Building2,
      badge: 'NEW' as any,
      requiredPermission: 'access:data_management' as Permission
    },
    // 🔥 移除客户管理模块
    // { 
    //   id: 'customers', 
    //   label: '客户管理', 
    //   enLabel: 'Customers', 
    //   icon: Users, 
    //   badge: 9,
    //   requiredPermission: 'access:customer_management' as Permission
    // },
    // 🔥 移除独立的潜客转化工作台（已整合到CRM模块中）
    // { 
    //   id: 'lead-conversion', 
    //   label: '潜客转化工作台', 
    //   enLabel: 'Lead Conversion', 
    //   icon: Target, 
    //   badge: 'NEW' as any,
    //   requiredPermission: 'access:inquiry_management' as Permission
    // },
    { 
      id: 'crm', 
      label: '客户关系管理', 
      enLabel: 'CRM System', 
      icon: UserCheck, 
      badge: '' as any,
      requiredPermission: 'access:customer_management' as Permission
    },
    // 🔥 已整合到CRM模块中，不再独立显示
    // { 
    //   id: 'public-pool', 
    //   label: '公海客户池', 
    //   enLabel: 'Public Pool', 
    //   icon: Waves, 
    //   badge: 'NEW' as any,
    //   requiredPermission: 'access:customer_management' as Permission // 🔥 运营专员、业务员、区域主管可见
    // },
    // 🔥 已整合到社交媒体营销模块中，不再独立显示
    // { 
    //   id: 'customer-intake', 
    //   label: '客户录入评估', 
    //   enLabel: 'Customer Intake', 
    //   icon: UserPlus, 
    //   badge: 'AI' as any,
    //   requiredPermission: 'access:customer_management' as Permission // 🔥 运营专员主要使用，其他角色可查看
    // },
    { 
      id: 'order-management-center', 
      label: '订单管理中心', 
      enLabel: 'Order Management', 
      icon: Package, 
      badge: orderManagementBadge > 0 ? orderManagementBadge : undefined,
      requiredPermission: 'access:order_management' as Permission
    },
    {
      id: 'mail-workbench',
      label: '业务邮件工作台',
      enLabel: 'Mail Workbench',
      icon: Mail,
      badge: 'NEW' as any,
      requiredPermission: 'access:dashboard' as Permission
    },
    {
      id: 'sales-todo-center',
      label: '待办中心',
      enLabel: 'My Todo Center',
      icon: ClipboardCheck,
      badge: salesTodoBadge > 0 ? salesTodoBadge : undefined,
      requiredPermission: 'access:inquiry_management' as Permission // 业务员、区域主管、销售总监
    },
    {
      id: 'full-process-demo',
      label: '🧪 全流程演示沙盘（Mock）',
      enLabel: 'Workflow Sandbox (Mock Only)',
      icon: Workflow,
      badge: 'MOCK' as any,
      requiredPermission: 'access:dashboard' as Permission
    },
    {
      id: 'full-process-demo-v5',
      label: '🧪 全流程演示沙盘 V5（Mock）',
      enLabel: 'Workflow Sandbox V5 (Mock Only)',
      icon: Sparkles,
      badge: 'MOCK' as any,
      requiredPermission: 'access:dashboard' as Permission
    },
    { 
      id: 'shipping-document-management', 
      label: '发货管理', 
      enLabel: 'Shipment Management', 
      icon: Ship, 
      badge: 4,
      requiredPermission: 'access:shipping' as Permission
    },
    // ❌ 已删除：ShipmentManagementCenterV2 - 组件不存在
    // { 
    //   id: 'shipment-management-center-v2', 
    //   label: '发货管理中心 V2', 
    //   enLabel: 'Shipment Center V2', 
    //   icon: Sparkles, 
    //   badge: '双模式' as any,
    //   requiredPermission: 'access:shipping' as Permission
    // },
    { 
      id: 'document-test', 
      label: '📄 文档中心', 
      enLabel: 'Document Center', 
      icon: FileText, 
      badge: '7种' as any,
      requiredPermission: 'access:dashboard' as Permission // 所有人都能查看
    },
    {
      id: 'template-workbench',
      label: '模板中心工作台',
      enLabel: 'Template Workbench',
      icon: Wand2,
      badge: 'NEW' as any,
      requiredPermission: 'access:data_management' as Permission // 🔒 仅系统管理员（Admin）可见
    },
    {
      id: 'admin-company-profile',
      label: '企业主数据中心',
      enLabel: 'Company Master Data',
      icon: Building2,
      badge: 'NEW' as any,
      requiredPermission: 'access:data_management' as Permission
    },
    // 🔥 删除：文档编辑器模块
    { 
      id: 'documentation-center',
      label: '单证管理中心',
      enLabel: 'Documentation Management Center',
      icon: FolderOpen,
      requiredPermission: 'access:shipping' as Permission
    },
    { 
      id: 'documentation-workbench-ultimate', 
      label: '单证管理', 
      enLabel: 'Documentation Management', 
      icon: Sparkles,
      requiredPermission: 'access:shipping' as Permission // 🔥 单证员权限（与发货相关）
    },
    { 
      id: 'analytics', 
      label: 'CEO战略驾驶舱', 
      enLabel: 'CEO Strategic Dashboard', 
      icon: BarChart3,
      requiredPermission: 'access:analytics' as Permission
    },
    { 
      id: 'global-bi-dashboard', 
      label: '全局BI仪表盘', 
      enLabel: 'Global BI Dashboard', 
      icon: Activity,
      badge: 'NEW' as any,
      requiredPermission: 'access:analytics' as Permission // CEO/CFO/销售总监可见
    },
    // 🔥 移除客户健康度监控模块
    // { 
    //   id: 'customer-health-monitor', 
    //   label: '客户健康度监控', 
    //   enLabel: 'Customer Health', 
    //   icon: HeartPulse,
    //   badge: 'NEW' as any,
    //   requiredPermission: 'access:customer_management' as Permission // 客户管理权限
    // },
    // 🔥 已删除：智能流程引擎模块（smart-workflow-engine）
    // { 
    //   id: 'smart-workflow-engine', 
    //   label: '智能流程引擎', 
    //   enLabel: 'Smart Workflow', 
    //   icon: Workflow,
    //   badge: 'NEW' as any,
    //   requiredPermission: 'access:data_management' as Permission // 🔒 仅系统管理员（Admin）可见
    // },
    // 🔥 移除：业务流程编辑器 Pro（已废弃 - 不参与实际业务流程执行）
    // { 
    //   id: 'workflow-editor', 
    //   label: '业务流程编辑器 Pro', 
    //   enLabel: 'Workflow Editor Pro', 
    //   icon: Settings,
    //   badge: 'PRO' as any,
    //   requiredPermission: 'access:data_management' as Permission // 🔒 仅系统管理员（Admin）可见
    // },
    { 
      id: 'workflow-validation', 
      label: '工作流验证中心', 
      enLabel: 'Workflow Validation', 
      icon: Target,
      badge: 'NEW' as any,
      requiredPermission: 'access:data_management' as Permission // 🔒 仅系统管理员（Admin）可见
    },
    { 
      id: 'form-manager', 
      label: '表单管理中心（统一三大工具）', 
      enLabel: 'Form Template Manager', 
      icon: FileText,
      badge: 'PRO' as any,
      requiredPermission: 'access:data_management' as Permission // 🔒 仅系统管理员（Admin）可见
    },
    { 
      id: 'status-flow-simulator', 
      label: '状态流转模拟器', 
      enLabel: 'Status Flow Simulator', 
      icon: Activity,
      badge: 'PRO' as any,
      requiredPermission: 'access:data_management' as Permission // 🔒 仅系统管理员（Admin）可见
    },
    { 
      id: 'product-management', 
      label: '产品管理', 
      enLabel: 'Products', 
      icon: Box,
      requiredPermission: 'access:product_management' as Permission // 🔥 运营专员权限
    },
    { 
      id: 'market-category-research', 
      label: '市场类目研究', 
      enLabel: 'Market Category Research', 
      icon: TrendingUp,
      badge: 'NEW' as any,
      requiredPermission: 'access:product_management' as Permission
    },
    { 
      id: 'product-push', 
      label: '产品推送', 
      enLabel: 'Product Push', 
      icon: Bell,
      requiredPermission: 'access:product_push' as Permission // 🔥 运专员权限
    },
    { 
      id: 'messaging', 
      label: '消息中心', 
      enLabel: 'Messages', 
      icon: Mail, 
      badge: 3,
      requiredPermission: 'access:dashboard' as Permission // 所有人都能访问
    },
    { 
      id: 'social-media-marketing', 
      label: '社交媒体营销（含客户录入）', 
      enLabel: 'Social Media & Lead Intake', 
      icon: Share2, 
      badge: 'FULL' as any,
      requiredPermission: 'access:social_media' as Permission // 🔥 运营专员权限（含直播系统+客户录入评估）
    },
    // 🔥 已删除：OrderFlowCenter - 业务流程中心模块
    // { 
    //   id: 'order-flow-center', 
    //   label: '业务流程中心', 
    //   enLabel: 'Business Flow Center', 
    //   icon: Activity,
    //   requiredPermission: 'access:data_management' as Permission // 🔒 仅系统管理员（Admin）可见
    // },
    { 
      id: 'finance-management', 
      label: '财务管理', 
      enLabel: 'Finance Management', 
      icon: Wallet,
      requiredPermission: 'access:finance_management' as Permission // 🔥 财务专员权限
    },
    { 
      id: 'finance-v2-workbench', 
      label: '赵敏财务工作台（新）', 
      enLabel: 'Finance Workbench (New)', 
      icon: Sparkles,
      badge: 'V2' as any,
      requiredPermission: 'access:finance_management' as Permission
    },
    { 
      id: 'finance-v2-todo-center', 
      label: '财务待办中心（新）', 
      enLabel: 'Finance Todo Center (New)', 
      icon: ClipboardCheck,
      badge: 'V2' as any,
      requiredPermission: 'access:finance_management' as Permission
    },
    { 
      id: 'finance-v2-management-center', 
      label: '财务管理中心（新）', 
      enLabel: 'Finance Management Center (New)', 
      icon: LayoutGrid,
      badge: 'V2' as any,
      requiredPermission: 'access:finance_management' as Permission
    },
    {
      id: 'expense-management-center',
      label: '费用管理中心',
      enLabel: 'Expense Management Center',
      icon: ClipboardList,
      badge: '业财' as any,
      requiredPermission: 'access:finance_management' as Permission
    },
    {
      id: 'management-finance-center',
      label: '内部管理财务中心',
      enLabel: 'Management Finance Center',
      icon: Sparkles,
      badge: 'AI' as any,
      requiredPermission: 'access:finance_management' as Permission
    },
    { 
      id: 'permission-center', 
      label: '权限中心', 
      enLabel: 'Permission Center', 
      icon: Shield,
      badge: 'NEW' as any,
      requiredPermission: 'access:data_management' as Permission // 🔒 仅系统管理员（Admin）可见
    },
    { 
      id: 'role-permission', 
      label: '角色权限管理', 
      enLabel: 'Role & Permission', 
      icon: Shield,
      requiredPermission: 'access:data_management' as Permission // 🔒 仅系统管理员（Admin）可见
    },
    { 
      id: 'menu-permission-matrix', 
      label: '菜单权限配置矩阵', 
      enLabel: 'Menu Permission Matrix', 
      icon: Settings,
      badge: '配置' as any,
      requiredPermission: 'access:data_management' as Permission // 🔒 仅系统管理员（Admin）可见
    },
    {
      id: 'document-numbering-center',
      label: '编号管理中心',
      enLabel: 'Document Numbering Center',
      icon: Hash,
      badge: 'NEW' as any,
      requiredPermission: 'access:data_management' as Permission
    },
    // 🔥 数据备份中心 - 已移除
    // 🔥 数据备份中心 Pro - 已移除
    { 
      id: 'enterprise-backup-center', 
      label: '企业级备份中心', 
      enLabel: 'Enterprise Backup Center', 
      icon: Shield,
      badge: '5层' as any,
      requiredPermission: 'access:data_management' as Permission // 🔒 仅系统管理员（Admin）可见
    },
    { 
      id: 'supabase-diagnostic', 
      label: 'Supabase诊断面板', 
      enLabel: 'Supabase Diagnostic', 
      icon: Terminal,
      badge: '诊断' as any,
      requiredPermission: 'access:data_management' as Permission // 🔒 仅系统管理员（Admin）可见
    },
    { 
      id: 'supplier-management', 
      label: '供应商管理', 
      enLabel: 'Supplier Management', 
      icon: Factory,
      requiredPermission: 'access:supplier_management' as Permission
    },
    { 
      id: 'purchase-order-management', 
      label: '采购订单管理', 
      enLabel: 'Purchase Order Management', 
      icon: Truck,
      requiredPermission: 'access:purchase_orders' as Permission // 🔥 修复：改为独立的采购订单权限
    },
    { 
      id: 'accounts-payable-management', 
      label: '应付账款管理', 
      enLabel: 'Accounts Payable Management', 
      icon: Wallet,
      requiredPermission: 'access:supplier_management' as Permission // 使用独立的应付账款管理权限
    },
    { 
      id: 'service-provider-management', 
      label: '服务商管理', 
      enLabel: 'Service Provider Management', 
      icon: Truck,
      requiredPermission: 'access:service_provider' as Permission // 使用独立的服务商管理权限
    },
    {
      id: 'inspection-management',
      label: '验货管理',
      enLabel: 'Inspection Management',
      icon: Edit,
      requiredPermission: 'access:supplier_management' as Permission
    },
    // 🔥🔥🔥 新增6个增强模块菜单项（不覆盖原有模块）🔥🔥🔥
    { 
      id: 'multi-language-currency', 
      label: '多语言/多货币', 
      enLabel: 'Multi-Language & Currency', 
      icon: Globe,
      badge: 'Global' as any,
      requiredPermission: 'access:data_management' as Permission // 🔒 仅系统管理员（Admin）可见
    },
    // 🔥 移除"销售预测与目标"模块（已废弃）
    { 
      id: 'sales-forecasting-targets-pro-max', 
      label: '销售预测与目标 Pro Max', 
      enLabel: 'Sales Forecasting Pro Max', 
      icon: Target,
      badge: 'Pro Max' as any,
      requiredPermission: 'access:inquiry_management' as Permission // 🔥 业务部门权限
    },
    { 
      id: 'sales-data-management', 
      label: '销售数据管理与计算中心', 
      enLabel: 'Sales Data Management', 
      icon: Database,
      badge: 'Data' as any,
      requiredPermission: 'access:inquiry_management' as Permission // 🔥 业务部门权限
    },
  ];

  // Initialize menuItems from localStorage or use default
  const [menuItems, setMenuItems] = useState(() => {
    const savedOrder = localStorage.getItem('adminDashboardMenuOrder');
    if (savedOrder) {
      try {
        const order = JSON.parse(savedOrder);
        
        // ✅ 强制检查：确保service-provider-management存在
        if (!order.includes('service-provider-management')) {
          console.log('🔧 检测到缺少服务商管理菜单项，正在自动添加...');
          order.push('service-provider-management');
          localStorage.setItem('adminDashboardMenuOrder', JSON.stringify(order));
        }

        // ✅ 赵敏 finance-v2：旧 localStorage 顺序里没有时插入到「消息中心」后，避免沉在列表最底不好找
        const financeV2Ids = [
          'finance-v2-workbench',
          'finance-v2-todo-center',
          'finance-v2-management-center',
          'expense-management-center',
          'management-finance-center',
        ] as const;
        const missingV2 = financeV2Ids.filter((id) => !order.includes(id));
        if (missingV2.length > 0) {
          const msgIdx = order.indexOf('messaging');
          if (msgIdx >= 0) {
            order.splice(msgIdx + 1, 0, ...missingV2);
          } else {
            order.push(...missingV2);
          }
          localStorage.setItem('adminDashboardMenuOrder', JSON.stringify(order));
        }
        
        // Restore the order based on saved IDs, and add any new items that aren't in saved order
        const restoredItems = order
          .map((id: string) => defaultMenuItems.find(item => item.id === id))
          .filter(Boolean);
        
        // Find new items that aren't in the saved order
        const newItems = defaultMenuItems.filter(
          item => !order.includes(item.id)
        );
        
        // Return restored items + new items at the end
        return [...restoredItems, ...newItems];
      } catch (e) {
        // If there's an error parsing, just use defaults
        return defaultMenuItems;
      }
    }
    return defaultMenuItems;
  });

  // Save menu order to localStorage whenever it changes
  useEffect(() => {
    const order = menuItems.map(item => item.id);
    localStorage.setItem('adminDashboardMenuOrder', JSON.stringify(order));
  }, [menuItems]);

  // 🔥 根据当前用户权限过滤菜单项
  const filteredMenuItems = currentUser 
    ? menuItems.filter(item => {
        const enabledModules = permissionCenterService.getEnabledModulesForUser(currentUser);
        if (enabledModules && enabledModules.length > 0) {
          return enabledModules.includes(item.id as any);
        }

        // 🔥🔥🔥 角色模块访问控制矩阵 🔥🔥🔥
        
        // 📋 单证员 (Documentation_Officer) - 只能访问单证相关模块
        if (currentUser.role === 'Documentation_Officer') {
          const allowedModules = [
            'overview',                         // ✅ 工作台（单证管理系统）
            'documentation-center',            // ✅ 单证管理中心
            'document-test',                    // ✅ 文档中心
            'messaging',                        // ✅ 消息中心
          ];
          return allowedModules.includes(item.id);
        }
        
        // 🎯 运营专员 (Marketing_Ops) - 产品管理、社媒营销、客户录入
        if (currentUser.role === 'Marketing_Ops') {
          const allowedModules = [
            'overview',                      // ✅ 工作台
            'crm',                           // ✅ CRM（客户录入）
            'product-management',            // ✅ 产品管理
            'market-category-research',      // ✅ 市场类目研究
            'product-push',                  // ✅ 产品推送
            'social-media-marketing',        // ✅ 社交媒体营销（含客户录入）
            'messaging',                     // ✅ 消息中心
          ];
          return allowedModules.includes(item.id);
        }

        // 📝 运营助理 (Marketing_Assistant) - 营销协助执行
        if (currentUser.role === 'Marketing_Assistant') {
          const allowedModules = [
            'overview',                      // ✅ 工作台
            'crm',                           // ✅ CRM
            'product-management',            // ✅ 产品管理
            'market-category-research',      // ✅ 市场类目研究
            'product-push',                  // ✅ 产品推送
            'social-media-marketing',        // ✅ 社交媒体营销
            'messaging',                     // ✅ 消息中心
          ];
          return allowedModules.includes(item.id);
        }

        // 💰 财务专员 (Finance) - 订单财务、财务管理
        if (currentUser.role === 'Finance') {
          const allowedModules = [
            'overview',              // ✅ 工作台
            'order-management-center', // ✅ 订单管理中心（财务视角）
            'finance-management',    // ✅ 财务管理
            'finance-v2-workbench',
            'finance-v2-todo-center',
            'finance-v2-management-center',
            'management-finance-center',
            'expense-management-center',
            'messaging',             // ✅ 消息中心
          ];
          return allowedModules.includes(item.id);
        }
        
        // 🏭 采购专员 (Procurement) - 供应商、采购、验货
        if (currentUser.role === 'Procurement') {
          const allowedModules = [
            'overview',                      // ✅ 工作台
            'supplier-management',           // ✅ 供应商管理
            'purchase-order-management',     // ✅ 采购订单执行视图
            'inspection-management',         // ✅ 验货管理
            'messaging',                     // ✅ 消息中心
          ];
          return allowedModules.includes(item.id);
        }
        
        // 👨‍💼 业务员 (Sales_Rep) - 一线销售人员
        if (currentUser.role === 'Sales_Rep') {
          const allowedModules = [
            'overview',                         // ✅ 工作台
            'sales-todo-center',                // ✅ 待办中心
            'crm',                              // ✅ CRM
            'order-management-center',          // ✅ 订单管理中心
            'shipping-document-management',     // ✅ 发货管理
            'messaging',                        // ✅ 消息中心
            // ❌ 禁止：采购订单管理、供应商管理、财务管理、系统设置
          ];
          return allowedModules.includes(item.id);
        }
        
        // 🌍 区域主管 - 区域销售管理
        if (currentUser.role === 'Regional_Manager' || (currentUser.role === 'Sales_Manager' && currentUser.region !== 'all')) {
          const allowedModules = [
            'overview',                         // ✅ 工作台
            'sales-todo-center',                // ✅ 待办中心
            'crm',                              // ✅ CRM
            'order-management-center',          // ✅ 订单管理中心
            'shipping-document-management',     // ✅ 发货管理
            'messaging',                        // ✅ 消息中心
          ];
          return allowedModules.includes(item.id);
        }
        
        // 📊 销售总监 - 全局销售管理
        if (currentUser.role === 'Sales_Director' || (currentUser.role === 'Sales_Manager' && currentUser.region === 'all')) {
          const allowedModules = [
            'overview',                         // ✅ 工作台
            'sales-todo-center',                // ✅ 待办中心
            'crm',                              // ✅ CRM
            'order-management-center',          // ✅ 订单管理中心
            'shipping-document-management',     // ✅ 发货管理
            'global-bi-dashboard',              // ✅ 全局BI仪表盘
            'messaging',                        // ✅ 消息中心
          ];
          return allowedModules.includes(item.id);
        }
        
        // 💼 CFO (财务总监) - 财务管控
        if (currentUser.role === 'CFO') {
          const allowedModules = [
            'overview',                // ✅ 工作台
            'order-management-center', // ✅ 订单管理中心（财务视角）
            'global-bi-dashboard',     // ✅ 全局BI仪表盘
            'finance-management',      // ✅ 财务管理
            'finance-v2-workbench',
            'finance-v2-todo-center',
            'finance-v2-management-center',
            'management-finance-center',
            'expense-management-center',
            'document-numbering-center',
            'messaging',               // ✅ 消息中心
          ];
          return allowedModules.includes(item.id);
        }
        
        // 🎩 CEO (总裁) - 战略决策
        if (currentUser.role === 'CEO') {
          const allowedModules = [
            'overview',                      // ✅ 工作台（CEO战略驾驶舱）
            'crm',                           // ✅ CRM
            'order-management-center',       // ✅ 订单管理中心
            'shipping-document-management',  // ✅ 发货管理
            'analytics',                     // ✅ 数据分析（CEO战略驾驶舱）
            'global-bi-dashboard',           // ✅ 全局BI仪表盘
            'product-management',            // ✅ 产品管理
            'market-category-research',      // ✅ 市场类目研究
            'finance-management',            // ✅ 财务管理（查看）
            'finance-v2-workbench',
            'finance-v2-todo-center',
            'finance-v2-management-center',
            'management-finance-center',
            'expense-management-center',
            'document-numbering-center',
            'messaging',                     // ✅ 消息中心
          ];
          return allowedModules.includes(item.id);
        }
        
        // ⚙️ 系统管理员 (Admin) - 系统配置、流程管理、技术管理
        if (currentUser.role === 'Admin') {
          const allowedModules = [
            'overview',                      // ✅ 工作台
            'document-test',                 // ✅ 文档中心（仅Admin）
            'template-workbench',           // ✅ 模板中心工作台
            'admin-company-profile',        // ✅ 企业主数据中心
            'form-manager',                  // ✅ 表单管理中心
            'role-permission',               // ✅ 角色权限管理
            'menu-permission-matrix',        // ✅ 菜单权限配置矩阵
            'document-numbering-center',     // ✅ 编号管理中心
            'enterprise-backup-center',      // ✅ 企业级备份中心
            'supabase-diagnostic',           // ✅ Supabase诊断面板
            'multi-language-currency',       // ✅ 多语言/多货币
            'full-process-demo-v5',          // 🧪 全流程演示沙盘 V5（Mock Only）
            'product-management',            // ✅ 产品管理
            'market-category-research',      // ✅ 市场类目研究
            'finance-v2-workbench',
            'finance-v2-todo-center',
            'finance-v2-management-center',
            'finance-management',
            'management-finance-center',
            'expense-management-center',
            'messaging',                     // ✅ 消息中心
          ];
          return allowedModules.includes(item.id);
        }
        
        // 🔒 默认：使用RBAC权限检查（兜底逻辑）
        return hasPermission(currentUser, item.requiredPermission);
      })
    : menuItems;

  // 🔥 根据当前用户角色动态调整菜单项显示名称
  const displayMenuItems = filteredMenuItems.map(item => {
    // 🔥 Analytics模块：根据角色显示不同名称
    if (item.id === 'analytics') {
      if (currentUser?.role === 'CFO') {
        return {
          ...item,
          label: 'CFO财务管控中心',
          enLabel: 'CFO Financial Control Center'
        };
      }
      // CEO和其他角色显示原名称
      return item;
    }
    return item;
  });
  
  useEffect(() => {
    if (!currentUser) return;
    if (activeTab === 'overview') return;

    const allowedTabIds = new Set(filteredMenuItems.map((item) => item.id));
    if (allowedTabIds.has(activeTab)) return;

    const fallbackTab = filteredMenuItems[0]?.id || 'overview';
    if (fallbackTab !== activeTab) {
      setActiveTab(fallbackTab);
    }
  }, [activeTab, currentUser, filteredMenuItems]);

  // Drag and drop handlers
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [dragOverItem, setDragOverItem] = useState<string | null>(null);

  const handleDragStart = (itemId: string) => {
    setDraggedItem(itemId);
  };

  const handleDragEnter = (itemId: string) => {
    if (draggedItem === null) return;
    setDragOverItem(itemId);
  };

  const handleDragEnd = () => {
    if (draggedItem === null || dragOverItem === null) {
      setDraggedItem(null);
      setDragOverItem(null);
      return;
    }

    // 🔥 使用ID而不是索引进行重排序
    const items = [...menuItems];
    const draggedIndex = items.findIndex(item => item.id === draggedItem);
    const dragOverIndex = items.findIndex(item => item.id === dragOverItem);
    
    if (draggedIndex === -1 || dragOverIndex === -1) {
      setDraggedItem(null);
      setDragOverItem(null);
      return;
    }

    const draggedItemContent = items[draggedIndex];
    
    // Remove dragged item
    items.splice(draggedIndex, 1);
    // Insert at new position
    items.splice(dragOverIndex, 0, draggedItemContent);
    
    setMenuItems(items);
    setDraggedItem(null);
    setDragOverItem(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        // 🔥 根据角色显示不同的工作台
        if (currentUser?.role === 'CEO') {
          return <LazyCEOWorkbench user={currentUser} onNavigate={setActiveTab} />;
        }
        // CFO显示财务总监工作台（紧凑版 + 完整帮助提示）
        if (currentUser?.role === 'CFO') {
          return <LazyCFODashboardCompactWithHelp />;
        }
        // 销售总监显示销售管理工作台
        if (currentUser?.role === 'Sales_Director' || (currentUser?.role === 'Sales_Manager' && currentUser?.region === 'all')) {
          return <LazySalesDirectorDashboard />;
        }
        // 区域主管显示区域管理工作台
        if (currentUser?.role === 'Regional_Manager' || (currentUser?.role === 'Sales_Manager' && currentUser?.region !== 'all')) {
          return <LazyRegionalManagerDashboard user={currentUser} />;
        }
        // 业务员显示业务员工作台（专家版 - 背调系统）
        if (currentUser?.role === 'Sales_Rep') {
          return <LazySalesRepDashboardExpert user={currentUser} />;
        }
        // 财务专员显示财务专员工作台
        if (currentUser?.role === 'Finance') {
          return <LazyFinanceDashboard user={currentUser} />;
        }
        // 代理记账财务默认进入财务管理执行页，而不是内部财务工作台
        if (currentUser?.role === 'External_Accountant') {
          return <LazyFinanceManagement />;
        }
        // 采购主管默认进入采购订单管理，以体现主管视角
        if (currentUser?.role === 'Procurement_Manager') {
          return <LazyPurchaseOrderManagement />;
        }
        // 采购员显示采购执行工作台
        if (currentUser?.role === 'Procurement') {
          return <LazyProcurementDashboard user={currentUser} />;
        }
        // 业务助理默认进入订单管理中心，统一销售侧主入口
        if (currentUser?.role === 'Sales_Assistant') {
          return <LazyOrderManagementCenterPro currentUser={currentUser} />;
        }
        // 运营专员显示运营专员工作台
        if (currentUser?.role === 'Marketing_Ops') {
          return <LazyMarketingOpsDashboard user={currentUser} />;
        }
        // 运营助理进入客户录入/营销执行入口，避免与运营专员同页
        if (currentUser?.role === 'Marketing_Assistant') {
          return <LazyCustomerRelationshipManagerPro />;
        }
        // 系统管理员显示系统管理仪表盘
        if (currentUser?.role === 'Admin') {
          return <LazyAdminSystemDashboardPro user={currentUser} onNavigate={setActiveTab} />;
        }
        // 单证员显示单证管理系统
        if (currentUser?.role === 'Documentation_Officer') {
          return <LazyDocumentationWorkbenchUltimate />;
        }
        // QC / 人事 / 行政用各自最贴近的正式入口
        if (currentUser?.role === 'QC') {
          return <LazyInspectionManagement />;
        }
        if (currentUser?.role === 'HR_Admin') {
          return <PeopleAdminCenter role={currentUser?.role} onNavigate={setActiveTab} />;
        }
        if (currentUser?.role === 'Admin_Ops') {
          return <AdminOpsCenter onNavigate={setActiveTab} />;
        }
        // 其他角色暂时显示原工作台
        return <LazyAdminOverview onNavigateToAPIDemo={() => setActiveTab('social-media-marketing')} />;
      case 'customers':
        return <LazyCustomerManagementEnhanced />;
      case 'crm': // 🔥 新增：客户关系管理（CRM Pro - 社媒打通 + 公海客户池）
        return <LazyCustomerRelationshipManagerPro />;
      case 'people-admin-center':
        return <PeopleAdminCenter role={currentUser?.role} onNavigate={setActiveTab} />;
      case 'admin-ops-center':
        return <AdminOpsCenter onNavigate={setActiveTab} />;
      // 🔥 已整合到CRM模块中，不再独立显示
      // case 'public-pool': // 🔥 新增：公海客户池（Pro增强版 - 不同角色看到不同视图）
      //   return currentUser ? <PublicPoolManagementPro userRole={currentUser.role} userRegion={currentUser.region} /> : null;
      // 🔥 已整合到社交媒体营销模块中，不再独立显示
      // case 'customer-intake': // 🔥 新增：客户录入与评估系统（多渠道客户采集、智能评分）
      //   return currentUser ? <CustomerIntakeSystem userRole={currentUser.role} /> : null;
      case 'analytics':
        return <LazyAdminDataAnalyticsNew />; // 🔥 使用新的角色专属数据分析
      case 'global-bi-dashboard': // 🔥 新增：全局BI决策仪表盘 - 紧凑优化版
        return currentUser ? <LazyGlobalBIDashboardCompact userRole={currentUser.role} userRegion={currentUser.region} /> : null;
      // 🔥 移除客户健康度监控模块
      // case 'customer-health-monitor': // 🔥 新增：客户健康度监控
      //   return currentUser ? <CustomerHealthMonitor user={currentUser} /> : null;
      // 🔥 已删除：智能流程引擎模块（smart-workflow-engine）
      // case 'smart-workflow-engine': // 🔥 新增：智能流程引擎
      //   return currentUser ? <SmartWorkflowEngine user={currentUser} /> : null;
      // 🔥 移除：业务流程编辑器 Pro（已废弃 - 不参与实际业务流程执行）
      // case 'workflow-editor': // 🔥 新增：业务流程编辑器Pro V2版（支持V1/V2切换）
      //   return <WorkflowEditorProV2 />;
      case 'workflow-validation': // 🔥 新增：工作流验证中心 - ⚠️ 组件文件存在，已启用
        return <div className="p-8 text-center text-gray-500">工作流验证中心组件暂不可用</div>;
      case 'form-manager': // 🔥 新增：表单管理中心（统一三大工具）
        return <FormManagementHub />;
      case 'form-library-management-pro': // 🔥 新增：表单库管理中心Pro - 已禁用（文件不存在）
        return <div className="p-8 text-center text-gray-500">表单库管理中心Pro组件暂不可用</div>;
      case 'ultimate-form-designer': // 🔥 新增：终极表单DIY工作台
        return <UltimateFormDesigner />;
      case 'status-flow-simulator': // 🔥 新增：状态流转模拟器 - ⚠️ 组件文件不存在，已禁用
        return <div className="p-8 text-center text-gray-500">状态流转模拟器组件暂不可用</div>;
      case 'product-management':
        return <LazyProductManagement />;
      case 'market-category-research':
        return <LazyMarketCategoryResearch />;
      case 'product-push':
        return <LazyProductPush />;
      case 'messaging':
        return <LazyAdminMessaging />;
      case 'mail-workbench':
        return <LazyMailWorkbench />;
      case 'social-media-marketing':
        return currentUser ? <LazySocialMediaMarketingUnified user={currentUser} /> : null;
      case 'documentation-center':
        return <LazyInvoiceManagement />;
      case 'shipping-document-management':
        return <LazyShippingDocumentManagement />;
      // ❌ 已删除：ShipmentManagementCenterV2 - 组件不存在
      // { 
      //   id: 'shipment-management-center-v2', 
      //   label: '发货管理中心 V2', 
      //   enLabel: 'Shipment Center V2', 
      //   icon: Sparkles, 
      //   badge: '双模式' as any,
      //   requiredPermission: 'access:shipping' as Permission
      // },
      case 'document-test': // 📄 文档中心
        return <LazyDocumentTestPage />;
      case 'template-workbench': // 🔥 模板中心工作台
        return <LazyAdminDocumentCenter userRole="admin" />;
      case 'documentation-workbench-ultimate': // 🔥 新增：单证管理系统 Ultimate 终极版
        return <LazyDocumentationWorkbenchUltimate />;
      // 🔥 已删除：OrderFlowCenter - 业务流程中心模块
      // case 'order-flow-center':
      //   return <OrderFlowCenter />;
      case 'finance-management':
        return <LazyFinanceManagement />;
      case 'finance-v2-workbench':
        return <LazyZhaoMinFinanceWorkbench onNavigateTo={(target) => setActiveTab(target as any)} />;
      case 'finance-v2-todo-center':
        return <LazyZhaoMinFinanceTodoCenter />;
      case 'finance-v2-management-center':
        return <LazyZhaoMinFinanceManagementCenter />;
      case 'expense-management-center':
        return <LazyExpenseManagementStandalone />;
      case 'management-finance-center':
        return <LazyManagementFinanceCenter />;
      case 'permission-center':
        return <LazyPermissionCenterV1 />;
      case 'role-permission': // 🔥 新增：角色权限管理中心 Pro Max版
        return <LazyRolePermissionCenterProMax />;
      case 'menu-permission-matrix': // 🔥 新增：菜单权限配置矩阵
        return <LazyMenuPermissionMatrix />;
      case 'document-numbering-center':
        return <LazyDocumentNumberingCenter />;
      case 'enterprise-backup-center':
        return <LazyRealEnterpriseBackupCenter />;
      case 'supabase-diagnostic':
        return <LazySupabaseDiagnosticPanel />;
      case 'supplier-management':
        return <LazySupplierManagement />;
      case 'purchase-order-management':
        return <LazyPurchaseOrderManagement />;
      case 'accounts-payable-management':
        return <LazyAccountsPayableManagement />;
      case 'service-provider-management':
        return <LazyServiceProviderManagement />;
      case 'inspection-management': // 🔥 新增：验货管理系统
        return <LazyInspectionManagement />;
      case 'order-management-center':
        return <LazyOrderManagementCenterPro currentUser={currentUser} />;
      case 'full-process-demo': // 🔥 新增：全流程演示
        return <div className="p-8 text-center text-gray-500">全流程演示组件暂不可用</div>;
      case 'full-process-demo-v5': // [SANDBOX] 全流程演示沙盘 V5 — Mock Only, not connected to real ERP data
        return <LazyFullProcessSandboxV5 />;
      case 'lead-conversion': // 🔥 新增：潜在客户转化工作台 - 已禁用（文件不存在）
        return <div className="p-8 text-center text-gray-500">潜客转化工作台组件暂不可用</div>;
      case 'ai-content-studio': // 🔥 新：AI内容生成工作台
        return <AIContentStudioPro />;
      // 🔥🔥🔥 新增6个增强模块（不覆盖原有模块）🔥🔥🔥
      case 'multi-language-currency': // 多语言/多货币管理中心
        return <MultiLanguageCurrencyCenter />;

      // 🔥 移除"销售预测与目标"模块（已废弃）
      case 'sales-forecasting-targets-pro-max': // 销售预测与目标管理 Pro Max（可编辑版）
        return <LazySalesForecastingTargetsProMaxEditable />;
      case 'sales-data-management': // 销售数据管理与计算中心
        return <SalesDataManagementCenter />;
      case 'sales-todo-center': // 🔥 业务员待办中心
        if (currentUser?.role === 'Sales_Rep') {
          return <LazySalesTodoCenter />;
        }
        return <LazySalesManagerTodoCenter currentUser={currentUser} onNavigateToModule={setActiveTab} />;
      case 'admin-company-profile':
        return <LazyAdminOrganizationProfile onBack={goBack} />;
      case 'admin-user-profile':
        return <AdminUserProfile onBack={goBack} />;
      default:
        return <LazyAdminOverview onNavigateToAPIDemo={() => setActiveTab('social-media-marketing')} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* 左侧固定侧边栏 - 台湾大厂风格 */}
      <aside 
        className="bg-slate-800 text-white flex flex-col transition-all duration-300 relative"
        style={{ 
          width: sidebarCollapsed ? '64px' : `${sidebarWidth}px` 
        }}
      >
        {/* Logo区域 - 点击进入企业主数据中心 */}
        <button
          onClick={() => navigateTo('admin-company-profile')}
          className="h-16 flex items-center justify-center border-b border-slate-700 px-3 w-full hover:bg-slate-700/50 transition-colors group"
          title="企业主数据中心"
        >
          {!sidebarCollapsed ? (
            <div className="flex items-center gap-2 w-full">
              {adminOrg.logoUrl ? (
                <img
                  src={adminOrg.logoUrl}
                  alt="Company Logo"
                  className="w-9 h-9 rounded object-contain bg-white/10 flex-shrink-0"
                />
              ) : (
                <div className="w-9 h-9 bg-gradient-to-br from-red-500 to-red-700 rounded flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
              )}
              <div className="flex-1 min-w-0 text-left">
                <p className="text-white truncate group-hover:text-red-300 transition-colors" style={{ fontSize: '13px', fontWeight: 600 }}>
                  {adminOrg.nameCN || '高盛达富'}
                </p>
                <p className="text-slate-400 truncate" style={{ fontSize: '10px' }}>Admin Portal</p>
              </div>
            </div>
          ) : (
            adminOrg.logoUrl ? (
              <img
                src={adminOrg.logoUrl}
                alt="Company Logo"
                className="w-9 h-9 rounded object-contain bg-white/10"
              />
            ) : (
              <div className="w-9 h-9 bg-gradient-to-br from-red-500 to-red-700 rounded flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
            )
          )}
        </button>

        {/* 导航菜单 */}
        <nav className="flex-1 overflow-y-auto py-4 px-2">
          <ul className="space-y-1">
            {displayMenuItems
              .map((item, index) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const isDragging = draggedItem === item.id;
              const isDragOver = dragOverItem === item.id;
              
              return (
                <li key={item.id}>
                  <div
                    className={`
                      relative group
                      ${isDragging ? 'opacity-50' : ''}
                      ${isDragOver ? 'border-t-2 border-red-400' : ''}
                    `}
                    draggable={!sidebarCollapsed}
                    onDragStart={() => handleDragStart(item.id)}
                    onDragEnter={() => handleDragEnter(item.id)}
                    onDragEnd={handleDragEnd}
                    onDragOver={handleDragOver}
                  >
                    <button
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded transition-colors relative ${
                        isActive 
                          ? 'bg-red-600 text-white shadow-md' 
                          : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                      }`}
                      title={sidebarCollapsed ? item.label : ''}
                    >
                      {!sidebarCollapsed && (
                        <GripVertical 
                          className={`flex-shrink-0 w-4 h-4 cursor-grab active:cursor-grabbing ${
                            isActive ? 'text-white/70' : 'text-slate-500'
                          }`} 
                        />
                      )}
                      <Icon className={`flex-shrink-0 ${sidebarCollapsed ? 'w-5 h-5' : 'w-4 h-4'}`} />
                      {!sidebarCollapsed && (
                        <>
                          <div className="flex-1 text-left min-w-0">
                            <div className="flex items-center gap-2 min-w-0">
                              <p className="truncate" style={{ fontSize: '13px', fontWeight: 500 }}>{item.label}</p>
                              {item.badge ? (
                                <Badge variant="destructive" className="h-5 min-w-5 px-1.5 text-xs shrink-0">
                                  {item.badge}
                                </Badge>
                              ) : null}
                            </div>
                            {item.enLabel ? (
                              <p className="text-xs opacity-75 truncate">{item.enLabel}</p>
                            ) : null}
                          </div>
                        </>
                      )}
                      {sidebarCollapsed && item.badge && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-white" style={{ fontSize: '10px' }}>
                          {item.badge}
                        </div>
                      )}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* 底部折叠按钮 */}
        <div className="h-14 border-t border-slate-700 flex items-center justify-center">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-8 h-8 flex items-center justify-center rounded hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* 🔥 拖动条 - 用于调整侧边栏宽度 */}
        {!sidebarCollapsed && (
          <div
            className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:w-1.5 transition-all ${ 
              isResizing ? 'bg-red-500 w-1.5' : 'bg-slate-700 hover:bg-red-400'
            }`}
            onMouseDown={() => setIsResizing(true)}
            title="拖动调整侧边栏宽度"
          />
        )}
      </aside>

      {/* 右侧主要内容区 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 顶部导航栏 - 简洁扁平风格 */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0">
          {/* 左侧：COSUN使命 Slogan */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5 bg-gradient-to-r from-emerald-50 to-teal-50 px-3 py-1.5 rounded-lg border border-emerald-200">
              <div className="flex-shrink-0 w-7 h-7 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-full flex items-center justify-center shadow-sm">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <p className="text-emerald-900" style={{ fontSize: '13px', fontWeight: 600, lineHeight: '1.2' }}>
                  助力客户与供应商共同成长 🌱
                </p>
                <p className="text-emerald-700" style={{ fontSize: '11px', lineHeight: '1.2' }}>
                  我们的使命：三方成长 · 生态共赢
                </p>
              </div>
            </div>
          </div>

          {/* 右：操作按钮 */}
          <div className="flex items-center gap-3">
            {/* 🔥 用户角色切换器 */}
            {canUseRoleSwitcherForUser(currentUser?.email) && <UserRoleSwitcher />}

            {/* 用户头像 + 下拉菜单 */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(v => !v)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                title="个人菜单"
              >
                <AdminUserAvatar
                  avatarUrl={adminUserProfile.avatarUrl}
                  name={currentUser?.name || adminUserProfile.name}
                  size={32}
                />
                <div className="hidden sm:block text-left">
                  <p className="text-[13px] font-medium text-slate-800 leading-tight">
                    {currentUser?.name || adminUserProfile.name || '管理员'}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {currentUser?.role || adminUserProfile.role || 'Admin'}
                  </p>
                </div>
                <Edit className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {userMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setUserMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-slate-200 rounded-lg shadow-lg z-50 overflow-hidden">
                    <div className="px-3 py-2.5 border-b border-slate-100">
                      <p className="text-[12px] font-semibold text-slate-700 truncate">
                        {currentUser?.name || adminUserProfile.name}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">
                        {currentUser?.email || ''}
                      </p>
                    </div>
                    <button
                      onClick={() => navigateTo('admin-user-profile')}
                      className="w-full text-left px-3 py-2.5 text-[13px] text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                    >
                      <Edit className="w-3.5 h-3.5 text-slate-400" />
                      个人资料
                    </button>
                    <button
                      onClick={() => navigateTo('admin-company-profile')}
                      className="w-full text-left px-3 py-2.5 text-[13px] text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                    >
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      企业主数据中心
                    </button>
                    <div className="border-t border-slate-100" />
                    <button
                      onClick={() => { setUserMenuOpen(false); onLogout(); }}
                      className="w-full text-left px-3 py-2.5 text-[13px] text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      退出登录
                    </button>
                  </div>
                </>
              )}
            </div>

            <Button 
              variant="outline" 
              size="sm"
              onClick={onLogout}
              className="gap-2 h-9"
              style={{ fontSize: '13px' }}
            >
              <LogOut className="w-4 h-4" />
              登出
            </Button>
          </div>
        </header>

        {/* 主内容区 - 可滚动 */}
        <main
          translate="no"
          className={`flex-1 min-h-0 overflow-x-hidden bg-gray-50 ${
            activeTab === 'template-workbench' || activeTab === 'permission-center' || activeTab === 'purchase-order-management' || activeTab === 'product-management' || activeTab === 'market-category-research' ? 'overflow-hidden' : 'overflow-y-auto'
          } notranslate`}
          style={{ maxWidth: '100%', width: '100%' }}
        >
          <div
            className={activeTab === 'template-workbench' || activeTab === 'permission-center' || activeTab === 'order-management-center' || activeTab === 'purchase-order-management' || activeTab === 'product-management' || activeTab === 'market-category-research' ? 'flex h-full min-h-0 flex-col p-6' : 'p-6'}
            style={{ maxWidth: '100%', width: '100%', boxSizing: 'border-box' }}
          >
            <Suspense fallback={<AdminDashboardContentFallback />}>
              {renderContent()}
            </Suspense>
          </div>
        </main>
      </div>
      
      {/* 🔧 Admin浮动工具栏（仅Admin角色可见） */}
      {/* <AdminFloatingToolbar 
        onNavigateToWorkflowEditor={() => setActiveTab('workflow-editor')}
        onNavigateToFormManager={() => setActiveTab('form-manager')}
        onNavigateToStatusSimulator={() => setActiveTab('status-flow-simulator')}
      /> */}
    </div>
  );
}
