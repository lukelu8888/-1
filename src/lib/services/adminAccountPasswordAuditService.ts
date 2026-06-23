import { supabase } from '../supabase'

const ADMIN_ACCOUNT_PASSWORD_AUDIT_LOCAL_KEY = 'cosun_admin_account_password_audit_logs_v1'
const ADMIN_ACCOUNT_PASSWORD_AUDIT_LOCAL_LIMIT = 200

export type AdminAccountPasswordAuditAction = 'manual_set' | 'reset'

export type AdminAccountPasswordAuditRecord = {
  id: string
  changedAt: string
  action: AdminAccountPasswordAuditAction
  accountId: string
  employeeId: string
  employeeNo: string
  employeeName: string
  username: string
  loginEmail: string
  actorName: string
  actorEmail: string
  forcePasswordReset: boolean
  reason: string
}

export type RecordAdminAccountPasswordAuditInput = Omit<AdminAccountPasswordAuditRecord, 'id' | 'changedAt'> & {
  changedAt?: string | null
}

function buildSupabaseError(context: string, error: any) {
  return new Error(`${context} failed: ${String(error?.message || error || 'Unknown Supabase error').trim()}`)
}

function normalizeAuditRecord(
  input: RecordAdminAccountPasswordAuditInput,
): AdminAccountPasswordAuditRecord {
  const changedAt = String(input.changedAt || new Date().toISOString()).trim() || new Date().toISOString()
  const accountId = String(input.accountId || '').trim()
  const employeeId = String(input.employeeId || '').trim()
  const loginEmail = String(input.loginEmail || '').trim().toLowerCase()
  const action: AdminAccountPasswordAuditAction = input.action === 'manual_set' ? 'manual_set' : 'reset'

  return {
    id: `${changedAt}:${accountId || employeeId || loginEmail || 'unknown'}:${action}`,
    changedAt,
    action,
    accountId,
    employeeId,
    employeeNo: String(input.employeeNo || '').trim(),
    employeeName: String(input.employeeName || '').trim(),
    username: String(input.username || '').trim(),
    loginEmail,
    actorName: String(input.actorName || '').trim(),
    actorEmail: String(input.actorEmail || '').trim().toLowerCase(),
    forcePasswordReset: Boolean(input.forcePasswordReset),
    reason: String(input.reason || '').trim(),
  }
}

function loadLocalAuditRecords(): AdminAccountPasswordAuditRecord[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(ADMIN_ACCOUNT_PASSWORD_AUDIT_LOCAL_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function persistLocalAuditRecords(records: AdminAccountPasswordAuditRecord[]) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(
      ADMIN_ACCOUNT_PASSWORD_AUDIT_LOCAL_KEY,
      JSON.stringify(records.slice(0, ADMIN_ACCOUNT_PASSWORD_AUDIT_LOCAL_LIMIT)),
    )
  } catch {
    // ignore local persistence failures
  }
}

function saveLocalAuditRecord(record: AdminAccountPasswordAuditRecord) {
  const deduped = [
    record,
    ...loadLocalAuditRecords().filter((item) => item.id !== record.id),
  ]
  persistLocalAuditRecords(
    deduped.sort((left, right) => String(right.changedAt).localeCompare(String(left.changedAt))),
  )
}

function fromAuditRow(row: any): AdminAccountPasswordAuditRecord | null {
  if (!row) return null
  const changedAt = String(row.changed_at || '').trim()
  if (!changedAt) return null

  return {
    id: String(row.id || `${changedAt}:${row.account_id || row.employee_id || row.login_email || 'unknown'}`),
    changedAt,
    action: row.action === 'manual_set' ? 'manual_set' : 'reset',
    accountId: String(row.account_id || '').trim(),
    employeeId: String(row.employee_id || '').trim(),
    employeeNo: String(row.employee_no || '').trim(),
    employeeName: String(row.employee_name || '').trim(),
    username: String(row.username || '').trim(),
    loginEmail: String(row.login_email || '').trim().toLowerCase(),
    actorName: String(row.actor_name || '').trim(),
    actorEmail: String(row.actor_email || '').trim().toLowerCase(),
    forcePasswordReset: Boolean(row.force_password_reset),
    reason: String(row.reason || '').trim(),
  }
}

export const adminAccountPasswordAuditService = {
  async record(input: RecordAdminAccountPasswordAuditInput): Promise<AdminAccountPasswordAuditRecord> {
    const record = normalizeAuditRecord(input)
    saveLocalAuditRecord(record)

    try {
      const { error } = await supabase.from('admin_account_password_audit_logs').insert({
        changed_at: record.changedAt,
        action: record.action,
        account_id: record.accountId || null,
        employee_id: record.employeeId || null,
        employee_no: record.employeeNo || null,
        employee_name: record.employeeName || null,
        username: record.username || null,
        login_email: record.loginEmail || null,
        actor_name: record.actorName || null,
        actor_email: record.actorEmail || null,
        force_password_reset: record.forcePasswordReset,
        reason: record.reason || null,
      })

      if (error) throw buildSupabaseError('record admin account password audit', error)
    } catch (error) {
      console.warn('[adminAccountPasswordAuditService] remote record fallback to local cache:', error)
    }

    return record
  },

  async listRecent(limit = 50): Promise<AdminAccountPasswordAuditRecord[]> {
    try {
      const { data, error } = await supabase
        .from('admin_account_password_audit_logs')
        .select(`
          id,
          changed_at,
          action,
          account_id,
          employee_id,
          employee_no,
          employee_name,
          username,
          login_email,
          actor_name,
          actor_email,
          force_password_reset,
          reason
        `)
        .order('changed_at', { ascending: false })
        .limit(limit)

      if (error) throw buildSupabaseError('load recent admin account password audits', error)

      const rows = Array.isArray(data)
        ? data.map(fromAuditRow).filter(Boolean) as AdminAccountPasswordAuditRecord[]
        : []

      if (rows.length > 0) {
        persistLocalAuditRecords(rows)
        return rows
      }
    } catch (error) {
      console.warn('[adminAccountPasswordAuditService] listRecent fallback to local cache:', error)
    }

    return loadLocalAuditRecords().slice(0, limit)
  },
}
