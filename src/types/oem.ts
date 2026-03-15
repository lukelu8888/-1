export type OemForwardingDepartment = 'Procurement Department';
export type OemMoldLifetime = '10000' | '100000' | '300000';
export type OemPartMappingStatus = 'pending_internal_assignment' | 'mapped';
export type OemFileSensitivityLevel = 'normal' | 'sensitive' | 'highly_sensitive';
export type OemFileProcessingState = 'raw' | 'internal_redacted' | 'factory_facing';
export type OemFileDeliveryScope = 'sales_only' | 'internal_only' | 'procurement' | 'factory';
export interface OemFactoryFacingOutput {
  generatedAt: string;
  generatedBy: string;
  exportedAt?: string | null;
  exportedBy?: string | null;
  exportedFileName?: string | null;
  versionLabel: string;
  releaseStatus: 'draft' | 'ready';
  coverTitle: string;
  ownerDepartment: string;
  projectName: string;
  originalFileName: string;
  targetFileName: string;
  notes: string;
}

export interface OemUploadedFile {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  lastModified: number;
  description: string;
  customerPartNumber: string;
  internalModelNumber: string;
  internalSku: string;
  anonymizationStatus: 'pending';
  uploadStatus?: 'local' | 'uploading' | 'uploaded' | 'failed';
  storageBucket?: string;
  storagePath?: string;
  storageUrl?: string;
  uploadedAt?: string;
  fileObject?: File | null;
  sourceProductId?: string;
  sourceProductName?: string;
  sensitivityLevel?: OemFileSensitivityLevel;
  processingState?: OemFileProcessingState;
  deliveryScope?: OemFileDeliveryScope;
  factoryFacingOutput?: OemFactoryFacingOutput | null;
}

export interface OemPartNumberMapping {
  id: string;
  sourceFileId: string;
  customerPartNumber: string;
  internalModelNumber: string;
  internalSku: string;
  status: OemPartMappingStatus;
  sourceProductId?: string;
  sourceProductName?: string;
}

export interface OemToolingRequirement {
  toolingCostInvolved: boolean;
  firstOrderQuantity: string;
  annualQuantity: string;
  quantityWithinThreeYears: string;
  moldLifetime: OemMoldLifetime | '';
}

export interface InquiryOemData {
  enabled: boolean;
  overallRequirementNote: string;
  files: OemUploadedFile[];
  tooling: OemToolingRequirement;
  partNumberMappings: OemPartNumberMapping[];
  forwardingControl: {
    customerSelectable: false;
    ownerDepartment: OemForwardingDepartment;
  };
  anonymizationPolicy: {
    replaceCustomerIdentity: true;
    replacePartNumbersWithInternalModelSku: true;
    hideCustomerIdentityInFactoryDocs: true;
    factoryFacingOwnerDepartment: OemForwardingDepartment;
  };
  internalProcessing: {
    anonymizationStatus: 'pending' | 'in_progress' | 'completed';
    replacementVersionStatus: 'pending' | 'in_progress' | 'completed';
    factoryForwardingStatus: 'internal_hold' | 'ready_for_internal_review' | 'released_to_factory';
  };
}

export const OEM_MOLD_LIFETIME_OPTIONS: Array<{ value: OemMoldLifetime; label: string }> = [
  { value: '10000', label: '10k cycles' },
  { value: '100000', label: '100k cycles' },
  { value: '300000', label: '300k cycles' },
];

export const createEmptyOemData = (): InquiryOemData => ({
  enabled: false,
  overallRequirementNote: '',
  files: [],
  tooling: {
    toolingCostInvolved: false,
    firstOrderQuantity: '',
    annualQuantity: '',
    quantityWithinThreeYears: '',
    moldLifetime: '',
  },
  partNumberMappings: [],
  forwardingControl: {
    customerSelectable: false,
    ownerDepartment: 'Procurement Department',
  },
  anonymizationPolicy: {
    replaceCustomerIdentity: true,
    replacePartNumbersWithInternalModelSku: true,
    hideCustomerIdentityInFactoryDocs: true,
    factoryFacingOwnerDepartment: 'Procurement Department',
  },
  internalProcessing: {
    anonymizationStatus: 'pending',
    replacementVersionStatus: 'pending',
    factoryForwardingStatus: 'internal_hold',
  },
});

