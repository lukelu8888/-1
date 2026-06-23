import { readExportServiceRecords, writeExportServiceRecords } from './exportServiceStorage'
import type { ExportHeaderDocumentRecord } from './exportServiceTypes'

const STORAGE_KEY = 'exportService.headerDocuments.v1'

export const exportHeaderDocumentService = {
  listByServiceOrder(serviceOrderId: string): ExportHeaderDocumentRecord[] {
    return readExportServiceRecords<ExportHeaderDocumentRecord>(STORAGE_KEY).filter(
      (item) => item.serviceOrderId === serviceOrderId,
    )
  },

  create(input: Omit<ExportHeaderDocumentRecord, 'id' | 'createdAt' | 'updatedAt'>): ExportHeaderDocumentRecord {
    const next: ExportHeaderDocumentRecord = {
      ...input,
      id: `export-header-document-${crypto.randomUUID()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    writeExportServiceRecords(STORAGE_KEY, [next, ...readExportServiceRecords<ExportHeaderDocumentRecord>(STORAGE_KEY)])
    return next
  },

  update(documentId: string, patch: Partial<ExportHeaderDocumentRecord>) {
    writeExportServiceRecords(
      STORAGE_KEY,
      readExportServiceRecords<ExportHeaderDocumentRecord>(STORAGE_KEY).map((item) =>
        item.id === documentId ? { ...item, ...patch, updatedAt: new Date().toISOString() } : item,
      ),
    )
  },
}
