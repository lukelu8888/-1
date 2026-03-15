import type { InquirySnapshotDraft, ProductMappingRef } from '../product-domain/types';
import { getInternalModelNo } from '../../utils/productModelDisplay';
import {
  buildAttachmentSummarySnapshot,
  buildFileManifestSnapshot,
  getSnapshotDisplayModelNo,
} from '../services/tradeProductSnapshotService';

type WebsiteCatalogSelectionContext = {
  regionCode?: string | null;
  categoryId?: string | null;
  subCategoryId?: string | null;
  productCategoryId?: string | null;
  quantity?: number | null;
  currency?: string | null;
};

const normalizeText = (value: unknown) => String(value || '').trim();

const toSpecSummary = (product: any) => {
  if (typeof product?.specifications === 'string') {
    return normalizeText(product.specifications);
  }

  if (product?.specifications && typeof product.specifications === 'object') {
    return Object.entries(product.specifications)
      .map(([key, value]) => `${key}: ${String(value || '').trim()}`)
      .join(', ');
  }

  return normalizeText(product?.specification || product?.description || '');
};

const toMappingRef = (product: any): ProductMappingRef | null => {
  const externalModelNo = normalizeText(product?.displayModelNo || product?.modelNo || product?.sku || '');
  if (!externalModelNo) return null;
  return {
    mappingId: null,
    mappingStatus: 'unmapped',
    externalModelNo,
    partyType: 'website',
  };
};

export const websiteCatalogAdapter = {
  toInquirySnapshotDraft(product: any, context: WebsiteCatalogSelectionContext = {}): InquirySnapshotDraft {
    const internalModelNo = normalizeText(getInternalModelNo(product));
    const specSummary = toSpecSummary(product);
    return {
      masterRef: {
        masterProductId: normalizeText(product?.masterProductId || product?.supplierProductId) || null,
        internalModelNo,
        isResolved: Boolean(product?.masterProductId || product?.supplierProductId || internalModelNo),
      },
      mappingRef: toMappingRef(product),
      sourceRef: {
        sourceLayer: 'website_product_catalog',
        sourceObjectId: normalizeText(product?.uniqueId || product?.id || product?.name || 'website-product'),
        sourceSnapshotId: null,
        sourceLabel: 'Website Catalog',
      },
      productName: normalizeText(product?.name || product?.productName || 'Unnamed Product'),
      displayModelNo: getSnapshotDisplayModelNo({
        masterRef: { internalModelNo },
        supplierModelNo: normalizeText(product?.sku || product?.modelNo || product?.id),
      }),
      customerModelNo: '',
      supplierModelNo: normalizeText(product?.sku || product?.modelNo || ''),
      description: specSummary,
      specSummary,
      imageUrl: normalizeText(product?.image || product?.imageUrl),
      unit: normalizeText(product?.unit || 'pcs') || 'pcs',
      itemType: 'standard_sourcing',
      regionCode: normalizeText(context.regionCode || product?.regionCode || 'NA') || 'NA',
      attachmentSummarySnapshot: buildAttachmentSummarySnapshot(null),
      fileManifestSnapshot: buildFileManifestSnapshot(null),
      oemRequirementSummary: '',
      oemDataSnapshot: null,
      requestedQuantity: Number(context.quantity || product?.quantity || 100) || 100,
      targetPrice: Number(product?.price || product?.targetPrice || 0) || 0,
      currency: normalizeText(context.currency || 'USD') || 'USD',
      selectedPackageVersionRef: null,
      selectedProjectRevisionRef: null,
      inquiryRequirementSummary: [
        normalizeText(context.categoryId),
        normalizeText(context.subCategoryId),
        normalizeText(context.productCategoryId),
      ]
        .filter(Boolean)
        .join(' / '),
    };
  },
};
