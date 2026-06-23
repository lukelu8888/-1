import { readExportServiceRecords, writeExportServiceRecords } from './exportServiceStorage'

export interface ExportPaymentRecordBridgeRecord {
  id: string
  serviceOrderId: string
  paymentNo: string
  payableNo: string
  payableId: string
  payeeType: 'supplier' | 'service_provider'
  payeeId: string
  payeeName: string
  serviceType?: string
  amount: number
  currency: 'USD' | 'EUR' | 'CNY'
  paymentMethod: 'T/T' | 'L/C' | 'Western Union' | 'PayPal' | 'Alipay' | 'Cash'
  bankName?: string
  accountNumber?: string
  transactionNo?: string
  paymentDate: string
  createdDate: string
  status: 'pending' | 'completed' | 'failed'
  region: 'NA' | 'SA' | 'EA'
  notes?: string
  attachments?: string[]
  operator: string
}

const STORAGE_KEY = 'exportService.paymentRecordBridge.v1'

export const exportPaymentRecordBridgeService = {
  list(): ExportPaymentRecordBridgeRecord[] {
    return readExportServiceRecords<ExportPaymentRecordBridgeRecord>(STORAGE_KEY)
  },

  create(record: Omit<ExportPaymentRecordBridgeRecord, 'id'>): ExportPaymentRecordBridgeRecord {
    const next: ExportPaymentRecordBridgeRecord = {
      ...record,
      id: `export-payment-bridge-${crypto.randomUUID()}`,
    }
    writeExportServiceRecords(STORAGE_KEY, [next, ...this.list()])
    return next
  },

  update(recordId: string, patch: Partial<ExportPaymentRecordBridgeRecord>) {
    writeExportServiceRecords(
      STORAGE_KEY,
      this.list().map((item) => (item.id === recordId ? { ...item, ...patch } : item)),
    )
  },
}
