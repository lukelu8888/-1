import React, { useEffect, useMemo, useState } from 'react';
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
import { sharedRoleUiPreferenceService } from '../../lib/supabaseService';
import { getColumnStyle, renderColumnResizeHandle } from './admin-organization-profile/peopleCenterVisuals';
import { toast } from 'sonner@2.0.3';

type CollectionColumnKey =
  | 'select'
  | 'index'
  | 'paymentNo'
  | 'receivableNo'
  | 'orderNo'
  | 'customer'
  | 'amount'
  | 'method'
  | 'date'
  | 'receiver'
  | 'status'
  | 'actions';

const COLLECTION_TABLE_UI_PREFERENCE_PREFIX = 'collection_management_table_column_widths';
const COLLECTION_COLUMN_ORDER: CollectionColumnKey[] = [
  'select',
  'index',
  'paymentNo',
  'receivableNo',
  'orderNo',
  'customer',
  'amount',
  'method',
  'date',
  'receiver',
  'status',
  'actions',
];

const COLLECTION_COLUMN_MIN_WIDTHS: Record<CollectionColumnKey, number> = {
  select: 36,
  index: 54,
  paymentNo: 146,
  receivableNo: 132,
  orderNo: 132,
  customer: 170,
  amount: 122,
  method: 120,
  date: 116,
  receiver: 104,
  status: 112,
  actions: 132,
};

const COLLECTION_TABLE_DEFAULT_WIDTHS: Record<CollectionColumnKey, number> = {
  select: 42,
  index: 58,
  paymentNo: 160,
  receivableNo: 148,
  orderNo: 144,
  customer: 188,
  amount: 132,
  method: 132,
  date: 124,
  receiver: 116,
  status: 120,
  actions: 150,
};

const normalizeCollectionPreferenceRole = (role?: string | null) => {
  const normalized = String(role || '').trim();
  return normalized || 'Admin';
};

const getCollectionPreferenceKey = () => `${COLLECTION_TABLE_UI_PREFERENCE_PREFIX}:v1`;

const mergeStoredCollectionColumnWidths = (
  stored: Partial<Record<CollectionColumnKey, number>> | null | undefined,
) => {
  const next = { ...COLLECTION_TABLE_DEFAULT_WIDTHS };
  COLLECTION_COLUMN_ORDER.forEach((key) => {
    const candidate = Number(stored?.[key]);
    if (Number.isFinite(candidate) && candidate > 0) {
      next[key] = Math.max(COLLECTION_COLUMN_MIN_WIDTHS[key], Math.round(candidate));
    }
  });
  return next;
};

const fitCollectionColumnWidthsToContainer = (
  preferred: Record<CollectionColumnKey, number>,
  containerWidth: number,
) => {
  if (!Number.isFinite(containerWidth) || containerWidth <= 0) return preferred;

  const minimumTotal = COLLECTION_COLUMN_ORDER.reduce(
    (sum, key) => sum + COLLECTION_COLUMN_MIN_WIDTHS[key],
    0,
  );

  if (containerWidth <= minimumTotal) {
    const scale = containerWidth / minimumTotal;
    const compressed = { ...preferred };
    COLLECTION_COLUMN_ORDER.forEach((key) => {
      compressed[key] = Math.max(24, Math.round(COLLECTION_COLUMN_MIN_WIDTHS[key] * scale));
    });
    const total = COLLECTION_COLUMN_ORDER.reduce((sum, key) => sum + compressed[key], 0);
    const remainder = Math.round(containerWidth - total);
    if (remainder !== 0) {
      compressed.actions = Math.max(24, compressed.actions + remainder);
    }
    return compressed;
  }

  const next = { ...preferred };
  COLLECTION_COLUMN_ORDER.forEach((key) => {
    next[key] = COLLECTION_COLUMN_MIN_WIDTHS[key];
  });

  const preferredExtra = COLLECTION_COLUMN_ORDER.reduce(
    (sum, key) => sum + Math.max((preferred[key] || 0) - COLLECTION_COLUMN_MIN_WIDTHS[key], 0),
    0,
  );
  const distributableWidth = containerWidth - minimumTotal;

  if (preferredExtra > 0 && distributableWidth > 0) {
    COLLECTION_COLUMN_ORDER.forEach((key) => {
      const extra = Math.max((preferred[key] || 0) - COLLECTION_COLUMN_MIN_WIDTHS[key], 0);
      next[key] += Math.round((extra / preferredExtra) * distributableWidth);
    });
  }

  const total = COLLECTION_COLUMN_ORDER.reduce((sum, key) => sum + next[key], 0);
  const remainder = Math.round(containerWidth - total);
  if (remainder !== 0) {
    next.actions = Math.max(24, next.actions + remainder);
  }

  return next;
};

