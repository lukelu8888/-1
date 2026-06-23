import { createExportServiceOrderBundle } from '../../../lib/services/export-service/createExportServiceOrderBundle'
import type { MailCandidateRecord, MailThreadDetail } from './types'

function inferTradeTerm(text: string): 'FOB' | 'EXW' | 'FCA' {
  const upperText = text.toUpperCase()
  if (upperText.includes('EXW')) return 'EXW'
  if (upperText.includes('FCA')) return 'FCA'
  return 'FOB'
}

function inferBookingRequired(text: string): boolean {
  const normalized = text.toLowerCase()
  return (
    normalized.includes('booking') ||
    normalized.includes('订舱') ||
    normalized.includes('freight') ||
    normalized.includes('ship')
  )
}

export function buildExportServiceOrderFromMailThread({
  thread,
  candidate,
}: {
  thread: MailThreadDetail
  candidate: MailCandidateRecord
}) {
  const sourceText = [thread.subject, thread.snippet, candidate.candidateSummary].filter(Boolean).join(' ')
  const customerName = thread.linkedCustomerName?.trim() || thread.latestSenderName?.trim() || '邮件客户'

  return createExportServiceOrderBundle({
    customerId: null,
    customerName,
    customerEmail: thread.latestSenderEmail?.trim().toLowerCase() || null,
    sourceMailThreadId: thread.id,
    supplierName: null,
    supplierTradeTerm: inferTradeTerm(sourceText),
    goodsPaymentHandledByUs: false,
    insuranceHandledByCustomer: true,
    bookingRequired: inferBookingRequired(sourceText),
    serviceStatus: 'draft',
    cargoSummary: [thread.subject, thread.snippet, candidate.candidateSummary].filter(Boolean).join(' | '),
    titleHeadingCompany: 'Our Company',
    createdByLabel: 'mail workbench',
  })
}
