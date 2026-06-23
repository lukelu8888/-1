import React, { useMemo, useState } from 'react';
import { Search, FileText } from 'lucide-react';
import { XJ } from '../../../contexts/XJContext';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { TabsContent } from '../../ui/tabs';
import {
  ERP_LIST_UI_SPEC_V1,
  getErpListBatchDeletePillClass,
  getErpListBatchDeletePillStyle,
  getErpListFilterPillClass,
  getErpListFilterPillStyle,
} from '../../shared/erpListUiSpec';
import { useResizableTableColumns } from '../../shared/useResizableTableColumns';

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

type XJColumnKey =
  | 'selection'
  | 'index'
  | 'date'
  | 'number'
  | 'supplier'
  | 'products'
  | 'status'
  | 'actions';

const XJ_COLUMN_ORDER: XJColumnKey[] = [
  'selection',
  'index',
  'date',
  'number',
  'supplier',
  'products',
  'status',
  'actions',
];

const XJ_COLUMN_DEFAULT_WIDTHS: Record<XJColumnKey, number> = {
  selection: 52,
  index: 56,
  date: 170,
  number: 220,
  supplier: 220,
  products: 92,
  status: 120,
  actions: 280,
};

const XJ_COLUMN_MIN_WIDTHS: Record<XJColumnKey, number> = {
  selection: 52,
  index: 56,
  date: 140,
  number: 180,
  supplier: 180,
  products: 88,
  status: 110,
  actions: 220,
};

const XJ_TABLE_UI_PREFERENCE_KEY = 'xj_management_table_column_widths_v1';

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
  const {
    getColumnStyle,
    renderResizeHandle,
    renderHeaderCell,
  } = useResizableTableColumns<XJColumnKey>({
    storageKey: XJ_TABLE_UI_PREFERENCE_KEY,
    order: XJ_COLUMN_ORDER,
    defaults: XJ_COLUMN_DEFAULT_WIDTHS,
    minWidths: XJ_COLUMN_MIN_WIDTHS,
    fixedColumns: ['selection', 'index'],
  });
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
              style={getErpListBatchDeletePillStyle(selectedXJIds.length > 0)}
              className={getErpListBatchDeletePillClass(selectedXJIds.length > 0)
                .replace('h-9', 'h-8')
                .replace('px-4', 'px-3')
                .replace('text-[12px]', ERP_LIST_UI_SPEC_V1.buttonTextClass)}
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
                        checked={selectedXJIds.length === displayXJs.length && displayXJs.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedXJIds(displayXJs.map(r => r.id));
                          } else {
                            setSelectedXJIds([]);
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
                      <span className="block whitespace-nowrap text-[13px] font-semibold leading-4">序号</span>
                    </div>
                    {renderResizeHandle('index', { hitAreaClassName: 'w-8 -right-4' })}
                  </th>
                  {renderHeaderCell('date', '日期', 'text-left text-gray-700', { hitAreaClassName: 'w-8 -right-4' })}
                  {renderHeaderCell('number', '询价单号', 'text-left text-gray-700')}
                  {renderHeaderCell('supplier', '供应商', 'text-left text-gray-700')}
                  {renderHeaderCell('products', '产品数', 'text-left text-gray-700')}
                  {renderHeaderCell('status', '状态', 'text-left text-gray-700')}
                  {renderHeaderCell('actions', '操作', 'text-left text-gray-700')}
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
                      [
                        xj.requirementNo,
                        (xj as any).sourceQRNumber,
                        (xj as any).sourceQrNumber,
                        xj.sourceInquiryNumber,
                        xj.sourceRef,
                      ]
                        .map((value) => String(value || '').trim())
                        .filter(Boolean),
                    ),
                  );
                  const relatedRefsExpanded = expandedRelatedIds.includes(xj.id);

                  return (
                    <tr key={xj.id} className={`border-b border-gray-100 hover:bg-gray-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                      <td className="py-2 px-2 text-left" style={getColumnStyle('selection')}>
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
                      <td className="py-2 px-2 text-left text-gray-500" style={getColumnStyle('index')}>
                        {idx + 1}
                      </td>
                      <td className="py-2 px-2" style={getColumnStyle('date')}>
                        <div className="text-gray-900">
                          <span className="mr-1 text-[12px] text-gray-500">发送日期</span>
                          {formatDateOnly((xj as any).sentDate || xj.createdDate)}
                        </div>
                        <div className="mt-1 text-gray-900">
                          <span className="mr-1 text-[12px] text-gray-500">截止日期</span>
                          {xj.quotationDeadline}
                        </div>
                      </td>
                      <td className="py-2 px-2" style={getColumnStyle('number')}>
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
                      <td className="py-2 px-2 whitespace-nowrap" style={getColumnStyle('supplier')}>
                        <div className="text-gray-900">{xj.supplierName}</div>
                        <div className="text-[12px] text-gray-500">{xj.supplierCode}</div>
                      </td>
                      <td className="py-2 px-2 text-left" style={getColumnStyle('products')}>
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 text-purple-700 font-semibold">
                          {xj.products?.length || 1}
                        </span>
                      </td>
                      <td className="py-2 px-2" style={getColumnStyle('status')}>
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
                      <td className="py-2 px-2 text-left" style={getColumnStyle('actions')}>
                        <div className="flex gap-1 justify-start">
                          {/* 查看按钮：始终可用 */}
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => openXJPreview(xj)}
                            className="h-6 text-[12px] px-2 border-blue-300 text-blue-600 hover:bg-blue-50"
                          >
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
                            编辑
                          </Button>
                          {/* 下推按钮：存在下游(BJ)后变灰禁用 */}
                          {lockedByQuotation || xj.status === 'completed' ? (
                            <Button
                              size="sm"
                              disabled
                              className="h-6 text-[12px] px-2 bg-gray-200 text-gray-400 cursor-not-allowed"
                            >
                              已锁定
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => handleSubmitXJToSupplier(xj)}
                              className="h-6 text-[12px] px-2 bg-[#F96302] hover:bg-[#E05502]"
                            >
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
