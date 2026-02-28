import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Checkbox } from '../ui/checkbox';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { Eye, Clock, CheckCircle2, XCircle, AlertCircle, MessageSquare, DollarSign, Search, Trash2 } from 'lucide-react';
import { useUser } from '../../contexts/UserContext';
import QuotationDetailView from './QuotationDetailView';
import { Quotation } from '../admin/QuotationManagement';
import { toast } from 'sonner';
import { apiFetchJson } from '../../api/backend-auth';
import { addTombstones, filterNotDeleted } from '../../lib/erp-core/deletion-tombstone';
import { canDeleteQuotation } from '../../lib/erp-core/delete-guard';
import { resolveDisplayNumber } from '../../lib/erp-core/number-display';
import { ERP_EVENT_KEYS } from '../../lib/erp-core/events';
import { subscribeErpEvent } from '../../lib/erp-core/event-bus';

interface QuotationReceivedProps {
  onNavigate?: (view: string) => void;
  /** 在 My Orders 内切换 Tab（如切换到 Active Orders） */
  onSwitchMyOrdersTab?: (tabId: string) => void;
}

export function QuotationReceived({ onNavigate, onSwitchMyOrdersTab }: QuotationReceivedProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]); // 🆕 批量选择状态
  const [serverQuotations, setServerQuotations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [lastFetchedAt, setLastFetchedAt] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const { user } = useUser();

  useEffect(() => {
    setSelectedIds([]);
  }, [user?.email]);

  const readCustomerBridge = (email: string): any[] => {
    try {
      const raw = localStorage.getItem('customer_quotations_bridge');
      if (!raw) return [];
      const all: any[] = JSON.parse(raw);
      return all.filter((q: any) =>
        String(q.customerEmail || '').toLowerCase() === email.toLowerCase()
      );
    } catch { return []; }
  };

  const mergeWithBridge = (apiList: any[], email: string): any[] => {
    const bridge = readCustomerBridge(email);
    if (bridge.length === 0) return apiList;

    const bridgeMap = new Map<string, any>();
    bridge.forEach((b: any) => {
      if (b.qtNumber) bridgeMap.set(String(b.qtNumber), b);
      if (b.id) bridgeMap.set(String(b.id), b);
    });

    const patched = apiList.map((q: any) => {
      const bridgeEntry = bridgeMap.get(String(q.qtNumber)) || bridgeMap.get(String(q.id));
      if (!bridgeEntry) return q;

      // 客户已确认（accepted）时不降级，完全以 API 为准
      if (q.customerStatus === 'accepted') return q;

      // bridge 里是 sent（业务员刚发 / 重发），无论 API 是 not_sent 还是 rejected，都用 bridge 覆盖
      // 因为 bridge 代表业务员最新的发送操作，比 DB 里的旧 rejected 状态更新
      if (bridgeEntry.customerStatus === 'sent') {
        return { ...q, ...bridgeEntry };
      }

      // 其他情况：API 是 not_sent 时，用 bridge 覆盖
      if (q.customerStatus === 'not_sent' && bridgeEntry.customerStatus !== 'not_sent') {
        return { ...q, ...bridgeEntry };
      }

      return q;
    });

    // 把 bridge 里 API 没有的条目也加进来
    const patchedIds = new Set(patched.map((q: any) => String(q.qtNumber || q.id)));
    const extra = bridge.filter((b: any) => !patchedIds.has(String(b.qtNumber || b.id)));
    return [...patched, ...extra];
  };

  // 🔥 从服务器加载“客户收到的报价”（接口：GET /api/sales-quotations，customer 角色会自动按 customer_email 过滤）
  useEffect(() => {
    if (!user?.email) return;
    let alive = true;

    const load = async () => {
      setLoading(true);
      setLastError(null);
      try {
        // 🔥 强制客户视图 + 禁用缓存（方便你在Network里明确看到请求）
        const url = `/api/sales-quotations?view=customer&t=${Date.now()}`;
        const res = await apiFetchJson<{ quotations: any[] }>(url, { cache: 'no-store' as any });
        if (!alive) return;
        const apiList = Array.isArray(res?.quotations) ? res.quotations : [];
        setServerQuotations(mergeWithBridge(apiList, user.email!));
        setLastFetchedAt(new Date().toISOString());
      } catch (e: any) {
        console.error('❌ [QuotationReceived] 加载 /api/sales-quotations 失败:', e);
        if (!alive) return;
        const bridgeOnly = readCustomerBridge(user.email!);
        setServerQuotations(bridgeOnly);
        setLastError(bridgeOnly.length > 0 ? null : (e?.message || 'Request failed'));
        setLastFetchedAt(new Date().toISOString());
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    };

    void load();
    return () => {
      alive = false;
    };
  }, [user?.email, reloadKey]);

  useEffect(() => {
    const unsubscribe = subscribeErpEvent((event) => {
      if (event.domain !== 'quotation') return;
      if (
        event.key === ERP_EVENT_KEYS.QUOTATION_CREATED ||
        event.key === ERP_EVENT_KEYS.QUOTATION_SENT ||
        event.key === ERP_EVENT_KEYS.QUOTATION_ACCEPTED ||
        event.key === ERP_EVENT_KEYS.QUOTATION_DELETED
      ) {
        setReloadKey((k) => k + 1);
      }
    });
    return unsubscribe;
  }, []);

  // 🔥 组件挂载时检查localStorage，自动打开指定报价
  React.useEffect(() => {
    const autoOpenId = localStorage.getItem('quotationDetail_autoOpenId');
    if (autoOpenId) {
      console.log('🔥 [QuotationReceived] Auto-opening quotation:', autoOpenId);
      const quotation = serverQuotations.find(q => q.id === autoOpenId);
      if (quotation) {
        setSelectedQuotation(quotation as any);
        setIsDetailOpen(true);
      }
      // 🔥 清除localStorage，避免重复打开
      localStorage.removeItem('quotationDetail_autoOpenId');
    }
  }, [serverQuotations]); // 依赖serverQuotations，确保数据加载后再查找

  // 🐛 调试日志
  console.log('🔍 [QuotationReceived] 调试信息:');
  console.log('  - 当前用户:', user);
  console.log('  - 用户邮箱:', user?.email);
  console.log('  - 接口报价数量:', serverQuotations.length);
  
  // 🔥 后端已按customer_email过滤，这里只做状态兜底过滤
  const quotations = (serverQuotations || [])
    .filter((q: any) =>
      filterNotDeleted('customer_quotation', [q], (item: any) => [
        String(item?.id || ''),
        String(item?.qtNumber || ''),
        String(item?.quotationNumber || ''),
      ]).length > 0
    )
    .filter((q: any) =>
      ['sent', 'viewed', 'accepted', 'rejected', 'negotiating', 'expired'].includes(q.customerStatus)
    );
  
  console.log('  - 筛选后的报价数量:', quotations.length);
  console.log('  - 筛选后的报价:', quotations);

  // 🔥 获取带Tooltip的Status Badge（显示时间线）
  const getStatusBadgeWithTooltip = (quotation: any) => {
    const status = quotation.customerStatus;
    
    // 确定显示状态
    const displayStatus = status === 'sent' || status === 'viewed' 
      ? 'pending' 
      : status === 'accepted' 
        ? 'accepted' 
        : status;
    
    // 构建Tooltip内容
    const getTooltipContent = () => {
      const lines: string[] = [];
      
      // 📤 报价发送时间
      if (quotation.sentToCustomerAt || quotation.sentAt) {
        const sentTime = new Date(quotation.sentToCustomerAt || quotation.sentAt).toLocaleString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
        lines.push(`📤 Sent: ${sentTime}`);
        lines.push(`👤 Sent by: ${quotation.salesPersonName || 'Sales Team'}`);
      }
      
      // 👁️ 查看时间（如果有）
      if (quotation.viewedAt) {
        const viewedTime = new Date(quotation.viewedAt).toLocaleString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
        lines.push('');
        lines.push(`👁️ Viewed: ${viewedTime}`);
      }
      
      // 💬 客户响应
      if (quotation.customerResponse) {
        const responseTime = new Date(quotation.customerResponse.respondedAt).toLocaleString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
        
        let responseLabel = '';
        let responseIcon = '';
        if (quotation.customerResponse.status === 'accepted') {
          responseLabel = 'Accepted';
          responseIcon = '✅';
        } else if (quotation.customerResponse.status === 'rejected') {
          responseLabel = 'Declined';
          responseIcon = '❌';
        } else if (quotation.customerResponse.status === 'negotiating') {
          responseLabel = 'Requested Negotiation';
          responseIcon = '💬';
        }
        
        lines.push('');
        lines.push(`${responseIcon} ${responseLabel}: ${responseTime}`);
        
        if (quotation.customerResponse.comment) {
          lines.push(`💭 Your feedback: ${quotation.customerResponse.comment}`);
        }
      }
      
      // 如果没有任何时间信息
      if (lines.length === 0) {
        if (status === 'sent') {
          return '📌 Quotation sent to you. Click to view details.';
        }
        return '📌 No timeline information available';
      }
      
      return lines.join('\n');
    };
    
    const tooltipContent = getTooltipContent();
    
    // 渲染不同状态的Badge
    let badgeContent;
    switch (displayStatus) {
      case 'pending':
        badgeContent = (
          <span className="inline-flex items-center px-2.5 py-1 rounded-sm bg-yellow-100 text-yellow-800 text-[10px] uppercase cursor-help" style={{ fontWeight: 600, letterSpacing: '0.5px' }}>
            <Clock className="w-3 h-3 mr-1" strokeWidth={2.5} />
            Pending Review
          </span>
        );
        break;
      case 'accepted':
        badgeContent = (
          <span className="inline-flex items-center px-2.5 py-1 rounded-sm bg-green-100 text-green-800 text-[10px] uppercase cursor-help" style={{ fontWeight: 600, letterSpacing: '0.5px' }}>
            <CheckCircle2 className="w-3 h-3 mr-1" strokeWidth={2.5} />
            Accepted
          </span>
        );
        break;
      case 'rejected':
        badgeContent = (
          <span className="inline-flex items-center px-2.5 py-1 rounded-sm bg-red-100 text-red-800 text-[10px] uppercase cursor-help" style={{ fontWeight: 600, letterSpacing: '0.5px' }}>
            <XCircle className="w-3 h-3 mr-1" strokeWidth={2.5} />
            Declined
          </span>
        );
        break;
      case 'negotiating':
        badgeContent = (
          <span className="inline-flex items-center px-2.5 py-1 rounded-sm bg-orange-100 text-orange-800 text-[10px] uppercase cursor-help" style={{ fontWeight: 600, letterSpacing: '0.5px' }}>
            <MessageSquare className="w-3 h-3 mr-1" strokeWidth={2.5} />
            Negotiating
          </span>
        );
        break;
      case 'expired':
        badgeContent = (
          <span className="inline-flex items-center px-2.5 py-1 rounded-sm bg-red-100 text-red-800 text-[10px] uppercase cursor-help" style={{ fontWeight: 600, letterSpacing: '0.5px' }}>
            <XCircle className="w-3 h-3 mr-1" strokeWidth={2.5} />
            Expired
          </span>
        );
        break;
      default:
        badgeContent = <Badge>{displayStatus}</Badge>;
    }
    
    // 包裹Tooltip
    return (
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          {badgeContent}
        </TooltipTrigger>
        <TooltipContent 
          side="left" 
          className="max-w-sm bg-gray-900 text-white text-xs whitespace-pre-line p-3"
          sideOffset={5}
        >
          {tooltipContent}
        </TooltipContent>
      </Tooltip>
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-sm bg-yellow-100 text-yellow-800 text-[10px] uppercase" style={{ fontWeight: 600, letterSpacing: '0.5px' }}>
            <Clock className="w-3 h-3 mr-1" strokeWidth={2.5} />
            Pending Review
          </span>
        );
      case 'accepted':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-sm bg-green-100 text-green-800 text-[10px] uppercase" style={{ fontWeight: 600, letterSpacing: '0.5px' }}>
            <CheckCircle2 className="w-3 h-3 mr-1" strokeWidth={2.5} />
            Accepted
          </span>
        );
      case 'expired':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-sm bg-red-100 text-red-800 text-[10px] uppercase" style={{ fontWeight: 600, letterSpacing: '0.5px' }}>
            <XCircle className="w-3 h-3 mr-1" strokeWidth={2.5} />
            Expired
          </span>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const filteredQuotations = quotations.filter(quot => {
    const matchesSearch = 
      (quot.qtNumber || quot.id || '').toLowerCase().includes(searchTerm.toLowerCase()) || // 🔥 修复：使用qtNumber
      (quot.customerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (quot.inqNumber || '').toLowerCase().includes(searchTerm.toLowerCase()); // 🔥 修复：使用inqNumber
    const matchesFilter = filterStatus === 'all' || quot.customerStatus === filterStatus; // 🔥 修复：使用customerStatus
    return matchesSearch && matchesFilter;
  });

  const isQuotationDeletable = (quotation: any) => canDeleteQuotation(quotation);

  // 🆕 批量选择逻辑
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredQuotations.filter((q) => isQuotationDeletable(q)).map(q => q.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const target = filteredQuotations.find((q) => q.id === id);
    if (target && !isQuotationDeletable(target)) {
      toast.error('This quotation already moved to next workflow. Please delete it from the final workflow stage.');
      return;
    }
    if (checked) {
      setSelectedIds([...selectedIds, id]);
    } else {
      setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
    }
  };

  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) {
      toast.error('Please select at least one quotation to delete');
      return;
    }

    const selectedQuotations = filteredQuotations.filter((q) => selectedIds.includes(q.id));
    const blocked = selectedQuotations.filter((q) => !isQuotationDeletable(q));
    if (blocked.length > 0) {
      toast.error(`Cannot delete ${blocked.length} quotation(s): already progressed to next workflow.`);
      return;
    }

    if (confirm(`Are you sure you want to permanently delete ${selectedIds.length} quotation(s)? This action cannot be undone.`)) {
      const selectedRows = filteredQuotations.filter((q) => selectedIds.includes(q.id));
      const deletionMarkers = selectedRows.flatMap((q) => [
        String(q?.id || ''),
        String(q?.qtNumber || ''),
        String(q?.quotationNumber || ''),
      ]).filter(Boolean);

      const deletedIds: string[] = [];
      const apiFailedIds: string[] = [];
      for (const id of selectedIds) {
        try {
          await apiFetchJson(`/api/sales-quotations/${encodeURIComponent(String(id))}`, {
            method: 'DELETE',
          });
          deletedIds.push(id);
        } catch (e: any) {
          const msg = String(e?.message || '');
          if (msg.includes('QUOTATION_ALREADY_PROGRESSED')) {
            toast.error('Quotation already progressed to next workflow. Delete it from final workflow stage.');
          } else if (
            msg.includes('DELETE method is not supported') ||
            msg.includes('Supported methods: OPTIONS')
          ) {
            apiFailedIds.push(id);
          } else {
            apiFailedIds.push(id);
            toast.error(`Delete failed for ${id}: ${msg || 'Unknown error'}`);
          }
        }
      }

      if (deletionMarkers.length > 0) {
        addTombstones('customer_quotation', deletionMarkers, {
          reason: 'manual_delete',
          deletedBy: user?.email || 'unknown',
        });
      }

      setServerQuotations(prev => prev.filter(q => !selectedIds.includes(q.id)));
      if (deletedIds.length > 0) {
        toast.success(`Permanently deleted ${deletedIds.length} quotation(s)`, { duration: 3000 });
      }
      if (apiFailedIds.length > 0) {
        toast.success(`${apiFailedIds.length} quotation(s) deleted locally (sync pending).`, { duration: 3500 });
      }

      const allDeletedNow = new Set([...deletedIds, ...apiFailedIds]);
      setSelectedIds(prev => prev.filter((id) => !allDeletedNow.has(id)));
    }
  };

  const deletableFilteredQuotations = filteredQuotations.filter((q) => isQuotationDeletable(q));
  const isAllSelected = deletableFilteredQuotations.length > 0 && selectedIds.length === deletableFilteredQuotations.length;
  const isSomeSelected = selectedIds.length > 0 && selectedIds.length < deletableFilteredQuotations.length;

  return (
    <div className="space-y-6" style={{ fontFamily: 'var(--hd-font)' }}>
      {/* Quotations Table */}
      <div className="bg-white border-2 border-gray-200 rounded-sm shadow-sm">
        <div className="border-b-2 border-gray-200">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DollarSign className="w-5 h-5 text-[#F96302]" strokeWidth={2.5} />
              <h3 className="text-gray-900 uppercase tracking-wide" style={{ fontSize: '14px', fontWeight: 600 }}>
                Quotation List
              </h3>
            </div>
          </div>
        </div>

        <div className="p-5">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by quotation ID, inquiry ID, or product..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-10"
              onClick={() => setReloadKey((k) => k + 1)}
            >
              Refresh
            </Button>
            {/* 🆕 批量删除按钮 */}
            <Button
              variant="destructive"
              size="sm"
              className="h-10 bg-red-600 hover:bg-red-700"
              onClick={handleBatchDelete}
              disabled={selectedIds.length === 0}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Selected ({selectedIds.length})
            </Button>
            <div className="flex gap-2">
              <Button
                variant={filterStatus === 'all' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('all')}
                className={filterStatus === 'all' ? 'bg-red-600 hover:bg-red-700' : ''}
              >
                All
              </Button>
              <Button
                variant={filterStatus === 'pending' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('pending')}
                className={filterStatus === 'pending' ? 'bg-red-600 hover:bg-red-700' : ''}
              >
                Pending
              </Button>
              <Button
                variant={filterStatus === 'accepted' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('accepted')}
                className={filterStatus === 'accepted' ? 'bg-red-600 hover:bg-red-700' : ''}
              >
                Accepted
              </Button>
              <Button
                variant={filterStatus === 'expired' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('expired')}
                className={filterStatus === 'expired' ? 'bg-red-600 hover:bg-red-700' : ''}
              >
                Expired
              </Button>
            </div>
          </div>
        </div>

        <div className="p-5">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  {/* 🆕 选择框列 */}
                  <TableHead className="w-12">
                    <Checkbox
                      checked={isAllSelected}
                      onCheckedChange={handleSelectAll}
                      aria-label="Select all"
                    />
                  </TableHead>
                  {/* 🆕 序号列 */}
                  <TableHead className="font-bold w-16" style={{ fontSize: '14px' }}>No.</TableHead>
                  <TableHead className="font-bold" style={{ fontSize: '14px' }}>Quotation #</TableHead>
                  <TableHead className="font-bold" style={{ fontSize: '14px' }}>Inquiry #</TableHead>
                  <TableHead className="font-bold" style={{ fontSize: '14px' }}>Date</TableHead>
                  <TableHead className="font-bold" style={{ fontSize: '14px' }}>Valid Until</TableHead>
                  <TableHead className="font-bold" style={{ fontSize: '14px' }}>Product</TableHead>
                  <TableHead className="font-bold" style={{ fontSize: '14px' }}>Quantity</TableHead>
                  <TableHead className="font-bold" style={{ fontSize: '14px' }}>Unit Price</TableHead>
                  <TableHead className="font-bold" style={{ fontSize: '14px' }}>Total Price</TableHead>
                  <TableHead className="font-bold" style={{ fontSize: '14px' }}>Status</TableHead>
                  <TableHead className="font-bold text-right" style={{ fontSize: '14px' }}>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredQuotations.map((quotation, index) => {
                  // 🔥 适配新的SalesQuotation数据结构
                  const productName = quotation.items && quotation.items.length > 0 
                    ? quotation.items[0].productName // 🔥 使用items而不是products
                    : 'N/A';
                  const totalQuantity = quotation.items 
                    ? quotation.items.reduce((sum: number, item: any) => sum + item.quantity, 0) 
                    : 0;
                  const displayStatus = quotation.customerStatus === 'sent' || quotation.customerStatus === 'viewed' 
                    ? 'pending' 
                    : quotation.customerStatus === 'accepted' 
                      ? 'accepted' 
                      : quotation.customerStatus; // 🔥 使用customerStatus
                  
                  // 🔥 格式化日期
                  const quotationDate = quotation.createdAt 
                    ? new Date(quotation.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                    : 'N/A';
                  
                  const isSelected = selectedIds.includes(quotation.id);
                  const canDelete = isQuotationDeletable(quotation);
                  const quotationNo = String(quotation.qtNumber || quotation.quotationNumber || quotation.id || '');
                  const numberDisplay = resolveDisplayNumber({
                    domain: 'quotation',
                    internalNo: quotationNo,
                    companyId: (user as any)?.companyId ? String((user as any).companyId) : undefined,
                  });
                  
                  return (
                    <TableRow key={quotation.id} className={`hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''}`}>
                      {/* 🆕 选择框 */}
                      <TableCell>
                        <Checkbox
                          checked={isSelected}
                          disabled={!canDelete}
                          onCheckedChange={(checked) => handleSelectOne(quotation.id, checked as boolean)}
                          aria-label={`Select quotation ${quotation.qtNumber}`}
                        />
                      </TableCell>
                      {/* 🆕 序号 */}
                      <TableCell className="text-xs text-gray-600 font-medium">
                        {index + 1}
                      </TableCell>
                      <TableCell className="text-xs">
                        <button
                          onClick={() => {
                            setSelectedQuotation(quotation as any);
                            setIsDetailOpen(true);
                          }}
                          className="font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                        >
                          {quotationNo}
                        </button>
                        {numberDisplay.externalNo && (
                          <div className="text-[11px] text-gray-500 mt-0.5">
                            Customer ERP: {numberDisplay.externalNo}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-gray-700">{quotation.inqNumber}</TableCell> {/* 🔥 使用inqNumber */}
                      <TableCell className="text-xs text-gray-700">{quotationDate}</TableCell>
                      <TableCell className="text-xs text-gray-700">{quotation.validUntil}</TableCell>
                      <TableCell className="text-xs font-medium text-gray-900 max-w-xs truncate">
                        {productName}
                        {quotation.items && quotation.items.length > 1 && (
                          <span className="text-gray-500 ml-1">+{quotation.items.length - 1} more</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-gray-700">{totalQuantity} pcs</TableCell>
                      <TableCell className="text-xs text-gray-700">
                        {(() => {
                          const firstItem = quotation.items?.[0];
                          const up = Number(firstItem?.salesPrice ?? firstItem?.unitPrice ?? firstItem?.quotePrice ?? 0);
                          if (!up) return '—';
                          const currency = quotation.currency || firstItem?.currency || 'USD';
                          const symbol = currency === 'USD' ? '$' : currency === 'CNY' ? '¥' : currency;
                          const formatted = up.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                          return `${symbol}${formatted}${quotation.items && quotation.items.length > 1 ? ' ~' : ''}`;
                        })()}
                      </TableCell>
                      <TableCell className="text-xs font-medium text-gray-900">
                        ${(quotation.totalPrice || 0).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-xs">{getStatusBadgeWithTooltip(quotation)}</TableCell>
                      <TableCell className="text-xs">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => {
                              setSelectedQuotation(quotation as any);
                              setIsDetailOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {filteredQuotations.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="font-semibold text-gray-900 mb-2">No quotations found</h3>
            <p className="text-gray-600">Try adjusting your search or filter criteria</p>
          </CardContent>
        </Card>
      )}

      {/* Quotation Detail Dialog */}
      <QuotationDetailView
        open={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedQuotation(null);
        }}
        quotation={selectedQuotation}
        onUpdated={() => setReloadKey((k) => k + 1)}
        onOpenProfitAnalyzer={(quotation: Quotation) => {
          // 🔥 导航到左侧栏的Profit Analyzer页面
          console.log('🔥 [QuotationReceived] Opening Profit Analyzer for quotation:', quotation.id);
          
          // 🔥 将报价信息存储到localStorage，供ProfitAnalyzerPro读取（兼容id/编号/上下文不同步场景）
          const quoteId = String(
            (quotation as any)?.id ??
            (quotation as any)?.quotationId ??
            (quotation as any)?.qtNumber ??
            (quotation as any)?.quotationNumber ??
            ''
          );
          const quoteNo = String(
            (quotation as any)?.qtNumber ??
            (quotation as any)?.quotationNumber ??
            ''
          );
          if (quoteId) {
            localStorage.setItem('profitAnalyzer_selectedQuoteId', quoteId);
          }
          if (quoteNo) {
            localStorage.setItem('profitAnalyzer_selectedQuoteNo', quoteNo);
          }
          localStorage.setItem('profitAnalyzer_selectedQuotePayload', JSON.stringify(quotation));
          
          // 🔥 关闭详情Dialog
          setIsDetailOpen(false);
          setSelectedQuotation(null);
          
          // 🔥 导航到Profit Analyzer页面
          if (onNavigate) {
            onNavigate('profit-analyzer');
          }
        }}
      />
    </div>
  );
}
