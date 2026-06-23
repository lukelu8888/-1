import React, { useMemo, useState } from 'react';
import { Search, RefreshCw, FileText } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { TabsContent } from '../../ui/tabs';
import { saveSupplierQuotation } from '../../../utils/createQuotationFromXJ';
import {
  ERP_LIST_PILL_STYLE,
  ERP_LIST_TOOL_PILL_CLASS,
  ERP_LIST_UI_SPEC_V1,
  getErpListBatchDeletePillClass,
  getErpListBatchDeletePillStyle,
  getErpListFilterPillClass,
  getErpListFilterPillStyle,
} from '../../shared/erpListUiSpec';
import { useResizableTableColumns } from '../../shared/useResizableTableColumns';

type SupplierQuotationsTabProps = {
  supplierQuotations: any[];
  quotationSearchTerm: string;
  setQuotationSearchTerm: React.Dispatch<React.SetStateAction<string>>;
  loadSupplierQuotationsFromApi: () => Promise<void>;
  selectedQuotationIds: string[];
  setSelectedQuotationIds: React.Dispatch<React.SetStateAction<string[]>>;
  handleBatchDeleteQuotations: () => void;
  filteredQuotations: any[];
  setSelectedSupplierQuotation: (q: any) => void;
  setShowSupplierQuotationDialog: (show: boolean) => void;
  applyLocalQuotationStatus: (id: string, status: 'accepted' | 'rejected') => void;
  setAcceptedQuotationNo: (no: string) => void;
  setShowFeedbackReminderDialog: (show: boolean) => void;
};

type SupplierQuotationColumnKey =
  | 'selection'
  | 'index'
  | 'date'
  | 'number'
  | 'supplier'
  | 'amount'
  | 'products'
  | 'status'
  | 'actions';

const SUPPLIER_QUOTATION_COLUMN_ORDER: SupplierQuotationColumnKey[] = [
  'selection',
  'index',
  'date',
  'number',
  'supplier',
  'amount',
  'products',
  'status',
  'actions',
];

const SUPPLIER_QUOTATION_COLUMN_DEFAULT_WIDTHS: Record<SupplierQuotationColumnKey, number> = {
  selection: 52,
  index: 56,
  date: 160,
  number: 210,
  supplier: 200,
  amount: 140,
  products: 92,
  status: 120,
  actions: 250,
};

const SUPPLIER_QUOTATION_COLUMN_MIN_WIDTHS: Record<SupplierQuotationColumnKey, number> = {
  selection: 52,
  index: 56,
  date: 140,
  number: 180,
  supplier: 180,
  amount: 120,
  products: 88,
  status: 110,
  actions: 220,
};

const SUPPLIER_QUOTATION_TABLE_UI_PREFERENCE_KEY = 'supplier_quotations_table_column_widths_v1';

