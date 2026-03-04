// 🔥 数据库初始化脚本 - 福建高盛达富B2B外贸系统（三Portal完整闭环）
import { createClient } from 'jsr:@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function initializeDatabase() {
  console.log('🚀 开始初始化数据库（三Portal完整业务闭环）...');

  try {
    // 1. 创建内部员工账号（Admin Portal）
    await createInternalUsers();
    
    // 2. 创建客户账号（Customer Portal）
    await createCustomerUsers();
    
    // 3. 创建供应商账号（Supplier Portal）
    await createSupplierUsers();
    
    // 4. 创建客户数据
    await createCustomerData();
    
    // 5. 创建供应商数据
    await createSupplierData();
    
    // 6. 创建完整业务流程数据（询价→报价→订单→采购→发货）
    await createBusinessFlowData();
    
    console.log('✅ 数据库初始化完成！三Portal业务闭环已就绪');
    return { success: true };
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error);
    return { success: false, error };
  }
}

// ========== 1. 创建内部员工账号（Admin Portal）==========
async function createInternalUsers() {
  console.log('📋 创建内部员工账号（Admin Portal）...');
  
  const internalUsers = [
    // 最高层级
    {
      id: 'user_ceo',
      username: 'ceo',
      password: 'cosun2024',
      name: '张明',
      email: 'ceo@cosun.com',
      role: 'CEO',
      region: 'all',
      department: '管理层',
      status: 'active',
      type: 'admin'
    },
    {
      id: 'user_cfo',
      username: 'cfo',
      password: 'cosun2024',
      name: '李华',
      email: 'cfo@cosun.com',
      role: 'CFO',
      region: 'all',
      department: '财务部',
      status: 'active',
      type: 'admin'
    },
    // 销售团队
    {
      id: 'user_sales_director',
      username: 'sales.director',
      password: 'cosun2024',
      name: '王强',
      email: 'sales.director@cosun.com',
      role: 'Sales_Manager',
      region: 'all', // 销售总监
      department: '销售部',
      status: 'active',
      type: 'admin'
    },
    {
      id: 'user_john_smith',
      username: 'john.smith',
      password: 'cosun2024',
      name: 'John Smith',
      email: 'john.smith@cosun.com',
      role: 'Sales_Manager',
      region: 'NA', // 北美区域主管
      department: '销售部-北美',
      status: 'active',
      type: 'admin'
    },
    {
      id: 'user_carlos_silva',
      username: 'carlos.silva',
      password: 'cosun2024',
      name: 'Carlos Silva',
      email: 'carlos.silva@cosun.com',
      role: 'Sales_Manager',
      region: 'SA', // 南美区域主管
      department: '销售部-南美',
      status: 'active',
      type: 'admin'
    },
    {
      id: 'user_hans_mueller',
      username: 'hans.mueller',
      password: 'cosun2024',
      name: 'Hans Mueller',
      email: 'hans.mueller@cosun.com',
      role: 'Sales_Manager',
      region: 'EA', // 欧非区域主管
      department: '销售部-欧非',
      status: 'active',
      type: 'admin'
    },
    {
      id: 'user_maria',
      username: 'zhangwei',  // 🔥 修改用户名
      password: 'cosun123',
      name: '张伟',  // 🔥 保持中文名
      email: 'zhangwei@cosun.com',  // 🔥 修改邮箱
      role: 'Sales_Rep',
      region: 'NA', // 北美业务员
      department: '销售部-北美',
      status: 'active',
      type: 'admin'
    },
    {
      id: 'user_ana_santos',
      username: 'lifang',  // 🔥 修改用户名
      password: 'cosun2024',
      name: '李芳',  // 🔥 修改为中文名
      email: 'lifang@cosun.com',  // 🔥 修改邮箱
      role: 'Sales_Rep',
      region: 'SA', // 南美业务员
      department: '销售部-南美',
      status: 'active',
      type: 'admin'
    },
    {
      id: 'user_emma_thompson',
      username: 'wangfang',  // 🔥 修改用户名
      password: 'cosun2024',
      name: '王芳',  // 🔥 修改为中文名
      email: 'wangfang@cosun.com',  // 🔥 修改邮箱
      role: 'Sales_Rep',
      region: 'EA', // 欧非业务员
      department: '销售部-欧非',
      status: 'active',
      type: 'admin'
    },
    // 职能部门
    {
      id: 'user_finance',
      username: 'finance',
      password: 'cosun2024',
      name: '赵敏',
      email: 'finance@cosun.com',
      role: 'Finance',
      region: 'all',
      department: '财务部',
      status: 'active',
      type: 'admin'
    },
    {
      id: 'user_procurement',
      username: 'procurement',
      password: 'cosun2024',
      name: '刘刚',
      email: 'procurement@cosun.com',
      role: 'Procurement',
      region: 'all',
      department: '采购部',
      status: 'active',
      type: 'admin'
    },
    // 系统管理
    {
      id: 'user_admin',
      username: 'admin',
      password: 'admin123',
      name: '系统管理员',
      email: 'admin@cosun.com',
      role: 'Admin',
      region: 'all',
      department: 'IT部',
      status: 'active',
      type: 'admin'
    },
    {
      id: 'user_marketing',
      username: 'marketing',
      password: 'cosun2024',
      name: '李娜',
      email: 'marketing@cosun.com',
      role: 'Marketing_Ops',
      region: 'all',
      department: '市场部',
      status: 'active',
      type: 'admin'
    }
  ];

  for (const user of internalUsers) {
    await supabase.from('kv_store_880fd43b').upsert({
      key: `user:${user.username}`,
      value: user
    });
    await supabase.from('kv_store_880fd43b').upsert({
      key: `user:id:${user.id}`,
      value: user
    });
  }
  
  console.log('✅ 内部员工账号创建完成（13个）');
}

