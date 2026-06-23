import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Textarea } from '../ui/textarea';
import { Checkbox } from '../ui/checkbox';
import { QuotationDocument, type QuotationData } from '../documents/templates/QuotationDocument';
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
  Trash2,
  X
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import type { ApprovalRequest, ApprovalStatus, UrgencyLevel } from '../../contexts/ApprovalContext';
import { useApproval } from '../../contexts/ApprovalContext';
import { getCurrentUser } from '../../utils/dataIsolation';
import { useSalesContracts } from '../../contexts/SalesContractContext'; // 🔥 导入销售合同Context
import { useSalesQuotations } from '../../contexts/SalesQuotationContext';
import {
  salesQuotationService,
  contractService,
  approvalRecordService,
  fromApprovalRow,
  financeCompliancePacketService,
  purchaseOrderExecutionStatusService,
  sharedRoleUiPreferenceService,
  adminOrganizationService,
  customerOrganizationService,
  customerPortalProfileService,
  customerEnterpriseMemberService,
} from '../../lib/supabaseService';
import { getLocalAdminAuth } from '../../lib/internalAdminLocalAuth';
import { addTombstones, filterNotDeleted } from '../../lib/erp-core/deletion-tombstone';
import { emitErpEvent } from '../../lib/erp-core/event-bus';
import { ERP_EVENT_KEYS } from '../../lib/erp-core/events';
import { usePurchaseOrders } from '../../contexts/PurchaseOrderContext';
import { convertToPOData } from './purchase-order/purchaseOrderUtils';
import { getFormalBusinessModelNo } from '../../utils/productModelDisplay';
import { adaptSalesQuotationToDocumentData } from '../../utils/documentDataAdapters';
import type { DocumentLayoutConfig } from '../documents/A4PageContainer';
import { useAuth } from '../../hooks/useAuth';
import type { User as RbacUser } from '../../lib/rbac-config';
import { getColumnStyle, renderColumnResizeHandle } from './admin-organization-profile/peopleCenterVisuals';
import {
  formatApprovalDecisionComment,
  parseApprovalDecisionComment,
  parseApprovalNoteSections,
  type ApprovalDecisionMode,
} from '../../utils/approvalWorkflow';
import {
  ERP_LIST_DELETE_BUTTON_CLASS,
  ERP_LIST_DELETE_BUTTON_STYLE,
} from '../shared/erpListUiSpec';
import { lcDiscrepancyApprovalService } from '../../lib/services/lcDiscrepancyApprovalService';
import { supabase, supabaseAnonKey, supabaseUrl } from '../../lib/supabase';
import { resolveUsdSellerBankInfo } from '../../utils/documentBankInfo';
import { buildPaymentTermsText, deriveBalanceTrigger } from '../../lib/paymentFlow';

type TabType = 'pending' | 'approved' | 'rejected' | 'submitted';
type ApprovalCenterColumnKey =
  | 'select'
  | 'index'
  | 'document'
  | 'owner'
  | 'customer'
  | 'triggerReason'
  | 'amount'
  | 'profitRate'
  | 'urgency'
  | 'submittedAt'
  | 'deadline'
  | 'status'
  | 'actions';

const APPROVAL_CENTER_CACHE_PREFIX = 'approval_center_cache_v1';
const getApprovalCenterCacheKey = (email: string) => `${APPROVAL_CENTER_CACHE_PREFIX}:${email || 'anonymous'}`;
const APPROVAL_CENTER_TABLE_UI_PREFERENCE_PREFIX = 'approval_center_table_column_widths';

const APPROVAL_CENTER_BASE_COLUMN_ORDER: ApprovalCenterColumnKey[] = [
  'select',
  'index',
  'document',
  'owner',
  'customer',
  'triggerReason',
  'amount',
  'profitRate',
  'urgency',
  'submittedAt',
  'status',
  'actions',
];

const APPROVAL_CENTER_PENDING_COLUMN_ORDER: ApprovalCenterColumnKey[] = [
  'select',
  'index',
  'document',
  'owner',
  'customer',
  'triggerReason',
  'amount',
  'profitRate',
  'urgency',
  'submittedAt',
  'deadline',
  'status',
  'actions',
];

const APPROVAL_CENTER_COLUMN_MIN_WIDTHS: Record<ApprovalCenterColumnKey, number> = {
  select: 36,
  index: 48,
  document: 150,
  owner: 108,
  customer: 132,
  triggerReason: 140,
  amount: 124,
  profitRate: 84,
  urgency: 96,
  submittedAt: 92,
  deadline: 96,
  status: 96,
  actions: 150,
};

const APPROVAL_CENTER_TABLE_DEFAULT_WIDTHS: Record<ApprovalCenterColumnKey, number> = {
  select: 44,
  index: 52,
  document: 188,
  owner: 124,
  customer: 152,
  triggerReason: 164,
  amount: 132,
  profitRate: 90,
  urgency: 100,
  submittedAt: 98,
  deadline: 102,
  status: 104,
  actions: 164,
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const getApprovalCenterColumnOrder = (tab: TabType) =>
  tab === 'pending' ? APPROVAL_CENTER_PENDING_COLUMN_ORDER : APPROVAL_CENTER_BASE_COLUMN_ORDER;

const normalizeApprovalCenterPreferenceRole = (role?: string | null) => {
  const normalized = String(role || '').trim();
  return normalized || 'Regional_Manager';
};

const getApprovalCenterPreferenceKey = (tab: TabType) =>
  `${APPROVAL_CENTER_TABLE_UI_PREFERENCE_PREFIX}:${tab}:v1`;

const readApprovalCenterCachedBuckets = (email: string) => {
  if (!email) {
    return {
      pending: [] as ApprovalRequest[],
      approved: [] as ApprovalRequest[],
      rejected: [] as ApprovalRequest[],
      submitted: [] as ApprovalRequest[],
    };
  }

  try {
    const raw = localStorage.getItem(getApprovalCenterCacheKey(email));
    const parsed = raw ? JSON.parse(raw) : null;
    return {
      pending: Array.isArray(parsed?.pending) ? parsed.pending : [],
      approved: Array.isArray(parsed?.approved) ? parsed.approved : [],
      rejected: Array.isArray(parsed?.rejected) ? parsed.rejected : [],
      submitted: Array.isArray(parsed?.submitted) ? parsed.submitted : [],
    };
  } catch {
    return {
      pending: [] as ApprovalRequest[],
      approved: [] as ApprovalRequest[],
      rejected: [] as ApprovalRequest[],
      submitted: [] as ApprovalRequest[],
    };
  }
};

const mergeStoredApprovalCenterColumnWidths = (
  stored: Partial<Record<ApprovalCenterColumnKey, number>> | null | undefined,
) => {
  const next = { ...APPROVAL_CENTER_TABLE_DEFAULT_WIDTHS };
  (Object.keys(APPROVAL_CENTER_TABLE_DEFAULT_WIDTHS) as ApprovalCenterColumnKey[]).forEach((key) => {
    const candidate = Number(stored?.[key]);
    if (Number.isFinite(candidate) && candidate > 0) {
      next[key] = Math.max(APPROVAL_CENTER_COLUMN_MIN_WIDTHS[key], Math.round(candidate));
    }
  });
  return next;
};

const fitApprovalCenterColumnWidthsToContainer = (
  preferred: Record<ApprovalCenterColumnKey, number>,
  containerWidth: number,
  order: ApprovalCenterColumnKey[],
) => {
  if (!Number.isFinite(containerWidth) || containerWidth <= 0) return preferred;

  const minimumTotal = order.reduce((sum, key) => sum + APPROVAL_CENTER_COLUMN_MIN_WIDTHS[key], 0);
  if (containerWidth <= minimumTotal) {
    const scale = containerWidth / minimumTotal;
    const compressed = { ...preferred };
    order.forEach((key) => {
      compressed[key] = Math.max(24, Math.round(APPROVAL_CENTER_COLUMN_MIN_WIDTHS[key] * scale));
    });
    const total = order.reduce((sum, key) => sum + compressed[key], 0);
    const remainder = Math.round(containerWidth - total);
    if (remainder !== 0) compressed.actions = Math.max(24, compressed.actions + remainder);
    return compressed;
  }

  const next = { ...preferred };
  order.forEach((key) => {
    next[key] = APPROVAL_CENTER_COLUMN_MIN_WIDTHS[key];
  });

  const preferredExtra = order.reduce(
    (sum, key) => sum + Math.max((preferred[key] || 0) - APPROVAL_CENTER_COLUMN_MIN_WIDTHS[key], 0),
    0,
  );
  const distributableWidth = containerWidth - minimumTotal;
  if (preferredExtra > 0 && distributableWidth > 0) {
    order.forEach((key) => {
      const extra = Math.max((preferred[key] || 0) - APPROVAL_CENTER_COLUMN_MIN_WIDTHS[key], 0);
      next[key] += Math.round((extra / preferredExtra) * distributableWidth);
    });
  }

  const total = order.reduce((sum, key) => sum + next[key], 0);
  const remainder = Math.round(containerWidth - total);
  if (remainder !== 0) next.actions = Math.max(24, next.actions + remainder);
  return next;
};

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

const LazyCustomerInquiryView = React.lazy(() =>
  import('../dashboard/CustomerInquiryView').then((module) => ({ default: module.CustomerInquiryView }))
);
const LazySalesContractDocument = React.lazy(() =>
  import('../documents/templates/SalesContractDocument').then((module) => ({ default: module.SalesContractDocument }))
);
const LazyPurchaseOrderDocument = React.lazy(() =>
  import('../documents/templates/PurchaseOrderDocument').then((module) => ({ default: module.PurchaseOrderDocument }))
);

const ApprovalPreviewFallback = ({ message = '正在加载审批详情...' }: { message?: string }) => (
  <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
    <div className="h-5 w-40 animate-pulse rounded bg-slate-200" />
    <div className="mt-4 space-y-3">
      <div className="h-24 animate-pulse rounded-xl bg-slate-100" />
      <div className="h-24 animate-pulse rounded-xl bg-slate-100" />
      <div className="h-40 animate-pulse rounded-xl bg-slate-50" />
    </div>
    <p className="mt-4 text-sm text-slate-500">{message}</p>
  </div>
);

const logApprovalPerf = (label: string, startAt: number, extra?: Record<string, unknown>) => {
  const duration = Math.round(performance.now() - startAt);
  console.info(`[perf] ${label}: ${duration}ms`, extra || {});
};

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

const normalizeApprovalProfitPercent = (value: unknown) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return null;
  if (numeric > 0 && numeric <= 1) return numeric * 100;
  return numeric;
};

const getProfitLevelLabel = (profitRate: number | null) => {
  if (profitRate === null) return '待定';
  if (profitRate >= 30) return '优秀';
  if (profitRate >= 20) return '良好';
  if (profitRate >= 15) return '正常';
  return '偏低';
};

const resolveApprovalTriggerReason = (
  request: ApprovalRequest,
  signals?: ReturnType<typeof resolveApprovalDecisionSignals> | null,
) => {
  const reasons: string[] = [];
  if (Number(request.amount || 0) >= 20000) {
    reasons.push('金额>=20,000，总监复审');
  } else {
    reasons.push('金额<20,000，主管审批');
  }
  if (signals?.margin !== null && signals?.margin !== undefined && signals.margin < 15) {
    reasons.push('利润率偏低');
  }
  return reasons;
};

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

const buildQuotationApprovalPayload = (
  request: ApprovalRequest,
  comment: string,
  approverName: string,
  approverEmail?: string,
) => {
  const doc = ((request as any)?.relatedDocument || {}) as Record<string, any>;
  const owner = resolveRequestSalesOwner(request);
  const resolvedOwnerEmail = String(
    doc?.ownerEmail ||
    doc?.owner_email ||
    doc?.salesPerson ||
    doc?.salesPersonEmail ||
    owner.email ||
    request.submittedBy ||
    '',
  ).trim().toLowerCase();
  const resolvedOwnerName = String(
    doc?.ownerName ||
    doc?.owner_name ||
    doc?.salesPersonName ||
    owner.name ||
    request.submittedByName ||
    '',
  ).trim();

  return {
    comment,
    approverName,
    approverEmail,
    salesPerson: resolvedOwnerEmail,
    salesPersonName: resolvedOwnerName,
    ownerEmail: resolvedOwnerEmail,
    ownerName: resolvedOwnerName,
    region: String(doc?.region || request.region || '').trim() || undefined,
  };
};

const toFiniteNumber = (value: unknown) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

