export type ExportServiceOrderStatus =
  | 'draft'
  | 'documents_pending'
  | 'customer_confirmation_pending'
  | 'freight_quoting'
  | 'booking_pending'
  | 'execution_in_progress'
  | 'settlement_closed'
  | 'cancelled'

export interface ExportServiceOrderRecord {
  id: string
  customerId?: string | null
  customerName: string
  customerEmail?: string | null
  sourceMailThreadId?: string | null
  serviceOrderNumber: string
  supplierName?: string | null
  supplierTradeTerm?: 'FOB' | 'EXW' | 'FCA' | string | null
  goodsPaymentHandledByUs: boolean
  insuranceHandledByCustomer: boolean
  bookingRequired: boolean
  serviceStatus: ExportServiceOrderStatus
  cargoSummary?: string | null
  createdAt: string
  updatedAt: string
}

export type ExportHeaderDocumentType = 'proforma' | 'sales_contract' | 'other'
export type ExportHeaderDocumentStatus = 'draft' | 'sent_for_confirmation' | 'confirmed' | 'cancelled'

export interface ExportHeaderDocumentRecord {
  id: string
  serviceOrderId: string
  documentType: ExportHeaderDocumentType
  documentNumber?: string | null
  titleHeadingCompany: string
  customerConfirmedAt?: string | null
  status: ExportHeaderDocumentStatus
  notes?: string | null
  createdAt: string
  updatedAt: string
}

export type ExportServiceFeeStatus = 'draft' | 'pending_collection' | 'partially_paid' | 'paid' | 'cancelled'

export interface ExportServiceFeeRecord {
  id: string
  serviceOrderId: string
  amount: number
  currency: 'USD' | 'EUR' | 'CNY'
  receivableReference?: string | null
  invoiceStatus: 'not_required' | 'pending' | 'issued' | 'completed'
  paymentStatus: ExportServiceFeeStatus
  notes?: string | null
  createdAt: string
  updatedAt: string
}

export type ExportFreightSettlementStatus =
  | 'draft'
  | 'customer_pending'
  | 'customer_paid'
  | 'forwarder_pending'
  | 'forwarder_paid'
  | 'cancelled'

export interface ExportFreightSettlementRecord {
  id: string
  serviceOrderId: string
  providerName?: string | null
  payableReference?: string | null
  paymentRecordReference?: string | null
  collectAmount: number
  payableAmount: number
  currency: 'USD' | 'EUR' | 'CNY'
  settlementStatus: ExportFreightSettlementStatus
  notes?: string | null
  createdAt: string
  updatedAt: string
}

export interface ExportExecutionBridgeRecord {
  id: string
  serviceOrderId: string
  shipmentBridgeStatus: 'not_started' | 'ready_to_push' | 'linked'
  shipmentReference?: string | null
  docsBridgeStatus: 'not_started' | 'ready_to_push' | 'linked'
  docsReference?: string | null
  paymentBridgeStatus: 'not_started' | 'ready_to_push' | 'linked'
  paymentReference?: string | null
  payableBridgeStatus: 'not_started' | 'ready_to_push' | 'linked'
  payableReference?: string | null
  lastTouchedAt: string
  notes?: string | null
  createdAt: string
  updatedAt: string
}
