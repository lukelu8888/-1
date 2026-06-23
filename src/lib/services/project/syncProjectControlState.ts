import { projectFatService } from './projectFatService'
import { projectIssueListService } from './projectIssueListService'
import { projectMilestoneService } from './projectMilestoneService'
import { projectRiskLedgerService } from './projectRiskLedgerService'
import { projectScheduleVarianceService } from './projectScheduleVarianceService'
import { projectSatService } from './projectSatService'
import type {
  ProjectFatRecord,
  ProjectIssueRecord,
  ProjectMilestoneRecord,
  ProjectRiskRecord,
  ProjectScheduleVarianceRecord,
  ProjectSatRecord,
} from './projectTypes'

function normalizeStage(value?: string | null) {
  return String(value || '').trim().toLowerCase()
}

function isOpenRisk(item: ProjectRiskRecord) {
  return item.status === 'open' || item.status === 'monitoring'
}

function isOpenIssue(item: ProjectIssueRecord) {
  return item.status === 'open' || item.status === 'fixing' || item.status === 'waiting_confirmation'
}

function isSevereRisk(item: ProjectRiskRecord) {
  return (item.riskLevel === 'high' || item.riskLevel === 'critical') && isOpenRisk(item)
}

function isCriticalIssue(item: ProjectIssueRecord) {
  return item.severity === 'critical' && isOpenIssue(item)
}

function matchesMilestoneStage(milestone: ProjectMilestoneRecord, aliases: string[]) {
  const stage = normalizeStage(milestone.milestoneStage)
  return aliases.includes(stage)
}

function deriveFatStatus(fat: ProjectFatRecord, risks: ProjectRiskRecord[], issues: ProjectIssueRecord[]) {
  if (risks.some(isSevereRisk) || issues.some(isCriticalIssue)) return 'failed' as const
  if (fat.status === 'approved') return 'approved' as const
  if (risks.some(isOpenRisk) || issues.some(isOpenIssue)) return 'ready_for_review' as const
  if (fat.status === 'preparing' || fat.status === 'ready_for_review') return fat.status
  return fat.status === 'failed' ? 'failed' : 'preparing'
}

function deriveSatStatus(sat: ProjectSatRecord, risks: ProjectRiskRecord[], issues: ProjectIssueRecord[]) {
  if (risks.some(isSevereRisk) || issues.some(isCriticalIssue)) return 'failed' as const
  if (sat.status === 'approved') return 'approved' as const
  if (issues.some(isOpenIssue)) return 'waiting_customer_confirmation' as const
  if (risks.some(isOpenRisk)) return 'in_progress' as const
  return sat.status === 'failed' ? 'failed' : sat.status
}

function deriveMilestoneStatus(
  milestone: ProjectMilestoneRecord,
  risks: ProjectRiskRecord[],
  issues: ProjectIssueRecord[],
  fatRecords: ProjectFatRecord[],
  satRecords: ProjectSatRecord[],
) {
  const hasOpenRisk = risks.some(isOpenRisk)
  const hasSevereRisk = risks.some(isSevereRisk)
  const hasOpenIssue = issues.some(isOpenIssue)
  const hasCriticalIssue = issues.some(isCriticalIssue)
  const hasFatFailure = fatRecords.some((item) => item.status === 'failed')
  const hasSatFailure = satRecords.some((item) => item.status === 'failed')
  const hasFatApproved = fatRecords.some((item) => item.status === 'approved')
  const hasSatApproved = satRecords.some((item) => item.status === 'approved')
  const stage = normalizeStage(milestone.milestoneStage)

  if (hasSevereRisk || hasCriticalIssue || hasFatFailure || hasSatFailure) return 'blocked' as const

  if (['fat', 'fat_precheck'].includes(stage)) {
    if (hasFatApproved) return 'done' as const
    if (fatRecords.length > 0 || hasOpenRisk || hasOpenIssue) return 'in_progress' as const
    return milestone.status
  }

  if (['shipment', 'shipment_delivery'].includes(stage)) {
    if (hasOpenRisk || hasOpenIssue) return 'in_progress' as const
    return milestone.status
  }

  if (['sat', 'installation_sat'].includes(stage)) {
    if (hasSatApproved) return 'done' as const
    if (satRecords.length > 0 || hasOpenRisk || hasOpenIssue) return 'in_progress' as const
    return milestone.status
  }

  if (['final_acceptance', 'handover'].includes(stage)) {
    if (hasSatApproved && !hasOpenIssue && !hasOpenRisk) return 'in_progress' as const
    if (hasOpenRisk || hasOpenIssue) return 'blocked' as const
    return milestone.status
  }

  return milestone.status
}

