import React, { useState, useEffect } from 'react';
// 🔥 Import all required icons including Sparkles for Pro features
import { LayoutDashboard, Users, Package, BarChart3, Bell, Mail, LogOut, ChevronLeft, ChevronRight, Building2, Box, Share2, GripVertical, Ship, Activity, Wallet, Factory, Truck, ChevronDown, ChevronUp, Database, Shield, Target, Radio, HeartPulse, Workflow, FileText, Globe, Navigation, DollarSign, TrendingUp, Settings, Terminal, GitBranch, Sparkles, Wand2, UserCheck, Waves, UserPlus, Megaphone, ClipboardCheck, Edit } from 'lucide-react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import AdminOverview from './admin/AdminOverview';
import CustomerManagementEnhanced from './admin/CustomerManagementEnhanced';
import AdminDataAnalyticsNew from './admin/AdminDataAnalyticsNew'; // 🔥 使用新的角色专属数据分析
import ProductPush from './admin/ProductPush';
import AdminMessaging from './admin/AdminMessaging';
import ProductManagement from './admin/ProductManagement';
import SocialMediaMarketing from './admin/SocialMediaMarketing';
import { SocialMediaAISystem } from './dashboards/SocialMediaAISystem'; // 🔥 AI驱动的社媒客户开发系统
import { SocialMediaMarketingUnified } from './dashboards/SocialMediaMarketingUnified'; // 🔥 社交媒体营销 - 终极统一版
import { LiveStreamManagement } from './dashboards/LiveStreamManagement'; // 🔥 直播管理系统
import { AIContentStudioPro } from './ai-content/AIContentStudioPro'; // 🔥 AI内容生成工作台 Pro版
import GlobalBIDashboardCompact from './admin/GlobalBIDashboardCompact'; // 🔥 全局BI决策仪表盘 - 紧凑优化版
import CustomerHealthMonitor from './admin/CustomerHealthMonitor'; // 🔥 客户健康度监控系统
// 🔥 已删除：SmartWorkflowEngine - 智能流程引擎模块
import SupplierCollaborationWorkbench from './admin/SupplierCollaborationWorkbench'; // 🔥 供应商协同工作台
import MultiLanguageCurrencyCenter from './admin/MultiLanguageCurrencyCenter'; // 🔥 多语言/多货币管理中心
// 🔥 移除销售预测与目标模块（已废弃）
import SalesForecastingTargetsProMax from './admin/SalesForecastingTargetsProMax'; // 🔥 销售预测与目标管理 Pro Max
import SalesForecastingTargetsProMaxEditable from './admin/SalesForecastingTargetsProMaxEditable'; // 🔥 销售预测与目标管理 Pro Max（可编辑版）
import SalesDataManagementCenter from './admin/SalesDataManagementCenter'; // 🔥 销售数据管理与计算中心
// 🔥 移除：业务流程编辑器Pro V2版
// import { WorkflowEditorProV2 } from './workflow/WorkflowEditorProV2'; // 🔥 业务流程编辑Pro V2版
import FormManagementHub from './workflow/FormManagementHub'; // 🔥 表单管理中心（统一三大工具）
// ❌ 已禁用：文件不存在
// import { FormLibraryManagementPro } from './workflow/FormLibraryManagementPro'; // 🔥 表单库管理中心Pro
import { UltimateFormDesigner } from './workflow/UltimateFormDesigner'; // 🔥 终极表单DIY工作台
// import CustomerRelationshipManager from './crm/CustomerRelationshipManager'; // 🔥 客户关系管理（CRM）
import CustomerRelationshipManagerPro from './crm/CustomerRelationshipManagerPro'; // 🔥 客户关系管理（CRM Pro - 社媒打通）
// import { AdminFloatingToolbar } from './AdminFloatingToolbar'; // 🔧 Admin浮动工具栏 - 已禁用
import { useAuth } from '../hooks/useAuth'; // 🔥 导入认证钩子
import { hasPermission, type Permission } from '../lib/rbac-config'; // 🔥 导入权限检查函数
import FinanceDashboard from './dashboards/FinanceDashboardPro'; // 🔥 财务专员作台（Pro版 - 大厂级专业财务看板）
import ProcurementDashboard from './dashboards/ProcurementDashboard'; // 🔥 采购专员工作台
import MarketingOpsDashboard from './dashboards/MarketingOpsDashboard'; // 🔥 运营专员工作台
import MenuPermissionMatrix from './admin/MenuPermissionMatrix'; // 🔥 菜单权限配置矩阵
import PublicPoolManagementPro from './admin/PublicPoolManagementPro'; //  公海客户池管理（Pro增版）
import CustomerIntakeSystem from './admin/CustomerIntakeSystem'; // 🔥 客户录入与评估系统
import InspectionManagement from './admin/InspectionManagementComplete'; // 🔥 验货管理系统（完全版 - 全功能实现：报告编辑器/模板编辑器/数据导出）
import UserRoleSwitcher from './admin/UserRoleSwitcher'; // 🔥 用户角色切换器
import { CEOWorkbench } from './admin/workbenches/CEOWorkbench'; // 🔥 CEO工作台
import { CFODashboardCompactWithHelp } from './dashboards/CFODashboardCompactWithHelp'; // 🔥 CFO工作台紧凑版
import { SalesDirectorDashboard } from './dashboards/SalesDirectorDashboard'; // 🔥 销售总监工作台
import { RegionalManagerDashboard } from './dashboards/RegionalManagerDashboard'; // 🔥 区域主管工作台
import { SalesRepDashboardExpert } from './dashboards/SalesRepDashboardExpert'; // 🔥 业务员工作台专家版
import { AdminSystemDashboardPro } from './dashboards/AdminSystemDashboardPro'; // 🔥 系统管理员工作台Pro
import ShippingDocumentManagement from './admin/ShippingDocumentManagement'; // 🔥 发货管理
// ❌ 已删除：ShipmentManagementCenterV2 - 组件不存在
// 🔥 已删除：OrderFlowCenter - 业务流程中心模块
import FinanceManagement from './admin/FinanceManagement'; // 🔥 财务管理
import RolePermissionCenterProMax from './admin/RolePermissionCenterProMax'; // 🔥 角色权限管理Pro Max
import RealEnterpriseBackupCenter from './admin/RealEnterpriseBackupCenter'; // 🔥 企业级备份中心
import SupabaseDiagnosticPanel from './admin/SupabaseDiagnosticPanel'; // 🔥 Supabase诊断面板
import SupplierManagement from './admin/SupplierManagement'; // 🔥 供应商管理
import PurchaseOrderManagement from './admin/PurchaseOrderManagementEnhanced'; // 🔥 采购订单管理（Enhanced版 - 台湾大厂风格）
import AccountsPayableManagement from './admin/AccountsPayableManagement'; // 🔥 应付账款管理（供应商付款）
import ServiceProviderManagement from './admin/ServiceProviderManagement'; // 🔥 服务商管理
import OrderManagementCenterPro from './admin/OrderManagementCenterPro'; // 🔥 订单管理中心 Pro版（含订单全盘）
// ❌ 已禁用：文件不存在
// import LeadConversionWorkbench from './admin/LeadConversionWorkbench'; // 🔥 潜客转化工作台
// ❌ 已禁用：文件不存在
// import FullProcessDemo from './admin/FullProcessDemo'; // 🔥 全流程演示
import FullProcessDemoV5 from './demo/FullProcessDemoV5'; // 🔥 全流程演示 V5（专业紧凑型）
import { DocumentTestPage } from './documents/DocumentTestPage'; // 📄 文档测试页面
import { DocumentationOfficerWorkbench } from './admin/workbenches/DocumentationOfficerWorkbench'; // 🔥 单证员工作台
import { DocumentationOfficerWorkbenchPro } from './admin/workbenches/DocumentationOfficerWorkbenchPro'; // 🔥 单证员工作台 Pro版
import { DocumentationWorkbenchUltimate } from './admin/workbenches/DocumentationWorkbenchUltimate'; // 🔥 单证管理系统 Ultimate 终极版
import { DataCleanupTool } from './admin/DataCleanupTool'; // 🔥 数据清理工具
import { BusinessProcessCenter } from './salesperson/BusinessProcessCenter'; // 🔥 业务流程中心（业务员端）

