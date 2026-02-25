import type { BusinessDomain } from './types';

const TOMBSTONE_KEY = 'cosun_erp_tombstones_v1';

export interface Tombstone {
  id: string;
  domain: BusinessDomain;
  marker: string;
  reason?: string;
  deletedBy?: string;
  deletedAt: string;
}

function loadAll(): Tombstone[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(TOMBSTONE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Tombstone[]) : [];
  } catch {
    return [];
  }
}

function saveAll(list: Tombstone[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOMBSTONE_KEY, JSON.stringify(list));
}

export function removeTombstones(predicate: (t: Tombstone) => boolean): number {
  const current = loadAll();
  const next = current.filter((t) => !predicate(t));
  const removed = current.length - next.length;
  if (removed > 0) {
    saveAll(next);
  }
  return removed;
}

export function addTombstones(
  domain: BusinessDomain,
  markers: string[],
  options?: { reason?: string; deletedBy?: string },
): Tombstone[] {
  const current = loadAll();
  const existing = new Set(current.filter((t) => t.domain === domain).map((t) => t.marker));
  const now = new Date().toISOString();

  const added: Tombstone[] = markers
    .filter(Boolean)
    .map((m) => String(m))
    .filter((m) => !existing.has(m))
    .map((m) => ({
      id: `${domain}-${m}-${Date.now()}`,
      domain,
      marker: m,
      reason: options?.reason,
      deletedBy: options?.deletedBy,
      deletedAt: now,
    }));

  if (added.length === 0) return [];
  saveAll([...added, ...current]);
  return added;
}

export function isDeleted(domain: BusinessDomain, marker: string): boolean {
  if (!marker) return false;
  return loadAll().some((t) => t.domain === domain && t.marker === marker);
}

export function filterNotDeleted<T>(
  domain: BusinessDomain,
  list: T[],
  markerGetter: (item: T) => string[],
): T[] {
  return list.filter((item) => {
    const markers = markerGetter(item).filter(Boolean).map((m) => String(m));
    return !markers.some((m) => isDeleted(domain, m));
  });
}

export function listTombstones(domain?: BusinessDomain): Tombstone[] {
  const all = loadAll();
  return domain ? all.filter((t) => t.domain === domain) : all;
}
