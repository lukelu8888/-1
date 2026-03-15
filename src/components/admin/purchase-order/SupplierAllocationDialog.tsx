import React from 'react';
import { Search } from 'lucide-react';
import { Supplier } from '../../../data/suppliersData';
import { PurchaseOrder as PurchaseOrderType, PurchaseOrderItem } from '../../../contexts/PurchaseOrderContext';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../ui/dialog';
import { getFormalBusinessModelNo } from '../../../utils/productModelDisplay';

type SupplierAllocationDialogProps = {
  showAllocationDialog: boolean;
  setShowAllocationDialog: React.Dispatch<React.SetStateAction<boolean>>;
  allocationPO: PurchaseOrderType | null;
  setAllocationPO: React.Dispatch<React.SetStateAction<PurchaseOrderType | null>>;
  resolveInquirySourceRef: (po: PurchaseOrderType) => string;
  getRequirementNoFromPO: (po: PurchaseOrderType) => string;
  allocatedProductTokensInDialog: Set<string>;
  getProductMatchToken: (item: PurchaseOrderItem, idx: number) => string;
  getPOProductAllocationKey: (item: PurchaseOrderItem, idx: number) => string;
  allocationSelectedProductKeys: string[];
  toggleAllAllocationProducts: (checked: boolean) => void;
  toggleAllocationProduct: (productKey: string, checked: boolean) => void;
  allocationSelectedSupplierCodes: string[];
  allocationSupplierSearchTerm: string;
  setAllocationSupplierSearchTerm: React.Dispatch<React.SetStateAction<string>>;
  filteredAllocationSuppliers: Supplier[];
  toggleAllocationSupplier: (supplierCode: string, checked: boolean) => void;
  submittingAllocation: boolean;
  submitSupplierAllocation: () => void;
};

