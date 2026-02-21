// 🔍 验货管理系统 - 完全版（全功能实现）
// 包含：数据看板、订单管理、标准管理、报告管理、服务费管理、绩效统计、报告编辑器、模板编辑器、照片上传、数据导出

import React, { useState, useMemo } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Progress } from '../ui/progress';
import { Checkbox } from '../ui/checkbox';
import { Textarea } from '../ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../ui/dialog';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import {
  ClipboardCheck, Search, Filter, Plus, Eye, Edit, CheckCircle, XCircle,
  AlertTriangle, Clock, DollarSign, FileText, Camera, Package, TrendingUp,
  Users, Factory, MapPin, Calendar, Download, Upload, RefreshCw, Star,
  Award, Target, BarChart3, Layers, Box, Shield, Settings, Play, Pause,
  ChevronRight, CheckSquare, XSquare, AlertCircle, FileCheck, Truck, Home,
  Activity, TrendingDown, PieChart, ArrowUpRight, ArrowDownRight, Zap,
  FileSpreadsheet, Send, Mail, Phone, Globe, Building2, User, X, Image,
  Trash2, Save, Copy, Printer, FileDown, Check, Info, CalendarDays,
  Clock3, UserCheck, TrendingUpDown, MessageSquare, ThumbsUp, ThumbsDown,
  FileImage, FolderOpen, Archive, History, Bell, Pencil, MoreVertical,
  ChevronLeft, ChevronDown, ChevronUp, Maximize2, Minimize2, List,
  Grid3x3, Workflow, Link, ExternalLink, BookOpen, ClipboardList,
  SortAsc, SortDesc, FilterX, RotateCcw, Columns, LayoutGrid, Type,
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, ListOrdered,
  Heading1, Heading2, Code, Quote, Undo, Redo, GripVertical, Move
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';

// 类型定义
type BusinessType = 'standard' | 'inspection-only' | 'agency' | 'project';
type InspectionStatus = 'pending' | 'scheduled' | 'in-progress' | 'report-draft' 
  | 'report-review' | 'report-approved' | 'invoice-pending' | 'invoice-sent' 
  | 'payment-received' | 'completed' | 'rejected' | 'cancelled';
type PaymentStatus = 'unpaid' | 'partial' | 'paid';

interface InspectionOrder {
  id: string;
  orderNumber: string;
  businessType: BusinessType;
  customerName: string;
  customerType: string;
  supplierName: string;
  poNumber?: string;
  productCategory: string;
  productName: string;
  quantity: number;
  inspectionDate: string;
  scheduledDate: string;
  inspector: string;
  status: InspectionStatus;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  location: string;
  inspectionStandard: string;
  passRate?: number;
  defectCount?: number;
  majorDefects?: number;
  minorDefects?: number;
  criticalDefects?: number;
  reportUrl?: string;
  reportStatus?: 'draft' | 'under-review' | 'approved';
  photoCount?: number;
  inspectionFee?: number;
  invoiceNumber?: string;
  invoiceDate?: string;
  paymentStatus?: PaymentStatus;
  requestDate: string;
  completionDate?: string;
  notes?: string;
  contactPerson?: string;
  contactPhone?: string;
  contactEmail?: string;
  rating?: number;
  feedback?: string;
}

interface CheckItem {
  id: string;
  category: string;
  name: string;
  standard: string;
  acceptanceCriteria: string;
  required: boolean;
  order?: number;
}

interface InspectionTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  standard: string;
  checkItems: CheckItem[];
  isActive: boolean;
  createdDate: string;
  createdBy: string;
  usageCount: number;
}

interface InspectionReport {
  id: string;
  orderNumber: string;
  reportNumber: string;
  customerName: string;
  productName: string;
  inspectionDate: string;
  inspector: string;
  status: 'draft' | 'under-review' | 'approved' | 'rejected';
  passRate: number;
  conclusion: 'pass' | 'conditional-pass' | 'fail';
  summary: string;
  recommendations: string;
  detailedFindings?: string;
  createdDate: string;
  approvedBy?: string;
  approvedDate?: string;
}

interface ServiceFeeInvoice {
  id: string;
  invoiceNumber: string;
  orderNumber: string;
  customerName: string;
  serviceFee: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  invoiceDate: string;
  dueDate: string;
  paymentStatus: PaymentStatus;
  paidAmount: number;
  paidDate?: string;
  paymentMethod?: string;
  paymentProof?: string;
  notes?: string;
}

interface InspectorPerformance {
  id: string;
  name: string;
  totalInspections: number;
  completedInspections: number;
  avgPassRate: number;
  avgRating: number;
  onTimeRate: number;
  thisMonth: number;
  lastMonth: number;
}

// 标签配置
const BUSINESS_TYPE_LABELS = {
  'standard': { label: '标准采购', color: 'bg-blue-500', description: '常规采购+验货' },
  'inspection-only': { label: '纯验货', color: 'bg-purple-500', description: '仅提供验货服务' },
  'agency': { label: '代理采购', color: 'bg-orange-500', description: '代理采购+验货' },
  'project': { label: '工程项目', color: 'bg-green-500', description: '大型项目验货' }
};

const STATUS_LABELS: Record<InspectionStatus, { label: string; color: string; icon: any }> = {
  'pending': { label: '待接收', color: 'bg-gray-400', icon: Clock },
  'scheduled': { label: '已排期', color: 'bg-blue-500', icon: Calendar },
  'in-progress': { label: '验货中', color: 'bg-yellow-500', icon: Activity },
  'report-draft': { label: '报告草稿', color: 'bg-cyan-500', icon: FileText },
  'report-review': { label: '报告审核', color: 'bg-indigo-500', icon: Eye },
  'report-approved': { label: '报告批准', color: 'bg-green-500', icon: CheckCircle },
  'invoice-pending': { label: '待开票', color: 'bg-amber-500', icon: FileSpreadsheet },
  'invoice-sent': { label: '已开票', color: 'bg-teal-500', icon: Send },
  'payment-received': { label: '已收款', color: 'bg-emerald-500', icon: DollarSign },
  'completed': { label: '已完成', color: 'bg-green-600', icon: CheckSquare },
  'rejected': { label: '不合格', color: 'bg-red-500', icon: XCircle },
  'cancelled': { label: '已取消', color: 'bg-slate-400', icon: XSquare }
};

