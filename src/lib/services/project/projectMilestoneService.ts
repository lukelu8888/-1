import { readProjectRecords, writeProjectRecords } from './projectStorage'
import type { ProjectMilestoneRecord } from './projectTypes'

const STORAGE_KEY = 'projectControl.milestones.v1'

export const projectMilestoneService = {
  listByProject(projectId: string, projectRevisionId?: string | null): ProjectMilestoneRecord[] {
    return readProjectRecords<ProjectMilestoneRecord>(STORAGE_KEY).filter(
      (item) =>
        item.projectId === projectId &&
        (!projectRevisionId || item.projectRevisionId === projectRevisionId),
    )
  },

  create(input: Omit<ProjectMilestoneRecord, 'id' | 'createdAt' | 'updatedAt'>): ProjectMilestoneRecord {
    const next: ProjectMilestoneRecord = {
      ...input,
      id: `project-milestone-${crypto.randomUUID()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    writeProjectRecords(STORAGE_KEY, [next, ...readProjectRecords<ProjectMilestoneRecord>(STORAGE_KEY)])
    return next
  },

  update(milestoneId: string, patch: Partial<ProjectMilestoneRecord>) {
    writeProjectRecords(
      STORAGE_KEY,
      readProjectRecords<ProjectMilestoneRecord>(STORAGE_KEY).map((item) =>
        item.id === milestoneId ? { ...item, ...patch, updatedAt: new Date().toISOString() } : item,
      ),
    )
  },
}
