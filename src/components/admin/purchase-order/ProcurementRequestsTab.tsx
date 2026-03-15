import React from 'react';
import { Eye, Search, Trash2 } from 'lucide-react';
import { PurchaseOrder as PurchaseOrderType } from '../../../contexts/PurchaseOrderContext';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { TabsContent } from '../../ui/tabs';
import { extractProjectExecutionBaseline } from './purchaseOrderUtils';

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
};

export const ProcurementRequestsTab: React.FC<ProcurementRequestsTabProps> = ({
  procurementRequestSearchTerm,
  setProcurementRequestSearchTerm,
  selectedProcurementRequestIds,
  setSelectedProcurementRequestIds,
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
  handleDeleteProcurementRequest,
}) => {
  return (
    <TabsContent value="procurement-requests" className="m-0">
      <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
        <div className="flex gap-2 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
            <Input
              placeholder="搜索采购请求号、来源询价、需求编号..."
              value={procurementRequestSearchTerm}
              onChange={(e) => setProcurementRequestSearchTerm(e.target.value)}
              className="pl-7 h-8 text-xs border-gray-300"
            />
          </div>
          {selectedProcurementRequestIds.length > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleBatchDeleteProcurementRequests}
              className="h-8 text-xs px-3 border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" />
              批量删除 ({selectedProcurementRequestIds.length})
            </Button>
          )}
        </div>
      </div>

      <div className="px-3 py-3">
        <p className="text-[14px] text-gray-600 mb-2">共 {filteredProcurementRequests.length} 条采购请求</p>
        {filteredProcurementRequests.length === 0 && purchaseOrders.filter((po) => isProcurementRequestRecord(po)).length > 0 && (
          <div className="mb-2 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
            当前筛选条件下无数据，已保留采购请求。请清空搜索后查看全部。
          </div>
        )}
        <div className="border border-gray-200 rounded overflow-hidden bg-white">
          <table className="w-full text-[14px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-center py-1.5 px-2 font-medium text-gray-700 w-10">
                  <input
                    type="checkbox"
                    className="w-4 h-4 cursor-pointer appearance-none border-2 border-gray-600 bg-white rounded checked:bg-white checked:border-gray-600 checked:after:content-['✓'] checked:after:text-gray-600 checked:after:text-xs checked:after:flex checked:after:items-center checked:after:justify-center"
                    checked={selectedProcurementRequestIds.length === filteredProcurementRequests.length && filteredProcurementRequests.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedProcurementRequestIds(filteredProcurementRequests.map((o) => o.id));
                      } else {
                        setSelectedProcurementRequestIds([]);
                      }
                    }}
                  />
                </th>
                <th className="text-center py-1.5 px-2 font-medium text-gray-700 w-12">#</th>
                <th className="text-left py-2 px-3 font-medium text-gray-600">采购请求号</th>
                <th className="text-left py-2 px-3 font-medium text-gray-600">来源</th>
                <th className="text-left py-2 px-3 font-medium text-gray-600">产品数量</th>
                <th className="text-left py-2 px-3 font-medium text-gray-600">状态</th>
                <th className="text-center py-2 px-3 font-medium text-gray-600">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredProcurementRequests.map((po, idx) => {
                const runtimeStatus = getProcurementRequestRuntimeStatus(po);
                const lockedByDownstream = hasDownstreamPOForProcurementRequest(po);
                const projectBaseline = extractProjectExecutionBaseline(po);
                return (
                  <tr key={po.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                    <td className="py-2 px-2 text-center">
                      <input
                        type="checkbox"
                        className="w-4 h-4 cursor-pointer appearance-none border-2 border-gray-600 bg-white rounded checked:bg-white checked:border-gray-600 checked:after:content-['✓'] checked:after:text-gray-600 checked:after:text-xs checked:after:flex checked:after:items-center checked:after:justify-center"
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
                    <td className="py-2 px-2 text-center text-gray-500">{idx + 1}</td>
                    <td className="py-2 px-2">
                      <div className="font-semibold text-purple-600">{normalizeCGNumberForDisplay(po.poNumber || '')}</div>
                      <div className="text-xs text-gray-500">申请时间: {new Date(po.orderDate || po.createdDate || Date.now()).toLocaleString()}</div>
                    </td>
                    <td className="py-2 px-2">
                      <div className="text-sm text-gray-700">询价: {resolveInquirySourceRef(po) || ''}</div>
                      <div className="text-xs text-gray-500">需求: {getRequirementNoFromPO(po) || ''}</div>
                      {projectBaseline && (
                        <div className="text-xs text-indigo-600 mt-0.5">
                          基线: {projectBaseline.projectCode ? `${projectBaseline.projectCode} · ` : ''}{projectBaseline.projectName || 'Project'} / Rev {projectBaseline.projectRevisionCode || '-'} / QT {projectBaseline.finalQuotationNumber || '-'}
                        </div>
                      )}
                    </td>
                    <td className="py-2 px-2">
                      <span className="font-semibold">{po.items?.length || 0} 个产品</span>
                      <div className="text-xs text-gray-500">共 {(po.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0).toLocaleString()} 件</div>
                    </td>
                    <td className="py-2 px-2">
                      {runtimeStatus === 'allocated_completed' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs border bg-green-50 text-green-700 border-green-200">{getProcurementRequestStatusText(runtimeStatus)}</span>
                      ) : runtimeStatus === 'partial_allocated' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs border bg-blue-50 text-blue-700 border-blue-200">{getProcurementRequestStatusText(runtimeStatus)}</span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs border bg-amber-50 text-amber-700 border-amber-200">{getProcurementRequestStatusText(runtimeStatus)}</span>
                      )}
                    </td>
                    <td className="py-2 px-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button size="sm" variant="outline" onClick={() => handleViewPODocument(po)} className="h-7 px-2 text-xs" title="查看采购请求详情">
                          <Eye className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => openSupplierAllocationDialog(po)}
                          disabled={runtimeStatus === 'allocated_completed'}
                          className="h-7 px-2 text-xs bg-[#F96302] hover:bg-[#E05502] disabled:opacity-50 disabled:cursor-not-allowed"
                          title="按产品行分配供应商并生成采购订单草稿"
                        >
                          {runtimeStatus === 'allocated_completed' ? '已分配完成' : runtimeStatus === 'partial_allocated' ? '继续分配' : '分配供应商'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteProcurementRequest(po)}
                          disabled={lockedByDownstream}
                          className="h-7 px-2 text-xs border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          title={lockedByDownstream ? '已存在下游采购单(PO)，不可删除上游采购请求' : '删除采购请求'}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </TabsContent>
  );
};
