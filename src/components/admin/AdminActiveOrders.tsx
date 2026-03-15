import React, { useState, useRef, useEffect } from 'react';
import { Eye, Edit, CheckCircle, XCircle, Truck, Package, Clock, Search, DollarSign, Trash2, Printer, FileText, Download, Send, ShoppingCart, RefreshCw } from 'lucide-react';
import { useOrders, Order } from '../../contexts/OrderContext';
import { sendNotificationToUser } from '../../utils/notificationUtils';
import { useQuoteRequirements } from '../../contexts/QuoteRequirementContext';
import { SalesContractDocument } from '../documents/templates/SalesContractDocument';
import { adaptOrderToSalesContract } from '../../utils/documentDataAdapters';
import { buildQuoteRequirementDocumentSnapshot } from './purchase-order/purchaseOrderUtils';
import { PaymentProofDialog } from './PaymentProofDialog';
import { UploadPaymentProofDialog } from './UploadPaymentProofDialog';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Checkbox } from '../ui/checkbox';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../ui/select';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '../ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { toast } from 'sonner';

export default function AdminActiveOrders() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [deleteOrderState, setDeleteOrderState] = useState<any>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  
  // 🎯 多维度筛选状态 (老板角色专用)
  const [filterRegion, setFilterRegion] = useState('all');
  const [filterCustomer, setFilterCustomer] = useState('all');
  
  // 🔥 批量选择和删除状态
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // 🌍 获取当前用户角色
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  
  React.useEffect(() => {
    const currentUserStr = localStorage.getItem('cosun_current_user');
    if (currentUserStr) {
      try {
        const currentUser = JSON.parse(currentUserStr);
        setCurrentUserRole(currentUser.userRole || currentUser.role || null);
      } catch (e) {
        console.error('Failed to parse current user:', e);
      }
    }
  }, []);
  
  // 付款凭证查看Dialog状态
  const [isPaymentProofOpen, setIsPaymentProofOpen] = useState(false);
  const [paymentProofOrder, setPaymentProofOrder] = useState<any>(null);
  
  // 🔥 下推采购相关状态
  const [pushToPurchaseOrder, setPushToPurchaseOrder] = useState<any>(null);
  const [showDepositDialog, setShowDepositDialog] = useState(false);
  
  // 🔥 上传凭证Dialog状态
  const [isUploadProofOpen, setIsUploadProofOpen] = useState(false);
  const [uploadProofOrder, setUploadProofOrder] = useState<any>(null);
  
  // 合同条款编辑状态
  const [contractTerms, setContractTerms] = useState({
    paymentTerms: '30% T/T deposit, 70% balance before shipment',
    deliveryTerms: 'FOB Fuzhou, China (福州FOB)',
    shippingMethod: 'Sea Freight 海运',
    expectedDelivery: '',
    qualityStandards: 'The products shall comply with international quality standards and the specifications agreed upon in this contract.',
    warrantyTerms: '12-month warranty from date of shipment',
    remarks: ''
  });

  // 原生打印函数 - 使用浏览器打印API
  const handlePrint = () => {
    window.print();
  };

  // 使用OrderContext获取订单数据
  const { orders: contextOrders, deleteOrder: removeOrder, updateOrder, clearAllOrders } = useOrders();
  
  // 使用采购需求Context
  const { addRequirement } = useQuoteRequirements();

  // 🔥 禁用自动生成测试数据（用户要求不要自动创建数据）
  // React.useEffect(() => {
  //   if ((contextOrders || []).length === 0) {
  //     console.log('检测到空订单，自动生成测试数据');
  //     generateTestOrders();
  //     // 刷新页面以加载新数据
  //     setTimeout(() => {
  //       window.location.reload();
  //     }, 500);
  //   }
  // }, []); // 只在首次加载时执行

  // 调试：监控订单数据变化
  React.useEffect(() => {
    console.log('订单数据更新');
    console.log('  - 订单总数:', (contextOrders || []).length);
    
    // 检查是否有订单包含depositPaymentProof
    const ordersWithProof = (contextOrders || []).filter(o => o.depositPaymentProof);
    console.log('  - 包含付款凭证的订单数:', ordersWithProof.length);
    
    if (ordersWithProof.length > 0) {
      console.log('  - 付款凭证详情:');
      ordersWithProof.forEach(o => {
        console.log(`    • ${o.orderNumber}: 金额=${o.depositPaymentProof?.amount}, 上传时间=${o.depositPaymentProof?.uploadedAt}`);
      });
    }
  }, [contextOrders]);

  // 🔥 下推采购请求 - 从销售订单创建采购需求
  const handlePushToPurchase = (order: any) => {
    const fullOrder = contextOrders.find(o => o.orderNumber === order.id);
    
    if (!fullOrder) {
      toast.error('订单信息不完整');
      return;
    }

    // 检查是否已收到定金
    if (!fullOrder.depositPaymentProof) {
      // 显示专业的定金凭证对话框
      setPushToPurchaseOrder(fullOrder);
      setShowDepositDialog(true);
      return;
    }

    // 定金验证通过，开始创建采购需求
    executePushToPurchase(fullOrder);
  };

  // 🔥 执行下推采购逻辑 - 重构为生成一个合并的采购需求
  const executePushToPurchase = (fullOrder: any) => {
    console.log('🚀 ========================================');
    console.log('🚀 开始执行下推采购逻辑（合并模式）');
    console.log('🚀 ========================================');
    console.log('  - 订单信息:', fullOrder);
    console.log('  - 订单编号:', fullOrder.orderNumber);
    console.log('  - 客户:', fullOrder.customer);
    console.log('  - 产品数组:', fullOrder.products);
    console.log('  - 产品数量:', fullOrder.products?.length || 0);
    
    if (!fullOrder.products || fullOrder.products.length === 0) {
      console.error('❌ 订单没有产品！');
      toast.error('订单没有产品，无法创建采购需求');
      return;
    }
    
    // 🔥 生成统一的采购需求编号
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const requirementNo = `PR-${dateStr}-${String(Date.now()).slice(-3)}`;

    // 🔥 将所有产品转换为items数组
    const items = fullOrder.products.map((product, index) => ({
      id: `item-${Date.now()}-${index}`,
      productName: product.name,
      modelNo: product.specs || 'N/A',
      specification: product.specs,
      quantity: product.quantity,
      unit: '个',
      targetPrice: product.unitPrice,
      targetCurrency: fullOrder.currency,
      remarks: ''
    }));

    // 🔥 创建一个合并的采购需求
    const requirementData = {
      id: `req-${Date.now()}`,
      requirementNo: requirementNo,
      source: '销售订单',
      sourceRef: fullOrder.orderNumber,
      requiredDate: fullOrder.expectedDelivery,
      urgency: 'high' as const,
      status: 'pending' as const,
      createdBy: `业务员-${fullOrder.customer}`,
      createdDate: today.toISOString().split('T')[0],
      salesOrderNo: fullOrder.orderNumber,
      customerName: fullOrder.customer,
      salesPerson: fullOrder.customer,
      specialRequirements: fullOrder.notes || '',
      items: items, // 🔥 包含所有产品项
      templateSnapshot: { pendingResolution: true },
      documentDataSnapshot: buildQuoteRequirementDocumentSnapshot({
        requirementNo,
        sourceRef: fullOrder.orderNumber,
        requiredDate: fullOrder.expectedDelivery,
        createdBy: `业务员-${fullOrder.customer}`,
        items,
      } as any),
    };
    
    console.log(`  📦 合并采购需求:`, requirementNo);
    console.log(`     - 包含产品数量:`, items.length);
    console.log(`     - 产品清单:`, items.map(i => i.productName).join(', '));
    
    try {
      console.log(`     🔄 调用 addRequirement...`);
      await addRequirement(requirementData);
      console.log(`     ✅ 采购需求创建成功`);
      
      console.log(`\n✅ ✅ ✅ 下推采购完成！已创建采购需求 ${requirementNo}\n`);
      console.log('🚀 ========================================\n');

      toast.success(
        <div>
          <p className="font-semibold">✅ 采购请求下推成功！</p>
          <p className="text-xs mt-1">需求编号: {requirementNo}</p>
          <p className="text-xs">包含 {items.length} 个产品</p>
          <p className="text-xs">订单号: {fullOrder.orderNumber}</p>
          <p className="text-xs text-blue-600 mt-1">👉 请前往【供应链管理 → 采购订单管理 → 采购需求池】查看</p>
        </div>,
        { duration: 6000 }
      );
    } catch (error) {
      console.error(`     ❌ 采购需求创建失败:`, error);
      toast.error('创建采购需求失败，请重试');
    }
  };

  // 转换OrderContext的订单格式为当前组件使用的格式
  const orders = (contextOrders || []).map(order => ({
    id: order.orderNumber,
    customer: order.customer,
    quotationId: order.quotationNumber || order.quotationId,
    date: order.date,
    expectedDelivery: order.expectedDelivery,
    totalAmount: order.totalAmount,
    status: order.status,
    progress: order.progress,
    products: order.products,
    paymentStatus: order.paymentStatus,
    shippingMethod: order.shippingMethod,
    trackingNumber: order.trackingNumber,
    region: order.region // 🌍 传递区域信息
  }));
  
  // 🔍 调试：打印订单数据
  React.useEffect(() => {
    console.log('📦 [AdminActiveOrders] 订单数据加载完成:');
    console.log(`  - 总订单数: ${orders.length}`);
    orders.forEach(o => {
      console.log(`  • ${o.id} - 客户: ${o.customer} - 区域: ${o.region || '未设置'} - 报价单号: ${o.quotationId}`);
    });
  }, [orders.length]);
  
  // 🔥 监听订单更新事件，自动刷新数据
  React.useEffect(() => {
    const handleOrdersUpdated = (event: any) => {
      console.log('🔔 [AdminActiveOrders] 接收到订单更新事件:', event.detail);
      console.log('  - 操作类型:', event.detail?.action);
      console.log('  - 订单编号:', event.detail?.orderNumber);
      console.log('  - 客户邮箱:', event.detail?.customerEmail);
      
      // 强制刷新：触发组件重新渲染
      // React会自动通过contextOrders的变化来更新组件
      console.log('  - 当前订单总数:', (contextOrders || []).length);
      console.log('  - 🔄 等待Context自动刷新...');
    };
    
    window.addEventListener('ordersUpdated', handleOrdersUpdated);
    console.log('👂 [AdminActiveOrders] 已注册ordersUpdated事件监听器');
    
    return () => {
      window.removeEventListener('ordersUpdated', handleOrdersUpdated);
      console.log('🚪 [AdminActiveOrders] 已移除ordersUpdated事件监听器');
    };
  }, [(contextOrders || []).length]);

  const filteredOrders = orders.filter((order) => {
    const matchesSearch = order.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || order.status === filterStatus;
    
    // 🎯 多维度筛选
    const matchesRegion = filterRegion === 'all' || order.region === filterRegion;
    const matchesCustomer = filterCustomer === 'all' || order.customer === filterCustomer;
    
    return matchesSearch && matchesFilter && matchesRegion && matchesCustomer;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'bg-gray-500';
      case 'In Production':
        return 'bg-blue-500';
      case 'Quality Inspection':
        return 'bg-yellow-500';
      case 'Ready to Ship':
        return 'bg-green-500';
      case 'Shipped':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'Pending':
        return { label: '待处理', color: 'bg-gray-100 text-gray-700 border-gray-300' };
      case 'Awaiting Deposit':
        return { label: '等待定金', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' };
      case 'Payment Proof Uploaded':
        return { label: '已上传付款凭证', color: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 'Deposit Received':
        return { label: '定金已收到', color: 'bg-green-50 text-green-700 border-green-200' };
      case 'Preparing Production':
        return { label: '准备生产', color: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'In Production':
        return { label: '生产中', color: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'Quality Inspection':
        return { label: '质检中', color: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'Ready to Ship':
        return { label: '待发货', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'Shipped':
        return { label: '已发货', color: 'bg-purple-50 text-purple-700 border-purple-200' };
      default:
        return { label: status, color: 'bg-gray-100 text-gray-700 border-gray-300' };
    }
  };

  const getPaymentStatusConfig = (status: string) => {
    switch (status) {
      case 'Pending Payment':
        return { label: '待付款', color: 'bg-rose-50 text-rose-700 border-rose-200' };
      case 'Partial Payment':
        return { label: '部分付款', color: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'Paid':
        return { label: '已付款', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      default:
        return { label: status || '待付款', color: 'bg-gray-100 text-gray-700 border-gray-300' };
    }
  };

  const handleUpdateStatus = (orderId: string, newStatus: string) => {
    toast.success(`Order ${orderId} status updated to ${newStatus}`);
  };

  const handleDeleteOrder = (orderId: string) => {
    removeOrder(orderId);
    toast.success(`Order ${orderId} has been deleted`);
  };

  // 🔥 批量删除处理函数
  const handleBulkDelete = () => {
    const visibleSelectedIds = Array.from(selectedIds).filter((id) =>
      filteredOrders.some((order) => order.id === id),
    );

    if (visibleSelectedIds.length === 0) {
      toast.error('请先选择要删除的订单');
      return;
    }

    if (window.confirm(`确认要删除选中的 ${visibleSelectedIds.length} 条订单吗？此操作无法撤销！`)) {
      visibleSelectedIds.forEach(id => {
        removeOrder(id);
      });
      setSelectedIds(new Set());
      toast.success(`✅ 已成功删除 ${visibleSelectedIds.length} 条订单`);
    }
  };

  // 🔥 全选/取消全选
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(filteredOrders.map(o => o.id));
      setSelectedIds(allIds);
    } else {
      setSelectedIds(new Set());
    }
  };

  // 🔥 单选处理
  const handleSelectOne = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedIds(newSelected);
  };
  
  // 计算全选状态
  const isAllSelected = filteredOrders.length > 0 && selectedIds.size === filteredOrders.length;
  const isSomeSelected = selectedIds.size > 0 && selectedIds.size < filteredOrders.length;

  useEffect(() => {
    const visibleIds = new Set(filteredOrders.map((order) => order.id));
    const nextSelected = new Set(Array.from(selectedIds).filter((id) => visibleIds.has(id)));
    if (nextSelected.size !== selectedIds.size) {
      setSelectedIds(nextSelected);
    }
  }, [filteredOrders, selectedIds]);

  // 计算统计数据
  const stats = {
    totalActive: orders.length,
    inProduction: orders.filter(o => o.status === 'In Production').length,
    readyToShip: orders.filter(o => o.status === 'Ready to Ship').length,
    totalValue: orders.reduce((sum, o) => sum + o.totalAmount, 0)
  };

  return (
    <div className="space-y-4">
      {/* 刷新按钮 */}
      <div className="flex justify-end">
        <Button
          size="sm"
          variant="outline"
          className="h-8 px-3 text-xs border-gray-400 text-gray-600 hover:bg-gray-50"
          onClick={() => window.location.reload()}
          title="从 Supabase 重新加载订单数据"
        >
          <RefreshCw className="w-3.5 h-3.5 mr-1" />
          刷新数据
        </Button>
      </div>

      {/* 🎨 方案A：台湾大厂原汁原味风格 - SAP/Oracle单行紧凑摘要栏 */}
      <div className="bg-white border border-gray-300 rounded">
        <div className="px-5 py-3 border-b border-gray-200 bg-gray-50">
          <h3 className="font-semibold text-gray-700 uppercase tracking-wide" style={{ fontSize: '14px' }}>订单统计</h3>
        </div>
        <div className="px-5 py-3 flex items-center gap-8" style={{ fontSize: '12px' }}>
          <div className="flex items-center gap-2">
            <span className="text-gray-600">在制订单:</span>
            <span className="font-semibold text-gray-900">{stats.totalActive}</span>
          </div>
          <div className="w-px h-4 bg-gray-300" />
          <div className="flex items-center gap-2">
            <span className="text-gray-600">生产中:</span>
            <span className="font-semibold text-gray-900">{stats.inProduction}</span>
          </div>
          <div className="w-px h-4 bg-gray-300" />
          <div className="flex items-center gap-2">
            <span className="text-gray-600">待发货:</span>
            <span className="font-semibold text-orange-600">{stats.readyToShip}</span>
          </div>
          <div className="w-px h-4 bg-gray-300" />
          <div className="flex items-center gap-2">
            <span className="text-gray-600">总金额:</span>
            <span className="font-semibold text-gray-900">${(stats.totalValue / 1000).toFixed(0)}K</span>
          </div>
        </div>
      </div>

      {/* 列表卡片 */}
      <Card className="border border-gray-200">
        {/* 搜索和筛选栏 */}
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <div className="flex gap-3 items-center">
            {/* 搜索框 */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
              <Input
                placeholder="搜索订单编号、客户名称..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>

            {/* 🔥 批量删除按钮 */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBulkDelete}
              disabled={selectedIds.size === 0}
              className="h-9 px-3 text-red-600 hover:text-red-700 hover:bg-red-50 disabled:opacity-40"
              style={{ fontSize: '12px' }}
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" />
              批量删除 {selectedIds.size > 0 && `(${selectedIds.size})`}
            </Button>

            {/* 🔥 清空所有按钮 */}
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                if (window.confirm('⚠️ 确定要清空所有在制订单吗？\n\n此操作不可恢复！\n\n这将删除所有在制订单记录。')) {
                  clearAllOrders();
                  setSelectedIds(new Set());
                  toast.success('✅ 已清空所有在制订单！');
                }
              }}
              disabled={orders.length === 0}
              className="h-9 px-3 bg-red-600 hover:bg-red-700"
              style={{ fontSize: '12px' }}
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" />
              清空所有
            </Button>

            {/* 状态筛选 */}
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[130px] h-9 text-xs bg-white">
                <SelectValue placeholder="全部状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" style={{ fontSize: '12px' }}>全部状态</SelectItem>
                <SelectItem value="Pending" style={{ fontSize: '12px' }}>待处理</SelectItem>
                <SelectItem value="In Production" style={{ fontSize: '12px' }}>生产中</SelectItem>
                <SelectItem value="Quality Inspection" style={{ fontSize: '12px' }}>质检中</SelectItem>
                <SelectItem value="Ready to Ship" style={{ fontSize: '12px' }}>待发货</SelectItem>
                <SelectItem value="Shipped" style={{ fontSize: '12px' }}>已发货</SelectItem>
              </SelectContent>
            </Select>

            {/* 🎯 老板角色显示额外筛选维度 */}
            {(currentUserRole === 'Boss' || currentUserRole === 'CEO' || currentUserRole === 'Sales_Director') && (
              <>
                {/* 区域筛选 */}
                <Select value={filterRegion} onValueChange={setFilterRegion}>
                  <SelectTrigger className="w-[120px] h-9 text-xs bg-white">
                    <SelectValue placeholder="全部区域" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" style={{ fontSize: '12px' }}>全部区域</SelectItem>
                    <SelectItem value="North America" style={{ fontSize: '12px' }}>北美区域</SelectItem>
                    <SelectItem value="South America" style={{ fontSize: '12px' }}>南美区域</SelectItem>
                    <SelectItem value="Europe & Africa" style={{ fontSize: '12px' }}>欧非区域</SelectItem>
                    <SelectItem value="Other" style={{ fontSize: '12px' }}>其它区域</SelectItem>
                  </SelectContent>
                </Select>

                {/* 客户筛选 */}
                <Select value={filterCustomer} onValueChange={setFilterCustomer}>
                  <SelectTrigger className="w-[140px] h-9 text-xs bg-white">
                    <SelectValue placeholder="全部客户" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" style={{ fontSize: '12px' }}>全部客户</SelectItem>
                    {[...new Set(orders.map(o => o.customer))].slice(0, 30).map((customer) => (
                      <SelectItem key={customer} value={customer} style={{ fontSize: '12px' }}>
                        {customer}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            )}
          </div>
        </div>

        {/* 表格 */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 hover:bg-gray-50">
                <TableHead className="text-xs py-3 w-16">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={isAllSelected}
                      indeterminate={isSomeSelected}
                      onCheckedChange={handleSelectAll}
                      className="h-4 w-4"
                    />
                    <span>#</span>
                  </div>
                </TableHead>
                <TableHead className="text-xs">订单编号</TableHead>
                <TableHead className="text-xs">客户名称</TableHead>
                <TableHead className="text-xs">报价编号</TableHead>
                <TableHead className="text-xs">下单日期</TableHead>
                <TableHead className="text-xs">订单金额</TableHead>
                <TableHead className="text-xs">付款状态</TableHead>
                <TableHead className="text-xs">定金凭证</TableHead>
                <TableHead className="text-xs">余款凭证</TableHead>
                <TableHead className="text-xs">进度</TableHead>
                <TableHead className="text-xs">状态</TableHead>
                <TableHead className="text-xs text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order, index) => (
                <TableRow key={order.id} className="hover:bg-blue-50/30">
                  <TableCell className="py-3">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={selectedIds.has(order.id)}
                        onCheckedChange={(checked) => handleSelectOne(order.id, checked as boolean)}
                        className="h-4 w-4"
                      />
                      <span className="text-gray-500 text-xs">{index + 1}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-3">
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="text-xs text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                    >
                      {order.id}
                    </button>
                  </TableCell>
                  <TableCell className="text-xs">{order.customer}</TableCell>
                  <TableCell className="text-xs">{order.quotationId}</TableCell>
                  <TableCell className="text-xs text-gray-600">{order.date}</TableCell>
                  <TableCell className="text-xs">${order.totalAmount.toLocaleString()}</TableCell>
                  <TableCell className="text-xs">
                    <Badge className={`h-5 px-2 text-[10px] border ${getPaymentStatusConfig(order.paymentStatus).color}`}>
                      {getPaymentStatusConfig(order.paymentStatus).label}
                    </Badge>
                  </TableCell>
                  
                  {/* 定金凭证列 - 永久显示 */}
                  <TableCell className="text-xs">
                    {(() => {
                      const fullOrder = contextOrders.find(o => o.orderNumber === order.id);
                      if (fullOrder?.depositPaymentProof) {
                        return (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 px-2 text-[10px] border-green-600 text-green-700 hover:bg-green-50"
                            onClick={() => {
                              setPaymentProofOrder(fullOrder);
                              setIsPaymentProofOpen(true);
                            }}
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            查看
                          </Button>
                        );
                      } else {
                        return <span className="text-gray-400 text-[10px]">-</span>;
                      }
                    })()}
                  </TableCell>
                  
                  {/* 余款凭证列 - 永久显示 */}
                  <TableCell className="text-xs">
                    {(() => {
                      const fullOrder = contextOrders.find(o => o.orderNumber === order.id);
                      if (fullOrder?.balancePaymentProof) {
                        return (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 px-2 text-[10px] border-blue-600 text-blue-700 hover:bg-blue-50"
                            onClick={() => {
                              // 临时创建一个包含余款凭证的订单对象用于显示
                              const orderWithBalanceProof = {
                                ...fullOrder,
                                depositPaymentProof: fullOrder.balancePaymentProof // 复用同一个Dialog
                              };
                              setPaymentProofOrder(orderWithBalanceProof);
                              setIsPaymentProofOpen(true);
                            }}
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            查看
                          </Button>
                        );
                      } else {
                        return <span className="text-gray-400 text-[10px]">-</span>;
                      }
                    })()}
                  </TableCell>
                  <TableCell className="py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-1.5 w-16">
                        <div
                          className="bg-blue-600 h-1.5 rounded-full"
                          style={{ width: `${order.progress}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-gray-600 w-8">{order.progress}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-3">
                    <Badge className={`h-5 px-2 text-[10px] border ${getStatusConfig(order.status).color}`}>
                      {getStatusConfig(order.status).label}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs hover:bg-blue-50"
                        onClick={() => setSelectedOrder(order)}
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" />
                        查看
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-2 text-xs border-blue-600 text-blue-600 hover:bg-blue-50"
                        onClick={() => {
                          setSelectedOrder(order);
                          setIsEditMode(true);
                        }}
                      >
                        <Edit className="w-3.5 h-3.5 mr-1" />
                        编辑
                      </Button>
                      <Button
                        size="sm"
                        className="h-7 px-2 text-xs bg-green-600 hover:bg-green-700"
                        onClick={() => {
                          // 确认订单流程
                          const fullOrder = contextOrders.find(o => o.orderNumber === order.id);
                          if (fullOrder && fullOrder.customerEmail) {
                            // 1. 更新订单为已确认状态
                            updateOrder(order.id, {
                              confirmed: true,
                              confirmedAt: new Date().toISOString(),
                              contractTerms: contractTerms
                            });
                            
                            // 2. 发送通知给客户
                            sendNotificationToUser(fullOrder.customerEmail, {
                              type: 'order_created',
                              title: '✅ 订单已确认 Order Confirmed',
                              message: `您的订单 ${order.id} 已确认，请查看销售合同详情`,
                              relatedId: order.id,
                              relatedType: 'order',
                              sender: 'admin@gaoshengda.com',
                              metadata: {
                                customerName: order.customer,
                                amount: `$${order.totalAmount.toLocaleString()}`,
                                status: 'confirmed'
                              }
                            });
                            
                            // 3. 显示成功提示
                            toast.success('订单确认成功', {
                              description: `已向客户 ${order.customer} 发送销售合同和确认通知`,
                              duration: 3000
                            });
                          } else {
                            toast.error('确认失败', {
                              description: '订单信息不完整，缺少客户邮箱',
                              duration: 3000
                            });
                          }
                        }}
                      >
                        <CheckCircle className="w-3.5 h-3.5 mr-1" />
                        确认
                      </Button>
                      {/* 下推采购请求按钮 - 紫色高亮 */}
                      <Button
                        size="sm"
                        className="h-7 px-2 text-xs bg-purple-600 hover:bg-purple-700 text-white"
                        onClick={() => handlePushToPurchase(order)}
                        title="收到定金后下推采购请求"
                      >
                        <ShoppingCart className="w-3.5 h-3.5 mr-1" />
                        下推采购
                      </Button>
                      <Button
                        size="sm"
                        className="h-7 px-2 text-xs bg-rose-600 hover:bg-rose-700"
                        onClick={() => setDeleteOrderState(order)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* 销售合同预览/编辑对话框 - 点击订单编号或查看合同按钮直接打开 */}
      <Dialog open={selectedOrder !== null} onOpenChange={() => {
        setSelectedOrder(null);
        setIsEditMode(false);
      }}>
        <DialogContent className="max-w-[1080px] max-h-[90vh] overflow-y-auto print:max-h-none print:overflow-visible">
          <DialogHeader className="print:hidden">
            <DialogTitle className="text-base">
              {isEditMode ? '编辑订单 Edit Order' : '销售合同 Sales Contract'} - {selectedOrder?.id}
            </DialogTitle>
            <DialogDescription className="text-sm">
              {isEditMode ? '修改订单信息后保存更改' : '预览并打印/导出销售合同'}
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <>
              {isEditMode ? (
                // 编辑模式 - 使用表单编辑订单信息
                <div className="space-y-4">
                  {/* 基本信息（只读） */}
                  <Card className="p-4 bg-gray-50 border-gray-200">
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <p className="text-gray-600 mb-1">订单编号</p>
                        <p className="text-gray-900">{selectedOrder.id}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 mb-1">客户名称</p>
                        <p className="text-gray-900">{selectedOrder.customer}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 mb-1">下单日期</p>
                        <p className="text-gray-900">{selectedOrder.date}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 mb-1">订单金额</p>
                        <p className="text-gray-900">${selectedOrder.totalAmount.toLocaleString()}</p>
                      </div>
                    </div>
                  </Card>

                  {/* 可编字段 */}
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-gray-700 mb-1.5 block">订单状态</label>
                      <Select defaultValue={selectedOrder.status}>
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Pending">待处理</SelectItem>
                          <SelectItem value="In Production">生产中</SelectItem>
                          <SelectItem value="Quality Inspection">质检中</SelectItem>
                          <SelectItem value="Ready to Ship">待发货</SelectItem>
                          <SelectItem value="Shipped">已发货</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-xs text-gray-700 mb-1.5 block">付款状态</label>
                      <Select defaultValue={selectedOrder.paymentStatus}>
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Pending Payment">待付款</SelectItem>
                          <SelectItem value="Partial Payment">部分付款</SelectItem>
                          <SelectItem value="Paid">已付款</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-xs text-gray-700 mb-1.5 block">生产进度 ({selectedOrder.progress}%)</label>
                      <Input 
                        type="range" 
                        min="0" 
                        max="100" 
                        defaultValue={selectedOrder.progress}
                        className="w-full h-9"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-gray-700 mb-1.5 block">预计交货日期</label>
                      <Input 
                        type="date" 
                        defaultValue={selectedOrder.expectedDelivery}
                        className="h-9 text-xs"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-gray-700 mb-1.5 block">运输方式</label>
                      <Input 
                        defaultValue={selectedOrder.shippingMethod || 'Sea Freight'}
                        className="h-9 text-xs"
                        placeholder="Sea Freight, Air Freight, etc."
                      />
                    </div>

                    <div>
                      <label className="text-xs text-gray-700 mb-1.5 block">跟踪编号（可选）</label>
                      <Input 
                        defaultValue={selectedOrder.trackingNumber || ''}
                        className="h-9 text-xs"
                        placeholder="输入物流跟踪编号"
                      />
                    </div>
                  </div>

                  {/* 合同条款编辑 Contract Terms Editing */}
                  <div className="space-y-4">
                    <h4 className="text-sm text-gray-800 border-b pb-2 mb-3">📄 合同条款编辑 Contract Terms Editing</h4>
                    
                    {/* 第二条：付款条款 */}
                    <div>
                      <label className="text-xs text-gray-700 mb-1.5 block">第二条 付款条款 Payment Terms</label>
                      <Textarea 
                        defaultValue={contractTerms.paymentTerms}
                        onChange={(e) => setContractTerms({...contractTerms, paymentTerms: e.target.value})}
                        className="text-xs min-h-[60px]"
                        placeholder="如：30% T/T deposit, 70% balance before shipment"
                      />
                    </div>

                    {/* 第三条：交货条款 */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-gray-700 mb-1.5 block">交货条款 Delivery Terms</label>
                        <Input 
                          defaultValue={contractTerms.deliveryTerms}
                          onChange={(e) => setContractTerms({...contractTerms, deliveryTerms: e.target.value})}
                          className="h-9 text-xs"
                          placeholder="如：FOB Fuzhou, China"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-700 mb-1.5 block">运输方式 Shipping Method</label>
                        <Input 
                          defaultValue={contractTerms.shippingMethod}
                          onChange={(e) => setContractTerms({...contractTerms, shippingMethod: e.target.value})}
                          className="h-9 text-xs"
                          placeholder="如：Sea Freight 海运"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-gray-700 mb-1.5 block">预计交货日期 Expected Delivery Date</label>
                      <Input 
                        type="date"
                        defaultValue={selectedOrder.expectedDelivery}
                        onChange={(e) => setContractTerms({...contractTerms, expectedDelivery: e.target.value})}
                        className="h-9 text-xs"
                      />
                    </div>

                    {/* 第四条：质量保证 */}
                    <div>
                      <label className="text-xs text-gray-700 mb-1.5 block">第四条 质量保证 Quality Assurance</label>
                      <Textarea 
                        defaultValue={contractTerms.qualityStandards}
                        onChange={(e) => setContractTerms({...contractTerms, qualityStandards: e.target.value})}
                        className="text-xs min-h-[60px]"
                        placeholder="产品质量标准说明"
                      />
                    </div>

                    {/* 保修条款 */}
                    <div>
                      <label className="text-xs text-gray-700 mb-1.5 block">保修条款 Warranty Terms</label>
                      <Input 
                        defaultValue={contractTerms.warrantyTerms}
                        onChange={(e) => setContractTerms({...contractTerms, warrantyTerms: e.target.value})}
                        className="h-9 text-xs"
                        placeholder="如：12-month warranty from date of shipment"
                      />
                    </div>

                    {/* 备注 */}
                    <div>
                      <label className="text-xs text-gray-700 mb-1.5 block">备注 Remarks（可选）</label>
                      <Textarea 
                        value={contractTerms.remarks}
                        onChange={(e) => setContractTerms({...contractTerms, remarks: e.target.value})}
                        className="text-xs min-h-[80px]"
                        placeholder="输入特殊说明或充条款..."
                      />
                    </div>
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => setIsEditMode(false)}
                    >
                      取消
                    </Button>
                    <Button
                      size="sm"
                      className="h-8 text-xs bg-blue-600 hover:bg-blue-700"
                      onClick={() => {
                        toast.success('订单已更新', {
                          description: `订单 ${selectedOrder.id} 的信息已成功更新`,
                          duration: 3000
                        });
                        setIsEditMode(false);
                      }}
                    >
                      保存更改
                    </Button>
                  </div>
                </div>
              ) : (
                // 预览模式 - 显示销售合同
                <>
                  {/* 打印专用包裹器 */}
                  <div className="sales-contract-print-area">
                    <SalesContractDocument
                      data={adaptOrderToSalesContract({
                        orderNumber: selectedOrder.id,
                        customer: selectedOrder.customer,
                        customerEmail: contextOrders.find(o => o.orderNumber === selectedOrder.id)?.customerEmail,
                        customerCountry: contextOrders.find(o => o.orderNumber === selectedOrder.id)?.country,
                        customerAddress: contextOrders.find(o => o.orderNumber === selectedOrder.id)?.deliveryAddress,
                        customerContact: contextOrders.find(o => o.orderNumber === selectedOrder.id)?.contactPerson,
                        customerPhone: contextOrders.find(o => o.orderNumber === selectedOrder.id)?.phone,
                        date: selectedOrder.date,
                        expectedDelivery: selectedOrder.expectedDelivery,
                        totalAmount: selectedOrder.totalAmount,
                        currency: contextOrders.find(o => o.orderNumber === selectedOrder.id)?.currency || 'USD',
                        products: selectedOrder.products,
                        shippingMethod: selectedOrder.shippingMethod,
                        quotationNumber: selectedOrder.quotationId,
                        region: contextOrders.find(o => o.orderNumber === selectedOrder.id)?.region as 'NA' | 'SA' | 'EU'
                      })}
                    />
                  </div>
                  <div className="flex justify-between gap-2 pt-4 border-t border-gray-200 print:hidden">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="h-8 text-xs bg-blue-600 hover:bg-blue-700"
                        onClick={() => setIsEditMode(true)}
                      >
                        <Edit className="w-3.5 h-3.5 mr-1" />
                        编辑订单
                      </Button>
                      {/* 发起发货通知按钮 */}
                      {(selectedOrder.status === 'Ready to Ship' || selectedOrder.status === 'Quality Inspection') && (
                        <Button
                          size="sm"
                          className="h-8 text-xs bg-orange-500 hover:bg-orange-600"
                          onClick={() => {
                            // 发起发货通知流程
                            toast.loading('正在发起发货通知...', { duration: 1000 });
                            
                            setTimeout(() => {
                              // 模拟数据下推
                              const documentPackageId = `DOC-${Date.now()}`;
                              const shipmentId = `COSUN-SH-${Date.now()}`;
                              
                              toast.success('发通知已发起！', {
                                description: `已创建单证包 ${documentPackageId} 和发货单 ${shipmentId}`,
                                duration: 4000
                              });
                              
                              // 提示用户后续操作
                              setTimeout(() => {
                                toast.info('数据已同步', {
                                  description: '单证制作中心和发货管理中心已更新',
                                  duration: 3000
                                });
                              }, 1500);
                            }, 1200);
                          }}
                        >
                          <Send className="w-3.5 h-3.5 mr-1" />
                          发起发货通知
                        </Button>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs"
                        onClick={() => {
                          setSelectedOrder(null);
                          setIsEditMode(false);
                        }}
                      >
                        关闭
                      </Button>
                      <Button
                        size="sm"
                        className="h-8 text-xs bg-green-600 hover:bg-green-700"
                        onClick={handlePrint}
                      >
                        <Printer className="w-3.5 h-3.5 mr-1" />
                        打印/导出PDF
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Order Dialog */}
      <AlertDialog open={deleteOrderState !== null} onOpenChange={() => setDeleteOrderState(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Order</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete order <strong className="font-bold">{deleteOrderState?.id}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteOrderState) {
                  handleDeleteOrder(deleteOrderState.id);
                }
                setDeleteOrderState(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 付款凭证Dialog */}
      <PaymentProofDialog
        open={isPaymentProofOpen}
        onOpenChange={setIsPaymentProofOpen}
        order={paymentProofOrder}
      />

      {/* 🔥 定金凭证确认Dialog - 下推采购前的验证 */}
      <AlertDialog open={showDepositDialog} onOpenChange={setShowDepositDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-base">
              <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-yellow-600" />
              </div>
              未找到定金凭证
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3 pt-2">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-xs text-amber-800">
                  <strong className="block mb-1">⚠️ 订单信息</strong>
                  订单编号：{pushToPurchaseOrder?.orderNumber}<br />
                  客户名称：{pushToPurchaseOrder?.customer}<br />
                  订单金额：${pushToPurchaseOrder?.totalAmount.toLocaleString()} {pushToPurchaseOrder?.currency}
                </p>
              </div>
              <p className="text-xs text-gray-700">
                该订单尚未上传定金付款凭证。按照业务流程，需要先确认收到客户定金后才能下推采购请求。
              </p>
              <p className="text-xs text-gray-600">
                您可以选择：
              </p>
              <ul className="text-xs text-gray-600 space-y-1 ml-4">
                <li>• <strong>快速添加测试凭证</strong>（用于演示测试）</li>
                <li>• 返回后手动上传真实的定金凭证</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="mt-0 w-full sm:w-auto text-xs h-9 hover:bg-gray-100">
              取消操作
            </AlertDialogCancel>
            <Button
              variant="outline"
              className="w-full sm:w-auto text-xs h-9 border-blue-500 text-blue-600 hover:bg-blue-50 hover:border-blue-600 transition-all"
              onClick={() => {
                console.log('🔵 ========================================');
                console.log('🔵 点击了"前往上传凭证"按钮');
                console.log('🔵 ========================================');
                console.log('  - 当前订单:', pushToPurchaseOrder);
                
                // 关闭定金Dialog
                setShowDepositDialog(false);
                
                // 打开上传凭证Dialog
                setUploadProofOrder(pushToPurchaseOrder);
                setIsUploadProofOpen(true);
                
                console.log('  ✅ 已打开上传凭证Dialog');
              }}
            >
              前往上传凭证
            </Button>
            <AlertDialogAction
              className="w-full sm:w-auto text-xs h-9 bg-orange-500 hover:bg-orange-600 text-white shadow-md hover:shadow-lg transition-all"
              onClick={() => {
                console.log('🟠 ========================================');
                console.log('🟠 点击了"快速添加测试凭证"按钮');
                console.log('🟠 ========================================');
                console.log('  - pushToPurchaseOrder:', pushToPurchaseOrder);
                
                if (!pushToPurchaseOrder) {
                  console.error('❌ pushToPurchaseOrder为空！');
                  toast.error('订单信息失，请重新操作');
                  return;
                }
                
                console.log('  - 订单编号:', pushToPurchaseOrder.orderNumber);
                console.log('  - 客户名称:', pushToPurchaseOrder.customer);
                console.log('  - 订单金额:', pushToPurchaseOrder.totalAmount);
                console.log('  - 产品数量:', pushToPurchaseOrder.products?.length || 0);
                console.log('  - 开始添加定金凭证...');
                
                // 自动添加模拟定金凭证
                const depositAmount = pushToPurchaseOrder.totalAmount * 0.3; // 30%定金
                console.log('  - 计算定金金额: $', depositAmount);
                
                const proofData = {
                  depositPaymentProof: {
                    uploadedAt: new Date().toISOString(),
                    uploadedBy: pushToPurchaseOrder.customer,
                    fileUrl: 'https://example.com/deposit-proof.pdf',
                    fileName: `deposit-${pushToPurchaseOrder.orderNumber}.pdf`,
                    amount: depositAmount,
                    currency: pushToPurchaseOrder.currency || 'USD',
                    notes: '系统模拟定金凭证 - 用于测试'
                  },
                  paymentStatus: 'Deposit Received',
                  status: 'Deposit Received'
                };
                
                console.log('  - 准备更新订单，数据:', JSON.stringify(proofData, null, 2));
                
                try {
                  updateOrder(pushToPurchaseOrder.orderNumber, proofData);
                  console.log('  ✅ 订单更新成功！');
                  console.log('  ✅ 定金凭证已添加到订单:', pushToPurchaseOrder.orderNumber);
                } catch (error) {
                  console.error('  ❌ 订单更新失败:', error);
                  toast.error('更新订单失败: ' + error);
                  return;
                }
                
                // 关闭Dialog
                setShowDepositDialog(false);
                console.log('  - ✅ Dialog已关闭');
                
                // 显示成功提示
                toast.success('✅ 定金凭证已添加！', {
                  description: '正在自动执行下推采购...',
                  duration: 2000
                });
                
                console.log('  - ⏱️ 等待500ms后执行下推采购...');
                
                // 等待一小段时间让UI更新，然后执行下推
                setTimeout(() => {
                  console.log('\n');
                  console.log('⏰ ========================================');
                  console.log('⏰ 500ms延迟后，开始执行下推采购');
                  console.log('⏰ ========================================');
                  
                  try {
                    executePushToPurchase(pushToPurchaseOrder);
                    console.log('  ✅ ✅ ✅ executePushToPurchase执行完成！');
                    console.log('\n');
                  } catch (error) {
                    console.error('  ❌ executePushToPurchase执行失败:', error);
                    toast.error('下推采购失败: ' + error);
                  }
                }, 500);
              }}
            >
              🔥 快速添加测试凭证
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 🔥 上传定金凭证Dialog */}
      <UploadPaymentProofDialog
        open={isUploadProofOpen}
        onOpenChange={setIsUploadProofOpen}
        order={uploadProofOrder}
        proofType="deposit"
        onUploadSuccess={(proofData) => {
          console.log('✅ 上传凭证成功回调');
          console.log('  - 凭证数据:', proofData);
          console.log('  - 订单号:', uploadProofOrder?.orderNumber);
          
          // 更新订单，添加定金凭证
          updateOrder(uploadProofOrder.orderNumber, {
            depositPaymentProof: proofData,
            paymentStatus: 'Deposit Received',
            status: 'Deposit Received'
          });
          
          console.log('  ✅ 订单已更新');
          
          // 显示成功提示，询问是否继续下推采购
          setTimeout(() => {
            if (window.confirm('✅ 定金凭证已成功上传！\n\n是否立即执行下推采购操作？')) {
              console.log('  ✅ 用户确认下推采购');
              executePushToPurchase(uploadProofOrder);
            } else {
              console.log('  ℹ️ 用户取消下推采购');
              toast.info('您可以稍后手动执行下推采购操作', {
                duration: 3000
              });
            }
          }, 500);
        }}
      />
    </div>
  );
}
