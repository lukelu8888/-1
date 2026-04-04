import { supabase } from '../supabase'
import { staffDirectoryService } from './profileDirectoryServices'
import { deriveDeadlineEscalations, type DeadlineEscalationItem } from './deadlineEscalationService'
import {
  EMPTY_SALES_WORKFLOW_SOURCE_SNAPSHOT,
  loadSalesWorkflowSourceSnapshot,
  type SalesWorkflowSourceActor,
  type SalesWorkflowSourceSnapshot,
} from './salesWorkflowSourceService'

type NotificationInsert = {
  recipient_email: string
  title: string
  message: string
  type: string
  related_id: string | null
  related_type: string
  is_read?: boolean
}

export interface DeadlineEscalationDispatchResult {
  itemKey: string
  itemType: DeadlineEscalationItem['type']
  recipientEmail: string
  status: 'enqueued' | 'deduped' | 'failed'
  notificationType: string
  referenceId: string | null
  errorMessage?: string
}

export interface DeadlineEscalationFailure {
  itemKey: string
  itemType: DeadlineEscalationItem['type']
  recipientEmail: string
  stage: 'duplicate_check' | 'enqueue'
  errorMessage: string
}

export interface DeadlineEscalationExecutionResult {
  scanned: number
  enqueued: number
  deduped: number
  items: DeadlineEscalationItem[]
  ruleSummary: Record<DeadlineEscalationItem['type'], number>
  dispatchResults: DeadlineEscalationDispatchResult[]
  failures: DeadlineEscalationFailure[]
}

type StaffProfile = {
  email?: string | null
  name?: string | null
  rbacRole?: string | null
  region?: string | null
}

function normalizeEmail(value: unknown): string {
  return String(value || '').trim().toLowerCase()
}

function normalizeRegion(value: unknown): string {
  const raw = String(value || '').trim().toUpperCase()
  if (raw === 'NORTH AMERICA') return 'NA'
  if (raw === 'SOUTH AMERICA') return 'SA'
  if (raw === 'EUROPE & AFRICA' || raw === 'EMEA') return 'EA'
  return raw
}

function isOwnerEscalation(type: DeadlineEscalationItem['type']) {
  return [
    'ing_first_response_overdue',
    'qt_feedback_overdue',
    'sc_unsigned_overdue',
    'sc_deposit_overdue',
    'oa_due_warning',
    'da_maturity_warning',
    'usance_lc_maturity_warning',
  ].includes(type)
}

function isFinanceEscalation(type: DeadlineEscalationItem['type']) {
  return ['oa_due_warning', 'da_maturity_warning', 'usance_lc_maturity_warning', 'sc_deposit_overdue'].includes(type)
}

function inferOwnerRegion(item: DeadlineEscalationItem, staff: StaffProfile[]): string {
  const payloadRegion = normalizeRegion(item.payload?.region)
  if (payloadRegion) return payloadRegion
  const ownerEmail = normalizeEmail(item.owner)
  if (!ownerEmail) return ''
  return normalizeRegion(staff.find((row) => normalizeEmail(row.email) === ownerEmail)?.region)
}

async function resolveRecipients(item: DeadlineEscalationItem, snapshot: SalesWorkflowSourceSnapshot): Promise<string[]> {
  const staff = await staffDirectoryService.listSalesStaffByRegion().catch(() => [])
  const recipients = new Set<string>()
  const ownerEmail = normalizeEmail(item.owner)

  if (isOwnerEscalation(item.type) && ownerEmail) {
    recipients.add(ownerEmail)
  }

  const ownerRegion = inferOwnerRegion(item, staff)
  if (['ing_first_response_overdue', 'qt_feedback_overdue', 'sc_unsigned_overdue', 'sc_deposit_overdue'].includes(item.type)) {
    const regionalManager = ownerRegion
      ? await staffDirectoryService.findRegionalManagerByRegion(ownerRegion).catch(() => null)
      : null
    const regionalManagerEmail = normalizeEmail(regionalManager?.email)
    if (regionalManagerEmail) recipients.add(regionalManagerEmail)
  }

  if (isFinanceEscalation(item.type)) {
    staff
      .filter((row) => String(row?.rbacRole || '').trim() === 'Finance')
      .map((row) => normalizeEmail(row.email))
      .filter(Boolean)
      .forEach((email) => recipients.add(email))
  }

  if (!recipients.size) {
    const fallbackOwner = normalizeEmail(item.owner)
    if (fallbackOwner) recipients.add(fallbackOwner)
  }

  return Array.from(recipients)
}

