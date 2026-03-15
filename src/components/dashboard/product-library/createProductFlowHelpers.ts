import { createEmptyOemData, normalizeOemData, type InquiryOemData } from '../../../types/oem';
import type { CustomerProductRecord } from '../../../lib/customerProductLibrary';
import type {
  CreateProductDraft,
  CreateProductFlowMode,
  CreateProductIntent,
  CreateProductKind,
} from './createProductFlowTypes';

export const CREATE_PRODUCT_KIND_OPTIONS: Array<{
  kind: CreateProductKind;
  label: string;
  helper: string;
  group: 'product' | 'service';
}> = [
  {
    kind: 'standard',
    label: 'Standard Product',
    helper: 'Create a reusable standard product with a current package and technical files.',
    group: 'product',
  },
  {
    kind: 'oem',
    label: 'OEM Product',
    helper: 'Create a custom/OEM product with drawings, spec files, and a technical package.',
    group: 'product',
  },
  {
    kind: 'project',
    label: 'Project Product',
    helper: 'Create a project asset with current revision, revision history, and final revision flow.',
    group: 'product',
  },
  {
    kind: 'qc_service',
    label: 'QC Service',
    helper: 'Create a QC service asset with inspection scope, standards, and deliverables.',
    group: 'service',
  },
  {
    kind: 'general_service',
    label: 'General Service',
    helper: 'Create a reusable service asset for support, consulting, logistics, or execution services.',
    group: 'service',
  },
];

export const buildInitialCreateProductDraft = (kind: CreateProductKind): CreateProductDraft => ({
  kind,
  productName: '',
  customerModelNo: '',
  unit: 'pcs',
  targetPrice: '',
  imageUrl: '',
  description: '',
  packageSummary: '',
  packageNote: '',
  files: [],
  projectCode: '',
  projectName: '',
  revisionCode: 'A',
  revisionStatus: 'working',
  revisionSummary: '',
  revisionNote: '',
  serviceType: kind === 'qc_service' ? 'qc_service' : kind === 'general_service' ? 'general_service' : '',
  serviceCategory: '',
  serviceScope: '',
  serviceDeliverables: '',
  inspectionType: '',
  inspectionStandard: '',
  deliveryMethod: '',
});

export const getCreateFlowTitle = (mode: CreateProductFlowMode) =>
  mode === 'inquiry-return' ? 'Create Product for This Inquiry' : 'Create Product';

export const getCreateFlowModeLabel = (mode: CreateProductFlowMode) =>
  mode === 'inquiry-return' ? 'Inquiry Return Mode' : 'Library Mode';

export const getCreateFlowStepLabel = (hasDraft: boolean) =>
  hasDraft ? 'Step 2 of 2 · Product Setup' : 'Step 1 of 2 · Select Type';

export const getCreateProductKindLabel = (kind: CreateProductKind | null) =>
  CREATE_PRODUCT_KIND_OPTIONS.find((option) => option.kind === kind)?.label || 'Product Type';

export const getCreateProductKindTraits = (kind: CreateProductKind) => {
  if (kind === 'project') {
    return ['Package', 'Revision', 'Use in Inquiry'];
  }
  if (kind === 'oem') {
    return ['Technical Files', 'Package', 'Use in Inquiry'];
  }
  if (kind === 'qc_service') {
    return ['Service Package', 'QC Deliverables', 'Use in Inquiry'];
  }
  if (kind === 'general_service') {
    return ['Service Package', 'Deliverables', 'Use in Inquiry'];
  }
  return ['Current Package', 'Files', 'Use in Inquiry'];
};

export const getPrimaryActionLabel = (mode: CreateProductFlowMode) =>
  mode === 'inquiry-return' ? 'Save and Use in Inquiry' : 'Create Product';

export const getIntentLabel = (intent: CreateProductIntent) => {
  if (intent === 'save-draft') return 'Draft saved';
  if (intent === 'save-and-use') return 'Product saved and added to inquiry';
  return 'Product created';
};

