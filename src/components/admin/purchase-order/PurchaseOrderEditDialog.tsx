import React from 'react';
import { Supplier } from '../../../data/suppliersData';
import { PurchaseOrderItem } from '../../../contexts/PurchaseOrderContext';
import { Button } from '../../ui/button';
import { DatePicker } from '../../ui/date-picker';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../ui/dialog';
import { EditableSelect } from '../../ui/editable-select';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../ui/select';
import { Textarea } from '../../ui/textarea';
import { TERMS_OPTIONS } from './purchaseOrderConstants';
import {
  CURRENCY_OPTIONS,
  EditPOFormState,
  EXTRA_TERM_OPTIONS,
  normalizeCurrencyCode,
  normalizeRegionalDocNo,
} from './purchaseOrderEditConfig';

type PurchaseOrderEditDialogProps = {
  open: boolean;
  onOpenChange: React.Dispatch<React.SetStateAction<boolean>>;
  editingPONumber?: string;
  editPOForm: EditPOFormState;
  setEditPOForm: React.Dispatch<React.SetStateAction<EditPOFormState>>;
  editPOItems: PurchaseOrderItem[];
  onEditPOItemChange: (idx: number, field: keyof PurchaseOrderItem, value: string) => void;
  editPOOrderDate?: Date;
  setEditPOOrderDate: React.Dispatch<React.SetStateAction<Date | undefined>>;
  editPOExpectedDate?: Date;
  setEditPOExpectedDate: React.Dispatch<React.SetStateAction<Date | undefined>>;
  editPOActualDate?: Date;
  setEditPOActualDate: React.Dispatch<React.SetStateAction<Date | undefined>>;
  allSuppliers: Supplier[];
  onSupplierNameChange: (value: string) => void;
  onSupplierCodeChange: (value: string) => void;
  onCancel: () => void;
  onSave: () => void;
};

