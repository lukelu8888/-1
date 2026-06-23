import type { User } from '../rbac-config';

const ROLE_SWITCH_AUDIT_KEY = 'cosun_role_switch_audit_logs_v1';
const ROLE_SWITCH_AUDIT_LIMIT = 200;

export type RoleSwitchAuditRecord = {
  id: string;
  switchedAt: string;
  authenticatedEmail: string;
  authenticatedName: string;
  previousRole: string;
  previousEmail: string;
  nextRole: string;
  nextEmail: string;
  userAgent: string;
};

function loadRecords(): RoleSwitchAuditRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(ROLE_SWITCH_AUDIT_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveRecords(records: RoleSwitchAuditRecord[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ROLE_SWITCH_AUDIT_KEY, JSON.stringify(records.slice(0, ROLE_SWITCH_AUDIT_LIMIT)));
  } catch {
    // ignore persistence failures
  }
}

export const roleSwitcherAuditService = {
  record(params: {
    authenticatedUser: User | null;
    previousUser: User | null;
    nextUser: User;
  }) {
    const switchedAt = new Date().toISOString();
    const record: RoleSwitchAuditRecord = {
      id: `${switchedAt}:${params.authenticatedUser?.email || 'unknown'}:${params.nextUser.email}`,
      switchedAt,
      authenticatedEmail: params.authenticatedUser?.email || '',
      authenticatedName: params.authenticatedUser?.name || '',
      previousRole: params.previousUser?.role || '',
      previousEmail: params.previousUser?.email || '',
      nextRole: params.nextUser.role || '',
      nextEmail: params.nextUser.email || '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    };

    const records = [record, ...loadRecords().filter((item) => item.id !== record.id)];
    saveRecords(records);
    return record;
  },

  listRecent(limit = 50) {
    return loadRecords().slice(0, limit);
  },
};

