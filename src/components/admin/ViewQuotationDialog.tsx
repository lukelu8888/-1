import React, { useRef } from 'react';
import { createPortal } from 'react-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Printer, Download, X, ArrowRight } from 'lucide-react';
import { Quotation } from './QuotationManagement';
import { QuotationDocument, QuotationData } from '../documents/templates/QuotationDocument'; // 🔥 使用文档中心的专业模板
import { getFormalBusinessModelNo } from '../../utils/productModelDisplay';

interface ViewQuotationDialogProps {
  open: boolean;
  onClose: () => void;
  quotation: Quotation | null;
  onConvertToOrder?: (quotationId: string) => void;
}

export default function ViewQuotationDialog({
  open,
  onClose,
  quotation,
  onConvertToOrder
}: ViewQuotationDialogProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    // 使用当前页面打印，通过CSS控制只打印报价单
    window.print();
  };

  const handleDownload = () => {
    // 触发打印对话框，用户可以选择"保存为PDF"
    handlePrint();
  };

  if (!quotation) return null;

  const quotationRoleLabel = (() => {
    const labels: Record<string, string> = {
      budgetary: 'Budgetary',
      technical_review: 'Technical Review',
      commercial_offer: 'Commercial Offer',
      final_offer: 'Final Offer',
      accepted: 'Accepted',
    };
    return labels[String(quotation.quotationRole || '')] || 'Standard';
  })();

  // 🔥 转换数据格式：Quotation → QuotationData
  const quotationData: QuotationData = {
    quotationNo: quotation.quotationNumber,
    quotationDate: quotation.quotationDate,
    validUntil: quotation.validUntil,
    inquiryNo: quotation.inquiryNumber,
    region: (quotation.region === 'North America' ? 'NA' : 
             quotation.region === 'South America' ? 'SA' : 'EU') as 'NA' | 'SA' | 'EU',
    
    company: {
      name: '福建高盛达富建材有限公司',
      nameEn: 'Fujian Gaoshengdafu Building Materials Co., Ltd.',
      address: '福建省福州市仓山区建新镇XX工业区XX号',
      addressEn: 'XX Industrial Zone, Jianxin Town, Cangshan District, Fuzhou, Fujian, China',
      tel: '+86-591-8888-8888',
      fax: '+86-591-8888-8889',
      email: 'sales@gaoshengdafu.com',
      website: 'www.gaoshengdafu.com'
    },
    
    customer: {
      companyName: quotation.customer || quotation.customerName,
      contactPerson: quotation.customerName || quotation.customer,
      email: quotation.customerEmail,
      phone: ''
    },
    
    products: quotation.products.map((p, idx) => ({
      no: idx + 1,
      modelNo: getFormalBusinessModelNo(p),
      imageUrl: p.image,
      productName: p.name || p.productName || '',
      specification: p.specs || '',
      quantity: p.quantity,
      unit: p.unit || 'PCS',
      unitPrice: p.unitPrice,
      currency: quotation.currency,
      amount: p.totalPrice || (p.unitPrice * p.quantity),
      leadTime: '25-30 days'
    })),
    
    tradeTerms: {
      incoterms: quotation.tradeTerms || quotation.deliveryTerms || 'FOB Xiamen',
      paymentTerms: quotation.paymentTerms || '30% T/T deposit, 70% before shipment',
      deliveryTime: '25-30 days after deposit',
      packing: quotation.packing || 'Export standard carton with wooden pallet',
      portOfLoading: quotation.portOfLoading || 'Xiamen, China',
      warranty: quotation.warranty || '12 months from delivery date',
      inspection: quotation.inspection || 'Seller\'s factory inspection'
    },
    
    remarks: quotation.notes || '',
    
    salesPerson: {
      name: 'Sales Team',
      position: 'Sales Representative',
      email: 'sales@gaoshengdafu.com',
      phone: '+86-591-8888-8888'
    }
  };

  return (
    <>
      {/* 打印专用样式 - 改进版 */}
      <style>{`
        @media print {
          /* 打印时的页面设置 */
          @page {
            margin: 8mm;
            size: A4 portrait;
          }
          
          /* 重置body样式 */
          body {
            margin: 0 !important;
            padding: 0 !important;
          }
          
          /* 隐藏Dialog相关元素 */
          [role="dialog"],
          [data-radix-dialog-overlay],
          [data-radix-dialog-content],
          .dialog-overlay,
          .dialog-content,
          button,
          header,
          nav,
          aside,
          footer {
            display: none !important;
          }
          
          /* 显示打印区域 */
          .print-area {
            display: block !important;
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: auto !important;
            max-height: none !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
          }
          
          /* 确保打印区域的子元素正常显示 */
          .print-area * {
            max-height: none !important;
            overflow: visible !important;
          }
          
          /* 表格分页控制 */
          .print-area table {
            page-break-inside: auto !important;
            width: 100% !important;
          }
          .print-area tr {
            page-break-inside: avoid !important;
            page-break-after: auto !important;
          }
          .print-area thead {
            display: table-header-group !important;
          }
          .print-area tbody {
            display: table-row-group !important;
          }
        }
      `}</style>
      
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="print:hidden">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-base">查看報價單</DialogTitle>
                <DialogDescription className="text-xs text-gray-500 mt-1">
                  Quotation Number: {quotation.quotationNumber}
                </DialogDescription>
                {quotation.projectRevisionId && (
                  <div className="mt-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
                    <div className="font-medium text-slate-900">
                      {quotation.projectCode ? `${quotation.projectCode} · ` : ''}
                      {quotation.projectName || 'Project quotation'}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-slate-500">
                      <span>Revision: {quotation.projectRevisionCode || '-'}</span>
                      <span>Status: {quotation.projectRevisionStatus || 'working'}</span>
                      <span>Role: {quotationRoleLabel}</span>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
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
                {quotation.status === 'confirmed' && onConvertToOrder && (
                  <Button
                    size="sm"
                    className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => {
                      onConvertToOrder(quotation.id);
                      onClose();
                    }}
                  >
                    <ArrowRight className="w-3.5 h-3.5 mr-1" />
                    下推訂單
                  </Button>
                )}
              </div>
            </div>
          </DialogHeader>

          {/* 使用文档中心的专业报价单模板 */}
          <div className="mt-4">
            <QuotationDocument ref={printRef} data={quotationData} />
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
      
      {/* 打印专用容器 - 使用Portal放在body的直接子元素 */}
      {open && createPortal(
        <div className="print-area" style={{ display: 'none' }}>
          <QuotationDocument data={quotationData} />
        </div>,
        document.body
      )}
    </>
  );
}
