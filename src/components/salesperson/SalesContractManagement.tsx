/**
 * 🔥 订单管理 - 业务员销售订单管理
 * 
 * 功能：
 * - 在制订单：查看从报价单生成的销售合同（SC）
 * - 提交合同审批（主管 → 总监）
 * - 发送合同给客户
 * - 查看客户签署状态
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { WorkflowPipelineBanner, MAIN_WORKFLOW_STEPS } from '../shared/WorkflowPipelineBanner';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Checkbox } from '../ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { 
  Search, 
  Eye, 
  Send, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  Trash2,
  Edit,
  Package,
  Truck,
  FileCheck,
  DollarSign,
  ShoppingCart,
  FileText, // 🔥 新增：文档图标
  Zap
} from 'lucide-react';
import { SalesContractContext, useSalesContracts } from '../../contexts/SalesContractContext';
import { useOrders } from '../../contexts/OrderContext';
import { useApproval } from '../../contexts/ApprovalContext'; // 🔥 添加审批Context
import { usePurchaseOrders } from '../../contexts/PurchaseOrderContext'; // 🔥 新增：采购订单Context
import { useQuoteRequirements } from '../../contexts/QuoteRequirementContext';
import { useSalesQuotations } from '../../contexts/SalesQuotationContext'; // Phase 6a: estimated profit from QT
import { sortDocumentFlowRefs } from '../../utils/documentFlowRefOrder';
import { computeSCProfit, ACTUAL_UNAVAILABLE_LABEL, ACTUAL_UNAVAILABLE_TOOLTIP, ACTUAL_UNAVAILABLE_ICON } from '../../utils/scProfitUtils'; // Phase 6a/6c: SC profit utility
import { getCurrentUser } from '../../utils/dataIsolation';
import { nextPRNumber } from '../../utils/xjNumberGenerator';
import { toast } from 'sonner@2.0.3';
import { SalesContractDocument, SalesContractData } from '../documents/templates/SalesContractDocument'; // 🔥 新增：销售合同文档模板
import type { DocumentLayoutConfig } from '../documents/A4PageContainer';
import {
  buildPurchaseOrderDocumentSnapshot,
  buildQuoteRequirementDocumentSnapshot,
} from '../admin/purchase-order/purchaseOrderUtils';
import { getFormalBusinessModelNo } from '../../utils/productModelDisplay';
import { matchesBusinessOwnerEmail } from '../../utils/quotationOwnership';
import { sharedRoleUiPreferenceService } from '../../lib/supabaseService';
import { adminOrganizationService } from '../../lib/supabaseService';
import { deriveScApprovalGovernance } from '../../lib/services/salesApprovalGovernanceService';
import { getColumnStyle, renderColumnResizeHandle } from '../admin/admin-organization-profile/peopleCenterVisuals';
import { ERP_LIST_UI_SPEC_V1 } from '../shared/erpListUiSpec';
import { resolveUsdSellerBankInfo } from '../../utils/documentBankInfo';
import { normalizeFlowProductCore, resolveSalesContractBuyerData } from '../../utils/documentDataAdapters';
import { BALANCE_TRIGGER_OPTIONS, getPaymentModeLabel } from '../../lib/paymentFlow';
import { deriveSalesContractSplitFields } from '../../lib/customerPortalContractStatus';
import { derivePurchaseOrderWorkflowFields } from '../../lib/services/purchaseOrderQuoteRequirementServices';
import { exportToPDF, exportToPDFPrint, generatePDFFilename } from '../../utils/pdfExport';
import { StandardDocumentViewerShell } from '../documents/StandardDocumentViewerShell';
import { CompactDetailsPopover, type CompactDetailItem } from '../shared/CompactDetailsPopover';

interface SalesContractManagementProps {
  highlightScNumber?: string; // 🔥 高亮显示的销售合同号
  onNavigateToInquiryWithHighlight?: (inquiryNumber: string) => void;
  onNavigateToCostInquiryWithHighlight?: (qrNumber: string) => void;
  onNavigateToQuotationWithHighlight?: (qtNumber: string) => void;
  /** 下推采购成功后跳转到采购模块的回调 */
  onNavigateToProcurement?: () => void;
}

type SalesContractColumnKey =
  | 'select'
  | 'index'
  | 'date'
  | 'contractNo'
  | 'country'
  | 'customer'
  | 'product'
  | 'unitPrice'
  | 'amount'
  | 'approvalStatus'
  | 'procurementProgress'
  | 'customerStatus'
  | 'actions';

const SALES_CONTRACT_TABLE_UI_PREFERENCE_PREFIX = 'sales_contract_table_column_widths';
const SALES_CONTRACT_COLUMN_ORDER: SalesContractColumnKey[] = [
  'select',
  'index',
  'date',
  'contractNo',
  'country',
  'customer',
  'product',
  'unitPrice',
  'amount',
  'approvalStatus',
  'procurementProgress',
  'customerStatus',
  'actions',
];

const SALES_CONTRACT_COLUMN_MIN_WIDTHS: Record<SalesContractColumnKey, number> = {
  select: 24,
  index: 24,
  date: 24,
  contractNo: 24,
  country: 24,
  customer: 24,
  product: 24,
  unitPrice: 24,
  amount: 24,
  approvalStatus: 24,
  procurementProgress: 24,
  customerStatus: 24,
  actions: 24,
};

const SALES_CONTRACT_TABLE_DEFAULT_WIDTHS: Record<SalesContractColumnKey, number> = {
  select: 44,
  index: 51,
  date: 120,
  contractNo: 276,
  country: 80,
  customer: 176,
  product: 196,
  unitPrice: 91,
  amount: 244,
  approvalStatus: 99,
  procurementProgress: 122,
  customerStatus: 104,
  actions: 148,
};

const normalizeSalesContractPreferenceRole = (role?: string | null) => {
  const normalized = String(role || '').trim();
  return normalized || 'Sales_Rep';
};

const getSalesContractPreferenceKey = (subTab: string) =>
  `${SALES_CONTRACT_TABLE_UI_PREFERENCE_PREFIX}:${subTab}:v8`;

const formatSalesContractDateOnly = (value: unknown) => {
  const normalized = String(value || '').trim();
  if (!normalized) return '-';
  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return normalized;
  const match = normalized.match(/^\d{4}-\d{2}-\d{2}/);
  if (match) return match[0];
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return normalized;
  return date.toISOString().slice(0, 10);
};

const REGION_LABEL_MAP: Record<string, string> = {
  NA: '北美',
  SA: '南美',
  EA: '欧非',
};

const normalizeSalesContractProfitPercent = (value: unknown, fallback = Number.NaN) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  if (parsed > 0 && parsed < 1) return parsed * 100;
  return parsed;
};

const deriveQuotationFinancialSummaryForContract = (
  quotationLike: Record<string, any> | null | undefined,
  contractLike?: Record<string, any> | null,
) => {
  const toPositiveNumber = (...values: any[]) => {
    for (const value of values) {
      const numeric = Number(value);
      if (Number.isFinite(numeric) && numeric > 0) return numeric;
    }
    return Number.NaN;
  };

  const pickProducts = (...sources: any[]) => {
    for (const source of sources) {
      if (Array.isArray(source) && source.length > 0) return source;
    }
    return [];
  };

  const contractFinancialSummary =
    contractLike?.documentDataSnapshot?.financialSummary ||
    contractLike?.documentDataSnapshot?.financials ||
    contractLike?.documentDataSnapshot?.quotationFinancialBridge ||
    contractLike?.documentRenderMeta?.financialSummary ||
    contractLike?.documentRenderMeta?.financials ||
    contractLike?.documentRenderMeta?.quotationFinancialBridge ||
    contractLike?.document_render_meta?.quotationFinancialBridge ||
    contractLike?.document_data_snapshot?.financialSummary ||
    contractLike?.document_data_snapshot?.financials ||
    contractLike?.document_data_snapshot?.quotationFinancialBridge ||
    null;
  const quotationSnapshot =
    quotationLike?.documentDataSnapshot?.financialSummary ||
    quotationLike?.documentDataSnapshot?.financials ||
    quotationLike?.documentRenderMeta?.financialSummary ||
    quotationLike?.documentRenderMeta?.financials ||
    null;
  const items = pickProducts(
    quotationLike?.items,
    quotationLike?.products,
    quotationLike?.documentDataSnapshot?.products,
    quotationLike?.document_data_snapshot?.products,
    quotationLike?.templateSnapshot?.products,
    contractLike?.products,
    contractLike?.documentDataSnapshot?.products,
    contractLike?.document_data_snapshot?.products,
    contractLike?.templateSnapshot?.products,
    contractLike?.documentRenderMeta?.products,
  );
  const itemsTotalAmount = items.reduce((sum: number, item: any) => {
    const quantity = Number(item?.quantity ?? item?.qty ?? item?.pcs ?? item?.count ?? 0);
    const unitPrice = Number(
      item?.salesPrice ??
      item?.unitPrice ??
      item?.price ??
      item?.quotePrice ??
      item?.sales_price ??
      item?.unit_price ??
      item?.sales_price ??
      item?.quote_price ??
      0,
    );
    const lineAmount = Number(
      item?.totalPrice ??
      item?.totalAmount ??
      item?.amount ??
      item?.lineAmount ??
      item?.line_amount ??
      item?.total_price ??
      item?.total_amount,
    );
    if (Number.isFinite(lineAmount)) return sum + lineAmount;
    return sum + ((Number.isFinite(quantity) ? quantity : 0) * (Number.isFinite(unitPrice) ? unitPrice : 0));
  }, 0);
  const itemsTotalCost = items.reduce((sum: number, item: any) => {
    const quantity = Number(item?.quantity ?? item?.qty ?? item?.pcs ?? item?.count ?? 0);
    const costPrice = Number(
      item?.costPrice ??
      item?.costUSD ??
      item?.unitCost ??
      item?.cost ??
      item?.purchasePrice ??
      item?.supplierCost ??
      item?.supplierPrice ??
      item?.factoryPrice ??
      item?.targetCost ??
      item?.estimatedCost ??
      item?.cost_price ??
      item?.cost_usd ??
      item?.unit_cost ??
      item?.purchase_price ??
      item?.supplier_cost ??
      item?.supplier_price ??
      item?.factory_price ??
      item?.target_cost ??
      item?.estimated_cost ??
      0,
    );
    const lineCost = Number(
      item?.totalCost ??
      item?.costAmount ??
      item?.lineCost ??
      item?.estimatedTotalCost ??
      item?.totalEstimatedCost ??
      item?.total_cost ??
      item?.cost_amount ??
      item?.line_cost ??
      item?.estimated_total_cost ??
      item?.total_estimated_cost,
    );
    if (Number.isFinite(lineCost)) return sum + lineCost;
    return sum + ((Number.isFinite(quantity) ? quantity : 0) * (Number.isFinite(costPrice) ? costPrice : 0));
  }, 0);

  const totalAmount = toPositiveNumber(
    contractFinancialSummary?.totalAmount,
    contractFinancialSummary?.totalPrice,
    contractFinancialSummary?.total_amount,
    contractFinancialSummary?.total_price,
    quotationLike?.totalAmount,
    quotationLike?.totalPrice,
    quotationLike?.total_amount,
    quotationLike?.total_price,
    quotationSnapshot?.totalAmount,
    quotationSnapshot?.totalPrice,
    quotationSnapshot?.total_amount,
    quotationSnapshot?.total_price,
    contractLike?.totalAmount,
    contractLike?.totalPrice,
    contractLike?.total_amount,
    contractLike?.total_price,
    itemsTotalAmount,
  );
  const totalCost = toPositiveNumber(
    contractFinancialSummary?.totalCost,
    contractFinancialSummary?.total_cost,
    contractFinancialSummary?.estimatedCost,
    contractFinancialSummary?.estimated_cost,
    quotationLike?.totalCost,
    quotationLike?.total_cost,
    quotationLike?.estimatedCost,
    quotationLike?.estimated_cost,
    quotationSnapshot?.totalCost,
    quotationSnapshot?.total_cost,
    quotationSnapshot?.estimatedCost,
    quotationSnapshot?.estimated_cost,
    contractLike?.totalCost,
    contractLike?.total_cost,
    contractLike?.estimatedCost,
    contractLike?.estimated_cost,
    itemsTotalCost,
  );
  const rawTotalProfit =
    contractFinancialSummary?.totalProfit ??
    contractFinancialSummary?.total_profit ??
    contractFinancialSummary?.estimatedProfit ??
    contractFinancialSummary?.estimated_profit ??
    quotationLike?.totalProfit ??
    quotationLike?.total_profit ??
    quotationLike?.estimatedProfit ??
    quotationLike?.estimated_profit ??
    quotationSnapshot?.totalProfit ??
    quotationSnapshot?.total_profit ??
    quotationSnapshot?.estimatedProfit ??
    quotationSnapshot?.estimated_profit ??
    contractLike?.totalProfit ??
    contractLike?.total_profit ??
    contractLike?.estimatedProfit ??
    contractLike?.estimated_profit;
  const totalProfit = Number.isFinite(Number(rawTotalProfit))
    ? Number(rawTotalProfit)
    : (totalAmount - totalCost);
  const storedProfitRate = normalizeSalesContractProfitPercent(
    contractFinancialSummary?.profitRate ??
    contractFinancialSummary?.profit_rate ??
    contractFinancialSummary?.profitMargin ??
    contractFinancialSummary?.profit_margin ??
    quotationLike?.profitRate ??
    quotationLike?.profit_rate ??
    quotationLike?.profitMargin ??
    quotationLike?.profit_margin ??
    quotationSnapshot?.profitRate ??
    quotationSnapshot?.profit_rate ??
    quotationSnapshot?.profitMargin ??
    quotationSnapshot?.profit_margin ??
    contractLike?.profitRate ??
    contractLike?.profit_rate ??
    contractLike?.profitMargin ??
    contractLike?.profit_margin,
    Number.NaN,
  );
  const profitRate = Number.isFinite(storedProfitRate)
    ? storedProfitRate
    : totalCost > 0
      ? (totalProfit / totalCost) * 100
      : Number.NaN;

  return {
    totalAmount,
    totalCost,
    totalProfit,
    profitRate,
  };
};

type ProcurementTrackingSummary = {
  requestNumbers: string[];
  requestStatusLabel: string | null;
  requestStatusTone: string;
  cgCount: number;
  pushedCgCount: number;
  cgNumbers: string[];
};

