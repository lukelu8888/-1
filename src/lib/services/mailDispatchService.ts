import type { MailDispatchRecord, MailDispatchStatus } from '../../components/admin/mail-workbench/types'

const STORAGE_KEY = 'mailWorkbench.dispatches.v1'

const DEMO_DISPATCHES: MailDispatchRecord[] = [
  {
    id: 'dispatch-001',
    threadId: 'mail-thread-001',
    dispatchType: 'to_department',
    assignedRole: 'Sales_Rep',
    assignedDepartment: 'Sales',
    status: 'pending_department_pickup',
    priority: 'high',
    dueAt: '2026-03-30T10:00:00.000Z',
    createdAt: '2026-03-29T16:35:00.000Z',
    createdBy: 'system',
  },
  {
    id: 'dispatch-002',
    threadId: 'mail-thread-002',
    dispatchType: 'to_user',
    assignedRole: 'Sales_Director',
    assignedDepartment: 'Project',
    assignedUserName: 'Project Owner',
    status: 'accepted',
    priority: 'normal',
    createdAt: '2026-03-29T09:30:00.000Z',
    createdBy: 'Regional_Manager',
  },
]

function loadDispatches(): MailDispatchRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEMO_DISPATCHES))
      return DEMO_DISPATCHES
    }
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : DEMO_DISPATCHES
  } catch {
    return DEMO_DISPATCHES
  }
}

function persistDispatches(items: MailDispatchRecord[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

export const mailDispatchService = {
  listByThread(threadId: string): MailDispatchRecord[] {
    return loadDispatches().filter((item) => item.threadId === threadId)
  },

  create(threadId: string, input: Pick<MailDispatchRecord, 'dispatchType' | 'assignedRole' | 'assignedDepartment' | 'priority'>) {
    const items = loadDispatches()
    const next: MailDispatchRecord = {
      id: `dispatch-${crypto.randomUUID()}`,
      threadId,
      dispatchType: input.dispatchType,
      assignedRole: input.assignedRole,
      assignedDepartment: input.assignedDepartment,
      status: 'pending_department_pickup',
      priority: input.priority,
      createdAt: new Date().toISOString(),
      createdBy: 'mail-workbench',
    }
    persistDispatches([next, ...items])
    return next
  },

  updateStatus(dispatchId: string, status: MailDispatchStatus) {
    persistDispatches(loadDispatches().map((item) => (item.id === dispatchId ? { ...item, status } : item)))
  },

  updateStatusesByThread(threadId: string, fromStatuses: MailDispatchStatus[], toStatus: MailDispatchStatus) {
    persistDispatches(
      loadDispatches().map((item) =>
        item.threadId === threadId && fromStatuses.includes(item.status) ? { ...item, status: toStatus } : item,
      ),
    )
  },
}
