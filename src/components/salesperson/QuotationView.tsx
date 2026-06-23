/**
 * 🔥 业务员报价单查看组件
 * 
 * 功能：在业务员报价管理中查看销售报价单（QT）
 * 使用管理员文档中心的业务员报价单模版
 */

import React, { useRef } from 'react';
import { Download, Printer, FileText } from 'lucide-react';
import { Button } from '../ui/button';
import { QuotationDocument, QuotationData } from '../documents/templates/QuotationDocument';
import { toast } from 'sonner@2.0.3';
import type { DocumentLayoutConfig } from '../documents/A4PageContainer';
import { adaptSalesQuotationToDocumentData } from '../../utils/documentDataAdapters';
import { staffDirectoryService } from '../../lib/supabaseService';
import { useAuth } from '../../hooks/useAuth';
import { exportToPDF, exportToPDFPrint, generatePDFFilename } from '../../utils/pdfExport';
import { StandardDocumentViewerShell } from '../documents/StandardDocumentViewerShell';

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

  const handleDownloadPDF = async () => {
    if (!documentRef.current) return;

    try {
      const filename = generatePDFFilename('Quotation', quotation.qtNumber || 'QT');
      await exportToPDF(documentRef.current, filename);
    } catch (error) {
      console.error('生成PDF失败:', error);
      toast.error('PDF生成失败，请稍后再试');
    }
  };

  const handlePrint = async () => {
    if (!documentRef.current) return;
    const filename = generatePDFFilename('Quotation', quotation.qtNumber || 'QT');
    await exportToPDFPrint(documentRef.current, filename);
  };

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
    || matchedStaff?.phone
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

  return (
    <StandardDocumentViewerShell
      open={true}
      onClose={onClose}
      title="销售报价单"
      subtitle={quotation.qtNumber}
      templateLabel={templateVersion?.version || '未绑定'}
      icon={<FileText className="h-6 w-6" />}
      actions={
        <>
          <Button variant="outline" size="sm" onClick={handleDownloadPDF} className="gap-2">
            <Download className="h-4 w-4" />
            下载PDF
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2">
            <Printer className="h-4 w-4" />
            打印
          </Button>
        </>
      }
    >
      <div ref={documentRef}>
        <QuotationDocument data={resolvedQuotationData} layoutConfig={layoutConfig || undefined} />
      </div>
    </StandardDocumentViewerShell>
  );
}
