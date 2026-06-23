import React, { useEffect, useMemo, useState } from 'react';
import { PurchaseOrder as PurchaseOrderType } from '../../../contexts/PurchaseOrderContext';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { TabsContent } from '../../ui/tabs';
import { WorkflowPipelineBanner, MAIN_WORKFLOW_STEPS } from '../../shared/WorkflowPipelineBanner';
import { FinanceFilterBar } from '../../finance-v2/components/FinanceFilterBar';
import {
  ERP_LIST_PILL_STYLE,
  ERP_LIST_TOOL_PILL_CLASS,
  getErpListBatchDeletePillClass,
  getErpListBatchDeletePillStyle,
  getErpListFilterPillClass,
  getErpListFilterPillStyle,
} from '../../shared/erpListUiSpec';
import { extractProjectExecutionBaseline, getPOStatusConfig } from './purchaseOrderUtils';
import { derivePurchaseOrderWorkflowFields } from '../../../lib/services/purchaseOrderQuoteRequirementServices';
import { sortDocumentFlowRefs } from '../../../utils/documentFlowRefOrder';
import { renderColumnResizeHandle } from '../admin-organization-profile/peopleCenterVisuals';

type PurchaseOrdersTabProps = {
  orderSearchTerm: string;
  setOrderSearchTerm: React.Dispatch<React.SetStateAction<string>>;
  selectedOrderIds: string[];
  setSelectedOrderIds: React.Dispatch<React.SetStateAction<string[]>>;
  handleBatchDeleteOrders: () => void;
  handleCreateOrder: () => void;
  filteredOrders: PurchaseOrderType[];
  handleViewPODocument: (po: PurchaseOrderType) => void;
  handleOpenEditPO: (po: PurchaseOrderType) => void;
  handleViewComparisonForPO: (po: PurchaseOrderType) => void;
  handlePushPurchaseToSupplier: (po: PurchaseOrderType) => void;
  handleApplyBossApproval: (po: PurchaseOrderType) => void;
  handleValidateProcurementRequest: (po: PurchaseOrderType) => void;
  handleDeletePurchaseOrder: (po: PurchaseOrderType) => void;
  normalizeCGNumberForDisplay: (value: string) => string;
  resolveInquirySourceRef: (po: PurchaseOrderType) => string;
  resolveQuotationSourceRef: (po: PurchaseOrderType) => string;
  resolveSupplierInquiryRef: (po: PurchaseOrderType) => string;
  getRequirementNoFromPO: (po: PurchaseOrderType) => string;
};

type FilterKey =
  | 'all'
  | 'pr'
  | 'cg_draft'
  | 'cg_approval'
  | 'cg_ready'
  | 'cg_supplier';

type PurchaseOrderColumnKey =
  | 'selection'
  | 'index'
  | 'date'
  | 'document'
  | 'supplier'
  | 'region'
  | 'summary'
  | 'approval'
  | 'execution'
  | 'actions';

const FILTER_LABELS: Record<FilterKey, string> = {
  all: '全部',
  pr: 'PR处理中',
  cg_draft: 'CG草稿',
  cg_approval: 'CG待审批',
  cg_ready: 'CG可下推',
  cg_supplier: 'CG执行中',
};

const FILTER_ORDER: FilterKey[] = ['all', 'pr', 'cg_draft', 'cg_approval', 'cg_ready', 'cg_supplier'];
const CAPSULE_BUTTON_STYLE = { borderRadius: '9999px' } as const;

const PURCHASE_ORDER_TABLE_UI_PREFERENCE_KEY = 'purchase_orders_table_column_widths_v1';
const PURCHASE_ORDER_COLUMN_ORDER: PurchaseOrderColumnKey[] = [
  'selection',
  'index',
  'date',
  'document',
  'supplier',
  'region',
  'summary',
  'approval',
  'execution',
  'actions',
];

const PURCHASE_ORDER_COLUMN_MIN_WIDTHS: Record<PurchaseOrderColumnKey, number> = {
  selection: 44,
  index: 52,
  date: 1,
  document: 1,
  supplier: 1,
  region: 1,
  summary: 1,
  approval: 1,
  execution: 1,
  actions: 1,
};

const PURCHASE_ORDER_TABLE_DEFAULT_WIDTHS: Record<PurchaseOrderColumnKey, number> = {
  selection: 44,
  index: 56,
  date: 240,
  document: 320,
  supplier: 330,
  region: 84,
  summary: 170,
  approval: 160,
  execution: 230,
  actions: 420,
};

