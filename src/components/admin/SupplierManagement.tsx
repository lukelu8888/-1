import React, { useState, useMemo } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Building2, Star, Package, DollarSign, TrendingUp, CheckCircle2,
  Clock, AlertCircle, Search, Filter, Plus, Eye, Phone, Mail,
  MapPin, FileText, Calendar, Award, Target, Activity, Download,
  Send, Edit, BarChart3, Truck, Factory, Users, ShoppingCart,
  CreditCard, FileSignature, ClipboardCheck, AlertTriangle, Zap, RefreshCw, Loader2, Printer
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Progress } from '../ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '../ui/dialog';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { toast } from 'sonner';
import { PurchaseOrderDocument } from '../documents/templates/PurchaseOrderDocument'; // 🔥 文档中心采购订单模板（单页版）
import { PurchaseOrderData } from '../documents/templates/PurchaseOrderDocument'; // 🔥 采购订单数据类型
import type { DocumentLayoutConfig } from '../documents/A4PageContainer';
import { exportToPDF, exportToPDFPrint, generatePDFFilename } from '../../utils/pdfExport'; // 🔥 PDF导出工具

// 🔥 供应商接口 - 导出供其他模块使用
export interface Supplier {
  id: string;
  name: string;
  code: string;
  nameEn: string;
  level: 'A' | 'B' | 'C';
  category: string;
  region: string; // 🔥 新增：供应商所在区域
  businessTypes: string[]; // 🔥 新增：业务类型数组
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
}

// 采购订单接口
interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierName: string;
  orderNumber: string;
  customerName: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  currency: 'USD' | 'EUR' | 'CNY';
  businessType: 'trading' | 'inspection' | 'agency' | 'project'; // 🔥 新增：每个订单对应一种业务类型
  orderDate: string;
  expectedDate: string;
  actualDate?: string;
  status: 'pending' | 'confirmed' | 'producing' | 'completed' | 'delayed';
  paymentStatus: 'unpaid' | 'partial' | 'paid';
}

// 供应商付款接口
interface SupplierPayment {
  id: string;
  paymentNumber: string;
  supplierName: string;
  poNumber: string;
  type: 'deposit' | 'balance' | 'full';
  amount: number;
  currency: 'USD' | 'EUR' | 'CNY';
  dueDate: string;
  paidDate?: string;
  status: 'pending' | 'paid' | 'overdue';
  paymentMethod: 'T/T' | 'Cash' | 'Check';
}

// 供应商绩效接口
interface SupplierPerformance {
  supplierName: string;
  totalOrders: number;
  completedOrders: number;
  onTimeOrders: number;
  qualifiedOrders: number;
  onTimeRate: number;
  qualityRate: number;
  avgDeliveryDays: number;
  totalAmount: number;
  rating: number;
}

// 报价对比接口
interface QuoteComparison {
  id: string;
  productName: string;
  quantity: number;
  suppliers: {
    supplierName: string;
    unitPrice: number;
    moq: number;
    leadTime: string;
    paymentTerms: string;
    rating: number;
  }[];
}

