/**
 * 🌐 通知规则智能匹配系统
 * 
 * 功能：
 * - 根据通知人的区域/角色自动推荐被通知人
 * - 支持保存和修改通知规则
 * - 区域化业务逻辑
 * - 🔥 集成动态供应商库
 * - 🔥 集成客户-业务员关系库
 */

import { getAllSuppliers, getSuppliersAsPersonnel } from './supplier-store';
import { 
  routeToSalesRep, 
  getRecommendedRecipientsForStep1 
} from './customer-salesrep-mapping';

// 区域定义
export type Region = 'north_america' | 'south_america' | 'europe_africa' | 'china';

export const regionLabels: Record<Region, { zh: string; en: string }> = {
  north_america: { zh: '北美区', en: 'North America' },
  south_america: { zh: '南美区', en: 'South America' },
  europe_africa: { zh: '欧非区', en: 'Europe & Africa' },
  china: { zh: '中国区', en: 'China' },
};

// 人员配置（包含区域信息）
export interface Personnel {
  name: string;
  nameEn?: string;
  role: string;
  roleEn?: string;
  region?: Region;
  displayName?: string; // 显示名称（包含角色和区域）
  workload?: number; // 🔥 新增：当前工作负载（询价单数量）
  email?: string; // 邮箱
  phone?: string; // 电话
  // 🔥 供应商扩展字段
  supplierId?: string;
  supplierContact?: string;
  supplierCategory?: string[];
}

// 完整的人员列表（带区域信息）
export const personnelList: Personnel[] = [
  // === 客户（每个区域1个测试客户）===
  { name: 'ABC Building Supplies', nameEn: 'ABC Building Supplies', role: '客户', roleEn: 'Customer', region: 'north_america', displayName: 'ABC Building Supplies (北美区)' },
  { name: 'Brasil Construction Co.', nameEn: 'Brasil Construction Co.', role: '客户', roleEn: 'Customer', region: 'south_america', displayName: 'Brasil Construction Co. (南美区)' },
  { name: 'Europa Trading GmbH', nameEn: 'Europa Trading GmbH', role: '客户', roleEn: 'Customer', region: 'europe_africa', displayName: 'Europa Trading GmbH (欧非区)' },
  
  // === 高层管理（全局）===
  { name: '张明', nameEn: 'Zhang Ming', role: '老板', roleEn: 'CEO', region: 'china', displayName: '张明' },
  { name: '李华', nameEn: 'Li Hua', role: '财务总监', roleEn: 'CFO', displayName: '李华' },
  { name: '王强', nameEn: 'Wang Qiang', role: '销售总监', roleEn: 'Sales Director', region: 'china', displayName: '王强' },
  
  // === 北美区团队 ===
  { name: '刘建国', nameEn: 'Liu Jianguo', role: '区域业务主管', roleEn: 'Regional Sales Manager', region: 'north_america', displayName: '刘建国 (北美区)' },
  // 北美区业务员（3人）
  { name: '张伟', nameEn: 'Zhang Wei', role: '业务员', roleEn: 'Sales Rep', region: 'north_america', displayName: '张伟 (北美区)', workload: 5, email: 'zhangwei@gsd.com' },
  { name: '王建', nameEn: 'Wang Jian', role: '业务员', roleEn: 'Sales Rep', region: 'north_america', displayName: '王建 (北美区)', workload: 3, email: 'wangjian@gsd.com' },
  { name: '李明', nameEn: 'Li Ming', role: '业务员', roleEn: 'Sales Rep', region: 'north_america', displayName: '李明 (北美区)', workload: 7, email: 'liming@gsd.com' },
  
  // === 南美区团队 ===
  { name: '陈明华', nameEn: 'Chen Minghua', role: '区域业务主管', roleEn: 'Regional Sales Manager', region: 'south_america', displayName: '陈明华 (南美区)' },
  // 南美区业务员（3人）
  { name: '李芳', nameEn: 'Li Fang', role: '业务员', roleEn: 'Sales Rep', region: 'south_america', displayName: '李芳 (南美区)', workload: 4, email: 'lifang@gsd.com' },
  { name: '陈磊', nameEn: 'Chen Lei', role: '业务员', roleEn: 'Sales Rep', region: 'south_america', displayName: '陈磊 (南美区)', workload: 6, email: 'chenlei@gsd.com' },
  { name: '赵婷', nameEn: 'Zhao Ting', role: '业务员', roleEn: 'Sales Rep', region: 'south_america', displayName: '赵婷 (南美区)', workload: 2, email: 'zhaoting@gsd.com' },
  
  // === 欧非区团队 ===
  { name: '赵国强', nameEn: 'Zhao Guoqiang', role: '区域业务主管', roleEn: 'Regional Sales Manager', region: 'europe_africa', displayName: '赵国强 (欧非区)' },
  // 欧非区业务员（3人）
  { name: '王芳', nameEn: 'Wang Fang', role: '业务员', roleEn: 'Sales Rep', region: 'europe_africa', displayName: '王芳 (欧非区)', workload: 2, email: 'wangfang@gsd.com' },
  { name: '赵勇', nameEn: 'Zhao Yong', role: '业务员', roleEn: 'Sales Rep', region: 'europe_africa', displayName: '赵勇 (欧非区)', workload: 5, email: 'zhaoyong@gsd.com' },
  { name: '孙丽', nameEn: 'Sun Li', role: '业务员', roleEn: 'Sales Rep', region: 'europe_africa', displayName: '孙丽 (欧非区)', workload: 8, email: 'sunli@gsd.com' },
  
  // === 其他角色（无区域限制）===
  { name: '赵敏', nameEn: 'Zhao Min', role: '财务', roleEn: 'Finance', displayName: '赵敏' },
  { name: '刘刚', nameEn: 'Liu Gang', role: '采购', roleEn: 'Procurement', displayName: '刘刚' },
  { name: '李娜', nameEn: 'Li Na', role: '运营专员', roleEn: 'Operations', displayName: '李娜' },
  { name: '系统管理员', nameEn: 'System Admin', role: '系统管理员', roleEn: 'System', displayName: '系统管理员' },
  { name: '福建XX建材', nameEn: 'Fujian XX Materials', role: '供应商', roleEn: 'Supplier', displayName: '福建XX建材' },
  { name: '广东YY五金', nameEn: 'Guangdong YY Hardware', role: '供应商', roleEn: 'Supplier', displayName: '广东YY五金' },
  { name: '吴师傅', nameEn: 'Wu Master', role: '验货员', roleEn: 'Inspector', displayName: '吴师傅' },
  { name: '厦门商检局', nameEn: 'Xiamen CIQ', role: '商检机构', roleEn: 'Inspection Agency', displayName: '厦门商检局' },
  { name: '远航国际货运', nameEn: 'Yuanhang Freight', role: '货代', roleEn: 'Forwarder', displayName: '远航国际货运' },
  { name: '顺通拖车', nameEn: 'Shuntong Trucking', role: '拖车公司', roleEn: 'Trucking', displayName: '顺通拖车' },
  { name: '厦门报关行', nameEn: 'Xiamen Customs Broker', role: '报关行', roleEn: 'Customs Broker', displayName: '厦门报关行' },
  { name: '厦门海关', nameEn: 'Xiamen Customs', role: '海关', roleEn: 'Customs', displayName: '厦门海关' },
];

