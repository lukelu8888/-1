import { supabase } from '../supabase'

const ADMIN_LOGIN_AUDIT_LOCAL_KEY = 'cosun_admin_login_audit_logs_v1'
const ADMIN_LOGIN_AUDIT_LOCAL_LIMIT = 200

export type AdminLoginAuditStatus = 'success' | 'failure'

export type AdminLoginAuditRecord = {
  id: string
  attemptedAt: string
  enteredIdentifier: string
  loginEmail: string
  normalizedLoginEmail: string
  authUserId: string
  adminName: string
  portalRole: string
  rbacRole: string
  region: string
  status: AdminLoginAuditStatus
  failureReason: string
  userAgent: string
}

export type RecordAdminLoginAuditInput = {
  attemptedAt?: string
  enteredIdentifier?: string | null
  loginEmail?: string | null
  normalizedLoginEmail?: string | null
  authUserId?: string | null
  adminName?: string | null
  portalRole?: string | null
  rbacRole?: string | null
  region?: string | null
  status: AdminLoginAuditStatus
  failureReason?: string | null
  userAgent?: string | null
}

function buildSupabaseError(context: string, error: any) {
  return new Error(`${context} failed: ${String(error?.message || error || 'Unknown Supabase error').trim()}`)
}

function normalizeAuditRecord(input: RecordAdminLoginAuditInput): AdminLoginAuditRecord {
  const attemptedAt = String(input.attemptedAt || new Date().toISOString()).trim() || new Date().toISOString()
  const enteredIdentifier = String(input.enteredIdentifier || '').trim()
  const loginEmail = String(input.loginEmail || '').trim().toLowerCase()
  const normalizedLoginEmail = String(input.normalizedLoginEmail || loginEmail).trim().toLowerCase()
  const authUserId = String(input.authUserId || '').trim()
  const adminName = String(input.adminName || '').trim()
  const portalRole = String(input.portalRole || 'admin').trim().toLowerCase()
  const rbacRole = String(input.rbacRole || '').trim()
  const region = String(input.region || '').trim()
  const failureReason = String(input.failureReason || '').trim()
  const userAgent = String(
    input.userAgent || (typeof navigator !== 'undefined' ? navigator.userAgent : ''),
  ).trim()

  return {
    id: `${attemptedAt}:${normalizedLoginEmail || enteredIdentifier || 'unknown'}:${input.status}`,
    attemptedAt,
    enteredIdentifier,
    loginEmail,
    normalizedLoginEmail,
    authUserId,
    adminName,
    portalRole,
    rbacRole,
    region,
    status: input.status,
    failureReason,
    userAgent,
  }
}

function loadLocalAuditRecords(): AdminLoginAuditRecord[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(ADMIN_LOGIN_AUDIT_LOCAL_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function persistLocalAuditRecords(records: AdminLoginAuditRecord[]) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(
      ADMIN_LOGIN_AUDIT_LOCAL_KEY,
      JSON.stringify(records.slice(0, ADMIN_LOGIN_AUDIT_LOCAL_LIMIT)),
    )
  } catch {
    // ignore local audit persistence failures
  }
}

function saveLocalAuditRecord(record: AdminLoginAuditRecord) {
  const deduped = [
    record,
    ...loadLocalAuditRecords().filter((item) => item.id !== record.id),
  ]
  persistLocalAuditRecords(
    deduped.sort((left, right) => String(right.attemptedAt).localeCompare(String(left.attemptedAt))),
  )
}

function fromAuditRow(row: any): AdminLoginAuditRecord | null {
  if (!row) return null
  const attemptedAt = String(row.attempted_at || '').trim()
  if (!attemptedAt) return null
  return {
    id: String(row.id || `${attemptedAt}:${row.normalized_login_email || row.login_email || 'unknown'}`),
    attemptedAt,
    enteredIdentifier: String(row.entered_identifier || ''),
    loginEmail: String(row.login_email || '').trim().toLowerCase(),
    normalizedLoginEmail: String(row.normalized_login_email || row.login_email || '').trim().toLowerCase(),
    authUserId: String(row.auth_user_id || ''),
    adminName: String(row.admin_name || ''),
    portalRole: String(row.portal_role || ''),
    rbacRole: String(row.rbac_role || ''),
    region: String(row.region || ''),
    status: row.status === 'failure' ? 'failure' : 'success',
    failureReason: String(row.failure_reason || ''),
    userAgent: String(row.user_agent || ''),
  }
}

export const adminLoginAuditService = {
  async record(input: RecordAdminLoginAuditInput): Promise<AdminLoginAuditRecord> {
    const record = normalizeAuditRecord(input)
    saveLocalAuditRecord(record)

    try {
      const { error } = await supabase.from('admin_login_audit_logs').insert({
        attempted_at: record.attemptedAt,
        entered_identifier: record.enteredIdentifier || null,
        login_email: record.loginEmail || null,
        normalized_login_email: record.normalizedLoginEmail || null,
        auth_user_id: record.authUserId || null,
        admin_name: record.adminName || null,
        portal_role: record.portalRole || null,
        rbac_role: record.rbacRole || null,
        region: record.region || null,
        status: record.status,
        failure_reason: record.failureReason || null,
        user_agent: record.userAgent || null,
      })

      if (error) throw buildSupabaseError('record admin login audit', error)
    } catch (error) {
      console.warn('[adminLoginAuditService] remote record fallback to local cache:', error)
    }

    return record
  },

  async listRecent(limit = 50): Promise<AdminLoginAuditRecord[]> {
    try {
      const { data, error } = await supabase
        .from('admin_login_audit_logs')
        .select(`
          id,
          attempted_at,
          entered_identifier,
          login_email,
          normalized_login_email,
          auth_user_id,
          admin_name,
          portal_role,
          rbac_role,
          region,
          status,
          failure_reason,
          user_agent
        `)
        .order('attempted_at', { ascending: false })
        .limit(limit)

      if (error) throw buildSupabaseError('load recent admin login audits', error)

      const rows = Array.isArray(data)
        ? data.map(fromAuditRow).filter(Boolean) as AdminLoginAuditRecord[]
        : []

      if (rows.length > 0) {
        persistLocalAuditRecords(rows)
        return rows
      }
    } catch (error) {
      console.warn('[adminLoginAuditService] listRecent fallback to local cache:', error)
    }

    return loadLocalAuditRecords().slice(0, limit)
  },
}
