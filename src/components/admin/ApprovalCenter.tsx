import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
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
import { SalesContractDocument, SalesContractData } from '../documents/templates/SalesContractDocument'; // 🔥 导入销售合同文档
import { PurchaseOrderDocument } from '../documents/templates/PurchaseOrderDocument';
import { useSalesContracts } from '../../contexts/SalesContractContext'; // 🔥 导入销售合同Context
import { salesQuotationService, contractService, approvalRecordService } from '../../lib/supabaseService';
import { addTombstones, filterNotDeleted } from '../../lib/erp-core/deletion-tombstone';
import { emitErpEvent } from '../../lib/erp-core/event-bus';
import { ERP_EVENT_KEYS } from '../../lib/erp-core/events';
import { usePurchaseOrders } from '../../contexts/PurchaseOrderContext';
import { convertToPOData } from './purchase-order/purchaseOrderUtils';
import { getFormalBusinessModelNo } from '../../utils/productModelDisplay';
import { useAuth } from '../../hooks/useAuth';
import type { User as RbacUser } from '../../lib/rbac-config';
import {
  formatApprovalDecisionComment,
  parseApprovalDecisionComment,
  parseApprovalNoteSections,
  type ApprovalDecisionMode,
} from '../../utils/approvalWorkflow';

type TabType = 'pending' | 'approved' | 'rejected' | 'submitted';

const normalizeRegionCode = (region: string): 'NA' | 'SA' | 'EA' => {
  const value = String(region || '').trim();
  const regionMap: Record<string, 'NA' | 'SA' | 'EA'> = {
    NA: 'NA',
    'North America': 'NA',
    SA: 'SA',
    'South America': 'SA',
    EA: 'EA',
    EMEA: 'EA',
    'Europe & Africa': 'EA',
    Other: 'NA',
  };
  return regionMap[value] || 'NA';
};

const REGIONAL_MANAGER_BY_REGION: Record<'NA' | 'SA' | 'EA', string> = {
  NA: 'salesmanager-na@cosunchina.com',
  SA: 'salesmanager-sa@cosunchina.com',
  EA: 'salesmanager-ea@cosunchina.com',
};

// 仅用审批请求自身 id 做可见性标记，避免误伤同单号后续新审批。
const getApprovalMarkers = (req: Partial<ApprovalRequest>): string[] =>
  [req.id].filter(Boolean).map((v) => String(v));

const filterVisibleApprovals = (list: ApprovalRequest[]): ApprovalRequest[] =>
  filterNotDeleted('document', list, (req) => getApprovalMarkers(req));

const SYSTEM_OWNER_EMAILS = new Set(['admin@cosun.com', 'admin@cosunchina.com']);

const isSystemOwnerEmail = (email: unknown) => SYSTEM_OWNER_EMAILS.has(String(email || '').trim().toLowerCase());

const resolveRequestSalesOwner = (request: ApprovalRequest) => {
  const doc = (request as any)?.relatedDocument || {};
  const candidates = [
    { name: doc?.salesPersonName, email: doc?.salesPerson || doc?.salesPersonEmail },
    { name: request.submittedByName, email: request.submittedBy },
    { name: doc?.createdByName, email: doc?.createdBy },
  ].map((item) => ({
    name: String(item?.name || '').trim(),
    email: String(item?.email || '').trim().toLowerCase(),
  }));

  const best = candidates.find((item) => item.email && !isSystemOwnerEmail(item.email)) || candidates.find((item) => item.email) || { name: '', email: '' };
  return {
    name: best.name || best.email || '未识别业务员',
    email: best.email || '',
  };
};

const resolveSalesApprovalNote = (request: ApprovalRequest) => {
  const doc = (request as any)?.relatedDocument || {};
  const candidates = [
    doc?.approvalNotes,
    doc?.approval_notes,
    doc?.reviewNote,
    doc?.review_note,
    doc?.internalApprovalNote,
    doc?.internalApprovalNotes,
    doc?.notes,
  ];
  return candidates.map((value) => String(value || '').trim()).find(Boolean) || '';
};

const resolveApprovalRouteLabel = (request: ApprovalRequest) =>
  Number(request.amount || 0) >= 20000 ? '主管审批 -> 销售总监终审' : '主管审批后即可放行';

const resolveCurrentApprovalNodeLabel = (request: ApprovalRequest) => {
  if (request.status === 'approved') return '已批准';
  if (request.status === 'rejected') return '已驳回';
  if (String(request.currentApproverRole || '') === 'Sales_Director') return '销售总监复审';
  if (['区域业务主管', 'Regional_Manager'].includes(String(request.currentApproverRole || ''))) return '主管审批';
  return '待审批';
};

const resolveLatestDecisionComment = (request: ApprovalRequest, roleMatch: string[]) =>
  [...(request.approvalHistory || [])]
    .reverse()
    .find((item) => roleMatch.includes(String(item.approverRole || '')) && ['approved', 'rejected', 'forwarded'].includes(String(item.action || '')));

const resolveApprovalSubmittedAt = (request: ApprovalRequest) => {
  const source = request.submittedAt || (request as any)?.relatedDocument?.createdAt || '';
  const date = new Date(source);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('zh-CN');
};

const resolveApprovalDecisionSignals = (request: ApprovalRequest) => {
  const amount = Number(request.amount || 0);
  const margin = Number((request as any)?.relatedDocument?.profitRate ?? 0);
  const hasSalesNote = Boolean(resolveSalesApprovalNote(request));
  const needsDirectorReview = amount >= 20000;
  const isLowMargin = Number.isFinite(margin) && margin < 15;
  const hasCustomerRemark = Boolean(String((request as any)?.relatedDocument?.remarks || (request as any)?.relatedDocument?.customerNotes || '').trim());

  const riskFlags = [
    isLowMargin ? '利润率偏低，需要明确让利原因与补救方案。' : '利润率处于可接受区间，可重点核验例外条款。',
    hasSalesNote ? '业务员已提交内部说明。' : '业务员未填写完整提审依据，建议补充后再最终放行。',
    hasCustomerRemark ? '存在对客备注或特殊条款，请确认其承诺边界。' : '当前无额外对客备注，条款相对标准。',
    needsDirectorReview ? '金额达到总监复审阈值，主管意见将直接影响总监判断。' : '金额未达总监阈值，主管可直接作出放行判断。',
  ];

  let recommendation = '建议先核验业务说明与利润底线，再决定是否直接放行。';
  if (needsDirectorReview && hasSalesNote) {
    recommendation = '建议主管先给出明确结论与条件，再转销售总监复审。';
  } else if (!needsDirectorReview && !isLowMargin && hasSalesNote) {
    recommendation = '建议主管重点确认付款、交期与条款后，可直接放行。';
  } else if (isLowMargin) {
    recommendation = '建议先补充利润让渡原因、客户价值和风险补救措施，再决定放行。';
  }

  return {
    amount,
    margin,
    hasSalesNote,
    needsDirectorReview,
    isLowMargin,
    hasCustomerRemark,
    riskFlags,
    recommendation,
  };
};

