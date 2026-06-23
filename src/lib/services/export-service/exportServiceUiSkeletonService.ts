import { exportServicePortalSummaryService } from './exportServicePortalSummaryService'
import type {
  ExportExecutionBridgeRecord,
  ExportFreightSettlementRecord,
  ExportHeaderDocumentRecord,
  ExportServiceFeeRecord,
  ExportServiceOrderRecord,
} from './exportServiceTypes'

export interface ExportServiceCustomerUiSkeleton {
  overallStatus: 'pending' | 'in_progress' | 'done'
  overallLabel: string
  overallSummary: string
  customerActionLabel: string
  customerActionSummary: string
  nodes: Array<{
    key: 'documents' | 'booking' | 'execution' | 'settlement'
    label: string
    status: 'pending' | 'in_progress' | 'done'
    summary: string
  }>
}

export interface ExportServiceInternalUiSkeleton {
  blockerLabel: string
  blockerSummary: string
  blockerReferenceLabel: string
  blockerReferenceSummary: string
  blockerActionLabel: string
  blockerActionSummary: string
  blockerOwnerLabel: string
  blockerOwnerSummary: string
  internalNextActionLabel: string
  internalNextActionSummary: string
}

export interface ExportServiceUiSkeleton {
  customer: ExportServiceCustomerUiSkeleton
  internal: ExportServiceInternalUiSkeleton
}

function toCustomerOverallLabel(status: ExportServiceCustomerUiSkeleton['overallStatus']) {
  if (status === 'done') return 'Completed'
  if (status === 'in_progress') return 'In Progress'
  return 'Preparing'
}

function buildOverallSummary(order: ExportServiceOrderRecord, status: ExportServiceCustomerUiSkeleton['overallStatus']) {
  if (status === 'done') {
    return `Service order ${order.serviceOrderNumber} has been completed.`
  }

  if (status === 'in_progress') {
    return `Service order ${order.serviceOrderNumber} is moving through document confirmation, shipment coordination, execution, and settlement.`
  }

  return `Service order ${order.serviceOrderNumber} is being prepared before the full export service flow begins.`
}

function toCustomerAction(input: {
  portalActionLabel: string
  order: ExportServiceOrderRecord
}) {
  const { portalActionLabel, order } = input

  if (portalActionLabel.includes('确认抬头文件')) {
    return {
      label: 'Please review and confirm your header document',
      summary: 'We are waiting for your confirmation of the export header information before moving forward.',
    }
  }

  if (portalActionLabel.includes('确认订舱资料')) {
    return {
      label: 'Please confirm shipment details',
      summary: 'We are waiting for your confirmation on shipment information, schedule, or supporting details.',
    }
  }

  if (portalActionLabel.includes('配合结算')) {
    return {
      label: 'Please complete the remaining settlement step',
      summary: 'We are finalizing service-related charges and may need your confirmation or payment support.',
    }
  }

  return order.bookingRequired
    ? {
        label: 'No immediate customer action is required',
        summary: 'Your service order is progressing internally. We will reach out if shipment or document support is needed.',
      }
    : {
        label: 'No immediate customer action is required',
        summary: 'Your service order is progressing internally. We will contact you if further confirmation is needed.',
      }
}

function toCustomerNode(input: ExportServiceCustomerUiSkeleton['nodes'][number]) {
  const labelMap: Record<ExportServiceCustomerUiSkeleton['nodes'][number]['key'], string> = {
    documents: 'Document Confirmation',
    booking: 'Shipment Arrangement',
    execution: 'Execution Progress',
    settlement: 'Settlement Closure',
  }

  const summaryMap: Record<ExportServiceCustomerUiSkeleton['nodes'][number]['key'], Record<string, string>> = {
    documents: {
      done: 'Your export header document has been confirmed.',
      in_progress: 'Your export header document has been sent for review.',
      pending: 'Your export header document is being prepared.',
    },
    booking: {
      done: 'Shipment arrangement has been linked into the execution flow.',
      in_progress: 'Shipment preparation is underway and awaiting final confirmation.',
      pending: 'Shipment preparation has not started yet.',
    },
    execution: {
      done: 'Execution work has been connected across document and finance steps.',
      in_progress: 'Execution work is ongoing across the downstream service flow.',
      pending: 'Execution work has not started yet.',
    },
    settlement: {
      done: 'Service-related settlement has been closed.',
      in_progress: 'Settlement work is in progress.',
      pending: 'Settlement work will begin after execution is ready.',
    },
  }

  return {
    key: input.key,
    label: labelMap[input.key],
    status: input.status,
    summary: summaryMap[input.key][input.status],
  }
}

export const exportServiceUiSkeletonService = {
  build(input: {
    order: ExportServiceOrderRecord
    documents: ExportHeaderDocumentRecord[]
    fees: ExportServiceFeeRecord[]
    freightSettlements: ExportFreightSettlementRecord[]
    executionBridge: ExportExecutionBridgeRecord | null
  }): ExportServiceUiSkeleton {
    const portalSummary = exportServicePortalSummaryService.getSummary(input)

    return {
      customer: {
        overallStatus: portalSummary.overallStatus,
        overallLabel: toCustomerOverallLabel(portalSummary.overallStatus),
        overallSummary: buildOverallSummary(input.order, portalSummary.overallStatus),
        customerActionLabel: toCustomerAction({
          portalActionLabel: portalSummary.customerActionLabel,
          order: input.order,
        }).label,
        customerActionSummary: toCustomerAction({
          portalActionLabel: portalSummary.customerActionLabel,
          order: input.order,
        }).summary,
        nodes: portalSummary.nodes.map(toCustomerNode),
      },
      internal: {
        blockerLabel: portalSummary.blockerLabel,
        blockerSummary: portalSummary.blockerSummary,
        blockerReferenceLabel: portalSummary.blockerReferenceLabel,
        blockerReferenceSummary: portalSummary.blockerReferenceSummary,
        blockerActionLabel: portalSummary.blockerActionLabel,
        blockerActionSummary: portalSummary.blockerActionSummary,
        blockerOwnerLabel: portalSummary.blockerOwnerLabel,
        blockerOwnerSummary: portalSummary.blockerOwnerSummary,
        internalNextActionLabel: portalSummary.internalNextActionLabel,
        internalNextActionSummary: portalSummary.internalNextActionSummary,
      },
    }
  },
}
