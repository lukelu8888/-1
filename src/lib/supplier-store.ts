/**
 * 📦 供应商库管理模块
 * 
 * 功能：
 * - 模拟生产环境的供应商库
 * - 测试环境：使用localStorage模拟数据库
 * - 生产环境：可切换到Supabase数据库
 * - 支持动态添加、查询供应商
 */

// 供应商信息接口
export interface Supplier {
  id: string;              // 供应商ID
  name: string;            // 供应商名称
  contact: string;         // 联系人
  email?: string;          // 邮箱
  phone?: string;          // 电话
  address?: string;        // 地址
  category?: string[];     // 产品类别（电气、卫浴、门窗配件等）
  status: 'active' | 'inactive';  // 状态
  createdAt?: string;      // 创建时间
}

// LocalStorage Key
const SUPPLIER_STORE_KEY = 'gsd_supplier_store';

/**
 * 初始化供应商库（测试数据）
 */
export function initSupplierStore(): void {
  // 检查是否已有数据
  const existing = localStorage.getItem(SUPPLIER_STORE_KEY);
  if (existing) {
    console.log('📦 供应商库已存在，跳过初始化');
    return;
  }

  // 创建13个测试供应商数据
  const testSuppliers: Supplier[] = [
    {
      id: 'SUP001',
      name: '福建XX建材',
      contact: '张经理',
      email: 'supplier1@gsd-test.com',
      phone: '0591-8888-0001',
      address: '福建省福州市',
      category: ['电气', '五金'],
      status: 'active',
      createdAt: '2024-01-01'
    },
    {
      id: 'SUP002',
      name: '广东YY五金',
      contact: '李经理',
      email: 'supplier2@gsd-test.com',
      phone: '020-8888-0002',
      address: '广东省广州市',
      category: ['五金', '工具'],
      status: 'active',
      createdAt: '2024-01-02'
    },
    {
      id: 'SUP003',
      name: '南平建材公司',
      contact: '王经理',
      email: 'supplier3@gsd-test.com',
      phone: '0599-8888-0003',
      address: '福建省南平市',
      category: ['建材', '门窗配件'],
      status: 'active',
      createdAt: '2024-01-03'
    },
    {
      id: 'SUP004',
      name: '泉州电器制造厂',
      contact: '陈经理',
      email: 'supplier4@gsd-test.com',
      phone: '0595-8888-0004',
      address: '福建省泉州市',
      category: ['电气', '照明'],
      status: 'active',
      createdAt: '2024-01-04'
    },
    {
      id: 'SUP005',
      name: '厦门五金批发城',
      contact: '林经理',
      email: 'supplier5@gsd-test.com',
      phone: '0592-8888-0005',
      address: '福建省厦门市',
      category: ['五金', '工具'],
      status: 'active',
      createdAt: '2024-01-05'
    },
    {
      id: 'SUP006',
      name: '龙岩建材有限公司',
      contact: '黄经理',
      email: 'supplier6@gsd-test.com',
      phone: '0597-8888-0006',
      address: '福建省龙岩市',
      category: ['建材', '劳保用品'],
      status: 'active',
      createdAt: '2024-01-06'
    },
    {
      id: 'SUP007',
      name: '漳州卫浴实业',
      contact: '吴经理',
      email: 'supplier7@gsd-test.com',
      phone: '0596-8888-0007',
      address: '福建省漳州市',
      category: ['卫浴', '五金'],
      status: 'active',
      createdAt: '2024-01-07'
    },
    {
      id: 'SUP008',
      name: '莆田门窗配件厂',
      contact: '郑经理',
      email: 'supplier8@gsd-test.com',
      phone: '0594-8888-0008',
      address: '福建省莆田市',
      category: ['门窗配件'],
      status: 'active',
      createdAt: '2024-01-08'
    },
    {
      id: 'SUP009',
      name: '三明劳保用品',
      contact: '刘经理',
      email: 'supplier9@gsd-test.com',
      phone: '0598-8888-0009',
      address: '福建省三明市',
      category: ['劳保用品'],
      status: 'active',
      createdAt: '2024-01-09'
    },
    {
      id: 'SUP010',
      name: '宁德电动工具',
      contact: '赵经理',
      email: 'supplier10@gsd-test.com',
      phone: '0593-8888-0010',
      address: '福建省宁德市',
      category: ['工具', '电气'],
      status: 'active',
      createdAt: '2024-01-10'
    },
    {
      id: 'SUP011',
      name: '福清管道配件',
      contact: '孙经理',
      email: 'supplier11@gsd-test.com',
      phone: '0591-8888-0011',
      address: '福建省福清市',
      category: ['卫浴', '五金'],
      status: 'active',
      createdAt: '2024-01-11'
    },
    {
      id: 'SUP012',
      name: '晋江塑料制品',
      contact: '周经理',
      email: 'supplier12@gsd-test.com',
      phone: '0595-8888-0012',
      address: '福建省晋江市',
      category: ['建材', '五金'],
      status: 'active',
      createdAt: '2024-01-12'
    },
    {
      id: 'SUP013',
      name: '石狮纺织劳保',
      contact: '马经理',
      email: 'supplier13@gsd-test.com',
      phone: '0595-8888-0013',
      address: '福建省石狮市',
      category: ['劳保用品'],
      status: 'active',
      createdAt: '2024-01-13'
    }
  ];

  // 存储到localStorage
  localStorage.setItem(SUPPLIER_STORE_KEY, JSON.stringify(testSuppliers));
  console.log('✅ 供应商库初始化成功：13个测试供应商');
}

