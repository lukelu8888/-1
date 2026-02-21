// 🔥 THE COSUN BM - 客户关系管理（CRM）完整配置
// Customer Relationship Management Configuration
// 承接营销引流，深度客户开发，遵循漏斗原则

// ========================================
// 1️⃣ 客户生命周期阶段（销售漏斗）
// ========================================
export type CustomerStage = 
  | 'pool'           // 🌊 公海客户（Marketing Leads）
  | 'prospect'       // 🎯 意向客户（Prospects）
  | 'active'         // ✅ 成交客户（Active Customers）
  | 'vip'            // 👑 大客户/VIP（Key Accounts）
  | 'churned'        // 😴 流失客户（Churned）
  | 'rejected';      // ❌ 已拒绝（Rejected）

// 客户阶段配置
export const CUSTOMER_STAGES = {
  pool: {
    id: 'pool' as CustomerStage,
    name: '公海客户',
    nameEn: 'Customer Pool',
    icon: '🌊',
    color: 'slate',
    description: '营销引流的待分配目标客户',
    order: 1,
  },
  prospect: {
    id: 'prospect' as CustomerStage,
    name: '意向客户',
    nameEn: 'Prospect',
    icon: '🎯',
    color: 'blue',
    description: '已分配给业务员的潜在客户',
    order: 2,
  },
  active: {
    id: 'active' as CustomerStage,
    name: '成交客户',
    nameEn: 'Active Customer',
    icon: '✅',
    color: 'green',
    description: '已下单的活跃客户',
    order: 3,
  },
  vip: {
    id: 'vip' as CustomerStage,
    name: '大客户/VIP',
    nameEn: 'Key Account',
    icon: '👑',
    color: 'purple',
    description: '高价值大客户',
    order: 4,
  },
  churned: {
    id: 'churned' as CustomerStage,
    name: '流失客户',
    nameEn: 'Churned',
    icon: '😴',
    color: 'gray',
    description: '已流失的客户',
    order: 5,
  },
  rejected: {
    id: 'rejected' as CustomerStage,
    name: '已拒绝',
    nameEn: 'Rejected',
    icon: '❌',
    color: 'red',
    description: '明确拒绝合作的客户',
    order: 6,
  },
};

// ========================================
// 2️⃣ 客户核心6大类型（排除电商，聚焦稳定需求）
// ========================================
export type CustomerType = 
  | 'retailer'              // 🏪 建材零售商（连锁或单店）
  | 'project_contractor'    // 🏗️ 项目工程承包商
  | 'inspection_seeker'     // 🔍 验货服务需求客户
  | 'agency_seeker'         // 🤝 寻找中国代理客户
  | 'local_manufacturer'    // 🏭 本地制造加工服务商
  | 'wholesaler';           // 📦 纯粹的批发商

// 客户类型配置
export const CUSTOMER_TYPES = {
  retailer: {
    id: 'retailer' as CustomerType,
    name: '建材零售商',
    subtitle: '连锁店或单店',
    nameEn: 'Retailer',
    icon: '🏪',
    color: 'blue',
    priority: 'S',
    description: '实体门店，直接面向终端消费者，采购频率高，决策链短',
    businessModel: '直接采购',
    avgOrderValue: '$45K',
    conversionRate: '35%',
    ltv: '$180K',
    requiresInspection: false,
  },
  project_contractor: {
    id: 'project_contractor' as CustomerType,
    name: '项目承包商',
    subtitle: '各类工程项目',
    nameEn: 'Contractor',
    icon: '🏗️',
    color: 'orange',
    priority: 'S',
    description: '大型项目一站式采购，订单金额大，注重交期和质量',
    businessModel: '项目采购',
    avgOrderValue: '$85K',
    conversionRate: '45%',
    ltv: '$340K',
    requiresInspection: false,
  },
  inspection_seeker: {
    id: 'inspection_seeker' as CustomerType,
    name: '验货客户',
    subtitle: '需要正规验货服务',
    nameEn: 'QC Service',
    icon: '🔍',
    color: 'cyan',
    priority: 'A',
    description: '需要第三方验货和质量控制，希望验货+采购一体化服务',
    businessModel: '验货服务',
    avgOrderValue: '$28K',
    conversionRate: '40%',
    ltv: '$120K',
    requiresInspection: true,
  },
  agency_seeker: {
    id: 'agency_seeker' as CustomerType,
    name: '中国代理',
    subtitle: '需要采购代理服务',
    nameEn: 'Agency',
    icon: '🤝',
    color: 'purple',
    priority: 'S',
    description: '需要长期采购代理，缺乏中国供应链资源，愿意支付佣金',
    businessModel: '代理服务',
    avgOrderValue: '$55K',
    conversionRate: '48%',
    ltv: '$250K',
    requiresInspection: false,
  },
  local_manufacturer: {
    id: 'local_manufacturer' as CustomerType,
    name: '本土工厂',
    subtitle: '需要原材料和配件',
    nameEn: 'Factory',
    icon: '🏭',
    color: 'green',
    priority: 'S',
    description: '本地二次加工，多品类原材料需求，高频稳定采购',
    businessModel: '原材料供应',
    avgOrderValue: '$32K',
    conversionRate: '42%',
    ltv: '$160K',
    requiresInspection: false,
  },
  wholesaler: {
    id: 'wholesaler' as CustomerType,
    name: '批发商',
    subtitle: '大宗批发分销',
    nameEn: 'Wholesaler',
    icon: '📦',
    color: 'indigo',
    priority: 'A',
    description: '向零售商/承包商批量供货，注重价格和周转率',
    businessModel: '批发分销',
    avgOrderValue: '$38K',
    conversionRate: '38%',
    ltv: '$150K',
    requiresInspection: false,
  },
};

