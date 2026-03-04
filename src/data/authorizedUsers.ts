// Authorized users database (simulated)
export interface AuthorizedUser {
  id: string;
  username: string;
  password: string;
  email: string;
  company: string;
  companyId: string; // 🆕 Company ID for multi-user support
  role: 'admin' | 'customer' | 'supplier' | 'agent';
  userRole?: 'company_admin' | 'standard_user'; // 🆕 Role within the company
  permissions: string[];
  registeredDate: string;
  hasOrders: boolean; // Whether the user has placed orders
  orderCount: number; // Number of orders placed
  lastOrderDate?: string; // Last order date
  activeShipments?: string[]; // Active container numbers
  // 🌍 Region and country information
  region?: 'North America' | 'South America' | 'Europe & Africa';
  country?: string;
  currency?: 'USD' | 'EUR' | 'GBP' | 'BRL' | 'CAD';
}

// In a real application, passwords would be hashed
export const authorizedUsers: AuthorizedUser[] = [
  // ========== ADMIN PORTAL USERS ==========
  // 1️⃣ CEO - 老板（公司掌舵者）
  {
    id: 'ceo001',
    username: 'ceo',
    password: 'cosun2024', // 🔥 CEO专属账号
    email: 'ceo@cosun.com',
    company: 'COSUN Building Materials',
    companyId: 'cosun001',
    role: 'admin',
    userRole: 'company_admin',
    permissions: ['track_container', 'freight_quote', 'view_all_shipments', 'manage_users', 'manage_customers', 'manage_suppliers', 'manage_orders', 'manage_quotations', 'view_finance', 'manage_products', 'manage_finance'],
    registeredDate: '2024-01-15',
    hasOrders: true,
    orderCount: 0,
    activeShipments: ['CSNU1234567', 'MSCU9876543', 'HLCU5555555']
  },
  
  // 1️⃣-1️⃣ 系统管理员 - IT技术支持（系统维护）
  {
    id: 'admin001',
    username: 'admin',
    password: 'admin123', // 🔥 系统管理员账号
    email: 'admin@cosun.com',
    company: 'COSUN Building Materials',
    companyId: 'cosun001',
    role: 'admin',
    userRole: 'standard_user',
    permissions: ['manage_users', 'manage_settings', 'view_all_data', 'backup_data'], // 🔧 仅系统管理权限
    registeredDate: '2024-01-15',
    hasOrders: false,
    orderCount: 0,
    activeShipments: []
  },
  
  // 2️⃣ CFO - 财务总监
  {
    id: 'admin002',
    username: 'cfo',
    password: 'cosun2024',
    email: 'cfo@cosun.com',
    company: 'COSUN Building Materials',
    companyId: 'cosun001',
    role: 'admin',
    userRole: 'standard_user',
    permissions: ['view_all_shipments', 'manage_customers', 'manage_suppliers', 'manage_orders', 'manage_quotations', 'view_finance', 'manage_finance'],
    registeredDate: '2024-01-15',
    hasOrders: true,
    orderCount: 0,
    activeShipments: []
  },
  
  // 3️⃣ 销售总监
  {
    id: 'admin003',
    username: 'sales.director',
    password: 'cosun2024',
    email: 'sales.director@cosun.com',
    company: 'COSUN Building Materials',
    companyId: 'cosun001',
    role: 'admin',
    userRole: 'Sales_Director', // 🔥 修复：从 'standard_user' 改为 'Sales_Director'
    permissions: ['manage_customers', 'manage_orders', 'manage_quotations', 'view_finance'],
    registeredDate: '2024-01-15',
    hasOrders: true,
    orderCount: 0,
    activeShipments: []
  },
  
  // 4️⃣ 北美区域主管
  {
    id: 'admin004',
    username: 'john.smith',
    password: 'cosun2024',
    email: 'john.smith@cosun.com',
    company: 'COSUN Building Materials',
    companyId: 'cosun001',
    role: 'admin',
    userRole: 'standard_user',
    permissions: ['manage_customers', 'manage_orders', 'manage_quotations', 'view_finance'],
    registeredDate: '2024-01-15',
    hasOrders: true,
    orderCount: 0,
    activeShipments: [],
    region: 'North America',
    country: 'USA',
    currency: 'USD'
  },
  
  // 5️⃣ 南美区域主管
  {
    id: 'admin005',
    username: 'carlos.silva',
    password: 'cosun2024',
    email: 'carlos.silva@cosun.com',
    company: 'COSUN Building Materials',
    companyId: 'cosun001',
    role: 'admin',
    userRole: 'standard_user',
    permissions: ['manage_customers', 'manage_orders', 'manage_quotations', 'view_finance'],
    registeredDate: '2024-01-15',
    hasOrders: true,
    orderCount: 0,
    activeShipments: [],
    region: 'South America',
    country: 'Brazil',
    currency: 'USD'
  },
  
  // 6️⃣ 欧非区域主管
  {
    id: 'admin006',
    username: 'hans.mueller',
    password: 'cosun2024',
    email: 'hans.mueller@cosun.com',
    company: 'COSUN Building Materials',
    companyId: 'cosun001',
    role: 'admin',
    userRole: 'standard_user',
    permissions: ['manage_customers', 'manage_orders', 'manage_quotations', 'view_finance'],
    registeredDate: '2024-01-15',
    hasOrders: true,
    orderCount: 0,
    activeShipments: [],
    region: 'Europe & Africa',
    country: 'Germany',
    currency: 'EUR'
  },
  
  // 7️⃣ 北美业务员
  {
    id: 'admin007',
    username: 'maria.garcia',
    password: 'cosun2024',
    email: 'maria.garcia@cosun.com',
    company: 'COSUN Building Materials',
    companyId: 'cosun001',
    role: 'admin',
    userRole: 'standard_user',
    permissions: ['manage_customers', 'manage_orders', 'manage_quotations'],
    registeredDate: '2024-01-15',
    hasOrders: true,
    orderCount: 0,
    activeShipments: [],
    region: 'North America',
    country: 'USA',
    currency: 'USD'
  },
  
  // 🔥 7️⃣-1️⃣ 北美业务员 - Maria（简化账号，与RBAC系统保持一致）
  {
    id: 'admin007b',
    username: 'maria',
    password: 'cosun123', // 🔥 与init-database.tsx一致
    email: 'maria@cosun.com', // 🔥 与RBAC系统一致
    company: 'COSUN Building Materials',
    companyId: 'cosun001',
    role: 'admin',
    userRole: 'standard_user',
    permissions: ['manage_customers', 'manage_orders', 'manage_quotations'],
    registeredDate: '2024-01-15',
    hasOrders: true,
    orderCount: 0,
    activeShipments: [],
    region: 'North America',
    country: 'USA',
    currency: 'USD'
  },
  
  // 8️⃣ 南美业务员
  {
    id: 'admin008',
    username: 'ana.santos',
    password: 'cosun2024',
    email: 'ana.santos@cosun.com',
    company: 'COSUN Building Materials',
    companyId: 'cosun001',
    role: 'admin',
    userRole: 'standard_user',
    permissions: ['manage_customers', 'manage_orders', 'manage_quotations'],
    registeredDate: '2024-01-15',
    hasOrders: true,
    orderCount: 0,
    activeShipments: [],
    region: 'South America',
    country: 'Brazil',
    currency: 'USD'
  },
  
  // 9️⃣ 欧非业务员
  {
    id: 'admin009',
    username: 'emma.thompson',
    password: 'cosun2024',
    email: 'emma.thompson@cosun.com',
    company: 'COSUN Building Materials',
    companyId: 'cosun001',
    role: 'admin',
    userRole: 'standard_user',
    permissions: ['manage_customers', 'manage_orders', 'manage_quotations'],
    registeredDate: '2024-01-15',
    hasOrders: true,
    orderCount: 0,
    activeShipments: [],
    region: 'Europe & Africa',
    country: 'United Kingdom',
    currency: 'GBP'
  },
  
  // 🔟 财务人员
  {
    id: 'admin010',
    username: 'finance',
    password: 'cosun2024',
    email: 'finance@cosun.com',
    company: 'COSUN Building Materials',
    companyId: 'cosun001',
    role: 'admin',
    userRole: 'standard_user',
    permissions: ['view_all_shipments', 'manage_customers', 'manage_suppliers', 'manage_orders', 'view_finance', 'manage_finance'],
    registeredDate: '2024-01-15',
    hasOrders: true,
    orderCount: 0,
    activeShipments: []
  },
  
  // 1️⃣1️⃣ 采购经理
  {
    id: 'admin011',
    username: 'procurement',
    password: 'cosun2024',
    email: 'procurement@cosun.com',
    company: 'COSUN Building Materials',
    companyId: 'cosun001',
    role: 'admin',
    userRole: 'standard_user',
    permissions: ['manage_suppliers', 'manage_orders', 'view_finance'],
    registeredDate: '2024-01-15',
    hasOrders: true,
    orderCount: 0,
    activeShipments: []
  },
  
  // 1️⃣2️⃣ 运营专员（社媒营销）
  {
    id: 'admin012',
    username: 'marketing',
    password: 'cosun2024',
    email: 'marketing@cosun.com',
    company: 'COSUN Building Materials',
    companyId: 'cosun001',
    role: 'admin',
    userRole: 'Sales_Rep', // 🔥 RBAC角色
    permissions: ['manage_customers', 'view_finance'], // 🔥 社媒营销权限
    registeredDate: '2024-01-15',
    hasOrders: false,
    orderCount: 0,
    activeShipments: []
  },
  
  // 1️⃣3️⃣ 业务员-张伟（北美）
  {
    id: 'sales1',
    username: 'zhangwei',
    password: 'cosun123',
    email: 'zhangwei@cosun.com',
    company: 'COSUN Building Materials',
    companyId: 'cosun001',
    role: 'admin',
    userRole: 'Sales_Rep', // 🔥 RBAC角色
    permissions: ['manage_customers', 'manage_orders', 'manage_quotations'],
    registeredDate: '2024-01-15',
    hasOrders: true,
    orderCount: 0,
    activeShipments: [],
    region: 'NA',
    country: 'USA',
    currency: 'USD'
  },
  
  // 1️⃣4️⃣ 业务员-李芳（南美）
  {
    id: 'sales2',
    username: 'lifang',
    password: 'cosun2024',
    email: 'lifang@cosun.com',
    company: 'COSUN Building Materials',
    companyId: 'cosun001',
    role: 'admin',
    userRole: 'Sales_Rep', // 🔥 RBAC角色
    permissions: ['manage_customers', 'manage_orders', 'manage_quotations'],
    registeredDate: '2024-01-15',
    hasOrders: true,
    orderCount: 0,
    activeShipments: [],
    region: 'SA',
    country: 'Brazil',
    currency: 'USD'
  },
  
  // 1️⃣5️⃣ 业务员-王芳（欧非）
  {
    id: 'sales3',
    username: 'wangfang',
    password: 'cosun2024',
    email: 'wangfang@cosun.com',
    company: 'COSUN Building Materials',
    companyId: 'cosun001',
    role: 'admin',
    userRole: 'Sales_Rep', // 🔥 RBAC角色
    permissions: ['manage_customers', 'manage_orders', 'manage_quotations'],
    registeredDate: '2024-01-15',
    hasOrders: true,
    orderCount: 0,
    activeShipments: [],
    region: 'EA',
    country: 'United Kingdom',
    currency: 'GBP'
  },
  
  // ========== 旧账号（已废弃，保留兼容性）==========
  {
    id: 'admin002_old',
    username: 'sales',
    password: 'sales123',
    email: 'sales@cosun.com',
    company: 'COSUN Building Materials',
    companyId: 'cosun001',
    role: 'admin',
    userRole: 'standard_user',
    permissions: ['manage_customers', 'manage_orders', 'manage_quotations', 'view_finance'],
    registeredDate: '2024-02-10',
    hasOrders: true,
    orderCount: 0,
    activeShipments: []
  },
  
  // ========== CUSTOMER PORTAL USERS ==========
  // 🇺🇸 North America Region
  {
    id: 'customer001',
    username: 'john.smith',
    password: 'acme123',
    email: 'john.smith@acmesupply.com',
    company: 'ACME Supply Co.',
    companyId: 'acme001',
    role: 'customer',
    userRole: 'company_admin', // 🆕 Main admin account
    permissions: ['track_container', 'freight_quote', 'place_order', 'view_quotations', 'view_invoices'],
    registeredDate: '2024-03-20',
    hasOrders: true,
    orderCount: 2,
    lastOrderDate: '2025-11-20',
    activeShipments: [],
    region: 'North America',
    country: 'USA',
    currency: 'USD'
  },
  // 🆕 ACME Supply Co. - Additional User (same company)
  {
    id: 'customer001_sub1',
    username: 'sarah.jones',
    password: 'acme123',
    email: 'sarah.jones@acmesupply.com',
    company: 'ACME Supply Co.',
    companyId: 'acme001', // 🔥 Same company ID as john.smith
    role: 'customer',
    userRole: 'standard_user', // 🆕 Standard user account
    permissions: ['track_container', 'freight_quote', 'place_order', 'view_quotations', 'view_invoices'],
    registeredDate: '2024-06-15',
    hasOrders: true,
    orderCount: 2, // Shares same orders as john.smith
    lastOrderDate: '2025-11-20',
    activeShipments: [],
    region: 'North America',
    country: 'USA',
    currency: 'USD'
  },
  // 🆕 ACME Supply Co. - Purchasing Manager (same company)
  {
    id: 'customer001_sub2',
    username: 'mike.wilson',
    password: 'acme123',
    email: 'mike.wilson@acmesupply.com',
    company: 'ACME Supply Co.',
    companyId: 'acme001', // 🔥 Same company ID
    role: 'customer',
    userRole: 'standard_user',
    permissions: ['track_container', 'freight_quote', 'place_order', 'view_quotations', 'view_invoices'],
    registeredDate: '2024-08-10',
    hasOrders: true,
    orderCount: 2,
    lastOrderDate: '2025-11-20',
    activeShipments: [],
    region: 'North America',
    country: 'USA',
    currency: 'USD'
  },
  // 🇩🇪 Europe Region
  {
    id: 'customer002',
    username: 'hans.mueller',
    password: 'buildmax123',
    email: 'hans.mueller@buildmax.de',
    company: 'BuildMax Trading GmbH',
    companyId: 'buildmax001',
    role: 'customer',
    permissions: ['track_container', 'freight_quote', 'place_order', 'view_quotations', 'view_invoices'],
    registeredDate: '2024-04-10',
    hasOrders: true,
    orderCount: 5,
    lastOrderDate: '2025-11-18',
    activeShipments: [],
    region: 'Europe & Africa',
    country: 'Germany',
    currency: 'EUR'
  },
  // 🇧🇷 South America Region
  {
    id: 'customer003',
    username: 'carlos.silva',
    password: 'construmax123',
    email: 'carlos.silva@construmax.com.br',
    company: 'ConstruMax Ltda',
    companyId: 'construmax001',
    role: 'customer',
    permissions: ['track_container', 'freight_quote', 'place_order', 'view_quotations', 'view_invoices'],
    registeredDate: '2024-05-15',
    hasOrders: true,
    orderCount: 3,
    lastOrderDate: '2025-11-15',
    activeShipments: [],
    region: 'South America',
    country: 'Brazil',
    currency: 'USD'
  },
  {
    id: 'customer004',
    username: 'services',
    password: 'homek123',
    email: 'services@homek.ca',
    company: 'Homek Building Supplies',
    companyId: 'homek001',
    role: 'customer',
    permissions: ['track_container', 'freight_quote', 'place_order', 'view_quotations', 'view_invoices'],
    registeredDate: '2024-03-20',
    hasOrders: true,
    orderCount: 12,
    lastOrderDate: '2024-11-10',
    activeShipments: ['CSNU1234567', 'MSCU9876543'],
    region: 'North America',
    country: 'Canada',
    currency: 'CAD'
  },
  {
    id: 'user002',
    username: 'demo',
    password: 'demo123',
    email: 'demo@customer.com',
    company: 'ABC Trading Co.',
    companyId: 'abc001',
    role: 'customer',
    permissions: ['track_container', 'freight_quote'],
    registeredDate: '2024-03-20',
    hasOrders: true,
    orderCount: 12,
    lastOrderDate: '2024-11-10',
    activeShipments: ['CSNU1234567', 'MSCU9876543']
  },
  {
    id: 'user003',
    username: 'johndoe',
    password: 'john123',
    email: 'john.doe@buildmart.com',
    company: 'BuildMart USA',
    companyId: 'buildmart001',
    role: 'customer',
    permissions: ['track_container', 'freight_quote'],
    registeredDate: '2024-05-10',
    hasOrders: true,
    orderCount: 8,
    lastOrderDate: '2024-11-05',
    activeShipments: ['HLCU5555555', 'OOLU2222222']
  },
  {
    id: 'user005',
    username: 'sarah',
    password: 'sarah123',
    email: 'sarah.chen@globalimports.com',
    company: 'Global Imports Inc.',
    companyId: 'globalimports001',
    role: 'customer',
    permissions: ['track_container', 'freight_quote'],
    registeredDate: '2024-06-15',
    hasOrders: true,
    orderCount: 15,
    lastOrderDate: '2024-11-12',
    activeShipments: ['CSNU1234567']
  },
  // New user without orders
  {
    id: 'user006',
    username: 'newuser',
    password: 'new123',
    email: 'newuser@example.com',
    company: 'New Customer Ltd.',
    companyId: 'newcustomer001',
    role: 'customer',
    permissions: ['freight_quote'],
    registeredDate: '2024-11-01',
    hasOrders: false,
    orderCount: 0,
    activeShipments: []
  },
  
  // ========== 🌍 NORTH AMERICA REGION - TEST CUSTOMERS ==========
  // 🇺🇸 USA Customer 1
  {
    id: 'customer_na_001',
    username: 'jimmy.wilson',
    password: 'jimmy123',
    email: 'jimmy.wilson@probuildsupply.com',
    company: 'ProBuild Supply Co.',
    companyId: 'probuild001',
    role: 'customer',
    permissions: ['track_container', 'freight_quote', 'place_order', 'view_quotations', 'view_invoices'],
    registeredDate: '2024-06-01',
    hasOrders: false,
    orderCount: 0,
    activeShipments: [],
    region: 'North America',
    country: 'USA',
    currency: 'USD'
  },
  // 🇺🇸 USA Customer 2
  {
    id: 'customer_na_002',
    username: 'lisa.martinez',
    password: 'lisa123',
    email: 'lisa.martinez@constructionmart.com',
    company: 'ConstructionMart Inc.',
    companyId: 'constructionmart001',
    role: 'customer',
    permissions: ['track_container', 'freight_quote', 'place_order', 'view_quotations', 'view_invoices'],
    registeredDate: '2024-07-10',
    hasOrders: false,
    orderCount: 0,
    activeShipments: [],
    region: 'North America',
    country: 'USA',
    currency: 'USD'
  },
  // 🇨🇦 Canada Customer
  {
    id: 'customer_na_003',
    username: 'robert.chen',
    password: 'robert123',
    email: 'robert.chen@northernbuild.ca',
    company: 'Northern Build Supplies Ltd.',
    companyId: 'northernbuild001',
    role: 'customer',
    permissions: ['track_container', 'freight_quote', 'place_order', 'view_quotations', 'view_invoices'],
    registeredDate: '2024-08-15',
    hasOrders: false,
    orderCount: 0,
    activeShipments: [],
    region: 'North America',
    country: 'Canada',
    currency: 'CAD'
  },

  // ========== 🌍 SOUTH AMERICA REGION - TEST CUSTOMERS ==========
  // 🇧🇷 Brazil Customer 1
  {
    id: 'customer_sa_001',
    username: 'maria.santos',
    password: 'maria123',
    email: 'maria.santos@brasilmateriais.com.br',
    company: 'Brasil Materiais de Construção',
    companyId: 'brasilmateriais001',
    role: 'customer',
    permissions: ['track_container', 'freight_quote', 'place_order', 'view_quotations', 'view_invoices'],
    registeredDate: '2024-06-20',
    hasOrders: false,
    orderCount: 0,
    activeShipments: [],
    region: 'South America',
    country: 'Brazil',
    currency: 'USD'
  },
  // 🇦🇷 Argentina Customer
  {
    id: 'customer_sa_002',
    username: 'diego.rodriguez',
    password: 'diego123',
    email: 'diego.rodriguez@argmateriales.com.ar',
    company: 'ArgMateriales S.A.',
    companyId: 'argmateriales001',
    role: 'customer',
    permissions: ['track_container', 'freight_quote', 'place_order', 'view_quotations', 'view_invoices'],
    registeredDate: '2024-07-25',
    hasOrders: false,
    orderCount: 0,
    activeShipments: [],
    region: 'South America',
    country: 'Argentina',
    currency: 'USD'
  },
  // 🇨🇱 Chile Customer
  {
    id: 'customer_sa_003',
    username: 'carmen.lopez',
    password: 'carmen123',
    email: 'carmen.lopez@chilemateriales.cl',
    company: 'Chile Materiales Ltda.',
    companyId: 'chilemateriales001',
    role: 'customer',
    permissions: ['track_container', 'freight_quote', 'place_order', 'view_quotations', 'view_invoices'],
    registeredDate: '2024-08-30',
    hasOrders: false,
    orderCount: 0,
    activeShipments: [],
    region: 'South America',
    country: 'Chile',
    currency: 'USD'
  },

  // ========== 🌍 EUROPE & AFRICA REGION - TEST CUSTOMERS ==========
  // 🇩🇪 Germany Customer
  {
    id: 'customer_ea_001',
    username: 'klaus.schmidt',
    password: 'klaus123',
    email: 'klaus.schmidt@deutschbau.de',
    company: 'DeutschBau Materials GmbH',
    companyId: 'deutschbau001',
    role: 'customer',
    permissions: ['track_container', 'freight_quote', 'place_order', 'view_quotations', 'view_invoices'],
    registeredDate: '2024-06-05',
    hasOrders: false,
    orderCount: 0,
    activeShipments: [],
    region: 'Europe & Africa',
    country: 'Germany',
    currency: 'EUR'
  },
  // 🇬🇧 UK Customer
  {
    id: 'customer_ea_002',
    username: 'emma.thompson',
    password: 'emma123',
    email: 'emma.thompson@ukbuildsupplies.co.uk',
    company: 'UK Build Supplies Ltd.',
    companyId: 'ukbuildsupplies001',
    role: 'customer',
    permissions: ['track_container', 'freight_quote', 'place_order', 'view_quotations', 'view_invoices'],
    registeredDate: '2024-07-15',
    hasOrders: false,
    orderCount: 0,
    activeShipments: [],
    region: 'Europe & Africa',
    country: 'United Kingdom',
    currency: 'GBP'
  },
  // 🇿🇦 South Africa Customer
  {
    id: 'customer_ea_003',
    username: 'thabo.mbeki',
    password: 'thabo123',
    email: 'thabo.mbeki@sabuilding.co.za',
    company: 'SA Building Materials (Pty) Ltd.',
    companyId: 'sabuilding001',
    role: 'customer',
    permissions: ['track_container', 'freight_quote', 'place_order', 'view_quotations', 'view_invoices'],
    registeredDate: '2024-08-20',
    hasOrders: false,
    orderCount: 0,
    activeShipments: [],
    region: 'Europe & Africa',
    country: 'South Africa',
    currency: 'USD'
  },
  
  // ========== 🔥 三Portal业务闭环测试账号 ==========
  // 🇺🇸 北美测试客户
  {
    id: 'customer_test_na',
    username: 'abc.customer',
    password: 'customer123',
    email: 'abc.customer@test.com',
    company: 'ABC Building Supplies',
    companyId: 'abc_test_001',
    role: 'customer',
    permissions: ['track_container', 'freight_quote', 'place_order', 'view_quotations', 'view_invoices'],
    registeredDate: '2024-11-01',
    hasOrders: false,
    orderCount: 0,
    activeShipments: [],
    region: 'North America',
    country: 'USA',
    currency: 'USD'
  },
  // 🇧🇷 南美测试客户
  {
    id: 'customer_test_sa',
    username: 'brasil.customer',
    password: 'customer123',
    email: 'brasil.customer@test.com',
    company: 'Brasil Construction Co.',
    companyId: 'brasil_test_001',
    role: 'customer',
    permissions: ['track_container', 'freight_quote', 'place_order', 'view_quotations', 'view_invoices'],
    registeredDate: '2024-11-01',
    hasOrders: false,
    orderCount: 0,
    activeShipments: [],
    region: 'South America',
    country: 'Brazil',
    currency: 'USD'
  },
  // 🇪🇺 欧非测试客户
  {
    id: 'customer_test_ea',
    username: 'europa.customer',
    password: 'customer123',
    email: 'europa.customer@test.com',
    company: 'Europa Trading GmbH',
    companyId: 'europa_test_001',
    role: 'customer',
    permissions: ['track_container', 'freight_quote', 'place_order', 'view_quotations', 'view_invoices'],
    registeredDate: '2024-11-01',
    hasOrders: false,
    orderCount: 0,
    activeShipments: [],
    region: 'Europe & Africa',
    country: 'Germany',
    currency: 'EUR'
  },
  
  // ========== SUPPLIER PORTAL USERS ==========
  {
    id: 'supplier001',
    username: 'factory',
    password: 'factory123',
    email: 'factory@supplier.cn',
    company: 'Guangzhou Lighting Manufacturing Co., Ltd.',
    companyId: 'guangzhoulighting001',
    role: 'supplier',
    permissions: ['manage_products', 'view_purchase_orders', 'update_inventory', 'update_shipments', 'upload_documents'],
    registeredDate: '2024-01-20',
    hasOrders: true,
    orderCount: 45, // Number of COSUN purchase orders
    lastOrderDate: '2024-11-14',
    activeShipments: ['CSNU1234567', 'MSCU9876543']
  },
  {
    id: 'supplier002',
    username: 'tiles',
    password: 'tiles123',
    email: 'sales@foshan-tiles.com',
    company: 'Foshan Ceramic Tiles Factory',
    companyId: 'foshantiles001',
    role: 'supplier',
    permissions: ['manage_products', 'view_purchase_orders', 'update_inventory', 'update_shipments', 'upload_documents'],
    registeredDate: '2024-02-15',
    hasOrders: true,
    orderCount: 38,
    lastOrderDate: '2024-11-12',
    activeShipments: ['HLCU5555555']
  },
  {
    id: 'supplier003',
    username: 'hardware',
    password: 'hardware123',
    email: 'export@zhongshan-hardware.com',
    company: 'Zhongshan Hardware Manufacturing',
    companyId: 'zhongshanhardware001',
    role: 'supplier',
    permissions: ['manage_products', 'view_purchase_orders', 'update_inventory', 'update_shipments'],
    registeredDate: '2024-03-10',
    hasOrders: true,
    orderCount: 28,
    lastOrderDate: '2024-11-08',
    activeShipments: []
  },
  
  // ========== 🔥 三Portal业务闭环测试供应商 ==========
  // 🏭 广东五金制造厂
  {
    id: 'supplier_test_gd',
    username: 'gd.supplier',
    password: 'supplier123',
    email: 'gd.supplier@test.com',
    company: '广东五金制造厂',
    companyId: 'gd_supplier_001',
    role: 'supplier',
    permissions: ['manage_products', 'view_purchase_orders', 'update_inventory', 'update_shipments', 'upload_documents'],
    registeredDate: '2024-11-01',
    hasOrders: false,
    orderCount: 0,
    activeShipments: []
  },
  // 🏭 浙江建材集团
  {
    id: 'supplier_test_zj',
    username: 'zj.supplier',
    password: 'supplier123',
    email: 'zj.supplier@test.com',
    company: '浙江建材集团',
    companyId: 'zj_supplier_001',
    role: 'supplier',
    permissions: ['manage_products', 'view_purchase_orders', 'update_inventory', 'update_shipments', 'upload_documents'],
    registeredDate: '2024-11-01',
    hasOrders: false,
    orderCount: 0,
    activeShipments: []
  },
  
  // ========== 🏭 真实供应商测试账户（来自suppliersDatabase）==========
  // SUP-001: 东莞市华盛电器有限公司
  {
    id: 'SUP-001',
    username: 'zhang',
    password: 'supplier123',
    email: 'zhang@huasheng.com',
    company: '东莞市华盛电器有限公司',
    companyId: 'DG-HS-001',
    role: 'supplier',
    permissions: ['manage_products', 'view_purchase_orders', 'update_inventory', 'update_shipments', 'upload_documents'],
    registeredDate: '2024-01-15',
    hasOrders: true,
    orderCount: 128,
    lastOrderDate: '2024-12-15',
    activeShipments: []
  },
  // SUP-002: 佛山市鑫达卫浴制造厂
  {
    id: 'SUP-002',
    username: 'li',
    password: 'supplier123',
    email: 'li@xinda.com',
    company: '佛山市鑫达卫浴制造厂',
    companyId: 'FS-XD-002',
    role: 'supplier',
    permissions: ['manage_products', 'view_purchase_orders', 'update_inventory', 'update_shipments', 'upload_documents'],
    registeredDate: '2024-02-10',
    hasOrders: true,
    orderCount: 96,
    lastOrderDate: '2024-12-10',
    activeShipments: []
  },
  // SUP-003: 温州精工五金配件厂
  {
    id: 'SUP-003',
    username: 'wang',
    password: 'supplier123',
    email: 'wang@jinggong.com',
    company: '温州精工五金配件厂',
    companyId: 'WZ-JG-003',
    role: 'supplier',
    permissions: ['manage_products', 'view_purchase_orders', 'update_inventory', 'update_shipments', 'upload_documents'],
    registeredDate: '2024-03-05',
    hasOrders: true,
    orderCount: 64,
    lastOrderDate: '2024-12-08',
    activeShipments: []
  },
  // SUP-004: 济南安全劳保用品公司
  {
    id: 'SUP-004',
    username: 'zhao',
    password: 'supplier123',
    email: 'zhao@safety.com',
    company: '济南安全劳保用品公司',
    companyId: 'JN-AQ-004',
    role: 'supplier',
    permissions: ['manage_products', 'view_purchase_orders', 'update_inventory', 'update_shipments', 'upload_documents'],
    registeredDate: '2024-04-20',
    hasOrders: true,
    orderCount: 45,
    lastOrderDate: '2024-12-05',
    activeShipments: []
  },
  // SUP-005: 宁波创新电器制造厂
  {
    id: 'SUP-005',
    username: 'liu',
    password: 'supplier123',
    email: 'liu@chuangxin.com',
    company: '宁波创新电器制造厂',
    companyId: 'NB-CX-005',
    role: 'supplier',
    permissions: ['manage_products', 'view_purchase_orders', 'update_inventory', 'update_shipments', 'upload_documents'],
    registeredDate: '2024-05-15',
    hasOrders: true,
    orderCount: 18,
    lastOrderDate: '2024-11-30',
    activeShipments: []
  },
  // SUP-006: 上海明辉建材有限公司
  {
    id: 'SUP-006',
    username: 'chen',
    password: 'supplier123',
    email: 'chen@minghui.com',
    company: '上海明辉建材有限公司',
    companyId: 'SH-MH-006',
    role: 'supplier',
    permissions: ['manage_products', 'view_purchase_orders', 'update_inventory', 'update_shipments', 'upload_documents'],
    registeredDate: '2024-06-01',
    hasOrders: true,
    orderCount: 156,
    lastOrderDate: '2024-12-16',
    activeShipments: ['CSNU1234567']
  },
  // SUP-007: 广州市优质五金制造厂
  {
    id: 'SUP-007',
    username: 'supplier_b',
    password: 'supplier123',
    email: 'supplier_b@test.com',
    company: '广州市优质五金制造厂',
    companyId: 'GZ-YZ-007',
    role: 'supplier',
    permissions: ['manage_products', 'view_purchase_orders', 'update_inventory', 'update_shipments', 'upload_documents'],
    registeredDate: '2024-07-10',
    hasOrders: false,
    orderCount: 0,
    lastOrderDate: null,
    activeShipments: []
  },
  // SUP-008: 东莞市精工卫浴科技公司
  {
    id: 'SUP-008',
    username: 'supplier_c',
    password: 'supplier123',
    email: 'supplier_c@test.com',
    company: '东莞市精工卫浴科技公司',
    companyId: 'DG-JG-008',
    role: 'supplier',
    permissions: ['manage_products', 'view_purchase_orders', 'update_inventory', 'update_shipments', 'upload_documents'],
    registeredDate: '2024-08-15',
    hasOrders: false,
    orderCount: 0,
    lastOrderDate: null,
    activeShipments: []
  },
  // SUP-009: 佛山市安全劳保用品有限公司
  {
    id: 'SUP-009',
    username: 'supplier_d',
    password: 'supplier123',
    email: 'supplier_d@test.com',
    company: '佛山市安全劳保用品有限公司',
    companyId: 'FS-AQ-009',
    role: 'supplier',
    permissions: ['manage_products', 'view_purchase_orders', 'update_inventory', 'update_shipments', 'upload_documents'],
    registeredDate: '2024-09-01',
    hasOrders: false,
    orderCount: 0,
    lastOrderDate: null,
    activeShipments: []
  },
  // SUP-010: 中山市照明电器制造厂
  {
    id: 'SUP-010',
    username: 'supplier_e',
    password: 'supplier123',
    email: 'supplier_e@test.com',
    company: '中山市照明电器制造厂',
    companyId: 'ZS-ZM-010',
    role: 'supplier',
    permissions: ['manage_products', 'view_purchase_orders', 'update_inventory', 'update_shipments', 'upload_documents'],
    registeredDate: '2024-10-05',
    hasOrders: false,
    orderCount: 0,
    lastOrderDate: null,
    activeShipments: []
  },
  // SUP-011: 温州市五金配件集团
  {
    id: 'SUP-011',
    username: 'supplier_f',
    password: 'supplier123',
    email: 'supplier_f@test.com',
    company: '温州市五金配件集团',
    companyId: 'WZ-WJ-011',
    role: 'supplier',
    permissions: ['manage_products', 'view_purchase_orders', 'update_inventory', 'update_shipments', 'upload_documents'],
    registeredDate: '2024-11-01',
    hasOrders: false,
    orderCount: 0,
    lastOrderDate: null,
    activeShipments: []
  },
  // SUP-012: 宁波市电气设备公司
  {
    id: 'SUP-012',
    username: 'supplier_g',
    password: 'supplier123',
    email: 'supplier_g@test.com',
    company: '宁波市电气设备公司',
    companyId: 'NB-DQ-012',
    role: 'supplier',
    permissions: ['manage_products', 'view_purchase_orders', 'update_inventory', 'update_shipments', 'upload_documents'],
    registeredDate: '2024-11-10',
    hasOrders: false,
    orderCount: 0,
    lastOrderDate: null,
    activeShipments: []
  },
  // SUP-013: 杭州市智能家居有限公司
  {
    id: 'SUP-013',
    username: 'supplier_h',
    password: 'supplier123',
    email: 'supplier_h@test.com',
    company: '杭州市智能家居有限公司',
    companyId: 'HZ-ZN-013',
    role: 'supplier',
    permissions: ['manage_products', 'view_purchase_orders', 'update_inventory', 'update_shipments', 'upload_documents'],
    registeredDate: '2024-11-20',
    hasOrders: false,
    orderCount: 0,
    lastOrderDate: null,
    activeShipments: []
  },
  
  // ========== AGENT USERS ==========
  {
    id: 'user004',
    username: 'agent01',
    password: 'agent123',
    email: 'agent@freightpartner.com',
    company: 'Freight Partner LLC',
    companyId: 'freightpartner001',
    role: 'agent',
    permissions: ['track_container', 'freight_quote', 'view_all_shipments'],
    registeredDate: '2024-02-28',
    hasOrders: true,
    orderCount: 0, // Agents don't need orders
    activeShipments: ['CSNU1234567', 'MSCU9876543', 'HLCU5555555', 'OOLU2222222']
  }
];

