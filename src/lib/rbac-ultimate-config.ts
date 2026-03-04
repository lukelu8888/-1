// 🔥 THE COSUN BM - 企业级RBAC权限配置系统
// Ultimate Role-Based Access Control Configuration
// 四维权限模型：业务流程 + 职能模块 + 操作粒度 + 数据范围

// ========================================
// 1️⃣ 角色定义（14个完整角色）
// ========================================
export type UserRole = 
  // 🔧 系统管理员
  | 'system_admin'
  
  // 📱 营销人员（战略性角色）
  | 'marketing'
  | 'marketing_ops'        // 🆕 运营专员（社媒运营+客户筛选）
  
  // 🏢 高管团队
  | 'ceo'
  | 'cfo'
  
  // 📊 销售团队
  | 'sales_director'         // 销售总监
  | 'regional_manager_na'    // 🆕 北美区域业务经理
  | 'regional_manager_sa'    // 🆕 南美区域业务经理
  | 'regional_manager_emea'  // 🆕 欧非区域业务经理
  | 'sales_rep_maria'        // 销售代表 Maria
  | 'sales_rep_ana'          // 销售代表 Ana
  | 'sales_rep_emma'         // 销售代表 Emma
  
  // 🎯 运营团队
  | 'finance'                // 财务人员
  | 'procurement';           // 采购人员

// ========================================
// 2️⃣ 职能模块定义（10大业务模块）
// ========================================
export type BusinessModule =
  | 'crm'                    // 🤝 Customer Relationship (客户关系管理)
  | 'sales'                  // 💼 Sales Management (销售管理)
  | 'procurement'            // 🛒 Procurement & Supply Chain (采购供应链)
  | 'logistics'              // 🚚 Logistics & Shipping (物流配送)
  | 'finance'                // 💰 Financial Management (财务管理)
  | 'product'                // 📦 Product & Inventory (产品库存)
  | 'document'               // 📄 Document & Workflow (文档流程)
  | 'analytics'              // 📊 Analytics & Reports (分析报表)
  | 'system'                 // ⚙️ System & Security (系统安全)
  | 'marketing'              // 📱 Marketing & Lead Generation (营销获客)
  | 'communication';         // 🔔 Communication & Notification (通讯通知)

// ========================================
// 3️⃣ 操作粒度定义（8种操作类型）
// ========================================
export type PermissionAction =
  | 'view'       // ✅ 查看
  | 'create'     // ➕ 创建
  | 'edit'       // ✏️ 编辑
  | 'delete'     // 🗑️ 删除
  | 'approve'    // ✔️ 审批
  | 'export'     // 📤 导出
  | 'print'      // 🖨️ 打印
  | 'manage';    // ⚙️ 管理（完全控制）

// ========================================
// 4️⃣ 数据范围定义（5种数据可见性）
// ========================================
export type DataScope =
  | 'all'          // 🌐 全部数据
  | 'region'       // 🌎 区域数据（NA/SA/EA）
  | 'department'   // 🏢 部门数据
  | 'subordinate'  // 👥 个人+下属数据
  | 'own';         // 👤 个人数据

// ========================================
// 模块详细配置
// ========================================
export interface ModuleConfig {
  id: BusinessModule;
  name: string;
  nameEn: string;
  icon: string;
  color: string;
  description: string;
  category: 'business' | 'system' | 'support';  // 模块分类
  subModules: SubModule[];
}

export interface SubModule {
  id: string;
  name: string;
  nameEn: string;
  description: string;
}

