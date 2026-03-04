import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Textarea } from '../ui/textarea';
import { Checkbox } from '../ui/checkbox';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle, 
  Search, 
  Eye,
  Send,
  Filter,
  TrendingUp,
  FileText,
  DollarSign,
  User,
  Calendar,
  MessageSquare,
  ArrowRight,
  CheckCheck,
  Ban,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import type { ApprovalRequest, ApprovalStatus, UrgencyLevel } from '../../contexts/ApprovalContext';
import { useApproval } from '../../contexts/ApprovalContext';
import { getCurrentUser } from '../../utils/dataIsolation';
import { CustomerInquiryView } from '../dashboard/CustomerInquiryView';
import { QuotationView } from '../salesperson/QuotationView'; // 🔥 导入报价单查看组件
import { QuotationDocument, QuotationData } from '../documents/templates/QuotationDocument'; // 🔥 直接导入文档组件
import { SalesContractDocument, SalesContractData } from '../documents/templates/SalesContractDocument'; // 🔥 导入销售合同文档
import { PurchaseOrderDocument } from '../documents/templates/PurchaseOrderDocument';
import { useSalesContracts } from '../../contexts/SalesContractContext'; // 🔥 导入销售合同Context
import { salesQuotationService, contractService } from '../../lib/supabaseService';
import { addTombstones, filterNotDeleted, isDeleted } from '../../lib/erp-core/deletion-tombstone';
import { emitErpEvent } from '../../lib/erp-core/event-bus';
import { ERP_EVENT_KEYS } from '../../lib/erp-core/events';
import { usePurchaseOrders } from '../../contexts/PurchaseOrderContext';
import { convertToPOData } from './purchase-order/purchaseOrderUtils';

type TabType = 'pending' | 'approved' | 'rejected' | 'submitted';
const APPROVAL_CENTER_CACHE_PREFIX = 'approval_center_cache_v1';
const APPROVAL_CENTER_BRIDGE_KEY = 'approval_center_pending_bridge_v1';
const SALES_QUOTATION_CACHE_PREFIX = 'sales_quotation_management_cache_v1';

interface ApprovalCenterCacheShape {
  pending: ApprovalRequest[];
  approved: ApprovalRequest[];
  rejected: ApprovalRequest[];
  submitted: ApprovalRequest[];
  updatedAt: string;
}

const getApprovalCenterCacheKey = (email: string) => `${APPROVAL_CENTER_CACHE_PREFIX}:${email || 'anonymous'}`;

const readApprovalCenterCache = (email: string): ApprovalCenterCacheShape | null => {
  if (!email) return null;
  try {
    const raw = localStorage.getItem(getApprovalCenterCacheKey(email));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    return {
      pending: Array.isArray(parsed.pending) ? parsed.pending : [],
      approved: Array.isArray(parsed.approved) ? parsed.approved : [],
      rejected: Array.isArray(parsed.rejected) ? parsed.rejected : [],
      submitted: Array.isArray(parsed.submitted) ? parsed.submitted : [],
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : new Date(0).toISOString(),
    };
  } catch {
    return null;
  }
};

