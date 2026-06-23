export type DocumentTaskStatus = 'open' | 'in_progress' | 'reviewing' | 'done' | 'cancelled'

export interface DocumentTaskRecord {
  id: string
  taskNumber: string
  sourceMailThreadId?: string | null
  projectCode?: string | null
  orderId?: string | null
  contractNo?: string | null
  docCode?: string | null
  taskTitle: string
  taskSummary: string
  ownerDepartment: string
  ownerRole: string
  priority: 'normal' | 'high' | 'critical'
  dueAt?: string | null
  status: DocumentTaskStatus
  createdAt: string
  updatedAt: string
}