const buildApprovalHistoryId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `approval-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
};

interface ApprovalCenterProps {
  currentUser?: RbacUser | null;
}

export function ApprovalCenter({ currentUser: dashboardCurrentUser = null }: ApprovalCenterProps) {
  const { currentUser: authCurrentUser } = useAuth();
  // ─── 当前用户信息：放在 React state，角色切换后能触发重渲染 ───
  const [currentUser, setCurrentUser] = useState(() => dashboardCurrentUser || getCurrentUser());
  const effectiveCurrentUser = dashboardCurrentUser || authCurrentUser || currentUser;
  const currentUserEmail = String(effectiveCurrentUser?.email || '').trim().toLowerCase();
  const currentUserName = effectiveCurrentUser?.name || currentUserEmail || '';
  const currentUserRole = String(effectiveCurrentUser?.role || (currentUser as any)?.userRole || '').trim();
  const currentUserRegionCode = normalizeRegionCode(String(effectiveCurrentUser?.region || 'NA'));

  // ─── 直接从 Supabase 查询的审批记录（不依赖共享 Context 的缓存状态）───
  const [directRecords, setDirectRecords] = useState<ApprovalRequest[]>([]);
  const [directLoading, setDirectLoading] = useState(false);

  const { approveRequest, rejectRequest } = useApproval();

  // 监听角色切换（同 Tab），更新当前用户 state
  useEffect(() => {
    const onUserChanged = () => {
      const updated = dashboardCurrentUser || authCurrentUser || getCurrentUser();
      setCurrentUser(updated ?? null);
    };
    onUserChanged();
    window.addEventListener('userChanged', onUserChanged);
    return () => window.removeEventListener('userChanged', onUserChanged);
  }, [authCurrentUser, dashboardCurrentUser]);

  useSalesContracts(); // 保持合同上下文订阅，审批结果由各业务上下文自行回流
  const { purchaseOrders, updatePurchaseOrder } = usePurchaseOrders();

  const isBossRole = useMemo(
    () => ['CEO', 'Boss'].includes(String(currentUserRole || '')),
    [currentUserRole]
  );

  const isDirectorAccount = useMemo(
    () => (
      String(currentUserRole || '') === 'Sales_Director' ||
      currentUserEmail === 'sales.director@cosun.com' ||
      currentUserEmail === 'sales.director@cosunchina.com'
    ),
    [currentUserEmail, currentUserRole]
  );

  const isRegionalManagerAccount = useMemo(() => {
    const regionalManagerEmails = Object.values(REGIONAL_MANAGER_BY_REGION);
    return String(currentUserRole || '') === 'Regional_Manager' || regionalManagerEmails.includes(currentUserEmail);
  }, [currentUserEmail, currentUserRole]);

  const canApproveRequest = useMemo(() => {
    return (req: ApprovalRequest) => {
      const approverEmail = String(req.currentApprover || '').trim().toLowerCase();
      const approverRole = String(req.currentApproverRole || '').trim();
      const reqRegionCode = normalizeRegionCode(String(req.region || 'NA'));

      if (approverEmail && approverEmail === currentUserEmail) return true;
      if (isBossRole && ['CEO', 'Boss'].includes(approverRole)) return true;
      if (isDirectorAccount && approverRole === 'Sales_Director') return true;
      if (
        isRegionalManagerAccount &&
        ['区域业务主管', 'Regional_Manager'].includes(approverRole) &&
        reqRegionCode === currentUserRegionCode
      ) {
        return true;
      }

      return false;
    };
  }, [currentUserEmail, currentUserRegionCode, isBossRole, isDirectorAccount, isRegionalManagerAccount]);

  // 当前用户邮箱变化时直接查 Supabase，完全绕过共享 Context 缓存
  useEffect(() => {
    if (!currentUserEmail) { setDirectRecords([]); return; }
    setDirectLoading(true);
    const loadApprovals = async () => {
      const canReadBroadApprovalPool = isBossRole || isDirectorAccount || isRegionalManagerAccount;
      return canReadBroadApprovalPool
        ? approvalRecordService.getAll()
        : approvalRecordService.getForApprover(currentUserEmail);
    };
    loadApprovals()
      .then(data => { setDirectRecords((data || []) as ApprovalRequest[]); })
      .catch(err => { console.error('[ApprovalCenter] direct query failed:', err?.message); })
      .finally(() => setDirectLoading(false));
  }, [currentUserEmail, isBossRole, isDirectorAccount, isRegionalManagerAccount]);

  const localApprovalView = useMemo(() => {
    const asList = Array.isArray(directRecords) ? directRecords : [];
    const pending = asList.filter((req) => ['pending', 'forwarded', 'pending_approval'].includes(String(req.status || '')) && canApproveRequest(req));
    const approved = asList.filter((req) =>
      String(req.status || '') === 'approved' &&
      req.approvalHistory?.some((h) =>
        String(h.approver || '').trim().toLowerCase() === currentUserEmail ||
        (isBossRole && ['CEO', 'Boss'].includes(String(h.approverRole || ''))) ||
        (isDirectorAccount && String(h.approverRole || '') === 'Sales_Director') ||
        (
          isRegionalManagerAccount &&
          ['区域业务主管', 'Regional_Manager'].includes(String(h.approverRole || '')) &&
          normalizeRegionCode(String(req.region || 'NA')) === currentUserRegionCode
        )
      )
    );
    const rejected = asList.filter((req) =>
      String(req.status || '') === 'rejected' &&
      req.approvalHistory?.some((h) =>
        String(h.approver || '').trim().toLowerCase() === currentUserEmail ||
        (isBossRole && ['CEO', 'Boss'].includes(String(h.approverRole || ''))) ||
        (isDirectorAccount && String(h.approverRole || '') === 'Sales_Director') ||
        (
          isRegionalManagerAccount &&
          ['区域业务主管', 'Regional_Manager'].includes(String(h.approverRole || '')) &&
          normalizeRegionCode(String(req.region || 'NA')) === currentUserRegionCode
        )
      )
    );
    const submitted = asList.filter((req) => String(req.submittedBy || '').trim().toLowerCase() === currentUserEmail);

    return { pending, approved, rejected, submitted };
  }, [canApproveRequest, currentUserEmail, currentUserRegionCode, directRecords, isBossRole, isDirectorAccount, isRegionalManagerAccount]);

  const [pendingApprovals, setPendingApprovals] = useState<ApprovalRequest[]>([]);
  const [approvedApprovals, setApprovedApprovals] = useState<ApprovalRequest[]>([]);
  const [rejectedApprovals, setRejectedApprovals] = useState<ApprovalRequest[]>([]);
  const [submittedApprovals, setSubmittedApprovals] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!currentUserEmail) return;
    setLoading(true);
    try {
      const nextPending = filterVisibleApprovals(localApprovalView.pending || []);
      const nextApproved = filterVisibleApprovals(localApprovalView.approved || []);
      const nextRejected = filterVisibleApprovals(localApprovalView.rejected || []);
      const nextSubmitted = filterVisibleApprovals(localApprovalView.submitted || []);
      setPendingApprovals(nextPending);
      setApprovedApprovals(nextApproved);
      setRejectedApprovals(nextRejected);
      setSubmittedApprovals(nextSubmitted);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('approvalPendingCountChanged', {
          detail: { count: nextPending.length },
        }));
      }
    } finally {
      setLoading(false);
    }
  }, [currentUserEmail, localApprovalView]);

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
  const [approvalDecisionMode, setApprovalDecisionMode] = useState<ApprovalDecisionMode>('release');
  const [approvalConditionText, setApprovalConditionText] = useState('');
  const [detailViewTab, setDetailViewTab] = useState<'task' | 'quote'>('task');
  const [detailDialogRenderKey, setDetailDialogRenderKey] = useState(0);
  const dialogShellRef = React.useRef<HTMLDivElement | null>(null);
  const previewPanelRef = React.useRef<HTMLDivElement | null>(null);
  const approvalPanelRef = React.useRef<HTMLDivElement | null>(null);
  const selectedApprovalHistory = Array.isArray(selectedRequest?.approvalHistory) ? selectedRequest.approvalHistory : [];
  const canShowApprovalActions = Boolean(
    selectedRequest &&
    (selectedRequest.status === 'pending' || selectedRequest.status === 'forwarded') &&
    canApproveRequest(selectedRequest)
  );
  const selectedOwner = selectedRequest ? resolveRequestSalesOwner(selectedRequest) : { name: '', email: '' };
  const selectedSalesApprovalNote = selectedRequest ? resolveSalesApprovalNote(selectedRequest) : '';
  const selectedDecisionSignals = selectedRequest ? resolveApprovalDecisionSignals(selectedRequest) : null;
  const isDirectorReviewActive = Boolean(
    selectedRequest &&
    (String(selectedRequest.currentApproverRole || '') === 'Sales_Director' || selectedRequest.status === 'forwarded')
  );
  const needsDirectorReviewActive = Boolean(
    selectedRequest && Number(selectedRequest.amount || 0) >= 20000
  );

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
      // 'pending' is not a valid SC status; map submit → pending_supervisor, others ignored
      const newStatus = isApprove ? 'approved' : isReject ? 'rejected' : isSubmit ? 'pending_supervisor' : null;
      if (newStatus) await contractService.updateStatus(docKey, newStatus);
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
    const directorEmail = 'sales.director@cosunchina.com';

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

  const emitQuotationRefreshEvent = (req: ApprovalRequest, status: 'approved' | 'rejected') => {
    try {
      emitErpEvent({
        id: `evt-quotation-status-${Date.now()}`,
        key: status === 'approved' ? ERP_EVENT_KEYS.QUOTATION_ACCEPTED : ERP_EVENT_KEYS.QUOTATION_SENT,
        domain: 'qt',
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

      setPendingApprovals((prev) => patchList(prev as any) as any);
      setApprovedApprovals((prev) => patchList(prev as any) as any);
      setRejectedApprovals((prev) => patchList(prev as any) as any);
      setSubmittedApprovals((prev) => patchList(prev as any) as any);
    } catch (e) {
      console.warn('⚠️ syncSalesQuotationStatusByApproval failed:', e);
    }
  };

  const syncLocalApprovalRecord = (updatedRequest: ApprovalRequest) => {
    setDirectRecords((prev) =>
      (Array.isArray(prev) ? prev : []).map((record) =>
        record.id === updatedRequest.id ? updatedRequest : record
      )
    );
  };

  const buildUpdatedApprovalRequest = (
    req: ApprovalRequest,
    action: 'approved' | 'rejected',
    comment: string,
  ): ApprovalRequest => {
    const historyItem = {
      id: buildApprovalHistoryId(),
      approver: currentUserEmail,
      approverName: currentUserName,
      approverRole: currentUserRole || '',
      action,
      comment,
      timestamp: new Date().toISOString(),
    };

    if (action === 'rejected') {
      return {
        ...req,
        status: 'rejected',
        currentApprover: '',
        currentApproverRole: '',
        nextApprover: null,
        nextApproverRole: null,
        approvalHistory: [...(req.approvalHistory || []), historyItem],
      };
    }

    if (req.requiresDirectorApproval && currentUserRole !== 'Sales_Director') {
      return {
        ...req,
        status: 'forwarded',
        currentApprover: req.nextApprover || 'sales.director@cosunchina.com',
        currentApproverRole: req.nextApproverRole || 'Sales_Director',
        approvalHistory: [...(req.approvalHistory || []), historyItem],
      };
    }

    return {
      ...req,
      status: 'approved',
      currentApprover: '',
      currentApproverRole: '',
      nextApprover: null,
      nextApproverRole: null,
      requiresDirectorApproval: false,
      approvalHistory: [...(req.approvalHistory || []), historyItem],
    };
  };

  // ✅ 批准审批
  const handleApprove = async () => {
    if (!selectedRequest) return;

    if (approvalDecisionMode === 'conditional_release' && !approvalConditionText.trim()) {
      toast.error('请选择附条件放行时，请填写明确的放行条件');
      return;
    }

    const comment = formatApprovalDecisionComment(
      approvalDecisionMode,
      approvalComment.trim() || '批准通过',
      approvalConditionText,
    );
    if ((selectedRequest.requiresDirectorApproval && currentUserRole !== 'Sales_Director') || approvalDecisionMode === 'escalate') {
      if (!approvalComment.trim()) {
        toast.error('请填写主管审批意见后再提交给销售总监');
        return;
      }
    }
    if (selectedRequest.requiresDirectorApproval && currentUserRole !== 'Sales_Director' && !approvalComment.trim()) {
      toast.error('请填写主管审批意见后再提交给销售总监');
      return;
    }
    
    console.log('🔍 [ApprovalCenter] handleApprove 调用:');
    console.log('  - selectedRequest.id:', selectedRequest.id);
    console.log('  - selectedRequest.relatedDocumentId:', selectedRequest.relatedDocumentId);
    console.log('  - selectedRequest.status:', selectedRequest.status);
    console.log('  - selectedRequest.requiresDirectorApproval:', selectedRequest.requiresDirectorApproval);
    console.log('  - currentUserRole:', currentUserRole);
    console.log('  - 判断条件: requiresDirectorApproval && currentUserRole !== "Sales_Director"');
    console.log('  - 判断结果:', selectedRequest.requiresDirectorApproval && currentUserRole !== 'Sales_Director');
    
    try {
      const updatedApprovalRequest = buildUpdatedApprovalRequest(selectedRequest, 'approved', comment);

      if (selectedRequest.relatedDocumentType === '采购请求审批' || String(selectedRequest.relatedDocumentId || '').startsWith('PRQ-')) {
        await approveRequest(selectedRequest.id, currentUserEmail, currentUserName, currentUserRole || 'CEO', comment);
      } else if (selectedRequest.type === 'sales_contract') {
        const contractKey = resolveApprovalDocKey(selectedRequest);
        await patchWithMethodOverrideFallback(
          `/api/sales-contracts/${encodeURIComponent(contractKey)}/approve`,
          { comment, approverName: currentUserName, approverEmail: currentUserEmail },
        );
        await approvalRecordService.upsert(updatedApprovalRequest);
        syncLocalApprovalRecord(updatedApprovalRequest);
      } else {
        const quotationKey = resolveApprovalDocKey(selectedRequest);
        await patchWithMethodOverrideFallback(
          `/api/sales-quotations/${encodeURIComponent(quotationKey)}/approve`,
          { comment, approverName: currentUserName },
        );
        await approvalRecordService.upsert(updatedApprovalRequest);
        syncLocalApprovalRecord(updatedApprovalRequest);
      }
      toast.success('✅ 已批准');
      syncSalesQuotationStatusByApproval(selectedRequest, 'approved');
      emitQuotationRefreshEvent(selectedRequest, 'approved');
    } catch (e: any) {
      const msg = String(e?.message || '');

      if (msg.includes('No pending approval step')) {
        try {
          await rebuildApprovalChainAndRetry(selectedRequest, 'approve', comment);
          const repairedApprovalRequest = buildUpdatedApprovalRequest(selectedRequest, 'approved', comment);
          await approvalRecordService.upsert(repairedApprovalRequest);
          syncLocalApprovalRecord(repairedApprovalRequest);
          toast.success('✅ 已批准（已自动修复审批链）');
          syncSalesQuotationStatusByApproval(selectedRequest, 'approved');
          emitQuotationRefreshEvent(selectedRequest, 'approved');
          setShowDetailDialog(false);
          setSelectedRequest(null);
          setApprovalComment('');
          return;
        } catch (repairErr: any) {
          console.error('❌ [ApprovalCenter] auto-repair approve failed:', repairErr);
          toast.error(`批准失败: ${repairErr?.message || '审批链修复失败'}`);
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
    setApprovalConditionText('');
  };

  // ❌ 驳回审批
  const handleReject = async () => {
    if (!selectedRequest) return;

    if (!approvalComment.trim()) {
      toast.error('请输入驳回原因');
      return;
    }
    const comment = formatApprovalDecisionComment('return_for_update', approvalComment.trim(), '');
    
    try {
      const updatedApprovalRequest = buildUpdatedApprovalRequest(selectedRequest, 'rejected', comment);

      if (selectedRequest.relatedDocumentType === '采购请求审批' || String(selectedRequest.relatedDocumentId || '').startsWith('PRQ-')) {
        await rejectRequest(selectedRequest.id, currentUserEmail, currentUserName, currentUserRole || 'CEO', comment);
      } else if (selectedRequest.type === 'sales_contract') {
        const contractKey = resolveApprovalDocKey(selectedRequest);
        await patchWithMethodOverrideFallback(
          `/api/sales-contracts/${encodeURIComponent(contractKey)}/reject`,
          { comment, approverName: currentUserName, approverEmail: currentUserEmail },
        );
        await approvalRecordService.upsert(updatedApprovalRequest);
        syncLocalApprovalRecord(updatedApprovalRequest);
      } else {
        const quotationKey = resolveApprovalDocKey(selectedRequest);
        await patchWithMethodOverrideFallback(
          `/api/sales-quotations/${encodeURIComponent(quotationKey)}/reject`,
          { comment, approverName: currentUserName },
        );
        await approvalRecordService.upsert(updatedApprovalRequest);
        syncLocalApprovalRecord(updatedApprovalRequest);
      }
      toast.error(selectedRequest.type === 'sales_contract'
        ? '❌ 已驳回！合同已退回给业务员修改。'
        : '❌ 已驳回！报价单已退回给业务员修改。'
      );
      syncSalesQuotationStatusByApproval(selectedRequest, 'rejected');
      emitQuotationRefreshEvent(selectedRequest, 'rejected');
    } catch (e: any) {
      const msg = String(e?.message || '');

      if (msg.includes('No pending approval step')) {
        try {
          await rebuildApprovalChainAndRetry(selectedRequest, 'reject', comment);
          const repairedApprovalRequest = buildUpdatedApprovalRequest(selectedRequest, 'rejected', comment);
          await approvalRecordService.upsert(repairedApprovalRequest);
          syncLocalApprovalRecord(repairedApprovalRequest);
          toast.error('❌ 已驳回（已自动修复审批链）');
          syncSalesQuotationStatusByApproval(selectedRequest, 'rejected');
          emitQuotationRefreshEvent(selectedRequest, 'rejected');
          setShowDetailDialog(false);
          setSelectedRequest(null);
          setApprovalComment('');
          return;
        } catch (repairErr: any) {
          console.error('❌ [ApprovalCenter] auto-repair reject failed:', repairErr);
          toast.error(`驳回失败: ${repairErr?.message || '审批链修复失败'}`);
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
    setApprovalConditionText('');
  };

  // 📄 查看详情
  const handleViewDetail = (request: ApprovalRequest) => {
    setDetailDialogRenderKey((prev) => prev + 1);
    setSelectedRequest(request);
    setShowDetailDialog(true);
    setDetailViewTab('task');
    setApprovalComment('');
    setApprovalConditionText('');
    setApprovalDecisionMode(
      request.requiresDirectorApproval && String(currentUserRole || '') !== 'Sales_Director'
        ? 'escalate'
        : 'release'
    );
  };

  React.useLayoutEffect(() => {
    if (!showDetailDialog || !selectedRequest) return;
    const resetScrollPosition = () => {
      if (dialogShellRef.current) dialogShellRef.current.scrollTop = 0;
      if (previewPanelRef.current) previewPanelRef.current.scrollTop = 0;
      if (approvalPanelRef.current) approvalPanelRef.current.scrollTop = 0;
    };

    resetScrollPosition();
    const frameOne = requestAnimationFrame(() => {
      resetScrollPosition();
      requestAnimationFrame(() => {
        resetScrollPosition();
      });
    });
    const delayedReset = window.setTimeout(() => {
      resetScrollPosition();
    }, 120);

    return () => {
      cancelAnimationFrame(frameOne);
      window.clearTimeout(delayedReset);
    };
  }, [detailDialogRenderKey, detailViewTab, showDetailDialog, selectedRequest?.id]);

  const handleDetailDialogOpenChange = (open: boolean) => {
    setShowDetailDialog(open);
    if (!open) {
      setSelectedRequest(null);
      setDetailViewTab('task');
      setApprovalComment('');
      setApprovalConditionText('');
    }
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

  const handleBatchDelete = async () => {
    if (selectedCount === 0) {
      toast.error('请先勾选要删除的记录');
      return;
    }

    if (!window.confirm(`确认删除选中的 ${selectedCount} 条记录？`)) return;

    const idSet = new Set(selectedRequestIds);
    const allRows = [...pendingApprovals, ...approvedApprovals, ...rejectedApprovals, ...submittedApprovals];
    const selectedRows = allRows.filter((req) => idSet.has(String(req.id)));

    // 删除采购审批单时，回滚采购单到“可申请审核”状态
    try {
      await Promise.all(selectedRows
      .filter((req) => req.relatedDocumentType === '采购请求审批' || String(req.relatedDocumentId || '').startsWith('PRQ-'))
      .flatMap((req) => {
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

        return purchaseOrders
          .filter((po) => {
          const poNo = String(po.poNumber || '').trim().toUpperCase();
          const parentNo = String(po.parentRequestPoNumber || '').trim().toUpperCase();
          const matched = poNos.has(poNo) || (parentNo && poNos.has(parentNo));
          return matched;
        })
          .map((po) => {
          const currentReqStatus = String(po.procurementRequestStatus || '');
          if (currentReqStatus === 'pushed_supplier') return Promise.resolve();
          return updatePurchaseOrder(po.id, {
            procurementRequestStatus: 'draft_allocated',
            updatedDate: new Date().toISOString(),
          } as any);
        });
      }));
    } catch (error: any) {
      toast.error(`回滚采购请求状态失败：${error?.message || '未知错误'}`);
      return;
    }

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
                            const owner = resolveRequestSalesOwner(request);
                            return (
                              <>
                                <p className="font-medium text-gray-900">{owner.name}</p>
                                <p className="text-gray-500 text-xs">{owner.email || '-'}</p>
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

      {/* 🔍 审批任务工作台 */}
      {selectedRequest && (
        <Dialog open={showDetailDialog} onOpenChange={handleDetailDialogOpenChange}>
          <DialogContent
            key={`${selectedRequest.id}-${detailDialogRenderKey}`}
            ref={dialogShellRef}
            onOpenAutoFocus={(event) => event.preventDefault()}
            unstyled
            className="fixed z-[60] grid grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 p-0 shadow-2xl"
            style={{
              top: '20px',
              left: '20px',
              right: '20px',
              margin: '0 auto',
              width: 'min(1180px, calc(100vw - 40px))',
              maxWidth: 'calc(100vw - 40px)',
              height: 'min(760px, calc(100dvh - 40px))',
              maxHeight: 'calc(100dvh - 40px)',
            }}
          >
            {(() => {
              const owner = resolveRequestSalesOwner(selectedRequest);
              const currentNodeLabel = resolveCurrentApprovalNodeLabel(selectedRequest);
              const isDirectorStep = String(selectedRequest.currentApproverRole || '') === 'Sales_Director' || selectedRequest.status === 'forwarded';
              return (
            <DialogHeader className="px-5 py-3 border-b border-gray-200 bg-white">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <DialogTitle className="text-base">
                    审批任务工作台 - {selectedRequest.relatedDocumentId}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-gray-600">
                    {selectedRequest.relatedDocumentType} · 业务员：{owner.name} · 先完成内部审批判断，再查看 QT 附件
                  </DialogDescription>
                </div>
                <div className="flex flex-wrap items-center justify-end gap-2">
                  {selectedRequest.type === 'qt' && (
                    <>
                      <Button
                        type="button"
                        variant={detailViewTab === 'task' ? 'default' : 'outline'}
                        className="h-8 px-3 text-xs"
                        onClick={() => setDetailViewTab('task')}
                      >
                        审批任务
                      </Button>
                      <Button
                        type="button"
                        variant={detailViewTab === 'quote' ? 'default' : 'outline'}
                        className="h-8 px-3 text-xs"
                        onClick={() => setDetailViewTab('quote')}
                      >
                        查看提交 QT
                      </Button>
                    </>
                  )}
                  <Badge variant="outline" className="h-6 px-2 text-xs">{currentNodeLabel}</Badge>
                  {Number(selectedRequest.amount || 0) >= 20000 && (
                    <Badge className="h-6 px-2 text-xs bg-orange-100 text-orange-800 border border-orange-200">
                      双级审批
                    </Badge>
                  )}
                  {isDirectorStep && (
                    <Badge className="h-6 px-2 text-xs bg-blue-100 text-blue-800 border border-blue-200">
                      总监视角
                    </Badge>
                  )}
                </div>
              </div>
            </DialogHeader>
              );
            })()}
            
            <div className="grid min-h-0 h-full grid-cols-[minmax(0,1fr)_300px] gap-0">
              {/* 左侧：审批任务主区 */}
              <div
                key={`approval-preview-${selectedRequest.id}-${detailDialogRenderKey}-${detailViewTab}`}
                ref={previewPanelRef}
                className="min-h-0 overflow-y-auto overscroll-contain border-r border-gray-200 bg-slate-100"
              >
                <div className="p-4">
                  {(() => {
                    const owner = resolveRequestSalesOwner(selectedRequest);
                    const currentNodeLabel = resolveCurrentApprovalNodeLabel(selectedRequest);
                    return (
                      <div className="mb-4 grid grid-cols-5 gap-2 rounded-xl border border-slate-200 bg-white p-2 text-slate-900 shadow-sm">
                        <div className="rounded-lg bg-slate-50 px-3 py-2">
                          <p className="text-[10px] uppercase tracking-wide text-slate-500">客户</p>
                          <p className="truncate text-xs font-semibold">{selectedRequest.customerName || '-'}</p>
                        </div>
                        <div className="rounded-lg bg-slate-50 px-3 py-2">
                          <p className="text-[10px] uppercase tracking-wide text-slate-500">金额</p>
                          <p className="text-xs font-semibold">${Number(selectedRequest.amount || 0).toLocaleString()}</p>
                        </div>
                        <div className="rounded-lg bg-slate-50 px-3 py-2">
                          <p className="text-[10px] uppercase tracking-wide text-slate-500">流程</p>
                          <p className="text-xs font-semibold">{resolveApprovalRouteLabel(selectedRequest)}</p>
                        </div>
                        <div className="rounded-lg bg-slate-50 px-3 py-2">
                          <p className="text-[10px] uppercase tracking-wide text-slate-500">当前节点</p>
                          <p className="text-xs font-semibold">{currentNodeLabel}</p>
                        </div>
                        <div className="rounded-lg bg-slate-50 px-3 py-2">
                          <p className="text-[10px] uppercase tracking-wide text-slate-500">业务员</p>
                          <p className="truncate text-xs font-semibold">{owner.name}</p>
                        </div>
                      </div>
                    );
                  })()}
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
                            const parentNo = String(po.parentRequestPoNumber || '').trim().toUpperCase();
                            return poNo === requestMainNo || parentNo === requestMainNo || requestPoNos.includes(poNo);
                          });

                          if (!primaryPO) {
                            return (
                              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-sm text-gray-500">
                                未找到原始采购订单，无法渲染原版采购订单模板。
                              </div>
                            );
                          }

                          const templateSnapshot = (primaryPO as any).templateSnapshot || (primaryPO as any).template_snapshot || null;
                          const templateVersion = templateSnapshot?.version || null;
                          const poData = ((primaryPO as any).documentDataSnapshot || (primaryPO as any).document_data_snapshot) as any;
                          if (!templateVersion || !poData) {
                            return (
                              <div className="bg-red-50 rounded-lg shadow-sm border border-red-200 p-6 text-sm text-red-700">
                                该 CG 未绑定模板中心版本快照，无法渲染采购合同模板。
                              </div>
                            );
                          }
                          return (
                            <div className="bg-white rounded-lg shadow-sm">
                              <PurchaseOrderDocument data={poData} layoutConfig={templateVersion?.layout_json || undefined} />
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
                                modelNo: getFormalBusinessModelNo(item),
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
                      ) : selectedRequest.type === 'qt' ? (
                        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                          {(() => {
                            const owner = resolveRequestSalesOwner(selectedRequest);
                            const items = Array.isArray(selectedRequest.relatedDocument?.items) ? selectedRequest.relatedDocument.items : [];
                            const currency = selectedRequest.currency || 'USD';
                            const salesApprovalNote = resolveSalesApprovalNote(selectedRequest);
                            const noteSections = parseApprovalNoteSections(salesApprovalNote);
                            const decisionSignals = resolveApprovalDecisionSignals(selectedRequest);
                            const quotationDate = selectedRequest.relatedDocument?.createdAt
                              ? new Date(selectedRequest.relatedDocument.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                              : '-';
                            const validUntil = selectedRequest.relatedDocument?.validUntil
                              ? new Date(selectedRequest.relatedDocument.validUntil).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                              : '-';
                            const terms = [
                              { label: 'Trade Terms', value: selectedRequest.relatedDocument?.tradeTerms?.incoterms || 'FOB Xiamen' },
                              { label: 'Payment Terms', value: selectedRequest.relatedDocument?.tradeTerms?.paymentTerms || '30% T/T deposit, 70% before shipment' },
                              { label: 'Delivery Time', value: selectedRequest.relatedDocument?.tradeTerms?.deliveryTime || '25-30 days after deposit' },
                              { label: 'Port of Loading', value: selectedRequest.relatedDocument?.tradeTerms?.portOfLoading || 'Xiamen, China' },
                            ];

                            if (detailViewTab === 'quote') {
                              return (
                                <div className="space-y-3">
                                  <div className="flex items-start justify-between gap-4 rounded-lg border border-gray-200 bg-gray-50 p-3">
                                    <div>
                                      <p className="text-lg font-semibold text-gray-900">{selectedRequest.relatedDocument?.qtNumber || selectedRequest.relatedDocumentId}</p>
                                      <p className="mt-1 text-xs text-gray-500">这里查看业务员实际提交的 QT 摘要，供审批参考。</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
                                      <div>
                                        <p className="text-[11px] text-gray-500">Inq. No.</p>
                                        <p className="font-medium text-gray-900">{selectedRequest.relatedDocument?.inqNumber || selectedRequest.relatedDocument?.qrNumber || '-'}</p>
                                      </div>
                                      <div>
                                        <p className="text-[11px] text-gray-500">Date</p>
                                        <p className="font-medium text-gray-900">{quotationDate}</p>
                                      </div>
                                      <div>
                                        <p className="text-[11px] text-gray-500">Valid Until</p>
                                        <p className="font-medium text-gray-900">{validUntil}</p>
                                      </div>
                                      <div>
                                        <p className="text-[11px] text-gray-500">Currency</p>
                                        <p className="font-medium text-gray-900">{currency}</p>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 gap-3">
                                    <div className="rounded-lg border border-gray-200 p-3">
                                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">From</p>
                                      <p className="font-semibold text-gray-900">Fujian Gaoshengdafu Building Materials Co., Ltd.</p>
                                      <p className="mt-1 text-sm text-gray-600">Siming District, Xiamen, Fujian Province, China</p>
                                      <p className="mt-1 text-sm text-gray-600">info@cosun.com</p>
                                    </div>
                                    <div className="rounded-lg border border-gray-200 p-3">
                                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">To</p>
                                      <p className="font-semibold text-gray-900">{selectedRequest.relatedDocument?.customerCompany || selectedRequest.customerName || '-'}</p>
                                      <p className="mt-1 text-sm text-gray-600">Attn: {selectedRequest.relatedDocument?.customerName || selectedRequest.customerName || '-'}</p>
                                      <p className="mt-1 text-sm text-gray-600">{selectedRequest.relatedDocument?.customerEmail || selectedRequest.customerEmail || '-'}</p>
                                    </div>
                                  </div>

                                  <div className="rounded-lg border border-gray-200">
                                    <div className="border-b border-gray-200 bg-gray-50 px-3 py-2">
                                      <p className="text-sm font-semibold text-gray-900">QT清单</p>
                                    </div>
                                    <div className="overflow-x-auto">
                                      <table className="w-full border-collapse text-sm">
                                        <thead>
                                          <tr className="bg-white text-left text-xs text-gray-500">
                                            <th className="px-3 py-2 font-medium">Model</th>
                                            <th className="px-3 py-2 font-medium">Item</th>
                                            <th className="px-3 py-2 font-medium text-right">Qty</th>
                                            <th className="px-3 py-2 font-medium text-right">Unit Price</th>
                                            <th className="px-3 py-2 font-medium text-right">Amount</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {items.length > 0 ? items.map((item: any, index: number) => {
                                            const unitPrice = Number(item.salesPrice || item.unitPrice || 0);
                                            const quantity = Number(item.quantity || 0);
                                            const amount = unitPrice * quantity;
                                            return (
                                              <tr key={`${selectedRequest.id}-qt-item-${index}`} className="border-t border-gray-100 align-top">
                                                <td className="px-3 py-3 text-gray-700">{getFormalBusinessModelNo(item) || '-'}</td>
                                                <td className="px-3 py-3">
                                                  <p className="font-medium text-gray-900">{item.productName || '-'}</p>
                                                  <p className="mt-1 text-xs leading-5 text-gray-500">{item.specification || '-'}</p>
                                                </td>
                                                <td className="px-3 py-3 text-right text-gray-700">{quantity.toLocaleString()}</td>
                                                <td className="px-3 py-3 text-right text-gray-700">{currency} {unitPrice.toFixed(2)}</td>
                                                <td className="px-3 py-3 text-right font-semibold text-gray-900">{currency} {amount.toFixed(2)}</td>
                                              </tr>
                                            );
                                          }) : (
                                            <tr>
                                              <td colSpan={5} className="px-3 py-6 text-center text-sm text-gray-500">暂无 QT 明细</td>
                                            </tr>
                                          )}
                                        </tbody>
                                        <tfoot>
                                          <tr className="border-t border-gray-200 bg-gray-50">
                                            <td colSpan={4} className="px-3 py-3 text-right text-sm font-semibold text-gray-700">TOTAL</td>
                                            <td className="px-3 py-3 text-right text-sm font-semibold text-gray-900">
                                              {currency} {Number(selectedRequest.amount || 0).toFixed(2)}
                                            </td>
                                          </tr>
                                        </tfoot>
                                      </table>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 gap-3">
                                    <div className="rounded-lg border border-gray-200 p-3">
                                      <p className="mb-2 text-sm font-semibold text-gray-900">关键条款</p>
                                      <div className="space-y-2">
                                        {terms.map((term) => (
                                          <div key={term.label} className="grid grid-cols-[110px_1fr] gap-2 text-sm">
                                            <p className="text-gray-500">{term.label}</p>
                                            <p className="text-gray-800">{term.value}</p>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                    <div className="rounded-lg border border-gray-200 p-3">
                                      <p className="mb-2 text-sm font-semibold text-gray-900">对客备注与签发人</p>
                                      <div className="space-y-3 text-sm">
                                        <div>
                                          <p className="text-gray-500">Customer Notes</p>
                                          <p className="mt-1 text-gray-800">
                                            {selectedRequest.relatedDocument?.remarks || selectedRequest.relatedDocument?.customerNotes || '无对客备注'}
                                          </p>
                                        </div>
                                        <div>
                                          <p className="text-gray-500">Prepared By</p>
                                          <p className="mt-1 font-medium text-gray-900">{owner.name}</p>
                                          <p className="text-gray-600">{owner.email || '-'}</p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            }

                            return (
                              <div className="space-y-3">
                                <div className={`rounded-xl border px-3 py-2.5 ${isDirectorReviewActive ? 'border-indigo-200 bg-indigo-50' : 'border-emerald-200 bg-emerald-50'}`}>
                                  <p className={`text-sm font-semibold ${isDirectorReviewActive ? 'text-indigo-900' : 'text-emerald-900'}`}>
                                    {isDirectorReviewActive ? '销售总监复审视角' : '主管审批视角'}
                                  </p>
                                  <p className={`mt-1 text-xs leading-5 ${isDirectorReviewActive ? 'text-indigo-800' : 'text-emerald-800'}`}>
                                    {isDirectorReviewActive
                                      ? '请重点判断主管结论是否充分、例外理由是否成立，以及这单是否值得公司承担相应风险。'
                                      : '请先判断这单是否满足利润、付款、交期与承诺底线，再决定直接放行或形成意见上提总监。'}
                                  </p>
                                </div>

                                <div className="grid grid-cols-4 gap-3">
                                  <div className="rounded-lg border border-gray-200 bg-slate-50 px-3 py-2.5">
                                    <p className="text-[11px] text-slate-500">任务单号</p>
                                    <p className="mt-1 text-sm font-semibold text-slate-900">{selectedRequest.relatedDocumentId}</p>
                                    <p className="mt-1 text-[11px] text-slate-500">{selectedRequest.relatedDocumentType}</p>
                                  </div>
                                  <div className="rounded-lg border border-gray-200 bg-slate-50 px-3 py-2.5">
                                    <p className="text-[11px] text-slate-500">提审时间</p>
                                    <p className="mt-1 text-sm font-semibold text-slate-900">{resolveApprovalSubmittedAt(selectedRequest)}</p>
                                    <p className="mt-1 text-[11px] text-slate-500">业务员：{owner.name}</p>
                                  </div>
                                  <div className="rounded-lg border border-gray-200 bg-slate-50 px-3 py-2.5">
                                    <p className="text-[11px] text-slate-500">审批路径</p>
                                    <p className="mt-1 text-sm font-semibold text-slate-900">{decisionSignals.needsDirectorReview ? '主管 -> 总监' : '主管直审'}</p>
                                    <p className="mt-1 text-[11px] text-slate-500">{resolveApprovalRouteLabel(selectedRequest)}</p>
                                  </div>
                                  <div className="rounded-lg border border-gray-200 bg-slate-50 px-3 py-2.5">
                                    <p className="text-[11px] text-slate-500">当前判断建议</p>
                                    <p className="mt-1 text-sm font-semibold text-slate-900">{decisionSignals.needsDirectorReview ? '形成主管结论后上提' : '可由主管直接决策'}</p>
                                    <p className="mt-1 text-[11px] text-slate-500">{decisionSignals.isLowMargin ? '低利润例外单' : '常规报价审批'}</p>
                                  </div>
                                </div>

                                <div className="grid grid-cols-[1.2fr_0.8fr] gap-4">
                                  <div className="rounded-xl border border-blue-200 bg-blue-50 p-3">
                                    <div className="flex items-center gap-2">
                                      <MessageSquare className="h-4 w-4 text-blue-600" />
                                      <h4 className="text-sm font-semibold text-blue-900">业务员提审依据</h4>
                                    </div>
                                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-blue-950">
                                      {salesApprovalNote || '未填写提审说明，建议退回补充业务背景、让利原因与风险补救措施。'}
                                    </p>
                                  </div>
                                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                                    <div className="flex items-center gap-2">
                                      <AlertCircle className="h-4 w-4 text-amber-600" />
                                      <h4 className="text-sm font-semibold text-amber-900">放行建议</h4>
                                    </div>
                                    <p className="mt-2 text-sm leading-6 text-amber-950">{decisionSignals.recommendation}</p>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                  {noteSections.map((section) => (
                                    <div key={section.key} className="rounded-xl border border-gray-200 p-3">
                                      <p className="text-sm font-semibold text-gray-900">{section.title}</p>
                                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-700">
                                        {section.content || '业务员未单独说明此项。'}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      ) : (
                        // 客户询价单：使用CustomerInquiryView组件
                        <CustomerInquiryView inquiry={selectedRequest.relatedDocument} audience="internal" />
                      )}
                    </>
                  )}
                </div>
              </div>

              <div
                key={`approval-side-${selectedRequest.id}-${detailDialogRenderKey}`}
                ref={approvalPanelRef}
                className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
                    <p className="text-[11px] text-slate-500">业务员</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{selectedOwner.name || '-'}</p>
                    <p className="mt-1 text-xs text-slate-500">{selectedOwner.email || '-'}</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
                    <p className="text-[11px] text-slate-500">审批路径</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{resolveApprovalRouteLabel(selectedRequest)}</p>
                    <p className="mt-1 text-xs text-slate-500">{isDirectorReviewActive ? '当前为总监复审阶段' : '当前为主管审批阶段'}</p>
                  </div>
                </div>

                <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-3">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-blue-600" />
                    <h4 className="text-sm font-semibold text-blue-900">业务员提审说明</h4>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-blue-950">
                    {selectedSalesApprovalNote || '未填写提审说明'}
                  </p>
                </div>

                {selectedDecisionSignals && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-3">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                      <h4 className="text-sm font-semibold text-amber-900">审批提示</h4>
                    </div>
                    <div className="mt-2 space-y-1.5 text-sm text-amber-950">
                      {selectedDecisionSignals.riskFlags.map((flag) => (
                        <p key={flag}>- {flag}</p>
                      ))}
                    </div>
                  </div>
                )}

                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
                  <h4 className="text-sm font-semibold text-slate-900">审批历史</h4>
                  <div className="mt-3 space-y-3">
                    {selectedApprovalHistory.length > 0 ? selectedApprovalHistory.map((item) => {
                      const parsedDecision = parseApprovalDecisionComment(item.comment || '');
                      return (
                        <div key={item.id} className="rounded-md border border-slate-200 bg-white px-3 py-2">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-semibold text-slate-900">{item.approverName || item.approver || '审批人'}</p>
                            <p className="text-[11px] text-slate-500">{new Date(item.timestamp).toLocaleString('zh-CN')}</p>
                          </div>
                          <p className="mt-1 text-[11px] text-slate-500">{item.approverRole || '审批角色'}</p>
                          <p className="mt-2 text-xs leading-5 text-slate-700 whitespace-pre-wrap">
                            {parsedDecision.body || parsedDecision.raw || '无审批意见'}
                          </p>
                        </div>
                      );
                    }) : (
                      <div className="rounded-md border border-dashed border-slate-200 bg-white px-3 py-3 text-xs text-slate-500">
                        暂无审批历史。
                      </div>
                    )}
                  </div>
                </div>

                {canShowApprovalActions ? (
                  <div className="rounded-lg border border-slate-200 bg-white px-3 py-3">
                    <h4 className="text-sm font-semibold text-slate-900">审批意见</h4>
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <div>
                        <p className="mb-1 text-xs text-slate-500">审批结论类型</p>
                        <Select value={approvalDecisionMode} onValueChange={(value) => setApprovalDecisionMode(value as ApprovalDecisionMode)}>
                          <SelectTrigger className="h-9 text-sm">
                            <SelectValue placeholder="请选择审批结论" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="release">{isDirectorReviewActive ? '最终放行' : '直接放行'}</SelectItem>
                            <SelectItem value="conditional_release">附条件放行</SelectItem>
                            {needsDirectorReviewActive && !isDirectorReviewActive && (
                              <SelectItem value="escalate">形成主管结论并上提</SelectItem>
                            )}
                            <SelectItem value="return_for_update">退回补充</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <p className="mb-1 text-xs text-slate-500">审批条件</p>
                        <Input
                          value={approvalConditionText}
                          onChange={(e) => setApprovalConditionText(e.target.value)}
                          placeholder="附条件放行时填写"
                          disabled={approvalDecisionMode !== 'conditional_release'}
                          className="h-9 text-sm"
                        />
                      </div>
                    </div>
                    <Textarea
                      placeholder="请输入审批意见（驳回时必填）"
                      value={approvalComment}
                      onChange={(e) => setApprovalComment(e.target.value)}
                      className="mt-3 min-h-[96px] text-sm"
                    />
                    <div className="mt-3 flex items-center gap-3">
                      <Button
                        type="button"
                        className="min-w-[148px] bg-green-600 hover:bg-green-700"
                        onClick={handleApprove}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        {isDirectorReviewActive ? '最终放行' : needsDirectorReviewActive ? '形成主管结论并上提' : '直接放行'}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="min-w-[132px] border-red-300 text-red-600 hover:bg-red-50"
                        onClick={handleReject}
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        退回补充
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-600">
                    当前审批单无可执行审批动作。
                  </div>
                )}
              </div>
            </div>

            {false && canShowApprovalActions && (
              <div className="border-t border-slate-200 bg-white px-5 py-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs text-slate-500">
                    当前查看 QT 摘要附件，审核动作固定在底部。
                  </p>
                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      className="min-w-[148px] bg-green-600 hover:bg-green-700"
                      onClick={handleApprove}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      {isDirectorReviewActive
                        ? '最终放行'
                        : needsDirectorReviewActive
                          ? '形成主管结论并上提'
                          : '直接放行'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="min-w-[132px] border-red-300 text-red-600 hover:bg-red-50"
                      onClick={handleReject}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      退回补充
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
