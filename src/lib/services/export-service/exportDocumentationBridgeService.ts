import { readExportServiceRecords, writeExportServiceRecords } from './exportServiceStorage'

export type ExportDocStatus =
  | 'pending'
  | 'auto_generated'
  | 'uploaded'
  | 'reviewing'
  | 'approved'
  | 'rejected'
  | 'na'
  | 'overdue'

export interface ExportDocumentationBridgeOrder {
  id: string
  serviceOrderId: string
  orderId: string
  contractNo: string
  customerName: string
  salesRep: string
  businessStage: string
  status: 'pending' | 'processing' | 'reviewing' | 'completed' | 'overdue'
  priority: 'critical' | 'urgent' | 'high' | 'normal' | 'low'
  completionRate: number
  requiredDocs: number
  completedDocs: number
  missingDocs: number
  overdueItems: number
  contractDate: string
  shipmentDate: string
  etd?: string
  eta?: string
  incoterm: 'EXW' | 'FCA' | 'FOB' | 'CFR' | 'CIF'
  paymentTerm: string
  destPort: string
  container: string
  totalValue: number
  currency: string
  documents: Record<string, {
    docId: string
    status: ExportDocStatus
    uploadDate?: string
    uploadBy?: string
    reviewer?: string
    reviewDate?: string
    approveDate?: string
    version: number
    files: Array<{
      fileId: string
      fileName: string
      fileSize: string
      fileType: string
      uploadDate: string
      storageUrl?: string
    }>
    urgency?: 'critical' | 'high' | 'medium' | 'low'
    remarks?: string
    history: Array<{
      action: string
      operator: string
      timestamp: string
      comment?: string
    }>
  }>
  alerts: Array<{
    alertType: 'missing' | 'overdue' | 'pending_approval' | 'dependency'
    docId: string
    message: string
    severity: 'critical' | 'high' | 'medium'
  }>
  lastUpdate: string
  daysRemaining: number
}

const STORAGE_KEY = 'exportService.documentationBridge.v1'

export const exportDocumentationBridgeService = {
  list(): ExportDocumentationBridgeOrder[] {
    return readExportServiceRecords<ExportDocumentationBridgeOrder>(STORAGE_KEY)
  },

  create(record: Omit<ExportDocumentationBridgeOrder, 'id'>): ExportDocumentationBridgeOrder {
    const next: ExportDocumentationBridgeOrder = {
      ...record,
      id: `export-doc-bridge-${crypto.randomUUID()}`,
    }
    writeExportServiceRecords(STORAGE_KEY, [next, ...this.list()])
    return next
  },

  update(recordId: string, patch: Partial<ExportDocumentationBridgeOrder>) {
    writeExportServiceRecords(
      STORAGE_KEY,
      this.list().map((item) => (item.id === recordId ? { ...item, ...patch } : item)),
    )
  },
}
