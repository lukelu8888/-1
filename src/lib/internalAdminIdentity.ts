type ManagedAdminIdentity = {
  name: string
  role: string
  region: string
}

const MANAGED_ADMIN_IDENTITY_BY_EMAIL: Record<string, ManagedAdminIdentity> = {
  'admin@cosun.com': { name: '系统管理员', role: 'Admin', region: 'all' },
  'admin@cosunchina.com': { name: '系统管理员', role: 'Admin', region: 'all' },
  'ceo@cosun.com': { name: '张明', role: 'CEO', region: 'all' },
  'ceo@cosunchina.com': { name: '张明', role: 'CEO', region: 'all' },
  'hr@cosun.com': { name: '卢招', role: 'HR_Admin', region: 'all' },
  'cfo@cosun.com': { name: '李华', role: 'CFO', region: 'all' },
  'finance_agent@cosun.com': { name: '杨立', role: 'External_Accountant', region: 'all' },
  'sales.director@cosun.com': { name: '王强', role: 'Sales_Director', region: 'all' },
  'sales.director@cosunchina.com': { name: '王强', role: 'Sales_Director', region: 'all' },
  'john.smith@cosun.com': { name: '刘建国', role: 'Regional_Manager', region: 'NA' },
  'salesmanager-na@cosunchina.com': { name: '刘建国', role: 'Regional_Manager', region: 'NA' },
  'carlos.silva@cosun.com': { name: '陈明华', role: 'Regional_Manager', region: 'SA' },
  'salesmanager-sa@cosunchina.com': { name: '陈明华', role: 'Regional_Manager', region: 'SA' },
  'hans.mueller@cosun.com': { name: '赵国强', role: 'Regional_Manager', region: 'EA' },
  'salesmanager-ea@cosunchina.com': { name: '赵国强', role: 'Regional_Manager', region: 'EA' },
  'maria.garcia@cosun.com': { name: '马里奥', role: 'Sales_Rep', region: 'NA' },
  'maria@cosun.com': { name: '马里奥', role: 'Sales_Rep', region: 'NA' },
  'zhangwei@cosun.com': { name: '马里奥', role: 'Sales_Rep', region: 'NA' },
  'sales01-na@cosunchina.com': { name: '马里奥', role: 'Sales_Rep', region: 'NA' },
  'ana.santos@cosun.com': { name: '李芳', role: 'Sales_Rep', region: 'SA' },
  'lifang@cosun.com': { name: '李芳', role: 'Sales_Rep', region: 'SA' },
  'sales01-sa@cosunchina.com': { name: '李芳', role: 'Sales_Rep', region: 'SA' },
  'emma.thompson@cosun.com': { name: '王芳', role: 'Sales_Rep', region: 'EA' },
  'wangfang@cosun.com': { name: '王芳', role: 'Sales_Rep', region: 'EA' },
  'sales02-ea@cosunchina.com': { name: '王芳', role: 'Sales_Rep', region: 'EA' },
  'finance@cosun.com': { name: '赵敏', role: 'Finance', region: 'all' },
  'procurement@cosun.com': { name: '刘刚', role: 'Procurement', region: 'all' },
  'marketing@cosun.com': { name: '李娜', role: 'Marketing_Ops', region: 'all' },
  'luyi@cosun.com': { name: 'Luyi', role: 'QC', region: 'all' },
  'xingzheng@cosunchina.com': { name: 'Xingzheng', role: 'Admin_Ops', region: 'all' },
  'zhanghui@cosun.com': { name: '张晖', role: 'Documentation_Officer', region: 'all' },
}

export function resolveManagedAdminIdentity(email?: string | null): ManagedAdminIdentity | null {
  const normalizedEmail = String(email || '').trim().toLowerCase()
  if (!normalizedEmail) return null
  return MANAGED_ADMIN_IDENTITY_BY_EMAIL[normalizedEmail] || null
}

export function normalizeManagedAdminIdentity<T extends {
  email?: string | null
  name?: string | null
  role?: string | null
  userRole?: string | null
  region?: string | null
}>(user: T): T {
  const managedIdentity = resolveManagedAdminIdentity(user?.email)
  if (!managedIdentity) return user

  return {
    ...user,
    name: managedIdentity.name,
    role: managedIdentity.role,
    userRole: 'userRole' in user ? managedIdentity.role : user.userRole,
    region: managedIdentity.region,
  }
}
