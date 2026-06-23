import { mailDispatchService } from '../mailDispatchService'
import { mailThreadService } from '../mailThreadService'
import { exportServiceOrderService } from './exportServiceOrderService'

function deriveMailThreadStatus(serviceStatus: string) {
  if (serviceStatus === 'settlement_closed') return 'resolved' as const
  if (serviceStatus === 'cancelled') return 'closed' as const
  return 'linked' as const
}

function deriveDispatchStatus(serviceStatus: string) {
  if (serviceStatus === 'settlement_closed') return 'resolved' as const
  if (serviceStatus === 'cancelled') return 'closed' as const
  return null
}

export function syncMailThreadFromExportService(serviceOrderId: string) {
  const order = exportServiceOrderService.list().find((item) => item.id === serviceOrderId)
  if (!order?.sourceMailThreadId) return null

  const threadStatus = deriveMailThreadStatus(order.serviceStatus)
  mailThreadService.updateThread(order.sourceMailThreadId, {
    status: threadStatus,
    linkedOrderNumber: order.serviceOrderNumber,
    linkedCustomerName: order.customerName,
  })

  const nextDispatchStatus = deriveDispatchStatus(order.serviceStatus)
  if (nextDispatchStatus) {
    mailDispatchService.updateStatusesByThread(
      order.sourceMailThreadId,
      ['pending_department_pickup', 'accepted', 'reassigned'],
      nextDispatchStatus,
    )
  }

  return mailThreadService.getById(order.sourceMailThreadId)
}