function deriveScheduleStatus(
  node: ProjectScheduleVarianceRecord,
  milestone: ProjectMilestoneRecord | undefined,
  risks: ProjectRiskRecord[],
  issues: ProjectIssueRecord[],
  dependencyBlockedBy?: string | null,
) {
  const now = Date.now()
  const plannedEndTime = node.plannedEnd ? new Date(node.plannedEnd).getTime() : null
  const hasSevereRisk = risks.some(isSevereRisk)
  const hasCriticalIssue = issues.some(isCriticalIssue)
  const hasOpenRisk = risks.some(isOpenRisk)
  const hasOpenIssue = issues.some(isOpenIssue)

  if (node.actualEnd || milestone?.status === 'done') return 'done' as const
  if (dependencyBlockedBy) return 'delayed' as const
  if (milestone?.status === 'blocked' || milestone?.status === 'delayed') return 'delayed' as const
  if (hasSevereRisk || hasCriticalIssue) return 'delayed' as const
  if (node.actualStart || milestone?.status === 'in_progress') return 'in_progress' as const
  if (plannedEndTime && plannedEndTime < now) return 'delayed' as const
  if (hasOpenRisk || hasOpenIssue || node.riskLevel === 'high' || node.riskLevel === 'critical') return 'at_risk' as const
  return 'planned' as const
}