/**
 * 获取指定角色和区域的人员列表
 */
export function getPersonnelByRoleAndRegion(role: string, region?: Region): Personnel[] {
  return personnelList.filter(p => {
    if (region) {
      return p.role === role && p.region === region;
    }
    return p.role === role;
  });
}

/**
 * 🔥 新增：获取完整人员列表（包含动态供应商）
 * 用于通知人/被通知人选择界面
 */
export function getAllPersonnelWithSuppliers(): Personnel[] {
  // 基础人员列表（排除硬编码的供应商）
  const basePersonnel = personnelList.filter(p => p.role !== '供应商');
  
  // 从供应商库动态加载供应商
  const suppliers = getSuppliersAsPersonnel();
  
  // 合并返回
  return [...basePersonnel, ...suppliers];
}

/**
 * 🔥 新增：按角色分组人员（支持动态供应商）
 */
export function groupPersonnelByRole(): Record<string, Personnel[]> {
  const allPersonnel = getAllPersonnelWithSuppliers();
  const grouped: Record<string, Personnel[]> = {};
  
  allPersonnel.forEach(person => {
    const role = person.role;
    if (!grouped[role]) {
      grouped[role] = [];
    }
    grouped[role].push(person);
  });
  
  return grouped;
}

/**
 * 🔥 新增：查找人员（包含动态供应商）
 */
export function findPersonnelByNameWithSuppliers(name: string): Personnel | undefined {
  const allPersonnel = getAllPersonnelWithSuppliers();
  return allPersonnel.find(p => 
    p.name === name || 
    p.displayName === name ||
    p.nameEn === name
  );
}

/**
 * 按区域和角色分组人员
 */
export function groupPersonnelByRegionAndRole() {
  const grouped: Record<Region, Record<string, Personnel[]>> = {
    north_america: {},
    south_america: {},
    europe_africa: {},
    china: {},
  };

  personnelList.forEach(person => {
    const region = person.region || 'china';
    const role = person.role;
    
    if (!grouped[region][role]) {
      grouped[region][role] = [];
    }
    grouped[region][role].push(person);
  });

  return grouped;
}

/**
 * 根据名称查找人员
 */
export function findPersonnelByName(name: string): Personnel | undefined {
  return personnelList.find(p => 
    p.name === name || 
    p.displayName === name ||
    p.nameEn === name
  );
}

/**
 * 🔥 获取工作负载等级（业务员）
 */
export function getWorkloadLevel(workload: number): { level: string; color: string; label: string } {
  if (workload <= 3) {
    return { level: 'low', color: 'bg-green-500', label: '🟢 负载低' };
  } else if (workload <= 6) {
    return { level: 'medium', color: 'bg-yellow-500', label: '🟡 负载中' };
  } else {
    return { level: 'high', color: 'bg-red-500', label: '🔴 负载高' };
  }
}

