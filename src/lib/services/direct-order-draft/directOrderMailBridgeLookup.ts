import type { MailCandidateRecord, MailLinkRecord } from '../../components/admin/mail-workbench/types'
import { directOrderDraftService } from './directOrderDraftService'

export interface DirectOrderMailBridgeView {
  id: string
  draftNumber: string
  customerName: string
  draftStatus: string
  linkedOrderNumber?: string | null
  linkedOrderStatus?: string | null
  executionStage?: string | null
  bridgeSummary?: string | null
  sourceMailThreadId?: string | null
}

function toView(draftId: string): DirectOrderMailBridgeView | null {
  const draft = directOrderDraftService.getById(draftId)
  if (!draft) return null

  return {
    id: draft.id,
    draftNumber: draft.draftNumber,
    customerName: draft.customerName || 'Direct Order Customer',
    draftStatus: draft.status,
    linkedOrderNumber: draft.linkedOrderNumber || null,
    linkedOrderStatus: draft.linkedOrderStatus || null,
    executionStage: draft.executionStage || null,
    bridgeSummary: draft.bridgeSummary || draft.draftSummary || null,
    sourceMailThreadId: draft.sourceMailThreadId,
  }
}

export const directOrderMailBridgeLookup = {
  getByThreadId(threadId: string): DirectOrderMailBridgeView | null {
    const draft = directOrderDraftService.list().find((item) => item.sourceMailThreadId === threadId)
    return draft ? toView(draft.id) : null
  },

  getByCandidate(candidate: MailCandidateRecord): DirectOrderMailBridgeView | null {
    if (candidate.candidateType !== 'repeat_direct_order' || !candidate.confirmedTargetObjectId) {
      return null
    }
    return toView(candidate.confirmedTargetObjectId)
  },

  getByLinks(links: MailLinkRecord[]): DirectOrderMailBridgeView | null {
    const directLink = links.find((item) => item.targetType === 'direct_order_draft')
    if (!directLink) return null
    const draft = directOrderDraftService.list().find((item) => item.draftNumber === directLink.targetNumber)
    return draft ? toView(draft.id) : null
  },
}
