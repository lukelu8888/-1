import { documentTaskService } from '../../../lib/services/document-task/documentTaskService'
import type { MailCandidateRecord, MailThreadDetail } from './types'

function inferDocCode(text: string) {
  const matched = text.toUpperCase().match(/\bD\d{2}\b/)
  return matched?.[0] || null
}

function inferPriority(text: string) {
  const normalized = text.toLowerCase()
  if (normalized.includes('urgent') || normalized.includes('加急') || normalized.includes('asap')) {
    return 'critical' as const
  }
  if (normalized.includes('missing') || normalized.includes('待补') || normalized.includes('follow up')) {
    return 'high' as const
  }
  return 'normal' as const
}

function inferDueAt(priority: 'normal' | 'high' | 'critical') {
  const now = new Date()
  const dayOffset = priority === 'critical' ? 1 : priority === 'high' ? 2 : 5
  now.setDate(now.getDate() + dayOffset)
  return now.toISOString()
}

export function buildDocumentTaskFromMailThread({
  thread,
  candidate,
}: {
  thread: MailThreadDetail
  candidate: MailCandidateRecord
}) {
  const sourceText = [thread.subject, thread.snippet, candidate.candidateSummary].filter(Boolean).join(' | ')
  const priority = inferPriority(sourceText)

  return documentTaskService.create({
    sourceMailThreadId: thread.id,
    projectCode: thread.linkedProjectName || null,
    orderId: thread.linkedOrderNumber || null,
    contractNo: thread.linkedOrderNumber || null,
    docCode: inferDocCode(sourceText),
    taskTitle: thread.subject.trim(),
    taskSummary: sourceText,
    ownerDepartment: 'Documentation',
    ownerRole: 'Documentation_Officer',
    priority,
    dueAt: inferDueAt(priority),
    status: 'open',
  })
}
