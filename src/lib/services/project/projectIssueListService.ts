import { readProjectRecords, writeProjectRecords } from './projectStorage'
import type { ProjectIssueRecord } from './projectTypes'

const STORAGE_KEY = 'projectControl.issues.v1'

export const projectIssueListService = {
  listByProject(projectId: string, projectRevisionId?: string | null): ProjectIssueRecord[] {
    return readProjectRecords<ProjectIssueRecord>(STORAGE_KEY).filter(
      (item) =>
        item.projectId === projectId &&
        (!projectRevisionId || item.projectRevisionId === projectRevisionId),
    )
  },

  create(input: Omit<ProjectIssueRecord, 'id' | 'createdAt' | 'updatedAt'>): ProjectIssueRecord {
    const next: ProjectIssueRecord = {
      ...input,
      id: `project-issue-${crypto.randomUUID()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    writeProjectRecords(STORAGE_KEY, [next, ...readProjectRecords<ProjectIssueRecord>(STORAGE_KEY)])
    return next
  },

  update(issueId: string, patch: Partial<ProjectIssueRecord>) {
    writeProjectRecords(
      STORAGE_KEY,
      readProjectRecords<ProjectIssueRecord>(STORAGE_KEY).map((item) =>
        item.id === issueId ? { ...item, ...patch, updatedAt: new Date().toISOString() } : item,
      ),
    )
  },
}
