/**
 * 🔥 模拟不同供应商的客户数据
 * 实际应该从后端API根据供应商ID获取
 * 
 * ⚠️ 重要说明：
 * - 供应商Portal的"客户"是指供应商的买方（即COSUN及其他采购公司）
 * - 供应商的主要客户是"福建高盛达富建材有限公司"（COSUN）
 * - 数据来源应与 /components/supplier/resources/CustomerManagement.tsx 保持一致
 */
export const SUPPLIER_CUSTOMERS_DB: Record<string, SupplierCustomer[]> = {
  // 默认供应商客户列表（所有供应商的主要客户）
  'default': [
    {
      id: 'CUST-001',
      companyName: '福建高盛达富建材有限公司',
      companyNameEn: 'FUJIAN GOSUNDA FU BUILDING MATERIALS CO., LTD.',
      country: '中国',
      city: '福州',
      region: 'Asia Pacific',
      contactPerson: '李总（采购总监）',
      email: 'purchasing@gosundafu.com',
      phone: '+86-591-8888-8888',
      assignedDate: '2023-06-10',
      status: 'active',
      totalOrders: 156,
      lastOrderDate: '2024-12-15',
      notes: 'VIP客户，福建地区最大建材进口商之一，主要服务北美、南美、欧非市场。要求品质稳定，交期准确。'
    }
  ]
};

/**
 * 🔥 获取当前供应商的客户列表
 * @param supplierId 供应商ID（从localStorage获取）
 * @returns 客户列表
 */
export function getSupplierCustomers(supplierId?: string): SupplierCustomer[] {
  // 如果没有提供supplierId，尝试从localStorage获取
  if (!supplierId) {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('cosun_current_user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          supplierId = user.supplierCode || user.email || 'default';
        } catch (e) {
          console.error('Failed to parse current user:', e);
        }
      }
    }
  }
  
  // 根据供应商ID查找对应的客户列表
  // 这里简化处理，默认返回default的客户列表
  // 实际应该根据真实的supplierId从数据库查询
  const customers = SUPPLIER_CUSTOMERS_DB['default'];
  
  console.log('📋 获取供应商客户列表:', {
    supplierId,
    customerCount: customers.length,
    customers: customers.map(c => c.companyName)
  });
  
  return customers;
}

/**
 * 🔥 根据客户ID获取客户详情
 */
export function getSupplierCustomerById(customerId: string): SupplierCustomer | undefined {
  const allCustomers = getSupplierCustomers();
  return allCustomers.find(c => c.id === customerId);
}

/**
 * 🔥 根据客户名称查找客户
 */
export function getSupplierCustomerByName(customerName: string): SupplierCustomer | undefined {
  const allCustomers = getSupplierCustomers();
  return allCustomers.find(c => 
    c.companyName === customerName || 
    c.companyNameEn === customerName
  );
}

/**
 * 🔥 获取活跃客户列表（用于下拉选择）
 */
export function getActiveSupplierCustomers(): SupplierCustomer[] {
  const allCustomers = getSupplierCustomers();
  return allCustomers.filter(c => c.status === 'active' || c.status === 'potential');
}