export const buildOemPartNumberMappings = (files: OemUploadedFile[]): OemPartNumberMapping[] => {
  const uniqueCustomerPartNumbers = new Map<string, OemPartNumberMapping>();

  files.forEach((file) => {
    const customerPartNumber = String(file.customerPartNumber || '').trim();
    if (!customerPartNumber || uniqueCustomerPartNumbers.has(customerPartNumber)) {
      return;
    }

    uniqueCustomerPartNumbers.set(customerPartNumber, {
      id: `oem-map-${file.id}`,
      sourceFileId: file.id,
      customerPartNumber,
      internalModelNumber: file.internalModelNumber || '',
      internalSku: file.internalSku || '',
      status: 'pending_internal_assignment',
    });
  });

  return Array.from(uniqueCustomerPartNumbers.values());
};

export const normalizeOemData = (value?: Partial<InquiryOemData> | null): InquiryOemData => {
  const base = createEmptyOemData();
  const files = (Array.isArray(value?.files) ? value.files : base.files).map((file) => {
    const sensitivityLevel = (file?.sensitivityLevel as OemFileSensitivityLevel | undefined) || 'normal';
    const processingState = (file?.processingState as OemFileProcessingState | undefined) || 'raw';
    const deliveryScope = (file?.deliveryScope as OemFileDeliveryScope | undefined) || 'sales_only';

    return {
      ...file,
      sensitivityLevel,
      processingState,
      deliveryScope,
      factoryFacingOutput: file?.factoryFacingOutput || null,
    };
  });
  const partNumberMappings = Array.isArray(value?.partNumberMappings) && value?.partNumberMappings.length
    ? value.partNumberMappings
    : buildOemPartNumberMappings(files);

  return {
    enabled: Boolean(value?.enabled),
    overallRequirementNote: String(value?.overallRequirementNote || ''),
    files,
    tooling: {
      toolingCostInvolved: Boolean(value?.tooling?.toolingCostInvolved),
      firstOrderQuantity: String(value?.tooling?.firstOrderQuantity || ''),
      annualQuantity: String(value?.tooling?.annualQuantity || ''),
      quantityWithinThreeYears: String(value?.tooling?.quantityWithinThreeYears || ''),
      moldLifetime: (value?.tooling?.moldLifetime as OemMoldLifetime | '') || '',
    },
    partNumberMappings,
    forwardingControl: {
      customerSelectable: false,
      ownerDepartment: 'Procurement Department',
    },
    anonymizationPolicy: {
      replaceCustomerIdentity: true,
      replacePartNumbersWithInternalModelSku: true,
      hideCustomerIdentityInFactoryDocs: true,
      factoryFacingOwnerDepartment: 'Procurement Department',
    },
    internalProcessing: {
      anonymizationStatus: value?.internalProcessing?.anonymizationStatus || 'pending',
      replacementVersionStatus: value?.internalProcessing?.replacementVersionStatus || 'pending',
      factoryForwardingStatus: value?.internalProcessing?.factoryForwardingStatus || 'internal_hold',
    },
  };
};

export const createOemUploadRecord = (file: File): OemUploadedFile => ({
  id: `oem-file-${crypto.randomUUID()}`,
  fileName: file.name,
  fileType: file.type || 'application/octet-stream',
  fileSize: file.size,
  lastModified: file.lastModified || Date.now(),
  description: '',
  customerPartNumber: '',
  internalModelNumber: '',
  internalSku: '',
  anonymizationStatus: 'pending',
  uploadStatus: 'local',
  fileObject: file,
  sensitivityLevel: 'normal',
  processingState: 'raw',
  deliveryScope: 'sales_only',
  factoryFacingOutput: null,
});

