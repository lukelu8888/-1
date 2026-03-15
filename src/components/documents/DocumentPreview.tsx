import React, { useRef } from 'react';
import { X, Download, Printer, Send, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '../ui/button';
import { Dialog, DialogContent } from '../ui/dialog';
import { CustomerInquiryDocument, type CustomerInquiryData } from './templates/CustomerInquiryDocument';
import { QuotationDocument, type QuotationData } from './templates/QuotationDocument';
import { PurchaseOrderDocument, type PurchaseOrderData } from './templates/PurchaseOrderDocument';

interface DocumentPreviewProps {
  document: {
    type: string;
    data?: any;
  };
  onClose: () => void;
}

/**
 * 📄 文档预览组件
 * 
 * 功能：
 * 1. 全屏预览文档
 * 2. 支持缩放
 * 3. 支持打印、下载、发送
 */
export function DocumentPreview({ document, onClose }: DocumentPreviewProps) {
  const [zoom, setZoom] = React.useState(100);
  const documentRef = useRef<HTMLDivElement>(null);

  // 示例数据
  const sampleInquiryData: CustomerInquiryData = {
    inquiryNo: 'INQ-NA-20251210-001',
    inquiryDate: '2025-12-10',
    region: 'NA',
    customer: {
      companyName: 'ABC Trading Corporation',
      contactPerson: 'John Smith',
      position: 'Purchasing Manager',
      email: 'john.smith@abctrading.com',
      phone: '+1-323-555-0123',
      address: '123 Main Street, Suite 500, Los Angeles, CA 90001',
      country: 'United States'
    },
    products: [
      {
        no: 1,
        productName: 'GFCI Outlet',
        specification: '20A, 125V, Tamper-Resistant, Weather-Resistant',
        quantity: 5000,
        unit: 'pcs',
        targetPrice: 2.50,
        currency: 'USD',
        description: 'UL Listed, white color, with LED indicator'
      },
      {
        no: 2,
        productName: 'Weather-Resistant Cover',
        specification: 'IP66 rated, for single gang',
        quantity: 2000,
        unit: 'pcs',
        targetPrice: 1.45,
        currency: 'USD'
      },
      {
        no: 3,
        productName: 'Wall Plate',
        specification: 'Decora style, standard size',
        quantity: 3000,
        unit: 'pcs',
        targetPrice: 0.85,
        currency: 'USD',
        description: 'Various colors available: white, ivory, light almond'
      }
    ],
    requirements: {
      deliveryTime: 'Before March 15, 2026',
      portOfDestination: 'Los Angeles, USA',
      paymentTerms: 'T/T or L/C at sight',
      tradeTerms: 'FOB Xiamen or CIF Los Angeles',
      packingRequirements: 'Export carton with pallets, shrink-wrapped',
      certifications: ['UL', 'FCC', 'CE'],
      otherRequirements: 'Product manual and installation guide required in English'
    },
    remarks: 'This is our first order. We are looking for a long-term supplier. Quality and delivery time are very important to us. Please provide your best price and confirm if you can meet our delivery schedule.'
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // TODO: 生成PDF
    console.log('Download PDF');
  };

  const handleSend = () => {
    // TODO: 发送邮件
    console.log('Send email');
  };

  const renderDocument = () => {
    switch (document.type) {
      case '客户询价单':
        return <CustomerInquiryDocument data={document.data || sampleInquiryData} />;
      case '业务员报价单':
      case '销售报价单':
        return document.data
          ? <QuotationDocument data={document.data as QuotationData} />
          : <div className="text-center text-gray-500 py-16">缺少报价单数据</div>;
      case '采购订单':
      case '采购合同':
        return document.data
          ? <PurchaseOrderDocument data={document.data as PurchaseOrderData} />
          : <div className="text-center text-gray-500 py-16">缺少采购合同数据</div>;
      
      // 其他文档类型将陆续添加
      case '形式发票':
      case '销售合同':
      case '出货通知':
      case '商业发票':
      case '包装清单':
        return (
          <div className="bg-white w-[210mm] min-h-[297mm] mx-auto shadow-lg flex items-center justify-center">
            <div className="text-center text-gray-400">
              <p className="text-xl mb-2">{document.type}</p>
              <p className="text-sm">模板开发中...</p>
            </div>
          </div>
        );
      
      default:
        return (
          <div className="bg-white w-[210mm] min-h-[297mm] mx-auto shadow-lg flex items-center justify-center">
            <p className="text-gray-400">Unknown document type</p>
          </div>
        );
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] w-[95vw] h-[95vh] p-0 bg-[#0A0F1E] border-white/10">
        {/* 顶部工具栏 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-4">
            <h2 className="text-lg text-white/90">{document.type} - 预览</h2>
            <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-1">
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0 text-white/60 hover:text-white/90"
                onClick={() => setZoom(Math.max(50, zoom - 10))}
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-sm text-white/70 min-w-[60px] text-center">
                {zoom}%
              </span>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0 text-white/60 hover:text-white/90"
                onClick={() => setZoom(Math.min(200, zoom + 10))}
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
              onClick={handlePrint}
            >
              <Printer className="w-4 h-4 mr-2" />
              打印
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
              onClick={handleDownload}
            >
              <Download className="w-4 h-4 mr-2" />
              下载PDF
            </Button>
            <Button
              size="sm"
              className="bg-[#F96302] hover:bg-[#F96302]/90 text-white"
              onClick={handleSend}
            >
              <Send className="w-4 h-4 mr-2" />
              发送邮件
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-white/60 hover:text-white/90"
              onClick={onClose}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* 文档预览区域 */}
        <div className="flex-1 overflow-auto bg-gray-100 p-8">
          <div 
            ref={documentRef}
            style={{ 
              transform: `scale(${zoom / 100})`,
              transformOrigin: 'top center',
              transition: 'transform 0.2s'
            }}
          >
            {renderDocument()}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
