import { readProjectRecords, writeProjectRecords } from './projectStorage'
import type { ProjectScheduleVarianceRecord } from './projectTypes'

const STORAGE_KEY = 'projectControl.scheduleVariance.v1'

function toDate(value?: string | null) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function diffDays(start?: string | null, end?: string | null) {
  const startDate = toDate(start)
  const endDate = toDate(end)
  if (!startDate || !endDate) return null
  const diff = endDate.getTime() - startDate.getTime()
  return Math.round(diff / (1000 * 60 * 60 * 24))
}

export const projectScheduleVarianceService = {
  listByProject(projectId: string, projectRevisionId?: string | null): ProjectScheduleVarianceRecord[] {
    return readProjectRecords<ProjectScheduleVarianceRecord>(STORAGE_KEY).filter(
      (item) =>
        item.projectId === projectId &&
        (!projectRevisionId || item.projectRevisionId === projectRevisionId),
    )
  },

  create(input: Omit<ProjectScheduleVarianceRecord, 'id' | 'createdAt' | 'updatedAt'>): ProjectScheduleVarianceRecord {
    const next: ProjectScheduleVarianceRecord = {
      ...input,
      id: `project-schedule-${crypto.randomUUID()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    writeProjectRecords(STORAGE_KEY, [next, ...readProjectRecords<ProjectScheduleVarianceRecord>(STORAGE_KEY)])
    return next
  },

  update(recordId: string, patch: Partial<ProjectScheduleVarianceRecord>) {
    writeProjectRecords(
      STORAGE_KEY,
      readProjectRecords<ProjectScheduleVarianceRecord>(STORAGE_KEY).map((item) =>
        item.id === recordId ? { ...item, ...patch, updatedAt: new Date().toISOString() } : item,
      ),
    )
  },

  getVarianceDays(record: Pick<ProjectScheduleVarianceRecord, 'plannedEnd' | 'actualEnd'>) {
    return diffDays(record.plannedEnd, record.actualEnd)
  },

  getPlannedDurationDays(record: Pick<ProjectScheduleVarianceRecord, 'plannedStart' | 'plannedEnd'>) {
    return diffDays(record.plannedStart, record.plannedEnd)
  },

  buildVarianceReasonSummary(input: {
    varianceDays?: number | null
    dependencyBlockedBy?: string | null
    milestoneStatus?: string | null
    openRiskCount?: number
    openIssueCount?: number
    severeRiskCount?: number
    criticalIssueCount?: number
  }) {
    const segments: string[] = []

    if (input.dependencyBlockedBy) {
      segments.push(`Blocked by ${input.dependencyBlockedBy}`)
    }

    if (input.criticalIssueCount && input.criticalIssueCount > 0) {
      segments.push(`Critical issue ${input.criticalIssueCount}`)
    } else if (input.openIssueCount && input.openIssueCount > 0) {
      segments.push(`Issue ${input.openIssueCount}`)
    }

    if (input.severeRiskCount && input.severeRiskCount > 0) {
      segments.push(`High risk ${input.severeRiskCount}`)
    } else if (input.openRiskCount && input.openRiskCount > 0) {
      segments.push(`Risk ${input.openRiskCount}`)
    }

    if (input.milestoneStatus && input.milestoneStatus !== 'not_started' && input.milestoneStatus !== 'planned') {
      segments.push(`Milestone ${input.milestoneStatus}`)
    }

    if (typeof input.varianceDays === 'number' && input.varianceDays > 0) {
      segments.push(`Delay +${input.varianceDays}d`)
    }

    return segments.length > 0 ? segments.join(' / ') : 'On baseline'
  },
}
