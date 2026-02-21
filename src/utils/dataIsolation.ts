/**
 * 数据隔离工具函数
 * 确保每个客户只能访问自己的数据
 * Admin可以访问所有客户数据
 */

export type UserType = 'customer' | 'admin' | 'supplier';

export interface AuthUser {
  email: string;
  type: UserType;
  id?: string; // 🔥 添加 id 字段
  name?: string; // 🔥 添加 name 字段
  role?: string; // 🔥 添加 role 字段（RBAC角色）
  userRole?: string; // 🔥 添加 userRole 字段（兼容性）
  region?: string; // 🔥 添加 region 字段
}

/**
 * 获取当前登录用户
 */
export function getCurrentUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  
  try {
    // 🔥 修复：同时读取 cosun_auth_user 和 cosun_current_user，合并信息
    let user: AuthUser | null = null;
    
    // 1. 先读取 cosun_auth_user（基础用户信息）
    const authUserStr = localStorage.getItem('cosun_auth_user');
    if (authUserStr) {
      user = JSON.parse(authUserStr);
    }
    
    // 2. 再读取 cosun_current_user（RBAC用户信息，包含role等详细信息）
    const rbacUserStr = localStorage.getItem('cosun_current_user');
    if (rbacUserStr) {
      const rbacUser = JSON.parse(rbacUserStr);
      
      // 🔥 根据role自动推断type
      let userType: UserType = user?.type || 'admin';
      if (rbacUser.role) {
        // 供应商角色
        if (rbacUser.role === 'Supplier') {
          userType = 'supplier';
        }
        // 客户角色
        else if (rbacUser.role === 'Customer') {
          userType = 'customer';
        }
        // 所有内部员工角色都是admin
        else if (['Sales_Director', 'Regional_Manager', 'Sales_Rep', 'Procurement_Manager', 'Procurement_Specialist'].includes(rbacUser.role)) {
          userType = 'admin';
        }
      }
      
      // 合并两个对象，RBAC用户信息优先（包含role、userRole、region等）
      user = {
        ...user,
        ...rbacUser,
        // 确保 email 和 type 存在
        email: rbacUser.email || user?.email || '',
        type: userType, // 🔥 使用推断的type
      };
    }
    
    if (user) {
      // 🔥 调试：打印当前用户信息
      console.log('🔍 [dataIsolation] getCurrentUser:', {
        email: user.email,
        type: user.type,
        role: user.role,
        userRole: user.userRole,
        region: user.region,
        name: user.name
      });
      return user;
    }
  } catch (e) {
    console.error('Failed to get current user:', e);
  }
  
  return null;
}

/**
 * 生成用户专属的localStorage键名
 * @param baseKey - 基础键名（如 'quotations', 'orders'）
 * @param userEmail - 用户邮箱（可选，不传则使用当前登录用户）
 */
export function getUserStorageKey(baseKey: string, userEmail?: string): string | null {
  const email = userEmail || getCurrentUser()?.email;
  if (!email) {
    console.warn(`Cannot generate storage key: no user email provided`);
    return null;
  }
  
  return `${baseKey}_${email}`;
}

/**
 * 获取用户专属数据
 * @param baseKey - 基础键名
 * @param userEmail - 用户邮箱（可选）
 */
export function getUserData<T>(baseKey: string, userEmail?: string): T[] {
  if (typeof window === 'undefined') return [];
  
  const storageKey = getUserStorageKey(baseKey, userEmail);
  if (!storageKey) return [];
  
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error(`Failed to get user data for key ${storageKey}:`, e);
  }
  
  return [];
}

/**
 * 保存用户专属数据
 * @param baseKey - 基础键名
 * @param data - 要保存的数据
 * @param userEmail - 用户邮箱（可选）
 */
export function setUserData<T>(baseKey: string, data: T[], userEmail?: string): boolean {
  if (typeof window === 'undefined') return false;
  
  const storageKey = getUserStorageKey(baseKey, userEmail);
  if (!storageKey) return false;
  
  try {
    localStorage.setItem(storageKey, JSON.stringify(data));
    return true;
  } catch (e) {
    console.error(`Failed to save user data for key ${storageKey}:`, e);
    return false;
  }
}

