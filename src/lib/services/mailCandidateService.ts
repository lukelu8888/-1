import type {
  MailCandidateRecord,
  MailCandidateStatus,
  MailCandidateType,
} from '../../components/admin/mail-workbench/types'

const STORAGE_KEY = 'mailWorkbench.candidates.v1'

const DEMO_CANDIDATES: MailCandidateRecord[] = [
  {
    id: 'candidate-001',
    threadId: 'mail-thread-001',
    candidateType: 'repeat_quote',
    suggestedTargetObjectType: 'quotation_draft',
    candidateSummary: '识别为老客户翻单询价，建议带出历史产品与最近报价。',
    status: 'pending_confirmation',
  },
  {
    id: 'candidate-002',
    threadId: 'mail-thread-002',
    candidateType: 'project_meeting',
    suggestedTargetObjectType: 'project_meeting',
    candidateSummary: '识别为项目周会/图纸评审邮件，建议转项目会议纪要。',
    status: 'draft',
  },
]

function loadCandidates(): MailCandidateRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEMO_CANDIDATES))
      return DEMO_CANDIDATES
    }
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : DEMO_CANDIDATES
  } catch {
    return DEMO_CANDIDATES
  }
}

function persistCandidates(items: MailCandidateRecord[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

export const mailCandidateService = {
  listByThread(threadId: string): MailCandidateRecord[] {
    return loadCandidates().filter((item) => item.threadId === threadId)
  },

  create(threadId: string, candidateType: MailCandidateType, summary: string, targetType: string) {
    const next: MailCandidateRecord = {
      id: `candidate-${crypto.randomUUID()}`,
      threadId,
      candidateType,
      suggestedTargetObjectType: targetType,
      candidateSummary: summary,
      status: 'draft',
    }
    persistCandidates([next, ...loadCandidates()])
    return next
  },

  updateStatus(candidateId: string, status: MailCandidateStatus) {
    persistCandidates(loadCandidates().map((item) => (item.id === candidateId ? { ...item, status } : item)))
  },

  markConverted(candidateId: string, targetObjectId: string, confirmedBy?: string) {
    const confirmedAt = new Date().toISOString()
    persistCandidates(
      loadCandidates().map((item) =>
        item.id === candidateId
          ? {
              ...item,
              status: 'converted',
              confirmedTargetObjectId: targetObjectId,
              confirmedBy: confirmedBy || item.confirmedBy,
              confirmedAt,
            }
          : item,
      ),
    )
  },
}
