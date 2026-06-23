import { readExportServiceRecords, writeExportServiceRecords } from './exportServiceStorage'

export interface ExportPayableBridgeRecord {
  id: string
  serviceOrderId: string
  payableNo: string
  payeeType: 'supplier' | 'service_provider'
  payeeId: string
  payeeName: string
  serviceType?: string
  sourceType: 'purchase_order' | 'service_order' | 'shipment'
  sourceNo: string
  totalAmount: number
  paidAmount: number
  unpaidAmount: number
  currency: 'USD' | 'EUR' | 'CNY'
  status: 'unpaid' | 'partial' | 'paid'
  dueDate: string
  createdDate: string
  lastPaymentDate?: string
  region: 'NA' | 'SA' | 'EA'
  notes?: string
  paymentCount: number
}

const STORAGE_KEY = 'exportService.payableBridge.v1'

export const exportPayableBridgeService = {
  list(): ExportPayableBridgeRecord[] {
    return readExportServiceRecords<ExportPayableBridgeRecord>(STORAGE_KEY)
  },

  create(record: Omit<ExportPayableBridgeRecord, 'id'>): ExportPayableBridgeRecord {
    const next: ExportPayableBridgeRecord = {
      ...record,
      id: `export-payable-bridge-${crypto.randomUUID()}`,
    }
    writeExportServiceRecords(STORAGE_KEY, [next, ...this.list()])
    return next
  },

  update(recordId: string, patch: Partial<ExportPayableBridgeRecord>) {
    writeExportServiceRecords(
      STORAGE_KEY,
      this.list().map((item) => (item.id === recordId ? { ...item, ...patch } : item)),
    )
  },
}
