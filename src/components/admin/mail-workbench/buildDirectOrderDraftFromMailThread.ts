import { directOrderDraftService } from '../../../lib/services/direct-order-draft/directOrderDraftService'
import { buildDraftProductsFromMailThread } from './buildDraftProductsFromMailThread'
import type { MailCandidateRecord, MailThreadDetail } from './types'

function inferCustomerName(thread: MailThreadDetail) {
  return thread.linkedCustomerName || thread.latestSenderName || thread.latestSenderEmail || 'Mail Customer'
}

function inferSourceOrderId(text: string) {
  const matched = text.match(/\bORD-\d{8}-\d{2,5}\b/i)
  return matched?.[0] || null
}

function inferDeliveryDate(text: string) {
  const normalized = text.toLowerCase()
  const now = new Date()
  const dayOffset =
    normalized.includes('urgent') || normalized.includes('加急') || normalized.includes('asap')
      ? 10
      : normalized.includes('repeat') || normalized.includes('翻单')
        ? 21
        : 30
  now.setDate(now.getDate() + dayOffset)
  return now.toISOString().slice(0, 10)
}

export function buildDirectOrderDraftFromMailThread({
  thread,
  candidate,
}: {
  thread: MailThreadDetail
  candidate: MailCandidateRecord
}) {
  const sourceText = [thread.subject, thread.snippet, candidate.candidateSummary].filter(Boolean).join(' | ')

  return directOrderDraftService.create({
    sourceMailThreadId: thread.id,
    sourceOrderId: inferSourceOrderId(sourceText),
    customerEmail: thread.latestSenderEmail?.trim().toLowerCase() || null,
    customerName: inferCustomerName(thread),
    orderDate: new Date().toISOString().slice(0, 10),
    deliveryDate: inferDeliveryDate(sourceText),
    products: buildDraftProductsFromMailThread(thread).map((item, index) => ({
      id: item.id || `mail-repeat-direct-${thread.id}-${index + 1}`,
      itemNumber: item.id || `MAIL-ITEM-${index + 1}`,
      name: item.productName || item.name || thread.subject.trim() || 'Repeat Direct Order Item',
      image: item.image,
      price: Number(item.price || 0),
      qty: Number(item.quantity || item.qty || 1),
      cbm: Number(item.cbm || 0),
      grossWeight: Number(item.grossWeight || 0),
      netWeight: Number(item.netWeight || 0),
      pcsPerCarton: Number(item.pcsPerCarton || 1),
      cartonSize: item.cartonSize,
      moq: Number(item.moq || 1),
      specifications: item.specifications || sourceText,
      source: item.source || 'mail-workbench',
      sourceType: item.sourceType || 'mail_thread',
      addedFrom: item.addedFrom || 'mail-workbench',
    })),
    status: 'draft',
    sourceChannel: 'mail_repeat_direct_order',
    draftSummary: sourceText,
  })
}
