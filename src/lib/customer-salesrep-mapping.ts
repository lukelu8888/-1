/**
 * 📋 客户-业务员关系映射系统
 * 
 * 功能：
 * - 管理客户与业务员的对接关系
 * - 老客户：查询已分配的业务员
 * - 新客户：先流转到同区域主管，由主管分配业务员
 * - 支持手动调整关系
 * 
 * 业务逻辑：
 * 1. 客户提交询价（步骤1）
 * 2. 系统查询：该客户是否已有对接业务员
 * 3. 已有 → 通知对接业务员
 * 4. 没有 → 先流转到同区域主管
 */

import { Personnel, Region, personnelList } from './notification-rules';
import { staffDirectoryService } from './supabaseService';

const INTERNAL_SALES_FALLBACK: Personnel[] = [
  {
    name: '马里奥',
    nameEn: 'Mario',
    role: '业务员',
    roleEn: 'Sales Rep',
    region: 'north_america',
    displayName: '马里奥',
    workload: 0,
    email: 'sales01-na@cosunchina.com',
  },
  {
    name: '安娜',
    nameEn: 'Anna',
    role: '业务员',
    roleEn: 'Sales Rep',
    region: 'south_america',
    displayName: '安娜',
    workload: 0,
    email: 'sales01-sa@cosunchina.com',
  },
  {
    name: '艾玛',
    nameEn: 'Emma',
    role: '业务员',
    roleEn: 'Sales Rep',
    region: 'europe_africa',
    displayName: '艾玛',
    workload: 0,
    email: 'sales02-ea@cosunchina.com',
  },
];

const INTERNAL_REGIONAL_MANAGER_FALLBACK: Personnel[] = [
  {
    name: '刘建国',
    nameEn: 'Liu Jianguo',
    role: '区域业务主管',
    roleEn: 'Regional Manager',
    region: 'north_america',
    displayName: '刘建国',
    email: 'salesmanager-na@cosunchina.com',
  },
  {
    name: '陈明华',
    nameEn: 'Chen Minghua',
    role: '区域业务主管',
    roleEn: 'Regional Manager',
    region: 'south_america',
    displayName: '陈明华',
    email: 'salesmanager-sa@cosunchina.com',
  },
  {
    name: '赵国强',
    nameEn: 'Zhao Guoqiang',
    role: '区域业务主管',
    roleEn: 'Regional Manager',
    region: 'europe_africa',
    displayName: '赵国强',
    email: 'salesmanager-ea@cosunchina.com',
  },
];

const mergePersonnelByEmail = (...groups: Personnel[][]): Personnel[] => {
  const merged = new Map<string, Personnel>();
  groups.flat().forEach((person) => {
    const email = String(person?.email || '').trim().toLowerCase();
    if (!email) return;
    merged.set(email, person);
  });
  return Array.from(merged.values());
};

const getInternalSalesPersonnel = (): Personnel[] => {
  const cachedStaff = staffDirectoryService.getCachedSalesStaff();

  const regionMap: Record<string, Region | undefined> = {
    NA: 'north_america',
    SA: 'south_america',
    EA: 'europe_africa',
  };

  const cachedPersonnel = cachedStaff
    .filter((row) => row.rbacRole === 'Sales_Rep')
    .map<Personnel>((row) => ({
      name: row.name,
      nameEn: row.name,
      role: '业务员',
      roleEn: 'Sales Rep',
      region: regionMap[String(row.region || '').toUpperCase()],
      displayName: row.name,
      workload: 0,
      email: row.email,
    }));

  return mergePersonnelByEmail(cachedPersonnel, INTERNAL_SALES_FALLBACK);
};

const getInternalRegionalManagerPersonnel = (): Personnel[] => {
  const cachedStaff = staffDirectoryService.getCachedSalesStaff();

  const regionMap: Record<string, Region | undefined> = {
    NA: 'north_america',
    SA: 'south_america',
    EA: 'europe_africa',
  };

  const cachedPersonnel = cachedStaff
    .filter((row) => row.rbacRole === 'Regional_Manager')
    .map<Personnel>((row) => ({
      name: row.name,
      nameEn: row.name,
      role: '区域业务主管',
      roleEn: 'Regional Manager',
      region: regionMap[String(row.region || '').toUpperCase()],
      displayName: row.name,
      email: row.email,
    }));

  return mergePersonnelByEmail(cachedPersonnel, INTERNAL_REGIONAL_MANAGER_FALLBACK);
};

const normalizeSalesRepEmail = (email?: string | null, region?: Region): string | undefined => {
  const normalized = String(email || '').trim().toLowerCase();
  if (!normalized) return undefined;

  const internalSalesPersonnel = getInternalSalesPersonnel();
  const exactMatch = internalSalesPersonnel.find((person) => String(person.email || '').trim().toLowerCase() === normalized);
  if (exactMatch?.email) return exactMatch.email;

  const legacyRegionFallback: Partial<Record<Region, string>> = {
    north_america: 'zhangwei@cosun.com',
    south_america: 'lifang@cosun.com',
    europe_africa: 'wangfang@cosun.com',
  };

  if (normalized.endsWith('@gsd.com')) {
    return region ? legacyRegionFallback[region] : undefined;
  }

  return undefined;
};

