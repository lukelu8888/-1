/**
 * 🔥 应收账款管理 - 财务模块（Admin & 财务专员通用）
 * 
 * 表格列结构：
 * - 序号
 * - 订单编号（SC-开头）
 * - 客户信息
 * - 订单金额
 * - 定金-客户付款凭证（2个状态区域）
 * - 定金-财务收款凭证（2个状态区域）
 * - 余款-客户付款凭证（2个状态区域）
 * - 余款-财务收款凭证（2个状态区域）
 * - 操作
 */

import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
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
  X,
  Bell,
  Mail,
  MessageSquare,
  Send,
  CheckSquare
} from 'lucide-react';
import { useOrders } from '../../contexts/OrderContext';
import { getCurrentUser } from '../../utils/dataIsolation';
import { toast } from 'sonner@2.0.3';
import { apiFetchJson, resolveBackendPublicUrl } from '../../api/backend-auth';

export function AccountsReceivableList() {
  const { orders, updateOrder } = useOrders();
  const currentUser = getCurrentUser();

  // 进入应收账款页面时主动请求一次订单列表（GET /api/orders）
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('ordersUpdated'));
  }, []);

  const [searchTerm, setSearchTerm] = useState('');
  
  // 🔥 Dialog状态
  const [uploadDialog, setUploadDialog] = useState(false);
  const [viewDialog, setViewDialog] = useState(false);
  const [notifyDialog, setNotifyDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [proofType, setProofType] = useState<'depositReceipt' | 'balanceReceipt'>('depositReceipt');
  const [selectedProof, setSelectedProof] = useState<any>(null);
  const [previewImage, setPreviewImage] = useState<string>('');
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  
  // 🔥 通知表单数据
  const [notifyData, setNotifyData] = useState({
    notifyTargets: { salesperson: true, customer: true },
    notifyMethods: { inApp: true, email: true },
    message: ''
  });
  
  // 🔥 上传表单数据
  const [receiptData, setReceiptData] = useState({
    actualAmount: 0,
    receiptDate: new Date().toISOString().split('T')[0],
    bankReference: '',
    fileUrl: '',
    fileName: '',
    notes: ''
  });
  
  // 🔥 文件上传状态
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [selectedReceiptFile, setSelectedReceiptFile] = useState<File | null>(null);
  const [selectedReceiptPreview, setSelectedReceiptPreview] = useState<string>('');
  useEffect(() => {
    return () => {
      if (selectedReceiptPreview.startsWith('blob:')) {
        URL.revokeObjectURL(selectedReceiptPreview);
      }
    };
  }, [selectedReceiptPreview]);
  
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
    setUploadedFile(null);
    setSelectedReceiptFile(null);
    setSelectedReceiptPreview('');
    
    setUploadDialog(true);
  };
  
  // 🔥 打开查看凭证Dialog
  const handleOpenView = (order: any, proof: any, type: string) => {
    setSelectedOrder(order);
    setSelectedProof(proof);
    setProofType(type as 'depositReceipt' | 'balanceReceipt');
    setViewDialog(true);
    
    // 🔥 预览图片
    if (proof.fileUrl) {
      setPreviewImage(resolveBackendPublicUrl(proof.fileUrl));
    }
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

    if (!selectedReceiptFile && !receiptData.fileUrl) {
      toast.error('请先上传收款凭证文件！');
      return;
    }

    setUploadingReceipt(true);
    try {
      let fileUrl = receiptData.fileUrl;
      let fileName = receiptData.fileName;

      // 可选：先上传文件，拿到可访问 URL
      if (selectedReceiptFile) {
        const formData = new FormData();
        formData.append('file', selectedReceiptFile);
        const uploadRes = await apiFetchJson<{ fileUrl: string; fileName: string }>(
          '/api/upload-payment-proof-file',
          {
            method: 'POST',
            body: formData,
          }
        );
        fileUrl = resolveBackendPublicUrl(uploadRes.fileUrl);
        fileName = uploadRes.fileName || selectedReceiptFile.name;
      }

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
            fileUrl: fileUrl || undefined,
            fileName: fileName || undefined,
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
    } finally {
      setUploadingReceipt(false);
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
    setUploadedFile(null);
    setSelectedReceiptFile(null);
    setSelectedReceiptPreview('');
  };
  
  // 🔥 文件选择（真实上传在提交时执行）
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('文件格式不支持', { description: '仅支持 PDF、JPG、PNG 格式' });
        e.currentTarget.value = '';
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error('文件过大', { description: '请上传 10MB 以内文件' });
        e.currentTarget.value = '';
        return;
      }
      setSelectedReceiptFile(file);
      setUploadedFile(file.name);
      if (file.type.startsWith('image/')) {
        if (selectedReceiptPreview.startsWith('blob:')) {
          URL.revokeObjectURL(selectedReceiptPreview);
        }
        setSelectedReceiptPreview(URL.createObjectURL(file));
      } else {
        if (selectedReceiptPreview.startsWith('blob:')) {
          URL.revokeObjectURL(selectedReceiptPreview);
        }
        setSelectedReceiptPreview('');
      }
      setReceiptData(prev => ({
        ...prev,
        fileName: file.name,
        fileUrl: ''
      }));
      toast.success('文件已选择', {
        description: `${file.name} (${(file.size / 1024).toFixed(2)} KB)`
      });
    }
  };

  const handleRemoveSelectedFile = () => {
    if (selectedReceiptPreview.startsWith('blob:')) {
      URL.revokeObjectURL(selectedReceiptPreview);
    }
    setSelectedReceiptFile(null);
    setUploadedFile(null);
    setSelectedReceiptPreview('');
    setReceiptData(prev => ({ ...prev, fileName: '', fileUrl: '' }));
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
      
      // 已上传 - 🔥 优化：Badge和眼睛图标单行显示
      return (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Badge className="h-5 px-2 text-xs bg-blue-100 text-blue-700 border-blue-300 flex items-center gap-1 w-fit">
              <FileCheck className="h-3 w-3" />
              已上传
            </Badge>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleOpenView(order, proof, proofType)}
              className="h-5 w-5 p-0 hover:bg-blue-50"
              title="查看客户付款凭证"
            >
              <Eye className="h-3 w-3 text-blue-600" />
            </Button>
          </div>
          <div className="text-[11px] font-semibold text-gray-900">
            {order.currency} {proof.amount?.toLocaleString()}
          </div>
          <div className="text-[10px] text-gray-500">
            {new Date(proof.uploadedAt).toLocaleDateString('zh-CN')}
          </div>
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
        // 待上传 - 🔥 优化：Badge和上传图标单行显示
        return (
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Badge className="h-5 px-2 text-xs bg-yellow-100 text-yellow-700 border-yellow-300 flex items-center gap-1 w-fit">
                <AlertCircle className="h-3 w-3" />
                待上传
              </Badge>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleOpenUpload(order, proofType as 'depositReceipt' | 'balanceReceipt')}
                className="h-5 w-5 p-0 hover:bg-green-50"
                title="上传财务收款凭证"
              >
                <Upload className="h-3 w-3 text-green-600" />
              </Button>
            </div>
            <div className="text-[10px] text-gray-600">请上传收款凭证</div>
          </div>
        );
      }
      
      // 已上传
      return (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Badge className="h-5 px-2 text-xs bg-green-100 text-green-700 border-green-300 flex items-center gap-1 w-fit">
              <CheckCircle className="h-3 w-3" />
              已上传
            </Badge>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleOpenView(order, proof, proofType)}
              className="h-5 w-5 p-0 hover:bg-blue-50"
              title="查看财务收款凭证"
            >
              <Eye className="h-3 w-3 text-blue-600" />
            </Button>
          </div>
          <div className="text-[11px] font-semibold text-green-700">
            {order.currency} {proof.actualAmount?.toLocaleString()}
          </div>
          <div className="text-[10px] text-gray-500">
            {new Date(proof.receiptDate).toLocaleDateString('zh-CN')}
          </div>
        </div>
      );
    }
  };
  
  return (
    <div className="space-y-4">
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
      
      {/* 🔥 搜索栏 + 刷新（订单数据来自接口） */}
      <div className="bg-white border border-gray-200 rounded-lg p-3 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
          <Input
            placeholder="搜索订单号、客户名称、邮箱..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 text-xs shrink-0"
          onClick={() => {
            window.dispatchEvent(new CustomEvent('ordersUpdated'));
            toast.success('已从服务器刷新订单列表');
          }}
        >
          刷新
        </Button>
      </div>
      
      {/* 🔥 订单表格 */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 text-[11px]">
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
                  <TableCell colSpan={9} className="text-center py-12 text-gray-500">
                    <AlertCircle className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                    <p>暂无应收账款订单</p>
                    <p className="text-sm mt-1">当客户接受销售合同后，订单将出现在这里</p>
                  </TableCell>
                </TableRow>
              ) : (
                receivableOrders.map((order, index) => (
                  <TableRow key={order.id} className="hover:bg-gray-50">
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
              <Label>收款凭证文件 <span className="text-red-500">*</span></Label>
              <label htmlFor="receipt-file-upload" className="mt-1 block">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-[#F96302] transition-colors cursor-pointer">
                  {uploadedFile ? (
                    <div className="space-y-2">
                      {selectedReceiptPreview ? (
                        <img
                          src={selectedReceiptPreview}
                          alt="收款凭证预览"
                          className="max-h-44 max-w-full mx-auto rounded border object-contain bg-gray-50"
                        />
                      ) : (
                        <FileCheck className="h-8 w-8 mx-auto text-green-600 mb-2" />
                      )}
                      <p className="text-sm text-green-700 font-medium">{uploadedFile}</p>
                      <p className="text-xs text-gray-400">文件已选择，点击可重新选择</p>
                      <div className="flex justify-center">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={(ev) => {
                            ev.preventDefault();
                            ev.stopPropagation();
                            handleRemoveSelectedFile();
                          }}
                        >
                          <X className="h-3.5 w-3.5 mr-1" />
                          移除文件
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600">点击上传或拖拽文件</p>
                      <p className="text-xs text-gray-400 mt-1">支持 PDF、JPG、PNG 格式，最大 10MB</p>
                    </>
                  )}
                </div>
                <input
                  id="receipt-file-upload"
                  type="file"
                  accept="application/pdf,image/jpeg,image/png"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
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
              disabled={
                uploadingReceipt ||
                receiptData.actualAmount <= 0 ||
                !receiptData.bankReference.trim() ||
                (!selectedReceiptFile && !receiptData.fileUrl)
              }
            >
              <Upload className="h-4 w-4 mr-1" />
              {uploadingReceipt ? '上传中...' : '确认上传'}
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
                        src={previewImage || resolveBackendPublicUrl(selectedProof.fileUrl)}
                        alt="凭证预览"
                        className="w-full h-auto rounded border border-gray-300 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => {
                          const previewUrl = previewImage || resolveBackendPublicUrl(selectedProof.fileUrl);
                          if (previewUrl) window.open(previewUrl, '_blank');
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
                        const previewUrl = previewImage || resolveBackendPublicUrl(selectedProof.fileUrl);
                        if (previewUrl) window.open(previewUrl, '_blank');
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