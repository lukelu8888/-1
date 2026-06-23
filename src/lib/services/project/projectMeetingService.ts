import { readProjectRecords, writeProjectRecords } from './projectStorage'
import type { ProjectMeetingRecord } from './projectTypes'

const STORAGE_KEY = 'projectControl.meetings.v1'

export const projectMeetingService = {
  listByProject(projectId: string, projectRevisionId?: string | null): ProjectMeetingRecord[] {
    return readProjectRecords<ProjectMeetingRecord>(STORAGE_KEY).filter(
      (item) =>
        item.projectId === projectId &&
        (!projectRevisionId || item.projectRevisionId === projectRevisionId),
    )
  },

  create(input: Omit<ProjectMeetingRecord, 'id' | 'createdAt' | 'updatedAt'>): ProjectMeetingRecord {
    const next: ProjectMeetingRecord = {
      ...input,
      id: `project-meeting-${crypto.randomUUID()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    writeProjectRecords(STORAGE_KEY, [next, ...readProjectRecords<ProjectMeetingRecord>(STORAGE_KEY)])
    return next
  },

  update(meetingId: string, patch: Partial<ProjectMeetingRecord>) {
    writeProjectRecords(
      STORAGE_KEY,
      readProjectRecords<ProjectMeetingRecord>(STORAGE_KEY).map((item) =>
        item.id === meetingId ? { ...item, ...patch, updatedAt: new Date().toISOString() } : item,
      ),
    )
  },
}
