import { readProjectRecords, writeProjectRecords } from './projectStorage'
import type { ProjectActionItemRecord } from './projectTypes'

const STORAGE_KEY = 'projectControl.actionItems.v1'

export const projectActionItemService = {
  listByProject(projectId: string, projectRevisionId?: string | null): ProjectActionItemRecord[] {
    return readProjectRecords<ProjectActionItemRecord>(STORAGE_KEY).filter(
      (item) =>
        item.projectId === projectId &&
        (!projectRevisionId || item.projectRevisionId === projectRevisionId),
    )
  },

  create(input: Omit<ProjectActionItemRecord, 'id' | 'createdAt' | 'updatedAt'>): ProjectActionItemRecord {
    const next: ProjectActionItemRecord = {
      ...input,
      id: `project-action-${crypto.randomUUID()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    writeProjectRecords(STORAGE_KEY, [next, ...readProjectRecords<ProjectActionItemRecord>(STORAGE_KEY)])
    return next
  },

  update(actionItemId: string, patch: Partial<ProjectActionItemRecord>) {
    writeProjectRecords(
      STORAGE_KEY,
      readProjectRecords<ProjectActionItemRecord>(STORAGE_KEY).map((item) =>
        item.id === actionItemId ? { ...item, ...patch, updatedAt: new Date().toISOString() } : item,
      ),
    )
  },
}
