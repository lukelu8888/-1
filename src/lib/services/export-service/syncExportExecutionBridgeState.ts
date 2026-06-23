import { exportDocumentationBridgeService } from './exportDocumentationBridgeService'
import { exportExecutionBridgeService } from './exportExecutionBridgeService'
import { exportPayableBridgeService } from './exportPayableBridgeService'
import { exportPaymentRecordBridgeService } from './exportPaymentRecordBridgeService'
import { exportShipmentBridgeService } from './exportShipmentBridgeService'
import { syncMailThreadFromExportService } from './syncMailThreadFromExportService'
import { syncExportServiceOrderStatus } from './syncExportServiceOrderStatus'

function buildSummary(serviceOrderId: string): string {
  const shipment = exportShipmentBridgeService.list().find((item) => item.serviceOrderId === serviceOrderId)
  const docs = exportDocumentationBridgeService.list().find((item) => item.serviceOrderId === serviceOrderId)
  const payable = exportPayableBridgeService.list().find((item) => item.serviceOrderId === serviceOrderId)
  const payment = exportPaymentRecordBridgeService.list().find((item) => item.serviceOrderId === serviceOrderId)

  return [
    shipment ? `Shipment=${shipment.tracking.currentStatus}` : null,
    docs ? `Docs=${docs.status}/${docs.completedDocs}/${docs.requiredDocs}` : null,
    payable ? `Payable=${payable.status}` : null,
    payment ? `Payment=${payment.status}` : null,
  ]
    .filter(Boolean)
    .join(' | ')
}

export function syncExportExecutionBridgeState(serviceOrderId: string) {
  const executionBridge = exportExecutionBridgeService.getByServiceOrder(serviceOrderId)
  if (!executionBridge) return null

  const shipment = exportShipmentBridgeService.list().find((item) => item.serviceOrderId === serviceOrderId)
  const docs = exportDocumentationBridgeService.list().find((item) => item.serviceOrderId === serviceOrderId)
  const payable = exportPayableBridgeService.list().find((item) => item.serviceOrderId === serviceOrderId)
  const payment = exportPaymentRecordBridgeService.list().find((item) => item.serviceOrderId === serviceOrderId)

  exportExecutionBridgeService.update(executionBridge.id, {
    shipmentBridgeStatus: shipment ? 'linked' : executionBridge.shipmentBridgeStatus,
    shipmentReference: shipment?.contractNumber || executionBridge.shipmentReference,
    docsBridgeStatus: docs ? 'linked' : executionBridge.docsBridgeStatus,
    docsReference: docs?.orderId || executionBridge.docsReference,
    payableBridgeStatus: payable ? 'linked' : executionBridge.payableBridgeStatus,
    payableReference: payable?.payableNo || executionBridge.payableReference,
    paymentBridgeStatus: payment ? 'linked' : executionBridge.paymentBridgeStatus,
    paymentReference: payment?.paymentNo || executionBridge.paymentReference,
    notes: buildSummary(serviceOrderId),
  })

  syncExportServiceOrderStatus(serviceOrderId)
  syncMailThreadFromExportService(serviceOrderId)
  return exportExecutionBridgeService.getByServiceOrder(serviceOrderId)
}