const mergeStoredPurchaseOrderColumnWidths = (
  stored: Partial<Record<PurchaseOrderColumnKey, number>> | null | undefined,
) => {
  const next = { ...PURCHASE_ORDER_TABLE_DEFAULT_WIDTHS };
  PURCHASE_ORDER_COLUMN_ORDER.forEach((key) => {
    const candidate = Number(stored?.[key]);
    if (Number.isFinite(candidate) && candidate > 0) {
      next[key] = Math.max(PURCHASE_ORDER_COLUMN_MIN_WIDTHS[key], Math.round(candidate));
    }
  });
  return next;
};

function classifyOrder(po: PurchaseOrderType): Exclude<FilterKey, 'all'> {
  const workflow = derivePurchaseOrderWorkflowFields(po);
  if (workflow.documentType === 'PR') return 'pr';
  if (workflow.approvalStatus === 'draft') return 'cg_draft';
  if (['pending_l1', 'pending_l2'].includes(String(workflow.approvalStatus || ''))) return 'cg_approval';
  if (workflow.executionStatus === 'approved') return 'cg_ready';
  return 'cg_supplier';
}

function getFinanceToneBadgeClasses(tone: 'default' | 'ok' | 'warn' | 'danger') {
  switch (tone) {
    case 'ok':
      return 'border-emerald-300 bg-emerald-50 text-emerald-700';
    case 'warn':
      return 'border-amber-300 bg-amber-50 text-amber-700';
    case 'danger':
      return 'border-red-300 bg-red-50 text-red-700';
    default:
      return 'border-slate-300 bg-slate-50 text-slate-700';
  }
}

function getStatusPresentation(po: PurchaseOrderType): {
  label: string;
  tone: 'default' | 'ok' | 'warn' | 'danger';
  stage: string;
} {
  const workflow = derivePurchaseOrderWorkflowFields(po);
  const reqStatus = String(po.procurementRequestStatus || '').trim();
  const executionStatus = String(po.executionStatus || workflow.executionStatus || '').trim();
  const prValidationStatus = String(po.prValidationStatus || '').trim();

  if (workflow.documentType === 'PR') {
    switch (workflow.executionStatus) {
      case 'pending_assignment':
        return { label: '待分配供应商', tone: 'warn', stage: 'PR阶段' };
      case 'partially_allocated':
        return { label: '部分已分配', tone: 'warn', stage: 'PR阶段' };
      case 'fully_allocated':
        return { label: '已分配完成', tone: 'ok', stage: 'PR阶段' };
      default:
        return { label: '采购请求处理中', tone: 'default', stage: 'PR阶段' };
    }
  }

  if (['pending_l1', 'pending_l2'].includes(String(workflow.approvalStatus || ''))) {
    return {
      label: workflow.approvalStatus === 'pending_l2' ? '待 CEO 二审' : '待采购主管审核',
      tone: 'warn',
      stage: 'CG审批',
    };
  }

  if (workflow.approvalStatus === 'rejected') {
    return { label: '审核驳回', tone: 'danger', stage: 'CG审批' };
  }

  if (workflow.approvalStatus === 'draft') {
    return {
      label: 'CG草稿·待提交审核',
      tone: 'default',
      stage: 'CG草稿',
    };
  }

  if (reqStatus === 'pushed_supplier' && executionStatus) {
    switch (executionStatus) {
      case 'supplier_pending_confirmation':
        return { label: '待供应商确认', tone: 'warn', stage: 'CG执行' };
      case 'supplier_confirmed':
        return { label: '供应商已确认', tone: 'ok', stage: 'CG执行' };
      case 'pre_production_sample_pending':
        return { label: '待产前样', tone: 'default', stage: '产前样' };
      case 'pre_production_sample_sent':
        return { label: '样品已寄出', tone: 'default', stage: '产前样' };
      case 'production_in_progress':
        return { label: '生产中', tone: 'ok', stage: '生产执行' };
      case 'supplier_self_inspection_submitted':
        return { label: '已提交自检', tone: 'default', stage: '质检准备' };
      case 'qc_pending':
        return { label: '待QC验货', tone: 'warn', stage: 'QC阶段' };
      case 'qc_passed':
        return { label: 'QC通过', tone: 'ok', stage: 'QC阶段' };
      case 'qc_failed':
        return { label: 'QC不通过', tone: 'danger', stage: 'QC阶段' };
      case 'finished_goods_ready':
        return { label: '完货待出运', tone: 'ok', stage: '发运准备' };
      case 'awaiting_loading':
        return { label: '待装柜', tone: 'warn', stage: '发运准备' };
      case 'loaded':
        return { label: '已装柜', tone: 'ok', stage: '发运准备' };
      default:
        break;
    }
  }

  if (workflow.executionStatus === 'approved' || reqStatus === 'approved_boss') {
    return { label: '审核通过·可下推', tone: 'ok', stage: 'CG审批' };
  }

  return getPOStatusConfig(po.status as any) ?? { label: '待确认', tone: 'default', stage: 'CG状态' } as any;
}

