import { projectActionItemService } from './projectActionItemService'
import { projectFatService } from './projectFatService'
import { projectIssueListService } from './projectIssueListService'
import { projectMeetingService } from './projectMeetingService'
import { projectMilestoneService } from './projectMilestoneService'
import { projectRiskLedgerService } from './projectRiskLedgerService'
import { projectScheduleVarianceService } from './projectScheduleVarianceService'
import { projectSatService } from './projectSatService'
import { projectControlTouchLogService } from './projectControlTouchLogService'
import type {
  ProjectActionItemRecord,
  ProjectControlTouchLogRecord,
  ProjectFatRecord,
  ProjectIssueRecord,
  ProjectMilestoneRecord,
  ProjectRiskRecord,
  ProjectScheduleVarianceRecord,
  ProjectSatRecord,
} from './projectTypes'

type ProjectNodeHealth = 'stable' | 'attention' | 'blocked'

export interface ProjectNodeSummary {
  nodeKey: 'fat' | 'shipment' | 'sat' | 'final_acceptance'
  label: string
  health: ProjectNodeHealth
  summary: string
  blockerCount: number
  blockerLabels: string[]
  propagatedFrom?: string | null
}

export interface ProjectControlSummary {
  recommendedActionSource: 'stalled_follow_up' | 'pending_touch' | 'rule_engine'
  recommendedActionKind: 'schedule_node' | 'risk' | 'issue' | 'fat' | 'sat' | 'node_summary' | 'none'
  recommendedActionTargetId?: string | null
  recommendedActionTargetLabel?: string | null
  recommendedActionOwnerLabel?: string | null
  recommendedActionOwnerHint?: string | null
  focusOwnerLabel?: string | null
  focusOwnerOpenCount: number
  focusOwnerBlockedCount: number
  focusOwnerStalledTouchCount: number
  focusOwnerSummary?: string | null
  meetingCount: number
  openActionCount: number
  openRiskCount: number
  openIssueCount: number
  fatOpenCount: number
  satOpenCount: number
  delayedScheduleCount: number
  atRiskScheduleCount: number
  dependencyBlockedCount: number
  pendingTouchCount: number
  latestPendingTouchSummary?: string | null
  latestPendingTouchOwnerLabel?: string | null
  latestPendingTouchOwnerHint?: string | null
  latestEscalationSummary?: string | null
  latestEscalationOwnerLabel?: string | null
  latestEscalationOwnerHint?: string | null
  latestEscalationReasonKind?: 'dependency_blocked' | 'repeated_no_progress' | 'status_stalled' | 'unresolved_pending' | null
  latestEscalationReason?: string | null
  latestFollowUpProgressStatus?: 'advanced' | 'changed' | 'no_progress' | 'first_follow_up' | null
  latestFollowUpProgressSummary?: string | null
  latestOwnerActionResultStatus?: 'advanced' | 'changed' | 'no_progress' | 'first_follow_up' | null
  latestOwnerActionResult?: string | null
  recommendedAction: string
  recentTouchLogs: ProjectControlTouchLogRecord[]
  nodeSummaries: ProjectNodeSummary[]
}

function isOpenAction(item: ProjectActionItemRecord) {
  return item.status === 'open' || item.status === 'in_progress' || item.status === 'blocked'
}

function isOpenRisk(item: ProjectRiskRecord) {
  return item.status === 'open' || item.status === 'monitoring'
}

function isOpenIssue(item: ProjectIssueRecord) {
  return item.status === 'open' || item.status === 'fixing' || item.status === 'waiting_confirmation'
}

function isOpenFat(item: ProjectFatRecord) {
  return item.status !== 'approved'
}

function isOpenSat(item: ProjectSatRecord) {
  return item.status !== 'approved'
}

function isDelayedSchedule(item: ProjectScheduleVarianceRecord) {
  return item.status === 'delayed'
}

function isAtRiskSchedule(item: ProjectScheduleVarianceRecord) {
  return item.status === 'at_risk'
}

