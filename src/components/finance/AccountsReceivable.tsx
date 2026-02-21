/**
 * 🔥 应收账款管理 - 财务专用模块
 * 
 * 表格列结构：
 * - 订单编号（YS-开头）
 * - 客户信息
 * - 订单金额
 * - 定金-客户付款凭证（2个状态区域）
 * - 定金-财务收款凭证（2个状态区域）
 * - 余款-客户付款凭证（2个状态区域）
 * - 余款-财务收款凭证（2个状态区域）
 */

import React, { useState, useMemo } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Checkbox } from '../ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { 
  Search, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Upload,
  FileText,
  AlertCircle,
  Download,
  Building,
  FileCheck,
  Trash2 // 🔥 新增：删除图标
} from 'lucide-react';
import { useOrders } from '../../contexts/OrderContext';
import { useFinance } from '../../contexts/FinanceContext'; // 🔥 新增：导入财务Context
import { getCurrentUser } from '../../utils/dataIsolation';
import { toast } from 'sonner@2.0.3';
import { apiFetchJson } from '../../api/backend-auth';

export function AccountsReceivable() {
  const { orders, updateOrder, deleteOrder } = useOrders();
  const { clearAllAccountsReceivable } = useFinance(); // 🔥 新增：获取清空方法
  const currentUser = getCurrentUser();
  
  const [searchTerm, setSearchTerm] = useState('');
  
  // 🔥 批量选择状态
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set());
  
  // 🔥 Dialog状态
  const [uploadDialog, setUploadDialog] = useState(false);
  const [viewDialog, setViewDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [proofType, setProofType] = useState<'depositReceipt' | 'balanceReceipt'>('depositReceipt');
  const [selectedProof, setSelectedProof] = useState<any>(null);
  
  // 🔥 上传表单数据
  const [receiptData, setReceiptData] = useState({
    actualAmount: 0,
    receiptDate: new Date().toISOString().split('T')[0],
    bankReference: '',
    fileUrl: '',
    fileName: '',
    notes: ''
  });
  
  // 🔥 筛选需要财务处理的订单（有销售合同的订单）
  const receivableOrders = useMemo(() => {
    return orders.filter(order => {
      // 只显示有合同编号的订单（以SC-开头）
      if (!order.orderNumber?.startsWith('SC-')) {
        return false;
      }
      
      // 搜索筛选
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return (
          order.orderNumber.toLowerCase().includes(term) ||
          order.customer.toLowerCase().includes(term) ||
          order.customerEmail?.toLowerCase().includes(term)
        );
      }
      
      return true;
    });
  }, [orders, searchTerm]);
  
  // 🔥 统计信息
  const stats = useMemo(() => {
    const total = receivableOrders.length;
    const depositPending = receivableOrders.filter(o => o.depositPaymentProof && !o.depositPaymentProof.status).length;
    const balancePending = receivableOrders.filter(o => o.balancePaymentProof && !o.balancePaymentProof.status).length;
    const depositReceived = receivableOrders.filter(o => o.depositReceiptProof).length;
    const balanceReceived = receivableOrders.filter(o => o.balanceReceiptProof).length;
    
    // 🔥 计算金额统计
    const totalReceivable = receivableOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const depositAmount = receivableOrders
      .filter(o => o.depositReceiptProof)
      .reduce((sum, o) => sum + (o.depositReceiptProof?.actualAmount || 0), 0);
    const balanceAmount = receivableOrders
      .filter(o => o.balanceReceiptProof)
      .reduce((sum, o) => sum + (o.balanceReceiptProof?.actualAmount || 0), 0);
    
    return {
      total,
      depositPending,
      balancePending,
      depositReceived,
      balanceReceived,
      totalReceivable,
      depositAmount,
      balanceAmount
    };
  }, [receivableOrders]);
  
  // 🔥 打开上传收款凭证Dialog
  const handleOpenUpload = (order: any, type: 'depositReceipt' | 'balanceReceipt') => {
    setSelectedOrder(order);
    setProofType(type);
    
    // 预填充金额
    const expectedAmount = type === 'depositReceipt' 
      ? order.depositPaymentProof?.amount || 0
      : order.balancePaymentProof?.amount || 0;
    
    setReceiptData({
      actualAmount: expectedAmount,
      receiptDate: new Date().toISOString().split('T')[0],
      bankReference: '',
      fileUrl: '',
      fileName: '',
      notes: ''
    });
    
    setUploadDialog(true);
  };
  
  // 🔥 打开查看凭证Dialog
  const handleOpenView = (order: any, proof: any, type: string) => {
    setSelectedOrder(order);
    setSelectedProof(proof);
    setProofType(type as 'depositReceipt' | 'balanceReceipt');
    setViewDialog(true);
  };
  
  // 🔥 上传收款凭证（落库后端）
  const handleUploadReceipt = async () => {
    if (!selectedOrder) return;
    
    // 验证必填字段
    if (receiptData.actualAmount <= 0) {
      toast.error('请填写实际到账金额！');
      return;
    }
    
    if (!receiptData.bankReference.trim()) {
      toast.error('请填写银行流水号！');
      return;
    }
    
    try {
      const orderUid = selectedOrder.id || selectedOrder.orderNumber;
      const type = proofType === 'depositReceipt' ? 'deposit' : 'balance';
      const res = await apiFetchJson<{ message: string; order: any }>(
        `/api/orders/${encodeURIComponent(orderUid)}/upload-receipt-proof`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type,
            actualAmount: receiptData.actualAmount,
            receiptDate: receiptData.receiptDate,
            bankReference: receiptData.bankReference,
            notes: receiptData.notes || undefined,
            fileUrl: receiptData.fileUrl || undefined,
            fileName: receiptData.fileName || undefined,
          }),
        }
      );

      if (res.order) {
        updateOrder(orderUid, {
          paymentStatus: res.order.paymentStatus,
          status: res.order.status,
          depositPaymentProof: res.order.depositPaymentProof,
          balancePaymentProof: res.order.balancePaymentProof,
          depositReceiptProof: res.order.depositReceiptProof,
          balanceReceiptProof: res.order.balanceReceiptProof,
        });
      }
      window.dispatchEvent(new CustomEvent('ordersUpdated'));

      toast.success(`${proofType === 'depositReceipt' ? '定金' : '余款'}收款凭证已上传！`, {
        description: `订单 ${selectedOrder.orderNumber} 的收款凭证已写入数据库。`
      });

      setUploadDialog(false);
      resetForm();
    } catch (e: any) {
      toast.error(e?.message || '上传失败，请重试');
    }
  };
  
  // 🔥 重置表单
  const resetForm = () => {
    setReceiptData({
      actualAmount: 0,
      receiptDate: new Date().toISOString().split('T')[0],
      bankReference: '',
      fileUrl: '',
      fileName: '',
      notes: ''
    });
  };
  
  // 🔥 批量选择相关函数
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(receivableOrders.map(order => order.id));
      setSelectedOrderIds(allIds);
    } else {
      setSelectedOrderIds(new Set());
    }
  };
  
  const handleSelectOne = (orderId: string, checked: boolean) => {
    const newSelected = new Set(selectedOrderIds);
    if (checked) {
      newSelected.add(orderId);
    } else {
      newSelected.delete(orderId);
    }
    setSelectedOrderIds(newSelected);
  };
  
  const handleBatchDelete = () => {
    if (selectedOrderIds.size === 0) {
      toast.warning('请先选择要删除的订单');
      return;
    }
    
    const orderNumbers = receivableOrders
      .filter(o => selectedOrderIds.has(o.id))
      .map(o => o.orderNumber)
      .join(', ');
    
    if (window.confirm(`⚠️ 确定要删除选中的 ${selectedOrderIds.size} 个订单吗？\n\n订单号：${orderNumbers}\n\n注意：此操作不可恢复！`)) {
      selectedOrderIds.forEach(orderId => {
        deleteOrder(orderId);
      });
      
      toast.success(`已删除 ${selectedOrderIds.size} 个订单`, {
        description: '选中的订单已从系统中删除。'
      });
      
      setSelectedOrderIds(new Set());
    }
  };
  
  // 🔥 临时功能：仅保留SC-NA-260101-0002
  const handleKeepOnlyOne = () => {
    const targetOrder = 'SC-NA-260101-0002';
    const ordersToDelete = receivableOrders.filter(o => o.orderNumber !== targetOrder);
    
    if (ordersToDelete.length === 0) {
      toast.info('没有需要删除的订单', {
        description: '系统中只有目标订单或没有其他订单。'
      });
      return;
    }
    
    const orderNumbers = ordersToDelete.map(o => o.orderNumber).join(', ');
    
    if (window.confirm(`⚠️ 确定要删除以下订单，仅保留 ${targetOrder} 吗？\n\n将删除：${orderNumbers}\n\n共 ${ordersToDelete.length} 个订单\n\n注意：此操作不可恢复！`)) {
      ordersToDelete.forEach(order => {
        deleteOrder(order.id);
      });
      
      toast.success(`已删除 ${ordersToDelete.length} 个订单`, {
        description: `仅保留订单：${targetOrder}`
      });
    }
  };
  
  // 🔥 渲染凭证状态单元格
  const renderProofCell = (
    order: any, 
    proofType: 'depositPayment' | 'depositReceipt' | 'balancePayment' | 'balanceReceipt'
  ) => {
    const isPayment = proofType.includes('Payment');
    const isDeposit = proofType.includes('deposit');
    
    const proofField = isPayment 
      ? (isDeposit ? 'depositPaymentProof' : 'balancePaymentProof')
      : (isDeposit ? 'depositReceiptProof' : 'balanceReceiptProof');
    
    const proof = order[proofField];
    
    // 🔥 客户付款凭证
    if (isPayment) {
      if (!proof) {
        return (
          <div className="space-y-1.5">
            <Badge className="h-5 px-2 text-xs bg-gray-100 text-gray-500 border-gray-300 flex items-center gap-1 w-fit">
              <Clock className="h-3 w-3" />
              待客户上传
            </Badge>
            <div className="text-[10px] text-gray-400">客户尚未上传付款凭证</div>
          </div>
        );
      }
      
      // 已上传
      return (
        <div className="space-y-1.5">
          <Badge className="h-5 px-2 text-xs bg-blue-100 text-blue-700 border-blue-300 flex items-center gap-1 w-fit">
            <FileCheck className="h-3 w-3" />
            已上传
          </Badge>
          <div className="text-[11px] font-semibold text-gray-900">
            {order.currency} {proof.amount?.toLocaleString()}
          </div>
          <div className="text-[10px] text-gray-500">
            {new Date(proof.uploadedAt).toLocaleDateString('zh-CN')}
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleOpenView(order, proof, proofType)}
            className="h-6 text-[10px] px-2 mt-1"
          >
            <Eye className="h-3 w-3 mr-1" />
            查看文件
          </Button>
        </div>
      );
    }
    
    // 🔥 财务收款凭证
    else {
      // 检查客户是否已上传付款凭证
      const paymentProofField = isDeposit ? 'depositPaymentProof' : 'balancePaymentProof';
      const paymentProof = order[paymentProofField];
      
      if (!paymentProof) {
        return (
          <div className="space-y-1.5">
            <Badge className="h-5 px-2 text-xs bg-gray-50 text-gray-400 border-gray-200 flex items-center gap-1 w-fit">
              <Clock className="h-3 w-3" />
              等待客户付款
            </Badge>
            <div className="text-[10px] text-gray-400">客户需先上传付款凭证</div>
          </div>
        );
      }
      
      if (!proof) {
        return (
          <div className="space-y-1.5">
            <Badge className="h-5 px-2 text-xs bg-yellow-100 text-yellow-700 border-yellow-300 flex items-center gap-1 w-fit">
              <AlertCircle className="h-3 w-3" />
              待上传
            </Badge>
            <div className="text-[10px] text-gray-600">请上传收款凭证</div>
            <Button
              size="sm"
              onClick={() => handleOpenUpload(order, proofType as 'depositReceipt' | 'balanceReceipt')}
              className="h-6 text-[10px] px-2 mt-1 bg-[#F96302] hover:bg-[#e05502]"
            >
              <Upload className="h-3 w-3 mr-1" />
              上传凭证
            </Button>
          </div>
        );
      }
      
      // 已上传
      return (
        <div className="space-y-1.5">
          <Badge className="h-5 px-2 text-xs bg-green-100 text-green-700 border-green-300 flex items-center gap-1 w-fit">
            <CheckCircle className="h-3 w-3" />
            已上传
          </Badge>
          <div className="text-[11px] font-semibold text-green-700">
            {order.currency} {proof.actualAmount?.toLocaleString()}
          </div>
          <div className="text-[10px] text-gray-500">
            流水号: {proof.bankReference}
          </div>
          <div className="text-[10px] text-gray-500">
            {new Date(proof.receiptDate).toLocaleDateString('zh-CN')}
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleOpenView(order, proof, proofType)}
            className="h-6 text-[10px] px-2 mt-1"
          >
            <Eye className="h-3 w-3 mr-1" />
            查看文件
          </Button>
        </div>
      );
    }
  };
  
  return (
    <div className="space-y-4 p-6">
      {/* 🔥 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">应收账款管理</h2>
          <p className="text-sm text-gray-500 mt-1">Accounts Receivable Management - 付款凭证审核 & 收款凭证上传 [v2.0-批量删除]</p>
        </div>
        <div className="flex items-center gap-3">
          {/* 🔥 仅保留SC-NA-260101-0002按钮 */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleKeepOnlyOne}
            className="border-purple-300 text-purple-600 hover:bg-purple-50 hover:border-purple-400"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            仅保留0002
          </Button>
          
          {/* 🔥 清空应收账款按钮 */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (window.confirm('⚠️ 确定要清空所有应收账款数据吗？\n\n此操作将删除localStorage中存储的应收账款记录（accountsReceivable），但不会影响订单数据。\n\n注意：此操作不可恢复！')) {
                clearAllAccountsReceivable();
                toast.success('应收账款数据已清空', {
                  description: '所有应收账款记录已从系统中删除。'
                });
              }
            }}
            className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            清空AR数据
          </Button>
          
          <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border">
            <Building className="h-5 w-5 text-[#F96302]" />
            <span className="text-sm text-gray-600">财务部 - {currentUser?.name || currentUser?.email}</span>
          </div>
        </div>
      </div>
      
      {/* 🔥 统计卡片 */}
      <div className="grid grid-cols-7 gap-3">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-xs text-gray-500 mt-1">订单总数</div>
        </div>
        
        <div className="bg-white border border-yellow-200 rounded-lg p-4 bg-yellow-50">
          <div className="text-2xl font-bold text-yellow-700">{stats.depositPending}</div>
          <div className="text-xs text-yellow-600 mt-1">定金待处理</div>
        </div>
        
        <div className="bg-white border border-orange-200 rounded-lg p-4 bg-orange-50">
          <div className="text-2xl font-bold text-orange-700">{stats.balancePending}</div>
          <div className="text-xs text-orange-600 mt-1">余款待处理</div>
        </div>
        
        <div className="bg-white border border-green-200 rounded-lg p-4 bg-green-50">
          <div className="text-2xl font-bold text-green-700">{stats.depositReceived}</div>
          <div className="text-xs text-green-600 mt-1">定金已收</div>
        </div>
        
        <div className="bg-white border border-teal-200 rounded-lg p-4 bg-teal-50">
          <div className="text-2xl font-bold text-teal-700">{stats.balanceReceived}</div>
          <div className="text-xs text-teal-600 mt-1">余款已收</div>
        </div>
        
        <div className="bg-white border border-blue-200 rounded-lg p-4 bg-blue-50">
          <div className="text-lg font-bold text-blue-700">
            ${stats.depositAmount.toLocaleString()}
          </div>
          <div className="text-xs text-blue-600 mt-1">定金金额</div>
        </div>
        
        <div className="bg-white border border-purple-200 rounded-lg p-4 bg-purple-50">
          <div className="text-lg font-bold text-purple-700">
            ${stats.balanceAmount.toLocaleString()}
          </div>
          <div className="text-xs text-purple-600 mt-1">余款金额</div>
        </div>
      </div>
      
      {/* 🔥 订单列表 */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="border-b border-gray-200">
          <div className="px-5 py-3 bg-gray-50">
            <div className="flex gap-3 items-center">
              {/* 搜索框 */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
                <Input
                  placeholder="搜索订单号、客户名称、邮箱..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-9 text-xs"
                />
              </div>
              
              {/* 🔥 批量删除按钮 */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleBatchDelete}
                disabled={selectedOrderIds.size === 0}
                className={`h-9 text-xs ${
                  selectedOrderIds.size > 0 
                    ? 'border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400' 
                    : 'opacity-50 cursor-not-allowed'
                }`}
              >
                <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                批量删除
                {selectedOrderIds.size > 0 && (
                  <Badge className="ml-1.5 bg-red-500 text-white text-[10px] h-4 px-1.5">
                    {selectedOrderIds.size}
                  </Badge>
                )}
              </Button>
            </div>
          </div>
        </div>
        
        {/* 🔥 订单表格 */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 text-[11px]">
                <TableHead className="w-12">
                  <Checkbox
                    checked={receivableOrders.length > 0 && selectedOrderIds.size === receivableOrders.length}
                    onCheckedChange={handleSelectAll}
                    aria-label="全选"
                  />
                </TableHead>
                <TableHead className="w-12">序号</TableHead>
                <TableHead className="w-40">订单编号</TableHead>
                <TableHead className="w-32">客户信息</TableHead>
                <TableHead className="w-28 text-right">订单金额</TableHead>
                <TableHead className="w-36 text-center border-l-2 border-blue-200 bg-blue-50">
                  <div className="font-semibold text-blue-900">定金</div>
                  <div className="font-normal">客户付款凭证</div>
                </TableHead>
                <TableHead className="w-36 text-center bg-blue-50">
                  <div className="font-semibold text-blue-900">定金</div>
                  <div className="font-normal">财务收款凭证</div>
                </TableHead>
                <TableHead className="w-36 text-center border-l-2 border-green-200 bg-green-50">
                  <div className="font-semibold text-green-900">余款</div>
                  <div className="font-normal">客户付款凭证</div>
                </TableHead>
                <TableHead className="w-36 text-center bg-green-50">
                  <div className="font-semibold text-green-900">余款</div>
                  <div className="font-normal">财务收款凭证</div>
                </TableHead>
                <TableHead className="w-24 text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="text-[12px]">
              {receivableOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-12 text-gray-500">
                    <AlertCircle className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                    <p>暂无应收账款订单</p>
                    <p className="text-sm mt-1">当客户接受销售合同后，订单将出现在这里</p>
                  </TableCell>
                </TableRow>
              ) : (
                receivableOrders.map((order, index) => (
                  <TableRow key={order.id} className="hover:bg-gray-50">
                    <TableCell>
                      <Checkbox
                        checked={selectedOrderIds.has(order.id)}
                        onCheckedChange={(checked) => handleSelectOne(order.id, checked as boolean)}
                        aria-label={`选择订单 ${order.orderNumber}`}
                      />
                    </TableCell>
                    
                    <TableCell className="text-gray-500">{index + 1}</TableCell>
                    
                    <TableCell className="font-mono font-semibold text-purple-600">
                      {order.orderNumber}
                    </TableCell>
                    
                    <TableCell>
                      <div className="space-y-0.5">
                        <div className="font-medium text-[11px]">{order.customer}</div>
                        <div className="text-gray-400 text-[10px]">{order.customerEmail}</div>
                      </div>
                    </TableCell>
                    
                    <TableCell className="text-right">
                      <div className="font-bold text-gray-900 text-[13px]">
                        {order.currency} {order.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </div>
                    </TableCell>
                    
                    {/* 🔥 定金-客户付款凭证 */}
                    <TableCell className="border-l-2 border-blue-200 bg-blue-50/30">
                      {renderProofCell(order, 'depositPayment')}
                    </TableCell>
                    
                    {/* 🔥 定金-财务收款凭证 */}
                    <TableCell className="bg-blue-50/30">
                      {renderProofCell(order, 'depositReceipt')}
                    </TableCell>
                    
                    {/* 🔥 余款-客户付款凭证 */}
                    <TableCell className="border-l-2 border-green-200 bg-green-50/30">
                      {renderProofCell(order, 'balancePayment')}
                    </TableCell>
                    
                    {/* 🔥 余款-财务收款凭证 */}
                    <TableCell className="bg-green-50/30">
                      {renderProofCell(order, 'balanceReceipt')}
                    </TableCell>
                    
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          toast.info('订单详情', {
                            description: `订单号: ${order.orderNumber}\n客户: ${order.customer}\n金额: ${order.currency} ${order.totalAmount.toLocaleString()}`
                          });
                        }}
                        className="h-7 text-[11px] px-2"
                      >
                        <Eye className="h-3.5 w-3.5 mr-1" />
                        详情
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      
      {/* 🔥 上传收款凭证Dialog */}
      <Dialog open={uploadDialog} onOpenChange={setUploadDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg flex items-center gap-2">
              <Upload className="h-5 w-5 text-[#F96302]" />
              上传{proofType === 'depositReceipt' ? '定金' : '余款'}收款凭证
            </DialogTitle>
            <DialogDescription>
              订单: {selectedOrder?.orderNumber} | 客户: {selectedOrder?.customer}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 py-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>实际到账金额 <span className="text-red-500">*</span></Label>
                <Input
                  type="number"
                  value={receiptData.actualAmount}
                  onChange={(e) => setReceiptData(prev => ({ ...prev, actualAmount: Number(e.target.value) }))}
                  placeholder="0.00"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>收款日期 <span className="text-red-500">*</span></Label>
                <Input
                  type="date"
                  value={receiptData.receiptDate}
                  onChange={(e) => setReceiptData(prev => ({ ...prev, receiptDate: e.target.value }))}
                  className="mt-1"
                />
              </div>
            </div>
            
            <div>
              <Label>银行流水号 <span className="text-red-500">*</span></Label>
              <Input
                value={receiptData.bankReference}
                onChange={(e) => setReceiptData(prev => ({ ...prev, bankReference: e.target.value }))}
                placeholder="例如：20250101-ABC-123456"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label>收款凭证文件</Label>
              <div className="mt-1 border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-[#F96302] transition-colors cursor-pointer">
                <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-600">点击上传或拖拽文件</p>
                <p className="text-xs text-gray-400 mt-1">支持 PDF、JPG、PNG 格式</p>
              </div>
            </div>
            
            <div>
              <Label>备注</Label>
              <Textarea
                value={receiptData.notes}
                onChange={(e) => setReceiptData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="选填：其他说明信息..."
                rows={3}
                className="mt-1 resize-none"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setUploadDialog(false);
              resetForm();
            }}>
              取消
            </Button>
            <Button 
              onClick={handleUploadReceipt}
              className="bg-[#F96302] hover:bg-[#e05502]"
              disabled={receiptData.actualAmount <= 0 || !receiptData.bankReference.trim()}
            >
              <Upload className="h-4 w-4 mr-1" />
              确认上传
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* 🔥 查看凭证Dialog */}
      <Dialog open={viewDialog} onOpenChange={setViewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              查看凭证详情
            </DialogTitle>
            <DialogDescription>
              订单: {selectedOrder?.orderNumber} | 客户: {selectedOrder?.customer}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 py-4">
            {selectedProof && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-gray-500">
                      {selectedProof.actualAmount ? '实际到账金额' : '付款金额'}
                    </Label>
                    <div className="text-lg font-bold text-gray-900">
                      {selectedOrder?.currency} {(selectedProof.actualAmount || selectedProof.amount)?.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">上传时间</Label>
                    <div className="text-sm text-gray-700">
                      {new Date(selectedProof.uploadedAt).toLocaleString('zh-CN')}
                    </div>
                  </div>
                </div>
                
                <div>
                  <Label className="text-xs text-gray-500">上传人</Label>
                  <div className="text-sm text-gray-700">{selectedProof.uploadedBy}</div>
                </div>
                
                {selectedProof.bankReference && (
                  <div>
                    <Label className="text-xs text-gray-500">银行流水号</Label>
                    <div className="text-sm font-mono text-gray-700">{selectedProof.bankReference}</div>
                  </div>
                )}
                
                {selectedProof.receiptDate && (
                  <div>
                    <Label className="text-xs text-gray-500">收款日期</Label>
                    <div className="text-sm text-gray-700">
                      {new Date(selectedProof.receiptDate).toLocaleDateString('zh-CN')}
                    </div>
                  </div>
                )}
                
                {selectedProof.notes && (
                  <div>
                    <Label className="text-xs text-gray-500">备注</Label>
                    <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded border">
                      {selectedProof.notes}
                    </div>
                  </div>
                )}
                
                <div className="bg-blue-50 border border-blue-200 p-4 rounded">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4 text-blue-600" />
                    <Label className="text-sm font-medium text-blue-900">凭证文件</Label>
                  </div>
                  <div className="text-xs text-blue-700 mb-3">
                    {selectedProof.fileName || 'proof-file.pdf'}
                  </div>
                  
                  {/* 🔥 凭证预览区域 */}
                  <div className="bg-white border-2 border-blue-200 rounded-lg overflow-hidden mb-3">
                    <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-3 py-2 flex items-center justify-between">
                      <span className="text-xs font-medium">凭证预览</span>
                      <Badge className="bg-white/20 text-white text-[10px] px-2 py-0.5">
                        {selectedProof.actualAmount ? '收款凭证' : '付款凭证'}
                      </Badge>
                    </div>
                    <div className="p-3 bg-gray-50">
                      <img 
                        src="https://images.unsplash.com/photo-1634733988138-bf2c3a2a13fa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYW5rJTIwcmVjZWlwdCUyMGRvY3VtZW50fGVufDF8fHx8MTc2NzIxNDQ5N3ww&ixlib=rb-4.1.0&q=80&w=1080"
                        alt="凭证预览"
                        className="w-full h-auto rounded border border-gray-300 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => {
                          window.open('https://images.unsplash.com/photo-1634733988138-bf2c3a2a13fa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYW5rJTIwcmVjZWlwdCUyMGRvY3VtZW50fGVufDF8fHx8MTc2NzIxNDQ5N3ww&ixlib=rb-4.1.0&q=80&w=1080', '_blank');
                        }}
                      />
                      <p className="text-[10px] text-gray-500 text-center mt-2">
                        点击图片可在新窗口中查看完整凭证
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 h-8 text-xs"
                      onClick={() => {
                        window.open('https://images.unsplash.com/photo-1634733988138-bf2c3a2a13fa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYW5rJTIwcmVjZWlwdCUyMGRvY3VtZW50fGVufDF8fHx8MTc2NzIxNDQ5N3ww&ixlib=rb-4.1.0&q=80&w=1080', '_blank');
                      }}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      查看大图
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 h-8 text-xs"
                      onClick={() => {
                        toast.success('下载功能', {
                          description: '凭证文件下载功能已触发。在实际环境中会下载真实的PDF或图片文件。'
                        });
                      }}
                    >
                      <Download className="h-3 w-3 mr-1" />
                      下载凭证
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialog(false)}>
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}