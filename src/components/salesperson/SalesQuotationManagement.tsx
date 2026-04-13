/**
 * 🔥 报价管理 - 业务员销售报价单管理
 *
 * 功能：
 * 显示从成本询报模块“下推报价管理”生成的 draft 状态 QT 报价单，
 * 数据统一从 Supabase / sales_quotations 加载。
 *
 * 流程：
 * 成本询报 → 点击“下推报价管理” → POST /api/sales-quotations → 保存到数据库 →
 * 报价管理 → GET /api/sales-quotations → 显示报价单列表
 */

import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Checkbox } from '../ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { 
  Search, 
  Eye, 
  Edit, 
  Send, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  Loader2,
  FileText,
  DollarSign,
  Trash2,
  Calculator,
  FileSignature
} from 'lucide-react';
import { useSalesQuotations } from '../../contexts/SalesQuotationContext';
import { useSalesContracts } from '../../contexts/SalesContractContext'; // 🔥 导入销售合同Context
import { useInquiry } from '../../contexts/InquiryContext'; // 🔥 导入询价Context
import { useOrders } from '../../contexts/OrderContext'; // 🔥 导入订单Context
import { sortDocumentFlowRefs } from '../../utils/documentFlowRefOrder';
import { buildPaymentTermsText } from '../../lib/paymentFlow';
import { useQuoteRequirements } from '../../contexts/QuoteRequirementContext'; // 🔥 导入 QR Context（用于溯源回写）
import { salesQuotationService, approvalRecordService, notificationSupabaseService, sharedRoleUiPreferenceService, staffDirectoryService, customerOrganizationService, customerPortalProfileService, customerEnterpriseMemberService } from '../../lib/supabaseService';
import { supabase } from '../../lib/supabase';
import { getCurrentUser } from '../../utils/dataIsolation';
import { toast } from 'sonner@2.0.3';
import { ERP_EVENT_KEYS } from '../../lib/erp-core/events';
import { subscribeErpEvent, emitErpEvent } from '../../lib/erp-core/event-bus';
import { addTombstones, filterNotDeleted, removeTombstonesByMarkers } from '../../lib/erp-core/deletion-tombstone';
import { adaptSalesQuotationToDocumentData, normalizeFlowProductCore } from '../../utils/documentDataAdapters';
import { adaptSalesContractToDocumentData } from '../../utils/documentDataAdapters';
import { getFormalBusinessModelNo } from '../../utils/productModelDisplay';
import { normalizePersonnelEmail } from '../../lib/notification-rules';
import { getPersonnelEmailAliases } from '../../lib/personnelEmail';
import { isSystemOwnerEmail, pickBusinessOwnerEmail } from '../../utils/quotationOwnership';
import { normalizeApprovalNotes } from '../../utils/approvalWorkflow';
import { parseApprovalDecisionComment } from '../../utils/approvalWorkflow';
import { buildManagerDirectorApprovalChain, deriveQtApprovalGovernance } from '../../lib/services/salesApprovalGovernanceService';
import { getColumnStyle, renderColumnResizeHandle } from '../admin/admin-organization-profile/peopleCenterVisuals';
import QuoteCreationIntelligent from '../admin/QuoteCreationIntelligent'; // 🔥 智能报价创建
import type { User as RbacUser } from '../../lib/rbac-config';
import { ERP_LIST_UI_SPEC_V1 } from '../shared/erpListUiSpec';
// ❌ 已禁用：文件不存在
// import { CustomerInquiryView } from '../admin/CustomerInquiryView'; // 🔥 客户询价单查看
import { QuotationView } from './QuotationView'; // 🔥 报价单查看（使用文档中心模版）

const normalizeProfitPercent = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  if (parsed > 0 && parsed < 1) return parsed * 100;
  return parsed;
};

const getQuotationProfitMetrics = (qt: any) => {
  const totalAmount = Number(qt?.totalAmount ?? qt?.totalPrice ?? 0);
  const totalCost = Number(qt?.totalCost ?? 0);
  const totalProfit = Number.isFinite(Number(qt?.totalProfit))
    ? Number(qt.totalProfit)
    : (totalAmount - totalCost);
  const storedProfitRate = normalizeProfitPercent(
    qt?.profitRate ?? qt?.profit_rate ?? qt?.profitMargin,
    Number.NaN,
  );
  const profitRate = Number.isFinite(storedProfitRate)
    ? storedProfitRate
    : totalCost > 0
      ? (totalProfit / totalCost) * 100
      : 0;

  return {
    totalAmount,
    totalCost,
    totalProfit,
    profitRate,
  };
};

const hasMeaningfulDisplayValue = (value: unknown) => {
  const normalized = String(value || '').trim();
  if (!normalized) return false;
  return !['n/a', 'na', 'null', 'undefined', '-'].includes(normalized.toLowerCase());
};

const formatRegionLabel = (value: unknown) => {
  const normalized = String(value || '').trim().toUpperCase()
  if (normalized === 'NA' || normalized === 'NORTH AMERICA') return '北美'
  if (normalized === 'SA' || normalized === 'SOUTH AMERICA') return '南美'
  if (normalized === 'EA' || normalized === 'EMEA' || normalized === 'EUROPE & AFRICA') return '欧非'
  return hasMeaningfulDisplayValue(value) ? String(value).trim() : '-'
}

const extractLatestApprovalRejectionComment = (qt: any) => {
  const chain = Array.isArray(qt?.approvalChain) ? qt.approvalChain : [];
  const rejected = chain.filter((step: any) => step?.status === 'rejected' && String(step?.comment || '').trim());
  const latest = rejected[rejected.length - 1];
  if (!latest?.comment) return '';
  const parsed = parseApprovalDecisionComment(String(latest.comment || ''));
  return parsed.body || parsed.raw || '';
}

const normalizeApprovalCommentText = (value: unknown) => {
  const normalized = String(value || '').trim();
  if (!normalized) return '';
  const parsed = parseApprovalDecisionComment(normalized);
  return String(parsed.body || parsed.raw || '').trim();
};

const extractLatestRejectedApprovalHistoryComment = (approvalHistory: unknown) => {
  const history = Array.isArray(approvalHistory) ? approvalHistory : [];
  const rejectedEntries = history.filter((item: any) => {
    const decision = String(
      item?.status ||
      item?.decision ||
      item?.action ||
      item?.result ||
      '',
    ).trim().toLowerCase();
    return ['rejected', 'reject', 'returned', 'return'].includes(decision);
  });
  const latest = rejectedEntries[rejectedEntries.length - 1];
  return normalizeApprovalCommentText(
    latest?.comment ||
    latest?.notes ||
    latest?.body ||
    latest?.reason ||
    latest?.message ||
    latest?.remark ||
    '',
  );
};

const buildApprovalRejectionCommentIndex = (records: any[]) => {
  const index: Record<string, string> = {};

  const bind = (key: unknown, comment: string) => {
    const normalizedKey = String(key || '').trim();
    if (!normalizedKey || !comment || index[normalizedKey]) return;
    index[normalizedKey] = comment;
  };

  (Array.isArray(records) ? records : []).forEach((record: any) => {
    const comment = extractLatestRejectedApprovalHistoryComment(record?.approvalHistory);
    if (!comment) return;

    bind(record?.relatedDocumentUuid, comment);
    bind(record?.relatedDocumentId, comment);
    bind(record?.relatedDocument?.id, comment);
    bind(record?.relatedDocument?.qtNumber, comment);
    bind(record?.relatedDocument?.quotationNumber, comment);
    bind(record?.relatedDocument?.documentNumber, comment);
  });

  return index;
};

const SALES_QUOTATION_CACHE_PREFIX = 'sales_quotation_management_cache_v1';
const SALES_QUOTATION_TABLE_UI_PREFERENCE_KEY = 'sales_quotation_management_table_column_widths_v2';

type SalesQuotationColumnKey =
  | 'select'
  | 'index'
  | 'date'
  | 'qtNumber'
  | 'documents'
  | 'region'
  | 'customer'
  | 'product'
  | 'quantity'
  | 'unitPrice'
  | 'amount'
  | 'approvalStatus'
  | 'customerStatus'
  | 'actions';

const SALES_QUOTATION_COLUMN_ORDER: SalesQuotationColumnKey[] = [
  'select',
  'index',
  'date',
  'qtNumber',
  'region',
  'customer',
  'product',
  'quantity',
  'unitPrice',
  'amount',
  'approvalStatus',
  'customerStatus',
  'actions',
];

const SALES_QUOTATION_COLUMN_MIN_WIDTHS: Record<SalesQuotationColumnKey, number> = {
  select: 36,
  index: 56,
  date: 104,
  qtNumber: 172,
  documents: 0,
  region: 64,
  customer: 120,
  product: 150,
  quantity: 88,
  unitPrice: 84,
  amount: 164,
  approvalStatus: 92,
  customerStatus: 96,
  actions: 180,
};

const SALES_QUOTATION_TABLE_DEFAULT_WIDTHS: Record<SalesQuotationColumnKey, number> = {
  select: 48,
  index: 64,
  date: 120,
  qtNumber: 220,
  documents: 0,
  region: 64,
  customer: 160,
  product: 208,
  quantity: 96,
  unitPrice: 80,
  amount: 176,
  approvalStatus: 96,
  customerStatus: 80,
  actions: 156,
};

const mergeStoredQuotationColumnWidths = (
  stored: Partial<Record<SalesQuotationColumnKey, number>> | null | undefined,
) => {
  const next = { ...SALES_QUOTATION_TABLE_DEFAULT_WIDTHS };
  SALES_QUOTATION_COLUMN_ORDER.forEach((key) => {
    const candidate = Number(stored?.[key]);
    if (Number.isFinite(candidate) && candidate > 0) {
      next[key] = Math.max(SALES_QUOTATION_COLUMN_MIN_WIDTHS[key], Math.round(candidate));
    }
  });
  return next;
};

const formatSalesQuotationDateOnly = (value?: string | null) => {
  const text = String(value || '').trim();
  if (!text) return '-';
  return text.includes('T') ? text.slice(0, 10) : text;
};

const distributeQuotationColumnWidths = (containerWidth: number) => {
  const base = { ...SALES_QUOTATION_TABLE_DEFAULT_WIDTHS };
  const defaultTotal = SALES_QUOTATION_COLUMN_ORDER.reduce((sum, key) => sum + base[key], 0);
  if (containerWidth <= defaultTotal) return base;

  const scale = containerWidth / defaultTotal;
  const next = SALES_QUOTATION_COLUMN_ORDER.reduce((acc, key) => {
    acc[key] = Math.max(
      SALES_QUOTATION_COLUMN_MIN_WIDTHS[key],
      Math.round(base[key] * scale),
    );
    return acc;
  }, {} as Record<SalesQuotationColumnKey, number>);

  const adjustedTotal = SALES_QUOTATION_COLUMN_ORDER.reduce((sum, key) => sum + next[key], 0);
  const remainder = containerWidth - adjustedTotal;
  if (remainder !== 0) {
    next.actions = Math.max(
      SALES_QUOTATION_COLUMN_MIN_WIDTHS.actions,
      next.actions + remainder,
    );
  }

  return next;
};

const fitQuotationColumnWidthsToContainer = (
  preferred: Record<SalesQuotationColumnKey, number>,
  containerWidth: number,
) => {
  if (!Number.isFinite(containerWidth) || containerWidth <= 0) return preferred;

  const minimumTotal = SALES_QUOTATION_COLUMN_ORDER.reduce(
    (sum, key) => sum + SALES_QUOTATION_COLUMN_MIN_WIDTHS[key],
    0,
  );

  if (containerWidth <= minimumTotal) {
    const scale = containerWidth / minimumTotal;
    const compressed = SALES_QUOTATION_COLUMN_ORDER.reduce((acc, key) => {
      acc[key] = Math.max(24, Math.round(SALES_QUOTATION_COLUMN_MIN_WIDTHS[key] * scale));
      return acc;
    }, {} as Record<SalesQuotationColumnKey, number>);

    const compressedTotal = SALES_QUOTATION_COLUMN_ORDER.reduce((sum, key) => sum + compressed[key], 0);
    const compressedRemainder = Math.round(containerWidth - compressedTotal);
    if (compressedRemainder !== 0) {
      compressed.actions = Math.max(24, compressed.actions + compressedRemainder);
    }
    return compressed;
  }

  const base = SALES_QUOTATION_COLUMN_ORDER.reduce((acc, key) => {
    acc[key] = SALES_QUOTATION_COLUMN_MIN_WIDTHS[key];
    return acc;
  }, {} as Record<SalesQuotationColumnKey, number>);

  const preferredExtra = SALES_QUOTATION_COLUMN_ORDER.reduce((sum, key) => {
    return sum + Math.max((preferred[key] || 0) - SALES_QUOTATION_COLUMN_MIN_WIDTHS[key], 0);
  }, 0);

  const distributableWidth = containerWidth - minimumTotal;
  const next = { ...base };

  if (preferredExtra > 0 && distributableWidth > 0) {
    SALES_QUOTATION_COLUMN_ORDER.forEach((key) => {
      const extra = Math.max((preferred[key] || 0) - SALES_QUOTATION_COLUMN_MIN_WIDTHS[key], 0);
      next[key] += Math.round((extra / preferredExtra) * distributableWidth);
    });
  }

  const total = SALES_QUOTATION_COLUMN_ORDER.reduce((sum, key) => sum + next[key], 0);
  const remainder = Math.round(containerWidth - total);
  if (remainder !== 0) {
    next.actions = Math.max(24, next.actions + remainder);
  }

  return next;
};

const normalizeSharedQuotationPreferenceRole = (role?: string | null) => {
  const normalized = String(role || '').trim();
  if (!normalized) return 'Sales_Rep';
  return normalized;
};

const buildSalesQuotationCacheKey = (email?: string | null, region?: string | null) => {
  const normalizedEmail = String(email || '').trim().toLowerCase() || 'anonymous';
  const normalizedRegion = String(region || '').trim().toLowerCase() || 'all';
  return `${SALES_QUOTATION_CACHE_PREFIX}:${normalizedEmail}:${normalizedRegion}`;
};

