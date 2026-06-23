import { exportDocumentationBridgeService } from './exportDocumentationBridgeService'
import { exportHeaderDocumentService } from './exportHeaderDocumentService'
import { exportPayableBridgeService } from './exportPayableBridgeService'
import { exportPaymentRecordBridgeService } from './exportPaymentRecordBridgeService'
import { exportServiceOrderService } from './exportServiceOrderService'
import { exportShipmentBridgeService } from './exportShipmentBridgeService'
import type { ExportServiceOrderStatus } from './exportServiceTypes'

function deriveExportServiceOrderStatus(serviceOrderId: string): ExportServiceOrderStatus | null {
  const order = exportServiceOrderService.list().find((item) => item.id === serviceOrderId)
  if (!order) return null
  if (order.serviceStatus === 'cancelled') return 'cancelled'

  const headerDocuments = exportHeaderDocumentService.listByServiceOrder(serviceOrderId)
  const docs = exportDocumentationBridgeService.list().find((item) => item.serviceOrderId === serviceOrderId)
  const shipment = exportShipmentBridgeService.list().find((item) => item.serviceOrderId === serviceOrderId)
  const payable = exportPayableBridgeService.list().find((item) => item.serviceOrderId === serviceOrderId)
  const payment = exportPaymentRecordBridgeService.list().find((item) => item.serviceOrderId === serviceOrderId)

  const docsCompleted = docs?.status === 'completed' || (docs?.completedDocs || 0) >= (docs?.requiredDocs || Number.MAX_SAFE_INTEGER)
  const financeClosed = payable?.status === 'paid' && payment?.status === 'completed'
  const shipmentDelivered = shipment?.tracking.currentStatus === 'delivered'
  const shipmentStarted =
    shipment &&
    ['shipped', 'in_transit', 'arrived', 'cleared', 'delivered'].includes(shipment.tracking.currentStatus)
  const hasPendingCustomerConfirmation = headerDocuments.some(
    (item) => item.status === 'draft' || item.status === 'sent_for_confirmation',
  )
  const docsInProgress = !!docs && (docs.completedDocs > 0 || docs.status === 'reviewing' || docs.status === 'processing')
  const bookingPending = !!shipment && order.bookingRequired && shipment.tracking.currentStatus === 'preparing'
  const freightQuoting = !!payable && payable.payeeName.includes('待指定')

  if (docsCompleted && financeClosed && shipmentDelivered) {
    return 'settlement_closed'
  }

  if (shipmentStarted || financeClosed || (docs?.completedDocs || 0) >= 6) {
    return 'execution_in_progress'
  }

  if (bookingPending) {
    return 'booking_pending'
  }

  if (docsInProgress) {
    return 'documents_pending'
  }

  if (hasPendingCustomerConfirmation) {
    return 'customer_confirmation_pending'
  }

  if (freightQuoting) {
    return 'freight_quoting'
  }

  return 'draft'
}

export function syncExportServiceOrderStatus(serviceOrderId: string) {
  const order = exportServiceOrderService.list().find((item) => item.id === serviceOrderId)
  if (!order) return null

  const nextStatus = deriveExportServiceOrderStatus(serviceOrderId)
  if (!nextStatus) return order

  if (order.serviceStatus !== nextStatus) {
    exportServiceOrderService.update(serviceOrderId, {
      serviceStatus: nextStatus,
    })
  }

  return exportServiceOrderService.list().find((item) => item.id === serviceOrderId) || null
}