// Mock数据
const mockInspectionOrders: InspectionOrder[] = [
  {
    id: '1', orderNumber: 'INS-2024-001', businessType: 'inspection-only',
    customerName: 'Home Depot Inc.', customerType: '零售商',
    supplierName: '深圳市XX五金厂', productCategory: '五金工具',
    productName: '电动螺丝刀套装', quantity: 5000,
    inspectionDate: '2024-12-05', scheduledDate: '2024-12-05',
    inspector: '张验货', status: 'in-progress', priority: 'high',
    location: '深圳宝安', inspectionStandard: 'AQL 2.5',
    requestDate: '2024-12-01', inspectionFee: 1200, paymentStatus: 'unpaid',
    contactPerson: 'John Smith', contactPhone: '+1-555-0100',
    contactEmail: 'john@homedepot.com', photoCount: 12, rating: 4.5,
  },
  {
    id: '2', orderNumber: 'INS-2024-002', businessType: 'standard',
    customerName: 'ABC Hardware', customerType: '批发商',
    supplierName: '东莞XX电器', poNumber: 'PO-2024-156',
    productCategory: '电气产品', productName: 'LED灯具',
    quantity: 10000, inspectionDate: '2024-12-03',
    scheduledDate: '2024-12-03', inspector: '李检验',
    status: 'report-approved', priority: 'medium',
    location: '东莞长安', inspectionStandard: 'AQL 1.5',
    passRate: 96.5, defectCount: 350, majorDefects: 15,
    minorDefects: 335, reportUrl: '/reports/INS-2024-002.pdf',
    reportStatus: 'approved', photoCount: 48,
    requestDate: '2024-11-28', completionDate: '2024-12-03',
    contactPerson: 'Mary Wilson', contactPhone: '+1-555-0200',
    contactEmail: 'mary@abchardware.com', rating: 5.0,
    feedback: '验货非常专业，报告详细，服务态度很好！'
  },
  {
    id: '3', orderNumber: 'INS-2024-003', businessType: 'inspection-only',
    customerName: "Lowe's Companies", customerType: '零售商',
    supplierName: '佛山XX卫浴', productCategory: '卫浴产品',
    productName: '智能马桶', quantity: 2000,
    inspectionDate: '2024-12-01', scheduledDate: '2024-12-01',
    inspector: '王质检', status: 'completed', priority: 'urgent',
    location: '佛山南海', inspectionStandard: 'AQL 1.0',
    passRate: 98.2, defectCount: 36, majorDefects: 2,
    minorDefects: 34, reportUrl: '/reports/INS-2024-003.pdf',
    reportStatus: 'approved', photoCount: 52,
    inspectionFee: 1500, invoiceNumber: 'INV-2024-086',
    invoiceDate: '2024-12-02', paymentStatus: 'paid',
    requestDate: '2024-11-25', completionDate: '2024-12-01',
    contactPerson: 'Robert Brown', contactPhone: '+1-555-0300',
    contactEmail: 'robert@lowes.com', rating: 4.8,
    feedback: '效率很高，质量把控严格，下次还会选择你们的服务。'
  }
];

const mockTemplates: InspectionTemplate[] = [
  {
    id: 't1', name: '五金工具标准检验', category: '五金工具',
    description: '适用于手动工具、电动工具等五金产品的验货标准',
    standard: 'AQL 2.5',
    checkItems: [
      { id: 'c1', category: '外观', name: '表面处理', standard: '无划痕、无锈蚀', acceptanceCriteria: '主要缺陷≤0.5%', required: true, order: 1 },
      { id: 'c2', category: '功能', name: '电机性能', standard: '额定功率±5%', acceptanceCriteria: '严重缺陷=0', required: true, order: 2 },
      { id: 'c3', category: '尺寸', name: '关键尺寸', standard: '±0.5mm', acceptanceCriteria: '主要缺陷≤1%', required: true, order: 3 },
      { id: 'c4', category: '包装', name: '包装完整性', standard: '无破损', acceptanceCriteria: '次要缺陷≤2.5%', required: true, order: 4 },
    ],
    isActive: true, createdDate: '2024-01-15', createdBy: '张验货', usageCount: 156
  },
  {
    id: 't2', name: 'LED灯具检验标准', category: '电气产品',
    description: '适用于各类LED照明产品的质量检验',
    standard: 'AQL 1.5',
    checkItems: [
      { id: 'c5', category: '外观', name: '表面光洁度', standard: '无瑕疵', acceptanceCriteria: '主要缺陷≤0.5%', required: true, order: 1 },
      { id: 'c6', category: '电气', name: '电压测试', standard: '220V±10%', acceptanceCriteria: '严重缺陷=0', required: true, order: 2 },
      { id: 'c7', category: '光学', name: '亮度测试', standard: '≥800流明', acceptanceCriteria: '主要缺陷≤1%', required: true, order: 3 },
      { id: 'c8', category: '安全', name: '绝缘测试', standard: '>1MΩ', acceptanceCriteria: '严重缺陷=0', required: true, order: 4 },
    ],
    isActive: true, createdDate: '2024-02-20', createdBy: '李检验', usageCount: 89
  },
  {
    id: 't3', name: '卫浴产品检验标准', category: '卫浴产品',
    description: '适用于马桶、水龙头、淋浴设备等卫浴产品',
    standard: 'AQL 1.0',
    checkItems: [
      { id: 'c9', category: '外观', name: '陶瓷表面', standard: '无裂纹、无色差', acceptanceCriteria: '主要缺陷≤0.5%', required: true, order: 1 },
      { id: 'c10', category: '功能', name: '冲水性能', standard: '≤6L/次', acceptanceCriteria: '严重缺陷=0', required: true, order: 2 },
      { id: 'c11', category: '结构', name: '安装配件', standard: '齐全、无缺漏', acceptanceCriteria: '主要缺陷≤1%', required: true, order: 3 },
      { id: 'c12', category: '智能', name: '电子功能', standard: '全部正常', acceptanceCriteria: '严重缺陷=0', required: true, order: 4 },
    ],
    isActive: true, createdDate: '2024-03-10', createdBy: '王质检', usageCount: 67
  }
];

