// 🔥 供应商主数据 - 全局共享
// 供应商接口
export interface Supplier {
  id: string;
  name: string;
  code: string;
  nameEn: string;
  level: 'A' | 'B' | 'C';
  category: string;
  region: string;
  businessTypes: string[];
  contact: string;
  phone: string;
  email: string;
  address: string;
  businessLicense: string;
  certifications: string[];
  cooperationYears: number;
  totalOrders: number;
  totalAmount: number;
  onTimeRate: number;
  qualityRate: number;
  status: 'active' | 'inactive' | 'suspended';
  capacity: string;
  /** URL or data-URI of supplier logo. Undefined = show placeholder. */
  logoUrl?: string;
}

/**
 * Normalised supplier profile used by document rendering.
 * All fields guaranteed (with empty-string fallbacks) so renderers
 * never have to null-check.
 */
export interface SupplierProfile {
  id: string;
  name: string;
  nameEn: string;
  code: string;
  email: string;
  phone: string;
  address: string;
  contactPerson: string;
  logoUrl: string | null;   // null → show placeholder
}

/** Convert a raw Supplier record to the normalised SupplierProfile shape */
export function toSupplierProfile(s: Supplier): SupplierProfile {
  return {
    id:            s.id,
    name:          s.name,
    nameEn:        s.nameEn,
    code:          s.code,
    email:         s.email,
    phone:         s.phone,
    address:       s.address,
    contactPerson: s.contact,
    logoUrl:       s.logoUrl ?? null,
  };
}

/**
 * Look up a supplier by email, code, id or name (in that priority order).
 * Returns null when no match found.
 */
export function findSupplier(query: {
  email?: string | null;
  code?:  string | null;
  id?:    string | null;
  name?:  string | null;
}): Supplier | null {
  const db = suppliersDatabase;

  if (query.email) {
    const hit = db.find(s => s.email.toLowerCase() === query.email!.toLowerCase());
    if (hit) return hit;
  }
  if (query.code) {
    const hit = db.find(s => s.code === query.code);
    if (hit) return hit;
  }
  if (query.id) {
    const hit = db.find(s => s.id === query.id);
    if (hit) return hit;
  }
  if (query.name) {
    const hit = db.find(s => s.name === query.name || s.nameEn === query.name);
    if (hit) return hit;
  }
  return null;
}

