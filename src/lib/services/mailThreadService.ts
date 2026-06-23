import type { MailThreadDetail, MailThreadSummary } from '../../components/admin/mail-workbench/types'

const STORAGE_KEY = 'mailWorkbench.threadDetails.v1'

const DEMO_THREADS: MailThreadDetail[] = [
  {
    id: 'mail-thread-001',
    subject: 'RE: Spring reorder list and delivery window',
    latestSenderName: 'Emma Johnson',
    latestSenderEmail: 'emma@northbayretail.com',
    latestMessageAt: '2026-03-29T16:30:00.000Z',
    linkedCustomerName: 'North Bay Retail',
    linkedOrderNumber: 'ING-2026-0148',
    status: 'triaging',
    ownerLabel: '销售待处理箱',
    attachmentCount: 2,
    unreadCount: 1,
    snippet: 'Please quote the attached reorder list and confirm whether the April vessel is still available.',
    participants: ['emma@northbayretail.com', 'sales@innoshop.com'],
    attachments: [
      { id: 'att-001', fileName: 'reorder-list.xlsx', fileType: 'xlsx' },
      { id: 'att-002', fileName: 'packing-reference.pdf', fileType: 'pdf' },
    ],
  },
  {
    id: 'mail-thread-002',
    subject: 'Project weekly update and drawing comments',
    latestSenderName: 'Daniel Wong',
    latestSenderEmail: 'daniel@auroraprojects.com',
    latestMessageAt: '2026-03-29T09:10:00.000Z',
    linkedCustomerName: 'Aurora Projects',
    linkedProjectName: 'AP-Factory-Line-02',
    status: 'assigned',
    ownerLabel: '项目负责人',
    attachmentCount: 1,
    unreadCount: 0,
    snippet: 'Attached are the latest drawing comments. We also need a short summary before Friday’s coordination call.',
    participants: ['daniel@auroraprojects.com', 'pm@innoshop.com', 'engineering@innoshop.com'],
    attachments: [{ id: 'att-003', fileName: 'drawing-comments-rev3.pdf', fileType: 'pdf' }],
  },
  {
    id: 'mail-thread-003',
    subject: 'Need proforma on your letterhead and booking support',
    latestSenderName: 'Sophia Lee',
    latestSenderEmail: 'sophia@retailbridge.com',
    latestMessageAt: '2026-03-28T11:40:00.000Z',
    linkedCustomerName: 'Retail Bridge',
    status: 'new',
    ownerLabel: '业务待分发',
    attachmentCount: 1,
    unreadCount: 2,
    snippet: 'Our supplier is FOB Ningbo. Please issue proforma on your letterhead and quote freight options.',
    participants: ['sophia@retailbridge.com', 'sales@innoshop.com'],
    attachments: [{ id: 'att-004', fileName: 'shipment-list.docx', fileType: 'docx' }],
  },
]

function loadThreadDetails(): MailThreadDetail[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEMO_THREADS))
      return DEMO_THREADS
    }
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEMO_THREADS
  } catch {
    return DEMO_THREADS
  }
}

function persistThreadDetails(items: MailThreadDetail[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

export const mailThreadService = {
  list(): MailThreadSummary[] {
    return loadThreadDetails().map(({ snippet, participants, attachments, ...summary }) => summary)
  },

  getById(threadId: string): MailThreadDetail | null {
    return loadThreadDetails().find((item) => item.id === threadId) || null
  },

  updateStatus(threadId: string, status: MailThreadDetail['status']) {
    const next = loadThreadDetails().map((item) => (item.id === threadId ? { ...item, status } : item))
    persistThreadDetails(next)
  },

  updateThread(threadId: string, patch: Partial<MailThreadDetail>) {
    const next = loadThreadDetails().map((item) => (item.id === threadId ? { ...item, ...patch } : item))
    persistThreadDetails(next)
  },
}
