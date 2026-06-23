import React, { useMemo, useState } from 'react';
import { PurchaseOrder as PurchaseOrderType } from '../../../contexts/PurchaseOrderContext';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { TabsContent } from '../../ui/tabs';
import { WorkflowPipelineBanner, MAIN_WORKFLOW_STEPS } from '../../shared/WorkflowPipelineBanner';
import { FinanceFilterBar } from '../../finance-v2/components/FinanceFilterBar';
import {
  getErpListBatchDeletePillClass,
  getErpListBatchDeletePillStyle,
  getErpListFilterPillClass,
  getErpListFilterPillStyle,
} from '../../shared/erpListUiSpec';
import { useResizableTableColumns } from '../../shared/useResizableTableColumns';
import { extractProjectExecutionBaseline } from './purchaseOrderUtils';
import { sortDocumentFlowRefs } from '../../../utils/documentFlowRefOrder';

type ProcurementRequestsTabProps = {
  procurementRequestSearchTerm: string;
  setProcurementRequestSearchTerm: React.Dispatch<React.SetStateAction<string>>;
  selectedProcurementRequestIds: string[];
  setSelectedProcurementRequestIds: React.Dispatch<React.SetStateAction<string[]>>;
  handleBatchDeleteProcurementRequests: () => void;
  filteredProcurementRequests: PurchaseOrderType[];
  purchaseOrders: PurchaseOrderType[];
  isProcurementRequestRecord: (po: PurchaseOrderType) => boolean;
  getProcurementRequestRuntimeStatus: (po: PurchaseOrderType) => string;
  getProcurementRequestStatusText: (status: string) => string;
  normalizeCGNumberForDisplay: (value: string) => string;
  resolveInquirySourceRef: (po: PurchaseOrderType) => string;
  getRequirementNoFromPO: (po: PurchaseOrderType) => string;
  handleViewPODocument: (po: PurchaseOrderType) => void;
  openSupplierAllocationDialog: (po: PurchaseOrderType) => void;
  hasDownstreamPOForProcurementRequest: (po: PurchaseOrderType) => boolean;
  handleDeleteProcurementRequest: (po: PurchaseOrderType) => void;
  /** 分配完成后跳转到采购订单Tab */
  onSwitchToOrdersTab?: () => void;
};

type RequestFilterKey = 'all' | 'pending_assignment' | 'partially_allocated' | 'fully_allocated';

type ProcurementRequestColumnKey =
  | 'selection'
  | 'index'
  | 'date'
  | 'number'
  | 'summary'
  | 'status'
  | 'actions';

const FILTER_LABELS: Record<RequestFilterKey, string> = {
  all: '全部',
  pending_assignment: '待分配',
  partially_allocated: '部分分配',
  fully_allocated: '已分配完成',
};

const FILTER_ORDER: RequestFilterKey[] = ['all', 'pending_assignment', 'partially_allocated', 'fully_allocated'];
const CAPSULE_BUTTON_STYLE = { borderRadius: '9999px' } as const;
const PROCUREMENT_REQUEST_COLUMN_ORDER: ProcurementRequestColumnKey[] = [
  'selection',
  'index',
  'date',
  'number',
  'summary',
  'status',
  'actions',
];

const PROCUREMENT_REQUEST_COLUMN_DEFAULT_WIDTHS: Record<ProcurementRequestColumnKey, number> = {
  selection: 52,
  index: 56,
  date: 180,
  number: 240,
  summary: 170,
  status: 190,
  actions: 220,
};

const PROCUREMENT_REQUEST_COLUMN_MIN_WIDTHS: Record<ProcurementRequestColumnKey, number> = {
  selection: 52,
  index: 56,
  date: 150,
  number: 200,
  summary: 140,
  status: 160,
  actions: 180,
};

const PROCUREMENT_REQUEST_TABLE_UI_PREFERENCE_KEY = 'procurement_requests_table_column_widths_v1';

const normalizeProcurementRequestRuntimeStatus = (rawStatus: string): RequestFilterKey => {
  const status = String(rawStatus || '').trim();
  if (status === 'allocated_completed' || status === 'fully_allocated') return 'fully_allocated';
  if (status === 'partial_allocated' || status === 'partially_allocated') return 'partially_allocated';
  return 'pending_assignment';
};

const getRequestToneClasses = (status: RequestFilterKey) => {
  switch (status) {
    case 'fully_allocated':
      return 'border-emerald-300 bg-emerald-50 text-emerald-700';
    case 'partially_allocated':
      return 'border-blue-300 bg-blue-50 text-blue-700';
    default:
      return 'border-amber-300 bg-amber-50 text-amber-700';
  }
};

