import { customerInquiryDraftService } from '../../supabaseService'
import { directOrderDraftService } from '../direct-order-draft/directOrderDraftService'

export type RepeatEntryOverview = {
  repeatQuoteDraft: {
    id: string
    productCount: number
    updatedAt: string | null
  } | null
  repeatDirectDraft: {
    id: string
    draftNumber: string
    productCount: number
    updatedAt: string
    sourceChannel: string
    executionStage: string | null
    linkedOrderNumber: string | null
  } | null
  repeatDirectDraftCount: number
  historyOrderCount: number
  latestHistoryOrderNumber: string | null
}

function normalizeDate(value: unknown) {
  return typeof value === 'string' ? value : ''
}

function resolveOrderNumber(order: any) {
  return (
    order?.orderNumber ||
    order?.order_number ||
    order?.displayNumber ||
    order?.id ||
    null
  )
}

function pickLatestHistoryOrder(orderHistory: any[]) {
  return [...orderHistory].sort((left, right) => {
    const rightDate = normalizeDate(right?.updatedAt || right?.date || right?.createdAt)
    const leftDate = normalizeDate(left?.updatedAt || left?.date || left?.createdAt)
    return rightDate.localeCompare(leftDate)
  })[0]
}

export const repeatEntryOverviewService = {
  async getByCustomerEmail(customerEmail: string, orderHistory: any[] = []): Promise<RepeatEntryOverview> {
    const normalizedEmail = String(customerEmail || '').trim().toLowerCase()
    const repeatQuoteDraft = normalizedEmail
      ? await customerInquiryDraftService.getByCustomerEmail(normalizedEmail, 'repeat_quote')
      : null

    const repeatDirectDrafts = directOrderDraftService
      .list()
      .filter((draft) => draft.status === 'draft')
      .filter((draft) => {
        if (!normalizedEmail) return true
        if (!draft.customerEmail) return true
        return String(draft.customerEmail).trim().toLowerCase() === normalizedEmail
      })
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))

    const latestHistoryOrder = pickLatestHistoryOrder(orderHistory)
    const latestDirectDraft = repeatDirectDrafts[0] || null

    return {
      repeatQuoteDraft: repeatQuoteDraft
        ? {
            id: repeatQuoteDraft.id,
            productCount: Array.isArray(repeatQuoteDraft.products) ? repeatQuoteDraft.products.length : 0,
            updatedAt: repeatQuoteDraft.updatedAt || null,
          }
        : null,
      repeatDirectDraft: latestDirectDraft
        ? {
            id: latestDirectDraft.id,
            draftNumber: latestDirectDraft.draftNumber,
            productCount: Array.isArray(latestDirectDraft.products) ? latestDirectDraft.products.length : 0,
            updatedAt: latestDirectDraft.updatedAt,
            sourceChannel: latestDirectDraft.sourceChannel,
            executionStage: latestDirectDraft.executionStage || null,
            linkedOrderNumber: latestDirectDraft.linkedOrderNumber || null,
          }
        : null,
      repeatDirectDraftCount: repeatDirectDrafts.length,
      historyOrderCount: orderHistory.length,
      latestHistoryOrderNumber: latestHistoryOrder ? resolveOrderNumber(latestHistoryOrder) : null,
    }
  },
}
