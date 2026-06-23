import { projectMeetingService } from '../../../lib/services/project/projectMeetingService'
import { buildProjectAnchorFromMailThread } from './buildProjectAnchorFromMailThread'
import type { MailCandidateRecord, MailThreadDetail } from './types'

function inferMeetingType(text: string) {
  const normalized = text.toLowerCase()
  if (normalized.includes('drawing') || normalized.includes('图纸')) return 'drawing_review' as const
  if (normalized.includes('shipment') || normalized.includes('出货')) return 'shipment_coordination' as const
  if (normalized.includes('fat')) return 'fat_preparation' as const
  if (normalized.includes('sat')) return 'sat_issue_review' as const
  if (normalized.includes('acceptance') || normalized.includes('验收')) return 'final_acceptance' as const
  if (normalized.includes('clarification') || normalized.includes('澄清')) return 'requirement_clarification' as const
  return 'weekly_sync' as const
}

export function buildProjectMeetingFromMailThread({
  thread,
  candidate,
}: {
  thread: MailThreadDetail
  candidate: MailCandidateRecord
}) {
  const projectAnchor = buildProjectAnchorFromMailThread(thread)
  const sourceText = [thread.subject, thread.snippet, candidate.candidateSummary].filter(Boolean).join(' ')

  return projectMeetingService.create({
    projectId: projectAnchor.projectId,
    projectRevisionId: projectAnchor.projectRevisionId,
    projectCode: projectAnchor.projectCode,
    projectName: projectAnchor.projectName,
    meetingType: inferMeetingType(sourceText),
    meetingTitle: thread.subject.trim(),
    meetingTime: thread.latestMessageAt,
    participants: thread.participants,
    meetingSummary: [thread.snippet, candidate.candidateSummary].filter(Boolean).join(' | '),
    minutesStatus: 'issued',
    minutesUrl: null,
  })
}
