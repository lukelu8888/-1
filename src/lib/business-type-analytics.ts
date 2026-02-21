// 🔥 业务类型专属数据分析配置
// 为四种业务类型提供专业的数据分析指标和视图

import { BusinessType } from './rbac-config';

// 📊 业务类型专属KPI配置
export interface BusinessTypeKPI {
  type: string;
  label: string;
  value: number;
  unit?: string;
  change: string;
  trend: 'up' | 'down';
  icon: string;
  color: string;
  description: string;
}

// 🔥 直接采购业务 KPI指标
export const TRADING_KPIS = {
  revenue: { label: 'Total Revenue', value: 632000, unit: 'USD', icon: 'DollarSign', color: 'bg-red-600', description: '总营收额' },
  orders: { label: 'Total Orders', value: 121, unit: '', icon: 'Package', color: 'bg-blue-600', description: '总订单数' },
  customers: { label: 'Active Customers', value: 45, unit: '', icon: 'Users', color: 'bg-purple-600', description: '活跃客户数' },
  avg_order_value: { label: 'Avg Order Value', value: 5223, unit: 'USD', icon: 'TrendingUp', color: 'bg-green-600', description: '平均订单额' },
  profit_margin: { label: 'Profit Margin', value: 28.5, unit: '%', icon: 'Target', color: 'bg-purple-600', description: '利润率' },
  product_skus: { label: 'Product SKUs', value: 1856, unit: '', icon: 'Package', color: 'bg-orange-600', description: 'SKU数量' },
  repeat_rate: { label: 'Repeat Rate', value: 68.2, unit: '%', icon: 'RefreshCw', color: 'bg-cyan-600', description: '复购率' },
  inventory_turnover: { label: 'Inventory Turnover', value: 4.2, unit: 'x', icon: 'TrendingUp', color: 'bg-indigo-600', description: '库存周转率' },
};

// 🔥 验货服务业务 KPI指标
export const INSPECTION_KPIS = {
  inspection_count: { label: 'Total Inspections', value: 286, unit: '', icon: 'FileSearch', color: 'bg-green-600', description: '验货次数' },
  inspection_revenue: { label: 'Service Revenue', value: 142800, unit: 'USD', icon: 'DollarSign', color: 'bg-red-600', description: '服务收入' },
  avg_service_fee: { label: 'Avg Service Fee', value: 499, unit: 'USD', icon: 'TrendingUp', color: 'bg-blue-600', description: '平均服务费' },
  pass_rate: { label: 'Pass Rate', value: 87.4, unit: '%', icon: 'CheckCircle', color: 'bg-green-600', description: '验货通过率' },
  inspection_time: { label: 'Avg Inspection Time', value: 4.5, unit: 'hours', icon: 'Clock', color: 'bg-orange-600', description: '平均验货时长' },
  client_satisfaction: { label: 'Client Satisfaction', value: 94.8, unit: '%', icon: 'Star', color: 'bg-yellow-600', description: '客户满意度' },
  defect_rate: { label: 'Defect Rate', value: 12.6, unit: '%', icon: 'AlertTriangle', color: 'bg-red-600', description: '缺陷率' },
  repeat_clients: { label: 'Repeat Clients', value: 73.5, unit: '%', icon: 'RefreshCw', color: 'bg-purple-600', description: '回头客率' },
};

// 🔥 代理服务业务 KPI指标
export const AGENCY_KPIS = {
  agency_orders: { label: 'Agency Orders', value: 98, unit: '', icon: 'ShoppingCart', color: 'bg-blue-600', description: '代理订单数' },
  total_commission: { label: 'Total Commission', value: 89600, unit: 'USD', icon: 'DollarSign', color: 'bg-red-600', description: '总佣金' },
  avg_commission_rate: { label: 'Avg Commission', value: 8.5, unit: '%', icon: 'Percent', color: 'bg-green-600', description: '平均佣金率' },
  sourcing_value: { label: 'Sourcing Value', value: 1054000, unit: 'USD', icon: 'TrendingUp', color: 'bg-purple-600', description: '采购总额' },
  supplier_count: { label: 'Active Suppliers', value: 42, unit: '', icon: 'Factory', color: 'bg-cyan-600', description: '活跃供应商' },
  client_retention: { label: 'Client Retention', value: 82.3, unit: '%', icon: 'Heart', color: 'bg-pink-600', description: '客户留存率' },
  avg_order_cycle: { label: 'Avg Order Cycle', value: 18, unit: 'days', icon: 'Clock', color: 'bg-orange-600', description: '平均订单周期' },
  success_rate: { label: 'Success Rate', value: 96.2, unit: '%', icon: 'CheckCircle', color: 'bg-green-600', description: '成功率' },
};