function getApprovalPresentation(po: PurchaseOrderType): {
  label: string;
  tone: 'default' | 'ok' | 'warn' | 'danger';
} {
  const workflow = derivePurchaseOrderWorkflowFields(po);

  if (workflow.documentType === 'PR') {
    return { label: 'PR无需审批', tone: 'default' };
  }

  switch (String(workflow.approvalStatus || '').trim()) {
    case 'pending_l1':
      return { label: '待采购主管审核', tone: 'warn' };
    case 'pending_l2':
      return { label: '待 CEO 二审', tone: 'warn' };
    case 'approved':
      return { label: '审批通过', tone: 'ok' };
    case 'rejected':
      return { label: '审核驳回', tone: 'danger' };
    case 'draft':
    default:
      return { label: 'CG草稿', tone: 'default' };
  }
}

function getExecutionPresentation(po: PurchaseOrderType): {
  label: string;
  detail: string;
  tone: 'default' | 'ok' | 'warn' | 'danger';
} {
  const workflow = derivePurchaseOrderWorkflowFields(po);
  const reqStatus = String(po.procurementRequestStatus || '').trim();
  const executionStatus = String(po.executionStatus || workflow.executionStatus || '').trim();
  const prValidationStatus = String(po.prValidationStatus || '').trim();

  if (workflow.documentType === 'PR') {
    switch (workflow.executionStatus) {
      case 'pending_assignment':
        return { label: '待分配供应商', detail: 'PR阶段', tone: 'warn' };
      case 'partially_allocated':
        return { label: '部分已分配', detail: 'PR阶段', tone: 'warn' };
      case 'fully_allocated':
        return { label: '已分配完成', detail: 'PR阶段', tone: 'ok' };
      default:
        return { label: '采购请求处理中', detail: 'PR阶段', tone: 'default' };
    }
  }

  if (workflow.approvalStatus === 'draft') {
    return prValidationStatus === 'passed'
      ? { label: '待提交审核', detail: 'CG审批前', tone: 'default' }
      : { label: '待比价依据校验', detail: 'CG审批前', tone: 'warn' };
  }

  if (workflow.approvalStatus === 'approved' && reqStatus !== 'pushed_supplier') {
    return { label: '待下推供应商', detail: 'CG审批后', tone: 'ok' };
  }

  if (reqStatus === 'pushed_supplier' && executionStatus) {
    switch (executionStatus) {
      case 'supplier_pending_confirmation':
        return { label: '待供应商确认', detail: 'CG执行', tone: 'warn' };
      case 'supplier_confirmed':
        return { label: '供应商已确认', detail: 'CG执行', tone: 'ok' };
      case 'pre_production_sample_pending':
      case 'pre_production_sample_sent':
        return { label: '产前样处理中', detail: '产前样', tone: 'default' };
      case 'production_in_progress':
        return { label: '生产中', detail: '生产执行', tone: 'ok' };
      case 'supplier_self_inspection_submitted':
        return { label: '已提交自检', detail: '质检准备', tone: 'default' };
      case 'qc_pending':
        return { label: '待QC验货', detail: 'QC阶段', tone: 'warn' };
      case 'qc_passed':
        return { label: 'QC通过', detail: 'QC阶段', tone: 'ok' };
      case 'qc_failed':
        return { label: 'QC不通过', detail: 'QC阶段', tone: 'danger' };
      case 'finished_goods_ready':
        return { label: '完货待出运', detail: '发运准备', tone: 'ok' };
      case 'awaiting_loading':
        return { label: '待装柜', detail: '发运准备', tone: 'warn' };
      case 'loaded':
        return { label: '已装柜', detail: '发运准备', tone: 'ok' };
      default:
        break;
    }
  }

  const fallback = getStatusPresentation(po);
  return {
    label: fallback.label,
    detail: fallback.stage,
    tone: fallback.tone,
  };
}

function resolveParentRequestNo(po: PurchaseOrderType): string {
  return String(po.parentRequestPoNumber || (po as any).parent_request_po_number || '').trim();
}

function resolveSourceContractNo(po: PurchaseOrderType): string {
  return String(po.salesContractNumber || po.sourceSONumber || po.sourceRef || '').trim();
}

function resolveSourceXJNo(
  po: PurchaseOrderType,
  resolveSupplierInquiryRef: (po: PurchaseOrderType) => string,
): string {
  return String(
    resolveSupplierInquiryRef(po) ||
    po.xjNumber ||
    (po as any).xj_number ||
    '',
  ).trim();
}

function resolveSourceBJNo(
  po: PurchaseOrderType,
  resolveQuotationSourceRef: (po: PurchaseOrderType) => string,
): string {
  const poAny = po as any;
  return String(
    resolveQuotationSourceRef(po) ||
    po.quotationNumber ||
    poAny.quotation_number ||
    poAny.selectedQuote?.quotationNumber ||
    poAny.selectedQuote?.quotationNo ||
    poAny.selectedQuote?.quoteNo ||
    poAny.selectedQuote?.bjNumber ||
    po.selectedBjId ||
    poAny.selected_bj_id ||
    '',
  ).trim();
}