// Authentication functions
export const authenticateUser = (username: string, password: string): AuthorizedUser | null => {
  const user = authorizedUsers.find(
    u => u.username.toLowerCase() === username.toLowerCase() && u.password === password
  );
  return user || null;
};

export const hasPermission = (user: AuthorizedUser | null, permission: string): boolean => {
  if (!user) return false;
  return user.permissions.includes(permission);
};

// Session management
const SESSION_KEY = 'cosun_user_session';
const SESSION_EXPIRY_KEY = 'cosun_session_expiry';
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export interface UserSession {
  user: AuthorizedUser;
  loginTime: string;
  expiryTime: string;
}

export const saveSession = (user: AuthorizedUser): void => {
  const now = new Date();
  const expiry = new Date(now.getTime() + SESSION_DURATION);
  
  const session: UserSession = {
    user: user,
    loginTime: now.toISOString(),
    expiryTime: expiry.toISOString()
  };
  
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  localStorage.setItem(SESSION_EXPIRY_KEY, expiry.toISOString());
  
  // 🔔 触发用户切换事件
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('userChanged'));
    console.log('🔔 [saveSession] 触发userChanged事件，用户:', user.email);
  }
};

export const getSession = (): UserSession | null => {
  try {
    const sessionData = localStorage.getItem(SESSION_KEY);
    const expiryData = localStorage.getItem(SESSION_EXPIRY_KEY);
    
    if (!sessionData || !expiryData) return null;
    
    const expiry = new Date(expiryData);
    const now = new Date();
    
    // Check if session has expired
    if (now > expiry) {
      clearSession();
      return null;
    }
    
    return JSON.parse(sessionData);
  } catch (error) {
    console.error('Error reading session:', error);
    return null;
  }
};

export const clearSession = (): void => {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(SESSION_EXPIRY_KEY);
};

export const getCurrentUser = (): AuthorizedUser | null => {
  const session = getSession();
  return session ? session.user : null;
};