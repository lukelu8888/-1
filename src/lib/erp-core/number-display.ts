import { findIdMappingByInternal } from './id-mapping';
import type { BusinessDomain } from './types';

export interface DisplayNumberOptions {
  domain: BusinessDomain;
  internalNo: string;
  companyId?: string;
}

export interface DisplayNumberResult {
  primaryNo: string;
  externalNo?: string;
}

export function resolveDisplayNumber(options: DisplayNumberOptions): DisplayNumberResult {
  const mapping = findIdMappingByInternal(options.domain, options.internalNo, options.companyId);
  return {
    primaryNo: options.internalNo,
    externalNo: mapping?.externalNo,
  };
}