export default function SupplierManagement() {
  const [activeTab, setActiveTab] = useState<'suppliers' | 'purchase' | 'payments' | 'performance' | 'quotes' | 'analytics'>('suppliers');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false);
  const [isAddPOOpen, setIsAddPOOpen] = useState(false);
  const [viewSupplier, setViewSupplier] = useState<Supplier | null>(null);
  
  // 🔥 采购订单查看与导出状态
  const [viewPurchaseOrder, setViewPurchaseOrder] = useState<PurchaseOrder | null>(null);
  const [showPODialog, setShowPODialog] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);
  const poPDFRef = React.useRef<HTMLDivElement>(null);
  
  // 新增供应商表单状态
  const [newSupplier, setNewSupplier] = useState({
    name: '',
    nameEn: '',
    code: '',
    category: '',
    contact: '',
    phone: '',
    email: '',
    address: '',
    businessLicense: '',
    certifications: '',
    capacity: ''
  });
  
  // 产品类别列表（可扩展）
  const [productCategories, setProductCategories] = useState([
    '电气设备',
    '卫浴产品',
    '门窗配件',
    '劳保用品',
    '五金工具',
    '建筑材料',
    '照明灯具',
    '家居用品'
  ]);
  const [isAddingNewCategory, setIsAddingNewCategory] = useState(false);
  const [newCategory, setNewCategory] = useState('');

  // 🔥🔥🔥 新增：筛选状态
  const [timeRange, setTimeRange] = useState('ytd'); // q1, q2, q3, q4, ytd, year
  const [selectedRegion, setSelectedRegion] = useState('all'); // all, 广东, 浙江, 福建, 江苏, 上海
  const [selectedBusinessType, setSelectedBusinessType] = useState('all'); // all, trading, inspection, agency, project
  const [selectedCategory, setSelectedCategory] = useState('all'); // all, 电气设备, 卫浴产品, 门窗配件, 劳保用品

  // 🔥🔥🔥 时间范围系数
  const timeMultiplier = {
    'q1': 0.25,
    'q2': 0.50,
    'q3': 0.75,
    'q4': 0.90,
    'ytd': 0.917, // 11个月
    'year': 1.0
  }[timeRange] || 1.0;

  // 模拟供应商数据
  const [suppliers, setSuppliers] = useState<Supplier[]>([
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
    }
  ]);

  // 🔥🔥🔥 模拟采购订单数据（每个订单关联一种业务类型）
  const purchaseOrders: PurchaseOrder[] = [
    {
      id: 'PO-001',
      poNumber: 'PO-2025-1156-01',
      supplierName: '东莞市华盛电器有限公司',
      orderNumber: 'ORD-2025-1156',
      customerName: 'ABC Trading Ltd.',
      productName: '智能插座 EU标准',
      quantity: 5000,
      unitPrice: 12.5,
      totalAmount: 62500,
      currency: 'USD',
      businessType: 'trading', // 直接采购
      orderDate: '2025-11-01',
      expectedDate: '2025-11-25',
      actualDate: '2025-11-23',
      status: 'completed',
      paymentStatus: 'paid'
    },
    {
      id: 'PO-002',
      poNumber: 'PO-2025-1189-01',
      supplierName: '佛山市鑫达卫浴制造厂',
      orderNumber: 'ORD-2025-1189',
      customerName: 'HomeStyle Warehouse',
      productName: '淋浴花洒套装',
      quantity: 3000,
      unitPrice: 18.5,
      totalAmount: 55500,
      currency: 'USD',
      businessType: 'agency', // 代理服务
      orderDate: '2025-11-05',
      expectedDate: '2025-11-30',
      status: 'producing',
      paymentStatus: 'partial'
    },
    {
      id: 'PO-003',
      poNumber: 'PO-2025-1201-01',
      supplierName: '温州精工五金配件厂',
      orderNumber: 'ORD-2025-1201',
      customerName: 'Industrial Supply Hub',
      productName: '门窗铰链 重型',
      quantity: 8000,
      unitPrice: 8.2,
      totalAmount: 65600,
      currency: 'USD',
      businessType: 'trading', // 直接采购
      orderDate: '2025-11-10',
      expectedDate: '2025-12-05',
      status: 'producing',
      paymentStatus: 'partial'
    },
    {
      id: 'PO-004',
      poNumber: 'PO-2025-1212-01',
      supplierName: '济南安全劳保用品公司',
      orderNumber: 'ORD-2025-1212',
      customerName: 'Safety First Inc.',
      productName: '安全防护手套',
      quantity: 10000,
      unitPrice: 4.5,
      totalAmount: 45000,
      currency: 'USD',
      businessType: 'inspection', // 验货服务
      orderDate: '2025-11-12',
      expectedDate: '2025-12-10',
      status: 'confirmed',
      paymentStatus: 'unpaid'
    },
    {
      id: 'PO-005',
      poNumber: 'PO-2025-1125-01',
      supplierName: '东莞市华盛电器有限公司',
      orderNumber: 'ORD-2025-1125',
      customerName: 'EuroHome GmbH',
      productName: '墙壁开关 86型',
      quantity: 6000,
      unitPrice: 6.8,
      totalAmount: 40800,
      currency: 'USD',
      businessType: 'project', // 一站式项目
      orderDate: '2025-10-28',
      expectedDate: '2025-11-20',
      actualDate: '2025-11-22',
      status: 'delayed',
      paymentStatus: 'paid'
    },
    // 🔥 新增更多订单，使总额逻辑正确
    {
      id: 'PO-006',
      poNumber: 'PO-2025-1178-01',
      supplierName: '佛山市鑫达卫浴制造厂',
      orderNumber: 'ORD-2025-1178',
      customerName: 'Global Home Ltd.',
      productName: '水龙头套装',
      quantity: 4000,
      unitPrice: 15.0,
      totalAmount: 60000,
      currency: 'USD',
      businessType: 'trading', // 直接采购
      orderDate: '2025-10-15',
      expectedDate: '2025-11-15',
      status: 'completed',
      paymentStatus: 'paid'
    },
    {
      id: 'PO-007',
      poNumber: 'PO-2025-1192-01',
      supplierName: '温州精工五金配件厂',
      orderNumber: 'ORD-2025-1192',
      customerName: 'BuildPro Inc.',
      productName: '门锁五金',
      quantity: 5000,
      unitPrice: 12.0,
      totalAmount: 60000,
      currency: 'USD',
      businessType: 'agency', // 代理服务
      orderDate: '2025-10-20',
      expectedDate: '2025-11-18',
      status: 'completed',
      paymentStatus: 'paid'
    },
    {
      id: 'PO-008',
      poNumber: 'PO-2025-1205-01',
      supplierName: '东莞市华盛电器有限公司',
      orderNumber: 'ORD-2025-1205',
      customerName: 'TechWorld Ltd.',
      productName: 'LED面板灯',
      quantity: 8000,
      unitPrice: 22.0,
      totalAmount: 176000,
      currency: 'USD',
      businessType: 'project', // 一站式项目
      orderDate: '2025-10-25',
      expectedDate: '2025-12-01',
      status: 'producing',
      paymentStatus: 'partial'
    },
    {
      id: 'PO-009',
      poNumber: 'PO-2025-1220-01',
      supplierName: '济南安全劳保用品公司',
      orderNumber: 'ORD-2025-1220',
      customerName: 'SafetyPro Inc.',
      productName: '质检服务费',
      quantity: 1,
      unitPrice: 12000,
      totalAmount: 12000,
      currency: 'USD',
      businessType: 'inspection', // 验货服务
      orderDate: '2025-11-08',
      expectedDate: '2025-11-15',
      status: 'completed',
      paymentStatus: 'paid'
    },
    {
      id: 'PO-010',
      poNumber: 'PO-2025-1232-01',
      supplierName: '东莞市华盛电器有限公司',
      orderNumber: 'ORD-2025-1232',
      customerName: 'ElectroMart',
      productName: '配电箱',
      quantity: 2000,
      unitPrice: 45.0,
      totalAmount: 90000,
      currency: 'USD',
      businessType: 'trading', // 直接采购
      orderDate: '2025-11-15',
      expectedDate: '2025-12-15',
      status: 'confirmed',
      paymentStatus: 'unpaid'
    }
  ];

  // 模拟供应商付款数据
  const supplierPayments: SupplierPayment[] = [
    {
      id: 'SP-001',
      paymentNumber: 'SP-2025-1156-01',
      supplierName: '东莞市华盛电器有限公司',
      poNumber: 'PO-2025-1156-01',
      type: 'deposit',
      amount: 18750,
      currency: 'USD',
      dueDate: '2025-11-03',
      paidDate: '2025-11-02',
      status: 'paid',
      paymentMethod: 'T/T'
    },
    {
      id: 'SP-002',
      paymentNumber: 'SP-2025-1156-02',
      supplierName: '东莞市华盛电器有限公司',
      poNumber: 'PO-2025-1156-01',
      type: 'balance',
      amount: 43750,
      currency: 'USD',
      dueDate: '2025-11-20',
      paidDate: '2025-11-19',
      status: 'paid',
      paymentMethod: 'T/T'
    },
    {
      id: 'SP-003',
      paymentNumber: 'SP-2025-1189-01',
      supplierName: '佛山市鑫达卫浴制造厂',
      poNumber: 'PO-2025-1189-01',
      type: 'deposit',
      amount: 16650,
      currency: 'USD',
      dueDate: '2025-11-07',
      paidDate: '2025-11-07',
      status: 'paid',
      paymentMethod: 'T/T'
    },
    {
      id: 'SP-004',
      paymentNumber: 'SP-2025-1189-02',
      supplierName: '佛山市鑫达卫浴制造厂',
      poNumber: 'PO-2025-1189-01',
      type: 'balance',
      amount: 38850,
      currency: 'USD',
      dueDate: '2025-11-28',
      status: 'pending',
      paymentMethod: 'T/T'
    },
    {
      id: 'SP-005',
      paymentNumber: 'SP-2025-1201-01',
      supplierName: '温州精工五金配件厂',
      poNumber: 'PO-2025-1201-01',
      type: 'deposit',
      amount: 19680,
      currency: 'USD',
      dueDate: '2025-11-12',
      paidDate: '2025-11-12',
      status: 'paid',
      paymentMethod: 'T/T'
    },
    {
      id: 'SP-006',
      paymentNumber: 'SP-2025-1201-02',
      supplierName: '温州精工五金配件厂',
      poNumber: 'PO-2025-1201-01',
      type: 'balance',
      amount: 45920,
      currency: 'USD',
      dueDate: '2025-12-03',
      status: 'pending',
      paymentMethod: 'T/T'
    }
  ];

  // 模拟供应商绩效数据
  const supplierPerformance: SupplierPerformance[] = [
    {
      supplierName: '东莞市华盛电器有限公司',
      totalOrders: 128,
      completedOrders: 126,
      onTimeOrders: 122,
      qualifiedOrders: 124,
      onTimeRate: 96.5,
      qualityRate: 98.2,
      avgDeliveryDays: 23,
      totalAmount: 2850000,
      rating: 4.8
    },
    {
      supplierName: '佛山市鑫达卫浴制造厂',
      totalOrders: 96,
      completedOrders: 94,
      onTimeOrders: 89,
      qualifiedOrders: 92,
      onTimeRate: 94.8,
      qualityRate: 97.5,
      avgDeliveryDays: 25,
      totalAmount: 1920000,
      rating: 4.6
    },
    {
      supplierName: '温州精工五金配件厂',
      totalOrders: 64,
      completedOrders: 62,
      onTimeOrders: 57,
      qualifiedOrders: 60,
      onTimeRate: 91.2,
      qualityRate: 95.8,
      avgDeliveryDays: 28,
      totalAmount: 980000,
      rating: 4.2
    },
    {
      supplierName: '济南安全劳保用品公司',
      totalOrders: 45,
      completedOrders: 43,
      onTimeOrders: 38,
      qualifiedOrders: 41,
      onTimeRate: 88.5,
      qualityRate: 94.2,
      avgDeliveryDays: 30,
      totalAmount: 650000,
      rating: 4.0
    },
    {
      supplierName: '宁波创新电器制造厂',
      totalOrders: 18,
      completedOrders: 17,
      onTimeOrders: 14,
      qualifiedOrders: 16,
      onTimeRate: 83.3,
      qualityRate: 91.5,
      avgDeliveryDays: 32,
      totalAmount: 280000,
      rating: 3.7
    }
  ];

  // 🔥🔥🔥 二维交叉数据表：区域 × 业务类型（基于采购订单，避免重复计数）
  const crossTable = useMemo(() => {
    const regions = ['广东', '浙江', '福建', '江苏', '上海'];
    const businessTypes = ['trading', 'inspection', 'agency', 'project'];
    
    const table: Record<string, Record<string, {
      supplierCount: Set<string>; // 使用Set避免重复计数
      orderCount: number;
      totalAmount: number;
      onTimeRates: number[];
      qualityRates: number[];
    }>> = {};

    // 初始化交叉表
    regions.forEach(region => {
      table[region] = {};
      businessTypes.forEach(type => {
        table[region][type] = {
          supplierCount: new Set<string>(),
          orderCount: 0,
          totalAmount: 0,
          onTimeRates: [],
          qualityRates: []
        };
      });
    });

    // 🔥 基于采购订单填充数据（每个订单只计算一次）
    purchaseOrders.forEach(order => {
      // 找到订单对应的供应商
      const supplier = suppliers.find(s => s.name === order.supplierName);
      if (!supplier) return;
      
      const region = supplier.region;
      const businessType = order.businessType;
      
      if (table[region] && table[region][businessType]) {
        // 添加供应商（Set自动去重）
        table[region][businessType].supplierCount.add(supplier.id);
        
        // 累加订单数和金额（应用时间系数）
        table[region][businessType].orderCount += timeMultiplier;
        table[region][businessType].totalAmount += order.totalAmount * timeMultiplier;
        
        // 收集绩效数据
        table[region][businessType].onTimeRates.push(supplier.onTimeRate);
        table[region][businessType].qualityRates.push(supplier.qualityRate);
      }
    });

    // 转换为最终格式并计算平均值
    const finalTable: Record<string, Record<string, {
      supplierCount: number;
      orderCount: number;
      totalAmount: number;
      avgOnTimeRate: number;
      avgQualityRate: number;
    }>> = {};

    regions.forEach(region => {
      finalTable[region] = {};
      businessTypes.forEach(type => {
        const cell = table[region][type];
        const supplierCount = cell.supplierCount.size;
        const avgOnTimeRate = cell.onTimeRates.length > 0 
          ? cell.onTimeRates.reduce((sum, val) => sum + val, 0) / cell.onTimeRates.length 
          : 0;
        const avgQualityRate = cell.qualityRates.length > 0 
          ? cell.qualityRates.reduce((sum, val) => sum + val, 0) / cell.qualityRates.length 
          : 0;

        finalTable[region][type] = {
          supplierCount,
          orderCount: Math.round(cell.orderCount),
          totalAmount: cell.totalAmount,
          avgOnTimeRate,
          avgQualityRate
        };
      });
    });

    return finalTable;
  }, [suppliers, purchaseOrders, timeMultiplier]);

  // 🔥🔥🔥 根据筛选条件过滤供应商
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(supplier => {
      // 区域筛选
      if (selectedRegion !== 'all' && supplier.region !== selectedRegion) {
        return false;
      }
      
      // 业务类型筛选
      if (selectedBusinessType !== 'all' && !supplier.businessTypes.includes(selectedBusinessType)) {
        return false;
      }
      
      // 产品类别筛选
      if (selectedCategory !== 'all' && supplier.category !== selectedCategory) {
        return false;
      }
      
      // 状态筛选
      if (filterStatus !== 'all' && supplier.status !== filterStatus) {
        return false;
      }
      
      // 搜索词筛选
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return supplier.name.toLowerCase().includes(term) ||
               supplier.code.toLowerCase().includes(term) ||
               supplier.nameEn.toLowerCase().includes(term) ||
               supplier.contact.toLowerCase().includes(term);
      }
      
      return true;
    });
  }, [suppliers, selectedRegion, selectedBusinessType, selectedCategory, filterStatus, searchTerm]);

  // 🔥🔥🔥 根据筛选条件过滤采购订单（基于订单的businessType）
  const filteredPurchaseOrders = useMemo(() => {
    return purchaseOrders.filter(po => {
      // 找到对应的供应商
      const supplier = suppliers.find(s => s.name === po.supplierName);
      if (!supplier) return false;
      
      // 区域筛选（基于供应商）
      if (selectedRegion !== 'all' && supplier.region !== selectedRegion) {
        return false;
      }
      
      // 🔥 业务类型筛选（基于订单的businessType）
      if (selectedBusinessType !== 'all' && po.businessType !== selectedBusinessType) {
        return false;
      }
      
      // 产品类别筛选（基于供应商）
      if (selectedCategory !== 'all' && supplier.category !== selectedCategory) {
        return false;
      }
      
      return true;
    });
  }, [purchaseOrders, suppliers, selectedRegion, selectedBusinessType, selectedCategory]);

  // 🔥🔥🔥 统计数据（基于筛选后的采购订单，避免重复计数）
  const stats = useMemo(() => {
    // 基于采购订单计算总采购金额
    const totalPurchaseAmount = filteredPurchaseOrders.reduce((sum, po) => sum + po.totalAmount, 0) * timeMultiplier;
    
    return {
      totalSuppliers: filteredSuppliers.length,
      activeSuppliers: filteredSuppliers.filter(s => s.status === 'active').length,
      aLevelSuppliers: filteredSuppliers.filter(s => s.level === 'A').length,
      totalPurchaseOrders: Math.round(filteredPurchaseOrders.length * timeMultiplier),
      producingOrders: Math.round(filteredPurchaseOrders.filter(po => po.status === 'producing').length * timeMultiplier),
      totalPurchaseAmount, // 基于订单计算
      pendingPayments: Math.round(supplierPayments.filter(sp => sp.status === 'pending').length * timeMultiplier),
      avgOnTimeRate: filteredSuppliers.length > 0 
        ? filteredSuppliers.reduce((sum, s) => sum + s.onTimeRate, 0) / filteredSuppliers.length 
        : 0,
      avgQualityRate: filteredSuppliers.length > 0 
        ? filteredSuppliers.reduce((sum, s) => sum + s.qualityRate, 0) / filteredSuppliers.length 
        : 0
    };
  }, [filteredSuppliers, filteredPurchaseOrders, supplierPayments, timeMultiplier]);

  // 原始统计数据（保留引用）
  const originalStats = {
    totalSuppliers: suppliers.length,
    activeSuppliers: suppliers.filter(s => s.status === 'active').length,
    aLevelSuppliers: suppliers.filter(s => s.level === 'A').length,
    totalPurchaseOrders: purchaseOrders.length,
    producingOrders: purchaseOrders.filter(po => po.status === 'producing').length,
    totalPurchaseAmount: purchaseOrders.reduce((sum, po) => sum + po.totalAmount, 0),
    pendingPayments: supplierPayments.filter(sp => sp.status === 'pending').length,
    avgOnTimeRate: suppliers.reduce((sum, s) => sum + s.onTimeRate, 0) / suppliers.length,
    avgQualityRate: suppliers.reduce((sum, s) => sum + s.qualityRate, 0) / suppliers.length
  };

  // 获取供应商等级配置
  const getSupplierLevelConfig = (level: string) => {
    const configs = {
      A: { label: 'A级', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: Award },
      B: { label: 'B级', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: Target },
      C: { label: 'C级', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: Activity }
    };
    return configs[level as keyof typeof configs];
  };

  // 获取订单状态配置
  const getPOStatusConfig = (status: string) => {
    const configs = {
      pending: { label: '待确认', color: 'bg-slate-50 text-slate-700 border-slate-200' },
      confirmed: { label: '已确认', color: 'bg-blue-50 text-blue-700 border-blue-200' },
      producing: { label: '生产中', color: 'bg-purple-50 text-purple-700 border-purple-200' },
      completed: { label: '已完成', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
      delayed: { label: '已延期', color: 'bg-rose-50 text-rose-700 border-rose-200' }
    };
    return configs[status as keyof typeof configs];
  };

  // 获取付款状态配置
  const getPaymentStatusConfig = (status: string) => {
    const configs = {
      unpaid: { label: '未付', color: 'bg-amber-50 text-amber-700 border-amber-200' },
      partial: { label: '部分', color: 'bg-blue-50 text-blue-700 border-blue-200' },
      paid: { label: '已付', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
    };
    return configs[status as keyof typeof configs];
  };

  // 获取货币符号
  const getCurrencySymbol = (currency: string) => {
    const symbols = { USD: '$', EUR: '€', CNY: '¥' };
    return symbols[currency as keyof typeof symbols] || currency;
  };

  // 获取星级
  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-3 h-3 ${
              star <= Math.round(rating)
                ? 'fill-amber-400 text-amber-400'
                : 'fill-gray-200 text-gray-200'
            }`}
          />
        ))}
      </div>
    );
  };

  // 🔥 查看采购订单详情
  const handleViewPurchaseOrder = (po: PurchaseOrder) => {
    setViewPurchaseOrder(po);
    setShowPODialog(true);
  };

  // 🔥 导出采购订单PDF
  const handleExportPOPDF = async () => {
    console.log('🔍 开始导出PDF...');
    console.log('poPDFRef.current:', poPDFRef.current);
    console.log('viewPurchaseOrder:', viewPurchaseOrder);
    
    if (!poPDFRef.current) {
      toast.error('PDF元素未准备好，请稍后再试');
      console.error('❌ poPDFRef.current is null');
      return;
    }
    
    if (!viewPurchaseOrder) {
      toast.error('请先打开采购订单详情');
      console.error('❌ viewPurchaseOrder is null');
      return;
    }
    
    setExportingPDF(true);
    try {
      // 等待DOM渲染完成 - 增加等待时间确保内容完全渲染
      console.log('⏳ 等待DOM渲染...');
      await new Promise(resolve => setTimeout(resolve, 800));
      
      console.log('📄 生成PDF文件名...');
      const filename = generatePDFFilename('Purchase_Order', viewPurchaseOrder.poNumber);
      console.log('📄 文件名:', filename);
      
      console.log('🚀 开始导出PDF...');
      await exportToPDF(poPDFRef.current, filename);
      console.log('✅ PDF导出成功！');
      toast.success('采购订单PDF导出成功！');
    } catch (error) {
      toast.error('PDF导出失败，请重试');
      console.error('❌ PDF export error:', error);
    } finally {
      setExportingPDF(false);
      console.log('🏁 导出流程结束');
    }
  };

  // 🔥 使用浏览器打印功能导出PDF（更可靠的分页）
  const handlePrintPOPDF = async () => {
    console.log('🖨️ 使用浏览器打印导出PDF...');
    
    if (!poPDFRef.current) {
      toast.error('PDF元素未准备好，请稍后再试');
      return;
    }
    
    if (!viewPurchaseOrder) {
      toast.error('请先打开采购订单详情');
      return;
    }
    
    const filename = generatePDFFilename('Purchase_Order', viewPurchaseOrder.poNumber);
    await exportToPDFPrint(poPDFRef.current, filename);
  };

  // 处理保存供应商
  const handleSaveSupplier = () => {
    // 简单验证
    if (!newSupplier.name || !newSupplier.nameEn || !newSupplier.code || 
        !newSupplier.category || !newSupplier.contact || !newSupplier.phone || !newSupplier.address) {
      toast.error('请填写所有必填字段（标*的字段）');
      return;
    }

    // 生成新供应商ID
    const newId = `SUP-${String(suppliers.length + 1).padStart(3, '0')}`;

    // 创建新供应商对象
    const supplierToAdd: Supplier = {
      id: newId,
      name: newSupplier.name,
      code: newSupplier.code,
      nameEn: newSupplier.nameEn,
      level: 'C', // 新供应商默认C级
      category: newSupplier.category,
      contact: newSupplier.contact,
      phone: newSupplier.phone,
      email: newSupplier.email || '',
      address: newSupplier.address,
      businessLicense: newSupplier.businessLicense || '',
      certifications: newSupplier.certifications ? newSupplier.certifications.split(',').map(c => c.trim()) : [],
      cooperationYears: 0, // 新供应商合作0年
      totalOrders: 0,
      totalAmount: 0,
      onTimeRate: 0,
      qualityRate: 0,
      status: 'active',
      capacity: newSupplier.capacity || ''
    };

    // 添加到供应商列表（添加到最前面）
    setSuppliers([supplierToAdd, ...suppliers]);
    
    // 显示成功提示
    toast.success('供应商已成功保存！', {
      description: `供应商 ${newSupplier.name} 已添加到系统`
    });

    // 清空表单
    setNewSupplier({
      name: '',
      nameEn: '',
      code: '',
      category: '',
      contact: '',
      phone: '',
      email: '',
      address: '',
      businessLicense: '',
      certifications: '',
      capacity: ''
    });

    // 关闭对话框
    setIsAddSupplierOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* 🔥 标题栏 - 参考业务员模块设计 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-purple-600" />
            采购与供应商管理
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            全流程供应链管理与采购数据分析
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* 🔥 时间范围筛选器 */}
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="h-8 w-[100px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="q1" className="text-xs">Q1季度</SelectItem>
              <SelectItem value="q2" className="text-xs">Q2季度</SelectItem>
              <SelectItem value="q3" className="text-xs">Q3季度</SelectItem>
              <SelectItem value="q4" className="text-xs">Q4季度</SelectItem>
              <SelectItem value="ytd" className="text-xs">本年至今</SelectItem>
              <SelectItem value="year" className="text-xs">全年</SelectItem>
            </SelectContent>
          </Select>

          {/* 🔥 区域筛选器 */}
          <Select value={selectedRegion} onValueChange={setSelectedRegion}>
            <SelectTrigger className="h-8 w-[100px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">全部区域</SelectItem>
              <SelectItem value="广东" className="text-xs">广东</SelectItem>
              <SelectItem value="浙江" className="text-xs">浙江</SelectItem>
              <SelectItem value="福建" className="text-xs">福建</SelectItem>
              <SelectItem value="江苏" className="text-xs">江苏</SelectItem>
              <SelectItem value="上海" className="text-xs">上海</SelectItem>
            </SelectContent>
          </Select>

          {/* 🔥 业务类型筛选器 */}
          <Select value={selectedBusinessType} onValueChange={setSelectedBusinessType}>
            <SelectTrigger className="h-8 w-[120px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">全部业务</SelectItem>
              <SelectItem value="trading" className="text-xs">🛒 直接采购</SelectItem>
              <SelectItem value="inspection" className="text-xs">🔍 验货服务</SelectItem>
              <SelectItem value="agency" className="text-xs">🤝 代理服务</SelectItem>
              <SelectItem value="project" className="text-xs">🌟 一站式项目</SelectItem>
            </SelectContent>
          </Select>

          {/* 🔥 产品类别筛选器 */}
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="h-8 w-[100px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">全部类别</SelectItem>
              <SelectItem value="电气设备" className="text-xs">电气设备</SelectItem>
              <SelectItem value="卫浴产品" className="text-xs">卫浴产品</SelectItem>
              <SelectItem value="门窗配件" className="text-xs">门窗配件</SelectItem>
              <SelectItem value="劳保用品" className="text-xs">劳保用品</SelectItem>
              <SelectItem value="五金工具" className="text-xs">五金工具</SelectItem>
              <SelectItem value="建筑材料" className="text-xs">建筑材料</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" className="h-8 text-xs">
            <Download className="w-3.5 h-3.5 mr-1.5" />
            导出报表
          </Button>
          <Button variant="outline" size="sm" className="h-8 text-xs">
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            刷新数据
          </Button>
        </div>
      </div>

      {/* 顶部统计卡片 */}
      <div className="grid grid-cols-7 gap-2">
        <div className="bg-white border border-gray-200 rounded p-2.5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-gray-500">供应商总数</span>
            <Building2 className="w-3 h-3 text-blue-600" />
          </div>
          <p className="text-lg font-bold text-gray-900">{stats.totalSuppliers}</p>
          <p className="text-[10px] text-gray-500 mt-0.5">活跃 {stats.activeSuppliers} 家</p>
        </div>

        <div className="bg-white border border-gray-200 rounded p-2.5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-gray-500">A级供应商</span>
            <Award className="w-3 h-3 text-emerald-600" />
          </div>
          <p className="text-lg font-bold text-gray-900">{stats.aLevelSuppliers}</p>
          <p className="text-[10px] text-gray-500 mt-0.5">优质工厂</p>
        </div>

        <div className="bg-white border border-gray-200 rounded p-2.5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-gray-500">采购订单</span>
            <ShoppingCart className="w-3 h-3 text-purple-600" />
          </div>
          <p className="text-lg font-bold text-gray-900">{stats.totalPurchaseOrders}</p>
          <p className="text-[10px] text-gray-500 mt-0.5">生产中 {stats.producingOrders}</p>
        </div>

        <div className="bg-white border border-gray-200 rounded p-2.5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-gray-500">采购金额</span>
            <DollarSign className="w-3 h-3 text-orange-600" />
          </div>
          <p className="text-lg font-bold text-gray-900">${(stats.totalPurchaseAmount / 1000).toFixed(0)}K</p>
          <p className="text-[10px] text-gray-500 mt-0.5">本月采购</p>
        </div>

        <div className="bg-white border border-gray-200 rounded p-2.5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-gray-500">待付款</span>
            <CreditCard className="w-3 h-3 text-rose-600" />
          </div>
          <p className="text-lg font-bold text-gray-900">{stats.pendingPayments}</p>
          <p className="text-[10px] text-gray-500 mt-0.5">需处理</p>
        </div>

        <div className="bg-white border border-gray-200 rounded p-2.5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-gray-500">准时交付率</span>
            <Clock className="w-3 h-3 text-blue-600" />
          </div>
          <p className="text-lg font-bold text-gray-900">{stats.avgOnTimeRate.toFixed(1)}%</p>
          <p className="text-[10px] text-gray-500 mt-0.5">平均水平</p>
        </div>

        <div className="bg-white border border-gray-200 rounded p-2.5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-gray-500">质量合格率</span>
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          </div>
          <p className="text-lg font-bold text-gray-900">{stats.avgQualityRate.toFixed(1)}%</p>
          <p className="text-[10px] text-gray-500 mt-0.5">平均水平</p>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="bg-white border border-gray-200 rounded">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
          <div className="border-b border-gray-200 px-3">
            <TabsList className="bg-transparent h-auto p-0 gap-4">
              <TabsTrigger 
                value="suppliers" 
                className="bg-transparent border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:text-blue-700 rounded-none px-0 pb-2 pt-2 text-[11px] font-medium"
              >
                <Building2 className="w-3 h-3 mr-1" />
                供应商档案
              </TabsTrigger>

              <TabsTrigger 
                value="payments" 
                className="bg-transparent border-b-2 border-transparent data-[state=active]:border-orange-600 data-[state=active]:bg-transparent data-[state=active]:text-orange-700 rounded-none px-0 pb-2 pt-2 text-[11px] font-medium"
              >
                <CreditCard className="w-3 h-3 mr-1" />
                供应商付款
              </TabsTrigger>
              <TabsTrigger 
                value="performance" 
                className="bg-transparent border-b-2 border-transparent data-[state=active]:border-emerald-600 data-[state=active]:bg-transparent data-[state=active]:text-emerald-700 rounded-none px-0 pb-2 pt-2 text-[11px] font-medium"
              >
                <BarChart3 className="w-3 h-3 mr-1" />
                供应商绩效
              </TabsTrigger>
              <TabsTrigger 
                value="analytics" 
                className="bg-transparent border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:bg-transparent data-[state=active]:text-indigo-700 rounded-none px-0 pb-2 pt-2 text-[11px] font-medium"
              >
                <Target className="w-3 h-3 mr-1" />
                数据分析
              </TabsTrigger>
            </TabsList>
          </div>

          {/* 供应商档案标签页 */}
          <TabsContent value="suppliers" className="m-0">
            <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                  <Input
                    placeholder="搜索供应商名称、编号..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-7 h-7 text-[11px] border-gray-300"
                  />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[100px] h-7 text-[11px] border-gray-300">
                    <SelectValue placeholder="等级" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" style={{ fontSize: '11px' }}>全部</SelectItem>
                    <SelectItem value="A" style={{ fontSize: '11px' }}>A级</SelectItem>
                    <SelectItem value="B" style={{ fontSize: '11px' }}>B级</SelectItem>
                    <SelectItem value="C" style={{ fontSize: '11px' }}>C级</SelectItem>
                  </SelectContent>
                </Select>
                <Dialog open={isAddSupplierOpen} onOpenChange={setIsAddSupplierOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="h-7 text-[11px] bg-blue-600 hover:bg-blue-700 px-2.5">
                      <Plus className="w-3 h-3 mr-1" />
                      新增供应商
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle style={{ fontSize: '15px' }}>新增供应商</DialogTitle>
                      <DialogDescription style={{ fontSize: '12px' }}>
                        填写供应商基本信息和资质认证
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-3 py-3">
                      <div className="space-y-1.5">
                        <Label style={{ fontSize: '11px' }}>供应商名称（中文）*</Label>
                        <Input 
                          placeholder="例：东莞市华盛电器有限公司" 
                          className="h-8 text-[11px]"
                          value={newSupplier.name}
                          onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label style={{ fontSize: '11px' }}>供应商名称（英文）*</Label>
                        <Input 
                          placeholder="例：Dongguan Huasheng Electrical Co., Ltd." 
                          className="h-8 text-[11px]"
                          value={newSupplier.nameEn}
                          onChange={(e) => setNewSupplier({ ...newSupplier, nameEn: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label style={{ fontSize: '11px' }}>供应商编号*</Label>
                        <Input 
                          placeholder="例：DG-HS-001" 
                          className="h-8 text-[11px]"
                          value={newSupplier.code}
                          onChange={(e) => setNewSupplier({ ...newSupplier, code: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label style={{ fontSize: '11px' }}>产品类别*</Label>
                        <Select value={newSupplier.category} onValueChange={(value) => {
                          if (value === '__add_new__') {
                            setIsAddingNewCategory(true);
                          } else {
                            setNewSupplier({ ...newSupplier, category: value });
                          }
                        }}>
                          <SelectTrigger className="h-8 text-[11px]">
                            <SelectValue placeholder="选择类别" />
                          </SelectTrigger>
                          <SelectContent>
                            {productCategories.map((category) => (
                              <SelectItem key={category} value={category} style={{ fontSize: '11px' }}>
                                {category}
                              </SelectItem>
                            ))}
                            <SelectItem value="__add_new__" style={{ fontSize: '11px', color: '#2563eb', fontWeight: 500 }}>
                              + 新增类别
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        {isAddingNewCategory && (
                          <div className="flex gap-1.5 mt-1.5">
                            <Input
                              placeholder="输入新类别名称"
                              value={newCategory}
                              onChange={(e) => setNewCategory(e.target.value)}
                              className="h-7 text-[11px] flex-1"
                              autoFocus
                            />
                            <Button
                              size="sm"
                              className="h-7 px-2 text-[10px]"
                              onClick={() => {
                                if (newCategory.trim()) {
                                  setProductCategories([...productCategories, newCategory.trim()]);
                                  setNewSupplier({ ...newSupplier, category: newCategory.trim() });
                                  setNewCategory('');
                                  setIsAddingNewCategory(false);
                                }
                              }}
                            >
                              确定
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2 text-[10px]"
                              onClick={() => {
                                setNewCategory('');
                                setIsAddingNewCategory(false);
                              }}
                            >
                              取消
                            </Button>
                          </div>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <Label style={{ fontSize: '11px' }}>联系人*</Label>
                        <Input 
                          placeholder="例：张伟" 
                          className="h-8 text-[11px]"
                          value={newSupplier.contact}
                          onChange={(e) => setNewSupplier({ ...newSupplier, contact: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label style={{ fontSize: '11px' }}>联系电话*</Label>
                        <Input 
                          placeholder="例：+86 769 8888 1234" 
                          className="h-8 text-[11px]"
                          value={newSupplier.phone}
                          onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label style={{ fontSize: '11px' }}>邮箱</Label>
                        <Input 
                          placeholder="例：zhang@huasheng.com" 
                          className="h-8 text-[11px]"
                          value={newSupplier.email}
                          onChange={(e) => setNewSupplier({ ...newSupplier, email: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label style={{ fontSize: '11px' }}>营业执照号</Label>
                        <Input 
                          placeholder="例：91441900MA4W1234XY" 
                          className="h-8 text-[11px]"
                          value={newSupplier.businessLicense}
                          onChange={(e) => setNewSupplier({ ...newSupplier, businessLicense: e.target.value })}
                        />
                      </div>
                      <div className="col-span-2 space-y-1.5">
                        <Label style={{ fontSize: '11px' }}>地址*</Label>
                        <Input 
                          placeholder="例：广东省东莞市长安镇工业园区" 
                          className="h-8 text-[11px]"
                          value={newSupplier.address}
                          onChange={(e) => setNewSupplier({ ...newSupplier, address: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label style={{ fontSize: '11px' }}>月产能</Label>
                        <Input 
                          placeholder="例：50万件/月" 
                          className="h-8 text-[11px]"
                          value={newSupplier.capacity}
                          onChange={(e) => setNewSupplier({ ...newSupplier, capacity: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label style={{ fontSize: '11px' }}>认证资质</Label>
                        <Input 
                          placeholder="例：ISO9001, CE, RoHS" 
                          className="h-8 text-[11px]"
                          value={newSupplier.certifications}
                          onChange={(e) => setNewSupplier({ ...newSupplier, certifications: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" className="h-8 text-[11px]" onClick={() => setIsAddSupplierOpen(false)}>
                        取消
                      </Button>
                      <Button size="sm" className="h-8 text-[11px] bg-blue-600 hover:bg-blue-700" onClick={handleSaveSupplier}>
                        保存
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 hover:bg-gray-50">
                    <TableHead className="h-7 py-1.5 text-[11px] text-gray-600 font-medium">供应商编号</TableHead>
                    <TableHead className="h-7 py-1.5 text-[11px] text-gray-600 font-medium">供应商名称</TableHead>
                    <TableHead className="h-7 py-1.5 text-[11px] text-gray-600 font-medium">等级</TableHead>
                    <TableHead className="h-7 py-1.5 text-[11px] text-gray-600 font-medium">产品类别</TableHead>
                    <TableHead className="h-7 py-1.5 text-[11px] text-gray-600 font-medium">联系方式</TableHead>
                    <TableHead className="h-7 py-1.5 text-[11px] text-gray-600 font-medium">合作时长</TableHead>
                    <TableHead className="h-7 py-1.5 text-[11px] text-gray-600 font-medium">订单数</TableHead>
                    <TableHead className="h-7 py-1.5 text-[11px] text-gray-600 font-medium">准时率</TableHead>
                    <TableHead className="h-7 py-1.5 text-[11px] text-gray-600 font-medium">质量率</TableHead>
                    <TableHead className="h-7 py-1.5 text-[11px] text-gray-600 font-medium text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSuppliers.map((supplier) => (
                    <TableRow key={supplier.id} className="hover:bg-gray-50">
                      <TableCell className="py-1.5">
                        <button
                          onClick={() => setViewSupplier(supplier)}
                          className="text-[11px] font-medium text-blue-600 hover:text-blue-800 hover:underline transition-all cursor-pointer"
                        >
                          {supplier.code}
                        </button>
                      </TableCell>
                      <TableCell className="py-1.5">
                        <button
                          onClick={() => setViewSupplier(supplier)}
                          className="text-left"
                        >
                          <p className="text-[11px] font-medium text-gray-900 hover:text-purple-600 transition-all cursor-pointer">
                            {supplier.name}
                          </p>
                          <p className="text-[10px] text-gray-500">{supplier.nameEn}</p>
                        </button>
                      </TableCell>
                      <TableCell className="py-1.5">
                        <Badge className={`h-4 px-1.5 text-[10px] border ${getSupplierLevelConfig(supplier.level).color}`}>
                          {getSupplierLevelConfig(supplier.level).label}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-1.5">
                        <p className="text-[11px] text-gray-700">{supplier.category}</p>
                        <p className="text-[10px] text-gray-500">{supplier.capacity}</p>
                      </TableCell>
                      <TableCell className="py-1.5">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1">
                            <Users className="w-2.5 h-2.5 text-gray-400" />
                            <p className="text-[10px] text-gray-700">{supplier.contact}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <Phone className="w-2.5 h-2.5 text-gray-400" />
                            <p className="text-[10px] text-gray-500">{supplier.phone}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-1.5">
                        <p className="text-[11px] text-gray-700">{supplier.cooperationYears}年</p>
                      </TableCell>
                      <TableCell className="py-1.5">
                        <p className="text-[11px] font-medium text-gray-900">{supplier.totalOrders}</p>
                      </TableCell>
                      <TableCell className="py-1.5">
                        <Badge className={`h-4 px-1.5 text-[10px] border ${
                          supplier.onTimeRate >= 95 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          supplier.onTimeRate >= 90 ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {supplier.onTimeRate}%
                        </Badge>
                      </TableCell>
                      <TableCell className="py-1.5">
                        <Badge className={`h-4 px-1.5 text-[10px] border ${
                          supplier.qualityRate >= 98 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          supplier.qualityRate >= 95 ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {supplier.qualityRate}%
                        </Badge>
                      </TableCell>
                      <TableCell className="py-1.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 w-6 p-0 hover:bg-blue-50 hover:text-blue-600 transition-all" 
                            onClick={() => setViewSupplier(supplier)}
                            title="查看供应商详情"
                          >
                            <Eye className="w-3 h-3" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 w-6 p-0 hover:bg-purple-50 hover:text-purple-600 transition-all"
                            title="编辑供应商信息"
                            onClick={() => {
                              toast.info('编辑功能开发中...');
                            }}
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* 供应商付款标签页 */}
          <TabsContent value="payments" className="m-0">
            <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                  <Input
                    placeholder="搜索付款编号、供应商..."
                    className="pl-7 h-7 text-[11px] border-gray-300"
                  />
                </div>
                <Select>
                  <SelectTrigger className="w-[100px] h-7 text-[11px] border-gray-300">
                    <SelectValue placeholder="状态" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" style={{ fontSize: '11px' }}>全部</SelectItem>
                    <SelectItem value="pending" style={{ fontSize: '11px' }}>待付</SelectItem>
                    <SelectItem value="paid" style={{ fontSize: '11px' }}>已付</SelectItem>
                  </SelectContent>
                </Select>
                <Button size="sm" className="h-7 text-[11px] bg-orange-600 hover:bg-orange-700 px-2.5">
                  <Plus className="w-3 h-3 mr-1" />
                  登记付款
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 hover:bg-gray-50">
                    <TableHead className="h-7 py-1.5 text-[11px] text-gray-600 font-medium">付款编号</TableHead>
                    <TableHead className="h-7 py-1.5 text-[11px] text-gray-600 font-medium">供应商</TableHead>
                    <TableHead className="h-7 py-1.5 text-[11px] text-gray-600 font-medium">采购单号</TableHead>
                    <TableHead className="h-7 py-1.5 text-[11px] text-gray-600 font-medium">付款类型</TableHead>
                    <TableHead className="h-7 py-1.5 text-[11px] text-gray-600 font-medium">付款金额</TableHead>
                    <TableHead className="h-7 py-1.5 text-[11px] text-gray-600 font-medium">支付方式</TableHead>
                    <TableHead className="h-7 py-1.5 text-[11px] text-gray-600 font-medium">到期日期</TableHead>
                    <TableHead className="h-7 py-1.5 text-[11px] text-gray-600 font-medium">状态</TableHead>
                    <TableHead className="h-7 py-1.5 text-[11px] text-gray-600 font-medium text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {supplierPayments.map((payment) => (
                    <TableRow key={payment.id} className="hover:bg-gray-50">
                      <TableCell className="py-1.5">
                        <p className="text-[11px] font-medium text-orange-600">{payment.paymentNumber}</p>
                      </TableCell>
                      <TableCell className="py-1.5">
                        <p className="text-[11px] text-gray-900">{payment.supplierName}</p>
                      </TableCell>
                      <TableCell className="py-1.5">
                        <p className="text-[11px] text-purple-600">{payment.poNumber}</p>
                      </TableCell>
                      <TableCell className="py-1.5">
                        <Badge className={`h-4 px-1.5 text-[10px] border ${
                          payment.type === 'deposit' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          payment.type === 'balance' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                          'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          {payment.type === 'deposit' ? '定金' : payment.type === 'balance' ? '尾款' : '全款'}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-1.5">
                        <p className="text-[12px] font-bold text-gray-900">
                          {getCurrencySymbol(payment.currency)}{payment.amount.toLocaleString()}
                        </p>
                      </TableCell>
                      <TableCell className="py-1.5">
                        <p className="text-[11px] text-gray-700">{payment.paymentMethod}</p>
                      </TableCell>
                      <TableCell className="py-1.5">
                        <p className="text-[11px] text-gray-700">{payment.dueDate}</p>
                        {payment.paidDate && (
                          <p className="text-[10px] text-emerald-600">付: {payment.paidDate}</p>
                        )}
                      </TableCell>
                      <TableCell className="py-1.5">
                        <Badge className={`h-4 px-1.5 text-[10px] border ${
                          payment.status === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          payment.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          {payment.status === 'paid' ? '已付' : payment.status === 'pending' ? '待付' : '逾期'}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-1.5 text-right">
                        <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px]">
                          详情
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* 供应商绩效标签页 */}
          <TabsContent value="performance" className="m-0">
            <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                  <Input
                    placeholder="搜索供应商..."
                    className="pl-7 h-7 text-[11px] border-gray-300"
                  />
                </div>
                <Select>
                  <SelectTrigger className="w-[120px] h-7 text-[11px] border-gray-300">
                    <SelectValue placeholder="排序" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rating" style={{ fontSize: '11px' }}>评分排序</SelectItem>
                    <SelectItem value="ontime" style={{ fontSize: '11px' }}>准时率排序</SelectItem>
                    <SelectItem value="quality" style={{ fontSize: '11px' }}>质量率排序</SelectItem>
                  </SelectContent>
                </Select>
                <Button size="sm" className="h-7 text-[11px] bg-emerald-600 hover:bg-emerald-700 px-2.5">
                  <Download className="w-3 h-3 mr-1" />
                  导出报告
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 hover:bg-gray-50">
                    <TableHead className="h-7 py-1.5 text-[11px] text-gray-600 font-medium">供应商名称</TableHead>
                    <TableHead className="h-7 py-1.5 text-[11px] text-gray-600 font-medium">总订单数</TableHead>
                    <TableHead className="h-7 py-1.5 text-[11px] text-gray-600 font-medium">完成订单</TableHead>
                    <TableHead className="h-7 py-1.5 text-[11px] text-gray-600 font-medium">准时订单</TableHead>
                    <TableHead className="h-7 py-1.5 text-[11px] text-gray-600 font-medium">合格订单</TableHead>
                    <TableHead className="h-7 py-1.5 text-[11px] text-gray-600 font-medium">准时率</TableHead>
                    <TableHead className="h-7 py-1.5 text-[11px] text-gray-600 font-medium">质量率</TableHead>
                    <TableHead className="h-7 py-1.5 text-[11px] text-gray-600 font-medium">平均交期</TableHead>
                    <TableHead className="h-7 py-1.5 text-[11px] text-gray-600 font-medium">综合评分</TableHead>
                    <TableHead className="h-7 py-1.5 text-[11px] text-gray-600 font-medium text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {supplierPerformance.map((perf) => (
                    <TableRow key={perf.supplierName} className="hover:bg-gray-50">
                      <TableCell className="py-1.5">
                        <p className="text-[11px] font-medium text-gray-900">{perf.supplierName}</p>
                      </TableCell>
                      <TableCell className="py-1.5">
                        <p className="text-[11px] text-gray-900">{perf.totalOrders}</p>
                      </TableCell>
                      <TableCell className="py-1.5">
                        <p className="text-[11px] text-emerald-600 font-medium">{perf.completedOrders}</p>
                      </TableCell>
                      <TableCell className="py-1.5">
                        <p className="text-[11px] text-blue-600 font-medium">{perf.onTimeOrders}</p>
                      </TableCell>
                      <TableCell className="py-1.5">
                        <p className="text-[11px] text-purple-600 font-medium">{perf.qualifiedOrders}</p>
                      </TableCell>
                      <TableCell className="py-1.5">
                        <div className="space-y-0.5">
                          <Progress value={perf.onTimeRate} className="h-1 w-16" />
                          <p className="text-[10px] text-gray-600">{perf.onTimeRate}%</p>
                        </div>
                      </TableCell>
                      <TableCell className="py-1.5">
                        <div className="space-y-0.5">
                          <Progress value={perf.qualityRate} className="h-1 w-16" />
                          <p className="text-[10px] text-gray-600">{perf.qualityRate}%</p>
                        </div>
                      </TableCell>
                      <TableCell className="py-1.5">
                        <p className="text-[11px] text-gray-700">{perf.avgDeliveryDays}天</p>
                      </TableCell>
                      <TableCell className="py-1.5">
                        <div className="flex items-center gap-1">
                          {renderStars(perf.rating)}
                          <span className="text-[10px] text-gray-600 ml-1">{perf.rating.toFixed(1)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-1.5 text-right">
                        <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px]">
                          详细
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* 🔥🔥🔥 数据分析标签页 - 二维交叉数据表 */}
          <TabsContent value="analytics" className="m-0 p-4">
            <div className="space-y-4">
              {/* 说明卡片 */}
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <Target className="w-4 h-4 text-indigo-600 mt-0.5" />
                  <div>
                    <h3 className="text-xs font-semibold text-indigo-900 mb-1">区域 × 业务类型 交叉数据分析</h3>
                    <p className="text-[10px] text-indigo-700">
                      展示不同区域在不同业务类型下的供应商数量、订单数、采购金额、准时率和质量率等关键指标
                    </p>
                  </div>
                </div>
              </div>

              {/* 二维交叉数据表 */}
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-[10px]">
                    <thead>
                      <tr className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                        <th className="px-3 py-2 text-left font-semibold border-r border-indigo-400" rowSpan={2}>区域</th>
                        <th className="px-3 py-2 text-center font-semibold border-r border-indigo-400" colSpan={5}>🛒 直接采购</th>
                        <th className="px-3 py-2 text-center font-semibold border-r border-indigo-400" colSpan={5}>🔍 验货服务</th>
                        <th className="px-3 py-2 text-center font-semibold border-r border-indigo-400" colSpan={5}>🤝 代理服务</th>
                        <th className="px-3 py-2 text-center font-semibold" colSpan={5}>🌟 一站式项目</th>
                      </tr>
                      <tr className="bg-indigo-500 text-white">
                        {/* 直接采购 */}
                        <th className="px-2 py-1.5 text-center font-medium border-r border-indigo-300">供应商</th>
                        <th className="px-2 py-1.5 text-center font-medium border-r border-indigo-300">订单数</th>
                        <th className="px-2 py-1.5 text-center font-medium border-r border-indigo-300">金额(¥)</th>
                        <th className="px-2 py-1.5 text-center font-medium border-r border-indigo-300">准时率</th>
                        <th className="px-2 py-1.5 text-center font-medium border-r border-indigo-400">质量率</th>
                        {/* 验货服务 */}
                        <th className="px-2 py-1.5 text-center font-medium border-r border-indigo-300">供应商</th>
                        <th className="px-2 py-1.5 text-center font-medium border-r border-indigo-300">订单数</th>
                        <th className="px-2 py-1.5 text-center font-medium border-r border-indigo-300">金额(¥)</th>
                        <th className="px-2 py-1.5 text-center font-medium border-r border-indigo-300">准时率</th>
                        <th className="px-2 py-1.5 text-center font-medium border-r border-indigo-400">质量率</th>
                        {/* 代理服务 */}
                        <th className="px-2 py-1.5 text-center font-medium border-r border-indigo-300">供应商</th>
                        <th className="px-2 py-1.5 text-center font-medium border-r border-indigo-300">订单数</th>
                        <th className="px-2 py-1.5 text-center font-medium border-r border-indigo-300">金额(¥)</th>
                        <th className="px-2 py-1.5 text-center font-medium border-r border-indigo-300">准时率</th>
                        <th className="px-2 py-1.5 text-center font-medium border-r border-indigo-400">质量率</th>
                        {/* 一站式项目 */}
                        <th className="px-2 py-1.5 text-center font-medium border-r border-indigo-300">供应商</th>
                        <th className="px-2 py-1.5 text-center font-medium border-r border-indigo-300">订单数</th>
                        <th className="px-2 py-1.5 text-center font-medium border-r border-indigo-300">金额(¥)</th>
                        <th className="px-2 py-1.5 text-center font-medium border-r border-indigo-300">准时率</th>
                        <th className="px-2 py-1.5 text-center font-medium">质量率</th>
                      </tr>
                    </thead>
                    <tbody>
                      {['广东', '浙江', '福建', '江苏', '上海'].map((region, idx) => (
                        <tr key={region} className={idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                          <td className="px-3 py-2 font-semibold text-gray-900 border-r border-gray-300">{region}</td>
                          
                          {/* 直接采购 */}
                          <td className="px-2 py-2 text-center border-r border-gray-200">
                            {crossTable[region]?.trading?.supplierCount || 0}
                          </td>
                          <td className="px-2 py-2 text-center border-r border-gray-200">
                            {crossTable[region]?.trading?.orderCount || 0}
                          </td>
                          <td className="px-2 py-2 text-center border-r border-gray-200 font-medium text-emerald-700">
                            {crossTable[region]?.trading?.totalAmount 
                              ? `¥${(crossTable[region].trading.totalAmount / 10000).toFixed(1)}万`
                              : '-'}
                          </td>
                          <td className="px-2 py-2 text-center border-r border-gray-200">
                            {crossTable[region]?.trading?.avgOnTimeRate 
                              ? `${crossTable[region].trading.avgOnTimeRate.toFixed(1)}%`
                              : '-'}
                          </td>
                          <td className="px-2 py-2 text-center border-r border-gray-300">
                            {crossTable[region]?.trading?.avgQualityRate 
                              ? `${crossTable[region].trading.avgQualityRate.toFixed(1)}%`
                              : '-'}
                          </td>

                          {/* 验货服务 */}
                          <td className="px-2 py-2 text-center border-r border-gray-200">
                            {crossTable[region]?.inspection?.supplierCount || 0}
                          </td>
                          <td className="px-2 py-2 text-center border-r border-gray-200">
                            {crossTable[region]?.inspection?.orderCount || 0}
                          </td>
                          <td className="px-2 py-2 text-center border-r border-gray-200 font-medium text-emerald-700">
                            {crossTable[region]?.inspection?.totalAmount 
                              ? `¥${(crossTable[region].inspection.totalAmount / 10000).toFixed(1)}万`
                              : '-'}
                          </td>
                          <td className="px-2 py-2 text-center border-r border-gray-200">
                            {crossTable[region]?.inspection?.avgOnTimeRate 
                              ? `${crossTable[region].inspection.avgOnTimeRate.toFixed(1)}%`
                              : '-'}
                          </td>
                          <td className="px-2 py-2 text-center border-r border-gray-300">
                            {crossTable[region]?.inspection?.avgQualityRate 
                              ? `${crossTable[region].inspection.avgQualityRate.toFixed(1)}%`
                              : '-'}
                          </td>

                          {/* 代理服务 */}
                          <td className="px-2 py-2 text-center border-r border-gray-200">
                            {crossTable[region]?.agency?.supplierCount || 0}
                          </td>
                          <td className="px-2 py-2 text-center border-r border-gray-200">
                            {crossTable[region]?.agency?.orderCount || 0}
                          </td>
                          <td className="px-2 py-2 text-center border-r border-gray-200 font-medium text-emerald-700">
                            {crossTable[region]?.agency?.totalAmount 
                              ? `¥${(crossTable[region].agency.totalAmount / 10000).toFixed(1)}万`
                              : '-'}
                          </td>
                          <td className="px-2 py-2 text-center border-r border-gray-200">
                            {crossTable[region]?.agency?.avgOnTimeRate 
                              ? `${crossTable[region].agency.avgOnTimeRate.toFixed(1)}%`
                              : '-'}
                          </td>
                          <td className="px-2 py-2 text-center border-r border-gray-300">
                            {crossTable[region]?.agency?.avgQualityRate 
                              ? `${crossTable[region].agency.avgQualityRate.toFixed(1)}%`
                              : '-'}
                          </td>

                          {/* 一站式项目 */}
                          <td className="px-2 py-2 text-center border-r border-gray-200">
                            {crossTable[region]?.project?.supplierCount || 0}
                          </td>
                          <td className="px-2 py-2 text-center border-r border-gray-200">
                            {crossTable[region]?.project?.orderCount || 0}
                          </td>
                          <td className="px-2 py-2 text-center border-r border-gray-200 font-medium text-emerald-700">
                            {crossTable[region]?.project?.totalAmount 
                              ? `¥${(crossTable[region].project.totalAmount / 10000).toFixed(1)}万`
                              : '-'}
                          </td>
                          <td className="px-2 py-2 text-center border-r border-gray-200">
                            {crossTable[region]?.project?.avgOnTimeRate 
                              ? `${crossTable[region].project.avgOnTimeRate.toFixed(1)}%`
                              : '-'}
                          </td>
                          <td className="px-2 py-2 text-center">
                            {crossTable[region]?.project?.avgQualityRate 
                              ? `${crossTable[region].project.avgQualityRate.toFixed(1)}%`
                              : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 🔥 业务类型总额验证卡片 */}
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-300 rounded-lg p-4">
                <h4 className="text-sm font-bold text-emerald-900 mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  业务类型总额验证
                </h4>
                <div className="grid grid-cols-5 gap-3">
                  <div className="bg-white rounded p-2.5 border border-emerald-200">
                    <p className="text-[10px] text-gray-600 mb-0.5">🛒 直接采购</p>
                    <p className="text-sm font-bold text-blue-700">
                      ${(filteredPurchaseOrders.filter(po => po.businessType === 'trading').reduce((sum, po) => sum + po.totalAmount, 0) * timeMultiplier / 1000).toFixed(1)}K
                    </p>
                  </div>
                  <div className="bg-white rounded p-2.5 border border-emerald-200">
                    <p className="text-[10px] text-gray-600 mb-0.5">🔍 验货服务</p>
                    <p className="text-sm font-bold text-purple-700">
                      ${(filteredPurchaseOrders.filter(po => po.businessType === 'inspection').reduce((sum, po) => sum + po.totalAmount, 0) * timeMultiplier / 1000).toFixed(1)}K
                    </p>
                  </div>
                  <div className="bg-white rounded p-2.5 border border-emerald-200">
                    <p className="text-[10px] text-gray-600 mb-0.5">🤝 代理服务</p>
                    <p className="text-sm font-bold text-orange-700">
                      ${(filteredPurchaseOrders.filter(po => po.businessType === 'agency').reduce((sum, po) => sum + po.totalAmount, 0) * timeMultiplier / 1000).toFixed(1)}K
                    </p>
                  </div>
                  <div className="bg-white rounded p-2.5 border border-emerald-200">
                    <p className="text-[10px] text-gray-600 mb-0.5">🌟 一站式项目</p>
                    <p className="text-sm font-bold text-rose-700">
                      ${(filteredPurchaseOrders.filter(po => po.businessType === 'project').reduce((sum, po) => sum + po.totalAmount, 0) * timeMultiplier / 1000).toFixed(1)}K
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-emerald-100 to-teal-100 rounded p-2.5 border-2 border-emerald-400">
                    <p className="text-[10px] text-emerald-800 font-semibold mb-0.5">✅ 总采购额</p>
                    <p className="text-sm font-bold text-emerald-900">
                      ${(stats.totalPurchaseAmount / 1000).toFixed(1)}K
                    </p>
                  </div>
                </div>
                <p className="text-[10px] text-emerald-700 mt-2 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <strong>验证通过：</strong>各业务类型金额总和 = 总采购额（无重复计数）
                </p>
              </div>

              {/* 数据说明 */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <h4 className="text-xs font-semibold text-blue-900 mb-2">📊 数据说明</h4>
                  <ul className="space-y-1 text-[10px] text-blue-800">
                    <li>• <strong>供应商：</strong>该区域该业务类型的供应商数量</li>
                    <li>• <strong>订单数：</strong>累计采购订单数量（受时间筛选影响）</li>
                    <li>• <strong>金额：</strong>累计采购金额（人民币）</li>
                    <li>• <strong>准时率：</strong>平均准时交付率</li>
                    <li>• <strong>质量率：</strong>平均质量合格率</li>
                  </ul>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <h4 className="text-xs font-semibold text-amber-900 mb-2">💡 使用建议</h4>
                  <ul className="space-y-1 text-[10px] text-amber-800">
                    <li>• 使用顶部筛选器可以按时间、区域、业务类型查看数据</li>
                    <li>• 关注准时率和质量率低于90%的单元格，需要改进</li>
                    <li>• 通过交叉对比发现优质供应商和潜在风险</li>
                    <li>• 支持导出报表用于进一步分析</li>
                  </ul>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* 供应商详情对话框 */}
      <Dialog open={!!viewSupplier} onOpenChange={() => setViewSupplier(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {viewSupplier && (
            <>
              <DialogHeader>
                <DialogTitle style={{ fontSize: '16px' }}>供应商详情</DialogTitle>
                <DialogDescription style={{ fontSize: '12px' }}>
                  {viewSupplier.name} ({viewSupplier.code})
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-3">
                {/* 基本信息 */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-3">
                    <Building2 className="w-4 h-4 text-blue-600" />
                    <h3 className="text-[13px] font-semibold text-blue-900">基本信息</h3>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <p className="text-[10px] text-gray-500 mb-0.5">供应商名称（中文）</p>
                      <p className="text-[12px] font-medium text-gray-900">{viewSupplier.name}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 mb-0.5">供应商名称（英文）</p>
                      <p className="text-[12px] font-medium text-gray-900">{viewSupplier.nameEn}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 mb-0.5">供应商编号</p>
                      <p className="text-[12px] font-medium text-blue-600">{viewSupplier.code}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 mb-0.5">供应商等级</p>
                      <Badge className={`h-5 px-2 text-[11px] border ${getSupplierLevelConfig(viewSupplier.level).color}`}>
                        {getSupplierLevelConfig(viewSupplier.level).label}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 mb-0.5">产品类别</p>
                      <p className="text-[12px] font-medium text-gray-900">{viewSupplier.category}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 mb-0.5">合作时长</p>
                      <p className="text-[12px] font-medium text-gray-900">{viewSupplier.cooperationYears}年</p>
                    </div>
                  </div>
                </div>

                {/* 联系信息 */}
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-3">
                    <Phone className="w-4 h-4 text-purple-600" />
                    <h3 className="text-[13px] font-semibold text-purple-900">联系信息</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[10px] text-gray-500 mb-0.5">联系人</p>
                      <p className="text-[12px] font-medium text-gray-900">{viewSupplier.contact}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 mb-0.5">联系电话</p>
                      <p className="text-[12px] font-medium text-gray-900">{viewSupplier.phone}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 mb-0.5">电子邮箱</p>
                      <p className="text-[12px] font-medium text-gray-900">{viewSupplier.email || '-'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 mb-0.5">公司地址</p>
                      <p className="text-[12px] font-medium text-gray-900">{viewSupplier.address}</p>
                    </div>
                  </div>
                </div>

                {/* 资质认证 */}
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-3">
                    <Award className="w-4 h-4 text-emerald-600" />
                    <h3 className="text-[13px] font-semibold text-emerald-900">资质认证</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[10px] text-gray-500 mb-0.5">营业执照号</p>
                      <p className="text-[12px] font-medium text-gray-900">{viewSupplier.businessLicense || '-'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 mb-0.5">月产能</p>
                      <p className="text-[12px] font-medium text-gray-900">{viewSupplier.capacity || '-'}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-[10px] text-gray-500 mb-1">认证资质</p>
                      <div className="flex flex-wrap gap-1.5">
                        {viewSupplier.certifications.length > 0 ? (
                          viewSupplier.certifications.map((cert, idx) => (
                            <Badge key={idx} className="h-5 px-2 text-[10px] bg-emerald-100 text-emerald-700 border-emerald-300">
                              <CheckCircle2 className="w-2.5 h-2.5 mr-1" />
                              {cert}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-[12px] text-gray-500">-</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 合作数据 */}
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-3">
                    <BarChart3 className="w-4 h-4 text-orange-600" />
                    <h3 className="text-[13px] font-semibold text-orange-900">合作数据</h3>
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    <div className="bg-white rounded-lg p-2 border border-orange-100">
                      <p className="text-[10px] text-gray-500 mb-1">总订单数</p>
                      <p className="text-[16px] font-bold text-gray-900">{viewSupplier.totalOrders}</p>
                    </div>
                    <div className="bg-white rounded-lg p-2 border border-orange-100">
                      <p className="text-[10px] text-gray-500 mb-1">采购金额</p>
                      <p className="text-[16px] font-bold text-gray-900">${(viewSupplier.totalAmount / 1000).toFixed(0)}K</p>
                    </div>
                    <div className="bg-white rounded-lg p-2 border border-orange-100">
                      <p className="text-[10px] text-gray-500 mb-1">准时交付率</p>
                      <div className="flex items-baseline gap-1">
                        <p className="text-[16px] font-bold text-emerald-600">{viewSupplier.onTimeRate}%</p>
                        <Clock className="w-3 h-3 text-emerald-600" />
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-2 border border-orange-100">
                      <p className="text-[10px] text-gray-500 mb-1">质量合格率</p>
                      <div className="flex items-baseline gap-1">
                        <p className="text-[16px] font-bold text-blue-600">{viewSupplier.qualityRate}%</p>
                        <CheckCircle2 className="w-3 h-3 text-blue-600" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 状态信息 */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-3">
                    <Activity className="w-4 h-4 text-gray-600" />
                    <h3 className="text-[13px] font-semibold text-gray-900">状态信息</h3>
                  </div>
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-[10px] text-gray-500 mb-0.5">供应商状态</p>
                      <Badge className={`h-5 px-2 text-[11px] border ${
                        viewSupplier.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        viewSupplier.status === 'inactive' ? 'bg-gray-50 text-gray-700 border-gray-200' :
                        'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                        {viewSupplier.status === 'active' ? '活跃' : viewSupplier.status === 'inactive' ? '未活跃' : '已暂停'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <Button variant="outline" size="sm" className="h-8 text-[11px]" onClick={() => setViewSupplier(null)}>
                  关闭
                </Button>
                <Button size="sm" className="h-8 text-[11px] bg-blue-600 hover:bg-blue-700">
                  <Edit className="w-3 h-3 mr-1" />
                  编辑供应商
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* 🔥 采购订单查看对话框 - 集成文档中心模板（单页版） */}
      <Dialog open={showPODialog} onOpenChange={setShowPODialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto print:hidden">
          <DialogHeader className="print-hide">
            <DialogTitle>采购订单详情 - {viewPurchaseOrder?.poNumber}</DialogTitle>
            <DialogDescription>
              查看和导出采购订单 | Purchase Order
            </DialogDescription>
          </DialogHeader>
          
          {/* 🔥 重要提示 - 推荐使用浏览器打印 */}
          <div className="print-hide bg-amber-50 border-l-4 border-amber-500 p-3 mb-4">
            <div className="flex items-start gap-2">
              <div className="flex-shrink-0 mt-0.5">
                <svg className="w-5 h-5 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-amber-800 mb-1">⚡ 导出建议</h4>
                <p className="text-xs text-amber-700 leading-relaxed">
                  <strong>强烈推荐使用"浏览器打印（推荐）"功能</strong>，可确保PDF分页完美、无内容重叠。<br/>
                  "直接导出PDF"功能使用截图方式，可能在分页处出现轻微内容重叠（技术限制）。
                </p>
              </div>
            </div>
          </div>
          
          <div className="print-contract-content">
            {viewPurchaseOrder && (
              (() => {
                const templateSnapshot = (viewPurchaseOrder as any).templateSnapshot || (viewPurchaseOrder as any).template_snapshot || null;
                const templateVersion = templateSnapshot?.version || null;
                const purchaseOrderData = ((viewPurchaseOrder as any).documentDataSnapshot || (viewPurchaseOrder as any).document_data_snapshot) as PurchaseOrderData | null;
                const layoutConfig = (templateVersion?.layout_json || null) as DocumentLayoutConfig | null;
                if (!templateVersion || !purchaseOrderData) {
                  return (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-700">
                      该 CG 未绑定模板中心版本快照，无法预览。
                    </div>
                  );
                }
                return (
              <PurchaseOrderDocument
                ref={poPDFRef}
                data={purchaseOrderData}
                layoutConfig={layoutConfig || undefined}
              />
                );
              })()
            )}
          </div>

          <DialogFooter className="print-hide">
            <Button variant="outline" onClick={() => setShowPODialog(false)}>
              关闭
            </Button>
            <Button 
              onClick={handlePrintPOPDF} 
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Printer className="w-4 h-4 mr-2" />
              浏览器打印（推荐）
            </Button>
            <Button 
              variant="outline"
              onClick={handleExportPOPDF} 
              disabled={exportingPDF}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              {exportingPDF ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  导出中...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  直接导出PDF
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 🔥 打印样式 - 确保打印时只显示采购订单内容 */}
      <style>{`
        @media print {
          body > div:not(.print-contract-content),
          .print-hide,
          [role="dialog"]:not(.print-contract-dialog) {
            display: none !important;
          }
          
          .print-contract-content {
            display: block !important;
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: 100% !important;
            z-index: 99999 !important;
            background: white !important;
          }
        }
      `}</style>
    </div>
  );
}