export function syncProjectControlState(projectId: string, projectRevisionId?: string | null) {
  const milestones = projectMilestoneService.listByProject(projectId, projectRevisionId)
  const risks = projectRiskLedgerService.listByProject(projectId, projectRevisionId)
  const issues = projectIssueListService.listByProject(projectId, projectRevisionId)
  const fatRecords = projectFatService.listByProject(projectId, projectRevisionId)
  const satRecords = projectSatService.listByProject(projectId, projectRevisionId)
  const scheduleNodes = projectScheduleVarianceService.listByProject(projectId, projectRevisionId)

  fatRecords.forEach((fat) => {
    const relatedRisks = risks.filter(
      (item) => item.linkedActionItemId === fat.linkedRiskId || item.riskCategory === 'fat' || item.riskCategory === 'quality',
    )
    const relatedIssues = issues.filter((item) => item.issueStage === 'fat')
    const nextStatus = deriveFatStatus(fat, relatedRisks, relatedIssues)
    if (nextStatus !== fat.status) {
      projectFatService.update(fat.id, { status: nextStatus })
    }
  })

  satRecords.forEach((sat) => {
    const relatedRisks = risks.filter((item) => item.riskCategory === 'sat')
    const relatedIssues = issues.filter(
      (item) => item.issueStage === 'installation' || item.issueStage === 'sat' || item.id === sat.linkedIssueId,
    )
    const nextStatus = deriveSatStatus(sat, relatedRisks, relatedIssues)
    if (nextStatus !== sat.status) {
      projectSatService.update(sat.id, { status: nextStatus })
    }
  })

  const refreshedFatRecords = projectFatService.listByProject(projectId, projectRevisionId)
  const refreshedSatRecords = projectSatService.listByProject(projectId, projectRevisionId)

  milestones.forEach((milestone) => {
    const stage = normalizeStage(milestone.milestoneStage)
    const relatedRisks = risks.filter((item) => {
      if (['fat', 'fat_precheck'].includes(stage)) return item.riskCategory === 'fat' || item.riskCategory === 'quality'
      if (['shipment', 'shipment_delivery'].includes(stage)) return item.riskCategory === 'shipment' || item.riskCategory === 'schedule'
      if (['sat', 'installation_sat'].includes(stage)) return item.riskCategory === 'sat'
      if (['final_acceptance', 'handover'].includes(stage)) return item.riskCategory === 'payment' || item.riskCategory === 'change'
      return false
    })

    const relatedIssues = issues.filter((item) => {
      if (['fat', 'fat_precheck'].includes(stage)) return item.issueStage === 'fat'
      if (['shipment', 'shipment_delivery'].includes(stage)) return item.issueStage === 'shipment' || item.issueStage === 'document'
      if (['sat', 'installation_sat'].includes(stage)) return item.issueStage === 'installation' || item.issueStage === 'sat'
      if (['final_acceptance', 'handover'].includes(stage)) return item.issueStage === 'final_acceptance'
      return false
    })

    const relatedFatRecords = refreshedFatRecords.filter((item) =>
      item.linkedMilestoneId ? item.linkedMilestoneId === milestone.id : matchesMilestoneStage(milestone, ['fat', 'fat_precheck']),
    )
    const relatedSatRecords = refreshedSatRecords.filter((item) =>
      item.linkedMilestoneId ? item.linkedMilestoneId === milestone.id : matchesMilestoneStage(milestone, ['sat', 'installation_sat']),
    )

    const nextStatus = deriveMilestoneStatus(milestone, relatedRisks, relatedIssues, relatedFatRecords, relatedSatRecords)
    if (nextStatus !== milestone.status) {
      projectMilestoneService.update(milestone.id, { status: nextStatus })
    }
  })

  const refreshedMilestones = projectMilestoneService.listByProject(projectId, projectRevisionId)

  scheduleNodes.forEach((node) => {
    const linkedMilestone = node.linkedMilestoneId
      ? refreshedMilestones.find((item) => item.id === node.linkedMilestoneId)
      : refreshedMilestones.find((item) => normalizeStage(item.milestoneStage) === normalizeStage(node.nodeStage))

    const relatedRisks = risks.filter((item) => {
      if (node.nodeStage === 'fat') return item.riskCategory === 'fat' || item.riskCategory === 'quality'
      if (node.nodeStage === 'shipment') return item.riskCategory === 'shipment' || item.riskCategory === 'schedule'
      if (node.nodeStage === 'installation' || node.nodeStage === 'sat') return item.riskCategory === 'sat'
      return item.riskCategory === 'payment' || item.riskCategory === 'change'
    })

    const relatedIssues = issues.filter((item) => {
      if (node.nodeStage === 'fat') return item.issueStage === 'fat'
      if (node.nodeStage === 'shipment') return item.issueStage === 'shipment' || item.issueStage === 'document'
      if (node.nodeStage === 'installation' || node.nodeStage === 'sat') return item.issueStage === 'installation' || item.issueStage === 'sat'
      return item.issueStage === 'final_acceptance'
    })

    const dependencyCandidate = node.dependency
      ? scheduleNodes.find(
          (item) =>
            item.id !== node.id &&
            (normalizeStage(item.nodeName) === normalizeStage(node.dependency) ||
              normalizeStage(item.nodeStage) === normalizeStage(node.dependency)),
        )
      : null

    const dependencyMilestone = node.dependency
      ? refreshedMilestones.find(
          (item) =>
            normalizeStage(item.milestoneName) === normalizeStage(node.dependency) ||
            normalizeStage(item.milestoneStage) === normalizeStage(node.dependency),
        )
      : null

    const dependencyBlockedBy =
      dependencyCandidate && dependencyCandidate.status !== 'done'
        ? dependencyCandidate.nodeName
        : dependencyMilestone && dependencyMilestone.status !== 'done'
          ? dependencyMilestone.milestoneName
          : null

    const nextStatus = deriveScheduleStatus(node, linkedMilestone, relatedRisks, relatedIssues, dependencyBlockedBy)
    const varianceDays = projectScheduleVarianceService.getVarianceDays(node)
    const varianceReasonSummary = projectScheduleVarianceService.buildVarianceReasonSummary({
      varianceDays,
      dependencyBlockedBy,
      milestoneStatus: linkedMilestone?.status || null,
      openRiskCount: relatedRisks.filter(isOpenRisk).length,
      openIssueCount: relatedIssues.filter(isOpenIssue).length,
      severeRiskCount: relatedRisks.filter(isSevereRisk).length,
      criticalIssueCount: relatedIssues.filter(isCriticalIssue).length,
    })

    if (
      nextStatus !== node.status ||
      dependencyBlockedBy !== (node.dependencyBlockedBy || null) ||
      varianceReasonSummary !== (node.varianceReasonSummary || null)
    ) {
      projectScheduleVarianceService.update(node.id, {
        status: nextStatus,
        dependencyBlockedBy,
        varianceReasonSummary,
      })
    }
  })
}
