import { normalizeOemData, type InquiryOemData } from '../../types/oem';
import {
  buildDerivedSnapshotEnvelope,
  buildRootSnapshotEnvelope,
} from '../product-domain/snapshotId';
import type {
  AttachmentSummarySnapshot,
  FileManifestSnapshotEntry,
  InquirySnapshot,
  InquirySnapshotDraft,
  MasterProductRef,
  ProductMappingRef,
  OrderSnapshot,
  OrderSnapshotDraft,
  ProcurementSnapshot,
  ProcurementSnapshotDraft,
  ProductSnapshotBase,
  QuotationSnapshot,
  QuotationSnapshotDraft,
  SnapshotSourceLayer,
  SnapshotEnvelope,
  SourceRef,
} from '../product-domain/types';

const normalizeText = (value: unknown) => String(value || '').trim();
const normalizeNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};
const normalizeInteger = (value: unknown, fallback = 0) => {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};
const CUSTOMER_SOURCE_TYPES = new Set([
  'customer_created',
  'saved_from_website',
  'derived_from_inquiry',
  'derived_from_order',
  'assigned_by_cosun',
]);
const SNAPSHOT_SOURCE_LAYERS = new Set<SnapshotSourceLayer>([
  'website_product_catalog',
  'customer_product_library',
  'trade_product_library',
  'supply_chain_product_library',
  'manual_entry',
]);
const MAPPING_PARTY_TYPES = new Set(['customer', 'supplier', 'website', 'manual']);

const buildFingerprint = (input: {
  id?: unknown;
  fileName?: unknown;
  fileSize?: unknown;
  uploadedAt?: unknown;
}) =>
  [
    normalizeText(input.id),
    normalizeText(input.fileName),
    String(input.fileSize || 0),
    normalizeText(input.uploadedAt),
  ]
    .filter(Boolean)
    .join(':');

const buildBaseSnapshot = <T extends ProductSnapshotBase>(
  envelope: SnapshotEnvelope,
  draft: Omit<T, keyof SnapshotEnvelope>,
): T => ({
  ...draft,
  ...envelope,
} as T);

const normalizeSnapshotSourceLayer = (value: unknown): SnapshotSourceLayer | null => {
  const normalized = normalizeText(value) as SnapshotSourceLayer;
  return SNAPSHOT_SOURCE_LAYERS.has(normalized) ? normalized : null;
};

const inferSourceLayer = (product: Record<string, any>): SnapshotSourceLayer => {
  const explicit =
    normalizeSnapshotSourceLayer(product?.sourceRef?.sourceLayer) ||
    normalizeSnapshotSourceLayer(product?.inquirySnapshot?.sourceRef?.sourceLayer) ||
    normalizeSnapshotSourceLayer(product?.inquirySnapshotDraft?.sourceRef?.sourceLayer);
  if (explicit) return explicit;

  const source = normalizeText(product?.source || product?.addedFrom || '').toLowerCase();
  const sourceType = normalizeText(product?.sourceType).toLowerCase();
  if (source === 'website' || sourceType === 'saved_from_website') return 'website_product_catalog';
  if (source === 'history' || normalizeText(product?.originalInquiryId)) return 'trade_product_library';
  if (source === 'my_products' || CUSTOMER_SOURCE_TYPES.has(sourceType)) return 'customer_product_library';
  return 'manual_entry';
};

const inferCustomerSourceType = (product: Record<string, any>, sourceLayer: SnapshotSourceLayer) => {
  const explicit = normalizeText(product?.sourceType);
  if (CUSTOMER_SOURCE_TYPES.has(explicit)) return explicit;
  if (sourceLayer === 'website_product_catalog') return 'saved_from_website';
  if (sourceLayer === 'trade_product_library') return 'derived_from_inquiry';
  return 'customer_created';
};

const inferSourceLabel = (sourceLayer: SnapshotSourceLayer, product: Record<string, any>) => {
  if (normalizeText(product?.sourceRef?.sourceLabel)) return normalizeText(product.sourceRef.sourceLabel);
  if (normalizeText(product?.addedFrom)) return normalizeText(product.addedFrom);
  if (sourceLayer === 'website_product_catalog') return 'Website';
  if (sourceLayer === 'customer_product_library') return 'My Products';
  if (sourceLayer === 'trade_product_library') return 'History';
  return 'Manual Entry';
};