// ========================================
// 3️⃣ 客户来源渠道（营销引流）
// ========================================
export type CustomerSource = 
  | 'linkedin'          // LinkedIn
  | 'facebook'          // Facebook
  | 'instagram'         // Instagram
  | 'youtube'           // YouTube
  | 'google'            // Google搜索
  | 'live_streaming'    // 直播平台
  | 'exhibition'        // 展会
  | 'customs_data'      // 海关数据
  | 'referral'          // 老客户推荐
  | 'direct_visit'      // 自然来访
  | 'email_marketing'   // 邮件营销
  | 'seo'               // SEO自然流量
  | 'paid_ads'          // 付费广告
  | 'partner'           // 合作伙伴
  | 'other';            // 其他

// 客户来源配置
export const CUSTOMER_SOURCES = {
  linkedin: {
    id: 'linkedin' as CustomerSource,
    name: 'LinkedIn',
    icon: '💼',
    color: 'blue',
    category: 'social',
    description: 'LinkedIn社交媒体',
  },
  facebook: {
    id: 'facebook' as CustomerSource,
    name: 'Facebook',
    icon: '👥',
    color: 'blue',
    category: 'social',
    description: 'Facebook社交媒体',
  },
  instagram: {
    id: 'instagram' as CustomerSource,
    name: 'Instagram',
    icon: '📷',
    color: 'pink',
    category: 'social',
    description: 'Instagram社交媒体',
  },
  youtube: {
    id: 'youtube' as CustomerSource,
    name: 'YouTube',
    icon: '📹',
    color: 'red',
    category: 'social',
    description: 'YouTube视频平台',
  },
  google: {
    id: 'google' as CustomerSource,
    name: 'Google搜索',
    icon: '🔍',
    color: 'orange',
    category: 'search',
    description: 'Google搜索引擎',
  },
  live_streaming: {
    id: 'live_streaming' as CustomerSource,
    name: '直播平台',
    icon: '📡',
    color: 'purple',
    category: 'social',
    description: '直播平台引流',
  },
  exhibition: {
    id: 'exhibition' as CustomerSource,
    name: '展会',
    icon: '🎪',
    color: 'indigo',
    category: 'offline',
    description: '国际展会',
  },
  customs_data: {
    id: 'customs_data' as CustomerSource,
    name: '海关数据',
    icon: '📊',
    color: 'cyan',
    category: 'data',
    description: '海关数据挖掘',
  },
  referral: {
    id: 'referral' as CustomerSource,
    name: '老客户推荐',
    icon: '🤝',
    color: 'green',
    category: 'referral',
    description: '老客户推荐',
  },
  direct_visit: {
    id: 'direct_visit' as CustomerSource,
    name: '自然来访',
    icon: '🚶',
    color: 'slate',
    category: 'organic',
    description: '自然访问官网',
  },
  email_marketing: {
    id: 'email_marketing' as CustomerSource,
    name: '邮件营销',
    icon: '📧',
    color: 'blue',
    category: 'marketing',
    description: '邮件营销活动',
  },
  seo: {
    id: 'seo' as CustomerSource,
    name: 'SEO自然流量',
    icon: '🌐',
    color: 'green',
    category: 'organic',
    description: 'SEO自然流量',
  },
  paid_ads: {
    id: 'paid_ads' as CustomerSource,
    name: '付费广告',
    icon: '💰',
    color: 'amber',
    category: 'marketing',
    description: '付费广告投放',
  },
  partner: {
    id: 'partner' as CustomerSource,
    name: '合作伙伴',
    icon: '🤝',
    color: 'purple',
    category: 'referral',
    description: '合作伙伴引荐',
  },
  other: {
    id: 'other' as CustomerSource,
    name: '其他',
    icon: '❓',
    color: 'gray',
    category: 'other',
    description: '其他来源',
  },
};

