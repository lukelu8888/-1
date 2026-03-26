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
import { toast } from 'sonner@2.0.3';
import { usePurchaseOrders } from '../../contexts/PurchaseOrderContext';
import { useUser } from '../../contexts/UserContext';
import {
  bookingQuoteRequestService,
  containerLoadPlanService,
  customsDeclarationService,
  domesticTransferOrderService,
  exportRequirementCheckService,
  loadingInspectionOrderService,
  loadingTaskService,
  notificationSupabaseService,
  qcInspectionOrderService,
  shipmentDocumentSetService,
  shippingOrderService,
} from '../../lib/supabaseService';

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

const buildQcInspectionNo = () => `QCI-${Date.now()}`;
const buildPreProductionSampleNo = () => `PPS-${Date.now()}`;
const buildTransferNo = () => `DTO-${Date.now()}`;
const buildBookingRequestNo = () => `BQR-${Date.now()}`;
const buildShippingOrderNo = () => `SO-${Date.now()}`;
const buildLoadPlanNo = () => `LP-${Date.now()}`;
const buildLoadingTaskNo = () => `LT-${Date.now()}`;
const buildExportCheckNo = () => `ERC-${Date.now()}`;
const buildDocumentSetNo = () => `DOC-${Date.now()}`;
const buildCommercialInvoiceNo = () => `CI-${Date.now()}`;
const buildPackingListNo = () => `PL-${Date.now()}`;
const buildCustomsDeclNo = () => `CD-${Date.now()}`;

const createEmptyBookingQuoteOption = () => ({
  forwarderName: '',
  carrierName: '',
  vesselName: '',
  etd: '',
  transitDays: '',
  freightAmount: '',
  surchargeAmount: '',
  remarks: '',
});

