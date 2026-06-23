import { useEffect, useMemo, useRef, useState } from 'react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import {
  Archive,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock,
  Eye,
  FileStack,
  FileText,
  GitBranchPlus,
  LayoutGrid,
  LayoutList,
  Package,
  Paperclip,
  Plus,
  Search,
  ShoppingCart,
  Tag,
  Trash2,
  Upload,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import { customerProductLibraryService, type CustomerProductRecord } from '../../lib/customerProductLibrary';
import { useOrders } from '../../contexts/OrderContext';
import { useSalesQuotations, type SalesQuotation } from '../../contexts/SalesQuotationContext';
import {
  buildProductLibraryAssets,
  resolveProductLibraryCustomerEmail,
  type ProductLibraryAsset,
} from '../../lib/productLibraryPortfolio';
import { isSupabaseStorageBridgeReady } from '../../lib/supabaseStorageBridge';
import { resolveCustomerBusinessMode } from '../../lib/customerBusinessMode';
import { createOemUploadRecord, normalizeOemData, type OemUploadedFile } from '../../types/oem';
import { customerAssetAdapter } from '../../lib/adapters/customerAssetAdapter';
import { tradeProductSnapshotService } from '../../lib/services/tradeProductSnapshotService';
import { toast } from 'sonner';
import { CreateProductFlow } from './product-library/CreateProductFlow';
import type { CreateProductCompletion } from './product-library/createProductFlowTypes';

// ─── Formatters ────────────────────────────────────────────────────────────────

const priceFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const normalizeLower = (value: unknown) => String(value || '').trim().toLowerCase();

const filesSignature = (files: OemUploadedFile[]) =>
  JSON.stringify(
    files.map((file) => ({
      id: file.id,
      name: file.name,
      description: file.description || '',
      customerPartNumber: file.customerPartNumber || '',
      sensitivityLevel: file.sensitivityLevel || 'normal',
      processingState: file.processingState || 'raw',
      deliveryScope: file.deliveryScope || 'sales_only',
      storageUrl: file.storageUrl || '',
    })),
  );

const formatPrice = (value: number | null) => {
  if (value === null || !Number.isFinite(value)) return '—';
  return priceFormatter.format(value);
};

const formatDate = (value?: string | null) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

const formatDateTime = (value?: string | null) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString();
};

const getNewInquiryDraftStorageKey = (customerEmail: string) =>
  `${NEW_INQUIRY_DRAFT_PRODUCTS_KEY}:${String(customerEmail || 'anonymous').trim().toLowerCase() || 'anonymous'}`;