export const SupplierQuotationsTab: React.FC<SupplierQuotationsTabProps> = ({
  supplierQuotations,
  quotationSearchTerm,
  setQuotationSearchTerm,
  loadSupplierQuotationsFromApi,
  selectedQuotationIds,
  setSelectedQuotationIds,
  handleBatchDeleteQuotations,
  filteredQuotations,
  setSelectedSupplierQuotation,
  setShowSupplierQuotationDialog,
  applyLocalQuotationStatus,
  setAcceptedQuotationNo,
  setShowFeedbackReminderDialog,
}) => {
  const [statusFilter, setStatusFilter] = useState<'all' | 'submitted' | 'accepted' | 'rejected'>('all');
  const [expandedRelatedIds, setExpandedRelatedIds] = useState<string[]>([]);
  const {
    getColumnStyle,
    renderResizeHandle,
    renderHeaderCell,
  } = useResizableTableColumns<SupplierQuotationColumnKey>({
    storageKey: SUPPLIER_QUOTATION_TABLE_UI_PREFERENCE_KEY,
    order: SUPPLIER_QUOTATION_COLUMN_ORDER,
    defaults: SUPPLIER_QUOTATION_COLUMN_DEFAULT_WIDTHS,
    minWidths: SUPPLIER_QUOTATION_COLUMN_MIN_WIDTHS,
    fixedColumns: ['selection', 'index'],
  });
  const filterPillClass = (active: boolean) =>
    `${getErpListFilterPillClass(active)
      .replace('h-9', 'h-8')
      .replace('rounded-xl', '!rounded-full')
      .replace('px-4', 'px-3')} shadow-sm`;
  const getQuotationStatusBadge = (status?: string) => {
    const normalizedStatus = String(status || '').trim().toLowerCase();
    if (normalizedStatus === 'submitted') {
      return {
        className: 'bg-blue-50 text-blue-700 border-blue-200',
        label: '待审核',
      };
    }
    if (normalizedStatus === 'accepted') {
      return {
        className: 'bg-green-50 text-green-700 border-green-200',
        label: '已接受',
      };
    }
    if (normalizedStatus === 'rejected') {
      return {
        className: 'bg-red-50 text-red-700 border-red-200',
        label: '已拒绝',
      };
    }
    if (normalizedStatus === 'draft') {
      return {
        className: 'bg-gray-50 text-gray-700 border-gray-200',
        label: '草稿',
      };
    }
    if (normalizedStatus === 'completed') {
      return {
        className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        label: '已完成',
      };
    }
    return {
      className: 'bg-amber-50 text-amber-700 border-amber-200',
      label: status || '未知状态',
    };
  };

  const displayQuotations = useMemo(() => {
    if (statusFilter === 'all') return filteredQuotations;
    return filteredQuotations.filter(
      (quotation) => String(quotation.status || '').trim().toLowerCase() === statusFilter,
    );
  }, [filteredQuotations, statusFilter]);

  return (
    <TabsContent value="supplier-quotations" className="m-0 flex flex-1 min-h-0 flex-col">
      {/* 报价列表 */}
      <div className="px-3 py-2 flex flex-1 min-h-0 flex-col">
        {/* 🔥 搜索框和批量操作 */}
        <div className="mb-2 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <Input
                placeholder="搜索报价单号、供应商、询价单号..."
                value={quotationSearchTerm}
                onChange={(e) => setQuotationSearchTerm(e.target.value)}
                className={`pl-8 h-8 w-80 ${ERP_LIST_UI_SPEC_V1.buttonTextClass}`}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => loadSupplierQuotationsFromApi()}
              className={ERP_LIST_TOOL_PILL_CLASS.replace('text-[12px]', ERP_LIST_UI_SPEC_V1.buttonTextClass)}
              style={ERP_LIST_PILL_STYLE}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              刷新
            </Button>
            {[
              ['all', '全部', supplierQuotations.length],
              ['submitted', '待审核', supplierQuotations.filter(q => q.status === 'submitted').length],
              ['accepted', '已接受', supplierQuotations.filter(q => q.status === 'accepted').length],
              ['rejected', '已拒绝', supplierQuotations.filter(q => q.status === 'rejected').length],
            ].map(([value, label, count]) => (
              <Button
                key={String(value)}
                variant="outline"
                size="sm"
                onClick={() => setStatusFilter(value as any)}
                style={{
                  ...getErpListFilterPillStyle(statusFilter === value),
                  borderRadius: '9999px',
                }}
                className={filterPillClass(statusFilter === value)}
              >
                {label} ({count})
              </Button>
            ))}
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleBatchDeleteQuotations}
              disabled={selectedQuotationIds.length === 0}
              style={getErpListBatchDeletePillStyle(selectedQuotationIds.length > 0)}
              className={getErpListBatchDeletePillClass(selectedQuotationIds.length > 0)
                .replace('h-9', 'h-8')
                .replace('px-4', 'px-3')
                .replace('text-[12px]', ERP_LIST_UI_SPEC_V1.buttonTextClass)}
            >
              批量删除{selectedQuotationIds.length > 0 ? ` (${selectedQuotationIds.length})` : ''}
            </Button>
          </div>
        </div>

        {displayQuotations.length === 0 ? (
          <div className="text-center py-12 border border-gray-200 rounded">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">暂无供应商报价</p>
            <p className="text-sm text-gray-400 mt-1">供应商在 Portal 提交报价后，点击「刷新」或切换 Tab 后会自动拉取</p>
          </div>
        ) : (
          <div className="border border-gray-200 rounded bg-white flex flex-1 min-h-0 flex-col overflow-visible min-h-[calc(100dvh-360px)]">
            <div className="overflow-x-auto overflow-y-visible bg-white flex-1 rounded-[inherit] min-h-0">
            <table className="w-full table-fixed text-[14px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th
                    className="group relative overflow-hidden px-2 py-3 text-left font-semibold text-gray-700"
                    style={getColumnStyle('selection')}
                  >
                    <div className="flex min-h-5 w-full items-center justify-start pr-4 text-left">
                      <input
                        type="checkbox"
                        className="w-4 h-4 cursor-pointer appearance-none border-2 border-gray-600 bg-white rounded checked:bg-white checked:border-gray-600 checked:after:content-['✓'] checked:after:text-gray-600 checked:after:text-xs checked:after:flex checked:after:items-center checked:after:justify-center"
                        checked={selectedQuotationIds.length === displayQuotations.length && displayQuotations.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedQuotationIds(displayQuotations.map(q => q.id));
                          } else {
                            setSelectedQuotationIds([]);
                          }
                        }}
                      />
                    </div>
                    {renderResizeHandle('selection', { hitAreaClassName: 'w-8 -right-4' })}
                  </th>
                  <th
                    className="group relative overflow-hidden px-2 py-3 text-left font-semibold text-gray-700"
                    style={getColumnStyle('index')}
                  >
                    <div className="flex min-h-5 w-full items-center justify-start pr-4 text-left">
                      <span className="block whitespace-nowrap text-[13px] font-semibold leading-4">#</span>
                    </div>
                    {renderResizeHandle('index', { hitAreaClassName: 'w-8 -right-4' })}
                  </th>
                  {renderHeaderCell('date', '日期', 'text-left text-gray-700', { hitAreaClassName: 'w-8 -right-4' })}
                  {renderHeaderCell('number', '报价单号', 'text-left text-gray-700')}
                  {renderHeaderCell('supplier', '供应商', 'text-left text-gray-700')}
                  {renderHeaderCell('amount', '报价金额', 'text-left text-gray-700')}
                  {renderHeaderCell('products', '产品数', 'text-left text-gray-700')}
                  {renderHeaderCell('status', '状态', 'text-left text-gray-700')}
                  {renderHeaderCell('actions', '操作', 'text-left text-gray-700')}
                </tr>
              </thead>
              <tbody>
                {displayQuotations.map((quotation, idx) => {
                  const statusBadge = getQuotationStatusBadge(quotation.status);
                  const supplierName = String(quotation.supplierName || '').trim();
                  const supplierCompany = String(quotation.supplierCompany || '').trim();
                  const relatedRefs = Array.from(
                    new Set(
                      [
                        quotation.sourceXJ,
                        quotation.sourceXJNumber,
                        quotation.xjNumber,
                        quotation.xjNo,
                        quotation.sourceQR,
                        quotation.sourceQRNumber,
                        quotation.requirementNo,
                        quotation.quoteData?.sourceXJ,
                        quotation.quoteData?.xjNumber,
                        quotation.quoteData?.sourceQR,
                      ]
                        .map((value) => String(value || '').trim())
                        .filter(Boolean),
                    ),
                  );
                  const relatedRefsExpanded = expandedRelatedIds.includes(quotation.id);
                  return (
                  <tr key={quotation.id} className={`border-b border-gray-100 hover:bg-gray-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                    <td className="py-2 px-2 text-left" style={getColumnStyle('selection')}>
                      <input
                        type="checkbox"
                        className="w-4 h-4 cursor-pointer appearance-none border-2 border-gray-600 bg-white rounded checked:bg-white checked:border-gray-600 checked:after:content-['✓'] checked:after:text-gray-600 checked:after:text-xs checked:after:flex checked:after:items-center checked:after:justify-center"
                        checked={selectedQuotationIds.includes(quotation.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedQuotationIds([...selectedQuotationIds, quotation.id]);
                          } else {
                            setSelectedQuotationIds(selectedQuotationIds.filter(id => id !== quotation.id));
                          }
                        }}
                      />
                    </td>
                    <td className="py-2 px-2 text-left text-gray-500" style={getColumnStyle('index')}>
                      {idx + 1}
                    </td>
                    <td className="py-2 px-2" style={getColumnStyle('date')}>
                      <div className="text-gray-900">
                        <span className="mr-1 text-[12px] text-gray-500">报价日期</span>
                        {quotation.quotationDate}
                      </div>
                      <div className="mt-1 text-gray-900">
                        <span className="mr-1 text-[12px] text-gray-500">有效期至</span>
                        {quotation.validUntil}
                      </div>
                    </td>
                    <td className="py-2 px-2" style={getColumnStyle('number')}>
                      <div className="relative inline-block">
                      <button
                        onClick={() => {
                          setSelectedSupplierQuotation(quotation);
                          setShowSupplierQuotationDialog(true);
                        }}
                        className="text-blue-600 hover:text-blue-800 hover:underline font-semibold"
                      >
                        {quotation.quotationNo}
                      </button>
                      {relatedRefs.length > 0 ? (
                        <button
                          type="button"
                          onClick={() => {
                            setExpandedRelatedIds((current) =>
                              current.includes(quotation.id)
                                ? current.filter((id) => id !== quotation.id)
                                : [...current, quotation.id],
                            );
                          }}
                          className="mt-1 block text-[12px] font-semibold leading-[1.35] text-slate-500 hover:text-slate-700"
                        >
                          {relatedRefsExpanded ? '收起关联编号' : `展开关联编号 (${relatedRefs.length})`}
                        </button>
                      ) : null}
                      {relatedRefsExpanded ? (
                        <div className="absolute left-0 top-full z-20 mt-2 min-w-[280px] space-y-1 rounded-lg border border-slate-200 bg-white p-3 shadow-lg">
                          {relatedRefs.map((ref) => (
                            <div key={`${quotation.id}-${ref}`} className="whitespace-nowrap text-left text-[12px] font-mono text-blue-600">
                              {ref}
                            </div>
                          ))}
                          {(quotation.projectCode || quotation.projectRevisionCode || quotation.finalQuotationNumber) ? (
                            <div className="text-left text-[12px] font-mono text-purple-600">
                              基线: {quotation.projectCode || quotation.projectName || '项目'} / {quotation.projectRevisionCode || 'Rev'}{quotation.finalQuotationNumber ? ` / ${quotation.finalQuotationNumber}` : ''}
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                      </div>
                    </td>
                    <td className="py-2 px-2" style={getColumnStyle('supplier')}>
                      <div className="text-gray-900">{supplierName || supplierCompany || '-'}</div>
                      {supplierCompany && supplierCompany !== supplierName ? (
                        <div className="text-[12px] text-gray-500">{supplierCompany}</div>
                      ) : null}
                    </td>
                    <td className="py-2 px-2 text-left" style={getColumnStyle('amount')}>
                      <div className="font-semibold text-green-600">
                        {quotation.currency === 'CNY' ? '¥' : '$'}{quotation.totalAmount?.toLocaleString() || 0}
                      </div>
                      <div className="text-[12px] text-gray-500">{quotation.currency}</div>
                    </td>
                    <td className="py-2 px-2 text-left" style={getColumnStyle('products')}>
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 text-purple-700 font-semibold">
                        {quotation.items?.length || 0}
                      </span>
                    </td>
                    <td className="py-2 px-2" style={getColumnStyle('status')}>
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[12px] border ${statusBadge.className}`}>
                        {statusBadge.label}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-left" style={getColumnStyle('actions')}>
                      <div className="flex gap-1 justify-start">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedSupplierQuotation(quotation);
                            setShowSupplierQuotationDialog(true);
                          }}
                          className="h-6 text-[12px] px-2"
                        >
                          查看
                        </Button>

                        {quotation.status === 'submitted' && (
                          <>
                            <Button
                              size="sm"
                              onClick={async () => {
                                try {
                                  await saveSupplierQuotation({ ...quotation, status: 'accepted' } as any);
                                } catch (e: any) {
                                  console.warn('⚠️ 接受报价 Supabase 同步失败:', e?.message);
                                  toast.error('接受报价失败：Supabase 写入未成功');
                                  return;
                                }
                                applyLocalQuotationStatus(quotation.id, 'accepted');
                                await loadSupplierQuotationsFromApi();
                                setAcceptedQuotationNo(quotation.quotationNo || quotation.id);
                                setShowFeedbackReminderDialog(true);
                              }}
                              className="h-6 text-[12px] bg-green-600 hover:bg-green-700 px-2"
                            >
                              接受
                            </Button>

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={async () => {
                                try {
                                  await saveSupplierQuotation({ ...quotation, status: 'rejected' } as any);
                                } catch (e: any) {
                                  console.warn('⚠️ 拒绝报价 Supabase 同步失败:', e?.message);
                                  toast.error('拒绝报价失败：Supabase 写入未成功');
                                  return;
                                }
                                applyLocalQuotationStatus(quotation.id, 'rejected');
                                await loadSupplierQuotationsFromApi();
                                toast.info(
                                  <div className="space-y-1">
                                    <p className="font-semibold">❌ 已拒绝报价</p>
                                    <p className="text-sm">报价单号: {quotation.quotationNo}</p>
                                    <p className="text-xs text-slate-500">状态已更新</p>
                                  </div>
                                );
                              }}
                              className="h-6 text-[12px] text-red-600 hover:text-red-700 hover:bg-red-50 px-2"
                            >
                              拒绝
                            </Button>
                          </>
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
        )}
      </div>
    </TabsContent>
  );
};
