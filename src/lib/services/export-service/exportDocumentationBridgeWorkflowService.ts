import {
  exportDocumentationBridgeService,
  type ExportDocumentationBridgeOrder,
  type ExportDocStatus,
} from './exportDocumentationBridgeService'
import { exportPayableBridgeService } from './exportPayableBridgeService'
import { exportPaymentRecordBridgeService } from './exportPaymentRecordBridgeService'
import { exportShipmentBridgeService } from './exportShipmentBridgeService'

type WorkflowStep = {
  docId: 'D05' | 'D11' | 'D12' | 'D13' | 'D01'
  label: string
  terminalStatuses: ExportDocStatus[]
  targetStatus: ExportDocStatus
  message: string
}

const WORKFLOW_STEPS: WorkflowStep[] = [
  {
    docId: 'D05',
    label: '回填报关单证',
    terminalStatuses: ['approved'],
    targetStatus: 'approved',
    message: '报关单证已由单证工作面回填',
  },
  {
    docId: 'D11',
    label: '回填收汇水单',
    terminalStatuses: ['approved'],
    targetStatus: 'approved',
    message: '收汇水单已由单证工作面回填',
  },
  {
    docId: 'D12',
    label: '回填结汇水单',
    terminalStatuses: ['approved'],
    targetStatus: 'approved',
    message: '结汇水单已由单证工作面回填',
  },
  {
    docId: 'D13',
    label: '生成退税收汇凭证',
    terminalStatuses: ['approved', 'auto_generated'],
    targetStatus: 'auto_generated',
    message: '退税收汇凭证已由单证工作面生成',
  },
  {
    docId: 'D01',
    label: '收口退税申报表',
    terminalStatuses: ['approved', 'auto_generated'],
    targetStatus: 'auto_generated',
    message: '退税申报表已完成收口',
  },
]

function isStepPending(record: ExportDocumentationBridgeOrder, step: WorkflowStep) {
  const currentStatus = record.documents[step.docId]?.status
  return !currentStatus || !step.terminalStatuses.includes(currentStatus)
}

function getNextStep(record: ExportDocumentationBridgeOrder): WorkflowStep | null {
  return WORKFLOW_STEPS.find((step) => isStepPending(record, step)) || null
}

function buildDocFileName(record: ExportDocumentationBridgeOrder, docId: string) {
  return `${record.contractNo}-${docId}.pdf`
}

function countCompletedDocs(record: ExportDocumentationBridgeOrder) {
  const completedStatuses: ExportDocStatus[] = ['approved', 'auto_generated', 'uploaded', 'reviewing']
  return Object.values(record.documents).filter((doc) => completedStatuses.includes(doc.status)).length
}

function buildNextAlerts(record: ExportDocumentationBridgeOrder, currentDocId: string) {
  const baseAlerts = record.alerts.filter((alert) => alert.docId !== currentDocId)
  const nextStep = getNextStep({
    ...record,
    alerts: baseAlerts,
  })

  if (!nextStep) {
    return baseAlerts
  }

  const nextAlertExists = baseAlerts.some((alert) => alert.docId === nextStep.docId)
  if (nextAlertExists) {
    return baseAlerts
  }

  return [
    ...baseAlerts,
    {
      alertType: 'missing' as const,
      docId: nextStep.docId,
      message: `${nextStep.docId} 待由单证工作面继续推进`,
      severity: nextStep.docId === 'D01' ? 'critical' as const : 'high' as const,
    },
  ]
}

function upsertDocStatus(
  record: ExportDocumentationBridgeOrder,
  docId: string,
  targetStatus: ExportDocStatus,
  operator: string,
  message: string,
) {
  const now = new Date()
  const today = now.toISOString().slice(0, 10)
  const timestamp = now.toISOString()
  const existingDoc = record.documents[docId]
  const terminalLocked =
    existingDoc &&
    ((existingDoc.status === 'approved' && targetStatus === 'approved') ||
      (existingDoc.status === 'auto_generated' && targetStatus === 'auto_generated'))

  if (terminalLocked) {
    return record
  }

  const nextDocuments = {
    ...record.documents,
    [docId]: {
      docId,
      status: targetStatus,
      uploadDate: today,
      uploadBy: operator,
      reviewer: operator,
      reviewDate: today,
      approveDate: today,
      version: Math.max(existingDoc?.version || 0, 0) + 1,
      files: existingDoc?.files?.length
        ? existingDoc.files
        : [
            {
              fileId: `${record.serviceOrderId}-${docId}`,
              fileName: buildDocFileName(record, docId),
              fileSize: 'bridge-generated',
              fileType: 'pdf',
              uploadDate: today,
            },
          ],
      urgency: existingDoc?.urgency,
      remarks: message,
      history: [
        ...(existingDoc?.history || []),
        {
          action: message,
          operator,
          timestamp,
        },
      ],
    },
  }

  const nextRecord = {
    ...record,
    documents: nextDocuments,
    completedDocs: Math.max(record.completedDocs, countCompletedDocs({ ...record, documents: nextDocuments })),
    lastUpdate: timestamp.slice(0, 16).replace('T', ' '),
  }

  return {
    ...nextRecord,
    missingDocs: Math.max(nextRecord.requiredDocs - nextRecord.completedDocs, 0),
    completionRate:
      nextRecord.completedDocs >= nextRecord.requiredDocs
        ? 100
        : Math.min(99, Math.round((nextRecord.completedDocs / nextRecord.requiredDocs) * 100)),
  }
}

