import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { FileText, Upload, Download, Eye, ChevronDown, ChevronRight, CheckCircle, Clock, AlertCircle, Circle, Package, DollarSign, ClipboardCheck, Truck, FileCheck, RefreshCw, X } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { toast } from 'sonner@2.0.3';

/**
 * 🔥 供应商文档中心 - 订单流程视图
 * 以订单为主线，按业务流程节点归类展示文档
 */
export default function SupplierDocumentsWorkflow() {
  const [selectedOrderId, setSelectedOrderId] = useState('PO-2024-155');
  const [expandedStages, setExpandedStages] = useState<number[]>([1, 2, 3, 4, 5, 6, 7, 8]);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadTargetStage, setUploadTargetStage] = useState<number | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [vatDialogOpen, setVatDialogOpen] = useState(false);

  // 🔥 上传表单
  const [uploadForm, setUploadForm] = useState({
    documentType: '',
    description: ''
  });

  // 🔥 增值税发票表单
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

  // 🔥 模拟订单数据
  const orders = [
    {
      id: 'PO-2024-155',
      customerName: 'ABC Corp',
      amount: 125000,
      currency: 'USD',
      orderDate: '2024-11-10',
      deliveryDate: '2024-12-20',
      isTaxable: true,
      taxRate: 13,
      amountWithTax: 125000,
      amountWithoutTax: 110619,
      taxAmount: 14381,
      progress: 70
    },
    {
      id: 'PO-2024-156',
      customerName: 'XYZ Ltd',
      amount: 89000,
      currency: 'USD',
      orderDate: '2024-11-05',
      deliveryDate: '2024-12-15',
      isTaxable: false,
      taxRate: 0,
      amountWithTax: 89000,
      amountWithoutTax: 89000,
      taxAmount: 0,
      progress: 85
    },
    {
      id: 'PO-2024-157',
      customerName: 'Global Trading',
      amount: 156000,
      currency: 'USD',
      orderDate: '2024-11-15',
      deliveryDate: '2024-12-25',
      isTaxable: true,
      taxRate: 13,
      amountWithTax: 156000,
      amountWithoutTax: 138053,
      taxAmount: 17947,
      progress: 45
    }
  ];

  const selectedOrder = orders.find(o => o.id === selectedOrderId);

  // 🔥 16个业务流程节点定义
  const [workflowStages, setWorkflowStages] = useState([
    {
      id: 1,
      name: '询价阶段',
      key: 'inquiry',
      phase: 'pre-order',
      status: 'completed',
      icon: FileText,
      requiresAdminInteraction: false,
      documents: [
        { id: 1, name: '客户询价单 XJ-2024-001.pdf', uploadDate: '2024-11-05', uploadedBy: 'COSUN管理员', size: '245 KB' },
        { id: 2, name: '初步报价单 Quote-001.pdf', uploadDate: '2024-11-06', uploadedBy: '您', size: '180 KB' },
        { id: 3, name: '技术规格书 Spec-001.pdf', uploadDate: '2024-11-08', uploadedBy: 'COSUN管理员', size: '520 KB' }
      ]
    },
    {
      id: 2,
      name: '订单确认',
      key: 'order_confirmation',
      phase: 'pre-order',
      status: 'completed',
      icon: ClipboardCheck,
      requiresAdminInteraction: false,
      documents: [
        { id: 4, name: '采购订单 PO-2024-155.pdf', uploadDate: '2024-11-10', uploadedBy: 'COSUN管理员', size: '320 KB', isKey: true },
        { id: 5, name: '订单确认函 Confirmation.pdf', uploadDate: '2024-11-11', uploadedBy: '您', size: '156 KB' }
      ]
    },
    {
      id: 3,
      name: '定金确认',
      key: 'deposit_confirmation',
      phase: 'pre-order',
      status: 'completed',
      icon: DollarSign,
      requiresAdminInteraction: true,
      adminInteractionType: 'financial_confirm',
      adminStatus: { status: 'completed', responsibleRole: '财务', responsiblePerson: '王芳', actionDate: '2024-11-12' },
      documents: [
        { id: 6, name: '定金发票 Deposit-Invoice.pdf', uploadDate: '2024-11-12', uploadedBy: '您', size: '180 KB' },
        { id: 7, name: '收款水单 Payment-Receipt.pdf', uploadDate: '2024-11-12', uploadedBy: '您', size: '125 KB' }
      ]
    },
    {
      id: 4,
      name: '产前样确认',
      key: 'pre_sample',
      phase: 'sample',
      status: 'completed',
      icon: Package,
      requiresAdminInteraction: true,
      adminInteractionType: 'business_approve',
      adminStatus: { status: 'completed', responsibleRole: '业务员', responsiblePerson: '李业务员', actionDate: '2024-11-18' },
      documents: [
        { id: 8, name: '产前样照片 Pre-Sample-Photos.zip', uploadDate: '2024-11-15', uploadedBy: '您', size: '8.5 MB' },
        { id: 9, name: '产前样报告 Pre-Sample-Report.pdf', uploadDate: '2024-11-16', uploadedBy: '您', size: '1.2 MB' },
        { id: 10, name: '快递单号 SF-1234567890.pdf', uploadDate: '2024-11-15', uploadedBy: '您', size: '85 KB' },
        { id: 11, name: 'COSUN确认函 Approval-Letter.pdf', uploadDate: '2024-11-18', uploadedBy: 'COSUN管理员', size: '156 KB' }
      ]
    },
    {
      id: 5,
      name: '生产准备',
      key: 'production_preparation',
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
      key: 'production_sample',
      phase: 'sample',
      status: 'completed',
      icon: Package,
      requiresAdminInteraction: true,
      adminInteractionType: 'business_approve',
      adminStatus: { status: 'completed', responsibleRole: '业务员', responsiblePerson: '李业务员', actionDate: '2024-11-27' },
      documents: [
        { id: 16, name: '大货样照片 Production-Sample.zip', uploadDate: '2024-11-25', uploadedBy: '您', size: '12.5 MB' },
        { id: 17, name: '大货样检验报告 Sample-QC.pdf', uploadDate: '2024-11-26', uploadedBy: '您', size: '1.8 MB' },
        { id: 18, name: 'COSUN确认函 Approval-Letter-2.pdf', uploadDate: '2024-11-27', uploadedBy: 'COSUN管理员', size: '165 KB' }
      ]
    },
    {
      id: 7,
      name: '生产过程',
      key: 'production',
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
      key: 'production_qc',
      phase: 'production',
      status: 'completed',
      icon: ClipboardCheck,
      requiresAdminInteraction: true,
      adminInteractionType: 'qc_review',
      adminStatus: { status: 'completed', responsibleRole: 'QC部门', responsiblePerson: '张质检', actionDate: '2024-12-10' },
      documents: [
        { id: 24, name: '内部质检报告-原料 Raw-Material-QC.pdf', uploadDate: '2024-12-03', uploadedBy: '您', size: '1.5 MB' },
        { id: 25, name: '内部质检报告-过程 In-process-QC.pdf', uploadDate: '2024-12-07', uploadedBy: '您', size: '2.1 MB' },
        { id: 26, name: '内部质检报告-成品 Finished-QC.pdf', uploadDate: '2024-12-10', uploadedBy: '您', size: '2.8 MB' }
      ]
    },
    {
      id: 9,
      name: '验货准备',
      key: 'inspection_preparation',
      phase: 'inspection',
      status: 'completed',
      icon: AlertCircle,
      requiresAdminInteraction: true,
      adminInteractionType: 'arrange_inspection',
      adminStatus: { status: 'completed', responsibleRole: '单证员', responsiblePerson: '张三', actionDate: '2024-12-13' },
      documents: [
        { id: 27, name: '验货通知函 Inspection-Notice.pdf', uploadDate: '2024-12-12', uploadedBy: '您', size: '180 KB' },
        { id: 28, name: '验货排期表 Inspection-Schedule.pdf', uploadDate: '2024-12-13', uploadedBy: 'COSUN管理员', size: '125 KB' }
      ]
    },
    {
      id: 10,
      name: '验货实施',
      key: 'inspection',
      phase: 'inspection',
      status: 'completed',
      icon: CheckCircle,
      requiresAdminInteraction: true,
      adminInteractionType: 'inspection_execute',
      adminStatus: { status: 'completed', responsibleRole: '验货员', responsiblePerson: '张三', actionDate: '2024-12-15' },
      documents: [
        { id: 29, name: '验货报告 Inspection-Report.pdf', uploadDate: '2024-12-15', uploadedBy: 'COSUN管理员', size: '3.2 MB' },
        { id: 30, name: '验货照片 Inspection-Photos.zip', uploadDate: '2024-12-15', uploadedBy: 'COSUN管理员', size: '25.6 MB' },
        { id: 31, name: '验货合格证明 Pass-Certificate.pdf', uploadDate: '2024-12-15', uploadedBy: 'COSUN管理员', size: '220 KB' }
      ]
    },
    {
      id: 11,
      name: '包装完成',
      key: 'packing',
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
      key: 'shipping_preparation',
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
      key: 'balance_confirmation',
      phase: 'shipping',
      status: 'in_progress',
      icon: DollarSign,
      requiresAdminInteraction: true,
      adminInteractionType: 'financial_confirm',
      adminStatus: { status: 'in_progress', responsibleRole: '财务', responsiblePerson: '王芳' },
      documents: [
        { id: 40, name: '余款发票 Balance-Invoice.pdf', uploadDate: '2024-12-18', uploadedBy: '您', size: '185 KB' }
      ]
    },
    {
      id: 14,
      name: '出库发运',
      key: 'warehouse_release',
      phase: 'shipping',
      status: 'in_progress',
      icon: Truck,
      requiresAdminInteraction: true,
      adminInteractionType: 'documentation',
      adminStatus: { status: 'in_progress', responsibleRole: '单证员', responsiblePerson: '张三' },
      documents: [
        { id: 41, name: '出库通知 Warehouse-Release.pdf', uploadDate: '2024-12-19', uploadedBy: '您', size: '180 KB' },
        { id: 42, name: '货运订舱单 Booking-Confirm.pdf', uploadDate: '2024-12-19', uploadedBy: '您', size: '220 KB' }
      ]
    },
    {
      id: 15,
      name: '增值税发票',
      key: 'vat_invoice',
      phase: 'shipping',
      status: 'pending',
      icon: FileCheck,
      requiresAdminInteraction: true,
      adminInteractionType: 'financial_confirm',
      adminStatus: { status: 'pending', responsibleRole: '财务', responsiblePerson: '王芳' },
      documents: [],
      isTaxableOnly: true // 仅含税订单需要
    },
    {
      id: 16,
      name: '交付完成',
      key: 'delivery_complete',
      phase: 'complete',
      status: 'pending',
      icon: CheckCircle,
      requiresAdminInteraction: false,
      documents: []
    }
  ]);

  // 🔥 节点展开/折叠
  const toggleStage = (stageId: number) => {
    if (expandedStages.includes(stageId)) {
      setExpandedStages(expandedStages.filter(id => id !== stageId));
    } else {
      setExpandedStages([...expandedStages, stageId]);
    }
  };

  // 🔥 全部展开/折叠
  const toggleAllStages = () => {
    if (expandedStages.length === workflowStages.length) {
      setExpandedStages([]);
    } else {
      setExpandedStages(workflowStages.map(s => s.id));
    }
  };

  // 🔥 获取节点状态样式
  const getStageStatusStyle = (status: string) => {
    const styles: any = {
      completed: { bg: 'bg-green-50', border: 'border-green-300', text: 'text-green-700', icon: CheckCircle, iconColor: 'text-green-600' },
      in_progress: { bg: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-700', icon: Clock, iconColor: 'text-blue-600' },
      pending: { bg: 'bg-gray-50', border: 'border-gray-300', text: 'text-gray-600', icon: Circle, iconColor: 'text-gray-400' },
      blocked: { bg: 'bg-orange-50', border: 'border-orange-300', text: 'text-orange-700', icon: AlertCircle, iconColor: 'text-orange-600' }
    };
    return styles[status] || styles.pending;
  };

  // 🔥 获取阶段标签
  const getPhaseLabel = (phase: string) => {
    const labels: any = {
      'pre-order': '订单前期阶段',
      'sample': '样品确认阶段',
      'production': '生产执行阶段',
      'inspection': '验货与包装阶段',
      'shipping': '发货与收款阶段',
      'complete': '交付完成'
    };
    return labels[phase] || phase;
  };

  // 🔥 处理文件选择
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const maxSize = 20 * 1024 * 1024;
      const oversizedFiles = Array.from(e.target.files).filter(file => file.size > maxSize);
      
      if (oversizedFiles.length > 0) {
        toast.error('文件过大', {
          description: `${oversizedFiles[0].name} 超过20MB限制`
        });
        return;
      }
      
      setSelectedFiles(e.target.files);
    }
  };

  // 🔥 上传文档到节点
  const handleUploadToStage = () => {
    if (!uploadTargetStage) return;
    if (!selectedFiles || selectedFiles.length === 0) {
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

    // 更新节点文档
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

  // 🔥 上传增值税发票
  const handleUploadVATInvoice = () => {
    if (!vatForm.invoiceCode) {
      toast.error('请输入发票代码');
      return;
    }
    if (!vatForm.invoiceNumber) {
      toast.error('请输入发票号码');
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
        return {
          ...stage,
          documents: vatDocuments,
          status: 'in_progress',
          adminStatus: { status: 'pending', responsibleRole: '财务', responsiblePerson: '王芳' }
        };
      }
      return stage;
    });

    setWorkflowStages(updatedStages);

    toast.success('增值税发票上传成功！', {
      description: `发票号码：${vatForm.invoiceNumber} | 金额：¥${vatForm.totalAmount}`
    });

    setVatDialogOpen(false);
    setSelectedFiles(null);
    setVatForm({
      invoiceCode: '',
      invoiceNumber: '',
      invoiceDate: '',
      amountWithoutTax: '802212.00',
      taxRate: '13',
      taxAmount: '104238.00',
      totalAmount: '906250.00',
      notes: ''
    });
  };

  // 🔥 计算整体进度
  const calculateProgress = () => {
    const completedStages = workflowStages.filter(s => {
      // 增值税发票节点：不含税订单自动完成
      if (s.id === 15 && selectedOrder && !selectedOrder.isTaxable) {
        return true;
      }
      return s.status === 'completed';
    }).length;
    
    return Math.round((completedStages / workflowStages.length) * 100);
  };

  return (
    <div className="space-y-4">
      {/* 页面标题 + 订单选择 */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900" style={{ fontSize: '16px' }}>文档中心 - 订单流程视图</h2>
              <p className="text-xs text-gray-500">以订单为主线，按业务流程归类展示文档</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={toggleAllStages}
            className="text-xs"
          >
            {expandedStages.length === workflowStages.length ? '全部折叠' : '全部展开'}
          </Button>
        </div>

        {/* 订单选择器 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-gray-500 mb-1">选择订单</Label>
            <Select value={selectedOrderId} onValueChange={setSelectedOrderId}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {orders.map(order => (
                  <SelectItem key={order.id} value={order.id}>
                    {order.id} - COSUN ({order.customerName}) - ${order.amount.toLocaleString()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {selectedOrder && (
            <div className="flex items-end">
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2 text-xs">
                  {selectedOrder.isTaxable ? (
                    <Badge className="bg-blue-100 text-blue-800 border-blue-300">
                      含税订单 ({selectedOrder.taxRate}% VAT)
                    </Badge>
                  ) : (
                    <Badge className="bg-gray-100 text-gray-800 border-gray-300">
                      不含税订单
                    </Badge>
                  )}
                  <span className="text-gray-500">下单：{selectedOrder.orderDate}</span>
                  <span className="text-gray-500">交期：{selectedOrder.deliveryDate}</span>
                </div>
                <div className="text-xs text-gray-600">
                  {selectedOrder.isTaxable && (
                    <>
                      含税金额：${selectedOrder.amountWithTax.toLocaleString()} | 
                      不含税：${selectedOrder.amountWithoutTax.toLocaleString()} | 
                      税额：${selectedOrder.taxAmount.toLocaleString()}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 整体进度条 */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-600">订单进度</span>
            <span className="text-xs font-medium text-blue-600">{calculateProgress()}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all" 
              style={{ width: `${calculateProgress()}%` }}
            />
          </div>
        </div>
      </div>

      {/* 流程节点时间线 */}
      <div className="space-y-3">
        {/* 按阶段分组 */}
        {['pre-order', 'sample', 'production', 'inspection', 'shipping', 'complete'].map(phase => {
          const phaseStages = workflowStages.filter(s => {
            // 增值税发票节点：不含税订单不显示
            if (s.id === 15 && selectedOrder && !selectedOrder.isTaxable) {
              return false;
            }
            return s.phase === phase;
          });

          if (phaseStages.length === 0) return null;

          return (
            <div key={phase}>
              {/* 阶段标题 */}
              <div className="flex items-center gap-2 mb-2">
                <div className="h-px flex-1 bg-gray-300" />
                <span className="text-xs font-medium text-gray-600 px-3 py-1 bg-gray-100 rounded-full">
                  {getPhaseLabel(phase)}
                </span>
                <div className="h-px flex-1 bg-gray-300" />
              </div>

              {/* 节点列表 */}
              {phaseStages.map((stage, index) => {
                const isExpanded = expandedStages.includes(stage.id);
                const statusStyle = getStageStatusStyle(stage.status);
                const StatusIcon = statusStyle.icon;
                const StageIcon = stage.icon;

                return (
                  <div key={stage.id} className="relative">
                    {/* 连接线 */}
                    {index < phaseStages.length - 1 && (
                      <div className="absolute left-4 top-12 bottom-0 w-0.5 bg-gray-300" />
                    )}

                    {/* 节点卡片 */}
                    <div className={`bg-white border-2 rounded-lg overflow-hidden ${statusStyle.border}`}>
                      {/* 节点标题 */}
                      <div 
                        className={`p-3 cursor-pointer hover:bg-opacity-80 transition-colors ${statusStyle.bg}`}
                        onClick={() => toggleStage(stage.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${statusStyle.bg} border-2 ${statusStyle.border}`}>
                              <StatusIcon className={`w-4 h-4 ${statusStyle.iconColor}`} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <StageIcon className={`w-4 h-4 ${statusStyle.text}`} />
                                <span className={`font-medium ${statusStyle.text}`} style={{ fontSize: '14px' }}>
                                  {stage.id}. {stage.name}
                                </span>
                                {stage.requiresAdminInteraction && (
                                  <Badge variant="outline" className="h-4 px-1.5 text-xs bg-orange-50 text-orange-700 border-orange-300">
                                    🔗 Admin互动
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-gray-500">
                                  {stage.documents.length} 个文档
                                </span>
                                {stage.adminStatus && (
                                  <span className="text-xs text-blue-600">
                                    {stage.adminStatus.status === 'completed' && '✅'}
                                    {stage.adminStatus.status === 'in_progress' && '⏱'}
                                    {stage.adminStatus.status === 'pending' && '⚠️'}
                                    {' '}
                                    {stage.adminStatus.responsibleRole}
                                    {stage.adminStatus.responsiblePerson && `: ${stage.adminStatus.responsiblePerson}`}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-gray-400" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-gray-400" />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* 文档列表（展开时显示） */}
                      {isExpanded && (
                        <div className="border-t border-gray-200 p-3 space-y-2">
                          {/* 增值税发票节点特殊说明 */}
                          {stage.id === 15 && selectedOrder?.isTaxable && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                              <p className="text-xs font-medium text-blue-900 mb-2">💰 税务信息：</p>
                              <div className="grid grid-cols-2 gap-2 text-xs text-blue-800">
                                <div>订单类型：含税订单 ({selectedOrder.taxRate}% VAT)</div>
                                <div>含税金额：${selectedOrder.amountWithTax.toLocaleString()}</div>
                                <div>不含税金额：${selectedOrder.amountWithoutTax.toLocaleString()}</div>
                                <div>增值税额：${selectedOrder.taxAmount.toLocaleString()}</div>
                              </div>
                              <p className="text-xs text-blue-700 mt-2">
                                ⚠️ 报关出口后30天内需开具增值税发票，用于COSUN申请出口退税
                              </p>
                            </div>
                          )}

                          {/* 文档列表 */}
                          {stage.documents.length > 0 ? (
                            stage.documents.map(doc => (
                              <div key={doc.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-2 hover:bg-gray-100 transition-colors">
                                <div className="flex items-center gap-2 flex-1">
                                  <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">{doc.name}</p>
                                    <div className="flex items-center gap-3 text-xs text-gray-500">
                                      <span>上传者：{doc.uploadedBy}</span>
                                      <span>{doc.uploadDate}</span>
                                      <span>{doc.size}</span>
                                    </div>
                                  </div>
                                  {doc.uploadedBy === '您' && (
                                    <Badge className="bg-green-100 text-green-700 border-green-300 text-xs">
                                      已上传
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-1 ml-2">
                                  <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                                    <Eye className="w-3 h-3 mr-1" />
                                    预览
                                  </Button>
                                  <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                                    <Download className="w-3 h-3 mr-1" />
                                    下载
                                  </Button>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-6 text-gray-400">
                              <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                              <p className="text-xs">暂无文档</p>
                            </div>
                          )}

                          {/* Admin端状态说明 */}
                          {stage.requiresAdminInteraction && stage.adminStatus && (
                            <div className={`border rounded-lg p-2 mt-3 ${
                              stage.adminStatus.status === 'completed' ? 'bg-green-50 border-green-200' :
                              stage.adminStatus.status === 'in_progress' ? 'bg-blue-50 border-blue-200' :
                              'bg-orange-50 border-orange-200'
                            }`}>
                              <p className="text-xs font-medium mb-1">
                                🔗 Admin端状态：
                              </p>
                              <p className="text-xs">
                                {stage.adminStatus.status === 'completed' && '✅ '}
                                {stage.adminStatus.status === 'in_progress' && '⏱ '}
                                {stage.adminStatus.status === 'pending' && '⚠️ '}
                                {stage.adminStatus.responsibleRole}
                                {stage.adminStatus.responsiblePerson && ` (${stage.adminStatus.responsiblePerson})`}
                                {stage.adminStatus.status === 'completed' && stage.adminStatus.actionDate && ` - 已完成于 ${stage.adminStatus.actionDate}`}
                                {stage.adminStatus.status === 'in_progress' && ' - 处理中...'}
                                {stage.adminStatus.status === 'pending' && ' - 等待处理'}
                              </p>
                            </div>
                          )}

                          {/* 上传按钮 */}
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full mt-2 text-xs"
                            onClick={() => {
                              if (stage.id === 15 && selectedOrder?.isTaxable) {
                                // 增值税发票专用上传
                                setVatDialogOpen(true);
                              } else {
                                // 普通文档上传
                                setUploadTargetStage(stage.id);
                                setUploadDialogOpen(true);
                              }
                            }}
                          >
                            <Upload className="w-3 h-3 mr-1" />
                            上传文档到此节点
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

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
            {/* 文件上传 */}
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

            {/* 备注说明 */}
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

      {/* 增值税发票上传对话框 */}
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
            {/* 订单税务信息 */}
            {selectedOrder?.isTaxable && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs font-medium text-blue-900 mb-2">💰 订单税务信息：</p>
                <div className="grid grid-cols-2 gap-2 text-xs text-blue-800">
                  <div>订单类型：含税订单 ({selectedOrder.taxRate}% VAT)</div>
                  <div>含税金额：${selectedOrder.amountWithTax.toLocaleString()} (≈ ¥{(selectedOrder.amountWithTax * 7.25).toLocaleString()})</div>
                  <div>不含税金额：${selectedOrder.amountWithoutTax.toLocaleString()} (≈ ¥{(selectedOrder.amountWithoutTax * 7.25).toLocaleString()})</div>
                  <div>增值税额：${selectedOrder.taxAmount.toLocaleString()} (≈ ¥{(selectedOrder.taxAmount * 7.25).toLocaleString()})</div>
                </div>
              </div>
            )}

            {/* 发票信息 */}
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
                <div>
                  <Label className="text-xs text-gray-500 mb-1">不含税金额（¥）</Label>
                  <Input className="h-9 bg-gray-50" value={vatForm.amountWithoutTax} readOnly />
                </div>
                <div>
                  <Label className="text-xs text-gray-500 mb-1">税额（¥）</Label>
                  <Input className="h-9 bg-gray-50" value={vatForm.taxAmount} readOnly />
                </div>
                <div className="col-span-2">
                  <Label className="text-xs text-gray-500 mb-1">价税合计（¥）</Label>
                  <Input className="h-9 bg-gray-50 font-medium" value={vatForm.totalAmount} readOnly />
                </div>
              </div>
            </div>

            {/* 文件上传 */}
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

            {/* 备注 */}
            <div>
              <Label className="text-xs text-gray-500 mb-1">备注说明</Label>
              <Textarea
                className="min-h-16"
                value={vatForm.notes}
                onChange={(e) => setVatForm({ ...vatForm, notes: e.target.value })}
                placeholder="请填写备注（可选）"
              />
            </div>

            {/* 提示 */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <p className="text-xs text-orange-800">
                ⚠️ 重要提示：
              </p>
              <ul className="list-disc list-inside text-xs text-orange-700 mt-1 space-y-1">
                <li>发票需加盖公司发票专用章</li>
                <li>发票金额需与采购订单金额一致</li>
                <li>报关后30天内必须开具</li>
                <li>此发票用于COSUN申请出口退税</li>
              </ul>
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