// ========== 2. 创建客户账号（Customer Portal）==========
async function createCustomerUsers() {
  console.log('📋 创建客户账号（Customer Portal）...');
  
  const customerUsers = [
    {
      id: 'customer_abc',
      username: 'abc.customer',
      password: 'customer123',
      email: 'info@abc-supplies.com',
      companyName: 'ABC Building Supplies',
      country: 'USA',
      region: 'NA',
      contactPerson: 'David Johnson',
      phone: '+1-555-0123',
      type: 'customer',
      status: 'active',
      level: 'A',
      salesRep: 'user_maria', // 对应的业务员
      createdAt: new Date().toISOString()
    },
    {
      id: 'customer_brasil',
      username: 'brasil.customer',
      password: 'customer123',
      email: 'contato@brasilconstruction.com.br',
      companyName: 'Brasil Construction Co.',
      country: 'Brazil',
      region: 'SA',
      contactPerson: 'Roberto Silva',
      phone: '+55-11-1234-5678',
      type: 'customer',
      status: 'active',
      level: 'B',
      salesRep: 'user_ana_santos',
      createdAt: new Date().toISOString()
    },
    {
      id: 'customer_europa',
      username: 'europa.customer',
      password: 'customer123',
      email: 'info@europa-trading.de',
      companyName: 'Europa Trading GmbH',
      country: 'Germany',
      region: 'EA',
      contactPerson: 'Klaus Schmidt',
      phone: '+49-30-1234-5678',
      type: 'customer',
      status: 'active',
      level: 'A',
      salesRep: 'user_emma_thompson',
      createdAt: new Date().toISOString()
    }
  ];

  for (const customer of customerUsers) {
    await supabase.from('kv_store_880fd43b').upsert({
      key: `customer_user:${customer.username}`,
      value: customer
    });
    await supabase.from('kv_store_880fd43b').upsert({
      key: `customer_user:id:${customer.id}`,
      value: customer
    });
  }
  
  console.log('✅ 客户账号创建完成（3个）');
}