export default function CollectionManagement() {
  const { payments, getPaymentsByReceivable, deletePayment } = usePayments();
  const { accountsReceivable, recordPayment } = useFinance();
  const collectionTableContainerRef = React.useRef<HTMLDivElement | null>(null);
  const collectionColumnResizeRef = React.useRef<{
    key: CollectionColumnKey;
    startX: number;
    startWidth: number;
  } | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [viewPayment, setViewPayment] = useState<PaymentRecord | null>(null);
  const [selectedPaymentIds, setSelectedPaymentIds] = useState<string[]>([]);
  
  // 🎯 多维度筛选状态 (老板角色专用)
  const [filterRegion, setFilterRegion] = useState('all');
  const [filterCustomer, setFilterCustomer] = useState('all');
  
  // 🔒 获取当前用户角色
  const [currentUserRole, setCurrentUserRole] = React.useState<string | null>(null);
  const [collectionTableContainerWidth, setCollectionTableContainerWidth] = useState(0);
  const [collectionColumnWidths, setCollectionColumnWidths] = useState<Record<CollectionColumnKey, number>>(COLLECTION_TABLE_DEFAULT_WIDTHS);
  const [collectionHasCustomWidths, setCollectionHasCustomWidths] = useState(false);
  const [collectionPreferenceHydrated, setCollectionPreferenceHydrated] = useState(false);
  const collectionPreferenceRoleScope = useMemo(
    () => normalizeCollectionPreferenceRole(currentUserRole),
    [currentUserRole],
  );
  
  useEffect(() => {
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

  useEffect(() => {
    let cancelled = false;
    const loadRemotePreference = async () => {
      setCollectionPreferenceHydrated(false);
      try {
        const value = await sharedRoleUiPreferenceService.get(
          collectionPreferenceRoleScope,
          getCollectionPreferenceKey(),
        );
        if (cancelled) return;
        if (value) {
          setCollectionColumnWidths(
            mergeStoredCollectionColumnWidths(
              value as Partial<Record<CollectionColumnKey, number>>,
            ),
          );
          setCollectionHasCustomWidths(true);
        } else {
          setCollectionColumnWidths(COLLECTION_TABLE_DEFAULT_WIDTHS);
          setCollectionHasCustomWidths(false);
        }
      } catch {
        setCollectionColumnWidths(COLLECTION_TABLE_DEFAULT_WIDTHS);
        setCollectionHasCustomWidths(false);
      } finally {
        if (!cancelled) setCollectionPreferenceHydrated(true);
      }
    };
    void loadRemotePreference();
    return () => {
      cancelled = true;
    };
  }, [collectionPreferenceRoleScope]);

  useEffect(() => {
    if (!collectionHasCustomWidths || !collectionPreferenceHydrated) return;
    const timer = window.setTimeout(() => {
      void sharedRoleUiPreferenceService.save(
        collectionPreferenceRoleScope,
        getCollectionPreferenceKey(),
        collectionColumnWidths,
      );
    }, 300);

    return () => window.clearTimeout(timer);
  }, [
    collectionColumnWidths,
    collectionHasCustomWidths,
    collectionPreferenceHydrated,
    collectionPreferenceRoleScope,
  ]);

  useEffect(() => {
    const node = collectionTableContainerRef.current;
    if (!node) return;

    const updateWidth = () => {
      setCollectionTableContainerWidth(node.clientWidth || 0);
    };

    updateWidth();

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', updateWidth);
      return () => window.removeEventListener('resize', updateWidth);
    }

    const observer = new ResizeObserver(() => updateWidth());
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      const resizeState = collectionColumnResizeRef.current;
      if (!resizeState) return;
      const deltaX = event.clientX - resizeState.startX;
      const minWidth = COLLECTION_COLUMN_MIN_WIDTHS[resizeState.key];
      setCollectionColumnWidths((prev) => ({
        ...prev,
        [resizeState.key]: Math.max(minWidth, Math.round(resizeState.startWidth + deltaX)),
      }));
      setCollectionHasCustomWidths(true);
    };

    const handleMouseUp = () => {
      collectionColumnResizeRef.current = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
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

  const renderedCollectionColumnWidths = useMemo(
    () => fitCollectionColumnWidthsToContainer(collectionColumnWidths, collectionTableContainerWidth),
    [collectionColumnWidths, collectionTableContainerWidth],
  );

  const getCollectionColumnStyle = (key: CollectionColumnKey) =>
    getColumnStyle(renderedCollectionColumnWidths, key);

  const startCollectionColumnResize = (
    key: CollectionColumnKey,
    event: React.MouseEvent<HTMLSpanElement>,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    collectionColumnResizeRef.current = {
      key,
      startX: event.clientX,
      startWidth: collectionColumnWidths[key],
    };
    setCollectionHasCustomWidths(true);
  };

  const renderCollectionColumnResizeHandle = (key: CollectionColumnKey) =>
    renderColumnResizeHandle(
      `调整${key}列宽`,
      (event) => startCollectionColumnResize(key, event),
    );

  const renderCollectionHeaderCell = (
    key: CollectionColumnKey,
    label: string,
    options?: {
      align?: 'left' | 'center' | 'right';
      className?: string;
    },
  ) => {
    const align = options?.align || 'left';
    const justifyClass =
      align === 'right' ? 'justify-end text-right' : align === 'center' ? 'justify-center text-center' : 'justify-start text-left';
    return (
      <TableHead
        className={`group relative border-b border-slate-200 bg-slate-50/90 px-3 py-3 text-xs font-semibold tracking-[0.01em] text-slate-700 ${options?.className || ''}`}
        style={getCollectionColumnStyle(key)}
      >
        <div className={`flex min-h-[20px] w-full items-start pr-5 ${justifyClass}`}>
          <span className="block whitespace-normal break-words leading-5">{label}</span>
        </div>
        {renderCollectionColumnResizeHandle(key)}
      </TableHead>
    );
  };

  return (
    <div className="flex flex-1 min-h-0 flex-col space-y-4">
      {/* 统计卡片 */}
      {/* 🎨 方案A：台湾大厂原汁原味风格 - SAP/Oracle单行紧凑摘要栏 */}
      {/* 🔒 只对非业务员角色显示统计卡片 */}
      {currentUserRole !== 'Sales_Rep' && (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-slate-50/80 px-4 py-2.5">
            <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">收款统计</h3>
          </div>
          <div className="flex items-center gap-6 px-4 py-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-500">总收款笔数:</span>
              <span className="font-semibold text-slate-900">{stats.total}</span>
            </div>
            <div className="h-4 w-px bg-slate-200" />
            <div className="flex items-center gap-2">
              <span className="text-slate-500">已确认:</span>
              <span className="font-semibold text-emerald-600">{stats.confirmed}</span>
            </div>
            <div className="h-4 w-px bg-slate-200" />
            <div className="flex items-center gap-2">
              <span className="text-slate-500">待确认:</span>
              <span className="font-semibold text-slate-900">{stats.pending}</span>
            </div>
            <div className="h-4 w-px bg-slate-200" />
            <div className="flex items-center gap-2">
              <span className="text-slate-500">已收总额:</span>
              <span className="font-semibold text-slate-900">${(stats.totalAmount / 1000).toFixed(0)}K</span>
            </div>
          </div>
        </div>
      )}

      {/* 列表卡片 */}
      <Card className="flex flex-1 min-h-0 w-full max-w-full flex-col overflow-visible rounded-xl border border-slate-200 bg-white shadow-sm min-h-[calc(100dvh-360px)]">
        {/* 搜索和筛选栏 */}
        <div className="border-b border-slate-200 bg-slate-50/70 px-4 py-3">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* 搜索框 */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 transform text-slate-400" />
              <Input
                placeholder="搜索收款编号、客户名称、订单号..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-9 rounded-xl border-slate-200 bg-white pl-9 text-xs shadow-sm"
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
              className="h-9 rounded-xl px-3 text-slate-600 hover:text-orange-600 disabled:opacity-40"
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
              className="h-9 rounded-xl px-3 text-xs shadow-sm gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              批量删除{selectedPaymentIds.length > 0 ? ` (${selectedPaymentIds.length})` : ''}
            </Button>

            {/* 状态筛选 */}
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="h-9 w-[130px] rounded-xl border-slate-200 bg-white text-xs shadow-sm">
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
                  <SelectTrigger className="h-9 w-[120px] rounded-xl border-slate-200 bg-white text-xs shadow-sm">
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
                  <SelectTrigger className="h-9 w-[140px] rounded-xl border-slate-200 bg-white text-xs shadow-sm">
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
        <div ref={collectionTableContainerRef} className="w-full max-w-full flex-1 min-h-0 overflow-x-auto overflow-y-visible bg-white rounded-[inherit]">
          <Table className="table-fixed border-collapse" style={{ width: '100%', maxWidth: '100%' }}>
            <colgroup>
              {COLLECTION_COLUMN_ORDER.map((key) => (
                <col key={key} style={getCollectionColumnStyle(key)} />
              ))}
            </colgroup>
            <TableHeader>
              <TableRow className="border-b border-slate-200 bg-slate-50/90 hover:bg-slate-50/90">
                <TableHead
                  className="group relative border-b border-slate-200 bg-slate-50/90 px-0 py-3 text-xs font-semibold text-slate-700"
                  style={getCollectionColumnStyle('select')}
                >
                  <div className="flex w-full items-center justify-center">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={(checked) => handleSelectAll(Boolean(checked))}
                    />
                  </div>
                  {renderCollectionColumnResizeHandle('select')}
                </TableHead>
                {renderCollectionHeaderCell('index', '序号', { align: 'center' })}
                {renderCollectionHeaderCell('paymentNo', '收款编号')}
                {renderCollectionHeaderCell('receivableNo', '应收账款号')}
                {renderCollectionHeaderCell('orderNo', '订单号')}
                {renderCollectionHeaderCell('customer', '客户名称')}
                {renderCollectionHeaderCell('amount', '收款金额', { align: 'right' })}
                {renderCollectionHeaderCell('method', '付款方式')}
                {renderCollectionHeaderCell('date', '收款日期')}
                {renderCollectionHeaderCell('receiver', '收款人')}
                {renderCollectionHeaderCell('status', '状态', { align: 'center' })}
                {renderCollectionHeaderCell('actions', '操作', { align: 'right' })}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayments.map((payment, index) => {
                const PaymentIcon = getPaymentMethodIcon(payment.paymentMethod);
                return (
                  <TableRow key={payment.id} className="border-b border-slate-200/90 hover:bg-slate-50/70">
                    <TableCell className="px-0 py-3 align-middle" style={getCollectionColumnStyle('select')}>
                      <div className="flex w-full items-center justify-center">
                        <Checkbox
                          checked={selectedPaymentIds.includes(payment.id)}
                          onCheckedChange={(checked) => handleSelectOne(payment.id, Boolean(checked))}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="px-3 py-3 text-center text-xs text-slate-500 align-middle" style={getCollectionColumnStyle('index')}>
                      {index + 1}
                    </TableCell>
                    <TableCell className="px-3 py-3 align-top" style={getCollectionColumnStyle('paymentNo')}>
                      <button
                        onClick={() => handleViewPayment(payment)}
                        className="block w-full overflow-hidden break-all text-left text-sm font-semibold text-sky-600 hover:text-sky-700 hover:underline"
                      >
                        {payment.paymentNumber}
                      </button>
                    </TableCell>
                    <TableCell className="px-3 py-3 text-xs align-top" style={getCollectionColumnStyle('receivableNo')}>
                      <span className="block overflow-hidden break-all font-mono text-emerald-600">
                        {payment.receivableNumber}
                      </span>
                    </TableCell>
                    <TableCell className="px-3 py-3 text-xs align-top" style={getCollectionColumnStyle('orderNo')}>
                      <span className="block overflow-hidden break-all font-mono text-violet-600">
                        {payment.orderNumber}
                      </span>
                    </TableCell>
                    <TableCell className="px-3 py-3 text-sm text-slate-700 align-top" style={getCollectionColumnStyle('customer')}>
                      <span className="block overflow-hidden break-words leading-5">{payment.customerName}</span>
                    </TableCell>
                    <TableCell className="px-3 py-3 text-right align-top" style={getCollectionColumnStyle('amount')}>
                      <span className="block text-sm font-semibold text-emerald-600">
                        {payment.currency} {payment.amount.toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell className="px-3 py-3 text-xs text-slate-600 align-top" style={getCollectionColumnStyle('method')}>
                      <div className="flex items-center gap-1.5">
                        <PaymentIcon className="h-3.5 w-3.5 text-slate-400" />
                        <span className="leading-5">{payment.paymentMethod}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-3 py-3 text-xs text-slate-500 align-top" style={getCollectionColumnStyle('date')}>
                      {payment.paymentDate}
                    </TableCell>
                    <TableCell className="px-3 py-3 text-xs text-slate-500 align-top" style={getCollectionColumnStyle('receiver')}>
                      {payment.receivedBy}
                    </TableCell>
                    <TableCell className="px-3 py-3 align-middle" style={getCollectionColumnStyle('status')}>
                      <div className="flex w-full justify-center">
                        <Badge className={`h-7 rounded-full border px-3 text-[11px] font-medium ${getStatusConfig(payment.status).color}`}>
                          {getStatusConfig(payment.status).label}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="px-3 py-3 text-right align-middle" style={getCollectionColumnStyle('actions')}>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-9 rounded-xl border-slate-200 px-4 text-xs font-medium text-slate-700 shadow-sm"
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