function buildNodeSummary(
  nodeKey: ProjectNodeSummary['nodeKey'],
  label: string,
  milestone: ProjectMilestoneRecord | undefined,
  risks: ProjectRiskRecord[],
  issues: ProjectIssueRecord[],
  fatRecords: ProjectFatRecord[],
  satRecords: ProjectSatRecord[],
  scheduleNodes: ProjectScheduleVarianceRecord[],
): ProjectNodeSummary {
  const highRiskCount = risks.filter((item) => item.riskLevel === 'high' || item.riskLevel === 'critical').length
  const openIssueCount = issues.filter(isOpenIssue).length
  const fatFailedCount = fatRecords.filter((item) => item.status === 'failed').length
  const satFailedCount = satRecords.filter((item) => item.status === 'failed').length
  const blockedSchedules = scheduleNodes.filter((item) => Boolean(item.dependencyBlockedBy))
  const blockerLabels = Array.from(new Set(blockedSchedules.map((item) => item.dependencyBlockedBy).filter(Boolean))) as string[]
  const milestoneStatus = milestone?.status || 'not_started'

  let health: ProjectNodeHealth = 'stable'
  if (
    milestoneStatus === 'blocked' ||
    milestoneStatus === 'delayed' ||
    highRiskCount > 0 ||
    fatFailedCount > 0 ||
    satFailedCount > 0 ||
    blockedSchedules.length > 0
  ) {
    health = 'blocked'
  } else if (
    milestoneStatus === 'in_progress' ||
    openIssueCount > 0 ||
    risks.length > 0 ||
    fatRecords.length > 0 ||
    satRecords.length > 0
  ) {
    health = 'attention'
  }

  const segments = [
    milestone ? `Milestone ${milestone.status}` : 'Milestone pending',
    risks.length > 0 ? `Risk ${risks.length}` : null,
    openIssueCount > 0 ? `Issue ${openIssueCount}` : null,
    fatRecords.length > 0 ? `FAT ${fatRecords.length}` : null,
    satRecords.length > 0 ? `SAT ${satRecords.length}` : null,
    scheduleNodes.some((item) => item.status === 'delayed') ? `Delay ${scheduleNodes.filter((item) => item.status === 'delayed').length}` : null,
    blockedSchedules.length > 0 ? `Dependency block ${blockedSchedules.length}` : null,
    blockerLabels.length > 0 ? `Blocked by ${blockerLabels.slice(0, 2).join(', ')}` : null,
  ]

  return {
    nodeKey,
    label,
    health,
    summary: segments.filter(Boolean).join(' / '),
    blockerCount: blockedSchedules.length,
    blockerLabels,
    propagatedFrom: null,
  }
}

function applyPropagation(nodeSummaries: ProjectNodeSummary[]) {
  return nodeSummaries.map((node, index) => {
    if (index === 0) return node

    const upstreamBlockedNodes = nodeSummaries
      .slice(0, index)
      .filter((item) => item.health === 'blocked')

    if (upstreamBlockedNodes.length === 0) {
      return node
    }

    const propagatedLabels = upstreamBlockedNodes.map((item) => item.label)
    const primarySource = propagatedLabels[0]
    const propagatedHealth =
      node.health === 'blocked'
        ? 'blocked'
        : node.health === 'attention'
          ? 'blocked'
          : 'attention'

    const propagatedSummary = [
      node.summary,
      `Upstream blocked by ${propagatedLabels.slice(0, 2).join(', ')}`,
    ]
      .filter(Boolean)
      .join(' / ')

    return {
      ...node,
      health: propagatedHealth,
      summary: propagatedSummary,
      propagatedFrom: primarySource,
    }
  })
}

