import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { FileText, Upload, Download, Eye, ChevronDown, ChevronUp, CheckCircle, Clock, AlertCircle, Circle, Package, DollarSign, ClipboardCheck, Truck, FileCheck, RefreshCw, X, ChevronRight, PlayCircle, PauseCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { toast } from 'sonner@2.0.3';

/**
 * 🔥 供应商文档中心 - 订单流程紧凑表格视图（台湾大厂风格）
 * 高信息密度、专业化、工业化风格
 */
export default function SupplierDocumentsWorkflowCompact() {
  const [selectedOrderId, setSelectedOrderId] = useState('PO-2024-155');
  const [expandedPhases, setExpandedPhases] = useState<string[]>(['pre-order', 'sample', 'production', 'inspection', 'shipping']);
  const [expandedStages, setExpandedStages] = useState<number[]>([]);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadTargetStage, setUploadTargetStage] = useState<number | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [vatDialogOpen, setVatDialogOpen] = useState(false);

  // 上传表单
  const [uploadForm, setUploadForm] = useState({
    documentType: '',
    description: ''
  });

  // 增值税发票表单
  const [vatForm, setVatForm] = useState({
    invoiceCode: '',
    invoiceNumber: '',
    invoiceDate: '',
    amountWithoutTax: '802212.00',
    taxRate: '13',
    taxAmount: '104238.00',
    totalAmount: '906250.00',
    notes: ''
  });

  // 模拟订单数据
  const orders = [
    {
      id: 'PO-2024-155',
      customerName: 'ABC Corp', // 🔥 供应商不可见
      amount: 125000,
      currency: 'USD',
      orderDate: '2024-11-10',
      deliveryDate: '2024-12-20',
      isTaxable: true,
      taxRate: 13,
      amountWithTax: 125000,
      amountWithoutTax: 110619,
      taxAmount: 14381,
      progress: 70,
      region: 'North America' // 🔥 供应商不可见
    },
    {
      id: 'PO-2024-156',
      customerName: 'XYZ Ltd', // 🔥 供应商不可见
      amount: 89000,
      currency: 'USD',
      orderDate: '2024-11-05',
      deliveryDate: '2024-12-15',
      isTaxable: false,
      taxRate: 0,
      amountWithTax: 89000,
      amountWithoutTax: 89000,
      taxAmount: 0,
      progress: 85,
      region: 'Europe' // 🔥 供应商不可见
    },
    {
      id: 'PO-2024-157',
      customerName: 'Global Trading', // 🔥 供应商不可见
      amount: 156000,
      currency: 'USD',
      orderDate: '2024-11-15',
      deliveryDate: '2024-12-25',
      isTaxable: true,
      taxRate: 13,
      amountWithTax: 156000,
      amountWithoutTax: 138053,
      taxAmount: 17947,
      progress: 45,
      region: 'South America' // 🔥 供应商不可见
    }
  ];

  const selectedOrder = orders.find(o => o.id === selectedOrderId);

  // 16个业务流程节点定义
  const [workflowStages, setWorkflowStages] = useState([
    {
      id: 1,
      name: '询价阶段',
      phase: 'pre-order',
      status: 'completed',
      icon: FileText,
      requiresAdminInteraction: false,
      documents: [
        { id: 1, name: '客户询价单 XJ-2024-001.pdf', uploadDate: '2024-11-05', uploadedBy: 'COSUN', size: '245 KB' },
        { id: 2, name: '初步报价单 Quote-001.pdf', uploadDate: '2024-11-06', uploadedBy: '您', size: '180 KB' },
        { id: 3, name: '技术规格书 Spec-001.pdf', uploadDate: '2024-11-08', uploadedBy: 'COSUN', size: '520 KB' }
      ]
    },
    {
      id: 2,
      name: '订单确认',
      phase: 'pre-order',
      status: 'completed',
      icon: ClipboardCheck,
      requiresAdminInteraction: false,
      documents: [
        { id: 4, name: '采购订单 PO-2024-155.pdf', uploadDate: '2024-11-10', uploadedBy: 'COSUN', size: '320 KB' },
        { id: 5, name: '订单确认函 Confirmation.pdf', uploadDate: '2024-11-11', uploadedBy: '您', size: '156 KB' }
      ]
    },
    {
      id: 3,
      name: '定金确认',
      phase: 'pre-order',
      status: 'completed',
      icon: DollarSign,
      requiresAdminInteraction: true,
      adminInteractionType: 'financial_confirm',
      adminRole: '财务',
      adminPerson: '王芳',
      adminStatus: 'completed',
      adminDate: '2024-11-12',
      documents: [
        { id: 6, name: '定金发票 Deposit-Invoice.pdf', uploadDate: '2024-11-12', uploadedBy: '您', size: '180 KB' },
        { id: 7, name: '收款水单 Payment-Receipt.pdf', uploadDate: '2024-11-12', uploadedBy: '您', size: '125 KB' }
      ]
    },
    {
      id: 4,
      name: '产前样确认',
      phase: 'sample',
      status: 'completed',
      icon: Package,
      requiresAdminInteraction: true,
      adminInteractionType: 'business_approve',
      adminRole: '业务员',
      adminPerson: '李明',
      adminStatus: 'completed',
      adminDate: '2024-11-18',
      documents: [
        { id: 8, name: '产前样照片 Pre-Sample-Photos.zip', uploadDate: '2024-11-15', uploadedBy: '您', size: '8.5 MB' },
        { id: 9, name: '产前样报告 Pre-Sample-Report.pdf', uploadDate: '2024-11-16', uploadedBy: '您', size: '1.2 MB' },
        { id: 10, name: '快递单号 SF-1234567890.pdf', uploadDate: '2024-11-15', uploadedBy: '您', size: '85 KB' },
        { id: 11, name: 'COSUN确认函 Approval-Letter.pdf', uploadDate: '2024-11-18', uploadedBy: 'COSUN', size: '156 KB' }
      ]
    },
    {
      id: 5,
      name: '生产准备',
      phase: 'sample',
      status: 'completed',
      icon: FileText,
      requiresAdminInteraction: false,
      documents: [
        { id: 12, name: '生产通知单 Production-Notice.pdf', uploadDate: '2024-11-19', uploadedBy: '您', size: '220 KB' },
        { id: 13, name: '物料清单 BOM.xlsx', uploadDate: '2024-11-19', uploadedBy: '您', size: '95 KB' },
        { id: 14, name: '技术图纸 Drawing.pdf', uploadDate: '2024-11-20', uploadedBy: '您', size: '2.8 MB' },
        { id: 15, name: '采购询价单 Procurement-XJ.pdf', uploadDate: '2024-11-20', uploadedBy: '您', size: '180 KB' }
      ]
    },
    {
      id: 6,
      name: '大货样确认',
      phase: 'sample',
      status: 'completed',
      icon: Package,
      requiresAdminInteraction: true,
      adminInteractionType: 'business_approve',
      adminRole: '业务员',
      adminPerson: '李明',
      adminStatus: 'completed',
      adminDate: '2024-11-27',
      documents: [
        { id: 16, name: '大货样照片 Production-Sample.zip', uploadDate: '2024-11-25', uploadedBy: '您', size: '12.5 MB' },
        { id: 17, name: '大货样检验报告 Sample-QC.pdf', uploadDate: '2024-11-26', uploadedBy: '您', size: '1.8 MB' },
        { id: 18, name: 'COSUN确认函 Approval-Letter-2.pdf', uploadDate: '2024-11-27', uploadedBy: 'COSUN', size: '165 KB' }
      ]
    },
    {
      id: 7,
      name: '生产过程',
      phase: 'production',
      status: 'completed',
      icon: RefreshCw,
      requiresAdminInteraction: false,
      documents: [
        { id: 19, name: '生产照片-开工 Start-Production.zip', uploadDate: '2024-11-28', uploadedBy: '您', size: '15.2 MB' },
        { id: 20, name: '生产照片-组装 Assembly.zip', uploadDate: '2024-12-02', uploadedBy: '您', size: '18.6 MB' },
        { id: 21, name: '生产照片-半成品 Semi-finished.zip', uploadDate: '2024-12-05', uploadedBy: '您', size: '14.8 MB' },
        { id: 22, name: '生产进度周报 Week1-Progress.pdf', uploadDate: '2024-12-01', uploadedBy: '您', size: '320 KB' },
        { id: 23, name: '生产进度周报 Week2-Progress.pdf', uploadDate: '2024-12-08', uploadedBy: '您', size: '285 KB' }
      ]
    },
    {
      id: 8,
      name: '生产质检',
      phase: 'production',
      status: 'completed',
      icon: ClipboardCheck,
      requiresAdminInteraction: true,
      adminInteractionType: 'qc_review',
      adminRole: 'QC',
      adminPerson: '张质检',
      adminStatus: 'completed',
      adminDate: '2024-12-10',
      documents: [
        { id: 24, name: '内部质检报告-原料 Raw-Material-QC.pdf', uploadDate: '2024-12-03', uploadedBy: '您', size: '1.5 MB' },
        { id: 25, name: '内部质检报告-过程 In-process-QC.pdf', uploadDate: '2024-12-07', uploadedBy: '您', size: '2.1 MB' },
        { id: 26, name: '内部质检报告-成品 Finished-QC.pdf', uploadDate: '2024-12-10', uploadedBy: '您', size: '2.8 MB' }
      ]
    },
    {
      id: 9,
      name: '验货准备',
      phase: 'inspection',
      status: 'completed',
      icon: AlertCircle,
      requiresAdminInteraction: true,
      adminInteractionType: 'arrange_inspection',
      adminRole: '单证员',
      adminPerson: '张三',
      adminStatus: 'completed',
      adminDate: '2024-12-13',
      documents: [
        { id: 27, name: '验货通知函 Inspection-Notice.pdf', uploadDate: '2024-12-12', uploadedBy: '您', size: '180 KB' },
        { id: 28, name: '验货排期表 Inspection-Schedule.pdf', uploadDate: '2024-12-13', uploadedBy: 'COSUN', size: '125 KB' }
      ]
    },
    {
      id: 10,
      name: '验货实施',
      phase: 'inspection',
      status: 'completed',
      icon: CheckCircle,
      requiresAdminInteraction: true,
      adminInteractionType: 'inspection_execute',
      adminRole: '验货员',
      adminPerson: '张三',
      adminStatus: 'completed',
      adminDate: '2024-12-15',
      documents: [
        { id: 29, name: '验货报告 Inspection-Report.pdf', uploadDate: '2024-12-15', uploadedBy: 'COSUN', size: '3.2 MB' },
        { id: 30, name: '验货照片 Inspection-Photos.zip', uploadDate: '2024-12-15', uploadedBy: 'COSUN', size: '25.6 MB' },
        { id: 31, name: '验货合格证明 Pass-Certificate.pdf', uploadDate: '2024-12-15', uploadedBy: 'COSUN', size: '220 KB' }
      ]
    },
    {
      id: 11,
      name: '包装完成',
      phase: 'inspection',
      status: 'completed',
      icon: Package,
      requiresAdminInteraction: false,
      documents: [
        { id: 32, name: '包装照片 Packing-Photos.zip', uploadDate: '2024-12-16', uploadedBy: '您', size: '18.5 MB' },
        { id: 33, name: '装箱清单 Packing-List.pdf', uploadDate: '2024-12-16', uploadedBy: '您', size: '280 KB' },
        { id: 34, name: '唛头照片 Shipping-Mark.jpg', uploadDate: '2024-12-16', uploadedBy: '您', size: '1.2 MB' },
        { id: 35, name: '装柜照片 Container-Loading.zip', uploadDate: '2024-12-17', uploadedBy: '您', size: '22.5 MB' }
      ]
    },
    {
      id: 12,
      name: '发货准备',
      phase: 'shipping',
      status: 'completed',
      icon: Truck,
      requiresAdminInteraction: false,
      documents: [
        { id: 36, name: '送货单 Delivery-Note.pdf', uploadDate: '2024-12-17', uploadedBy: '您', size: '180 KB' },
        { id: 37, name: '物流单号 Tracking-SF-123456.pdf', uploadDate: '2024-12-17', uploadedBy: '您', size: '95 KB' },
        { id: 38, name: '发货照片 Shipment-Photos.zip', uploadDate: '2024-12-17', uploadedBy: '您', size: '15.2 MB' },
        { id: 39, name: '仓库入库单 Warehouse-Receipt.pdf', uploadDate: '2024-12-18', uploadedBy: '您', size: '220 KB' }
      ]
    },
    {
      id: 13,
      name: '余款确认',
      phase: 'shipping',
      status: 'in_progress',
      icon: DollarSign,
      requiresAdminInteraction: true,
      adminInteractionType: 'financial_confirm',
      adminRole: '财务',
      adminPerson: '王芳',
      adminStatus: 'in_progress',
      documents: [
        { id: 40, name: '余款发票 Balance-Invoice.pdf', uploadDate: '2024-12-18', uploadedBy: '您', size: '185 KB' }
      ]
    },
    {
      id: 14,
      name: '出库发运',
      phase: 'shipping',
      status: 'in_progress',
      icon: Truck,
      requiresAdminInteraction: true,
      adminInteractionType: 'documentation',
      adminRole: '单证员',
      adminPerson: '张三',
      adminStatus: 'in_progress',
      documents: [
        { id: 41, name: '出库通知 Warehouse-Release.pdf', uploadDate: '2024-12-19', uploadedBy: '您', size: '180 KB' },
        { id: 42, name: '货运订舱单 Booking-Confirm.pdf', uploadDate: '2024-12-19', uploadedBy: '您', size: '220 KB' }
      ]
    },
    {
      id: 15,
      name: '增值税发票',
      phase: 'shipping',
      status: 'pending',
      icon: FileCheck,
      requiresAdminInteraction: true,
      adminInteractionType: 'financial_confirm',
      adminRole: '财务',
      adminPerson: '王芳',
      adminStatus: 'pending',
      documents: [],
      isTaxableOnly: true
    },
    {
      id: 16,
      name: '交付完成',
      phase: 'complete',
      status: 'pending',
      icon: CheckCircle,
      requiresAdminInteraction: false,
      documents: []
    }
  ]);

  // 阶段定义
  const phases = [
    { key: 'pre-order', label: '订单前期', color: 'blue' },
    { key: 'sample', label: '样品确认', color: 'purple' },
    { key: 'production', label: '生产执行', color: 'orange' },
    { key: 'inspection', label: '验货包装', color: 'green' },
    { key: 'shipping', label: '发货收款', color: 'cyan' },
    { key: 'complete', label: '交付完成', color: 'gray' }
  ];

  // 展开/折叠阶段
  const togglePhase = (phaseKey: string) => {
    if (expandedPhases.includes(phaseKey)) {
      setExpandedPhases(expandedPhases.filter(k => k !== phaseKey));
    } else {
      setExpandedPhases([...expandedPhases, phaseKey]);
    }
  };

  // 展开/折叠节点文档
  const toggleStage = (stageId: number) => {
    if (expandedStages.includes(stageId)) {
      setExpandedStages(expandedStages.filter(id => id !== stageId));
    } else {
      setExpandedStages([...expandedStages, stageId]);
    }
  };

  // 获取节点状态样式
  const getStatusBadge = (status: string) => {
    const styles: any = {
      completed: { icon: CheckCircle, bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300', label: '已完成' },
      in_progress: { icon: PlayCircle, bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300', label: '进行中' },
      pending: { icon: PauseCircle, bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-300', label: '待处理' },
      blocked: { icon: AlertCircle, bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300', label: '受阻' }
    };
    return styles[status] || styles.pending;
  };

  // 处理文件选择
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const maxSize = 20 * 1024 * 1024;
      const oversizedFiles = Array.from(e.target.files).filter(file => file.size > maxSize);
      
      if (oversizedFiles.length > 0) {
        toast.error('文件过大', { description: `${oversizedFiles[0].name} 超过20MB限制` });
        return;
      }
      setSelectedFiles(e.target.files);
    }
  };

  // 上传文档到节点
  const handleUploadToStage = () => {
    if (!uploadTargetStage || !selectedFiles || selectedFiles.length === 0) {
      toast.error('请选择要上传的文件');
      return;
    }

    const targetStage = workflowStages.find(s => s.id === uploadTargetStage);
    if (!targetStage) return;

    const today = new Date().toISOString().split('T')[0];
    const newDocuments = Array.from(selectedFiles).map((file, index) => {
      const sizeInKB = (file.size / 1024).toFixed(0);
      const sizeInMB = (file.size / (1024 * 1024)).toFixed(1);
      const displaySize = file.size > 1024 * 1024 ? `${sizeInMB} MB` : `${sizeInKB} KB`;
      return {
        id: Date.now() + index,
        name: file.name,
        uploadDate: today,
        uploadedBy: '您',
        size: displaySize
      };
    });

    const updatedStages = workflowStages.map(stage => {
      if (stage.id === uploadTargetStage) {
        return {
          ...stage,
          documents: [...stage.documents, ...newDocuments],
          status: stage.status === 'pending' ? 'in_progress' : stage.status
        };
      }
      return stage;
    });

    setWorkflowStages(updatedStages);
    toast.success(`成功上传 ${selectedFiles.length} 个文件到 ${targetStage.name}！`);
    setUploadDialogOpen(false);
    setUploadTargetStage(null);
    setSelectedFiles(null);
    setUploadForm({ documentType: '', description: '' });
  };

  // 上传增值税发票
  const handleUploadVATInvoice = () => {
    if (!vatForm.invoiceCode || !vatForm.invoiceNumber) {
      toast.error('请输入发票代码和号码');
      return;
    }
    if (!selectedFiles || selectedFiles.length === 0) {
      toast.error('请上传发票扫描件');
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const vatDocuments = [
      { id: Date.now(), name: '增值税专用发票.pdf', uploadDate: today, uploadedBy: '您', size: '1.2 MB' },
      { id: Date.now() + 1, name: '报关单（出口）.pdf', uploadDate: today, uploadedBy: '您', size: '856 KB' },
      { id: Date.now() + 2, name: '退税联.pdf', uploadDate: today, uploadedBy: '您', size: '680 KB' }
    ];

    const updatedStages = workflowStages.map(stage => {
      if (stage.id === 15) {
        return { ...stage, documents: vatDocuments, status: 'in_progress', adminStatus: 'pending' };
      }
      return stage;
    });

    setWorkflowStages(updatedStages);
    toast.success('增值税发票上传成功！', { description: `发票号码：${vatForm.invoiceNumber}` });
    setVatDialogOpen(false);
    setSelectedFiles(null);
  };

  // 计算进度
  const calculateProgress = () => {
    const completedStages = workflowStages.filter(s => {
      if (s.id === 15 && selectedOrder && !selectedOrder.isTaxable) return true;
      return s.status === 'completed';
    }).length;
    return Math.round((completedStages / workflowStages.length) * 100);
  };

  return (
    <div className="space-y-3">
      {/* 订单信息卡片 - 台湾大厂风格 */}
      <div className="bg-gradient-to-r from-slate-50 to-gray-50 border-2 border-gray-300 rounded-lg shadow-sm">
        <div className="border-b-2 border-gray-300 bg-white px-4 py-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                <FileText className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900" style={{ fontSize: '15px' }}>订单流程文档管理系统</h2>
                <p className="text-xs text-gray-500">Order Workflow Document Management</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setExpandedPhases(phases.map(p => p.key))} className="h-7 px-2 text-xs">
                全部展开
              </Button>
              <Button variant="outline" size="sm" onClick={() => setExpandedPhases([])} className="h-7 px-2 text-xs">
                全部折叠
              </Button>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-3">
          {/* 订单选择器 */}
          <div className="grid grid-cols-12 gap-3 items-end">
            <div className="col-span-3">
              <Label className="text-xs text-gray-600 mb-1 font-medium">订单编号 Order No.</Label>
              <Select value={selectedOrderId} onValueChange={setSelectedOrderId}>
                <SelectTrigger className="h-8 text-xs border-gray-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {orders.map(order => (
                    <SelectItem key={order.id} value={order.id} className="text-xs">
                      {order.id} | ${order.amount.toLocaleString()} | {order.isTaxable ? `含税${order.taxRate}%` : '不含税'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedOrder && (
              <>
                <div className="col-span-3">
                  <Label className="text-xs text-gray-600 mb-1 font-medium">下单日期 Order Date</Label>
                  <div className="h-8 px-2 border border-gray-300 rounded bg-white flex items-center text-xs">
                    {selectedOrder.orderDate}
                  </div>
                </div>
                <div className="col-span-3">
                  <Label className="text-xs text-gray-600 mb-1 font-medium">交期 Delivery</Label>
                  <div className="h-8 px-2 border border-gray-300 rounded bg-white flex items-center text-xs">
                    {selectedOrder.deliveryDate}
                  </div>
                </div>
                <div className="col-span-3">
                  <Label className="text-xs text-gray-600 mb-1 font-medium">订单类型 Type</Label>
                  <div className="h-8 px-2 border border-gray-300 rounded bg-white flex items-center">
                    {selectedOrder.isTaxable ? (
                      <Badge className="bg-blue-600 text-white text-xs h-5">含税 {selectedOrder.taxRate}%</Badge>
                    ) : (
                      <Badge className="bg-gray-500 text-white text-xs h-5">不含税</Badge>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* 金额信息 */}
          {selectedOrder && (
            <div className="grid grid-cols-12 gap-3 bg-white border border-gray-300 rounded p-2">
              <div className="col-span-3 text-center border-r border-gray-200">
                <p className="text-xs text-gray-500 mb-0.5">订单金额 Order Amount</p>
                <p className="text-sm font-bold text-blue-600">${selectedOrder.amount.toLocaleString()}</p>
              </div>
              {selectedOrder.isTaxable && (
                <>
                  <div className="col-span-3 text-center border-r border-gray-200">
                    <p className="text-xs text-gray-500 mb-0.5">不含税 Ex-Tax</p>
                    <p className="text-sm font-bold text-gray-700">${selectedOrder.amountWithoutTax.toLocaleString()}</p>
                  </div>
                  <div className="col-span-3 text-center border-r border-gray-200">
                    <p className="text-xs text-gray-500 mb-0.5">增值税 VAT ({selectedOrder.taxRate}%)</p>
                    <p className="text-sm font-bold text-orange-600">${selectedOrder.taxAmount.toLocaleString()}</p>
                  </div>
                </>
              )}
              <div className="col-span-3 text-center">
                <p className="text-xs text-gray-500 mb-0.5">完成进度 Progress</p>
                <div className="flex items-center justify-center gap-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: `${calculateProgress()}%` }} />
                  </div>
                  <p className="text-sm font-bold text-green-600 w-10 text-right">{calculateProgress()}%</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 流程节点表格 - 分阶段 */}
      {phases.map(phase => {
        const phaseStages = workflowStages.filter(s => {
          if (s.id === 15 && selectedOrder && !selectedOrder.isTaxable) return false;
          return s.phase === phase.key;
        });

        if (phaseStages.length === 0) return null;

        const isPhaseExpanded = expandedPhases.includes(phase.key);
        const phaseCompletedCount = phaseStages.filter(s => s.status === 'completed').length;
        const phaseProgress = Math.round((phaseCompletedCount / phaseStages.length) * 100);

        return (
          <div key={phase.key} className="bg-white border-2 border-gray-300 rounded-lg shadow-sm overflow-hidden">
            {/* 阶段标题栏 */}
            <div 
              className={`px-4 py-2 cursor-pointer hover:bg-gray-50 transition-colors border-b-2 border-gray-300 bg-gradient-to-r ${
                phase.color === 'blue' ? 'from-blue-50 to-blue-100' :
                phase.color === 'purple' ? 'from-purple-50 to-purple-100' :
                phase.color === 'orange' ? 'from-orange-50 to-orange-100' :
                phase.color === 'green' ? 'from-green-50 to-green-100' :
                phase.color === 'cyan' ? 'from-cyan-50 to-cyan-100' :
                'from-gray-50 to-gray-100'
              }`}
              onClick={() => togglePhase(phase.key)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {isPhaseExpanded ? (
                    <ChevronDown className="w-4 h-4 text-gray-600" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-600" />
                  )}
                  <h3 className="font-bold text-gray-900" style={{ fontSize: '13px' }}>
                    {phase.label}
                  </h3>
                  <Badge variant="outline" className="h-5 px-2 text-xs font-medium">
                    {phaseCompletedCount}/{phaseStages.length} 已完成
                  </Badge>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-200 rounded-full h-1.5">
                      <div 
                        className={`h-1.5 rounded-full ${
                          phase.color === 'blue' ? 'bg-blue-600' :
                          phase.color === 'purple' ? 'bg-purple-600' :
                          phase.color === 'orange' ? 'bg-orange-600' :
                          phase.color === 'green' ? 'bg-green-600' :
                          phase.color === 'cyan' ? 'bg-cyan-600' :
                          'bg-gray-600'
                        }`}
                        style={{ width: `${phaseProgress}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-gray-700 w-8 text-right">{phaseProgress}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 阶段内容 - 节点表格 */}
            {isPhaseExpanded && (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-gray-100 border-b-2 border-gray-300">
                    <tr>
                      <th className="px-3 py-2 text-left font-bold text-gray-700 w-12">#</th>
                      <th className="px-3 py-2 text-left font-bold text-gray-700">节点名称</th>
                      <th className="px-3 py-2 text-center font-bold text-gray-700 w-24">状态</th>
                      <th className="px-3 py-2 text-center font-bold text-gray-700 w-20">文档数</th>
                      <th className="px-3 py-2 text-left font-bold text-gray-700 w-48">Admin互动</th>
                      <th className="px-3 py-2 text-center font-bold text-gray-700 w-32">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {phaseStages.map((stage, index) => {
                      const isStageExpanded = expandedStages.includes(stage.id);
                      const statusBadge = getStatusBadge(stage.status);
                      const StatusIcon = statusBadge.icon;

                      return (
                        <React.Fragment key={stage.id}>
                          {/* 节点主行 */}
                          <tr className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                            <td className="px-3 py-2 font-bold text-gray-700">{stage.id}</td>
                            <td className="px-3 py-2">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-900">{stage.name}</span>
                                {stage.requiresAdminInteraction && (
                                  <Badge variant="outline" className="h-4 px-1 text-xs bg-orange-50 text-orange-700 border-orange-300">
                                    🔗
                                  </Badge>
                                )}
                              </div>
                            </td>
                            <td className="px-3 py-2">
                              <div className="flex items-center justify-center">
                                <Badge className={`${statusBadge.bg} ${statusBadge.text} border ${statusBadge.border} h-5 px-2 text-xs font-medium`}>
                                  <StatusIcon className="w-3 h-3 mr-1" />
                                  {statusBadge.label}
                                </Badge>
                              </div>
                            </td>
                            <td className="px-3 py-2 text-center">
                              <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                                stage.documents.length > 0 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-400'
                              }`}>
                                {stage.documents.length}
                              </span>
                            </td>
                            <td className="px-3 py-2">
                              {stage.requiresAdminInteraction ? (
                                <div className="flex items-center gap-1.5">
                                  {stage.adminStatus === 'completed' && <CheckCircle className="w-3 h-3 text-green-600" />}
                                  {stage.adminStatus === 'in_progress' && <Clock className="w-3 h-3 text-blue-600" />}
                                  {stage.adminStatus === 'pending' && <AlertCircle className="w-3 h-3 text-orange-600" />}
                                  <span className="text-gray-700">
                                    {stage.adminRole} ({stage.adminPerson})
                                  </span>
                                </div>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="px-3 py-2">
                              <div className="flex items-center justify-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 px-2 text-xs"
                                  onClick={() => toggleStage(stage.id)}
                                >
                                  {isStageExpanded ? (
                                    <>
                                      <ChevronUp className="w-3 h-3 mr-1" />
                                      收起
                                    </>
                                  ) : (
                                    <>
                                      <ChevronDown className="w-3 h-3 mr-1" />
                                      查看
                                    </>
                                  )}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-6 px-2 text-xs bg-blue-50 hover:bg-blue-100 border-blue-300 text-blue-700"
                                  onClick={() => {
                                    if (stage.id === 15 && selectedOrder?.isTaxable) {
                                      setVatDialogOpen(true);
                                    } else {
                                      setUploadTargetStage(stage.id);
                                      setUploadDialogOpen(true);
                                    }
                                  }}
                                >
                                  <Upload className="w-3 h-3 mr-1" />
                                  上传
                                </Button>
                              </div>
                            </td>
                          </tr>

                          {/* 展开的文档列表 */}
                          {isStageExpanded && (
                            <tr className="bg-gray-50 border-b border-gray-200">
                              <td colSpan={6} className="px-6 py-3">
                                {stage.documents.length > 0 ? (
                                  <div className="space-y-1">
                                    <p className="text-xs font-medium text-gray-600 mb-2">📄 文档列表：</p>
                                    {stage.documents.map(doc => (
                                      <div key={doc.id} className="flex items-center justify-between bg-white border border-gray-200 rounded px-3 py-1.5 hover:border-blue-300 transition-colors">
                                        <div className="flex items-center gap-2 flex-1">
                                          <FileText className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                                          <div className="flex-1 min-w-0">
                                            <p className="text-xs font-medium text-gray-900 truncate">{doc.name}</p>
                                          </div>
                                          <span className="text-xs text-gray-500">{doc.size}</span>
                                          <span className="text-xs text-gray-500">{doc.uploadDate}</span>
                                          <span className="text-xs text-gray-600">上传者: {doc.uploadedBy}</span>
                                          {doc.uploadedBy === '您' && (
                                            <Badge className="bg-green-100 text-green-700 border-green-300 text-xs h-4">已上传</Badge>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-1 ml-3">
                                          <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                                            <Eye className="w-3 h-3" />
                                          </Button>
                                          <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                                            <Download className="w-3 h-3" />
                                          </Button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-center py-4 text-gray-400">
                                    <FileText className="w-6 h-6 mx-auto mb-1 opacity-50" />
                                    <p className="text-xs">暂无文档，请点击上传按钮添加</p>
                                  </div>
                                )}

                                {/* Admin状态说明 */}
                                {stage.requiresAdminInteraction && (
                                  <div className={`mt-2 border rounded p-2 text-xs ${
                                    stage.adminStatus === 'completed' ? 'bg-green-50 border-green-200' :
                                    stage.adminStatus === 'in_progress' ? 'bg-blue-50 border-blue-200' :
                                    'bg-orange-50 border-orange-200'
                                  }`}>
                                    <span className="font-medium">🔗 Admin状态: </span>
                                    {stage.adminStatus === 'completed' && `✅ ${stage.adminRole}已完成 (${stage.adminDate})`}
                                    {stage.adminStatus === 'in_progress' && `⏱ ${stage.adminRole}处理中...`}
                                    {stage.adminStatus === 'pending' && `⚠️ 等待${stage.adminRole}处理`}
                                  </div>
                                )}
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}

      {/* 上传文档对话框 */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-blue-600" />
              上传文档到节点
            </DialogTitle>
            <DialogDescription>
              {uploadTargetStage && `节点：${workflowStages.find(s => s.id === uploadTargetStage)?.name}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label className="text-xs text-gray-500 mb-1">选择文件 *</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                <input
                  type="file"
                  id="file-upload-stage"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png,.zip,.xlsx"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <label htmlFor="file-upload-stage" className="cursor-pointer flex flex-col items-center">
                  <Upload className="w-10 h-10 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600 mb-1">点击选择文件或拖拽文件到此处</p>
                  <p className="text-xs text-gray-400">支持 PDF、JPG、PNG、ZIP、Excel，单个文件最大20MB</p>
                </label>
              </div>

              {selectedFiles && selectedFiles.length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-xs text-gray-600">已选择 {selectedFiles.length} 个文件：</p>
                  {Array.from(selectedFiles).map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-2">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{file.name}</p>
                          <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(0)} KB</p>
                        </div>
                      </div>
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <Label className="text-xs text-gray-500 mb-1">备注说明</Label>
              <Textarea
                className="min-h-20"
                value={uploadForm.description}
                onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                style={{ fontSize: '13px' }}
                placeholder="请填写文档相关说明（可选）"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setUploadDialogOpen(false);
              setUploadTargetStage(null);
              setSelectedFiles(null);
            }}>
              取消
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleUploadToStage}>
              <Upload className="w-4 h-4 mr-2" />
              确认上传
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 增值税发票上传对话框（保持不变） */}
      <Dialog open={vatDialogOpen} onOpenChange={setVatDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-blue-600" />
              上传增值税发票
            </DialogTitle>
            <DialogDescription>
              报关出口后，请开具增值税专用发票给COSUN，用于出口退税
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {selectedOrder?.isTaxable && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs font-medium text-blue-900 mb-2">💰 订单税务信息：</p>
                <div className="grid grid-cols-2 gap-2 text-xs text-blue-800">
                  <div>订单类型：含税订单 ({selectedOrder.taxRate}% VAT)</div>
                  <div>含税金额：${selectedOrder.amountWithTax.toLocaleString()}</div>
                  <div>不含税金额：${selectedOrder.amountWithoutTax.toLocaleString()}</div>
                  <div>增值税额：${selectedOrder.taxAmount.toLocaleString()}</div>
                </div>
              </div>
            )}

            <div className="border rounded-lg p-3">
              <h4 className="text-sm font-medium text-gray-900 mb-3">📋 增值税专用发票信息：</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-gray-500 mb-1">发票代码 *</Label>
                  <Input
                    className="h-9"
                    value={vatForm.invoiceCode}
                    onChange={(e) => setVatForm({ ...vatForm, invoiceCode: e.target.value })}
                    placeholder="12位发票代码"
                    maxLength={12}
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-500 mb-1">发票号码 *</Label>
                  <Input
                    className="h-9"
                    value={vatForm.invoiceNumber}
                    onChange={(e) => setVatForm({ ...vatForm, invoiceNumber: e.target.value })}
                    placeholder="8位发票号码"
                    maxLength={8}
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-500 mb-1">开票日期 *</Label>
                  <Input
                    type="date"
                    className="h-9"
                    value={vatForm.invoiceDate}
                    onChange={(e) => setVatForm({ ...vatForm, invoiceDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-500 mb-1">税率 *</Label>
                  <Select value={vatForm.taxRate} onValueChange={(value) => setVatForm({ ...vatForm, taxRate: value })}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="13">13%</SelectItem>
                      <SelectItem value="9">9%</SelectItem>
                      <SelectItem value="6">6%</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div>
              <Label className="text-xs text-gray-500 mb-1">上传发票扫描件 *</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                <input
                  type="file"
                  id="vat-file-upload"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <label htmlFor="vat-file-upload" className="cursor-pointer">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-xs text-gray-600">点击上传：增值税发票、报关单、退税联</p>
                </label>
              </div>

              {selectedFiles && selectedFiles.length > 0 && (
                <div className="mt-2 space-y-1">
                  {Array.from(selectedFiles).map((file, index) => (
                    <div key={index} className="flex items-center gap-2 bg-green-50 border border-green-200 rounded p-2 text-xs">
                      <CheckCircle className="w-3 h-3 text-green-600" />
                      <span>{file.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <p className="text-xs text-orange-800">
                ⚠️ 重要提示：发票需加盖公司发票专用章，报关后30天内必须开具
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setVatDialogOpen(false);
              setSelectedFiles(null);
            }}>
              取消
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleUploadVATInvoice}>
              <Upload className="w-4 h-4 mr-2" />
              提交发票
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}