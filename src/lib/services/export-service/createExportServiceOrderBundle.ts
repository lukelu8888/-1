import { exportDocumentationBridgeService } from './exportDocumentationBridgeService'
import { exportExecutionBridgeService } from './exportExecutionBridgeService'
import { exportFreightSettlementService } from './exportFreightSettlementService'
import { exportHeaderDocumentService } from './exportHeaderDocumentService'
import { exportPayableBridgeService } from './exportPayableBridgeService'
import { exportPaymentRecordBridgeService } from './exportPaymentRecordBridgeService'
import { exportShipmentBridgeService } from './exportShipmentBridgeService'
import { exportServiceFeeService } from './exportServiceFeeService'
import { exportServiceOrderService } from './exportServiceOrderService'
import { syncExportExecutionBridgeState } from './syncExportExecutionBridgeState'
import type { ExportServiceOrderRecord, ExportServiceOrderStatus } from './exportServiceTypes'

interface CreateExportServiceOrderBundleInput {
  customerId?: string | null
  customerName: string
  customerEmail?: string | null
  sourceMailThreadId?: string | null
  supplierName?: string | null
  supplierTradeTerm?: 'FOB' | 'EXW' | 'FCA' | string | null
  goodsPaymentHandledByUs?: boolean
  insuranceHandledByCustomer?: boolean
  bookingRequired?: boolean
  serviceStatus?: ExportServiceOrderStatus
  cargoSummary?: string | null
  titleHeadingCompany?: string
  documentType?: 'proforma' | 'sales_contract' | 'other'
  serviceFeeCurrency?: 'USD' | 'EUR' | 'CNY'
  freightCurrency?: 'USD' | 'EUR' | 'CNY'
  createdByLabel?: string
  region?: 'NA' | 'SA' | 'EA'
}

function buildNextServiceOrderNumber(): string {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  return `ES-${today}-${exportServiceOrderService.list().length + 1}`
}