// 来源分类
export const SOURCE_CATEGORIES = {
  social: { name: '社交媒体', icon: '📱', color: 'blue' },
  search: { name: '搜索引擎', icon: '🔍', color: 'orange' },
  marketing: { name: '营销活动', icon: '🎯', color: 'purple' },
  offline: { name: '线下活动', icon: '🏢', color: 'indigo' },
  data: { name: '数据挖掘', icon: '📊', color: 'cyan' },
  referral: { name: '推荐引荐', icon: '🤝', color: 'green' },
  organic: { name: '自然流量', icon: '🌱', color: 'emerald' },
  other: { name: '其他', icon: '❓', color: 'gray' },
};

// ========================================
// 4️⃣ 业务类型
// ========================================
export type BusinessType = 
  | 'direct_purchase'   // 直接采购
  | 'inspection'        // 验货服务
  | 'agent'             // 代理服务
  | 'project';          // 项目工程

// 业务类型配置
export const BUSINESS_TYPES = {
  direct_purchase: {
    id: 'direct_purchase' as BusinessType,
    name: '直接采购',
    nameEn: 'Direct Purchase',
    icon: '🛒',
    color: 'blue',
    description: '客户直接采购产品',
  },
  inspection: {
    id: 'inspection' as BusinessType,
    name: '验货服务',
    nameEn: 'Inspection Service',
    icon: '🔍',
    color: 'orange',
    description: '提供验货、质检服务',
  },
  agent: {
    id: 'agent' as BusinessType,
    name: '代理服务',
    nameEn: 'Agent Service',
    icon: '🤝',
    color: 'purple',
    description: '区域代理、分销合作',
  },
  project: {
    id: 'project' as BusinessType,
    name: '项目工程',
    nameEn: 'Project Engineering',
    icon: '🏗️',
    color: 'green',
    description: '一站式项目工程解决方案',
  },
};

// ========================================
// 5️⃣ 客户信用评级
// ========================================
export type CustomerRating = 
  | 'AAA'    // 信用极好
  | 'AA'     // 信用优秀
  | 'A'      // 信用良好
  | 'BBB'    // 信用一般
  | 'BB'     // 信用较差
  | 'B'      // 信用差
  | 'C'      // 高风险
  | 'UNRATED'; // 未评级

