// 🔥 RBAC权限配置 - 基于角色的访问控制系统
// Role-Based Access Control Configuration

// 用户角色定义
export type UserRole = 
  | 'CEO'                  // 老板
  | 'CFO'                  // 财务总监
  | 'Sales_Director'       // 销售总监
  | 'Regional_Manager'     // 🆕 区域业务经理（管理本区域业务员）
  | 'Sales_Manager'        // 销售主管
  | 'Sales_Rep'            // 业务员
  | 'Finance'              // 财务
  | 'Procurement'          // 采购
  | 'Supplier'             // 供应商
  | 'Marketing_Ops'        // 运营专员（社媒营销与线索获取）
  | 'Documentation_Officer' // 🆕 单证员（出口单证管理）
  | 'Admin';               // 系统管理员

// 🔥 业务类型定义
export type BusinessType = 
  | 'trading'          // 直接采购
  | 'inspection'       // 验货服务
  | 'agency'           // 代理服务
  | 'project';         // 一站式项目

// 🔥 业务类型标签配置
export const BUSINESS_TYPE_LABELS: Record<BusinessType, {
  zh: string;
  en: string;
  icon: string;
  color: string;
  description: string;
}> = {
  trading: {
    zh: '直接采购',
    en: 'Direct Purchase',
    icon: '🛒',
    color: 'blue',
    description: '客户直接采购产品，我方负责采购和发货'
  },
  inspection: {
    zh: '验货服务',
    en: 'Inspection Service',
    icon: '🔍',
    color: 'green',
    description: '为客户提供第三方验货服务'
  },
  agency: {
    zh: '代理服务',
    en: 'Agency Service',
    icon: '🤝',
    color: 'purple',
    description: '作为客户的中国采购代理'
  },
  project: {
    zh: '一站式项目',
    en: 'One-Stop Project',
    icon: '🌟',
    color: 'orange',
    description: '为客户提供采购+验货+物流的一站式服务'
  }
};

// 用户对象
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  region?: 'NA' | 'SA' | 'EA' | 'all';  // 负责区域
  department?: string;
  avatar?: string;
}

// 🔥 权限定义 - 基于B2B外贸业务流程设计
export type Permission = 
  // ========== 数据查看范围权限 ==========
  | 'view:all_data'                    // 查看所有数据（CEO）
  | 'view:region_data'                 // 查看区域数据（区域主管）
  | 'view:own_data'                    // 查看自己的数据（业务员）
  | 'view:team_data'                   // 查看团队数据（主管）
  
  // ========== 财务数据查看权限 ==========
  | 'view:financial_summary'           // 查看财务汇总（主管级）
  | 'view:financial_detail'            // 查看财务明细（CEO/CFO）
  | 'view:profit_margin'               // 查看利润率（CEO/CFO/销售总监）
  | 'view:gross_profit'                // 查看毛利润（区域主管）
  | 'view:cost_data'                   // 查看成本明细（CEO/CFO/采购）
  | 'view:pricing_detail'              // 查看定价明细（CEO/CFO）
  
  // ========== 客户相关权限 ==========
  | 'view:customer_data'               // 查看客户数据
  | 'edit:customer_data'               // 编辑客户数据
  | 'delete:customer_data'             // 删除客户数据
  
  // ========== 供应商相关权限 ==========
  | 'view:supplier_data'               // 查看供应商数据
  | 'view:supplier_readonly'           // 查看供应商数据（只读）
  | 'edit:supplier_data'               // 编辑供应商数据
  | 'delete:supplier_data'             // 删除供应商数据
  
  // ========== 操作权限 ==========
  | 'edit:own_data'                    // 编辑自己的数据
  | 'edit:team_data'                   // 编辑团队数据
  | 'edit:region_data'                 // 编辑区域数据
  | 'edit:all_data'                    // 编辑所有数据
  | 'delete:own_data'                  // 删除自己的数据
  | 'delete:team_data'                 // 删除团队数据
  | 'delete:all_data'                  // 删除所有数据
  
  // ========== 审批权限 ==========
  | 'approve:quotation'                // 审批报价
  | 'approve:quotation_final'          // 最终审批报价（大额）
  | 'approve:contract'                 // 审批合同
  | 'approve:contract_final'           // 最终审批合同（大额）
  | 'approve:payment'                  // 审批付款
  | 'approve:payment_final'            // 最终审批付款（大额）
  | 'approve:collection'               // 审批收款
  
  // ========== 模块访问权限 ==========
  | 'access:dashboard'                 // 访问工作台
  | 'access:analytics'                 // 访问数据分析
  | 'access:customer_management'       // 访问客户管理
  | 'access:supplier_management'       // 访问供应商管理
  | 'access:service_provider'          // 访问服务商管理
  | 'access:inquiry_management'        // 访问询价管理
  | 'access:quotation_management'      // 访问报价管理
  | 'access:sales_contract'            // 访问销售合同
  | 'access:order_management'          // 访问订单管理
  | 'access:receivables'               // 访问应收账款
  | 'access:collection'                // 访问收款管理
  | 'access:payables'                  // 访问应付账款
  | 'access:payment'                   // 访问付款管理
  | 'access:purchase_orders'           // 访问采购订单
  | 'access:shipping'                  // 访问发货单据
  | 'access:settings'                  // 访问系统设置
  | 'access:user_management'           // 访问用户管理
  | 'access:backup_center'             // 访问数据备份中心
  | 'access:data_management'           // 访问数据管理（业务流程配置等）
  | 'access:quote_management'          // 访问报价管理
  | 'access:contract_management'       // 访问合同管理
  | 'access:product_management'        // 访问产品管理（运营专员）
  | 'access:product_push'              // 访问产品推送（运营专员）
  | 'access:social_media'              // 访问社交媒体营销（运营专员）
  | 'access:logistics_tracking'        // 访问物流可视化（业务部）
  | 'access:customer_credit'           // 访问客户信用评估（业务部）
  | 'access:finance_management';       // 访问财务管理（财务部）