const buildSourceRef = (product: Record<string, any>): SourceRef => {
  const sourceLayer = inferSourceLayer(product);
  const existingSourceRef =
    product?.sourceRef ||
    product?.inquirySnapshot?.sourceRef ||
    product?.inquirySnapshotDraft?.sourceRef;
  return {
    sourceLayer,
    sourceObjectId:
      normalizeText(existingSourceRef?.sourceObjectId) ||
      normalizeText(product?.sourceProductId) ||
      normalizeText(product?.customerProductId) ||
      normalizeText(product?.originalInquiryId) ||
      normalizeText(product?.id) ||
      normalizeText(product?.productName) ||
      `product-${Math.random().toString(16).slice(2, 10)}`,
    sourceSnapshotId:
      normalizeText(existingSourceRef?.sourceSnapshotId) ||
      normalizeText(product?.inquirySnapshot?.snapshotId) ||
      null,
    sourceLabel: inferSourceLabel(sourceLayer, product),
  };
};

const buildMasterRef = (product: Record<string, any>): MasterProductRef | null => {
  const snapshotMasterRef = product?.inquirySnapshot?.masterRef || product?.inquirySnapshotDraft?.masterRef;
  const masterRef = product?.masterRef || snapshotMasterRef;
  const internalModelNo =
    normalizeText(masterRef?.internalModelNo) ||
    normalizeText(product?.internalModelNo) ||
    normalizeText(product?.supplierModelNo) ||
    normalizeText(product?.modelNo);

  if (!internalModelNo) return null;
  return {
    masterProductId: normalizeText(masterRef?.masterProductId) || null,
    internalModelNo,
    isResolved:
      Boolean(masterRef?.isResolved) ||
      Boolean(masterRef?.masterProductId) ||
      Boolean(product?.supplierProductId),
  };
};

const buildMappingRef = (product: Record<string, any>, sourceRef: SourceRef): ProductMappingRef | null => {
  const snapshotMappingRef = product?.inquirySnapshot?.mappingRef || product?.inquirySnapshotDraft?.mappingRef;
  const mappingRef = product?.mappingRef || snapshotMappingRef;
  const externalModelNo =
    normalizeText(mappingRef?.externalModelNo) ||
    normalizeText(product?.customerModelNo) ||
    normalizeText(product?.supplierModelNo) ||
    normalizeText(product?.modelNo);

  if (!externalModelNo) return null;

  const explicitPartyType = normalizeText(mappingRef?.partyType);
  const partyType =
    (MAPPING_PARTY_TYPES.has(explicitPartyType) ? explicitPartyType : null) ||
    (sourceRef.sourceLayer === 'website_product_catalog'
      ? 'website'
      : sourceRef.sourceLayer === 'manual_entry'
        ? 'manual'
        : 'customer');

  return {
    mappingId: normalizeText(mappingRef?.mappingId) || null,
    mappingStatus: mappingRef?.mappingStatus || (mappingRef?.mappingId ? 'confirmed' : 'pending'),
    externalModelNo,
    partyType: partyType as ProductMappingRef['partyType'],
  };
};

const snapshotMatchesDraft = (
  snapshot: InquirySnapshot | null | undefined,
  draft: InquirySnapshotDraft,
) => {
  if (!snapshot) return false;
  return (
    snapshot.productName === draft.productName &&
    snapshot.displayModelNo === draft.displayModelNo &&
    snapshot.customerModelNo === draft.customerModelNo &&
    snapshot.supplierModelNo === draft.supplierModelNo &&
    snapshot.description === draft.description &&
    snapshot.specSummary === draft.specSummary &&
    snapshot.imageUrl === draft.imageUrl &&
    snapshot.unit === draft.unit &&
    snapshot.itemType === draft.itemType &&
    snapshot.regionCode === draft.regionCode &&
    snapshot.requestedQuantity === draft.requestedQuantity &&
    snapshot.targetPrice === draft.targetPrice &&
    snapshot.currency === draft.currency &&
    snapshot.selectedPackageVersionRef === draft.selectedPackageVersionRef &&
    snapshot.selectedProjectRevisionRef === draft.selectedProjectRevisionRef &&
    snapshot.inquiryRequirementSummary === draft.inquiryRequirementSummary
  );
};

