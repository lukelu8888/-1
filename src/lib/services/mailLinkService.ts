import type { MailLinkRecord } from '../../components/admin/mail-workbench/types'

const STORAGE_KEY = 'mailWorkbench.links.v1'

const DEMO_LINKS: MailLinkRecord[] = [
  {
    id: 'link-001',
    threadId: 'mail-thread-001',
    targetType: 'ING',
    targetNumber: 'ING-2026-0148',
    label: '已关联正式询价',
    linkedAt: '2026-03-29T16:50:00.000Z',
  },
  {
    id: 'link-002',
    threadId: 'mail-thread-002',
    targetType: 'PROJECT',
    targetNumber: 'AP-Factory-Line-02',
    label: '已关联项目',
    linkedAt: '2026-03-29T09:25:00.000Z',
  },
]

function loadLinks(): MailLinkRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEMO_LINKS))
      return DEMO_LINKS
    }
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : DEMO_LINKS
  } catch {
    return DEMO_LINKS
  }
}

function persistLinks(items: MailLinkRecord[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

export const mailLinkService = {
  listByThread(threadId: string): MailLinkRecord[] {
    return loadLinks().filter((item) => item.threadId === threadId)
  },

  create(threadId: string, targetType: string, targetNumber: string, label: string) {
    const next: MailLinkRecord = {
      id: `link-${crypto.randomUUID()}`,
      threadId,
      targetType,
      targetNumber,
      label,
      linkedAt: new Date().toISOString(),
    }
    persistLinks([next, ...loadLinks()])
    return next
  },
}
