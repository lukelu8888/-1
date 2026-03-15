/**
 * SupplierQuotationDocumentViewer
 *
 * Wraps the professional DocumentModal with persisted template-center data.
 *
 * Data flow:
 *   quotation (Supabase row with persisted template binding)
 *     → documentDataSnapshot            (SupplierQuotationData)
 *     → buildQuotationPages             (paginates into A4 ReactNode[])
 *     → DocumentModal                   (draggable, zoom, PDF, print)
 *
 * Error / loading states:
 *   • missing persisted snapshot → inline error page
 *   • pages[]                  → passed straight to DocumentModal
 */

import React, { useMemo } from 'react';
import { Edit, Send, RefreshCw } from 'lucide-react';
import { Button } from '../ui/button';
import { DocumentModal } from '../documents/DocumentModal';
import { buildQuotationPages } from '../documents/templates/SupplierQuotationPages';
import type { SupplierQuotationData } from '../documents/templates/SupplierQuotationDocument';

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
  const isEmpty = !quotation;

  // ── Build paginated A4 pages from the resolved data ───────────────────────
  const pages = useMemo(
    () => (data ? buildQuotationPages(data) : []),
    [data],
  );

  const isDraft = quotation?.status === 'draft';

  // ── Toolbar action buttons ────────────────────────────────────────────────
  const actions = (
    <>
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

  const displayPages = isEmpty
    ? [emptyPage]
    : missingBoundSnapshot
      ? [snapshotErrorPage]
    : pages.length === 0 && !data
      ? [errorPage]
      : pages;

  return (
    <DocumentModal
      open={open}
      onClose={onClose}
      title="报价单文档"
      subtitle={
        data
          ? <span className="text-slate-500">{data.quotationNo}</span>
          : quotation?.quotationNo
      }
      pages={displayPages}
      actions={actions}
      fileName={`${quotation?.quotationNo ?? quotation?.bjNumber ?? 'bj'}.pdf`}
    />
  );
}