// 🔥 一站式项目业务 KPI指标
export const PROJECT_KPIS = {
  active_projects: { label: 'Active Projects', value: 28, unit: '', icon: 'Layers', color: 'bg-indigo-600', description: '进行中项目' },
  project_revenue: { label: 'Project Revenue', value: 1856000, unit: 'USD', icon: 'DollarSign', color: 'bg-red-600', description: '项目总收入' },
  avg_project_value: { label: 'Avg Project Value', value: 66285, unit: 'USD', icon: 'TrendingUp', color: 'bg-green-600', description: '平均项目额' },
  completion_rate: { label: 'On-Time Completion', value: 89.3, unit: '%', icon: 'CheckCircle', color: 'bg-green-600', description: '按时完成率' },
  client_satisfaction: { label: 'Client Satisfaction', value: 92.7, unit: '%', icon: 'Star', color: 'bg-yellow-600', description: '客户满意度' },
  avg_project_duration: { label: 'Avg Duration', value: 45, unit: 'days', icon: 'Clock', color: 'bg-orange-600', description: '平均项目周期' },
  service_integration: { label: 'Service Integration', value: 3.8, unit: 'services', icon: 'Layers', color: 'bg-purple-600', description: '平均服务集成数' },
  profit_margin: { label: 'Profit Margin', value: 32.4, unit: '%', icon: 'Target', color: 'bg-blue-600', description: '利润率' },
};

// 🔥 获取业务类型的KPI数据
export const getBusinessTypeKPIs = (businessType: BusinessType, roleCanViewSensitive: boolean): BusinessTypeKPI[] => {
  let kpisData: any;
  
  switch (businessType) {
    case 'trading':
      kpisData = TRADING_KPIS;
      break;
    case 'inspection':
      kpisData = INSPECTION_KPIS;
      break;
    case 'agency':
      kpisData = AGENCY_KPIS;
      break;
    case 'project':
      kpisData = PROJECT_KPIS;
      break;
    default:
      kpisData = TRADING_KPIS;
  }

  // 转换为KPI数组
  const kpis = Object.entries(kpisData).map(([key, data]: [string, any]) => {
    // 检查是否是敏感数据
    const isSensitive = key === 'profit_margin' || key === 'total_commission' || key === 'avg_commission_rate';
    
    // 如果是敏感数据且用户无权限，则跳过
    if (isSensitive && !roleCanViewSensitive) {
      return null;
    }

    const changeValue = Math.random() > 0.3 ? (Math.random() * 30).toFixed(1) : -(Math.random() * 10).toFixed(1);
    const change = changeValue >= 0 ? `+${changeValue}%` : `${changeValue}%`;
    
    return {
      type: key,
      label: data.label,
      value: data.value,
      unit: data.unit,
      change,
      trend: (changeValue >= 0 ? 'up' : 'down') as 'up' | 'down',
      icon: data.icon,
      color: data.color,
      description: data.description,
    };
  }).filter(Boolean) as BusinessTypeKPI[];

  // 根据业务类型选择最重要的6个KPI
  return kpis.slice(0, 6);
};

