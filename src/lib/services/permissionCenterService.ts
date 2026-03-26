import { supabase } from '../supabase';
import type { User } from '../rbac-config';

export type PermissionCenterRoleId =
  | 'CEO'
  | 'CFO'
  | 'Sales_Director'
  | 'Regional_Manager'
  | 'Sales_Rep'
  | 'Sales_Assistant'
  | 'Order_Coordinator'
  | 'Finance'
  | 'External_Accountant'
  | 'Procurement_Manager'
  | 'Procurement'
  | 'Documentation_Officer'
  | 'Marketing_Ops'
  | 'Marketing_Assistant'
  | 'QC'
  | 'Warehouse_Ops'
  | 'HR_Admin'
  | 'Admin_Ops'
  | 'Admin';

export type PermissionModuleId =
  | 'document-test'
  | 'overview'
  | 'messaging'
  | 'people-admin-center'
  | 'admin-ops-center'
  | 'crm'
  | 'public-pool'
  | 'order-management-center'
  | 'business-process-center'
  | 'sales-todo-center'
  | 'shipping-document-management'
  | 'documentation-workbench-ultimate'
  | 'finance-management'
  | 'supplier-management'
  | 'purchase-order-management'
  | 'accounts-payable-management'
  | 'service-provider-management'
  | 'inspection-management'
  | 'product-management'
  | 'product-push'
  | 'social-media-marketing'
  | 'admin-company-profile'
  | 'template-workbench'
  | 'form-manager'
  | 'workflow-validation'
  | 'status-flow-simulator'
  | 'role-permission'
  | 'menu-permission-matrix'
  | 'permission-center'
  | 'enterprise-backup-center'
  | 'supabase-diagnostic'
  | 'multi-language-currency'
  | 'analytics'
  | 'global-bi-dashboard';

export type PermissionActionId =
  | 'view'
  | 'create'
  | 'edit'
  | 'delete'
  | 'approve'
  | 'assign'
  | 'export'
  | 'manage_accounts';

export type PermissionScopeId =
  | 'all'
  | 'region'
  | 'department'
  | 'self'
  | 'assigned';

export interface PermissionRoleDefinition {
  id: PermissionCenterRoleId;
  name: string;
  description: string;
  category: 'management' | 'sales' | 'support' | 'external' | 'operations';
  regionScoped?: boolean;
  colorClass: string;
}

export interface PermissionModuleDefinition {
  id: PermissionModuleId;
  name: string;
  category: string;
  description: string;
}

export type PermissionRoleMatrix = Record<PermissionCenterRoleId, PermissionModuleId[]>;
export type PermissionActionMatrix = Record<
  PermissionCenterRoleId,
  Partial<Record<PermissionModuleId, PermissionActionId[]>>
>;
export type PermissionScopeMatrix = Record<
  PermissionCenterRoleId,
  Partial<Record<PermissionModuleId, PermissionScopeId>>
>;

export interface PermissionUserException {
  id: string;
  accountId: string;
  displayName: string;
  email: string;
  role: string;
  moduleId: PermissionModuleId;
  type: 'grant' | 'revoke';
  actions: PermissionActionId[];
  scope: PermissionScopeId;
  reason: string;
  createdAt: string;
  createdBy: string;
}

export interface PermissionChangeLog {
  id: string;
  type: 'menu_matrix' | 'action_matrix' | 'scope_matrix' | 'user_exception' | 'role_matrix';
  title: string;
  detail: string;
  changedBy: string;
  changedAt: string;
}

export const PERMISSION_CENTER_STORAGE_KEYS = {
  menuMatrix: 'permissionCenter.menuMatrix.v1',
  actionMatrix: 'permissionCenter.actionMatrix.v1',
  scopeMatrix: 'permissionCenter.scopeMatrix.v1',
  userExceptions: 'permissionCenter.userExceptions.v1',
  changeLogs: 'permissionCenter.changeLogs.v1',
  roles: 'permissionCenter.roles.v1',
  legacyMenuMatrix: 'menuPermissionMatrix',
} as const;

const PERMISSION_CENTER_SUPABASE_TABLE = 'permission_center_state';
const PERMISSION_CENTER_SUPABASE_ROW_ID = 'default';

interface PermissionCenterStateSnapshot {
  roles: PermissionRoleDefinition[];
  menuMatrix: PermissionRoleMatrix;
  actionMatrix: PermissionActionMatrix;
  scopeMatrix: PermissionScopeMatrix;
  userExceptions: PermissionUserException[];
  changeLogs: PermissionChangeLog[];
}

interface PermissionCenterStateRow {
  id: string;
  roles: PermissionRoleDefinition[] | null;
  menu_matrix: PermissionRoleMatrix | null;
  action_matrix: PermissionActionMatrix | null;
  scope_matrix: PermissionScopeMatrix | null;
  user_exceptions: PermissionUserException[] | null;
  change_logs: PermissionChangeLog[] | null;
  updated_by?: string | null;
}

