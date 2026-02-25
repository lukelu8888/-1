import React from 'react';
import { AlertCircle, Plus, Search } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { Supplier } from '../../../data/suppliersData';
import { PurchaseRequirement } from '../../../contexts/PurchaseRequirementContext';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Textarea } from '../../ui/textarea';
import { CreateOrderFormState } from './purchaseOrderEditConfig';

type PurchaseOrderCreateDialogsProps = {
  showCreateOrderDialog: boolean;
  setShowCreateOrderDialog: React.Dispatch<React.SetStateAction<boolean>>;
  selectedRequirement: PurchaseRequirement | null;
  createOrderForm: CreateOrderFormState;
  setCreateOrderForm: React.Dispatch<React.SetStateAction<CreateOrderFormState>>;
  productPrices: { [itemId: string]: string };
  setProductPrices: React.Dispatch<React.SetStateAction<{ [itemId: string]: string }>>;
  handleSubmitCreateOrder: () => void;
  showSupplierDialog: boolean;
  setShowSupplierDialog: React.Dispatch<React.SetStateAction<boolean>>;
  supplierSearchTerm: string;
  setSupplierSearchTerm: React.Dispatch<React.SetStateAction<string>>;
  allSuppliers: Supplier[];
};

export const PurchaseOrderCreateDialogs: React.FC<PurchaseOrderCreateDialogsProps> = ({
  showCreateOrderDialog,
  setShowCreateOrderDialog,
  selectedRequirement,
  createOrderForm,
  setCreateOrderForm,
  productPrices,
  setProductPrices,
  handleSubmitCreateOrder,
  showSupplierDialog,
  setShowSupplierDialog,
  supplierSearchTerm,
  setSupplierSearchTerm,
  allSuppliers,
}) => {
  const filteredActiveSuppliers = (supplierSearchTerm
    ? allSuppliers.filter((s) => {
        const kw = supplierSearchTerm.trim().toLowerCase();
        const hay = [s.name, s.nameEn, s.category, s.code, s.region, s.contact, s.email, s.phone]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return hay.includes(kw);
      })
    : allSuppliers
  ).filter((s) => s.status === 'active');

  return (
    <>
      <Dialog open={showCreateOrderDialog} onOpenChange={setShowCreateOrderDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle style={{ fontSize: '15px' }}>🛒 创建采购订单 - {selectedRequirement?.requirementNo}</DialogTitle>
            <DialogDescription style={{ fontSize: '12px' }}>Create Purchase Order from Requirement</DialogDescription>
          </DialogHeader>

          {selectedRequirement && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="grid grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-gray-600">需求编号：</span>
                    <span className="font-semibold text-gray-900 ml-1">{selectedRequirement.requirementNo}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">产品数：</span>
                    <span className="font-semibold text-gray-900 ml-1">{selectedRequirement.items?.length || 0} 个</span>
                  </div>
                  <div>
                    <span className="text-gray-600">型号：</span>
                    <span className="ml-1 text-gray-900">{selectedRequirement.requiredDate}</span>
                  </div>
                  {selectedRequirement.sourceRef && (
                    <div>
                      <span className="text-gray-600">来源：</span>
                      <span className="ml-1 text-blue-600 text-[10px]">{selectedRequirement.sourceRef}</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-gray-900 mb-2">📦 产品清单 & 采购单价</h4>
                <div className="border border-gray-200 rounded overflow-hidden">
                  <table className="w-full text-[10px]">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left py-1.5 px-2 font-medium text-gray-700">序号</th>
                        <th className="text-left py-1.5 px-2 font-medium text-gray-700">产品名称</th>
                        <th className="text-left py-1.5 px-2 font-medium text-gray-700">型号</th>
                        <th className="text-right py-1.5 px-2 font-medium text-gray-700">需求数量</th>
                        <th className="text-left py-1.5 px-2 font-medium text-gray-700">单位</th>
                        <th className="text-right py-1.5 px-2 font-medium text-gray-700 w-24">采购单价 *</th>
                        <th className="text-right py-1.5 px-2 font-medium text-gray-700">小计</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedRequirement.items?.map((item, idx) => {
                        const unitPrice = parseFloat(productPrices[item.id] || '0');
                        const subtotal = item.quantity * unitPrice;

                        return (
                          <tr key={item.id} className="border-b border-gray-100">
                            <td className="py-2 px-2 text-gray-600">{idx + 1}</td>
                            <td className="py-2 px-2 font-medium text-gray-900">{item.productName}</td>
                            <td className="py-2 px-2 text-gray-700 text-[9px]">{item.modelNo}</td>
                            <td className="py-2 px-2 text-right font-semibold text-gray-900">{item.quantity.toLocaleString()}</td>
                            <td className="py-2 px-2 text-gray-700">{item.unit}</td>
                            <td className="py-2 px-2">
                              <Input
                                type="number"
                                step="0.01"
                                value={productPrices[item.id] || ''}
                                onChange={(e) => setProductPrices({ ...productPrices, [item.id]: e.target.value })}
                                placeholder="0.00"
                                className="h-6 text-[10px] text-right"
                              />
                            </td>
                            <td className="py-2 px-2 text-right font-semibold text-gray-900">
                              {isNaN(subtotal) || subtotal === 0 ? '--' : subtotal.toFixed(2)}
                            </td>
                          </tr>
                        );
                      })}
                      <tr className="bg-gray-50 font-semibold">
                        <td colSpan={6} className="py-2 px-2 text-right text-gray-700">
                          预计总金额：
                        </td>
                        <td className="py-2 px-2 text-right text-gray-900">
                          {createOrderForm.currency}{' '}
                          {(() => {
                            const total =
                              selectedRequirement.items?.reduce((sum, item) => {
                                const price = parseFloat(productPrices[item.id] || '0');
                                return sum + item.quantity * price;
                              }, 0) || 0;
                            return isNaN(total) ? '--' : total.toFixed(2);
                          })()}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="text-[10px] text-gray-500 mt-1">💡 请为每个产品填写采购单价</p>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-gray-900">🏭 供应商信息</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <Label htmlFor="supplierName" className="text-xs">
                      供应商名称 <span className="text-red-500">*</span>
                    </Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        id="supplierName"
                        value={createOrderForm.supplierName}
                        onChange={(e) => setCreateOrderForm({ ...createOrderForm, supplierName: e.target.value })}
                        placeholder="请输入或从供应商库选择"
                        className="text-xs h-8 flex-1"
                      />
                      <Button type="button" variant="outline" size="sm" onClick={() => setShowSupplierDialog(true)} className="h-8 text-xs px-3">
                        <Search className="w-3 h-3 mr-1" />
                        选择
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="supplierCode" className="text-xs">供应商编码</Label>
                    <Input
                      id="supplierCode"
                      value={createOrderForm.supplierCode}
                      onChange={(e) => setCreateOrderForm({ ...createOrderForm, supplierCode: e.target.value })}
                      placeholder="可选"
                      className="mt-1 text-xs h-8"
                    />
                  </div>
                  <div>
                    <Label htmlFor="currency" className="text-xs">结算货币</Label>
                    <Select value={createOrderForm.currency} onValueChange={(value) => setCreateOrderForm({ ...createOrderForm, currency: value })}>
                      <SelectTrigger className="mt-1 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD" style={{ fontSize: '11px' }}>USD 美元</SelectItem>
                        <SelectItem value="EUR" style={{ fontSize: '11px' }}>EUR 欧元</SelectItem>
                        <SelectItem value="GBP" style={{ fontSize: '11px' }}>GBP 英镑</SelectItem>
                        <SelectItem value="CNY" style={{ fontSize: '11px' }}>CNY 人民币</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-gray-900">📄 采购条款</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <Label htmlFor="paymentTerms" className="text-xs">付款条款</Label>
                    <Input
                      id="paymentTerms"
                      value={createOrderForm.paymentTerms}
                      onChange={(e) => setCreateOrderForm({ ...createOrderForm, paymentTerms: e.target.value })}
                      className="mt-1 text-xs h-8"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="deliveryTerms" className="text-xs">交货条款</Label>
                    <Input
                      id="deliveryTerms"
                      value={createOrderForm.deliveryTerms}
                      onChange={(e) => setCreateOrderForm({ ...createOrderForm, deliveryTerms: e.target.value })}
                      className="mt-1 text-xs h-8"
                    />
                  </div>
                  <div>
                    <Label htmlFor="expectedDate" className="text-xs">期望交付日期</Label>
                    <Input
                      id="expectedDate"
                      type="date"
                      value={createOrderForm.expectedDate}
                      onChange={(e) => setCreateOrderForm({ ...createOrderForm, expectedDate: e.target.value })}
                      className="mt-1 text-xs h-8"
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="remarks" className="text-xs">备注说明</Label>
                <Textarea
                  id="remarks"
                  value={createOrderForm.remarks}
                  onChange={(e) => setCreateOrderForm({ ...createOrderForm, remarks: e.target.value })}
                  placeholder="订单备注..."
                  className="mt-1 text-xs min-h-[60px]"
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowCreateOrderDialog(false)} className="text-xs">
              取消
            </Button>
            <Button onClick={handleSubmitCreateOrder} className="bg-[#F96302] hover:bg-[#E05502] text-xs">
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              创建采购订单
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showSupplierDialog} onOpenChange={setShowSupplierDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle style={{ fontSize: '15px' }}>🏭 选择供应商</DialogTitle>
            <DialogDescription style={{ fontSize: '12px' }}>从供应商库中搜索并选择供应商</DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="搜索供应商名称、编码、联系人、类别、区域..."
                value={supplierSearchTerm}
                onChange={(e) => setSupplierSearchTerm(e.target.value)}
                className="pl-9 text-xs h-9"
              />
            </div>

            <div className="border border-gray-200 rounded overflow-hidden max-h-[400px] overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                  <tr>
                    <th className="text-left py-2 px-3 font-medium text-gray-700">等级</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-700">供应商编码</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-700">供应商名称</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-700">类别</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-700">区域</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-700">联系人</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-700">电话</th>
                    <th className="text-center py-2 px-3 font-medium text-gray-700">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredActiveSuppliers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 px-3 text-center text-gray-500">
                        <div className="flex flex-col items-center gap-2">
                          <AlertCircle className="w-8 h-8 text-gray-400" />
                          <p>未找到匹配的供应商</p>
                          <p className="text-[10px]">请尝试其他搜索关键词</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredActiveSuppliers.map((supplier, idx) => (
                      <tr key={supplier.id} className={`border-b border-gray-100 hover:bg-blue-50 cursor-pointer transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                        <td className="py-2 px-3">
                          <Badge className={`text-[9px] px-1.5 py-0.5 ${supplier.level === 'A' ? 'bg-green-100 text-green-700' : supplier.level === 'B' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                            {supplier.level}级
                          </Badge>
                        </td>
                        <td className="py-2 px-3 font-mono text-[10px] text-gray-600">{supplier.code}</td>
                        <td className="py-2 px-3 font-medium text-gray-900">
                          <div>{supplier.name}</div>
                          <div className="text-[9px] text-gray-500 mt-0.5">{supplier.nameEn}</div>
                        </td>
                        <td className="py-2 px-3 text-gray-700">
                          <Badge variant="outline" className="text-[9px]">{supplier.category}</Badge>
                        </td>
                        <td className="py-2 px-3 text-gray-600">{supplier.region}</td>
                        <td className="py-2 px-3 text-gray-700">{supplier.contact}</td>
                        <td className="py-2 px-3 text-gray-600 text-[10px]">{supplier.phone}</td>
                        <td className="py-2 px-3 text-center">
                          <Button
                            size="sm"
                            onClick={() => {
                              setCreateOrderForm({
                                ...createOrderForm,
                                supplierName: supplier.name,
                                supplierCode: supplier.code,
                              });
                              setShowSupplierDialog(false);
                              setSupplierSearchTerm('');
                              toast.success(
                                <div>
                                  <p className="font-semibold">✅ 已选择供应商</p>
                                  <p className="text-[10px] mt-1">{supplier.name}</p>
                                  <p className="text-[10px]">等级: {supplier.level}级 | {supplier.category}</p>
                                </div>,
                              );
                            }}
                            className="h-6 text-[10px] bg-[#F96302] hover:bg-[#E05502] px-2"
                          >
                            选择
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between text-[10px] text-gray-500">
              <p>💡 提示：点击"选择"按钮将自动填充供应商信息</p>
              <p>共 {filteredActiveSuppliers.length} 个活跃供应商</p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowSupplierDialog(false);
                setSupplierSearchTerm('');
              }}
              className="text-xs"
            >
              取消
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
