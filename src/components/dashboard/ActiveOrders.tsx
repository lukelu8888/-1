import { toast } from 'sonner@2.0.3';
import { useState, useEffect } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { 
  Package, 
  Search, 
  Eye,
  MessageCircle,
  Phone,
  ExternalLink,
  Truck,
  Clock,
  MapPin,
  Calendar,
  FileText,
  Mail,
  Download,
  Send,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Upload, // 🔥 新增
  DollarSign, // 🔥 新增
  Trash2, // 🔥 批量删除图标
  AlertCircle // 🔥 新增：逾期提醒图标
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Textarea } from '../ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Checkbox } from '../ui/checkbox'; // 🔥 新增
import { useOrders } from '../../contexts/OrderContext';
import { useUser } from '../../contexts/UserContext';
import { sendNotificationToUser } from '../../contexts/NotificationContext';
import { apiFetchJson } from '../../api/backend-auth';
import { useFinance } from '../../contexts/FinanceContext';
import { SalesContractDocument } from '../documents/templates/SalesContractDocument'; // 🔥 使用文档中心模板
import { adaptOrderToSalesContract } from '../../utils/documentDataAdapters'; // 🔥 使用数据适配器
import { PaymentProofDialog } from '../admin/PaymentProofDialog'; // 🔥 用于查看凭证
import { UploadPaymentProofDialog } from './UploadPaymentProofDialog'; // 🔥 用于上传凭证
import { filterNotDeleted } from '../../lib/erp-core/deletion-tombstone';
import { canDeleteOrder } from '../../lib/erp-core/delete-guard';
import { resolveDisplayNumber } from '../../lib/erp-core/number-display';
import { getCurrentUser } from '../../utils/dataIsolation';

interface ActiveOrdersProps {
  orders?: any[];
  onUpdateOrder?: (orderId: string, updatedOrder: any) => void;
  initialOrderId?: string; // 🔥 新增：支持从通知直接打开指定订单
}

