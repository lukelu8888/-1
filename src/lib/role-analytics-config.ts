// 🔥 角色专属数据分析配置
// 根据不同角色显示不同的KPI、图表和数据视图

import { UserRole, BusinessType, BUSINESS_TYPE_LABELS } from './rbac-config';

// 📊 KPI指标类型定义
export type KPIType = 
  | 'revenue'           // 营收
  | 'orders'            // 订单数
  | 'customers'         // 客户数
  | 'avg_order_value'   // 平均订单额
  | 'profit_margin'     // 利润率
  | 'cost'              // 成本
  | 'receivables'       // 应收账款
  | 'payables'          // 应付账款
  | 'suppliers'         // 供应商数
  | 'purchase_orders'   // 采购订单数
  | 'inquiries'         // 询价数
  | 'quotations'        // 报价数
  | 'conversion_rate'   // 转化率
  | 'pending_payment'   // 待收款
  | 'pending_approval'  // 待审批
  // 🔥 业务类型专属KPI
  | 'inspection_count'  // 验货次数
  | 'inspection_pass_rate' // 验货通过率
  | 'inspection_revenue'   // 验货服务费
  | 'agency_commission'    // 代理佣金
  | 'agency_orders'        // 代理订单数
  | 'project_count'        // 项目数量
  | 'project_progress'     // 项目进度
  | 'service_satisfaction'; // 服务满意度

// 📈 图表类型定义
export type ChartType =
  | 'revenue_trend'       // 营收趋势
  | 'order_trend'         // 订单趋势
  | 'product_category'    // 产品分类
  | 'customer_ranking'    // 客户排名
  | 'sales_performance'   // 销售业绩
  | 'receivables_aging'   // 账龄分析
  | 'payables_aging'      // 应付账龄
  | 'supplier_ranking'    // 供应商排名
  | 'purchase_trend'      // 采购趋势
  | 'inquiry_funnel'      // 询价漏斗
  | 'region_comparison';  // 区域对比

// 📋 数据表类型定义
export type TableType =
  | 'top_products'        // 热销产品
  | 'top_customers'       // 重点客户
  | 'top_suppliers'       // 主要供应商
  | 'recent_orders'       // 近期订单
  | 'pending_receivables' // 待收款项
  | 'pending_payables'    // 待付款项
  | 'team_performance'    // 团队业绩
  | 'my_performance'      // 个人业绩
  | 'recent_inquiries'    // 近期询价
  | 'recent_quotations';  // 近期报价

// 🎯 角色数据分析配置
export interface RoleAnalyticsConfig {
  role: UserRole;
  dashboardTitle: string;
  description: string;
  kpis: KPIType[];
  charts: {
    main: ChartType[];      // 主图表区（上方大图）
    secondary: ChartType[]; // 次要图表区（下方小图）
  };
  tables: TableType[];
  features: {
    canExport: boolean;
    canViewSensitive: boolean;
    canCompareRegions: boolean;
    canViewTeamData: boolean;
  };
}

