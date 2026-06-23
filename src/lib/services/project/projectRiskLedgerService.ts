import { readProjectRecords, writeProjectRecords } from './projectStorage'
import type { ProjectRiskRecord } from './projectTypes'

const STORAGE_KEY = 'projectControl.risks.v1'

export const projectRiskLedgerService = {
  listByProject(projectId: string, projectRevisionId?: string | null): ProjectRiskRecord[] {
    return readProjectRecords<ProjectRiskRecord>(STORAGE_KEY).filter(
      (item) =>
        item.projectId === projectId &&
        (!projectRevisionId || item.projectRevisionId === projectRevisionId),
    )
  },

  create(input: Omit<ProjectRiskRecord, 'id' | 'createdAt' | 'updatedAt'>): ProjectRiskRecord {
    const next: ProjectRiskRecord = {
      ...input,
      id: `project-risk-${crypto.randomUUID()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    writeProjectRecords(STORAGE_KEY, [next, ...readProjectRecords<ProjectRiskRecord>(STORAGE_KEY)])
    return next
  },

  update(riskId: string, patch: Partial<ProjectRiskRecord>) {
    writeProjectRecords(
      STORAGE_KEY,
      readProjectRecords<ProjectRiskRecord>(STORAGE_KEY).map((item) =>
        item.id === riskId ? { ...item, ...patch, updatedAt: new Date().toISOString() } : item,
      ),
    )
  },
}