const resolveMappedSalesRep = (mapping: CustomerSalesRepMapping): Personnel | null => {
  const mappedEmail = normalizeSalesRepEmail(mapping.salesRepEmail, mapping.customerRegion);
  const mappedName = String(mapping.salesRepName || '').trim();

  return (
    getInternalSalesPersonnel().find((person) => {
      const personEmail = String(person.email || '').trim().toLowerCase();
      const personDisplayName = String(person.displayName || '').trim();
      const personName = String(person.name || '').trim();
      return (
        (mappedEmail && personEmail === mappedEmail) ||
        (!!mappedName && (personDisplayName === mappedName || personName === mappedName))
      );
    }) || null
  );
};

// 客户-业务员映射关系
export interface CustomerSalesRepMapping {
  customerId: string;           // 客户ID（使用客户名称作为唯一标识）
  customerName: string;         // 客户名称
  customerRegion: Region;       // 客户所在区域
  salesRepName: string;         // 对接业务员名称
  salesRepEmail?: string;       // 业务员邮箱
  assignedDate: string;         // 分配日期
  assignedBy: 'manual' | 'auto'; // 分配方式（手动/自动）
  notes?: string;               // 备注
}

// LocalStorage Key
const MAPPING_STORE_KEY = 'gsd_customer_salesrep_mapping';

/**
 * 初始化客户-业务员关系库（测试数据）
 */
export function initCustomerSalesRepMapping(): void {
  // 检查是否已有数据
  const existing = localStorage.getItem(MAPPING_STORE_KEY);
  if (existing) {
    console.log('📋 客户-业务员关系库已存在，跳过初始化');
    return;
  }

  // 创建初始测试数据：3个客户 + 对应的业务员
  const testMappings: CustomerSalesRepMapping[] = [
    {
      customerId: 'ABC Building Supplies',
      customerName: 'ABC Building Supplies',
      customerRegion: 'north_america',
      salesRepName: '张伟 (北美区)',
      salesRepEmail: 'zhangwei@cosun.com',
      assignedDate: '2024-01-15',
      assignedBy: 'auto',
      notes: '首次询价自动分配'
    },
    {
      customerId: 'Brasil Construction Co.',
      customerName: 'Brasil Construction Co.',
      customerRegion: 'south_america',
      salesRepName: '李芳 (南美区)',
      salesRepEmail: 'lifang@cosun.com',
      assignedDate: '2024-02-10',
      assignedBy: 'auto',
      notes: '首次询价自动分配'
    },
    {
      customerId: 'Europa Trading GmbH',
      customerName: 'Europa Trading GmbH',
      customerRegion: 'europe_africa',
      salesRepName: '王芳 (欧非区)',
      salesRepEmail: 'wangfang@cosun.com',
      assignedDate: '2024-03-05',
      assignedBy: 'auto',
      notes: '首次询价自动分配'
    }
  ];

  localStorage.setItem(MAPPING_STORE_KEY, JSON.stringify(testMappings));
  console.log('✅ 客户-业务员关系库初始化成功：3个客户映射');
}

/**
 * 获取所有客户-业务员映射关系
 */
export function getAllMappings(): CustomerSalesRepMapping[] {
  const data = localStorage.getItem(MAPPING_STORE_KEY);
  if (!data) {
    console.warn('⚠️ 客户-业务员关系库为空，正在初始化...');
    initCustomerSalesRepMapping();
    return getAllMappings();
  }
  
  try {
    return JSON.parse(data) as CustomerSalesRepMapping[];
  } catch (error) {
    console.error('❌ 关系库数据解析失败:', error);
    return [];
  }
}

/**
 * 🔥 根据客户名称查询对接业务员
 */
export function getSalesRepByCustomer(customerName: string): Personnel | null {
  const mappings = getAllMappings();
  const mapping = mappings.find(m => 
    m.customerId === customerName || 
    m.customerName === customerName
  );
  
  if (!mapping) {
    console.log(`📋 客户 "${customerName}" 尚未分配业务员`);
    return null;
  }
  
  // 在人员列表中查找对应的业务员
  const salesRep = resolveMappedSalesRep(mapping);
  
  if (!salesRep) {
    console.warn(`⚠️ 找不到业务员: ${mapping.salesRepName}`);
    return null;
  }
  
  console.log(`✅ 客户 "${customerName}" → 业务员 "${salesRep.displayName}"`);
  return salesRep;
}

/**
 * 获取同区域业务主管
 */
export function getRegionalManagerByRegion(customerRegion: Region): Personnel | null {
  const regionalManager = getInternalRegionalManagerPersonnel().find(
    (person) => person.region === customerRegion,
  );

  if (regionalManager) return regionalManager;

  const fallbackManager = INTERNAL_REGIONAL_MANAGER_FALLBACK.find(
    (person) => person.region === customerRegion,
  );
  if (fallbackManager) return fallbackManager;

  console.warn(`⚠️ ${customerRegion} 区域没有可用的业务主管`);
  return null;
}