// 🔥 角色权限配置矩阵 - 基于B2B外贸业务实战设计
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  // ========================================
  // 🎯 CEO（老板）- 公司最高决策者
  // ========================================
  CEO: [
    'view:all_data',
    'view:financial_summary',
    'view:financial_detail',
    'view:profit_margin',
    'view:gross_profit',
    'view:cost_data',
    'view:pricing_detail',
    'view:customer_data',
    'view:supplier_data',
    'edit:all_data',
    'delete:all_data',
    'edit:customer_data',
    'delete:customer_data',
    'edit:supplier_data',
    'delete:supplier_data',
    'approve:quotation',
    'approve:quotation_final',
    'approve:contract',
    'approve:contract_final',
    'approve:payment',
    'approve:payment_final',
    'approve:collection',
    'access:dashboard',
    'access:analytics',
    'access:customer_management',
    'access:supplier_management',
    'access:service_provider',
    'access:inquiry_management',
    'access:quotation_management',
    'access:sales_contract',
    'access:order_management',
    'access:receivables',
    'access:collection',
    'access:payables',
    'access:payment',
    'access:purchase_orders',
    'access:shipping',
    // ❌ 移除系统管理权限 - 以下权限只属于系统管理员（Admin）
    // 'access:settings',            // ❌ 系统设置（Admin专属）
    // 'access:user_management',     // ❌ 用户管理（Admin专属）
    // 'access:backup_center',       // ❌ 数据备份（Admin专属）
    // 'access:data_management',     // ❌ 数据管理（Admin专属）
    // 'access:workflow_engine',     // ❌ 智能流程引擎（Admin专属）
    // 'access:workflow_designer',   // ❌ 业务流程编辑器（Admin专属）
    // 'access:workflow_validator',  // ❌ 工作流验证中心（Admin专属）
    // 'access:form_builder',        // ❌ 表单管理中心（Admin专属）
    // 'access:state_simulator',     // ❌ 状态流转模拟器（Admin专属）
    'access:quote_management',
    'access:contract_management',
    'access:finance_management',    // 🔥 财务管理（核心职责）
    'access:product_management',    // 产品管理
    'access:product_push',          // 产品推送
    'access:social_media',          // 社交媒体营销
    'access:logistics_tracking',    // 物流追踪可视化
    'access:customer_credit',       // 客户信用评估
    'access:sales_forecast',        // 销售预测
  ],

  // ========================================
  // 💼 CFO（财务总监）- 财务负责人
  // ========================================
  // 🔥 角色定位：财务管理最高负责人，战略财务分析
  // ✅ 核心职责：财务管理、财务战略、供应商管理
  // ❌ 不能接触：客户关系管理、订单管理、发货管理、合同管理、客户信用评估（这些属于业务部门）
  CFO: [
    'view:all_data',
    'view:financial_summary',
    'view:financial_detail',
    'view:profit_margin',
    'view:gross_profit',
    'view:cost_data',
    'view:pricing_detail',
    'view:customer_data',
    'view:supplier_data',
    'edit:all_data',
    'approve:payment',
    'approve:payment_final',
    'approve:collection',
    'access:dashboard',
    'access:analytics',             // ✅ CFO财务管控中心（独立模块，左侧菜单显示）
    // ❌ 移除access:customer_management - CRM属于业务部门
    'access:supplier_management',
    'access:service_provider',
    // ❌ 移除access:sales_contract - 销售合同属于业务部门
    // ❌ 移除access:order_management - 订单管理属于业务部门
    'access:receivables',
    'access:collection',
    'access:payables',
    'access:payment',
    'access:purchase_orders',
    'access:backup_center',
    // ❌ 移除access:shipping - 发货管理属于业务部门
    // ❌ 移除access:contract_management - 合同管理属于业务部门
    'access:finance_management',    // ✅ 财务管理（核心职责）
    // ❌ 移除access:customer_credit - 客户信用评估属于业务部门
  ],

  // ========================================
  // 🎯 Sales_Director - 销售总监（管理全球销售）
  // ========================================
  // 职责：销售团队管理、客户管理、报价审批、合同审批
  // 特点：前台业务全权限、不能访问供应商、能看毛利
  Sales_Director: [
    'view:all_data',
    'view:team_data',
    'view:customer_data',
    'view:financial_summary',
    'view:gross_profit',
    // ❌ 移除供应商相关权限 - 销售不能接触供应商信息
    'edit:team_data',
    'delete:team_data',
    'edit:customer_data',
    'approve:quotation',
    'approve:contract',
    'access:dashboard',
    'access:analytics',
    'access:customer_management',
    'access:inquiry_management',
    'access:quotation_management',
    'access:sales_contract',
    'access:order_management',
    'access:receivables',
    'access:collection',
    'access:shipping',
    'access:quote_management',      // 🔥 新增：报价管理权限
    'access:contract_management',   // 🔥 新增：合同管理权限
    'access:logistics_tracking',    // 🔥 新增：物流可视化权限（业务部）
    'access:customer_credit',       // 🔥 新增：客户信用评估权限（业务部）
    // ❌ 移除供应商管理权限 - 前后台严格分离
  ],

  // ========================================
  // 🆕 Regional_Manager - 区域业务经理（管理本区域业务员）
  // ========================================
  // 职责：区域销售团队管理、客户管理、报价审批、合同审批
  // 特点：前台业务全权限、不能访问供应商、能看毛利
  Regional_Manager: [
    'view:region_data',
    'view:team_data',
    'view:customer_data',
    'view:financial_summary',
    'view:gross_profit',
    // ❌ 移除供应商相关权限 - 销售不能接触供应商信息
    'edit:team_data',
    'delete:team_data',
    'edit:customer_data',
    'approve:quotation',
    'approve:contract',
    'access:dashboard',
    'access:analytics',
    'access:customer_management',
    'access:inquiry_management',
    'access:quotation_management',
    'access:sales_contract',
    'access:order_management',
    'access:receivables',
    'access:collection',
    'access:shipping',
    'access:quote_management',      // 🔥 新增：报价管理权限
    'access:contract_management',   // 🔥 新增：合同管理权限
    'access:logistics_tracking',    // 🔥 新增：物流可视化权限（业务部）
    'access:customer_credit',       // 🔥 新增：客户信用评估权限（业务部）
    // ❌ 移除供应商管理权限 - 前后台严格分离
  ],

  // ========================================
  // 🎯 Sales_Manager - 销售主管（根据region区分）
  // ========================================
  // 分为两类：
  // 1. 销售总监（region='all'）- 管理全球销售
  // 2. 区域主管（region='NA'/'SA'/'EA'）- 管理单个区域
  // 
  // 职责：销售团队管理、客户管理、报价审批、合同审批
  // 特点：前台业务全权限、不能访问供应商、能看毛利
  Sales_Manager: [
    'view:region_data',
    'view:team_data',
    'view:customer_data',
    'view:financial_summary',
    'view:gross_profit',
    // ❌ 移除供应商相关权限 - 销售不能接触供应商信息
    'edit:team_data',
    'edit:region_data',
    'delete:team_data',
    'edit:customer_data',
    'approve:quotation',
    'approve:contract',
    'access:dashboard',
    'access:analytics',
    'access:customer_management',
    'access:inquiry_management',
    'access:quotation_management',
    'access:sales_contract',
    'access:order_management',
    'access:receivables',
    'access:collection',
    'access:shipping',
    'access:quote_management',      // 🔥 新增：报价管理权限
    'access:contract_management',   // 🔥 新增：合同管理权限
    'access:logistics_tracking',    // 🔥 新增：物流可视化权限（业务部）
    'access:customer_credit',       // 🔥 新增：客户信用评估权限（业务部）
    // ❌ 移除供应商管理权限 - 前后台严格分离
  ],

  // ========================================
  // 👨‍💼 Sales_Rep（业务员）- 一线销售人员
  // ========================================
  Sales_Rep: [
    'view:own_data',
    'view:customer_data',
    'edit:own_data',
    'delete:own_data',
    'edit:customer_data',
    'access:dashboard',
    'access:customer_management',
    'access:inquiry_management',
    'access:quotation_management',
    'access:sales_contract',
    'access:order_management',
    'access:receivables',
    'access:shipping',
    'access:quote_management',      // 🔥 新增：报价管理权限
    'access:contract_management',   // 🔥 新增：合同管理权限
    'access:logistics_tracking',    // 🔥 新增：物流可视化权限（业务部）
    'access:customer_credit',       // 🔥 新增：客户信用评估权限（业务部）
  ],

  // ========================================
  // 🛒 Procurement（采购专员）- 采购负责人
  // ========================================
  // 🔥 角色定位：供应链管理，负责供应商关系和采购执行
  // ✅ 核心职责：供应商管理、服务商管理、发货管理
  // ❌ 不能接触：客户信息、财务敏感数据、销售业务、战略分析、物流追踪
  Procurement: [
    'view:supplier_data',         // ✅ 查看供应商数据（核心职责）
    'edit:supplier_data',         // ✅ 编辑供应商数据
    'delete:supplier_data',       // ✅ 删除供应商数据
    'access:dashboard',           // ✅ 访问工作台
    'access:supplier_management', // ✅ 供应商管理（核心职责）
    'access:service_provider',    // ✅ 服务商管理（核心职责）
    'access:shipping',            // ✅ 发货管理（核心职责）
    // ❌ 移除access:logistics_tracking - 物流追踪属于业务部门
    // ❌ 移除access:order_management - 订单管理属于业务部门
    // ❌ 移除access:analytics - 采购不需要战略分析
    // ❌ 移除access:sales_contract - 采购不应接触销售合同
    // ❌ 移除access:payables - 付款由财务部门负责
    // ❌ 移除access:payment - 付款由财务部门负责
    // ❌ 移除access:purchase_orders - 这个权限名称有歧义，暂时移除
    // ❌ 移除view:all_data - 采购不应查看所有数据
    // ❌ 移除view:financial_summary - 采购不应查看财务汇总
    // ❌ 移除view:cost_data - 成本数据属于财务敏感信息
    // ❌ 移除edit:all_data - 权限过大
  ],

  // ========================================
  // 💰 Finance（财务专员）- 财务执行人员
  // ========================================
  // 🔥 角色定位：财务执行，负责应收应付、财务审核
  // ✅ 核心职责：财务管理、供应商付款
  // ❌ 不能接触：客户关系管理、销售业务流程、战略分析、发货管理、合同管理、客户信用评估
  Finance: [
    'view:financial_summary',     // ✅ 查看财务汇总
    'view:customer_data',         // ✅ 查看客户数据（用于收款）
    'view:supplier_data',         // ✅ 查看供应商数据（用于付款）
    'edit:all_data',              // ✅ 编辑财务相关数据
    'access:dashboard',           // ✅ 访问工作台
    'access:supplier_management', // ✅ 供应商管理（用于付款和对账）
    'access:service_provider',    // ✅ 服务商管理（用于付款）
    'access:receivables',         // ✅ 应收账款（核心职责，通过此模块查看订单财务信息）
    'access:collection',          // ✅ 收款管理（核心职责）
    'access:payables',            // ✅ 应付账款（核心职责）
    'access:payment',             // ✅ 付款管理（核心职责）
    // ❌ 移除access:shipping - 发货管理属于业务部门和采购部门
    // ❌ 移除access:contract_management - 合同管理属于业务部门
    'access:finance_management',  // ✅ 财务管理（核心职责）
    // ❌ 移除access:customer_credit - 客户信用评估属于业务部门
    // ❌ 移除access:customer_management - 财务不直接管理客户关系
    // ❌ 移除access:order_management - 订单管理属于业务部门
    // ❌ 移除access:sales_contract - 销售合同由业务部门负责
    // ❌ 移除access:purchase_orders - 采购订单由采购部门负责
  ],

  // ========================================
  // 🔧 Admin（系统管理员）- 技术支持与系统维护
  // ========================================
  // 🔥 角色定位：IT技术人员，负责系统配置和维护
  // ✅ 有权限：系统设置、用户管理、数据备份、权限配置
  // ❌ 无权限：业务数据、财务数据、审批流程（这些属于CEO）
  Admin: [
    'access:dashboard',           // ✅ 访问工作台
    'access:settings',            // ✅ 系统设置（核心职责）
    'access:user_management',     // ✅ 用户管理（核心职责）
    'access:backup_center',       // ✅ 数据备份（核心职责）
    'access:data_management',     // ✅ 数据管理（核心职责）
    // ❌ 移除access:quote_management - 业务模块，不应访问
    // ❌ 移除access:contract_management - 业务模块，不应访问
    // ❌ 移除业务模块访问权限 - 系统管理员不应参与业务决策
    // ❌ 移除财务模块访问权限 - 财务数据属于CEO/CFO/Finance职责
    // ❌ 移除审批权限 - 审批属于业务决策，不是技术职责
  ],

  // ========================================
  // 📈 Marketing_Ops（运营专员）- 社媒营销与线索获取
  // ========================================
  // 🔥 角色定位：社交媒体运营，负责内容营销和潜在客户获取
  // ✅ 核心职责：社媒运营、产品推送、线索获取、为业务员输送客户
  // ❌ 不能报价、不能签合同、不能接触财务、不能接触供应商
  Marketing_Ops: [
    'view:own_data',              // 🔥 只能查看自己的数据
    'edit:own_data',              // 编辑自己的营销内容
    'access:dashboard',           // ✅ 访问工作台
    'access:product_management',  // ✅ 访问产品管理（核心职责）
    'access:product_push',        // ✅ 访问产品推送（核心职责）
    'access:social_media',        // ✅ 访问社交媒体营销（核心职责）
    // ❌ 移除access:analytics - 运营专员不需要战略分析
    // ❌ 移除access:customer_management - 运营专员不直接管理客户
    // ❌ 移除access:inquiry_management - 运营专员不处理询价
    // ❌ 不能报价管理 - 这是业务员的工作
    // ❌ 不能合同管理 - 这是业务员的工作
    // ❌ 不能订单管理 - 这是业务员的工作
    // ❌ 不能财务管理 - 不应接触财务信息
    // ❌ 不能供应商管理 - 后台业务，不应接触
    // ❌ 不能审批 - 不参与业务决策
  ],

  // ========================================
  // 🛍️ Supplier（供应商）- 外部供应商Portal
  // ========================================
  // 🔥 角色定位：外部供应商，通过Supplier Portal登录系统
  // ✅ 核心职责：查看自己的采购订单、更新发货信息、查看付款状态
  // ❌ 严格限制：不能看到公司内部任何战略数据、其他供应商信息、客户信息
  Supplier: [
    'view:own_data',              // ✅ 只能查看自己的数据（核心限制）
    'edit:own_data',              // ✅ 只能编辑自己的数据
    'access:dashboard',           // ✅ 访问工作台（Supplier Portal专用）
    // ❌ 移除access:analytics - 供应商不应看到公司战略数据
    // ❌ 移除access:supplier_management - 供应商不应看到其他供应商信息
    // ❌ 移除access:service_provider - 供应商不应看到服务商信息
    // ❌ 移除view:all_data - 供应商只能看自己的数据
    // ❌ 移除view:supplier_data - 供应商不应看到其他供应商数据
    // ❌ 移除edit:supplier_data - 供应商不应编辑供应商管理数据
    // ❌ 不能客户管理 - 这是销售部门的工作
    // ❌ 不能财务信息 - 不应接触公司财务信息
    // ❌ 不能审批 - 不参与公司内部决策
  ],

  // ========================================
  // 📄 Documentation_Officer（单证员）- 出口单证管理
  // ========================================
  // 🔥 角色定位：单证员，负责出口单证的制作和管理
  // ✅ 核心职责：制作和管理出口单证、处理物流相关文件
  // ❌ 不能接触：客户信息、财务数据、销售业务、供应商信息
  Documentation_Officer: [
    'view:own_data',              // 🔥 只能查看自己的数据
    'edit:own_data',              // 编辑自己的单证数据
    'access:dashboard',           // ✅ 访问工作台
    'access:shipping',            // ✅ 访问发货管理（核心职责）
    // ❌ 移除access:logistics_tracking - 物流追踪属于业务部门
    // ❌ 移除access:product_management - 产品管理属于运营部门
    // ❌ 移除access:product_push - 产品推送属于运营部门
    // ❌ 移除access:social_media - 社媒营销属于运营部门
    // ❌ 移除access:analytics - 单证员不需要战略分析
    // ❌ 移除access:customer_management - 单证员不直接管理客户
    // ❌ 移除access:inquiry_management - 单证员不处理询价
    // ❌ 不能报价管理 - 这是业务员的工作
    // ❌ 不能合同管理 - 这是业务员的工作
    // ❌ 不能订单管理 - 这是业务员的工作
    // ❌ 不能财务管理 - 不应接触财务信息
    // ❌ 不能供应商管理 - 后台业务，不应接触
    // ❌ 不能审批 - 不参与业务决策
  ],
};