/**
 * 🔥 智能推荐业务员（基于区域和负载均衡）
 */
export function getRecommendedSalesRep(region: Region): Personnel | null {
  const regionalSalesReps = personnelList
    .filter(p => p.role === '业务员' && p.region === region)
    .sort((a, b) => (a.workload || 0) - (b.workload || 0));
  
  return regionalSalesReps.length > 0 ? regionalSalesReps[0] : null;
}

/**
 * 通知规则分组接口
 */
export interface RecipientsGroup {
  priority: Personnel[];      // 优先推荐（业务员）
  management: Personnel[];    // 管理层
  others: Personnel[];        // 其他相关人员
}

/**
 * 根据通知人智能推荐被通知人（分组版本）
 */
export function getRecommendedRecipientsGrouped(notifier?: Personnel): RecipientsGroup {
  if (!notifier) {
    return { priority: [], management: [], others: [] };
  }
  
  // 规则1: 如果是客户，推荐同区域的业务员、业务主管和销售总监
  if (notifier.role === '客户' && notifier.region) {
    // 优先推荐：同区域业务员（按负载排序）
    const regionalSalesReps = personnelList
      .filter(p => p.role === '业务员' && p.region === notifier.region)
      .sort((a, b) => (a.workload || 0) - (b.workload || 0));
    
    // 管理层：同区域主管 + 销售总监
    const management: Personnel[] = [];
    const regionalManager = personnelList.find(p => 
      p.role === '区域业务主管' && p.region === notifier.region
    );
    if (regionalManager) {
      management.push(regionalManager);
    }
    const salesDirector = personnelList.find(p => p.role === '销售总监');
    if (salesDirector) {
      management.push(salesDirector);
    }
    
    return {
      priority: regionalSalesReps,
      management,
      others: [],
    };
  }
  
  // 规则2: 如果是业务员，推荐同区域主管、销售总监
  if (notifier.role === '业务员' && notifier.region) {
    const management: Personnel[] = [];
    const regionalManager = personnelList.find(p => 
      p.role === '区域业务主管' && p.region === notifier.region
    );
    if (regionalManager) {
      management.push(regionalManager);
    }
    const salesDirector = personnelList.find(p => p.role === '销售总监');
    if (salesDirector) {
      management.push(salesDirector);
    }
    
    return {
      priority: [],
      management,
      others: [],
    };
  }
  
  // 规则3: 如果是供应商，推荐采购、业务员
  if (notifier.role === '供应商') {
    const procurement = personnelList.filter(p => p.role === '采购');
    const salesReps = personnelList.filter(p => p.role === '业务员');
    
    return {
      priority: procurement,
      management: [],
      others: salesReps,
    };
  }
  
  // 默认：无特定推荐
  return { priority: [], management: [], others: [] };
}

/**
 * 根据通知人智能推荐被通知人（扁平列表版本）
 */
export function getRecommendedRecipients(notifier?: Personnel): Personnel[] {
  const grouped = getRecommendedRecipientsGrouped(notifier);
  return [...grouped.priority, ...grouped.management, ...grouped.others];
}

/**
 * 通知规则存储接口
 */
export interface NotificationRule {
  stepId: number;
  stepName: string;
  notifier: string[];       // 通知人
  recipients: string[];     // 被通知人
  createdAt: string;
  updatedAt: string;
}

// LocalStorage Key
const NOTIFICATION_RULES_KEY = 'gsd_notification_rules';

/**
 * 保存通知规则
 */
export function saveNotificationRule(rule: Omit<NotificationRule, 'createdAt' | 'updatedAt'>): void {
  const rules = getAllNotificationRules();
  const existingIndex = rules.findIndex(r => r.stepId === rule.stepId);
  
  const timestamp = new Date().toISOString();
  const fullRule: NotificationRule = {
    ...rule,
    createdAt: existingIndex >= 0 ? rules[existingIndex].createdAt : timestamp,
    updatedAt: timestamp,
  };
  
  if (existingIndex >= 0) {
    rules[existingIndex] = fullRule;
  } else {
    rules.push(fullRule);
  }
  
  localStorage.setItem(NOTIFICATION_RULES_KEY, JSON.stringify(rules));
}

/**
 * 获取所有通知规则
 */
export function getAllNotificationRules(): NotificationRule[] {
  const data = localStorage.getItem(NOTIFICATION_RULES_KEY);
  if (!data) {
    return [];
  }
  
  try {
    return JSON.parse(data) as NotificationRule[];
  } catch (error) {
    console.error('❌ 通知规则数据解析失败:', error);
    return [];
  }
}

/**
 * 获取指定步骤的通知规则
 */
export function getNotificationRule(stepId: number): NotificationRule | null {
  const rules = getAllNotificationRules();
  return rules.find(r => r.stepId === stepId) || null;
}

/**
 * 删除通知规则
 */
export function deleteNotificationRule(stepId: number): void {
  const rules = getAllNotificationRules();
  const filtered = rules.filter(r => r.stepId !== stepId);
  localStorage.setItem(NOTIFICATION_RULES_KEY, JSON.stringify(filtered));
}