// ========== 3. 创建供应商账号（Supplier Portal）==========
async function createSupplierUsers() {
  console.log('📋 创建供应商账号（Supplier Portal）...');
  
  const supplierUsers = [
    {
      id: 'supplier_gd',
      username: 'gd.supplier',
      password: 'supplier123',
      email: 'sales@gd-hardware.com',
      companyName: '广东五金制造厂',
      companyNameEn: 'Guangdong Hardware Manufacturing',
      region: 'Guangdong',
      contactPerson: '张伟',
      phone: '+86-757-1234-5678',
      type: 'supplier',
      status: 'active',
      category: '五金制品',
      products: ['门把手', '铰链', '锁具'],
      rating: 'A',
      createdAt: new Date().toISOString()
    },
    {
      id: 'supplier_zj',
      username: 'zj.supplier',
      password: 'supplier123',
      email: 'export@zj-building.com',
      companyName: '浙江建材集团',
      companyNameEn: 'Zhejiang Building Materials Group',
      region: 'Zhejiang',
      contactPerson: '李明',
      phone: '+86-571-8765-4321',
      type: 'supplier',
      status: 'active',
      category: '建筑材料',
      products: ['卫浴产品', '门窗配件', '建筑五金'],
      rating: 'A',
      createdAt: new Date().toISOString()
    }
  ];

  for (const supplier of supplierUsers) {
    await supabase.from('kv_store_880fd43b').upsert({
      key: `supplier_user:${supplier.username}`,
      value: supplier
    });
    await supabase.from('kv_store_880fd43b').upsert({
      key: `supplier_user:id:${supplier.id}`,
      value: supplier
    });
  }
  
  console.log('✅ 供应商账号创建完成（2个）');
}

// ========== 4. 创建客户数据 ==========
async function createCustomerData() {
  console.log('📋 创建客户数据...');
  
  const customers = [
    {
      id: 'customer_abc',
      companyName: 'ABC Building Supplies',
      country: 'USA',
      region: 'NA',
      industry: 'Retail',
      contactPerson: 'David Johnson',
      email: 'info@abc-supplies.com',
      phone: '+1-555-0123',
      status: 'active',
      level: 'A',
      salesRep: 'user_maria',
      totalOrders: 0,
      totalRevenue: 0,
      createdAt: new Date().toISOString()
    },
    {
      id: 'customer_brasil',
      companyName: 'Brasil Construction Co.',
      country: 'Brazil',
      region: 'SA',
      industry: 'Construction',
      contactPerson: 'Roberto Silva',
      email: 'contato@brasilconstruction.com.br',
      phone: '+55-11-1234-5678',
      status: 'active',
      level: 'B',
      salesRep: 'user_ana_santos',
      totalOrders: 0,
      totalRevenue: 0,
      createdAt: new Date().toISOString()
    },
    {
      id: 'customer_europa',
      companyName: 'Europa Trading GmbH',
      country: 'Germany',
      region: 'EA',
      industry: 'Distribution',
      contactPerson: 'Klaus Schmidt',
      email: 'info@europa-trading.de',
      phone: '+49-30-1234-5678',
      status: 'active',
      level: 'A',
      salesRep: 'user_emma_thompson',
      totalOrders: 0,
      totalRevenue: 0,
      createdAt: new Date().toISOString()
    }
  ];

  for (const customer of customers) {
    await supabase.from('kv_store_880fd43b').upsert({
      key: `customer:${customer.id}`,
      value: customer
    });
  }
  
  console.log('✅ 客户数据创建完成');
}

// ========== 5. 创建供应商数据 ==========
async function createSupplierData() {
  console.log('📋 创建供应商数据...');
  
  const suppliers = [
    {
      id: 'supplier_gd',
      companyName: '广东五金制造厂',
      companyNameEn: 'Guangdong Hardware Manufacturing',
      region: 'Guangdong',
      contactPerson: '张伟',
      email: 'sales@gd-hardware.com',
      phone: '+86-757-1234-5678',
      status: 'active',
      category: '五金制品',
      products: ['门把手', '铰链', '锁具'],
      rating: 'A',
      leadTime: '30天',
      paymentTerms: 'T/T 30% deposit, 70% before shipment',
      createdAt: new Date().toISOString()
    },
    {
      id: 'supplier_zj',
      companyName: '浙江建材集团',
      companyNameEn: 'Zhejiang Building Materials Group',
      region: 'Zhejiang',
      contactPerson: '李明',
      email: 'export@zj-building.com',
      phone: '+86-571-8765-4321',
      status: 'active',
      category: '建筑材料',
      products: ['卫浴产品', '门窗配件', '建筑五金'],
      rating: 'A',
      leadTime: '45天',
      paymentTerms: 'T/T 30% deposit, 70% before shipment',
      createdAt: new Date().toISOString()
    }
  ];

  for (const supplier of suppliers) {
    await supabase.from('kv_store_880fd43b').upsert({
      key: `supplier:${supplier.id}`,
      value: supplier
    });
  }
  
  console.log('✅ 供应商数据创建完成');
}