export const SupplierAllocationDialog: React.FC<SupplierAllocationDialogProps> = ({
  showAllocationDialog,
  setShowAllocationDialog,
  allocationPO,
  setAllocationPO,
  resolveInquirySourceRef,
  getRequirementNoFromPO,
  allocatedProductTokensInDialog,
  getProductMatchToken,
  getPOProductAllocationKey,
  allocationSelectedProductKeys,
  toggleAllAllocationProducts,
  toggleAllocationProduct,
  allocationSelectedSupplierCodes,
  allocationSupplierSearchTerm,
  setAllocationSupplierSearchTerm,
  filteredAllocationSuppliers,
  toggleAllocationSupplier,
  submittingAllocation,
  submitSupplierAllocation,
}) => {
  return (
    <Dialog open={showAllocationDialog} onOpenChange={setShowAllocationDialog}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>创建采购单草稿 - 分配供应商</DialogTitle>
          <DialogDescription>
            选择供应商并分配产品数量，系统将生成CG采购单草稿并提交老板审核。
          </DialogDescription>
        </DialogHeader>

        {allocationPO && (
          <div className="space-y-4">
            <div className="rounded border border-gray-200 bg-gray-50 p-4">
              <h4 className="mb-3 text-[16px] font-semibold text-gray-900">📋 采购需求信息</h4>
              <div className="mb-3 grid grid-cols-2 gap-3 text-[15px]">
                <div>
                  <span className="text-gray-600">采购单号:</span>
                  <span className="ml-2 font-semibold">{allocationPO.poNumber}</span>
                </div>
                <div>
                  <span className="text-gray-600">来源询价:</span>
                  <span className="ml-2 font-semibold">{resolveInquirySourceRef(allocationPO) || '-'}</span>
                </div>
                <div>
                  <span className="text-gray-600">来源需求:</span>
                  <span className="ml-2 font-semibold">{getRequirementNoFromPO(allocationPO) || '-'}</span>
                </div>
                <div>
                  <span className="text-gray-600">产品数量:</span>
                  <span className="ml-2 font-semibold">{allocationPO.items?.length || 0} 项</span>
                </div>
              </div>
              <div className="overflow-x-auto rounded border border-gray-200 bg-white">
                <table className="w-full text-[16px]">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="w-12 py-2 text-center">
                        <input
                          type="checkbox"
                          className="h-5 w-5"
                          checked={
                            (allocationPO.items || []).filter((item, idx) => !allocatedProductTokensInDialog.has(getProductMatchToken(item, idx))).length > 0 &&
                            allocationSelectedProductKeys.length ===
                              (allocationPO.items || []).filter((item, idx) => !allocatedProductTokensInDialog.has(getProductMatchToken(item, idx))).length
                          }
                          onChange={(e) => toggleAllAllocationProducts(e.target.checked)}
                        />
                      </th>
                      <th className="w-10 py-2 text-center">#</th>
                      <th className="py-2 text-left">产品名称</th>
                      <th className="py-2 text-left">型号</th>
                      <th className="py-2 text-right">数量</th>
                      <th className="py-2 text-left">单位</th>
                      <th className="py-2 text-center">分配状态</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(allocationPO.items || []).map((item, idx) => {
                      const key = getPOProductAllocationKey(item, idx);
                      const token = getProductMatchToken(item, idx);
                      const isAllocated = allocatedProductTokensInDialog.has(token);
                      const checked = allocationSelectedProductKeys.includes(key);
                      return (
                        <tr key={key} className="border-t border-gray-100">
                          <td className="py-2 text-center">
                            <input
                              type="checkbox"
                              className="h-5 w-5"
                              checked={checked}
                              disabled={isAllocated}
                              onChange={(e) => toggleAllocationProduct(key, e.target.checked)}
                            />
                          </td>
                          <td className="py-2 text-center">{idx + 1}</td>
                          <td className="py-2">{item.productName}</td>
                          <td className="py-2 text-gray-600">{getFormalBusinessModelNo(item)}</td>
                          <td className="py-2 text-right font-semibold">{item.quantity}</td>
                          <td className="py-2">{item.unit}</td>
                          <td className="py-2 text-center">
                            {isAllocated ? (
                              <span className="inline-flex items-center rounded border border-green-200 bg-green-50 px-2 py-0.5 text-xs text-green-700">
                                已分配
                              </span>
                            ) : (
                              <span className="inline-flex items-center rounded border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs text-amber-700">
                                待分配
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded border border-gray-200 p-3">
              <h5 className="mb-2 text-sm font-semibold text-gray-900">选择供应商 * ({allocationSelectedSupplierCodes.length} 个已选)</h5>
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  value={allocationSupplierSearchTerm}
                  onChange={(e) => setAllocationSupplierSearchTerm(e.target.value)}
                  className="h-10 pl-9 text-sm"
                  placeholder="搜索供应商名称、产品名称、产品类别..."
                />
              </div>
              <div className="space-y-2 rounded border border-gray-200 bg-white p-2">
                {filteredAllocationSuppliers.map((supplier) => {
                  const code = String(supplier.code || '');
                  const checked = allocationSelectedSupplierCodes.includes(code);
                  return (
                    <div key={code} className="flex items-center justify-between rounded border border-gray-100 px-3 py-2">
                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          className="h-5 w-5"
                          checked={checked}
                          onChange={(e) => toggleAllocationSupplier(code, e.target.checked)}
                        />
                        <div>
                          <p className="text-base font-semibold text-gray-900">{supplier.name}</p>
                          <p className="text-sm text-gray-600">
                            {supplier.code} | {supplier.email}
                          </p>
                        </div>
                      </label>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100">{supplier.level || 'A级'}</Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="mt-2 text-sm text-gray-500">可以选择多个供应商进行分配</p>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-gray-200 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowAllocationDialog(false);
                  setAllocationPO(null);
                }}
              >
                取消
              </Button>
              <Button type="button" disabled={submittingAllocation} className="bg-blue-600 text-white hover:bg-blue-700" onClick={submitSupplierAllocation}>
                {submittingAllocation ? '创建中...' : '创建采购单草稿'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
