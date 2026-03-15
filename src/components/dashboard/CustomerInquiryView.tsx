import React, { forwardRef, useEffect, useState } from 'react';
import { Badge } from '../ui/badge';
import { Boxes, Cloud, Download, FileStack, Link2, Package2, Paperclip, ShieldAlert } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { A4DocumentContainer, type DocumentLayoutConfig } from '../documents/A4PageContainer';
import { CustomerInquiryDocument, type CustomerInquiryData } from '../documents/templates/CustomerInquiryDocument';
import { OemInquirySummary } from './OemInquirySummary';
import { adaptInquiryToDocumentData } from '../../utils/documentDataAdapters';
import { exportToPDF } from '../../utils/pdfExport';
import {
  aggregateInquiryOemFromProducts,
  normalizeOemData,
  type OemFileDeliveryScope,
  type OemFactoryFacingOutput,
  type OemFileProcessingState,
  type OemFileSensitivityLevel,
} from '../../types/oem';

/**
 * 📋 客户端询价单视图 - 使用文档中心的专业模板
 * 
 * 功能：
 * 1. 将客户端的 inquiry 数据转换为文档模板格式
 * 2. 使用与文档中心相同的专业 A4 模板
 * 3. 支持预览和打印
 */

interface CustomerInquiryViewProps {
  inquiry: any;
  audience?: 'customer' | 'internal';
  onUpdateInquiry?: (patch: any) => Promise<void> | void;
}

type InternalAttachmentBundleItem = {
  id: string;
  productId: string | null;
  productName: string;
  customerProductId: string | null;
  customerModelNo: string | null;
  supplierModelNo: string | null;
  fileName: string;
  fileType: string;
  fileSize: number;
  storageUrl: string | null;
  description: string | null;
  customerPartNumber: string | null;
  internalModelNumber: string | null;
  internalSku: string | null;
  sensitivityLevel: OemFileSensitivityLevel;
  processingState: OemFileProcessingState;
  deliveryScope: OemFileDeliveryScope;
  factoryFacingOutput: OemFactoryFacingOutput | null;
};

const getProductPackageSummary = (product: any) => {
  const snapshot = product?.productPackageSnapshot || null;
  const normalizedSnapshotOem = normalizeOemData(snapshot?.oem || null);
  const normalizedProductOem = normalizeOemData(product?.oem || null);
  const attachmentCount =
    Number(snapshot?.attachmentCount || 0) ||
    (normalizedSnapshotOem.enabled ? normalizedSnapshotOem.files.length : 0) ||
    (normalizedProductOem.enabled ? normalizedProductOem.files.length : 0);

  return {
    customerProductId: String(product?.customerProductId || snapshot?.id || '').trim() || null,
    sourceProductId: String(product?.sourceProductId || snapshot?.sourceProductId || '').trim() || null,
    supplierProductId: String(product?.supplierProductId || snapshot?.supplierProductId || '').trim() || null,
    customerModelNo: String(product?.customerModelNo || snapshot?.customerModelNo || '').trim() || null,
    supplierModelNo: String(product?.supplierModelNo || product?.modelNo || snapshot?.supplierModelNo || '').trim() || null,
    attachmentCount,
    description: String(snapshot?.description || product?.specification || product?.specifications || '').trim() || null,
    hasSnapshot: Boolean(snapshot),
    itemType:
      String(product?.itemType || snapshot?.itemType || '').trim() === 'oem_custom'
        ? 'OEM / Custom'
        : 'Standard',
  };
};

const getProjectRevisionSummary = (product: any) => {
  const revision = product?.projectRevisionSnapshot || null;
  if (!revision) return null;
  return {
    projectId: String(revision.projectId || '').trim() || null,
    projectCode: String(revision.projectCode || '').trim() || null,
    projectName: String(revision.projectName || '').trim() || null,
    revisionId: String(revision.revisionId || '').trim() || null,
    revisionCode: String(revision.revisionCode || '').trim() || null,
    revisionStatus: String(revision.revisionStatus || '').trim() || 'working',
    finalRevisionId: String(revision.finalRevisionId || '').trim() || null,
    finalRevisionCode: String(revision.finalRevisionCode || '').trim() || null,
    snapshotAt: String(revision.snapshotAt || '').trim() || null,
    attachmentCount: Number(revision.attachmentCount || 0),
    description: String(revision.description || '').trim() || null,
  };
};

const formatFileSize = (size?: number | null) => {
  const bytes = Number(size || 0);
  if (!bytes) return '-';
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  return `${(bytes / 1024).toFixed(1)} KB`;
};

const getFileExtension = (fileName?: string | null) => {
  const value = String(fileName || '').trim().toLowerCase();
  const dotIndex = value.lastIndexOf('.');
  if (dotIndex < 0) return '';
  return value.slice(dotIndex + 1);
};

const isImageAttachment = (item: InternalAttachmentBundleItem) => {
  const fileType = String(item.fileType || '').toLowerCase();
  const extension = getFileExtension(item.fileName);
  return (
    fileType.startsWith('image/')
    || ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp', 'svg'].includes(extension)
  );
};

const isPdfAttachment = (item: InternalAttachmentBundleItem) => {
  const fileType = String(item.fileType || '').toLowerCase();
  const extension = getFileExtension(item.fileName);
  return fileType === 'application/pdf' || extension === 'pdf';
};

