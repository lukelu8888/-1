import React, { useMemo } from 'react';
import { Building2, Eye, Search } from 'lucide-react';
import { Supplier } from '../../../data/suppliersData';
import { PurchaseRequirement } from '../../../contexts/PurchaseRequirementContext';
import { Button } from '../../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../ui/dialog';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';
import { DatePicker } from '../../ui/date-picker';

type CreateXJAndHistoryDialogsProps = {
  showCreateRFQDialog: boolean;
  setShowCreateRFQDialog: React.Dispatch<React.SetStateAction<boolean>>;
  selectedRequirementForRFQ: PurchaseRequirement | null;
  selectedProductIds: string[];
  setSelectedProductIds: React.Dispatch<React.SetStateAction<string[]>>;
  selectedSuppliers: Supplier[];
  setSelectedSuppliers: React.Dispatch<React.SetStateAction<Supplier[]>>;
  supplierSearchTerm: string;
  setSupplierSearchTerm: React.Dispatch<React.SetStateAction<string>>;
  allSuppliers: Supplier[];
  handlePreviewRFQ: (supplier: Supplier) => void;
  xjDeadline: Date | undefined;
  setXJDeadline: React.Dispatch<React.SetStateAction<Date | undefined>>;
  xjRemarks: string;
  setRFQRemarks: React.Dispatch<React.SetStateAction<string>>;
  handleSubmitXJ: () => void;
  submittingXJ: boolean;
  showRFQHistoryDialog: boolean;
  setShowRFQHistoryDialog: React.Dispatch<React.SetStateAction<boolean>>;
  selectedProductForHistory: any;
  setSelectedProductForHistory: React.Dispatch<React.SetStateAction<any>>;
};

