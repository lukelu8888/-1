import React, { useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Printer, Download, X } from 'lucide-react';
import OrderTemplate from './OrderTemplate';
import OrderTemplatePaginated from './OrderTemplatePaginated'; // 🔥 分页版订单模板

interface OrderProduct {
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  specs: string;
  produced?: number;
  customerProductId?: string;
  projectId?: string | null;
  projectRevisionId?: string | null;
  projectRevisionCode?: string | null;
}

interface Order {
  id: string;
  orderNumber: string;
  date: string;
  customer: string;
  customerEmail?: string;
  quotationNumber?: string;
  expectedDelivery: string;
  totalAmount: number;
  currency: string;
  products: OrderProduct[];
  paymentTerms: string;
  deliveryTerms: string;
  shippingMethod?: string;
  notes?: string;
  status?: string;
}

interface ViewOrderDialogProps {
  open: boolean;
  onClose: () => void;
  order: Order | null;
}

export default function ViewOrderDialog({
  open,
  onClose,
  order
}: ViewOrderDialogProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    // 使用浏览器原生打印
    window.print();
  };

  const handleDownload = () => {
    // 触发打印对话框，用户可以选择"保存为PDF"
    window.print();
  };

  if (!order) return null;

  const primaryProjectItem = order.products.find((item) => Boolean(item?.projectRevisionId));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-base">查看訂單</DialogTitle>
              <p className="text-xs text-gray-500 mt-1">Order Number: {order.orderNumber}</p>
              {primaryProjectItem && (
                <div className="mt-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
                  <span className="font-medium text-slate-900">Execution Baseline</span>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-slate-500">
                    <span>Revision: {primaryProjectItem.projectRevisionCode || '-'}</span>
                    <span>Quotation: {order.quotationNumber || '-'}</span>
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 print:hidden">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={handlePrint}
              >
                <Printer className="w-3.5 h-3.5 mr-1" />
                列印
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={handleDownload}
              >
                <Download className="w-3.5 h-3.5 mr-1" />
                下載PDF
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* 台湾大厂风格订单模板 */}
        <div className="mt-4">
          <OrderTemplatePaginated ref={printRef} order={order} /> {/* 🔥 使用分页版本 */}
        </div>

        {/* 底部操作按钮 */}
        <div className="flex justify-end gap-2 pt-4 border-t print:hidden">
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={onClose}>
            <X className="w-3.5 h-3.5 mr-1" />
            關閉
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