function buildNotification(item: DeadlineEscalationItem, recipient: string): NotificationInsert {
  const dueText = item.dueAt ? `，节点时间：${item.dueAt}` : ''
  const overdueText = item.overdueHours != null ? `，已偏离 ${item.overdueHours}h` : ''
  return {
    recipient_email: recipient,
    title: item.title,
    message: `${item.title}${dueText}${overdueText}`,
    type: `deadline_${item.type}`,
    related_id: item.relatedNumber || item.key,
    related_type: 'deadline_escalation',
    is_read: false,
  }
}

async function hasRecentDuplicate(notification: NotificationInsert, nowIso: string): Promise<boolean> {
  const since = new Date(new Date(nowIso).getTime() - 1000 * 60 * 60 * 12).toISOString()
  const { data, error } = await supabase
    .from('notifications')
    .select('id')
    .eq('recipient_email', notification.recipient_email)
    .eq('type', notification.type)
    .eq('related_id', notification.related_id)
    .gte('created_at', since)
    .limit(1)
  if (error) {
    console.warn('[deadlineEscalationExecutionService] duplicate check failed:', error.message)
    return false
  }
  return Boolean(data?.length)
}

function buildRuleSummary(items: DeadlineEscalationItem[]): Record<DeadlineEscalationItem['type'], number> {
  return items.reduce((summary, item) => {
    summary[item.type] += 1
    return summary
  }, {
    ing_first_response_overdue: 0,
    qt_feedback_overdue: 0,
    sc_unsigned_overdue: 0,
    sc_deposit_overdue: 0,
    oa_due_warning: 0,
    da_maturity_warning: 0,
    usance_lc_maturity_warning: 0,
  } as Record<DeadlineEscalationItem['type'], number>)
}

export async function executeDeadlineEscalationRun(
  actor?: SalesWorkflowSourceActor,
  snapshot?: SalesWorkflowSourceSnapshot,
): Promise<DeadlineEscalationExecutionResult> {
  const sourceSnapshot = snapshot || await loadSalesWorkflowSourceSnapshot(actor).catch(() => EMPTY_SALES_WORKFLOW_SOURCE_SNAPSHOT)
  const summary = deriveDeadlineEscalations(sourceSnapshot)
  const nowIso = new Date().toISOString()

  let enqueued = 0
  let deduped = 0
  const dispatchResults: DeadlineEscalationDispatchResult[] = []
  const failures: DeadlineEscalationFailure[] = []

  for (const item of summary.items) {
    const recipients = await resolveRecipients(item, sourceSnapshot)
    for (const recipient of recipients) {
      const notification = buildNotification(item, recipient)
      let duplicated = false
      try {
        duplicated = await hasRecentDuplicate(notification, nowIso)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        failures.push({
          itemKey: item.key,
          itemType: item.type,
          recipientEmail: recipient,
          stage: 'duplicate_check',
          errorMessage,
        })
        dispatchResults.push({
          itemKey: item.key,
          itemType: item.type,
          recipientEmail: recipient,
          status: 'failed',
          notificationType: notification.type,
          referenceId: notification.related_id,
          errorMessage,
        })
        continue
      }
      if (duplicated) {
        deduped += 1
        dispatchResults.push({
          itemKey: item.key,
          itemType: item.type,
          recipientEmail: recipient,
          status: 'deduped',
          notificationType: notification.type,
          referenceId: notification.related_id,
        })
        continue
      }

      const { error } = await supabase.from('notifications').insert(notification)
      if (error) {
        console.warn('[deadlineEscalationExecutionService] failed to enqueue notification:', error.message)
        failures.push({
          itemKey: item.key,
          itemType: item.type,
          recipientEmail: recipient,
          stage: 'enqueue',
          errorMessage: error.message,
        })
        dispatchResults.push({
          itemKey: item.key,
          itemType: item.type,
          recipientEmail: recipient,
          status: 'failed',
          notificationType: notification.type,
          referenceId: notification.related_id,
          errorMessage: error.message,
        })
        continue
      }
      enqueued += 1
      dispatchResults.push({
        itemKey: item.key,
        itemType: item.type,
        recipientEmail: recipient,
        status: 'enqueued',
        notificationType: notification.type,
        referenceId: notification.related_id,
      })
    }
  }

  return {
    scanned: summary.items.length,
    enqueued,
    deduped,
    items: summary.items,
    ruleSummary: buildRuleSummary(summary.items),
    dispatchResults,
    failures,
  }
}
