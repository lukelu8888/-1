const ADMIN_ORG_SNAPSHOT_KEY = 'cosun_admin_org_snapshots_v1'
const MAX_ADMIN_ORG_SNAPSHOTS = 20

export type AdminOrganizationSnapshot = {
  id: string
  createdAt: string
  source: 'manual_save' | 'auto_heal' | 'bootstrap'
  summary: string
  payload: Record<string, any>
}

const loadSnapshots = (): AdminOrganizationSnapshot[] => {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(ADMIN_ORG_SNAPSHOT_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const persistSnapshots = (snapshots: AdminOrganizationSnapshot[]) => {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(ADMIN_ORG_SNAPSHOT_KEY, JSON.stringify(snapshots))
  } catch {
    // ignore snapshot cache failures
  }
}

const buildSummary = (payload: Record<string, any>) => {
  const contacts = Array.isArray(payload?.internalContacts) ? payload.internalContacts.length : 0
  const accounts = Array.isArray(payload?.internalAccounts) ? payload.internalAccounts.length : 0
  return `${contacts} contacts / ${accounts} accounts`
}

export const adminOrganizationSnapshotService = {
  list(): AdminOrganizationSnapshot[] {
    return loadSnapshots()
  },

  latest(): AdminOrganizationSnapshot | null {
    return loadSnapshots()[0] || null
  },

  save(source: AdminOrganizationSnapshot['source'], payload: Record<string, any>) {
    const nextSnapshot: AdminOrganizationSnapshot = {
      id: `admin-org-snapshot-${Date.now()}`,
      createdAt: new Date().toISOString(),
      source,
      summary: buildSummary(payload),
      payload,
    }
    const nextSnapshots = [nextSnapshot, ...loadSnapshots()].slice(0, MAX_ADMIN_ORG_SNAPSHOTS)
    persistSnapshots(nextSnapshots)
    return nextSnapshot
  },
}