const loadPendingInquiryDraftProducts = (customerEmail: string) => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(getNewInquiryDraftStorageKey(customerEmail));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const persistPendingInquiryDraftProducts = (customerEmail: string, products: any[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(getNewInquiryDraftStorageKey(customerEmail), JSON.stringify(products));
};

const formatProductTypeLabel = (product: ProductLibraryAsset) => {
  if (product.manualRecord?.serviceType === 'qc_service') return 'QC Service';
  if (product.manualRecord?.serviceType === 'general_service') return 'General Service';
  if (product.isProjectBased) return 'Project';
  if (product.itemType === 'oem_custom') return 'OEM / Custom';
  return 'Standard';
};

const formatProductTypeBadgeClass = (product: ProductLibraryAsset) => {
  if (product.manualRecord?.serviceType) return 'bg-purple-50 text-purple-700 border-purple-200';
  if (product.isProjectBased) return 'bg-blue-50 text-blue-700 border-blue-200';
  if (product.itemType === 'oem_custom') return 'bg-amber-50 text-amber-700 border-amber-200';
  return 'bg-slate-50 text-slate-700 border-slate-200';
};

const formatInquiryReadyLabel = (product: ProductLibraryAsset) => {
  if (product.isProjectBased) {
    return product.finalRevisionCode
      ? `Rev ${product.finalRevisionCode} locked`
      : `Rev ${product.currentRevisionCode || '—'} active`;
  }
  if (product.attachmentCount > 0) return 'Files ready';
  if (product.description) return 'Ready';
  return 'Add details';
};

const formatPackageStatus = (status: ProductLibraryAsset['packageStatus']) => {
  if (status === 'technical_package_ready') return 'Files Ready';
  if (status === 'basic_package') return 'Basic Package';
  return 'No Package';
};

const formatProductStatusLabel = (status: ProductLibraryAsset['productStatus']) => {
  if (status === 'archived') return 'Archived';
  if (status === 'draft') return 'Draft';
  return 'Active';
};

const formatAssetSourceType = (sourceType?: ProductLibraryAsset['assetSourceType']) => {
  if (sourceType === 'saved_from_website') return 'Saved from Website';
  if (sourceType === 'derived_from_inquiry') return 'From Inquiry';
  if (sourceType === 'derived_from_order') return 'From Order';
  if (sourceType === 'assigned_by_cosun') return 'Assigned by COSUN';
  return 'Created by You';
};

const formatMasterLinkLabel = (product: ProductLibraryAsset) => {
  if (product.masterRef?.internalModelNo) {
    return product.masterRef.isResolved
      ? `Linked: ${product.masterRef.internalModelNo}`
      : `Pending: ${product.masterRef.internalModelNo}`;
  }
  if (product.supplierModelNo) return `COSUN: ${product.supplierModelNo}`;
  return 'Awaiting link';
};

const formatMappingStatusLabel = (product: ProductLibraryAsset) => {
  const status = String(product.mappingRef?.mappingStatus || '').trim().toLowerCase();
  if (status === 'confirmed') return 'Confirmed';
  if (status === 'suggested') return 'Suggested';
  if (status === 'pending') return 'Pending review';
  if (status === 'rejected') return 'Rejected';
  if (status === 'unmapped') return 'Unmapped';
  return product.supplierModelNo ? 'Linked via COSUN' : 'No mapping';
};

const formatAttachmentSummaryLine = (product: ProductLibraryAsset) => {
  const summary = product.attachmentSummarySnapshot;
  if (!summary) {
    return product.attachmentCount > 0 ? `${product.attachmentCount} file(s)` : 'No files';
  }
  const parts: string[] = [];
  if (summary.hasDrawing) parts.push('Drawing');
  if (summary.hasSpec) parts.push('Spec');
  if (summary.hasBom) parts.push('BOM');
  if (summary.hasPackaging) parts.push('Packaging');
  if (summary.hasTestReport) parts.push('Test report');
  if (summary.hasImage) parts.push('Image');
  return parts.length > 0
    ? `${summary.attachmentCount} file(s): ${parts.join(' · ')}`
    : `${summary.attachmentCount} file(s)`;
};

const formatRevisionStatusLabel = (status?: ProjectRevisionView['revisionStatus'] | null) => {
  if (status === 'final') return 'Final';
  if (status === 'quoted') return 'Quoted';
  if (status === 'superseded') return 'Superseded';
  if (status === 'cancelled') return 'Cancelled';
  return 'Working';
};

const formatRevisionStatusBadgeClass = (status?: string | null) => {
  if (status === 'final') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (status === 'quoted') return 'bg-blue-50 text-blue-700 border-blue-200';
  if (status === 'superseded') return 'bg-slate-100 text-slate-500 border-slate-200';
  if (status === 'cancelled') return 'bg-red-50 text-red-600 border-red-200';
  return 'bg-amber-50 text-amber-700 border-amber-200';
};

const formatStandardPackageLabel = (version: number, index: number) => {
  if (index === 0) return 'Current Package';
  if (index === 1) return 'Previous Snapshot';
  return `Archived Snapshot V${version}`;
};

const formatCurrentPackageLabel = (product: ProductLibraryAsset) => {
  if (product.isProjectBased) return `Rev ${product.currentRevisionCode || '—'}`;
  if (product.packageStatus === 'technical_package_ready') return 'Package Ready';
  if (product.packageStatus === 'basic_package') return 'Basic Package';
  return 'No Package';
};

const formatCurrentPackageHelper = (product: ProductLibraryAsset) => {
  if (product.isProjectBased) {
    return product.finalRevisionCode
      ? `Final revision: ${product.finalRevisionCode}`
      : `Status: ${product.currentRevisionStatus || 'working'}`;
  }
  if (product.attachmentCount > 0) return `${product.attachmentCount} file(s)`;
  if (product.description) return 'Description saved';
  return 'Add package details';
};

const buildPackageVersions = (product: ProductLibraryAsset): ProductPackageVersionView[] => {
  if (Array.isArray(product.manualRecord?.packageVersions) && product.manualRecord.packageVersions.length > 0) {
    return product.manualRecord.packageVersions.map((pkg, index) => ({
      version: pkg.version,
      versionLabel: formatStandardPackageLabel(pkg.version, index),
      statusLabel:
        pkg.status === 'technical_package_ready'
          ? 'Technical package'
          : pkg.status === 'basic_package'
            ? 'Business package'
            : 'Placeholder',
      summary: pkg.summary,
      releaseTrack:
        pkg.status === 'technical_package_ready'
          ? 'Technical package controlled'
          : pkg.status === 'basic_package'
            ? 'Basic package prepared'
            : 'Baseline reference',
      updatedAt: pkg.updatedAt,
      files: normalizeOemData(pkg.oem).files,
      notes: pkg.notes || '',
    }));
  }

  const normalizedOem = normalizeOemData(product.manualRecord?.oem);
  const currentVersion: ProductPackageVersionView = {
    version: product.packageVersion,
    versionLabel: 'Current Package',
    statusLabel:
      product.packageStatus === 'technical_package_ready'
        ? 'Technical package'
        : product.packageStatus === 'basic_package'
          ? 'Business package'
          : 'Placeholder',
    summary:
      product.packageStatus === 'technical_package_ready'
        ? `${product.attachmentCount} technical file(s) ready`
        : product.packageStatus === 'basic_package'
          ? 'Description available'
          : 'No files yet',
    releaseTrack:
      product.packageStatus === 'technical_package_ready'
        ? 'Technical package controlled'
        : product.packageStatus === 'basic_package'
          ? 'Basic package prepared'
          : 'No package baseline',
    updatedAt: product.updatedAt,
    files: normalizedOem.files,
    notes: normalizedOem.overallRequirementNote || product.description || '',
  };

  if (product.packageVersion <= 1) return [currentVersion];

  return [
    currentVersion,
    {
      version: 1,
      versionLabel: 'Previous Snapshot',
      statusLabel: 'Baseline',
      summary: 'Original baseline package',
      releaseTrack: 'Baseline reference',
      updatedAt: product.updatedAt,
      files: [],
      notes: product.description || '',
    },
  ];
};

const buildProjectRevisions = (product: ProductLibraryAsset): ProjectRevisionView[] => {
  if (Array.isArray(product.manualRecord?.projectRevisions) && product.manualRecord.projectRevisions.length > 0) {
    return product.manualRecord.projectRevisions.map((revision) => ({
      revisionId: revision.revisionId,
      revisionCode: revision.revisionCode,
      revisionStatus: revision.revisionStatus,
      summary: revision.summary,
      updatedAt: revision.updatedAt,
      files: normalizeOemData(revision.oem).files,
      notes: revision.revisionNote || '',
    }));
  }

  return [
    {
      revisionId: product.currentRevisionId || 'project-revision-current',
      revisionCode: product.currentRevisionCode || 'A',
      revisionStatus: product.currentRevisionStatus || 'working',
      summary: product.description || 'Current project revision',
      updatedAt: product.updatedAt,
      files: normalizeOemData(product.manualRecord?.oem).files,
      notes: product.description || '',
    },
  ];
};

// ─── Types ────────────────────────────────────────────────────────────────────

type ProductPackageVersionView = {
  version: number;
  versionLabel: string;
  statusLabel: string;
  summary: string;
  releaseTrack: string;
  updatedAt: string | null;
  files: OemUploadedFile[];
  notes: string;
};

type ProjectRevisionView = {
  revisionId: string;
  revisionCode: string;
  revisionStatus: CustomerProductRecord['projectRevisions'] extends Array<infer Revision>
    ? Revision extends { revisionStatus: infer Status }
      ? Status extends string
        ? Status
        : string
      : string
    : string;
  summary: string;
  updatedAt: string | null;
  files: OemUploadedFile[];
  notes: string;
};

type ProjectRevisionQuotationTrace = {
  id: string;
  qtNumber: string;
  quotationRole: string;
  revisionCode: string;
  revisionStatus: string;
  totalPrice: number | null;
  approvalStatus: string;
  customerStatus: string;
  updatedAt: string | null;
};

type ProductDocumentTrace = {
  id: string;
  number: string;
  date: string | null;
  status: string;
  amountLabel: string;
  note: string;
};

type DetailTab = 'overview' | 'package' | 'revisions' | 'files' | 'business' | 'actions';

type InquirySelectionState = {
  packageVersion: string;
  revisionId: string;
  quantity: string;
  notes: string;
};

const NEW_INQUIRY_DRAFT_PRODUCTS_KEY = 'new_inquiry_draft_products_v1';
const MY_PRODUCTS_AUTO_OPEN_INQUIRY_KEY = 'my_products_open_new_inquiry';

// ─── Business Status helpers ──────────────────────────────────────────────────

const CUSTOMER_FILE_TYPE_OPTIONS = [
  { value: 'drawing', label: 'Drawing' },
  { value: 'spec', label: 'Specification' },
  { value: 'image', label: 'Image' },
  { value: 'bom', label: 'BOM' },
  { value: 'packaging', label: 'Packaging' },
  { value: 'test-report', label: 'Test Report' },
  { value: 'other', label: 'Other' },
] as const;

const getBusinessStatusItems = (product: ProductLibraryAsset) => [
  {
    key: 'quotation',
    label: 'Quotation',
    value:
      product.quoteStats.count > 0
        ? `${product.quoteStats.count} quote(s) · Last: ${formatPrice(product.quoteStats.lastPrice)}`
        : 'No quotations yet',
    active: product.quoteStats.count > 0,
    icon: Tag,
  },
  {
    key: 'order',
    label: 'Orders',
    value:
      product.orderStats.count > 0
        ? `${product.orderStats.count} order(s) · Qty: ${product.orderStats.totalOrderedQty}`
        : 'No orders yet',
    active: product.orderStats.count > 0,
    icon: ShoppingCart,
  },
  {
    key: 'files',
    label: 'Technical Files',
    value: product.attachmentCount > 0 ? formatAttachmentSummaryLine(product) : 'No files uploaded',
    active: product.attachmentCount > 0,
    icon: Paperclip,
  },
  {
    key: 'version',
    label: product.isProjectBased ? 'Revision' : 'Package Version',
    value: product.isProjectBased
      ? product.finalRevisionCode
        ? `Final Rev ${product.finalRevisionCode} locked`
        : `Rev ${product.currentRevisionCode || '—'} · ${product.currentRevisionStatus || 'working'}`
      : `${formatPackageStatus(product.packageStatus)}`,
    active: product.packageStatus !== 'no_package' || !!product.currentRevisionCode,
    icon: product.isProjectBased ? GitBranchPlus : FileStack,
  },
];

const productMatchesQuotation = (product: ProductLibraryAsset, quotation: SalesQuotation) => {
  const directCustomerProductMatch =
    product.manualRecord?.id &&
    Array.isArray((quotation as any).items) &&
    (quotation as any).items.some(
      (item: any) => String(item?.customerProductId || '').trim() === product.manualRecord?.id,
    );
  if (directCustomerProductMatch) return true;

  const directProjectRevisionMatch =
    product.isProjectBased &&
    product.currentRevisionId &&
    String((quotation as any).projectRevisionId || '').trim() === String(product.currentRevisionId);
  if (directProjectRevisionMatch) return true;

  const lastInquiryMatch =
    product.lastInquiryNumber &&
    String((quotation as any).inqNumber || '').trim() === String(product.lastInquiryNumber);
  if (lastInquiryMatch) return true;

  if (!Array.isArray((quotation as any).items)) return false;
  return (quotation as any).items.some((item: any) => {
    const itemModel = normalizeLower(item?.modelNo);
    const itemName = normalizeLower(item?.productName);
    return (
      (product.supplierModelNo && itemModel === normalizeLower(product.supplierModelNo)) ||
      (product.customerModelNo && itemModel === normalizeLower(product.customerModelNo)) ||
      (product.productName && itemName === normalizeLower(product.productName))
    );
  });
};

const productMatchesOrder = (product: ProductLibraryAsset, order: Order) => {
  const directCustomerProductMatch =
    product.manualRecord?.id &&
    Array.isArray(order.products) &&
    order.products.some((item) => String(item?.customerProductId || '').trim() === product.manualRecord?.id);
  if (directCustomerProductMatch) return true;

  const directProjectRevisionMatch =
    product.isProjectBased &&
    product.currentRevisionId &&
    Array.isArray(order.products) &&
    order.products.some(
      (item) => String(item?.projectRevisionId || '').trim() === String(product.currentRevisionId),
    );
  if (directProjectRevisionMatch) return true;

  return (
    Array.isArray(order.products) &&
    order.products.some((item) => {
      const itemName = normalizeLower(item?.name);
      return product.productName && itemName === normalizeLower(product.productName);
    })
  );
};

const buildProjectRevisionQuotationTrace = (
  product: ProductLibraryAsset,
  quotations: SalesQuotation[],
): ProjectRevisionQuotationTrace[] => {
  if (!product.isProjectBased) return [];

  const currentRevisionId = String(product.currentRevisionId || '').trim();
  const currentRevisionCode = String(product.currentRevisionCode || '').trim();
  const customerModelNo = normalizeLower(product.customerModelNo);
  const supplierModelNo = normalizeLower(product.supplierModelNo);
  const productName = normalizeLower(product.productName);
  const lastInquiryNumber = String(product.lastInquiryNumber || '').trim();

  return quotations
    .filter((quotation) => {
      const byProjectRevision =
        currentRevisionId &&
        String((quotation as any).projectRevisionId || '').trim() === currentRevisionId;
      const byInquiryNumber =
        lastInquiryNumber &&
        String((quotation as any).inqNumber || '').trim() === lastInquiryNumber;
      const byItemModel =
        Array.isArray((quotation as any).items) &&
        (quotation as any).items.some((item: any) => {
          const itemModel = normalizeLower(item?.modelNo);
          const itemName = normalizeLower(item?.productName);
          return (
            (supplierModelNo && itemModel === supplierModelNo) ||
            (customerModelNo && itemModel === customerModelNo) ||
            (productName && itemName === productName)
          );
        });
      return byProjectRevision || (byInquiryNumber && byItemModel);
    })
    .map((quotation) => ({
      id: quotation.id,
      qtNumber: quotation.qtNumber,
      quotationRole: String((quotation as any).quotationRole || 'commercial_offer'),
      revisionCode: String((quotation as any).projectRevisionCode || currentRevisionCode || '—'),
      revisionStatus: String((quotation as any).projectRevisionStatus || product.currentRevisionStatus || 'quoted'),
      totalPrice: Number.isFinite(quotation.totalPrice) ? quotation.totalPrice : null,
      approvalStatus: quotation.approvalStatus,
      customerStatus: quotation.customerStatus,
      updatedAt: quotation.updatedAt || quotation.createdAt || null,
    }))
    .sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')));
};

const buildInquiryProductFromLibrarySelection = ({
  asset,
  selectedPackageVersion,
  selectedProjectRevision,
  quantity,
  notes,
}: {
  asset: ProductLibraryAsset;
  selectedPackageVersion?: ProductPackageVersionView | null;
  selectedProjectRevision?: ProjectRevisionView | null;
  quantity: number;
  notes: string;
}) => {
  const record = asset.manualRecord;
  const resolvedOem = asset.isProjectBased
    ? selectedProjectRevision?.files
      ? { ...normalizeOemData(record?.oem), files: selectedProjectRevision.files, overallRequirementNote: selectedProjectRevision.notes }
      : record?.oem
    : selectedPackageVersion?.files
      ? { ...normalizeOemData(record?.oem), files: selectedPackageVersion.files, overallRequirementNote: selectedPackageVersion.notes }
      : record?.oem;
  const normalizedOem = normalizeOemData(resolvedOem);
  const sourceProductId = record?.sourceProductId || asset.supplierProductId || asset.matchKey;
  const customerProductId = record?.id || null;
  const selectedSummary = asset.isProjectBased
    ? selectedProjectRevision?.summary || asset.description || ''
    : selectedPackageVersion?.summary || asset.description || '';
  const inquiryRequirementSummary = [selectedSummary, String(notes || '').trim()].filter(Boolean).join('\n\n');
  const inquirySnapshotDraft = {
    ...customerAssetAdapter.toInquirySnapshotDraft(asset, {
      selectedPackageVersion: selectedPackageVersion
        ? { version: selectedPackageVersion.version, oem: resolvedOem }
        : null,
      selectedProjectRevision: selectedProjectRevision
        ? {
            revisionId: selectedProjectRevision.revisionId,
            revisionCode: selectedProjectRevision.revisionCode,
            revisionStatus: selectedProjectRevision.revisionStatus,
            oem: resolvedOem,
          }
        : null,
      quantity,
      currency: 'USD',
    }),
    description: selectedSummary || asset.description || '',
    specSummary: selectedSummary || asset.description || '',
    inquiryRequirementSummary:
      inquiryRequirementSummary ||
      customerAssetAdapter.toInquirySnapshotDraft(asset, { quantity, currency: 'USD' }).inquiryRequirementSummary,
  };
  const inquirySnapshot = tradeProductSnapshotService.createInquirySnapshot(inquirySnapshotDraft);

  return {
    id: `my-product-${asset.id}-${
      asset.isProjectBased
        ? selectedProjectRevision?.revisionId || asset.currentRevisionId || 'current'
        : selectedPackageVersion?.version || asset.packageVersion
    }`,
    customerProductId,
    sourceProductId,
    supplierProductId: record?.supplierProductId || asset.supplierProductId || null,
    productName: asset.productName,
    customerModelNo: asset.customerModelNo || '',
    supplierModelNo: asset.supplierModelNo || '',
    modelNo: asset.supplierModelNo || asset.customerModelNo || '',
    internalModelNo: asset.supplierModelNo || '',
    quantity,
    unit: asset.unit || 'pcs',
    targetPrice: record?.targetPrice || asset.quoteStats.lastPrice || asset.orderStats.lastPrice || 0,
    specification: selectedSummary || asset.description || '',
    specifications: selectedSummary || asset.description || '',
    image: asset.imageUrl || '',
    imageUrl: asset.imageUrl || '',
    source: 'my_products' as const,
    addedFrom: 'My Products' as const,
    sourceType: asset.assetSourceType,
    itemType: asset.itemType,
    oem: normalizedOem.enabled ? resolvedOem : undefined,
    syncStatus: asset.syncStatus === 'pending' ? 'pending' : 'synced',
    syncMessage: asset.syncMessage || '',
    attachmentCount: inquirySnapshotDraft.attachmentSummarySnapshot.attachmentCount || asset.attachmentCount || 0,
    attachmentSummarySnapshot: inquirySnapshotDraft.attachmentSummarySnapshot,
    fileManifestSnapshot: inquirySnapshotDraft.fileManifestSnapshot,
    lastInquiryNumber: asset.lastInquiryNumber || null,
    recordType: asset.recordType,
    isProjectBased: asset.isProjectBased,
    serviceType: asset.manualRecord?.serviceType || null,
    serviceCategory: asset.manualRecord?.serviceCategory || '',
    serviceScopeSummary: asset.manualRecord?.serviceScopeSummary || '',
    serviceDeliverables: asset.manualRecord?.serviceDeliverables || '',
    inspectionType: asset.manualRecord?.inspectionType || '',
    inspectionStandard: asset.manualRecord?.inspectionStandard || '',
    deliveryMethod: asset.manualRecord?.deliveryMethod || '',
    masterRef: inquirySnapshotDraft.masterRef,
    mappingRef: inquirySnapshotDraft.mappingRef,
    sourceRef: inquirySnapshotDraft.sourceRef,
    inquirySnapshotDraft,
    inquirySnapshot,
    selectorNotes: String(notes || '').trim(),
    projectId: asset.isProjectBased ? customerProductId || asset.id : null,
    projectCode: asset.projectCode || '',
    projectName: asset.projectName || asset.productName,
    projectRevisionId: selectedProjectRevision?.revisionId || asset.currentRevisionId || null,
    projectRevisionCode: selectedProjectRevision?.revisionCode || asset.currentRevisionCode || '',
    productPackageSnapshot: {
      id: customerProductId || asset.id,
      sourceProductId,
      productName: asset.productName,
      description: selectedSummary || asset.description,
      itemType: asset.itemType,
      customerModelNo: asset.customerModelNo,
      supplierModelNo: asset.supplierModelNo,
      supplierProductId: asset.supplierProductId || null,
      imageUrl: asset.imageUrl,
      unit: asset.unit,
      targetPrice: record?.targetPrice || asset.quoteStats.lastPrice || asset.orderStats.lastPrice || 0,
      attachmentCount: inquirySnapshotDraft.attachmentSummarySnapshot.attachmentCount,
      oem: resolvedOem || null,
      sourceType: asset.assetSourceType,
      productStatus: asset.productStatus,
      packageVersion: selectedPackageVersion?.version || asset.packageVersion,
      packageStatus: asset.packageStatus,
      sourceTags: asset.sourceTags,
      quoteStats: asset.quoteStats,
      orderStats: asset.orderStats,
      updatedAt: asset.updatedAt,
      attachmentSummarySnapshot: inquirySnapshotDraft.attachmentSummarySnapshot,
      fileManifestSnapshot: inquirySnapshotDraft.fileManifestSnapshot,
      serviceType: asset.manualRecord?.serviceType || null,
      serviceCategory: asset.manualRecord?.serviceCategory || '',
      serviceScopeSummary: asset.manualRecord?.serviceScopeSummary || '',
      serviceDeliverables: asset.manualRecord?.serviceDeliverables || '',
    },
    projectRevisionSnapshot: asset.isProjectBased
      ? {
          projectId: customerProductId || asset.id,
          projectCode: asset.projectCode || '',
          projectName: asset.projectName || asset.productName,
          revisionId: selectedProjectRevision?.revisionId || asset.currentRevisionId || null,
          revisionCode: selectedProjectRevision?.revisionCode || asset.currentRevisionCode || '',
          revisionStatus: selectedProjectRevision?.revisionStatus || asset.currentRevisionStatus || 'working',
          finalRevisionId: asset.finalRevisionId || null,
          finalRevisionCode: asset.finalRevisionCode || '',
          snapshotAt: asset.updatedAt,
          attachmentCount: inquirySnapshotDraft.attachmentSummarySnapshot.attachmentCount,
          description: selectedSummary || asset.description,
        }
      : null,
  };
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function ProductTypeIcon({ product }: { product: ProductLibraryAsset }) {
  if (product.manualRecord?.serviceType) return <ClipboardList className="h-4 w-4" />;
  if (product.isProjectBased) return <GitBranchPlus className="h-4 w-4" />;
  if (product.itemType === 'oem_custom') return <Wrench className="h-4 w-4" />;
  return <Package className="h-4 w-4" />;
}

function BusinessStatusBadge({ product }: { product: ProductLibraryAsset }) {
  if (product.orderStats.count > 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
        <ShoppingCart className="h-3 w-3" />
        Ordered
      </span>
    );
  }
  if (product.quoteStats.count > 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">
        <Tag className="h-3 w-3" />
        Quoted
      </span>
    );
  }
  if (product.isProjectBased && product.currentRevisionStatus === 'working') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
        <Clock className="h-3 w-3" />
        In Development
      </span>
    );
  }
  if (product.lastInquiryNumber) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2 py-0.5 text-[11px] font-medium text-violet-700">
        <FileText className="h-3 w-3" />
        Inquired
      </span>
    );
  }
  return null;
}