// ========== 6. 创建完整业务流程数据 ==========
async function createBusinessFlowData() {
  console.log('📋 创建完整业务流程数据...');
  
  // 🔄 业务流程示例：
  // 1. 客户ABC发起询价 → 2. 业务员Maria接收 → 3. 采购询价 → 
  // 4. 供应商报价 → 5. 财务核价 → 6. Maria向客户报价 → 
  // 7. 客户下单 → 8. 采购下单给供应商 → 9. 供应商发货
  
  const timestamp = new Date().toISOString();
  
  // 1. 客户询价单
  const customerInquiry = {
    id: 'inq_customer_001',
    inquiryNumber: 'CINQ-2024-001',
    customerId: 'customer_abc',
    customerName: 'ABC Building Supplies',
    contactPerson: 'David Johnson',
    email: 'info@abc-supplies.com',
    region: 'NA',
    products: [
      {
        name: 'Door Handle - Stainless Steel',
        specification: '304 Stainless Steel, Polished',
        quantity: 5000,
        unit: 'pcs',
        targetPrice: 2.50,
        currency: 'USD'
      },
      {
        name: 'Cabinet Hinge',
        specification: 'Soft Close, Nickel Plated',
        quantity: 10000,
        unit: 'pcs',
        targetPrice: 0.80,
        currency: 'USD'
      }
    ],
    requiredDeliveryDate: '2024-12-31',
    status: 'received', // 已接收
    priority: 'high',
    source: 'Customer Portal',
    createdAt: timestamp,
    createdBy: 'customer_abc'
  };
  
  // 2. 分配给业务员Maria的询价单
  const internalInquiry = {
    ...customerInquiry,
    id: 'inq_internal_001',
    inquiryNumber: 'INQ-2024-001',
    assignedTo: 'user_maria',
    assignedToName: 'Maria Garcia',
    status: 'pending_procurement', // 等待采购询价
    notes: '客户是A级客户，价格敏感，需要快速报价'
  };
  
  // 3. 采购向供应商发起询价
  const procurementInquiry = {
    id: 'pinq_001',
    inquiryNumber: 'PINQ-2024-001',
    sourceInquiry: 'inq_internal_001',
    supplierId: 'supplier_gd',
    supplierName: '广东五金制造厂',
    products: [
      {
        name: 'Door Handle - Stainless Steel',
        specification: '304 Stainless Steel, Polished',
        quantity: 5000,
        unit: 'pcs'
      },
      {
        name: 'Cabinet Hinge',
        specification: 'Soft Close, Nickel Plated',
        quantity: 10000,
        unit: 'pcs'
      }
    ],
    status: 'sent', // 已发送给供应商
    sentBy: 'user_procurement',
    sentAt: timestamp,
    createdAt: timestamp
  };
  
  // 4. 供应商报价
  const supplierQuotation = {
    id: 'sq_001',
    quotationNumber: 'SQ-2024-001',
    inquiryId: 'pinq_001',
    supplierId: 'supplier_gd',
    supplierName: '广东五金制造厂',
    products: [
      {
        name: 'Door Handle - Stainless Steel',
        specification: '304 Stainless Steel, Polished',
        quantity: 5000,
        unit: 'pcs',
        unitPrice: 1.80, // 成本价
        totalPrice: 9000,
        currency: 'USD'
      },
      {
        name: 'Cabinet Hinge',
        specification: 'Soft Close, Nickel Plated',
        quantity: 10000,
        unit: 'pcs',
        unitPrice: 0.55, // 成本价
        totalPrice: 5500,
        currency: 'USD'
      }
    ],
    subtotal: 14500,
    shippingCost: 500,
    total: 15000,
    currency: 'USD',
    paymentTerms: 'T/T 30% deposit, 70% before shipment',
    deliveryTime: '30 days',
    validity: '30 days',
    status: 'submitted', // 已提交
    createdAt: timestamp,
    createdBy: 'supplier_gd'
  };
  
  // 5. 财务核价（计算利润率）
  const costAnalysis = {
    id: 'ca_001',
    inquiryId: 'inq_internal_001',
    supplierQuotationId: 'sq_001',
    items: [
      {
        name: 'Door Handle - Stainless Steel',
        quantity: 5000,
        costPrice: 1.80,
        suggestedPrice: 2.40, // 建议售价（33%利润率）
        targetMargin: 33
      },
      {
        name: 'Cabinet Hinge',
        quantity: 10000,
        costPrice: 0.55,
        suggestedPrice: 0.75, // 建议售价（36%利润率）
        targetMargin: 36
      }
    ],
    totalCost: 15000,
    suggestedTotal: 19500,
    targetMargin: 30,
    approvedBy: 'user_finance',
    approvedAt: timestamp,
    status: 'approved'
  };
  
  // 6. 业务员向客户报价
  const customerQuotation = {
    id: 'cq_001',
    quotationNumber: 'CQ-2024-001',
    inquiryId: 'inq_customer_001',
    customerId: 'customer_abc',
    customerName: 'ABC Building Supplies',
    salesRep: 'user_maria',
    salesRepName: 'Maria Garcia',
    products: [
      {
        name: 'Door Handle - Stainless Steel',
        specification: '304 Stainless Steel, Polished',
        quantity: 5000,
        unit: 'pcs',
        unitPrice: 2.40,
        totalPrice: 12000,
        currency: 'USD'
      },
      {
        name: 'Cabinet Hinge',
        specification: 'Soft Close, Nickel Plated',
        quantity: 10000,
        unit: 'pcs',
        unitPrice: 0.75,
        totalPrice: 7500,
        currency: 'USD'
      }
    ],
    subtotal: 19500,
    shippingCost: 800,
    total: 20300,
    currency: 'USD',
    paymentTerms: 'T/T 30% deposit, 70% before shipment',
    deliveryTime: '45 days',
    validity: '30 days',
    status: 'sent', // 已发送给客户
    sentAt: timestamp,
    createdAt: timestamp,
    createdBy: 'user_maria'
  };
  
  // 存储所有数据
  await supabase.from('kv_store_880fd43b').upsert({
    key: `customer_inquiry:${customerInquiry.id}`,
    value: customerInquiry
  });
  
  await supabase.from('kv_store_880fd43b').upsert({
    key: `inquiry:${internalInquiry.id}`,
    value: internalInquiry
  });
  
  await supabase.from('kv_store_880fd43b').upsert({
    key: `procurement_inquiry:${procurementInquiry.id}`,
    value: procurementInquiry
  });
  
  await supabase.from('kv_store_880fd43b').upsert({
    key: `supplier_quotation:${supplierQuotation.id}`,
    value: supplierQuotation
  });
  
  await supabase.from('kv_store_880fd43b').upsert({
    key: `cost_analysis:${costAnalysis.id}`,
    value: costAnalysis
  });
  
  await supabase.from('kv_store_880fd43b').upsert({
    key: `customer_quotation:${customerQuotation.id}`,
    value: customerQuotation
  });
  
  console.log('✅ 完整业务流程数据创建完成');
  console.log('   1️⃣ 客户询价 → 2️⃣ 业务员接收 → 3️⃣ 采购询价');
  console.log('   4️⃣ 供应商报价 → 5️⃣ 财务核价 → 6️⃣ 向客户报价');
  console.log('   ✨ 完整的三Portal业务闭环测试数据已就绪！');
}