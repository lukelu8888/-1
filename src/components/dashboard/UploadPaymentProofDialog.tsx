import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Upload, DollarSign, Hash, FileText, X } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { useFinance } from '../../contexts/FinanceContext';
import { orderService } from '../../lib/supabaseService';
import { paymentProofStorage, isDataUrl, dataUrlToFile } from '../../lib/storageService';

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

  // 选择文件后先存本地 File 对象，不再转 base64
  const [selectedFileObj, setSelectedFileObj] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFileObj(file);
      // 生成本地预览 URL（仅用于 UI 显示，不存储）
      const previewUrl = file.type.startsWith('image/') ? URL.createObjectURL(file) : '';
      setPaymentFile(previewUrl || file.name);
      toast.success('File selected', { description: file.name, duration: 2000 });
    }
  };

  // 提交付款凭证：上传到 Supabase Storage，只保存 URL
  const handleSubmitProof = async () => {
    if (!paymentAmount || !paymentReference || (!paymentFile && !selectedFileObj)) {
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
      let fileUrl = '';
      let fileName = defaultFileName;
      let storagePath = '';

      // 上传到 Supabase Storage
      const fileToUpload = selectedFileObj || (isDataUrl(paymentFile) ? dataUrlToFile(paymentFile, defaultFileName) : null);
      if (fileToUpload) {
        const result = await paymentProofStorage.upload(
          fileToUpload,
          order.orderNumber || order.id,
          paymentType || 'deposit',
          user?.email || 'unknown'
        );
        fileUrl = result.url;
        fileName = result.fileName;
        storagePath = result.path;
      } else {
        fileUrl = paymentFile;
      }

      // 同步到 Supabase
      const proofField = paymentType === 'deposit' ? 'deposit_payment_proof' : 'balance_payment_proof';
      await orderService.upsert({
        id: orderUid,
        [proofField]: { fileUrl, fileName, storagePath, amount: parseFloat(paymentAmount), transactionId: paymentReference, notes: paymentNotes || null, uploadedAt: new Date().toISOString() },
      });

      const contractNumber = order.orderNumber || order.id;
      const proofData = {
        fileName,
        fileUrl,
        storagePath,
        uploadedAt: new Date().toISOString(),
        amount: parseFloat(paymentAmount),
        transactionId: paymentReference,
        notes: paymentNotes || undefined,
      };

      // 直接写入财务应收账款 localStorage（客户端不在 FinanceProvider 内，无法通过 Context 写入）
      try {
        const AR_KEY = 'accountsReceivable_admin@cosun.com';
        const existingARs: any[] = JSON.parse(localStorage.getItem(AR_KEY) || '[]');
        const arIdx = existingARs.findIndex((ar: any) => ar.orderNumber === contractNumber);
        const now = new Date().toISOString();
        if (arIdx >= 0) {
          // 已有记录：更新定金凭证状态
          existingARs[arIdx] = {
            ...existingARs[arIdx],
            depositProof: proofData,
            status: 'proof_uploaded',
            updatedAt: now,
          };
          console.log(`✅ [UploadPaymentProof] 已更新 AR 记录: ${contractNumber}`);
        } else {
          // 新建应收账款记录
          const depositAmt = parseFloat(paymentAmount);
          const totalAmt = order.totalAmount || depositAmt / 0.3;
          const newAR = {
            id: `ar-${Date.now()}`,
            arNumber: `YS-${(contractNumber.split('-')[1] || 'NA')}-${now.slice(2,10).replace(/-/g,'')}`,
            orderNumber: contractNumber,
            contractNumber,
            quotationNumber: order.quotationNumber || '',
            customerName: order.customer || '',
            customerEmail: user?.email || '',
            region: order.region || '',
            invoiceDate: now.split('T')[0],
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            totalAmount: totalAmt,
            paidAmount: 0,
            remainingAmount: totalAmt,
            currency: order.currency || 'USD',
            status: 'proof_uploaded',
            paymentTerms: order.paymentTerms || '30% T/T deposit, 70% balance before shipment',
            products: (order.products || []).map((p: any) => ({
              name: p.name,
              quantity: p.quantity || 0,
              unitPrice: p.unitPrice || 0,
              totalPrice: p.totalPrice || 0,
            })),
            depositProof: proofData,
            paymentHistory: [],
            createdAt: now,
            updatedAt: now,
            createdBy: user?.email || 'customer',
            notes: `定金凭证由客户上传。付款参考号: ${paymentReference}`,
          };
          existingARs.unshift(newAR);
          console.log(`✅ [UploadPaymentProof] 已新增 AR 记录: ${newAR.arNumber}`);
        }
        localStorage.setItem(AR_KEY, JSON.stringify(existingARs));
        // 触发财务模块刷新
        window.dispatchEvent(new CustomEvent('financeDataUpdated'));
      } catch (arErr) {
        console.warn('⚠️ [UploadPaymentProof] 写入 AR 失败:', arErr);
      }

      // 本地更新订单状态
      updateOrder(orderUid, {
        status: 'Payment Proof Uploaded',
        paymentStatus: 'Proof Uploaded',
        depositPaymentProof: { fileName, fileUrl, uploadedAt: new Date().toISOString() },
      });
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
      setSelectedFileObj(null);
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
