import { supabase } from '../supabase'

const ADMIN_ACCOUNT_IDENTITY_AUDIT_LOCAL_KEY = 'cosun_admin_account_identity_audit_logs_v1'
const ADMIN_ACCOUNT_IDENTITY_AUDIT_LOCAL_LIMIT = 200

export type AdminAccountIdentityAuditRecord = {
  id: string
  changedAt: string
  accountId: string
  employeeId: string
  employeeNo: string
  employeeName: string
  actorName: string
  actorEmail: string
  previousUsername: string
  nextUsername: string
  previousLoginEmail: string
  nextLoginEmail: string
  reason: string
  authSyncRequired: boolean
  passwordResetRequired: boolean
}

export type RecordAdminAccountIdentityAuditInput = Omit<AdminAccountIdentityAuditRecord, 'id' | 'changedAt'> & {
  changedAt?: string | null
}

function buildSupabaseError(context: string, error: any) {
  return new Error(`${context} failed: ${String(error?.message || error || 'Unknown Supabase error').trim()}`)
}

function normalizeAuditRecord(
  input: RecordAdminAccountIdentityAuditInput,
): AdminAccountIdentityAuditRecord {
  const changedAt = String(input.changedAt || new Date().toISOString()).trim() || new Date().toISOString()
  const accountId = String(input.accountId || '').trim()
  const employeeId = String(input.employeeId || '').trim()
  const previousLoginEmail = String(input.previousLoginEmail || '').trim().toLowerCase()
  const nextLoginEmail = String(input.nextLoginEmail || '').trim().toLowerCase()

  return {
    id: `${changedAt}:${accountId || employeeId || nextLoginEmail || 'unknown'}`,
    changedAt,
    accountId,
    employeeId,
    employeeNo: String(input.employeeNo || '').trim(),
    employeeName: String(input.employeeName || '').trim(),
    actorName: String(input.actorName || '').trim(),
    actorEmail: String(input.actorEmail || '').trim().toLowerCase(),
    previousUsername: String(input.previousUsername || '').trim(),
    nextUsername: String(input.nextUsername || '').trim(),
    previousLoginEmail,
    nextLoginEmail,
    reason: String(input.reason || '').trim(),
    authSyncRequired: Boolean(input.authSyncRequired),
    passwordResetRequired: Boolean(input.passwordResetRequired),
  }
}

function loadLocalAuditRecords(): AdminAccountIdentityAuditRecord[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(ADMIN_ACCOUNT_IDENTITY_AUDIT_LOCAL_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function persistLocalAuditRecords(records: AdminAccountIdentityAuditRecord[]) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(
      ADMIN_ACCOUNT_IDENTITY_AUDIT_LOCAL_KEY,
      JSON.stringify(records.slice(0, ADMIN_ACCOUNT_IDENTITY_AUDIT_LOCAL_LIMIT)),
    )
  } catch {
    // ignore local persistence failures
  }
}

function saveLocalAuditRecord(record: AdminAccountIdentityAuditRecord) {
  const deduped = [
    record,
    ...loadLocalAuditRecords().filter((item) => item.id !== record.id),
  ]
  persistLocalAuditRecords(
    deduped.sort((left, right) => String(right.changedAt).localeCompare(String(left.changedAt))),
  )
}

function fromAuditRow(row: any): AdminAccountIdentityAuditRecord | null {
  if (!row) return null
  const changedAt = String(row.changed_at || '').trim()
  if (!changedAt) return null

  return {
    id: String(row.id || `${changedAt}:${row.account_id || row.employee_id || row.next_login_email || 'unknown'}`),
    changedAt,
    accountId: String(row.account_id || '').trim(),
    employeeId: String(row.employee_id || '').trim(),
    employeeNo: String(row.employee_no || '').trim(),
    employeeName: String(row.employee_name || '').trim(),
    actorName: String(row.actor_name || '').trim(),
    actorEmail: String(row.actor_email || '').trim().toLowerCase(),
    previousUsername: String(row.previous_username || '').trim(),
    nextUsername: String(row.next_username || '').trim(),
    previousLoginEmail: String(row.previous_login_email || '').trim().toLowerCase(),
    nextLoginEmail: String(row.next_login_email || '').trim().toLowerCase(),
    reason: String(row.reason || '').trim(),
    authSyncRequired: Boolean(row.auth_sync_required),
    passwordResetRequired: Boolean(row.password_reset_required),
  }
}

export const adminAccountIdentityAuditService = {
  async record(input: RecordAdminAccountIdentityAuditInput): Promise<AdminAccountIdentityAuditRecord> {
    const record = normalizeAuditRecord(input)
    saveLocalAuditRecord(record)

    try {
      const { error } = await supabase.from('admin_account_identity_audit_logs').insert({
        changed_at: record.changedAt,
        account_id: record.accountId || null,
        employee_id: record.employeeId || null,
        employee_no: record.employeeNo || null,
        employee_name: record.employeeName || null,
        actor_name: record.actorName || null,
        actor_email: record.actorEmail || null,
        previous_username: record.previousUsername || null,
        next_username: record.nextUsername || null,
        previous_login_email: record.previousLoginEmail || null,
        next_login_email: record.nextLoginEmail || null,
        reason: record.reason || null,
        auth_sync_required: record.authSyncRequired,
        password_reset_required: record.passwordResetRequired,
      })

      if (error) throw error
    } catch (error) {
      console.warn('[adminAccountIdentityAuditService] remote record fallback to local cache:', error)
    }

    return record
  },

  async listRecent(limit = 50): Promise<AdminAccountIdentityAuditRecord[]> {
    try {
      const { data, error } = await supabase
        .from('admin_account_identity_audit_logs')
        .select(`
          id,
          changed_at,
          account_id,
          employee_id,
          employee_no,
          employee_name,
          actor_name,
          actor_email,
          previous_username,
          next_username,
          previous_login_email,
          next_login_email,
          reason,
          auth_sync_required,
          password_reset_required
        `)
        .order('changed_at', { ascending: false })
        .limit(limit)

      if (error) throw buildSupabaseError('load recent admin account identity audits', error)

      const rows = Array.isArray(data)
        ? data.map(fromAuditRow).filter(Boolean) as AdminAccountIdentityAuditRecord[]
        : []

      if (rows.length > 0) {
        persistLocalAuditRecords(rows)
        return rows
      }
    } catch (error) {
      console.warn('[adminAccountIdentityAuditService] listRecent fallback to local cache:', error)
    }

    return loadLocalAuditRecords().slice(0, limit)
  },
}