// 🔥 角色显示名称
export const ROLE_LABELS: Record<UserRole, { zh: string; en: string; color: string }> = {
  CEO: { zh: '老板', en: 'CEO', color: 'purple' },
  CFO: { zh: '财务总监', en: 'CFO', color: 'blue' },
  Sales_Director: { zh: '销售总监', en: 'Sales Director', color: 'green' },
  Regional_Manager: { zh: '区域业务经理', en: 'Regional Manager', color: 'green' },
  Sales_Manager: { zh: '销售主管', en: 'Sales Manager', color: 'green' },
  Sales_Rep: { zh: '业务员', en: 'Sales Rep', color: 'orange' },
  Finance: { zh: '财务', en: 'Finance', color: 'cyan' },
  Procurement: { zh: '采购', en: 'Procurement', color: 'yellow' },
  Supplier: { zh: '供应商', en: 'Supplier', color: 'brown' },
  Marketing_Ops: { zh: '运营专员', en: 'Marketing Ops', color: 'pink' },
  Documentation_Officer: { zh: '单证员', en: 'Documentation Officer', color: 'teal' },
  Admin: { zh: '系统管理员', en: 'Admin', color: 'red' },
};

// 🔥 权限检查函数（支持基于region的动态权限扩展）
export function hasPermission(user: User, permission: Permission): boolean {
  const userPermissions = ROLE_PERMISSIONS[user.role] || [];
  
  // ========================================
  // 🎯 特殊处理：Sales_Manager根据region获得不同权限
  // ========================================
  if (user.role === 'Sales_Manager' && user.region === 'all') {
    // 🌟 销售总监（region='all'）额外权限扩展
    
    // 1. 数据查看范围扩展：区域→全局
    if (permission === 'view:all_data') {
      return true; // 销售总监可以查看所有区域的销售数据
    }
    
    // 2. 财务数据权限扩展：可以看利润率
    if (permission === 'view:profit_margin') {
      return true; // 销售总监可以查看利润率（但不能看详细成本）
    }
    
    // ❌ 3. 供应商数据权限 - 严格禁止
    // 销售部门（包括销售总监）不能访问任何供应商信息
    // 这是前后台分离的核心原则，防止成本泄露
    if (permission === 'view:supplier_data') {
      return false; // 销售总监不能查看供应商数据
    }
    
    if (permission === 'view:supplier_readonly') {
      return false; // 销售总监不能查看供应商数据（只读也不行）
    }
    
    if (permission === 'access:supplier_management') {
      return false; // 销售总监不能访问供应商管理模块
    }
    
    if (permission === 'access:service_provider') {
      return false; // 销售总监不能访问服务商管理模块
    }
    
    // 4. 后台财务模块 - 严格禁止
    if (permission === 'access:payables') {
      return false; // 销售总监不能访问应付账款（采购和财务的职责）
    }
    
    if (permission === 'access:payment') {
      return false; // 销售总监不能访问付款管理（财务职责）
    }
    
    if (permission === 'access:purchase_orders') {
      return false; // 销售总监不能访问采购订单（采购职责）
    }
    
    // 5. 编辑权限扩展
    if (permission === 'edit:all_data') {
      // 销售总监可以编辑所有销售相关数据（但不包括财务和采购数据）
      return true;
    }
    
    if (permission === 'delete:all_data') {
      return false; // 销售总监不能删除（需要CEO权限）
    }
    
    // 6. 审批权限扩展
    if (permission === 'approve:quotation_final') {
      return true; // 销售总监有最终报价审批权
    }
    
    if (permission === 'approve:contract_final') {
      return true; // 销售总监有最终合同审批权
    }
    
    if (permission === 'approve:payment') {
      return false; // 销售总监不能审批付款（财务职责）
    }
  }
  
  // 基础权限检查
  return userPermissions.includes(permission);
}

