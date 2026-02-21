import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Card } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { CheckCircle2, XCircle, Eye } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import type { Quotation } from './QuotationManagement';
import QuotationTemplate from './QuotationTemplate';

interface ReviewQuotationDialogProps {
  quotation: Quotation | null;
  open: boolean;
  onClose: () => void;
  onApprove: (quotation: Quotation, note: string) => void;
  onReject: (quotation: Quotation, note: string) => void;
}

export default function ReviewQuotationDialog({
  quotation,
  open,
  onClose,
  onApprove,
  onReject
}: ReviewQuotationDialogProps) {
  const [reviewNote, setReviewNote] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  if (!quotation) return null;

  const handleApprove = () => {
    if (!reviewNote.trim()) {
      toast.error('请填写审核意见');
      return;
    }
    onApprove(quotation, reviewNote);
    setReviewNote('');
  };

  const handleReject = () => {
    if (!reviewNote.trim()) {
      toast.error('请填写拒绝原因');
      return;
    }
    onReject(quotation, reviewNote);
    setReviewNote('');
  };

  return (
    <>
      <Dialog open={open && !showPreview} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base">审核报价 - {quotation.quotationNumber}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* 报价信息概览 */}
            <div className="grid grid-cols-3 gap-4">
              <Card className="p-4 bg-blue-50 border-blue-100">
                <p className="text-xs text-gray-600 mb-1">客户名称</p>
                <p className="text-sm text-gray-900">{quotation.customerName}</p>
              </Card>
              <Card className="p-4 bg-green-50 border-green-100">
                <p className="text-xs text-gray-600 mb-1">报价总额</p>
                <p className="text-sm text-green-600">
                  {quotation.currency} {quotation.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </Card>
              <Card className="p-4 bg-purple-50 border-purple-100">
                <p className="text-xs text-gray-600 mb-1">有效期至</p>
                <p className="text-sm text-purple-600">{quotation.validUntil}</p>
              </Card>
            </div>

            {/* 产品清单 */}
            <Card className="p-4 border-gray-200">
              <h4 className="text-xs mb-3 text-gray-700">产品清单</h4>
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="text-xs">产品名称</TableHead>
                    <TableHead className="text-xs">规格</TableHead>
                    <TableHead className="text-xs text-right">数量</TableHead>
                    <TableHead className="text-xs text-right">单价</TableHead>
                    <TableHead className="text-xs text-right">金额</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quotation.products.map((product, index) => (
                    <TableRow key={index}>
                      <TableCell className="text-xs">{product.name}</TableCell>
                      <TableCell className="text-xs text-gray-600">{product.specs}</TableCell>
                      <TableCell className="text-xs text-right">{product.quantity.toLocaleString()}</TableCell>
                      <TableCell className="text-xs text-right">
                        ${product.unitPrice.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-xs text-right">
                        ${product.totalPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-3 pt-3 border-t border-gray-200 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600">小计:</span>
                  <span>${quotation.subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
                {quotation.discount > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>折扣:</span>
                    <span>-${quotation.discount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-gray-200">
                  <span>总计:</span>
                  <span className="text-green-600">
                    ${quotation.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} {quotation.currency}
                  </span>
                </div>
              </div>
            </Card>

            {/* 交易条款 */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-4 border-gray-200">
                <h4 className="text-xs mb-2 text-gray-700">付款条款</h4>
                <p className="text-xs text-gray-900">{quotation.paymentTerms}</p>
              </Card>
              <Card className="p-4 border-gray-200">
                <h4 className="text-xs mb-2 text-gray-700">交货条款</h4>
                <p className="text-xs text-gray-900">{quotation.deliveryTerms}</p>
              </Card>
            </div>

            {/* 备注 */}
            {quotation.notes && (
              <Card className="p-4 border-gray-200">
                <h4 className="text-xs mb-2 text-gray-700">备注</h4>
                <p className="text-xs text-gray-900">{quotation.notes}</p>
              </Card>
            )}

            {/* 审核意见 */}
            <Card className="p-4 bg-yellow-50 border-yellow-200">
              <Label className="text-xs text-gray-700 mb-2 block">审核意见 *</Label>
              <Textarea
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                className="text-xs min-h-24"
                placeholder="请填写审核意见或拒绝原因..."
              />
            </Card>

            {/* 底部操作按钮 */}
            <div className="flex justify-between pt-4 border-t border-gray-200">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={() => setShowPreview(true)}
              >
                <Eye className="w-3.5 h-3.5 mr-1" />
                查看报价单
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={onClose}
                >
                  取消
                </Button>
                <Button
                  size="sm"
                  className="h-8 text-xs bg-red-600 hover:bg-red-700"
                  onClick={handleReject}
                >
                  <XCircle className="w-3.5 h-3.5 mr-1" />
                  拒绝
                </Button>
                <Button
                  size="sm"
                  className="h-8 text-xs bg-green-600 hover:bg-green-700"
                  onClick={handleApprove}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  批准并发送客户
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 预览报价单对话框 */}
      <Dialog open={showPreview} onOpenChange={() => setShowPreview(false)}>
        <DialogContent className="max-w-[900px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base">报价单预览 - {quotation.quotationNumber}</DialogTitle>
          </DialogHeader>
          <QuotationTemplate quotation={quotation} />
          <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={() => setShowPreview(false)}
            >
              返回
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}