interface AdminDashboardProps {
  onLogout: () => void | Promise<void>;
}

export default function AdminDashboard({ onLogout }: AdminDashboardProps) {
  // 🔥 获取当前登录用户
  const { currentUser } = useAuth();
  
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
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const savedWidth = localStorage.getItem('sidebarWidth');
    return savedWidth ? parseInt(savedWidth) : 224; // 默认 w-56 = 224px
  });
  const [isResizing, setIsResizing] = useState(false);
  
  // 🔥 新增：供应链管理分组折叠状态
  const [supplyChainCollapsed, setSupplyChainCollapsed] = useState(() => {
    const saved = localStorage.getItem('supplyChainMenuCollapsed');
    return saved ? JSON.parse(saved) : false;
  });

  // 保存供应链分组折叠状态
  useEffect(() => {
    localStorage.setItem('supplyChainMenuCollapsed', JSON.stringify(supplyChainCollapsed));
  }, [supplyChainCollapsed]);

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

  // 🔥 监听角色切换事件，自动跳转到该角色的默认工作台
  useEffect(() => {
    const handleRoleChange = (event: CustomEvent) => {
      console.log('🔄 [AdminDashboard] 检测到角色切换:', event.detail);
      // 重置为工作台（overview）
      setActiveTab('overview');
      // 清除之前保存的Tab
      localStorage.setItem('adminDashboardActiveTab', 'overview');
    };

    window.addEventListener('userChanged', handleRoleChange as EventListener);
    return () => {
      window.removeEventListener('userChanged', handleRoleChange as EventListener);
    };
  }, []);

  // 🚀 监听导航事件（用于从SocialMediaAISystem导航到AIContentStudio）
  useEffect(() => {
    const handleNavigate = (event: CustomEvent) => {
      const { page } = event.detail;
      console.log('🎯 接收到导航事件:', page);
      if (page === 'ai-content-studio') {
        setActiveTab('ai-content-studio');
      }
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
      'finance-management',
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
      label: '客户关系管理（CRM）', 
      enLabel: 'CRM System', 
      icon: UserCheck, 
      badge: 'CRM' as any,
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
      badge: 28,
      requiredPermission: 'access:order_management' as Permission
    },
    { 
      id: 'business-process-center', 
      label: '业务流程中心', 
      enLabel: 'Business Process Center', 
      icon: Workflow, 
      badge: 'NEW' as any,
      requiredPermission: 'access:inquiry_management' as Permission // 🔥 业务员、区域主管权限
    },
    { 
      id: 'full-process-demo', 
      label: '🎬 全流程演示', 
      enLabel: 'Full Process Demo', 
      icon: Workflow, 
      badge: 'DEMO' as any,
      requiredPermission: 'access:dashboard' as Permission
    },
    { 
      id: 'full-process-demo-v5', 
      label: '🎬 全流程演示 V5（专业紧凑型）', 
      enLabel: 'Full Process Demo V5', 
      icon: Sparkles, 
      badge: '紧凑型' as any,
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
    // 🔥 删除：文档编辑器模块
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
        // 🔥🔥🔥 角色模块访问控制矩阵 🔥🔥🔥
        
        // 📋 单证员 (Documentation_Officer) - 只能访问单证相关模块
        if (currentUser.role === 'Documentation_Officer') {
          const allowedModules = [
            'overview',                         // ✅ 工作台（单证管理系统）
            'documentation-workbench-ultimate', // ✅ 单证管理
            'document-test',                    // ✅ 文档中心
            'messaging',                        // ✅ 消息中心
          ];
          return allowedModules.includes(item.id);
        }
        
        // 🎯 运营专员 (Marketing_Ops) - 产品管理、社媒营销、客户录入
        if (currentUser.role === 'Marketing_Ops') {
          const allowedModules = [
            'overview',                  // ✅ 工作台
            'crm',                       // ✅ CRM（客户录入）
            'product-management',        // ✅ 产品管理
            'product-push',              // ✅ 产品推送
            'social-media-marketing',    // ✅ 社交媒体营销（含客户录入）
            'messaging',                 // ✅ 消息中心
          ];
          return allowedModules.includes(item.id);
        }
        
        // 💰 财务专员 (Finance) - 订单财务、财务管理
        if (currentUser.role === 'Finance') {
          const allowedModules = [
            'overview',              // ✅ 工作台
            'order-management-center', // ✅ 订单管理中心（财务视角）
            'finance-management',    // ✅ 财务管理
            'messaging',             // ✅ 消息中心
          ];
          return allowedModules.includes(item.id);
        }
        
        // 🏭 采购专员 (Procurement) - 供应商、采购、验货
        if (currentUser.role === 'Procurement') {
          const allowedModules = [
            'overview',                      // ✅ 工作台
            'supplier-management',           // ✅ 供应商管理
            'service-provider-management',   // ✅ 服务商管理
            'inspection-management',         // ✅ 验货管理
            'messaging',                     // ✅ 消息中心
          ];
          return allowedModules.includes(item.id);
        }
        
        // 👨‍💼 业务员 (Sales_Rep) - 一线销售人员
        if (currentUser.role === 'Sales_Rep') {
          const allowedModules = [
            'overview',                         // ✅ 工作台
            'crm',                              // ✅ CRM
            'order-management-center',          // ✅ 订单管理中心
            'shipping-document-management',     // ✅ 发货管理
            'messaging',                        // ✅ 消息中心
            // ❌ 禁止：采购订单管理、供应商管理、财务管理、系统设置
          ];
          return allowedModules.includes(item.id);
        }
        
        // 🌍 区域主管 (Sales_Manager + region!='all') - 区域销售管理
        if (currentUser.role === 'Sales_Manager' && currentUser.region !== 'all') {
          const allowedModules = [
            'overview',                         // ✅ 工作台
            'crm',                              // ✅ CRM
            'order-management-center',          // ✅ 订单管理中心
            'shipping-document-management',     // ✅ 发货管理
            'messaging',                        // ✅ 消息中心
            'sales-forecasting-targets-pro-max', // ✅ 销售预测与目标
            'sales-data-management',            // ✅ 销售数据管理
          ];
          return allowedModules.includes(item.id);
        }
        
        // 📊 销售总监 (Sales_Manager + region='all') - 全局销售管理
        if (currentUser.role === 'Sales_Manager' && currentUser.region === 'all') {
          const allowedModules = [
            'overview',                         // ✅ 工作台
            'crm',                              // ✅ CRM
            'order-management-center',          // ✅ 订单管理中心
            'shipping-document-management',     // ✅ 发货管理
            'analytics',                        // ✅ 数据分析
            'global-bi-dashboard',              // ✅ 全局BI仪表盘
            'messaging',                        // ✅ 消息中心
            'sales-forecasting-targets-pro-max', // ✅ 销售预测与目标
            'sales-data-management',            // ✅ 销售数据管理
          ];
          return allowedModules.includes(item.id);
        }
        
        // 💼 CFO (财务总监) - 财务管控
        if (currentUser.role === 'CFO') {
          const allowedModules = [
            'overview',                // ✅ 工作台
            'order-management-center', // ✅ 订单管理中心（财务视角）
            'analytics',               // ✅ 数据分析（CFO财务管控中心）
            'global-bi-dashboard',     // ✅ 全局BI仪表盘
            'finance-management',      // ✅ 财务管理
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
            'finance-management',            // ✅ 财务管理（查看）
            'supplier-management',           // ✅ 供应商管理
            'service-provider-management',   // ✅ 服务商管理
            'messaging',                     // ✅ 消息中心
          ];
          return allowedModules.includes(item.id);
        }
        
        // ⚙️ 系统管理员 (Admin) - 系统配置、流程管理、技术管理
        if (currentUser.role === 'Admin') {
          const allowedModules = [
            'overview',                      // ��� 工作台
            'document-test',                 // ✅ 文档中心（仅Admin）
            'form-manager',                  // ✅ 表单管理中心
            'role-permission',               // ✅ 角色权限管理
            'menu-permission-matrix',        // ✅ 菜单权限配置矩阵
            'enterprise-backup-center',      // ✅ 企业级备份中心
            'supabase-diagnostic',           // ✅ Supabase诊断面板
            'multi-language-currency',       // ✅ 多语言/多货币
            'full-process-demo-v5',          // ✅ 全流程演示 V5（专业紧凑型）
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
  
  // 🔥 检查供应链管理菜单是否可见
  const hasSupplierAccess = currentUser 
    ? hasPermission(currentUser, 'access:supplier_management' as Permission)
    : false;

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
          return <CEOWorkbench user={currentUser} onNavigate={setActiveTab} />;
        }
        // CFO显示财务总监工作台（紧凑版 + 完整帮助提示）
        if (currentUser?.role === 'CFO') {
          return <CFODashboardCompactWithHelp />;
        }
        // 销售总监显示销售管理工作台（Sales_Manager + region='all'）
        if (currentUser?.role === 'Sales_Manager' && currentUser?.region === 'all') {
          return <SalesDirectorDashboard />;
        }
        // 区域主管显示区域管理工作台（Sales_Manager + region!='all'）
        if (currentUser?.role === 'Sales_Manager' && currentUser?.region !== 'all') {
          return <RegionalManagerDashboard user={currentUser} />;
        }
        // 业务员显示业务员工作台（专家版 - 背调系统）
        if (currentUser?.role === 'Sales_Rep') {
          return <SalesRepDashboardExpert user={currentUser} />;
        }
        // 财务专员显示财务专员工作台
        if (currentUser?.role === 'Finance') {
          return <FinanceDashboard user={currentUser} />;
        }
        // 采购专员显示采购专员工作台
        if (currentUser?.role === 'Procurement') {
          return <ProcurementDashboard user={currentUser} />;
        }
        // 运营专员显示运营专员工作台
        if (currentUser?.role === 'Marketing_Ops') {
          return <MarketingOpsDashboard user={currentUser} />;
        }
        // 系统管理员显示系统管理仪表盘
        if (currentUser?.role === 'Admin') {
          return <AdminSystemDashboardPro user={currentUser} onNavigate={setActiveTab} />;
        }
        // 单证员显示单证管理系统
        if (currentUser?.role === 'Documentation_Officer') {
          return <DocumentationWorkbenchUltimate />;
        }
        // 其他角色暂时显示原工作台
        return <AdminOverview onNavigateToAPIDemo={() => setActiveTab('social-media-marketing')} />;
      case 'customers':
        return <CustomerManagementEnhanced />;
      case 'crm': // 🔥 新增：客户关系管理（CRM Pro - 社媒打通 + 公海客户池）
        return <CustomerRelationshipManagerPro />;
      // 🔥 已整合到CRM模块中，不再独立显示
      // case 'public-pool': // 🔥 新增：公海客户池（Pro增强版 - 不同角色看到不同视图）
      //   return currentUser ? <PublicPoolManagementPro userRole={currentUser.role} userRegion={currentUser.region} /> : null;
      // 🔥 已整合到社交媒体营销模块中，不再独立显示
      // case 'customer-intake': // 🔥 新增：客户录入与评估系统（多渠道客户采集、智能评分）
      //   return currentUser ? <CustomerIntakeSystem userRole={currentUser.role} /> : null;
      case 'analytics':
        return <AdminDataAnalyticsNew />; // 🔥 使用新的角色专属数据分析
      case 'global-bi-dashboard': // 🔥 新增：全局BI决策仪表盘 - 紧凑优化版
        return currentUser ? <GlobalBIDashboardCompact userRole={currentUser.role} userRegion={currentUser.region} /> : null;
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
        return <ProductManagement />;
      case 'product-push':
        return <ProductPush />;
      case 'messaging':
        return <AdminMessaging />;
      case 'social-media-marketing':
        return currentUser ? <SocialMediaMarketingUnified user={currentUser} /> : null;
      case 'shipping-document-management':
        return <ShippingDocumentManagement />;
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
        return <DocumentTestPage />;
      case 'documentation-workbench-ultimate': // 🔥 新增：单证管理系统 Ultimate 终极版
        return <DocumentationWorkbenchUltimate />;
      // 🔥 已删除：OrderFlowCenter - 业务流程中心模块
      // case 'order-flow-center':
      //   return <OrderFlowCenter />;
      case 'finance-management':
        return <FinanceManagement />;
      case 'role-permission': // 🔥 新增：角色权限管理中心 Pro Max版
        return <RolePermissionCenterProMax />;
      case 'menu-permission-matrix': // 🔥 新增：菜单权限配置矩阵
        return <MenuPermissionMatrix />;
      case 'enterprise-backup-center':
        return <RealEnterpriseBackupCenter />;
      case 'supabase-diagnostic':
        return <SupabaseDiagnosticPanel />;
      case 'supplier-management':
        return <SupplierManagement />;
      case 'purchase-order-management':
        return <PurchaseOrderManagement />;
      case 'accounts-payable-management':
        return <AccountsPayableManagement />;
      case 'service-provider-management':
        return <ServiceProviderManagement />;
      case 'inspection-management': // 🔥 新增：验货管理系统
        return <InspectionManagement />;
      case 'order-management-center':
        return <OrderManagementCenterPro />;
      case 'full-process-demo': // 🔥 新增：全流程演示
        return <div className="p-8 text-center text-gray-500">全流程演示组件暂不可用</div>;
      case 'full-process-demo-v5': // 🔥 新增：全流程演示 V5（专业紧凑型）
        return <FullProcessDemoV5 />;
      case 'lead-conversion': // 🔥 新增：潜在客户转化工作台 - 已禁用（文件不存在）
        return <div className="p-8 text-center text-gray-500">潜客转化工作台组件暂不可用</div>;
      case 'ai-content-studio': // 🔥 新：AI内容生成工作台
        return <AIContentStudioPro />;
      // 🔥🔥🔥 新增6个增强模块（不覆盖原有模块）🔥🔥🔥
      case 'multi-language-currency': // 多语言/多货币管理中心
        return <MultiLanguageCurrencyCenter />;

      // 🔥 移除"销售预测与目标"模块（已废弃）
      case 'sales-forecasting-targets-pro-max': // 销售预测与目标管理 Pro Max（可编辑版）
        return <SalesForecastingTargetsProMaxEditable />;
      case 'sales-data-management': // 销售数据管理与计算中心
        return <SalesDataManagementCenter />;
      default:
        return <AdminOverview onNavigateToAPIDemo={() => setActiveTab('social-media-marketing')} />;
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
        {/* Logo区域 */}
        <div className="h-16 flex items-center justify-center border-b border-slate-700 px-3">
          {!sidebarCollapsed ? (
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-gradient-to-br from-red-500 to-red-700 rounded flex items-center justify-center flex-shrink-0">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white truncate" style={{ fontSize: '13px', fontWeight: 600 }}>高盛达富</p>
                <p className="text-slate-400 truncate" style={{ fontSize: '10px' }}>Admin Portal</p>
              </div>
            </div>
          ) : (
            <div className="w-9 h-9 bg-gradient-to-br from-red-500 to-red-700 rounded flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
          )}
        </div>

        {/* 导航菜单 */}
        <nav className="flex-1 overflow-y-auto py-4 px-2">
          <ul className="space-y-1">
            {displayMenuItems
              .filter(item => item.id !== 'supplier-management' && item.id !== 'service-provider-management') // 排除供应链项
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
                            <p className="truncate" style={{ fontSize: '13px', fontWeight: 500 }}>{item.label}</p>
                            <p className="text-xs opacity-75 truncate">{item.enLabel}</p>
                          </div>
                          {item.badge && (
                            <Badge variant="destructive" className="h-5 min-w-5 px-1.5 text-xs">
                              {item.badge}
                            </Badge>
                          )}
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
            
            {/* 🔥 新增：供应链管理分组 - 根据权限显示 */}
            {hasSupplierAccess && !sidebarCollapsed && (
              <li className="mt-4">
                <button
                  onClick={() => setSupplyChainCollapsed(!supplyChainCollapsed)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
                >
                  <Package className="w-4 h-4 flex-shrink-0" />
                  <span className="flex-1 text-left truncate" style={{ fontSize: '12px', fontWeight: 600 }}>
                    供应链管理
                  </span>
                  {supplyChainCollapsed ? (
                    <ChevronDown className="w-4 h-4 flex-shrink-0" />
                  ) : (
                    <ChevronUp className="w-4 h-4 flex-shrink-0" />
                  )}
                </button>
                
                {/* 子菜单 */}
                {!supplyChainCollapsed && (
                  <ul className="mt-1 ml-6 space-y-1">
                    {/* 供应商管理 */}
                    <li>
                      <button
                        onClick={() => setActiveTab('supplier-management')}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded transition-colors ${
                          activeTab === 'supplier-management'
                            ? 'bg-red-600 text-white shadow-md'
                            : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                        }`}
                      >
                        <Factory className="w-3.5 h-3.5 flex-shrink-0" />
                        <div className="flex-1 text-left min-w-0">
                          <p className="truncate" style={{ fontSize: '12px', fontWeight: 500 }}>供应商管理</p>
                          <p className="text-xs opacity-75 truncate">Suppliers</p>
                        </div>
                      </button>
                    </li>
                    
                    {/* 服务商管理 */}
                    <li>
                      <button
                        onClick={() => setActiveTab('service-provider-management')}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded transition-colors ${
                          activeTab === 'service-provider-management'
                            ? 'bg-red-600 text-white shadow-md'
                            : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                        }`}
                      >
                        <Truck className="w-3.5 h-3.5 flex-shrink-0" />
                        <div className="flex-1 text-left min-w-0">
                          <p className="truncate" style={{ fontSize: '12px', fontWeight: 500 }}>服务商管理</p>
                          <p className="text-xs opacity-75 truncate">Service Providers</p>
                        </div>
                      </button>
                    </li>
                    
                    {/* 🔥 新增：验货管理 */}
                    <li>
                      <button
                        onClick={() => setActiveTab('inspection-management')}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded transition-colors ${
                          activeTab === 'inspection-management'
                            ? 'bg-red-600 text-white shadow-md'
                            : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                        }`}
                      >
                        <ClipboardCheck className="w-3.5 h-3.5 flex-shrink-0" />
                        <div className="flex-1 text-left min-w-0">
                          <p className="truncate" style={{ fontSize: '12px', fontWeight: 500 }}>验货管理</p>
                          <p className="text-xs opacity-75 truncate">Inspection</p>
                        </div>
                        <Badge variant="destructive" className="h-4 px-1.5 text-xs">12</Badge>
                      </button>
                    </li>
                    
                    {/* 🔥 新增：采购订单管理 */}
                    <li>
                      <button
                        onClick={() => setActiveTab('purchase-order-management')}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded transition-colors ${
                          activeTab === 'purchase-order-management'
                            ? 'bg-red-600 text-white shadow-md'
                            : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                        }`}
                      >
                        <Truck className="w-3.5 h-3.5 flex-shrink-0" />
                        <div className="flex-1 text-left min-w-0">
                          <p className="truncate" style={{ fontSize: '12px', fontWeight: 500 }}>采购订单管理</p>
                          <p className="text-xs opacity-75 truncate">Purchase Orders</p>
                        </div>
                        <Badge variant="destructive" className="h-4 px-1.5 text-xs">5</Badge>
                      </button>
                    </li>
                    
                    {/* 🔥 新增：应付账款管理 */}
                    <li>
                      <button
                        onClick={() => setActiveTab('accounts-payable-management')}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded transition-colors ${
                          activeTab === 'accounts-payable-management'
                            ? 'bg-red-600 text-white shadow-md'
                            : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                        }`}
                      >
                        <Wallet className="w-3.5 h-3.5 flex-shrink-0" />
                        <div className="flex-1 text-left min-w-0">
                          <p className="truncate" style={{ fontSize: '12px', fontWeight: 500 }}>应付账款管理</p>
                          <p className="text-xs opacity-75 truncate">Accounts Payable</p>
                        </div>
                        <Badge variant="destructive" className="h-4 px-1.5 text-xs">3</Badge>
                      </button>
                    </li>
                  </ul>
                )}
              </li>
            )}
            
            {/* 折叠状态下的供应链管理图标 */}
            {hasSupplierAccess && sidebarCollapsed && (
              <>
                <li>
                  <button
                    onClick={() => setActiveTab('supplier-management')}
                    className={`w-full flex items-center justify-center py-2.5 rounded transition-colors relative ${
                      activeTab === 'supplier-management'
                        ? 'bg-red-600 text-white shadow-md'
                        : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                    }`}
                    title="供应商管理"
                  >
                    <Factory className="w-5 h-5" />
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveTab('service-provider-management')}
                    className={`w-full flex items-center justify-center py-2.5 rounded transition-colors relative ${
                      activeTab === 'service-provider-management'
                        ? 'bg-red-600 text-white shadow-md'
                        : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                    }`}
                    title="服务商管理"
                  >
                    <Truck className="w-5 h-5" />
                  </button>
                </li>
              </>
            )}
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
            {/* 🔥 数据清理工具 - 开发和测试用 */}
            <DataCleanupTool />
            
            {/* 🔥 用户角色切换器 */}
            <UserRoleSwitcher />
            
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
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-gray-50" style={{ maxWidth: '100%', width: '100%' }}>
          <div className="p-6" style={{ maxWidth: '100%', width: '100%', boxSizing: 'border-box' }}>
            {renderContent()}
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