const buildInternalAttachmentBundle = (inquiry: any): InternalAttachmentBundleItem[] => {
  const products = Array.isArray(inquiry?.products) ? inquiry.products : [];
  return products.flatMap((product: any, productIndex: number) => {
    const snapshot = product?.productPackageSnapshot || null;
    const snapshotOem = normalizeOemData(snapshot?.oem || null);
    const productOem = normalizeOemData(product?.oem || null);
    const files = snapshotOem.enabled && snapshotOem.files.length > 0 ? snapshotOem.files : productOem.files;

    return files.map((file: any, fileIndex: number) => {
      const hasSensitiveMarkers = Boolean(
        String(file?.customerPartNumber || '').trim() ||
        String(file?.description || '').trim() ||
        String(snapshot?.customerModelNo || product?.customerModelNo || '').trim()
      );
      const hasInternalReplacement = Boolean(
        String(file?.internalModelNumber || '').trim() ||
        String(file?.internalSku || '').trim()
      );

      const sensitivityLevel = (file?.sensitivityLevel as OemFileSensitivityLevel | undefined)
        || (hasSensitiveMarkers ? 'sensitive' : 'normal');
      const processingState = (file?.processingState as OemFileProcessingState | undefined)
        || (hasInternalReplacement ? 'factory_facing' : 'raw');
      const deliveryScope = (file?.deliveryScope as OemFileDeliveryScope | undefined)
        || (hasInternalReplacement ? 'factory' : hasSensitiveMarkers ? 'internal_only' : 'sales_only');

      return {
        id: String(file?.id || `bundle-${product?.id || productIndex}-${fileIndex}`),
        productId: String(product?.id || '').trim() || null,
        productName: String(product?.productName || `Item ${productIndex + 1}`).trim(),
        customerProductId: String(product?.customerProductId || snapshot?.id || '').trim() || null,
        customerModelNo: String(product?.customerModelNo || snapshot?.customerModelNo || '').trim() || null,
        supplierModelNo: String(product?.supplierModelNo || product?.modelNo || snapshot?.supplierModelNo || '').trim() || null,
        fileName: String(file?.fileName || `Attachment ${fileIndex + 1}`),
        fileType: String(file?.fileType || 'Unknown type'),
        fileSize: Number(file?.fileSize || 0),
        storageUrl: String(file?.storageUrl || '').trim() || null,
        description: String(file?.description || '').trim() || null,
        customerPartNumber: String(file?.customerPartNumber || '').trim() || null,
        internalModelNumber: String(file?.internalModelNumber || '').trim() || null,
        internalSku: String(file?.internalSku || '').trim() || null,
        sensitivityLevel,
        processingState,
        deliveryScope,
        factoryFacingOutput: file?.factoryFacingOutput || null,
      } as InternalAttachmentBundleItem;
    });
  });
};

const attachmentFlowSections: Array<{
  key: 'raw' | 'internal' | 'factory';
  title: string;
  description: string;
  match: (item: InternalAttachmentBundleItem) => boolean;
}> = [
  {
    key: 'raw',
    title: 'Original Files',
    description: 'Customer-origin attachments that remain in raw form and should stay cloud-preserved as source evidence.',
    match: (item) => item.processingState === 'raw',
  },
  {
    key: 'internal',
    title: 'Internal Working Files',
    description: 'Files under internal handling for sales, engineering, or procurement review before any external release.',
    match: (item) => item.processingState === 'internal_redacted' || item.deliveryScope === 'internal_only' || item.deliveryScope === 'procurement',
  },
  {
    key: 'factory',
    title: 'Factory Release Files',
    description: 'Files that are ready for factory-facing release or already marked as factory-facing package outputs.',
    match: (item) => item.processingState === 'factory_facing' || item.deliveryScope === 'factory',
  },
];

const updateFileInCollection = (files: any[] = [], fileId: string, patch: Record<string, unknown>) =>
  (Array.isArray(files) ? files : []).map((file) => (
    String(file?.id || '') === fileId
      ? { ...file, ...patch }
      : file
  ));

const applyAttachmentMetadataPatch = (inquiry: any, fileId: string, patch: Record<string, unknown>) => {
  const products = Array.isArray(inquiry?.products) ? inquiry.products : [];
  const nextProducts = products.map((product: any) => {
    const nextProductOem = product?.oem
      ? {
          ...product.oem,
          files: updateFileInCollection(product.oem.files, fileId, patch),
        }
      : product?.oem;

    const snapshot = product?.productPackageSnapshot || null;
    const nextSnapshotOem = snapshot?.oem
      ? {
          ...snapshot.oem,
          files: updateFileInCollection(snapshot.oem.files, fileId, patch),
        }
      : snapshot?.oem;

    return {
      ...product,
      oem: nextProductOem,
      productPackageSnapshot: snapshot
        ? {
            ...snapshot,
            oem: nextSnapshotOem,
          }
        : snapshot,
    };
  });

  return {
    products: nextProducts,
    oem: aggregateInquiryOemFromProducts(nextProducts),
  };
};

const buildFactoryFacingPatch = (inquiry: any, item: InternalAttachmentBundleItem) => ({
  factoryFacingOutput: {
    generatedAt: new Date().toISOString(),
    generatedBy: 'Internal Sales / Procurement',
    versionLabel: 'FF-DRAFT-01',
    releaseStatus: 'draft' as const,
    coverTitle: 'COSUN Factory Facing Technical Package',
    ownerDepartment: 'Procurement Department',
    projectName: `COSUN OEM PROJECT ${String(inquiry?.inquiryNumber || inquiry?.id || 'ING-DRAFT')}`,
    originalFileName: item.fileName,
    targetFileName: `COSUN-FF-${item.fileName}`,
    notes: 'Placeholder factory-facing cover generated. Replace with branded reframe output before external release.',
  },
  sensitivityLevel: item.sensitivityLevel === 'normal' ? 'sensitive' : item.sensitivityLevel,
  processingState: 'factory_facing' as OemFileProcessingState,
  deliveryScope: 'factory' as OemFileDeliveryScope,
  description: [
    String(item.description || '').trim(),
    '[Factory-facing placeholder generated. Apply COSUN cover/reframe before external release.]',
  ]
    .filter(Boolean)
    .join('\n\n'),
});

const buildFactoryReleaseReadyPatch = (item: InternalAttachmentBundleItem) => ({
  processingState: 'factory_facing' as OemFileProcessingState,
  deliveryScope: 'factory' as OemFileDeliveryScope,
  factoryFacingOutput: item.factoryFacingOutput
    ? {
        ...item.factoryFacingOutput,
        releaseStatus: 'ready' as const,
        notes: [
          String(item.factoryFacingOutput.notes || '').trim(),
          '[Factory release approved for controlled external handoff.]',
        ]
          .filter(Boolean)
          .join('\n\n'),
      }
    : null,
});