const readSalesQuotationCache = (email?: string | null, region?: string | null) => {
  try {
    const raw = localStorage.getItem(buildSalesQuotationCacheKey(email, region));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeSalesQuotationCache = (email: string | null | undefined, region: string | null | undefined, rows: any[]) => {
  try {
    localStorage.setItem(
      buildSalesQuotationCacheKey(email, region),
      JSON.stringify(Array.isArray(rows) ? rows : []),
    );
  } catch {}
};

const quotationRowCompletenessScore = (qt: any) => {
  if (!qt || typeof qt !== 'object') return 0;
  const financials = getQuotationProfitMetrics(qt);
  let score = 0;
  if (hasMeaningfulDisplayValue(qt?.customerCompany)) score += 3;
  if (hasMeaningfulDisplayValue(qt?.customerEmail)) score += 2;
  if (hasMeaningfulDisplayValue(qt?.region)) score += 1;
  if (Array.isArray(qt?.items) && qt.items.length > 0) score += 4;
  if (financials.totalAmount > 0) score += 4;
  if (financials.totalCost > 0) score += 3;
  if (financials.totalProfit !== 0) score += 2;
  if (financials.profitRate > 0) score += 2;
  if (hasMeaningfulDisplayValue(qt?.approvalStatus) && String(qt.approvalStatus) !== 'draft') score += 2;
  if (hasMeaningfulDisplayValue(qt?.customerStatus) && String(qt.customerStatus) !== 'not_sent') score += 1;
  if (hasMeaningfulDisplayValue(qt?.updatedAt || qt?.updated_at)) score += 1;
  return score;
};

const getCustomerStatusPriority = (status: any) => {
  switch (String(status || '').trim()) {
    case 'accepted':
      return 5;
    case 'viewed':
      return 4;
    case 'sent':
      return 3;
    case 'negotiating':
      return 2;
    case 'rejected':
      return 2;
    case 'expired':
      return 1;
    case 'not_sent':
    default:
      return 0;
  }
};

const getApprovalStatusPriority = (status: any) => {
  switch (String(status || '').trim()) {
    case 'contract_created':
      return 6;
    case 'approved':
      return 5;
    case 'pending_director':
      return 4;
    case 'pending_supervisor':
      return 4;
    case 'pending_approval':
      return 4;
    case 'rejected':
      return 3;
    case 'draft':
    default:
      return 0;
  }
};

const mergeQuotationRowPair = (left: any, right: any) => {
  const leftScore = quotationRowCompletenessScore(left);
  const rightScore = quotationRowCompletenessScore(right);
  const primary = rightScore > leftScore ? right : left;
  const secondary = primary === left ? right : left;

  const merged = { ...primary };

  const preferredTextKeys = [
    'customerCompany',
    'customerName',
    'customerEmail',
    'region',
    'salesPerson',
    'salesPersonName',
    'qrNumber',
    'inqNumber',
  ];

  preferredTextKeys.forEach((key) => {
    if (!hasMeaningfulDisplayValue((merged as any)[key]) && hasMeaningfulDisplayValue(secondary?.[key])) {
      (merged as any)[key] = secondary[key];
    }
  });

  const preferredNumericKeys = ['totalPrice', 'totalAmount', 'totalCost', 'totalProfit', 'profitRate'];
  preferredNumericKeys.forEach((key) => {
    const currentValue = Number((merged as any)?.[key] ?? 0);
    const fallbackValue = Number(secondary?.[key] ?? 0);
    if ((!Number.isFinite(currentValue) || currentValue === 0) && Number.isFinite(fallbackValue) && fallbackValue !== 0) {
      (merged as any)[key] = fallbackValue;
    }
  });

  if ((!Array.isArray(merged.items) || merged.items.length === 0) && Array.isArray(secondary?.items) && secondary.items.length > 0) {
    merged.items = secondary.items;
  }

  if (!merged.documentDataSnapshot && secondary?.documentDataSnapshot) {
    merged.documentDataSnapshot = secondary.documentDataSnapshot;
  }
  if (!merged.templateSnapshot && secondary?.templateSnapshot) {
    merged.templateSnapshot = secondary.templateSnapshot;
  }

  const mergedCustomerStatusPriority = getCustomerStatusPriority(merged?.customerStatus);
  const secondaryCustomerStatusPriority = getCustomerStatusPriority(secondary?.customerStatus);
  if (secondaryCustomerStatusPriority > mergedCustomerStatusPriority) {
    merged.customerStatus = secondary.customerStatus;
  }

  const mergedApprovalStatusPriority = getApprovalStatusPriority(merged?.approvalStatus);
  const secondaryApprovalStatusPriority = getApprovalStatusPriority(secondary?.approvalStatus);
  if (secondaryApprovalStatusPriority > mergedApprovalStatusPriority) {
    merged.approvalStatus = secondary.approvalStatus;
  }

  if ((!Array.isArray(merged.approvalChain) || merged.approvalChain.length === 0) && Array.isArray(secondary?.approvalChain) && secondary.approvalChain.length > 0) {
    merged.approvalChain = secondary.approvalChain;
  }

  if (!merged.sentAt && secondary?.sentAt) {
    merged.sentAt = secondary.sentAt;
  }
  if (!merged.sentToCustomerAt && secondary?.sentToCustomerAt) {
    merged.sentToCustomerAt = secondary.sentToCustomerAt;
  }
  if ((!merged.customerResponse || typeof merged.customerResponse !== 'object') && secondary?.customerResponse) {
    merged.customerResponse = secondary.customerResponse;
  }

  return merged;
};

const mergeQuotationRows = (rows: any[]) => {
  const merged = new Map<string, any>();

  rows.forEach((qt) => {
    const key = getQuotationIdentityKey(qt);
    if (!key) return;
    const existing = merged.get(key);
    merged.set(key, existing ? mergeQuotationRowPair(existing, qt) : qt);
  });

  return Array.from(merged.values()).sort((a, b) =>
    String(b?.createdAt || b?.created_at || '').localeCompare(
      String(a?.createdAt || a?.created_at || ''),
    ),
  );
};

const normalizeQuotationItemsForManagement = (items: any[], qt: any, fallbackQt?: any) => {
  const totalPrice = Number(fallbackQt?.totalPrice ?? fallbackQt?.totalAmount ?? qt?.totalPrice ?? qt?.totalAmount ?? 0);
  const totalCost = Number(fallbackQt?.totalCost ?? qt?.totalCost ?? 0);

  return (Array.isArray(items) ? items : [])
    .map((item: any, index: number) => {
      const quantity = Number(item?.quantity ?? item?.qty ?? item?.pcs ?? item?.count ?? 0);
      const fallbackUnitPrice = quantity > 0 ? totalPrice / quantity : 0;
      const fallbackCostPrice = quantity > 0 ? totalCost / quantity : 0;
      const salesPrice = Number(item?.salesPrice ?? item?.unitPrice ?? item?.quotePrice ?? item?.sales_price ?? fallbackUnitPrice ?? 0);
      const costPrice = Number(item?.costPrice ?? item?.cost_price ?? fallbackCostPrice ?? 0);
      const productName = String(
        item?.productName ??
        item?.name ??
        item?.product_name ??
        item?.itemName ??
        item?.item_name ??
        item?.title ??
        item?.description ??
        item?.modelNo ??
        item?.model_no ??
        item?.specification ??
        '',
      ).trim();

      return {
        ...item,
        id: item?.id || `${String(qt?.qtNumber || qt?.id || 'qt')}-${index + 1}`,
        productName: productName || `Product ${index + 1}`,
        modelNo: item?.modelNo || item?.model_no || '',
        specification: item?.specification || '',
        quantity,
        unit: item?.unit || 'PCS',
        costPrice,
        salesPrice,
        unitPrice: salesPrice,
        totalCost: Number(item?.totalCost ?? item?.total_cost ?? (costPrice * quantity)),
        totalPrice: Number(item?.totalPrice ?? item?.total_price ?? item?.totalAmount ?? (salesPrice * quantity)),
        currency: item?.currency || fallbackQt?.currency || qt?.currency || 'USD',
        remarks: item?.remarks || '',
      };
    })
    .filter((item: any) => item.quantity > 0 || item.salesPrice > 0 || item.totalPrice > 0);
};

const resolveQuotationItemsForSync = (
  qt: any,
  options: {
    effectiveQuotations: any[];
    quoteRequirements: any[];
  },
) => {
  const currentItems = normalizeQuotationItemsForManagement(qt?.items || [], qt);
  if (currentItems.length > 0) return currentItems;

  const siblingQuotation = (Array.isArray(options.effectiveQuotations) ? options.effectiveQuotations : []).find((candidate) => {
    if (String(candidate?.id || '') === String(qt?.id || '')) return false;
    const sameQr = String(candidate?.qrNumber || '').trim() && String(candidate?.qrNumber || '').trim() === String(qt?.qrNumber || '').trim();
    const sameInquiry = String(candidate?.inqNumber || '').trim() && String(candidate?.inqNumber || '').trim() === String(qt?.inqNumber || '').trim();
    return (sameQr || sameInquiry) && Array.isArray(candidate?.items) && candidate.items.length > 0;
  });
  const siblingItems = normalizeQuotationItemsForManagement(siblingQuotation?.items || [], qt, siblingQuotation);
  if (siblingItems.length > 0) {
    return siblingItems.map((item: any) => ({
      ...item,
      salesPrice: item.salesPrice || item.unitPrice || 0,
      unitPrice: item.salesPrice || item.unitPrice || 0,
    }));
  }

  const relatedQr = (Array.isArray(options.quoteRequirements) ? options.quoteRequirements : []).find(
    (req: any) => String(req?.requirementNo || req?.qrNumber || '').trim() === String(qt?.qrNumber || '').trim(),
  );
  const qrItems = normalizeQuotationItemsForManagement(relatedQr?.items || [], qt);
  if (qrItems.length > 0) return qrItems;

  const snapshotItems = normalizeQuotationItemsForManagement(
    qt?.documentDataSnapshot?.products
      || qt?.templateSnapshot?.products
      || [],
    qt,
  );
  if (snapshotItems.length > 0) return snapshotItems;

  const fallbackTotalPrice = Number(qt?.totalPrice ?? qt?.totalAmount ?? 0);
  const fallbackTotalCost = Number(qt?.totalCost ?? 0);
  if (fallbackTotalPrice > 0) {
    const normalizedFallback = normalizeFlowProductCore(
      qt?.primaryProduct
        || qt?.documentDataSnapshot?.products?.[0]
        || qt?.templateSnapshot?.products?.[0]
        || {},
      0,
    );
    return [
      {
        id: `${String(qt?.qtNumber || qt?.id || 'qt')}-1`,
        productName: normalizedFallback.productName || 'Product 1',
        productNameEn: normalizedFallback.productNameEn,
        productNameZh: normalizedFallback.productNameZh,
        modelNo: normalizedFallback.modelNo || '',
        imageUrl: normalizedFallback.imageUrl || '',
        specification: normalizedFallback.specification || '',
        specificationEn: normalizedFallback.specificationEn,
        specificationZh: normalizedFallback.specificationZh,
        quantity: normalizedFallback.quantity || 1,
        unit: normalizedFallback.unit || 'PCS',
        costPrice: fallbackTotalCost,
        salesPrice: fallbackTotalPrice,
        unitPrice: fallbackTotalPrice,
        totalCost: fallbackTotalCost,
        totalPrice: fallbackTotalPrice,
        currency: qt?.currency || 'USD',
        remarks: '',
      },
    ];
  }

  return [];
};

const matchesQuotationRow = (left: any, right: any) => {
  const leftId = String(left?.id || '').trim();
  const rightId = String(right?.id || '').trim();
  const leftQtNumber = getQuotationDisplayNumber(left);
  const rightQtNumber = getQuotationDisplayNumber(right);

  return Boolean(
    (leftId && rightId && leftId === rightId) ||
    (leftQtNumber && rightQtNumber && leftQtNumber === rightQtNumber),
  );
};

const PLACEHOLDER_DISPLAY_VALUES = new Set([
  '',
  '-',
  '--',
  'n/a',
  'na',
  'null',
  'undefined',
  'customer@example.com',
]);

const normalizeMeaningfulText = (value: any) => {
  const text = String(value ?? '').trim();
  return PLACEHOLDER_DISPLAY_VALUES.has(text.toLowerCase()) ? '' : text;
};

const getQuotationDisplayNumber = (qt: any) =>
  normalizeMeaningfulText(
    qt?.qtNumber ??
    qt?.quotationNumber ??
    qt?.quoteNumber ??
    qt?.number ??
    qt?.internalNo,
  );

const getQuotationIdentityKey = (qt: any) =>
  getQuotationDisplayNumber(qt) || String(qt?.id || '').trim();

interface SalesQuotationManagementProps {
  highlightQtNumber?: string; // 🔥 高亮显示的报价单号
  onNavigateToInquiryWithHighlight?: (inquiryNumber: string) => void;
  onNavigateToCostInquiryWithHighlight?: (qrNumber: string) => void;
  onNavigateToOrders?: () => void; // 🔥 导航到订单管理的回调
  onNavigateToOrdersWithHighlight?: (scNumber: string) => void; // 🔥 导航到订单管理并高亮SC单号
  currentUser?: RbacUser | null;
  initialQuotations?: any[];
}

export function SalesQuotationManagement({ 
  highlightQtNumber, 
  onNavigateToInquiryWithHighlight,
  onNavigateToCostInquiryWithHighlight,
  onNavigateToOrders, 
  onNavigateToOrdersWithHighlight,
  currentUser: dashboardCurrentUser = null,
  initialQuotations = [],
}: SalesQuotationManagementProps = {}) {
  const [isSavingPriceCalculation, setIsSavingPriceCalculation] = useState(false);
  const stickyQtNumberRef = React.useRef<string | undefined>(undefined);
  const ownerRepairAttemptedRef = React.useRef<Set<string>>(new Set());
  const REGIONAL_MANAGER_EMAILS: Record<string, string> = {
    NA: 'salesmanager-na@cosunchina.com',
    'North America': 'salesmanager-na@cosunchina.com',
    SA: 'salesmanager-sa@cosunchina.com',
    'South America': 'salesmanager-sa@cosunchina.com',
    EA: 'salesmanager-ea@cosunchina.com',
    EMEA: 'salesmanager-ea@cosunchina.com',
    'Europe & Africa': 'salesmanager-ea@cosunchina.com',
    Other: 'salesmanager-na@cosunchina.com',
  };

  const SALES_DIRECTOR_EMAIL = 'sales.director@cosunchina.com';

  const resolveStructuredApprovalNotes = React.useCallback((qt: any, mode: 'submit' | 'review') => {
    const amount = Number(qt?.totalAmount || qt?.totalPrice || 0);
    const baseNote = String(qt?.approvalNotes || qt?.notes || '').trim();
    const customerName = qt?.customerCompany || qt?.customerName || '当前客户';
    const reviewReason = String(qt?.customerResponse?.comment || '').trim();
    return normalizeApprovalNotes(baseNote, {
      pricingStrategy: mode === 'review'
        ? '客户对当前报价未接受，申请复核定价逻辑与对客方案。'
        : '按当前成本核算、利润率与条款配置提交审批。',
      customerBackground: `${customerName}${amount >= 20000 ? '，当前金额达到总监复审阈值。' : '，当前金额在主管审批权限内。'}`,
      specialConsiderations: mode === 'review'
        ? `本单已进入客户反馈阶段，需结合反馈调整报价策略。${reviewReason ? `客户反馈：${reviewReason}` : ''}`
        : '请重点结合客户价值、付款条件与交期承诺综合判断。',
      riskFocus: reviewReason
        ? `客户已提出异议：${reviewReason}`
        : '请关注利润率、付款条件、交期承诺及特殊条款风险。',
    });
  }, []);

  const pushApprovalBridgeItem = async (item: any) => {
    const request = item?.request || {};
    const currentApprover = item?.currentApprover || request?.currentApprover || '';
    const currentApproverRole = request?.currentApproverRole || '';

    // 业务审批记录必须先落 Supabase。
    const saved = await approvalRecordService.upsert({
      ...request,
      currentApprover,
      currentApproverRole,
    });
    if (!saved) {
      throw new Error('approval_records upsert failed');
    }
  };

  const sendQuotationApprovalNotification = async (recipientEmail: string, qt: any, amount: number, stageLabel: string) => {
    if (!recipientEmail) return;

    await notificationSupabaseService.send({
      recipient_email: recipientEmail,
      type: 'quotation_pending_approval',
      title: `📋 报价待审批 - ${stageLabel}`,
      message: `${qt.qtNumber || 'QT'} 待审批，客户：${qt.customerCompany || qt.customerName || 'Customer'}，金额：${qt.currency || 'USD'} ${amount}`,
      data: {
        quotationNumber: qt.qtNumber || qt.id,
        quotationId: qt.id,
        stage: stageLabel,
        amount,
        currency: qt.currency || 'USD',
        region: qt.region || currentUser?.region || 'NA',
      },
    });
  };

  const mapQuoteDataToServerLike = (quoteData: any, currentQt: any) => ({
    totalPrice: quoteData.totalAmount ?? currentQt?.totalPrice ?? 0,
    totalAmount: quoteData.totalAmount ?? currentQt?.totalAmount ?? 0,
    totalCost: quoteData.totalCost ?? currentQt?.totalCost ?? 0,
    totalProfit: quoteData.totalProfit ?? currentQt?.totalProfit ?? 0,
    profitRate: normalizeProfitPercent(quoteData.profitRate ?? quoteData.profitMargin ?? currentQt?.profitRate ?? 0, 0),
    pricingDefaults: quoteData.pricingDefaults ?? quoteData.globalDefaults ?? currentQt?.pricingDefaults ?? currentQt?.globalDefaults ?? null,
    globalDefaults: quoteData.pricingDefaults ?? quoteData.globalDefaults ?? currentQt?.pricingDefaults ?? currentQt?.globalDefaults ?? null,
    validUntil: quoteData.validUntil ?? currentQt?.validUntil ?? null,
    notes: quoteData.approvalNotes ?? currentQt?.notes ?? '',
    items: Array.isArray(quoteData.items)
      ? quoteData.items.map((item: any) => ({
          id: item.id,
          productName: normalizeFlowProductCore(item).productName,
          productNameEn: normalizeFlowProductCore(item).productNameEn,
          productNameZh: normalizeFlowProductCore(item).productNameZh,
          modelNo: normalizeFlowProductCore(item).modelNo,
          imageUrl: normalizeFlowProductCore(item).imageUrl,
          specification: normalizeFlowProductCore(item).specification,
          specificationEn: normalizeFlowProductCore(item).specificationEn,
          specificationZh: normalizeFlowProductCore(item).specificationZh,
          quantity: normalizeFlowProductCore(item).quantity,
          unit: normalizeFlowProductCore(item).unit,
          costPrice: item.costPrice ?? item.costUSD ?? 0,
          salesPrice: item.salesPrice ?? item.quotePrice ?? 0,
          profitMargin: normalizeProfitPercent(item.profitMargin ?? 0, 0),
          profit: item.profit ?? item.profitUSD ?? 0,
          totalCost: item.totalCost ?? ((item.costPrice ?? item.costUSD ?? 0) * (item.quantity ?? 0)),
          totalPrice: item.totalPrice ?? item.totalAmount ?? ((item.salesPrice ?? item.quotePrice ?? 0) * (item.quantity ?? 0)),
          currency: item.currency ?? 'USD',
          hsCode: item.hsCode ?? '',
          sourcePricing: item.sourcePricing ?? item.pricingBasis ?? null,
          remarks: item.remarks ?? '',
        }))
      : currentQt?.items ?? [],
  });

  const mapQuoteDataToQuotationUpdate = (quoteData: any, currentQt: any) => {
    const base = mapQuoteDataToServerLike(quoteData, currentQt);
    return {
      ...base,
      documentDataSnapshot: adaptSalesQuotationToDocumentData({
        ...currentQt,
        ...base,
      }),
    };
  };

  const { quotations: contextQuotations, updateQuotation } = useSalesQuotations();
  const quotationsRef = React.useRef(contextQuotations);
  quotationsRef.current = contextQuotations;
  const { contracts: salesContracts, createContract, getContractByQuotationNumber } = useSalesContracts(); // 🔥 获取销售合同
  const { inquiries } = useInquiry();
  const { orders, addOrder } = useOrders(); // 🔥 获取订单和添加订单函数
  const {
    requirements: quoteRequirements,
    updateRequirement: updateQuoteRequirement,
    refreshQuoteRequirementsFromApi,
  } = useQuoteRequirements(); // 🔥 获取 QR 和更新函数
  const [currentUser, setCurrentUser] = useState<any>(() => dashboardCurrentUser || getCurrentUser());
  const [expandedRelatedIds, setExpandedRelatedIds] = useState<string[]>([]);
  const quotationTableContainerRef = React.useRef<HTMLDivElement | null>(null);
  const quotationColumnResizeRef = React.useRef<{
    key: SalesQuotationColumnKey;
    startX: number;
    startWidth: number;
  } | null>(null);
  const [quotationTableContainerWidth, setQuotationTableContainerWidth] = useState(0);
  const [quotationColumnWidths, setQuotationColumnWidths] = useState<Record<SalesQuotationColumnKey, number>>(SALES_QUOTATION_TABLE_DEFAULT_WIDTHS);
  const [quotationHasCustomWidths, setQuotationHasCustomWidths] = useState(false);
  const [quotationPreferenceHydrated, setQuotationPreferenceHydrated] = useState(false);
  const quotationPreferenceRoleScope = useMemo(
    () => normalizeSharedQuotationPreferenceRole(currentUser?.userRole || currentUser?.role),
    [currentUser?.role, currentUser?.userRole],
  );

  const resolveQuotationOwnerEmail = React.useCallback((qt: any) => {
    const relatedQr = quoteRequirements.find(
      (req) => String(req?.requirementNo || '').trim() === String(qt?.qrNumber || '').trim()
    );
    const relatedInquiry = inquiries.find((inq) =>
      String(inq?.inquiryNumber || inq?.id || '').trim() === String(qt?.inqNumber || '').trim()
    );

    const ownerCandidates = [
      relatedQr?.requestedBy,
      relatedInquiry?.salesRepEmail,
      relatedInquiry?.assignedTo,
      relatedQr?.salesPerson,
      relatedQr?.salesPersonEmail,
      relatedQr?.createdBy,
      qt?.salesPerson,
      (relatedQr as any)?.salesPerson,
      (relatedQr as any)?.salesPersonEmail,
      (relatedQr as any)?.sourceInquiry?.salesRepEmail,
      (relatedQr as any)?.sourceInquiry?.assignedTo,
    ];

    return pickBusinessOwnerEmail(ownerCandidates, qt?.region || relatedQr?.region, qt?.salesPerson || '');
  }, [inquiries, quoteRequirements]);

  const resolveQuotationCustomerFields = React.useCallback((qt: any) => {
    const relatedQr = quoteRequirements.find(
      (req) => String(req?.requirementNo || '').trim() === String(qt?.qrNumber || '').trim()
    );
    const relatedInquiry = inquiries.find((inq) =>
      String(inq?.inquiryNumber || inq?.id || '').trim() === String(qt?.inqNumber || relatedQr?.sourceInquiryNumber || relatedQr?.sourceInquiryId || '').trim()
    );

    return {
      customerEmail:
        normalizeMeaningfulText(qt?.customerEmail)
        || normalizeMeaningfulText(relatedQr?.customerEmail)
        || normalizeMeaningfulText(relatedInquiry?.customerEmail)
        || normalizeMeaningfulText(relatedInquiry?.buyerEmail)
        || '',
      customerName:
        normalizeMeaningfulText(qt?.customerName)
        || normalizeMeaningfulText(relatedQr?.customerName)
        || normalizeMeaningfulText(relatedInquiry?.contactPerson)
        || normalizeMeaningfulText(relatedInquiry?.customerName)
        || '',
      customerCompany:
        normalizeMeaningfulText(qt?.customerCompany)
        || normalizeMeaningfulText(relatedQr?.customerCompany)
        || normalizeMeaningfulText(relatedInquiry?.buyerCompany)
        || '',
      region:
        normalizeMeaningfulText(qt?.region)
        || normalizeMeaningfulText(relatedQr?.region)
        || normalizeMeaningfulText(relatedInquiry?.regionCode)
        || normalizeMeaningfulText(relatedInquiry?.region)
        || currentUser?.region
        || 'NA',
      inqNumber:
        normalizeMeaningfulText(qt?.inqNumber)
        || normalizeMeaningfulText(relatedQr?.sourceInquiryNumber)
        || normalizeMeaningfulText(relatedInquiry?.inquiryNumber)
        || '',
    };
  }, [currentUser?.region, inquiries, quoteRequirements]);

  const hydrateQuotationCustomerFields = React.useCallback(async (baseFields: {
    customerEmail: string;
    customerName: string;
    customerCompany: string;
    region: string;
  }) => {
    const normalizedEmail = String(baseFields.customerEmail || '').trim().toLowerCase();
    if (!normalizedEmail) return baseFields;

    let nextName = String(baseFields.customerName || '').trim();
    let nextCompany = String(baseFields.customerCompany || '').trim();

    try {
      const [organizationByEmail, profile] = await Promise.all([
        customerOrganizationService.getByEmail(normalizedEmail).catch(() => null),
        customerPortalProfileService.getByLoginEmail(normalizedEmail).catch(() => null),
      ]);

      let organization = organizationByEmail;
      if (!organization && profile?.authUserId) {
        const enterpriseAuthUserId = await customerEnterpriseMemberService
          .resolveEnterpriseAuthUserIdForUser(String(profile.authUserId || '').trim(), normalizedEmail)
          .catch(() => null);
        if (enterpriseAuthUserId) {
          organization = await customerOrganizationService.getByAuthUser(enterpriseAuthUserId).catch(() => null);
        }
      }

      if (!nextCompany) {
        nextCompany = String(organization?.companyName || '').trim();
      }
      if (!nextName) {
        nextName = String(organization?.contactPerson || profile?.displayName || '').trim();
      }
    } catch {
      // 主数据兜底失败时，不阻塞发送。
    }

    return {
      ...baseFields,
      customerEmail: normalizedEmail,
      customerName: nextName,
      customerCompany: nextCompany,
    };
  }, []);

  useEffect(() => {
    const syncCurrentUser = () => setCurrentUser(dashboardCurrentUser || getCurrentUser());
    syncCurrentUser();
    window.addEventListener('userChanged', syncCurrentUser as EventListener);
    window.addEventListener('storage', syncCurrentUser);
    return () => {
      window.removeEventListener('userChanged', syncCurrentUser as EventListener);
      window.removeEventListener('storage', syncCurrentUser);
    };
  }, [dashboardCurrentUser]);

  useEffect(() => {
    if (highlightQtNumber) {
      stickyQtNumberRef.current = highlightQtNumber;
    }
  }, [highlightQtNumber]);

  useEffect(() => {
    let cancelled = false;
    const loadRemotePreference = async () => {
      setQuotationPreferenceHydrated(false);
      try {
        const value = await sharedRoleUiPreferenceService.get(
          quotationPreferenceRoleScope,
          SALES_QUOTATION_TABLE_UI_PREFERENCE_KEY,
        );
        if (cancelled) return;
        if (value) {
          setQuotationColumnWidths(
            mergeStoredQuotationColumnWidths(
              value as Partial<Record<SalesQuotationColumnKey, number>>,
            ),
          );
          setQuotationHasCustomWidths(true);
        } else {
          setQuotationHasCustomWidths(false);
        }
      } catch {
        // Fall back to auto-widths silently.
      } finally {
        if (!cancelled) setQuotationPreferenceHydrated(true);
      }
    };
    void loadRemotePreference();
    return () => {
      cancelled = true;
    };
  }, [quotationPreferenceRoleScope]);

  useEffect(() => {
    if (!quotationHasCustomWidths || !quotationPreferenceHydrated) return;
    const timer = window.setTimeout(() => {
      void sharedRoleUiPreferenceService
        .save(
          quotationPreferenceRoleScope,
          SALES_QUOTATION_TABLE_UI_PREFERENCE_KEY,
          quotationColumnWidths,
        )
        .catch(() => {
          // Keep in-memory widths even if remote persistence fails.
        });
    }, 300);
    return () => window.clearTimeout(timer);
  }, [quotationColumnWidths, quotationHasCustomWidths, quotationPreferenceHydrated, quotationPreferenceRoleScope]);

  useEffect(() => {
    if (!quotationTableContainerRef.current || typeof ResizeObserver === 'undefined') return;
    const minContainerWidth = SALES_QUOTATION_COLUMN_ORDER.reduce(
      (sum, key) => sum + SALES_QUOTATION_COLUMN_MIN_WIDTHS[key],
      0,
    );
    const element = quotationTableContainerRef.current;
    const handleResize = (width: number) => {
      const normalizedWidth = Math.max(width, minContainerWidth);
      setQuotationTableContainerWidth(normalizedWidth);
      if (quotationHasCustomWidths) return;
      setQuotationColumnWidths((current) => {
        const next = distributeQuotationColumnWidths(normalizedWidth);
        return JSON.stringify(current) === JSON.stringify(next) ? current : next;
      });
    };

    handleResize(element.clientWidth);
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      handleResize(entry.contentRect.width);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [quotationHasCustomWidths]);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!quotationColumnResizeRef.current) return;
      const { key, startX, startWidth } = quotationColumnResizeRef.current;
      const nextWidth = Math.max(
        SALES_QUOTATION_COLUMN_MIN_WIDTHS[key],
        Math.round(startWidth + (event.clientX - startX)),
      );
      setQuotationColumnWidths((current) => (
        current[key] === nextWidth ? current : { ...current, [key]: nextWidth }
      ));
    };

    const stopResize = () => {
      quotationColumnResizeRef.current = null;
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

  // 🔥 从后端加载报价单列表（只读服务器数据，不读本地）
  const [serverQuotations, setServerQuotations] = useState<any[]>(() =>
    mergeQuotationRows([
      ...readSalesQuotationCache(
        dashboardCurrentUser?.email || getCurrentUser()?.email || '',
        dashboardCurrentUser?.region || getCurrentUser()?.region || '',
      ),
      ...(Array.isArray(initialQuotations) ? initialQuotations : []),
    ]),
  );
  const [approvalRejectionCommentIndex, setApprovalRejectionCommentIndex] = useState<Record<string, string>>({});
  const [loadingFromApi, setLoadingFromApi] = useState(false);
  const hasAuthWarningRef = React.useRef(false);
  const authRetryTimerRef = React.useRef<number | null>(null);
  const contextQuotationsRef = React.useRef(contextQuotations);
  const serverQuotationsRef = React.useRef(serverQuotations);

  useEffect(() => {
    contextQuotationsRef.current = contextQuotations;
  }, [contextQuotations]);

  useEffect(() => {
    serverQuotationsRef.current = serverQuotations;
  }, [serverQuotations]);

  useEffect(() => () => {
    if (authRetryTimerRef.current) {
      window.clearTimeout(authRetryTimerRef.current);
      authRetryTimerRef.current = null;
    }
  }, []);

  const effectiveQuotations = useMemo(() => {
    return mergeQuotationRows([...serverQuotations, ...contextQuotations]);
  }, [contextQuotations, serverQuotations]);

  const buildQuotationPreservedPatch = React.useCallback((qt: any, overrides: Record<string, any> = {}) => {
    const customerFields = resolveQuotationCustomerFields(qt);
    const normalizedCustomerEmail = normalizeMeaningfulText(
      overrides.customerEmail ?? customerFields.customerEmail ?? qt?.customerEmail,
    ).toLowerCase();
    const normalizedCustomerName = normalizeMeaningfulText(
      overrides.customerName ?? customerFields.customerName ?? qt?.customerName,
    );
    const normalizedCustomerCompany = normalizeMeaningfulText(
      overrides.customerCompany ?? customerFields.customerCompany ?? qt?.customerCompany,
    );
    const normalizedRegion = normalizeMeaningfulText(
      overrides.region ?? customerFields.region ?? qt?.region ?? currentUser?.region,
    ) || 'NA';

    const items = Array.isArray(overrides.items)
      ? overrides.items
      : resolveQuotationItemsForSync(qt, {
          effectiveQuotations,
          quoteRequirements,
        });
    const itemDerivedTotal = items.reduce((sum: number, item: any) => {
      const quantity = Number(item?.quantity ?? 0);
      const unitPrice = Number(item?.salesPrice ?? item?.unitPrice ?? item?.quotePrice ?? 0);
      return sum + quantity * unitPrice;
    }, 0);

    const rawTotalPrice = Number(overrides.totalPrice ?? overrides.totalAmount ?? qt?.totalPrice ?? qt?.totalAmount ?? 0);
    const totalPrice = rawTotalPrice > 0 ? rawTotalPrice : itemDerivedTotal;
    const totalCost = Number(overrides.totalCost ?? qt?.totalCost ?? 0);
    const totalProfit = Number(
      overrides.totalProfit
      ?? qt?.totalProfit
      ?? (totalPrice > 0 ? totalPrice - totalCost : 0),
    );
    const rawProfitRate = Number(overrides.profitRate ?? qt?.profitRate ?? 0);
    const profitRate = rawProfitRate > 0
      ? rawProfitRate
      : (totalCost > 0 ? (totalProfit / totalCost) * 100 : 0);

    return {
      qtNumber: normalizeMeaningfulText(overrides.qtNumber ?? getQuotationDisplayNumber(qt)) || undefined,
      approvalStatus: String(overrides.approvalStatus ?? qt?.approvalStatus ?? 'draft'),
      items,
      totalPrice,
      totalAmount: totalPrice,
      totalCost,
      totalProfit,
      profitRate,
      paymentTerms: overrides.paymentTerms ?? qt?.paymentTerms ?? null,
      paymentMode: overrides.paymentMode ?? qt?.paymentMode ?? null,
      balanceTrigger: overrides.balanceTrigger ?? qt?.balanceTrigger ?? null,
      deliveryTerms: overrides.deliveryTerms ?? qt?.deliveryTerms ?? qt?.tradeTerms ?? null,
      deliveryDate: overrides.deliveryDate ?? qt?.deliveryDate ?? null,
      validUntil: overrides.validUntil ?? qt?.validUntil ?? null,
      currency: normalizeMeaningfulText(overrides.currency ?? qt?.currency) || 'USD',
      customerEmail: normalizedCustomerEmail,
      customerName: normalizedCustomerName,
      customerCompany: normalizedCustomerCompany,
      region: normalizedRegion,
      customerStatus: overrides.customerStatus ?? qt?.customerStatus,
      customerResponse: overrides.customerResponse ?? qt?.customerResponse ?? null,
      sentAt: overrides.sentAt ?? qt?.sentAt ?? null,
      sentToCustomerAt: overrides.sentToCustomerAt ?? qt?.sentToCustomerAt ?? qt?.sentAt ?? null,
      sentToCustomer: overrides.sentToCustomer ?? qt?.sentToCustomer ?? false,
      approvalChain: overrides.approvalChain ?? qt?.approvalChain ?? [],
      pricingDefaults: overrides.pricingDefaults ?? qt?.pricingDefaults ?? qt?.globalDefaults ?? null,
      globalDefaults: overrides.globalDefaults ?? qt?.globalDefaults ?? qt?.pricingDefaults ?? null,
      templateSnapshot: overrides.templateSnapshot ?? qt?.templateSnapshot ?? null,
      documentDataSnapshot: overrides.documentDataSnapshot ?? qt?.documentDataSnapshot ?? null,
      documentRenderMeta: overrides.documentRenderMeta ?? qt?.documentRenderMeta ?? null,
      qrNumber: normalizeMeaningfulText(overrides.qrNumber ?? qt?.qrNumber) || null,
      inqNumber: normalizeMeaningfulText(overrides.inqNumber ?? qt?.inqNumber) || null,
      salesPerson: normalizeMeaningfulText(overrides.salesPerson ?? qt?.salesPerson ?? currentUser?.email) || '',
      salesPersonName: normalizeMeaningfulText(overrides.salesPersonName ?? qt?.salesPersonName ?? currentUser?.name) || '',
    } as any;
  }, [currentUser?.email, currentUser?.name, currentUser?.region, resolveQuotationCustomerFields, effectiveQuotations, quoteRequirements]);

  const persistQuotationPatchDirect = React.useCallback(async (qt: any, overrides: Record<string, any> = {}) => {
    const patch = buildQuotationPreservedPatch(qt, overrides);
    const primaryQtNumber = String(patch.qtNumber || getQuotationDisplayNumber(qt) || '').trim();
    const fallbackId = String(qt?.id || '').trim();
    if (!primaryQtNumber && !fallbackId) {
      throw new Error('报价单标识缺失，无法更新');
    }

    if (primaryQtNumber) {
      try {
        return await salesQuotationService.updateStatus(
          primaryQtNumber,
          String(patch.approvalStatus || qt?.approvalStatus || 'draft'),
          patch,
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error || '');
        if (!/No sales quotation matched identifier/i.test(message)) {
          throw error;
        }
      }

      const serverRows = await salesQuotationService.listViaServer({ qtNumber: primaryQtNumber }).catch(() => []);
      const matched = Array.isArray(serverRows) ? serverRows[0] : null;
      if (matched?.id) {
        return await salesQuotationService.updateStatus(
          String(matched.id),
          String(patch.approvalStatus || matched.approvalStatus || qt?.approvalStatus || 'draft'),
          { ...matched, ...patch, id: matched.id, qtNumber: matched.qtNumber || primaryQtNumber },
        );
      }

      return await salesQuotationService.upsertViaServer({
        ...qt,
        ...patch,
        id: qt?.id || undefined,
        qtNumber: primaryQtNumber,
      });
    }

    if (fallbackId) {
      try {
        return await salesQuotationService.updateStatus(
          fallbackId,
          String(patch.approvalStatus || qt?.approvalStatus || 'draft'),
          patch,
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error || '');
        if (!/No sales quotation matched identifier/i.test(message)) {
          throw error;
        }
      }
    }

    throw new Error(`No sales quotation matched identifier: ${fallbackId || primaryQtNumber}`);
  }, [buildQuotationPreservedPatch]);

  const ensureBoundQuotationSnapshot = React.useCallback(async (qt: any) => {
    const templateSnapshot = qt?.templateSnapshot || qt?.template_snapshot || null;
    const templateVersion = templateSnapshot?.version || null;
    const documentData = qt?.documentDataSnapshot || qt?.document_data_snapshot || null;
    if (templateVersion && documentData) {
      return qt;
    }

    const basePatch = buildQuotationPreservedPatch(qt);
    const hydratedPatch = {
      ...basePatch,
      templateSnapshot: templateVersion
        ? templateSnapshot
        : {
            version: 'legacy-recovered',
            recoveredAt: new Date().toISOString(),
            source: 'sales-quotation-management-contract-push',
          },
      documentDataSnapshot: documentData || adaptSalesQuotationToDocumentData({
        ...qt,
        ...basePatch,
        createdAt: qt?.createdAt || qt?.created_at || new Date().toISOString(),
      }),
    };

    try {
      await persistQuotationPatchDirect(qt, hydratedPatch);
    } catch (error) {
      console.warn('⚠️ [ensureBoundQuotationSnapshot] 快照回写失败，继续使用本地补齐数据:', error);
    }

    return {
      ...qt,
      ...hydratedPatch,
      templateSnapshot: hydratedPatch.templateSnapshot,
      documentDataSnapshot: hydratedPatch.documentDataSnapshot,
    };
  }, [buildQuotationPreservedPatch, persistQuotationPatchDirect]);

  useEffect(() => {
    let cancelled = false;

    const loadApprovalRejectionCommentIndex = async () => {
      try {
        const summaries = await approvalRecordService.getAllSummariesCached();
        if (cancelled) return;
        setApprovalRejectionCommentIndex(buildApprovalRejectionCommentIndex(summaries));
      } catch {
        if (!cancelled) setApprovalRejectionCommentIndex({});
      }
    };

    void loadApprovalRejectionCommentIndex();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const nextCachedRows = readSalesQuotationCache(currentUser?.email, currentUser?.region);
    if (nextCachedRows.length > 0) {
      setServerQuotations((prev) => (prev.length > 0 ? prev : nextCachedRows));
    }
  }, [currentUser?.email, currentUser?.region]);

  useEffect(() => {
    if (contextQuotations.length > 0) {
      setServerQuotations((prev) => (prev.length > 0 ? prev : contextQuotations));
      writeSalesQuotationCache(currentUser?.email, currentUser?.region, contextQuotations);
    }
  }, [contextQuotations, currentUser?.email, currentUser?.region]);

  useEffect(() => {
    if (!Array.isArray(initialQuotations) || initialQuotations.length === 0) return;
    setServerQuotations((prev) => mergeQuotationRows([...prev, ...initialQuotations]));
  }, [initialQuotations]);

  // 🔥 加载数据的函数
  const loadSalesQuotations = React.useCallback(() => {
    const run = async () => {
      const hasLocalRows = mergeQuotationRows([
        ...serverQuotationsRef.current,
        ...contextQuotationsRef.current,
      ]).length > 0;
      setLoadingFromApi(!hasLocalRows);
      try {
        let {
          data: { session },
        } = await supabase.auth.getSession();
        let sessionEmail = String(session?.user?.email || '').trim();
        const role = String(currentUser?.userRole || currentUser?.role || '').trim();
        const canReadAll = ['Admin', 'CEO', 'Boss', 'CFO', 'Sales_Director'].includes(role);

        if (!sessionEmail) {
          try {
            const {
              data: { session: refreshedSession },
            } = await supabase.auth.refreshSession();
            session = refreshedSession || session;
            sessionEmail = String(session?.user?.email || '').trim();
          } catch (refreshError) {
            console.warn('⚠️ [SalesQuotationManagement] Supabase session refresh failed, falling back to cached identity:', refreshError);
          }
        }

        const cachedIdentity = currentUser || getCurrentUser();
        const effectiveEmail = String(currentUser?.email || cachedIdentity?.email || sessionEmail).trim();

        if (!sessionEmail) {
          const cachedRows = readSalesQuotationCache(
            effectiveEmail,
            currentUser?.region || cachedIdentity?.region,
          );

          if (cachedRows.length > 0) {
            setServerQuotations((prev) => (prev.length > 0 ? prev : cachedRows));
          }

          if (effectiveEmail) {
            if (authRetryTimerRef.current) {
              window.clearTimeout(authRetryTimerRef.current);
            }
            authRetryTimerRef.current = window.setTimeout(() => {
              authRetryTimerRef.current = null;
              loadSalesQuotations();
            }, 1200);
            return;
          }

          setServerQuotations([]);
          if (!hasAuthWarningRef.current) {
            hasAuthWarningRef.current = true;
            toast.error('登录状态已失效，请重新登录后再读取 Supabase 报价单');
          }
          return;
        }

        if (authRetryTimerRef.current) {
          window.clearTimeout(authRetryTimerRef.current);
          authRetryTimerRef.current = null;
        }
        hasAuthWarningRef.current = false;
        const stickyQtNumber = String(highlightQtNumber || stickyQtNumberRef.current || '').trim();
        let rows = effectiveEmail && !canReadAll
          ? await salesQuotationService.getBySalesPerson(effectiveEmail)
          : await salesQuotationService.getAll();
        let quotations: any[] = Array.isArray(rows) ? rows : [];
        let attemptedServerFallback = false;

        if (effectiveEmail && !canReadAll) {
          const normalizedCurrentEmail = normalizePersonnelEmail(effectiveEmail, currentUser?.region);
          const ownerAliases = getPersonnelEmailAliases(normalizedCurrentEmail, currentUser?.region);
          const shouldLoadFallbackRows =
            quotations.length === 0 ||
            (stickyQtNumber && !quotations.some((qt) => String(qt?.qtNumber || '').trim() === stickyQtNumber));
          if (shouldLoadFallbackRows) {
            try {
              attemptedServerFallback = true;
              const targetedRows = await salesQuotationService.listViaServer({
                ownerEmail: effectiveEmail,
                qtNumber: stickyQtNumber,
              });
              if (Array.isArray(targetedRows) && targetedRows.length > 0) {
                const mergedById = new Map<string, any>();
                [...quotations, ...targetedRows].forEach((qt) => {
                  const key = String(qt?.qtNumber || qt?.quotationNumber || qt?.id || '');
                  if (key) mergedById.set(key, qt);
                });
                quotations = Array.from(mergedById.values())
                  .sort((a, b) => String(b?.createdAt || '').localeCompare(String(a?.createdAt || '')));
              }
            } catch (serverFallbackError) {
              console.warn('⚠️ [SalesQuotationManagement] 定向服务端兜底读取 QT 失败:', serverFallbackError);
            }
          }

          if (shouldLoadFallbackRows && quotations.length === 0) {
            const fallbackRows = await salesQuotationService.getAll();
            const allQuotations: any[] = Array.isArray(fallbackRows) ? fallbackRows : [];
            const inferredOwnedQuotations = allQuotations.filter((qt) => {
              const resolvedOwnerEmail = resolveQuotationOwnerEmail(qt);
              const normalizedSalesPerson = normalizePersonnelEmail(qt?.salesPerson, qt?.region);
              const isHighlighted = stickyQtNumber && String(qt?.qtNumber || '').trim() === stickyQtNumber;
              return isHighlighted || [resolvedOwnerEmail, normalizedSalesPerson, String(qt?.salesPerson || '').trim().toLowerCase()]
                .filter(Boolean)
                .some((email) => ownerAliases.includes(email));
            });

            const mergedById = new Map<string, any>();
            [...quotations, ...inferredOwnedQuotations].forEach((qt) => {
              const key = String(qt?.qtNumber || qt?.quotationNumber || qt?.id || '');
              if (key) mergedById.set(key, qt);
            });
            quotations = Array.from(mergedById.values())
              .sort((a, b) => String(b?.createdAt || '').localeCompare(String(a?.createdAt || '')));
          }
        }

        if (quotations.length === 0 && (stickyQtNumber || effectiveEmail)) {
          try {
            const serverFallbackRows = attemptedServerFallback
              ? []
              : await salesQuotationService.listViaServer({
                  ownerEmail: effectiveEmail,
                  qtNumber: stickyQtNumber,
                });
            if (Array.isArray(serverFallbackRows) && serverFallbackRows.length > 0) {
              quotations = serverFallbackRows;
            }
          } catch (serverFallbackError) {
            console.warn('⚠️ [SalesQuotationManagement] 服务端兜底读取 QT 失败:', serverFallbackError);
          }
        }

        removeTombstonesByMarkers(
          'qt',
          quotations.flatMap((qt: any) => [qt?.id, qt?.qtNumber, qt?.quotationNumber]),
        );

        const nextRows = filterNotDeleted(
          'qt',
          quotations,
          (qt: any) => [String(qt?.id || ''), String(qt?.qtNumber || '')],
        );
        setServerQuotations(nextRows);
        writeSalesQuotationCache(effectiveEmail, currentUser?.region, nextRows);
      } catch (err) {
        console.error('❌ [SalesQuotationManagement] 加载 sales_quotations 失败:', err);
        const cachedRows = readSalesQuotationCache(currentUser?.email, currentUser?.region);
        setServerQuotations(cachedRows);
        toast.error(err instanceof Error ? err.message : '加载 QT 列表失败');
      } finally {
        setLoadingFromApi(false);
      }
    };
    void run();
  }, [currentUser?.email, currentUser?.region, currentUser?.role, currentUser?.userRole, highlightQtNumber, resolveQuotationOwnerEmail]); // eslint-disable-line react-hooks/exhaustive-deps

  // 🔥 初始加载
  useEffect(() => {
    loadSalesQuotations();
  }, [loadSalesQuotations]);

  // 🔥 ERP事件驱动刷新（减少跨流程切换后的显示延迟）
  useEffect(() => {
    let timer: number | null = null;
    const triggerReload = () => {
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        loadSalesQuotations();
      }, 120);
    };

    const unsubscribe = subscribeErpEvent((event) => {
      if (event.key === ERP_EVENT_KEYS.QUOTATION_CREATED || event.key === ERP_EVENT_KEYS.QUOTATION_SENT) {
        const optimisticQuotation = (event.metadata as any)?.quotation;
        if (optimisticQuotation && typeof optimisticQuotation === 'object') {
          setServerQuotations((prev) => {
            const next = new Map<string, any>();
            [...prev, optimisticQuotation].forEach((qt: any) => {
              const key = String(qt?.qtNumber || qt?.id || '').trim();
              if (key) {
                next.set(key, qt);
              }
            });
            const mergedRows = Array.from(next.values()).sort((a, b) =>
              String(b?.createdAt || b?.created_at || '').localeCompare(
                String(a?.createdAt || a?.created_at || ''),
              ),
            );
            writeSalesQuotationCache(currentUser?.email, currentUser?.region, mergedRows);
            return mergedRows;
          });
        }
      }

      // QUOTATION_SENT 是业务员主动发出的，不应触发自身 reload（否则会从 API 拉回旧的 not_sent 覆盖本地）
      if (
        event.key === ERP_EVENT_KEYS.QUOTATION_CREATED ||
        event.key === ERP_EVENT_KEYS.QUOTATION_ACCEPTED ||
        event.key === ERP_EVENT_KEYS.QUOTATION_DELETED ||
        event.key === ERP_EVENT_KEYS.INQUIRY_SUBMITTED ||
        event.key === ERP_EVENT_KEYS.ORDER_CREATED
      ) {
        triggerReload();
      }
    });

    return () => {
      if (timer) window.clearTimeout(timer);
      unsubscribe();
    };
  }, [loadSalesQuotations]);

  // 🔥 当 highlightQtNumber 变化时（下推后切换过来），重新加载数据
  useEffect(() => {
    if (highlightQtNumber) {
      console.log('🔄 [报价管理] 检测到 highlightQtNumber 变化，重新加载数据:', highlightQtNumber);
      loadSalesQuotations();
    }
  }, [highlightQtNumber, loadSalesQuotations]);

  // 🔥 高亮状态（3秒后自动消失）
  const [highlightedId, setHighlightedId] = React.useState<string | null>(null);
  
  React.useEffect(() => {
    if (highlightQtNumber) {
      const qt = serverQuotations.find(q => q.qtNumber === highlightQtNumber);
      if (qt) {
        setHighlightedId(qt.id);
        // 3秒后清除高亮
        const timer = setTimeout(() => setHighlightedId(null), 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [highlightQtNumber, serverQuotations]);
  
  // 🔥 新增：选中的报价单ID列表
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // 🔥 新：全选/取消全选
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(myQuotations.map(qt => qt.id));
    } else {
      setSelectedIds([]);
    }
  };
  
  // 🔥 新增：单个选择
  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, id]);
    } else {
      setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
    }
  };

  const syncRequirementsAfterQuotationDelete = async (deletedQuotations: any[], remainingQuotations: any[]) => {
    const impactedQrNumbers = Array.from(new Set(
      deletedQuotations
        .map((qt) => String(qt?.qrNumber || ''))
        .filter(Boolean),
    ));

    let changed = false;
    for (const qrNumber of impactedQrNumbers) {
      const stillHasQuotation = remainingQuotations.some((qt) => String(qt?.qrNumber || '') === qrNumber);
      if (stillHasQuotation) continue;

      const requirement = quoteRequirements.find((req: any) =>
        String(req?.requirementNo || '') === qrNumber || String(req?.qrNumber || '') === qrNumber,
      );
      if (!requirement) continue;

      await updateQuoteRequirement(requirement.id, {
        pushedToQuotation: false,
        pushedToQuotationDate: null,
        pushedBy: null,
        quotationNumber: null,
      });
      changed = true;
    }

    if (changed) {
      await refreshQuoteRequirementsFromApi();
    }
  };
  
  // 🔥 新增：批量删除
  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) {
      toast.error('请先选择要删除的报价单！');
      return;
    }
    
    if (window.confirm(`确定要删除选中的 ${selectedIds.length} 个报价单吗？此操作不可恢复！`)) {
      const ids = selectedIds.map((id) => String(id));
      const deletedQuotations = myQuotations.filter((qt) => ids.includes(String(qt.id)));
      let deletedCount = 0;
      let lastError: unknown = null;
      for (const id of ids) {
        try {
          await salesQuotationService.delete(id);
          deletedCount += 1;
        } catch (error) {
          lastError = error;
        }
      }
      if (deletedCount !== ids.length) {
        toast.error(lastError instanceof Error ? lastError.message : '删除 QT 失败');
        return;
      }
      const remainingQuotations = effectiveQuotations.filter((qt) => !ids.includes(String(qt.id)));
      setServerQuotations((prev) => prev.filter((qt) => !ids.includes(String(qt.id))));
      writeSalesQuotationCache(
        currentUser?.email,
        currentUser?.region,
        remainingQuotations.filter((qt) => !ids.includes(String(qt.id))),
      );
      await syncRequirementsAfterQuotationDelete(deletedQuotations, remainingQuotations);
      setSelectedIds([]);
      toast.success(`成功删除 ${ids.length} 个报价单！`);
      if (deletedCount > 0) loadSalesQuotations();
    }
  };
  
  const resolveCanonicalQuotationForSend = React.useCallback(async (qt: any) => {
    const directQtNumber = String(getQuotationDisplayNumber(qt) || '').trim();
    if (directQtNumber) {
      return { ...qt, qtNumber: directQtNumber };
    }

    const localMatched = effectiveQuotations.find((candidate: any) => {
      if (qt?.id && candidate?.id && String(candidate.id).trim() === String(qt.id).trim()) return true;
      const sameQr = String(candidate?.qrNumber || '').trim() && String(candidate?.qrNumber || '').trim() === String(qt?.qrNumber || '').trim();
      const sameInq = String(candidate?.inqNumber || '').trim() && String(candidate?.inqNumber || '').trim() === String(qt?.inqNumber || '').trim();
      return sameQr && sameInq;
    });

    const localQtNumber = String(getQuotationDisplayNumber(localMatched) || '').trim();
    if (localMatched && localQtNumber) {
      return { ...localMatched, ...qt, qtNumber: localQtNumber };
    }

    const ownerEmail = String(currentUser?.email || '').trim();
    if (ownerEmail) {
      const serverRows = await salesQuotationService.listViaServer({ ownerEmail }).catch(() => []);
      const serverMatched = (Array.isArray(serverRows) ? serverRows : []).find((candidate: any) => {
        if (qt?.id && candidate?.id && String(candidate.id).trim() === String(qt.id).trim()) return true;
        const sameQr = String(candidate?.qrNumber || '').trim() && String(candidate?.qrNumber || '').trim() === String(qt?.qrNumber || '').trim();
        const sameInq = String(candidate?.inqNumber || '').trim() && String(candidate?.inqNumber || '').trim() === String(qt?.inqNumber || '').trim();
        return sameQr && sameInq;
      });
      const serverQtNumber = String(getQuotationDisplayNumber(serverMatched) || '').trim();
      if (serverMatched && serverQtNumber) {
        return { ...serverMatched, ...qt, id: serverMatched.id || qt.id, qtNumber: serverQtNumber };
      }
    }

    return qt;
  }, [currentUser?.email, effectiveQuotations]);

  useEffect(() => {
    const repairTarget = effectiveQuotations.find((qt) => {
      const repairKey = String(qt?.id || qt?.qtNumber || '').trim();
      if (!repairKey || ownerRepairAttemptedRef.current.has(repairKey)) return false;

      const currentOwner = normalizePersonnelEmail(qt?.salesPerson, qt?.region);
      const resolvedOwner = resolveQuotationOwnerEmail(qt);
      return (
        isSystemOwnerEmail(currentOwner, qt?.region) &&
        Boolean(resolvedOwner) &&
        !isSystemOwnerEmail(resolvedOwner, qt?.region) &&
        resolvedOwner !== currentOwner
      );
    });

    if (!repairTarget) return;

    const repairKey = String(repairTarget?.id || repairTarget?.qtNumber || '').trim();
    ownerRepairAttemptedRef.current.add(repairKey);
    void (async () => {
      try {
        const resolvedOwnerEmail = resolveQuotationOwnerEmail(repairTarget);
        const matchedStaff = staffDirectoryService.getCachedSalesStaff().find(
          (staff) =>
            String(staff.email || '').trim().toLowerCase() ===
            String(resolvedOwnerEmail || '').trim().toLowerCase(),
        );
        const repairedOwnerName =
          [
            repairTarget?.salesPersonName && !isSystemOwnerEmail(repairTarget?.salesPerson, repairTarget?.region)
              ? repairTarget.salesPersonName
              : '',
            matchedStaff?.name,
          ]
            .map((value) => String(value || '').trim())
            .filter(Boolean)[0] || '';

        await salesQuotationService.upsert({
          ...repairTarget,
          salesPerson: resolvedOwnerEmail,
          salesPersonName: repairedOwnerName,
          updatedAt: new Date().toISOString(),
        });

        toast.success(`已修复 ${repairTarget.qtNumber || 'QT'} 的业务员归属`);
        loadSalesQuotations();
      } catch (error) {
        ownerRepairAttemptedRef.current.delete(repairKey);
        console.error('❌ [QT owner repair] failed to reassign quotation owner:', error);
        toast.error(`修复 ${repairTarget.qtNumber || 'QT'} 归属失败`);
      }
    })();
  }, [effectiveQuotations, loadSalesQuotations, resolveQuotationOwnerEmail]);
  // 🔥 状态管理
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'draft' | 'pending_approval' | 'approved' | 'rejected'>('all');
  
  // 🔥 新增：弹窗状态
  const [showInquiryView, setShowInquiryView] = useState(false); // 查看客户询价单
  const [showQuotationView, setShowQuotationView] = useState(false); // 🔥 查看报价单（文档模版）
  const [showPriceCalculation, setShowPriceCalculation] = useState(false); // 核算价格
  const [selectedQuotation, setSelectedQuotation] = useState<any>(null); // 当前选中的报价单
  const [sendingQuotationIds, setSendingQuotationIds] = useState<string[]>([]);
  const [rejectionCommentDialog, setRejectionCommentDialog] = useState<{
    qtNumber: string;
    customerCompany: string;
    comment: string;
  } | null>(null);
  const [selectedInquiry, setSelectedInquiry] = useState<any>(null); // 当前选中的询价单

  const resolveQuotationOwnerFromQr = React.useCallback((qt: any) => {
    const relatedQr = quoteRequirements.find(
      (req) => String(req?.requirementNo || '').trim() === String(qt?.qrNumber || '').trim()
    );
    const relatedInquiry = inquiries.find((inq) =>
      String(inq?.inquiryNumber || inq?.id || '').trim() === String(qt?.inqNumber || '').trim()
    );

    const resolvedEmail = resolveQuotationOwnerEmail(qt);
    const matchedStaff = staffDirectoryService.getCachedSalesStaff().find(
      (staff) => String(staff.email || '').trim().toLowerCase() === String(resolvedEmail || '').trim().toLowerCase()
    );

    const resolvedName = [
      relatedQr?.requestedByName,
      relatedInquiry && String(relatedInquiry?.salesRepEmail || relatedInquiry?.assignedTo || '').trim()
        ? matchedStaff?.name
        : '',
      qt?.salesPersonName && !isSystemOwnerEmail(qt?.salesPerson, qt?.region) ? qt.salesPersonName : '',
      matchedStaff?.name,
      currentUser?.email && String(currentUser.email).trim().toLowerCase() === String(resolvedEmail).trim().toLowerCase()
        ? currentUser?.name
        : '',
    ]
      .map((value) => String(value || '').trim())
      .filter(Boolean)[0] || '';

    return {
      ...qt,
      salesPerson: resolvedEmail || qt?.salesPerson || '',
      salesPersonName: resolvedName || qt?.salesPersonName || '',
    };
  }, [currentUser?.email, currentUser?.name, inquiries, quoteRequirements, resolveQuotationOwnerEmail]);

  const ensurePersistedQuotationRecord = React.useCallback(async (qt: any) => {
    const qtNumber = String(getQuotationDisplayNumber(qt) || '').trim();
    if (!qtNumber) return qt;

    const serverRows = await salesQuotationService.listViaServer({ qtNumber }).catch(() => []);
    const matched = Array.isArray(serverRows) ? serverRows[0] : null;
    if (matched) {
      return { ...matched, ...qt, id: matched.id || qt.id, qtNumber };
    }

    const ownerResolvedQt = resolveQuotationOwnerFromQr(qt);
    const customerFields = resolveQuotationCustomerFields(ownerResolvedQt);
    const patch = buildQuotationPreservedPatch(ownerResolvedQt, {
      qtNumber,
      customerEmail: customerFields.customerEmail || ownerResolvedQt.customerEmail || '',
      customerName: customerFields.customerName || ownerResolvedQt.customerName || '',
      customerCompany: customerFields.customerCompany || ownerResolvedQt.customerCompany || '',
      region: customerFields.region || ownerResolvedQt.region || currentUser?.region || '',
    });

    return await salesQuotationService.upsertViaServer({
      ...ownerResolvedQt,
      ...patch,
      qtNumber,
      id: ownerResolvedQt?.id || undefined,
    });
  }, [
    buildQuotationPreservedPatch,
    currentUser?.region,
    resolveQuotationCustomerFields,
    resolveQuotationOwnerFromQr,
  ]);
  
  // 🔥 新增：查看客户询价单
  const handleViewInquiry = (qt: any) => {
    // 根据INQ单号查找对应的客户询价单
    const inquiry = inquiries.find(inq => inq.inquiryNo === qt.inqNumber);
    if (!inquiry) {
      toast.error('未找到对应的客户询价单！');
      return;
    }
    setSelectedInquiry(inquiry);
    setShowInquiryView(true);
  };
  
  // 🔥 新增：查看报价单（使用文档模版）
  const handleViewQuotation = (qt: any) => {
    setSelectedQuotation(resolveQuotationOwnerFromQr(qt));
    setShowQuotationView(true);
  };
  
  // 🔥 新增：核算价格（打开智能报价创建弹窗）
  const handleCalculatePrice = (qt: any) => {
    setSelectedQuotation(qt);
    setShowPriceCalculation(true);
  };
  
  // 🔥 申请复核：客户拒绝后，业务员申请主管重新审核定价
  const handleSubmitForReview = async (qt: any) => {
    const amount = qt.totalAmount || qt.totalPrice;
    if (!amount || amount <= 0) {
      toast.error('❌ 无法申请复核：报价金额为0');
      return;
    }

    const governance = deriveQtApprovalGovernance({ ...qt, totalPrice: amount });
    const requiresDirectorReview = governance.requiresDirectorApproval;
    const managerEmail = getRegionalManager(currentUser?.region);
    const directorEmail = SALES_DIRECTOR_EMAIL;
    const declineReason = qt.customerResponse?.comment || '';

    const approvalChain = buildManagerDirectorApprovalChain(managerEmail, directorEmail, {
      requiresDirectorApproval: requiresDirectorReview,
    });

    // ─── 1. 同步到 Supabase（重置审批状态为 pending_approval）───
    try {
      await updateQuotation(String(qt.id || qt.qtNumber), {
        qtNumber: qt.qtNumber,
        approvalStatus: 'pending_approval',
        approvalChain,
        qtType: governance.category,
      } as any);
    } catch (e: any) {
      toast.error(`❌ 申请复核失败：${e?.message || 'Supabase 写入失败'}`);
      return;
    }

    // ─── 2. 更新本地状态 ───
    setServerQuotations((prev: any[]) =>
      prev.map((q: any) =>
        q.id === qt.id ? { ...q, approvalStatus: 'pending_approval', approvalChain, qtType: governance.category } : q
      )
    );
    // ─── 3. 推送到审批中心（主管可立即看到复核请求）───
    const now = new Date();
    const deadline = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const submissionOwner = resolveQuotationOwnerFromQr(qt);
    const productCount = qt.items?.length ?? 0;
    const productSummary = productCount === 1
      ? `${qt.items[0].productName} × ${qt.items[0].quantity} ${qt.items[0].unit}`
      : productCount > 1
        ? `${qt.items[0].productName} × ${qt.items[0].quantity} ${qt.items[0].unit} 等 ${productCount} 项产品`
        : '暂无产品';

    const structuredApprovalNotes = resolveStructuredApprovalNotes(qt, 'review');
    const reviewNote = declineReason
      ? `客户拒绝报价，申请主管复核定价。客户拒绝理由：${declineReason}`
      : '客户拒绝报价，申请主管复核定价。';

    const baseReviewRequest = {
      id: qt.id,
      type: 'qt' as const,
      relatedDocumentId: qt.qtNumber || qt.id,
      relatedDocumentType: '销售报价单（复核申请）',
      relatedDocument: {
        ...qt,
        salesPerson: submissionOwner.salesPerson || qt.salesPerson || '',
        salesPersonName: submissionOwner.salesPersonName || qt.salesPersonName || '',
        approvalNotes: structuredApprovalNotes,
      },
      submittedBy: submissionOwner.salesPerson || currentUser?.email || '',
      submittedByName: submissionOwner.salesPersonName || currentUser?.name || currentUser?.email || '',
      submittedByRole: currentUser?.userRole || currentUser?.role || 'Sales',
      submittedAt: now.toISOString(),
      region: qt.region || currentUser?.region || 'NA',
      requiresDirectorApproval: requiresDirectorReview,
      status: 'pending' as const,
      urgency: (amount >= 100000 ? 'high' : 'normal') as 'high' | 'normal',
      amount,
      currency: qt.currency || 'USD',
      customerName: qt.customerCompany || qt.customerName || 'Customer',
      customerEmail: qt.customerEmail || '',
      productSummary,
      approvalChain,
      approvalHistory: [],
      deadline: deadline.toISOString(),
      expiresIn: 24,
      reviewNote,
      nextApprover: requiresDirectorReview ? directorEmail : null,
      nextApproverRole: requiresDirectorReview ? '销售总监' : null,
    };

    await pushApprovalBridgeItem({
      currentApprover: managerEmail,
      request: { ...baseReviewRequest, currentApprover: managerEmail, currentApproverRole: '区域业务主管' },
    });
    await sendQuotationApprovalNotification(managerEmail, qt, amount, '主管复核');

    toast.success('✅ 复核申请已提交给主管！', {
      description: `主管将收到复核请求。${declineReason ? `\n客户拒绝理由：${declineReason}` : ''}`,
      duration: 5000,
    });
  };
  
  // 🔥 撤回审批：将待审批中的报价单撤回为草稿，可重新编辑/提交
  // 场景：审批记录被管理员删除，但报价单状态仍停留在 pending_supervisor/pending_director
  const handleWithdraw = async (qt: any) => {
    if (!window.confirm(`确定撤回报价单 ${qt.qtNumber} 吗？撤回后可重新编辑并提交审批。`)) return;
    try {
      await updateQuotation(String(qt.id || qt.qtNumber), {
        qtNumber: qt.qtNumber,
        approvalStatus: 'draft',
        approvalChain: [],
      } as any);
      setServerQuotations((prev: any[]) =>
        prev.map((q: any) => q.id === qt.id ? { ...q, approvalStatus: 'draft', approvalChain: [] } : q)
      );
      toast.success('✅ 报价单已撤回，可重新编辑并提交审批', {
        description: `报价单号：${qt.qtNumber}`,
        duration: 4000,
      });
    } catch (e: any) {
      toast.error(`❌ 撤回失败：${e?.message || 'Supabase 写入失败'}`);
    }
  };

  // 🔥 新增：提交审批（从草稿提交给主管审批）
  const handleSubmitForApproval = async (qt: any) => {
    console.log('📤 提交审批:', qt);
    
    // 检查是否有报价金额
    const amount = qt.totalAmount || qt.totalPrice;
    if (!amount || amount <= 0) {
      toast.error('❌ 请先核算价格后再提交审批！');
      return;
    }
    
    // 判断审批流程
    const governance = deriveQtApprovalGovernance({ ...qt, totalPrice: amount });
    const requiresDirectorReview = governance.requiresDirectorApproval;
    const customerFields = resolveQuotationCustomerFields(qt);
    
    // 🔥 获取主管信息（根据用户区域获取对应主管）
    const managerEmail = getRegionalManager(currentUser?.region);
    const directorEmail = SALES_DIRECTOR_EMAIL; // 销售总监：王强
    
    // 🔥 产品摘要
    const productCount = qt.items.length;
    const productSummary = productCount === 1
      ? `${qt.items[0].productName} × ${qt.items[0].quantity} ${qt.items[0].unit}`
      : `${qt.items[0].productName} × ${qt.items[0].quantity} ${qt.items[0].unit} 等 ${productCount} 项产品`;
    
    const structuredApprovalNotes = resolveStructuredApprovalNotes(qt, 'submit');

    // 🔥 组装审批链（落库到 sales_quotations.approval_chain）
    const approvalChain = buildManagerDirectorApprovalChain(managerEmail, directorEmail, {
      requiresDirectorApproval: requiresDirectorReview,
    });

    // ─── 1. 同步到 Supabase ───
    try {
      await updateQuotation(String(qt.id || qt.qtNumber), {
        qtNumber: qt.qtNumber,
        approvalStatus: 'pending_approval',
        approvalChain,
        qtType: governance.category,
        specialPaymentTermsFlag: governance.category === 'special_payment' || Boolean(qt?.specialPaymentTermsFlag),
        specialPriceFlag: governance.category === 'special_price' || Boolean(qt?.specialPriceFlag),
        strategicCustomerFlag: governance.category === 'strategic_customer' || Boolean(qt?.strategicCustomerFlag),
        items: qt.items,
        totalPrice: amount,
        totalAmount: amount,
        customerEmail: customerFields.customerEmail || qt.customerEmail || '',
        customerName: customerFields.customerName || qt.customerName || '',
        customerCompany: customerFields.customerCompany || qt.customerCompany || '',
        region: customerFields.region || qt.region,
      } as any);
    } catch (e: any) {
      toast.error(`❌ 提交审批失败：${e?.message || 'Supabase 写入失败'}`);
      return;
    }

    // ─── 2. 以 Supabase 成功结果更新当前页面状态 ───
    const pendingQuotation = {
      ...qt,
      approvalStatus: 'pending_approval',
      approvalChain,
      qtType: governance.category,
      specialPaymentTermsFlag: governance.category === 'special_payment' || Boolean(qt?.specialPaymentTermsFlag),
      specialPriceFlag: governance.category === 'special_price' || Boolean(qt?.specialPriceFlag),
      strategicCustomerFlag: governance.category === 'strategic_customer' || Boolean(qt?.strategicCustomerFlag),
      totalPrice: amount,
      totalAmount: amount,
      customerEmail: customerFields.customerEmail || qt.customerEmail || '',
      customerName: customerFields.customerName || qt.customerName || '',
      customerCompany: customerFields.customerCompany || qt.customerCompany || '',
      region: customerFields.region || qt.region,
      updatedAt: new Date().toISOString(),
    };
    setServerQuotations((prev: any[]) => {
      const nextRows = mergeQuotationRows([
        ...prev.map((q: any) => (matchesQuotationRow(q, qt) ? { ...q, ...pendingQuotation } : q)),
        pendingQuotation,
      ]);
      writeSalesQuotationCache(currentUser?.email, currentUser?.region, nextRows);
      return nextRows;
    });
    emitErpEvent({
      id: `evt-qt-pending-approval-${Date.now()}`,
      key: ERP_EVENT_KEYS.QUOTATION_CREATED,
      domain: 'qt',
      recordId: String(qt.id || qt.qtNumber),
      internalNo: String(qt.qtNumber || ''),
      source: 'salesperson',
      occurredAt: new Date().toISOString(),
      metadata: {
        approvalStatus: 'pending_approval',
        qtNumber: qt.qtNumber,
        qrNumber: qt.qrNumber,
        quotation: pendingQuotation,
      },
    });

    try {
      const now = new Date();
      const deadline = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const submissionOwner = resolveQuotationOwnerFromQr(qt);
      const baseRequest = {
        id: qt.id,
        type: 'qt',
        relatedDocumentId: qt.qtNumber || qt.id,
        relatedDocumentType: '销售报价单',
        relatedDocument: {
          ...qt,
          id: qt.id,
          customerEmail: customerFields.customerEmail || qt.customerEmail || '',
          customerName: customerFields.customerName || qt.customerName || '',
          customerCompany: customerFields.customerCompany || qt.customerCompany || '',
          region: customerFields.region || qt.region,
          salesPerson: submissionOwner.salesPerson || qt.salesPerson || '',
          salesPersonName: submissionOwner.salesPersonName || qt.salesPersonName || '',
          approvalNotes: `${governance.summary}${structuredApprovalNotes ? `\n${structuredApprovalNotes}` : ''}`,
        },
        submittedBy: submissionOwner.salesPerson || currentUser?.email || '',
        submittedByName: submissionOwner.salesPersonName || currentUser?.name || currentUser?.email || '',
        submittedByRole: currentUser?.userRole || currentUser?.role || 'Sales',
        submittedAt: now.toISOString(),
        region: customerFields.region || qt.region || currentUser?.region || 'NA',
        nextApprover: requiresDirectorReview ? directorEmail : null,
        nextApproverRole: requiresDirectorReview ? '销售总监' : null,
        requiresDirectorApproval: requiresDirectorReview,
        status: 'pending',
        urgency: amount >= 100000 ? 'high' : 'normal',
        amount,
        currency: qt.currency || 'USD',
        customerName: customerFields.customerCompany || customerFields.customerName || qt.customerCompany || qt.customerName || 'Customer',
        customerEmail: customerFields.customerEmail || qt.customerEmail || '',
        productSummary,
        approvalHistory: [],
        deadline: deadline.toISOString(),
        expiresIn: 24,
      };

      // 注入到主管审批中心（切页可立即看到）
      await pushApprovalBridgeItem({
        currentApprover: managerEmail,
        request: {
          ...baseRequest,
          currentApprover: managerEmail,
          currentApproverRole: '区域业务主管',
        },
      });
      await sendQuotationApprovalNotification(managerEmail, qt, amount, '主管审批');

      // 提交后刷新列表，确保以 Supabase 实际状态回流
    } catch (e: any) {
      toast.error(`❌ 审批记录创建失败：${e?.message || 'approval_records 写入失败'}`);
      return;
    }

    toast.success('✅ 已提交主管审核，请等待审批结果。', { duration: 3000 });
    
    console.log('✅ 提交审批成功:', {
      qtNumber: qt.qtNumber,
      amount: amount,
      requiresDirectorReview,
      managerEmail,
      directorEmail: requiresDirectorReview ? directorEmail : null
    });
  };
  
  // 🔥 新增：发送报价单给客户
  const handleSendToCustomer = async (qt: any) => {
    const canonicalQt = await resolveCanonicalQuotationForSend(qt);
    console.log('═══════════════════════════════════════════════════════');
    console.log('📤 [SalesQuotationManagement] 发送报价单给客户');
    console.log('  - QT单号:', getQuotationDisplayNumber(canonicalQt));
    console.log('  - 客户公司:', canonicalQt.customerCompany);
    console.log('  - 客户邮箱:', canonicalQt.customerEmail);
    console.log('  - 报价金额:', canonicalQt.totalPrice || canonicalQt.totalAmount);
    console.log('  - 完整QT对象:', canonicalQt);

    const sendingKey = getQuotationIdentityKey(canonicalQt);
    if (sendingKey && sendingQuotationIds.includes(sendingKey)) {
      return;
    }
    
    // 🔥 验证客户邮箱
    if (!normalizeMeaningfulText(canonicalQt.customerEmail)) {
      console.error('❌ [SalesQuotationManagement] 客户邮箱无效！');
      toast.error('❌ 客户邮箱无效，无法发送报价单！');
      return;
    }

    const stableQt = await ensurePersistedQuotationRecord(canonicalQt);

    const customerFields = resolveQuotationCustomerFields(stableQt);
    const hydratedCustomerFields = await hydrateQuotationCustomerFields({
      customerEmail: String(customerFields.customerEmail || stableQt.customerEmail || '').trim().toLowerCase(),
      customerName: String(customerFields.customerName || stableQt.customerName || '').trim(),
      customerCompany: String(customerFields.customerCompany || stableQt.customerCompany || '').trim(),
      region: String(customerFields.region || stableQt.region || currentUser?.region || '').trim(),
    });
    const resolvedCustomerEmail = String(hydratedCustomerFields.customerEmail || '').trim().toLowerCase();
    const resolvedCustomerName = String(hydratedCustomerFields.customerName || '').trim();
    const resolvedCustomerCompany = String(hydratedCustomerFields.customerCompany || '').trim();
    const resolvedRegion = String(hydratedCustomerFields.region || '').trim();
    const isResend = ['sent', 'viewed', 'accepted'].includes(String(canonicalQt?.customerStatus || '').trim().toLowerCase());
    const canonicalApprovalStatus = String(canonicalQt?.approvalStatus || '').trim();
    const stableApprovalStatus = String(stableQt?.approvalStatus || '').trim();
    const resolvedApprovalStatus =
      getApprovalStatusPriority(canonicalApprovalStatus) >= getApprovalStatusPriority(stableApprovalStatus)
        ? canonicalApprovalStatus
        : stableApprovalStatus;
    
    const nowIso = new Date().toISOString();
    const quotationNumber = getQuotationDisplayNumber(stableQt) || getQuotationDisplayNumber(canonicalQt);
    const toastId = `send-quotation-${sendingKey || quotationNumber || Date.now()}`;
    const mergeLocalSent = (list: any[], sentQt: any): any[] => {
      const nextRows = mergeQuotationRows(
        list.map((q: any) =>
          matchesQuotationRow(q, canonicalQt) ? { ...q, ...sentQt } : q
        ),
      );
      return nextRows;
    };

    const applyLocalSent = (sentQt: any) => {
      setServerQuotations((prev) => {
        const nextRows = mergeLocalSent(prev, sentQt);
        writeSalesQuotationCache(currentUser?.email, currentUser?.region, nextRows);
        return nextRows;
      });

      emitErpEvent({
        id: `evt-qt-sent-${Date.now()}`,
        key: ERP_EVENT_KEYS.QUOTATION_SENT,
        domain: 'qt',
        recordId: String(sentQt.id || stableQt.id || canonicalQt.id || quotationNumber),
        internalNo: String(getQuotationDisplayNumber(sentQt) || quotationNumber || ''),
        source: 'salesperson',
        occurredAt: nowIso,
        metadata: {
          customerEmail: sentQt.customerEmail || stableQt.customerEmail || canonicalQt.customerEmail,
          customerCompany: sentQt.customerCompany || stableQt.customerCompany || canonicalQt.customerCompany,
          quotation: sentQt,
        },
      });
    };

    const applyLocalRollback = (previousQt: any) => {
      setServerQuotations((prev) => {
        const nextRows = mergeQuotationRows(
          prev.map((q: any) =>
            matchesQuotationRow(q, canonicalQt) ? { ...q, ...previousQt } : q
          ),
        );
        writeSalesQuotationCache(currentUser?.email, currentUser?.region, nextRows);
        return nextRows;
      });
    };

    const normalizeItems = (items: any[]) =>
      items.map((item: any) => ({
        ...item,
        productName: String(
          item?.productName ??
          item?.name ??
          item?.product_name ??
          item?.itemName ??
          item?.item_name ??
          item?.title ??
          item?.description ??
          item?.modelNo ??
          item?.model_no ??
          `Product`,
        ).trim(),
        quantity: Number(item?.quantity ?? item?.qty ?? item?.pcs ?? item?.count ?? 0),
        salesPrice: Number(item.salesPrice ?? item.unitPrice ?? item.quotePrice ?? 0),
        unitPrice:  Number(item.unitPrice ?? item.salesPrice ?? item.quotePrice ?? 0),
      }));

    const previousQtSnapshot = { ...canonicalQt };
    const optimisticSentEntry = {
      ...canonicalQt,
      approvalStatus: resolvedApprovalStatus || canonicalQt.approvalStatus || stableQt.approvalStatus || 'approved',
      customerEmail: resolvedCustomerEmail || canonicalQt.customerEmail,
      customerName: resolvedCustomerName || canonicalQt.customerName,
      customerCompany: resolvedCustomerCompany || canonicalQt.customerCompany,
      region: resolvedRegion || canonicalQt.region,
      customerStatus: 'sent',
      sentAt: nowIso,
      sentToCustomerAt: nowIso,
      sentToCustomer: true,
    };

    try {
      setSendingQuotationIds((prev) => (sendingKey ? [...prev, sendingKey] : prev));
      toast.loading('正在发送报价单给客户...', {
        id: toastId,
        description: `${resolvedCustomerCompany || stableQt.customerCompany || '当前客户'} · ${resolvedCustomerEmail || stableQt.customerEmail || ''}`,
      });

      const sentPatch = buildQuotationPreservedPatch(stableQt, {
        approvalStatus: resolvedApprovalStatus || stableQt.approvalStatus || canonicalQt.approvalStatus || 'approved',
        customerEmail: resolvedCustomerEmail,
        customerName: resolvedCustomerName,
        customerCompany: resolvedCustomerCompany,
        region: resolvedRegion,
        items: resolveQuotationItemsForSync(stableQt, {
          effectiveQuotations,
          quoteRequirements,
        }),
        customerStatus: 'sent',
        sentAt: nowIso,
        sentToCustomerAt: nowIso,
        sentToCustomer: true,
      });

      const syncPayload = {
        ...stableQt,
        ...sentPatch,
        qtNumber: sentPatch.qtNumber || quotationNumber || getQuotationDisplayNumber(stableQt) || getQuotationDisplayNumber(canonicalQt),
        id: stableQt?.id || canonicalQt?.id || undefined,
      };

      let apiQuotation: any = null;
      try {
        apiQuotation = await salesQuotationService.upsertViaServer(syncPayload);
      } catch (supabaseSyncError) {
        console.warn('⚠️ [SalesQuotationManagement] QT 发送前状态写回 Supabase 失败:', supabaseSyncError);
        throw supabaseSyncError;
      }

      let backendQuotation: any = null;
      try {
        backendQuotation = await salesQuotationService.syncAndSendToCustomerApi(syncPayload, { force: isResend });
      } catch (backendSyncError) {
        console.warn('⚠️ [SalesQuotationManagement] Laravel 客户门户同步失败，已保留 Supabase 发送状态:', backendSyncError);
      }

      // 合并时：用 API 返回的元数据（customerEmail、id 等），但保留本地 items（业务员改过的价格）
      // 不能用 apiQuotation.items，因为 DB 可能存的是旧价格（智能反馈自动算的），业务员手动调整后只在前端
      // 强制规范化 items：确保 salesPrice 始终有值（优先 salesPrice，其次 unitPrice，再次 quotePrice）
      const rawLocalItems = stableQt.items && stableQt.items.length > 0 ? stableQt.items : null;
      const localItems = rawLocalItems ? normalizeItems(rawLocalItems) : null;
      const localTotalPrice = localItems && localItems.length > 0
        ? localItems.reduce((sum: number, item: any) => sum + (Number(item.salesPrice) * Number(item.quantity ?? 0)), 0)
        : null;
      const latestQt = apiQuotation
        ? {
            ...stableQt,
            ...apiQuotation,
            // 强制保留本地 items 和 totalPrice，不被 API 旧数据覆盖
            items: localItems ?? normalizeItems(apiQuotation.items ?? []),
            totalPrice: (localTotalPrice && localTotalPrice > 0) ? localTotalPrice : (apiQuotation.totalPrice ?? stableQt.totalPrice),
          }
        : { ...stableQt, ...(backendQuotation || {}), items: rawLocalItems ? normalizeItems(rawLocalItems) : stableQt.items };
      const sentEntry = {
        ...latestQt,
        approvalStatus: resolvedApprovalStatus || latestQt.approvalStatus || stableQt.approvalStatus || canonicalQt.approvalStatus || 'approved',
        customerEmail: resolvedCustomerEmail || latestQt.customerEmail || stableQt.customerEmail,
        customerName: resolvedCustomerName || latestQt.customerName || stableQt.customerName,
        customerCompany: resolvedCustomerCompany || latestQt.customerCompany || stableQt.customerCompany,
        region: resolvedRegion || latestQt.region || stableQt.region,
        customerStatus: 'sent',
        sentAt: nowIso,
        sentToCustomerAt: nowIso,
        sentToCustomer: true,
      };
      applyLocalSent(sentEntry);
      toast.success('✅ 报价单已成功发送给客户！', {
        id: toastId,
        description: `客户 ${sentEntry.customerCompany || sentEntry.customerName || '当前客户'} (${sentEntry.customerEmail || stableQt.customerEmail}) 现在可以在 Customer Portal 中查看报价单 ${quotationNumber || 'QT'}`,
        duration: 5000,
      });
      void loadSalesQuotations();
    } catch (error: any) {
      console.error('❌ [SalesQuotationManagement] 发送报价单接口失败:', error);
      applyLocalRollback(previousQtSnapshot);
      toast.error(`❌ 发送失败: ${error?.message || '未知错误'}`, { id: toastId });
    } finally {
      setSendingQuotationIds((prev) => prev.filter((id) => id !== sendingKey));
    }
  };

  // 将“已发送”重置回“未发送”，用于重新走发送流程
  const handleUnlockSend = async (qt: any) => {
    const key = qt.qtNumber || qt.id;
    const applyLocalUnlock = () => {
      const patchList = (list: any[]) =>
        list.map((q: any) =>
          (q.id === qt.id || q.qtNumber === qt.qtNumber)
            ? { ...q, customerStatus: 'not_sent', customerResponse: null, sentAt: null, sentToCustomerAt: null }
            : q
        );

      setServerQuotations((prev) => {
        const nextRows = patchList(prev);
        writeSalesQuotationCache(currentUser?.email, currentUser?.region, nextRows);
        return nextRows;
      });
    };

    try {
      await persistQuotationPatchDirect(qt, {
        customerStatus: 'not_sent',
        customerResponse: null,
        sentAt: null,
        sentToCustomerAt: null,
        sentToCustomer: false,
      });
      applyLocalUnlock();
      toast.success('已解锁为可发送状态');
    } catch (e: any) {
      console.warn('⚠️ 解锁发送 Supabase 更新失败:', e?.message);
      toast.error(e?.message || '解锁发送失败');
    }
  };
  
  // 🔥 处理生成销售合同
  const handleGenerateContract = (qt: any) => {
    console.log('═══════════════════════════════════════════════════════');
    console.log('🔥 [handleGenerateContract] 开始生成销售合同');
  };
  
  // 🔥 新增：下推生成销售合同
  const handlePushToContract = async (qt: any) => {
    console.log('═══════════════════════════════════════════════════════');
    console.log('🔥 [handlePushToContract] 开始下推生成销售合同');
    console.log('  - QT单号:', qt.qtNumber);
    console.log('  - 客户公司:', qt.customerCompany);
    console.log('  - 报价金额:', qt.totalPrice || qt.totalAmount);
    console.log('  - 完整QT对象:', qt);
    const readyQt = await ensureBoundQuotationSnapshot(qt);
    if (!readyQt) {
      return;
    }
    if (readyQt.projectRevisionId) {
      const isExecutionLocked =
        readyQt.quotationRole === 'accepted' &&
        readyQt.projectRevisionStatus === 'final' &&
        Boolean(readyQt.finalRevisionId) &&
        readyQt.finalRevisionId === readyQt.projectRevisionId;

      if (!isExecutionLocked) {
        toast.error('项目类报价尚未锁定最终执行版本。', {
          description: '请先使用 Lock Final，确认最终 revision 与最终报价，再生成销售合同。',
        });
        return;
      }
    }
    
    // 一对一约束：同一个 QT 只能对应一张有效 SC
    const existingContract = getContractByQuotationNumber(readyQt.qtNumber);
    if (existingContract) {
      toast.info(`该报价单已存在销售合同 ${existingContract.contractNumber}，将直接进入合同流转。`);
      if (onNavigateToOrdersWithHighlight) {
        onNavigateToOrdersWithHighlight(existingContract.contractNumber);
      } else if (onNavigateToOrders) {
        onNavigateToOrders();
      }
      return;
    }

    // 先本地创建合同（保证 UI 立即响应），再异步尝试同步到后端
    try {
      const itemsSource = readyQt.items || qt.items || [];
      const items = itemsSource.map((item: any, idx: number) => {
        const normalizedItem = normalizeFlowProductCore(item, idx);
        return {
          id: item.id || `product-${idx}`,
          productName: normalizedItem.productName,
          productNameEn: normalizedItem.productNameEn,
          productNameZh: normalizedItem.productNameZh,
          modelNo: normalizedItem.modelNo,
          imageUrl: normalizedItem.imageUrl,
          specification: normalizedItem.specification,
          specificationEn: normalizedItem.specificationEn,
          specificationZh: normalizedItem.specificationZh,
          hsCode: item.hsCode || '',
          quantity: normalizedItem.quantity,
          unit: normalizedItem.unit || 'PCS',
          unitPrice: Number(item.salesPrice ?? item.unitPrice ?? item.quotePrice ?? 0),
          currency: item.currency || readyQt.currency || 'USD',
          amount: Number(item.salesPrice ?? item.unitPrice ?? item.quotePrice ?? 0) * Number(normalizedItem.quantity || 0),
          deliveryTime: item.leadTime || '',
        };
      });

      const totalAmount = items.reduce((sum: number, p: any) => sum + p.amount, 0) || Number(readyQt.totalPrice || readyQt.totalAmount || 0);
      const quotationOwner = resolveQuotationOwnerFromQr(readyQt);
      const contractPaymentTerms =
        readyQt.tradeTerms?.paymentTerms
        || readyQt.paymentTerms
        || buildPaymentTermsText(readyQt.paymentMode || null, readyQt.balanceTrigger || null);

      console.log('🔥 [handlePushToContract] 本地创建合同，items:', items.length, 'totalAmount:', totalAmount);

      const scPayload = {
        quotationNumber: readyQt.qtNumber,
        qrNumber: readyQt.qrNumber || '',
        inquiryNumber: readyQt.inqNumber || readyQt.xjNumber || '',
        projectId: readyQt.projectId || null,
        projectCode: readyQt.projectCode || null,
        projectName: readyQt.projectName || null,
        projectRevisionId: readyQt.projectRevisionId || null,
        projectRevisionCode: readyQt.projectRevisionCode || null,
        projectRevisionStatus: readyQt.projectRevisionStatus || null,
        finalRevisionId: readyQt.finalRevisionId || null,
        finalQuotationId: readyQt.id || null,
        finalQuotationNumber: readyQt.qtNumber || null,
        quotationRole: readyQt.quotationRole || null,
        customerName: readyQt.customerName || readyQt.customerCompany || '',
        customerEmail: readyQt.customerEmail || '',
        customerCompany: readyQt.customerCompany || '',
        customerAddress: readyQt.customerAddress || '',
        customerCountry: readyQt.customerCountry || '',
        contactPerson: readyQt.customerName || '',
        contactPhone: readyQt.customerPhone || '',
        salesPerson: quotationOwner.salesPerson || readyQt.salesPerson || currentUser?.email || '',
        salesPersonName: quotationOwner.salesPersonName || readyQt.salesPersonName || currentUser?.name || '',
        region: readyQt.region || 'NA',
        products: items,
        totalAmount,
        currency: readyQt.currency || 'USD',
        tradeTerms: readyQt.tradeTerms?.incoterms || readyQt.deliveryTerms || 'FOB Xiamen',
        paymentTerms: contractPaymentTerms,
        paymentMode: readyQt.paymentMode || null,
        balanceTrigger: readyQt.balanceTrigger || null,
        deliveryTime: readyQt.tradeTerms?.deliveryTime || '25-30 days after deposit',
        portOfLoading: readyQt.tradeTerms?.portOfLoading || 'Xiamen, China',
        remarks: readyQt.projectRevisionId
          ? [
              readyQt.remarks || '',
              `Execution Baseline: ${readyQt.projectCode ? `${readyQt.projectCode} · ` : ''}${readyQt.projectName || 'Project'} / Rev ${readyQt.projectRevisionCode || '-'} / Final QT ${readyQt.qtNumber}`,
            ].filter(Boolean).join('\n')
          : (readyQt.remarks || ''),
        templateId: readyQt.templateId || null,
        templateVersionId: readyQt.templateVersionId || null,
        templateSnapshot: readyQt.templateSnapshot || null,
        documentRenderMeta: readyQt.projectRevisionId
          ? {
              projectExecutionBaseline: {
                projectId: readyQt.projectId || null,
                projectCode: readyQt.projectCode || null,
                projectName: readyQt.projectName || null,
                projectRevisionId: readyQt.projectRevisionId || null,
                projectRevisionCode: readyQt.projectRevisionCode || null,
                projectRevisionStatus: readyQt.projectRevisionStatus || null,
                finalRevisionId: readyQt.finalRevisionId || null,
                finalQuotationId: readyQt.id || null,
                finalQuotationNumber: readyQt.qtNumber || null,
                quotationRole: readyQt.quotationRole || null,
              },
            }
          : null,
      };
      const sc = await createContract({
        ...scPayload,
        documentDataSnapshot: adaptSalesContractToDocumentData({
          ...scPayload,
          createdAt: new Date().toISOString(),
        }),
      });

      console.log('✅ [handlePushToContract] createContract 完成，合同编号:', sc.contractNumber);

      // 回写报价单状态
      setServerQuotations((prev: any[]) =>
        prev.map((q: any) =>
          q.id === qt.id
            ? { ...q, pushedToContract: true, pushedContractNumber: sc.contractNumber }
            : q
        )
      );

      toast.success('✅ 销售合同生成成功！', {
        description: `合同编号：${sc.contractNumber}\n正在跳转到订单管理...`,
        duration: 1800,
      });

      if (onNavigateToOrdersWithHighlight) {
        onNavigateToOrdersWithHighlight(sc.contractNumber);
      } else if (onNavigateToOrders) {
        onNavigateToOrders();
      }

      // 异步同步到 Supabase（失败不影响前端显示）
      salesQuotationService.updateStatus(qt.id || qt.qtNumber, 'contract_created', {
        pushed_contract_number: sc.contractNumber,
      }).then(() => {
        loadSalesQuotations();
      }).catch((e: any) => {
        console.warn('⚠️ [handlePushToContract] Supabase 同步失败（不影响本地合同）:', e?.message || e);
      });

    } catch (localErr: any) {
      console.error('❌ [handlePushToContract] 本地创建失败:', localErr);
      toast.error(`❌ 生成销售合同失败: ${localErr?.message || '未知错误'}`);
    }
  };

  const handleOpenContractFlow = (qt: any) => {
    const existingContract = getContractByQuotationNumber(qt.qtNumber);
    const contractNumber = String(
      existingContract?.contractNumber ||
      qt?.pushedContractNumber ||
      '',
    ).trim();

    if (!contractNumber) {
      toast.error('未找到已生成的销售合同', {
        description: '请先点击“下推合同”生成销售合同，再进入后续流转。',
      });
      return;
    }

    toast.success('正在进入销售合同流转', {
      description: `合同编号：${contractNumber}`,
      duration: 2500,
    });

    if (onNavigateToOrdersWithHighlight) {
      onNavigateToOrdersWithHighlight(contractNumber);
      return;
    }

    if (onNavigateToOrders) {
      onNavigateToOrders();
    }
  };
  
  // 🔥 标准化区域代码
  const normalizeRegionCode = (region: string): 'NA' | 'SA' | 'EA' => {
    const regionMap: Record<string, 'NA' | 'SA' | 'EA'> = {
      'NA': 'NA',
      'North America': 'NA',
      'SA': 'SA',
      'South America': 'SA',
      'EMEA': 'EA',
      'EA': 'EA',
      'Europe & Africa': 'EA',
      'Other': 'NA'
    };
    
    return regionMap[region] || 'NA';
  };
  
  // 🔥 获取区域主管邮箱的辅助函数
  const getRegionalManager = (region: string) => {
    const managers = REGIONAL_MANAGER_EMAILS;
    return managers[region] || managers['NA'];
  };
  
  // 🔥 筛选：只做状态、搜索筛选；数据来自接口，后端已按权限过滤
  const myQuotations = useMemo(() => {
    const role = String(currentUser?.userRole || currentUser?.role || '').trim();
    const canReadAll = ['Admin', 'CEO', 'Boss', 'CFO', 'Sales_Director'].includes(role);
    const effectiveEmail = String(currentUser?.email || '').trim();
    const normalizedCurrentEmail = normalizePersonnelEmail(effectiveEmail, currentUser?.region);
    const ownerAliases = normalizedCurrentEmail
      ? getPersonnelEmailAliases(normalizedCurrentEmail, currentUser?.region)
      : [];
    const stickyQtNumber = String(highlightQtNumber || stickyQtNumberRef.current || '').trim();

    const filtered = effectiveQuotations.filter(qt => {
      if (!canReadAll && ownerAliases.length > 0) {
        const resolvedOwnerEmail = resolveQuotationOwnerEmail(qt);
        const normalizedSalesPerson = normalizePersonnelEmail(qt?.salesPerson, qt?.region);
        const isHighlighted = stickyQtNumber && String(qt?.qtNumber || '').trim() === stickyQtNumber;
        const matchesOwner = isHighlighted || [resolvedOwnerEmail, normalizedSalesPerson, String(qt?.salesPerson || '').trim().toLowerCase()]
          .filter(Boolean)
          .some((email) => ownerAliases.includes(email));

        if (!matchesOwner) {
          return false;
        }
      }

      // 状态筛选
      if (filterStatus !== 'all' && qt.approvalStatus !== filterStatus) {
        return false;
      }
      
      // 搜索筛选
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return (
          qt.qtNumber.toLowerCase().includes(term) ||
          qt.qrNumber.toLowerCase().includes(term) ||
          qt.inqNumber.toLowerCase().includes(term) ||
          qt.customerCompany.toLowerCase().includes(term) ||
          qt.items.some(item => 
            item.productName.toLowerCase().includes(term) ||
            getFormalBusinessModelNo(item).toLowerCase().includes(term)
          )
        );
      }
      
      return true;
    });

    return filtered;
  }, [currentUser?.email, currentUser?.region, currentUser?.role, currentUser?.userRole, effectiveQuotations, filterStatus, highlightQtNumber, resolveQuotationOwnerEmail, searchTerm]);
  
  // 🔥 统计信息
  const stats = useMemo(() => {
    const total = myQuotations.length;
    const draft = myQuotations.filter(qt => qt.approvalStatus === 'draft').length;
    const pendingApproval = myQuotations.filter(qt => 
      qt.approvalStatus === 'pending_approval' || 
      qt.approvalStatus === 'pending_director'
    ).length;
    const pendingManager = myQuotations.filter(qt => qt.approvalStatus === 'pending_approval').length;
    const pendingDirector = myQuotations.filter(qt => qt.approvalStatus === 'pending_director').length;
    const approved = myQuotations.filter(qt => qt.approvalStatus === 'approved').length;
    const rejected = myQuotations.filter(qt => qt.approvalStatus === 'rejected').length;
    const sent = myQuotations.filter(qt => qt.customerStatus === 'sent' || qt.customerStatus === 'viewed' || qt.customerStatus === 'accepted' || qt.customerStatus === 'rejected').length;
    
    return { total, draft, pendingApproval, pendingManager, pendingDirector, approved, rejected, sent };
  }, [myQuotations]);

  const startQuotationColumnResize = (
    key: SalesQuotationColumnKey,
    event: React.MouseEvent<HTMLDivElement>,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    setQuotationHasCustomWidths(true);
    quotationColumnResizeRef.current = {
      key,
      startX: event.clientX,
      startWidth: renderedQuotationColumnWidths[key],
    };
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  const shrinkQuotationColumnToMinimum = (
    key: SalesQuotationColumnKey,
    event: React.MouseEvent<HTMLDivElement>,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    setQuotationHasCustomWidths(true);
    setQuotationColumnWidths((current) => (
      current[key] === SALES_QUOTATION_COLUMN_MIN_WIDTHS[key]
        ? current
        : { ...current, [key]: SALES_QUOTATION_COLUMN_MIN_WIDTHS[key] }
    ));
  };

  const renderedQuotationColumnWidths = useMemo(() => {
    return fitQuotationColumnWidthsToContainer(
      quotationColumnWidths,
      quotationTableContainerWidth,
    );
  }, [quotationColumnWidths, quotationTableContainerWidth]);

  const getQuotationColumnStyle = (key: SalesQuotationColumnKey) =>
    getColumnStyle(renderedQuotationColumnWidths, key);

  const renderQuotationColumnResizeHandle = (key: SalesQuotationColumnKey) =>
    renderColumnResizeHandle(
      key,
      startQuotationColumnResize,
      shrinkQuotationColumnToMinimum,
      {
        lineHoverClassName: 'group-hover:bg-slate-400',
      },
    );

  const renderQuotationHeaderCell = (
    key: SalesQuotationColumnKey,
    label: string,
    className = '',
  ) => {
    const headerAlignClass = className.includes('text-right')
      ? 'justify-end text-right'
      : className.includes('text-center')
        ? 'justify-center text-center'
        : 'justify-start text-left';
    const headerPaddingClass = key === 'select'
      ? 'px-0'
      : key === 'index'
        ? 'pl-2 pr-3'
        : key === 'actions'
          ? 'pl-3 pr-4'
          : 'px-3';

    return (
    <TableHead
      className={`group relative overflow-hidden py-3 align-middle ${headerPaddingClass} ${className}`.trim()}
      style={getQuotationColumnStyle(key)}
    >
      <div className={`flex min-h-5 w-full items-center pr-4 ${headerAlignClass}`}>
        <span className={`block break-words whitespace-normal ${ERP_LIST_UI_SPEC_V1.headerTextClass}`}>
          {label}
        </span>
      </div>
      {renderQuotationColumnResizeHandle(key)}
    </TableHead>
    );
  };
  
  // 🔥 获取状态Badge（审批状态）
  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
      draft: { label: '草稿', color: 'bg-slate-50 text-slate-600 border-slate-200', icon: Edit },
      pending_approval: { label: '待主管审批', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock },
      pending_director: { label: '待总监审批', color: 'bg-orange-50 text-orange-700 border-orange-200', icon: AlertCircle },
      approved: { label: '已批准', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle },
      rejected: { label: '已驳回', color: 'bg-rose-50 text-rose-700 border-rose-200', icon: XCircle },
    };
    
    const config = statusConfig[status] || statusConfig.draft;
    const Icon = config.icon;
    
    return (
      <Badge className={`h-6 px-2 text-[11px] border ${config.color} inline-flex items-center gap-1 rounded-full font-medium shadow-none`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };
  
  // 🔥 获取客户状态Badge（带Tooltip显示时间线）
  const getCustomerStatusBadge = (qt: any) => {
    const status = qt.customerStatus;
    const statusConfig: Record<string, { label: string; icon: any; color: string }> = {
      not_sent: { label: '未发送', icon: Clock, color: 'bg-slate-50 text-slate-500 border-slate-200' },
      sent: { label: '已发送', icon: Send, color: 'bg-sky-50 text-sky-600 border-sky-200' },
      viewed: { label: '已查看', icon: Eye, color: 'bg-violet-50 text-violet-600 border-violet-200' },
      accepted: { label: '已确认', icon: CheckCircle, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
      rejected: { label: '已拒绝', icon: XCircle, color: 'bg-rose-50 text-rose-700 border-rose-200' },
      negotiating: { label: '需协商', icon: AlertCircle, color: 'bg-orange-50 text-orange-700 border-orange-200' },
      expired: { label: '已过期', icon: XCircle, color: 'bg-slate-50 text-slate-400 border-slate-200' },
    };
    
    const config = statusConfig[status] || statusConfig.not_sent;
    const Icon = config.icon;
    
    // 🔥 构建Tooltip内容
    const getTooltipContent = () => {
      const lines: string[] = [];
      
      // 📤 发送时间
      if (qt.sentToCustomerAt || qt.sentAt) {
        const sentTime = new Date(qt.sentToCustomerAt || qt.sentAt).toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        });
        lines.push(`📤 发送时间：${sentTime}`);
        lines.push(`👤 发送人：${qt.sentBy || qt.salesPersonName || '系统'}`);
      }
      
      // 💬 客户响应
      if (qt.customerResponse) {
        const responseTime = new Date(qt.customerResponse.respondedAt).toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        });
        
        let responseLabel = '';
        if (qt.customerResponse.status === 'accepted') {
          responseLabel = '✅ 客户确认';
        } else if (qt.customerResponse.status === 'rejected') {
          responseLabel = '❌ 客户拒绝';
        } else if (qt.customerResponse.status === 'negotiating') {
          responseLabel = '💬 请求协商';
        }
        
        lines.push('');
        lines.push(`${responseLabel}：${responseTime}`);
        
        if (qt.customerResponse.comment) {
          lines.push(`💭 客户反馈：${qt.customerResponse.comment}`);
        }
      }
      
      // 如果没有任何时间信息
      if (lines.length === 0) {
        if (status === 'not_sent') {
          return '📌 报价单尚未发送给客户';
        }
        return '📌 暂无时间线信息';
      }
      
      return lines.join('\n');
    };
    
    const tooltipContent = getTooltipContent();
    
    // 🔥 渲染Badge with Tooltip
    return (
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <Badge className={`h-6 cursor-help rounded-full border px-2 text-[11px] font-medium ${config.color} inline-flex items-center gap-1 shadow-none`}>
            <Icon className="h-3 w-3" />
            {config.label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent 
          side="left" 
          className="max-w-xs bg-gray-900 text-white text-xs whitespace-pre-line p-3"
          sideOffset={5}
        >
          {tooltipContent}
        </TooltipContent>
      </Tooltip>
    );
  };

  const getContractBridgeStageLabel = (status?: string | null) => {
    switch (String(status || '').trim()) {
      case 'draft':
        return '合同草稿';
      case 'pending_supervisor':
      case 'pending_director':
        return '合同待审批';
      case 'approved':
        return '合同已批准';
      case 'sent':
      case 'sent_to_customer':
        return '合同已发送';
      case 'customer_confirmed':
        return '合同已确认';
      case 'customer_rejected':
        return '合同已拒绝';
      case 'customer_requested_changes':
        return '合同待修改';
      case 'deposit_uploaded':
        return '已传定金';
      case 'deposit_confirmed':
        return '定金已确认';
      case 'po_generated':
        return '已启动采购';
      case 'production':
        return '生产中';
      case 'balance_confirmed':
        return '尾款已确认';
      case 'shipped':
        return '已发货';
      case 'completed':
        return '已完成';
      default:
        return '';
    }
  };

  const openRejectionCommentDialog = (qt: any, comment?: string) => {
    setRejectionCommentDialog({
      qtNumber: String(qt?.qtNumber || qt?.quotationNumber || '未命名单据'),
      customerCompany: String(qt?.customerCompany || qt?.customerName || '当前客户'),
      comment: String(comment || '').trim() || '本次驳回未填写具体意见，请联系主管确认修改方向。',
    });
  };
  
  return (
    <div className="flex flex-1 min-h-0 flex-col space-y-4">
      {/* 🔥 报价单列表 */}
      <div className="flex flex-1 min-h-0 w-full max-w-full flex-col overflow-visible rounded-lg border border-gray-200 bg-white min-h-[calc(100dvh-360px)]">
        <div className="border-b border-gray-200">
          <div className="px-5 py-3 bg-gray-50">
            <div className="flex gap-3 items-center">
              {/* 搜索框 */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
                <Input
                  placeholder="搜索报价单号、采购需求单号、询价单号、客户名称、产品..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`pl-9 h-9 ${ERP_LIST_UI_SPEC_V1.searchTextClass}`}
                />
              </div>
              
              {/* 🔥 新增：批量删除按钮 */}
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBatchDelete}
                disabled={selectedIds.length === 0}
                className={`gap-1 ${ERP_LIST_UI_SPEC_V1.buttonTextClass}`}
              >
                批量删除 {selectedIds.length > 0 && `(${selectedIds.length})`}
              </Button>
              
              {/* 状态筛选标签 */}
              <div className="flex gap-2">
                <Button 
                  variant="outline"
                  size="sm"
                  style={filterStatus === 'all' ? {
                    backgroundColor: '#F5222D',
                    borderColor: '#F5222D',
                    color: '#ffffff',
                  } : undefined}
                  className={`${ERP_LIST_UI_SPEC_V1.buttonTextClass} ${filterStatus === 'all' ? 'border-[#F5222D] bg-[#F5222D] !text-white hover:bg-[#d71922]' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
                  onClick={() => setFilterStatus('all')}
                >
                  全部 ({stats.total})
                </Button>
                <Button 
                  variant="outline"
                  size="sm"
                  style={filterStatus === 'draft' ? {
                    backgroundColor: '#F5222D',
                    borderColor: '#F5222D',
                    color: '#ffffff',
                  } : undefined}
                  className={`${ERP_LIST_UI_SPEC_V1.buttonTextClass} ${filterStatus === 'draft' ? 'border-[#F5222D] bg-[#F5222D] !text-white hover:bg-[#d71922]' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
                  onClick={() => setFilterStatus('draft')}
                >
                  草稿 ({stats.draft})
                </Button>
                <Button 
                  variant="outline"
                  size="sm"
                  style={filterStatus === 'pending_approval' ? {
                    backgroundColor: '#F5222D',
                    borderColor: '#F5222D',
                    color: '#ffffff',
                  } : undefined}
                  className={`${ERP_LIST_UI_SPEC_V1.buttonTextClass} ${filterStatus === 'pending_approval' ? 'border-[#F5222D] bg-[#F5222D] !text-white hover:bg-[#d71922]' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
                  onClick={() => setFilterStatus('pending_approval')}
                >
                  待审批 ({stats.pendingApproval})
                </Button>
                <Button 
                  variant="outline"
                  size="sm"
                  style={filterStatus === 'approved' ? {
                    backgroundColor: '#F5222D',
                    borderColor: '#F5222D',
                    color: '#ffffff',
                  } : undefined}
                  className={`${ERP_LIST_UI_SPEC_V1.buttonTextClass} ${filterStatus === 'approved' ? 'border-[#F5222D] bg-[#F5222D] !text-white hover:bg-[#d71922]' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
                  onClick={() => setFilterStatus('approved')}
                >
                  已批准 ({stats.approved})
                </Button>
                <Button 
                  variant="outline"
                  size="sm"
                  style={filterStatus === 'rejected' ? {
                    backgroundColor: '#F5222D',
                    borderColor: '#F5222D',
                    color: '#ffffff',
                  } : undefined}
                  className={`${ERP_LIST_UI_SPEC_V1.buttonTextClass} ${filterStatus === 'rejected' ? 'border-[#F5222D] bg-[#F5222D] !text-white hover:bg-[#d71922]' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
                  onClick={() => setFilterStatus('rejected')}
                >
                  已拒绝 ({stats.rejected})
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        {/* 🔥 报价单表格 */}
        <div ref={quotationTableContainerRef} className="w-full max-w-full flex-1 min-h-0 overflow-x-auto overflow-y-visible bg-white rounded-[inherit]">
          <Table
            className="table-fixed border-collapse"
            style={{ width: '100%', maxWidth: '100%' }}
          >
            <colgroup>
              {SALES_QUOTATION_COLUMN_ORDER.map((key) => (
                <col key={key} style={getQuotationColumnStyle(key)} />
              ))}
            </colgroup>
            <TableHeader>
              <TableRow className={`bg-gray-50 text-slate-700 ${ERP_LIST_UI_SPEC_V1.headerTextClass}`}>
                {/* 🔥 新增：复选框列 */}
                <TableHead
                  className="group relative overflow-hidden px-0 py-3 align-middle text-center"
                  style={getQuotationColumnStyle('select')}
                >
                  <div className="flex min-h-5 w-full items-center justify-center px-2">
                    <Checkbox
                      checked={selectedIds.length > 0 && selectedIds.length === myQuotations.length}
                      onCheckedChange={handleSelectAll}
                    />
                  </div>
                  {renderQuotationColumnResizeHandle('select')}
                </TableHead>
                {/* 🔥 新增：序号列 */}
                {renderQuotationHeaderCell('index', '序号')}
                {renderQuotationHeaderCell('date', '日期')}
                {renderQuotationHeaderCell('qtNumber', '编号')}
                {renderQuotationHeaderCell('region', '区域')}
                {renderQuotationHeaderCell('customer', '客户信息')}
                {renderQuotationHeaderCell('product', '产品信息')}
                {renderQuotationHeaderCell('quantity', '产品数量', 'text-right')}
                {renderQuotationHeaderCell('unitPrice', '产品单价', 'text-right')}
                {renderQuotationHeaderCell('amount', '报价金额', 'text-right')}
                {renderQuotationHeaderCell('approvalStatus', '审批状态', 'text-center')}
                {renderQuotationHeaderCell('customerStatus', '客户状态', 'text-center')}
                <TableHead
                  className="group relative overflow-hidden py-3 pl-3 pr-4 text-right align-middle"
                  style={getQuotationColumnStyle('actions')}
                >
                  <div className="flex min-h-5 w-full items-center justify-center pr-4">
                    <span className={`block break-words whitespace-normal ${ERP_LIST_UI_SPEC_V1.headerTextClass}`}>
                      操作
                    </span>
                  </div>
                  {renderQuotationColumnResizeHandle('actions')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="text-[11px] text-slate-700">
              {myQuotations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={13} className="text-center py-12 text-gray-500">
                    {loadingFromApi ? (
                      <>
                        <Loader2 className="h-12 w-12 mx-auto mb-3 text-gray-400 animate-spin" />
                        <p>正在加载报价单</p>
                        <p className="text-sm mt-1">请稍候，系统正在同步最新报价数据...</p>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                        <p>暂无报价单</p>
                        <p className="text-sm mt-1">在成本询报模块中，点击"下推报价管理"可创建报价单</p>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                myQuotations.map((qt, index) => {
                  const isHighlighted = highlightedId === qt.id; // 🔥 判断是否高亮
                  const financialMetrics = getQuotationProfitMetrics(qt);
                  const hasAcceptedCustomerResponse =
                    qt.customerResponse?.status === 'accepted' ||
                    qt.customerStatus === 'accepted';
                  const existingContract = getContractByQuotationNumber(qt.qtNumber);
                  const existingContractNumber = String(
                    existingContract?.contractNumber ||
                    qt?.documentRenderMeta?.contractBridge?.contractNumber ||
                    qt?.pushedContractNumber ||
                    '',
                  ).trim();
                  const contractBridgeStatus = String(
                    existingContract?.status ||
                    qt?.documentRenderMeta?.contractBridge?.contractStatus ||
                    '',
                  ).trim();
                  const contractBridgeLabel = getContractBridgeStageLabel(contractBridgeStatus);
                  const hasGeneratedContract = Boolean(existingContractNumber || qt?.pushedToContract);
                  const contractPushBlocked = Boolean(
                    qt.projectRevisionId &&
                    !(
                      qt.quotationRole === 'accepted' &&
                      qt.projectRevisionStatus === 'final' &&
                      qt.finalRevisionId &&
                      qt.finalRevisionId === qt.projectRevisionId
                    )
                  );
                  const latestRejectionComment =
                    extractLatestApprovalRejectionComment(qt) ||
                    approvalRejectionCommentIndex[String(qt?.id || '').trim()] ||
                    approvalRejectionCommentIndex[String(qt?.qtNumber || qt?.quotationNumber || '').trim()] ||
                    '';
                  
                  const itemQtyTotal = (qt.items || []).reduce(
                    (sum: number, item: any) => sum + (Number(item?.quantity) || 0),
                    0
                  );
                  const unitSet = Array.from(new Set((qt.items || []).map((item: any) => String(item?.unit || '').trim()).filter(Boolean)));
                  const qtyDisplay = unitSet.length === 1
                    ? `${itemQtyTotal.toLocaleString()} ${unitSet[0]}`
                    : (qt.items || []).length > 0
                      ? '混合单位'
                      : '-';

                  const unitPrices = (qt.items || [])
                    .map((item: any) => Number(item?.salesPrice ?? item?.unitPrice ?? 0))
                    .filter((v: number) => Number.isFinite(v) && v > 0);
                  const minPrice = unitPrices.length > 0 ? Math.min(...unitPrices) : null;
                  const maxPrice = unitPrices.length > 0 ? Math.max(...unitPrices) : null;
                  const unitPriceDisplay =
                    minPrice == null || maxPrice == null
                      ? '--'
                      : minPrice === maxPrice
                        ? `$${minPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        : `$${minPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ~ $${maxPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                  const relatedRefs = sortDocumentFlowRefs([
                    qt.qrNumber
                      ? {
                          value: String(qt.qrNumber),
                          className: `${ERP_LIST_UI_SPEC_V1.secondaryTextClass} font-mono font-medium text-emerald-600`,
                        }
                      : null,
                    qt.inqNumber
                      ? {
                          value: String(qt.inqNumber),
                          className: `${ERP_LIST_UI_SPEC_V1.secondaryTextClass} font-mono text-violet-600`,
                        }
                      : null,
                  ].filter(Boolean) as Array<{ value: string; className: string }>);
                  const relatedRefsExpanded = expandedRelatedIds.includes(String(qt.id));
                  
                  return (
                  <TableRow 
                    key={qt.id} 
                    className={`[&>td]:py-3 [&>td]:align-top hover:bg-gray-50 transition-all duration-300 ${
                      isHighlighted ? 'bg-yellow-100 border-2 border-yellow-400 shadow-lg' : ''
                    }`}
                    style={isHighlighted ? { animation: 'pulse 1s ease-in-out 3' } : undefined}
                  >
                    {/* 🔥 新增：复选框 */}
                    <TableCell className="px-0 py-3 text-center align-middle">
                      <div className="flex w-full items-center justify-center px-2">
                        <Checkbox
                          checked={selectedIds.includes(qt.id)}
                          onCheckedChange={(checked) => handleSelectOne(qt.id, checked as boolean)}
                        />
                      </div>
                    </TableCell>
                    {/* 🔥 新增：序号 */}
                    <TableCell className="px-2 py-3 text-center align-middle text-[11px] text-gray-500">
                      <div className="flex w-full items-center justify-center">
                        {index + 1}
                      </div>
                    </TableCell>
                    <TableCell className="px-2 align-top overflow-hidden">
                      <div className="flex flex-col">
                        <div className="min-h-[20px] flex items-start">
                          <span className="mr-1 text-[12px] text-slate-500">创</span>
                          <span className="text-[12px] font-medium text-slate-900">
                            {formatSalesQuotationDateOnly(
                              String(qt.createdAt || qt.created_at || '').trim() || null,
                            )}
                          </span>
                        </div>
                        <div className="min-h-[16px] flex items-start">
                          <span className="mr-1 text-[12px] text-slate-500">截</span>
                          <span className="text-[12px] font-medium text-slate-900">
                            {formatSalesQuotationDateOnly(
                              String(qt.validUntil || qt.deadline || '').trim() || null,
                            )}
                          </span>
                        </div>
                        <div className="min-h-[16px] flex items-start">
                          <span className="mr-1 text-[12px] text-slate-500">交</span>
                          <span className="text-[12px] font-medium text-slate-900">
                            {formatSalesQuotationDateOnly(
                              String(qt.deliveryDate || qt.delivery_date || '').trim() || null,
                            )}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-2 font-mono font-semibold text-blue-600 cursor-pointer align-top overflow-hidden" onClick={() => handleViewQuotation(qt)}>
                      <div className="flex flex-col">
                        <div className="min-h-[20px] flex items-start">
                          <div className={`truncate whitespace-nowrap ${ERP_LIST_UI_SPEC_V1.primaryTextClass} leading-5`} title={qt.qtNumber}>
                            {qt.qtNumber}
                          </div>
                        </div>
                        <div className="min-h-[16px]">
                          {relatedRefs.length > 0 ? (
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                setExpandedRelatedIds((current) =>
                                  current.includes(String(qt.id))
                                    ? current.filter((id) => id !== String(qt.id))
                                    : [...current, String(qt.id)],
                                );
                              }}
                              className={`block text-left ${ERP_LIST_UI_SPEC_V1.secondaryTextClass} font-semibold leading-4 text-slate-500 hover:text-slate-700`}
                            >
                              {relatedRefsExpanded ? '收起关联编号' : `展开关联编号 (${relatedRefs.length})`}
                            </button>
                          ) : null}
                        </div>
                        {relatedRefsExpanded ? (
                          <div className="mt-1 space-y-1">
                            {relatedRefs.map((ref) => (
                              <button
                                key={`${qt.id}-${ref.value}`}
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  const target = String(ref.value || '').trim();
                                  if (target.startsWith('QR-')) {
                                    onNavigateToCostInquiryWithHighlight?.(target);
                                    return;
                                  }
                                  if (target.startsWith('ING-')) {
                                    onNavigateToInquiryWithHighlight?.(target);
                                  }
                                }}
                                className={`${ref.className} block break-all whitespace-normal leading-4 ${String(ref.value || '').trim().match(/^(QR|ING)-/) ? 'cursor-pointer hover:underline' : 'cursor-default'}`}
                                title={ref.value}
                              >
                                {ref.value}
                              </button>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="px-2 align-top overflow-hidden">
                      <div className="flex flex-col">
                        <div className="min-h-[20px] flex items-start">
                          <Badge variant="outline" className={`h-6 rounded-full px-2 ${ERP_LIST_UI_SPEC_V1.secondaryTextClass} text-slate-700`}>
                            {formatRegionLabel(qt.region)}
                          </Badge>
                        </div>
                        <div className="min-h-[16px]" />
                      </div>
                    </TableCell>
                    <TableCell className="px-2 align-top overflow-hidden">
                      {(() => {
                        const company = hasMeaningfulDisplayValue(qt.customerCompany) ? qt.customerCompany : '';
                        const contact = hasMeaningfulDisplayValue(qt.customerName) ? qt.customerName : '';
                        const email = hasMeaningfulDisplayValue(qt.customerEmail) ? qt.customerEmail : '';
                        const rows = [company, contact, email].filter(Boolean);

                        return rows.length > 0 ? (
                          <div className="flex flex-col">
                            <div className="min-h-[20px]">
                              {company ? <div className={`truncate whitespace-nowrap ${ERP_LIST_UI_SPEC_V1.primaryTextClass} font-medium text-slate-800 leading-5`} title={company}>{company}</div> : null}
                            </div>
                            <div className="min-h-[16px]">
                              {contact ? <div className={`break-words ${ERP_LIST_UI_SPEC_V1.secondaryTextClass} text-slate-600 whitespace-normal leading-4`} title={contact}>{contact}</div> : null}
                            </div>
                            <div className="min-h-[16px]">
                              {email ? <div className={`break-all ${ERP_LIST_UI_SPEC_V1.secondaryTextClass} text-slate-400 whitespace-normal leading-4`} title={email}>{email}</div> : null}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        );
                      })()}
                    </TableCell>
                    <TableCell className="px-2 align-top overflow-hidden">
                      {(() => {
                        const items = Array.isArray(qt.items) ? qt.items : [];
                        const first = items[0];
                        const productName = hasMeaningfulDisplayValue(first?.productName) ? first?.productName : '';
                        return (
                          <div className="flex flex-col">
                            <div className="min-h-[20px]">
                              {productName ? (
                                <div className={`truncate whitespace-nowrap ${ERP_LIST_UI_SPEC_V1.primaryTextClass} text-slate-800 leading-5`} title={productName}>
                                  <span className="font-medium">{productName}</span>
                                </div>
                              ) : null}
                            </div>
                            <div className="min-h-[16px]">
                              <div className={`break-words ${ERP_LIST_UI_SPEC_V1.secondaryTextClass} text-slate-500 whitespace-normal leading-4`} title={`共 ${Math.max(items.length, 1)} 个产品`}>
                                共 {Math.max(items.length, 1)} 个产品
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </TableCell>
                    <TableCell className="px-2 text-right align-top overflow-hidden tabular-nums">
                      <div className="flex flex-col items-end">
                        <div className="min-h-[20px] flex w-full items-start justify-end">
                          <div className={`${ERP_LIST_UI_SPEC_V1.primaryTextClass} font-medium text-slate-900 leading-5`}>{qtyDisplay}</div>
                        </div>
                        <div className="min-h-[16px]" />
                      </div>
                    </TableCell>
                    <TableCell className="px-2 text-right align-top overflow-hidden tabular-nums">
                      <div className="flex flex-col items-end">
                        <div className="min-h-[20px] flex w-full items-start justify-end">
                          <div className={`${ERP_LIST_UI_SPEC_V1.primaryTextClass} font-medium text-slate-900 leading-5`}>{unitPriceDisplay}</div>
                        </div>
                        <div className="min-h-[16px]" />
                      </div>
                    </TableCell>
                    <TableCell className="px-2 text-right align-top overflow-hidden tabular-nums">
                      <div className="flex flex-col">
                        <div className="min-h-[20px]">
                          <div className={`truncate whitespace-nowrap ${ERP_LIST_UI_SPEC_V1.primaryTextClass} font-bold text-slate-900 leading-5`}>
                          ${financialMetrics.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                        </div>
                        <div className="min-h-[16px]">
                          <div className={`break-words ${ERP_LIST_UI_SPEC_V1.secondaryTextClass} text-slate-500 whitespace-normal leading-4`}>
                            成本: ${financialMetrics.totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                        </div>
                        <div className="min-h-[16px]">
                          <div className={`break-words ${ERP_LIST_UI_SPEC_V1.secondaryTextClass} text-emerald-600 font-medium whitespace-normal leading-4`}>
                            利润: ${financialMetrics.totalProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                        </div>
                        <div className="min-h-[16px]">
                          <div className={`break-words ${ERP_LIST_UI_SPEC_V1.secondaryTextClass} whitespace-normal leading-4`}>
                            <span className="text-slate-500">利润率: </span>
                            <span
                              className="font-medium"
                              style={{
                                color:
                                  (financialMetrics.profitRate / 100) >= 0.2
                                    ? '#10b981'
                                    : (financialMetrics.profitRate / 100) >= 0.15
                                      ? '#f59e0b'
                                      : '#ef4444',
                              }}
                            >
                              {financialMetrics.profitRate.toFixed(1)}%
                            </span>
                            <span className="text-slate-500">
                              {' '}(
                              {(financialMetrics.profitRate / 100) >= 0.2
                                ? '优秀'
                                : (financialMetrics.profitRate / 100) >= 0.15
                                  ? '良好'
                                  : '偏低'}
                              )
                            </span>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-2 text-center align-top overflow-hidden">
                      <div className="flex flex-col items-center">
                        <div className="min-h-[20px] flex w-full justify-center">
                          {qt.approvalStatus === 'rejected' ? (
                            <button
                              type="button"
                              onClick={() => openRejectionCommentDialog(qt, latestRejectionComment)}
                              className="rounded-full focus:outline-none focus:ring-2 focus:ring-rose-200"
                              title={latestRejectionComment ? '点击查看主管驳回意见' : '点击查看驳回说明'}
                            >
                              {getStatusBadge(qt.approvalStatus)}
                            </button>
                          ) : (
                            getStatusBadge(qt.approvalStatus)
                          )}
                        </div>
                        <div className="min-h-[16px] max-w-full">
                          {qt.approvalStatus === 'rejected' && latestRejectionComment ? (
                            <button
                              type="button"
                              onClick={() => openRejectionCommentDialog(qt, latestRejectionComment)}
                              className={`${ERP_LIST_UI_SPEC_V1.secondaryTextClass} inline-flex items-center text-rose-600 hover:text-rose-700 hover:underline`}
                              title="点击查看主管驳回意见"
                            >
                              查看意见
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-2 text-center align-top overflow-hidden">
                      <div className="flex w-full flex-col items-center">
                        <div className="min-h-[20px]">
                          {getCustomerStatusBadge(qt)}
                        </div>
                        {(qt.customerStatus === 'rejected' || qt.customerStatus === 'negotiating') && qt.customerResponse?.comment && (
                          <div className={`min-h-[16px] max-w-full break-words ${ERP_LIST_UI_SPEC_V1.secondaryTextClass} whitespace-normal leading-4 ${qt.customerStatus === 'rejected' ? 'text-red-500' : 'text-orange-500'}`}
                            title={qt.customerResponse.comment}>
                            💭 {qt.customerResponse.comment}
                          </div>
                        )}
                        {!(qt.customerStatus === 'rejected' || qt.customerStatus === 'negotiating') && <div className="min-h-[16px]" />}
                        <div className="min-h-[16px] max-w-full">
                          {hasGeneratedContract && contractBridgeLabel ? (
                            <button
                              type="button"
                              onClick={() => handleOpenContractFlow(qt)}
                              className={`${ERP_LIST_UI_SPEC_V1.secondaryTextClass} inline-flex items-center text-indigo-600 hover:text-indigo-700 hover:underline`}
                              title={existingContractNumber ? `打开销售合同 ${existingContractNumber}` : '打开关联销售合同'}
                            >
                              合同：{contractBridgeLabel}
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-2 align-top overflow-hidden">
                      <div className="flex w-full flex-wrap items-start gap-1">
                        <Button 
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewQuotation(qt)}
                          className={`h-7 justify-center gap-1 rounded-full border-slate-200 bg-white px-1.5 ${ERP_LIST_UI_SPEC_V1.secondaryTextClass} leading-4 text-slate-700 hover:bg-slate-50`}
                        >
                          查看
                        </Button>
                        
                        {(qt.approvalStatus === 'draft' || qt.approvalStatus === 'pending_supervisor' || qt.approvalStatus === 'pending_director' || qt.approvalStatus === 'pending_approval') && (
                          <Button 
                            size="sm"
                            onClick={() => handleCalculatePrice(qt)}
                            className={`h-7 justify-center gap-1 rounded-full bg-orange-500 px-1.5 ${ERP_LIST_UI_SPEC_V1.secondaryTextClass} leading-4 shadow-none hover:bg-orange-600`}
                          >
                            核价
                          </Button>
                        )}
                        
                        {/* 🔥 提交给主管审核按钮 - 草稿状态可提交 */}
                        {qt.approvalStatus === 'draft' && (
                          <Button 
                            size="sm"
                            onClick={() => handleSubmitForApproval(qt)}
                            className={`h-7 justify-center gap-1 rounded-full bg-blue-500 px-1.5 ${ERP_LIST_UI_SPEC_V1.secondaryTextClass} leading-4 shadow-none hover:bg-blue-600`}
                            title={qt.totalAmount >= 20000 ? '金额≥$20,000，需主管+总监双重审批' : '金额<$20,000，只需主管审批'}
                          >
                            提审
                          </Button>
                        )}

                        {/* 🔥 已提交按钮 - 进入待审批后显示灰色禁用态 */}
                        {(qt.approvalStatus === 'pending_supervisor' || qt.approvalStatus === 'pending_director' || qt.approvalStatus === 'pending_approval') && (
                          <Button
                            type="button"
                            size="sm"
                            disabled
                            className={`h-7 justify-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-1.5 ${ERP_LIST_UI_SPEC_V1.secondaryTextClass} leading-4 text-slate-400 cursor-not-allowed hover:bg-slate-50`}
                            title="已提交审批，请等待审批结果"
                          >
                            已提交
                          </Button>
                        )}
                        
                        {/* 🔥 撤回按钮 - 待审批中（主管/总监）可撤回回草稿，重新编辑/提交 */}
                        {(qt.approvalStatus === 'pending_supervisor' || qt.approvalStatus === 'pending_director' || qt.approvalStatus === 'pending_approval') && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleWithdraw(qt)}
                            className={`h-7 justify-center gap-1 rounded-full border-amber-300 px-1.5 ${ERP_LIST_UI_SPEC_V1.secondaryTextClass} leading-4 text-amber-700 hover:bg-amber-50`}
                            title="撤回审批，回到草稿状态，可重新编辑并提交"
                          >
                            撤回
                          </Button>
                        )}

                        {/* 🔥 申请复核按钮 - 客户拒绝且审批未重新通过，或上级驳回时显示 */}
                        {((qt.customerStatus === 'rejected' && qt.approvalStatus !== 'approved') || qt.approvalStatus === 'rejected') && (
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => handleSubmitForReview(qt)}
                            className={`h-7 justify-center gap-1 rounded-full bg-indigo-500 px-1.5 ${ERP_LIST_UI_SPEC_V1.secondaryTextClass} leading-4 shadow-none hover:bg-indigo-600`}
                            title={`${(qt.totalAmount ?? qt.totalPrice ?? 0) >= 20000 ? '金额≥$20,000，需主管+总监双重复核' : '金额<$20,000，只需主管复核'}${qt.customerResponse?.comment ? `\n客户拒绝理由：${qt.customerResponse.comment}` : ''}`}
                          >
                            复核
                          </Button>
                        )}
                        
                        {qt.approvalStatus === 'approved' && ['sent', 'viewed'].includes(String(qt.customerStatus || '')) && (
                          <Button
                            type="button"
                            size="sm"
                            disabled
                            className={`h-7 justify-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-1.5 ${ERP_LIST_UI_SPEC_V1.secondaryTextClass} leading-4 text-slate-400 cursor-not-allowed hover:bg-slate-50`}
                            title={qt.customerStatus === 'viewed' ? '报价单已下推给客户，客户已查看' : '报价单已下推给客户'}
                          >
                            {qt.customerStatus === 'viewed' ? '已查看' : '已发送'}
                          </Button>
                        )}

                        {qt.approvalStatus === 'approved' && !['accepted', 'sent', 'viewed'].includes(String(qt.customerStatus || '')) && (() => {
                          const sendingKey = getQuotationIdentityKey(qt);
                          const isSending = sendingKey ? sendingQuotationIds.includes(sendingKey) : false;
                          return (
                            <Button
                              type="button"
                              size="sm"
                              disabled={isSending}
                              onClick={() => handleSendToCustomer(qt)}
                              className={`h-7 justify-center gap-1 rounded-full bg-emerald-500 px-1.5 ${ERP_LIST_UI_SPEC_V1.secondaryTextClass} leading-4 shadow-none hover:bg-emerald-600 disabled:bg-emerald-400 disabled:text-white disabled:opacity-100`}
                              title={isSending
                                ? '正在发送报价单给客户'
                                : (qt.customerStatus === 'rejected' ? '客户已拒绝，复核通过后可重新发送' : '发送报价单给客户')}
                            >
                              {isSending ? '发送中' : '发送'}
                            </Button>
                          );
                        })()}
                        
                        {/* 客户确认后，必须由业务员手动下推销售合同 */}
                        {hasAcceptedCustomerResponse && !hasGeneratedContract && (
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => handlePushToContract(qt)}
                            disabled={contractPushBlocked}
                            className={`h-7 justify-center gap-1 rounded-full bg-emerald-500 px-1.5 ${ERP_LIST_UI_SPEC_V1.secondaryTextClass} leading-4 text-white shadow-none hover:bg-emerald-600 disabled:bg-emerald-300 disabled:text-white disabled:opacity-100`}
                            title={qt.projectRevisionId
                              ? '项目类报价需先 Lock Final，确认最终 revision 和最终报价后才能生成销售合同'
                              : '下推生成销售合同'}
                          >
                            下推合同
                          </Button>
                        )}

                        {/* 已下推合同后，给出明确的后续流转入口 */}
                        {hasGeneratedContract && (
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => handleOpenContractFlow(qt)}
                            className={`h-7 justify-center gap-1 rounded-full bg-indigo-500 px-1.5 ${ERP_LIST_UI_SPEC_V1.secondaryTextClass} leading-4 shadow-none hover:bg-indigo-600`}
                            title={existingContractNumber ? `打开销售合同 ${existingContractNumber}` : '打开已生成的销售合同并继续流转'}
                          >
                            去合同
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                  ); // 🔥 闭合 return 语句
                }) // 🔥 闭合 map 函数
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      
      {/* 🔥 新增：查看客户询价单弹窗 - 已禁用（文件不存在） */}
      {/* {showInquiryView && selectedInquiry && (
        <CustomerInquiryView
          inquiry={selectedInquiry}
          onClose={() => {
            setShowInquiryView(false);
            setSelectedInquiry(null);
          }}
        />
      )} */}
      
      {/* 🔥 新增：查看报价单弹窗（文档模版） */}
      {showQuotationView && selectedQuotation && (
        <QuotationView
          quotation={selectedQuotation}
          viewerUser={{
            name: dashboardCurrentUser?.name || currentUser?.name || '',
            email: dashboardCurrentUser?.email || currentUser?.email || '',
            phone: '',
          }}
          onClose={() => {
            setShowQuotationView(false);
            setSelectedQuotation(null);
          }}
        />
      )}
      
      {/* 🔥 新增：核算价格弹窗（智能报价创建） */}
      {showPriceCalculation && selectedQuotation && (
        <QuoteCreationIntelligent
          requirementNo={selectedQuotation.qrNumber}
          requirement={selectedQuotation}
          saving={isSavingPriceCalculation}
          onClose={() => {
            if (isSavingPriceCalculation) return;
            setShowPriceCalculation(false);
            setSelectedQuotation(null);
          }}
          onSubmit={(quoteData) => {
            const activeQuotation = selectedQuotation;
            if (!activeQuotation || isSavingPriceCalculation) return;
            setIsSavingPriceCalculation(true);
            setShowPriceCalculation(false);
            setSelectedQuotation(null);
            window.setTimeout(() => {
              void (async () => {
                try {
                  const fallback = mapQuoteDataToQuotationUpdate(quoteData, activeQuotation);
                  const customerFields = resolveQuotationCustomerFields(activeQuotation);
                  const optimisticQuotation = {
                    ...activeQuotation,
                    ...fallback,
                    approvalStatus: 'draft',
                    qtNumber: activeQuotation.qtNumber,
                    qrNumber: activeQuotation.qrNumber,
                    inqNumber: activeQuotation.inqNumber || customerFields.inqNumber,
                    region: activeQuotation.region || customerFields.region,
                    customerEmail: activeQuotation.customerEmail || customerFields.customerEmail,
                    customerName: activeQuotation.customerName || customerFields.customerName,
                    customerCompany: activeQuotation.customerCompany || customerFields.customerCompany,
                    salesPerson: activeQuotation.salesPerson || currentUser?.email || '',
                    salesPersonName: activeQuotation.salesPersonName || currentUser?.name || '',
                    updatedAt: new Date().toISOString(),
                  };
                  setServerQuotations((prev) => {
                    const mergedRows = mergeQuotationRows([...prev, optimisticQuotation]);
                    writeSalesQuotationCache(currentUser?.email, currentUser?.region, mergedRows);
                    return mergedRows;
                  });
                  await updateQuotation(String(activeQuotation.id), {
                    ...optimisticQuotation,
                  } as any);
                  emitErpEvent({
                    id: `evt-qt-draft-saved-${Date.now()}`,
                    key: ERP_EVENT_KEYS.QUOTATION_CREATED,
                    domain: 'qt',
                    recordId: String(activeQuotation.id || activeQuotation.qtNumber),
                    internalNo: String(activeQuotation.qtNumber || ''),
                    source: 'admin',
                    occurredAt: new Date().toISOString(),
                    metadata: {
                      approvalStatus: 'draft',
                      qtNumber: activeQuotation.qtNumber,
                      qrNumber: activeQuotation.qrNumber,
                      quotation: optimisticQuotation,
                    },
                  });
                  toast.success('报价草稿已保存');
                  void loadSalesQuotations();
                } catch (e: any) {
                  console.error('❌ 保存报价草稿失败:', e);
                  toast.error(`保存报价草稿失败：${e?.message || 'Supabase 写入失败'}`);
                } finally {
                  setIsSavingPriceCalculation(false);
                }
              })();
            }, 0);
          }}
        />
      )}

      <Dialog open={Boolean(rejectionCommentDialog)} onOpenChange={(open) => !open && setRejectionCommentDialog(null)}>
        <DialogContent className="w-[min(32rem,calc(100vw-2rem))] max-w-[32rem]">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-slate-900">
              主管驳回意见
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500">
              {rejectionCommentDialog?.qtNumber || ''} · {rejectionCommentDialog?.customerCompany || ''}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3">
              <div className="mb-2 text-sm font-medium text-rose-700">驳回原因</div>
              <div className="whitespace-pre-wrap text-sm leading-6 text-slate-800">
                {rejectionCommentDialog?.comment || '本次驳回未填写具体意见，请联系主管确认修改方向。'}
              </div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="mb-2 text-sm font-medium text-slate-700">建议动作</div>
              <div className="text-sm leading-6 text-slate-600">
                根据主管意见修改报价后，再点击列表右侧的“复核”重新提交。
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
