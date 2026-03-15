import type { ProductSnapshotType, ProductSnapshotTypeCode, SnapshotEnvelope } from './types';

const SNAPSHOT_TYPE_CODES: Record<ProductSnapshotType, ProductSnapshotTypeCode> = {
  inquiry: 'INQ',
  quotation: 'QT',
  order: 'ORD',
  procurement: 'PRC',
};

const pad = (value: number) => String(value).padStart(2, '0');

const formatSnapshotDate = (value: string | Date) => {
  const date = value instanceof Date ? value : new Date(value);
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`;
};

const buildSnapshotToken = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID().replace(/-/g, '').slice(0, 12).toUpperCase();
  }

  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
    .replace(/[^A-Z0-9]/gi, '')
    .slice(0, 12)
    .toUpperCase();
};

export const buildSnapshotId = (snapshotType: ProductSnapshotType, snapshotAt: string | Date) =>
  `SNP-${SNAPSHOT_TYPE_CODES[snapshotType]}-${formatSnapshotDate(snapshotAt)}-${buildSnapshotToken()}`;

export const nextSnapshotVersion = (
  previousSnapshot?: Pick<SnapshotEnvelope, 'snapshotType' | 'snapshotVersion'> | null,
  nextSnapshotType?: ProductSnapshotType,
) => {
  if (!previousSnapshot || !nextSnapshotType) return 1;
  return previousSnapshot.snapshotType === nextSnapshotType
    ? Number(previousSnapshot.snapshotVersion || 0) + 1
    : 1;
};

export const buildRootSnapshotEnvelope = (
  snapshotType: ProductSnapshotType,
  snapshotAt = new Date().toISOString(),
): SnapshotEnvelope => ({
  snapshotId: buildSnapshotId(snapshotType, snapshotAt),
  snapshotType,
  snapshotVersion: 1,
  derivedFromSnapshotId: null,
  snapshotAt,
});

export const buildDerivedSnapshotEnvelope = (
  snapshotType: ProductSnapshotType,
  derivedFrom:
    | Pick<SnapshotEnvelope, 'snapshotId' | 'snapshotType' | 'snapshotVersion'>
    | null
    | undefined,
  snapshotAt = new Date().toISOString(),
): SnapshotEnvelope => ({
  snapshotId: buildSnapshotId(snapshotType, snapshotAt),
  snapshotType,
  snapshotVersion: nextSnapshotVersion(derivedFrom || null, snapshotType),
  derivedFromSnapshotId: derivedFrom?.snapshotId || null,
  snapshotAt,
});
