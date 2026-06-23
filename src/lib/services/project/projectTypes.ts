export type ProjectMeetingType =
  | 'requirement_clarification'
  | 'drawing_review'
  | 'weekly_sync'
  | 'fat_preparation'
  | 'shipment_coordination'
  | 'sat_issue_review'
  | 'final_acceptance'

export type ProjectMeetingStatus = 'draft' | 'issued' | 'closed'

export interface ProjectMeetingRecord {
  id: string
  projectId: string
  projectRevisionId: string
  projectCode?: string | null
  projectName?: string | null
  meetingType: ProjectMeetingType
  meetingTitle: string
  meetingTime: string
  participants: string[]
  meetingSummary: string
  minutesStatus: ProjectMeetingStatus
  minutesUrl?: string | null
  createdAt: string
  updatedAt: string
}

export type ProjectActionItemStatus = 'open' | 'in_progress' | 'blocked' | 'done' | 'cancelled'

export interface ProjectActionItemRecord {
  id: string
  projectId: string
  projectRevisionId: string
  meetingId?: string | null
  title: string
  description?: string | null
  owner: string
  dueAt?: string | null
  status: ProjectActionItemStatus
  createdAt: string
  updatedAt: string
}

export type ProjectMilestoneStatus = 'not_started' | 'planned' | 'in_progress' | 'done' | 'delayed' | 'blocked'

export interface ProjectMilestoneRecord {
  id: string
  projectId: string
  projectRevisionId: string
  milestoneName: string
  milestoneStage: string
  owner: string
  plannedStart?: string | null
  plannedEnd?: string | null
  actualStart?: string | null
  actualEnd?: string | null
  dependency?: string | null
  isKeyMilestone: boolean
  status: ProjectMilestoneStatus
  createdAt: string
  updatedAt: string
}

export type ProjectRiskLevel = 'low' | 'medium' | 'high' | 'critical'
export type ProjectRiskStatus = 'open' | 'monitoring' | 'mitigated' | 'closed'

export interface ProjectRiskRecord {
  id: string
  projectId: string
  projectRevisionId: string
  linkedMeetingId?: string | null
  linkedActionItemId?: string | null
  riskTitle: string
  riskCategory: 'schedule' | 'fat' | 'shipment' | 'sat' | 'payment' | 'quality' | 'change'
  riskLevel: ProjectRiskLevel
  owner: string
  mitigationPlan?: string | null
  status: ProjectRiskStatus
  createdAt: string
  updatedAt: string
}

export type ProjectIssueStatus = 'open' | 'fixing' | 'waiting_confirmation' | 'closed'
export type ProjectIssueSeverity = 'minor' | 'major' | 'critical'

export interface ProjectIssueRecord {
  id: string
  projectId: string
  projectRevisionId: string
  linkedMeetingId?: string | null
  linkedActionItemId?: string | null
  issueTitle: string
  issueStage: 'fat' | 'shipment' | 'installation' | 'sat' | 'final_acceptance' | 'document'
  severity: ProjectIssueSeverity
  owner: string
  resolutionPlan?: string | null
  status: ProjectIssueStatus
  createdAt: string
  updatedAt: string
}

export type ProjectFatStatus = 'planned' | 'preparing' | 'ready_for_review' | 'approved' | 'failed'
export type ProjectSatStatus = 'planned' | 'in_progress' | 'waiting_customer_confirmation' | 'approved' | 'failed'

export interface ProjectFatRecord {
  id: string
  projectId: string
  projectRevisionId: string
  linkedMilestoneId?: string | null
  linkedRiskId?: string | null
  fatTitle: string
  fatScope: string
  owner: string
  plannedAt?: string | null
  resultSummary?: string | null
  status: ProjectFatStatus
  createdAt: string
  updatedAt: string
}

export interface ProjectSatRecord {
  id: string
  projectId: string
  projectRevisionId: string
  linkedMilestoneId?: string | null
  linkedIssueId?: string | null
  satTitle: string
  siteName?: string | null
  owner: string
  plannedAt?: string | null
  resultSummary?: string | null
  status: ProjectSatStatus
  createdAt: string
  updatedAt: string
}

export type ProjectScheduleVarianceStatus = 'planned' | 'at_risk' | 'in_progress' | 'delayed' | 'done'

export interface ProjectScheduleVarianceRecord {
  id: string
  projectId: string
  projectRevisionId: string
  linkedMilestoneId?: string | null
  nodeName: string
  nodeStage: 'fat' | 'shipment' | 'installation' | 'sat' | 'final_acceptance' | 'handover'
  owner: string
  plannedStart?: string | null
  plannedEnd?: string | null
  actualStart?: string | null
  actualEnd?: string | null
  dependency?: string | null
  dependencyBlockedBy?: string | null
  riskLevel: ProjectRiskLevel
  isMilestoneNode: boolean
  status: ProjectScheduleVarianceStatus
  varianceReasonSummary?: string | null
  createdAt: string
  updatedAt: string
}

export interface ProjectControlTouchLogRecord {
  id: string
  projectId: string
  projectRevisionId: string
  actionKind: 'schedule_node' | 'risk' | 'issue' | 'fat' | 'sat'
  targetId: string
  targetLabel: string
  actionLabel: string
  actorLabel: string
  touchedAt: string
  outcomeStatus?: 'advanced' | 'pending'
  outcomeSummary?: string | null
}
