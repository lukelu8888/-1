import React, { useState, useMemo, useEffect } from 'react';
import {
  DollarSign,
  Search,
  Filter,
  Download,
  Eye,
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingDown,
  Calendar,
  Building2,
  FileText,
  CreditCard,
  ArrowUpRight
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '../ui/dialog';
import { toast } from 'sonner';
import { apiFetchJson } from '../../api/backend-auth';

/**
 * 💳 应付账款管理模块（供应商付款）
 * 
 * 核心功能：
 * 1. 应付账款列表（来自采购订单）
 * 2. 供应商对账
 * 3. 付款申请与审批
 * 4. 付款执行（银行转账）
 * 5. 付款记录查询
 * 6. 账龄分析
 */

// 应付账款状态
type PayableStatus = 
  | 'pending'     // 待付款
  | 'applied'     // 已申请
  | 'approved'    // 已审批
  | 'processing'  // 处理中
  | 'paid'        // 已付款
  | 'overdue'     // 逾期
  | 'partial'     // 部分付款
  | 'cancelled';  // 已取消

interface AccountPayable {
  id: string;
  apNumber: string; // 应付账款编号
  poNumber: string; // 关联采购订单号
  supplier: {
    id: string;
    name: string;
    code: string;
    bankAccount?: string;
  };
  invoiceNumber?: string; // 发票号
  invoiceDate?: string;
  dueDate: string; // 到期日
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  currency: string;
  paymentTerms: string;
  status: PayableStatus;
  appliedBy?: string; // 申请人
  appliedDate?: string;
  approvedBy?: string;
  approvedDate?: string;
  paidDate?: string;
  paymentMethod?: string; // 付款方式
  transactionRef?: string; // 银行流水号
  remarks?: string;
  agingDays?: number; // 账龄天数
}

interface PurchaseRequirementApiItem {
  quantity?: number;
  targetPrice?: number | null;
  targetCurrency?: string | null;
}

interface PurchaseRequirementApi {
  id?: string;
  requirementNo?: string;
  sourceRef?: string | null;
  status?: string;
  requiredDate?: string | null;
  createdDate?: string | null;
  region?: string | null;
  paymentTerms?: string | null;
  items?: PurchaseRequirementApiItem[];
}

const AccountsPayableManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedSupplier, setSelectedSupplier] = useState<string>('all');
  const [viewPayable, setViewPayable] = useState<AccountPayable | null>(null);
  const [showPayableDialog, setShowPayableDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedPayable, setSelectedPayable] = useState<AccountPayable | null>(null);

  // 🔥 本地兜底数据（后端不可用时展示）
  const localAccountsPayable: AccountPayable[] = useMemo(() => [
    {
      id: 'ap1',
      apNumber: 'AP-2025-1201',
      poNumber: 'PO-2025-1201',
      supplier: {
        id: 'sup1',
        name: '深圳市鑫源电器有限公司',
        code: 'SUP-SZ-001',
        bankAccount: '6222 **** **** 1234'
      },
      invoiceNumber: 'INV-20251218-001',
      invoiceDate: '2025-12-18',
      dueDate: '2026-01-17',
      totalAmount: 12500.00,
      paidAmount: 3750.00, // 已付30%定金
      remainingAmount: 8750.00,
      currency: 'USD',
      paymentTerms: 'T/T 30% deposit, 70% before shipment',
      status: 'partial',
      appliedBy: '张采购',
      appliedDate: '2025-12-19',
      approvedBy: '财务总监-王',
      approvedDate: '2025-12-19',
      paidDate: '2025-12-02',
      paymentMethod: '电汇',
      transactionRef: 'TXN-20251202-001',
      agingDays: 3
    },
    {
      id: 'ap2',
      apNumber: 'AP-2025-1202',
      poNumber: 'PO-2025-1202',
      supplier: {
        id: 'sup2',
        name: '温州华联卫浴科技有限公司',
        code: 'SUP-WZ-002',
        bankAccount: '6228 **** **** 5678'
      },
      invoiceNumber: 'INV-20251215-002',
      invoiceDate: '2025-12-15',
      dueDate: '2026-01-14',
      totalAmount: 9700.00,
      paidAmount: 0,
      remainingAmount: 9700.00,
      currency: 'USD',
      paymentTerms: 'T/T 30 days after delivery',
      status: 'approved',
      appliedBy: '王采购',
      appliedDate: '2025-12-20',
      approvedBy: '财务总监-王',
      approvedDate: '2025-12-20',
      agingDays: 6
    },
    {
      id: 'ap3',
      apNumber: 'AP-2025-1203',
      poNumber: 'PO-2025-1203',
      supplier: {
        id: 'sup3',
        name: '广东佛山铝材制造有限公司',
        code: 'SUP-FS-003',
        bankAccount: '6225 **** **** 9012'
      },
      dueDate: '2026-01-10',
      totalAmount: 3200.00,
      paidAmount: 0,
      remainingAmount: 3200.00,
      currency: 'USD',
      paymentTerms: 'L/C at sight',
      status: 'pending',
      agingDays: 0
    },
    {
      id: 'ap4',
      apNumber: 'AP-2025-1101',
      poNumber: 'PO-2025-1101',
      supplier: {
        id: 'sup4',
        name: '江苏劳保用品集团',
        code: 'SUP-JS-004',
        bankAccount: '6230 **** **** 3456'
      },
      invoiceNumber: 'INV-20251105-004',
      invoiceDate: '2025-11-05',
      dueDate: '2025-12-05',
      totalAmount: 12750.00,
      paidAmount: 0,
      remainingAmount: 12750.00,
      currency: 'USD',
      paymentTerms: 'T/T 30 days',
      status: 'overdue',
      appliedBy: '孙采购',
      appliedDate: '2025-12-06',
      agingDays: 46
    },
    {
      id: 'ap5',
      apNumber: 'AP-2025-1105',
      poNumber: 'PO-2025-1105',
      supplier: {
        id: 'sup1',
        name: '深圳市鑫源电器有限公司',
        code: 'SUP-SZ-001',
        bankAccount: '6222 **** **** 1234'
      },
      invoiceNumber: 'INV-20251110-005',
      invoiceDate: '2025-11-10',
      dueDate: '2025-12-10',
      totalAmount: 8500.00,
      paidAmount: 8500.00,
      remainingAmount: 0,
      currency: 'USD',
      paymentTerms: 'T/T 30 days',
      status: 'paid',
      appliedBy: '张采购',
      appliedDate: '2025-12-08',
      approvedBy: '财务总监-王',
      approvedDate: '2025-12-08',
      paidDate: '2025-12-09',
      paymentMethod: '电汇',
      transactionRef: 'TXN-20251209-002',
      agingDays: 41
    }
  ], []);

  const [apiAccountsPayable, setApiAccountsPayable] = useState<AccountPayable[] | null>(null);
  const accountsPayable = apiAccountsPayable ?? localAccountsPayable;

  useEffect(() => {
    let alive = true;
    const loadAccountsPayable = async () => {
      try {
        const res = await apiFetchJson<{ requirements: PurchaseRequirementApi[] }>('/api/purchase-requirements');
        const requirements = Array.isArray(res?.requirements) ? res.requirements : [];

        const mapped: AccountPayable[] = requirements.map((r, index) => {
          const items = Array.isArray(r.items) ? r.items : [];
          const totalAmount = items.reduce((sum, it) => {
            const qty = Number(it.quantity || 0);
            const price = Number(it.targetPrice || 0);
            return sum + qty * price;
          }, 0);
          const currency = (items.find(it => it?.targetCurrency)?.targetCurrency || 'USD') as string;
          const dueDate = r.requiredDate || r.createdDate || new Date().toISOString().slice(0, 10);
          const createdAt = new Date(r.createdDate || dueDate);
          const today = new Date();
          const agingDays = Math.max(0, Math.floor((today.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)));
          const statusMap: Record<string, PayableStatus> = {
            pending: 'pending',
            partial: 'partial',
            processing: 'processing',
            completed: 'paid',
          };
          const status: PayableStatus = statusMap[String(r.status || 'pending')] || 'pending';

          return {
            id: r.id || `ap-${index + 1}`,
            apNumber: r.requirementNo ? `AP-${String(r.requirementNo).replace(/^QR-/, '')}` : `AP-AUTO-${index + 1}`,
            poNumber: r.sourceRef || r.requirementNo || '-',
            supplier: {
              id: `sup-${index + 1}`,
              name: '待分配供应商',
              code: (r.region || 'N/A') as string,
            },
            dueDate,
            totalAmount,
            paidAmount: 0,
            remainingAmount: totalAmount,
            currency: currency.toUpperCase(),
            paymentTerms: r.paymentTerms || 'T/T',
            status,
            agingDays,
          };
        });

        if (alive) setApiAccountsPayable(mapped);
      } catch {
        if (alive) setApiAccountsPayable(null);
      }
    };

    void loadAccountsPayable();
    return () => {
      alive = false;
    };
  }, []);

  // 统计数据
  const statistics = useMemo(() => {
    const total = accountsPayable.length;
    const pending = accountsPayable.filter(ap => ap.status === 'pending').length;
    const approved = accountsPayable.filter(ap => ap.status === 'approved').length;
    const overdue = accountsPayable.filter(ap => ap.status === 'overdue').length;
    const totalPayable = accountsPayable.reduce((sum, ap) => sum + ap.remainingAmount, 0);
    const overdueAmount = accountsPayable
      .filter(ap => ap.status === 'overdue')
      .reduce((sum, ap) => sum + ap.remainingAmount, 0);

    return { total, pending, approved, overdue, totalPayable, overdueAmount };
  }, [accountsPayable]);

  // 筛选应付账款
  const filteredPayables = useMemo(() => {
    return accountsPayable.filter(ap => {
      const matchSearch = searchTerm === '' ||
        ap.apNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ap.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ap.supplier.name.toLowerCase().includes(searchTerm.toLowerCase());

      const matchStatus = selectedStatus === 'all' || ap.status === selectedStatus;
      const matchSupplier = selectedSupplier === 'all' || ap.supplier.id === selectedSupplier;

      return matchSearch && matchStatus && matchSupplier;
    });
  }, [accountsPayable, searchTerm, selectedStatus, selectedSupplier]);

  // 获取状态标签
  const getStatusBadge = (status: PayableStatus) => {
    const config: Record<PayableStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      pending: { label: '待付款', variant: 'secondary' },
      applied: { label: '已申请', variant: 'outline' },
      approved: { label: '已审批', variant: 'default' },
      processing: { label: '处理中', variant: 'default' },
      paid: { label: '已付款', variant: 'default' },
      overdue: { label: '逾期', variant: 'destructive' },
      partial: { label: '部分付款', variant: 'outline' },
      cancelled: { label: '已取消', variant: 'destructive' }
    };
    return config[status];
  };

  // 处理付款申请
  const handlePaymentApply = (payable: AccountPayable) => {
    setSelectedPayable(payable);
    setShowPaymentDialog(true);
  };

  // 执行付款
  const handlePayment = () => {
    if (!selectedPayable) return;
    
    // 这里应该调用后端API执行付款
    toast.success(`付款申请已提交：${selectedPayable.apNumber}`);
    setShowPaymentDialog(false);
    setSelectedPayable(null);
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">应付账款管理</h2>
          <p className="text-sm text-slate-500 mt-1">Accounts Payable - 供应商付款管理</p>
        </div>
      </div>

      {/* 数据统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              应付账款
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{statistics.total}</div>
            <p className="text-xs text-slate-500 mt-1">Total Payables</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              待付款
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{statistics.pending}</div>
            <p className="text-xs text-slate-500 mt-1">Pending Payment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              已审批
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{statistics.approved}</div>
            <p className="text-xs text-slate-500 mt-1">Approved</p>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-4 h-4" />
              逾期
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{statistics.overdue}</div>
            <p className="text-xs text-red-500 mt-1">Overdue</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              应付总额
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#F96302]">
              ${statistics.totalPayable.toLocaleString()}
            </div>
            <p className="text-xs text-slate-500 mt-1">Total Outstanding</p>
          </CardContent>
        </Card>
      </div>

      {/* 筛选和搜索 */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="搜索应付账款号、采购订单号、供应商..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="付款状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="pending">待付款</SelectItem>
                <SelectItem value="applied">已申请</SelectItem>
                <SelectItem value="approved">已审批</SelectItem>
                <SelectItem value="paid">已付款</SelectItem>
                <SelectItem value="overdue">逾期</SelectItem>
                <SelectItem value="partial">部分付款</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" className="w-full">
              <Filter className="w-4 h-4 mr-2" />
              账龄分析
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 应付账款列表 */}
      <Card>
        <CardHeader>
          <CardTitle>应付账款列表</CardTitle>
          <CardDescription>共 {filteredPayables.length} 条应付账款</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600">账款编号</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600">供应商</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600">关联订单</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-slate-600">应付金额</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-slate-600">已付金额</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-slate-600">待付金额</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600">到期日</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600">状态</th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-slate-600">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayables.map((ap) => {
                  const statusBadge = getStatusBadge(ap.status);
                  const isOverdue = ap.status === 'overdue';
                  
                  return (
                    <tr key={ap.id} className={`border-b border-slate-100 hover:bg-slate-50 ${isOverdue ? 'bg-red-50' : ''}`}>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-sm text-slate-900">{ap.apNumber}</div>
                        {ap.invoiceNumber && (
                          <div className="text-xs text-slate-500">发票: {ap.invoiceNumber}</div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm text-slate-900">{ap.supplier.name}</div>
                        <div className="text-xs text-slate-500">{ap.supplier.code}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm text-blue-600">{ap.poNumber}</div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="font-semibold text-sm text-slate-900">
                          {ap.currency} {ap.totalAmount.toLocaleString()}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="text-sm text-green-600">
                          {ap.currency} {ap.paidAmount.toLocaleString()}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className={`font-semibold text-sm ${isOverdue ? 'text-red-600' : 'text-amber-600'}`}>
                          {ap.currency} {ap.remainingAmount.toLocaleString()}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className={`text-sm ${isOverdue ? 'text-red-600 font-semibold' : 'text-slate-900'}`}>
                          {ap.dueDate}
                        </div>
                        {ap.agingDays !== undefined && (
                          <div className={`text-xs ${isOverdue ? 'text-red-500' : 'text-slate-500'}`}>
                            账龄 {ap.agingDays} 天
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setViewPayable(ap);
                              setShowPayableDialog(true);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {(ap.status === 'pending' || ap.status === 'approved') && ap.remainingAmount > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handlePaymentApply(ap)}
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            >
                              <CreditCard className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 查看应付账款详情对话框 */}
      <Dialog open={showPayableDialog} onOpenChange={setShowPayableDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>应付账款详情 - {viewPayable?.apNumber}</DialogTitle>
            <DialogDescription>Accounts Payable Details</DialogDescription>
          </DialogHeader>

          {viewPayable && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-500">供应商：</span>
                  <span className="font-semibold ml-2">{viewPayable.supplier.name}</span>
                </div>
                <div>
                  <span className="text-slate-500">关联订单：</span>
                  <span className="ml-2">{viewPayable.poNumber}</span>
                </div>
                <div>
                  <span className="text-slate-500">发票号：</span>
                  <span className="ml-2">{viewPayable.invoiceNumber || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-500">发票日期：</span>
                  <span className="ml-2">{viewPayable.invoiceDate || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-500">到期日：</span>
                  <span className="ml-2">{viewPayable.dueDate}</span>
                </div>
                <div>
                  <span className="text-slate-500">付款条款：</span>
                  <span className="ml-2">{viewPayable.paymentTerms}</span>
                </div>
                <div>
                  <span className="text-slate-500">应付总额：</span>
                  <span className="font-semibold ml-2">
                    {viewPayable.currency} {viewPayable.totalAmount.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">已付金额：</span>
                  <span className="text-green-600 font-semibold ml-2">
                    {viewPayable.currency} {viewPayable.paidAmount.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">待付金额：</span>
                  <span className="text-amber-600 font-semibold ml-2">
                    {viewPayable.currency} {viewPayable.remainingAmount.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">状态：</span>
                  <Badge variant={getStatusBadge(viewPayable.status).variant} className="ml-2">
                    {getStatusBadge(viewPayable.status).label}
                  </Badge>
                </div>
              </div>

              {viewPayable.paidDate && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3">付款记录</h4>
                  <div className="bg-slate-50 p-3 rounded text-sm space-y-2">
                    <div>
                      <span className="text-slate-500">付款日期：</span>
                      <span className="ml-2">{viewPayable.paidDate}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">付款方式：</span>
                      <span className="ml-2">{viewPayable.paymentMethod}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">银行流水号：</span>
                      <span className="ml-2">{viewPayable.transactionRef}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">审批人：</span>
                      <span className="ml-2">{viewPayable.approvedBy}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPayableDialog(false)}>
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 付款申请对话框 */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>付款申请</DialogTitle>
            <DialogDescription>Payment Application</DialogDescription>
          </DialogHeader>

          {selectedPayable && (
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">账款编号：</span>
                  <span className="font-semibold">{selectedPayable.apNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">供应商：</span>
                  <span>{selectedPayable.supplier.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">待付金额：</span>
                  <span className="font-bold text-[#F96302] text-lg">
                    {selectedPayable.currency} {selectedPayable.remainingAmount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">到期日：</span>
                  <span>{selectedPayable.dueDate}</span>
                </div>
              </div>

              <div className="border-t pt-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  付款方式
                </label>
                <Select defaultValue="wire">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="wire">电汇（Wire Transfer）</SelectItem>
                    <SelectItem value="check">支票（Check）</SelectItem>
                    <SelectItem value="lc">信用证（L/C）</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  付款备注
                </label>
                <textarea
                  className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
                  rows={3}
                  placeholder="填写付款说明..."
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
              取消
            </Button>
            <Button 
              className="bg-[#F96302] hover:bg-[#E05502]"
              onClick={handlePayment}
            >
              提交付款申请
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AccountsPayableManagement;
