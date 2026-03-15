import React from 'react';
import { Search, RefreshCw, Trash2, FileText, Eye, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { TabsContent } from '../../ui/tabs';
import { saveSupplierQuotation } from '../../../utils/createQuotationFromXJ';

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
  return (
    <TabsContent value="supplier-quotations" className="m-0">
      {/* 统计卡片 */}
      <div className="px-3 py-3 bg-gray-50 border-b border-gray-200">
        <div className="grid grid-cols-4 gap-2">
          <div className="text-center">
            <p className="text-[14px] text-gray-500">总报价</p>
            <p className="text-base font-bold text-gray-900">{supplierQuotations.length}</p>
          </div>
          <div className="text-center">
            <p className="text-[14px] text-gray-500">待审核</p>
            <p className="text-base font-bold text-blue-600">
              {supplierQuotations.filter(q => q.status === 'submitted').length}
            </p>
          </div>
          <div className="text-center">
            <p className="text-[14px] text-gray-500">已接受</p>
            <p className="text-base font-bold text-green-600">
              {supplierQuotations.filter(q => q.status === 'accepted').length}
            </p>
          </div>
          <div className="text-center">
            <p className="text-[14px] text-gray-500">已拒绝</p>
            <p className="text-base font-bold text-red-600">
              {supplierQuotations.filter(q => q.status === 'rejected').length}
            </p>
          </div>
        </div>
      </div>

      {/* 报价列表 */}
      <div className="px-3 py-2">
        {/* 🔥 搜索框和批量操作 */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <Input
                placeholder="搜索报价单号、供应商、询价单号..."
                value={quotationSearchTerm}
                onChange={(e) => setQuotationSearchTerm(e.target.value)}
                className="pl-8 h-8 text-xs w-80"
              />
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => loadSupplierQuotationsFromApi()}
              className="h-8 text-xs px-3"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1" />
              刷新
            </Button>
            {selectedQuotationIds.length > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleBatchDeleteQuotations}
                className="h-8 text-xs px-3 border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" />
                批量删除 ({selectedQuotationIds.length})
              </Button>
            )}
          </div>
          <p className="text-[14px] text-gray-600">共 {filteredQuotations.length} 条供应商报价</p>
        </div>

        {filteredQuotations.length === 0 ? (
          <div className="text-center py-12 border border-gray-200 rounded">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">暂无供应商报价</p>
            <p className="text-sm text-gray-400 mt-1">供应商在 Portal 提交报价后，点击「刷新」或切换 Tab 后会自动拉取</p>
          </div>
        ) : (
          <div className="border border-gray-200 rounded overflow-hidden">
            <table className="w-full text-[14px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-center py-1.5 px-2 font-medium text-gray-700 w-10">
                    <input
                      type="checkbox"
                      className="w-4 h-4 cursor-pointer appearance-none border-2 border-gray-600 bg-white rounded checked:bg-white checked:border-gray-600 checked:after:content-['✓'] checked:after:text-gray-600 checked:after:text-xs checked:after:flex checked:after:items-center checked:after:justify-center"
                      checked={selectedQuotationIds.length === filteredQuotations.length && filteredQuotations.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedQuotationIds(filteredQuotations.map(q => q.id));
                        } else {
                          setSelectedQuotationIds([]);
                        }
                      }}
                    />
                  </th>
                  <th className="text-center py-1.5 px-2 font-medium text-gray-700 w-12">#</th>
                  <th className="text-left py-1.5 px-2 font-medium text-gray-700">报价单号</th>
                  <th className="text-left py-1.5 px-2 font-medium text-gray-700">供应商</th>
                  <th className="text-left py-1.5 px-2 font-medium text-gray-700">关联询价</th>
                  <th className="text-right py-1.5 px-2 font-medium text-gray-700">报价金额</th>
                  <th className="text-center py-1.5 px-2 font-medium text-gray-700">产品数</th>
                  <th className="text-left py-1.5 px-2 font-medium text-gray-700">报价日期</th>
                  <th className="text-left py-1.5 px-2 font-medium text-gray-700">有效期至</th>
                  <th className="text-left py-1.5 px-2 font-medium text-gray-700">状态</th>
                  <th className="text-center py-1.5 px-2 font-medium text-gray-700">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredQuotations.map((quotation, idx) => (
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
                      <button
                        onClick={() => {
                          setSelectedSupplierQuotation(quotation);
                          setShowSupplierQuotationDialog(true);
                        }}
                        className="text-blue-600 hover:text-blue-800 hover:underline font-semibold"
                      >
                        {quotation.quotationNo}
                      </button>
                      <div className="text-[12px] text-gray-500">{quotation.submittedDate || quotation.quotationDate}</div>
                    </td>
                    <td className="py-2 px-2">
                      <div className="text-gray-900">{quotation.supplierName}</div>
                      <div className="text-[12px] text-gray-500">{quotation.supplierCompany}</div>
                    </td>
                    <td className="py-2 px-2">
                      <div className="text-gray-900">{quotation.sourceXJ || '-'}</div>
                      {quotation.sourceQR && <div className="text-[12px] text-blue-600 font-mono">{quotation.sourceQR}</div>}
                      {(quotation.projectCode || quotation.projectRevisionCode || quotation.finalQuotationNumber) && (
                        <div className="text-[12px] text-purple-600 font-mono">
                          基线: {quotation.projectCode || quotation.projectName || '项目'} / {quotation.projectRevisionCode || 'Rev'}{quotation.finalQuotationNumber ? ` / ${quotation.finalQuotationNumber}` : ''}
                        </div>
                      )}
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
                      <div className="text-gray-900">{quotation.quotationDate}</div>
                    </td>
                    <td className="py-2 px-2">
                      <div className="text-gray-900">{quotation.validUntil}</div>
                    </td>
                    <td className="py-2 px-2">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[12px] border ${
                        quotation.status === 'submitted' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        quotation.status === 'accepted' ? 'bg-green-50 text-green-700 border-green-200' :
                        'bg-red-50 text-red-700 border-red-200'
                      }`}>
                        {quotation.status === 'submitted' ? '待审核'
                          : quotation.status === 'accepted' ? '已接受'
                          : '已拒绝'}
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
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </TabsContent>
  );
};
