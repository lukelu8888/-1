import React, { useMemo, useState } from 'react';
import { Search, Trash2, FileText, Eye, Edit, Send } from 'lucide-react';
import { XJ } from '../../../contexts/XJContext';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { TabsContent } from '../../ui/tabs';
import {
  ERP_LIST_UI_SPEC_V1,
  getErpListFilterPillClass,
  getErpListFilterPillStyle,
} from '../../shared/erpListUiSpec';

type XJManagementTabProps = {
  xjs: XJ[];
  xjSearchTerm: string;
  setXJSearchTerm: React.Dispatch<React.SetStateAction<string>>;
  selectedXJIds: string[];
  setSelectedXJIds: React.Dispatch<React.SetStateAction<string[]>>;
  filteredXJs: XJ[];
  handleBatchDeleteXJs: () => void;
  hasDownstreamQuotationForXJ: (xj: any) => boolean;
  openXJPreview: (xj: XJ) => void;
  handleEditXJ: (xj: XJ) => void;
  handleSubmitXJToSupplier: (xj: XJ) => void;
};

export const XJManagementTab: React.FC<XJManagementTabProps> = ({
  xjs,
  xjSearchTerm,
  setXJSearchTerm,
  selectedXJIds,
  setSelectedXJIds,
  filteredXJs,
  handleBatchDeleteXJs,
  hasDownstreamQuotationForXJ,
  openXJPreview,
  handleEditXJ,
  handleSubmitXJToSupplier,
}) => {
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'sent' | 'pending' | 'quoted'>('all');
  const [expandedRelatedIds, setExpandedRelatedIds] = useState<string[]>([]);
  const displayXJs = useMemo(() => {
    if (statusFilter === 'all') return filteredXJs;
    return filteredXJs.filter((xj) => String((xj.status as any) || '').trim() === statusFilter);
  }, [filteredXJs, statusFilter]);
  const formatDateOnly = (value: unknown) => {
    const text = String(value || '').trim();
    if (!text) return '-';
    if (/^\d{4}-\d{2}-\d{2}/.test(text)) return text.slice(0, 10);
    if (/^\d{8}\b/.test(text)) {
      return `${text.slice(0, 4)}-${text.slice(4, 6)}-${text.slice(6, 8)}`;
    }
    return text;
  };

  return (
    <TabsContent value="xj-management" className="m-0 flex flex-1 min-h-0 flex-col">
      {/* 询价列表 */}
      <div className="px-3 py-2 flex flex-1 min-h-0 flex-col">
        {/* 🔥 搜索框和批量操作 */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <Input
                placeholder="搜索询价单号、供应商、QR编号..."
                value={xjSearchTerm}
                onChange={(e) => setXJSearchTerm(e.target.value)}
                className={`pl-8 h-8 w-80 ${ERP_LIST_UI_SPEC_V1.buttonTextClass}`}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            {[
              ['all', '全部', xjs.length],
              ['draft', '草稿', xjs.filter(r => (r.status as any) === 'draft').length],
              ['sent', '已发送', xjs.filter(r => (r.status as any) === 'sent').length],
              ['pending', '等待报价', xjs.filter(r => r.status === 'pending').length],
              ['quoted', '已回复', xjs.filter(r => r.status === 'quoted').length],
            ].map(([value, label, count]) => (
              <Button
                key={String(value)}
                variant="outline"
                size="sm"
                onClick={() => setStatusFilter(value as any)}
                style={getErpListFilterPillStyle(statusFilter === value)}
                className={getErpListFilterPillClass(statusFilter === value).replace('h-9', 'h-8').replace('px-4', 'px-3')}
              >
                {label} ({count})
              </Button>
            ))}
            <Button
              size="sm"
              variant="outline"
              onClick={handleBatchDeleteXJs}
              disabled={selectedXJIds.length === 0}
              style={selectedXJIds.length > 0 ? getErpListFilterPillStyle(true) : undefined}
              className={(selectedXJIds.length > 0
                ? getErpListFilterPillClass(true)
                : getErpListFilterPillClass(false))
                .replace('h-9', 'h-8')
                .replace('px-4', 'px-3')
                .replace('text-slate-700', 'text-slate-900') + ' disabled:opacity-100 disabled:text-slate-900 disabled:bg-white disabled:border-slate-200'}
            >
              批量删除{selectedXJIds.length > 0 ? ` (${selectedXJIds.length})` : ''}
            </Button>
          </div>
        </div>

        {displayXJs.length === 0 ? (
          <div className="text-center py-12 border border-gray-200 rounded">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">暂无询价单</p>
            <p className="text-sm text-gray-400 mt-1">从报价请求池创建询价单后将显示在这里</p>
          </div>
        ) : (
          <div className="border border-gray-200 rounded bg-white flex flex-1 min-h-0 flex-col overflow-visible min-h-[calc(100dvh-360px)]">
            <div className="overflow-x-auto overflow-y-visible bg-white flex-1 rounded-[inherit] min-h-0">
            <table className="min-w-max w-full text-[14px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-center py-1.5 px-2 font-medium text-gray-700 w-10">
                    <input
                      type="checkbox"
                      className="w-4 h-4 cursor-pointer appearance-none border-2 border-gray-600 bg-white rounded checked:bg-white checked:border-gray-600 checked:after:content-['✓'] checked:after:text-gray-600 checked:after:text-xs checked:after:flex checked:after:items-center checked:after:justify-center"
                      checked={selectedXJIds.length === displayXJs.length && displayXJs.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedXJIds(displayXJs.map(r => r.id));
                        } else {
                          setSelectedXJIds([]);
                        }
                      }}
                    />
                  </th>
                  <th className="text-center py-1.5 px-2 font-medium text-gray-700 w-10">序号</th>
                  <th className="text-left py-1.5 px-2 font-medium text-gray-700 w-32">日期</th>
                  <th className="text-left py-1.5 px-2 font-medium text-gray-700 w-44">询价单号</th>
                  <th className="text-left py-1.5 px-2 font-medium text-gray-700 w-40">供应商</th>
                  <th className="text-center py-1.5 px-2 font-medium text-gray-700 w-16">产品数</th>
                  <th className="text-left py-1.5 px-2 font-medium text-gray-700 w-20">状态</th>
                  <th className="text-center py-1.5 px-2 font-medium text-gray-700 w-40">操作</th>
                </tr>
              </thead>
              <tbody>
                {displayXJs.map((xj, idx) => {
                  const xjStatus = (xj.status as any);
                  const isDraft = xjStatus === 'draft';
                  const isSent = xjStatus === 'sent';
                  const lockedByQuotation = hasDownstreamQuotationForXJ(xj);
                  const relatedRefs = Array.from(
                    new Set(
                      [xj.requirementNo, xj.sourceRef]
                        .map((value) => String(value || '').trim())
                        .filter(Boolean),
                    ),
                  );
                  const relatedRefsExpanded = expandedRelatedIds.includes(xj.id);

                  return (
                    <tr key={xj.id} className={`border-b border-gray-100 hover:bg-gray-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                      <td className="py-2 px-2 text-center">
                        <input
                          type="checkbox"
                          className="w-4 h-4 cursor-pointer appearance-none border-2 border-gray-600 bg-white rounded checked:bg-white checked:border-gray-600 checked:after:content-['✓'] checked:after:text-gray-600 checked:after:text-xs checked:after:flex checked:after:items-center checked:after:justify-center"
                          checked={selectedXJIds.includes(xj.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedXJIds([...selectedXJIds, xj.id]);
                            } else {
                              setSelectedXJIds(selectedXJIds.filter(id => id !== xj.id));
                            }
                          }}
                        />
                      </td>
                      <td className="py-2 px-2 text-center text-gray-500">
                        {idx + 1}
                      </td>
                      <td className="py-2 px-2">
                        <div className="text-gray-900">
                          <span className="mr-1 text-[12px] text-gray-500">发送日期</span>
                          {formatDateOnly((xj as any).sentDate || xj.createdDate)}
                        </div>
                        <div className="mt-1 text-gray-900">
                          <span className="mr-1 text-[12px] text-gray-500">截止日期</span>
                          {xj.quotationDeadline}
                        </div>
                      </td>
                      <td className="py-2 px-2">
                        <div className="relative inline-block">
                        <button
                          type="button"
                          onClick={() => openXJPreview(xj)}
                          className="text-blue-600 hover:text-blue-800 hover:underline font-semibold"
                        >
                          {xj.supplierXjNo}
                        </button>
                        {relatedRefs.length > 0 ? (
                          <button
                            type="button"
                            onClick={() => {
                              setExpandedRelatedIds((current) =>
                                current.includes(xj.id)
                                  ? current.filter((id) => id !== xj.id)
                                  : [...current, xj.id],
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
                              <div key={`${xj.id}-${ref}`} className="whitespace-nowrap text-left text-[12px] font-mono text-blue-600">
                                {ref}
                              </div>
                            ))}
                          </div>
                        ) : null}
                        </div>
                      </td>
                      <td className="py-2 px-2 whitespace-nowrap">
                        <div className="text-gray-900">{xj.supplierName}</div>
                        <div className="text-[12px] text-gray-500">{xj.supplierCode}</div>
                      </td>
                      <td className="py-2 px-2 text-center">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 text-purple-700 font-semibold">
                          {xj.products?.length || 1}
                        </span>
                      </td>
                      <td className="py-2 px-2">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[12px] border ${
                          isDraft ? 'bg-gray-50 text-gray-700 border-gray-200' :
                          isSent ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          xj.status === 'pending' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                          xj.status === 'quoted' ? 'bg-green-50 text-green-700 border-green-200' :
                          'bg-gray-50 text-gray-700 border-gray-200'
                        }`}>
                          {isDraft ? '草稿' :
                           isSent ? '已发送' :
                           xj.status === 'pending' ? '等待报价' :
                           xj.status === 'quoted' ? '已回复' :
                           xj.status}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-center">
                        <div className="flex gap-1 justify-center">
                          {/* 查看按钮：始终可用 */}
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => openXJPreview(xj)}
                            className="h-6 text-[12px] px-2 border-blue-300 text-blue-600 hover:bg-blue-50"
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            查看
                          </Button>
                          {/* 编辑按钮：存在下游(BJ)后禁用 */}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditXJ(xj)}
                            disabled={lockedByQuotation || xj.status === 'completed'}
                            className={`h-6 text-[12px] px-2 ${
                              lockedByQuotation || xj.status === 'completed'
                                ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                                : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            <Edit className="w-3 h-3 mr-1" />
                            编辑
                          </Button>
                          {/* 下推按钮：存在下游(BJ)后变灰禁用 */}
                          {lockedByQuotation || xj.status === 'completed' ? (
                            <Button
                              size="sm"
                              disabled
                              className="h-6 text-[12px] px-2 bg-gray-200 text-gray-400 cursor-not-allowed"
                            >
                              <Send className="w-3 h-3 mr-1" />
                              已锁定
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => handleSubmitXJToSupplier(xj)}
                              className="h-6 text-[12px] px-2 bg-[#F96302] hover:bg-[#E05502]"
                            >
                              <Send className="w-3 h-3 mr-1" />
                              {isSent ? '重新下推' : '下推供应商'}
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
        )}
      </div>
    </TabsContent>
  );
};
