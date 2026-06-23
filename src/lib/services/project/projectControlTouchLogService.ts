import { readProjectRecords, writeProjectRecords } from './projectStorage'
import type { ProjectControlTouchLogRecord } from './projectTypes'

const STORAGE_KEY = 'projectControl.touchLogs.v1'

export const projectControlTouchLogService = {
  listByProject(projectId: string, projectRevisionId?: string | null): ProjectControlTouchLogRecord[] {
    return readProjectRecords<ProjectControlTouchLogRecord>(STORAGE_KEY).filter(
      (item) =>
        item.projectId === projectId &&
        (!projectRevisionId || item.projectRevisionId === projectRevisionId),
    )
  },

  create(input: Omit<ProjectControlTouchLogRecord, 'id'>) {
    const next: ProjectControlTouchLogRecord = {
      ...input,
      id: `project-touch-log-${crypto.randomUUID()}`,
    }
    writeProjectRecords(STORAGE_KEY, [next, ...readProjectRecords<ProjectControlTouchLogRecord>(STORAGE_KEY)].slice(0, 50))
    return next
  },
}
