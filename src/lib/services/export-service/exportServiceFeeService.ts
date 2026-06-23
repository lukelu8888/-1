import { readExportServiceRecords, writeExportServiceRecords } from './exportServiceStorage'
import type { ExportServiceFeeRecord } from './exportServiceTypes'

const STORAGE_KEY = 'exportService.serviceFees.v1'

export const exportServiceFeeService = {
  listByServiceOrder(serviceOrderId: string): ExportServiceFeeRecord[] {
    return readExportServiceRecords<ExportServiceFeeRecord>(STORAGE_KEY).filter(
      (item) => item.serviceOrderId === serviceOrderId,
    )
  },

  create(input: Omit<ExportServiceFeeRecord, 'id' | 'createdAt' | 'updatedAt'>): ExportServiceFeeRecord {
    const next: ExportServiceFeeRecord = {
      ...input,
      id: `export-service-fee-${crypto.randomUUID()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    writeExportServiceRecords(STORAGE_KEY, [next, ...readExportServiceRecords<ExportServiceFeeRecord>(STORAGE_KEY)])
    return next
  },

  update(recordId: string, patch: Partial<ExportServiceFeeRecord>) {
    writeExportServiceRecords(
      STORAGE_KEY,
      readExportServiceRecords<ExportServiceFeeRecord>(STORAGE_KEY).map((item) =>
        item.id === recordId ? { ...item, ...patch, updatedAt: new Date().toISOString() } : item,
      ),
    )
  },
}