// 🔥 批量权限检查
export function hasAnyPermission(user: User, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(user, permission));
}

// 🔥 检查是否有所有权限
export function hasAllPermissions(user: User, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(user, permission));
}

// 🔥 获取用户可访问的模块列表
export function getAccessibleModules(user: User): string[] {
  const userPermissions = ROLE_PERMISSIONS[user.role] || [];
  return userPermissions
    .filter(p => p.startsWith('access:'))
    .map(p => p.replace('access:', ''));
}

// 🔥 获取用户角色显示名称（根据region区分）
export function getUserRoleLabel(user: User): { zh: string; en: string; color: string } {
  const baseLabel = ROLE_LABELS[user.role];
  
  // 🔥 特殊处理：区分销售总监和区域主管
  if (user.role === 'Sales_Manager') {
    if (user.region === 'all') {
      return { zh: '销售总监', en: 'Sales Director', color: 'green' };
    } else {
      const regionNames = {
        'NA': { zh: '北美主管', en: 'NA Regional Manager' },
        'SA': { zh: '南美主管', en: 'SA Regional Manager' },
        'EA': { zh: '欧非主管', en: 'EMEA Regional Manager' }
      };
      const regionLabel = regionNames[user.region as 'NA' | 'SA' | 'EA'];
      if (regionLabel) {
        return { ...regionLabel, color: 'green' };
      }
    }
  }
  
  return baseLabel;
}