export const buildAttachmentSummarySnapshot = (
  oem?: InquiryOemData | null,
): AttachmentSummarySnapshot => {
  const normalized = normalizeOemData(oem || null);
  const fileTypeCounts: Record<string, number> = {};
  const deliveryScopeCounts: AttachmentSummarySnapshot['deliveryScopeCounts'] = {};

  normalized.files.forEach((file) => {
    const fileType = normalizeText(file.fileType || 'unknown');
    fileTypeCounts[fileType] = (fileTypeCounts[fileType] || 0) + 1;
    const deliveryScope = file.deliveryScope || 'sales_only';
    deliveryScopeCounts[deliveryScope] = (deliveryScopeCounts[deliveryScope] || 0) + 1;
  });

  const fileTypes = normalized.files.map((file) => normalizeText(file.fileType).toLowerCase());
  return {
    attachmentCount: normalized.files.length,
    fileTypeCounts,
    deliveryScopeCounts,
    hasDrawing: fileTypes.some((type) => type.includes('draw')),
    hasSpec: fileTypes.some((type) => type.includes('spec')),
    hasBom: fileTypes.some((type) => type.includes('bom')),
    hasPackaging: fileTypes.some((type) => type.includes('pack')),
    hasTestReport: fileTypes.some((type) => type.includes('test')),
    hasImage: fileTypes.some((type) => type.includes('image')),
    oemFileCount: normalized.files.length,
  };
};

export const buildFileManifestSnapshot = (
  oem?: InquiryOemData | null,
): FileManifestSnapshotEntry[] =>
  normalizeOemData(oem || null).files.map((file) => ({
    fileIdOrToken: normalizeText(file.id) || `snapshot-file-${Math.random().toString(16).slice(2, 10)}`,
    fileNameSnapshot: normalizeText(file.fileName),
    fileType: normalizeText(file.fileType || 'unknown'),
    mimeType: normalizeText(file.fileType || 'application/octet-stream'),
    fileSize: Number(file.fileSize || 0),
    checksumOrFingerprint: buildFingerprint(file),
    customerPartNumber: normalizeText(file.customerPartNumber),
    descriptionSnapshot: normalizeText(file.description),
    deliveryScope: file.deliveryScope || 'sales_only',
    sensitivityLevel: file.sensitivityLevel || 'normal',
    processingState: file.processingState || 'raw',
    uploadedAtSnapshot: normalizeText(file.uploadedAt) || null,
    storageRef: normalizeText(file.storageUrl || file.storagePath) || null,
  }));

export const buildOemRequirementSummary = (oem?: InquiryOemData | null) => {
  const normalized = normalizeOemData(oem || null);
  if (!normalized.enabled) return '';
  return normalizeText(normalized.overallRequirementNote);
};

export const getSnapshotDisplayModelNo = (input: {
  customerModelNo?: unknown;
  supplierModelNo?: unknown;
  masterRef?: { internalModelNo?: unknown } | null;
}) =>
  normalizeText(input.masterRef?.internalModelNo) ||
  normalizeText(input.supplierModelNo) ||
  normalizeText(input.customerModelNo) ||
  '-';