function ExecutionQcTab() {
  const { user } = useUser();
  const { purchaseOrders, updatePurchaseOrder } = usePurchaseOrders();
  const [keyword, setKeyword] = useState('');
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [resultOpen, setResultOpen] = useState(false);
  const [finishOpen, setFinishOpen] = useState(false);
  const [preSampleOpen, setPreSampleOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [selectedQcOrder, setSelectedQcOrder] = useState<any>(null);
  const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().split('T')[0]);
  const [inspectionLocation, setInspectionLocation] = useState('');
  const [thirdPartyAgencyName, setThirdPartyAgencyName] = useState('');
  const [inspectionExecutionMode, setInspectionExecutionMode] = useState('our_qc');
  const [customerDesignatedInspectionAgency, setCustomerDesignatedInspectionAgency] = useState('');
  const [scheduleRemark, setScheduleRemark] = useState('');
  const [sampleRequired, setSampleRequired] = useState(true);
  const [preProductionSampleNo, setPreProductionSampleNo] = useState(buildPreProductionSampleNo());
  const [sampleRound, setSampleRound] = useState('1');
  const [sampleRemark, setSampleRemark] = useState('');
  const [qcResult, setQcResult] = useState<'pass' | 'pass_with_remark' | 'fail'>('pass');
  const [resultRemark, setResultRemark] = useState('');
  const [shipmentOpen, setShipmentOpen] = useState(false);
  const [financeOpen, setFinanceOpen] = useState(false);
  const [paymentNodeOpen, setPaymentNodeOpen] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [bookingWorkflowOpen, setBookingWorkflowOpen] = useState(false);
  const [loadingOpen, setLoadingOpen] = useState(false);
  const [exportCheckOpen, setExportCheckOpen] = useState(false);
  const [customsPrepOpen, setCustomsPrepOpen] = useState(false);
  const [customerInspectionMode, setCustomerInspectionMode] = useState('our_qc_report_shared');
  const [goodsReadyNoticeRemark, setGoodsReadyNoticeRemark] = useState('');
  const [qcReportSharedToCustomer, setQcReportSharedToCustomer] = useState(true);
  const [fulfillmentMode, setFulfillmentMode] = useState('factory_direct');
  const [collectionControlMode, setCollectionControlMode] = useState('post_tt_before_obl_release');
  const [bookingResponsibility, setBookingResponsibility] = useState('our_company');
  const [freightConfirmationRequired, setFreightConfirmationRequired] = useState(false);
  const [freightConfirmedByCustomer, setFreightConfirmedByCustomer] = useState(false);
  const [bookingRemark, setBookingRemark] = useState('');
  const [destinationPort, setDestinationPort] = useState('');
  const [containerType, setContainerType] = useState('40HQ');
  const [cargoReadyDate, setCargoReadyDate] = useState(new Date().toISOString().split('T')[0]);
  const [quoteDeadlineAt, setQuoteDeadlineAt] = useState('');
  const [bookingQuoteOptions, setBookingQuoteOptions] = useState([
    createEmptyBookingQuoteOption(),
    createEmptyBookingQuoteOption(),
    createEmptyBookingQuoteOption(),
  ]);
  const [selectedQuoteIndex, setSelectedQuoteIndex] = useState('0');
  const [issueShippingOrderNow, setIssueShippingOrderNow] = useState(false);
  const [portFilingRequired, setPortFilingRequired] = useState(false);
  const [shippingOrderRemark, setShippingOrderRemark] = useState('');
  const [loadPlanContainerType, setLoadPlanContainerType] = useState('40HQ');
  const [loadPlanPortOfLoading, setLoadPlanPortOfLoading] = useState('');
  const [loadPlanPortOfDestination, setLoadPlanPortOfDestination] = useState('');
  const [plannedLoadingDate, setPlannedLoadingDate] = useState(new Date().toISOString().split('T')[0]);
  const [loadPointName, setLoadPointName] = useState('');
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [vehicleNo, setVehicleNo] = useState('');
  const [containerNo, setContainerNo] = useState('');
  const [sealNo, setSealNo] = useState('');
  const [loadedQuantity, setLoadedQuantity] = useState('');
  const [loadedPackages, setLoadedPackages] = useState('');
  const [loadingRemark, setLoadingRemark] = useState('');
  const [loadingSupervisionMode, setLoadingSupervisionMode] = useState('internal_only');
  const [loadingSupervisionAgencyName, setLoadingSupervisionAgencyName] = useState('');
  const [hasEmptyContainerPhoto, setHasEmptyContainerPhoto] = useState(false);
  const [hasHalfLoadedPhoto, setHasHalfLoadedPhoto] = useState(false);
  const [hasFullDoorsOpenPhoto, setHasFullDoorsOpenPhoto] = useState(false);
  const [hasLeftDoorOpenPhoto, setHasLeftDoorOpenPhoto] = useState(false);
  const [hasBothDoorsClosedPhoto, setHasBothDoorsClosedPhoto] = useState(false);
  const [destinationCountry, setDestinationCountry] = useState('');
  const [tradeTerm, setTradeTerm] = useState('FOB');
  const [requiresCustomsDeclaration, setRequiresCustomsDeclaration] = useState(true);
  const [requiresInspection, setRequiresInspection] = useState(false);
  const [requiresCo, setRequiresCo] = useState(false);
  const [requiresFumigation, setRequiresFumigation] = useState(false);
  const [requiresLoadingInspectionReport, setRequiresLoadingInspectionReport] = useState(false);
  const [requiresHealthCertificate, setRequiresHealthCertificate] = useState(false);
  const [requiresOtherDocs, setRequiresOtherDocs] = useState(false);
  const [otherDocNotes, setOtherDocNotes] = useState('');
  const [commercialInvoiceNo, setCommercialInvoiceNo] = useState('');
  const [packingListNo, setPackingListNo] = useState('');
  const [customsBrokerName, setCustomsBrokerName] = useState('');
  const [customsDeclNo, setCustomsDeclNo] = useState('');
  const [customsDeclarationDate, setCustomsDeclarationDate] = useState(new Date().toISOString().split('T')[0]);
  const [customsRemark, setCustomsRemark] = useState('');
  const [financeRemark, setFinanceRemark] = useState('');
  const [paymentNodeType, setPaymentNodeType] = useState<'procurement' | 'customer_balance' | 'supplier_balance'>('procurement');
  const [paymentStatusDraft, setPaymentStatusDraft] = useState('partial_paid');
  const [paymentNodeRemark, setPaymentNodeRemark] = useState('');
  const [pickupDate, setPickupDate] = useState(new Date().toISOString().split('T')[0]);
  const [plannedArrivalDate, setPlannedArrivalDate] = useState('');
  const [destinationPartyType, setDestinationPartyType] = useState('third_party_warehouse');
  const [destinationPartyName, setDestinationPartyName] = useState('');
  const [warehouseAddress, setWarehouseAddress] = useState('');
  const [receiverContactName, setReceiverContactName] = useState('');
  const [receiverContactPhone, setReceiverContactPhone] = useState('');
  const [carrierName, setCarrierName] = useState('');
  const [carrierContactName, setCarrierContactName] = useState('');
  const [carrierContactPhone, setCarrierContactPhone] = useState('');
  const [carrierContactEmail, setCarrierContactEmail] = useState('');
  const [freightChargeParty, setFreightChargeParty] = useState('our_company');
  const [freightAdvanceParty, setFreightAdvanceParty] = useState('our_company');
  const [warehouseSettlementParty, setWarehouseSettlementParty] = useState('our_company');
  const [warehouseSettlementAmount, setWarehouseSettlementAmount] = useState('');
  const [shipmentRemark, setShipmentRemark] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const executionOrders = useMemo(() => {
    const visibleStatuses = new Set([
      'supplier_confirmed',
      'pre_production_sample_pending',
      'pre_production_sample_sent',
      'production_in_progress',
      'supplier_self_inspection_submitted',
      'qc_pending',
      'qc_failed',
      'qc_passed',
      'finished_goods_ready',
      'awaiting_loading',
      'loaded',
    ]);
    const normalizedKeyword = keyword.trim().toLowerCase();

    return purchaseOrders.filter((po) => {
      const reqStatus = String(po.procurementRequestStatus || '').trim();
      const executionStatus = String(po.executionStatus || '').trim();
      if (reqStatus !== 'pushed_supplier') return false;
      if (!visibleStatuses.has(executionStatus)) return false;
      if (!normalizedKeyword) return true;

      return (
        String(po.poNumber || '').toLowerCase().includes(normalizedKeyword) ||
        String(po.sourceRef || po.salesContractNumber || '').toLowerCase().includes(normalizedKeyword) ||
        String(po.supplierName || '').toLowerCase().includes(normalizedKeyword) ||
        (po.items || []).some((item) => String(item.productName || '').toLowerCase().includes(normalizedKeyword))
      );
    });
  }, [keyword, purchaseOrders]);

  const getExecutionStatusMeta = (executionStatus?: string) => {
    switch (String(executionStatus || '')) {
      case 'supplier_self_inspection_submitted':
        return { label: '待安排QC', color: 'bg-cyan-50 text-cyan-700 border-cyan-200' };
      case 'supplier_confirmed':
        return { label: '待产前样/生产', color: 'bg-slate-50 text-slate-700 border-slate-200' };
      case 'pre_production_sample_pending':
        return { label: '待寄送产前样', color: 'bg-sky-50 text-sky-700 border-sky-200' };
      case 'pre_production_sample_sent':
        return { label: '待封样确认', color: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'production_in_progress':
        return { label: '生产中', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
      case 'qc_pending':
        return { label: '待提交QC结果', color: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'qc_failed':
        return { label: 'QC不通过', color: 'bg-red-50 text-red-700 border-red-200' };
      case 'qc_passed':
        return { label: 'QC通过', color: 'bg-green-50 text-green-700 border-green-200' };
      case 'finished_goods_ready':
        return { label: '完货待出运', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'awaiting_loading':
        return { label: '待装柜', color: 'bg-orange-50 text-orange-700 border-orange-200' };
      case 'loaded':
        return { label: '已装柜', color: 'bg-violet-50 text-violet-700 border-violet-200' };
      default:
        return { label: '待处理', color: 'bg-gray-50 text-gray-700 border-gray-200' };
    }
  };

  const openShipmentDialog = (order: any) => {
    setSelectedOrder(order);
    setFulfillmentMode('factory_direct');
    setCollectionControlMode('post_tt_before_obl_release');
    setPickupDate(new Date().toISOString().split('T')[0]);
    setPlannedArrivalDate('');
    setDestinationPartyType('third_party_warehouse');
    setDestinationPartyName('');
    setWarehouseAddress('');
    setReceiverContactName('');
    setReceiverContactPhone('');
    setCarrierName('');
    setCarrierContactName('');
    setCarrierContactPhone('');
    setCarrierContactEmail('');
    setFreightChargeParty('our_company');
    setFreightAdvanceParty('our_company');
    setWarehouseSettlementParty('our_company');
    setWarehouseSettlementAmount('');
    setShipmentRemark('');
    setShipmentOpen(true);
  };

  const openPreSampleDialog = (order: any) => {
    setSelectedOrder(order);
    setSampleRequired(Boolean(order.sampleRequired ?? true));
    setPreProductionSampleNo(String(order.preProductionSampleNo || buildPreProductionSampleNo()));
    setSampleRound(String(order.sampleRound || 1));
    setSampleRemark(String(order.executionRemarks || ''));
    setPreSampleOpen(true);
  };

  const openFinishDialog = (order: any) => {
    setSelectedOrder(order);
    setCustomerInspectionMode(String(order.customerInspectionMode || 'our_qc_report_shared'));
    setInspectionExecutionMode(String(order.inspectionExecutionMode || (String(order.customerInspectionMode || '').includes('third_party') ? 'customer_third_party' : 'our_qc')));
    setCustomerDesignatedInspectionAgency(String(order.customerDesignatedInspectionAgency || order.thirdPartyAgencyName || ''));
    setGoodsReadyNoticeRemark(String(order.executionRemarks || ''));
    setQcReportSharedToCustomer(Boolean(order.qcReportSharedToCustomerAt || true));
    setFinishOpen(true);
  };

  const openFinanceDialog = (order: any) => {
    setSelectedOrder(order);
    setFinanceRemark('');
    setFinanceOpen(true);
  };

  const openPaymentNodeDialog = (order: any, type: 'procurement' | 'customer_balance' | 'supplier_balance') => {
    setSelectedOrder(order);
    setPaymentNodeType(type);
    if (type === 'procurement') {
      setPaymentStatusDraft(String(order.supplierBalanceStatus || 'partial_paid'));
    } else if (type === 'customer_balance') {
      setPaymentStatusDraft(String(order.customerBalanceStatus || 'pending'));
    } else {
      setPaymentStatusDraft(String(order.supplierBalanceStatus || 'pending'));
    }
    setPaymentNodeRemark(String(order.executionRemarks || ''));
    setPaymentNodeOpen(true);
  };

  const openBookingDialog = (order: any) => {
    setSelectedOrder(order);
    setBookingResponsibility(String(order.bookingResponsibility || 'our_company'));
    setFreightConfirmationRequired(Boolean(order.freightConfirmationRequired || false));
    setFreightConfirmedByCustomer(Boolean(order.freightConfirmedByCustomerAt));
    setBookingRemark(String(order.executionRemarks || ''));
    setBookingOpen(true);
  };

  const openBookingWorkflowDialog = (order: any) => {
    setSelectedOrder(order);
    setDestinationPort('');
    setContainerType('40HQ');
    setCargoReadyDate(order.finishedGoodsConfirmedAt?.split('T')[0] || new Date().toISOString().split('T')[0]);
    setQuoteDeadlineAt('');
    setBookingQuoteOptions([
      createEmptyBookingQuoteOption(),
      createEmptyBookingQuoteOption(),
      createEmptyBookingQuoteOption(),
    ]);
    setSelectedQuoteIndex('0');
    setIssueShippingOrderNow(false);
    setPortFilingRequired(false);
    setShippingOrderRemark('');
    setBookingWorkflowOpen(true);
  };

  const openLoadingDialog = (order: any) => {
    setSelectedOrder(order);
    setLoadPlanContainerType('40HQ');
    setLoadPlanPortOfLoading('');
    setLoadPlanPortOfDestination('');
    setPlannedLoadingDate(new Date().toISOString().split('T')[0]);
    setLoadPointName(order.supplierName || '');
    setDriverName('');
    setDriverPhone('');
    setVehicleNo('');
    setContainerNo('');
    setSealNo('');
    setLoadedQuantity('');
    setLoadedPackages('');
    setLoadingRemark('');
    setLoadingSupervisionMode(String(order.loadingSupervisionMode || 'internal_only'));
    setLoadingSupervisionAgencyName(String(order.loadingSupervisionAgencyName || ''));
    setHasEmptyContainerPhoto(false);
    setHasHalfLoadedPhoto(false);
    setHasFullDoorsOpenPhoto(false);
    setHasLeftDoorOpenPhoto(false);
    setHasBothDoorsClosedPhoto(false);
    setLoadingOpen(true);
  };

  const openExportCheckDialog = (order: any) => {
    setSelectedOrder(order);
    setDestinationCountry('');
    setTradeTerm(order.deliveryTerms || order.tradeTerms || 'FOB');
    setRequiresCustomsDeclaration(true);
    setRequiresInspection(false);
    setRequiresCo(false);
    setRequiresFumigation(false);
    setRequiresLoadingInspectionReport(false);
    setRequiresHealthCertificate(false);
    setRequiresOtherDocs(false);
    setOtherDocNotes('');
    setExportCheckOpen(true);
  };

  const openCustomsPrepDialog = (order: any) => {
    setSelectedOrder(order);
    setCommercialInvoiceNo(buildCommercialInvoiceNo());
    setPackingListNo(buildPackingListNo());
    setCustomsBrokerName('');
    setCustomsDeclNo(buildCustomsDeclNo());
    setCustomsDeclarationDate(new Date().toISOString().split('T')[0]);
    setCustomsRemark('');
    setCustomsPrepOpen(true);
  };

  const handleConfirmFinishedGoods = async () => {
    if (!selectedOrder) return;
    try {
      await updatePurchaseOrder(selectedOrder.id, {
        executionStatus: 'finished_goods_ready',
        finishedGoodsConfirmedAt: new Date().toISOString(),
        inspectionExecutionMode,
        customerDesignatedInspectionAgency: inspectionExecutionMode === 'customer_third_party'
          ? (customerDesignatedInspectionAgency.trim() || null)
          : null,
        customerDesignatedInspectionStatus: inspectionExecutionMode === 'customer_third_party' ? 'pending' : 'pending',
        customerInspectionMode,
        goodsReadyNotifiedToCustomerAt: new Date().toISOString(),
        inspectionMethodNotifiedAt: new Date().toISOString(),
        qcReportSharedToCustomerAt: customerInspectionMode === 'our_qc_report_shared' && qcReportSharedToCustomer
          ? new Date().toISOString()
          : null,
        shipmentReadinessStatus: 'ready',
        executionRemarks: goodsReadyNoticeRemark.trim() || selectedOrder.executionRemarks,
        updatedDate: new Date().toISOString(),
      } as any);
      const customerEmail = String(selectedOrder.customerEmail || '').trim().toLowerCase();
      if (customerEmail) {
        if (inspectionExecutionMode === 'customer_third_party') {
          await notificationSupabaseService.send({
            recipient_email: customerEmail,
            type: 'customer_third_party_inspection_requested',
            title: '请安排第三方验货',
            message: `${selectedOrder.poNumber} 已完货，请安排客户指定第三方验货${customerDesignatedInspectionAgency.trim() ? `（建议机构：${customerDesignatedInspectionAgency.trim()}）` : ''}。`,
            related_id: selectedOrder.orderNumber || selectedOrder.poNumber || selectedOrder.id,
            related_type: 'order',
            sender: user?.email || user?.name || 'qc-admin',
            metadata: {
              purchaseOrderId: selectedOrder.id,
              inspectionExecutionMode,
              customerDesignatedInspectionAgency: customerDesignatedInspectionAgency.trim() || null,
            },
          });
        } else if (customerInspectionMode === 'our_qc_report_shared' && qcReportSharedToCustomer) {
          await notificationSupabaseService.send({
            recipient_email: customerEmail,
            type: 'inspection_report_shared',
            title: '我方验货报告已共享',
            message: `${selectedOrder.poNumber} 的我方验货结果已准备完成，请在系统中查看验货结果与后续安排。`,
            related_id: selectedOrder.orderNumber || selectedOrder.poNumber || selectedOrder.id,
            related_type: 'order',
            sender: user?.email || user?.name || 'qc-admin',
            metadata: {
              purchaseOrderId: selectedOrder.id,
              inspectionExecutionMode,
            },
          });
        }
      }
      toast.success(`已确认 ${selectedOrder.poNumber} 完货，并完成客户完货/验货方式通知`);
      setFinishOpen(false);
    } catch (error: any) {
      toast.error(`完货确认失败：${error?.message || '未知错误'}`);
    }
  };

  const handlePreparePreProduction = async () => {
    if (!selectedOrder) return;
    try {
      const shouldSample = Boolean(sampleRequired);
      await updatePurchaseOrder(selectedOrder.id, {
        sampleRequired: shouldSample,
        preProductionSampleStatus: shouldSample ? 'pending' : 'not_required',
        preProductionSampleNo: shouldSample ? (preProductionSampleNo.trim() || buildPreProductionSampleNo()) : null,
        sampleRound: shouldSample ? Number(sampleRound || 1) : 1,
        executionStatus: shouldSample ? 'pre_production_sample_pending' : 'production_in_progress',
        productionStartedAt: shouldSample ? null : new Date().toISOString(),
        executionRemarks: sampleRemark.trim() || selectedOrder.executionRemarks,
        updatedDate: new Date().toISOString(),
      } as any);
      toast.success(shouldSample ? '已进入产前样阶段' : '已跳过产前样，进入正式生产');
      setPreSampleOpen(false);
    } catch (error: any) {
      toast.error(`提交产前样/生产准备失败：${error?.message || '未知错误'}`);
    }
  };

  const handleMarkSampleSent = async (order: any) => {
    try {
      await updatePurchaseOrder(order.id, {
        executionStatus: 'pre_production_sample_sent',
        preProductionSampleStatus: 'sent',
        preProductionSampleSentAt: new Date().toISOString(),
        updatedDate: new Date().toISOString(),
      } as any);
      toast.success(`已登记 ${order.poNumber} 产前样已寄送`);
    } catch (error: any) {
      toast.error(`登记产前样寄送失败：${error?.message || '未知错误'}`);
    }
  };

  const handleConfirmSealAndStartProduction = async (order: any) => {
    try {
      const now = new Date().toISOString();
      await updatePurchaseOrder(order.id, {
        executionStatus: 'production_in_progress',
        preProductionSampleStatus: 'approved',
        sampleConfirmedAt: now,
        sealConfirmedAt: now,
        productionStartedAt: now,
        updatedDate: now,
      } as any);
      toast.success(`已完成 ${order.poNumber} 封样确认并进入正式生产`);
    } catch (error: any) {
      toast.error(`封样确认失败：${error?.message || '未知错误'}`);
    }
  };

  const handleMarkSupplierSelfInspectionSubmitted = async (order: any) => {
    try {
      const now = new Date().toISOString();
      await updatePurchaseOrder(order.id, {
        executionStatus: 'supplier_self_inspection_submitted',
        productionCompletedAt: now,
        supplierSelfInspectionStatus: 'submitted',
        updatedDate: now,
      } as any);
      toast.success(`已登记 ${order.poNumber} 供应商自检提交`);
    } catch (error: any) {
      toast.error(`登记供应商自检失败：${error?.message || '未知错误'}`);
    }
  };

  const handlePrepareShipment = async () => {
    if (!selectedOrder) return;

    const consolidationRequired = fulfillmentMode !== 'factory_direct';
    const collectionConfig = (() => {
      switch (collectionControlMode) {
        case 'prepaid_before_booking':
          return {
            documentReleaseMode: 'release_after_full_payment',
            customerBalanceGateStatus: 'pending_before_booking',
            bankSubmissionStatus: 'not_required',
            documentReleaseStatus: 'blocked',
            shipmentReadinessStatus: consolidationRequired ? 'collection_pending_before_transfer' : 'collection_pending_before_booking',
            bookingStatus: 'blocked_by_payment',
          };
        case 'lc_bank_negotiation':
          return {
            documentReleaseMode: 'release_after_bank_negotiation',
            customerBalanceGateStatus: 'pending_lc_issuance',
            bankSubmissionStatus: 'pending_submission',
            documentReleaseStatus: 'blocked',
            shipmentReadinessStatus: consolidationRequired ? 'lc_pending_before_transfer' : 'lc_pending_before_booking',
            bookingStatus: 'ready_to_book',
          };
        case 'dp_or_other_collection':
          return {
            documentReleaseMode: 'release_after_dp_collection',
            customerBalanceGateStatus: 'pending_collection_release',
            bankSubmissionStatus: 'pending_submission',
            documentReleaseStatus: 'blocked',
            shipmentReadinessStatus: consolidationRequired ? 'collection_pending_after_shipment' : 'booking_allowed_collection_controlled',
            bookingStatus: 'ready_to_book',
          };
        case 'post_tt_before_obl_release':
        default:
          return {
            documentReleaseMode: 'release_after_full_payment',
            customerBalanceGateStatus: 'pending_before_obl_release',
            bankSubmissionStatus: 'not_required',
            documentReleaseStatus: 'blocked',
            shipmentReadinessStatus: consolidationRequired ? 'transfer_pending' : 'direct_loading_ready',
            bookingStatus: 'ready_to_book',
          };
      }
    })();

    if (consolidationRequired && !destinationPartyName.trim()) {
      toast.error('拼柜/中转模式下，请填写接收方或中转点');
      return;
    }

    setSubmitting(true);
    try {
      if (consolidationRequired) {
        await domesticTransferOrderService.create({
          transferNo: buildTransferNo(),
          purchaseOrderId: selectedOrder.id,
          sourcePartyType: 'supplier',
          sourcePartyId: selectedOrder.supplierCode || selectedOrder.supplierEmail || selectedOrder.supplierName || null,
          destinationPartyType,
          destinationPartyId: destinationPartyName.trim(),
          warehouseType: destinationPartyType,
          warehouseName: destinationPartyName.trim(),
          warehouseAddress: warehouseAddress.trim() || null,
          receiverContactName: receiverContactName.trim() || null,
          receiverContactPhone: receiverContactPhone.trim() || null,
          carrierName: carrierName.trim() || null,
          carrierContactName: carrierContactName.trim() || null,
          carrierContactPhone: carrierContactPhone.trim() || null,
          carrierContactEmail: carrierContactEmail.trim() || null,
          carrierType: 'domestic_logistics',
          pickupDate,
          plannedArrivalDate: plannedArrivalDate || null,
          freightCurrency: 'CNY',
          freightAmount: 0,
          freightChargeParty,
          freightAdvanceParty,
          freightSettlementParty: freightChargeParty,
          warehouseSettlementParty,
          warehouseSettlementCurrency: 'CNY',
          warehouseSettlementAmount: Number(warehouseSettlementAmount || 0),
          warehouseSettlementStatus: Number(warehouseSettlementAmount || 0) > 0 ? 'confirmed' : 'pending',
          freightPaymentStatus: 'pending',
          status: 'freight_pending',
          remarks: shipmentRemark.trim() || null,
        });
      }

      await updatePurchaseOrder(selectedOrder.id, {
        executionStatus: 'awaiting_loading',
        collectionControlMode,
        documentReleaseMode: collectionConfig.documentReleaseMode,
        customerBalanceGateStatus: collectionConfig.customerBalanceGateStatus,
        bookingStatus: collectionConfig.bookingStatus,
        bankSubmissionStatus: collectionConfig.bankSubmissionStatus,
        documentReleaseStatus: collectionConfig.documentReleaseStatus,
        fulfillmentMode,
        consolidationRequired,
        shipmentReadinessStatus: collectionConfig.shipmentReadinessStatus,
        executionRemarks: shipmentRemark.trim() || undefined,
        updatedDate: new Date().toISOString(),
      } as any);

      toast.success(
        consolidationRequired
          ? `已为 ${selectedOrder.poNumber} 创建国内转运单，并进入待装柜阶段`
          : `已将 ${selectedOrder.poNumber} 标记为直装待装柜`
      );
      setShipmentOpen(false);
    } catch (error: any) {
      toast.error(`出运准备失败：${error?.message || '未知错误'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinanceConfirmReceived = async () => {
    if (!selectedOrder) return;
    if (String(selectedOrder.collectionControlMode || '') !== 'prepaid_before_booking') {
      toast.error('当前阶段的财务确认到款，仅适用于前 T/T 订舱前放行');
      return;
    }

    const nextGateStatus = (() => {
      switch (String(selectedOrder.collectionControlMode || '')) {
        case 'prepaid_before_booking':
          return 'finance_confirmed_before_booking';
        case 'post_tt_before_obl_release':
          return 'finance_confirmed_before_obl_release';
        case 'lc_bank_negotiation':
          return 'finance_confirmed_lc_receipt';
        case 'dp_or_other_collection':
          return 'finance_confirmed_collection_receipt';
        default:
          return 'finance_confirmed';
      }
    })();

    try {
      await updatePurchaseOrder(selectedOrder.id, {
        customerBalanceStatus: 'finance_confirmed',
        customerBalanceGateStatus: nextGateStatus,
        customerBalanceConfirmedAt: new Date().toISOString(),
        customerPaymentReceivedAt: new Date().toISOString(),
        customerPaymentConfirmedAt: new Date().toISOString(),
        financeConfirmedReceivedBy: user?.name || user?.email || 'finance',
        bookingStatus: 'ready_to_book',
        executionRemarks: financeRemark.trim() || selectedOrder.executionRemarks,
        updatedDate: new Date().toISOString(),
      } as any);
      toast.success(`已完成 ${selectedOrder.poNumber} 的财务到款确认`);
      setFinanceOpen(false);
    } catch (error: any) {
      toast.error(`财务确认到款失败：${error?.message || '未知错误'}`);
    }
  };

  const handleSavePaymentNode = async () => {
    if (!selectedOrder) return;
    try {
      const now = new Date().toISOString();
      if (paymentNodeType === 'procurement') {
        await updatePurchaseOrder(selectedOrder.id, {
          supplierBalanceStatus: paymentStatusDraft,
          supplierBalanceConfirmedAt: now,
          supplierBalanceConfirmedBy: user?.name || user?.email || 'finance',
          executionRemarks: paymentNodeRemark.trim() || selectedOrder.executionRemarks,
          updatedDate: now,
        } as any);
        toast.success(`已更新 ${selectedOrder.poNumber} 的采购付款节点`);
      } else if (paymentNodeType === 'customer_balance') {
        const confirmed = ['finance_confirmed', 'paid', 'balance_paid'].includes(paymentStatusDraft);
        await updatePurchaseOrder(selectedOrder.id, {
          customerBalanceStatus: paymentStatusDraft,
          customerBalanceConfirmedAt: confirmed ? now : selectedOrder.customerBalanceConfirmedAt,
          customerPaymentReceivedAt: confirmed ? now : selectedOrder.customerPaymentReceivedAt,
          customerPaymentConfirmedAt: confirmed ? now : selectedOrder.customerPaymentConfirmedAt,
          financeConfirmedReceivedBy: confirmed ? (user?.name || user?.email || 'finance') : selectedOrder.financeConfirmedReceivedBy,
          executionRemarks: paymentNodeRemark.trim() || selectedOrder.executionRemarks,
          updatedDate: now,
        } as any);
        toast.success(`已更新 ${selectedOrder.poNumber} 的客户付款控制点`);
      } else {
        await updatePurchaseOrder(selectedOrder.id, {
          supplierBalanceStatus: paymentStatusDraft,
          supplierBalanceConfirmedAt: now,
          supplierBalanceConfirmedBy: user?.name || user?.email || 'finance',
          executionRemarks: paymentNodeRemark.trim() || selectedOrder.executionRemarks,
          updatedDate: now,
        } as any);
        toast.success(`已更新 ${selectedOrder.poNumber} 的供应商尾款节点`);
      }
      setPaymentNodeOpen(false);
    } catch (error: any) {
      toast.error(error?.message || '保存付款节点失败');
    }
  };

  const handleSaveBookingControl = async () => {
    if (!selectedOrder) return;

    const blockedByPayment = String(selectedOrder.collectionControlMode || '') === 'prepaid_before_booking' && !selectedOrder.customerPaymentConfirmedAt;
    const blockedByFreight = freightConfirmationRequired && !freightConfirmedByCustomer;
    const bookingStatus = blockedByPayment
      ? 'blocked_by_payment'
      : blockedByFreight
        ? 'blocked_by_freight_confirmation'
        : 'ready_to_book';

    try {
      await updatePurchaseOrder(selectedOrder.id, {
        bookingResponsibility,
        freightConfirmationRequired,
        freightConfirmedByCustomerAt: freightConfirmedByCustomer ? new Date().toISOString() : undefined,
        bookingStatus,
        executionRemarks: bookingRemark.trim() || selectedOrder.executionRemarks,
        updatedDate: new Date().toISOString(),
      } as any);
      toast.success(`已保存 ${selectedOrder.poNumber} 的订舱控制设置`);
      setBookingOpen(false);
    } catch (error: any) {
      toast.error(`保存订舱控制失败：${error?.message || '未知错误'}`);
    }
  };

  const updateBookingQuoteOption = (index: number, field: string, value: string) => {
    setBookingQuoteOptions((prev) => prev.map((option, optionIndex) => (
      optionIndex === index
        ? { ...option, [field]: value }
        : option
    )));
  };

  const handleSaveBookingWorkflow = async () => {
    if (!selectedOrder) return;
    if (!destinationPort.trim()) {
      toast.error('请填写目的港');
      return;
    }

    const options = bookingQuoteOptions
      .map((option, index) => ({
        ...option,
        optionRank: index + 1,
      }))
      .filter((option) => option.forwarderName.trim() && option.carrierName.trim());

    if ((selectedOrder.bookingResponsibility || 'our_company') !== 'customer_nominated_forwarder' && options.length === 0) {
      toast.error('请至少录入一条海运询价/比价记录');
      return;
    }

    const selectedOption = options[Number(selectedQuoteIndex)] || null;
    const customerApprovalRequired = Boolean(
      selectedOrder.freightConfirmationRequired || selectedOrder.bookingResponsibility === 'customer_confirmed_freight'
    );
    const customerApproved = Boolean(selectedOrder.freightConfirmedByCustomerAt);

    if (issueShippingOrderNow && customerApprovalRequired && !customerApproved) {
      toast.error('该票需要客户确认海运费和船期后，才能下 Shipping Order');
      return;
    }

    setSubmitting(true);
    try {
      const bookingRequest = await bookingQuoteRequestService.createWithOptions({
        requestNo: buildBookingRequestNo(),
        purchaseOrderId: selectedOrder.id,
        destinationPort: destinationPort.trim(),
        tradeTerm: selectedOrder.deliveryTerms || selectedOrder.tradeTerms || null,
        bookingResponsibility: selectedOrder.bookingResponsibility || bookingResponsibility,
        freightConfirmationRequired: customerApprovalRequired,
        customerConfirmationRequired: customerApprovalRequired,
        customerConfirmedAt: customerApproved ? selectedOrder.freightConfirmedByCustomerAt || new Date().toISOString() : null,
        cargoReadyDate,
        containerType,
        quantitySummary: `${(selectedOrder.items || []).reduce((sum: number, item: any) => sum + Number(item.quantity || 0), 0)} pcs`,
        quoteDeadlineAt: quoteDeadlineAt ? new Date(`${quoteDeadlineAt}T00:00:00`).toISOString() : null,
        selectedOptionId: null,
        status: issueShippingOrderNow ? 'shipping_order_issued' : (customerApprovalRequired && !customerApproved ? 'customer_confirmation_pending' : 'confirmed'),
        remarks: shippingOrderRemark.trim() || null,
        createdBy: user?.name || user?.email || 'booking',
        options: options.map((option, index) => ({
          ...option,
          freightAmount: Number(option.freightAmount || 0),
          surchargeAmount: Number(option.surchargeAmount || 0),
          totalAmount: Number(option.freightAmount || 0) + Number(option.surchargeAmount || 0),
          transitDays: option.transitDays ? Number(option.transitDays) : null,
          isSelected: index === Number(selectedQuoteIndex),
        })),
      });

      const chosenOption = bookingRequest.options?.find((option: any) => option.isSelected) || selectedOption;

      if (issueShippingOrderNow && chosenOption) {
        await shippingOrderService.create({
          shippingOrderNo: buildShippingOrderNo(),
          purchaseOrderId: selectedOrder.id,
          bookingQuoteRequestId: bookingRequest.id,
          selectedQuoteOptionId: chosenOption.id,
          forwarderName: chosenOption.forwarderName,
          carrierName: chosenOption.carrierName,
          vesselName: chosenOption.vesselName || null,
          destinationPort: destinationPort.trim(),
          plannedEtd: chosenOption.etd || null,
          portFilingRequired,
          portFilingStatus: portFilingRequired ? 'pending' : 'not_required',
          shippingOrderStatus: 'issued_to_forwarder',
          issuedAt: new Date().toISOString(),
          remarks: shippingOrderRemark.trim() || null,
          createdBy: user?.name || user?.email || 'booking',
        });
      }

      await updatePurchaseOrder(selectedOrder.id, {
        freightInquiryStatus: issueShippingOrderNow
          ? 'shipping_order_issued'
          : customerApprovalRequired && !customerApproved
            ? 'customer_confirmation_pending'
            : 'confirmed',
        selectedBookingQuoteId: chosenOption?.id || null,
        shippingOrderStatus: issueShippingOrderNow
          ? (portFilingRequired ? 'port_filing_pending' : 'issued_to_forwarder')
          : 'pending',
        bookingStatus: issueShippingOrderNow
          ? 'booked'
          : selectedOrder.bookingStatus || 'ready_to_book',
        updatedDate: new Date().toISOString(),
      } as any);

      toast.success(
        issueShippingOrderNow
          ? `已保存 ${selectedOrder.poNumber} 的订舱比价，并下发 Shipping Order`
          : `已保存 ${selectedOrder.poNumber} 的订舱询价/比价记录`
      );
      setBookingWorkflowOpen(false);
    } catch (error: any) {
      toast.error(`保存订舱询价/Shipping Order 失败：${error?.message || '未知错误'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateLoadPlanAndLoadingTask = async () => {
    if (!selectedOrder) return;
    if (!containerNo.trim()) {
      toast.error('请填写柜号');
      return;
    }
    if (!loadPointName.trim()) {
      toast.error('请填写装柜地点');
      return;
    }

    setSubmitting(true);
    try {
      const shipmentNo = selectedOrder.cgNumber || selectedOrder.poNumber || `SHIP-${Date.now()}`;
      const loadPlan = await containerLoadPlanService.create({
        loadPlanNo: buildLoadPlanNo(),
        shipmentNo,
        status: 'loading_in_progress',
        containerType: loadPlanContainerType,
        containerCount: 1,
        loadingMode: selectedOrder.fulfillmentMode === 'factory_direct' ? 'single_point_loading' : 'multi_stop_loading',
        consolidationMode: selectedOrder.fulfillmentMode || null,
        portOfLoading: loadPlanPortOfLoading.trim() || null,
        portOfDestination: loadPlanPortOfDestination.trim() || null,
        plannedLoadingDate,
        sealRequired: true,
        finalSealNo: sealNo.trim() || null,
        remarks: loadingRemark.trim() || null,
      });

      const loadingTask = await loadingTaskService.create({
        loadingTaskNo: buildLoadingTaskNo(),
        loadPlanId: loadPlan.id,
        sequenceNo: 1,
        taskStatus: 'completed',
        loadingPointType: selectedOrder.fulfillmentMode === 'factory_direct' ? 'factory' : 'consolidation_point',
        loadingPointName: loadPointName.trim(),
        containerNo: containerNo.trim(),
        sealStatus: sealNo.trim() ? 'sealed_final' : 'not_sealed',
        sealNo: sealNo.trim() || null,
        driverName: driverName.trim() || null,
        driverPhone: driverPhone.trim() || null,
        vehicleNo: vehicleNo.trim() || null,
        supervisorName: user?.name || user?.email || 'supervisor',
        actualArrivalAt: new Date().toISOString(),
        loadingStartAt: new Date().toISOString(),
        loadingFinishAt: new Date().toISOString(),
        loadedPackages: Number(loadedPackages || 0),
        loadedQuantity: Number(loadedQuantity || 0),
        containerConditionOk: hasEmptyContainerPhoto,
        containerCleanOk: hasEmptyContainerPhoto,
        containerDryOk: hasEmptyContainerPhoto,
        odorCheckOk: hasEmptyContainerPhoto,
        doorLockOk: hasBothDoorsClosedPhoto,
        floorCheckOk: hasEmptyContainerPhoto,
        emptyContainerPhotos: hasEmptyContainerPhoto ? ['recorded'] : [],
        halfLoadedInnerPhotos: hasHalfLoadedPhoto ? ['recorded'] : [],
        fullLoadedBothDoorsOpenPhotos: hasFullDoorsOpenPhoto ? ['recorded'] : [],
        leftDoorOpenPhotos: hasLeftDoorOpenPhoto ? ['recorded'] : [],
        bothDoorsClosedPhotos: hasBothDoorsClosedPhoto ? ['recorded'] : [],
        remarks: loadingRemark.trim() || null,
      });

      if (loadingSupervisionMode === 'third_party_witness') {
        await loadingInspectionOrderService.create({
          inspectionOrderNo: `LIO-${Date.now()}`,
          loadPlanId: loadPlan.id,
          loadingTaskId: loadingTask.id,
          agencyName: loadingSupervisionAgencyName.trim() || null,
          agencyType: 'third_party_loading_inspection',
          scheduledAt: new Date().toISOString(),
          inspectionStatus: 'confirmed',
          inspectionResult: 'pending',
          witnessContainerNo: containerNo.trim(),
          witnessSealNo: sealNo.trim() || null,
          remarks: loadingRemark.trim() || null,
        });
      }

      await updatePurchaseOrder(selectedOrder.id, {
        executionStatus: 'loaded',
        loadingSupervisionMode,
        loadingSupervisionAgencyName: loadingSupervisionMode === 'third_party_witness'
          ? (loadingSupervisionAgencyName.trim() || null)
          : null,
        loadingSupervisionRequired: loadingSupervisionMode === 'third_party_witness',
        loadingSupervisionFeedbackStatus: loadingSupervisionMode === 'third_party_witness' ? 'pending' : 'pending',
        shipmentReadinessStatus: 'loaded_ready_for_export_check',
        executionRemarks: loadingRemark.trim() || selectedOrder.executionRemarks,
        updatedDate: new Date().toISOString(),
      } as any);

      const customerEmail = String(selectedOrder.customerEmail || '').trim().toLowerCase();
      if (customerEmail && loadingSupervisionMode === 'third_party_witness') {
        await notificationSupabaseService.send({
          recipient_email: customerEmail,
          type: 'loading_third_party_supervision_requested',
          title: '请安排第三方监装',
          message: `${selectedOrder.poNumber} 已进入装柜阶段，请安排第三方监装${loadingSupervisionAgencyName.trim() ? `（建议机构：${loadingSupervisionAgencyName.trim()}）` : ''}。`,
          related_id: selectedOrder.orderNumber || selectedOrder.poNumber || selectedOrder.id,
          related_type: 'order',
          sender: user?.email || user?.name || 'warehouse-loading',
          metadata: {
            purchaseOrderId: selectedOrder.id,
            loadingSupervisionMode,
            loadingSupervisionAgencyName: loadingSupervisionAgencyName.trim() || null,
          },
        });
      }

      toast.success(`已完成 ${selectedOrder.poNumber} 的装柜计划与装柜执行记录`);
      setLoadingOpen(false);
    } catch (error: any) {
      toast.error(`保存装柜计划失败：${error?.message || '未知错误'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveExportRequirementCheck = async () => {
    if (!selectedOrder) return;

    setSubmitting(true);
    try {
      const docsPending = requiresInspection || requiresCo || requiresFumigation || requiresLoadingInspectionReport || requiresHealthCertificate || requiresOtherDocs;
      await exportRequirementCheckService.upsertByPurchaseOrderId(selectedOrder.id, {
        checkNo: buildExportCheckNo(),
        shipmentNo: selectedOrder.cgNumber || selectedOrder.poNumber || null,
        destinationCountry: destinationCountry.trim() || null,
        tradeTerm,
        customerId: selectedOrder.customerId || selectedOrder.customerEmail || selectedOrder.customerName || null,
        requiresCustomsDeclaration,
        requiresInspection,
        requiresCo,
        requiresFumigation,
        requiresLoadingInspectionReport,
        requiresHealthCertificate,
        requiresOtherDocs,
        otherDocNotes: otherDocNotes.trim() || null,
        checkedBy: user?.name || user?.email || 'document',
        checkedAt: new Date().toISOString(),
        status: docsPending ? 'documents_pending' : 'ready_for_customs',
      });

      await updatePurchaseOrder(selectedOrder.id, {
        shipmentReadinessStatus: docsPending ? 'documents_pending_before_customs' : 'ready_for_customs',
        executionRemarks: otherDocNotes.trim() || selectedOrder.executionRemarks,
        updatedDate: new Date().toISOString(),
      } as any);

      toast.success(
        docsPending
          ? `已完成 ${selectedOrder.poNumber} 的出口要求判定，进入报关前单证准备`
          : `已完成 ${selectedOrder.poNumber} 的出口要求判定，可进入报关资料阶段`
      );
      setExportCheckOpen(false);
    } catch (error: any) {
      toast.error(`保存出口要求判定失败：${error?.message || '未知错误'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveCustomsPreparation = async () => {
    if (!selectedOrder) return;
    if (!commercialInvoiceNo.trim() || !packingListNo.trim()) {
      toast.error('请先填写 CI 和 PL 单号');
      return;
    }

    setSubmitting(true);
    try {
      await shipmentDocumentSetService.upsertByPurchaseOrderId(selectedOrder.id, {
        documentSetNo: buildDocumentSetNo(),
        commercialInvoiceNo: commercialInvoiceNo.trim(),
        packingListNo: packingListNo.trim(),
        ciStatus: 'prepared',
        plStatus: 'prepared',
        docsReadyAt: new Date().toISOString(),
        preparedBy: user?.name || user?.email || 'document',
        remarks: customsRemark.trim() || null,
      });

      if (customsBrokerName.trim()) {
        await customsDeclarationService.upsertByPurchaseOrderId(selectedOrder.id, {
          customsDeclNo: customsDeclNo.trim(),
          brokerName: customsBrokerName.trim(),
          declarationDate: customsDeclarationDate,
          declarationStatus: 'submitted',
          remarks: customsRemark.trim() || null,
          createdBy: user?.name || user?.email || 'customs',
        });
      }

      await updatePurchaseOrder(selectedOrder.id, {
        executionStatus: 'loaded',
        shipmentReadinessStatus: 'customs_submitted',
        executionRemarks: customsRemark.trim() || selectedOrder.executionRemarks,
        updatedDate: new Date().toISOString(),
      } as any);

      toast.success(`已完成 ${selectedOrder.poNumber} 的 CI/PL 与报关申报记录`);
      setCustomsPrepOpen(false);
    } catch (error: any) {
      toast.error(`保存报关资料失败：${error?.message || '未知错误'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const openScheduleDialog = (order: any) => {
    setSelectedOrder(order);
    setScheduledDate(new Date().toISOString().split('T')[0]);
    setInspectionLocation(String(order.supplierAddress || order.supplierName || ''));
    setThirdPartyAgencyName('');
    setScheduleRemark('');
    setScheduleOpen(true);
  };

  const openResultDialog = async (order: any) => {
    setSelectedOrder(order);
    setQcResult('pass');
    setResultRemark('');
    setSelectedQcOrder(null);
    try {
      const inspectionOrders = await qcInspectionOrderService.getByPurchaseOrderId(order.id);
      const latestOrder = inspectionOrders[0] || null;
      setSelectedQcOrder(latestOrder);
      setScheduledDate(String(latestOrder?.scheduledDate || new Date().toISOString().split('T')[0]));
      setInspectionLocation(String(latestOrder?.inspectionLocation || order.supplierAddress || order.supplierName || ''));
      setThirdPartyAgencyName(String(latestOrder?.thirdPartyAgencyName || ''));
      setResultOpen(true);
    } catch (error: any) {
      toast.error(`读取QC验货单失败：${error?.message || '未知错误'}`);
    }
  };

  const handleScheduleQc = async () => {
    if (!selectedOrder) return;
    if (!scheduledDate) {
      toast.error('请填写验货日期');
      return;
    }

    setSubmitting(true);
    try {
      await qcInspectionOrderService.create({
        purchaseOrderId: selectedOrder.id,
        inspectionNo: buildQcInspectionNo(),
        inspectionType: inspectionExecutionMode === 'customer_third_party' ? 'customer_third_party' : 'pre_shipment',
        scheduledDate,
        inspectorId: user?.id || user?.email || null,
        inspectorName: user?.name || user?.email || 'QC',
        status: 'scheduled',
        result: 'pending',
        factoryName: selectedOrder.supplierName || null,
        inspectionLocation: inspectionLocation.trim() || selectedOrder.supplierName || null,
        thirdPartyAgencyName: thirdPartyAgencyName.trim() || null,
        remarks: scheduleRemark.trim() || null,
      });

      await updatePurchaseOrder(selectedOrder.id, {
        executionStatus: 'qc_pending',
        qcInspectionStatus: 'scheduled',
        inspectionExecutionMode,
        customerDesignatedInspectionAgency: inspectionExecutionMode === 'customer_third_party'
          ? (customerDesignatedInspectionAgency.trim() || thirdPartyAgencyName.trim() || null)
          : null,
        customerDesignatedInspectionStatus: inspectionExecutionMode === 'customer_third_party' ? 'scheduled' : 'pending',
        updatedDate: new Date().toISOString(),
      } as any);

      toast.success(
        inspectionExecutionMode === 'customer_third_party'
          ? `已记录 ${selectedOrder.poNumber} 的客户第三方验货安排`
          : `已安排 ${selectedOrder.poNumber} 的 QC 验货`
      );
      setScheduleOpen(false);
    } catch (error: any) {
      toast.error(`安排QC验货失败：${error?.message || '未知错误'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitQcResult = async () => {
    if (!selectedOrder) return;

    setSubmitting(true);
    try {
      if (selectedQcOrder?.id) {
        await qcInspectionOrderService.update(selectedQcOrder.id, {
          status: 'completed',
          result: qcResult,
          remarks: resultRemark.trim() || null,
          inspectorId: selectedQcOrder.inspectorId || user?.id || user?.email || null,
          inspectorName: selectedQcOrder.inspectorName || user?.name || user?.email || 'QC',
          scheduledDate,
          inspectionLocation: inspectionLocation.trim() || null,
          thirdPartyAgencyName: thirdPartyAgencyName.trim() || null,
          reportFiles: selectedQcOrder.reportFiles || [],
          photos: selectedQcOrder.photos || [],
        });
      } else {
        await qcInspectionOrderService.create({
          purchaseOrderId: selectedOrder.id,
          inspectionNo: buildQcInspectionNo(),
          scheduledDate,
          inspectorId: user?.id || user?.email || null,
          inspectorName: user?.name || user?.email || 'QC',
          status: 'completed',
          result: qcResult,
          factoryName: selectedOrder.supplierName || null,
          inspectionLocation: inspectionLocation.trim() || selectedOrder.supplierName || null,
          thirdPartyAgencyName: thirdPartyAgencyName.trim() || null,
          remarks: resultRemark.trim() || null,
        });
      }

      await updatePurchaseOrder(selectedOrder.id, {
        executionStatus: qcResult === 'fail' ? 'qc_failed' : 'qc_passed',
        qcInspectionStatus: qcResult === 'fail' ? 'failed' : 'passed',
        customerDesignatedInspectionStatus: inspectionExecutionMode === 'customer_third_party' ? 'reported' : undefined,
        updatedDate: new Date().toISOString(),
      } as any);

      toast.success(`已提交 ${selectedOrder.poNumber} 的 QC 结果`);
      setResultOpen(false);
    } catch (error: any) {
      toast.error(`提交QC结果失败：${error?.message || '未知错误'}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-3 mt-3">
      <div className="grid grid-cols-1 md:grid-cols-10 gap-3">
        <Card className="p-3 border-slate-300 bg-white">
          <p className="text-xs text-slate-500 mb-1">待产前样/生产</p>
          <p className="text-xl font-bold text-slate-900">
            {executionOrders.filter((po) => String(po.executionStatus || '') === 'supplier_confirmed').length}
          </p>
        </Card>
        <Card className="p-3 border-sky-300 bg-white">
          <p className="text-xs text-slate-500 mb-1">待寄送产前样</p>
          <p className="text-xl font-bold text-slate-900">
            {executionOrders.filter((po) => String(po.executionStatus || '') === 'pre_production_sample_pending').length}
          </p>
        </Card>
        <Card className="p-3 border-blue-300 bg-white">
          <p className="text-xs text-slate-500 mb-1">待封样确认</p>
          <p className="text-xl font-bold text-slate-900">
            {executionOrders.filter((po) => String(po.executionStatus || '') === 'pre_production_sample_sent').length}
          </p>
        </Card>
        <Card className="p-3 border-indigo-300 bg-white">
          <p className="text-xs text-slate-500 mb-1">生产中</p>
          <p className="text-xl font-bold text-slate-900">
            {executionOrders.filter((po) => String(po.executionStatus || '') === 'production_in_progress').length}
          </p>
        </Card>
        <Card className="p-3 border-cyan-300 bg-white">
          <p className="text-xs text-slate-500 mb-1">待安排QC</p>
          <p className="text-xl font-bold text-slate-900">
            {executionOrders.filter((po) => String(po.executionStatus || '') === 'supplier_self_inspection_submitted').length}
          </p>
        </Card>
        <Card className="p-3 border-amber-300 bg-white">
          <p className="text-xs text-slate-500 mb-1">待提交QC结果</p>
          <p className="text-xl font-bold text-slate-900">
            {executionOrders.filter((po) => String(po.executionStatus || '') === 'qc_pending').length}
          </p>
        </Card>
        <Card className="p-3 border-green-300 bg-white">
          <p className="text-xs text-slate-500 mb-1">QC通过</p>
          <p className="text-xl font-bold text-slate-900">
            {executionOrders.filter((po) => String(po.executionStatus || '') === 'qc_passed').length}
          </p>
        </Card>
        <Card className="p-3 border-emerald-300 bg-white">
          <p className="text-xs text-slate-500 mb-1">完货待出运</p>
          <p className="text-xl font-bold text-slate-900">
            {executionOrders.filter((po) => String(po.executionStatus || '') === 'finished_goods_ready').length}
          </p>
        </Card>
        <Card className="p-3 border-orange-300 bg-white">
          <p className="text-xs text-slate-500 mb-1">待装柜</p>
          <p className="text-xl font-bold text-slate-900">
            {executionOrders.filter((po) => String(po.executionStatus || '') === 'awaiting_loading').length}
          </p>
        </Card>
        <Card className="p-3 border-violet-300 bg-white">
          <p className="text-xs text-slate-500 mb-1">已装柜</p>
          <p className="text-xl font-bold text-slate-900">
            {executionOrders.filter((po) => String(po.executionStatus || '') === 'loaded').length}
          </p>
        </Card>
        <Card className="p-3 border-red-300 bg-white">
          <p className="text-xs text-slate-500 mb-1">QC不通过</p>
          <p className="text-xl font-bold text-slate-900">
            {executionOrders.filter((po) => String(po.executionStatus || '') === 'qc_failed').length}
          </p>
        </Card>
      </div>

      <Card className="p-3 border-slate-300 bg-white">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">后段QC执行</h3>
            <p className="text-xs text-slate-500 mt-1">主线A：供应商自检提交后，由我方QC安排验货并提交结果。</p>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
            <Input
              placeholder="搜索采购单、来源单、供应商、产品..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="pl-8 h-8 text-xs w-72"
            />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>采购单号</TableHead>
              <TableHead>来源单号</TableHead>
              <TableHead>供应商</TableHead>
              <TableHead>产品</TableHead>
              <TableHead>数量</TableHead>
              <TableHead>当前状态</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {executionOrders.map((order) => {
              const status = getExecutionStatusMeta(order.executionStatus);
              return (
                <TableRow key={order.id}>
                  <TableCell className="font-medium text-blue-600">{order.poNumber}</TableCell>
                  <TableCell>{order.sourceRef || order.salesContractNumber || '-'}</TableCell>
                  <TableCell>{order.supplierName || '-'}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {(order.items || []).slice(0, 2).map((item: any) => (
                        <div key={item.id || item.productName} className="text-xs text-slate-900">
                          {item.productName}
                        </div>
                      ))}
                      {(order.items || []).length > 2 && (
                        <div className="text-xs text-slate-500">另有 {(order.items || []).length - 2} 个产品</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {(order.items || []).reduce((sum: number, item: any) => sum + Number(item.quantity || 0), 0).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge className={`text-xs border ${status.color}`}>{status.label}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {String(order.executionStatus || '') === 'supplier_self_inspection_submitted' && (
                        <Button className="h-8 text-xs bg-cyan-600 hover:bg-cyan-700" onClick={() => openScheduleDialog(order)}>
                          安排QC
                        </Button>
                      )}
                      {String(order.executionStatus || '') === 'supplier_confirmed' && (
                        <Button className="h-8 text-xs bg-slate-700 hover:bg-slate-800" onClick={() => openPreSampleDialog(order)}>
                          产前样 / 生产
                        </Button>
                      )}
                      {['supplier_confirmed', 'pre_production_sample_pending', 'pre_production_sample_sent', 'production_in_progress', 'supplier_self_inspection_submitted'].includes(String(order.executionStatus || '')) && (
                        <Button className="h-8 text-xs bg-amber-700 hover:bg-amber-800" onClick={() => openPaymentNodeDialog(order, 'procurement')}>
                          采购付款
                        </Button>
                      )}
                      {String(order.executionStatus || '') === 'pre_production_sample_pending' && (
                        <Button className="h-8 text-xs bg-sky-600 hover:bg-sky-700" onClick={() => handleMarkSampleSent(order)}>
                          登记样品已寄送
                        </Button>
                      )}
                      {String(order.executionStatus || '') === 'pre_production_sample_sent' && (
                        <Button className="h-8 text-xs bg-blue-600 hover:bg-blue-700" onClick={() => handleConfirmSealAndStartProduction(order)}>
                          确认封样
                        </Button>
                      )}
                      {String(order.executionStatus || '') === 'production_in_progress' && (
                        <Button className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700" onClick={() => handleMarkSupplierSelfInspectionSubmitted(order)}>
                          登记供应商自检
                        </Button>
                      )}
                      {(String(order.executionStatus || '') === 'qc_pending' || String(order.executionStatus || '') === 'qc_failed') && (
                        <Button className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700" onClick={() => openResultDialog(order)}>
                          提交QC结果
                        </Button>
                      )}
                      {String(order.executionStatus || '') === 'qc_passed' && (
                        <>
                          <Button className="h-8 text-xs bg-blue-600 hover:bg-blue-700" onClick={() => openFinishDialog(order)}>
                            确认完货
                          </Button>
                          <Button className="h-8 text-xs bg-rose-600 hover:bg-rose-700" onClick={() => openPaymentNodeDialog(order, 'customer_balance')}>
                            客户付款控制
                          </Button>
                        </>
                      )}
                      {String(order.executionStatus || '') === 'finished_goods_ready' && (
                        <>
                          <Button className="h-8 text-xs bg-orange-600 hover:bg-orange-700" onClick={() => openShipmentDialog(order)}>
                            出运准备
                          </Button>
                          <Button className="h-8 text-xs bg-rose-600 hover:bg-rose-700" onClick={() => openPaymentNodeDialog(order, 'customer_balance')}>
                            客户付款控制
                          </Button>
                          <Button className="h-8 text-xs bg-emerald-700 hover:bg-emerald-800" onClick={() => openPaymentNodeDialog(order, 'supplier_balance')}>
                            供应商尾款
                          </Button>
                        </>
                      )}
                      {String(order.executionStatus || '') === 'awaiting_loading' && (
                        <>
                          {String(order.collectionControlMode || '') === 'prepaid_before_booking' && (
                            <Button className="h-8 text-xs bg-slate-700 hover:bg-slate-800" onClick={() => openFinanceDialog(order)}>
                              财务确认到款
                            </Button>
                          )}
                          <Button className="h-8 text-xs bg-rose-600 hover:bg-rose-700" onClick={() => openPaymentNodeDialog(order, 'customer_balance')}>
                            客户付款控制
                          </Button>
                          <Button className="h-8 text-xs bg-emerald-700 hover:bg-emerald-800" onClick={() => openPaymentNodeDialog(order, 'supplier_balance')}>
                            供应商尾款
                          </Button>
                          <Button className="h-8 text-xs bg-purple-600 hover:bg-purple-700" onClick={() => openBookingDialog(order)}>
                            订舱控制
                          </Button>
                          <Button className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700" onClick={() => openBookingWorkflowDialog(order)}>
                            订舱询价 / SO
                          </Button>
                          <Button className="h-8 text-xs bg-violet-600 hover:bg-violet-700" onClick={() => openLoadingDialog(order)}>
                            装柜计划 / 执行
                          </Button>
                        </>
                      )}
                      {String(order.executionStatus || '') === 'loaded' && (
                        <>
                          <Button className="h-8 text-xs bg-rose-600 hover:bg-rose-700" onClick={() => openPaymentNodeDialog(order, 'customer_balance')}>
                            客户付款控制
                          </Button>
                          <Button className="h-8 text-xs bg-emerald-700 hover:bg-emerald-800" onClick={() => openPaymentNodeDialog(order, 'supplier_balance')}>
                            供应商尾款
                          </Button>
                          <Button className="h-8 text-xs bg-sky-600 hover:bg-sky-700" onClick={() => openExportCheckDialog(order)}>
                            出口要求判定
                          </Button>
                          <Button className="h-8 text-xs bg-teal-600 hover:bg-teal-700" onClick={() => openCustomsPrepDialog(order)}>
                            CI / PL / 报关
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {executionOrders.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-sm text-slate-500">
                  当前没有需要处理的后段 QC 单据。
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={finishOpen} onOpenChange={setFinishOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>完货确认与客户通知</DialogTitle>
            <DialogDescription>在 QC 通过后，显式记录验货方式分支：我方 QC 或客户指定第三方验货，并记录完货通知。</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>采购单号</Label>
              <Input value={selectedOrder?.poNumber || ''} disabled />
            </div>
            <div>
              <Label>验货执行方式</Label>
              <Select value={inspectionExecutionMode} onValueChange={setInspectionExecutionMode}>
                <SelectTrigger>
                  <SelectValue placeholder="选择验货执行方式" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="our_qc">我方 QC 验货</SelectItem>
                  <SelectItem value="customer_third_party">客户指定第三方验货</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {inspectionExecutionMode === 'customer_third_party' && (
              <div>
                <Label>客户指定第三方机构</Label>
                <Input
                  value={customerDesignatedInspectionAgency}
                  onChange={(e) => setCustomerDesignatedInspectionAgency(e.target.value)}
                  placeholder="例如 BV / SGS / Intertek"
                />
              </div>
            )}
            <div>
              <Label>客户验货方式</Label>
              <Select value={customerInspectionMode} onValueChange={setCustomerInspectionMode}>
                <SelectTrigger>
                  <SelectValue placeholder="选择客户验货方式" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="our_qc_report_shared">我方 QC 验货并通过 ERP 流转报告</SelectItem>
                  <SelectItem value="customer_self_inspection">客户自行验货</SelectItem>
                  <SelectItem value="customer_third_party_inspection">客户自行安排第三方验货</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {customerInspectionMode === 'our_qc_report_shared' && (
              <div className="flex items-center gap-2">
                <Checkbox checked={qcReportSharedToCustomer} onCheckedChange={(checked) => setQcReportSharedToCustomer(Boolean(checked))} />
                <Label>我方 QC 报告已通过 ERP 提供给客户</Label>
              </div>
            )}
            <div>
              <Label>通知备注</Label>
              <Textarea value={goodsReadyNoticeRemark} onChange={(e) => setGoodsReadyNoticeRemark(e.target.value)} placeholder="填写完货通知、客户验货方式、后续付款或订舱参考说明" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFinishOpen(false)}>取消</Button>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleConfirmFinishedGoods}>
              确认完货并通知客户
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={preSampleOpen} onOpenChange={setPreSampleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>产前样 / 封样前置</DialogTitle>
            <DialogDescription>显式记录主线A中产前样、封样确认、正式生产这三个前置节点；如无样品要求，也在这里明确进入正式生产。</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>采购单号</Label>
              <Input value={selectedOrder?.poNumber || ''} disabled />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox checked={sampleRequired} onCheckedChange={(checked) => setSampleRequired(Boolean(checked))} />
              <Label>此单需要产前样 / 封样确认</Label>
            </div>
            {sampleRequired && (
              <>
                <div>
                  <Label>产前样编号</Label>
                  <Input value={preProductionSampleNo} onChange={(e) => setPreProductionSampleNo(e.target.value)} placeholder="PPS-..." />
                </div>
                <div>
                  <Label>样品轮次</Label>
                  <Input value={sampleRound} onChange={(e) => setSampleRound(e.target.value)} placeholder="1" />
                </div>
              </>
            )}
            <div>
              <Label>备注</Label>
              <Textarea value={sampleRemark} onChange={(e) => setSampleRemark(e.target.value)} placeholder="填写打样要求、封样说明或无需样品的原因" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreSampleOpen(false)}>取消</Button>
            <Button className="bg-slate-700 hover:bg-slate-800" onClick={handlePreparePreProduction}>
              {sampleRequired ? '进入产前样阶段' : '直接进入正式生产'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>安排QC验货</DialogTitle>
            <DialogDescription>显式记录验货方式：我方 QC 验货，或客户指定第三方验货。</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>采购单号</Label>
              <Input value={selectedOrder?.poNumber || ''} disabled />
            </div>
            <div>
              <Label>验货执行方式</Label>
              <Select value={inspectionExecutionMode} onValueChange={setInspectionExecutionMode}>
                <SelectTrigger>
                  <SelectValue placeholder="选择验货执行方式" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="our_qc">我方 QC 验货</SelectItem>
                  <SelectItem value="customer_third_party">客户指定第三方验货</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>验货日期</Label>
              <Input type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} />
            </div>
            <div>
              <Label>验货地点</Label>
              <Input value={inspectionLocation} onChange={(e) => setInspectionLocation(e.target.value)} placeholder="工厂或验货地点" />
            </div>
            <div>
              <Label>第三方机构（如需）</Label>
              <Input value={thirdPartyAgencyName} onChange={(e) => setThirdPartyAgencyName(e.target.value)} placeholder="例如 BV / SGS" />
            </div>
            {inspectionExecutionMode === 'customer_third_party' && (
              <div>
                <Label>客户指定第三方机构</Label>
                <Input
                  value={customerDesignatedInspectionAgency}
                  onChange={(e) => setCustomerDesignatedInspectionAgency(e.target.value)}
                  placeholder="例如 BV / SGS / Intertek"
                />
              </div>
            )}
            <div>
              <Label>备注</Label>
              <Textarea value={scheduleRemark} onChange={(e) => setScheduleRemark(e.target.value)} placeholder="填写验货安排说明" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScheduleOpen(false)}>取消</Button>
            <Button className="bg-cyan-600 hover:bg-cyan-700" onClick={handleScheduleQc} disabled={submitting}>
              确认安排
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={resultOpen} onOpenChange={setResultOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>提交QC结果</DialogTitle>
            <DialogDescription>将后段蓝图主线A从 QC 验货推进到 QC通过或QC不通过。</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>采购单号</Label>
              <Input value={selectedOrder?.poNumber || ''} disabled />
            </div>
            <div>
              <Label>验货结果</Label>
              <Select value={qcResult} onValueChange={(value) => setQcResult(value as 'pass' | 'pass_with_remark' | 'fail')}>
                <SelectTrigger>
                  <SelectValue placeholder="选择验货结果" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pass">通过</SelectItem>
                  <SelectItem value="pass_with_remark">有条件通过</SelectItem>
                  <SelectItem value="fail">不通过</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>结果说明</Label>
              <Textarea value={resultRemark} onChange={(e) => setResultRemark(e.target.value)} placeholder="填写QC结论、缺陷说明或整改要求" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResultOpen(false)}>取消</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleSubmitQcResult} disabled={submitting}>
              提交结果
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={shipmentOpen} onOpenChange={setShipmentOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>出运准备</DialogTitle>
            <DialogDescription>完成履约模式判断、必要时创建国内转运单，并进入待装柜阶段。</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>采购单号</Label>
              <Input value={selectedOrder?.poNumber || ''} disabled />
            </div>
            <div>
              <Label>履约模式</Label>
              <Select value={fulfillmentMode} onValueChange={setFulfillmentMode}>
                <SelectTrigger>
                  <SelectValue placeholder="选择履约模式" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="factory_direct">工厂直装直出</SelectItem>
                  <SelectItem value="supplier_to_supplier_consolidation">供应商间拼柜</SelectItem>
                  <SelectItem value="third_party_warehouse_consolidation">第三方仓拼柜</SelectItem>
                  <SelectItem value="self_warehouse_consolidation">自营仓拼柜</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>收款控制模式</Label>
              <Select value={collectionControlMode} onValueChange={setCollectionControlMode}>
                <SelectTrigger>
                  <SelectValue placeholder="选择收款控制模式" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="prepaid_before_booking">前 T/T：余款到账后再订舱</SelectItem>
                  <SelectItem value="post_tt_before_obl_release">后 T/T：可出运，放正本提单前收余款</SelectItem>
                  <SelectItem value="lc_bank_negotiation">L/C：出运后交单银行议付再放单</SelectItem>
                  <SelectItem value="dp_or_other_collection">D/P 或其它：出运后按托收结果放单</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="rounded border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
              {collectionControlMode === 'prepaid_before_booking' && '前T/T：主线要求先收齐余款，再进入订舱与装货。'}
              {collectionControlMode === 'post_tt_before_obl_release' && '后T/T：允许订舱装货，但在给客户正本提单前必须收齐余款。'}
              {collectionControlMode === 'lc_bank_negotiation' && 'L/C：先确认信用证可用，出运后需交单银行议付或收汇，再放正本单证。'}
              {collectionControlMode === 'dp_or_other_collection' && 'D/P或其它：允许先出运，但单证释放受托收/承兑结果控制。'}
            </div>
            {fulfillmentMode !== 'factory_direct' && (
              <>
                <div>
                  <Label>接收方类型</Label>
                  <Select value={destinationPartyType} onValueChange={setDestinationPartyType}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择接收方类型" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="supplier">另一供应商</SelectItem>
                      <SelectItem value="third_party_warehouse">第三方仓</SelectItem>
                      <SelectItem value="self_operated_warehouse">自营仓</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>接收方 / 中转点</Label>
                  <Input value={destinationPartyName} onChange={(e) => setDestinationPartyName(e.target.value)} placeholder="填写中转供应商或仓库名称" />
                </div>
                <div>
                  <Label>仓库 / 接收点地址</Label>
                  <Input value={warehouseAddress} onChange={(e) => setWarehouseAddress(e.target.value)} placeholder="填写工厂、第三方仓或自有仓地址" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>提货日期</Label>
                    <Input type="date" value={pickupDate} onChange={(e) => setPickupDate(e.target.value)} />
                  </div>
                  <div>
                    <Label>预计到货日期</Label>
                    <Input type="date" value={plannedArrivalDate} onChange={(e) => setPlannedArrivalDate(e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>接收人</Label>
                    <Input value={receiverContactName} onChange={(e) => setReceiverContactName(e.target.value)} placeholder="仓库或接收方联系人" />
                  </div>
                  <div>
                    <Label>接收人电话</Label>
                    <Input value={receiverContactPhone} onChange={(e) => setReceiverContactPhone(e.target.value)} placeholder="联系电话" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>承运商 / 物流商</Label>
                    <Input value={carrierName} onChange={(e) => setCarrierName(e.target.value)} placeholder="国内物流承运商" />
                  </div>
                  <div>
                    <Label>承运商联系人</Label>
                    <Input value={carrierContactName} onChange={(e) => setCarrierContactName(e.target.value)} placeholder="物流商联系人" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>承运商联系电话</Label>
                    <Input value={carrierContactPhone} onChange={(e) => setCarrierContactPhone(e.target.value)} placeholder="联系电话" />
                  </div>
                  <div>
                    <Label>承运商邮箱</Label>
                    <Input value={carrierContactEmail} onChange={(e) => setCarrierContactEmail(e.target.value)} placeholder="邮箱（可选）" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>运费承担方</Label>
                    <Select value={freightChargeParty} onValueChange={setFreightChargeParty}>
                      <SelectTrigger>
                        <SelectValue placeholder="选择承担方" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="our_company">我方</SelectItem>
                        <SelectItem value="supplier">供应商</SelectItem>
                        <SelectItem value="receiver">接收方</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>运费垫付方</Label>
                    <Select value={freightAdvanceParty} onValueChange={setFreightAdvanceParty}>
                      <SelectTrigger>
                        <SelectValue placeholder="选择垫付方" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="our_company">我方</SelectItem>
                        <SelectItem value="supplier">供应商</SelectItem>
                        <SelectItem value="receiver">接收方</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>仓库/接收点结算方</Label>
                    <Select value={warehouseSettlementParty} onValueChange={setWarehouseSettlementParty}>
                      <SelectTrigger>
                        <SelectValue placeholder="选择结算方" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="our_company">我方</SelectItem>
                        <SelectItem value="supplier">供应商</SelectItem>
                        <SelectItem value="receiver">接收方</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>仓库/接收点结算金额</Label>
                    <Input value={warehouseSettlementAmount} onChange={(e) => setWarehouseSettlementAmount(e.target.value)} placeholder="CNY" />
                  </div>
                </div>
              </>
            )}
            <div>
              <Label>备注</Label>
              <Textarea value={shipmentRemark} onChange={(e) => setShipmentRemark(e.target.value)} placeholder="填写直装说明或拼柜/转运安排说明" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShipmentOpen(false)}>取消</Button>
            <Button className="bg-orange-600 hover:bg-orange-700" onClick={handlePrepareShipment} disabled={submitting}>
              确认出运准备
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={financeOpen} onOpenChange={setFinanceOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>财务确认到款</DialogTitle>
            <DialogDescription>所有收款控制点都以财务确认到款为准，而不是业务口头确认。</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>采购单号</Label>
              <Input value={selectedOrder?.poNumber || ''} disabled />
            </div>
            <div className="rounded border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
              当前收款控制模式：{selectedOrder?.collectionControlMode || '-'}
            </div>
            <div>
              <Label>财务备注</Label>
              <Textarea value={financeRemark} onChange={(e) => setFinanceRemark(e.target.value)} placeholder="填写银行水单、到账说明或确认备注" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFinanceOpen(false)}>取消</Button>
            <Button className="bg-slate-700 hover:bg-slate-800" onClick={handleFinanceConfirmReceived}>
              确认到款
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={paymentNodeOpen} onOpenChange={setPaymentNodeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {paymentNodeType === 'procurement' && '采购付款'}
              {paymentNodeType === 'customer_balance' && '客户尾款 / 收款控制点'}
              {paymentNodeType === 'supplier_balance' && '供应商尾款'}
            </DialogTitle>
            <DialogDescription>显式记录主线A中的付款节点，不替代财务模块明细，但确保履约链上能看到付款控制动作。</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>采购单号</Label>
              <Input value={selectedOrder?.poNumber || ''} disabled />
            </div>
            <div>
              <Label>付款状态</Label>
              <Select value={paymentStatusDraft} onValueChange={setPaymentStatusDraft}>
                <SelectTrigger>
                  <SelectValue placeholder="选择付款状态" />
                </SelectTrigger>
                <SelectContent>
                  {paymentNodeType === 'procurement' && (
                    <>
                      <SelectItem value="pending">pending</SelectItem>
                      <SelectItem value="deposit_paid">deposit_paid</SelectItem>
                      <SelectItem value="partial_paid">partial_paid</SelectItem>
                      <SelectItem value="paid">paid</SelectItem>
                    </>
                  )}
                  {paymentNodeType === 'customer_balance' && (
                    <>
                      <SelectItem value="pending">pending</SelectItem>
                      <SelectItem value="balance_requested">balance_requested</SelectItem>
                      <SelectItem value="paid">paid</SelectItem>
                      <SelectItem value="finance_confirmed">finance_confirmed</SelectItem>
                      <SelectItem value="balance_paid">balance_paid</SelectItem>
                    </>
                  )}
                  {paymentNodeType === 'supplier_balance' && (
                    <>
                      <SelectItem value="pending">pending</SelectItem>
                      <SelectItem value="deposit_paid">deposit_paid</SelectItem>
                      <SelectItem value="partial_paid">partial_paid</SelectItem>
                      <SelectItem value="balance_paid">balance_paid</SelectItem>
                      <SelectItem value="paid">paid</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>备注</Label>
              <Textarea value={paymentNodeRemark} onChange={(e) => setPaymentNodeRemark(e.target.value)} placeholder="填写付款申请、审批、到账或付款说明" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentNodeOpen(false)}>取消</Button>
            <Button className="bg-slate-700 hover:bg-slate-800" onClick={handleSavePaymentNode}>
              保存付款节点
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={bookingOpen} onOpenChange={setBookingOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>订舱控制</DialogTitle>
            <DialogDescription>把订舱和装柜拆开控制，并记录谁来订舱、是否需要客户确认运费。</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>采购单号</Label>
              <Input value={selectedOrder?.poNumber || ''} disabled />
            </div>
            <div>
              <Label>订舱责任</Label>
              <Select value={bookingResponsibility} onValueChange={setBookingResponsibility}>
                <SelectTrigger>
                  <SelectValue placeholder="选择订舱责任" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="our_company">我方订舱</SelectItem>
                  <SelectItem value="customer_confirmed_freight">客户确认运费后我方订舱</SelectItem>
                  <SelectItem value="customer_nominated_forwarder">客户指定货代，我方代订</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox checked={freightConfirmationRequired} onCheckedChange={(checked) => setFreightConfirmationRequired(Boolean(checked))} />
              <Label>需要客户确认运费后才能订舱</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox checked={freightConfirmedByCustomer} onCheckedChange={(checked) => setFreightConfirmedByCustomer(Boolean(checked))} />
              <Label>客户已确认运费</Label>
            </div>
            <div>
              <Label>订舱备注</Label>
              <Textarea value={bookingRemark} onChange={(e) => setBookingRemark(e.target.value)} placeholder="填写 FOB/CIF、客户指定货代或订舱说明" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBookingOpen(false)}>取消</Button>
            <Button className="bg-purple-600 hover:bg-purple-700" onClick={handleSaveBookingControl}>
              保存订舱控制
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={bookingWorkflowOpen} onOpenChange={setBookingWorkflowOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>订舱询价 / Shipping Order</DialogTitle>
            <DialogDescription>保存海运询价比价记录，必要时取得客户确认后，再向货代下 Shipping Order，并记录港口备案状态。</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>采购单号</Label>
                <Input value={selectedOrder?.poNumber || ''} disabled />
              </div>
              <div>
                <Label>目的港</Label>
                <Input value={destinationPort} onChange={(e) => setDestinationPort(e.target.value)} placeholder="例如 Los Angeles / Rotterdam" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>柜型</Label>
                <Select value={containerType} onValueChange={setContainerType}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择柜型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="20GP">20GP</SelectItem>
                    <SelectItem value="40GP">40GP</SelectItem>
                    <SelectItem value="40HQ">40HQ</SelectItem>
                    <SelectItem value="45HQ">45HQ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>货好日期</Label>
                <Input type="date" value={cargoReadyDate} onChange={(e) => setCargoReadyDate(e.target.value)} />
              </div>
              <div>
                <Label>询价截止</Label>
                <Input type="date" value={quoteDeadlineAt} onChange={(e) => setQuoteDeadlineAt(e.target.value)} />
              </div>
            </div>
            <div className="rounded border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
              当前订舱责任：{selectedOrder?.bookingResponsibility || 'our_company'}。如为我方订舱，需先保存各货代/船公司询价记录；如要求客户确认海运费和船期，则必须先取得客户确认后再下 Shipping Order。
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>海运询价 / 货比三家</Label>
                <Select value={selectedQuoteIndex} onValueChange={setSelectedQuoteIndex}>
                  <SelectTrigger className="w-44">
                    <SelectValue placeholder="选择采用报价" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">采用报价 1</SelectItem>
                    <SelectItem value="1">采用报价 2</SelectItem>
                    <SelectItem value="2">采用报价 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {bookingQuoteOptions.map((option, index) => (
                <div key={index} className="rounded border border-slate-200 p-3 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>货代 {index + 1}</Label>
                      <Input value={option.forwarderName} onChange={(e) => updateBookingQuoteOption(index, 'forwarderName', e.target.value)} placeholder="货代公司" />
                    </div>
                    <div>
                      <Label>船公司</Label>
                      <Input value={option.carrierName} onChange={(e) => updateBookingQuoteOption(index, 'carrierName', e.target.value)} placeholder="例如 COSCO / MSC / MAERSK" />
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    <div>
                      <Label>船期 ETD</Label>
                      <Input type="date" value={option.etd} onChange={(e) => updateBookingQuoteOption(index, 'etd', e.target.value)} />
                    </div>
                    <div>
                      <Label>航程天数</Label>
                      <Input value={option.transitDays} onChange={(e) => updateBookingQuoteOption(index, 'transitDays', e.target.value)} placeholder="例如 25" />
                    </div>
                    <div>
                      <Label>海运费</Label>
                      <Input value={option.freightAmount} onChange={(e) => updateBookingQuoteOption(index, 'freightAmount', e.target.value)} placeholder="USD" />
                    </div>
                    <div>
                      <Label>附加费</Label>
                      <Input value={option.surchargeAmount} onChange={(e) => updateBookingQuoteOption(index, 'surchargeAmount', e.target.value)} placeholder="USD" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>船名（可选）</Label>
                      <Input value={option.vesselName} onChange={(e) => updateBookingQuoteOption(index, 'vesselName', e.target.value)} placeholder="船名" />
                    </div>
                    <div>
                      <Label>备注</Label>
                      <Input value={option.remarks} onChange={(e) => updateBookingQuoteOption(index, 'remarks', e.target.value)} placeholder="报价备注、截关要求等" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Checkbox checked={issueShippingOrderNow} onCheckedChange={(checked) => setIssueShippingOrderNow(Boolean(checked))} />
              <Label>已确认采用报价，立即下 Shipping Order</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox checked={portFilingRequired} onCheckedChange={(checked) => setPortFilingRequired(Boolean(checked))} />
              <Label>需要出货港口备案</Label>
            </div>
            <div>
              <Label>备注</Label>
              <Textarea value={shippingOrderRemark} onChange={(e) => setShippingOrderRemark(e.target.value)} placeholder="填写客户确认海运费、货代确认、Shipping Order 或港口备案说明" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBookingWorkflowOpen(false)}>取消</Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={handleSaveBookingWorkflow} disabled={submitting}>
              保存订舱询价 / SO
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={loadingOpen} onOpenChange={setLoadingOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>装柜计划 / 装柜执行</DialogTitle>
            <DialogDescription>完成主线A的装柜计划与装柜执行，并显式记录监装方式：常规装柜或第三方监装。</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>采购单号</Label>
                <Input value={selectedOrder?.poNumber || ''} disabled />
              </div>
              <div>
                <Label>装柜地点</Label>
                <Input value={loadPointName} onChange={(e) => setLoadPointName(e.target.value)} placeholder="工厂 / 第三方仓 / 拼柜点" />
              </div>
            </div>
            <div className="grid grid-cols-4 gap-3">
              <div>
                <Label>柜型</Label>
                <Select value={loadPlanContainerType} onValueChange={setLoadPlanContainerType}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择柜型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="20GP">20GP</SelectItem>
                    <SelectItem value="40GP">40GP</SelectItem>
                    <SelectItem value="40HQ">40HQ</SelectItem>
                    <SelectItem value="45HQ">45HQ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>装柜日期</Label>
                <Input type="date" value={plannedLoadingDate} onChange={(e) => setPlannedLoadingDate(e.target.value)} />
              </div>
              <div>
                <Label>起运港</Label>
                <Input value={loadPlanPortOfLoading} onChange={(e) => setLoadPlanPortOfLoading(e.target.value)} placeholder="例如 XIAMEN" />
              </div>
              <div>
                <Label>目的港</Label>
                <Input value={loadPlanPortOfDestination} onChange={(e) => setLoadPlanPortOfDestination(e.target.value)} placeholder="例如 LOS ANGELES" />
              </div>
            </div>
            <div className="grid grid-cols-4 gap-3">
              <div>
                <Label>柜号</Label>
                <Input value={containerNo} onChange={(e) => setContainerNo(e.target.value)} placeholder="如 MAEU1234567" />
              </div>
              <div>
                <Label>封签号</Label>
                <Input value={sealNo} onChange={(e) => setSealNo(e.target.value)} placeholder="最终封签号" />
              </div>
              <div>
                <Label>司机姓名</Label>
                <Input value={driverName} onChange={(e) => setDriverName(e.target.value)} placeholder="拖车司机" />
              </div>
              <div>
                <Label>司机电话</Label>
                <Input value={driverPhone} onChange={(e) => setDriverPhone(e.target.value)} placeholder="联系电话" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>车牌号</Label>
                <Input value={vehicleNo} onChange={(e) => setVehicleNo(e.target.value)} placeholder="车牌号" />
              </div>
              <div>
                <Label>装柜件数</Label>
                <Input value={loadedPackages} onChange={(e) => setLoadedPackages(e.target.value)} placeholder="Packages" />
              </div>
              <div>
                <Label>装柜数量</Label>
                <Input value={loadedQuantity} onChange={(e) => setLoadedQuantity(e.target.value)} placeholder="Quantity" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>监装方式</Label>
                <Select value={loadingSupervisionMode} onValueChange={setLoadingSupervisionMode}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择监装方式" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="internal_only">常规装柜 / 无第三方监装</SelectItem>
                    <SelectItem value="third_party_witness">第三方监装</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {loadingSupervisionMode === 'third_party_witness' && (
                <div>
                  <Label>第三方监装机构</Label>
                  <Input value={loadingSupervisionAgencyName} onChange={(e) => setLoadingSupervisionAgencyName(e.target.value)} placeholder="例如 BV / SGS" />
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 rounded border border-slate-200 p-3">
              <div className="flex items-center gap-2">
                <Checkbox checked={hasEmptyContainerPhoto} onCheckedChange={(checked) => setHasEmptyContainerPhoto(Boolean(checked))} />
                <Label>已记录空柜照片</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox checked={hasHalfLoadedPhoto} onCheckedChange={(checked) => setHasHalfLoadedPhoto(Boolean(checked))} />
                <Label>已记录半柜内柜照片</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox checked={hasFullDoorsOpenPhoto} onCheckedChange={(checked) => setHasFullDoorsOpenPhoto(Boolean(checked))} />
                <Label>已记录装完双门开照片</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox checked={hasLeftDoorOpenPhoto} onCheckedChange={(checked) => setHasLeftDoorOpenPhoto(Boolean(checked))} />
                <Label>已记录左门开照片</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox checked={hasBothDoorsClosedPhoto} onCheckedChange={(checked) => setHasBothDoorsClosedPhoto(Boolean(checked))} />
                <Label>已记录双门关照片</Label>
              </div>
            </div>
            <div>
              <Label>装柜备注</Label>
              <Textarea value={loadingRemark} onChange={(e) => setLoadingRemark(e.target.value)} placeholder="填写拖车到场、分段装柜、封签说明或现场异常备注" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLoadingOpen(false)}>取消</Button>
            <Button className="bg-violet-600 hover:bg-violet-700" onClick={handleCreateLoadPlanAndLoadingTask} disabled={submitting}>
              保存装柜计划 / 执行
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={exportCheckOpen} onOpenChange={setExportCheckOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>出口要求判定</DialogTitle>
            <DialogDescription>完成主线A第 23-27 节点入口。商检、原产地证、熏蒸都是条件项，不命中时保持未勾选即可；如命中，必须在报关前完成。</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>采购单号</Label>
                <Input value={selectedOrder?.poNumber || ''} disabled />
              </div>
              <div>
                <Label>目的国</Label>
                <Input value={destinationCountry} onChange={(e) => setDestinationCountry(e.target.value)} placeholder="例如 USA / Germany / South Africa" />
              </div>
            </div>
            <div>
              <Label>贸易条款</Label>
              <Select value={tradeTerm} onValueChange={setTradeTerm}>
                <SelectTrigger>
                  <SelectValue placeholder="选择贸易条款" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FOB">FOB</SelectItem>
                  <SelectItem value="CFR">CFR</SelectItem>
                  <SelectItem value="CIF">CIF</SelectItem>
                  <SelectItem value="EXW">EXW</SelectItem>
                  <SelectItem value="DAP">DAP</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="rounded border border-slate-200 p-3 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <Checkbox checked={requiresCustomsDeclaration} onCheckedChange={(checked) => setRequiresCustomsDeclaration(Boolean(checked))} />
                <Label>需要报关申报</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox checked={requiresInspection} onCheckedChange={(checked) => setRequiresInspection(Boolean(checked))} />
                <Label>需要商检（条件项）</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox checked={requiresCo} onCheckedChange={(checked) => setRequiresCo(Boolean(checked))} />
                <Label>需要原产地证 CO（条件项）</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox checked={requiresFumigation} onCheckedChange={(checked) => setRequiresFumigation(Boolean(checked))} />
                <Label>需要熏蒸证书（条件项）</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox checked={requiresLoadingInspectionReport} onCheckedChange={(checked) => setRequiresLoadingInspectionReport(Boolean(checked))} />
                <Label>需要监装/验货报告</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox checked={requiresHealthCertificate} onCheckedChange={(checked) => setRequiresHealthCertificate(Boolean(checked))} />
                <Label>需要卫生/健康类证书</Label>
              </div>
              <div className="flex items-center gap-2 md:col-span-2">
                <Checkbox checked={requiresOtherDocs} onCheckedChange={(checked) => setRequiresOtherDocs(Boolean(checked))} />
                <Label>还有其它特殊单证要求</Label>
              </div>
            </div>
            <div>
              <Label>其它单证/判定备注</Label>
              <Textarea value={otherDocNotes} onChange={(e) => setOtherDocNotes(e.target.value)} placeholder="填写 HS Code、木包装、客户要求、目的国要求或报关前必须完成的特殊单证说明" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExportCheckOpen(false)}>取消</Button>
            <Button className="bg-sky-600 hover:bg-sky-700" onClick={handleSaveExportRequirementCheck} disabled={submitting}>
              保存出口要求判定
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={customsPrepOpen} onOpenChange={setCustomsPrepOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>CI / PL / 报关资料</DialogTitle>
            <DialogDescription>完成主线A第 27-28 节点。先形成 CI/PL 报关资料，再记录报关行申报。</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>采购单号</Label>
                <Input value={selectedOrder?.poNumber || ''} disabled />
              </div>
              <div>
                <Label>商业发票 CI 单号</Label>
                <Input value={commercialInvoiceNo} onChange={(e) => setCommercialInvoiceNo(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>装箱单 PL 单号</Label>
                <Input value={packingListNo} onChange={(e) => setPackingListNo(e.target.value)} />
              </div>
              <div>
                <Label>报关行</Label>
                <Input value={customsBrokerName} onChange={(e) => setCustomsBrokerName(e.target.value)} placeholder="填写报关行名称" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>报关单号</Label>
                <Input value={customsDeclNo} onChange={(e) => setCustomsDeclNo(e.target.value)} placeholder="若已申报可填写" />
              </div>
              <div>
                <Label>申报日期</Label>
                <Input type="date" value={customsDeclarationDate} onChange={(e) => setCustomsDeclarationDate(e.target.value)} />
              </div>
            </div>
            <div className="rounded border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
              提醒：商检和熏蒸都是条件项。如果这票货需要商检或熏蒸，应先在“出口要求判定”中标记，并在报关前完成对应单证。
            </div>
            <div>
              <Label>备注</Label>
              <Textarea value={customsRemark} onChange={(e) => setCustomsRemark(e.target.value)} placeholder="填写报关资料准备、单证缺口、报关行提交说明等" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCustomsPrepOpen(false)}>取消</Button>
            <Button className="bg-teal-600 hover:bg-teal-700" onClick={handleSaveCustomsPreparation} disabled={submitting}>
              保存 CI / PL / 报关
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function InspectionManagementComplete() {
  const [activeTab, setActiveTab] = useState('execution');
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
        <TabsList className="grid grid-cols-7 w-full h-9">
          <TabsTrigger value="execution" className="text-xs py-1">
            <Workflow className="size-3.5 mr-1.5" />
            后段QC
          </TabsTrigger>
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

        <TabsContent value="execution" className="space-y-3 mt-3">
          <ExecutionQcTab />
        </TabsContent>

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