// 🔥 检查用户是否可以查看敏感字段（利润率、成本等）
export type SensitiveField = 
  | 'profit_margin'      // 利润率
  | 'cost_price'         // 成本价
  | 'customer_contact'   // 客户联系方式
  | 'supplier_price'     // 供应商价格
  | 'commission';        // 佣金信息

export function canViewSensitiveField(user: User, field: SensitiveField): boolean {
  switch (field) {
    case 'profit_margin':
      // 利润率：CEO、CFO、财务、销售主管（全局）可以查看
      return user.role === 'CEO' 
          || user.role === 'CFO' 
          || user.role === 'Finance' 
          || (user.role === 'Sales_Manager' && user.region === 'all');
    
    case 'cost_price':
      // 成本价：CEO、CFO、财务、采购可以查看
      return user.role === 'CEO' 
          || user.role === 'CFO' 
          || user.role === 'Finance' 
          || user.role === 'Procurement';
    
    case 'customer_contact':
      // 客户联系方式：CEO、销售主管、业务员、运营专员可以查看
      return user.role === 'CEO' 
          || user.role === 'Sales_Manager' 
          || user.role === 'Sales_Rep' 
          || user.role === 'Marketing_Ops';
    
    case 'supplier_price':
      // 供应商价格：CEO、CFO、财务、采购可以查看
      return user.role === 'CEO' 
          || user.role === 'CFO' 
          || user.role === 'Finance' 
          || user.role === 'Procurement';
    
    case 'commission':
      // 佣金信息：CEO、CFO、财务、销售主管、业务员可以查看
      return user.role === 'CEO' 
          || user.role === 'CFO' 
          || user.role === 'Finance' 
          || user.role === 'Sales_Manager' 
          || user.role === 'Sales_Rep';
    
    default:
      return false;
  }
}