// 🔥 业务类型专属图表数据
export const getBusinessTypeChartData = (businessType: BusinessType) => {
  switch (businessType) {
    case 'trading':
      return {
        monthlyTrend: [
          { month: 'Jan', revenue: 45000, orders: 8, customers: 5, profit: 12600 },
          { month: 'Feb', revenue: 52000, orders: 10, customers: 6, profit: 14800 },
          { month: 'Mar', revenue: 48000, orders: 9, customers: 5, profit: 13440 },
          { month: 'Apr', revenue: 61000, orders: 12, customers: 7, profit: 17380 },
          { month: 'May', revenue: 55000, orders: 11, customers: 6, profit: 15675 },
          { month: 'Jun', revenue: 67000, orders: 13, customers: 8, profit: 19090 },
          { month: 'Jul', revenue: 72000, orders: 14, customers: 8, profit: 20520 },
          { month: 'Aug', revenue: 69000, orders: 13, customers: 7, profit: 19665 },
          { month: 'Sep', revenue: 78000, orders: 15, customers: 9, profit: 22230 },
          { month: 'Oct', revenue: 85000, orders: 16, customers: 10, profit: 24225 },
        ],
        productCategories: [
          { name: 'Door Hardware', value: 285000, orders: 45, margin: 32.5 },
          { name: 'Cabinet Hardware', value: 198000, orders: 38, margin: 28.2 },
          { name: 'Window Hardware', value: 142000, orders: 28, margin: 25.8 },
          { name: 'Sliding Systems', value: 112000, orders: 22, margin: 30.1 },
        ],
        topProducts: [
          { name: 'Smart Lock System', revenue: 42000, units: 280, growth: 28.5 },
          { name: 'Cabinet Hinge Set', revenue: 35000, units: 1200, growth: 15.2 },
          { name: 'Window Handle Pro', revenue: 28000, units: 850, growth: 32.1 },
          { name: 'Sliding Rail Kit', revenue: 22000, units: 420, growth: 12.8 },
          { name: 'Door Closer HD', revenue: 18000, units: 360, growth: 22.4 },
        ],
        topClients: [
          { name: 'HomeStyle Inc.', revenue: 285000, orders: 45, growth: 28.5 },
          { name: 'BuildMart Co.', revenue: 198000, orders: 38, growth: 15.2 },
          { name: 'Elite Supplies', revenue: 142000, orders: 28, growth: 32.1 },
          { name: 'Mega Hardware', revenue: 112000, orders: 22, growth: 12.8 },
        ],
      };

    case 'inspection':
      return {
        monthlyTrend: [
          { month: 'Jan', inspections: 18, revenue: 8910, passRate: 85.2, defects: 162 },
          { month: 'Feb', inspections: 22, revenue: 10890, passRate: 86.8, defects: 145 },
          { month: 'Mar', inspections: 20, revenue: 9920, passRate: 84.5, defects: 155 },
          { month: 'Apr', inspections: 28, revenue: 13860, passRate: 88.2, defects: 132 },
          { month: 'May', inspections: 24, revenue: 11880, passRate: 87.1, defects: 138 },
          { month: 'Jun', inspections: 31, revenue: 15345, passRate: 89.5, defects: 116 },
          { month: 'Jul', inspections: 35, revenue: 17325, passRate: 88.9, defects: 122 },
          { month: 'Aug', inspections: 32, revenue: 15840, passRate: 87.6, defects: 128 },
          { month: 'Sep', inspections: 38, revenue: 18810, passRate: 90.1, defects: 104 },
          { month: 'Oct', inspections: 38, revenue: 18810, passRate: 89.4, defects: 112 },
        ],
        inspectionTypes: [
          { name: 'Pre-Production', value: 82, percentage: 28.7, avgFee: 450 },
          { name: 'During Production', value: 95, percentage: 33.2, avgFee: 520 },
          { name: 'Final Random', value: 76, percentage: 26.6, avgFee: 480 },
          { name: 'Container Loading', value: 33, percentage: 11.5, avgFee: 550 },
        ],
        defectCategories: [
          { name: 'Packaging Issues', count: 145, percentage: 32.4 },
          { name: 'Size/Dimension', count: 118, percentage: 26.4 },
          { name: 'Material Quality', count: 98, percentage: 21.9 },
          { name: 'Workmanship', count: 87, percentage: 19.4 },
        ],
        topClients: [
          { name: 'ABC Trading Ltd.', inspections: 42, revenue: 20580, satisfaction: 96.5 },
          { name: 'Global Imports Co.', inspections: 35, revenue: 17150, satisfaction: 94.2 },
          { name: 'Elite Sourcing', inspections: 28, revenue: 13720, satisfaction: 95.8 },
          { name: 'BuildMart Inc.', inspections: 22, revenue: 10780, satisfaction: 93.1 },
        ],
      };

    case 'agency':
      return {
        monthlyTrend: [
          { month: 'Jan', orders: 6, commission: 5280, sourcingValue: 62118, suppliers: 8 },
          { month: 'Feb', orders: 8, commission: 7040, sourcingValue: 82824, suppliers: 10 },
          { month: 'Mar', orders: 7, commission: 6160, sourcingValue: 72471, suppliers: 9 },
          { month: 'Apr', orders: 10, commission: 8800, sourcingValue: 103529, suppliers: 12 },
          { month: 'May', orders: 9, commission: 7920, sourcingValue: 93176, suppliers: 11 },
          { month: 'Jun', orders: 12, commission: 10560, sourcingValue: 124235, suppliers: 14 },
          { month: 'Jul', orders: 14, commission: 12320, sourcingValue: 144941, suppliers: 15 },
          { month: 'Aug', orders: 11, commission: 9680, sourcingValue: 113882, suppliers: 13 },
          { month: 'Sep', orders: 13, commission: 11440, sourcingValue: 134588, suppliers: 14 },
          { month: 'Oct', orders: 8, commission: 10560, sourcingValue: 124235, suppliers: 12 },
        ],
        serviceTypes: [
          { name: 'Product Sourcing', orders: 42, commission: 35700, rate: 8.5 },
          { name: 'Supplier Negotiation', orders: 28, commission: 23800, rate: 8.5 },
          { name: 'Quality Control', orders: 18, commission: 15300, rate: 8.5 },
          { name: 'Logistics Coordination', orders: 10, commission: 8500, rate: 8.5 },
        ],
        topSuppliers: [
          { name: 'Guangzhou Hardware Factory', orders: 18, value: 189000, performance: 95.2 },
          { name: 'Shenzhen Electric Co.', orders: 15, value: 157500, performance: 92.8 },
          { name: 'Fujian Building Materials', orders: 12, value: 126000, performance: 94.5 },
          { name: 'Shanghai Plumbing Supplies', orders: 10, value: 105000, performance: 91.3 },
          { name: 'Wenzhou Door Systems', orders: 8, value: 84000, performance: 93.7 },
        ],
        topClients: [
          { name: 'HomeStyle Inc.', orders: 15, commission: 12750, retention: 95.5 },
          { name: 'BuildMart Co.', orders: 12, commission: 10200, retention: 88.2 },
          { name: 'Elite Supplies', orders: 10, commission: 8500, retention: 92.1 },
          { name: 'Mega Hardware', orders: 8, commission: 6800, retention: 85.7 },
        ],
      };

    case 'project':
      return {
        monthlyTrend: [
          { month: 'Jan', projects: 2, revenue: 132000, completion: 85.0, satisfaction: 90.5 },
          { month: 'Feb', projects: 2, revenue: 132000, completion: 88.5, satisfaction: 91.2 },
          { month: 'Mar', projects: 3, revenue: 198000, completion: 86.2, satisfaction: 89.8 },
          { month: 'Apr', projects: 3, revenue: 198000, completion: 90.1, satisfaction: 92.5 },
          { month: 'May', projects: 2, revenue: 132000, completion: 87.8, satisfaction: 90.9 },
          { month: 'Jun', projects: 4, revenue: 264000, completion: 91.5, satisfaction: 93.8 },
          { month: 'Jul', projects: 3, revenue: 198000, completion: 89.2, satisfaction: 92.1 },
          { month: 'Aug', projects: 2, revenue: 132000, completion: 88.7, satisfaction: 91.5 },
          { month: 'Sep', projects: 4, revenue: 264000, completion: 92.3, satisfaction: 94.2 },
          { month: 'Oct', projects: 3, revenue: 198000, completion: 90.8, satisfaction: 93.1 },
        ],
        projectTypes: [
          { name: 'Full Service Package', count: 12, revenue: 792000, avgDuration: 52 },
          { name: 'Sourcing + Logistics', count: 8, revenue: 528000, avgDuration: 38 },
          { name: 'QC + Shipping', count: 5, revenue: 330000, avgDuration: 28 },
          { name: 'Custom Solution', count: 3, revenue: 198000, avgDuration: 65 },
        ],
        serviceBreakdown: [
          { service: 'Sourcing', revenue: 520000, percentage: 28.0 },
          { service: 'Inspection', revenue: 390000, percentage: 21.0 },
          { service: 'Logistics', revenue: 465000, percentage: 25.1 },
          { service: 'Customs', revenue: 280000, percentage: 15.1 },
          { service: 'Warehousing', revenue: 201000, percentage: 10.8 },
        ],
        projectStages: [
          { stage: 'Planning', count: 5, percentage: 17.9 },
          { stage: 'Sourcing', count: 7, percentage: 25.0 },
          { stage: 'Production', count: 8, percentage: 28.6 },
          { stage: 'QC & Shipping', count: 6, percentage: 21.4 },
          { stage: 'Completed', count: 2, percentage: 7.1 },
        ],
        topClients: [
          { name: 'MegaCorp Industries', projects: 6, revenue: 396000, satisfaction: 95.8 },
          { name: 'Global Retail Chain', projects: 5, revenue: 330000, satisfaction: 94.2 },
          { name: 'European Imports Ltd.', projects: 4, revenue: 264000, satisfaction: 96.5 },
          { name: 'Premium Home Goods', projects: 3, revenue: 198000, satisfaction: 93.7 },
        ],
      };

    default:
      return getBusinessTypeChartData('trading');
  }
};