export const buildCreateProductOemData = (draft: CreateProductDraft): InquiryOemData | undefined => {
  const shouldEnableFiles =
    draft.files.length > 0 ||
    Boolean(draft.packageNote.trim()) ||
    Boolean(draft.packageSummary.trim()) ||
    draft.kind === 'oem' ||
    draft.kind === 'project';

  if (!shouldEnableFiles) return undefined;

  return normalizeOemData({
    ...createEmptyOemData(),
    enabled: true,
    overallRequirementNote:
      draft.kind === 'project'
        ? draft.revisionNote.trim() || draft.packageNote.trim()
        : draft.packageNote.trim(),
    files: draft.files,
  });
};

export const buildCreateProductPayload = (
  draft: CreateProductDraft,
  intent: CreateProductIntent,
): Partial<CustomerProductRecord> & Record<string, any> => {
  const oem = buildCreateProductOemData(draft);
  const isProject = draft.kind === 'project';
  const isService = draft.kind === 'qc_service' || draft.kind === 'general_service';
  const trimmedName = draft.productName.trim();
  const resolvedDescription =
    draft.kind === 'project'
      ? draft.revisionSummary.trim() || draft.description.trim()
      : draft.kind === 'qc_service'
        ? draft.serviceScope.trim() || draft.description.trim()
        : draft.kind === 'general_service'
          ? draft.serviceScope.trim() || draft.description.trim()
          : draft.description.trim() || draft.packageSummary.trim();

  return {
    recordType: isProject ? 'project' : 'product',
    isProjectBased: isProject,
    projectCode: isProject ? draft.projectCode.trim() : null,
    projectName: isProject ? (draft.projectName.trim() || trimmedName) : null,
    revisionCode: isProject ? draft.revisionCode.trim().toUpperCase() || 'A' : undefined,
    sourceType: 'customer_created',
    productStatus: intent === 'save-draft' ? 'draft' : 'active',
    productName: trimmedName,
    description: resolvedDescription,
    specifications: resolvedDescription,
    imageUrl: draft.imageUrl.trim(),
    image: draft.imageUrl.trim(),
    itemType: draft.kind === 'oem' ? 'oem_custom' : 'standard_sourcing',
    customerModelNo: draft.customerModelNo.trim(),
    unit: draft.unit.trim() || 'pcs',
    targetPrice: Number.parseFloat(draft.targetPrice || '0') || 0,
    quantity: 1,
    syncStatus: 'pending',
    syncMessage: intent === 'save-draft' ? 'Draft saved locally' : 'Waiting for master link',
    oem,
    packageVersion: 1,
    serviceType: isService ? draft.serviceType : null,
    serviceCategory: isService ? draft.serviceCategory.trim() : null,
    serviceScopeSummary: isService ? draft.serviceScope.trim() : null,
    serviceDeliverables: isService ? draft.serviceDeliverables.trim() : null,
    inspectionType: draft.kind === 'qc_service' ? draft.inspectionType.trim() : null,
    inspectionStandard: draft.kind === 'qc_service' ? draft.inspectionStandard.trim() : null,
    deliveryMethod: draft.kind === 'general_service' ? draft.deliveryMethod.trim() : null,
    packageSummary: draft.packageSummary.trim() || null,
    packageNote: draft.packageNote.trim() || null,
    revisionSummary: isProject ? draft.revisionSummary.trim() : null,
    revisionNote: isProject ? draft.revisionNote.trim() : null,
    revisionStatus: isProject ? draft.revisionStatus : null,
  };
};

export const isCreateProductDraftValid = (draft: CreateProductDraft) => {
  if (!draft.productName.trim()) return false;
  if (!draft.unit.trim()) return false;
  if (draft.kind === 'project' && !draft.projectName.trim()) return false;
  if (draft.kind === 'qc_service' && !draft.serviceScope.trim()) return false;
  if (draft.kind === 'general_service' && !draft.serviceScope.trim()) return false;
  return true;
};