export function createExportServiceOrderBundle(
  input: CreateExportServiceOrderBundleInput,
): ExportServiceOrderRecord {
  const now = new Date().toISOString()
  const today = now.slice(0, 10)
  const region = input.region || 'NA'
  const serviceOrderNumber = buildNextServiceOrderNumber()
  const serviceOrder = exportServiceOrderService.create({
    customerId: input.customerId ?? null,
    customerName: input.customerName.trim(),
    customerEmail: input.customerEmail?.trim() || null,
    sourceMailThreadId: input.sourceMailThreadId ?? null,
    serviceOrderNumber,
    supplierName: input.supplierName?.trim() || null,
    supplierTradeTerm: input.supplierTradeTerm || 'FOB',
    goodsPaymentHandledByUs: input.goodsPaymentHandledByUs ?? false,
    insuranceHandledByCustomer: input.insuranceHandledByCustomer ?? true,
    bookingRequired: input.bookingRequired ?? true,
    serviceStatus: input.serviceStatus || 'draft',
    cargoSummary: input.cargoSummary?.trim() || null,
  })

  exportHeaderDocumentService.create({
    serviceOrderId: serviceOrder.id,
    documentType: input.documentType || 'proforma',
    documentNumber: `${serviceOrderNumber}-PI`,
    titleHeadingCompany: input.titleHeadingCompany || 'Our Company',
    customerConfirmedAt: null,
    status: 'draft',
    notes: input.createdByLabel ? `Created by ${input.createdByLabel}` : 'Created by export service bundle',
  })

  exportServiceFeeService.create({
    serviceOrderId: serviceOrder.id,
    amount: 0,
    currency: input.serviceFeeCurrency || 'USD',
    receivableReference: `ES-FEE-${serviceOrderNumber}`,
    invoiceStatus: 'pending',
    paymentStatus: 'draft',
    notes: 'Initialize service fee record',
  })

  const freightSettlement = exportFreightSettlementService.create({
    serviceOrderId: serviceOrder.id,
    providerName: null,
    payableReference: `ES-PAYABLE-${serviceOrderNumber}`,
    paymentRecordReference: `ES-PAYMENT-${serviceOrderNumber}`,
    collectAmount: 0,
    payableAmount: 0,
    currency: input.freightCurrency || 'USD',
    settlementStatus: 'draft',
    notes: 'Initialize freight settlement record',
  })

  const payableRecord = exportPayableBridgeService.create({
    serviceOrderId: serviceOrder.id,
    payableNo: freightSettlement.payableReference || `ES-PAYABLE-${serviceOrderNumber}`,
    payeeType: 'service_provider',
    payeeId: serviceOrder.id,
    payeeName: freightSettlement.providerName || '待指定货代',
    serviceType: 'forwarder',
    sourceType: 'service_order',
    sourceNo: serviceOrderNumber,
    totalAmount: freightSettlement.payableAmount,
    paidAmount: 0,
    unpaidAmount: freightSettlement.payableAmount,
    currency: freightSettlement.currency,
    status: 'unpaid',
    dueDate: now.slice(0, 10),
    createdDate: now.slice(0, 10),
    region,
    notes: 'Generated from export service freight settlement bridge',
    paymentCount: 0,
  })

  exportPaymentRecordBridgeService.create({
    serviceOrderId: serviceOrder.id,
    paymentNo: freightSettlement.paymentRecordReference || `ES-PAYMENT-${serviceOrderNumber}`,
    payableNo: payableRecord.payableNo,
    payableId: payableRecord.id,
    payeeType: 'service_provider',
    payeeId: payableRecord.payeeId,
    payeeName: payableRecord.payeeName,
    serviceType: payableRecord.serviceType,
    amount: freightSettlement.payableAmount,
    currency: freightSettlement.currency,
    paymentMethod: 'T/T',
    bankName: undefined,
    accountNumber: undefined,
    transactionNo: undefined,
    paymentDate: now.slice(0, 10),
    createdDate: now.slice(0, 10),
    status: 'pending',
    region,
    notes: 'Generated from export service payment bridge',
    operator: input.createdByLabel || 'export service bundle',
  })

  const shipmentReference = `ES-SHIP-${serviceOrderNumber}`
  const docsReference = `ES-DOC-${serviceOrderNumber}`

  exportShipmentBridgeService.create({
    serviceOrderId: serviceOrder.id,
    contractNumber: shipmentReference,
    customerName: serviceOrder.customerName,
    amount: 0,
    currency: input.freightCurrency || 'USD',
    portOfLoading: serviceOrder.supplierTradeTerm === 'EXW' ? 'FACTORY' : 'NINGBO',
    portOfDischarge: 'TBD',
    logistics: {
      forwarder: {
        company: freightSettlement.providerName || '待指定货代',
        contact: '待补充',
        phone: '待补充',
        email: 'pending@forwarder.local',
        freightQuote: freightSettlement.payableAmount,
      },
      booking: serviceOrder.bookingRequired
        ? {
            bookingDate: today,
            shippingLine: '待确认',
            vessel: '待确认',
            voyage: '待确认',
            containerType: '40HQ',
            containerQty: 1,
            etd: today,
            eta: today,
          }
        : undefined,
      customs: {
        broker: '待指定报关行',
        declarationNo: '待生成',
        declarationDate: today,
        status: 'pending',
      },
    },
    documents: {
      commercialInvoice: {
        documentNumber: `${serviceOrderNumber}-PI`,
        issueDate: today,
        status: 'draft',
        pdfUrl: '#',
      },
      packingList: {
        documentNumber: `${serviceOrderNumber}-PL`,
        issueDate: today,
        status: 'draft',
        pdfUrl: '#',
      },
      billOfLading: {
        blNumber: `${serviceOrderNumber}-BL`,
        type: 'original',
        issueDate: today,
        status: 'pending',
        pdfUrl: '#',
      },
    },
    tracking: {
      currentStatus: 'preparing',
      timeline: [
        {
          date: today,
          status: '服务委托已转入发货桥接',
          location: 'ERP',
          note: '等待正式订舱与出运执行',
        },
      ],
    },
    delivery: {
      customerConfirmation: false,
    },
  })

  exportDocumentationBridgeService.create({
    serviceOrderId: serviceOrder.id,
    orderId: docsReference,
    contractNo: serviceOrderNumber,
    customerName: serviceOrder.customerName,
    salesRep: input.createdByLabel || 'Sales_Rep',
    businessStage: 'documentation',
    status: 'processing',
    priority: 'high',
    completionRate: 23,
    requiredDocs: 13,
    completedDocs: 3,
    missingDocs: 10,
    overdueItems: 0,
    contractDate: today,
    shipmentDate: today,
    etd: today,
    eta: today,
    incoterm: (serviceOrder.supplierTradeTerm as 'EXW' | 'FCA' | 'FOB' | 'CFR' | 'CIF') || 'FOB',
    paymentTerm: 'Service flow pending',
    destPort: 'TBD',
    container: serviceOrder.bookingRequired ? '40HQ x1' : 'TBD',
    totalValue: 0,
    currency: input.freightCurrency || 'USD',
    documents: {
      D02: {
        docId: 'D02',
        status: 'approved',
        uploadDate: today,
        uploadBy: input.createdByLabel || 'system',
        reviewer: 'Sales',
        reviewDate: today,
        approveDate: today,
        version: 1,
        files: [
          {
            fileId: `${serviceOrder.id}-D02`,
            fileName: `${serviceOrderNumber}-PI.pdf`,
            fileSize: 'pending',
            fileType: 'pdf',
            uploadDate: today,
          },
        ],
        history: [
          {
            action: '初始化借抬头文件',
            operator: input.createdByLabel || 'system',
            timestamp: now,
          },
        ],
      },
      D05: {
        docId: 'D05',
        status: 'pending',
        version: 0,
        files: [],
        urgency: 'high',
        history: [],
      },
      D09: {
        docId: 'D09',
        status: serviceOrder.bookingRequired ? 'pending' : 'na',
        version: 0,
        files: [],
        history: [],
      },
      D10: {
        docId: 'D10',
        status: ['FOB', 'EXW', 'FCA'].includes(String(serviceOrder.supplierTradeTerm || 'FOB')) ? 'auto_generated' : 'na',
        uploadDate: today,
        uploadBy: 'system',
        version: 1,
        files: [],
        history: [],
      },
    },
    alerts: [
      {
        alertType: 'missing',
        docId: 'D05',
        message: '借抬头服务单已进入 Docs 桥接，待补报关单证',
        severity: 'high',
      },
    ],
    lastUpdate: now.slice(0, 16).replace('T', ' '),
    daysRemaining: 7,
  })

  exportExecutionBridgeService.createForServiceOrder(
    serviceOrder.id,
    'Bridge placeholders initialized for Shipment / Docs / Payment / Payable reuse',
  )

  const executionBridge = exportExecutionBridgeService.getByServiceOrder(serviceOrder.id)
  if (executionBridge) {
    exportExecutionBridgeService.update(executionBridge.id, {
      paymentBridgeStatus: 'linked',
      paymentReference: freightSettlement.paymentRecordReference || `ES-PAYMENT-${serviceOrderNumber}`,
      payableBridgeStatus: 'linked',
      payableReference: freightSettlement.payableReference || `ES-PAYABLE-${serviceOrderNumber}`,
      shipmentBridgeStatus: 'linked',
      shipmentReference,
      docsBridgeStatus: 'linked',
      docsReference,
    })
  }

  syncExportExecutionBridgeState(serviceOrder.id)

  return serviceOrder
}
