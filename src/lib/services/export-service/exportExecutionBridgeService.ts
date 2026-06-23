import { readExportServiceRecords, writeExportServiceRecords } from './exportServiceStorage'
import type { ExportExecutionBridgeRecord } from './exportServiceTypes'

const STORAGE_KEY = 'exportService.executionBridges.v1'

export const exportExecutionBridgeService = {
  list(): ExportExecutionBridgeRecord[] {
    return readExportServiceRecords<ExportExecutionBridgeRecord>(STORAGE_KEY)
  },

  getByServiceOrder(serviceOrderId: string): ExportExecutionBridgeRecord | null {
    return this.list().find((item) => item.serviceOrderId === serviceOrderId) || null
  },

  createForServiceOrder(serviceOrderId: string, notes?: string | null): ExportExecutionBridgeRecord {
    const current = this.getByServiceOrder(serviceOrderId)
    if (current) return current

    const now = new Date().toISOString()
    const next: ExportExecutionBridgeRecord = {
      id: `export-execution-bridge-${crypto.randomUUID()}`,
      serviceOrderId,
      shipmentBridgeStatus: 'ready_to_push',
      shipmentReference: null,
      docsBridgeStatus: 'ready_to_push',
      docsReference: null,
      paymentBridgeStatus: 'ready_to_push',
      paymentReference: null,
      payableBridgeStatus: 'ready_to_push',
      payableReference: null,
      lastTouchedAt: now,
      notes: notes || null,
      createdAt: now,
      updatedAt: now,
    }

    writeExportServiceRecords(STORAGE_KEY, [next, ...this.list()])
    return next
  },

  update(bridgeId: string, patch: Partial<ExportExecutionBridgeRecord>) {
    writeExportServiceRecords(
      STORAGE_KEY,
      this.list().map((item) =>
        item.id === bridgeId
          ? {
              ...item,
              ...patch,
              lastTouchedAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }
          : item,
      ),
    )
  },
}
