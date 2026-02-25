import type { BusinessDomain, IdMappingRecord } from './types';

const MAP_KEY = 'cosun_erp_id_mappings_v1';

const nowIso = () => new Date().toISOString();

function loadMappings(): IdMappingRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(MAP_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as IdMappingRecord[]) : [];
  } catch {
    return [];
  }
}

function saveMappings(records: IdMappingRecord[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(MAP_KEY, JSON.stringify(records));
}

export function upsertIdMapping(
  input: Omit<IdMappingRecord, 'id' | 'createdAt' | 'updatedAt'>,
): IdMappingRecord {
  const all = loadMappings();
  const foundIndex = all.findIndex((r) => {
    return (
      r.domain === input.domain &&
      r.internalId === input.internalId &&
      r.companyId === input.companyId
    );
  });

  if (foundIndex >= 0) {
    const updated: IdMappingRecord = {
      ...all[foundIndex],
      ...input,
      updatedAt: nowIso(),
    };
    all[foundIndex] = updated;
    saveMappings(all);
    return updated;
  }

  const created: IdMappingRecord = {
    ...input,
    id: `${input.domain}-${input.internalId}-${Date.now()}`,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  all.unshift(created);
  saveMappings(all);
  return created;
}

export function findIdMappingByInternal(
  domain: BusinessDomain,
  internalIdOrNo: string,
  companyId?: string,
): IdMappingRecord | undefined {
  return loadMappings().find((r) => {
    const companyMatch = companyId ? r.companyId === companyId : true;
    return (
      companyMatch &&
      r.domain === domain &&
      (r.internalId === internalIdOrNo || r.internalNo === internalIdOrNo)
    );
  });
}

export function findIdMappingByExternal(
  domain: BusinessDomain,
  externalIdOrNo: string,
  companyId?: string,
): IdMappingRecord | undefined {
  return loadMappings().find((r) => {
    const companyMatch = companyId ? r.companyId === companyId : true;
    return (
      companyMatch &&
      r.domain === domain &&
      (r.externalId === externalIdOrNo || r.externalNo === externalIdOrNo)
    );
  });
}

export function listIdMappings(domain?: BusinessDomain): IdMappingRecord[] {
  const all = loadMappings();
  return domain ? all.filter((r) => r.domain === domain) : all;
}
