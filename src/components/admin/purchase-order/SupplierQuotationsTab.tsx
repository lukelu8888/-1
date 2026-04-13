import React, { useMemo, useState } from 'react';
import { Search, RefreshCw, Trash2, FileText, Eye, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { TabsContent } from '../../ui/tabs';
import { saveSupplierQuotation } from '../../../utils/createQuotationFromXJ';
import {
  ERP_LIST_UI_SPEC_V1,
  getErpListFilterPillClass,
  getErpListFilterPillStyle,
} from '../../shared/erpListUiSpec';

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
  const capsuleButtonClass = `h-8 shrink-0 whitespace-nowrap !rounded-full px-3 shadow-sm ${ERP_LIST_UI_SPEC_V1.buttonTextClass} font-semibold leading-[1.35]`;
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
              className={`${capsuleButtonClass} border-slate-200 bg-white text-slate-700 hover:bg-slate-50`}
              style={{ borderRadius: '9999px' }}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              刷新
            </Button>
            <button
              type="button"
              onClick={handleBatchDeleteQuotations}
              disabled={selectedQuotationIds.length === 0}
              className={`inline-flex items-center justify-center transition-colors ${capsuleButtonClass} ${
                selectedQuotationIds.length > 0
                  ? 'border border-red-200 bg-white text-red-600 hover:bg-red-50'
                  : 'cursor-not-allowed border border-[#F7D3D8] bg-white text-[#EE8F9D]'
              }`}
              style={{ borderRadius: '9999px' }}
            >
              <Trash2 className="w-3.5 h-3.5" />
              批量删除{selectedQuotationIds.length > 0 ? ` (${selectedQuotationIds.length})` : ''}
            </button>
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
            <table className="w-full text-[14px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-center py-1.5 px-2 font-medium text-gray-700 w-10">
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
                  </th>
                  <th className="text-center py-1.5 px-2 font-medium text-gray-700 w-12">#</th>
                  <th className="text-left py-1.5 px-2 font-medium text-gray-700">日期</th>
                  <th className="text-left py-1.5 px-2 font-medium text-gray-700">报价单号</th>
                  <th className="text-left py-1.5 px-2 font-medium text-gray-700">供应商</th>
                  <th className="text-right py-1.5 px-2 font-medium text-gray-700">报价金额</th>
                  <th className="text-center py-1.5 px-2 font-medium text-gray-700">产品数</th>
                  <th className="text-left py-1.5 px-2 font-medium text-gray-700">状态</th>
                  <th className="text-center py-1.5 px-2 font-medium text-gray-700">操作</th>
                </tr>
              </thead>
              <tbody>
                {displayQuotations.map((quotation, idx) => {
                  const statusBadge = getQuotationStatusBadge(quotation.status);
                  const supplierName = String(quotation.supplierName || '').trim();
                  const supplierCompany = String(quotation.supplierCompany || '').trim();
                  const relatedRefs = Array.from(
                    new Set(
                      [quotation.sourceXJ, quotation.sourceQR]
                        .map((value) => String(value || '').trim())
                        .filter(Boolean),
                    ),
                  );
                  const relatedRefsExpanded = expandedRelatedIds.includes(quotation.id);
                  return (
                  <tr key={quotation.id} className={`border-b border-gray-100 hover:bg-gray-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                    <td className="py-2 px-2 text-center">
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
                    <td className="py-2 px-2 text-center text-gray-500">
                      {idx + 1}
                    </td>
                    <td className="py-2 px-2">
                      <div className="text-gray-900">
                        <span className="mr-1 text-[12px] text-gray-500">报价日期</span>
                        {quotation.quotationDate}
                      </div>
                      <div className="mt-1 text-gray-900">
                        <span className="mr-1 text-[12px] text-gray-500">有效期至</span>
                        {quotation.validUntil}
                      </div>
                    </td>
                    <td className="py-2 px-2">
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
                    <td className="py-2 px-2">
                      <div className="text-gray-900">{supplierName || supplierCompany || '-'}</div>
                      {supplierCompany && supplierCompany !== supplierName ? (
                        <div className="text-[12px] text-gray-500">{supplierCompany}</div>
                      ) : null}
                    </td>
                    <td className="py-2 px-2 text-right">
                      <div className="font-semibold text-green-600">
                        {quotation.currency === 'CNY' ? '¥' : '$'}{quotation.totalAmount?.toLocaleString() || 0}
                      </div>
                      <div className="text-[12px] text-gray-500">{quotation.currency}</div>
                    </td>
                    <td className="py-2 px-2 text-center">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 text-purple-700 font-semibold">
                        {quotation.items?.length || 0}
                      </span>
                    </td>
                    <td className="py-2 px-2">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[12px] border ${statusBadge.className}`}>
                        {statusBadge.label}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-center">
                      <div className="flex gap-1 justify-center">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedSupplierQuotation(quotation);
                            setShowSupplierQuotationDialog(true);
                          }}
                          className="h-6 text-[12px] px-2"
                        >
                          <Eye className="w-3 h-3 mr-1" />
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
                              <CheckCircle2 className="w-3 h-3 mr-1" />
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
                              <AlertCircle className="w-3 h-3 mr-1" />
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