export const PERMISSION_CENTER_ROLES: PermissionRoleDefinition[] = [
  { id: 'CEO', name: 'CEO', description: '公司整体经营与战略决策', category: 'management', colorClass: 'bg-violet-50 text-violet-700 border-violet-200' },
  { id: 'CFO', name: 'CFO', description: '财务管控与经营分析', category: 'management', colorClass: 'bg-sky-50 text-sky-700 border-sky-200' },
  { id: 'Sales_Director', name: '销售总监', description: '负责销售线总体策略与团队目标', category: 'sales', colorClass: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { id: 'Regional_Manager', name: '区域主管', description: '负责本区域业务员管理与区域业务推进', category: 'sales', regionScoped: true, colorClass: 'bg-green-50 text-green-700 border-green-200' },
  { id: 'Sales_Rep', name: '业务员', description: '客户开发、报价、合同与客户跟进', category: 'sales', regionScoped: true, colorClass: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  { id: 'Sales_Assistant', name: '业务助理', description: '支持业务资料整理、催办与基础跟进', category: 'sales', regionScoped: true, colorClass: 'bg-blue-50 text-blue-700 border-blue-200' },
  { id: 'Order_Coordinator', name: '跟单员', description: '推动 SC 到交付的跨节点协同', category: 'operations', colorClass: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { id: 'Finance', name: '内部财务', description: '内部收付款、财务单证与财务管理', category: 'support', colorClass: 'bg-amber-50 text-amber-700 border-amber-200' },
  { id: 'External_Accountant', name: '代理记账财务', description: '外部财务，仅处理被授权财税资料', category: 'external', colorClass: 'bg-orange-50 text-orange-700 border-orange-200' },
  { id: 'Procurement_Manager', name: '采购主管', description: '采购方案、定厂与关键采购审核', category: 'support', colorClass: 'bg-rose-50 text-rose-700 border-rose-200' },
  { id: 'Procurement', name: '采购员', description: '询价、比价、供应商与采购执行', category: 'support', colorClass: 'bg-red-50 text-red-700 border-red-200' },
  { id: 'Documentation_Officer', name: '单证员', description: '单证、报关、放单与单证归档', category: 'support', colorClass: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200' },
  { id: 'Marketing_Ops', name: '运营专员', description: '营销、内容、产品推送与线索获取', category: 'support', colorClass: 'bg-pink-50 text-pink-700 border-pink-200' },
  { id: 'Marketing_Assistant', name: '运营助理', description: '协助线索整理、客户录入与营销执行跟进', category: 'support', colorClass: 'bg-rose-50 text-rose-700 border-rose-200' },
  { id: 'QC', name: 'QC', description: '验货、报告与质量节点管理', category: 'operations', colorClass: 'bg-lime-50 text-lime-700 border-lime-200' },
  { id: 'Warehouse_Ops', name: '仓配运营', description: '仓储、装柜、仓配协同与执行回写', category: 'operations', colorClass: 'bg-teal-50 text-teal-700 border-teal-200' },
  { id: 'HR_Admin', name: '人事主管', description: '人事、员工关系与组织管理', category: 'management', colorClass: 'bg-slate-50 text-slate-700 border-slate-200' },
  { id: 'Admin_Ops', name: '行政专员', description: '行政事务、管理费用与日常支持', category: 'operations', colorClass: 'bg-neutral-50 text-neutral-700 border-neutral-200' },
  { id: 'Admin', name: '系统管理员', description: '系统主数据、配置、权限与诊断', category: 'management', colorClass: 'bg-gray-50 text-gray-700 border-gray-200' },
];

export const PERMISSION_CENTER_MODULES: PermissionModuleDefinition[] = [
  { id: 'overview', name: '工作台', category: '核心模块', description: '角色首页与工作台入口' },
  { id: 'messaging', name: '消息中心', category: '核心模块', description: '内部消息与通知' },
  { id: 'people-admin-center', name: '人事中心', category: '核心模块', description: '人事主管的专属工作模板入口' },
  { id: 'admin-ops-center', name: '行政事务中心', category: '核心模块', description: '行政事务、合同与公司主体资料管理入口' },
  { id: 'document-test', name: '文档中心', category: '核心模块', description: '内部文档与模板预览入口' },
  { id: 'crm', name: '客户关系管理（CRM）', category: '业务模块', description: '客户主数据与商机管理' },
  { id: 'public-pool', name: '公海客户池', category: '业务模块', description: '线索与公海客户池' },
  { id: 'order-management-center', name: '订单管理中心', category: '业务模块', description: '订单、询价、报价、合同主入口' },
  { id: 'business-process-center', name: '业务流程中心', category: '业务模块', description: '业务主流程协同' },
  { id: 'sales-todo-center', name: '待办中心', category: '业务模块', description: '执行处理型待办入口' },
  { id: 'shipping-document-management', name: '发货管理', category: '履约模块', description: '出运、发货与履约协同' },
  { id: 'documentation-workbench-ultimate', name: '单证管理', category: '履约模块', description: '单证、报关与放单' },
  { id: 'finance-management', name: '财务管理', category: '财务模块', description: '财务操作与财税资料管理' },
  { id: 'supplier-management', name: '供应商管理', category: '供应链模块', description: '供应商档案与合作管理' },
  { id: 'purchase-order-management', name: '采购订单管理', category: '供应链模块', description: '采购订单与采购执行' },
  { id: 'accounts-payable-management', name: '应付账款管理', category: '供应链模块', description: '供应商付款与应付' },
  { id: 'service-provider-management', name: '服务商管理', category: '供应链模块', description: '仓储、物流、报关等服务商管理' },
  { id: 'inspection-management', name: '验货管理', category: '供应链模块', description: 'QC 与验货管理' },
  { id: 'product-management', name: '产品管理', category: '运营模块', description: '产品档案与库管理' },
  { id: 'product-push', name: '产品推送', category: '运营模块', description: '产品推送与分发' },
  { id: 'social-media-marketing', name: '社交媒体营销', category: '运营模块', description: '内容、线索与社媒运营' },
  { id: 'admin-company-profile', name: '企业主数据中心', category: '系统管理', description: '公司、人、账号与主数据' },
  { id: 'template-workbench', name: '模板中心工作台', category: '系统管理', description: '模板与文档源头管理' },
  { id: 'form-manager', name: '表单管理中心', category: '系统管理', description: '表单与流程结构管理' },
  { id: 'workflow-validation', name: '工作流验证中心', category: '系统管理', description: '流程与规则校验' },
  { id: 'status-flow-simulator', name: '状态流转模拟器', category: '系统管理', description: '状态与流转测试' },
  { id: 'role-permission', name: '角色权限管理', category: '系统管理', description: '旧版角色权限页面' },
  { id: 'menu-permission-matrix', name: '菜单权限配置矩阵', category: '系统管理', description: '旧版菜单矩阵页面' },
  { id: 'permission-center', name: '权限中心', category: '系统管理', description: '新权限中心主入口' },
  { id: 'enterprise-backup-center', name: '企业级备份中心', category: '系统管理', description: '系统备份与恢复' },
  { id: 'supabase-diagnostic', name: 'Supabase 诊断面板', category: '系统管理', description: '后端诊断与排查' },
  { id: 'multi-language-currency', name: '多语言/多货币', category: '系统管理', description: '全局语言与货币设置' },
  { id: 'analytics', name: 'CEO 战略驾驶舱', category: '决策模块', description: '经营分析与决策驾驶舱' },
  { id: 'global-bi-dashboard', name: '全局 BI 仪表盘', category: '决策模块', description: '全局数据分析与展示' },
];

export const PERMISSION_ACTION_OPTIONS: PermissionActionId[] = [
  'view',
  'create',
  'edit',
  'delete',
  'approve',
  'assign',
  'export',
  'manage_accounts',
];

export const PERMISSION_SCOPE_OPTIONS: PermissionScopeId[] = [
  'all',
  'region',
  'department',
  'self',
  'assigned',
];

function actionSet(...actions: PermissionActionId[]): PermissionActionId[] {
  return actions;
}

export const DEFAULT_PERMISSION_MENU_MATRIX: PermissionRoleMatrix = {
  CEO: ['overview', 'messaging', 'crm', 'order-management-center', 'shipping-document-management', 'finance-management', 'analytics', 'global-bi-dashboard'],
  CFO: ['overview', 'messaging', 'order-management-center', 'finance-management', 'global-bi-dashboard'],
  Sales_Director: ['overview', 'messaging', 'crm', 'order-management-center', 'business-process-center', 'sales-todo-center', 'shipping-document-management'],
  Regional_Manager: ['overview', 'messaging', 'crm', 'order-management-center', 'business-process-center', 'sales-todo-center', 'shipping-document-management'],
  Sales_Rep: ['overview', 'messaging', 'crm', 'order-management-center', 'business-process-center', 'sales-todo-center', 'shipping-document-management'],
  Sales_Assistant: ['overview', 'messaging', 'crm', 'order-management-center', 'business-process-center'],
  Order_Coordinator: ['overview', 'messaging', 'order-management-center', 'business-process-center', 'shipping-document-management', 'service-provider-management'],
  Finance: ['overview', 'messaging', 'order-management-center', 'finance-management'],
  External_Accountant: ['overview', 'messaging', 'finance-management'],
  Procurement_Manager: ['overview', 'messaging', 'supplier-management', 'purchase-order-management', 'service-provider-management', 'inspection-management', 'accounts-payable-management'],
  Procurement: ['overview', 'messaging', 'supplier-management', 'purchase-order-management', 'inspection-management'],
  Documentation_Officer: ['overview', 'messaging', 'documentation-workbench-ultimate', 'shipping-document-management', 'service-provider-management'],
  Marketing_Ops: ['overview', 'messaging', 'crm', 'product-management', 'product-push', 'social-media-marketing'],
  Marketing_Assistant: ['overview', 'messaging', 'crm', 'product-management', 'product-push', 'social-media-marketing'],
  QC: ['overview', 'messaging', 'inspection-management', 'supplier-management'],
  Warehouse_Ops: ['overview', 'messaging', 'shipping-document-management', 'service-provider-management'],
  HR_Admin: ['overview', 'messaging', 'people-admin-center'],
  Admin_Ops: ['overview', 'messaging', 'admin-ops-center'],
  Admin: ['overview', 'messaging', 'document-test', 'template-workbench', 'admin-company-profile', 'form-manager', 'workflow-validation', 'status-flow-simulator', 'role-permission', 'menu-permission-matrix', 'permission-center', 'enterprise-backup-center', 'supabase-diagnostic', 'multi-language-currency'],
} as PermissionRoleMatrix;

export const DEFAULT_PERMISSION_ACTION_MATRIX: PermissionActionMatrix = {
  CEO: {
    overview: actionSet('view'),
    messaging: actionSet('view', 'export'),
    crm: actionSet('view', 'approve', 'export'),
    'order-management-center': actionSet('view', 'approve', 'export'),
    'shipping-document-management': actionSet('view', 'export'),
    'finance-management': actionSet('view', 'approve', 'export'),
    analytics: actionSet('view', 'export'),
    'global-bi-dashboard': actionSet('view', 'export'),
  },
  CFO: {
    overview: actionSet('view'),
    messaging: actionSet('view', 'export'),
    'order-management-center': actionSet('view', 'approve', 'export'),
    'finance-management': actionSet('view', 'create', 'edit', 'delete', 'approve', 'export'),
    'global-bi-dashboard': actionSet('view', 'export'),
  },
  Sales_Director: {
    overview: actionSet('view'),
    messaging: actionSet('view', 'create', 'export'),
    crm: actionSet('view', 'create', 'edit', 'delete', 'approve', 'assign', 'export'),
    'order-management-center': actionSet('view', 'create', 'edit', 'delete', 'approve', 'assign', 'export'),
    'business-process-center': actionSet('view', 'create', 'edit', 'approve', 'assign'),
    'sales-todo-center': actionSet('view', 'create', 'edit', 'assign'),
    'shipping-document-management': actionSet('view', 'export'),
  },
  Regional_Manager: {
    overview: actionSet('view'),
    messaging: actionSet('view', 'create'),
    crm: actionSet('view', 'create', 'edit', 'approve', 'assign', 'export'),
    'order-management-center': actionSet('view', 'create', 'edit', 'approve', 'assign', 'export'),
    'business-process-center': actionSet('view', 'create', 'edit', 'approve', 'assign'),
    'sales-todo-center': actionSet('view', 'create', 'edit', 'assign'),
    'shipping-document-management': actionSet('view', 'export'),
  },
  Sales_Rep: {
    overview: actionSet('view'),
    messaging: actionSet('view', 'create'),
    crm: actionSet('view', 'create', 'edit'),
    'order-management-center': actionSet('view', 'create', 'edit'),
    'business-process-center': actionSet('view', 'create', 'edit'),
    'sales-todo-center': actionSet('view', 'create', 'edit'),
    'shipping-document-management': actionSet('view'),
  },
  Sales_Assistant: {
    overview: actionSet('view'),
    messaging: actionSet('view', 'create'),
    crm: actionSet('view', 'create', 'edit'),
    'order-management-center': actionSet('view', 'edit'),
    'business-process-center': actionSet('view', 'edit'),
  },
  Order_Coordinator: {
    overview: actionSet('view'),
    messaging: actionSet('view', 'create'),
    'order-management-center': actionSet('view', 'edit', 'assign'),
    'business-process-center': actionSet('view', 'edit', 'assign'),
    'shipping-document-management': actionSet('view', 'create', 'edit', 'assign'),
    'service-provider-management': actionSet('view', 'edit'),
  },
  Finance: {
    overview: actionSet('view'),
    messaging: actionSet('view', 'create', 'export'),
    'order-management-center': actionSet('view'),
    'finance-management': actionSet('view', 'create', 'edit', 'export'),
  },
  External_Accountant: {
    overview: actionSet('view'),
    messaging: actionSet('view'),
    'finance-management': actionSet('view', 'export'),
  },
  Procurement_Manager: {
    overview: actionSet('view'),
    messaging: actionSet('view', 'create'),
    'supplier-management': actionSet('view', 'create', 'edit', 'delete', 'approve', 'export'),
    'purchase-order-management': actionSet('view', 'create', 'edit', 'delete', 'approve', 'assign', 'export'),
    'service-provider-management': actionSet('view', 'create', 'edit', 'approve', 'export'),
    'inspection-management': actionSet('view', 'approve'),
    'accounts-payable-management': actionSet('view', 'create', 'edit', 'approve', 'export'),
  },
  Procurement: {
    overview: actionSet('view'),
    messaging: actionSet('view', 'create'),
    'supplier-management': actionSet('view', 'create', 'edit'),
    'purchase-order-management': actionSet('view', 'create', 'edit'),
    'inspection-management': actionSet('view', 'create', 'edit'),
  },
  Documentation_Officer: {
    overview: actionSet('view'),
    messaging: actionSet('view', 'create'),
    'documentation-workbench-ultimate': actionSet('view', 'create', 'edit', 'export'),
    'shipping-document-management': actionSet('view', 'create', 'edit', 'export'),
    'service-provider-management': actionSet('view', 'edit'),
  },
  Marketing_Ops: {
    overview: actionSet('view'),
    messaging: actionSet('view', 'create'),
    crm: actionSet('view', 'create', 'edit'),
    'product-management': actionSet('view', 'create', 'edit', 'delete', 'export'),
    'product-push': actionSet('view', 'create', 'edit', 'export'),
    'social-media-marketing': actionSet('view', 'create', 'edit', 'delete', 'export'),
  },
  Marketing_Assistant: {
    overview: actionSet('view'),
    messaging: actionSet('view', 'create'),
    crm: actionSet('view', 'create', 'edit'),
    'product-management': actionSet('view', 'edit'),
    'product-push': actionSet('view', 'create', 'edit'),
    'social-media-marketing': actionSet('view', 'create', 'edit'),
  },
  QC: {
    overview: actionSet('view'),
    messaging: actionSet('view'),
    'inspection-management': actionSet('view', 'create', 'edit', 'approve'),
    'supplier-management': actionSet('view'),
  },
  Warehouse_Ops: {
    overview: actionSet('view'),
    messaging: actionSet('view', 'create'),
    'shipping-document-management': actionSet('view', 'edit'),
    'service-provider-management': actionSet('view', 'create', 'edit'),
  },
  HR_Admin: {
    overview: actionSet('view'),
    messaging: actionSet('view', 'create', 'export'),
    'people-admin-center': actionSet('view', 'create', 'edit', 'delete', 'approve', 'export', 'manage_accounts'),
  },
  Admin_Ops: {
    overview: actionSet('view'),
    messaging: actionSet('view', 'create'),
    'admin-ops-center': actionSet('view', 'create', 'edit', 'delete', 'export'),
  },
  Admin: {
    overview: actionSet('view'),
    messaging: actionSet('view', 'create', 'export'),
    'document-test': actionSet('view', 'create', 'edit', 'delete', 'export'),
    'template-workbench': actionSet('view', 'create', 'edit', 'delete', 'export'),
    'admin-company-profile': actionSet('view', 'create', 'edit', 'delete', 'export', 'manage_accounts'),
    'form-manager': actionSet('view', 'create', 'edit', 'delete', 'export'),
    'workflow-validation': actionSet('view', 'create', 'edit', 'delete', 'export'),
    'status-flow-simulator': actionSet('view', 'create', 'edit', 'delete', 'export'),
    'role-permission': actionSet('view', 'create', 'edit', 'delete', 'export', 'manage_accounts'),
    'menu-permission-matrix': actionSet('view', 'create', 'edit', 'delete', 'export', 'manage_accounts'),
    'permission-center': actionSet('view', 'create', 'edit', 'delete', 'export', 'manage_accounts'),
    'enterprise-backup-center': actionSet('view', 'create', 'edit', 'delete', 'export'),
    'supabase-diagnostic': actionSet('view', 'create', 'edit', 'delete', 'export'),
    'multi-language-currency': actionSet('view', 'create', 'edit', 'delete', 'export'),
  },
} as PermissionActionMatrix;

export const DEFAULT_PERMISSION_SCOPE_MATRIX: PermissionScopeMatrix = {
  CEO: {
    overview: 'all',
    messaging: 'all',
    crm: 'all',
    'order-management-center': 'all',
    'shipping-document-management': 'all',
    'finance-management': 'all',
    analytics: 'all',
    'global-bi-dashboard': 'all',
  },
  CFO: {
    overview: 'all',
    messaging: 'all',
    'order-management-center': 'all',
    'finance-management': 'all',
    'global-bi-dashboard': 'all',
  },
  Sales_Director: {
    overview: 'department',
    messaging: 'department',
    crm: 'department',
    'order-management-center': 'department',
    'business-process-center': 'department',
    'sales-todo-center': 'department',
    'shipping-document-management': 'department',
  },
  Regional_Manager: {
    overview: 'region',
    messaging: 'region',
    crm: 'region',
    'order-management-center': 'region',
    'business-process-center': 'region',
    'sales-todo-center': 'region',
    'shipping-document-management': 'region',
  },
  Sales_Rep: {
    overview: 'assigned',
    messaging: 'self',
    crm: 'assigned',
    'order-management-center': 'assigned',
    'business-process-center': 'assigned',
    'sales-todo-center': 'assigned',
    'shipping-document-management': 'assigned',
  },
  Sales_Assistant: {
    overview: 'assigned',
    messaging: 'self',
    crm: 'assigned',
    'order-management-center': 'assigned',
    'business-process-center': 'assigned',
  },
  Order_Coordinator: {
    overview: 'assigned',
    messaging: 'self',
    'order-management-center': 'assigned',
    'business-process-center': 'assigned',
    'shipping-document-management': 'assigned',
    'service-provider-management': 'assigned',
  },
  Finance: {
    overview: 'assigned',
    messaging: 'department',
    'order-management-center': 'all',
    'finance-management': 'all',
  },
  External_Accountant: {
    overview: 'assigned',
    messaging: 'self',
    'finance-management': 'assigned',
  },
  Procurement_Manager: {
    overview: 'department',
    messaging: 'department',
    'supplier-management': 'department',
    'purchase-order-management': 'department',
    'service-provider-management': 'department',
    'inspection-management': 'department',
    'accounts-payable-management': 'department',
  },
  Procurement: {
    overview: 'assigned',
    messaging: 'self',
    'supplier-management': 'assigned',
    'purchase-order-management': 'assigned',
    'inspection-management': 'assigned',
  },
  Documentation_Officer: {
    overview: 'assigned',
    messaging: 'self',
    'documentation-workbench-ultimate': 'assigned',
    'shipping-document-management': 'assigned',
    'service-provider-management': 'assigned',
  },
  Marketing_Ops: {
    overview: 'assigned',
    messaging: 'assigned',
    crm: 'assigned',
    'product-management': 'assigned',
    'product-push': 'assigned',
    'social-media-marketing': 'assigned',
  },
  Marketing_Assistant: {
    overview: 'assigned',
    messaging: 'self',
    crm: 'assigned',
    'product-management': 'assigned',
    'product-push': 'assigned',
    'social-media-marketing': 'assigned',
  },
  QC: {
    overview: 'assigned',
    messaging: 'self',
    'inspection-management': 'assigned',
    'supplier-management': 'assigned',
  },
  Warehouse_Ops: {
    overview: 'assigned',
    messaging: 'self',
    'shipping-document-management': 'assigned',
    'service-provider-management': 'assigned',
  },
  HR_Admin: {
    overview: 'department',
    messaging: 'department',
    'people-admin-center': 'all',
  },
  Admin_Ops: {
    overview: 'department',
    messaging: 'department',
    'admin-ops-center': 'department',
  },
  Admin: {
    overview: 'all',
    messaging: 'all',
    'document-test': 'all',
    'template-workbench': 'all',
    'admin-company-profile': 'all',
    'form-manager': 'all',
    'workflow-validation': 'all',
    'status-flow-simulator': 'all',
    'role-permission': 'all',
    'menu-permission-matrix': 'all',
    'permission-center': 'all',
    'enterprise-backup-center': 'all',
    'supabase-diagnostic': 'all',
    'multi-language-currency': 'all',
  },
};

DEFAULT_PERMISSION_ACTION_MATRIX.CEO['document-test'] = actionSet('view', 'export');
DEFAULT_PERMISSION_ACTION_MATRIX.CFO['document-test'] = actionSet('view', 'export');
DEFAULT_PERMISSION_ACTION_MATRIX.Sales_Director['document-test'] = actionSet('view', 'export');
DEFAULT_PERMISSION_ACTION_MATRIX.Regional_Manager['document-test'] = actionSet('view', 'export');
DEFAULT_PERMISSION_ACTION_MATRIX.Sales_Rep['document-test'] = actionSet('view', 'export');
DEFAULT_PERMISSION_ACTION_MATRIX.Sales_Assistant['document-test'] = actionSet('view', 'export');
DEFAULT_PERMISSION_ACTION_MATRIX.Order_Coordinator['document-test'] = actionSet('view', 'export');
DEFAULT_PERMISSION_ACTION_MATRIX.Finance['document-test'] = actionSet('view', 'export');
DEFAULT_PERMISSION_ACTION_MATRIX.External_Accountant['document-test'] = actionSet('view', 'export');
DEFAULT_PERMISSION_ACTION_MATRIX.Procurement_Manager['document-test'] = actionSet('view', 'export');
DEFAULT_PERMISSION_ACTION_MATRIX.Procurement['document-test'] = actionSet('view', 'export');
DEFAULT_PERMISSION_ACTION_MATRIX.Documentation_Officer['document-test'] = actionSet('view', 'create', 'edit', 'export');
DEFAULT_PERMISSION_ACTION_MATRIX.Marketing_Ops['document-test'] = actionSet('view', 'export');
DEFAULT_PERMISSION_ACTION_MATRIX.Marketing_Assistant['document-test'] = actionSet('view', 'export');
DEFAULT_PERMISSION_ACTION_MATRIX.QC['document-test'] = actionSet('view', 'export');
DEFAULT_PERMISSION_ACTION_MATRIX.Warehouse_Ops['document-test'] = actionSet('view', 'export');
DEFAULT_PERMISSION_ACTION_MATRIX.HR_Admin['document-test'] = actionSet('view', 'export');
DEFAULT_PERMISSION_ACTION_MATRIX.Admin_Ops['document-test'] = actionSet('view', 'edit', 'export');

DEFAULT_PERMISSION_ACTION_MATRIX.HR_Admin['admin-company-profile'] = actionSet('view', 'create', 'edit', 'export', 'manage_accounts');
DEFAULT_PERMISSION_ACTION_MATRIX.Admin_Ops['admin-company-profile'] = actionSet('view', 'edit', 'export');
DEFAULT_PERMISSION_ACTION_MATRIX.CEO['admin-company-profile'] = actionSet('view', 'export');
DEFAULT_PERMISSION_ACTION_MATRIX.CFO['admin-company-profile'] = actionSet('view', 'export');

DEFAULT_PERMISSION_ACTION_MATRIX.CEO['people-admin-center'] = actionSet('view', 'approve', 'export');
DEFAULT_PERMISSION_ACTION_MATRIX.CFO['people-admin-center'] = actionSet('view', 'export');
DEFAULT_PERMISSION_ACTION_MATRIX.Admin['people-admin-center'] = actionSet('view', 'create', 'edit', 'delete', 'export', 'manage_accounts');

DEFAULT_PERMISSION_ACTION_MATRIX.CEO['admin-ops-center'] = actionSet('view', 'approve', 'export');
DEFAULT_PERMISSION_ACTION_MATRIX.CFO['admin-ops-center'] = actionSet('view', 'export');
DEFAULT_PERMISSION_ACTION_MATRIX.HR_Admin['admin-ops-center'] = actionSet('view', 'edit', 'approve', 'export');
DEFAULT_PERMISSION_ACTION_MATRIX.Admin['admin-ops-center'] = actionSet('view', 'edit', 'delete', 'export');

DEFAULT_PERMISSION_ACTION_MATRIX.CEO['supplier-management'] = actionSet('view', 'export');
DEFAULT_PERMISSION_ACTION_MATRIX.CFO['supplier-management'] = actionSet('view', 'export');
DEFAULT_PERMISSION_ACTION_MATRIX.Order_Coordinator['supplier-management'] = actionSet('view');
DEFAULT_PERMISSION_ACTION_MATRIX.Warehouse_Ops['supplier-management'] = actionSet('view');

DEFAULT_PERMISSION_ACTION_MATRIX.CEO['purchase-order-management'] = actionSet('view', 'export');
DEFAULT_PERMISSION_ACTION_MATRIX.CFO['purchase-order-management'] = actionSet('view', 'approve', 'export');
DEFAULT_PERMISSION_ACTION_MATRIX.Order_Coordinator['purchase-order-management'] = actionSet('view');
DEFAULT_PERMISSION_ACTION_MATRIX.Finance['purchase-order-management'] = actionSet('view');
DEFAULT_PERMISSION_ACTION_MATRIX.QC['purchase-order-management'] = actionSet('view');

DEFAULT_PERMISSION_ACTION_MATRIX.CEO['accounts-payable-management'] = actionSet('view', 'approve', 'export');
DEFAULT_PERMISSION_ACTION_MATRIX.CFO['accounts-payable-management'] = actionSet('view', 'create', 'edit', 'delete', 'approve', 'export');
DEFAULT_PERMISSION_ACTION_MATRIX.Finance['accounts-payable-management'] = actionSet('view', 'create', 'edit', 'export');
DEFAULT_PERMISSION_ACTION_MATRIX.External_Accountant['accounts-payable-management'] = actionSet('view', 'export');
DEFAULT_PERMISSION_ACTION_MATRIX.Procurement['accounts-payable-management'] = actionSet('view');

DEFAULT_PERMISSION_ACTION_MATRIX.CEO['service-provider-management'] = actionSet('view', 'export');
DEFAULT_PERMISSION_ACTION_MATRIX.CFO['service-provider-management'] = actionSet('view', 'export');
DEFAULT_PERMISSION_ACTION_MATRIX.Procurement['service-provider-management'] = actionSet('view', 'create', 'edit');
DEFAULT_PERMISSION_ACTION_MATRIX.Documentation_Officer['service-provider-management'] = actionSet('view', 'edit');
DEFAULT_PERMISSION_ACTION_MATRIX.Warehouse_Ops['service-provider-management'] = actionSet('view', 'create', 'edit');

DEFAULT_PERMISSION_ACTION_MATRIX.CEO['inspection-management'] = actionSet('view', 'export');
DEFAULT_PERMISSION_ACTION_MATRIX.Sales_Director['inspection-management'] = actionSet('view', 'export');
DEFAULT_PERMISSION_ACTION_MATRIX.Regional_Manager['inspection-management'] = actionSet('view', 'export');
DEFAULT_PERMISSION_ACTION_MATRIX.Procurement_Manager['inspection-management'] = actionSet('view', 'approve', 'export');
DEFAULT_PERMISSION_ACTION_MATRIX.Order_Coordinator['inspection-management'] = actionSet('view');

DEFAULT_PERMISSION_ACTION_MATRIX.CEO['product-management'] = actionSet('view', 'export');
DEFAULT_PERMISSION_ACTION_MATRIX.Sales_Director['product-management'] = actionSet('view', 'export');
DEFAULT_PERMISSION_ACTION_MATRIX.Admin['product-management'] = actionSet('view', 'edit', 'delete', 'export');

DEFAULT_PERMISSION_ACTION_MATRIX.Sales_Director['product-push'] = actionSet('view', 'export');
DEFAULT_PERMISSION_ACTION_MATRIX.Sales_Rep['product-push'] = actionSet('view');

DEFAULT_PERMISSION_ACTION_MATRIX.CEO['social-media-marketing'] = actionSet('view', 'export');
DEFAULT_PERMISSION_ACTION_MATRIX.Sales_Director['social-media-marketing'] = actionSet('view', 'export');

DEFAULT_PERMISSION_ACTION_MATRIX.CEO['template-workbench'] = actionSet('view', 'export');
DEFAULT_PERMISSION_ACTION_MATRIX.Documentation_Officer['template-workbench'] = actionSet('view', 'create', 'edit', 'export');
DEFAULT_PERMISSION_ACTION_MATRIX.Admin_Ops['template-workbench'] = actionSet('view', 'edit', 'export');

DEFAULT_PERMISSION_ACTION_MATRIX.HR_Admin['form-manager'] = actionSet('view', 'edit');
DEFAULT_PERMISSION_ACTION_MATRIX.Admin_Ops['form-manager'] = actionSet('view', 'edit');
DEFAULT_PERMISSION_ACTION_MATRIX.CEO['workflow-validation'] = actionSet('view');
DEFAULT_PERMISSION_ACTION_MATRIX.CFO['workflow-validation'] = actionSet('view');
DEFAULT_PERMISSION_ACTION_MATRIX.CEO['status-flow-simulator'] = actionSet('view');
DEFAULT_PERMISSION_ACTION_MATRIX.CFO['status-flow-simulator'] = actionSet('view');

DEFAULT_PERMISSION_ACTION_MATRIX.CEO['permission-center'] = actionSet('view', 'export');
DEFAULT_PERMISSION_ACTION_MATRIX.CEO['role-permission'] = actionSet('view', 'export');
DEFAULT_PERMISSION_ACTION_MATRIX.CEO['menu-permission-matrix'] = actionSet('view', 'export');
DEFAULT_PERMISSION_ACTION_MATRIX.HR_Admin['permission-center'] = actionSet('view');

DEFAULT_PERMISSION_ACTION_MATRIX.CEO['enterprise-backup-center'] = actionSet('view', 'export');
DEFAULT_PERMISSION_ACTION_MATRIX.CEO['supabase-diagnostic'] = actionSet('view');
DEFAULT_PERMISSION_ACTION_MATRIX.CEO['multi-language-currency'] = actionSet('view', 'export');
DEFAULT_PERMISSION_ACTION_MATRIX.CFO['multi-language-currency'] = actionSet('view', 'export');

DEFAULT_PERMISSION_SCOPE_MATRIX.CEO['document-test'] = 'all';
DEFAULT_PERMISSION_SCOPE_MATRIX.CFO['document-test'] = 'all';
DEFAULT_PERMISSION_SCOPE_MATRIX.Sales_Director['document-test'] = 'department';
DEFAULT_PERMISSION_SCOPE_MATRIX.Regional_Manager['document-test'] = 'region';
DEFAULT_PERMISSION_SCOPE_MATRIX.Sales_Rep['document-test'] = 'assigned';
DEFAULT_PERMISSION_SCOPE_MATRIX.Sales_Assistant['document-test'] = 'assigned';
DEFAULT_PERMISSION_SCOPE_MATRIX.Order_Coordinator['document-test'] = 'assigned';
DEFAULT_PERMISSION_SCOPE_MATRIX.Finance['document-test'] = 'assigned';
DEFAULT_PERMISSION_SCOPE_MATRIX.External_Accountant['document-test'] = 'assigned';
DEFAULT_PERMISSION_SCOPE_MATRIX.Procurement_Manager['document-test'] = 'department';
DEFAULT_PERMISSION_SCOPE_MATRIX.Procurement['document-test'] = 'assigned';
DEFAULT_PERMISSION_SCOPE_MATRIX.Documentation_Officer['document-test'] = 'assigned';
DEFAULT_PERMISSION_SCOPE_MATRIX.Marketing_Ops['document-test'] = 'assigned';
DEFAULT_PERMISSION_SCOPE_MATRIX.Marketing_Assistant['document-test'] = 'assigned';
DEFAULT_PERMISSION_SCOPE_MATRIX.QC['document-test'] = 'assigned';
DEFAULT_PERMISSION_SCOPE_MATRIX.Warehouse_Ops['document-test'] = 'assigned';
DEFAULT_PERMISSION_SCOPE_MATRIX.HR_Admin['document-test'] = 'department';
DEFAULT_PERMISSION_SCOPE_MATRIX.Admin_Ops['document-test'] = 'department';

DEFAULT_PERMISSION_SCOPE_MATRIX.CEO['admin-company-profile'] = 'all';
DEFAULT_PERMISSION_SCOPE_MATRIX.CFO['admin-company-profile'] = 'all';
DEFAULT_PERMISSION_SCOPE_MATRIX.HR_Admin['admin-company-profile'] = 'all';
DEFAULT_PERMISSION_SCOPE_MATRIX.Admin_Ops['admin-company-profile'] = 'department';

DEFAULT_PERMISSION_SCOPE_MATRIX.CEO['people-admin-center'] = 'all';
DEFAULT_PERMISSION_SCOPE_MATRIX.CFO['people-admin-center'] = 'all';
DEFAULT_PERMISSION_SCOPE_MATRIX.Admin['people-admin-center'] = 'all';

DEFAULT_PERMISSION_SCOPE_MATRIX.CEO['admin-ops-center'] = 'all';
DEFAULT_PERMISSION_SCOPE_MATRIX.CFO['admin-ops-center'] = 'all';
DEFAULT_PERMISSION_SCOPE_MATRIX.HR_Admin['admin-ops-center'] = 'department';
DEFAULT_PERMISSION_SCOPE_MATRIX.Admin['admin-ops-center'] = 'all';

DEFAULT_PERMISSION_SCOPE_MATRIX.CEO['supplier-management'] = 'all';
DEFAULT_PERMISSION_SCOPE_MATRIX.CFO['supplier-management'] = 'all';
DEFAULT_PERMISSION_SCOPE_MATRIX.Order_Coordinator['supplier-management'] = 'assigned';
DEFAULT_PERMISSION_SCOPE_MATRIX.Warehouse_Ops['supplier-management'] = 'assigned';

DEFAULT_PERMISSION_SCOPE_MATRIX.CEO['purchase-order-management'] = 'all';
DEFAULT_PERMISSION_SCOPE_MATRIX.CFO['purchase-order-management'] = 'all';
DEFAULT_PERMISSION_SCOPE_MATRIX.Order_Coordinator['purchase-order-management'] = 'assigned';
DEFAULT_PERMISSION_SCOPE_MATRIX.Finance['purchase-order-management'] = 'assigned';
DEFAULT_PERMISSION_SCOPE_MATRIX.QC['purchase-order-management'] = 'assigned';

DEFAULT_PERMISSION_SCOPE_MATRIX.CEO['accounts-payable-management'] = 'all';
DEFAULT_PERMISSION_SCOPE_MATRIX.CFO['accounts-payable-management'] = 'all';
DEFAULT_PERMISSION_SCOPE_MATRIX.Finance['accounts-payable-management'] = 'all';
DEFAULT_PERMISSION_SCOPE_MATRIX.External_Accountant['accounts-payable-management'] = 'assigned';
DEFAULT_PERMISSION_SCOPE_MATRIX.Procurement['accounts-payable-management'] = 'assigned';

DEFAULT_PERMISSION_SCOPE_MATRIX.CEO['service-provider-management'] = 'all';
DEFAULT_PERMISSION_SCOPE_MATRIX.CFO['service-provider-management'] = 'all';
DEFAULT_PERMISSION_SCOPE_MATRIX.Procurement['service-provider-management'] = 'assigned';

DEFAULT_PERMISSION_SCOPE_MATRIX.CEO['inspection-management'] = 'all';
DEFAULT_PERMISSION_SCOPE_MATRIX.Sales_Director['inspection-management'] = 'department';
DEFAULT_PERMISSION_SCOPE_MATRIX.Regional_Manager['inspection-management'] = 'region';
DEFAULT_PERMISSION_SCOPE_MATRIX.Procurement_Manager['inspection-management'] = 'department';
DEFAULT_PERMISSION_SCOPE_MATRIX.Order_Coordinator['inspection-management'] = 'assigned';

DEFAULT_PERMISSION_SCOPE_MATRIX.CEO['product-management'] = 'all';
DEFAULT_PERMISSION_SCOPE_MATRIX.Sales_Director['product-management'] = 'department';
DEFAULT_PERMISSION_SCOPE_MATRIX.Admin['product-management'] = 'all';

DEFAULT_PERMISSION_SCOPE_MATRIX.Sales_Director['product-push'] = 'department';
DEFAULT_PERMISSION_SCOPE_MATRIX.Sales_Rep['product-push'] = 'assigned';

DEFAULT_PERMISSION_SCOPE_MATRIX.CEO['social-media-marketing'] = 'all';
DEFAULT_PERMISSION_SCOPE_MATRIX.Sales_Director['social-media-marketing'] = 'department';

DEFAULT_PERMISSION_SCOPE_MATRIX.CEO['template-workbench'] = 'all';
DEFAULT_PERMISSION_SCOPE_MATRIX.Documentation_Officer['template-workbench'] = 'assigned';
DEFAULT_PERMISSION_SCOPE_MATRIX.Admin_Ops['template-workbench'] = 'department';

DEFAULT_PERMISSION_SCOPE_MATRIX.HR_Admin['form-manager'] = 'department';
DEFAULT_PERMISSION_SCOPE_MATRIX.Admin_Ops['form-manager'] = 'department';
DEFAULT_PERMISSION_SCOPE_MATRIX.CEO['workflow-validation'] = 'all';
DEFAULT_PERMISSION_SCOPE_MATRIX.CFO['workflow-validation'] = 'all';
DEFAULT_PERMISSION_SCOPE_MATRIX.CEO['status-flow-simulator'] = 'all';
DEFAULT_PERMISSION_SCOPE_MATRIX.CFO['status-flow-simulator'] = 'all';

DEFAULT_PERMISSION_SCOPE_MATRIX.CEO['permission-center'] = 'all';
DEFAULT_PERMISSION_SCOPE_MATRIX.CEO['role-permission'] = 'all';
DEFAULT_PERMISSION_SCOPE_MATRIX.CEO['menu-permission-matrix'] = 'all';
DEFAULT_PERMISSION_SCOPE_MATRIX.HR_Admin['permission-center'] = 'all';

DEFAULT_PERMISSION_SCOPE_MATRIX.CEO['enterprise-backup-center'] = 'all';
DEFAULT_PERMISSION_SCOPE_MATRIX.CEO['supabase-diagnostic'] = 'all';
DEFAULT_PERMISSION_SCOPE_MATRIX.CEO['multi-language-currency'] = 'all';
DEFAULT_PERMISSION_SCOPE_MATRIX.CFO['multi-language-currency'] = 'all';

function mergeActionMatrix(saved: PermissionActionMatrix): PermissionActionMatrix {
  const merged = {} as PermissionActionMatrix;

  for (const role of PERMISSION_CENTER_ROLES) {
    merged[role.id] = {
      ...(DEFAULT_PERMISSION_ACTION_MATRIX[role.id] || {}),
      ...(saved[role.id] || {}),
    };
  }

  return merged;
}

function mergeScopeMatrix(saved: PermissionScopeMatrix): PermissionScopeMatrix {
  const merged = {} as PermissionScopeMatrix;

  for (const role of PERMISSION_CENTER_ROLES) {
    merged[role.id] = {
      ...(DEFAULT_PERMISSION_SCOPE_MATRIX[role.id] || {}),
      ...(saved[role.id] || {}),
    };
  }

  return merged;
}

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function persistJson<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getDefaultStateSnapshot(): PermissionCenterStateSnapshot {
  return {
    roles: PERMISSION_CENTER_ROLES,
    menuMatrix: DEFAULT_PERMISSION_MENU_MATRIX,
    actionMatrix: DEFAULT_PERMISSION_ACTION_MATRIX,
    scopeMatrix: DEFAULT_PERMISSION_SCOPE_MATRIX,
    userExceptions: [],
    changeLogs: [],
  };
}

function getLocalStateSnapshot(): PermissionCenterStateSnapshot {
  return {
    roles: safeParse(localStorage.getItem(PERMISSION_CENTER_STORAGE_KEYS.roles), PERMISSION_CENTER_ROLES),
    menuMatrix: safeParse(localStorage.getItem(PERMISSION_CENTER_STORAGE_KEYS.menuMatrix), DEFAULT_PERMISSION_MENU_MATRIX),
    actionMatrix: mergeActionMatrix(
      safeParse(localStorage.getItem(PERMISSION_CENTER_STORAGE_KEYS.actionMatrix), DEFAULT_PERMISSION_ACTION_MATRIX),
    ),
    scopeMatrix: mergeScopeMatrix(
      safeParse(localStorage.getItem(PERMISSION_CENTER_STORAGE_KEYS.scopeMatrix), DEFAULT_PERMISSION_SCOPE_MATRIX),
    ),
    userExceptions: safeParse(localStorage.getItem(PERMISSION_CENTER_STORAGE_KEYS.userExceptions), []),
    changeLogs: safeParse(localStorage.getItem(PERMISSION_CENTER_STORAGE_KEYS.changeLogs), []),
  };
}

function persistStateSnapshot(snapshot: PermissionCenterStateSnapshot) {
  persistJson(PERMISSION_CENTER_STORAGE_KEYS.roles, snapshot.roles);
  persistJson(PERMISSION_CENTER_STORAGE_KEYS.menuMatrix, snapshot.menuMatrix);
  persistJson(PERMISSION_CENTER_STORAGE_KEYS.legacyMenuMatrix, getLegacySyncedMatrix(snapshot.menuMatrix));
  persistJson(PERMISSION_CENTER_STORAGE_KEYS.actionMatrix, snapshot.actionMatrix);
  persistJson(PERMISSION_CENTER_STORAGE_KEYS.scopeMatrix, snapshot.scopeMatrix);
  persistJson(PERMISSION_CENTER_STORAGE_KEYS.userExceptions, snapshot.userExceptions);
  persistJson(PERMISSION_CENTER_STORAGE_KEYS.changeLogs, snapshot.changeLogs);
}

function hasObjectEntries(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length > 0;
}

function isBlankSupabaseRow(row: PermissionCenterStateRow | null): boolean {
  if (!row) return true;
  return (
    (!Array.isArray(row.roles) || row.roles.length === 0) &&
    !hasObjectEntries(row.menu_matrix) &&
    !hasObjectEntries(row.action_matrix) &&
    !hasObjectEntries(row.scope_matrix) &&
    (!Array.isArray(row.user_exceptions) || row.user_exceptions.length === 0) &&
    (!Array.isArray(row.change_logs) || row.change_logs.length === 0)
  );
}

function normalizeSupabaseSnapshot(row: PermissionCenterStateRow | null): PermissionCenterStateSnapshot | null {
  if (!row) return null;

  return {
    roles: Array.isArray(row.roles) && row.roles.length > 0 ? row.roles : PERMISSION_CENTER_ROLES,
    menuMatrix: hasObjectEntries(row.menu_matrix) ? row.menu_matrix : DEFAULT_PERMISSION_MENU_MATRIX,
    actionMatrix: mergeActionMatrix(row.action_matrix || DEFAULT_PERMISSION_ACTION_MATRIX),
    scopeMatrix: mergeScopeMatrix(row.scope_matrix || DEFAULT_PERMISSION_SCOPE_MATRIX),
    userExceptions: Array.isArray(row.user_exceptions) ? row.user_exceptions : [],
    changeLogs: Array.isArray(row.change_logs) ? row.change_logs : [],
  };
}

function buildSupabaseRow(snapshot: PermissionCenterStateSnapshot, changedBy: string): PermissionCenterStateRow {
  return {
    id: PERMISSION_CENTER_SUPABASE_ROW_ID,
    roles: snapshot.roles,
    menu_matrix: snapshot.menuMatrix,
    action_matrix: snapshot.actionMatrix,
    scope_matrix: snapshot.scopeMatrix,
    user_exceptions: snapshot.userExceptions,
    change_logs: snapshot.changeLogs,
    updated_by: changedBy,
  };
}

async function fetchSupabaseState(): Promise<{ snapshot: PermissionCenterStateSnapshot | null; isBlank: boolean }> {
  try {
    const { data, error } = await supabase
      .from(PERMISSION_CENTER_SUPABASE_TABLE)
      .select('*')
      .eq('id', PERMISSION_CENTER_SUPABASE_ROW_ID)
      .maybeSingle();

    if (error) {
      console.warn('[PermissionCenter][Supabase] fetch failed:', error.message);
      return { snapshot: null, isBlank: false };
    }

    const row = data as PermissionCenterStateRow | null;
    return {
      snapshot: normalizeSupabaseSnapshot(row),
      isBlank: isBlankSupabaseRow(row),
    };
  } catch (error) {
    console.warn('[PermissionCenter][Supabase] fetch failed:', error);
    return { snapshot: null, isBlank: false };
  }
}

async function pushSupabaseState(snapshot: PermissionCenterStateSnapshot, changedBy: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from(PERMISSION_CENTER_SUPABASE_TABLE)
      .upsert(buildSupabaseRow(snapshot, changedBy), { onConflict: 'id' });

    if (error) {
      console.warn('[PermissionCenter][Supabase] upsert failed:', error.message);
      return false;
    }

    return true;
  } catch (error) {
    console.warn('[PermissionCenter][Supabase] upsert failed:', error);
    return false;
  }
}

function createLog(type: PermissionChangeLog['type'], title: string, detail: string, changedBy: string): PermissionChangeLog {
  return {
    id: `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    title,
    detail,
    changedBy,
    changedAt: new Date().toISOString(),
  };
}

function getLegacySyncedMatrix(matrix: PermissionRoleMatrix): Record<string, string[]> {
  return {
    CEO: matrix.CEO || [],
    CFO: matrix.CFO || [],
    Sales_Manager: Array.from(new Set([...(matrix.Sales_Director || []), ...(matrix.Regional_Manager || [])])),
    Regional_Manager: matrix.Regional_Manager || [],
    Sales_Rep: matrix.Sales_Rep || [],
    Finance: matrix.Finance || [],
    Procurement: matrix.Procurement || [],
    Marketing_Ops: matrix.Marketing_Ops || [],
    Admin: Array.from(new Set([...(matrix.Admin || []), 'document-test'])),
  };
}

export function mapRuntimeUserToPermissionRole(user: Pick<User, 'role' | 'region'> | null | undefined): PermissionCenterRoleId | null {
  if (!user?.role) return null;
  if (user.role === 'Sales_Manager') {
    return user.region === 'all' ? 'Sales_Director' : 'Regional_Manager';
  }
  if (user.role === 'CEO') return 'CEO';
  if (user.role === 'CFO') return 'CFO';
  if (user.role === 'Sales_Director') return 'Sales_Director';
  if (user.role === 'Regional_Manager') return 'Regional_Manager';
  if (user.role === 'Sales_Rep') return 'Sales_Rep';
  if (user.role === 'Sales_Assistant') return 'Sales_Assistant';
  if (user.role === 'Finance') return 'Finance';
  if (user.role === 'External_Accountant') return 'External_Accountant';
  if (user.role === 'Procurement_Manager') return 'Procurement_Manager';
  if (user.role === 'Procurement') return 'Procurement';
  if (user.role === 'Marketing_Ops') return 'Marketing_Ops';
  if (user.role === 'Marketing_Assistant') return 'Marketing_Assistant';
  if (user.role === 'Documentation_Officer') return 'Documentation_Officer';
  if (user.role === 'QC') return 'QC';
  if (user.role === 'Warehouse_Ops') return 'Warehouse_Ops';
  if (user.role === 'HR_Admin') return 'HR_Admin';
  if (user.role === 'Admin_Ops') return 'Admin_Ops';
  if (user.role === 'Admin') return 'Admin';
  return null;
}

export const permissionCenterService = {
  async hydrateFromSupabase(): Promise<PermissionCenterStateSnapshot | null> {
    const { snapshot, isBlank } = await fetchSupabaseState();
    if (!snapshot) return null;
    if (isBlank) {
      const localSnapshot = getLocalStateSnapshot();
      await pushSupabaseState(localSnapshot, 'system-bootstrap');
      persistStateSnapshot(localSnapshot);
      return localSnapshot;
    }
    persistStateSnapshot(snapshot);
    return snapshot;
  },

  async syncToSupabase(changedBy: string) {
    const snapshot = getLocalStateSnapshot();
    return pushSupabaseState(snapshot, changedBy);
  },

  getDefaultStateSnapshot(): PermissionCenterStateSnapshot {
    return getDefaultStateSnapshot();
  },

  getRoles(): PermissionRoleDefinition[] {
    return getLocalStateSnapshot().roles;
  },

  saveRoles(roles: PermissionRoleDefinition[], changedBy: string, details?: string) {
    persistJson(PERMISSION_CENTER_STORAGE_KEYS.roles, roles);
    this.appendChangeLog(createLog('role_matrix', '更新角色配置', details || '角色信息已更新', changedBy));
    void this.syncToSupabase(changedBy);
  },

  getModules() {
    return PERMISSION_CENTER_MODULES;
  },

  getMenuMatrix(): PermissionRoleMatrix {
    return getLocalStateSnapshot().menuMatrix;
  },

  saveMenuMatrix(matrix: PermissionRoleMatrix, changedBy: string) {
    persistJson(PERMISSION_CENTER_STORAGE_KEYS.menuMatrix, matrix);
    persistJson(PERMISSION_CENTER_STORAGE_KEYS.legacyMenuMatrix, getLegacySyncedMatrix(matrix));
    window.dispatchEvent(new Event('menuPermissionsUpdated'));
    this.appendChangeLog(createLog('menu_matrix', '更新菜单权限矩阵', '角色与模块可见性已更新', changedBy));
    void this.syncToSupabase(changedBy);
  },

  getActionMatrix(): PermissionActionMatrix {
    return getLocalStateSnapshot().actionMatrix;
  },

  saveActionMatrix(matrix: PermissionActionMatrix, changedBy: string) {
    persistJson(PERMISSION_CENTER_STORAGE_KEYS.actionMatrix, matrix);
    this.appendChangeLog(createLog('action_matrix', '更新动作权限', '角色动作权限已更新', changedBy));
    void this.syncToSupabase(changedBy);
  },

  getScopeMatrix(): PermissionScopeMatrix {
    return getLocalStateSnapshot().scopeMatrix;
  },

  saveScopeMatrix(matrix: PermissionScopeMatrix, changedBy: string) {
    persistJson(PERMISSION_CENTER_STORAGE_KEYS.scopeMatrix, matrix);
    this.appendChangeLog(createLog('scope_matrix', '更新数据范围', '角色数据范围已更新', changedBy));
    void this.syncToSupabase(changedBy);
  },

  getUserExceptions(): PermissionUserException[] {
    return getLocalStateSnapshot().userExceptions;
  },

  saveUserExceptions(items: PermissionUserException[], changedBy: string) {
    persistJson(PERMISSION_CENTER_STORAGE_KEYS.userExceptions, items);
    this.appendChangeLog(createLog('user_exception', '更新人员例外授权', `当前例外授权数量：${items.length}`, changedBy));
    void this.syncToSupabase(changedBy);
  },

  getChangeLogs(): PermissionChangeLog[] {
    return getLocalStateSnapshot().changeLogs;
  },

  appendChangeLog(log: PermissionChangeLog) {
    const current = this.getChangeLogs();
    const next = [log, ...current].slice(0, 200);
    persistJson(PERMISSION_CENTER_STORAGE_KEYS.changeLogs, next);
  },

  getEnabledModulesForUser(user: Pick<User, 'role' | 'region'> | null | undefined): PermissionModuleId[] | null {
    const roleId = mapRuntimeUserToPermissionRole(user);
    if (!roleId) return null;
    const matrix = this.getMenuMatrix();
    return matrix[roleId] || [];
  },

  hasModuleAccess(user: Pick<User, 'role' | 'region'> | null | undefined, moduleId: PermissionModuleId): boolean {
    const enabledModules = this.getEnabledModulesForUser(user);
    if (!enabledModules) return false;
    return enabledModules.includes(moduleId);
  },

  hasModuleActionAccess(
    user: Pick<User, 'role' | 'region'> | null | undefined,
    moduleId: PermissionModuleId,
    actionId: PermissionActionId,
  ): boolean {
    const roleId = mapRuntimeUserToPermissionRole(user);
    if (!roleId) return false;
    const matrix = this.getActionMatrix();
    const actions = matrix[roleId]?.[moduleId] || [];
    if (actions.includes(actionId)) return true;

    // Keep runtime page access aligned with the menu matrix when older action
    // snapshots are missing a persisted "view" grant for an enabled module.
    if (actionId === 'view') {
      return this.hasModuleAccess(user, moduleId);
    }

    return false;
  },

  getModuleScopeForUser(
    user: Pick<User, 'role' | 'region'> | null | undefined,
    moduleId: PermissionModuleId,
  ): PermissionScopeId | null {
    const roleId = mapRuntimeUserToPermissionRole(user);
    if (!roleId) return null;
    const matrix = this.getScopeMatrix();
    return matrix[roleId]?.[moduleId] || null;
  },
};
