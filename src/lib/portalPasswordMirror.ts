export type ExternalPortalType = 'customer' | 'supplier' | 'third_party';
export type PortalPasswordMirrorStatus = 'active' | 'notified' | 'invalid' | 'cleared';
export type PortalPasswordMirrorSource = 'user_self_set' | 'login_capture' | 'manual_sync';

export interface PortalPasswordMirrorRecord {
  id: string;
  portalType: ExternalPortalType;
  loginEmail: string;
  displayName: string;
  password: string;
  updatedAt: string;
  source: PortalPasswordMirrorSource;
  status: PortalPasswordMirrorStatus;
  notifiedAt?: string;
  clearedAt?: string;
}

const PORTAL_PASSWORD_MIRROR_KEY = 'cosun_portal_password_mirror_v1';

function normalizeEmail(value: string): string {
  return String(value || '').trim().toLowerCase();
}

function loadMirrorRecords(): PortalPasswordMirrorRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(PORTAL_PASSWORD_MIRROR_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((item) => {
      if (
        !item ||
        typeof item !== 'object' ||
        typeof item.id !== 'string' ||
        typeof item.portalType !== 'string' ||
        typeof item.loginEmail !== 'string' ||
        typeof item.password !== 'string'
      ) {
        return [];
      }

      const normalizedRecord: PortalPasswordMirrorRecord = {
        id: item.id,
        portalType: item.portalType as ExternalPortalType,
        loginEmail: normalizeEmail(item.loginEmail),
        displayName: typeof item.displayName === 'string' ? item.displayName : '',
        password: item.password,
        updatedAt: typeof item.updatedAt === 'string' && item.updatedAt ? item.updatedAt : new Date(0).toISOString(),
        source: item.source === 'login_capture' || item.source === 'manual_sync' ? item.source : 'user_self_set',
        status: item.status === 'notified' || item.status === 'invalid' || item.status === 'cleared' ? item.status : 'active',
        notifiedAt: typeof item.notifiedAt === 'string' ? item.notifiedAt : undefined,
        clearedAt: typeof item.clearedAt === 'string' ? item.clearedAt : undefined,
      };

      return [normalizedRecord];
    });
  } catch {
    return [];
  }
}

function saveMirrorRecords(records: PortalPasswordMirrorRecord[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(PORTAL_PASSWORD_MIRROR_KEY, JSON.stringify(records));
}

export function upsertPortalPasswordMirror(input: {
  portalType: ExternalPortalType;
  loginEmail: string;
  displayName?: string;
  password: string;
  source?: PortalPasswordMirrorSource;
}) {
  const loginEmail = normalizeEmail(input.loginEmail);
  if (!loginEmail || !input.password) return;

  const existingRecord = loadMirrorRecords().find(
    (record) => record.portalType === input.portalType && record.loginEmail === loginEmail,
  );

  const nextRecord: PortalPasswordMirrorRecord = {
    id: `${input.portalType}:${loginEmail}`,
    portalType: input.portalType,
    loginEmail,
    displayName: String(input.displayName || existingRecord?.displayName || '').trim(),
    password: input.password,
    updatedAt: new Date().toISOString(),
    source: input.source || existingRecord?.source || 'user_self_set',
    status: 'active',
    notifiedAt: undefined,
    clearedAt: undefined,
  };

  const records = loadMirrorRecords();
  const nextRecords = records.filter((record) => record.id !== nextRecord.id);
  nextRecords.unshift(nextRecord);
  saveMirrorRecords(nextRecords);
}

export function getPortalPasswordMirrorByEmail(portalType: ExternalPortalType, loginEmail: string) {
  const normalized = normalizeEmail(loginEmail);
  if (!normalized) return null;
  return loadMirrorRecords().find((record) => record.portalType === portalType && record.loginEmail === normalized) || null;
}

export function listPortalPasswordMirrors() {
  return loadMirrorRecords();
}

function patchPortalPasswordMirror(
  id: string,
  updater: (record: PortalPasswordMirrorRecord) => PortalPasswordMirrorRecord,
) {
  const records = loadMirrorRecords();
  const nextRecords = records.map((record) => (record.id === id ? updater(record) : record));
  saveMirrorRecords(nextRecords);
}

export function markPortalPasswordMirrorNotified(id: string) {
  patchPortalPasswordMirror(id, (record) => ({
    ...record,
    status: record.status === 'cleared' ? 'cleared' : 'notified',
    notifiedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));
}

export function resyncPortalPasswordMirror(id: string) {
  patchPortalPasswordMirror(id, (record) => ({
    ...record,
    status: 'active',
    source: 'manual_sync',
    clearedAt: undefined,
    updatedAt: new Date().toISOString(),
  }));
}

export function invalidatePortalPasswordMirror(id: string) {
  patchPortalPasswordMirror(id, (record) => ({
    ...record,
    status: 'invalid',
    updatedAt: new Date().toISOString(),
  }));
}

export function clearPortalPasswordMirror(id: string) {
  patchPortalPasswordMirror(id, (record) => ({
    ...record,
    status: 'cleared',
    clearedAt: new Date().toISOString(),
    password: '',
    updatedAt: new Date().toISOString(),
  }));
}
