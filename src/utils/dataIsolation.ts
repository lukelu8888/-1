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

export type PortalRole = 'admin' | 'staff' | 'supplier' | 'customer' | null;

function parseStoredJson(key: string) {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function getPreferredRbacUser() {
  const switchedUser = parseStoredJson('cosun_switched_user');
  const currentUser = parseStoredJson('cosun_current_user');

  if (switchedUser?.email) {
    if (!currentUser?.email || String(switchedUser.email).trim().toLowerCase() === String(currentUser.email).trim().toLowerCase()) {
      return switchedUser;
    }
  }

  return currentUser;
}

export function getAuthenticatedUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;

  try {
    const authUser = parseStoredJson('cosun_auth_user');
    const backendUser = parseStoredJson('cosun_backend_user');

    if (authUser?.email && authUser?.type) {
      return {
        ...authUser,
        id: authUser.id ?? backendUser?.id,
        name: authUser.name ?? backendUser?.name,
        role: authUser.role ?? backendUser?.role ?? backendUser?.rbac_role,
        userRole: authUser.userRole ?? authUser.role ?? backendUser?.role ?? backendUser?.rbac_role,
        region: authUser.region ?? backendUser?.region,
      } as AuthUser;
    }

    if (backendUser?.email) {
      const portalRole = String(backendUser?.portal_role || '').trim().toLowerCase();
      const type: UserType =
        portalRole === 'supplier' ? 'supplier' :
        portalRole === 'customer' ? 'customer' :
        'admin';
      return {
        id: backendUser.id,
        email: backendUser.email,
        name: backendUser.name,
        type,
        role: backendUser.role ?? backendUser.rbac_role,
        userRole: backendUser.userRole ?? backendUser.role ?? backendUser.rbac_role,
        region: backendUser.region,
      };
    }
  } catch (e) {
    console.error('Failed to get authenticated user:', e);
  }

  return null;
}

export function getActingUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;

  try {
    const rbacUser = getPreferredRbacUser();
    const authUser = getAuthenticatedUser();

    if (rbacUser?.email) {
      const role = rbacUser.role || rbacUser.userRole || '';
      let userType: UserType = 'admin';
      if (role === 'Supplier') userType = 'supplier';
      else if (role === 'Customer') userType = 'customer';

      return {
        id: rbacUser.id ?? authUser?.id,
        email: rbacUser.email,
        name: rbacUser.name ?? authUser?.name,
        type: authUser?.type ?? userType,
        role: rbacUser.role ?? authUser?.role,
        userRole: rbacUser.userRole || rbacUser.role || authUser?.userRole || authUser?.role,
        region: rbacUser.region ?? authUser?.region,
      };
    }

    return authUser;
  } catch (e) {
    console.error('Failed to get acting user:', e);
  }

  return null;
}

/**
 * 获取当前登录用户
 * 优先读取 UserContext 写入的 cosun_auth_user（Supabase Auth 格式）
 * 兼容旧的 cosun_current_user（RBAC 格式）
 */
export function getCurrentUser(): AuthUser | null {
  return getActingUser();
}

export function getOperatorUser(): AuthUser | null {
  return getAuthenticatedUser() || getActingUser();
}

export function buildIdentityAuditMetadata(input: {
  ownerEmail?: string | null;
  ownerName?: string | null;
  ownerRole?: string | null;
  region?: string | null;
}) {
  const authenticatedUser = getAuthenticatedUser();
  const actingUser = getActingUser();
  const operatorUser = getOperatorUser();

  return {
    identityAudit: {
      authenticatedUser: authenticatedUser
        ? {
            id: authenticatedUser.id || null,
            email: authenticatedUser.email || null,
            name: authenticatedUser.name || null,
            role: authenticatedUser.userRole || authenticatedUser.role || null,
            region: authenticatedUser.region || null,
            type: authenticatedUser.type || null,
          }
        : null,
      actingUser: actingUser
        ? {
            id: actingUser.id || null,
            email: actingUser.email || null,
            name: actingUser.name || null,
            role: actingUser.userRole || actingUser.role || null,
            region: actingUser.region || null,
            type: actingUser.type || null,
          }
        : null,
      operatorUser: operatorUser
        ? {
            id: operatorUser.id || null,
            email: operatorUser.email || null,
            name: operatorUser.name || null,
            role: operatorUser.userRole || operatorUser.role || null,
            region: operatorUser.region || null,
            type: operatorUser.type || null,
          }
        : null,
      businessOwner: {
        email: input.ownerEmail || null,
        name: input.ownerName || null,
        role: input.ownerRole || null,
        region: input.region || null,
      },
      capturedAt: new Date().toISOString(),
    },
  };
}

export function buildIdentityPersistenceFields(input: {
  ownerEmail?: string | null;
  ownerName?: string | null;
  ownerRole?: string | null;
}) {
  const authenticatedUser = getAuthenticatedUser();
  const actingUser = getActingUser();
  const operatorUser = getOperatorUser();

  return {
    ownerUserId: null,
    ownerEmail: input.ownerEmail || null,
    ownerName: input.ownerName || null,
    ownerRole: input.ownerRole || null,
    operatorUserId: operatorUser?.id || null,
    operatorEmail: operatorUser?.email || null,
    operatorRole: operatorUser?.userRole || operatorUser?.role || null,
    actingUserId: actingUser?.id || null,
    actingUserEmail: actingUser?.email || null,
    actingUserRole: actingUser?.userRole || actingUser?.role || null,
    authenticatedUserId: authenticatedUser?.id || null,
    authenticatedUserEmail: authenticatedUser?.email || null,
    authenticatedUserRole: authenticatedUser?.userRole || authenticatedUser?.role || null,
  };
}

export function getStoredPortalRole(): PortalRole {
  if (typeof window === 'undefined') return null;

  try {
    const backendUserStr = localStorage.getItem('cosun_backend_user');
    if (backendUserStr) {
      const backendUser = JSON.parse(backendUserStr);
      const portalRole = String(backendUser?.portal_role || '').trim().toLowerCase();
      if (portalRole === 'admin' || portalRole === 'staff' || portalRole === 'supplier' || portalRole === 'customer') {
        return portalRole as PortalRole;
      }
    }

    const authUser = getCurrentUser();
    if (authUser?.type === 'admin') return 'admin';
    if (authUser?.type === 'supplier') return 'supplier';
    if (authUser?.type === 'customer') return 'customer';
  } catch (e) {
    console.error('Failed to get stored portal role:', e);
  }

  return null;
}

export function isStoredStaffPortalRole(): boolean {
  const portalRole = getStoredPortalRole();
  return portalRole === 'admin' || portalRole === 'staff';
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
