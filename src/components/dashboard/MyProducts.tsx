import { useEffect, useMemo, useRef, useState } from 'react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Eye, FileStack, GitBranchPlus, Link2, Package, Paperclip, Plus, Search, ShoppingCart, Tag, Trash2, Upload, type LucideIcon } from 'lucide-react';
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
  if (value === null || !Number.isFinite(value)) return '-';
  return priceFormatter.format(value);
};

const formatDateTime = (value?: string | null) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
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

const formatCustomerFacingSource = (product: ProductLibraryAsset) => {
  if (product.sourceType === 'cosun') return 'From COSUN';
  if (product.sourceType === 'mixed') return 'Used in business';
  if (product.sourceType === 'third_party') return 'External source';
  return 'Created by you';
};

const formatProductTypeLabel = (product: ProductLibraryAsset) => {
  if (product.manualRecord?.serviceType === 'qc_service') return 'QC Service';
  if (product.manualRecord?.serviceType === 'general_service') return 'General Service';
  if (product.isProjectBased) return 'Project';
  if (product.itemType === 'oem_custom') return 'OEM / Custom';
  return 'Standard';
};

const formatInquiryReadyLabel = (product: ProductLibraryAsset) => {
  if (product.isProjectBased) {
    return product.finalRevisionCode
      ? `Final revision ${product.finalRevisionCode} locked`
      : `Revision ${product.currentRevisionCode || '-'} active`;
  }
  if (product.attachmentCount > 0) return 'Ready with technical files';
  if (product.description) return 'Ready with current package';
  return 'Add package details';
};

const formatPackageStatus = (status: ProductLibraryAsset['packageStatus']) => {
  if (status === 'technical_package_ready') return 'Files Ready';
  if (status === 'basic_package') return 'Current Package';
  return 'No Package';
};

const formatProductStatusLabel = (status: ProductLibraryAsset['productStatus']) => {
  if (status === 'archived') return 'Archived';
  if (status === 'draft') return 'Draft';
  return 'Active';
};

const formatAssetSourceType = (sourceType?: ProductLibraryAsset['assetSourceType']) => {
  if (sourceType === 'saved_from_website') return 'Saved from Website';
  if (sourceType === 'derived_from_inquiry') return 'Created from Inquiry';
  if (sourceType === 'derived_from_order') return 'Created from Order';
  if (sourceType === 'assigned_by_cosun') return 'Assigned by COSUN';
  return 'Created by Customer';
};

const formatMasterLinkLabel = (product: ProductLibraryAsset) => {
  if (product.masterRef?.internalModelNo) {
    return product.masterRef.isResolved
      ? `Linked to ${product.masterRef.internalModelNo}`
      : `Pending master ${product.masterRef.internalModelNo}`;
  }
  if (product.supplierModelNo) return `Using COSUN model ${product.supplierModelNo}`;
  return 'Awaiting internal master link';
};

const formatMappingStatusLabel = (product: ProductLibraryAsset) => {
  const status = String(product.mappingRef?.mappingStatus || '').trim().toLowerCase();
  if (status === 'confirmed') return 'Confirmed mapping';
  if (status === 'suggested') return 'Suggested mapping';
  if (status === 'pending') return 'Pending mapping review';
  if (status === 'rejected') return 'Mapping rejected';
  if (status === 'unmapped') return 'Unmapped';
  return product.supplierModelNo ? 'Linked through COSUN model' : 'No mapping yet';
};

const formatAttachmentSummaryLine = (product: ProductLibraryAsset) => {
  const summary = product.attachmentSummarySnapshot;
  if (!summary) {
    return product.attachmentCount > 0
      ? `${product.attachmentCount} file(s) ready`
      : 'No frozen file summary yet';
  }
  const summaryParts: string[] = [];
  if (summary.hasDrawing) summaryParts.push('Drawing');
  if (summary.hasSpec) summaryParts.push('Spec');
  if (summary.hasBom) summaryParts.push('BOM');
  if (summary.hasPackaging) summaryParts.push('Packaging');
  if (summary.hasTestReport) summaryParts.push('Test report');
  if (summary.hasImage) summaryParts.push('Image');
  return summaryParts.length > 0
    ? `${summary.attachmentCount} file(s): ${summaryParts.join(' · ')}`
    : `${summary.attachmentCount} file(s) frozen in snapshot`;
};

const formatRevisionStatusLabel = (status?: ProjectRevisionView['revisionStatus'] | null) => {
  if (status === 'final') return 'Final';
  if (status === 'quoted') return 'Quoted';
  if (status === 'superseded') return 'Superseded';
  if (status === 'cancelled') return 'Cancelled';
  return 'Working';
};

const formatUsageCountLabel = (usageCount: number) => {
  if (!usageCount) return '0';
  return usageCount === 1 ? '1 use' : `${usageCount} uses`;
};

const CUSTOMER_FILE_TYPE_OPTIONS = [
  { value: 'drawing', label: 'Drawing' },
  { value: 'spec', label: 'Specification' },
  { value: 'image', label: 'Image' },
  { value: 'bom', label: 'BOM' },
  { value: 'packaging', label: 'Packaging' },
  { value: 'test-report', label: 'Test Report' },
  { value: 'other', label: 'Other' },
] as const;

const productStatusBadgeClass: Record<ProductLibraryAsset['productStatus'], string> = {
  active: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  draft: 'border-amber-200 bg-amber-50 text-amber-700',
  archived: 'border-slate-200 bg-slate-100 text-slate-600',
};

const packageStatusBadgeClass: Record<ProductLibraryAsset['packageStatus'], string> = {
  no_package: 'border-slate-200 bg-slate-50 text-slate-700',
  basic_package: 'border-blue-200 bg-blue-50 text-blue-700',
  technical_package_ready: 'border-violet-200 bg-violet-50 text-violet-700',
};

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

type DetailTab = 'basic' | 'package' | 'revisions' | 'files' | 'commercial' | 'inquiry';

type DetailEntryCard = {
  id: DetailTab;
  label: string;
  value: string;
  helper: string;
  icon: LucideIcon;
};

type InquirySelectionState = {
  packageVersion: string;
  revisionId: string;
  quantity: string;
  notes: string;
};

const NEW_INQUIRY_DRAFT_PRODUCTS_KEY = 'new_inquiry_draft_products_v1';
const MY_PRODUCTS_AUTO_OPEN_INQUIRY_KEY = 'my_products_open_new_inquiry';

const formatPackageTrack = (product: ProductLibraryAsset) => {
  if (product.packageStatus === 'technical_package_ready') return 'Technical package controlled';
  if (product.packageStatus === 'basic_package') return 'Basic package prepared';
  return 'No package baseline yet';
};

const formatStandardPackageLabel = (version: number, index: number) => {
  if (index === 0) return 'Current Package';
  if (index === 1) return 'Previous Package Snapshot';
  return `Archived Package Snapshot ${version}`;
};

const formatPackageLifecycleLabel = (status: ProductLibraryAsset['packageStatus']) => {
  if (status === 'technical_package_ready') return 'Current technical package';
  if (status === 'basic_package') return 'Current business package';
  return 'Current placeholder package';
};