function buildRecommendedAction(input: {
  nodeSummaries: ProjectNodeSummary[]
  scheduleNodes: ProjectScheduleVarianceRecord[]
  risks: ProjectRiskRecord[]
  issues: ProjectIssueRecord[]
  fatRecords: ProjectFatRecord[]
  satRecords: ProjectSatRecord[]
}) {
  const { nodeSummaries, scheduleNodes, risks, issues, fatRecords, satRecords } = input
  const delayedBlockedSchedule = scheduleNodes.find((item) => Boolean(item.dependencyBlockedBy) || item.status === 'delayed')
  if (delayedBlockedSchedule) {
    return {
      kind: 'schedule_node' as const,
      targetId: delayedBlockedSchedule.id,
      targetLabel: delayedBlockedSchedule.nodeName,
      ownerLabel: delayedBlockedSchedule.owner || null,
      message: `优先解除计划节点 ${delayedBlockedSchedule.nodeName} 的阻断`,
    }
  }

  const severeRisk = risks.find((item) => isOpenRisk(item) && (item.riskLevel === 'critical' || item.riskLevel === 'high'))
  if (severeRisk) {
    return {
      kind: 'risk' as const,
      targetId: severeRisk.id,
      targetLabel: severeRisk.riskTitle,
      ownerLabel: severeRisk.owner || null,
      message: `优先处理高风险项 ${severeRisk.riskTitle}`,
    }
  }

  const criticalIssue = issues.find((item) => isOpenIssue(item) && item.severity === 'critical')
  if (criticalIssue) {
    return {
      kind: 'issue' as const,
      targetId: criticalIssue.id,
      targetLabel: criticalIssue.issueTitle,
      ownerLabel: criticalIssue.owner || null,
      message: `优先关闭关键问题 ${criticalIssue.issueTitle}`,
    }
  }

  const failedFat = fatRecords.find((item) => item.status === 'failed')
  if (failedFat) {
    return {
      kind: 'fat' as const,
      targetId: failedFat.id,
      targetLabel: failedFat.fatTitle,
      ownerLabel: failedFat.owner || null,
      message: `优先重开 FAT 控制项 ${failedFat.fatTitle}`,
    }
  }

  const failedSat = satRecords.find((item) => item.status === 'failed')
  if (failedSat) {
    return {
      kind: 'sat' as const,
      targetId: failedSat.id,
      targetLabel: failedSat.satTitle,
      ownerLabel: failedSat.owner || null,
      message: `优先处理 SAT 控制项 ${failedSat.satTitle}`,
    }
  }

  const directBlocked = nodeSummaries.find((item) => item.blockerCount > 0)
  if (directBlocked) {
    const primaryBlocker = directBlocked.blockerLabels[0] || 'upstream dependency'
    return {
      kind: 'node_summary' as const,
      targetId: directBlocked.nodeKey,
      targetLabel: directBlocked.label,
      ownerLabel: null,
      message: `优先解除 ${directBlocked.label} 的阻断，先处理 ${primaryBlocker}`,
    }
  }

  const blockedNode = nodeSummaries.find((item) => item.health === 'blocked')
  if (blockedNode) {
    return {
      kind: 'node_summary' as const,
      targetId: blockedNode.nodeKey,
      targetLabel: blockedNode.label,
      ownerLabel: null,
      message: `优先处理 ${blockedNode.label}，当前已进入 blocked`,
    }
  }

  const attentionNode = nodeSummaries.find((item) => item.health === 'attention')
  if (attentionNode) {
    return {
      kind: 'node_summary' as const,
      targetId: attentionNode.nodeKey,
      targetLabel: attentionNode.label,
      ownerLabel: null,
      message: `优先跟进 ${attentionNode.label}，避免继续向后段传导`,
    }
  }

  return {
    kind: 'none' as const,
    targetId: null,
    targetLabel: null,
    ownerLabel: null,
    message: '当前控制链稳定，优先补齐计划节点和实际回写',
  }
}

function buildPendingTouchPriority(
  pendingTouchLog?: ProjectControlTouchLogRecord | null,
  progressStatus?: ProjectControlSummary['latestFollowUpProgressStatus'],
) {
  if (!pendingTouchLog) {
    return null
  }

  if (!['schedule_node', 'risk', 'issue', 'fat', 'sat'].includes(pendingTouchLog.actionKind)) {
    return null
  }

  return {
    kind: pendingTouchLog.actionKind,
    targetId: pendingTouchLog.targetId,
    targetLabel: pendingTouchLog.targetLabel,
    ownerLabel: null,
    message:
      progressStatus === 'no_progress'
        ? `优先升级处理连续未推进项 ${pendingTouchLog.targetLabel}`
        : `优先继续跟进未解除项 ${pendingTouchLog.targetLabel}`,
  } as const
}