export function ActiveOrders({ orders, onUpdateOrder, initialOrderId }: ActiveOrdersProps) {
  const toSafeNumber = (value: unknown): number => {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string') {
      const parsed = Number(value.replace(/,/g, '').trim());
      if (Number.isFinite(parsed)) return parsed;
    }
    return 0;
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  
  // 🔥 批量选择状态
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  
  // 🆕 Submit Response Dialog States
  const [isResponseOpen, setIsResponseOpen] = useState(false);
  const [responseType, setResponseType] = useState<'accept' | 'negotiate' | 'reject' | null>(null);
  const [responseMessage, setResponseMessage] = useState('');
  
  // 🔥 Upload Payment Proof Dialog States
  const [isPaymentProofOpen, setIsPaymentProofOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [paymentFile, setPaymentFile] = useState('');
  const [paymentType, setPaymentType] = useState<'deposit' | 'balance'>('deposit'); // 🔥 新增：区分定金还是余款
  // 移除 viewMode，直接显示合同
  
  // 🔥 查看付款凭证Dialog States（新增）
  const [isViewProofOpen, setIsViewProofOpen] = useState(false);
  const [viewProofOrder, setViewProofOrder] = useState<any>(null);

  // 🔥 使用Context获取真实数据
  const { orders: allOrders, updateOrder, deleteOrder } = useOrders();
  const { user } = useUser();
  const { addAccountReceivable } = useFinance();
  const currentUser = getCurrentUser() as any;
  const effectiveUpdateOrder = onUpdateOrder || updateOrder;

  // 🔥 筛选当前用户的活跃订单
  const activeOrders = allOrders.filter(order => 
    user?.email && 
    order.customerEmail === user.email &&
    order.status !== 'delivered' &&
    order.status !== 'completed' &&
    order.status !== 'cancelled'
  );

  // 🔥 如果有initialOrderId，自动打开该订单的合同视图
  useEffect(() => {
    if (initialOrderId && activeOrders.length > 0) {
      const order = activeOrders.find(o => 
        o.id === initialOrderId || 
        o.orderNumber === initialOrderId
      );
      if (order) {
        setSelectedOrder(order);
        setIsDetailOpen(true);
      }
    }
  }, [initialOrderId, activeOrders]);

  // 🔥 直接使用activeOrders，不再依赖props
  const displayOrders = filterNotDeleted('order', activeOrders, (order) => [
    String(order?.id || ''),
    String(order?.orderNumber || ''),
    String(order?.quotationNumber || ''),
  ]);

  const normalizeRegionToken = (value: string): string =>
    value
      .replace(/North\s*America/gi, 'NA')
      .replace(/South\s*America/gi, 'SA')
      .replace(/Europe/gi, 'EU')
      .replace(/EMEA/gi, 'EMEA');

  const sanitizeDisplayText = (value: unknown): string => {
    if (value === null || value === undefined) return '';
    let text = String(value);
    try {
      if (/%[0-9A-Fa-f]{2}/.test(text)) {
        text = decodeURIComponent(text);
      }
    } catch {
      // ignore invalid URI sequence
    }
    text = normalizeRegionToken(text);
    return text.replace(/\uFFFD/g, '');
  };

  const getStatusBadge = (status: string) => {
    // 🔥 优化：根据订单整体业务流程显示清晰的状态
    switch (status.toLowerCase()) {
      case 'pending':
        return <Badge className="bg-orange-100 text-orange-700 border-orange-300 text-[11px]">Pending Confirmation</Badge>;
      case 'awaiting deposit':
        return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300 text-[11px]">Awaiting Deposit</Badge>;
      case 'payment proof uploaded':
        return <Badge className="bg-purple-100 text-purple-700 border-purple-300 text-[11px]">Deposit Under Review</Badge>;
      case 'deposit received':
        return <Badge className="bg-teal-100 text-teal-700 border-teal-300 text-[11px]">Preparing Production</Badge>;
      case 'payment verification failed':
        return <Badge className="bg-red-100 text-red-700 border-red-300 text-[11px]">Payment Verification Failed</Badge>;
      case 'preparing production':
        return <Badge className="bg-blue-100 text-blue-700 border-blue-300 text-[11px]">Preparing Production</Badge>;
      case 'production':
      case 'in production':
        return <Badge className="bg-blue-100 text-blue-700 border-blue-300 text-[11px]">In Production</Badge>;
      case 'quality_check':
        return <Badge className="bg-indigo-100 text-indigo-700 border-indigo-300 text-[11px]">Quality Check</Badge>;
      case 'ready_to_ship':
        return <Badge className="bg-purple-100 text-purple-700 border-purple-300 text-[11px]">Ready to Ship</Badge>;
      case 'in_transit':
        return <Badge className="bg-green-100 text-green-700 border-green-300 text-[11px]">In Transit</Badge>;
      case 'preparing':
        return <Badge className="bg-blue-100 text-blue-700 border-blue-300 text-[11px]">Preparing</Badge>;
      case 'confirmed':
        return <Badge className="bg-green-100 text-green-700 border-green-300 text-[11px]">Confirmed</Badge>;
      case 'negotiating':
        return <Badge className="bg-orange-100 text-orange-700 border-orange-300 text-[11px]">Negotiating</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-700 border-red-300 text-[11px]">Cancelled</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-700 border-gray-300 text-[11px]">{status}</Badge>;
    }
  };
  
  // 🔥 获取支付状态Badge（客户端视图）
  const getPaymentStatusBadge = (order: any) => {
    // 🔥 新版：同时显示定金和余款状态
    const hasDepositProof = order.depositPaymentProof;
    const hasDepositReceived = order.depositReceiptProof;
    const hasBalanceProof = order.balancePaymentProof;
    const hasBalanceReceived = order.balanceReceiptProof;
    
    // 🔥 计算余款到期日期（基于完货日期或预计交付日期）
    const calculateBalanceDueDate = () => {
      // 优先使用完货日期，其次使用预计交付日期
      const deliveryDate = order.productionCompletedDate || order.expectedDelivery || order.deliveryTime;
      
      if (!deliveryDate) {
        return null;
      }
      
      // 解析日期
      let dueDate: Date;
      if (deliveryDate.includes('days')) {
        // 例如："25-30 days" - 取平均值
        const match = deliveryDate.match(/(\d+)[-~](\d+)\s*days?/);
        if (match) {
          const avgDays = (parseInt(match[1]) + parseInt(match[2])) / 2;
          dueDate = new Date(Date.now() + avgDays * 24 * 60 * 60 * 1000);
        } else {
          const dayMatch = deliveryDate.match(/(\d+)\s*days?/);
          if (dayMatch) {
            dueDate = new Date(Date.now() + parseInt(dayMatch[1]) * 24 * 60 * 60 * 1000);
          } else {
            return null;
          }
        }
      } else {
        // 日期格式 "2026-02-15"
        dueDate = new Date(deliveryDate);
      }
      
      // 计算剩余天数
      const today = new Date();
      const diffTime = dueDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      return {
        date: dueDate.toISOString().split('T')[0],
        daysRemaining: diffDays
      };
    };
    
    const balanceDueInfo = calculateBalanceDueDate();
    
    // 🎯 定金状态
    let depositStatusJSX = null;
    if (hasDepositReceived) {
      depositStatusJSX = (
        <div className="flex items-center gap-2">
          <Badge className="bg-green-100 text-green-700 border-green-300 flex items-center gap-1 text-[11px] px-2 py-0.5">
            <CheckCircle2 className="h-3 w-3" />
            Deposit: Received
          </Badge>
          {hasDepositProof && (
            <Button
              variant="ghost"
              size="sm"
              className="h-5 w-5 p-0 hover:bg-blue-50"
              onClick={(e) => {
                e.stopPropagation();
                setViewProofOrder(order);
                setIsViewProofOpen(true);
              }}
              title="View my deposit proof"
            >
              <Eye className="h-3 w-3 text-blue-600" />
            </Button>
          )}
        </div>
      );
    } else if (hasDepositProof) {
      depositStatusJSX = (
        <div className="flex items-center gap-2">
          <Badge className="bg-purple-100 text-purple-700 border-purple-300 flex items-center gap-1 text-[11px] px-2 py-0.5">
            <Clock className="h-3 w-3" />
            Deposit: Under Review
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            className="h-5 w-5 p-0 hover:bg-blue-50"
            onClick={(e) => {
              e.stopPropagation();
              setViewProofOrder(order);
              setIsViewProofOpen(true);
            }}
            title="View my deposit proof"
          >
            <Eye className="h-3 w-3 text-blue-600" />
          </Button>
        </div>
      );
    } else {
      // 🔥 待上传 - 显示上传按钮
      depositStatusJSX = (
        <div className="flex items-center gap-2">
          <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300 flex items-center gap-1 text-[11px] px-2 py-0.5">
            <DollarSign className="h-3 w-3" />
            Deposit: Pending
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            className="h-5 w-5 p-0 hover:bg-green-50"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedOrder(order);
              // 🔥 预填充定金金额（30%）
              const depositAmount = Math.round(order.totalAmount * 0.3 * 100) / 100;
              setPaymentAmount(depositAmount.toString());
              setPaymentReference('');
              setPaymentNotes('');
              setPaymentFile('');
              setPaymentType('deposit'); // 🔥 设置为定金类型
              setIsPaymentProofOpen(true);
            }}
            title="Upload deposit payment proof"
          >
            <Upload className="h-3 w-3 text-green-600" />
          </Button>
        </div>
      );
    }
    
    // 🎯 余款状态 - 显示到期日期/倒计时
    let balanceStatusJSX = null;
    if (hasBalanceReceived) {
      balanceStatusJSX = (
        <div className="flex items-center gap-2">
          <Badge className="bg-green-100 text-green-700 border-green-300 flex items-center gap-1 text-[11px] px-2 py-0.5">
            <CheckCircle2 className="h-3 w-3" />
            Balance: Received
          </Badge>
          {hasBalanceProof && (
            <Button
              variant="ghost"
              size="sm"
              className="h-5 w-5 p-0 hover:bg-blue-50"
              onClick={(e) => {
                e.stopPropagation();
                setViewProofOrder(order);
                setIsViewProofOpen(true);
              }}
              title="View my balance proof"
            >
              <Eye className="h-3 w-3 text-blue-600" />
            </Button>
          )}
        </div>
      );
    } else if (hasBalanceProof) {
      balanceStatusJSX = (
        <div className="flex items-center gap-2">
          <Badge className="bg-purple-100 text-purple-700 border-purple-300 flex items-center gap-1 text-[11px] px-2 py-0.5">
            <Clock className="h-3 w-3" />
            Balance: Under Review
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            className="h-5 w-5 p-0 hover:bg-blue-50"
            onClick={(e) => {
              e.stopPropagation();
              setViewProofOrder(order);
              setIsViewProofOpen(true);
            }}
            title="View my balance proof"
          >
            <Eye className="h-3 w-3 text-blue-600" />
          </Button>
        </div>
      );
    } else if (hasDepositReceived && balanceDueInfo) {
      // 🔥 定金已收到，显示余款到期日期/倒计时
      const { date, daysRemaining } = balanceDueInfo;
      
      if (daysRemaining < 0) {
        // 已逾期 - 显示红色Badge + 上传按钮
        balanceStatusJSX = (
          <div className="flex items-center gap-2">
            <Badge className="bg-red-100 text-red-700 border-red-300 flex items-center gap-1 text-[11px] px-2 py-0.5">
              <AlertCircle className="h-3 w-3" />
              Balance: Overdue ({Math.abs(daysRemaining)}d)
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              className="h-5 w-5 p-0 hover:bg-green-50"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedOrder(order);
                // 🔥 预填充余款金额（70%）
                const balanceAmount = Math.round(order.totalAmount * 0.7 * 100) / 100;
                setPaymentAmount(balanceAmount.toString());
                setPaymentReference('');
                setPaymentNotes('');
                setPaymentFile('');
                setPaymentType('balance'); // 🔥 设置为余款类型
                setIsPaymentProofOpen(true);
              }}
              title="Upload balance payment proof"
            >
              <Upload className="h-3 w-3 text-green-600" />
            </Button>
          </div>
        );
      } else if (daysRemaining <= 7) {
        // 7天内到期 - 紧急 - 显示橙色Badge + 上传按钮
        balanceStatusJSX = (
          <div className="flex items-center gap-2">
            <Badge className="bg-orange-100 text-orange-700 border-orange-300 flex items-center gap-1 text-[11px] px-2 py-0.5">
              <Clock className="h-3 w-3" />
              Balance: Due in {daysRemaining}d
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              className="h-5 w-5 p-0 hover:bg-green-50"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedOrder(order);
                // 🔥 预填充余款金额（70%）
                const balanceAmount = Math.round(order.totalAmount * 0.7 * 100) / 100;
                setPaymentAmount(balanceAmount.toString());
                setPaymentReference('');
                setPaymentNotes('');
                setPaymentFile('');
                setPaymentType('balance'); // 🔥 设置为余款类型
                setIsPaymentProofOpen(true);
              }}
              title="Upload balance payment proof"
            >
              <Upload className="h-3 w-3 text-green-600" />
            </Button>
          </div>
        );
      } else {
        // 正常 - 显示蓝色Badge + 上传按钮
        balanceStatusJSX = (
          <div className="flex items-center gap-2">
            <Badge className="bg-blue-100 text-blue-700 border-blue-300 flex items-center gap-1 text-[11px] px-2 py-0.5">
              <Clock className="h-3 w-3" />
              Balance: Due in {daysRemaining}d
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              className="h-5 w-5 p-0 hover:bg-green-50"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedOrder(order);
                // 🔥 预填充余款金额（70%）
                const balanceAmount = Math.round(order.totalAmount * 0.7 * 100) / 100;
                setPaymentAmount(balanceAmount.toString());
                setPaymentReference('');
                setPaymentNotes('');
                setPaymentFile('');
                setPaymentType('balance'); // 🔥 设置为余款类型
                setIsPaymentProofOpen(true);
              }}
              title="Upload balance payment proof"
            >
              <Upload className="h-3 w-3 text-green-600" />
            </Button>
          </div>
        );
      }
    } else if (hasDepositReceived) {
      // 🔥 定金已收到，但没有交货日期信息 - 显示上传按钮
      balanceStatusJSX = (
        <div className="flex items-center gap-2">
          <Badge className="bg-blue-100 text-blue-700 border-blue-300 flex items-center gap-1 text-[11px] px-2 py-0.5">
            <Clock className="h-3 w-3" />
            Balance: Awaiting Payment
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            className="h-5 w-5 p-0 hover:bg-green-50"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedOrder(order);
              // 🔥 预填充余款金额（70%）
              const balanceAmount = Math.round(order.totalAmount * 0.7 * 100) / 100;
              setPaymentAmount(balanceAmount.toString());
              setPaymentReference('');
              setPaymentNotes('');
              setPaymentFile('');
              setPaymentType('balance'); // 🔥 设置为余款类型
              setIsPaymentProofOpen(true);
            }}
            title="Upload balance payment proof"
          >
            <Upload className="h-3 w-3 text-green-600" />
          </Button>
        </div>
      );
    } else {
      // 🔥 定金未完成，余款不显示
      balanceStatusJSX = (
        <Badge className="bg-gray-100 text-gray-500 border-gray-300 flex items-center gap-1 text-[11px] px-2 py-0.5">
          <Clock className="h-3 w-3" />
          Balance: N/A
        </Badge>
      );
    }
    
    // 🔥 返回双行显示
    return (
      <div className="flex flex-col gap-1.5">
        {depositStatusJSX}
        {balanceStatusJSX}
      </div>
    );
  };

  const filteredOrders = displayOrders.filter(order =>
    (order.id || order.orderNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.products.some(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getOrderRowId = (order: any, index: number) => order.id || order.orderNumber || `temp-order-${index}`;
  
  // 🔥 批量删除处理
  const handleBatchDelete = () => {
    if (selectedOrderIds.length === 0) {
      toast.error('Please select at least one order to delete!');
      return;
    }
    
    const selectedOrders = filteredOrders.filter((order, index) =>
      selectedOrderIds.includes(getOrderRowId(order, index)),
    );
    const blockedOrders = selectedOrders.filter((order) => !canDeleteOrder(order));
    if (blockedOrders.length > 0) {
      toast.error(`Cannot delete ${blockedOrders.length} order(s) that already reached final workflow.`);
      return;
    }

    selectedOrderIds.forEach(orderId => {
      deleteOrder(orderId);
    });
    
    toast.success(`Successfully deleted ${selectedOrderIds.length} order(s)!`);
    setSelectedOrderIds([]);
  };
  
  // 🔥 全选/取消全选
  const handleSelectAll = (checked: boolean) => {
    const deletableOrderIds = filteredOrders
      .map((order, index) => ({ order, id: getOrderRowId(order, index) }))
      .filter((row) => canDeleteOrder(row.order))
      .map((row) => row.id);
    if (checked) {
      setSelectedOrderIds(deletableOrderIds);
    } else {
      setSelectedOrderIds([]);
    }
  };
  
  // 🔥 单个选择
  const handleSelectOrder = (orderId: string, checked: boolean) => {
    if (checked) {
      setSelectedOrderIds(prev => [...prev, orderId]);
    } else {
      setSelectedOrderIds(prev => prev.filter(id => id !== orderId));
    }
  };

  return (
    <div className="space-y-6">
      {/* Orders Table */}
      <Card>
        <CardContent className="p-0">
          <div className="border-b border-gray-200 px-6 py-4 flex items-center gap-3">
            <Package className="w-5 h-5 text-[#F96302]" strokeWidth={2.5} />
            <h3 className="text-gray-900 uppercase tracking-wide" style={{ fontSize: '14px', fontWeight: 600 }}>
              Active Order List
            </h3>
          </div>
          <div className="p-5 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by order ID or product name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {selectedOrderIds.length > 0 && (
                <Button
                  variant="destructive"
                  size="default"
                  onClick={handleBatchDelete}
                  className="gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete ({selectedOrderIds.length})
                </Button>
              )}
            </div>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  {/* 🔥 全选checkbox列 */}
                  <TableHead className="w-12">
                    <Checkbox
                      checked={
                        filteredOrders.filter((order) => canDeleteOrder(order)).length > 0 &&
                        selectedOrderIds.length === filteredOrders.filter((order) => canDeleteOrder(order)).length
                      }
                      onCheckedChange={handleSelectAll}
                      disabled={filteredOrders.filter((order) => canDeleteOrder(order)).length === 0}
                    />
                  </TableHead>
                  {/* 🔥 序号列 */}
                  <TableHead className="font-bold w-12" style={{ fontSize: '14px' }}>#</TableHead>
                  <TableHead className="font-bold w-32" style={{ fontSize: '14px' }}>Order #</TableHead>
                  <TableHead className="font-bold w-24" style={{ fontSize: '14px' }}>Date</TableHead>
                  <TableHead className="font-bold min-w-[120px]" style={{ fontSize: '14px' }}>Product</TableHead>
                  <TableHead className="font-bold w-20" style={{ fontSize: '14px' }}>Quantity</TableHead>
                  <TableHead className="font-bold w-24" style={{ fontSize: '14px' }}>Price</TableHead>
                  <TableHead className="font-bold w-40" style={{ fontSize: '14px' }}>Payment Status</TableHead>
                  <TableHead className="font-bold w-32" style={{ fontSize: '14px' }}>Order Status</TableHead>
                  <TableHead className="font-bold text-right w-48" style={{ fontSize: '14px' }}>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order, index) => {
                  const firstProduct = order.products[0];
                  const totalQty = order.products.reduce((sum, p) => sum + (p.quantity || p.qty || 0), 0);
                  const productSummary = order.products.length > 1 
                    ? `${firstProduct.name} +${order.products.length - 1} more`
                    : firstProduct.name;
                  const orderDisplayNo = sanitizeDisplayText(order.orderNumber || order.id);
                  const orderDisplayDate = sanitizeDisplayText(order.orderDate || order.date);
                  const productDisplaySummary = sanitizeDisplayText(productSummary);
                  const numberDisplay = resolveDisplayNumber({
                    domain: 'order',
                    internalNo: String(order.orderNumber || order.id || ''),
                    companyId: currentUser?.companyId
                      ? String(currentUser.companyId)
                      : undefined,
                  });
                  
                  // 🔥 修复：确保每个订单都有唯一的ID，优先使用order.id，其次orderNumber，最后使用index
                  const orderId = getOrderRowId(order, index);
                  const isSelected = selectedOrderIds.includes(orderId);
                  
                  const canDelete = canDeleteOrder(order);

                  return (
                    <TableRow key={orderId} className={`hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''}`}>
                      {/* 🔥 checkbox列 */}
                      <TableCell>
                        <Checkbox
                          checked={isSelected}
                          disabled={!canDelete}
                          onCheckedChange={(checked) => {
                            handleSelectOrder(orderId, checked as boolean);
                          }}
                        />
                      </TableCell>
                      {/* 🔥 序号列 */}
                      <TableCell className="text-xs text-gray-600">
                        {index + 1}
                      </TableCell>
                      <TableCell className="text-xs">
                        <button
                          onClick={() => {
                            setSelectedOrder(order);
                            setIsDetailOpen(true);
                          }}
                          className="font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                        >
                          {orderDisplayNo}
                          <ExternalLink className="h-3 w-3" />
                        </button>
                        {numberDisplay.externalNo && (
                          <div className="text-[11px] text-gray-500 mt-0.5">
                            Customer ERP: {numberDisplay.externalNo}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-gray-700">{orderDisplayDate}</TableCell>
                      <TableCell className="text-xs font-medium text-gray-900 max-w-xs truncate">
                        {productDisplaySummary}
                      </TableCell>
                      <TableCell className="text-xs text-gray-700">{totalQty} pcs</TableCell>
                      <TableCell className="text-xs font-medium text-gray-900">${order.totalAmount.toLocaleString()}</TableCell>
                      <TableCell className="text-xs">
                        {getPaymentStatusBadge(order)}
                      </TableCell>
                      <TableCell className="text-xs">{getStatusBadge(order.status)}</TableCell>
                      <TableCell className="text-xs">
                        <div className="flex items-center justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => {
                              setSelectedOrder(order);
                              setIsDetailOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          
                          {/* 🆕 Submit按钮 - 仅在pending状态显示 */}
                          {(order.status === 'pending' || order.status === 'Pending') && !order.customerFeedback && (
                            <Button
                              size="sm"
                              className="h-8 bg-[#F96302] hover:bg-[#E05502] text-white px-3"
                              onClick={() => {
                                setSelectedOrder(order);
                                setResponseType(null);
                                setResponseMessage('');
                                setIsResponseOpen(true);
                              }}
                            >
                              <Send className="h-3.5 w-3.5 mr-1" />
                              Submit
                            </Button>
                          )}
                          
                          {/* 🔥 Upload Payment Proof按钮 - 仅在Awaiting Deposit状态显示 */}
                          {order.status === 'Awaiting Deposit' && !order.depositPaymentProof && (
                            <Button
                              size="sm"
                              className="h-8 bg-green-600 hover:bg-green-700 text-white px-3"
                              onClick={() => {
                                setSelectedOrder(order);
                                // 🔥 预填充定金金额（30%）
                                const depositAmount = Math.round(order.totalAmount * 0.3 * 100) / 100;
                                setPaymentAmount(depositAmount.toString());
                                setPaymentReference('');
                                setPaymentNotes('');
                                setPaymentFile('');
                                setIsPaymentProofOpen(true);
                              }}
                            >
                              <Upload className="h-3.5 w-3.5 mr-1" />
                              Upload Proof
                            </Button>
                          )}
                          
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-8 w-8 p-0"
                          >
                            <Truck className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-8 w-8 p-0"
                          >
                            <MessageCircle className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-8 w-8 p-0"
                          >
                            <Phone className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Order Details Dialog - 直接显示销售合同 */}
      <Dialog open={isDetailOpen} onOpenChange={(open) => {
        setIsDetailOpen(open);
      }}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto p-4">
          <div className="sticky top-0 bg-white z-10 border-b px-4 py-3">
            <DialogTitle className="text-lg">
              Sales Contract - {sanitizeDisplayText(selectedOrder?.orderNumber || selectedOrder?.id)}
            </DialogTitle>
            <DialogDescription className="text-sm">
              View and download your sales contract
            </DialogDescription>
          </div>
          {selectedOrder && (
            <div className="py-4">
              {/* 合同模板 - 放大32% (1.2 × 1.1 = 1.32) */}
              <div className="flex justify-center">
                <div style={{ 
                  transform: 'scale(1.32)', 
                  transformOrigin: 'top center'
                }}>
                  <SalesContractDocument 
                    data={adaptOrderToSalesContract({
                      orderNumber: selectedOrder.orderNumber || selectedOrder.id,
                      customer: selectedOrder.customer || user?.name || '',
                      customerEmail: selectedOrder.customerEmail || user?.email,
                      customerCountry: selectedOrder.customerCountry || selectedOrder.country,
                      customerAddress: selectedOrder.shippingAddress || selectedOrder.customerAddress,
                      customerContact: selectedOrder.contactPerson,
                      customerPhone: selectedOrder.contactPhone || selectedOrder.phone,
                      date: selectedOrder.date,
                      expectedDelivery: selectedOrder.deliveryTime || selectedOrder.expectedDelivery || '25-30 days',
                      totalAmount: toSafeNumber(selectedOrder.totalAmount),
                      currency: selectedOrder.currency || 'USD',
                      products: (Array.isArray(selectedOrder.products) ? selectedOrder.products : []).map((p: any) => {
                        const quantity = toSafeNumber(p.quantity ?? p.qty);
                        const unitPrice = toSafeNumber(p.price ?? p.unitPrice);
                        return {
                        name: p.name,
                        specs: p.specification || p.specs,
                        quantity,
                        unitPrice,
                        totalPrice: toSafeNumber(p.totalPrice) || (quantity * unitPrice),
                        unit: p.unit || 'pcs',
                        hsCode: p.hsCode,
                        modelNo: p.modelNo,
                        imageUrl: p.imageUrl
                      }}),
                      shippingMethod: selectedOrder.shippingMethod,
                      quotationNumber: selectedOrder.quotationNumber,
                      region: (selectedOrder.region || 'NA') as 'NA' | 'SA' | 'EU',
                      paymentTerms: selectedOrder.paymentTerms,
                      tradeTerms: selectedOrder.tradeTerms,
                      portOfLoading: selectedOrder.portOfLoading,
                      portOfDestination: selectedOrder.portOfDestination
                    })}
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-2 pt-4 mt-4 border-t print:hidden sticky bottom-0 bg-white">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsDetailOpen(false)}
                >
                  Close
                </Button>
                <Button
                  size="sm"
                  className="bg-[#F96302] hover:bg-[#E05502]"
                  onClick={() => window.print()}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Print / Download PDF
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 🆕 Submit Response Dialog */}
      <Dialog open={isResponseOpen} onOpenChange={setIsResponseOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader className="pb-3">
            <DialogTitle className="text-base">Submit Your Response</DialogTitle>
            <DialogDescription className="text-xs">
              Order: {selectedOrder?.orderNumber || selectedOrder?.id}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {/* 选择响应类型 */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-700">Select Your Response:</label>
              <div className="grid grid-cols-1 gap-1.5">
                {/* Accept Option */}
                <button
                  onClick={() => setResponseType('accept')}
                  className={`p-2.5 border-2 rounded-sm flex items-center gap-2.5 transition-all ${
                    responseType === 'accept'
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-green-300'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    responseType === 'accept' ? 'bg-green-500' : 'bg-gray-200'
                  }`}>
                    <CheckCircle2 className={`w-4 h-4 ${
                      responseType === 'accept' ? 'text-white' : 'text-gray-500'
                    }`} strokeWidth={2.5} />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-bold text-xs text-gray-900">Accept Contract</div>
                    <div className="text-[11px] text-gray-600 leading-tight">Confirm and proceed with production</div>
                  </div>
                </button>

                {/* Negotiate Option */}
                <button
                  onClick={() => setResponseType('negotiate')}
                  className={`p-2.5 border-2 rounded-sm flex items-center gap-2.5 transition-all ${
                    responseType === 'negotiate'
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-200 hover:border-orange-300'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    responseType === 'negotiate' ? 'bg-orange-500' : 'bg-gray-200'
                  }`}>
                    <MessageSquare className={`w-4 h-4 ${
                      responseType === 'negotiate' ? 'text-white' : 'text-gray-500'
                    }`} strokeWidth={2.5} />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-bold text-xs text-gray-900">Request Changes</div>
                    <div className="text-[11px] text-gray-600 leading-tight">Discuss contract terms or details</div>
                  </div>
                </button>

                {/* Reject Option */}
                <button
                  onClick={() => setResponseType('reject')}
                  className={`p-2.5 border-2 rounded-sm flex items-center gap-2.5 transition-all ${
                    responseType === 'reject'
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-200 hover:border-red-300'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    responseType === 'reject' ? 'bg-red-500' : 'bg-gray-200'
                  }`}>
                    <XCircle className={`w-4 h-4 ${
                      responseType === 'reject' ? 'text-white' : 'text-gray-500'
                    }`} strokeWidth={2.5} />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-bold text-xs text-gray-900">Cancel Order</div>
                    <div className="text-[11px] text-gray-600 leading-tight">Decline this contract</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Message Input - 仅在选择了negotiate或reject时显示 */}
            {(responseType === 'negotiate' || responseType === 'reject') && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-700">
                  {responseType === 'negotiate' ? 'What changes do you need?' : 'Reason for cancellation:'}
                </label>
                <Textarea
                  placeholder={
                    responseType === 'negotiate'
                      ? 'e.g., Adjust delivery schedule, different payment terms...'
                      : 'e.g., Budget constraints, timeline issues...'
                  }
                  value={responseMessage}
                  onChange={(e) => setResponseMessage(e.target.value)}
                  rows={3}
                  className="text-xs resize-none"
                />
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 mt-4 pt-3 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsResponseOpen(false);
                setResponseType(null);
                setResponseMessage('');
              }}
              className="px-3 h-8 text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className={`px-4 h-8 text-xs ${
                responseType === 'accept'
                  ? 'bg-green-600 hover:bg-green-700'
                  : responseType === 'negotiate'
                  ? 'bg-orange-600 hover:bg-orange-700'
                  : responseType === 'reject'
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-[#F96302] hover:bg-[#E05502]'
              }`}
              disabled={!responseType || ((responseType === 'negotiate' || responseType === 'reject') && !responseMessage.trim())}
              onClick={async () => {
                if (!selectedOrder || !user || !responseType) return;
                if ((responseType === 'negotiate' || responseType === 'reject') && !responseMessage.trim()) return;

                const orderId = selectedOrder.id || selectedOrder.orderNumber;
                try {
                  // 🔥 先落库：客户确认/协商/取消 写入后端
                  await apiFetchJson<{ message: string; order: any }>(
                    `/api/orders/${encodeURIComponent(orderId)}/customer-response`,
                    {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        response: responseType,
                        message: responseMessage.trim() || undefined,
                      }),
                    }
                  );
                  // 刷新订单列表（从后端拉取，含 customerFeedback）
                  window.dispatchEvent(new CustomEvent('ordersUpdated'));

                  if (responseType === 'accept') {
                    const orderNumber = selectedOrder.orderNumber || selectedOrder.id;
                    const orderCurrency = selectedOrder.currency || 'USD';
                    const orderTotalAmount = selectedOrder.totalAmount;
                    const depositAmount = Math.round(orderTotalAmount * 0.3 * 100) / 100;
                    const balanceAmount = Math.round(orderTotalAmount * 0.7 * 100) / 100;

                    // 步骤2️⃣: 立即发送定金付款通知给客户（客户提交的瞬间收到）
                    const dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                  sendNotificationToUser(user.email, {
                    type: 'payment_reminder',
                    title: `💰 Deposit Payment Required - ${orderNumber}`,
                    message: `Thank you for accepting the contract! Please arrange deposit payment of ${orderCurrency} ${depositAmount.toLocaleString()} (30%) within 7 business days. After payment, please upload your payment proof in Active Orders. Production will commence upon receipt.`,
                    relatedId: orderNumber,
                    relatedType: 'payment',
                    sender: 'finance@gaoshengda.com',
                    metadata: {
                      customerName: selectedOrder.customer || user.name,
                      orderNumber: orderNumber,
                      totalAmount: `${orderCurrency} ${orderTotalAmount.toLocaleString()}`,
                      depositAmount: `${orderCurrency} ${depositAmount.toLocaleString()}`,
                      balanceAmount: `${orderCurrency} ${balanceAmount.toLocaleString()}`,
                      dueDate: dueDate,
                      paymentTerms: '30% T/T deposit, 70% balance before shipment'
                    }
                  });

                  // 步骤3️⃣: 发送确认通知给Admin
                  sendNotificationToUser('admin@cosun.com', {
                    type: 'order_confirmed',
                    title: '✅ Customer Accepted Contract',
                    message: `${selectedOrder.customer || user.name} has accepted the sales contract for order ${orderNumber}. Related Quotation: ${selectedOrder.quotationNumber || 'N/A'}`,
                    relatedId: orderNumber,
                    relatedType: 'order',
                    sender: user.email,
                    metadata: {
                      customerName: selectedOrder.customer || user.name,
                      orderNumber: orderNumber,
                      quotationNumber: selectedOrder.quotationNumber || 'N/A',
                      amount: `${orderCurrency} ${orderTotalAmount.toLocaleString()}`,
                      confirmedAt: new Date().toISOString()
                    }
                  });

                  // 步骤4️⃣: 自动流转合同给财务并创建应收账款
                  // 🔢 生成应收款编号: YS-{REGION}-YYMMDD-XXXX
                  const now = new Date();
                  const yy = String(now.getFullYear()).slice(2);
                  const mm = String(now.getMonth() + 1).padStart(2, '0');
                  const dd = String(now.getDate()).padStart(2, '0');
                  const dateStr = `${yy}${mm}${dd}`;
                  
                  // 从订单号中提取区域代码 (ORD-{REGION}-YYMMDD-XXXX)
                  const region = orderNumber.split('-')[1] || 'NA';
                  
                  // 生成当日同区域的应收款序列号
                  // TODO: 在实际环境中，需要从财务系统查询当日同区域的应收款数量
                  const sequence = '0001'; // 简化实现，实际应该查询已有记录
                  
                  const arNumber = `YS-${region}-${dateStr}-${sequence}`;
                  
                  addAccountReceivable({
                    arNumber: arNumber,
                    orderNumber: orderNumber,
                    quotationNumber: selectedOrder.quotationNumber,
                    contractNumber: orderNumber, // 销售合同号即订单号
                    customerName: selectedOrder.customer || user.name,
                    customerEmail: user.email,
                    region: region,
                    invoiceDate: new Date().toISOString().split('T')[0],
                    dueDate: dueDate,
                    totalAmount: orderTotalAmount,
                    paidAmount: 0,
                    remainingAmount: orderTotalAmount,
                    currency: orderCurrency,
                    status: 'pending',
                    paymentTerms: '30% T/T deposit, 70% balance before shipment',
                    products: selectedOrder.products.map((p: any) => ({
                      name: p.name,
                      quantity: p.quantity || p.qty || 0,
                      unitPrice: p.unitPrice || p.price || 0,
                      totalPrice: p.totalPrice || ((p.quantity || p.qty || 0) * (p.unitPrice || p.price || 0))
                    })),
                    paymentHistory: [],
                    createdBy: 'system-auto',
                    notes: `Auto-generated from customer contract acceptance. Quotation: ${selectedOrder.quotationNumber || 'N/A'}`
                  });

                  // 步骤5️⃣: 通知财务部门新的应收账款
                  sendNotificationToUser('finance@gaoshengda.com', {
                    type: 'contract_review',
                    title: `📄 New Sales Contract - ${orderNumber}`,
                    message: `Sales contract for order ${orderNumber} has been accepted by customer. Accounts Receivable ${arNumber} created. Related Quotation: ${selectedOrder.quotationNumber || 'N/A'}`,
                    relatedId: arNumber,
                    relatedType: 'accounts_receivable',
                    sender: 'system-auto',
                    metadata: {
                      customerName: selectedOrder.customer || user.name,
                      orderNumber: orderNumber,
                      quotationNumber: selectedOrder.quotationNumber || 'N/A',
                      arNumber: arNumber,
                      amount: `${orderCurrency} ${orderTotalAmount.toLocaleString()}`,
                      depositAmount: `${orderCurrency} ${depositAmount.toLocaleString()}`,
                      paymentTerms: '30% T/T deposit, 70% balance before shipment',
                      dueDate: dueDate
                    }
                  });

                  // 步骤6️⃣: 显示成功提示
                  toast.success('✅ Contract Accepted Successfully!', {
                    description: `Deposit payment notification sent. Accounts Receivable ${arNumber} created and routed to finance.`,
                    duration: 6000
                  });

                } else {
                  // 协商或取消（已落库，仅发通知 + 提示）
                  const notificationTitle = responseType === 'reject' ? 'Customer Cancelled Order' : 'Customer Requested Changes';
                  const notificationMessage = `${selectedOrder.customer || user.name} responded to order ${selectedOrder.orderNumber || selectedOrder.id}: ${responseMessage}`;

                  sendNotificationToUser('admin@cosun.com', {
                    type: responseType === 'reject' ? 'order_cancelled' : 'order_feedback',
                    title: notificationTitle,
                    message: notificationMessage,
                    relatedId: selectedOrder.orderNumber || selectedOrder.id,
                    relatedType: 'order',
                    sender: user.email,
                    metadata: {
                      customerName: selectedOrder.customer || user.name,
                      feedbackType: responseType,
                      feedbackMessage: responseMessage,
                      orderNumber: selectedOrder.orderNumber || selectedOrder.id
                    }
                  });

                  toast.success('Response submitted successfully!', {
                    description: responseType === 'reject' 
                      ? 'The order has been cancelled.'
                      : 'We will review your request and get back to you soon.',
                    duration: 3000
                  });
                }

                setIsResponseOpen(false);
                setResponseType(null);
                setResponseMessage('');
                setSelectedOrder(null);
                } catch (e: any) {
                  toast.error(e?.message || '提交失败，请重试');
                }
              }}
            >
              <Send className="w-3 h-3 mr-1.5" />
              Submit Response
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 🔥 Upload Payment Proof Dialog */}
      <UploadPaymentProofDialog
        open={isPaymentProofOpen}
        onOpenChange={setIsPaymentProofOpen}
        order={selectedOrder}
        user={user}
        updateOrder={effectiveUpdateOrder}
        sendNotificationToUser={sendNotificationToUser}
        paymentAmount={paymentAmount}
        setPaymentAmount={setPaymentAmount}
        paymentReference={paymentReference}
        setPaymentReference={setPaymentReference}
        paymentNotes={paymentNotes}
        setPaymentNotes={setPaymentNotes}
        paymentFile={paymentFile}
        setPaymentFile={setPaymentFile}
        paymentType={paymentType}
      />

      {/* 🔥 查看付款凭证Dialog - 使用PaymentProofDialog组件 */}
      <PaymentProofDialog
        open={isViewProofOpen}
        onOpenChange={setIsViewProofOpen}
        order={viewProofOrder}
      />
    </div>
  );
}
