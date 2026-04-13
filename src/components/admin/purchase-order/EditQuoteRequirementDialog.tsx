import React, { useEffect, useMemo, useState } from 'react';
import type { QuoteRequirement, QuoteRequirementItem } from '../../../contexts/QuoteRequirementContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../ui/dialog';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';

type EditableRequirementItem = QuoteRequirementItem & {
  editableQuantity: number;
  editableRemarks: string;
};

type EditQuoteRequirementDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requirement: QuoteRequirement | null;
  saving?: boolean;
  onSave: (payload: Partial<QuoteRequirement>) => Promise<void> | void;
};

export function EditQuoteRequirementDialog({
  open,
  onOpenChange,
  requirement,
  saving = false,
  onSave,
}: EditQuoteRequirementDialogProps) {
  const [expectedQuoteDate, setExpectedQuoteDate] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [tradeTerms, setTradeTerms] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('');
  const [targetCostRange, setTargetCostRange] = useState('');
  const [qualityRequirements, setQualityRequirements] = useState('');
  const [packagingRequirements, setPackagingRequirements] = useState('');
  const [remarks, setRemarks] = useState('');
  const [editableItems, setEditableItems] = useState<EditableRequirementItem[]>([]);

  useEffect(() => {
    if (!open || !requirement) return;
    setExpectedQuoteDate(String(requirement.expectedQuoteDate || '').trim());
    setDeliveryDate(String(requirement.deliveryDate || requirement.requiredDate || '').trim());
    setTradeTerms(String(requirement.tradeTerms || '').trim());
    setPaymentTerms(String(requirement.paymentTerms || '').trim());
    setTargetCostRange(String(requirement.targetCostRange || '').trim());
    setQualityRequirements(String(requirement.qualityRequirements || '').trim());
    setPackagingRequirements(String(requirement.packagingRequirements || '').trim());
    setRemarks(String(requirement.remarks || '').trim());
    setEditableItems(
      Array.isArray(requirement.items)
        ? requirement.items.map((item) => ({
            ...item,
            editableQuantity: Number(item.quantity || 0),
            editableRemarks: String(item.remarks || '').trim(),
          }))
        : [],
    );
  }, [open, requirement]);

  const itemCountLabel = useMemo(() => `${editableItems.length} 项产品`, [editableItems.length]);

  if (!requirement) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        safeViewport
        className="w-[calc(210mm+44px)] max-w-[calc(100vw-32px)] overflow-hidden flex flex-col p-0"
      >
        <DialogHeader>
          <div className="border-b border-slate-200 bg-white px-8 py-5">
            <DialogTitle>编辑报价请求单</DialogTitle>
            <DialogDescription>
              {requirement.requirementNo} · 修改后会同步更新 QR 单据预览内容
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto bg-slate-100 p-3 md:p-4">
          <div className="mx-auto flex w-full max-w-[210mm] flex-col rounded-sm bg-white shadow-sm">
            <div className="space-y-5 p-5 md:p-6">
            <div className="grid grid-cols-2 gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div>
                <Label className="text-xs text-slate-500">客户</Label>
                <div className="mt-1 text-sm font-medium text-slate-900">
                  {requirement.customer?.companyName || '-'}
                </div>
              </div>
              <div>
                <Label className="text-xs text-slate-500">关联来源</Label>
                <div className="mt-1 text-sm font-medium text-slate-900">
                  {requirement.sourceRef || requirement.sourceInquiryNumber || '-'}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="qr-expected-quote-date">截止日期</Label>
                <Input
                  id="qr-expected-quote-date"
                  type="date"
                  value={expectedQuoteDate}
                  onChange={(e) => setExpectedQuoteDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="qr-delivery-date">期望交期</Label>
                <Input
                  id="qr-delivery-date"
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="qr-trade-terms">贸易条款</Label>
                <Input
                  id="qr-trade-terms"
                  value={tradeTerms}
                  onChange={(e) => setTradeTerms(e.target.value)}
                  placeholder="例如 EXW / FOB / CIF"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="qr-target-cost-range">目标成本区间</Label>
                <Input
                  id="qr-target-cost-range"
                  value={targetCostRange}
                  onChange={(e) => setTargetCostRange(e.target.value)}
                  placeholder="可选"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="qr-payment-terms">付款条款</Label>
              <Textarea
                id="qr-payment-terms"
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="qr-quality-requirements">质量要求</Label>
                <Textarea
                  id="qr-quality-requirements"
                  value={qualityRequirements}
                  onChange={(e) => setQualityRequirements(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="qr-packaging-requirements">包装要求</Label>
                <Textarea
                  id="qr-packaging-requirements"
                  value={packagingRequirements}
                  onChange={(e) => setPackagingRequirements(e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="qr-remarks">业务说明</Label>
              <Textarea
                id="qr-remarks"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                rows={4}
              />
            </div>

            <div className="rounded-lg border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                <h3 className="text-sm font-semibold text-slate-900">产品清单</h3>
                <span className="text-xs text-slate-500">{itemCountLabel}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr className="border-b border-slate-200">
                      <th className="px-4 py-2 text-left font-medium text-slate-600">产品</th>
                      <th className="px-4 py-2 text-left font-medium text-slate-600">型号</th>
                      <th className="px-4 py-2 text-left font-medium text-slate-600 w-28">数量</th>
                      <th className="px-4 py-2 text-left font-medium text-slate-600">备注</th>
                    </tr>
                  </thead>
                  <tbody>
                    {editableItems.map((item, index) => (
                      <tr key={item.id || `${item.productName}-${index}`} className="border-b border-slate-100 last:border-b-0">
                        <td className="px-4 py-3 text-slate-900">{item.productName || '-'}</td>
                        <td className="px-4 py-3 text-slate-600">{item.modelNo || '-'}</td>
                        <td className="px-4 py-3">
                          <Input
                            type="number"
                            min="0"
                            value={item.editableQuantity}
                            onChange={(e) => {
                              const next = [...editableItems];
                              next[index] = {
                                ...next[index],
                                editableQuantity: Number(e.target.value || 0),
                              };
                              setEditableItems(next);
                            }}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <Input
                            value={item.editableRemarks}
                            onChange={(e) => {
                              const next = [...editableItems];
                              next[index] = {
                                ...next[index],
                                editableRemarks: e.target.value,
                              };
                              setEditableItems(next);
                            }}
                            placeholder="备注"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            </div>

            <DialogFooter className="border-t border-slate-200 bg-white px-6 py-4">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
                取消
              </Button>
              <Button
                onClick={() =>
                  void onSave({
                    expectedQuoteDate,
                    deliveryDate,
                    requiredDate: deliveryDate,
                    tradeTerms,
                    paymentTerms,
                    targetCostRange,
                    qualityRequirements,
                    packagingRequirements,
                    remarks,
                    items: editableItems.map((item) => ({
                      ...item,
                      quantity: item.editableQuantity,
                      remarks: item.editableRemarks,
                    })),
                  })
                }
                disabled={saving}
              >
                {saving ? '保存中...' : '保存修改'}
              </Button>
            </DialogFooter>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