const resolveSourceContractNo = (po: PurchaseOrderType) => {
  return String(po.salesContractNumber || po.sourceSONumber || po.sourceRef || '').trim();
};

function buildProcurementSourceRefs(
  po: PurchaseOrderType,
  resolveInquirySourceRef: (po: PurchaseOrderType) => string,
  getRequirementNoFromPO: (po: PurchaseOrderType) => string,
) {
  const refs: Array<{ value: string; className: string }> = [];
  const seen = new Set<string>();
  const pushRef = (value: string, className: string) => {
    const normalized = String(value || '').trim();
    if (!normalized || normalized === '-' || seen.has(normalized)) return;
    seen.add(normalized);
    refs.push({ value: normalized, className });
  };

  pushRef(resolveSourceContractNo(po), 'text-blue-600');
  pushRef(resolveInquirySourceRef(po), 'text-purple-500');
  pushRef(getRequirementNoFromPO(po), 'text-slate-500');
  pushRef(po.xjNumber || (po as any).xj_number || '', 'text-emerald-600');
  pushRef(po.quotationNumber || (po as any).quotation_number || po.selectedBjId || (po as any).selected_bj_id || '', 'text-amber-600');
  pushRef(po.parentRequestPoNumber || (po as any).parent_request_po_number || '', 'text-cyan-600');

  return sortDocumentFlowRefs(refs);
}

