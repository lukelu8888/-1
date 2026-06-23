import type { MailCandidateRecord, MailLinkRecord } from '../../components/admin/mail-workbench/types'
import { exportExecutionBridgeService } from './exportExecutionBridgeService'
import { exportServiceOrderService } from './exportServiceOrderService'

export interface ExportServiceMailBridgeView {
  id: string
  serviceOrderNumber: string
  customerName: string
  serviceStatus: string
  sourceMailThreadId?: string | null
  shipmentReference?: string | null
  docsReference?: string | null
  paymentReference?: string | null
  payableReference?: string | null
  bridgeSummary?: string | null
}

function toView(serviceOrderId: string): ExportServiceMailBridgeView | null {
  const order = exportServiceOrderService.list().find((item) => item.id === serviceOrderId)
  if (!order) return null

  const executionBridge = exportExecutionBridgeService.getByServiceOrder(order.id)
  return {
    id: order.id,
    serviceOrderNumber: order.serviceOrderNumber,
    customerName: order.customerName,
    serviceStatus: order.serviceStatus,
    sourceMailThreadId: order.sourceMailThreadId,
    shipmentReference: executionBridge?.shipmentReference,
    docsReference: executionBridge?.docsReference,
    paymentReference: executionBridge?.paymentReference,
    payableReference: executionBridge?.payableReference,
    bridgeSummary: executionBridge?.notes || null,
  }
}

export const exportServiceMailBridgeLookup = {
  getByThreadId(threadId: string): ExportServiceMailBridgeView | null {
    const order = exportServiceOrderService.list().find((item) => item.sourceMailThreadId === threadId)
    return order ? toView(order.id) : null
  },

  getByCandidate(candidate: MailCandidateRecord): ExportServiceMailBridgeView | null {
    if (candidate.candidateType !== 'export_service_order' || !candidate.confirmedTargetObjectId) {
      return null
    }

    return toView(candidate.confirmedTargetObjectId)
  },

  getByLinks(links: MailLinkRecord[]): ExportServiceMailBridgeView | null {
    const exportLink = links.find((item) => item.targetType === 'export_service_order')
    if (!exportLink) return null

    const order = exportServiceOrderService.list().find((item) => item.serviceOrderNumber === exportLink.targetNumber)
    return order ? toView(order.id) : null
  },
}
