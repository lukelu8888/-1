/**
 * SupplierQuotationDocumentViewer
 *
 * Wraps the professional DocumentModal with persisted template-center data.
 *
 * Data flow:
 *   quotation (Supabase row with persisted template binding)
 *     → documentDataSnapshot            (SupplierQuotationData)
 *     → SupplierQuotationDocumentA4Pages
 *     → ProcurementDocumentViewerShell
 *
 * Error / loading states:
 *   • missing persisted snapshot → inline error page
 *   • pages[]                  → passed straight to DocumentModal
 */

import React, { useMemo } from 'react';
import { Download, Edit, FileText, Printer, RefreshCw, Send } from 'lucide-react';
import { Button } from '../ui/button';
import type { SupplierQuotationData } from '../documents/templates/SupplierQuotationDocument';
import { ProcurementDocumentViewerShell } from '../admin/purchase-order/ProcurementDocumentViewerShell';
import { exportToPDF, exportToPDFPrint, generatePDFFilename } from '../../utils/pdfExport';
import { toast } from 'sonner@2.0.3';
import { SupplierQuotationDocumentA4Pages } from '../documents/templates/paginated/SupplierQuotationDocumentA4';
import { useAuth } from '../../hooks/useAuth';
import { useUser } from '../../contexts/UserContext';
import {
  SUPPLIER_DOCUMENT_PREVIEW_BODY_CLASS,
  SUPPLIER_DOCUMENT_PREVIEW_INNER_CLASS,
} from './documentPreviewStandards';

interface Props {
  open: boolean;
  onClose: () => void;
  /** Persisted quotation object from Supabase */
  quotation: any;
  onEdit?: () => void;
  onSubmit?: () => void;
  /** Additional action buttons for admin view (Accept / Reject) */
  extraActions?: React.ReactNode;
}