// 信用评级配置
export const CUSTOMER_RATINGS = {
  AAA: {
    id: 'AAA' as CustomerRating,
    name: 'AAA级',
    nameEn: 'AAA',
    icon: '🌟',
    color: 'emerald',
    creditLimit: 1000000,
    paymentTerms: 'NET 90',
    description: '信用极好，大客户VIP',
  },
  AA: {
    id: 'AA' as CustomerRating,
    name: 'AA级',
    nameEn: 'AA',
    icon: '⭐',
    color: 'green',
    creditLimit: 500000,
    paymentTerms: 'NET 60',
    description: '信用优秀',
  },
  A: {
    id: 'A' as CustomerRating,
    name: 'A级',
    nameEn: 'A',
    icon: '✨',
    color: 'blue',
    creditLimit: 200000,
    paymentTerms: 'NET 45',
    description: '信用良好',
  },
  BBB: {
    id: 'BBB' as CustomerRating,
    name: 'BBB级',
    nameEn: 'BBB',
    icon: '📊',
    color: 'amber',
    creditLimit: 100000,
    paymentTerms: 'NET 30',
    description: '信用一般',
  },
  BB: {
    id: 'BB' as CustomerRating,
    name: 'BB级',
    nameEn: 'BB',
    icon: '⚠️',
    color: 'orange',
    creditLimit: 50000,
    paymentTerms: 'NET 15',
    description: '信用较差，需预付款',
  },
  B: {
    id: 'B' as CustomerRating,
    name: 'B级',
    nameEn: 'B',
    icon: '❗',
    color: 'red',
    creditLimit: 20000,
    paymentTerms: 'Prepayment 50%',
    description: '信用差，需50%预付',
  },
  C: {
    id: 'C' as CustomerRating,
    name: 'C级',
    nameEn: 'C',
    icon: '🚫',
    color: 'red',
    creditLimit: 0,
    paymentTerms: 'Prepayment 100%',
    description: '高风险，需100%预付',
  },
  UNRATED: {
    id: 'UNRATED' as CustomerRating,
    name: '未评级',
    nameEn: 'Unrated',
    icon: '❓',
    color: 'gray',
    creditLimit: 0,
    paymentTerms: 'TBD',
    description: '新客户，未评级',
  },
};

// ========================================
// 6️⃣ 客户优先级
// ========================================
export type CustomerPriority = 'high' | 'medium' | 'low';

export const CUSTOMER_PRIORITIES = {
  high: {
    id: 'high' as CustomerPriority,
    name: '高优先级',
    nameEn: 'High Priority',
    icon: '🔴',
    color: 'red',
    description: '重点跟进客户',
  },
  medium: {
    id: 'medium' as CustomerPriority,
    name: '中优先级',
    nameEn: 'Medium Priority',
    icon: '🟡',
    color: 'amber',
    description: '正常跟进客户',
  },
  low: {
    id: 'low' as CustomerPriority,
    name: '低优先级',
    nameEn: 'Low Priority',
    icon: '🟢',
    color: 'green',
    description: '一般跟进客户',
  },
};

// ========================================
// 7️⃣ 客户地区
// ========================================
export type CustomerRegion = 'NA' | 'SA' | 'EMEA';

export const CUSTOMER_REGIONS = {
  NA: {
    id: 'NA' as CustomerRegion,
    name: '北美',
    nameEn: 'North America',
    icon: '🇺🇸',
    color: 'blue',
    countries: ['USA', 'Canada', 'Mexico'],
  },
  SA: {
    id: 'SA' as CustomerRegion,
    name: '南美',
    nameEn: 'South America',
    icon: '🇧🇷',
    color: 'green',
    countries: ['Brazil', 'Argentina', 'Chile', 'Colombia', 'Peru'],
  },
  EMEA: {
    id: 'EMEA' as CustomerRegion,
    name: '欧非',
    nameEn: 'Europe, Middle East & Africa',
    icon: '🇪🇺',
    color: 'purple',
    countries: ['UK', 'Germany', 'France', 'Spain', 'Italy', 'UAE', 'Saudi Arabia', 'South Africa'],
  },
};

// ========================================
// 8️⃣ 客户数据模型
// ========================================
export interface Customer {
  // 基础信息
  id: string;
  companyName: string;
  companyNameEn?: string;
  
  // 客户分类
  stage: CustomerStage;              // 客户阶段（漏斗）
  type: CustomerType;                // 客户类型
  businessType: BusinessType[];      // 业务类型（可多选）
  source: CustomerSource;            // 客户来源
  region: CustomerRegion;            // 客户地区
  
  // 评级与优先级
  rating: CustomerRating;            // 信用评级
  priority: CustomerPriority;        // 优先级
  
  // 联系信息
  contacts: Contact[];               // 联系人列表
  website?: string;
  address?: string;
  country: string;
  
  // 业务信息
  assignedTo?: string;               // 分配给（业务员ID）
  assignedBy?: string;               // 分配人（营销人员ID）
  assignedAt?: Date;                 // 分配时间
  firstOrderDate?: Date;             // 首次下单时间
  lastOrderDate?: Date;              // 最后下单时间
  totalOrders: number;               // 总订单数
  totalRevenue: number;              // 总营业额
  averageOrderValue: number;         // 平均订单金额
  
  // 跟进记录
  followUpHistory: FollowUpRecord[]; // 跟进记录
  nextFollowUpDate?: Date;           // 下次跟进时间
  