function resolveRecommendedActionOwner(input: {
  kind: ProjectControlSummary['recommendedActionKind']
  targetId?: string | null
  scheduleNodes: ProjectScheduleVarianceRecord[]
  risks: ProjectRiskRecord[]
  issues: ProjectIssueRecord[]
  fatRecords: ProjectFatRecord[]
  satRecords: ProjectSatRecord[]
  fallbackOwner?: string | null
}) {
  const { kind, targetId, scheduleNodes, risks, issues, fatRecords, satRecords, fallbackOwner } = input
  if (fallbackOwner) {
    return fallbackOwner
  }
  if (!targetId) {
    return null
  }
  if (kind === 'schedule_node') return scheduleNodes.find((item) => item.id === targetId)?.owner || null
  if (kind === 'risk') return risks.find((item) => item.id === targetId)?.owner || null
  if (kind === 'issue') return issues.find((item) => item.id === targetId)?.owner || null
  if (kind === 'fat') return fatRecords.find((item) => item.id === targetId)?.owner || null
  if (kind === 'sat') return satRecords.find((item) => item.id === targetId)?.owner || null
  return null
}

function buildTouchOutcome(
  log: ProjectControlTouchLogRecord,
  input: {
    risks: ProjectRiskRecord[]
    issues: ProjectIssueRecord[]
    fatRecords: ProjectFatRecord[]
    satRecords: ProjectSatRecord[]
    scheduleNodes: ProjectScheduleVarianceRecord[]
  },
): Pick<ProjectControlTouchLogRecord, 'outcomeStatus' | 'outcomeSummary'> {
  const { risks, issues, fatRecords, satRecords, scheduleNodes } = input

  if (log.actionKind === 'schedule_node') {
    const target = scheduleNodes.find((item) => item.id === log.targetId)
    if (!target) return { outcomeStatus: 'pending', outcomeSummary: 'Target not found' }
    if (target.status === 'done' || (target.status === 'in_progress' && !target.dependencyBlockedBy)) {
      return { outcomeStatus: 'advanced', outcomeSummary: 'Node moved forward' }
    }
    return {
      outcomeStatus: 'pending',
      outcomeSummary: target.dependencyBlockedBy ? `Still blocked by ${target.dependencyBlockedBy}` : `Node ${target.status}`,
    }
  }

  if (log.actionKind === 'risk') {
    const target = risks.find((item) => item.id === log.targetId)
    if (!target) return { outcomeStatus: 'pending', outcomeSummary: 'Target not found' }
    return target.status === 'monitoring' || target.status === 'mitigated' || target.status === 'closed'
      ? { outcomeStatus: 'advanced', outcomeSummary: `Risk ${target.status}` }
      : { outcomeStatus: 'pending', outcomeSummary: `Risk ${target.status}` }
  }

  if (log.actionKind === 'issue') {
    const target = issues.find((item) => item.id === log.targetId)
    if (!target) return { outcomeStatus: 'pending', outcomeSummary: 'Target not found' }
    return target.status === 'fixing' || target.status === 'waiting_confirmation' || target.status === 'closed'
      ? { outcomeStatus: 'advanced', outcomeSummary: `Issue ${target.status}` }
      : { outcomeStatus: 'pending', outcomeSummary: `Issue ${target.status}` }
  }

  if (log.actionKind === 'fat') {
    const target = fatRecords.find((item) => item.id === log.targetId)
    if (!target) return { outcomeStatus: 'pending', outcomeSummary: 'Target not found' }
    return target.status === 'preparing' || target.status === 'ready_for_review' || target.status === 'approved'
      ? { outcomeStatus: 'advanced', outcomeSummary: `FAT ${target.status}` }
      : { outcomeStatus: 'pending', outcomeSummary: `FAT ${target.status}` }
  }

  const target = satRecords.find((item) => item.id === log.targetId)
  if (!target) return { outcomeStatus: 'pending', outcomeSummary: 'Target not found' }
  return target.status === 'in_progress' || target.status === 'waiting_customer_confirmation' || target.status === 'approved'
    ? { outcomeStatus: 'advanced', outcomeSummary: `SAT ${target.status}` }
    : { outcomeStatus: 'pending', outcomeSummary: `SAT ${target.status}` }
}

