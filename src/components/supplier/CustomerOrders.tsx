import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Search, Filter, CheckCircle, XCircle, Clock, Eye, Download, MessageSquare, Calendar, Package2, DollarSign, FileText } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { toast } from 'sonner@2.0.3';
import PurchaseOrderDocument from './PurchaseOrderDocument';
import { usePurchaseOrders } from '../../contexts/PurchaseOrderContext';

/**
 * 🔥 供应商视角：客户订单管理
 * - COSUN（福建高盛达富建材）= 我们的客户（买方）
 * - 供应商 = 我方（卖方）
 * - Admin的PO（采购订单）= 供应商的客户订单/销售订单
 */
export default function CustomerOrders() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [documentDialogOpen, setDocumentDialogOpen] = useState(false);
  const [deliveryDate, setDeliveryDate] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  
  // 🔥 从Context获取客户订单数据（Admin端的采购订单）
  const { purchaseOrders: allPurchaseOrders, updatePurchaseOrder } = usePurchaseOrders();
  
  // 🔥 获取当前登录的供应商信息（我方）
  const currentSupplier = React.useMemo(() => {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('cosun_current_user');
      if (userStr) {
        try {
          return JSON.parse(userStr);
        } catch (e) {
          console.error('Failed to parse current user:', e);
        }
      }
    }
    return null;
  }, []);
  
  // 🔥 过滤出属于我方的客户订单（供应商视角：客户COSUN下给我们的订单）
  const supplierCustomerOrders = React.useMemo(() => {
    if (!currentSupplier?.email) {
      console.log('⚠️ 未找到当前供应商信息');
      return [];
    }
    
    console.log('🔍 当前供应商（我方）:', currentSupplier.name, currentSupplier.email);
    console.log('📦 全部客户订单数量:', allPurchaseOrders.length);
    
    // 根据supplierCode或supplierName过滤
    const filtered = allPurchaseOrders.filter(po => {
      // 可以通过供应商代码或供应商名称匹配
      const matchCode = po.supplierCode === currentSupplier.email || 
                       po.supplierCode === currentSupplier.supplierCode;
      const matchName = po.supplierName === currentSupplier.name || 
                       po.supplierName === currentSupplier.companyName;
      
      return matchCode || matchName;
    });
    
    console.log('✅ 筛选后的客户订单数量:', filtered.length);
    if (filtered.length > 0) {
      console.log('  - 客户订单号:', filtered.map(po => po.poNumber).join(', '));
    }
    
    return filtered;
  }, [allPurchaseOrders, currentSupplier]);
  
  // 🔥 转换为组件需要的格式
  const customerOrders = React.useMemo(() => {
    return supplierCustomerOrders.map(po => {
      // 计算第一个产品项信息用于列表显示
      const firstItem = po.items[0];
      
      return {
        id: po.poNumber,
        salesOrderId: po.sourceRef || 'N/A',
        date: po.orderDate,
        customer: 'COSUN', // 🔥 供应商视角：客户就是COSUN（福建高盛达富建材）
        product: firstItem?.productName || '多产品订单',
        specifications: firstItem?.specification || `${po.items.length}个产品`,
        quantity: po.items.reduce((sum, item) => sum + item.quantity, 0),
        unitPrice: firstItem?.unitPrice || 0,
        totalAmount: po.totalAmount,
        currency: po.currency,
        deliveryDate: po.expectedDate,
        status: po.status === 'pending' ? 'pending_confirmation' : 
               po.status === 'confirmed' ? 'confirmed' :
               po.status === 'producing' ? 'in_production' :
               po.status,
        confirmedDate: po.updatedDate,
        priority: 'medium',
        notes: po.remarks,
        // 保留原始PO数据
        rawPO: po
      };
    });
  }, [supplierCustomerOrders]);

  const getStatusConfig = (status: string) => {
    const config: any = {
      pending_confirmation: { label: '待确认', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
      confirmed: { label: '已确认', color: 'bg-green-100 text-green-800 border-green-300' },
      rejected: { label: '已拒绝', color: 'bg-red-100 text-red-800 border-red-300' },
      in_production: { label: '生产中', color: 'bg-blue-100 text-blue-800 border-blue-300' },
    };
    return config[status] || { label: status, color: 'bg-gray-100 text-gray-800 border-gray-300' };
  };

  const handleConfirmOrder = async () => {
    if (!deliveryDate) {
      toast.error('请确认交货日期');
      return;
    }
    
    // 🔥 更新Context中的客户订单状态
    if (selectedOrder?.rawPO) {
      try {
        await updatePurchaseOrder(selectedOrder.rawPO.id, {
          status: 'confirmed',
          actualDate: deliveryDate,
          updatedDate: new Date().toISOString()
        });
        console.log('✅ 客户订单已确认:', selectedOrder.id, '交货日期:', deliveryDate);
      } catch (error: any) {
        toast.error(`确认客户订单失败：${error?.message || '未知错误'}`);
        return;
      }
    }
    
    toast.success(`客户订单 ${selectedOrder?.id} 已确认成功！客户COSUN将收到确认通知。`);
    setConfirmDialogOpen(false);
    setDeliveryDate('');
  };

  const handleRejectOrder = async () => {
    if (!rejectReason) {
      toast.error('请填写拒绝原因');
      return;
    }
    
    // 🔥 更新Context中的客户订单状态
    if (selectedOrder?.rawPO) {
      try {
        await updatePurchaseOrder(selectedOrder.rawPO.id, {
          status: 'cancelled',
          remarks: `拒绝原因: ${rejectReason}`,
          updatedDate: new Date().toISOString()
        });
        console.log('❌ 客户订单已拒绝:', selectedOrder.id, '原因:', rejectReason);
      } catch (error: any) {
        toast.error(`拒绝客户订单失败：${error?.message || '未知错误'}`);
        return;
      }
    }
    
    toast.success(`客户订单 ${selectedOrder?.id} 已拒绝。客户COSUN已收到通知。`);
    setRejectDialogOpen(false);
    setRejectReason('');
  };

  const filteredOrders = customerOrders.filter(order =>
    order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingOrders = filteredOrders.filter(o => o.status === 'pending_confirmation');
  const confirmedOrders = filteredOrders.filter(o => o.status === 'confirmed');
  const rejectedOrders = filteredOrders.filter(o => o.status === 'rejected');

  const getCurrentOrders = () => {
    switch (activeTab) {
      case 'pending': return pendingOrders;
      case 'confirmed': return confirmedOrders;
      case 'rejected': return rejectedOrders;
      default: return filteredOrders;
    }
  };

  const tabs = [
    { id: 'pending', label: '待确认', icon: Clock, count: pendingOrders.length, color: 'text-yellow-600' },
    { id: 'confirmed', label: '已确认', icon: CheckCircle, count: confirmedOrders.length, color: 'text-green-600' },
    { id: 'rejected', label: '已拒绝', icon: XCircle, count: rejectedOrders.length, color: 'text-red-600' },
    { id: 'all', label: '全部订单', icon: Package2, count: filteredOrders.length, color: 'text-blue-600' },
  ];

  return (
    <div className="space-y-4">
      {/* 顶部工具栏 */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="搜索订单号、产品名称或客户..."
              className="pl-9 h-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ fontSize: '13px' }}
            />
          </div>
          <Button variant="outline" size="sm" className="gap-2 h-9">
            <Filter className="w-4 h-4" />
            筛选
          </Button>
        </div>
      </div>

      {/* Tab导航 - 紧凑横向 */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="flex items-center border-b border-gray-200">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
                style={{ fontSize: '13px', fontWeight: 500 }}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                <Badge variant="outline" className="h-5 px-1.5 min-w-5 text-xs">
                  {tab.count}
                </Badge>
              </button>
            );
          })}
        </div>

        {/* 表格区域 */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="h-9 w-32" style={{ fontSize: '12px' }}>客户订单号</TableHead>
                <TableHead className="h-9 w-28" style={{ fontSize: '12px' }}>客户销售单</TableHead>
                <TableHead className="h-9" style={{ fontSize: '12px' }}>产品信息</TableHead>
                <TableHead className="h-9 w-32" style={{ fontSize: '12px' }}>客户</TableHead>
                <TableHead className="h-9 w-24 text-right" style={{ fontSize: '12px' }}>数量</TableHead>
                <TableHead className="h-9 w-24 text-right" style={{ fontSize: '12px' }}>单价</TableHead>
                <TableHead className="h-9 w-28 text-right" style={{ fontSize: '12px' }}>总金额</TableHead>
                <TableHead className="h-9 w-24" style={{ fontSize: '12px' }}>交货日期</TableHead>
                <TableHead className="h-9 w-20" style={{ fontSize: '12px' }}>状态</TableHead>
                <TableHead className="h-9 w-48 text-center" style={{ fontSize: '12px' }}>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {getCurrentOrders().length > 0 ? (
                getCurrentOrders().map((order) => {
                  const statusConfig = getStatusConfig(order.status);
                  return (
                    <TableRow key={order.id} className="hover:bg-gray-50">
                      <TableCell className="py-2.5" style={{ fontSize: '13px' }}>
                        <div>
                          <p className="font-medium text-blue-600">{order.id}</p>
                          <p className="text-xs text-gray-500">{order.date}</p>
                        </div>
                      </TableCell>
                      <TableCell className="py-2.5" style={{ fontSize: '13px' }}>
                        <span className="text-gray-600">{order.salesOrderId}</span>
                      </TableCell>
                      <TableCell className="py-2.5" style={{ fontSize: '13px' }}>
                        <div>
                          <p className="font-medium text-gray-900">{order.product}</p>
                          <p className="text-xs text-gray-500">{order.specifications}</p>
                          {order.priority === 'high' && (
                            <Badge variant="destructive" className="mt-1 h-4 px-1.5 text-xs">紧急</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-2.5" style={{ fontSize: '12px' }}>
                        <span className="text-gray-700">{order.customer}</span>
                      </TableCell>
                      <TableCell className="py-2.5 text-right" style={{ fontSize: '13px' }}>
                        <span className="font-medium">{order.quantity.toLocaleString()}</span>
                        <span className="text-gray-500 ml-1">件</span>
                      </TableCell>
                      <TableCell className="py-2.5 text-right" style={{ fontSize: '13px' }}>
                        <span className="font-medium">${order.unitPrice.toFixed(2)}</span>
                      </TableCell>
                      <TableCell className="py-2.5 text-right" style={{ fontSize: '13px' }}>
                        <span className="font-bold text-orange-600">${order.totalAmount.toLocaleString()}</span>
                      </TableCell>
                      <TableCell className="py-2.5" style={{ fontSize: '12px' }}>
                        <div className="flex items-center gap-1 text-gray-600">
                          <Calendar className="w-3 h-3" />
                          {order.deliveryDate}
                        </div>
                      </TableCell>
                      <TableCell className="py-2.5">
                        <Badge className={`h-5 px-2 text-xs border ${statusConfig.color}`}>
                          {statusConfig.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-2.5">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={() => {
                              setSelectedOrder(order);
                              setDocumentDialogOpen(true);
                            }}
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            详情
                          </Button>
                          {order.status === 'pending_confirmation' && (
                            <>
                              <Button
                                size="sm"
                                className="h-7 px-2 text-xs bg-green-600 hover:bg-green-700"
                                onClick={() => {
                                  setSelectedOrder(order);
                                  setConfirmDialogOpen(true);
                                }}
                              >
                                <CheckCircle className="w-3 h-3 mr-1" />
                                确认接单
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                className="h-7 px-2 text-xs"
                                onClick={() => {
                                  setSelectedOrder(order);
                                  setRejectDialogOpen(true);
                                }}
                              >
                                <XCircle className="w-3 h-3 mr-1" />
                                拒绝
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={10} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-400">
                      <Package2 className="w-12 h-12 mb-2" />
                      <p style={{ fontSize: '13px' }}>暂无客户订单数据</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* 订单详情对话框 */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>客户订单详情</DialogTitle>
            <DialogDescription>订单号：{selectedOrder?.id}</DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 border rounded-lg p-4 bg-gray-50">
                <div>
                  <p className="text-xs text-gray-500 mb-1">客户销售订单号</p>
                  <p className="text-sm font-medium">{selectedOrder.salesOrderId}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">客户名称</p>
                  <p className="text-sm font-medium">{selectedOrder.customer}</p>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-3" style={{ fontSize: '14px' }}>产品信息</h4>
                <div className="space-y-2">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-sm text-gray-600">产品名称</span>
                    <span className="text-sm font-medium">{selectedOrder.product}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-sm text-gray-600">产品规格</span>
                    <span className="text-sm">{selectedOrder.specifications}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-sm text-gray-600">订购数量</span>
                    <span className="text-sm font-medium">{selectedOrder.quantity.toLocaleString()} 件</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-sm text-gray-600">单价</span>
                    <span className="text-sm font-medium">${selectedOrder.unitPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-sm font-medium">订单总金额</span>
                    <span className="text-lg font-bold text-orange-600">${selectedOrder.totalAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {selectedOrder.notes && (
                <div className="border border-yellow-300 bg-yellow-50 rounded-lg p-3">
                  <p className="text-xs text-gray-600 mb-1">客户重要备注：</p>
                  <p className="text-sm text-gray-800">{selectedOrder.notes}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>关闭</Button>
            <Button 
              variant="outline" 
              className="gap-2"
              onClick={() => {
                setDetailDialogOpen(false);
                setDocumentDialogOpen(true);
              }}
            >
              <FileText className="w-4 h-4" />
              查看订单表单
            </Button>
            <Button variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              下载订单
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 确认接单对话框 */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认接受客户订单</DialogTitle>
            <DialogDescription>订单号：{selectedOrder?.id}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="delivery-date">确认交货日期</Label>
              <Input
                id="delivery-date"
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
              <p className="text-xs text-gray-500">
                客户要求交货日期：{selectedOrder?.deliveryDate}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleConfirmOrder} className="bg-green-600 hover:bg-green-700">
              确认接单
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 拒绝订单对话框 */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>拒绝客户订单</DialogTitle>
            <DialogDescription>订单号：{selectedOrder?.id}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reject-reason">拒绝原因（将发送给客户COSUN）</Label>
              <Textarea
                id="reject-reason"
                placeholder="例如：无法满足交货期要求、原材料短缺、产能不足等"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleRejectOrder}>
              拒绝订单
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 订单文档对话框 - 全屏 */}
      <Dialog open={documentDialogOpen} onOpenChange={setDocumentDialogOpen}>
        <DialogContent className="max-w-[100vw] w-full h-full max-h-screen p-0">
          <DialogHeader className="sr-only">
            <DialogTitle>客户订单文档</DialogTitle>
            <DialogDescription>订单号：{selectedOrder?.id}</DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <PurchaseOrderDocument 
              orderData={selectedOrder} 
              onClose={() => setDocumentDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
