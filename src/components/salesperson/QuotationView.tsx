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
import { adaptSalesQuotationToDocumentData } from '../../utils/documentDataAdapters';
import { staffDirectoryService } from '../../lib/supabaseService';
import { useAuth } from '../../hooks/useAuth';

interface QuotationViewProps {
  quotation: any; // 销售报价单（QT）数据
  viewerUser?: {
    name?: string;
    email?: string;
    phone?: string;
  } | null;
  onClose: () => void;
}

export function QuotationView({ quotation, viewerUser = null, onClose }: QuotationViewProps) {
  const documentRef = useRef<HTMLDivElement>(null);
  const { currentUser } = useAuth();

  const resolveViewerIdentity = React.useMemo(() => {
    const parseStoredUser = (key: string) => {
      if (typeof window === 'undefined') return null;
      try {
        const raw = localStorage.getItem(key);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object') return null;
        return parsed;
      } catch {
        return null;
      }
    };

    const roleSwitchedUser = parseStoredUser('cosun_current_user');
    const backendUser = parseStoredUser('cosun_backend_user');
    const authUser = parseStoredUser('cosun_auth_user');

    const email =
      String(
        viewerUser?.email
        || currentUser?.email
        || roleSwitchedUser?.email
        || backendUser?.loginEmail
        || backendUser?.email
        || authUser?.email
        || ''
      ).trim();

    const name =
      String(
        viewerUser?.name
        || currentUser?.name
        || roleSwitchedUser?.name
        || backendUser?.displayName
        || backendUser?.name
        || authUser?.name
        || ''
      ).trim();

    return { email, name };
  }, [currentUser?.email, currentUser?.name, viewerUser?.email, viewerUser?.name]);

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
  const snapshotData = (quotation.documentDataSnapshot || quotation.document_data_snapshot || null) as QuotationData | null;
  const matchedStaff = staffDirectoryService.getCachedSalesStaff().find(
    (staff) => String(staff.email || '').trim().toLowerCase() === String(resolveViewerIdentity.email || '').trim().toLowerCase()
  );
  const resolvedSalesPersonName =
    resolveViewerIdentity.name
    || matchedStaff?.name
    || quotation.salesPersonName
    || '';
  const resolvedSalesPersonEmail =
    resolveViewerIdentity.email
    || quotation.salesPerson
    || '';
  const resolvedSalesPersonPhone =
    viewerUser?.phone
    || quotation.salesPersonPhone
    matchedStaff?.phone
    || '+86-592-1234567';
  const rebuiltQuotationData = adaptSalesQuotationToDocumentData({
    ...quotation,
    qtNumber: quotation.qtNumber,
    quotationDate: quotation.quotationDate,
    createdAt: quotation.createdAt,
    validUntil: quotation.validUntil,
    inqNumber: quotation.inqNumber,
    region: quotation.region,
    customerCompany: quotation.customerCompany,
    customerName: quotation.customerName,
    customerAddress: quotation.customerAddress,
    customerEmail: quotation.customerEmail,
    customerPhone: quotation.customerPhone,
    items: quotation.items,
    tradeTerms: quotation.tradeTerms,
    remarks: quotation.remarks || quotation.notes || '',
    salesPersonName: resolvedSalesPersonName,
    salesPerson: resolvedSalesPersonEmail,
    salesPersonPhone: resolvedSalesPersonPhone,
    salesPersonWhatsapp: quotation.salesPersonWhatsapp,
  });
  const resolvedQuotationData: QuotationData = {
    ...rebuiltQuotationData,
    salesPerson: {
      ...rebuiltQuotationData.salesPerson,
      name: resolvedSalesPersonName || rebuiltQuotationData.salesPerson.name,
      email: resolvedSalesPersonEmail || rebuiltQuotationData.salesPerson.email,
      phone: resolvedSalesPersonPhone || rebuiltQuotationData.salesPerson.phone,
    },
    templateSettings: snapshotData?.templateSettings || rebuiltQuotationData.templateSettings,
  };
  const layoutConfig = (templateVersion?.layout_json || null) as DocumentLayoutConfig | null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 背景遮罩 */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* 弹窗内容 */}
      <div className="relative flex h-[95vh] w-[min(96vw,calc(210mm+140px))] flex-col rounded-lg bg-white shadow-2xl">
        {/* 头部工具栏 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-orange-600" />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-gray-900">销售报价单</h2>
                <span className="rounded-full border border-orange-200 bg-orange-50 px-2 py-0.5 text-xs font-semibold text-orange-700">
                  模板版本：{templateVersion?.version || '未绑定'}
                </span>
              </div>
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
          <div className="mx-auto max-w-[210mm]">
            <QuotationDocument ref={documentRef} data={resolvedQuotationData} layoutConfig={layoutConfig || undefined} />
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