export default function SupplierQuotationDocumentViewer({
  open,
  onClose,
  quotation,
  onEdit,
  onSubmit,
  extraActions,
}: Props) {
  const documentRef = React.useRef<HTMLDivElement>(null);
  const { currentUser } = useAuth();
  const { user: authUser, userInfo } = useUser();
  const templateSnapshot = quotation?.templateSnapshot || quotation?.template_snapshot || null;
  const templateVersion = templateSnapshot?.version || null;
  const rawData = (quotation?.documentDataSnapshot || quotation?.document_data_snapshot || null) as SupplierQuotationData | null;
  const data = useMemo(() => {
    if (!rawData) return null;
    const projectExecutionBaseline = quotation?.documentRenderMeta?.projectExecutionBaseline
      || quotation?.document_render_meta?.projectExecutionBaseline
      || (quotation?.projectRevisionId
        ? {
            projectId: quotation.projectId || null,
            projectCode: quotation.projectCode || null,
            projectName: quotation.projectName || null,
            projectRevisionId: quotation.projectRevisionId || null,
            projectRevisionCode: quotation.projectRevisionCode || null,
            projectRevisionStatus: quotation.projectRevisionStatus || null,
            finalRevisionId: quotation.finalRevisionId || null,
            finalQuotationId: quotation.finalQuotationId || null,
            finalQuotationNumber: quotation.finalQuotationNumber || null,
          }
        : null);
    return projectExecutionBaseline
      ? { ...rawData, projectExecutionBaseline }
      : rawData;
  }, [quotation, rawData]);
  const actorOverrides = useMemo(() => {
    const parseStoredUser = (key: string) => {
      if (typeof window === 'undefined') return null;
      try {
        const raw = localStorage.getItem(key);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === 'object' ? parsed : null;
      } catch {
        return null;
      }
    };

    const roleSwitchedUser = parseStoredUser('cosun_current_user');
    const authCachedUser = parseStoredUser('cosun_auth_user');
    const backendUser = parseStoredUser('cosun_backend_user');

    const resolvedName = String(
      userInfo?.contactPerson ||
      currentUser?.name ||
      authUser?.name ||
      roleSwitchedUser?.name ||
      backendUser?.displayName ||
      backendUser?.name ||
      authCachedUser?.name ||
      '',
    ).trim();
    const resolvedEmail = String(
      userInfo?.email ||
      currentUser?.email ||
      authUser?.email ||
      roleSwitchedUser?.email ||
      backendUser?.loginEmail ||
      backendUser?.email ||
      authCachedUser?.email ||
      '',
    ).trim();

    return {
      supplierContactPerson: resolvedName || data?.supplier.contactPerson || '',
      supplierEmail: resolvedEmail || data?.supplier.email || '',
      supplierRemarkBy: resolvedName || data?.supplierRemarks?.remarkBy || '',
    };
  }, [
    authUser?.email,
    authUser?.name,
    currentUser?.email,
    currentUser?.name,
    userInfo?.contactPerson,
    userInfo?.email,
    data?.supplier.contactPerson,
    data?.supplier.email,
    data?.supplierRemarks?.remarkBy,
  ]);
  const isEmpty = !quotation;

  const isDraft = quotation?.status === 'draft';

  // ── Toolbar action buttons ────────────────────────────────────────────────
  const actions = (
    <>
      <Button
        variant="outline"
        size="sm"
        className="gap-2"
        onClick={async () => {
          if (!documentRef.current) return;
          try {
            const filename = generatePDFFilename('Supplier_Quotation', quotation?.quotationNo ?? quotation?.bjNumber ?? 'BJ');
            await exportToPDF(documentRef.current, filename);
            toast.success('供应商报价PDF导出成功！');
          } catch (error) {
            toast.error('PDF导出失败，请重试');
            console.error('PDF export error:', error);
          }
        }}
      >
        <Download className="h-4 w-4" />
        下载PDF
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="gap-2"
        onClick={async () => {
          if (!documentRef.current) return;
          const filename = generatePDFFilename('Supplier_Quotation', quotation?.quotationNo ?? quotation?.bjNumber ?? 'BJ');
          await exportToPDFPrint(documentRef.current, filename);
        }}
      >
        <Printer className="h-4 w-4" />
        打印
      </Button>
      {onEdit && isDraft && (
        <Button
          variant="outline" size="sm"
          className="h-8 text-xs gap-1.5"
          onClick={onEdit}
        >
          <Edit className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">编辑</span>
        </Button>
      )}
      {onSubmit && isDraft && (
        <Button
          size="sm"
          className="h-8 text-xs gap-1.5 bg-green-600 hover:bg-green-700 text-white"
          onClick={onSubmit}
        >
          <Send className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">提交报价</span>
        </Button>
      )}
      {extraActions}
    </>
  );

  // ── Loading / error pages (inline in document area) ───────────────────────
  const errorPage = (
    <div className="flex flex-col items-center justify-center h-64 gap-4 text-slate-500">
      <RefreshCw className="w-8 h-8 text-slate-300" />
      <p className="text-sm">报价单数据暂时无法加载</p>
      <Button variant="outline" size="sm" onClick={onClose}>关闭</Button>
    </div>
  );

  const emptyPage = (
    <div className="flex items-center justify-center h-64 text-slate-400 text-sm">
      暂无报价单数据
    </div>
  );

  const missingBoundSnapshot = !isEmpty && (!templateVersion || !data);

  const snapshotErrorPage = (
    <div className="flex flex-col items-center justify-center h-64 gap-4 text-slate-500">
      <RefreshCw className="w-8 h-8 text-slate-300" />
      <p className="text-sm">该 BJ 未绑定模板中心版本快照，无法预览</p>
      <Button variant="outline" size="sm" onClick={onClose}>关闭</Button>
    </div>
  );

  const fallbackContent = isEmpty
    ? emptyPage
    : missingBoundSnapshot
      ? snapshotErrorPage
      : errorPage;

  return (
    <ProcurementDocumentViewerShell
      open={open}
      onClose={onClose}
      title="供应商报价单"
      subtitle={data ? data.quotationNo : quotation?.quotationNo}
      templateLabel={templateVersion?.version || '未绑定'}
      icon={<FileText className="h-6 w-6" />}
      actions={actions}
      bodyClassName={SUPPLIER_DOCUMENT_PREVIEW_BODY_CLASS}
      innerClassName={SUPPLIER_DOCUMENT_PREVIEW_INNER_CLASS}
    >
      <div ref={documentRef}>
        {data && !missingBoundSnapshot ? (
          <SupplierQuotationDocumentA4Pages data={data} actorOverrides={actorOverrides} />
        ) : (
          fallbackContent
        )}
      </div>
    </ProcurementDocumentViewerShell>
  );
}
