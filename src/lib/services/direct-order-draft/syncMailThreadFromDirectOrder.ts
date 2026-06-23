import type { Order } from '../../../contexts/OrderContext'
import { mailDispatchService } from '../mailDispatchService'
import { mailThreadService } from '../mailThreadService'
import { directOrderDraftService } from './directOrderDraftService'

function deriveMailThreadStatus(orderStatus: string) {
  if (orderStatus === 'Delivered') return 'resolved' as const
  if (orderStatus === 'cancelled') return 'closed' as const
  return 'linked' as const
}

function deriveDispatchStatus(orderStatus: string) {
  if (orderStatus === 'Delivered') return 'resolved' as const
  if (orderStatus === 'cancelled') return 'closed' as const
  return null
}

export function syncMailThreadFromDirectOrder(order: Order) {
  const draft = directOrderDraftService.getById(order.id)
  if (!draft?.sourceMailThreadId) return null

  const threadStatus = deriveMailThreadStatus(order.status)
  mailThreadService.updateThread(draft.sourceMailThreadId, {
    status: threadStatus,
    linkedOrderNumber: order.orderNumber,
    linkedCustomerName: draft.customerName || undefined,
  })

  const nextDispatchStatus = deriveDispatchStatus(order.status)
  if (nextDispatchStatus) {
    mailDispatchService.updateStatusesByThread(
      draft.sourceMailThreadId,
      ['pending_department_pickup', 'accepted', 'reassigned'],
      nextDispatchStatus,
    )
  }

  return mailThreadService.getById(draft.sourceMailThreadId)
}
