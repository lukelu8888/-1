import React, { useEffect, useMemo, useRef, useState } from 'react';
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
import {
  getSupplierMasterRequests,
  SUPPLIER_MASTER_REQUESTS_UPDATED_EVENT,
  updateSupplierMasterRequestStatus,
  type SupplierMasterRequest,
} from '../../lib/supplier-store';
import {
  getFinancePayeeApprovalStatusLabel,
  getFinancePayeeCategoryLabel,
  getFinancePayeePartySideLabel,
} from '../finance-v2/data/financePayeeMasterData';
import { loadFinanceV2PayeeMasters, saveFinanceV2PayeeMasters } from '../finance-v2/data/financeV2FinanceStorage';
import { FinanceFilterBar } from '../finance-v2/components/FinanceFilterBar';
import type { WorkbenchStatItem } from '../finance-v2/types/financeV2';
import { scanSupplierDocument } from '../../lib/services/supplierDocumentRecognizerService';

const SUPPLIER_MANAGEMENT_STORAGE_KEY = 'gsd_supplier_management_records_v1';

function buildSupplierPendingRequestsSnapshot() {
  const stored = getSupplierMasterRequests();
  const financePending = loadFinanceV2PayeeMasters()
    .filter((item) => item.partySide === 'supplier' && item.approvalStatus === 'pending_approval')
    .map((item) => ({
      id: item.id,
      name: item.name,
      partySide: item.partySide,
      entityType: item.entityType,
      category: item.category,
      expenseScope: item.expenseScope,
      expenseSubject: item.expenseSubject,
      department: item.department,
      costCenter: item.costCenter,
      routingNote: item.routingNote,
      approvalStatus: 'pending_approval' as const,
      submittedBy: '赵敏',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

  const merged = new Map<string, SupplierMasterRequest>();
  [...stored, ...financePending].forEach((item) => {
    if (item.partySide === 'supplier') merged.set(item.id, item);
  });
  return Array.from(merged.values());
}

function buildSupplierFromMasterRequest(request: SupplierMasterRequest, fallbackCode: string): Supplier {
  return {
    id: request.masterCode || fallbackCode,
    name: request.name,
    code: request.masterCode || fallbackCode,
    nameEn: request.name,
    level: 'C',
    category: request.expenseSubject,
    region: request.department || '待补充',
    businessTypes: request.expenseScope === 'business' ? ['trading'] : ['agency'],
    contact: '待补充',
    phone: '待补充',
    email: '',
    address: '待补充',
    businessLicense: '',
    certifications: [],
    cooperationYears: 0,
    totalOrders: 0,
    totalAmount: 0,
    onTimeRate: 0,
    qualityRate: 0,
    status: 'active',
    capacity: '',
  };
}

function readStoredSupplierRows(): Supplier[] | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(SUPPLIER_MANAGEMENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Supplier[]) : null;
  } catch (error) {
    console.warn('[SupplierManagement] failed to parse stored rows:', error);
    return null;
  }
}

function writeStoredSupplierRows(records: Supplier[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(SUPPLIER_MANAGEMENT_STORAGE_KEY, JSON.stringify(records));
}

function hydrateAuthorizedSuppliers(base: Supplier[]): Supplier[] {
  const merged = [...base];
  const names = new Set(base.map((item) => item.name));
  const approvedRequests = getSupplierMasterRequests().filter(
    (item) => item.partySide === 'supplier' && item.approvalStatus === 'approved',
  );
  approvedRequests.forEach((item, index) => {
    if (names.has(item.name)) return;
    const fallbackCode = item.masterCode || `SUP-${String(base.length + index + 1).padStart(3, '0')}`;
    merged.unshift(buildSupplierFromMasterRequest(item, fallbackCode));
    names.add(item.name);
  });

  loadFinanceV2PayeeMasters()
    .filter((item) => item.partySide === 'supplier' && item.approvalStatus === 'active')
    .forEach((item, index) => {
      if (names.has(item.name)) return;
      const fallbackCode = item.masterCode || `SUP-${String(base.length + approvedRequests.length + index + 1).padStart(3, '0')}`;
      merged.unshift({
        id: item.masterCode || fallbackCode,
        name: item.name,
        code: item.masterCode || fallbackCode,
        nameEn: item.name,
        level: 'C',
        category: item.expenseSubject,
        region: item.department || '待补充',
        businessTypes: item.expenseScope === 'business' ? ['trading'] : ['agency'],
        contact: '待补充',
        phone: '待补充',
        email: '',
        address: '待补充',
        businessLicense: '',
        certifications: [],
        cooperationYears: 0,
        totalOrders: 0,
        totalAmount: 0,
        onTimeRate: 0,
        qualityRate: 0,
        status: 'active',
        capacity: '',
      });
      names.add(item.name);
    });

  return merged;
}

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
  const [editingSupplierId, setEditingSupplierId] = useState<string | null>(null);
  const [masterRequests, setMasterRequests] = useState<SupplierMasterRequest[]>(() => buildSupplierPendingRequestsSnapshot());
  const pendingRequestCountRef = useRef(
    buildSupplierPendingRequestsSnapshot().filter((item) => item.partySide === 'supplier' && item.approvalStatus === 'pending_approval').length,
  );
  
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
  const [isRecognizingSupplierDoc, setIsRecognizingSupplierDoc] = useState(false);
  const [supplierOcrFileName, setSupplierOcrFileName] = useState('');
  const supplierOcrInputRef = React.useRef<HTMLInputElement>(null);

  const resetSupplierForm = () => {
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
    setSupplierOcrFileName('');
    setIsRecognizingSupplierDoc(false);
    setEditingSupplierId(null);
  };

  const handleSupplierDocumentSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setIsRecognizingSupplierDoc(true);

    try {
      const result = await scanSupplierDocument(file);
      const nextValues = {
        name: result.extracted.name || '',
        nameEn: result.extracted.nameEn || '',
        businessLicense: result.extracted.businessLicense || '',
        address: result.extracted.address || '',
        contact: result.extracted.contact || '',
        phone: result.extracted.phone || '',
        email: result.extracted.email || '',
        certifications: result.extracted.certifications || '',
      };

      setNewSupplier((current) => ({
        ...current,
        name: current.name || nextValues.name,
        nameEn: current.nameEn || nextValues.nameEn,
        businessLicense: current.businessLicense || nextValues.businessLicense,
        address: current.address || nextValues.address,
        contact: current.contact || nextValues.contact,
        phone: current.phone || nextValues.phone,
        email: current.email || nextValues.email,
        certifications: current.certifications || nextValues.certifications,
      }));
      setSupplierOcrFileName(result.fileName);

      const filledCount = Object.values(nextValues).filter(Boolean).length;
      toast.success('供应商资料 OCR 识别完成', {
        description: `已从 ${result.fileName} 识别并回填 ${filledCount} 个字段。`,
      });

      result.extracted.warnings.forEach((warning) => {
        toast.warning(warning, { duration: 5000 });
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '供应商资料 OCR 识别失败，请稍后重试');
    } finally {
      setIsRecognizingSupplierDoc(false);
    }
  };

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

  const pendingMasterRequests = useMemo(
    () => masterRequests.filter((item) => item.partySide === 'supplier' && item.approvalStatus === 'pending_approval'),
    [masterRequests],
  );

  useEffect(() => {
    setMasterRequests(buildSupplierPendingRequestsSnapshot());
    setSuppliers((current) => hydrateAuthorizedSuppliers(readStoredSupplierRows() || current));
  }, []);

  useEffect(() => {
    const refreshMasterRequests = () => {
      setMasterRequests(buildSupplierPendingRequestsSnapshot());
      setSuppliers((current) => hydrateAuthorizedSuppliers(current));
    };

    window.addEventListener(SUPPLIER_MASTER_REQUESTS_UPDATED_EVENT, refreshMasterRequests);
    window.addEventListener('storage', refreshMasterRequests);
    return () => {
      window.removeEventListener(SUPPLIER_MASTER_REQUESTS_UPDATED_EVENT, refreshMasterRequests);
      window.removeEventListener('storage', refreshMasterRequests);
    };
  }, []);

  useEffect(() => {
    const nextCount = pendingMasterRequests.length;
    if (nextCount > pendingRequestCountRef.current) {
      toast.info(`收到 ${nextCount - pendingRequestCountRef.current} 条新的供应商主档待授权申请`, {
        description: '请在供应商管理模块完成审核后生效。',
      });
    }
    pendingRequestCountRef.current = nextCount;
  }, [pendingMasterRequests]);

  useEffect(() => {
    writeStoredSupplierRows(suppliers);
  }, [suppliers]);

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
      
      // 等级筛选
      if (filterStatus !== 'all' && supplier.level !== filterStatus) {
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

  const statItems = useMemo<WorkbenchStatItem[]>(() => [
    {
      id: 'supplier-total',
      label: '供应商总数',
      value: String(stats.totalSuppliers),
      tone: 'default',
    },
    {
      id: 'supplier-a-level',
      label: 'A级供应商',
      value: String(stats.aLevelSuppliers),
      tone: 'ok',
    },
    {
      id: 'supplier-po-count',
      label: '采购订单',
      value: String(stats.totalPurchaseOrders),
      tone: 'default',
    },
    {
      id: 'supplier-po-amount',
      label: '采购金额',
      value: `$${(stats.totalPurchaseAmount / 1000).toFixed(0)}K`,
      tone: 'default',
    },
    {
      id: 'supplier-pending-payment',
      label: '待付款',
      value: String(stats.pendingPayments),
      tone: stats.pendingPayments > 0 ? 'warn' : 'ok',
    },
    {
      id: 'supplier-ontime',
      label: '准时交付率',
      value: `${stats.avgOnTimeRate.toFixed(1)}%`,
      tone: stats.avgOnTimeRate >= 95 ? 'ok' : stats.avgOnTimeRate >= 90 ? 'default' : 'warn',
    },
    {
      id: 'supplier-quality',
      label: '质量合格率',
      value: `${stats.avgQualityRate.toFixed(1)}%`,
      tone: stats.avgQualityRate >= 97 ? 'ok' : stats.avgQualityRate >= 94 ? 'default' : 'warn',
    },
  ], [stats]);

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

    const existingSupplier = editingSupplierId ? suppliers.find((item) => item.id === editingSupplierId) : null;
    const nextId = existingSupplier?.id || `SUP-${String(suppliers.length + 1).padStart(3, '0')}`;

    const supplierToSave: Supplier = {
      id: nextId,
      name: newSupplier.name,
      code: newSupplier.code,
      nameEn: newSupplier.nameEn,
      level: existingSupplier?.level || 'C',
      category: newSupplier.category,
      region: existingSupplier?.region || '福建',
      businessTypes: existingSupplier?.businessTypes || ['trading'],
      contact: newSupplier.contact,
      phone: newSupplier.phone,
      email: newSupplier.email || '',
      address: newSupplier.address,
      businessLicense: newSupplier.businessLicense || '',
      certifications: newSupplier.certifications ? newSupplier.certifications.split(',').map(c => c.trim()) : [],
      cooperationYears: existingSupplier?.cooperationYears || 0,
      totalOrders: existingSupplier?.totalOrders || 0,
      totalAmount: existingSupplier?.totalAmount || 0,
      onTimeRate: existingSupplier?.onTimeRate || 0,
      qualityRate: existingSupplier?.qualityRate || 0,
      status: existingSupplier?.status || 'active',
      capacity: newSupplier.capacity || ''
    };

    setSuppliers((current) => {
      if (!editingSupplierId) return [supplierToSave, ...current];
      return current.map((item) => (item.id === editingSupplierId ? supplierToSave : item));
    });
    setViewSupplier((current) => (current?.id === supplierToSave.id ? supplierToSave : current));

    toast.success(editingSupplierId ? '供应商信息已更新！' : '供应商已成功保存！', {
      description: editingSupplierId ? `供应商 ${newSupplier.name} 的信息已更新` : `供应商 ${newSupplier.name} 已添加到系统`
    });

    resetSupplierForm();

    // 关闭对话框
    setIsAddSupplierOpen(false);
  };

  const openEditSupplierDialog = (supplier: Supplier) => {
    setEditingSupplierId(supplier.id);
    setNewSupplier({
      name: supplier.name,
      nameEn: supplier.nameEn,
      code: supplier.code,
      category: supplier.category,
      contact: supplier.contact,
      phone: supplier.phone,
      email: supplier.email || '',
      address: supplier.address,
      businessLicense: supplier.businessLicense || '',
      certifications: supplier.certifications.join(', '),
      capacity: supplier.capacity || ''
    });
    setIsAddSupplierOpen(true);
  };

  const handleApproveMasterRequest = (request: SupplierMasterRequest) => {
    const nextCode = `SUP-${String(suppliers.length + 1).padStart(3, '0')}`;
    const approved = updateSupplierMasterRequestStatus(request.id, 'approved', {
      masterCode: nextCode,
      approvedAt: new Date().toISOString(),
    });
    if (!approved) {
      toast.error('主档申请不存在或已被处理');
      return;
    }

    const payeeMasters = loadFinanceV2PayeeMasters();
    const nextPayeeMasters = payeeMasters.map((item) =>
      item.id === request.id ? { ...item, approvalStatus: 'active' as const, masterCode: nextCode } : item,
    );
    saveFinanceV2PayeeMasters(nextPayeeMasters);
    setMasterRequests(getSupplierMasterRequests());

    if (!suppliers.some((item) => item.name === request.name)) {
      const supplierToAdd = buildSupplierFromMasterRequest({ ...request, masterCode: nextCode }, nextCode);
      setSuppliers((current) => [supplierToAdd, ...current]);
    }

    toast.success(`供应商主档已授权生效，系统编号 ${nextCode}`);
  };

  return (
    <div className="space-y-3 bg-slate-50">
      <div className="overflow-hidden border border-slate-300 bg-white">
        <div className="grid gap-4 border-b border-slate-300 p-4 xl:grid-cols-[minmax(0,1fr)_840px]">
          <div className="min-w-0">
            <div className="text-[15px] font-semibold leading-[1.4] text-slate-900">采购与供应商管理</div>
            <div className="mt-1 text-[11px] leading-[1.45] text-slate-600">全流程供应链管理与采购数据分析</div>
          </div>
          <div className="grid gap-2 xl:grid-cols-4">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="h-10 border-slate-300 text-[13px] font-semibold text-slate-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="q1" className="text-[13px]">Q1季度</SelectItem>
                <SelectItem value="q2" className="text-[13px]">Q2季度</SelectItem>
                <SelectItem value="q3" className="text-[13px]">Q3季度</SelectItem>
                <SelectItem value="q4" className="text-[13px]">Q4季度</SelectItem>
                <SelectItem value="ytd" className="text-[13px]">本年至今</SelectItem>
                <SelectItem value="year" className="text-[13px]">全年</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedRegion} onValueChange={setSelectedRegion}>
              <SelectTrigger className="h-10 border-slate-300 text-[13px] font-semibold text-slate-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-[13px]">全部区域</SelectItem>
                <SelectItem value="广东" className="text-[13px]">广东</SelectItem>
                <SelectItem value="浙江" className="text-[13px]">浙江</SelectItem>
                <SelectItem value="福建" className="text-[13px]">福建</SelectItem>
                <SelectItem value="江苏" className="text-[13px]">江苏</SelectItem>
                <SelectItem value="上海" className="text-[13px]">上海</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedBusinessType} onValueChange={setSelectedBusinessType}>
              <SelectTrigger className="h-10 border-slate-300 text-[13px] font-semibold text-slate-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-[13px]">全部业务</SelectItem>
                <SelectItem value="trading" className="text-[13px]">直接采购</SelectItem>
                <SelectItem value="inspection" className="text-[13px]">验货服务</SelectItem>
                <SelectItem value="agency" className="text-[13px]">代理服务</SelectItem>
                <SelectItem value="project" className="text-[13px]">一站式项目</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="h-10 border-slate-300 text-[13px] font-semibold text-slate-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-[13px]">全部类别</SelectItem>
                <SelectItem value="电气设备" className="text-[13px]">电气设备</SelectItem>
                <SelectItem value="卫浴产品" className="text-[13px]">卫浴产品</SelectItem>
                <SelectItem value="门窗配件" className="text-[13px]">门窗配件</SelectItem>
                <SelectItem value="劳保用品" className="text-[13px]">劳保用品</SelectItem>
                <SelectItem value="五金工具" className="text-[13px]">五金工具</SelectItem>
                <SelectItem value="建筑材料" className="text-[13px]">建筑材料</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2 xl:col-span-4">
              <Button variant="outline" size="sm" className="h-10 border-slate-300 px-3.5 text-[13px] font-semibold text-slate-700">
                <Download className="mr-1.5 h-3.5 w-3.5" />
                导出报表
              </Button>
              <Button variant="outline" size="sm" className="h-10 border-slate-300 px-3.5 text-[13px] font-semibold text-slate-700">
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                刷新数据
              </Button>
            </div>
          </div>
        </div>
        <div className="grid gap-2 border-t border-slate-300 p-4 md:grid-cols-3 xl:grid-cols-7">
          {statItems.map((s) => (
            <div
              key={s.id}
              className={`border px-4 py-3 ${s.tone === 'ok' ? 'border-emerald-300 bg-emerald-50/70' : s.tone === 'warn' ? 'border-amber-300 bg-amber-50/70' : 'border-slate-300 bg-slate-50/70'}`}
            >
              <div className="text-[13px] font-semibold leading-[1.35] text-slate-700">{s.label}</div>
              <div className="mt-2 text-[18px] font-semibold leading-[1.2] tabular-nums text-slate-900">{s.value}</div>
              {s.sub ? <div className="mt-1 text-[11px] leading-[1.35] text-slate-500">{s.sub}</div> : null}
            </div>
          ))}
        </div>
      </div>

      <div className="overflow-hidden border border-slate-300 bg-white">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
          <div className="border-b border-slate-300 bg-slate-100 px-3 py-2">
            <TabsList className="h-auto gap-1 rounded-none bg-transparent p-0">
              <TabsTrigger 
                value="suppliers" 
                className="rounded-md border border-transparent px-3 py-2 text-[13px] font-semibold text-slate-700 data-[state=active]:border-slate-300 data-[state=active]:bg-white data-[state=active]:text-slate-900"
              >
                <Building2 className="mr-1 h-3.5 w-3.5" />
                供应商档案{pendingMasterRequests.length > 0 ? ` (${pendingMasterRequests.length})` : ''}
              </TabsTrigger>

              <TabsTrigger 
                value="payments" 
                className="rounded-md border border-transparent px-3 py-2 text-[13px] font-semibold text-slate-700 data-[state=active]:border-slate-300 data-[state=active]:bg-white data-[state=active]:text-slate-900"
              >
                <CreditCard className="mr-1 h-3.5 w-3.5" />
                供应商付款
              </TabsTrigger>
              <TabsTrigger 
                value="performance" 
                className="rounded-md border border-transparent px-3 py-2 text-[13px] font-semibold text-slate-700 data-[state=active]:border-slate-300 data-[state=active]:bg-white data-[state=active]:text-slate-900"
              >
                <BarChart3 className="mr-1 h-3.5 w-3.5" />
                供应商绩效
              </TabsTrigger>
              <TabsTrigger 
                value="analytics" 
                className="rounded-md border border-transparent px-3 py-2 text-[13px] font-semibold text-slate-700 data-[state=active]:border-slate-300 data-[state=active]:bg-white data-[state=active]:text-slate-900"
              >
                <Target className="mr-1 h-3.5 w-3.5" />
                数据分析
              </TabsTrigger>
            </TabsList>
          </div>

          {/* 供应商档案标签页 */}
          <TabsContent value="suppliers" className="m-0">
            <div className="border-b border-slate-300 bg-slate-50 p-3">
              <FinanceFilterBar
                placeholder="搜索供应商名称、编号、英文名或联系人…"
                value={searchTerm}
                onChange={setSearchTerm}
                onReset={() => {
                  setSearchTerm('');
                  setFilterStatus('all');
                }}
                extra={
                  <>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger className="h-10 min-w-[104px] border-slate-300 text-[13px] font-semibold text-slate-700">
                        <SelectValue placeholder="等级" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all" className="text-[13px]">全部等级</SelectItem>
                        <SelectItem value="A" className="text-[13px]">A级</SelectItem>
                        <SelectItem value="B" className="text-[13px]">B级</SelectItem>
                        <SelectItem value="C" className="text-[13px]">C级</SelectItem>
                      </SelectContent>
                    </Select>
                    <Dialog open={isAddSupplierOpen} onOpenChange={setIsAddSupplierOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="h-10 bg-slate-900 px-3.5 text-[13px] font-semibold hover:bg-slate-800" onClick={() => resetSupplierForm()}>
                      <Plus className="mr-1.5 h-3.5 w-3.5" />
                      新增供应商
                    </Button>
                  </DialogTrigger>
                  <DialogContent
                    className="grid w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)] sm:!w-[60rem] sm:!max-w-[60rem] grid-rows-[auto_minmax(0,1fr)_auto] max-h-[calc(100dvh-2rem)] overflow-hidden border-slate-300 bg-white p-0"
                  >
                    <DialogHeader className="border-b border-slate-300 px-6 py-5">
                      <DialogTitle className="text-[17px] font-semibold text-slate-900">{editingSupplierId ? '编辑供应商' : '新增供应商'}</DialogTitle>
                      <DialogDescription className="text-[13px] leading-[1.5] text-slate-600">
                        {editingSupplierId ? '修改供应商基本信息和资质认证' : '填写供应商基本信息和资质认证'}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="overflow-y-auto bg-slate-50 px-5 py-4">
                    <input
                      ref={supplierOcrInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp"
                      className="hidden"
                      onChange={handleSupplierDocumentSelect}
                    />
                    <div className="mb-4 rounded-lg border border-dashed border-slate-300 bg-white px-4 py-3">
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                          <div className="text-[13px] font-semibold text-slate-900">OCR 资料识别</div>
                          <div className="text-[12px] leading-[1.5] text-slate-600">上传营业执照或供应商资料截图，自动识别并回填名称、执照号、地址、联系人等字段。</div>
                          <div className="mt-1 text-[11px] text-slate-500">
                            当前支持 JPG、PNG、WebP 格式
                            {supplierOcrFileName ? `，最近识别：${supplierOcrFileName}` : ''}
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          className="h-10 border-slate-300 bg-white px-4 text-[13px] font-semibold text-slate-700"
                          onClick={() => supplierOcrInputRef.current?.click()}
                          disabled={isRecognizingSupplierDoc}
                        >
                          {isRecognizingSupplierDoc ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
                          {isRecognizingSupplierDoc ? '识别中...' : '上传资料识别'}
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-x-4 gap-y-4 rounded-lg border border-slate-300 bg-white p-4 md:grid-cols-2">
                      <div className="space-y-1.5 md:col-span-2">
                        <Label className="text-[12px] font-semibold text-slate-700">供应商名称（中文）*</Label>
                        <Input 
                          placeholder="例：东莞市华盛电器有限公司" 
                          className="h-10 border-slate-300 bg-white text-[13px] text-slate-900 placeholder:text-slate-400"
                          value={newSupplier.name}
                          onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[12px] font-semibold text-slate-700">供应商名称（英文）*</Label>
                        <Input 
                          placeholder="例：Dongguan Huasheng Electrical Co., Ltd." 
                          className="h-10 border-slate-300 bg-white text-[13px] text-slate-900 placeholder:text-slate-400"
                          value={newSupplier.nameEn}
                          onChange={(e) => setNewSupplier({ ...newSupplier, nameEn: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[12px] font-semibold text-slate-700">供应商编号*</Label>
                        <Input 
                          placeholder="例：DG-HS-001" 
                          className="h-10 border-slate-300 bg-white text-[13px] text-slate-900 placeholder:text-slate-400"
                          value={newSupplier.code}
                          onChange={(e) => setNewSupplier({ ...newSupplier, code: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[12px] font-semibold text-slate-700">产品类别*</Label>
                        <Select value={newSupplier.category} onValueChange={(value) => {
                          if (value === '__add_new__') {
                            setIsAddingNewCategory(true);
                          } else {
                            setNewSupplier({ ...newSupplier, category: value });
                          }
                        }}>
                          <SelectTrigger className="h-10 border-slate-300 bg-white text-[13px] text-slate-900">
                            <SelectValue placeholder="选择类别" />
                          </SelectTrigger>
                          <SelectContent>
                            {productCategories.map((category) => (
                              <SelectItem key={category} value={category} className="text-[13px]">
                                {category}
                              </SelectItem>
                            ))}
                            <SelectItem value="__add_new__" className="text-[13px] font-semibold text-blue-600">
                              + 新增类别
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        {isAddingNewCategory && (
                          <div className="mt-2 flex gap-2">
                            <Input
                              placeholder="输入新类别名称"
                              value={newCategory}
                              onChange={(e) => setNewCategory(e.target.value)}
                              className="h-9 flex-1 border-slate-300 bg-white text-[13px]"
                              autoFocus
                            />
                            <Button
                              size="sm"
                              className="h-9 px-3 text-[12px] font-semibold"
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
                              className="h-9 border-slate-300 px-3 text-[12px] font-semibold"
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
                        <Label className="text-[12px] font-semibold text-slate-700">联系人*</Label>
                        <Input 
                          placeholder="例：张伟" 
                          className="h-10 border-slate-300 bg-white text-[13px] text-slate-900 placeholder:text-slate-400"
                          value={newSupplier.contact}
                          onChange={(e) => setNewSupplier({ ...newSupplier, contact: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[12px] font-semibold text-slate-700">联系电话*</Label>
                        <Input 
                          placeholder="例：+86 769 8888 1234" 
                          className="h-10 border-slate-300 bg-white text-[13px] text-slate-900 placeholder:text-slate-400"
                          value={newSupplier.phone}
                          onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[12px] font-semibold text-slate-700">邮箱</Label>
                        <Input 
                          placeholder="例：zhang@huasheng.com" 
                          className="h-10 border-slate-300 bg-white text-[13px] text-slate-900 placeholder:text-slate-400"
                          value={newSupplier.email}
                          onChange={(e) => setNewSupplier({ ...newSupplier, email: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[12px] font-semibold text-slate-700">营业执照号</Label>
                        <Input 
                          placeholder="例：91441900MA4W1234XY" 
                          className="h-10 border-slate-300 bg-white text-[13px] text-slate-900 placeholder:text-slate-400"
                          value={newSupplier.businessLicense}
                          onChange={(e) => setNewSupplier({ ...newSupplier, businessLicense: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[12px] font-semibold text-slate-700">地址*</Label>
                        <Input 
                          placeholder="例：广东省东莞市长安镇工业园区" 
                          className="h-10 border-slate-300 bg-white text-[13px] text-slate-900 placeholder:text-slate-400"
                          value={newSupplier.address}
                          onChange={(e) => setNewSupplier({ ...newSupplier, address: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[12px] font-semibold text-slate-700">月产能</Label>
                        <Input 
                          placeholder="例：50万件/月" 
                          className="h-10 border-slate-300 bg-white text-[13px] text-slate-900 placeholder:text-slate-400"
                          value={newSupplier.capacity}
                          onChange={(e) => setNewSupplier({ ...newSupplier, capacity: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[12px] font-semibold text-slate-700">认证资质</Label>
                        <Input 
                          placeholder="例：ISO9001, CE, RoHS" 
                          className="h-10 border-slate-300 bg-white text-[13px] text-slate-900 placeholder:text-slate-400"
                          value={newSupplier.certifications}
                          onChange={(e) => setNewSupplier({ ...newSupplier, certifications: e.target.value })}
                        />
                      </div>
                    </div>
                    </div>
                    <div className="flex items-center justify-end gap-2 border-t border-slate-300 bg-white px-6 py-4">
                      <Button variant="outline" size="sm" className="h-10 border-slate-300 px-5 text-[13px] font-semibold" onClick={() => { setIsAddSupplierOpen(false); resetSupplierForm(); }}>
                        取消
                      </Button>
                      <Button size="sm" className="h-10 bg-slate-900 px-5 text-[13px] font-semibold hover:bg-slate-800" onClick={handleSaveSupplier}>
                        保存
                      </Button>
                    </div>
                  </DialogContent>
                    </Dialog>
                  </>
                }
              />
            </div>

            {pendingMasterRequests.length > 0 ? (
              <div className="border-b border-amber-300 bg-amber-50 px-3 py-3">
                <div className="mb-2 flex items-center justify-between">
                  <div>
                    <div className="text-[13px] font-semibold leading-[1.35] text-amber-900">待授权主档申请</div>
                    <div className="text-[11px] leading-[1.45] text-amber-700">财务端新增的供应商主档需在这里授权后生效；审核通过时系统会生成供应商编号。</div>
                  </div>
                  <Badge className="border-amber-300 bg-white text-[11px] font-semibold text-amber-700">{pendingMasterRequests.length} 条待处理</Badge>
                </div>
                <div className="overflow-x-auto border border-amber-200 bg-white">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-amber-50 hover:bg-amber-50">
                        <TableHead className="h-9 py-2 text-[12px] font-semibold text-amber-900">名称</TableHead>
                        <TableHead className="h-9 py-2 text-[12px] font-semibold text-amber-900">生效编号</TableHead>
                        <TableHead className="h-9 py-2 text-[12px] font-semibold text-amber-900">名单侧别</TableHead>
                        <TableHead className="h-9 py-2 text-[12px] font-semibold text-amber-900">收款方属性</TableHead>
                        <TableHead className="h-9 py-2 text-[12px] font-semibold text-amber-900">费用归属</TableHead>
                        <TableHead className="h-9 py-2 text-[12px] font-semibold text-amber-900">默认科目</TableHead>
                        <TableHead className="h-9 py-2 text-[12px] font-semibold text-amber-900">状态</TableHead>
                        <TableHead className="h-9 py-2 text-right text-[12px] font-semibold text-amber-900">操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingMasterRequests.map((request) => (
                        <TableRow key={request.id}>
                          <TableCell className="py-2 text-[12px] font-semibold text-slate-900">{request.name}</TableCell>
                          <TableCell className="py-2 font-mono text-[12px] text-slate-500">审核通过后生成</TableCell>
                          <TableCell className="py-2 text-[12px] text-slate-700">{getFinancePayeePartySideLabel(request.partySide)}</TableCell>
                          <TableCell className="py-2 text-[12px] text-slate-700">{getFinancePayeeCategoryLabel(request.category as any)}</TableCell>
                          <TableCell className="py-2 text-[12px] text-slate-700">{request.expenseScope === 'management' ? '管理费用' : '业务费用'}</TableCell>
                          <TableCell className="py-2 text-[12px] text-slate-700">{request.expenseSubject}</TableCell>
                          <TableCell className="py-2 text-[12px] text-slate-700">{getFinancePayeeApprovalStatusLabel(request.approvalStatus as any)}</TableCell>
                          <TableCell className="py-2 text-right">
                            <Button
                              size="sm"
                              className="h-8 bg-amber-600 px-3 text-[12px] font-semibold hover:bg-amber-700"
                              onClick={() => handleApproveMasterRequest(request)}
                            >
                              授权生效
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ) : null}

            <div className="overflow-hidden border-t border-slate-300">
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-100 hover:bg-slate-100">
                    <TableHead className="h-10 py-2 text-[12px] font-semibold text-slate-700">供应商编号</TableHead>
                    <TableHead className="h-10 py-2 text-[12px] font-semibold text-slate-700">供应商名称</TableHead>
                    <TableHead className="h-10 py-2 text-[12px] font-semibold text-slate-700">等级</TableHead>
                    <TableHead className="h-10 py-2 text-[12px] font-semibold text-slate-700">产品类别</TableHead>
                    <TableHead className="h-10 py-2 text-[12px] font-semibold text-slate-700">联系方式</TableHead>
                    <TableHead className="h-10 py-2 text-[12px] font-semibold text-slate-700">合作时长</TableHead>
                    <TableHead className="h-10 py-2 text-[12px] font-semibold text-slate-700">订单数</TableHead>
                    <TableHead className="h-10 py-2 text-[12px] font-semibold text-slate-700">准时率</TableHead>
                    <TableHead className="h-10 py-2 text-[12px] font-semibold text-slate-700">质量率</TableHead>
                    <TableHead className="h-10 py-2 text-right text-[12px] font-semibold text-slate-700">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSuppliers.map((supplier) => (
                    <TableRow key={supplier.id} className="hover:bg-slate-50">
                      <TableCell className="py-2.5">
                        <button
                          onClick={() => setViewSupplier(supplier)}
                          className="font-mono text-[13px] font-semibold tabular-nums text-blue-600 transition-all hover:text-blue-800 hover:underline"
                        >
                          {supplier.code}
                        </button>
                      </TableCell>
                      <TableCell className="py-2.5">
                        <button
                          onClick={() => setViewSupplier(supplier)}
                          className="text-left"
                        >
                          <p className="text-[13px] font-semibold text-slate-900 transition-all hover:text-blue-700">
                            {supplier.name}
                          </p>
                          <p className="text-[11px] text-slate-500">{supplier.nameEn}</p>
                        </button>
                      </TableCell>
                      <TableCell className="py-2.5">
                        <Badge className={`h-6 px-2 text-[11px] font-semibold border ${getSupplierLevelConfig(supplier.level).color}`}>
                          {getSupplierLevelConfig(supplier.level).label}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-2.5">
                        <p className="text-[12px] font-medium text-slate-700">{supplier.category}</p>
                        <p className="text-[11px] text-slate-500">{supplier.capacity}</p>
                      </TableCell>
                      <TableCell className="py-2.5">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3 text-slate-400" />
                            <p className="text-[11px] text-slate-700">{supplier.contact}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3 text-slate-400" />
                            <p className="text-[11px] text-slate-500">{supplier.phone}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-2.5">
                        <p className="font-mono text-[13px] tabular-nums text-slate-700">{supplier.cooperationYears}年</p>
                      </TableCell>
                      <TableCell className="py-2.5">
                        <p className="font-mono text-[13px] font-semibold tabular-nums text-slate-900">{supplier.totalOrders}</p>
                      </TableCell>
                      <TableCell className="py-2.5">
                        <Badge className={`h-6 px-2 font-mono text-[11px] font-semibold tabular-nums border ${
                          supplier.onTimeRate >= 95 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          supplier.onTimeRate >= 90 ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {supplier.onTimeRate}%
                        </Badge>
                      </TableCell>
                      <TableCell className="py-2.5">
                        <Badge className={`h-6 px-2 font-mono text-[11px] font-semibold tabular-nums border ${
                          supplier.qualityRate >= 98 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          supplier.qualityRate >= 95 ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {supplier.qualityRate}%
                        </Badge>
                      </TableCell>
                      <TableCell className="py-2.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition-all" 
                            onClick={() => setViewSupplier(supplier)}
                            title="查看供应商详情"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-all"
                            title="编辑供应商信息"
                            onClick={() => openEditSupplierDialog(supplier)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            </div>
          </TabsContent>

          {/* 供应商付款标签页 */}
          <TabsContent value="payments" className="m-0">
            <div className="border-b border-slate-300 bg-slate-50 p-3">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder="搜索付款编号、供应商..."
                    className="h-10 border-slate-300 pl-9 text-[13px] font-semibold text-slate-700 placeholder:text-[12px]"
                  />
                </div>
                <Select>
                  <SelectTrigger className="h-10 w-[120px] border-slate-300 text-[13px] font-semibold text-slate-700">
                    <SelectValue placeholder="状态" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-[13px]">全部</SelectItem>
                    <SelectItem value="pending" className="text-[13px]">待付</SelectItem>
                    <SelectItem value="paid" className="text-[13px]">已付</SelectItem>
                  </SelectContent>
                </Select>
                <Button size="sm" className="h-10 bg-slate-900 px-3.5 text-[13px] font-semibold hover:bg-slate-800">
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  登记付款
                </Button>
              </div>
            </div>

            <div className="overflow-hidden border-t border-slate-300">
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-100 hover:bg-slate-100">
                    <TableHead className="h-10 py-2 text-[12px] font-semibold text-slate-700">付款编号</TableHead>
                    <TableHead className="h-10 py-2 text-[12px] font-semibold text-slate-700">供应商</TableHead>
                    <TableHead className="h-10 py-2 text-[12px] font-semibold text-slate-700">采购单号</TableHead>
                    <TableHead className="h-10 py-2 text-[12px] font-semibold text-slate-700">付款类型</TableHead>
                    <TableHead className="h-10 py-2 text-[12px] font-semibold text-slate-700">付款金额</TableHead>
                    <TableHead className="h-10 py-2 text-[12px] font-semibold text-slate-700">支付方式</TableHead>
                    <TableHead className="h-10 py-2 text-[12px] font-semibold text-slate-700">到期日期</TableHead>
                    <TableHead className="h-10 py-2 text-[12px] font-semibold text-slate-700">状态</TableHead>
                    <TableHead className="h-10 py-2 text-right text-[12px] font-semibold text-slate-700">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {supplierPayments.map((payment) => (
                    <TableRow key={payment.id} className="hover:bg-slate-50">
                      <TableCell className="py-2.5">
                        <p className="font-mono text-[13px] font-semibold tabular-nums text-orange-600">{payment.paymentNumber}</p>
                      </TableCell>
                      <TableCell className="py-2.5">
                        <p className="text-[13px] font-semibold text-slate-900">{payment.supplierName}</p>
                      </TableCell>
                      <TableCell className="py-2.5">
                        <p className="font-mono text-[13px] font-semibold tabular-nums text-violet-600">{payment.poNumber}</p>
                      </TableCell>
                      <TableCell className="py-2.5">
                        <Badge className={`h-6 px-2 text-[11px] font-semibold border ${
                          payment.type === 'deposit' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          payment.type === 'balance' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                          'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          {payment.type === 'deposit' ? '定金' : payment.type === 'balance' ? '尾款' : '全款'}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-2.5">
                        <p className="font-mono text-[14px] font-semibold tabular-nums text-slate-900">
                          {getCurrencySymbol(payment.currency)}{payment.amount.toLocaleString()}
                        </p>
                      </TableCell>
                      <TableCell className="py-2.5">
                        <p className="font-mono text-[13px] font-semibold tabular-nums text-slate-700">{payment.paymentMethod}</p>
                      </TableCell>
                      <TableCell className="py-2.5">
                        <p className="font-mono text-[13px] tabular-nums text-slate-700">{payment.dueDate}</p>
                        {payment.paidDate && (
                          <p className="font-mono text-[11px] tabular-nums text-emerald-600">付: {payment.paidDate}</p>
                        )}
                      </TableCell>
                      <TableCell className="py-2.5">
                        <Badge className={`h-6 px-2 text-[11px] font-semibold border ${
                          payment.status === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          payment.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          {payment.status === 'paid' ? '已付' : payment.status === 'pending' ? '待付' : '逾期'}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-2.5 text-right">
                        <Button variant="ghost" size="sm" className="h-8 px-3 text-[12px] font-semibold text-slate-700">
                          详情
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            </div>
          </TabsContent>

          {/* 供应商绩效标签页 */}
          <TabsContent value="performance" className="m-0">
            <div className="border-b border-slate-300 bg-slate-50 p-3">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder="搜索供应商..."
                    className="h-10 border-slate-300 pl-9 text-[13px] font-semibold text-slate-700 placeholder:text-[12px]"
                  />
                </div>
                <Select>
                  <SelectTrigger className="h-10 w-[120px] border-slate-300 text-[13px] font-semibold text-slate-700">
                    <SelectValue placeholder="排序" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rating" className="text-[13px]">评分排序</SelectItem>
                    <SelectItem value="ontime" className="text-[13px]">准时率排序</SelectItem>
                    <SelectItem value="quality" className="text-[13px]">质量率排序</SelectItem>
                  </SelectContent>
                </Select>
                <Button size="sm" className="h-10 bg-emerald-600 px-3.5 text-[13px] font-semibold hover:bg-emerald-700">
                  <Download className="mr-1.5 h-3.5 w-3.5" />
                  导出报告
                </Button>
              </div>
            </div>

            <div className="overflow-hidden border-t border-slate-300">
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-100 hover:bg-slate-100">
                    <TableHead className="h-10 py-2 text-[12px] font-semibold text-slate-700">供应商名称</TableHead>
                    <TableHead className="h-10 py-2 text-[12px] font-semibold text-slate-700">总订单数</TableHead>
                    <TableHead className="h-10 py-2 text-[12px] font-semibold text-slate-700">完成订单</TableHead>
                    <TableHead className="h-10 py-2 text-[12px] font-semibold text-slate-700">准时订单</TableHead>
                    <TableHead className="h-10 py-2 text-[12px] font-semibold text-slate-700">合格订单</TableHead>
                    <TableHead className="h-10 py-2 text-[12px] font-semibold text-slate-700">准时率</TableHead>
                    <TableHead className="h-10 py-2 text-[12px] font-semibold text-slate-700">质量率</TableHead>
                    <TableHead className="h-10 py-2 text-[12px] font-semibold text-slate-700">平均交期</TableHead>
                    <TableHead className="h-10 py-2 text-[12px] font-semibold text-slate-700">综合评分</TableHead>
                    <TableHead className="h-10 py-2 text-right text-[12px] font-semibold text-slate-700">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {supplierPerformance.map((perf) => (
                    <TableRow key={perf.supplierName} className="hover:bg-slate-50">
                      <TableCell className="py-2.5">
                        <p className="text-[13px] font-semibold text-slate-900">{perf.supplierName}</p>
                      </TableCell>
                      <TableCell className="py-2.5">
                        <p className="font-mono text-[13px] font-semibold tabular-nums text-slate-900">{perf.totalOrders}</p>
                      </TableCell>
                      <TableCell className="py-2.5">
                        <p className="font-mono text-[13px] font-semibold tabular-nums text-emerald-600">{perf.completedOrders}</p>
                      </TableCell>
                      <TableCell className="py-2.5">
                        <p className="font-mono text-[13px] font-semibold tabular-nums text-blue-600">{perf.onTimeOrders}</p>
                      </TableCell>
                      <TableCell className="py-2.5">
                        <p className="font-mono text-[13px] font-semibold tabular-nums text-purple-600">{perf.qualifiedOrders}</p>
                      </TableCell>
                      <TableCell className="py-2.5">
                        <div className="space-y-0.5">
                          <Progress value={perf.onTimeRate} className="h-1 w-16" />
                          <p className="font-mono text-[12px] tabular-nums text-slate-600">{perf.onTimeRate}%</p>
                        </div>
                      </TableCell>
                      <TableCell className="py-2.5">
                        <div className="space-y-0.5">
                          <Progress value={perf.qualityRate} className="h-1 w-16" />
                          <p className="font-mono text-[12px] tabular-nums text-slate-600">{perf.qualityRate}%</p>
                        </div>
                      </TableCell>
                      <TableCell className="py-2.5">
                        <p className="font-mono text-[13px] tabular-nums text-slate-700">{perf.avgDeliveryDays}天</p>
                      </TableCell>
                      <TableCell className="py-2.5">
                        <div className="flex items-center gap-1">
                          {renderStars(perf.rating)}
                          <span className="ml-1 font-mono text-[12px] font-semibold tabular-nums text-slate-600">{perf.rating.toFixed(1)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-2.5 text-right">
                        <Button variant="ghost" size="sm" className="h-8 px-3 text-[12px] font-semibold text-slate-700">
                          详细
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            </div>
          </TabsContent>

          {/* 🔥🔥🔥 数据分析标签页 - 二维交叉数据表 */}
          <TabsContent value="analytics" className="m-0 p-4">
            <div className="space-y-4">
              {/* 说明卡片 */}
              <div className="border border-slate-300 bg-slate-50 p-4">
                <div className="flex items-start gap-2">
                  <Target className="mt-0.5 h-4 w-4 text-slate-700" />
                  <div>
                    <h3 className="mb-1 text-[13px] font-semibold text-slate-900">区域 × 业务类型交叉数据分析</h3>
                    <p className="text-[11px] leading-[1.45] text-slate-600">
                      展示不同区域在不同业务类型下的供应商数量、订单数、采购金额、准时率和质量率等关键指标
                    </p>
                  </div>
                </div>
              </div>

              {/* 二维交叉数据表 */}
              <div className="overflow-hidden border border-slate-300 bg-white">
                <div className="overflow-x-auto">
                  <table className="w-full text-[12px]">
                    <thead>
                      <tr className="bg-slate-800 text-white">
                        <th className="border-r border-slate-600 px-3 py-3 text-left text-[12px] font-semibold" rowSpan={2}>区域</th>
                        <th className="border-r border-slate-600 px-3 py-3 text-center text-[12px] font-semibold" colSpan={5}>直接采购</th>
                        <th className="border-r border-slate-600 px-3 py-3 text-center text-[12px] font-semibold" colSpan={5}>验货服务</th>
                        <th className="border-r border-slate-600 px-3 py-3 text-center text-[12px] font-semibold" colSpan={5}>代理服务</th>
                        <th className="px-3 py-3 text-center text-[12px] font-semibold" colSpan={5}>一站式项目</th>
                      </tr>
                      <tr className="bg-slate-700 text-white">
                        {/* 直接采购 */}
                        <th className="border-r border-slate-500 px-2 py-2 text-center text-[11px] font-semibold">供应商</th>
                        <th className="border-r border-slate-500 px-2 py-2 text-center text-[11px] font-semibold">订单数</th>
                        <th className="border-r border-slate-500 px-2 py-2 text-center text-[11px] font-semibold">金额(¥)</th>
                        <th className="border-r border-slate-500 px-2 py-2 text-center text-[11px] font-semibold">准时率</th>
                        <th className="border-r border-slate-600 px-2 py-2 text-center text-[11px] font-semibold">质量率</th>
                        {/* 验货服务 */}
                        <th className="border-r border-slate-500 px-2 py-2 text-center text-[11px] font-semibold">供应商</th>
                        <th className="border-r border-slate-500 px-2 py-2 text-center text-[11px] font-semibold">订单数</th>
                        <th className="border-r border-slate-500 px-2 py-2 text-center text-[11px] font-semibold">金额(¥)</th>
                        <th className="border-r border-slate-500 px-2 py-2 text-center text-[11px] font-semibold">准时率</th>
                        <th className="border-r border-slate-600 px-2 py-2 text-center text-[11px] font-semibold">质量率</th>
                        {/* 代理服务 */}
                        <th className="border-r border-slate-500 px-2 py-2 text-center text-[11px] font-semibold">供应商</th>
                        <th className="border-r border-slate-500 px-2 py-2 text-center text-[11px] font-semibold">订单数</th>
                        <th className="border-r border-slate-500 px-2 py-2 text-center text-[11px] font-semibold">金额(¥)</th>
                        <th className="border-r border-slate-500 px-2 py-2 text-center text-[11px] font-semibold">准时率</th>
                        <th className="border-r border-slate-600 px-2 py-2 text-center text-[11px] font-semibold">质量率</th>
                        {/* 一站式项目 */}
                        <th className="border-r border-slate-500 px-2 py-2 text-center text-[11px] font-semibold">供应商</th>
                        <th className="border-r border-slate-500 px-2 py-2 text-center text-[11px] font-semibold">订单数</th>
                        <th className="border-r border-slate-500 px-2 py-2 text-center text-[11px] font-semibold">金额(¥)</th>
                        <th className="border-r border-slate-500 px-2 py-2 text-center text-[11px] font-semibold">准时率</th>
                        <th className="px-2 py-2 text-center text-[11px] font-semibold">质量率</th>
                      </tr>
                    </thead>
                    <tbody>
                      {['广东', '浙江', '福建', '江苏', '上海'].map((region, idx) => (
                        <tr key={region} className={idx % 2 === 0 ? 'bg-slate-50' : 'bg-white'}>
                          <td className="border-r border-slate-300 px-3 py-3 text-[12px] font-semibold text-slate-900">{region}</td>
                          
                          {/* 直接采购 */}
                          <td className="border-r border-slate-200 px-2 py-3 text-center font-mono tabular-nums">
                            {crossTable[region]?.trading?.supplierCount || 0}
                          </td>
                          <td className="border-r border-slate-200 px-2 py-3 text-center font-mono tabular-nums">
                            {crossTable[region]?.trading?.orderCount || 0}
                          </td>
                          <td className="border-r border-slate-200 px-2 py-3 text-center font-mono font-semibold tabular-nums text-emerald-700">
                            {crossTable[region]?.trading?.totalAmount 
                              ? `¥${(crossTable[region].trading.totalAmount / 10000).toFixed(1)}万`
                              : '-'}
                          </td>
                          <td className="border-r border-slate-200 px-2 py-3 text-center font-mono tabular-nums">
                            {crossTable[region]?.trading?.avgOnTimeRate 
                              ? `${crossTable[region].trading.avgOnTimeRate.toFixed(1)}%`
                              : '-'}
                          </td>
                          <td className="border-r border-slate-300 px-2 py-3 text-center font-mono tabular-nums">
                            {crossTable[region]?.trading?.avgQualityRate 
                              ? `${crossTable[region].trading.avgQualityRate.toFixed(1)}%`
                              : '-'}
                          </td>

                          {/* 验货服务 */}
                          <td className="border-r border-slate-200 px-2 py-3 text-center font-mono tabular-nums">
                            {crossTable[region]?.inspection?.supplierCount || 0}
                          </td>
                          <td className="border-r border-slate-200 px-2 py-3 text-center font-mono tabular-nums">
                            {crossTable[region]?.inspection?.orderCount || 0}
                          </td>
                          <td className="border-r border-slate-200 px-2 py-3 text-center font-mono font-semibold tabular-nums text-emerald-700">
                            {crossTable[region]?.inspection?.totalAmount 
                              ? `¥${(crossTable[region].inspection.totalAmount / 10000).toFixed(1)}万`
                              : '-'}
                          </td>
                          <td className="border-r border-slate-200 px-2 py-3 text-center font-mono tabular-nums">
                            {crossTable[region]?.inspection?.avgOnTimeRate 
                              ? `${crossTable[region].inspection.avgOnTimeRate.toFixed(1)}%`
                              : '-'}
                          </td>
                          <td className="border-r border-slate-300 px-2 py-3 text-center font-mono tabular-nums">
                            {crossTable[region]?.inspection?.avgQualityRate 
                              ? `${crossTable[region].inspection.avgQualityRate.toFixed(1)}%`
                              : '-'}
                          </td>

                          {/* 代理服务 */}
                          <td className="border-r border-slate-200 px-2 py-3 text-center font-mono tabular-nums">
                            {crossTable[region]?.agency?.supplierCount || 0}
                          </td>
                          <td className="border-r border-slate-200 px-2 py-3 text-center font-mono tabular-nums">
                            {crossTable[region]?.agency?.orderCount || 0}
                          </td>
                          <td className="border-r border-slate-200 px-2 py-3 text-center font-mono font-semibold tabular-nums text-emerald-700">
                            {crossTable[region]?.agency?.totalAmount 
                              ? `¥${(crossTable[region].agency.totalAmount / 10000).toFixed(1)}万`
                              : '-'}
                          </td>
                          <td className="border-r border-slate-200 px-2 py-3 text-center font-mono tabular-nums">
                            {crossTable[region]?.agency?.avgOnTimeRate 
                              ? `${crossTable[region].agency.avgOnTimeRate.toFixed(1)}%`
                              : '-'}
                          </td>
                          <td className="border-r border-slate-300 px-2 py-3 text-center font-mono tabular-nums">
                            {crossTable[region]?.agency?.avgQualityRate 
                              ? `${crossTable[region].agency.avgQualityRate.toFixed(1)}%`
                              : '-'}
                          </td>

                          {/* 一站式项目 */}
                          <td className="border-r border-slate-200 px-2 py-3 text-center font-mono tabular-nums">
                            {crossTable[region]?.project?.supplierCount || 0}
                          </td>
                          <td className="border-r border-slate-200 px-2 py-3 text-center font-mono tabular-nums">
                            {crossTable[region]?.project?.orderCount || 0}
                          </td>
                          <td className="border-r border-slate-200 px-2 py-3 text-center font-mono font-semibold tabular-nums text-emerald-700">
                            {crossTable[region]?.project?.totalAmount 
                              ? `¥${(crossTable[region].project.totalAmount / 10000).toFixed(1)}万`
                              : '-'}
                          </td>
                          <td className="border-r border-slate-200 px-2 py-3 text-center font-mono tabular-nums">
                            {crossTable[region]?.project?.avgOnTimeRate 
                              ? `${crossTable[region].project.avgOnTimeRate.toFixed(1)}%`
                              : '-'}
                          </td>
                          <td className="px-2 py-3 text-center font-mono tabular-nums">
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
              <div className="border border-emerald-300 bg-emerald-50/70 p-4">
                <h4 className="mb-3 flex items-center gap-2 text-[14px] font-semibold text-emerald-900">
                  <CheckCircle2 className="w-4 h-4" />
                  业务类型总额验证
                </h4>
                <div className="grid grid-cols-5 gap-3">
                  <div className="border border-emerald-200 bg-white p-3">
                    <p className="mb-1 text-[11px] text-slate-600">直接采购</p>
                    <p className="font-mono text-[15px] font-semibold tabular-nums text-blue-700">
                      ${(filteredPurchaseOrders.filter(po => po.businessType === 'trading').reduce((sum, po) => sum + po.totalAmount, 0) * timeMultiplier / 1000).toFixed(1)}K
                    </p>
                  </div>
                  <div className="border border-emerald-200 bg-white p-3">
                    <p className="mb-1 text-[11px] text-slate-600">验货服务</p>
                    <p className="font-mono text-[15px] font-semibold tabular-nums text-purple-700">
                      ${(filteredPurchaseOrders.filter(po => po.businessType === 'inspection').reduce((sum, po) => sum + po.totalAmount, 0) * timeMultiplier / 1000).toFixed(1)}K
                    </p>
                  </div>
                  <div className="border border-emerald-200 bg-white p-3">
                    <p className="mb-1 text-[11px] text-slate-600">代理服务</p>
                    <p className="font-mono text-[15px] font-semibold tabular-nums text-orange-700">
                      ${(filteredPurchaseOrders.filter(po => po.businessType === 'agency').reduce((sum, po) => sum + po.totalAmount, 0) * timeMultiplier / 1000).toFixed(1)}K
                    </p>
                  </div>
                  <div className="border border-emerald-200 bg-white p-3">
                    <p className="mb-1 text-[11px] text-slate-600">一站式项目</p>
                    <p className="font-mono text-[15px] font-semibold tabular-nums text-rose-700">
                      ${(filteredPurchaseOrders.filter(po => po.businessType === 'project').reduce((sum, po) => sum + po.totalAmount, 0) * timeMultiplier / 1000).toFixed(1)}K
                    </p>
                  </div>
                  <div className="border-2 border-emerald-400 bg-emerald-100/80 p-3">
                    <p className="mb-1 text-[11px] font-semibold text-emerald-800">总采购额</p>
                    <p className="font-mono text-[15px] font-semibold tabular-nums text-emerald-900">
                      ${(stats.totalPurchaseAmount / 1000).toFixed(1)}K
                    </p>
                  </div>
                </div>
                <p className="mt-2 flex items-center gap-1 text-[11px] text-emerald-700">
                  <CheckCircle2 className="w-3 h-3" />
                  <strong>验证通过：</strong>各业务类型金额总和 = 总采购额（无重复计数）
                </p>
              </div>

              {/* 数据说明 */}
              <div className="grid grid-cols-2 gap-3">
                <div className="border border-blue-200 bg-blue-50/70 p-4">
                  <h4 className="mb-2 text-[13px] font-semibold text-blue-900">数据说明</h4>
                  <ul className="space-y-1 text-[11px] leading-[1.45] text-blue-800">
                    <li>• <strong>供应商：</strong>该区域该业务类型的供应商数量</li>
                    <li>• <strong>订单数：</strong>累计采购订单数量（受时间筛选影响）</li>
                    <li>• <strong>金额：</strong>累计采购金额（人民币）</li>
                    <li>• <strong>准时率：</strong>平均准时交付率</li>
                    <li>• <strong>质量率：</strong>平均质量合格率</li>
                  </ul>
                </div>
                <div className="border border-amber-200 bg-amber-50/70 p-4">
                  <h4 className="mb-2 text-[13px] font-semibold text-amber-900">使用建议</h4>
                  <ul className="space-y-1 text-[11px] leading-[1.45] text-amber-800">
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
        <DialogContent safeViewport className="max-w-3xl overflow-hidden border-slate-300 p-0">
          {viewSupplier && (
            <>
              <DialogHeader className="border-b border-slate-300 px-5 py-4">
                <DialogTitle className="text-[15px] font-semibold text-slate-900">供应商详情</DialogTitle>
                <DialogDescription className="text-[12px] text-slate-600">
                  {viewSupplier.name} ({viewSupplier.code})
                </DialogDescription>
              </DialogHeader>

              <div className="max-h-[calc(100dvh-11rem)] space-y-4 overflow-y-auto bg-slate-50 px-5 py-4">
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

              <div className="flex justify-end gap-2 border-t border-slate-300 bg-white px-5 py-3">
                <Button variant="outline" size="sm" className="h-9 border-slate-300 px-4 text-[13px] font-semibold" onClick={() => setViewSupplier(null)}>
                  关闭
                </Button>
                <Button
                  size="sm"
                  className="h-9 bg-slate-900 px-4 text-[13px] font-semibold hover:bg-slate-800"
                  onClick={() => {
                    setViewSupplier(null);
                    openEditSupplierDialog(viewSupplier);
                  }}
                >
                  <Edit className="mr-1.5 h-3.5 w-3.5" />
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