  // 标签与备注
  tags: string[];                    // 客户标签
  notes?: string;                    // 备注
  
  // 时间戳
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
  updatedBy: string;
}

// 联系人
export interface Contact {
  id: string;
  name: string;
  position: string;
  email: string;
  phone?: string;
  mobile?: string;
  whatsapp?: string;
  wechat?: string;
  isPrimary: boolean;                // 是否主联系人
}

// 跟进记录
export interface FollowUpRecord {
  id: string;
  date: Date;
  type: 'call' | 'email' | 'meeting' | 'visit' | 'other';
  content: string;
  nextAction?: string;
  nextActionDate?: Date;
  createdBy: string;
  createdAt: Date;
}

// ========================================
// 9️⃣ 销售漏斗统计
// ========================================
export interface SalesFunnelStats {
  pool: {
    count: number;
    conversionRate: number;          // 转化率
  };
  prospect: {
    count: number;
    conversionRate: number;
  };
  active: {
    count: number;
    retentionRate: number;           // 留存率
  };
  vip: {
    count: number;
    revenue: number;
  };
  churned: {
    count: number;
  };
  rejected: {
    count: number;
  };
}

// ========================================
// 🔟 客户来源效果分析
// ========================================
export interface SourceAnalytics {
  source: CustomerSource;
  totalLeads: number;                // 总引流数
  convertedLeads: number;            // 转化数
  conversionRate: number;            // 转化率
  totalRevenue: number;              // 总营业额
  averageOrderValue: number;         // 平均订单金额
  roi: number;                       // 投资回报率
  cost: number;                      // 营销成本
}

// ========================================
// 工具函数
// ========================================

// 获取客户阶段的下一个阶段
export function getNextStage(currentStage: CustomerStage): CustomerStage | null {
  const stageOrder: CustomerStage[] = ['pool', 'prospect', 'active', 'vip'];
  const currentIndex = stageOrder.indexOf(currentStage);
  if (currentIndex === -1 || currentIndex === stageOrder.length - 1) {
    return null;
  }
  return stageOrder[currentIndex + 1];
}

// 获取客户阶段颜色
export function getStageColor(stage: CustomerStage): string {
  return CUSTOMER_STAGES[stage]?.color || 'gray';
}

// 获取客户类型颜色
export function getTypeColor(type: CustomerType): string {
  return CUSTOMER_TYPES[type]?.color || 'gray';
}

// 获取客户来源颜色
export function getSourceColor(source: CustomerSource): string {
  return CUSTOMER_SOURCES[source]?.color || 'gray';
}

// 获取信用评级颜色
export function getRatingColor(rating: CustomerRating): string {
  return CUSTOMER_RATINGS[rating]?.color || 'gray';
}

// 计算客户价值评分（0-100）
export function calculateCustomerScore(customer: Customer): number {
  let score = 0;
  
  // 信用评级权重：30分
  const ratingScores: Record<CustomerRating, number> = {
    'AAA': 30, 'AA': 25, 'A': 20, 'BBB': 15, 'BB': 10, 'B': 5, 'C': 0, 'UNRATED': 0
  };
  score += ratingScores[customer.rating] || 0;
  
  // 订单数量权重：20分
  if (customer.totalOrders > 50) score += 20;
  else if (customer.totalOrders > 20) score += 15;
  else if (customer.totalOrders > 10) score += 10;
  else if (customer.totalOrders > 5) score += 5;
  
  // 营业额权重：30分
  if (customer.totalRevenue > 1000000) score += 30;
  else if (customer.totalRevenue > 500000) score += 25;
  else if (customer.totalRevenue > 200000) score += 20;
  else if (customer.totalRevenue > 100000) score += 15;
  else if (customer.totalRevenue > 50000) score += 10;
  else if (customer.totalRevenue > 10000) score += 5;
  
  // 活跃度权重：20分
  if (customer.lastOrderDate) {
    const daysSinceLastOrder = Math.floor(
      (new Date().getTime() - customer.lastOrderDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceLastOrder < 30) score += 20;
    else if (daysSinceLastOrder < 90) score += 15;
    else if (daysSinceLastOrder < 180) score += 10;
    else if (daysSinceLastOrder < 365) score += 5;
  }
  
  return Math.min(score, 100);
}