// 🔥 获取数据过滤器（根据用户角色和区域）
export function getDataFilter(user: User): {
  type: 'all' | 'region' | 'team' | 'own' | 'none';
  region?: string;
  userId?: string;
} {
  // CEO/CFO - 查看所有数据
  if (user.role === 'CEO' || user.role === 'CFO') {
    return { type: 'all' };
  }
  
  // 采购/财务 - 查看所有数据（在各自领域）
  if (user.role === 'Procurement' || user.role === 'Finance') {
    return { type: 'all' };
  }
  
  // 运营专员 - 查看所有数据（用于内容创作和了解业务）
  if (user.role === 'Marketing_Ops') {
    return { type: 'all' };
  }
  
  // 销售总监 - 查看所有区域数据
  if (user.role === 'Sales_Manager' && user.region === 'all') {
    return { type: 'all' };
  }
  
  // 区域主管 - 查看本区域数据
  if (user.role === 'Sales_Manager' && user.region) {
    return { type: 'region', region: user.region };
  }
  
  // 业务员 - 只能看自己的数据
  if (user.role === 'Sales_Rep') {
    return { type: 'own', userId: user.id };
  }
  
  // Admin - 无数据访问权限（只有系统管理权限）
  if (user.role === 'Admin') {
    return { type: 'none' };
  }
  
  // 默认：只能看自己的数据
  return { type: 'own', userId: user.id };
}