function buildFollowUpProgressSummary(
  latestLog: ProjectControlTouchLogRecord | undefined,
  enrichedLogs: ProjectControlTouchLogRecord[],
) {
  if (!latestLog) {
    return {
      status: null,
      summary: null,
    }
  }

  const previousLog = enrichedLogs.find(
    (item) =>
      item.id !== latestLog.id &&
      item.actionKind === latestLog.actionKind &&
      item.targetId === latestLog.targetId,
  )

  if (!previousLog) {
    return latestLog.outcomeStatus === 'advanced'
      ? {
          status: 'advanced' as const,
          summary: '本次首次跟进后已出现推进。',
        }
      : {
          status: 'first_follow_up' as const,
          summary: '这是当前 blocker 的第一次跟进记录。',
        }
  }

  if (latestLog.outcomeStatus === 'advanced' && previousLog.outcomeStatus !== 'advanced') {
    return {
      status: 'advanced' as const,
      summary: `本次跟进已从 ${previousLog.outcomeSummary || 'pending'} 推进到 ${latestLog.outcomeSummary || 'advanced'}。`,
    }
  }

  if (latestLog.outcomeSummary && previousLog.outcomeSummary && latestLog.outcomeSummary !== previousLog.outcomeSummary) {
    return {
      status: 'changed' as const,
      summary: `本次跟进已从 ${previousLog.outcomeSummary} 变化到 ${latestLog.outcomeSummary}。`,
    }
  }

  if (latestLog.outcomeStatus === previousLog.outcomeStatus) {
    return latestLog.outcomeStatus === 'advanced'
      ? {
          status: 'advanced' as const,
          summary: '本次跟进延续了前进状态。',
        }
      : {
          status: 'no_progress' as const,
          summary: '和上次相比，暂未看到明显进展。',
        }
  }

  return {
    status: 'changed' as const,
    summary: '本次跟进后状态已更新。',
  }
}

function buildEscalationReason(input: {
  latestEscalationLog: ProjectControlTouchLogRecord | undefined
  latestFollowUpProgressStatus: ProjectControlSummary['latestFollowUpProgressStatus']
}) {
  const { latestEscalationLog, latestFollowUpProgressStatus } = input
  if (!latestEscalationLog) {
    return {
      kind: null,
      summary: null,
    }
  }

  const outcomeSummary = latestEscalationLog.outcomeSummary || ''
  if (outcomeSummary.includes('Still blocked by')) {
    return {
      kind: 'dependency_blocked' as const,
      summary: outcomeSummary,
    }
  }

  if (latestFollowUpProgressStatus === 'no_progress') {
    return {
      kind: 'repeated_no_progress' as const,
      summary: '连续跟进后仍未看到明显进展',
    }
  }

  if (outcomeSummary.includes('Target not found')) {
    return {
      kind: 'status_stalled' as const,
      summary: '升级对象当前状态异常，需人工确认',
    }
  }

  return {
    kind: 'unresolved_pending' as const,
    summary: outcomeSummary || '当前仍未解除，需继续升级跟进',
  }
}

function buildOwnerHint(input: {
  ownerLabel?: string | null
  mode: 'recommended' | 'pending_follow_up' | 'escalation'
  targetLabel?: string | null
}) {
  const { ownerLabel, mode, targetLabel } = input
  if (!ownerLabel) return null
  if (mode === 'escalation') {
    return `请 ${ownerLabel} 优先升级处理 ${targetLabel || '当前阻断项'}`
  }
  if (mode === 'pending_follow_up') {
    return `请 ${ownerLabel} 继续跟进 ${targetLabel || '当前待处理项'}`
  }
  return `请 ${ownerLabel} 先推动 ${targetLabel || '当前建议对象'}`
}

function buildOwnerActionResult(input: {
  ownerLabel?: string | null
  progressStatus?: ProjectControlSummary['latestFollowUpProgressStatus']
  progressSummary?: string | null
}) {
  const { ownerLabel, progressStatus, progressSummary } = input
  if (!ownerLabel || !progressStatus) {
    return {
      status: null,
      summary: null,
    }
  }
  if (progressStatus === 'advanced') {
    return {
      status: 'advanced' as const,
      summary: `${ownerLabel} 跟进后已推动当前对象继续前进`,
    }
  }
  if (progressStatus === 'changed') {
    return {
      status: 'changed' as const,
      summary: `${ownerLabel} 已推动状态变化，但当前仍未完全解除`,
    }
  }
  if (progressStatus === 'first_follow_up') {
    return {
      status: 'first_follow_up' as const,
      summary: `${ownerLabel} 已开始第一次跟进，当前仍需继续观察结果`,
    }
  }
  return {
    status: 'no_progress' as const,
    summary: progressSummary
      ? `${ownerLabel} 已跟进，但结果仍为：${progressSummary}`
      : `${ownerLabel} 已跟进，但当前暂未看到明显进展`,
  }
}