/**
 * 🔥 智能路由：优先查询历史业务员，否则流转到区域主管
 * 
 * 逻辑：
 * 1. 先查询是否已有映射关系
 * 2. 有 → 返回已分配的业务员
 * 3. 没有 → 返回同区域主管，等待主管分配
 */
export function routeToSalesRep(customerName: string, customerRegion: Region): Personnel | null {
  // 步骤1: 查询已有关系
  const existingSalesRep = getSalesRepByCustomer(customerName);
  if (existingSalesRep) {
    return existingSalesRep;
  }

  // 步骤2: 新客户先流转到区域主管
  console.log(`📋 客户 "${customerName}" 无历史业务员，流转至区域主管分配`);
  return getRegionalManagerByRegion(customerRegion);
}

/**
 * 手动分配/修改客户-业务员关系
 */
export function assignSalesRepManual(
  customerName: string,
  customerRegion: Region,
  salesRepName: string,
  notes?: string
): boolean {
  const mappings = getAllMappings();
  
  // 验证业务员是否存在
  const salesRep = getInternalSalesPersonnel().find(p => 
    p.displayName === salesRepName || 
    p.name === salesRepName
  );
  
  if (!salesRep) {
    console.error(`❌ 业务员不存在: ${salesRepName}`);
    return false;
  }
  
  // 查找是否已有映射
  const existingIndex = mappings.findIndex(m => 
    m.customerId === customerName || 
    m.customerName === customerName
  );
  
  const newMapping: CustomerSalesRepMapping = {
    customerId: customerName,
    customerName: customerName,
    customerRegion: customerRegion,
    salesRepName: salesRepName,
    salesRepEmail: salesRep.email,
    assignedDate: new Date().toISOString().split('T')[0],
    assignedBy: 'manual',
    notes: notes || '手动分配'
  };
  
  if (existingIndex >= 0) {
    // 更新现有映射
    mappings[existingIndex] = newMapping;
    console.log(`✅ 已更新客户-业务员关系: ${customerName} → ${salesRepName}`);
  } else {
    // 新增映射
    mappings.push(newMapping);
    console.log(`✅ 已创建客户-业务员关系: ${customerName} → ${salesRepName}`);
  }
  
  localStorage.setItem(MAPPING_STORE_KEY, JSON.stringify(mappings));
  return true;
}

/**
 * 删除客户-业务员映射
 */
export function deleteMappingByCustomer(customerName: string): boolean {
  const mappings = getAllMappings();
  const filtered = mappings.filter(m => 
    m.customerId !== customerName && 
    m.customerName !== customerName
  );
  
  if (filtered.length === mappings.length) {
    console.warn(`⚠️ 客户 "${customerName}" 没有映射关系`);
    return false;
  }
  
  localStorage.setItem(MAPPING_STORE_KEY, JSON.stringify(filtered));
  console.log(`✅ 已删除客户 "${customerName}" 的映射关系`);
  return true;
}

/**
 * 获取业务员的所有客户
 */
export function getCustomersBySalesRep(salesRepName: string): CustomerSalesRepMapping[] {
  const mappings = getAllMappings();
  return mappings.filter(m => m.salesRepName === salesRepName);
}

/**
 * 重置关系库（恢复初始测试数据）
 */
export function resetMappingStore(): void {
  localStorage.removeItem(MAPPING_STORE_KEY);
  initCustomerSalesRepMapping();
  console.log('🔄 客户-业务员关系库已重置为初始测试数据');
}

/**
 * 🔥 获取步骤1的推荐被通知人
 * 
 * 逻辑：
 * - 如果选择了具体客户 → 返回该客户的对接业务员（或智能分配）
 * - 如果没选择客户 → 返回空（运行时动态路由）
 */
export function getRecommendedRecipientsForStep1(
  selectedCustomers: string[]
): { salesRep: Personnel; customer: string }[] {
  if (selectedCustomers.length === 0) {
    return [];
  }
  
  const results: { salesRep: Personnel; customer: string }[] = [];
  
  selectedCustomers.forEach(customerName => {
    // 查找客户信息
    const customer = personnelList.find(p => 
      p.name === customerName || 
      p.displayName === customerName
    );
    
    if (!customer || !customer.region) {
      console.warn(`⚠️ 客户 "${customerName}" 信息不完整`);
      return;
    }
    
    // 智能路由到业务员
    const salesRep = routeToSalesRep(customerName, customer.region);
    if (salesRep) {
      results.push({ salesRep, customer: customerName });
    }
  });
  
  return results;
}

/**
 * 🔥 批量显示客户-业务员映射摘要
 */
export function getMappingSummary(): string {
  const mappings = getAllMappings();
  
  if (mappings.length === 0) {
    return '暂无客户-业务员映射关系';
  }
  
  const summary = mappings.map(m => 
    `${m.customerName} → ${m.salesRepName} (${m.assignedBy === 'auto' ? '🤖自动' : '👤手动'})`
  ).join('\n');
  
  return `当前映射关系（${mappings.length}个）:\n${summary}`;
}