export const CreateXJAndHistoryDialogs: React.FC<CreateXJAndHistoryDialogsProps> = ({
  showCreateRFQDialog,
  setShowCreateRFQDialog,
  selectedRequirementForRFQ,
  selectedProductIds,
  setSelectedProductIds,
  selectedSuppliers,
  setSelectedSuppliers,
  supplierSearchTerm,
  setSupplierSearchTerm,
  allSuppliers,
  handlePreviewRFQ,
  xjDeadline,
  setXJDeadline,
  xjRemarks,
  setRFQRemarks,
  handleSubmitXJ,
  submittingXJ,
  showRFQHistoryDialog,
  setShowRFQHistoryDialog,
  selectedProductForHistory,
  setSelectedProductForHistory,
}) => {
  const filteredSuppliers = useMemo(() => {
    if (!supplierSearchTerm) return allSuppliers;
    const kw = supplierSearchTerm.trim().toLowerCase();
    return allSuppliers.filter((s) => {
      const hay = [
        s.name,
        s.nameEn,
        s.category,
        s.code,
        s.region,
        s.contact,
        s.email,
        s.phone,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(kw);
    });
  }, [supplierSearchTerm, allSuppliers]);

  return (
    <>
      <Dialog open={showCreateRFQDialog} onOpenChange={setShowCreateRFQDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="border-b border-gray-200 pb-4">
            <DialogTitle className="text-base">创建询价单 - 采购询价</DialogTitle>
            <DialogDescription className="text-xs">选择供应商并设置询价参数，系统将向每个供应商发送包含所有产品的询价单</DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto py-4 space-y-4">
            {selectedRequirementForRFQ && (
              <div className="bg-gray-50 border border-gray-200 rounded p-4">
                <h4 className="text-xs font-semibold text-gray-900 mb-3">📋 采购需求信息</h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div><span className="text-gray-600">需求编号:</span><span className="ml-2 font-semibold text-gray-900">{selectedRequirementForRFQ.requirementNo}</span></div>
                  <div><span className="text-gray-600">客户:</span><span className="ml-2 font-semibold text-gray-900">{selectedRequirementForRFQ.customerName}</span></div>
                  <div><span className="text-gray-600">要求日期:</span><span className="ml-2 font-semibold text-gray-900">{selectedRequirementForRFQ.requiredDate}</span></div>
                  <div><span className="text-gray-600">产品数量:</span><span className="ml-2 font-semibold text-gray-900">{selectedRequirementForRFQ.items?.length || 0} 项</span></div>
                </div>

                <div className="mt-3">
                  <div className="text-xs font-semibold text-gray-700 mb-2">产品明细:</div>
                  <div className="bg-white border border-gray-200 rounded">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-center py-1.5 px-2 font-medium text-gray-700 w-10">
                            <input
                              type="checkbox"
                              className="w-4 h-4 cursor-pointer"
                              checked={selectedProductIds.length === selectedRequirementForRFQ.items?.length && selectedProductIds.length > 0}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedProductIds(
                                    selectedRequirementForRFQ.items?.map((item, idx) =>
                                      (item.id && item.id !== 'undefined') ? String(item.id) : `item_idx_${idx}`
                                    ) || []
                                  );
                                } else {
                                  setSelectedProductIds([]);
                                }
                              }}
                            />
                          </th>
                          <th className="text-center py-1.5 px-2 font-medium text-gray-700 w-10">#</th>
                          <th className="text-left py-1.5 px-2 font-medium text-gray-700">产品名称</th>
                          <th className="text-left py-1.5 px-2 font-medium text-gray-700">型号</th>
                          <th className="text-right py-1.5 px-2 font-medium text-gray-700">数量</th>
                          <th className="text-left py-1.5 px-2 font-medium text-gray-700">单位</th>
                          <th className="text-center py-1.5 px-2 font-medium text-gray-700">询价状态</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedRequirementForRFQ.items?.map((item, idx) => {
                          // 用 idx 作为兜底，防止 item.id 为 undefined 导致所有行共享同一 key/id
                          const itemKey = (item.id && item.id !== 'undefined') ? String(item.id) : `item_idx_${idx}`;
                          return (
                          <tr key={itemKey} className="border-t border-gray-100 hover:bg-gray-50">
                            <td className="py-1.5 px-2 text-center">
                              <input
                                type="checkbox"
                                className="w-4 h-4 cursor-pointer"
                                checked={selectedProductIds.includes(itemKey)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedProductIds([...selectedProductIds, itemKey]);
                                  } else {
                                    setSelectedProductIds(selectedProductIds.filter((id) => id !== itemKey));
                                  }
                                }}
                              />
                            </td>
                            <td className="py-1.5 px-2 text-center text-gray-600">{idx + 1}</td>
                            <td className="py-1.5 px-2">{item.productName}</td>
                            <td className="py-1.5 px-2 text-gray-600">{item.modelNo}</td>
                            <td className="py-1.5 px-2 text-right font-semibold">{item.quantity}</td>
                            <td className="py-1.5 px-2 text-gray-600">{item.unit}</td>
                            <td className="py-1.5 px-2 text-center">
                              {(item as any).xjHistory && (item as any).xjHistory.length > 0 ? (
                                <button
                                  onClick={() => {
                                    setSelectedProductForHistory(item);
                                    setShowRFQHistoryDialog(true);
                                  }}
                                  className="text-xs px-2 py-0.5 bg-green-50 text-green-700 border border-green-200 rounded hover:bg-green-100 transition-colors cursor-pointer"
                                >
                                  已发送
                                </button>
                              ) : (
                                <span className="text-xs text-gray-400">-</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            <div>
              <Label className="text-xs font-semibold text-gray-900 mb-2 block">选择供应商 * ({selectedSuppliers.length} 个已选)</Label>
              <div className="mb-3 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="搜索供应商名称、产品名称、产品类别..."
                  value={supplierSearchTerm}
                  onChange={(e) => setSupplierSearchTerm(e.target.value)}
                  className="pl-9 text-xs h-9"
                />
              </div>

              <div className="border border-gray-300 rounded p-3 bg-white max-h-60 overflow-y-auto">
                {filteredSuppliers.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 text-xs">未找到匹配的供应商</div>
                ) : (
                  <div className="space-y-2">
                    {filteredSuppliers.map((supplier) => (
                      <div key={supplier.code} className={`flex items-center justify-between p-2 border rounded transition-colors ${selectedSuppliers.some((s) => s.code === supplier.code) ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                        <div
                          className="flex items-center gap-2 flex-1 cursor-pointer"
                          onClick={() => {
                            if (selectedSuppliers.some((s) => s.code === supplier.code)) {
                              setSelectedSuppliers(selectedSuppliers.filter((s) => s.code !== supplier.code));
                            } else {
                              setSelectedSuppliers([...selectedSuppliers, supplier]);
                            }
                          }}
                        >
                          <input type="checkbox" checked={selectedSuppliers.some((s) => s.code === supplier.code)} onChange={() => {}} className="w-4 h-4" />
                          <div>
                            <div className="text-xs font-semibold text-gray-900">{supplier.name}</div>
                            <div className="text-xs text-gray-600">{supplier.code} | {supplier.email}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-xs ${supplier.level === 'A' ? 'bg-green-100 text-green-700' : supplier.level === 'B' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>{supplier.level}级</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePreviewRFQ(supplier);
                            }}
                            className="h-7 text-xs px-2 flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3" />
                            预览
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">💡 可以选择多个供应商进行询价对比</p>
            </div>

            <div>
              <Label className="text-xs font-semibold text-gray-900 mb-2 block">报价截止日期 *</Label>
              <DatePicker date={xjDeadline} onSelect={setXJDeadline} placeholder="选择截止日期" minDate={new Date()} className="text-xs h-9" />
              <p className="text-xs text-gray-500 mt-1">供应商需要在此日期前提交报价</p>
            </div>

            <div>
              <Label className="text-xs font-semibold text-gray-900 mb-2 block">备注说明</Label>
              <Textarea
                value={xjRemarks}
                onChange={(e) => setRFQRemarks(e.target.value)}
                placeholder="向供应商说明特殊要求、注意事项等..."
                rows={3}
                className="text-xs resize-none"
              />
            </div>
          </div>

          <DialogFooter className="border-t border-gray-200 pt-4">
            <Button variant="outline" onClick={() => setShowCreateRFQDialog(false)} className="text-xs">取消</Button>
            <Button onClick={handleSubmitXJ} disabled={submittingXJ || selectedSuppliers.length === 0 || !xjDeadline} className="bg-blue-600 hover:bg-blue-700 text-xs">
              {submittingXJ ? '创建中...' : `创建询价单 (${selectedSuppliers.length} 个供应商)`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showRFQHistoryDialog} onOpenChange={setShowRFQHistoryDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader className="border-b border-gray-200 pb-4">
            <DialogTitle className="text-base">询价历史记录</DialogTitle>
            <DialogDescription className="text-xs">{selectedProductForHistory?.productName} - {selectedProductForHistory?.modelNo}</DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {selectedProductForHistory?.xjHistory && selectedProductForHistory.xjHistory.length > 0 ? (
              <div className="space-y-3">
                {selectedProductForHistory.xjHistory.map((history: any, idx: number) => (
                  <div key={idx} className="bg-gray-50 border border-gray-200 rounded p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-gray-900">询价批次 #{history.batchNo || idx + 1}</span>
                        <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">{history.supplierCount} 家供应商</span>
                      </div>
                      <span className="text-xs text-gray-600">{history.sentDate}</span>
                    </div>

                    <div className="text-xs text-gray-700 mb-2"><span className="font-medium">发送至：</span></div>

                    <div className="space-y-1.5">
                      {history.suppliers.map((supplier: any, sIdx: number) => (
                        <div key={sIdx} className="flex items-center justify-between bg-white border border-gray-200 rounded px-2 py-1.5">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-3.5 h-3.5 text-gray-400" />
                            <span className="text-xs font-medium text-gray-900">{supplier.name}</span>
                            <span className="text-xs text-gray-500">{supplier.code}</span>
                          </div>
                          <span className={`text-xs px-1.5 py-0.5 rounded ${supplier.level === 'A' ? 'bg-green-100 text-green-700' : supplier.level === 'B' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                            {supplier.level}级
                          </span>
                        </div>
                      ))}
                    </div>

                    {history.remarks && (
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <span className="text-xs text-gray-600">备注：{history.remarks}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 text-xs">暂无询价历史记录</div>
            )}
          </div>

          <DialogFooter className="border-t border-gray-200 pt-4">
            <Button variant="outline" onClick={() => setShowRFQHistoryDialog(false)} className="text-xs">关闭</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
