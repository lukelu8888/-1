import { useEffect, useState } from 'react'
import { AlertTriangle, Bug, CalendarRange, ClipboardList, Flag, Milestone, Plus, ShieldCheck, Wrench } from 'lucide-react'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select'
import { Textarea } from '../../ui/textarea'
import { Badge } from '../../ui/badge'
import { projectMeetingService } from '../../../lib/services/project/projectMeetingService'
import { projectActionItemService } from '../../../lib/services/project/projectActionItemService'
import { projectMilestoneService } from '../../../lib/services/project/projectMilestoneService'
import { projectRiskLedgerService } from '../../../lib/services/project/projectRiskLedgerService'
import { projectScheduleVarianceService } from '../../../lib/services/project/projectScheduleVarianceService'
import { projectIssueListService } from '../../../lib/services/project/projectIssueListService'
import { projectFatService } from '../../../lib/services/project/projectFatService'
import { projectSatService } from '../../../lib/services/project/projectSatService'
import { projectControlTouchLogService } from '../../../lib/services/project/projectControlTouchLogService'
import { projectControlSummaryService, type ProjectControlSummary } from '../../../lib/services/project/projectControlSummaryService'
import { syncProjectControlState } from '../../../lib/services/project/syncProjectControlState'
import type {
  ProjectActionItemRecord,
  ProjectFatRecord,
  ProjectIssueRecord,
  ProjectMeetingRecord,
  ProjectMilestoneRecord,
  ProjectRiskRecord,
  ProjectScheduleVarianceRecord,
  ProjectSatRecord,
} from '../../../lib/services/project/projectTypes'

interface ProjectControlPanelProps {
  projectId: string
  projectCode?: string | null
  projectName?: string | null
  projectRevisionId: string
  projectRevisionCode?: string | null
  actorLabel: string
}

const meetingTypeOptions: ProjectMeetingRecord['meetingType'][] = [
  'requirement_clarification',
  'drawing_review',
  'weekly_sync',
  'fat_preparation',
  'shipment_coordination',
  'sat_issue_review',
  'final_acceptance',
]

const actionStatusOptions: ProjectActionItemRecord['status'][] = [
  'open',
  'in_progress',
  'blocked',
  'done',
  'cancelled',
]

const milestoneStatusOptions: ProjectMilestoneRecord['status'][] = [
  'not_started',
  'planned',
  'in_progress',
  'done',
  'delayed',
  'blocked',
]

const riskCategoryOptions: ProjectRiskRecord['riskCategory'][] = [
  'schedule',
  'fat',
  'shipment',
  'sat',
  'payment',
  'quality',
  'change',
]

const riskLevelOptions: ProjectRiskRecord['riskLevel'][] = ['low', 'medium', 'high', 'critical']
const riskStatusOptions: ProjectRiskRecord['status'][] = ['open', 'monitoring', 'mitigated', 'closed']

const issueStageOptions: ProjectIssueRecord['issueStage'][] = [
  'fat',
  'shipment',
  'installation',
  'sat',
  'final_acceptance',
  'document',
]

const issueSeverityOptions: ProjectIssueRecord['severity'][] = ['minor', 'major', 'critical']
const issueStatusOptions: ProjectIssueRecord['status'][] = ['open', 'fixing', 'waiting_confirmation', 'closed']

const fatStatusOptions: ProjectFatRecord['status'][] = ['planned', 'preparing', 'ready_for_review', 'approved', 'failed']
const satStatusOptions: ProjectSatRecord['status'][] = ['planned', 'in_progress', 'waiting_customer_confirmation', 'approved', 'failed']
const scheduleStageOptions: ProjectScheduleVarianceRecord['nodeStage'][] = [
  'fat',
  'shipment',
  'installation',
  'sat',
  'final_acceptance',
  'handover',
]
const scheduleStatusOptions: ProjectScheduleVarianceRecord['status'][] = ['planned', 'at_risk', 'in_progress', 'delayed', 'done']

const formatLabel = (value: string) =>
  value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')

const statusBadgeClass = (status: string) => {
  if (status === 'done' || status === 'closed') return 'bg-emerald-50 text-emerald-700 border-emerald-200'
  if (status === 'in_progress' || status === 'planned' || status === 'issued') return 'bg-blue-50 text-blue-700 border-blue-200'
  if (status === 'blocked' || status === 'delayed' || status === 'cancelled') return 'bg-amber-50 text-amber-700 border-amber-200'
  return 'bg-slate-50 text-slate-700 border-slate-200'
}

const nodeHealthClass = (health: 'stable' | 'attention' | 'blocked') => {
  if (health === 'stable') return 'bg-emerald-50 border-emerald-200 text-emerald-700'
  if (health === 'attention') return 'bg-amber-50 border-amber-200 text-amber-700'
  return 'bg-rose-50 border-rose-200 text-rose-700'
}

const formatDateLabel = (value?: string | null) => {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString()
}

const recommendedCardClass = (active: boolean) =>
  active
    ? 'border-sky-300 bg-sky-50 ring-1 ring-sky-200'
    : 'border-slate-200 bg-white'

const followUpCardClass = (active: boolean) =>
  active
    ? 'border-amber-300 bg-amber-50 ring-1 ring-amber-200'
    : 'border-slate-200 bg-white'

const stalledFollowUpCardClass = (active: boolean) =>
  active
    ? 'border-rose-300 bg-rose-50 ring-1 ring-rose-200'
    : 'border-slate-200 bg-white'

const followUpResultBadgeClass = (status?: ProjectControlSummary['latestFollowUpProgressStatus']) => {
  if (status === 'advanced') return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  if (status === 'changed') return 'border-blue-200 bg-blue-50 text-blue-700'
  if (status === 'first_follow_up') return 'border-slate-200 bg-slate-50 text-slate-700'
  return 'border-amber-200 bg-amber-50 text-amber-700'
}

const followUpResultLabel = (status?: ProjectControlSummary['latestFollowUpProgressStatus']) => {
  if (status === 'advanced') return '已推进'
  if (status === 'changed') return '有变化'
  if (status === 'first_follow_up') return '首次跟进'
  return '无明显进展'
}

const ownerResultBadgeClass = (status?: ProjectControlSummary['latestOwnerActionResultStatus']) => {
  if (status === 'advanced') return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  if (status === 'changed') return 'border-blue-200 bg-blue-50 text-blue-700'
  if (status === 'first_follow_up') return 'border-slate-200 bg-slate-50 text-slate-700'
  return 'border-amber-200 bg-amber-50 text-amber-700'
}

const ownerResultLabel = (status?: ProjectControlSummary['latestOwnerActionResultStatus']) => {
  if (status === 'advanced') return '责任已推进'
  if (status === 'changed') return '责任有变化'
  if (status === 'first_follow_up') return '责任首次跟进'
  return '责任未明显推进'
}

const escalationReasonBadgeClass = (kind?: ProjectControlSummary['latestEscalationReasonKind']) => {
  if (kind === 'dependency_blocked') return 'border-amber-200 bg-amber-50 text-amber-700'
  if (kind === 'repeated_no_progress') return 'border-rose-200 bg-rose-50 text-rose-700'
  if (kind === 'status_stalled') return 'border-slate-300 bg-slate-100 text-slate-700'
  return 'border-orange-200 bg-orange-50 text-orange-700'
}

