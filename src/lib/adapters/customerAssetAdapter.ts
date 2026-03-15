import type { ProductLibraryAsset } from '../productLibraryPortfolio';
import type { InquirySnapshotDraft, ProductMappingRef } from '../product-domain/types';
import {
  buildAttachmentSummarySnapshot,
  buildFileManifestSnapshot,
  buildOemRequirementSummary,
  getSnapshotDisplayModelNo,
} from '../services/tradeProductSnapshotService';

type CustomerAssetSelectionContext = {
  selectedPackageVersion?: {
    version?: number;
    oem?: any;
  } | null;
  selectedProjectRevision?: {
    revisionId?: string;
    revisionCode?: string;
    revisionStatus?: string;
    oem?: any;
  } | null;
  quantity?: number | null;
  currency?: string | null;
};

const normalizeText = (value: unknown) => String(value || '').trim();

const resolveMappingRef = (asset: ProductLibraryAsset): ProductMappingRef | null => {
  if (asset.mappingRef) return asset.mappingRef;
  if (!asset.customerModelNo && !asset.supplierModelNo) return null;
  return {
    mappingId: null,
    mappingStatus: asset.manualRecord?.mappingStatus === 'confirmed' ? 'confirmed' : 'pending',
    externalModelNo: asset.customerModelNo || asset.supplierModelNo || '',
    partyType: asset.customerModelNo ? 'customer' : 'supplier',
  };
};

export const customerAssetAdapter = {
  toInquirySnapshotDraft(
    asset: ProductLibraryAsset,
    selection: CustomerAssetSelectionContext = {},
  ): InquirySnapshotDraft {
    const record = asset.manualRecord;
    const selectedPackageVersion = selection.selectedPackageVersion || null;
    const selectedProjectRevision = selection.selectedProjectRevision || null;
    const resolvedOem = asset.isProjectBased
      ? (selectedProjectRevision?.oem || record?.oem || null)
      : (selectedPackageVersion?.oem || record?.oem || null);

    return {
      masterRef: asset.masterRef || {
        masterProductId: record?.supplierProductId || asset.supplierProductId || null,
        internalModelNo: asset.supplierModelNo || '',
        isResolved: Boolean(record?.supplierProductId || asset.supplierProductId),
      },
      mappingRef: resolveMappingRef(asset),
      sourceRef: {
        sourceLayer: 'customer_product_library',
        sourceObjectId: record?.id || asset.id,
        sourceSnapshotId: null,
        sourceLabel: 'My Products',
      },
      productName: asset.productName,
      displayModelNo: getSnapshotDisplayModelNo({
        masterRef: asset.masterRef,
        customerModelNo: asset.customerModelNo,
        supplierModelNo: asset.supplierModelNo,
      }),
      customerModelNo: asset.customerModelNo || '',
      supplierModelNo: asset.supplierModelNo || '',
      description: asset.description || '',
      specSummary: asset.description || '',
      imageUrl: asset.imageUrl || '',
      unit: asset.unit || 'pcs',
      itemType: asset.itemType,
      regionCode: record?.regionCode || 'NA',
      attachmentSummarySnapshot: asset.attachmentSummarySnapshot || buildAttachmentSummarySnapshot(resolvedOem),
      fileManifestSnapshot: asset.fileManifestSnapshot || buildFileManifestSnapshot(resolvedOem),
      oemRequirementSummary: buildOemRequirementSummary(resolvedOem),
      oemDataSnapshot: resolvedOem || null,
      requestedQuantity: Number(selection.quantity ?? record?.lastQuantity ?? 1) || 1,
      targetPrice: Number(record?.targetPrice || asset.quoteStats.lastPrice || asset.orderStats.lastPrice || 0) || 0,
      currency: normalizeText(selection.currency || 'USD') || 'USD',
      selectedPackageVersionRef: asset.isProjectBased
        ? null
        : normalizeText(selectedPackageVersion?.version) || normalizeText(asset.packageVersion) || null,
      selectedProjectRevisionRef: asset.isProjectBased
        ? normalizeText(selectedProjectRevision?.revisionId || asset.currentRevisionId) || null
        : null,
      inquiryRequirementSummary: asset.isProjectBased
        ? `Selected project revision ${normalizeText(selectedProjectRevision?.revisionCode || asset.currentRevisionCode) || '-'}`
        : `Selected package version ${normalizeText(selectedPackageVersion?.version || asset.packageVersion) || '1'}`,
    };
  },
};