// 10大职能模块完整配置
export const BUSINESS_MODULES: Record<BusinessModule, ModuleConfig> = {
  crm: {
    id: 'crm',
    name: '客户关系管理',
    nameEn: 'Customer Relationship',
    icon: '🤝',
    color: 'blue',
    description: '承接营销引流的深度客户开发，遵循漏斗原则管理客户全生命周期',
    category: 'business',
    subModules: [
      { id: 'customer_pool', name: '公海客户池', nameEn: 'Customer Pool', description: '营销引流的待分配目标客户' },
      { id: 'prospect_management', name: '意向客户管理', nameEn: 'Prospect Management', description: '已分配给业务员的潜在客户' },
      { id: 'active_customer', name: '成交客户管理', nameEn: 'Active Customer', description: '已下单的活跃客户' },
      { id: 'key_account', name: '大客户/VIP管理', nameEn: 'Key Account', description: '高价值大客户专属管理' },
      { id: 'customer_classification', name: '客户分类体系', nameEn: 'Classification', description: '按类型、来源、业务分类' },
      { id: 'customer_source', name: '客户来源跟踪', nameEn: 'Source Tracking', description: '营销渠道效果追踪' },
      { id: 'sales_funnel', name: '销售漏斗', nameEn: 'Sales Funnel', description: '客户转化漏斗可视化' },
      { id: 'customer_profile', name: '客户画像', nameEn: 'Customer Profile', description: '客户行为分析和标签' },
      { id: 'contact_management', name: '联系人管理', nameEn: 'Contact Management', description: '客户多联系人管理' },
      { id: 'customer_rating', name: '客户信用评级', nameEn: 'Credit Rating', description: '客户信用和风险评估' },
    ]
  },
  sales: {
    id: 'sales',
    name: '销售管理',
    nameEn: 'Sales Management',
    icon: '💼',
    color: 'green',
    description: '询价单、报价单、合同、订单、销售漏斗',
    category: 'business',
    subModules: [
      { id: 'inquiry', name: '客户询价', nameEn: 'Inquiry', description: '客户询价单管理' },
      { id: 'quotation', name: 'Cosun报价', nameEn: 'Quotation', description: 'Cosun报价单管理' },
      { id: 'contract', name: '销售合同', nameEn: 'Contract', description: '销售合同管理' },
      { id: 'order', name: '销售订单', nameEn: 'Order', description: '销售订单跟踪' },
      { id: 'sales_funnel', name: '销售漏斗', nameEn: 'Funnel', description: '销售机会和转化率' },
    ]
  },
  procurement: {
    id: 'procurement',
    name: '采购供应链',
    nameEn: 'Procurement & Supply Chain',
    icon: '🛒',
    color: 'indigo',
    description: '供应商管理、采购订单、库存管理、质量控制',
    category: 'business',
    subModules: [
      { id: 'supplier', name: '供应商管理', nameEn: 'Supplier', description: '供应商信息和评估' },
      { id: 'purchase_order', name: '采购订单', nameEn: 'Purchase Order', description: '采购订单管理' },
      { id: 'inventory', name: '库存管理', nameEn: 'Inventory', description: '库存查询和预警' },
      { id: 'quality', name: '质量控制', nameEn: 'Quality Control', description: '验货和质检' },
    ]
  },
  logistics: {
    id: 'logistics',
    name: '物流配送',
    nameEn: 'Logistics & Shipping',
    icon: '🚚',
    color: 'orange',
    description: '装箱单、提单、物流跟踪、仓储管理',
    category: 'business',
    subModules: [
      { id: 'packing_list', name: '装箱单', nameEn: 'Packing List', description: '装箱单管理' },
      { id: 'bill_of_lading', name: '提单', nameEn: 'Bill of Lading', description: '提单管理' },
      { id: 'tracking', name: '物流跟踪', nameEn: 'Tracking', description: '物流状态跟踪' },
      { id: 'warehouse', name: '仓储管理', nameEn: 'Warehouse', description: '仓库库存管理' },
    ]
  },
  finance: {
    id: 'finance',
    name: '财务管理',
    nameEn: 'Financial Management',
    icon: '💰',
    color: 'emerald',
    description: '商业发票、对账单、收付款、财务报表',
    category: 'business',
    subModules: [
      { id: 'invoice', name: '商业发票', nameEn: 'Invoice', description: '商业发票管理' },
      { id: 'statement', name: '对账单', nameEn: 'Statement', description: '对账单管理' },
      { id: 'receivable', name: '应收账款', nameEn: 'Receivable', description: '应收账款跟踪' },
      { id: 'payable', name: '应付账款', nameEn: 'Payable', description: '应付账款管理' },
      { id: 'financial_report', name: '财务报表', nameEn: 'Report', description: '财务报表和分析' },
    ]
  },
  product: {
    id: 'product',
    name: '产品库存',
    nameEn: 'Product & Inventory',
    icon: '📦',
    color: 'purple',
    description: '产品目录、SKU管理、价格体系、库存预警',
    category: 'business',
    subModules: [
      { id: 'product_catalog', name: '产品目录', nameEn: 'Catalog', description: '产品分类和目录' },
      { id: 'sku', name: 'SKU管理', nameEn: 'SKU', description: 'SKU和规格管理' },
      { id: 'pricing', name: '价格体系', nameEn: 'Pricing', description: '产品定价管理' },
      { id: 'stock_alert', name: '库存预警', nameEn: 'Alert', description: '库存预警和补货' },
    ]
  },
  document: {
    id: 'document',
    name: '文档流程',
    nameEn: 'Document & Workflow',
    icon: '📄',
    color: 'cyan',
    description: '表单设计器、工作流引擎、审批中心、文档归档',
    category: 'support',
    subModules: [
      { id: 'form_designer', name: '表单设计器', nameEn: 'Form Designer', description: '自定义表单设计' },
      { id: 'workflow', name: '工作流引擎', nameEn: 'Workflow', description: '业务流程配置' },
      { id: 'approval', name: '审批中心', nameEn: 'Approval', description: '审批任务管理' },
      { id: 'archive', name: '文档归档', nameEn: 'Archive', description: '文档存储和检索' },
    ]
  },
  analytics: {
    id: 'analytics',
    name: '分析报表',
    nameEn: 'Analytics & Reports',
    icon: '📊',
    color: 'pink',
    description: '业务看板、销售分析、财务报表、数据导出',
    category: 'support',
    subModules: [
      { id: 'dashboard', name: '业务看板', nameEn: 'Dashboard', description: '可视化数据看板' },
      { id: 'sales_analytics', name: '销售分析', nameEn: 'Sales Analytics', description: '销售数据分析' },
      { id: 'financial_analytics', name: '财务分析', nameEn: 'Financial Analytics', description: '财务数据分析' },
      { id: 'data_export', name: '数据导出', nameEn: 'Export', description: '数据批量导出' },
    ]
  },
  system: {
    id: 'system',
    name: '系统安全',
    nameEn: 'System & Security',
    icon: '⚙️',
    color: 'slate',
    description: '用户管理、角色权限、系统配置、审计日志',
    category: 'system',
    subModules: [
      { id: 'user_management', name: '用户管理', nameEn: 'Users', description: '用户账号管理' },
      { id: 'role_permission', name: '角色权限', nameEn: 'Permissions', description: '角色权限配置' },
      { id: 'system_config', name: '系统配置', nameEn: 'Config', description: '系统参数设置' },
      { id: 'audit_log', name: '审计日志', nameEn: 'Audit', description: '操作日志审计' },
      { id: 'data_backup', name: '数据备份', nameEn: 'Backup', description: '数据备份恢复' },
    ]
  },
  marketing: {
    id: 'marketing',
    name: '营销获客',
    nameEn: 'Marketing & Lead Generation',
    icon: '📱',
    color: 'fuchsia',
    description: '市场推广、客户获取、活动管理、营销分析',
    category: 'support',
    subModules: [
      { id: 'campaign', name: '市场推广', nameEn: 'Campaign', description: '市场推广活动管理' },
      { id: 'lead_generation', name: '客户获取', nameEn: 'Lead Generation', description: '潜在客户获取' },
      { id: 'event_management', name: '活动管理', nameEn: 'Event Management', description: '营销活动管理' },
      { id: 'marketing_analytics', name: '营销分析', nameEn: 'Marketing Analytics', description: '营销数据分析' },
    ]
  },
  communication: {
    id: 'communication',
    name: '通讯通知',
    nameEn: 'Communication & Notification',
    icon: '🔔',
    color: 'amber',
    description: '内部消息、邮件推送、站内通知、任务提醒',
    category: 'support',
    subModules: [
      { id: 'internal_message', name: '内部消息', nameEn: 'Message', description: '员工内部沟通' },
      { id: 'email', name: '邮件推送', nameEn: 'Email', description: '邮件发送管理' },
      { id: 'notification', name: '站内通知', nameEn: 'Notification', description: '系统通知消息' },
      { id: 'task_reminder', name: '任务提醒', nameEn: 'Reminder', description: '任务和日程提醒' },
    ]
  },
};