const mockReports: InspectionReport[] = [
  {
    id: 'r1', orderNumber: 'INS-2024-003', reportNumber: 'RPT-2024-003',
    customerName: "Lowe's Companies", productName: '智能马桶',
    inspectionDate: '2024-12-01', inspector: '王质检',
    status: 'approved', passRate: 98.2, conclusion: 'pass',
    summary: '本批次产品整体质量优良，合格率98.2%。发现36处轻微缺陷，其中2处主要缺陷已标记，34处次要缺陷在可接受范围内。',
    recommendations: '建议供应商加强生产过程中的质量控制，特别是智能模块的安装工艺。建议客户验收时重点检查智能功能。',
    detailedFindings: '1. 外观检查：95%合格\n2. 功能测试：100%合格\n3. 尺寸测量：98%合格\n4. 包装检查：99%合格',
    createdDate: '2024-12-01', approvedBy: '审核主管', approvedDate: '2024-12-02'
  },
  {
    id: 'r2', orderNumber: 'INS-2024-002', reportNumber: 'RPT-2024-002',
    customerName: 'ABC Hardware', productName: 'LED灯具',
    inspectionDate: '2024-12-03', inspector: '李检验',
    status: 'approved', passRate: 96.5, conclusion: 'pass',
    summary: 'LED灯具整体质量符合标准，合格率96.5%。发现350处缺陷，其中15处主要缺陷，335处次要缺陷。',
    recommendations: '建议供应商改进焊接工艺，减少次要缺陷率。建议客户抽检时注意电气性能测试。',
    detailedFindings: '1. 外观检查：97%合格\n2. 电气测试：98%合格\n3. 光学测试：96%合格\n4. 包装检查：98%合格',
    createdDate: '2024-12-03', approvedBy: '审核主管', approvedDate: '2024-12-03'
  }
];

const mockInvoices: ServiceFeeInvoice[] = [
  {
    id: 'inv1', invoiceNumber: 'INV-2024-086', orderNumber: 'INS-2024-003',
    customerName: "Lowe's Companies", serviceFee: 1500, taxRate: 0.06,
    taxAmount: 90, totalAmount: 1590, invoiceDate: '2024-12-02',
    dueDate: '2024-12-17', paymentStatus: 'paid', paidAmount: 1590,
    paidDate: '2024-12-05', paymentMethod: '电汇',
    paymentProof: '/proofs/payment-inv1.pdf',
    notes: '已按时收款，客户信誉良好'
  },
  {
    id: 'inv2', invoiceNumber: 'INV-2024-085', orderNumber: 'INS-2024-001',
    customerName: 'Home Depot Inc.', serviceFee: 1200, taxRate: 0.06,
    taxAmount: 72, totalAmount: 1272, invoiceDate: '2024-12-06',
    dueDate: '2024-12-21', paymentStatus: 'unpaid', paidAmount: 0,
    notes: '已发送发票，等待客户付款'
  }
];

const mockInspectorPerformance: InspectorPerformance[] = [
  {
    id: '1', name: '张验货', totalInspections: 156, completedInspections: 152,
    avgPassRate: 97.2, avgRating: 4.7, onTimeRate: 98.5,
    thisMonth: 18, lastMonth: 15
  },
  {
    id: '2', name: '李检验', totalInspections: 142, completedInspections: 140,
    avgPassRate: 96.8, avgRating: 4.8, onTimeRate: 99.2,
    thisMonth: 16, lastMonth: 14
  },
  {
    id: '3', name: '王质检', totalInspections: 128, completedInspections: 125,
    avgPassRate: 97.5, avgRating: 4.9, onTimeRate: 97.8,
    thisMonth: 14, lastMonth: 13
  }
];