function buildOwnerFocus(input: {
  ownerLabel?: string | null
  touchLogs: ProjectControlTouchLogRecord[]
  actionItems: ProjectActionItemRecord[]
  risks: ProjectRiskRecord[]
  issues: ProjectIssueRecord[]
  fatRecords: ProjectFatRecord[]
  satRecords: ProjectSatRecord[]
  scheduleNodes: ProjectScheduleVarianceRecord[]
}) {
  const { ownerLabel, touchLogs, actionItems, risks, issues, fatRecords, satRecords, scheduleNodes } = input
  if (!ownerLabel) {
    return {
      focusOwnerLabel: null,
      focusOwnerOpenCount: 0,
      focusOwnerBlockedCount: 0,
      focusOwnerStalledTouchCount: 0,
      focusOwnerSummary: null,
    }
  }

  const openActions = actionItems.filter((item) => item.owner === ownerLabel && isOpenAction(item))
  const openRisks = risks.filter((item) => item.owner === ownerLabel && isOpenRisk(item))
  const openIssues = issues.filter((item) => item.owner === ownerLabel && isOpenIssue(item))
  const openFat = fatRecords.filter((item) => item.owner === ownerLabel && isOpenFat(item))
  const openSat = satRecords.filter((item) => item.owner === ownerLabel && isOpenSat(item))
  const openSchedules = scheduleNodes.filter(
    (item) => item.owner === ownerLabel && item.status !== 'done',
  )

  const blockedCount =
    openActions.filter((item) => item.status === 'blocked').length +
    openRisks.filter((item) => item.riskLevel === 'high' || item.riskLevel === 'critical').length +
    openIssues.filter((item) => item.severity === 'critical').length +
    openFat.filter((item) => item.status === 'failed').length +
    openSat.filter((item) => item.status === 'failed').length +
    openSchedules.filter((item) => item.status === 'delayed' || Boolean(item.dependencyBlockedBy)).length

  const openCount =
    openActions.length +
    openRisks.length +
    openIssues.length +
    openFat.length +
    openSat.length +
    openSchedules.length
  const stalledTouchCount = touchLogs.filter(
    (item) => item.actorLabel === ownerLabel && item.outcomeStatus === 'pending',
  ).length

  return {
    focusOwnerLabel: ownerLabel,
    focusOwnerOpenCount: openCount,
    focusOwnerBlockedCount: blockedCount,
    focusOwnerStalledTouchCount: stalledTouchCount,
    focusOwnerSummary:
      openCount > 0
        ? `${ownerLabel} 当前共有 ${openCount} 个待推进项，其中 ${blockedCount} 个已处于卡点/高风险状态，最近 ${stalledTouchCount} 项跟进后仍未推进`
        : `${ownerLabel} 当前没有待推进项`,
  }
}