// ========================================
// 角色标签配置
// ========================================
export const ROLE_LABELS: Record<UserRole, {
  zh: string;
  en: string;
  icon: string;
  color: string;
  department: string;
  level: 'executive' | 'manager' | 'staff' | 'system';
}> = {
  system_admin: {
    zh: '系统管理员',
    en: 'System Admin',
    icon: '🔧',
    color: 'slate',
    department: 'IT',
    level: 'system'
  },
  marketing: {
    zh: '营销人员',
    en: 'Marketing',
    icon: '📱',
    color: 'fuchsia',
    department: 'Marketing',
    level: 'staff'
  },
  marketing_ops: {
    zh: '运营专员（社媒运营+客户筛选）',
    en: 'Marketing Ops',
    icon: '📱',
    color: 'fuchsia',
    department: 'Marketing',
    level: 'staff'
  },
  ceo: {
    zh: '首席执行官',
    en: 'CEO',
    icon: '👨‍💼',
    color: 'purple',
    department: 'Executive',
    level: 'executive'
  },
  cfo: {
    zh: '首席财务官',
    en: 'CFO',
    icon: '💼',
    color: 'blue',
    department: 'Executive',
    level: 'executive'
  },
  sales_director: {
    zh: '销售总监',
    en: 'Sales Director',
    icon: '📊',
    color: 'green',
    department: 'Sales',
    level: 'executive'
  },
  regional_manager_na: {
    zh: '北美区域业务经理',
    en: 'Regional Manager (NA)',
    icon: '🇺🇸',
    color: 'rose',
    department: 'Sales',
    level: 'manager'
  },
  regional_manager_sa: {
    zh: '南美区域业务经理',
    en: 'Regional Manager (SA)',
    icon: '🇧🇷',
    color: 'amber',
    department: 'Sales',
    level: 'manager'
  },
  regional_manager_emea: {
    zh: '欧非区域业务经理',
    en: 'Regional Manager (EMEA)',
    icon: '🇪🇺',
    color: 'sky',
    department: 'Sales',
    level: 'manager'
  },
  sales_rep_maria: {
    zh: '销售代表 Maria',
    en: 'Sales Rep (Maria)',
    icon: '👩‍💼',
    color: 'orange',
    department: 'Sales',
    level: 'staff'
  },
  sales_rep_ana: {
    zh: '销售代表 Ana',
    en: 'Sales Rep (Ana)',
    icon: '👩‍💼',
    color: 'teal',
    department: 'Sales',
    level: 'staff'
  },
  sales_rep_emma: {
    zh: '销售代表 Emma',
    en: 'Sales Rep (Emma)',
    icon: '👩‍💼',
    color: 'pink',
    department: 'Sales',
    level: 'staff'
  },
  finance: {
    zh: '财务人员',
    en: 'Finance',
    icon: '💰',
    color: 'emerald',
    department: 'Finance',
    level: 'staff'
  },
  procurement: {
    zh: '采购人员',
    en: 'Procurement',
    icon: '🛒',
    color: 'indigo',
    department: 'Procurement',
    level: 'staff'
  },
};