export const PurchaseOrderEditDialog: React.FC<PurchaseOrderEditDialogProps> = ({
  open,
  onOpenChange,
  editingPONumber,
  editPOForm,
  setEditPOForm,
  editPOItems,
  onEditPOItemChange,
  editPOOrderDate,
  setEditPOOrderDate,
  editPOExpectedDate,
  setEditPOExpectedDate,
  editPOActualDate,
  setEditPOActualDate,
  allSuppliers,
  onSupplierNameChange,
  onSupplierCodeChange,
  onCancel,
  onSave,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(90vw,800px)] max-w-[800px] max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="px-6 pt-6 pb-6 border-b bg-white sticky top-0 z-20">
          <DialogTitle style={{ fontSize: '15px' }}>编辑采购订单 - {editingPONumber || ''}</DialogTitle>
          <DialogDescription style={{ fontSize: '12px' }}>修改采购合同字段、条款和产品明细</DialogDescription>
        </DialogHeader>

        <div className="px-8 py-6">
          <div className="space-y-0 min-w-0 pb-24">
            <section className="mb-6">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">基础信息区</h4>
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs text-gray-700">采购单号</Label>
                  <Input value={editPOForm.poNumber} onChange={(e) => setEditPOForm({ ...editPOForm, poNumber: e.target.value })} className="h-8 text-xs" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-700">来源询价</Label>
                  <Input value={editPOForm.xjNumber} onChange={(e) => setEditPOForm({ ...editPOForm, xjNumber: e.target.value })} className="h-8 text-xs" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-700">来源需求</Label>
                  <Input value={editPOForm.requirementNo} onChange={(e) => setEditPOForm({ ...editPOForm, requirementNo: e.target.value })} className="h-8 text-xs" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-700">来源单号</Label>
                  <Input value={editPOForm.sourceRef} onChange={(e) => setEditPOForm({ ...editPOForm, sourceRef: normalizeRegionalDocNo(e.target.value) })} className="h-8 text-xs" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-700">币种</Label>
                    <Select value={editPOForm.currency || 'CNY'} onValueChange={(value) => setEditPOForm({ ...editPOForm, currency: normalizeCurrencyCode(value) || 'CNY' })}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CURRENCY_OPTIONS.map((currency) => (
                          <SelectItem key={currency} value={currency}>{currency}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-700">订单状态</Label>
                    <Select value={editPOForm.status} onValueChange={(value) => setEditPOForm({ ...editPOForm, status: value })}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">待确认</SelectItem>
                        <SelectItem value="confirmed">已确认</SelectItem>
                        <SelectItem value="producing">生产中</SelectItem>
                        <SelectItem value="shipped">已发货</SelectItem>
                        <SelectItem value="completed">已完成</SelectItem>
                        <SelectItem value="cancelled">已取消</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-700">付款状态</Label>
                    <Select value={editPOForm.paymentStatus} onValueChange={(value) => setEditPOForm({ ...editPOForm, paymentStatus: value })}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unpaid">未付款</SelectItem>
                        <SelectItem value="partial">部分付款</SelectItem>
                        <SelectItem value="paid">已付款</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-700">下单日期</Label>
                    <DatePicker date={editPOOrderDate} onSelect={setEditPOOrderDate} placeholder="选择下单日期" className="text-xs h-8" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-700">预计交期</Label>
                    <DatePicker date={editPOExpectedDate} onSelect={setEditPOExpectedDate} placeholder="选择预计交期" className="text-xs h-8" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-700">实际交期</Label>
                    <DatePicker date={editPOActualDate} onSelect={setEditPOActualDate} placeholder="选择实际交期" className="text-xs h-8" />
                  </div>
                </div>
              </div>
            </section>

            <section className="mb-6">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">供应商信息区</h4>
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs text-gray-700">供应商名称</Label>
                  <Input
                    value={editPOForm.supplierName}
                    onChange={(e) => onSupplierNameChange(e.target.value)}
                    className="h-8 text-xs"
                    list="po-supplier-options"
                    placeholder="输入关键词搜索或下拉选择供应商"
                  />
                  <datalist id="po-supplier-options">
                    {allSuppliers.map((supplier) => (
                      <option key={supplier.code} value={supplier.name}>
                        {supplier.code} | {supplier.email}
                      </option>
                    ))}
                  </datalist>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-700">供应商编码</Label>
                  <Input
                    value={editPOForm.supplierCode}
                    onChange={(e) => onSupplierCodeChange(e.target.value)}
                    className="h-8 text-xs"
                    list="po-supplier-code-options"
                    placeholder="输入编码搜索或下拉选择"
                  />
                  <datalist id="po-supplier-code-options">
                    {allSuppliers.map((supplier) => (
                      <option key={`code-${supplier.code || supplier.id}`} value={String(supplier.code || supplier.id || '')}>
                        {supplier.name}
                      </option>
                    ))}
                  </datalist>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-700">联系人</Label>
                  <Input value={editPOForm.supplierContact} onChange={(e) => setEditPOForm({ ...editPOForm, supplierContact: e.target.value })} className="h-8 text-xs" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-700">电话</Label>
                  <Input value={editPOForm.supplierPhone} onChange={(e) => setEditPOForm({ ...editPOForm, supplierPhone: e.target.value })} className="h-8 text-xs" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-700">供应商地址</Label>
                  <Input value={editPOForm.supplierAddress} onChange={(e) => setEditPOForm({ ...editPOForm, supplierAddress: e.target.value })} className="h-8 text-xs" />
                </div>
              </div>
            </section>

            <section className="mb-6">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">交易信息区</h4>
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs text-gray-700">贸易术语（Incoterm）</Label>
                  <Input value={editPOForm.incoterm} onChange={(e) => setEditPOForm({ ...editPOForm, incoterm: e.target.value })} className="h-8 text-xs" placeholder="FOB / CIF / EXW..." />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-700">装运港</Label>
                  <Input value={editPOForm.portOfLoading} onChange={(e) => setEditPOForm({ ...editPOForm, portOfLoading: e.target.value })} className="h-8 text-xs" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-700">目的港</Label>
                  <Input value={editPOForm.portOfDestination} onChange={(e) => setEditPOForm({ ...editPOForm, portOfDestination: e.target.value })} className="h-8 text-xs" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-700">税务/结算条款</Label>
                  <Textarea value={editPOForm.taxTerms} onChange={(e) => setEditPOForm({ ...editPOForm, taxTerms: e.target.value })} className="text-xs min-h-[60px]" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-700">收款银行条款</Label>
                  <Textarea value={editPOForm.bankTerms} onChange={(e) => setEditPOForm({ ...editPOForm, bankTerms: e.target.value })} className="text-xs min-h-[60px]" />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-gray-700">采购明细（可编辑）</Label>
                  <div className="border rounded-md overflow-x-auto">
                    <table className="w-full min-w-[980px] text-xs">
                      <thead className="bg-gray-50">
                        <tr className="border-b">
                          <th className="text-left p-2 font-medium text-gray-700">产品名称</th>
                          <th className="text-left p-2 font-medium text-gray-700">型号</th>
                          <th className="text-left p-2 font-medium text-gray-700">规格</th>
                          <th className="text-left p-2 font-medium text-gray-700">数量</th>
                          <th className="text-left p-2 font-medium text-gray-700">单位</th>
                          <th className="text-left p-2 font-medium text-gray-700">单价</th>
                          <th className="text-left p-2 font-medium text-gray-700">币种</th>
                          <th className="text-left p-2 font-medium text-gray-700">小计</th>
                          <th className="text-left p-2 font-medium text-gray-700">备注</th>
                        </tr>
                      </thead>
                      <tbody>
                        {editPOItems.map((item, idx) => (
                          <tr key={`${item.id}-${idx}`} className="border-b last:border-b-0">
                            <td className="p-2"><Input className="h-8 text-xs" value={item.productName || ''} onChange={(e) => onEditPOItemChange(idx, 'productName', e.target.value)} /></td>
                            <td className="p-2"><Input className="h-8 text-xs" value={item.modelNo || ''} onChange={(e) => onEditPOItemChange(idx, 'modelNo', e.target.value)} /></td>
                            <td className="p-2"><Input className="h-8 text-xs" value={item.specification || ''} onChange={(e) => onEditPOItemChange(idx, 'specification', e.target.value)} /></td>
                            <td className="p-2"><Input className="h-8 text-xs" type="number" value={String(item.quantity ?? 0)} onChange={(e) => onEditPOItemChange(idx, 'quantity', e.target.value)} /></td>
                            <td className="p-2"><Input className="h-8 text-xs" value={item.unit || ''} onChange={(e) => onEditPOItemChange(idx, 'unit', e.target.value)} /></td>
                            <td className="p-2"><Input className="h-8 text-xs" type="number" step="0.0001" value={String(item.unitPrice ?? 0)} onChange={(e) => onEditPOItemChange(idx, 'unitPrice', e.target.value)} /></td>
                            <td className="p-2">
                              <Select value={normalizeCurrencyCode(item.currency) || 'CNY'} onValueChange={(value) => onEditPOItemChange(idx, 'currency', normalizeCurrencyCode(value) || 'CNY')}>
                                <SelectTrigger className="h-8 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {CURRENCY_OPTIONS.map((currency) => (
                                    <SelectItem key={`${item.id}-${currency}`} value={currency}>{currency}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </td>
                            <td className="p-2"><Input className="h-8 text-xs" type="number" step="0.01" value={String(item.subtotal ?? 0)} onChange={(e) => onEditPOItemChange(idx, 'subtotal', e.target.value)} /></td>
                            <td className="p-2"><Input className="h-8 text-xs" value={item.remarks || ''} onChange={(e) => onEditPOItemChange(idx, 'remarks', e.target.value)} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </section>

            <section className="mb-6">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">合同条款区</h4>
              <div className="space-y-3">
                <EditableSelect label="付款条款" value={editPOForm.paymentTerms} onChange={(val) => setEditPOForm({ ...editPOForm, paymentTerms: val })} options={TERMS_OPTIONS.paymentTerms} placeholder="请选择或输入付款条款" />
                <EditableSelect label="交货条款" value={editPOForm.deliveryTerms} onChange={(val) => setEditPOForm({ ...editPOForm, deliveryTerms: val })} options={TERMS_OPTIONS.deliveryTerms} placeholder="请选择或输入交货条款" />
                <EditableSelect label="交货地址" value={editPOForm.deliveryAddress} onChange={(val) => setEditPOForm({ ...editPOForm, deliveryAddress: val })} options={TERMS_OPTIONS.deliveryAddress} placeholder="请选择或输入交货地址" />
                <EditableSelect label="质量标准" value={editPOForm.qualityStandard} onChange={(val) => setEditPOForm({ ...editPOForm, qualityStandard: val })} options={TERMS_OPTIONS.qualityStandard} placeholder="请选择或输入质量标准" />
                <EditableSelect label="验收方式" value={editPOForm.inspectionMethod} onChange={(val) => setEditPOForm({ ...editPOForm, inspectionMethod: val })} options={TERMS_OPTIONS.inspectionMethod} placeholder="请选择或输入验收方式" />
                <EditableSelect label="包装要求" value={editPOForm.packaging} onChange={(val) => setEditPOForm({ ...editPOForm, packaging: val })} options={TERMS_OPTIONS.packaging} placeholder="请选择或输入包装要求" />
                <EditableSelect label="唛头要求" value={editPOForm.shippingMarks} onChange={(val) => setEditPOForm({ ...editPOForm, shippingMarks: val })} options={TERMS_OPTIONS.shippingMarks} placeholder="请选择或输入唛头要求" />
                <EditableSelect label="延期交货违约金" value={editPOForm.deliveryPenalty} onChange={(val) => setEditPOForm({ ...editPOForm, deliveryPenalty: val })} options={[...EXTRA_TERM_OPTIONS.deliveryPenalty]} placeholder="请选择或输入延期违约条款" />
                <EditableSelect label="质量不符违约金" value={editPOForm.qualityPenalty} onChange={(val) => setEditPOForm({ ...editPOForm, qualityPenalty: val })} options={[...EXTRA_TERM_OPTIONS.qualityPenalty]} placeholder="请选择或输入质量违约条款" />
                <EditableSelect label="质保期" value={editPOForm.warrantyPeriod} onChange={(val) => setEditPOForm({ ...editPOForm, warrantyPeriod: val })} options={[...EXTRA_TERM_OPTIONS.warrantyPeriod]} placeholder="请选择或输入质保期" />
                <EditableSelect label="质保条款" value={editPOForm.warrantyTerms} onChange={(val) => setEditPOForm({ ...editPOForm, warrantyTerms: val })} options={['质量问题免费更换', '关键部件保修12个月', '按双方签署质保协议执行']} placeholder="请选择或输入质保条款" />
                <EditableSelect label="退换货政策" value={editPOForm.returnPolicy} onChange={(val) => setEditPOForm({ ...editPOForm, returnPolicy: val })} options={[...EXTRA_TERM_OPTIONS.returnPolicy]} placeholder="请选择或输入退换货政策" />
                <EditableSelect label="保密条款" value={editPOForm.confidentiality} onChange={(val) => setEditPOForm({ ...editPOForm, confidentiality: val })} options={TERMS_OPTIONS.confidentiality} placeholder="请选择或输入保密条款" />
                <EditableSelect label="知识产权" value={editPOForm.ipRights} onChange={(val) => setEditPOForm({ ...editPOForm, ipRights: val })} options={TERMS_OPTIONS.ipRights} placeholder="请选择或输入知识产权条款" />
                <EditableSelect label="不可抗力" value={editPOForm.forceMajeure} onChange={(val) => setEditPOForm({ ...editPOForm, forceMajeure: val })} options={[...EXTRA_TERM_OPTIONS.forceMajeure]} placeholder="请选择或输入不可抗力条款" />
                <EditableSelect label="争议解决" value={editPOForm.disputeResolution} onChange={(val) => setEditPOForm({ ...editPOForm, disputeResolution: val })} options={[...EXTRA_TERM_OPTIONS.disputeResolution]} placeholder="请选择或输入争议解决条款" />
                <EditableSelect label="适用法律" value={editPOForm.applicableLaw} onChange={(val) => setEditPOForm({ ...editPOForm, applicableLaw: val })} options={[...EXTRA_TERM_OPTIONS.applicableLaw]} placeholder="请选择或输入适用法律" />
                <EditableSelect label="合同有效期" value={editPOForm.contractValidity} onChange={(val) => setEditPOForm({ ...editPOForm, contractValidity: val })} options={[...EXTRA_TERM_OPTIONS.contractValidity]} placeholder="请选择或输入合同有效期" />
                <EditableSelect label="合同变更" value={editPOForm.modification} onChange={(val) => setEditPOForm({ ...editPOForm, modification: val })} options={[...EXTRA_TERM_OPTIONS.modification]} placeholder="请选择或输入合同变更条款" />
                <EditableSelect label="合同终止" value={editPOForm.termination} onChange={(val) => setEditPOForm({ ...editPOForm, termination: val })} options={[...EXTRA_TERM_OPTIONS.termination]} placeholder="请选择或输入合同终止条款" />
              </div>
            </section>

            <section className="mb-6">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">备注区</h4>
              <div className="space-y-1">
                <Label className="text-xs text-gray-700">备注</Label>
                <Textarea value={editPOForm.remarks} onChange={(e) => setEditPOForm({ ...editPOForm, remarks: e.target.value })} className="text-xs min-h-[72px]" />
              </div>
            </section>

            <input type="hidden" value={editPOForm.qualityStandard} readOnly />
            <input type="hidden" value={editPOForm.inspectionMethod} readOnly />
            <input type="hidden" value={editPOForm.packaging} readOnly />
            <input type="hidden" value={editPOForm.qualityPenalty} readOnly />
            <input type="hidden" value={editPOForm.disputeResolution} readOnly />
          </div>
        </div>

        <DialogFooter className="mt-6 px-6 pt-4 pb-6 border-t bg-white sticky bottom-0 z-20">
          <Button variant="outline" className="text-xs" onClick={onCancel}>取消</Button>
          <Button className="text-xs bg-[#F96302] hover:bg-[#E05502]" onClick={onSave}>保存修改</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