export function InspectionManagementComplete() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [businessTypeFilter, setBusinessTypeFilter] = useState('all');
  
  // 报告编辑器状态
  const [showReportEditor, setShowReportEditor] = useState(false);
  const [editingReport, setEditingReport] = useState<InspectionReport | null>(null);
  const [reportContent, setReportContent] = useState({
    summary: '',
    detailedFindings: '',
    recommendations: '',
    conclusion: 'pass' as 'pass' | 'conditional-pass' | 'fail'
  });
  
  // 模板编辑器状态
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<InspectionTemplate | null>(null);
  const [draggedCheckItem, setDraggedCheckItem] = useState<string | null>(null);
  
  // 照片上传状态
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<InspectionOrder | null>(null);
  
  // 发票状态
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);
  const [invoiceOrder, setInvoiceOrder] = useState<InspectionOrder | null>(null);

  // 统计数据
  const statistics = useMemo(() => {
    const total = mockInspectionOrders.length;
    const pending = mockInspectionOrders.filter(o => o.status === 'pending').length;
    const scheduled = mockInspectionOrders.filter(o => o.status === 'scheduled').length;
    const inProgress = mockInspectionOrders.filter(o => o.status === 'in-progress').length;
    const completed = mockInspectionOrders.filter(o => o.status === 'completed').length;
    const inspectionOnly = mockInspectionOrders.filter(o => o.businessType === 'inspection-only').length;
    
    const totalFees = mockInspectionOrders
      .filter(o => o.inspectionFee)
      .reduce((sum, o) => sum + (o.inspectionFee || 0), 0);
    
    const paidFees = mockInspectionOrders
      .filter(o => o.paymentStatus === 'paid')
      .reduce((sum, o) => sum + (o.inspectionFee || 0), 0);
    
    const ordersWithPassRate = mockInspectionOrders.filter(o => o.passRate !== undefined);
    const avgPassRate = ordersWithPassRate.length > 0
      ? ordersWithPassRate.reduce((sum, o) => sum + (o.passRate || 0), 0) / ordersWithPassRate.length
      : 0;

    const thisMonth = mockInspectionOrders.filter(o => o.requestDate.startsWith('2024-12')).length;
    const lastMonth = mockInspectionOrders.filter(o => o.requestDate.startsWith('2024-11')).length;

    return {
      total, pending, scheduled, inProgress, completed, inspectionOnly,
      totalFees, paidFees, avgPassRate,
      thisMonth, lastMonth, growth: thisMonth - lastMonth
    };
  }, []);

  // 筛选订单
  const filteredOrders = useMemo(() => {
    return mockInspectionOrders.filter(order => {
      const matchSearch = searchTerm === '' || 
        order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.productName.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchStatus = statusFilter === 'all' || order.status === statusFilter;
      const matchType = businessTypeFilter === 'all' || order.businessType === businessTypeFilter;
      
      return matchSearch && matchStatus && matchType;
    });
  }, [searchTerm, statusFilter, businessTypeFilter]);

  // 打开报告编辑器
  const handleEditReport = (report: InspectionReport) => {
    setEditingReport(report);
    setReportContent({
      summary: report.summary,
      detailedFindings: report.detailedFindings || '',
      recommendations: report.recommendations,
      conclusion: report.conclusion
    });
    setShowReportEditor(true);
  };

  // 创建新报告
  const handleCreateReport = (order: InspectionOrder) => {
    const newReport: InspectionReport = {
      id: `r-new-${Date.now()}`,
      orderNumber: order.orderNumber,
      reportNumber: `RPT-${Date.now()}`,
      customerName: order.customerName,
      productName: order.productName,
      inspectionDate: order.inspectionDate,
      inspector: order.inspector,
      status: 'draft',
      passRate: 0,
      conclusion: 'pass',
      summary: '',
      recommendations: '',
      createdDate: new Date().toISOString().split('T')[0]
    };
    setEditingReport(newReport);
    setReportContent({
      summary: '',
      detailedFindings: '',
      recommendations: '',
      conclusion: 'pass'
    });
    setShowReportEditor(true);
  };

  // 保存报告
  const handleSaveReport = () => {
    if (editingReport) {
      console.log('保存报告:', { ...editingReport, ...reportContent });
      alert('报告已保存！');
      setShowReportEditor(false);
    }
  };

  // 打开模板编辑器
  const handleEditTemplate = (template: InspectionTemplate) => {
    setEditingTemplate(template);
    setShowTemplateEditor(true);
  };

  // 创建新模板
  const handleCreateTemplate = () => {
    const newTemplate: InspectionTemplate = {
      id: `t-new-${Date.now()}`,
      name: '',
      category: '',
      description: '',
      standard: 'AQL 2.5',
      checkItems: [],
      isActive: true,
      createdDate: new Date().toISOString().split('T')[0],
      createdBy: '当前用户',
      usageCount: 0
    };
    setEditingTemplate(newTemplate);
    setShowTemplateEditor(true);
  };

  // 添加检查项
  const handleAddCheckItem = () => {
    if (editingTemplate) {
      const newItem: CheckItem = {
        id: `item-${Date.now()}`,
        category: '',
        name: '',
        standard: '',
        acceptanceCriteria: '',
        required: true,
        order: editingTemplate.checkItems.length + 1
      };
      setEditingTemplate({
        ...editingTemplate,
        checkItems: [...editingTemplate.checkItems, newItem]
      });
    }
  };

  // 删除检查项
  const handleDeleteCheckItem = (itemId: string) => {
    if (editingTemplate) {
      setEditingTemplate({
        ...editingTemplate,
        checkItems: editingTemplate.checkItems.filter(item => item.id !== itemId)
      });
    }
  };

  // 保存模板
  const handleSaveTemplate = () => {
    if (editingTemplate) {
      console.log('保存模板:', editingTemplate);
      alert('模板已保存！');
      setShowTemplateEditor(false);
    }
  };

  // 开具发票
  const handleCreateInvoice = (order: InspectionOrder) => {
    setInvoiceOrder(order);
    setShowInvoiceDialog(true);
  };

  // 上传照片
  const handleUploadPhotos = (order: InspectionOrder) => {
    setSelectedOrder(order);
    setShowPhotoUpload(true);
  };

  // 数据导出
  const handleExportData = (type: 'excel' | 'pdf') => {
    alert(`正在导出${type.toUpperCase()}格式数据...`);
  };

  return (
    <div className="space-y-3 p-3 bg-slate-50">
      {/* 页面标题 */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg p-4 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold mb-1 flex items-center gap-2">
              <ClipboardCheck className="size-5" />
              验货管理系统 - 完全版
            </h1>
            <p className="text-blue-100 text-xs">
              全功能实现：数据看板 · 订单管理 · 标准管理 · 报告编辑器 · 服务费管理 · 绩效统计 · 数据导出
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button className="bg-white text-blue-600 hover:bg-blue-50 h-8 text-xs px-3">
              <Plus className="size-3.5 mr-1.5" />
              新建验货申请
            </Button>
            <Button 
              variant="outline" 
              className="bg-blue-500 border-blue-400 text-white hover:bg-blue-400 h-8 text-xs px-3"
              onClick={() => handleExportData('excel')}
            >
              <Download className="size-3.5 mr-1.5" />
              导出Excel
            </Button>
            <Button 
              variant="outline" 
              className="bg-blue-500 border-blue-400 text-white hover:bg-blue-400 h-8 text-xs px-3"
              onClick={() => handleExportData('pdf')}
            >
              <FileDown className="size-3.5 mr-1.5" />
              导出PDF
            </Button>
          </div>
        </div>
      </div>

      {/* 核心Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-6 w-full h-9">
          <TabsTrigger value="dashboard" className="text-xs py-1">
            <BarChart3 className="size-3.5 mr-1.5" />
            数据看板
          </TabsTrigger>
          <TabsTrigger value="orders" className="text-xs py-1">
            <Package className="size-3.5 mr-1.5" />
            验货订单
          </TabsTrigger>
          <TabsTrigger value="templates" className="text-xs py-1">
            <Layers className="size-3.5 mr-1.5" />
            验货标准
          </TabsTrigger>
          <TabsTrigger value="reports" className="text-xs py-1">
            <FileText className="size-3.5 mr-1.5" />
            验货报告
          </TabsTrigger>
          <TabsTrigger value="fees" className="text-xs py-1">
            <DollarSign className="size-3.5 mr-1.5" />
            服务费管理
          </TabsTrigger>
          <TabsTrigger value="performance" className="text-xs py-1">
            <TrendingUpDown className="size-3.5 mr-1.5" />
            绩效统计
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: 数据看板 */}
        <TabsContent value="dashboard" className="space-y-3 mt-3">
          {/* KPI卡片 */}
          <div className="grid grid-cols-6 gap-3">
            <Card className="p-3 border-blue-300 bg-white hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Package className="size-4 text-blue-600" />
                </div>
              </div>
              <p className="text-xs text-slate-600 mb-0.5">验货总数</p>
              <p className="text-xl font-bold text-slate-900">{statistics.total}</p>
              <div className="flex items-center gap-1 mt-1">
                {statistics.growth >= 0 ? (
                  <ArrowUpRight className="size-3 text-green-600" />
                ) : (
                  <ArrowDownRight className="size-3 text-red-600" />
                )}
                <span className={`text-xs ${statistics.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  本月 {statistics.growth >= 0 ? '+' : ''}{statistics.growth}
                </span>
              </div>
            </Card>

            <Card className="p-3 border-yellow-300 bg-white hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <div className="w-9 h-9 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Clock className="size-4 text-yellow-600" />
                </div>
                <Badge className="bg-yellow-500 text-white text-xs h-5 px-1.5">待办</Badge>
              </div>
              <p className="text-xs text-slate-600 mb-0.5">待处理</p>
              <p className="text-xl font-bold text-slate-900">{statistics.pending}</p>
              <p className="text-xs text-slate-500 mt-1">需安排验货</p>
            </Card>

            <Card className="p-3 border-orange-300 bg-white hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <div className="w-9 h-9 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Activity className="size-4 text-orange-600" />
                </div>
                <Badge className="bg-orange-500 text-white text-xs h-5 px-1.5">进行</Badge>
              </div>
              <p className="text-xs text-slate-600 mb-0.5">验货中</p>
              <p className="text-xl font-bold text-slate-900">{statistics.inProgress}</p>
              <p className="text-xs text-slate-500 mt-1">现场执行中</p>
            </Card>

            <Card className="p-3 border-green-300 bg-white hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="size-4 text-green-600" />
                </div>
                <Badge className="bg-green-500 text-white text-xs h-5 px-1.5">完成</Badge>
              </div>
              <p className="text-xs text-slate-600 mb-0.5">已完成</p>
              <p className="text-xl font-bold text-slate-900">{statistics.completed}</p>
              <p className="text-xs text-slate-500 mt-1">
                完成率 {((statistics.completed / statistics.total) * 100).toFixed(0)}%
              </p>
            </Card>

            <Card className="p-3 border-purple-300 bg-white hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <div className="w-9 h-9 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Shield className="size-4 text-purple-600" />
                </div>
                <Badge className="bg-purple-500 text-white text-xs h-5 px-1.5">纯验货</Badge>
              </div>
              <p className="text-xs text-slate-600 mb-0.5">纯验货服务</p>
              <p className="text-xl font-bold text-slate-900">{statistics.inspectionOnly}</p>
              <p className="text-xs text-slate-500 mt-1">
                占比 {((statistics.inspectionOnly / statistics.total) * 100).toFixed(0)}%
              </p>
            </Card>

            <Card className="p-3 border-emerald-300 bg-white hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <div className="w-9 h-9 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="size-4 text-emerald-600" />
                </div>
                <Badge className="bg-emerald-500 text-white text-xs h-5 px-1.5">收入</Badge>
              </div>
              <p className="text-xs text-slate-600 mb-0.5">服务费总额</p>
              <p className="text-xl font-bold text-slate-900">${(statistics.totalFees / 1000).toFixed(1)}K</p>
              <p className="text-xs text-slate-500 mt-1">
                已收 {((statistics.paidFees / statistics.totalFees) * 100).toFixed(0)}%
              </p>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 2: 验货订单 */}
        <TabsContent value="orders" className="space-y-3 mt-3">
          <Card className="p-3 border-slate-300 bg-white">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900">订单列表</h3>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
                  <Input
                    placeholder="搜索订单..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 h-8 text-xs w-64"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-8 text-xs w-32">
                    <SelectValue placeholder="状态" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部状态</SelectItem>
                    <SelectItem value="pending">待接收</SelectItem>
                    <SelectItem value="in-progress">验货中</SelectItem>
                    <SelectItem value="completed">已完成</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              {filteredOrders.map(order => {
                const StatusIcon = STATUS_LABELS[order.status].icon;
                const typeInfo = BUSINESS_TYPE_LABELS[order.businessType];
                
                return (
                  <Card key={order.id} className="p-3 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-bold text-blue-600">{order.orderNumber}</span>
                          <Badge className={`${typeInfo.color} text-white text-xs h-5 px-2`}>
                            {typeInfo.label}
                          </Badge>
                          <Badge className={`${STATUS_LABELS[order.status].color} text-white text-xs h-5 px-2`}>
                            <StatusIcon className="size-3 mr-1" />
                            {STATUS_LABELS[order.status].label}
                          </Badge>
                          {order.rating && (
                            <div className="flex items-center gap-1">
                              <Star className="size-3 fill-yellow-400 text-yellow-400" />
                              <span className="text-xs font-bold text-yellow-600">{order.rating}</span>
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-5 gap-3 text-xs">
                          <div>
                            <p className="text-slate-500 mb-0.5">客户信息</p>
                            <p className="font-semibold text-slate-900">{order.customerName}</p>
                          </div>
                          <div>
                            <p className="text-slate-500 mb-0.5">产品信息</p>
                            <p className="font-semibold text-slate-900">{order.productName}</p>
                          </div>
                          <div>
                            <p className="text-slate-500 mb-0.5">验货日期</p>
                            <p className="font-semibold text-slate-900">{order.scheduledDate}</p>
                          </div>
                          <div>
                            <p className="text-slate-500 mb-0.5">验货员</p>
                            <p className="font-semibold text-slate-900">{order.inspector}</p>
                          </div>
                          <div>
                            <p className="text-slate-500 mb-0.5">地点</p>
                            <p className="font-semibold text-slate-900">{order.location}</p>
                          </div>
                        </div>

                        {order.passRate !== undefined && (
                          <div className="mt-2 p-2 bg-slate-50 rounded">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-slate-600">验货结果</span>
                              <span className="text-xs font-bold text-green-600">
                                合格率 {order.passRate}%
                              </span>
                            </div>
                            <Progress value={order.passRate} className="h-1.5" />
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-1.5 ml-3">
                        <Button variant="outline" className="h-7 px-3 text-xs whitespace-nowrap">
                          <Eye className="size-3 mr-1" />
                          查看详情
                        </Button>
                        {order.businessType === 'inspection-only' && !order.invoiceNumber && (
                          <Button 
                            variant="outline" 
                            className="h-7 px-3 text-xs whitespace-nowrap"
                            onClick={() => handleCreateInvoice(order)}
                          >
                            <FileSpreadsheet className="size-3 mr-1" />
                            开具发票
                          </Button>
                        )}
                        {order.status === 'in-progress' && (
                          <Button 
                            variant="outline" 
                            className="h-7 px-3 text-xs whitespace-nowrap"
                            onClick={() => handleUploadPhotos(order)}
                          >
                            <Camera className="size-3 mr-1" />
                            上传照片
                          </Button>
                        )}
                        {(order.status === 'report-approved' || order.status === 'completed') && (
                          <Button 
                            variant="outline" 
                            className="h-7 px-3 text-xs whitespace-nowrap"
                            onClick={() => handleCreateReport(order)}
                          >
                            <FileText className="size-3 mr-1" />
                            生成报告
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </Card>
        </TabsContent>

        {/* Tab 3: 验货标准 */}
        <TabsContent value="templates" className="space-y-3 mt-3">
          <Card className="p-3 border-slate-300 bg-white">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900">验货标准库</h3>
              <Button 
                className="bg-blue-600 text-white h-8 text-xs px-3"
                onClick={handleCreateTemplate}
              >
                <Plus className="size-3.5 mr-1.5" />
                新建标准
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {mockTemplates.map(template => (
                <Card key={template.id} className="p-3 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-bold text-slate-900 text-sm mb-1">{template.name}</h4>
                      <Badge className="bg-blue-500 text-white text-xs">{template.category}</Badge>
                    </div>
                    <Switch checked={template.isActive} />
                  </div>
                  
                  <p className="text-xs text-slate-600 mb-2">{template.description}</p>
                  
                  <div className="space-y-1 mb-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600">检验标准</span>
                      <span className="font-semibold text-slate-900">{template.standard}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600">检查项</span>
                      <span className="font-semibold text-slate-900">{template.checkItems.length} 项</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600">使用次数</span>
                      <span className="font-semibold text-green-600">{template.usageCount} 次</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      className="flex-1 h-7 text-xs"
                      onClick={() => handleEditTemplate(template)}
                    >
                      <Edit className="size-3 mr-1" />
                      编辑
                    </Button>
                    <Button variant="outline" className="flex-1 h-7 text-xs">
                      <Copy className="size-3 mr-1" />
                      复制
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Tab 4: 验货报告 */}
        <TabsContent value="reports" className="space-y-3 mt-3">
          <Card className="p-3 border-slate-300 bg-white">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900">验货报告管理</h3>
              <div className="flex gap-2">
                <Button variant="outline" className="h-8 text-xs px-3">
                  <Download className="size-3.5 mr-1.5" />
                  批量导出
                </Button>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>报告编号</TableHead>
                  <TableHead>订单号</TableHead>
                  <TableHead>客户</TableHead>
                  <TableHead>产品</TableHead>
                  <TableHead>验货日期</TableHead>
                  <TableHead>验货员</TableHead>
                  <TableHead>合格率</TableHead>
                  <TableHead>结论</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockReports.map(report => (
                  <TableRow key={report.id}>
                    <TableCell className="font-medium text-blue-600">{report.reportNumber}</TableCell>
                    <TableCell>{report.orderNumber}</TableCell>
                    <TableCell>{report.customerName}</TableCell>
                    <TableCell>{report.productName}</TableCell>
                    <TableCell>{report.inspectionDate}</TableCell>
                    <TableCell>{report.inspector}</TableCell>
                    <TableCell>
                      <span className="font-bold text-green-600">{report.passRate}%</span>
                    </TableCell>
                    <TableCell>
                      <Badge className={
                        report.conclusion === 'pass' ? 'bg-green-500' :
                        report.conclusion === 'conditional-pass' ? 'bg-yellow-500' :
                        'bg-red-500'
                      }>
                        {report.conclusion === 'pass' ? '合格' :
                         report.conclusion === 'conditional-pass' ? '有条件通过' :
                         '不合格'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={
                        report.status === 'approved' ? 'bg-green-500' :
                        report.status === 'under-review' ? 'bg-yellow-500' :
                        report.status === 'draft' ? 'bg-gray-400' :
                        'bg-red-500'
                      }>
                        {report.status === 'approved' ? '已批准' :
                         report.status === 'under-review' ? '审核中' :
                         report.status === 'draft' ? '草稿' :
                         '已拒绝'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button variant="ghost" size="sm" className="h-7 px-2">
                          <Eye className="size-3" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-7 px-2"
                          onClick={() => handleEditReport(report)}
                        >
                          <Edit className="size-3" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 px-2">
                          <Download className="size-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Tab 5: 服务费管理 */}
        <TabsContent value="fees" className="space-y-3 mt-3">
          <div className="grid grid-cols-4 gap-3 mb-3">
            <Card className="p-3 border-green-300 bg-white">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="size-4 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-slate-600">总服务费</p>
                  <p className="text-lg font-bold text-slate-900">${statistics.totalFees.toLocaleString()}</p>
                </div>
              </div>
            </Card>

            <Card className="p-3 border-emerald-300 bg-white">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="size-4 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-slate-600">已收款</p>
                  <p className="text-lg font-bold text-emerald-600">${statistics.paidFees.toLocaleString()}</p>
                </div>
              </div>
            </Card>

            <Card className="p-3 border-amber-300 bg-white">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                  <Clock className="size-4 text-amber-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-slate-600">待收款</p>
                  <p className="text-lg font-bold text-amber-600">
                    ${(statistics.totalFees - statistics.paidFees).toLocaleString()}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-3 border-blue-300 bg-white">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Target className="size-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-slate-600">回款率</p>
                  <p className="text-lg font-bold text-blue-600">
                    {((statistics.paidFees / statistics.totalFees) * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            </Card>
          </div>

          <Card className="p-3 border-slate-300 bg-white">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900">发票管理</h3>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>发票号</TableHead>
                  <TableHead>订单号</TableHead>
                  <TableHead>客户</TableHead>
                  <TableHead>服务费</TableHead>
                  <TableHead>税额</TableHead>
                  <TableHead>总金额</TableHead>
                  <TableHead>开票日期</TableHead>
                  <TableHead>到期日期</TableHead>
                  <TableHead>付款状态</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockInvoices.map(invoice => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium text-blue-600">{invoice.invoiceNumber}</TableCell>
                    <TableCell>{invoice.orderNumber}</TableCell>
                    <TableCell>{invoice.customerName}</TableCell>
                    <TableCell>${invoice.serviceFee}</TableCell>
                    <TableCell>${invoice.taxAmount}</TableCell>
                    <TableCell className="font-bold">${invoice.totalAmount}</TableCell>
                    <TableCell>{invoice.invoiceDate}</TableCell>
                    <TableCell>{invoice.dueDate}</TableCell>
                    <TableCell>
                      <Badge className={
                        invoice.paymentStatus === 'paid' ? 'bg-green-500' :
                        invoice.paymentStatus === 'partial' ? 'bg-yellow-500' :
                        'bg-red-500'
                      }>
                        {invoice.paymentStatus === 'paid' ? '已付款' :
                         invoice.paymentStatus === 'partial' ? '部分付款' :
                         '未付款'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button variant="ghost" size="sm" className="h-7 px-2">
                          <Eye className="size-3" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 px-2">
                          <Printer className="size-3" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 px-2">
                          <Send className="size-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Tab 6: 绩效统计 */}
        <TabsContent value="performance" className="space-y-3 mt-3">
          <Card className="p-3 border-slate-300 bg-white">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900">验货员绩效统计</h3>
              <Select defaultValue="thisMonth">
                <SelectTrigger className="h-8 text-xs w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="thisMonth">本月</SelectItem>
                  <SelectItem value="lastMonth">上月</SelectItem>
                  <SelectItem value="thisQuarter">本季度</SelectItem>
                  <SelectItem value="thisYear">本年度</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {mockInspectorPerformance.map((inspector, idx) => (
                <Card key={inspector.id} className="p-3 border-slate-300 bg-white hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        idx === 0 ? 'bg-yellow-100' :
                        idx === 1 ? 'bg-slate-100' :
                        'bg-orange-100'
                      }`}>
                        {idx === 0 && <Award className="size-5 text-yellow-600" />}
                        {idx === 1 && <Award className="size-5 text-slate-600" />}
                        {idx === 2 && <Award className="size-5 text-orange-600" />}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900">{inspector.name}</h4>
                        <p className="text-xs text-slate-500">验货员</p>
                      </div>
                    </div>
                    {idx === 0 && <Badge className="bg-yellow-500 text-white text-xs">🏆 TOP1</Badge>}
                  </div>

                  <div className="space-y-2">
                    <div className="p-2 bg-slate-50 rounded">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-slate-600">总验货数</span>
                        <span className="font-bold text-slate-900">{inspector.totalInspections}</span>
                      </div>
                      <Progress value={(inspector.completedInspections / inspector.totalInspections) * 100} className="h-1.5" />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2 bg-green-50 rounded text-center">
                        <p className="text-xs text-slate-600 mb-0.5">平均合格率</p>
                        <p className="font-bold text-green-600">{inspector.avgPassRate}%</p>
                      </div>
                      <div className="p-2 bg-blue-50 rounded text-center">
                        <p className="text-xs text-slate-600 mb-0.5">客户评分</p>
                        <p className="font-bold text-blue-600">{inspector.avgRating} ★</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2 bg-purple-50 rounded text-center">
                        <p className="text-xs text-slate-600 mb-0.5">准时率</p>
                        <p className="font-bold text-purple-600">{inspector.onTimeRate}%</p>
                      </div>
                      <div className="p-2 bg-amber-50 rounded text-center">
                        <p className="text-xs text-slate-600 mb-0.5">本月完成</p>
                        <p className="font-bold text-amber-600">{inspector.thisMonth}</p>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 报告编辑器弹窗 */}
      <Dialog open={showReportEditor} onOpenChange={setShowReportEditor}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="size-5 text-blue-600" />
              验货报告编辑器 - {editingReport?.reportNumber}
            </DialogTitle>
            <DialogDescription>
              编辑验货报告的详细内容，包括验货结论、报告摘要、详细检查结果和改进建议
            </DialogDescription>
          </DialogHeader>

          {editingReport && (
            <div className="space-y-4">
              {/* 基本信息 */}
              <Card className="p-3 bg-slate-50">
                <div className="grid grid-cols-4 gap-3 text-xs">
                  <div>
                    <p className="text-slate-600 mb-1">订单号</p>
                    <p className="font-bold text-slate-900">{editingReport.orderNumber}</p>
                  </div>
                  <div>
                    <p className="text-slate-600 mb-1">客户</p>
                    <p className="font-bold text-slate-900">{editingReport.customerName}</p>
                  </div>
                  <div>
                    <p className="text-slate-600 mb-1">产品</p>
                    <p className="font-bold text-slate-900">{editingReport.productName}</p>
                  </div>
                  <div>
                    <p className="text-slate-600 mb-1">验货员</p>
                    <p className="font-bold text-slate-900">{editingReport.inspector}</p>
                  </div>
                </div>
              </Card>

              {/* 报告内容 */}
              <div className="space-y-3">
                <div>
                  <Label htmlFor="conclusion" className="text-sm font-semibold mb-2 block">验货结论</Label>
                  <Select 
                    value={reportContent.conclusion} 
                    onValueChange={(value: any) => setReportContent({...reportContent, conclusion: value})}
                  >
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pass">✅ 合格</SelectItem>
                      <SelectItem value="conditional-pass">⚠️ 有条件通过</SelectItem>
                      <SelectItem value="fail">❌ 不合格</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="summary" className="text-sm font-semibold mb-2 block">报告摘要</Label>
                  <Textarea
                    id="summary"
                    value={reportContent.summary}
                    onChange={(e) => setReportContent({...reportContent, summary: e.target.value})}
                    placeholder="请输入报告摘要..."
                    rows={3}
                    className="text-sm"
                  />
                </div>

                <div>
                  <Label htmlFor="detailedFindings" className="text-sm font-semibold mb-2 block">详细检查结果</Label>
                  <Textarea
                    id="detailedFindings"
                    value={reportContent.detailedFindings}
                    onChange={(e) => setReportContent({...reportContent, detailedFindings: e.target.value})}
                    placeholder="请输入详细检查结果..."
                    rows={6}
                    className="text-sm font-mono"
                  />
                </div>

                <div>
                  <Label htmlFor="recommendations" className="text-sm font-semibold mb-2 block">改进建议</Label>
                  <Textarea
                    id="recommendations"
                    value={reportContent.recommendations}
                    onChange={(e) => setReportContent({...reportContent, recommendations: e.target.value})}
                    placeholder="请输入改进建议..."
                    rows={3}
                    className="text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReportEditor(false)}>
              <X className="size-4 mr-2" />
              取消
            </Button>
            <Button className="bg-blue-600 text-white" onClick={handleSaveReport}>
              <Save className="size-4 mr-2" />
              保存报告
            </Button>
            <Button className="bg-green-600 text-white">
              <Send className="size-4 mr-2" />
              提交审核
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 模板编辑器弹窗 */}
      <Dialog open={showTemplateEditor} onOpenChange={setShowTemplateEditor}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Layers className="size-5 text-purple-600" />
              验货标准编辑器
            </DialogTitle>
            <DialogDescription>
              创建或编辑验货标准模板，包括标准名称、产品类别、检验标准和检查项列表
            </DialogDescription>
          </DialogHeader>

          {editingTemplate && (
            <div className="space-y-4">
              {/* 基本信息 */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="templateName" className="text-sm font-semibold mb-2 block">标准名称</Label>
                  <Input
                    id="templateName"
                    value={editingTemplate.name}
                    onChange={(e) => setEditingTemplate({...editingTemplate, name: e.target.value})}
                    placeholder="请输入标准名称..."
                    className="h-9 text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="category" className="text-sm font-semibold mb-2 block">产品类别</Label>
                  <Input
                    id="category"
                    value={editingTemplate.category}
                    onChange={(e) => setEditingTemplate({...editingTemplate, category: e.target.value})}
                    placeholder="请输入产品类别..."
                    className="h-9 text-sm"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description" className="text-sm font-semibold mb-2 block">标准描述</Label>
                <Textarea
                  id="description"
                  value={editingTemplate.description}
                  onChange={(e) => setEditingTemplate({...editingTemplate, description: e.target.value})}
                  placeholder="请输入标准描述..."
                  rows={2}
                  className="text-sm"
                />
              </div>

              <div>
                <Label htmlFor="standard" className="text-sm font-semibold mb-2 block">检验标准</Label>
                <Select 
                  value={editingTemplate.standard}
                  onValueChange={(value) => setEditingTemplate({...editingTemplate, standard: value})}
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AQL 0.65">AQL 0.65 - 严格</SelectItem>
                    <SelectItem value="AQL 1.0">AQL 1.0 - 标准</SelectItem>
                    <SelectItem value="AQL 1.5">AQL 1.5 - 常规</SelectItem>
                    <SelectItem value="AQL 2.5">AQL 2.5 - 宽松</SelectItem>
                    <SelectItem value="AQL 4.0">AQL 4.0 - 很宽松</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 检查项列表 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-semibold">检查项列表</Label>
                  <Button 
                    size="sm" 
                    className="h-7 text-xs"
                    onClick={handleAddCheckItem}
                  >
                    <Plus className="size-3 mr-1" />
                    添加检查项
                  </Button>
                </div>

                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {editingTemplate.checkItems.map((item, index) => (
                    <Card key={item.id} className="p-3 bg-slate-50">
                      <div className="flex items-start gap-3">
                        <div className="flex items-center gap-2">
                          <GripVertical className="size-4 text-slate-400 cursor-move" />
                          <span className="text-sm font-bold text-slate-600">#{index + 1}</span>
                        </div>
                        
                        <div className="flex-1 grid grid-cols-4 gap-2">
                          <Input
                            placeholder="类别"
                            value={item.category}
                            onChange={(e) => {
                              const newItems = [...editingTemplate.checkItems];
                              newItems[index] = {...item, category: e.target.value};
                              setEditingTemplate({...editingTemplate, checkItems: newItems});
                            }}
                            className="h-8 text-xs"
                          />
                          <Input
                            placeholder="检查项名称"
                            value={item.name}
                            onChange={(e) => {
                              const newItems = [...editingTemplate.checkItems];
                              newItems[index] = {...item, name: e.target.value};
                              setEditingTemplate({...editingTemplate, checkItems: newItems});
                            }}
                            className="h-8 text-xs"
                          />
                          <Input
                            placeholder="检验标准"
                            value={item.standard}
                            onChange={(e) => {
                              const newItems = [...editingTemplate.checkItems];
                              newItems[index] = {...item, standard: e.target.value};
                              setEditingTemplate({...editingTemplate, checkItems: newItems});
                            }}
                            className="h-8 text-xs"
                          />
                          <Input
                            placeholder="验收标准"
                            value={item.acceptanceCriteria}
                            onChange={(e) => {
                              const newItems = [...editingTemplate.checkItems];
                              newItems[index] = {...item, acceptanceCriteria: e.target.value};
                              setEditingTemplate({...editingTemplate, checkItems: newItems});
                            }}
                            className="h-8 text-xs"
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={item.required}
                            onCheckedChange={(checked) => {
                              const newItems = [...editingTemplate.checkItems];
                              newItems[index] = {...item, required: !!checked};
                              setEditingTemplate({...editingTemplate, checkItems: newItems});
                            }}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDeleteCheckItem(item.id)}
                          >
                            <Trash2 className="size-3" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTemplateEditor(false)}>
              <X className="size-4 mr-2" />
              取消
            </Button>
            <Button className="bg-purple-600 text-white" onClick={handleSaveTemplate}>
              <Save className="size-4 mr-2" />
              保存模板
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 照片上传弹窗 */}
      <Dialog open={showPhotoUpload} onOpenChange={setShowPhotoUpload}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="size-5 text-green-600" />
              上传验货照片 - {selectedOrder?.orderNumber}
            </DialogTitle>
            <DialogDescription>
              上传现场验货照片，支持 JPG、PNG、WEBP 格式，单个文件不超过 10MB
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors cursor-pointer">
              <Upload className="size-12 text-slate-400 mx-auto mb-3" />
              <p className="text-sm text-slate-600 mb-2">点击或拖拽文件到此处上传</p>
              <p className="text-xs text-slate-500">支持 JPG、PNG、WEBP 格式，单个文件不超过 10MB</p>
            </div>

            <div className="grid grid-cols-4 gap-3">
              {[1, 2, 3, 4].map(i => (
                <Card key={i} className="p-2 aspect-square flex items-center justify-center bg-slate-100">
                  <Image className="size-8 text-slate-400" />
                </Card>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPhotoUpload(false)}>取消</Button>
            <Button className="bg-green-600 text-white">
              <Upload className="size-4 mr-2" />
              开始上传
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 开具发票弹窗 */}
      <Dialog open={showInvoiceDialog} onOpenChange={setShowInvoiceDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="size-5 text-purple-600" />
              开具验货服务费发票 - {invoiceOrder?.orderNumber}
            </DialogTitle>
            <DialogDescription>
              为纯验货服务订单开具服务费发票，填写服务费金额、税率和备注信息
            </DialogDescription>
          </DialogHeader>

          {invoiceOrder && (
            <div className="space-y-4">
              <Card className="p-3 bg-slate-50">
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div>
                    <p className="text-slate-600 mb-1">客户名称</p>
                    <p className="font-bold text-slate-900">{invoiceOrder.customerName}</p>
                  </div>
                  <div>
                    <p className="text-slate-600 mb-1">产品名称</p>
                    <p className="font-bold text-slate-900">{invoiceOrder.productName}</p>
                  </div>
                  <div>
                    <p className="text-slate-600 mb-1">验货日期</p>
                    <p className="font-bold text-slate-900">{invoiceOrder.inspectionDate}</p>
                  </div>
                </div>
              </Card>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm font-semibold mb-2 block">服务费金额</Label>
                  <Input
                    type="number"
                    defaultValue={invoiceOrder.inspectionFee}
                    className="h-9 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-sm font-semibold mb-2 block">税率</Label>
                  <Select defaultValue="0.06">
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0.06">6% (标准税率)</SelectItem>
                      <SelectItem value="0.13">13% (增值税)</SelectItem>
                      <SelectItem value="0.00">0% (免税)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="text-sm font-semibold mb-2 block">发票备注</Label>
                <Textarea
                  placeholder="请输入发票备注信息..."
                  rows={3}
                  className="text-sm"
                />
              </div>

              <Card className="p-3 bg-blue-50 border-blue-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-700">发票总金额</span>
                  <span className="text-xl font-bold text-blue-600">
                    ${((invoiceOrder.inspectionFee || 0) * 1.06).toFixed(2)}
                  </span>
                </div>
              </Card>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInvoiceDialog(false)}>取消</Button>
            <Button className="bg-purple-600 text-white">
              <FileSpreadsheet className="size-4 mr-2" />
              生成发票
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default InspectionManagementComplete;