const escalationReasonLabel = (kind?: ProjectControlSummary['latestEscalationReasonKind']) => {
  if (kind === 'dependency_blocked') return '依赖阻断'
  if (kind === 'repeated_no_progress') return '连续无进展'
  if (kind === 'status_stalled') return '状态异常'
  return '未解除待升级'
}

const ownerBadgeClass = (tone: 'recommended' | 'follow_up' | 'escalated') => {
  if (tone === 'escalated') return 'border-rose-200 bg-rose-100 text-rose-700'
  if (tone === 'follow_up') return 'border-amber-200 bg-amber-100 text-amber-700'
  return 'border-sky-200 bg-sky-100 text-sky-700'
}

export function ProjectControlPanel({
  projectId,
  projectCode,
  projectName,
  projectRevisionId,
  projectRevisionCode,
  actorLabel,
}: ProjectControlPanelProps) {
  const [meetings, setMeetings] = useState<ProjectMeetingRecord[]>([])
  const [actionItems, setActionItems] = useState<ProjectActionItemRecord[]>([])
  const [milestones, setMilestones] = useState<ProjectMilestoneRecord[]>([])
  const [risks, setRisks] = useState<ProjectRiskRecord[]>([])
  const [issues, setIssues] = useState<ProjectIssueRecord[]>([])
  const [fatRecords, setFatRecords] = useState<ProjectFatRecord[]>([])
  const [satRecords, setSatRecords] = useState<ProjectSatRecord[]>([])
  const [scheduleNodes, setScheduleNodes] = useState<ProjectScheduleVarianceRecord[]>([])
  const [controlSummary, setControlSummary] = useState<ProjectControlSummary | null>(null)

  const [meetingType, setMeetingType] = useState<ProjectMeetingRecord['meetingType']>('weekly_sync')
  const [meetingTitle, setMeetingTitle] = useState('')
  const [meetingSummary, setMeetingSummary] = useState('')

  const [actionTitle, setActionTitle] = useState('')
  const [actionOwner, setActionOwner] = useState(actorLabel)
  const [actionStatus, setActionStatus] = useState<ProjectActionItemRecord['status']>('open')

  const [milestoneName, setMilestoneName] = useState('')
  const [milestoneStage, setMilestoneStage] = useState('spec_freeze')
  const [milestoneOwner, setMilestoneOwner] = useState(actorLabel)
  const [milestoneStatus, setMilestoneStatus] = useState<ProjectMilestoneRecord['status']>('planned')

  const [riskTitle, setRiskTitle] = useState('')
  const [riskOwner, setRiskOwner] = useState(actorLabel)
  const [riskCategory, setRiskCategory] = useState<ProjectRiskRecord['riskCategory']>('schedule')
  const [riskLevel, setRiskLevel] = useState<ProjectRiskRecord['riskLevel']>('medium')
  const [riskStatus, setRiskStatus] = useState<ProjectRiskRecord['status']>('open')

  const [issueTitle, setIssueTitle] = useState('')
  const [issueOwner, setIssueOwner] = useState(actorLabel)
  const [issueStage, setIssueStage] = useState<ProjectIssueRecord['issueStage']>('fat')
  const [issueSeverity, setIssueSeverity] = useState<ProjectIssueRecord['severity']>('major')
  const [issueStatus, setIssueStatus] = useState<ProjectIssueRecord['status']>('open')

  const [fatTitle, setFatTitle] = useState('')
  const [fatScope, setFatScope] = useState('mechanical_electrical_software')
  const [fatOwner, setFatOwner] = useState(actorLabel)
  const [fatStatus, setFatStatus] = useState<ProjectFatRecord['status']>('planned')

  const [satTitle, setSatTitle] = useState('')
  const [satSiteName, setSatSiteName] = useState('')
  const [satOwner, setSatOwner] = useState(actorLabel)
  const [satStatus, setSatStatus] = useState<ProjectSatRecord['status']>('planned')

  const [scheduleNodeName, setScheduleNodeName] = useState('')
  const [scheduleNodeStage, setScheduleNodeStage] = useState<ProjectScheduleVarianceRecord['nodeStage']>('fat')
  const [scheduleNodeOwner, setScheduleNodeOwner] = useState(actorLabel)
  const [schedulePlannedStart, setSchedulePlannedStart] = useState('')
  const [schedulePlannedEnd, setSchedulePlannedEnd] = useState('')
  const [scheduleStatus, setScheduleStatus] = useState<ProjectScheduleVarianceRecord['status']>('planned')

  const reload = () => {
    syncProjectControlState(projectId, projectRevisionId)
    setMeetings(projectMeetingService.listByProject(projectId, projectRevisionId))
    setActionItems(projectActionItemService.listByProject(projectId, projectRevisionId))
    setMilestones(projectMilestoneService.listByProject(projectId, projectRevisionId))
    setRisks(projectRiskLedgerService.listByProject(projectId, projectRevisionId))
    setIssues(projectIssueListService.listByProject(projectId, projectRevisionId))
    setFatRecords(projectFatService.listByProject(projectId, projectRevisionId))
    setSatRecords(projectSatService.listByProject(projectId, projectRevisionId))
    setScheduleNodes(projectScheduleVarianceService.listByProject(projectId, projectRevisionId))
    setControlSummary(projectControlSummaryService.getByProject(projectId, projectRevisionId))
  }

  useEffect(() => {
    reload()
  }, [projectId, projectRevisionId])

  const createMeeting = () => {
    if (!meetingTitle.trim()) return
    projectMeetingService.create({
      projectId,
      projectRevisionId,
      projectCode,
      projectName,
      meetingType,
      meetingTitle: meetingTitle.trim(),
      meetingTime: new Date().toISOString(),
      participants: actorLabel ? [actorLabel] : [],
      meetingSummary: meetingSummary.trim(),
      minutesStatus: 'draft',
      minutesUrl: null,
    })
    setMeetingTitle('')
    setMeetingSummary('')
    reload()
  }

  const createActionItem = () => {
    if (!actionTitle.trim()) return
    projectActionItemService.create({
      projectId,
      projectRevisionId,
      title: actionTitle.trim(),
      description: null,
      owner: actionOwner.trim() || actorLabel,
      dueAt: null,
      status: actionStatus,
      meetingId: meetings[0]?.id || null,
    })
    setActionTitle('')
    reload()
  }

  const createMilestone = () => {
    if (!milestoneName.trim()) return
    projectMilestoneService.create({
      projectId,
      projectRevisionId,
      milestoneName: milestoneName.trim(),
      milestoneStage: milestoneStage.trim(),
      owner: milestoneOwner.trim() || actorLabel,
      plannedStart: null,
      plannedEnd: null,
      actualStart: null,
      actualEnd: null,
      dependency: null,
      isKeyMilestone: false,
      status: milestoneStatus,
    })
    setMilestoneName('')
    reload()
  }

  const createRisk = () => {
    if (!riskTitle.trim()) return
    projectRiskLedgerService.create({
      projectId,
      projectRevisionId,
      linkedMeetingId: meetings[0]?.id || null,
      linkedActionItemId: actionItems[0]?.id || null,
      riskTitle: riskTitle.trim(),
      riskCategory,
      riskLevel,
      owner: riskOwner.trim() || actorLabel,
      mitigationPlan: null,
      status: riskStatus,
    })
    setRiskTitle('')
    reload()
  }

  const createIssue = () => {
    if (!issueTitle.trim()) return
    projectIssueListService.create({
      projectId,
      projectRevisionId,
      linkedMeetingId: meetings[0]?.id || null,
      linkedActionItemId: actionItems[0]?.id || null,
      issueTitle: issueTitle.trim(),
      issueStage,
      severity: issueSeverity,
      owner: issueOwner.trim() || actorLabel,
      resolutionPlan: null,
      status: issueStatus,
    })
    setIssueTitle('')
    reload()
  }

  const createFat = () => {
    if (!fatTitle.trim()) return
    projectFatService.create({
      projectId,
      projectRevisionId,
      linkedMilestoneId: milestones[0]?.id || null,
      linkedRiskId: risks[0]?.id || null,
      fatTitle: fatTitle.trim(),
      fatScope: fatScope.trim(),
      owner: fatOwner.trim() || actorLabel,
      plannedAt: null,
      resultSummary: null,
      status: fatStatus,
    })
    setFatTitle('')
    reload()
  }

  const createSat = () => {
    if (!satTitle.trim()) return
    projectSatService.create({
      projectId,
      projectRevisionId,
      linkedMilestoneId: milestones[0]?.id || null,
      linkedIssueId: issues[0]?.id || null,
      satTitle: satTitle.trim(),
      siteName: satSiteName.trim() || null,
      owner: satOwner.trim() || actorLabel,
      plannedAt: null,
      resultSummary: null,
      status: satStatus,
    })
    setSatTitle('')
    setSatSiteName('')
    reload()
  }

  const createScheduleNode = () => {
    if (!scheduleNodeName.trim()) return
    const linkedMilestone =
      milestones.find((item) => item.milestoneStage === scheduleNodeStage) ||
      milestones.find((item) => item.milestoneStage === 'installation_sat' && scheduleNodeStage === 'sat') ||
      milestones.find((item) => item.milestoneStage === 'shipment_delivery' && scheduleNodeStage === 'shipment') ||
      milestones.find((item) => item.milestoneStage === 'fat_precheck' && scheduleNodeStage === 'fat') ||
      milestones.find((item) => item.milestoneStage === 'handover' && scheduleNodeStage === 'final_acceptance')

    projectScheduleVarianceService.create({
      projectId,
      projectRevisionId,
      linkedMilestoneId: linkedMilestone?.id || null,
      nodeName: scheduleNodeName.trim(),
      nodeStage: scheduleNodeStage,
      owner: scheduleNodeOwner.trim() || actorLabel,
      plannedStart: schedulePlannedStart || null,
      plannedEnd: schedulePlannedEnd || null,
      actualStart: null,
      actualEnd: null,
      dependency: linkedMilestone?.milestoneName || null,
      riskLevel: 'medium',
      isMilestoneNode: true,
      status: scheduleStatus,
    })
    setScheduleNodeName('')
    setSchedulePlannedStart('')
    setSchedulePlannedEnd('')
    reload()
  }

  const isRecommendedTarget = (
    kind: 'schedule_node' | 'risk' | 'issue' | 'fat' | 'sat',
    id: string,
  ) =>
    controlSummary?.recommendedActionKind === kind &&
    controlSummary?.recommendedActionTargetId === id

  const isPendingFollowUpTarget = (
    kind: 'schedule_node' | 'risk' | 'issue' | 'fat' | 'sat',
    id: string,
  ) =>
    (controlSummary?.recommendedActionSource === 'pending_touch' ||
      controlSummary?.recommendedActionSource === 'stalled_follow_up') &&
    controlSummary?.recommendedActionKind === kind &&
    controlSummary?.recommendedActionTargetId === id

  const isStalledFollowUpTarget = (
    kind: 'schedule_node' | 'risk' | 'issue' | 'fat' | 'sat',
    id: string,
  ) =>
    controlSummary?.recommendedActionSource === 'stalled_follow_up' &&
    controlSummary?.recommendedActionKind === kind &&
    controlSummary?.recommendedActionTargetId === id

  const getStalledFollowUpReason = (
    kind: 'schedule_node' | 'risk' | 'issue' | 'fat' | 'sat',
    id: string,
  ) =>
    isStalledFollowUpTarget(kind, id)
      ? controlSummary?.latestEscalationReason || '连续跟进后仍未解除'
      : null

  const getTargetOwnerLabel = (
    kind: 'schedule_node' | 'risk' | 'issue' | 'fat' | 'sat',
    id: string,
  ) => {
    if (kind === 'schedule_node') return scheduleNodes.find((item) => item.id === id)?.owner || null
    if (kind === 'risk') return risks.find((item) => item.id === id)?.owner || null
    if (kind === 'issue') return issues.find((item) => item.id === id)?.owner || null
    if (kind === 'fat') return fatRecords.find((item) => item.id === id)?.owner || null
    return satRecords.find((item) => item.id === id)?.owner || null
  }

  const getRecommendedActionButtonLabel = (
    kind: 'schedule_node' | 'risk' | 'issue' | 'fat' | 'sat',
    pendingFollowUp = false,
    stalledFollowUp = false,
  ) => {
    if (stalledFollowUp) return 'Escalate'
    if (pendingFollowUp) return 'Follow Up Again'
    if (kind === 'schedule_node') return 'Start Node'
    if (kind === 'risk') return 'Move to Monitoring'
    if (kind === 'issue') return 'Move to Fixing'
    if (kind === 'fat') return 'Start FAT'
    return 'Start SAT'
  }

  const applyRecommendedObjectAction = (kind: 'schedule_node' | 'risk' | 'issue' | 'fat' | 'sat', id: string) => {
    const pendingFollowUp = isPendingFollowUpTarget(kind, id)
    const stalledFollowUp = isStalledFollowUpTarget(kind, id)

    if (kind === 'schedule_node') {
      const target = scheduleNodes.find((item) => item.id === id)
      if (!target) return
      projectScheduleVarianceService.update(id, {
        status: target.status === 'done' ? 'done' : 'in_progress',
        actualStart: target.actualStart || new Date().toISOString(),
      })
      projectControlTouchLogService.create({
        projectId,
        projectRevisionId,
        actionKind: 'schedule_node',
        targetId: target.id,
        targetLabel: target.nodeName,
        actionLabel: getRecommendedActionButtonLabel('schedule_node', pendingFollowUp, stalledFollowUp),
        actorLabel,
        touchedAt: new Date().toISOString(),
      })
      reload()
      return
    }

    if (kind === 'risk') {
      projectRiskLedgerService.update(id, { status: 'monitoring' })
      const target = risks.find((item) => item.id === id)
      if (target) {
        projectControlTouchLogService.create({
          projectId,
          projectRevisionId,
          actionKind: 'risk',
          targetId: target.id,
          targetLabel: target.riskTitle,
          actionLabel: getRecommendedActionButtonLabel('risk', pendingFollowUp, stalledFollowUp),
          actorLabel,
          touchedAt: new Date().toISOString(),
        })
      }
      reload()
      return
    }

    if (kind === 'issue') {
      projectIssueListService.update(id, { status: 'fixing' })
      const target = issues.find((item) => item.id === id)
      if (target) {
        projectControlTouchLogService.create({
          projectId,
          projectRevisionId,
          actionKind: 'issue',
          targetId: target.id,
          targetLabel: target.issueTitle,
          actionLabel: getRecommendedActionButtonLabel('issue', pendingFollowUp, stalledFollowUp),
          actorLabel,
          touchedAt: new Date().toISOString(),
        })
      }
      reload()
      return
    }

    if (kind === 'fat') {
      const target = fatRecords.find((item) => item.id === id)
      if (!target) return
      projectFatService.update(id, {
        status: target.status === 'ready_for_review' ? 'ready_for_review' : 'preparing',
      })
      projectControlTouchLogService.create({
        projectId,
        projectRevisionId,
        actionKind: 'fat',
        targetId: target.id,
        targetLabel: target.fatTitle,
        actionLabel: getRecommendedActionButtonLabel('fat', pendingFollowUp, stalledFollowUp),
        actorLabel,
        touchedAt: new Date().toISOString(),
      })
      reload()
      return
    }

    const target = satRecords.find((item) => item.id === id)
    if (!target) return
    projectSatService.update(id, {
      status: target.status === 'waiting_customer_confirmation' ? 'waiting_customer_confirmation' : 'in_progress',
    })
    projectControlTouchLogService.create({
      projectId,
      projectRevisionId,
      actionKind: 'sat',
      targetId: target.id,
      targetLabel: target.satTitle,
      actionLabel: getRecommendedActionButtonLabel('sat', pendingFollowUp, stalledFollowUp),
      actorLabel,
      touchedAt: new Date().toISOString(),
    })
    reload()
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-900">Project Control Layer</div>
          <div className="text-xs text-slate-500">
            {projectCode ? `${projectCode} · ` : ''}{projectName || 'Project'} / Rev {projectRevisionCode || '—'}
          </div>
        </div>
        <Badge className="border-slate-200 bg-slate-50 text-slate-700">
          Phase 1-2
        </Badge>
      </div>

      {controlSummary && (
        <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50/40 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-slate-900">Project Control Summary</div>
              <div className="text-xs text-slate-500">Linked view across milestones, risks, issues, FAT and SAT</div>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
              <Badge className="border-slate-200 bg-white text-slate-700">Meetings {controlSummary.meetingCount}</Badge>
              <Badge className="border-slate-200 bg-white text-slate-700">Actions {controlSummary.openActionCount}</Badge>
              <Badge className="border-slate-200 bg-white text-slate-700">Risks {controlSummary.openRiskCount}</Badge>
              <Badge className="border-slate-200 bg-white text-slate-700">Issues {controlSummary.openIssueCount}</Badge>
              <Badge className="border-slate-200 bg-white text-slate-700">FAT {controlSummary.fatOpenCount}</Badge>
              <Badge className="border-slate-200 bg-white text-slate-700">SAT {controlSummary.satOpenCount}</Badge>
              <Badge className="border-slate-200 bg-white text-slate-700">Delay {controlSummary.delayedScheduleCount}</Badge>
              <Badge className="border-slate-200 bg-white text-slate-700">At Risk {controlSummary.atRiskScheduleCount}</Badge>
              <Badge className="border-slate-200 bg-white text-slate-700">Dependency Block {controlSummary.dependencyBlockedCount}</Badge>
              <Badge className="border-slate-200 bg-white text-slate-700">Pending Touch {controlSummary.pendingTouchCount}</Badge>
            </div>
          </div>
          <div className="mt-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700">
            Recommended Action: {controlSummary.recommendedAction}
            {controlSummary.recommendedActionSource === 'stalled_follow_up' ? (
              <div className="mt-1 text-[11px] text-rose-600">
                Priority Source: Follow-up stalled, escalate this blocker first
              </div>
            ) : null}
            {controlSummary.recommendedActionSource === 'pending_touch' ? (
              <div className="mt-1 text-[11px] text-amber-600">
                Priority Source: Pending follow-up still unresolved
              </div>
            ) : null}
            {controlSummary.recommendedActionKind !== 'none' && controlSummary.recommendedActionTargetLabel ? (
              <div className="mt-1 text-[11px] text-slate-500">
                Target: {formatLabel(controlSummary.recommendedActionKind)} / {controlSummary.recommendedActionTargetLabel}
              </div>
            ) : null}
            {controlSummary.recommendedActionOwnerLabel ? (
              <div className="mt-1 text-[11px] text-slate-500">
                Owner: {controlSummary.recommendedActionOwnerLabel}
              </div>
            ) : null}
            {controlSummary.recommendedActionOwnerHint ? (
              <div className="mt-1 text-[11px] text-sky-700">
                Owner Action: {controlSummary.recommendedActionOwnerHint}
              </div>
            ) : null}
            {controlSummary.focusOwnerSummary ? (
              <div className="mt-2 rounded border border-sky-200 bg-sky-50 px-2 py-1 text-[11px] text-sky-800">
                <div className="flex flex-wrap items-center gap-2">
                  <span>Owner Focus:</span>
                  {controlSummary.focusOwnerLabel ? (
                    <Badge className="border-sky-200 bg-white text-sky-700">
                      {controlSummary.focusOwnerLabel}
                    </Badge>
                  ) : null}
                  <Badge className="border-slate-200 bg-white text-slate-700">
                    Open {controlSummary.focusOwnerOpenCount}
                  </Badge>
                  <Badge className="border-amber-200 bg-amber-50 text-amber-700">
                    Blocked {controlSummary.focusOwnerBlockedCount}
                  </Badge>
                  <Badge className="border-rose-200 bg-rose-50 text-rose-700">
                    Stalled {controlSummary.focusOwnerStalledTouchCount}
                  </Badge>
                </div>
                <div className="mt-1">{controlSummary.focusOwnerSummary}</div>
              </div>
            ) : null}
            {controlSummary.recommendedActionKind !== 'none' &&
            controlSummary.recommendedActionKind !== 'node_summary' &&
            controlSummary.recommendedActionTargetId ? (
              <Button
                size="sm"
                variant="outline"
                className="mt-2 h-7 border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100"
                onClick={() =>
                  applyRecommendedObjectAction(
                    controlSummary.recommendedActionKind as 'schedule_node' | 'risk' | 'issue' | 'fat' | 'sat',
                    controlSummary.recommendedActionTargetId as string,
                  )
                }
              >
                {getRecommendedActionButtonLabel(
                  controlSummary.recommendedActionKind as 'schedule_node' | 'risk' | 'issue' | 'fat' | 'sat',
                  controlSummary.recommendedActionSource === 'pending_touch' || controlSummary.recommendedActionSource === 'stalled_follow_up',
                  controlSummary.recommendedActionSource === 'stalled_follow_up',
                )}
              </Button>
            ) : null}
            {controlSummary.latestPendingTouchSummary ? (
              <div className="mt-2 rounded border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] text-amber-700">
                Pending Follow-up: {controlSummary.latestPendingTouchSummary}
                {controlSummary.latestPendingTouchOwnerLabel ? (
                  <div className="mt-1">Owner to follow: {controlSummary.latestPendingTouchOwnerLabel}</div>
                ) : null}
                {controlSummary.latestPendingTouchOwnerHint ? (
                  <div className="mt-1 text-amber-800">{controlSummary.latestPendingTouchOwnerHint}</div>
                ) : null}
              </div>
            ) : null}
            {controlSummary.latestEscalationSummary ? (
              <div className="mt-2 rounded border border-rose-200 bg-rose-50 px-2 py-1 text-[11px] text-rose-700">
                Escalation Trace: {controlSummary.latestEscalationSummary}
                {controlSummary.latestEscalationOwnerLabel ? (
                  <div className="mt-1">Owner to push: {controlSummary.latestEscalationOwnerLabel}</div>
                ) : null}
                {controlSummary.latestEscalationOwnerHint ? (
                  <div className="mt-1 text-rose-800">{controlSummary.latestEscalationOwnerHint}</div>
                ) : null}
                {controlSummary.latestEscalationReason ? (
                  <div className="mt-1 text-[11px] text-rose-600">
                    <div className="flex flex-wrap items-center gap-2">
                      <span>Reason:</span>
                      <Badge className={escalationReasonBadgeClass(controlSummary.latestEscalationReasonKind)}>
                        {escalationReasonLabel(controlSummary.latestEscalationReasonKind)}
                      </Badge>
                    </div>
                    <div className="mt-1">{controlSummary.latestEscalationReason}</div>
                  </div>
                ) : null}
              </div>
            ) : null}
            {controlSummary.latestFollowUpProgressSummary ? (
              <div className="mt-2 rounded border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] text-slate-600">
                <div className="flex flex-wrap items-center gap-2">
                  <span>Follow-up Result:</span>
                  <Badge className={followUpResultBadgeClass(controlSummary.latestFollowUpProgressStatus)}>
                    {followUpResultLabel(controlSummary.latestFollowUpProgressStatus)}
                  </Badge>
                </div>
                <div className="mt-1">{controlSummary.latestFollowUpProgressSummary}</div>
                {controlSummary.latestOwnerActionResult ? (
                  <div className="mt-1 text-slate-700">
                    <div className="flex flex-wrap items-center gap-2">
                      <span>Owner Result:</span>
                      <Badge className={ownerResultBadgeClass(controlSummary.latestOwnerActionResultStatus)}>
                        {ownerResultLabel(controlSummary.latestOwnerActionResultStatus)}
                      </Badge>
                    </div>
                    <div className="mt-1">{controlSummary.latestOwnerActionResult}</div>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
          {controlSummary.recentTouchLogs.length > 0 ? (
            <div className="mt-3 rounded-lg border border-slate-200 bg-white px-3 py-3">
              <div className="text-xs font-medium text-slate-700">Recent Touches</div>
              <div className="mt-2 space-y-1 text-[11px] text-slate-600">
                {controlSummary.recentTouchLogs.map((item) => (
                  <div key={item.id} className="flex flex-wrap items-center gap-2">
                    <span>{new Date(item.touchedAt).toLocaleString()} · {item.actorLabel} · {formatLabel(item.actionKind)} · {item.actionLabel} · {item.targetLabel}</span>
                    {item.actionLabel === 'Escalate' ? (
                      <Badge className="border-rose-200 bg-rose-50 text-rose-700">Escalated</Badge>
                    ) : null}
                    <Badge
                      className={
                        item.outcomeStatus === 'advanced'
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          : 'border-amber-200 bg-amber-50 text-amber-700'
                      }
                    >
                      {item.outcomeStatus === 'advanced' ? 'Advanced' : 'Pending'}
                    </Badge>
                    {item.outcomeSummary ? <span>{item.outcomeSummary}</span> : null}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          <div className="mt-4 grid gap-3 xl:grid-cols-4">
            {controlSummary.nodeSummaries.map((node) => (
              <div key={node.nodeKey} className={`rounded-lg border px-3 py-3 ${nodeHealthClass(node.health)}`}>
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-semibold">{node.label}</div>
                  <Badge className="border-white/60 bg-white/70 text-current">{formatLabel(node.health)}</Badge>
                </div>
                <div className="mt-2 text-xs leading-relaxed">{node.summary}</div>
                {node.blockerCount > 0 ? (
                  <div className="mt-2 text-[11px] text-current/80">
                    Critical path blocked by: {node.blockerLabels.slice(0, 2).join(', ')}
                  </div>
                ) : null}
                {!node.blockerCount && node.propagatedFrom ? (
                  <div className="mt-2 text-[11px] text-current/80">
                    Upstream blocked by: {node.propagatedFrom}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-5">
        <section className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/40 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <CalendarRange className="h-4 w-4 text-slate-500" />
            Plan / Actual Variance
          </div>
          <div className="grid gap-3 xl:grid-cols-[320px_minmax(0,1fr)]">
            <div className="space-y-2">
              <Input value={scheduleNodeName} onChange={(e) => setScheduleNodeName(e.target.value)} placeholder="Schedule node name" />
              <div className="grid gap-2 md:grid-cols-2">
                <Select value={scheduleNodeStage} onValueChange={(value) => setScheduleNodeStage(value as ProjectScheduleVarianceRecord['nodeStage'])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {scheduleStageOptions.map((option) => (
                      <SelectItem key={option} value={option}>{formatLabel(option)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={scheduleStatus} onValueChange={(value) => setScheduleStatus(value as ProjectScheduleVarianceRecord['status'])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {scheduleStatusOptions.map((option) => (
                      <SelectItem key={option} value={option}>{formatLabel(option)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Input value={scheduleNodeOwner} onChange={(e) => setScheduleNodeOwner(e.target.value)} placeholder="Owner" />
              <div className="grid gap-2 md:grid-cols-2">
                <Input type="date" value={schedulePlannedStart} onChange={(e) => setSchedulePlannedStart(e.target.value)} />
                <Input type="date" value={schedulePlannedEnd} onChange={(e) => setSchedulePlannedEnd(e.target.value)} />
              </div>
              <Button size="sm" className="w-full gap-2" onClick={createScheduleNode}>
                <Plus className="h-4 w-4" />
                Add Schedule Node
              </Button>
            </div>
            <div className="space-y-2">
              {scheduleNodes.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-200 bg-white px-3 py-5 text-xs text-slate-400">
                  No plan/actual variance nodes yet.
                </div>
              ) : (
                scheduleNodes.slice(0, 6).map((item) => {
                  const varianceDays = projectScheduleVarianceService.getVarianceDays(item)
                  const pendingFollowUp = isPendingFollowUpTarget('schedule_node', item.id)
                  const stalledFollowUp = isStalledFollowUpTarget('schedule_node', item.id)
                  const recommended = isRecommendedTarget('schedule_node', item.id)
                  const ownerTone = stalledFollowUp ? 'escalated' : pendingFollowUp ? 'follow_up' : 'recommended'
                  return (
                    <div
                      key={item.id}
                      className={`rounded-lg border px-3 py-3 ${
                        stalledFollowUp
                          ? stalledFollowUpCardClass(true)
                          : pendingFollowUp
                          ? followUpCardClass(true)
                          : recommendedCardClass(recommended)
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-sm font-medium text-slate-900">{item.nodeName}</div>
                        <div className="flex items-center gap-2">
                          {recommended ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 border-sky-200 bg-sky-50 px-2 text-[11px] text-sky-700 hover:bg-sky-100"
                              onClick={() => applyRecommendedObjectAction('schedule_node', item.id)}
                            >
                              {getRecommendedActionButtonLabel(
                                'schedule_node',
                                pendingFollowUp,
                                stalledFollowUp,
                              )}
                            </Button>
                          ) : null}
                          {stalledFollowUp ? (
                            <Badge className="border-rose-200 bg-rose-100 text-rose-700">Escalate First</Badge>
                          ) : null}
                          {pendingFollowUp ? (
                            <Badge className="border-amber-200 bg-amber-100 text-amber-700">Follow-up First</Badge>
                          ) : null}
                          {recommended && !pendingFollowUp ? (
                            <Badge className="border-sky-200 bg-sky-100 text-sky-700">Recommended</Badge>
                          ) : null}
                          {recommended && getTargetOwnerLabel('schedule_node', item.id) ? (
                            <Badge className={ownerBadgeClass(ownerTone)}>
                              Owner {getTargetOwnerLabel('schedule_node', item.id)}
                            </Badge>
                          ) : null}
                          <Badge className={statusBadgeClass(item.status)}>{formatLabel(item.status)}</Badge>
                        </div>
                      </div>
                      <div className="mt-1 text-[11px] text-slate-500">
                        {formatLabel(item.nodeStage)} · Owner: {item.owner || '—'} · Dependency: {item.dependency || '—'}
                      </div>
                      <div className="mt-2 grid gap-2 text-[11px] text-slate-600 md:grid-cols-3">
                        <div>Planned: {formatDateLabel(item.plannedStart)} → {formatDateLabel(item.plannedEnd)}</div>
                        <div>Actual: {formatDateLabel(item.actualStart)} → {formatDateLabel(item.actualEnd)}</div>
                        <div>Variance: {varianceDays === null ? 'Pending' : `${varianceDays > 0 ? '+' : ''}${varianceDays} day(s)`}</div>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
                        <Badge className="border-slate-200 bg-slate-50 text-slate-700">
                          {item.varianceReasonSummary || 'On baseline'}
                        </Badge>
                        {item.dependencyBlockedBy ? (
                          <Badge className="border-amber-200 bg-amber-50 text-amber-700">
                            Blocked by {item.dependencyBlockedBy}
                          </Badge>
                        ) : null}
                        {getStalledFollowUpReason('schedule_node', item.id) ? (
                          <>
                            <Badge className={escalationReasonBadgeClass(controlSummary?.latestEscalationReasonKind)}>
                              {escalationReasonLabel(controlSummary?.latestEscalationReasonKind)}
                            </Badge>
                            <Badge className="border-rose-200 bg-rose-50 text-rose-700">
                              Escalation reason: {getStalledFollowUpReason('schedule_node', item.id)}
                            </Badge>
                          </>
                        ) : null}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </section>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-3">
        <section className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/40 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <ClipboardList className="h-4 w-4 text-slate-500" />
            Meetings
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-slate-500">Type</Label>
            <Select value={meetingType} onValueChange={(value) => setMeetingType(value as ProjectMeetingRecord['meetingType'])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {meetingTypeOptions.map((option) => (
                  <SelectItem key={option} value={option}>{formatLabel(option)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input value={meetingTitle} onChange={(e) => setMeetingTitle(e.target.value)} placeholder="Meeting title" />
            <Textarea value={meetingSummary} onChange={(e) => setMeetingSummary(e.target.value)} rows={3} placeholder="Meeting summary" />
            <Button size="sm" className="w-full gap-2" onClick={createMeeting}>
              <Plus className="h-4 w-4" />
              Add Meeting
            </Button>
          </div>
          <div className="space-y-2">
            {meetings.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-200 bg-white px-3 py-5 text-xs text-slate-400">
                No meeting records yet.
              </div>
            ) : (
              meetings.slice(0, 4).map((meeting) => (
                <div key={meeting.id} className="rounded-lg border border-slate-200 bg-white px-3 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-medium text-slate-900">{meeting.meetingTitle}</div>
                    <Badge className={statusBadgeClass(meeting.minutesStatus)}>{formatLabel(meeting.minutesStatus)}</Badge>
                  </div>
                  <div className="mt-1 text-[11px] text-slate-500">{formatLabel(meeting.meetingType)} · {new Date(meeting.meetingTime).toLocaleString()}</div>
                  {meeting.meetingSummary && (
                    <div className="mt-2 text-xs leading-relaxed text-slate-600">{meeting.meetingSummary}</div>
                  )}
                </div>
              ))
            )}
          </div>
        </section>

        <section className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/40 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Flag className="h-4 w-4 text-slate-500" />
            Action Items
          </div>
          <div className="space-y-2">
            <Input value={actionTitle} onChange={(e) => setActionTitle(e.target.value)} placeholder="Action title" />
            <Input value={actionOwner} onChange={(e) => setActionOwner(e.target.value)} placeholder="Owner" />
            <Select value={actionStatus} onValueChange={(value) => setActionStatus(value as ProjectActionItemRecord['status'])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {actionStatusOptions.map((option) => (
                  <SelectItem key={option} value={option}>{formatLabel(option)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" className="w-full gap-2" onClick={createActionItem}>
              <Plus className="h-4 w-4" />
              Add Action Item
            </Button>
          </div>
          <div className="space-y-2">
            {actionItems.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-200 bg-white px-3 py-5 text-xs text-slate-400">
                No action items yet.
              </div>
            ) : (
              actionItems.slice(0, 5).map((item) => (
                <div key={item.id} className="rounded-lg border border-slate-200 bg-white px-3 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-medium text-slate-900">{item.title}</div>
                    <Badge className={statusBadgeClass(item.status)}>{formatLabel(item.status)}</Badge>
                  </div>
                  <div className="mt-1 text-[11px] text-slate-500">Owner: {item.owner || '—'}</div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/40 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Milestone className="h-4 w-4 text-slate-500" />
            Milestones
          </div>
          <div className="space-y-2">
            <Input value={milestoneName} onChange={(e) => setMilestoneName(e.target.value)} placeholder="Milestone name" />
            <Input value={milestoneStage} onChange={(e) => setMilestoneStage(e.target.value)} placeholder="Milestone stage" />
            <Input value={milestoneOwner} onChange={(e) => setMilestoneOwner(e.target.value)} placeholder="Owner" />
            <Select value={milestoneStatus} onValueChange={(value) => setMilestoneStatus(value as ProjectMilestoneRecord['status'])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {milestoneStatusOptions.map((option) => (
                  <SelectItem key={option} value={option}>{formatLabel(option)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" className="w-full gap-2" onClick={createMilestone}>
              <Plus className="h-4 w-4" />
              Add Milestone
            </Button>
          </div>
          <div className="space-y-2">
            {milestones.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-200 bg-white px-3 py-5 text-xs text-slate-400">
                No milestones yet.
              </div>
            ) : (
              milestones.slice(0, 5).map((item) => (
                <div key={item.id} className="rounded-lg border border-slate-200 bg-white px-3 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-medium text-slate-900">{item.milestoneName}</div>
                    <Badge className={statusBadgeClass(item.status)}>{formatLabel(item.status)}</Badge>
                  </div>
                  <div className="mt-1 text-[11px] text-slate-500">{item.milestoneStage} · Owner: {item.owner || '—'}</div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <section className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/40 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <AlertTriangle className="h-4 w-4 text-slate-500" />
            Risk Ledger
          </div>
          <div className="space-y-2">
            <Input value={riskTitle} onChange={(e) => setRiskTitle(e.target.value)} placeholder="Risk title" />
            <Input value={riskOwner} onChange={(e) => setRiskOwner(e.target.value)} placeholder="Owner" />
            <div className="grid gap-2 md:grid-cols-3">
              <Select value={riskCategory} onValueChange={(value) => setRiskCategory(value as ProjectRiskRecord['riskCategory'])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {riskCategoryOptions.map((option) => (
                    <SelectItem key={option} value={option}>{formatLabel(option)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={riskLevel} onValueChange={(value) => setRiskLevel(value as ProjectRiskRecord['riskLevel'])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {riskLevelOptions.map((option) => (
                    <SelectItem key={option} value={option}>{formatLabel(option)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={riskStatus} onValueChange={(value) => setRiskStatus(value as ProjectRiskRecord['status'])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {riskStatusOptions.map((option) => (
                    <SelectItem key={option} value={option}>{formatLabel(option)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button size="sm" className="w-full gap-2" onClick={createRisk}>
              <Plus className="h-4 w-4" />
              Add Risk
            </Button>
          </div>
          <div className="space-y-2">
            {risks.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-200 bg-white px-3 py-5 text-xs text-slate-400">
                No risk records yet.
              </div>
            ) : (
              risks.slice(0, 5).map((item) => {
                  const pendingFollowUp = isPendingFollowUpTarget('risk', item.id)
                  const stalledFollowUp = isStalledFollowUpTarget('risk', item.id)
                  const recommended = isRecommendedTarget('risk', item.id)
                  const ownerTone = stalledFollowUp ? 'escalated' : pendingFollowUp ? 'follow_up' : 'recommended'
                  return (
                <div
                  key={item.id}
                  className={`rounded-lg border px-3 py-3 ${
                    stalledFollowUp
                      ? stalledFollowUpCardClass(true)
                      : pendingFollowUp
                      ? followUpCardClass(true)
                      : recommendedCardClass(recommended)
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-medium text-slate-900">{item.riskTitle}</div>
                    <div className="flex items-center gap-2">
                      {recommended ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 border-sky-200 bg-sky-50 px-2 text-[11px] text-sky-700 hover:bg-sky-100"
                          onClick={() => applyRecommendedObjectAction('risk', item.id)}
                        >
                          {getRecommendedActionButtonLabel(
                            'risk',
                            pendingFollowUp,
                            stalledFollowUp,
                          )}
                        </Button>
                      ) : null}
                      {stalledFollowUp ? (
                        <Badge className="border-rose-200 bg-rose-100 text-rose-700">Escalate First</Badge>
                      ) : null}
                      {pendingFollowUp ? (
                        <Badge className="border-amber-200 bg-amber-100 text-amber-700">Follow-up First</Badge>
                      ) : null}
                      {recommended && !pendingFollowUp ? (
                        <Badge className="border-sky-200 bg-sky-100 text-sky-700">Recommended</Badge>
                      ) : null}
                      {recommended && item.owner ? (
                        <Badge className={ownerBadgeClass(ownerTone)}>Owner {item.owner}</Badge>
                      ) : null}
                      <Badge className={statusBadgeClass(item.status)}>{formatLabel(item.status)}</Badge>
                    </div>
                  </div>
                  <div className="mt-1 text-[11px] text-slate-500">
                    {formatLabel(item.riskCategory)} · {formatLabel(item.riskLevel)} · Owner: {item.owner || '—'}
                  </div>
                  {getStalledFollowUpReason('risk', item.id) ? (
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-rose-700">
                      <Badge className={escalationReasonBadgeClass(controlSummary?.latestEscalationReasonKind)}>
                        {escalationReasonLabel(controlSummary?.latestEscalationReasonKind)}
                      </Badge>
                      <span>Escalation reason: {getStalledFollowUpReason('risk', item.id)}</span>
                    </div>
                  ) : null}
                </div>
                  )
                })
            )}
          </div>
        </section>

        <section className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/40 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Bug className="h-4 w-4 text-slate-500" />
            Issue List
          </div>
          <div className="space-y-2">
            <Input value={issueTitle} onChange={(e) => setIssueTitle(e.target.value)} placeholder="Issue title" />
            <Input value={issueOwner} onChange={(e) => setIssueOwner(e.target.value)} placeholder="Owner" />
            <div className="grid gap-2 md:grid-cols-3">
              <Select value={issueStage} onValueChange={(value) => setIssueStage(value as ProjectIssueRecord['issueStage'])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {issueStageOptions.map((option) => (
                    <SelectItem key={option} value={option}>{formatLabel(option)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={issueSeverity} onValueChange={(value) => setIssueSeverity(value as ProjectIssueRecord['severity'])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {issueSeverityOptions.map((option) => (
                    <SelectItem key={option} value={option}>{formatLabel(option)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={issueStatus} onValueChange={(value) => setIssueStatus(value as ProjectIssueRecord['status'])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {issueStatusOptions.map((option) => (
                    <SelectItem key={option} value={option}>{formatLabel(option)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button size="sm" className="w-full gap-2" onClick={createIssue}>
              <Plus className="h-4 w-4" />
              Add Issue
            </Button>
          </div>
          <div className="space-y-2">
            {issues.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-200 bg-white px-3 py-5 text-xs text-slate-400">
                No issue records yet.
              </div>
            ) : (
              issues.slice(0, 5).map((item) => {
                  const pendingFollowUp = isPendingFollowUpTarget('issue', item.id)
                  const stalledFollowUp = isStalledFollowUpTarget('issue', item.id)
                  const recommended = isRecommendedTarget('issue', item.id)
                  const ownerTone = stalledFollowUp ? 'escalated' : pendingFollowUp ? 'follow_up' : 'recommended'
                  return (
                <div
                  key={item.id}
                  className={`rounded-lg border px-3 py-3 ${
                    stalledFollowUp
                      ? stalledFollowUpCardClass(true)
                      : pendingFollowUp
                      ? followUpCardClass(true)
                      : recommendedCardClass(recommended)
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-medium text-slate-900">{item.issueTitle}</div>
                    <div className="flex items-center gap-2">
                      {recommended ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 border-sky-200 bg-sky-50 px-2 text-[11px] text-sky-700 hover:bg-sky-100"
                          onClick={() => applyRecommendedObjectAction('issue', item.id)}
                        >
                          {getRecommendedActionButtonLabel(
                            'issue',
                            pendingFollowUp,
                            stalledFollowUp,
                          )}
                        </Button>
                      ) : null}
                      {stalledFollowUp ? (
                        <Badge className="border-rose-200 bg-rose-100 text-rose-700">Escalate First</Badge>
                      ) : null}
                      {pendingFollowUp ? (
                        <Badge className="border-amber-200 bg-amber-100 text-amber-700">Follow-up First</Badge>
                      ) : null}
                      {recommended && !pendingFollowUp ? (
                        <Badge className="border-sky-200 bg-sky-100 text-sky-700">Recommended</Badge>
                      ) : null}
                      {recommended && item.owner ? (
                        <Badge className={ownerBadgeClass(ownerTone)}>Owner {item.owner}</Badge>
                      ) : null}
                      <Badge className={statusBadgeClass(item.status)}>{formatLabel(item.status)}</Badge>
                    </div>
                  </div>
                  <div className="mt-1 text-[11px] text-slate-500">
                    {formatLabel(item.issueStage)} · {formatLabel(item.severity)} · Owner: {item.owner || '—'}
                  </div>
                  {getStalledFollowUpReason('issue', item.id) ? (
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-rose-700">
                      <Badge className={escalationReasonBadgeClass(controlSummary?.latestEscalationReasonKind)}>
                        {escalationReasonLabel(controlSummary?.latestEscalationReasonKind)}
                      </Badge>
                      <span>Escalation reason: {getStalledFollowUpReason('issue', item.id)}</span>
                    </div>
                  ) : null}
                </div>
                  )
                })
            )}
          </div>
        </section>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <section className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/40 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <ShieldCheck className="h-4 w-4 text-slate-500" />
            FAT Control
          </div>
          <div className="space-y-2">
            <Input value={fatTitle} onChange={(e) => setFatTitle(e.target.value)} placeholder="FAT title" />
            <Input value={fatScope} onChange={(e) => setFatScope(e.target.value)} placeholder="FAT scope" />
            <Input value={fatOwner} onChange={(e) => setFatOwner(e.target.value)} placeholder="Owner" />
            <Select value={fatStatus} onValueChange={(value) => setFatStatus(value as ProjectFatRecord['status'])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {fatStatusOptions.map((option) => (
                  <SelectItem key={option} value={option}>{formatLabel(option)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" className="w-full gap-2" onClick={createFat}>
              <Plus className="h-4 w-4" />
              Add FAT
            </Button>
          </div>
          <div className="space-y-2">
            {fatRecords.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-200 bg-white px-3 py-5 text-xs text-slate-400">
                No FAT records yet.
              </div>
            ) : (
              fatRecords.slice(0, 5).map((item) => {
                  const pendingFollowUp = isPendingFollowUpTarget('fat', item.id)
                  const stalledFollowUp = isStalledFollowUpTarget('fat', item.id)
                  const recommended = isRecommendedTarget('fat', item.id)
                  const ownerTone = stalledFollowUp ? 'escalated' : pendingFollowUp ? 'follow_up' : 'recommended'
                  return (
                <div
                  key={item.id}
                  className={`rounded-lg border px-3 py-3 ${
                    stalledFollowUp
                      ? stalledFollowUpCardClass(true)
                      : pendingFollowUp
                      ? followUpCardClass(true)
                      : recommendedCardClass(recommended)
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-medium text-slate-900">{item.fatTitle}</div>
                    <div className="flex items-center gap-2">
                      {recommended ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 border-sky-200 bg-sky-50 px-2 text-[11px] text-sky-700 hover:bg-sky-100"
                          onClick={() => applyRecommendedObjectAction('fat', item.id)}
                        >
                          {getRecommendedActionButtonLabel(
                            'fat',
                            pendingFollowUp,
                            stalledFollowUp,
                          )}
                        </Button>
                      ) : null}
                      {stalledFollowUp ? (
                        <Badge className="border-rose-200 bg-rose-100 text-rose-700">Escalate First</Badge>
                      ) : null}
                      {pendingFollowUp ? (
                        <Badge className="border-amber-200 bg-amber-100 text-amber-700">Follow-up First</Badge>
                      ) : null}
                      {recommended && !pendingFollowUp ? (
                        <Badge className="border-sky-200 bg-sky-100 text-sky-700">Recommended</Badge>
                      ) : null}
                      {recommended && item.owner ? (
                        <Badge className={ownerBadgeClass(ownerTone)}>Owner {item.owner}</Badge>
                      ) : null}
                      <Badge className={statusBadgeClass(item.status)}>{formatLabel(item.status)}</Badge>
                    </div>
                  </div>
                  <div className="mt-1 text-[11px] text-slate-500">
                    {item.fatScope} · Owner: {item.owner || '—'}
                  </div>
                  {getStalledFollowUpReason('fat', item.id) ? (
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-rose-700">
                      <Badge className={escalationReasonBadgeClass(controlSummary?.latestEscalationReasonKind)}>
                        {escalationReasonLabel(controlSummary?.latestEscalationReasonKind)}
                      </Badge>
                      <span>Escalation reason: {getStalledFollowUpReason('fat', item.id)}</span>
                    </div>
                  ) : null}
                </div>
                  )
                })
            )}
          </div>
        </section>

        <section className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/40 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Wrench className="h-4 w-4 text-slate-500" />
            SAT Control
          </div>
          <div className="space-y-2">
            <Input value={satTitle} onChange={(e) => setSatTitle(e.target.value)} placeholder="SAT title" />
            <Input value={satSiteName} onChange={(e) => setSatSiteName(e.target.value)} placeholder="Site name" />
            <Input value={satOwner} onChange={(e) => setSatOwner(e.target.value)} placeholder="Owner" />
            <Select value={satStatus} onValueChange={(value) => setSatStatus(value as ProjectSatRecord['status'])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {satStatusOptions.map((option) => (
                  <SelectItem key={option} value={option}>{formatLabel(option)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" className="w-full gap-2" onClick={createSat}>
              <Plus className="h-4 w-4" />
              Add SAT
            </Button>
          </div>
          <div className="space-y-2">
            {satRecords.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-200 bg-white px-3 py-5 text-xs text-slate-400">
                No SAT records yet.
              </div>
            ) : (
              satRecords.slice(0, 5).map((item) => {
                  const pendingFollowUp = isPendingFollowUpTarget('sat', item.id)
                  const stalledFollowUp = isStalledFollowUpTarget('sat', item.id)
                  const recommended = isRecommendedTarget('sat', item.id)
                  const ownerTone = stalledFollowUp ? 'escalated' : pendingFollowUp ? 'follow_up' : 'recommended'
                  return (
                <div
                  key={item.id}
                  className={`rounded-lg border px-3 py-3 ${
                    stalledFollowUp
                      ? stalledFollowUpCardClass(true)
                      : pendingFollowUp
                      ? followUpCardClass(true)
                      : recommendedCardClass(recommended)
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-medium text-slate-900">{item.satTitle}</div>
                    <div className="flex items-center gap-2">
                      {recommended ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 border-sky-200 bg-sky-50 px-2 text-[11px] text-sky-700 hover:bg-sky-100"
                          onClick={() => applyRecommendedObjectAction('sat', item.id)}
                        >
                          {getRecommendedActionButtonLabel(
                            'sat',
                            pendingFollowUp,
                            stalledFollowUp,
                          )}
                        </Button>
                      ) : null}
                      {stalledFollowUp ? (
                        <Badge className="border-rose-200 bg-rose-100 text-rose-700">Escalate First</Badge>
                      ) : null}
                      {pendingFollowUp ? (
                        <Badge className="border-amber-200 bg-amber-100 text-amber-700">Follow-up First</Badge>
                      ) : null}
                      {recommended && !pendingFollowUp ? (
                        <Badge className="border-sky-200 bg-sky-100 text-sky-700">Recommended</Badge>
                      ) : null}
                      {recommended && item.owner ? (
                        <Badge className={ownerBadgeClass(ownerTone)}>Owner {item.owner}</Badge>
                      ) : null}
                      <Badge className={statusBadgeClass(item.status)}>{formatLabel(item.status)}</Badge>
                    </div>
                  </div>
                  <div className="mt-1 text-[11px] text-slate-500">
                    {(item.siteName || 'Site TBD')} · Owner: {item.owner || '—'}
                  </div>
                  {getStalledFollowUpReason('sat', item.id) ? (
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-rose-700">
                      <Badge className={escalationReasonBadgeClass(controlSummary?.latestEscalationReasonKind)}>
                        {escalationReasonLabel(controlSummary?.latestEscalationReasonKind)}
                      </Badge>
                      <span>Escalation reason: {getStalledFollowUpReason('sat', item.id)}</span>
                    </div>
                  ) : null}
                </div>
                  )
                })
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
