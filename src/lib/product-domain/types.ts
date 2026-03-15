import type {
  OemFileDeliveryScope,
  OemFileProcessingState,
  OemFileSensitivityLevel,
  InquiryOemData,
} from '../../types/oem';

export type CustomerProductSourceType =
  | 'customer_created'
  | 'saved_from_website'
  | 'derived_from_inquiry'
  | 'derived_from_order'
  | 'assigned_by_cosun';

export type ProductDisplaySourceType =
  | 'customer_owned'
  | 'third_party'
  | 'cosun'
  | 'mixed';

export type ProductSnapshotType = 'inquiry' | 'quotation' | 'order' | 'procurement';

export type ProductSnapshotTypeCode = 'INQ' | 'QT' | 'ORD' | 'PRC';

export type ProductItemType = 'standard_sourcing' | 'oem_custom';

export type MappingPartyType = 'customer' | 'supplier' | 'website' | 'manual';

export type SnapshotSourceLayer =
  | 'website_product_catalog'
  | 'customer_product_library'
  | 'trade_product_library'
  | 'supply_chain_product_library'
  | 'manual_entry';

export type MasterProductRef = {
  masterProductId: string | null;
  internalModelNo: string;
  isResolved: boolean;
};

export type ProductMappingRef = {
  mappingId: string | null;
  mappingStatus: 'pending' | 'suggested' | 'confirmed' | 'rejected' | 'unmapped';
  externalModelNo: string;
  partyType: MappingPartyType | null;
};

export type SourceRef = {
  sourceLayer: SnapshotSourceLayer;
  sourceObjectId: string;
  sourceSnapshotId: string | null;
  sourceLabel?: string | null;
};

export type AttachmentSummarySnapshot = {
  attachmentCount: number;
  fileTypeCounts: Record<string, number>;
  deliveryScopeCounts: Partial<Record<OemFileDeliveryScope, number>>;
  hasDrawing: boolean;
  hasSpec: boolean;
  hasBom: boolean;
  hasPackaging: boolean;
  hasTestReport: boolean;
  hasImage: boolean;
  oemFileCount: number;
};

export type FileManifestSnapshotEntry = {
  fileIdOrToken: string;
  fileNameSnapshot: string;
  fileType: string;
  mimeType: string;
  fileSize: number;
  checksumOrFingerprint: string;
  customerPartNumber: string;
  descriptionSnapshot: string;
  deliveryScope: OemFileDeliveryScope;
  sensitivityLevel: OemFileSensitivityLevel;
  processingState: OemFileProcessingState;
  uploadedAtSnapshot: string | null;
  storageRef: string | null;
};

export type SnapshotEnvelope = {
  snapshotId: string;
  snapshotType: ProductSnapshotType;
  snapshotVersion: number;
  derivedFromSnapshotId: string | null;
  snapshotAt: string;
};

export type ProductSnapshotBase = SnapshotEnvelope & {
  masterRef: MasterProductRef | null;
  mappingRef: ProductMappingRef | null;
  sourceRef: SourceRef;
  productName: string;
  displayModelNo: string;
  customerModelNo: string;
  supplierModelNo: string;
  description: string;
  specSummary: string;
  imageUrl: string;
  unit: string;
  itemType: ProductItemType;
  regionCode: string;
  attachmentSummarySnapshot: AttachmentSummarySnapshot;
  fileManifestSnapshot: FileManifestSnapshotEntry[];
  oemRequirementSummary: string;
  oemDataSnapshot?: InquiryOemData | null;
};

export type InquirySnapshot = ProductSnapshotBase & {
  snapshotType: 'inquiry';
  requestedQuantity: number;
  targetPrice: number;
  currency: string;
  selectedPackageVersionRef: string | null;
  selectedProjectRevisionRef: string | null;
  inquiryRequirementSummary: string;
};

export type QuotationSnapshot = ProductSnapshotBase & {
  snapshotType: 'quotation';
  quotedQuantity: number;
  targetPrice: number;
  costPrice: number;
  salesPrice: number;
  currency: string;
  selectedSupplierRef: string | null;
  selectedBJRef: string | null;
  quotationTermsSummary: string;
};

export type OrderSnapshot = ProductSnapshotBase & {
  snapshotType: 'order';
  orderedQuantity: number;
  unitPrice: number;
  subtotal: number;
  currency: string;
  packagingRequirement: string;
  deliveryRequirement: string;
  confirmedRevisionRef: string | null;
};

export type ProcurementSnapshot = ProductSnapshotBase & {
  snapshotType: 'procurement';
  procurementQuantity: number;
  costPrice: number;
  currency: string;
  selectedSupplierRef: string | null;
  selectedXJRef: string | null;
  selectedBJRef: string | null;
  leadTime: string;
  moq: string;
  packagingRequirement: string;
  factoryExecutionSummary: string;
  qcRequirementSummary: string;
};

export type InquirySnapshotDraft = Omit<
  InquirySnapshot,
  keyof SnapshotEnvelope
>;

export type QuotationSnapshotDraft = Omit<
  QuotationSnapshot,
  keyof SnapshotEnvelope
>;

export type OrderSnapshotDraft = Omit<
  OrderSnapshot,
  keyof SnapshotEnvelope
>;

export type ProcurementSnapshotDraft = Omit<
  ProcurementSnapshot,
  keyof SnapshotEnvelope
>;

export type ProductSnapshotDraft =
  | InquirySnapshotDraft
  | QuotationSnapshotDraft
  | OrderSnapshotDraft
  | ProcurementSnapshotDraft;