function PackageReadinessDot({ product }: { product: ProductLibraryAsset }) {
  if (product.packageStatus === 'technical_package_ready' || (product.isProjectBased && product.finalRevisionCode)) {
    return <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" title="Files ready" />;
  }
  if (product.packageStatus === 'basic_package' || product.currentRevisionCode) {
    return <span className="inline-block h-2 w-2 rounded-full bg-blue-400" title="Package set up" />;
  }
  return <span className="inline-block h-2 w-2 rounded-full bg-slate-300" title="No package" />;
}

// ─── Product Card (Grid view) ────────────────────────────────────────────────

function ProductCard({
  product,
  onView,
  onUseInInquiry,
  onDelete,
}: {
  product: ProductLibraryAsset;
  onView: () => void;
  onUseInInquiry: () => void;
  onDelete?: () => void;
}) {
  const lastActivity = product.lastOrderNumber || product.lastQuotationNumber || product.lastInquiryNumber;
  const refPrice = product.orderStats.lastPrice || product.quoteStats.lastPrice;

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:border-slate-300 hover:shadow-md">
      {/* Header strip */}
      <div className="flex items-start justify-between gap-3 px-4 pt-4">
        <div className="flex items-center gap-2.5">
          <div
            className={`inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl border ${formatProductTypeBadgeClass(product)}`}
          >
            <ProductTypeIcon product={product} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <PackageReadinessDot product={product} />
              <span className={`text-[11px] font-semibold uppercase tracking-wide ${
                product.productStatus === 'active' ? 'text-emerald-600' :
                product.productStatus === 'draft' ? 'text-amber-600' : 'text-slate-400'
              }`}>
                {formatProductStatusLabel(product.productStatus)}
              </span>
            </div>
            <div className="text-[11px] text-slate-400">{formatProductTypeLabel(product)}</div>
          </div>
        </div>
        <BusinessStatusBadge product={product} />
      </div>

      {/* Product name */}
      <div className="px-4 pt-3">
        <div className="line-clamp-2 text-sm font-semibold leading-snug text-slate-900">
          {product.productName}
        </div>
        {product.description ? (
          <div className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500">{product.description}</div>
        ) : (
          <div className="mt-1 text-xs italic text-slate-400">No description</div>
        )}
      </div>

      {/* Model numbers */}
      <div className="mt-3 grid grid-cols-2 gap-2 px-4">
        <div>
          <div className="text-[10px] uppercase tracking-wide text-slate-400">Your Model#</div>
          <div className="mt-0.5 truncate text-xs font-medium text-slate-700">
            {product.customerModelNo || <span className="text-slate-400">—</span>}
          </div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wide text-slate-400">COSUN Model#</div>
          <div className="mt-0.5 truncate text-xs font-medium text-slate-700">
            {product.supplierModelNo || <span className="italic text-slate-400">Pending</span>}
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="mt-3 border-t border-slate-100 px-4 py-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <Paperclip className="h-3 w-3" />
              {product.attachmentCount || 0}
            </span>
            {refPrice ? (
              <span className="flex items-center gap-1">
                <Tag className="h-3 w-3" />
                {formatPrice(refPrice)}
              </span>
            ) : null}
            {lastActivity ? (
              <span className="truncate" title={lastActivity}>
                {lastActivity}
              </span>
            ) : null}
          </div>
          {product.isProjectBased ? (
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${formatRevisionStatusBadgeClass(product.currentRevisionStatus)}`}>
              Rev {product.currentRevisionCode || '—'}
            </span>
          ) : (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
              {formatCurrentPackageLabel(product)}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 border-t border-slate-100 px-4 py-3">
        <Button
          size="sm"
          className="h-8 flex-1 gap-1.5 text-xs"
          onClick={onUseInInquiry}
        >
          <FileText className="h-3.5 w-3.5" />
          Re-Inquire
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-8 gap-1.5 text-xs"
          onClick={onView}
        >
          <Eye className="h-3.5 w-3.5" />
          View
        </Button>
        {onDelete ? (
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 text-slate-400 hover:text-red-500"
            onClick={onDelete}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        ) : null}
      </div>
    </div>
  );
}

// ─── Product Row (List view) ─────────────────────────────────────────────────

function ProductRow({
  product,
  onView,
  onUseInInquiry,
  onDelete,
}: {
  product: ProductLibraryAsset;
  onView: () => void;
  onUseInInquiry: () => void;
  onDelete?: () => void;
}) {
  const refPrice = product.orderStats.lastPrice || product.quoteStats.lastPrice;

  return (
    <TableRow className="group">
      <TableCell>
        <div className="flex items-center gap-3">
          <div
            className={`inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl border ${formatProductTypeBadgeClass(product)}`}
          >
            <ProductTypeIcon product={product} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-slate-900">{product.productName}</span>
              <BusinessStatusBadge product={product} />
            </div>
            <div className="mt-0.5 line-clamp-1 text-xs text-slate-500">{product.description || '—'}</div>
          </div>
        </div>
      </TableCell>
      <TableCell className="text-sm">
        <div className="flex items-center gap-1.5">
          <span className={`inline-block h-1.5 w-1.5 rounded-full ${
            product.productStatus === 'active' ? 'bg-emerald-500' :
            product.productStatus === 'draft' ? 'bg-amber-400' : 'bg-slate-300'
          }`} />
          <span className="text-slate-600">{formatProductTypeLabel(product)}</span>
        </div>
      </TableCell>
      <TableCell className="text-sm text-slate-600">
        {product.customerModelNo || <span className="text-slate-400">—</span>}
      </TableCell>
      <TableCell className="text-sm">
        {product.supplierModelNo ? (
          <span className="font-medium text-slate-900">{product.supplierModelNo}</span>
        ) : (
          <span className="italic text-slate-400">Pending</span>
        )}
      </TableCell>
      <TableCell className="text-sm">
        <div className="flex items-center gap-1.5">
          <PackageReadinessDot product={product} />
          <span className="text-slate-700">
            {product.isProjectBased
              ? `Rev ${product.currentRevisionCode || '—'}`
              : formatPackageStatus(product.packageStatus)}
          </span>
        </div>
      </TableCell>
      <TableCell className="text-sm text-slate-600">
        <div className="flex items-center gap-1">
          <Paperclip className="h-3.5 w-3.5 text-slate-400" />
          {product.attachmentCount || 0}
        </div>
      </TableCell>
      <TableCell className="text-sm text-slate-600">
        {refPrice ? formatPrice(refPrice) : <span className="text-slate-400">—</span>}
      </TableCell>
      <TableCell className="text-sm text-slate-500">
        {product.lastOrderNumber || product.lastQuotationNumber || product.lastInquiryNumber || <span className="text-slate-400">—</span>}
      </TableCell>
      <TableCell>
        <div className="flex items-center justify-end gap-1.5">
          <Button size="sm" className="h-7 gap-1 text-xs" onClick={onUseInInquiry}>
            Re-Inquire
          </Button>
          <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={onView}>
            <Eye className="h-3.5 w-3.5" />
          </Button>
          {onDelete ? (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 text-slate-400 hover:text-red-500"
              onClick={onDelete}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          ) : null}
        </div>
      </TableCell>
    </TableRow>
  );
}

// ─── Detail Panel Sidebar Nav ─────────────────────────────────────────────────

const DETAIL_TABS: { id: DetailTab; label: string; icon: LucideIcon; planned?: boolean }[] = [
  { id: 'overview', label: 'Overview', icon: Package },
  { id: 'package', label: 'Package / Revisions', icon: FileStack },
  { id: 'files', label: 'Files', icon: Paperclip },
  { id: 'business', label: 'Business Records', icon: ShoppingCart },
  { id: 'actions', label: 'Actions', icon: GitBranchPlus },
];

function DetailSideNav({
  activeTab,
  onTabChange,
  product,
}: {
  activeTab: DetailTab;
  onTabChange: (tab: DetailTab) => void;
  product: ProductLibraryAsset;
}) {
  return (
    <nav className="flex flex-col gap-0.5">
      {DETAIL_TABS.filter((t) => t.id !== 'package' || !product.isProjectBased || true).map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
              isActive
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Icon className={`h-4 w-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
            <span className="flex-1">{tab.label}</span>
            {isActive && <ChevronRight className="h-3.5 w-3.5 opacity-50" />}
          </button>
        );
      })}
    </nav>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ onCreateProduct }: { onCreateProduct: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 px-6 py-20 text-center">
      <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
        <Package className="h-8 w-8 text-slate-400" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-slate-900">Your product library is empty</h3>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-500">
        Add products you frequently order — attach specs, drawings, and OEM files so you can reuse them in future
        inquiries without re-entering everything from scratch.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Button onClick={onCreateProduct} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Standard Product
        </Button>
        <Button variant="outline" onClick={onCreateProduct} className="gap-2">
          <Wrench className="h-4 w-4" />
          Add OEM / Custom
        </Button>
      </div>
      <p className="mt-4 text-xs text-slate-400">
        Products from past inquiries, quotations and orders will also appear here automatically.
      </p>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

type Order = ReturnType<typeof useOrders>['orders'][number];

export function MyProducts() {
  const { orders } = useOrders();
  const { quotations } = useSalesQuotations();

  // ── Data state ──
  const [libraryRecords, setLibraryRecords] = useState<CustomerProductRecord[]>([]);
  const [isLibraryHydrated, setIsLibraryHydrated] = useState(false);
  const [isBridgeReady, setIsBridgeReady] = useState(() => isSupabaseStorageBridgeReady());
  const [isPortfolioSettled, setIsPortfolioSettled] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState(() => resolveProductLibraryCustomerEmail());
  const [businessMode, setBusinessMode] = useState(() => resolveCustomerBusinessMode());

  // ── UI state ──
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'standard' | 'oem' | 'project' | 'service'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | ProductLibraryAsset['productStatus']>('all');
  const [hasFilesFilter, setHasFilesFilter] = useState<'all' | 'with-files' | 'without-files'>('all');

  // ── Detail panel state ──
  const [selectedProduct, setSelectedProduct] = useState<ProductLibraryAsset | null>(null);
  const [detailTab, setDetailTab] = useState<DetailTab>('overview');

  // ── Editors ──
  const [productMasterEditor, setProductMasterEditor] = useState({
    productName: '',
    customerModelNo: '',
    supplierModelNo: '',
    unit: 'pcs',
    description: '',
  });
  const [packageEditor, setPackageEditor] = useState({
    description: '',
    packageNote: '',
    files: [] as OemUploadedFile[],
  });
  const packageFileInputRef = useRef<HTMLInputElement | null>(null);

  // ── Package/Revision preview state ──
  const [selectedPackagePreviewVersion, setSelectedPackagePreviewVersion] = useState<number | null>(null);
  const [selectedRevisionPreviewId, setSelectedRevisionPreviewId] = useState<string | null>(null);
  const [selectedRevisionStatus, setSelectedRevisionStatus] = useState<ProjectRevisionView['revisionStatus']>('working');

  // ── Inquiry selector state ──
  const [inquirySelectionProduct, setInquirySelectionProduct] = useState<ProductLibraryAsset | null>(null);
  const [isInquirySelectorOpen, setIsInquirySelectorOpen] = useState(false);
  const [inquirySelection, setInquirySelection] = useState<InquirySelectionState>({
    packageVersion: '',
    revisionId: '',
    quantity: '1',
    notes: '',
  });

  // ── Create flow ──
  const [isCreateFlowOpen, setIsCreateFlowOpen] = useState(false);

  // ── Effects: data loading ──
  useEffect(() => {
    const load = () => {
      setLibraryRecords(customerProductLibraryService.getAll());
      setIsLibraryHydrated(true);
    };
    const handleBridgeSync = () => {
      setIsBridgeReady(true);
      load();
    };
    load();
    window.addEventListener(customerProductLibraryService.changeEvent, load as EventListener);
    window.addEventListener('supabase-storage-bridge-synced', handleBridgeSync as EventListener);
    return () => {
      window.removeEventListener(customerProductLibraryService.changeEvent, load as EventListener);
      window.removeEventListener('supabase-storage-bridge-synced', handleBridgeSync as EventListener);
    };
  }, []);

  useEffect(() => {
    const syncIdentity = () => {
      setCurrentUserEmail(resolveProductLibraryCustomerEmail());
      setBusinessMode(resolveCustomerBusinessMode());
    };
    syncIdentity();
    window.addEventListener('userChanged', syncIdentity);
    window.addEventListener('supabaseAuthChanged', syncIdentity as EventListener);
    window.addEventListener('storage', syncIdentity);
    return () => {
      window.removeEventListener('userChanged', syncIdentity);
      window.removeEventListener('supabaseAuthChanged', syncIdentity as EventListener);
      window.removeEventListener('storage', syncIdentity);
    };
  }, []);

  useEffect(() => {
    setIsPortfolioSettled(false);
    const timer = window.setTimeout(() => setIsPortfolioSettled(true), 900);
    return () => window.clearTimeout(timer);
  }, [currentUserEmail]);

  // ── Products computation ──
  const products = useMemo(
    () => buildProductLibraryAssets({ libraryRecords, quotations, orders, customerEmail: currentUserEmail }),
    [currentUserEmail, libraryRecords, orders, quotations],
  );

  useEffect(() => {
    if (products.length > 0) setIsPortfolioSettled(true);
  }, [products.length]);

  const isHydrating =
    !isBridgeReady || !isLibraryHydrated || !currentUserEmail || (!isPortfolioSettled && products.length === 0);

  const filteredProducts = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    return products.filter((product) => {
      if (!businessMode.projectRevisionEnabled && product.isProjectBased) return false;
      const matchesKeyword =
        !keyword ||
        [product.productName, product.customerModelNo, product.supplierModelNo, product.description, ...product.sourceTags]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(keyword));
      const matchesType =
        typeFilter === 'all' ||
        (typeFilter === 'project' && businessMode.projectRevisionEnabled && product.isProjectBased) ||
        (typeFilter === 'oem' && product.itemType === 'oem_custom') ||
        (typeFilter === 'service' && !!product.manualRecord?.serviceType) ||
        (typeFilter === 'standard' && !product.isProjectBased && product.itemType !== 'oem_custom' && !product.manualRecord?.serviceType);
      const matchesStatus = statusFilter === 'all' || product.productStatus === statusFilter;
      const matchesHasFiles =
        hasFilesFilter === 'all' ||
        (hasFilesFilter === 'with-files' && product.attachmentCount > 0) ||
        (hasFilesFilter === 'without-files' && product.attachmentCount === 0);
      return matchesKeyword && matchesType && matchesStatus && matchesHasFiles;
    });
  }, [businessMode.projectRevisionEnabled, hasFilesFilter, products, searchTerm, statusFilter, typeFilter]);

  const summary = useMemo(() => ({
    total: products.length,
    inquiryReady: products.filter((p) => p.attachmentCount > 0 || (p.isProjectBased && !!p.currentRevisionCode) || p.description).length,
    ordered: products.filter((p) => p.orderStats.count > 0).length,
  }), [products]);

  // ── Derived from selectedProduct ──
  const selectedProductVersions = useMemo(
    () => (selectedProduct ? buildPackageVersions(selectedProduct) : []),
    [selectedProduct],
  );
  const selectedProjectRevisions = useMemo(
    () => (selectedProduct ? buildProjectRevisions(selectedProduct) : []),
    [selectedProduct],
  );
  const selectedProjectRevisionTrace = useMemo(
    () => (selectedProduct ? buildProjectRevisionQuotationTrace(selectedProduct, quotations) : []),
    [selectedProduct, quotations],
  );
  const selectedPackagePreview = useMemo(
    () => selectedProductVersions.find((pkg) => pkg.version === selectedPackagePreviewVersion) || selectedProductVersions[0] || null,
    [selectedPackagePreviewVersion, selectedProductVersions],
  );
  const selectedRevisionPreview = useMemo(
    () =>
      selectedProjectRevisions.find((revision) => revision.revisionId === selectedRevisionPreviewId) ||
      selectedProjectRevisions[0] ||
      null,
    [selectedProjectRevisions, selectedRevisionPreviewId],
  );
  const selectedCurrentVersionFiles = useMemo(() => {
    if (!selectedProduct) return [];
    return selectedProduct.isProjectBased
      ? selectedProjectRevisions[0]?.files || normalizeOemData(selectedProduct.manualRecord?.oem).files
      : selectedProductVersions.length > 0
        ? selectedProductVersions[0].files
        : normalizeOemData(selectedProduct.manualRecord?.oem).files;
  }, [selectedProduct, selectedProjectRevisions, selectedProductVersions]);

  const selectedCurrentVersionFilesKey = useMemo(
    () => filesSignature(selectedCurrentVersionFiles),
    [selectedCurrentVersionFiles],
  );

  const selectedAttachmentSummary = useMemo(
    () => selectedProduct?.attachmentSummarySnapshot || null,
    [selectedProduct],
  );
  const selectedFileManifest = useMemo(() => selectedProduct?.fileManifestSnapshot || [], [selectedProduct]);

  const relatedQuotationRows = useMemo<ProductDocumentTrace[]>(
    () =>
      selectedProduct
        ? quotations
            .filter((q) => productMatchesQuotation(selectedProduct, q))
            .map((q) => ({
              id: q.id,
              number: q.qtNumber,
              date: q.updatedAt || q.createdAt || null,
              status: q.customerStatus,
              amountLabel: formatPrice(Number.isFinite(q.totalPrice) ? q.totalPrice : null),
              note: `${q.approvalStatus} · ${(q as any).quotationRole || 'commercial_offer'}`,
            }))
            .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')))
        : [],
    [quotations, selectedProduct],
  );

  const relatedOrderRows = useMemo<ProductDocumentTrace[]>(
    () =>
      selectedProduct
        ? orders
            .filter((o) => productMatchesOrder(selectedProduct, o))
            .map((o) => ({
              id: o.id,
              number: o.orderNumber,
              date: o.updatedAt || o.createdAt || (o as any).date || null,
              status: o.status,
              amountLabel: formatPrice(Number.isFinite(o.totalAmount) ? o.totalAmount : null),
              note: `${o.products.length} line(s) · ${o.paymentStatus || 'Payment pending'}`,
            }))
            .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')))
        : [],
    [orders, selectedProduct],
  );

  const inquirySelectionVersions = useMemo(
    () => (inquirySelectionProduct ? buildPackageVersions(inquirySelectionProduct) : []),
    [inquirySelectionProduct],
  );
  const inquirySelectionRevisions = useMemo(
    () => (inquirySelectionProduct ? buildProjectRevisions(inquirySelectionProduct) : []),
    [inquirySelectionProduct],
  );
  const inquirySelectionPreviewFiles = useMemo(() => {
    if (!inquirySelectionProduct) return [];
    if (inquirySelectionProduct.isProjectBased) {
      return (
        inquirySelectionRevisions.find((r) => r.revisionId === inquirySelection.revisionId)?.files ||
        inquirySelectionRevisions[0]?.files ||
        []
      );
    }
    return (
      inquirySelectionVersions.find((pkg) => String(pkg.version) === String(inquirySelection.packageVersion))?.files ||
      inquirySelectionVersions[0]?.files ||
      []
    );
  }, [inquirySelection.packageVersion, inquirySelection.revisionId, inquirySelectionProduct, inquirySelectionRevisions, inquirySelectionVersions]);

  // ── Effects: sync editors when selectedProduct changes ──
  useEffect(() => {
    if (selectedProduct) setDetailTab('overview');
  }, [selectedProduct?.id]);

  useEffect(() => {
    if (!selectedProduct) {
      setSelectedPackagePreviewVersion(null);
      setSelectedRevisionPreviewId(null);
      setSelectedRevisionStatus('working');
      return;
    }
    const defaultPackageVersion = selectedProductVersions[0]?.version || selectedProduct.packageVersion || 1;
    const defaultRevisionId =
      selectedProduct.finalRevisionId ||
      selectedProduct.currentRevisionId ||
      selectedProjectRevisions[0]?.revisionId ||
      null;
    const defaultRevision =
      selectedProjectRevisions.find((r) => r.revisionId === defaultRevisionId) || selectedProjectRevisions[0] || null;
    setSelectedPackagePreviewVersion(defaultPackageVersion);
    setSelectedRevisionPreviewId(defaultRevisionId);
    setSelectedRevisionStatus((defaultRevision?.revisionStatus || 'working') as ProjectRevisionView['revisionStatus']);
  }, [selectedProduct, selectedProduct?.id, selectedProduct?.packageVersion, selectedProduct?.currentRevisionId, selectedProduct?.finalRevisionId, selectedProductVersions, selectedProjectRevisions]);

  useEffect(() => {
    if (!selectedRevisionPreview) return;
    setSelectedRevisionStatus(selectedRevisionPreview.revisionStatus);
  }, [selectedRevisionPreview]);

  useEffect(() => {
    if (!selectedProduct) {
      setProductMasterEditor({ productName: '', customerModelNo: '', supplierModelNo: '', unit: 'pcs', description: '' });
      setPackageEditor({ description: '', packageNote: '', files: [] });
      return;
    }
    setProductMasterEditor({
      productName: selectedProduct.productName || '',
      customerModelNo: selectedProduct.customerModelNo || '',
      supplierModelNo: selectedProduct.supplierModelNo || '',
      unit: selectedProduct.unit || 'pcs',
      description: selectedProduct.description || '',
    });
    const currentFiles = selectedProduct.isProjectBased
      ? normalizeOemData(selectedProduct.manualRecord?.projectRevisions?.[0]?.oem || selectedProduct.manualRecord?.oem).files
      : normalizeOemData(selectedProduct.manualRecord?.oem).files;
    const currentNotes = selectedProduct.isProjectBased
      ? selectedProduct.manualRecord?.projectRevisions?.[0]?.revisionNote || ''
      : normalizeOemData(selectedProduct.manualRecord?.oem).overallRequirementNote || '';
    setPackageEditor({
      description: selectedProduct.description || '',
      packageNote: currentNotes,
      files: currentFiles,
    });
  }, [selectedProduct?.id, selectedCurrentVersionFilesKey]);

  useEffect(() => {
    if (!inquirySelectionProduct) {
      setInquirySelection({ packageVersion: '', revisionId: '', quantity: '1', notes: '' });
      return;
    }
    const pVersions = buildPackageVersions(inquirySelectionProduct);
    const pRevisions = buildProjectRevisions(inquirySelectionProduct);
    const defaultPackageVersion = String(pVersions[0]?.version || inquirySelectionProduct.packageVersion || 1);
    const defaultRevisionId =
      inquirySelectionProduct.finalRevisionId ||
      inquirySelectionProduct.currentRevisionId ||
      pRevisions[0]?.revisionId ||
      '';
    setInquirySelection({
      packageVersion: defaultPackageVersion,
      revisionId: defaultRevisionId,
      quantity: String(inquirySelectionProduct.manualRecord?.lastQuantity || 1),
      notes: '',
    });
  }, [inquirySelectionProduct]);

  // ── Helpers ──
  const syncSelectedProductFromRecord = (record: CustomerProductRecord) => {
    const nextRecords = customerProductLibraryService.getAll();
    setLibraryRecords(nextRecords);
    const nextAssets = buildProductLibraryAssets({ libraryRecords: nextRecords, quotations, orders, customerEmail: currentUserEmail });
    const updatedAsset = nextAssets.find((a) => a.manualRecord?.id === record.id);
    if (updatedAsset) setSelectedProduct(updatedAsset);
  };

  const findAssetByRecordId = (recordId: string) => {
    const nextRecords = customerProductLibraryService.getAll();
    const nextAssets = buildProductLibraryAssets({ libraryRecords: nextRecords, quotations, orders, customerEmail: currentUserEmail });
    return { nextRecords, asset: nextAssets.find((a) => a.manualRecord?.id === recordId) || null };
  };

  // ── Handlers ──
  const handleDelete = (record: ProductLibraryAsset) => {
    if (!record.manualRecord) {
      toast.info('This product came from quotation/order history and cannot be removed.');
      return;
    }
    customerProductLibraryService.remove(record.manualRecord.id);
    toast.success(`Removed ${record.productName} from your product library.`);
  };

  const handleSaveProductMaster = () => {
    if (!selectedProduct?.manualRecord) {
      toast.info('Only saved customer products can be edited here.');
      return;
    }
    const updatedRecord = customerProductLibraryService.updateProductMaster(selectedProduct.manualRecord.id, {
      productName: productMasterEditor.productName,
      customerModelNo: productMasterEditor.customerModelNo,
      supplierModelNo: productMasterEditor.supplierModelNo,
      unit: productMasterEditor.unit,
      description: productMasterEditor.description,
    });
    syncSelectedProductFromRecord(updatedRecord);
    toast.success('Product updated.');
  };

  const handleSaveCurrentPackage = () => {
    if (!selectedProduct?.manualRecord) {
      toast.info('Only saved customer products can be updated here.');
      return;
    }
    let updatedRecord: CustomerProductRecord;
    if (selectedProduct.isProjectBased) {
      const revisionId = selectedProduct.currentRevisionId || selectedProjectRevisions[0]?.revisionId || null;
      if (!revisionId) { toast.info('No active revision found.'); return; }
      updatedRecord = customerProductLibraryService.updateCurrentProjectRevision(selectedProduct.manualRecord.id, {
        description: packageEditor.description,
        revisionNote: packageEditor.packageNote,
        files: packageEditor.files,
      });
    } else {
      updatedRecord = customerProductLibraryService.updateCurrentPackage(selectedProduct.manualRecord.id, {
        description: packageEditor.description,
        packageNote: packageEditor.packageNote,
        files: packageEditor.files,
      });
    }
    syncSelectedProductFromRecord(updatedRecord);
    toast.success(selectedProduct.isProjectBased ? 'Revision package saved.' : 'Package saved.');
  };

  const handleCreateNextStage = () => {
    setDetailTab('package');
    if (!selectedProduct?.manualRecord) {
      toast.info('Only saved customer products can create a new package update.');
      return;
    }
    if (selectedProduct.isProjectBased) {
      const nextRecord = customerProductLibraryService.createNextProjectRevision(selectedProduct.manualRecord.id);
      toast.success(`Revision ${nextRecord.projectRevisions?.[0]?.revisionCode || '—'} created.`);
      syncSelectedProductFromRecord(nextRecord);
      return;
    }
    const nextRecord = customerProductLibraryService.createNextPackageVersion(selectedProduct.manualRecord.id);
    toast.success(`Package V${nextRecord.packageVersion} created.`);
    syncSelectedProductFromRecord(nextRecord);
  };

  const handleUpdateFileRegister = (fileId: string, patch: Partial<Pick<OemUploadedFile, 'description' | 'customerPartNumber' | 'fileType'>>) => {
    setPackageEditor((c) => ({ ...c, files: c.files.map((f) => (f.id === fileId ? { ...f, ...patch } : f)) }));
  };

  const handlePickPackageFiles = () => {
    setDetailTab('files');
    packageFileInputRef.current?.click();
  };

  const handlePackageFilesSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files || []);
    if (selected.length === 0) return;
    setPackageEditor((c) => ({ ...c, files: [...c.files, ...selected.map(createOemUploadRecord)] }));
    event.target.value = '';
  };

  const handleRemovePackageFile = (fileId: string) => {
    setPackageEditor((c) => ({ ...c, files: c.files.filter((f) => f.id !== fileId) }));
  };

  const openInquirySelector = (product: ProductLibraryAsset) => {
    setInquirySelectionProduct(product);
    setIsInquirySelectorOpen(true);
  };

  const handleUseInInquiry = () => {
    if (!selectedProduct) return;
    openInquirySelector(selectedProduct);
  };

  const handleConfirmUseInInquiry = () => {
    if (!inquirySelectionProduct) return;
    const quantity = Math.max(1, Number.parseInt(inquirySelection.quantity || '1', 10) || 1);
    const pVersions = buildPackageVersions(inquirySelectionProduct);
    const pRevisions = buildProjectRevisions(inquirySelectionProduct);
    const selectedPackageVersion = inquirySelectionProduct.isProjectBased
      ? null
      : pVersions.find((p) => String(p.version) === String(inquirySelection.packageVersion)) || pVersions[0] || null;
    const selectedProjectRevision = inquirySelectionProduct.isProjectBased
      ? pRevisions.find((r) => r.revisionId === inquirySelection.revisionId) || pRevisions[0] || null
      : null;
    const inquiryProduct = tradeProductSnapshotService.normalizeInquirySelectionProduct(
      buildInquiryProductFromLibrarySelection({ asset: inquirySelectionProduct, selectedPackageVersion, selectedProjectRevision, quantity, notes: inquirySelection.notes }),
    );
    const existing = loadPendingInquiryDraftProducts(currentUserEmail);
    persistPendingInquiryDraftProducts(currentUserEmail, [...existing, inquiryProduct]);
    if (inquirySelectionProduct.manualRecord) {
      const updatedRecord = customerProductLibraryService.markProductUsedInInquiry(inquirySelectionProduct.manualRecord.id, { quantity });
      syncSelectedProductFromRecord(updatedRecord);
    }
    localStorage.setItem('dashboardActiveView', 'inquiries');
    localStorage.setItem(MY_PRODUCTS_AUTO_OPEN_INQUIRY_KEY, '1');
    localStorage.setItem('myProducts_lastSelectedProduct', JSON.stringify({
      id: inquirySelectionProduct.id, productName: inquirySelectionProduct.productName,
      customerModelNo: inquirySelectionProduct.customerModelNo, supplierModelNo: inquirySelectionProduct.supplierModelNo,
      isProjectBased: inquirySelectionProduct.isProjectBased,
      currentRevisionCode: selectedProjectRevision?.revisionCode || inquirySelectionProduct.currentRevisionCode || '',
      selectedPackageVersion: selectedPackageVersion?.version || inquirySelectionProduct.packageVersion,
      selectorNotes: inquirySelection.notes, quantity,
    }));
    window.dispatchEvent(new CustomEvent('customer-dashboard-navigate', { detail: { view: 'inquiries' } }));
    window.dispatchEvent(new CustomEvent('my-products-open-inquiry-dialog'));
    setIsInquirySelectorOpen(false);
    toast.success(
      inquirySelectionProduct.isProjectBased
        ? `Rev ${selectedProjectRevision?.revisionCode || inquirySelectionProduct.currentRevisionCode || '—'} prepared for inquiry.`
        : `Package V${selectedPackageVersion?.version || inquirySelectionProduct.packageVersion} prepared for inquiry.`,
    );
  };

  const handleSaveRevisionWorkflow = () => {
    if (!selectedProduct?.manualRecord || !selectedRevisionPreview) {
      toast.info('Select a saved project revision first.');
      return;
    }
    const updatedRecord =
      selectedRevisionStatus === 'final'
        ? customerProductLibraryService.setProjectFinalRevision(selectedProduct.manualRecord.id, selectedRevisionPreview.revisionId)
        : customerProductLibraryService.updateProjectRevisionStatus(selectedProduct.manualRecord.id, selectedRevisionPreview.revisionId, selectedRevisionStatus);
    syncSelectedProductFromRecord(updatedRecord);
    toast.success(
      selectedRevisionStatus === 'final'
        ? `Rev ${selectedRevisionPreview.revisionCode} set as final.`
        : `Rev ${selectedRevisionPreview.revisionCode} → ${formatRevisionStatusLabel(selectedRevisionStatus)}.`,
    );
  };

  const handleSetFinalRevision = () => {
    if (!selectedProduct?.manualRecord || !selectedRevisionPreview) {
      toast.info('Select a project revision first.');
      return;
    }
    const updatedRecord = customerProductLibraryService.setProjectFinalRevision(selectedProduct.manualRecord.id, selectedRevisionPreview.revisionId);
    syncSelectedProductFromRecord(updatedRecord);
    toast.success(`Rev ${selectedRevisionPreview.revisionCode} locked as final.`);
  };

  const handleCreateProductComplete = ({ record }: CreateProductCompletion) => {
    const { nextRecords, asset } = findAssetByRecordId(record.id);
    setLibraryRecords(nextRecords);
    if (asset) {
      setSelectedProduct(asset);
      toast.success(`${asset.productName} added to My Products.`);
    } else {
      toast.success('Product created in My Products.');
    }
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-full flex-col gap-0">
      {/* ── Page Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white">
            <Package className="h-4.5 w-4.5 h-[18px] w-[18px]" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-slate-900">My Products</h1>
            <p className="text-xs text-slate-500">Your personal product library &amp; re-inquiry hub</p>
          </div>
          {!isHydrating && (
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5">
              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <span className="font-semibold text-slate-900">{summary.total}</span> total
              </div>
              <span className="text-slate-300">·</span>
              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                <span className="font-semibold text-slate-900">{summary.inquiryReady}</span> inquiry-ready
              </div>
              <span className="text-slate-300">·</span>
              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <ShoppingCart className="h-3.5 w-3.5 text-slate-400" />
                <span className="font-semibold text-slate-900">{summary.ordered}</span> ordered
              </div>
            </div>
          )}
        </div>
        <Button onClick={() => setIsCreateFlowOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Product
        </Button>
      </div>

      {/* ── Filter Bar ── */}
      <div className="border-b border-slate-100 bg-white px-6 py-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative min-w-[220px] flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or model#"
              className="h-8 rounded-lg pl-8 text-sm"
            />
          </div>

          {/* Type chips */}
          <div className="flex items-center gap-1">
            {(
              [
                ['all', 'All'],
                ['standard', 'Standard'],
                ['oem', 'OEM'],
                ...(businessMode.projectRevisionEnabled ? [['project', 'Project']] : []),
                ['service', 'Service'],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setTypeFilter(value as typeof typeFilter)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  typeFilter === value
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Status filter */}
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
            <SelectTrigger className="h-8 w-32 rounded-lg text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>

          {/* Files filter */}
          <Select value={hasFilesFilter} onValueChange={(v) => setHasFilesFilter(v as typeof hasFilesFilter)}>
            <SelectTrigger className="h-8 w-32 rounded-lg text-xs">
              <SelectValue placeholder="Files" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="with-files">With Files</SelectItem>
              <SelectItem value="without-files">Without Files</SelectItem>
            </SelectContent>
          </Select>

          <div className="ml-auto flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`rounded-md p-1.5 transition ${viewMode === 'grid' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`rounded-md p-1.5 transition ${viewMode === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <LayoutList className="h-3.5 w-3.5" />
            </button>
          </div>

          {!isHydrating && (
            <span className="text-xs text-slate-400">
              {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* ── Product List ── */}
      <div className="flex-1 overflow-y-auto bg-slate-50/30 px-6 py-5">
        {isHydrating ? (
          <div className="flex items-center justify-center py-24 text-sm text-slate-400">
            Loading your product library…
          </div>
        ) : filteredProducts.length === 0 ? (
          <EmptyState onCreateProduct={() => setIsCreateFlowOpen(true)} />
        ) : viewMode === 'grid' ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onView={() => setSelectedProduct(product)}
                onUseInInquiry={() => openInquirySelector(product)}
                onDelete={product.manualRecord ? () => handleDelete(product) : undefined}
              />
            ))}
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="min-w-[240px]">Product</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Your Model#</TableHead>
                    <TableHead>COSUN Model#</TableHead>
                    <TableHead>Package</TableHead>
                    <TableHead>Files</TableHead>
                    <TableHead>Ref. Price</TableHead>
                    <TableHead>Last Activity</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <ProductRow
                      key={product.id}
                      product={product}
                      onView={() => setSelectedProduct(product)}
                      onUseInInquiry={() => openInquirySelector(product)}
                      onDelete={product.manualRecord ? () => handleDelete(product) : undefined}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>

      {/* ─────────────────── Product Detail Dialog ─────────────────────────── */}
      <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
        <DialogContent className="max-w-[1100px] overflow-hidden p-0">
          {selectedProduct ? (
            <div className="flex h-[88vh] flex-col bg-white">
              {/* Header */}
              <DialogHeader className="flex-shrink-0 border-b border-slate-200 px-6 py-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className={`inline-flex h-7 w-7 items-center justify-center rounded-lg border ${formatProductTypeBadgeClass(selectedProduct)}`}>
                        <ProductTypeIcon product={selectedProduct} />
                      </div>
                      <DialogTitle className="text-lg font-semibold text-slate-900 leading-tight">
                        {selectedProduct.productName}
                      </DialogTitle>
                      <Badge className={
                        selectedProduct.productStatus === 'active'
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          : selectedProduct.productStatus === 'draft'
                            ? 'border-amber-200 bg-amber-50 text-amber-700'
                            : 'border-slate-200 bg-slate-100 text-slate-600'
                      }>
                        {formatProductStatusLabel(selectedProduct.productStatus)}
                      </Badge>
                      <Badge variant="secondary" className="bg-slate-100 text-slate-600">
                        {formatProductTypeLabel(selectedProduct)}
                      </Badge>
                      <BusinessStatusBadge product={selectedProduct} />
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                      {selectedProduct.customerModelNo && (
                        <span>Your Model#: <strong className="text-slate-700">{selectedProduct.customerModelNo}</strong></span>
                      )}
                      {selectedProduct.supplierModelNo && (
                        <span>COSUN Model#: <strong className="text-slate-700">{selectedProduct.supplierModelNo}</strong></span>
                      )}
                      <span>{formatAssetSourceType(selectedProduct.assetSourceType)}</span>
                      {selectedProduct.isProjectBased ? (
                        <span>Rev {selectedProduct.currentRevisionCode || '—'}{selectedProduct.finalRevisionCode ? ` · Final: ${selectedProduct.finalRevisionCode}` : ''}</span>
                      ) : (
                        <span>{formatPackageStatus(selectedProduct.packageStatus)}</span>
                      )}
                      {selectedProduct.usageCount > 0 && (
                        <span>{selectedProduct.usageCount} inquiry use{selectedProduct.usageCount !== 1 ? 's' : ''}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-2">
                    {selectedProduct.manualRecord && (
                      <Button variant="outline" size="sm" onClick={handlePickPackageFiles}>
                        <Upload className="mr-1.5 h-3.5 w-3.5" />
                        Upload Files
                      </Button>
                    )}
                    <Button size="sm" onClick={handleUseInInquiry}>
                      <FileText className="mr-1.5 h-3.5 w-3.5" />
                      Re-Inquire
                    </Button>
                  </div>
                </div>
              </DialogHeader>

              {/* Body: sidebar + content */}
              <div className="flex min-h-0 flex-1 overflow-hidden">
                {/* Sidebar nav */}
                <div className="w-52 flex-shrink-0 border-r border-slate-100 bg-slate-50/50 px-3 py-4">
                  <DetailSideNav
                    activeTab={detailTab}
                    onTabChange={setDetailTab}
                    product={selectedProduct}
                  />

                  {/* Quick stats in sidebar */}
                  <div className="mt-6 space-y-3 border-t border-slate-200 pt-4">
                    {getBusinessStatusItems(selectedProduct).map((item) => {
                      const Icon = item.icon;
                      return (
                        <div key={item.key} className="flex items-start gap-2">
                          <Icon className={`mt-0.5 h-3.5 w-3.5 flex-shrink-0 ${item.active ? 'text-emerald-500' : 'text-slate-300'}`} />
                          <div className="min-w-0">
                            <div className="text-[10px] uppercase tracking-wide text-slate-400">{item.label}</div>
                            <div className="mt-0.5 text-xs text-slate-700 leading-relaxed">{item.value}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Tab content */}
                <div className="min-w-0 flex-1 overflow-y-auto px-6 py-5">
                  <input ref={packageFileInputRef} type="file" multiple onChange={handlePackageFilesSelected} className="hidden" />

                  {/* ── Overview Tab ── */}
                  {detailTab === 'overview' && (
                    <div className="space-y-5">
                      {/* Identity editor */}
                      <div className="rounded-xl border border-slate-200 bg-white p-5">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold text-slate-900">Product Identity</div>
                            <div className="text-xs text-slate-500">Edit the core details of this product record.</div>
                          </div>
                          {selectedProduct.manualRecord && (
                            <Button size="sm" onClick={handleSaveProductMaster}>Save Changes</Button>
                          )}
                        </div>
                        <div className="mt-4 grid gap-4 sm:grid-cols-2">
                          <div>
                            <Label className="text-xs font-medium text-slate-500">Product Name</Label>
                            <Input
                              className="mt-1.5"
                              value={productMasterEditor.productName}
                              onChange={(e) => setProductMasterEditor((c) => ({ ...c, productName: e.target.value }))}
                              placeholder="Product name"
                              disabled={!selectedProduct.manualRecord}
                            />
                          </div>
                          <div>
                            <Label className="text-xs font-medium text-slate-500">Your Model# (SKU)</Label>
                            <Input
                              className="mt-1.5"
                              value={productMasterEditor.customerModelNo}
                              onChange={(e) => setProductMasterEditor((c) => ({ ...c, customerModelNo: e.target.value }))}
                              placeholder="Your internal code"
                              disabled={!selectedProduct.manualRecord}
                            />
                          </div>
                          <div>
                            <Label className="text-xs font-medium text-slate-500">COSUN Model#</Label>
                            <div className="mt-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                              {selectedProduct.supplierModelNo || <span className="italic text-slate-400">Awaiting assignment</span>}
                            </div>
                          </div>
                          <div>
                            <Label className="text-xs font-medium text-slate-500">Unit</Label>
                            <Input
                              className="mt-1.5"
                              value={productMasterEditor.unit}
                              onChange={(e) => setProductMasterEditor((c) => ({ ...c, unit: e.target.value }))}
                              placeholder="pcs"
                              disabled={!selectedProduct.manualRecord}
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <Label className="text-xs font-medium text-slate-500">Description / Specification</Label>
                            <Textarea
                              className="mt-1.5"
                              value={productMasterEditor.description}
                              onChange={(e) => setProductMasterEditor((c) => ({ ...c, description: e.target.value }))}
                              rows={4}
                              placeholder="Summarize key specs, requirements, and context."
                              disabled={!selectedProduct.manualRecord}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Business history summary */}
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="rounded-xl border border-slate-200 bg-white p-5">
                          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                            <Tag className="h-4 w-4 text-slate-400" />
                            Quotation History
                          </div>
                          <dl className="mt-4 grid grid-cols-2 gap-3">
                            {[
                              ['Count', selectedProduct.quoteStats.count],
                              ['Last Price', formatPrice(selectedProduct.quoteStats.lastPrice)],
                              ['Avg. Price', formatPrice(selectedProduct.quoteStats.averagePrice)],
                              ['Latest QT', selectedProduct.lastQuotationNumber || '—'],
                            ].map(([k, v]) => (
                              <div key={String(k)}>
                                <dt className="text-[11px] text-slate-400">{k}</dt>
                                <dd className="mt-0.5 text-sm font-medium text-slate-800">{String(v)}</dd>
                              </div>
                            ))}
                          </dl>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-white p-5">
                          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                            <ShoppingCart className="h-4 w-4 text-slate-400" />
                            Order History
                          </div>
                          <dl className="mt-4 grid grid-cols-2 gap-3">
                            {[
                              ['Count', selectedProduct.orderStats.count],
                              ['Last Price', formatPrice(selectedProduct.orderStats.lastPrice)],
                              ['Total Qty', selectedProduct.orderStats.totalOrderedQty],
                              ['Latest Order', selectedProduct.lastOrderNumber || '—'],
                            ].map(([k, v]) => (
                              <div key={String(k)}>
                                <dt className="text-[11px] text-slate-400">{k}</dt>
                                <dd className="mt-0.5 text-sm font-medium text-slate-800">{String(v)}</dd>
                              </div>
                            ))}
                          </dl>
                        </div>
                      </div>

                      {/* Quick actions */}
                      <div className="rounded-xl border border-slate-200 bg-white p-5">
                        <div className="text-sm font-semibold text-slate-900">Quick Actions</div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Button onClick={handleUseInInquiry} className="gap-2">
                            <FileText className="h-4 w-4" />
                            Re-Inquire with this Product
                          </Button>
                          <Button variant="outline" onClick={() => setDetailTab('package')} className="gap-2">
                            <FileStack className="h-4 w-4" />
                            Manage Package
                          </Button>
                          <Button variant="outline" onClick={() => setDetailTab('files')} className="gap-2">
                            <Paperclip className="h-4 w-4" />
                            Manage Files
                          </Button>
                          {selectedProduct.manualRecord && (
                            <Button variant="outline" onClick={handleCreateNextStage} className="gap-2">
                              <GitBranchPlus className="h-4 w-4" />
                              {selectedProduct.isProjectBased ? 'Create Next Revision' : 'New Package Version'}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── Package / Revisions Tab ── */}
                  {detailTab === 'package' && (
                    <div className="space-y-5">
                      {/* Package editor */}
                      <div className="rounded-xl border border-slate-200 bg-white p-5">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold text-slate-900">
                              {selectedProduct.isProjectBased ? 'Current Revision Workspace' : 'Current Package Workspace'}
                            </div>
                            <div className="text-xs text-slate-500">
                              {selectedProduct.isProjectBased
                                ? `Editing Revision ${selectedProduct.currentRevisionCode || '—'}`
                                : `Editing Package V${selectedProduct.packageVersion || 1}`}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {selectedProduct.manualRecord && (
                              <>
                                <Button variant="outline" size="sm" onClick={handlePickPackageFiles}>
                                  <Upload className="mr-1.5 h-3.5 w-3.5" />
                                  Upload Files
                                </Button>
                                <Button size="sm" onClick={handleSaveCurrentPackage}>
                                  Save {selectedProduct.isProjectBased ? 'Revision' : 'Package'}
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="mt-4 space-y-3">
                          <div>
                            <Label className="text-xs font-medium text-slate-500">
                              {selectedProduct.isProjectBased ? 'Revision Summary' : 'Package Description'}
                            </Label>
                            <Textarea
                              className="mt-1.5"
                              value={packageEditor.description}
                              onChange={(e) => setPackageEditor((c) => ({ ...c, description: e.target.value }))}
                              rows={3}
                              placeholder="Summarize what's in this package — specs, changes, and requirements."
                              disabled={!selectedProduct.manualRecord}
                            />
                          </div>
                          <div>
                            <Label className="text-xs font-medium text-slate-500">Internal Notes</Label>
                            <Textarea
                              className="mt-1.5"
                              value={packageEditor.packageNote}
                              onChange={(e) => setPackageEditor((c) => ({ ...c, packageNote: e.target.value }))}
                              rows={2}
                              placeholder="Notes visible to COSUN team."
                              disabled={!selectedProduct.manualRecord}
                            />
                          </div>
                          {/* Attached files */}
                          {packageEditor.files.length > 0 && (
                            <div className="space-y-2">
                              <div className="text-xs font-medium text-slate-500">Attached Files ({packageEditor.files.length})</div>
                              {packageEditor.files.map((file) => (
                                <div key={file.id} className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                                  <Paperclip className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400" />
                                  <div className="min-w-0 flex-1 grid gap-2 sm:grid-cols-3">
                                    <div>
                                      <div className="text-xs font-medium text-slate-900 truncate">{file.fileName}</div>
                                      <div className="text-[11px] text-slate-400">
                                        {file.fileSize ? `${Math.max(1, Math.round(file.fileSize / 1024))} KB` : 'Saved'}
                                      </div>
                                    </div>
                                    <Input
                                      value={file.description || ''}
                                      onChange={(e) => handleUpdateFileRegister(file.id, { description: e.target.value })}
                                      placeholder="Description"
                                      className="h-7 text-xs"
                                    />
                                    <div className="flex items-center gap-2">
                                      <Select
                                        value={file.fileType || ''}
                                        onValueChange={(v) => handleUpdateFileRegister(file.id, { fileType: v as any })}
                                      >
                                        <SelectTrigger className="h-7 text-xs">
                                          <SelectValue placeholder="Type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {CUSTOMER_FILE_TYPE_OPTIONS.map((opt) => (
                                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                      {selectedProduct.manualRecord && (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-7 w-7 p-0 text-slate-400 hover:text-red-500"
                                          onClick={() => handleRemovePackageFile(file.id)}
                                        >
                                          <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                          {packageEditor.files.length === 0 && (
                            <button
                              type="button"
                              onClick={selectedProduct.manualRecord ? handlePickPackageFiles : undefined}
                              className={`flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 py-8 text-sm transition ${
                                selectedProduct.manualRecord
                                  ? 'cursor-pointer text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                                  : 'cursor-default text-slate-400'
                              }`}
                            >
                              <Upload className="h-4 w-4" />
                              {selectedProduct.manualRecord ? 'Click to upload technical files' : 'No files — read-only view'}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Version / Revision history */}
                      <div className="rounded-xl border border-slate-200 bg-white p-5">
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-sm font-semibold text-slate-900">
                            {selectedProduct.isProjectBased ? 'Revision History' : 'Package Version History'}
                          </div>
                          {selectedProduct.manualRecord && (
                            <Button variant="outline" size="sm" onClick={handleCreateNextStage}>
                              <GitBranchPlus className="mr-1.5 h-3.5 w-3.5" />
                              {selectedProduct.isProjectBased ? 'Create Next Revision' : 'New Version'}
                            </Button>
                          )}
                        </div>
                        <div className="mt-3 space-y-2">
                          {(selectedProduct.isProjectBased ? selectedProjectRevisions : selectedProductVersions).map((item: any) => {
                            const isSelected = selectedProduct.isProjectBased
                              ? selectedRevisionPreviewId === item.revisionId
                              : selectedPackagePreviewVersion === item.version;
                            const isFinal = selectedProduct.isProjectBased
                              ? selectedProduct.finalRevisionId === item.revisionId
                              : false;
                            return (
                              <button
                                key={selectedProduct.isProjectBased ? item.revisionId : item.versionLabel}
                                type="button"
                                onClick={() => {
                                  if (selectedProduct.isProjectBased) {
                                    setSelectedRevisionPreviewId(item.revisionId);
                                  } else {
                                    setSelectedPackagePreviewVersion(item.version);
                                  }
                                }}
                                className={`w-full rounded-lg border p-3 text-left transition ${
                                  isSelected
                                    ? 'border-slate-900 bg-slate-900 text-white'
                                    : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <span className={`text-sm font-semibold ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                                    {selectedProduct.isProjectBased ? `Rev ${item.revisionCode}` : item.versionLabel}
                                  </span>
                                  <div className="flex items-center gap-1.5">
                                    {isFinal && (
                                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${isSelected ? 'bg-white/15 text-slate-100' : 'bg-emerald-50 text-emerald-700'}`}>
                                        Final
                                      </span>
                                    )}
                                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                      isSelected
                                        ? 'bg-white/15 text-slate-100'
                                        : formatRevisionStatusBadgeClass(selectedProduct.isProjectBased ? item.revisionStatus : item.statusLabel)
                                    }`}>
                                      {selectedProduct.isProjectBased ? formatRevisionStatusLabel(item.revisionStatus) : item.statusLabel}
                                    </span>
                                    <span className={`text-xs ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>
                                      {item.files?.length || 0} file{item.files?.length !== 1 ? 's' : ''}
                                    </span>
                                  </div>
                                </div>
                                {item.summary && (
                                  <p className={`mt-1.5 text-xs leading-relaxed ${isSelected ? 'text-slate-200' : 'text-slate-600'}`}>
                                    {item.summary}
                                  </p>
                                )}
                                <div className={`mt-1 text-[11px] ${isSelected ? 'text-slate-400' : 'text-slate-400'}`}>
                                  {formatDate(item.updatedAt)}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Revision workflow control (project only) */}
                      {selectedProduct.isProjectBased && selectedRevisionPreview && (
                        <div className="rounded-xl border border-slate-200 bg-white p-5">
                          <div className="flex items-center justify-between gap-3">
                            <div className="text-sm font-semibold text-slate-900">
                              Revision Workflow — Rev {selectedRevisionPreview.revisionCode}
                            </div>
                            <Button
                              size="sm"
                              disabled={!selectedProduct.manualRecord || selectedProduct.finalRevisionId === selectedRevisionPreview.revisionId}
                              onClick={handleSetFinalRevision}
                            >
                              Lock as Final
                            </Button>
                          </div>
                          <div className="mt-4 flex items-end gap-3">
                            <div className="flex-1">
                              <Label className="text-xs font-medium text-slate-500">Revision Status</Label>
                              <Select
                                value={selectedRevisionStatus}
                                onValueChange={(v) => setSelectedRevisionStatus(v as ProjectRevisionView['revisionStatus'])}
                              >
                                <SelectTrigger className="mt-1.5">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="working">Working</SelectItem>
                                  <SelectItem value="quoted">Quoted</SelectItem>
                                  <SelectItem value="superseded">Superseded</SelectItem>
                                  <SelectItem value="cancelled">Cancelled</SelectItem>
                                  <SelectItem value="final">Final</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <Button
                              variant="outline"
                              disabled={!selectedProduct.manualRecord}
                              onClick={handleSaveRevisionWorkflow}
                            >
                              Save Status
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── Files Tab ── */}
                  {detailTab === 'files' && (
                    <div className="space-y-5">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-slate-900">File Register</div>
                          <div className="text-xs text-slate-500">{formatAttachmentSummaryLine(selectedProduct)}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          {selectedProduct.manualRecord && (
                            <>
                              <Button variant="outline" size="sm" onClick={handlePickPackageFiles}>
                                <Upload className="mr-1.5 h-3.5 w-3.5" />
                                Upload
                              </Button>
                              <Button size="sm" onClick={handleSaveCurrentPackage}>Save</Button>
                            </>
                          )}
                        </div>
                      </div>

                      {packageEditor.files.length === 0 ? (
                        <button
                          type="button"
                          onClick={selectedProduct.manualRecord ? handlePickPackageFiles : undefined}
                          className={`flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 py-16 text-center transition ${
                            selectedProduct.manualRecord
                              ? 'cursor-pointer hover:border-slate-300 hover:bg-slate-50'
                              : 'cursor-default'
                          }`}
                        >
                          <Paperclip className="h-8 w-8 text-slate-300" />
                          <p className="text-sm font-medium text-slate-600">No technical files saved yet</p>
                          <p className="text-xs text-slate-400">Upload drawings, spec sheets, BOM, or reference images</p>
                        </button>
                      ) : (
                        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-slate-50">
                                <TableHead>File</TableHead>
                                <TableHead>Customer File#</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {packageEditor.files.map((file) => (
                                <TableRow key={file.id}>
                                  <TableCell>
                                    <div className="font-medium text-slate-900">{file.fileName}</div>
                                    <div className="text-xs text-slate-400">
                                      {file.fileSize ? `${Math.max(1, Math.round(file.fileSize / 1024))} KB` : 'Saved'}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <Input
                                      value={file.customerPartNumber || ''}
                                      onChange={(e) => handleUpdateFileRegister(file.id, { customerPartNumber: e.target.value })}
                                      placeholder="Customer file#"
                                      className="h-7 w-36 text-xs"
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <Input
                                      value={file.description || ''}
                                      onChange={(e) => handleUpdateFileRegister(file.id, { description: e.target.value })}
                                      placeholder="Description"
                                      className="h-7 text-xs"
                                    />
                                  </TableCell>
                                  <TableCell className="text-sm text-slate-600">
                                    {file.fileType || '—'}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-1.5">
                                      {file.storageUrl && (
                                        <a href={file.storageUrl} target="_blank" rel="noreferrer" className="inline-flex h-7 items-center rounded-md border border-slate-200 px-2.5 text-xs font-medium text-slate-600 hover:bg-slate-50">
                                          Open
                                        </a>
                                      )}
                                      {selectedProduct.manualRecord && (
                                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-400 hover:text-red-500" onClick={() => handleRemovePackageFile(file.id)}>
                                          <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                      )}
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}

                      {/* Manifest snapshot */}
                      {selectedFileManifest.length > 0 && (
                        <div className="rounded-xl border border-slate-200 bg-white p-5">
                          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                            <Archive className="h-4 w-4 text-slate-400" />
                            Frozen Manifest Snapshot
                            <Badge variant="secondary" className="ml-auto text-[11px]">
                              {selectedFileManifest.length} rows
                            </Badge>
                          </div>
                          <div className="mt-3 space-y-2">
                            {selectedFileManifest.map((file) => (
                              <div key={file.fileIdOrToken} className="flex items-start gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                                <Paperclip className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-slate-400" />
                                <div className="min-w-0">
                                  <div className="text-xs font-medium text-slate-800">{file.fileNameSnapshot}</div>
                                  {file.descriptionSnapshot && (
                                    <div className="text-[11px] text-slate-500">{file.descriptionSnapshot}</div>
                                  )}
                                  {file.customerPartNumber && (
                                    <div className="text-[11px] text-slate-400">File#: {file.customerPartNumber}</div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── Business Records Tab ── */}
                  {detailTab === 'business' && (
                    <div className="space-y-5">
                      {/* Quotations */}
                      <div className="rounded-xl border border-slate-200 bg-white p-5">
                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                          <Tag className="h-4 w-4 text-slate-400" />
                          Quotation Records
                          <Badge variant="secondary" className="ml-auto text-[11px]">{relatedQuotationRows.length}</Badge>
                        </div>
                        {relatedQuotationRows.length === 0 ? (
                          <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 py-8 text-center text-sm text-slate-400">
                            No quotations linked to this product yet.
                          </div>
                        ) : (
                          <div className="mt-3 overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Quotation#</TableHead>
                                  <TableHead>Date</TableHead>
                                  <TableHead>Status</TableHead>
                                  <TableHead>Amount</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {relatedQuotationRows.map((row) => (
                                  <TableRow key={row.id}>
                                    <TableCell className="font-medium text-slate-900">{row.number}</TableCell>
                                    <TableCell className="text-sm text-slate-600">{formatDate(row.date)}</TableCell>
                                    <TableCell className="text-sm text-slate-600">{row.status}</TableCell>
                                    <TableCell className="text-sm font-medium text-slate-900">{row.amountLabel}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        )}
                      </div>

                      {/* Orders */}
                      <div className="rounded-xl border border-slate-200 bg-white p-5">
                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                          <ShoppingCart className="h-4 w-4 text-slate-400" />
                          Order Records
                          <Badge variant="secondary" className="ml-auto text-[11px]">{relatedOrderRows.length}</Badge>
                        </div>
                        {relatedOrderRows.length === 0 ? (
                          <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 py-8 text-center text-sm text-slate-400">
                            No orders linked to this product yet.
                          </div>
                        ) : (
                          <div className="mt-3 overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Order#</TableHead>
                                  <TableHead>Date</TableHead>
                                  <TableHead>Status</TableHead>
                                  <TableHead>Amount</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {relatedOrderRows.map((row) => (
                                  <TableRow key={row.id}>
                                    <TableCell className="font-medium text-slate-900">{row.number}</TableCell>
                                    <TableCell className="text-sm text-slate-600">{formatDate(row.date)}</TableCell>
                                    <TableCell className="text-sm text-slate-600">{row.status}</TableCell>
                                    <TableCell className="text-sm font-medium text-slate-900">{row.amountLabel}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        )}
                      </div>

                      {/* Project revision trace */}
                      {selectedProduct.isProjectBased && selectedProjectRevisionTrace.length > 0 && (
                        <div className="rounded-xl border border-slate-200 bg-white p-5">
                          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                            <GitBranchPlus className="h-4 w-4 text-slate-400" />
                            Project Revision Quote Trace
                            <Badge variant="secondary" className="ml-auto text-[11px]">{selectedProjectRevisionTrace.length}</Badge>
                          </div>
                          <div className="mt-3 overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Quotation#</TableHead>
                                  <TableHead>Revision</TableHead>
                                  <TableHead>Total</TableHead>
                                  <TableHead>Status</TableHead>
                                  <TableHead>Date</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {selectedProjectRevisionTrace.map((trace) => (
                                  <TableRow key={trace.id}>
                                    <TableCell className="font-medium text-slate-900">{trace.qtNumber}</TableCell>
                                    <TableCell className="text-sm text-slate-600">Rev {trace.revisionCode}</TableCell>
                                    <TableCell className="text-sm font-medium text-slate-900">{formatPrice(trace.totalPrice)}</TableCell>
                                    <TableCell className="text-sm text-slate-600">{trace.customerStatus}</TableCell>
                                    <TableCell className="text-sm text-slate-500">{formatDate(trace.updatedAt)}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── Actions Tab ── */}
                  {detailTab === 'actions' && (
                    <div className="space-y-5">
                      {/* Re-inquire */}
                      <div className="rounded-xl border border-slate-200 bg-white p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="text-sm font-semibold text-slate-900">Re-Inquire with this Product</div>
                            <div className="mt-1 text-xs text-slate-500">
                              Launch a new inquiry pre-filled with this product's specifications, technical files, and OEM requirements. No re-entry needed.
                            </div>
                          </div>
                          <Button onClick={handleUseInInquiry} className="flex-shrink-0 gap-2">
                            <FileText className="h-4 w-4" />
                            Start Inquiry
                          </Button>
                        </div>
                        <div className="mt-4 grid grid-cols-3 gap-3">
                          {[
                            ['Package / Rev', selectedProduct.isProjectBased ? `Rev ${selectedProduct.finalRevisionCode || selectedProduct.currentRevisionCode || '—'}` : `V${selectedProduct.packageVersion || 1}`],
                            ['Files included', String(selectedCurrentVersionFiles.length)],
                            ['Usage count', String(selectedProduct.usageCount)],
                          ].map(([label, value]) => (
                            <div key={String(label)} className="rounded-lg bg-slate-50 px-3 py-2">
                              <div className="text-[10px] uppercase tracking-wide text-slate-400">{label}</div>
                              <div className="mt-0.5 text-sm font-semibold text-slate-900">{value}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Package actions */}
                      {selectedProduct.manualRecord && (
                        <div className="rounded-xl border border-slate-200 bg-white p-5">
                          <div className="text-sm font-semibold text-slate-900">Product Development Actions</div>
                          <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            <button
                              type="button"
                              onClick={handlePickPackageFiles}
                              className="flex items-start gap-3 rounded-xl border border-slate-200 p-4 text-left transition hover:border-slate-300 hover:bg-slate-50"
                            >
                              <Upload className="mt-0.5 h-5 w-5 flex-shrink-0 text-slate-500" />
                              <div>
                                <div className="text-sm font-medium text-slate-900">Upload Technical Files</div>
                                <div className="mt-0.5 text-xs text-slate-500">Add drawings, specs, BOM, or packaging files to this product's library.</div>
                              </div>
                            </button>
                            <button
                              type="button"
                              onClick={handleCreateNextStage}
                              className="flex items-start gap-3 rounded-xl border border-slate-200 p-4 text-left transition hover:border-slate-300 hover:bg-slate-50"
                            >
                              <GitBranchPlus className="mt-0.5 h-5 w-5 flex-shrink-0 text-slate-500" />
                              <div>
                                <div className="text-sm font-medium text-slate-900">
                                  {selectedProduct.isProjectBased ? 'Create Next Revision' : 'Create New Package Version'}
                                </div>
                                <div className="mt-0.5 text-xs text-slate-500">
                                  {selectedProduct.isProjectBased
                                    ? 'Start a new revision cycle with updated specs or design changes.'
                                    : 'Bump to a new package version when specs have changed significantly.'}
                                </div>
                              </div>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Planned features callout */}
                      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5">
                        <div className="text-sm font-semibold text-slate-500">Coming Soon</div>
                        <div className="mt-3 grid gap-2 sm:grid-cols-2">
                          {[
                            ['Request Spec Change', 'Submit a formal spec change request for COSUN to review.'],
                            ['Apply for Sample', 'Request a product sample for quality verification.'],
                            ['Submit Feedback', 'Share market feedback or improvement suggestions.'],
                            ['Update OEM Artwork', 'Upload new logo or packaging artwork for OEM products.'],
                          ].map(([title, desc]) => (
                            <div key={String(title)} className="flex items-start gap-2 rounded-lg border border-slate-200 bg-white p-3 opacity-60">
                              <ClipboardList className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400" />
                              <div>
                                <div className="text-xs font-medium text-slate-700">{title}</div>
                                <div className="text-[11px] text-slate-500">{desc}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* ─────────────────── Inquiry Selector Dialog ───────────────────────── */}
      <Dialog
        open={isInquirySelectorOpen && !!inquirySelectionProduct}
        onOpenChange={(open) => {
          setIsInquirySelectorOpen(open);
          if (!open) setInquirySelectionProduct(null);
        }}
      >
        <DialogContent className="max-w-2xl">
          {inquirySelectionProduct ? (
            <>
              <DialogHeader className="border-b border-slate-200 pb-4">
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl border ${formatProductTypeBadgeClass(inquirySelectionProduct)}`}>
                    <ProductTypeIcon product={inquirySelectionProduct} />
                  </div>
                  <div>
                    <DialogTitle className="text-base font-semibold text-slate-900">
                      Re-Inquire: {inquirySelectionProduct.productName}
                    </DialogTitle>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Confirm the {inquirySelectionProduct.isProjectBased ? 'revision' : 'package'}, quantity, and any notes before preparing the inquiry snapshot.
                    </p>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-4 py-2">
                {/* Product summary */}
                <div className="grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-3">
                  {[
                    ['Your Model#', inquirySelectionProduct.customerModelNo || '—'],
                    ['COSUN Model#', inquirySelectionProduct.supplierModelNo || 'Pending'],
                    ['Files', String(inquirySelectionPreviewFiles.length)],
                  ].map(([k, v]) => (
                    <div key={String(k)}>
                      <div className="text-[10px] uppercase tracking-wide text-slate-400">{k}</div>
                      <div className="mt-0.5 text-xs font-semibold text-slate-800">{String(v)}</div>
                    </div>
                  ))}
                </div>

                {/* Selector inputs */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label className="text-xs font-medium text-slate-500">
                      {inquirySelectionProduct.isProjectBased ? 'Select Revision' : 'Select Package Version'}
                    </Label>
                    {inquirySelectionProduct.isProjectBased ? (
                      <Select
                        value={inquirySelection.revisionId}
                        onValueChange={(v) => setInquirySelection((c) => ({ ...c, revisionId: v }))}
                      >
                        <SelectTrigger className="mt-1.5">
                          <SelectValue placeholder="Select revision" />
                        </SelectTrigger>
                        <SelectContent>
                          {inquirySelectionRevisions.map((r) => (
                            <SelectItem key={r.revisionId} value={r.revisionId}>
                              Rev {r.revisionCode} · {formatRevisionStatusLabel(r.revisionStatus)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Select
                        value={inquirySelection.packageVersion}
                        onValueChange={(v) => setInquirySelection((c) => ({ ...c, packageVersion: v }))}
                      >
                        <SelectTrigger className="mt-1.5">
                          <SelectValue placeholder="Select package" />
                        </SelectTrigger>
                        <SelectContent>
                          {inquirySelectionVersions.map((p) => (
                            <SelectItem key={`${inquirySelectionProduct.id}-pkg-${p.version}`} value={String(p.version)}>
                              {p.versionLabel} · {p.statusLabel}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  <div>
                    <Label className="text-xs font-medium text-slate-500">Quantity</Label>
                    <Input
                      type="number"
                      min={1}
                      value={inquirySelection.quantity}
                      onChange={(e) => setInquirySelection((c) => ({ ...c, quantity: e.target.value }))}
                      className="mt-1.5"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <Label className="text-xs font-medium text-slate-500">Additional Notes (optional)</Label>
                    <Textarea
                      value={inquirySelection.notes}
                      onChange={(e) => setInquirySelection((c) => ({ ...c, notes: e.target.value }))}
                      rows={3}
                      className="mt-1.5"
                      placeholder="Any specific requirements for this inquiry round…"
                    />
                  </div>
                </div>

                {/* Files preview */}
                {inquirySelectionPreviewFiles.length > 0 && (
                  <div>
                    <div className="mb-2 text-xs font-medium text-slate-500">
                      Files that will travel with this inquiry ({inquirySelectionPreviewFiles.length})
                    </div>
                    <div className="space-y-1.5 max-h-32 overflow-y-auto">
                      {inquirySelectionPreviewFiles.map((file) => (
                        <div key={file.id} className="flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-1.5">
                          <Paperclip className="h-3 w-3 flex-shrink-0 text-slate-400" />
                          <span className="truncate text-xs text-slate-700">{file.fileName}</span>
                          {file.fileType && <span className="text-[10px] text-slate-400">{file.fileType}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4">
                <Button
                  variant="outline"
                  onClick={() => { setIsInquirySelectorOpen(false); setInquirySelectionProduct(null); }}
                >
                  Cancel
                </Button>
                <Button onClick={handleConfirmUseInInquiry} className="gap-2">
                  <FileText className="h-4 w-4" />
                  Prepare Inquiry Snapshot
                </Button>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* ─────────────────── Create Product Flow ───────────────────────────── */}
      <CreateProductFlow
        open={isCreateFlowOpen}
        mode="library"
        onOpenChange={setIsCreateFlowOpen}
        onComplete={handleCreateProductComplete}
      />
    </div>
  );
}