// ========================================
// 权限配置类型
// ========================================
export interface ModulePermission {
  module: BusinessModule;
  actions: PermissionAction[];
  dataScope: DataScope;
  restrictions?: string[];  // 限制条件（如：不能删除已对账数据）
}

// ========================================
// 完整的14个角色权限配置矩阵
// ========================================
export const ROLE_PERMISSION_MATRIX: Record<UserRole, ModulePermission[]> = {
  
  // ===========================================
  // 🔧 系统管理员
  // ===========================================
  system_admin: [
    { module: 'system', actions: ['view', 'create', 'edit', 'delete', 'manage'], dataScope: 'all' },
    { module: 'crm', actions: ['view'], dataScope: 'all', restrictions: ['只读'] },
    { module: 'sales', actions: ['view'], dataScope: 'all', restrictions: ['只读'] },
    { module: 'procurement', actions: ['view'], dataScope: 'all', restrictions: ['只读'] },
    { module: 'logistics', actions: ['view'], dataScope: 'all', restrictions: ['只读'] },
    { module: 'finance', actions: ['view'], dataScope: 'all', restrictions: ['只读'] },
    { module: 'product', actions: ['view'], dataScope: 'all', restrictions: ['只读'] },
    { module: 'document', actions: ['view', 'manage'], dataScope: 'all' },
    { module: 'analytics', actions: ['view', 'export'], dataScope: 'all' },
    { module: 'communication', actions: ['view', 'create', 'edit', 'delete'], dataScope: 'all' },
  ],

  // ===========================================
  // 📱 营销人员
  // ===========================================
  marketing: [
    // CRM - 可以创建潜在客户（Leads），但只读正式客户数据
    { module: 'crm', actions: ['view', 'create'], dataScope: 'all', restrictions: ['可创建潜在客户，已转化客户只读'] },
    
    // Sales - 只读查看权限，用于跟踪转化效果和计算提成
    { module: 'sales', actions: ['view', 'export'], dataScope: 'all', restrictions: ['查看转化数据和提成统计，不能编辑订单'] },
    
    // Procurement - 无访问权限
    { module: 'procurement', actions: [], dataScope: 'all', restrictions: ['无访问权限'] },
    
    // Logistics - 无访问权限
    { module: 'logistics', actions: [], dataScope: 'all', restrictions: ['无访问权限'] },
    
    // Finance - 只能查看自己的提成数据
    { module: 'finance', actions: ['view'], dataScope: 'own', restrictions: ['只能查看个人提成收入'] },
    
    // Product - 完全管理权限（产品上传、维护）
    { module: 'product', actions: ['view', 'create', 'edit', 'delete', 'manage'], dataScope: 'all' },
    
    // Document - 创建和管理营销资料
    { module: 'document', actions: ['view', 'create', 'edit'], dataScope: 'all', restrictions: ['营销资料和促销活动相关'] },
    
    // Analytics - 查看营销数据和转化分析
    { module: 'analytics', actions: ['view', 'export'], dataScope: 'all', restrictions: ['营销效果、客户转化、引流数据分析'] },
    
    // System - 无访问权限
    { module: 'system', actions: [], dataScope: 'all', restrictions: ['无访问权限'] },
    
    // Marketing - 完全管理权限（市场推广、活动管理、客户获取）
    { module: 'marketing', actions: ['view', 'create', 'edit', 'delete', 'manage'], dataScope: 'all' },
    
    // Communication - 完全权限（营销推广需要）
    { module: 'communication', actions: ['view', 'create', 'edit'], dataScope: 'all' },
  ],

  // ===========================================
  // 🆕 运营专员（社媒运营+客户筛选）
  // ===========================================
  marketing_ops: [
    // CRM - 可以创建潜在客户（Leads），但只读正式客户数据
    { module: 'crm', actions: ['view', 'create'], dataScope: 'all', restrictions: ['可创建潜在客户，已转化客户只读'] },
    
    // Sales - 只读查看权限，用于跟踪转化效果和计算提成
    { module: 'sales', actions: ['view', 'export'], dataScope: 'all', restrictions: ['查看转化数据和提成统计，不能编辑订单'] },
    
    // Procurement - 无访问权限
    { module: 'procurement', actions: [], dataScope: 'all', restrictions: ['无访问权限'] },
    
    // Logistics - 无访问权限
    { module: 'logistics', actions: [], dataScope: 'all', restrictions: ['无访问权限'] },
    
    // Finance - 只能查看自己的提成数据
    { module: 'finance', actions: ['view'], dataScope: 'own', restrictions: ['只能查看个人提成收入'] },
    
    // Product - 完全管理权限（产品上传、维护）
    { module: 'product', actions: ['view', 'create', 'edit', 'delete', 'manage'], dataScope: 'all' },
    
    // Document - 创建和管理营销资料
    { module: 'document', actions: ['view', 'create', 'edit'], dataScope: 'all', restrictions: ['营销资料和促销活动相关'] },
    
    // Analytics - 查看营销数据和转化分析
    { module: 'analytics', actions: ['view', 'export'], dataScope: 'all', restrictions: ['营销效果、客户转化、引流数据分析'] },
    
    // System - 无访问权限
    { module: 'system', actions: [], dataScope: 'all', restrictions: ['无访问权限'] },
    
    // Marketing - 完全管理权限（市场推广、活动管理、客户获取）
    { module: 'marketing', actions: ['view', 'create', 'edit', 'delete', 'manage'], dataScope: 'all' },
    
    // Communication - 完全权限（营销推广需要）
    { module: 'communication', actions: ['view', 'create', 'edit'], dataScope: 'all' },
  ],

  // ===========================================
  // 👨‍💼 CEO
  // ===========================================
  ceo: [
    { module: 'crm', actions: ['view'], dataScope: 'all' },
    { module: 'sales', actions: ['view', 'approve'], dataScope: 'all' },
    { module: 'procurement', actions: ['view'], dataScope: 'all' },
    { module: 'logistics', actions: ['view'], dataScope: 'all' },
    { module: 'finance', actions: ['view', 'approve', 'export'], dataScope: 'all' },
    { module: 'product', actions: ['view'], dataScope: 'all' },
    { module: 'document', actions: ['view', 'approve'], dataScope: 'all' },
    { module: 'analytics', actions: ['view', 'export'], dataScope: 'all' },
    { module: 'system', actions: ['view'], dataScope: 'all', restrictions: ['只读'] },
    { module: 'communication', actions: ['view', 'create'], dataScope: 'all' },
  ],

  // ===========================================
  // 💼 CFO
  // ===========================================
  cfo: [
    { module: 'crm', actions: ['view'], dataScope: 'all', restrictions: ['无敏感客户信息'] },
    { module: 'sales', actions: ['view'], dataScope: 'all', restrictions: ['财务视角'] },
    { module: 'procurement', actions: ['view'], dataScope: 'all' },
    { module: 'logistics', actions: ['view'], dataScope: 'all' },
    { module: 'finance', actions: ['view', 'create', 'edit', 'approve', 'export', 'manage'], dataScope: 'all' },
    { module: 'product', actions: ['view'], dataScope: 'all', restrictions: ['成本数据'] },
    { module: 'document', actions: ['view', 'approve'], dataScope: 'all', restrictions: ['财务相关'] },
    { module: 'analytics', actions: ['view', 'export'], dataScope: 'all', restrictions: ['财务报表'] },
    { module: 'system', actions: ['view'], dataScope: 'all', restrictions: ['只读'] },
    { module: 'communication', actions: ['view', 'create'], dataScope: 'all' },
  ],

  // ===========================================
  // 📊 销售总监
  // ===========================================
  sales_director: [
    { module: 'crm', actions: ['view', 'create', 'edit', 'delete', 'manage'], dataScope: 'all' },
    { module: 'sales', actions: ['view', 'create', 'edit', 'approve', 'export', 'manage'], dataScope: 'all' },
    { module: 'procurement', actions: [], dataScope: 'all', restrictions: ['无访问权限'] },
    { module: 'logistics', actions: ['view'], dataScope: 'all' },
    { module: 'finance', actions: ['view'], dataScope: 'all', restrictions: ['销售金额，无成本数据'] },
    { module: 'product', actions: ['view'], dataScope: 'all' },
    { module: 'document', actions: ['view', 'create', 'approve'], dataScope: 'all', restrictions: ['销售相关'] },
    { module: 'analytics', actions: ['view', 'export'], dataScope: 'all', restrictions: ['销售报表'] },
    { module: 'system', actions: [], dataScope: 'all', restrictions: ['无访问权限'] },
    { module: 'communication', actions: ['view', 'create', 'edit'], dataScope: 'all' },
  ],

  // ===========================================
  // 🇺🇸 北美区域业务经理
  // ===========================================
  regional_manager_na: [
    { module: 'crm', actions: ['view', 'create', 'edit', 'delete'], dataScope: 'region' },
    { module: 'sales', actions: ['view', 'create', 'edit', 'approve', 'export'], dataScope: 'region' },
    { module: 'procurement', actions: [], dataScope: 'region', restrictions: ['无访问权限'] },
    { module: 'logistics', actions: ['view'], dataScope: 'region' },
    { module: 'finance', actions: ['view'], dataScope: 'region', restrictions: ['区域销售金额'] },
    { module: 'product', actions: ['view'], dataScope: 'all' },
    { module: 'document', actions: ['view', 'create', 'approve'], dataScope: 'region', restrictions: ['区域销售相关'] },
    { module: 'analytics', actions: ['view', 'export'], dataScope: 'region', restrictions: ['区域销售报表'] },
    { module: 'system', actions: [], dataScope: 'region', restrictions: ['无访问权限'] },
    { module: 'communication', actions: ['view', 'create'], dataScope: 'region' },
  ],

  // ===========================================
  // 🇧🇷 南美区域业务经理
  // ===========================================
  regional_manager_sa: [
    { module: 'crm', actions: ['view', 'create', 'edit', 'delete'], dataScope: 'region' },
    { module: 'sales', actions: ['view', 'create', 'edit', 'approve', 'export'], dataScope: 'region' },
    { module: 'procurement', actions: [], dataScope: 'region', restrictions: ['无访问权限'] },
    { module: 'logistics', actions: ['view'], dataScope: 'region' },
    { module: 'finance', actions: ['view'], dataScope: 'region', restrictions: ['区域销售金额'] },
    { module: 'product', actions: ['view'], dataScope: 'all' },
    { module: 'document', actions: ['view', 'create', 'approve'], dataScope: 'region', restrictions: ['区域销售相关'] },
    { module: 'analytics', actions: ['view', 'export'], dataScope: 'region', restrictions: ['区域销售报表'] },
    { module: 'system', actions: [], dataScope: 'region', restrictions: ['无访问权限'] },
    { module: 'communication', actions: ['view', 'create'], dataScope: 'region' },
  ],

  // ===========================================
  // 🇪🇺 欧非区域业务经理
  // ===========================================
  regional_manager_emea: [
    { module: 'crm', actions: ['view', 'create', 'edit', 'delete'], dataScope: 'region' },
    { module: 'sales', actions: ['view', 'create', 'edit', 'approve', 'export'], dataScope: 'region' },
    { module: 'procurement', actions: [], dataScope: 'region', restrictions: ['无访问权限'] },
    { module: 'logistics', actions: ['view'], dataScope: 'region' },
    { module: 'finance', actions: ['view'], dataScope: 'region', restrictions: ['区域销售金额'] },
    { module: 'product', actions: ['view'], dataScope: 'all' },
    { module: 'document', actions: ['view', 'create', 'approve'], dataScope: 'region', restrictions: ['区域销售相关'] },
    { module: 'analytics', actions: ['view', 'export'], dataScope: 'region', restrictions: ['区域销售报表'] },
    { module: 'system', actions: [], dataScope: 'region', restrictions: ['无访问权限'] },
    { module: 'communication', actions: ['view', 'create'], dataScope: 'region' },
  ],

  // ===========================================
  // 👩‍💼 销售代表 Maria
  // ===========================================
  sales_rep_maria: [
    { module: 'crm', actions: ['view', 'create', 'edit'], dataScope: 'own' },
    { module: 'sales', actions: ['view', 'create', 'edit'], dataScope: 'own' },
    { module: 'procurement', actions: [], dataScope: 'own', restrictions: ['无访问权限'] },
    { module: 'logistics', actions: ['view'], dataScope: 'own' },
    { module: 'finance', actions: ['view'], dataScope: 'own', restrictions: ['销售金额，无成本'] },
    { module: 'product', actions: ['view'], dataScope: 'all' },
    { module: 'document', actions: ['view', 'create'], dataScope: 'own', restrictions: ['个人销售相关'] },
    { module: 'analytics', actions: ['view'], dataScope: 'own', restrictions: ['个人业绩'] },
    { module: 'system', actions: [], dataScope: 'own', restrictions: ['无访问权限'] },
    { module: 'communication', actions: ['view', 'create'], dataScope: 'own' },
  ],

  // ===========================================
  // 👩‍💼 销售代表 Ana
  // ===========================================
  sales_rep_ana: [
    { module: 'crm', actions: ['view', 'create', 'edit'], dataScope: 'own' },
    { module: 'sales', actions: ['view', 'create', 'edit'], dataScope: 'own' },
    { module: 'procurement', actions: [], dataScope: 'own', restrictions: ['无访问权限'] },
    { module: 'logistics', actions: ['view'], dataScope: 'own' },
    { module: 'finance', actions: ['view'], dataScope: 'own', restrictions: ['销售金额，无成本'] },
    { module: 'product', actions: ['view'], dataScope: 'all' },
    { module: 'document', actions: ['view', 'create'], dataScope: 'own', restrictions: ['个人销售相关'] },
    { module: 'analytics', actions: ['view'], dataScope: 'own', restrictions: ['个人业绩'] },
    { module: 'system', actions: [], dataScope: 'own', restrictions: ['无访问权限'] },
    { module: 'communication', actions: ['view', 'create'], dataScope: 'own' },
  ],

  // ===========================================
  // 👩‍💼 销售代表 Emma
  // ===========================================
  sales_rep_emma: [
    { module: 'crm', actions: ['view', 'create', 'edit'], dataScope: 'own' },
    { module: 'sales', actions: ['view', 'create', 'edit'], dataScope: 'own' },
    { module: 'procurement', actions: [], dataScope: 'own', restrictions: ['无访问权限'] },
    { module: 'logistics', actions: ['view'], dataScope: 'own' },
    { module: 'finance', actions: ['view'], dataScope: 'own', restrictions: ['销售金额，无成本'] },
    { module: 'product', actions: ['view'], dataScope: 'all' },
    { module: 'document', actions: ['view', 'create'], dataScope: 'own', restrictions: ['个人销售相关'] },
    { module: 'analytics', actions: ['view'], dataScope: 'own', restrictions: ['个人业绩'] },
    { module: 'system', actions: [], dataScope: 'own', restrictions: ['无访问权限'] },
    { module: 'communication', actions: ['view', 'create'], dataScope: 'own' },
  ],

  // ===========================================
  // 💰 财务人员
  // ===========================================
  finance: [
    { module: 'crm', actions: ['view'], dataScope: 'all', restrictions: ['无敏感客户信息'] },
    { module: 'sales', actions: ['view'], dataScope: 'all', restrictions: ['订单金额数据'] },
    { module: 'procurement', actions: ['view'], dataScope: 'all', restrictions: ['采购成本数据'] },
    { module: 'logistics', actions: ['view'], dataScope: 'all' },
    { module: 'finance', actions: ['view', 'create', 'edit', 'export'], dataScope: 'all' },
    { module: 'product', actions: ['view'], dataScope: 'all', restrictions: ['价格数据'] },
    { module: 'document', actions: ['view', 'create'], dataScope: 'all', restrictions: ['财务相关'] },
    { module: 'analytics', actions: ['view', 'export'], dataScope: 'all', restrictions: ['财务报表'] },
    { module: 'system', actions: [], dataScope: 'all', restrictions: ['无访问权限'] },
    { module: 'communication', actions: ['view', 'create'], dataScope: 'all' },
  ],

  // ===========================================
  // 🛒 采购人员
  // ===========================================
  procurement: [
    { module: 'crm', actions: [], dataScope: 'all', restrictions: ['无访问权限'] },
    { module: 'sales', actions: ['view'], dataScope: 'all', restrictions: ['订单需求，无客户信息'] },
    { module: 'procurement', actions: ['view', 'create', 'edit', 'manage'], dataScope: 'all' },
    { module: 'logistics', actions: ['view', 'create'], dataScope: 'all' },
    { module: 'finance', actions: ['view'], dataScope: 'all', restrictions: ['采购成本'] },
    { module: 'product', actions: ['view', 'create', 'edit'], dataScope: 'all' },
    { module: 'document', actions: ['view', 'create'], dataScope: 'all', restrictions: ['采购相关'] },
    { module: 'analytics', actions: ['view'], dataScope: 'all', restrictions: ['采购报表'] },
    { module: 'system', actions: [], dataScope: 'all', restrictions: ['无访问权限'] },
    { module: 'communication', actions: ['view', 'create'], dataScope: 'all' },
  ],
};