function FactoryFacingCoverPreview({
  inquiry,
  item,
  onSaveOutput,
}: {
  inquiry: any;
  item: InternalAttachmentBundleItem;
  onSaveOutput?: (patch: Partial<OemFactoryFacingOutput>) => Promise<void> | void;
}) {
  if (!item.factoryFacingOutput) return null;
  const output = item.factoryFacingOutput;
  const canRenderImage = isImageAttachment(item) && Boolean(item.storageUrl);
  const isPdfFile = isPdfAttachment(item);
  const coverRef = React.useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [draft, setDraft] = useState<Partial<OemFactoryFacingOutput>>({
    coverTitle: output.coverTitle,
    versionLabel: output.versionLabel,
    ownerDepartment: output.ownerDepartment,
    projectName: output.projectName,
    releaseStatus: output.releaseStatus,
    notes: output.notes,
  });
  const isReleaseReady = (draft.releaseStatus || output.releaseStatus) === 'ready';

  useEffect(() => {
    if (!open) return;
    setDraft({
      coverTitle: output.coverTitle,
      versionLabel: output.versionLabel,
      ownerDepartment: output.ownerDepartment,
      projectName: output.projectName,
      releaseStatus: output.releaseStatus,
      notes: output.notes,
    });
  }, [open, output]);

  const handleSave = async () => {
    if (!onSaveOutput) return;
    setSaving(true);
    try {
      const nextCoverTitle = String(draft.coverTitle || '').trim() || output.coverTitle;
      const nextVersionLabel = String(draft.versionLabel || '').trim() || output.versionLabel;
      const nextOwnerDepartment = String(draft.ownerDepartment || '').trim() || output.ownerDepartment;
      const nextProjectName = String(draft.projectName || '').trim() || output.projectName;
      const nextNotes = String(draft.notes || '').trim() || output.notes;
      const requestedReleaseStatus =
        (draft.releaseStatus as OemFactoryFacingOutput['releaseStatus'] | undefined) || output.releaseStatus;
      const contentChanged =
        nextCoverTitle !== output.coverTitle
        || nextVersionLabel !== output.versionLabel
        || nextOwnerDepartment !== output.ownerDepartment
        || nextProjectName !== output.projectName
        || nextNotes !== output.notes;

      await onSaveOutput({
        coverTitle: nextCoverTitle,
        versionLabel: nextVersionLabel,
        ownerDepartment: nextOwnerDepartment,
        projectName: nextProjectName,
        releaseStatus: contentChanged ? 'draft' : requestedReleaseStatus,
        notes: nextNotes,
      });
      if (contentChanged) {
        setDraft((current) => ({
          ...current,
          releaseStatus: 'draft',
        }));
      }
    } finally {
      setSaving(false);
    }
  };

  const handleExportPdf = async () => {
    if (!coverRef.current) return;
    setExporting(true);
    try {
      const safeVersion = String(draft.versionLabel || output.versionLabel || 'FF-DRAFT').replace(/[^a-zA-Z0-9_-]/g, '_');
      const safeFile = String(output.targetFileName || item.fileName || 'factory-cover').replace(/[^a-zA-Z0-9._-]/g, '_');
      const exportFileName = `${safeVersion}_${safeFile}.pdf`;
      await exportToPDF(coverRef.current, exportFileName, {
        format: 'a4',
        orientation: 'portrait',
      });
      if (onSaveOutput) {
        await onSaveOutput({
          exportedAt: new Date().toISOString(),
          exportedBy: 'Internal Sales / Procurement',
          exportedFileName: exportFileName,
        });
      }
    } finally {
      setExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" size="sm" variant="outline" className="justify-start">
          Preview Factory Cover
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[calc(210mm+56px)] max-w-[calc(100vw-2rem)] max-h-[95vh] overflow-hidden border-none bg-[#525659] p-0 gap-0 shadow-2xl">
        <DialogTitle className="sr-only">Factory Cover Preview</DialogTitle>
        <DialogDescription className="sr-only">
          Preview the first-pass COSUN factory-facing cover for this technical attachment.
        </DialogDescription>
        <div className="overflow-y-auto max-h-[95vh] bg-[#525659]">
          <div className="mx-auto w-[210mm] max-w-[calc(100vw-2rem)] bg-white px-6 py-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Factory Cover Header Editor</div>
                <div className="mt-1 text-sm text-slate-600">
                  Adjust the COSUN-facing title block before release. These values write back to the attachment output metadata.
                </div>
              </div>
              {onSaveOutput ? (
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => { void handleExportPdf(); }}
                    disabled={exporting || !isReleaseReady}
                  >
                    {exporting ? 'Exporting PDF...' : 'Export Factory PDF'}
                  </Button>
                  <Button type="button" size="sm" onClick={() => { void handleSave(); }} disabled={saving}>
                    {saving ? 'Saving...' : 'Save Header Fields'}
                  </Button>
                </div>
              ) : null}
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div>
                <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Cover Title</div>
                <Input
                  value={draft.coverTitle || ''}
                  onChange={(event) => setDraft((current) => ({ ...current, coverTitle: event.target.value }))}
                  placeholder="COSUN Factory Facing Technical Package"
                />
              </div>
              <div>
                <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Version</div>
                <Input
                  value={draft.versionLabel || ''}
                  onChange={(event) => setDraft((current) => ({ ...current, versionLabel: event.target.value }))}
                  placeholder="FF-DRAFT-01"
                />
              </div>
              <div>
                <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Owner Department</div>
                <Input
                  value={draft.ownerDepartment || ''}
                  onChange={(event) => setDraft((current) => ({ ...current, ownerDepartment: event.target.value }))}
                  placeholder="Procurement Department"
                />
              </div>
              <div>
                <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Project Name</div>
                <Input
                  value={draft.projectName || ''}
                  onChange={(event) => setDraft((current) => ({ ...current, projectName: event.target.value }))}
                  placeholder="COSUN OEM PROJECT"
                />
              </div>
              <div>
                <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Release Status</div>
                <Select
                  value={draft.releaseStatus || output.releaseStatus}
                  onValueChange={(value) => setDraft((current) => ({
                    ...current,
                    releaseStatus: value as OemFactoryFacingOutput['releaseStatus'],
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="ready">Ready</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Release Notes</div>
                <Textarea
                  value={draft.notes || ''}
                  onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))}
                  rows={4}
                  placeholder="Release notes for factory-facing issue..."
                />
              </div>
            </div>
          </div>
          <A4DocumentContainer ref={coverRef} pageWidth="210mm" pageMinHeight="297mm">
            <section className="h-full text-slate-900">
              <header className="border border-slate-400">
                <div className="grid grid-cols-[1.35fr_0.9fr]">
                  <div className="border-r border-slate-400 px-5 py-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">COSUN Factory Technical Release</p>
                    <h1 className="mt-2 text-[24px] font-bold tracking-tight text-slate-950">{draft.coverTitle || output.coverTitle}</h1>
                    <p className="mt-2 text-[11px] leading-5 text-slate-600">
                      Controlled external release shell for customer-origin technical content. Use this issued cover for factory-facing communication only after internal approval.
                    </p>
                    <div className="mt-3">
                      <Badge className={isReleaseReady ? 'border border-emerald-200 bg-emerald-50 text-emerald-700' : 'border border-amber-200 bg-amber-50 text-amber-700'}>
                        {isReleaseReady ? 'Factory Release Ready' : 'Factory Release Draft'}
                      </Badge>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 text-[11px]">
                    <div className="border-b border-r border-slate-300 px-3 py-3">
                      <div className="text-[10px] uppercase tracking-[0.12em] text-slate-500">Inquiry</div>
                      <div className="mt-1 font-semibold text-slate-900">{inquiry?.inquiryNumber || inquiry?.id || '-'}</div>
                    </div>
                    <div className="border-b border-slate-300 px-3 py-3">
                      <div className="text-[10px] uppercase tracking-[0.12em] text-slate-500">Version</div>
                      <div className="mt-1 font-semibold text-slate-900">{draft.versionLabel || output.versionLabel}</div>
                    </div>
                    <div className="border-r border-slate-300 px-3 py-3">
                      <div className="text-[10px] uppercase tracking-[0.12em] text-slate-500">Owner</div>
                      <div className="mt-1 font-semibold text-slate-900">{draft.ownerDepartment || output.ownerDepartment}</div>
                    </div>
                    <div className="px-3 py-3">
                      <div className="text-[10px] uppercase tracking-[0.12em] text-slate-500">Status</div>
                      <div className="mt-1 font-semibold text-slate-900">{isReleaseReady ? 'READY' : 'DRAFT'}</div>
                    </div>
                  </div>
                </div>
              </header>

              <section className="mt-6 grid gap-6 md:grid-cols-2">
                <div className="rounded-lg border border-slate-200 p-4">
                  <h2 className="text-[13px] font-bold uppercase tracking-[0.14em] text-slate-900">Source Attachment</h2>
                  <div className="mt-3 space-y-2 text-[11px] leading-5 text-slate-700">
                    <p>Original File: {output.originalFileName}</p>
                    <p>Target File: {output.targetFileName}</p>
                    <p>Product: {item.productName}</p>
                    <p>Customer Product ID: {item.customerProductId || '-'}</p>
                    <p>Customer Model#: {item.customerModelNo || '-'}</p>
                    <p>COSUN Model#: {item.supplierModelNo || '-'}</p>
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200 p-4">
                  <h2 className="text-[13px] font-bold uppercase tracking-[0.14em] text-slate-900">Release Control</h2>
                  <div className="mt-3 space-y-2 text-[11px] leading-5 text-slate-700">
                    <p>Generated By: {output.generatedBy}</p>
                    <p>Release Status: {draft.releaseStatus || output.releaseStatus}</p>
                    <p>Delivery Scope: {item.deliveryScope}</p>
                    <p>Sensitivity: {item.sensitivityLevel}</p>
                    <p>Project: {draft.projectName || output.projectName}</p>
                    <p>Last Exported: {output.exportedAt ? new Date(output.exportedAt).toLocaleString() : '-'}</p>
                    <p>Export File: {output.exportedFileName || '-'}</p>
                  </div>
                </div>
              </section>

              <section className="mt-6 rounded-lg border border-slate-200 p-4">
                <h2 className="text-[13px] font-bold uppercase tracking-[0.14em] text-slate-900">Attachment Handling Note</h2>
                <div className="mt-3 whitespace-pre-wrap text-[11px] leading-6 text-slate-700">
                  {draft.notes || output.notes}
                </div>
                {!isReleaseReady ? (
                  <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] leading-5 text-amber-800">
                    Export is locked until this file is marked as <span className="font-semibold">Factory Release Ready</span>.
                    Review the header fields, then promote the attachment from the factory list before generating the final PDF.
                  </div>
                ) : null}
              </section>

              <section className="mt-6 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-[13px] font-bold uppercase tracking-[0.14em] text-slate-900">Factory Cover Placement Area</h2>
                  <Badge className={isReleaseReady ? 'border border-emerald-200 bg-emerald-50 text-emerald-700' : 'border border-amber-200 bg-amber-50 text-amber-700'}>
                    {isReleaseReady ? 'Factory Release Ready' : 'Factory Release Draft'}
                  </Badge>
                </div>
                <div className="mt-4 rounded-lg border border-dashed border-slate-300 bg-white p-4">
                  {canRenderImage ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-3 text-[11px] text-slate-600">
                        <div>
                          Embedded preview of the source image attachment inside the COSUN factory-facing cover shell.
                        </div>
                        <a
                          href={item.storageUrl || '#'}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-slate-700 hover:bg-slate-50"
                        >
                          <Cloud className="h-3.5 w-3.5" />
                          Open Cloud File
                        </a>
                      </div>
                      <div className="flex min-h-[320px] items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-[#f8fafc] p-3">
                        <img
                          src={item.storageUrl || undefined}
                          alt={item.fileName}
                          className="max-h-[500px] w-auto max-w-full rounded border border-slate-200 bg-white object-contain shadow-sm"
                        />
                      </div>
                    </div>
                  ) : isPdfFile ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-3 text-[11px] text-slate-600">
                        <div>
                          PDF attachments stay cloud-first, but this preview now embeds the source document for quick internal review inside the factory-facing shell.
                        </div>
                        {item.storageUrl ? (
                          <a
                            href={item.storageUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-slate-700 hover:bg-slate-50"
                          >
                            <Cloud className="h-3.5 w-3.5" />
                            Open PDF in Cloud
                          </a>
                        ) : null}
                      </div>
                      <div className="rounded-lg border border-slate-200 bg-[#f8fafc] p-4">
                        <div className="mb-3 flex items-center gap-2 text-[11px] text-slate-700">
                          <FileStack className="h-4 w-4 text-slate-400" />
                          <span>{item.fileName}</span>
                          <span className="text-slate-400">•</span>
                          <span>{formatFileSize(item.fileSize)}</span>
                        </div>
                        {item.storageUrl ? (
                          <iframe
                            title={`Factory-facing PDF preview for ${item.fileName}`}
                            src={`${item.storageUrl}#view=FitH&page=1`}
                            className="h-[500px] w-full rounded border border-slate-200 bg-white"
                          />
                        ) : (
                          <div className="flex min-h-[320px] flex-col items-center justify-center rounded-lg border border-slate-200 bg-white px-6 py-10 text-center">
                            <div className="text-sm font-semibold text-slate-800">PDF source detected</div>
                            <div className="mt-2 max-w-[520px] text-[11px] leading-6 text-slate-600">
                              The factory-facing cover metadata is ready. This file currently has no cloud URL available for embedded preview.
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex min-h-[320px] flex-col items-center justify-center rounded-lg border border-slate-200 bg-[#f8fafc] px-6 py-10 text-center">
                      <Package2 className="h-12 w-12 text-slate-400" />
                      <div className="mt-4 text-sm font-semibold text-slate-800">Attachment preview placeholder</div>
                      <div className="mt-2 max-w-[520px] text-[11px] leading-6 text-slate-600">
                        This file type is not embedded yet. Keep using cloud storage as the source of truth and generate the factory-facing package around its release metadata.
                      </div>
                      <div className="mt-4 space-y-1 text-[11px] text-slate-700">
                        <div>File: {item.fileName}</div>
                        <div>Type: {item.fileType || 'Unknown type'}</div>
                        <div>Size: {formatFileSize(item.fileSize)}</div>
                      </div>
                      {item.storageUrl ? (
                        <a
                          href={item.storageUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-5 inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-white"
                        >
                          <Cloud className="h-4 w-4" />
                          Open Cloud File
                        </a>
                      ) : null}
                    </div>
                  )}
                </div>
              </section>
              <footer className="mt-4 grid grid-cols-3 border border-slate-300 text-[10px]">
                <div className="border-r border-slate-300 px-3 py-2">
                  <div className="uppercase tracking-[0.12em] text-slate-500">Prepared By</div>
                  <div className="mt-2 min-h-[28px] font-semibold text-slate-900">{output.generatedBy}</div>
                </div>
                <div className="border-r border-slate-300 px-3 py-2">
                  <div className="uppercase tracking-[0.12em] text-slate-500">Internal Review</div>
                  <div className="mt-2 min-h-[28px] font-semibold text-slate-900">{draft.ownerDepartment || output.ownerDepartment}</div>
                </div>
                <div className="px-3 py-2">
                  <div className="uppercase tracking-[0.12em] text-slate-500">Release Gate</div>
                  <div className="mt-2 min-h-[28px] font-semibold text-slate-900">{isReleaseReady ? 'Approved for Factory Release' : 'Hold Until Ready'}</div>
                  <div className="mt-1 text-slate-600">{output.exportedFileName || 'No export issued yet'}</div>
                </div>
              </footer>
            </section>
          </A4DocumentContainer>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function InternalAttachmentBundlePanel({
  inquiry,
  onUpdateInquiry,
}: {
  inquiry: any;
  onUpdateInquiry?: (patch: any) => Promise<void> | void;
}) {
  const bundleItems = buildInternalAttachmentBundle(inquiry);
  const [savingFileId, setSavingFileId] = useState<string | null>(null);
  if (bundleItems.length === 0) return null;
  const flowBuckets = attachmentFlowSections.map((section) => ({
    ...section,
    items: bundleItems.filter(section.match),
  }));

  const handleUpdate = async (fileId: string, patch: Record<string, unknown>) => {
    if (!onUpdateInquiry) return;
    const nextPatch = applyAttachmentMetadataPatch(inquiry, fileId, patch);
    setSavingFileId(fileId);
    try {
      await onUpdateInquiry(nextPatch);
    } finally {
      setSavingFileId(null);
    }
  };

  return (
    <A4DocumentContainer pageWidth="210mm" pageMinHeight="297mm">
      <section className="h-full">
        <div className="mb-3">
          <div className="mb-2 flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-wider text-black">ATTACHMENT BUNDLE</h2>
              <div className="mt-1 text-xs text-slate-600">
                Cloud-first attachment handoff for customer product packages. Original files stay preserved and can be prepared for internal review or factory release.
              </div>
            </div>
            <Badge variant="outline" className="text-[11px]">
              Sales / Procurement
            </Badge>
          </div>
          <div className="border-t-2 border-b border-gray-400" style={{ borderTopColor: '#000000', borderTopWidth: '3px' }} />
        </div>

        <div className="mb-3 border border-gray-400">
          <div className="bg-gray-200 px-3 py-1.5 text-xs font-bold">BUNDLE OVERVIEW</div>
          <div className="grid grid-cols-4 divide-x divide-gray-300 text-xs">
            <div className="px-3 py-2">
              <div className="text-gray-500">Inquiry No.</div>
              <div className="mt-1 font-semibold text-black">{inquiry?.inquiryNumber || inquiry?.id || '-'}</div>
            </div>
            <div className="px-3 py-2">
              <div className="text-gray-500">Files</div>
              <div className="mt-1 font-semibold text-black">{bundleItems.length}</div>
            </div>
            <div className="px-3 py-2">
              <div className="text-gray-500">Sensitive Files</div>
              <div className="mt-1 font-semibold text-black">
                {bundleItems.filter((item) => item.sensitivityLevel !== 'normal').length}
              </div>
            </div>
            <div className="px-3 py-2">
              <div className="text-gray-500">Flow Split</div>
              <div className="mt-1 font-semibold text-black">
                {flowBuckets[0].items.length} / {flowBuckets[1].items.length} / {flowBuckets[2].items.length}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {flowBuckets.map((section) => (
            <section key={section.key} className="border border-gray-400">
              <div className="bg-gray-100 px-3 py-2">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-bold text-black">{section.title}</div>
                    <div className="mt-0.5 text-[11px] text-slate-600">{section.description}</div>
                  </div>
                  <Badge variant="outline" className="text-[11px]">
                    {section.items.length} file(s)
                  </Badge>
                </div>
              </div>
              {section.items.length === 0 ? (
                <div className="px-3 py-4 text-xs text-slate-500">No files in this stage.</div>
              ) : (
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr className="bg-white">
                      <th className="border border-gray-300 px-2 py-2 text-left">No.</th>
                      <th className="border border-gray-300 px-2 py-2 text-left">Product</th>
                      <th className="border border-gray-300 px-2 py-2 text-left">Attachment</th>
                      <th className="border border-gray-300 px-2 py-2 text-left">Sensitivity / State</th>
                      <th className="border border-gray-300 px-2 py-2 text-left">Internal Mapping</th>
                      <th className="border border-gray-300 px-2 py-2 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {section.items.map((item, index) => (
                      <tr key={`${section.key}-${item.id}`} className="align-top">
                        <td className="border border-gray-300 px-2 py-2 text-center">{index + 1}</td>
                        <td className="border border-gray-300 px-2 py-2">
                          <div className="font-semibold text-black">{item.productName}</div>
                          <div className="mt-1 text-slate-700">Customer Product ID: {item.customerProductId || '-'}</div>
                          <div className="mt-1 text-slate-700">Customer Model#: {item.customerModelNo || '-'}</div>
                          <div className="mt-1 text-slate-700">COSUN Model#: {item.supplierModelNo || '-'}</div>
                        </td>
                        <td className="border border-gray-300 px-2 py-2">
                          <div className="font-semibold text-black">{item.fileName}</div>
                          <div className="mt-1 text-slate-700">{item.fileType} · {formatFileSize(item.fileSize)}</div>
                          <div className="mt-1 whitespace-pre-wrap text-slate-700">{item.description || 'No file description provided.'}</div>
                          <div className="mt-1 text-slate-700">Customer P/N: {item.customerPartNumber || '-'}</div>
                        </td>
                        <td className="border border-gray-300 px-2 py-2">
                          <div className="flex flex-col gap-2">
                            <Badge className={item.sensitivityLevel !== 'normal' ? 'border border-amber-200 bg-amber-50 text-amber-700' : 'border border-slate-200 bg-slate-50 text-slate-700'}>
                              {item.sensitivityLevel === 'highly_sensitive' ? 'Highly Sensitive' : item.sensitivityLevel === 'sensitive' ? 'Sensitive' : 'Normal'}
                            </Badge>
                            <Badge className={item.processingState === 'factory_facing' ? 'border border-emerald-200 bg-emerald-50 text-emerald-700' : item.processingState === 'internal_redacted' ? 'border border-indigo-200 bg-indigo-50 text-indigo-700' : 'border border-slate-200 bg-slate-50 text-slate-700'}>
                              {item.processingState === 'factory_facing' ? 'Factory Facing' : item.processingState === 'internal_redacted' ? 'Internal Redacted' : 'Raw'}
                            </Badge>
                            {item.factoryFacingOutput ? (
                              <Badge className={item.factoryFacingOutput.releaseStatus === 'ready' ? 'border border-emerald-200 bg-emerald-50 text-emerald-700' : 'border border-amber-200 bg-amber-50 text-amber-700'}>
                                {item.factoryFacingOutput.releaseStatus === 'ready' ? 'Release Ready' : 'Release Draft'}
                              </Badge>
                            ) : null}
                            <div className="inline-flex items-start gap-1 text-slate-700">
                              <ShieldAlert className="mt-0.5 h-3.5 w-3.5 text-slate-400" />
                              <span>
                                {item.deliveryScope === 'factory'
                                  ? 'Can move to factory-facing package.'
                                  : item.deliveryScope === 'procurement'
                                    ? 'Available for procurement-side internal handling.'
                                    : item.deliveryScope === 'internal_only'
                                      ? 'Keep internal until redaction / reframe is completed.'
                                      : 'Sales can review. Promote if external release is needed.'}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="border border-gray-300 px-2 py-2">
                          <div className="space-y-1 text-slate-700">
                            <div>Internal MODEL#: {item.internalModelNumber || '-'}</div>
                            <div>Internal SKU: {item.internalSku || '-'}</div>
                            <div>Recommended next step: {item.processingState === 'factory_facing' ? 'Publish factory version' : 'Prepare internal redacted version'}</div>
                          </div>
                        </td>
                        <td className="border border-gray-300 px-2 py-2">
                          <div className="flex flex-col gap-2">
                            {item.storageUrl ? (
                              <>
                                <a
                                  href={item.storageUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 font-semibold text-blue-700 hover:text-blue-800"
                                >
                                  <Cloud className="h-3.5 w-3.5" />
                                  Open Cloud File
                                </a>
                                <a
                                  href={item.storageUrl}
                                  download
                                  className="inline-flex items-center gap-1 font-semibold text-slate-700 hover:text-slate-900"
                                >
                                  <Download className="h-3.5 w-3.5" />
                                  Download
                                </a>
                              </>
                            ) : (
                              <div className="text-slate-500">No cloud file URL stored yet.</div>
                            )}
                            {onUpdateInquiry && section.key === 'factory' ? (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="justify-start border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                onClick={() => {
                                  void handleUpdate(item.id, buildFactoryFacingPatch(inquiry, item));
                                }}
                                disabled={savingFileId === item.id}
                              >
                                {savingFileId === item.id ? 'Generating...' : 'Generate Factory Cover Version'}
                              </Button>
                            ) : null}
                            {section.key === 'factory' && item.factoryFacingOutput ? (
                              <Button
                                type="button"
                                size="sm"
                                variant={item.factoryFacingOutput.releaseStatus === 'ready' ? 'secondary' : 'default'}
                                className={item.factoryFacingOutput.releaseStatus === 'ready'
                                  ? 'justify-start'
                                  : 'justify-start bg-emerald-600 text-white hover:bg-emerald-700'}
                                onClick={() => {
                                  void handleUpdate(item.id, buildFactoryReleaseReadyPatch(item));
                                }}
                                disabled={savingFileId === item.id || item.factoryFacingOutput.releaseStatus === 'ready'}
                              >
                                {item.factoryFacingOutput.releaseStatus === 'ready'
                                  ? 'Factory Release Ready'
                                  : savingFileId === item.id
                                    ? 'Marking Ready...'
                                    : 'Mark as Factory Release Ready'}
                              </Button>
                            ) : null}
                            {section.key === 'factory' && item.factoryFacingOutput ? (
                              <FactoryFacingCoverPreview
                                inquiry={inquiry}
                                item={item}
                                onSaveOutput={onUpdateInquiry ? async (outputPatch) => {
                                  await handleUpdate(item.id, {
                                    factoryFacingOutput: {
                                      ...item.factoryFacingOutput,
                                      ...outputPatch,
                                    },
                                  });
                                } : undefined}
                              />
                            ) : null}
                            {onUpdateInquiry ? (
                              <div className="mt-2 space-y-2 border-t border-dashed border-gray-300 pt-2">
                                <div>
                                  <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Sensitivity</div>
                                  <Select
                                    value={item.sensitivityLevel}
                                    onValueChange={(value) => {
                                      void handleUpdate(item.id, { sensitivityLevel: value as OemFileSensitivityLevel });
                                    }}
                                    disabled={savingFileId === item.id}
                                  >
                                    <SelectTrigger className="h-8 text-[11px]">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="normal">Normal</SelectItem>
                                      <SelectItem value="sensitive">Sensitive</SelectItem>
                                      <SelectItem value="highly_sensitive">Highly Sensitive</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Processing</div>
                                  <Select
                                    value={item.processingState}
                                    onValueChange={(value) => {
                                      void handleUpdate(item.id, { processingState: value as OemFileProcessingState });
                                    }}
                                    disabled={savingFileId === item.id}
                                  >
                                    <SelectTrigger className="h-8 text-[11px]">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="raw">Raw</SelectItem>
                                      <SelectItem value="internal_redacted">Internal Redacted</SelectItem>
                                      <SelectItem value="factory_facing">Factory Facing</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Delivery</div>
                                  <Select
                                    value={item.deliveryScope}
                                    onValueChange={(value) => {
                                      void handleUpdate(item.id, { deliveryScope: value as OemFileDeliveryScope });
                                    }}
                                    disabled={savingFileId === item.id}
                                  >
                                    <SelectTrigger className="h-8 text-[11px]">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="sales_only">Sales Only</SelectItem>
                                      <SelectItem value="internal_only">Internal Only</SelectItem>
                                      <SelectItem value="procurement">Procurement</SelectItem>
                                      <SelectItem value="factory">Factory</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          ))}
        </div>
      </section>
    </A4DocumentContainer>
  );
}

function InternalProductPackagePanel({ inquiry }: { inquiry: any }) {
  const products = Array.isArray(inquiry?.products) ? inquiry.products : [];
  if (products.length === 0) return null;

  return (
    <A4DocumentContainer pageWidth="210mm" pageMinHeight="297mm">
      <section className="h-full">
        <div className="mb-3">
          <div className="mb-2 flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-wider text-black">CUSTOMER PRODUCT PACKAGE SHEET</h2>
              <div className="mt-1 text-xs text-slate-600">
                Internal handoff page for customer-side My Products package references attached to this inquiry.
              </div>
            </div>
            <Badge variant="outline" className="text-[11px]">
              Internal View
            </Badge>
          </div>
          <div className="border-t-2 border-b border-gray-400" style={{ borderTopColor: '#000000', borderTopWidth: '3px' }} />
        </div>

        <div className="mb-3 border border-gray-400">
          <div className="bg-gray-200 px-3 py-1.5 text-xs font-bold">PACKAGE OVERVIEW</div>
          <div className="grid grid-cols-4 divide-x divide-gray-300 text-xs">
            <div className="px-3 py-2">
              <div className="text-gray-500">Inquiry No.</div>
              <div className="mt-1 font-semibold text-black">{inquiry?.inquiryNumber || inquiry?.id || '-'}</div>
            </div>
            <div className="px-3 py-2">
              <div className="text-gray-500">Customer</div>
              <div className="mt-1 font-semibold text-black">{inquiry?.buyerInfo?.companyName || '-'}</div>
            </div>
            <div className="px-3 py-2">
              <div className="text-gray-500">Package-linked Items</div>
              <div className="mt-1 font-semibold text-black">{products.length}</div>
            </div>
            <div className="px-3 py-2">
              <div className="text-gray-500">Generated For</div>
              <div className="mt-1 font-semibold text-black">Sales / Internal Follow-up</div>
            </div>
          </div>
        </div>

        <table className="w-full border-collapse border border-gray-400 text-xs">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-2 py-2 text-left">No.</th>
              <th className="border border-gray-300 px-2 py-2 text-left">Product</th>
              <th className="border border-gray-300 px-2 py-2 text-left">Customer Package Ref</th>
              <th className="border border-gray-300 px-2 py-2 text-left">Model Mapping</th>
              <th className="border border-gray-300 px-2 py-2 text-left">Package Snapshot</th>
              <th className="border border-gray-300 px-2 py-2 text-left">Inquiry Link</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product: any, index: number) => {
              const summary = getProductPackageSummary(product);
              const projectRevision = getProjectRevisionSummary(product);
              return (
                <tr key={String(product?.id || index)} className="align-top">
                  <td className="border border-gray-300 px-2 py-2 text-center">{index + 1}</td>
                  <td className="border border-gray-300 px-2 py-2">
                    <div className="font-semibold text-black">{product?.productName || 'Unnamed Product'}</div>
                    <div className="mt-1 inline-flex items-center gap-1 text-[11px] text-slate-600">
                      <Boxes className="h-3.5 w-3.5" />
                      {summary.itemType}
                    </div>
                  </td>
                  <td className="border border-gray-300 px-2 py-2">
                    <div className="space-y-1">
                      <div><span className="text-gray-500">Customer Product ID:</span> <span className="break-all text-black">{summary.customerProductId || '-'}</span></div>
                      <div><span className="text-gray-500">Source Product ID:</span> <span className="break-all text-black">{summary.sourceProductId || '-'}</span></div>
                      <div className="inline-flex items-center gap-1 text-black">
                        <Paperclip className="h-3.5 w-3.5 text-slate-400" />
                        {summary.attachmentCount} attachment(s)
                      </div>
                    </div>
                  </td>
                  <td className="border border-gray-300 px-2 py-2">
                    <div className="space-y-1">
                      <div><span className="text-gray-500">Customer Model#:</span> <span className="text-black">{summary.customerModelNo || '-'}</span></div>
                      <div className="inline-flex items-center gap-1 text-black">
                        <Link2 className="h-3.5 w-3.5 text-slate-400" />
                        <span>{summary.supplierModelNo || '-'}</span>
                      </div>
                      <div><span className="text-gray-500">Supplier Product ID:</span> <span className="break-all text-black">{summary.supplierProductId || '-'}</span></div>
                    </div>
                  </td>
                  <td className="border border-gray-300 px-2 py-2">
                    <div className="space-y-1">
                      <div className="inline-flex items-center gap-1 text-black">
                        <FileStack className="h-3.5 w-3.5 text-slate-400" />
                        {summary.hasSnapshot ? 'Snapshot attached' : 'No snapshot'}
                      </div>
                      {projectRevision ? (
                        <div className="rounded border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] text-slate-700">
                          <div><span className="text-gray-500">Project:</span> <span className="text-black">{projectRevision.projectCode ? `${projectRevision.projectCode} · ` : ''}{projectRevision.projectName || '-'}</span></div>
                          <div><span className="text-gray-500">Revision:</span> <span className="text-black">{projectRevision.revisionCode || '-'} · {projectRevision.revisionStatus}</span></div>
                          <div><span className="text-gray-500">Final Rev:</span> <span className="text-black">{projectRevision.finalRevisionCode || 'Not locked yet'}</span></div>
                          <div><span className="text-gray-500">Snapshot At:</span> <span className="text-black">{projectRevision.snapshotAt || '-'}</span></div>
                        </div>
                      ) : null}
                      <div className="whitespace-pre-wrap text-slate-700">
                        {summary.description || 'No description snapshot attached.'}
                      </div>
                    </div>
                  </td>
                  <td className="border border-gray-300 px-2 py-2">
                    <div className="space-y-1">
                      <div><span className="text-gray-500">Qty:</span> <span className="text-black">{Number(product?.quantity || 0) || 0}</span></div>
                      <div><span className="text-gray-500">Unit:</span> <span className="text-black">{product?.unit || 'pcs'}</span></div>
                      <div><span className="text-gray-500">Target:</span> <span className="text-black">{Number(product?.targetPrice || product?.price || 0) || 0}</span></div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </A4DocumentContainer>
  );
}

export const CustomerInquiryView = forwardRef<HTMLDivElement, CustomerInquiryViewProps>(
  ({ inquiry, audience = 'customer', onUpdateInquiry }, ref) => {
    const templateSnapshot = inquiry?.templateSnapshot || inquiry?.template_snapshot || null;
    const templateVersion = templateSnapshot?.version || null;
    const documentData = (
      inquiry?.documentDataSnapshot ||
      inquiry?.document_data_snapshot ||
      adaptInquiryToDocumentData(inquiry)
    ) as CustomerInquiryData | null;
    const layoutConfig = (templateVersion?.layout_json || null) as DocumentLayoutConfig | null;
    if (!documentData) {
      return (
        <div className="flex min-h-[240px] items-center justify-center bg-white text-sm text-gray-500">
          该 ING 缺少可用文档数据，暂时无法预览
        </div>
      );
    }

    return (
      <div ref={ref} data-rfq-preview className="bg-white">
        <CustomerInquiryDocument data={documentData} layoutConfig={layoutConfig || undefined} />
        {audience === 'internal' ? <InternalProductPackagePanel inquiry={inquiry} /> : null}
        {audience === 'internal' ? <InternalAttachmentBundlePanel inquiry={inquiry} onUpdateInquiry={onUpdateInquiry} /> : null}
        <OemInquirySummary inquiry={inquiry} audience={audience} />
      </div>
    );
  }
);

CustomerInquiryView.displayName = 'CustomerInquiryView';