const formatApprovalMoney = (value: number | null, currency: string) => {
  if (!Number.isFinite(Number(value))) return '-';
  return `${currency} ${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const summarizeFxRates = (value: unknown) => {
  const source = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
  const entries = Object.entries(source)
    .map(([currency, rate]) => [currency, Number(rate)] as const)
    .filter(([, rate]) => Number.isFinite(rate) && rate > 0);
  if (!entries.length) return '-';
  const [currency, rate] = entries[0];
  return `1 ${currency} = ${rate.toFixed(rate >= 10 ? 2 : 4)}`;
};

const extractLatestCustomerFeedback = (...sources: unknown[]) => {
  for (const source of sources) {
    if (!source) continue;
    if (typeof source === 'string' && source.trim()) {
      return { summary: source.trim(), timestamp: '' };
    }
    if (typeof source === 'object') {
      const record = source as Record<string, any>;
      const summary = pickFirstNonEmpty(
        record.summary,
        record.comment,
        record.note,
        record.feedbackText,
        record.feedback_text,
        record.message,
      );
      const timestamp = pickFirstNonEmpty(
        record.respondedAt,
        record.updatedAt,
        record.timestamp,
        record.submittedAt,
        record.submitted_at,
      );
      if (summary || timestamp) {
        return { summary: summary || '客户已反馈，建议查看原始记录。', timestamp };
      }
    }
  }
  return { summary: '', timestamp: '' };
};

type AdminOrganizationSummary = {
  nameCN?: string;
  nameEN?: string;
  email?: string;
  addressCN?: string;
  addressEN?: string;
} | null;

type CustomerOrganizationSummary = {
  companyName?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  address?: string;
} | null;

type CustomerPortalProfileSummary = {
  displayName?: string;
  loginEmail?: string;
} | null;

const pickFirstNonEmpty = (...values: unknown[]) =>
  values.map((value) => String(value || '').trim()).find(Boolean) || '';

const resolveCustomerLookupEmail = (request: ApprovalRequest | null) => {
  if (!request) return '';

  const doc = (request as any)?.relatedDocument || {};
  return pickFirstNonEmpty(
    doc?.customerEmail,
    doc?.contactEmail,
    doc?.buyerEmail,
    request.customerEmail,
    doc?.email,
  ).toLowerCase();
};

const resolveApprovalDecisionSignals = (request: ApprovalRequest, linkedQuotation?: Record<string, any> | null) => {
  const doc = (request as any)?.relatedDocument || {};
  const quotation = linkedQuotation || {};
  const docFinancialSummary =
    doc?.documentDataSnapshot?.financialSummary ||
    doc?.documentDataSnapshot?.financials ||
    doc?.documentRenderMeta?.financialSummary ||
    doc?.documentRenderMeta?.financials ||
    doc?.documentRenderMeta?.quotationFinancialBridge ||
    null;
  const sourceItems = Array.isArray(doc?.items)
    ? doc.items
    : Array.isArray(quotation?.items)
      ? quotation.items
      : [];
  const itemAmount = sourceItems.reduce((sum: number, item: any) => {
    const quantity = Number(item?.quantity ?? item?.qty ?? 0);
    const unitPrice = Number(item?.salesPrice ?? item?.unitPrice ?? item?.quotePrice ?? item?.price ?? 0);
    const lineAmount = Number(item?.totalPrice ?? item?.totalAmount ?? item?.amount);
    return sum + (Number.isFinite(lineAmount) && lineAmount > 0 ? lineAmount : quantity * unitPrice);
  }, 0);
  const itemCost = sourceItems.reduce((sum: number, item: any) => {
    const quantity = Number(item?.quantity ?? item?.qty ?? 0);
    const unitCost = Number(item?.costPrice ?? item?.costUSD ?? item?.unitCost ?? item?.cost ?? 0);
    const lineCost = Number(item?.totalCost ?? item?.total_cost);
    return sum + (Number.isFinite(lineCost) && lineCost > 0 ? lineCost : quantity * unitCost);
  }, 0);
  const requestAmount = Number(request.amount || 0);
  const amount = requestAmount > 0 ? requestAmount : itemAmount;
  const currency = String(request.currency || doc?.currency || 'USD').trim() || 'USD';
  const profitSnapshot =
    doc?.profitSnapshot ??
    doc?.profit_snapshot ??
    docFinancialSummary?.profitSnapshot ??
    quotation?.profitSnapshot ??
    quotation?.profit_snapshot ??
    null;
  const fxRates = doc?.fxRates ?? doc?.fx_rates ?? quotation?.fxRates ?? quotation?.fx_rates ?? {};
  const storedMargin = toFiniteNumber(
    doc?.profitRate ??
      doc?.profit_rate ??
      doc?.profitMargin ??
      doc?.profit_margin ??
      docFinancialSummary?.profitRate ??
      docFinancialSummary?.profit_rate ??
      docFinancialSummary?.profitMargin ??
      docFinancialSummary?.profit_margin ??
      quotation?.profitRate ??
      quotation?.profit_rate ??
      quotation?.profitMargin ??
      quotation?.profit_margin,
  );
  const rawTotalCost = toFiniteNumber(
    doc?.totalCost ??
      doc?.total_cost ??
      docFinancialSummary?.totalCost ??
      docFinancialSummary?.total_cost ??
      quotation?.totalCost ??
      quotation?.total_cost,
  );
  const rawTotalProfit = toFiniteNumber(
    doc?.totalProfit ??
      doc?.total_profit ??
      docFinancialSummary?.totalProfit ??
      docFinancialSummary?.total_profit ??
      quotation?.totalProfit ??
      quotation?.total_profit,
  );
  const additionalCost = toFiniteNumber(
    doc?.additionalCost ??
      doc?.additional_cost ??
      docFinancialSummary?.additionalCost ??
      docFinancialSummary?.additional_cost ??
      quotation?.additionalCost ??
      quotation?.additional_cost ??
      profitSnapshot?.additionalCost ??
      profitSnapshot?.additional_cost,
  );
  const freightCost = toFiniteNumber(
    doc?.freightCost ??
      doc?.freight_cost ??
      doc?.freight ??
      docFinancialSummary?.freightCost ??
      docFinancialSummary?.freight_cost ??
      docFinancialSummary?.freight ??
      quotation?.freightCost ??
      quotation?.freight_cost ??
      quotation?.freight ??
      profitSnapshot?.freightCost ??
      profitSnapshot?.freight_cost ??
      profitSnapshot?.freight,
  );
  const totalCost = rawTotalCost !== null && rawTotalCost > 0 ? rawTotalCost : itemCost;
  const extraCost = (additionalCost ?? 0) + (freightCost ?? 0);
  const recomputedProfit = totalCost > 0 ? amount - totalCost - extraCost : null;
  const recomputedMargin = totalCost > 0 && recomputedProfit !== null
    ? (recomputedProfit / totalCost) * 100
    : null;
  const totalProfitLooksSane = rawTotalProfit !== null && rawTotalProfit !== 0 && Math.abs(rawTotalProfit) <= Math.max(amount * 1.2, 1);
  const marginLooksSane = storedMargin !== null && storedMargin !== 0 && storedMargin >= -100 && storedMargin <= 100;
  const totalProfit = totalProfitLooksSane
    ? rawTotalProfit
    : recomputedProfit;
  const margin = marginLooksSane
    ? storedMargin
    : recomputedMargin;
  const hasSalesNote = Boolean(resolveSalesApprovalNote(request));
  const needsDirectorReview = amount >= 20000;
  const isLowMargin = margin !== null && margin < 15;
  const hasCustomerRemark = Boolean(String(doc?.remarks || doc?.customerNotes || '').trim());
  const customerFeedback = extractLatestCustomerFeedback(
    doc?.customerFeedback,
    doc?.customer_feedback,
    quotation?.customerFeedback,
    quotation?.customer_feedback,
  );
  const marginSummary =
    margin === null
      ? '未读取到利润率，请结合成本与售价确认后再审批。'
      : isLowMargin
        ? `当前利润率 ${margin.toFixed(1)}%，低于建议阈值，需明确让利原因与补救方案。`
        : `当前利润率 ${margin.toFixed(1)}%，处于可接受区间，可重点核验例外条款。`;

  const riskFlags = [
    marginSummary,
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
    currency,
    totalCost,
    totalProfit,
    additionalCost,
    freightCost,
    fxRates,
    fxSummary: summarizeFxRates(fxRates),
    hasSalesNote,
    needsDirectorReview,
    isLowMargin,
    hasCustomerRemark,
    customerFeedback,
    marginSummary,
    riskFlags,
    recommendation,
  };
};

const hasMeaningfulProfitSync = (quotation?: Record<string, any> | null) => {
  if (!quotation) return false;

  const rawMargin = toFiniteNumber(
    quotation?.profitRate ??
      quotation?.profit_rate ??
      quotation?.profitMargin ??
      quotation?.profit_margin,
  );
  const rawCost = toFiniteNumber(
    quotation?.totalCost ??
      quotation?.total_cost ??
      quotation?.estimatedCost ??
      quotation?.estimated_cost,
  );
  const rawProfit = toFiniteNumber(
    quotation?.totalProfit ??
      quotation?.total_profit ??
      quotation?.estimatedProfit ??
      quotation?.estimated_profit,
  );
  const fxSummary = summarizeFxRates(quotation?.fxRates ?? quotation?.fx_rates ?? null);
  const additionalCost = toFiniteNumber(
    quotation?.additionalCost ??
      quotation?.additional_cost ??
      quotation?.freightCost ??
      quotation?.freight_cost ??
      quotation?.freight,
  );

  return (
    rawMargin !== null ||
    rawCost !== null ||
    rawProfit !== null ||
    fxSummary !== '-' ||
    additionalCost !== null
  );
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
  const listLoadPerfRef = React.useRef<number | null>(null);
  const detailLoadPerfRef = React.useRef<{ id: string; startAt: number } | null>(null);
  const approvalTableContainerRef = React.useRef<HTMLDivElement | null>(null);
  const approvalColumnResizeRef = React.useRef<{
    key: ApprovalCenterColumnKey;
    startX: number;
    startWidth: number;
  } | null>(null);
  const effectiveCurrentUser = dashboardCurrentUser || authCurrentUser || currentUser;
  const currentUserEmail = String(effectiveCurrentUser?.email || '').trim().toLowerCase();
  const currentUserName = effectiveCurrentUser?.name || currentUserEmail || '';
  const currentUserRole = String(effectiveCurrentUser?.role || (currentUser as any)?.userRole || '').trim();
  const currentUserRegionCode = normalizeRegionCode(String(effectiveCurrentUser?.region || 'NA'));
  const approvalPreferenceRoleScope = useMemo(
    () => normalizeApprovalCenterPreferenceRole(currentUserRole),
    [currentUserRole],
  );

  // ─── 直接从 Supabase 查询的审批记录（不依赖共享 Context 的缓存状态）───
  const [directRecords, setDirectRecords] = useState<ApprovalRequest[]>([]);
  const [directLoading, setDirectLoading] = useState(false);

  const { approveRequest, rejectRequest, reloadApprovals } = useApproval();
  const { updateQuotation, getQuotationByNumber } = useSalesQuotations();

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

  const { refreshFromBackend: refreshSalesContractsFromBackend } = useSalesContracts();
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

  const isProcurementManagerAccount = useMemo(
    () => String(currentUserRole || '') === 'Procurement_Manager',
    [currentUserRole]
  );

  const canApproveRequest = useMemo(() => {
    return (req: ApprovalRequest) => {
      const approverEmail = String(req.currentApprover || '').trim().toLowerCase();
      const approverRole = String(req.currentApproverRole || '').trim();
      const reqRegionCode = normalizeRegionCode(String(req.region || 'NA'));

      if (approverEmail && approverEmail === currentUserEmail) return true;
      if (isBossRole && ['CEO', 'Boss'].includes(approverRole)) return true;
      if (isDirectorAccount && approverRole === 'Sales_Director') return true;
      if (isProcurementManagerAccount && approverRole === 'Procurement_Manager') return true;
      if (
        isRegionalManagerAccount &&
        ['区域业务主管', 'Regional_Manager'].includes(approverRole) &&
        reqRegionCode === currentUserRegionCode
      ) {
        return true;
      }

      return false;
    };
  }, [currentUserEmail, currentUserRegionCode, isBossRole, isDirectorAccount, isProcurementManagerAccount, isRegionalManagerAccount]);

  // 当前用户邮箱变化时直接查 Supabase，完全绕过共享 Context 缓存
  useEffect(() => {
    if (!currentUserEmail) { setDirectRecords([]); return; }

    const canReadBroadApprovalPool = isBossRole || isDirectorAccount || isRegionalManagerAccount;
    const cachedRecords = canReadBroadApprovalPool
      ? approvalRecordService.readAllSummariesCache()
      : approvalRecordService.readForApproverSummariesCache(currentUserEmail);
    if (Array.isArray(cachedRecords) && cachedRecords.length > 0) {
      setDirectRecords(cachedRecords as ApprovalRequest[]);
    }

    setDirectLoading(true);
    listLoadPerfRef.current = performance.now();
    console.info('[perf] approval list fetch start', { approver: currentUserEmail });
    const loadApprovals = async () => {
      return canReadBroadApprovalPool
        ? approvalRecordService.getAllSummariesCached()
        : approvalRecordService.getForApproverSummariesCached(currentUserEmail);
    };
    loadApprovals()
      .then(data => {
        setDirectRecords((data || []) as ApprovalRequest[]);
        if (listLoadPerfRef.current) {
          logApprovalPerf('approval list fetch', listLoadPerfRef.current, {
            approver: currentUserEmail,
            count: Array.isArray(data) ? data.length : 0,
          });
        }
      })
      .catch(err => { console.error('[ApprovalCenter] direct query failed:', err?.message); })
      .finally(() => {
        listLoadPerfRef.current = null;
        setDirectLoading(false);
      });
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

  const initialCachedBuckets = useMemo(
    () => readApprovalCenterCachedBuckets(currentUserEmail),
    [currentUserEmail],
  );
  const [pendingApprovals, setPendingApprovals] = useState<ApprovalRequest[]>(() => initialCachedBuckets.pending);
  const [approvedApprovals, setApprovedApprovals] = useState<ApprovalRequest[]>(() => initialCachedBuckets.approved);
  const [rejectedApprovals, setRejectedApprovals] = useState<ApprovalRequest[]>(() => initialCachedBuckets.rejected);
  const [submittedApprovals, setSubmittedApprovals] = useState<ApprovalRequest[]>(() => initialCachedBuckets.submitted);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const cached = readApprovalCenterCachedBuckets(currentUserEmail);
    setPendingApprovals(cached.pending);
    setApprovedApprovals(cached.approved);
    setRejectedApprovals(cached.rejected);
    setSubmittedApprovals(cached.submitted);
  }, [currentUserEmail]);

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
      try {
        localStorage.setItem(
          getApprovalCenterCacheKey(currentUserEmail),
          JSON.stringify({
            pending: nextPending,
            approved: nextApproved,
            rejected: nextRejected,
            submitted: nextSubmitted,
            updatedAt: new Date().toISOString(),
          }),
        );
      } catch {}
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
  const [approvalTableContainerWidth, setApprovalTableContainerWidth] = useState(0);
  const [approvalColumnWidths, setApprovalColumnWidths] = useState<Record<ApprovalCenterColumnKey, number>>(APPROVAL_CENTER_TABLE_DEFAULT_WIDTHS);
  const [approvalHasCustomWidths, setApprovalHasCustomWidths] = useState(false);
  const [approvalPreferenceHydrated, setApprovalPreferenceHydrated] = useState(false);

  const approvalColumnOrder = useMemo(
    () => getApprovalCenterColumnOrder(activeTab),
    [activeTab],
  );

  useEffect(() => {
    let cancelled = false;
    const loadRemotePreference = async () => {
      setApprovalPreferenceHydrated(false);
      try {
        const value = await sharedRoleUiPreferenceService.get(
          approvalPreferenceRoleScope,
          getApprovalCenterPreferenceKey(activeTab),
        );
        if (cancelled) return;
        if (value) {
          setApprovalColumnWidths(
            mergeStoredApprovalCenterColumnWidths(
              value as Partial<Record<ApprovalCenterColumnKey, number>>,
            ),
          );
          setApprovalHasCustomWidths(true);
        } else {
          setApprovalColumnWidths(APPROVAL_CENTER_TABLE_DEFAULT_WIDTHS);
          setApprovalHasCustomWidths(false);
        }
      } catch {
        setApprovalColumnWidths(APPROVAL_CENTER_TABLE_DEFAULT_WIDTHS);
        setApprovalHasCustomWidths(false);
      } finally {
        if (!cancelled) setApprovalPreferenceHydrated(true);
      }
    };
    void loadRemotePreference();
    return () => {
      cancelled = true;
    };
  }, [activeTab, approvalPreferenceRoleScope]);

  useEffect(() => {
    if (!approvalHasCustomWidths || !approvalPreferenceHydrated) return;
    const timer = window.setTimeout(() => {
      void sharedRoleUiPreferenceService.save(
        approvalPreferenceRoleScope,
        getApprovalCenterPreferenceKey(activeTab),
        approvalColumnWidths,
      ).catch(() => {});
    }, 300);
    return () => window.clearTimeout(timer);
  }, [activeTab, approvalColumnWidths, approvalHasCustomWidths, approvalPreferenceHydrated, approvalPreferenceRoleScope]);

  useEffect(() => {
    if (!approvalTableContainerRef.current || typeof ResizeObserver === 'undefined') return;
    const element = approvalTableContainerRef.current;
    const minContainerWidth = approvalColumnOrder.reduce(
      (sum, key) => sum + APPROVAL_CENTER_COLUMN_MIN_WIDTHS[key],
      0,
    );
    const handleResize = (width: number) => {
      const normalizedWidth = Math.max(width, minContainerWidth);
      setApprovalTableContainerWidth(normalizedWidth);
    };
    handleResize(element.clientWidth);
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      handleResize(entry.contentRect.width);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [approvalColumnOrder]);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!approvalColumnResizeRef.current) return;
      const { key, startX, startWidth } = approvalColumnResizeRef.current;
      const nextWidth = Math.max(
        APPROVAL_CENTER_COLUMN_MIN_WIDTHS[key],
        Math.round(startWidth + (event.clientX - startX)),
      );
      setApprovalHasCustomWidths(true);
      setApprovalColumnWidths((current) => (
        current[key] === nextWidth ? current : { ...current, [key]: nextWidth }
      ));
    };

    const stopResize = () => {
      approvalColumnResizeRef.current = null;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', stopResize);
    window.addEventListener('blur', stopResize);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', stopResize);
      window.removeEventListener('blur', stopResize);
    };
  }, []);

  const renderedApprovalColumnWidths = useMemo(
    () => fitApprovalCenterColumnWidthsToContainer(
      approvalColumnWidths,
      approvalTableContainerWidth,
      approvalColumnOrder,
    ),
    [approvalColumnOrder, approvalColumnWidths, approvalTableContainerWidth],
  );

  const getApprovalColumnStyle = (key: ApprovalCenterColumnKey) =>
    getColumnStyle(renderedApprovalColumnWidths, key);

  const startApprovalColumnResize = (
    key: ApprovalCenterColumnKey,
    event: React.MouseEvent<HTMLDivElement>,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    setApprovalHasCustomWidths(true);
    approvalColumnResizeRef.current = {
      key,
      startX: event.clientX,
      startWidth: renderedApprovalColumnWidths[key],
    };
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  const shrinkApprovalColumnToMinimum = (
    key: ApprovalCenterColumnKey,
    event: React.MouseEvent<HTMLDivElement>,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    setApprovalHasCustomWidths(true);
    setApprovalColumnWidths((current) => (
      current[key] === APPROVAL_CENTER_COLUMN_MIN_WIDTHS[key]
        ? current
        : { ...current, [key]: APPROVAL_CENTER_COLUMN_MIN_WIDTHS[key] }
    ));
  };

  const renderApprovalColumnResizeHandle = (key: ApprovalCenterColumnKey) =>
    renderColumnResizeHandle(
      key,
      startApprovalColumnResize,
      shrinkApprovalColumnToMinimum,
      { lineHoverClassName: 'group-hover:bg-slate-400' },
    );

  const renderApprovalHeaderCell = (
    key: ApprovalCenterColumnKey,
    label: string,
    className = '',
  ) => {
    const alignClass = className.includes('text-right')
      ? 'justify-end text-right'
      : className.includes('text-center')
        ? 'justify-center text-center'
        : 'justify-start text-left';

    return (
      <TableHead
        className={`group relative overflow-hidden py-3 px-3 align-middle ${className}`.trim()}
        style={getApprovalColumnStyle(key)}
      >
        <div className={`flex min-h-5 w-full items-center pr-4 ${alignClass}`}>
          <span className="block break-words whitespace-normal text-[11px] font-semibold leading-4 tracking-[0.01em]">
            {label}
          </span>
        </div>
        {renderApprovalColumnResizeHandle(key)}
      </TableHead>
    );
  };
  
  // 🔍 审批详情对话框
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [approvalComment, setApprovalComment] = useState('');
  const [approvalDecisionMode, setApprovalDecisionMode] = useState<ApprovalDecisionMode>('release');
  const [approvalConditionText, setApprovalConditionText] = useState('');
  const [detailViewTab, setDetailViewTab] = useState<'task' | 'profit' | 'quote' | 'document' | 'feedback'>('task');
  const [detailDialogRenderKey, setDetailDialogRenderKey] = useState(0);
  const [fromOrganization, setFromOrganization] = useState<AdminOrganizationSummary>(null);
  const [customerOrganization, setCustomerOrganization] = useState<CustomerOrganizationSummary>(null);
  const [customerPortalProfile, setCustomerPortalProfile] = useState<CustomerPortalProfileSummary>(null);
  const [serverLinkedQuotation, setServerLinkedQuotation] = useState<Record<string, any> | null>(null);
  const [isMobileApprovalViewport, setIsMobileApprovalViewport] = useState(false);
  const dialogShellRef = React.useRef<HTMLDivElement | null>(null);
  const previewPanelRef = React.useRef<HTMLDivElement | null>(null);
  const approvalPanelRef = React.useRef<HTMLDivElement | null>(null);
  const selectedApprovalHistory = Array.isArray(selectedRequest?.approvalHistory) ? selectedRequest.approvalHistory : [];
  const canShowApprovalActions = Boolean(
    selectedRequest &&
    (selectedRequest.status === 'pending' || selectedRequest.status === 'forwarded') &&
    canApproveRequest(selectedRequest)
  );
  const resolveRequestQuotationNumber = React.useCallback((request: ApprovalRequest | null | undefined) => {
    if (!request) return '';
    const doc = (request as any)?.relatedDocument || {};
    if (request.type === 'qt') {
      return pickFirstNonEmpty(doc?.qtNumber, request.relatedDocumentId);
    }
    return pickFirstNonEmpty(doc?.quotationNumber, doc?.qtNumber, request.relatedDocumentId);
  }, []);
  const getLinkedQuotationForRequest = React.useCallback((request: ApprovalRequest | null | undefined) => {
    const quotationNumber = resolveRequestQuotationNumber(request);
    if (!quotationNumber || !String(quotationNumber).startsWith('QT-')) return null;
    return getQuotationByNumber(quotationNumber) || null;
  }, [getQuotationByNumber, resolveRequestQuotationNumber]);
  const selectedOwner = selectedRequest ? resolveRequestSalesOwner(selectedRequest) : { name: '', email: '' };
  const selectedSalesApprovalNote = selectedRequest ? resolveSalesApprovalNote(selectedRequest) : '';
  const selectedLinkedQuotation = useMemo(
    () => getLinkedQuotationForRequest(selectedRequest),
    [getLinkedQuotationForRequest, selectedRequest],
  );
  const selectedResolvedLinkedQuotation = useMemo(() => {
    if (hasMeaningfulProfitSync(selectedLinkedQuotation)) return selectedLinkedQuotation;
    if (hasMeaningfulProfitSync(serverLinkedQuotation)) return serverLinkedQuotation;
    return selectedLinkedQuotation || serverLinkedQuotation;
  }, [selectedLinkedQuotation, serverLinkedQuotation]);
  const selectedDecisionSignals = selectedRequest
    ? resolveApprovalDecisionSignals(selectedRequest, selectedResolvedLinkedQuotation)
    : null;
  const selectedQuotationSource = useMemo(() => {
    if (!selectedRequest) return null;
    if (selectedRequest.type === 'qt') return (selectedRequest as any)?.relatedDocument || null;
    return selectedResolvedLinkedQuotation;
  }, [selectedResolvedLinkedQuotation, selectedRequest]);
  const selectedProfitReviewNote = useMemo(
    () =>
      pickFirstNonEmpty(
        selectedSalesApprovalNote,
        (selectedQuotationSource as any)?.approvalNotes,
        (selectedQuotationSource as any)?.approval_notes,
        (selectedQuotationSource as any)?.reviewNote,
        (selectedQuotationSource as any)?.review_note,
        (selectedQuotationSource as any)?.internalApprovalNote,
        (selectedQuotationSource as any)?.internalApprovalNotes,
        (selectedQuotationSource as any)?.notes,
      ),
    [selectedQuotationSource, selectedSalesApprovalNote],
  );
  const selectedCustomerLookupEmail = useMemo(
    () => resolveCustomerLookupEmail(selectedRequest),
    [selectedRequest],
  );
  const resolvedCustomerCompanyName = useMemo(
    () => pickFirstNonEmpty(
      customerOrganization?.companyName,
      (selectedRequest as any)?.relatedDocument?.customerCompany,
      selectedRequest?.customerName,
    ) || '-',
    [customerOrganization?.companyName, selectedRequest],
  );
  const resolvedCustomerContactName = useMemo(
    () => pickFirstNonEmpty(
      customerOrganization?.contactPerson,
      customerPortalProfile?.displayName,
      (selectedRequest as any)?.relatedDocument?.contactPerson,
      (selectedRequest as any)?.relatedDocument?.customerName,
      selectedRequest?.customerName,
    ) || '-',
    [customerOrganization?.contactPerson, customerPortalProfile?.displayName, selectedRequest],
  );
  const resolvedCustomerEmail = useMemo(
    () => pickFirstNonEmpty(
      customerPortalProfile?.loginEmail,
      customerOrganization?.email,
      (selectedRequest as any)?.relatedDocument?.customerEmail,
      selectedRequest?.customerEmail,
    ) || '-',
    [customerOrganization?.email, customerPortalProfile?.loginEmail, selectedRequest],
  );
  const resolvedCustomerAddress = useMemo(
    () => pickFirstNonEmpty(
      customerOrganization?.address,
      (selectedRequest as any)?.relatedDocument?.customerAddress,
    ) || '-',
    [customerOrganization?.address, selectedRequest],
  );
  const resolvedFromCompanyName = useMemo(
    () => pickFirstNonEmpty(fromOrganization?.nameEN, fromOrganization?.nameCN) || '-',
    [fromOrganization],
  );
  const resolvedFromAddress = useMemo(
    () => pickFirstNonEmpty(fromOrganization?.addressEN, fromOrganization?.addressCN) || '-',
    [fromOrganization],
  );
  const resolvedFromEmail = useMemo(
    () => pickFirstNonEmpty(fromOrganization?.email) || '-',
    [fromOrganization],
  );
  const isDirectorReviewActive = Boolean(
    selectedRequest &&
    (String(selectedRequest.currentApproverRole || '') === 'Sales_Director' || selectedRequest.status === 'forwarded')
  );
  const needsDirectorReviewActive = Boolean(
    selectedRequest && Number(selectedRequest.amount || 0) >= 20000
  );

  useEffect(() => {
    const syncViewport = () => {
      setIsMobileApprovalViewport(window.innerWidth < 768);
    };

    syncViewport();
    window.addEventListener('resize', syncViewport);
    return () => window.removeEventListener('resize', syncViewport);
  }, []);

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
    const nestedQtNumber = String((req as any)?.relatedDocument?.qtNumber || '').trim();
    const nestedContractNumber = String((req as any)?.relatedDocument?.contractNumber || '').trim();
    const relatedId = String(req.relatedDocumentId || '').trim();
    const nestedId = String((req as any)?.relatedDocument?.id || '').trim();
    const nestedBusinessNo = nestedQtNumber || nestedContractNumber;
    const looksLikeNestedBusinessNo = /^(QT|SC|PRQ|PO|SO|ING|QR)-/i.test(nestedBusinessNo);
    const looksLikeBusinessNo = /^(QT|SC|PRQ|PO|SO|ING|QR)-/i.test(relatedId);
    if (looksLikeNestedBusinessNo) return nestedBusinessNo;
    if (looksLikeBusinessNo) return relatedId;
    // 优先使用后端真实主键（uuid），避免使用前端本地临时 id（qt_... / quotation-...）
    const isLocalTempId =
      nestedId.startsWith('qt_') ||
      nestedId.startsWith('quotation-') ||
      nestedId.startsWith('bridge-');
    if (nestedId && !isLocalTempId) return nestedId;
    return relatedId || nestedId;
  };

  const resolveApprovalContractRecordId = (req: ApprovalRequest): string => {
    const nestedId = String((req as any)?.relatedDocument?.id || '').trim();
    const nestedContractNumber = String((req as any)?.relatedDocument?.contractNumber || '').trim();
    const relatedId = String(req.relatedDocumentId || '').trim();
    if (UUID_PATTERN.test(nestedId)) return nestedId;
    if (UUID_PATTERN.test(relatedId)) return relatedId;
    if (/^SC-/i.test(nestedContractNumber)) return nestedContractNumber;
    if (/^SC-/i.test(relatedId)) return relatedId;
    return nestedId || relatedId;
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
      await updateQuotation(docKey, {
        qtNumber: String(docKey).startsWith('QT-') ? docKey : undefined,
        approvalStatus: newStatus as any,
        approvalChain: payload.approval_chain,
      } as any);
    }
  };

  const processSalesContractApprovalViaServer = async (
    req: ApprovalRequest,
    action: 'approve' | 'reject',
    comment: string,
  ): Promise<{ approvalRecord: ApprovalRequest; contract: any }> => {
    const contractId = resolveApprovalContractRecordId(req);
    if (!contractId) {
      throw new Error(`合同 ${String((req as any)?.relatedDocument?.contractNumber || req.relatedDocumentId || '')} 缺少数据库主键，无法执行审批更新`);
    }

    const localAdminAuth = getLocalAdminAuth();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      apikey: supabaseAnonKey,
    };
    if (session?.access_token) {
      headers.Authorization = `Bearer ${session.access_token}`;
    }

    const response = await fetch(
      `${supabaseUrl}/functions/v1/make-server-880fd43b/auth/process-sales-contract-approval`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          approvalRequestId: req.id,
          contractId,
          action,
          comment,
          approverEmail: currentUserEmail,
          approverName: currentUserName,
          approverRole: currentUserRole || '',
          localAdminAuth:
            localAdminAuth.enabled && localAdminAuth.email && localAdminAuth.password
              ? {
                  email: localAdminAuth.email,
                  password: localAdminAuth.password,
                }
              : null,
        }),
      },
    );

    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload?.success === false) {
      throw new Error(String(payload?.message || '销售合同审批服务端处理失败'));
    }

    const approvalRecord = fromApprovalRow(payload?.approvalRecord);
    if (!approvalRecord) {
      throw new Error('服务端未返回有效审批记录');
    }

    return {
      approvalRecord,
      contract: payload?.contract || null,
    };
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

    await updateQuotation(quotationKey, {
      qtNumber: String(quotationKey).startsWith('QT-') ? quotationKey : undefined,
      approvalStatus: 'pending_approval',
      approvalChain: rebuiltChain,
    } as any);

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

  const isReleaseExceptionRequest = (req: ApprovalRequest) =>
    req.type === 'exceptional_release' ||
    req.relatedDocumentType === '例外放单申请';

  const isWorkflowOnlyApprovalRequest = (req: ApprovalRequest | null | undefined) =>
    !!req && [
      'qc_exception_release',
      'overdue_release',
      'low_margin_exception',
    ].includes(String(req.type || ''));

  const isLcDiscrepancyApprovalRequest = (req: ApprovalRequest | null | undefined) =>
    !!req && String(req.type || '') === 'lc_discrepancy';

  const isProcurementApprovalRequest = (req: ApprovalRequest | null | undefined) =>
    !!req && (
      req.type === 'cg_approval' ||
      req.relatedDocumentType === '采购请求审批' ||
      String(req.relatedDocumentId || '').startsWith('PRQ-')
    );

  const handleReleaseExceptionOutcome = async (
    req: ApprovalRequest,
    approved: boolean,
    comment: string,
  ) => {
    const purchaseOrderId = String(req.relatedDocumentId || '').trim();
    if (!purchaseOrderId) return;

    const remarks = approved
      ? `例外放单审批已通过：${comment || '批准通过'}`
      : `例外放单审批已驳回：${comment || '驳回'}`

    await purchaseOrderExecutionStatusService.upsertByPurchaseOrderId(purchaseOrderId, {
      documentReleaseStatus: approved ? 'ready_to_release' : 'blocked',
      remarks,
    });
    await financeCompliancePacketService.syncByPurchaseOrderId(purchaseOrderId);
  };

  // ✅ 批准审批
  const handleApprove = async () => {
    if (!selectedRequest) return;

    if (approvalDecisionMode === 'conditional_release' && !approvalConditionText.trim()) {
      toast.error('请选择附条件通过时，请填写明确的通过条件');
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

      if (isProcurementApprovalRequest(selectedRequest)) {
        await approveRequest(selectedRequest.id, currentUserEmail, currentUserName, currentUserRole || 'CEO', comment);
      } else if (isWorkflowOnlyApprovalRequest(selectedRequest)) {
        await approveRequest(selectedRequest.id, currentUserEmail, currentUserName, currentUserRole || 'CEO', comment);
      } else if (isLcDiscrepancyApprovalRequest(selectedRequest)) {
        await approveRequest(selectedRequest.id, currentUserEmail, currentUserName, currentUserRole || 'CEO', comment);
        await lcDiscrepancyApprovalService.applyApprovalOutcome(selectedRequest, true, currentUserEmail, comment);
      } else if (isReleaseExceptionRequest(selectedRequest)) {
        await approveRequest(selectedRequest.id, currentUserEmail, currentUserName, currentUserRole || 'CEO', comment);
        await handleReleaseExceptionOutcome(selectedRequest, true, comment);
      } else if (selectedRequest.type === 'sales_contract') {
        const result = await processSalesContractApprovalViaServer(selectedRequest, 'approve', comment);
        syncLocalApprovalRecord(result.approvalRecord as ApprovalRequest);
      } else {
        const quotationKey = resolveApprovalDocKey(selectedRequest);
        await patchWithMethodOverrideFallback(
          `/api/sales-quotations/${encodeURIComponent(quotationKey)}/approve`,
          buildQuotationApprovalPayload(selectedRequest, comment, currentUserName, currentUserEmail),
        );
        await approvalRecordService.upsert(updatedApprovalRequest);
        syncLocalApprovalRecord(updatedApprovalRequest);
      }
      toast.success('✅ 已批准');
      if (selectedRequest.type === 'sales_contract') {
        try {
          await reloadApprovals();
        } catch (reloadErr) {
          console.warn('⚠️ [ApprovalCenter] reload approvals after approve failed:', reloadErr);
        }
        try {
          await refreshSalesContractsFromBackend();
        } catch (refreshErr) {
          console.warn('⚠️ [ApprovalCenter] refresh sales contracts after approve failed:', refreshErr);
        }
      }
      syncSalesQuotationStatusByApproval(selectedRequest, 'approved');
      emitQuotationRefreshEvent(selectedRequest, 'approved');
    } catch (e: any) {
      const msg = String(e?.message || '');

      if (selectedRequest.type !== 'sales_contract' && msg.includes('No pending approval step')) {
        try {
          await rebuildApprovalChainAndRetry(selectedRequest, 'approve', comment);
          const repairedApprovalRequest = buildUpdatedApprovalRequest(selectedRequest, 'approved', comment);
          await approvalRecordService.upsert(repairedApprovalRequest);
          syncLocalApprovalRecord(repairedApprovalRequest);
          toast.success('✅ 已批准（已自动修复审批链）');
          if (selectedRequest.type === 'sales_contract') {
            try {
              await refreshSalesContractsFromBackend();
            } catch (refreshErr) {
              console.warn('⚠️ [ApprovalCenter] refresh sales contracts after repaired approve failed:', refreshErr);
            }
          }
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

      if (isProcurementApprovalRequest(selectedRequest)) {
        await rejectRequest(selectedRequest.id, currentUserEmail, currentUserName, currentUserRole || 'CEO', comment);
      } else if (isWorkflowOnlyApprovalRequest(selectedRequest)) {
        await rejectRequest(selectedRequest.id, currentUserEmail, currentUserName, currentUserRole || 'CEO', comment);
      } else if (isLcDiscrepancyApprovalRequest(selectedRequest)) {
        await rejectRequest(selectedRequest.id, currentUserEmail, currentUserName, currentUserRole || 'CEO', comment);
        await lcDiscrepancyApprovalService.applyApprovalOutcome(selectedRequest, false, currentUserEmail, comment);
      } else if (isReleaseExceptionRequest(selectedRequest)) {
        await rejectRequest(selectedRequest.id, currentUserEmail, currentUserName, currentUserRole || 'CEO', comment);
        await handleReleaseExceptionOutcome(selectedRequest, false, comment);
      } else if (selectedRequest.type === 'sales_contract') {
        const result = await processSalesContractApprovalViaServer(selectedRequest, 'reject', comment);
        syncLocalApprovalRecord(result.approvalRecord as ApprovalRequest);
      } else {
        const quotationKey = resolveApprovalDocKey(selectedRequest);
        await patchWithMethodOverrideFallback(
          `/api/sales-quotations/${encodeURIComponent(quotationKey)}/reject`,
          buildQuotationApprovalPayload(selectedRequest, comment, currentUserName, currentUserEmail),
        );
        await approvalRecordService.upsert(updatedApprovalRequest);
        syncLocalApprovalRecord(updatedApprovalRequest);
      }
      toast.error(selectedRequest.type === 'sales_contract'
        ? '❌ 已驳回！合同已退回给业务员修改。'
        : '❌ 已驳回！报价单已退回给业务员修改。'
      );
      if (selectedRequest.type === 'sales_contract') {
        try {
          await reloadApprovals();
        } catch (reloadErr) {
          console.warn('⚠️ [ApprovalCenter] reload approvals after reject failed:', reloadErr);
        }
        try {
          await refreshSalesContractsFromBackend();
        } catch (refreshErr) {
          console.warn('⚠️ [ApprovalCenter] refresh sales contracts after reject failed:', refreshErr);
        }
      }
      syncSalesQuotationStatusByApproval(selectedRequest, 'rejected');
      emitQuotationRefreshEvent(selectedRequest, 'rejected');
    } catch (e: any) {
      const msg = String(e?.message || '');

      if (selectedRequest.type !== 'sales_contract' && msg.includes('No pending approval step')) {
        try {
          await rebuildApprovalChainAndRetry(selectedRequest, 'reject', comment);
          const repairedApprovalRequest = buildUpdatedApprovalRequest(selectedRequest, 'rejected', comment);
          await approvalRecordService.upsert(repairedApprovalRequest);
          syncLocalApprovalRecord(repairedApprovalRequest);
          toast.error('❌ 已驳回（已自动修复审批链）');
          if (selectedRequest.type === 'sales_contract') {
            try {
              await refreshSalesContractsFromBackend();
            } catch (refreshErr) {
              console.warn('⚠️ [ApprovalCenter] refresh sales contracts after repaired reject failed:', refreshErr);
            }
          }
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
  const handleViewDetail = (request: ApprovalRequest, initialTab: 'task' | 'profit' | 'quote' | 'document' | 'feedback' = 'task') => {
    const detailStartAt = performance.now();
    setDetailDialogRenderKey((prev) => prev + 1);
    setSelectedRequest(request);
    setShowDetailDialog(true);
    setDetailLoading(true);
    detailLoadPerfRef.current = { id: String(request.id), startAt: detailStartAt };
    console.info('[perf] approval detail open', {
      id: request.id,
      documentId: request.relatedDocumentId,
      hasRelatedDocument: Boolean(request.relatedDocument),
    });
    setDetailViewTab(initialTab);
    setApprovalComment('');
    setApprovalConditionText('');
    setApprovalDecisionMode(
      request.requiresDirectorApproval && String(currentUserRole || '') !== 'Sales_Director'
        ? 'escalate'
        : 'release'
    );

    void approvalRecordService.getById(String(request.id))
      .then((fullRecord) => {
        if (!fullRecord) return;
        setSelectedRequest((current) => (current?.id === request.id ? { ...current, ...fullRecord } : current));
        if (detailLoadPerfRef.current?.id === String(request.id)) {
          logApprovalPerf('approval detail fetch', detailLoadPerfRef.current.startAt, {
            id: request.id,
            documentId: request.relatedDocumentId,
            hasRelatedDocument: Boolean(fullRecord.relatedDocument),
          });
        }
      })
      .catch((error) => {
        console.error('[ApprovalCenter] load detail failed:', error);
      })
      .finally(() => {
        if (detailLoadPerfRef.current?.id === String(request.id)) {
          detailLoadPerfRef.current = null;
        }
        setDetailLoading(false);
      });
  };

  useEffect(() => {
    if (!showDetailDialog || !selectedRequest) {
      setServerLinkedQuotation(null);
      return;
    }

    const quotationNumber = resolveRequestQuotationNumber(selectedRequest);
    const shouldFetchServerQuotation =
      Boolean(quotationNumber && quotationNumber.startsWith('QT-')) &&
      !hasMeaningfulProfitSync(selectedLinkedQuotation);

    if (!shouldFetchServerQuotation) {
      setServerLinkedQuotation(null);
      return;
    }

    let cancelled = false;
    void salesQuotationService
      .listViaServer({ qtNumber: quotationNumber })
      .then((rows) => {
        if (cancelled) return;
        const serverQuotation = Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
        setServerLinkedQuotation(serverQuotation);
      })
      .catch((error) => {
        if (!cancelled) {
          console.warn('[ApprovalCenter] load linked quotation via server failed:', error);
          setServerLinkedQuotation(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [resolveRequestQuotationNumber, selectedLinkedQuotation, selectedRequest, showDetailDialog]);

  useEffect(() => {
    if (!showDetailDialog || !selectedRequest) {
      setFromOrganization(null);
      setCustomerOrganization(null);
      setCustomerPortalProfile(null);
      return;
    }

    let cancelled = false;

    const loadMasterData = async () => {
      try {
        const adminOrgPromise = adminOrganizationService.get().catch(() => null);
        const normalizedCustomerEmail = selectedCustomerLookupEmail;

        let customerOrg: CustomerOrganizationSummary = null;
        let customerProfile: CustomerPortalProfileSummary = null;

        if (normalizedCustomerEmail) {
          const directPortalProfile = await customerPortalProfileService
            .getByLoginEmail(normalizedCustomerEmail)
            .catch(() => null);

          const enterpriseAuthUserId =
            await customerEnterpriseMemberService
              .resolveEnterpriseAuthUserIdForUser('', normalizedCustomerEmail)
              .catch(() => null);

          customerProfile = directPortalProfile;

          if (enterpriseAuthUserId) {
            customerOrg = await customerOrganizationService.getByAuthUser(enterpriseAuthUserId).catch(() => null);
          }

          if (!customerOrg) {
            customerOrg = await customerOrganizationService.getByEmail(normalizedCustomerEmail).catch(() => null);
          }
        }

        const adminOrg = await adminOrgPromise;
        if (cancelled) return;

        setFromOrganization(adminOrg);
        setCustomerOrganization(customerOrg);
        setCustomerPortalProfile(customerProfile);
      } catch (error) {
        if (!cancelled) {
          console.warn('[ApprovalCenter] load master data failed:', error);
        }
      }
    };

    void loadMasterData();

    return () => {
      cancelled = true;
    };
  }, [selectedCustomerLookupEmail, selectedRequest, showDetailDialog]);

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

  useEffect(() => {
    if (!showDetailDialog || !selectedRequest) return;
    requestAnimationFrame(() => {
      console.info('[perf] approval dialog frame ready', {
        id: selectedRequest.id,
        documentId: selectedRequest.relatedDocumentId,
        detailLoading,
        hasRelatedDocument: Boolean(selectedRequest.relatedDocument),
      });
    });
  }, [detailLoading, selectedRequest, showDetailDialog]);

  useEffect(() => {
    if (!showDetailDialog || !selectedRequest?.relatedDocument) return;
    requestAnimationFrame(() => {
      console.info('[perf] approval preview data ready', {
        id: selectedRequest.id,
        documentId: selectedRequest.relatedDocumentId,
        detailViewTab,
        type: selectedRequest.type,
      });
    });
  }, [detailViewTab, selectedRequest, showDetailDialog]);

  const handleDetailDialogOpenChange = (open: boolean) => {
    setShowDetailDialog(open);
    if (!open) {
      setSelectedRequest(null);
      setDetailLoading(false);
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

  const renderApprovalActionPanel = () => {
    if (!selectedRequest) return null;
    return canShowApprovalActions ? (
      <>
        <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.25fr)]">
          <div className="space-y-2.5">
            <div>
              <p className="mb-1 text-xs text-slate-500">审批结论类型</p>
              <Select value={approvalDecisionMode} onValueChange={(value) => setApprovalDecisionMode(value as ApprovalDecisionMode)}>
                <SelectTrigger className="h-9 rounded-xl bg-white text-[13px]">
                  <SelectValue placeholder="请选择审批结论" />
                </SelectTrigger>
                <SelectContent>
                <SelectItem value="release">{isDirectorReviewActive ? '最终通过' : '通过'}</SelectItem>
                <SelectItem value="conditional_release">附条件通过</SelectItem>
                {needsDirectorReviewActive && !isDirectorReviewActive && (
                  <SelectItem value="escalate">主管通过并上提总监</SelectItem>
                )}
                <SelectItem value="return_for_update">退回修改</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <p className="mb-1 text-xs text-slate-500">审批条件</p>
              <Input
                value={approvalConditionText}
                onChange={(e) => setApprovalConditionText(e.target.value)}
                placeholder="附条件通过时填写"
                disabled={approvalDecisionMode !== 'conditional_release'}
                className="h-9 rounded-xl bg-white text-[13px]"
              />
            </div>
          </div>
          <div>
            <p className="mb-1 text-xs text-slate-500">审批意见</p>
            <Textarea
              placeholder="请输入审批意见（驳回时必填）"
              value={approvalComment}
              onChange={(e) => setApprovalComment(e.target.value)}
              className="min-h-[88px] rounded-xl bg-white text-[13px]"
            />
          </div>
        </div>
        <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
          <Button
            type="button"
            className="h-10 rounded-xl bg-green-600 text-[13px] hover:bg-green-700"
            onClick={handleApprove}
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            {isDirectorReviewActive ? '最终通过' : needsDirectorReviewActive ? '主管通过并上提总监' : '通过'}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-10 rounded-xl border-red-300 text-[13px] text-red-600 hover:bg-red-50"
            onClick={handleReject}
          >
            <XCircle className="mr-2 h-4 w-4" />
            驳回并退回修改
          </Button>
        </div>
      </>
    ) : (
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
        当前审批单无可执行审批动作。
      </div>
    );
  };

  const renderQuotationReferenceView = (quotationDoc: Record<string, any> | null | undefined, request: ApprovalRequest) => {
    if (!quotationDoc) {
      return (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-500">
          暂未关联可查看的 QT 报价快照。
        </div>
      );
    }

    const owner = resolveRequestSalesOwner(request);
    const currency = String(request.currency || quotationDoc?.currency || 'USD');
    const templateSnapshot = quotationDoc?.templateSnapshot || quotationDoc?.template_snapshot || null;
    const templateVersion = templateSnapshot?.version || null;
    const snapshotData = (quotationDoc?.documentDataSnapshot || quotationDoc?.document_data_snapshot || null) as QuotationData | null;
    const rebuiltQuotationData = adaptSalesQuotationToDocumentData({
      ...quotationDoc,
      qtNumber: quotationDoc?.qtNumber || quotationDoc?.quotationNumber,
      quotationDate: quotationDoc?.quotationDate || quotationDoc?.createdAt,
      createdAt: quotationDoc?.createdAt,
      validUntil: quotationDoc?.validUntil,
      inqNumber: quotationDoc?.inqNumber || quotationDoc?.qrNumber || quotationDoc?.inquiryNumber,
      region: quotationDoc?.region,
      customerCompany: quotationDoc?.customerCompany,
      customerName: quotationDoc?.customerName,
      customerAddress: quotationDoc?.customerAddress,
      customerEmail: quotationDoc?.customerEmail,
      customerPhone: quotationDoc?.customerPhone,
      items: quotationDoc?.items,
      tradeTerms: quotationDoc?.tradeTerms,
      remarks: quotationDoc?.remarks || quotationDoc?.customerNotes || quotationDoc?.notes || '',
      salesPersonName: owner.name || quotationDoc?.salesPersonName,
      salesPerson: owner.email || quotationDoc?.salesPerson,
      salesPersonPhone: quotationDoc?.salesPersonPhone,
      salesPersonWhatsapp: quotationDoc?.salesPersonWhatsapp,
    } as any);
    const resolvedQuotationData: QuotationData = {
      ...rebuiltQuotationData,
      salesPerson: {
        ...rebuiltQuotationData.salesPerson,
        name: owner.name || rebuiltQuotationData.salesPerson.name,
        email: owner.email || rebuiltQuotationData.salesPerson.email,
        phone: quotationDoc?.salesPersonPhone || rebuiltQuotationData.salesPerson.phone,
      },
      templateSettings: snapshotData?.templateSettings || rebuiltQuotationData.templateSettings,
    };
    const layoutConfig = (templateVersion?.layout_json || null) as DocumentLayoutConfig | null;

    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-100/70 p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5">
          <div>
            <p className="text-sm font-semibold text-slate-900">
              {quotationDoc?.qtNumber || quotationDoc?.quotationNumber || request.relatedDocumentId}
            </p>
            <p className="mt-0.5 text-[12px] text-slate-500">关联 QT 文档预览</p>
          </div>
          <Badge variant="outline" className="h-7 rounded-full border-slate-200 bg-slate-50 px-3 text-[11px] text-slate-700">
            币种 {currency}
          </Badge>
        </div>
        <div className="overflow-auto rounded-xl bg-slate-100 p-4">
          <div className="mx-auto max-w-[210mm]">
            <QuotationDocument data={resolvedQuotationData} layoutConfig={layoutConfig || undefined} />
          </div>
        </div>
      </div>
    );
  };

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
    let selectedRows = allRows.filter((req) => idSet.has(String(req.id)));

    const requestsNeedingDetail = selectedRows.filter((req) => isProcurementApprovalRequest(req) && !req.relatedDocument);

    if (requestsNeedingDetail.length > 0) {
      try {
        const loadedDetails = await Promise.all(
          requestsNeedingDetail.map((req) => approvalRecordService.getById(String(req.id))),
        );
        const detailMap = new Map(
          loadedDetails.filter(Boolean).map((req) => [String(req!.id), req!]),
        );
        selectedRows = selectedRows.map((req) => detailMap.get(String(req.id)) || req);
      } catch (error: any) {
        toast.error(`加载待删除审批详情失败：${error?.message || '未知错误'}`);
        return;
      }
    }

    // 删除采购审批单时，回滚采购单到“可申请审核”状态
    try {
      await Promise.all(selectedRows
      .filter((req) => isProcurementApprovalRequest(req))
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
      <div className="grid grid-cols-4 gap-3">
        <div 
          className={`cursor-pointer rounded-xl border bg-white px-4 py-3 transition-all hover:shadow-sm ${
            activeTab === 'pending' ? 'border-[#F96302] shadow-sm ring-1 ring-[#F96302]/10' : 'border-gray-200'
          }`}
          onClick={() => setActiveTab('pending')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="mb-1 text-xs font-medium text-slate-500">待我审批</p>
              <p className="text-2xl font-bold leading-none text-slate-900">{pendingApprovals.length}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-50">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
          </div>
          {pendingApprovals.length > 0 && (
            <div className="mt-2 flex items-center gap-1 text-[11px] text-rose-600">
              <AlertCircle className="h-3.5 w-3.5" />
              <span>有紧急审批待处理</span>
            </div>
          )}
        </div>

        <div 
          className={`cursor-pointer rounded-xl border bg-white px-4 py-3 transition-all hover:shadow-sm ${
            activeTab === 'approved' ? 'border-[#F96302] shadow-sm ring-1 ring-[#F96302]/10' : 'border-gray-200'
          }`}
          onClick={() => setActiveTab('approved')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="mb-1 text-xs font-medium text-slate-500">我已审批</p>
              <p className="text-2xl font-bold leading-none text-slate-900">{approvedApprovals.length}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
            </div>
          </div>
        </div>

        <div 
          className={`cursor-pointer rounded-xl border bg-white px-4 py-3 transition-all hover:shadow-sm ${
            activeTab === 'rejected' ? 'border-[#F96302] shadow-sm ring-1 ring-[#F96302]/10' : 'border-gray-200'
          }`}
          onClick={() => setActiveTab('rejected')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="mb-1 text-xs font-medium text-slate-500">我已驳回</p>
              <p className="text-2xl font-bold leading-none text-slate-900">{rejectedApprovals.length}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-50">
              <XCircle className="h-5 w-5 text-rose-600" />
            </div>
          </div>
        </div>

        <div 
          className={`cursor-pointer rounded-xl border bg-white px-4 py-3 transition-all hover:shadow-sm ${
            activeTab === 'submitted' ? 'border-[#F96302] shadow-sm ring-1 ring-[#F96302]/10' : 'border-gray-200'
          }`}
          onClick={() => setActiveTab('submitted')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="mb-1 text-xs font-medium text-slate-500">我发起的</p>
              <p className="text-2xl font-bold leading-none text-slate-900">{submittedApprovals.length}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-50">
              <Send className="h-5 w-5 text-sky-600" />
            </div>
          </div>
        </div>
      </div>

      {/* 🎯 筛选器和列表 */}
      <div className="w-full max-w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {/* 筛选栏 */}
        <div className="border-b border-slate-200 bg-slate-50/70">
          <div className="px-5 py-4">
          <div className="flex items-center gap-2.5">
            {/* 搜索框 */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 transform text-gray-400" />
              <Input
                placeholder="搜索单据号、客户名称、业务员..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-9 rounded-xl border-slate-200 bg-slate-50 pl-9 text-xs shadow-sm placeholder:text-slate-400"
              />
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleBatchDelete}
              disabled={selectedCount === 0}
              style={ERP_LIST_DELETE_BUTTON_STYLE}
              className={`${ERP_LIST_DELETE_BUTTON_CLASS} shadow-none`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              批量删除{selectedCount > 0 ? ` (${selectedCount})` : ''}
            </Button>

            {/* 紧急程度筛选 */}
            <Select value={filterUrgency} onValueChange={setFilterUrgency}>
              <SelectTrigger className="h-9 w-[120px] rounded-xl border-slate-200 bg-white text-xs shadow-sm">
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
              <SelectTrigger className="h-9 w-[140px] rounded-xl border-slate-200 bg-white text-xs shadow-sm">
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
              <SelectTrigger className="h-9 w-[110px] rounded-xl border-slate-200 bg-white text-xs shadow-sm">
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
        </div>

        {/* 审批列表 */}
        <div ref={approvalTableContainerRef} className="w-full max-w-full overflow-hidden">
          <Table className="table-fixed border-collapse" style={{ width: '100%', maxWidth: '100%' }}>
            <colgroup>
              {approvalColumnOrder.map((key) => (
                <col key={key} style={getApprovalColumnStyle(key)} />
              ))}
            </colgroup>
            <TableHeader>
              <TableRow className="bg-gray-50 text-[11px] font-semibold text-slate-700">
                <TableHead className="group relative overflow-hidden px-0 py-3 align-middle text-center" style={getApprovalColumnStyle('select')}>
                  <div className="flex min-h-5 w-full items-center justify-center px-2">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={(checked) => handleSelectAll(Boolean(checked))}
                    />
                  </div>
                  {renderApprovalColumnResizeHandle('select')}
                </TableHead>
                {renderApprovalHeaderCell('index', '序号', 'text-center')}
                {renderApprovalHeaderCell('document', '单据信息')}
                {renderApprovalHeaderCell('owner', '业务员')}
                {renderApprovalHeaderCell('customer', '客户信息')}
                {renderApprovalHeaderCell('triggerReason', '审批触发原因')}
                {renderApprovalHeaderCell('amount', '金额', 'text-right')}
                {renderApprovalHeaderCell('profitRate', '利润率', 'text-center')}
                {renderApprovalHeaderCell('urgency', '紧急程度', 'text-center')}
                {renderApprovalHeaderCell('submittedAt', '提交时间', 'text-center')}
                {activeTab === 'pending' && (
                  renderApprovalHeaderCell('deadline', '审批期限', 'text-center')
                )}
                {renderApprovalHeaderCell('status', '状态', 'text-center')}
                {renderApprovalHeaderCell('actions', '操作', 'text-center')}
              </TableRow>
            </TableHeader>
            <TableBody className="text-[11px] text-slate-700">
              {currentTabData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={approvalColumnOrder.length} className="text-center py-8 text-gray-500">
                    暂无审批记录
                  </TableCell>
                </TableRow>
              ) : (
                currentTabData.map((request, index) => {
                  const linkedQuotation = getLinkedQuotationForRequest(request);
                  const decisionSignals = resolveApprovalDecisionSignals(request, linkedQuotation);
                  const triggerReasons = resolveApprovalTriggerReason(request, decisionSignals);
                  const urgencyConfig = getUrgencyConfig(request.urgency);
                  const statusConfig = getStatusConfig(request.status);
                  const UrgencyIcon = urgencyConfig.icon;
                  
                  return (
                    <TableRow key={request.id} className="[&>td]:py-3 [&>td]:align-top hover:bg-gray-50">
                      <TableCell className="px-0 py-3 text-center align-middle">
                        <div className="flex w-full items-center justify-center px-2">
                          <Checkbox
                            checked={selectedRequestIds.includes(String(request.id))}
                            onCheckedChange={(checked) => handleSelectOne(String(request.id), Boolean(checked))}
                          />
                        </div>
                      </TableCell>
                      <TableCell className="px-2 py-3 text-center align-middle text-[11px] text-gray-500">
                        <div className="flex w-full items-center justify-center">
                          {index + 1}
                        </div>
                      </TableCell>
                      
                      <TableCell className="px-2 py-3 overflow-hidden">
                        <div className="space-y-0.5">
                          <p className="truncate text-[12px] font-medium text-blue-600" title={request.relatedDocumentId}>{request.relatedDocumentId}</p>
                          <p className="truncate text-[11px] text-slate-500" title={request.relatedDocumentType}>{request.relatedDocumentType}</p>
                          <p className="truncate text-[11px] text-slate-400" title={request.productSummary}>{request.productSummary}</p>
                        </div>
                      </TableCell>
                      
                      <TableCell className="px-2 py-3 overflow-hidden">
                        <div className="space-y-0.5">
                          {(() => {
                            const owner = resolveRequestSalesOwner(request);
                            return (
                              <>
                                <p className="truncate text-[12px] font-medium text-slate-800" title={owner.name}>{owner.name}</p>
                                <p className="truncate text-[11px] text-slate-500" title={owner.email || '-'}>{owner.email || '-'}</p>
                              </>
                            );
                          })()}
                        </div>
                      </TableCell>
                      
                      <TableCell className="px-2 py-3 overflow-hidden">
                        <div className="space-y-0.5">
                          <p className="truncate text-[12px] font-medium text-slate-800" title={request.customerName}>{request.customerName}</p>
                          <p className="truncate text-[11px] text-slate-500" title={request.customerEmail}>{request.customerEmail}</p>
                        </div>
                      </TableCell>

                      <TableCell className="px-2 py-3 overflow-hidden">
                        <div className="space-y-1">
                          <p className="break-words text-[12px] font-medium text-slate-800">
                            {Number(request.amount || 0) >= 20000 ? '总监复审' : '主管审批'}
                          </p>
                          {triggerReasons.map((reason) => (
                            <p key={`${request.id}-${reason}`} className="truncate text-[11px] leading-5 text-slate-500" title={reason}>
                              {reason}
                            </p>
                          ))}
                        </div>
                      </TableCell>
                      
                      <TableCell className="px-2 py-3 text-right overflow-hidden">
                        <div className="space-y-1">
                          <div className="flex items-center justify-end gap-1 tabular-nums">
                            <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
                            <span className="text-[12px] font-semibold text-slate-900">
                            ${request.amount.toLocaleString()}
                            </span>
                            <span className="text-[10px] text-slate-400">{request.currency}</span>
                          </div>
                        {request.requiresDirectorApproval && (request.status === 'pending' || request.status === 'forwarded') && (
                            <div className="flex justify-end">
                              <Badge className="h-6 rounded-full border border-orange-200 bg-orange-50 px-2 text-[10px] text-orange-700 shadow-none">
                                需总监复审
                              </Badge>
                            </div>
                        )}
                        </div>
                      </TableCell>

                      <TableCell className="px-2 py-3 text-center overflow-hidden">
                        <div className="flex flex-col items-center gap-0.5">
                          <span className={`text-[12px] font-semibold ${
                            decisionSignals.margin === null
                              ? 'text-slate-400'
                              : decisionSignals.isLowMargin
                                ? 'text-rose-600'
                                : 'text-emerald-600'
                          }`}>
                            {decisionSignals.margin === null ? '—' : `${decisionSignals.margin.toFixed(1)}%`}
                          </span>
                          <span className="text-[11px] text-slate-500">{getProfitLevelLabel(decisionSignals.margin)}</span>
                        </div>
                      </TableCell>
                      
                      <TableCell className="px-2 py-3 text-center overflow-hidden">
                        <div className="flex justify-center">
                          <Badge className={`h-6 rounded-full border px-2 text-[10px] shadow-none ${urgencyConfig.color}`}>
                          <UrgencyIcon className="mr-1 h-3 w-3" />
                          {urgencyConfig.label}
                        </Badge>
                        </div>
                      </TableCell>
                      
                      <TableCell className="px-2 py-3 text-center overflow-hidden">
                        <span className="text-[11px] text-slate-600">{formatTime(request.submittedAt)}</span>
                      </TableCell>
                      
                      {activeTab === 'pending' && (
                        <TableCell className="px-2 py-3 text-center overflow-hidden">
                          {formatExpiresIn(request.expiresIn)}
                        </TableCell>
                      )}
                      
                      <TableCell className="px-2 py-3 text-center overflow-hidden">
                        <div className="flex justify-center">
                          <Badge className={`h-6 rounded-full border px-2 text-[10px] shadow-none ${statusConfig.color}`}>
                            {statusConfig.label}
                          </Badge>
                        </div>
                      </TableCell>
                      
                      <TableCell className="px-2 py-3 text-center overflow-hidden">
                        <div className="grid w-full grid-cols-1 gap-1">
                          {activeTab === 'pending' ? (
                            <>
                              <Button
                                size="sm"
                                className="h-7 w-full justify-center gap-1 rounded-full bg-[#F96302] px-2 text-[10px] leading-4 text-white shadow-none hover:bg-[#E55A02]"
                                onClick={() => handleViewDetail(request, 'task')}
                              >
                                <CheckCircle className="h-3.5 w-3.5" />
                                审核
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 w-full justify-center gap-1 rounded-full border-emerald-200 bg-white px-2 text-[10px] leading-4 text-emerald-700 shadow-none hover:bg-emerald-50"
                                onClick={() => handleViewDetail(request, 'profit')}
                              >
                                <TrendingUp className="h-3 w-3" />
                                测算
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 w-full justify-center gap-1 rounded-full border-slate-200 bg-white px-2 text-[10px] leading-4 text-slate-700 shadow-none hover:bg-slate-50"
                                onClick={() => handleViewDetail(request, 'task')}
                              >
                                <Eye className="h-3 w-3" />
                                查看
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 w-full justify-center gap-1 rounded-full border-emerald-200 bg-white px-2 text-[10px] leading-4 text-emerald-700 shadow-none hover:bg-emerald-50"
                                onClick={() => handleViewDetail(request, 'profit')}
                              >
                                <TrendingUp className="h-3 w-3" />
                                测算
                              </Button>
                            </>
                          )}
                        </div>
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
            hideClose
            className="fixed z-[60] grid grid-rows-[auto_minmax(0,1fr)] overflow-hidden border border-slate-200 bg-white p-0 shadow-2xl md:rounded-2xl"
            style={{
              top: isMobileApprovalViewport ? '0' : '20px',
              left: isMobileApprovalViewport ? '0' : '20px',
              right: isMobileApprovalViewport ? '0' : '20px',
              margin: '0 auto',
              width: isMobileApprovalViewport ? '100vw' : 'min(1180px, calc(100vw - 40px))',
              maxWidth: isMobileApprovalViewport ? '100vw' : 'calc(100vw - 40px)',
              height: isMobileApprovalViewport ? '100dvh' : 'min(760px, calc(100dvh - 40px))',
              maxHeight: isMobileApprovalViewport ? '100dvh' : 'calc(100dvh - 40px)',
              borderRadius: isMobileApprovalViewport ? '0' : undefined,
            }}
          >
            {(() => {
              const owner = resolveRequestSalesOwner(selectedRequest);
              const currentNodeLabel = resolveCurrentApprovalNodeLabel(selectedRequest);
              const isDirectorStep = String(selectedRequest.currentApproverRole || '') === 'Sales_Director' || selectedRequest.status === 'forwarded';
              return (
            <DialogHeader className="border-b border-gray-200 bg-white px-4 py-3 md:px-5">
              <div className="flex flex-col gap-2.5 md:flex-row md:items-start md:justify-between md:gap-3">
                <div className="min-w-0 flex-1">
                  <DialogTitle className="truncate text-[18px] leading-none md:text-[20px]">
                    审批任务工作台 - {selectedRequest.relatedDocumentId}
                  </DialogTitle>
                  <DialogDescription className="mt-1.5 text-[12px] leading-5 text-gray-600">
                    {selectedRequest.relatedDocumentType} · 业务员：{owner.name} · 先看利润测算与审批依据，再查看 QT / SC 正文
                  </DialogDescription>
                </div>
                <div className="flex items-start justify-between gap-2 md:shrink-0 md:pl-3">
                  <div className="flex max-w-[760px] flex-wrap items-center gap-1.5 rounded-2xl border border-slate-200 bg-slate-50 p-1">
                    <Button
                      type="button"
                      variant={detailViewTab === 'task' ? 'default' : 'outline'}
                      className="h-8 rounded-xl px-3 text-[12px] shadow-none"
                      onClick={() => setDetailViewTab('task')}
                    >
                      审批任务
                    </Button>
                    <Button
                      type="button"
                      variant={detailViewTab === 'profit' ? 'default' : 'outline'}
                      className="h-8 rounded-xl px-3 text-[12px] shadow-none"
                      onClick={() => setDetailViewTab('profit')}
                    >
                      查看利润测算
                    </Button>
                    {selectedQuotationSource && (
                      <Button
                        type="button"
                        variant={detailViewTab === 'quote' ? 'default' : 'outline'}
                        className="h-8 rounded-xl px-3 text-[12px] shadow-none"
                        onClick={() => setDetailViewTab('quote')}
                      >
                        {selectedRequest.type === 'qt' ? '查看提交 QT' : '查看关联 QT'}
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant={detailViewTab === 'feedback' ? 'default' : 'outline'}
                      className="h-8 rounded-xl px-3 text-[12px] shadow-none"
                      onClick={() => setDetailViewTab('feedback')}
                    >
                      查看客户反馈
                    </Button>
                    {selectedRequest.type === 'sales_contract' && (
                      <Button
                        type="button"
                        variant={detailViewTab === 'document' ? 'default' : 'outline'}
                        className="h-8 rounded-xl px-3 text-[12px] shadow-none"
                        onClick={() => setDetailViewTab('document')}
                      >
                        查看 SC 正文
                      </Button>
                    )}
                    <Badge variant="outline" className="h-6 px-2.5 text-[10px]">{currentNodeLabel}</Badge>
                    {Number(selectedRequest.amount || 0) >= 20000 && (
                      <Badge className="h-6 border border-orange-200 bg-orange-100 px-2.5 text-[10px] text-orange-800">
                        双级审批
                      </Badge>
                    )}
                    {isDirectorStep && (
                      <Badge className="h-6 border border-blue-200 bg-blue-100 px-2.5 text-[10px] text-blue-800">
                        总监视角
                      </Badge>
                    )}
                  </div>
                  <button
                    type="button"
                    aria-label="关闭审批弹窗"
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-800"
                    onClick={() => handleDetailDialogOpenChange(false)}
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </DialogHeader>
              );
            })()}
            
            <div className={`grid h-full min-h-0 grid-cols-1 gap-0 ${detailViewTab === 'task' ? 'md:grid-cols-[minmax(0,1fr)_360px]' : ''}`}>
              {/* 左侧：审批任务主区 */}
              <div
                key={`approval-preview-${selectedRequest.id}-${detailDialogRenderKey}-${detailViewTab}`}
                ref={previewPanelRef}
                className={`min-h-0 overflow-y-auto overscroll-contain bg-slate-50 ${
                  detailViewTab === 'quote'
                    ? 'order-2 md:order-1 md:border-r md:border-gray-200'
                    : 'order-1'
                }`}
              >
                <div className="space-y-2.5 p-3 md:p-3.5">
                  {detailViewTab === 'task' &&
                    (() => {
                      const owner = resolveRequestSalesOwner(selectedRequest);
                      const currentNodeLabel = resolveCurrentApprovalNodeLabel(selectedRequest);
                      const triggerReasons = resolveApprovalTriggerReason(selectedRequest, selectedDecisionSignals);
                      return (
                        <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                          <div className="flex flex-col gap-1.5 border-b border-slate-100 pb-2.5 md:flex-row md:items-start md:justify-between">
                            <div>
                              <p className="text-[15px] font-semibold text-slate-900">{selectedRequest.relatedDocumentId}</p>
                              <p className="mt-0.5 text-[11px] text-slate-500">{selectedRequest.relatedDocumentType}</p>
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5">
                              <Badge variant="outline" className="h-6 px-2.5 text-[10px]">{currentNodeLabel}</Badge>
                              <Badge className={`h-6 border px-2.5 text-[10px] shadow-none ${
                                needsDirectorReviewActive
                                  ? 'border-orange-200 bg-orange-50 text-orange-700'
                                  : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                              }`}>
                                {needsDirectorReviewActive ? '金额>=20,000，总监复审' : '金额<20,000，主管可直接审批'}
                              </Badge>
                              <Badge className={`h-6 border px-2.5 text-[10px] shadow-none ${
                                selectedDecisionSignals?.margin === null
                                  ? 'border-slate-200 bg-slate-50 text-slate-700'
                                  : selectedDecisionSignals?.isLowMargin
                                    ? 'border-rose-200 bg-rose-50 text-rose-700'
                                    : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                              }`}>
                                {selectedDecisionSignals?.margin === null ? '利润率待确认' : `利润率 ${selectedDecisionSignals.margin.toFixed(1)}%`}
                              </Badge>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="grid grid-cols-1 gap-2 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.9fr)]">
                              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px]">
                                  <div className="min-w-0">
                                    <span className="text-slate-500">客户</span>
                                    <span className="ml-2 font-semibold text-slate-900">{resolvedCustomerCompanyName}</span>
                                  </div>
                                  <div className="min-w-0 text-slate-500">{resolvedCustomerEmail}</div>
                                </div>
                                <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px]">
                                  <div className="min-w-0">
                                    <span className="text-slate-500">业务员</span>
                                    <span className="ml-2 font-semibold text-slate-900">{owner.name}</span>
                                  </div>
                                  <div className="min-w-0 text-slate-500">{owner.email || '-'}</div>
                                </div>
                              </div>
                              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <div>
                                    <p className="text-[11px] uppercase tracking-wide text-slate-500">金额与层级</p>
                                    <p className="mt-1 text-[15px] font-semibold text-slate-900">
                                      {formatApprovalMoney(Number(selectedRequest.amount || 0), selectedRequest.currency || 'USD')}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-[11px] uppercase tracking-wide text-slate-500">提交与时限</p>
                                    <p className="mt-1 text-[13px] font-semibold text-slate-900">{resolveApprovalSubmittedAt(selectedRequest)}</p>
                                  </div>
                                </div>
                                <div className="mt-2 grid grid-cols-3 gap-1.5 border-t border-slate-200 pt-2">
                                  <div className="min-w-0">
                                    <p className="text-[10px] text-slate-500">估算成本</p>
                                    <p className="mt-0.5 truncate text-[12px] font-semibold text-slate-800" title={formatApprovalMoney(selectedDecisionSignals?.totalCost ?? null, selectedDecisionSignals?.currency || selectedRequest.currency || 'USD')}>
                                      {formatApprovalMoney(selectedDecisionSignals?.totalCost ?? null, selectedDecisionSignals?.currency || selectedRequest.currency || 'USD')}
                                    </p>
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-[10px] text-slate-500">估算毛利</p>
                                    <p className={`mt-0.5 truncate text-[12px] font-semibold ${
                                      Number(selectedDecisionSignals?.totalProfit ?? 0) < 0 ? 'text-rose-600' : 'text-emerald-600'
                                    }`} title={formatApprovalMoney(selectedDecisionSignals?.totalProfit ?? null, selectedDecisionSignals?.currency || selectedRequest.currency || 'USD')}>
                                      {formatApprovalMoney(selectedDecisionSignals?.totalProfit ?? null, selectedDecisionSignals?.currency || selectedRequest.currency || 'USD')}
                                    </p>
                                  </div>
                                  <div className="min-w-0 text-right">
                                    <p className="text-[10px] text-slate-500">利润率</p>
                                    <p className={`mt-0.5 truncate text-[12px] font-semibold ${
                                      selectedDecisionSignals?.margin === null
                                        ? 'text-slate-400'
                                        : selectedDecisionSignals?.isLowMargin
                                          ? 'text-rose-600'
                                          : 'text-emerald-600'
                                    }`}>
                                      {selectedDecisionSignals?.margin === null ? '-' : `${selectedDecisionSignals.margin.toFixed(1)}%`}
                                    </p>
                                  </div>
                                </div>
                                <div className="mt-1.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[11px] text-slate-500">
                                  <span>{resolveApprovalRouteLabel(selectedRequest)}</span>
                                  <span>{formatExpiresIn(selectedRequest.expiresIn)}</span>
                                </div>
                              </div>
                            </div>
                            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                              <div className="flex flex-wrap items-start justify-between gap-2">
                                <div>
                                  <p className="text-[11px] uppercase tracking-wide text-slate-500">审批触发原因</p>
                                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                                    {triggerReasons.map((reason) => (
                                      <Badge key={reason} variant="outline" className="h-6 rounded-full border-slate-200 bg-white px-2.5 text-[10px] text-slate-700">
                                        {reason}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                                <div className="min-w-[180px] rounded-lg border border-white/80 bg-white px-2.5 py-2 text-right">
                                  <p className="text-[11px] text-slate-500">审批建议</p>
                                  <p className="mt-1 text-[12px] font-medium text-slate-800">{selectedDecisionSignals?.recommendation || '请结合利润与条款判断后审批'}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  {detailLoading && !selectedRequest.relatedDocument ? (
                    <ApprovalPreviewFallback message="正在补充加载该审批的完整单据内容..." />
                  ) : null}
                  {/* 🔥 根据文档类型动态渲染对应的查看组件 */}
                  {selectedRequest.relatedDocument && (
                    <>
                      {isProcurementApprovalRequest(selectedRequest) ? (
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
                            <Suspense fallback={<ApprovalPreviewFallback message="正在加载采购审批原始单据..." />}>
                              <div className="bg-white rounded-lg shadow-sm">
                                <LazyPurchaseOrderDocument data={poData} layoutConfig={templateVersion?.layout_json || undefined} />
                              </div>
                            </Suspense>
                          );
                        })()
                      ) : selectedRequest.type === 'sales_contract' || selectedRequest.type === 'qt' ? (
                        (() => {
                          const decisionSignals = selectedDecisionSignals;
                          if (!decisionSignals) return null;

                          if (detailViewTab === 'quote') {
                            return renderQuotationReferenceView(selectedQuotationSource, selectedRequest);
                          }

                          if (detailViewTab === 'document' && selectedRequest.type === 'sales_contract') {
                            return (
                              <Suspense fallback={<ApprovalPreviewFallback message="正在加载销售合同审批视图..." />}>
                                <div className="bg-white rounded-lg shadow-sm">
                                  <LazySalesContractDocument
                                    data={{
                                      contractNo: selectedRequest.relatedDocument.contractNumber,
                                      contractDate: selectedRequest.relatedDocument.createdAt ? new Date(selectedRequest.relatedDocument.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                                      quotationNo: selectedRequest.relatedDocument.quotationNumber,
                                      inquiryNo: selectedRequest.relatedDocument.inquiryNumber,
                                      region: selectedRequest.relatedDocument.region || 'NA',
                                      seller: {
                                        name: '福建高盛达富建材有限公司',
                                        nameEn: 'FUJIAN COSUN BUILDING MATERIALS CO., LTD.',
                                        address: '中国福建省厦门市工业园区123号',
                                        addressEn: 'No. 123, Industrial Park, Xiamen, Fujian, China',
                                        tel: '+86-592-1234-5678',
                                        fax: '+86-592-1234-5679',
                                        email: selectedRequest.submittedBy || 'sales@cosun.com',
                                        legalRepresentative: '张总',
                                        bankInfo: resolveUsdSellerBankInfo(
                                          fromOrganization,
                                          undefined,
                                          'FUJIAN COSUN BUILDING MATERIALS CO., LTD.',
                                        ),
                                      },
                                      buyer: {
                                        companyName: resolvedCustomerCompanyName,
                                        address: resolvedCustomerAddress === '-' ? '' : resolvedCustomerAddress,
                                        country: selectedRequest.relatedDocument.customerCountry || '',
                                        contactPerson: resolvedCustomerContactName === '-' ? '' : resolvedCustomerContactName,
                                        tel: selectedRequest.relatedDocument.contactPhone || customerOrganization?.phone || customerOrganization?.mobile || '',
                                        email: resolvedCustomerEmail === '-' ? '' : resolvedCustomerEmail
                                      },
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
                                      terms: {
                                        totalAmount: selectedRequest.amount,
                                        currency: selectedRequest.relatedDocument.currency || 'USD',
                                        tradeTerms: selectedRequest.relatedDocument.tradeTerms || 'FOB Xiamen',
                                        paymentTerms:
                                          selectedRequest.relatedDocument.paymentTerms
                                          || buildPaymentTermsText(
                                            selectedRequest.relatedDocument.paymentMode,
                                            deriveBalanceTrigger(
                                              selectedRequest.relatedDocument.paymentMode,
                                              selectedRequest.relatedDocument.balanceTrigger || null,
                                            ),
                                          ),
                                        depositAmount: selectedRequest.relatedDocument.depositAmount || (selectedRequest.amount * 0.3),
                                        balanceAmount: selectedRequest.relatedDocument.balanceAmount || (selectedRequest.amount * 0.7),
                                        deliveryTime: selectedRequest.relatedDocument.deliveryTime || '25-30 days after deposit',
                                        portOfLoading: selectedRequest.relatedDocument.portOfLoading || 'Xiamen, China',
                                        portOfDestination: selectedRequest.relatedDocument.portOfDestination || '',
                                        packing: selectedRequest.relatedDocument.packing || 'Export standard carton',
                                        inspection: selectedRequest.relatedDocument.inspection || "Seller's factory inspection",
                                        warranty: selectedRequest.relatedDocument.warranty || '12 months from delivery date'
                                      },
                                      remarks: selectedRequest.relatedDocument.remarks || '',
                                      salesPerson: {
                                        name: selectedRequest.submittedByName || 'Sales Representative',
                                        position: 'Sales Manager',
                                        email: selectedRequest.submittedBy || '',
                                        phone: '+86-592-1234567'
                                      }
                                    }}
                                  />
                                </div>
                              </Suspense>
                            );
                          }

                          if (detailViewTab === 'profit') {
                            const profitDataSourceLabel = hasMeaningfulProfitSync(selectedResolvedLinkedQuotation)
                              ? '利润按关联QT重算'
                              : '利润按当前审批单重算';
                            const hasFxValue = decisionSignals.fxSummary !== '-';
                            const hasExtraChargeValue =
                              Number.isFinite(Number(decisionSignals.freightCost)) ||
                              Number.isFinite(Number(decisionSignals.additionalCost));
                            const profitSummaryCards = [
                              {
                                key: 'amount',
                                label: '报价金额',
                                value: formatApprovalMoney(decisionSignals.amount, decisionSignals.currency),
                                valueClassName: 'text-slate-900',
                              },
                              {
                                key: 'cost',
                                label: '估算总成本',
                                value: formatApprovalMoney(decisionSignals.totalCost, decisionSignals.currency),
                                valueClassName: 'text-slate-900',
                              },
                              {
                                key: 'profit',
                                label: '估算毛利',
                                value: formatApprovalMoney(decisionSignals.totalProfit, decisionSignals.currency),
                                valueClassName: 'text-slate-900',
                              },
                              {
                                key: 'margin',
                                label: '利润率',
                                value: decisionSignals.margin === null ? '-' : `${decisionSignals.margin.toFixed(1)}%`,
                                valueClassName: decisionSignals.margin === null ? 'text-slate-400' : 'text-slate-900',
                              },
                              hasFxValue
                                ? {
                                    key: 'fx',
                                    label: '汇率',
                                    value: decisionSignals.fxSummary,
                                    valueClassName: 'text-slate-900',
                                  }
                                : null,
                              hasExtraChargeValue
                                ? {
                                    key: 'extra',
                                    label: '运费/附加费',
                                    value: [
                                      Number.isFinite(Number(decisionSignals.freightCost))
                                        ? `运费 ${formatApprovalMoney(decisionSignals.freightCost, decisionSignals.currency)}`
                                        : '',
                                      Number.isFinite(Number(decisionSignals.additionalCost))
                                        ? `附加 ${formatApprovalMoney(decisionSignals.additionalCost, decisionSignals.currency)}`
                                        : '',
                                    ].filter(Boolean).join(' · '),
                                    valueClassName: 'text-slate-900',
                                  }
                                : null,
                            ].filter(Boolean) as Array<{ key: string; label: string; value: string; valueClassName: string }>;
                            return (
                              <div className="space-y-2.5">
                                <div className={`rounded-xl border px-3 py-2 ${isDirectorReviewActive ? 'border-indigo-200 bg-indigo-50' : 'border-emerald-200 bg-emerald-50'}`}>
                                  <div className="flex flex-col gap-1.5 md:flex-row md:items-center md:justify-between">
                                    <div className="min-w-0">
                                      <p className={`text-[13px] font-semibold ${isDirectorReviewActive ? 'text-indigo-900' : 'text-emerald-900'}`}>
                                        {isDirectorReviewActive ? '销售总监复审视角' : '主管审批视角'}
                                      </p>
                                      <p className={`text-[12px] leading-5 ${isDirectorReviewActive ? 'text-indigo-800' : 'text-emerald-800'}`}>
                                        {isDirectorReviewActive
                                          ? '重点判断主管结论是否充分、利润是否站得住，以及公司是否值得承担相应风险。'
                                          : '先判断利润、付款、交期与承诺底线，再决定直接放行或形成意见上提总监。'}
                                      </p>
                                    </div>
                                    <Badge className="h-6 rounded-full border border-white/80 bg-white px-2.5 text-[10px] text-slate-700 shadow-none">
                                      {profitDataSourceLabel}
                                    </Badge>
                                  </div>
                                </div>

                                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3.5">
                                  <div className="flex flex-col gap-2.5 md:flex-row md:items-start md:justify-between">
                                    <div>
                                      <p className="text-sm font-semibold text-emerald-900">利润测算摘要</p>
                                      <p className="mt-1 text-[12px] leading-5 text-emerald-800">{decisionSignals.marginSummary}</p>
                                    </div>
                                    <Badge className={`h-7 rounded-full border px-3 text-xs shadow-none ${
                                      decisionSignals.margin === null
                                        ? 'border-slate-200 bg-white text-slate-700'
                                        : decisionSignals.isLowMargin
                                          ? 'border-red-200 bg-red-50 text-red-700'
                                        : 'border-emerald-200 bg-white text-emerald-700'
                                    }`}>
                                      {decisionSignals.margin === null ? '待确认利润' : `利润率 ${decisionSignals.margin.toFixed(1)}% · ${getProfitLevelLabel(decisionSignals.margin)}`}
                                    </Badge>
                                  </div>
                                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-emerald-800">
                                    <span className="rounded-full border border-emerald-200 bg-white px-2.5 py-1">
                                      数据来源：{profitDataSourceLabel}
                                    </span>
                                    {!hasFxValue && (
                                      <span className="rounded-full border border-emerald-100 bg-white/80 px-2.5 py-1 text-emerald-700/80">
                                        汇率未记录
                                      </span>
                                    )}
                                    {!hasExtraChargeValue && (
                                      <span className="rounded-full border border-emerald-100 bg-white/80 px-2.5 py-1 text-emerald-700/80">
                                        运费/附加费未记录
                                      </span>
                                    )}
                                  </div>
                                  <div className="mt-3 grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-4">
                                    {profitSummaryCards.map((card) => (
                                      <div key={card.key} className="rounded-xl border border-emerald-100 bg-white px-3 py-2.5">
                                        <p className="text-[11px] text-slate-500">{card.label}</p>
                                        <p className={`mt-1 text-sm font-semibold ${card.valueClassName}`}>
                                          {card.value}
                                        </p>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 gap-2.5 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
                                  <div className="rounded-2xl border border-blue-200 bg-blue-50 p-3.5">
                                    <div className="flex items-center gap-2">
                                      <MessageSquare className="h-4 w-4 text-blue-600" />
                                      <h4 className="text-sm font-semibold text-blue-900">业务员提审依据</h4>
                                    </div>
                                    <p className="mt-2 whitespace-pre-wrap text-[13px] leading-6 text-blue-950">
                                      {selectedProfitReviewNote || '未填写提审说明，建议退回补充业务背景、让利原因与风险补救措施。'}
                                    </p>
                                  </div>

                                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3.5">
                                    <div className="flex items-center gap-2">
                                      <AlertCircle className="h-4 w-4 text-amber-600" />
                                      <h4 className="text-sm font-semibold text-amber-900">审批提示</h4>
                                    </div>
                                    <p className="mt-2 text-[13px] leading-6 text-amber-950">{decisionSignals.recommendation}</p>
                                    <div className="mt-2.5 space-y-1.5 text-[13px] text-amber-950">
                                      {decisionSignals.riskFlags.map((flag) => (
                                        <p key={flag}>- {flag}</p>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          }

                          if (detailViewTab === 'feedback') {
                            const quotationDoc = selectedQuotationSource as any;
                            const customerStatus = pickFirstNonEmpty(
                              selectedRequest.relatedDocument?.customerStatus,
                              quotationDoc?.customerStatus,
                            ) || '待确认';
                            const customerRemark = pickFirstNonEmpty(
                              selectedRequest.relatedDocument?.remarks,
                              selectedRequest.relatedDocument?.customerNotes,
                              quotationDoc?.remarks,
                              quotationDoc?.customerNotes,
                            );
                            return (
                              <div className="space-y-2.5">
                                <div className="rounded-2xl border border-blue-200 bg-blue-50 p-3.5">
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div>
                                      <p className="text-sm font-semibold text-blue-900">客户反馈与往来记录</p>
                                      <p className="mt-1 text-[12px] leading-5 text-blue-800">
                                        审批前请确认客户是否提出价格、付款、交期或文本修改方面的要求。
                                      </p>
                                    </div>
                                    <Badge className="h-7 rounded-full border border-blue-200 bg-white px-3 text-xs text-blue-700 shadow-none">
                                      客户状态：{customerStatus}
                                    </Badge>
                                  </div>
                                </div>
                                <div className="grid grid-cols-1 gap-2.5 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
                                  <div className="rounded-2xl border border-slate-200 bg-white p-3.5">
                                    <h4 className="text-sm font-semibold text-slate-900">最近客户反馈</h4>
                                    <p className="mt-2 whitespace-pre-wrap text-[13px] leading-6 text-slate-800">
                                      {decisionSignals.customerFeedback.summary || '当前未读取到明确的客户反馈内容，可结合 QT/SC 正文与业务员说明判断。'}
                                    </p>
                                    <p className="mt-2 text-[11px] text-slate-500">
                                      {decisionSignals.customerFeedback.timestamp
                                        ? `反馈时间：${new Date(decisionSignals.customerFeedback.timestamp).toLocaleString('zh-CN')}`
                                        : '反馈时间：未记录'}
                                    </p>
                                  </div>
                                  <div className="space-y-2.5">
                                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                                      <p className="text-[11px] text-slate-500">客户备注/特殊要求</p>
                                      <p className="mt-1 text-[13px] leading-6 text-slate-800">
                                        {customerRemark || '暂无客户备注或特殊要求。'}
                                      </p>
                                    </div>
                                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                                      <p className="text-[11px] text-slate-500">快捷查看</p>
                                      <div className="mt-2 flex flex-wrap gap-2">
                                        {selectedQuotationSource && (
                                          <Button type="button" variant="outline" className="h-8 rounded-xl px-3 text-[12px]" onClick={() => setDetailViewTab('quote')}>
                                            查看原始QT报价
                                          </Button>
                                        )}
                                        {selectedRequest.type === 'sales_contract' && (
                                          <Button type="button" variant="outline" className="h-8 rounded-xl px-3 text-[12px]" onClick={() => setDetailViewTab('document')}>
                                            查看SC合同正文
                                          </Button>
                                        )}
                                        <Button type="button" variant="outline" className="h-8 rounded-xl px-3 text-[12px]" onClick={() => setDetailViewTab('profit')}>
                                          查看利润计算过程
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          }

                          return (
                            <div className="space-y-2.5">
                              <div className="rounded-2xl border border-slate-200 bg-white p-3.5">
                                <div className="mb-2.5 flex flex-wrap items-center gap-1.5">
                                  <Badge className={`h-7 border px-3 text-[11px] shadow-none ${
                                    needsDirectorReviewActive
                                      ? 'border-orange-200 bg-orange-50 text-orange-700'
                                      : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                  }`}>
                                    {needsDirectorReviewActive ? '需销售总监复审' : '主管可直接审批'}
                                  </Badge>
                                  <Badge variant="outline" className="h-7 px-3 text-[11px]">优先看利润测算，再看正文</Badge>
                                </div>
                                <div className="mb-2.5">
                                  <h4 className="text-sm font-semibold text-slate-900">审批动作</h4>
                                  <p className="mt-0.5 text-[12px] leading-5 text-slate-500">请先完成利润与条款判断，再提交审批结论。</p>
                                </div>
                                {renderApprovalActionPanel()}
                              </div>
                            </div>
                          );
                        })()
                      ) : (
                        // 客户询价单：使用CustomerInquiryView组件
                        <Suspense fallback={<ApprovalPreviewFallback message="正在加载客户询价详情..." />}>
                          <LazyCustomerInquiryView inquiry={selectedRequest.relatedDocument} audience="internal" />
                        </Suspense>
                      )}
                    </>
                  )}
                </div>
              </div>

              {detailViewTab === 'task' && (
                <div
                  key={`approval-side-${selectedRequest.id}-${detailDialogRenderKey}`}
                  ref={approvalPanelRef}
                  className="order-1 min-h-0 overflow-y-auto border-b border-gray-200 bg-white md:order-2 md:border-b-0"
                >
                  <div className="p-3.5 pb-24 md:pb-3.5" />
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
