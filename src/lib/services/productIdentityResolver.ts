import {
  nextInternalModelNo,
  productMasterService,
  productModelMappingService,
} from '../supabaseService';
import {
  getCustomerPartNo,
  getInternalModelNo,
  getSupplierPartNo,
} from '../../utils/productModelDisplay';
import type {
  MappingPartyType,
  MasterProductRef,
  ProductMappingRef,
} from '../product-domain/types';

const normalizeText = (value: unknown) => String(value || '').trim();

const toNullableText = (value: unknown) => normalizeText(value) || null;

export type IdentityResolutionInput = {
  regionCode?: string | null;
  productName?: unknown;
  description?: unknown;
  imageUrl?: unknown;
  internalModelNo?: unknown;
  customerModelNo?: unknown;
  supplierModelNo?: unknown;
  mappingPartyType?: MappingPartyType | null;
  partyId?: unknown;
  createdFromDocType?: string | null;
  createdFromDocId?: unknown;
  createMasterIfMissing?: boolean;
  generateInternalModelNoIfMissing?: boolean;
  ensurePendingMapping?: boolean;
  remarks?: string | null;
};

export type IdentityResolutionResult = {
  masterRef: MasterProductRef | null;
  mappingRef: ProductMappingRef | null;
  productMaster: any | null;
  mapping: any | null;
  resolutionStatus: 'resolved' | 'pending_mapping' | 'generated_master' | 'unresolved';
};

const buildMasterProductRef = (productMaster: any, fallbackInternalModelNo?: string): MasterProductRef | null => {
  const internalModelNo = normalizeText(productMaster?.internalModelNo || fallbackInternalModelNo);
  if (!internalModelNo && !productMaster?.id) return null;
  return {
    masterProductId: toNullableText(productMaster?.id),
    internalModelNo,
    isResolved: Boolean(productMaster?.id && internalModelNo),
  };
};

const buildMappingRef = (
  mapping: any,
  input: {
    externalModelNo?: string;
    mappingPartyType?: MappingPartyType | null;
  },
): ProductMappingRef | null => {
  const externalModelNo = normalizeText(mapping?.externalModelNo || input.externalModelNo);
  if (!externalModelNo && !mapping?.id) return null;
  return {
    mappingId: toNullableText(mapping?.id),
    mappingStatus: (mapping?.mappingStatus as ProductMappingRef['mappingStatus'] | undefined) || 'unmapped',
    externalModelNo,
    partyType: (mapping?.partyType as MappingPartyType | undefined) || input.mappingPartyType || null,
  };
};

const resolveMappingExternalModelNo = (
  mappingPartyType: MappingPartyType | null | undefined,
  customerModelNo: string,
  supplierModelNo: string,
) => {
  if (mappingPartyType === 'supplier') return supplierModelNo;
  if (mappingPartyType === 'customer') return customerModelNo;
  return customerModelNo || supplierModelNo;
};

export const productIdentityResolver = {
  async resolve(input: IdentityResolutionInput): Promise<IdentityResolutionResult> {
    const regionCode = normalizeText(input.regionCode || 'NA') || 'NA';
    const productName = normalizeText(input.productName);
    const description = normalizeText(input.description);
    const imageUrl = normalizeText(input.imageUrl);
    const customerModelNo = normalizeText(input.customerModelNo) || normalizeText(getCustomerPartNo(input));
    const supplierModelNo = normalizeText(input.supplierModelNo) || normalizeText(getSupplierPartNo(input));
    let internalModelNo = normalizeText(input.internalModelNo) || normalizeText(getInternalModelNo(input));
    let resolutionStatus: IdentityResolutionResult['resolutionStatus'] = 'unresolved';
    let productMaster: any | null = null;
    let mapping: any | null = null;

    if (!internalModelNo && input.generateInternalModelNoIfMissing) {
      internalModelNo = await nextInternalModelNo(regionCode);
      resolutionStatus = 'generated_master';
    }

    if (internalModelNo && input.createMasterIfMissing !== false) {
      productMaster = await productMasterService.upsert({
        internalModelNo,
        regionCode,
        productName,
        description,
        imageUrl,
        status: 'active',
      });
      resolutionStatus = resolutionStatus === 'generated_master' ? 'generated_master' : 'resolved';
    } else if (internalModelNo) {
      productMaster = await productMasterService.getByInternalModelNo(internalModelNo);
      resolutionStatus = productMaster ? 'resolved' : 'unresolved';
    }

    const mappingPartyType = input.mappingPartyType || null;
    const externalModelNo = resolveMappingExternalModelNo(mappingPartyType, customerModelNo, supplierModelNo);

    if (
      input.ensurePendingMapping &&
      productMaster?.id &&
      mappingPartyType &&
      externalModelNo &&
      (mappingPartyType === 'customer' || mappingPartyType === 'supplier')
    ) {
      mapping = await productModelMappingService.ensurePending({
        productId: productMaster.id,
        partyType: mappingPartyType,
        partyId: normalizeText(input.partyId) || 'unknown-party',
        externalModelNo,
        externalProductName: productName,
        externalSpecification: description,
        externalImageUrl: imageUrl,
        createdFromDocType: input.createdFromDocType || null,
        createdFromDocId: toNullableText(input.createdFromDocId),
        remarks: input.remarks || null,
      });
      if (resolutionStatus === 'resolved') {
        resolutionStatus = mapping?.mappingStatus === 'confirmed' ? 'resolved' : 'pending_mapping';
      }
    }

    return {
      masterRef: buildMasterProductRef(productMaster, internalModelNo),
      mappingRef: buildMappingRef(mapping, { externalModelNo, mappingPartyType }),
      productMaster,
      mapping,
      resolutionStatus,
    };
  },
};