const writeApprovalCenterCache = (
  email: string,
  payload: Pick<ApprovalCenterCacheShape, 'pending' | 'approved' | 'rejected' | 'submitted'>,
) => {
  if (!email) return;
  const cache: ApprovalCenterCacheShape = {
    ...payload,
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(getApprovalCenterCacheKey(email), JSON.stringify(cache));
};

const mergeByRequestIdentity = (base: ApprovalRequest[], extra: ApprovalRequest[]) => {
  const map = new Map<string, ApprovalRequest>();
  [...base, ...extra].forEach((item) => {
    const key = `${item.type}:${item.relatedDocumentId}:${item.status}`;
    map.set(key, item);
  });
  return Array.from(map.values()).sort(
    (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
  );
};

// 仅用审批请求自身 id 做可见性标记，避免误伤同单号后续新审批。
const getApprovalMarkers = (req: Partial<ApprovalRequest>): string[] =>
  [req.id].filter(Boolean).map((v) => String(v));

const filterVisibleApprovals = (list: ApprovalRequest[]): ApprovalRequest[] =>
  filterNotDeleted('document', list, (req) => getApprovalMarkers(req));

export function ApprovalCenter() {
  const currentUser = getCurrentUser();
  const currentUserEmail = currentUser?.email || '';
  const currentUserName = currentUser?.name || currentUser?.email || '';
  const currentUserRole = currentUser?.userRole || currentUser?.role || '';
  const { requests: localApprovalRequests, approveRequest, rejectRequest } = useApproval();
  
  // 🔥 调试：打印当前用户角色
  console.log('🔍 [ApprovalCenter] 当前用户信息:', {
    currentUser,
    currentUserEmail,
    currentUserName,
    currentUserRole,
    userRole: currentUser?.userRole,
    role: currentUser?.role
  });
  
  // 🚨 强制弹窗显示邮箱地址
  console.log('🚨🚨🚨 [ApprovalCenter] currentUserEmail:', currentUserEmail);
  console.log('🚨🚨🚨 [ApprovalCenter] currentUser 完整对象:', JSON.stringify(currentUser, null, 2));
  
  const { updateContract, getContractByContractNumber } = useSalesContracts(); // 🔥 添加销售合同Context
  const { purchaseOrders, updatePurchaseOrder } = usePurchaseOrders();

  const isBossRole = useMemo(
    () => ['CEO', 'Boss'].includes(String(currentUserRole || '')),
    [currentUserRole]
  );

  const localApprovalView = useMemo(() => {
    const asList = Array.isArray(localApprovalRequests) ? localApprovalRequests : [];
    const canApprove = (req: ApprovalRequest) =>
      String(req.currentApprover || '') === currentUserEmail ||
      (
        isBossRole &&
        ['CEO', 'Boss'].includes(String(req.currentApproverRole || ''))
      );

    const pending = asList.filter((req) => ['pending', 'forwarded'].includes(String(req.status || '')) && canApprove(req));
    const approved = asList.filter((req) =>
      String(req.status || '') === 'approved' &&
      req.approvalHistory?.some((h) =>
        String(h.approver || '') === currentUserEmail ||
        (isBossRole && ['CEO', 'Boss'].includes(String(h.approverRole || '')))
      )
    );
    const rejected = asList.filter((req) =>
      String(req.status || '') === 'rejected' &&
      req.approvalHistory?.some((h) =>
        String(h.approver || '') === currentUserEmail ||
        (isBossRole && ['CEO', 'Boss'].includes(String(h.approverRole || '')))
      )
    );
    const submitted = asList.filter((req) => String(req.submittedBy || '') === currentUserEmail);

    return { pending, approved, rejected, submitted };
  }, [localApprovalRequests, currentUserEmail, isBossRole]);

  // 🔥 服务器审批列表（从后端接口读取，刚提交的会立刻出现在这里）
  const cached = readApprovalCenterCache(currentUserEmail);
  const [pendingApprovals, setPendingApprovals] = useState<ApprovalRequest[]>(
    filterVisibleApprovals(cached?.pending || [])
  );
  const [approvedApprovals, setApprovedApprovals] = useState<ApprovalRequest[]>(
    filterVisibleApprovals(cached?.approved || [])
  );
  const [rejectedApprovals, setRejectedApprovals] = useState<ApprovalRequest[]>(
    filterVisibleApprovals(cached?.rejected || [])
  );
  const [submittedApprovals, setSubmittedApprovals] = useState<ApprovalRequest[]>(
    filterVisibleApprovals(cached?.submitted || [])
  );
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!currentUserEmail) return;
    const nextCached = readApprovalCenterCache(currentUserEmail);
    if (nextCached) {
      setPendingApprovals(filterVisibleApprovals(nextCached.pending));
      setApprovedApprovals(filterVisibleApprovals(nextCached.approved));
      setRejectedApprovals(filterVisibleApprovals(nextCached.rejected));
      setSubmittedApprovals(filterVisibleApprovals(nextCached.submitted));
      if (typeof window !== 'undefined') {
        const visiblePending = filterVisibleApprovals(nextCached.pending || []);
        window.dispatchEvent(new CustomEvent('approvalPendingCountChanged', {
          detail: { count: visiblePending.length },
        }));
      }
    }
  }, [currentUserEmail]);

  useEffect(() => {
    if (!currentUserEmail) return;

    // 先注入“流转桥接队列”，减少切页后等待网络返回的空窗
    try {
      const rawBridge = localStorage.getItem(APPROVAL_CENTER_BRIDGE_KEY);
      const bridgeItems = rawBridge ? JSON.parse(rawBridge) : [];
      if (Array.isArray(bridgeItems)) {
        // 先清理 bridge 中已被删除（tombstone）的请求，避免“短暂复活”
        const cleanedBridgeItems = bridgeItems.filter((x: any) => {
          const requestId = String(x?.request?.id || '');
          if (!requestId) return true;
          return !isDeleted('document', requestId);
        });

        if (cleanedBridgeItems.length !== bridgeItems.length) {
          localStorage.setItem(APPROVAL_CENTER_BRIDGE_KEY, JSON.stringify(cleanedBridgeItems.slice(0, 200)));
        }

        const mine = cleanedBridgeItems
          .filter((x: any) => {
            if (!x?.request) return false;
            // 精确匹配当前审批人邮箱
            if (x?.currentApprover === currentUserEmail) return true;
            // 当前用户邮箱出现在审批链中任一环节
            const chain: any[] = Array.isArray(x?.request?.approvalChain) ? x.request.approvalChain : [];
            if (chain.some((step: any) => String(step?.approverEmail || '') === currentUserEmail)) return true;
            // CEO/Boss 角色兜底
            if (isBossRole) {
              const role = String(x?.request?.currentApproverRole || '');
              if (['CEO', 'Boss'].includes(role)) return true;
            }
            // 当前用户角色匹配审批角色（Sales_Manager 对应 区域业务主管）
            const currentRole = String(currentUserRole || '');
            const approverRole = String(x?.request?.currentApproverRole || '');
            const roleMap: Record<string, string[]> = {
              'Sales_Manager': ['区域业务主管', 'Sales_Manager', 'Manager'],
              'Sales_Director': ['销售总监', 'Sales_Director', 'Director'],
            };
            const matchRoles = roleMap[currentRole] || [];
            if (matchRoles.length > 0 && matchRoles.some(r => approverRole.includes(r) || r.includes(approverRole))) return true;
            return false;
          })
          .map((x: any) => x.request as ApprovalRequest);
        const visibleMine = filterVisibleApprovals(mine);
        if (visibleMine.length > 0) {
          // 先读当前 cache，然后合并 bridge 数据，再同步写入 cache
          // 必须在 setPendingApprovals 之前写入，否则 API 响应的 .then() 可能读到旧 cache
          const existingCache = readApprovalCenterCache(currentUserEmail);
          const existingPending = filterVisibleApprovals(existingCache?.pending || []);
          const mergedPending = filterVisibleApprovals(mergeByRequestIdentity(existingPending, visibleMine));
          try {
            writeApprovalCenterCache(currentUserEmail, {
              pending: mergedPending,
              approved: existingCache?.approved || [],
              rejected: existingCache?.rejected || [],
              submitted: existingCache?.submitted || [],
            });
          } catch {}
          setPendingApprovals(mergedPending);
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('approvalPendingCountChanged', {
              detail: { count: mergedPending.length },
            }));
          }
        }
      }
    } catch {}

    setLoading(true);
    Promise.resolve()
      .then(() => {
        // 使用 bridge/cache 作为主数据源（Supabase approval_records 在后续迭代接入）
        const latestCache = readApprovalCenterCache(currentUserEmail);
        const serverPending: ApprovalRequest[] = [];
        const serverApproved: ApprovalRequest[] = [];
        const serverRejected: ApprovalRequest[] = [];
        const serverSubmitted: ApprovalRequest[] = [];

        // 在 API 返回后再读一次 bridge，强制合并（防止竞态导致 bridge 数据被覆盖丢失）
        let liveBridgePending: ApprovalRequest[] = [];
        try {
          const rawBridge = localStorage.getItem(APPROVAL_CENTER_BRIDGE_KEY);
          const allBridgeItems = rawBridge ? JSON.parse(rawBridge) : [];
          if (Array.isArray(allBridgeItems)) {
            liveBridgePending = allBridgeItems
              .filter((x: any) => {
                if (!x?.request) return false;
                const reqId = String(x?.request?.id || '');
                if (reqId && isDeleted('document', reqId)) return false;
                if (x?.currentApprover === currentUserEmail) return true;
                const chain: any[] = Array.isArray(x?.request?.approvalChain) ? x.request.approvalChain : [];
                if (chain.some((step: any) => String(step?.approverEmail || '') === currentUserEmail)) return true;
                const crole = String(currentUserRole || '');
                const arole = String(x?.request?.currentApproverRole || '');
                const roleMap: Record<string, string[]> = {
                  'Sales_Manager': ['区域业务主管', 'Sales_Manager', 'Manager'],
                  'Sales_Director': ['销售总监', 'Sales_Director', 'Director'],
                };
                return (roleMap[crole] || []).some(r => arole.includes(r) || r.includes(arole));
              })
              .map((x: any) => x.request as ApprovalRequest);
          }
        } catch {}

        const basePending = serverPending.length > 0
          ? mergeByRequestIdentity(latestCache?.pending || [], serverPending)
          : (latestCache?.pending || []);

        const nextPending = filterVisibleApprovals(
          liveBridgePending.length > 0
            ? mergeByRequestIdentity(basePending, liveBridgePending)
            : basePending
        );
        const nextApproved = filterVisibleApprovals(
          serverApproved.length > 0
            ? mergeByRequestIdentity(latestCache?.approved || [], serverApproved)
            : (latestCache?.approved || [])
        );
        const nextRejected = filterVisibleApprovals(
          serverRejected.length > 0
            ? mergeByRequestIdentity(latestCache?.rejected || [], serverRejected)
            : (latestCache?.rejected || [])
        );
        const nextSubmitted = filterVisibleApprovals(
          serverSubmitted.length > 0
            ? mergeByRequestIdentity(latestCache?.submitted || [], serverSubmitted)
            : (latestCache?.submitted || [])
        );

        setPendingApprovals(nextPending);
        setApprovedApprovals(nextApproved);
        setRejectedApprovals(nextRejected);
        setSubmittedApprovals(nextSubmitted);

        writeApprovalCenterCache(currentUserEmail, {
          pending: nextPending,
          approved: nextApproved,
          rejected: nextRejected,
          submitted: nextSubmitted,
        });

        // 同步顶部“审批中心”红点数量
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('approvalPendingCountChanged', {
            detail: { count: nextPending.length },
          }));
        }
      })
      .catch((e) => {
        console.error('❌ [ApprovalCenter] 加载审批列表失败（保留本地数据）:', e);
        // API 失败时不清空，保持 bridge/cache 已注入的本地数据可见
      })
      .finally(() => setLoading(false));
  }, [currentUserEmail, refreshKey, isBossRole, localApprovalView]);

  // 🎯 UI状态
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterUrgency, setFilterUrgency] = useState<string>('all');
  const [filterAmount, setFilterAmount] = useState<string>('all');
  const [filterDateRange, setFilterDateRange] = useState<string>('all');
  const [selectedRequestIds, setSelectedRequestIds] = useState<string[]>([]);
  
  // 🔍 审批详情对话框
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [approvalComment, setApprovalComment] = useState('');

  // 🔥 顶部加载提示（数据来自服务器）
  //（放在这里仅用于 render 时快速显示，无业务逻辑）

  // 🎨 获取紧急程度配置
  const getUrgencyConfig = (urgency: UrgencyLevel) => {
    const configs = {
      high: { label: '紧急', color: 'bg-red-100 text-red-800 border-red-300', icon: AlertCircle },
      normal: { label: '正常', color: 'bg-blue-100 text-blue-800 border-blue-300', icon: Clock },
      low: { label: '低优先级', color: 'bg-gray-100 text-gray-800 border-gray-300', icon: Clock },
    };
    return configs[urgency];
  };

  // 🎨 获取状态配置
  const getStatusConfig = (status: ApprovalStatus) => {
    const configs = {
      pending: { label: '待审批', color: 'bg-yellow-100 text-yellow-800 border-yellow-300', icon: Clock },
      approved: { label: '已批准', color: 'bg-green-100 text-green-800 border-green-300', icon: CheckCircle },
      rejected: { label: '已驳回', color: 'bg-red-100 text-red-800 border-red-300', icon: XCircle },
      forwarded: { label: '已转交', color: 'bg-purple-100 text-purple-800 border-purple-300', icon: Send },
      cancelled: { label: '已取消', color: 'bg-gray-100 text-gray-800 border-gray-300', icon: Ban },
    };
    return configs[status] || configs.pending;
  };

  // 🔍 筛选逻辑
  const getFilteredApprovals = (approvals: ApprovalRequest[]) => {
    return approvals.filter(req => {
      // 搜索匹配
      const matchesSearch = searchTerm === '' || 
        req.relatedDocumentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.submittedByName.toLowerCase().includes(searchTerm.toLowerCase());
      
      // 紧急程度筛选
      const matchesUrgency = filterUrgency === 'all' || req.urgency === filterUrgency;
      
      // 金额筛选
      let matchesAmount = true;
      if (filterAmount !== 'all') {
        switch (filterAmount) {
          case 'low':
            matchesAmount = req.amount < 10000;
            break;
          case 'medium':
            matchesAmount = req.amount >= 10000 && req.amount < 20000;
            break;
          case 'high':
            matchesAmount = req.amount >= 20000;
            break;
        }
      }
      
      // 时间筛选
      let matchesDateRange = true;
      if (filterDateRange !== 'all') {
        const submittedDate = new Date(req.submittedAt);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        switch (filterDateRange) {
          case 'today':
            matchesDateRange = submittedDate >= today;
            break;
          case 'week':
            const weekAgo = new Date(today);
            weekAgo.setDate(weekAgo.getDate() - 7);
            matchesDateRange = submittedDate >= weekAgo;
            break;
          case 'month':
            const monthAgo = new Date(today);
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            matchesDateRange = submittedDate >= monthAgo;
            break;
        }
      }
      
      return matchesSearch && matchesUrgency && matchesAmount && matchesDateRange;
    });
  };

  // 获取当前Tab的数据
  const getCurrentTabData = () => {
    switch (activeTab) {
      case 'pending':
        return getFilteredApprovals(pendingApprovals);
      case 'approved':
        return getFilteredApprovals(approvedApprovals);
      case 'rejected':
        return getFilteredApprovals(rejectedApprovals);
      case 'submitted':
        return getFilteredApprovals(submittedApprovals);
      default:
        return [];
    }
  };

  // 审批接口的单据主键：
  // 报价/合同优先使用业务单号（relatedDocumentId），避免使用前端临时 id（qt_xxx）。
  const resolveApprovalDocKey = (req: ApprovalRequest): string => {
    const relatedId = String(req.relatedDocumentId || '').trim();
    const nestedId = String((req as any)?.relatedDocument?.id || '').trim();
    // 优先使用后端真实主键（uuid），避免使用前端本地临时 id（qt_... / quotation-...）
    const isLocalTempId =
      nestedId.startsWith('qt_') ||
      nestedId.startsWith('quotation-') ||
      nestedId.startsWith('bridge-');
    if (nestedId && !isLocalTempId) return nestedId;
    return relatedId || nestedId;
  };

  // 更新 Supabase 审批状态（替换原来的 backend API PATCH 调用）
  const patchWithMethodOverrideFallback = async (
    path: string,
    payload: Record<string, any>,
  ) => {
    // 解析 path 来决定更新哪个表
    const isContract = path.includes('/sales-contracts/');
    const isQuotation = path.includes('/sales-quotations/');
    const isApprove = path.includes('/approve');
    const isReject = path.includes('/reject');
    const isSubmit = path.includes('/submit-approval');

    const keyMatch = path.match(/\/(sales-contracts|sales-quotations)\/([^/]+)\//);
    const docKey = keyMatch ? decodeURIComponent(keyMatch[2]) : '';

    if (isContract && docKey) {
      const newStatus = isApprove ? 'approved' : isReject ? 'rejected' : 'pending';
      await contractService.updateStatus(docKey, newStatus);
    } else if (isQuotation && docKey) {
      const newStatus = isApprove ? 'approved' : isReject ? 'rejected' : isSubmit ? 'pending_approval' : 'pending';
      await salesQuotationService.updateStatus(docKey, newStatus, payload);
    }
  };

  // 审批链缺失修复：先重建 pending 步骤，再重试 approve/reject
  const rebuildApprovalChainAndRetry = async (
    req: ApprovalRequest,
    action: 'approve' | 'reject',
    comment: string,
  ) => {
    const quotationKey = resolveApprovalDocKey(req);
    const isDirector = String(req.currentApproverRole || '') === 'Sales_Director';
    const requiresDirector = Boolean(req.requiresDirectorApproval);
    const directorEmail = 'sales.director@cosun.com';

    const rebuiltChain = isDirector
      ? [
          {
            level: 1,
            approverRole: '销售总监',
            approverEmail: currentUserEmail,
            status: 'pending',
          },
        ]
      : [
          {
            level: 1,
            approverRole: '区域业务主管',
            approverEmail: currentUserEmail,
            status: 'pending',
          },
          ...(requiresDirector
            ? [
                {
                  level: 2,
                  approverRole: '销售总监',
                  approverEmail: directorEmail,
                  status: 'pending',
                },
              ]
            : []),
        ];

    await salesQuotationService.updateStatus(quotationKey, 'pending_approval', {
      approval_chain: rebuiltChain,
      amount: Number(req.amount || 0),
    });

    const actionPath =
      action === 'approve'
        ? `/api/sales-quotations/${encodeURIComponent(quotationKey)}/approve`
        : `/api/sales-quotations/${encodeURIComponent(quotationKey)}/reject`;
    const actionPayload =
      action === 'approve'
        ? { comment, approverName: currentUserName }
        : { comment, approverName: currentUserName };

    await patchWithMethodOverrideFallback(actionPath, actionPayload);
  };

  // 审批完成后从 bridge 中移除对应条目，防止重新注入为"待审批"
  const removeFromApprovalBridge = (relatedDocumentId: string) => {
    try {
      const raw = localStorage.getItem(APPROVAL_CENTER_BRIDGE_KEY);
      const list = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(list)) return;
      const filtered = list.filter((x: any) =>
        String(x?.request?.relatedDocumentId || '') !== relatedDocumentId
      );
      if (filtered.length !== list.length) {
        localStorage.setItem(APPROVAL_CENTER_BRIDGE_KEY, JSON.stringify(filtered));
      }
    } catch {}
  };

  const fallbackLocalApprove = (req: ApprovalRequest, comment: string) => {
    const nowIso = new Date().toISOString();
    const historyItem = {
      id: `hist_local_${Date.now()}`,
      approver: currentUserEmail,
      approverName: currentUserName,
      approverRole: currentUserRole || 'Regional_Manager',
      action: 'approved' as const,
      comment: comment || '批准通过（本地兼容）',
      timestamp: nowIso,
    };

    const updatedReq: ApprovalRequest = {
      ...req,
      status: 'approved',
      approvalHistory: [...(req.approvalHistory || []), historyItem],
    };

    // 同步回写业务员报价管理缓存，确保状态从“草稿/待审批”立即变为“已批准”
    syncSalesQuotationStatusByApproval(req, 'approved');

    setPendingApprovals((prev) => prev.filter((x) => String(x.id) !== String(req.id)));
    setApprovedApprovals((prev) => mergeByRequestIdentity([updatedReq], prev));
    try {
      const existingCache = readApprovalCenterCache(currentUserEmail);
      writeApprovalCenterCache(currentUserEmail, {
        pending: (existingCache?.pending || []).filter((x) => String(x.id) !== String(req.id)),
        approved: mergeByRequestIdentity([updatedReq], existingCache?.approved || []),
        rejected: existingCache?.rejected || [],
        submitted: existingCache?.submitted || [],
      });
    } catch {}
    // 从 bridge 中移除，避免 useEffect 重跑时再次注入为"待审批"
    removeFromApprovalBridge(req.relatedDocumentId);
    emitQuotationRefreshEvent(req, 'approved');
  };

  const fallbackLocalReject = (req: ApprovalRequest, comment: string) => {
    const nowIso = new Date().toISOString();
    const historyItem = {
      id: `hist_local_${Date.now()}`,
      approver: currentUserEmail,
      approverName: currentUserName,
      approverRole: currentUserRole || 'Regional_Manager',
      action: 'rejected' as const,
      comment: comment || '驳回（本地兼容）',
      timestamp: nowIso,
    };

    const updatedReq: ApprovalRequest = {
      ...req,
      status: 'rejected',
      approvalHistory: [...(req.approvalHistory || []), historyItem],
    };

    // 同步回写业务员报价管理缓存，确保状态立即变为“已驳回”
    syncSalesQuotationStatusByApproval(req, 'rejected');

    setPendingApprovals((prev) => prev.filter((x) => String(x.id) !== String(req.id)));
    setRejectedApprovals((prev) => mergeByRequestIdentity([updatedReq], prev));
    try {
      const existingCache = readApprovalCenterCache(currentUserEmail);
      writeApprovalCenterCache(currentUserEmail, {
        pending: (existingCache?.pending || []).filter((x) => String(x.id) !== String(req.id)),
        approved: existingCache?.approved || [],
        rejected: mergeByRequestIdentity([updatedReq], existingCache?.rejected || []),
        submitted: existingCache?.submitted || [],
      });
    } catch {}
    // 从 bridge 中移除，避免 useEffect 重跑时再次注入为"待审批"
    removeFromApprovalBridge(req.relatedDocumentId);
    emitQuotationRefreshEvent(req, 'rejected');
  };

  const emitQuotationRefreshEvent = (req: ApprovalRequest, status: 'approved' | 'rejected') => {
    try {
      emitErpEvent({
        id: `evt-quotation-status-${Date.now()}`,
        key: status === 'approved' ? ERP_EVENT_KEYS.QUOTATION_ACCEPTED : ERP_EVENT_KEYS.QUOTATION_SENT,
        domain: 'quotation',
        recordId: String((req as any)?.relatedDocument?.id || req.relatedDocumentId || req.id),
        internalNo: String(req.relatedDocumentId || ''),
        source: 'admin',
        occurredAt: new Date().toISOString(),
        metadata: { approvalStatus: status, from: 'ApprovalCenterFallback' },
      });
    } catch {}
  };

  const syncSalesQuotationStatusByApproval = (req: ApprovalRequest, status: 'approved' | 'rejected') => {
    try {
      if (typeof window === 'undefined') return;

      const relatedNo = String(req.relatedDocumentId || '').trim();
      const nestedId = String((req as any)?.relatedDocument?.id || '').trim();

      const shouldMatch = (q: any) => {
        const qId = String(q?.id || '').trim();
        const qtNo = String(q?.qtNumber || q?.quoteNo || '').trim();
        if (relatedNo && qtNo === relatedNo) return true;
        if (nestedId && qId === nestedId) return true;
        return false;
      };

      const patchList = (list: any[]): any[] => {
        if (!Array.isArray(list)) return list;
        return list.map((q: any) =>
          shouldMatch(q)
            ? {
                ...q,
                approvalStatus: status,
                status: status === 'approved' ? 'approved' : 'rejected',
              }
            : q
        );
      };

      // 1) 回写 legacy 全局列表
      const rawLegacy = localStorage.getItem('salesQuotations');
      if (rawLegacy) {
        const parsed = JSON.parse(rawLegacy);
        localStorage.setItem('salesQuotations', JSON.stringify(patchList(parsed)));
      }

      // 2) 回写所有按用户维度缓存
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k) continue;
        if (k.startsWith(`${SALES_QUOTATION_CACHE_PREFIX}:`)) keys.push(k);
      }
      keys.forEach((k) => {
        const raw = localStorage.getItem(k);
        if (!raw) return;
        const parsed = JSON.parse(raw);
        localStorage.setItem(k, JSON.stringify(patchList(parsed)));
      });
    } catch (e) {
      console.warn('⚠️ syncSalesQuotationStatusByApproval failed:', e);
    }
  };

  // ✅ 批准审批
  const handleApprove = async () => {
    if (!selectedRequest) return;
    
    const comment = approvalComment.trim() || '批准通过';
    
    console.log('🔍 [ApprovalCenter] handleApprove 调用:');
    console.log('  - selectedRequest.id:', selectedRequest.id);
    console.log('  - selectedRequest.relatedDocumentId:', selectedRequest.relatedDocumentId);
    console.log('  - selectedRequest.status:', selectedRequest.status);
    console.log('  - selectedRequest.requiresDirectorApproval:', selectedRequest.requiresDirectorApproval);
    console.log('  - currentUserRole:', currentUserRole);
    console.log('  - 判断条件: requiresDirectorApproval && currentUserRole !== "Sales_Director"');
    console.log('  - 判断结果:', selectedRequest.requiresDirectorApproval && currentUserRole !== 'Sales_Director');
    
    try {
      if (selectedRequest.relatedDocumentType === '采购请求审批' || String(selectedRequest.relatedDocumentId || '').startsWith('PRQ-')) {
        approveRequest(selectedRequest.id, currentUserEmail, currentUserName, currentUserRole || 'CEO', comment);
      } else if (selectedRequest.type === 'sales_contract') {
        const contractKey = resolveApprovalDocKey(selectedRequest);
        await patchWithMethodOverrideFallback(
          `/api/sales-contracts/${encodeURIComponent(contractKey)}/approve`,
          { comment, approverName: currentUserName, approverEmail: currentUserEmail },
        );
      } else {
        const quotationKey = resolveApprovalDocKey(selectedRequest);
        await patchWithMethodOverrideFallback(
          `/api/sales-quotations/${encodeURIComponent(quotationKey)}/approve`,
          { comment, approverName: currentUserName },
        );
      }
      toast.success('✅ 已批准');
      removeFromApprovalBridge(selectedRequest.relatedDocumentId);
      // 立即更新本地状态：从 pending 移走，加入 approved
      fallbackLocalApprove(selectedRequest, comment);
      setRefreshKey((k) => k + 1);
    } catch (e: any) {
      const msg = String(e?.message || '');

      // 合同审批 API 失败时直接本地兜底（后端不通时不阻塞业务）
      if (selectedRequest?.type === 'sales_contract') {
        console.warn('⚠️ [ApprovalCenter] 合同审批 API 失败，使用本地兜底:', msg);
        removeFromApprovalBridge(selectedRequest.relatedDocumentId);
        fallbackLocalApprove(selectedRequest, comment);
        // 同步更新合同状态为 approved
        try {
          const contract = getContractByContractNumber(selectedRequest.relatedDocumentId);
          if (contract?.id) updateContract(contract.id, { status: 'approved' });
        } catch {}
        toast.success('✅ 已批准（本地兼容模式）');
        setRefreshKey((k) => k + 1);
        setShowDetailDialog(false);
        setSelectedRequest(null);
        setApprovalComment('');
        return;
      }

      if (msg.includes('No pending approval step')) {
        try {
          await rebuildApprovalChainAndRetry(selectedRequest, 'approve', comment);
          toast.success('✅ 已批准（已自动修复审批链）');
          removeFromApprovalBridge(selectedRequest.relatedDocumentId);
          setRefreshKey((k) => k + 1);
          setShowDetailDialog(false);
          setSelectedRequest(null);
          setApprovalComment('');
          return;
        } catch (repairErr: any) {
          console.error('❌ [ApprovalCenter] auto-repair approve failed:', repairErr);
          // 最终兜底：本地完成流转，避免阻塞业务操作
          fallbackLocalApprove(selectedRequest, comment);
          toast.success('✅ 已批准（本地兼容模式）');
          setShowDetailDialog(false);
          setSelectedRequest(null);
          setApprovalComment('');
          return;
        }
      }
      console.error('❌ [ApprovalCenter] approve failed:', e);
      toast.error(`批准失败: ${e?.message || '未知错误'}`);
      return;
    }
    
    setShowDetailDialog(false);
    setSelectedRequest(null);
    setApprovalComment('');
  };

  // ❌ 驳回审批
  const handleReject = async () => {
    if (!selectedRequest) return;
    
    const comment = approvalComment.trim();
    if (!comment) {
      toast.error('请输入驳回原因');
      return;
    }
    
    try {
      if (selectedRequest.relatedDocumentType === '采购请求审批' || String(selectedRequest.relatedDocumentId || '').startsWith('PRQ-')) {
        rejectRequest(selectedRequest.id, currentUserEmail, currentUserName, currentUserRole || 'CEO', comment);
      } else if (selectedRequest.type === 'sales_contract') {
        const contractKey = resolveApprovalDocKey(selectedRequest);
        await patchWithMethodOverrideFallback(
          `/api/sales-contracts/${encodeURIComponent(contractKey)}/reject`,
          { comment, approverName: currentUserName, approverEmail: currentUserEmail },
        );
      } else {
        const quotationKey = resolveApprovalDocKey(selectedRequest);
        await patchWithMethodOverrideFallback(
          `/api/sales-quotations/${encodeURIComponent(quotationKey)}/reject`,
          { comment, approverName: currentUserName },
        );
      }
      toast.error(selectedRequest.type === 'sales_contract'
        ? '❌ 已驳回！合同已退回给业务员修改。'
        : '❌ 已驳回！报价单已退回给业务员修改。'
      );
      removeFromApprovalBridge(selectedRequest.relatedDocumentId);
      // 立即更新本地状态：从 pending 移走，加入 rejected
      fallbackLocalReject(selectedRequest, comment);
      setRefreshKey((k) => k + 1);
    } catch (e: any) {
      const msg = String(e?.message || '');

      // 合同驳回 API 失败时直接本地兜底
      if (selectedRequest?.type === 'sales_contract') {
        console.warn('⚠️ [ApprovalCenter] 合同驳回 API 失败，使用本地兜底:', msg);
        removeFromApprovalBridge(selectedRequest.relatedDocumentId);
        fallbackLocalReject(selectedRequest, comment);
        toast.error('❌ 已驳回！合同已退回给业务员修改。（本地兼容模式）');
        setRefreshKey((k) => k + 1);
        setShowDetailDialog(false);
        setSelectedRequest(null);
        setApprovalComment('');
        return;
      }

      if (msg.includes('No pending approval step')) {
        try {
          await rebuildApprovalChainAndRetry(selectedRequest, 'reject', comment);
          toast.error('❌ 已驳回（已自动修复审批链）');
          removeFromApprovalBridge(selectedRequest.relatedDocumentId);
          setRefreshKey((k) => k + 1);
          setShowDetailDialog(false);
          setSelectedRequest(null);
          setApprovalComment('');
          return;
        } catch (repairErr: any) {
          console.error('❌ [ApprovalCenter] auto-repair reject failed:', repairErr);
          fallbackLocalReject(selectedRequest, comment);
          toast.error('❌ 已驳回（本地兼容模式）');
          setShowDetailDialog(false);
          setSelectedRequest(null);
          setApprovalComment('');
          return;
        }
      }
      console.error('❌ [ApprovalCenter] reject failed:', e);
      toast.error(`驳回失败: ${e?.message || '未知错误'}`);
      return;
    }
    setShowDetailDialog(false);
    setSelectedRequest(null);
    setApprovalComment('');
  };

  // 📄 查看详情
  const handleViewDetail = (request: ApprovalRequest) => {
    setSelectedRequest(request);
    setShowDetailDialog(true);
    setApprovalComment('');
  };

  // 🎨 格式化时间
  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    
    return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
  };

  // 🎨 格式化剩余时间
  const formatExpiresIn = (hours: number) => {
    if (hours < 0) return <span className="text-red-600">已超时</span>;
    if (hours < 1) return <span className="text-red-600">不足1小时</span>;
    if (hours < 24) return <span className="text-orange-600">剩余 {Math.floor(hours)} 小时</span>;
    return <span className="text-gray-600">剩余 {Math.floor(hours / 24)} 天</span>;
  };

  const currentTabData = getCurrentTabData();
  const currentTabRequestIds = currentTabData.map((r) => String(r.id));
  const selectedCount = selectedRequestIds.filter((id) => currentTabRequestIds.includes(id)).length;
  const allSelected = currentTabData.length > 0 && selectedCount === currentTabData.length;

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRequestIds(currentTabRequestIds);
      return;
    }
    setSelectedRequestIds([]);
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const normalizedId = String(id);
    if (checked) {
      setSelectedRequestIds((prev) => (prev.includes(normalizedId) ? prev : [...prev, normalizedId]));
      return;
    }
    setSelectedRequestIds((prev) => prev.filter((x) => x !== normalizedId));
  };

  const handleBatchDelete = () => {
    if (selectedCount === 0) {
      toast.error('请先勾选要删除的记录');
      return;
    }

    if (!window.confirm(`确认删除选中的 ${selectedCount} 条记录？`)) return;

    const idSet = new Set(selectedRequestIds);
    const allRows = [...pendingApprovals, ...approvedApprovals, ...rejectedApprovals, ...submittedApprovals];
    const selectedRows = allRows.filter((req) => idSet.has(String(req.id)));

    // 删除采购审批单时，回滚采购单到“可申请审核”状态
    selectedRows
      .filter((req) => req.relatedDocumentType === '采购请求审批' || String(req.relatedDocumentId || '').startsWith('PRQ-'))
      .forEach((req) => {
        const poNos = new Set<string>();
        const requestPoNo = String((req as any)?.relatedDocument?.poNumber || '')
          .trim()
          .toUpperCase();
        if (requestPoNo) poNos.add(requestPoNo);
        const requestPoList = Array.isArray((req as any)?.relatedDocument?.purchaseOrders)
          ? (req as any).relatedDocument.purchaseOrders
          : [];
        requestPoList.forEach((poNo: any) => {
          const normalized = String(poNo || '').trim().toUpperCase();
          if (normalized) poNos.add(normalized);
        });
        const idPoNo = String(req.relatedDocumentId || '')
          .replace(/^PRQ-/i, '')
          .trim()
          .toUpperCase();
        if (idPoNo.startsWith('CG-')) poNos.add(idPoNo);

        purchaseOrders.forEach((po) => {
          const poNo = String(po.poNumber || '').trim().toUpperCase();
          const parentNo = String((po as any).parentRequestPoNumber || '').trim().toUpperCase();
          const matched = poNos.has(poNo) || (parentNo && poNos.has(parentNo));
          if (!matched) return;
          const currentReqStatus = String((po as any).procurementRequestStatus || '');
          if (currentReqStatus === 'pushed_supplier') return;
          updatePurchaseOrder(po.id, {
            procurementRequestStatus: 'draft_allocated',
            updatedDate: new Date().toISOString(),
          } as any);
        });
      });

    const markers = selectedRows.flatMap((req) => getApprovalMarkers(req));
    addTombstones('document', markers, {
      reason: 'manual-delete-approval-center-item',
      deletedBy: currentUserEmail || 'admin',
    });
    setPendingApprovals((prev) => filterVisibleApprovals(prev.filter((req) => !idSet.has(String(req.id)))));
    setApprovedApprovals((prev) => filterVisibleApprovals(prev.filter((req) => !idSet.has(String(req.id)))));
    setRejectedApprovals((prev) => filterVisibleApprovals(prev.filter((req) => !idSet.has(String(req.id)))));
    setSubmittedApprovals((prev) => filterVisibleApprovals(prev.filter((req) => !idSet.has(String(req.id)))));
    setSelectedRequestIds([]);
    toast.success(`已删除 ${selectedCount} 条记录`);
  };

  useEffect(() => {
    setSelectedRequestIds([]);
  }, [activeTab]);

  const canCurrentUserApproveRequest = (req: ApprovalRequest) =>
    String(req.currentApprover || '') === currentUserEmail ||
    (
      isBossRole &&
      ['CEO', 'Boss'].includes(String(req.currentApproverRole || ''))
    );

  return (
    <div className="space-y-6">
      {loading && (
        <div className="text-xs text-blue-600 flex items-center gap-1">
          <Clock className="w-3 h-3 animate-spin" />
          正在从服务器加载审批列表...
        </div>
      )}
      {/* 📊 审批概览仪表盘 */}
      <div className="grid grid-cols-4 gap-4">
        <div 
          className={`bg-white border-2 rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
            activeTab === 'pending' ? 'border-[#F96302] shadow-md' : 'border-gray-200'
          }`}
          onClick={() => setActiveTab('pending')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">待我审批</p>
              <p className="text-3xl font-bold text-gray-900">{pendingApprovals.length}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
          {pendingApprovals.length > 0 && (
            <div className="mt-3 flex items-center gap-1 text-sm text-red-600">
              <AlertCircle className="w-4 h-4" />
              <span>有紧急审批待处理</span>
            </div>
          )}
        </div>

        <div 
          className={`bg-white border-2 rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
            activeTab === 'approved' ? 'border-[#F96302] shadow-md' : 'border-gray-200'
          }`}
          onClick={() => setActiveTab('approved')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">我已审批</p>
              <p className="text-3xl font-bold text-gray-900">{approvedApprovals.length}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div 
          className={`bg-white border-2 rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
            activeTab === 'rejected' ? 'border-[#F96302] shadow-md' : 'border-gray-200'
          }`}
          onClick={() => setActiveTab('rejected')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">我已驳回</p>
              <p className="text-3xl font-bold text-gray-900">{rejectedApprovals.length}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div 
          className={`bg-white border-2 rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
            activeTab === 'submitted' ? 'border-[#F96302] shadow-md' : 'border-gray-200'
          }`}
          onClick={() => setActiveTab('submitted')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">我发起的</p>
              <p className="text-3xl font-bold text-gray-900">{submittedApprovals.length}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <Send className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* 🎯 筛选器和列表 */}
      <div className="bg-white border border-gray-200 rounded-lg">
        {/* 筛选栏 */}
        <div className="px-5 py-3 border-b border-gray-200 bg-gray-50">
          <div className="flex gap-3 items-center">
            {/* 搜索框 */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="搜索单据号、客户名称、业务员..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>

            <Button
              variant="destructive"
              size="sm"
              onClick={handleBatchDelete}
              disabled={selectedCount === 0}
              className="h-9 text-xs gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              批量删除{selectedCount > 0 ? ` (${selectedCount})` : ''}
            </Button>

            {/* 紧急程度筛选 */}
            <Select value={filterUrgency} onValueChange={setFilterUrgency}>
              <SelectTrigger className="w-[120px] h-9 text-xs bg-white">
                <SelectValue placeholder="紧急程度" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" style={{ fontSize: '12px' }}>全部程度</SelectItem>
                <SelectItem value="high" style={{ fontSize: '12px' }}>紧急</SelectItem>
                <SelectItem value="normal" style={{ fontSize: '12px' }}>正常</SelectItem>
                <SelectItem value="low" style={{ fontSize: '12px' }}>低优先级</SelectItem>
              </SelectContent>
            </Select>

            {/* 金额区间筛选 */}
            <Select value={filterAmount} onValueChange={setFilterAmount}>
              <SelectTrigger className="w-[140px] h-9 text-xs bg-white">
                <SelectValue placeholder="金额区间" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" style={{ fontSize: '12px' }}>全部金额</SelectItem>
                <SelectItem value="low" style={{ fontSize: '12px' }}>&lt; $10,000</SelectItem>
                <SelectItem value="medium" style={{ fontSize: '12px' }}>$10,000 - $20,000</SelectItem>
                <SelectItem value="high" style={{ fontSize: '12px' }}>&gt;= $20,000</SelectItem>
              </SelectContent>
            </Select>

            {/* 时间段筛选 */}
            <Select value={filterDateRange} onValueChange={setFilterDateRange}>
              <SelectTrigger className="w-[110px] h-9 text-xs bg-white">
                <SelectValue placeholder="时间段" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" style={{ fontSize: '12px' }}>全部时间</SelectItem>
                <SelectItem value="today" style={{ fontSize: '12px' }}>今天</SelectItem>
                <SelectItem value="week" style={{ fontSize: '12px' }}>近7天</SelectItem>
                <SelectItem value="month" style={{ fontSize: '12px' }}>近1月</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 审批列表 */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="h-9 w-[44px]" style={{ fontSize: '12px' }}>
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={(checked) => handleSelectAll(Boolean(checked))}
                  />
                </TableHead>
                <TableHead className="h-9 w-[60px]" style={{ fontSize: '12px' }}>序号</TableHead>
                <TableHead className="h-9" style={{ fontSize: '12px' }}>单据信息</TableHead>
                <TableHead className="h-9" style={{ fontSize: '12px' }}>业务员</TableHead>
                <TableHead className="h-9" style={{ fontSize: '12px' }}>客户信息</TableHead>
                <TableHead className="h-9" style={{ fontSize: '12px' }}>金额</TableHead>
                <TableHead className="h-9" style={{ fontSize: '12px' }}>紧急程度</TableHead>
                <TableHead className="h-9" style={{ fontSize: '12px' }}>提交时间</TableHead>
                {activeTab === 'pending' && (
                  <TableHead className="h-9" style={{ fontSize: '12px' }}>审批期限</TableHead>
                )}
                <TableHead className="h-9" style={{ fontSize: '12px' }}>状态</TableHead>
                <TableHead className="h-9 text-center" style={{ fontSize: '12px' }}>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentTabData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={activeTab === 'pending' ? 11 : 10} className="text-center py-8 text-gray-500">
                    暂无审批记录
                  </TableCell>
                </TableRow>
              ) : (
                currentTabData.map((request, index) => {
                  const urgencyConfig = getUrgencyConfig(request.urgency);
                  const statusConfig = getStatusConfig(request.status);
                  const UrgencyIcon = urgencyConfig.icon;
                  
                  return (
                    <TableRow key={request.id} className="hover:bg-gray-50">
                      <TableCell className="py-3">
                        <Checkbox
                          checked={selectedRequestIds.includes(String(request.id))}
                          onCheckedChange={(checked) => handleSelectOne(String(request.id), Boolean(checked))}
                        />
                      </TableCell>
                      <TableCell className="py-3" style={{ fontSize: '12px' }}>
                        <span className="text-gray-500">{index + 1}</span>
                      </TableCell>
                      
                      <TableCell className="py-3" style={{ fontSize: '12px' }}>
                        <div>
                          <p className="font-medium text-blue-600">{request.relatedDocumentId}</p>
                          <p className="text-gray-500 text-xs">{request.relatedDocumentType}</p>
                          <p className="text-gray-500 text-xs mt-1">{request.productSummary}</p>
                        </div>
                      </TableCell>
                      
                      <TableCell className="py-3" style={{ fontSize: '12px' }}>
                        <div>
                          {(() => {
                            const doc = (request as any).relatedDocument;
                            // 从多个来源尝试获取真实业务员信息，排除 admin@cosun.com 这种系统账号
                            const candidates = [
                              { name: doc?.salesPersonName, email: doc?.salesPerson || doc?.salesPersonEmail },
                              { name: request.submittedByName, email: request.submittedBy },
                            ];
                            const best = candidates.find(c => c.email && c.email !== 'admin@cosun.com') || candidates[0];
                            const displayEmail = best?.email || '';
                            const displayName = best?.name || displayEmail;
                            return (
                              <>
                                <p className="font-medium text-gray-900">{displayName}</p>
                                <p className="text-gray-500 text-xs">{displayEmail}</p>
                              </>
                            );
                          })()}
                        </div>
                      </TableCell>
                      
                      <TableCell className="py-3" style={{ fontSize: '12px' }}>
                        <div>
                          <p className="font-medium text-gray-900">{request.customerName}</p>
                          <p className="text-gray-500 text-xs">{request.customerEmail}</p>
                        </div>
                      </TableCell>
                      
                      <TableCell className="py-3" style={{ fontSize: '12px' }}>
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-3.5 h-3.5 text-green-600" />
                          <span className="font-semibold text-gray-900">
                            ${request.amount.toLocaleString()}
                          </span>
                          <span className="text-gray-500 text-xs">{request.currency}</span>
                        </div>
                        {/* 🔥 修复：只在待审批或转发中时显示"需总监复审"标签 */}
                        {request.requiresDirectorApproval && (request.status === 'pending' || request.status === 'forwarded') && (
                          <Badge className="mt-1 h-5 px-1.5 text-xs bg-orange-100 text-orange-800 border-orange-300">
                            需总监复审
                          </Badge>
                        )}
                      </TableCell>
                      
                      <TableCell className="py-3">
                        <Badge className={`h-5 px-2 text-xs border ${urgencyConfig.color}`}>
                          <UrgencyIcon className="w-3 h-3 mr-1" />
                          {urgencyConfig.label}
                        </Badge>
                      </TableCell>
                      
                      <TableCell className="py-3" style={{ fontSize: '12px' }}>
                        <span className="text-gray-600">{formatTime(request.submittedAt)}</span>
                      </TableCell>
                      
                      {activeTab === 'pending' && (
                        <TableCell className="py-3" style={{ fontSize: '12px' }}>
                          {formatExpiresIn(request.expiresIn)}
                        </TableCell>
                      )}
                      
                      <TableCell className="py-3">
                        <Badge className={`h-5 px-2 text-xs border ${statusConfig.color}`}>
                          {statusConfig.label}
                        </Badge>
                      </TableCell>
                      
                      <TableCell className="py-3 text-center">
                        {/* 🔥 在待审批tab显示"审核"按钮，其他tab显示"查看详情"按钮 */}
                        {activeTab === 'pending' ? (
                          <Button
                            size="sm"
                            className="h-7 px-3 text-xs bg-[#F96302] hover:bg-[#E55A02] text-white"
                            onClick={() => handleViewDetail(request)}
                          >
                            <CheckCircle className="w-3.5 h-3.5 mr-1" />
                            审核
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={() => handleViewDetail(request)}
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            查看详情
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* 🔍 审批详情对话框 */}
      {selectedRequest && (
        <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden p-0 gap-0">
            <DialogHeader className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <DialogTitle className="text-lg">
                审批详情 - {selectedRequest.relatedDocumentId}
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-600">
                {selectedRequest.relatedDocumentType} · 提交人：{selectedRequest.submittedByName}
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-3 gap-0 h-[calc(90vh-120px)]">
              {/* 左侧：单据内容 */}
              <div className="col-span-2 overflow-y-auto border-r border-gray-200 bg-gray-50">
                <div className="p-6">
                  {/* 🔥 根据文档类型动态渲染对应的查看组件 */}
                  {selectedRequest.relatedDocument && (
                    <>
                      {selectedRequest.relatedDocumentType === '采购请求审批' || String(selectedRequest.relatedDocumentId || '').startsWith('PRQ-') ? (
                        (() => {
                          const requestMainNo = String((selectedRequest.relatedDocument as any)?.poNumber || '').trim().toUpperCase();
                          const requestPoNos: string[] = Array.isArray((selectedRequest.relatedDocument as any)?.purchaseOrders)
                            ? (selectedRequest.relatedDocument as any).purchaseOrders.map((n: any) => String(n || '').trim().toUpperCase()).filter(Boolean)
                            : [];
                          const primaryPO = (purchaseOrders || []).find((po) => {
                            const poNo = String(po.poNumber || '').trim().toUpperCase();
                            const parentNo = String((po as any).parentRequestPoNumber || '').trim().toUpperCase();
                            return poNo === requestMainNo || parentNo === requestMainNo || requestPoNos.includes(poNo);
                          });

                          if (!primaryPO) {
                            return (
                              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-sm text-gray-500">
                                未找到原始采购订单，无法渲染原版采购订单模板。
                              </div>
                            );
                          }

                          return (
                            <div className="bg-white rounded-lg shadow-sm">
                              <PurchaseOrderDocument data={convertToPOData(primaryPO as any)} />
                            </div>
                          );
                        })()
                      ) : selectedRequest.type === 'sales_contract' ? (
                        // 🔥 销售合同：使用SalesContractDocument组件
                        <div className="bg-white rounded-lg shadow-sm">
                          <SalesContractDocument 
                            data={{
                              // 合同基本信息
                              contractNo: selectedRequest.relatedDocument.contractNumber,
                              contractDate: selectedRequest.relatedDocument.createdAt ? new Date(selectedRequest.relatedDocument.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                              quotationNo: selectedRequest.relatedDocument.quotationNumber,
                              inquiryNo: selectedRequest.relatedDocument.inquiryNumber,
                              region: selectedRequest.relatedDocument.region || 'NA',
                              
                              // 卖方信息（福建高盛达富建材有限公司）
                              seller: {
                                name: '福建高盛达富建材有限公司',
                                nameEn: 'FUJIAN COSUN BUILDING MATERIALS CO., LTD.',
                                address: '中国福建省厦门市工业园区123号',
                                addressEn: 'No. 123, Industrial Park, Xiamen, Fujian, China',
                                tel: '+86-592-1234-5678',
                                fax: '+86-592-1234-5679',
                                email: selectedRequest.submittedBy || 'sales@cosun.com',
                                legalRepresentative: '张总',
                                bankInfo: {
                                  bankName: 'Bank of China, Xiamen Branch',
                                  accountName: 'FUJIAN COSUN BUILDING MATERIALS CO., LTD.',
                                  accountNumber: '1234567890123456',
                                  swiftCode: 'BKCHCNBJ950',
                                  bankAddress: 'Xiamen, Fujian, China',
                                  currency: 'USD'
                                }
                              },
                              
                              // 买方信息（客户）
                              buyer: {
                                companyName: selectedRequest.relatedDocument.customerCompany || selectedRequest.customerName,
                                address: selectedRequest.relatedDocument.customerAddress || '',
                                country: selectedRequest.relatedDocument.customerCountry || '',
                                contactPerson: selectedRequest.relatedDocument.contactPerson || selectedRequest.customerName,
                                tel: selectedRequest.relatedDocument.contactPhone || '',
                                email: selectedRequest.customerEmail || ''
                              },
                              
                              // 产品明细
                              products: (selectedRequest.relatedDocument.products || []).map((item: any, index: number) => ({
                                no: index + 1,
                                modelNo: item.modelNo || '',
                                imageUrl: item.imageUrl || '',
                                description: item.productName || '',
                                specification: item.specification || '',
                                hsCode: item.hsCode || '',
                                quantity: item.quantity || 0,
                                unit: item.unit || 'PCS',
                                unitPrice: item.unitPrice || 0,
                                currency: selectedRequest.relatedDocument.currency || 'USD',
                                amount: (item.unitPrice || 0) * (item.quantity || 0),
                                deliveryTime: item.deliveryTime || selectedRequest.relatedDocument.deliveryTime || ''
                              })),
                              
                              // 合同条款（terms对象）
                              terms: {
                                totalAmount: selectedRequest.amount,
                                currency: selectedRequest.relatedDocument.currency || 'USD',
                                tradeTerms: selectedRequest.relatedDocument.tradeTerms || 'FOB Xiamen',
                                paymentTerms: selectedRequest.relatedDocument.paymentTerms || '30% T/T deposit, 70% before shipment',
                                depositAmount: selectedRequest.relatedDocument.depositAmount || (selectedRequest.amount * 0.3),
                                balanceAmount: selectedRequest.relatedDocument.balanceAmount || (selectedRequest.amount * 0.7),
                                deliveryTime: selectedRequest.relatedDocument.deliveryTime || '25-30 days after deposit',
                                portOfLoading: selectedRequest.relatedDocument.portOfLoading || 'Xiamen, China',
                                portOfDestination: selectedRequest.relatedDocument.portOfDestination || '',
                                packing: selectedRequest.relatedDocument.packing || 'Export standard carton',
                                inspection: selectedRequest.relatedDocument.inspection || "Seller's factory inspection",
                                warranty: selectedRequest.relatedDocument.warranty || '12 months from delivery date'
                              },
                              
                              // 备注
                              remarks: selectedRequest.relatedDocument.remarks || '',
                              
                              // 业务员信息
                              salesPerson: {
                                name: selectedRequest.submittedByName || 'Sales Representative',
                                position: 'Sales Manager',
                                email: selectedRequest.submittedBy || '',
                                phone: '+86-592-1234567'
                              }
                            }}
                          />
                        </div>
                      ) : selectedRequest.type === 'quotation' ? (
                        // 🔥 销售报价单：使用QuotationDocument组件（和业务员看到的完全一样）
                        <div className="bg-white rounded-lg shadow-sm">
                          <QuotationDocument 
                            data={{
                              // 报价单基本信息
                              quotationNo: selectedRequest.relatedDocument.qtNumber,
                              quotationDate: selectedRequest.relatedDocument.createdAt ? new Date(selectedRequest.relatedDocument.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                              validUntil: selectedRequest.relatedDocument.validUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                              inquiryNo: selectedRequest.relatedDocument.inqNumber || selectedRequest.relatedDocument.qrNumber,
                              region: selectedRequest.relatedDocument.region || 'NA',
                              
                              // 公司信息
                              company: {
                                name: '福建高盛达富建材有限公司',
                                nameEn: 'Fujian Gaoshengdafu Building Materials Co., Ltd.',
                                address: '中国福建省厦门市思明区',
                                addressEn: 'Siming District, Xiamen, Fujian Province, China',
                                tel: '+86-592-1234567',
                                fax: '+86-592-1234568',
                                email: 'info@cosun.com',
                                website: 'www.cosun.com'
                              },
                              
                              // 客户信息
                              customer: {
                                companyName: selectedRequest.relatedDocument.customerCompany || '',
                                contactPerson: selectedRequest.relatedDocument.customerName || '',
                                address: selectedRequest.relatedDocument.customerAddress || '',
                                email: selectedRequest.relatedDocument.customerEmail || '',
                                phone: selectedRequest.relatedDocument.customerPhone || ''
                              },
                              
                              // 产品报价列表
                              products: (selectedRequest.relatedDocument.items || []).map((item: any, index: number) => {
                                // 🔥 调试：检查item数据结构
                                console.log('🔍 [ApprovalCenter] 产品数据检查:', {
                                  productName: item.productName,
                                  salesPrice: item.salesPrice,
                                  unitPrice: item.unitPrice,
                                  costPrice: item.costPrice,
                                  quantity: item.quantity,
                                  finalPrice: item.salesPrice || item.unitPrice || 0
                                });
                                
                                return {
                                  no: index + 1,
                                  modelNo: item.modelNo || '',
                                  imageUrl: item.imageUrl || '',
                                  productName: item.productName || '',
                                  specification: item.specification || '',
                                  hsCode: item.hsCode || '',
                                  quantity: item.quantity || 0,
                                  unit: item.unit || 'PCS',
                                  unitPrice: item.salesPrice || item.unitPrice || 0, // 🔥 修复：优先使用salesPrice（报价），其次unitPrice
                                  currency: 'USD',
                                  amount: (item.salesPrice || item.unitPrice || 0) * (item.quantity || 0), // 🔥 修复：金额也使用salesPrice
                                  moq: item.moq || 0,
                                  leadTime: item.leadTime || ''
                                };
                              }),
                              
                              // 贸易条款
                              tradeTerms: {
                                incoterms: selectedRequest.relatedDocument.tradeTerms?.incoterms || 'FOB Xiamen',
                                paymentTerms: selectedRequest.relatedDocument.tradeTerms?.paymentTerms || '30% T/T deposit, 70% before shipment',
                                deliveryTime: selectedRequest.relatedDocument.tradeTerms?.deliveryTime || '25-30 days after deposit',
                                packing: selectedRequest.relatedDocument.tradeTerms?.packing || 'Export carton with pallets',
                                portOfLoading: selectedRequest.relatedDocument.tradeTerms?.portOfLoading || 'Xiamen, China',
                                portOfDestination: selectedRequest.relatedDocument.tradeTerms?.portOfDestination || '',
                                warranty: selectedRequest.relatedDocument.tradeTerms?.warranty || '12 months from delivery date against manufacturing defects',
                                inspection: selectedRequest.relatedDocument.tradeTerms?.inspection || "Seller's factory inspection, buyer has the right to re-inspect upon arrival"
                              },
                              
                              // 备注
                              remarks: selectedRequest.relatedDocument.remarks || selectedRequest.relatedDocument.customerNotes || '',
                              // 🔒 安全：不显示 internalNotes（采购员建议等敏感信息）
                              
                              // 业务员信息
                              salesPerson: {
                                name: selectedRequest.submittedByName || 'Sales Representative',
                                position: 'Sales Manager',
                                email: selectedRequest.submittedBy || '',
                                phone: selectedRequest.relatedDocument.salesPersonPhone || '+86-592-1234567',
                                whatsapp: selectedRequest.relatedDocument.salesPersonWhatsapp || ''
                              }
                            }}
                          />
                        </div>
                      ) : (
                        // 客户询价单：使用CustomerInquiryView组件
                        <CustomerInquiryView inquiry={selectedRequest.relatedDocument} />
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* 右侧：审批操作区 */}
              <div className="overflow-y-auto bg-white">
                <div className="p-6 space-y-6">
                  {/* 审批流程进度 */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      审批流程进度
                    </h4>
                    <div className="space-y-3">
                      {selectedRequest.approvalHistory.map((item, index) => {
                        const isLast = index === selectedRequest.approvalHistory.length - 1;
                        return (
                          <div key={item.id} className="flex gap-3">
                            <div className="flex flex-col items-center">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                item.action === 'approved' || item.action === 'submitted' ? 'bg-green-500' :
                                item.action === 'rejected' ? 'bg-red-500' : 'bg-gray-400'
                              }`}>
                                {item.action === 'approved' || item.action === 'submitted' ? (
                                  <CheckCircle className="w-4 h-4 text-white" />
                                ) : item.action === 'rejected' ? (
                                  <XCircle className="w-4 h-4 text-white" />
                                ) : (
                                  <Send className="w-4 h-4 text-white" />
                                )}
                              </div>
                              {!isLast && <div className="w-0.5 h-8 bg-gray-300 my-1" />}
                            </div>
                            <div className="flex-1 pb-4">
                              <p className="text-sm font-medium text-gray-900">{item.approverName}</p>
                              <p className="text-xs text-gray-500">{item.approverRole}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(item.timestamp).toLocaleString('zh-CN')}
                              </p>
                              {item.comment && (
                                <p className="text-xs text-gray-700 mt-2 bg-gray-50 rounded px-2 py-1">
                                  {item.comment}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      
                      {/* 当前审批节点 */}
                      {(selectedRequest.status === 'pending' || selectedRequest.status === 'forwarded') && (
                        <div className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center animate-pulse">
                              <Clock className="w-4 h-4 text-white" />
                            </div>
                            {selectedRequest.requiresDirectorApproval && (
                              <div className="w-0.5 h-8 bg-gray-300 my-1" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-blue-600">
                              {selectedRequest.currentApproverRole === 'Regional_Manager'
                                ? '区域主管审批'
                                : selectedRequest.currentApproverRole === 'Sales_Director'
                                  ? '销售总监审批'
                                  : selectedRequest.currentApproverRole === 'CEO' || selectedRequest.currentApproverRole === 'Boss'
                                    ? '老板审批'
                                    : '待审批'}
                            </p>
                            <p className="text-xs text-gray-500">等待审批中...</p>
                          </div>
                        </div>
                      )}
                      
                      {/* 下一审批节点（如果需要总监审批） */}
                      {selectedRequest.status === 'pending' && selectedRequest.requiresDirectorApproval && (
                        <div className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center">
                              <Clock className="w-4 h-4 text-white" />
                            </div>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-400">销售总监审批</p>
                            <p className="text-xs text-gray-400">(金额≥$20,000，需复审)</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 金额提醒 */}
                  {selectedRequest.requiresDirectorApproval && selectedRequest.status === 'pending' && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-orange-900">重要提醒</p>
                          <p className="text-xs text-orange-800 mt-1">
                            此报价金额 ≥ $20,000，您批准后将自动提交给销售总监进行二次审批。
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* 🔥 总监审批提醒 */}
                  {selectedRequest.requiresDirectorApproval && selectedRequest.status === 'forwarded' && selectedRequest.currentApproverRole === 'Sales_Director' && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-orange-900">销售总监复审</p>
                          <p className="text-xs text-orange-800 mt-1">
                            此报价金额 ≥ $20,000，已由区域主管批准，现需您进行最终审批。
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 审批意见输入 */}
                  {/* 🔥 修复：添加 forwarded 状态的支持 */}
                  {(selectedRequest.status === 'pending' || selectedRequest.status === 'forwarded') && canCurrentUserApproveRequest(selectedRequest) && (
                    <>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                          <MessageSquare className="w-4 h-4" />
                          审批意
                        </h4>
                        <Textarea
                          placeholder="请输入审批意见（选填，驳回时必填）..."
                          value={approvalComment}
                          onChange={(e) => setApprovalComment(e.target.value)}
                          className="min-h-[100px] text-sm"
                        />
                      </div>

                      {/* 快捷意见 */}
                      <div>
                        <p className="text-xs text-gray-600 mb-2">快捷意见：</p>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={() => setApprovalComment('价格合理，建议批准')}
                          >
                            价格合理
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={() => setApprovalComment('利润率可接受，同意')}
                          >
                            利润率OK
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={() => setApprovalComment('客户信誉良好，批准')}
                          >
                            客户信誉好
                          </Button>
                        </div>
                      </div>

                      {/* 操作按钮 */}
                      <div className="flex gap-3 pt-4 border-t border-gray-200">
                        <Button
                          type="button"
                          className="flex-1 bg-green-600 hover:bg-green-700"
                          onClick={handleApprove}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          批准
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                          onClick={handleReject}
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          驳回
                        </Button>
                      </div>
                    </>
                  )}
                  
                  {/* 已审批状态显示 */}
                  {selectedRequest.status !== 'pending' && (
                    <div className={`rounded-lg p-4 ${
                      selectedRequest.status === 'approved' || selectedRequest.status === 'forwarded' 
                        ? 'bg-green-50 border border-green-200' 
                        : 'bg-red-50 border border-red-200'
                    }`}>
                      <p className="text-sm font-medium mb-2">
                        {selectedRequest.status === 'approved' ? '✅ 已批准' : 
                         selectedRequest.status === 'forwarded' ? '📨 已转交' : '❌ 已驳回'}
                      </p>
                      <p className="text-xs text-gray-600">
                        此审批已完成，无需再次操作。
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