/**
 * 删除用户专属数据
 * @param baseKey - 基础键名
 * @param userEmail - 用户邮箱（可选）
 */
export function removeUserData(baseKey: string, userEmail?: string): boolean {
  if (typeof window === 'undefined') return false;
  
  const storageKey = getUserStorageKey(baseKey, userEmail);
  if (!storageKey) return false;
  
  try {
    localStorage.removeItem(storageKey);
    return true;
  } catch (e) {
    console.error(`Failed to remove user data for key ${storageKey}:`, e);
    return false;
  }
}

/**
 * 获取所有客户的数据（仅Admin可用）
 * @param baseKey - 基础键名
 */
export function getAllCustomersData<T>(baseKey: string): T[] {
  if (typeof window === 'undefined') return [];
  
  const currentUser = getCurrentUser();
  if (!currentUser || currentUser.type !== 'admin') {
    console.warn('getAllCustomersData: Only admin can access all customer data');
    return [];
  }
  
  const allData: T[] = [];
  
  try {
    // 遍历localStorage，找到所有匹配的键
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(`${baseKey}_`) && !key.includes('admin@')) {
        const data = localStorage.getItem(key);
        if (data) {
          const parsed = JSON.parse(data);
          if (Array.isArray(parsed)) {
            allData.push(...parsed);
          }
        }
      }
    }
  } catch (e) {
    console.error(`Failed to get all customers data for ${baseKey}:`, e);
  }
  
  return allData;
}

/**
 * 获取所有客户的邮箱列表（仅Admin可用）
 * @param baseKey - 基础键名
 */
export function getAllCustomerEmails(baseKey: string): string[] {
  if (typeof window === 'undefined') return [];
  
  const currentUser = getCurrentUser();
  if (!currentUser || currentUser.type !== 'admin') {
    console.warn('getAllCustomerEmails: Only admin can access customer list');
    return [];
  }
  
  const emails: string[] = [];
  
  try {
    const prefix = `${baseKey}_`;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(prefix) && !key.includes('admin@')) {
        // 提取邮箱部分
        const email = key.substring(prefix.length);
        if (email && !emails.includes(email)) {
          emails.push(email);
        }
      }
    }
  } catch (e) {
    console.error(`Failed to get customer emails for ${baseKey}:`, e);
  }
  
  return emails;
}

/**
 * 获取特定客户的数据（仅Admin可用）
 * @param baseKey - 基础键名
 * @param customerEmail - 客户邮箱
 */
export function getCustomerDataAsAdmin<T>(baseKey: string, customerEmail: string): T[] {
  const currentUser = getCurrentUser();
  if (!currentUser || currentUser.type !== 'admin') {
    console.warn('getCustomerDataAsAdmin: Only admin can access customer data');
    return [];
  }
  
  return getUserData<T>(baseKey, customerEmail);
}

/**
 * 迁移旧的全局数据到隔离结构
 * @param baseKey - 基础键名
 * @param emailField - 数据中包含邮箱的字段名（如 'customerEmail'）
 */