function buildSourceDocumentRefs(
  po: PurchaseOrderType,
  resolveInquirySourceRef: (po: PurchaseOrderType) => string,
  resolveQuotationSourceRef: (po: PurchaseOrderType) => string,
  resolveSupplierInquiryRef: (po: PurchaseOrderType) => string,
  getRequirementNoFromPO: (po: PurchaseOrderType) => string,
) {
  const workflow = derivePurchaseOrderWorkflowFields(po);
  const refs: Array<{ value: string; className: string }> = [];
  const seen = new Set<string>();
  const pushRef = (value: string, className: string) => {
    const normalized = String(value || '').trim();
    if (!normalized || seen.has(normalized)) return;
    seen.add(normalized);
    refs.push({ value: normalized, className });
  };

  if (workflow.documentType === 'CG') {
    pushRef(resolveParentRequestNo(po), 'text-cyan-600');
  }
  pushRef(resolveSourceXJNo(po, resolveSupplierInquiryRef), 'text-emerald-600');
  pushRef(resolveSourceBJNo(po, resolveQuotationSourceRef), 'text-amber-600');
  pushRef(resolveSourceContractNo(po), 'text-blue-600');
  pushRef(resolveInquirySourceRef(po), 'text-purple-500');
  pushRef(getRequirementNoFromPO(po), 'text-slate-500');

  return sortDocumentFlowRefs(refs);
}

