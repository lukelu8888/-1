import React from 'react';
import { Search, Trash2, FileText, Eye, Edit, Send } from 'lucide-react';
import { XJ } from '../../../contexts/XJContext';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { TabsContent } from '../../ui/tabs';
import { formatCompactUtcMinute } from './purchaseOrderUtils';

type XJManagementTabProps = {
  xjs: XJ[];
  xjSearchTerm: string;
  setRFQSearchTerm: React.Dispatch<React.SetStateAction<string>>;
  selectedXJIds: string[];
  setSelectedRFQIds: React.Dispatch<React.SetStateAction<string[]>>;
  filteredXJs: XJ[];
  handleBatchDeleteRFQs: () => void;
  hasDownstreamQuotationForXJ: (xj: any) => boolean;
  openXJPreview: (xj: XJ) => void;
  handleEditXJ: (xj: XJ) => void;
  handleSubmitXJToSupplier: (xj: XJ) => void;
};

export const XJManagementTab: React.FC<XJManagementTabProps> = ({
  xjs,
  xjSearchTerm,
  setRFQSearchTerm,
  selectedXJIds,
  setSelectedRFQIds,
  filteredXJs,
  handleBatchDeleteRFQs,
  hasDownstreamQuotationForXJ,
  openXJPreview,
  handleEditXJ,
  handleSubmitXJToSupplier,
}) => {
  return (
    <TabsContent value="xj-management" className="m-0">
      {/* 询价统计 */}
      <div className="px-3 py-3 bg-gray-50 border-b border-gray-200">
        <div className="grid grid-cols-5 gap-2">
          <div className="text-center">
            <p className="text-[14px] text-gray-500">总询价</p>
            <p className="text-base font-bold text-gray-900">{xjs.length}</p>
          </div>
          <div className="text-center">
            <p className="text-[14px] text-gray-500">草稿</p>
            <p className="text-base font-bold text-gray-600">{xjs.filter(r => (r.status as any) === 'draft').length}</p>
          </div>
          <div className="text-center">
            <p className="text-[14px] text-gray-500">已发送</p>
            <p className="text-base font-bold text-blue-600">{xjs.filter(r => (r.status as any) === 'sent').length}</p>
          </div>
          <div className="text-center">
            <p className="text-[14px] text-gray-500">等待报价</p>
            <p className="text-base font-bold text-orange-600">{xjs.filter(r => r.status === 'pending').length}</p>
          </div>
          <div className="text-center">
            <p className="text-[14px] text-gray-500">已回复</p>
            <p className="text-base font-bold text-green-600">{xjs.filter(r => r.status === 'quoted').length}</p>
          </div>
        </div>
      </div>

      {/* 询价列表 */}
      <div className="px-3 py-2">
        {/* 🔥 搜索框和批量操作 */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <Input
                placeholder="搜索询价单号、供应商、QR编号..."
                value={xjSearchTerm}
                onChange={(e) => setRFQSearchTerm(e.target.value)}
                className="pl-8 h-8 text-xs w-80"
              />
            </div>
            {selectedXJIds.length > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleBatchDeleteRFQs}
                className="h-8 text-xs px-3 border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" />
                批量删除 ({selectedXJIds.length})
              </Button>
            )}
          </div>
          <p className="text-[14px] text-gray-600">共 {filteredXJs.length} 条询价单</p>
        </div>

        {filteredXJs.length === 0 ? (
          <div className="text-center py-12 border border-gray-200 rounded">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">暂无询价单</p>
            <p className="text-sm text-gray-400 mt-1">从报价请求池创建询价单后将显示在这里</p>
          </div>
        ) : (
          <div className="border border-gray-200 rounded overflow-x-auto">
            <table className="min-w-max w-full text-[14px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-center py-1.5 px-2 font-medium text-gray-700 w-10">
                    <input
                      type="checkbox"
                      className="w-4 h-4 cursor-pointer appearance-none border-2 border-gray-600 bg-white rounded checked:bg-white checked:border-gray-600 checked:after:content-['✓'] checked:after:text-gray-600 checked:after:text-xs checked:after:flex checked:after:items-center checked:after:justify-center"
                      checked={selectedXJIds.length === filteredXJs.length && filteredXJs.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedRFQIds(filteredXJs.map(r => r.id));
                        } else {
                          setSelectedRFQIds([]);
                        }
                      }}
                    />
                  </th>
                  <th className="text-center py-1.5 px-2 font-medium text-gray-700 w-10">序号</th>
                  <th className="text-left py-1.5 px-2 font-medium text-gray-700 w-36">询价单号</th>
                  <th className="text-left py-1.5 px-2 font-medium text-gray-700 w-40">供应商</th>
                  <th className="text-left py-1.5 px-2 font-medium text-gray-700 w-32">关联需求</th>
                  <th className="text-center py-1.5 px-2 font-medium text-gray-700 w-16">产品数</th>
                  <th className="text-left py-1.5 px-2 font-medium text-gray-700 w-28">发送日期</th>
                  <th className="text-left py-1.5 px-2 font-medium text-gray-700 w-24">截止日期</th>
                  <th className="text-left py-1.5 px-2 font-medium text-gray-700 w-20">状态</th>
                  <th className="text-center py-1.5 px-2 font-medium text-gray-700 w-40">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredXJs.map((xj, idx) => {
                  const xjStatus = (xj.status as any);
                  const isDraft = xjStatus === 'draft';
                  const isSent = xjStatus === 'sent';
                  const lockedByQuotation = hasDownstreamQuotationForXJ(xj);

                  return (
                    <tr key={xj.id} className={`border-b border-gray-100 hover:bg-gray-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                      <td className="py-2 px-2 text-center">
                        <input
                          type="checkbox"
                          className="w-4 h-4 cursor-pointer appearance-none border-2 border-gray-600 bg-white rounded checked:bg-white checked:border-gray-600 checked:after:content-['✓'] checked:after:text-gray-600 checked:after:text-xs checked:after:flex checked:after:items-center checked:after:justify-center"
                          checked={selectedXJIds.includes(xj.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedRFQIds([...selectedXJIds, xj.id]);
                            } else {
                              setSelectedRFQIds(selectedXJIds.filter(id => id !== xj.id));
                            }
                          }}
                        />
                      </td>
                      <td className="py-2 px-2 text-center text-gray-500">
                        {idx + 1}
                      </td>
                      <td className="py-2 px-2">
                        <button
                          type="button"
                          onClick={() => openXJPreview(xj)}
                          className="text-blue-600 hover:text-blue-800 hover:underline font-semibold"
                        >
                          {xj.supplierXjNo}
                        </button>
                      </td>
                      <td className="py-2 px-2 whitespace-nowrap">
                        <div className="text-gray-900">{xj.supplierName}</div>
                        <div className="text-[12px] text-gray-500">{xj.supplierCode}</div>
                      </td>
                      <td className="py-2 px-2 whitespace-nowrap">
                        <div className="text-gray-900 font-mono">{xj.requirementNo}</div>
                        {xj.sourceRef && <div className="text-[12px] text-gray-500">{xj.sourceRef}</div>}
                      </td>
                      <td className="py-2 px-2 text-center">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 text-purple-700 font-semibold">
                          {xj.products?.length || 1}
                        </span>
                      </td>
                      <td className="py-2 px-2">
                        <div className="text-gray-900">{formatCompactUtcMinute((xj as any).sentDate || xj.createdDate)}</div>
                      </td>
                      <td className="py-2 px-2">
                        <div className="text-gray-900">{xj.quotationDeadline}</div>
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
        )}
      </div>
    </TabsContent>
  );
};
