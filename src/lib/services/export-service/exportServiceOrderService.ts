import { readExportServiceRecords, writeExportServiceRecords } from './exportServiceStorage'
import type { ExportServiceOrderRecord } from './exportServiceTypes'

const STORAGE_KEY = 'exportService.orders.v1'

export const exportServiceOrderService = {
  list(): ExportServiceOrderRecord[] {
    return readExportServiceRecords<ExportServiceOrderRecord>(STORAGE_KEY)
  },

  create(input: Omit<ExportServiceOrderRecord, 'id' | 'createdAt' | 'updatedAt'>): ExportServiceOrderRecord {
    const next: ExportServiceOrderRecord = {
      ...input,
      id: `export-service-order-${crypto.randomUUID()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    writeExportServiceRecords(STORAGE_KEY, [next, ...readExportServiceRecords<ExportServiceOrderRecord>(STORAGE_KEY)])
    return next
  },

  update(serviceOrderId: string, patch: Partial<ExportServiceOrderRecord>) {
    writeExportServiceRecords(
      STORAGE_KEY,
      readExportServiceRecords<ExportServiceOrderRecord>(STORAGE_KEY).map((item) =>
        item.id === serviceOrderId ? { ...item, ...patch, updatedAt: new Date().toISOString() } : item,
      ),
    )
  },
}