// ========================================
// 权限验证工具函数
// ========================================

// 检查用户是否有某个模块的某个操作权限
export function hasPermission(
  role: UserRole, 
  module: BusinessModule, 
  action: PermissionAction
): boolean {
  const permissions = ROLE_PERMISSION_MATRIX[role];
  const modulePermission = permissions.find(p => p.module === module);
  
  if (!modulePermission) return false;
  return modulePermission.actions.includes(action);
}

// 获取用户可访问的模块列表
export function getAccessibleModules(role: UserRole): BusinessModule[] {
  const permissions = ROLE_PERMISSION_MATRIX[role];
  return permissions
    .filter(p => p.actions.length > 0)
    .map(p => p.module);
}

// 获取用户的数据范围
export function getDataScope(role: UserRole, module: BusinessModule): DataScope {
  const permissions = ROLE_PERMISSION_MATRIX[role];
  const modulePermission = permissions.find(p => p.module === module);
  return modulePermission?.dataScope || 'own';
}

// 获取用户的所有权限
export function getUserPermissions(role: UserRole): ModulePermission[] {
  return ROLE_PERMISSION_MATRIX[role];
}

// 获取操作图标
export function getActionIcon(action: PermissionAction): string {
  const iconMap: Record<PermissionAction, string> = {
    view: '✅',
    create: '➕',
    edit: '✏️',
    delete: '🗑️',
    approve: '✔️',
    export: '📤',
    print: '🖨️',
    manage: '⚙️',
  };
  return iconMap[action];
}