/**
 * 获取所有供应商
 */
export function getAllSuppliers(): Supplier[] {
  const data = localStorage.getItem(SUPPLIER_STORE_KEY);
  if (!data) {
    console.warn('⚠️ 供应商库为空，正在初始化...');
    initSupplierStore();
    return getAllSuppliers();
  }
  
  try {
    const suppliers = JSON.parse(data) as Supplier[];
    return suppliers.filter(s => s.status === 'active');
  } catch (error) {
    console.error('❌ 供应商库数据解析失败:', error);
    return [];
  }
}

/**
 * 根据ID获取供应商
 */
export function getSupplierById(id: string): Supplier | null {
  const suppliers = getAllSuppliers();
  return suppliers.find(s => s.id === id) || null;
}

/**
 * 根据名称获取供应商
 */
export function getSupplierByName(name: string): Supplier | null {
  const suppliers = getAllSuppliers();
  return suppliers.find(s => s.name === name) || null;
}

/**
 * 添加新供应商
 */
export function addSupplier(supplier: Omit<Supplier, 'id' | 'createdAt'>): Supplier {
  const suppliers = getAllSuppliers();
  
  // 生成新ID
  const newId = `SUP${String(suppliers.length + 1).padStart(3, '0')}`;
  
  const newSupplier: Supplier = {
    ...supplier,
    id: newId,
    createdAt: new Date().toISOString().split('T')[0]
  };
  
  suppliers.push(newSupplier);
  localStorage.setItem(SUPPLIER_STORE_KEY, JSON.stringify(suppliers));
  
  console.log('✅ 新增供应商:', newSupplier.name);
  return newSupplier;
}

/**
 * 更新供应商信息
 */
export function updateSupplier(id: string, updates: Partial<Supplier>): boolean {
  const data = localStorage.getItem(SUPPLIER_STORE_KEY);
  if (!data) return false;
  
  try {
    const suppliers = JSON.parse(data) as Supplier[];
    const index = suppliers.findIndex(s => s.id === id);
    
    if (index === -1) {
      console.warn('⚠️ 供应商不存在:', id);
      return false;
    }
    
    suppliers[index] = { ...suppliers[index], ...updates };
    localStorage.setItem(SUPPLIER_STORE_KEY, JSON.stringify(suppliers));
    
    console.log('✅ 供应商信息已更新:', suppliers[index].name);
    return true;
  } catch (error) {
    console.error('❌ 更新供应商失败:', error);
    return false;
  }
}

/**
 * 停用供应商（软删除）
 */
export function deactivateSupplier(id: string): boolean {
  return updateSupplier(id, { status: 'inactive' });
}

/**
 * 根据产品类别筛选供应商
 */
export function getSuppliersByCategory(category: string): Supplier[] {
  const suppliers = getAllSuppliers();
  return suppliers.filter(s => s.category?.includes(category));
}

/**
 * 🔥 转换为Personnel格式（用于通知系统）
 */
export function getSuppliersAsPersonnel() {
  const suppliers = getAllSuppliers();
  return suppliers.map(s => ({
    name: s.name,
    nameEn: s.name,
    role: '供应商',
    roleEn: 'Supplier',
    displayName: s.name,
    email: s.email,
    phone: s.phone,
    // 扩展字段：供应商特有信息
    supplierId: s.id,
    supplierContact: s.contact,
    supplierCategory: s.category
  }));
}

/**
 * 清空供应商库（仅用于测试）
 */
export function clearSupplierStore(): void {
  localStorage.removeItem(SUPPLIER_STORE_KEY);
  console.log('🗑️ 供应商库已清空');
}

/**
 * 重置供应商库（恢复初始测试数据）
 */
export function resetSupplierStore(): void {
  clearSupplierStore();
  initSupplierStore();
  console.log('🔄 供应商库已重置为初始测试数据');
}