// 🔥 供应商数据库 - 真实数据
export const suppliersDatabase: Supplier[] = [
  {
    id: 'SUP-001',
    name: '东莞市华盛电器有限公司',
    code: 'DG-HS-001',
    nameEn: 'Dongguan Huasheng Electrical Co., Ltd.',
    level: 'A',
    category: '电气设备',
    region: '广东',
    businessTypes: ['trading', 'project'],
    contact: '张伟',
    phone: '+86 769 8888 1234',
    email: 'zhang@huasheng.com',
    address: '广东省东莞市长安镇工业园区',
    businessLicense: '91441900MA4W1234XY',
    certifications: ['ISO9001', 'CE', 'RoHS'],
    cooperationYears: 5,
    totalOrders: 128,
    totalAmount: 2850000,
    onTimeRate: 96.5,
    qualityRate: 98.2,
    status: 'active',
    capacity: '50万件/月'
  },
  {
    id: 'SUP-002',
    name: '佛山市鑫达卫浴制造厂',
    code: 'FS-XD-002',
    nameEn: 'Foshan Xinda Sanitary Ware Factory',
    level: 'A',
    category: '卫浴产品',
    region: '广东',
    businessTypes: ['trading', 'agency'],
    contact: '李娜',
    phone: '+86 757 8888 5678',
    email: 'li@xinda.com',
    address: '广东省佛山市南海区狮山镇',
    businessLicense: '91440600MA4W5678XY',
    certifications: ['ISO9001', 'CUPC', 'Watermark'],
    cooperationYears: 4,
    totalOrders: 96,
    totalAmount: 1920000,
    onTimeRate: 94.8,
    qualityRate: 97.5,
    status: 'active',
    capacity: '30万件/月'
  },
  {
    id: 'SUP-003',
    name: '温州精工五金配件厂',
    code: 'WZ-JG-003',
    nameEn: 'Wenzhou Jinggong Hardware Factory',
    level: 'B',
    category: '门窗配件',
    region: '浙江',
    businessTypes: ['trading', 'agency'],
    contact: '王强',
    phone: '+86 577 8888 9012',
    email: 'wang@jinggong.com',
    address: '浙江省温州市龙湾区经济开发区',
    businessLicense: '91330300MA4W9012XY',
    certifications: ['ISO9001'],
    cooperationYears: 3,
    totalOrders: 64,
    totalAmount: 980000,
    onTimeRate: 91.2,
    qualityRate: 95.8,
    status: 'active',
    capacity: '20万件/月'
  },
  {
    id: 'SUP-004',
    name: '济南安全劳保用品公司',
    code: 'JN-AQ-004',
    nameEn: 'Jinan Safety Products Co., Ltd.',
    level: 'B',
    category: '劳保用品',
    region: '山东',
    businessTypes: ['trading'],
    contact: '赵敏',
    phone: '+86 531 8888 3456',
    email: 'zhao@safety.com',
    address: '山东省济南市历城区工业园',
    businessLicense: '91370100MA4W3456XY',
    certifications: ['ISO9001', 'CE'],
    cooperationYears: 2,
    totalOrders: 45,
    totalAmount: 650000,
    onTimeRate: 88.5,
    qualityRate: 94.2,
    status: 'active',
    capacity: '15万件/月'
  },
  {
    id: 'SUP-005',
    name: '宁波创新电器制造厂',
    code: 'NB-CX-005',
    nameEn: 'Ningbo Chuangxin Electrical Factory',
    level: 'C',
    category: '电气设备',
    region: '浙江',
    businessTypes: ['trading'],
    contact: '刘洋',
    phone: '+86 574 8888 7890',
    email: 'liu@chuangxin.com',
    address: '浙江省宁波市北仑区',
    businessLicense: '91330200MA4W7890XY',
    certifications: ['ISO9001'],
    cooperationYears: 1,
    totalOrders: 18,
    totalAmount: 280000,
    onTimeRate: 83.3,
    qualityRate: 91.5,
    status: 'active',
    capacity: '10万件/月'
  },
  {
    id: 'SUP-006',
    name: '上海明辉建材有限公司',
    code: 'SH-MH-006',
    nameEn: 'Shanghai Minghui Building Materials Co., Ltd.',
    level: 'A',
    category: '建筑材料',
    region: '上海',
    businessTypes: ['trading', 'project'],
    contact: '陈明',
    phone: '+86 21 8888 2345',
    email: 'chen@minghui.com',
    address: '上海市浦东新区张江高科技园区',
    businessLicense: '91310000MA4W2345XY',
    certifications: ['ISO9001', 'ISO14001'],
    cooperationYears: 6,
    totalOrders: 156,
    totalAmount: 3200000,
    onTimeRate: 97.8,
    qualityRate: 98.5,
    status: 'active',
    capacity: '100万件/月'
  },
  {
    id: 'SUP-007',
    name: '福州鸿达照明科技公司',
    code: 'FZ-HD-007',
    nameEn: 'Fuzhou Hongda Lighting Technology Co., Ltd.',
    level: 'B',
    category: '照明灯具',
    region: '福建',
    businessTypes: ['trading'],
    contact: '林芳',
    phone: '+86 591 8888 6789',
    email: 'lin@hongda.com',
    address: '福建省福州市仓山区金山工业园',
    businessLicense: '91350100MA4W6789XY',
    certifications: ['ISO9001', 'CE', 'Energy Star'],
    cooperationYears: 3,
    totalOrders: 72,
    totalAmount: 1150000,
    onTimeRate: 92.5,
    qualityRate: 96.3,
    status: 'active',
    capacity: '25万件/月'
  },
  {
    id: 'SUP-008',
    name: '苏州精密五金工具厂',
    code: 'SZ-JM-008',
    nameEn: 'Suzhou Precision Hardware Tools Factory',
    level: 'B',
    category: '五金工具',
    region: '江苏',
    businessTypes: ['trading', 'agency'],
    contact: '周磊',
    phone: '+86 512 8888 4567',
    email: 'zhou@precision.com',
    address: '江苏省苏州市吴江区经济开发区',
    businessLicense: '91320500MA4W4567XY',
    certifications: ['ISO9001', 'CE'],
    cooperationYears: 4,
    totalOrders: 88,
    totalAmount: 1560000,
    onTimeRate: 93.2,
    qualityRate: 96.8,
    status: 'active',
    capacity: '35万件/月'
  },
  {
    id: 'SUP-009',
    name: '杭州雅居家居用品公司',
    code: 'HZ-YJ-009',
    nameEn: 'Hangzhou Yaju Home Products Co., Ltd.',
    level: 'C',
    category: '家居用品',
    region: '浙江',
    businessTypes: ['trading'],
    contact: '吴静',
    phone: '+86 571 8888 8901',
    email: 'wu@yaju.com',
    address: '浙江省杭州市余杭区临平新城',
    businessLicense: '91330100MA4W8901XY',
    certifications: ['ISO9001'],
    cooperationYears: 2,
    totalOrders: 52,
    totalAmount: 780000,
    onTimeRate: 89.6,
    qualityRate: 94.5,
    status: 'active',
    capacity: '18万件/月'
  },
  {
    id: 'SUP-010',
    name: '深圳市明达电器有限公司',
    code: 'SZ-MD-010',
    nameEn: 'Shenzhen Mingda Electrical Co., Ltd.',
    level: 'A',
    category: '电气设备',
    region: '广东',
    businessTypes: ['trading', 'inspection', 'project'],
    contact: '张经理',
    phone: '+86 755 8888 8888',
    email: 'zhang@mingda.com',
    address: '广东省深圳市宝安区西乡街道',
    businessLicense: '91440300MA4W8888XY',
    certifications: ['ISO9001', 'CE', 'RoHS', 'UL'],
    cooperationYears: 7,
    totalOrders: 185,
    totalAmount: 4200000,
    onTimeRate: 98.2,
    qualityRate: 99.1,
    status: 'active',
    capacity: '80万件/月'
  }
];

// 🔥 搜索供应商函数
export const searchSuppliers = (keyword: string): Supplier[] => {
  if (!keyword) return suppliersDatabase;
  
  const lowerKeyword = keyword.toLowerCase();
  return suppliersDatabase.filter(supplier => 
    supplier.name.toLowerCase().includes(lowerKeyword) ||
    supplier.code.toLowerCase().includes(lowerKeyword) ||
    supplier.nameEn.toLowerCase().includes(lowerKeyword) ||
    supplier.contact.toLowerCase().includes(lowerKeyword) ||
    supplier.category.includes(keyword) ||
    supplier.region.includes(keyword)
  );
};

// 🔥 根据ID获取供应商
export const getSupplierById = (id: string): Supplier | undefined => {
  return suppliersDatabase.find(supplier => supplier.id === id);
};

// 🔥 根据状态筛选供应商
export const filterSuppliersByStatus = (status: 'active' | 'inactive' | 'suspended' | 'all'): Supplier[] => {
  if (status === 'all') return suppliersDatabase;
  return suppliersDatabase.filter(supplier => supplier.status === status);
};