// 获取数据范围图标
export function getDataScopeIcon(scope: DataScope): string {
  const iconMap: Record<DataScope, string> = {
    all: '🌐',
    region: '🌎',
    department: '🏢',
    subordinate: '👥',
    own: '👤',
  };
  return iconMap[scope];
}

// ========================================
// 用户数据类型
// ========================================
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  region?: 'NA' | 'SA' | 'EA' | 'all';
  department: string;
  avatar: string;
}

// ========================================
// 14个测试用户数据（按新的重要性排序）
// ========================================
export const DEMO_USERS: User[] = [
  // 1️⃣ 系统管理员
  {
    id: 'system.admin',
    name: '系统管理员',
    email: 'admin@cosun.com',
    role: 'system_admin',
    region: 'all',
    department: 'IT部',
    avatar: '🔧'
  },
  
  // 2️⃣ 营销人员（战略性角色）
  {
    id: 'marketing.manager',
    name: '市场经理',
    email: 'marketing@cosun.com',
    role: 'marketing',
    region: 'all',
    department: '市场部',
    avatar: '📱'
  },
  
  // 3️⃣ 运营专员（社媒运营+客户筛选）
  {
    id: 'marketing.ops',
    name: '运营专员',
    email: 'marketing.ops@cosun.com',
    role: 'marketing_ops',
    region: 'all',
    department: '市场部',
    avatar: '📱'
  },
  
  // 4️⃣ CEO
  {
    id: 'ceo',
    name: '张明',
    email: 'ceo@cosun.com',
    role: 'ceo',
    region: 'all',
    department: '管理层',
    avatar: '👨‍💼'
  },
  
  // 5️⃣ CFO
  {
    id: 'cfo',
    name: '李华',
    email: 'cfo@cosun.com',
    role: 'cfo',
    region: 'all',
    department: '财务部',
    avatar: '💼'
  },
  
  // 6️⃣ 销售总监
  {
    id: 'sales.director',
    name: '王强',
    email: 'sales.director@cosun.com',
    role: 'sales_director',
    region: 'all',
    department: '销售部',
    avatar: '📊'
  },
  
  // 7️⃣ 北美区域业务经理
  {
    id: 'regional.na',
    name: 'John Smith',
    email: 'john.smith@cosun.com',
    role: 'regional_manager_na',
    region: 'NA',
    department: '销售部（北美）',
    avatar: '🇺🇸'
  },
  
  // 8️⃣ 南美区域业务经理
  {
    id: 'regional.sa',
    name: 'Carlos Silva',
    email: 'carlos.silva@cosun.com',
    role: 'regional_manager_sa',
    region: 'SA',
    department: '销售部（南美）',
    avatar: '🇧🇷'
  },
  
  // 9️⃣ 欧非区域业务经理
  {
    id: 'regional.emea',
    name: 'Sophie Müller',
    email: 'sophie.muller@cosun.com',
    role: 'regional_manager_emea',
    region: 'EA',
    department: '销售部（欧非）',
    avatar: '🇪🇺'
  },
  
  // 🔟 销售代表 Maria（北美）
  {
    id: 'sales.maria',
    name: 'Maria Garcia',
    email: 'maria.garcia@cosun.com',
    role: 'sales_rep_maria',
    region: 'NA',
    department: '销售部（北美）',
    avatar: '👩‍💼'
  },
  
  // 1️⃣1️⃣ 销售代表 Ana（南美）
  {
    id: 'sales.ana',
    name: 'Ana Rodriguez',
    email: 'ana.rodriguez@cosun.com',
    role: 'sales_rep_ana',
    region: 'SA',
    department: '销售部（南美）',
    avatar: '👩‍💼'
  },
  
  // 1️⃣2️⃣ 销售代表 Emma（欧非）
  {
    id: 'sales.emma',
    name: 'Emma Wilson',
    email: 'emma.wilson@cosun.com',
    role: 'sales_rep_emma',
    region: 'EA',
    department: '销售部（欧非）',
    avatar: '👩‍💼'
  },
  
  // 1️⃣3️⃣ 财务人员
  {
    id: 'finance.manager',
    name: '赵敏',
    email: 'finance@cosun.com',
    role: 'finance',
    region: 'all',
    department: '财务部',
    avatar: '💰'
  },
  
  // 1️⃣4️⃣ 采购人员
  {
    id: 'procurement.manager',
    name: '刘洋',
    email: 'procurement@cosun.com',
    role: 'procurement',
    region: 'all',
    department: '采购部',
    avatar: '🛒'
  },
];