import React from 'react';
import { CheckCircle2, Edit, Eye, Plus, Search, Send, Trash2 } from 'lucide-react';
import { PurchaseOrder as PurchaseOrderType } from '../../../contexts/PurchaseOrderContext';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { TabsContent } from '../../ui/tabs';
import { extractProjectExecutionBaseline, getPOStatusConfig } from './purchaseOrderUtils';

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
  handlePushPurchaseToSupplier: (po: PurchaseOrderType) => void;
  handleApplyBossApproval: (po: PurchaseOrderType) => void;
  handleDeletePurchaseOrder: (po: PurchaseOrderType) => void;
  normalizeCGNumberForDisplay: (value: string) => string;
  resolveInquirySourceRef: (po: PurchaseOrderType) => string;
  getRequirementNoFromPO: (po: PurchaseOrderType) => string;
};

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
  handlePushPurchaseToSupplier,
  handleApplyBossApproval,
  handleDeletePurchaseOrder,
  normalizeCGNumberForDisplay,
  resolveInquirySourceRef,
  getRequirementNoFromPO,
}) => {
  return (
    <TabsContent value="orders" className="m-0">
      <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
        <div className="flex gap-2 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
            <Input
              placeholder="搜索采购单号、供应商、需求编号..."
              value={orderSearchTerm}
              onChange={(e) => setOrderSearchTerm(e.target.value)}
              className="pl-7 h-8 text-xs border-gray-300"
            />
          </div>
          {selectedOrderIds.length > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleBatchDeleteOrders}
              className="h-8 text-xs px-3 border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" />
              批量删除 ({selectedOrderIds.length})
            </Button>
          )}
          <Button variant="default" size="sm" className="h-8 text-xs px-3 bg-purple-600 hover:bg-purple-700" onClick={handleCreateOrder}>
            <Plus className="w-3 h-3 mr-1" />
            新建采购单
          </Button>
        </div>
      </div>

      <div className="px-3 py-3">
        <p className="text-[14px] text-gray-600 mb-2">共 {filteredOrders.length} 条采购订单</p>
        <div className="border border-gray-200 rounded overflow-hidden bg-white">
          <table className="w-full text-[14px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-center py-1.5 px-2 font-medium text-gray-700 w-10">
                  <input
                    type="checkbox"
                    className="w-4 h-4 cursor-pointer appearance-none border-2 border-gray-600 bg-white rounded checked:bg-white checked:border-gray-600 checked:after:content-['✓'] checked:after:text-gray-600 checked:after:text-xs checked:after:flex checked:after:items-center checked:after:justify-center"
                    checked={selectedOrderIds.length === filteredOrders.length && filteredOrders.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedOrderIds(filteredOrders.map((o) => o.id));
                      } else {
                        setSelectedOrderIds([]);
                      }
                    }}
                  />
                </th>
                <th className="text-center py-1.5 px-2 font-medium text-gray-700 w-12">#</th>
                <th className="text-left py-2 px-3 font-medium text-gray-600">采购单号</th>
                <th className="text-left py-2 px-3 font-medium text-gray-600">供应商</th>
                <th className="text-left py-2 px-3 font-medium text-gray-600">区域</th>
                <th className="text-left py-2 px-3 font-medium text-gray-600">产品数量</th>
                <th className="text-left py-2 px-3 font-medium text-gray-600">报价期限</th>
                <th className="text-left py-2 px-3 font-medium text-gray-600">状态</th>
                <th className="text-center py-2 px-3 font-medium text-gray-600">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((po, idx) => {
                const reqStatus = String((po as any).procurementRequestStatus || '');
                const projectBaseline = extractProjectExecutionBaseline(po);
                const statusConfig =
                  reqStatus === 'pending_boss_approval'
                    ? { label: '提交审核状态', color: 'bg-amber-50 text-amber-700 border-amber-200' }
                    : reqStatus === 'approved_boss'
                      ? { label: '审核通过', color: 'bg-green-50 text-green-700 border-green-200' }
                      : reqStatus === 'rejected_boss'
                        ? { label: '审核驳回', color: 'bg-red-50 text-red-700 border-red-200' }
                        : getPOStatusConfig(po.status as any);

                const regionConfig =
                  po.region === 'North America' || po.region === 'NA'
                    ? { label: 'NA', color: 'bg-blue-100 text-blue-700' }
                    : po.region === 'South America' || po.region === 'SA'
                      ? { label: 'SA', color: 'bg-green-100 text-green-700' }
                      : po.region === 'Europe & Africa' || po.region === 'EA'
                        ? { label: 'EA', color: 'bg-purple-100 text-purple-700' }
                        : null;

                return (
                  <tr key={po.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                    <td className="py-2 px-2 text-center">
                      <input
                        type="checkbox"
                        className="w-4 h-4 cursor-pointer appearance-none border-2 border-gray-600 bg-white rounded checked:bg-white checked:border-gray-600 checked:after:content-['✓'] checked:after:text-gray-600 checked:after:text-xs checked:after:flex checked:after:items-center checked:after:justify-center"
                        checked={selectedOrderIds.includes(po.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedOrderIds([...selectedOrderIds, po.id]);
                          } else {
                            setSelectedOrderIds(selectedOrderIds.filter((id) => id !== po.id));
                          }
                        }}
                      />
                    </td>
                    <td className="py-2 px-2 text-center text-gray-500">{idx + 1}</td>
                    <td className="py-3 px-3">
                      <button onClick={() => handleViewPODocument(po)} className="text-purple-600 hover:text-purple-700 font-medium hover:underline text-xs">
                        {normalizeCGNumberForDisplay(po.poNumber)}
                      </button>
                      <div className="text-[11px] text-gray-500 mt-0.5">
                        来源: {resolveInquirySourceRef(po)}
                        {getRequirementNoFromPO(po) ? ` · ${getRequirementNoFromPO(po)}` : ''}
                      </div>
                      {projectBaseline && (
                        <div className="text-[11px] text-indigo-600 mt-0.5">
                          基线: {projectBaseline.projectCode ? `${projectBaseline.projectCode} · ` : ''}{projectBaseline.projectName || 'Project'} / Rev {projectBaseline.projectRevisionCode || '-'} / QT {projectBaseline.finalQuotationNumber || '-'}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-3">
                      <div className="text-gray-900">{po.supplierName}</div>
                      {po.supplierCode && <div className="text-[11px] text-gray-500 mt-0.5">{po.supplierCode}</div>}
                    </td>

                    <td className="py-3 px-3">
                      {regionConfig ? (
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[12px] font-medium ${regionConfig.color}`}>{regionConfig.label}</span>
                      ) : (
                        <span className="text-gray-400 text-[12px]">-</span>
                      )}
                    </td>

                    <td className="py-3 px-3">
                      {po.items && po.items.length > 0 ? (
                        <>
                          <div className="text-gray-900">{po.items.length}个产品</div>
                          <div className="text-[12px] text-gray-500">共 {po.items.reduce((sum, item) => sum + item.quantity, 0).toLocaleString()} 件</div>
                        </>
                      ) : (
                        <div className="text-gray-400">-</div>
                      )}
                    </td>

                    <td className="py-3 px-3">
                      <div className="text-gray-900">{po.expectedDate}</div>
                      {po.actualDate && <div className="text-[12px] text-green-600">实: {po.actualDate}</div>}
                    </td>

                    <td className="py-3 px-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-[12px] font-medium border ${statusConfig.color}`}>{statusConfig.label}</span>
                    </td>

                    <td className="py-3 px-3">
                      <div className="flex gap-1 justify-center">
                        <button onClick={() => handleViewPODocument(po)} className="p-1 hover:bg-gray-100 rounded transition-colors" title="查看采购订单文档">
                          <Eye className="w-4 h-4 text-gray-600" />
                        </button>
                        <button onClick={() => handleOpenEditPO(po)} className="px-2 py-1 rounded border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors inline-flex items-center gap-1 text-[11px]" title="编辑采购订单">
                          <Edit className="w-3 h-3" />编辑
                        </button>
                        {(() => {
                          const canPushToSupplier = reqStatus === 'approved_boss';
                          const pushedToSupplier = reqStatus === 'pushed_supplier';
                          const pushTitle =
                            reqStatus === 'pending_procurement_assignment'
                              ? '请先完成供应商分配'
                              : reqStatus === 'draft_allocated' || reqStatus === ''
                                ? '请先申请审核，审核通过后才能下推供应商'
                                : reqStatus === 'pending_boss_approval'
                                  ? '待上级审核通过后可下推供应商'
                                  : reqStatus === 'rejected_boss'
                                    ? '审核驳回，请调整后重新申请'
                                    : pushedToSupplier
                                      ? '已下推给供应商'
                                      : '下推供应商';
                          return (
                            <button
                              onClick={() => handlePushPurchaseToSupplier(po)}
                              disabled={!canPushToSupplier}
                              className={`px-2 py-1 rounded border transition-colors inline-flex items-center gap-1 text-[11px] disabled:cursor-not-allowed ${
                                pushedToSupplier
                                  ? 'border-gray-200 bg-gray-100 text-gray-500'
                                  : canPushToSupplier
                                    ? 'border-blue-200 text-blue-600 hover:bg-blue-50'
                                    : 'border-gray-200 text-gray-400 bg-gray-50'
                              }`}
                              title={pushTitle}
                            >
                              <Send className="w-3 h-3" />
                              {pushedToSupplier ? '已下推供应商' : '下推供应商'}
                            </button>
                          );
                        })()}
                        {(() => {
                          const pushedToSupplier = reqStatus === 'pushed_supplier';
                          if (pushedToSupplier) return null;

                          const isPendingApproval = reqStatus === 'pending_boss_approval';
                          const isApproved = reqStatus === 'approved_boss';
                          const buttonText = isPendingApproval ? '审核中' : isApproved ? '已审核' : '申请审核';
                          const buttonTitle = isPendingApproval ? '该采购单正在等待上级审核' : isApproved ? '该采购单已审核通过' : '提交老板审核';

                          return (
                            <button
                              onClick={() => handleApplyBossApproval(po)}
                              disabled={isPendingApproval}
                              className={`px-2 py-1 rounded border transition-colors inline-flex items-center gap-1 text-[11px] ${
                                isPendingApproval
                                  ? 'border-amber-200 text-amber-500 bg-amber-50 cursor-not-allowed'
                                  : isApproved
                                    ? 'border-green-200 text-green-700 bg-green-50 hover:bg-green-100'
                                    : 'border-amber-200 text-amber-700 hover:bg-amber-50'
                              }`}
                              title={buttonTitle}
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              {buttonText}
                            </button>
                          );
                        })()}
                        <button onClick={() => handleDeletePurchaseOrder(po)} className="p-1 hover:bg-red-50 rounded transition-colors border border-red-300 text-red-600" title="删除采购订单">
                          <Trash2 className="w-4 h-4" />
                        </button>
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
