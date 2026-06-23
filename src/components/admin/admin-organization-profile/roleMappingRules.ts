export type PermissionRoleDefinition = {
  name?: string;
  description?: string;
};

export type PermissionRoleMap = Record<string, PermissionRoleDefinition | undefined>;

export type RoleProfile = {
  department: string;
  title: string;
  baseLabel: string;
  regionalized?: boolean;
};

export const REGION_LABEL_MAP: Record<string, string> = {
  NA: '北美',
  SA: '南美',
  EA: '欧非',
};

export const REGION_DISPLAY_LABEL_MAP: Record<string, string> = {
  NA: '北美区',
  SA: '南美区',
  EA: '欧非区',
};

export const ROLE_PROFILE_RULES: Record<string, RoleProfile> = {
  CEO: { department: '管理层', title: 'CEO', baseLabel: 'CEO' },
  Admin: { department: 'IT部', title: '系统管理员', baseLabel: '系统管理员' },
  CFO: { department: '财务部', title: 'CFO', baseLabel: 'CFO' },
  Finance: { department: '财务部', title: '财务专员', baseLabel: '财务专员' },
  Sales_Director: { department: '销售部', title: '销售总监', baseLabel: '销售总监' },
  Regional_Manager: { department: '销售部', title: '区域主管', baseLabel: '区域主管', regionalized: true },
  Sales_Manager: { department: '销售部', title: '销售经理', baseLabel: '销售经理', regionalized: true },
  Sales_Rep: { department: '销售部', title: '业务员', baseLabel: '业务员', regionalized: true },
  Sales_Assistant: { department: '销售部', title: '业务助理', baseLabel: '业务助理', regionalized: true },
  Order_Coordinator: { department: '销售部', title: '跟单员', baseLabel: '跟单员', regionalized: true },
  Procurement_Manager: { department: '采购部', title: '采购主管', baseLabel: '采购主管' },
  Procurement: { department: '采购部', title: '采购员', baseLabel: '采购员' },
  Documentation_Officer: { department: '单证管理部', title: '单证员', baseLabel: '单证员' },
  Marketing_Ops: { department: '市场部', title: '运营专员', baseLabel: '运营专员' },
  Marketing_Assistant: { department: '市场部', title: '运营助理', baseLabel: '运营助理' },
  QC: { department: '品控部', title: '验货员', baseLabel: '验货员' },
  Warehouse_Ops: { department: '仓配部', title: '仓配运营', baseLabel: '仓配运营' },
  HR_Admin: { department: '人力资源', title: '人事主管', baseLabel: '人事主管' },
  Admin_Ops: { department: '行政部', title: '行政专员', baseLabel: '行政专员' },
  External_Accountant: { department: '财务部', title: '代理记账财务', baseLabel: '代理记账财务' },
};

export const DIRECT_ROLE_CODE_MAP: Record<string, string> = {
  CEO: 'CEO',
  CFO: 'CFO',
  Sales_Director: 'Sales_Director',
  Regional_Manager: 'Regional_Manager',
  Sales_Manager: 'Regional_Manager',
  Sales_Rep: 'Sales_Rep',
  Sales_Assistant: 'Sales_Assistant',
  Order_Coordinator: 'Order_Coordinator',
  Finance: 'Finance',
  External_Accountant: 'External_Accountant',
  Procurement_Manager: 'Procurement_Manager',
  Procurement: 'Procurement',
  Documentation_Officer: 'Documentation_Officer',
  Marketing_Ops: 'Marketing_Ops',
  Marketing_Assistant: 'Marketing_Assistant',
  QC: 'QC',
  Warehouse_Ops: 'Warehouse_Ops',
  HR_Admin: 'HR_Admin',
  Admin_Ops: 'Admin_Ops',
  Admin: 'Admin',
};

export const TITLE_ROLE_MATCHERS: Array<{ match: RegExp; code: string }> = [
  { match: /CEO/i, code: 'CEO' },
  { match: /CFO/i, code: 'CFO' },
  { match: /系统管理员|管理员/i, code: 'Admin' },
  { match: /销售总监/i, code: 'Sales_Director' },
  { match: /区域业务经理|区域主管|销售经理/i, code: 'Regional_Manager' },
  { match: /业务员/i, code: 'Sales_Rep' },
  { match: /业务助理/i, code: 'Sales_Assistant' },
  { match: /跟单员/i, code: 'Order_Coordinator' },
  { match: /财务专员|内部财务|财务/i, code: 'Finance' },
  { match: /代理记账/i, code: 'External_Accountant' },
  { match: /采购经理|采购主管/i, code: 'Procurement_Manager' },
  { match: /采购专员|采购员/i, code: 'Procurement' },
  { match: /单证员|船务专员/i, code: 'Documentation_Officer' },
  { match: /运营专员|市场/i, code: 'Marketing_Ops' },
  { match: /运营助理/i, code: 'Marketing_Assistant' },
  { match: /验货员|QC/i, code: 'QC' },
  { match: /仓配|仓储/i, code: 'Warehouse_Ops' },
  { match: /人事/i, code: 'HR_Admin' },
  { match: /行政/i, code: 'Admin_Ops' },
];