export const serializeOemDataForPersistence = (value: InquiryOemData): InquiryOemData => ({
  ...value,
  files: value.files.map((file) => ({
    ...file,
    fileObject: null,
  })),
});

const buildProductLevelPartMapping = (product: any, itemOem: InquiryOemData): OemPartNumberMapping[] => {
  const customerPartNumber = String(
    product?.customerModelNo || product?.customerModelNO || product?.customer_model_no || ''
  ).trim();

  if (!customerPartNumber) {
    return itemOem.partNumberMappings || [];
  }

  return [
    {
      id: `oem-map-${product?.id || customerPartNumber}`,
      sourceFileId: itemOem.files[0]?.id || String(product?.id || ''),
      customerPartNumber,
      internalModelNumber: '',
      internalSku: '',
      status: 'pending_internal_assignment',
      sourceProductId: String(product?.id || ''),
      sourceProductName: String(product?.productName || ''),
    },
  ];
};

export const aggregateInquiryOemFromProducts = (products: Array<any> = []): InquiryOemData => {
  const base = createEmptyOemData();
  const oemProducts = products.filter((product) => Boolean(product?.oem?.enabled));

  if (oemProducts.length === 0) {
    return base;
  }

  const files = oemProducts.flatMap((product) =>
    normalizeOemData(product.oem).files.map((file) => ({
      ...file,
      sourceProductId: String(product.id || ''),
      sourceProductName: String(product.productName || ''),
    })),
  );

  const partNumberMappings = oemProducts.flatMap((product) =>
    buildProductLevelPartMapping(product, normalizeOemData(product.oem)).map((mapping) => ({
      ...mapping,
      sourceProductId: String(product.id || ''),
      sourceProductName: String(product.productName || ''),
    })),
  );

  const requirementSections = oemProducts
    .map((product) => {
      const itemOem = normalizeOemData(product.oem);
      const note = itemOem.overallRequirementNote.trim();
      if (!note) return '';
      return `${product.productName || 'OEM Item'}\n${note}`;
    })
    .filter(Boolean);

  const toolingProducts = oemProducts.filter((product) => normalizeOemData(product.oem).tooling.toolingCostInvolved);
  const firstTooling = toolingProducts.length === 1 ? normalizeOemData(toolingProducts[0].oem).tooling : null;

  return normalizeOemData({
    ...base,
    enabled: true,
    overallRequirementNote: requirementSections.join('\n\n'),
    files,
    partNumberMappings,
    tooling: firstTooling
      ? { ...firstTooling }
      : {
          toolingCostInvolved: toolingProducts.length > 0,
          firstOrderQuantity: '',
          annualQuantity: '',
          quantityWithinThreeYears: '',
          moldLifetime: '',
        },
  });
};

export const validateOemData = (value: InquiryOemData): string[] => {
  const errors: string[] = [];

  if (!value.enabled) {
    return errors;
  }

  if (value.files.length === 0) {
    errors.push('Upload at least one OEM drawing or technical document.');
  }

  if (!value.overallRequirementNote.trim()) {
    errors.push('Provide the OEM overall business requirement note.');
  }

  if (value.tooling.toolingCostInvolved) {
    if (!value.tooling.firstOrderQuantity.trim()) {
      errors.push('Enter the first order quantity for tooling/mold requests.');
    }
    if (!value.tooling.annualQuantity.trim()) {
      errors.push('Enter the annual quantity for tooling/mold requests.');
    }
    if (!value.tooling.quantityWithinThreeYears.trim()) {
      errors.push('Enter the quantity within 3 years for tooling/mold requests.');
    }
    if (!value.tooling.moldLifetime) {
      errors.push('Select the mold lifetime for tooling/mold requests.');
    }
  }

  return errors;
};
