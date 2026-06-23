import type { MailThreadDetail } from './types'

export function buildDraftProductsFromMailThread(thread: MailThreadDetail) {
  return [
    {
      id: `mail-draft-${thread.id}`,
      productName: thread.subject.trim() || 'Repeat Quote Item',
      quantity: 1,
      unit: 'lot',
      price: 0,
      specifications: thread.snippet || 'Created from ERP mail workbench repeat quote candidate',
      image: '/placeholder.jpg',
      source: 'mail-workbench',
      sourceType: 'mail_thread',
      addedFrom: 'mail-workbench',
    },
  ]
}