export const projectControlSummaryService = {
  getByProject(projectId: string, projectRevisionId?: string | null): ProjectControlSummary {
    const meetings = projectMeetingService.listByProject(projectId, projectRevisionId)
    const actionItems = projectActionItemService.listByProject(projectId, projectRevisionId)
    const milestones = projectMilestoneService.listByProject(projectId, projectRevisionId)
    const risks = projectRiskLedgerService.listByProject(projectId, projectRevisionId)
    const issues = projectIssueListService.listByProject(projectId, projectRevisionId)
    const fatRecords = projectFatService.listByProject(projectId, projectRevisionId)
    const satRecords = projectSatService.listByProject(projectId, projectRevisionId)
    const scheduleNodes = projectScheduleVarianceService.listByProject(projectId, projectRevisionId)
    const enrichedTouchLogs = projectControlTouchLogService
      .listByProject(projectId, projectRevisionId)
      .map((item) => ({
        ...item,
        ...buildTouchOutcome(item, {
          risks,
          issues,
          fatRecords,
          satRecords,
          scheduleNodes,
        }),
      }))
    const recentTouchLogs = enrichedTouchLogs.slice(0, 5)
    const pendingTouchLogs = recentTouchLogs.filter((item) => item.outcomeStatus === 'pending')
    const latestEscalationLog = recentTouchLogs.find((item) => item.actionLabel === 'Escalate')
    const latestPendingTouchOwnerLabel = pendingTouchLogs[0]
      ? resolveRecommendedActionOwner({
          kind: pendingTouchLogs[0].actionKind,
          targetId: pendingTouchLogs[0].targetId,
          scheduleNodes,
          risks,
          issues,
          fatRecords,
          satRecords,
        })
      : null
    const latestPendingTouchSummary = pendingTouchLogs[0]
      ? `${pendingTouchLogs[0].targetLabel} still pending: ${pendingTouchLogs[0].outcomeSummary || 'No resolution yet'}`
      : null
    const latestPendingTouchOwnerHint = pendingTouchLogs[0]
      ? buildOwnerHint({
          ownerLabel: latestPendingTouchOwnerLabel,
          mode: 'pending_follow_up',
          targetLabel: pendingTouchLogs[0].targetLabel,
        })
      : null
    const latestEscalationOwnerLabel = latestEscalationLog
      ? resolveRecommendedActionOwner({
          kind: latestEscalationLog.actionKind,
          targetId: latestEscalationLog.targetId,
          scheduleNodes,
          risks,
          issues,
          fatRecords,
          satRecords,
        })
      : null
    const latestEscalationSummary = latestEscalationLog
      ? `${latestEscalationLog.actorLabel} escalated ${latestEscalationLog.targetLabel}`
      : null
    const latestEscalationOwnerHint = latestEscalationLog
      ? buildOwnerHint({
          ownerLabel: latestEscalationOwnerLabel,
          mode: 'escalation',
          targetLabel: latestEscalationLog.targetLabel,
        })
      : null
    const latestFollowUpProgress = buildFollowUpProgressSummary(recentTouchLogs[0], enrichedTouchLogs)
    const latestEscalationReason = buildEscalationReason({
      latestEscalationLog,
      latestFollowUpProgressStatus: latestFollowUpProgress.status,
    })

    const fatMilestone = milestones.find((item) => item.milestoneStage === 'fat' || item.milestoneStage === 'fat_precheck')
    const shipmentMilestone = milestones.find((item) => item.milestoneStage === 'shipment' || item.milestoneStage === 'shipment_delivery')
    const satMilestone = milestones.find((item) => item.milestoneStage === 'sat' || item.milestoneStage === 'installation_sat')
    const finalMilestone = milestones.find((item) => item.milestoneStage === 'final_acceptance' || item.milestoneStage === 'handover')

    const baseNodeSummaries = [
      buildNodeSummary(
        'fat',
        'FAT & Pre-Ship',
        fatMilestone,
        risks.filter((item) => item.riskCategory === 'fat' || item.riskCategory === 'quality'),
        issues.filter((item) => item.issueStage === 'fat'),
        fatRecords,
        [],
        scheduleNodes.filter((item) => item.nodeStage === 'fat'),
      ),
      buildNodeSummary(
        'shipment',
        'Shipment & Delivery',
        shipmentMilestone,
        risks.filter((item) => item.riskCategory === 'shipment' || item.riskCategory === 'schedule'),
        issues.filter((item) => item.issueStage === 'shipment' || item.issueStage === 'document'),
        [],
        [],
        scheduleNodes.filter((item) => item.nodeStage === 'shipment'),
      ),
      buildNodeSummary(
        'sat',
        'Installation & SAT',
        satMilestone,
        risks.filter((item) => item.riskCategory === 'sat'),
        issues.filter((item) => item.issueStage === 'installation' || item.issueStage === 'sat'),
        [],
        satRecords,
        scheduleNodes.filter((item) => item.nodeStage === 'installation' || item.nodeStage === 'sat'),
      ),
      buildNodeSummary(
        'final_acceptance',
        'Final Acceptance',
        finalMilestone,
        risks.filter((item) => item.riskCategory === 'payment' || item.riskCategory === 'change'),
        issues.filter((item) => item.issueStage === 'final_acceptance'),
        [],
        [],
        scheduleNodes.filter((item) => item.nodeStage === 'final_acceptance' || item.nodeStage === 'handover'),
      ),
    ]

    const nodeSummaries = applyPropagation(baseNodeSummaries)
    const recommendedActionFromRules = buildRecommendedAction({
      nodeSummaries,
      scheduleNodes,
      risks,
      issues,
      fatRecords,
      satRecords,
    })
    const recommendedActionFromPendingTouch = buildPendingTouchPriority(
      pendingTouchLogs[0],
      latestFollowUpProgress.status,
    )
    const recommendedAction = recommendedActionFromPendingTouch || recommendedActionFromRules
    const recommendedActionOwnerLabel = resolveRecommendedActionOwner({
      kind: recommendedAction.kind,
      targetId: recommendedAction.targetId,
      scheduleNodes,
      risks,
      issues,
      fatRecords,
      satRecords,
      fallbackOwner: 'ownerLabel' in recommendedAction ? recommendedAction.ownerLabel : null,
    })
    const recommendedActionSource = recommendedActionFromPendingTouch
      ? latestFollowUpProgress.status === 'no_progress'
        ? 'stalled_follow_up' as const
        : 'pending_touch' as const
      : 'rule_engine' as const
    const recommendedActionOwnerHint = buildOwnerHint({
      ownerLabel: recommendedActionOwnerLabel,
      mode: 'recommended',
      targetLabel: recommendedAction.targetLabel,
    })
    const latestOwnerActionResult = buildOwnerActionResult({
      ownerLabel:
        latestEscalationOwnerLabel ||
        latestPendingTouchOwnerLabel ||
        recommendedActionOwnerLabel,
      progressStatus: latestFollowUpProgress.status,
      progressSummary: latestFollowUpProgress.summary,
    })
    const ownerFocus = buildOwnerFocus({
      ownerLabel:
        latestEscalationOwnerLabel ||
        latestPendingTouchOwnerLabel ||
        recommendedActionOwnerLabel,
      touchLogs: recentTouchLogs,
      actionItems,
      risks,
      issues,
      fatRecords,
      satRecords,
      scheduleNodes,
    })

    return {
      recommendedActionSource,
      recommendedActionKind: recommendedAction.kind,
      recommendedActionTargetId: recommendedAction.targetId,
      recommendedActionTargetLabel: recommendedAction.targetLabel,
      recommendedActionOwnerLabel,
      recommendedActionOwnerHint,
      focusOwnerLabel: ownerFocus.focusOwnerLabel,
      focusOwnerOpenCount: ownerFocus.focusOwnerOpenCount,
      focusOwnerBlockedCount: ownerFocus.focusOwnerBlockedCount,
      focusOwnerStalledTouchCount: ownerFocus.focusOwnerStalledTouchCount,
      focusOwnerSummary: ownerFocus.focusOwnerSummary,
      meetingCount: meetings.length,
      openActionCount: actionItems.filter(isOpenAction).length,
      openRiskCount: risks.filter(isOpenRisk).length,
      openIssueCount: issues.filter(isOpenIssue).length,
      fatOpenCount: fatRecords.filter(isOpenFat).length,
      satOpenCount: satRecords.filter(isOpenSat).length,
      delayedScheduleCount: scheduleNodes.filter(isDelayedSchedule).length,
      atRiskScheduleCount: scheduleNodes.filter(isAtRiskSchedule).length,
      dependencyBlockedCount: scheduleNodes.filter((item) => Boolean(item.dependencyBlockedBy)).length,
      pendingTouchCount: pendingTouchLogs.length,
      latestPendingTouchSummary,
      latestPendingTouchOwnerLabel,
      latestPendingTouchOwnerHint,
      latestEscalationSummary,
      latestEscalationOwnerLabel,
      latestEscalationOwnerHint,
      latestEscalationReasonKind: latestEscalationReason.kind,
      latestEscalationReason: latestEscalationReason.summary,
      latestFollowUpProgressStatus: latestFollowUpProgress.status,
      latestFollowUpProgressSummary: latestFollowUpProgress.summary,
      latestOwnerActionResultStatus: latestOwnerActionResult.status,
      latestOwnerActionResult: latestOwnerActionResult.summary,
      nodeSummaries,
      recommendedAction: recommendedAction.message,
      recentTouchLogs,
    }
  },
}
