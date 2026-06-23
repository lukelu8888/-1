import { projectActionItemService } from '../../../lib/services/project/projectActionItemService'
import { projectMeetingService } from '../../../lib/services/project/projectMeetingService'
import { buildProjectAnchorFromMailThread } from './buildProjectAnchorFromMailThread'
import type { MailCandidateRecord, MailThreadDetail } from './types'

export function buildProjectActionItemFromMailThread({
  thread,
  candidate,
}: {
  thread: MailThreadDetail
  candidate: MailCandidateRecord
}) {
  const projectAnchor = buildProjectAnchorFromMailThread(thread)
  const latestMeeting = projectMeetingService
    .listByProject(projectAnchor.projectId, projectAnchor.projectRevisionId)
    .sort((left, right) => right.meetingTime.localeCompare(left.meetingTime))[0]

  return projectActionItemService.create({
    projectId: projectAnchor.projectId,
    projectRevisionId: projectAnchor.projectRevisionId,
    meetingId: latestMeeting?.id || null,
    title: thread.subject.trim(),
    description: [thread.snippet, candidate.candidateSummary].filter(Boolean).join(' | '),
    owner: thread.ownerLabel || 'Project Owner',
    dueAt: null,
    status: 'open',
  })
}