const PROCUREMENT_STATUS_COPY = {
  uncreated: '未创建PR',
  created: '已创建PR',
  pendingAssignment: '待采购分配',
  partiallyAllocated: '部分分配',
  fullyAllocated: '已分配完成',
  processing: '采购处理中',
  cgNotCreated: '未生成CG',
  cgCreated: '已生成CG',
  cgPushed: '已下推供应商',
} as const;

const getProcurementCurrentActionLabel = (tracking: ProcurementTrackingSummary) => {
  if (tracking.requestNumbers.length === 0) {
    return '业务侧尚未发起采购请求';
  }
  if (tracking.requestStatusLabel === PROCUREMENT_STATUS_COPY.pendingAssignment) {
    return '待采购员分配供应商';
  }
  if (tracking.requestStatusLabel === PROCUREMENT_STATUS_COPY.partiallyAllocated) {
    return '采购员已部分分配，待补齐剩余供应商';
  }
  if (tracking.cgCount === 0) {
    return '采购请求已分配完成，待生成CG';
  }
  if (tracking.pushedCgCount < tracking.cgCount) {
    return '已生成CG，待采购员下推供应商';
  }
  return '采购已下推供应商，等待后续执行';
};

const getProcurementCgProgressLabel = (tracking: ProcurementTrackingSummary) => {
  if (!tracking.requestStatusLabel) return '';
  if (tracking.cgCount === 0) return PROCUREMENT_STATUS_COPY.cgNotCreated;
  if (tracking.pushedCgCount === 0) {
    return `${PROCUREMENT_STATUS_COPY.cgCreated} ${tracking.cgCount}，待下推供应商`;
  }
  return `${PROCUREMENT_STATUS_COPY.cgCreated} ${tracking.cgCount}，${PROCUREMENT_STATUS_COPY.cgPushed} ${tracking.pushedCgCount}`;
};

const buildSalesContractRelatedRefs = (
  contract: any,
  quotation: any,
  procurementTracking: ProcurementTrackingSummary,
  quoteRequirements: any[] = [],
) => {
  const refs: Array<{ value: string; className: string }> = [];
  const seen = new Set<string>();
  const contractDataSnapshot = (contract?.documentDataSnapshot || {}) as Record<string, any>;
  const contractRenderMeta = (contract?.documentRenderMeta || {}) as Record<string, any>;
  const fallbackRequirement = (Array.isArray(quoteRequirements) ? quoteRequirements : []).find((requirement: any) => {
    const requirementNo = String(requirement?.requirementNo || requirement?.qrNumber || '').trim();
    if (!requirementNo) return false;
    const sourceInquiryNumber = String(requirement?.sourceInquiryNumber || requirement?.sourceInquiryId || '').trim();
    const finalQuotationNumber = String(requirement?.finalQuotationNumber || requirement?.quotationNumber || '').trim();
    return (
      sourceInquiryNumber &&
      sourceInquiryNumber === String(contract?.inquiryNumber || quotation?.inqNumber || quotation?.inq_number || quotation?.inquiryNumber || '').trim()
    ) || (
      finalQuotationNumber &&
      finalQuotationNumber === String(contract?.quotationNumber || quotation?.qtNumber || quotation?.quotationNumber || '').trim()
    );
  });
  const pushRef = (value: string, className: string) => {
    const normalized = String(value || '').trim();
    if (!normalized || seen.has(normalized)) return;
    seen.add(normalized);
    refs.push({ value: normalized, className });
  };

  pushRef(
    String(
      contract?.qrNumber
      || contractDataSnapshot?.qrNumber
      || contractDataSnapshot?.requirementNo
      || contractRenderMeta?.qrNumber
      || contractRenderMeta?.requirementNo
      || quotation?.qrNumber
      || quotation?.requirementNo
      || quotation?.documentDataSnapshot?.qrNumber
      || quotation?.documentDataSnapshot?.requirementNo
      || quotation?.documentRenderMeta?.qrNumber
      || quotation?.documentRenderMeta?.requirementNo
      || fallbackRequirement?.requirementNo
      || '',
    ).trim(),
    'text-emerald-600',
  );
  pushRef(String(contract.quotationNumber || '').trim(), 'text-violet-600');
  pushRef(String(contract.inquiryNumber || quotation?.inqNumber || quotation?.inq_number || quotation?.inquiryNumber || '').trim(), 'text-purple-500');
  procurementTracking.requestNumbers.forEach((value) => pushRef(value, 'text-cyan-600'));

  return sortDocumentFlowRefs(refs);
};

type SalesContractFilterStatus =
  | 'all'
  | 'draft'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'sent'
  | 'confirmed'
  | 'profit_unavailable'
  | 'profit_alert'
  | 'profit_deviation';

const mergeStoredSalesContractColumnWidths = (
  stored: Partial<Record<SalesContractColumnKey, number>> | null | undefined,
) => {
  const next = { ...SALES_CONTRACT_TABLE_DEFAULT_WIDTHS };
  SALES_CONTRACT_COLUMN_ORDER.forEach((key) => {
    const candidate = Number(stored?.[key]);
    if (Number.isFinite(candidate) && candidate > 0) {
      next[key] = Math.max(SALES_CONTRACT_COLUMN_MIN_WIDTHS[key], Math.round(candidate));
    }
  });
  return next;
};

