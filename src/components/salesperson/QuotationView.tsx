/**
 * 🔥 业务员报价单查看组件
 * 
 * 功能：在业务员报价管理中查看销售报价单（QT）
 * 使用管理员文档中心的业务员报价单模版
 */

import React, { useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Download, Printer, FileText } from 'lucide-react';
import { Button } from '../ui/button';
import { QuotationDocument, QuotationData } from '../documents/templates/QuotationDocument';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { toast } from 'sonner@2.0.3';
import type { DocumentLayoutConfig } from '../documents/A4PageContainer';
import { getFormalBusinessModelNo } from '../../utils/productModelDisplay';

interface QuotationViewProps {
  quotation: any; // 销售报价单（QT）数据
  onClose: () => void;
}

export function QuotationView({ quotation, onClose }: QuotationViewProps) {
  const documentRef = useRef<HTMLDivElement>(null);

  // 🔥 将QT数据转换为QuotationDocument需要的格式
  const convertToQuotationData = (): QuotationData => {
    return {
      // 报价单基本信息
      quotationNo: quotation.qtNumber,
      quotationDate: quotation.createdAt ? new Date(quotation.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      validUntil: quotation.validUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      inquiryNo: quotation.inqNumber,
      region: quotation.region || 'NA',
      
      // 公司信息
      company: {
        name: '福建高盛达富建材有限公司',
        nameEn: 'Fujian Gaoshengdafu Building Materials Co., Ltd.',
        address: '中国福建省厦门市思明区',
        addressEn: 'Siming District, Xiamen, Fujian Province, China',
        tel: '+86-592-1234567',
        fax: '+86-592-1234568',
        email: 'info@cosun.com',
        website: 'www.cosun.com'
      },
      
      // 客户信息
      customer: {
        companyName: quotation.customerCompany || '',
        contactPerson: quotation.customerName || '',
        address: quotation.customerAddress || '',
        email: quotation.customerEmail || '',
        phone: quotation.customerPhone || ''
      },
      
      // 产品报价列表
      products: quotation.items?.map((item: any, index: number) => ({
        no: index + 1,
        modelNo: getFormalBusinessModelNo(item),
        imageUrl: item.imageUrl || '',
        productName: item.productName || '',
        specification: item.specification || '',
        hsCode: item.hsCode || '',
        quantity: item.quantity || 0,
        unit: item.unit || 'PCS',
        unitPrice: item.salesPrice || item.unitPrice || 0, // 🔥 修复：优先使用salesPrice
        currency: 'USD',
        amount: (item.salesPrice || item.unitPrice || 0) * (item.quantity || 0), // 🔥 修复：金额也使用salesPrice
        moq: item.moq || 0,
        leadTime: item.leadTime || ''
      })) || [],
      
      // 贸易条款
      tradeTerms: {
        incoterms: quotation.tradeTerms?.incoterms || 'FOB Xiamen',
        paymentTerms: quotation.tradeTerms?.paymentTerms || '30% T/T deposit, 70% before shipment',
        deliveryTime: quotation.tradeTerms?.deliveryTime || '25-30 days after deposit',
        packing: quotation.tradeTerms?.packing || 'Export carton with pallets',
        portOfLoading: quotation.tradeTerms?.portOfLoading || 'Xiamen, China',
        portOfDestination: quotation.tradeTerms?.portOfDestination || '',
        warranty: quotation.tradeTerms?.warranty || '12 months from delivery date against manufacturing defects',
        inspection: quotation.tradeTerms?.inspection || "Seller's factory inspection, buyer has the right to re-inspect upon arrival"
      },
      
      // 备注
      remarks: quotation.remarks || '',
      
      // 业务员信息
      salesPerson: {
        name: quotation.salesPersonName || 'Sales Representative',
        position: 'Sales Manager',
        email: quotation.salesPerson || '',
        phone: quotation.salesPersonPhone || '+86-592-1234567',
        whatsapp: quotation.salesPersonWhatsapp || ''
      }
    };
  };

  // 🔥 下载为PDF
  const handleDownloadPDF = async () => {
    if (!documentRef.current) return;

    try {
      toast.info('正在生成PDF，请稍候...');

      const canvas = await html2canvas(documentRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 210; // A4 宽度
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`${quotation.qtNumber}_Quotation.pdf`);

      toast.success('PDF下载成功！');
    } catch (error) {
      console.error('生成PDF失败:', error);
      toast.error('PDF生成失败，请稍后再试');
    }
  };

  // 🔥 打印
  const handlePrint = () => {
    window.print();
  };

  // 🔥 ESC键关闭
  React.useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const templateSnapshot = quotation.templateSnapshot || quotation.template_snapshot || null;
  const templateVersion = templateSnapshot?.version || null;
  const resolvedQuotationData = (quotation.documentDataSnapshot || quotation.document_data_snapshot) as QuotationData | null;
  const layoutConfig = (templateVersion?.layout_json || null) as DocumentLayoutConfig | null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 背景遮罩 */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* 弹窗内容 */}
      <div className="relative bg-white rounded-lg shadow-2xl w-[95vw] h-[95vh] flex flex-col">
        {/* 头部工具栏 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-orange-600" />
            <div>
              <h2 className="text-lg font-bold text-gray-900">销售报价单</h2>
              <p className="text-sm text-gray-500">{quotation.qtNumber}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadPDF}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              下载PDF
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="gap-2"
            >
              <Printer className="h-4 w-4" />
              打印
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="gap-2"
            >
              <X className="h-4 w-4" />
              关闭
            </Button>
          </div>
        </div>
        
        {/* 文档预览区域 */}
        <div className="flex-1 overflow-auto bg-gray-100 p-6">
          <div className="max-w-[210mm] mx-auto">
            {!templateVersion || !resolvedQuotationData ? (
              <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-700">
                该 QT 未绑定模板中心版本快照，无法预览。
              </div>
            ) : (
              <QuotationDocument ref={documentRef} data={resolvedQuotationData} layoutConfig={layoutConfig || undefined} />
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
