export type MailThreadStatus =
  | 'new'
  | 'triaging'
  | 'assigned'
  | 'linked'
  | 'resolved'
  | 'closed'
  | 'escalated'

export type MailDispatchStatus =
  | 'pending_department_pickup'
  | 'accepted'
  | 'reassigned'
  | 'resolved'
  | 'closed'
  | 'escalated'

export type MailCandidateStatus =
  | 'draft'
  | 'pending_confirmation'
  | 'confirmed'
  | 'converted'
  | 'rejected'
  | 'cancelled'

export type MailCandidateType =
  | 'ing'
  | 'repeat_quote'
  | 'repeat_direct_order'
  | 'project_meeting'
  | 'project_action_item'
  | 'export_service_order'
  | 'document_task'

export interface MailThreadAttachment {
  id: string
  fileName: string
  fileType: string
}

export interface MailThreadSummary {
  id: string
  subject: string
  latestSenderName: string
  latestSenderEmail: string
  latestMessageAt: string
  linkedCustomerName?: string
  linkedProjectName?: string
  linkedOrderNumber?: string
  status: MailThreadStatus
  ownerLabel: string
  attachmentCount: number
  unreadCount: number
}

export interface MailThreadDetail extends MailThreadSummary {
  snippet: string
  participants: string[]
  attachments: MailThreadAttachment[]
}

export interface MailDispatchRecord {
  id: string
  threadId: string
  dispatchType: 'to_user' | 'to_department' | 'escalation'
  assignedRole: string
  assignedDepartment: string
  assignedUserName?: string
  status: MailDispatchStatus
  priority: 'normal' | 'high'
  dueAt?: string
  createdAt: string
  createdBy: string
}

export interface MailCandidateRecord {
  id: string
  threadId: string
  candidateType: MailCandidateType
  suggestedTargetObjectType: string
  candidateSummary: string
  status: MailCandidateStatus
  confirmedTargetObjectId?: string
  confirmedBy?: string
  confirmedAt?: string
}

export interface MailLinkRecord {
  id: string
  threadId: string
  targetType: string
  targetNumber: string
  label: string
  linkedAt: string
}
