import { readDocumentTaskRecords, writeDocumentTaskRecords } from './documentTaskStorage'
import type { DocumentTaskRecord, DocumentTaskStatus } from './documentTaskTypes'

const STORAGE_KEY = 'documentTask.records.v1'

function buildTaskNumber() {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  return `DOC-TASK-${today}-${readDocumentTaskRecords<DocumentTaskRecord>(STORAGE_KEY).length + 1}`
}

export const documentTaskService = {
  list(): DocumentTaskRecord[] {
    return readDocumentTaskRecords<DocumentTaskRecord>(STORAGE_KEY)
  },

  listByMailThread(threadId: string): DocumentTaskRecord[] {
    return this.list().filter((item) => item.sourceMailThreadId === threadId)
  },

  create(input: Omit<DocumentTaskRecord, 'id' | 'taskNumber' | 'createdAt' | 'updatedAt'>): DocumentTaskRecord {
    const now = new Date().toISOString()
    const next: DocumentTaskRecord = {
      ...input,
      id: `document-task-${crypto.randomUUID()}`,
      taskNumber: buildTaskNumber(),
      createdAt: now,
      updatedAt: now,
    }
    writeDocumentTaskRecords(STORAGE_KEY, [next, ...this.list()])
    return next
  },

  update(taskId: string, patch: Partial<DocumentTaskRecord>) {
    writeDocumentTaskRecords(
      STORAGE_KEY,
      this.list().map((item) =>
        item.id === taskId
          ? { ...item, ...patch, updatedAt: new Date().toISOString() }
          : item,
      ),
    )
  },

  updateStatus(taskId: string, status: DocumentTaskStatus) {
    this.update(taskId, { status })
  },
}