export const PurchaseOrdersTab: React.FC<PurchaseOrdersTabProps> = ({
  orderSearchTerm,
  setOrderSearchTerm,
  selectedOrderIds,
  setSelectedOrderIds,
  handleBatchDeleteOrders,
  handleCreateOrder,
  filteredOrders,
  handleViewPODocument,
  handleOpenEditPO,
  handleViewComparisonForPO,
  handlePushPurchaseToSupplier,
  handleApplyBossApproval,
  handleValidateProcurementRequest,
  normalizeCGNumberForDisplay,
  resolveInquirySourceRef,
  resolveQuotationSourceRef,
  resolveSupplierInquiryRef,
  getRequirementNoFromPO,
}) => {
  const [statusFilter, setStatusFilter] = useState<FilterKey>('all');
  const [expandedSourceIds, setExpandedSourceIds] = useState<string[]>([]);
  const purchaseOrderColumnResizeRef = React.useRef<{
    key: PurchaseOrderColumnKey;
    startX: number;
    startWidth: number;
  } | null>(null);
  const [purchaseOrderColumnWidths, setPurchaseOrderColumnWidths] = useState<Record<PurchaseOrderColumnKey, number>>(() => {
    if (typeof window === 'undefined') return { ...PURCHASE_ORDER_TABLE_DEFAULT_WIDTHS };
    try {
      const raw = window.localStorage.getItem(PURCHASE_ORDER_TABLE_UI_PREFERENCE_KEY);
      return mergeStoredPurchaseOrderColumnWidths(raw ? JSON.parse(raw) : null);
    } catch {
      return { ...PURCHASE_ORDER_TABLE_DEFAULT_WIDTHS };
    }
  });

  const counts = useMemo(() => {
    return filteredOrders.reduce<Record<FilterKey, number>>((acc, po) => {
      const bucket = classifyOrder(po);
      acc.all += 1;
      acc[bucket] += 1;
      return acc;
    }, {
      all: 0,
      pr: 0,
      cg_draft: 0,
      cg_approval: 0,
      cg_ready: 0,
      cg_supplier: 0,
    });
  }, [filteredOrders]);

  const displayOrders = useMemo(() => {
    if (statusFilter === 'all') return filteredOrders;
    return filteredOrders.filter((po) => classifyOrder(po) === statusFilter);
  }, [filteredOrders, statusFilter]);

  const formatDateOnly = (value?: string | null) => {
    const text = String(value || '').trim();
    if (!text) return '-';
    return text.includes('T') ? text.slice(0, 10) : text;
  };

  useEffect(() => {
    try {
      window.localStorage.setItem(
        PURCHASE_ORDER_TABLE_UI_PREFERENCE_KEY,
        JSON.stringify(purchaseOrderColumnWidths),
      );
    } catch {}
  }, [purchaseOrderColumnWidths]);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!purchaseOrderColumnResizeRef.current) return;
      const { key, startX, startWidth } = purchaseOrderColumnResizeRef.current;
      const nextWidth = Math.max(
        PURCHASE_ORDER_COLUMN_MIN_WIDTHS[key],
        Math.round(startWidth + (event.clientX - startX)),
      );
      setPurchaseOrderColumnWidths((current) => (
        current[key] === nextWidth ? current : { ...current, [key]: nextWidth }
      ));
    };

    const stopResize = () => {
      purchaseOrderColumnResizeRef.current = null;
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

  const purchaseOrderColumnWidthTotal = useMemo(
    () => PURCHASE_ORDER_COLUMN_ORDER.reduce((sum, key) => sum + purchaseOrderColumnWidths[key], 0),
    [purchaseOrderColumnWidths],
  );

  const getPurchaseOrderColumnStyle = (key: PurchaseOrderColumnKey) => {
    if (key === 'selection' || key === 'index') {
      const width = purchaseOrderColumnWidths[key];
      return {
        width,
        minWidth: width,
        maxWidth: width,
      } as const;
    }
    const ratio = purchaseOrderColumnWidthTotal > 0
      ? purchaseOrderColumnWidths[key] / purchaseOrderColumnWidthTotal
      : 1 / PURCHASE_ORDER_COLUMN_ORDER.length;
    const width = `${(ratio * 100).toFixed(4)}%`;
    return {
      width,
      minWidth: 0,
      maxWidth: width,
    } as const;
  };

  const startPurchaseOrderColumnResize = (
    key: PurchaseOrderColumnKey,
    event: React.MouseEvent<HTMLDivElement>,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    purchaseOrderColumnResizeRef.current = {
      key,
      startX: event.clientX,
      startWidth: purchaseOrderColumnWidths[key],
    };
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  const shrinkPurchaseOrderColumnToMinimum = (
    key: PurchaseOrderColumnKey,
    event: React.MouseEvent<HTMLDivElement>,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    setPurchaseOrderColumnWidths((current) => (
      current[key] === PURCHASE_ORDER_COLUMN_MIN_WIDTHS[key]
        ? current
        : { ...current, [key]: PURCHASE_ORDER_COLUMN_MIN_WIDTHS[key] }
    ));
  };

  const renderPurchaseOrderColumnResizeHandle = (
    key: PurchaseOrderColumnKey,
    options?: {
      showKnob?: boolean;
      hitAreaClassName?: string;
      lineHoverClassName?: string;
      knobHoverClassName?: string;
    },
  ) =>
    renderColumnResizeHandle(
      key,
      startPurchaseOrderColumnResize,
      shrinkPurchaseOrderColumnToMinimum,
      {
        lineHoverClassName: 'group-hover:bg-slate-400',
        ...options,
      },
    );

  const renderPurchaseOrderHeaderCell = (
    key: PurchaseOrderColumnKey,
    label: string,
    className = '',
  ) => {
    const alignClass = className.includes('text-center')
      ? 'justify-center text-center'
      : className.includes('text-right')
        ? 'justify-end text-right'
        : 'justify-start text-left';

    return (
      <th
        className={`group relative overflow-hidden px-3 py-3 font-semibold ${className}`.trim()}
        style={getPurchaseOrderColumnStyle(key)}
      >
        <div className={`flex min-h-5 w-full items-center pr-4 ${alignClass}`}>
          <span className="block whitespace-nowrap text-[13px] font-semibold leading-4">
            {label}
          </span>
        </div>
        {renderPurchaseOrderColumnResizeHandle(key)}
      </th>
    );
  };

  return (
    <TabsContent value="orders" className="m-0 flex flex-1 min-h-0 flex-col">
      <div className="px-3 pt-3 pb-1">
        <WorkflowPipelineBanner
          steps={MAIN_WORKFLOW_STEPS}
          currentKey="cg"
          hint="当前：采购订单 → 等待供应商确认生产"
        />
      </div>
      <div className="px-3 py-2">
        <FinanceFilterBar
          placeholder="搜索采购单号、供应商、需求编号..."
          value={orderSearchTerm}
          onChange={setOrderSearchTerm}
          onReset={() => setOrderSearchTerm('')}
          containerClassName="border-0 bg-transparent px-0 py-0"
          hideDefaultActions
          extra={(
            <>
              <div className="flex flex-wrap items-center gap-2">
                {FILTER_ORDER.map((value) => {
                  return (
                    <Button
                      key={value}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setStatusFilter(value)}
                      style={{
                        ...getErpListFilterPillStyle(statusFilter === value),
                        ...CAPSULE_BUTTON_STYLE,
                      }}
                      className={getErpListFilterPillClass(statusFilter === value)
                        .replace('h-9', 'h-8')
                        .replace('px-4', 'px-3')
                        .replace('rounded-xl', '!rounded-full')}
                    >
                      {FILTER_LABELS[value]} ({counts[value]})
                    </Button>
                  );
                })}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleBatchDeleteOrders}
                  disabled={selectedOrderIds.length === 0}
                  style={getErpListBatchDeletePillStyle(selectedOrderIds.length > 0)}
                  className={getErpListBatchDeletePillClass(selectedOrderIds.length > 0)
                    .replace('h-9', 'h-8')
                    .replace('px-4', 'px-3')}
                >
                  批量删除{selectedOrderIds.length > 0 ? ` (${selectedOrderIds.length})` : ''}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  style={ERP_LIST_PILL_STYLE}
                  className={ERP_LIST_TOOL_PILL_CLASS}
                  onClick={handleCreateOrder}
                >
                  新建采购单
                </Button>
              </div>
            </>
          )}
        />
      </div>

      <div className="px-3 pb-2 flex flex-1 min-h-0 flex-col">
        <div className="border border-gray-200 rounded bg-white flex flex-1 min-h-0 flex-col overflow-visible min-h-[calc(100dvh-360px)]">
        <div className="overflow-x-hidden overflow-y-visible bg-white flex-1 rounded-[inherit] min-h-0">
          <table className="w-full table-fixed text-[13px]">
            <thead className="bg-gray-50 border-b border-gray-200 text-slate-600">
              <tr>
                <th
                  className="group relative overflow-hidden px-2 py-3 text-left font-semibold"
                  style={getPurchaseOrderColumnStyle('selection')}
                >
                  <div className="flex min-h-5 w-full items-center justify-start pr-4 text-left">
                    <input
                      type="checkbox"
                      className="h-4 w-4 cursor-pointer rounded border border-slate-400"
                      checked={selectedOrderIds.length === displayOrders.length && displayOrders.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedOrderIds(displayOrders.map((o) => o.id));
                        } else {
                          setSelectedOrderIds([]);
                        }
                      }}
                    />
                  </div>
                  {renderPurchaseOrderColumnResizeHandle('selection', {
                    hitAreaClassName: 'w-8 -right-4',
                  })}
                </th>
                <th
                  className="group relative overflow-hidden px-2 py-3 font-semibold text-left"
                  style={getPurchaseOrderColumnStyle('index')}
                >
                  <div className="flex min-h-5 w-full items-center justify-start pr-4 text-left">
                    <span className="block whitespace-nowrap text-[13px] font-semibold leading-4">#</span>
                  </div>
                  {renderPurchaseOrderColumnResizeHandle('index', {
                    hitAreaClassName: 'w-8 -right-4',
                  })}
                </th>
                <th
                  className="group relative overflow-hidden px-3 py-3 font-semibold text-left"
                  style={getPurchaseOrderColumnStyle('date')}
                >
                  <div className="flex min-h-5 w-full items-center justify-start pr-4 text-left">
                    <span className="block whitespace-nowrap text-[13px] font-semibold leading-4">日期</span>
                  </div>
                  {renderPurchaseOrderColumnResizeHandle('date', {
                    hitAreaClassName: 'w-8 -right-4',
                  })}
                </th>
                {renderPurchaseOrderHeaderCell('document', '单据')}
                {renderPurchaseOrderHeaderCell('supplier', '供应商')}
                {renderPurchaseOrderHeaderCell('region', '区域')}
                {renderPurchaseOrderHeaderCell('summary', '产品摘要')}
                {renderPurchaseOrderHeaderCell('approval', '审批状态')}
                {renderPurchaseOrderHeaderCell('execution', '执行状态')}
                {renderPurchaseOrderHeaderCell('actions', '操作')}
              </tr>
            </thead>
            <tbody>
              {displayOrders.map((po, idx) => {
                const workflow = derivePurchaseOrderWorkflowFields(po);
                const reqStatus = String(po.procurementRequestStatus || '');
                const executionStatus = String(po.executionStatus || workflow.executionStatus || '');
                const prValidationStatus = String(po.prValidationStatus || '').trim();
                const projectBaseline = extractProjectExecutionBaseline(po);
                const approvalPresentation = getApprovalPresentation(po);
                const executionPresentation = getExecutionPresentation(po);
                const sourceDocumentRefs = buildSourceDocumentRefs(
                  po,
                  resolveInquirySourceRef,
                  resolveQuotationSourceRef,
                  resolveSupplierInquiryRef,
                  getRequirementNoFromPO,
                );
                const sourceRefsExpanded = expandedSourceIds.includes(po.id);
                const regionLabel =
                  po.region === 'North America' || po.region === 'NA'
                    ? 'NA'
                    : po.region === 'South America' || po.region === 'SA'
                      ? 'SA'
                      : po.region === 'Europe & Africa' || po.region === 'EA'
                        ? 'EA'
                        : '-';

                const canPushToSupplier = workflow.documentType === 'CG' && workflow.approvalStatus === 'approved' && reqStatus !== 'pushed_supplier';
                const pushedToSupplier = reqStatus === 'pushed_supplier';
                const isPendingApproval = workflow.documentType === 'CG' && ['pending_l1', 'pending_l2'].includes(String(workflow.approvalStatus || ''));
                const isApproved = workflow.documentType === 'CG' && workflow.approvalStatus === 'approved';
                const isDraftCG = workflow.documentType === 'CG' && workflow.approvalStatus === 'draft';
                const isRejectedCG = workflow.documentType === 'CG' && workflow.approvalStatus === 'rejected';
                const hasValidationPassed = workflow.documentType === 'CG' && prValidationStatus === 'passed';
                const canValidate = workflow.documentType === 'CG' && !pushedToSupplier && (isDraftCG || isRejectedCG) && !hasValidationPassed;
                const canApplyApproval = workflow.documentType === 'CG' && !pushedToSupplier && hasValidationPassed && (isDraftCG || isRejectedCG);

                return (
                  <tr key={po.id} className="border-b border-slate-200 align-top hover:bg-slate-50/70">
                    <td className="px-2 py-3 text-left" style={getPurchaseOrderColumnStyle('selection')}>
                      <div className="flex w-full items-center justify-start pr-4 text-left">
                        <input
                          type="checkbox"
                          className="h-4 w-4 cursor-pointer rounded border border-slate-400"
                          checked={selectedOrderIds.includes(po.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedOrderIds([...selectedOrderIds, po.id]);
                            } else {
                              setSelectedOrderIds(selectedOrderIds.filter((id) => id !== po.id));
                            }
                          }}
                        />
                      </div>
                    </td>
                    <td className="px-2 py-3 text-left text-slate-500" style={getPurchaseOrderColumnStyle('index')}>
                      <div className="flex w-full items-center justify-start pr-4 text-left">
                        {idx + 1}
                      </div>
                    </td>
                    <td className="px-3 py-3" style={getPurchaseOrderColumnStyle('date')}>
                      <div className="space-y-1 text-slate-900">
                        <div className="whitespace-nowrap">
                          <span className="mr-1 text-[12px] text-slate-500">单据日期</span>
                          {formatDateOnly(
                            po.orderDate ||
                            po.createdDate ||
                            (po as any).createdAt ||
                            (po as any).updatedAt,
                          )}
                        </div>
                        <div className="whitespace-nowrap">
                          <span className="mr-1 text-[12px] text-slate-500">要求交期</span>
                          {formatDateOnly(
                            po.expectedDate ||
                            po.expectedDeliveryDate ||
                            (po as any).documentDataSnapshot?.requiredDeliveryDate,
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3" style={getPurchaseOrderColumnStyle('document')}>
                      <div className="relative inline-block">
                        <button
                          onClick={() => handleViewPODocument(po)}
                          className="block whitespace-nowrap font-semibold text-slate-900 hover:text-slate-700 hover:underline"
                        >
                          {normalizeCGNumberForDisplay(po.poNumber)}
                        </button>
                        {sourceDocumentRefs.length > 0 ? (
                          <button
                            type="button"
                            onClick={() => {
                              setExpandedSourceIds((current) =>
                                current.includes(po.id)
                                  ? current.filter((id) => id !== po.id)
                                  : [...current, po.id],
                              );
                            }}
                            className="mt-1 block text-[12px] font-semibold leading-[1.35] text-slate-500 hover:text-slate-700"
                          >
                            {sourceRefsExpanded ? '收起关联编号' : `展开关联编号 (${sourceDocumentRefs.length})`}
                          </button>
                        ) : (
                          <div className="mt-1 text-[12px] leading-[1.35] text-slate-400">-</div>
                        )}
                        {sourceRefsExpanded ? (
                            <div className="absolute left-0 top-full z-20 mt-2 min-w-[280px] space-y-2 rounded-lg border border-slate-200 bg-white p-3 shadow-lg text-[12px] leading-4">
                              {sourceDocumentRefs.map((ref) => (
                                <div
                                  key={ref.value}
                                  className={`whitespace-nowrap font-mono ${ref.className}`}
                                  title={ref.value}
                                >
                                  {ref.value}
                                </div>
                              ))}
                              {projectBaseline ? (
                                <div className="border-t border-slate-100 pt-2 text-[11px] leading-[1.35] text-indigo-600">
                                  {projectBaseline.projectCode ? `${projectBaseline.projectCode} · ` : ''}
                                  {projectBaseline.projectName || 'Project'} / Rev {projectBaseline.projectRevisionCode || '-'}
                                </div>
                              ) : null}
                            </div>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-3 py-3" style={getPurchaseOrderColumnStyle('supplier')}>
                      <div className="whitespace-nowrap font-medium text-slate-900">{po.supplierName || '待定供应商'}</div>
                    </td>
                    <td className="px-3 py-3" style={getPurchaseOrderColumnStyle('region')}>
                      <Badge className="border-slate-300 bg-slate-50 text-slate-700">{regionLabel}</Badge>
                    </td>
                    <td className="px-3 py-3" style={getPurchaseOrderColumnStyle('summary')}>
                      {po.items && po.items.length > 0 ? (
                        <>
                          <div className="font-medium text-slate-900">{po.items.length} 个产品</div>
                          <div className="mt-1 text-[12px] leading-[1.35] text-slate-500">
                            共 {po.items.reduce((sum, item) => sum + item.quantity, 0).toLocaleString()} 件
                          </div>
                        </>
                      ) : (
                        <div className="text-slate-400">待补充明细</div>
                      )}
                    </td>
                    <td className="px-3 py-3 align-top" style={getPurchaseOrderColumnStyle('approval')}>
                      <div className="flex flex-col items-start gap-1.5">
                        <Badge className={getFinanceToneBadgeClasses(approvalPresentation.tone)}>
                          {approvalPresentation.label}
                        </Badge>
                        {prValidationStatus === 'passed' ? (
                          <div className="text-[12px] leading-[1.35] text-emerald-600">比价依据校验已通过</div>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-3 py-3 align-top" style={getPurchaseOrderColumnStyle('execution')}>
                      <div className="flex flex-col items-start gap-1.5">
                        <Badge className={getFinanceToneBadgeClasses(executionPresentation.tone)}>
                          {executionPresentation.label}
                        </Badge>
                        <div className="text-[12px] leading-[1.35] text-slate-500">{executionPresentation.detail}</div>
                      </div>
                    </td>
                    <td className="px-3 py-3 align-top" style={getPurchaseOrderColumnStyle('actions')}>
                      <div className="flex flex-wrap items-center justify-start gap-1.5">
                        <Button variant="outline" size="sm" style={CAPSULE_BUTTON_STYLE} className="h-8 !rounded-full border-slate-300 px-3 text-[12px] font-semibold" onClick={() => handleViewPODocument(po)}>
                          查看
                        </Button>
                        <Button variant="outline" size="sm" style={CAPSULE_BUTTON_STYLE} className="h-8 !rounded-full border-slate-300 px-3 text-[12px] font-semibold" onClick={() => handleOpenEditPO(po)}>
                          编辑
                        </Button>
                        {workflow.documentType === 'CG' ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewComparisonForPO(po)}
                            style={CAPSULE_BUTTON_STYLE}
                            className="h-8 !rounded-full border-emerald-200 px-3 text-[12px] font-semibold text-emerald-700 hover:bg-emerald-50"
                          >
                            查看比价
                          </Button>
                        ) : null}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePushPurchaseToSupplier(po)}
                          disabled={!canPushToSupplier}
                          style={CAPSULE_BUTTON_STYLE}
                          className={`h-8 !rounded-full px-3 text-[12px] font-semibold ${
                            pushedToSupplier
                              ? 'border-slate-300 bg-slate-200 text-slate-600'
                              : canPushToSupplier
                                ? 'border-blue-200 text-blue-700 hover:bg-blue-50'
                                : 'border-slate-200 text-slate-400'
                          }`}
                          title={
                            pushedToSupplier
                              ? '已下推给供应商'
                              : canPushToSupplier
                                ? '下推供应商'
                                : '需先完成审批后才可下推'
                          }
                        >
                          {pushedToSupplier ? '已下推供应商' : '下推供应商'}
                        </Button>
                        {canValidate ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              handleValidateProcurementRequest(po);
                            }}
                            style={CAPSULE_BUTTON_STYLE}
                            className="h-8 !rounded-full border-sky-200 px-3 text-[12px] font-semibold text-sky-700 hover:bg-sky-50"
                          >
                            比价依据校验
                          </Button>
                        ) : null}
                        {!pushedToSupplier ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              handleApplyBossApproval(po);
                            }}
                            disabled={!canApplyApproval && !isPendingApproval && !isApproved}
                            style={CAPSULE_BUTTON_STYLE}
                            className={`h-8 !rounded-full px-3 text-[12px] font-semibold ${
                              isPendingApproval
                                ? 'border-amber-200 bg-amber-50 text-amber-600'
                                : isApproved
                                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                    : canApplyApproval
                                      ? 'border-amber-200 text-amber-700 hover:bg-amber-50'
                                      : 'border-slate-200 text-slate-400'
                            }`}
                            title={
                              isPendingApproval
                                ? '该采购单已进入审核流程'
                                : isApproved
                                  ? '该采购单已审核通过'
                                  : canApplyApproval
                                    ? '提交采购审核'
                                    : '请先完成比价依据校验'
                            }
                          >
                            {isPendingApproval ? '审核中' : isApproved ? '已审核' : '申请审核'}
                          </Button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        </div>
      </div>
    </TabsContent>
  );
};
