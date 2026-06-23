import { readProjectRecords, writeProjectRecords } from './projectStorage'
import type { ProjectSatRecord } from './projectTypes'

const STORAGE_KEY = 'projectControl.sat.v1'

export const projectSatService = {
  listByProject(projectId: string, projectRevisionId?: string | null): ProjectSatRecord[] {
    return readProjectRecords<ProjectSatRecord>(STORAGE_KEY).filter(
      (item) =>
        item.projectId === projectId &&
        (!projectRevisionId || item.projectRevisionId === projectRevisionId),
    )
  },

  create(input: Omit<ProjectSatRecord, 'id' | 'createdAt' | 'updatedAt'>): ProjectSatRecord {
    const next: ProjectSatRecord = {
      ...input,
      id: `project-sat-${crypto.randomUUID()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    writeProjectRecords(STORAGE_KEY, [next, ...readProjectRecords<ProjectSatRecord>(STORAGE_KEY)])
    return next
  },

  update(recordId: string, patch: Partial<ProjectSatRecord>) {
    writeProjectRecords(
      STORAGE_KEY,
      readProjectRecords<ProjectSatRecord>(STORAGE_KEY).map((item) =>
        item.id === recordId ? { ...item, ...patch, updatedAt: new Date().toISOString() } : item,
      ),
    )
  },
}
