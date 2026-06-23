import { readProjectRecords, writeProjectRecords } from './projectStorage'
import type { ProjectFatRecord } from './projectTypes'

const STORAGE_KEY = 'projectControl.fat.v1'

export const projectFatService = {
  listByProject(projectId: string, projectRevisionId?: string | null): ProjectFatRecord[] {
    return readProjectRecords<ProjectFatRecord>(STORAGE_KEY).filter(
      (item) =>
        item.projectId === projectId &&
        (!projectRevisionId || item.projectRevisionId === projectRevisionId),
    )
  },

  create(input: Omit<ProjectFatRecord, 'id' | 'createdAt' | 'updatedAt'>): ProjectFatRecord {
    const next: ProjectFatRecord = {
      ...input,
      id: `project-fat-${crypto.randomUUID()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    writeProjectRecords(STORAGE_KEY, [next, ...readProjectRecords<ProjectFatRecord>(STORAGE_KEY)])
    return next
  },

  update(recordId: string, patch: Partial<ProjectFatRecord>) {
    writeProjectRecords(
      STORAGE_KEY,
      readProjectRecords<ProjectFatRecord>(STORAGE_KEY).map((item) =>
        item.id === recordId ? { ...item, ...patch, updatedAt: new Date().toISOString() } : item,
      ),
    )
  },
}
