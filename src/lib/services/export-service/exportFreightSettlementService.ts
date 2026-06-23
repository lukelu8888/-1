import { readExportServiceRecords, writeExportServiceRecords } from './exportServiceStorage'
import type { ExportFreightSettlementRecord } from './exportServiceTypes'

const STORAGE_KEY = 'exportService.freightSettlements.v1'

export const exportFreightSettlementService = {
  listByServiceOrder(serviceOrderId: string): ExportFreightSettlementRecord[] {
    return readExportServiceRecords<ExportFreightSettlementRecord>(STORAGE_KEY).filter(
      (item) => item.serviceOrderId === serviceOrderId,
    )
  },

  create(input: Omit<ExportFreightSettlementRecord, 'id' | 'createdAt' | 'updatedAt'>): ExportFreightSettlementRecord {
    const next: ExportFreightSettlementRecord = {
      ...input,
      id: `export-freight-settlement-${crypto.randomUUID()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    writeExportServiceRecords(
      STORAGE_KEY,
      [next, ...readExportServiceRecords<ExportFreightSettlementRecord>(STORAGE_KEY)],
    )
    return next
  },

  update(recordId: string, patch: Partial<ExportFreightSettlementRecord>) {
    writeExportServiceRecords(
      STORAGE_KEY,
      readExportServiceRecords<ExportFreightSettlementRecord>(STORAGE_KEY).map((item) =>
        item.id === recordId ? { ...item, ...patch, updatedAt: new Date().toISOString() } : item,
      ),
    )
  },
}