export function migrateGlobalDataToIsolated<T extends Record<string, any>>(
  baseKey: string,
  emailField: keyof T
): { success: boolean; migratedCount: number; errors: string[] } {
  if (typeof window === 'undefined') {
    return { success: false, migratedCount: 0, errors: ['Not in browser environment'] };
  }
  
  const errors: string[] = [];
  let migratedCount = 0;
  
  try {
    // 读取旧的全局数据
    const oldData = localStorage.getItem(baseKey);
    if (!oldData) {
      return { success: true, migratedCount: 0, errors: [] };
    }
    
    const parsedData: T[] = JSON.parse(oldData);
    if (!Array.isArray(parsedData)) {
      errors.push('Old data is not an array');
      return { success: false, migratedCount: 0, errors };
    }
    
    // 按客户Email分组
    const groupedByCustomer: Record<string, T[]> = {};
    parsedData.forEach((item, index) => {
      const email = item[emailField];
      if (typeof email === 'string' && email) {
        if (!groupedByCustomer[email]) {
          groupedByCustomer[email] = [];
        }
        groupedByCustomer[email].push(item);
      } else {
        errors.push(`Item at index ${index} has no valid ${String(emailField)}`);
      }
    });
    
    // 保存到新的隔离结构
    Object.entries(groupedByCustomer).forEach(([email, data]) => {
      const success = setUserData(baseKey, data, email);
      if (success) {
        migratedCount += data.length;
      } else {
        errors.push(`Failed to migrate data for ${email}`);
      }
    });
    
    // 备份旧数据
    localStorage.setItem(`${baseKey}_backup_${Date.now()}`, oldData);
    
    // 删除旧的全局键
    localStorage.removeItem(baseKey);
    
    return {
      success: errors.length === 0,
      migratedCount,
      errors
    };
  } catch (e) {
    errors.push(`Migration failed: ${e instanceof Error ? e.message : 'Unknown error'}`);
    return { success: false, migratedCount, errors };
  }
}

/**
 * 清除特定用户的所有数据（仅Admin可用）
 * @param userEmail - 用户邮箱
 * @param baseKeys - 要清除的基础键名列表
 */
export function clearUserAllData(
  userEmail: string,
  baseKeys: string[] = ['quotations', 'orders', 'inquiries']
): { success: boolean; cleared: string[]; errors: string[] } {
  if (typeof window === 'undefined') {
    return { success: false, cleared: [], errors: ['Not in browser environment'] };
  }
  
  const currentUser = getCurrentUser();
  if (!currentUser || currentUser.type !== 'admin') {
    return { success: false, cleared: [], errors: ['Only admin can clear user data'] };
  }
  
  const cleared: string[] = [];
  const errors: string[] = [];
  
  baseKeys.forEach(baseKey => {
    const success = removeUserData(baseKey, userEmail);
    if (success) {
      cleared.push(baseKey);
    } else {
      errors.push(`Failed to clear ${baseKey}`);
    }
  });
  
  return {
    success: errors.length === 0,
    cleared,
    errors
  };
}

/**
 * 检查数据是否已隔离
 * @param baseKey - 基础键名
 */
export function isDataIsolated(baseKey: string): boolean {
  if (typeof window === 'undefined') return false;
  
  // 检查是否存在旧的全局键
  const hasGlobalKey = localStorage.getItem(baseKey) !== null;
  
  // 检查是否存在隔离的键
  let hasIsolatedKeys = false;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(`${baseKey}_`) && key.includes('@')) {
      hasIsolatedKeys = true;
      break;
    }
  }
  
  // 如果没有全局键且有隔离键，则认为已隔离
  return !hasGlobalKey && hasIsolatedKeys;
}

/**
 * 获取数据统计（仅Admin可用）
 */
export function getDataStatistics(baseKey: string): {
  totalCustomers: number;
  totalRecords: number;
  customerBreakdown: { email: string; count: number }[];
} | null {
  if (typeof window === 'undefined') return null;
  
  const currentUser = getCurrentUser();
  if (!currentUser || currentUser.type !== 'admin') {
    console.warn('getDataStatistics: Only admin can view statistics');
    return null;
  }
  
  const customerBreakdown: { email: string; count: number }[] = [];
  let totalRecords = 0;
  
  try {
    const prefix = `${baseKey}_`;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(prefix) && key.includes('@')) {
        const email = key.substring(prefix.length);
        const data = localStorage.getItem(key);
        if (data) {
          const parsed = JSON.parse(data);
          const count = Array.isArray(parsed) ? parsed.length : 0;
          customerBreakdown.push({ email, count });
          totalRecords += count;
        }
      }
    }
  } catch (e) {
    console.error(`Failed to get statistics for ${baseKey}:`, e);
    return null;
  }
  
  return {
    totalCustomers: customerBreakdown.length,
    totalRecords,
    customerBreakdown: customerBreakdown.sort((a, b) => b.count - a.count)
  };
}