// 🔥 模拟用户数据（用于测试）
export const DEMO_USERS: User[] = [
  {
    id: 'ceo',
    name: '张明',
    email: 'ceo@cosun.com',
    role: 'CEO',
    region: 'all',
    department: '管理层',
    avatar: '👨‍💼'
  },
  {
    id: 'cfo',
    name: '李华',
    email: 'cfo@cosun.com',
    role: 'CFO',
    region: 'all',
    department: '财务部',
    avatar: '💼'
  },
  {
    id: 'sales.director',
    name: '王强',
    email: 'sales.director@cosun.com',
    role: 'Sales_Director', // 🔥 修复：从 Sales_Manager 改为 Sales_Director
    region: 'all',
    department: '销售部',
    avatar: '🎯'
  },
  {
    id: 'john.smith',
    name: '刘建国',
    email: 'john.smith@cosun.com',
    role: 'Sales_Manager',
    region: 'NA',
    department: '销售部-北美',
    avatar: '👔'
  },
  {
    id: 'carlos.silva',
    name: '陈明华',
    email: 'carlos.silva@cosun.com',
    role: 'Sales_Manager',
    region: 'SA',
    department: '销售部-南美',
    avatar: '👨‍💼'
  },
  {
    id: 'hans.mueller',
    name: '赵国强',
    email: 'hans.mueller@cosun.com',
    role: 'Sales_Manager',
    region: 'EA',
    department: '销售部-欧非',
    avatar: '👨‍💼'
  },
  {
    id: 'sales1',
    name: '张伟',
    email: 'zhangwei@cosun.com',  // 🔥 修改为中文名对应的拼音邮箱
    role: 'Sales_Rep',
    region: 'NA',
    department: '销售部-北美',
    avatar: '👨‍💼'  // 🔥 改为男性图标
  },
  {
    id: 'sales2',
    name: '李芳',
    email: 'lifang@cosun.com',  // 🔥 修改为中文名对应的拼音邮箱
    role: 'Sales_Rep',
    region: 'SA',
    department: '销售部-南美',
    avatar: '👩‍💼'
  },
  {
    id: 'sales3',
    name: '王芳',
    email: 'wangfang@cosun.com',  // 🔥 修改为中文名对应的拼音邮箱
    role: 'Sales_Rep',
    region: 'EA',
    department: '销售部-欧非',
    avatar: '👩‍💼'
  },
  {
    id: 'finance',
    name: '赵敏',
    email: 'finance@cosun.com',
    role: 'Finance',
    region: 'all',
    department: '财务部',
    avatar: '💰'
  },
  {
    id: 'procurement',
    name: '刘刚',
    email: 'procurement@cosun.com',
    role: 'Procurement',
    region: 'all',
    department: '采购部',
    avatar: '🛒'
  },
  {
    id: 'admin',
    name: '系统管理员',
    email: 'admin@cosun.com',
    role: 'Admin',
    region: 'all',
    department: 'IT部',
    avatar: '🔧'
  },
  {
    id: 'marketing_ops',
    name: '李娜',
    email: 'marketing@cosun.com',
    role: 'Marketing_Ops',
    region: 'all',
    department: '市场部',
    avatar: '📱'
  },
  {
    id: 'documentation_officer',
    name: '张晖',  // 🔥 修改为张晖，避免和业务员张伟重名
    email: 'zhanghui@cosun.com',  // 🔥 修改为对应的拼音邮箱
    role: 'Documentation_Officer',
    region: 'all',
    department: '单证管理部',
    avatar: '📄'
  },
  // 🔥 移除供应商角色 - 供应商属于Supplier Portal，不属于Admin Portal
  // {
  //   id: 'supplier',
  //   name: '张伟',
  //   email: 'supplier@cosun.com',
  //   role: 'Supplier',
  //   region: 'all',
  //   department: '供应商管理',
  //   avatar: '🛍️'
  // }
];