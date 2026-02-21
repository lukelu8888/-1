import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Upload, DollarSign, Hash, FileText, X } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { useFinance } from '../../contexts/FinanceContext';
import { apiFetchJson, resolveBackendPublicUrl } from '../../api/backend-auth';

interface UploadPaymentProofDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: any;
  user: any;
  updateOrder: (orderId: string, updates: any) => void;
  sendNotificationToUser: (email: string, notification: any) => void;
  paymentAmount: string;
  setPaymentAmount: (amount: string) => void;
  paymentReference: string;
  setPaymentReference: (ref: string) => void;
  paymentNotes: string;
  setPaymentNotes: (notes: string) => void;
  paymentFile: string;
  setPaymentFile: (file: string) => void;
  paymentType?: 'deposit' | 'balance'; // 🔥 新增：区分定金还是余款
}

export function UploadPaymentProofDialog({
  open,
  onOpenChange,
  order,
  user,
  updateOrder,
  sendNotificationToUser,
  paymentAmount,
  setPaymentAmount,
  paymentReference,
  setPaymentReference,
  paymentNotes,
  setPaymentNotes,
  paymentFile,
  setPaymentFile,
  paymentType // 🔥 新增
}: UploadPaymentProofDialogProps) {
  
  const { updateARByOrderNumber } = useFinance();
  const [submitting, setSubmitting] = useState(false);

  if (!order) return null;

  // 处理图片上传（模拟）
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 🔥 模拟上传：使用Unsplash图片
      // 实际项目中应该上传到服务器
      const reader = new FileReader();
      reader.onloadend = () => {
        setPaymentFile(reader.result as string);
        toast.success('File selected', {
          description: file.name,
          duration: 2000
        });
      };
      reader.readAsDataURL(file);
    }
  };

  // 将 data URL 转为 File（用于先上传到服务器）
  const dataURLtoFile = (dataUrl: string, filename: string): File => {
    const arr = dataUrl.split(',');
    const mime = (arr[0].match(/:(.*?);/) as RegExpMatchArray)?.[1] || 'image/jpeg';
    const bstr = atob(arr[1]);
    const u8arr = new Uint8Array(bstr.length);
    for (let i = 0; i < bstr.length; i++) u8arr[i] = bstr.charCodeAt(i);
    return new File([u8arr], filename, { type: mime });
  };

  // 提交付款凭证：若是 base64 则先上传文件拿到 URL，再提交表单（只存 URL 到数据库）
  const handleSubmitProof = async () => {
    if (!paymentAmount || !paymentReference || !paymentFile) {
      toast.error('Missing Required Fields', {
        description: 'Please fill in all required fields and upload a payment proof file.',
        duration: 3000
      });
      return;
    }

    const isBalance = paymentType === 'balance';
    const paymentTypeLabel = isBalance ? 'Balance' : 'Deposit';
    const orderUid = order.id || order.orderNumber;
    const defaultFileName = (paymentType === 'balance' ? 'balance' : 'deposit') + '_proof_' + (order.orderNumber || order.id) + '.jpg';

    setSubmitting(true);
    try {
      let fileUrl = paymentFile;
      let fileName = defaultFileName;

      if (paymentFile.startsWith('data:')) {
        const file = dataURLtoFile(paymentFile, defaultFileName);
        const formData = new FormData();
        formData.append('file', file);
        const uploadRes = await apiFetchJson<{ fileUrl: string; fileName: string }>(
          '/api/upload-payment-proof-file',
          {
            method: 'POST',
            body: formData,
          }
        );
        fileUrl = resolveBackendPublicUrl(uploadRes.fileUrl);
        fileName = uploadRes.fileName || defaultFileName;
      }

      // Ensure persisted URL always points to backend domain, not frontend origin.
      fileUrl = resolveBackendPublicUrl(fileUrl);

      const res = await apiFetchJson<{ message: string; order: any }>(
        `/api/orders/${encodeURIComponent(orderUid)}/upload-payment-proof`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: paymentType,
            amount: parseFloat(paymentAmount),
            transactionId: paymentReference,
            notes: paymentNotes || undefined,
            fileUrl,
            fileName,
          }),
        }
      );

      // 本地合并接口返回的订单数据，列表通过 ordersUpdated 会重新拉取
      if (res.order) {
        updateOrder(orderUid, {
          status: res.order.status,
          paymentStatus: res.order.paymentStatus,
          depositPaymentProof: res.order.depositPaymentProof,
          balancePaymentProof: res.order.balancePaymentProof,
        });
      }
      window.dispatchEvent(new CustomEvent('ordersUpdated'));

      // 同步更新财务应收账款（本地状态）
      const paymentProofData = {
        uploadedAt: new Date().toISOString(),
        uploadedBy: user?.email || 'customer@example.com',
        fileUrl,
        fileName,
        amount: parseFloat(paymentAmount),
        currency: order.currency || 'USD',
        notes: paymentNotes || `Payment Reference: ${paymentReference}`,
      };
      const arUpdates = isBalance
        ? { balanceProof: paymentProofData, status: 'balance_proof_uploaded' }
        : { depositProof: paymentProofData, status: 'proof_uploaded' };
      updateARByOrderNumber(order.orderNumber, arUpdates);

      // 通知 Admin / 财务（本地消息）
      sendNotificationToUser('admin@cosun.com', {
        type: 'payment_proof_uploaded',
        title: `💰 ${paymentTypeLabel} Payment Proof Uploaded - ${order.orderNumber}`,
        message: `${user?.name || 'Customer'} has uploaded ${paymentTypeLabel.toLowerCase()} payment proof for order ${order.orderNumber}. Amount: ${order.currency || 'USD'} ${paymentAmount}. Please verify and confirm receipt.`,
        relatedId: order.orderNumber,
        relatedType: 'payment',
        sender: user?.email,
        metadata: {
          customerName: order.customer || user?.name,
          orderNumber: order.orderNumber,
          paymentType: paymentTypeLabel,
          amount: `${order.currency || 'USD'} ${paymentAmount}`,
          paymentReference: paymentReference,
          uploadedAt: new Date().toISOString(),
        },
      });
      sendNotificationToUser('finance@gaoshengda.com', {
        type: 'payment_proof_uploaded',
        title: `💰 New ${paymentTypeLabel} Payment Proof - ${order.orderNumber}`,
        message: `${paymentTypeLabel} payment proof uploaded for order ${order.orderNumber}. Amount: ${order.currency || 'USD'} ${paymentAmount}. Reference: ${paymentReference}. Please verify and update accounts receivable.`,
        relatedId: order.orderNumber,
        relatedType: 'payment',
        sender: user?.email,
        metadata: {
          customerName: order.customer || user?.name,
          orderNumber: order.orderNumber,
          paymentType: paymentTypeLabel,
          amount: `${order.currency || 'USD'} ${paymentAmount}`,
          paymentReference: paymentReference,
          uploadedAt: new Date().toISOString(),
        },
      });

      toast.success(`✅ ${paymentTypeLabel} Payment Proof Uploaded Successfully!`, {
        description: 'Your payment proof has been submitted. We will verify and update the order status shortly.',
        duration: 5000,
      });

      onOpenChange(false);
      setPaymentAmount('');
      setPaymentReference('');
      setPaymentNotes('');
      setPaymentFile('');
    } catch (e: any) {
      toast.error(e?.message || 'Upload failed', {
        description: 'Please try again or contact support.',
        duration: 4000,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-green-600" />
            Upload {paymentType === 'balance' ? 'Balance' : 'Deposit'} Payment Proof
          </DialogTitle>
          <DialogDescription>
            Order: {order?.orderNumber || order?.id}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Payment Amount */}
          <div className="space-y-2">
            <Label htmlFor="payment-amount" className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Payment Amount *
            </Label>
            <Input
              id="payment-amount"
              type="number"
              placeholder="Enter payment amount"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              className="text-sm"
            />
            <p className="text-xs text-gray-500">
              {paymentType === 'balance' 
                ? `Balance Amount (70%): ${order?.currency || 'USD'} ${(order?.totalAmount * 0.7).toLocaleString()}` 
                : `Deposit Amount (30%): ${order?.currency || 'USD'} ${(order?.totalAmount * 0.3).toLocaleString()}` 
              }
            </p>
          </div>

          {/* Payment Reference */}
          <div className="space-y-2">
            <Label htmlFor="payment-reference" className="flex items-center gap-2">
              <Hash className="w-4 h-4" />
              Payment Reference / Transaction ID *
            </Label>
            <Input
              id="payment-reference"
              placeholder="e.g., TT20251121001"
              value={paymentReference}
              onChange={(e) => setPaymentReference(e.target.value)}
              className="text-sm"
            />
          </div>

          {/* Payment Notes */}
          <div className="space-y-2">
            <Label htmlFor="payment-notes" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Notes (Optional)
            </Label>
            <Textarea
              id="payment-notes"
              placeholder="Any additional information about this payment..."
              value={paymentNotes}
              onChange={(e) => setPaymentNotes(e.target.value)}
              rows={3}
              className="text-sm"
            />
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Upload Payment Proof *
            </Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-green-500 transition-colors">
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileChange}
                className="hidden"
                id="proof-file-upload"
              />
              <label
                htmlFor="proof-file-upload"
                className="flex flex-col items-center justify-center cursor-pointer"
              >
                {paymentFile ? (
                  <div className="text-center w-full">
                    {paymentFile.startsWith('data:image/') ? (
                      <div className="flex flex-col items-center gap-2">
                        <img
                          src={paymentFile}
                          alt="Payment proof preview"
                          className="max-h-40 max-w-full rounded border object-contain bg-gray-50"
                        />
                        <p className="text-sm text-gray-600">图片预览</p>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="mt-1"
                          onClick={(e) => {
                            e.preventDefault();
                            setPaymentFile('');
                          }}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <FileText className="w-12 h-12 text-green-600 mx-auto mb-2" />
                        <p className="text-sm text-gray-700">File selected (PDF)</p>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="mt-2"
                          onClick={(e) => {
                            e.preventDefault();
                            setPaymentFile('');
                          }}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Remove
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <Upload className="w-12 h-12 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-700 mb-1">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">
                      JPG, PNG, PDF (Max 10MB)
                    </p>
                  </>
                )}
              </label>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            className="bg-green-600 hover:bg-green-700"
            onClick={handleSubmitProof}
            disabled={!paymentAmount || !paymentReference || !paymentFile || submitting}
          >
            <Upload className="w-4 h-4 mr-2" />
            {submitting ? 'Submitting...' : 'Submit Payment Proof'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}