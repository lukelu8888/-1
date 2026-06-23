import { readExportServiceRecords, writeExportServiceRecords } from './exportServiceStorage'

export interface ExportShipmentBridgeRecord {
  id: string
  serviceOrderId: string
  contractNumber: string
  customerName: string
  amount: number
  currency: string
  portOfLoading: string
  portOfDischarge: string
  logistics: {
    forwarder?: {
      company: string
      contact: string
      phone: string
      email: string
      freightQuote: number
    }
    booking?: {
      bookingDate: string
      shippingLine: string
      vessel: string
      voyage: string
      containerType: string
      containerQty: number
      etd: string
      eta: string
    }
    customs?: {
      broker: string
      declarationNo: string
      declarationDate: string
      status: 'pending' | 'cleared'
    }
  }
  documents: {
    commercialInvoice?: {
      documentNumber: string
      issueDate: string
      status: 'draft' | 'issued' | 'paid'
      pdfUrl?: string
    }
    packingList?: {
      documentNumber: string
      issueDate: string
      status: 'draft' | 'completed'
      pdfUrl?: string
    }
    billOfLading?: {
      blNumber: string
      type: 'original' | 'seaway'
      issueDate: string
      status: 'pending' | 'issued'
      pdfUrl?: string
    }
  }
  tracking: {
    currentStatus: 'preparing' | 'shipped' | 'in_transit' | 'arrived' | 'cleared' | 'delivered'
    actualDepartureDate?: string
    actualArrivalDate?: string
    timeline: Array<{
      date: string
      status: string
      location: string
      note: string
    }>
  }
  delivery?: {
    customsClearanceDate?: string
    pickupDate?: string
    customerConfirmation?: boolean
  }
}

const STORAGE_KEY = 'exportService.shipmentBridge.v1'

export const exportShipmentBridgeService = {
  list(): ExportShipmentBridgeRecord[] {
    return readExportServiceRecords<ExportShipmentBridgeRecord>(STORAGE_KEY)
  },

  create(record: Omit<ExportShipmentBridgeRecord, 'id'>): ExportShipmentBridgeRecord {
    const next: ExportShipmentBridgeRecord = {
      ...record,
      id: `export-shipment-bridge-${crypto.randomUUID()}`,
    }
    writeExportServiceRecords(STORAGE_KEY, [next, ...this.list()])
    return next
  },

  update(recordId: string, patch: Partial<ExportShipmentBridgeRecord>) {
    writeExportServiceRecords(
      STORAGE_KEY,
      this.list().map((item) => (item.id === recordId ? { ...item, ...patch } : item)),
    )
  },
}
