import { supabase } from '../supabase'

type AuditAction = 'create' | 'update' | 'delete' | 'approve' | 'reject' | 'forward' | 'cancel'

type AuditActor = {
  actorId?: string | null
  actorEmail?: string | null
  actorRole?: string | null
}

type AuditInput = {
  entityType: string
  entityId: string | null | undefined
  action: AuditAction
  before?: Record<string, any> | null
  after?: Record<string, any> | null
  actor?: AuditActor | null
  source?: string | null
}

function normalizeForCompare(value: any): any {
  if (value === undefined) return null
  if (Array.isArray(value)) return value.map(normalizeForCompare)
  if (value && typeof value === 'object') {
    return Object.keys(value)
      .sort()
      .reduce<Record<string, any>>((acc, key) => {
        acc[key] = normalizeForCompare(value[key])
        return acc
      }, {})
  }
  return value
}

function safeStringify(value: any): string {
  try {
    return JSON.stringify(normalizeForCompare(value))
  } catch {
    return String(value)
  }
}

function buildChangedFields(before?: Record<string, any> | null, after?: Record<string, any> | null) {
  const previous = before || {}
  const next = after || {}
  const changedFields: Record<string, { before: any; after: any }> = {}
  const keys = new Set([...Object.keys(previous), ...Object.keys(next)])

  keys.forEach((key) => {
    if (safeStringify(previous[key]) !== safeStringify(next[key])) {
      changedFields[key] = {
        before: previous[key] ?? null,
        after: next[key] ?? null,
      }
    }
  })

  return changedFields
}

function resolveActor(input?: AuditActor | null) {
  return {
    actor_id: input?.actorId || null,
    actor_email: String(input?.actorEmail || '').trim().toLowerCase(),
    actor_role: String(input?.actorRole || '').trim(),
  }
}

export const auditLogService = {
  async logEntityChange(input: AuditInput) {
    const entityId = String(input.entityId || '').trim()
    if (!entityId) return

    const changedFields = buildChangedFields(input.before, input.after)
    if (input.action !== 'create' && Object.keys(changedFields).length === 0) return

    const actor = resolveActor(input.actor)
    const { error } = await supabase.from('audit_logs').insert({
      entity_type: input.entityType,
      entity_id: entityId,
      actor_id: actor.actor_id,
      actor_email: actor.actor_email,
      actor_role: actor.actor_role,
      action: input.action,
      changed_fields: changedFields,
      source: input.source || 'internal',
    })

    if (error) {
      console.warn('[auditLogService] failed to insert audit log:', error?.message || error)
    }
  },
}