export const tradeProductSnapshotService = {
  buildInquirySnapshotDraftFromProductLine(product: Record<string, any>): InquirySnapshotDraft {
    const existingDraft = product?.inquirySnapshotDraft || null;
    const existingSnapshot = product?.inquirySnapshot || null;
    const sourceRef = buildSourceRef(product);
    const masterRef = existingDraft?.masterRef || existingSnapshot?.masterRef || buildMasterRef(product);
    const mappingRef = existingDraft?.mappingRef || existingSnapshot?.mappingRef || buildMappingRef(product, sourceRef);
    const customerModelNo =
      normalizeText(existingDraft?.customerModelNo) ||
      normalizeText(existingSnapshot?.customerModelNo) ||
      normalizeText(product?.customerModelNo);
    const supplierModelNo =
      normalizeText(existingDraft?.supplierModelNo) ||
      normalizeText(existingSnapshot?.supplierModelNo) ||
      normalizeText(product?.supplierModelNo) ||
      normalizeText(product?.modelNo) ||
      normalizeText(product?.internalModelNo);
    const oemDataSnapshot =
      product?.oem || existingDraft?.oemDataSnapshot || existingSnapshot?.oemDataSnapshot || null;
    const attachmentSummarySnapshot =
      existingDraft?.attachmentSummarySnapshot ||
      existingSnapshot?.attachmentSummarySnapshot ||
      product?.attachmentSummarySnapshot ||
      buildAttachmentSummarySnapshot(oemDataSnapshot);
    const fileManifestSnapshot =
      existingDraft?.fileManifestSnapshot ||
      existingSnapshot?.fileManifestSnapshot ||
      product?.fileManifestSnapshot ||
      buildFileManifestSnapshot(oemDataSnapshot);
    const description =
      normalizeText(existingDraft?.description) ||
      normalizeText(existingSnapshot?.description) ||
      normalizeText(product?.specifications) ||
      normalizeText(product?.specification) ||
      normalizeText(product?.description);
    const specSummary =
      normalizeText(existingDraft?.specSummary) ||
      normalizeText(existingSnapshot?.specSummary) ||
      description;
    const requestedQuantity =
      normalizeInteger(
        product?.quantity,
        normalizeInteger(
          existingDraft?.requestedQuantity,
          normalizeInteger(existingSnapshot?.requestedQuantity, 1),
        ),
      ) || 1;
    const targetPrice = normalizeNumber(
      product?.targetPrice ?? product?.unitPrice,
      normalizeNumber(
        existingDraft?.targetPrice,
        normalizeNumber(existingSnapshot?.targetPrice, 0),
      ),
    );

    return {
      masterRef,
      mappingRef,
      sourceRef,
      productName:
        normalizeText(existingDraft?.productName) ||
        normalizeText(existingSnapshot?.productName) ||
        normalizeText(product?.productName) ||
        normalizeText(product?.name) ||
        'Unnamed Product',
      displayModelNo:
        normalizeText(existingDraft?.displayModelNo) ||
        normalizeText(existingSnapshot?.displayModelNo) ||
        getSnapshotDisplayModelNo({
          customerModelNo,
          supplierModelNo,
          masterRef,
        }),
      customerModelNo,
      supplierModelNo,
      description,
      specSummary,
      imageUrl:
        normalizeText(existingDraft?.imageUrl) ||
        normalizeText(existingSnapshot?.imageUrl) ||
        normalizeText(product?.imageUrl) ||
        normalizeText(product?.image),
      unit:
        normalizeText(existingDraft?.unit) ||
        normalizeText(existingSnapshot?.unit) ||
        normalizeText(product?.unit) ||
        'pcs',
      itemType:
        existingDraft?.itemType ||
        existingSnapshot?.itemType ||
        (product?.itemType === 'oem_custom' || normalizeOemData(oemDataSnapshot).enabled
          ? 'oem_custom'
          : 'standard_sourcing'),
      regionCode:
        normalizeText(existingDraft?.regionCode) ||
        normalizeText(existingSnapshot?.regionCode) ||
        normalizeText(product?.regionCode) ||
        'NA',
      attachmentSummarySnapshot,
      fileManifestSnapshot,
      oemRequirementSummary:
        normalizeText(existingDraft?.oemRequirementSummary) ||
        normalizeText(existingSnapshot?.oemRequirementSummary) ||
        buildOemRequirementSummary(oemDataSnapshot),
      oemDataSnapshot,
      requestedQuantity,
      targetPrice,
      currency:
        normalizeText(existingDraft?.currency) ||
        normalizeText(existingSnapshot?.currency) ||
        normalizeText(product?.currency) ||
        'USD',
      selectedPackageVersionRef:
        normalizeText(existingDraft?.selectedPackageVersionRef) ||
        normalizeText(product?.productPackageSnapshot?.id) ||
        null,
      selectedProjectRevisionRef:
        normalizeText(existingDraft?.selectedProjectRevisionRef) ||
        normalizeText(product?.projectRevisionSnapshot?.revisionId) ||
        normalizeText(product?.projectRevisionId) ||
        null,
      inquiryRequirementSummary:
        normalizeText(existingDraft?.inquiryRequirementSummary) ||
        normalizeText(existingSnapshot?.inquiryRequirementSummary) ||
        normalizeText(product?.projectRevisionSnapshot?.description) ||
        normalizeText(product?.productPackageSnapshot?.description) ||
        description,
    };
  },

  normalizeInquirySelectionProduct(product: Record<string, any>): Record<string, any> {
    const draft = this.buildInquirySnapshotDraftFromProductLine(product);
    const sourceLayer = draft.sourceRef.sourceLayer;
    const sourceType = inferCustomerSourceType(product, sourceLayer);
    return {
      ...product,
      source: product?.source || (sourceLayer === 'website_product_catalog'
        ? 'website'
        : sourceLayer === 'customer_product_library'
          ? 'my_products'
          : sourceLayer === 'trade_product_library'
            ? 'history'
            : 'manual'),
      addedFrom: product?.addedFrom || draft.sourceRef.sourceLabel || 'Selection',
      sourceType,
      masterRef: draft.masterRef,
      mappingRef: draft.mappingRef,
      sourceRef: draft.sourceRef,
      attachmentSummarySnapshot: draft.attachmentSummarySnapshot,
      fileManifestSnapshot: draft.fileManifestSnapshot,
      inquirySnapshotDraft: draft,
    };
  },

  ensureInquiryProductLine(product: Record<string, any>): Record<string, any> {
    const normalizedProduct = this.normalizeInquirySelectionProduct(product);
    const existingSnapshot = normalizedProduct?.inquirySnapshot || null;
    const draft = normalizedProduct.inquirySnapshotDraft as InquirySnapshotDraft;
    const shouldDerive =
      Boolean(existingSnapshot) &&
      (
        draft.sourceRef.sourceLayer === 'trade_product_library' ||
        !snapshotMatchesDraft(existingSnapshot, draft)
      );
    const inquirySnapshot =
      existingSnapshot && !shouldDerive
        ? existingSnapshot
        : this.createInquirySnapshot(
            draft,
            shouldDerive
              ? {
                  snapshotId: existingSnapshot.snapshotId,
                  snapshotType: existingSnapshot.snapshotType,
                  snapshotVersion: existingSnapshot.snapshotVersion,
                }
              : null,
          );

    return {
      ...normalizedProduct,
      modelNo: normalizedProduct?.modelNo || inquirySnapshot.supplierModelNo || inquirySnapshot.displayModelNo,
      internalModelNo: normalizedProduct?.internalModelNo || inquirySnapshot.masterRef?.internalModelNo || '',
      inquirySnapshot,
      inquirySnapshotDraft: draft,
      masterRef: inquirySnapshot.masterRef,
      mappingRef: inquirySnapshot.mappingRef,
      sourceRef: inquirySnapshot.sourceRef,
      attachmentSummarySnapshot: inquirySnapshot.attachmentSummarySnapshot,
      fileManifestSnapshot: inquirySnapshot.fileManifestSnapshot,
    };
  },

  createInquirySnapshot(
    draft: InquirySnapshotDraft,
    derivedFrom?: Pick<SnapshotEnvelope, 'snapshotId' | 'snapshotType' | 'snapshotVersion'> | null,
  ): InquirySnapshot {
    const envelope = derivedFrom
      ? buildDerivedSnapshotEnvelope('inquiry', derivedFrom)
      : buildRootSnapshotEnvelope('inquiry');
    return buildBaseSnapshot<InquirySnapshot>(envelope, draft);
  },

  deriveQuotationSnapshot(
    draft: QuotationSnapshotDraft,
    derivedFrom: Pick<SnapshotEnvelope, 'snapshotId' | 'snapshotType' | 'snapshotVersion'>,
  ): QuotationSnapshot {
    return buildBaseSnapshot<QuotationSnapshot>(
      buildDerivedSnapshotEnvelope('quotation', derivedFrom),
      draft,
    );
  },

  deriveOrderSnapshot(
    draft: OrderSnapshotDraft,
    derivedFrom: Pick<SnapshotEnvelope, 'snapshotId' | 'snapshotType' | 'snapshotVersion'>,
  ): OrderSnapshot {
    return buildBaseSnapshot<OrderSnapshot>(
      buildDerivedSnapshotEnvelope('order', derivedFrom),
      draft,
    );
  },

  deriveProcurementSnapshot(
    draft: ProcurementSnapshotDraft,
    derivedFrom: Pick<SnapshotEnvelope, 'snapshotId' | 'snapshotType' | 'snapshotVersion'>,
  ): ProcurementSnapshot {
    return buildBaseSnapshot<ProcurementSnapshot>(
      buildDerivedSnapshotEnvelope('procurement', derivedFrom),
      draft,
    );
  },
};
