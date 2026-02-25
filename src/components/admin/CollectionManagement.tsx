import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Card } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import {
  Search, Plus, Eye, CheckCircle2, XCircle, DollarSign, 
  TrendingUp, Calendar, Building2, FileText, CreditCard, Banknote, Trash2
} from 'lucide-react';
import { usePayments, PaymentRecord } from '../../contexts/PaymentContext';
import { useFinance } from '../../contexts/FinanceContext';
import { toast } from 'sonner@2.0.3';

export default function CollectionManagement() {
  const { payments, getPaymentsByReceivable, deletePayment } = usePayments();
  const { accountsReceivable, recordPayment } = useFinance();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [viewPayment, setViewPayment] = useState<PaymentRecord | null>(null);
  const [selectedPaymentIds, setSelectedPaymentIds] = useState<string[]>([]);
  
  // 🎯 多维度筛选状态 (老板角色专用)
  const [filterRegion, setFilterRegion] = useState('all');
  const [filterCustomer, setFilterCustomer] = useState('all');
  
  // 🔒 获取当前用户角色
  const [currentUserRole, setCurrentUserRole] = React.useState<string | null>(null);
  
  React.useEffect(() => {
    const currentUserStr = localStorage.getItem('cosun_current_user');
    console.log('🔍 [CollectionManagement] localStorage中的current_user:', currentUserStr);
    if (currentUserStr) {
      try {
        const currentUser = JSON.parse(currentUserStr);
        console.log('🔍 [CollectionManagement] 解析后的用户对象:', currentUser);
        console.log('🔍 [CollectionManagement] currentUser.role:', currentUser.role);
        console.log('🔍 [CollectionManagement] currentUser.userRole:', currentUser.userRole);
        const roleValue = currentUser.role || currentUser.userRole || null;
        setCurrentUserRole(roleValue);
        console.log('✅ [CollectionManagement] 最终设置的角色:', roleValue);
        console.log('✅ [CollectionManagement] 是否为业务员:', roleValue === 'Sales_Rep');
      } catch (e) {
        console.error('❌ [CollectionManagement] Failed to parse current user:', e);
      }
    } else {
      console.error('❌ [CollectionManagement] localStorage中没有cosun_current_user');
    }
  }, []);

  // 统计数据
  const stats = {
    total: payments.length,
    confirmed: payments.filter(p => p.status === 'confirmed').length,
    pending: payments.filter(p => p.status === 'pending').length,
    totalAmount: payments
      .filter(p => p.status === 'confirmed')
      .reduce((sum, p) => sum + p.amount, 0)
  };

  // 过滤收款记录
  const filteredPayments = payments.filter(payment => {
    const matchesSearch = 
      (payment.paymentNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (payment.customerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (payment.orderNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (payment.receivableNumber || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || payment.status === filterStatus;
    
    // 🎯 多维度筛选
    const matchesRegion = filterRegion === 'all' || payment.region === filterRegion;
    const matchesCustomer = filterCustomer === 'all' || payment.customerName === filterCustomer;
    
    return matchesSearch && matchesFilter && matchesRegion && matchesCustomer;
  });
  
  React.useEffect(() => {
    const visibleIds = new Set(filteredPayments.map((p) => p.id));
    setSelectedPaymentIds((prev) => prev.filter((id) => visibleIds.has(id)));
  }, [filteredPayments]);
  
  // 🎯 从数据中提取唯一值用于筛选选项
  const uniqueCustomers = [...new Set(payments.map(p => p.customerName).filter(Boolean))];
  const allSelected = filteredPayments.length > 0 && selectedPaymentIds.length === filteredPayments.length;

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedPaymentIds(filteredPayments.map((p) => p.id));
      return;
    }
    setSelectedPaymentIds([]);
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedPaymentIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
      return;
    }
    setSelectedPaymentIds((prev) => prev.filter((x) => x !== id));
  };

  const handleBatchDelete = () => {
    if (selectedPaymentIds.length === 0) {
      toast.error('请先勾选要删除的收款记录');
      return;
    }

    if (!window.confirm(`确认删除选中的 ${selectedPaymentIds.length} 条收款记录？`)) return;

    selectedPaymentIds.forEach((id) => deletePayment(id));
    setSelectedPaymentIds([]);
    toast.success(`已删除 ${selectedPaymentIds.length} 条收款记录`);
  };

  // 获取状态配置
  const getStatusConfig = (status: string) => {
    const configs = {
      confirmed: { 
        label: '已确认', 
        color: 'bg-emerald-50 text-emerald-700 border-emerald-200', 
        icon: CheckCircle2 
      },
      pending: { 
        label: '待确认', 
        color: 'bg-amber-50 text-amber-700 border-amber-200', 
        icon: Calendar 
      },
      rejected: { 
        label: '已拒绝', 
        color: 'bg-rose-50 text-rose-700 border-rose-200', 
        icon: XCircle 
      }
    };
    return configs[status as keyof typeof configs] || configs.pending;
  };

  // 获取付款方式图标
  const getPaymentMethodIcon = (method: string) => {
    const icons = {
      'T/T': Banknote,
      'L/C': FileText,
      'D/P': FileText,
      'D/A': FileText,
      'PayPal': CreditCard,
      'Western Union': Building2,
      'Other': DollarSign
    };
    return icons[method as keyof typeof icons] || DollarSign;
  };

  // 查看收款详情
  const handleViewPayment = (payment: PaymentRecord) => {
    setViewPayment(payment);
  };

  return (
    <div className="space-y-4">
      {/* 统计卡片 */}
      {/* 🎨 方案A：台湾大厂原汁原味风格 - SAP/Oracle单行紧凑摘要栏 */}
      {/* 🔒 只对非业务员角色显示统计卡片 */}
      {currentUserRole !== 'Sales_Rep' && (
        <div className="bg-white border border-gray-300 rounded">
          <div className="px-5 py-3 border-b border-gray-200 bg-gray-50">
            <h3 className="font-semibold text-gray-700 uppercase tracking-wide" style={{ fontSize: '14px' }}>收款统计</h3>
          </div>
          <div className="px-5 py-3 flex items-center gap-8" style={{ fontSize: '12px' }}>
            <div className="flex items-center gap-2">
              <span className="text-gray-600">总收款笔数:</span>
              <span className="font-semibold text-gray-900">{stats.total}</span>
            </div>
            <div className="w-px h-4 bg-gray-300" />
            <div className="flex items-center gap-2">
              <span className="text-gray-600">已确认:</span>
              <span className="font-semibold text-orange-600">{stats.confirmed}</span>
            </div>
            <div className="w-px h-4 bg-gray-300" />
            <div className="flex items-center gap-2">
              <span className="text-gray-600">待确认:</span>
              <span className="font-semibold text-gray-900">{stats.pending}</span>
            </div>
            <div className="w-px h-4 bg-gray-300" />
            <div className="flex items-center gap-2">
              <span className="text-gray-600">已收总额:</span>
              <span className="font-semibold text-gray-900">${(stats.totalAmount / 1000).toFixed(0)}K</span>
            </div>
          </div>
        </div>
      )}

      {/* 列表卡片 */}
      <Card className="border border-gray-200">
        {/* 搜索和筛选栏 */}
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <div className="flex gap-3 items-center">
            {/* 搜索框 */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
              <Input
                placeholder="搜索收款编号、客户名称、订单号..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>

            {/* 清除筛选按钮 - 固定位置 */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchTerm('');
                setFilterStatus('all');
                setFilterRegion('all');
                setFilterCustomer('all');
              }}
              disabled={searchTerm === '' && filterStatus === 'all' && filterRegion === 'all' && filterCustomer === 'all'}
              className="h-9 px-3 text-gray-600 hover:text-orange-600 disabled:opacity-40"
              style={{ fontSize: '12px' }}
            >
              <XCircle className="w-3.5 h-3.5 mr-1" />
              清除
            </Button>

            <Button
              variant="destructive"
              size="sm"
              onClick={handleBatchDelete}
              disabled={selectedPaymentIds.length === 0}
              className="h-9 px-3 text-xs gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              批量删除{selectedPaymentIds.length > 0 ? ` (${selectedPaymentIds.length})` : ''}
            </Button>

            {/* 状态筛选 */}
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[130px] h-9 text-xs bg-white">
                <SelectValue placeholder="全部状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" style={{ fontSize: '12px' }}>全部状态</SelectItem>
                <SelectItem value="confirmed" style={{ fontSize: '12px' }}>已确认</SelectItem>
                <SelectItem value="pending" style={{ fontSize: '12px' }}>待确认</SelectItem>
                <SelectItem value="rejected" style={{ fontSize: '12px' }}>已拒绝</SelectItem>
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
                    {uniqueCustomers.slice(0, 30).map((customer) => (
                      <SelectItem key={customer} value={customer as string} style={{ fontSize: '12px' }}>
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
                <TableHead className="w-10">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={(checked) => handleSelectAll(Boolean(checked))}
                  />
                </TableHead>
                <TableHead className="text-xs py-3 w-14">序号</TableHead>
                <TableHead className="text-xs py-3">收款编号</TableHead>
                <TableHead className="text-xs">应收账款号</TableHead>
                <TableHead className="text-xs">订单号</TableHead>
                <TableHead className="text-xs">客户名称</TableHead>
                <TableHead className="text-xs">收款金额</TableHead>
                <TableHead className="text-xs">付款方式</TableHead>
                <TableHead className="text-xs">收款日期</TableHead>
                <TableHead className="text-xs">收款人</TableHead>
                <TableHead className="text-xs">状态</TableHead>
                <TableHead className="text-xs text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayments.map((payment, index) => {
                const PaymentIcon = getPaymentMethodIcon(payment.paymentMethod);
                return (
                  <TableRow key={payment.id} className="hover:bg-emerald-50/30">
                    <TableCell className="py-3">
                      <Checkbox
                        checked={selectedPaymentIds.includes(payment.id)}
                        onCheckedChange={(checked) => handleSelectOne(payment.id, Boolean(checked))}
                      />
                    </TableCell>
                    <TableCell className="text-xs text-gray-500">{index + 1}</TableCell>
                    <TableCell className="py-3">
                      <button
                        onClick={() => handleViewPayment(payment)}
                        className="text-xs text-emerald-600 hover:text-emerald-800 hover:underline cursor-pointer"
                      >
                        {payment.paymentNumber}
                      </button>
                    </TableCell>
                    <TableCell className="text-xs">
                      <span className="text-blue-600 font-mono">
                        {payment.receivableNumber}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs">
                      <span className="text-purple-600 font-mono">
                        {payment.orderNumber}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs">{payment.customerName}</TableCell>
                    <TableCell className="text-xs">
                      <span className="font-semibold text-emerald-600">
                        {payment.currency} {payment.amount.toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs">
                      <div className="flex items-center gap-1">
                        <PaymentIcon className="w-3.5 h-3.5 text-gray-500" />
                        <span>{payment.paymentMethod}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-gray-600">
                      {payment.paymentDate}
                    </TableCell>
                    <TableCell className="text-xs text-gray-600">
                      {payment.receivedBy}
                    </TableCell>
                    <TableCell className="py-3">
                      <Badge className={`h-5 px-2 text-[10px] border ${getStatusConfig(payment.status).color}`}>
                        {getStatusConfig(payment.status).label}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3 text-right">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 px-3 text-xs"
                        onClick={() => handleViewPayment(payment)}
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" />
                        查看
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* 空状态 */}
        {filteredPayments.length === 0 && (
          <div className="text-center py-12">
            <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">暂无收款记录</p>
          </div>
        )}
      </Card>

      {/* 查看收款详情对话框 */}
      <Dialog open={viewPayment !== null} onOpenChange={() => setViewPayment(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-600" />
              收款详情
            </DialogTitle>
            <DialogDescription>
              收款编号: {viewPayment?.paymentNumber}
            </DialogDescription>
          </DialogHeader>

          {viewPayment && (
            <div className="space-y-6">
              {/* 状态标识 */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Badge className={`h-6 px-3 text-xs border ${getStatusConfig(viewPayment.status).color}`}>
                    {getStatusConfig(viewPayment.status).label}
                  </Badge>
                  <span className="text-sm text-gray-600">
                    创建于 {new Date(viewPayment.createdAt).toLocaleString('zh-CN')}
                  </span>
                </div>
              </div>

              {/* 收款信息 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-gray-600">收款编号</label>
                  <p className="text-sm font-mono text-emerald-600">
                    {viewPayment.paymentNumber}
                  </p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-gray-600">应收账款号</label>
                  <p className="text-sm font-mono text-blue-600">
                    {viewPayment.receivableNumber}
                  </p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-gray-600">订单号</label>
                  <p className="text-sm font-mono text-purple-600">
                    {viewPayment.orderNumber}
                  </p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-gray-600">客户名称</label>
                  <p className="text-sm">{viewPayment.customerName}</p>
                </div>
              </div>

              {/* 金额信息 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-gray-600">收款金额</label>
                  <p className="text-2xl font-semibold text-emerald-600">
                    {viewPayment.currency} {viewPayment.amount.toLocaleString()}
                  </p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-gray-600">收款日期</label>
                  <p className="text-sm">{viewPayment.paymentDate}</p>
                </div>
              </div>

              {/* 付款信息 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-gray-600">付款方式</label>
                  <p className="text-sm">{viewPayment.paymentMethod}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-gray-600">银行流水号</label>
                  <p className="text-sm font-mono">{viewPayment.bankReference}</p>
                </div>
                {viewPayment.bankName && (
                  <div className="space-y-1 col-span-2">
                    <label className="text-xs text-gray-600">收款银行</label>
                    <p className="text-sm">{viewPayment.bankName}</p>
                  </div>
                )}
              </div>

              {/* 确认信息 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-gray-600">收款确认人</label>
                  <p className="text-sm">{viewPayment.receivedBy}</p>
                </div>
                {viewPayment.confirmedAt && (
                  <div className="space-y-1">
                    <label className="text-xs text-gray-600">确认时间</label>
                    <p className="text-sm">
                      {new Date(viewPayment.confirmedAt).toLocaleString('zh-CN')}
                    </p>
                  </div>
                )}
              </div>

              {/* 备注 */}
              {viewPayment.notes && (
                <div className="space-y-1">
                  <label className="text-xs text-gray-600">备注</label>
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                    {viewPayment.notes}
                  </p>
                </div>
              )}

              {/* 收款凭证 */}
              {viewPayment.proofFileName && (
                <div className="space-y-1">
                  <label className="text-xs text-gray-600">收款凭证</label>
                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded">
                    <FileText className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">{viewPayment.proofFileName}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