// 🔥 业务类型描述和建议
export const BUSINESS_TYPE_INSIGHTS: Record<BusinessType, {
  title: string;
  description: string;
  strengths: string[];
  opportunities: string[];
  recommendations: string[];
}> = {
  trading: {
    title: '直接采购业务分析',
    description: '传统B2B贸易业务，客户直接采购产品，我方负责采购和发货',
    strengths: [
      '产品SKU丰富，覆盖多个品类',
      '客户复购率达68.2%，客户黏性良好',
      '库存周转率4.2x，资金效率较高',
    ],
    opportunities: [
      '可以开发高利润率的新产品线',
      '通过数字化提升订单处理效率',
      '拓展跨境电商渠道',
    ],
    recommendations: [
      '重点关注Smart Lock System等高增长产品',
      '优化库存管理，提升周转率到5x以上',
      '建立VIP客户专属服务体系',
    ],
  },
  inspection: {
    title: '验货服务业务分析',
    description: '为客户提供第三方验货服务，确保产品质量符合标准',
    strengths: [
      '验货通过率87.4%，质量控制专业',
      '客户满意度94.8%，服务质量优秀',
      '回头客率73.5%，客户信任度高',
    ],
    opportunities: [
      '拓展During Production验货服务（收费更高）',
      '开发验货报告数字化系统',
      '提供验货培训增值服务',
    ],
    recommendations: [
      '针对包装问题（32.4%缺陷）提供改进建议',
      '将平均验货时长从4.5小时压缩到4小时',
      '开发快速验货服务（Premium客户）',
    ],
  },
  agency: {
    title: '代理服务业务分析',
    description: '作为客户的中国采购代理，提供供应商对接和谈判服务',
    strengths: [
      '客户留存率82.3%，服务粘性强',
      '成功率96.2%，专业能力突出',
      '活跃供应商网络达42家',
    ],
    opportunities: [
      '提高佣金率到9-10%（Premium服务）',
      '开发供应商评级系统',
      '拓展东南亚采购代理业务',
    ],
    recommendations: [
      '缩短平均订单周期从18天到15天',
      '针对高价值客户提供专属采购经理',
      '建立供应商KPI考核体系',
    ],
  },
  project: {
    title: '一站式项目业务分析',
    description: '提供采购+验货+物流的综合服务，项目制运作',
    strengths: [
      '按时完成率89.3%，项目管理能力强',
      '客户满意度92.7%，综合服务优质',
      '利润率32.4%，盈利能力最高',
    ],
    opportunities: [
      '推广Full Service Package（利润率最高）',
      '开发项目管理数字化平台',
      '拓展大型连锁零售客户',
    ],
    recommendations: [
      '优化项目周期，从45天缩短到40天',
      '提升按时完成率到92%以上',
      '开发项目可视化追踪系统',
    ],
  },
};