// 🔥 各角色的数据分析配置
export const ROLE_ANALYTICS_CONFIG: Record<UserRole, RoleAnalyticsConfig> = {
  // 👨‍💼 老板 - 全局视图，所有数据
  CEO: {
    role: 'CEO',
    dashboardTitle: '全局数据总览',
    description: '公司整体运营数据分析',
    kpis: ['revenue', 'profit_margin', 'orders', 'customers', 'receivables', 'payables'],
    charts: {
      main: ['revenue_trend', 'region_comparison'],
      secondary: ['product_category', 'sales_performance', 'receivables_aging'],
    },
    tables: ['top_products', 'top_customers', 'team_performance'],
    features: {
      canExport: true,
      canViewSensitive: true,
      canCompareRegions: true,
      canViewTeamData: true,
    },
  },

  // 💼 财务总监 - 财务全局视图
  CFO: {
    role: 'CFO',
    dashboardTitle: '财务数据总览',
    description: '全局财务数据分析与资金流向',
    kpis: ['revenue', 'profit_margin', 'cost', 'receivables', 'payables', 'pending_payment'],
    charts: {
      main: ['revenue_trend', 'receivables_aging'],
      secondary: ['payables_aging', 'product_category'],
    },
    tables: ['pending_receivables', 'pending_payables', 'top_customers'],
    features: {
      canExport: true,
      canViewSensitive: true,
      canCompareRegions: true,
      canViewTeamData: false,
    },
  },

  // 👔 销售主管 - 区域销售数据
  Sales_Manager: {
    role: 'Sales_Manager',
    dashboardTitle: '区域销售数据',
    description: '区域销售业绩与团队管理',
    kpis: ['revenue', 'orders', 'customers', 'avg_order_value', 'conversion_rate'],
    charts: {
      main: ['revenue_trend', 'order_trend'],
      secondary: ['product_category', 'team_performance'],
    },
    tables: ['top_products', 'top_customers', 'team_performance'],
    features: {
      canExport: true,
      canViewSensitive: false,
      canCompareRegions: false,
      canViewTeamData: true,
    },
  },

  // 👨‍💼 业务员 - 个人业务数据
  Sales_Rep: {
    role: 'Sales_Rep',
    dashboardTitle: '我的业务数据',
    description: '个人客户与订单数据分析',
    kpis: ['revenue', 'orders', 'customers', 'inquiries', 'quotations', 'conversion_rate'],
    charts: {
      main: ['revenue_trend', 'inquiry_funnel'],
      secondary: ['product_category', 'customer_ranking'],
    },
    tables: ['my_performance', 'top_customers', 'recent_inquiries', 'recent_quotations'],
    features: {
      canExport: false,
      canViewSensitive: false,
      canCompareRegions: false,
      canViewTeamData: false,
    },
  },

  // 💰 财务专员 - 应收应付数据
  Finance: {
    role: 'Finance',
    dashboardTitle: '财务收付数据',
    description: '应收应付账款与收付款管理',
    kpis: ['receivables', 'payables', 'pending_payment', 'orders'],
    charts: {
      main: ['receivables_aging', 'payables_aging'],
      secondary: ['revenue_trend'],
    },
    tables: ['pending_receivables', 'pending_payables', 'recent_orders'],
    features: {
      canExport: true,
      canViewSensitive: false,
      canCompareRegions: true,
      canViewTeamData: false,
    },
  },

  // 🛒 采购专员 - 供应商与采购数据
  Procurement: {
    role: 'Procurement',
    dashboardTitle: '采购与供应商数据',
    description: '供应商管理与采购订单分析',
    kpis: ['purchase_orders', 'suppliers', 'payables', 'cost', 'pending_approval'],
    charts: {
      main: ['purchase_trend', 'supplier_ranking'],
      secondary: ['payables_aging', 'product_category'],
    },
    tables: ['top_suppliers', 'pending_payables', 'recent_orders'],
    features: {
      canExport: true,
      canViewSensitive: true, // 采购需要看成本
      canCompareRegions: false,
      canViewTeamData: false,
    },
  },

  // 🔧 系统管理员 - 系统运营数据
  Admin: {
    role: 'Admin',
    dashboardTitle: '系统运营数据',
    description: '系统使用情况与数据统计',
    kpis: ['orders', 'customers', 'suppliers', 'inquiries', 'quotations'],
    charts: {
      main: ['order_trend', 'region_comparison'],
      secondary: ['product_category'],
    },
    tables: ['recent_orders', 'top_customers', 'top_suppliers'],
    features: {
      canExport: true,
      canViewSensitive: false,
      canCompareRegions: true,
      canViewTeamData: false,
    },
  },
};