export function SalesContractManagement({
  highlightScNumber,
  onNavigateToInquiryWithHighlight,
  onNavigateToCostInquiryWithHighlight,
  onNavigateToQuotationWithHighlight,
  onNavigateToProcurement,
}: SalesContractManagementProps = {}) {
  const { contracts, deleteContract, submitForApproval, sendToCustomer, updateContract, refreshFromBackend, confirmBalancePayment, advanceSCToShipped, advanceSCToCompleted, markPRInitiated } = useSalesContracts();
  const { orders } = useOrders(); // 🔥 获取订单数据
  const { addApprovalRequest } = useApproval(); // 🔥 审批功能
  const { purchaseOrders, addPurchaseOrder, updatePurchaseOrder } = usePurchaseOrders(); // 🔥 新增：采购订单功能
  const { addRequirement, requirements: quoteRequirements } = useQuoteRequirements();
  const { getQuotationByNumber } = useSalesQuotations(); // Phase 6a: QT look-up for estimated profit
  const currentUser = getCurrentUser();
  const [sendingContractIds, setSendingContractIds] = useState<string[]>([]);
  const [submittingApprovalIds, setSubmittingApprovalIds] = useState<string[]>([]);
  const [expandedRelatedIds, setExpandedRelatedIds] = useState<string[]>([]);
  const salesContractTableContainerRef = React.useRef<HTMLDivElement | null>(null);
  const salesContractColumnResizeRef = React.useRef<{
    key: SalesContractColumnKey;
    startX: number;
    startWidth: number;
  } | null>(null);
  const ensureBoundSalesContractSnapshot = (contract: any) => {
    const templateSnapshot = contract?.templateSnapshot || contract?.template_snapshot || null;
    const templateVersion = templateSnapshot?.version || null;
    const documentData = contract?.documentDataSnapshot || contract?.document_data_snapshot || null;
    if (!templateVersion || !documentData) {
      toast.error('该 SC 未绑定模板中心版本快照，无法下推采购');
      return false;
    }
    return true;
  };
  const persistPurchaseRequest = async (contract: any, newPO: any, poNumber: string) => {
    try {
      const payload = {
        id: `qr-from-sc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        requirementNo: poNumber,
        source: 'sales-contract',
        sourceRef: contract.contractNumber,
        sourceInquiryNumber: contract.inquiryNumber || contract.quotationNumber || contract.contractNumber,
        projectId: contract.projectId || null,
        projectCode: contract.projectCode || null,
        projectName: contract.projectName || null,
        projectRevisionId: contract.projectRevisionId || null,
        projectRevisionCode: contract.projectRevisionCode || null,
        projectRevisionStatus: contract.projectRevisionStatus || null,
        finalRevisionId: contract.finalRevisionId || null,
        finalQuotationId: contract.finalQuotationId || null,
        finalQuotationNumber: contract.finalQuotationNumber || contract.quotationNumber || null,
        requiredDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        urgency: 'high',
        createdBy: currentUser?.email || 'system',
        requestedBy: contract.salesPerson || null,
        requestedByName: contract.salesPersonName || null,
        ownerEmail: contract.salesPerson || null,
        ownerName: contract.salesPersonName || null,
        ownerRole: 'Sales_Rep',
        createdDate: new Date().toISOString(),
        specialRequirements: contract.projectRevisionId
          ? `由业务员下推采购，采购单号: ${poNumber}\nExecution Baseline: ${contract.projectCode ? `${contract.projectCode} · ` : ''}${contract.projectName || 'Project'} / Rev ${contract.projectRevisionCode || '-'} / Final QT ${contract.finalQuotationNumber || contract.quotationNumber || '-'}`
          : `由业务员下推采购，采购单号: ${poNumber}`,
        customer: {
          companyName: contract.customerCompany || contract.customerName || 'Unknown Customer',
          contactPerson: contract.contactPerson || contract.customerName || '',
          email: contract.customerEmail || 'unknown@example.com',
          phone: contract.contactPhone || '',
          address: contract.customerAddress || ''
        },
        items: (newPO?.items || []).map((item: any) => ({
          id: item.id || `item-${Math.random().toString(36).slice(2, 8)}`,
          productName: normalizeFlowProductCore(item).productName,
          productNameEn: normalizeFlowProductCore(item).productNameEn,
          productNameZh: normalizeFlowProductCore(item).productNameZh,
          modelNo: normalizeFlowProductCore(item).modelNo,
          imageUrl: normalizeFlowProductCore(item).imageUrl,
          specification: normalizeFlowProductCore(item).specification,
          specificationEn: normalizeFlowProductCore(item).specificationEn,
          specificationZh: normalizeFlowProductCore(item).specificationZh,
          quantity: Number(item.quantity || 0) || 1,
          unit: normalizeFlowProductCore(item).unit || 'PCS',
          targetPrice: Number(item.unitPrice || 0) || 0,
          targetCurrency: item.currency || contract.currency || 'USD',
          hsCode: item.hsCode || '',
          remarks: item.remarks || '',
          customerProductId: item.customerProductId || undefined,
          projectId: item.projectId || contract.projectId || null,
          projectRevisionId: item.projectRevisionId || contract.projectRevisionId || null,
          projectRevisionCode: item.projectRevisionCode || contract.projectRevisionCode || null,
        }))
      } as any;
      payload.documentRenderMeta = contract.projectRevisionId
        ? {
            projectExecutionBaseline: {
              projectId: contract.projectId || null,
              projectCode: contract.projectCode || null,
              projectName: contract.projectName || null,
              projectRevisionId: contract.projectRevisionId || null,
              projectRevisionCode: contract.projectRevisionCode || null,
              projectRevisionStatus: contract.projectRevisionStatus || null,
              finalRevisionId: contract.finalRevisionId || null,
              finalQuotationId: contract.finalQuotationId || null,
              finalQuotationNumber: contract.finalQuotationNumber || contract.quotationNumber || null,
            },
          }
        : null;
      await addRequirement({
        ...payload,
        documentDataSnapshot: buildQuoteRequirementDocumentSnapshot(payload as any),
      });
      toast.success('采购请求已落库', {
        description: `已生成采购需求 ${poNumber}（来源 ${contract.contractNumber}）`,
        duration: 4500
      });
      await refreshFromBackend();
    } catch (e: any) {
      toast.error('采购请求落库失败', {
        description: e?.message || 'Supabase 写入失败',
        duration: 5000
      });
      throw e;
    }
  };

  // 🔥 接口化：进入“订单管理”Tab时立刻请求后端（Network 面板能直接看到 /api/sales-contracts）
  React.useEffect(() => {
    void refreshFromBackend().catch((e: any) => {
      console.warn('⚠️ [SalesContractManagement] refreshFromBackend failed:', e?.message || e);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // 🔥 调试：监听contracts变化
  React.useEffect(() => {
    console.log('🔍 [SalesContractManagement] contracts变化:');
    console.log('  - 合同总数:', contracts.length);
    console.log('  - 所有合同编号:', contracts.map(c => c.contractNumber));
    console.log('  - 当前用户:', currentUser);
  }, [contracts]);
  
  // 🔥 高亮状态（3秒后自动消失）
  const [highlightedId, setHighlightedId] = React.useState<string | null>(null);
  
  React.useEffect(() => {
    if (highlightScNumber) {
      console.log('🔍 [SalesContractManagement] 收到高亮请求:', highlightScNumber);
      const contract = contracts.find(c => c.contractNumber === highlightScNumber);
      if (contract) {
        console.log('  ✅ 找到合同:', contract.contractNumber);
        setHighlightedId(contract.id);
        // 3秒后清除高亮
        const timer = setTimeout(() => setHighlightedId(null), 3000);
        return () => clearTimeout(timer);
      } else {
        console.log('  ⚠️ 未找到合同:', highlightScNumber);
        console.log('  - 可用合同:', contracts.map(c => c.contractNumber));
      }
    }
  }, [highlightScNumber, contracts]);
  
  // 🔥 订单管理当前仅保留销售订单主线
  const activeSubTab = 'sales-orders';
  const salesContractPreferenceRoleScope = useMemo(
    () => normalizeSalesContractPreferenceRole((currentUser as any)?.role || (currentUser as any)?.userRole),
    [currentUser],
  );
  
  // 🔥 状态管理
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<SalesContractFilterStatus>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // 🔥 新增：文档预览状态
  const [showDocumentPreview, setShowDocumentPreview] = useState(false);
  const [selectedContract, setSelectedContract] = useState<any>(null);
  const contractPreviewRef = useRef<HTMLDivElement | null>(null);

  // Phase 6b: inline edit state for SC-level additional cost
  const [editingAdditionalCostId, setEditingAdditionalCostId] = useState<string | null>(null);
  const [additionalCostDraft, setAdditionalCostDraft] = useState('');
  const handleSaveAdditionalCost = async (contractId: string) => {
    const parsed = parseFloat(additionalCostDraft);
    if (isNaN(parsed) || parsed < 0) return;
    await updateContract(contractId, { additionalCost: parsed });
    setEditingAdditionalCostId(null);
  };
  // Phase 8: FX rate inline editing — one row per foreign-currency CG currency.
  // editingFxKey is "${contractId}::${CURRENCY}" so each currency on each contract
  // has its own independent edit state without extra state arrays.
  const [editingFxKey, setEditingFxKey] = useState<string | null>(null);
  const [documentAdminOrg, setDocumentAdminOrg] = useState<any>(null);
  const [fxRateDraft, setFxRateDraft] = useState('');
  const [salesContractColumnWidths, setSalesContractColumnWidths] = useState<Record<SalesContractColumnKey, number>>(SALES_CONTRACT_TABLE_DEFAULT_WIDTHS);
  const [salesContractHasCustomWidths, setSalesContractHasCustomWidths] = useState(false);
  const [salesContractPreferenceHydrated, setSalesContractPreferenceHydrated] = useState(false);
  const handleSaveFxRate = async (contractId: string, currency: string) => {
    const parsed = parseFloat(fxRateDraft);
    if (isNaN(parsed) || parsed <= 0) return;
    const contract = contracts.find(c => c.id === contractId);
    if (!contract) return;
    const updatedRates = { ...(contract.fxRates ?? {}), [currency]: parsed };
    await updateContract(contractId, { fxRates: updatedRates });
    setEditingFxKey(null);
  };

  const resolveContractWorkflowStatus = React.useCallback((contract: any): string => {
    const splitFields = deriveSalesContractSplitFields(contract);
    const executionStatus = String(splitFields.executionStatus || contract?.executionStatus || '').trim().toLowerCase();
    const order = orders.find((item: any) =>
      String(item?.orderNumber || '').trim() === String(contract?.contractNumber || '').trim() ||
      String(item?.contractNumber || '').trim() === String(contract?.contractNumber || '').trim()
    );
    const orderStatus = String(order?.status || '').trim().toLowerCase();
    const feedbackStatus = String(order?.customerFeedback?.status || order?.customerFeedback?.type || '').trim().toLowerCase();

    if (
      order?.confirmed ||
      order?.confirmedAt ||
      feedbackStatus === 'accepted' ||
      feedbackStatus === 'accept' ||
      orderStatus === 'awaiting deposit' ||
      orderStatus === 'customer_confirmed'
    ) {
      return 'customer_confirmed';
    }

    switch (executionStatus) {
      case 'sent_to_customer':
        return 'sent';
      case 'customer_confirmed':
      case 'customer_rejected':
      case 'customer_requested_changes':
      case 'deposit_uploaded':
      case 'deposit_confirmed':
      case 'balance_confirmed':
      case 'shipped':
      case 'completed':
        return executionStatus;
      case 'in_procurement':
        return 'po_generated';
      case 'in_pre_production':
      case 'in_production':
        return 'production';
      default:
        return String(contract?.status || 'draft').trim().toLowerCase();
    }
  }, [orders]);

  useEffect(() => {
    let cancelled = false;
    void adminOrganizationService
      .get()
      .then((org) => {
        if (!cancelled) setDocumentAdminOrg(org || null);
      })
      .catch(() => {
        if (!cancelled) setDocumentAdminOrg(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadRemotePreference = async () => {
      setSalesContractPreferenceHydrated(false);
      try {
        const value = await sharedRoleUiPreferenceService.get(
          salesContractPreferenceRoleScope,
          getSalesContractPreferenceKey(activeSubTab),
        );
        if (cancelled) return;
        if (value) {
          setSalesContractColumnWidths(
            mergeStoredSalesContractColumnWidths(
              value as Partial<Record<SalesContractColumnKey, number>>,
            ),
          );
          setSalesContractHasCustomWidths(true);
        } else {
          setSalesContractColumnWidths(SALES_CONTRACT_TABLE_DEFAULT_WIDTHS);
          setSalesContractHasCustomWidths(true);
        }
      } catch {
        setSalesContractColumnWidths(SALES_CONTRACT_TABLE_DEFAULT_WIDTHS);
        setSalesContractHasCustomWidths(true);
      } finally {
        if (!cancelled) setSalesContractPreferenceHydrated(true);
      }
    };
    void loadRemotePreference();
    return () => {
      cancelled = true;
    };
  }, [activeSubTab, salesContractPreferenceRoleScope]);

  useEffect(() => {
    if (!salesContractHasCustomWidths || !salesContractPreferenceHydrated) return;
    const timer = window.setTimeout(() => {
      void sharedRoleUiPreferenceService
        .save(
          salesContractPreferenceRoleScope,
          getSalesContractPreferenceKey(activeSubTab),
          salesContractColumnWidths,
        )
        .catch(() => {});
    }, 300);
    return () => window.clearTimeout(timer);
  }, [
    activeSubTab,
    salesContractColumnWidths,
    salesContractHasCustomWidths,
    salesContractPreferenceHydrated,
    salesContractPreferenceRoleScope,
  ]);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!salesContractColumnResizeRef.current) return;
      const { key, startX, startWidth } = salesContractColumnResizeRef.current;
      const nextWidth = Math.max(
        SALES_CONTRACT_COLUMN_MIN_WIDTHS[key],
        Math.round(startWidth + (event.clientX - startX)),
      );
      setSalesContractHasCustomWidths(true);
      setSalesContractColumnWidths((current) => (
        current[key] === nextWidth ? current : { ...current, [key]: nextWidth }
      ));
    };

    const stopResize = () => {
      salesContractColumnResizeRef.current = null;
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

  const renderedSalesContractColumnWidths = useMemo(
    () => salesContractColumnWidths,
    [salesContractColumnWidths],
  );

  const salesContractColumnWidthTotal = useMemo(
    () => SALES_CONTRACT_COLUMN_ORDER.reduce((sum, key) => sum + renderedSalesContractColumnWidths[key], 0),
    [renderedSalesContractColumnWidths],
  );

  const getSalesContractColumnStyle = (key: SalesContractColumnKey) => {
    const ratio = salesContractColumnWidthTotal > 0
      ? renderedSalesContractColumnWidths[key] / salesContractColumnWidthTotal
      : 1 / SALES_CONTRACT_COLUMN_ORDER.length;
    const width = `${(ratio * 100).toFixed(4)}%`;
    return {
      width,
      minWidth: 0,
      maxWidth: width,
    } as const;
  };

  const startSalesContractColumnResize = (
    key: SalesContractColumnKey,
    event: React.MouseEvent<HTMLDivElement>,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    setSalesContractHasCustomWidths(true);
    salesContractColumnResizeRef.current = {
      key,
      startX: event.clientX,
      startWidth: renderedSalesContractColumnWidths[key],
    };
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  const shrinkSalesContractColumnToMinimum = (
    key: SalesContractColumnKey,
    event: React.MouseEvent<HTMLDivElement>,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    setSalesContractHasCustomWidths(true);
    setSalesContractColumnWidths((current) => (
      current[key] === SALES_CONTRACT_COLUMN_MIN_WIDTHS[key]
        ? current
        : { ...current, [key]: SALES_CONTRACT_COLUMN_MIN_WIDTHS[key] }
    ));
  };

  const renderSalesContractColumnResizeHandle = (key: SalesContractColumnKey) =>
    renderColumnResizeHandle(
      key,
      startSalesContractColumnResize,
      shrinkSalesContractColumnToMinimum,
      {
        lineHoverClassName: 'group-hover:bg-slate-400',
        hitAreaClassName: key === 'select' ? 'translate-x-[17%]' : undefined,
      },
    );

  const renderSalesContractHeaderCell = (
    key: SalesContractColumnKey,
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
        style={getSalesContractColumnStyle(key)}
      >
        <div className={`flex min-h-5 w-full items-center pr-4 ${alignClass}`}>
          <span className="block break-words whitespace-normal text-[11px] font-semibold leading-4 tracking-[0.01em]">
            {label}
          </span>
        </div>
        {renderSalesContractColumnResizeHandle(key)}
      </TableHead>
    );
  };

  const requestProcurementFromContract = async (contract: any) => {
    if (!ensureBoundSalesContractSnapshot(contract)) {
      return;
    }
    const livePOs = getLivePurchaseOrdersForContract(contract);
    if (livePOs.length > 0) {
      // 允许业务员“重新激活”已有采购请求，避免按钮长期灰置且请求链路断裂
      try {
        await Promise.all(livePOs.map((po: any) => updatePurchaseOrder(po.id, {
          procurementRequestStatus: 'pending_procurement_assignment',
          status: 'pending',
          updatedDate: new Date().toISOString(),
        } as any)));
      } catch (error: any) {
        toast.error('重新激活采购请求失败', {
          description: error?.message || 'Supabase 写入失败',
          duration: 5000,
        });
        return;
      }
      toast.success('已重新激活采购请求', {
        description: `采购来源号：${livePOs.map((po: any) => po.poNumber).join(', ')}`,
        duration: 3500
      });
      return;
    }

    const poNumber = await nextPRNumber();
    const items = (contract.products || []).map((product: any, index: number) => {
      const quantity = Number(product?.quantity || 0);
      const inheritedUnitPrice = Number(
        product?.unitPrice ??
        product?.price ??
        product?.targetPrice ??
        0,
      );
      const inheritedSubtotal = Number(
        product?.amount ??
        product?.totalPrice ??
        (quantity * inheritedUnitPrice),
      );
      return {
        id: String(product?.id || product?.productId || `item-${index + 1}`),
        productName: normalizeFlowProductCore(product, index).productName,
        productNameEn: normalizeFlowProductCore(product, index).productNameEn,
        productNameZh: normalizeFlowProductCore(product, index).productNameZh,
        modelNo: normalizeFlowProductCore(product, index).modelNo,
        imageUrl: normalizeFlowProductCore(product, index).imageUrl,
        specification: normalizeFlowProductCore(product, index).specification,
        specificationEn: normalizeFlowProductCore(product, index).specificationEn,
        specificationZh: normalizeFlowProductCore(product, index).specificationZh,
        quantity,
        unit: normalizeFlowProductCore(product, index).unit || 'PCS',
        unitPrice: Number.isFinite(inheritedUnitPrice) ? inheritedUnitPrice : 0,
        currency: product?.currency || contract?.currency || 'USD',
        subtotal: Number.isFinite(inheritedSubtotal) ? inheritedSubtotal : 0,
        hsCode: product?.hsCode || '',
        packingRequirement: product?.packingRequirement || '',
        remarks: product?.remarks || ''
      };
    });

    const procurementRequestOrder = {
      id: `po-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      poNumber,
      sourceRef: contract.contractNumber,
      sourceSONumber: contract.contractNumber,
      salesContractNumber: contract.contractNumber,
      quotationNumber: contract.quotationNumber,
      projectId: contract.projectId || null,
      projectCode: contract.projectCode || null,
      projectName: contract.projectName || null,
      projectRevisionId: contract.projectRevisionId || null,
      projectRevisionCode: contract.projectRevisionCode || null,
      projectRevisionStatus: contract.projectRevisionStatus || null,
      finalRevisionId: contract.finalRevisionId || null,
      finalQuotationId: contract.finalQuotationId || null,
      finalQuotationNumber: contract.finalQuotationNumber || contract.quotationNumber || null,
      xjNumber: contract.inquiryNumber || '',
      requirementNo: '',
      supplierName: '待采购分配',
      supplierCode: 'TBD',
      region: contract.region,
      items,
      totalAmount: items.reduce((sum, item) => sum + Number(item.subtotal || 0), 0),
      currency: contract.currency || 'USD',
      paymentMode: contract.paymentMode || null,
      balanceTrigger: contract.balanceTrigger || null,
      paymentTerms: contract.paymentTerms || '待采购确认',
      deliveryTerms: contract.deliveryTime || '待采购确认',
      orderDate: new Date().toISOString(),
      expectedDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'pending',
      paymentStatus: 'unpaid',
      remarks: contract.projectRevisionId
        ? `📋 业务员请求采购（不含供应商信息）\n来源销售合同: ${contract.contractNumber}\n来源询价: ${contract.inquiryNumber || ''}\nExecution Baseline: ${contract.projectCode ? `${contract.projectCode} · ` : ''}${contract.projectName || 'Project'} / Rev ${contract.projectRevisionCode || '-'} / Final QT ${contract.finalQuotationNumber || contract.quotationNumber || '-'}\n待采购员分配供应商`
        : `📋 业务员请求采购（不含供应商信息）\n来源销售合同: ${contract.contractNumber}\n来源询价: ${contract.inquiryNumber || ''}\n待采购员分配供应商`,
      createdBy: currentUser?.email || 'system',
      ownerEmail: contract.salesPerson || null,
      ownerName: contract.salesPersonName || null,
      ownerRole: 'Sales_Rep',
      createdDate: new Date().toISOString(),
      procurementRequestStatus: 'pending_procurement_assignment',
    } as any;
    procurementRequestOrder.documentRenderMeta = contract.projectRevisionId
      ? {
          projectExecutionBaseline: {
            projectId: contract.projectId || null,
            projectCode: contract.projectCode || null,
            projectName: contract.projectName || null,
            projectRevisionId: contract.projectRevisionId || null,
            projectRevisionCode: contract.projectRevisionCode || null,
            projectRevisionStatus: contract.projectRevisionStatus || null,
            finalRevisionId: contract.finalRevisionId || null,
            finalQuotationId: contract.finalQuotationId || null,
            finalQuotationNumber: contract.finalQuotationNumber || contract.quotationNumber || null,
          },
        }
      : null;
    procurementRequestOrder.templateSnapshot = { pendingResolution: true };
    procurementRequestOrder.documentRenderMeta = null;
    procurementRequestOrder.documentDataSnapshot = buildPurchaseOrderDocumentSnapshot(procurementRequestOrder);
    try {
      await addPurchaseOrder(procurementRequestOrder);
    } catch (error: any) {
      toast.error('采购请求落库失败', {
        description: error?.message || 'Supabase 写入失败',
        duration: 5000
      });
      return;
    }

    try {
      await persistPurchaseRequest(contract, { items }, poNumber);
    } catch {
      return;
    }

    // Phase 3a: SC write-back — close the SC → PR initiation loop.
    // Both PR-side records (purchase_orders + quote_requirements) were created above.
    // Now advance the SC to po_generated and record the PR number on the SC.
    // If this write fails, the PR records are already committed; surface the error so the
    // user knows the contract status needs a manual refresh, but do not block the PR creation.
    try {
      await markPRInitiated(contract.id, poNumber);
    } catch (err: any) {
      toast.error('采购请求已创建，但合同状态同步失败', {
        description: `采购单号 ${poNumber} 已记录。请刷新页面以同步合同状态。`,
        duration: 7000,
      });
      return;
    }

    toast.success('✅ 已请求采购', {
      description: `采购单号：${poNumber}（待采购员在「采购订单管理」模块分配供应商）`,
      duration: 6000,
      action: onNavigateToProcurement
        ? { label: '去采购模块 →', onClick: onNavigateToProcurement }
        : undefined,
    });
  };

  const isContractDeletable = (contract: any): boolean => {
    return true;
  };
  
  // 🔥 全选/取消全选
  const handleSelectAll = (checked: boolean) => {
    const deletableIds = filteredContracts.filter((c) => isContractDeletable(c)).map((c) => c.id);
    if (checked) {
      setSelectedIds(deletableIds);
    } else {
      setSelectedIds([]);
    }
  };
  
  // 🔥 单个选择
  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, id]);
    } else {
      setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
    }
  };
  
  // 🔥 批量删除
  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) {
      toast.error('请先选择要删除的合同！');
      return;
    }
    
    if (window.confirm(`确定要删除选中的 ${selectedIds.length} 个合同吗？此操作不可恢复！`)) {
      try {
        await Promise.all(selectedIds.map((id) => deleteContract(id)));
        setSelectedIds([]);
        toast.success(`成功删除 ${selectedIds.length} 个合同！`);
      } catch (error: any) {
        toast.error('删除合同失败', {
          description: error?.message || '请稍后重试',
          duration: 4000,
        });
      }
    }
  };
  
  // 🔥 提交审批
  const handleSubmitForApproval = async (contract: any) => {
    console.log('📤 [SO] 提交审批:', contract);
    const contractKey = String(contract?.id || contract?.contractNumber || '').trim();
    if (!contractKey) {
      toast.error('提审失败：合同缺少系统编号，请刷新后重试');
      return;
    }
    if (submittingApprovalIds.includes(contractKey)) return;

    setSubmittingApprovalIds((prev) => [...prev, contractKey]);
    try {
    
    // 判断审批流程
    const governance = deriveScApprovalGovernance(contract);
    const requiresDirectorApproval = governance.requiresDirectorApproval;
    
    // 🔥 获取主管和总监信息
    const getRegionalManager = (region: string) => {
      const managers: Record<string, string> = {
        'NA': 'salesmanager-na@cosunchina.com', // 北美区主管：刘建国
        'SA': 'salesmanager-sa@cosunchina.com', // 南美区主管：陈明华
        'EA': 'salesmanager-ea@cosunchina.com', // 欧非区主管：赵国强
      };
      return managers[region] || managers['NA'];
    };
    
    const managerEmail = getRegionalManager(contract.region);
    const directorEmail = 'sales.director@cosunchina.com'; // 销售总监：王强
    
    // 🔥 产品摘要
    const products = Array.isArray(contract.products) ? contract.products : [];
    const productCount = products.length;
    const productSummary = productCount === 1
      ? `${products[0].productName} × ${products[0].quantity} ${products[0].unit}`
      : productCount > 1
        ? `${products[0].productName} × ${products[0].quantity} ${products[0].unit} 等 ${productCount} 项产品`
        : '未填写产品';
    
    // 🔥 创建审批请求
    await addApprovalRequest({
      type: 'sales_contract',
      relatedDocumentId: contract.contractNumber,
      relatedDocumentType: '销售合同',
      relatedDocument: contract,
      submittedBy: contract.salesPerson || currentUser?.email || '',
      submittedByName: contract.salesPersonName || currentUser?.name || currentUser?.email || '',
      submittedByRole: currentUser?.role || 'Salesperson',
      submittedAt: new Date().toISOString(),
      region: contract.region,
      currentApprover: managerEmail,
      currentApproverRole: 'Regional_Manager',
      nextApprover: requiresDirectorApproval ? directorEmail : null,
      nextApproverRole: requiresDirectorApproval ? 'Sales_Director' : null,
      requiresDirectorApproval,
      status: 'pending',
      urgency: contract.totalAmount >= 50000 ? 'high' : 'normal',
      amount: contract.totalAmount,
      currency: contract.currency,
      customerName: contract.customerName,
      customerEmail: contract.customerEmail,
      productSummary,
      deadline: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), // 48小时期限
      expiresIn: 48
    });

    // 🔥 更新销售合同状态
    await submitForApproval(contract.id, `${governance.summary}。销售合同 ${contract.contractNumber} 已准备好，请审批。`);
    
    // 🔥 显示审批流程提示
    const approvalMessage = requiresDirectorApproval
      ? `💰 合同金额：${contract.currency} ${contract.totalAmount.toLocaleString()} (≥ $20,000)\n\n📋 审批流程：\n1️⃣ 区域业务主管审批\n2️⃣ 销售总监审批\n\n✅ 双重审批通过后，可以发送给客户。`
      : `💰 合同金额：${contract.currency} ${contract.totalAmount.toLocaleString()} (< $20,000)\n\n📋 审批流程：\n1️⃣ 区域业务主管审批\n\n✅ 主管审批通过后，可以发送给客户。`;
    
    toast.success('✅ 合同已提交审批！', {
      description: approvalMessage,
      duration: 6000
    });
    
    console.log('✅ [SO] 审批请求创建成功:', contract.contractNumber);
    } catch (error: any) {
      console.error('❌ [SO] 提交审批失败:', error);
      toast.error('提审失败', {
        description: error?.message || '请稍后重试',
        duration: 5000,
      });
    } finally {
      setSubmittingApprovalIds((prev) => prev.filter((item) => item !== contractKey));
    }
  };
  
  // 🔥 发送给客户
  const handleSendToCustomer = async (contract: any) => {
    if (contract.status !== 'approved') {
      toast.error('只有审批通过的合同才能发送给客户！');
      return;
    }
    if (sendingContractIds.includes(contract.id)) return;

    setSendingContractIds((prev) => [...prev, contract.id]);
    try {
      await sendToCustomer(contract.id);
    } finally {
      setSendingContractIds((prev) => prev.filter((item) => item !== contract.id));
    }
  };

  // Phase 6c: statuses where the profit block is shown and profit filters are applied.
  const PROFIT_VISIBLE_STATUSES = ['po_generated', 'production', 'balance_confirmed', 'shipped', 'completed'];

  const formatContractNumberForDisplay = (contractNumber: string) => {
    return String(contractNumber || '')
      .replace('SC-North America-', 'SC-NA-')
      .replace('SC-South America-', 'SC-SA-')
      .replace('SC-Europe & Africa-', 'SC-EA-');
  };

  const getLivePurchaseOrdersForContract = (contract: any) => {
    const contractNo = String(contract?.contractNumber || '').trim();
    const idsFromContract = Array.isArray(contract?.purchaseOrderNumbers)
      ? new Set(contract.purchaseOrderNumbers.map((v: any) => String(v)))
      : new Set<string>();

    const directlyLinkedOrders = (purchaseOrders || []).filter((po: any) => {
      const poNo = String(po?.poNumber || '').trim();
      const sourceRef = String(po?.sourceRef || '').trim();
      const sourceSONumber = String(po?.sourceSONumber || '').trim();
      const salesContractNumber = String(po?.salesContractNumber || '').trim();
      return (
        (poNo && idsFromContract.has(poNo)) ||
        (sourceRef && sourceRef === contractNo) ||
        (sourceSONumber && sourceSONumber === contractNo) ||
        (salesContractNumber && salesContractNumber === contractNo)
      );
    });

    const liveRequestNumbers = new Set(
      directlyLinkedOrders
        .filter((po: any) => derivePurchaseOrderWorkflowFields(po).documentType === 'PR')
        .map((po: any) => String(po?.poNumber || '').trim())
        .filter(Boolean),
    );

    return directlyLinkedOrders.filter((po: any) => {
      const workflow = derivePurchaseOrderWorkflowFields(po);
      const reqStatus = String(po?.procurementRequestStatus || '').trim();
      const parentRequestPoNumber = String(po?.parentRequestPoNumber || po?.parent_request_po_number || '').trim();

      if (workflow.documentType === 'PR') {
        // 已下推供应商后的历史请求不阻止再次“请求采购”
        return reqStatus !== 'pushed_supplier' && reqStatus !== 'allocated_completed';
      }

      return Boolean(parentRequestPoNumber && liveRequestNumbers.has(parentRequestPoNumber));
    });
  };

  const getProcurementTrackingSummary = (contract: any): ProcurementTrackingSummary => {
    const contractNo = String(contract?.contractNumber || '').trim();
    const idsFromContract = Array.isArray(contract?.purchaseOrderNumbers)
      ? new Set(contract.purchaseOrderNumbers.map((v: any) => String(v)))
      : new Set<string>();

    const directlyLinkedOrders = (purchaseOrders || []).filter((po: any) => {
      const poNo = String(po?.poNumber || '').trim();
      const sourceRef = String(po?.sourceRef || '').trim();
      const sourceSONumber = String(po?.sourceSONumber || '').trim();
      const salesContractNumber = String(po?.salesContractNumber || '').trim();
      return (
        (poNo && idsFromContract.has(poNo)) ||
        (sourceRef && sourceRef === contractNo) ||
        (sourceSONumber && sourceSONumber === contractNo) ||
        (salesContractNumber && salesContractNumber === contractNo)
      );
    });

    const requestOrders = directlyLinkedOrders.filter((po: any) => derivePurchaseOrderWorkflowFields(po).documentType === 'PR');
    const requestNumbers = requestOrders
      .map((po: any) => String(po?.poNumber || '').trim())
      .filter(Boolean);
    const requestNumberSet = new Set(requestNumbers);

    const cgOrders = (purchaseOrders || []).filter((po: any) => {
      const workflow = derivePurchaseOrderWorkflowFields(po);
      if (workflow.documentType !== 'CG') return false;
      const poNo = String(po?.poNumber || '').trim();
      const sourceRef = String(po?.sourceRef || '').trim();
      const sourceSONumber = String(po?.sourceSONumber || '').trim();
      const salesContractNumber = String(po?.salesContractNumber || '').trim();
      const parentRequestPoNumber = String(po?.parentRequestPoNumber || po?.parent_request_po_number || '').trim();
      return (
        (poNo && idsFromContract.has(poNo)) ||
        (sourceRef && sourceRef === contractNo) ||
        (sourceSONumber && sourceSONumber === contractNo) ||
        (salesContractNumber && salesContractNumber === contractNo) ||
        (parentRequestPoNumber && requestNumberSet.has(parentRequestPoNumber))
      );
    });

    const primaryRequest = requestOrders[0] || null;
    const primaryWorkflow = primaryRequest ? derivePurchaseOrderWorkflowFields(primaryRequest) : null;
    const requestExecutionStatus = String(primaryWorkflow?.executionStatus || '').trim();
    const requestStatusMap: Record<string, { label: string; tone: string }> = {
      pending_assignment: { label: PROCUREMENT_STATUS_COPY.pendingAssignment, tone: 'border-amber-300 bg-amber-50 text-amber-700' },
      partially_allocated: { label: PROCUREMENT_STATUS_COPY.partiallyAllocated, tone: 'border-sky-300 bg-sky-50 text-sky-700' },
      fully_allocated: { label: PROCUREMENT_STATUS_COPY.fullyAllocated, tone: 'border-emerald-300 bg-emerald-50 text-emerald-700' },
      initiated: { label: PROCUREMENT_STATUS_COPY.created, tone: 'border-slate-300 bg-slate-50 text-slate-600' },
    };
    const requestStatusConfig = requestStatusMap[requestExecutionStatus] || (
      primaryRequest
        ? { label: PROCUREMENT_STATUS_COPY.processing, tone: 'border-slate-300 bg-slate-50 text-slate-600' }
        : { label: null, tone: 'border-slate-200 bg-slate-50 text-slate-500' }
    );

    const pushedCgCount = cgOrders.filter((po: any) => {
      const workflow = derivePurchaseOrderWorkflowFields(po);
      return String(workflow.executionStatus || '').trim() === 'pushed_to_supplier';
    }).length;
    const cgNumbers = cgOrders
      .map((po: any) => String(po?.poNumber || '').trim())
      .filter(Boolean);

    return {
      requestNumbers,
      requestStatusLabel: requestStatusConfig.label,
      requestStatusTone: requestStatusConfig.tone,
      cgCount: cgOrders.length,
      pushedCgCount,
      cgNumbers,
    };
  };
  
  // 🔥 筛选：只做状态、搜索筛选；数据来自接口，后端已按权限过滤
  const myContracts = useMemo(() => {
    const financeVisibleRoles = new Set(['Finance', 'CFO', 'CEO', 'Admin', 'External_Accountant']);
    const canViewAllContracts = financeVisibleRoles.has(String(currentUser?.role || ''));

    console.log('🔍 [SalesContractManagement] 筛选业务员合同:');
    console.log('  - 总合同数:', contracts.length);
    console.log('  - 当前用户邮箱:', currentUser?.email);
    console.log('  - 所有合同的salesPerson:', contracts.map(c => ({ 
      contractNumber: c.contractNumber, 
      salesPerson: c.salesPerson,
      customerEmail: c.customerEmail 
    })));
    
    const visibleContracts = contracts.filter(contract => {
      if (!canViewAllContracts && !matchesBusinessOwnerEmail(
        contract.ownerEmail || contract.salesPerson,
        currentUser?.email,
        contract.region,
        contract.ownerUserId,
        currentUser?.id,
      )) {
        return false;
      }

      // 🔥 数据来自接口：后端已按登录用户过滤，前端不再按 salesPerson 硬过滤
      console.log(`  - ${contract.contractNumber}: salesPerson=${contract.salesPerson}`);

      // 状态筛选
      const workflowStatus = resolveContractWorkflowStatus(contract);
      if (filterStatus !== 'all') {
        if (filterStatus === 'pending' && !['pending_supervisor', 'pending_director'].includes(workflowStatus)) {
          return false;
        } else if (filterStatus === 'sent' && !['sent', 'sent_to_customer', 'customer_confirmed', 'customer_rejected', 'customer_requested_changes'].includes(workflowStatus)) {
          return false;
        } else if (filterStatus === 'confirmed' && workflowStatus !== 'customer_confirmed') {
          return false;
        } else if (filterStatus === 'profit_unavailable') {
          // Phase 6c: show SCs in procurement phases where actual profit cannot yet be computed
          if (!PROFIT_VISIBLE_STATUSES.includes(workflowStatus as any)) return false;
          const p = computeSCProfit(contract, getQuotationByNumber(contract.quotationNumber) ?? null, purchaseOrders);
          if (p.actual.available) return false;
        } else if (filterStatus === 'profit_alert') {
          // Phase 6c: show SCs where actual profit is negative
          if (!PROFIT_VISIBLE_STATUSES.includes(workflowStatus as any)) return false;
          const p = computeSCProfit(contract, getQuotationByNumber(contract.quotationNumber) ?? null, purchaseOrders);
          if (!p.actual.available || p.actual.actualMargin >= 0) return false;
        } else if (filterStatus === 'profit_deviation') {
          // Phase 6d: show SCs where actual margin underperforms estimated by > 5pp
          if (!PROFIT_VISIBLE_STATUSES.includes(workflowStatus as any)) return false;
          const p = computeSCProfit(contract, getQuotationByNumber(contract.quotationNumber) ?? null, purchaseOrders);
          if (!p.actual.available || !p.estimated) return false;
          if ((p.actual.actualMargin - p.estimated.estimatedMargin) >= -0.05) return false;
        } else if (!['pending', 'sent', 'confirmed'].includes(filterStatus) && workflowStatus !== filterStatus) {
          return false;
        }
      }
      
      // 搜索筛选
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const displayContractNo = formatContractNumberForDisplay(contract.contractNumber).toLowerCase();
        const procurementTracking = getProcurementTrackingSummary(contract);
        return (
          contract.contractNumber.toLowerCase().includes(term) ||
          displayContractNo.includes(term) ||
          contract.quotationNumber.toLowerCase().includes(term) ||
          contract.customerCompany.toLowerCase().includes(term) ||
          contract.customerName.toLowerCase().includes(term) ||
          procurementTracking.requestNumbers.some((value) => value.toLowerCase().includes(term))
        );
      }
      
      return true;
    });

    const latestByQuotation = new Map<string, typeof visibleContracts[number]>();
    for (const contract of visibleContracts) {
      const rawKey = String(contract.quotationNumber || contract.contractNumber || contract.id || '').trim();
      if (!rawKey) continue;
      const previous = latestByQuotation.get(rawKey);
      if (!previous) {
        latestByQuotation.set(rawKey, contract);
        continue;
      }
      const previousTime = new Date(previous.updatedAt || previous.createdAt || 0).getTime();
      const currentTime = new Date(contract.updatedAt || contract.createdAt || 0).getTime();
      if (currentTime >= previousTime) {
        latestByQuotation.set(rawKey, contract);
      }
    }

    return visibleContracts.filter((contract) => {
      const key = String(contract.quotationNumber || contract.contractNumber || contract.id || '').trim();
      return !key || latestByQuotation.get(key)?.id === contract.id;
    });
  }, [contracts, currentUser, filterStatus, searchTerm, getQuotationByNumber, purchaseOrders, resolveContractWorkflowStatus]);
  
  // 🔥 统计信息
  const stats = useMemo(() => {
    const total = myContracts.length;
    const draft = myContracts.filter(c => resolveContractWorkflowStatus(c) === 'draft').length;
    const pending = myContracts.filter(c => ['pending_supervisor', 'pending_director'].includes(resolveContractWorkflowStatus(c))).length;
    const approved = myContracts.filter(c => resolveContractWorkflowStatus(c) === 'approved').length;
    const rejected = myContracts.filter(c => resolveContractWorkflowStatus(c) === 'rejected').length;
    const sent = myContracts.filter(c => ['sent', 'sent_to_customer', 'customer_confirmed', 'customer_rejected', 'customer_requested_changes'].includes(resolveContractWorkflowStatus(c))).length;
    const confirmed = myContracts.filter(c => resolveContractWorkflowStatus(c) === 'customer_confirmed').length;
    // Phase 6c: profit-state counts — only over procurement-phase SCs
    const profitUnavailable = myContracts.filter(c => {
      if (!PROFIT_VISIBLE_STATUSES.includes(resolveContractWorkflowStatus(c) as any)) return false;
      const p = computeSCProfit(c, getQuotationByNumber(c.quotationNumber) ?? null, purchaseOrders);
      return !p.actual.available;
    }).length;
    const profitAlert = myContracts.filter(c => {
      if (!PROFIT_VISIBLE_STATUSES.includes(resolveContractWorkflowStatus(c) as any)) return false;
      const p = computeSCProfit(c, getQuotationByNumber(c.quotationNumber) ?? null, purchaseOrders);
      return p.actual.available && p.actual.actualMargin < 0;
    }).length;
    // Phase 6d: actual margin underperforms estimated by > 5pp (both values must be present)
    const profitDeviation = myContracts.filter(c => {
      if (!PROFIT_VISIBLE_STATUSES.includes(resolveContractWorkflowStatus(c) as any)) return false;
      const p = computeSCProfit(c, getQuotationByNumber(c.quotationNumber) ?? null, purchaseOrders);
      if (!p.actual.available || !p.estimated) return false;
      return (p.actual.actualMargin - p.estimated.estimatedMargin) < -0.05;
    }).length;
    return { total, draft, pending, approved, rejected, sent, confirmed, profitUnavailable, profitAlert, profitDeviation };
  }, [myContracts, getQuotationByNumber, purchaseOrders, resolveContractWorkflowStatus]);

  const overviewCards: Array<{
    label: string;
    value: number;
    tone: string;
    activeTone: string;
    filter: SalesContractFilterStatus;
  }> = [
    {
      label: '全部合同',
      value: stats.total,
      tone: 'border-slate-200 bg-white text-slate-900',
      activeTone: 'border-slate-900 bg-slate-900 text-white',
      filter: 'all',
    },
    {
      label: '草稿',
      value: stats.draft,
      tone: 'border-slate-200 bg-white text-slate-600',
      activeTone: 'border-slate-800 bg-slate-800 text-white',
      filter: 'draft',
    },
    {
      label: '待审批',
      value: stats.pending,
      tone: 'border-amber-200 bg-amber-50/70 text-amber-700',
      activeTone: 'border-amber-500 bg-amber-500 text-white',
      filter: 'pending',
    },
    {
      label: '已批准',
      value: stats.approved,
      tone: 'border-emerald-200 bg-emerald-50/70 text-emerald-700',
      activeTone: 'border-emerald-500 bg-emerald-500 text-white',
      filter: 'approved',
    },
    {
      label: '已驳回',
      value: stats.rejected,
      tone: 'border-rose-200 bg-rose-50/70 text-rose-700',
      activeTone: 'border-rose-500 bg-rose-500 text-white',
      filter: 'rejected',
    },
    {
      label: '已发送',
      value: stats.sent,
      tone: 'border-sky-200 bg-sky-50/70 text-sky-700',
      activeTone: 'border-sky-500 bg-sky-500 text-white',
      filter: 'sent',
    },
    {
      label: '已确认',
      value: stats.confirmed,
      tone: 'border-teal-200 bg-teal-50/70 text-teal-700',
      activeTone: 'border-teal-500 bg-teal-500 text-white',
      filter: 'confirmed',
    },
  ];

  const filteredContracts = myContracts;
  
  // 🔥 获取状态Badge
  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; color: string; icon: any; tooltip?: string }> = {
      draft: { label: '草稿', color: 'bg-gray-100 text-gray-600 border-gray-200', icon: Edit },
      pending_supervisor: { label: '待主管审批', color: 'bg-yellow-100 text-yellow-700 border-yellow-300', icon: Clock },
      pending_director: { label: '待总监审批', color: 'bg-orange-100 text-orange-700 border-orange-300', icon: AlertCircle },
      // Phase 4: approved lightened so it doesn't read as the terminal 'completed' state.
      approved: { label: '已批准', color: 'bg-green-50 text-green-600 border-green-200', icon: CheckCircle },
      rejected: { label: '已驳回', color: 'bg-red-100 text-red-700 border-red-300', icon: XCircle },
      sent_to_customer: { label: '已发送客户', color: 'bg-blue-100 text-blue-700 border-blue-300', icon: Send },
      sent: { label: '已发送客户', color: 'bg-blue-100 text-blue-700 border-blue-300', icon: Send }, // 🔥 添加sent状态映射
      customer_confirmed: { label: '客户确认·等待定金', color: 'bg-emerald-100 text-emerald-700 border-emerald-300', icon: DollarSign }, // 🔥 修改：更清晰的状态描述，使用金钱图标
      deposit_uploaded: { label: '定金已上传·待财务确认', color: 'bg-purple-100 text-purple-700 border-purple-300', icon: FileCheck }, // 🔥 新增：定金已上传状态
      deposit_confirmed: { label: '定金已确认·可生成PO', color: 'bg-teal-100 text-teal-700 border-teal-300', icon: CheckCircle }, // 🔥 新增：定金已确认状态
      // Phase 4: po_generated — this is a procurement-queue state, not manufacturing readiness.
      // Amber signals "admin action pending". ShoppingCart icon represents procurement initiation.
      po_generated: {
        label: '采购请求已创建·待分配供应商',
        color: 'bg-amber-100 text-amber-700 border-amber-300',
        icon: ShoppingCart,
        tooltip: '采购请求已发送管理员，待供应商分配',
      },
      // Phase 4: production — all CGs pushed to suppliers; manufacturing is active (not waiting).
      // Zap icon replaces Package to signal active execution rather than a static artifact.
      production: {
        label: '生产中',
        color: 'bg-indigo-100 text-indigo-700 border-indigo-300',
        icon: Zap,
        tooltip: '所有供应商采购单已下推，供应商已开始执行',
      },
      balance_confirmed: { label: '尾款已确认·可发货', color: 'bg-lime-100 text-lime-700 border-lime-300', icon: DollarSign }, // 🔥 Phase 2a
      shipped: { label: '已发货', color: 'bg-sky-100 text-sky-700 border-sky-300', icon: Truck },
      // Phase 4: completed uses richer green to distinguish from the lighter 'approved' state.
      completed: { label: '已完成', color: 'bg-green-200 text-green-900 border-green-400', icon: CheckCircle },
      customer_rejected: { label: '客户已拒绝', color: 'bg-red-100 text-red-700 border-red-300', icon: XCircle },
      customer_requested_changes: { label: '客户要求修改', color: 'bg-purple-100 text-purple-700 border-purple-300', icon: AlertCircle },
    };

    const config = statusConfig[status] || statusConfig.draft;
    const Icon = config.icon;

    const badge = (
      <Badge className={`h-5 px-2 text-xs border ${config.color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );

    // Wrap in a span to surface tooltip via native title — keeps badge JSX unchanged.
    return config.tooltip
      ? <span title={config.tooltip}>{badge}</span>
      : badge;
  };

  const getApprovalStatusBadge = (status: string) => {
    if (status === 'rejected') {
      return (
        <Badge className="h-5 rounded-full border border-rose-200 bg-rose-50 px-2 text-[10px] font-medium text-rose-700">
          <XCircle className="mr-1 h-3 w-3" />
          已驳回
        </Badge>
      );
    }
    if (['pending_supervisor', 'pending_director'].includes(status)) {
      return (
        <Badge className="h-5 rounded-full border border-amber-200 bg-amber-50 px-2 text-[10px] font-medium text-amber-700">
          <Clock className="mr-1 h-3 w-3" />
          待审批
        </Badge>
      );
    }
    if (status === 'draft') {
      return (
        <Badge className="h-5 rounded-full border border-slate-200 bg-slate-50 px-2 text-[10px] font-medium text-slate-600">
          <Edit className="mr-1 h-3 w-3" />
          草稿
        </Badge>
      );
    }
    return (
      <Badge className="h-5 rounded-full border border-emerald-200 bg-emerald-50 px-2 text-[10px] font-medium text-emerald-700">
        <CheckCircle className="mr-1 h-3 w-3" />
        已批准
      </Badge>
    );
  };

  const getContractCustomerStatusBadge = (status: string) => {
    if (['customer_confirmed', 'deposit_uploaded', 'deposit_confirmed', 'po_generated', 'production', 'balance_confirmed', 'shipped', 'completed'].includes(status)) {
      return (
        <Badge className="h-5 rounded-full border border-emerald-200 bg-emerald-50 px-2 text-[10px] font-medium text-emerald-700">
          <CheckCircle className="mr-1 h-3 w-3" />
          已确认
        </Badge>
      );
    }
    if (['sent', 'sent_to_customer'].includes(status)) {
      return (
        <Badge className="h-5 rounded-full border border-sky-200 bg-sky-50 px-2 text-[10px] font-medium text-sky-700">
          <Send className="mr-1 h-3 w-3" />
          已发送
        </Badge>
      );
    }
    if (status === 'customer_rejected') {
      return (
        <Badge className="h-5 rounded-full border border-rose-200 bg-rose-50 px-2 text-[10px] font-medium text-rose-700">
          <XCircle className="mr-1 h-3 w-3" />
          已拒绝
        </Badge>
      );
    }
    if (status === 'customer_requested_changes') {
      return (
        <Badge className="h-5 rounded-full border border-orange-200 bg-orange-50 px-2 text-[10px] font-medium text-orange-700">
          <AlertCircle className="mr-1 h-3 w-3" />
          待修改
        </Badge>
      );
    }
    return (
      <span className="text-[11px] text-slate-300">—</span>
    );
  };
  
  return (
    <div className="flex h-full flex-1 min-h-[calc(100dvh-360px)] min-h-0 flex-col gap-3">
      {/* 🔥 业务链路进度 */}
      <WorkflowPipelineBanner
        steps={MAIN_WORKFLOW_STEPS}
        currentKey="sc"
        hint="当前：销售合同 → 定金确认后请求采购"
      />
      <div className="flex h-full flex-1 min-h-0 flex-col">
      {/* 🔥 合同列表 */}
      <div className="flex h-full flex-1 min-h-[calc(100dvh-360px)] min-h-0 w-full max-w-full flex-col overflow-visible rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-slate-50/70">
          <div className="px-5 py-4">
            <div className="flex flex-wrap items-center gap-2.5">
              {/* 搜索框 */}
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="搜索合同号、报价单号、客户名称..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`h-9 rounded-xl border-slate-200 bg-slate-50 pl-10 shadow-sm placeholder:text-slate-400 ${ERP_LIST_UI_SPEC_V1.searchTextClass}`}
                />
              </div>
              
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBatchDelete}
                disabled={selectedIds.length === 0}
                className={`h-9 shrink-0 whitespace-nowrap gap-1 rounded-xl px-3 ${ERP_LIST_UI_SPEC_V1.buttonTextClass}`}
              >
                批量删除 {selectedIds.length > 0 && `(${selectedIds.length})`}
              </Button>

              {/* 流程状态筛选 */}
              <div className="flex flex-wrap gap-2">
                {overviewCards.map((item) => (
                  <Button
                    key={item.filter}
                    variant="outline"
                    size="sm"
                    onClick={() => setFilterStatus(item.filter)}
                    style={filterStatus === item.filter ? {
                      backgroundColor: '#F5222D',
                      borderColor: '#F5222D',
                      color: '#ffffff',
                    } : undefined}
                    className={`h-9 rounded-xl px-4 shadow-sm transition-colors ${ERP_LIST_UI_SPEC_V1.buttonTextClass} ${
                      filterStatus === item.filter
                        ? 'shrink-0 whitespace-nowrap border-[#F5222D] bg-[#F5222D] !text-white hover:bg-[#d71922]'
                        : 'shrink-0 whitespace-nowrap border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {item.filter === 'all' ? '全部' : item.label} ({item.value})
                  </Button>
                ))}
              </div>
              
            </div>
          </div>
        </div>
        
        {/* 🔥 合同表格 */}
        <div ref={salesContractTableContainerRef} className="w-full max-w-full flex-1 min-h-0 overflow-x-hidden overflow-y-visible bg-white rounded-[inherit]">
          <Table className="table-fixed border-collapse bg-white" style={{ width: '100%', maxWidth: '100%' }}>
            <colgroup>
              {SALES_CONTRACT_COLUMN_ORDER.map((key) => (
                <col key={key} style={getSalesContractColumnStyle(key)} />
              ))}
            </colgroup>
            <TableHeader>
              <TableRow className={`bg-gray-50 text-slate-700 ${ERP_LIST_UI_SPEC_V1.headerTextClass}`}>
                <TableHead className="group relative overflow-hidden px-0 py-3 align-middle text-center" style={getSalesContractColumnStyle('select')}>
                  <div className="flex w-full items-center justify-center">
                    <Checkbox
                      checked={
                        selectedIds.length > 0 &&
                        selectedIds.length === filteredContracts.filter((c) => isContractDeletable(c)).length
                      }
                      onCheckedChange={handleSelectAll}
                    />
                  </div>
                  {renderSalesContractColumnResizeHandle('select')}
                </TableHead>
                {renderSalesContractHeaderCell('index', '序号', 'text-center')}
                {renderSalesContractHeaderCell('date', '日期')}
                {renderSalesContractHeaderCell('contractNo', '编号')}
                {renderSalesContractHeaderCell('country', '国家', 'text-center')}
                {renderSalesContractHeaderCell('customer', '客户信息')}
                {renderSalesContractHeaderCell('product', '产品信息')}
                {renderSalesContractHeaderCell('unitPrice', '商品单价', 'text-right')}
                {renderSalesContractHeaderCell('amount', '合同金额', 'text-right')}
                {renderSalesContractHeaderCell('approvalStatus', '审批状态', 'text-center')}
                {renderSalesContractHeaderCell('procurementProgress', '采购进度', 'text-center')}
                {renderSalesContractHeaderCell('customerStatus', '客户状态', 'text-center')}
                {renderSalesContractHeaderCell('actions', '操作', 'text-center')}
              </TableRow>
            </TableHeader>
            <TableBody className="text-[11px] text-slate-700">
              {filteredContracts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={13} className="text-center py-12 text-gray-500">
                    <AlertCircle className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                    <p>{myContracts.length === 0 ? '暂无销售合同' : '没有符合当前筛选条件的合同'}</p>
                    <p className="text-sm mt-1">
                      {myContracts.length === 0
                        ? '在报价管理模块中，客户接受报价后可生成销售合同'
                        : '试试调整搜索词或切换上方状态/利润筛选'}
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredContracts.map((contract, index) => {
                  const isHighlighted = highlightedId === contract.id; // 🔥 判断是否高亮
                  const linkedQuotation = getQuotationByNumber(contract.quotationNumber) as any;
                  const quotationFinancialSummary = deriveQuotationFinancialSummaryForContract(linkedQuotation, contract);
                  const linkedQuotationForProfit = linkedQuotation || (
                    quotationFinancialSummary.totalCost > 0
                      ? {
                          totalCost: quotationFinancialSummary.totalCost,
                          totalProfit: quotationFinancialSummary.totalProfit,
                          profitRate: quotationFinancialSummary.profitRate,
                        }
                      : null
                  );
                  const normalizedProfitRate = Number.isFinite(quotationFinancialSummary.profitRate)
                    ? quotationFinancialSummary.profitRate
                    : 0;
                  const profitLevelLabel =
                    normalizedProfitRate >= 20 ? '优秀'
                    : normalizedProfitRate >= 10 ? '良好'
                    : normalizedProfitRate > 0 ? '正常'
                    : '待定';
                  
                  const splitFields = deriveSalesContractSplitFields(contract);
                  const executionStatus = String(splitFields.executionStatus || contract.executionStatus || '').trim().toLowerCase();
                  const paymentStatusDeposit = String(splitFields.paymentStatusDeposit || contract.paymentStatusDeposit || '').trim().toLowerCase();
                  const paymentStatusBalance = String(splitFields.paymentStatusBalance || contract.paymentStatusBalance || '').trim().toLowerCase();
                  const procurementTracking = getProcurementTrackingSummary(contract);
                  const hasLiveProcurementRequest = getLivePurchaseOrdersForContract(contract).length > 0;
                  const hasExistingProcurementChain = procurementTracking.requestNumbers.length > 0;
                  const procurementFullyPushed =
                    procurementTracking.cgCount > 0 &&
                    procurementTracking.pushedCgCount >= procurementTracking.cgCount;
                  const relatedRefs = buildSalesContractRelatedRefs(contract, linkedQuotation, procurementTracking, quoteRequirements);
                  const relatedRefsExpanded = expandedRelatedIds.includes(contract.id);
                  const canReactivateProcurement =
                    hasLiveProcurementRequest &&
                    hasExistingProcurementChain &&
                    !procurementFullyPushed;
                  // 🔥 查找对应的订单数据，兼容历史订单层 proof
                  const correspondingOrder = orders.find(o => o.orderNumber === contract.contractNumber);
                  const workflowStatus = resolveContractWorkflowStatus(contract);
                  const depositConfirmed =
                    paymentStatusDeposit === 'confirmed' ||
                    executionStatus === 'deposit_confirmed' ||
                    executionStatus === 'in_procurement' ||
                    executionStatus === 'in_pre_production' ||
                    executionStatus === 'in_production' ||
                    correspondingOrder?.depositPaymentProof?.status === 'confirmed';
                  // Phase 2b-i: ship-first mode flag (balance paid AFTER shipment)
                  const isShipFirst = contract.paymentMode === 'tt_deposit_balance_against_bl' ||
                    contract.paymentMode === 'dp' || contract.paymentMode === 'da' || contract.paymentMode === 'oa';
                  // Phase 2b-ii: LC mode flag — balance_confirmed means LC readiness, not a cash receipt
                  const isLC = contract.paymentMode === 'lc_100' || contract.paymentMode === 'deposit_plus_lc';
                  // Phase 2b-ii: procurement-eligible — aligned with generatePurchaseOrder gate in context
                  // lc_100: no deposit stage, trigger from customer_confirmed onwards
                  // all other modes: trigger from split deposit-confirmed/in-procurement states
                  const procurementEligible = contract.paymentMode === 'lc_100'
                    ? ['customer_confirmed', 'deposit_uploaded', 'deposit_confirmed', 'in_procurement', 'in_pre_production', 'in_production'].includes(executionStatus || workflowStatus)
                    : (depositConfirmed || hasLiveProcurementRequest);
                  
                  return (
                    <TableRow 
                      key={contract.id} 
                      className={`[&>td]:py-3 [&>td]:align-top border-b border-slate-200/90 transition-all duration-200 hover:bg-gray-50 ${
                        isHighlighted ? 'bg-yellow-100 border-2 border-yellow-400 shadow-lg' : 'bg-white'
                      }`}
                      style={isHighlighted ? { animation: 'pulse 1s ease-in-out 3' } : undefined}
                    >
                      <TableCell className="px-0 py-3 text-center align-middle" style={getSalesContractColumnStyle('select')}>
                        <div className="flex w-full items-center justify-center px-2">
                          <Checkbox
                            checked={selectedIds.includes(contract.id)}
                            disabled={!isContractDeletable(contract)}
                            onCheckedChange={(checked) => handleSelectOne(contract.id, checked as boolean)}
                          />
                        </div>
                      </TableCell>
                      <TableCell className="px-2 py-3 text-center align-middle text-[11px] text-gray-500" style={getSalesContractColumnStyle('index')}>
                        <div className="flex w-full items-center justify-center">
                          {index + 1}
                        </div>
                      </TableCell>
                      <TableCell className="px-2 py-2 align-middle overflow-hidden" style={getSalesContractColumnStyle('date')}>
                        <div className="flex items-center gap-1.5 whitespace-nowrap">
                          <span className="text-[12px] text-slate-500">创</span>
                          <span className="text-[12px] font-medium text-slate-900">
                            {formatSalesContractDateOnly(contract.createdAt || contract.created_at)}
                          </span>
                          <CompactDetailsPopover
                            items={[
                              { label: '发送', value: formatSalesContractDateOnly(contract.sentToCustomerAt) },
                              { label: '确认', value: formatSalesContractDateOnly(contract.customerConfirmedAt) },
                              { label: '更新', value: formatSalesContractDateOnly(contract.updatedAt || contract.updated_at) },
                            ]}
                          />
                        </div>
                      </TableCell>
                      <TableCell 
                        className="px-2 cursor-pointer overflow-hidden align-middle font-mono font-semibold text-blue-600 hover:text-blue-700"
                        style={getSalesContractColumnStyle('contractNo')}
                        onClick={() => {
                          setSelectedContract(contract);
                          setShowDocumentPreview(true);
                        }}
                        title="点击查看合同文档"
                      >
                        <div className="flex min-w-0 items-center gap-1.5">
                          <div className={`truncate whitespace-nowrap ${ERP_LIST_UI_SPEC_V1.primaryTextClass} leading-5`} title={formatContractNumberForDisplay(contract.contractNumber)}>
                            {formatContractNumberForDisplay(contract.contractNumber)}
                          </div>
                          <CompactDetailsPopover
                            items={[
                              ...relatedRefs.map((ref) => ({
                                label: '关联',
                                value: ref.value,
                                className: `font-mono ${ref.className}`,
                                onClick: (event: React.MouseEvent<HTMLButtonElement>) => {
                                  event.stopPropagation();
                                  const target = String(ref.value || '').trim();
                                  if (target.startsWith('ING-')) {
                                    onNavigateToInquiryWithHighlight?.(target);
                                    return;
                                  }
                                  if (target.startsWith('QR-')) {
                                    onNavigateToCostInquiryWithHighlight?.(target);
                                    return;
                                  }
                                  if (target.startsWith('QT-')) {
                                    onNavigateToQuotationWithHighlight?.(target);
                                  }
                                },
                              })),
                              contract.projectRevisionId ? {
                                label: '基线',
                                value: `${contract.projectCode ? `${contract.projectCode} · ` : ''}${contract.projectName || 'Project'} / Rev ${contract.projectRevisionCode || '-'}`,
                                className: 'text-indigo-500',
                              } : null,
                            ].filter(Boolean) as CompactDetailItem[]}
                          />
                        </div>
                      </TableCell>
                      <TableCell className="px-2 align-middle overflow-hidden" style={getSalesContractColumnStyle('country')}>
                        {(() => {
                          const countryLabel = String(contract.customerCountry || '').trim()
                            || REGION_LABEL_MAP[String(contract.region || '').trim().toUpperCase()]
                            || String(contract.region || '').trim()
                            || '—';
                          return (
                            <Badge variant="outline" className={`h-6 rounded-full px-2 ${ERP_LIST_UI_SPEC_V1.secondaryTextClass} text-slate-700`}>
                              {countryLabel}
                            </Badge>
                          );
                        })()}
                      </TableCell>
                      <TableCell className="px-2 align-middle overflow-hidden" style={getSalesContractColumnStyle('customer')}>
                        <div className="flex min-w-0 items-center gap-1.5">
                          <div className={`truncate whitespace-nowrap ${ERP_LIST_UI_SPEC_V1.primaryTextClass} font-medium text-slate-800 leading-5`} title={contract.customerCompany}>
                            {contract.customerCompany}
                          </div>
                          <CompactDetailsPopover
                            items={[
                              { label: '联系人', value: contract.customerName, className: 'text-slate-600' },
                              { label: '邮箱', value: contract.customerEmail, className: 'break-all text-slate-500' },
                            ]}
                          />
                        </div>
                      </TableCell>
                      <TableCell className="px-2 align-middle overflow-hidden" style={getSalesContractColumnStyle('product')}>
                        {(() => {
                          const products = Array.isArray(contract.products) ? contract.products : [];
                          const first = products[0];
                          const totalQty = products.reduce((sum, p) => sum + (Number(p.quantity) || 0), 0);
                          const unit = first?.unit || '';
                          return (
                            <div className="flex min-w-0 items-center gap-1.5">
                              <div className={`truncate whitespace-nowrap ${ERP_LIST_UI_SPEC_V1.primaryTextClass} text-slate-800 leading-5`} title={first?.productName || 'N/A'}>
                                {first?.productName || 'N/A'}
                              </div>
                              <CompactDetailsPopover
                                items={[
                                  { label: '产品', value: `共 ${Math.max(products.length, 1)} 个产品` },
                                  { label: '数量', value: `${totalQty.toLocaleString()} ${unit}` },
                                ]}
                              />
                            </div>
                          );
                        })()}
                      </TableCell>
                      <TableCell className="px-2 text-right align-middle overflow-hidden" style={getSalesContractColumnStyle('unitPrice')}>
                        {(() => {
                          const products = Array.isArray(contract.products) ? contract.products : [];
                          const prices = products
                            .map((product: any) => Number(
                              product?.unitPrice ??
                              product?.salesPrice ??
                              product?.quotePrice ??
                              0,
                            ))
                            .filter((value: number) => Number.isFinite(value) && value > 0);
                          if (prices.length === 0) return <span className="text-gray-400">—</span>;
                          const currency = contract.currency || 'USD';
                          const minPrice = Math.min(...prices);
                          const maxPrice = Math.max(...prices);
                          const formatPrice = (value: number) =>
                            value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                          const hasRange = products.length > 1 && maxPrice > minPrice;
                          return (
                            <div className="flex items-center justify-end gap-1.5">
                              <div className={`truncate whitespace-nowrap ${ERP_LIST_UI_SPEC_V1.primaryTextClass} font-medium text-slate-800 leading-5`}>
                                {hasRange
                                  ? `${currency} ${formatPrice(minPrice)} ~ ${formatPrice(maxPrice)}`
                                  : `${currency} ${formatPrice(maxPrice)}`}
                              </div>
                            </div>
                          );
                        })()}
                      </TableCell>
                      <TableCell className="px-2 text-right align-middle overflow-hidden" style={getSalesContractColumnStyle('amount')}>
                        <div className="flex items-center justify-end gap-1.5">
                          <div>
                            <div className="truncate whitespace-nowrap text-[12px] font-bold leading-5 text-slate-900">
                            {contract.currency} {contract.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                          </div>
                          <CompactDetailsPopover
                            align="end"
                            items={[
                              { label: '定金', value: `${contract.depositPercentage}%: ${contract.currency} ${contract.depositAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
                              { label: '余款', value: `${contract.balancePercentage}%: ${contract.currency} ${contract.balanceAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
                              { label: '利润率', value: normalizedProfitRate > 0 ? `${normalizedProfitRate.toFixed(1)}% (${profitLevelLabel})` : '—', className: normalizedProfitRate > 0 ? 'text-emerald-600 font-medium' : 'text-slate-400' },
                            ]}
                          />
                          <div className="hidden text-[11px] leading-4 text-slate-500">
                            定金 {contract.depositPercentage}%: {contract.currency} {contract.depositAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                          <div className="hidden text-[11px] leading-4 text-slate-500">
                            余款 {contract.balancePercentage}%: {contract.currency} {contract.balanceAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                          <div className="hidden text-[11px] leading-4 justify-between gap-2">
                            <span className="text-gray-500">预估利润率</span>
                            <span
                              className={`font-medium ${normalizedProfitRate > 0 ? 'text-emerald-600' : 'text-slate-400'}`}
                              title="来自关联QT的预估利润率；若未存利润率字段，则按 QT总利润 / QT总成本 回算"
                            >
                              {normalizedProfitRate > 0 ? `${normalizedProfitRate.toFixed(1)}% (${profitLevelLabel})` : '—'}
                            </span>
                          </div>
                          {/* Phase 6a/6b: SC profit block ───────────────────────────────────────
                              Shown from po_generated onward (procurement has started).
                              Revenue   = SC.totalAmount
                              Estimated = QT.totalCost/totalProfit (Phase 6a)
                              Actual    = sum(CG.totalAmount) + SC.additionalCost (Phase 6b)
                              Phase 5 rule: no SC state is changed here — read-only derived view. */}
                          {PROFIT_VISIBLE_STATUSES.includes(workflowStatus as any) && (() => {
                            const profit = computeSCProfit(
                              contract,
                              linkedQuotationForProfit,
                              purchaseOrders,
                            );
                            const fmtPct = (n: number) => `${(n * 100).toFixed(1)}%`;
                            // Phase 6c: absolute-amount formatter in SC currency
                            const sym = contract.currency === 'USD' ? '$'
                                      : contract.currency === 'EUR' ? '€'
                                      : contract.currency === 'GBP' ? '£'
                                      : contract.currency;
                            const fmtAmt = (n: number) =>
                              `${n < 0 ? '-' : ''}${sym}${Math.abs(n).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
                            const addCost = contract.additionalCost ?? 0;
                            const isEditingThis = editingAdditionalCostId === contract.id;
                            return (
                              <div className="hidden border-t border-gray-100 mt-1 pt-1 space-y-0.5">
                                {/* Estimated line — from QT.totalProfit; always shown (暂无 when QT data absent) */}
                                <div className="text-[10px] text-gray-400 italic flex justify-between gap-2">
                                  <span>估算毛利</span>
                                  {profit.estimated ? (
                                    <span className="text-right">
                                      <span>~{fmtPct(profit.estimated.estimatedMargin)}</span>
                                      <span className="mx-0.5 opacity-40">/</span>
                                      <span>~{fmtAmt(profit.estimated.estimatedProfit)}</span>
                                    </span>
                                  ) : (
                                    <span title="报价单成本数据未录入">暂无</span>
                                  )}
                                </div>
                                {/* Actual line — from CGs + additionalCost; always shown */}
                                <div className="text-[10px] flex justify-between gap-2">
                                  <span className="text-gray-500">实际毛利</span>
                                  {profit.actual.available ? (
                                    <span className={`text-right font-medium ${profit.actual.actualMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                      <span>{fmtPct(profit.actual.actualMargin)}</span>
                                      <span className="mx-0.5 opacity-40">/</span>
                                      <span>{fmtAmt(profit.actual.actualProfit)}</span>
                                    </span>
                                  ) : (
                                    <span
                                      className="text-gray-400 cursor-help"
                                      title={ACTUAL_UNAVAILABLE_TOOLTIP[profit.actual.reason]}
                                    >
                                      {ACTUAL_UNAVAILABLE_ICON[profit.actual.reason]}{' '}{ACTUAL_UNAVAILABLE_LABEL[profit.actual.reason]}
                                    </span>
                                  )}
                                </div>
                                {/* Actual cost line — shown when actual is available; helps verify margin */}
                                {profit.actual.available && (
                                  <div className="text-[10px] flex justify-between gap-2">
                                    <span className="text-gray-400">实际成本</span>
                                    <span className="text-gray-400">{fmtAmt(profit.actual.actualCost)}</span>
                                  </div>
                                )}
                                {/* Phase 6d: deviation line — only when actual underperforms estimated by > 5pp */}
                                {profit.actual.available && profit.estimated && (() => {
                                  const delta = profit.actual.actualMargin - profit.estimated.estimatedMargin;
                                  if (delta >= -0.05) return null;
                                  return (
                                    <div className="text-[10px] flex justify-between gap-2">
                                      <span className="text-orange-600">毛利偏差</span>
                                      <span className="text-orange-600 font-medium">
                                        ↓ −{Math.abs(delta * 100).toFixed(1)}pp
                                      </span>
                                    </div>
                                  );
                                })()}
                                {/* Phase 6b: additional cost — display + inline edit ─────────── */}
                                {isEditingThis ? (
                                  <div className="text-[10px] flex justify-between gap-1 items-center pt-0.5">
                                    <span className="text-gray-400 shrink-0">附加成本 ({contract.currency})</span>
                                    <span className="flex items-center gap-0.5">
                                      <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        className="w-20 text-right text-[10px] border border-gray-300 rounded px-1 leading-4 focus:outline-none focus:border-blue-400"
                                        value={additionalCostDraft}
                                        onChange={e => setAdditionalCostDraft(e.target.value)}
                                        onKeyDown={e => {
                                          if (e.key === 'Enter') handleSaveAdditionalCost(contract.id);
                                          if (e.key === 'Escape') setEditingAdditionalCostId(null);
                                        }}
                                        autoFocus
                                      />
                                      <button
                                        className="text-green-600 hover:text-green-700 px-0.5"
                                        title="保存"
                                        onClick={() => handleSaveAdditionalCost(contract.id)}
                                      >✓</button>
                                      <button
                                        className="text-gray-400 hover:text-gray-600 px-0.5"
                                        title="取消"
                                        onClick={() => setEditingAdditionalCostId(null)}
                                      >✕</button>
                                    </span>
                                  </div>
                                ) : (
                                  <div className="text-[10px] flex justify-between gap-2 items-center group/addcost">
                                    <span className="text-gray-400">附加成本</span>
                                    <span className="flex items-center gap-1">
                                      {addCost > 0 ? (
                                        <span className="text-gray-500">+{contract.currency} {addCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                      ) : (
                                        <span className="text-gray-300">—</span>
                                      )}
                                      <button
                                        className="invisible group-hover/addcost:visible text-gray-400 hover:text-gray-600 leading-none"
                                        title="编辑附加成本（运费/关税等）"
                                        onClick={() => {
                                          setAdditionalCostDraft(String(addCost === 0 ? '' : addCost));
                                          setEditingAdditionalCostId(contract.id);
                                        }}
                                      >✎</button>
                                    </span>
                                  </div>
                                )}
                                {/* Phase 8: FX rate rows — one per foreign-currency CG currency ─────── */}
                                {(() => {
                                  const scCcy = String(contract.currency || '').toUpperCase();
                                  const neededCurrencies = [...new Set(
                                    purchaseOrders
                                      .filter(po =>
                                        String(po.salesContractNumber || '').trim() === String(contract.contractNumber || '').trim() &&
                                        String(po.poNumber || '').trim().startsWith('CG-')
                                      )
                                      .map(po => String(po.currency || '').toUpperCase())
                                      .filter(c => c && c !== scCcy)
                                  )].sort();
                                  if (neededCurrencies.length === 0) return null;
                                  return (
                                    <>
                                      {neededCurrencies.map(ccy => {
                                        const fxKey = `${contract.id}::${ccy}`;
                                        const isEditingFx = editingFxKey === fxKey;
                                        const storedRate = (contract.fxRates ?? {})[ccy];
                                        const hasRate = storedRate && storedRate > 0;
                                        return (
                                          <div key={ccy}>
                                            {isEditingFx ? (
                                              <div className="text-[10px] flex justify-between gap-1 items-center pt-0.5">
                                                <span className="text-gray-400 shrink-0">汇率 {ccy}（1 {contract.currency} = ?）</span>
                                                <span className="flex items-center gap-0.5">
                                                  <input
                                                    type="number"
                                                    min="0.0001"
                                                    step="0.01"
                                                    className="w-20 text-right text-[10px] border border-gray-300 rounded px-1 leading-4 focus:outline-none focus:border-blue-400"
                                                    value={fxRateDraft}
                                                    onChange={e => setFxRateDraft(e.target.value)}
                                                    onKeyDown={e => {
                                                      if (e.key === 'Enter') handleSaveFxRate(contract.id, ccy);
                                                      if (e.key === 'Escape') setEditingFxKey(null);
                                                    }}
                                                    autoFocus
                                                  />
                                                  <button
                                                    className="text-green-600 hover:text-green-700 px-0.5"
                                                    title="保存"
                                                    onClick={() => handleSaveFxRate(contract.id, ccy)}
                                                  >✓</button>
                                                  <button
                                                    className="text-gray-400 hover:text-gray-600 px-0.5"
                                                    title="取消"
                                                    onClick={() => setEditingFxKey(null)}
                                                  >✕</button>
                                                </span>
                                              </div>
                                            ) : (
                                              <div className="text-[10px] flex justify-between gap-2 items-center group/fxrow">
                                                <span className="text-gray-400">汇率 {ccy}（1 {contract.currency} = ? {ccy}）</span>
                                                <span className="flex items-center gap-1">
                                                  {hasRate ? (
                                                    <span className="text-gray-500">{storedRate.toLocaleString('en-US', { maximumFractionDigits: 4 })}</span>
                                                  ) : (
                                                    <span className="text-amber-500">未设置</span>
                                                  )}
                                                  <button
                                                    className="invisible group-hover/fxrow:visible text-gray-400 hover:text-gray-600 leading-none"
                                                    title={`设置汇率：1 ${contract.currency} = ? ${ccy}`}
                                                    onClick={() => {
                                                      setFxRateDraft(hasRate ? String(storedRate) : '');
                                                      setEditingFxKey(fxKey);
                                                    }}
                                                  >✎</button>
                                                </span>
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </>
                                  );
                                })()}
                                {/* Phase 7B: frozen profit snapshot — read-only, shown once SC is completed */}
                                {contract.status === 'completed' && contract.profitSnapshot && (() => {
                                  const snap = contract.profitSnapshot;
                                  return (
                                    <div
                                      className="text-[10px] flex justify-between gap-2 pt-0.5 border-t border-gray-100 mt-0.5"
                                      title="合同完成时冻结的利润数据"
                                    >
                                      <span className="text-gray-700 font-medium">最终毛利</span>
                                      <span className={`text-right font-semibold ${snap.finalMargin >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                                        <span>{fmtPct(snap.finalMargin)}</span>
                                        <span className="mx-0.5 opacity-40">/</span>
                                        <span>{fmtAmt(snap.finalProfit)}</span>
                                      </span>
                                    </div>
                                  );
                                })()}
                              </div>
                            );
                          })()}
                        </div>
                      </TableCell>
                      <TableCell className="px-2 text-center align-middle overflow-hidden" style={getSalesContractColumnStyle('approvalStatus')}>
                        <div className="flex w-full items-center justify-center">
                          {getApprovalStatusBadge(workflowStatus)}
                        </div>
                      </TableCell>
                      <TableCell className="px-2 text-center align-middle overflow-hidden" style={getSalesContractColumnStyle('procurementProgress')}>
                        <div className="flex w-full items-center justify-center gap-1.5">
                          {procurementTracking.requestStatusLabel ? (
                            <Badge className={`h-5 rounded-full px-2 text-[10px] font-medium ${procurementTracking.requestStatusTone}`}>
                              {procurementTracking.requestStatusLabel}
                            </Badge>
                          ) : (
                            <span className="text-[10px] leading-4 text-slate-500">{PROCUREMENT_STATUS_COPY.uncreated}</span>
                          )}
                          <CompactDetailsPopover
                            align="center"
                            items={[
                              procurementTracking.requestStatusLabel ? {
                                label: '进度',
                                value: getProcurementCgProgressLabel(procurementTracking),
                                className: 'text-slate-500',
                              } : null,
                            ].filter(Boolean) as CompactDetailItem[]}
                          />
                        </div>
                      </TableCell>
                      <TableCell className="px-2 text-center align-middle overflow-hidden" style={getSalesContractColumnStyle('customerStatus')}>
                        <div className="flex w-full items-center justify-center">
                          {getContractCustomerStatusBadge(workflowStatus)}
                        </div>
                      </TableCell>
                      <TableCell className="px-2 align-top overflow-hidden" style={getSalesContractColumnStyle('actions')}>
                        <div className="flex w-full flex-wrap items-start gap-1">
                          <Button 
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedContract(contract);
                              setShowDocumentPreview(true);
                            }}
                            className={`h-7 justify-center gap-1 rounded-full border-slate-200 bg-white px-1.5 ${ERP_LIST_UI_SPEC_V1.secondaryTextClass} leading-4 text-slate-700 hover:bg-slate-50`}
                            title="查看合同文档"
                          >
                            查看
                          </Button>
                          
                          {/* 🔥 临时修复按钮：强制更新状态为customer_confirmed */}
                          {contract.status === 'approved' && correspondingOrder?.depositPaymentProof?.status === 'confirmed' && (
                            <Button 
                              variant="outline"
                              size="sm"
                              onClick={async () => {
                                try {
                                  await updateContract(contract.id, { 
                                    status: 'customer_confirmed',
                                    customerConfirmedAt: new Date().toISOString(),
                                    sentToCustomerAt: contract.sentToCustomerAt || new Date().toISOString()
                                  });
                                  toast.success('✅ 状态已修复为"客户已确认"', {
                                    description: '现在可以点击"通知采购部"按钮了！',
                                    duration: 3000
                                  });
                                } catch (error: any) {
                                  toast.error('状态修复失败', {
                                    description: error?.message || '请稍后重试',
                                    duration: 4000,
                                  });
                                }
                              }}
                              className={`h-7 justify-center gap-1 rounded-full border-orange-300 bg-orange-50 px-1.5 ${ERP_LIST_UI_SPEC_V1.secondaryTextClass} leading-4 text-orange-700 hover:bg-orange-100`}
                              title="临时修复：将状态更新为customer_confirmed"
                            >
                              🔧 修复状态
                            </Button>
                          )}
                          
                          {workflowStatus === 'draft' && (
                            <Button 
                              size="sm"
                              onClick={() => handleSubmitForApproval(contract)}
                              disabled={submittingApprovalIds.includes(String(contract.id || contract.contractNumber || '').trim())}
                              className={`h-7 justify-center gap-1 rounded-full bg-blue-500 px-1.5 ${ERP_LIST_UI_SPEC_V1.secondaryTextClass} leading-4 shadow-none hover:bg-blue-600`}
                              title={contract.totalAmount >= 20000 ? '金额≥$20,000，需主管+总监双重审批' : '金额<$20,000，只需主管审批'}
                            >
                              {submittingApprovalIds.includes(String(contract.id || contract.contractNumber || '').trim()) ? '提审中' : '提审'}
                            </Button>
                          )}
                          
                          {workflowStatus === 'approved' && (
                            <Button 
                              size="sm"
                              onClick={() => handleSendToCustomer(contract)}
                              disabled={sendingContractIds.includes(contract.id)}
                              className={`h-7 justify-center gap-1 rounded-full bg-emerald-500 px-1.5 ${ERP_LIST_UI_SPEC_V1.secondaryTextClass} leading-4 shadow-none hover:bg-emerald-600`}
                              title={sendingContractIds.includes(contract.id) ? '正在发送合同给客户' : '发送合同给客户'}
                            >
                              {sendingContractIds.includes(contract.id) ? '发送中' : '发送'}
                            </Button>
                          )}
                          
                          {/* 🔥 已发送客户：只显示已发状态 */}
                          {(workflowStatus === 'sent' || workflowStatus === 'sent_to_customer') && (
                            <Button 
                              size="sm"
                              disabled
                              className={`h-7 justify-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-1.5 ${ERP_LIST_UI_SPEC_V1.secondaryTextClass} leading-4 text-slate-400 cursor-not-allowed hover:bg-slate-50`}
                            >
                              已发送
                            </Button>
                          )}
                          
                          {/* 🔥 客户确认但未到款：显示等待定金确认 */}
                          {workflowStatus === 'customer_confirmed' && !depositConfirmed && (
                            <Button 
                              size="sm"
                              disabled
                              className={`h-7 justify-center gap-1 rounded-full bg-amber-50 px-1.5 ${ERP_LIST_UI_SPEC_V1.secondaryTextClass} leading-4 text-amber-700`}
                              title="等待客户上传定金凭证，或等待财务确认收款"
                            >
                              <Clock className="h-3 w-3" />
                              等待定金确认
                            </Button>
                          )}
                          
                          {/* 🔥 Phase 2b-ii: 请求采购 — procurement-eligible gate aligned with context generatePurchaseOrder
                              lc_100          : show from customer_confirmed (no deposit required)
                              deposit_plus_lc : keeps existing depositConfirmed gate (deposit stage required)
                              other modes     : keeps existing depositConfirmed gate */}
                          {procurementEligible && (
                            procurementFullyPushed ? (
                              <Button
                                size="sm"
                                disabled
                                className={`h-7 justify-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 ${ERP_LIST_UI_SPEC_V1.secondaryTextClass} leading-4 text-emerald-600 cursor-not-allowed`}
                                title="采购已下推供应商，合同正在履约中，请在「采购订单管理」模块查看进度"
                              >
                                ✓ 采购已发起
                              </Button>
                            ) : canReactivateProcurement ? (
                              <Button
                                size="sm"
                                onClick={() => requestProcurementFromContract(contract)}
                                variant="outline"
                                className={`h-7 justify-center gap-1 rounded-full border-sky-200 bg-sky-50 px-1.5 ${ERP_LIST_UI_SPEC_V1.secondaryTextClass} leading-4 text-sky-700 shadow-none hover:bg-sky-100`}
                                title="已存在采购请求，点击重新激活并回到待采购分配"
                              >
                                重新激活
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => requestProcurementFromContract(contract)}
                                className={`h-7 justify-center gap-1 rounded-full bg-[#F96302] px-2 ${ERP_LIST_UI_SPEC_V1.secondaryTextClass} leading-4 shadow-none hover:bg-[#e05a02] text-white font-medium`}
                                title={contract.paymentMode === 'lc_100'
                                  ? '客户已确认（LC模式无需定金），生成采购请求(PR)，采购员将分配供应商'
                                  : '定金已确认，生成采购请求(PR)→采购员分配供应商→生成采购订单(CG)'}
                              >
                                下推 → 采购请求
                              </Button>
                            )
                          )}

                          {/* 🔥 Phase 2b-ii: 确认尾款 / 确认信用证已落实
                              Mode 1/null     : show at deposit_confirmed | po_generated | production (pre-ship)
                              Ship-first      : also show at shipped (post-ship balance confirmation)
                              lc_100          : show at po_generated | production (no deposit stage)
                              deposit_plus_lc : show at deposit_confirmed | po_generated | production */}
                          {(
                            ['in_production', 'qc_pending', 'qc_passed', 'awaiting_balance', 'balance_uploaded', 'balance_confirmed'].includes(executionStatus || workflowStatus) ||
                            (isShipFirst && (executionStatus || workflowStatus) === 'shipped') ||
                            (paymentStatusBalance === 'uploaded')
                          ) && (
                            <Button
                              size="sm"
                              onClick={() => confirmBalancePayment(contract.id, currentUser?.name || 'finance')}
                              className={`h-7 justify-center gap-1 rounded-full bg-sky-500 px-1.5 ${ERP_LIST_UI_SPEC_V1.secondaryTextClass} leading-4 shadow-none hover:bg-sky-600`}
                              title={isShipFirst
                                ? '财务确认尾款已到账（发货后收款），合同可标记完成'
                                : isLC
                                  ? '确认信用证已落实（LC到位），合同可进入发货流程'
                                  : '财务确认尾款已到账，合同可进入发货流程'}
                            >
                              <DollarSign className="h-3 w-3" />
                              {isLC ? '确认信用证已落实' : '确认尾款'}
                            </Button>
                          )}

                          {/* 🔥 Phase 2b-i: 标记发货
                              Mode 1/null : show only at balance_confirmed (balance already received)
                              Ship-first  : show at customer_confirmed | deposit_confirmed | po_generated | production (ship before balance) */}
                          {(
                            (isShipFirst && ['customer_confirmed', 'deposit_confirmed', 'po_generated', 'production'].includes(workflowStatus)) ||
                            (!isShipFirst && workflowStatus === 'balance_confirmed')
                          ) && (
                            <Button
                              size="sm"
                              onClick={() => advanceSCToShipped(contract.id)}
                              className={`h-7 justify-center gap-1 rounded-full bg-emerald-500 px-1.5 ${ERP_LIST_UI_SPEC_V1.secondaryTextClass} leading-4 shadow-none hover:bg-emerald-600`}
                              title={isShipFirst
                                ? '尾款将在发货后结算，立即安排发货'
                                : '尾款已确认，标记合同为已发货'}
                            >
                              <Truck className="h-3 w-3" />
                              发货
                            </Button>
                          )}

                          {/* 🔥 Phase 2b-i: 完成合同
                              Mode 1/null : show at shipped (balance was already received pre-ship)
                              Ship-first  : show at balance_confirmed (post-ship balance received → ready to complete) */}
                          {(
                            (isShipFirst && workflowStatus === 'balance_confirmed') ||
                            (!isShipFirst && workflowStatus === 'shipped')
                          ) && (
                            <Button
                              size="sm"
                              onClick={() => advanceSCToCompleted(contract.id)}
                              className={`h-7 justify-center gap-1 rounded-full bg-indigo-500 px-1.5 ${ERP_LIST_UI_SPEC_V1.secondaryTextClass} leading-4 shadow-none hover:bg-indigo-600`}
                              title={isShipFirst
                                ? '尾款已到账，货物已发出，完成合同'
                                : '货物已发出，标记合同为已完成'}
                            >
                              <CheckCircle className="h-3 w-3" />
                              完成
                            </Button>
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

      {/* 🔥 销售合同文档预览Dialog */}
      {showDocumentPreview && selectedContract && (
        (() => {
          const templateSnapshot = selectedContract.templateSnapshot || selectedContract.template_snapshot || null;
          const templateVersion = templateSnapshot?.version || null;
          const procurementTracking = getProcurementTrackingSummary(selectedContract);
          const splitFields = deriveSalesContractSplitFields(selectedContract);
          const customerStageLabel = (() => {
            switch (splitFields.executionStatus) {
              case 'customer_confirmed':
                return '已确认';
              case 'sent_to_customer':
                return '已发送';
              case 'customer_requested_changes':
                return '要求修改';
              case 'customer_rejected':
                return '已驳回';
              default:
                return '处理中';
            }
          })();
          const procurementTimelineSteps = [
            {
              key: 'pr_created',
              label: PROCUREMENT_STATUS_COPY.created,
              active: procurementTracking.requestNumbers.length > 0,
            },
            {
              key: 'pr_allocated',
              label: PROCUREMENT_STATUS_COPY.fullyAllocated,
              active: [PROCUREMENT_STATUS_COPY.partiallyAllocated, PROCUREMENT_STATUS_COPY.fullyAllocated].includes(procurementTracking.requestStatusLabel || ''),
            },
            {
              key: 'cg_created',
              label: PROCUREMENT_STATUS_COPY.cgCreated,
              active: procurementTracking.cgCount > 0,
            },
            {
              key: 'cg_pushed',
              label: PROCUREMENT_STATUS_COPY.cgPushed,
              active: procurementTracking.pushedCgCount > 0,
            },
          ];
          const procurementCurrentAction = getProcurementCurrentActionLabel(procurementTracking);
          const rawContractData = (selectedContract.documentDataSnapshot || selectedContract.document_data_snapshot) as SalesContractData | null;
          const layoutConfig = (templateVersion?.layout_json || null) as DocumentLayoutConfig | null;
          const previewCurrency = String(
            selectedContract.currency ||
            rawContractData?.terms?.currency ||
            'USD',
          ).trim().toUpperCase() || 'USD';
          const contractData: SalesContractData | null = rawContractData
            ? {
                ...rawContractData,
                contractNo: selectedContract.contractNumber || rawContractData.contractNo || 'SC-DRAFT',
                quotationNo: selectedContract.quotationNumber || rawContractData.quotationNo,
                contractDate: selectedContract.createdAt?.split('T')[0] || rawContractData.contractDate,
                products: (rawContractData.products || []).map((product) => ({
                  ...product,
                  currency: previewCurrency,
                })),
                terms: {
                  ...rawContractData.terms,
                  currency: previewCurrency,
                },
                buyer: resolveSalesContractBuyerData({
                  customerCompany: selectedContract.customerCompany,
                  customerName: selectedContract.customerName,
                  customerAddress: selectedContract.customerAddress,
                  customerCountry: selectedContract.customerCountry,
                  contactPerson: selectedContract.contactPerson ?? selectedContract.customerName,
                  contactPhone: selectedContract.contactPhone,
                  customerEmail: selectedContract.customerEmail,
                }, selectedContract.region === 'EA' ? 'EU' : ((selectedContract.region as 'NA' | 'SA' | 'EU' | 'EA' | undefined) || rawContractData.region || 'NA')),
                seller: {
                  ...rawContractData.seller,
                  bankInfo: resolveUsdSellerBankInfo(
                    documentAdminOrg,
                    rawContractData.seller?.bankInfo,
                    rawContractData.seller?.nameEn || rawContractData.seller?.name || '',
                  ),
                },
              }
            : null;

          return (
            <StandardDocumentViewerShell
              open={showDocumentPreview}
              onClose={() => setShowDocumentPreview(false)}
              title="销售合同文档"
              subtitle={selectedContract.contractNumber}
              templateLabel={templateVersion?.version || '未绑定'}
              icon={<FileText className="h-6 w-6" />}
              headerBadges={
                <>
                  <Badge variant="outline" className="text-xs font-semibold">
                    付款模式：{getPaymentModeLabel(selectedContract.paymentMode)}
                  </Badge>
                  {selectedContract.balanceTrigger ? (
                    <Badge variant="outline" className="text-xs font-semibold">
                      触发节点：{BALANCE_TRIGGER_OPTIONS.find((option) => option.value === selectedContract.balanceTrigger)?.label || selectedContract.balanceTrigger}
                    </Badge>
                  ) : null}
                </>
              }
              actions={
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={async () => {
                      if (!contractPreviewRef.current) return;
                      const filename = generatePDFFilename('Sales_Contract', selectedContract.contractNumber || 'SC');
                      await exportToPDF(contractPreviewRef.current, filename);
                    }}
                  >
                    <FileText className="h-4 w-4" />
                    下载PDF
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={async () => {
                      if (!contractPreviewRef.current) return;
                      const filename = generatePDFFilename('Sales_Contract', selectedContract.contractNumber || 'SC');
                      await exportToPDFPrint(contractPreviewRef.current, filename);
                    }}
                  >
                    <FileText className="h-4 w-4" />
                    打印
                  </Button>
                </>
              }
            >
              {templateVersion && contractData ? (
                <div ref={contractPreviewRef}>
                  <SalesContractDocument
                    data={contractData}
                    layoutConfig={layoutConfig || undefined}
                  />
                </div>
              ) : (
                <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-700">
                  该 SC 未绑定模板中心版本快照，无法预览。
                </div>
              )}
            </StandardDocumentViewerShell>
          );
        })()
      )}
      </div>
    </div>
  );
}
