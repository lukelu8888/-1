import type { Order } from '../../../contexts/OrderContext'
import { directOrderDraftService } from './directOrderDraftService'
import { buildDirectOrderExecutionSummary } from './directOrderExecutionSummary'

export function syncDirectOrderDraftFromOrder(order: Order) {
  const draft = directOrderDraftService.getById(order.id)
  if (!draft) return null
  const execution = buildDirectOrderExecutionSummary(order)

  directOrderDraftService.update(draft.id, {
    linkedOrderNumber: order.orderNumber,
    linkedOrderStatus: order.status,
    executionStage: execution.stage,
    submittedAt: order.updatedAt || new Date().toISOString(),
    bridgeSummary: execution.summary,
  })

  return directOrderDraftService.getById(draft.id)
}