// 🔥 KPI元数据配置
export const KPI_METADATA: Record<KPIType, {
  label: string;
  icon: string;
  color: string;
  formatter: (value: number, currency?: string) => string;
}> = {
  revenue: {
    label: 'Total Revenue',
    icon: 'DollarSign',
    color: 'bg-red-600',
    formatter: (value, currency = 'USD') => `${currency} ${(value / 1000).toFixed(0)}K`,
  },
  orders: {
    label: 'Total Orders',
    icon: 'Package',
    color: 'bg-blue-600',
    formatter: (value) => value.toString(),
  },
  customers: {
    label: 'Active Customers',
    icon: 'Users',
    color: 'bg-purple-600',
    formatter: (value) => value.toString(),
  },
  avg_order_value: {
    label: 'Avg Order Value',
    icon: 'TrendingUp',
    color: 'bg-green-600',
    formatter: (value, currency = 'USD') => `${currency} ${(value / 1000).toFixed(1)}K`,
  },
  profit_margin: {
    label: 'Profit Margin',
    icon: 'TrendingUp',
    color: 'bg-purple-600',
    formatter: (value) => `${value.toFixed(1)}%`,
  },
  cost: {
    label: 'Total Cost',
    icon: 'DollarSign',
    color: 'bg-orange-600',
    formatter: (value, currency = 'USD') => `${currency} ${(value / 1000).toFixed(0)}K`,
  },
  receivables: {
    label: 'Receivables',
    icon: 'FileText',
    color: 'bg-blue-600',
    formatter: (value, currency = 'USD') => `${currency} ${(value / 1000).toFixed(0)}K`,
  },
  payables: {
    label: 'Payables',
    icon: 'FileText',
    color: 'bg-red-600',
    formatter: (value, currency = 'USD') => `${currency} ${(value / 1000).toFixed(0)}K`,
  },
  suppliers: {
    label: 'Active Suppliers',
    icon: 'Factory',
    color: 'bg-cyan-600',
    formatter: (value) => value.toString(),
  },
  purchase_orders: {
    label: 'Purchase Orders',
    icon: 'ShoppingCart',
    color: 'bg-blue-600',
    formatter: (value) => value.toString(),
  },
  inquiries: {
    label: 'Inquiries',
    icon: 'MessageSquare',
    color: 'bg-yellow-600',
    formatter: (value) => value.toString(),
  },
  quotations: {
    label: 'Quotations',
    icon: 'FileText',
    color: 'bg-indigo-600',
    formatter: (value) => value.toString(),
  },
  conversion_rate: {
    label: 'Conversion Rate',
    icon: 'Target',
    color: 'bg-green-600',
    formatter: (value) => `${value.toFixed(1)}%`,
  },
  pending_payment: {
    label: 'Pending Payment',
    icon: 'Clock',
    color: 'bg-orange-600',
    formatter: (value, currency = 'USD') => `${currency} ${(value / 1000).toFixed(0)}K`,
  },
  pending_approval: {
    label: 'Pending Approval',
    icon: 'AlertCircle',
    color: 'bg-yellow-600',
    formatter: (value) => value.toString(),
  },
  // 🔥 业务类型专属KPI元数据
  inspection_count: {
    label: 'Inspection Count',
    icon: 'CheckCircle',
    color: 'bg-green-600',
    formatter: (value) => value.toString(),
  },
  inspection_pass_rate: {
    label: 'Inspection Pass Rate',
    icon: 'CheckCircle',
    color: 'bg-green-600',
    formatter: (value) => `${value.toFixed(1)}%`,
  },
  inspection_revenue: {
    label: 'Inspection Revenue',
    icon: 'DollarSign',
    color: 'bg-red-600',
    formatter: (value, currency = 'USD') => `${currency} ${(value / 1000).toFixed(0)}K`,
  },
  agency_commission: {
    label: 'Agency Commission',
    icon: 'DollarSign',
    color: 'bg-red-600',
    formatter: (value, currency = 'USD') => `${currency} ${(value / 1000).toFixed(0)}K`,
  },
  agency_orders: {
    label: 'Agency Orders',
    icon: 'Package',
    color: 'bg-blue-600',
    formatter: (value) => value.toString(),
  },
  project_count: {
    label: 'Project Count',
    icon: 'Briefcase',
    color: 'bg-cyan-600',
    formatter: (value) => value.toString(),
  },
  project_progress: {
    label: 'Project Progress',
    icon: 'CheckCircle',
    color: 'bg-green-600',
    formatter: (value) => `${value.toFixed(1)}%`,
  },
  service_satisfaction: {
    label: 'Service Satisfaction',
    icon: 'Smile',
    color: 'bg-green-600',
    formatter: (value) => `${value.toFixed(1)}%`,
  },
};

// 🔥 获取角色的数据分析配置
export const getRoleAnalyticsConfig = (role: UserRole): RoleAnalyticsConfig => {
  return ROLE_ANALYTICS_CONFIG[role];
};

// 🔥 检查角色是否可以查看某个图表
export const canViewChart = (role: UserRole, chartType: ChartType): boolean => {
  const config = ROLE_ANALYTICS_CONFIG[role];
  return [...config.charts.main, ...config.charts.secondary].includes(chartType);
};

// 🔥 检查角色是否可以查看某个表格
export const canViewTable = (role: UserRole, tableType: TableType): boolean => {
  const config = ROLE_ANALYTICS_CONFIG[role];
  return config.tables.includes(tableType);
};