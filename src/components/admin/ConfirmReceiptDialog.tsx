import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { CheckCircle2, XCircle, Upload, Download, Eye, DollarSign, Calendar, FileText, AlertCircle } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { useFinance, AccountReceivable } from '../../contexts/FinanceContext';
import { useOrders } from '../../contexts/OrderContext';
import { sendNotificationToUser } from '../../contexts/NotificationContext';
import { resolveBackendPublicUrl } from '../../api/backend-auth';

interface ConfirmReceiptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ar: AccountReceivable | null;
}

export function ConfirmReceiptDialog({ open, onOpenChange, ar }: ConfirmReceiptDialogProps) {
  const { recordPayment, updateARByOrderNumber } = useFinance();
  const { updateOrder } = useOrders();
  
  const [receiptConfirmed, setReceiptConfirmed] = useState(false);
  const [receiptNotes, setReceiptNotes] = useState('');
  const [receiptProofFile, setReceiptProofFile] = useState('');
  const customerProofUrl = resolveBackendPublicUrl(ar?.depositProof?.fileUrl);
  
  if (!ar) return null;

  // 处理文件上传
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 简化：将文件转为base64
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptProofFile(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // 确认收到款项
  const handleConfirmReceipt = () => {
    if (!ar.depositProof) {
      toast.error('No Customer Proof', {
        description: 'Customer has not uploaded payment proof yet.',
        duration: 3000
      });
      return;
    }

    const depositAmount = ar.depositProof.amount;
    const paymentDate = new Date().toISOString().split('T')[0];

    console.log('🔥 [ConfirmReceipt] 开始确认收款...');
    console.log('  - AR Number:', ar.arNumber);
    console.log('  - Order Number:', ar.orderNumber);
    console.log('  - Customer Email:', ar.customerEmail);
    console.log('  - Deposit Amount:', depositAmount);

    // 🔥 1. 记录收款到应收账款
    recordPayment(ar.id, {
      date: paymentDate,
      amount: depositAmount,
      method: 'T/T Wire Transfer',
      reference: ar.depositProof.notes || 'Deposit payment',
      receivedBy: 'finance@gaoshengda.com',
      notes: receiptNotes || 'Deposit payment confirmed by finance',
      proofUrl: receiptProofFile || undefined,
      proofFileName: receiptProofFile ? `finance_receipt_${ar.orderNumber}.jpg` : undefined
    });
    console.log('  ✅ 已记录收款到应收账款');

    // 🔥 2. 同步更新订单状态为 "Deposit Received"（三方同步）
    // 使用订单号找到订单，确保更新到正确的客户数据
    const allOrders = JSON.parse(localStorage.getItem(`orders_${ar.customerEmail}`) || '[]');
    const orderToUpdate = allOrders.find((o: any) => o.orderNumber === ar.orderNumber || o.id === ar.orderNumber);
    
    if (orderToUpdate) {
      console.log('  - 找到订单:', orderToUpdate.orderNumber || orderToUpdate.id);
      
      // 更新订单状态
      updateOrder(orderToUpdate.id, {
        status: 'Deposit Received',
        paymentStatus: 'Deposit Paid',
        updatedAt: new Date().toISOString()
      });
      console.log('  ✅ 已同步更新订单状态为 "Deposit Received"');
    } else {
      console.error('  ❌ 未找到订单:', ar.orderNumber);
    }

    // 🔥 3. 发送通知给Customer
    sendNotificationToUser(ar.customerEmail, {
      type: 'payment_confirmed',
      title: `✅ Deposit Payment Confirmed - ${ar.orderNumber}`,
      message: `Great news! Your deposit payment of ${ar.currency} ${depositAmount.toLocaleString()} has been confirmed by our finance team. Production will commence shortly.`,
      relatedId: ar.orderNumber,
      relatedType: 'payment',
      sender: 'finance@gaoshengda.com',
      metadata: {
        customerName: ar.customerName,
        orderNumber: ar.orderNumber,
        arNumber: ar.arNumber,
        amount: `${ar.currency} ${depositAmount.toLocaleString()}`,
        confirmedAt: new Date().toISOString()
      }
    });
    console.log('  ✅ 已发送通知给Customer:', ar.customerEmail);

    // 🔥 4. 发送通知给Admin
    sendNotificationToUser('admin@cosun.com', {
      type: 'payment_confirmed',
      title: `💰 Payment Confirmed - ${ar.orderNumber}`,
      message: `Finance has confirmed deposit payment of ${ar.currency} ${depositAmount.toLocaleString()} for order ${ar.orderNumber}. Order status updated to "Deposit Received".`,
      relatedId: ar.orderNumber,
      relatedType: 'payment',
      sender: 'finance@gaoshengda.com',
      metadata: {
        customerName: ar.customerName,
        orderNumber: ar.orderNumber,
        arNumber: ar.arNumber,
        amount: `${ar.currency} ${depositAmount.toLocaleString()}`,
        confirmedAt: new Date().toISOString()
      }
    });
    console.log('  ✅ 已发送通知给Admin: admin@cosun.com');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ [ConfirmReceipt] 收款确认完成！三方状态已同步！');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    toast.success('✅ Payment Confirmed!', {
      description: `Deposit payment confirmed. Customer and Admin have been notified. Order status updated to "Deposit Received".`,
      duration: 5000
    });

    // 关闭对话框并重置
    onOpenChange(false);
    setReceiptConfirmed(false);
    setReceiptNotes('');
    setReceiptProofFile('');
  };

  // 拒绝收款（款项未收到）
  const handleRejectReceipt = () => {
    if (!receiptNotes.trim()) {
      toast.error('Please Provide Reason', {
        description: 'Please explain why the payment was not received.',
        duration: 3000
      });
      return;
    }

    console.log('⚠️ [RejectReceipt] 开始拒绝收款...');
    console.log('  - AR Number:', ar.arNumber);
    console.log('  - Order Number:', ar.orderNumber);
    console.log('  - Customer Email:', ar.customerEmail);
    console.log('  - Reason:', receiptNotes);

    // 🔥 1. 更新订单状态为 "Payment Verification Failed"（三方同步）
    // 使用订单号找到订单，确保更新到正确的客户数据
    const allOrders = JSON.parse(localStorage.getItem(`orders_${ar.customerEmail}`) || '[]');
    const orderToUpdate = allOrders.find((o: any) => o.orderNumber === ar.orderNumber || o.id === ar.orderNumber);
    
    if (orderToUpdate) {
      console.log('  - 找到订单:', orderToUpdate.orderNumber || orderToUpdate.id);
      
      // 更新订单状态
      updateOrder(orderToUpdate.id, {
        status: 'Payment Verification Failed',
        paymentStatus: 'Verification Failed',
        notes: `Finance: Payment not received. Reason: ${receiptNotes}`,
        updatedAt: new Date().toISOString()
      });
      console.log('  ✅ 已同步更新订单状态为 "Payment Verification Failed"');
    } else {
      console.error('  ❌ 未找到订单:', ar.orderNumber);
    }

    // 🔥 2. 发送通知给Customer（请客户自查）
    sendNotificationToUser(ar.customerEmail, {
      type: 'payment_rejected',
      title: `⚠️ Payment Verification Issue - ${ar.orderNumber}`,
      message: `We have not received your deposit payment for order ${ar.orderNumber}. Please verify your payment details and contact us. Reason: ${receiptNotes}`,
      relatedId: ar.orderNumber,
      relatedType: 'payment',
      sender: 'finance@gaoshengda.com',
      metadata: {
        customerName: ar.customerName,
        orderNumber: ar.orderNumber,
        arNumber: ar.arNumber,
        reason: receiptNotes,
        rejectedAt: new Date().toISOString()
      }
    });
    console.log('  ✅ 已发送通知给Customer:', ar.customerEmail);

    // 🔥 3. 发送通知给Admin
    sendNotificationToUser('admin@cosun.com', {
      type: 'payment_rejected',
      title: `⚠️ Payment Not Received - ${ar.orderNumber}`,
      message: `Finance has not received deposit payment for order ${ar.orderNumber}. Customer notified to verify payment. Reason: ${receiptNotes}`,
      relatedId: ar.orderNumber,
      relatedType: 'payment',
      sender: 'finance@gaoshengda.com',
      metadata: {
        customerName: ar.customerName,
        orderNumber: ar.orderNumber,
        arNumber: ar.arNumber,
        reason: receiptNotes,
        rejectedAt: new Date().toISOString()
      }
    });
    console.log('  ✅ 已发送通知给Admin: admin@cosun.com');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⚠️ [RejectReceipt] 拒绝收款完成！三方状态已同步！');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    toast.warning('⚠️ Payment Not Received', {
      description: 'Customer has been notified to verify payment details.',
      duration: 5000
    });

    // 关闭对话框并重置
    onOpenChange(false);
    setReceiptConfirmed(false);
    setReceiptNotes('');
    setReceiptProofFile('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            Confirm Payment Receipt - {ar.arNumber}
          </DialogTitle>
          <DialogDescription>
            Order: {ar.orderNumber} | Customer: {ar.customerName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* 应收账款信息 */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg border">
            <div>
              <div className="text-xs text-gray-500 mb-1">Total Amount</div>
              <div className="font-bold">{ar.currency} {ar.totalAmount.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Paid Amount</div>
              <div className="font-bold text-green-600">{ar.currency} {ar.paidAmount.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Remaining Amount</div>
              <div className="font-bold text-orange-600">{ar.currency} {ar.remainingAmount.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Status</div>
              <Badge className={
                ar.status === 'paid' ? 'bg-green-500' :
                ar.status === 'partially_paid' ? 'bg-yellow-500' :
                ar.status === 'overdue' ? 'bg-red-500' : 'bg-gray-500'
              }>
                {ar.status}
              </Badge>
            </div>
          </div>

          {/* 客户上传的付款凭证 */}
          {ar.depositProof && (
            <div className="border rounded-lg p-4 bg-blue-50">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="h-4 w-4 text-blue-600" />
                <h3 className="font-semibold text-sm">Customer Payment Proof</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                <div>
                  <span className="text-gray-500">Amount:</span>
                  <span className="ml-2 font-semibold">{ar.currency} {ar.depositProof.amount.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-gray-500">Uploaded:</span>
                  <span className="ml-2">{new Date(ar.depositProof.uploadedAt).toLocaleString()}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-500">Notes:</span>
                  <p className="mt-1 text-gray-700">{ar.depositProof.notes}</p>
                </div>
              </div>

              {/* 凭证图片预览 */}
              {customerProofUrl && (
                <div className="mt-3">
                  <img 
                    src={customerProofUrl} 
                    alt="Payment Proof" 
                    className="w-full max-h-64 object-contain border rounded"
                  />
                  <div className="flex gap-2 mt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(customerProofUrl, '_blank')}
                      className="flex-1"
                    >
                      <Eye className="h-3.5 w-3.5 mr-1" />
                      View Full Size
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = customerProofUrl || '';
                        link.download = ar.depositProof?.fileName || 'payment_proof.jpg';
                        link.click();
                      }}
                      className="flex-1"
                    >
                      <Download className="h-3.5 w-3.5 mr-1" />
                      Download
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 如果客户未上传凭证 */}
          {!ar.depositProof && (
            <div className="border border-yellow-300 rounded-lg p-4 bg-yellow-50">
              <div className="flex items-center gap-2 text-yellow-700">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm font-semibold">Customer has not uploaded payment proof yet.</span>
              </div>
            </div>
          )}

          {/* 财务操作区 */}
          <div className="border-t pt-4 space-y-4">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              Finance Confirmation
            </h3>

            {/* 财务备注 */}
            <div>
              <Label htmlFor="receipt-notes" className="text-sm">Notes (Optional)</Label>
              <Textarea
                id="receipt-notes"
                placeholder="Add notes about the payment receipt or reason for rejection..."
                value={receiptNotes}
                onChange={(e) => setReceiptNotes(e.target.value)}
                rows={3}
                className="mt-1"
              />
            </div>

            {/* 财务上传收款凭证（可选） */}
            <div>
              <Label htmlFor="finance-proof" className="text-sm">Upload Finance Receipt Proof (Optional)</Label>
              <Input
                id="finance-proof"
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileUpload}
                className="mt-1"
              />
              {receiptProofFile && (
                <p className="text-xs text-green-600 mt-1">✓ File uploaded successfully</p>
              )}
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectReceipt}
              className="bg-red-600 hover:bg-red-700"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Payment Not Received
            </Button>
            <Button
              onClick={handleConfirmReceipt}
              className="bg-green-600 hover:bg-green-700"
              disabled={!ar.depositProof}
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Confirm Payment Received
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}