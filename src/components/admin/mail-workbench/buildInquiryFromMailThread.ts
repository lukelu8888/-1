import { adaptInquiryToDocumentData } from '../../../utils/documentDataAdapters'
import { getCurrentUser } from '../../../utils/dataIsolation'
import type { Inquiry, InquiryProductLine } from '../../../contexts/InquiryContext'
import type { UserInfo, AuthUser } from '../../../contexts/UserContext'
import type { MailCandidateRecord, MailThreadDetail } from './types'

function buildPlaceholderProduct(thread: MailThreadDetail): InquiryProductLine {
  return {
    id: `mail-product-${thread.id}`,
    productName: thread.subject.trim() || 'Email Inquiry Item',
    quantity: 1,
    unit: 'lot',
    price: 0,
    specifications: thread.snippet || 'Created from ERP mail workbench',
    image: '/placeholder.jpg',
    source: 'manual',
    addedFrom: 'mail-workbench',
    sourceType: 'mail_thread',
  }
}

function resolveBuyerInfo(thread: MailThreadDetail, authUser: AuthUser | null, userInfo: UserInfo | null) {
  const currentUser = getCurrentUser() as any

  return {
    companyName: thread.linkedCustomerName || userInfo?.companyName || currentUser?.company || 'TBD Customer',
    contactPerson: thread.latestSenderName || userInfo?.contactPerson || authUser?.name || 'TBD Contact',
    email: thread.latestSenderEmail || authUser?.email || userInfo?.email || 'unknown@customer.com',
    phone: userInfo?.phone || 'N/A',
    address: userInfo?.address || 'N/A',
    website: userInfo?.website || '',
    businessType: userInfo?.businessType || '',
  }
}

export async function buildInquiryFromMailThread(args: {
  thread: MailThreadDetail
  candidate: MailCandidateRecord
  authUser: AuthUser | null
  userInfo: UserInfo | null
  generateInquiryNumber: (region: string, customerId?: string) => Promise<string>
}): Promise<Inquiry> {
  const { thread, candidate, authUser, userInfo, generateInquiryNumber } = args
  const currentUser = getCurrentUser() as any
  const regionCode = String(authUser?.region || currentUser?.region || 'NA').trim().toUpperCase() || 'NA'
  const inquiryNumber = await generateInquiryNumber(regionCode, authUser?.id)
  const product = buildPlaceholderProduct(thread)
  const totalPrice = Number(product.price || 0) * Number(product.quantity || 0)
  const now = Date.now()

  const inquiry: Inquiry = {
    id: crypto.randomUUID(),
    inquiryNumber,
    date: new Date().toISOString().split('T')[0],
    userEmail: authUser?.email || currentUser?.email || 'mail-workbench@innoshop.local',
    region: regionCode as Inquiry['region'],
    products: [product],
    totalPrice,
    status: 'pending',
    isSubmitted: false,
    buyerInfo: resolveBuyerInfo(thread, authUser, userInfo),
    shippingInfo: {
      cartons: '0',
      cbm: '0',
      totalGrossWeight: '0',
      totalNetWeight: '0',
    },
    message: [candidate.candidateSummary, thread.snippet].filter(Boolean).join('\n\n'),
    createdAt: now,
  }

  ;(inquiry as any).templateSnapshot = { pendingResolution: true, source: 'mail-workbench' }
  ;(inquiry as any).documentRenderMeta = null
  ;(inquiry as any).documentDataSnapshot = adaptInquiryToDocumentData(inquiry as any)

  return inquiry
}