const buildPackageVersions = (product: ProductLibraryAsset): ProductPackageVersionView[] => {
  if (Array.isArray(product.manualRecord?.packageVersions) && product.manualRecord.packageVersions.length > 0) {
    return product.manualRecord.packageVersions.map((pkg, index) => ({
      version: pkg.version,
      versionLabel: formatStandardPackageLabel(pkg.version, index),
      statusLabel:
        pkg.status === 'technical_package_ready'
          ? 'Technical package snapshot'
          : pkg.status === 'basic_package'
            ? 'Business package snapshot'
            : 'Placeholder snapshot',
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
    statusLabel: formatPackageLifecycleLabel(product.packageStatus),
    summary:
      product.packageStatus === 'technical_package_ready'
        ? `${product.attachmentCount} technical attachment(s) ready for inquiry reuse`
        : product.packageStatus === 'basic_package'
          ? 'Business description available, technical files can be added next'
          : 'No technical package files have been stored yet',
    releaseTrack: formatPackageTrack(product),
    updatedAt: product.updatedAt,
    files: normalizedOem.files,
    notes: normalizedOem.overallRequirementNote || product.description || '',
  };

  if (product.packageVersion <= 1) {
    return [currentVersion];
  }

  return [
    currentVersion,
    {
      version: 1,
      versionLabel: 'Previous Package Snapshot',
      statusLabel: 'Baseline package',
      summary: 'Original product package baseline kept for revision history planning',
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
      summary: product.description || 'Current project revision snapshot',
      updatedAt: product.updatedAt,
      files: normalizeOemData(product.manualRecord?.oem).files,
      notes: product.description || '',
    },
  ];
};

const formatCurrentPackageLabel = (product: ProductLibraryAsset) => {
  if (product.isProjectBased) {
    return `Revision ${product.currentRevisionCode || '-'}`;
  }
  if (product.packageStatus === 'technical_package_ready') return 'Current Package';
  if (product.packageStatus === 'basic_package') return 'Current Package';
  return 'Package setup needed';
};

const formatCurrentPackageHelper = (product: ProductLibraryAsset) => {
  if (product.isProjectBased) {
    return product.finalRevisionCode
      ? `Final execution revision: ${product.finalRevisionCode}`
      : `Current revision status: ${product.currentRevisionStatus || 'working'}`;
  }
  if (product.attachmentCount > 0) return `${product.attachmentCount} file(s) saved in this package`;
  if (product.description) return 'Product details are ready and files can be added next';
  return 'Add package details before reusing this product in inquiry';
};

const buildDetailEntryCards = (
  product: ProductLibraryAsset,
  fileCount: number,
  revisionCount: number,
): DetailEntryCard[] => {
  const cards: DetailEntryCard[] = [
    {
      id: 'basic',
      label: 'Overview',
      value: product.productName,
      helper: 'Manage product identity, asset summary, and lifecycle context.',
      icon: Package,
    },
    {
      id: 'package',
      label: 'Technical Package',
      value: fileCount > 0 ? `${fileCount} file${fileCount === 1 ? '' : 's'}` : 'No files yet',
      helper: product.isProjectBased ? 'Manage the active revision files and package snapshots.' : 'Manage the current package files and notes.',
      icon: FileStack,
    },
    {
      id: 'files',
      label: 'Files',
      value: fileCount > 0 ? `${fileCount} file${fileCount === 1 ? '' : 's'}` : 'No files yet',
      helper: 'Review the file register, manifest details, and storage coverage for this asset.',
      icon: Paperclip,
    },
  ];

  if (product.isProjectBased) {
    cards.push({
      id: 'revisions',
      label: 'Revisions',
      value: revisionCount > 0 ? `${revisionCount} revision${revisionCount === 1 ? '' : 's'}` : 'No revisions yet',
      helper: 'Review revision history, lock a final revision, and control workflow status.',
      icon: GitBranchPlus,
    });
  }

  cards.push(
    {
      id: 'commercial',
      label: 'Quotes & Orders',
      value:
        product.quoteStats.count > 0 || product.orderStats.count > 0
          ? `${product.quoteStats.count} QT · ${product.orderStats.count} order${product.orderStats.count === 1 ? '' : 's'}`
          : 'No linked records',
      helper: 'Review linked quotation and order history here.',
      icon: ShoppingCart,
    },
    {
      id: 'inquiry',
      label: 'Use in Inquiry',
      value: formatInquiryReadyLabel(product),
      helper: 'Select package or revision, quantity, and notes before creating an inquiry snapshot.',
      icon: GitBranchPlus,
    },
  );

  return cards;
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
      const byItemModel = Array.isArray((quotation as any).items) && (quotation as any).items.some((item: any) => {
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
      revisionCode: String((quotation as any).projectRevisionCode || currentRevisionCode || '-'),
      revisionStatus: String((quotation as any).projectRevisionStatus || product.currentRevisionStatus || 'quoted'),
      totalPrice: Number.isFinite(quotation.totalPrice) ? quotation.totalPrice : null,
      approvalStatus: quotation.approvalStatus,
      customerStatus: quotation.customerStatus,
      updatedAt: quotation.updatedAt || quotation.createdAt || null,
    }))
    .sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')));
};

const productMatchesQuotation = (product: ProductLibraryAsset, quotation: SalesQuotation) => {
  const directCustomerProductMatch =
    product.manualRecord?.id &&
    Array.isArray((quotation as any).items) &&
    (quotation as any).items.some((item: any) => String(item?.customerProductId || '').trim() === product.manualRecord?.id);
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
    order.products.some((item) => String(item?.projectRevisionId || '').trim() === String(product.currentRevisionId));
  if (directProjectRevisionMatch) return true;

  return Array.isArray(order.products) && order.products.some((item) => {
    const itemName = normalizeLower(item?.name);
    return product.productName && itemName === normalizeLower(product.productName);
  });
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
    ? (selectedProjectRevision?.files ? { ...normalizeOemData(record?.oem), files: selectedProjectRevision.files, overallRequirementNote: selectedProjectRevision.notes } : record?.oem)
    : (selectedPackageVersion?.files ? { ...normalizeOemData(record?.oem), files: selectedPackageVersion.files, overallRequirementNote: selectedPackageVersion.notes } : record?.oem);
  const normalizedOem = normalizeOemData(resolvedOem);
  const sourceProductId = record?.sourceProductId || asset.supplierProductId || asset.matchKey;
  const customerProductId = record?.id || null;
  const selectedSummary = asset.isProjectBased
    ? (selectedProjectRevision?.summary || asset.description || '')
    : (selectedPackageVersion?.summary || asset.description || '');
  const inquiryRequirementSummary = [selectedSummary, String(notes || '').trim()].filter(Boolean).join('\n\n');
  const inquirySnapshotDraft = {
    ...customerAssetAdapter.toInquirySnapshotDraft(asset, {
      selectedPackageVersion: selectedPackageVersion
        ? {
            version: selectedPackageVersion.version,
            oem: resolvedOem,
          }
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
      inquiryRequirementSummary || customerAssetAdapter.toInquirySnapshotDraft(asset, {
        quantity,
        currency: 'USD',
      }).inquiryRequirementSummary,
  };
  const inquirySnapshot = tradeProductSnapshotService.createInquirySnapshot(inquirySnapshotDraft);

  return {
    id: `my-product-${asset.id}-${asset.isProjectBased ? selectedProjectRevision?.revisionId || asset.currentRevisionId || 'current' : selectedPackageVersion?.version || asset.packageVersion}`,
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

export function MyProducts() {
  const { orders } = useOrders();
  const { quotations } = useSalesQuotations();
  const [libraryRecords, setLibraryRecords] = useState<CustomerProductRecord[]>([]);
  const [isLibraryHydrated, setIsLibraryHydrated] = useState(false);
  const [isBridgeReady, setIsBridgeReady] = useState(() => isSupabaseStorageBridgeReady());
  const [isPortfolioSettled, setIsPortfolioSettled] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [itemFilter, setItemFilter] = useState<'all' | 'standard' | 'oem' | 'project' | 'service'>('all');
  const [sourceFilter, setSourceFilter] = useState<
    'all' | 'customer_created' | 'saved_from_website' | 'derived_from_inquiry' | 'derived_from_order' | 'assigned_by_cosun'
  >('all');
  const [statusFilter, setStatusFilter] = useState<'all' | ProductLibraryAsset['productStatus']>('all');
  const [hasFilesFilter, setHasFilesFilter] = useState<'all' | 'with-files' | 'without-files'>('all');
  const [selectedProduct, setSelectedProduct] = useState<ProductLibraryAsset | null>(null);
  const [detailTab, setDetailTab] = useState<DetailTab>('basic');
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
  const [isCreateFlowOpen, setIsCreateFlowOpen] = useState(false);
  const [selectedPackagePreviewVersion, setSelectedPackagePreviewVersion] = useState<number | null>(null);
  const [selectedRevisionPreviewId, setSelectedRevisionPreviewId] = useState<string | null>(null);
  const [selectedRevisionStatus, setSelectedRevisionStatus] = useState<ProjectRevisionView['revisionStatus']>('working');
  const [inquirySelectionProduct, setInquirySelectionProduct] = useState<ProductLibraryAsset | null>(null);
  const [isInquirySelectorOpen, setIsInquirySelectorOpen] = useState(false);
  const [inquirySelection, setInquirySelection] = useState<InquirySelectionState>({
    packageVersion: '',
    revisionId: '',
    quantity: '1',
    notes: '',
  });

  const [currentUserEmail, setCurrentUserEmail] = useState(() => resolveProductLibraryCustomerEmail());
  const [businessMode, setBusinessMode] = useState(() => resolveCustomerBusinessMode());

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
    const timer = window.setTimeout(() => {
      setIsPortfolioSettled(true);
    }, 900);

    return () => {
      window.clearTimeout(timer);
    };
  }, [currentUserEmail]);

  useEffect(() => {
    if (selectedProduct) {
      setDetailTab('basic');
    }
  }, [selectedProduct?.id]);

  const products = useMemo(() => {
    return buildProductLibraryAssets({
      libraryRecords,
      quotations,
      orders,
      customerEmail: currentUserEmail,
    });
  }, [currentUserEmail, libraryRecords, orders, quotations]);

  useEffect(() => {
    if (products.length > 0) {
      setIsPortfolioSettled(true);
    }
  }, [products.length]);

  const isHydrating =
    !isBridgeReady ||
    !isLibraryHydrated ||
    !currentUserEmail ||
    (!isPortfolioSettled && products.length === 0);

  const findAssetByRecordId = (recordId: string) => {
    const nextRecords = customerProductLibraryService.getAll();
    const nextAssets = buildProductLibraryAssets({
      libraryRecords: nextRecords,
      quotations,
      orders,
      customerEmail: currentUserEmail,
    });
    return {
      nextRecords,
      asset: nextAssets.find((item) => item.manualRecord?.id === recordId) || null,
    };
  };

  const filteredProducts = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    return products.filter((product) => {
      if (!businessMode.projectRevisionEnabled && product.isProjectBased) {
        return false;
      }
      const matchesKeyword =
        !keyword ||
        [
          product.productName,
          product.customerModelNo,
          product.supplierModelNo,
          product.description,
          ...product.sourceTags,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(keyword));
      const matchesType =
        itemFilter === 'all' ||
        (itemFilter === 'project' && businessMode.projectRevisionEnabled && product.isProjectBased) ||
        (itemFilter === 'oem' && product.itemType === 'oem_custom') ||
        (itemFilter === 'service' && !!product.manualRecord?.serviceType) ||
        (itemFilter === 'standard' &&
          !product.isProjectBased &&
          product.itemType !== 'oem_custom' &&
          !product.manualRecord?.serviceType);
      const matchesSource = sourceFilter === 'all' || product.assetSourceType === sourceFilter;
      const matchesStatus = statusFilter === 'all' || product.productStatus === statusFilter;
      const matchesHasFiles =
        hasFilesFilter === 'all' ||
        (hasFilesFilter === 'with-files' && product.attachmentCount > 0) ||
        (hasFilesFilter === 'without-files' && product.attachmentCount === 0);
      return matchesKeyword && matchesType && matchesSource && matchesStatus && matchesHasFiles;
    });
  }, [businessMode.projectRevisionEnabled, hasFilesFilter, itemFilter, products, searchTerm, sourceFilter, statusFilter]);

  const summary = useMemo(() => {
    const total = products.length;
    const mapped = products.filter((item) => item.supplierModelNo).length;
    const ordered = products.filter((item) => item.orderStats.count > 0).length;
    const oem = products.filter((item) => item.itemType === 'oem_custom').length;
    const technicalPackages = products.filter((item) => item.packageStatus === 'technical_package_ready').length;
    const cosunSourced = products.filter((item) => item.sourceType === 'cosun' || item.sourceType === 'mixed').length;
    return { total, mapped, ordered, oem, technicalPackages, cosunSourced };
  }, [products]);

  const handleDelete = (record: ProductLibraryAsset) => {
    if (!record.manualRecord) {
      toast.info('This product came from quotation/order history and cannot be removed from the unified library.');
      return;
    }
    customerProductLibraryService.remove(record.manualRecord.id);
    toast.success(`Removed ${record.productName} from your saved manual product records.`);
  };

  const handleCreateNextPackageVersion = () => {
    if (!selectedProduct?.manualRecord) {
      toast.info('Only saved customer product records can create a new package version.');
      return;
    }

    const nextRecord = customerProductLibraryService.createNextPackageVersion(selectedProduct.manualRecord.id);
    toast.success(`Created ${selectedProduct.productName} package version V${nextRecord.packageVersion}.`);
    syncSelectedProductFromRecord(nextRecord);
  };

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
    () => selectedProjectRevisions.find((revision) => revision.revisionId === selectedRevisionPreviewId) || selectedProjectRevisions[0] || null,
    [selectedProjectRevisions, selectedRevisionPreviewId],
  );
  const selectedCurrentVersionFiles = useMemo(() => {
    if (!selectedProduct) return [];

    return selectedProduct.isProjectBased
      ? (selectedProjectRevisions[0]?.files || normalizeOemData(selectedProduct.manualRecord?.oem).files)
      : (selectedProductVersions.length > 0 ? selectedProductVersions[0].files : normalizeOemData(selectedProduct.manualRecord?.oem).files);
  }, [selectedProduct, selectedProjectRevisions, selectedProductVersions]);
  const selectedCurrentVersionFilesKey = useMemo(
    () => filesSignature(selectedCurrentVersionFiles),
    [selectedCurrentVersionFiles],
  );
  const detailEntryCards = useMemo(
    () => (selectedProduct ? buildDetailEntryCards(selectedProduct, selectedCurrentVersionFiles.length, selectedProjectRevisions.length) : []),
    [selectedCurrentVersionFiles.length, selectedProduct, selectedProjectRevisions.length],
  );
  const selectedAttachmentSummary = useMemo(
    () => selectedProduct?.attachmentSummarySnapshot || null,
    [selectedProduct],
  );
  const selectedFileManifest = useMemo(
    () => selectedProduct?.fileManifestSnapshot || [],
    [selectedProduct],
  );
  const relatedQuotationRows = useMemo<ProductDocumentTrace[]>(
    () =>
      selectedProduct
        ? quotations
            .filter((quotation) => productMatchesQuotation(selectedProduct, quotation))
            .map((quotation) => ({
              id: quotation.id,
              number: quotation.qtNumber,
              date: quotation.updatedAt || quotation.createdAt || null,
              status: quotation.customerStatus,
              amountLabel: formatPrice(Number.isFinite(quotation.totalPrice) ? quotation.totalPrice : null),
              note: `${quotation.approvalStatus} · ${quotation.quotationRole || 'commercial_offer'}`,
            }))
            .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')))
        : [],
    [quotations, selectedProduct],
  );
  const relatedOrderRows = useMemo<ProductDocumentTrace[]>(
    () =>
      selectedProduct
        ? orders
            .filter((order) => productMatchesOrder(selectedProduct, order))
            .map((order) => ({
              id: order.id,
              number: order.orderNumber,
              date: order.updatedAt || order.createdAt || order.date || null,
              status: order.status,
              amountLabel: formatPrice(Number.isFinite(order.totalAmount) ? order.totalAmount : null),
              note: `${order.products.length} line(s) · ${order.paymentStatus || 'Payment pending'}`,
            }))
            .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')))
        : [],
    [orders, selectedProduct],
  );
  const recentUsageRows = useMemo(
    () =>
      selectedProduct
        ? [
            selectedProduct.lastInquiryNumber
              ? {
                  type: 'Inquiry',
                  number: selectedProduct.lastInquiryNumber,
                  detail: 'Latest inquiry that called this product',
                }
              : null,
            selectedProduct.lastQuotationNumber
              ? {
                  type: 'Quotation',
                  number: selectedProduct.lastQuotationNumber,
                  detail: 'Latest quotation linked to this product',
                }
              : null,
            selectedProduct.lastOrderNumber
              ? {
                  type: 'Order',
                  number: selectedProduct.lastOrderNumber,
                  detail: 'Latest confirmed order using this product',
                }
              : null,
          ].filter(Boolean)
        : [],
    [selectedProduct],
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
      return inquirySelectionRevisions.find((revision) => revision.revisionId === inquirySelection.revisionId)?.files
        || inquirySelectionRevisions[0]?.files
        || [];
    }
    return inquirySelectionVersions.find((pkg) => String(pkg.version) === String(inquirySelection.packageVersion))?.files
      || inquirySelectionVersions[0]?.files
      || [];
  }, [inquirySelection.packageVersion, inquirySelection.revisionId, inquirySelectionProduct, inquirySelectionRevisions, inquirySelectionVersions]);

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
      selectedProjectRevisions.find((revision) => revision.revisionId === defaultRevisionId) ||
      selectedProjectRevisions[0] ||
      null;

    setSelectedPackagePreviewVersion(defaultPackageVersion);
    setSelectedRevisionPreviewId(defaultRevisionId);
    setSelectedRevisionStatus((defaultRevision?.revisionStatus || 'working') as ProjectRevisionView['revisionStatus']);
  }, [selectedProduct, selectedProduct?.id, selectedProduct?.packageVersion, selectedProduct?.currentRevisionId, selectedProduct?.finalRevisionId, selectedProductVersions, selectedProjectRevisions]);

  useEffect(() => {
    if (!selectedRevisionPreview) return;
    setSelectedRevisionStatus(selectedRevisionPreview.revisionStatus);
  }, [selectedRevisionPreview]);

  useEffect(() => {
    if (!inquirySelectionProduct) {
      setInquirySelection({
        packageVersion: '',
        revisionId: '',
        quantity: '1',
        notes: '',
      });
      return;
    }

    const inquiryProductVersions = buildPackageVersions(inquirySelectionProduct);
    const inquiryProjectRevisions = buildProjectRevisions(inquirySelectionProduct);
    const defaultPackageVersion = String(inquiryProductVersions[0]?.version || inquirySelectionProduct.packageVersion || 1);
    const defaultRevisionId =
      inquirySelectionProduct.finalRevisionId ||
      inquirySelectionProduct.currentRevisionId ||
      inquiryProjectRevisions[0]?.revisionId ||
      '';

    setInquirySelection({
      packageVersion: defaultPackageVersion,
      revisionId: defaultRevisionId,
      quantity: String(inquirySelectionProduct.manualRecord?.lastQuantity || 1),
      notes: '',
    });
  }, [inquirySelectionProduct]);

  useEffect(() => {
    if (!selectedProduct) {
      setProductMasterEditor((current) => {
        if (!current.productName && !current.customerModelNo && !current.supplierModelNo && current.unit === 'pcs' && !current.description) {
          return current;
        }
        return {
          productName: '',
          customerModelNo: '',
          supplierModelNo: '',
          unit: 'pcs',
          description: '',
        };
      });
      setPackageEditor((current) => {
        if (!current.description && !current.packageNote && current.files.length === 0) {
          return current;
        }
        return { description: '', packageNote: '', files: [] };
      });
      return;
    }
    const primaryNote = selectedProduct.isProjectBased
      ? (selectedProjectRevisions[0]?.notes || selectedProduct.manualRecord?.oem?.overallRequirementNote || '')
      : (selectedProductVersions[0]?.notes || selectedProduct.manualRecord?.oem?.overallRequirementNote || '');
    setPackageEditor((current) => {
      const nextEditor = {
        description: selectedProduct.description || '',
        packageNote: primaryNote,
        files: selectedCurrentVersionFiles,
      };

      if (
        current.description === nextEditor.description &&
        current.packageNote === nextEditor.packageNote &&
        filesSignature(current.files) === selectedCurrentVersionFilesKey
      ) {
        return current;
      }

      return nextEditor;
    });
  }, [
    selectedProduct,
    selectedProduct?.id,
    selectedProduct?.updatedAt,
    selectedProduct?.isProjectBased,
    selectedCurrentVersionFiles,
    selectedCurrentVersionFilesKey,
    selectedProjectRevisions,
    selectedProductVersions,
  ]);

  useEffect(() => {
    if (!selectedProduct) return;
    setProductMasterEditor((current) => {
      const nextEditor = {
        productName: selectedProduct.productName || '',
        customerModelNo: selectedProduct.customerModelNo || '',
        supplierModelNo: selectedProduct.supplierModelNo || '',
        unit: selectedProduct.unit || 'pcs',
        description: selectedProduct.description || '',
      };

      if (
        current.productName === nextEditor.productName &&
        current.customerModelNo === nextEditor.customerModelNo &&
        current.supplierModelNo === nextEditor.supplierModelNo &&
        current.unit === nextEditor.unit &&
        current.description === nextEditor.description
      ) {
        return current;
      }

      return nextEditor;
    });
  }, [selectedProduct]);

  const syncSelectedProductFromRecord = (updatedRecord: CustomerProductRecord) => {
    const { nextRecords, asset } = findAssetByRecordId(updatedRecord.id);
    setLibraryRecords(nextRecords);
    setSelectedProduct((current) => {
      if (!current || current.manualRecord?.id !== updatedRecord.id) return current;
      return asset || current;
    });
    setInquirySelectionProduct((current) => {
      if (!current || current.manualRecord?.id !== updatedRecord.id) return current;
      return asset || current;
    });
  };

  const handleSaveCurrentPackage = () => {
    if (!selectedProduct?.manualRecord) {
      toast.info('Only saved product records can be edited here.');
      return;
    }

    const updatedRecord = selectedProduct.isProjectBased
      ? customerProductLibraryService.updateCurrentProjectRevision(selectedProduct.manualRecord.id, {
          description: packageEditor.description,
          revisionNote: packageEditor.packageNote,
          files: packageEditor.files,
        })
      : customerProductLibraryService.updateCurrentPackage(selectedProduct.manualRecord.id, {
          description: packageEditor.description,
          packageNote: packageEditor.packageNote,
          files: packageEditor.files,
        });

    syncSelectedProductFromRecord(updatedRecord);
    toast.success(selectedProduct.isProjectBased ? 'Current revision updated.' : 'Current package updated.');
  };

  const handleUpdateFileRegister = (
    fileId: string,
    patch: Partial<Pick<OemUploadedFile, 'description' | 'customerPartNumber' | 'fileType'>>,
  ) => {
    setPackageEditor((current) => ({
      ...current,
      files: current.files.map((file) => (file.id === fileId ? { ...file, ...patch } : file)),
    }));
  };

  const handlePickPackageFiles = () => {
    setDetailTab('package');
    packageFileInputRef.current?.click();
  };

  const handlePackageFilesSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    if (selectedFiles.length === 0) return;

    const nextFiles = selectedFiles.map(createOemUploadRecord);
    setPackageEditor((current) => ({
      ...current,
      files: [...current.files, ...nextFiles],
    }));
    event.target.value = '';
  };

  const handleRemovePackageFile = (fileId: string) => {
    setPackageEditor((current) => ({
      ...current,
      files: current.files.filter((file) => file.id !== fileId),
    }));
  };

  const handleUseInInquiry = () => {
    if (!selectedProduct) return;
    openInquirySelector(selectedProduct);
  };

  const handleConfirmUseInInquiry = () => {
    if (!inquirySelectionProduct) return;

    const quantity = Math.max(1, Number.parseInt(inquirySelection.quantity || '1', 10) || 1);
    const inquiryProductVersions = buildPackageVersions(inquirySelectionProduct);
    const inquiryProjectRevisions = buildProjectRevisions(inquirySelectionProduct);
    const selectedPackageVersion = inquirySelectionProduct.isProjectBased
      ? null
      : inquiryProductVersions.find((pkg) => String(pkg.version) === String(inquirySelection.packageVersion)) || inquiryProductVersions[0] || null;
    const selectedProjectRevision = inquirySelectionProduct.isProjectBased
      ? inquiryProjectRevisions.find((revision) => revision.revisionId === inquirySelection.revisionId) || inquiryProjectRevisions[0] || null
      : null;
    const inquiryProduct = tradeProductSnapshotService.normalizeInquirySelectionProduct(
      buildInquiryProductFromLibrarySelection({
        asset: inquirySelectionProduct,
        selectedPackageVersion,
        selectedProjectRevision,
        quantity,
        notes: inquirySelection.notes,
      }),
    );

    const existingDraftProducts = loadPendingInquiryDraftProducts(currentUserEmail);
    persistPendingInquiryDraftProducts(currentUserEmail, [
      ...existingDraftProducts,
      inquiryProduct,
    ]);

    if (inquirySelectionProduct.manualRecord) {
      const updatedRecord = customerProductLibraryService.markProductUsedInInquiry(
        inquirySelectionProduct.manualRecord.id,
        { quantity },
      );
      syncSelectedProductFromRecord(updatedRecord);
    }

    localStorage.setItem('dashboardActiveView', 'inquiries');
    localStorage.setItem(MY_PRODUCTS_AUTO_OPEN_INQUIRY_KEY, '1');
    localStorage.setItem(
      'myProducts_lastSelectedProduct',
      JSON.stringify({
        id: inquirySelectionProduct.id,
        productName: inquirySelectionProduct.productName,
        customerModelNo: inquirySelectionProduct.customerModelNo,
        supplierModelNo: inquirySelectionProduct.supplierModelNo,
        isProjectBased: inquirySelectionProduct.isProjectBased,
        currentRevisionCode: selectedProjectRevision?.revisionCode || inquirySelectionProduct.currentRevisionCode || '',
        selectedPackageVersion: selectedPackageVersion?.version || inquirySelectionProduct.packageVersion,
        selectorNotes: inquirySelection.notes,
        quantity,
      }),
    );
    window.dispatchEvent(new CustomEvent('customer-dashboard-navigate', { detail: { view: 'inquiries' } }));
    window.dispatchEvent(new CustomEvent('my-products-open-inquiry-dialog'));
    setIsInquirySelectorOpen(false);
    toast.success(
      inquirySelectionProduct.isProjectBased
        ? `Revision ${selectedProjectRevision?.revisionCode || inquirySelectionProduct.currentRevisionCode || '-'} prepared for inquiry.`
        : `Package V${selectedPackageVersion?.version || inquirySelectionProduct.packageVersion} prepared for inquiry.`,
    );
  };

  const handleSaveProductMaster = () => {
    if (!selectedProduct?.manualRecord) {
      toast.info('Only saved customer products can edit master data here.');
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
    toast.success('Product master updated.');
  };

  const handleCreateNextStage = () => {
    setDetailTab('package');
    if (!selectedProduct?.manualRecord) {
      toast.info('Only saved customer products can create a new package update.');
      return;
    }

    if (selectedProduct.isProjectBased) {
      const nextRecord = customerProductLibraryService.createNextProjectRevision(selectedProduct.manualRecord.id);
      toast.success(`Created project revision ${nextRecord.projectRevisions?.[0]?.revisionCode || '-'}.`);
      syncSelectedProductFromRecord(nextRecord);
      return;
    }

    handleCreateNextPackageVersion();
  };

  const openInquirySelector = (product: ProductLibraryAsset) => {
    setInquirySelectionProduct(product);
    setIsInquirySelectorOpen(true);
  };

  const handleSaveRevisionWorkflow = () => {
    if (!selectedProduct?.manualRecord || !selectedRevisionPreview) {
      toast.info('Select a saved project revision first.');
      return;
    }

    const updatedRecord = selectedRevisionStatus === 'final'
      ? customerProductLibraryService.setProjectFinalRevision(
          selectedProduct.manualRecord.id,
          selectedRevisionPreview.revisionId,
        )
      : customerProductLibraryService.updateProjectRevisionStatus(
          selectedProduct.manualRecord.id,
          selectedRevisionPreview.revisionId,
          selectedRevisionStatus,
        );

    syncSelectedProductFromRecord(updatedRecord);
    toast.success(
      selectedRevisionStatus === 'final'
        ? `Revision ${selectedRevisionPreview.revisionCode} is now the final revision.`
        : `Revision ${selectedRevisionPreview.revisionCode} updated to ${formatRevisionStatusLabel(selectedRevisionStatus)}.`,
    );
  };

  const handleSetFinalRevision = () => {
    if (!selectedProduct?.manualRecord || !selectedRevisionPreview) {
      toast.info('Select a project revision before locking the final revision.');
      return;
    }

    const updatedRecord = customerProductLibraryService.setProjectFinalRevision(
      selectedProduct.manualRecord.id,
      selectedRevisionPreview.revisionId,
    );
    syncSelectedProductFromRecord(updatedRecord);
    toast.success(`Revision ${selectedRevisionPreview.revisionCode} locked as final.`);
  };

  const handleCreateProductComplete = ({ record }: CreateProductCompletion) => {
    const { nextRecords, asset } = findAssetByRecordId(record.id);
    setLibraryRecords(nextRecords);
    if (asset) {
      setSelectedProduct(asset);
      toast.success(`${asset.productName} is now available in My Products.`);
    } else {
      toast.success('Product created in My Products.');
    }
  };

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-[linear-gradient(135deg,#ffffff_0%,#f8fafc_45%,#eef2ff_100%)]">
        <div className="flex flex-col gap-6 px-6 py-7 lg:flex-row lg:items-end lg:justify-between lg:px-8">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="bg-white text-slate-700 shadow-sm">
                Customer Product Asset Center
              </Badge>
              <Badge variant="secondary" className="bg-white text-slate-700 shadow-sm">
                Packages · Revisions · Inquiry Source
              </Badge>
            </div>
            <h2 className="mt-4 text-[30px] font-semibold tracking-tight text-slate-950">My Products</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Build reusable customer product assets, manage technical packages and revisions, and launch inquiry from a controlled product source instead of temporary line-item entry.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-2xl border border-white/70 bg-white/80 px-4 py-3 text-sm text-slate-600 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Library Status</div>
              <div className="mt-2 font-medium text-slate-900">
                {isHydrating ? 'Hydrating assets...' : `${summary.total} asset${summary.total === 1 ? '' : 's'} ready`}
              </div>
            </div>
            <Button onClick={() => setIsCreateFlowOpen(true)} className="h-11 gap-2 px-5">
              <Plus className="h-4 w-4" />
              Create Product
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-3 xl:grid-cols-6">
        {[
          ['Products', summary.total, 'Total customer product assets'],
          ['Mapped', summary.mapped, 'With COSUN/internal model coverage'],
          ['With Files', summary.technicalPackages, 'Assets already carrying technical package files'],
          ['Used in Orders', summary.ordered, 'Assets already linked to order history'],
          ['OEM', summary.oem, 'Custom or OEM-driven assets'],
          ['From COSUN', summary.cosunSourced, 'Assets seeded from COSUN side'],
        ].map(([label, value, helper]) => (
          <div key={String(label)} className="rounded-3xl border border-slate-200 bg-white px-5 py-5 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</div>
            <div className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{isHydrating ? '...' : value}</div>
            <div className="mt-2 text-xs leading-5 text-slate-500">{helper}</div>
          </div>
        ))}
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white px-5 py-5 shadow-sm lg:px-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="grid flex-1 gap-3 xl:grid-cols-[minmax(260px,1.3fr)_180px_180px_180px_180px]">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search product name, your model#, or supplier model#"
                className="h-11 rounded-xl pl-9"
              />
            </div>
            <Select value={itemFilter} onValueChange={(value) => setItemFilter(value as typeof itemFilter)}>
              <SelectTrigger className="h-11 rounded-xl">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="oem">OEM</SelectItem>
                {businessMode.projectRevisionEnabled ? <SelectItem value="project">Project</SelectItem> : null}
                <SelectItem value="service">Service</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sourceFilter} onValueChange={(value) => setSourceFilter(value as typeof sourceFilter)}>
              <SelectTrigger className="h-11 rounded-xl">
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="customer_created">Customer Created</SelectItem>
                <SelectItem value="saved_from_website">Saved from Website</SelectItem>
                <SelectItem value="derived_from_inquiry">From Inquiry</SelectItem>
                <SelectItem value="derived_from_order">From Order</SelectItem>
                <SelectItem value="assigned_by_cosun">Assigned by COSUN</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}>
              <SelectTrigger className="h-11 rounded-xl">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
            <Select value={hasFilesFilter} onValueChange={(value) => setHasFilesFilter(value as typeof hasFilesFilter)}>
              <SelectTrigger className="h-11 rounded-xl">
                <SelectValue placeholder="Has Files" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Files</SelectItem>
                <SelectItem value="with-files">With Files</SelectItem>
                <SelectItem value="without-files">Without Files</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Visible Assets</div>
            <div className="mt-1 font-medium text-slate-900">{isHydrating ? '...' : filteredProducts.length}</div>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Asset Library</div>
            <div className="mt-1 text-xl font-semibold text-slate-950">Reusable product assets</div>
          </div>
        </div>

        {isHydrating ? (
          <div className="rounded-[28px] border border-dashed border-slate-200 bg-slate-50 px-6 py-16 text-center">
            <p className="text-sm font-medium text-slate-700">Loading product assets...</p>
            <p className="mt-1 text-sm text-slate-500">
              We are hydrating your saved products, quotation history, and order history.
            </p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-slate-200 bg-slate-50 px-6 py-16 text-center">
            <p className="text-sm font-medium text-slate-700">No product assets in your library yet.</p>
            <p className="mt-1 text-sm text-slate-500">
              Create a formal product asset here so package files, revisions, and inquiry reuse all start from the same source.
            </p>
            <Button className="mt-4 gap-2" onClick={() => setIsCreateFlowOpen(true)}>
              <Plus className="h-4 w-4" />
              Create Product
            </Button>
          </div>
        ) : (
          <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="min-w-[260px]">Product</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Your Model#</TableHead>
                    <TableHead>COSUN Model#</TableHead>
                    <TableHead>Current Package / Revision</TableHead>
                    <TableHead>Files Count</TableHead>
                    <TableHead>Last Inquiry</TableHead>
                    <TableHead>Last Quote</TableHead>
                    <TableHead>Last Order</TableHead>
                    <TableHead>Usage Count</TableHead>
                    <TableHead className="min-w-[220px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow key={product.id} className="align-top">
                      <TableCell className="min-w-[260px]">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge className={productStatusBadgeClass[product.productStatus]}>
                              {formatProductStatusLabel(product.productStatus)}
                            </Badge>
                            {product.isProjectBased && selectedProduct?.id !== product.id ? (
                              <Badge variant="secondary" className="bg-slate-100 text-slate-700">
                                Revision-controlled
                              </Badge>
                            ) : null}
                          </div>
                          <div className="font-semibold text-slate-950">{product.productName}</div>
                          <div className="line-clamp-2 text-xs leading-5 text-slate-500">
                            {product.description || 'No description saved yet.'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-slate-700">{formatProductTypeLabel(product)}</TableCell>
                      <TableCell className="text-sm text-slate-700">{formatAssetSourceType(product.assetSourceType)}</TableCell>
                      <TableCell className="text-sm text-slate-700">{product.customerModelNo || '-'}</TableCell>
                      <TableCell className="text-sm text-slate-700">{product.supplierModelNo || 'Pending'}</TableCell>
                      <TableCell className="text-sm text-slate-700">{formatCurrentPackageLabel(product)}</TableCell>
                      <TableCell className="text-sm text-slate-700">{product.attachmentCount}</TableCell>
                      <TableCell className="text-sm text-slate-700">{product.lastInquiryNumber || '-'}</TableCell>
                      <TableCell className="text-sm text-slate-700">{product.lastQuotationNumber || '-'}</TableCell>
                      <TableCell className="text-sm text-slate-700">{product.lastOrderNumber || '-'}</TableCell>
                      <TableCell className="text-sm text-slate-700">{formatUsageCountLabel(product.usageCount)}</TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => setSelectedProduct(product)}>
                            <Eye className="mr-1 h-4 w-4" />
                            View
                          </Button>
                          <Button size="sm" onClick={() => openInquirySelector(product)}>
                            Use in Inquiry
                          </Button>
                          {product.manualRecord ? (
                            <Button size="sm" variant="outline" onClick={() => handleDelete(product)}>
                              <Trash2 className="mr-1 h-4 w-4" />
                              Remove
                            </Button>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </section>

      <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
        <DialogContent className="max-w-[1280px] overflow-hidden p-0">
          {selectedProduct ? (
            <div className="flex max-h-[90vh] flex-col bg-white">
              <DialogHeader className="border-b border-slate-200 bg-[linear-gradient(135deg,#ffffff_0%,#f8fafc_45%,#eef2ff_100%)] px-8 py-7">
                <div className="flex flex-col gap-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary" className="bg-white text-slate-700 shadow-sm">
                          Product Asset Workspace
                        </Badge>
                        <Badge variant="secondary" className="bg-white text-slate-700 shadow-sm">
                          {selectedProduct.isProjectBased ? 'Revision-Controlled Asset' : 'Package-Controlled Asset'}
                        </Badge>
                      </div>
                      <DialogTitle className="text-3xl font-semibold tracking-tight text-slate-950">
                        {selectedProduct.productName}
                      </DialogTitle>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className={productStatusBadgeClass[selectedProduct.productStatus]}>
                          {formatProductStatusLabel(selectedProduct.productStatus)}
                        </Badge>
                        <Badge className={packageStatusBadgeClass[selectedProduct.packageStatus]}>
                          {formatCurrentPackageLabel(selectedProduct)}
                        </Badge>
                        <Badge variant="secondary" className="bg-slate-100 text-slate-700">
                          {formatProductTypeLabel(selectedProduct)}
                        </Badge>
                        <Badge variant="secondary" className="bg-slate-100 text-slate-700">
                          {formatCustomerFacingSource(selectedProduct)}
                        </Badge>
                      </div>
                      <div className="grid gap-3 text-sm text-slate-600 sm:grid-cols-2 xl:grid-cols-4">
                        <div>
                          <div className="text-xs uppercase tracking-wide text-slate-400">Your Model#</div>
                          <div className="mt-1 font-medium text-slate-900">{selectedProduct.customerModelNo || '-'}</div>
                        </div>
                        <div>
                          <div className="text-xs uppercase tracking-wide text-slate-400">COSUN Model#</div>
                          <div className="mt-1 font-medium text-slate-900">{selectedProduct.supplierModelNo || 'Awaiting assignment'}</div>
                        </div>
                        <div>
                          <div className="text-xs uppercase tracking-wide text-slate-400">Source Type</div>
                          <div className="mt-1 font-medium text-slate-900">{formatAssetSourceType(selectedProduct.assetSourceType)}</div>
                        </div>
                        <div>
                          <div className="text-xs uppercase tracking-wide text-slate-400">
                            {selectedProduct.isProjectBased ? 'Current Revision' : 'Current Package'}
                          </div>
                          <div className="mt-1 font-medium text-slate-900">{formatCurrentPackageLabel(selectedProduct)}</div>
                        </div>
                        <div>
                          <div className="text-xs uppercase tracking-wide text-slate-400">Ready for Inquiry</div>
                          <div className="mt-1 font-medium text-slate-900">{formatInquiryReadyLabel(selectedProduct)}</div>
                        </div>
                        <div>
                          <div className="text-xs uppercase tracking-wide text-slate-400">Files Count</div>
                          <div className="mt-1 font-medium text-slate-900">{selectedCurrentVersionFiles.length}</div>
                        </div>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                      <Button variant="outline" onClick={handlePickPackageFiles} disabled={!selectedProduct.manualRecord}>
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Files
                      </Button>
                      {selectedProduct.manualRecord ? (
                        <Button variant="outline" onClick={handleCreateNextStage}>
                          <GitBranchPlus className="mr-2 h-4 w-4" />
                          {selectedProduct.isProjectBased ? 'Create Next Revision' : 'Create Package Update'}
                        </Button>
                      ) : null}
                      <Button onClick={handleUseInInquiry}>Use in Inquiry</Button>
                    </div>
                  </div>
                  <div className={`grid gap-3 ${selectedProduct.isProjectBased ? 'lg:grid-cols-6' : 'lg:grid-cols-5'}`}>
                    {detailEntryCards.map((card) => {
                      const Icon = card.icon;
                      const isActive = detailTab === card.id;
                      return (
                        <button
                          key={card.id}
                          type="button"
                          onClick={() => setDetailTab(card.id)}
                          className={`rounded-xl border p-4 text-left transition ${
                            isActive
                              ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                              : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div
                              className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${
                                isActive
                                  ? 'bg-white/15 text-white'
                                  : 'border border-slate-200 bg-white text-slate-600'
                              }`}
                            >
                              <Icon className="h-4 w-4" />
                            </div>
                            <span
                              className={`text-[11px] font-medium uppercase tracking-wide ${
                                isActive ? 'text-slate-200' : 'text-slate-500'
                              }`}
                            >
                              {isActive ? 'Current' : 'Open'}
                            </span>
                          </div>
                          <div
                            className={`mt-4 text-[11px] font-medium uppercase tracking-wide ${
                              isActive ? 'text-slate-300' : 'text-slate-400'
                            }`}
                          >
                            {card.label}
                          </div>
                          <div className={`mt-2 text-base font-semibold ${isActive ? 'text-white' : 'text-slate-900'}`}>
                            {card.value}
                          </div>
                          <div className={`mt-2 text-sm ${isActive ? 'text-slate-200' : 'text-slate-600'}`}>
                            {card.helper}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto px-8 py-6">
                <Tabs
                  value={detailTab}
                  onValueChange={(value) => setDetailTab(value as DetailTab)}
                  className="w-full"
                >
                  <TabsList className={`grid w-full ${selectedProduct.isProjectBased ? 'grid-cols-6' : 'grid-cols-5'}`}>
                    <TabsTrigger value="basic">Overview</TabsTrigger>
                    <TabsTrigger value="package">Technical Package</TabsTrigger>
                    {selectedProduct.isProjectBased ? <TabsTrigger value="revisions">Revisions</TabsTrigger> : null}
                    <TabsTrigger value="files">Files</TabsTrigger>
                    <TabsTrigger value="commercial">Quotes & Orders</TabsTrigger>
                    <TabsTrigger value="inquiry">Use in Inquiry</TabsTrigger>
                  </TabsList>

                  <TabsContent value="basic" className="mt-4">
                    <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
                      <div className="rounded-lg border border-slate-200 bg-white p-5">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold text-slate-900">Asset Overview</div>
                            <div className="mt-1 text-xs text-slate-500">Manage the reusable identity fields that define this customer asset.</div>
                          </div>
                          {selectedProduct.manualRecord ? <Button size="sm" onClick={handleSaveProductMaster}>Save Product</Button> : null}
                        </div>
                        <div className="mt-4 grid gap-4 md:grid-cols-2">
                          <div>
                            <div className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">Product Name</div>
                            <Input
                              value={productMasterEditor.productName}
                              onChange={(event) =>
                                setProductMasterEditor((current) => ({ ...current, productName: event.target.value }))
                              }
                              placeholder="Product name"
                            />
                          </div>
                          <div>
                            <div className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">Your Model#</div>
                            <Input
                              value={productMasterEditor.customerModelNo}
                              onChange={(event) =>
                                setProductMasterEditor((current) => ({ ...current, customerModelNo: event.target.value }))
                              }
                              placeholder="Your model number"
                            />
                          </div>
                          <div>
                            <div className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">COSUN Model#</div>
                            <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-900">
                              {selectedProduct.supplierModelNo || 'Awaiting assignment from COSUN'}
                            </div>
                          </div>
                          <div>
                            <div className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">Unit</div>
                            <Input
                              value={productMasterEditor.unit}
                              onChange={(event) =>
                                setProductMasterEditor((current) => ({ ...current, unit: event.target.value }))
                              }
                              placeholder="pcs"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <div className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">Description</div>
                            <Textarea
                              value={productMasterEditor.description}
                              onChange={(event) =>
                                setProductMasterEditor((current) => ({ ...current, description: event.target.value }))
                              }
                              rows={6}
                              placeholder="Describe the product, key specs, and the customer-facing details you want to reuse."
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
                          <div className="text-sm font-semibold text-slate-900">Asset Identity</div>
                          <div className="mt-4 grid gap-3 text-sm text-slate-700">
                            <div>Type: {formatProductTypeLabel(selectedProduct)}</div>
                            <div>Saved from: {formatCustomerFacingSource(selectedProduct)}</div>
                            <div>Asset source: {formatAssetSourceType(selectedProduct.assetSourceType)}</div>
                            <div>Master link: {formatMasterLinkLabel(selectedProduct)}</div>
                            <div>Mapping: {formatMappingStatusLabel(selectedProduct)}</div>
                            <div>
                              {selectedProduct.isProjectBased
                                ? `Current revision: ${selectedProduct.currentRevisionCode || '-'}`
                                : `Current package: ${formatCurrentPackageLabel(selectedProduct)}`}
                            </div>
                            <div>Files saved: {selectedCurrentVersionFiles.length}</div>
                            <div>{formatAttachmentSummaryLine(selectedProduct)}</div>
                            <div>Ready for inquiry: {formatInquiryReadyLabel(selectedProduct)}</div>
                            <div>{formatCurrentPackageHelper(selectedProduct)}</div>
                          </div>
                        </div>

                        <div className="rounded-lg border border-slate-200 bg-white p-5">
                          <div className="text-sm font-semibold text-slate-900">Lifecycle</div>
                          <div className="mt-4 grid gap-3 text-sm text-slate-700">
                            <div>Latest inquiry: {selectedProduct.lastInquiryNumber || '-'}</div>
                            <div>Latest quotation: {selectedProduct.lastQuotationNumber || '-'}</div>
                            <div>Latest order: {selectedProduct.lastOrderNumber || '-'}</div>
                            <div>Usage count: {selectedProduct.usageCount}</div>
                            {selectedProduct.isProjectBased ? (
                              <div>Final revision: {selectedProduct.finalRevisionCode || 'Not locked yet'}</div>
                            ) : null}
                          </div>
                          <div className="mt-5 grid gap-2">
                            <Button variant="outline" className="justify-start" onClick={() => setDetailTab('package')}>
                              Open Technical Package
                            </Button>
                            {selectedProduct.isProjectBased ? (
                              <Button variant="outline" className="justify-start" onClick={() => setDetailTab('revisions')}>
                                Open Revision Manager
                              </Button>
                            ) : null}
                            <Button variant="outline" className="justify-start" onClick={() => setDetailTab('commercial')}>
                              Review Quotes & Orders
                            </Button>
                            <Button className="justify-start" onClick={handleUseInInquiry}>
                              Use in Inquiry
                            </Button>
                          </div>
                        </div>

                        <div className="rounded-lg border border-slate-200 bg-white p-5">
                          <div className="text-sm font-semibold text-slate-900">Mapping & Snapshot</div>
                          <div className="mt-4 grid gap-3 text-sm text-slate-700">
                            <div>Internal model: {selectedProduct.masterRef?.internalModelNo || 'Not linked yet'}</div>
                            <div>Master status: {selectedProduct.masterRef?.isResolved ? 'Resolved' : 'Pending link'}</div>
                            <div>Mapping status: {formatMappingStatusLabel(selectedProduct)}</div>
                            <div>Frozen files: {selectedAttachmentSummary?.attachmentCount ?? selectedCurrentVersionFiles.length}</div>
                            <div>Manifest rows: {selectedFileManifest.length}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="package" className="mt-4">
                    <input
                      ref={packageFileInputRef}
                      type="file"
                      multiple
                      onChange={handlePackageFilesSelected}
                      className="hidden"
                    />
                    <div className="space-y-4">
                      <div className="rounded-[24px] border border-slate-200 bg-[linear-gradient(135deg,#ffffff_0%,#f8fafc_45%,#eef2ff_100%)] p-5">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div>
                            <div className="text-sm font-semibold text-slate-950">
                              {selectedProduct.isProjectBased ? 'Revision Package Workspace' : 'Technical Package Workspace'}
                            </div>
                            <div className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
                              {selectedProduct.isProjectBased
                                ? 'Manage the active revision package, review the versioned history, and preview the frozen snapshot before this asset enters inquiry.'
                                : 'Manage the current package, review versioned package history, and preview the frozen snapshot that will travel into inquiry.'}
                            </div>
                          </div>
                          <div className="grid gap-3 sm:grid-cols-3">
                            <div className="rounded-2xl border border-white/70 bg-white/85 px-4 py-3 shadow-sm">
                              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                                Current Release
                              </div>
                              <div className="mt-2 text-sm font-semibold text-slate-900">
                                {selectedProduct.isProjectBased
                                  ? `Revision ${selectedProduct.currentRevisionCode || '-'}`
                                  : `Package V${selectedProduct.packageVersion || 1}`}
                              </div>
                            </div>
                            <div className="rounded-2xl border border-white/70 bg-white/85 px-4 py-3 shadow-sm">
                              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                                Files
                              </div>
                              <div className="mt-2 text-sm font-semibold text-slate-900">
                                {selectedCurrentVersionFiles.length} saved
                              </div>
                            </div>
                            <div className="rounded-2xl border border-white/70 bg-white/85 px-4 py-3 shadow-sm">
                              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                                Snapshot
                              </div>
                              <div className="mt-2 text-sm font-semibold text-slate-900">
                                {selectedProduct.isProjectBased ? 'Revision preview ready' : 'Package preview ready'}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
                        <div className="rounded-lg border border-slate-200 bg-white p-5">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                                <FileStack className="h-4 w-4 text-slate-500" />
                                {selectedProduct.isProjectBased ? 'Revision Workspace' : 'Package Workspace'}
                              </div>
                              <div className="mt-1 text-xs text-slate-500">
                                {selectedProduct.isProjectBased
                                  ? 'Edit the current revision summary, revision note, and active technical package files.'
                                  : 'Edit the current package summary, package note, and active technical package files.'}
                              </div>
                            </div>
                            {selectedProduct.manualRecord ? (
                              <Button size="sm" onClick={handleSaveCurrentPackage}>
                                Save {selectedProduct.isProjectBased ? 'Revision' : 'Package'}
                              </Button>
                            ) : null}
                          </div>
                          <div className="mt-4 grid gap-4 md:grid-cols-2">
                            <div>
                              <div className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                                {selectedProduct.isProjectBased ? 'Revision Summary' : 'Package Summary'}
                              </div>
                              <Textarea
                                value={packageEditor.description}
                                onChange={(event) =>
                                  setPackageEditor((current) => ({
                                    ...current,
                                    description: event.target.value,
                                  }))
                                }
                                rows={6}
                                placeholder={
                                  selectedProduct.isProjectBased
                                    ? 'Summarize what has changed in this revision and what this quote should follow.'
                                    : 'Summarize the current package so this product can be reused without re-entering the same details.'
                                }
                              />
                            </div>
                            <div>
                              <div className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                                {selectedProduct.isProjectBased ? 'Revision Note' : 'Package Note'}
                              </div>
                              <Textarea
                                value={packageEditor.packageNote}
                                onChange={(event) =>
                                  setPackageEditor((current) => ({
                                    ...current,
                                    packageNote: event.target.value,
                                  }))
                                }
                                rows={6}
                                placeholder={
                                  selectedProduct.isProjectBased
                                    ? 'Record customer-facing notes for the current revision.'
                                    : 'Record package notes or customer-facing technical notes.'
                                }
                              />
                            </div>
                          </div>
                        </div>

                        <div className="rounded-lg border border-slate-200 bg-white p-5">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <div className="text-sm font-semibold text-slate-900">
                                {selectedProduct.isProjectBased ? 'Revision Package Manager' : 'Package Manager'}
                              </div>
                              <div className="mt-1 text-xs text-slate-500">
                                Review versioned history, preview the selected snapshot, and create the next release when needed.
                              </div>
                            </div>
                            {selectedProduct.manualRecord ? (
                              <Button variant="outline" size="sm" onClick={handleCreateNextStage}>
                                <GitBranchPlus className="mr-1 h-4 w-4" />
                                {selectedProduct.isProjectBased ? 'Create Next Revision' : 'Create Package Update'}
                              </Button>
                            ) : null}
                          </div>
                          <div className="mt-4 space-y-3">
                            {(selectedProduct.isProjectBased ? selectedProjectRevisions : selectedProductVersions).map((pkg: any) => (
                              <div
                                key={`${selectedProduct.id}-${selectedProduct.isProjectBased ? pkg.revisionId : pkg.versionLabel}`}
                                role="button"
                                tabIndex={0}
                                onClick={() => {
                                  if (selectedProduct.isProjectBased) {
                                    setSelectedRevisionPreviewId(pkg.revisionId);
                                    setDetailTab('package');
                                    return;
                                  }
                                  setSelectedPackagePreviewVersion(pkg.version);
                                  setDetailTab('package');
                                }}
                                onKeyDown={(event) => {
                                  if (event.key !== 'Enter' && event.key !== ' ') return;
                                  event.preventDefault();
                                  if (selectedProduct.isProjectBased) {
                                    setSelectedRevisionPreviewId(pkg.revisionId);
                                    setDetailTab('package');
                                    return;
                                  }
                                  setSelectedPackagePreviewVersion(pkg.version);
                                  setDetailTab('package');
                                }}
                                className={`rounded-lg border p-3 transition ${
                                  selectedProduct.isProjectBased
                                    ? selectedRevisionPreviewId === pkg.revisionId
                                      ? 'border-slate-900 bg-slate-900 text-white'
                                      : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                                    : selectedPackagePreviewVersion === pkg.version
                                      ? 'border-slate-900 bg-slate-900 text-white'
                                      : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <div className={`text-sm font-semibold ${selectedProduct.isProjectBased
                                      ? selectedRevisionPreviewId === pkg.revisionId
                                        ? 'text-white'
                                        : 'text-slate-900'
                                      : selectedPackagePreviewVersion === pkg.version
                                        ? 'text-white'
                                        : 'text-slate-900'}`}>
                                      {selectedProduct.isProjectBased ? `Revision ${pkg.revisionCode}` : pkg.versionLabel}
                                    </div>
                                    <div className={`mt-1 text-xs ${selectedProduct.isProjectBased
                                      ? selectedRevisionPreviewId === pkg.revisionId
                                        ? 'text-slate-200'
                                        : 'text-slate-500'
                                      : selectedPackagePreviewVersion === pkg.version
                                        ? 'text-slate-200'
                                        : 'text-slate-500'}`}>
                                      {selectedProduct.isProjectBased ? formatRevisionStatusLabel(pkg.revisionStatus) : pkg.statusLabel}
                                    </div>
                                  </div>
                                  <Badge
                                    variant="secondary"
                                    className={selectedProduct.isProjectBased
                                      ? selectedRevisionPreviewId === pkg.revisionId
                                        ? 'bg-white/15 text-white'
                                        : 'bg-white text-slate-700'
                                      : selectedPackagePreviewVersion === pkg.version
                                        ? 'bg-white/15 text-white'
                                        : 'bg-white text-slate-700'}
                                  >
                                    {selectedProduct.isProjectBased ? 'Revision snapshot' : 'Package snapshot'}
                                  </Badge>
                                </div>
                                <div className={`mt-3 text-sm ${selectedProduct.isProjectBased
                                  ? selectedRevisionPreviewId === pkg.revisionId
                                    ? 'text-slate-100'
                                    : 'text-slate-700'
                                  : selectedPackagePreviewVersion === pkg.version
                                    ? 'text-slate-100'
                                    : 'text-slate-700'}`}>{pkg.summary}</div>
                                <div className={`mt-2 text-xs ${selectedProduct.isProjectBased
                                  ? selectedRevisionPreviewId === pkg.revisionId
                                    ? 'text-slate-200'
                                    : 'text-slate-500'
                                  : selectedPackagePreviewVersion === pkg.version
                                    ? 'text-slate-200'
                                    : 'text-slate-500'}`}>Updated: {formatDateTime(pkg.updatedAt)}</div>
                                <div className={`mt-2 text-xs ${selectedProduct.isProjectBased
                                  ? selectedRevisionPreviewId === pkg.revisionId
                                    ? 'text-slate-200'
                                    : 'text-slate-500'
                                  : selectedPackagePreviewVersion === pkg.version
                                    ? 'text-slate-200'
                                    : 'text-slate-500'}`}>
                                  Notes: {pkg.notes || 'No note saved for this snapshot.'}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
                        <div className="rounded-lg border border-slate-200 bg-white p-5">
                          <div className="text-sm font-semibold text-slate-900">
                            {selectedProduct.isProjectBased ? 'Revision Snapshot Preview' : 'Package Snapshot Preview'}
                          </div>
                          <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
                            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                              {selectedProduct.isProjectBased
                                ? `Revision ${(selectedRevisionPreview?.revisionCode || selectedProduct.currentRevisionCode || '-')}`
                                : (selectedPackagePreview?.versionLabel || 'Current Package')}
                            </div>
                            <div className="mt-3 text-sm font-medium text-slate-900">
                              {selectedProduct.isProjectBased
                                ? (selectedRevisionPreview?.summary || selectedProduct.description || 'No revision summary saved yet.')
                                : (selectedPackagePreview?.summary || selectedProduct.description || 'No package summary saved yet.')}
                            </div>
                            <div className="mt-3 text-sm text-slate-600">
                              {selectedProduct.isProjectBased
                                ? (selectedRevisionPreview?.notes || 'No revision note saved yet.')
                                : (selectedPackagePreview?.notes || 'No package note saved yet.')}
                            </div>
                            <div className="mt-4 grid gap-2 text-xs text-slate-500">
                              <div>Status: {selectedProduct.isProjectBased ? formatRevisionStatusLabel(selectedRevisionPreview?.revisionStatus) : selectedPackagePreview?.statusLabel || '-'}</div>
                              <div>Files in snapshot: {selectedProduct.isProjectBased ? selectedRevisionPreview?.files.length || 0 : selectedPackagePreview?.files.length || 0}</div>
                              <div>Updated: {formatDateTime(selectedProduct.isProjectBased ? selectedRevisionPreview?.updatedAt : selectedPackagePreview?.updatedAt)}</div>
                            </div>
                          </div>
                        </div>

                        <div className="rounded-lg border border-slate-200 bg-white p-5">
                          <div className="text-sm font-semibold text-slate-900">
                            {selectedProduct.isProjectBased ? 'Revision Snapshot Files' : 'Package Snapshot Files'}
                          </div>
                          {((selectedProduct.isProjectBased ? selectedRevisionPreview?.files : selectedPackagePreview?.files) || []).length === 0 ? (
                            <div className="mt-4 rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                              No files are stored in this snapshot yet.
                            </div>
                          ) : (
                            <div className="mt-4 space-y-3">
                              {((selectedProduct.isProjectBased ? selectedRevisionPreview?.files : selectedPackagePreview?.files) || []).map((file) => (
                                <div key={file.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                                  <div className="text-sm font-semibold text-slate-900">{file.fileName}</div>
                                  <div className="mt-1 text-sm text-slate-700">{file.description || 'No description saved for this file.'}</div>
                                  <div className="mt-1 text-xs text-slate-500">
                                    {file.customerPartNumber ? `Customer file#: ${file.customerPartNumber}` : 'No customer file number'}
                                    {file.fileType ? ` · ${file.fileType}` : ''}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
                        <div className="rounded-lg border border-slate-200 bg-white p-5">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                              <Paperclip className="h-4 w-4 text-slate-500" />
                              Files Workspace Handoff
                            </div>
                            <Button variant="outline" size="sm" onClick={() => setDetailTab('files')}>
                              Open Files Tab
                            </Button>
                          </div>
                          <div className="mt-4 grid gap-2 text-sm text-slate-700">
                            <div>Current saved files: {packageEditor.files.length}</div>
                            <div>Frozen file summary: {formatAttachmentSummaryLine(selectedProduct)}</div>
                            <div>Manifest rows: {selectedFileManifest.length}</div>
                          </div>
                        </div>

                        <div className="rounded-lg border border-slate-200 bg-white p-5">
                          <div className="text-sm font-semibold text-slate-900">Snapshot Handoff</div>
                          <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                            {selectedProduct.isProjectBased
                              ? 'This revision workspace owns the active technical package. Use the Files tab for file register editing and manifest review.'
                              : 'This package workspace owns the active technical package. Use the Files tab for file register editing and manifest review.'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {selectedProduct.isProjectBased ? (
                    <TabsContent value="revisions" className="mt-4">
                      <div className="space-y-4">
                        <div className="rounded-[24px] border border-slate-200 bg-[linear-gradient(135deg,#ffffff_0%,#f8fafc_45%,#eef2ff_100%)] p-5">
                          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div>
                              <div className="text-sm font-semibold text-slate-950">Revision Manager</div>
                              <div className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
                                Control current revision, review the full history, and lock a final revision before launching this project asset into inquiry.
                              </div>
                            </div>
                            <div className="grid gap-3 sm:grid-cols-3">
                              <div className="rounded-2xl border border-white/70 bg-white/85 px-4 py-3 shadow-sm">
                                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                                  Current Revision
                                </div>
                                <div className="mt-2 text-sm font-semibold text-slate-900">
                                  {selectedProduct.currentRevisionCode || '-'}
                                </div>
                              </div>
                              <div className="rounded-2xl border border-white/70 bg-white/85 px-4 py-3 shadow-sm">
                                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                                  Final Revision
                                </div>
                                <div className="mt-2 text-sm font-semibold text-slate-900">
                                  {selectedProduct.finalRevisionCode || 'Not locked'}
                                </div>
                              </div>
                              <div className="rounded-2xl border border-white/70 bg-white/85 px-4 py-3 shadow-sm">
                                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                                  History
                                </div>
                                <div className="mt-2 text-sm font-semibold text-slate-900">
                                  {selectedProjectRevisions.length} revision{selectedProjectRevisions.length === 1 ? '' : 's'}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
                          <div className="rounded-lg border border-slate-200 bg-white p-5">
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <div className="text-sm font-semibold text-slate-900">Revision Timeline</div>
                                <div className="mt-1 text-xs text-slate-500">
                                  Pick a revision to review the workflow, compare the snapshot, and create the next revision when the package changes.
                                </div>
                              </div>
                              {selectedProduct.manualRecord ? (
                                <Button variant="outline" size="sm" onClick={handleCreateNextStage}>
                                  <GitBranchPlus className="mr-1 h-4 w-4" />
                                  Create Next Revision
                                </Button>
                              ) : null}
                            </div>
                            <div className="mt-4 space-y-3">
                              {selectedProjectRevisions.map((revision) => {
                                const isActiveRevision = selectedRevisionPreviewId === revision.revisionId;
                                const isFinalRevision = selectedProduct.finalRevisionId === revision.revisionId;
                                return (
                                  <button
                                    key={revision.revisionId}
                                    type="button"
                                    onClick={() => setSelectedRevisionPreviewId(revision.revisionId)}
                                    className={`w-full rounded-lg border p-3 text-left transition ${
                                      isActiveRevision
                                        ? 'border-slate-900 bg-slate-900 text-white'
                                        : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                                    }`}
                                  >
                                    <div className="flex items-start justify-between gap-3">
                                      <div>
                                        <div className={`text-sm font-semibold ${isActiveRevision ? 'text-white' : 'text-slate-900'}`}>
                                          Revision {revision.revisionCode}
                                        </div>
                                        <div className={`mt-1 text-xs ${isActiveRevision ? 'text-slate-200' : 'text-slate-500'}`}>
                                          {formatRevisionStatusLabel(revision.revisionStatus)}
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        {isFinalRevision ? (
                                          <Badge className={isActiveRevision ? 'bg-white/15 text-white' : 'bg-white text-slate-700'}>
                                            Final Revision
                                          </Badge>
                                        ) : null}
                                        <Badge className={isActiveRevision ? 'bg-white/15 text-white' : 'bg-white text-slate-700'}>
                                          {revision.files.length} file{revision.files.length === 1 ? '' : 's'}
                                        </Badge>
                                      </div>
                                    </div>
                                    <div className={`mt-3 text-sm ${isActiveRevision ? 'text-slate-100' : 'text-slate-700'}`}>
                                      {revision.summary}
                                    </div>
                                    <div className={`mt-2 text-xs ${isActiveRevision ? 'text-slate-200' : 'text-slate-500'}`}>
                                      Updated: {formatDateTime(revision.updatedAt)}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div className="rounded-lg border border-slate-200 bg-white p-5">
                              <div className="flex items-center justify-between gap-3">
                                <div>
                                  <div className="text-sm font-semibold text-slate-900">
                                    Revision Workflow Control
                                  </div>
                                  <div className="mt-1 text-xs text-slate-500">
                                    Current revision: {selectedProduct.currentRevisionCode || '-'} · Final revision: {selectedProduct.finalRevisionCode || 'Not locked yet'}
                                  </div>
                                </div>
                                <Button
                                  onClick={handleSetFinalRevision}
                                  disabled={!selectedProduct.manualRecord || !selectedRevisionPreview || selectedProduct.finalRevisionId === selectedRevisionPreview?.revisionId}
                                >
                                  Set Final Revision
                                </Button>
                              </div>

                              <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
                                <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Selected Revision</div>
                                <div className="mt-2 text-sm font-semibold text-slate-900">
                                  Revision {selectedRevisionPreview?.revisionCode || '-'}
                                </div>
                                <div className="mt-1 text-sm text-slate-600">
                                  {selectedRevisionPreview?.summary || 'No revision summary saved yet.'}
                                </div>
                              </div>

                              <div className="mt-4 grid gap-4 md:grid-cols-2">
                                <div>
                                  <Label className="text-xs font-medium uppercase tracking-wide text-slate-500">Revision Status Workflow</Label>
                                  <Select
                                    value={selectedRevisionStatus}
                                    onValueChange={(value) => setSelectedRevisionStatus(value as ProjectRevisionView['revisionStatus'])}
                                  >
                                    <SelectTrigger className="mt-2">
                                      <SelectValue placeholder="Select revision status" />
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
                                <div className="flex items-end">
                                  <Button
                                    variant="outline"
                                    className="w-full"
                                    disabled={!selectedProduct.manualRecord || !selectedRevisionPreview}
                                    onClick={handleSaveRevisionWorkflow}
                                  >
                                    Save Revision Status
                                  </Button>
                                </div>
                              </div>

                              <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
                                <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Revision Note</div>
                                <div className="mt-2 text-sm text-slate-700">
                                  {selectedRevisionPreview?.notes || 'No revision note saved yet.'}
                                </div>
                              </div>
                            </div>

                            <div className="rounded-lg border border-slate-200 bg-white p-5">
                              <div className="text-sm font-semibold text-slate-900">Revision Snapshot Workspace</div>
                              {selectedRevisionPreview ? (
                                <div className="mt-4 space-y-4">
                                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                                    <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Summary</div>
                                    <div className="mt-2 text-sm text-slate-700">{selectedRevisionPreview.summary}</div>
                                  </div>
                                  {selectedRevisionPreview.files.length === 0 ? (
                                    <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                                      No files are stored in this revision yet.
                                    </div>
                                  ) : (
                                    <div className="space-y-3">
                                      {selectedRevisionPreview.files.map((file) => (
                                        <div key={file.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                                          <div className="text-sm font-semibold text-slate-900">{file.fileName}</div>
                                          <div className="mt-1 text-sm text-slate-700">
                                            {file.description || 'No description saved for this file.'}
                                          </div>
                                          <div className="mt-1 text-xs text-slate-500">
                                            {file.customerPartNumber ? `Customer file#: ${file.customerPartNumber}` : 'No customer file number'}
                                            {file.fileType ? ` · ${file.fileType}` : ''}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  ) : null}

                  <TabsContent value="files" className="mt-4">
                    <div className="space-y-4">
                      <div className="rounded-[24px] border border-slate-200 bg-[linear-gradient(135deg,#ffffff_0%,#f8fafc_45%,#eef2ff_100%)] p-5">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div>
                            <div className="text-sm font-semibold text-slate-950">Files Workspace</div>
                            <div className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
                              Review the active file register, maintain customer file metadata, and compare the current saved files with the frozen manifest snapshot.
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            {selectedProduct.manualRecord ? (
                              <Button variant="outline" size="sm" onClick={handlePickPackageFiles}>
                                <Upload className="mr-1 h-4 w-4" />
                                Upload Files
                              </Button>
                            ) : null}
                            {selectedProduct.manualRecord ? (
                              <Button variant="outline" size="sm" onClick={handleSaveCurrentPackage}>
                                Save Files
                              </Button>
                            ) : null}
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
                        <div className="rounded-lg border border-slate-200 bg-white p-5">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                              <Paperclip className="h-4 w-4 text-slate-500" />
                              File Register
                            </div>
                            <Badge variant="secondary" className="bg-slate-100 text-slate-700">
                              {packageEditor.files.length} file{packageEditor.files.length === 1 ? '' : 's'}
                            </Badge>
                          </div>

                          {packageEditor.files.length === 0 ? (
                            <div className="mt-4 rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                              No technical files saved yet. Add drawings, specs, or reference images here.
                            </div>
                          ) : (
                            <div className="mt-4 overflow-x-auto">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>File</TableHead>
                                    <TableHead>Customer File#</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead>File Type</TableHead>
                                    <TableHead>Updated</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {packageEditor.files.map((file) => (
                                    <TableRow key={file.id}>
                                      <TableCell>
                                        <div className="min-w-[220px]">
                                          <div className="font-medium text-slate-900">{file.fileName}</div>
                                          <div className="mt-1 text-xs text-slate-500">
                                            {file.fileSize ? `${Math.max(1, Math.round(file.fileSize / 1024))} KB` : 'Saved file'}
                                          </div>
                                        </div>
                                      </TableCell>
                                      <TableCell className="min-w-[180px]">
                                        <Input
                                          value={file.customerPartNumber || ''}
                                          onChange={(event) =>
                                            handleUpdateFileRegister(file.id, { customerPartNumber: event.target.value })
                                          }
                                          placeholder="Customer file number"
                                          className="h-8"
                                        />
                                      </TableCell>
                                      <TableCell className="min-w-[240px]">
                                        <Input
                                          value={file.description || ''}
                                          onChange={(event) =>
                                            handleUpdateFileRegister(file.id, { description: event.target.value })
                                          }
                                          placeholder="Describe this file"
                                          className="h-8"
                                        />
                                      </TableCell>
                                      <TableCell className="text-sm text-slate-700">{file.fileType || '-'}</TableCell>
                                      <TableCell className="text-sm text-slate-700">
                                        {formatDateTime(
                                          file.uploadedAt || (file.lastModified ? new Date(file.lastModified).toISOString() : null),
                                        )}
                                      </TableCell>
                                      <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                          {file.storageUrl ? (
                                            <a
                                              href={file.storageUrl}
                                              target="_blank"
                                              rel="noreferrer"
                                              className="inline-flex h-9 items-center rounded-md border border-slate-200 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                                            >
                                              Open
                                            </a>
                                          ) : null}
                                          {selectedProduct.manualRecord ? (
                                            <Button
                                              type="button"
                                              variant="outline"
                                              size="sm"
                                              onClick={() => handleRemovePackageFile(file.id)}
                                            >
                                              <Trash2 className="mr-1 h-4 w-4" />
                                              Remove
                                            </Button>
                                          ) : null}
                                        </div>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          )}
                        </div>

                        <div className="space-y-4">
                          <div className="rounded-lg border border-slate-200 bg-white p-5">
                            <div className="text-sm font-semibold text-slate-900">Frozen File Summary</div>
                            <div className="mt-4 grid gap-2 text-sm text-slate-700">
                              <div>{formatAttachmentSummaryLine(selectedProduct)}</div>
                              <div>Manifest rows: {selectedFileManifest.length}</div>
                              <div>Current saved files: {packageEditor.files.length}</div>
                            </div>
                          </div>

                          <div className="rounded-lg border border-slate-200 bg-white p-5">
                            <div className="text-sm font-semibold text-slate-900">Manifest Snapshot</div>
                            {selectedFileManifest.length === 0 ? (
                              <div className="mt-4 rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                                No frozen manifest rows are stored for this asset yet.
                              </div>
                            ) : (
                              <div className="mt-4 space-y-3">
                                {selectedFileManifest.map((file) => (
                                  <div key={file.fileIdOrToken} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                                    <div className="text-sm font-semibold text-slate-900">{file.fileNameSnapshot}</div>
                                    <div className="mt-1 text-sm text-slate-700">
                                      {file.descriptionSnapshot || 'No description saved for this snapshot file.'}
                                    </div>
                                    <div className="mt-1 text-xs text-slate-500">
                                      {file.customerPartNumber ? `Customer file#: ${file.customerPartNumber}` : 'No customer file number'}
                                      {file.fileType ? ` · ${file.fileType}` : ''}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="commercial" className="mt-4">
                    <div className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
                          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                            <Tag className="h-4 w-4 text-slate-500" />
                            Quotes
                          </div>
                          <div className="mt-4 grid gap-2 text-sm text-slate-700">
                            <div>Quotation count: {selectedProduct.quoteStats.count}</div>
                            <div>Latest price: {formatPrice(selectedProduct.quoteStats.lastPrice)}</div>
                            <div>Average price: {formatPrice(selectedProduct.quoteStats.averagePrice)}</div>
                            <div>Latest quotation: {selectedProduct.lastQuotationNumber || '-'}</div>
                          </div>
                        </div>
                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
                          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                            <ShoppingCart className="h-4 w-4 text-slate-500" />
                            Orders
                          </div>
                          <div className="mt-4 grid gap-2 text-sm text-slate-700">
                            <div>Order count: {selectedProduct.orderStats.count}</div>
                            <div>Latest price: {formatPrice(selectedProduct.orderStats.lastPrice)}</div>
                            <div>Average price: {formatPrice(selectedProduct.orderStats.averagePrice)}</div>
                            <div>Total ordered quantity: {selectedProduct.orderStats.totalOrderedQty}</div>
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-4 xl:grid-cols-2">
                        <div className="rounded-lg border border-slate-200 bg-white p-5">
                          <div className="text-sm font-semibold text-slate-900">Quotation Records</div>
                          {relatedQuotationRows.length === 0 ? (
                            <div className="mt-4 rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                              No quotations are linked to this product yet.
                            </div>
                          ) : (
                            <div className="mt-4 overflow-x-auto">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>QT</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Note</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {relatedQuotationRows.map((row) => (
                                    <TableRow key={row.id}>
                                      <TableCell className="font-medium text-slate-900">{row.number}</TableCell>
                                      <TableCell className="text-sm text-slate-700">{formatDateTime(row.date)}</TableCell>
                                      <TableCell className="text-sm text-slate-700">{row.status}</TableCell>
                                      <TableCell className="text-sm text-slate-700">{row.amountLabel}</TableCell>
                                      <TableCell className="text-sm text-slate-700">{row.note}</TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          )}
                        </div>

                        <div className="rounded-lg border border-slate-200 bg-white p-5">
                          <div className="text-sm font-semibold text-slate-900">Order Records</div>
                          {relatedOrderRows.length === 0 ? (
                            <div className="mt-4 rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                              No orders are linked to this product yet.
                            </div>
                          ) : (
                            <div className="mt-4 overflow-x-auto">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Order</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Note</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {relatedOrderRows.map((row) => (
                                    <TableRow key={row.id}>
                                      <TableCell className="font-medium text-slate-900">{row.number}</TableCell>
                                      <TableCell className="text-sm text-slate-700">{formatDateTime(row.date)}</TableCell>
                                      <TableCell className="text-sm text-slate-700">{row.status}</TableCell>
                                      <TableCell className="text-sm text-slate-700">{row.amountLabel}</TableCell>
                                      <TableCell className="text-sm text-slate-700">{row.note}</TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          )}
                        </div>
                      </div>

                      {selectedProduct.isProjectBased ? (
                        <div className="rounded-lg border border-slate-200 bg-white p-5">
                          <div className="flex items-center justify-between gap-3">
                            <div className="text-sm font-semibold text-slate-900">Project Revision Quote Trace</div>
                            <Badge variant="outline" className="text-xs">
                              {selectedProjectRevisionTrace.length} quotation(s)
                            </Badge>
                          </div>
                          {selectedProjectRevisionTrace.length === 0 ? (
                            <div className="mt-4 rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                              No quotations are linked to this revision yet.
                            </div>
                          ) : (
                            <div className="mt-4 overflow-x-auto">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>QT</TableHead>
                                    <TableHead>Revision</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Total Price</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Updated</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {selectedProjectRevisionTrace.map((trace) => (
                                    <TableRow key={trace.id}>
                                      <TableCell className="font-medium text-slate-900">{trace.qtNumber}</TableCell>
                                      <TableCell className="text-sm text-slate-700">{`Rev ${trace.revisionCode}`}</TableCell>
                                      <TableCell className="text-sm text-slate-700">{trace.quotationRole}</TableCell>
                                      <TableCell className="text-sm text-slate-700">{formatPrice(trace.totalPrice)}</TableCell>
                                      <TableCell className="text-sm text-slate-700">{`${trace.approvalStatus} · ${trace.customerStatus}`}</TableCell>
                                      <TableCell className="text-sm text-slate-700">{formatDateTime(trace.updatedAt)}</TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          )}
                        </div>
                      ) : null}
                    </div>
                  </TabsContent>

                  <TabsContent value="inquiry" className="mt-4">
                    <div className="space-y-4">
                      <div className="rounded-[24px] border border-slate-200 bg-[linear-gradient(135deg,#ffffff_0%,#f8fafc_45%,#eef2ff_100%)] p-5">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div>
                            <div className="text-sm font-semibold text-slate-950">Use in Inquiry Workspace</div>
                            <div className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
                              Confirm the package or revision, quantity, and notes before generating the inquiry snapshot from this product asset.
                            </div>
                          </div>
                          <div className="grid gap-3 sm:grid-cols-3">
                            <div className="rounded-2xl border border-white/70 bg-white/85 px-4 py-3 shadow-sm">
                              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                                Default Source
                              </div>
                              <div className="mt-2 text-sm font-semibold text-slate-900">
                                {selectedProduct.isProjectBased
                                  ? `Revision ${selectedProduct.finalRevisionCode || selectedProduct.currentRevisionCode || '-'}`
                                  : `Package V${selectedProduct.packageVersion || 1}`}
                              </div>
                            </div>
                            <div className="rounded-2xl border border-white/70 bg-white/85 px-4 py-3 shadow-sm">
                              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                                Files Included
                              </div>
                              <div className="mt-2 text-sm font-semibold text-slate-900">
                                {selectedCurrentVersionFiles.length}
                              </div>
                            </div>
                            <div className="rounded-2xl border border-white/70 bg-white/85 px-4 py-3 shadow-sm">
                              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                                Next Usage Count
                              </div>
                              <div className="mt-2 text-sm font-semibold text-slate-900">
                                {selectedProduct.usageCount + 1}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-4 xl:grid-cols-2">
                        <div className="rounded-lg border border-slate-200 bg-white p-5">
                          <div className="text-sm font-semibold text-slate-900">Inquiry Readiness</div>
                          <div className="mt-4 grid gap-3 text-sm text-slate-700">
                            <div>Product: {selectedProduct.productName}</div>
                            <div>Your model#: {selectedProduct.customerModelNo || '-'}</div>
                            <div>COSUN model#: {selectedProduct.supplierModelNo || 'Pending assignment'}</div>
                            <div>
                              {selectedProduct.isProjectBased
                                ? `Revision used: ${selectedProduct.currentRevisionCode || '-'}`
                                : `Package used: ${formatCurrentPackageLabel(selectedProduct)}`}
                            </div>
                            <div>Files included: {selectedCurrentVersionFiles.length}</div>
                            <div>Unit: {selectedProduct.unit || 'pcs'}</div>
                          </div>
                          <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
                            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Default Selector Rule</div>
                            <div className="mt-2 text-sm text-slate-700">
                              {selectedProduct.isProjectBased
                                ? `Use in Inquiry will default to ${selectedProduct.finalRevisionCode ? `Final Revision ${selectedProduct.finalRevisionCode}` : `Current Revision ${selectedProduct.currentRevisionCode || '-'}`}, then ask for quantity and notes before generating the inquiry snapshot.`
                                : `Use in Inquiry will ask you to choose a package version, quantity, and notes before generating the inquiry snapshot.`}
                            </div>
                          </div>
                          <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
                            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                              Frozen File Summary
                            </div>
                            <div className="mt-2 text-sm text-slate-700">
                              {formatAttachmentSummaryLine(selectedProduct)}
                            </div>
                            <div className="mt-2 text-xs text-slate-500">
                              Manifest rows stored: {selectedFileManifest.length}
                            </div>
                          </div>
                        </div>

                        <div className="rounded-lg border border-slate-200 bg-white p-5">
                          <div className="text-sm font-semibold text-slate-900">Snapshot File Coverage</div>
                          {selectedCurrentVersionFiles.length === 0 ? (
                            <div className="mt-4 rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                              No files attached yet. You can still use the saved product summary in inquiry.
                            </div>
                          ) : (
                            <div className="mt-4 space-y-3">
                              {selectedCurrentVersionFiles.map((file) => (
                                <div key={file.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                                  <div className="text-sm font-semibold text-slate-900">{file.fileName}</div>
                                  <div className="mt-1 text-sm text-slate-700">
                                    {file.description || 'No description saved for this file.'}
                                  </div>
                                  <div className="mt-1 text-xs text-slate-500">
                                    {file.customerPartNumber ? `Customer file#: ${file.customerPartNumber}` : 'No customer file number'}
                                    {file.fileType ? ` · ${file.fileType}` : ''}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
                        <div className="rounded-lg border border-slate-200 bg-white p-5">
                          <div className="text-sm font-semibold text-slate-900">Recent Asset Usage</div>
                          {recentUsageRows.length === 0 ? (
                            <div className="mt-4 rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                              This product has not been used in inquiry, quotation, or order documents yet.
                            </div>
                          ) : (
                            <div className="mt-4 space-y-3">
                              {recentUsageRows.map((row: any, index) => (
                                <div key={`${row.type}-${row.number}-${index}`} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                                  <div className="text-sm font-semibold text-slate-900">{row.type}</div>
                                  <div className="mt-1 text-sm text-slate-700">{row.number}</div>
                                  <div className="mt-1 text-xs text-slate-500">{row.detail}</div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="rounded-lg border border-slate-200 bg-white p-5">
                          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                              <div className="text-sm font-semibold text-slate-900">Inquiry Launch Workspace</div>
                              <div className="mt-1 text-sm text-slate-500">
                                Choose package or revision, quantity, and notes first. Then we prepare the inquiry snapshot and open the inquiry workspace.
                              </div>
                            </div>
                            <Button onClick={handleUseInInquiry}>Open Use in Inquiry Selector</Button>
                          </div>
                          <div className="mt-4 grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                            <div>Selected product: {selectedProduct.productName}</div>
                            <div>
                              {selectedProduct.isProjectBased
                                ? `Default revision: ${selectedProduct.finalRevisionCode || selectedProduct.currentRevisionCode || '-'}`
                                : `Default package: V${selectedProduct.packageVersion || 1}`}
                            </div>
                            <div>Technical files included: {selectedCurrentVersionFiles.length}</div>
                            <div>Target page: Inquiry Management</div>
                            <div>Usage count after selection: {selectedProduct.usageCount + 1}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog
        open={isInquirySelectorOpen && !!inquirySelectionProduct}
        onOpenChange={(open) => {
          setIsInquirySelectorOpen(open);
          if (!open) {
            setInquirySelectionProduct(null);
          }
        }}
      >
        <DialogContent className="max-w-5xl overflow-hidden">
          {inquirySelectionProduct ? (
            <>
              <DialogHeader className="-mx-6 -mt-6 border-b border-slate-200 bg-[linear-gradient(135deg,#ffffff_0%,#f8fafc_45%,#eef2ff_100%)] px-6 py-6">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className="bg-white text-slate-700 shadow-sm">
                      Inquiry Snapshot Selector
                    </Badge>
                    <Badge variant="secondary" className="bg-white text-slate-700 shadow-sm">
                      {inquirySelectionProduct.isProjectBased ? 'Revision Source' : 'Package Source'}
                    </Badge>
                  </div>
                  <DialogTitle className="text-2xl font-semibold tracking-tight text-slate-950">
                    Use {inquirySelectionProduct.productName} in Inquiry
                  </DialogTitle>
                  <div className="grid gap-3 md:grid-cols-4">
                    <div className="rounded-2xl border border-white/70 bg-white/85 px-4 py-3 shadow-sm">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Your Model#</div>
                      <div className="mt-2 text-sm font-semibold text-slate-900">{inquirySelectionProduct.customerModelNo || '-'}</div>
                    </div>
                    <div className="rounded-2xl border border-white/70 bg-white/85 px-4 py-3 shadow-sm">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">COSUN Model#</div>
                      <div className="mt-2 text-sm font-semibold text-slate-900">{inquirySelectionProduct.supplierModelNo || 'Pending assignment'}</div>
                    </div>
                    <div className="rounded-2xl border border-white/70 bg-white/85 px-4 py-3 shadow-sm">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Ready Status</div>
                      <div className="mt-2 text-sm font-semibold text-slate-900">{formatInquiryReadyLabel(inquirySelectionProduct)}</div>
                    </div>
                    <div className="rounded-2xl border border-white/70 bg-white/85 px-4 py-3 shadow-sm">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Files</div>
                      <div className="mt-2 text-sm font-semibold text-slate-900">{inquirySelectionPreviewFiles.length}</div>
                    </div>
                  </div>
                </div>
              </DialogHeader>
              <div className="space-y-5 pt-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Asset Source</div>
                    <div className="mt-2 text-sm font-semibold text-slate-900">{inquirySelectionProduct.productName}</div>
                    <div className="mt-2 grid gap-2 text-sm text-slate-700">
                      <div>Your Model#: {inquirySelectionProduct.customerModelNo || '-'}</div>
                      <div>COSUN Model#: {inquirySelectionProduct.supplierModelNo || 'Pending assignment'}</div>
                      <div>Ready Status: {formatInquiryReadyLabel(inquirySelectionProduct)}</div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-white p-4">
                    <div className="text-sm font-semibold text-slate-900">Selector Inputs</div>
                    <div className="grid gap-4">
                      {inquirySelectionProduct.isProjectBased ? (
                        <div>
                          <Label className="text-xs font-medium uppercase tracking-wide text-slate-500">Select Revision</Label>
                          <Select
                            value={inquirySelection.revisionId}
                            onValueChange={(value) =>
                              setInquirySelection((current) => ({ ...current, revisionId: value }))
                            }
                          >
                            <SelectTrigger className="mt-2">
                              <SelectValue placeholder="Select revision" />
                            </SelectTrigger>
                            <SelectContent>
                              {inquirySelectionRevisions.map((revision) => (
                                <SelectItem key={revision.revisionId} value={revision.revisionId}>
                                  {`Revision ${revision.revisionCode} · ${formatRevisionStatusLabel(revision.revisionStatus)}`}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      ) : (
                        <div>
                          <Label className="text-xs font-medium uppercase tracking-wide text-slate-500">Select Package</Label>
                          <Select
                            value={inquirySelection.packageVersion}
                            onValueChange={(value) =>
                              setInquirySelection((current) => ({ ...current, packageVersion: value }))
                            }
                          >
                            <SelectTrigger className="mt-2">
                              <SelectValue placeholder="Select package version" />
                            </SelectTrigger>
                            <SelectContent>
                              {inquirySelectionVersions.map((pkg) => (
                                <SelectItem key={`${inquirySelectionProduct.id}-pkg-${pkg.version}`} value={String(pkg.version)}>
                                  {`${pkg.versionLabel} · ${pkg.statusLabel}`}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      <div>
                        <Label className="text-xs font-medium uppercase tracking-wide text-slate-500">Quantity</Label>
                        <Input
                          type="number"
                          min={1}
                          value={inquirySelection.quantity}
                          onChange={(event) =>
                            setInquirySelection((current) => ({ ...current, quantity: event.target.value }))
                          }
                          className="mt-2"
                        />
                      </div>

                      <div>
                        <Label className="text-xs font-medium uppercase tracking-wide text-slate-500">Notes</Label>
                        <Textarea
                          value={inquirySelection.notes}
                          onChange={(event) =>
                            setInquirySelection((current) => ({ ...current, notes: event.target.value }))
                          }
                          rows={4}
                          className="mt-2"
                          placeholder="Add customer-facing notes that should travel into the inquiry snapshot."
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-[0.9fr_1.1fr]">
                  <div className="rounded-lg border border-slate-200 bg-white p-4">
                    <div className="text-sm font-semibold text-slate-900">Snapshot Preview</div>
                    <div className="mt-4 grid gap-2 text-sm text-slate-700">
                      <div>
                        {inquirySelectionProduct.isProjectBased
                          ? `Revision: ${inquirySelectionRevisions.find((revision) => revision.revisionId === inquirySelection.revisionId)?.revisionCode || inquirySelectionProduct.currentRevisionCode || '-'}`
                          : `Package: ${inquirySelectionVersions.find((pkg) => String(pkg.version) === String(inquirySelection.packageVersion))?.versionLabel || `V${inquirySelectionProduct.packageVersion || 1}`}`}
                      </div>
                      <div>Quantity: {Math.max(1, Number.parseInt(inquirySelection.quantity || '1', 10) || 1)}</div>
                      <div>Files included: {inquirySelectionPreviewFiles.length}</div>
                      <div>Manifest rows: {inquirySelectionProduct.fileManifestSnapshot?.length || 0}</div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-white p-4">
                    <div className="text-sm font-semibold text-slate-900">Files that will travel with this inquiry</div>
                    {inquirySelectionPreviewFiles.length === 0 ? (
                      <div className="mt-4 rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                        No files are attached to the selected package or revision yet.
                      </div>
                    ) : (
                      <div className="mt-4 space-y-3">
                        {inquirySelectionPreviewFiles.map((file) => (
                          <div key={file.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                            <div className="text-sm font-semibold text-slate-900">{file.fileName}</div>
                            <div className="mt-1 text-sm text-slate-700">{file.description || 'No description saved for this file.'}</div>
                            <div className="mt-1 text-xs text-slate-500">
                              {file.customerPartNumber ? `Customer file#: ${file.customerPartNumber}` : 'No customer file number'}
                              {file.fileType ? ` · ${file.fileType}` : ''}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="-mx-6 -mb-6 flex items-center justify-end gap-3 border-t border-slate-200 bg-white px-6 py-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsInquirySelectorOpen(false);
                      setInquirySelectionProduct(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleConfirmUseInInquiry}>Generate Inquiry Snapshot</Button>
                </div>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <CreateProductFlow
        open={isCreateFlowOpen}
        mode="library"
        onOpenChange={setIsCreateFlowOpen}
        onComplete={handleCreateProductComplete}
      />
    </div>
  );
}
