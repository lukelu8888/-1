import type { OemUploadedFile } from '../../../types/oem';
import type { CustomerProductRecord } from '../../../lib/customerProductLibrary';

export type CreateProductFlowMode = 'library' | 'inquiry-return';

export type CreateProductKind =
  | 'standard'
  | 'oem'
  | 'project'
  | 'qc_service'
  | 'general_service';

export type CreateProductIntent = 'save-draft' | 'create-product' | 'save-and-use';

export type CreateProductDraft = {
  kind: CreateProductKind;
  productName: string;
  customerModelNo: string;
  unit: string;
  targetPrice: string;
  imageUrl: string;
  description: string;
  packageSummary: string;
  packageNote: string;
  files: OemUploadedFile[];
  projectCode: string;
  projectName: string;
  revisionCode: string;
  revisionStatus: 'working' | 'quoted' | 'superseded' | 'final' | 'cancelled';
  revisionSummary: string;
  revisionNote: string;
  serviceType: 'qc_service' | 'general_service' | '';
  serviceCategory: string;
  serviceScope: string;
  serviceDeliverables: string;
  inspectionType: string;
  inspectionStandard: string;
  deliveryMethod: string;
};

export type CreateProductCompletion = {
  intent: CreateProductIntent;
  mode: CreateProductFlowMode;
  record: CustomerProductRecord;
};

export type CreateProductFormProps = {
  draft: CreateProductDraft;
  mode: CreateProductFlowMode;
  isSubmitting: boolean;
  onChange: (patch: Partial<CreateProductDraft>) => void;
  onFilesChange: (files: OemUploadedFile[]) => void;
  onBack: () => void;
  onCancel: () => void;
  onSaveDraft: () => void;
  onPrimaryAction: () => void;
};