function finalizeFinanceMilestones(record: ExportDocumentationBridgeOrder, operator: string) {
  const payment = exportPaymentRecordBridgeService.list().find((item) => item.serviceOrderId === record.serviceOrderId)
  const payable = exportPayableBridgeService.list().find((item) => item.serviceOrderId === record.serviceOrderId)

  let nextRecord = record

  if (payment?.status === 'completed') {
    nextRecord = upsertDocStatus(nextRecord, 'D11', 'approved', operator, '付款工作面已确认，自动对齐 D11')
  }

  if (payable?.status === 'paid') {
    nextRecord = upsertDocStatus(nextRecord, 'D12', 'approved', operator, '应付工作面已结清，自动对齐 D12')
    nextRecord = upsertDocStatus(nextRecord, 'D13', 'auto_generated', operator, '财务桥接已收口，自动生成 D13')
  }

  return nextRecord
}

function finalizeShipmentMilestones(record: ExportDocumentationBridgeOrder, operator: string) {
  const shipment = exportShipmentBridgeService.list().find((item) => item.serviceOrderId === record.serviceOrderId)
  if (!shipment) return record

  if (['shipped', 'in_transit', 'arrived', 'cleared', 'delivered'].includes(shipment.tracking.currentStatus)) {
    return upsertDocStatus(record, 'D05', 'approved', operator, '发货工作面已推进，自动对齐 D05')
  }

  return record
}

function normalizeBridgeRecord(record: ExportDocumentationBridgeOrder) {
  const missingDocs = Math.max(record.requiredDocs - record.completedDocs, 0)
  const completionRate =
    record.completedDocs >= record.requiredDocs
      ? 100
      : Math.min(99, Math.round((record.completedDocs / record.requiredDocs) * 100))

  const allCoreDone = ['D05', 'D11', 'D12', 'D13', 'D01'].every((docId) => {
    const status = record.documents[docId]?.status
    return status === 'approved' || status === 'auto_generated'
  })

  return {
    ...record,
    missingDocs,
    completionRate,
    status: allCoreDone ? 'completed' : record.completedDocs >= 6 ? 'reviewing' : 'processing',
    alerts: allCoreDone ? [] : record.alerts,
    daysRemaining: allCoreDone ? 0 : record.daysRemaining,
  }
}

export function getNextExportDocumentationBridgeActionLabel(record: ExportDocumentationBridgeOrder) {
  return getNextStep(record)?.label || null
}

export function advanceExportDocumentationBridge(recordId: string, operator = 'DocumentationWorkbenchUltimate') {
  const record = exportDocumentationBridgeService.list().find((item) => item.id === recordId)
  if (!record) return null

  const step = getNextStep(record)
  if (!step) return record

  const now = new Date()
  const today = now.toISOString().slice(0, 10)
  const timestamp = now.toISOString()
  const existingDoc = record.documents[step.docId]
  const nextDocuments = {
    ...record.documents,
    [step.docId]: {
      docId: step.docId,
      status: step.targetStatus,
      uploadDate: today,
      uploadBy: operator,
      reviewer: operator,
      reviewDate: today,
      approveDate: today,
      version: Math.max(existingDoc?.version || 0, 0) + 1,
      files: existingDoc?.files?.length
        ? existingDoc.files
        : [
            {
              fileId: `${record.serviceOrderId}-${step.docId}`,
              fileName: buildDocFileName(record, step.docId),
              fileSize: 'bridge-generated',
              fileType: 'pdf',
              uploadDate: today,
            },
          ],
      urgency: existingDoc?.urgency,
      remarks: step.message,
      history: [
        ...(existingDoc?.history || []),
        {
          action: step.message,
          operator,
          timestamp,
        },
      ],
    },
  }

  const progressRecord: ExportDocumentationBridgeOrder = {
    ...record,
    documents: nextDocuments,
  }

  const completedDocs =
    step.docId === 'D01' ? record.requiredDocs : Math.max(record.completedDocs, countCompletedDocs(progressRecord))
  const missingDocs = Math.max(record.requiredDocs - completedDocs, 0)
  const completionRate = step.docId === 'D01' ? 100 : Math.min(99, Math.round((completedDocs / record.requiredDocs) * 100))
  const nextStatus =
    step.docId === 'D01'
      ? 'completed'
      : completedDocs >= 6
        ? 'reviewing'
        : 'processing'

  const nextRecord: ExportDocumentationBridgeOrder = {
    ...progressRecord,
    status: nextStatus,
    completedDocs,
    missingDocs,
    completionRate,
    overdueItems: 0,
    alerts: buildNextAlerts(progressRecord, step.docId),
    lastUpdate: timestamp.slice(0, 16).replace('T', ' '),
    daysRemaining: step.docId === 'D01' ? 0 : Math.max(record.daysRemaining - 1, 0),
  }

  exportDocumentationBridgeService.update(record.id, nextRecord)
  return exportDocumentationBridgeService.list().find((item) => item.id === record.id) || nextRecord
}

export function syncExportDocumentationBridgeFromOperations(
  serviceOrderId: string,
  operator = 'Export bridge auto sync',
) {
  const record = exportDocumentationBridgeService.list().find((item) => item.serviceOrderId === serviceOrderId)
  if (!record) return null

  let nextRecord = finalizeShipmentMilestones(record, operator)
  nextRecord = finalizeFinanceMilestones(nextRecord, operator)
  nextRecord = normalizeBridgeRecord(nextRecord)

  exportDocumentationBridgeService.update(record.id, nextRecord)
  return exportDocumentationBridgeService.list().find((item) => item.id === record.id) || nextRecord
}