export const ProcurementRequestsTab: React.FC<ProcurementRequestsTabProps> = ({
  procurementRequestSearchTerm,
  setProcurementRequestSearchTerm,
  selectedProcurementRequestIds,
  setSelectedProcurementRequestIds,
  onSwitchToOrdersTab,
  handleBatchDeleteProcurementRequests,
  filteredProcurementRequests,
  purchaseOrders,
  isProcurementRequestRecord,
  getProcurementRequestRuntimeStatus,
  getProcurementRequestStatusText,
  normalizeCGNumberForDisplay,
  resolveInquirySourceRef,
  getRequirementNoFromPO,
  handleViewPODocument,
  openSupplierAllocationDialog,
  hasDownstreamPOForProcurementRequest,
}) => {
  const [statusFilter, setStatusFilter] = useState<RequestFilterKey>('all');
  const [expandedSourceIds, setExpandedSourceIds] = useState<string[]>([]);
  const {
    getColumnStyle,
    renderResizeHandle,
    renderHeaderCell,
  } = useResizableTableColumns<ProcurementRequestColumnKey>({
    storageKey: PROCUREMENT_REQUEST_TABLE_UI_PREFERENCE_KEY,
    order: PROCUREMENT_REQUEST_COLUMN_ORDER,
    defaults: PROCUREMENT_REQUEST_COLUMN_DEFAULT_WIDTHS,
    minWidths: PROCUREMENT_REQUEST_COLUMN_MIN_WIDTHS,
    fixedColumns: ['selection', 'index'],
  });

  const counts = useMemo(() => {
    return filteredProcurementRequests.reduce<Record<RequestFilterKey, number>>((acc, po) => {
      const bucket = normalizeProcurementRequestRuntimeStatus(getProcurementRequestRuntimeStatus(po));
      acc.all += 1;
      acc[bucket] += 1;
      return acc;
    }, {
      all: 0,
      pending_assignment: 0,
      partially_allocated: 0,
      fully_allocated: 0,
    });
  }, [filteredProcurementRequests, getProcurementRequestRuntimeStatus]);

  const displayProcurementRequests = useMemo(() => {
    if (statusFilter === 'all') return filteredProcurementRequests;
    return filteredProcurementRequests.filter(
      (po) => normalizeProcurementRequestRuntimeStatus(getProcurementRequestRuntimeStatus(po)) === statusFilter,
    );
  }, [filteredProcurementRequests, getProcurementRequestRuntimeStatus, statusFilter]);

  const formatDateOnly = (value?: string | null) => {
    const text = String(value || '').trim();
    if (!text) return '-';
    return text.includes('T') ? text.slice(0, 10) : text;
  };

  return (
    <TabsContent value="procurement-requests" className="m-0 flex flex-1 min-h-0 flex-col">
      <div className="px-3 pt-3 pb-1">
        <WorkflowPipelineBanner
          steps={MAIN_WORKFLOW_STEPS}
          currentKey="pr"
          hint="当前：采购请求 → 分配供应商后生成采购订单(CG)"
        />
      </div>
      <div className="px-3 py-2">
        <FinanceFilterBar
          placeholder="搜索采购请求号、来源询价、需求编号..."
          value={procurementRequestSearchTerm}
          onChange={setProcurementRequestSearchTerm}
          onReset={() => setProcurementRequestSearchTerm('')}
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
                  onClick={handleBatchDeleteProcurementRequests}
                  disabled={selectedProcurementRequestIds.length === 0}
                  style={getErpListBatchDeletePillStyle(selectedProcurementRequestIds.length > 0)}
                  className={getErpListBatchDeletePillClass(selectedProcurementRequestIds.length > 0)
                    .replace('h-9', 'h-8')
                    .replace('px-4', 'px-3')}
                >
                  批量删除{selectedProcurementRequestIds.length > 0 ? ` (${selectedProcurementRequestIds.length})` : ''}
                </Button>
              </div>
            </>
          )}
        />
      </div>

      <div className="px-3 pb-2 flex flex-1 min-h-0 flex-col">
        <div className="border border-gray-200 rounded bg-white min-h-[calc(100dvh-360px)] flex flex-1 min-h-0 flex-col overflow-visible">
          {displayProcurementRequests.length === 0 && purchaseOrders.filter((po) => isProcurementRequestRecord(po)).length > 0 ? (
            <div className="border-t border-amber-200 bg-amber-50 px-3 py-2 text-[12px] leading-[1.35] text-amber-700">
              当前筛选条件下无数据，已保留采购请求记录。可清空搜索或切换筛选查看全部。
            </div>
          ) : null}
          <div className="overflow-x-auto overflow-y-visible bg-white flex-1 rounded-[inherit]">
            <table className="w-full table-fixed text-[13px]">
              <thead className="bg-gray-50 border-b border-gray-200 text-slate-600">
                <tr>
                  <th
                    className="group relative overflow-hidden px-2 py-3 text-left font-semibold"
                    style={getColumnStyle('selection')}
                  >
                    <div className="flex min-h-5 w-full items-center justify-start pr-4 text-left">
                      <input
                        type="checkbox"
                        className="h-4 w-4 cursor-pointer rounded border border-slate-400"
                        checked={selectedProcurementRequestIds.length === displayProcurementRequests.length && displayProcurementRequests.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedProcurementRequestIds(displayProcurementRequests.map((o) => o.id));
                          } else {
                            setSelectedProcurementRequestIds([]);
                          }
                        }}
                      />
                    </div>
                    {renderResizeHandle('selection', { hitAreaClassName: 'w-8 -right-4' })}
                  </th>
                  <th
                    className="group relative overflow-hidden px-2 py-3 text-left font-semibold"
                    style={getColumnStyle('index')}
                  >
                    <div className="flex min-h-5 w-full items-center justify-start pr-4 text-left">
                      <span className="block whitespace-nowrap text-[13px] font-semibold leading-4">#</span>
                    </div>
                    {renderResizeHandle('index', { hitAreaClassName: 'w-8 -right-4' })}
                  </th>
                  {renderHeaderCell('date', '日期', 'text-left', { hitAreaClassName: 'w-8 -right-4' })}
                  {renderHeaderCell('number', '编号', 'text-left')}
                  {renderHeaderCell('summary', '产品摘要', 'text-left')}
                  {renderHeaderCell('status', '分配状态', 'text-left')}
                  {renderHeaderCell('actions', '操作', 'text-left')}
                </tr>
              </thead>
              <tbody>
                {displayProcurementRequests.map((po, idx) => {
                  const runtimeStatus = normalizeProcurementRequestRuntimeStatus(getProcurementRequestRuntimeStatus(po));
                  const lockedByDownstream = hasDownstreamPOForProcurementRequest(po);
                  const projectBaseline = extractProjectExecutionBaseline(po);
                  const rawRuntimeStatus = getProcurementRequestRuntimeStatus(po);
                  const sourceRefs = buildProcurementSourceRefs(po, resolveInquirySourceRef, getRequirementNoFromPO);
                  const expanded = expandedSourceIds.includes(po.id);

                  return (
                    <tr key={po.id} className="border-b border-slate-200 align-top hover:bg-slate-50/70">
                      <td className="px-2 py-3 text-left" style={getColumnStyle('selection')}>
                        <input
                          type="checkbox"
                          className="h-4 w-4 cursor-pointer rounded border border-slate-400"
                          checked={selectedProcurementRequestIds.includes(po.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedProcurementRequestIds([...selectedProcurementRequestIds, po.id]);
                            } else {
                              setSelectedProcurementRequestIds(selectedProcurementRequestIds.filter((id) => id !== po.id));
                            }
                          }}
                        />
                    </td>
                    <td className="px-2 py-3 text-left text-slate-500" style={getColumnStyle('index')}>{idx + 1}</td>
                    <td className="px-3 py-3" style={getColumnStyle('date')}>
                      <div className="space-y-1 text-slate-900">
                        <div>
                          <span className="mr-1 text-[12px] text-slate-500">申请日期</span>
                          {formatDateOnly(
                            po.orderDate ||
                            po.createdDate ||
                            (po as any).createdAt ||
                            (po as any).updatedAt,
                          )}
                        </div>
                        <div>
                          <span className="mr-1 text-[12px] text-slate-500">要求交期</span>
                          {formatDateOnly(
                            po.requiredDate ||
                            po.expectedDate ||
                            po.expectedDeliveryDate ||
                            (po as any).expectedQuoteDate ||
                            (po as any).deliveryDate,
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3" style={getColumnStyle('number')}>
                      <div className="relative inline-block">
                          <button onClick={() => handleViewPODocument(po)} className="font-semibold text-slate-900 hover:text-slate-700 hover:underline">
                            {normalizeCGNumberForDisplay(po.poNumber || '')}
                          </button>
                        {sourceRefs.length > 0 ? (
                          <button
                            type="button"
                            onClick={() => {
                              setExpandedSourceIds((current) => (
                                current.includes(po.id)
                                  ? current.filter((id) => id !== po.id)
                                  : [...current, po.id]
                              ));
                            }}
                            className="mt-1 block text-[12px] font-semibold leading-[1.35] text-slate-500 hover:text-slate-700"
                          >
                            {expanded ? '收起关联编号' : `展开关联编号 (${sourceRefs.length})`}
                          </button>
                        ) : (
                          <div className="mt-1 text-[12px] leading-[1.35] text-slate-400">-</div>
                        )}
                        {expanded ? (
                          <div className="absolute left-0 top-full z-20 mt-2 min-w-[280px] space-y-2 rounded-lg border border-slate-200 bg-white p-3 shadow-lg">
                            {sourceRefs.map((ref) => (
                              <div key={ref.value} className={`whitespace-nowrap font-medium leading-[1.35] ${ref.className}`}>
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
                      <td className="px-3 py-3" style={getColumnStyle('summary')}>
                        <div className="font-medium text-slate-900">{po.items?.length || 0} 个产品</div>
                        <div className="mt-1 text-[12px] leading-[1.35] text-slate-500">
                          共 {(po.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0).toLocaleString()} 件
                        </div>
                      </td>
                      <td className="px-3 py-3" style={getColumnStyle('status')}>
                        <div className="flex flex-col gap-1.5">
                          <Badge className={getRequestToneClasses(runtimeStatus)}>
                            {getProcurementRequestStatusText(rawRuntimeStatus)}
                          </Badge>
                          <div className="text-[12px] leading-[1.35] text-slate-500">
                            {runtimeStatus === 'fully_allocated' ? '已满足生成CG前置条件' : runtimeStatus === 'partially_allocated' ? '仍有产品待补齐供应商' : '等待采购承接分配'}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3" style={getColumnStyle('actions')}>
                        <div className="flex flex-wrap justify-start gap-1.5">
                          <Button variant="outline" size="sm" onClick={() => handleViewPODocument(po)} style={CAPSULE_BUTTON_STYLE} className="h-8 !rounded-full border-slate-300 px-3 text-[12px] font-semibold">
                            查看
                          </Button>
                          {runtimeStatus === 'fully_allocated' ? (
                            <>
                              <span
                                className="inline-flex items-center h-8 rounded-full border border-emerald-200 bg-emerald-50 px-3 text-[12px] font-semibold text-emerald-700"
                                title="所有产品已分配供应商，采购订单(CG)已生成，可在「采购订单」Tab查看"
                              >
                                ✓ 已分配 → 生成CG
                              </span>
                              {onSwitchToOrdersTab && (
                                <Button
                                  size="sm"
                                  onClick={onSwitchToOrdersTab}
                                  style={CAPSULE_BUTTON_STYLE}
                                  className="h-8 !rounded-full bg-[#F96302] px-3 text-[12px] font-semibold text-white hover:bg-[#e05a02]"
                                  title="跳转到采购订单(CG)Tab查看已生成的采购订单"
                                >
                                  去采购订单 →
                                </Button>
                              )}
                            </>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => openSupplierAllocationDialog(po)}
                              style={CAPSULE_BUTTON_STYLE}
                              className="h-8 !rounded-full bg-slate-900 px-3 text-[12px] font-semibold text-white hover:bg-slate-800"
                              title="按产品行分配供应商，分配完成后自动生成采购订单(CG)"
                            >
                              {runtimeStatus === 'partially_allocated' ? '继续分配 → 生成CG' : '分配供应商 → 生成CG'}
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
        </div>
      </div>
    </TabsContent>
  );
};
